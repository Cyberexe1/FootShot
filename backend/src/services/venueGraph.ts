/**
 * Bundled venue graph for wayfinding. Nodes carry schematic coordinates (for a
 * 2D map render) and edges carry walking distance + a `stepFree` flag used to
 * compute accessible (step-free) routes.
 *
 * Ships with the backend for the MVP; in production this would be sourced from
 * DynamoDB/S3 per stadium (see architecture.md).
 */
export type NodeType =
  | 'gate'
  | 'concourse'
  | 'seat'
  | 'amenity'
  | 'elevator'
  | 'stairs'
  | 'transport';

export interface GraphNode {
  id: string;
  name: string;
  type: NodeType;
  x: number;
  y: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  /** Walking distance in meters. */
  distance: number;
  /** False for stairs/escalators — excluded from step-free routes. */
  stepFree: boolean;
}

export const nodes: GraphNode[] = [
  { id: 'gate-a', name: 'Gate A (North)', type: 'gate', x: 100, y: 20 },
  { id: 'gate-c', name: 'Gate C (East)', type: 'gate', x: 290, y: 120 },
  { id: 'metro', name: 'Metro Station', type: 'transport', x: 30, y: 40 },
  { id: 'hub-n', name: 'North Concourse', type: 'concourse', x: 100, y: 100 },
  { id: 'hub-e', name: 'East Concourse', type: 'concourse', x: 240, y: 120 },
  { id: 'concourse-1', name: 'Level 1 Central', type: 'concourse', x: 160, y: 160 },
  { id: 'elevator-1', name: 'Elevator', type: 'elevator', x: 160, y: 115 },
  { id: 'stairs-1', name: 'Stairs', type: 'stairs', x: 115, y: 150 },
  { id: 'sec-101', name: 'Section 101', type: 'seat', x: 80, y: 225 },
  { id: 'sec-115', name: 'Section 115', type: 'seat', x: 245, y: 225 },
  { id: 'restroom-1', name: 'Restroom', type: 'amenity', x: 205, y: 185 },
  { id: 'food-1', name: 'Food Court', type: 'amenity', x: 120, y: 200 },
  { id: 'water-1', name: 'Water Refill', type: 'amenity', x: 180, y: 205 },
];

export const edges: GraphEdge[] = [
  { from: 'gate-a', to: 'hub-n', distance: 60, stepFree: true },
  { from: 'gate-a', to: 'metro', distance: 400, stepFree: true },
  { from: 'gate-c', to: 'hub-e', distance: 50, stepFree: true },
  { from: 'hub-n', to: 'concourse-1', distance: 90, stepFree: true },
  { from: 'hub-e', to: 'concourse-1', distance: 90, stepFree: true },
  { from: 'hub-n', to: 'elevator-1', distance: 40, stepFree: true },
  { from: 'elevator-1', to: 'concourse-1', distance: 45, stepFree: true },
  { from: 'hub-n', to: 'stairs-1', distance: 30, stepFree: false },
  { from: 'stairs-1', to: 'concourse-1', distance: 35, stepFree: false },
  { from: 'concourse-1', to: 'sec-101', distance: 70, stepFree: true },
  { from: 'concourse-1', to: 'sec-115', distance: 75, stepFree: true },
  { from: 'concourse-1', to: 'restroom-1', distance: 30, stepFree: true },
  { from: 'concourse-1', to: 'food-1', distance: 40, stepFree: true },
  { from: 'concourse-1', to: 'water-1', distance: 25, stepFree: true },
  { from: 'sec-101', to: 'food-1', distance: 30, stepFree: true },
];

export const nodeById = new Map(nodes.map((n) => [n.id, n]));
