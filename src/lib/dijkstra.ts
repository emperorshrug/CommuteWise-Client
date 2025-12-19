// src/lib/dijkstra.ts
import type { GraphNode, GraphEdge, TransitGraph } from "./graph";
// We don't import VehicleType here as it wasn't used in the logic, preventing unused-var error

// Result Interface
export interface DijkstraResult {
  path: string[]; // Array of Node IDs
  segments: GraphEdge[];
  totalValues: {
    distance: number;
    time: number;
    fare: number;
  };
}

// Priority Queue Helper
class PriorityQueue {
  private elements: { id: string; priority: number }[] = [];

  enqueue(id: string, priority: number) {
    this.elements.push({ id, priority });
    this.elements.sort((a, b) => a.priority - b.priority);
  }

  dequeue(): string | undefined {
    return this.elements.shift()?.id;
  }

  isEmpty(): boolean {
    return this.elements.length === 0;
  }
}

export function dijkstra(
  graph: TransitGraph,
  startNodeId: string,
  endNodeId: string,
  criteria: "time" | "distance" | "fare" = "time"
): DijkstraResult | null {
  const { nodes, edges } = graph;

  const costs: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const pq = new PriorityQueue();

  // Initialize
  nodes.forEach((node) => {
    costs[node.id] = Infinity;
    previous[node.id] = null;
  });

  costs[startNodeId] = 0;
  pq.enqueue(startNodeId, 0);

  const visited = new Set<string>();

  while (!pq.isEmpty()) {
    const currentId = pq.dequeue();
    if (!currentId) break;

    if (currentId === endNodeId) break;

    if (visited.has(currentId)) continue;
    visited.add(currentId);

    // Get neighbors
    const neighbors = edges.filter((e) => e.from === currentId);

    for (const edge of neighbors) {
      if (visited.has(edge.to)) continue;

      // Determine weight based on criteria
      let weight = 0;
      switch (criteria) {
        case "time":
          weight = edge.weight_time;
          break;
        case "distance":
          weight = edge.weight_distance;
          break;
        case "fare":
          weight = edge.weight_fare;
          break;
      }

      const newCost = costs[currentId] + weight;

      if (newCost < costs[edge.to]) {
        costs[edge.to] = newCost;
        previous[edge.to] = currentId;
        pq.enqueue(edge.to, newCost);
      }
    }
  }

  // Reconstruct Path
  if (costs[endNodeId] === Infinity) return null;

  const path: string[] = [];
  let current: string | null = endNodeId;

  while (current !== null) {
    path.unshift(current);
    current = previous[current] || null;
  }

  // Build Result Object with Totals
  const segments: GraphEdge[] = [];
  let totalDistance = 0;
  let totalTime = 0;
  let totalFare = 0;

  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i];
    const to = path[i + 1];
    const edge = edges.find((e) => e.from === from && e.to === to);

    if (edge) {
      segments.push(edge);
      totalDistance += edge.weight_distance;
      totalTime += edge.weight_time;
      totalFare += edge.weight_fare;
    }
  }

  return {
    path,
    segments,
    totalValues: {
      distance: totalDistance,
      time: totalTime,
      fare: totalFare,
    },
  };
}

export function findNearestGraphNode(
  lat: number,
  lng: number,
  nodes: GraphNode[],
  typeFilter?: string
): GraphNode | null {
  let nearest: GraphNode | null = null;
  let minDist = Infinity;

  // Use simple distance loop
  for (const node of nodes) {
    if (typeFilter && node.type !== typeFilter) continue;

    // Simple distance calculation (Squared Euclidean for speed comparison)
    const dx = node.lng - lng;
    const dy = node.lat - lat;
    const distSq = dx * dx + dy * dy;

    if (distSq < minDist) {
      minDist = distSq;
      nearest = node;
    }
  }

  return nearest;
}
