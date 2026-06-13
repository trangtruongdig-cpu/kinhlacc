-- Thêm các cột bổ sung cho vi_thuoc từ nguồn CPMCP + dedup variants.
-- Chạy thủ công sau khi backup DB.

-- Tên khoa học Latin (ví dụ: "Radix Paeoniae Alba")
ALTER TABLE vi_thuoc ADD COLUMN IF NOT EXISTS ten_khoa_hoc VARCHAR(400);

-- Tên Hán (tiếng Trung, dùng để map với CPMCP: ví dụ "白芍")
ALTER TABLE vi_thuoc ADD COLUMN IF NOT EXISTS ten_han VARCHAR(150);

-- Phiên âm Pinyin (ví dụ: "Baishao") — dùng để đối chiếu / tìm kiếm
ALTER TABLE vi_thuoc ADD COLUMN IF NOT EXISTS ten_pinyin VARCHAR(150);

-- Bộ phận dùng (ví dụ: "rễ", "vỏ thân", "hạt", "toàn cây")
ALTER TABLE vi_thuoc ADD COLUMN IF NOT EXISTS bo_phan_dung VARCHAR(255);

-- Nhóm dược lý chuẩn CPMCP tiếng Anh (ví dụ: "Blood-Tonifying Medicinal")
-- Để sau dùng đối chiếu với hệ nhóm lớn/nhỏ hiện có
ALTER TABLE vi_thuoc ADD COLUMN IF NOT EXISTS nhom_cpmcp VARCHAR(255);

-- Vị thuốc gốc: nếu đây là biến thể chế biến (Cam Thảo Chích → gốc = Cam Thảo)
-- NULL = đây là vị thuốc gốc, NOT NULL = đây là biến thể
ALTER TABLE vi_thuoc ADD COLUMN IF NOT EXISTS vi_thuoc_goc_id INTEGER
  REFERENCES vi_thuoc(id) ON DELETE SET NULL;

-- Dạng bào chế (ví dụ: "Chích", "Sao", "Thán", "Bào", "Chế", "Sống")
-- Chỉ điền khi vi_thuoc_goc_id != NULL
ALTER TABLE vi_thuoc ADD COLUMN IF NOT EXISTS dang_bao_che VARCHAR(100);

-- Index để query variant nhanh
CREATE INDEX IF NOT EXISTS idx_vi_thuoc_goc_id ON vi_thuoc(vi_thuoc_goc_id);
CREATE INDEX IF NOT EXISTS idx_vi_thuoc_ten_han ON vi_thuoc(ten_han);
