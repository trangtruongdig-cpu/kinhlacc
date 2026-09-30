# Kết quả bước 0 — Rada SEO plugin (đo trên bản dựng, EmDash 0.39.1)

Đo ngày 30/09/2026, trên **bản dựng** (`node ./dist-thu/server/entry.mjs`), không phải `astro dev`.
Plugin thử, cấu hình thử, bản dựng thử đã gỡ sạch sau khi đo; `cms/astro.config.mjs` không bị đụng.

| # | Điều | Kết quả | Cách chạy được / lỗi gặp |
|---|---|---|---|
| 1 | Cron trên Node | **ĐẠT** | Hẹn `*/2 * * * *` lúc 03:20:53Z → chạy 03:22:00, 03:24:00, 03:26:00, 03:28:00 (`soLan=4` sau 8 phút, `lanCuoi.luc=2026-09-30T03:28:00.017Z`, lệch < 0,3 s so với giờ hẹn). Chỉ chạy được khi hẹn qua **route**: hook `plugin:install` KHÔNG bao giờ chạy cho plugin khai trong config (xem dưới). |
| 2 | Trang admin React | **ĐẠT** (với dạng khác brief) | Mục "Rada SEO (thử)" hiện ở thanh bên nhóm *Plugins*, link `/_emdash/admin/plugins/rada-seo-thu/rada`, trang hiện đúng dòng "Rada SEO thử — trang admin plugin đã nạp." (chụp Playwright). `adminEntry` chạy được: **`"/src/plugins/rada-seo-thu-admin.jsx"`** (tuyệt đối từ gốc `cms/`). Dạng `"./src/…"` của brief gãy build: `UNRESOLVED_IMPORT … in \0virtual:emdash/admin-registry`. |
| 3 | content.create nháp | **ĐẠT** | `ctx.content.create("bai_viet", {title, description, content:[Portable Text block]})` trả item có `id`, `status:"draft"`, `publishedAt:null`. Admin: danh sách Bài Viết hiện "[THỬ rada] xoá tôi" nhãn *Draft*; trình sửa hiện "Nội dung thử." và "Draft version — This version is not visible on the site". `/blog/<slug>/` → **302 → /404** khi nháp; đối chứng: xuất bản qua admin API thì cùng URL → **200** có chữ "Nội dung thử." |
| 4 | media.upload + http | **ĐẠT** | `upload` trả `{mediaId, storageKey:"01M3R5A3J98MGN6YDZWQMFCJ1S.png", url:"/_emdash/api/media/file/01M3R5A3J98MGN6YDZWQMFCJ1S.png"}`; `curl` url → **200 image/png 68 byte** (cả khi không đăng nhập). `ctx.http.fetch("https://api.yescale.io/v1/models")` → **status 401** (đường mạng thông; 401 vì không gửi khoá — đúng ý đo). Host ngoài `allowedHosts` bị chặn: `Plugin "rada-seo-thu" is not allowed to fetch from host "example.com". Allowed hosts: api.yescale.io`. |

## Môi trường đo

Không đo trên CMS thật. CSDL CMS (`kinhlac_cms` trên Aiven) dùng chung với site production, và
`_emdash_cron_tasks` là bảng chung — một plugin thử hẹn cron vào đó thì mọi tiến trình CMS nối
tới kho đều có thể nhận việc (xem "Khác biệt…"). Nên dựng một **bản CMS vứt đi**:

- CSDL: **libsql tệp** trong scratchpad (`file:<SCRATCH>/thu.db`), kho ảnh `local` trong scratchpad.
- Server chạy với môi trường **tường minh** (`env -i`): `PGHOST=127.0.0.1 PGPORT=1 …` — `src/lib/csdl.ts`
  đọc PG* lúc chạy, PGHOST chết đảm bảo không có đường nào tới Aiven. Log hai lần chạy không có
  dòng nào nhắc Aiven hay ECONNREFUSED; `grep aivencloud dist-thu/` = 0 tệp.
- Đăng nhập admin bằng SSO app→CMS (vé chỉ ĐỌC DB app; tài khoản `admin` của app thành
  `admin@noi-bo.kinhlac.online` bậc 50 trong DB thử).

## Công thức cấu hình thay thế (kế hoạch 2 dùng lại làm bàn thử)

