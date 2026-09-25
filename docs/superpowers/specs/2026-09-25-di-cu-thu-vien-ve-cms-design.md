# Đưa thư viện từ điển (kho CD) từ file tĩnh về CMS

Ngày: 25/09/2026. Trạng thái: **chờ người dùng duyệt**.

## Vì sao

Nội dung thư viện hiện nằm cứng trong hai file JavaScript, sửa lần cuối 07/07/2025:

| File | Dung lượng | Sinh ra |
|---|---|---|
| `frontend/public/kinhmach3d/data/acupoints.js` | 2,2 MB | trang `/huyet/<slug>/` |
| `frontend/public/kinhmach3d/data/benh.js` | 2,4 MB | `/benh-hoc/<slug>/` và `/cham-cuu-tri-benh/<slug>/` |
| `frontend/public/kinhmach3d/data/meridians.js` | 169 KB | `/kinh/<slug>/` |

Muốn sửa một chữ trong mô tả huyệt Hợp Cốc phải mở file 2,2 MB, sửa JSON bằng tay, commit,
deploy lại toàn site. Đây là kho tri thức số hoá từ đĩa CD từ điển — tài sản SEO của phòng
chẩn trị — mà hiện không ai sửa được ngoài lập trình viên.

## Quy mô (đo 25/09/2026)

| Nhóm | Số mục | Thân bài trung vị | Dưới ngưỡng 200 ký tự | Dung lượng chữ |
|---|---|---|---|---|
| Huyệt vị | 1.059 | 387 | **125** | 0,98 MB |
| Bệnh học | 100 | **11.666** | 0 | 1,36 MB |
| Châm cứu trị bệnh | 100 | **4.298** | 0 | 0,45 MB |
| Đường kinh | 20 | — | — | — |
| **Tổng** | **1.279** | | | **~2,8 MB** |

2,8 MB là chuyện nhỏ với PostgreSQL. Ràng buộc không nằm ở dung lượng.

## Điều kiện cứng: KHÔNG đổi URL

Các đường dẫn hiện có phải giữ nguyên từng ký tự:

```
/huyet/<slug>/              vd /huyet/a-thi-huyet/
/benh-hoc/<slug>/           vd /benh-hoc/ac-hach/
/cham-cuu-tri-benh/<slug>/  vd /cham-cuu-tri-benh/alzheimer/
/kinh/<slug>/
```

Thuận lợi: **slug đã có sẵn trong dữ liệu CD** (trường `_slug`), không phải sinh lại nên
không có nguy cơ lệch.

## Collection hiện tại KHÔNG khớp dữ liệu CD — phải sửa trước

Đây là việc đầu tiên, và là chỗ dễ làm hỏng nhất nếu bỏ qua.

| Nhóm | CD có | CMS đang có | Thiếu |
|---|---|---|---|
| Huyệt vị | `ten, noiDung, phoiHuyet, ghiChu, thamKhao, sections, image` | `title, ma_huyet, noi_dung, pho_huyet, ghi_chu, tham_khao` | `sections`, ảnh |
| Bệnh học | `ten, _meta, daiCuong, nguyenNhan, chanDoan, dieuTri, benhAn, thamKhao` | `title, doi_chieu_benh_danh, noi_dung` | **5 trường** |
| Châm cứu trị bệnh | `ten, daiCuong, nguyenNhan, trieuChung, dieuTri` | — | **cả collection** |
| Đường kinh | (từ `meridians.js`) | — | **cả collection** |

**Không được gộp sáu phần của bệnh học vào một ô `noi_dung`.** Lý do: mất khả năng sửa từng
phần, và mất cấu trúc mà bản tĩnh dùng để dựng tiêu đề mục — mỗi phần là một `<section>` có
nhan đề riêng, đó là thứ Google đọc để hiểu bố cục trang y khoa.

Mỗi phần phải là một trường `portableText` riêng.

## Thứ phải chép từ build-dict.mjs (657 dòng)

Script hiện tại không chỉ đổ dữ liệu ra HTML. Bỏ sót phần này là mất đúng thứ làm cho 1.279
trang có giá trị với Google:

- **FAQ theo mẫu truy vấn thật**, trích nguyên văn từ y văn. Chú thích trong code ghi rõ
  *"KHÔNG để AI viết lại"* — phải giữ nguyên tinh thần đó.
