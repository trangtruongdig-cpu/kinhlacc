# Kế hoạch SEO thống nhất cho kho từ điển (18.504 trang)

Ngày: 29/09/2026 · Trạng thái: **ĐÃ DUYỆT, đang làm** — bước 1, 2, 3 và phần ô CMS đã viết mã; chưa deploy.

## Quyết định đã chốt (29/09/2026)

1. **Trang trùng → canonical về bản chính.** Luật ở `frontend/scripts/trung-lap-bai-thuoc.mjs`:
   cùng tập vị VÀ (cùng tên gốc HOẶC tác dụng gần trùng chữ). Cùng tên mà khác vị thì KHÔNG
   gom (khác phương) — tiêu đề kèm tên sách để khỏi trùng.
2. **Ô SEO trong CMS đầy chữ, sửa tay được như WordPress.** Máy điền bản tự sinh
   (`dong-bo-seo-cms.mjs`), cập nhật theo mỗi lần build; ô nào người đã sửa thì giữ nguyên
   mãi. Phân biệt bằng sổ `kl_seo_tu_sinh`. Thay cho luật "CMS chỉ là ngoại lệ" ở mục 0.
3. **Nguồn chỉ index khi ≥3 trích dẫn hoặc có mô tả.**

## 0. Vì sao không "điền cho đủ" các ô SEO trong CMS

Các ô SEO Title / Meta Description / OG Image / Canonical trong CMS là **ô GHI ĐÈ**
(`_emdash_seo` → `frontend/scripts/seo-cms.mjs`). Ô để trống thì khâu build **tự sinh**,
và hôm nay 18.504/18.504 trang đều đã có title, description, canonical, JSON-LD
(`kiem-seo.mjs`: 9/9 phép kiểm đạt).

Chép bản tự sinh vào 18.000 ô thì mắc ba lỗi và không được gì thêm:

1. **Đóng băng**: mai sửa tác dụng của một bài thuốc thì mô tả SEO vẫn là chữ cũ.
2. **Mất công thức chung**: muốn đổi cách viết tiêu đề cho cả kho thì phải sửa 18.000 ô
   thay vì sửa một hàm.
3. Google thấy **y hệt** thứ đang thấy, nên thứ hạng không thay đổi gì.

→ **Luật**: CMS chỉ dùng cho NGOẠI LỆ, tức trang quan trọng mà người biên tập muốn viết
tay. Chất lượng SEO của cả kho nằm ở **bộ sinh**, và phải là MỘT bộ sinh.

## 1. Rà soát: số đo thật (dist/ ngày 29/09/2026 + DB app)

| Nhóm | Trang | Được index | Số từ (trung vị) | Chữ độc nhất (trung vị) | Index mà chữ độc nhất <30% |
|---|---|---|---|---|---|
| /bai-thuoc/ | 13.943 | 5.984 | 125 | **32%** | **2.116** |
| /nguon/ | 2.140 | 2.045 | **47** | **30%** | **973** |
| /duoc-lieu/ | 1.113 | 268 | 163 | 46% | 3 |
| /huyet/ | 1.060 | 662 | 313 | 38% | 87 |
| /benh-hoc/ | 101 | 101 | 4.770 | 82% | 3 |
| /cham-cuu-tri-benh/ | 101 | 101 | 2.196 | 64% | 17 |
| /kinh/ | 21 | 21 | 1.063 | 86% | 0 |

"Chữ độc nhất" = tỉ lệ cụm 5 từ của trang không xuất hiện ở trang nào khác. Phần còn
lại là khuôn: menu, miễn trừ, nhãn "Thành phần:", danh sách vị thuốc lặp lại.

### Vấn đề, xếp theo tác hại

**A. Ăn thịt từ khoá lẫn nhau (cannibalization): lớn nhất.**
- **1.926 tên bài thuốc** bị dùng chung bởi **5.592 bài** (An Thần Hoàn I…XIV, Ban Hạ
  Tán I…). Với truy vấn "an thần hoàn", Google thấy 14 trang cùng tên nên không biết chọn
  trang nào, và thường không chọn trang nào.
- **755 nhóm / 1.733 bài** có **tập vị y hệt** nhau nhưng mang tên khác (cùng một phương
  được chép từ nhiều sách).
- **5 nhóm / 10 bài** trùng cả tên lẫn tập vị (`an-hoi-hoan` ↔ `an-hoi-hoan-2`, Jaccard
  1,00). Đây là bản ghi trùng thật.
- 17 nhóm H1 trùng giữa các trang được index. 3 mục `nguon` thực chất là tên bài thuốc
  (`/nguon/sinh-hoa-thang/`).

