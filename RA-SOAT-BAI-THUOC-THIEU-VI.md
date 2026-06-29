# Rà soát "thiếu vị" trong 172 bài cổ phương — NGUYÊN NHÂN & KHÔI PHỤC

> Cập nhật 29/06/2026. Kết luận đã đổi so với bản đầu: **đây KHÔNG phải lỗi nhập tay từng bài**,
> mà là **mất dữ liệu hàng loạt do sự cố xoá `vi_thuoc` + ràng buộc CASCADE**.

## 1. Nguyên nhân gốc (đã xác minh bằng dữ liệu)

- `bai_thuoc_chi_tiet` (bảng nối bài thuốc ↔ vị thuốc) có `@ManyToOne(() => ViThuoc, { onDelete: 'CASCADE' })`
  → xoá 1 vị trong `vi_thuoc` sẽ **xoá theo mọi dòng thành phần** trỏ tới vị đó ở **mọi bài**.
- Hôm nay (29/06) có sự cố `DELETE ... LIKE '%__t%'` xoá nhầm **166 vị** (`_` là wildcard 1 ký tự nên
  `__t` khớp mọi tên dạng "…XYt…" — rất trúng tên Hán-Việt: Tr**uật**, C**át**, Ho**ạt**, Mi**ết**, T**ất**…).
- Hệ quả đo được trên DB hiện tại:
  - **0** dòng `bai_thuoc_chi_tiet` còn trỏ tới bất kỳ vị nào trong 166 vị đó (đã bị cascade xoá sạch).
  - Bạch Truật / Cát Cánh / Hoạt Thạch / Ngưu Tất… nay xuất hiện trong **0 bài** (vô lý).
  - Phân bố số vị/bài bị tụt mạnh: 12 bài còn 0 vị, 9 bài còn 1 vị, 34 bài còn 2 vị…
- `tools/recover-vithuoc.cjs` đã chèn lại 156/165 vị vào `vi_thuoc` và khôi phục liên kết **nhóm dược lý**,
  nhưng **KHÔNG khôi phục `bai_thuoc_chi_tiet`** → thành phần bài thuốc vẫn còn khuyết.
- **Không có** bảng backup `bai_thuoc_chi_tiet_bak` trong DB.

➡️ Danh sách "thiếu vị" tôi tìm bằng kiến thức phương tễ (bên dưới) trùng khớp gần như 1-1 với
`tools/deleted-vithuoc.json` → khẳng định: vị "thiếu" chính là vị bị cascade xoá.

## 2. Nguồn khôi phục: Excel ngày 8/6 (TRƯỚC sự cố)

`bai-thuoc-2026-06-08-final.xlsx` chứa **đúng 172 bài cổ phương** với **thành phần đầy đủ** (cột "Thành phần"),
gồm cả các vị nay đã mất. VD bài 101 trong Excel = *Bán hạ, Bạch truật, Thiên ma, Trần bì, Phục linh, Cam thảo* (đủ 6).

Công cụ có sẵn `tools/import-bai-thuoc-from-excel.cjs` đọc Excel → khớp tên vị (btNormKey, đúng từng dấu) →
gọi `PUT /bai-thuoc/:id` (xoá chi_tiet cũ, chèn lại). **An toàn**: chỉ ghi khi bài khớp đủ 100% vị (rowMissVi=0),
nếu còn vị chưa khớp thì **bỏ qua, giữ nguyên** (không làm rỗng bài).

## 3. Mô phỏng độ phủ (read-only, không ghi)

Khớp Excel `-final` với `vi_thuoc` hiện tại:
- **103/172 bài** khôi phục ĐẦY ĐỦ ngay.
- **69/172 bài** bị chặn vì 31 tên vị chưa khớp — phần lớn là **lệch tên/đồng nghĩa**, không phải vị còn mất.

## 4. Bảng quy tên (alias) để gỡ 69 bài còn chặn

