# Nghiệm thu 2C-3: lò viết (bài đã duyệt → nháp CMS có phiếu → cổng Publish), trên bàn thử

Đo trên **bản dựng** (`node ./dist-thu/server/entry.mjs`) của mã ở HEAD `fb84c67`. Bàn thử dựng theo
"Công thức cấu hình thay thế" trong `2026-09-30-rada-seo-ket-qua-buoc-0.md`. DB là libsql tệp và kho ảnh
`local`, cả hai nằm trong scratchpad; `outDir: ./dist-thu`; `plugins: [auditLog, radaSeo]` với descriptor
thật; seed tự áp từ `cms/seed/seed.json` (có `bai_viet`). Phông chữ khai `fontProviders.local()` trỏ vào
một tệp `.woff2` trong scratchpad (bẫy đã ghi ở bản đo thử 2C-3), nên build không gọi Google Fonts.
Server chạy bằng `env -i`, `PGHOST=127.0.0.1 PGPORT=1` (cổng chết), `PORT=4399`, `TZ=UTC`, không có
`CMS_SSO_SECRET`, không có `RADA_SEO_CA_DEM`. Đăng nhập theo mục 5b: chạy trình setup thật qua
Playwright với passkey ảo, không đúc vé SSO.

Server bật lúc 22:43 ngày 30/09/2026 (giờ VN). Phiên đo bị ngắt giữa chừng vì lỗi xác thực API của
chính phiên Claude, rồi chạy tiếp lúc 08:04 ngày 01/10 trên **cùng tiến trình và cùng DB**. Hệ quả duy
nhất: mục 2 đo trong ngày VN 30/09, mục 3 trở đi đo trong ngày VN 01/10 (hạn ngạch đêm đã sang ngày mới).

Log server có 20 dòng (khởi động, migration, auto-seed, 17 dòng `[plugin:audit-log]`). Không dòng nào
chứa `ec_pat_`, Aiven hay ECONNREFUSED. Phép kiểm đơn vị
`node --test "src/plugins/rada-seo/**/*.test.mjs"` đạt **452/452**.

## Dữ liệu bơm vào

- **Hướng, cụm, bài dự kiến: tạo bằng công cụ THẬT, không bơm tay.** Tôi nạp lại `seed.sql` của nghiệm
  thu 2C-2 vào `_plugin_storage` (3 đối thủ `.example`, 40 dòng `url` ở `da_phan_tich`), rồi gọi
  `rada_de_xuat_huong` ("Mất ngủ theo Đông y", điểm 61) → nhận hướng với trọng số 4 qua route
  `huong-dat` → `rada_ghi_cum` ("Huyệt vị hỗ trợ giấc ngủ", điểm 53) → `rada_de_xuat_ke_hoach` →
  duyệt qua route `ke-hoach-dat`. Lối này lệch khỏi đề bài ("bơm thẳng") nhưng cho bản ghi đúng hình
  mà mã sinh ra.
- **Ba bài dự kiến**, mọi link đích đã `curl` trên kinhlac.online, đều `200`:
  - KH1 `k_e4da…`: "Bấm huyệt hỗ trợ giấc ngủ: Thần Môn, Tam Âm Giao và Nội Quan", từ khoá chính
    `bấm huyệt dễ ngủ`, trụ cột `/benh-hoc/mat-ngu/`, 6 đích `/huyet/than-mon/ tam-am-giao/ noi-quan/
    bach-hoi/ tam-du/ phong-tri/`.
  - KH2 `k_a703…`: "Xoa bàn chân và cổ chân trước giờ đi ngủ theo dưỡng sinh", từ khoá chính
    `xoa chân trước khi ngủ`, 5 đích `/huyet/dung-tuyen/ thai-xung/ tuc-tam-ly/ than-du/ tam-am-giao/`.
    Dùng để đo các cổng chặn.
  - KH3 `k_1c0c…` (thêm ở cuối, xem 4.7): "Thở chậm và xoa cổ tay…", 5 đích.
