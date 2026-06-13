# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project context

A Traditional Chinese Medicine (TCM / Đông Y) clinic management system. Domain language is **Vietnamese** — model, route, table, and column names use Vietnamese terms (e.g. `vi-thuoc` = herb, `kinh-mach` = meridian, `chung-benh` = syndrome, `the-benh` = disease pattern, `phap-tri` = treatment method, `bai-thuoc` = herbal formula, `huyet-vi` = acupoint, `phac-do-dieu-tri` = treatment protocol). Keep naming consistent with the existing Vietnamese vocabulary rather than translating to English.

The `Kinhlac/` directory at repo root is a legacy Windows desktop app (`.exe`, `.dll`, `.dat`, reflection scripts). It is reference material only — do not modify, build, or import from it.

## Repo layout

- `backend/` — NestJS 11 + TypeORM + PostgreSQL API. Entry `src/main.ts` (listens on `APP_PORT`, default 3001). Vercel serverless entry at `backend/api/index.ts`.
- `frontend/` — Vue 3 + Vite + Pinia + Vue Router SPA. Served via nginx (`frontend/nginx.conf`) in Docker or statically on Vercel.
- `backend/sql/` — hand-written PostgreSQL migrations. **TypeORM `synchronize` is off by default**; schema changes must be added here and run manually. See `backend/sql/README.md` for caveats.
- `backend/tmp/` — one-off scripts (`migrate.ts`, `seed-pg.ts`, `import-legacy-models.js`, `test-conn.js`). Not part of the build.
- `disease-rules.json`, `benh_dong_y_excel.sql`, `insert-benh-dong-y-excel-from-json.sql` — seed data for the `BenhDongYExcel` diagnostic engine.
- `map.md` — cell-level spec for the meridian measurement spreadsheet (chi trên / chi dưới rows C10–C15, F10–F15, etc.). Reference this when touching meridian analysis math.
- `docker-compose.yml`, `ecosystem.config.cjs`, `start.sh`, `DEPLOYMENT.md` — deployment configs (see "Deployment" below).

## Backend conventions (important — non-standard NestJS naming)

The codebase **inverts the usual NestJS naming**:

- `src/routers/*.router.ts` — `@Controller` classes (HTTP routing layer)
- `src/controllers/*.controller.ts` — `@Injectable` service classes (business logic)
- `src/models/*.model.ts` — TypeORM `@Entity` classes
- `src/models/*.dto.ts` — DTO types (plain TS, no class-validator decorators in use)

When adding a new domain object, follow this pattern and register the entity, router, and service in `src/app.module.ts` (all three lists: `TypeOrmModule.forFeature([...])`, `controllers: [...]`, `providers: [...]`). The module manually lists every entity/router/service — there is no auto-discovery.

Auth uses `@nestjs/passport` JWT. `JwtStrategy` lives in `src/middlewares/auth/jwt.strategy.ts`; `JwtAuthGuard` in the same folder. `JWT_SECRET` falls back to the literal `'fallback_secret_key'` if unset — never rely on the fallback in production.

### Database env vars

`AppModule` accepts either naming convention; both are checked:

- `DATABASE_URL` or `POSTGRES_URL` (single connection string), OR
- `DB_HOST`/`POSTGRES_HOST`, `DB_PORT`/`POSTGRES_PORT`, `DB_USER`/`POSTGRES_USER`, `DB_PASSWORD`/`POSTGRES_PASSWORD`, `DB_NAME`/`POSTGRES_DATABASE`
- `DB_SSL=false` to disable SSL (default is `rejectUnauthorized: false`)
- `DB_SYNCHRONIZE=true` to enable TypeORM auto-sync (default off — keep it off in shared environments)

Connection pool is tuned for **serverless** (`max: 1`, short timeouts). If running long-lived (PM2/Docker), this is intentionally conservative — change deliberately.

### CORS

