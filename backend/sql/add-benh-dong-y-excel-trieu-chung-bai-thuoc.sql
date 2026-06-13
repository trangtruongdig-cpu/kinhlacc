-- Liên kết M2M giữa Bệnh YHCT (benh_dong_y_excel) ↔ Triệu chứng / Bài thuốc
-- Mỗi bệnh có thể có nhiều triệu chứng và nhiều bài thuốc liên kết trực tiếp,
-- độc lập với liên kết qua phap_tri.

CREATE TABLE IF NOT EXISTS benh_dong_y_excel_trieu_chung (
  id_benh_dong_y_excel INTEGER NOT NULL,
  id_trieu_chung INTEGER NOT NULL,
  PRIMARY KEY (id_benh_dong_y_excel, id_trieu_chung),
  CONSTRAINT fk_bdyexcel_tc_benh
    FOREIGN KEY (id_benh_dong_y_excel) REFERENCES benh_dong_y_excel(id) ON DELETE CASCADE,
  CONSTRAINT fk_bdyexcel_tc_trieu_chung
    FOREIGN KEY (id_trieu_chung) REFERENCES trieu_chung(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_bdyexcel_tc_benh
  ON benh_dong_y_excel_trieu_chung(id_benh_dong_y_excel);
CREATE INDEX IF NOT EXISTS idx_bdyexcel_tc_trieu_chung
  ON benh_dong_y_excel_trieu_chung(id_trieu_chung);

CREATE TABLE IF NOT EXISTS benh_dong_y_excel_bai_thuoc (
  id_benh_dong_y_excel INTEGER NOT NULL,
  id_bai_thuoc INTEGER NOT NULL,
  PRIMARY KEY (id_benh_dong_y_excel, id_bai_thuoc),
  CONSTRAINT fk_bdyexcel_bt_benh
    FOREIGN KEY (id_benh_dong_y_excel) REFERENCES benh_dong_y_excel(id) ON DELETE CASCADE,
  CONSTRAINT fk_bdyexcel_bt_bai_thuoc
    FOREIGN KEY (id_bai_thuoc) REFERENCES bai_thuoc(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_bdyexcel_bt_benh
  ON benh_dong_y_excel_bai_thuoc(id_benh_dong_y_excel);
CREATE INDEX IF NOT EXISTS idx_bdyexcel_bt_bai_thuoc
  ON benh_dong_y_excel_bai_thuoc(id_bai_thuoc);