- **Từ điển** (API quản trị, tạo rồi xuất bản): `huyet_vi` "Thần Môn" `than-mon`, "Tam Âm Giao"
  `tam-am-giao`; `benh_hoc` "Mất Ngủ" `mat-ngu`.
- **Thư viện ảnh**: 3 ảnh webp 1400×1400 thật (tải từ `kinhlac.online/anh/huyet/…-toan-duong-kinh.webp`),
  alt `Huyệt Thần Môn`, `Huyệt Tam Âm Giao`, `Huyệt PC6 — vị trí trên da`. Alt gửi kèm lúc tải lên
  (multipart) **không được ghi**; phải `PUT /_emdash/api/media/<id> {"alt": …}` sau đó.
- **Bơm tay duy nhất**: 25 dòng `nhap` giả ở `cho_duyet` để đo trần tồn (mục 2.4), xoá ngay sau phép đo.
- **Người dùng bậc EDITOR (40)**: tạo bằng `POST /_emdash/api/auth/invite {"email", "role": 40}`. Bàn thử
  không có nhà cung cấp thư nên API trả `inviteUrl`; Playwright mở link đó và tạo passkey ảo.

## Bảng kết quả

| # | Phép đo | Kết quả | Số liệu / nguyên văn |
|---|---|---|---|
| 1 | Bật MCP, `tools/list` có 14 công cụ `rada-seo__…` | **ĐẠT** | `PUT …/plugins/rada-seo/mcp {"enabled":true}` trả `200`. Khoá `ec_pat_thKt…` chỉ có scope `["mcp:tools:rada-seo"]`. Tổng **73** công cụ = 59 lõi + 14: `rada_lay_viec rada_ghi_phan_tich rada_tim_lien_ket rada_lay_du_lieu_chien_luoc rada_de_xuat_huong rada_ghi_cum rada_de_xuat_ke_hoach rada_lay_tu_khoa_leo_top rada_nop_serp rada_lay_trang_serp rada_ghi_so_ho rada_lay_bai_can_viet rada_nop_bai rada_xong_phan_tich`. Trang Plugins liệt kê quyền của plugin: `network:request:unrestricted, content:read, content:write, media:read, content:revisions:read, hooks.content-policy:register` (EmDash tự thêm `network:request`). |
| 2.1 | `rada_lay_bai_can_viet`: ≤ trần đêm (mặc định 2) | **ĐẠT** | 30 ms. Trả đúng **2** bài (KH1, KH2), mỗi bài `soLanNopConLai: 3`; `conLaiDemNay: 0`, `soNhapChoDuyet: 0`. DB: cả hai kế hoạch sang `dang_viet`, `soLanGiao 1`, cùng `giuLuc`. KV `viet:giao:2026-09-30 = 2`. |
| 2.2 | Trường bọc dấu mốc, trụ cột và link đích kèm tên | **ĐẠT** | Mọi trường có dạng `<<<DU_LIEU id=k_e4da…:chinh>>>bấm huyệt dễ ngủ<<<HET_DU_LIEU id=k_e4da…:chinh>>>` (id `…`, `:chinh`, `:phuN`, `:ydinh`, `:nguonN`, `:truCot`, `:dichN`, và `:ten` cho tên). `trangTruCot.ten` = `Mất Ngủ`; `lienKetDich` có tên `Thần Môn`, `Tam Âm Giao`; bốn đích còn lại (`noi-quan`, `bach-hoi`, `tam-du`, `phong-tri`) có `ten` **rỗng** vì từ điển bàn thử chỉ có ba mục. `khuonBai` là nguyên văn `LOI_NHAC_VIET`. |
| 2.3 | Gọi lại cùng đêm: không giao thêm | **ĐẠT** | 27 ms: `{"bai": [], "conLaiDemNay": 0, "soNhapChoDuyet": 0, "ghiChu": "hết hạn ngạch bài đêm nay"}`. |
| 2.4 | Trần 25 nháp chờ duyệt | **ĐẠT** | Bơm 25 dòng `nhap` giả: `{"bai": [], "conLaiDemNay": 0, "soNhapChoDuyet": 25, "ghiChu": "đủ 25 nháp chờ duyệt — chờ người duyệt đọc bớt rồi mới viết tiếp"}`. Đã xoá 25 dòng (còn 0). |
| 2.5 | (thêm) Hạn ngạch tính theo ngày VN | **ĐẠT** | Sáng 01/10 (ngày VN mới) gọi lại sau khi "Duyệt lại" KH2: giao 1 bài, `conLaiDemNay: 1`; lượt sau giao KH3, `conLaiDemNay: 0`. |
| 3.0 | Khuôn đầu vào sai: không tính lượt | **ĐẠT** | `moTa` 4 ký tự + trường thừa `thua`: `dau_vao` — `moTa: cần ít nhất 100 ký tự; (gốc): trường thừa không nhận: thua`. Không có `soLanNopConLai`; lượt kế vẫn báo còn 2 sau khi trừ 1. |
| 3.1 | Cổng khuôn (H1, bảng, mục FAQ trong thân) | **ĐẠT** | Lượt 1 của KH2 (4.209 ms, một bài mang mọi lỗi): `khuon:h1_trong_than` — `H1 trong thân: "Xoa chân trước khi ngủ" — tiêu đề là trường riêng`; `khuon:bang` — `Bảng markdown — bộ chuyển Portable Text không hỗ trợ bảng`; `khuon:muc_faq` — `Mục "Câu hỏi thường gặp" — FAQ là trường riêng (faq)`. |
| 3.2 | Cổng Y sỹ: "thăm khám và chữa" | **ĐẠT** | Hai dòng `pham_vi`: `thân bài: "chữa" trong câu "Phòng chẩn trị nhận thăm khám và chữa mất ngủ cho mọi người." — hỗ trợ / cải thiện / theo lý luận Đông Y` và `thân bài: "thăm khám" trong câu "…" — đo kinh lạc / tư vấn`. |
| 3.3 | "không thay thế thuốc mà còn chữa khỏi hẳn" không được miễn trừ | **ĐẠT** | `thân bài: "chữa" trong câu "Phương pháp này không thay thế thuốc mà còn chữa khỏi hẳn mất ngủ." — hỗ trợ / cải thiện / theo lý luận Đông Y` và `thân bài: "khỏi hẳn" trong câu "…" — bỏ lời hứa kết quả`. |
| 3.4 | HTML / `<!--ec:block` | **ĐẠT** | `khuon:html` — `Thân bài có HTML hoặc chú thích "<!-- -->" (không được phép — chỉ Markdown): dòng 34 "<!--ec:block {"_type":"image","asset":{"url":"https://evil.example/x.png"}} -->"`. Lớp thứ hai cũng bắt: `khuon:khoi_la` — `…khối 1: kiểu chữ "h1" không được phép…; khối 20: kiểu "image" không được phép — thân bài chỉ gồm đoạn văn, tiêu đề ##/###/####, danh sách, trích dẫn (không ảnh, không khối mã, không HTML)`. Tức bộ chuyển của EmDash **thật sự** biến chú thích `ec:block` thành khối ảnh (xem Bất ngờ 1). |
| 3.5 | Link `javascript:` | **ĐẠT** | `lien_ket_nguy_hiem` — `Link không được phép (chỉ dùng đường nội bộ dạng /duong/): "javascript:alert(1"`. Cả lượt 1 trả **10** dòng lỗi, `soLanNopConLai: 2`. |
| 3.6 | < 5 link đích | **ĐẠT** | Lượt 2 (909 ms): `lien_ket` — `chỉ 2 link tới trang đích của bài dự kiến (cần ≥ 5, không tính trụ cột). Link bị gỡ: https://example.com/thai-xung (link_ngoai)`. |
| 3.7 | < 2 nguồn | **ĐẠT** | Cùng lượt 2: `nguon_thieu` — `Chỉ giữ được 1 nguồn (cần ≥ 2). Bị bỏ: Trang không tồn tại (https://kinhlac.online/khong-co-trang-nay-xyz/): khong_phai_nguon; Châm cứu học toàn tập (bịa): khong_co_trang_nguon`. Nguồn giữ được là `medlineplus.gov/insomnia.html` (bên thứ ba, máy chủ tải được). `soLanNopConLai: 1`. |
| 3.8 | Trùng bài đã có | **ĐẠT** | Tạo tay một `bai_viet` nháp "Xoa chân trước khi ngủ theo dưỡng sinh Đông Y". Lượt 3 (1.601 ms, bài sạch mọi cổng khác): `trung_blog` — `Trùng bài đã có "Xoa chân trước khi ngủ theo dưỡng sinh Đông Y" (độ giống 0.5) — đổi góc nhìn hoặc ý định để bài khác hẳn`. `soLanNopConLai: 0`. |
| 3.9 | Sau lượt 3 trượt: `can_xem` | **ĐẠT** | DB: `trangThai can_xem`, `soLanNop 3`, `lyDoCanXem "Nộp 3 lượt đều trượt — lỗi của lượt cuối ở loiCuoi"`, `loiCuoi` giữ dòng `trung_blog`. Lượt thứ 4 (27 ms): `can_xem` — `Bài dự kiến đã chuyển sang "cần xem lại" (Nộp 3 lượt đều trượt — lỗi của lượt cuối ở loiCuoi) — dừng, người quản trị sẽ xem lại`, `soLanNopConLai: 0`. Tổng 3 lượt tính + 1 lượt `dau_vao` không tính + 1 lượt bị bác vì `can_xem`. |
| 3.10 | (thêm) "Duyệt lại" bài `can_xem` | **ĐẠT** | Route `ke-hoach-dat {trangThai: "da_duyet"}` trả `200`; lượt lấy bài kế giao lại KH2 với `soLanNopConLai: 3`. |
| 4.1 | Bài đạt: nháp được tạo | **ĐẠT** | KH1, bài 1.255 từ tự viết, 7 link nội bộ, 4 FAQ, 3 nguồn. 4.096 ms: `daTao: true`, `contentId 01M3TFY9…`, `adminUrl /_emdash/admin/content/bai_viet/01M3TFY9…`. DB: `status draft`, `cho_index 0`, `tac_gia "Ban Biên Tập Kinh Lạc"`, `cta "/xem-ket-qua-do"`, không có `nguoi_duyet`. Kế hoạch `co_nhap` (có `contentId`, `slug`), nháp `cho_duyet`. |
| 4.2 | Slug không dấu, tiêu đề có dấu | **ĐẠT** | Slug `bam-huyet-de-ngu-than-mon-tam-am-giao-va-noi-quan`. Trình soạn hiện tiêu đề `Bấm huyệt dễ ngủ: Thần Môn, Tam Âm Giao và Nội Quan`. Cột `title` vẫn là bản không dấu tới khi Publish (đúng như bản đo thử 1a); sau Publish cột có dấu, slug giữ nguyên. |
| 4.3 | Ảnh bìa | **ĐẠT** | `phieu.anh = {mediaId: "01M3SFW56A0T…", alt: "Huyệt Thần Môn", lyDo: "huyệt Thần Môn nêu trong tiêu đề"}`. `GET /_emdash/api/media/file/01M3SFW568STYXAA1GREAGJP70.webp` trả **200 image/webp** khi không đăng nhập. Trang `/blog/<slug>/` sau Publish: `<img src="…/media/file/01M3SFW568….webp">` và `og:image` cùng URL. |
| 4.4 | FAQ và nguồn ở trường riêng, không trong thân | **ĐẠT** | Revision nháp: `faq` 4 cặp, `nguon_tham_khao` 3 mục (cả ba URL bên thứ ba đều qua xác minh: vi.wikipedia.org, medlineplus.gov, nccih.nih.gov). Thân bài (47 khối) không chứa `wikipedia`/`medlineplus`, không có mục "Câu hỏi thường gặp". Trang công khai có JSON-LD `FAQPage` (1) và in nguồn (1 lần `medlineplus.gov/insomnia.html`), đúng 1 thẻ `<h1>`. |
| 4.5 | `_key` không trùng | **ĐẠT** | 112 `_key`, 112 giá trị khác nhau, dạng `bam-huyet-de-ngu-…-noi-quan-1 … -112`. |
| 4.6 | Link trong thân và phiếu | **ĐẠT** | 7 markDef link: `/benh-hoc/mat-ngu/` + 6 đích. Phiếu: `seo` 7/7 đạt (`tiêu đề 51 ký tự (30–60)`, `mô tả 142 ký tự (120–160)`, `7 mục H2`, `4 câu FAQ`…), `ymyl []`, `khuonCanhBao []`, `nguonBo []`, `linkGo []`, `soTu 1255`. Không có lời khuyên độ dài. |
| 4.7 | (thêm) Publish thẳng, không qua Save của trình soạn: ảnh bìa có gãy không | **ĐẠT** | Sau `update` của plugin, revision nháp giữ `featured_image` là **id trần** `"01M3SFW56A0T…"` (cột thì đã được làm đầy lúc `create`). Sợ Publish chép id trần đè lên cột rồi ảnh 404, tôi lập KH3, nộp bài đạt (`thu-gian-buoi-toi-sau-gio-lam-tho-cham-va-xoa-huyet-than-mon`) và Publish bằng API ngay, không mở trình soạn. Cột sau Publish đúng là id trần, nhưng trang `/blog/<slug>/` trả 200 với `<img src="…/media/file/01M3SFW568….webp">` và `og:image` đúng, ảnh 200. EmDash làm đầy lúc đọc. |
| 4.8 | Tab Nháp liệt kê nháp | **ĐẠT** | Playwright, tôi đã tự mở ảnh. Khung đầu tab: "Bài máy viết luôn là **nháp**: đọc, sửa trong trình soạn rồi tự bấm Publish. … **Lưu ý:** bài đã Publish nằm trong CMS; trang /blog/ công khai chưa đọc từ CMS cho tới kế hoạch 3." Bảng "Nháp của lò viết (1)": tiêu đề có dấu (link), dòng nhỏ `/bam-huyet-de-ngu-than-mon-tam-am-giao-va-noi-quan`, bài dự kiến + "Có nháp", `08:05:53 1/10/2026`, "Chờ duyệt", phiếu `SEO 7/7 · 1255 từ · YMYL 0 · nguồn bỏ 0 · link gỡ 0 · ảnh bìa: Huyệt Thần Môn`. Console: 0 lỗi. |
| 4.9 | (thêm) Bài ngắn chỉ bị gắn cờ, không bị chặn | **ĐẠT** (đúng thiết kế, xem Bất ngờ 3) | Bài 334 từ của KH2 (sau "Duyệt lại") được tạo nháp; phiếu `khuonCanhBao: [{ma: "do_dai", ghiChu: "334 từ, ngoài khoảng 900–2.200"}]`, `seo.tieu_de_dai` trượt (`tiêu đề 63 ký tự (30–60)`), `anh: null` (không huyệt nào nêu trong tiêu đề/từ khoá chính/trụ cột). |
| 5.1 | Khung "Phiếu Rada" với người dùng bậc **EDITOR** | **ĐẠT** | Đăng nhập bằng `bientap@ban-thu.local` (bậc 40). Mục "Phiếu Rada" ở cột phải, dưới SEO; mở ra gọi `POST …/content/bai_viet/<id>/plugin-extensions/rada-seo/panel/phieu-rada?locale=en` → **200**. Nội dung (đã tự xem ảnh): `Trạng thái Chờ duyệt · Máy viết lúc 08:05:53 1/10/2026 · SEO đạt 7/7 · Số từ 1255 · Đoạn YMYL (liều, phác đồ, hứa hẹn) 0 · Nguồn bị bỏ / link bị gỡ 0 / 0 · Ảnh bìa Huyệt Thần Môn`, rồi `Không thấy chữ vượt phạm vi Y sỹ, ảnh trong thân bài đều hiện được.` |
| 5.2 | Sau khi sửa nháp và Save, khung soát trên revision nháp | **ĐẠT** | Editor đổi tiêu đề thành "Bấm huyệt dễ ngủ chữa dứt điểm: …", bấm Save (toast "Saved"), tải lại, mở khung: `Phạm vi Y sỹ — 2 chỗ phải sửa trước khi Publish: • "chữa" (tiêu đề) → hỗ trợ / cải thiện / theo lý luận Đông Y • "dứt điểm" (tiêu đề) → bỏ lời hứa kết quả`. Nhãn nguyên văn: **`Soát trên bản nháp đã lưu gần nhất (chữ đang gõ chưa lưu thì chưa tính). Chốt thật chạy lại lúc bấm Publish.`** Lúc đó cột `title` vẫn là bản không dấu, nên chữ "chữa dứt điểm" chỉ có thể đến từ `getRevision`: lối đọc revision chạy được trên bản dựng. |
| 6.1 | Publish nháp có "chữa dứt điểm": bị chặn, toast nêu lý do | **ĐẠT** | Editor bấm "Publish now" rồi xác nhận: `POST …/publish?locale=en` → **422 `PUBLISH_REJECTED`**. Toast: `Failed to publish — Chưa đăng được. Chữ vượt phạm vi hành nghề Y sỹ: "chữa" (tiêu đề) → hỗ trợ / cải thiện / theo lý luận Đông Y; "dứt điểm" (tiêu đề) → bỏ lời hứa kết quả. Xem khung "Phiếu Rada" để thấy đủ.` Bài vẫn `draft`. |
| 6.2 | Hẹn giờ đăng khi còn vi phạm: bị chặn | **ĐẠT** | `POST …/schedule {"scheduledAt": "2026-10-05T00:00:00.000Z"}` (phiên Editor, gọi API, không qua nút trên màn) → **422 `SCHEDULE_REJECTED`**: `Chưa hẹn giờ đăng được. Chữ vượt phạm vi hành nghề Y sỹ: "chữa" (tiêu đề) → …; "dứt điểm" (tiêu đề) → bỏ lời hứa kết quả. Xem khung "Phiếu Rada" để thấy đủ.` `scheduled_at` vẫn rỗng. |
| 6.3 | Bỏ chữ vi phạm rồi Publish: nháp và kế hoạch sang `da_dang` | **ĐẠT** | Sửa lại tiêu đề, Save, Publish: toast `Published — Content is now live`, `200`. DB: nháp `da_dang` (`dangLuc 2026-10-01T01:09:32.375Z`), KH1 `da_dang`. `/blog/<slug>/` trả 200, `<title>` có dấu. |
| 6.4 | Unpublish: về `cho_duyet` / `co_nhap` | **ĐẠT** | `POST …/unpublish` → `200`. DB: nháp `cho_duyet` (mất `dangLuc`), KH1 `co_nhap`, bài `draft`. Publish lại → cả hai về `da_dang`. |
| 7.1 | Bài NGƯỜI viết có "bác sĩ" | **ĐO ĐƯỢC: cho qua** | Bài tạo tay (không có bản ghi `nhap`), mô tả "Theo lời bác sĩ y học cổ truyền, xoa chân buổi tối giúp thư giãn." → Publish `200`, `status published`. Chế độ thường không chặn "bác sĩ" trần; chỉ bài máy viết (chế độ nghiêm) mới chặn. |
| 7.2 | Bài NGƯỜI viết có "chữa khỏi" | **ĐẠT** (bị chặn) | Đổi mô tả thành "Xoa chân buổi tối chữa khỏi mất ngủ cho mọi người." → **422 `PUBLISH_REJECTED`**: `Chưa đăng được. Chữ vượt phạm vi hành nghề Y sỹ: "chữa" (mô tả) → hỗ trợ / cải thiện / theo lý luận Đông Y. Xem khung "Phiếu Rada" để thấy đủ.` Bản đang đăng giữ mô tả cũ. |
| 8 | Grep bí mật | **ĐẠT** | Log server (20 dòng): 0 dòng `ec_pat_`, 0 dòng aiven/ECONNREFUSED, 0 lần trúng 16 ký tự đầu của khoá bàn thử. `grep -rl aivencloud dist-thu/` ra 0 tệp; `dist-thu/` không có chuỗi `ec_pat_` dài nào và không chứa khoá bàn thử (đo trước khi xoá). |

