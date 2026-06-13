-- =============================================================================
-- M:N giữa vị thuốc và kinh mạch (quy kinh)
-- =============================================================================
-- Cột text `vi_thuoc.quy_kinh` được giữ lại như cache hiển thị (đồng bộ từ pivot
-- khi DTO gửi `kinh_mach_ids`). Nguồn dữ liệu chính là bảng pivot bên dưới.
-- =============================================================================

CREATE TABLE IF NOT EXISTS vi_thuoc_kinh_mach (
  id_vi_thuoc  INTEGER NOT NULL REFERENCES vi_thuoc(id)            ON DELETE CASCADE,
  id_kinh_mach INTEGER NOT NULL REFERENCES kinh_mach(id_kinh_mach) ON DELETE CASCADE,
  PRIMARY KEY (id_vi_thuoc, id_kinh_mach)
);

CREATE INDEX IF NOT EXISTS idx_vi_thuoc_kinh_mach_km
  ON vi_thuoc_kinh_mach(id_kinh_mach);