### 4a. Vị VẪN CÒN trong DB, chỉ khác tên → thêm alias là khớp ngay (không sửa vi_thuoc)
| Tên trong Excel | → Vị trong `vi_thuoc` (id) |
|---|---|
| Sinh địa | Sinh Địa Hoàng (#337) |
| Sơn dược / Sinh sơn dược | Hoài Sơn |
| Quất bì / Quảng trần bì | Trần Bì (#204) |
| Kỷ tử / Câu kỷ | Câu Kỳ Tử (#70) |
| Tô diệp | Tử Tô |
| Trúc diệp | Đạm Trúc Diệp (#371) |
| Hoa phấn | Thiên Hoa Phấn (#406) |
| Ý dĩ nhân | Ý Dĩ (#428) |
| Phục linh bì / Xích phục linh / Bạch phục linh | Phục Linh (#313) |
| Sinh cam thảo | Cam Thảo (#25) |
| Sinh long cốt | Long Cốt (#1168) |
| Thục địa hoàng | Thục Địa (#64) |
| Nhục quế tâm | Quế Tâm (#378) |
| Tất bát | Tất Bạt (#286) |
| Táo nhân | Toan Táo Nhân (#61) |
| Trắc bách diệp / Sinh trắc bách diệp | Trắc Bá Diệp |
| Cồ mạch | Cù Mạch |
| Hạn liên thảo | Hạ Liên Thảo |

### 4b. Cần QUYẾT ĐỊNH (mơ hồ hoặc thật sự còn thiếu vị)
| Tên trong Excel | Bài | Ghi chú |
|---|---|---|
| Địa hoàng | 15 Kim Quỹ Thận Khí, 21 Mạch Vị, 89 Tam Tài, 162 Đại Định Phong Châu | Tuỳ bài: Thục Địa hay Can/Sinh Địa Hoàng? |
| Phục thần (茯神) | 53, 55, 57, 88 + (Định Giản) | Có vị Phục Thần riêng hay dùng tạm Phục Linh? |
| Phục thần mộc (茯神木) | 155 Linh Giác Câu Đằng | Vị hiếm, chưa có trong DB |
| Cảnh mễ / Ngạnh mễ (粳米) | 23 Bạch Hổ Thang | Gạo tẻ — chưa có vị; hiện bài để nhầm "Ý Dĩ" |
| Thiến căn (茜根) | 143 Thiến Căn Tán | Chưa có; hiện bài để nhầm "Hà Thủ Ô" |
| Tề tào (蛴螬) | 170 Đại Hoàng Giá Trùng | id 1086 nằm trong nhóm bị xoá, chưa khôi phục |

## 5. ĐÃ THỰC HIỆN (29/06/2026)

- [x] Backup `bai_thuoc_chi_tiet` → `bai_thuoc_chi_tiet_bak_20260629` (3912 dòng).
- [x] Khôi phục nốt **9 vị** còn thiếu trong `vi_thuoc` (`node tools/recover-vithuoc.cjs`) → 1062 vị (đủ 165/165).
- [x] Viết `tools/restore-bai-thuoc-chi-tiet.cjs` (Excel `-final` → API PUT, có bảng ALIAS mục 4a; an toàn: chỉ ghi khi khớp đủ vị).
- [x] Chạy THẬT: **161/172 bài khôi phục, 0 lỗi**, +1108 dòng thành phần. `bai_thuoc_chi_tiet` 3912 → 4062.
- [x] Verify: bài 101 đủ 6 vị (gồm Bạch Truật); Bạch Truật từ 0 → 21 bài; chỉ còn 1 bài ≤1 vị (#657 Vân Nam Bạch Dược — bí truyền).

### 11 bài còn lại — ĐÃ XỬ LÝ theo quyết định lâm sàng của user
- [x] Tạo 3 vị mới: **Phục Thần** #1177 (茯神), **Ngạnh Mễ** #1178 (粳米), **Thiến Thảo** #1179 (茜草).
- [x] **Phục thần** ×5 (53, 55, 57, 88, 156) → nối Phục Thần #1177.
- [x] **Địa hoàng** ×4 theo từng bài: 15 Kim Quỹ Thận Khí + 162 Đại Định Phong Châu → **Can Địa Hoàng #1116**; 21 Mạch Vị + 89 Tam Tài → **Thục Địa #64**.
- [x] **Cảnh/Ngạnh mễ** → bài 23 Bạch Hổ Thang nối **Ngạnh Mễ #1178** (thay "Ý Dĩ" sai); Thạch Cao cũng trở lại.
- [x] **Thiến căn** → bài 143 nối **Thiến Thảo #1179** (thay "Hà Thủ Ô" sai).
- [x] Chạy lại `restore-bai-thuoc-chi-tiet.cjs`: **172/172 bài, 0 lỗi**, 1207 dòng. `bai_thuoc_chi_tiet` = 4072.

### ✔ HOÀN TẤT 172/172 cổ phương. Chỉ #657 Vân Nam Bạch Dược để rỗng (bí truyền — đúng).

> **Đã sửa gốc rủi ro (29/06):** đổi FK `bai_thuoc_chi_tiet.id_vi_thuoc → vi_thuoc` từ **CASCADE → RESTRICT**.
> - Migration: `backend/sql/migrate-bai-thuoc-chi-tiet-restrict-vithuoc.sql` (đã chạy trên DB). Entity: `bai-thuoc-chi-tiet.model.ts` đã đổi `onDelete: 'RESTRICT'`.
> - Test xác nhận: DELETE Bạch Truật (đang dùng 22 bài) bị chặn (FK 23503). FK `id_bai_thuoc` giữ CASCADE (đúng).
> - Các FK→vi_thuoc khác (cong_dung/chu_tri/kieng_ky/ten_goi_khac + nối M2M nhom_nho/kinh_mach/tuong_phan) GIỮ CASCADE: là dữ liệu thuộc chính vị/bảng nối, xoá kèm không huỷ thực thể khác.
>
> **Việc nên làm tiếp (ngoài phạm vi này):**
> 1. 3 vị mới (Phục Thần, Ngạnh Mễ, Thiến Thảo) hiện chỉ có TÊN → cần enrich y-văn/tính-vị-quy-kinh.
> 2. Các bài Đông/Tây Y **ngoài 172 cổ phương** cũng bị cascade nhưng KHÔNG có snapshot → chưa khôi phục.
> 3. Deploy lại backend để `dist/` khớp entity đã sửa (DB đã được bảo vệ ngay bởi migration, không phụ thuộc rebuild).
> Hoàn tác nếu cần: bảng `bai_thuoc_chi_tiet_bak_20260629` còn nguyên trạng thái TRƯỚC khi ghi.

> Lưu ý: Excel chỉ có **172 bài cổ phương**. Các bài Đông Y/Tây Y khác cũng bị cascade (12 bài còn 0 vị…)
> nhưng KHÔNG có trong Excel này — cần snapshot khác nếu muốn phục hồi trọn bộ 683 bài.

---

## 6. Phụ lục — Các bài và vị đã mất (đối chiếu phương tễ, để hậu kiểm)

*(Giữ lại từ bản rà thủ công; nay hiểu đây là các vị bị cascade xoá, sẽ được khôi phục từ Excel.)*

### Mất chính vị nằm trong TÊN bài
101 Bán Hạ **Bạch Truật** Thiên Ma Thang · 42 Sâm Linh **Bạch Truật** Tán · 54 Linh Quế **Truật** Cam ·
70 Việt Tỳ Gia **Truật** · 67 Nhân Trần **Truật** Phụ · 38 **Cát Căn** Cầm Liên · 23 **Bạch Hổ** (Thạch Cao) ·
24 Lục Nhất (**Hoạt Thạch**) · 110 **Chích Cam Thảo** Thang · 45 **Ma Tử Nhân** Hoàn · 43 Tứ Thần (**Bổ Cốt Chi**) ·
51 **Ngũ Nhân** (Bá tử nhân, Tùng tử nhân) · 10 Tam **Tử** (Tô tử) · 136 Tứ **Sinh** (Sinh trắc bá diệp) ·
62 Bán Hạ **Thuật Mễ** · 131 **Độc Hoạt** Ký Sinh · 96 **Khương Hoạt** Thắng Thấp · 69 **Miết Giáp** Tiễn ·
151 Thần **Tê** Đan · 143 **Thiến Căn** Tán · 170 Đại Hoàng **Giá Trùng** · 163 Bát **Trân** (Bạch truật) ·
137 Ngọc Nữ (Thạch cao, Ngưu tất) · 141 **Hà Diệp** Hoàn.

### Mất Bạch Truật (không ở trong tên)
31 Lý Trung · 44 Phụ Tử Lý Trung · 39 Ngũ Linh Tán · 64 Nhân Trần Ngũ Linh · 14 Chân Vũ · 41 Thống Tả Yếu Phương ·
57 Quy Tỳ · 116 Tiêu Dao · 121 Hương Sa Lục Quân · 37 Bổ Trung Ích Khí (+Cam thảo, Đương quy) · 73 Thực Tỳ Ẩm ·
148 Hoàng Thổ · 128 Chỉ Thực Đạo Trệ · 22 Hoắc Hương Chính Khí (+Cát cánh).

### Cụm khác
- Cát Cánh: 1 Hạnh Tô, 2 Tang Cúc, 7 Bách Hợp Cố Kim, 104 Ngân Kiều, 56 Huyết Phủ Trục Ứ, 154 Thanh Ôn Bại Độc, 52 Thiên Vương Bổ Tâm.
- Hoạt Thạch: 80 Bát Chính, 83 Tiểu Kế, 127 Cam Lộ Tiêu Độc.
- Cam Thảo: 35 Sài Hồ Sơ Can, 78 Đạo Xích, 12 Tô Tử Giáng Khí, 103 Đại Bổ Nguyên Tiễn, 125 Tiểu Kiến Trung, 53 Dưỡng Tâm.
- Ngưu Tất/Long Cốt/Khương Hoạt/Một Dược: 98 Trấn Can Tức Phong, 112 Kiến Linh, 95 Xuyên Khung Trà Điều, 72 Sơ Tạc Ẩm, 130 Thiếu Phúc Trục Ứ, 132 Thân Thống Trục Ứ.
- Khác: 20 Dưỡng Âm Thanh Phế (Bạch thược), 61 Ôn Đởm (Trần bì), 93 Kim Tỏa Cố Tinh (Sa uyển tử, Long cốt), 94 Gia Vị Nhị Diệu (Thương truật, Ngưu tất), 122/123 (Thục tiêu), 146 Hòe Hoa (Kinh giới tuệ), 135 Thanh Nga (Bổ cốt chi), 150 Nhĩ Lung Tả Từ (cả nền Lục vị), 160/161 (Nam tinh…), 106 Nguyệt Hoa, 152 An Cung (Uất kim), 155 Linh Giác Câu Đằng (Phục thần).
