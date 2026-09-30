# Rada SEO 2C — phân cụm theo nghĩa, kế hoạch nội dung, mạng liên kết nội bộ

Ngày: 30/09/2026 · Trạng thái: **2C-1 và 2C-2 ĐÃ DỰNG** (mục 1–4, xem "Chia kế hoạch" cuối
tài liệu; tên công cụ MCP dưới đây là tên THẬT đã cắm, không còn là đề xuất) · **2D (mục 8)
ĐÃ DỰNG** · 2C-3 (mục 5) và mục 6–7 còn ở dạng thiết kế, chưa dựng. Thay cho "kế hoạch 2B-2 — lò viết" (gộp vào đây).
Căn cứ: `2026-09-30-rada-seo-doi-chieu-n8n-ai5phut.md` (video + 3 workflow n8n) và đặc tả gốc
`2026-09-30-radar-lo-viet-plugin-cms-design.md`.

## Mục tiêu — Radar do thám HAI CHIỀU (người dùng chốt 30/09/2026)

1. **Chiều 1 — chiếm đất:** lấy toàn bộ thông tin đối thủ → tìm khoảng trống CHƯA AI LÀM (hoặc
   mình chưa làm) → đề xuất hướng nội dung để viết. (Mục 1–5 dưới.)
2. **Chiều 2 — leo top:** từ khoá của mình đã VÀO bảng xếp hạng (GSC) → soi các trang đang đứng
   đầu → tìm SƠ HỞ của từng trang → đắp vào trang mình để thành trang **ít sơ hở nhất, trải
   nghiệm tốt nhất**. Quan điểm của người dùng: top 1 không phải trang đầy đủ nhất mà là trang
   ít sơ hở nhất — nên Rada **không** khuyên viết dày thêm; nó tìm chỗ người khác thiếu, thừa,
   rườm, chậm. (Mục 8.)

Hai chiều dùng chung: đường đọc trang qua Claude (MCP, dấu mốc), máy chấm luật, kho nội bộ.

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
    rada_lay_du_lieu_chien_luoc → ĐỀ XUẤT HƯỚNG từ cụm đối thủ (trọng số gợi ý) → PHÂN CỤM
    trong hướng đã nhận → KHOẢNG TRỐNG → rada_ghi_cum + rada_de_xuat_ke_hoach (≤10 bài/tuần)
Người quản trị   tab "Hướng nội dung": Nhận / chỉnh trọng số / Bỏ
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

## 2. Hướng nội dung đi ra TỪ ĐỐI THỦ, phân cụm theo nghĩa (routine chiến lược hằng tuần) — ĐÃ DỰNG

Dựng đúng như mô tả dưới: `chien-luoc/chi-so.mjs` (chấm điểm đo được), `kho.mjs` (bảng `huong`
+ `cum_nghia`), `chien-luoc/viec.mjs` (`deXuatHuong`/`ghiCum`/`layDuLieu`, mọi rào), route +
công cụ MCP thật trong `plugin.mjs`, hai tab duyệt trong `admin.jsx`. Routine chạy nó:
`routine/tuan-chien-luoc.md` (Chủ Nhật 06:00 giờ VN).

> Sửa theo góp ý người dùng (30/09/2026): KHÔNG khai cứng "trọng số dịch vụ" (đo kinh lạc, phần
> mềm, từ điển…) — như thế là tự nhốt vào ngách quá nhỏ. Trọng số phải **do dữ liệu đối thủ đề
> xuất**, người dùng duyệt.

**Hướng nội dung** (bảng mới `huong`) thay cho bảng dịch vụ cố định. Mỗi tuần routine chiến
lược đọc các cụm đối thủ và ĐỀ XUẤT hướng (vd "mất ngủ theo Đông y", "xương khớp theo YHCT",
"dưỡng sinh theo mùa"), kèm trọng số gợi ý và lý do. Không có hướng gieo sẵn.

**Máy chủ chấm điểm hướng** từ tín hiệu ĐO ĐƯỢC (mô hình không tự chấm):

