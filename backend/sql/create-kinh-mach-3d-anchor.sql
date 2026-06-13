-- Bảng lưu điểm CHỐT "Chấm Tay" của Đồ Hình Kinh Lạc 3D.
--
-- Mỗi dòng = 1 huyệt chốt do người dùng tự đặt trên mô hình 3D (toạ độ đã
-- chuẩn-hoá theo chiều cao thân). Dữ liệu DÙNG CHUNG toàn phòng khám → mọi máy
-- đăng nhập đều thấy chung một bộ chốt (đồng bộ qua server thay vì tải file JSON).
--
-- Backend (KinhMach3dService) cũng tự chạy CREATE TABLE IF NOT EXISTS này ở lần
-- gọi đầu tiên, nên file này chủ yếu để theo đúng quy ước backend/sql/ và để
-- chạy tay nếu muốn. An toàn khi chạy lại nhiều lần (idempotent).

CREATE TABLE IF NOT EXISTS kinh_mach_3d_anchor (
  code        varchar(16) PRIMARY KEY,            -- mã huyệt, vd 'LU2', 'CV4'
  x           double precision NOT NULL,
  y           double precision NOT NULL,
  z           double precision NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Bảng HƯỚNG KIM tự chỉnh ("Chấm Tay" → kéo cán kim để xoay). Mỗi dòng = 1 huyệt +
-- vector TRỤC kim (x,y,z, world chuẩn-hoá, ra ngoài da). Cũng tự tạo trong backend.
CREATE TABLE IF NOT EXISTS kinh_mach_3d_needle (
  code        varchar(16) PRIMARY KEY,            -- mã huyệt, vd 'LU2', 'CV4'
  x           double precision NOT NULL,
  y           double precision NOT NULL,
  z           double precision NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);
