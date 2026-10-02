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

### Đăng nhập một lần sang khu quản trị nội dung (CMS)

Đặc tả đầy đủ: `docs/superpowers/specs/2026-09-26-dang-nhap-mot-lan-cms-design.md`.

Người đã đăng nhập app và có quyền **Biên Tập Nội Dung** (`bien-tap-noi-dung` → Editor 40)
hoặc **Quản Trị Nội Dung** (`quan-tri-noi-dung` → Admin 50) vào thẳng `/_emdash/admin/`,
không phải đăng nhập lần hai. Vai trò có `laQuanTri` luôn là Admin CMS. Hai khoá này nằm
trong `APP_PAGES` (`frontend/src/constants/pages.ts`) nên tab Quản Lý Người Dùng tự dựng ô
tick — **chúng KHÔNG phải trang của app**, đặt ở đó là có chủ ý.

Đường đi: thanh bên → `/vao-cms` (`VaoCmsView.vue`) → `POST /auth/ve-cms` (vé JWT 60 giây,
dùng một lần, ký bằng `CMS_SSO_SECRET`) → `POST /_emdash/api/auth/kinhlac/vao` → CMS lập
phiên → `/_emdash/admin/`. Luật đổi quyền ở `backend/src/utils/ve-cms.util.ts`
(`npm test --prefix backend -- ve-cms`), phần CMS ở `cms/src/auth-kinhlac/`.

**Phải biết trước khi sửa:**

- **`X-EmDash-Request: 1` trong lời gọi fetch là thứ CHỊU LỰC, không phải cho đẹp.** Bỏ nó
  đi thì máy dev vẫn chạy ngon còn production trả **403 CSRF_REJECTED**. EmDash so `Origin`
  với origin của chính request; trình duyệt gửi `https://…` còn CMS sau Caddy+nginx thấy
  mình là `http://…` (`@astrojs/node` không đọc `X-Forwarded-Proto` — cùng gốc rễ với ghi
  chú `EMDASH_SITE_URL` trong `docker-compose.yml`). Đã đo cả hai chiều.
- **Dùng `authProviders` chứ KHÔNG dùng `auth:`.** `auth:` là chế độ xác thực trong suốt,
  ở production nó nuốt luôn `/_emdash/admin/login` → mất passkey → app backend sập là không
  ai vào được CMS nữa. `authProviders` chỉ THÊM một nút.
- **`CMS_SSO_SECRET` phải giống hệt ở `backend/.env` và `cms/.env`**, và cố ý KHÔNG dùng lại
  `JWT_SECRET`: CMS bị chiếm thì kẻ tấn công chỉ đúc được vé CMS, không đúc được token app.
  Thiếu biến thì cả hai đầu trả 503 kèm lý do — không nằm im.
- **Sổ chống dùng lại vé nằm trong bộ nhớ tiến trình** — chỉ đúng khi chạy MỘT container,
  cùng lý lẽ với `@Cron` và `sse.service`.
- **Thu hồi quyền không đá người đang mở CMS ra ngay** (phiên EmDash sống độc lập); muốn
  chặn tức thì thì đặt `users.disabled = 1` bên CMS — khoá bên CMS thắng quyền bên app.
- Nghiệm thu phải chạy trên **bản dựng** (`node ./dist/server/entry.mjs`), không phải
  `astro dev`: middleware của EmDash có nhánh DEV đi đường khác hẳn.

### Kiểm đầu vào

DTO là *type* TS thuần nên biến mất khi biên dịch — không có gì kiểm thân request. Các endpoint đụng tới người bệnh (phiếu đo, hồ sơ, đăng nhập/đăng ký) đã gắn `@Body(new ZodPipe(<lược đồ>))`; lược đồ ở `src/models/validation.schema.ts`, pipe ở `src/middlewares/validation/zod.pipe.ts`. Lược đồ dùng `.strict()` để chặn cả trường thừa. **Endpoint ghi mới nên gắn lược đồ ngay từ đầu** thay vì kiểm tay trong controller.

### Database env vars

`AppModule` accepts either naming convention; both are checked:

- `DATABASE_URL` or `POSTGRES_URL` (single connection string), OR
- `DB_HOST`/`POSTGRES_HOST`, `DB_PORT`/`POSTGRES_PORT`, `DB_USER`/`POSTGRES_USER`, `DB_PASSWORD`/`POSTGRES_PASSWORD`, `DB_NAME`/`POSTGRES_DATABASE`
- `DB_SSL=false` to disable SSL (default is `rejectUnauthorized: false`)
- `DB_SYNCHRONIZE=true` to enable TypeORM auto-sync (default off — keep it off in shared environments)

Connection pool tự nhận môi trường: `max: 1` + idle 1s khi có `VERCEL`/`AWS_LAMBDA_FUNCTION_NAME`, ngược lại `max: 10` + idle 30s + keepAlive (đè bằng `DB_POOL_MAX`, `DB_IDLE_TIMEOUT_MS`).

⚠️ **Trần Aiven là 20, nhưng hệ thống của chính Aiven đã ăn 8** (đo 29/09/2026) — thực tế
chỉ còn ~11 slot cho tất cả. Production để mặc định `max: 10`; máy dev chạy thêm một
backend nữa với `max: 10` là vượt trần, và **production** nhận `remaining connection slots
are reserved for roles with the SUPERUSER attribute` chứ không phải máy dev. Đã xảy ra
thật lúc 00:42 ngày 29/09, bắt được qua tab Góp Ý & Lỗi.

Nên `backend/.env` của máy dev đặt `DB_POOL_MAX=3`. Và nhớ: mỗi script `.mjs`/`ts-node`
chạy tay cũng mở thêm một kết nối — chạy năm script song song là năm slot.

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

### Bot thẩm định thư viện — lớp 1 và 2 ĐÃ CHẠY, đường ghi vào kho ĐÃ MỞ, lớp 3 chưa

Thiết kế: `docs/superpowers/specs/2026-09-25-bot-tham-dinh-thu-vien-design.md`.
Kế hoạch 1: `docs/superpowers/plans/2026-09-25-bot-tham-dinh-lop-1.md` (xong).
Kế hoạch 2: `docs/superpowers/plans/2026-09-26-bot-tham-dinh-lop-2.md` (xong; bộ luật văn
phong bản 5, 13 điều, đã duyệt).
Kế hoạch 3: `docs/superpowers/plans/2026-09-27-bot-tham-dinh-lop-3-duyet.md` (xong phần
backend + màn duyệt bản gọn; còn tô trích dẫn và chip nguồn trong tab Góp Ý & Lỗi).

Lớp 1 quét 18.416 mục, KHÔNG gọi mô hình ngôn ngữ, ghi bệnh án vào hai bảng
`td_ho_so` / `td_nhan_xet` **ở `kinhlac_cms`** (không phải `defaultdb`, nên
`SchemaBootstrapService` không dựng được — service tự chạy DDL idempotent của mình).
Cụm việc nộp thẳng vào tab Góp Ý & Lỗi qua `SuCoService.ghiNhanLo()`, lane `gop_y`.

Cần `CMS_DB_HOST/PORT/USER/PASSWORD/NAME` trong `backend/.env`; thiếu thì bot **nằm im**,
không lỗi. API: `POST /tham-dinh/chay`, `/chay-thu` (50 mục), `GET /tham-dinh/trang-thai`
— tất cả sau `QuanTriGuard`. Cron 02:00.

**Bốn điều đã trả giá, đừng lặp:**

- **`td_chu()` NUỐT TRẮNG `ec_bai_thuoc.thanh_phan`.** Cột đó là mảng object
  `[{id, ten, lieu}, …]`, 13.889 bài có dữ liệu, td_chu rút ra **0 chữ** — không lỗi,
  không cảnh báo. Bot vì thế có bộ rút chữ riêng `utils/tham-dinh-rut-chu.util.ts`;
  `docLoMuc` lấy `to_jsonb()` thô rồi rút ở phía Node. Đừng "đơn giản hoá" nó về td_chu.
- **Route của cụm phải là đường của BỘ** (`/huyet/`), không kèm slug. `chuanHoaRoute`
  chỉ thay SỐ bằng `:id`; kèm slug là 484 mục thành 484 cụm.
- **`ghiNhanLo` chỉ xử lý `slice(0, 50)`** rồi thôi, không đếm phần dư. Nộp cụm phải
  chia lô — `ThamDinhService.nopCum` làm sẵn.
- **`@nestjs/schedule` v12 là ESM thuần**, jest của repo chạy CJS. Spec nào chạm vào
  chuỗi import có nó (kể cả gián tiếp qua `su-co.controller`) phải
  `jest.mock('@nestjs/schedule', …)`, không thì gãy ngay khâu parse.

Phép dò chạy trên 18.416 mục thì mẫu quá rộng **không** cho ra "vài cảnh báo thừa" — nó
cho ra một cụm việc giả đứng đầu bảng. Lượt nghiệm thu đầu vu oan 47/50 mục
(`Ôn cứu` → tcvn3, `0,5 thốn` → lỗi dấu câu). Mọi lần sửa phép dò: đọc `trich_dan`
thật trong `td_nhan_xet` trước khi tin con số.

**Số đo lượt quét cả kho đầu tiên (26/09/2026):** 18.416 mục trong **2 phút 30**, 0 sót,
65.321 nhận xét → **110 cụm**. Hạng: 13.604 tạm được · 3.022 yếu · 1.744 hỏng · 46 tốt.
Ba việc lớn nhất: `lien_ket_dung_duoc` 13.670 bài (đầu vào cho bậc 1 của lớp 2),
`ten_vi_la` 11.918, `tron_truong` 4.212 — con số cuối khớp độc lập với nợ cũ đã ghi
("4.140 bài có `cach_dung` trống vì nội dung bị nhét sang chỗ khác").

