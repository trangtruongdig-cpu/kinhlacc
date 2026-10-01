# Rà soát SEO kinhlac.online — 30/09/2026

> ## ⚠️ ĐO LẠI SITE THẬT 01/10/2026 — PHẦN LỚN PHÁT HIỆN DƯỚI ĐÂY ĐÃ SỬA XONG
>
> Bản rà soát này viết khi `328a0a4` **chưa deploy**. Nay đã deploy. Đọc nguyên văn phần
> "Phát hiện" bên dưới mà không đọc bảng này sẽ dẫn tới **làm lại việc đã xong** — đã suýt
> xảy ra một lần.
>
> | Phát hiện | Trạng thái 01/10/2026 | Phép đo |
> |---|---|---|
> | #1 Chuyển hướng thêm "/" hạ xuống http | **XONG** | `curl -sI /huyet` → `301 location: /huyet/` (tương đối) |
> | #2 Trang chủ không tới được trang từ điển | **XONG** | Trang chủ có 20 link tĩnh: `/huyet/` `/bai-thuoc/` `/duoc-lieu/` `/nguon/` `/kinh/` `/benh-hoc/`… |
> | #2 Bài thuốc ở độ sâu 6 | **XONG** | `/bai-thuoc/muc-luc/` + `/duoc-lieu/muc-luc/` trả 200 → độ sâu 2–3 |
> | #2 Trang mồ côi | **XONG** | Đo đồ thị `dist/`: 1.310/1.316 trang ở độ sâu 1–2; 6 trang không có link vào đều là `kinhmach3d`/`404.html` |
> | #3 Nhãn "Đã rà soát chuyên môn" hàng loạt | **XONG (đã gỡ)** | `grep` trên trang huyệt + bài thuốc: 0 lần. Còn thiếu `reviewedBy`/`lastReviewed` |
> | #4 Tiêu đề bị cắt / trùng | **XONG** | `/huyet/tam-am-giao/` → tiêu đề 57 ký tự |
> | #5 Soft 404 | **XONG phần chịu lực** | Nhóm độc lập (`/huyet/` `/nguon/` `/benh-hoc/`) → **404 thật**; vỏ SPA → 200 + `X-Robots-Tag: noindex`. Trang thật KHÔNG bị noindex (đã kiểm 10 URL). Còn sót: HTML vỏ SPA vẫn in `<meta robots="index, follow">` + canonical về `/` — header nghiêm hơn nên thắng, nhưng là tín hiệu tự mâu thuẫn |
> | #6 Trang mỏng (2.107 bài thuốc) | **MỘT PHẦN** | Khối "Tính vị, quy kinh các vị" đã có trong HTML tĩnh (341 từ/bài, bảng từng vị) — bước 4 đã làm. Luật siết index bài thuốc còn nợ |
> | #7 `lastmod` không mang tin | **ĐÃ SỬA TRONG MÃ, CHỜ DEPLOY** | Đo trước: 6.634/7.400 URL cùng ngày build. Nay lấy `updated_at` của CMS qua `frontend/scripts/ngay-cms.mjs`; chốt mới trong `kiem-sitemap` gãy khi ≥50% URL mang ngày build |
> | #9 Không có HSTS | **ĐÃ SỬA TRONG MÃ, CHỜ DEPLOY** | `Strict-Transport-Security: max-age=31536000` ở `frontend/nginx.conf` (server + 4 khối phục vụ HTML). Cố ý KHÔNG `includeSubDomains`/`preload` |
> | #3 Siết index trang nguồn | **XONG** | Sitemap còn 769 URL `/nguon/` (từ 2.045) |
>
> **Còn lại, chưa làm:** CTR từ GSC vẫn bị bỏ (`leo-top/gsc.mjs:174` lấy `clicks` rồi không
> dùng; `coHoi = hienThi × (51 − viTri)`); không có cờ quảng cáo/khung chen khi đo trang đối
> thủ; `reviewedBy`/`lastReviewed`; `citation`/`sameAs` trong JSON-LD; `/duoc-lieu/<id>/` chưa
> tra được ngày sửa vì URL theo id của app còn CMS khoá theo slug.
>
> Căn cứ và cơ chế: artifact **Bản Đồ Tín Hiệu Xếp Hạng** (đối chiếu leak Google + Yandex,
> 164 bằng sáng chế) — xem memory `ban-do-tin-hieu-xep-hang`.

Phạm vi: site thật (https://kinhlac.online, bản đang chạy) + bản build mới ở máy dev (commit
`328a0a4`, CHƯA deploy). Không có dữ liệu Search Console, CrUX, backlink (chưa cấu hình API);
PageSpeed API hết hạn mức ngày → phần hiệu năng đo tay (TTFB, dung lượng), không có điểm Lighthouse.

## Điểm tổng (ước lượng, có trọng số)

| Hạng mục | Trọng số | Site thật | Sau deploy 328a0a4 |
|---|---|---|---|
| Kỹ thuật | 22% | 68 | 70 |
| Chất lượng nội dung / E-E-A-T | 23% | 50 | 62 |
| On-page (title, meta, heading, liên kết nội bộ) | 20% | 55 | 75 |
| Schema | 10% | 65 | 75 |
| Hiệu năng | 10% | ~80 (chưa có Lighthouse) | ~80 |
| Sẵn sàng cho tìm kiếm AI | 10% | 80 | 80 |
| Hình ảnh | 5% | 75 | 80 |
| **Tổng** | | **≈ 64/100** | **≈ 72/100** |

