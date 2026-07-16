/**
 * Thin API client. Uses a relative "/api" base so it works identically in
 * local dev (Vite proxy) and production (CloudFront /api behavior -> App Runner).
 */
const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

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
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
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

export const api = {
  health: () => getJson<HealthResponse>('/health'),
  chat: sendChat,
};
