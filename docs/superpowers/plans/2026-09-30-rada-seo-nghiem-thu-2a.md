# Nghiệm thu 2A — Rada SEO trên bàn thử

Đo ngày 30/09/2026 trên **bản dựng** (`node ./dist-thu/server/entry.mjs`) của mã ở HEAD `52bab12`,
dựng theo "Công thức cấu hình thay thế" trong `2026-09-30-rada-seo-ket-qua-buoc-0.md`:
libsql tệp trong scratchpad, kho ảnh `local` trong scratchpad, `outDir: ./dist-thu`,
`plugins: [auditLog, radaSeo]` với **descriptor thật** (`./src/plugins/rada-seo/descriptor.mjs`).
Server chạy bằng `env -i` với `PGHOST=127.0.0.1 PGPORT=1` (chết), `PORT=4399`,
`RADA_SEO_CA_DEM=1 RADA_SEO_TRAN_LUOT=12 RADA_SEO_TRAN_MOI_DOI_THU=4`, **không có
`ANTHROPIC_API_KEY`** (người dùng chưa cấp). Log server không có dòng nào nhắc Aiven hay
ECONNREFUSED; `grep -rl aivencloud dist-thu/` = 0 tệp. Kho CMS dùng chung KHÔNG bị đụng.

## Bảng kết quả

