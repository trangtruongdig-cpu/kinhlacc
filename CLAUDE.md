# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project context

A Traditional Chinese Medicine (TCM / Đông Y) clinic management system. Domain language is **Vietnamese** — model, route, table, and column names use Vietnamese terms (e.g. `vi-thuoc` = herb, `kinh-mach` = meridian, `chung-benh` = syndrome, `the-benh` = disease pattern, `phap-tri` = treatment method, `bai-thuoc` = herbal formula, `huyet-vi` = acupoint, `phac-do-dieu-tri` = treatment protocol). Keep naming consistent with the existing Vietnamese vocabulary rather than translating to English.

The `Kinhlac/` directory at repo root is a legacy Windows desktop app (`.exe`, `.dll`, `.dat`, reflection scripts). It is reference material only — do not modify, build, or import from it.

## Repo layout

- `backend/` — NestJS 11 + TypeORM + PostgreSQL API. Entry `src/main.ts` (listens on `APP_PORT`, default 3001).
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

`src/main.ts` enforces a **fixed allowlist** and rejects everything else with `CORS: Origin <x> not allowed` — it is NOT allow-all (that was true of an older revision). Allowed: `localhost:5173`, `localhost:3000`, the `127.0.0.1` equivalents, `kinhlac.online` (+`www`), `kinhlac.vercel.app`, plus `localhost:8080` when `NODE_ENV !== 'production'`.

Practical consequence: **a dev frontend on any other port gets `Failed to fetch`** with no clue in the browser — the reason only shows in the backend log. If you need a second Vite instance for testing, either use an allowlisted port or add it to the list in `src/main.ts`.

### Liên kết chéo từ điển (cross-reference)

Nội dung từ điển là văn xuôi nhắc tên riêng của mục từ khác. `POST /tra-cuu/ten` (`tra-cuu.router.ts` + `tra-cuu.controller.ts`) nhận một LÔ tên và trả về mục nào có thật: nguồn (slug), bài thuốc (slug), vị thuốc (id).

- Client trích sẵn cụm **nghi là tên riêng** theo vị trí (trong ngoặc đơn cuối câu, sau chữ "gọi là") rồi hỏi một lượt — nhờ vậy không phải tải 13.942 tên bài thuốc về máy người đọc, và `(30g)` / `(Spongilla fragilis)` không bao giờ thành link.
- Nguồn + vị thuốc khớp qua index trong bộ nhớ (TTL 10 phút), có khoá **chuẩn hoá mạnh** (bỏ dấu thanh + mọi dấu câu) nên `Tam Nhân Cực-…` và `Tam Nhân Cực – …` cùng trỏ một mục; khi nhiều bản trùng thì chọn bản được trích nhiều nhất. Bài thuốc tra thẳng bằng cột `slug`.
- `frontend/src/components/VanBanYVan.vue` dựng bố cục (tiểu đề mục, khối trích dẫn, danh sách biến pháp) và bọc link; `frontend/src/lib/traCuuTen.ts` gom nhiều lời gọi trong một nhịp render thành 1 request, cache cả kết quả rỗng.
- Tên vị thuốc chỉ link khi được truyền vào qua prop `viThuoc` (lấy từ thành phần của chính mục đang xem) và chỉ ở lần nhắc đầu tiên. ⚠️ Việc đếm "đã link" phải nằm TRONG computed — để ở ngoài thì lần render sau thấy Set đã đầy và mất sạch link.

### Chất lượng dữ liệu từ điển

`backend/sql/audit-rac-tu-dien.sql` (chỉ đọc) dò 6 dạng lỗi mã hoá di sản từ app Windows cũ. Chạy nó trước khi tin bất kỳ số liệu nào về chất lượng từ điển; mọi số D1–D6 phải bằng 0. Các file `clean-*.sql`, `dich-chu-han-*.sql`, `gop-*.sql`, `bo-sung-nguon-*.sql` đã xử lý xong phần rác ký tự, chữ Hán chưa dịch, nguồn trùng và nguồn thiếu (18/09/2026). Việc còn nợ ghi ở cuối từng file.

