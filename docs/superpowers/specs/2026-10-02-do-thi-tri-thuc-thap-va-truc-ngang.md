# Đồ thị tri thức: tháp dọc + trục ngang

Ngày: 02/10/2026 · Trạng thái: **THIẾT KẾ — hai điều ở mục 7 ĐÃ CHỐT; GĐ 0 ĐÃ DỰNG; GĐ 1 đã đo lại (mục 6b)** ·
Thay cho mục 6 "mạng nhện hai chiều" của `2026-09-30-rada-seo-2c-cum-ke-hoach-lien-ket-design.md`
(phần đã dựng hôm 02/10 chỉ là **một ca riêng rất nhỏ** của thiết kế này — xem mục 6).

## 1. Yêu cầu của người dùng (nguyên văn, 02/10/2026)

> Đầu tiên xây theo hình tháp. Đỉnh tháp là Thư mục nguồn liên kết tới Kinh, Huyệt, Vị Thuốc,
> Bài Thuốc. Rồi mới đến bệnh, triệu chứng — đó là thứ giá trị nhất mình phải hệ thống hoá mạch
> lạc. Sức mạnh là ở mạng lưới này vừa là link nội bộ nhưng cũng là đồ thị tri thức. Ngoài ra
> còn phát triển theo chiều ngang: từ các từ khoá ngắn, đến từ khoá dài và ngữ nghĩa (semantic).

Hai đòi hỏi, và chúng không tách rời: **một mạng lưới, hai công dụng** — vừa là liên kết nội bộ
(việc của bộ máy tìm kiếm) vừa là đồ thị tri thức (việc của người tra cứu và của tầng AI).

## 2. Số đo thật của đồ thị hôm nay (đo 02/10/2026 trên `defaultdb`)

Cạnh đã có sẵn nhiều hơn mức ai cũng tưởng — vấn đề không phải THIẾU dữ liệu mà là dữ liệu
nằm rời trong khoảng 20 bảng, phủ không đều, và **phần lớn không có URL công khai**.

### Đỉnh tháp — nguồn y văn → thực thể nền

| Cạnh | Phủ | Số cạnh |
|---|---|---|
| nguồn → bài thuốc (`nguon_phuong_thang`) | **13.939/13.942 = 100%** | 32.194 |
| nguồn → huyệt (`nguon_huyet`) | **1.036 huyệt** (không gian từ điển) | 1.177 |
| nguồn → vị thuốc (`nguon_vi_thuoc`) | **209/1.045 = 20%** | 1.322 |
| nguồn → **kinh** | **0/18 = 0%** — bảng không tồn tại | 0 |

### Tầng nền nối nhau

| Cạnh | Phủ |
|---|---|
| huyệt → kinh (`huyet_vi.id_kinh_mach`) | 445/445 = 100% |
| vị thuốc → quy kinh (`vi_thuoc_kinh_mach`) | 788/1.045 = 75% |
| bài thuốc → vị thuốc (`phuong_thang.thanh_phan`) | 13.889/13.942 = 100% |

### Tầng người tìm — "thứ giá trị nhất", và cũng là tầng yếu nhất

| Cạnh | Phủ |
|---|---|
| pháp trị → bài thuốc (`bai_thuoc_phap_tri`) | 375/380 = 99% |
| pháp trị → kinh mạch (`phap_tri_kinh_mach`) | 359/380 = 94% |
| thể bệnh → phương huyệt (`the_benh_phuong_huyet`) | 48/48 = 100% nhưng chỉ **14 huyệt** (bản thử) |
| triệu chứng → pháp trị (`phap_tri_trieu_chung`) | 555/1.033 = **54%** |
| triệu chứng → bài thuốc (`trieu_chung_bai_thuoc_phap_tri`) | 555/1.033 = **54%** |
| triệu chứng → bệnh (`quan_he_benh_trieu_chung`) | 41/1.033 = **4%** |
| triệu chứng → **huyệt** | **0/1.033 = 0%** — không có bảng |
| **triệu chứng mồ côi** (không nối gì) | **478/1.033 = 46%** |

### Trục ngang — từ vựng dùng chung đã có

`chu_tri` 3.588 mục (2.655 đang được vị thuốc dùng) · `cong_dung` 1.243 · `kieng_ky` 1.397 ·
`trieu_chung` 1.033. Vị thuốc có chủ trị: 807/1.045 = 77%.