**B. Trang mỏng được mời index.**
- /nguon/: trung vị **47 từ**, 973 trang index mà gần như toàn khuôn. Phần lớn là "sách
  X — 1 bài thuốc trích dẫn".
- /bai-thuoc/: 2.116 trang index mà hơn 70% chữ là khuôn.

**C. Hai đường ráp `<head>` khác nhau → trang cùng loại mà tín hiệu lệch nhau.**
| | Trang độc lập (huyệt/kinh/bệnh/nguồn) | Vỏ SPA (bài thuốc/dược liệu) |
|---|---|---|
| Ráp `<head>` | `seo-html.mjs#head()` | tự `setMeta()` đè lên index.html |
| BreadcrumbList | có | **không** |
| publisher / Organization | có | **không** |
| og:image | ảnh riêng | **ảnh mặc định cho cả 15.056 trang** (dù 536 vị có ảnh CMS) |
| FAQPage | huyệt, bệnh | không |

**D. Tiêu đề bị cắt**: 18.400/18.500 tiêu đề dài hơn 60 ký tự. Bài thuốc còn nhét tên
sách vào (94–110 ký tự).

**E. Mô tả lỗi và mô tả mỏng**: `Trị thủy thũng.. Thành phần: .` (45 trang); 279 nguồn,
195 dược liệu và 5 kinh có mô tả dưới 70 ký tự.

**F. Liên kết nội bộ**: 49 trang dược liệu không có link nào trỏ vào (mồ côi).

**G. Rủi ro E-E-A-T (YMYL)**: mọi trang in "✔ Đã rà soát chuyên môn" kèm tên người duyệt,
kể cả 13.943 bài thuốc chưa ai đọc từng bài. Nếu một trang bị soi, tuyên bố này là điểm
yếu. Nên chỉ in nhãn này ở trang đã thực sự được duyệt (nối với bot thẩm định: hạng `tot`,
hoặc lời phê đã áp).

## 2. Nguyên tắc thống nhất

1. **Một thực thể = một URL được index.** Bản trùng trỏ `canonical` về bản chính. Biến
   thể thì hoặc gom về một trang, hoặc tự làm rõ mình khác ở đâu.
2. **Chỉ index trang có giá trị riêng.** Luật index viết thành MỘT hàm cho mỗi bộ và đo
   bằng số liệu, không đo bằng cảm giác.
3. **Một bộ ráp SEO duy nhất.** Tệp mới `frontend/scripts/seo-khung.mjs` khai cho từng bộ:
   mẫu tiêu đề, công thức mô tả, schema, ảnh OG, luật index, canonical. Mọi builder gọi
   tệp này; không builder nào tự ghép chuỗi SEO riêng.
4. **CMS = ngoại lệ**, đè lên từng ô và không bao giờ thay cả khuôn (`apGhiDe` giữ nguyên
   như hiện nay).
5. **Mọi luật đều có chốt trong `kiem-seo.mjs`** và gãy build khi lùi.

## 3. Các bước

Mỗi bước: build → `npm run blog:post` → chạy lại bộ rà soát
(`frontend/scripts/ra-soat-seo.mjs`, đưa từ scratchpad vào repo) → so số với bảng mục 1.

### Bước 1: Khung chung + tiêu đề/mô tả (vấn đề C, D, E)
- Tạo `seo-khung.mjs`. Chuyển `build-phuong` / `build-duoc-lieu` sang dùng chung schema
  (thêm BreadcrumbList, publisher) và `og:image` = ảnh CMS khi có.
- `tieuDeSeo()`: ưu tiên tên > đuôi mô tả > thương hiệu, tối đa 60 ký tự.
  *(Đã viết thử trong working tree, chưa build: `seo-html.mjs`, `build-dict`,
  `build-phuong`, `build-duoc-lieu`, `build-nguon`.)*
- Công thức mô tả theo bộ; sửa lỗi `..` và nhãn rỗng.
- Chốt mới trong `kiem-seo`: tiêu đề > 60 ký tự, og:image mặc định ở trang có ảnh, thiếu
  BreadcrumbList.

### Bước 2: Gom bài thuốc trùng (vấn đề A): **CẦN ANH/CHỊ QUYẾT**
- 10 bản trùng thật (cùng tên + cùng tập vị): canonical về bản đầu và bỏ khỏi sitemap.
- 755 nhóm cùng tập vị khác tên: canonical về bản có nguồn uy tín nhất hoặc nội dung dày
  nhất. Trang phụ vẫn sống cho người đọc, và nêu rõ "cùng thành phần với …".