Loại site: nhà xuất bản tri thức Y học cổ truyền (YMYL) + SaaS phần mềm phòng chẩn trị.

## Phát hiện (kèm bằng chứng)

### CAO
1. **Chuyển hướng thêm "/" hạ xuống http.** `https://kinhlac.online/huyet` → `301 http://kinhlac.online/huyet/`
   → `308 https://…`. Hai bước nhảy, một bước qua http. Nguyên nhân: nginx sau Caddy thấy mình
   là http và ghi Location tuyệt đối. Sửa: `absolute_redirect off;` trong khối `server` của
   `frontend/nginx.conf`.
2. **Liên kết nội bộ: kho từ điển nằm quá sâu.** Theo HTML tĩnh, từ trang chủ KHÔNG tới được
   trang từ điển nào (trang chủ và /thu-vien/ chỉ link sang trang app). Khi Google đã chạy JS
   (trang chủ có link /huyet/ /kinh/ /blog/): huyệt, kinh ở độ sâu 2; châm cứu trị bệnh 3–4;
   bệnh học 4–6; nguồn 5; **3.853 bài thuốc ở độ sâu 6**. Danh sách trong TuDienView dùng
   `@click`, không phải `<a href>` → bot không đi theo được. /bai-thuoc/ và /duoc-lieu/ không có
   trang mục lục tĩnh liệt kê mục con.
3. **E-E-A-T trên nội dung y tế (YMYL).** Nhãn "✔ Đã rà soát chuyên môn" in trên ~1.300 trang
   (huyệt, bệnh học, châm cứu, blog) kèm "Y Sỹ Y Học Cổ Truyền (đang theo học)" — tuyên bố rà
   soát hàng loạt không có dấu vết từng trang, và chức danh "đang theo học" làm yếu chính tuyên
   bố đó. Schema các trang này không có `reviewedBy` / `lastReviewed` (chỉ blog có).
4. **(Site thật) Tiêu đề bị cắt, trùng lặp, twitter:* của trang chủ** — đã sửa trong 328a0a4,
   chờ deploy (tiêu đề >60 ký tự 99,5% → 0,57%; 772 bài trùng có canonical; 14.987 trang hết
   mang câu chào trang chủ).

### TRUNG BÌNH
5. **Soft 404.** `/khong-ton-tai-xyz/` trả 200 + nội dung trang chủ + `robots: index` +
   canonical về `/`. Mọi URL sai (kể cả bài thuốc đã xoá) thành bản sao trang chủ.
6. **Trang mỏng còn lại:** 2.107 trang bài thuốc được index mà >70% chữ là khuôn (bước 3–4 của
   kế hoạch 2026-09-29-seo-thong-nhat).
7. **lastmod không mang tin:** 7.149/9.206 URL cùng lastmod = ngày build. Google bỏ qua lastmod
   khi nó luôn đổi; nên dùng ngày sửa nội dung thật (có `updated_at` trong CMS).
8. **Chưa đo được chỉ mục thật:** không có Search Console → không biết bao nhiêu trang đã được
   index, bao nhiêu "Đã phát hiện – chưa lập chỉ mục".

### THẤP
9. Không có HSTS; không có CSP cho trang công khai.
10. `www.kinhlac.online` không phân giải (không lỗi, chỉ mất một lối vào).
11. FAQPage trên huyệt/bệnh: Google chỉ hiện FAQ rich result cho site chính phủ/y tế uy tín từ
    2023 — giữ được nhưng đừng kỳ vọng hiển thị.
12. Blog mới 12 bài — nhóm nội dung "trụ cột" có thể dẫn link xuống kho còn mỏng.

## Điểm làm tốt
- robots.txt rõ ràng, chặn /app /login /api, khai bot AI; có llms.txt đầy đủ.
- Sitemap 9.206 URL (sau deploy 7.373), không lẫn trang noindex, có image sitemap 1.561 ảnh.
- Trang từ điển là HTML tĩnh — nội dung đọc được không cần JS; TTFB 50–90ms, HTML 3–15KB gzip,
  JS khởi động 37KB gzip.
- Canonical, H1 duy nhất, JSON-LD phủ 100% trang; ảnh huyệt/kinh đủ alt + kích thước.
- Chốt build `kiem-sitemap` + `kiem-seo` chặn thoái lui.

## Kế hoạch hành động

| Ưu tiên | Việc | Công |
|---|---|---|
| 1 | Deploy 328a0a4 (build `--no-cache`), kiểm ô CMS đã điền | nhỏ |
| 2 | `absolute_redirect off;` trong nginx | 1 dòng |
| 3 | Trang chủ + /thu-vien/ link tĩnh tới mọi trang mục lục; trang mục lục tĩnh A–Z cho /bai-thuoc/, /duoc-lieu/; đổi danh sách TuDienView sang `<a href>` | vừa |
| 4 | Nhãn rà soát chỉ trên trang đã duyệt thật + `reviewedBy`/`lastReviewed`; chốt lại cách ghi chức danh | vừa |
| 5 | 404 thật cho đường tĩnh không tồn tại (nginx `=404` trong các nhóm tĩnh) | nhỏ |
| 6 | Nối Search Console + khoá API PageSpeed để có số đo thật | nhỏ |
| 7 | Làm dày 2.107 bài thuốc mỏng bằng dữ liệu sẵn có | lớn |
| 8 | lastmod theo ngày sửa thật; HSTS | nhỏ |
