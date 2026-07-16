# Engineering Rules — FanFlow 26

These rules exist to keep the project scoring well on the judging parameters:
**Code Quality · Security · Efficiency · Testing · Accessibility · Problem Alignment.**
Follow them for every change.

---

## 1. What To Do (DO)

### Code Quality
- Use **TypeScript** everywhere (frontend + backend), `strict: true`.
- Keep functions small and single-purpose; prefer pure functions in services.
- Enforce **ESLint + Prettier**; no lint errors on commit.
- Use clear names; document non-obvious logic with short comments.
- Validate all inbound requests with **Zod** schemas.
- Centralize error handling in one Express middleware.
- Keep the backend **stateless** (App Runner scales horizontally).

### Security
- Authenticate operator/organizer routes via **Cognito** (JWT verification).
- **Redact PII** before sending anything to Bedrock.
- Use **parameterized/SDK** data access — never string-concatenate queries.
- Enforce **TLS** end to end; HTTPS only.
- Restrict **CORS** to the CloudFront origin.
- Store secrets in **App Runner env vars / SSM / Secrets Manager**, never in git.
- Apply **least-privilege IAM** roles (Bedrock, DynamoDB, S3 scoped to need).
- Add **rate limiting** on public endpoints (`/api/chat`, `/api/wayfinding`).
- Set security headers (helmet): CSP, HSTS, no-sniff, frame-deny.

### Efficiency
- **Stream** Bedrock chat responses to reduce perceived latency.
- Cache stable data (venue graph, zones) in memory / CloudFront.
- Trim prompts and cap `max_tokens`; reuse embeddings.
- Use **TanStack Query** caching on the frontend; avoid redundant fetches.
- Set request **timeouts** and retries with backoff on AWS calls.

### Testing
- Unit test all services and utilities (target ≥ 70% on core logic).
- API/integration tests with **Supertest** for each route.
- Component tests with **React Testing Library**.
- Run **axe-core** accessibility checks in the test suite.
- CI must pass **lint + test + build** before deploy.

### Accessibility (WCAG 2.2 AA)
- Semantic HTML; correct heading order; landmark regions.
- All interactive elements keyboard-operable with visible focus.
- `aria-label`/`alt` on icons, images, and controls.
- Color contrast ≥ 4.5:1 (text) / 3:1 (large text & UI).
- Live regions (`aria-live`) for chat responses and alerts.
- Respect `prefers-reduced-motion`; captions for any audio/video.
- Every feature usable at 200% zoom.

### Problem-Statement Alignment
- Every feature must map to a challenge area (see prd.md §2).
- GenAI must add clear value (assist, summarize, translate, recommend) — not
  be bolted on.

---

## 2. What To Avoid (DON'T)

- **Do not** send PII (names, emails, ticket IDs, precise location) to any model.
- **Do not** let the AI hallucinate — always ground with RAG and allow an
  honest "I don't have that information" fallback.
- **Do not** add facial recognition, biometric tracking, or covert surveillance.
- **Do not** hardcode secrets, API keys, or endpoints in source.
- **Do not** commit `.env`, credentials, or large binaries.
- **Do not** introduce heavy or unmaintained dependencies for trivial needs.
- **Do not** block the event loop with synchronous heavy work.
- **Do not** store state in backend memory that must survive scaling.
- **Do not** disable ESLint/TS strict rules to "make it compile".
- **Do not** deploy without a passing CI run.

---

## 3. Approved Libraries

**Frontend:** react, react-dom, react-router-dom, @tanstack/react-query,
tailwindcss, maplibre-gl, i18next / react-i18next, zod, vitest,
@testing-library/react, axe-core.

**Backend:** express, @aws-sdk/* (bedrock-runtime, dynamodb, s3, cognito),
zod, pino, helmet, cors, express-rate-limit, jest/vitest, supertest.

Adding a new dependency requires: (1) a clear need, (2) active maintenance,
(3) pinned exact version, (4) note in memory.md. Verify the package name to
avoid typosquats.

---

## 4. Error Handling Standards

- Throw typed `AppError { statusCode, code, message }`; never leak stack traces
  or internal details to clients.
- Central Express error middleware returns a consistent JSON shape:
  ```json
  { "error": { "code": "STRING_CODE", "message": "Human readable" } }
  ```
- Log full error context server-side with **Pino** (request id, no PII).
- AWS/Bedrock calls: wrap in try/catch, apply timeout + limited retries, and
  degrade gracefully (e.g., cached data or a friendly fallback message).
- Frontend: show accessible, non-technical error states and a retry action.
- Never fail silently — surface or log every error path.

---

## 5. API Boundaries & Contracts

- All endpoints live under `/api/*`.
- Requests and responses are **JSON** (except SSE/streaming chat).
- Every request is validated with Zod before reaching business logic.
- Public endpoints: `chat`, `wayfinding`, `crowd/zones`, `health`.
- Protected endpoints (Cognito JWT + role check): all `incidents`, `ops`,
  `crowd/ingest`, `notify`.
- Versioning: breaking changes go under `/api/v2/*`; keep v1 stable.
- Rate limits documented per endpoint; return `429` with a clear code.
- Standard status codes: 200/201 success, 400 validation, 401/403 auth,
  404 not found, 429 rate limit, 500 server error.
- Responses must be deterministic in shape; AI free-text goes in a defined field
  (e.g., `{ "answer": "...", "sources": [...] }`).

---

## 6. Git & Workflow

- Small, focused commits with clear messages.
- Feature branches; no direct pushes to `main`.
- PRs must pass CI (lint + test + build).
- Update **memory.md** whenever a phase/feature status changes.
