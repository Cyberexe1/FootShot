# FanFlow 26 — Smart Stadiums & Tournament Operations

GenAI-enabled platform for the FIFA World Cup 2026 that enhances stadium
operations and the fan experience: AI navigation, crowd management,
accessibility, transport, sustainability, multilingual assistance, and
real-time operational decision support.

> Planning docs: [`prd.md`](./prd.md) · [`architecture.md`](./architecture.md) ·
> [`rules.md`](./rules.md) · [`phases.md`](./phases.md) ·
> [`design.md`](./design.md) · [`memory.md`](./memory.md)
>
> Ops docs: [`DEPLOYMENT.md`](./DEPLOYMENT.md) · [`SECURITY.md`](./SECURITY.md) ·
> [`OBSERVABILITY.md`](./OBSERVABILITY.md) · [`DEMO.md`](./DEMO.md)

## Features
- **Fan Copilot** — multilingual, RAG-grounded assistant (Amazon Nova)
- **Wayfinding** — gate-to-seat routing with step-free/accessible option
- **Crowd View** — live zone density heatmap
- **Services** — transport ETAs, accessibility services, sustainability locator
- **Operator** — KPIs, AI decision-support summaries, incidents, congestion
  forecast, organizer analytics, volunteer AI scripts, multilingual announcements

## Tech Stack
- **Frontend:** React + Vite + TypeScript, Tailwind CSS, TanStack Query
- **Backend:** Node.js + Express + TypeScript, Pino, Zod
- **Database:** AWS DynamoDB
- **GenAI:** Amazon Bedrock (Amazon Nova models)
- **Hosting:** Backend on AWS App Runner · Frontend on S3 + CloudFront

## Project Structure
```
fanflow-26/
├── frontend/   # React + Vite + TS SPA
├── backend/    # Node + Express + TS API (Docker → App Runner)
├── data/       # venue graph, zones, RAG knowledge base
└── infra/      # (optional) CDK/Terraform for AWS resources
```

## Local Development

### Prerequisites
- Node.js 20+

### Backend
```bash
cd backend
npm install
cp .env.example .env
npm run dev          # starts on http://localhost:8080
```
Health check: `http://localhost:8080/api/health`

### Frontend
```bash
cd frontend
npm install
npm run dev          # starts on http://localhost:5173
```
The dev server proxies `/api/*` to the backend on port 8080.

## Testing & Quality
```bash
npm run lint         # ESLint
npm test             # Vitest (unit/component/API)
npm run build        # type-check + production build
```

## Deployment (target)
- **Backend → AWS App Runner:** build the Docker image (`backend/Dockerfile`),
  push to ECR, and deploy. Health check path: `/api/health`, port `8080`.
  Source-based builds can use `backend/apprunner.yaml`.
- **Frontend → S3 + CloudFront:** `npm run build` then sync `dist/` to S3.
  Add a CloudFront `/api/*` behavior pointing at the App Runner domain, and set
  `CORS_ORIGINS` on the backend to the CloudFront domain.

See [`architecture.md`](./architecture.md) for full details.
