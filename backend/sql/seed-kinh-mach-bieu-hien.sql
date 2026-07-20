-- Seed nội dung "biểu hiện khi tắc nghẽn/rối loạn" cho 12 chính kinh.
-- Nội dung soạn theo lý luận kinh lạc học Đông Y (Trung Y Chẩn Đoán Học) — DO AI SOẠN, CẦN
-- ĐƯỢC RÀ SOÁT CHUYÊN MÔN trước khi coi là nội dung chính thức (theo đúng Quy Trình Biên Tập
-- ở /quy-trinh-bien-tap). Chạy sau add-kinh-mach-bieu-hien.sql (hoặc sau khi backend đã tự
-- thêm cột qua SchemaBootstrapService). Khớp theo ky_hieu_quoc_te (ổn định hơn id).

UPDATE kinh_mach SET bieu_hien_tac_nghen = 'Tức ngực, khó thở, ho, dễ cảm mạo, tự ra mồ hôi, da khô, đau vai và mặt trong cánh tay dọc đường kinh.' WHERE ky_hieu_quoc_te = 'LU';
UPDATE kinh_mach SET bieu_hien_tac_nghen = 'Đau vai gáy, đau răng, chảy máu cam, đau họng, táo bón hoặc tiêu chảy, nổi mụn nhọt vùng mặt.' WHERE ky_hieu_quoc_te = 'LI';
UPDATE kinh_mach SET bieu_hien_tac_nghen = 'Đau vùng thượng vị, đầy hơi, ợ chua, chán ăn hoặc ăn nhiều mau đói, đau răng hàm trên, đau mặt trước chân dọc đường kinh.' WHERE ky_hieu_quoc_te = 'ST';
UPDATE kinh_mach SET bieu_hien_tac_nghen = 'Cơ thể nặng nề, khớp sưng đau, béo bệu, nhiều ẩm, mồ hôi, đầy hơi, tiêu hoá kém.' WHERE ky_hieu_quoc_te = 'SP';
UPDATE kinh_mach SET bieu_hien_tac_nghen = 'Hồi hộp, mất ngủ, hay quên, đau tức ngực, lòng bàn tay nóng, đau mặt trong cánh tay tới ngón út.' WHERE ky_hieu_quoc_te = 'HT';
UPDATE kinh_mach SET bieu_hien_tac_nghen = 'Đau vai gáy lan xuống mặt ngoài cánh tay, ù tai, đau hàm, tiêu hoá kém (phân lẫn nước).' WHERE ky_hieu_quoc_te = 'SI';
UPDATE kinh_mach SET bieu_hien_tac_nghen = 'Đau lưng, cứng gáy, đau đầu vùng đỉnh/chẩm, đau dọc sống lưng xuống mặt sau chân, tiểu tiện bất thường.' WHERE ky_hieu_quoc_te = 'BL';
UPDATE kinh_mach SET bieu_hien_tac_nghen = 'Đau mỏi lưng gối, ù tai, tóc bạc sớm/rụng tóc, sợ lạnh chân tay, tiểu đêm nhiều.' WHERE ky_hieu_quoc_te = 'KI';
UPDATE kinh_mach SET bieu_hien_tac_nghen = 'Hồi hộp, ngực đầy tức, dễ lo âu, mất ngủ, đau mặt trong cánh tay tới ngón giữa.' WHERE ky_hieu_quoc_te = 'PC';
UPDATE kinh_mach SET bieu_hien_tac_nghen = 'Ù tai, đau vùng thái dương và mắt ngoài, đau vai và mặt ngoài cánh tay, rối loạn chuyển hoá nước (phù nề).' WHERE ky_hieu_quoc_te = 'TE';
UPDATE kinh_mach SET bieu_hien_tac_nghen = 'Đau đầu hai bên thái dương, đắng miệng, đau tức hạ sườn, dễ cáu gắt, đau dọc thân mình bên ngoài xuống chân.' WHERE ky_hieu_quoc_te = 'GB';
UPDATE kinh_mach SET bieu_hien_tac_nghen = 'Uất ức, dễ nổi giận, mệt mỏi, kinh nguyệt không đều, bệnh tuyến vú.' WHERE ky_hieu_quoc_te = 'LR';
