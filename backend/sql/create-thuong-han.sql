-- Thương Hàn Tạp Luận Bệnh — bảng lớp lý thuyết (bóc lớp) + 6 kinh (Lục Kinh biện chứng).
-- LƯU Ý: backend TỰ tạo bảng này và nạp seed idempotent khi khởi động
-- (ThuongHanService.onApplicationBootstrap, giống SchemaBootstrapService) — file này chỉ
-- để LƯU VẾT/áp tay nếu cần. An toàn chạy lại (toàn IF NOT EXISTS, không phá huỷ).

CREATE TABLE IF NOT EXISTS thuong_han_lop (
  id          SERIAL PRIMARY KEY,
  slug        VARCHAR(40) UNIQUE NOT NULL,
  thu_tu      INTEGER NOT NULL DEFAULT 0,
  ten         VARCHAR(120) NOT NULL,
  ten_han     VARCHAR(40),
  tom_tat     TEXT,
  khai_niem   TEXT,
  vi_du       TEXT,
  vi_sao      TEXT,
  lien_he_app TEXT,
  du_lieu     JSONB
);

CREATE TABLE IF NOT EXISTS thuong_han_luc_kinh (
  id             SERIAL PRIMARY KEY,
  slug           VARCHAR(40) UNIQUE NOT NULL,
  thu_tu         INTEGER NOT NULL DEFAULT 0,
  ten            VARCHAR(60) NOT NULL,
  ten_han        VARCHAR(20),
  nhom           VARCHAR(10) NOT NULL DEFAULT 'duong',
  deg            INTEGER NOT NULL DEFAULT 0,
  ban_khi        VARCHAR(40),
  ban_khi_han    VARCHAR(20),
  hanh           VARCHAR(10),
  tong_hoa       VARCHAR(20),
  tong_hoa_note  TEXT,
  khai_hap_xu    VARCHAR(10),
  trung_kien     VARCHAR(80),
  tang_phu_dich  VARCHAR(80),
  tang_phu_han   VARCHAR(40),
  tang_phu_type  VARCHAR(10),
  tang_phu_sub   TEXT,
  trieu_chung    TEXT,
  tri_phap       VARCHAR(120),
  truyen_bien    TEXT,
  bai_thuoc_refs JSONB
);