- **JSON-LD y khoa**: `MedicalWebPage`, `MedicalEntity`, `MedicalCode`, `FAQPage`,
  `BreadcrumbList`, `CollectionPage`.
- **Liên kết chéo** Châm Cứu Trị Bệnh ↔ Bệnh Học cho cùng một tên bệnh.
- **Cảnh báo an toàn** gắn riêng cho mục Điều trị (`cautionKey`).
- **Van noindex** `MIN_BODY_CHARS = 200` — đang chặn 125 huyệt mỏng.

## Đánh đổi phải nói rõ: tĩnh → động

Hiện các trang này là **file HTML tĩnh**: nginx trả thẳng, không chạm database, nhanh nhất có
thể. Chuyển sang CMS nghĩa là mỗi lượt xem phải hỏi database.

Ràng buộc thật: pool của CMS giới hạn **1 kết nối** (buộc phải vậy — Aiven chỉ có 20 slot, đã
gây sập một lần ngày 25/09), Aiven ở xa, và VPS 2GB.

→ **Bắt buộc dùng tầng đệm của Astro/EmDash** (`Astro.cache` + `cacheHint` mà các trang hiện
có đã dùng). Chưa đo được mức chịu tải; phải đo trước khi xoá bản tĩnh.

Và nói thẳng: "xoá bản tĩnh cho nhẹ máy" thực ra là **đổi nhẹ đĩa lấy nặng database**. Đĩa VPS
còn 4,7G, không gấp.

## Ba nhịp

Mỗi nhịp giữ nguyên URL, và **bản tĩnh vẫn nằm nguyên** cho tới nhịp 3 — nên lùi lại chỉ bằng
một dòng nginx.

**Nhịp 1 — Bệnh học + Châm cứu trị bệnh (200 mục).**
Ít mục, nội dung dày nhất, không mục nào dưới ngưỡng. Chạy thử toàn bộ đường ống trên quy mô
nhỏ. Gồm: sửa collection `benh_hoc` cho đủ 6 trường, tạo collection `cham_cuu_tri_benh`, viết
bộ di cư, dựng trang Astro tại đúng đường dẫn cũ, chép khung SEO y khoa.

**Nhịp 2 — Huyệt vị (1.059 mục).**
Sau khi nhịp 1 chạy êm. Thêm trường `sections`, gán van noindex cho 125 mục mỏng.

**Nhịp 3 — Đường kinh (20 mục) + chuyển nginx + xoá bản tĩnh.**
Chỉ xoá sau khi đo thấy CMS phục vụ đủ và tốc độ chấp nhận được.

## Phép nghiệm thu từng nhịp

1. **Đếm đủ**: số mục trong CMS bằng số mục trong file CD.
2. **URL nguyên vẹn**: lấy toàn bộ slug từ file CD, gọi thử từng đường dẫn, không được có 404.
3. **Nội dung không hụt**: so độ dài thân bài từng mục giữa CD và CMS, lệch quá 5% phải giải
   thích được.
4. **SEO còn nguyên**: trang mẫu phải có đủ `MedicalWebPage`, `BreadcrumbList`, `FAQPage`, và
   liên kết chéo ccdt ↔ benhhoc.
5. **Van noindex đúng**: đếm meta `robots` trong HTML sinh ra, khớp số mục dưới ngưỡng.
6. **Tốc độ**: đo thời gian trả trang so với bản tĩnh; chậm hơn 3 lần thì dừng, xem lại tầng đệm.

## Ngoài phạm vi

- **Dược liệu (1.045) và cổ phương (13.942) KHÔNG di cư.** Chúng nằm trong bảng `vi_thuoc` và
  `phuong_thang` với 13 khoá ngoại trỏ vào, và app dùng để đo kinh lạc, dò phương, soạn phương
  huyệt. Đã chốt trước đó: quản bằng plugin trong CMS, dữ liệu ở nguyên chỗ.
- Toạ độ 3D của huyệt (`acu-coords3d.js`, `acupoints-3d.js`) không đụng tới — đó là dữ liệu kỹ
  thuật do pipeline bake sinh ra, thuộc về máy chứ không thuộc về người biên tập.