1. Tạo `cms/astro.config.thu.mjs` = bản sao `cms/astro.config.mjs`, chỉ đổi:
   - `import { postgres } from "emdash/db"` → `import { libsql } from "emdash/db"`;
   - bỏ khối `taoKhoS3` (nạp động `emdash/storage/s3`);
   - thêm `outDir: "./dist-thu"` cạnh `output: "server"` (KHÔNG đụng `cms/dist` của phiên khác);
   - `database: libsql({ url: "file:<SCRATCH>/thu.db" })`;
   - `storage: local({ directory: "<SCRATCH>/uploads", baseUrl: "/_emdash/api/media/file" })`;
   - `plugins: [auditLog, <descriptor plugin>]` (dạng descriptor ở mục dưới).
   Tên tuỳ chọn trong 0.39.1 khớp đúng như trên, không phải đổi gì.
2. Build: `cd cms && npx astro build --config astro.config.thu.mjs` (~13 s). KHÔNG `npm run build`.
3. Chạy (nền):
   ```bash
   SSO=$(node -e "const {parseEnv}=require('node:util');process.stdout.write(parseEnv(require('fs').readFileSync('.env','utf8')).CMS_SSO_SECRET)")
   env -i PATH="$PATH" HOME="$HOME" PGHOST=127.0.0.1 PGPORT=1 PGUSER=x PGPASSWORD=x PGDATABASE=x \
     S3_BUCKET= PORT=4399 HOST=localhost CMS_SSO_SECRET="$SSO" node ./dist-thu/server/entry.mjs
   ```
   Không nạp `URL_SITE_THAT` (middleware sẽ đẩy trang đi nơi khác).
4. **Seed: KHÔNG cần lệnh nào.** Request đầu tiên tự chạy migration và tự áp `seed/seed.json`
   (qua `package.json#emdash.seed`) vì DB rỗng: log in `Auto-seeded default collections`, có đủ
   `bai_viet`, `benh_hoc`, `huyet_vi`, `trang`. (`npx emdash seed` có sẵn với `-d <db>` nhưng không dùng tới.)
5. Đăng nhập không cần người:
   ```bash
   TOK=$(curl -s -X POST http://localhost:3001/auth/admin/login -H 'Content-Type: application/json' \
     -d '{"username":"admin","password":"password123"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).access_token')
   VE=$(curl -s -X POST http://localhost:3001/auth/ve-cms -H "Authorization: Bearer $TOK" | node -pe 'JSON.parse(require("fs").readFileSync(0)).ve')
   curl -s -c jar -b jar -X POST http://localhost:4399/_emdash/api/auth/kinhlac/vao \
     -H 'Content-Type: application/json' -H 'X-EmDash-Request: 1' -d "{\"ve\":\"$VE\"}"
   ```
   (`/auth/ve-cms` trả `{ve, songGiay}`; vé sống 60 s, dùng một lần.) Route plugin đã gọi được ngay.
5b. ⚠️ **Từ nghiệm thu 2B-1 (30/09/2026) lối SSO ở bước 5 KHÔNG còn chạy**: `admin/password123`
   của app trả 401 (mật khẩu đã đổi). Đừng tự ký vé bằng `CMS_SSO_SECRET` — bí mật đó mở cả CMS
   thật. Cách đã dùng: chạy trình cài đặt thật của EmDash (`/_emdash/admin/setup`) bằng Playwright
   với passkey ảo của Chromium (CDP `WebAuthn.addVirtualAuthenticator`) trên DB thử.
6. **Khu admin cần đánh dấu setup xong** — DB mới thì mọi `/_emdash/admin/*` đẩy về `/admin/setup`
   (wizard đòi passkey). Trên DB thử làm thay `finalizeSetup()`:
   `sqlite3 <SCRATCH>/thu.db "insert into options(name,value) values('emdash:setup_complete','true')"`.
   Mở admin lần đầu có hộp "Welcome to EmDash" che thanh bên — bấm "Get Started" trước khi click.
7. Playwright: nạp cookie `astro-session` từ `jar` (`domain: localhost`, `secure: false`) vào context.
8. Dọn: dừng server, xoá `astro.config.thu.mjs`, `dist-thu/`, tệp plugin thử. ⚠️ Build cấu hình thử
   GHI ĐÈ `cms/.emdash/migrations.json` (bị .gitignore nên `git status` không thấy) sang dạng
   `sqlite` trỏ vào DB thử. Khôi phục bằng `cd cms && npx astro sync` (cấu hình thật, không ghi `dist/`,
   không nối DB) — sau đó tệp phải lại là `"type": "postgres"`.

## Cách chạy được (dạng thật sự, khác brief ở đâu)

