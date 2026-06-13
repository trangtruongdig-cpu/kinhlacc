-- Hệ thống quản lý người dùng + phân quyền theo trang (RBAC).
-- Idempotent: chạy lại nhiều lần không hỏng dữ liệu. BACKUP TRƯỚC KHI CHẠY cho chắc.
--
-- Mô hình:
--   * vai_tro          — vai trò (Quản Trị Viên, Bác Sĩ, Lễ Tân, Thu Ngân...).
--                        "trangCho" = danh sách KEY các trang vai trò được vào (jsonb mảng chuỗi).
--                        "laQuanTri" = full quyền (bỏ qua trangCho). "laHeThong" = vai trò mặc định, không xoá được.
--   * admins (mở rộng) — mỗi tài khoản gắn 1 vai trò qua "vaiTroId".
--
-- Cột dùng camelCase (có dấu nháy kép) để khớp convention TypeORM của project.

BEGIN;

-- 1) Bảng vai trò ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS vai_tro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ma VARCHAR(50) NOT NULL UNIQUE,                 -- mã định danh, vd 'admin', 'bac_si'
  ten VARCHAR(100) NOT NULL,                      -- tên hiển thị, vd 'Quản Trị Viên'
  "moTa" TEXT NOT NULL DEFAULT '',
  "laQuanTri" BOOLEAN NOT NULL DEFAULT FALSE,
  "laHeThong" BOOLEAN NOT NULL DEFAULT FALSE,
  "trangCho" JSONB NOT NULL DEFAULT '[]'::jsonb,  -- mảng key trang được phép
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2) Mở rộng bảng admins ---------------------------------------------------
ALTER TABLE admins ADD COLUMN IF NOT EXISTS "hoTen" VARCHAR(150);
ALTER TABLE admins ADD COLUMN IF NOT EXISTS email VARCHAR(150);
ALTER TABLE admins ADD COLUMN IF NOT EXISTS "vaiTroId" UUID;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS "trangThai" BOOLEAN NOT NULL DEFAULT TRUE;  -- TRUE = đang hoạt động, FALSE = bị khoá
ALTER TABLE admins ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Khoá ngoại admins.vaiTroId -> vai_tro.id (chỉ thêm 1 lần)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'admins_vaiTroId_fkey' AND table_name = 'admins'
  ) THEN
    ALTER TABLE admins
      ADD CONSTRAINT "admins_vaiTroId_fkey"
      FOREIGN KEY ("vaiTroId") REFERENCES vai_tro(id) ON DELETE SET NULL;
  END IF;
END$$;

-- 3) Seed 4 vai trò mặc định ----------------------------------------------
-- DO NOTHING khi đã tồn tại để không ghi đè tuỳ chỉnh của admin sau này.
INSERT INTO vai_tro (ma, ten, "moTa", "laQuanTri", "laHeThong", "trangCho") VALUES
  ('admin', 'Quản Trị Viên', 'Toàn quyền hệ thống: quản lý tài khoản, phân quyền và toàn bộ dữ liệu.', TRUE, TRUE,
    '["home","patients","appointments","western-medicine","meridian-diseases","kinh-mach-3d","tu-dien","medicines","symptoms","treatments","users"]'::jsonb),
  ('bac_si', 'Bác Sĩ', 'Khám bệnh, kê đơn, tra cứu chuyên môn (không quản lý tài khoản).', FALSE, TRUE,
    '["home","patients","appointments","western-medicine","meridian-diseases","kinh-mach-3d","tu-dien","medicines","symptoms","treatments"]'::jsonb),
  ('le_tan', 'Lễ Tân', 'Quản lý bệnh nhân và lịch trị liệu.', FALSE, TRUE,
    '["home","patients","appointments"]'::jsonb),
  ('thu_ngan', 'Thu Ngân / Kế Toán', 'Xem bệnh nhân và lịch trị liệu (phục vụ thu ngân).', FALSE, TRUE,
    '["home","patients","appointments"]'::jsonb)
ON CONFLICT (ma) DO NOTHING;

-- 4) Gán vai trò Quản Trị Viên cho mọi tài khoản admin chưa có vai trò ------
-- (các tài khoản cũ trước đây vốn full quyền nên gán admin là hợp lý).
UPDATE admins
SET "vaiTroId" = (SELECT id FROM vai_tro WHERE ma = 'admin')
WHERE "vaiTroId" IS NULL;

COMMIT;
