# Radar đối thủ + Lò viết bài thành plugin EmDash, tự hành mỗi đêm

Ngày: 30/09/2026 · Trạng thái: đã duyệt thiết kế (3 phần) · Thay cho "GĐ 3" trong
`2026-09-25-emdash-cms-design.md`.

## Mục tiêu

Máy tự: phân tích đối thủ → tìm khoảng trống → lên danh sách → viết nháp (chữ + ảnh + SEO)
→ đặt nháp vào CMS. Quản trị viên chỉ mở `/_emdash/admin`, đọc phiếu chấm, sửa nếu cần,
bấm **Publish** — bài lên `/blog/<slug>` ngay, không build lại.

## Hiện trạng (đo 30/09/2026)

- Radar + lò viết sống trong app: `backend/src/controllers/seo.controller.ts` (`SeoService`,
  2.534 dòng) + `frontend/src/views/SeoRadarView.vue`. Bảng `seo_doi_thu`, `seo_url`,
  `seo_cum`, `seo_bai_viet` ở `defaultdb`.
- **Không dòng nào ghi sang CMS** (không lời gọi `_emdash/api`, không ghi `ec_bai_viet`).
- Nút "Đăng" gọi `frontend/scripts/publish-article.mjs` — trên VPS không có tệp đó → bài không
  vào sitemap, không có trang tĩnh.
- Ba chỗ ghi "đã duyệt" lệch nhau (`seo_bai_viet.trang_thai`, `approved` trong `.md`, trạng
  thái CMS); publish không ghi `approved` nên `blog:gate` noindex mọi bài máy viết.
- Không tự hành: phân tích bấm tay 5 URL/lần — 5 đối thủ đều ở mức Chờ 286–300 / Đã PT 0–14.
- 22 nháp có trùng chủ đề (3–4 bài "đo nhiệt độ 24 tỉnh huyệt"), một nháp trùng từ khoá với
  trang từ điển (`Huyệt Tam Âm Giao: vị trí, tác dụng` ↔ `/huyet/tam-am-giao/`), một bài ĐÃ
  ĐĂNG vượt phạm vi Y sỹ ("…Châm Cứu Chữa Bệnh Hiệu Quả…") mà mô hình tự chấm "An toàn".
- CMS đã có bộ `bai_viet` (đủ trường E-E-A-T, FAQ, nguồn, `cho_index`) và trang
  `cms/src/pages/blog/` có cache + tự xoá cache theo tag khi bài đổi.

## Quyết định kiến trúc

**Plugin native EmDash** (`cms/src/plugins/rada-seo/`), chạy trong tiến trình CMS. Đã kiểm
API của `emdash@0.39.1` (`types-*.d.mts`) có đủ:

| Cần | API |
|---|---|
| Bảng riêng | `storage` |
| Chạy mỗi đêm | `ctx.cron.schedule()` |
| Gọi Yescale / đọc sitemap đối thủ | `network:request` + `allowedHosts` |
| Tạo nháp `bai_viet` | `ctx.content.create()` (`ContentAccessWithWrite`) |
| Nạp ảnh | `ctx.media.upload()` → `{mediaId, storageKey, url}` |
| Màn điều khiển | `admin.pages` (React, qua `admin.entry`) |
| Phiếu chấm cạnh bài đang sửa | `admin.editorPanels` |
| Ping IndexNow khi đăng | hook `content:afterPublish` |

Ghi qua `ctx.content` / `ctx.media` nên EmDash tự lo mốc ISO, Portable Text, revisions,
`storageKey`, chỉ mục tra cứu — bốn chỗ ghi SQL tay trong repo này từng làm hỏng im lặng.

**Một chỗ duyệt duy nhất: trạng thái Publish của CMS.** Bỏ `approved` trong `.md` và
`da_duyet` của `seo_bai_viet` khỏi đường đi.

### Ranh giới

- **Vào plugin:** đối thủ, quét sitemap, phân tích URL, khoảng trống + chấm điểm, dò xu hướng
  (Google Suggest), lò viết, ảnh, rào chắn, nhật ký ca.
- **Ở lại app:** theo dõi index (GSC), IndexNow thủ công, audit striking-distance.
- Tab SEO Radar của app: thay bằng nút mở màn plugin. Code cũ giữ tới khi plugin chạy ổn
  2 tuần rồi mới xoá.