| Tín hiệu | Đo bằng |
|---|---|
| Nhu cầu thị trường | số đối thủ + số bài đối thủ trong hướng, trúng xu hướng tìm kiếm |
| Khoảng trống của mình | số bài blog / trang của mình đã có trong hướng (ít → điểm cao) |
| **Tài sản nội bộ** | số trang từ điển liên quan (huyệt, bài thuốc, dược liệu, bệnh học) — lợi thế riêng: bài vừa sâu vừa dẫn traffic vào 18.425 trang từ điển |
| Rủi ro phạm vi Y sỹ | hướng nghiêng chữa trị/hứa kết quả → trừ nặng hoặc loại |
| Gần sản phẩm (điểm cộng NHỎ) | có đường dẫn tự nhiên về đo kinh lạc / phần mềm / từ điển — không phải điều kiện |

**Người dùng duyệt hướng** (tab "Hướng nội dung"): mỗi hướng hiện bằng chứng (đối thủ nào,
bao nhiêu bài, trang từ điển nào liên quan) và trọng số gợi ý → **Nhận** (trọng số dùng được
chỉnh 1–5) / **Bỏ** (kèm lý do; tuần sau không đề xuất lại). Cụm và bài dự kiến chỉ sinh trong
hướng đã nhận.

**Công cụ `rada_lay_du_lieu_chien_luoc`** trả gọn: chủ đề đối thủ đã đọc (id, chủ đề, từ khoá,
đối thủ) — CHỈ 1.500 dòng mới nhất (rà soát I4: tính toàn kho tăng theo bình phương); kho của
mình (tiêu đề + từ khoá bài blog đã đăng, tên trang trụ cột); các hướng (đã nhận / đã bỏ + lý
do); cụm và bài dự kiến đang có. Kèm BA lời nhắc do máy chủ giữ (`loi-dan.mjs`): **đề xuất
hướng**, **phân tích cụm**, **phân tích khoảng trống** (chuyển ý từ 2 prompt của video, thêm
ràng buộc Đông y + phạm vi Y sỹ).

**Claude trả về:** `rada_de_xuat_huong` (hướng mới + trọng số gợi ý + lý do + id bài đối thủ làm
bằng chứng) và `rada_ghi_cum` (cụm trong các hướng đã nhận — tên, mô tả, id bài đối thủ thuộc
cụm, bài của mình thuộc cụm). **Máy chủ tính điểm cụm** = điểm hướng × (nhu cầu + khoảng trống
+ tài sản nội bộ) của riêng cụm. Luật trùng-chữ cũ hạ xuống làm **bằng chứng**, không còn là
sản phẩm cuối.

## 3. Kho nội bộ = đích liên kết

Dựng từ CMS, **không quét, không gọi AI**, lưu trong bộ nhớ tiến trình CMS (TTL 24 giờ, dựng
lười, một lượt đọc ≈ 45 truy vấn cho ~4.500 mục): huyệt vị, kinh mạch, bệnh học, châm cứu trị
bệnh, dược liệu, nguồn y văn, bài viết đã đăng. Bài thuốc (13.942) KHÔNG nạp: tra theo tên qua
`POST /tra-cuu/ten` của app (công khai, đã có index slug — CLAUDE.md "Liên kết chéo từ điển").

**Trang trụ cột:** trang kinh, trang bệnh học, trang nhóm dược lý là trụ cột tự nhiên của cụm;
mỗi bài dự kiến chỉ định MỘT trụ cột, bài viết phải link lên trụ cột.

Công cụ **`rada_tim_lien_ket`** (cụm từ → các đường dẫn có thật + tên + loại): Claude dùng khi
lập kế hoạch và khi viết. Máy chủ **kiểm lại mọi link** ở cả hai khâu (link chết bị gỡ như cũ).

## 4. Kế hoạch nội dung (bài dự kiến) — ĐÃ DỰNG

Dựng đúng như mô tả dưới: bảng `ke_hoach` trong `kho.mjs` (`themKeHoach`/`datKeHoach`), rào
đủ 3 lớp trong `chien-luoc/viec.mjs` (`deXuatKeHoach`), công cụ MCP thật `rada_de_xuat_ke_hoach`,
tab **Kế hoạch** trong `admin.jsx` (nhóm theo hướng → cụm, nút Duyệt/Bỏ, lọc trạng thái).

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

## 8. Chiều 2 — leo top: bản đồ sơ hở của trang đang thắng — ĐÃ DỰNG (2D, 30/09/2026)

