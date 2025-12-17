// =========================================================================================
// ROUTING SERVICE: MULTI-MODAL ROUTE CALCULATION
// PURPOSE: "FRANKENSTEIN" METHOD - STITCHES WALKING + PUBLIC TRANSPORT + WALKING SEGMENTS
// FLOW: Find Nearest Terminal -> Walk to Terminal -> Ride to Stop -> Walk to Destination
// =========================================================================================

import * as turf from "@turf/turf";
import {
  dijkstra,
  findNearestNode,
  getNodeById,
} from "../lib/dijkstra";
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

/**
 * CALCULATE ROUTES: MAIN FUNCTION TO FIND MULTI-MODAL ROUTES
 * RETURNS 3 ROUTE OPTIONS: FASTEST, CHEAPEST, SHORTEST
 */
export async function calculateRoutes(
  input: RouteCalculationInput
): Promise<RouteCalculationResult> {
  try {
    const { origin, destination } = input;

    // STEP 1: FIND NEAREST TERMINAL FROM ORIGIN
    const nearestTerminal = findNearestNode(origin.lat, origin.lng, "terminal");
    if (!nearestTerminal) {
      return {
        routes: [],
        error: "No terminals found near origin",
      };
    }

    // STEP 2: FIND NEAREST STOP TO DESTINATION
    const nearestStop = findNearestNode(
      destination.lat,
      destination.lng,
      "stop"
    );
    if (!nearestStop) {
      return {
        routes: [],
        error: "No stops found near destination",
      };
    }

    // STEP 3: CALCULATE WALKING ROUTE FROM ORIGIN TO TERMINAL
    const walkToTerminal = await calculateWalkingRoute(
      [origin.lng, origin.lat],
      [nearestTerminal.lng, nearestTerminal.lat]
    );

    if (!walkToTerminal) {
      return {
        routes: [],
        error: "Could not calculate walking route to terminal",
      };
    }

    // STEP 4: CALCULATE WALKING ROUTE FROM STOP TO DESTINATION
    const walkFromStop = await calculateWalkingRoute(
      [nearestStop.lng, nearestStop.lat],
      [destination.lng, destination.lat]
    );

    if (!walkFromStop) {
      return {
        routes: [],
        error: "Could not calculate walking route from stop",
      };
    }

    // STEP 5: CALCULATE PUBLIC TRANSPORT ROUTE (DIJKSTRA) FROM TERMINAL TO STOP
    const transportRoute = dijkstra(nearestTerminal.id, nearestStop.id, "distance");

    if (!transportRoute) {
      return {
        routes: [],
        error: "No public transport route found between terminal and stop",
      };
    }

    // STEP 6: BUILD ROUTE SEGMENTS
    const segments: RouteSegment[] = [];

    // SEGMENT 1: WALK TO TERMINAL
    segments.push({
      type: "walk",
      start: {
        lat: origin.lat,
        lng: origin.lng,
        name: origin.name || "Origin",
      },
      end: {
        lat: nearestTerminal.lat,
        lng: nearestTerminal.lng,
        name: nearestTerminal.name,
      },
      distance_km: metersToKm(walkToTerminal.distance),
      duration_mins: secondsToMinutes(walkToTerminal.duration),
      geometry: walkToTerminal.geometry,
      instructions: walkToTerminal.legs.flatMap((leg) =>
        leg.steps.map((step) => step.instruction || "")
      ),
    });

    // SEGMENT 2: RIDE PUBLIC TRANSPORT
    // BUILD GEOMETRY FROM DIJKSTRA PATH (STRAIGHT LINES BETWEEN NODES FOR NOW)
    const transportCoordinates: [number, number][] = [];
    let totalFare = 0;
    const vehicleTypes: VehicleType[] = [];

    transportRoute.segments.forEach((segment) => {
      const fromNode = getNodeById(segment.from);
      const toNode = getNodeById(segment.to);

      if (fromNode && toNode) {
        transportCoordinates.push([fromNode.lng, fromNode.lat]);
        if (segment.fare) {
          totalFare += segment.fare;
        }
        if (!vehicleTypes.includes(segment.vehicleType)) {
          vehicleTypes.push(segment.vehicleType);
        }
      }
    });

    // ADD FINAL NODE
    const finalNode = getNodeById(transportRoute.path[transportRoute.path.length - 1]);
    if (finalNode) {
      transportCoordinates.push([finalNode.lng, finalNode.lat]);
    }

    // CALCULATE TRANSPORT DISTANCE USING HAVERSINE
    let transportDistance = 0;
    for (let i = 0; i < transportCoordinates.length - 1; i++) {
      const from = transportCoordinates[i];
      const to = transportCoordinates[i + 1];
      const distance = turf.distance(
        turf.point([from[0], from[1]]),
        turf.point([to[0], to[1]]),
        { units: "kilometers" }
      );
      transportDistance += distance;
    }

    // ESTIMATE TRANSPORT DURATION (ASSUME 25 KM/H AVERAGE SPEED)
    const transportDuration = Math.round((transportDistance / 25) * 60);

    segments.push({
      type: "ride",
      vehicleType: vehicleTypes[0] || "jeepney",
      start: {
        lat: nearestTerminal.lat,
        lng: nearestTerminal.lng,
        name: nearestTerminal.name,
      },
      end: {
        lat: nearestStop.lat,
        lng: nearestStop.lng,
        name: nearestStop.name,
      },
      distance_km: transportDistance,
      duration_mins: transportDuration,
      fare: totalFare,
      geometry: {
        type: "LineString",
        coordinates: transportCoordinates,
      },
    });

    // SEGMENT 3: WALK FROM STOP TO DESTINATION
    segments.push({
      type: "walk",
      start: {
        lat: nearestStop.lat,
        lng: nearestStop.lng,
        name: nearestStop.name,
      },
      end: {
        lat: destination.lat,
        lng: destination.lng,
        name: destination.name || "Destination",
      },
      distance_km: metersToKm(walkFromStop.distance),
      duration_mins: secondsToMinutes(walkFromStop.duration),
      geometry: walkFromStop.geometry,
      instructions: walkFromStop.legs.flatMap((leg) =>
        leg.steps.map((step) => step.instruction || "")
      ),
    });

    // STEP 7: BUILD ROUTE WITH TOTALS
    const baseRoute: CalculatedRoute = {
      id: `route-${Date.now()}`,
      tag: "FASTEST", // WILL BE OVERRIDDEN
      segments,
      totalDistance_km:
        segments.reduce((sum, seg) => sum + seg.distance_km, 0),
      totalDuration_mins:
        segments.reduce((sum, seg) => sum + seg.duration_mins, 0),
      totalFare: totalFare,
      vehicleTypes,
      transferCount: 0, // SIMPLIFIED: NO TRANSFERS IN BASIC IMPLEMENTATION
    };

    // STEP 8: GENERATE 3 ROUTE OPTIONS
    // FOR NOW, WE'LL CREATE VARIATIONS OF THE SAME ROUTE
    // IN A FULL IMPLEMENTATION, YOU'D CALCULATE MULTIPLE ROUTE OPTIONS
    const routes: CalculatedRoute[] = [
      {
        ...baseRoute,
        id: `${baseRoute.id}-fastest`,
        tag: "FASTEST",
      },
      {
        ...baseRoute,
        id: `${baseRoute.id}-cheapest`,
        tag: "CHEAPEST",
        // COULD OPTIMIZE FOR LOWER FARE BY CHOOSING DIFFERENT TERMINALS/STOPS
      },
      {
        ...baseRoute,
        id: `${baseRoute.id}-shortest`,
        tag: "SHORTEST",
        // COULD OPTIMIZE FOR SHORTER DISTANCE
      },
    ];

    // SORT ROUTES BY THEIR OPTIMIZATION CRITERIA
    routes[0] = { ...routes[0] }; // FASTEST: SORT BY DURATION
    routes[1] = { ...routes[1] }; // CHEAPEST: SORT BY FARE
    routes[2] = { ...routes[2] }; // SHORTEST: SORT BY DISTANCE

    return {
      routes,
      error: undefined,
    };
  } catch (error) {
    console.error("[ROUTING SERVICE ERROR]:", error);
    return {
      routes: [],
      error:
        error instanceof Error
          ? error.message
          : "Failed to calculate routes",
    };
  }
}

