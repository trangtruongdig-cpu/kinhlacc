-- migrate-bai-thuoc-chi-tiet-restrict-vithuoc.sql
--
-- Đổi khoá ngoại bai_thuoc_chi_tiet.id_vi_thuoc → vi_thuoc(id)
-- từ  ON DELETE CASCADE  →  ON DELETE RESTRICT.
--
-- LÝ DO: 29/06/2026 một thao tác xoá nhầm vị thuốc (DELETE ... LIKE '%__t%') đã CASCADE
-- cuốn theo TOÀN BỘ dòng thành phần (bai_thuoc_chi_tiet) trỏ tới các vị đó ở mọi bài thuốc,
-- làm khuyết hàng loạt cổ phương mà không để lại dấu vết. RESTRICT khiến KHÔNG thể xoá một
-- vị thuốc khi nó còn được dùng trong bất kỳ bài thuốc nào (phải gỡ tham chiếu trước).
--
-- GIỮ NGUYÊN FK id_bai_thuoc → bai_thuoc (FK_8b8516db…) với CASCADE: xoá 1 bài thuốc thì
-- xoá thành phần của chính bài đó là hành vi đúng.
--
-- AN TOÀN: idempotent (DROP IF EXISTS rồi ADD). Khi ADD, Postgres validate dữ liệu hiện có —
-- yêu cầu KHÔNG còn orphan (id_vi_thuoc trỏ tới vị không tồn tại). Đã kiểm: 0 orphan.
-- Tên constraint giữ NGUYÊN (FK_8abf3eed…) để khớp với tên TypeORM tự sinh (hash theo bảng+cột,
-- độc lập với onDelete) → không lệch nếu sau này bật synchronize.

BEGIN;

ALTER TABLE bai_thuoc_chi_tiet
  DROP CONSTRAINT IF EXISTS "FK_8abf3eed17fccba99639a2ef4ed";

ALTER TABLE bai_thuoc_chi_tiet
  ADD CONSTRAINT "FK_8abf3eed17fccba99639a2ef4ed"
  FOREIGN KEY (id_vi_thuoc) REFERENCES vi_thuoc(id) ON DELETE RESTRICT;

COMMIT;