## 3. Phát hiện lớn nhất: tầng giá trị nhất KHÔNG CÓ URL công khai

Nhóm đường dẫn công khai hôm nay (đo trên sitemap thật): `/bai-thuoc/` `/benh-hoc/`
`/cham-cuu-tri-benh/` `/duoc-lieu/` `/huyet/` `/kinh/` `/nguon/` `/blog/`.

**Không có `/trieu-chung/`, không có `/phap-tri/`, không có `/the-benh/`.**

Nghĩa là 1.033 triệu chứng và 380 pháp trị — đúng tầng người tìm gõ vào Google — chỉ tồn tại
bên trong `/app/*`, mà `/app/*` bị `robots.txt` chặn. Toàn bộ tầng đáng giá nhất đang vô hình.

Đây là lý do "hệ thống hoá mạch lạc" không thể chỉ là thêm link giữa các trang đã có: phải có
trang cho tầng đó trước, rồi mạng lưới mới có chỗ mà nối.

## 4. ⚠️ Bẫy đã đo được: HAI không gian danh tính huyệt

Chỗ này phải đọc trước khi viết một câu SQL nào của đồ thị.

| Bảng | Cột | Dải | Thuộc |
|---|---|---|---|
| `huyet_vi` | `id_huyet` | 1–456 (445 dòng) | **app** (bảng lâm sàng) |
| `nguon_huyet` | `huyet_id` | 1–1059 (1.036 id) | **từ điển** (khớp `ec_huyet_vi` 1.059) |
| `the_benh_phuong_huyet` | `id_huyet` | 1–359 (14 id) | app (khớp 14/14) |
| `phac_do_dieu_tri` | `id_huyet` | 1–455 (200 id) | app (khớp 200/200) |
| `phac_do_chuan_huyet` | `id_huyet` | 1–418 (180 id) | app (khớp 180/180) |

Cầu nối là `huyet_vi.id_tu_dien`, và nó **chỉ phủ 411/445** dòng app.

**Vì sao bẫy này nguy hiểm hơn một lỗi join thường:** cả hai không gian đều là số nguyên nhỏ,
nên `JOIN huyet_vi h ON h.id_huyet = n.huyet_id` trên `nguon_huyet` vẫn trả về **432 dòng** —
không lỗi, không cảnh báo, và mỗi dòng là một cặp (nguồn, huyệt) SAI. Một đồ thị tri thức dựng
trên đó sẽ nói "sách X bàn về huyệt Y" trong khi sách X chưa từng nhắc huyệt Y. Với nội dung
y khoa, đó là loại sai tệ nhất: trông có căn cứ.

→ **Luật:** mọi cạnh phải khai rõ không gian id của hai đầu, và phép kiểm phải có một ca
"join sai không gian thì bắt được" (so số cạnh với số cạnh khớp qua `id_tu_dien`).

## 5. Kiến trúc tháp

```
T1  ĐỈNH — Nguồn y văn (2.139)                     "điều này ai nói, ở sách nào"
         │ trích dẫn: 32.194 + 1.322 + 1.177 cạnh
         ▼
T2  NỀN  — Kinh (21) · Huyệt (1.060) · Vị thuốc (1.045) · Bài thuốc (13.942)
         │ quy kinh · thành phần · chủ trị
         ▼
T3  PHÁP — Pháp trị (380) · Thể bệnh (48) · Chứng (50)      ← CHƯA có trang công khai
         │ chỉ định
         ▼
T4  NHU CẦU — Bệnh (202) · Triệu chứng (1.033)              ← CHƯA có trang cho triệu chứng
             ▲ người tìm bước vào từ đây
```

**Hai chiều đi, và cả hai đều phải đi được:**

- **Xuống** (người tra cứu): triệu chứng → pháp trị → bài thuốc → vị thuốc → nguồn. Đây là
  đường trả lời câu hỏi thật của người bệnh.
- **Lên** (chứng cứ): mỗi khẳng định ở tầng dưới phải lần được tới một mục `/nguon/`. Đây là
  thứ biến kho này thành tài sản E-E-A-T mà đối thủ không sao chép được — họ không có 34.693
  cạnh trích dẫn.

