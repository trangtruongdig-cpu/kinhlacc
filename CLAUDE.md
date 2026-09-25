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

Auth uses `@nestjs/passport` JWT. `JwtStrategy` lives in `src/middlewares/auth/jwt.strategy.ts`; `JwtAuthGuard` in the same folder. `JWT_SECRET` is **mandatory** — `requireJwtSecret()` (`jwt-secret.util.ts`) throws at boot if it is unset. (The old `'fallback_secret_key'` fallback is gone.)

### Phân quyền — BA tầng, đừng nhầm tầng

1. **`JwtAuthGuard` là APP_GUARD toàn cục** (`app.module.ts`) → mọi route đòi token, trừ route gắn `@Public()` (39 route: landing, tra cứu, lịch .ics…).
2. **Token bệnh nhân cũng là token hợp lệ.** `patient-auth` cấp token `role:'patient'` (không có `kind:'staff'`). Vì vậy "có JwtAuthGuard" **không** có nghĩa là "chỉ nhân viên vào được" — đây là chỗ từng hở 85 route ghi.
3. Nên: **mọi route GHI (POST/PUT/PATCH/DELETE) phải có `@UseGuards(NhanVienGuard)`**, trừ khi bệnh nhân thực sự cần gọi — khi đó dùng `assertStaffOrOwner(req.user, ownerId)` (`access.util.ts`) để bệnh nhân chỉ đụng được dữ liệu của chính mình.

Kiểu của `req.user` là `NguoiDungDaXacThuc` / `RequestDaXacThuc` trong `access.util.ts` — đừng nhận `req: any`.

Phép kiểm cho tầng này: `npm test -- access.util`.

### Kiểm đầu vào

DTO là *type* TS thuần nên biến mất khi biên dịch — không có gì kiểm thân request. Các endpoint đụng tới người bệnh (phiếu đo, hồ sơ, đăng nhập/đăng ký) đã gắn `@Body(new ZodPipe(<lược đồ>))`; lược đồ ở `src/models/validation.schema.ts`, pipe ở `src/middlewares/validation/zod.pipe.ts`. Lược đồ dùng `.strict()` để chặn cả trường thừa. **Endpoint ghi mới nên gắn lược đồ ngay từ đầu** thay vì kiểm tay trong controller.

### Database env vars

`AppModule` accepts either naming convention; both are checked:

- `DATABASE_URL` or `POSTGRES_URL` (single connection string), OR
- `DB_HOST`/`POSTGRES_HOST`, `DB_PORT`/`POSTGRES_PORT`, `DB_USER`/`POSTGRES_USER`, `DB_PASSWORD`/`POSTGRES_PASSWORD`, `DB_NAME`/`POSTGRES_DATABASE`
- `DB_SSL=false` to disable SSL (default is `rejectUnauthorized: false`)
- `DB_SYNCHRONIZE=true` to enable TypeORM auto-sync (default off — keep it off in shared environments)

Connection pool tự nhận môi trường: `max: 1` + idle 1s khi có `VERCEL`/`AWS_LAMBDA_FUNCTION_NAME`, ngược lại `max: 10` + idle 30s + keepAlive (đè bằng `DB_POOL_MAX`, `DB_IDLE_TIMEOUT_MS`).

TLS tới Postgres (`src/utils/db-ssl.util.ts`): xác minh chứng chỉ máy chủ được bật khi có cert, đọc theo thứ tự `DB_CA_CERT` (nội dung PEM) → `DB_CA_CERT_FILE` (đường dẫn) → **`CA_CERTIFICATE`** — tên Aiven tự đặt và là tên **đang có sẵn trong `backend/.env`**, nên trên môi trường thật xác minh bật mà không cần cấu hình thêm. Không có cert nào thì vẫn chạy nhưng rơi về `rejectUnauthorized: false` và ghi cảnh báo mỗi lần khởi động.

Lưu ý về `backend/.env`: dùng `DB_HOST`/`DB_PORT`/`DB_USER`/`DB_PASSWORD`/`DB_NAME`, **không có** `DATABASE_URL`. `CA_CERTIFICATE` là PEM nhiều dòng đặt trong nháy kép — **đừng `source` cả file .env trong shell**, phải lọc dòng.

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

### Tab "Góp Ý & Lỗi" (`su-co`) — tự phát hiện, báo và dựng hồ sơ sửa lỗi

Đặc tả đầy đủ: `docs/superpowers/specs/2026-09-25-tab-gop-y-loi-design.md`.

Bốn nguồn tín hiệu đều đổ vào MỘT cửa `POST /su-co/bao` (công khai, có trần theo IP), nên luật
che dữ liệu và luật gom cụm chỉ viết một lần ở `backend/src/utils/su-co-van-tay.util.ts`:

