/**
 * Thin API client. Uses a relative "/api" base so it works identically in
 * local dev (Vite proxy) and production (CloudFront /api behavior -> App Runner).
 */
const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

// Bearer token for staff/organizer endpoints (demo auth). Set via setAuthToken.
let authToken: string | null =
  typeof localStorage !== 'undefined' ? localStorage.getItem('ff26_token') : null;

export function setAuthToken(token: string | null): void {
  authToken = token;
  if (typeof localStorage !== 'undefined') {
    if (token) localStorage.setItem('ff26_token', token);
    else localStorage.removeItem('ff26_token');
  }
}

function authHeaders(): Record<string, string> {
  return authToken ? { Authorization: `Bearer ${authToken}` } : {};
}

// Invoked when a request is rejected with 401 (expired/invalid token) so the
// app can clear session state and prompt re-authentication.
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

function handleUnauthorized(status: number): void {
  // Only react to 401 when we actually had a token (i.e. a session expired),
  // not for anonymous calls to protected routes.
  if (status === 401 && authToken) {
    setAuthToken(null);
    onUnauthorized?.();
  }
}

export interface HealthResponse {
  status: string;
  service: string;
  timestamp: string;
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatSource {
  id: string;
  title: string;
}

export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
  language: string;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: 'application/json', ...authHeaders() },
  });
  if (!res.ok) {
    handleUnauthorized(res.status);
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.error?.message ?? `Request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

export interface ChatRequest {
  message: string;
  language: string;
  history?: ChatTurn[];
}

async function sendChat(body: ChatRequest): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.error?.message ?? `Request failed: ${res.status}`);
  }
  return (await res.json()) as ChatResponse;
}

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
  distance: number;
  stepFree: boolean;
}

export interface VenueGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface RouteStep {
  id: string;
  name: string;
  type: NodeType;
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

export type DensityLevel = 'ok' | 'warn' | 'crit';

export interface ZoneStatus {
  id: string;
  name: string;
  capacity: number;
  occupancy: number;
  density: number;
  level: DensityLevel;
}

export interface CrowdResponse {
  zones: ZoneStatus[];
  updatedAt: string;
}

async function sendJson<T>(
  method: 'POST' | 'PATCH',
  path: string,
  body: unknown,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    handleUnauthorized(res.status);
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.error?.message ?? `Request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

function postJson<T>(path: string, body: unknown): Promise<T> {
  return sendJson<T>('POST', path, body);
}

export type Severity = 'low' | 'medium' | 'high';
export type IncidentStatus = 'open' | 'resolved';

export interface Incident {
  id: string;
  title: string;
  description?: string;
  zoneId?: string;
  severity: Severity;
  status: IncidentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIncident {
  title: string;
  description?: string;
  zoneId?: string;
  severity: Severity;
}

export interface OpsSummary {
  summary: string;
  generatedAt: string;
}

export type TransportMode = 'metro' | 'shuttle' | 'rideshare' | 'bus';

export interface TransportOption {
  id: string;
  mode: TransportMode;
  name: string;
  etaMinutes: number;
  frequency: string;
  accessible: boolean;
  note: string;
}

export type AmenityType = 'water' | 'recycling' | 'compost' | 'ev-charging';

export interface SustainabilityAmenity {
  id: string;
  type: AmenityType;
  name: string;
  zone: string;
}

export interface AccessibilityService {
  id: string;
  name: string;
  description: string;
  zone: string;
}

export type AssistanceType = 'wheelchair' | 'sensory' | 'medical' | 'guide';

export interface AssistanceRequest {
  requestId: string;
  type: AssistanceType;
  zoneId: string;
  status: string;
  etaMinutes: number;
}

export interface Translation {
  language: string;
  text: string;
}

export interface TranslateResponse {
  original: string;
  translations: Translation[];
  generatedAt: string;
}

export interface HorizonPoint {
  minutes: number;
  density: number;
  level: DensityLevel;
}

export interface ZoneForecast {
  zoneId: string;
  name: string;
  currentDensity: number;
  horizon: HorizonPoint[];
  risk: DensityLevel;
}

export interface CongestionForecast {
  forecasts: ZoneForecast[];
  generatedAt: string;
}

export type Severity2 = 'low' | 'medium' | 'high';

export interface AnalyticsOverview {
  crowd: {
    totalCapacity: number;
    totalOccupancy: number;
    avgDensity: number;
    zonesAtCapacity: number;
  };
  incidents: {
    open: number;
    resolved: number;
    bySeverity: Record<Severity2, number>;
  };
  sustainability: {
    amenitiesByType: Record<AmenityType, number>;
    wasteDivertedPercent: number;
  };
  transport: { optionCount: number; accessibleCount: number };
  generatedAt: string;
}

export interface VolunteerScript {
  script: string;
  sources: ChatSource[];
}

export interface LoginResponse {
  token: string;
  role: 'staff' | 'organizer';
  username: string;
}

export const api = {
  health: () => getJson<HealthResponse>('/health'),
  login: (username: string, password: string) =>
    postJson<LoginResponse>('/auth/login', { username, password }),
  signup: (username: string, password: string) =>
    postJson<LoginResponse>('/auth/signup', { username, password }),
  chat: sendChat,
  venueGraph: () => getJson<VenueGraph>('/wayfinding/graph'),
  route: (from: string, to: string, accessible: boolean) =>
    postJson<Route>('/wayfinding', { from, to, accessible }),
  crowdZones: () => getJson<CrowdResponse>('/crowd/zones'),
  // Staff/organizer (requires auth token).
  listIncidents: () => getJson<{ incidents: Incident[] }>('/incidents'),
  createIncident: (input: CreateIncident) =>
    postJson<Incident>('/incidents', input),
  updateIncident: (id: string, patch: Partial<Pick<Incident, 'status' | 'severity' | 'description'>>) =>
    sendJson<Incident>('PATCH', `/incidents/${id}`, patch),
  opsSummary: () => postJson<OpsSummary>('/ops/summary', {}),
  // Fan services.
  transport: () =>
    getJson<{ options: TransportOption[]; updatedAt: string }>('/transport'),
  sustainability: () =>
    getJson<{ amenities: SustainabilityAmenity[] }>('/sustainability/amenities'),
  accessibilityServices: () =>
    getJson<{ services: AccessibilityService[] }>('/accessibility/services'),
  requestAssistance: (type: AssistanceType, zoneId: string, note?: string) =>
    postJson<AssistanceRequest>('/accessibility/assistance', { type, zoneId, note }),
  // Staff notifications.
  translate: (message: string, languages: string[]) =>
    postJson<TranslateResponse>('/notify/translate', { message, languages }),
  // Phase 5: predictive + analytics + volunteer.
  congestion: () => getJson<CongestionForecast>('/predict/congestion'),
  analytics: () => getJson<AnalyticsOverview>('/analytics/overview'),
  volunteerScript: (question: string, language: string) =>
    postJson<VolunteerScript>('/volunteer/script', { question, language }),
};
