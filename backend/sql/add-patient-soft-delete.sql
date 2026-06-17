-- Soft delete cho bệnh nhân — phục vụ tính năng "tự xoá tài khoản & dữ liệu".
--
-- Người dùng app (hoặc qua trang web công khai /xoa-tai-khoan) xác minh bằng
-- SĐT + mật khẩu rồi yêu cầu xoá. Backend gọi repository.softDelete() → set cột
-- "deletedAt". TypeORM tự thêm điều kiện `"deletedAt" IS NULL` vào find/findOne/
-- QueryBuilder, nên:
--   * tài khoản đã xoá KHÔNG đăng nhập lại được (validatePatient không tìm thấy),
--   * biến mất khỏi danh sách bệnh nhân của phòng khám,
--   * nhưng DỮ LIỆU VẪN còn trong DB để tuân thủ quy định lưu hồ sơ khám chữa bệnh
--     (xoá hẳn về sau theo lịch/định kỳ).
--
-- Khớp với @DeleteDateColumn() trong src/models/patient.model.ts.
-- An toàn khi chạy lại nhiều lần (IF NOT EXISTS). Không xoá / không sửa dữ liệu cũ.
-- Cột dùng camelCase (có nháy kép) để khớp convention TypeORM của bảng patients.

BEGIN;

ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP NULL;

COMMENT ON COLUMN patients."deletedAt"
  IS 'Thời điểm bệnh nhân yêu cầu xoá tài khoản (soft delete). NULL = đang hoạt động.';

COMMIT;
