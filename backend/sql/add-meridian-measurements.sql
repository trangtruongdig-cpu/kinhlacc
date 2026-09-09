-- Bảng lưu kết quả đo 24 kinh lạc (12 kinh x 2 tay/chân = 12 cặp trái/phải)
-- Thực tế hệ thống đang dùng 24 trường tên kinh lạc lưu trong JSONB inputData trên bảng examinations.
-- Migration này TẠO bảng meridian_measurements để tổ chức dữ liệu rõ ràng hơn
-- (có thể dùng song song với inputData, không xóa inputData cũ để backward compatible).
-- 12 kinh lạc: tieutruong, tam, tamtieu, tambao, daitrang, phe, bangquang, than, dam, vi, can, ty

CREATE TABLE IF NOT EXISTS meridian_measurements (
  id SERIAL PRIMARY KEY,
  examination_id INT NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,

  -- 12 kinh lạc, mỗi kinh có giá trị tay trái + tay phải (đơn vị: mV hoặc đơn vị đo thực tế)
  tieutruong_trai  INT,   -- Tiểu Trường (trái)
  tieutruong_phai  INT,   -- Tiểu Trường (phải)
  tam_trai         INT,   -- Tâm (trái)
  tam_phai         INT,   -- Tâm (phải)
  tamtieu_trai     INT,   -- Tam Tiêu (trái)
  tamtieu_phai     INT,   -- Tam Tiêu (phải)
  tambao_trai      INT,   -- Tâm Bào (trái)
  tambao_phai      INT,   -- Tâm Bào (phải)
  daitrang_trai    INT,   -- Đại Trường (trái)
  daitrang_phai    INT,   -- Đại Trường (phải)
  phe_trai         INT,   -- Phế (trái)
  phe_phai         INT,   -- Phế (phải)
  bangquang_trai   INT,   -- Bàng Quang (trái)
  bangquang_phai   INT,   -- Bàng Quang (phải)
  than_trai        INT,   -- Thận (trái)
  than_phai        INT,   -- Thận (phải)
  dam_trai         INT,   -- Đảm (trái)
  dam_phai         INT,   -- Đảm (phải)
  vi_trai          INT,   -- Vị (trái)
  vi_phai          INT,   -- Vị (phải)
  can_trai         INT,   -- Can (trái)
  can_phai         INT,   -- Can (phải)
  ty_trai          INT,   -- Tỳ (trái)
  ty_phai          INT,   -- Tỳ (phải)

  -- Metadata
  measured_by_admin_id INT REFERENCES admins(id) ON DELETE SET NULL,
  measured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(examination_id)
);

CREATE INDEX IF NOT EXISTS idx_meridian_meas_examination_id ON meridian_measurements(examination_id);
CREATE INDEX IF NOT EXISTS idx_meridian_meas_measured_at    ON meridian_measurements(measured_at DESC);

-- Backfill: copy dữ liệu từ inputData JSONB sang bảng mới (chạy 1 lần sau khi CREATE TABLE)
-- Chỉ copy các ca đo đã có dữ liệu đầy đủ (inputData không null)
INSERT INTO meridian_measurements (
  examination_id,
  tieutruong_trai, tieutruong_phai,
  tam_trai,        tam_phai,
  tamtieu_trai,    tamtieu_phai,
  tambao_trai,     tambao_phai,
  daitrang_trai,   daitrang_phai,
  phe_trai,        phe_phai,
  bangquang_trai,  bangquang_phai,
  than_trai,       than_phai,
  dam_trai,        dam_phai,
  vi_trai,         vi_phai,
  can_trai,        can_phai,
  ty_trai,         ty_phai,
  measured_at,
  created_at,
  updated_at
)
SELECT
  id,
  (inputData->>'tieutruongtrai')::INT,
  (inputData->>'tieutruongphai')::INT,
  (inputData->>'tamtrai')::INT,
  (inputData->>'tamphai')::INT,
  (inputData->>'tamtieutrai')::INT,
  (inputData->>'tamtieuphai')::INT,
  (inputData->>'tambaotrai')::INT,
  (inputData->>'tambaophai')::INT,
  (inputData->>'daitrangtrai')::INT,
  (inputData->>'daitrangphai')::INT,
  (inputData->>'phetrai')::INT,
  (inputData->>'phephai')::INT,
  (inputData->>'bangquangtrai')::INT,
  (inputData->>'bangquangphai')::INT,
  (inputData->>'thantrai')::INT,
  (inputData->>'thanphai')::INT,
  (inputData->>'damtrai')::INT,
  (inputData->>'damphai')::INT,
  (inputData->>'vitrai')::INT,
  (inputData->>'viphai')::INT,
  (inputData->>'cantrai')::INT,
  (inputData->>'canphai')::INT,
  (inputData->>'tytrai')::INT,
  (inputData->>'typhai')::INT,
  COALESCE("createdAt", CURRENT_TIMESTAMP),
  COALESCE("createdAt", CURRENT_TIMESTAMP),
  COALESCE("updatedAt", CURRENT_TIMESTAMP)
FROM examinations
WHERE inputData IS NOT NULL
  AND inputData != '{}'::jsonb
ON CONFLICT (examination_id) DO NOTHING;

COMMENT ON TABLE meridian_measurements IS '24 giá trị đo kinh lạc (12 kinh x trái/phải). Backfill từ inputData JSONB trên bảng examinations. Dữ liệu gốc trong inputData được giữ nguyên (backward compatible).';
