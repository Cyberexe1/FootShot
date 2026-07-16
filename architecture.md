# Architecture — FanFlow 26

**Version:** 1.0
**Deployment target:** AWS App Runner (backend) + S3 + CloudFront (frontend)

---

## 1. High-Level Architecture

```
                          ┌──────────────────────────────┐
                          │            Users             │
                          │  Fans · Volunteers · Staff   │
                          └───────────────┬──────────────┘
                                          │ HTTPS
                                          ▼
                          ┌──────────────────────────────┐
                          │        Amazon CloudFront      │  (CDN, TLS, caching)
                          └───────────────┬──────────────┘
                                          │
                        ┌─────────────────┴─────────────────┐
                        ▼                                   ▼
             ┌────────────────────┐              ┌────────────────────────┐
             │   S3 (static SPA)  │              │   /api/* → App Runner   │
             │  React build files │              │   (origin behavior)     │
             └────────────────────┘              └───────────┬────────────┘
                                                             │ HTTPS
                                                             ▼
                                              ┌───────────────────────────┐
                                              │   AWS App Runner service   │
                                              │   Node.js/Express API      │
                                              │   (stateless, auto-scale)  │
                                              └───────────┬───────────────┘
                                                          │
        ┌───────────────┬───────────────┬────────────────┼───────────────┐
        ▼               ▼               ▼                ▼               ▼
 ┌────────────┐  ┌─────────────┐  ┌──────────┐   ┌──────────────┐  ┌───────────┐
 │  Amazon    │  │  DynamoDB   │  │   S3     │   │   Amazon     │  │ CloudWatch│
 │  Bedrock   │  │ (venue,     │  │ (maps,   │   │   Cognito    │  │ (logs +   │
 │ (Amazon    │  │  incidents, │  │  assets, │   │ (operator/   │  │  metrics) │
 │  Nova +    │  │  sessions)  │  │  RAG kb) │   │  organizer   │  │           │
 │  embeddings│  │             │  │          │   │  auth)       │  │           │
 └────────────┘  └─────────────┘  └──────────┘   └──────────────┘  └───────────┘
```

---

## 2. Application Flow

### 2.1 Fan Copilot (RAG) flow
1. Fan sends a question via the SPA (with language + optional venue/zone context).
2. CloudFront routes `/api/chat` to App Runner.
3. Backend detects/normalizes language, redacts any PII.
4. Backend embeds the query, retrieves relevant venue docs from the vector store
   (RAG knowledge base).
5. Backend builds a grounded prompt with guardrails and calls **Bedrock (Amazon Nova)**.
6. Response is streamed back through CloudFront to the client.
7. Prompt/model/latency logged to CloudWatch (no PII).

### 2.2 Wayfinding flow
1. Client requests route: `origin`, `destination`, `accessible?`.
2. Backend computes route from the venue graph (nodes/edges in DynamoDB/S3).
3. Returns ordered steps + polyline + estimated walk time; step-free filter
   removes stairs/escalators.

### 2.3 Operator decision-support flow
1. Occupancy/incident events ingested (simulated stream or POST) into DynamoDB.
2. Dashboard polls/streams zone density every ≤15s.
3. On demand, backend asks Bedrock (Amazon Nova) to summarize state + recommend actions.
4. Operator acknowledges/resolves incidents (state stored in DynamoDB).

### 2.4 Multilingual notification flow
1. Operator drafts an announcement in one language.
2. Backend uses Bedrock (Amazon Nova) to translate into target languages.
3. Notifications fan out to subscribed clients.

---

## 3. Tech Stack

### 3.0 Core Stack (confirmed)
> **Frontend:** React + Vite + TypeScript
> **Backend:** Node.js (Express + TypeScript)
> **Database:** AWS DynamoDB
> **GenAI:** Amazon Bedrock (Amazon Nova models)
> **Hosting:** Backend on AWS App Runner · Frontend on S3 + CloudFront

The subsections below expand this core stack with supporting libraries and
services.

### Frontend
- **React 18 + TypeScript**
- **Vite** (build tooling)
- **React Router** (routing)
- **TanStack Query** (server state / caching)
- **Tailwind CSS** (styling; see design.md)
- **MapLibre GL** (open-source maps for wayfinding/heatmap)
- **i18next** (client-side i18n scaffolding)
- **Vitest + React Testing Library** (unit/component tests)
- **axe-core** (accessibility testing)

### Backend
- **Node.js 20 + Express + TypeScript**
- **AWS SDK v3** (Bedrock, DynamoDB, S3, Cognito)
- **Zod** (request validation)
- **Pino** (structured logging)
- **Jest / Vitest + Supertest** (unit + API tests)
- Runs as a **Docker container** on App Runner.

### AI / Data
- **Amazon Bedrock** — **Amazon Nova** models (chat, summaries, translation):
  Nova Lite/Pro for reasoning-heavy responses, Nova Micro for low-latency tasks.
  Uses **Amazon Titan Embeddings** for RAG vectors.
