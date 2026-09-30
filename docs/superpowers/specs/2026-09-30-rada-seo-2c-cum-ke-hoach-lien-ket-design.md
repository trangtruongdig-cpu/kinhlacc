# Rada SEO 2C — phân cụm theo nghĩa, kế hoạch nội dung, mạng liên kết nội bộ

Ngày: 30/09/2026 · Trạng thái: thiết kế chờ người dùng duyệt · Thay cho "kế hoạch 2B-2 — lò
viết" (gộp vào đây). Căn cứ: `2026-09-30-rada-seo-doi-chieu-n8n-ai5phut.md` (video + 3 workflow
n8n) và đặc tả gốc `2026-09-30-radar-lo-viet-plugin-cms-design.md`.

## Mục tiêu

Làm đủ 4 việc agency SEO làm (theo video): **cụm** → **bản đồ nội dung** → **mạng liên kết nội
bộ** → **sản xuất**. Rada hiện chỉ có đầu vào (gom + đọc trang đối thủ) và một danh sách
"khoảng trống" dựa trên trùng chữ.

## Quyết định đã chốt với người dùng

- **Duyệt hai chỗ** (30/09/2026): người quản trị duyệt **kế hoạch** (tick từng bài dự kiến),
  máy chỉ viết bài đã tick, rồi người quản trị duyệt **bản nháp** và tự bấm Publish.
- AI chạy bằng gói Claude qua MCP (không khoá API) — giữ nguyên 2B-1.
- Ảnh chỉ từ thư viện CMS — giữ nguyên.

## Luồng mới

```
Hằng đêm 02:30  radar (plugin): sitemap BÀI VIẾT → trích chữ (có van hàng chờ)
Hằng đêm 05:00  routine ĐỌC (Claude): đọc ≤40 trang đối thủ → chủ đề/từ khoá/tóm tắt
Hằng tuần CN 06:00  routine CHIẾN LƯỢC (Claude):
    rada_lay_du_lieu_chien_luoc → PHÂN CỤM (đối thủ + mình) → PHÂN TÍCH KHOẢNG TRỐNG có trọng
    số dịch vụ → rada_ghi_cum + rada_de_xuat_ke_hoach (≤10 bài dự kiến/tuần)
    → máy chủ gắn BẰNG CHỨNG (số đối thủ, xu hướng, trùng, phạm vi Y sỹ) + kiểm link đích
Người quản trị   màn Rada SEO → tab "Kế hoạch": tick Duyệt / Bỏ từng bài dự kiến
Hằng đêm 05:30  routine VIẾT (Claude): nếu nháp chờ duyệt < 25 và có bài đã tick:
    rada_lay_bai_can_viet (≤ N/đêm) → NGHIÊN CỨU có nguồn (web) → viết theo khuôn
    → rada_nop_bai → máy chủ: rào luật + xác minh nguồn + link nội bộ + ảnh thật → nháp CMS
Người quản trị   CMS: đọc nháp + phiếu chấm → sửa → Publish
```

## 1. Nguồn dữ liệu (sửa radar)

- **Chỉ sitemap bài viết.** Phân loại sitemap con theo tên/đường dẫn: giữ `post`, `blog`,
  `tin-tuc`, `bai-viet`, `news`, `article`; bỏ `page`, `category`, `tag`, `author`, `product`,
  `doctor`/`bac-si`, `chi-nhanh`, `service`/`dich-vu`, `tuyen-dung`. Không nhận dạng được thì
  giữ (an toàn hơn bỏ sót), ghi vào nhật ký tên sitemap đã bỏ để người quản trị soát.
- **Van hàng chờ trích chữ** (rà soát 2B-1, I5): không trích thêm khi hàng `cho_ai` > 80
  (≈ 2 đêm đọc). Nhờ vậy chữ không cũ đi hàng tuần và kho không phình.
- **Site của mình KHÔNG cần quét sitemap nữa**: kho của mình lấy thẳng từ CMS (mục 3).

## 2. Phân cụm theo nghĩa + khoảng trống có trọng số (routine chiến lược hằng tuần)

**Trọng số dịch vụ** — bảng mới trong plugin, người quản trị sửa trên màn Rada:

| Dịch vụ (mặc định) | Trọng số 1–5 |
|---|---|
| Đo nhiệt độ kinh lạc / chẩn đoán kinh lạc | 5 |
| Huyệt vị, đường kinh, châm cứu (tra cứu + 3D) | 4 |
| Bài thuốc, vị thuốc (tính vị quy kinh) | 4 |
| Biện chứng luận trị | 3 |
| Phần mềm quản lý phòng chẩn trị Đông y | 3 |