| Nguồn | Nơi bắt |
|---|---|
| Lỗi backend 5xx | `middlewares/su-co.filter.ts` (kế thừa `BaseExceptionFilter`, đăng ký bằng `APP_FILTER`) |
| Lỗi frontend | `frontend/src/lib/baoSuCo.ts` + móc trong `main.ts` và `services/api.ts` |
| Góp ý người dùng | `frontend/src/components/NutBaoLoi.vue` |
| Tín hiệu UX (API chậm, rage-click) | cùng `baoSuCo.ts` |

**Phải biết trước khi sửa:**

- **Gom cụm bằng vân tay** `sha1(loai|route_chuan|thong_diep_chuan)`. Chuẩn hoá (`/patients/123`
  → `/patients/:id`, bỏ số trong thông điệp) là thứ giữ cho bảng khỏi thành rác. Có bộ test
  riêng: `npm test --prefix backend -- su-co-van-tay`. **Sửa phần chuẩn hoá là đổi vân tay của
  MỌI cụm cũ** — chúng sẽ tách đôi thành cụm cũ (đứng im) và cụm mới.
- **Bộ lọc lỗi KHÔNG tự dựng phản hồi**, nó gọi `super.catch()`. Định dạng thân lỗi đang được
  frontend đọc (màn đăng nhập phân biệt 401 "sai mật khẩu" với 502 "máy chủ sập" bằng chính
  thân bài đó). Tự viết catch-all rất dễ làm lệch mà không ai biết cho tới khi có người không
  đăng nhập được.
- **Chống bão sự kiện có ở CẢ hai đầu**: máy khách 5 lần/vân tay/phiên và 20 sự kiện/phiên;
  máy chủ ngừng chèn dòng chi tiết khi cụm vượt 200 lần/giờ (bộ đếm nằm trong bộ nhớ — chỉ
  đúng khi chạy MỘT tiến trình; thêm bản thứ hai là mất tác dụng).
- **`baoSuCo.ts` không bao giờ được ném lỗi và không bao giờ báo lỗi của chính `/su-co/*`** —
  đó là chỗ sinh vòng lặp vô tận khi backend sập.
- **Che dữ liệu chạy hai lớp** (máy khách rồi máy chủ). Người dùng lưu dưới dạng băm với muối
  `JWT_SECRET`. Cố ý KHÔNG che khoá `ten` — ở app này `ten` hầu hết là tên vị thuốc/huyệt.
- Tab khoá bằng `meta.page: 'su-co'` KHÔNG có trong `constants/pages.ts`, nên `authStore.can()`
  chỉ trả true cho vai trò Quản Trị. API dùng `QuanTriGuard`. Riêng `POST /su-co/bao` phải công
  khai vì lỗi hay xảy ra nhất lại ở trang đăng nhập và các trang công khai.
- Telegram chỉ bật khi có `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`; push nhân viên cần
  `admins.fcm_token` (đăng ký qua nút trong tab). Thiếu cấu hình thì cả hai NẰM IM, không lỗi.

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
npm run build              # nest build → dist/ (SWC: KHÔNG kiểm kiểu)
npm run type-check         # tsc -p tsconfig.check.json — phép kiểm kiểu THẬT
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

## Thư viện từ điển: CMS là KHO, trang phục vụ khách là HTML TĨNH