**Luật dựng cạnh:** chỉ dựng cạnh có BẢN GHI THẬT. Không suy diễn "huyệt A trị bệnh B vì cùng
kinh". Suy diễn trên nội dung y khoa là bịa có vẻ ngoài học thuật — cùng lý lẽ với rào chắn
"trích dẫn phải khớp nguyên văn" của bot thẩm định.

**Cạnh phái sinh được phép, nhưng phải ghi rõ là phái sinh:** `build-dict` đã làm đúng kiểu này
("Huyệt này dùng trong": 382 huyệt, 2.325 cặp, suy từ 100 trang châm cứu trị bệnh). Cạnh phái
sinh hiện trên trang với cách diễn đạt khác cạnh gốc.

## 6. Mạng nhện blog đã dựng là một ca RIÊNG, rất nhỏ

`viet/lien-ket-nguoc.mjs` (dựng 02/10) nối **blog ↔ blog** theo cụm nội dung và từ khoá. Trong
tháp này nó chỉ là một cạnh ngang ở ngoài rìa: blog không phải một tầng của tháp, nó là lớp dẫn
người đọc từ truy vấn rộng vào tháp.

Giữ nguyên, không gỡ. Nhưng đừng coi nó là "mạng nhện đã xong" — nó không chạm tới 34.693 cạnh
trích dẫn, không chạm tầng triệu chứng, và không biết gì về tháp.

## 6b. ĐO GĐ 1 (02/10/2026): lỗ "nguồn → kinh" nhỏ hơn tưởng, và vì sao

GĐ 1 được xếp đầu vì "rẻ nhất": 21 trang kinh đều dẫn y văn, rút tên sách rồi khớp `/nguon/`.
**Đo xong thì giả định đó sai một nửa** — ghi lại để không ai xếp lại nó lên đầu.

Phép đo 1 — khớp cả 2.138 tên nguồn vào chữ của 12 kinh: ra 10 cạnh. **Phần lớn là khớp bừa:**

| Cụm "khớp" | Thực tế trong chữ |
|---|---|
| Thi Phát | …thực chứng **thì phát** cuồng… |
| Thi Sơ | …kinh khí suy **thì s**ợ lạnh… |
| Dư Lâm · Chu Tiêu | không tìm thấy — khớp bắc qua ranh giới hai mục |

Đây đúng cái bẫy CLAUDE.md đã ghi ở mục liên kết chéo: khớp tên vào toàn văn thì `(30g)` và
`(Spongilla fragilis)` cũng thành link. Chuẩn hoá bỏ dấu thanh làm "thì phát" hoá "thi phat".

Phép đo 2 — **rút theo VỊ TRÍ** (cụm trong ngoặc đơn, bỏ cụm bắt đầu bằng số và cụm có đơn vị
liều), rồi khớp `/nguon/` bằng chuẩn hoá mạnh — tức dùng lại đúng cách hệ liên kết chéo đã làm:

- 134 cụm trong ngoặc → **9 khớp**, **6/12 kinh**, 2 sách: `Châm Cứu Đại Thành` (6),
  `Châm Cứu Học Thượng Hải` (3). **Không cạnh nào sai.**
- Cụm không khớp là mã huyệt (`Nh 3`, `Ty 4`, `C 13`, `Đtr`), ghi chú giải phẫu, giải thích Ngũ
  Hành — loại đúng.

**Kết luận: đỉnh tháp nhánh kinh chỉ có 9 cạnh thật**, vì thân bài trang kinh vốn ít dẫn sách,
không phải vì phép dò kém. Dựng cả một đường ống cho 9 cạnh là không xứng công; làm tay 21 mục
thì xong trong một buổi và chính xác hơn.

**Thu hoạch phụ, đáng giá hơn chính cạnh:** cụm `Châm cứu lâm sàng biện chứng luận trị` xuất
hiện **8 lần** trong các trang kinh mà **không khớp mục `/nguon/` nào** — tức thư mục nguồn
2.139 mục đang THIẾU một quyển đang được kho của mình dẫn. Phép rút-theo-vị-trí này vì vậy nên
chạy cho CẢ kho (huyệt, bài thuốc, bệnh học), không chỉ cho kinh: nó là bộ dò **nguồn còn
thiếu trong thư mục**, và đó là việc nuôi đỉnh tháp từ gốc.