Lỗi mã hoá còn sót toàn kho chỉ **21 nhận xét**, và đều thật: `tạp chíÕ số 43/1985`,
`Ã 1"`, `Đđ¼yđHT`, `Ung thư dĩ溃`, `Nội服 quá liều`. Tức `audit-rac-tu-dien.sql` báo
D1–D6 bằng 0 mà vẫn còn ngần ấy — hai bộ dò không cùng tiêu chí, đừng coi cái này thay
được cái kia.

⚠️ **Ghi bệnh án phải theo LÔ.** RTT tới Aiven 88ms; ghi lẻ từng mục tốn 8 lượt đi-về và
cả kho mất **3 giờ** (đã đo). `ghiHoSoLo` gói 200 mục vào 3 lượt trong một giao dịch.

Nghiệm thu: `node backend/tmp/nghiem-thu-tham-dinh.mjs` (chỉ đọc).

**Lớp 2 — thầy thuốc (LLM).** `POST /tham-dinh/lap-thuoc` rút bộ luật văn phong từ 10 mục
viết đạt (`ThamDinhThayThuocService.MUC_MAU`), lưu vào `td_luat_van_phong` ở trạng thái
CHỜ DUYỆT. `POST /tham-dinh/bo-luat/:phienBan/duyet` mới bật được ca soi
(`POST /tham-dinh/soi-ky`) — `docBoLuat(true)` chỉ lấy bản đã duyệt, nên **thước chưa duyệt
thì lớp 2 nằm im**. Cron 03:00.

Hai tầng model: `YESCALE_MODEL` (gemini-2.5-flash-lite) sàng, `THAM_DINH_MODEL_KY`
(claude-sonnet-5) đọc kỹ `THAM_DINH_SO_MUC_KY` mục đầu hàng đợi. Trần
`THAM_DINH_TRAN_TIEN` tính bằng SỐ LƯỢT GỌI, và lượt HỎNG vẫn tính — không đếm nó thì một
sự cố bên nhà cung cấp thành vòng lặp gọi vô hạn.

**Bốn điều của lớp 2 phải nhớ:**

- **SDK `openai` BỎ thân phản hồi của model Claude.** Yescale gắn `Content-Type: text/plain`
  cho Claude (Gemini và GPT thì `application/json`), SDK chỉ parse khi là JSON — nên lời
  gọi trông y như "mô hình không trả lời" dù thân JSON hợp lệ và đã bị tính tiền. Bot
  `.asResponse()` rồi tự parse (`noiDungTuThan`). Đừng "đơn giản hoá" về `create()` trần.
- **Timeout phải khai tay.** Mặc định SDK là 600s × 2 lần thử lại; đã đo một lượt treo
  2005 giây khi mạng chập. Bot đặt `timeout: 180_000`, `maxRetries: 1`.
- **Vân tay lớp 2 là cột RIÊNG** (`van_tay_thay_thuoc`). `van_tay_noi_dung` bị lớp 1 ghi đè
  mỗi đêm; lấy nó làm mốc thì van tiết kiệm tiền không bao giờ đóng.
- **Rào chắn chống bịa: trích dẫn phải KHỚP NGUYÊN VĂN** một đoạn trong thân bài (so sau khi
  gộp khoảng trắng, tìm khắp mọi trường). Không khớp thì loại ở khâu ghi. Bậc căn cứ 2 (y
  văn từ trí nhớ mô hình) bị cấm kể cả khi dẫn được tên sách. Tỉ lệ loại cao là tín hiệu
  lời nhắc chưa rõ, **không phải** lý do nới rào.

⚠️ **Tự sửa phải qua HAI cổng, và cổng thứ hai mới là cổng hỏi đúng câu.** `chiKhacHinhThuc`
hỏi "bản sửa có đụng vào chữ không"; `sauKhiSuaConLoi` hỏi "sửa xong phép dò còn bắt được
không". Thiếu cổng hai thì bản biến `,,` thành `, ,` đi qua êm ru — xấu hơn gốc mà vẫn được
ghi, vì cổng một bóc sạch dấu câu nên thấy hai bản y như nhau. Đã ghi như thế vào 20 mục
(đo 30/09/2026); chúng tự lành ở lượt quét đêm sau vì phép dò bắt lại được dạng `, ,`.
Cổng hai dùng lại `doChu` chứ không sao chép biểu thức — hai bản sao sẽ lệch, và lúc đó cổng
lại gác một tiêu chí khác với phép dò. Phép kiểm: `npm test -- sua-hinh-thuc`.

**Duyệt và áp bản sửa.** `/app/tham-dinh` (Quản Trị). `POST /tham-dinh/nhan-xet/:id/ap` là
chỗ **DUY NHẤT** trong cả bot ghi vào `ec_*`, và chỉ chạy khi có người bấm. Một giao dịch:
ghi `revisions` trước → `UPDATE` cột + `version + 1` → để trigger `td_tr` dựng lại chỉ mục.

⚠️ **Áp bản sửa khó hơn trông thấy, và ba lượt thử đầu đều thất bại vì ba lý do khác nhau:**

- `rutChu` gộp khoảng trắng khi đưa bài cho mô hình, nên trích dẫn về tay ta ĐÃ GỘP còn
  span gốc thì không. Phải dựng bản đồ chỉ số để cắt đúng đoạn trong gốc.
- Trích dẫn thường **trải qua nhiều khối Portable Text** (rutChu nối khối bằng khoảng
  trắng nên mô hình đọc liền một câu). Không span nào chứa trọn → phải áp theo đoạn KHÁC
  BIỆT, và chỉ trong span là đoạn con của trích dẫn.
- Một lời phê mang **nhiều thay đổi rải rác**. Phải diff theo từ, gộp cụm cách nhau ≤3
  token, áp từng đoạn.

⚠️ **HOẶC TRỌN VẸN, HOẶC KHÔNG GÌ.** Áp được 2/3 đoạn thì rollback và bảo người duyệt sửa
tay. Ghi một nửa rồi báo thành công là để họ tưởng bản sửa đã vào đủ. Đoạn quá ngắn để định
vị (vd "ẩu" hai ký tự) được **đánh dấu** chứ không lọc lặng, đúng vì lý do đó.

Nghiệm thu: `node backend/tmp/nghiem-thu-ap.mjs` (chỉ đọc) — kiểm `version`, `revisions`
giữ bản cũ, và tra cứu ra chữ mới (tức trigger đã chạy).

**Đường soi KHÔNG tốn tiền API: `backend/tmp/tham-dinh-thu-cong.ts`.** Bot dựng hồ sơ,
Claude Code trong phiên đọc và phê — thay cho lượt gọi `claude-sonnet-5` qua Yescale.

```bash
npx ts-node tmp/tham-dinh-thu-cong.ts --xuat 3 --cat 4000 > /tmp/ho-so.md
# Claude đọc, viết /tmp/loi-phe.json theo mẫu in sẵn trong hồ sơ
npx ts-node tmp/tham-dinh-thu-cong.ts --nap /tmp/loi-phe.json
```

⚠️ Lời phê của Claude Code đi qua **ĐÚNG** rào chắn như lời phê của mô hình API: `locLoiPhe`
kiểm trích dẫn khớp nguyên văn, cấm bậc căn cứ 2, điều luật phải có thật. Đã thử cố ý bịa
một trích dẫn — bị loại đúng lý do. Đừng mở đường vòng cho "người nhà": rào chắn mất tác
dụng ngay khi có một lối đi tránh nó.

⚠️ **Hồ sơ rất lớn.** Đo thật: 2 mục bệnh học không cắt ra 62KB, riêng "Tiêu Chảy" đã
30.202 ký tự. `--cat` mặc định 4000 ký tự mỗi trường là ĐÁNH ĐỔI (mất phần cuối bài), không
phải cải tiến. Soi kỹ cả bài thì xuất 1 mục một lượt với `--cat 0`.

**Bot TỰ SỬA lỗi hình thức (cron 04:00).** Đây là chỗ DUY NHẤT bot đổi nội dung mà không
có người bấm. Ba lớp chặn, phải qua cả ba:

1. Chỉ kiểu `dau_cau_sai` (`ThamDinhService.KIEU_TU_SUA`). Rác mã hoá KHÔNG nằm trong đó
   dù cũng là lỗi chữ: máy biết chữ hỏng nhưng không biết chữ đúng. Cả kho 21 chỗ — sửa
   tay nhanh hơn dạy máy đoán.
2. Bản sửa do LUẬT sinh (`suaHinhThuc`), không phải mô hình viết.
3. `chiKhacHinhThuc`: bỏ hết khoảng trắng và dấu câu khỏi hai bản thì phần chữ còn lại
   phải **giống hệt**. `"Bán hạ 6g" → "Bán hạ 8g"` bị chặn (liều là nội dung);
   `"bổ Thận khí" → "bổ thận khí"` bị chặn (tạng phủ viết hoa có nghĩa).

⚠️ Lớp 3 là lớp chịu lực, và lý do nó tồn tại rất cụ thể: lúc bàn chuyện tự sửa, phép dò
dấu câu đang **vu oan 2.604 lượt**. Không có nó thì 2.604 chỗ viết đúng đã bị sửa thành
sai trên 754 mục, và không ai đọc lại để biết. **Chưa đo tỉ lệ đúng của một phép dò thì
chưa được cho nó tự sửa.**

`POST /tham-dinh/tu-sua` mặc định CHẠY THỬ, phải `?ghi=1` mới ghi — cùng lối
`dong-bo-app.mjs`.

⚠️ **Ca soi phải NGHỈ giữa các lô** (`NGHI_GIUA_LO_MS`, 120ms). Không phải để chiều máy
chủ mà để không giành backend với người đang xem web. Đo thật 30/09/2026: trong lúc ca
chạy, `/demo/bai-thuoc/50` treo 12 giây rồi đứt; ca vừa xong thì chính nó trả 200 trong
10ms. Tab Góp Ý & Lỗi đã ghi hậu quả: **172 lần "failed to fetch" và 27 lần lỗi 500 ở các
trang `/demo/*`** — bot làm hỏng trang giới thiệu của chính mình.