- **Đăng ký plugin — brief SAI.** Đưa thẳng kết quả `definePlugin()` vào `plugins: []` thì build gãy:
  `[emdash] Plugin "rada-seo-thu" has no \`entrypoint\`… an in-process definePlugin({...}) result passed
  directly is not supported`. Dạng chạy được là **descriptor native** (`PluginDescriptor`):
  ```js
  const radaSeo = {
  	id: "rada-seo", version: "0.1.0", format: "native",
  	entrypoint: fileURLToPath(new URL("./src/plugins/rada-seo.mjs", import.meta.url)), // tuyệt đối
  	adminEntry: "/src/plugins/rada-seo-admin.jsx",                                     // tuyệt đối từ gốc cms
  	adminPages: [{ path: "/rada", label: "Rada SEO", icon: "…" }],
  };
  // plugins: [auditLog, radaSeo]
  ```
  và module entrypoint phải **xuất `createPlugin(options)`** trả về `definePlugin({...})` (runtime sinh
  `import { createPlugin } from entrypoint; createPlugin(options)`). Default export không được dùng.
  ⚠️ **Sửa lại (đo ở nghiệm thu 2A):** với `format:"native"`, mục ở thanh bên đến từ
  `definePlugin({ admin: { pages: [...] } })`, **KHÔNG** từ `adminPages` của descriptor. EmDash 0.39.1
  chỉ đọc `descriptor.adminPages` cho plugin `format:"standard"`/sandbox; manifest của plugin native
  dựng từ `plugin.admin`. Rada SEO bản đầu chỉ khai ở descriptor → manifest `adminPages:[]`, thanh bên
  không có mục (trang vẫn mở được bằng URL vì `adminEntry` của descriptor vẫn được nạp). Ví dụ
  descriptor ở trên giữ `adminPages` chỉ để khớp với lần đo bước 0 — đừng chép theo.
  Kỹ năng `creating-plugins` gợi ý dạng này (descriptor + `admin.entry` dạng package) nhưng không nói
  đường dẫn tương đối gãy. `gui-mail-resend.mjs` hiện KHÔNG nằm trong mảng `plugins` nên không phải
  mẫu chứng minh dạng đăng ký.
- **Capability** dùng được đúng tên: `content:read`, `content:write`, `media:read`, `media:write`,
  `network:request` + `allowedHosts`. Cron, KV không cần capability.
- **Hook:** `cron: async (event, ctx) => …` với `event = {name, data, scheduledAt}`.
  `plugin:install` **không bao giờ chạy** với plugin khai trong config (chỉ chạy khi cài từ
  marketplace/registry). `plugin:activate` chỉ chạy khi có người tắt→bật plugin trong admin
  (`POST /_emdash/api/admin/plugins/<id>/disable` rồi `/enable` — đã đo, KV `hook:activate` được ghi).
  Không hook nào chạy lúc khởi động. ⇒ **Phải tự hẹn cron**: gọi `ctx.cron.schedule(...)` ở route
  (hoặc ở đầu mọi route/hook, vì `schedule` là upsert — gọi lại 2 lần vẫn 1 dòng trong `_emdash_cron_tasks`).
  Trang admin của plugin nên có nút "Bật lịch" gọi route này.
- **Admin entry:** module xuất `export const pages = { "/rada": Component }`; JSX tự biên dịch
  (không cần `import React`). Icon `"radar"` không có trong bộ icon — hiện icon plug mặc định.
- **Nội dung chấp nhận:** mảng Portable Text block (`_type:"block"`, `_key`, `style`, `markDefs`,
  `children:[{_type:"span",_key,text,marks}]`) vào trường `content`; `title`, `description` là chuỗi.
  Trạng thái sau `create`: **draft**, `authorId:null`, `locale:"en"` (DB thử chưa khai locale site),
  `liveRevisionId/draftRevisionId: null`. `create` KHÔNG nhận slug riêng: slug tự sinh từ title và
  **giữ nguyên dấu tiếng Việt** (`thử-rada-xoá-tôi`) — kế hoạch 2 phải `update` slug sau khi tạo,
  hoặc đặt title sao cho slug ổn. Khoá `seo` trong data được chấp nhận (ghi `_emdash_seo`).
- **Route plugin:** `POST /_emdash/api/plugins/<id>/<route>` (GET cũng chạy với route chưa khai
  method), cookie phiên + header `X-EmDash-Request: 1`. Trả phong bì `{success, data}`. Mặc định
  private, quyền `plugins:manage`. Tham số lấy từ `new URL(ctx.request.url).searchParams`.
