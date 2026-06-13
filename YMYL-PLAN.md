# YMYL-PLAN.md — Chuẩn nội dung Y tế (YMYL) & E-E-A-T cho Kinhlac

> Tài liệu này là **bản tư vấn + kế hoạch + nhật ký thi công** cho phần YMYL.
> Viết cho người mới: có giải thích "tại sao", không chỉ "làm gì".
> Đi kèm [SEO-PLAN.md](./SEO-PLAN.md) — YMYL là **lớp tin cậy** đặt lên trên nền SEO kỹ thuật.
> Domain: **kinhlac.online** · Đối tượng: **cả người học/chuyên môn lẫn người bệnh** → giọng văn miễn trừ y tế ở **mức thận trọng (mạnh)**.

Mục lục:
1. [YMYL là gì & vì sao web này dính 100%](#1-ymyl-là-gì--vì-sao-web-này-dính-100)
2. [E-E-A-T — 4 trụ Google soi](#2-e-e-a-t--4-trụ-google-soi)
3. [Hiện trạng: đã có gì / thiếu gì](#3-hiện-trạng-đã-có-gì--thiếu-gì)
4. [Bộ chuẩn YMYL — 3 tầng ưu tiên](#4-bộ-chuẩn-ymyl--3-tầng-ưu-tiên)
5. [Lằn ranh an toàn nội dung (rất quan trọng)](#5-lằn-ranh-an-toàn-nội-dung-rất-quan-trọng)
6. [Van an toàn cho tự-đăng (governance)](#6-van-an-toàn-cho-tự-đăng-governance)
7. [Việc của bạn (cần điền thật)](#7-việc-của-bạn-cần-điền-thật)
8. [Nhật ký thi công](#8-nhật-ký-thi-công)

---

## 1. YMYL là gì & vì sao web này dính 100%

**YMYL = "Your Money or Your Life"** — nhóm trang mà Google cho rằng có thể **ảnh hưởng tới sức khoẻ,
tiền bạc, an toàn, hạnh phúc** của người đọc. Web của bạn nói về **chẩn đoán & chữa bệnh** → rơi vào
nhánh **bị soi gắt nhất** (Y tế).

**Hệ quả thực tế:**
- Nội dung Y tế **sai hoặc thiếu uy tín** bị Google đánh giá "Thấp/Thấp nhất" → **tụt hạng**, dù SEO kỹ thuật tốt.
- Bù lại, nếu làm đúng chuẩn tin cậy, ngách của bạn (đo kinh lạc — ít đối thủ) **lên top bền** vì đối thủ
  blog/PDF không có dữ liệu thật + không thể hiện được uy tín nguồn gốc như bạn.

> Một câu cốt lõi: **"Chuẩn YMYL" thực chất = xây các TÍN HIỆU TIN CẬY lên website.**
> Không phải 1 nút bấm, mà là một bộ trang + quy ước nội dung làm cho Google (và người đọc) **tin** bạn.

---

## 2. E-E-A-T — 4 trụ Google soi

Google đánh giá trang YMYL qua khung **E-E-A-T**. Đây là cách "đo" độ tin cậy:

| Trụ | Nghĩa | Web bạn thể hiện bằng gì (cụ thể) |
|---|---|---|
| **E**xperience — Trải nghiệm | Người làm nội dung có thực sự "làm" không | **Ca đo thật**, dữ liệu thật từ DB (1.000+ huyệt, ca đo mẫu) |
| **E**xpertise — Chuyên môn | Người viết có chuyên môn không | Tác giả/người duyệt là **lương y / bác sỹ YHCT** (ghi rõ chức danh) |
| **A**uthoritativeness — Uy tín | Cả ngành có công nhận không | Gắn **nguồn gốc** Lê Văn Sửu (sách Biện Chứng Luận Trị); trích VUSTA, Báo Nhân Dân |
| **T**rust — Tin cậy ⭐ | **TRỤ QUAN TRỌNG NHẤT** | Trang Về/Liên Hệ thật, **miễn trừ y tế**, **chính sách bảo mật**, HTTPS, có nguồn tham khảo |

> ⭐ **Trust là tâm.** Bài viết hay tới đâu mà không rõ *ai viết*, không có *miễn trừ*, không có *trang liên hệ thật*
> → Google vẫn coi là rủi ro. Vì vậy việc đầu tiên ta làm là **dựng nền Tin Cậy** (Tầng 1 bên dưới).

---

## 3. Hiện trạng: đã có gì / thiếu gì

**✅ Đã có (lợi thế sẵn):**
- Dữ liệu thật, độc quyền → **Experience** mà blog đối thủ không có.
- Nguồn gốc phương pháp chính danh (Lê Văn Sửu; Nhân Dân, VUSTA nhắc tới) → **Authoritativeness** sẵn, chỉ cần "khoe" đúng chỗ.
- Nền SEO kỹ thuật đã làm (meta per-page, JSON-LD, prerender, sitemap — xem SEO-PLAN.md).

**⚠️ Đang thiếu (phần YMYL cần xây):**
1. **Tuyên bố miễn trừ y tế** — chưa có ở đâu, kể cả trang demo `/xem-ket-qua-do` (rủi ro nhất vì hiện "kết quả → thể bệnh" như chẩn đoán thật).
2. **Cụm trang Tin Cậy**: Về Chúng Tôi, Liên Hệ, Chính Sách Bảo Mật, Điều Khoản, Quy Trình Biên Tập. Google YMYL **soi rất kỹ** mấy trang này.
3. **Danh tính tác giả/người duyệt** + schema `author`/`reviewedBy` cho bài blog.
4. **Cơ chế kiểm duyệt nội dung tự-đăng** (van an toàn) — mới nằm trong kế hoạch SEO, chưa thành quy trình thật.
5. **Bảo mật dữ liệu bệnh nhân** — bạn giữ ~5.634 hồ sơ bệnh nhân thật → vừa là YMYL vừa là **nghĩa vụ pháp lý** (Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân; dữ liệu sức khoẻ là loại **nhạy cảm**). **Bắt buộc** có Chính Sách Bảo Mật.

---

## 4. Bộ chuẩn YMYL — 3 tầng ưu tiên

### 🥇 Tầng 1 — Nền Tin Cậy (ăn điểm YMYL nhiều nhất, làm trước)
- **`MedicalDisclaimer.vue`** — 1 hộp miễn trừ y tế dùng lại được; gắn ở cuối blog + trang demo `/xem-ket-qua-do`, `/xem-bai-thuoc`.
  Giọng văn (mức mạnh): *"Thông tin chỉ mang tính tham khảo & học tập, KHÔNG thay thế việc thăm khám, chẩn đoán hay điều trị của thầy thuốc/bác sỹ có chuyên môn. Không tự ý dùng để chẩn đoán hoặc điều trị."*
- **5 trang Tin Cậy** (route công khai → vào sitemap + prerender + có meta riêng):
  | Trang | Đường dẫn | Vai trò YMYL |
  |---|---|---|
  | Về Chúng Tôi | `/ve-chung-toi` | Khoe nguồn gốc phương pháp, đội ngũ, sứ mệnh (Authoritativeness) |
  | Liên Hệ | `/lien-he` | Tên, địa chỉ, email, điện thoại thật (NAP — Trust) |
  | Chính Sách Bảo Mật | `/chinh-sach-bao-mat` | **Bắt buộc** vì giữ dữ liệu bệnh nhân |
  | Điều Khoản Sử Dụng | `/dieu-khoan` | Giới hạn trách nhiệm, miễn trừ y tế cấp site |
  | Quy Trình Biên Tập | `/quy-trinh-bien-tap` | Ai viết / ai duyệt / nguồn ở đâu + **tuyên bố dùng AI** |
- **Footer toàn site công khai** link tới 5 trang trên (tín hiệu tin cậy chạy khắp web).

### 🥈 Tầng 2 — E-E-A-T cho bài viết (làm cùng lúc dựng blog — Phase 3 của SEO-PLAN)
- Khối **"Tác giả / Người duyệt"** dưới mỗi bài: ảnh, tên, chức danh (vd *Lương Y …*), ngày cập nhật.
- **JSON-LD `Article`** có `author`, `reviewedBy`, `dateModified`, `citation` (nguồn tham khảo).
- Mỗi bài Y tế có mục **"Nguồn tham khảo"** ở cuối (sách, y văn, bài báo chính thống).

### 🥉 Tầng 3 — Van an toàn tự-đăng (Phase 5 của SEO-PLAN; xem mục 6)
- Field **phân loại rủi ro** mỗi bài: 🟢 dữ kiện (tự đăng) / 🔴 lời khuyên điều trị (chờ duyệt).
- Bài 🔴 tự gắn **`noindex`** đến khi duyệt → có trên web nhưng chưa đẩy cho Google.
- Tự chèn **disclosure "có hỗ trợ bởi AI"** + tên người duyệt.

---

## 5. Lằn ranh an toàn nội dung (rất quan trọng)

> Vì web phục vụ **cả người bệnh phổ thông**, ta theo **mức thận trọng cao nhất**.

- ❌ **TRÁNH:** "chữa khỏi bệnh X", "uống bài này hết bệnh", cho **liều lượng cụ thể** để người đọc tự dùng,
  hứa hẹn kết quả. Đây là lời khuyên điều trị → rủi ro YMYL + pháp lý cao nhất.
- ✅ **NÊN:** giọng tra cứu/giáo dục — "theo y văn, huyệt này chủ trị…", "bài thuốc này tính vị quy kinh…",
  **luôn kèm** câu nhắc "tham khảo ý kiến thầy thuốc/bác sỹ trước khi áp dụng".
- ⚠️ Trang `/xem-ket-qua-do`: nói rõ đây là **ca mẫu để minh hoạ**, kết quả **không phải chẩn đoán** cho người đọc.
- 🔁 Dùng **"Tây Y" / "Đông Y"** (cả hai chữ hoa) và **Title Case** cho nhãn/tiêu đề, đồng bộ toàn UI.

---

## 6. Van an toàn cho tự-đăng (governance)

Khi bật vòng lặp tự đăng theo xu hướng (SEO-PLAN Phase 5), **bắt buộc** đi qua van này:

```
1. Phân loại rủi ro bài viết:
   🟢 An toàn — TỰ ĐĂNG: nội dung TRA CỨU/DỮ KIỆN từ DB (mô tả huyệt, vị trí, đường kinh,
      tính vị quy kinh của vị thuốc). Đây là DỮ KIỆN, không phải lời khuyên chữa bệnh.
   🔴 Rủi ro — CHỜ DUYỆT: bài có LỜI KHUYÊN chẩn đoán/điều trị (chữa bệnh X bằng…, liều lượng,
      phác đồ). Loại này vào hàng chờ, KHÔNG tự publish ra Google.
2. Mọi bài auto đều có: tên tác giả/người duyệt, ngày cập nhật, "nguồn tham khảo",
   disclosure "có hỗ trợ bởi AI", và hộp MedicalDisclaimer.
3. Bài 🔴 gắn noindex tới khi người duyệt OK → an toàn tuyệt đối với Google.
4. Hàng chờ duyệt (review queue): log mọi bài auto + cờ needs-review để rà nhanh định kỳ.
```

---

## 7. Thông tin thật đã điền (và vài việc còn lại của bạn)

Các trang Tin Cậy **đã điền thông tin thật của bạn** (không còn ô trống). Bảng dưới ghi rõ giá trị đang dùng:

| Mục | Giá trị đang dùng | Còn lại cần làm |
|---|---|---|
| Pháp nhân / đơn vị | **Kinh Lạc Trương Gia** | — (đã dùng ở Liên Hệ, Bảo Mật, Điều Khoản) |
| Người sáng lập & phụ trách nội dung | **Trương Đình Trang** — Y Sỹ Y Học Cổ Truyền (đang theo học) | — |
| Địa chỉ | Số 16, đường Ao Sen, An Khánh, Hoài Đức, Hà Nội | — |
| Điện thoại / Zalo | **0353.247.247** | ⚠️ **Xác nhận 3 số cuối**: 247 hay 237? (bạn gõ 247, hệ thống báo 237) |
| Email liên hệ | `lienhe@kinhlac.online` | Tạo hộp thư này (hoặc đổi sang email thật) |
| Email dữ liệu cá nhân | `baomat@kinhlac.online` | Tạo hộp thư này |
| Ảnh OG 1200×630 | (theo SEO-PLAN) | Chuẩn bị để share link ra ảnh đẹp |

**Định vị đã chốt:** đo kinh lạc (cảm hứng từ sách *Biện Chứng Luận Trị* của Lê Văn Sửu) chỉ là **một tính
năng nhỏ**; phần mềm là **công trình sáng tạo riêng** lớn hơn nhiều. Đã **gỡ tên đồng tác giả cũ** khỏi toàn site (theo yêu cầu).

> ⚠️ Riêng **Chính Sách Bảo Mật** là bản nháp thiện chí — nên nhờ **luật sư** rà trước khi công bố chính thức.

---

## 8. Nhật ký thi công

| Ngày | Việc | Trạng thái |
|---|---|---|
| 2026-06-05 | Viết YMYL-PLAN.md | ✅ |
| 2026-06-05 | Tầng 1: MedicalDisclaimer + 5 trang Tin Cậy + footer + gắn disclaimer demo | ✅ |
| 2026-06-05 | Tự điền mặc định mọi ô trống (email theo domain, thương hiệu Kinh Lạc, giọng trung thực — không bịa danh tính) | ✅ (xem mục 7 để đổi sang thật) |
| — | Tầng 2: schema tác giả/người duyệt cho blog | ⏳ (làm khi dựng blog — Phase 3) |
| — | Tầng 3: van an toàn tự-đăng | ⏳ (Phase 5) |