`src/main.ts` defines `brandmasterRegex`, `localhostRegex`, `vercelRegex` allowlists but the actual `origin` callback returns `callback(null, true)` (allow all). The regex constants are dead code. The Vercel deployment path (`backend/api/index.ts`) mirrors the origin header back. If tightening CORS, fix both entry points.

### BenhDongYExcel diagnostic engine

`benh-dong-y-excel.*` implements a rule engine whose rules are stored as Excel-formula-like strings (`excelFormula`), a logic expression (`logicExpression`), and SQL CASE clauses (`sqlCaseText`, `sqlCaseBoolean`). Input cell refs (`C10`, `F15`, `D7`, etc.) match the layout in `map.md`. The `MeridianResultsView.vue` frontend renders these results with cell-reference highlighting; recent commits (`refToHint`, `splitCellRefs`) revolve around mapping rule cells back to the UI.

## Frontend conventions

- Path alias: `@` → `frontend/src` (configured in `vite.config.ts` and `tsconfig.app.json`).
- API base URL comes from `VITE_API_URL`, default `http://localhost:3001`. JWT lives in `localStorage.access_token`; the wrapper in `src/services/api.ts` auto-redirects to `/login` on 401.
- Routing in `src/router/index.ts` uses `meta.requiresAuth` and a single `beforeEach` guard reading `localStorage`.
- All authenticated pages render under `DashboardLayout.vue` as child routes.
- Pinia stores in `src/stores/`. No global state library beyond Pinia.
- Styling is plain CSS in `src/assets/styles/` (no Tailwind, no UI framework).
- Lint stack is **oxlint + eslint**, both run via `npm run lint` (oxlint first, then eslint). Format is `prettier --experimental-cli`.

## Common commands

### Backend (`cd backend`)
```bash
npm install
npm run start:dev          # nest start --watch
npm run build              # nest build → dist/
npm run start:prod         # node dist/main
npm run lint               # eslint --fix
npm test                   # jest (looks for *.spec.ts under src/)
npm test -- path/to.spec   # single test file
npm run test:e2e           # jest with test/jest-e2e.json
npm run test:cov           # coverage
npm run import:legacy-models   # runs ./tmp/import-legacy-models.js
```

To seed the default admin (`admin` / `password123`), run the standalone script:
```bash
npx ts-node src/seed-admin.ts
```

### Frontend (`cd frontend`)
```bash
npm install
npm run dev                # vite dev server
npm run build              # runs type-check + vite build in parallel
npm run type-check         # vue-tsc --build
npm run lint               # oxlint then eslint
npm run format             # prettier
npm run preview            # serve built dist/
```

Node `^20.19.0 || >=22.12.0` per `frontend/package.json#engines`.

### Database migrations
Apply files in `backend/sql/` manually with `psql` (or any client). **Back up before running**, especially `migrate-vi-thuoc-excel-schema.sql` which drops legacy columns. Do not rely on TypeORM `synchronize`.

## Deployment paths

Three coexisting deployment paths — know which one you're touching:

1. **Docker Compose** (`docker-compose.yml`, `DEPLOYMENT.md`) — backend on `:3000`, frontend nginx on `:80`, Postgres on `:5432`. Uses `NODE_ENV=production` and `DB_*` env vars.
2. **PM2** (`ecosystem.config.cjs`, `start.sh`) — backend on `APP_PORT=3001`, frontend assumed to be a Nuxt-style `.output/server/index.mjs` (note: the current frontend is **Vite SPA**, not Nuxt — the PM2 frontend block is stale and will not work as-is against this codebase).
3. **Vercel** — backend via `backend/vercel.json` → `backend/api/index.ts` (serverless, caches the Nest app between invocations); frontend via `frontend/vercel.json` (SPA rewrites). The hard-coded allowed origin in `backend/vercel.json` is `https://kinhlac.vercel.app`.

The backend port differs between deployments (3000 in Docker, 3001 in PM2/local). When fixing CORS, redirects, or links between services, confirm which deployment is in play.