- **Xoá:** `ctx.content.delete` = xoá mềm (vào Trash, `deleted_at` được đặt). `ctx.media.delete`
  xoá dòng `media` nhưng **tệp trên đĩa vẫn còn** (kho local) — có thể do dọn dẹp trễ, chưa đo tiếp.

## Khác biệt so với production cần kiểm lại

- **Cron chung bảng — rủi ro lớn nhất.** `CronExecutor.tick()` nhận **mọi** việc đến hạn trong
  `_emdash_cron_tasks` của mọi plugin, không lọc theo plugin đang nạp. Nếu tiến trình nhận việc không
  có plugin (vd `npm run dev` ở máy lập trình nối Aiven bằng `cms/.env`, hay container CMS bản cũ khi
  deploy dở), hook ném `Plugin "…" has no cron hook registered`, chỉ ghi `console.error`, và với việc
  lặp lại thì mã **vẫn đẩy `next_run_at` sang lượt sau** — lượt đêm đó mất lặng lẽ. Ngược lại một máy
  dev CÓ plugin sẽ chạy việc viết bài đêm bằng mã của máy dev. Kế hoạch 2 cần: một ô bật/tắt (KV hoặc
  biến môi trường chỉ đặt trên VPS) kiểm ngay đầu hook cron, và nhật ký mỗi ca để thấy lượt bị mất.
- **Cron chỉ khởi động sau request đầu tiên.** Runtime EmDash dựng lười; khởi động lại server mà
  không có request thì việc hẹn 03:30 KHÔNG chạy (đã đo: 03:30:46 vẫn `last_run_at=03:28`). Request đầu
  tiên (03:30:55) làm nó chạy bù ngay. Trên VPS có healthcheck `/kiem-suc-khoe.json` nên có lẽ ổn —
  nhưng phải kiểm healthcheck thật sự gọi vào container CMS sau mỗi deploy.
- **Postgres:** đo trên libsql. Truy vấn claim của cron là `UPDATE … WHERE id IN (SELECT …) RETURNING`
  chạy được cả hai, nhưng pool `max:1` của production + nhiều pool của EmDash có thể làm tick cron
  giành kết nối với người đọc (cùng bài học "việc nền không được giành backend"). Cần đo lại trên
  Postgres thật (hoặc Postgres cục bộ) trước khi bật việc nặng.
- **Kho ảnh:** đo với `local`. Production dùng S3 khi có `S3_BUCKET` — `upload` qua adapter S3 và URL
  trả về cần kiểm lại (url vẫn dạng `/_emdash/api/media/file/<storageKey>`?).
- **Đường mạng:** máy dev ra được `api.yescale.io`; container VPS cần kiểm riêng (DNS/egress).
- **Setup/đăng nhập:** production đã setup xong nên không có bước 6; chỉ bàn thử cần.
- **Cache trang:** ngay sau khi xuất bản, GET đầu vào `/blog/<slug>/` vẫn trả 302→/404 (bản cache của
  lần hỏi lúc còn nháp) rồi vài giây sau mới 200. Với luồng "bot viết nháp, người bấm xuất bản" thì
  vô hại, nhưng đừng dùng một curl ngay sau publish làm phép kiểm.

## Kết luận cho kế hoạch 2

Cả bốn điều ĐẠT: plugin native trên Node làm được cron, trang admin React, tạo bài nháp và nạp ảnh/gọi
mạng — **không cần phương án lùi** (crontab VPS hay trang Astro riêng). Kế hoạch 2 phải viết theo
các dạng đã đo, không theo code mẫu của brief:

1. Đăng ký bằng descriptor `format:"native"` + `entrypoint` tuyệt đối + module xuất `createPlugin()`;
   `adminEntry` dạng `/src/…` từ gốc cms.
2. Không trông vào `plugin:install`/`plugin:activate`: hẹn cron qua route (nút trong trang admin),
   `schedule` là upsert nên gọi lại vô hại.
3. Hook cron phải có công tắc "chỉ chạy trên VPS" và ghi nhật ký ca — vì bảng cron dùng chung kho.
4. Sau `content.create` phải đặt slug không dấu (update), và kiểm `locale` mặc định của site thật.
5. Dùng công thức cấu hình thay thế ở trên làm bàn thử; nhớ `npx astro sync` khôi phục
   `.emdash/migrations.json` sau mỗi lần build thử.
