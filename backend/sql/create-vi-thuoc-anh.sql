-- Ảnh dược liệu do người dùng UPLOAD + cột ảnh đại diện (avatar thẻ).
-- Idempotent — chạy lại nhiều lần vô hại. (Dev bật DB_SYNCHRONIZE thì TypeORM tự tạo; prod chạy file này.)

ALTER TABLE vi_thuoc ADD COLUMN IF NOT EXISTS anh_dai_dien text;

CREATE TABLE IF NOT EXISTS vi_thuoc_anh (
  id          serial PRIMARY KEY,
  id_vi_thuoc integer NOT NULL REFERENCES vi_thuoc(id) ON DELETE CASCADE,
  url         text NOT NULL,
  giai_doan   varchar(255),
  mo_ta       text,
  thu_tu      integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vi_thuoc_anh_vt ON vi_thuoc_anh (id_vi_thuoc);