## Bước 0 — chốt chặn trước khi viết code thật

Build xanh không chứng minh gì với plugin EmDash (đã sập mọi trang 500 ngày 25/09). Plugin
thử nhỏ, chạy trên **bản dựng** (`node ./dist/server/entry.mjs`, không `astro dev`), phải đo
đạt đủ bốn điều; trượt điều nào thì DỪNG và bàn lại:

1. Cron thật sự bắn trên Node. Lùi: route plugin được gọi theo giờ từ crontab VPS.
2. Trang admin React của plugin hiện trong `/_emdash/admin`.
3. `content.create('bai_viet', …)` ra nháp mở được trong trình sửa.
4. `media.upload` trả URL xem được (không 404).

Sửa `astro.config.mjs` có thể làm sập dev server của phiên khác — báo trước, thử trên tiến
trình riêng.

## Luồng ca đêm (giờ VN)

```
02:30  radar: quét sitemap đối thủ → phân tích URL chờ theo lô (trần/ca) → dò xu hướng
       → tìm khoảng trống → chấm điểm → cập nhật danh sách
05:00  lò viết: nếu nháp chưa duyệt ≥ 25 → nghỉ viết (radar vẫn chạy)
       chọn 5 khoảng trống điểm cao nhất, 5 cụm khác nhau
       → chống trùng → viết thân + meta/FAQ/nguồn → rào chắn → ảnh → content.create (nháp)
```

- Mỗi ca ghi một dòng nhật ký (bảng plugin, cùng ý `td_ca_soi`): bắt đầu/kết thúc, số URL,
  số khoảng trống, số bài, số lượt gọi, lỗi. Màn plugin có khối "Bot làm gì gần đây".
- Ca hỏng → báo `POST /su-co/bao` của app (lane lỗi hệ thống).
- **Nghỉ giữa các lô** (cùng lý do `NGHI_GIUA_LO_MS` của bot thẩm định): CMS còn phục vụ
  ảnh + khu quản trị + blog.
- Trần chi phí tính bằng **số lượt gọi, kể cả lượt hỏng**. Timeout khai tay; Claude qua
  Yescale trả `text/plain` → tự parse thân phản hồi (xem `tham-dinh-llm.service.ts`).
- Endpoint chạy tay mặc định **chạy thử**, `?ghi=1` mới ghi.

## Chọn khoảng trống

Điểm = số đối thủ đã viết + tín hiệu xu hướng + mức kho nội bộ để liên kết (huyệt, bài
thuốc, dược liệu) − điểm phạt nghiêng chữa trị/liều lượng. Khoảng trống ngoài ngành bị loại
ở khâu phân tích. Trạng thái khoảng trống: `cho_viet` / `co_nhap` / `da_dang` / `bo_qua` /
`phu_boi_tu_dien`. Nút "Bỏ qua" trên màn plugin.

## Chống trùng — ba lớp, chạy TRƯỚC khi gọi mô hình

1. **Trùng từ điển:** từ khoá chính (bỏ dấu, bỏ dấu câu) trùng tên một mục từ điển → không
   viết, gắn `phu_boi_tu_dien` + link trang đó.
2. **Trùng blog:** so tập token của từ khoá chính với tiêu đề + từ khoá của mọi `bai_viet`
   (kể cả nháp). Vượt ngưỡng → gộp vào cụm cũ. Ngưỡng **đo trên 22 nháp hiện có**; phép kiểm
   vàng: nhóm "24 tỉnh huyệt" bị gom, bài khác đề tài đứng riêng.
3. **Trạng thái cụm:** đã có nháp / đã đăng / bỏ qua thì không chọn lại.

## Rào chắn trước khi tạo nháp