> **Đã dựng khác thiết kế dưới đây ở mấy chỗ (bản thật thắng):** tối đa **5** phiên mới mỗi lượt
> và trần **10** phiên mở (co_phieu chỉ giữ chỗ 30 ngày kể từ lúc ra phiếu); cặp từ khoá–trang
> không soi lại trong 28 ngày; ý cốt lõi ≥ 60% số trang ĐỐI THỦ (không tính trang mình), ý thừa
> chỉ kết luận khi đo được ≥ 5 trang đối thủ; phiếu có thêm "khác biệt — giữ lại" và "căn cứ cần
> bổ sung". Vòng học (bước 7) đo ở **+14 / +28 ngày sau ngày người quản trị bấm "Đã sửa theo
> phiếu"** (không phải ngày đăng), cửa sổ GSC mở từ ngày sửa + 3, so hạng bình quân và hiển thị
> MỖI NGÀY; phần "tổng hợp loại sửa nào hay giúp lên hạng" và "bản sửa nháp cho bài blog" (cần
> 2C-3) CHƯA dựng. Mã: `leo-top/` (gsc, do-trang, ban-do), `leo-top-viec.mjs`, `kho.mjs`,
> `ca-radar.mjs`; tab **Leo top** trong `admin.jsx`; routine `routine/tuan-leo-top.md` (môi trường
> RIÊNG vì phải tìm web). Sau deploy: 3 biến GSC vào `cms/.env`, bật lại MCP tools (12 công cụ)
> — xem `DEPLOYMENT.md` mục "Rada SEO".

**Nguồn:** hạng của CHÍNH MÌNH lấy đúng từ GSC. Trang đối thủ trên SERP do routine Claude tự
tìm bằng công cụ tìm kiếm web có sẵn trong gói (người dùng chọn, 30/09/2026) — khoảng **top 10
ước lượng**, không phải hạng chính xác từng vị trí, không tới top 50. KHÔNG cào Google bằng bot
né CAPTCHA (trái điều khoản Google; chạy từ IP VPS đang phục vụ site thật — bị chặn là vạ lây
cả GSC/IndexNow; và hỏng im lặng khi Google đổi cách chặn). Khoá Google Custom Search hiện có
trả 403 "project chưa có quyền dùng Custom Search JSON API" (đo 30/09/2026). Nâng cấp sau nếu
cần hạng thật tới top 50: DataForSEO (trả phí theo lượt).

**GSC trong plugin:** plugin gọi thẳng Search Console API bằng cùng bộ OAuth của backend
(`GSC_OAUTH_CLIENT_ID/SECRET/REFRESH_TOKEN` khai thêm vào `cms/.env`) — lặp ~60 dòng của
`GscService.strikingDistance` nhưng giữ plugin tự đứng, không mở cửa gọi chéo sang backend.

**Nhịp (hằng tuần, routine LEO TOP, thứ Tư 05:00):**

1. `rada_lay_tu_khoa_leo_top` → 3–5 từ khoá: trang của mình ở hạng 4–50, có lượt hiển thị,
   xếp theo cơ hội (hiển thị × khoảng cách tới top 3); bỏ từ khoá đã soi trong 4 tuần gần nhất.
2. Claude tìm web từ khoá đó → gửi `rada_nop_serp` (danh sách ~10 URL theo thứ tự thấy được).
3. **Máy đo từng trang (không AI)** qua `ctx.http` + chống SSRF: vị trí câu trả lời (số chữ
   trước đoạn trả lời trực tiếp đầu tiên), số chữ, số mục H2/H3, bảng, danh sách, hình, FAQ,
   JSON-LD, ngày cập nhật, tác giả/người duyệt, số nguồn dẫn ra ngoài; cùng số đo cho trang
   của mình. (Tốc độ tải: PageSpeed API miễn phí, chỉ top 3 + mình — tuỳ chọn.)
4. `rada_lay_trang_serp` → Claude đọc chữ từng trang (bọc dấu mốc, như routine đọc) →
   `rada_ghi_so_ho`: các Ý trang trả lời (tên ý ngắn), câu trả lời chính nằm ở đâu, đoạn rườm,
   chỗ thiếu căn cứ, chỗ khó dùng.
