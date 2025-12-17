// =========================================================================================
// DIJKSTRA PATHFINDING ALGORITHM
// PURPOSE: FINDS SHORTEST PATH BETWEEN TERMINALS AND STOPS USING GRAPH DATA
// ALGORITHM: DIJKSTRA'S SHORTEST PATH ALGORITHM
// =========================================================================================

import { TERMINALS_DATA, STOPS_DATA } from "./graph";
import type { VehicleType } from "../types/types";

// GRAPH NODE: REPRESENTS A TERMINAL OR STOP IN THE TRANSPORT NETWORK
interface GraphNode {
  id: number;
  type: "terminal" | "stop";
  lat: number;
  lng: number;
  name: string;
  vehicleTypes: VehicleType[];
}

// GRAPH EDGE: CONNECTION BETWEEN TWO NODES WITH WEIGHT (DISTANCE OR TIME)
interface GraphEdge {
  from: number;
  to: number;
  weight: number; // DISTANCE IN KM OR TIME IN MINUTES
  vehicleType: VehicleType;
  fare?: number;
}

// BUILD GRAPH: CREATES GRAPH STRUCTURE FROM TERMINALS AND STOPS DATA
function buildGraph(): {
  nodes: GraphNode[];
  edges: GraphEdge[];
} {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // ADD TERMINALS AS NODES
  TERMINALS_DATA.forEach((terminal) => {
    nodes.push({
      id: terminal.id,
      type: "terminal",
      lat: terminal.lat,
      lng: terminal.lng,
      name: terminal.name,
      vehicleTypes: [terminal.vehicle_type],
    });
  });

  // ADD STOPS AS NODES
  STOPS_DATA.forEach((stop) => {
    nodes.push({
      id: stop.id,
      type: "stop",
      lat: stop.lat,
      lng: stop.lng,
      name: stop.name,
      vehicleTypes: stop.vehicle_types,
    });
  });

  // BUILD EDGES: CONNECT TERMINALS TO THEIR ROUTE STOPS
  TERMINALS_DATA.forEach((terminal) => {
    terminal.routes.forEach((route) => {
      route.stops.forEach((stop, index) => {
        // FIND THE ACTUAL STOP NODE
        const stopNode = nodes.find((n) => n.id === stop.id);
        if (!stopNode) return;

        // IF THIS IS THE FIRST STOP, CREATE EDGE FROM TERMINAL TO FIRST STOP
        if (index === 0) {
          // TERMINAL TO FIRST STOP
          edges.push({
            from: terminal.id,
            to: stop.id,
            weight: route.distance_km / route.stops.length, // ESTIMATE DISTANCE PER SEGMENT
            vehicleType: terminal.vehicle_type,
            fare: route.fare_regular,
          });
        } else {
          // CONNECT PREVIOUS STOP TO CURRENT STOP
          const prevStop = route.stops[index - 1];
          const prevStopNode = nodes.find((n) => n.id === prevStop.id);
          if (prevStopNode) {
            edges.push({
              from: prevStop.id,
              to: stop.id,
              weight: route.distance_km / route.stops.length,
              vehicleType: terminal.vehicle_type,
              fare: route.fare_regular,
            });
          }
        }
      });
    });
  });

  // BUILD EDGES: CONNECT STOPS THAT SHARE VEHICLE TYPES (TRANSFER POINTS)
  nodes.forEach((node1) => {
    if (node1.type === "stop") {
      nodes.forEach((node2) => {
        if (node2.type === "stop" && node1.id !== node2.id) {
          // CHECK IF THEY SHARE A VEHICLE TYPE (TRANSFER POSSIBLE)
          const sharedTypes = node1.vehicleTypes.filter((type) =>
            node2.vehicleTypes.includes(type)
          );
          if (sharedTypes.length > 0) {
            // CALCULATE DISTANCE BETWEEN STOPS USING HAVERSINE
            const distance = haversineDistance(
              node1.lat,
              node1.lng,
              node2.lat,
              node2.lng
            );
            // ONLY ADD EDGE IF STOPS ARE WITHIN 1KM (REALISTIC WALKING DISTANCE FOR TRANSFER)
            if (distance <= 1.0) {
              edges.push({
                from: node1.id,
                to: node2.id,
                weight: distance * 12, // WALKING TIME ESTIMATE: 12 MINS PER KM
                vehicleType: sharedTypes[0], // USE FIRST SHARED TYPE
              });
            }
          }
        }
      });
    }
  });

  return { nodes, edges };
}

