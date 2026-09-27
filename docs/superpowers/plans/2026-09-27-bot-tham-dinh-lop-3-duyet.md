# Bot Thẩm Định — Kế hoạch 3: duyệt và áp bản sửa

> Bản NGẮN theo yêu cầu tiết kiệm hạn mức (27/09/2026). Giữ đủ quyết định kỹ thuật và
> thứ tự thi công; không chép lại mã vào plan như hai kế hoạch trước.

**Goal:** Người duyệt bấm một nút thì bản sửa của bot vào kho nội dung — qua `revisions`,
tăng `version`, để trigger `td_tr` dựng lại chỉ mục. Bot vẫn không tự ghi bất cứ gì.

**Spec:** `docs/superpowers/specs/2026-09-25-bot-tham-dinh-thu-vien-design.md`, mục
"Duyệt và áp bản sửa".

## Quyết định kỹ thuật cốt lõi

`de_xuat` là **chữ thuần** (`rutChu` đã bóc định dạng), còn cột `ec_*` là **JSONB Portable
Text**. Nên KHÔNG ghi đè cả cột — làm thế là xoá sạch cấu trúc khối và mọi định dạng.

Phép áp = **thay tại chỗ**: tìm span nào chứa `trich_dan`, thay đúng đoạn đó bằng `de_xuat`,
giữ nguyên mọi thứ còn lại. Không tìm thấy thì KHÔNG ghi và báo lỗi.

Hệ quả phải nhận: lời phê nào mà `de_xuat` viết lại cả đoạn chứ không thay một câu thì
không áp tự động được. Chúng đứng lại ở trạng thái `da_duyet` cho người sửa tay — thà bỏ
sót còn hơn ghi sai vào kho đang phục vụ khách.

## Ba bẫy hỏng im lặng khi ghi `ec_*` (sổ tay đã ghi)

| Bẫy | Kế hoạch này |
|---|---|
| Cột nội dung MỚI không tự vào ô tìm kiếm | Không dính: chỉ sửa cột đã có trong `cot_than` |
| Trường `image` cần `{id, meta:{storageKey}}` | Không dính: không sửa ảnh |
| Ghi LÔ phải `DISABLE TRIGGER` | Không dính: duyệt lẻ từng nhận xét, để `td_tr` chạy |

## Thứ tự thi công

- **Task 1 — `thayTrongJson`** (`backend/src/utils/tham-dinh-ap-sua.util.ts`): hàm thuần,
  đi hết mọi tầng JSON, thay chuỗi con trong mọi giá trị chuỗi, trả về
  `{ ketQua, soLanThay }`. So sau khi gộp khoảng trắng. Test: Portable Text, mảng chuỗi
  phẳng, chuỗi trần, không tìm thấy → `soLanThay: 0`, tìm thấy nhiều chỗ → thay HẾT.
- **Task 2 — `apBanSua`** trên `ThamDinhCmsService`: một giao dịch —
  `INSERT revisions(collection, entry_id, data)` với bản cũ, `UPDATE ec_* SET cot = ?,
  version = version + 1`, đổi `td_nhan_xet.trang_thai = 'da_ap'`. `soLanThay = 0` thì
  ROLLBACK. Test phần dựng câu, không test phần I/O.
- **Task 3 — API duyệt**: `GET /tham-dinh/nhan-xet` (lọc bộ/kiểu/trạng thái/lớp, phân
  trang), `PATCH /tham-dinh/nhan-xet/:id` (đổi trạng thái), `POST
  /tham-dinh/nhan-xet/:id/ap` (áp bản sửa). Tất cả sau `QuanTriGuard`.
- **Task 4 — màn duyệt** `frontend/src/views/ThamDinhView.vue`, route `meta.page:
  'tham-dinh'` (KHÔNG khai vào `constants/pages.ts` — để `authStore.can()` chỉ trả true
  cho Quản Trị, đúng lối `su-co`). Bản gốc và bản sửa cạnh nhau, tô trích dẫn trong bản
  gốc, nút Duyệt / Áp / Bỏ qua từng nhận xét.
- **Task 5 — nghiệm thu**: duyệt thử 1 bản sửa, kiểm `revisions` giữ bản cũ, `version`
  tăng 1, và **gõ một cụm chỉ có trong phần vừa sửa vào ô tìm kiếm — phải ra đúng mục**.
  Bước cuối nghe thừa nhưng là cách duy nhất biết trigger `td_tr` đã chạy.

## Ngoài phạm vi

Lớp 3 (đối sánh GSC + trang đối thủ) và phép dò trang render → kế hoạch 4.
