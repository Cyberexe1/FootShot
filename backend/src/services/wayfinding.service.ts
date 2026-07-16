import { edges, nodeById, nodes, type GraphNode } from './venueGraph.js';
import { AppError } from '../utils/errors.js';

/** Average walking speed (m/s) used to estimate ETA. */
const WALK_SPEED_MPS = 1.3;

export interface RouteStep {
  id: string;
  name: string;
  type: GraphNode['type'];
  x: number;
  y: number;
}

export interface Route {
  from: string;
  to: string;
  accessible: boolean;
  steps: RouteStep[];
  distanceMeters: number;
  etaMinutes: number;
}

interface Adjacency {
  [nodeId: string]: Array<{ to: string; distance: number }>;
}

function buildAdjacency(accessible: boolean): Adjacency {
  const adj: Adjacency = {};
  for (const node of nodes) adj[node.id] = [];
  for (const edge of edges) {
    if (accessible && !edge.stepFree) continue; // skip stairs for step-free routes
    adj[edge.from].push({ to: edge.to, distance: edge.distance });
    adj[edge.to].push({ to: edge.from, distance: edge.distance });
  }
  return adj;
}

/** Dijkstra shortest path over the venue graph. */
export function findRoute(from: string, to: string, accessible = false): Route {
  if (!nodeById.has(from)) {
    throw AppError.badRequest(`Unknown origin: ${from}`, 'UNKNOWN_NODE');
  }
  if (!nodeById.has(to)) {
    throw AppError.badRequest(`Unknown destination: ${to}`, 'UNKNOWN_NODE');
  }
  if (from === to) {
    throw AppError.badRequest('Origin and destination are the same', 'SAME_NODE');
  }

  const adj = buildAdjacency(accessible);
  const dist: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  const visited = new Set<string>();

  for (const node of nodes) {
    dist[node.id] = Infinity;
    prev[node.id] = null;
  }
  dist[from] = 0;

  // Simple O(V^2) selection — the graph is small, so this is clear and fast.
  while (visited.size < nodes.length) {
    let current: string | null = null;
    let best = Infinity;
    for (const node of nodes) {
      if (!visited.has(node.id) && dist[node.id] < best) {
        best = dist[node.id];
        current = node.id;
      }
    }
    if (current === null) break; // remaining nodes unreachable
    if (current === to) break;
    visited.add(current);

    for (const edge of adj[current]) {
      const alt = dist[current] + edge.distance;
      if (alt < dist[edge.to]) {
        dist[edge.to] = alt;
        prev[edge.to] = current;
      }
    }
  }

  if (dist[to] === Infinity) {
    throw AppError.notFound(
      accessible
        ? 'No step-free route available between these points'
        : 'No route available between these points',
      'NO_ROUTE',
    );
  }

  // Reconstruct path.
  const path: string[] = [];
  let cursor: string | null = to;
  while (cursor) {
    path.unshift(cursor);
    cursor = prev[cursor];
  }

  const steps: RouteStep[] = path.map((id) => {
    const node = nodeById.get(id)!;
    return { id: node.id, name: node.name, type: node.type, x: node.x, y: node.y };
  });

  const distanceMeters = dist[to];
  return {
    from,
    to,
    accessible,
    steps,
    distanceMeters,
    etaMinutes: Math.max(1, Math.round(distanceMeters / WALK_SPEED_MPS / 60)),
  };
}

/** Full graph for rendering the base map on the client. */
export function getGraph() {
  return { nodes, edges };
}
