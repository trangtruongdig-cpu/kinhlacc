# SEO-PLAN.md — Chiến lược & quy trình SEO cho Kinhlac

> Tài liệu này là **bản tư vấn + kế hoạch** (chưa code). Đọc kỹ, sửa/duyệt thoải mái.
> Viết cho người mới: có giải thích "tại sao", không chỉ "làm gì".
> Domain mục tiêu: **kinhlac.online** · Deploy: VPS Ubuntu + Docker.

Mục lục:
1. [Hiện trạng SEO (audit)](#1-hiện-trạng-seo-audit)
2. [Bộ từ khoá + phân tích (3 cụm)](#2-bộ-từ-khoá--phân-tích)
3. [Bản đồ nội dung (Trụ–Nhánh)](#3-bản-đồ-nội-dung-trụnhánh)
4. [Quyết định kỹ thuật đã chốt](#4-quyết-định-kỹ-thuật-đã-chốt)
5. [Quy trình Viết → Đăng → Index](#5-quy-trình-viết--đăng--index)
6. [Tự động cập nhật theo xu hướng](#6-tự-động-cập-nhật-theo-xu-hướng)
7. [Lộ trình triển khai (phases)](#7-lộ-trình-triển-khai-phases)
8. [Checklist khởi động](#8-checklist-khởi-động)
9. [Nguồn tham khảo](#9-nguồn-tham-khảo)

---

## 1. Hiện trạng SEO (audit)

**Vấn đề gốc:** web là **SPA** (Vue render bằng JavaScript). Khi Google bot / Facebook / Zalo vào,
server trả về `frontend/index.html` gần như **trống** (`<div id="app">`), JS mới vẽ nội dung sau.

| Hiện trạng | Hậu quả SEO |
|---|---|
| Mọi trang dùng **chung 1 tiêu đề** "Phòng Khám Y Học Cổ Truyền" (`index.html`) | Google không phân biệt được trang nào về gì → không lên top |
| Không có per-page `title` / `description` / Open Graph | Share link Zalo/FB **không ra ảnh + mô tả** |
| **Không có** `robots.txt`, **không có** `sitemap.xml` (đã kiểm tra `frontend/public/`) | Google không biết có trang nào để vào |
| Nội dung chỉ hiện sau khi JS chạy | Bot đọc chậm/kém ổn định, site mới càng thiệt |

**Điểm tốt đã có:**
- Đã gắn `google-site-verification` trong `index.html` → **đã có Google Search Console (GSC)**. Ta sẽ dùng nhiều.
- Tài sản nội dung lớn: `/thu-vien` (1.058 huyệt), `/xem-3d`, demo kết quả đo, demo bài thuốc — đối thủ **không có**.

> ⚠️ **Ghi chú "không làm SSG" trước đây vẫn đúng** — nhưng nó dành cho **app nội bộ sau đăng nhập**.
> Trang **công khai + blog** là bài toán ngược: bắt buộc có HTML sẵn (prerender) thì SEO mới ăn.
> Hai chuyện khác nhau. Kế hoạch này **chỉ** prerender phần công khai; app `/app/*` giữ nguyên SPA.

---

## 2. Bộ từ khoá + phân tích

**Insight quan trọng:** sản phẩm chính là **bản web hoá của phương pháp "đo nhiệt độ kinh lạc" (24 tỉnh huyệt)**
của lương y **Lê Văn Sửu** — ngách đã được Báo Nhân Dân, VUSTA công nhận,
**có người tìm nhưng RẤT ÍT đối thủ làm phần mềm**. Đây là "mũi nhọn" để lên top nhanh.

### 🟢 Cụm A — NGÁCH MŨI NHỌN (dễ top nhất, đánh TRƯỚC)
*Ý định: vừa tìm hiểu vừa muốn dùng. Đối thủ yếu (chỉ vài trang tin & site cũ).*

| Từ khoá | Độ khó | Vì sao đánh |
|---|---|---|
| đo kinh lạc / đo nhiệt độ kinh lạc | Thấp–TB | Đúng lõi sản phẩm, demo `/xem-ket-qua-do` chứng minh |
| phần mềm đo kinh lạc / đo kinh lạc online | **Thấp** | Hầu như chưa ai làm web app → chiếm được |
| chẩn đoán kinh lạc / kinh lạc chẩn | Thấp | Nội dung lý thuyết + công cụ |
| 24 tỉnh huyệt / phương pháp đo nhiệt độ kinh lạc | Thấp | Long-tail chính xác |
| Lê Văn Sửu đo kinh lạc / biện chứng luận trị | **Rất thấp** | Từ khoá thương hiệu ngách, gắn uy tín nguồn gốc |

### 🟢 Cụm B — TRA CỨU / HỌC (cỗ máy traffic, tận dụng `/thu-vien` + `/xem-3d`)
*Ý định: học, tra cứu. Long-tail KHỔNG LỒ. Đối thủ chỉ là PDF/sách & blog trường nghề → ta có 3D + tra cứu tương tác, hơn hẳn.*

| Nhóm | Ví dụ (mỗi cái = 1 bài / 1 trang) |
|---|---|
| Huyệt vị (hàng trăm trang) | "vị trí huyệt hợp cốc", "tác dụng huyệt túc tam lý", "cách bấm huyệt …" |
| Đường kinh | "12 đường kinh là gì", "đồ hình kinh lạc", "kinh lạc 3D", "mô hình huyệt vị 3D" |
| Vị thuốc / bài thuốc | "vị thuốc … tính vị quy kinh", "bài thuốc … công dụng thành phần" |
| Biện chứng | "thể bệnh / chứng bệnh đông y", "biện chứng luận trị là gì" |

### 🟡 Cụm C — THƯƠNG MẠI (đích cuối, KHÓ, đánh SAU)
*Ý định: chủ phòng khám muốn mua. Đối thủ mạnh: YouMed, tClinic, MEDi, Salo, MobiFone… → cần authority trước.*

| Từ khoá | Độ khó |
|---|---|
| phần mềm quản lý phòng khám đông y | **Cao** |
| phần mềm y học cổ truyền / kê đơn đông y | Cao |
| số hoá phòng khám đông y | TB |

> **Chiến lược 1 câu:** Chiếm cụm A (mũi nhọn) để lên top nhanh → đẻ nội dung cụm B để gom traffic + xây uy tín
> → dùng uy tín đó đánh cụm C (nơi có khách trả tiền).

---

## 3. Bản đồ nội dung (Trụ–Nhánh)

Mô hình **Pillar–Cluster**: mỗi **trụ** = 1 trang lớn; các **bài nhánh** trỏ link về trụ → Google hiểu ta là chuyên gia chủ đề.

- **Trụ 1 — Đo kinh lạc & chẩn đoán bằng dữ liệu** → nhánh: phương pháp, cách đọc kết quả đo, 24 tỉnh huyệt, case thực tế. *(CTA: `/xem-ket-qua-do`)*
- **Trụ 2 — Cẩm nang Huyệt Vị & Kinh Lạc** → nhánh: từng huyệt, từng đường kinh, đồ hình 3D. *(CTA: `/thu-vien`, `/xem-3d`)*
- **Trụ 3 — Bài thuốc & Biện chứng** → nhánh: bài thuốc, thể bệnh, chứng bệnh. *(CTA: `/xem-bai-thuoc`)*
- **Trụ 4 — Số hoá phòng khám Đông Y** (cụm C) → nhánh: so sánh phần mềm, tính năng, chi phí. *(CTA: `/app`, đăng ký)*

**10 bài khởi động (3 tháng đầu, ưu tiên cụm A + B):**
1. Đo nhiệt độ kinh lạc là gì? Nguyên lý 24 tỉnh huyệt
2. Cách đọc kết quả đo kinh lạc (kèm demo biểu đồ thật)
3. Phần mềm đo kinh lạc online miễn phí — hướng dẫn dùng
4. 12 đường kinh chính: đồ hình & chức năng (nhúng 3D)
5–7. 3 bài huyệt "hot": Hợp Cốc, Túc Tam Lý, Tam Âm Giao
8. Phương pháp Lê Văn Sửu: lịch sử & ứng dụng số hoá
9. Tính vị quy kinh là gì — đọc 1 bài thuốc theo dữ liệu
10. (Cụm C) So sánh cách số hoá phòng khám Đông Y

---

## 4. Quyết định kỹ thuật đã chốt

> Người dùng giao cho Claude tự quyết. **Chọn phương án LAI an toàn** (ưu tiên người mới + tránh lỗi với component 3D).

### 4.1. Blog = Markdown → HTML tĩnh ✅ (cỗ máy nội dung chính)
- Bài viết soạn bằng **Markdown** (chỉ gõ chữ, không đụng code).
- Khi build, một script sinh ra **trang HTML tĩnh hoàn chỉnh** cho mỗi bài (kèm meta/OG/JSON-LD).
- nginx phục vụ trực tiếp → **bot đọc 100%**, tải nhanh, **KHÔNG rủi ro lỗi hydration**.
- URL chuẩn SEO: `/blog/<slug>/` (ví dụ `/blog/do-nhiet-do-kinh-lac-la-gi/`).

### 4.2. Trang công khai (landing, /thu-vien, /xem-3d…) = meta + prerender nhẹ
- **Đã làm (Phase 1):** bộ quản lý `<head>` **tự viết, KHÔNG cần thư viện** (`src/composables/useSeo.ts` +
  dữ liệu per-page ở `src/seo/routeSeo.ts`, áp trong `App.vue`). Lý do không dùng `@unhead/vue`: tránh rủi ro
  version cho người mới; cách set thẳng DOM vẫn được trình prerender (Phase 2) chụp lại đầy đủ.
- Mỗi route tự đặt `title`, `description`, canonical, Open Graph, Twitter, **JSON-LD**.
- **Prerender** riêng các route công khai thành HTML tĩnh khi build (để bot đọc được nội dung landing).
  - Component 3D (CosmicWheel, đồ hình kinh lạc) phải **chỉ chạy ở client** (`onMounted` / guard) để không lỗi lúc prerender.
- App `/app/*` (sau đăng nhập): **giữ nguyên SPA**, thêm `<meta name="robots" content="noindex">`.

### 4.3. Vì sao KHÔNG dùng vite-ssg toàn bộ ngay
- vite-ssg "chuẩn" hơn nhưng dễ vỡ vì các component **Three.js/3D** chạy lúc build → lỗi khó debug cho người mới.
- Phương án lai đạt **95% lợi ích SEO** với **rủi ro thấp hơn nhiều**. Khi quen, có thể nâng cấp lên vite-ssg sau.

---

## 5. Quy trình Viết → Đăng → Index

```
[Ý tưởng/từ khoá] → [Viết Markdown] → [Build: sinh HTML tĩnh + meta/OG/JSON-LD]
   → [Cập nhật sitemap.xml] → [git pull + docker compose up trên VPS]
   → [Ping Google/Bing để index ngay] → [Theo dõi thứ hạng trong GSC]
```

**Nền kỹ thuật cần dựng (làm 1 lần, dùng mãi):**
1. `robots.txt` (cho phép công khai; chặn `/app`, `/login`, `/api`; trỏ tới sitemap).
2. `sitemap.xml` **tự sinh khi build** (gồm trang công khai + mọi bài blog).
3. `@unhead/vue` cho meta per-page + JSON-LD (Article schema cho blog, Organization cho landing).
4. Prerender trang công khai (mục 4.2).

**Gọi bot index (chạy khi đăng bài):**
- **Google Search Console** (đã có): nộp sitemap + "Yêu cầu lập chỉ mục" cho URL mới.
- **IndexNow** (Bing / Cốc Cốc / Yandex): miễn phí, ping 1 phát index gần như tức thì.
- ⚠️ **Sự thật về Google Indexing API:** chính thức **chỉ** cho tin tuyển dụng/livestream. Với bài thường,
  cách đúng & bền là **sitemap + GSC**. Đừng dùng mẹo lách kẻo bị phạt.

---

## 6. Tự động cập nhật theo xu hướng

> Người dùng chọn **mức tự động CAO (tự đăng, duyệt định kỳ sau)**. Tôn trọng lựa chọn này,
> **nhưng gài "van an toàn"** vì nội dung Y tế bị Google xếp loại **YMYL** (xét rất gắt về độ chính xác/uy tín).

### Vòng lặp hằng tuần (cron trên VPS hoặc /schedule)
```
1. Hút tín hiệu xu hướng:
   - Google Suggest (gợi ý gõ) + Google Trends
   - Truy vấn THẬT từ Search Console API (từ đang hạng 5–20 = "sắp lên top" → ưu tiên)
2. Máy chọn 1–3 chủ đề → tạo đề cương bài
3. Claude soạn bản nháp theo đề cương
4. ĐĂNG TỰ ĐỘNG (theo lựa chọn) — nhưng qua "van an toàn" bên dưới
5. Cập nhật sitemap → ping IndexNow + GSC
6. Tuần sau quay lại bước 1, ưu tiên cải thiện bài "sắp lên top"
```

### 🛡️ Van an toàn cho tự-đăng (BẮT BUỘC để không bị phạt YMYL)
1. **Phân loại rủi ro nội dung trước khi đăng:**
   - 🟢 *An toàn — tự đăng thẳng:* nội dung **tra cứu/dữ liệu từ chính DB của bạn**
     (mô tả huyệt, vị trí, đường kinh, tính vị quy kinh của vị thuốc). Đây là **dữ kiện**, không phải lời khuyên chữa bệnh.
   - 🔴 *Rủi ro — KHÔNG tự đăng, vào hàng chờ duyệt:* bài có **lời khuyên chẩn đoán/điều trị**
     ("chữa bệnh X bằng…", liều lượng, phác đồ). Loại này **chờ bạn duyệt** rồi mới publish.
2. **Mọi bài auto đều có:** tên tác giả/biên tập, ngày cập nhật, đoạn "tham khảo nguồn", và **disclosure** "có hỗ trợ bởi AI" → tốt cho E-E-A-T.
3. **Hàng chờ duyệt (review queue):** log mọi bài auto đã đăng + cờ `needs-review`, để bạn rà định kỳ nhanh.
4. **Bài rủi ro tạm gắn `noindex`** cho tới khi bạn duyệt → có trên web nhưng chưa đẩy cho Google → an toàn tuyệt đối.

> Nhờ van này, bạn vẫn được "tự đăng" như mong muốn, mà phần dữ liệu (đa số nội dung cụm B) chạy full tự động,
> chỉ phần "lời khuyên y khoa" mới cần mắt người — đúng chuẩn an toàn của Google.

---

## 7. Lộ trình triển khai (phases)

| Phase | Nội dung | Lợi ích | Rủi ro |
|---|---|---|---|
| **1. Nền tảng** | robots.txt, sitemap tự sinh, meta/OG/JSON-LD per-page | Fix lỗi gốc, share link đẹp, GSC nhận trang | Thấp |
| **2. Prerender** ✅ | Mini-prerender chèn meta tĩnh (Node thuần, KHÔNG Chrome/vite-ssg) | Bot + Facebook/Zalo đọc đúng meta từng trang | Thấp (không đụng app) |
| **3. Blog** ✅ | Hệ blog Markdown→HTML tĩnh + 10 bài đầu (nối module SEO Radar) | Bắt đầu hút traffic | Thấp |
| **4. Index tự động** ✅ | IndexNow (`npm run indexnow`) chạy sau deploy | Index nhanh (Bing/Cốc Cốc…) | Thấp |
| **5. Xu hướng** | Vòng lặp hằng tuần + van an toàn YMYL | Nội dung tự cập nhật | Thấp (có van) |

**Đề xuất: bắt đầu Phase 1** — rủi ro thấp nhất, lợi ích lớn nhất, là nền cho mọi phase sau.

---

## 8. Checklist khởi động

**Việc của bạn (không cần code):**
- [ ] Xác nhận domain chính thức: `kinhlac.online` (hay khác?).
- [ ] Đăng nhập **Google Search Console**, kiểm tra property đã verify.
- [ ] Tạo **Bing Webmaster Tools** (để dùng IndexNow) — miễn phí.
- [ ] Chuẩn bị **1 ảnh OG mặc định** (1200×630px, logo + tên sản phẩm) để share link ra ảnh đẹp.
- [ ] Quyết tên tác giả/biên tập hiển thị trên bài (cho E-E-A-T).

**Việc của Claude (khi bạn duyệt kế hoạch):**
- [ ] Phase 1: tạo `robots.txt`, script sinh `sitemap.xml`, cài `@unhead/vue`, gắn meta cho từng route.
- [ ] Phase 2: prerender trang công khai + guard component 3D.
- [ ] Phase 3: dựng pipeline blog Markdown→HTML + viết 10 bài đầu.
- [ ] Phase 4–5: IndexNow + vòng lặp xu hướng + van an toàn.

---

## 9. Nguồn tham khảo

Khảo sát thị trường tìm kiếm (06/2026):
- [Top phần mềm quản lý phòng khám Đông Y — YouMed](https://youmed.vn/tin-tuc/phan-mem-quan-ly-phong-kham-dong-y/)
- [Phần mềm quản lý phòng khám Đông Y — tClinic](https://tclinic.io/phan-mem-quan-ly-phong-kham-dong-y-tclinic-hien-dai/)
- [Chẩn bệnh bằng đo nhiệt độ kinh lạc — Báo Nhân Dân](https://nhandan.vn/chan-benh-bang-do-nhiet-do-kinh-lac-post411042.html)
- [Thầy thuốc Đông y xem mạch bằng phần mềm và máy đo — VUSTA](https://vusta.vn/thay-thuoc-dong-y-xem-mach-bang-phan-mem-va-may-do-p86229.html)
- [Phép chẩn bệnh bằng nhiệt độ kinh lạc — Tuệ Tĩnh Liên Hoa](https://www.tuetinhlienhoa.com.vn/web/news/Cham-cuu-hoc/Phep-chan-benh-bang-nhiet-do-kinh-lac-3842.html)
- [dokinhlac.com.vn](http://dokinhlac.com.vn/) (site cũ cùng phương pháp — đối chiếu ngách)
- [Đồ Giải Kinh Lạc Huyệt Vị — Sách Y Phú](https://sachyphu.com/san-pham/do-giai-kinh-lac-huyet-vi-co-the/) (đối thủ mảng tra cứu = sách/PDF)