- **AWS DynamoDB** (primary database) — venue graph, zones, incidents, sessions,
  notifications. Single-table or per-entity tables with on-demand capacity.
- **Vector store** — OpenSearch Serverless (or pgvector) for embeddings; a
  lightweight in-memory/JSON index is acceptable for the hackathon MVP.
- **S3** — map tiles/assets and the RAG knowledge base source docs.

### Infra / DevOps
- **AWS App Runner** — backend service (auto-scaling, HTTPS).
- **S3 + CloudFront** — frontend static hosting + CDN + single `/api/*` behavior.
- **Amazon Cognito** — auth for operator/organizer roles.
- **CloudWatch** — logs, metrics, alarms.
- **GitHub Actions** — CI (lint, test, build) + deploy.
- **IaC** — AWS CDK or Terraform (optional but recommended).

---

## 4. Folder & File Structure

```
fanflow-26/
├── prd.md
├── architecture.md
├── rules.md
├── phases.md
├── design.md
├── memory.md
├── README.md
├── docker-compose.yml            # local dev (backend + local services)
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── public/
│   │   └── locales/              # i18next translation JSON
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── routes/               # route components
│       │   ├── FanCopilot.tsx
│       │   ├── Wayfinding.tsx
│       │   ├── CrowdView.tsx
│       │   ├── OperatorDashboard.tsx
│       │   └── Transport.tsx
│       ├── components/           # reusable UI (accessible)
│       ├── features/             # feature-scoped logic + hooks
│       ├── lib/                  # api client, i18n, utils
│       ├── styles/               # tailwind + theme tokens
│       └── test/                 # component/unit tests
│
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile                # App Runner image
│   ├── apprunner.yaml            # App Runner build/run config
│   └── src/
│       ├── index.ts              # server entry
│       ├── app.ts                # express app wiring
│       ├── config/               # env + constants
│       ├── routes/               # /chat, /wayfinding, /crowd, /incidents...
│       ├── controllers/
│       ├── services/
│       │   ├── bedrock.service.ts
│       │   ├── rag.service.ts
│       │   ├── wayfinding.service.ts
│       │   └── crowd.service.ts
│       ├── middleware/           # auth, validation, error handler, rate limit
│       ├── models/               # DynamoDB access
│       ├── prompts/              # prompt templates + guardrails
│       ├── utils/                # logger, pii-redaction, errors
│       └── test/                 # unit + integration tests
│
├── data/
│   ├── venue-graph.json          # nodes/edges for wayfinding
│   ├── zones.json                # crowd zones
│   └── knowledge-base/           # RAG source docs (markdown)
│
└── infra/                        # CDK/Terraform (optional)
    ├── frontend-stack.*          # S3 + CloudFront
    └── backend-stack.*           # App Runner + IAM + DynamoDB
```

---

## 5. API Surface (initial)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/chat` | none | Fan copilot (RAG, streaming) |
| POST | `/api/wayfinding` | none | Route between two points |
| GET | `/api/crowd/zones` | none | Current zone densities |
| POST | `/api/crowd/ingest` | staff | Ingest occupancy events |
| GET | `/api/incidents` | staff | List incidents |
| POST | `/api/incidents` | staff | Create incident |
| PATCH | `/api/incidents/:id` | staff | Update/resolve incident |
| POST | `/api/ops/summary` | staff | AI decision-support summary |
| POST | `/api/notify/translate` | staff | Multilingual announcement |
| GET | `/api/health` | none | Health check for App Runner |

---

## 5.1 DynamoDB Data Model (initial)

Primary database is **AWS DynamoDB** (on-demand capacity). Suggested tables:

| Table | Partition key (PK) | Sort key (SK) | Notes |
|---|---|---|---|
| `Zones` | `zoneId` | — | Density, capacity, current occupancy |
| `Incidents` | `incidentId` | — | GSI on `status` + `createdAt` for lists |
| `VenueGraph` | `nodeId` | `edgeId` | Wayfinding nodes/edges (or load from S3) |
| `Sessions` | `sessionId` | — | Chat session context, TTL enabled |
| `Notifications` | `notificationId` | `lang` | Translated announcement variants |

Guidelines: use the AWS SDK v3 DocumentClient, on-demand billing, TTL for
ephemeral session data, and GSIs only where query patterns require them. Keep
access least-privilege per table.

## 6. Deployment Notes

- **Frontend:** `vite build` → sync `dist/` to S3 → CloudFront distribution
  serves the SPA; add a CloudFront behavior for `/api/*` pointing to the
  App Runner domain (or route the API through its own subdomain).
- **Backend:** build Docker image → push to ECR → App Runner deploys from ECR
  (or source-based build via `apprunner.yaml`). Configure health check on
  `/api/health` and environment variables via App Runner config.
- **CORS:** backend allows the CloudFront domain origin only.
- **Secrets/config:** injected as App Runner env vars; never committed.