**Nhịp tự hành (cron, chỉ chạy khi máy chủ bật — tức trên VPS, không phải máy dev):**

| Giờ | Việc | Tốn |
|---|---|---|
| 02:00 | Lớp 1 quét cả kho, nộp cụm việc vào Góp Ý & Lỗi | 0đ |
| 03:00 | Lớp 2 đọc kỹ `THAM_DINH_MOI_CA` mục đầu hàng đợi | vài đô/tháng |
| 04:00 | Tự sửa lỗi hình thức trong kho (chỉ `dau_cau_sai`, qua ba lớp chặn) | 0đ |
| 06:00 | `su-co` tự dựng hồ sơ chẩn đoán cho cụm lỗi mới (`SU_CO_TU_PHAN_TICH_MOI_CA`, mặc định 10) | vài xu |

Mỗi ca ghi một dòng vào `td_ca_soi`; khối "Bot làm gì gần đây" đầu màn `/app/tham-dinh`
đọc bảng đó. Không có nhật ký thì câu "đêm qua bot chạy chưa, có hỏng gì không" chỉ trả
lời được bằng cách đọc log container.

⚠️ Khối tổng kết đếm RIÊNG lớp `thay_thuoc`. Lớp `may` có 65.321 nhận xét và chúng đi qua
tab Góp Ý & Lỗi dưới dạng cụm việc chứ không qua màn duyệt — gộp chung thì màn hình báo
"65.321 lời phê chờ bạn duyệt".

⚠️ **Lập thước là chỗ dễ ra rác nhất.** Bốn lượt đầu cho ra bốn dạng điều luật vô dụng:
mô tả khung markdown của chính lời nhắc; luật ngược với câu mẫu của nó; chỉ mô tả mà không
phán được gì; và ra luật về in nghiêng/in đậm — thứ `rutChu` đã bóc sạch nên mô hình chỉ
đoán. Luôn đọc điều luật KÈM `viDu`: chỉ đọc phần luật thì cả bốn dạng đều trông hợp lý.
Điều nào bác thì sửa `MUC_MAU` hoặc `loiNhacLapThuoc()` rồi lập lại, **đừng sửa tay trong
CSDL** — lần chạy sau là mất.


### Cửa MCP cho claude.ai — `/api/mcp/<token>`

`routers/mcp.router.ts` + `controllers/mcp.controller.ts`. Sáu công cụ để hỏi và sai bot
thẩm định từ claude.ai (điện thoại cũng được). Cách cắm: `DEPLOYMENT.md`, mục "Cửa MCP".

**Phải biết trước khi sửa:**

- **KHÔNG công cụ nào ghi vào kho nội dung** — chỉ đọc và chạy ca. Ranh giới cố ý: đây là
  đường một dịch vụ BÊN NGOÀI gọi vào qua URL công khai. Áp bản sửa vẫn qua `/app/tham-dinh`.
- **`MCP_TOKEN` (64 ký tự, trong chính đường dẫn) là hàng rào DUY NHẤT.** Route buộc phải
  `@Public()` vì claude.ai không có JWT người dùng nào để gửi. Thiếu biến thì cửa trả **404**
  chứ không mở toang; so sánh token hằng thời gian. Phép kiểm: `npm test -- mcp.controller`.
- **CORS có miễn trừ riêng cho `/mcp/`** (`main.ts` dùng delegate theo đường dẫn). claude.ai
  gọi từ máy chủ của họ nên không khai trước được origin; allowlist cứng sẽ ném lỗi và người
  dùng chỉ thấy "không kết nối được", lý do thì nằm trong log backend. Miễn trừ hẹp:
  `credentials: false`, chỉ đúng `/mcp/`. Sửa chỗ này phải đo lại rằng `Origin` lạ trên route
  thường VẪN bị chặn.
- **Không giữ trạng thái** (`sessionIdGenerator: undefined`), nên thêm container thứ hai không
  hỏng — khác `@Cron` và `sse.service`.
- **Body phải truyền tay**: `transport.handleRequest(req, res, req.body)`. Bỏ tham số thứ ba
  thì transport tự đọc luồng, mà `express.json()` của Nest đã đọc xong — luồng rỗng, request
  treo tới khi claude.ai bỏ cuộc. Không có lỗi nào được ném.
- **SDK nạp bằng `require`**, không `import`: gói phát hành ESM+CJS kép và `import` tĩnh dưới
  SWC chết ở `exports` map.
- **`/.well-known/oauth-*` trả 404 ở nginx.** Máy khách MCP thăm dò đường đó trước khi kết
  nối; `try_files … /index.html` sẽ trả app shell kèm mã 200 — đúng cái bẫy "đường sai ra
  trang chủ, mã 200" ở mục thư viện bên dưới, chỉ khác là nạn nhân là máy.
- **Lưới `quyen-route-ghi.spec.ts` nay soi cả `@All`.** Trước đó nó chỉ soi
  `@Post|@Put|@Patch|@Delete`, nên một route `@All` công khai (nhận cả POST) lọt qua mà bài
  kiểm vẫn xanh. Đã vá cùng lúc với việc thêm cửa này.

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

⚠️ **MÃ WHO của trang huyệt lấy từ `p.code` của ĐƯỜNG KINH, không từ `IDX.points[].code`.**
`acu-index.js` có HAI nguồn mã và chúng lệch nhau: `codeToId` đủ 361 mã và đúng, còn
`points[].code` (bản sinh 08/09/2026, script sinh ra nó đã không còn trong repo) thiếu 30 mã
và sai 1 mã. Hậu quả đo được 02/10/2026: 30 trang huyệt mất cả hàng "Mã WHO" lẫn hai nút
"🧭 Xem Vị Trí Trên Đồ Hình 3D" / "📖 Xem Trên Đường Kinh" (Trung Phủ LU1, Thái Khê KI3,
Phế Du BL13, Trung Quản CV12, Hợp Cốc… — toàn huyệt lớn), và trang Khí Xung có đủ nút nhưng
**bay tới Hạ Cự Hư** vì đeo mã ST39. Tab Từ Điển trong app vốn đã đi đường đúng (`acuIdToCode`
dựng từ `p.code`) nên nhìn trong app thấy bình thường — chỉ trang tĩnh hỏng.
Phép kiểm: `node --test frontend/scripts/dict-ma-who.test.mjs` (4 chốt: đủ mã · mã khớp
`codeToId` · mã có toạ độ 3D · neo `#<mã>` có thật trên trang `/kinh/`).

⚠️ **Cờ rác chữ nay ĐO TỪ NỘI DUNG mỗi lần build (`coRacChu`), không đọc `corrupt` của
`acu-index.js` nữa.** Cờ cũ là ảnh chụp 08/09/2026, không tự cập nhật, nên sau đợt dọn rác
18/09 nó sai cả hai chiều: chôn noindex 33 trang bài đầy đủ (Hợp Cốc 6.092 ký tự, Quan Nguyên
6.385, Thừa Sơn, Phong Phủ, Thiếu Thương…) đồng thời bỏ sót mục còn rác thật. Sửa 02/10/2026:
noindex huyệt 398 → 366 (bật 33, tắt 1).

Phép dò cố ý HẸP — ở đây vu oan đắt hơn bỏ sót, vì một lần gắn nhầm là chôn vĩnh viễn một bài
y văn đầy đủ mà không ai đọc lại để biết. Số đo toàn kho 1.059 mục: 0 U+FFFD, 0 mojibake, 0
chữ Hán; chỉ còn 9 ký tự nhóm `¼½¾` mà **6 là phân số viết đúng** ("bỏ đi ¼, lấy ¾") — nên
luật TCVN3 đòi ký hiệu phải DÍNH LIỀN chữ/số. Đừng nới nó ra mà không đếm lại tỉ lệ vu oan.

Còn đúng **1 mục có rác thật**: Dương Trì (TE4) có đuôi `: 31v¼9:` ở mục GIẢI PHẪU → đang
noindex. Dọn một dòng đó trong CMS rồi chạy lại `cms/scripts-di-cu/xuat-huyet-js.mjs` là trang
tự bật lại, không phải sửa mã.

### `/blog/` — tĩnh trước, CMS đỡ sau, backend cũ đỡ chót (từ 01/10/2026)

Ngoại lệ DUY NHẤT của câu "không có đường thư viện nào sang CMS". Kế hoạch:
`docs/superpowers/plans/2026-10-01-ke-hoach-3-blog-len-cms.md`; vận hành: `DEPLOYMENT.md`,
mục "Blog: tĩnh trước, CMS đỡ sau".

- `/blog/<slug>/`: tệp tĩnh trong `dist/blog/` (11 bài cũ, y nguyên từng byte) → không có
  thì CMS dựng trực tiếp (`@blog_cms` — bài vừa Publish hiện ngay) → CMS trả 404 hoặc sập
  thì backend cũ (`@blog_render`, `seo-blog.router.ts`) → 404 thật.
- `/blog/` và `/blog/sitemap.xml` do CMS dựng; `/blog/` có bản tĩnh dự phòng khi CMS sập.
- ⚠️ **Sửa một trong 11 bài cũ trong CMS chưa đổi trang công khai** — bản tĩnh thắng, cho
  tới khi `build-blog` đọc từ CMS. Ai báo "sửa rồi mà trang không đổi" thì kiểm slug đó có
  thư mục trong `dist/blog/` không trước khi nghi bộ đệm.
- ⚠️ **`location /blog/` không bao giờ được thành `^~`.** `/blog/blog.css` là tệp MỌI trang
  tĩnh (~7.000 trang) nạp, và phải do khối regex đuôi tệp của nginx phục vụ.