→ **Đề nghị đổi thứ tự trong GĐ 1:** (1) chạy bộ dò "cụm trong ngoặc không khớp nguồn" trên cả
kho để biết thư mục thiếu bao nhiêu quyển; (2) bổ sung các quyển đó; (3) khi ấy nguồn → kinh và
nguồn → vị thuốc cùng tăng, thay vì vá từng nhánh một.

## 7. Hai điều người dùng ĐÃ CHỐT (02/10/2026)

> **Q1 → (b) Nhóm trang mới cho TẤT CẢ:** `/trieu-chung/<slug>/` 1.033 trang +
> `/phap-tri/<slug>/` 380 trang.
>
> ⚠️ Người dùng chọn phương án mạnh nhất về SEO, nên phải tự chặn đúng rủi ro đi kèm: 478/1.033
> triệu chứng đang mồ côi. Cách chặn là **luật index** như bài thuốc đã làm — trang vẫn SỐNG cho
> người đọc và cho liên kết nội bộ, chỉ **không vào sitemap** khi dưới ngưỡng cạnh. Đúng lối bước
> 3 kế hoạch 29/09 ("Trang không đạt vẫn sống, không bị xoá") và đúng luật "chỉ index trang có
> giá trị riêng". Ngưỡng cạnh chốt bằng SỐ ĐO khi làm, không chốt bằng cảm giác.
>
> **Q2 → thứ tự kinh → vị thuốc → triệu chứng/huyệt.** Nhưng xem mục 6b: đo xong thì nhánh kinh
> chỉ còn 9 cạnh thật, nên bước đầu của GĐ 1 chuyển thành "dò nguồn còn thiếu trong thư mục trên
> cả kho" — nó nuôi cả nhánh kinh lẫn nhánh vị thuốc cùng lúc.

### Phương án đã bị loại (giữ lại để không bàn lại)

**Q1. Tầng T3/T4 lên trang công khai bằng cách nào?**

- **(a) Nhóm trang mới** `/trieu-chung/<slug>/` (1.033 trang) + `/phap-tri/<slug>/` (380).
  Mỗi trang là một nút thật của đồ thị, có URL riêng để nhận link và để Google index.
  Mạnh nhất về SEO, nhưng thêm 1.413 trang mới — và 46% triệu chứng đang mồ côi, tức sẽ sinh ra
  hàng trăm trang mỏng nếu không siết luật index. Phải áp đúng luật `duDay()` như bài thuốc.
- **(b) Gộp vào trang bệnh học sẵn có**: mỗi triệu chứng là một mục neo (`#trieu-chung-x`) trong
  trang bệnh. Không thêm URL, không rủi ro trang mỏng, nhưng triệu chứng không bao giờ tự xếp
  hạng cho truy vấn của chính nó.
- **(c) Lai**: chỉ triệu chứng có ≥ N cạnh (ước lượng 555 mục đạt) được trang riêng; phần còn
  lại làm mục neo trong trang bệnh, nâng cấp sau khi có cạnh.

*Đề xuất: (c).* Nó cho tầng giá trị nhất có URL thật mà không mời 478 trang mỏng vào chỉ mục —
đúng luật "chỉ index trang có giá trị riêng" đã chốt ở kế hoạch 29/09.

**Q2. Vá lỗ nào trước?** Ba lỗ, công sức rất khác nhau:

| Lỗ | Cách vá | Công |
|---|---|---|
| nguồn → kinh: 0 cạnh | 21 trang kinh đều dẫn y văn trong thân bài; rút tên sách rồi khớp `/nguon/` | nhỏ (21 mục) |
| nguồn → vị thuốc: 20% | `vi_thuoc.xuat_xu` có 3.217 biến thể chuỗi — phải khớp về `nguon` | vừa |
| triệu chứng → huyệt: 0 cạnh | phái sinh qua `phap_tri_kinh_mach` → kinh → huyệt, HOẶC nhân rộng `the_benh_phuong_huyet` từ 14 huyệt lên | lớn |

*Đề xuất thứ tự: kinh → vị thuốc → triệu chứng/huyệt.* Vì lỗ "nguồn → kinh" rẻ nhất mà lại
đóng nốt đỉnh tháp đúng như yêu cầu, còn lỗ triệu chứng → huyệt cần quyết định nghiệp vụ
(phái sinh hay chấm tay) nên không nên làm đầu.

## 8. Trục ngang: ngắn → dài → ngữ nghĩa

