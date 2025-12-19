import * as turf from "@turf/turf";
import { buildTransitGraph } from "../lib/graph";
import { dijkstra, findNearestGraphNode } from "../lib/dijkstra";
import {
  calculateWalkingRoute,
  metersToKm,
  secondsToMinutes,
} from "./mapboxService";
import type {
  RouteCalculationInput,
  RouteCalculationResult,
  CalculatedRoute,
  RouteSegment,
} from "../types/route";
import type { VehicleType } from "../types/types";

export async function calculateRoutes(
  input: RouteCalculationInput
): Promise<RouteCalculationResult> {
  try {
    const { origin, destination } = input;
    const originPt = turf.point([origin.lng, origin.lat]);
    const destPt = turf.point([destination.lng, destination.lat]);

    // --- STEP 1: FETCH NETWORK DATA ---
    const graph = await buildTransitGraph();

    // --- STEP 2: TRICYCLE ZONE LOGIC ---
    // Fix: Cast z.polygon to any to satisfy Turf types, disabling lint for this specific line
    const originZone = graph.tricycleZones.find((z) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      turf.booleanPointInPolygon(originPt, z.polygon as any)
    );
    const destZone = graph.tricycleZones.find((z) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      turf.booleanPointInPolygon(destPt, z.polygon as any)
    );

    if (originZone && destZone && originZone.id === destZone.id) {
      // SCENARIO: TRICYCLE RIDE
      const directDist = turf.distance(originPt, destPt, {
        units: "kilometers",
      });
      // Tricycle routing follows roads (driving), but for MVP we use direct line + road factor
      const roadDistance = directDist * 1.3;
      const estTime = (roadDistance / 15) * 60; // 15km/h avg
      const estFare = originZone.base_fare + roadDistance * originZone.per_km;

      const trikeRoute: CalculatedRoute = {
        id: `route-trike-${Date.now()}`,
        tag: "FASTEST", // Tricycles are usually fastest in-zone
        totalDistance_km: roadDistance,
        totalDuration_mins: Math.round(estTime),
        totalFare: Math.ceil(estFare),
        vehicleTypes: ["tricycle"],
        transferCount: 0,
        segments: [
          {
            type: "ride",
            vehicleType: "tricycle",
            start: {
              lat: origin.lat,
              lng: origin.lng,
              name: origin.name || "Origin",
            },
            end: {
              lat: destination.lat,
              lng: destination.lng,
              name: destination.name || "Destination",
            },
            distance_km: roadDistance,
            duration_mins: Math.round(estTime),
            fare: Math.ceil(estFare),
            geometry: {
              type: "LineString",
              coordinates: [
                [origin.lng, origin.lat],
                [destination.lng, destination.lat],
              ],
            },
            instructions: [`Ride tricycle in ${originZone.name} zone`],
          },
        ],
      };

      return { routes: [trikeRoute] };
    }

    // --- STEP 3: HYBRID ROUTING (WALK + TRANSIT) ---
    const startNode = findNearestGraphNode(origin.lat, origin.lng, graph.nodes);
    const endNode = findNearestGraphNode(
      destination.lat,
      destination.lng,
      graph.nodes
    );

    if (!startNode || !endNode) {
      return { routes: [], error: "No transit stops found nearby." };
    }

    // B. Calculate First Mile (Walk to Start) & Last Mile (Walk to Dest)
    const [walkToStart, walkFromEnd] = await Promise.all([
      calculateWalkingRoute(
        [origin.lng, origin.lat],
        [startNode.lng, startNode.lat]
      ),
      calculateWalkingRoute(
        [endNode.lng, endNode.lat],
        [destination.lng, destination.lat]
      ),
    ]);

    if (!walkToStart || !walkFromEnd) {
      return { routes: [], error: "Cannot find walking path to transit." };
    }

    // C. Run Dijkstra for 3 Scenarios
    const scenarios = [
      { tag: "FASTEST", criteria: "time" },
      { tag: "CHEAPEST", criteria: "fare" },
      { tag: "SHORTEST", criteria: "distance" },
    ] as const;

    const calculatedRoutes: CalculatedRoute[] = [];

    for (const scen of scenarios) {
      const result = dijkstra(graph, startNode.id, endNode.id, scen.criteria);

      if (result) {
        // D. Stitch Segments together
        const fullSegments: RouteSegment[] = [];

        // 1. Walk to Station
        fullSegments.push({
          type: "walk",
          start: {
            lat: origin.lat,
            lng: origin.lng,
            name: origin.name || "Origin",
          },
          end: { lat: startNode.lat, lng: startNode.lng, name: startNode.name },
          distance_km: metersToKm(walkToStart.distance),
          duration_mins: secondsToMinutes(walkToStart.duration),
          geometry: walkToStart.geometry,
        });

        // 2. Transit Path (Convert Edges to Segments)
        result.segments.forEach((seg) => {
          const sNode = graph.nodes.find((n) => n.id === seg.from);
          const eNode = graph.nodes.find((n) => n.id === seg.to);

          if (sNode && eNode) {
            const vType =
              seg.vehicleType === "walk"
                ? "walk"
                : (seg.vehicleType as VehicleType);

            fullSegments.push({
              type: seg.vehicleType === "walk" ? "walk" : "ride",
              vehicleType: vType === "walk" ? undefined : vType,
              start: { lat: sNode.lat, lng: sNode.lng, name: sNode.name },
              end: { lat: eNode.lat, lng: eNode.lng, name: eNode.name },
              distance_km: seg.weight_distance,
              duration_mins: seg.weight_time,
              fare: seg.weight_fare,
              // Straight line geometry for pilot
              geometry: {
                type: "LineString",
                coordinates: [
                  [sNode.lng, sNode.lat],
                  [eNode.lng, eNode.lat],
                ],
              },
            });
          }
        });

        // 3. Walk to Dest
        fullSegments.push({
          type: "walk",
          start: { lat: endNode.lat, lng: endNode.lng, name: endNode.name },
          end: {
            lat: destination.lat,
            lng: destination.lng,
            name: destination.name || "Destination",
          },
          distance_km: metersToKm(walkFromEnd.distance),
          duration_mins: secondsToMinutes(walkFromEnd.duration),
          geometry: walkFromEnd.geometry,
        });

        // E. Create Route Object
        calculatedRoutes.push({
          id: `route-${scen.tag}-${Date.now()}`,
          tag: scen.tag,
          segments: fullSegments,
          totalDistance_km:
            metersToKm(walkToStart.distance + walkFromEnd.distance) +
            result.totalValues.distance,
          totalDuration_mins:
            secondsToMinutes(walkToStart.duration + walkFromEnd.duration) +
            result.totalValues.time,
          totalFare: result.totalValues.fare,
          vehicleTypes: [
            ...new Set(
              result.segments
                .map((s) => s.vehicleType)
                .filter((t): t is VehicleType => t !== "walk")
            ),
          ],
          transferCount: 0,
        });
      }
    }

    // Filter duplicates
    const uniqueRoutes = calculatedRoutes.filter(
      (v, i, a) =>
        a.findIndex(
          (v2) =>
            v2.totalDuration_mins === v.totalDuration_mins &&
            v2.totalFare === v.totalFare
        ) === i
    );

    return { routes: uniqueRoutes };
  } catch (error) {
    console.error("[ROUTING ERROR]:", error);
    return { routes: [], error: "Calculation failed." };
  }
}
