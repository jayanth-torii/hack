# PathMind Backend

Node.js + Express + TypeScript + MongoDB backend for PathMind — AI-generated, difficulty-sequenced learning roadmaps with server-enforced unlock progression.

## Quick start

```bash
cp .env.example .env
docker-compose up --build
```

The API listens on `http://localhost:4000`. Swagger docs: `http://localhost:4000/api-docs`. Health check: `GET /health`.

Without Docker, run MongoDB + Redis yourself and:

```bash
npm install
npm run dev
```

## Mock mode

`MOCK_MODE=true` (the default) makes the **entire product work with zero external API keys**: roadmap generation, freshness link-checking, and Google Calendar export all use deterministic, realistic fake implementations behind the exact same interfaces the real integrations use. This is what the test suite runs against.

To go live:
1. Set `MOCK_MODE=false`.
2. Fill in `ANTHROPIC_API_KEY` (default provider — `AI_PROVIDER=anthropic`).
3. Fill in `SEARCH_API_KEY` (Tavily-compatible; swap the request in `src/services/ai/webSearch.ts` if using a different vendor).
4. For Google Calendar export, create an OAuth 2.0 Web client in Google Cloud Console (Calendar API enabled), register `GOOGLE_CALENDAR_REDIRECT_URI` as an authorized redirect URI, and fill in `GOOGLE_CALENDAR_CLIENT_ID`/`SECRET`. Until then, `format=google` returns 409 and the `.ics` download (always works) is the fallback.

`AI_PROVIDER=openai` is defined in `src/services/ai/openaiProvider.ts` as a stub behind the same `AIProvider` interface — not implemented, so switching to it throws until filled in.

## Scripts

- `npm run dev` — tsx watch mode
- `npm run build` — compile to `dist/` (tsc + alias rewrite + seed-JSON copy)
- `npm test` — Jest + Supertest (mongodb-memory-server + ioredis-mock; no real network calls, since `MOCK_MODE=true` in tests)
- `npm run typecheck` / `npm run lint`

## What's real vs. mocked by default

| Feature | Status |
|---|---|
| Auth (JWT access+refresh, bcrypt, httpOnly cookies) | Fully real |
| Roadmap generation orchestration, caching, unlock logic | Fully real |
| Practice-link verification (curated seed mapping) | Fully real, always (never AI-generated URLs) |
| `.ics` calendar export | Fully real, always |
| Freshness worker (cron, HEAD-check, re-search-on-dead-link) | Fully real logic; HEAD checks + search calls run in mock mode by default |
| AI generation (syllabus/resources/certs/timeline) | Real Anthropic integration coded; runs against `MockAIProvider` until `MOCK_MODE=false` + API key set |
| Google Calendar export | Real OAuth + batch-insert coded; requires your own Google Cloud OAuth client |

## Verified in this environment

- `tsc --noEmit`: clean, strict, no `any`.
- `npm run build`: compiles and the resulting `dist/` boots (`createApp()` resolves all path aliases and routes).
- `npm test`: 33/33 passing across 9 suites (auth, roadmap generation + caching, progress/unlock, calendar export, freshness worker, plus unit tests for the unlock algorithm, practice-link resolver, ICS generator, and AI provider factory).
- `docker-compose up` was **not** exercised in this sandbox (no Docker available here) — the Dockerfile/compose config follows the standard multi-stage + healthcheck pattern and should be verified in your own environment before relying on it for deployment.