| Rào | Chấm bằng | Trượt |
|---|---|---|
| Phạm vi Y sỹ | LUẬT, bảng từ đã chốt (chữa bệnh, chữa khỏi, khám bệnh, phòng khám, bác sĩ-về-mình…); câu miễn trừ nói về người khác được qua | Viết lại MỘT lần rồi chấm lại; tiêu đề vẫn trượt → không tạo nháp, ghi nhật ký |
| Liều / phác đồ | Luật: số + g/ml/viên, "ngày uống…", "liệu trình…" | Tạo nháp, cờ đỏ YMYL |
| Nguồn | Chỉ URL đã quét thật hoặc mục `/nguon/`; tên sách từ trí nhớ mô hình bị loại | Bỏ nguồn bịa, ghi số đã bỏ |
| Link nội bộ | Mọi link trỏ slug có thật trong CMS; cần ≥3 link vào từ điển | Gỡ link chết; thiếu → vàng |
| SEO | Tiêu đề 30–60, mô tả 120–160, từ khoá chính ở tiêu đề/H1/đoạn đầu, có H2, FAQ, alt ảnh | Vàng, không chặn |

Mô hình tự chấm YMYL chỉ là tín hiệu phụ — luật là lớp chặn chính. Kết quả hiện ở phiếu chấm
(`editorPanels`) cạnh bài.

## Ảnh

- Huyệt/kinh: **ảnh thật** trong thư viện CMS (653 huyệt, 20 kinh), chọn theo cách của
  `frontend/scripts/cover-lib.mjs`. Ảnh AI vẽ vị trí huyệt gần như chắc sai giải phẫu.
- Ảnh AI (chuỗi nhà cung cấp hiện có: Yescale → HuggingFace → Pollinations) chỉ cho ảnh bìa
  và minh hoạ không mang thông tin giải phẫu; lời nhắc cấm vẽ người kèm điểm/đường trên cơ thể.
- Mọi ảnh qua `ctx.media.upload`, gán `featured_image` bằng `storageKey`.

## Chuyển `/blog/` sang CMS

- nginx: khối `/blog/` → `proxy_pass` sang cms (bộ directive đã ghi chú sẵn trong
  `frontend/nginx.conf`).
- Gỡ `build-blog.mjs` khỏi `blog:post`, xoá `dist/blog/` (bản tĩnh sẽ che bản CMS).
- Service worker: `/blog/` phải có trong `navigateFallbackDenylist`.
- Sitemap: `dist/sitemap.xml` thành sitemap mục lục trỏ `/blog/sitemap.xml` do CMS sinh động.
- `kiem-sitemap`: nhóm blog đếm qua CSDL (bài đã đăng, ≥ lượt trước). `kiem-seo`: thêm phép
  kiểm thẻ trên trang blog CMS (canonical, JSON-LD, `reviewedBy`).
- Đường lùi: giữ code + khối nginx cũ 2 tuần.

## Di chuyển dữ liệu (một lần, mặc định chạy thử)

1. 11 bài `.md`: kiểm `di-cu-blog.mjs` đã chạy chưa; slug giữ nguyên.
2. `seo_doi_thu`, `seo_url`, `seo_cum` (`defaultdb`) → bảng plugin (`kinhlac_cms`), giữ kết
   quả phân tích.
3. 22 nháp: gom nhóm trùng bằng phép chống trùng → **người dùng chọn bài giữ** → tạo nháp CMS.
4. Bài đã đăng "…Chữa Bệnh…": đổi tiêu đề + slug; 301 của EmDash nay chạy thật vì `/blog/`
   đi qua CMS.

## Nghiệm thu

| Tầng | Phép kiểm |
|---|---|
| Bước 0 | Bốn điều ở trên, trên bản dựng |
| Logic thuần | `node --test` cho luật phạm vi Y sỹ, chống trùng (vàng: 22 nháp), luật SEO, lọc nguồn/link |
| Ca đêm | Chạy thử in đúng việc sẽ làm; đo độ trễ `/_emdash/admin` và `/blog/` TRONG lúc ca chạy |
| Trọn vòng | Viết 1 bài → phiếu chấm hiện → Publish → `curl /blog/<slug>` 200 ngay → có trong `/blog/sitemap.xml` → IndexNow ghi nhận → gỡ bài thì trang mất |

## Ràng buộc

- Một container CMS: cron, sổ chống dùng lại, cache bộ nhớ đều giả định một tiến trình.
- Aiven còn ~11 slot kết nối: plugin dùng kết nối của EmDash, không mở pool riêng; script di
  chuyển mở một kết nối rồi đóng.
- Ngoài phạm vi: chuyển theo dõi index/GSC vào plugin; nhiều người duyệt; lịch đăng hẹn giờ.