**Công cụ `rada_lay_du_lieu_chien_luoc`** trả gọn: chủ đề đối thủ đã đọc (id, chủ đề, từ khoá,
đối thủ) — CHỈ 1.500 dòng mới nhất (rà soát I4: tính toàn kho tăng theo bình phương); kho của
mình (tiêu đề + từ khoá bài blog đã đăng, tên các trang trụ cột); trọng số dịch vụ; các cụm và
bài dự kiến đang có (để không đề xuất lại cái đã bỏ). Kèm HAI lời nhắc do máy chủ giữ
(`loi-dan.mjs`): **phân tích cụm** và **phân tích khoảng trống** (chuyển ý từ 2 prompt của
video, thêm ràng buộc Đông y + phạm vi Y sỹ).

**Claude trả về** (`rada_ghi_cum`): các cụm — tên, mô tả, danh sách id bài đối thủ thuộc cụm,
bài của mình thuộc cụm, dịch vụ liên quan, nhận xét "đối thủ dồn lực / mình còn trống".

**Máy chủ tính điểm cụm** (không để mô hình tự chấm): số đối thủ có bài trong cụm, số bài đối
thủ, số bài của mình, trọng số dịch vụ, trúng xu hướng → điểm. Luật trùng-chữ cũ hạ xuống làm
**bằng chứng**, không còn là sản phẩm cuối.

## 3. Kho nội bộ = đích liên kết

Dựng từ CMS, **không quét, không gọi AI**, lưu trong bộ nhớ tiến trình CMS (TTL 24 giờ, dựng
lười, một lượt đọc ≈ 45 truy vấn cho ~4.500 mục): huyệt vị, kinh mạch, bệnh học, châm cứu trị
bệnh, dược liệu, nguồn y văn, bài viết đã đăng. Bài thuốc (13.942) KHÔNG nạp: tra theo tên qua
`POST /tra-cuu/ten` của app (công khai, đã có index slug — CLAUDE.md "Liên kết chéo từ điển").

**Trang trụ cột:** trang kinh, trang bệnh học, trang nhóm dược lý là trụ cột tự nhiên của cụm;
mỗi bài dự kiến chỉ định MỘT trụ cột, bài viết phải link lên trụ cột.

Công cụ **`rada_tim_lien_ket`** (cụm từ → các đường dẫn có thật + tên + loại): Claude dùng khi
lập kế hoạch và khi viết. Máy chủ **kiểm lại mọi link** ở cả hai khâu (link chết bị gỡ như cũ).

## 4. Kế hoạch nội dung (bài dự kiến)

Bảng mới `ke_hoach`, mỗi dòng một bài:

| Trường | Ý nghĩa |
|---|---|
| cumId | cụm |
| tieuDeLamViec | tiêu đề tạm |
| tuKhoaChinh | 1 cụm từ; phải xuất hiện trong tiêu đề, slug, đoạn đầu, mô tả |
| tuKhoaPhu | 2–6 cụm |
| yDinh | người tìm muốn gì (tra cứu / tìm hiểu / so sánh / hướng dẫn) |
| trangTruCot | 1 đường dẫn có thật |
| lienKetDich | ≥ 5 đường dẫn có thật (từ `rada_tim_lien_ket`) |
| goiYNguon | vài URL gợi ý để nghiên cứu (không bắt buộc) |
| bangChung | do máy chủ gắn: đối thủ nào viết, bài nào, trúng xu hướng?, cảnh báo trùng |
| trangThai | de_xuat → da_duyet / bo_qua → dang_viet → co_nhap → da_dang |

Máy chủ **từ chối** bài dự kiến khi: tiêu đề/từ khoá chính vượt phạm vi Y sỹ; trùng một bài
blog đã có hoặc trùng tên mục từ điển (chống trùng 3 lớp của đặc tả gốc); trụ cột/link đích
không có thật. ≤ 10 đề xuất mỗi tuần.

Màn Rada: tab **Kế hoạch** — mỗi dòng hiện tiêu đề, từ khoá chính/phụ, ý định, trụ cột, bằng
chứng; nút **Duyệt** / **Bỏ** (kèm lý do ngắn, Claude đọc lại tuần sau để khỏi đề xuất lại).

## 5. Viết bài (routine viết hằng đêm) — thay 2B-2

