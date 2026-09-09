-- ============================================================
-- PERFORMANCE INDEXES - Kinhlacc
-- Chạy 1 lần trên production DB để tăng tốc query.
-- Dùng CREATE INDEX CONCURRENTLY để không lock bảng khi tạo.
-- ============================================================

-- ---- examinations (bảng lớn nhất, ~9.5k rows) ----
-- Tìm ca khám theo bệnh nhân (patient detail page)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exam_patient_id
  ON examinations(patient_id);

-- Sắp xếp / lọc ca khám theo ngày (dashboard / tìm kiếm)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exam_created_at
  ON examinations(created_at DESC);

-- ---- patients ----
-- Tìm bệnh nhân theo tên (full-text-like, case-insensitive prefix)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patient_name_lower
  ON patients(lower(name));

-- Soft-delete: bỏ bệnh nhân đã xoá khỏi list chính
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patient_deleted_at
  ON patients(deleted_at)
  WHERE deleted_at IS NULL;

-- ---- benh_dong_y_excel (bảng luật chẩn đoán) ----
-- Lookup theo code (rule engine, GET /benh-dong-y-excel/:code)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_benh_dy_excel_code
  ON benh_dong_y_excel(code);

-- ---- benh_dong_y_excel_phap_tri (bảng nối M:M) ----
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bdye_pt_benh
  ON benh_dong_y_excel_phap_tri(id_benh_dong_y_excel);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bdye_pt_phap
  ON benh_dong_y_excel_phap_tri(id_phap_tri);

-- ---- benh_dong_y_excel_trieu_chung (bảng nối M:M) ----
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bdye_tc_benh
  ON benh_dong_y_excel_trieu_chung(id_benh_dong_y_excel);

-- ---- meridian_measurements ----
-- Đã tạo 2 index trong add-meridian-measurements.sql,
-- thêm compound index cho query "measurement gần đây nhất của examination"
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_meridian_exam_measured
  ON meridian_measurements(examination_id, measured_at DESC);

-- ---- patient_audit_log ----
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_patient_id
  ON patient_audit_log(patient_id, changed_at DESC);

-- ---- vi_thuoc (dược liệu) ----
-- Tìm theo tên (search bar)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vi_thuoc_name_lower
  ON vi_thuoc(lower(name));

-- ============================================================
-- Kiểm tra kết quả:
--   SELECT indexname, tablename FROM pg_indexes
--   WHERE schemaname = 'public'
--   ORDER BY tablename, indexname;
-- ============================================================