5. **Máy chủ dựng bản đồ sơ hở** (không để mô hình tự chấm):
   - **Ý cốt lõi** = ý mà ≥ 60% trang soi được cùng trả lời → người tìm thật sự cần. Trang
     nào thiếu = sơ hở "thiếu ý".
   - **Ý thừa** = ý ≤ 20% trang có và không khớp ý định → rườm; KHÔNG khuyên học theo.
   - **Sơ hở trải nghiệm**: trả lời muộn (câu trả lời sau N chữ), không tóm tắt/bảng khi ý có
     dạng so sánh/liệt kê, không nguồn, cũ, không tác giả, chậm.
   - **Dấu hiệu người thắng**: đặc điểm chung của 3 trang đầu mà các trang sau không có.
6. **Phiếu leo top** cho trang của mình: ý cốt lõi còn thiếu (viết NGẮN), câu trả lời đưa lên
   đầu, phần nên cắt, yếu tố trải nghiệm nên thêm — ưu tiên tài sản riêng đối thủ không có (ảnh
   huyệt 3D, đồ hình kinh, liên kết từ điển). Mục tiêu "đủ ý cốt lõi, ngắn nhất, dễ dùng nhất".
   - Bài blog (CMS): routine viết (2C-3) dựng **bản sửa nháp** theo phiếu → người duyệt.
   - Trang từ điển (HTML tĩnh do builder sinh): phiếu là **đề xuất** trên màn Rada; áp tay
     trong CMS rồi build lại.
7. **Vòng học:** 2 và 4 tuần sau khi bản sửa được đăng, đọc lại hạng GSC của từ khoá → ghi
   "đã lên / đứng yên / tụt" vào phiếu; màn Rada tổng hợp loại sửa nào hay giúp lên hạng.

Màn Rada: tab **Leo top** — từ khoá, hạng hiện tại, bản đồ sơ hở (bảng ý × trang), phiếu,
kết quả đo lại.

## Ngoài phạm vi 2C

Google Trends có điểm (cần SerpAPI trả phí — giữ Google Suggest); chấm độ khó từ khoá / lượng
tìm (cần công cụ trả phí); chọn đối thủ tự động theo DR/traffic (giữ thủ công, thêm gợi ý tiêu
chí trên màn Rada).

## Chia kế hoạch

- **2C-1 ĐÃ DỰNG** Nguồn + kho nội bộ: sitemap bài viết, van hàng chờ, kho nội bộ +
  `rada_tim_lien_ket`. Nghiệm thu: `2026-09-30-rada-seo-nghiem-thu-2c1.md`.
- **2C-2 ĐÃ DỰNG (30/09/2026)** Chiến lược: hướng nội dung (đề xuất từ đối thủ + chấm điểm đo
  được + tab duyệt), bốn công cụ MCP thật `rada_lay_du_lieu_chien_luoc`, `rada_de_xuat_huong`,
  `rada_ghi_cum`, `rada_de_xuat_ke_hoach` (đã cắm trong `plugin.mjs`, không còn là tên đề
  xuất), bằng chứng + điểm (`chien-luoc/chi-so.mjs`), hai tab **Hướng nội dung** / **Kế
  hoạch** trong `admin.jsx`, routine chiến lược `routine/tuan-chien-luoc.md` (Chủ Nhật 06:00
  giờ VN). Sau deploy: bật lại MCP tools (8 công cụ, xem `DEPLOYMENT.md` mục "Rada SEO").
- **2C-3** Viết: `rada_lay_bai_can_viet`, `rada_nop_bai` (rào + xác minh nguồn + link + ảnh +
  md→PT + slug), phiếu chấm, beforeSave, IndexNow, routine viết.
- **2D ĐÃ DỰNG (30/09/2026)** Chiều 2 — leo top: GSC trong plugin, `rada_lay_tu_khoa_leo_top`, `rada_nop_serp`,
  máy đo trang, `rada_lay_trang_serp`, `rada_ghi_so_ho`, bản đồ sơ hở, phiếu, vòng học, tab Leo top,
  routine leo top. Dựng sau 2C-1 (dùng chung kho nội bộ + đường đọc trang).
- Sau: mạng nhện hai chiều; làm đẹp màn Rada theo bộ giao diện EmDash.