| # | Phép đo | Kết quả | Số liệu / nguyên văn |
|---|---|---|---|
| 1.1 | Server bàn thử lên | **ĐẠT** | `curl /` = `200` (sau khi đánh dấu setup). Trước bước đánh dấu setup thì `/` = `302 → /_emdash/admin/setup` — đúng như công thức bước 0 mô tả, không phải lỗi. |
| 1.2 | Seed + SSO | **ĐẠT** | Request đầu in `Auto-seeded default collections`; `POST /_emdash/api/auth/kinhlac/vao` → `200 {"ok":true,"thongDiep":"Đã vào khu quản trị nội dung."}`, log `[kinhlac-sso] Lập người dùng mới: admin@noi-bo.kinhlac.online (bậc 50)`. |
| 2.1 | `doi-thu-luu {"tenMien":"https://kinhlac.online/","laCuaMinh":true}` | **ĐẠT** | `200 {"success":true,"data":{"tenMien":"kinhlac.online"}}` |
| 2.2 | `doi-thu-luu {"tenMien":"benhvienyhoccotruyentrunguong.vn"}` | **ĐẠT** | `200 {"success":true,"data":{"tenMien":"benhvienyhoccotruyentrunguong.vn"}}` |
| 2.3 | `doi-thu-luu {"tenMien":"localhost"}` bị chặn, lời tiếng Việt tới được máy khách | **ĐẠT** | `HTTP 400` thân nguyên văn: `{"success":false,"error":{"code":"BAD_REQUEST","message":"Tên miền không hợp lệ"}}` |
| 2.4 | `lich-bat` | **ĐẠT** | `200 {"success":true,"data":{"lich":[{"name":"radar","schedule":"30 19 * * *","nextRunAt":"2026-09-30T12:30:00.000Z","lastRunAt":null}]}}` — xem mục "Bất ngờ 1" về `nextRunAt`. |
| 2.5 | Dòng cron có trong `_emdash_cron_tasks` của DB thử | **ĐẠT** | `sqlite3`: `01M3RE45B8SX356FTSKK4TYN30 \| rada-seo \| radar \| 30 19 * * * \| is_oneshot=0 \| next_run_at=2026-09-30T12:30:00.000Z \| status=idle \| enabled=1` |
| 2.6 | Hook cron (nhả ca nền, không await) | **CHƯA ĐO** | Không chờ được tới giờ hẹn trên bàn thử. Lịch `"30 19 * * *"` đã xác nhận ở 2.4/2.5; hành vi hook: *đo gián tiếp bằng probe ở việc 6*, không đo lại ở đây. |
| 2.7 | `ca-chay {"ghi":false}` (chạy thử) | **ĐẠT** | Trả ngay `{"success":true,"data":{"daBatDau":true,"ghi":false}}`. Ca chạy **7,7 s** (05:56:06.988Z → 05:56:14.651Z), lượt `tong-quan` đầu tiên sau đó đã `dangChay=false`. Nhật ký: `ghi=false`, `soUrlMoi=600`, `soSePhanTich=0`, `soLuotGoi=0`, `soCum=0`, `loi=[]`. `cum=[]`. Cả hai đối thủ `dem={"cho":0,"da_phan_tich":0,"ngoai_nganh":0,"loi":0}`. `_plugin_storage` chỉ có `ca`(2) + `doi_thu`(2), **không có dòng `url` nào** — chạy thử đúng là không ghi URL. |
| 3.1 | Chạy thật: đo phân tích (soLuotGoi ≤ 12, chủ đề, cụm) | **CHƯA ĐO: thiếu khoá** | Không có `ANTHROPIC_API_KEY`. Không có chủ đề hay cụm thật để trích. |
| 3.2 | `ca-chay {"ghi":true}` không khoá → ghi nhật ký lỗi | **ĐẠT** | Route `200 {"success":true,"data":{"daBatDau":true,"ghi":true}}`; nhật ký ca: `{"loai":"radar","batDau":"2026-09-30T05:56:30.399Z","ketThuc":"2026-09-30T05:56:30.399Z","ghi":true,"loi":["Thiếu ANTHROPIC_API_KEY — radar không gọi được Claude."]}`. Log server: `[plugin:rada-seo] Rada SEO: ca hỏng Error: Thiếu ANTHROPIC_API_KEY — radar không gọi được Claude.` |
| 3.3 | Khoá được nhả sau ca hỏng | **ĐẠT** | `tong-quan.dangChay=false` 2 s sau; bảng `options` không còn khoá `plugin:rada-seo:ca:dang-chay`. |
| 3.4 | (thêm) Khoá chống chạy chồng | **ĐẠT** | Gọi `ca-chay {"ghi":false}` hai lần liền: lần 2 log `Rada SEO: đã có một ca đang chạy, bỏ qua lượt này`; lúc đó `options` có `plugin:rada-seo:ca:dang-chay = {"tu":"2026-09-30T05:56:48.984Z","het":…}`, `dangChay=true`. Chỉ 1 dòng nhật ký ca mới. Xem "Bất ngờ 3". |
| 3.5 | (thêm) `cum-trang-thai` chặn trạng thái lạ / id lạ | **ĐẠT** | `trangThai:"da_dang"` → `400 {"success":false,"error":{"code":"BAD_REQUEST","message":"Chỉ được đặt bo_qua hoặc cho_viet"}}`; id không có → `404 {"success":false,"error":{"code":"NOT_FOUND","message":"Không có cụm này"}}` |
| 4.1 | Màn điều khiển mở được, tiêu đề, 2 đối thủ, nhật ký có dòng "thử" | **ĐẠT** | Playwright mở `/_emdash/admin/plugins/rada-seo/rada` (không có hộp "Welcome"). Ảnh chụp tự xem — mô tả ở dưới. |
| 4.2 | Mục "Rada SEO" ở thanh bên nhóm Plugins | **TRƯỢT** | Thanh bên chỉ có `/_emdash/admin/plugins-manager :: Plugins` và `/_emdash/admin/plugins/audit-log/history :: Audit History`. `GET /_emdash/api/manifest` → `"rada-seo":{"version":"0.1.0","enabled":true,"adminMode":"none","adminPages":[],"dashboardWidgets":[]}`. Nguyên nhân + cách sửa ở "Bất ngờ 2". Trang chỉ tới được bằng gõ URL. |
| 4.3 | Bấm "Bỏ qua" → tải lại → mờ, nút thành "Khôi phục" | **ĐẠT** (trên cụm GIẢ) | Không có cụm thật (thiếu khoá) nên chèn tay **một cụm giả** vào DB thử: `[GIẢ bàn thử] mất ngủ theo Đông y`, id `gia-cum-1`. Trước: `opacity 1`, trạng thái "Chờ viết", nút "Bỏ qua". Bấm → request `POST` có `X-EmDash-Request: "1"`, thân `{"id":"gia-cum-1","trangThai":"bo_qua"}`. Tải lại: `opacity 0.5`, trạng thái "Bỏ qua", nút "Khôi phục". Bấm "Khôi phục" + tải lại: `opacity 1`, "Chờ viết", nút "Bỏ qua". |

## Màn điều khiển — thứ thấy thật trong ảnh

Ảnh `rada.png` (1400×1000, khung admin EmDash, thanh bên trái Content/Manage/Admin):

- Dòng đầu "Rada SEO", ngay dưới là dòng đỏ **"⚠ Hơn 26 giờ chưa có ca radar thành công — xem nhật ký
  bên dưới."** (đúng: trên DB mới chưa có ca thật nào thành công — trên VPS dòng đỏ này sẽ hiện từ lúc
  deploy tới ca đêm thật đầu tiên).
- "Lịch đêm: 02:30 hằng ngày · lần tới 19:30:00 30/9/2026 · lần trước — Hẹn lại Chạy thử Chạy thật Tải lại".
  Chữ "02:30" và "lần tới 19:30" **mâu thuẫn nhau trên bàn thử** — xem "Bất ngờ 1".
- Bảng "Đối thủ": ô nhập "tên miền, vd vinmec.com", "tên hiển thị", ô tick "site của mình", nút "Lưu";
  2 dòng `kinhlac.online (của mình)` và `benhvienyhoccotruyentrunguong.vn`, cột Chờ/Đã phân tích/Ngoài
  ngành/Lỗi đều 0, nút "Xoá".
