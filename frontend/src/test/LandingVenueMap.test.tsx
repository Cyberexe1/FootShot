import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Landing from '../features/landing/Landing';
import VenueMap from '../features/wayfinding/VenueMap';

describe('Landing', () => {
  it('renders and wires the enter/login actions', async () => {
    const onEnter = vi.fn();
    const onLogin = vi.fn();
    const user = userEvent.setup();
    render(<Landing onEnter={onEnter} onLogin={onLogin} />);

    expect(
      screen.getByRole('heading', { name: /smart stadiums/i }),
    ).toBeInTheDocument();
    // Feature cards are present.
    expect(screen.getByText(/AI Wayfinding/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^login$/i }));
    expect(onLogin).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /launch app/i }));
    expect(onEnter).toHaveBeenCalled();
  });
});

const graph = {
  nodes: [
    { id: 'gate-a', name: 'Gate A', type: 'gate' as const, x: 10, y: 10 },
    { id: 'stairs-1', name: 'Stairs', type: 'stairs' as const, x: 30, y: 30 },
    { id: 'sec-1', name: 'Section 1', type: 'seat' as const, x: 50, y: 50 },
  ],
  edges: [
    { from: 'gate-a', to: 'stairs-1', distance: 30, stepFree: false },
    { from: 'stairs-1', to: 'sec-1', distance: 40, stepFree: true },
  ],
};

describe('VenueMap', () => {
  it('renders a labelled map image without a route', () => {
    render(<VenueMap graph={graph} />);
    expect(screen.getByRole('img', { name: /venue map/i })).toBeInTheDocument();
  });

  it('describes the route when one is provided', () => {
    const route = {
      from: 'gate-a',
      to: 'sec-1',
      accessible: false,
      distanceMeters: 70,
      etaMinutes: 1,
      steps: [
        { id: 'gate-a', name: 'Gate A', type: 'gate' as const, x: 10, y: 10 },
        { id: 'sec-1', name: 'Section 1', type: 'seat' as const, x: 50, y: 50 },
      ],
    };
    render(<VenueMap graph={graph} route={route} />);
    expect(
      screen.getByRole('img', { name: /route from Gate A to Section 1/i }),
    ).toBeInTheDocument();
  });
});
