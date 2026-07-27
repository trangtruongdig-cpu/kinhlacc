-- Cột id_tu_dien trên huyet_vi = ID huyệt trong bộ Từ Điển 1059 (frontend acupoints.js / window.ACUPOINTS).
-- Dùng để LINK sang trang Từ Điển (route tu-dien ?acu=<id>) cho các huyệt KHÔNG có toạ độ trên đồ hình 3D
-- (kỳ huyệt / nhĩ châm / điểm đau). An toàn chạy lại nhiều lần.
ALTER TABLE huyet_vi ADD COLUMN IF NOT EXISTS id_tu_dien integer;
