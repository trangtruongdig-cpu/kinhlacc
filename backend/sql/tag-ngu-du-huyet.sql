-- ═══════════════════════════════════════════════════════════════════════════
-- TAG NGŨ DU HUYỆT (五輸穴) trong bảng huyet_vi
-- Đánh dấu cột loai_huyet cho 60 huyệt Ngũ Du (5 huyệt × 12 kinh) theo vai trò
-- Tỉnh/Huỳnh/Du/Kinh/Hợp + hành, để quản lý & lọc trong "Quản Lý Huyệt Vị".
-- Nguồn: "Phương pháp luận Ngũ Hành Hồi Tác" (Nguyễn Trọng Hùng, 1989), tr.16, 40–56.
--
-- AN TOÀN: khớp theo TÊN huyệt (unique trong cơ thể); KHÔNG phá loai_huyet cũ
--   (chỉ set khi trống, hoặc nối thêm bằng " · " nếu chưa có "Ngũ Du"). Idempotent.
--
-- CÁCH DÙNG:
--   1) Chạy phần A (kiểm tra) trước để xem huyệt nào có/chưa có + loai_huyet hiện tại.
--   2) Chạy phần B (UPDATE).
--   3) Chạy phần C (đối soát) — nếu còn huyệt "chưa khớp", báo lại để bổ sung INSERT
--      (thường do sai chính tả dấu, vd "Ủy trung" vs "Uỷ trung").
-- ═══════════════════════════════════════════════════════════════════════════

-- ── A. KIỂM TRA COVERAGE (đọc, không sửa) ─────────────────────────────────
--   Bỏ chú thích 2 dòng dưới để chạy trước khi UPDATE:
-- SELECT ten_huyet, ma_huyet, loai_huyet
--   FROM huyet_vi WHERE lower(trim(ten_huyet)) IN (SELECT lower(ten) FROM ngu_du_src) ORDER BY ten_huyet;

-- ── B. UPDATE ─────────────────────────────────────────────────────────────
WITH ngu_du_src(ten, ngu_du) AS (VALUES
  -- 6 ÂM kinh (tạng): Tỉnh Mộc · Huỳnh Hoả · Du Thổ · Kinh Kim · Hợp Thuỷ
  ('Đại đôn',      'Ngũ Du · Tỉnh Mộc'),  ('Hành gian',    'Ngũ Du · Huỳnh Hoả'), ('Thái xung',     'Ngũ Du · Du Thổ'),  ('Trung phong',  'Ngũ Du · Kinh Kim'), ('Khúc tuyền',    'Ngũ Du · Hợp Thuỷ'),
  ('Thiếu xung',   'Ngũ Du · Tỉnh Mộc'),  ('Thiếu phủ',    'Ngũ Du · Huỳnh Hoả'), ('Thần môn',      'Ngũ Du · Du Thổ'),  ('Linh đạo',     'Ngũ Du · Kinh Kim'), ('Thiếu hải',     'Ngũ Du · Hợp Thuỷ'),
  ('Trung xung',   'Ngũ Du · Tỉnh Mộc'),  ('Lao cung',     'Ngũ Du · Huỳnh Hoả'), ('Đại lăng',      'Ngũ Du · Du Thổ'),  ('Gian sử',      'Ngũ Du · Kinh Kim'), ('Khúc trạch',    'Ngũ Du · Hợp Thuỷ'),
  ('Ẩn bạch',      'Ngũ Du · Tỉnh Mộc'),  ('Đại đô',       'Ngũ Du · Huỳnh Hoả'), ('Thái bạch',     'Ngũ Du · Du Thổ'),  ('Thương khâu',  'Ngũ Du · Kinh Kim'), ('Âm lăng tuyền', 'Ngũ Du · Hợp Thuỷ'),
  ('Thiếu thương', 'Ngũ Du · Tỉnh Mộc'),  ('Ngư tế',       'Ngũ Du · Huỳnh Hoả'), ('Thái uyên',     'Ngũ Du · Du Thổ'),  ('Kinh cừ',      'Ngũ Du · Kinh Kim'), ('Xích trạch',    'Ngũ Du · Hợp Thuỷ'),
  ('Dũng tuyền',   'Ngũ Du · Tỉnh Mộc'),  ('Nhiên cốc',    'Ngũ Du · Huỳnh Hoả'), ('Thái khê',      'Ngũ Du · Du Thổ'),  ('Phục lưu',     'Ngũ Du · Kinh Kim'), ('Âm cốc',        'Ngũ Du · Hợp Thuỷ'),
  -- 6 DƯƠNG kinh (phủ): Tỉnh Kim · Huỳnh Thuỷ · Du Mộc · Kinh Hoả · Hợp Thổ
  ('Túc khiếu âm', 'Ngũ Du · Tỉnh Kim'),  ('Hiệp khê',     'Ngũ Du · Huỳnh Thuỷ'), ('Túc lâm khấp', 'Ngũ Du · Du Mộc'),  ('Dương phụ',    'Ngũ Du · Kinh Hoả'), ('Dương lăng tuyền', 'Ngũ Du · Hợp Thổ'),
  ('Thiếu trạch',  'Ngũ Du · Tỉnh Kim'),  ('Tiền cốc',     'Ngũ Du · Huỳnh Thuỷ'), ('Hậu khê',      'Ngũ Du · Du Mộc'),  ('Dương cốc',    'Ngũ Du · Kinh Hoả'), ('Tiểu hải',      'Ngũ Du · Hợp Thổ'),
  ('Quan xung',    'Ngũ Du · Tỉnh Kim'),  ('Dịch môn',     'Ngũ Du · Huỳnh Thuỷ'), ('Trung chử',    'Ngũ Du · Du Mộc'),  ('Chi câu',      'Ngũ Du · Kinh Hoả'), ('Thiên tỉnh',    'Ngũ Du · Hợp Thổ'),
  ('Lệ đoài',      'Ngũ Du · Tỉnh Kim'),  ('Nội đình',     'Ngũ Du · Huỳnh Thuỷ'), ('Hãm cốc',      'Ngũ Du · Du Mộc'),  ('Giải khê',     'Ngũ Du · Kinh Hoả'), ('Túc tam lý',    'Ngũ Du · Hợp Thổ'),
  ('Thương dương', 'Ngũ Du · Tỉnh Kim'),  ('Nhị gian',     'Ngũ Du · Huỳnh Thuỷ'), ('Tam gian',     'Ngũ Du · Du Mộc'),  ('Dương khê',    'Ngũ Du · Kinh Hoả'), ('Khúc trì',      'Ngũ Du · Hợp Thổ'),
  ('Chí âm',       'Ngũ Du · Tỉnh Kim'),  ('Thông cốc',    'Ngũ Du · Huỳnh Thuỷ'), ('Thúc cốt',     'Ngũ Du · Du Mộc'),  ('Côn lôn',      'Ngũ Du · Kinh Hoả'), ('Ủy trung',      'Ngũ Du · Hợp Thổ')
)
UPDATE huyet_vi h
SET loai_huyet = CASE
  WHEN COALESCE(h.loai_huyet, '') = '' THEN s.ngu_du
  WHEN h.loai_huyet ILIKE '%Ngũ Du%'  THEN h.loai_huyet
  ELSE h.loai_huyet || ' · ' || s.ngu_du
