# FanFlow 26 — Smart Stadiums & Tournament Operations

A **GenAI-powered platform for the FIFA World Cup 2026** that improves the
experience for **fans, volunteers, and venue staff** — navigation, crowd
management, accessibility, transport, sustainability, multilingual assistance,
and real-time operational decision support. Generative AI (Amazon Nova via
Amazon Bedrock) powers the conversational, translation, and decision-support
features and is grounded in venue knowledge (RAG) so answers stay accurate.

**Live demo:** https://d11v5wqac6q3ra.cloudfront.net

---

## Challenge alignment

Built for **[Challenge 4] Smart Stadiums & Tournament Operations**. Every area
in the brief is implemented and deployed:

| Challenge area | How FanFlow 26 delivers it |
|---|---|
| Navigation | AI **Wayfinding**: gate-to-seat routing with a step-free (accessible) option, rendered on a venue map |
| Crowd management | **Live Crowd View** heatmap + AI **congestion forecast** for the next hour |
| Accessibility | Step-free routing, sensory/assistance services, screen-reader-first UI, WCAG-minded components |
| Transportation | **Transport planner** with metro/shuttle/rideshare/bus ETAs |
| Sustainability | **Sustainability locator** (water refill, recycling, compost, EV charging) + waste-diversion metric |
| Multilingual assistance | **Fan Copilot** answers in 10+ languages; operators broadcast **auto-translated announcements** |
| Operational intelligence | **Operator dashboard**: KPIs, incident tracking, organizer analytics |
| Real-time decision support | AI **ops summary** — situation report + prioritized recommended actions (Amazon Nova) |

---

## Who it serves

The challenge calls out four user groups; FanFlow 26 supports each:

- **Fans** — Copilot, wayfinding, crowd view, transport, sustainability, accessibility services.
- **Volunteers** — the volunteer AI script assistant drafts ready-to-read answers.
- **Venue staff** — operator dashboard: live crowd, incidents, AI decision support.
- **Organizers** — cross-venue analytics and sustainability reporting.

## How Generative AI is used

GenAI (Amazon Nova via Bedrock) is core to the product, not bolted on:

- **Grounded Q&A (RAG)** — the Fan Copilot answers from a venue knowledge base
  (Titan embeddings + retrieval), so responses stay factual and cite sources.
- **Multilingual** — Nova answers in the fan's language and translates operator
  announcements into 10+ languages.
- **Decision support** — Nova turns live crowd density + open incidents into a
  concise situation summary with prioritized recommended actions.
- **Volunteer enablement** — Nova drafts short, friendly response scripts.

Safety: user text is PII-redacted before any model call, prompts are guardrailed
to refuse ungrounded answers, and model calls have timeouts + token caps.

## Features

- **Fan Copilot** — multilingual, RAG-grounded assistant (Amazon Nova). PII is
  redacted before any model call; answers cite their venue sources.
- **Wayfinding** — Dijkstra shortest-path over a venue graph with a step-free
  filter; interactive SVG map highlights the route.
- **Crowd View** — live zone-density heatmap (auto-refreshes every 15s) with a
  summary of occupancy and zones at capacity.
- **Services** — transport ETAs, accessibility services + assistance requests,
  and a sustainability amenity locator.
- **Operator console** (authenticated) — KPIs, AI decision-support summaries,
  incident create/resolve, congestion forecast, organizer analytics, a
  volunteer AI script assistant, and multilingual announcement translation.
- **Auth** — username/password with **bcrypt** hashing, **JWT** issued in an
  **httpOnly, SameSite=Strict** cookie; signup persists accounts in DynamoDB.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript, Tailwind CSS, TanStack Query |
| Backend | Node.js 20 + Express + TypeScript, Pino (logs), Zod (validation) |
| Auth | bcryptjs + jsonwebtoken (JWT in httpOnly cookie) |
| Database | AWS DynamoDB (incidents, users, crowd) with in-memory fallback for dev |
| GenAI | Amazon Bedrock — **Amazon Nova** (chat/summary/translate) + **Titan** embeddings (RAG) |
| Hosting | Backend on **AWS App Runner** (Docker) · Frontend on **S3 + CloudFront** |
| CI | GitHub Actions — lint · coverage-gated tests · build (both projects) |

---

## Architecture

