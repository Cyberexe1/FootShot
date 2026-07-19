import type { Route, VenueGraph } from '../../lib/api';

const NODE_COLORS: Record<string, string> = {
  gate: '#0B5FFF',
  concourse: '#38BDF8',
  seat: '#00A878',
  amenity: '#F59E0B',
  elevator: '#A78BFA',
  stairs: '#94A3B8',
  transport: '#FF5A1F',
};

interface Props {
  graph: VenueGraph;
  route?: Route;
}

/**
 * Schematic 2D venue map. The map is decorative; the authoritative directions
 * are the text step list rendered alongside it (see Wayfinding).
 */
export default function VenueMap({ graph, route }: Props) {
  const routeIds = new Set(route?.steps.map((s) => s.id));
  const nodePos = new Map(graph.nodes.map((n) => [n.id, n]));

  // Ordered pairs of route node ids for highlighting traversed edges.
  const routePairs = new Set<string>();
  if (route) {
    for (let i = 0; i < route.steps.length - 1; i++) {
      const a = route.steps[i].id;
      const b = route.steps[i + 1].id;
      routePairs.add([a, b].sort().join('|'));
    }
  }

  return (
    <svg
      viewBox="0 0 320 260"
      className="h-auto w-full rounded-md bg-surface"
      role="img"
      aria-label={
        route
          ? `Map showing the route from ${route.steps[0].name} to ${
              route.steps[route.steps.length - 1].name
            }`
          : 'Venue map'
      }
    >
      {/* Edges */}
      {graph.edges.map((e, i) => {
        const a = nodePos.get(e.from);
        const b = nodePos.get(e.to);
        if (!a || !b) return null;
        const onRoute = routePairs.has([e.from, e.to].sort().join('|'));
        return (
          <line
            key={i}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={onRoute ? '#FF5A1F' : '#475569'}
            strokeWidth={onRoute ? 3 : 1}
            strokeDasharray={e.stepFree ? undefined : '4 3'}
          />
        );
      })}

      {/* Nodes */}
      {graph.nodes.map((n) => {
        const onRoute = routeIds.has(n.id);
        return (
          <g key={n.id}>
            <circle
              cx={n.x}
              cy={n.y}
              r={onRoute ? 6 : 4}
              fill={NODE_COLORS[n.type] ?? '#CBD5E1'}
              stroke={onRoute ? '#FFFFFF' : 'none'}
              strokeWidth={onRoute ? 1.5 : 0}
            />
            <text
              x={n.x + 7}
              y={n.y + 3}
              fontSize="9"
              fill="#E2E8F0"
            >
              {n.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
