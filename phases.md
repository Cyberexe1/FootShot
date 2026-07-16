# Delivery Phases — FanFlow 26

Each phase is shippable and independently demoable. Update **memory.md** as
tasks move between phases. Deployment target throughout: **App Runner (backend)
+ S3/CloudFront (frontend)**.

---

## Phase 0 — Foundation & Scaffolding
**Goal:** repo, tooling, and deployable "hello world" on AWS.

- [ ] Monorepo structure (`frontend/`, `backend/`, `data/`, `infra/`).
- [ ] Frontend: Vite + React + TS + Tailwind + ESLint/Prettier.
- [ ] Backend: Express + TS + Pino + Zod + health endpoint.
- [ ] Dockerfile + `apprunner.yaml` for backend.
- [ ] CI (GitHub Actions): lint + test + build.
- [ ] Deploy backend to App Runner; frontend to S3 + CloudFront.
- [ ] CloudFront `/api/*` behavior → App Runner; CORS locked to CDN origin.

**Exit criteria:** `/api/health` reachable via CloudFront; SPA loads over CDN.

---

## Phase 1 — AI Fan Copilot (MVP core)
**Goal:** grounded, multilingual conversational assistant.

- [x] Bedrock service (Amazon Nova) with streaming (Converse API).
- [x] RAG: bundled knowledge base + lexical retrieval (embeddings = follow-up).
- [x] Prompt templates + guardrails + "don't know" fallback.
- [x] PII redaction utility.
- [x] `POST /api/chat` (JSON + SSE streaming) with Zod validation + rate limit.
- [x] Frontend chat UI (accessible, `aria-live`, language selector).
- [~] i18next scaffolding for UI strings (language selector drives AI language;
      full per-string i18n deferred).
- [x] Tests: service unit tests, chat API test, chat component test.

**Exit criteria:** fan asks a venue question in another language and gets a
grounded, translated answer.

---

## Phase 2 — Smart Wayfinding + Crowd View
**Goal:** navigation and live crowd density.

- [x] Venue graph (`venueGraph.ts`, bundled) + Dijkstra shortest-path service.
- [x] Step-free/accessible route filter.
- [x] `POST /api/wayfinding` + `GET /api/wayfinding/graph` + SVG map UI with
      route rendering (schematic map instead of MapLibre for indoor layout).
- [x] Zones model + `GET /api/crowd/zones` + `POST /api/crowd/ingest`.
- [x] Crowd heatmap UI, refresh every 15s.
- [x] Tests: pathfinding unit tests, wayfinding/crowd API + component tests.

**Exit criteria:** user gets gate-to-seat directions (incl. step-free) and sees
a live zone heatmap.

---

## Phase 3 — Operator Dashboard & Decision Support
**Goal:** operational intelligence for staff.

- [x] Role-based auth middleware (bearer-token staff/organizer for demo;
      Cognito JWT verification wired as the production path).
- [x] Incidents CRUD (`/api/incidents`) — repo with in-memory + DynamoDB impls.
- [x] `POST /api/ops/summary` — Nova summarizes state + recommends actions.
- [x] Dashboard UI: KPIs, AI summary panel, incident list/create/resolve.
- [x] Tests: auth middleware, incidents API, ops summary, dashboard component.

**Exit criteria:** operator logs in, sees live KPIs, and gets an AI summary with
recommended actions.

---

## Phase 4 — Transport, Accessibility & Sustainability Services
**Goal:** round out fan-facing operational features.

- [ ] Transport planner (`/api/transport`) with shuttle/metro/rideshare ETAs.
- [ ] Accessibility services: sensory maps, assistance request flow.
- [ ] Sustainability locator (recycling, water refill, EV charging).
- [ ] Multilingual notifications (`/api/notify/translate`).
- [ ] Tests across new endpoints + components.

**Exit criteria:** fans can plan transport, request assistance, find sustainable
amenities; operators broadcast translated announcements.

---

## Phase 5 — Predictive Intelligence & Analytics (stretch)
**Goal:** forecasting and cross-venue insight.

- [ ] Predictive congestion/egress modeling.
- [ ] Organizer analytics + sustainability reporting dashboard.
- [ ] Volunteer knowledge base with AI-drafted response scripts.

**Exit criteria:** dashboard shows congestion forecasts and organizer KPIs.

---

## Phase 6 — Hardening & Launch Readiness
**Goal:** production polish for judging.

- [ ] Security review (IAM least-privilege, headers, rate limits, secrets).
- [ ] Performance pass (caching, prompt/token trimming, timeouts).
- [ ] Full accessibility audit (screen reader + axe on all flows).
- [ ] Observability: CloudWatch dashboards + alarms.
- [ ] Load-test critical endpoints; finalize README + demo script.

**Exit criteria:** all judging parameters demonstrably satisfied; stable deploy.

---

## Priority Order for Hackathon
If time-constrained, ship in this order: **Phase 0 → 1 → 2 → 3**, then pull
selected Phase 4 items for demo breadth. Phases 5–6 are polish/stretch.