## Bất ngờ / điều phải biết

1. **Chú thích `<!--ec:block {…} -->` trong Markdown là đường chèn khối THẬT.** `markdownToPortableText`
   của EmDash biến nó thành khối `image` trỏ `https://evil.example/x.png` (lời bác `khuon:khoi_la` nêu
   "khối 20: kiểu image"). Hai lớp rào (`khuon:html` trên md, `kiemPtAnToan` trên PT) đều bắt, nên
   không có gì lọt; nhưng đây không phải rào đề phòng lý thuyết. Ai gỡ một trong hai lớp phải biết
   lớp còn lại đang gác một lối vào có thật.
2. **Tab Kế hoạch mở ra với bộ lọc "Chờ duyệt"**, nên bài `can_xem` không hiện ("Không có bài dự kiến
   nào khớp bộ lọc") cho tới khi người quản trị tự chọn "Cần xem lại". Không có dải báo nào ở đầu tab
   kiểu "1 bài cần xem lại". Bài trượt 3 lượt vì thế dễ nằm im không ai thấy.
3. **Bài 334 từ vẫn thành nháp.** Độ dài chỉ là cờ (`do_dai`), đúng quyết định "không bao giờ khuyên
   viết dài hơn". Hệ quả: routine nộp bài cụt thì người duyệt nhận nháp cụt, và phiếu tóm tắt ở tab
   Nháp chỉ ghi "334 từ", không tô màu hay đánh dấu là ngoài khoảng.
4. **"chữa khỏi" ở chế độ thường chỉ báo chữ "chữa"**, không báo "khỏi" (mục 7.2). Vẫn chặn đúng,
   nhưng người sửa thay "chữa" bằng "hỗ trợ" sẽ ra "hỗ trợ khỏi mất ngủ" và qua cổng thường. Chế độ
   nghiêm (bài máy viết) thì bắt "khỏi hẳn" riêng (mục 3.3).
5. **Lời bác `lien_ket_nguy_hiem` in href bị cụt**: `"javascript:alert(1"` (mất dấu `)` vì bộ tách link
   dừng ở ngoặc đóng đầu tiên). Chặn đúng, chỉ là chữ trích không nguyên văn.
6. **Lý do bỏ nguồn in mã, không in câu**: `khong_phai_nguon`, `khong_co_trang_nguon`. Routine đọc được
   vì lời dặn đã giải thích luật nguồn, nhưng `loiCuoi` hiện cho người quản trị cũng là các mã này.
7. **Nguồn `/nguon/` không đo được trên bàn thử**: seed không có bộ `nguon_y_van`, nên chỉ mục nội bộ
   không có mục loại `nguon`. Nhánh "tên sách không URL khớp trang `/nguon/`" chỉ đo được chiều bác
   (`khong_co_trang_nguon`); chiều nhận do phép kiểm đơn vị giữ. Tên của 4 trong 6 link đích cũng rỗng
   vì cùng lý do (từ điển bàn thử chỉ có 3 mục).
8. **Editor thấy mục "Rada SEO" ở thanh bên nhưng các route của tab trả 403** (quyền mặc định
   `plugins:manage`). Console của phiên Editor có 2 lỗi 403 và 1 lỗi 404 mỗi lần mở trình soạn; khung
   "Phiếu Rada" không bị ảnh hưởng. Người duyệt bậc Editor vì thế không dùng được tab Nháp: họ vào
   bài qua danh sách Bài Viết của CMS, nơi tiêu đề nháp còn là bản không dấu (bản đo thử 1b).
9. **Alt gửi kèm lúc tải ảnh lên (multipart) bị bỏ**; phải `PUT` riêng. Ảnh bìa được chọn theo alt,
   nên ảnh nạp bằng script mà quên bước này sẽ không bao giờ được chọn.
10. **`featured_image` trong revision nháp do plugin ghi là id trần**, khác hình với bản trình soạn
    ghi (object đầy đủ). Đã đo là vô hại (mục 4.7), nhưng mã nào đọc `rev.data.featured_image` phải
    chịu được cả hai hình.
11. Lượt nộp có nguồn bên thứ ba mất ~4 s (4.096 ms và 4.209 ms), lượt chỉ có nguồn đã vào đệm mất
    ~1–1,6 s. Không lượt nào chạm hạn tổng 60 s.

## Liên lạc ra ngoài trong lúc đo

- **kinhlac.online** (GET trang công khai): plugin kiểm link khi lập kế hoạch và khi nộp bài (trụ cột,
  các trang `/huyet/…` của ba bài dự kiến, và `/khong-co-trang-nay-xyz/` ở mục 3.7). Tôi tự `curl` 13 trang để chọn link
  đích (`/huyet/an-mien/` trả 404 nên bỏ) và tải 3 ảnh `…/anh/huyet/…-toan-duong-kinh.webp` làm ảnh thử.
  Không gọi endpoint quản trị hay MCP nào của production.
- **Nguồn bên thứ ba** (GET, qua `ssrfSafeFetch` của EmDash, không bị bộ kiểm quyền chặn):
  `vi.wikipedia.org/wiki/Mất_ngủ`, `medlineplus.gov/insomnia.html`,
  `www.nccih.nih.gov/health/sleep-disorders-and-complementary-health-approaches`. Mỗi URL được máy chủ
  tải ở các lượt nộp có dẫn nó; tôi tự `curl` 4 URL một lần để chọn (một URL NCCIH trả 301 nên không dùng).
  `example.com` và `evil.example` chỉ xuất hiện trong thân bài thử, không bao giờ được tải.
- **cloudflare-dns.com**: DoH do lớp chống SSRF của EmDash tự gửi (xem 2C-1).
- Không gọi Google Fonts, GSC hay Google Suggest (không chạy ca radar). Không chạm DB CMS thật hay DB
  app. Không ký vé SSO.

## Dọn

Server đã dừng (cổng 4399 không còn nghe). Đã xoá `cms/astro.config.thu.mjs`, `cms/dist-thu/`, DB thử,
thư mục ảnh, khoá `ec_pat_…`, cookie của hai phiên và link mời trong scratchpad. `cd cms && npx astro sync`
đưa `.emdash/migrations.json` về `"type": "postgres"`, **giống từng byte** bản sao lưu chụp trước khi
build (`cmp`; tệp này nằm trong `.gitignore` nên không so được với git). `git status --short` sạch
trước khi commit tệp này.