- "Khoảng trống (0)" — bảng rỗng, chú thích "📈 trúng xu hướng tìm kiếm · ⚠ nghiêng chữa trị / hứa kết
  quả (bị trừ điểm)".
- "Nhật ký ca": 3 dòng — `12:56:48 thử 600 0 0 0 0`, `12:56:30 thật — — — — —` với chữ đỏ "Thiếu
  ANTHROPIC_API_KEY — radar không gọi được Claude.", `12:56:06 thử 600 0 0 0 0`.
- Về hình thức: trang **gần như không có kiểu dáng** — "Rada SEO", "Đối thủ", "Nhật ký ca" cùng cỡ chữ
  thân (CSS admin xoá kiểu h1/h2), các nút "Hẹn lại / Chạy thử / Chạy thật / Tải lại" trông như chữ
  thường nằm liền dòng, ô nhập không viền. Dùng được, nhưng người dùng khó nhận ra đâu là nút.
- Console trình duyệt: chỉ cảnh báo `Uncompiled message detected! Message: > Audit History` (của
  plugin audit-log, không liên quan rada-seo); không có lỗi trang.

## Bất ngờ / điều phải biết

1. **`nextRunAt` tính theo MÚI GIỜ CỦA TIẾN TRÌNH, không phải UTC.** `nextCronTime()` của EmDash gọi
   `new Cron(expression).nextRun()` (croner) **không truyền timezone** → dùng giờ địa phương của tiến
   trình. Máy dev là `Asia/Saigon`, nên `30 19 * * *` ra `2026-09-30T12:30:00.000Z` = 19:30 giờ VN,
   không phải 02:30 VN. Container VPS (`node:22-alpine`, `docker-compose.yml` không đặt `TZ`) chạy UTC
   nên ở đó sẽ đúng 19:30Z = 02:30 VN — **nhưng chỉ chừng nào không ai đặt `TZ` cho container**.
   Hai hệ quả: (a) nếu ai bấm "Bật lịch/Hẹn lại" từ một tiến trình CMS chạy giờ VN nối kho thật, dòng
   cron sẽ mang `next_run_at` 12:30Z và VPS chạy ca lúc 19:30 VN một lần rồi mới tự về 02:30; (b) nhãn
   "02:30 hằng ngày" trên màn điều khiển đang đúng nhờ giả định UTC. Chưa sửa — ghi để quyết.
2. **Descriptor `adminPages` KHÔNG vào manifest với plugin `format:"native"`** (TRƯỢT 4.2). Mã
   `generatePluginsModule` (`node_modules/emdash/dist/astro/index.mjs`) với native chỉ sinh
   `createPlugin(options)`; `adminPages` của descriptor chỉ được dùng cho `format:"standard"` và cho
   plugin sandbox. Manifest (`_buildManifest` trong `emdash-runtime-*.mjs`) đọc
   `plugin.admin?.pages` / `plugin.admin?.entry` từ **kết quả `definePlugin()`**. `plugin.mjs` không
   khai `admin` nên `adminMode:"none"`, `adminPages:[]` → không có mục thanh bên. Trang vẫn chạy vì
   admin registry nhập `adminEntry` của descriptor. Hướng sửa (chưa làm, ngoài phạm vi nghiệm thu):
   thêm vào `definePlugin({...})` khối `admin: { pages: [{ path: "/rada", label: "Rada SEO", icon: "chart" }] }`
   rồi đo lại thanh bên. Ghi chú bước 0 nói plugin thử "hiện ở thanh bên" với dạng descriptor — ví dụ
   descriptor trong tệp bước 0 vì vậy dễ gây hiểu nhầm.
3. **`ca-chay` trả `daBatDau:true` cả khi bị khoá chặn.** Lần gọi thứ hai ở 3.4 vẫn nhận
   `{"success":true,"data":{"daBatDau":true,"ghi":false}}` dù ca không chạy (chỉ có dòng log cảnh báo).
   Màn điều khiển tắt nút khi `dangChay` nên người dùng khó gặp, nhưng lời gọi API thì nói sai.
4. **Chạy thử luôn báo `soSePhanTich=0`.** Vì chạy thử không ghi URL, `layUrlCho` không thấy gì trong
   kho, nên chạy thử KHÔNG cho biết ca thật sẽ phân tích bao nhiêu trang. `soUrlMoi=600` = đúng
   2 × trần 300 URL/đối thủ (cả hai site đều chạm trần).
5. Chạy thử nhanh: 7,7 s cho 2 site thật qua mạng (đọc sitemap, không đọc trang).

## Dọn