Trục dọc cho người tìm đi tới câu trả lời; trục ngang cho họ tìm thấy lối vào.

| Bậc | Ví dụ | Trang nhận | Vốn đã có |
|---|---|---|---|
| Ngắn | "mất ngủ" | trang bệnh / triệu chứng gốc | `trieu_chung` 1.033 |
| Dài | "mất ngủ do tâm tỳ hư" | thể bệnh / pháp trị | `the_benh` 48, `phap_tri` 380 |
| Ngữ nghĩa | "khó vào giấc", "giấc nông dễ tỉnh" | cùng đích với bậc trên | `chu_tri` 3.588 + `cong_dung` 1.243 |

**Cách nối, không phát minh thước mới:** `chu_tri` và `cong_dung` là từ vựng CÓ THẬT, dùng
chung giữa vị thuốc, huyệt và `nhom_nho_chu_tri` — tức chúng đã là tầng ngữ nghĩa, chỉ chưa ai
dùng làm tầng ngữ nghĩa. Hai cụm chủ trị trỏ cùng một tập thực thể là hai cách gọi của một nhu
cầu; đó là quan hệ đo được, không phải quan hệ do mô hình đoán.

⚠️ **Tuyệt đối không tạo mục tra cứu mới khi khớp** — luật này đã có trong CLAUDE.md
(`dong-bo-lien-ket.mjs`): `chu_tri` dùng chung với huyệt vị, một lỗi gõ sinh mục mới là làm bẩn
cả phần huyệt và rất khó lần ngược.

## 9. Chia giai đoạn

- **GĐ 0 — ĐÃ DỰNG (02/10/2026).** `backend/tmp/do-do-thi-tri-thuc.mjs` (chỉ đọc, mã thoát 1 khi
  trượt): khai không gian id của từng cạnh ở MỘT chỗ, in lại mọi con số của tài liệu này bằng một
  lệnh, và kiểm rằng nối sai không gian vẫn cho số KHÁC nối đúng — hai cách cho cùng số thì phép
  kiểm mất tác dụng và nó báo trượt.
- **GĐ 1 — đóng đỉnh tháp, thứ tự đã đổi theo số đo (mục 6b).** (1) Bộ dò "cụm trong ngoặc đơn
  không khớp mục `/nguon/`" chạy trên CẢ kho → danh sách quyển thư mục còn thiếu; (2) bổ sung
  các quyển đó; (3) nguồn → kinh làm TAY 21 mục (9 cạnh dò được, không xứng một đường ống);
  (4) nguồn → vị thuốc (836 vị chưa có nguồn) — đây mới là phần khối lượng. Rồi dựng khối "Y văn
  dẫn mục này" trên trang huyệt/kinh/vị thuốc/bài thuốc bằng MỘT bộ sinh dùng chung, thay vì bốn
  chỗ ghép chuỗi riêng.
- **GĐ 2 — T3/T4 lên trang** theo phương án Q1 đã chốt, kèm luật index đo bằng số.
- **GĐ 3 — trục ngang.** Chỉ mục ngữ nghĩa từ `chu_tri`/`cong_dung`; trang bậc dài nối lên bậc
  ngắn và xuống thực thể.
- **GĐ 4 — nối vào Rada.** Phiếu leo top đề xuất cạnh còn thiếu của đúng trang đang soi; mạng
  nhện blog (mục 6 cũ) trở thành một nguồn cạnh trong cùng bộ máy.

## 10. Nghiệm thu

- Mỗi cạnh công bố ra trang phải lần ngược được tới một bản ghi: chọn ngẫu nhiên 20 cạnh mỗi
  loại, kiểm tay.
- Phép kiểm "join sai không gian": cố ý nối `nguon_huyet.huyet_id` vào `huyet_vi.id_huyet` phải
  bị bắt (số cạnh lệch so với nối qua `id_tu_dien`).
- Độ sâu: mọi trang T3/T4 được index phải ≤ 3 cú nhấp từ trang chủ (đo bằng bộ đo đồ thị
  `dist/` đã dùng hôm 01/10).
- Không trang T3/T4 nào vào sitemap mà có dưới N cạnh (N chốt ở Q1).
- `kiem-seo` + `kiem-sitemap` vẫn xanh; số URL theo nhóm ghi lại trước/sau.