### Thuật toán đo kinh lạc — ĐỌC TRƯỚC KHI SỬA

`docs/thuat-toan-do-kinh-lac.md` là đặc tả đầy đủ của logic cốt lõi: nguồn gốc (phương pháp **Lê Văn
Sửu 1983**, kế thừa **Akabane**), công thức từng tầng, và **lý do** của mỗi quyết định. Vài điều phải
biết trước khi đụng vào `meridianAnalysis.ts` / `meridian-analysis.util.ts`:

- `(MAX+MIN)/2` và `range/6` là **"nguyên tắc chia ba" của sách**, không phải trung bình cộng bị làm
  sai. Đổi sang trung vị/trung bình là **ly khai khỏi phương pháp gốc** — quyết định của thầy thuốc,
  không phải của kỹ thuật.
- Phân định có **BA hạng**, hạng thứ ba là *"kinh không biểu không lý → không có bệnh lý"*. Thiếu nó
  thì bảng tạng phủ luôn đủ 12/12 với mọi phiếu.
- `thuTu` (thứ tự truyền kinh) và `tang` (nông→sâu) là **HAI trục khác nhau**, chỉ lệch ở cặp Dương
  Minh ↔ Thiếu Dương. Đừng gộp lại.
- Toàn bộ đầu ra **bất biến affine** (nhân/cộng cả 24 số → kết quả y hệt). Mức tuyệt đối chỉ nhìn
  thấy qua `soSanhChinhKhi`.
- **BA bản sao thuật toán** phải sửa đồng thời: lib frontend, util backend, và bản riêng trong
  `MeridianResultsView.vue`.
- Phép kiểm vàng neo vào ví dụ có lời giải in trong sách:
  `npm test --prefix backend -- meridian-analysis`.

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
- ⚠️ **`npm run lint` WRITES to files** — both steps run with `--fix` (`oxlint . --fix`, `eslint . --fix --cache`). It is not a read-only check. It will happily rewrite vendored libraries (`public/kinhmach3d/vendor/`) and files unrelated to your change. To check without writing, run `npx oxlint` / `npx eslint .` directly, and `git status` afterwards either way. Same applies to `backend/` (`eslint --fix`).

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

**Only ONE deployment is live: Docker Compose on a VPS.** Verified 2026-09-18 — `kinhlac.online` serves the app; `kinhlac.vercel.app` returns `DEPLOYMENT_NOT_FOUND`.

1. **Docker Compose** (`docker-compose.yml`, `DEPLOYMENT.md`) — **THE LIVE ONE**. nginx serves the SPA and proxies `/api/` to the backend container (`proxy_buffering off`, `proxy_read_timeout 600s` — required for SSE). Postgres is external (Aiven), not in Docker. Env comes from `backend/.env`.
   Because this is a single long-lived process, two things in the code are safe that would NOT be safe on serverless or multi-instance: `@Cron` in `appointment-reminder.service.ts` (fires reliably, no duplicates) and the in-memory rxjs `Subject` in `sse.service.ts` (all clients share one process). **If you ever add a second instance, both break** — the cron will double-send reminders and SSE events will not cross instances.
2. **PM2** (`ecosystem.config.cjs`) — stale, references a Nuxt-style `.output/server/index.mjs`; the frontend is a Vite SPA. Does not work as-is.
3. ~~**Vercel**~~ — removed 2026-09-18 (deployment no longer existed; the stale config kept causing wrong conclusions about cron and SSE). Restore with `git checkout 18d0a92 -- backend/vercel.json backend/api/index.ts` if ever needed. `frontend/vercel.json` is kept (inert SPA rewrites).

The backend port differs between contexts (3000 in Docker, 3001 local). When fixing CORS, redirects, or links between services, confirm which one is in play.