- 1.926 nhóm cùng tên: xem câu hỏi Q1 ở mục 4.

### Bước 3: Siết luật index (vấn đề B)
- /nguon/: chỉ index khi có ≥3 trích dẫn hoặc có `mo_ta`. Ước tính bỏ index khoảng 900
  trang mỏng; con số thật sẽ đo lại khi làm.
- /bai-thuoc/: `duDay()` thêm điều kiện "có tác dụng + ≥3 vị + (cách dùng hoặc chủ trị)".
  Trang không đạt vẫn sống, không bị xoá.
- Mỗi lần đổi luật: ghi số index trước/sau vào tệp này.

### Bước 4: Làm dày trang bằng dữ liệu SẴN CÓ (không bịa, không viết văn máy)
- Bài thuốc: khối "Phân tích vị": quân/thần (đã có engine khớp thành phần), tính vị quy
  kinh tổng hợp từ các vị, link sang dược liệu. Đây là chữ độc nhất thật, vì mỗi phương
  có một tổ hợp riêng.
- Nguồn: niên đại, tác giả, danh sách bài theo công dụng.
- Dược liệu: link từ trang bài thuốc và nhóm dược lý về 49 trang mồ côi.

### Bước 5: Nhãn "Đã rà soát" chỉ ở trang đã duyệt thật (vấn đề G)

### Bước 6: Sau deploy
- Gửi lại sitemap (IndexNow + Search Console).
- Theo dõi số trang được index và số lần hiển thị theo nhóm trong 4–6 tuần. Google cần
  thời gian để tính lại canonical, nên không đánh giá sau vài ngày.

## 4. Quyết định cần người dùng chốt

**Q1. 1.926 tên bài thuốc dùng chung (5.592 bài):**
- (a) **Trang gộp theo tên** `/bai-thuoc/an-than-hoan/` liệt kê 14 phương, so sánh thành
  phần, là trang được index; 14 trang con vẫn index nhưng tiêu đề nêu rõ nguồn. *(Đề xuất.)*
- (b) Giữ 14 trang riêng, chỉ phân biệt bằng tên sách trong tiêu đề. Dễ làm nhưng vẫn ăn
  thịt từ khoá.

**Q2. Ô SEO trong CMS:** giữ vai trò ngoại lệ (đề xuất), hay vẫn muốn thấy chữ trong ô?
Nếu muốn thấy chữ, cách an toàn là HIỆN bản tự sinh làm gợi ý mờ trong ô (qua
`tro-giup-admin.ts`), không ghi vào CSDL.

**Q3. Ngưỡng index trang nguồn**: ≥3 trích dẫn là mức đề xuất.

## 5. Kết quả lượt 1 (29–30/09/2026, build ở máy dev, CHƯA deploy)

| Chỉ số | Trước | Sau |
|---|---|---|
| Tiêu đề > 60 ký tự | 99,5% | 0,57% |
| Mô tả < 70 ký tự | 2,83% | 0,60% |
| Tiêu đề trùng nhau | 0,12% | 0,03% |
| twitter:title là câu chào TRANG CHỦ | 14.987 trang | 0 |
| Bài thuốc trùng có canonical về bản chính | 0 | 772 → 602 bản chính |
| Vị thuốc có ảnh chia sẻ riêng | 0 | 536 |
| Bài thuốc/dược liệu có BreadcrumbList + publisher | 0 | 14.987 |
| URL /nguon/ trong sitemap | 2.045 | 769 (ước tính ban đầu ~900 là SAI — thật là 1.276 trang rời chỉ mục) |
| Tổng URL sitemap | 9.206 | 7.373 |

Phát hiện khi làm: 721/772 bài trùng mang TÊN KHÁC nhưng cùng vị và cùng tác dụng từng chữ
— đó là tên gọi khác của cùng một phương (Tả Phế Tán = Tả Bạch Tán). Bản chính vì vậy nêu
"còn gọi …" trong mô tả + `alternateName` trong schema, để canonical không làm mất từ khoá.

Ô CMS: chạy thử khớp 18.405/18.405 mục (0 không khớp slug). Ghi thật ở lượt build deploy
đầu tiên (`SEO_GHI_CMS=1`).

**Còn nợ**: bước 3 phần bài thuốc (2.107 trang index mà >70% chữ là khuôn), bước 4 (làm dày
bằng dữ liệu sẵn có, 49 dược liệu mồ côi), bước 5 (nhãn "Đã rà soát"), H1 trùng của 16 cặp
bài cùng tên khác vị, 3 huyệt trùng tên trong dữ liệu gốc (lac-cham ↔ lac-cham-2…).
