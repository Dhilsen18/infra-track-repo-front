# InfraTrack Frontend (`infra-track`)

## Overview

Angular 21 client for heavy-machinery fleet monitoring (InfraTrack / Digital Machine). The codebase follows **DDD by bounded context**.

Frontend-only for now: demo data and `localStorage` / `sessionStorage` where there is no backend.

## Bounded contexts (4 + iam + shared)

| Context | Responsibility | Main routes |
|---------|----------------|-------------|
| **`iam`** | Onboarding, login, roles, session, guards | `/iam/*` |
| **`monitoring`** | Dashboards, GPS map, alerts, reports | Owner: `/control-panel`, `/reports-analytics`; Admin: `/operacion`; optional: `/telemetry` |
| **`fleet`** | IoT nodes, transports, drivers, owner configuration | Admin: `/dispositivos`, `/transportes`, `/conductores`; Owner: `/configuration` |
| **`site-management`** | Worksites, staff assignment (owner) | `/obras/*` |
| **`shared`** | Shell, profile, i18n, HTTP policy, plan limits | `/profile`, layout |

Legacy redirects: `/asset-management` → `/configuration`, `/performance` → `/conductores`.

## Layer structure

Each bounded context under `src/app/<context>/`:

```text
domain/model/          # Entities, commands
application/           # Stores (*.store.ts)
infrastructure/        # API facades, endpoints, assemblers/mappers
presentation/
  views/               # Route-level components
  <context>.routes.ts  # Lazy routes for this context
```

**`shared/`** — cross-cutting UI and infrastructure only (no business rules).

## Environments

| File | Purpose |
|------|---------|
| `src/environments/environment.ts` | Production |
| `src/environments/environment.development.ts` | Local dev |

`scripts/inject-api-bases.mjs` runs before build for CI/Vercel.

## Run

```bash
npm install
npm start
```

Open `http://localhost:4200/` → `/iam/sign-in`.

- **Owner:** signup → plans → `/control-panel` + sidebar obras.
- **Admin:** ops login → `/operacion` + dispositivos / transportes / conductores.

```bash
npm run build
```