- Không `proxy_cache` trên `/blog/`: IndexNow (plugin Rada SEO, chỉ trên VPS) chờ trang trả
  200 rồi mới báo, và bài gỡ phải biến mất ngay.
- Trang blog của CMS phải ra ĐÚNG khuôn bản tĩnh (`cms/src/lib/khung-blog.mjs` là bản chép
  của khuôn `build-blog.mjs` + `seo-html.mjs`, vì `cms/` build với context riêng nên không
  import được từ `frontend/`). Sửa khuôn một bên thì sửa bên kia.

`/duoc-lieu/nhom/…` (61 URL) do `build-nhom-duoc-ly.mjs` sinh, vẫn tĩnh.
`gen-sitemap.mjs` + `kiem-sitemap.mjs` là cổng chặn số lượng URL.

⚠️ **Nút "mở trang" trong trang quản trị CMS 404 ở local — đó là kiến trúc, không phải
lỗi.** Nút đó (`contentUrl()` của `@emdash-cms/admin`) dựng link TƯƠNG ĐỐI với origin của
chính CMS: lấy `url_pattern` của bộ, thiếu thì rơi về `/{tên_bộ}/{slug}`. Mà trang từ
điển là HTML tĩnh do nginx phục vụ, CMS không có route nào cho chúng — nên ở
`localhost:4321` nút ấy **luôn** 404, và trang 404 của CMS dùng chung layout blog nên
trông như trang chủ. Trước khi đi sửa, phân định bằng ba phép đo:

- `curl https://kinhlac.online/<đường-dẫn>/` — trên site thật link đúng phải ra 200.
- Bảng `_emdash_404_log` (`path`, `referrer`, `last_seen_at`) ghi đúng đường vừa bấm;
  `referrer = http://localhost:4321/…` là bằng chứng đang ở bản local.
- Dạng `/kinh_mach/than` (gạch dưới) = `url_pattern` chưa khai; dạng `/kinh/than/` = đã
  khai. Khai bằng `cms/scripts-di-cu/khai-url-pattern.mjs`.

Và nhớ: trên nginx site thật, đường sai kiểu `/nguon_y_van/<slug>` **không ra 404** mà ra
`index.html` của SPA (`try_files … /index.html`) — tức **ra trang chủ app, mã 200**. Lỗi
đường dẫn ở đó không bao giờ tự lộ ra.

⚠️ **SERVICE WORKER NUỐT TRANG TĨNH — và `curl` KHÔNG BAO GIỜ THẤY.** VitePWA
(`frontend/vite.config.ts`) đăng ký `NavigationRoute(createHandlerBoundToURL("index.html"))`
cho toàn scope `/`. Với người đã mở app một lần (service worker đã cài), MỌI trang không
thuộc SPA bị trả về app shell — tức **hiện ra trang chủ, mã 200**. Chặn bằng
`navigateFallbackDenylist`, và **mỗi nhóm trang tĩnh mới sinh ra PHẢI được thêm vào đó**.

Đã cắn HAI lần: 25/09/2026 nuốt khu quản trị CMS ("Quản Trị Nội Dung" ra trang chủ), rồi
26/09/2026 nuốt 2.045 trang `/nguon/` (danh sách lập lần trước bỏ sót đúng nhóm này).

Điều làm nó nguy hiểm là **không phép đo nào từ máy chủ bắt được**: `curl` không chạy
service worker, nên URL đúng, HTTP 200, HTML đúng nội dung, không redirect — tất cả đều
báo ĐẠT trong khi người thật vẫn thấy trang chủ. Googlebot cũng không chạy service worker
nên số liệu SEO im lặng luôn. Khi có người báo "bấm vào ra trang chủ" mà mọi phép đo đều
đạt, hãy nghi cái này TRƯỚC, đừng đi đo lại đường dẫn lần nữa.

Phép soát: đối chiếu các nhóm đường dẫn trong `dist/sitemap.xml` với danh sách denylist —
nhóm nào có nhiều URL mà không nằm trong danh sách là nhóm đang bị nuốt. Trang vỏ SPA
(`/thu-vien/`, `/ve-chung-toi/`, `/lien-he/`…) thì NGƯỢC LẠI: phải để service worker phục
vụ, đưa vào denylist là hỏng.

Tầng tra cứu trong CMS (ô tìm, lọc đặc tính, duyệt A–Z) nằm ở `cms/sql/chi-muc-tra-cuu.sql`
+ `cms/src/lib/traCuu.ts`. `search()` của EmDash KHÔNG dùng được: FTS5 là của SQLite, trên
Postgres nó là lệnh rỗng — không báo lỗi, chỉ trả về rỗng.

Thêm cột nội dung mới cho một bộ thì phải khai tên cột vào mảng `than` trong
`cms/scripts-di-cu/dung-chi-muc.mjs` rồi chạy lại, không thì nội dung mới hiện trên
trang mà tra không bao giờ ra.

⚠️ **Khai vào `than` là ĐIỀU KIỆN CẦN, chưa phải đủ.** `td_chu()` chỉ nhặt khoá `text` (nó
viết cho Portable Text), nên một cột JSON hình khác trả về RỖNG **mà không báo lỗi gì** —
nội dung hiện trên trang, tra cứu không bao giờ ra, y như khi quên khai. Đo thật
(26/09/2026): mảng chuỗi phẳng ✓, Portable Text ✓, chuỗi trần ✓, **mảng object → nuốt
trắng**. Hình JSON an toàn là **mảng chuỗi phẳng** hoặc Portable Text.

`dung-chi-muc.mjs` nay tự dò: cột nào có dữ liệu mà `td_chu()` trả rỗng ở quá nửa số dòng
thì nó in cảnh báo ngay sau khi dựng chỉ mục, kèm cách sửa.

## Mốc thời gian trong CMS: `now()` của Postgres KHÔNG phải ISO 8601

EmDash cất **mọi** mốc thời gian vào cột **TEXT** và luôn ghi bằng `toISOString()`. Viết
`VALUES (…, now(), now(), …)` thì Postgres ép timestamptz sang text và ra một dạng khác:

```
2026-09-25 14:56:41.321454+00   ← Postgres (dấu cách, +00 thiếu phút)
2026-09-25T14:56:41.321Z        ← EmDash
```

Cột là text nên **không có lỗi nào lúc chèn**. Vết thương chỉ lộ khi người biên tập bấm
**Publish**: `publish()` đọc lại `published_at` cũ, cho qua `normalizeDatetime`, và trả

```
Failed to publish
Datetime "2026-09-25 14:18:14.08303+00" is not a valid ISO 8601 datetime
```

⚠️ **Câu đó không nhắc tới mục nào, nên rất dễ đoán nhầm sang "trùng slug/trùng link"** —
đã xảy ra thật. Ngày 25/09/2026 có **18.205 mục ở 5 bộ** (bai_thuoc, nguon_y_van, huyet_vi,
duoc_lieu, kinh_mach) nằm ngoài tầm với của nút Publish vì lỗi này; ba bộ nạp bằng đường
khác thì sạch, nên nhìn qua tưởng chỉ hỏng một mục.

- Chốt: `node scripts-di-cu/kiem-moc-thoi-gian.mjs` (chỉ đọc, mượn chính hàm gác cổng của
  EmDash, mã thoát 1 khi còn sai). **Mọi cột phải sạch.**
- Vá: `node scripts-di-cu/va-moc-thoi-gian.mjs --ghi` (chạy thử là mặc định). Nó cũng đổi
  `DEFAULT CURRENT_TIMESTAMP` → công thức `to_char` ISO ở 61 cột, vì mặc định của EmDash
  vẫn đẻ dạng sai khi có INSERT bỏ trống cột.
- Script di cư phải dùng `SQL_MOC_ISO` trong `scripts-di-cu/moc-iso.mjs`, không dùng `now()`.

⚠️ Vá phải theo **lô và gộp cột**: 25 lệnh UPDATE lẻ trên Aiven mất hơn 10 phút và giữ khoá
đủ lâu để chặn cả lệnh dọn `auth_challenges` của CMS đang chạy.

## Khu quản trị CMS: sửa ở tầng HTTP, đừng vá `node_modules`

`cms/src/middleware.ts` gom bốn việc nhỏ mà gói `@emdash-cms/admin` không cho cắm vào:

1. **Đường trang từ điển → site thật.** Chỉ bật khi có `URL_SITE_THAT` trong `cms/.env` —
   biến này **chỉ khai ở máy lập trình**. Trên VPS, CMS cùng origin với site thật nên khai
   vào là **vòng lặp chuyển hướng**. Đây là thứ chữa dứt điểm cái bẫy "nút mở trang của CMS
   404 ở local": CMS không có route cho `/huyet/`, `/nguon/`… vì chúng là HTML tĩnh.
2. **`/` → site thật** (cũng chỉ ở local): nút "View Site" có `href="/"` đóng cứng trong gói
   admin, ở local nó dẫn tới trang blog mẫu mà không ai dùng.
3. **Dịch lời từ chối của API sang tiếng Việt** — trùng slug (kèm tra tên mục đang giữ) và
   mốc thời gian sai dạng. Logic thuần ở `src/lib/loi-tieng-viet.ts`, có phép kiểm:
   `node --test src/lib/loi-tieng-viet.test.ts`.
4. **Chèn `src/lib/tro-giup-admin.ts`** vào HTML khu quản trị: cảnh báo khi đổi slug của mục
   đã đăng, báo trùng slug ngay lúc gõ, và trỏ nút "View Site" về trang của mục đang sửa.

**Phải biết trước khi sửa:**

- Middleware **không bao giờ được làm hỏng một request** — khu quản trị và đường đăng nhập
  đi qua đây. Mọi nhánh nằm trong try/catch và trả nguyên phản hồi gốc khi lỗi.
