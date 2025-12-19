import { supabase } from "./supabase";
import type { Terminal } from "../types/types";

// --- GRAPH TYPES ---
export interface GraphNode {
  id: string;
  lat: number;
  lng: number;
  name: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  weight_time: number;
  weight_distance: number;
  weight_fare: number;
  vehicleType: string;
}

export interface TricycleZone {
  id: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  polygon: any; // GeoJSON Polygon
  base_fare: number;
  per_km: number;
}

export interface TransitGraph {
  nodes: GraphNode[];
  adjacencyList: Record<string, GraphEdge[]>;
  tricycleZones: TricycleZone[];
}

// --- BUILD TRANSIT GRAPH ---
export async function buildTransitGraph(): Promise<TransitGraph> {
  try {
    // 1. Fetch Stops (Nodes)
    const { data: stopsData, error: stopsError } = await supabase
      .from("stops")
      .select("id, name, lat, lng");

    if (stopsError) throw stopsError;

    const nodes: GraphNode[] = (stopsData || []).map((s) => ({
      id: s.id,
      lat: s.lat,
      lng: s.lng,
      name: s.name,
    }));

    // 2. Fetch Tricycle Zones
    const { data: zonesData, error: zonesError } = await supabase
      .from("tricycle_zones")
      .select("*");

    // We don't throw here if table is missing, just log warning
    if (zonesError) {
      console.warn("Could not fetch tricycle zones:", zonesError.message);
    }

    const tricycleZones: TricycleZone[] = (zonesData || []).map((z) => ({
      id: z.id,
      name: z.name,
      polygon: z.polygon,
      base_fare: z.base_fare || 10,
      per_km: z.per_km || 2,
    }));

    // 3. Build Adjacency List (Edges)
    // Note: You need to implement the logic to fetch 'routes' or 'connections'
    // from your database to link these nodes together.
    // For now, we initialize an empty list so the app doesn't crash.
    const adjacencyList: Record<string, GraphEdge[]> = {};

    nodes.forEach((node) => {
      adjacencyList[node.id] = [];
    });

    // TODO: Fetch edges from supabase (e.g., 'route_connections') and populate adjacencyList
    // Example logic:
    // const { data: edges } = await supabase.from('edges').select('*');
    // edges.forEach(e => {
    //    adjacencyList[e.from_node].push({ from: e.from, to: e.to, ...weights })
    // });

    return {
      nodes,
      adjacencyList,
      tricycleZones,
    };
  } catch (error) {
    console.error("Error building transit graph:", error);
    // Return empty structure on error to prevent total app crash
    return { nodes: [], adjacencyList: {}, tricycleZones: [] };
  }
}

// --- FETCH TERMINALS FOR MAP DISPLAY ---
export async function fetchTerminals(): Promise<Terminal[]> {
  try {
    const { data, error } = await supabase
      .from("stops")
      .select("*")
      .eq("is_terminal", true);

    if (error) throw error;

    // Transform to Terminal type for map display
    const terminals: Terminal[] = (data || []).map((stop) => ({
      id: stop.id,
      name: stop.name,
      address: stop.address || "",
      vehicle_type: stop.vehicle_types?.[0] || "jeepney",
      lat: stop.lat,
      lng: stop.lng,
      rating: stop.rating || 4.0,
      rating_count: stop.rating_count || 0,
      description: stop.description || "",
      routes: [],
      reviews: [],
    }));

    return terminals;
  } catch (error) {
    console.error("Error fetching terminals:", error);
    return [];
  }
}
