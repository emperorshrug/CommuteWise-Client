// src/lib/graph.ts
import { supabase } from "./supabase";
import * as turf from "@turf/turf";
import type { VehicleType } from "../types/types";

// --- TYPES ---
export interface GraphNode {
  id: string;
  type: "terminal" | "stop" | "virtual_entry" | "virtual_exit";
  lat: number;
  lng: number;
  name: string;
  vehicleTypes: VehicleType[];
}

export interface GraphEdge {
  from: string;
  to: string;
  weight_distance: number; // km
  weight_time: number; // minutes
  weight_fare: number; // PHP
  vehicleType: VehicleType | "walk";
  geometry?: Record<string, unknown>; // GeoJSON LineString
}

export interface TricycleZone {
  id: string;
  name: string;
  base_fare: number;
  per_km: number;
  polygon: Record<string, unknown>; // GeoJSON Polygon
}

export interface TransitGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  tricycleZones: TricycleZone[];
}

// Define explicit interfaces for Supabase data
interface DBRoute {
  vehicle_type: VehicleType;
  base_fare: number;
  fare_per_km: number;
  stops: DBStop[];
}

interface DBStop {
  id: string;
  lat: number;
  lng: number;
  name: string;
  is_terminal: boolean;
  vehicle_types: VehicleType[];
  order_index?: number;
}

interface DBZone {
  id: string;
  name: string;
  base_fare: number;
  per_km: number;
  geometry: Record<string, unknown>;
}

// --- CONSTANTS ---
const AVERAGE_SPEEDS_KMH: Record<string, number> = {
  jeepney: 18,
  bus: 25,
  "e-jeep": 20,
  tricycle: 15,
  walk: 5,
};

// --- DATA FETCHING & GRAPH BUILDING ---
export async function buildTransitGraph(): Promise<TransitGraph> {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const tricycleZones: TricycleZone[] = [];

  try {
    // 1. FETCH DATA FROM SUPABASE
    const [routesRes, stopsRes, zonesRes] = await Promise.all([
      supabase.from("routes").select("*, stops(*)"),
      supabase.from("stops").select("*"),
      supabase.from("tricycle_zones").select("*"),
    ]);

    if (routesRes.error) throw routesRes.error;
    if (zonesRes.error) throw zonesRes.error;

    // 2. PROCESS STOPS INTO NODES
    const stopData = (stopsRes.data || []) as DBStop[];

    stopData.forEach((stop) => {
      const node: GraphNode = {
        id: String(stop.id),
        type: stop.is_terminal ? "terminal" : "stop",
        lat: stop.lat,
        lng: stop.lng,
        name: stop.name,
        vehicleTypes: stop.vehicle_types || [],
      };
      nodes.push(node);
    });

    // 3. PROCESS TRICYCLE ZONES
    const zoneData = (zonesRes.data || []) as DBZone[];
    zoneData.forEach((zone) => {
      tricycleZones.push({
        id: String(zone.id),
        name: zone.name,
        base_fare: zone.base_fare || 15,
        per_km: zone.per_km || 5,
        polygon: zone.geometry,
      });
    });

    // 4. BUILD EDGES FROM ROUTES
    const routeData = (routesRes.data || []) as DBRoute[];

    routeData.forEach((route) => {
      if (!route.stops) return;

      // Sort stops safely
      const sortedStops = route.stops.sort(
        (a, b) => (a.order_index || 0) - (b.order_index || 0)
      );

      for (let i = 0; i < sortedStops.length - 1; i++) {
        const current = sortedStops[i];
        const next = sortedStops[i + 1];

        // Calculate Segment Distance
        const fromPt = turf.point([current.lng, current.lat]);
        const toPt = turf.point([next.lng, next.lat]);
        const distance = turf.distance(fromPt, toPt, { units: "kilometers" });

        // Calculate Time (Distance / Speed)
        const speed = AVERAGE_SPEEDS_KMH[route.vehicle_type] || 20;
        const time = (distance / speed) * 60; // minutes

        // Calculate Fare
        const fare =
          (route.base_fare || 12) + distance * (route.fare_per_km || 2);

        edges.push({
          from: String(current.id),
          to: String(next.id),
          weight_distance: distance,
          weight_time: time,
          weight_fare: fare,
          vehicleType: route.vehicle_type,
        });
      }
    });

    // 5. CREATE VIRTUAL TRANSFERS
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const n1 = nodes[i];
        const n2 = nodes[j];

        if (n1.id === n2.id) continue;

        const dist = turf.distance(
          turf.point([n1.lng, n1.lat]),
          turf.point([n2.lng, n2.lat]),
          { units: "kilometers" }
        );

        // If within 100 meters, create a walking transfer edge
        if (dist <= 0.1) {
          const walkTime = (dist / 5) * 60;
          const transferPenalty = 5;

          edges.push({
            from: n1.id,
            to: n2.id,
            weight_distance: dist,
            weight_time: walkTime + transferPenalty,
            weight_fare: 0,
            vehicleType: "walk",
          });

          edges.push({
            from: n2.id,
            to: n1.id,
            weight_distance: dist,
            weight_time: walkTime + transferPenalty,
            weight_fare: 0,
            vehicleType: "walk",
          });
        }
      }
    }

    return { nodes, edges, tricycleZones };
  } catch (error) {
    console.error("Error building graph:", error);
    return { nodes: [], edges: [], tricycleZones: [] };
  }
}