- Viết lại thân HTML thì **phải xoá `content-length`**, không thì trình duyệt cắt cụt trang.
- Mảnh trợ giúp **nhúng thẳng**, không để thành tệp `.js` rời: nginx trên VPS chỉ đẩy
  `/_emdash/`, `/_astro/`, `/trang/` sang container cms — tệp ở đường khác chạy ngon ở local
  rồi 404 trên site thật. CSP của khu quản trị có `script-src 'self' 'unsafe-inline'` (đã đo).
- Toàn bộ mảnh mã nằm trong **một template string**, nên trong đó **không được có dấu huyền**,
  kể cả trong chú thích — một dấu lạc chỗ đóng chuỗi sớm và báo lỗi ở dòng chẳng liên quan.
- Phần dò DOM là **chỗ mong manh nhất**: phép kiểm
  `node --test src/lib/tro-giup-admin.test.mjs` chạy trên **trang giả** nên chứng minh logic
  chứ **không** chứng minh selector khớp bản EmDash đang chạy. Dò trượt thì mảnh mã ghi
  `console.warn` — im lặng ở đây nghĩa là cảnh báo biến mất mà không ai biết.
- EmDash **đã** chặn trùng slug (`SLUG_CONFLICT`) và **đã** tự tạo 301 khi đổi slug. Nhưng
  301 đó **nằm im** ở kiến trúc này: nginx phục vụ trang từ điển tĩnh, không qua CMS. Rủi ro
  thật khi đổi slug là **trang cũ còn sống tới lần build sau, trang mới chưa có**.

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
là app hiện hai lần), và **chủ trị dạng danh sách + kinh mạch** — CMS không có cột danh
sách cho hai thứ này, chỉ có văn xuôi (`chu_tri`) và `quy_kinh`; muốn quản thì phải thêm
trường CMS trước. **Sửa hai thứ đó trong CMS sẽ không tới app.**

**Công dụng và kiêng kỵ thì ĐÃ đồng bộ**, nhưng qua `dong-bo-lien-ket.mjs` chứ không qua
`dong-bo-app.mjs`, vì app lưu chúng bằng KHOÁ NGOẠI tới bảng tra cứu dùng chung.

⚠️ **CHỈ KHỚP TỪ VỰNG CÓ SẴN, tuyệt đối không tự tạo mục tra cứu mới.** `chu_tri` (3.588
mục) dùng chung với cả `huyet_vi` và `nhom_nho_chu_tri`; `kinh_mach` là tập đóng 18 dòng.
Một lỗi gõ sinh ra mục mới là làm bẩn luôn phần huyệt vị, rất khó lần ngược. Từ nào không
khớp thì script BÁO RA và bỏ qua CẢ VỊ đó, không ghi một nửa.

⚠️ **Dấu tách là XUỐNG DÒNG, không phải `;`.** Gộp bằng `;` MẤT DỮ LIỆU: một mục kiêng kỵ
chứa chính dấu `;` (vị 1004) bị chẻ làm hai. Đã kiểm cả ba bảng tra cứu — không mục nào
chứa xuống dòng. Dữ liệu cũ gộp bằng `;` thì chạy `--nap-lai`; **đừng thêm `;` vào dấu
tách** — làm vậy là tái tạo đúng lỗi đó (tôi đã vấp một lần).

## Ảnh từ điển: CMS là nguồn, và vì sao đó là bước TIẾN chứ không phải lùi

Trước 26/09/2026, ảnh từ điển đến từ hai nơi, cả hai đều mong manh:

- **Ảnh huyệt + kinh (1.312 tấm)**: tệp tĩnh ở `frontend/public/kinhmach3d/images/`, thư mục
  này nằm trong `.gitignore` nên **không có trong git, cũng không có trên máy lập trình** —
  chỉ tồn tại trên ổ đĩa VPS. Mất ổ đó là mất sạch.
- **Ảnh dược liệu (536 tấm)**: **hotlink sang máy chủ thư viện Đại học Baptist Hồng Kông**
  (`sys01.lib.hkbu.edu.hk`). Họ chặn lúc nào cũng được — lúc tải về đã phải giảm tốc 420ms
  vì bị siết.

Nay cả ba bộ lấy ảnh từ CMS. Bản trong CMS **trùng kích thước từng byte** với bản gốc, không
giảm chất lượng.

| Bộ | Cách dùng | Đường lùi |
|---|---|---|
| Huyệt (653) · Kinh (20) | khoá `anhCms` trong tệp sinh; build-dict dựng thẻ ảnh | ✓ `onerror` → ảnh tĩnh |
| Dược liệu (536) | `vi_thuoc.anh_dai_dien` = URL CMS, SPA dựng qua API | ✗ SPA không có `onerror` |

Dược liệu không có đường lùi vì thêm `onerror` phải sửa component, tức đụng giao diện. Bù
lại nginx đệm ảnh CMS 365 ngày và ảnh đã đệm vẫn sống khi CMS sập (đã đo). Hoàn nguyên được:
đường dẫn gốc cất ở `ec_duoc_lieu.anh_dai_dien_tinh`, `chuyen-anh-duoc-lieu.mjs --hoan`.

⚠️ **Ảnh KHÔNG đi theo `git push`.** CSDL dùng chung (Aiven) nhưng tệp ảnh thì không:
EmDash cất chúng ở `cms/uploads/` (đã `.gitignore`), VPS gắn `./data/cms-uploads`. Nạp ảnh
ở máy lập trình rồi deploy là trang dựng đủ chữ mà ảnh trả 404 — bản ghi có, byte không có.
Nạp ảnh qua trang quản trị của SITE THẬT, hoặc `rsync` tệp lên trước khi build. Xem
`DEPLOYMENT.md`, mục "ẢNH CỦA CMS KHÔNG ĐI THEO git push".

⚠️ **Đổi ảnh dược liệu phải đổi Ở CMS rồi để `dong-bo-app.mjs` mang sang.** Đổi thẳng
`vi_thuoc.anh_dai_dien` thì lần đồng bộ sau thấy 536 ô "lệch" rồi **đẩy đường dẫn cũ trở
lại** — vừa mất thay đổi vừa phá tính chất "chưa ai sửa thì đồng bộ ra 0 ô".

⚠️ URL ảnh dựng bằng `meta.storageKey`, **không phải `id`**: `/_emdash/api/media/file/<id>`
trả 404 mà thẻ `<img>` vẫn render — lỗi không lộ khi chỉ nhìn trang. Và cột kiểu image là
TEXT chứa CHUỖI JSON khi truy vấn SQL thô, phải `JSON.parse` trước.

## SEO: hai chốt chặn, và chỗ người biên tập sửa được

Thẻ SEO của 18.425 trang tĩnh ráp ở `frontend/scripts/seo-html.mjs`, nội dung do từng
builder tự sinh. Người biên tập ghi đè được qua bảng `_emdash_seo` của EmDash
(`seo_title`, `seo_description`, `seo_image`, `seo_canonical`, `seo_no_index`) — mọi bộ
đều khai `hasSeo: true` nên trang quản trị đã có ô nhập sẵn.

⚠️ Câu trên **mới đúng từ 26/09/2026**. Trước đó `has_seo = 0` ở 5 trong 9 bộ —
bai_thuoc (13.942 mục), nguon_y_van (2.139), duoc_lieu (1.045), cham_cuu_tri_benh và
kinh_mach — tức **17.246 trang không có ô nhập**, và `_emdash_seo` rỗng hoàn toàn nên
khâu ghi đè chạy mà không có gì để ghi đè, build vẫn xanh. Cột quyết định là `has_seo`
(trang quản trị đọc `collectionConfig.hasSeo`); `supports` giữ cho khớp vì registry suy
ngược `hasSeo ?? supports.includes("seo")`. Phép kiểm:
`node cms/scripts-di-cu/khai-seo.mjs --thu` phải in ra 0 bộ.
**Đừng thêm `"search"` vào `supports`** dù 4 bộ cũ có: `search()` của EmDash là FTS5 của
SQLite, trên Postgres là lệnh rỗng.

- ⚠️ **Từ 29/09/2026 ô SEO trong CMS LUÔN ĐẦY CHỮ, và phần lớn là chữ MÁY điền** (kiểu
  Yoast). Bước cuối `blog:post` là `dong-bo-seo-cms.mjs`: điền bản tự sinh vào ô trống hoặc
  ô còn đúng chữ máy điền lần trước, GIỮ ô người đã sửa. Phân biệt hai loại nhờ sổ
  `kl_seo_tu_sinh` (kho `kinhlac_cms`); `seo-cms.mjs` đọc cùng sổ đó nên chỉ áp ô của
  người. Chỉ ghi khi `SEO_GHI_CMS=1` (Dockerfile đặt) — build ở máy dev chỉ chạy thử.
  Mọi trang thuộc bộ CMS phải ráp SEO qua **`seoTrang()`** (cửa duy nhất, ghi nhận bản tự
  sinh); tự ghép chuỗi SEO trong builder là ô CMS của bộ đó thôi cập nhật.
  Phép kiểm: `node --test scripts/dong-bo-seo-cms.test.mjs scripts/trung-lap-bai-thuoc.test.mjs`.
- Bài thuốc TRÙNG (cùng tập vị + cùng tên gốc hoặc cùng tác dụng) trỏ canonical về bản dày
  nhất, rời sitemap (`trung-lap-bai-thuoc.mjs`). Cùng tên mà KHÁC vị thì KHÔNG gom — đó là
  các phương khác nhau chung tên; tiêu đề kèm tên sách để khỏi trùng.
- **View Vue KHÔNG được đè `document.title`/description khi trang tải thẳng từ HTML tĩnh**
  — gọi `headTinhKhop()` (`frontend/src/lib/seoTinh.ts`) trước. Google index trang SAU khi
  chạy JS; trước 30/09/2026 bốn view (bài thuốc, dược liệu, hai trang danh sách) đè head tĩnh
  bằng tiêu đề 94–110 ký tự và mô tả khuôn chung → mọi sửa SEO ở builder và CMS vô hiệu.