- `rada_lay_bai_can_viet`: trả ≤ N bài đã duyệt (mặc định N = 2/đêm; người dùng từng chọn 5 —
  nay bị chặn thêm bởi số bài đã tick và trần 25 nháp chờ duyệt).
- **Nghiên cứu có nguồn:** routine dùng tìm kiếm/đọc web của Claude, gom URL nguồn thật.
  `rada_nop_bai` **tải lại từng URL nguồn** (qua `ctx.http`, cùng lớp chống SSRF) — URL không
  tải được thì loại; tên sách không có URL thì chỉ nhận khi khớp một mục `/nguon/`. (Nới rào
  "chỉ URL đã quét" của đặc tả gốc thành "URL xác minh được", vì bài y khoa không nghiên cứu là
  viết từ trí nhớ mô hình.)
- **Khuôn bài** (lấy từ workflow TREND POST, bỏ phần Substack): tiêu đề có từ khoá chính; đoạn
  dẫn; **Điểm chính**; **Mục lục** có neo; thân bài H2/H3; **Câu hỏi thường gặp**; **Nguồn tham
  khảo**; câu miễn trừ y khoa. 1.200–2.000 từ.
- **Liên kết nội bộ**: ≥ 5 link đích của kế hoạch + link lên trụ cột, chèn đúng ngữ cảnh; máy
  chủ đếm và kiểm.
- **Slug / tiêu đề SEO / mô tả 120–160 ký tự** có từ khoá chính (+ phụ nếu tự nhiên) — luật
  `chamSeo` đã có.
- Rào: phạm vi Y sỹ (vá lỗ "thăm khám" trước khi làm cổng chặn), YMYL, chống trùng; ảnh thật
  từ thư viện; phiếu chấm `editorPanels`; IndexNow khi đăng (hook `content:afterPublish`).
- Bài vào CMS **chỉ** qua `rada_nop_bai` (khoá không có `content:write`). Hook
  `content:beforeSave` trên `bai_viet` chấm cả bài người biên tập tự tạo.

## 6. Mạng nhện hai chiều (giai đoạn sau, không chặn 2C)

Khi một bài được Publish: máy chủ tìm bài/trang cũ cùng cụm chưa link tới bài mới → gợi ý
"chèn link ngược" trong phiếu chấm của bài cũ (người biên tập bấm mới chèn). Video và workflow
đều chỉ làm chiều mới → cũ.

## 7. An toàn của các routine (rà soát 2B-1, I1)

- **Ba routine, hai môi trường:** routine ĐỌC (đọc chữ đối thủ — nguồn lệnh độc chính) và
  CHIẾN LƯỢC chạy trong môi trường mạng CHỈ `kinhlac.online`; routine VIẾT cần web để nghiên
  cứu nên mạng mở, nhưng KHÔNG nhận chữ trang đối thủ (chỉ nhận kế hoạch đã duyệt).
- Mọi routine: không connector, tắt push nhánh tự do, không Bash/git theo lời dặn; khoá chỉ
  `mcp:tools:rada-seo`.
- Tên cụm / từ khoá do Claude sinh từ chữ đối thủ là **dữ liệu không tin cậy** khi đưa sang
  routine viết — bọc dấu mốc như chữ trang.
- Đề xuất (chưa bắt buộc): chạy routine từ một repo nhỏ riêng chỉ có `.mcp.json` + lời dặn —
  bớt quota (không nạp CLAUDE.md 40KB mỗi đêm) và bỏ `.mcp.json` khỏi repo chính.

## Ngoài phạm vi 2C

Google Trends có điểm (cần SerpAPI trả phí — giữ Google Suggest); chấm độ khó từ khoá / lượng
tìm (cần công cụ trả phí); chọn đối thủ tự động theo DR/traffic (giữ thủ công, thêm gợi ý tiêu
chí trên màn Rada).

## Chia kế hoạch

- **2C-1** Nguồn + kho nội bộ: sitemap bài viết, van hàng chờ, kho nội bộ + `rada_tim_lien_ket`.
- **2C-2** Chiến lược: trọng số dịch vụ, `rada_lay_du_lieu_chien_luoc`, `rada_ghi_cum`,
  `rada_de_xuat_ke_hoach`, bằng chứng + điểm, tab Kế hoạch, routine chiến lược.
- **2C-3** Viết: `rada_lay_bai_can_viet`, `rada_nop_bai` (rào + xác minh nguồn + link + ảnh +
  md→PT + slug), phiếu chấm, beforeSave, IndexNow, routine viết.
- Sau: mạng nhện hai chiều; làm đẹp màn Rada theo bộ giao diện EmDash.