END
FROM ngu_du_src s
WHERE lower(trim(h.ten_huyet)) = lower(trim(s.ten));

-- ── C. ĐỐI SOÁT: liệt kê huyệt trong danh sách 60 mà CHƯA khớp (nếu có) ────
--   Bỏ chú thích để chạy sau UPDATE:
-- WITH ngu_du_names(ten) AS (VALUES
--   ('Đại đôn'),('Hành gian'),('Thái xung'),('Trung phong'),('Khúc tuyền'),
--   ('Thiếu xung'),('Thiếu phủ'),('Thần môn'),('Linh đạo'),('Thiếu hải'),
--   ('Trung xung'),('Lao cung'),('Đại lăng'),('Gian sử'),('Khúc trạch'),
--   ('Ẩn bạch'),('Đại đô'),('Thái bạch'),('Thương khâu'),('Âm lăng tuyền'),
--   ('Thiếu thương'),('Ngư tế'),('Thái uyên'),('Kinh cừ'),('Xích trạch'),
--   ('Dũng tuyền'),('Nhiên cốc'),('Thái khê'),('Phục lưu'),('Âm cốc'),
--   ('Túc khiếu âm'),('Hiệp khê'),('Túc lâm khấp'),('Dương phụ'),('Dương lăng tuyền'),
--   ('Thiếu trạch'),('Tiền cốc'),('Hậu khê'),('Dương cốc'),('Tiểu hải'),
--   ('Quan xung'),('Dịch môn'),('Trung chử'),('Chi câu'),('Thiên tỉnh'),
--   ('Lệ đoài'),('Nội đình'),('Hãm cốc'),('Giải khê'),('Túc tam lý'),
--   ('Thương dương'),('Nhị gian'),('Tam gian'),('Dương khê'),('Khúc trì'),
--   ('Chí âm'),('Thông cốc'),('Thúc cốt'),('Côn lôn'),('Ủy trung'))
-- SELECT n.ten AS "huyệt CHƯA có trong huyet_vi"
--   FROM ngu_du_names n
--   LEFT JOIN huyet_vi h ON lower(trim(h.ten_huyet)) = lower(trim(n.ten))
--   WHERE h.idHuyet IS NULL ORDER BY n.ten;