- Nội dung "làm dày" bài thuốc (`phan-tich-bai-thuoc.mjs`) ghi CẢ vào khối tĩnh LẪN
  `dist/bai-thuoc/<slug>/phan-tich.json` cho `PhuongThuocDetailView` đọc — cùng lý do trên.
  Chỉ đếm/liệt kê tính vị quy kinh, không sinh văn, không suy kết luận y học.
- Đường vào kho cho bot: `MUC_LUC` (`seo-html.mjs`) ở chân mọi trang tĩnh + khối tĩnh của
  trang chủ; mục lục A–Z tĩnh `/bai-thuoc/muc-luc/`, `/duoc-lieu/muc-luc/` (`muc-luc.mjs`).
  Danh sách trong TuDienView là `@click`, bot không đi theo được — đừng trông vào nó.
- nginx: `absolute_redirect off` (sau Caddy, không có nó thì mọi URL thiếu "/" bị đẩy về
  http); nhóm trang độc lập (huyet/kinh/benh-hoc/cham-cuu-tri-benh/nguon) trả **404 thật**;
  đường không có tệp tĩnh rơi về vỏ app kèm `X-Robots-Tag: noindex` (không 404 cứng được vì
  /app/* và bài thuốc thêm sau lần build cần vỏ app).
- ⚠️ **`add_header` trong `location` THAY, không kế thừa `add_header` ở `server`.** Nên mọi
  header an toàn (gồm `Strict-Transport-Security`, thêm 01/10/2026) phải lặp ở CẢ BỐN khối
  phục vụ HTML công khai: `/`, `@vo_spa`, nhóm trang từ điển độc lập, `@blog_danh_sach_tinh`.
  Thêm vào `server` rồi tưởng xong là mất header trên đúng những trang cần nó nhất. HSTS cố ý
  KHÔNG có `includeSubDomains` (www chưa phân giải; subdomain thiếu TLS mà trúng HSTS là không
  có cách vào lại) và KHÔNG có `preload` (gần như không rút lại được).
- Trang từ điển ghi "Biên soạn: Ban Biên Tập" (`bylineTuDien`), KHÔNG in "Đã rà soát chuyên
  môn" — chỉ blog (qua cổng duyệt `blog:pre`, có `reviewedBy`) mới được in nhãn đó.
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

### `lastmod` phải là ngày SỬA THẬT, không phải ngày build (01/10/2026)

Bốn builder từng truyền `new Date()` làm `lastmod`, nên **6.634/7.400 URL mang cùng ngày
build**; dòng byline "Cập nhật <ngày>" trên trang từ điển (thứ Google đọc thành
`semanticDate`) cũng vậy. Google **bỏ qua lastmod khi nó đổi mỗi lần phát hành** — cả kho
phát một tín hiệu rỗng mà không gì báo. Nay ngày lấy từ `updated_at` của CMS qua
`frontend/scripts/ngay-cms.mjs`; `chenUrl` nhận `lastmod` dạng chuỗi HOẶC hàm `(loc) => ngày`.

⚠️ **Đừng kỳ vọng nó "làm mới" kho.** `updated_at` phần lớn là ngày NHẬP LIỆU HÀNG LOẠT
25/09/2026: `ec_bai_thuoc` 13.898/13.942 mục, `ec_nguon_y_van` 2.139/2.139. Cái này mua được
là hai thứ khác: ngày **thôi đổi** mỗi lần build, và mục nào sửa thật thì có ngày riêng từ
nay. Số đo lượt đầu: 899/911 URL mang ngày build (98,7%) → còn 24 (2,6%).

⚠️ **Tra không ra thì BỎ HẲN thẻ `lastmod`**, không điền ngày build: thiếu lastmod chỉ là
thiếu một gợi ý, lastmod sai là nói dối bộ máy tìm kiếm. Vì vậy trang vỏ SPA, trang gom, và
`/duoc-lieu/<id>/` (URL theo id của app còn CMS khoá theo slug — chưa có bảng nối) đều không
có lastmod. Riêng byline thì NGƯỢC LẠI: đó là chữ người đọc thấy nên rơi về `BUILD_DATE`.

⚠️ Chốt thứ ba trong `kiem-sitemap` canh **"lastmod bằng NGÀY BUILD ≥ 50%"**, KHÔNG canh
"nhiều URL trùng ngày" — kho này trùng ngày là bình thường và đúng, một chốt kiểu đó gãy oan
ngay lần chạy đầu. Đã tính và bỏ.

⚠️ **`vite build` LUÔN đặt lại `dist/sitemap.xml`.** `gen-sitemap.mjs` ghi ra
`public/sitemap.xml` (911 URL gốc), và Vite chép cả `public/` đè lên `dist/`. Phần 9.206 URL
đầy đủ chỉ có sau khi `build-phuong` / `build-duoc-lieu` / `build-nhom-duoc-ly` / `build-nguon`
chèn thêm. Nên **chạy `vite build` xong thì luôn chạy `npm run blog:post`** — mọi lối gọi đều
bị, kể cả `npx vite build`, và `emptyOutDir: false` không đỡ được. Đã cắn một lần
(26/09/2026): sitemap tụt còn 911 mà 18.504 trang HTML vẫn đủ, site trông bình thường.

Liên kết nội bộ sinh bằng MÃ, không quản trong CMS (không ai bảo trì tay nổi 18.425
trang): engine nối tên huyệt trong thân bài (`build-dict.mjs`), thành phần bài thuốc →
dược liệu, và `/nguon/` ↔ bài thuốc/vị thuốc qua bảng nối `nguon_phuong_thang` /
`nguon_vi_thuoc` (33.516 liên kết). **Đừng khớp xuất xứ bằng chuỗi** — cột `xuat_xu` có
3.217 biến thể cho cùng chừng ấy sách.

## Rada SEO (`cms/src/plugins/rada-seo/`) — hai chiều, và HAI hàng đợi khác nhau

Plugin native EmDash, 14 công cụ MCP, chạy trong tiến trình CMS. Đặc tả:
`docs/superpowers/specs/2026-09-30-rada-seo-2c-cum-ke-hoach-lien-ket-design.md` và
`…-radar-lo-viet-plugin-cms-design.md`. Chiều 1 "chiếm đất" (radar đối thủ → hướng → cụm →
kế hoạch → lò viết), chiều 2 "leo top" (GSC → SERP → bản đồ sơ hở → phiếu sửa).

**Triết lý người dùng chốt, có phép kiểm neo lại:** trang #1 là trang **ít sơ hở nhất**, không
phải trang dài nhất. `leo-top/ban-do.mjs` vì thế không có phép tính nào đọc `soChu`, phiếu
không bao giờ khuyên "viết dài hơn" (`CUM_DO_DAI` lọc đi), và phép kiểm vàng là "đổi số chữ
mọi trang → kết quả y hệt". Đừng tối ưu hoá đi mất tính chất đó.

**Máy chủ đo, mô hình KHÔNG tự chấm.** Lý do ghi ngay trong `chien-luoc/chi-so.mjs`: ngày
30/09/2026 mô hình đã gắn "An toàn" cho tiêu đề vượt phạm vi Y sỹ. Mô hình chỉ báo "trang này
nói những ý gì"; gom ý, đếm tỉ lệ, so với trang mình là việc đếm của máy chủ.

### CTR phải so với KỲ VỌNG THEO VỊ TRÍ (`leo-top/ctr.mjs`, 01/10/2026)

⚠️ **CTR thô vô dụng** — chỗ dễ sai nhất của cả plugin. Hạng 1 luôn được nhấp nhiều hơn hạng
10, nên "CTR thấp" ở hạng xa là chuyện bình thường; chỉ phần LỆCH so với kỳ vọng của CHÍNH
hạng đó mới là tín hiệu. Phép kiểm neo đúng bẫy này: **CTR 1% ở hạng 20 KHÔNG bị kết tội,
cùng 1% ở hạng 1 thì có**.

- Đường cong kỳ vọng dựng từ dữ liệu của **chính site**, không mượn bảng CTR ngành khác: ngách
  Đông y tiếng Việt có hình SERP riêng, bảng vay mượn sẽ vu oan hàng loạt.
- **Trung vị** CTR từng hàng, không phải tổng nhấp/tổng hiển thị — một từ khoá thương hiệu đổ
  hàng nghìn hiển thị sẽ một mình định nghĩa cả bậc nếu tính theo tổng.
- Không bậc nào đủ mẫu → đường cong **RỖNG**, mọi hàng thành `chua_ro`. Thà không kết luận.
  Dưới 20 lượt hiển thị cũng không phân loại (1 nhấp trên 7 hiển thị ra 14%).

**HAI hàng đợi, đừng gộp lại.** Trước đó cả hai loại việc dùng chung một hàng và cùng tốn một
ca soi SERP:

| Loại | Dấu hiệu | Chữa bằng |
|---|---|---|
| `tieu_de` | thấy mà không bấm (CTR ≤ 60% kỳ vọng) | sửa tiêu đề/mô tả, **không cần soi SERP** |
| `noi_dung` | bấm bình thường (≥ 90% kỳ vọng) mà hạng không lên | ca soi SERP |

`layTuKhoaLeoTop` xếp theo `uuTien` = cơ hội × trọng số loại (noi_dung 1 · chua_ro 0,7 ·
tieu_de 0,25); `coHoi` giữ nghĩa cũ để số cũ còn đọc được. `layViecTieuDe` là hàng đợi rẻ, xếp
theo **số nhấp đang mất**, hiện qua route `leo-top-viec-tieu-de` + bảng trong tab Leo top
(nạp theo yêu cầu). Đây là **route của người**, không phải công cụ MCP — nên không cần bật lại
MCP tools sau deploy.

### Mạng nhện HAI CHIỀU (`viet/lien-ket-nguoc.mjs`, 02/10/2026)

Lò viết chèn link mới → cũ; chiều cũ → mới thì bài cũ không bao giờ biết có bài mới, nên bài
mới nhận 0 link nội bộ đúng lúc cần nhất. Khi Publish, `thaMangNhen` (chạy nền trong
`content:afterPublish`, cùng lối `thaIndexNow`) dựng gợi ý và ghi vào bộ kho `goi_y_nguoc`
**khoá theo contentId của bài CŨ** — vì khung Phiếu Rada mở theo bài đang sửa.

⚠️ **KHÔNG tự chèn.** Chỉ đề xuất; người biên tập bấm mới chèn. Tự sửa thân bài đã đăng là đổi
nội dung người đọc đang xem mà không ai duyệt.

⚠️ **Neo phải CÓ THẬT trong bài cũ.** Không cụm nào của bài mới xuất hiện trong chữ bài cũ thì
đề xuất vẫn ra nhưng gắn cờ `canVietThem`, khung hiện dấu ✎ và nói rõ "phải viết thêm một câu";
bài có neo sẵn xếp TRƯỚC vì việc rẻ hơn. Thiếu luật này thì đề xuất thành việc THÊM, không
phải việc đỡ. Trần: 5 bài cũ mỗi bài mới, 3 đề xuất mỗi bài cũ.

### Vòng học: loại sửa nào hay giúp lên hạng (`leo-top/vong-hoc.mjs`, 02/10/2026)

⚠️ **ĐỒNG XUẤT HIỆN, KHÔNG PHẢI NHÂN QUẢ** — và đây là ràng buộc thiết kế, không phải lời rào
đón. Một phiếu mang nhiều loại sửa cùng lúc và người quản trị sửa cả gói rồi mới bấm "Đã sửa",
nên khi hạng lên không có cách nào quy công cho một loại. Vì vậy ghi chú đó LUÔN in ra (có phép
kiểm), dưới 5 phiên thì `duKetLuan: false` và hàng mờ đi, bảng xếp theo SỐ PHIÊN chứ không theo
tỉ lệ lên (1/1 = 100% mà chẳng nói gì), và bảng rỗng nói rõ là THIẾU DỮ LIỆU.

⚠️ **Gom theo MỤC của phiếu, không theo chữ.** Cờ trong `phieu.traiNghiem` là CÂU tự do do
`ban-do.mjs` dựng; khớp chuỗi để chia nhỏ sẽ hỏng IM LẶNG ngay lần đầu ai sửa diễn đạt — và
hỏng theo kiểu tệ nhất: bảng vẫn ra số, chỉ là số của nhóm rỗng.

### Quảng cáo và khối dính (`leo-top/do-trang.mjs`)

Đáng đo vì đây là nhóm bằng chứng mạnh nhất mà mình lại sẵn lợi thế (site không có quảng cáo):
`FI_ADV` (−0,2509) là hình phạt đơn lẻ **nặng nhất** trong bộ trọng số Yandex bị lộ — lớn hơn
cả phần thưởng của `FI_PAGE_RANK` (+0,183); Google leak có `clutterScore` cùng hướng.

⚠️ **Bẫy là VU OAN, không phải đếm thiếu.** Chỉ có HTML thô: không chạy JS, không đọc CSS
ngoài, nên KHÔNG biết `<div class="banner">` có thật là quảng cáo không. Đếm theo tên lớp sẽ
kết tội cả khung giới thiệu nội bộ. Chỉ nhận hai dấu hiệu không thể nhầm: tài nguyên từ **17
mạng quảng cáo đã biết** (có cả mạng Việt) và thẻ `<ins class="adsbygoogle">`. Khối dính chỉ
đếm style NỘI TUYẾN, trên thân đã bóc script để không dính chuỗi trong mã JS. Ngưỡng 2 khối.

### Ngưỡng tiêu đề/mô tả khai MỘT chỗ

`NGUONG` trong `luat/seo.mjs` là chỗ duy nhất; `LOI_NHAC_VIET` nhúng `CAU_NGUONG` thay vì gõ
lại số. Trước 01/10/2026 lời dặn nói 30–70/100–170 còn phiếu chấm đạt 30–60/120–160 — bài viết
ĐÚNG lời dặn vẫn bị báo trượt hai mục, và **một phiếu báo sai thì người duyệt học cách bỏ qua
cả phiếu**, kể cả mục phạm vi Y sỹ bên cạnh. Rào cứng `KHUON_NOP` cố ý rộng hơn dải đạt: bài
hơi lệch phải được NHẬN rồi hiện vàng, không bị trả lại và tốn một lượt nộp.

### Ca radar TỰ ĐỌC trang bằng model (02/10/2026) — và bốn thứ đã trả giá

`ai/goi-model.mjs` là cửa DUY NHẤT gọi model (Google AI Studio, OpenAI-compatible);
`ai/tu-doc-trang.mjs` là khâu đọc trang, chạy ngay trong ca. Trước đó ca chỉ trích chữ rồi
**chờ một routine bên ngoài** kéo việc về đọc — không có routine thì hàng đợi đứng mãi.

- ⚠️ **Phải lấy việc THEO LÔ.** `layViec` kẹp cứng `TRAN_TRANG_MOI_LUOT = 10` mỗi lượt gọi (nó
  viết cho routine ngoài gọi nhiều lượt). Gọi một lần rồi xin 40 thì nhận đúng 10 — ca đêm đọc
  một phần tư hạn mức và `TRAN_MOI_CA` thành số chết. **Phép kiểm không bắt được** vì chúng
  tiêm `layViec` giả không có cái kẹp đó; chỉ lượt chạy thật mới lộ. Hàng đợi giả trong
  `tu-doc-trang.test.mjs` nay giữ đúng cái kẹp.
- ⚠️ **Khâu đọc phải đứng TRƯỚC khâu khoảng trống.** `capNhatKhoangTrong` chỉ nhìn URL đã
  `da_phan_tich`, nên đọc SAU nó thì 40 trang vừa đọc chỉ vào bảng khoảng trống ĐÊM SAU — ca
  vẫn báo đủ số và không chỗ nào nói ra là chậm một ngày. Phép kiểm neo vào hậu quả (có cụm
  trong chính ca đó), không neo vào thứ tự gọi hàm.
- ⚠️ **`GRAVITY_MODEL_ANH` để trống thì `sinhAnh` TỪ CHỐI ngay**, không rơi về model chữ: model
  chữ trả về một bài văn mô tả ảnh, tốn một lượt gọi để nhận một lỗi gây hiểu nhầm. Bậc miễn
  phí của Google không có quota sinh ảnh — phải bật thanh toán.
- Tên model phải đo, đừng đoán: `gemini-2.5-*` trả 404 "no longer available to new users",
  `text-embedding-004` không còn, mọi model `pro` và model ảnh trả 429 ở bậc miễn phí. Đang
  dùng: `gemini-3.5-flash-lite` (đọc trang) · `gemini-3.6-flash` (SERP/chiến lược/viết/thẩm
  định) · `gemini-embedding-001` (3.072 chiều).

### Ca tự LẬP CHIẾN LƯỢC (`ai/tu-lap-chien-luoc.mjs`, 02/10/2026)

Khoảng trống → HƯỚNG → cụm nghĩa → bài dự kiến. Chạy **mỗi tuần một lần** trong chính ca radar
(chỉ có MỘT task cron), ngày chọn bằng `denLuotChienLuoc` — hàm thuần theo **giờ UTC**, cùng lý
lẽ với `GIO_UTC_CHAY`: bảng cron dùng chung nên mọi phép so phải độc lập với múi giờ tiến trình.

- ⚠️ **CỔNG NGƯỜI Ở GIỮA, ĐỪNG BỎ.** `deXuatHuong` ghi hướng ở `de_xuat`; `ghiCum` chỉ nhận cụm
  thuộc hướng `da_nhan`. Nên bước 2 và 3 nằm im tới khi có người nhận hướng, và ca nói ra điều
  đó thay vì báo 0. Đừng "tối ưu" bằng cách tự nhận hướng: hướng quyết định cả tháng nội dung,
  và mô hình đã từng gắn nhãn "An toàn" cho tiêu đề vượt phạm vi Y sỹ.
- ⚠️ **Phải `layDuLieu` LẠI giữa các bước** — bước phân cụm phải thấy hướng bước trước vừa ghi.
  Nhưng chỉ dựng chỉ mục liên kết nội bộ MỘT lần (ba lần là ba lượt liệt kê cả kho từ điển).
- ⚠️ **Khuôn zod là TẦNG KIỂM THỨ NHẤT**, và nó từng chỉ nằm trên route MCP. `chien-luoc/viec.mjs`
  tự gọi mình là "lớp phòng thủ thứ hai" nên không thay được lớp một. Khuôn nay ở
  `chien-luoc/khuon.mjs`, dùng chung cho cả route MCP và ca tự hành.
- ⚠️ **"Mảng rỗng" KHÁC "sai dạng".** `.min(1)` của khuôn có vì route MCP đòi ít nhất một mục;
  với ca tự hành thì `{"huong": []}` là một câu trả lời hợp lệ. Đã xảy ra thật ở lượt chạy đầu —
  gộp hai thứ lại là đi sửa lời nhắc cho một chuyện không hỏng. Mảng rỗng KHÔNG tính vào `loi`.
- Phần máy chủ **BÁC** (kèm lý do) phải lên `ca.thongTin`: tỉ lệ bác cao là tín hiệu lời nhắc
  chưa rõ, im lặng ở đây thì không ai biết để sửa lời nhắc.

**Số đo lượt chạy đầu (02/10/2026, `gemini-3.5-flash-lite`):** bước phân cụm ra 6 cụm nghĩa dùng
được ("Đo nhiệt độ kinh lạc đánh giá xương khớp", "Huyệt châm cứu an thần định chí", "Thảo dược
và bài thuốc dưỡng tâm an thần"). Bước lập bài dự kiến bị khuôn loại vì mô hình bỏ hẳn khoá
`lienKetDich` — bước đó cần chỉ mục liên kết nội bộ THẬT, tức phải chạy trong tiến trình CMS.

⚠️ **Quota của bậc miễn phí tính RIÊNG theo từng model, và đó là trần chịu lực.** Cùng lúc đó
`gemini-3.6-flash` trả **429 hết quota ngày** (khâu viết đã dùng hết) còn `gemini-3.5-flash-lite`
vẫn chạy. Nên khâu viết và khâu chiến lược **không được dùng chung một model**. `*_DU_PHONG` hiện
chỉ bắt 5xx — 429 KHÔNG kích hoạt nó.

⚠️ **Vòng import có thật, và lỗi nó sinh ra trỏ sai chỗ.** `ca-radar.mjs` → `ai/tu-lap-chien-luoc.mjs`
→ `chien-luoc/khuon.mjs` → `chien-luoc/viec.mjs` → … → `ca-radar.mjs` làm `khuon.mjs` đọc
`TRAN_HUONG_MOI_LUOT` khi `viec.mjs` chưa khởi tạo xong: **ba tệp phép kiểm chết hẳn lúc nạp**
với `ReferenceError: Cannot access … before initialization`, báo ở dòng chẳng liên quan tới
nguyên nhân. Trần nay ở `chien-luoc/tran.mjs` — **tệp đó KHÔNG được import gì**, có phép kiểm
canh đúng điều đó; `viec.mjs` xuất lại nên chỗ gọi cũ không phải sửa.

### Một con số cho ba trạng thái là con số vô dụng

Hai chỗ trong plugin từng nuốt lý do, và cả hai đã làm mất thời gian thật:

- **`taoDocWeb` trả CHUỖI RỖNG khi tải hỏng.** Ngày 02/10/2026 `timXuHuong` ra 0 xu hướng suốt
  một ca với nhật ký sạch bong, trong khi chạy cùng hàm ngoài ca ra **50 xu hướng trong 844 ms**.
  Nay nó nhận `ghiLoi` và `chayCa` gom vào `ca.thongTin` qua `tomTatLoiTai` (gom theo LÝ DO kèm
  một URL ví dụ — 12 lượt cùng hỏng vì "lỗi giao thức" là MỘT chuyện). Giá trị trả về giữ
  nguyên, nên không chỗ gọi nào vỡ.
- **`capNhatKhoangTrong` chỉ trả số cụm đã ghi.** `soCum: 0` không phân biệt được ba chuyện
  khác hẳn: chưa trang đối thủ nào được đọc · luật không ra cụm nào · cụm tính ra rồi mà khâu
  ghi lọc sạch. Nay trả cả `soChuDeDoiThu`/`soChuDeMinh`/`soCumTinh`, và `cauKhoangTrong()` in
  ra câu phân định. Phép kiểm đòi ba câu đó KHÁC nhau.
- **`thayCum` từng trả số mục NỘP, không phải số dòng.** Khoá là băm của TÊN cụm nên cụm trùng
  tên đè nhau: báo "ghi 27" trong khi kho có 24 dòng. Nay gộp trước khi ghi, giữ bản điểm cao hơn.

### Bảng khoảng trống: đối thủ là BỆNH VIỆN, nên sitemap đầy tin nội bộ

`laTinNoiBo` + `laTenRong` (`radar/khoang-trong.mjs`) bỏ HẲN cụm không dùng được làm việc viết.
Lý do rất cụ thể: lượt đo đầu 02/10/2026 cho ra 50 cụm mà **hai cụm đầu bảng** là "Thư mời báo
giá dịch vụ truyền thông" và "Đoàn công tác … hội nghị quốc tế tại Thụy Sĩ" — tức khâu lập kế
hoạch sẽ cử bot đi viết bài về thư mời báo giá. Lọc ba lượt: 50 → 35 → 30 → **27 cụm**, sáu cụm
đầu thành chủ đề châm cứu thật.

- Chỉ khớp trên **TÊN** cụm (lấy từ tiêu đề trang), KHÔNG khớp trên từ khoá: từ khoá của bài
  chuyên môn hay có tên bệnh viện. **Tên cơ quan không phải dấu hiệu tin nội bộ** — "Hướng dẫn
  thực hành châm cứu tại Bệnh viện Y học cổ truyền Trung ương" là bài chuyên môn. "giới thiệu"
  chỉ tính khi đi kèm đơn vị.
- Bỏ HẲN chứ không hạ điểm: hạ điểm thì cụm vẫn trong bảng và vẫn có ngày trôi lên đầu. Bảng
  lập lại mỗi đêm nên bỏ sai chỉ mất một đêm.
- `tenCum = "Khác"` là chủ đề MÔ HÌNH trả về khi nó không đọc ra chủ đề — có thật trong kho.
- Phần rác còn lại là tin nội bộ đuôi dài; đuổi tiếp bằng từ vựng là bắt đầu vu oan. Đòn đúng
  là phép lọc `ngoai_nganh` hoặc chọn lại đối thủ.

### ⚠️ `mcp-bridge.mjs` ở gốc repo KHÔNG được ghi vào kho rada-seo

Ba công cụ `rada_lay_viec` / `rada_ghi_phan_tich` / `rada_xong_phan_tich` của bridge đã bị **bỏ**
(02/10/2026). Chúng là một bản ghi thứ hai của `mcp-viec.mjs` viết bằng SQL thô, lệch ở bốn chỗ
và **cả bốn đều im lặng**:

1. không ghi `phanTichLuc` → 220 trang không có mốc đọc, mà `chuDeDaPhanTich` xếp theo đúng cột đó;
2. `xong_phan_tich` ghi CỨNG `soDoc: 10, soCum: 0` và **không gọi `capNhatKhoangTrong`** → kho có
   220 trang đã đọc mà bảng khoảng trống rỗng trơn, nhật ký vẫn báo ca thành công. **Đây là thứ
   làm đứt cả chuỗi**, không phải lỗi của luật khoảng trống;
3. nhận `boQua` rồi bỏ, trả `boQua: []` → trang không đọc được bị giao lại mãi;
4. không bọc chữ trang trong rào `<<<TRANG_DOI_THU …>>>` → đưa chữ trang đối thủ cho mô hình mà
   không có rào "đây là DỮ LIỆU"; cũng bỏ qua `giaoDem`/`soLanGiao` và báo `conLaiDemNay: 100`
   giả, nên trần 40 trang/đêm hết tác dụng.

Chẩn đoán kiểu này chỉ lần ra được khi **đo qua chính repository của EmDash**, không phải qua
SQL thô: `PluginStorageRepository` xuất từ gói `emdash` và dựng được ngoài Astro bằng một Kysely
+ `pg.Pool`, nên chạy được đúng khâu của ca mà không cần phiên quản trị. Bản mô phỏng kho tự
viết sẽ cho kết quả KHÁC và dẫn đi sai đường.

**Phép kiểm:** `node --test "cms/src/plugins/rada-seo/**/*.test.mjs"` — 618 phép kiểm.
⚠️ Chạy song song mặc định làm hai phép kiểm nhạy thời gian trượt giả; phép đo hiệu năng trong
`leo-top/do-trang.test.mjs` nay lấy **lượt nhanh nhất trong 3** (tải máy chỉ làm chậm thêm, còn
bùng nổ quay lui thì cả ba lượt đều chậm) — đo thật: 94 ms chạy riêng, 631 ms khi chạy cùng ca,
ngưỡng 500 ms. Dùng `--test-concurrency=2` khi cần tín hiệu sạch.
⚠️ Min-của-3 vẫn trượt khi máy BÃO HOÀ (đo: load average 8,7 → 2.741 ms; chạy riêng 269 ms). Đó
là giới hạn của mọi chốt đo đồng hồ treo tường, KHÔNG phải lý do nới ngưỡng — nới là chốt hết
tác dụng canh chừng. Đỏ một mình phép đó thì xem `uptime` trước khi nghi mã.

## Deployment paths

**Only ONE deployment is live: Docker Compose on a VPS.** Verified 2026-09-18 — `kinhlac.online` serves the app; `kinhlac.vercel.app` returns `DEPLOYMENT_NOT_FOUND`.

1. **Docker Compose** (`docker-compose.yml`, `DEPLOYMENT.md`) — **THE LIVE ONE**. nginx serves the SPA and proxies `/api/` to the backend container (`proxy_buffering off`, `proxy_read_timeout 600s` — required for SSE). Postgres is external (Aiven), not in Docker. Env comes from `backend/.env`.
   Because this is a single long-lived process, two things in the code are safe that would NOT be safe on serverless or multi-instance: `@Cron` in `appointment-reminder.service.ts` (fires reliably, no duplicates) and the in-memory rxjs `Subject` in `sse.service.ts` (all clients share one process). **If you ever add a second instance, both break** — the cron will double-send reminders and SSE events will not cross instances.
2. **PM2** (`ecosystem.config.cjs`) — stale, references a Nuxt-style `.output/server/index.mjs`; the frontend is a Vite SPA. Does not work as-is.
3. ~~**Vercel**~~ — removed 2026-09-18 (deployment no longer existed; the stale config kept causing wrong conclusions about cron and SSE). Restore with `git checkout 18d0a92 -- backend/vercel.json backend/api/index.ts` if ever needed. `frontend/vercel.json` is kept (inert SPA rewrites).

The backend port differs between contexts (3000 in Docker, 3001 local). When fixing CORS, redirects, or links between services, confirm which one is in play.
