-- Bảng chẩn đoán lưỡi (vọng thiệt)
CREATE TABLE IF NOT EXISTS chan_doan_luoi (
  id               SERIAL PRIMARY KEY,
  id_benh_nhan     INTEGER REFERENCES patients(id) ON DELETE SET NULL,
  ngay_kham        TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Chất lưỡi
  mau_chat         VARCHAR(50),         -- Nhạt / Hồng / Đỏ / Đỏ sẫm / Tím xanh
  hinh_dang        TEXT,                -- comma-sep: Phì đại, Răng cưa, Nứt nẻ, Teo nhỏ, Cứng, Lệch
  do_am            VARCHAR(50),         -- Ướt / Nhuận / Khô

  -- Rêu lưỡi
  mau_reu          VARCHAR(50),         -- Trắng / Vàng / Xám / Đen / Không rêu
  tinh_chat_reu    TEXT,                -- comma-sep: Mỏng, Dày, Nhờn/Dính, Khô, Bong tróc
  phan_bo_reu      TEXT,                -- comma-sep: Toàn bộ, Đầu lưỡi, Chân lưỡi, Hai bên, Giữa

  -- Vùng lưỡi bất thường (đánh dấu trên sơ đồ)
  vung_bat_thuong  TEXT,                -- comma-sep: dau, trai, giua, phai, chan

  -- Kết quả tự động + ghi chú thủ công
  ket_qua_dong_y   TEXT,
  ghi_chu          TEXT,

  created_by       INTEGER,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cdl_benh_nhan ON chan_doan_luoi(id_benh_nhan);
CREATE INDEX IF NOT EXISTS idx_cdl_ngay_kham ON chan_doan_luoi(ngay_kham DESC);

CREATE OR REPLACE FUNCTION trg_cdl_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_chan_doan_luoi_updated_at ON chan_doan_luoi;
CREATE TRIGGER trg_chan_doan_luoi_updated_at
  BEFORE UPDATE ON chan_doan_luoi
  FOR EACH ROW EXECUTE FUNCTION trg_cdl_updated_at();
