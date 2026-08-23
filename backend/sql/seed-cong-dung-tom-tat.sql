-- ═══════════════════════════════════════════════════════════════════════════
-- SEED CÔNG DỤNG TÓM TẮT (cong_dung_tom_tat) cho vi_thuoc — dùng cho TEM NHÃN + tra nhanh.
-- AN TOÀN & idempotent: chỉ điền vào ô ĐANG TRỐNG (không đè dữ liệu/bản sửa tay).
--   A. Thêm cột (nếu chưa có).
--   B. BACKFILL từ congDungLinks cũ  → không mất công dụng đã có (Cam thảo, Nhân sâm…).
--   C. SEED > 100 vị phổ biến (công năng chủ trị cô đọng).
--   D. Đối soát: đếm số vị đã điền + liệt kê vị phổ biến CHƯA khớp (sai chính tả tên → báo lại).
-- Khớp theo lower(trim(ten_vi_thuoc)); có thêm vài dòng ALIAS cho vị hay gọi nhiều tên.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── A. CỘT (an toàn — SchemaBootstrap cũng tự thêm khi deploy) ──
ALTER TABLE vi_thuoc ADD COLUMN IF NOT EXISTS cong_dung_tom_tat VARCHAR(500);

-- ── B. BACKFILL từ bảng liên kết cong_dung (giữ công dụng đã có) ──
UPDATE vi_thuoc v SET cong_dung_tom_tat = sub.s
FROM (
  SELECT l.id_vi_thuoc, string_agg(c.ten_cong_dung, ', ' ORDER BY c.id) AS s
  FROM vi_thuoc_cong_dung l JOIN cong_dung c ON c.id = l.id_cong_dung
  WHERE COALESCE(c.ten_cong_dung, '') <> ''
  GROUP BY l.id_vi_thuoc
) sub
WHERE v.id = sub.id_vi_thuoc AND COALESCE(v.cong_dung_tom_tat, '') = '';