// HAVERSINE DISTANCE: CALCULATES DISTANCE BETWEEN TWO COORDINATES
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // EARTH'S RADIUS IN KM
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// DIJKSTRA ALGORITHM: FINDS SHORTEST PATH FROM START TO END
export function dijkstra(
  startNodeId: number,
  endNodeId: number,
  optimizeFor: "distance" | "time" | "fare" = "distance"
): {
  path: number[]; // ARRAY OF NODE IDs
  totalWeight: number; // TOTAL DISTANCE/TIME/FARE
  segments: Array<{
    from: number;
    to: number;
    weight: number;
    vehicleType: VehicleType;
    fare?: number;
  }>;
} | null {
  const { nodes, edges } = buildGraph();

  // FIND START AND END NODES
  const startNode = nodes.find((n) => n.id === startNodeId);
  const endNode = nodes.find((n) => n.id === endNodeId);

  if (!startNode || !endNode) {
    return null;
  }

  // INITIALIZE DISTANCES: ALL INFINITE EXCEPT START (0)
  const distances: Map<number, number> = new Map();
  const previous: Map<number, number | null> = new Map();
  const visited: Set<number> = new Set();

  nodes.forEach((node) => {
    distances.set(node.id, Infinity);
    previous.set(node.id, null);
  });
  distances.set(startNodeId, 0);

  // MAIN ALGORITHM LOOP
  while (visited.size < nodes.length) {
    // FIND UNVISITED NODE WITH SMALLEST DISTANCE
    let currentNodeId: number | null = null;
    let smallestDistance = Infinity;

    distances.forEach((distance, nodeId) => {
      if (!visited.has(nodeId) && distance < smallestDistance) {
        smallestDistance = distance;
        currentNodeId = nodeId;
      }
    });

    if (currentNodeId === null || smallestDistance === Infinity) {
      break; // NO PATH FOUND
    }

    visited.add(currentNodeId);

    // IF WE REACHED THE END NODE, RECONSTRUCT PATH
    if (currentNodeId === endNodeId) {
      const path: number[] = [];
      let current: number | null = endNodeId;

      while (current !== null) {
        path.unshift(current);
        current = previous.get(current) ?? null;
      }

      // BUILD SEGMENTS WITH EDGE INFORMATION
      const segments: Array<{
        from: number;
        to: number;
        weight: number;
        vehicleType: VehicleType;
        fare?: number;
      }> = [];

      for (let i = 0; i < path.length - 1; i++) {
        const edge = edges.find(
          (e) => e.from === path[i] && e.to === path[i + 1]
        );
        if (edge) {
          segments.push({
            from: path[i],
            to: path[i + 1],
            weight: edge.weight,
            vehicleType: edge.vehicleType,
            fare: edge.fare,
          });
        }
      }

      return {
        path,
        totalWeight: smallestDistance,
        segments,
      };
    }

    // UPDATE DISTANCES TO NEIGHBORS
    const outgoingEdges = edges.filter((e) => e.from === currentNodeId);
    outgoingEdges.forEach((edge) => {
      const currentDistance = distances.get(currentNodeId!)!;
      const edgeWeight =
        optimizeFor === "fare" ? edge.fare ?? edge.weight : edge.weight;
      const newDistance = currentDistance + edgeWeight;

      const neighborDistance = distances.get(edge.to)!;
      if (newDistance < neighborDistance) {
        distances.set(edge.to, newDistance);
        previous.set(edge.to, currentNodeId!);
      }
    });
  }

  // NO PATH FOUND
  return null;
}

// FIND NEAREST NODE: FINDS CLOSEST TERMINAL OR STOP TO GIVEN COORDINATES
export function findNearestNode(
  lat: number,
  lng: number,
  type?: "terminal" | "stop",
  vehicleType?: VehicleType
): GraphNode | null {
  const { nodes } = buildGraph();
  let candidateNodes = nodes;

  // FILTER BY TYPE IF SPECIFIED
  if (type) {
    candidateNodes = candidateNodes.filter((n) => n.type === type);
  }

  // FILTER BY VEHICLE TYPE IF SPECIFIED
  if (vehicleType) {
    candidateNodes = candidateNodes.filter((n) =>
      n.vehicleTypes.includes(vehicleType)
    );
  }

  if (candidateNodes.length === 0) {
    return null;
  }

  // FIND NODE WITH MINIMUM DISTANCE
  let nearest: GraphNode | null = null;
  let minDistance = Infinity;

  candidateNodes.forEach((node) => {
    const distance = haversineDistance(lat, lng, node.lat, node.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = node;
    }
  });

  return nearest;
}

// GET NODE BY ID: RETRIEVES NODE INFORMATION BY ID
export function getNodeById(nodeId: number): GraphNode | null {
  const { nodes } = buildGraph();
  return nodes.find((n) => n.id === nodeId) ?? null;
}
