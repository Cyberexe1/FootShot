# Project Memory — FanFlow 26

> Living document. Update this whenever a task's status changes so anyone (human
> or AI) can resume with full context. Keep entries short and factual.

**Last updated:** 2026-07-16
**Current phase:** Phase 1 — AI Fan Copilot (complete). Next: Phase 2.
**Core stack:** React + Vite + TypeScript · Node.js (Express + TS) · AWS DynamoDB · Amazon Bedrock (Amazon Nova) · App Runner + CloudFront

---

## 1. Status Legend
- ✅ Done
- 🚧 In progress
- ⏳ Planned / not started
- ⚠️ Blocked (note reason)

---

## 2. Snapshot

| Area | Status | Notes |
|---|---|---|
| Planning docs (prd/architecture/rules/phases/design) | ✅ | Created 2026-07-16 |
| Repo scaffolding | ✅ | Phase 0 |
| Backend (Express + health) | ✅ | Phase 0 |
| Frontend (Vite + React) | ✅ | Phase 0 |
| CI/CD | ✅ | Phase 0 (GitHub Actions: lint+test+build) |
| AWS deploy (App Runner + CloudFront) | ⏳ | Config ready; not yet deployed |
| AI Fan Copilot | ✅ | Phase 1 (Nova + RAG + multilingual) |
| Wayfinding + Crowd View | ⏳ | Phase 2 |
| Operator Dashboard | ⏳ | Phase 3 |
| Transport/Accessibility/Sustainability | ⏳ | Phase 4 |
| Predictive + Analytics | ⏳ | Phase 5 |
| Hardening & launch | ⏳ | Phase 6 |

---

## 3. Completed
- **2026-07-16** — Authored planning suite: `prd.md`, `architecture.md`,
  `rules.md`, `phases.md`, `design.md`, `memory.md`.
- Confirmed deployment approach: **backend → AWS App Runner**,
  **frontend → S3 + CloudFront** (with `/api/*` behavior to App Runner).
- **Phase 0** — Monorepo scaffolded. Backend (Express + TS + Pino + Zod +
  helmet + rate limit + `/api/health`) with Dockerfile + `apprunner.yaml`.
  Frontend (Vite + React + TS + Tailwind + TanStack Query, design tokens).
  GitHub Actions CI (lint + test + build). All builds/tests/lint green.
- **Phase 1** — AI Fan Copilot:
  - `POST /api/chat` (Zod-validated, JSON + SSE streaming).
  - PII redaction utility (`utils/pii.ts`) applied before model calls.
  - RAG: bundled venue knowledge base + lexical retriever (`rag.service.ts`).
  - Prompt + guardrails (`prompts/copilot.ts`) — grounded, honest fallback.
  - Bedrock/Nova service via Converse API (`bedrock.service.ts`).
  - Frontend chat UI: accessible (aria-live log, labels, keyboard), language
    selector (10 languages), suggestions, sources display.
  - Tests: pii, rag, chat (mocked Bedrock), FanCopilot component. 16 tests green.

## 4. Currently Working On
- (idle) — Phase 1 done. Recommended next: deploy to AWS, then Phase 2.

## 5. Next Up (immediate backlog)
1. Deploy: push backend image to ECR → App Runner; build frontend → S3 +
   CloudFront; enable Amazon Nova in target region; set `CORS_ORIGINS`.
2. Phase 2: venue graph + wayfinding service + MapLibre map UI.
3. Phase 2: crowd zones API + heatmap UI.
4. (Optional) upgrade RAG lexical retriever to Titan embeddings.

## 6. Decisions Log
- **Core stack (confirmed):** React + Vite + TypeScript (frontend), Node.js +
  Express + TypeScript (backend), **AWS DynamoDB** (database).
- **AI provider:** Amazon Bedrock using **Amazon Nova** models (Nova Lite/Pro +
  Nova Micro) — native AWS models, align with AWS deploy. Titan for embeddings.
- **Maps:** MapLibre GL (open source) to avoid vendor lock-in for hackathon.
- **Vector store:** start with lightweight JSON/in-memory index; upgrade to
  OpenSearch Serverless if time allows.
- **Auth:** Cognito for staff/organizer; fan features anonymous.
- **Excluded:** facial recognition / biometric tracking (privacy).

## 7. Open Questions / TODO
- Confirm target AWS region (Bedrock model availability varies by region).
- Decide: source-based App Runner build vs ECR image push.
- Confirm which/how many languages to seed in i18next for the demo.
- Source venue map/graph data (real vs simulated) for demo stadium.

## 8. Risks Being Tracked
- Bedrock region/model access — verify before Phase 1.
- Latency on streaming responses through CloudFront — test early.
- Bedrock token cost — enforce caps and caching from the start.

---

### How to update this file
When you finish or start a task: move it between §3/§4/§5, update the §2
snapshot and the `Last updated` date, and log any notable choice in §6.