Server đã dừng (cổng 4399 không còn nghe). Đã xoá `cms/astro.config.thu.mjs` và `cms/dist-thu/`.
Build thử đã đổi `cms/.emdash/migrations.json` sang `"type": "sqlite"`; sau `cd cms && npx astro sync`
tệp lại là `"type": "postgres"` và **giống từng byte** bản sao lưu chụp trước khi build.
`git status --short` sạch trước khi thêm tệp này. Cổng 3001 (backend của phiên khác) chỉ được gọi
`/auth/admin/login` + `/auth/ve-cms`, không dừng/khởi động lại.

## Sửa vòng 1 — đo lại trên bàn thử

Bàn thử dựng lại y công thức (DB libsql mới, `PGHOST` chết, 0 tệp nhắc `aivencloud` trong `dist-thu/`,
0 dòng Aiven/ECONNREFUSED trong log), chạy hai lần: lần 1 giờ máy (`Asia/Saigon`), lần 2 thêm `TZ=UTC`.
Phép kiểm đơn vị: `node --test "src/plugins/rada-seo/**/*.test.mjs"` → **46/46 đạt**.

| # | Sửa | Kết quả | Số liệu / nguyên văn |
|---|---|---|---|
| S1 | `definePlugin({ admin: { pages: [{ path: "/rada", label: "Rada SEO", icon: "chart" }] } })`; bỏ `adminPages` khỏi descriptor (native không đọc nó), giữ `adminEntry` | **ĐẠT** | Manifest: `"rada-seo":{"version":"0.1.0","enabled":true,"adminMode":"blocks","adminPages":[{"path":"/rada","label":"Rada SEO","icon":"chart"}],"dashboardWidgets":[]}`. Thanh bên có `/_emdash/admin/plugins/rada-seo/rada :: Rada SEO`. Ảnh tự xem: nhóm "Plugins" có "Audit History" và **"Rada SEO"** (icon biểu đồ cột, đang tô sáng); bấm mục đó mở đúng trang React Rada SEO, không có lỗi trang. Lưu ý: `adminMode` giờ là `"blocks"` (không phải `"react"`) vì không khai `admin.entry`, nhưng trang React vẫn hiện đúng — thấy tận mắt. |
| S2a | `lich-bat` bị từ chối dưới giờ `Asia/Saigon` | **ĐẠT** | `HTTP 400 {"success":false,"error":{"code":"BAD_REQUEST","message":"Chỉ hẹn lịch được trên máy chủ chạy ca đêm (RADA_SEO_CA_DEM=1) và theo giờ UTC — hẹn từ máy khác sẽ làm ca đêm lệch giờ"}}`; `_emdash_cron_tasks` = 0 dòng. |
| S2b | `lich-bat` được nhận với `TZ=UTC` | **ĐẠT** | `200 … {"name":"radar","schedule":"30 19 * * *","nextRunAt":"2026-09-30T19:30:00.000Z"}`; dòng DB `rada-seo \| radar \| 30 19 * * * \| 2026-09-30T19:30:00.000Z \| idle` — nay đúng 02:30 giờ VN. `docker-compose.yml` (dịch vụ cms) thêm `TZ: UTC` ngay sau `RADA_SEO_CA_DEM`. Chưa đo nhánh "UTC nhưng tắt `RADA_SEO_CA_DEM`" (phải khởi động lại thêm lần nữa; logic là một phép HOẶC). |
| S3 | `ca-chay` báo 409 khi đang có ca | **ĐẠT** | Lần 1 `200 {"daBatDau":true,"ghi":false}`; ngay sau đó cả `{"ghi":false}` và `{"ghi":true}` → `HTTP 409 {"success":false,"error":{"code":"CONFLICT","message":"Đang có một ca chạy — chờ ca đó xong"}}`. `giuKhoa` trong `chayCa` vẫn giữ làm chốt chặn thật. |
| S4 | Chạy thử báo trước số trang sẽ phân tích | **ĐẠT** | Nhật ký ca: `soUrlMoi=600`, `soSePhanTich=8` (= 2 đối thủ × trần `RADA_SEO_TRAN_MOI_DOI_THU=4`), `soLuotGoi=0`, `loi=[]`, `dem.cho=0` cả hai. Lần này ca thử mất 30,6 s (lần trước 7,7 s — do mạng tới site đối thủ, không phải mã). |

Chưa đo ở vòng này: lời 400 của `lich-bat` hiện trên màn điều khiển khi bấm nút (mã `lam()` đưa
`e.message` vào dòng đỏ, nhưng không bấm thử bằng Playwright).

Dọn: server dừng, xoá `cms/astro.config.thu.mjs` + `cms/dist-thu/`, `npx astro sync` → `migrations.json`
là `"type": "postgres"`, giống từng byte bản sao lưu trước build.