⚠️ Mục này thay cho mô tả cũ ("nội dung sống trong CMS, nginx đưa thẳng sang container
cms"). Cách đó đã bị **revert** ở `bfe350e` theo yêu cầu của người dùng: *"làm lại y như
cũ cho tôi, rồi mới cắm CMS vào để quản lý"*. Ai còn đọc theo bản cũ sẽ chẩn đoán sai —
đã xảy ra một lần: một phiên khác thấy CMS trả 404 cho `/huyet/…` và tưởng hỏng kết nối
CSDL, trong khi route đó đơn giản là không còn tồn tại.

**Kiến trúc thật (cách A — đổi nguồn ở khâu build):**

- Khách xem **HTML tĩnh** trong `frontend/dist/`, do `frontend/scripts/build-*.mjs` sinh.
  nginx `try_files $uri $uri/ /index.html` phục vụ thẳng.
- nginx CHỈ đẩy sang container cms ba đường: `/_emdash/`, `/_astro/`, `/trang/`.
  **Không** có đường thư viện nào.
- CMS là **kho dữ liệu cho khâu build**. `acupoints.js` và `benh.js` đã do CMS sinh ra;
  phép kiểm là `cmp` với bản gốc phải giống **từng byte**
  (`cms/scripts-di-cu/xuat-huyet-js.mjs --kiem`, `xuat-benh-js.mjs --kiem`).
- Giao diện (`TuDienView.vue` và bạn bè) **không được đụng vào**. Ba lần thử dựng lại
  giao diện trong CMS đều bị bác.

**Hai kiểu trang tĩnh, đừng lẫn:**

| Kiểu | Đường | Sinh bởi | Có mount Vue? |
|---|---|---|---|
| Độc lập | `/huyet/` `/kinh/` `/benh-hoc/` `/cham-cuu-tri-benh/` `/nguon/` | `build-dict`, `build-nguon` | **Không** |
| Vỏ SPA | `/bai-thuoc/` `/duoc-lieu/` | `build-phuong`, `build-duoc-lieu` | Có (`<div id="app">`) |

Trang độc lập không cần route Vue. Trang vỏ SPA thì **bắt buộc** phải có route Vue khớp,
không thì tải trang ra nội dung tĩnh còn bấm link ra 404.

`/duoc-lieu/nhom/…` (61 URL) do `build-nhom-duoc-ly.mjs` sinh, vẫn tĩnh.
`gen-sitemap.mjs` + `kiem-sitemap.mjs` là cổng chặn số lượng URL.

Tầng tra cứu trong CMS (ô tìm, lọc đặc tính, duyệt A–Z) nằm ở `cms/sql/chi-muc-tra-cuu.sql`
+ `cms/src/lib/traCuu.ts`. `search()` của EmDash KHÔNG dùng được: FTS5 là của SQLite, trên
Postgres nó là lệnh rỗng — không báo lỗi, chỉ trả về rỗng.

Thêm cột nội dung mới cho một bộ thì phải khai tên cột vào mảng `than` trong
`cms/scripts-di-cu/dung-chi-muc.mjs` rồi chạy lại, không thì nội dung mới hiện trên
trang mà tra không bao giờ ra.

## Cắm CMS: ba tệp SINH LẠI, hai bộ ĐẨY SANG

Năm bộ nội dung đi hai đường khác nhau, đừng lẫn.

**Sinh lại tệp tĩnh** (huyệt vị, hai bộ bệnh, kinh mạch) — CMS là nguồn, chạy
`cms/scripts-di-cu/xuat-{huyet,benh,meridians}-js.mjs`. Mỗi bộ có HAI chốt:

- `--kiem` so sâu cả đối tượng với tệp đang dùng. ⚠️ Nó khớp theo id nên **không bắt
  được thứ tự bản ghi** — chỉ `cmp` mới bắt. Đã cắn một lần ở `benh.js`.
- `--kiem-goc` so với BẢN GỐC trong git theo TẬP CON: khoá gốc phải còn nguyên, khoá
  MỚI được phép. Chốt này sống lâu hơn `cmp`, vốn hết vai trò ngay khi có ai cố ý thêm
  trường. Mốc của mỗi tệp KHÁC NHAU, khai ở `kiem-goc.mjs` — `meridians.js` neo vào
  `d01a26e` chứ không phải `c7a2652`, vì d01a26e sửa tên huyệt thật.

**Đẩy sang DB app** (dược liệu, bài thuốc) — hai bộ này không có tệp tĩnh, chúng nằm
thẳng trong `vi_thuoc` / `phuong_thang`. `cms/scripts-di-cu/dong-bo-app.mjs` đẩy MỘT
CHIỀU CMS → app.

⚠️ **Đây là tệp duy nhất trong `cms/` ghi vào DB mà phòng chẩn trị đang dùng.** Chạy thử
là mặc định, phải `--ghi` mới ghi thật; ghi trong một giao dịch; trần an toàn 300 ô/lượt
và 20 ô bị làm rỗng.

Tính chất nền móng: **chưa ai sửa gì thì đồng bộ phải ra ĐÚNG 0 ô.** Có thế thì mỗi ô
hiện ra trong chế độ thử mới đọc được là "người biên tập đã sửa" chứ không phải "lỗi
chuyển đổi". Nếu một hôm `--thu` in ra hàng trăm dòng thì **đừng `--ghi`** — hãy đi tìm
lỗi chuyển đổi trước.

KHÔNG đồng bộ, và đây là giới hạn đã biết chứ không phải bỏ sót: `ten_khac` của dược
liệu (bản nhập GỘP cột `vi_thuoc.ten_khac` với bảng `vi_thuoc_ten_goi_khac`, ghi ngược
là app hiện hai lần), và các trường dựa trên bảng liên kết (`cong_dung_ds`,
`kieng_ky_ds`, chủ trị dạng danh sách, kinh mạch) — app lưu bằng KHOÁ NGOẠI tới bảng
tra cứu dùng chung, ghi ngược từ chuỗi sẽ tự tạo mục tra cứu mới mỗi khi có lỗi gõ.
**Sửa những trường đó trong CMS sẽ không tới app.**

## SEO: hai chốt chặn, và chỗ người biên tập sửa được

Thẻ SEO của 18.425 trang tĩnh ráp ở `frontend/scripts/seo-html.mjs`, nội dung do từng
builder tự sinh. Người biên tập ghi đè được qua bảng `_emdash_seo` của EmDash
(`seo_title`, `seo_description`, `seo_image`, `seo_canonical`, `seo_no_index`) — mọi bộ
đều khai `hasSeo: true` nên trang quản trị đã có ô nhập sẵn.

- `frontend/scripts/seo-cms.mjs` là khâu nối. Nó mở kết nối RIÊNG tới `kinhlac_cms`
  (builder nối `defaultdb`, hai kho không join chéo được) và đóng ngay — Aiven chỉ 20
  slot. Ô nào để trống thì GIỮ bản tự sinh: ghi đè là bổ sung, không phải thay thế.
- Không nối được kho thì **không gãy build nhưng KÊU TO**. Im lặng ở đây nghĩa là mọi
  trang lặng lẽ quay về mô tả tự sinh mà không ai biết.
- Tra bằng CẢ `slug` lẫn `slug_goc`: builder đọc tệp tĩnh nên cầm slug THÔ, CMS lấy bản
  KHỬ TRÙNG làm khoá.

Hai chốt chạy cuối `npm run blog:post`, **cả hai đều gãy build khi không đạt**:

- `kiem-sitemap.mjs` — đếm URL theo nhóm. Có vì các builder đều "bỏ qua, build vẫn tiếp
  tục" khi mất kết nối, và đã giấu lỗi mất 15.054 trang suốt nhiều tháng.
- `kiem-seo.mjs` — 9 phép kiểm thẻ. Năm phép TUYỆT ĐỐI (ngưỡng 0): thiếu
  title/description/canonical/JSON-LD, và **canonical trỏ lệch** chính đường dẫn của nó.
  Bốn phép TỈ LỆ (mô tả quá dài/ngắn, tiêu đề/mô tả trùng) đặt theo số đo thật.
  ⚠️ Sửa được thật thì phải HẠ ngưỡng xuống theo, không thì chốt hết tác dụng canh chừng.

Liên kết nội bộ sinh bằng MÃ, không quản trong CMS (không ai bảo trì tay nổi 18.425
trang): engine nối tên huyệt trong thân bài (`build-dict.mjs`), thành phần bài thuốc →
dược liệu, và `/nguon/` ↔ bài thuốc/vị thuốc qua bảng nối `nguon_phuong_thang` /
`nguon_vi_thuoc` (33.516 liên kết). **Đừng khớp xuất xứ bằng chuỗi** — cột `xuat_xu` có
3.217 biến thể cho cùng chừng ấy sách.

## Deployment paths

**Only ONE deployment is live: Docker Compose on a VPS.** Verified 2026-09-18 — `kinhlac.online` serves the app; `kinhlac.vercel.app` returns `DEPLOYMENT_NOT_FOUND`.

1. **Docker Compose** (`docker-compose.yml`, `DEPLOYMENT.md`) — **THE LIVE ONE**. nginx serves the SPA and proxies `/api/` to the backend container (`proxy_buffering off`, `proxy_read_timeout 600s` — required for SSE). Postgres is external (Aiven), not in Docker. Env comes from `backend/.env`.
   Because this is a single long-lived process, two things in the code are safe that would NOT be safe on serverless or multi-instance: `@Cron` in `appointment-reminder.service.ts` (fires reliably, no duplicates) and the in-memory rxjs `Subject` in `sse.service.ts` (all clients share one process). **If you ever add a second instance, both break** — the cron will double-send reminders and SSE events will not cross instances.
2. **PM2** (`ecosystem.config.cjs`) — stale, references a Nuxt-style `.output/server/index.mjs`; the frontend is a Vite SPA. Does not work as-is.
3. ~~**Vercel**~~ — removed 2026-09-18 (deployment no longer existed; the stale config kept causing wrong conclusions about cron and SSE). Restore with `git checkout 18d0a92 -- backend/vercel.json backend/api/index.ts` if ever needed. `frontend/vercel.json` is kept (inert SPA rewrites).

The backend port differs between contexts (3000 in Docker, 3001 local). When fixing CORS, redirects, or links between services, confirm which one is in play.