-- ── C. SEED > 100 vị phổ biến (chỉ điền ô đang trống) ──
UPDATE vi_thuoc v SET cong_dung_tom_tat = s.cd
FROM (VALUES
  -- Bổ khí
  ('Nhân sâm',        'Đại bổ nguyên khí, phục mạch cố thoát, bổ tỳ ích phế, sinh tân an thần'),
  ('Đảng sâm',        'Bổ trung ích khí, kiện tỳ ích phế, dưỡng huyết sinh tân'),
  ('Hoàng kỳ',        'Bổ khí thăng dương, ích vệ cố biểu, lợi thuỷ tiêu thũng, thác độc sinh cơ'),
  ('Bạch truật',      'Kiện tỳ ích khí, táo thấp lợi thuỷ, chỉ hãn, an thai'),
  ('Cam thảo',        'Bổ tỳ ích khí, thanh nhiệt giải độc, nhuận phế chỉ ho, hoãn cấp chỉ thống, điều hoà các vị'),
  ('Chích cam thảo',  'Bổ tỳ hoà trung, ích khí phục mạch, điều hoà các vị'),
  ('Đại táo',         'Bổ trung ích khí, dưỡng huyết an thần, hoà hoãn dược tính'),
  ('Sơn dược',        'Ích khí dưỡng âm, bổ tỳ phế thận, cố tinh chỉ đới'),
  ('Hoài sơn',        'Ích khí dưỡng âm, bổ tỳ phế thận, cố tinh chỉ đới'),
  ('Bạch biển đậu',   'Kiện tỳ hoà trung, hoá thấp tiêu thử'),
  -- Bổ huyết
  ('Thục địa',        'Bổ huyết tư âm, ích tinh điền tuỷ'),
  ('Thục địa hoàng',  'Bổ huyết tư âm, ích tinh điền tuỷ'),
  ('Đương quy',       'Bổ huyết hoạt huyết, điều kinh chỉ thống, nhuận tràng thông tiện'),
  ('Bạch thược',      'Dưỡng huyết liễm âm, nhu can chỉ thống, bình can tiềm dương'),
  ('Xuyên khung',     'Hoạt huyết hành khí, khu phong chỉ thống'),
  ('Hà thủ ô',        'Bổ can thận, ích tinh huyết, cường gân cốt, đen râu tóc'),
  ('A giao',          'Bổ huyết tư âm, nhuận táo, chỉ huyết'),
  ('Long nhãn',       'Bổ ích tâm tỳ, dưỡng huyết an thần'),
  ('Long nhãn nhục',  'Bổ ích tâm tỳ, dưỡng huyết an thần'),
  ('Đan sâm',         'Hoạt huyết khứ ứ, lương huyết tiêu ung, dưỡng huyết an thần'),
  -- Bổ âm
  ('Kỷ tử',           'Tư bổ can thận, ích tinh minh mục'),
  ('Câu kỷ tử',       'Tư bổ can thận, ích tinh minh mục'),
  ('Mạch môn',        'Dưỡng âm nhuận phế, ích vị sinh tân, thanh tâm trừ phiền'),
  ('Thiên môn',       'Dưỡng âm nhuận táo, thanh phế sinh tân'),
  ('Sa sâm',          'Dưỡng âm thanh phế, ích vị sinh tân'),
  ('Ngọc trúc',       'Dưỡng âm nhuận táo, sinh tân chỉ khát'),
  ('Bách hợp',        'Dưỡng âm nhuận phế, thanh tâm an thần'),
  ('Nữ trinh tử',     'Bổ can thận, đen tóc sáng mắt'),
  -- Bổ dương, cường gân cốt
  ('Đỗ trọng',        'Bổ can thận, cường gân cốt, an thai, hạ áp'),
  ('Tục đoạn',        'Bổ can thận, cường gân cốt, chỉ huyết an thai, nối gân xương'),
  ('Ngưu tất',        'Hoạt huyết thông kinh, bổ can thận, cường gân cốt, dẫn huyết hạ hành'),
  ('Nhục thung dung', 'Bổ thận dương, ích tinh huyết, nhuận tràng thông tiện'),
  ('Ba kích',         'Bổ thận dương, cường gân cốt, khu phong trừ thấp'),
  ('Dâm dương hoắc',  'Bổ thận tráng dương, khu phong trừ thấp'),
  ('Cẩu tích',        'Bổ can thận, cường gân cốt, khu phong thấp'),
  ('Phá cố chỉ',      'Bổ thận tráng dương, cố tinh súc niệu, ôn tỳ chỉ tả'),
  ('Ích trí nhân',    'Ôn thận cố tinh súc niệu, ôn tỳ chỉ tả nhiếp diên'),
  -- Cố sáp, an thần
  ('Ngũ vị tử',       'Liễm phế tư thận, sinh tân liễm hãn, sáp tinh chỉ tả, ninh tâm an thần'),
  ('Sơn thù',         'Bổ ích can thận, sáp tinh cố thoát'),
  ('Sơn thù du',      'Bổ ích can thận, sáp tinh cố thoát'),
  ('Kim anh tử',      'Cố tinh sáp niệu, sáp trường chỉ tả'),
  ('Khiếm thực',      'Ích thận cố tinh, kiện tỳ chỉ tả, trừ thấp chỉ đới'),
  ('Liên nhục',       'Bổ tỳ chỉ tả, ích thận cố tinh, dưỡng tâm an thần'),
  ('Liên tử',         'Bổ tỳ chỉ tả, ích thận cố tinh, dưỡng tâm an thần'),
  ('Táo nhân',        'Dưỡng tâm ích can, an thần, liễm hãn'),
  ('Toan táo nhân',   'Dưỡng tâm ích can, an thần, liễm hãn'),
  ('Viễn chí',        'An thần ích trí, khứ đàm khai khiếu, tiêu ung thũng'),
  ('Bá tử nhân',      'Dưỡng tâm an thần, nhuận tràng thông tiện'),
  -- Lợi thuỷ thẩm thấp
  ('Phục linh',       'Lợi thuỷ thẩm thấp, kiện tỳ, ninh tâm an thần'),
  ('Bạch linh',       'Lợi thuỷ thẩm thấp, kiện tỳ, ninh tâm an thần'),
  ('Trạch tả',        'Lợi thuỷ thẩm thấp, tiết nhiệt'),
  ('Ý dĩ',            'Kiện tỳ lợi thấp, trừ tý, thanh nhiệt bài nùng'),
  ('Ý dĩ nhân',       'Kiện tỳ lợi thấp, trừ tý, thanh nhiệt bài nùng'),
  ('Xa tiền tử',      'Thanh nhiệt lợi niệu, thẩm thấp chỉ tả, minh mục, khứ đàm'),
  ('Mộc thông',       'Lợi niệu thông lâm, thông kinh hạ nhũ'),
  ('Kim tiền thảo',   'Lợi thuỷ thông lâm, thanh nhiệt trừ thấp, tan sỏi'),
  ('Nhân trần',       'Thanh nhiệt lợi thấp, lợi mật thoái hoàng (chữa vàng da)'),
  -- Giải biểu
  ('Sài hồ',          'Sơ can giải uất, thăng dương, hoà giải thoái nhiệt'),
  ('Bạc hà',          'Sơ tán phong nhiệt, thanh lợi đầu mục, sơ can hành khí'),
  ('Cát căn',         'Giải cơ thoái nhiệt, sinh tân chỉ khát, thăng dương chỉ tả'),
  ('Kinh giới',       'Khu phong giải biểu, thấu chẩn, chỉ huyết (sao đen)'),
  ('Phòng phong',     'Khu phong giải biểu, thắng thấp chỉ thống, chỉ kinh'),
  ('Khương hoạt',     'Giải biểu tán hàn, khu phong trừ thấp, chỉ thống (thiên chi trên)'),
  ('Độc hoạt',        'Khu phong trừ thấp, tán hàn chỉ thống (thiên chi dưới)'),
  ('Ma hoàng',        'Phát hãn giải biểu, tuyên phế bình suyễn, lợi thuỷ tiêu thũng'),
  ('Quế chi',         'Phát hãn giải cơ, ôn thông kinh mạch, trợ dương hoá khí'),
  ('Tế tân',          'Khu phong tán hàn, thông khiếu, ôn phế hoá ẩm, chỉ thống'),
  ('Sinh khương',     'Phát tán phong hàn, ôn trung chỉ nôn, hoá đàm chỉ ho'),
  ('Tô diệp',         'Giải biểu tán hàn, hành khí hoà vị, an thai'),
  ('Tử tô',           'Giải biểu tán hàn, hành khí hoà vị, an thai'),
  ('Bạch chỉ',        'Giải biểu khu phong, thông khiếu chỉ thống, tiêu thũng bài nùng, táo thấp chỉ đới'),
  ('Cúc hoa',         'Sơ tán phong nhiệt, bình can minh mục, thanh nhiệt giải độc'),
  ('Tang diệp',       'Sơ tán phong nhiệt, thanh phế nhuận táo, bình can minh mục'),
  ('Ngưu bàng tử',    'Sơ tán phong nhiệt, tuyên phế thấu chẩn, giải độc lợi hầu'),
  ('Cát cánh',        'Tuyên phế khứ đàm, lợi hầu, bài nùng'),
  -- Thanh nhiệt
  ('Thạch cao',       'Thanh nhiệt tả hoả, trừ phiền chỉ khát'),
  ('Tri mẫu',         'Thanh nhiệt tả hoả, tư âm nhuận táo'),
  ('Chi tử',          'Tả hoả trừ phiền, thanh nhiệt lợi thấp, lương huyết giải độc'),
  ('Hoàng cầm',       'Thanh nhiệt táo thấp, tả hoả giải độc, chỉ huyết, an thai'),
  ('Hoàng liên',      'Thanh nhiệt táo thấp, tả hoả giải độc'),
  ('Hoàng bá',        'Thanh nhiệt táo thấp, tả hoả giải độc, thoái hư nhiệt'),
  ('Kim ngân hoa',    'Thanh nhiệt giải độc, sơ tán phong nhiệt'),
  ('Liên kiều',       'Thanh nhiệt giải độc, tiêu ung tán kết, sơ tán phong nhiệt'),
  ('Bồ công anh',     'Thanh nhiệt giải độc, tiêu ung tán kết, lợi thấp thông lâm'),
  ('Sinh địa',        'Thanh nhiệt lương huyết, dưỡng âm sinh tân'),
  ('Sinh địa hoàng',  'Thanh nhiệt lương huyết, dưỡng âm sinh tân'),
  ('Huyền sâm',       'Thanh nhiệt lương huyết, tư âm giải độc, tán kết'),
  ('Mẫu đơn bì',      'Thanh nhiệt lương huyết, hoạt huyết khứ ứ'),
  ('Đan bì',          'Thanh nhiệt lương huyết, hoạt huyết khứ ứ'),
  ('Xích thược',      'Thanh nhiệt lương huyết, hoạt huyết tán ứ, chỉ thống'),
  ('Địa cốt bì',      'Lương huyết thoái hư nhiệt, thanh phế giáng hoả'),
  ('Liên tâm',        'Thanh tâm khứ nhiệt, chỉ huyết sáp tinh'),
  -- Tả hạ, lý khí
  ('Đại hoàng',       'Tả hạ công tích, thanh nhiệt tả hoả, lương huyết giải độc, trục ứ thông kinh'),
  ('Chỉ thực',        'Phá khí tiêu tích, hoá đàm trừ bĩ'),
  ('Chỉ xác',         'Lý khí khoan trung, hành trệ tiêu trướng'),
  ('Trần bì',         'Lý khí kiện tỳ, táo thấp hoá đàm'),
  ('Thanh bì',        'Sơ can phá khí, tiêu tích hoá trệ'),
  ('Hương phụ',       'Sơ can lý khí, điều kinh chỉ thống'),
  ('Mộc hương',       'Hành khí chỉ thống, kiện tỳ tiêu thực'),
  ('Sa nhân',         'Hoá thấp hành khí, ôn trung chỉ tả, an thai'),
  ('Hậu phác',        'Hành khí táo thấp, tiêu tích bình suyễn, hoá đàm'),
  -- Hoá đàm, chỉ ho
  ('Bán hạ',          'Táo thấp hoá đàm, giáng nghịch chỉ nôn, tiêu bĩ tán kết'),
  ('Trúc nhự',        'Thanh nhiệt hoá đàm, trừ phiền chỉ nôn'),
  ('Qua lâu',         'Thanh nhiệt hoá đàm, khoan hung tán kết, nhuận táo hoạt tràng'),
  ('Qua lâu nhân',    'Thanh nhiệt hoá đàm, khoan hung tán kết, nhuận táo hoạt tràng'),
  ('Bối mẫu',         'Thanh nhiệt nhuận phế, hoá đàm chỉ ho, tán kết'),
  ('Xuyên bối mẫu',   'Thanh nhiệt nhuận phế, hoá đàm chỉ ho, tán kết'),
  ('Hạnh nhân',       'Chỉ ho bình suyễn, nhuận tràng thông tiện'),
  ('Khổ hạnh nhân',   'Chỉ ho bình suyễn, nhuận tràng thông tiện'),
  ('Tang bạch bì',    'Tả phế bình suyễn, lợi thuỷ tiêu thũng'),
  -- Hoạt huyết
  ('Hồng hoa',        'Hoạt huyết thông kinh, khứ ứ chỉ thống'),
  ('Đào nhân',        'Hoạt huyết khứ ứ, nhuận tràng thông tiện'),
  ('Ích mẫu thảo',    'Hoạt huyết điều kinh, lợi thuỷ tiêu thũng, thanh nhiệt giải độc'),
  ('Tam thất',        'Hoá ứ chỉ huyết, hoạt huyết định thống'),
  ('Nhũ hương',       'Hoạt huyết hành khí, chỉ thống, tiêu thũng sinh cơ'),
  ('Một dược',        'Hoạt huyết chỉ thống, tiêu thũng sinh cơ'),
  ('Diên hồ sách',    'Hoạt huyết hành khí, chỉ thống'),
  ('Uất kim',         'Hoạt huyết chỉ thống, hành khí giải uất, lợi mật thoái hoàng'),
  -- Ôn lý
  ('Phụ tử',          'Hồi dương cứu nghịch, bổ hoả trợ dương, tán hàn chỉ thống'),
  ('Can khương',      'Ôn trung tán hàn, hồi dương thông mạch, ôn phế hoá ẩm'),
  ('Nhục quế',        'Bổ hoả trợ dương, tán hàn chỉ thống, ôn thông kinh mạch'),
  ('Ngô thù du',      'Tán hàn chỉ thống, giáng nghịch chỉ nôn, trợ dương chỉ tả'),
  -- Khu phong thấp, hoá thấp
  ('Thương truật',    'Táo thấp kiện tỳ, khu phong tán hàn, sáng mắt'),
  ('Hoắc hương',      'Hoá thấp, chỉ nôn, giải thử, phát biểu'),
  ('Tần giao',        'Khu phong thấp, thư cân lạc, thanh hư nhiệt, lợi thấp thoái hoàng'),
  ('Tang ký sinh',    'Khu phong thấp, bổ can thận, cường gân cốt, an thai'),
  ('Mộc qua',         'Thư cân hoạt lạc, hoà vị hoá thấp'),
  ('Uy linh tiên',    'Khu phong thấp, thông kinh lạc, chỉ thống'),
  ('Thiên ma',        'Tức phong chỉ kinh, bình can tiềm dương, khu phong thông lạc'),
  ('Câu đằng',        'Tức phong chỉ kinh, thanh nhiệt bình can')
) AS s(ten, cd)
WHERE lower(trim(v.ten_vi_thuoc)) = lower(trim(s.ten))
  AND COALESCE(v.cong_dung_tom_tat, '') = '';

-- ── D. ĐỐI SOÁT ──
-- Số vị đã có công dụng tóm tắt:
--   SELECT count(*) FROM vi_thuoc WHERE COALESCE(cong_dung_tom_tat,'') <> '';
-- Vị phổ biến trong danh sách seed mà CHƯA khớp tên (nếu có → sai chính tả, báo lại để chỉnh):
--   WITH names(ten) AS (VALUES ('Bạch truật'),('Nhân sâm'),('Đương quy'),('Sài hồ'),('Đại hoàng'),('Tam thất'),('Phục linh'))
--   SELECT n.ten FROM names n LEFT JOIN vi_thuoc v ON lower(trim(v.ten_vi_thuoc))=lower(trim(n.ten))
--   WHERE v.id IS NULL;