```
Browser ── HTTPS ──► CloudFront ──┬── default behavior ─► S3 (React SPA, private via OAC)
                                  └── /api/*  behavior  ─► App Runner (Express API)
                                                              │
                 ┌───────────────┬──────────────┬────────────┼───────────────┐
                 ▼               ▼              ▼             ▼               ▼
            Amazon Bedrock   DynamoDB          (JWT          Pino →        Titan
            (Nova + Titan)   incidents/        httpOnly      CloudWatch    embeddings
                             users/crowd       cookie auth)  logs          (RAG)
```

- The SPA calls the **relative** path `/api`, so the same build works locally
  (Vite proxy) and in production (CloudFront `/api/*` → App Runner).
- The backend is **stateless** and auto-scales on App Runner; shared state lives
  in DynamoDB.
- Auth token never touches JavaScript (httpOnly cookie); SameSite=Strict is the
  CSRF defense since the SPA and API are same-site behind CloudFront.

---

## Project structure

```
fanflow-26/
├── frontend/                # React + Vite + TS SPA
│   └── src/
│       ├── App.tsx          # app shell: landing / auth / sidebar console
│       ├── components/ui/   # shared primitives (Button, Card)
│       ├── features/        # copilot, wayfinding, crowd, services, operator, auth, landing
│       ├── lib/             # api client, auth context
│       └── test/            # component, integration, a11y (axe) tests
│
└── backend/                 # Node + Express + TS API (Docker → App Runner)
    └── src/
        ├── app.ts           # express wiring (helmet, cors, rate limits, routes)
        ├── config/          # zod-validated env + prod guardrails
        ├── routes/          # /auth /chat /wayfinding /crowd /incidents /ops ...
        ├── services/        # bedrock, rag, embeddings, crowd, transport, analytics ...
        ├── repositories/    # incidents/users/crowd (DynamoDB + in-memory)
        ├── middleware/       # JWT auth + role guard, error handler
        ├── prompts/          # grounded prompt templates + guardrails
        └── test/            # service + API (supertest) tests
```

---

## Local development

**Prerequisites:** Node.js 20+

**Backend**
```bash
cd backend
npm install
cp .env.example .env      # dev defaults work out of the box (in-memory stores)
npm run dev               # http://localhost:8080  · health: /api/health
```

**Frontend**
```bash
cd frontend
npm install
npm run dev               # http://localhost:5173 (proxies /api → :8080)
```

Local operator logins (dev fallback): `operator` / `operator123`,
`organizer` / `organizer123`.

---

## Testing & quality

```bash
# in either frontend/ or backend/
npm run lint            # ESLint (incl. eslint-plugin-jsx-a11y on the frontend)
npm run test            # Vitest — unit, API (supertest), component, axe a11y
npm run test:coverage   # Vitest with enforced coverage thresholds
npm run build           # type-check + production build
```

- **83 tests** total (backend + frontend), all green.
- Coverage is **gated in CI** (`test:coverage`); accessibility is checked with
  `axe-core` across the main flows.
- **0 npm vulnerabilities** in both projects.

---

## Security highlights

- **bcrypt** password hashing (never plaintext); **JWT** in an httpOnly,
  Secure, SameSite=Strict cookie; role-based route guards (staff/organizer).
- **PII redaction** before any AI model call; **Zod** validation on every request.
- **helmet** security headers, **CORS** restricted to the CloudFront origin,
  tiered **rate limiting** (general / AI / auth).
- **Least-privilege IAM** — the App Runner role is scoped to specific Bedrock
  model ARNs and the three DynamoDB tables. Secrets come from env, never git.

---

## Accessibility

Semantic HTML, ARIA live regions for AI responses, `meter` roles for density
bars, keyboard operability with visible focus, `prefers-reduced-motion` support,
labeled forms, and a "never rely on colour alone" rule (status shown as
icon + label + value). Verified with automated `axe-core` tests and
`eslint-plugin-jsx-a11y`.

---

## Deployment

- **Backend → App Runner:** build `backend/Dockerfile`, push to ECR, deploy.
  Port `8080`, health check `/api/health`. Runtime env sets `AWS_REGION`,
  `BEDROCK_MODEL_ID`, the `*_TABLE` names, `CORS_ORIGINS`, `AUTH_JWT_SECRET`,
  and bcrypt password hashes.
- **Frontend → S3 + CloudFront:** `npm run build`, sync `dist/` to S3 (private,
  served via Origin Access Control), with a CloudFront `/api/*` behavior routed
  to the App Runner domain.

Requires Amazon Nova + Titan embeddings enabled in Bedrock for the target region.
