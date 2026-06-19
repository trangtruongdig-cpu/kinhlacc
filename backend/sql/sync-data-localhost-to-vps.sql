-- ĐỒNG BỘ DỮ LIỆU localhost -> VPS (khớp theo TÊN, idempotent). Chạy trên DB của VPS.
-- Sinh tự động; an toàn chạy lại nhiều lần. KHÔNG xoá dữ liệu sẵn có của VPS.
BEGIN;

-- 1) Triệu chứng (tạo nếu thiếu) + phân nhóm (627)
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'sắc đỏ', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='sắc đỏ');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='sắc đỏ' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'sắc mặt xanh xao', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='sắc mặt xanh xao');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='sắc mặt xanh xao' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Ý thức u ám', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Ý thức u ám');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Ý thức u ám' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Chóng mặt', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Chóng mặt');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Chóng mặt' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mệt Mỏi', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mệt Mỏi');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Mệt Mỏi' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mỏi Lưng', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mỏi Lưng');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Mỏi Lưng' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Lưỡi Đỏ', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Lưỡi Đỏ');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Lưỡi Đỏ' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Sốt', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Sốt');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Sốt' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Sợ Lạnh', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Sợ Lạnh');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Sợ Lạnh' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Đau Bụng', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Đau Bụng');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Đau Bụng' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Hồi Hộp', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Hồi Hộp');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Hồi Hộp' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'đau lưng', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='đau lưng');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='đau lưng' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Lưỡi Nhạt', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Lưỡi Nhạt');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Lưỡi Nhạt' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Hôn mê', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Hôn mê');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Hôn mê' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'đau đầu', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='đau đầu');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='đau đầu' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'hoa mắt', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='hoa mắt');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='hoa mắt' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Ho', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Ho');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Ho' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Sốt nhẹ', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Sốt nhẹ');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Sốt nhẹ' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tiểu Đỏ', 'khac' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tiểu Đỏ');
UPDATE trieu_chung SET nhom='khac' WHERE ten_trieu_chung='Tiểu Đỏ' AND (nhom IS NULL OR nhom <> 'khac');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'chán ăn', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='chán ăn');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='chán ăn' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Gò Má Đỏ', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Gò Má Đỏ');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Gò Má Đỏ' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Sốt Cao', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Sốt Cao');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Sốt Cao' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tiểu Nhiều Lần', 'khac' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tiểu Nhiều Lần');
UPDATE trieu_chung SET nhom='khac' WHERE ten_trieu_chung='Tiểu Nhiều Lần' AND (nhom IS NULL OR nhom <> 'khac');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Phân Nát', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Phân Nát');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Phân Nát' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Táo Bón', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Táo Bón');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Táo Bón' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'bứt rứt', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='bứt rứt');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='bứt rứt' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tiểu Gấp', 'khac' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tiểu Gấp');
UPDATE trieu_chung SET nhom='khac' WHERE ten_trieu_chung='Tiểu Gấp' AND (nhom IS NULL OR nhom <> 'khac');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Đau Ngực', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Đau Ngực');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Đau Ngực' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Bụng Đầy Trướng', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Bụng Đầy Trướng');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Bụng Đầy Trướng' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'họng khô', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='họng khô');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='họng khô' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'kinh nguyệt không đều', 'phu-khoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='kinh nguyệt không đều');
UPDATE trieu_chung SET nhom='phu-khoa' WHERE ten_trieu_chung='kinh nguyệt không đều' AND (nhom IS NULL OR nhom <> 'phu-khoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Miệng Khát', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Miệng Khát');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Miệng Khát' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Thở Gấp', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Thở Gấp');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Thở Gấp' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tiểu Ít', 'khac' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tiểu Ít');
UPDATE trieu_chung SET nhom='khac' WHERE ten_trieu_chung='Tiểu Ít' AND (nhom IS NULL OR nhom <> 'khac');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Di tinh', 'phu-khoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Di tinh');
UPDATE trieu_chung SET nhom='phu-khoa' WHERE ten_trieu_chung='Di tinh' AND (nhom IS NULL OR nhom <> 'phu-khoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'kinh nguyệt ít', 'phu-khoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='kinh nguyệt ít');
UPDATE trieu_chung SET nhom='phu-khoa' WHERE ten_trieu_chung='kinh nguyệt ít' AND (nhom IS NULL OR nhom <> 'phu-khoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Khó Tiêu', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Khó Tiêu');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Khó Tiêu' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tiểu Vàng', 'khac' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tiểu Vàng');
UPDATE trieu_chung SET nhom='khac' WHERE ten_trieu_chung='Tiểu Vàng' AND (nhom IS NULL OR nhom <> 'khac');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'buồn nôn', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='buồn nôn');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='buồn nôn' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Ho khan', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Ho khan');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Ho khan' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Ăn Ít', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Ăn Ít');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Ăn Ít' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Da khô', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Da khô');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Da khô' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Rêu Trắng', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Rêu Trắng');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Rêu Trắng' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Đàm Dính', 'khac' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Đàm Dính');
UPDATE trieu_chung SET nhom='khac' WHERE ten_trieu_chung='Đàm Dính' AND (nhom IS NULL OR nhom <> 'khac');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Đau họng', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Đau họng');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Đau họng' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'đầy bụng', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='đầy bụng');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='đầy bụng' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Sắc Mặt Trắng', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Sắc Mặt Trắng');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Sắc Mặt Trắng' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'bụng đầy', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='bụng đầy');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='bụng đầy' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Đau Khớp', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Đau Khớp');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Đau Khớp' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Người Nóng', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Người Nóng');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Người Nóng' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Đau bụng dữ dội', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Đau bụng dữ dội');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Đau bụng dữ dội' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Da vàng', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Da vàng');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Da vàng' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Đạo Hãn', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Đạo Hãn');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Đạo Hãn' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Đau Bụng Âm Ỉ', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Đau Bụng Âm Ỉ');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Đau Bụng Âm Ỉ' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'khát nước', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='khát nước');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='khát nước' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Nghẹt Mũi', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Nghẹt Mũi');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Nghẹt Mũi' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Ớn Lạnh', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Ớn Lạnh');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Ớn Lạnh' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Sa Tử Cung', 'phu-khoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Sa Tử Cung');
UPDATE trieu_chung SET nhom='phu-khoa' WHERE ten_trieu_chung='Sa Tử Cung' AND (nhom IS NULL OR nhom <> 'phu-khoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tự Hãn', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tự Hãn');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Tự Hãn' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Âm Dịch Hao Tổn', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Âm Dịch Hao Tổn');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Âm Dịch Hao Tổn' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Ăn Kém', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Ăn Kém');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Ăn Kém' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'hôi miệng', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='hôi miệng');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='hôi miệng' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'liệt dương', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='liệt dương');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='liệt dương' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Nổi Sẩn Toàn Thân', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Nổi Sẩn Toàn Thân');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Nổi Sẩn Toàn Thân' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Sưng Đỏ Ấn Đau', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Sưng Đỏ Ấn Đau');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Sưng Đỏ Ấn Đau' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Âm Nang Sưng Đau Trĩu Xuống', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Âm Nang Sưng Đau Trĩu Xuống');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Âm Nang Sưng Đau Trĩu Xuống' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Áp Xe Tự Vỡ', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Áp Xe Tự Vỡ');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Áp Xe Tự Vỡ' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Bệnh Càng Nặng', 'khac' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Bệnh Càng Nặng');
UPDATE trieu_chung SET nhom='khac' WHERE ten_trieu_chung='Bệnh Càng Nặng' AND (nhom IS NULL OR nhom <> 'khac');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'chân tay lạnh', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='chân tay lạnh');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='chân tay lạnh' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'đau thượng vị', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='đau thượng vị');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='đau thượng vị' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Đi Cầu Phân Sệt', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Đi Cầu Phân Sệt');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Đi Cầu Phân Sệt' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'đờm vàng', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='đờm vàng');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='đờm vàng' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'gân co rút', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='gân co rút');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='gân co rút' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'hay quên', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='hay quên');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='hay quên' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'hoặc đau bụng kinh', 'phu-khoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='hoặc đau bụng kinh');
UPDATE trieu_chung SET nhom='phu-khoa' WHERE ten_trieu_chung='hoặc đau bụng kinh' AND (nhom IS NULL OR nhom <> 'phu-khoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Họng Đỏ, Sưng Đau, Ngứa Tiết dịch', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Họng Đỏ, Sưng Đau, Ngứa Tiết dịch');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Họng Đỏ, Sưng Đau, Ngứa Tiết dịch' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'khó thở', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='khó thở');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='khó thở' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'lở loét', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='lở loét');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='lở loét' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Phát Nhiệt', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Phát Nhiệt');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Phát Nhiệt' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tay Chân Lạnh', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tay Chân Lạnh');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Tay Chân Lạnh' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'rêu lưỡi trắng', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='rêu lưỡi trắng');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='rêu lưỡi trắng' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Ngơ ngẩn, vô cảm', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Ngơ ngẩn, vô cảm');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Ngơ ngẩn, vô cảm' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Nói năng lảm nhảm', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Nói năng lảm nhảm');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Nói năng lảm nhảm' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tâm thần phân liệt', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tâm thần phân liệt');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Tâm thần phân liệt' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Đột ngột hôn mê', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Đột ngột hôn mê');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Đột ngột hôn mê' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Co giật chân tay', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Co giật chân tay');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Co giật chân tay' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Khó thở, đờm khò khè', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Khó thở, đờm khò khè');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Khó thở, đờm khò khè' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Rêu lưỡi nhờn trắng', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Rêu lưỡi nhờn trắng');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Rêu lưỡi nhờn trắng' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mạch huyền hoạt', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mạch huyền hoạt');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Mạch huyền hoạt' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Sắc mặt ám trệ', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Sắc mặt ám trệ');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Sắc mặt ám trệ' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Cơ thể nặng nề', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Cơ thể nặng nề');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Cơ thể nặng nề' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tính tình nóng nảy', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tính tình nóng nảy');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Tính tình nóng nảy' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tiểu tiện đỏ', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tiểu tiện đỏ');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Tiểu tiện đỏ' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Loét miệng lưỡi', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Loét miệng lưỡi');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Loét miệng lưỡi' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Bồn chồn, dễ cáu gắt', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Bồn chồn, dễ cáu gắt');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Bồn chồn, dễ cáu gắt' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mất ngủ, hay mê sảng', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mất ngủ, hay mê sảng');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Mất ngủ, hay mê sảng' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Nóng nảy, hay quên', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Nóng nảy, hay quên');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Nóng nảy, hay quên' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Đau tức ngực', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Đau tức ngực');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Đau tức ngực' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Buồn nôn, ợ hơi', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Buồn nôn, ợ hơi');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Buồn nôn, ợ hơi' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mặt đỏ, mắt đỏ', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mặt đỏ, mắt đỏ');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Mặt đỏ, mắt đỏ' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Họng khô, đau rát', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Họng khô, đau rát');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Họng khô, đau rát' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mụn nhọt, lở loét', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mụn nhọt, lở loét');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Mụn nhọt, lở loét' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Lưỡi đỏ, rêu vàng khô', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Lưỡi đỏ, rêu vàng khô');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Lưỡi đỏ, rêu vàng khô' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Sốt nhẹ về chiều', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Sốt nhẹ về chiều');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Sốt nhẹ về chiều' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Da nóng', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Da nóng');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Da nóng' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Bồn chồn', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Bồn chồn');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Bồn chồn' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Khô miệng, khát nước', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Khô miệng, khát nước');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Khô miệng, khát nước' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Nóng ran trong người', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Nóng ran trong người');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Nóng ran trong người' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tiểu đêm nhiều lần', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tiểu đêm nhiều lần');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Tiểu đêm nhiều lần' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Đau lưng mỏi gối', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Đau lưng mỏi gối');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Đau lưng mỏi gối' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Khô âm đạo', 'phu-khoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Khô âm đạo');
UPDATE trieu_chung SET nhom='phu-khoa' WHERE ten_trieu_chung='Khô âm đạo' AND (nhom IS NULL OR nhom <> 'phu-khoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Rối loạn tiền mãn kinh', 'phu-khoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Rối loạn tiền mãn kinh');
UPDATE trieu_chung SET nhom='phu-khoa' WHERE ten_trieu_chung='Rối loạn tiền mãn kinh' AND (nhom IS NULL OR nhom <> 'phu-khoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Gầy sút cân', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Gầy sút cân');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Gầy sút cân' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mất ngủ, ngủ không yên', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mất ngủ, ngủ không yên');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Mất ngủ, ngủ không yên' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Lo âu, bồn chồn', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Lo âu, bồn chồn');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Lo âu, bồn chồn' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Nóng bừng mặt', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Nóng bừng mặt');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Nóng bừng mặt' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Khô hạn âm đạo', 'phu-khoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Khô hạn âm đạo');
UPDATE trieu_chung SET nhom='phu-khoa' WHERE ten_trieu_chung='Khô hạn âm đạo' AND (nhom IS NULL OR nhom <> 'phu-khoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Cảm giác nóng trong xương', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Cảm giác nóng trong xương');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Cảm giác nóng trong xương' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Lười nói, ngại vận động', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Lười nói, ngại vận động');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Lười nói, ngại vận động' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'mạch Tế', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='mạch Tế');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='mạch Tế' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Đại tiện lỏng nát', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Đại tiện lỏng nát');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Đại tiện lỏng nát' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Sợ lạnh, thích ấm', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Sợ lạnh, thích ấm');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Sợ lạnh, thích ấm' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'tiểu rắt', 'khac' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='tiểu rắt');
UPDATE trieu_chung SET nhom='khac' WHERE ten_trieu_chung='tiểu rắt' AND (nhom IS NULL OR nhom <> 'khac');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'miệng khô', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='miệng khô');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='miệng khô' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'mất ngủ', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='mất ngủ');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='mất ngủ' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'ù tai', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='ù tai');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='ù tai' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'tức ngực', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='tức ngực');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='tức ngực' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Sườn đau', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Sườn đau');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Sườn đau' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Chi lạnh', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Chi lạnh');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Chi lạnh' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Bụng Chướng', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Bụng Chướng');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Bụng Chướng' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'phiền táo', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='phiền táo');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='phiền táo' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Phù Thũng', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Phù Thũng');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Phù Thũng' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mình hàn', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mình hàn');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Mình hàn' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tiểu buốt', 'khac' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tiểu buốt');
UPDATE trieu_chung SET nhom='khac' WHERE ten_trieu_chung='Tiểu buốt' AND (nhom IS NULL OR nhom <> 'khac');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'mũi tắc', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='mũi tắc');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='mũi tắc' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'sa nội tạng', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='sa nội tạng');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='sa nội tạng' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'mắt đỏ', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='mắt đỏ');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='mắt đỏ' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'tê chân tay', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='tê chân tay');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='tê chân tay' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'bụng chướng', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='bụng chướng');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='bụng chướng' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'đại tiện lỏng', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='đại tiện lỏng');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='đại tiện lỏng' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Chảy Máu Đầu Vú', 'phu-khoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Chảy Máu Đầu Vú');
UPDATE trieu_chung SET nhom='phu-khoa' WHERE ten_trieu_chung='Chảy Máu Đầu Vú' AND (nhom IS NULL OR nhom <> 'phu-khoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Đàm Dãi', 'khac' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Đàm Dãi');
UPDATE trieu_chung SET nhom='khac' WHERE ten_trieu_chung='Đàm Dãi' AND (nhom IS NULL OR nhom <> 'khac');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Da Sắc Đỏ Tím', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Da Sắc Đỏ Tím');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Da Sắc Đỏ Tím' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'đoản hơi', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='đoản hơi');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='đoản hơi' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Da Cơ Sưng Nóng', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Da Cơ Sưng Nóng');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Da Cơ Sưng Nóng' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mạch kết đại', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mạch kết đại');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Mạch kết đại' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'vàng da', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='vàng da');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='vàng da' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Cảm Giác Mót rặn', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Cảm Giác Mót rặn');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Cảm Giác Mót rặn' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Chi Đỏ Sưng Đau', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Chi Đỏ Sưng Đau');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Chi Đỏ Sưng Đau' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Cốt Chưng', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Cốt Chưng');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Cốt Chưng' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Đàm Nhiều', 'khac' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Đàm Nhiều');
UPDATE trieu_chung SET nhom='khac' WHERE ten_trieu_chung='Đàm Nhiều' AND (nhom IS NULL OR nhom <> 'khac');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'uể oải', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='uể oải');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='uể oải' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Bụng Chướng', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Bụng Chướng');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Bụng Chướng' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Đắng Miệng', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Đắng Miệng');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Đắng Miệng' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Khối U Cứng Chắc', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Khối U Cứng Chắc');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Khối U Cứng Chắc' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Kinh Trễ', 'phu-khoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Kinh Trễ');
UPDATE trieu_chung SET nhom='phu-khoa' WHERE ten_trieu_chung='Kinh Trễ' AND (nhom IS NULL OR nhom <> 'phu-khoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'miệng đắng', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='miệng đắng');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='miệng đắng' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'ợ hơi', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='ợ hơi');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='ợ hơi' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Sốc', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Sốc');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Sốc' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Chi Lạnh mà quyết', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Chi Lạnh mà quyết');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Chi Lạnh mà quyết' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Da Nóng, Sưng Đỏ', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Da Nóng, Sưng Đỏ');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Da Nóng, Sưng Đỏ' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Da Phát Ban Đỏ', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Da Phát Ban Đỏ');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Da Phát Ban Đỏ' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Miệng lở', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Miệng lở');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Miệng lở' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'mồ hôi trộm', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='mồ hôi trộm');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='mồ hôi trộm' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'ợ chua', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='ợ chua');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='ợ chua' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Bụng Đầy Trướng Đau', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Bụng Đầy Trướng Đau');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Bụng Đầy Trướng Đau' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Bụng Dưới Ấn Đau', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Bụng Dưới Ấn Đau');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Bụng Dưới Ấn Đau' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Buồn Ngủ', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Buồn Ngủ');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Buồn Ngủ' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Cầu Ra Máu Đỏ Tươi', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Cầu Ra Máu Đỏ Tươi');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Cầu Ra Máu Đỏ Tươi' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Chạm Vào Đau', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Chạm Vào Đau');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Chạm Vào Đau' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Chảy Dãi', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Chảy Dãi');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Chảy Dãi' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Co Rút', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Co Rút');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Co Rút' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Da Đỏ', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Da Đỏ');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Da Đỏ' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Đại Tiện không thành Khuôn', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Đại Tiện không thành Khuôn');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Đại Tiện không thành Khuôn' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Da Lạnh', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Da Lạnh');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Da Lạnh' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Da Nổi Mụn Đỏ', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Da Nổi Mụn Đỏ');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Da Nổi Mụn Đỏ' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Da Nổi Mụn Trắng', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Da Nổi Mụn Trắng');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Da Nổi Mụn Trắng' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Ít Sữa', 'phu-khoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Ít Sữa');
UPDATE trieu_chung SET nhom='phu-khoa' WHERE ten_trieu_chung='Ít Sữa' AND (nhom IS NULL OR nhom <> 'phu-khoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Không Ra Mồ Hôi', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Không Ra Mồ Hôi');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Không Ra Mồ Hôi' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mạch Tế Muốn Tuyệt', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mạch Tế Muốn Tuyệt');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Mạch Tế Muốn Tuyệt' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mặt Mọc Mụn Trứng Cá', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mặt Mọc Mụn Trứng Cá');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Mặt Mọc Mụn Trứng Cá' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'mộng tinh', 'phu-khoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='mộng tinh');
UPDATE trieu_chung SET nhom='phu-khoa' WHERE ten_trieu_chung='mộng tinh' AND (nhom IS NULL OR nhom <> 'phu-khoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Nặng Bụng Dưới', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Nặng Bụng Dưới');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Nặng Bụng Dưới' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'ngạt mũi', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='ngạt mũi');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='ngạt mũi' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Nhiệt Kết hoặc bí Tiểu', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Nhiệt Kết hoặc bí Tiểu');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Nhiệt Kết hoặc bí Tiểu' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'sợ gió', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='sợ gió');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='sợ gió' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'nhịp tim không đều', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='nhịp tim không đều');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='nhịp tim không đều' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Thích chườm ấm', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Thích chườm ấm');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Thích chườm ấm' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Kinh nguyệt ra nhiều', 'phu-khoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Kinh nguyệt ra nhiều');
UPDATE trieu_chung SET nhom='phu-khoa' WHERE ten_trieu_chung='Kinh nguyệt ra nhiều' AND (nhom IS NULL OR nhom <> 'phu-khoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Sắc kinh nhạt loãng', 'phu-khoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Sắc kinh nhạt loãng');
UPDATE trieu_chung SET nhom='phu-khoa' WHERE ten_trieu_chung='Sắc kinh nhạt loãng' AND (nhom IS NULL OR nhom <> 'phu-khoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Lưỡi nhợt bệu', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Lưỡi nhợt bệu');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Lưỡi nhợt bệu' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Rêu lưỡi trắng mỏng', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Rêu lưỡi trắng mỏng');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Rêu lưỡi trắng mỏng' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mạch trầm trì nhược', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mạch trầm trì nhược');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Mạch trầm trì nhược' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Sắc mặt vàng bủng', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Sắc mặt vàng bủng');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Sắc mặt vàng bủng' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Cơ thể gầy yếu', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Cơ thể gầy yếu');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Cơ thể gầy yếu' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Phù nhẹ chi dưới', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Phù nhẹ chi dưới');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Phù nhẹ chi dưới' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tâm thần bất an', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tâm thần bất an');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Tâm thần bất an' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Dễ cáu gắt', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Dễ cáu gắt');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Dễ cáu gắt' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Đầu óc choáng váng', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Đầu óc choáng váng');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Đầu óc choáng váng' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mất ngủ, hay mơ', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mất ngủ, hay mơ');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Mất ngủ, hay mơ' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Miệng đắng, họng khô', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Miệng đắng, họng khô');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Miệng đắng, họng khô' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Đầy bụng, ăn kém', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Đầy bụng, ăn kém');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Đầy bụng, ăn kém' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Hoa mắt chóng mặt', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Hoa mắt chóng mặt');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Hoa mắt chóng mặt' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Hay hồi hộp, đánh trống ngực', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Hay hồi hộp, đánh trống ngực');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Hay hồi hộp, đánh trống ngực' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Lưỡi đỏ, rêu vàng nhờn', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Lưỡi đỏ, rêu vàng nhờn');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Lưỡi đỏ, rêu vàng nhờn' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mạch hoạt sác', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mạch hoạt sác');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Mạch hoạt sác' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Người nặng nề', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Người nặng nề');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Người nặng nề' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Thân nhiệt nóng', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Thân nhiệt nóng');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Thân nhiệt nóng' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Nước tiểu ít', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Nước tiểu ít');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Nước tiểu ít' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Đầu lưỡi đỏ', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Đầu lưỡi đỏ');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Đầu lưỡi đỏ' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mạch hữu lực', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mạch hữu lực');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Mạch hữu lực' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tâm phiền, hồi hộp', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tâm phiền, hồi hộp');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Tâm phiền, hồi hộp' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Khát nước, thích lạnh', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Khát nước, thích lạnh');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Khát nước, thích lạnh' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tiểu buốt, tiểu rắt', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tiểu buốt, tiểu rắt');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Tiểu buốt, tiểu rắt' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Nóng rát niệu đạo', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Nóng rát niệu đạo');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Nóng rát niệu đạo' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Lưỡi đỏ, đầu lưỡi đỏ', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Lưỡi đỏ, đầu lưỡi đỏ');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Lưỡi đỏ, đầu lưỡi đỏ' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Rêu lưỡi vàng mỏng', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Rêu lưỡi vàng mỏng');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Rêu lưỡi vàng mỏng' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mạch sác, mạch huyền', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mạch sác, mạch huyền');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Mạch sác, mạch huyền' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tiểu tiện không tự chủ', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tiểu tiện không tự chủ');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Tiểu tiện không tự chủ' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Rùng mình, sợ lạnh', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Rùng mình, sợ lạnh');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Rùng mình, sợ lạnh' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Ù tai, giảm thính lực', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Ù tai, giảm thính lực');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Ù tai, giảm thính lực' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mờ mắt', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mờ mắt');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Mờ mắt' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Đau nhức xương khớp', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Đau nhức xương khớp');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Đau nhức xương khớp' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Run chân tay', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Run chân tay');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Run chân tay' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Vô sinh, hiếm muộn', 'phu-khoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Vô sinh, hiếm muộn');
UPDATE trieu_chung SET nhom='phu-khoa' WHERE ten_trieu_chung='Vô sinh, hiếm muộn' AND (nhom IS NULL OR nhom <> 'phu-khoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Rối loạn kinh nguyệt', 'phu-khoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Rối loạn kinh nguyệt');
UPDATE trieu_chung SET nhom='phu-khoa' WHERE ten_trieu_chung='Rối loạn kinh nguyệt' AND (nhom IS NULL OR nhom <> 'phu-khoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Lưỡi nhạt, rêu mỏng', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Lưỡi nhạt, rêu mỏng');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Lưỡi nhạt, rêu mỏng' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mạch trầm tế', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mạch trầm tế');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Mạch trầm tế' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Gầy yếu, sút cân', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Gầy yếu, sút cân');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Gầy yếu, sút cân' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Máu Tụ Sưng, Ấn Đau', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Máu Tụ Sưng, Ấn Đau');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Máu Tụ Sưng, Ấn Đau' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Đau Liên Sườn', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Đau Liên Sườn');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Đau Liên Sườn' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Hay Cáu Gắt', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Hay Cáu Gắt');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Hay Cáu Gắt' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Phù Nhiều', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Phù Nhiều');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Phù Nhiều' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Nhọt ở Đầu Mặt Đễ vễ và mưng Mủ', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Nhọt ở Đầu Mặt Đễ vễ và mưng Mủ');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Nhọt ở Đầu Mặt Đễ vễ và mưng Mủ' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Ngứa Ngáy', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Ngứa Ngáy');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Ngứa Ngáy' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Nổi Hạch To', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Nổi Hạch To');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Nổi Hạch To' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mụn Rộp nổi quanh Vùng Eo Lưng', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mụn Rộp nổi quanh Vùng Eo Lưng');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Mụn Rộp nổi quanh Vùng Eo Lưng' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Miệng  Có Mùi Khai', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Miệng  Có Mùi Khai');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Miệng  Có Mùi Khai' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'sườn đau tức', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='sườn đau tức');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='sườn đau tức' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Miệng Lưỡi Lở Loét', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Miệng Lưỡi Lở Loét');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Miệng Lưỡi Lở Loét' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'ăn uống kém', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='ăn uống kém');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='ăn uống kém' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Đau Bụng Thượng Vị Cấp Tính', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Đau Bụng Thượng Vị Cấp Tính');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Đau Bụng Thượng Vị Cấp Tính' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Hàn Nhiệt Vãng Lai', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Hàn Nhiệt Vãng Lai');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Hàn Nhiệt Vãng Lai' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Hư Hàn', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Hư Hàn');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Hư Hàn' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Ho Nhiều', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Ho Nhiều');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Ho Nhiều' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Nứt Nẻ', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Nứt Nẻ');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Nứt Nẻ' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Phát Sốt', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Phát Sốt');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Phát Sốt' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Ngực Sườn Trướng Đau', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Ngực Sườn Trướng Đau');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Ngực Sườn Trướng Đau' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mạch Sác', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mạch Sác');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Mạch Sác' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Hung Phiền', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Hung Phiền');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Hung Phiền' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Đau Sườn', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Đau Sườn');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Đau Sườn' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Phát Ban', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Phát Ban');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Phát Ban' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Rêu Nhờn', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Rêu Nhờn');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Rêu Nhờn' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Kinh Quyết', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Kinh Quyết');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Kinh Quyết' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Lưỡi Tím', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Lưỡi Tím');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Lưỡi Tím' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Hỏa Độc Tích Thịnh', 'khac' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Hỏa Độc Tích Thịnh');
UPDATE trieu_chung SET nhom='khac' WHERE ten_trieu_chung='Hỏa Độc Tích Thịnh' AND (nhom IS NULL OR nhom <> 'khac');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'mạch sác', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='mạch sác');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='mạch sác' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mặt Sắc Trắng', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mặt Sắc Trắng');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Mặt Sắc Trắng' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Sắc Trắng Bệch', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Sắc Trắng Bệch');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Sắc Trắng Bệch' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Lưng Gối Mỏi Yếu', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Lưng Gối Mỏi Yếu');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Lưng Gối Mỏi Yếu' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Nổi Cục', 'khac' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Nổi Cục');
UPDATE trieu_chung SET nhom='khac' WHERE ten_trieu_chung='Nổi Cục' AND (nhom IS NULL OR nhom <> 'khac');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Phù Thũng', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Phù Thũng');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Phù Thũng' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Hành Kinh Da Nổi Sẩn', 'phu-khoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Hành Kinh Da Nổi Sẩn');
UPDATE trieu_chung SET nhom='phu-khoa' WHERE ten_trieu_chung='Hành Kinh Da Nổi Sẩn' AND (nhom IS NULL OR nhom <> 'phu-khoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Họng Khát', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Họng Khát');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Họng Khát' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Môi Khô', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Môi Khô');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Môi Khô' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Nôn Mửa', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Nôn Mửa');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Nôn Mửa' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Sỏi', 'khac' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Sỏi');
UPDATE trieu_chung SET nhom='khac' WHERE ten_trieu_chung='Sỏi' AND (nhom IS NULL OR nhom <> 'khac');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Gối Mềm Yếu', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Gối Mềm Yếu');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Gối Mềm Yếu' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Đầu Mặt Kết Độc', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Đầu Mặt Kết Độc');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Đầu Mặt Kết Độc' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Dịch Đàm Trong Loãng', 'khac' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Dịch Đàm Trong Loãng');
UPDATE trieu_chung SET nhom='khac' WHERE ten_trieu_chung='Dịch Đàm Trong Loãng' AND (nhom IS NULL OR nhom <> 'khac');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Giảm Khứa Giác', 'khac' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Giảm Khứa Giác');
UPDATE trieu_chung SET nhom='khac' WHERE ten_trieu_chung='Giảm Khứa Giác' AND (nhom IS NULL OR nhom <> 'khac');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Hạch sưng Đỏ kết Độc', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Hạch sưng Đỏ kết Độc');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Hạch sưng Đỏ kết Độc' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Hành Kinh Nôn Ra Máu', 'phu-khoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Hành Kinh Nôn Ra Máu');
UPDATE trieu_chung SET nhom='phu-khoa' WHERE ten_trieu_chung='Hành Kinh Nôn Ra Máu' AND (nhom IS NULL OR nhom <> 'phu-khoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Hình Gầy', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Hình Gầy');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Hình Gầy' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Họng Đỏ', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Họng Đỏ');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Họng Đỏ' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Khoang Miệng Lở Loét', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Khoang Miệng Lở Loét');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Khoang Miệng Lở Loét' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Không Di Động', 'khac' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Không Di Động');
UPDATE trieu_chung SET nhom='khac' WHERE ten_trieu_chung='Không Di Động' AND (nhom IS NULL OR nhom <> 'khac');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Lưỡi Bệu', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Lưỡi Bệu');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Lưỡi Bệu' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mặt Đỏ', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mặt Đỏ');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Mặt Đỏ' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mặt Trắng Bệch', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mặt Trắng Bệch');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Mặt Trắng Bệch' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Ngũ Tâm Phiền Nhiệt', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Ngũ Tâm Phiền Nhiệt');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Ngũ Tâm Phiền Nhiệt' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Nhiệt Thịnh', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Nhiệt Thịnh');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Nhiệt Thịnh' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Nổi Ban', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Nổi Ban');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Nổi Ban' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Nổi Bọng Nước Ngứa Ngáy', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Nổi Bọng Nước Ngứa Ngáy');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Nổi Bọng Nước Ngứa Ngáy' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Nước Mũi Đặc', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Nước Mũi Đặc');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Nước Mũi Đặc' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Ra Mồ Hôi', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Ra Mồ Hôi');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Ra Mồ Hôi' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Rêu Lưỡi Vàng', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Rêu Lưỡi Vàng');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Rêu Lưỡi Vàng' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Sắc Lưỡi Không Tươi', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Sắc Lưỡi Không Tươi');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Sắc Lưỡi Không Tươi' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Chi Lạnh,Tê Sưng, Đau Xương', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Chi Lạnh,Tê Sưng, Đau Xương');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Chi Lạnh,Tê Sưng, Đau Xương' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Đau Dạ Dày', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Đau Dạ Dày');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Đau Dạ Dày' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Dịch Mủ Trong Loãng', 'khac' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Dịch Mủ Trong Loãng');
UPDATE trieu_chung SET nhom='khac' WHERE ten_trieu_chung='Dịch Mủ Trong Loãng' AND (nhom IS NULL OR nhom <> 'khac');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Hoạt Tinh', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Hoạt Tinh');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Hoạt Tinh' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Khò Khè', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Khò Khè');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Khò Khè' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Má Sưng Đau', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Má Sưng Đau');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Má Sưng Đau' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Miệng Môi Khô', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Miệng Môi Khô');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Miệng Môi Khô' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Môi Đỏ', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Môi Đỏ');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Môi Đỏ' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Ngủ Ít', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Ngủ Ít');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Ngủ Ít' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Viêm Trên Da, Đỏ Ngứa, Tiết dịch', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Viêm Trên Da, Đỏ Ngứa, Tiết dịch');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Viêm Trên Da, Đỏ Ngứa, Tiết dịch' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'cảm xúc thất thường', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='cảm xúc thất thường');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='cảm xúc thất thường' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Đau Bụng Quanh Rốn', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Đau Bụng Quanh Rốn');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Đau Bụng Quanh Rốn' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Đau Nhức', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Đau Nhức');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Đau Nhức' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Đầy Tức', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Đầy Tức');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Đầy Tức' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Dễ Nổi Nóng', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Dễ Nổi Nóng');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Dễ Nổi Nóng' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Động Tác Múa Vờn Không Thể Tự Chủ', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Động Tác Múa Vờn Không Thể Tự Chủ');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Động Tác Múa Vờn Không Thể Tự Chủ' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Gặp Lạnh bệnh  càng tăng nặng', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Gặp Lạnh bệnh  càng tăng nặng');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Gặp Lạnh bệnh  càng tăng nặng' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Hạ Sốt', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Hạ Sốt');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Hạ Sốt' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Hậu Môn Sa Xuống, Đau', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Hậu Môn Sa Xuống, Đau');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Hậu Môn Sa Xuống, Đau' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Hay thở Dài', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Hay thở Dài');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Hay thở Dài' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Hình Béo', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Hình Béo');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Hình Béo' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Hoặc Bí Tiểu', 'khac' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Hoặc Bí Tiểu');
UPDATE trieu_chung SET nhom='khac' WHERE ten_trieu_chung='Hoặc Bí Tiểu' AND (nhom IS NULL OR nhom <> 'khac');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Ho Dữ Dội Từng Cơn', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Ho Dữ Dội Từng Cơn');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Ho Dữ Dội Từng Cơn' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Ho Ít', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Ho Ít');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Ho Ít' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Ho Từng Cơn', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Ho Từng Cơn');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Ho Từng Cơn' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Ít Rêu', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Ít Rêu');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Ít Rêu' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Khối U', 'khac' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Khối U');
UPDATE trieu_chung SET nhom='khac' WHERE ten_trieu_chung='Khối U' AND (nhom IS NULL OR nhom <> 'khac');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Không ra Mồ Hôi', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Không ra Mồ Hôi');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Không ra Mồ Hôi' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'lo âu', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='lo âu');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='lo âu' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Lúc Nóng Lúc Lạnh', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Lúc Nóng Lúc Lạnh');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Lúc Nóng Lúc Lạnh' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mạch Nhuyễn', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mạch Nhuyễn');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Mạch Nhuyễn' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mạch Sáp', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mạch Sáp');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Mạch Sáp' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mang Tai Sưng Đỏ', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mang Tai Sưng Đỏ');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Mang Tai Sưng Đỏ' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mặt Mọc Đinh Nhọt', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mặt Mọc Đinh Nhọt');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Mặt Mọc Đinh Nhọt' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mặt Nổi Mụn Sẩn', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mặt Nổi Mụn Sẩn');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Mặt Nổi Mụn Sẩn' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Miệng Loét', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Miệng Loét');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Miệng Loét' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mũi Đỏ', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mũi Đỏ');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Mũi Đỏ' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mụn nhọt sưng đau', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mụn nhọt sưng đau');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Mụn nhọt sưng đau' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Nấc', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Nấc');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Nấc' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Ngứa Ngáy', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Ngứa Ngáy');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Ngứa Ngáy' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Nổi Mề Đay Thành Từng Đám', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Nổi Mề Đay Thành Từng Đám');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Nổi Mề Đay Thành Từng Đám' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Nổi U Cục', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Nổi U Cục');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Nổi U Cục' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'nôn mửa', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='nôn mửa');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='nôn mửa' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'phiền khát', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='phiền khát');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='phiền khát' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Phù Mặt Và Tay Chân', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Phù Mặt Và Tay Chân');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Phù Mặt Và Tay Chân' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Rêu Ít', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Rêu Ít');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Rêu Ít' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'sắc mặt vàng', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='sắc mặt vàng');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='sắc mặt vàng' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Sắc Mặt Vàng Vọt', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Sắc Mặt Vàng Vọt');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Sắc Mặt Vàng Vọt' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Sắc Trắng', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Sắc Trắng');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Sắc Trắng' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Sợ Ánh Sáng', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Sợ Ánh Sáng');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Sợ Ánh Sáng' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Thời Kỳ Cai Sữa Vú Căng Đau', 'phu-khoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Thời Kỳ Cai Sữa Vú Căng Đau');
UPDATE trieu_chung SET nhom='phu-khoa' WHERE ten_trieu_chung='Thời Kỳ Cai Sữa Vú Căng Đau' AND (nhom IS NULL OR nhom <> 'phu-khoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'vướng víu ở cổ họng', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='vướng víu ở cổ họng');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='vướng víu ở cổ họng' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Hành Kinh', 'phu-khoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Hành Kinh');
UPDATE trieu_chung SET nhom='phu-khoa' WHERE ten_trieu_chung='Hành Kinh' AND (nhom IS NULL OR nhom <> 'phu-khoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Sốt càng Cao, Bệnh Càng Nặng', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Sốt càng Cao, Bệnh Càng Nặng');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Sốt càng Cao, Bệnh Càng Nặng' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Chảy máu dưới da', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Chảy máu dưới da');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Chảy máu dưới da' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Sưng Đỏ', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Sưng Đỏ');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Sưng Đỏ' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Đại tiện ra máu', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Đại tiện ra máu');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Đại tiện ra máu' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tình Chí Uất Ức', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tình Chí Uất Ức');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Tình Chí Uất Ức' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Triều Nhiệt', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Triều Nhiệt');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Triều Nhiệt' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tiểu Máu', 'khac' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tiểu Máu');
UPDATE trieu_chung SET nhom='khac' WHERE ten_trieu_chung='Tiểu Máu' AND (nhom IS NULL OR nhom <> 'khac');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tâm Phiền', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tâm Phiền');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Tâm Phiền' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Ngực Sườn Đầy Tức', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Ngực Sườn Đầy Tức');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Ngực Sườn Đầy Tức' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Sưng Đau', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Sưng Đau');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Sưng Đau' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Vô Lực', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Vô Lực');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Vô Lực' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Sợ Nóng', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Sợ Nóng');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Sợ Nóng' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tứ Chi Lạnh', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tứ Chi Lạnh');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Tứ Chi Lạnh' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'U Cục', 'khac' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='U Cục');
UPDATE trieu_chung SET nhom='khac' WHERE ten_trieu_chung='U Cục' AND (nhom IS NULL OR nhom <> 'khac');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'U Cục Ở Vú', 'phu-khoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='U Cục Ở Vú');
UPDATE trieu_chung SET nhom='phu-khoa' WHERE ten_trieu_chung='U Cục Ở Vú' AND (nhom IS NULL OR nhom <> 'phu-khoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Thích Uống', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Thích Uống');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Thích Uống' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tứ Chi Quyết Lạnh', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tứ Chi Quyết Lạnh');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Tứ Chi Quyết Lạnh' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'choáng váng', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='choáng váng');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='choáng váng' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tiểu nhiều', 'khac' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tiểu nhiều');
UPDATE trieu_chung SET nhom='khac' WHERE ten_trieu_chung='Tiểu nhiều' AND (nhom IS NULL OR nhom <> 'khac');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Vú Sưng Đau', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Vú Sưng Đau');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Vú Sưng Đau' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Choáng váng', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Choáng váng');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Choáng váng' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Sưng Đỏ Đau', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Sưng Đỏ Đau');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Sưng Đỏ Đau' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tê Tay Chân', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tê Tay Chân');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Tê Tay Chân' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'thích xoa bóp', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='thích xoa bóp');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='thích xoa bóp' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tiểu Máu Lâu Ngày', 'khac' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tiểu Máu Lâu Ngày');
UPDATE trieu_chung SET nhom='khac' WHERE ten_trieu_chung='Tiểu Máu Lâu Ngày' AND (nhom IS NULL OR nhom <> 'khac');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tiểu trong dài', 'khac' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tiểu trong dài');
UPDATE trieu_chung SET nhom='khac' WHERE ten_trieu_chung='Tiểu trong dài' AND (nhom IS NULL OR nhom <> 'khac');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'bụng đói thì đau nhiều', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='bụng đói thì đau nhiều');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='bụng đói thì đau nhiều' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mắt Vàng', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mắt Vàng');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Mắt Vàng' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tiểu Máu Đại Thể', 'khac' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tiểu Máu Đại Thể');
UPDATE trieu_chung SET nhom='khac' WHERE ten_trieu_chung='Tiểu Máu Đại Thể' AND (nhom IS NULL OR nhom <> 'khac');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tiểu Mủ', 'khac' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tiểu Mủ');
UPDATE trieu_chung SET nhom='khac' WHERE ten_trieu_chung='Tiểu Mủ' AND (nhom IS NULL OR nhom <> 'khac');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tiểu Nhỏ Giọt', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tiểu Nhỏ Giọt');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Tiểu Nhỏ Giọt' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tinh Hoàn Kết Cứng', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tinh Hoàn Kết Cứng');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Tinh Hoàn Kết Cứng' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Xuất Tinh Sớm', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Xuất Tinh Sớm');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Xuất Tinh Sớm' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Xương Cột Sống Đau Mỏi', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Xương Cột Sống Đau Mỏi');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Xương Cột Sống Đau Mỏi' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Bụng sôi lục ục', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Bụng sôi lục ục');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Bụng sôi lục ục' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'chảy máu mũi', 'khac' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='chảy máu mũi');
UPDATE trieu_chung SET nhom='khac' WHERE ten_trieu_chung='chảy máu mũi' AND (nhom IS NULL OR nhom <> 'khac');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Da mắt hơi vàng', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Da mắt hơi vàng');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Da mắt hơi vàng' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Hoả Thăng', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Hoả Thăng');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Hoả Thăng' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Phù Ấn Lõm', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Phù Ấn Lõm');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Phù Ấn Lõm' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Phù Chân', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Phù Chân');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Phù Chân' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Phụ Nữ Có Thai', 'phu-khoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Phụ Nữ Có Thai');
UPDATE trieu_chung SET nhom='phu-khoa' WHERE ten_trieu_chung='Phụ Nữ Có Thai' AND (nhom IS NULL OR nhom <> 'phu-khoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Quai Hàm Sưng Đau', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Quai Hàm Sưng Đau');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Quai Hàm Sưng Đau' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Sưng Đau, Không Chịu Nổi', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Sưng Đau, Không Chịu Nổi');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Sưng Đau, Không Chịu Nổi' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Thời Kỳ Cuối Có Tiểu Máu', 'khac' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Thời Kỳ Cuối Có Tiểu Máu');
UPDATE trieu_chung SET nhom='khac' WHERE ten_trieu_chung='Thời Kỳ Cuối Có Tiểu Máu' AND (nhom IS NULL OR nhom <> 'khac');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tia Tiểu Yếu', 'khac' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tia Tiểu Yếu');
UPDATE trieu_chung SET nhom='khac' WHERE ten_trieu_chung='Tia Tiểu Yếu' AND (nhom IS NULL OR nhom <> 'khac');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tiêu hóa kém', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tiêu hóa kém');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Tiêu hóa kém' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tiểu Không Thông', 'khac' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tiểu Không Thông');
UPDATE trieu_chung SET nhom='khac' WHERE ten_trieu_chung='Tiểu Không Thông' AND (nhom IS NULL OR nhom <> 'khac');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tiểu Máu Kéo Dài', 'khac' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tiểu Máu Kéo Dài');
UPDATE trieu_chung SET nhom='khac' WHERE ten_trieu_chung='Tiểu Máu Kéo Dài' AND (nhom IS NULL OR nhom <> 'khac');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tiêu Nhầy Máu Mủ', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tiêu Nhầy Máu Mủ');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Tiêu Nhầy Máu Mủ' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tiểu Nhiều', 'khac' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tiểu Nhiều');
UPDATE trieu_chung SET nhom='khac' WHERE ten_trieu_chung='Tiểu Nhiều' AND (nhom IS NULL OR nhom <> 'khac');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tiểu Ra Dưỡng Chấp', 'khac' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tiểu Ra Dưỡng Chấp');
UPDATE trieu_chung SET nhom='khac' WHERE ten_trieu_chung='Tiểu Ra Dưỡng Chấp' AND (nhom IS NULL OR nhom <> 'khac');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'tiểu trong', 'khac' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='tiểu trong');
UPDATE trieu_chung SET nhom='khac' WHERE ten_trieu_chung='tiểu trong' AND (nhom IS NULL OR nhom <> 'khac');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tinh Hoàn Sưng Đỏ', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tinh Hoàn Sưng Đỏ');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Tinh Hoàn Sưng Đỏ' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tóc Khô', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tóc Khô');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Tóc Khô' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Trơn Nhẵn, Di Động', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Trơn Nhẵn, Di Động');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Trơn Nhẵn, Di Động' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Trướng Đau', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Trướng Đau');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Trướng Đau' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Vết Thương Lở Loét Lâu Ngày, Không Liều Miệng', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Vết Thương Lở Loét Lâu Ngày, Không Liều Miệng');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Vết Thương Lở Loét Lâu Ngày, Không Liều Miệng' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Viêm Họng Tái Phát', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Viêm Họng Tái Phát');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Viêm Họng Tái Phát' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Vị Hàn', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Vị Hàn');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Vị Hàn' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Vùng Mũi Mọc Nhọt Độc', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Vùng Mũi Mọc Nhọt Độc');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Vùng Mũi Mọc Nhọt Độc' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Xét Nghiệm Phân Dương Tính', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Xét Nghiệm Phân Dương Tính');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Xét Nghiệm Phân Dương Tính' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Xuất Tinh Ra Máu', 'khac' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Xuất Tinh Ra Máu');
UPDATE trieu_chung SET nhom='khac' WHERE ten_trieu_chung='Xuất Tinh Ra Máu' AND (nhom IS NULL OR nhom <> 'khac');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Yếu Sinh Lý', 'khac' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Yếu Sinh Lý');
UPDATE trieu_chung SET nhom='khac' WHERE ten_trieu_chung='Yếu Sinh Lý' AND (nhom IS NULL OR nhom <> 'khac');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Đánh trống ngực', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Đánh trống ngực');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Đánh trống ngực' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tiểu tiện ra máu', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tiểu tiện ra máu');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Tiểu tiện ra máu' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Rong kinh', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Rong kinh');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Rong kinh' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Băng huyết', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Băng huyết');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Băng huyết' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Máu kinh nhạt màu', 'phu-khoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Máu kinh nhạt màu');
UPDATE trieu_chung SET nhom='phu-khoa' WHERE ten_trieu_chung='Máu kinh nhạt màu' AND (nhom IS NULL OR nhom <> 'phu-khoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Lưỡi nhạt rêu trắng', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Lưỡi nhạt rêu trắng');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Lưỡi nhạt rêu trắng' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mạch hư nhược', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mạch hư nhược');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Mạch hư nhược' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Cơ thể mệt mỏi', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Cơ thể mệt mỏi');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Cơ thể mệt mỏi' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Hay hồi hộp', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Hay hồi hộp');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Hay hồi hộp' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Dễ hoảng sợ', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Dễ hoảng sợ');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Dễ hoảng sợ' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Bụng lạnh đầy', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Bụng lạnh đầy');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Bụng lạnh đầy' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Ngực đau nhói', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Ngực đau nhói');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Ngực đau nhói' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Lưỡi nhạt bệu', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Lưỡi nhạt bệu');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Lưỡi nhạt bệu' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mạch tế sác', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mạch tế sác');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Mạch tế sác' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Cơ thể suy nhược', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Cơ thể suy nhược');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Cơ thể suy nhược' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Kinh nguyệt loãng nhạt', 'phu-khoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Kinh nguyệt loãng nhạt');
UPDATE trieu_chung SET nhom='phu-khoa' WHERE ten_trieu_chung='Kinh nguyệt loãng nhạt' AND (nhom IS NULL OR nhom <> 'phu-khoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Rêu lưỡi trắng dày', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Rêu lưỡi trắng dày');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Rêu lưỡi trắng dày' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Sôi bụng', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Sôi bụng');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Sôi bụng' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Kinh nguyệt lượng nhiều', 'phu-khoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Kinh nguyệt lượng nhiều');
UPDATE trieu_chung SET nhom='phu-khoa' WHERE ten_trieu_chung='Kinh nguyệt lượng nhiều' AND (nhom IS NULL OR nhom <> 'phu-khoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Kinh nguyệt màu nhạt', 'phu-khoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Kinh nguyệt màu nhạt');
UPDATE trieu_chung SET nhom='phu-khoa' WHERE ten_trieu_chung='Kinh nguyệt màu nhạt' AND (nhom IS NULL OR nhom <> 'phu-khoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Sắc mặt vàng úa', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Sắc mặt vàng úa');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Sắc mặt vàng úa' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Hay quên, mất tập trung', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Hay quên, mất tập trung');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Hay quên, mất tập trung' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Dễ xúc động, hay khóc', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Dễ xúc động, hay khóc');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Dễ xúc động, hay khóc' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Lo âu, bất an', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Lo âu, bất an');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Lo âu, bất an' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Đau đầu âm ỉ', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Đau đầu âm ỉ');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Đau đầu âm ỉ' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Kinh ít, màu nhạt', 'phu-khoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Kinh ít, màu nhạt');
UPDATE trieu_chung SET nhom='phu-khoa' WHERE ten_trieu_chung='Kinh ít, màu nhạt' AND (nhom IS NULL OR nhom <> 'phu-khoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Lưỡi nhạt, rêu mỏng trắng', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Lưỡi nhạt, rêu mỏng trắng');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Lưỡi nhạt, rêu mỏng trắng' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Da xanh xao', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Da xanh xao');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Da xanh xao' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Môi khô, nhợt nhạt', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Môi khô, nhợt nhạt');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Môi khô, nhợt nhạt' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Sụt cân', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Sụt cân');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Sụt cân' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tinh thần mệt mỏi', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tinh thần mệt mỏi');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Tinh thần mệt mỏi' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Hàn Nhiệt', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Hàn Nhiệt');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Hàn Nhiệt' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Sắc Nhạt', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Sắc Nhạt');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Sắc Nhạt' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Cuồng thao vọng động', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Cuồng thao vọng động');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Cuồng thao vọng động' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Khí Hư Ra Nhiều, Có Mùi Hôi', 'phu-khoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Khí Hư Ra Nhiều, Có Mùi Hôi');
UPDATE trieu_chung SET nhom='phu-khoa' WHERE ten_trieu_chung='Khí Hư Ra Nhiều, Có Mùi Hôi' AND (nhom IS NULL OR nhom <> 'phu-khoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Dạ dầy trướng đau', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Dạ dầy trướng đau');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Dạ dầy trướng đau' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Ngứa Ngáy Âm Hộ', 'phu-khoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Ngứa Ngáy Âm Hộ');
UPDATE trieu_chung SET nhom='phu-khoa' WHERE ten_trieu_chung='Ngứa Ngáy Âm Hộ' AND (nhom IS NULL OR nhom <> 'phu-khoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'thấp nhiệt', 'khac' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='thấp nhiệt');
UPDATE trieu_chung SET nhom='khac' WHERE ten_trieu_chung='thấp nhiệt' AND (nhom IS NULL OR nhom <> 'khac');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'đái dầm', 'khac' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='đái dầm');
UPDATE trieu_chung SET nhom='khac' WHERE ten_trieu_chung='đái dầm' AND (nhom IS NULL OR nhom <> 'khac');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tích thủy', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tích thủy');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Tích thủy' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'đau nhói', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='đau nhói');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='đau nhói' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Khí Hư Nhiều', 'phu-khoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Khí Hư Nhiều');
UPDATE trieu_chung SET nhom='phu-khoa' WHERE ten_trieu_chung='Khí Hư Nhiều' AND (nhom IS NULL OR nhom <> 'phu-khoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'ngực bị đau thắt', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='ngực bị đau thắt');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='ngực bị đau thắt' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Đầy bụng sau ăn', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Đầy bụng sau ăn');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Đầy bụng sau ăn' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Ho kéo dài', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Ho kéo dài');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Ho kéo dài' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tiếng ho yếu', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tiếng ho yếu');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Tiếng ho yếu' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Khó thở khi vận động', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Khó thở khi vận động');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Khó thở khi vận động' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Dễ cảm mạo', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Dễ cảm mạo');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Dễ cảm mạo' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tự hãn (đổ mồ hôi trộm)', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tự hãn (đổ mồ hôi trộm)');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Tự hãn (đổ mồ hôi trộm)' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Sắc mặt trắng bệch', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Sắc mặt trắng bệch');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Sắc mặt trắng bệch' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tiếng nói nhỏ yếu', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tiếng nói nhỏ yếu');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Tiếng nói nhỏ yếu' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Hồi hộp, lo âu', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Hồi hộp, lo âu');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Hồi hộp, lo âu' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Hay quên, mất ngủ', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Hay quên, mất ngủ');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Hay quên, mất ngủ' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Dễ hoảng hốt', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Dễ hoảng hốt');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Dễ hoảng hốt' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Miệng khô, khát nước', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Miệng khô, khát nước');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Miệng khô, khát nước' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Đầu choáng, tai ù', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Đầu choáng, tai ù');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Đầu choáng, tai ù' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Lòng bàn tay chân nóng', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Lòng bàn tay chân nóng');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Lòng bàn tay chân nóng' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Lưỡi đỏ ít rêu', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Lưỡi đỏ ít rêu');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Lưỡi đỏ ít rêu' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Người gầy, sắc mặt kém', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Người gầy, sắc mặt kém');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Người gầy, sắc mặt kém' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Phân có nhầy máu', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Phân có nhầy máu');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Phân có nhầy máu' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Hậu môn nóng rát', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Hậu môn nóng rát');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Hậu môn nóng rát' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mót rặn', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mót rặn');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Mót rặn' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Bụng đau quặn', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Bụng đau quặn');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Bụng đau quặn' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tiểu tiện vàng', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tiểu tiện vàng');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Tiểu tiện vàng' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mạch nhu sác', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mạch nhu sác');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Mạch nhu sác' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Khó chịu', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Khó chịu');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Khó chịu' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tiểu tiện vàng đỏ', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tiểu tiện vàng đỏ');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Tiểu tiện vàng đỏ' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Sắc mặt kém tươi', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Sắc mặt kém tươi');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Sắc mặt kém tươi' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tinh thần uể oải', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tinh thần uể oải');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Tinh thần uể oải' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Thiếu hụt ý chí', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Thiếu hụt ý chí');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Thiếu hụt ý chí' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tiêu chảy lúc sáng sớm', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tiêu chảy lúc sáng sớm');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Tiêu chảy lúc sáng sớm' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Sợ lạnh, tay chân lạnh', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Sợ lạnh, tay chân lạnh');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Sợ lạnh, tay chân lạnh' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Khí hư loãng lạnh', 'phu-khoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Khí hư loãng lạnh');
UPDATE trieu_chung SET nhom='phu-khoa' WHERE ten_trieu_chung='Khí hư loãng lạnh' AND (nhom IS NULL OR nhom <> 'phu-khoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Rêu lưỡi trắng trơn', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Rêu lưỡi trắng trơn');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Rêu lưỡi trắng trơn' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mạch trầm trì vô lực', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mạch trầm trì vô lực');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Mạch trầm trì vô lực' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Phù thũng chi dưới', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Phù thũng chi dưới');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Phù thũng chi dưới' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'lưng gối mỏi đau', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='lưng gối mỏi đau');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='lưng gối mỏi đau' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Bụng Dưới Trướng Đau', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Bụng Dưới Trướng Đau');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Bụng Dưới Trướng Đau' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'không nói được', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='không nói được');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='không nói được' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'lưng gối', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='lưng gối');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='lưng gối' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'lưng gối mỏi đau (nhão mềm)', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='lưng gối mỏi đau (nhão mềm)');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='lưng gối mỏi đau (nhão mềm)' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Sắc Tím', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Sắc Tím');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Sắc Tím' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'lạnh', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='lạnh');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='lạnh' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'mồ hôi trộm (đạo hãn)', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='mồ hôi trộm (đạo hãn)');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='mồ hôi trộm (đạo hãn)' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mình hàn (sợ lạnh)', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mình hàn (sợ lạnh)');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Mình hàn (sợ lạnh)' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'ngại nói', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='ngại nói');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='ngại nói' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Cự Án', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Cự Án');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Cự Án' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'ỉa có chất nhầy máu mủ', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='ỉa có chất nhầy máu mủ');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='ỉa có chất nhầy máu mủ' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'khát', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='khát');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='khát' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'lỏng', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='lỏng');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='lỏng' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'lười vận động', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='lười vận động');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='lười vận động' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'phù nề', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='phù nề');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='phù nề' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Chất lưỡi bệu nhợt', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Chất lưỡi bệu nhợt');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Chất lưỡi bệu nhợt' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mạch trầm vi tế', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mạch trầm vi tế');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Mạch trầm vi tế' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'rêu lưỡi trắng nhuận', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='rêu lưỡi trắng nhuận');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='rêu lưỡi trắng nhuận' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'tự ra mồ hôi lạnh', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='tự ra mồ hôi lạnh');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='tự ra mồ hôi lạnh' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tinh thần uất ức', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tinh thần uất ức');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Tinh thần uất ức' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Hay lo âu', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Hay lo âu');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Hay lo âu' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Đầy bụng khó tiêu', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Đầy bụng khó tiêu');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Đầy bụng khó tiêu' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Đau bụng đi ngoài', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Đau bụng đi ngoài');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Đau bụng đi ngoài' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tức ngực sườn', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tức ngực sườn');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Tức ngực sườn' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Đau đầu chóng mặt', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Đau đầu chóng mặt');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Đau đầu chóng mặt' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Căng thẳng thần kinh', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Căng thẳng thần kinh');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Căng thẳng thần kinh' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Đau bụng kinh', 'phu-khoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Đau bụng kinh');
UPDATE trieu_chung SET nhom='phu-khoa' WHERE ten_trieu_chung='Đau bụng kinh' AND (nhom IS NULL OR nhom <> 'phu-khoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Căng tức vú', 'phu-khoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Căng tức vú');
UPDATE trieu_chung SET nhom='phu-khoa' WHERE ten_trieu_chung='Căng tức vú' AND (nhom IS NULL OR nhom <> 'phu-khoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Lưỡi đỏ nhạt', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Lưỡi đỏ nhạt');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Lưỡi đỏ nhạt' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Rêu lưỡi mỏng trắng', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Rêu lưỡi mỏng trắng');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Rêu lưỡi mỏng trắng' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mạch huyền', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mạch huyền');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Mạch huyền' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mệt mỏi toàn thân', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mệt mỏi toàn thân');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Mệt mỏi toàn thân' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Sắc mặt sạm', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Sắc mặt sạm');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Sắc mặt sạm' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Hồi hộp trống ngực', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Hồi hộp trống ngực');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Hồi hộp trống ngực' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Dễ giật mình', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Dễ giật mình');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Dễ giật mình' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Uể oải tinh thần', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Uể oải tinh thần');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Uể oải tinh thần' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Đầy bụng chậm tiêu', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Đầy bụng chậm tiêu');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Đầy bụng chậm tiêu' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mệt mỏi chân tay', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mệt mỏi chân tay');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Mệt mỏi chân tay' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Chóng mặt ù tai', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Chóng mặt ù tai');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Chóng mặt ù tai' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tiêu chảy', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tiêu chảy');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Tiêu chảy' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Lưỡi nhợt', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Lưỡi nhợt');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Lưỡi nhợt' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mạch vi tế', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mạch vi tế');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Mạch vi tế' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mặt nhợt nhạt', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mặt nhợt nhạt');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Mặt nhợt nhạt' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tự đổ mồ hôi', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tự đổ mồ hôi');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Tự đổ mồ hôi' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Dễ cáu giận', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Dễ cáu giận');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Dễ cáu giận' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Hay buồn bực', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Hay buồn bực');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Hay buồn bực' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Khó chịu trong lòng', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Khó chịu trong lòng');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Khó chịu trong lòng' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Trầm cảm nhẹ', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Trầm cảm nhẹ');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Trầm cảm nhẹ' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Đầy bụng, chướng hơi', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Đầy bụng, chướng hơi');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Đầy bụng, chướng hơi' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Ăn uống kém ngon', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Ăn uống kém ngon');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Ăn uống kém ngon' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Ợ hơi, ợ chua', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Ợ hơi, ợ chua');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Ợ hơi, ợ chua' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Đau bụng lâm râm', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Đau bụng lâm râm');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Đau bụng lâm râm' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Rối loạn tiêu hóa', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Rối loạn tiêu hóa');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Rối loạn tiêu hóa' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Đau tức ngực sườn', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Đau tức ngực sườn');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Đau tức ngực sườn' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Đau vùng thượng vị', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Đau vùng thượng vị');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Đau vùng thượng vị' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Căng cơ', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Căng cơ');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Căng cơ' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Khó chịu trước kỳ kinh', 'phu-khoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Khó chịu trước kỳ kinh');
UPDATE trieu_chung SET nhom='phu-khoa' WHERE ten_trieu_chung='Khó chịu trước kỳ kinh' AND (nhom IS NULL OR nhom <> 'phu-khoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Ngực căng tức trước kỳ kinh', 'phu-khoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Ngực căng tức trước kỳ kinh');
UPDATE trieu_chung SET nhom='phu-khoa' WHERE ten_trieu_chung='Ngực căng tức trước kỳ kinh' AND (nhom IS NULL OR nhom <> 'phu-khoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Lưỡi có thể bình thường hoặc hơi đỏ', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Lưỡi có thể bình thường hoặc hơi đỏ');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Lưỡi có thể bình thường hoặc hơi đỏ' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Sắc mặt có thể không tươi', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Sắc mặt có thể không tươi');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Sắc mặt có thể không tươi' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Khó chịu toàn thân', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Khó chịu toàn thân');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Khó chịu toàn thân' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'tim đập dồn dập', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='tim đập dồn dập');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='tim đập dồn dập' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Nôn Ra Nước Chua', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Nôn Ra Nước Chua');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Nôn Ra Nước Chua' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tứ Chi Nặng Mỏi', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tứ Chi Nặng Mỏi');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Tứ Chi Nặng Mỏi' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'trống ngực', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='trống ngực');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='trống ngực' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'sợ hãi', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='sợ hãi');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='sợ hãi' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Khí Hư (Phụ Nữ)', 'phu-khoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Khí Hư (Phụ Nữ)');
UPDATE trieu_chung SET nhom='phu-khoa' WHERE ten_trieu_chung='Khí Hư (Phụ Nữ)' AND (nhom IS NULL OR nhom <> 'phu-khoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Nói Nhảm', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Nói Nhảm');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Nói Nhảm' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'nước tiểu đỏ', 'khac' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='nước tiểu đỏ');
UPDATE trieu_chung SET nhom='khac' WHERE ten_trieu_chung='nước tiểu đỏ' AND (nhom IS NULL OR nhom <> 'khac');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Bế Kinh', 'phu-khoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Bế Kinh');
UPDATE trieu_chung SET nhom='phu-khoa' WHERE ten_trieu_chung='Bế Kinh' AND (nhom IS NULL OR nhom <> 'phu-khoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'tiếng nói trầm', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='tiếng nói trầm');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='tiếng nói trầm' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Kỳ Kinh Rối Loạn Lượng Nhiều', 'phu-khoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Kỳ Kinh Rối Loạn Lượng Nhiều');
UPDATE trieu_chung SET nhom='phu-khoa' WHERE ten_trieu_chung='Kỳ Kinh Rối Loạn Lượng Nhiều' AND (nhom IS NULL OR nhom <> 'phu-khoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'ợ chua hoặc sôi bụng', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='ợ chua hoặc sôi bụng');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='ợ chua hoặc sôi bụng' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'răng lợi lung lay', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='răng lợi lung lay');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='răng lợi lung lay' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'run rẩy', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='run rẩy');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='run rẩy' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Sắc mặt ảm đạm', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Sắc mặt ảm đạm');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Sắc mặt ảm đạm' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'suyễn', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='suyễn');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='suyễn' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Bất An', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Bất An');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Bất An' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Động Thai', 'phu-khoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Động Thai');
UPDATE trieu_chung SET nhom='phu-khoa' WHERE ten_trieu_chung='Động Thai' AND (nhom IS NULL OR nhom <> 'phu-khoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'phân nát hoặc ỉa lổng kéo dài', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='phân nát hoặc ỉa lổng kéo dài');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='phân nát hoặc ỉa lổng kéo dài' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'phong hàn thấp tà lấn vào', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='phong hàn thấp tà lấn vào');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='phong hàn thấp tà lấn vào' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Suy Nhược', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Suy Nhược');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Suy Nhược' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'thở ngắn hơi', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='thở ngắn hơi');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='thở ngắn hơi' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Bứt rứt khó ngủ', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Bứt rứt khó ngủ');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Bứt rứt khó ngủ' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Hay nằm mơ', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Hay nằm mơ');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Hay nằm mơ' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Rêu lưỡi vàng dày', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Rêu lưỡi vàng dày');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Rêu lưỡi vàng dày' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mạch huyền sác', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mạch huyền sác');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Mạch huyền sác' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Sắc mặt đỏ', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Sắc mặt đỏ');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Sắc mặt đỏ' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Người nóng bứt rứt', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Người nóng bứt rứt');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Người nóng bứt rứt' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Khó tập trung', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Khó tập trung');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Khó tập trung' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'U uất, buồn rầu', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='U uất, buồn rầu');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='U uất, buồn rầu' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Hay mê sảng', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Hay mê sảng');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Hay mê sảng' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mỏi mệt toàn thân', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mỏi mệt toàn thân');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Mỏi mệt toàn thân' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Ra mồ hôi trộm', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Ra mồ hôi trộm');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Ra mồ hôi trộm' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Khó có thai', 'phu-khoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Khó có thai');
UPDATE trieu_chung SET nhom='phu-khoa' WHERE ten_trieu_chung='Khó có thai' AND (nhom IS NULL OR nhom <> 'phu-khoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mạch tế nhược', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mạch tế nhược');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Mạch tế nhược' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Người gầy yếu', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Người gầy yếu');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Người gầy yếu' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mệt mỏi vô lực', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mệt mỏi vô lực');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Mệt mỏi vô lực' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Chán ăn, buồn nôn', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Chán ăn, buồn nôn');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Chán ăn, buồn nôn' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Đau tức hạ sườn', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Đau tức hạ sườn');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Đau tức hạ sườn' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Lưỡi đỏ, rêu mỏng', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Lưỡi đỏ, rêu mỏng');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Lưỡi đỏ, rêu mỏng' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'tự ha', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='tự ha');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='tự ha' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Ho đàm trong', 'khac' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Ho đàm trong');
UPDATE trieu_chung SET nhom='khac' WHERE ten_trieu_chung='Ho đàm trong' AND (nhom IS NULL OR nhom <> 'khac');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Ho đàm loãng trắng', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Ho đàm loãng trắng');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Ho đàm loãng trắng' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Hồi hộp sợ hãi', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Hồi hộp sợ hãi');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Hồi hộp sợ hãi' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'bụng dưới đau tức', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='bụng dưới đau tức');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='bụng dưới đau tức' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Sườn phải đau tức', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Sườn phải đau tức');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Sườn phải đau tức' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Đa Kinh', 'phu-khoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Đa Kinh');
UPDATE trieu_chung SET nhom='phu-khoa' WHERE ten_trieu_chung='Đa Kinh' AND (nhom IS NULL OR nhom <> 'phu-khoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'lưng gối mỏi', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='lưng gối mỏi');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='lưng gối mỏi' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Ho ra mủ máu', 'khac' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Ho ra mủ máu');
UPDATE trieu_chung SET nhom='khac' WHERE ten_trieu_chung='Ho ra mủ máu' AND (nhom IS NULL OR nhom <> 'khac');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'sắc mặt tối', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='sắc mặt tối');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='sắc mặt tối' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'bụng chướng đau', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='bụng chướng đau');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='bụng chướng đau' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Bụng ngực đầy tức', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Bụng ngực đầy tức');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Bụng ngực đầy tức' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mang Thai Phù Thũng', 'phu-khoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mang Thai Phù Thũng');
UPDATE trieu_chung SET nhom='phu-khoa' WHERE ten_trieu_chung='Mang Thai Phù Thũng' AND (nhom IS NULL OR nhom <> 'phu-khoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Đau thượng vị lan sườn', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Đau thượng vị lan sườn');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Đau thượng vị lan sườn' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'đờm vàng đặc', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='đờm vàng đặc');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='đờm vàng đặc' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Hạ Sườn Đầy Tức', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Hạ Sườn Đầy Tức');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Hạ Sườn Đầy Tức' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'ưa chườm', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='ưa chườm');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='ưa chườm' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'chân tay vô lực', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='chân tay vô lực');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='chân tay vô lực' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'đổ mồ hôi trộm', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='đổ mồ hôi trộm');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='đổ mồ hôi trộm' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Hơi thở ngắn', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Hơi thở ngắn');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Hơi thở ngắn' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'mệt mỏi rã rời', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='mệt mỏi rã rời');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='mệt mỏi rã rời' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Sắc mặt nhợt nhạt', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Sắc mặt nhợt nhạt');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Sắc mặt nhợt nhạt' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Sa dạ dày', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Sa dạ dày');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Sa dạ dày' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Sa trực tràng', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Sa trực tràng');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Sa trực tràng' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Thường xuyên mót rặn', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Thường xuyên mót rặn');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Thường xuyên mót rặn' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Cảm giác trĩ hạ', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Cảm giác trĩ hạ');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Cảm giác trĩ hạ' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Băng lậu', 'phu-khoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Băng lậu');
UPDATE trieu_chung SET nhom='phu-khoa' WHERE ten_trieu_chung='Băng lậu' AND (nhom IS NULL OR nhom <> 'phu-khoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Lưỡi nhợt rêu trắng', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Lưỡi nhợt rêu trắng');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Lưỡi nhợt rêu trắng' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Người mệt mỏi', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Người mệt mỏi');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Người mệt mỏi' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Khí đoản', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Khí đoản');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Khí đoản' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Lười nói', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Lười nói');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Lười nói' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Trầm cảm, u uất', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Trầm cảm, u uất');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Trầm cảm, u uất' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Mệt mỏi, uể oải', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Mệt mỏi, uể oải');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Mệt mỏi, uể oải' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Chóng mặt, hoa mắt', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Chóng mặt, hoa mắt');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Chóng mặt, hoa mắt' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tê bì chân tay', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tê bì chân tay');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Tê bì chân tay' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Cảm giác lạnh chân tay', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Cảm giác lạnh chân tay');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Cảm giác lạnh chân tay' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Đau bụng, tiêu chảy lúc sáng sớm', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Đau bụng, tiêu chảy lúc sáng sớm');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Đau bụng, tiêu chảy lúc sáng sớm' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Khí hư loãng', 'phu-khoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Khí hư loãng');
UPDATE trieu_chung SET nhom='phu-khoa' WHERE ten_trieu_chung='Khí hư loãng' AND (nhom IS NULL OR nhom <> 'phu-khoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Khó thụ thai', 'phu-khoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Khó thụ thai');
UPDATE trieu_chung SET nhom='phu-khoa' WHERE ten_trieu_chung='Khó thụ thai' AND (nhom IS NULL OR nhom <> 'phu-khoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Lưỡi nhợt, rêu mỏng', 'luoi-mach' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Lưỡi nhợt, rêu mỏng');
UPDATE trieu_chung SET nhom='luoi-mach' WHERE ten_trieu_chung='Lưỡi nhợt, rêu mỏng' AND (nhom IS NULL OR nhom <> 'luoi-mach');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Giảm cân', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Giảm cân');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Giảm cân' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Sức đề kháng kém', 'toan-trang' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Sức đề kháng kém');
UPDATE trieu_chung SET nhom='toan-trang' WHERE ten_trieu_chung='Sức đề kháng kém' AND (nhom IS NULL OR nhom <> 'toan-trang');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tâm trạng bất ổn', 'tinh-than' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tâm trạng bất ổn');
UPDATE trieu_chung SET nhom='tinh-than' WHERE ten_trieu_chung='Tâm trạng bất ổn' AND (nhom IS NULL OR nhom <> 'tinh-than');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Đại tiện không thông', 'tieu-hoa' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Đại tiện không thông');
UPDATE trieu_chung SET nhom='tieu-hoa' WHERE ten_trieu_chung='Đại tiện không thông' AND (nhom IS NULL OR nhom <> 'tieu-hoa');
INSERT INTO trieu_chung (ten_trieu_chung, nhom) SELECT 'Tức ngực, sườn đau', 'than-kinh-co-the' WHERE NOT EXISTS (SELECT 1 FROM trieu_chung WHERE ten_trieu_chung='Tức ngực, sườn đau');
UPDATE trieu_chung SET nhom='than-kinh-co-the' WHERE ten_trieu_chung='Tức ngực, sườn đau' AND (nhom IS NULL OR nhom <> 'than-kinh-co-the');

-- 2) Phương huyệt (dữ liệu cũ) cho thể bệnh, khớp theo tiêu kết (46)
UPDATE benh_dong_y SET phuyet_chamcuu='- Cứu: Tam giác pháp.
- Chích nặn máu: Đại đôn.
- Tả: Khí hải, Thái xung, Nội đình.', giainghia_phuyet='Cứu Tam giác pháp: 

Phương huyệt đặc hiệu trị đau bụng dưới do khí thống và sa hạ nang, sưng bìu rất hiệu nghiệm.

Chích nặn máu Đại đôn: 

Đây là Tỉnh huyệt hành Mộc của kinh Can. Việc nặn máu giúp giải tỏa Mộc khí uất kết gây co thắt bụng dưới và đau hạ nang.

Khí hải, Thái xung, Nội đình: 

Nhóm huyệt trị cơn đau quặn dọc theo cơ thẳng bụng (từ sườn xuống bụng dưới) và đau lan sang mạn sườn.

Lưu ý về Can - Thận: 

Cơn đau có tính chất co kéo là đặc trưng của kinh Can. 

Dù ngày xưa còn nhiều tranh luận về nguyên nhân chủ yếu, nhưng thực tế lâm sàng cho thấy chữa vào Can khí mang lại hiệu quả cao cho chứng này.' WHERE tieuket='Tiểu Trường Khí Thống';
UPDATE benh_dong_y SET phuyet_chamcuu='Như Tâm khí hư + Bổ: Đởm du, Dương Cương.', giainghia_phuyet='1. Phối hợp Nguyên - Lạc (Thần môn - Chi chính)
Cơ chế: Thần môn là Nguyên huyệt của kinh Tâm, Chi chính là Lạc huyệt của kinh Tiểu trường (biểu lý với Tâm).

Ý nghĩa: Việc dùng cặp này gọi là "Phối hợp biểu lý". Khi Tâm khí suy, ta mượn thêm khí lực từ kinh Tiểu trường thông qua huyệt Chi chính để đổ vào Tâm. Nó giống như việc một nhà thiếu điện (Tâm) được nhà hàng xóm (Tiểu trường) tiếp ứng thêm qua một đường dây truyền tải (Lạc mạch).

2. Kiện Tỳ, ích Tụy (Tụy du, Ý xá, Tỳ du, Túc tam lý)
Cơ chế: Đây là nhóm huyệt đánh vào "Hậu thiên chi bản".

Ý nghĩa: * Tụy du & Ý xá: Tập trung điều hòa tuyến tụy và chức năng nội tiết.

Tỳ du & Túc tam lý: Làm khỏe bộ máy tiêu hóa.

Phân tích chuyên gia: Trong Đông y, "Tâm là con của Can, là mẹ của Tỳ". Nhưng thực tế, Tâm muốn có máu (huyết) để hoạt động thì Tỳ phải vận hóa tốt đồ ăn thức uống. Nhóm huyệt này giúp tăng "men tiêu hóa" (theo cách nói hiện đại trong đoạn văn) để đảm bảo nguồn nguyên liệu tạo máu luôn dồi dào.

3. Tăng cường Dương khí & Sát khuẩn (Đảm du, Dương cương)
Cơ chế: Đảm (túi mật) chủ về sự quyết đoán và giúp tiêu hóa chất béo.

Ý nghĩa: Dương cương giúp tăng cường nhiệt năng. Việc "sát khuẩn và trị ký sinh trùng" ở đây có thể hiểu là tăng cường hệ miễn dịch và môi trường kiềm hóa tại đường ruột, giúp loại bỏ các tác nhân gây bệnh (thấp nhiệt, nội trùng) vốn là gánh nặng cho hệ tuần hoàn.

4. Nhóm đặc hiệu Trị Thấp tim (Đại chùy, Trung phủ, Đản trung, Du phủ)
Cơ chế: Nhóm huyệt này tập trung vây quanh vùng ngực và cột sống lưng trên (vùng phản xạ của Tâm Phế).

Ý nghĩa: * Đản trung (Chiên trung): Là hội của Khí, giúp mở rộng lồng ngực, tăng lực co bóp.

Trung phủ & Du phủ: Giúp thông phế khí, hỗ trợ "Tâm chủ huyết, Phế chủ khí".

Đại chùy: Hội của các kinh dương, giúp sơ thông nhiệt độc (thường gặp trong thấp tim cấp).

5. Khai thông Tuần hoàn (Thái khê, Côn luân)
Cơ chế: Thái khê là Nguyên huyệt kinh Thận, Côn luân là huyệt kinh Bàng quang.

Ý nghĩa: Thận là gốc của Tiền thiên (năng lượng gốc). Bổ vào đây là để "dưới vững thì trên mới bền". Khi Thận dương (mệnh môn hỏa) được kích hoạt thông qua Thái khê và Côn luân, thân nhiệt sẽ tăng lên, giúp máu không bị ứ trệ (thông thấu), hỗ trợ trực tiếp cho Tâm dương đang suy yếu.' WHERE tieuket='Tâm Dương Hư';
UPDATE benh_dong_y SET phuyet_chamcuu='Cấp cứu như chứng choáng ngất. Cứu: Bách hội, Túc tam lý, Dũng tuyền.', giainghia_phuyet='Bổ thần môn, Chi chính là cặp nguyên lạc biểu lộ, bổ Tâm có Tiểu trường giúp sức, nhóm huyệt này làm tăng nguồn men tiêu hoá, tăng khả năng hấp thụ dinh dưỡng Tuỵ du, ý xá, có tác dụng làm khoẻ công năng của tuyến tuỵ, tăng khả năng vận hoá của Tỳ. Đảm du, Dương cương làm tăng dương khí, tăng khả năng sát khuẩn đường ruột và ký sinh trùng đường ruột. Đại chuỳ, Trung phủ, Chiên trung, Du phủ là nhóm huyệt kinh nghiệm trị thấp tim có hiệu quả.
	Thái khê, Côn luân làm tăng thân nhiệt hỗ trợ cho tuần hoàn huyết dịch được thông thấu.
	Tổng lực nhóm huyệt làm tăng dinh dưỡng, nguồn hậu thiên của huyết dịch, huyết tốt thì công năng và nhiệt lượng của Tâm tăng, Tâm dương sung túc.' WHERE tieuket='Tâm Dương Hư Suy';
UPDATE benh_dong_y SET phuyet_chamcuu='Chích nhĩ tiêm nặn máu.
Châm mạnh: Nhân trung, Bách hội, Dũng truyền, Trung xung.', giainghia_phuyet='Chích Nhĩ tiêm (nặn máu): 

Giúp giảm khí Amoniac và Urê trong máu, hỗ trợ chống hôn mê sâu hiệu quả.
Nhân trung, Bách hội, Dũng tuyền: 

Nhóm huyệt chủ đạo để khai khiếu, tỉnh thần, thường dùng trong cấp cứu choáng ngất.
Trung xung: 

Tỉnh huyệt của kinh Tâm bào, có tác dụng trực tiếp giải tà khí đang bủa vây tại Tâm.

Nguyên tắc điều trị: 
Sau khi bệnh nhân tỉnh (khai khiếu thành công), cần tìm nguyên nhân gốc (bệnh gốc) để điều trị triệt để.' WHERE tieuket='Đàm Mê Tâm Khiếu';
UPDATE benh_dong_y SET phuyet_chamcuu='Tâm hỏa cang thịnh: Tả Thần môn, Nội đình. Chích (cho ra máu) Kim tân, Ngọc dịch.
Tâm di nhiệt sang Tiểu trường (Tiểu buốt, máu): Chích Thiếu trạch. Tả Liệt khuyết, Côn luân.', giainghia_phuyet='Tả Thần môn, Nội đình: Do Tâm hỏa thịnh thường đi kèm với Vị hỏa gây nứt lưỡi, sưng lưỡi, mọc mụn trong miệng và vòm họng. Tả hai huyệt này để thanh nhiệt ở cả hai kinh.

Chích Kim tân, Ngọc dịch: Đây là huyệt ngoài kinh (Kỳ huyệt) dưới lưỡi, chuyên trị sưng đau lưỡi rất hiệu nghiệm.

Chích Thiếu trạch: Là Tỉnh huyệt của kinh Tiểu trường, giúp khu phong hạ sốt, trị sưng đau dọc đường kinh. Do Bàng quang và Tiểu trường đều thuộc kinh Thái dương, nên chích Thiếu trạch giúp trừ nhiệt cho cả hai.

Tả Liệt khuyết, Côn luân: Điều trị chứng nhiệt kết làm khí hóa không thông, gây viêm bàng quang, tiểu ra máu, đái buốt và đau rát.' WHERE tieuket='Tâm Hỏa Vượng';
UPDATE benh_dong_y SET phuyet_chamcuu='Tả: Khố phòng, Nội quan, Thái xung, Chi câu.
Bổ: Túc Tam lý.
Uất kết lâu ngày gan lách sưng to, dùng bổ hoặc cứu: Tỳ du, Bĩ căn, Chương môn, Công tôn.', giainghia_phuyet='Khố phòng có thể khai khí uất ở lồng ngược, Nội quan, Thái xung để sơ can lý khí. Chi câu chữa đau vỏ lồng ngực. Bổ túc tam lý để dẫn hoả đi xuống. Tỳ du, Bĩ căn, Chương môn, Công tôn có tác dụng bổ Can khí, Tỳ khí, phá cái gốc của sự bĩ, tăng vận hoá đào thải  của tỳ, do đó chữa được chứng gan lách sưng to.' WHERE tieuket='Can Khí Uất Kết';
UPDATE benh_dong_y SET phuyet_chamcuu='- Nếu hoả bốc lên đau đầu, dễ cáu, mắt mờ, đau sườn, đắng  miệng thì chỉ cân tả: Bách hội hành gian.
Nếu đau đầu dư dội và có dấu hiệu hoá hỏa sinh phong dẫn đến tai biến mạch máu não thì sắn sàng cấp cứu như trúng gió và nhanh chóng làm cho huyết áp giảm xuống.
Tả: Kiên ngung, hợp cốc,Thái xung, Can nhiệt huyết. Bổ : Túc Tam lý, Tam âm giao.
Nếu liệt nửa người thì lấy : Phong trì, Khúc trì , Dương lăng tuyền, Hành gian.', giainghia_phuyet='Bách hội, hành gian là nhóm huyệt kinh nghiệm hiệu quả chữa đau đầu do các can hoả. Kiên ngung, làm giảm huyết áp xuống. Hợp cốc, Thái xung cả hai bên là tư aưn huyệt, lấy để trấn kinh, chống co quắp, co giận, can nhiệt huyệtđể tả Can nhiệt Túc tam lý dẫn hoả đi xuống . Tam âm giao để tư thận âm làm cho Can âm cũng được tăng cường thêm đủ sức chế Can hoả , vì Can thạn đồng nguyên. đồgn thưòi do có cả Túc Tam lý và xung trong phương, lại có thể chống dược viêm gan do gan nhiều hoả khí gây ra.
Phong trì, Khúc trì, Dương lăng tuyền, hành gian bổ bên lành, tả bên liệt phương huyệt chữa chứng huyệt nửa người nghiệm nhất làm cho người bệnh nhanh phục hồi chức năng vận động ở nửa bị liệt.' WHERE tieuket='Can Dương Thượng Cang';
UPDATE benh_dong_y SET phuyet_chamcuu='Tả: Não hộ, Đảm du, Dương cương, Chí dương, Chi cân, Dương lăng tuyền. Bình, Nội quan.', giainghia_phuyet='Não hộ, Đảm du, Dương cương là nhóm huyệt trị Đảm nhiệt rất hiệu quả. Chí dương ở Đốc mạch thông qua Tam tiêu mà hoả ở Can, Đảm và liên sườn. Chi câu là huyệt trên kinh Tam tiêu chữa mọi chứng đau ở vỏ lồng ngực. Nội quan để điều hoà chung công năng nội tạng. Do đó phương huyệt trên có thể chữa được viêm túi mật cấp và mãn.' WHERE tieuket='Đởm Thấp Nhiệt';
UPDATE benh_dong_y SET phuyet_chamcuu='Bổ: Thần môn, Chi chính, tuỵ du, Tỳ du, ý xá, Trung quản, Nội quan, Túc tam lý, Thái bạch.', giainghia_phuyet='Tỳ dương hư thực chất là công năng của truyến tuỵ giảm làm cho công năng của Trường, Vị giảm, làm cho dạ dầy chướng đau, ăn không ngon, phân nát, yếu đuối, mạch hơi chậm hoặc yếu, Bổ tuỵ du, Tỳ du, ý xá làm cho công năng của tỵu mạnh thêm, Trung quản, Nội quản, túc tam lý là bộ huyệt bổ tỳ, Vị truyền thống thường dùng, Thần môn Chi thính là cặp biểu lýnguyên lạc của Tâm và Tiểu trường, có tác dụng tăng hấp thụ dinh dưỡng cung cấp cho tâm huyết, coa tác dụng bồi bổ toàn thân, trong đó có chức năng tuyến tuỵ và công năng vận hoá của Tỳ vị.' WHERE tieuket='Tỳ Dương Hư';
UPDATE benh_dong_y SET phuyet_chamcuu='Bổ: Tỳ đu, Trung quản, Quang nguyên, Tam âm giao, Khí hải Túc, Tam lý, Nội quan.', giainghia_phuyet='Bổ các huyệt Tỳ du, Vị du, Trung quảnlà trực tiếp bổvào công năngcủa tỳ, Vị, bổ Quan nguyên Đại bổ nguyên khí nên các nhà khí công đặc biệt chú ý gọi đó là"đan điền". Nội quan , Tam âm giao là các hyệt bồi bổ âm huyết, huyết tốt lại sinh ra khí (khí công năng) cho toàn thân, trong đó có Tỳ, Vị. Nếu tỳ, Vị khí hư mà phát sốt, hoặc xuất huyết, thì trên cơ sở phương này gia thêm các huyệt hạ : Đại chuỳ, Khúc trì, Hợp cốc và cứu ẩn bạch, Đại đôn để cầm máu.' WHERE tieuket='Tỳ Khí Hư';
UPDATE benh_dong_y SET phuyet_chamcuu='Bổ: Tỳ du, Thận du, Bách hội, Thái khê, Túc tam lý. Cứu: Cách du Đảm du, Côn luân. Bổ: Đại chung, Thông lý', giainghia_phuyet='Tỳ thận dương hư có chứng ngại nói yếu hơi, tứ chi vô lực, lạnh, phân nát là chứng của tỳ, tảng sáng ỉa chảy, lưng lạnh sợ lạnh, tinh thần bải hoải là chứng của Thận dương hư. Tỳ hư thì sinh đờm, Thận không nạp khí thì sinh suyễn. Bổ tỳ du, Thận du là trực tiếp bổ thận, Bách hội thái khê, bổ thận dương cầm ỉa chảy, Túc tam lý tăng cường vận hoá của tỳ, Cách du, Đảm du, bổ dưỡng khí huyết, Côn luân cứu có tác dụng ngăn cơn suyễn, ấm lưng, cộng với Thái khê có thể làm tăng thân nhiệt để nuôi ấm ngũ tạng, khử thấp, trừ tà hàn, Đại chung, Thông lý để trị chứng ngại nói ham nằm. Phương huyệt có tổng lực bồi bổ chứng Tỳ thận dương hư rất mạnh.' WHERE tieuket='Tỳ Thận Dương Hư';
UPDATE benh_dong_y SET phuyet_chamcuu='Dùng toàn bộ phương huyệt chữa chứng Thận dương hư kể trên, và thêm Tâm du, Cách du, Nội quan, Túc tam lý, là những huyệt ra vào số huyệt đã có ở phương trên sẽ làm nên tác dụng bồi bổ âm huyết, âm tinh, làm cho giá trị chữa chứng thận âm dương lưỡng hư được toàn diện.', giainghia_phuyet='' WHERE tieuket='Thận Âm Dương Lưỡng Hư';
UPDATE benh_dong_y SET phuyet_chamcuu='- Vị hoả Tả: Đầu duy, Dương bạch, Hợp cốc, Giải khê, Khúc trì, Túc tam lý, Nội đình.

- Vị âm hư: lấy phương huyệt trên và thêm bổ: Nội quan, Tam âm giao. Nếu có mụn trong miệng, lợi răng sưng đau, lấy ty thêm các huyệt: Đoài đoan, Ngận giao, thường tương.
Xuất huyết dạ dầy: Thừa lăng, Kích môn.
- Chảy máu mũi: thượng tinh, Tố liêu.', giainghia_phuyet='Vị hoả thịnh, dương thịnh thì nhiệt làm phát sốt thì phiền thao vật vã. Lấy khúc trì, Túc tam lý để hạ nhiệt, dẫn hoả đi xuống làm cho dứt phiền thao vật vã. Hoả thịnh viêm lên, ép huyết "vọng hành" làm cho thổ huyết, nục huyết, lấy Đầu duy, Dương bạch Hợp cốc, Giải khê để tả nhiệt ở vùng trước trán. Đại lăng, Khích mônlà cặp huyệt trị vị nhiệt gây ra xuất huyết dạ dầy, thổ ra huyết, Thượng tinh, Tố liêu để cầm chứng mục huyết ( chảy máu mũi). Các huyệt Đoài đoan, Ngận giao, thừa tương, là huyệt chữa vòm miệng, lợi răng sưng đau tại chỗ rất hiệu nghiệm.
	Vị âm bất túc gây ra " âm hư sinh nội nhiệt" cần Bổ Nội quan, Tâm âm giao để bổ âm, trừ hư hoả.' WHERE tieuket='Tỳ Âm Hư';
UPDATE benh_dong_y SET phuyet_chamcuu='Tả: Kỳ môn, Thái xung. Bổ: Trung quản, Lương môn, Nội quan, Túc tam lý.
Gia giảm: Nôn ra máu, tả Đại lăng, Khích môn.', giainghia_phuyet='Thường người bệnh bị đau vùng dạ dày, thì có đủ các chứng trên, có điều là thường ở mỗi người có chứng nào đó nổi trội riêng, còn có các chứng khác đan xen vào. Khi chữa nên lần lượt chọn nhóm huyệt trị chứng riêng biệt cộng với nhóm chung, khi dứt chứng trội ấy sẽ lần lượt lấy đến các nhóm riêng biệt khác cộng với nhóm chung cho tới khi khỏi hẳn.
Trong bốn phương trên ta thấy:
-	Trị riêng từng chứng có các bộ huyệt:
+ Tuỵ: Tuỵ du, Tỳ du, ý xá, Thái bạch.
+ Đảm: não hộ, Đảm du, Dương cương, Khâu khư
+ Can: Kỳ môn, thái xung.
		- Trị chung cả vùng bụng trên có: Lương môn, huyệt lương môn là cái cầu nối giữa các vùng thần kinh chức năng của bụng trên, ở mỗi tạng phủ có nhiễu loạn đều thông qua Lương môn mà ảnh hưởng sang tạng phủ bên cạnh đó.
	- Trị riêng dạ dầy có: Trung quản, nội quan, túc tam lý là phương huyệt truyền thống trị đau dạ dầy, do đó nhóm huyệt này cùng huyệt lương môn luôn có mặt cả trong các phương. Cần phải luôn nhớ rằng nếu chỉ dùng có ba huyệt Trung quản, Nội quản, Túc tam lý để chữa đau vùng dạ dầy thì nói chỉ  có tác dụng cắt cơn, giảm đau mà không thể trị khỏi. Vì vậy nói phải theo các nguyên nhân kể trên mà lấy thêm các nhóm huyệt thích ứng.
	Sau nhiều năm tìm kiếm tài liệu bệnh học, thực nghiệm chữa trị từng phần ở lâm sàng, cuối cùng là tổng hợp mà thành các phương vừa nêu trên, nó đã giúp tôi nắm được  công cụ hiệu lực nhất để chữa trị triệt gốc căn bệnh đau vùng bụng trên.
	Loại bệnh này chủ yếu là do nội thương vì ăn uống và 7 loại tình cảm gây ra, vì thế sau khi khỏi cần kiêng tránh ăn uống thoả chí và các va trạm xã hội gây chấn thương tình cảm để đề phòng tái phát.' WHERE tieuket='Can Vị Bất Hòa';
UPDATE benh_dong_y SET phuyet_chamcuu='Châm bổ, châm song lại cứu:
Trung quản, Lương môn, Nội quan, Túc tam lý, Tỳ du, Vị du.
Gia giảm: ỉa ra phân đen, cứu ẩn bạch, Tỳ du.', giainghia_phuyet='' WHERE tieuket='Tỳ Dương Hư';
UPDATE benh_dong_y SET phuyet_chamcuu='Tả: Tuỵ du, Tỳ du, ý xá. Bổ Trung Quản, Lương môn, Nội quan, Túc Tam Lý. Tả: Thái bạch.', giainghia_phuyet='' WHERE tieuket='Thực Trệ Tỳ';
UPDATE benh_dong_y SET phuyet_chamcuu='Tả: não hộ, Đảm du, Dương cương. Bổ: Trung Quản, Lương môn, Nội quan, Túc tam Lý. Tả: Khâu khư.', giainghia_phuyet='' WHERE tieuket='Đởm Thấp Nhiệt';
UPDATE benh_dong_y SET phuyet_chamcuu='Bổ: Trung quản, Lương môn, Nội quan, Túc tam lý, thượng cự hư, Hạ cự hư', giainghia_phuyet='' WHERE tieuket='Thực Trệ Tỳ';
UPDATE benh_dong_y SET phuyet_chamcuu='Cứu phế du là ôn bổ phế tạng, cứu Cao hoang du với Túc Tam lý là huyệt bổ khí từ tông khí phát ra để tăng sự thúc đẩy của Phế khí 2 Cách du và 2 Đảm du là Tứ hoa liệu pháp có tác dụng đặc biệt Bổ phế khí và khí hoá toàn thân. Cứu Tỳ du, Thận du làm cho khí ở Tỳ, Thận khoẻ sẽ hỗ trợ Phế khí. Quan nguyên, Khí hải là hai huyệt giứ gìn nguyên khí toàn thân. Nội quan ở Âm duy mạch, cứu có tác dụng bồi bổ âm huyết, huyết sinh khí, huyết tốt thì khí khoẻ.', giainghia_phuyet='' WHERE tieuket='Phế Khí Hư';
UPDATE benh_dong_y SET phuyet_chamcuu='Cứu: Cách du, Đảm du, Thận du, Phế du. Tả: Can du, Thái xung, Dại chuỳ, Trung phủ. Bổ: Túc tam lý, Tam âm giao.', giainghia_phuyet='Cách du, Đảm du lấy cả hai bên là Tư hoa liệu pháp có tác dụng bồi bổ khí huyết, chống suy nhược. Bổ phế du để bổ Phế, bổ Thận du để tư âm giáng hoả, Tả can du, Thái xung để tả hư hoả ở Can, do Can âm hư sinh ra Can hoả vượng, phản khắc Phế kim. Đại chuỳ, trung phủ là cặp huyệt trị giãn phế quản xuất huyết rất có kinh nghiệm. Bổ túc Tam lý vừa dẫn hoả đi xuống vừa kiện Tỳ, hoà vị để bồi thổ sinh kim. Bổ tam âm giao là bổ âm ở Can, Tỳ, Thận cũng là chân âm của cơ thể người ta.' WHERE tieuket='Phế Âm Hư';
UPDATE benh_dong_y SET phuyet_chamcuu='a. Thể châm: Phong trị, Hợp cốc, Phục lưu.
Gia giảm: 
- Tắc mũi gia nghinh hương.
- Toàn thân đau buốt, gia khúc trì, thừa sơn.
- Sốt cao, gia Đại truỳ, Khúc trì, hoặc Khúc trì, thập tuyên.
- đầu đau giữ dội, gia Thái dương, ấn dduwowgf.
- Ho hắng, gia Phế du, Xích trạch, hoặc Liệt khuyết, Thái uyên.
- Họng đau, gia phù đột, Thiếu thương (chích ra máu).
- Quặn bụng buồn nôn, gia: Nội quan.
Các huyệt ở phương chủ, dùng phép kích thích mạnh, làm đi làm lại thủ pháp kích thích, làm cho thấy hơi ra một chút mồ hôi.
b. Nhĩ châm: Nội tị, Ngạch, Chẩm, thận thượng tuyến, bì chất hạ.
Phương huyệt kinh nghiệm (kinh huyệt)
554- Cảm mạo: Bách hội, ngoại quan, hợp cốc, liệt khuyết. 
555- Cảm mạo: Đại chuỳ, Khúc trì, hợp cốc. 556- Cảm mạo: Phong trì, đại chuỳ, Hợp cốc
557- Cảm mạo: Phong trì, Đại chuỳ, hoặc đào đạo
558- Cảm mạo: Đại trữ, Phong trì, phong môn, phế du.
559- Cảm cúm: Phong trì, đại chuỳ, khúc trì.
560- Cảm cúm: Phong môn, Đại chuỳ, hợp cốc.
561- Cảm mạo đau đầu: Thái dương, ấn đường, Hợp cốc.    
562- Cảm mạo, ho hắng, viêm phổi: Phong môn, phế du.
563- Cảm mạo phát sốt: Hợp cốc, Khúc trì, Phong môn 
565- Ngoại cảm sốt cao: Trung xung, Thiếu thương, thương dương,phương huyệt kinh nghiệm (tân, kỳ huyệt).
334- Cảm mạo: Tam thương, ấn đường, Thái dương, Sùng sốt. 
335- Cúm: Tam thương.
336- Say nắng: Thập vương, Thập tuyên, nội nghỉnh hương.
(Trích ở sách “cẩm nang……” các trang 753 - 754 – 790)', giainghia_phuyet='' WHERE tieuket='Bệnh Cảm Cúm';
UPDATE benh_dong_y SET phuyet_chamcuu='Bổ: Phế du, tỳ du, Can du, Cách du, Đảm du, Thần môn, Chi chính, Nội quan, Túc tam lý.', giainghia_phuyet='Bổ phế du là trực tiếp bổ vào Phế tạng. Bổ tỳ du, Túc tam lý là bổ Tỳ để bổ phế, gọi là bồi thổ sinh kim Bổ cách du, Đảm du là Tứ hoa liệu pháp để bổ dưỡng khí huyết toàn thân: bổ Thần môn, chi chính là dùng nguyên lạc biểu lý giữa Tâm và Tiểu trường để bổ Tâm khí, bổ nội quan là bổ vào âm huyết. Đây là một phương bồi bổ phế, tỳ có đội ngũ hùng hậu hiệu quả cao.' WHERE tieuket='Phế Tỳ Khí Hư';
UPDATE benh_dong_y SET phuyet_chamcuu='Tả: Hợp cốc, Ngoại quan, túc tam lý, thượng cự hư.', giainghia_phuyet='Hợp cốc là nguyên huyệt của kinh Đại trường, loại nguyên cũng như loại du trong ngũ du huyệt, vừa có tác dụng của loại nguyên để hạ nhiệt kinh Đại trường lại có tác dụng khử thấp của loại du. Ngoại quan là huyệt loại lạc của kinhg tam tiêu có tác dụng khử ngoại tà ở tam tiêu và toàn thân nói chung (do chữ ngoại quan có nghĩa là có gắn với ngoại tà). Túc tam lý có tác dụng kiện tỳ, hoà vị, hoá thấp; thượng cự hư là hạ hợp huyệt, trị bệnh của Đại trường mạnh nhất.' WHERE tieuket='Đại Trường Thấp Nhiệt';
UPDATE benh_dong_y SET phuyet_chamcuu='Bổ: Cách du, Đảm du, Thái dương, Hợp cốc, Thận du, Nội quan, Túc tam lý, Tam âm giao, Bách hội, Thông thiên, Dũng tuyền.', giainghia_phuyet='Cách du, Đảm du dùng cả hai bên là Tứ hoa liệu pháp chữa chứng âm hư truyền thống.Thái dương, Hợp cốc là nhóm huyệt chữa chứng đau đầu do thần kinh suy nhược rất nghiệm. Thận du bổ thận, chữa chứng đau lưng, di tinh; Nội quan, Túc tam lý, Tam âm giao là nhóm huyệt bổ về âm huyết, âm huyết đủ thì Tâm âm sung túc sẽ trừ được chứng phiền nhiệt trong Tâm, bổ bách hội, Thông thiên, Dũng truyền sẽ trừ dược chứng đau đầu có đau lưng, ù tai hoa mắt do Thận âm hư gây ra.' WHERE tieuket='Thận Âm Hư';
UPDATE benh_dong_y SET phuyet_chamcuu='- Đái buốt đau, đái ra máu: tả liệt khuyết, Côn luân.
- Đái ra cát sỏi: Bổ thận du; tả thuỷ đạo, Trung cực
- Viêm cấp tính tiền liệt tuyến: Tả não hộ, Chí dương, Đảm du, tả khúc cốt, Hội âm.', giainghia_phuyet='Viêm bàng quang hoặc liệu đạo làm cho đái buốt đau, đái ra máu là do khí hoá ở báng quang không tốt, tả Liệt khuyết để khí hoá được thận hoạt, tả côn luân là,  khử tà nhiệt ở bàng quang làm cho khí hoá được dẽ  mà nước tiểu ra mát, trong. Thận du, Thuỷ đạo là nhóm huyệt  chữa sỏi Thận và sỏi niệu quản sỏi bàng quang đều có hiệu quả. Trung cực là mộ huyệt của bàng quang có tác dụng với mọi chứng bệnh của Bàng quang cấp và mãn. Khúc cốt là huyệt đặc trị bệnh ở tiền liệt tuyến. Hội âm trị bệnh ở nhị âm, hai huyệt cùng dùng, ngoài việc trị bệnh ở tiền liệt tuyến còn có sức chữa chứng bị rối loạn cơ tròn gây ra bí đái ỉa, kể cả sau khi khâu đẻ ở âm môn bị viêm nhiễm gây ra bí đái ỉa.' WHERE tieuket='Bàng Quang Thấp Nhiệt';
UPDATE benh_dong_y SET phuyet_chamcuu='Tả can du, bổ đảm du, Tỳ du, vị du, Trung quản, Lương môn, Nội quan, Túc tam lý.', giainghia_phuyet='Tả can du, Bổ đảm du, tỳ du, vị du là dựa vào số đo kinh lạc để điều chỉnh công năng các tạng phủ kể trên thông qua các bối du huyệt. Bổ trung quản, Lương môn, Nội quan, Túc tam lý vốn là những huyệt chữa bệnh dạ dầy truyền thống.' WHERE tieuket='Phù Nề Dạ Dầy';
UPDATE benh_dong_y SET phuyet_chamcuu='Thể châm: Bệnh gáy cổ
25. Cổ gáy cứng đau, đau đầu cứng gáy: Thừa tương, Phong phủ.
26. Cổ gáy không xoay được: thiên dũ, hậu khê.
27. Sái cổ: Thiên trụ, hậu khê.
28 Cứng gáy: Thiên trụ, lạc chẩm.
29. Sái cổ căng gáy đầu (đỉnh đầu): Phong trì, Hậu khê
30. Bị lạnh mà cứng cổ gáy: Ôn lư, Kỳ môn.
31. Đau gáy đầu: Liệt khuyết, Hậu Khê
32. Đầu gáy cứng đau: Lạc chẩm, Tân thiết.
Tân kỳ huyệt chữa bệnh gáy cổ:
95. Bệnh vùng cổ gáy: giáp tích 1-7
96. Gáy cổ cứng đau: Cảnh trung.
97. Đau gáy cổ: Ngũ hổ, Dung hậu, Bát tà, Thượng bát tà.
98. Cứng gáy: Tân thức, Sùng cốt.
99. Sái cổ: Lạc cảnh, Bách lao, Định suyễn, lạc chẩm, Lạc linh ngũ, Hợp cốc.
(Trang 725 và trang 776 sách “cẩm nang chẩn trị Đông y. Dùng thuốc và châm cứu. NXB Y học Hà Nội 2003).', giainghia_phuyet='- Đầu không thể nâng lên và cúi xuống là bệnh của túc thái dương kinh, tả huyệt kinh cốt, bổ huyệt Uỷ trung, tả huyệt Đại trữ, Phong môn.
- Đầu không thể quay hướng sang trái, Sang phải là bệnh của thủ thái dương kinh, tả huyệt Kiên ngoại du, Hậu khê, 
- Bất luận kinh nào bị bệnh đều phải thêm huyệt hạng cường. (Trích ở sách “ Điểm huyệt liệu pháp” của mã tú Đường, NXB Thiểm tây khoa học kỹ thuật xuất bản xã, 2-1998).' WHERE tieuket='Bệnh Đốt Sống Cổ';
UPDATE benh_dong_y SET phuyet_chamcuu='Chữa bằng châm cứu.
a. Thể châm:
(1) Trúng tạng phủ.
Chứng bế: Nhân trng, Liêm tuyền, Lao cung, Dũng tuyền, Thập nhị tỉnh.
- Chứng thoát: Bạch hội, Nội quan, Hợp cốc, Quan nguyên (cứu), Túc tam lý, Tam âm giao.
(2) Trúng kinh lạc và di chứng về sau.
Tri trên bại liệt: trị than 1, trị than 2.
Khúc trì thấu Thiếu hải, Trị than 3.
Hợp cốc thấu lao cung.
Chi dưới bại liệt:
Hoàn khiêu, Thân tẩu (ở giứa rãnh háng xuống 6 thốn),
Phong thị, Tứ cương, trị than 5, Giải khê, Thái xung.
Miệng mắt méo lệch:
Tán trúc thấu Ngư yêu,
Tứ bạch thấu Nghinh hương,
Địa thương thấu Giáp xa,
ế phong, Hạ quan.
Lưỡi cứng không nói:
Á môn, thông lý, kim tân, Ngọc dịch (xuất huyết)
Liêm tuyến, Chiếu hải.
Nuốt xuống khó khăn:
Á môn, Liêm tuyền, Chiếu hải,
Hợp cốc, thiên đột, Tam âm giao (châm á môn đều đâm đứng kim sâu 2,5 thốn, khi có cảm ứng toàn thân thì rút kim)
(3) Huyết áp thấp, thiếu máu não:
	338- Huyết áp thấp: Nội quyan, Tố liêu.
	339- Huyết áp thấp: Nhân nghinh, Nhân trung, Thái xung, Nội quan, tố liêu.
	337- Nâng huyết áp, kích thích khoẻ tim , trị chúng độc, bất tỉnh, Dũng tuyền, Túc tam lý, Tân kỳ huyệt.
	335- Huyết áp thấp: Huyết áp điểm.
b. Nhĩ châm: Bì chất hạ, Não điểm, chẩm, Ngạch, Thần môn, Tâm và vùng tương ứng.
Chú ý: Khi có mô hình kẹt động mạch não, ngoài nội dung chữa nguyên nhân.
Phải châm: Huyền ly, Túc lâm khấp để hoãn giải động mạch não.
Giai đoạn trúng phong hôn mê, chứng bế dùng phép kích thích nặng, mỗi ngày có thể châm kim 2-3 lần. Chứng thoát cần kích thích nhẹ một ít. Cứu huyệt quan nguyên phải dùng mồi ngải lớn, có thể cứu liền hơn mười  mồi tới mấy chục mồi.', giainghia_phuyet='Phòng ngừa tai biến mạch máu não,
Rất khố và không chắc chắn, về phòng ngừa huyết áp và xơ cứng động mạch là một việc mà hiện nay nay chưa giải quyết được.
Tuy nhiên người ta là một số  nguyên nhân đó là ngừa được tai biến mạch máu não, ở người huyết áp cao và người già trên 50 mười tuổi 
- Tránh mọi sự gắng sức quá mạnh một cách đột ngột 
- Tránh uống rượu, tránh bữa ăn quá sang.
- Tránh thay đổi nhiệt độ quá nhanh (Ban đêm, từ trong giường ấm áp ra ngoài chỗ lạnh) tránh gió lùa.
Tránh cảm xúc mạnh (Cơn tức giận)' WHERE tieuket='Trúng Phong (Kẹt Động Mạch Não)';
UPDATE benh_dong_y SET phuyet_chamcuu='Cách chữa bằng huyệt vị:
ấn day ở mệnh môn và áp thống điểm (Nơi này thấy đau) ấn từ nhẹ đến nặng, từ 1-2 phút, xoa ở thận du 10 phút, cuối cùng day ở huyệt Uỷ trung.
Bằng châm cứu:
a. Thể châm.
- Phong thấp hàn chứng: Thận tích yêu dương quan, âm môn, Uỷ trung hoặc lấy A thi huyệt. Châm xong, những huyệt ở vùng thắt lưng có thể cứu thêm hoặc làm bầu giác.
- Thận hư: Thận du (Châm cứu) Mệnh môn (cứu)Thái khê
- Cơ lưng lao tổn : thận tích, yêu nhỡn, uỷ trung .
- Bong gân cấp tính: nhân trugn, Uỷ trung, (Chích trung)
- Châm trên bàn tay: yêu thoái điểm 9 trên mu bàn tay, trước nếp cổ tay 1,5 thốn ở khe gây cơ duỗi ngón 2 phía cạch quany và gân cơ duỗi ngón 4 ở cạnh trụ, cộng là 4 diểm (hai)
b, Nhĩ châm: giao cảm, Thần môn, Yêu (Thắt lưng) Thận
Phương châm nghiệm (Kinh huyệt)
482- Đau sát vùng thắt lưng: Nhân trung: ngân giao
483- Dau lưng: Đại trường du, mệnh môn hoặc Yêu đương quan
484- Đau lưng: Dưỡng lão, yêu du
 485- Đau lưng : Kinh môn Hành gian
486- Đau lưng : Yur trung, thận du
487- Đau lưng Thận du, uỷ trung
488- Lưng dưới lưng trên đau : Uỷ trung, phục lưu.
489- Lưng dưới lưng trên đau: Côn lôn, uỷ trung.
490- Bong gân vùng thắt lưng cấp tính : Uỷ trung, Ngận giao, áp thống điểm .
491- Đau thắt lưng : Yêu nhỡn, Thận du, Uỷ dương.
492- Cột sống cứng cấp tính: Đại trữ cách quan, thuỷ phân.
493- Cột sống gãy ngược lại: á môn, Phong phủ.
494-  Viêm cột sống do phong thấp : Đại trữ, đại chuỳ, thận trụ chí dương, cân súc, yêu đương quan.
495Viêm cột sông do phông thấp, Tiều đường du, đại chuỳ , tỳ du, thận du, tích huyệt tương ứng.
496- Thoát vị đĩa đệm: á môn, Giáp tích L4, L5.
497- Lưng và cột sống lưng đau đớn: nhân trung, Uỷ trung
498- lưng trên liền với lưng dưới: Bạch hoàn du, Uỷ trung.
499- Đau lưng không thể cúi ngửa: Ân môn, Uỷ đương.
500- Đau lưng khó động đậy ; Phong thị, Uỷ trung, hành gian.
501- Tổn thương phần mềm vùng thắt lưng: Chí thất, Quan nguyên, âm môn.
502- Phong lao đau lưng: Quan nguyên du, Bàng quang du.
503- Đau thắt lưng và xương cùng: Thập thất, chuỳ hạ, trận biên, Quang nguyên du.
504- Lưng và đùi đau: Thận du, thận tích, đĩnh yêu.
505- Lưng và đùi đau: Thừa phù quang nguyên,  Toạ cốt, Uỷ trung.
506- Lưng đùi đau: Trận biên âm môn, dương lăng tuyền.
507- Còng gù lưng: Đại chuỳ, Quan nguyên, túc tam lý (cứu)
508- Còng gù lưng: Đại chuỳ, Quan nguyên, Túc tam lý (cứu)
509- Còng gù do mềm xương: Đại hoành đại chuỳ, Túc tam lý (cứu)
510- Lưng dưới lưng trên còng khom: Phong trì, phế du.
511- Đau khớp hông: Thừa phù, Dương lăng tuyền.
512- Bong gây cấp tính vùng lưng: Hậu khê, ân môn, áp thống điểm (điểm ấn đau)
Và huyệt giáp tích tương ứng.
(Sách “cẩm nang……..”) Trang 749- 750,751.).
- Phương kinh nghiệm (Tân, kỳ huyệt).
137- Đau lưng: thành cốt, Hạ côn lôn, Trị chuyển cân, Tuyển sinh túc, hoàn trung, Hạ cực du
138- Đau lưng trên: Phế nhiệt huyệt
139- Đau buốt lưng trên, lưng dưới: Tích tam huyệt, Âm hạ.
140- Đau lưng mạn tính: Đĩnh yêu, Khê thượng.
141- Đau thắt lưng: Phế nhiệt huyệt, tiếp cốt.
142- Tổn thương phần mềm ở lưng: Yêu nghi, Trung không
143- Tổn thương phần mềm ở thắt lưng: Yêu nhỡn
144- Bong gân cấp tính thắt lưng: Huyệt Nữu thương.
145- Bệnh tật vùng thắt lưng và xương sống: Giáp tích từ D11-S2
146- Đau thắt lưng và xương cùng: Thập thất truỳ hạ
147- Đau lưng đùi: Khách tân trung, Ân thượng
148- Thắt lưng và đùi đau: Ngoại âm liêm.
149- Viêm cột sống: Tích tam huyệt, Tích phùng.
150- Viêm đốt sống: Thận tích.
151- Viêm giây trằng đốt sống: Thận tích
152- Thắt lưng ngoại thương: Yêu thống 1, Yêu thống 3.
153- Đau nhức mình mẩy (thống phong): Ngoại khoả tiêm, Hạ côn lôn.
154- Viêm tuỷ sống: tích phùng
155- Viêm màng nhện tuỷ sống: Tích tam huyệt
156- Xơ hoá từng mảng tuỷ sống: thượng nhĩ căn.
157- các bệnh tật về tuỷ sống: Tích tam huyệt.
158- Đau xương cùng: ngọc điều.
159- Bệnh tật ở khớp cùng chậu: yêu căn.
(Sách “Cảm nang…..”trang 778-779).', giainghia_phuyet='' WHERE tieuket='Yêu thống (bệnh đau lưng)';
UPDATE benh_dong_y SET phuyet_chamcuu='Bổ: Cách du, Tâm du, Đảm du, Thần môn, Chi chính, Tỳ du, Vị du, Túc tam lý, Thiếu dương, Dũng tuyền.', giainghia_phuyet='Tâm tỳ lưỡng hư đều do bệnh biến của một tạng mà ảnh hưởng đến một tạng tương quan, hoặc do bệnh tà cùng tác động đến hai tạng mà phát bệnh. Bổ tỳ du, Vị du, Túc tam lý là bổ trực tiếp vào Tỳ, Vị. Cách du, Đảm du là tứ hoa liệu pháp có tác dụng bồi bổ cả khí và huyết. Thần môn, Chi chính là cặp biểu lý nguyên lạc của Tâm và Tiểu trường, bổ Tâm có Tiểu trường giúp sức thì Tâm thêm mau khoẻ. Thiếu dương, Thần môn, Tâm du, Dũng truyền là phưong huyệt trị chứng hay quên do Tâm tỳ lưỡng hư gây ra.' WHERE tieuket='Tâm Tỳ Lưỡng Hư';
UPDATE benh_dong_y SET phuyet_chamcuu='Như Tâm âm hư và thêm Bổ: Can du, Tỳ du, Bần huyết linh.', giainghia_phuyet='1. Tứ hoa liệu pháp (Bổ Cách du, Đảm du)
Điển tích: Đây là phương pháp nổi tiếng từ thời cổ đại (đặc biệt trong Châm cứu đại thành), dùng để trị chứng Cốt chưng triều nhiệt (nóng trong xương) của bệnh Lao (Phế lao).

Ý nghĩa: * Cách du: Huyệt hội của Huyết. Bổ Cách du là trực tiếp bồi bổ phần huyết và phần âm.

Đảm du: Mộc (Đảm) sinh Hỏa (Tâm). Bổ vào đây là cách gián tiếp nuôi dưỡng tâm mạch từ gốc.

Sự kết hợp: Tạo ra "bốn bông hoa" giúp thanh nhiệt ở tầng sâu, nuôi dưỡng âm dịch bị hao tổn lâu ngày.

2. Trị liệu Tâm Thần (Nội quan, Tả Thần môn)
Nội quan (Chủ huyệt): Đây là huyệt thuộc kinh Quyết âm Tâm bào. Nội quan có khả năng điều tiết khí huyết ở ngực và tim cực mạnh. Khi "âm huyết hao tổn", Nội quan giúp giữ nhịp tim ổn định và dẫn huyết về nuôi dưỡng tâm mạch.

Tả Thần môn: Khác với các câu trước là "Bổ Thần môn", ở đây dùng phép Tả.

Lý do: Khi âm hư, hỏa sẽ vượng (nóng trong). Tả Thần môn để rút bớt cái "hư nhiệt" này đi, giúp người bệnh hết bồn chồn, mất ngủ, hay quên (an thần định chí).

3. Phép "Hạ nhiệt lò bễ" (Tả Chí dương, Đảm du, Phế du)
Cơ chế: Tâm hỏa vốn được hỗ trợ bởi Phế khí và Đảm hỏa. Nếu các kinh này quá nóng, chúng sẽ "nung nấu" làm khô cạn âm dịch của Tâm.

Ý nghĩa: * Chí dương: Huyệt nằm trên mạch Đốc, giúp điều hòa dương khí toàn thân.

Tả nhóm này: Giống như việc rút bớt củi dưới đáy nồi để nước (âm dịch) không bị sôi cạn. Khi nhiệt độ hạ xuống, chân âm mới có điều kiện để phục hồi.

4. Nhóm Sinh huyết & Tàng huyết (Bổ Can du, Tỳ du, Bầu huyết linh)
Can tàng huyết: Can (gan) là kho chứa máu. Bổ Can du giúp kho lưu trữ luôn đầy đủ.

Tỳ sinh huyết: Tỳ là nguồn tạo ra máu. Bổ Tỳ du giúp bộ máy sản xuất hoạt động tốt.

Bầu huyết linh (Huyệt kinh nghiệm): Tên gọi này ám chỉ một vùng hoặc nhóm huyệt đặc hiệu giúp tập trung nguồn lực để tạo máu.

Kết quả: Khi Can và Tỳ phối hợp nhịp nhàng (Sản xuất + Lưu trữ), nguồn huyết dịch sẽ đổ về Tâm dồi dào. Theo nguyên lý "Tâm chủ huyết", khi có đủ máu để quản lý, Tâm sẽ trở nên mát mẻ, nhu nhuận và không còn bị hư hỏa quấy rối.' WHERE tieuket='Tâm Huyết Hư';
UPDATE benh_dong_y SET phuyet_chamcuu='Bổ: Thần môn, Chi chính, Tụy du, Tỳ du, Ý xá, Túc tam lý.', giainghia_phuyet='Dưới góc độ chuyên môn Y học cổ truyền, phương huyệt này thể hiện một tư duy trị liệu rất bài bản: "Hậu thiên nuôi dưỡng Tiền thiên" (lấy Tỳ Vị nuôi dưỡng Tâm) và phối hợp chặt chẽ giữa Kinh - Lạc - Du - Mộ.

Dưới đây là phân tích chi tiết từng nhóm:

1. Nhóm Tâm Khí Hư: Phép "Bổ Tâm thông qua Tỳ"
Đây là nhóm huyệt nền tảng, tập trung vào việc tăng cường nguồn năng lượng (khí) cho cơ thể:

Thần môn (Nguyên huyệt) & Chi chính (Lạc huyệt): Đây là cặp phối hợp Nguyên - Lạc. Thần môn giúp an thần, định chí; Chi chính thông suốt kinh khí từ Tiểu trường sang Tâm, giúp Tâm khí thêm vững mạnh.

Tụy du, Tỳ du, Ý xá, Túc tam lý: Đây là các huyệt thuộc kinh Túc thái dương Bàng quang và Túc dương minh Vị.

Mục đích: Tăng cường chức năng vận hóa của Tỳ (tiêu hóa), giúp tạo ra nhiều huyết và khí từ đồ ăn thức uống để cung cấp cho Tâm. Trong Đông y gọi là "Huyết hữu dư thì Tâm dương sung túc".

2. Nhóm Tâm Dương Hư: Tăng cường "Lửa" cho cơ thể
Đảm du & Dương cương: Hai huyệt này có tác dụng kích hoạt phần Dương khí (năng lượng nhiệt). Khi Tâm khí đã đủ mà người vẫn lạnh, mồ hôi tự ra (Dương hư) thì cần thêm nhóm này để "đốt lửa", sưởi ấm kinh mạch và tăng khả năng chống đỡ (sát khuẩn) của cơ thể.

3. Nhóm Cấp cứu & Suy tim (Tâm dương hư lâu ngày)
Khi bệnh diễn tiến nặng (tim to, suy tim), phép trị thay đổi sang "Tả thực - Bổ hư" phối hợp:

Tả Đại chùy, Trung phủ: * Đại chùy là nơi hội của các kinh Dương, tả ở đây để hạ bớt áp lực, điều hòa lại khí cơ đang rối loạn.

Trung phủ là Mộ huyệt của Phế, tả để giúp thông phế khí, hỗ trợ Tâm thúc đẩy huyết dịch (vì Phế chủ khí, Tâm chủ huyết).

Bổ Đản trung (Chiên trung), Du phủ: Đản trung là "hội của khí", bổ ở đây giúp tăng lực co bóp cho cơ tim.

Thái khê, Côn luân: Bổ Thận (Thái khê là Nguyên huyệt kinh Thận) để "Thông tâm thận". Thận thủy có vững thì mới hỗ trợ được Tâm hỏa, giúp ổn định nhịp tim và tăng thân nhiệt.

4. Nhóm Thấp tim: Khu phong, hóa thấp, thông lạc (Kỳ Huyệt)
Thấp tim trong YHCT thường thuộc chứng "Tý", gây ảnh hưởng đến Tâm. Các huyệt được chọn đều là những huyệt đặc hiệu (huyệt kinh nghiệm):

Thượng khích môn, Hạ hiệp bạch: Các huyệt nằm trên kinh Tâm và Tâm bào, có tác dụng thông suốt kinh lạc vùng ngực, giảm đau và chống viêm cho cơ tim.

Thận tân: Bổ sung tân dịch và hỗ trợ chức năng của Thận để đào thải độc tố (thấp nhiệt) ra ngoài.' WHERE tieuket='Tâm Khí Hư';
UPDATE benh_dong_y SET phuyet_chamcuu='Bổ: Cách du, Đởm du, Nội quan.
Tả: Thần môn, Chí dương, Đởm du, Phế du.', giainghia_phuyet='Bổ cách du, Đảm du là "Tứ hoa liệu pháp", là bài kinh nghiệm chữa lao do âm hư đã có ngàn năm lịch sử. Nội quan là chủ huyệt trị chứng âm huyết hao tổn. Tả thần môn là tả cái hư nhiệt của Tâm để an thần định chí. Tả chí dương, Đảm du, Phế du, là tả hoả ở phế, Đảm làm cho cái lò bễ nung nấu con tim phải hạ nhiệt, làm cho âm dịch không bị hao tổn mà giữ được chân âm. Bổ Can du, Tỳ du, Bầu huyết linh để cho công năng sinh huyết, tàng huyết của Can, Tỳ mạnh mẽ, tức là Tâm âm sẽ được dồi dào.' WHERE tieuket='Tâm Âm Hư';
UPDATE benh_dong_y SET phuyet_chamcuu='Cứu: Phong môn, Phế du, Thái khê, Côn luân, Phong long, Chiên trung.', giainghia_phuyet='Cứu phong môn, Phế du để làm ấm Phế tạng, đuổi hàn tà. Chiên trung, Phong long để bổ khí, hoá đàm hàn; Côn luân làm ấm nóng kinh Bàng quang và vùng thượng tiêu để cắt cơn hen suyễn; Côn luân, Thái khê nâng sức nóng toàn thân, trong đó có Thận dương để giúp cho Phế khí túc giáng dễ dàng mà dứt ho.' WHERE tieuket='Phế Dương Hư';
UPDATE benh_dong_y SET phuyet_chamcuu='a. Thể châm: Phong trì, khúc trì, Dương lăng tuyền, Hành gian.
b. Nhĩ châm: Can, Thận, Rãnh giáng áp hoặc các phương huyệt thể châm sau: (theo cách cẩm nang chẩn trị đông y…)
532- Cao huyết áp: Túc tam lý, Hợp cốc, Khúc trì
533- Cao huyết áp: Túc tam lý, Khúc trì, Nhân nghinh.
534- Cao huyết áp: Phong trì, khúc trì, Túc tam lý, Thái xung
535- Cao huyết áp: Phong trì, khúc trì, túc tam lý.
536- Cao huyết áp: Hành gian, Túc tam lý, nội quan.
	Các huyệt ở tân, kỳ huyệt sau:
234- Huyết áp điểm, kiên nội lăng, An miên 1, An miên 2, Tiền hậu ẩn châu, ấn đường, Tĩnh mạch sau tai, Tân khúc trì, Lạc linh ngũ, Nham trì.', giainghia_phuyet='Huyệt vị liệu pháp thuỷ châm.
Lấy huyệt: Túc tam lý, nội quan, hợp cốc, Tam âm giao. Mỗi lần lấy một huyệt chi trên, 1 huyệt chi dưới, luân lưu sử dụng các huyệt, mỗi lần tiêm Nôvôcain 0,25% một cm3, mỗi ngày một lần, 10-15 ngày là một liệu trình.
Tham khảo tây y.
Giáo sư Đặng Văn Chung đã viết về việc điều trị bệnh cao huyết áp trong sách “ Điều trị học” của ông như sau:
“Điều trị nội khoa có nhiều tiến bộ vì toàn diện, nhưng hiện nay chưa có phương pháp đặc hiệu làm giảm huyết áp xuống mức bình thường một cách lâu dài. Chỉ có thể làm giảm nhất thời huyết áp tăng quá cao và hạn chế những tai biến có thể xảy ra.
Người ta cũng chỉ biết được vài khâu trong toàn bộ cơ chế sinh bệnh tăng huyết áp nên việc phòng bệnh và ngừa biết chứng cũng khó khăn, ít kết quả “' WHERE tieuket='Huyễn Vận (Sung Huyết Não)';
UPDATE benh_dong_y SET phuyet_chamcuu='Châm cứu	
- Thiếu xung: Chích nặn máu.
- Tả: Đởm du, Dương cương, Thần môn, Chi chính.
- Tả: Can du, Thái xung.', giainghia_phuyet='Giải nghĩa phương huyệt (Theo phân tích của bạn):
Thiếu xung (Chích nặn máu): Giải tỏa cơn co thắt cơ tim và mạch vành. Vì Thiếu xung là Tỉnh huyệt hành Mộc, mà Mộc sinh Phong gây co thắt.
Tả Đởm du, Dương cương: Khứ kết ở Đởm. Đởm hết kết thì khí hành, khí hành thì huyết sẽ hành (hết ứ).
Tả Can du, Thái xung: Tả Can hỏa để triệt tiêu nguồn sinh Phong.
Tả Thần môn, Chi chính: Thông kinh hoạt lạc, hỗ trợ lưu thông huyết mạch tại Tâm.' WHERE tieuket='Tâm Huyết Ứ Trệ';
UPDATE benh_dong_y SET phuyet_chamcuu='- Tả: Tâm du, Thần đạo, Thiên tỉnh, Khúc trì.
- Bổ: Túc tam lý.', giainghia_phuyet='Tả Tâm du, Thần đạo, Thiên tỉnh: 

Nhằm thanh tả hỏa nhiệt ở kinh Tâm – tác nhân gây ra thần chí tán loạn, hoang tưởng, ảo giác và nói năng loạn ý.


Tả Khúc trì kết hợp Bổ Túc tam lý: 

Đây là phép phối hợp huyệt giúp giải phong tả nhiệt ở cơ bắp và gân cốt, rất hiệu quả trong việc điều trị chứng thao cuồng, vật vã, kích động.' WHERE tieuket='Đàm Hỏa Nhiễu Tâm';
UPDATE benh_dong_y SET phuyet_chamcuu='Bổ: Cách du, Đảm du, Nội quan, Túc tam lý, Tỳ du, Thận du, Tâm âm giao, Dương lăng tuyền.', giainghia_phuyet='Can dựa vào sự nuôi dưỡng của thận thuỷ, Can âm bất túc là do Thận âm bất túc, tinh không hoá huyết, huyết không dưỡng can mà ra. Do đó lấy cách du, Đảm du để bổ âm, Nội quan để bổ tâm huyết, Túc tam lý, Tỳ du để bổ Tỳ, tăng sức vận hoá của tỳ, làm cho nguồn dinh dưỡng từ Tỳ đem đến được dồi dào, bổ Thận du, Tam âm giao để bổ thận âm, âm tinh hoá huyết thì huyết sẽ dưỡng Can. Dương lăng tuyền là cân hộ, bổ Túc tam lý kết hợp với Dương lăng tuyền là cân hộ, bổ túc Tam lý kết hợp với duơng lăng tuyền sẽ làm cho gân, cơ chi dưới vững chắc, đi đững vững vàng.' WHERE tieuket='Can Âm Hư';
UPDATE benh_dong_y SET phuyet_chamcuu='- Vị hoả Tả: Đầu duy, Dương bạch, Hợp cốc, Giải khê, Khúc trì, Túc tam lý, Nội đình.

- Vị âm hư: lấy phương huyệt trên và thêm bổ: Nội quan, Tam âm giao. Nếu có mụn trong miệng, lợi răng sưng đau, lấy ty thêm các huyệt: Đoài đoan, Ngận giao, thường tương.
Xuất huyết dạ dầy: Thừa lăng, Kích môn.
- Chảy máu mũi: thượng tinh, Tố liêu.', giainghia_phuyet='Vị hoả thịnh, dương thịnh thì nhiệt làm phát sốt thì phiền thao vật vã. Lấy khúc trì, Túc tam lý để hạ nhiệt, dẫn hoả đi xuống làm cho dứt phiền thao vật vã. Hoả thịnh viêm lên, ép huyết "vọng hành" làm cho thổ huyết, nục huyết, lấy Đầu duy, Dương bạch Hợp cốc, Giải khê để tả nhiệt ở vùng trước trán. Đại lăng, Khích mônlà cặp huyệt trị vị nhiệt gây ra xuất huyết dạ dầy, thổ ra huyết, Thượng tinh, Tố liêu để cầm chứng mục huyết ( chảy máu mũi). Các huyệt Đoài đoan, Ngận giao, thừa tương, là huyệt chữa vòm miệng, lợi răng sưng đau tại chỗ rất hiệu nghiệm.
	Vị âm bất túc gây ra " âm hư sinh nội nhiệt" cần Bổ Nội quan, Tâm âm giao để bổ âm, trừ hư hoả.' WHERE tieuket='Vị Thực Nhiệt';
UPDATE benh_dong_y SET phuyet_chamcuu='Tả: Lệ đoài, Kinh cốt, Hởu khê. Bổ: Côn luân, Tân lặc đầu, Chiên trung, Phong long. Có đờm vàng dính, thêm tả đảm du, Dương lăng truyền.
	Có giãn phế quản, ho ra máu thì thêm: Đại chuỳ, Trung phủ.', giainghia_phuyet='Trong hầu có tiếng đờm, đờm dẻo mà nhiều, thực chất là tiết dịch xoang sau do viêm soang tạo ra, dịch đó chẩy xuống hầu, họng gây ra viêm họng và khí quản, phế quản. Nhóm huyệt lệ đoài, Kinh cốt, Hởu khê, đặc trị tiết dịch xoang sau. Dùng Côn luân để cắt cơn suyễn. Tân lặc đầu, Chiên trung, Phong long để chữa viêm phế quản có đờm ở phổi. Đại chuỳ, Trung phủ dùng hai huyệt một lúc có thể trị giãn phế quản gây ra trong đờm có máu, lạc huyết ồ ạt.' WHERE tieuket='Đàm Thấp Trở Phế';
UPDATE benh_dong_y SET phuyet_chamcuu='Chích: Thiếu thương và Xích trạch nặn máu. Tả: Khổng tối, Phế du, Phế nhiệt huyệt, Đại chuỳ, Trung phủ, Thái xung. Bổ: Túc tam lý, Tả Dương lăng tuyền.', giainghia_phuyet='Thiếu thương chích nặn máu có thể làm hạ nhiệt nhiều tạng cùng một lúc, vì Phế nhiệt thuộc về phần khí không chỉ do Phế gây ra. Xích trạch có tác dụng hạ nhiệt ở trường Vị, vì trường Vị nhiệt cũng góp phần quan trọng để gây ra Phế nhiệt. Khổng tối là khích huyệt ở kinh Phế có tác dụng trị các bệnh cấp tính của Phế. Phế du và Phế nhiệt huyệt có tác dụng gần nhất với phế tạng. Đại chuỳ là điểm giao hội của chư dương, cái dư ở dương khí được tả bớt thì khí cũng được mát theo. Trung phủ là mộ huyệt của Phế, khí của đường kinh Phế và Phế tạng tụ tập ở đây, tả có thể làm bớt đi cái hữu dư của tà nhiệt ở Phế. Bổ Túc Tam lý để dẫn hoả đi xuống, tả Thái xung là tả hoả ở Can để trừ Can hoả phản khắc Phế kim làm cho Phế đã táo thêm táo nhiệt mà gây ra đờm vàng và dính hoặc hôi tanh. Can nhiệt có đảm nhiệt là can đảm thực nhiệt, Tả Dương lăng tuyền để tả nhiệt của đảm.' WHERE tieuket='Đàm Nhiệt Úng Phế';
UPDATE benh_dong_y SET phuyet_chamcuu='Cứu hoặc châm bổ: Cách du, Đảm du, Phế du, thận du. Tả: Can du, Chí dương. Bổ: Nội quan, tam âm giao, túc tam lý. Tả: Hợp cốc. Bổ : Phục lưu.', giainghia_phuyet='2 Cách du, 2 Đảm du gọi là Tú hoa liệu pháp chữa lao phổi vô cùng hiệu quả. Bổ phế du, thận du là bổ thận âm và Phế âm. Tả Can du, Chí dương để tả Can, Đảm hoả vượng. Bộ nội quan, Tam âm giao là bổ âm huyết, bổ Túc tam lý đẻ dẫn hoả khí đi xuống. Tả hợp cốc, bổ Phục lưu để cầm mồ hôi không cho hao tổn âm tân.' WHERE tieuket='Thận Bất Nạp Khí';
UPDATE benh_dong_y SET phuyet_chamcuu='Bổ hoặc cứu: Bách hội, Thái khê, Côn luân, phế dư, Đảm du, Tỳ du, Thậndu, Bàng quang du, liệt khuyết, Quan nguyên, Khi hải, Quy lai. Tam âm giao.', giainghia_phuyet='Bách hội, Thái khê cặp huyệt trị chứng Thận dương hưu sinh ra choáng tiền đình và phân lỏng nhão, đồng thời Thái khê với côn luân sẽ nâng thân nhiệt lên và cắt được cơn hen suyễn do Thận dương hư gây ra. Bổ phế du, Đảm du là hai huyệt làm tăng hoạt động công năng của Phế, Đảm làm cho dương khí toàn thân tăng tiến. Bổ tỳ du Thận du, Bàng quang du là  Bổ tỳ, Thận ấm vùng lưng chữa chứng lưng gối mỏi đau. Liệt khuyết, cùng với Côn luân là cặp huyệt trị chứng đái không bình thường do khí hoá không bình thường gây ra. Quan nguyên đại bổ nguyên khí , đại boot khí dương. Khí hải, Quy lai, Tam âm giao là nhóm huyệt trị liệt dương có hiệu quả.
	Tóc dụng do Thận dương hư chỉ cần thái khê là đủ, nhưng thường thì thận đương hư còn gây ra suy ra suy nhược của nhiều chức năng cho nên ta cứ dùng thêm Đốc du, Hạ liêm cho tăng hiệu quả. Nên nhớ rằng trong hơn 300 huyệt toàn thân chỉ có ba huyệt trên có ba tác dụng chuyên chữa tóc dụng mà thôi.' WHERE tieuket='Thận Dương Hư';
UPDATE benh_dong_y SET phuyet_chamcuu='Tâm và Thận giúp nhau chế ước, giúp nhau trợ sinh, cùng phò cùng thành, bổ Thần môn, Nội quan là cặp bổ tâm âm, chữa chứng hồi hộp, mạch nhanh sẽ được chậm lại; bổ Tam âm giao để bổ Thận âm giúp cho Tâm âm chế ngự Tâm dương mà an thần dẽ ngủ. Thiếu dương để điều hoà nhịp thở, do nhịp thở có quan hệ đến nhịp tim, nhịp thở ổn định thì nhịp tim ổn định, vì thế cùng với tâm du, Thần môn làm cho Tâm lực, trí nhớ tăng tiến. Dũng tuyền có nghĩa là  con suối phun ngược lên mạnh mẽ, bổ Dũng tuyền tức là tăng thêm khả năng của Thận thuỷ chế Tâm hoả, tâm hoả được dẹp thì thần minh trở lại trong sáng tỉnh táo, vì thế Dũng tuyền thường được dùng trong cấp cứu choáng ngất với chức năng khai khiếu, tỉnh thần.', giainghia_phuyet='' WHERE tieuket='Tâm Thận Bất Giao';
UPDATE benh_dong_y SET phuyet_chamcuu='Thể châm: Đại chuỳ, Huyết hải, Khúc trì, Tam âm giao, dị ứng mẩn ngứa mạn tính lấy huyệt Đại trường du làm chủ.Do ăn vật gây dị ứng và có đau bụng, ỉa chảy thì châm thêm Túc tam lý. Ngực buồn bằn thở gấp, châm thêm Hợp cốc, Nội quan. 
Nhĩ châm: Phế khu, thận thượng tuyến khu, Thần môn, Nội phân bí khu. Hoặc trích nặn máu tĩnh mạch nhỏ sau tai.
Thời gian mắc bệnh, kiêng ăn cá, tôm, cua là vật phát động phong.
Phương huyệt kinh nghiệm (kinh huyệt).
629- Dị ứng mẩn ngứa: Khúc trì, huyết hải
630- Dị ứng mẩn ngứa:Phong môn, Khúc trì, Liệt khuyết, Túc tam lý,tam âm giao
631- Dị ứng mẩn ngứa: Cách du, khúc trì, huyết hải
632- Dị ứng mẩn ngứa: huyết hải, Khúc trì, Liệt khuyết, Túc tam lý, Tam âm giao
633- Nổi mề đay ngứa: Khúc trì, Đại truỳ
634- Phong chẩn: Kiên gương, Dương khê.
635- Phỏng chẩn khắp người: hợp cốc, Khúc trì, Phương huyệt kinh nghiệm (Tân, Kỳ huyệt).
348- Bệnh ngoài da: Tĩnh mạch sau tai
349- Viêm bì thần kinh: Bát phong, Thượng bát phong.
350- Phong nhiệt ẩn chẩn: Kiên nội lăng.
351- Dị ứng mẩn ngứa: Bách trùng sào, Định suyễn, Bách chủng phong Chỉ dương.
352- Quá mẫn cảm viêm da: Chỉ dương.
(Trích ở sách “Cẩm nàng……” ở các trang 757-758-791).', giainghia_phuyet='' WHERE tieuket='Bệnh Dị Ứng';
UPDATE benh_dong_y SET phuyet_chamcuu='Bổ: tỳ du, Vị du, Đảm du, Thần môn , Chi chính
Tả: Hợp cốc, bổ tỳ Túc tam lý, Đại chung ,Thông lý.', giainghia_phuyet='Bổ tỳ du, Vị du là bổ tỳ, Vị, Tỳ vị  khoẻ thì mới có thể vận hoá thấp trọc. Bổ Đảm du là để trừ hàn khí ở Đảm ,vì đảm hàn thì khí trệ, khí trệ thì khí không hoá, sinh ra chứng đàm ngưng kinh lạc mà xuất hiện mệt mỏi. Tả hợp cốc, bổ Túc tam lý là để vận Tỳ hóa thấp ở đầu mặt, trị chứng đầu nặng như có vật đè, Đại chung ghi trong, là phương chữa  chứng ngại nói ham nằm do thấp khốn gây ra đã được ghi trong "Bách chứng phú".' WHERE tieuket='Tỳ Vị Thấp Khốn';

-- 3) Nguyên nhân của PHÁP TRỊ, khớp theo thể bệnh (50)
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'tinh-than', 'Lo nghĩ quá độ', 0 FROM phap_tri pt WHERE pt.the_benh='Tỳ Dương Khí Hư' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Lo nghĩ quá độ' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'tang-phu', 'Thận dương hư suy', 6 FROM phap_tri pt WHERE pt.the_benh='Tỳ Dương Khí Hư' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Thận dương hư suy' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'tang-phu', 'Tỳ vị hư nhược lâu ngày', 5 FROM phap_tri pt WHERE pt.the_benh='Tỳ Dương Khí Hư' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Tỳ vị hư nhược lâu ngày' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'sinh-hoat', 'Lao động quá sức', 4 FROM phap_tri pt WHERE pt.the_benh='Tỳ Dương Khí Hư' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Lao động quá sức' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'sinh-hoat', 'Ăn đồ sống lạnh', 3 FROM phap_tri pt WHERE pt.the_benh='Tỳ Dương Khí Hư' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Ăn đồ sống lạnh' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'sinh-hoat', 'Ăn uống không điều độ', 2 FROM phap_tri pt WHERE pt.the_benh='Tỳ Dương Khí Hư' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Ăn uống không điều độ' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'tinh-than', 'Căng thẳng kéo dài', 1 FROM phap_tri pt WHERE pt.the_benh='Tỳ Dương Khí Hư' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Căng thẳng kéo dài' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'sinh-hoat', 'Ăn uống thất thường', 0 FROM phap_tri pt WHERE pt.the_benh='Tỳ Bất Thống Huyết' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Ăn uống thất thường' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'sinh-hoat', 'Lao lực quá độ', 6 FROM phap_tri pt WHERE pt.the_benh='Tỳ Bất Thống Huyết' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Lao lực quá độ' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'tinh-than', 'Tâm tư u uất', 5 FROM phap_tri pt WHERE pt.the_benh='Tỳ Bất Thống Huyết' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Tâm tư u uất' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'tinh-than', 'Lo nghĩ quá độ', 4 FROM phap_tri pt WHERE pt.the_benh='Tỳ Bất Thống Huyết' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Lo nghĩ quá độ' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'tang-phu', 'Khí hư không nhiếp huyết', 3 FROM phap_tri pt WHERE pt.the_benh='Tỳ Bất Thống Huyết' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Khí hư không nhiếp huyết' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'tang-phu', 'Tỳ vị hư nhược', 2 FROM phap_tri pt WHERE pt.the_benh='Tỳ Bất Thống Huyết' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Tỳ vị hư nhược' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'sinh-hoat', 'Lao lực quá sức', 1 FROM phap_tri pt WHERE pt.the_benh='Tỳ Bất Thống Huyết' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Lao lực quá sức' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'tinh-than', 'Lao tâm tổn trí', 2 FROM phap_tri pt WHERE pt.the_benh='Trung Khí Hạ Hãm' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Lao tâm tổn trí' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'sinh-hoat', 'Ăn uống thất thường', 0 FROM phap_tri pt WHERE pt.the_benh='Trung Khí Hạ Hãm' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Ăn uống thất thường' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'sinh-hoat', 'Lao động quá sức', 1 FROM phap_tri pt WHERE pt.the_benh='Trung Khí Hạ Hãm' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Lao động quá sức' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'tinh-than', 'Lo nghĩ quá độ', 3 FROM phap_tri pt WHERE pt.the_benh='Trung Khí Hạ Hãm' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Lo nghĩ quá độ' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'tang-phu', 'Tỳ khí bất túc', 4 FROM phap_tri pt WHERE pt.the_benh='Trung Khí Hạ Hãm' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Tỳ khí bất túc' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'tang-phu', 'Tỳ vị hư nhược', 5 FROM phap_tri pt WHERE pt.the_benh='Trung Khí Hạ Hãm' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Tỳ vị hư nhược' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'sinh-hoat', 'Dùng thuốc tả hạ quá mức', 6 FROM phap_tri pt WHERE pt.the_benh='Trung Khí Hạ Hãm' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Dùng thuốc tả hạ quá mức' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'sinh-hoat', 'Dùng nhiều thức ăn sống lạnh', 7 FROM phap_tri pt WHERE pt.the_benh='Trung Khí Hạ Hãm' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Dùng nhiều thức ăn sống lạnh' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'tang-phu', 'Tỳ vị hư tổn', 8 FROM phap_tri pt WHERE pt.the_benh='Trung Khí Hạ Hãm' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Tỳ vị hư tổn' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'tinh-than', 'Lo âu quá độ làm tổn thương phế khí', 0 FROM phap_tri pt WHERE pt.the_benh='Phế Khí Hư' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Lo âu quá độ làm tổn thương phế khí' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'sinh-hoat', 'Cơ thể suy nhược sau bệnh nặng', 1 FROM phap_tri pt WHERE pt.the_benh='Phế Khí Hư' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Cơ thể suy nhược sau bệnh nặng' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'sinh-hoat', 'Lao lực quá độ', 2 FROM phap_tri pt WHERE pt.the_benh='Phế Khí Hư' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Lao lực quá độ' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'sinh-hoat', 'Tiếp xúc ngoại tà kéo dài', 3 FROM phap_tri pt WHERE pt.the_benh='Phế Khí Hư' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Tiếp xúc ngoại tà kéo dài' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'tang-phu', 'Tỳ khí hư không sinh được phế khí', 4 FROM phap_tri pt WHERE pt.the_benh='Phế Khí Hư' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Tỳ khí hư không sinh được phế khí' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'tang-phu', 'Thận khí hư không nạp được khí', 5 FROM phap_tri pt WHERE pt.the_benh='Phế Khí Hư' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Thận khí hư không nạp được khí' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'sinh-hoat', 'Sống nơi ẩm thấp lạnh lẽo', 3 FROM phap_tri pt WHERE pt.the_benh='Thận Dương Hư' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Sống nơi ẩm thấp lạnh lẽo' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'tang-phu', 'Bệnh mạn tính làm suy giảm nguyên dương', 5 FROM phap_tri pt WHERE pt.the_benh='Thận Dương Hư' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Bệnh mạn tính làm suy giảm nguyên dương' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'tinh-than', 'Lo nghĩ quá độ tổn thương thận khí', 0 FROM phap_tri pt WHERE pt.the_benh='Thận Dương Hư' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Lo nghĩ quá độ tổn thương thận khí' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'sinh-hoat', 'Lao động quá sức', 1 FROM phap_tri pt WHERE pt.the_benh='Thận Dương Hư' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Lao động quá sức' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'sinh-hoat', 'Sinh hoạt tình dục không điều độ', 2 FROM phap_tri pt WHERE pt.the_benh='Thận Dương Hư' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Sinh hoạt tình dục không điều độ' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'tang-phu', 'Tỳ dương hư lâu ngày không khỏi', 4 FROM phap_tri pt WHERE pt.the_benh='Thận Dương Hư' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Tỳ dương hư lâu ngày không khỏi' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'sinh-hoat', 'Thiếu vận động', 7 FROM phap_tri pt WHERE pt.the_benh='Can Khí Uất Kết' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Thiếu vận động' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'tinh-than', 'Uất ức, giận dữ', 5 FROM phap_tri pt WHERE pt.the_benh='Can Khí Uất Kết' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Uất ức, giận dữ' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'tinh-than', 'Kìm nén cảm xúc', 4 FROM phap_tri pt WHERE pt.the_benh='Can Khí Uất Kết' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Kìm nén cảm xúc' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'tinh-than', 'Căng thẳng kéo dài', 3 FROM phap_tri pt WHERE pt.the_benh='Can Khí Uất Kết' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Căng thẳng kéo dài' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'tang-phu', 'Tỳ hư không sinh đủ huyết nuôi Can', 2 FROM phap_tri pt WHERE pt.the_benh='Can Khí Uất Kết' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Tỳ hư không sinh đủ huyết nuôi Can' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'sinh-hoat', 'Ăn uống thất thường, ít vận động', 1 FROM phap_tri pt WHERE pt.the_benh='Can Khí Uất Kết' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Ăn uống thất thường, ít vận động' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'tinh-than', 'Căng thẳng, kìm nén cảm xúc kéo dài', 0 FROM phap_tri pt WHERE pt.the_benh='Can Khí Uất Kết' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Căng thẳng, kìm nén cảm xúc kéo dài' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'tang-phu', 'Can mất khả năng sơ tiết', 8 FROM phap_tri pt WHERE pt.the_benh='Can Khí Uất Kết' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Can mất khả năng sơ tiết' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'sinh-hoat', 'Lối sống áp lực', 6 FROM phap_tri pt WHERE pt.the_benh='Can Khí Uất Kết' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Lối sống áp lực' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'sinh-hoat', 'Ăn uống thiếu dinh dưỡng', 3 FROM phap_tri pt WHERE pt.the_benh='Tâm Dương Khí Hư' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Ăn uống thiếu dinh dưỡng' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'sinh-hoat', 'Lao lực quá sức', 2 FROM phap_tri pt WHERE pt.the_benh='Tâm Dương Khí Hư' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Lao lực quá sức' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'tinh-than', 'Tâm tư u uất', 1 FROM phap_tri pt WHERE pt.the_benh='Tâm Dương Khí Hư' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Tâm tư u uất' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'tinh-than', 'Lo nghĩ quá độ', 0 FROM phap_tri pt WHERE pt.the_benh='Tâm Dương Khí Hư' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Lo nghĩ quá độ' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'tang-phu', 'Thận dương suy yếu', 5 FROM phap_tri pt WHERE pt.the_benh='Tâm Dương Khí Hư' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Thận dương suy yếu' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO phap_tri_nguyen_nhan (id_phap_tri, nhom, noi_dung, thu_tu) SELECT pt.id, 'tang-phu', 'Tỳ dương hư tổn', 4 FROM phap_tri pt WHERE pt.the_benh='Tâm Dương Khí Hư' AND NOT EXISTS (SELECT 1 FROM phap_tri_nguyen_nhan z WHERE z.id_phap_tri=pt.id AND z.noi_dung='Tỳ dương hư tổn' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));

-- 4) Nguyên nhân của THỂ ĐO, khớp theo tên thể (177)
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Lo lắng quá độ', 0 FROM benh_dong_y_excel b WHERE b.name='Thận âm dương lưỡng hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Lo lắng quá độ' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Suy nghĩ nhiều', 1 FROM benh_dong_y_excel b WHERE b.name='Thận âm dương lưỡng hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Suy nghĩ nhiều' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Sợ hãi kéo dài', 2 FROM benh_dong_y_excel b WHERE b.name='Thận âm dương lưỡng hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Sợ hãi kéo dài' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Lao động quá sức', 3 FROM benh_dong_y_excel b WHERE b.name='Thận âm dương lưỡng hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Lao động quá sức' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Ân ái quá độ', 4 FROM benh_dong_y_excel b WHERE b.name='Thận âm dương lưỡng hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Ân ái quá độ' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Ăn uống không điều độ', 5 FROM benh_dong_y_excel b WHERE b.name='Thận âm dương lưỡng hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Ăn uống không điều độ' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Thức khuya, thiếu ngủ', 6 FROM benh_dong_y_excel b WHERE b.name='Thận âm dương lưỡng hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Thức khuya, thiếu ngủ' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Tỳ vị hư yếu lâu ngày', 7 FROM benh_dong_y_excel b WHERE b.name='Thận âm dương lưỡng hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Tỳ vị hư yếu lâu ngày' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Phế khí hư suy', 8 FROM benh_dong_y_excel b WHERE b.name='Thận âm dương lưỡng hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Phế khí hư suy' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Can khí uất kết', 9 FROM benh_dong_y_excel b WHERE b.name='Thận âm dương lưỡng hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Can khí uất kết' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Căng thẳng kéo dài', 0 FROM benh_dong_y_excel b WHERE b.name='Tâm huyết ứ trệ' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Căng thẳng kéo dài' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Uất ức, giận dữ', 1 FROM benh_dong_y_excel b WHERE b.name='Tâm huyết ứ trệ' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Uất ức, giận dữ' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Lao lực quá độ', 2 FROM benh_dong_y_excel b WHERE b.name='Tâm huyết ứ trệ' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Lao lực quá độ' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Chế độ ăn uống thất thường', 3 FROM benh_dong_y_excel b WHERE b.name='Tâm huyết ứ trệ' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Chế độ ăn uống thất thường' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Can khí uất kết', 4 FROM benh_dong_y_excel b WHERE b.name='Tâm huyết ứ trệ' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Can khí uất kết' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Tâm khí hư suy', 5 FROM benh_dong_y_excel b WHERE b.name='Tâm huyết ứ trệ' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Tâm khí hư suy' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Căng thẳng kéo dài', 0 FROM benh_dong_y_excel b WHERE b.name='Đởm nhiệt' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Căng thẳng kéo dài' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Uất ức, giận dữ', 1 FROM benh_dong_y_excel b WHERE b.name='Đởm nhiệt' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Uất ức, giận dữ' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Ăn nhiều đồ cay nóng', 2 FROM benh_dong_y_excel b WHERE b.name='Đởm nhiệt' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Ăn nhiều đồ cay nóng' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Uống nhiều rượu bia', 3 FROM benh_dong_y_excel b WHERE b.name='Đởm nhiệt' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Uống nhiều rượu bia' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Can hỏa vượng', 4 FROM benh_dong_y_excel b WHERE b.name='Đởm nhiệt' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Can hỏa vượng' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Đởm khí uất kết', 5 FROM benh_dong_y_excel b WHERE b.name='Đởm nhiệt' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Đởm khí uất kết' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Đàm thấp nội sinh', 0 FROM benh_dong_y_excel b WHERE b.name='Đàm Mê Tâm Khiếu' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Đàm thấp nội sinh' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Thấp trệ tích tụ', 1 FROM benh_dong_y_excel b WHERE b.name='Đàm Mê Tâm Khiếu' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Thấp trệ tích tụ' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Ưu tư uất ức kéo dài', 2 FROM benh_dong_y_excel b WHERE b.name='Đàm Mê Tâm Khiếu' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Ưu tư uất ức kéo dài' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Tỳ vị hư nhược', 3 FROM benh_dong_y_excel b WHERE b.name='Đàm Mê Tâm Khiếu' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Tỳ vị hư nhược' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Uất ức kéo dài', 4 FROM benh_dong_y_excel b WHERE b.name='Đàm Mê Tâm Khiếu' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Uất ức kéo dài' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Ăn uống không điều độ', 5 FROM benh_dong_y_excel b WHERE b.name='Đàm Mê Tâm Khiếu' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Ăn uống không điều độ' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Lo nghĩ quá độ', 6 FROM benh_dong_y_excel b WHERE b.name='Đàm Mê Tâm Khiếu' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Lo nghĩ quá độ' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Đàm trọc bế tắc tâm khiếu', 7 FROM benh_dong_y_excel b WHERE b.name='Đàm Mê Tâm Khiếu' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Đàm trọc bế tắc tâm khiếu' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Tỳ hư không vận hóa được thủy thấp', 8 FROM benh_dong_y_excel b WHERE b.name='Đàm Mê Tâm Khiếu' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Tỳ hư không vận hóa được thủy thấp' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Kinh sợ quá độ', 9 FROM benh_dong_y_excel b WHERE b.name='Đàm Mê Tâm Khiếu' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Kinh sợ quá độ' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Uất ức lâu ngày', 10 FROM benh_dong_y_excel b WHERE b.name='Đàm Mê Tâm Khiếu' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Uất ức lâu ngày' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Ăn uống thất thường', 11 FROM benh_dong_y_excel b WHERE b.name='Đàm Mê Tâm Khiếu' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Ăn uống thất thường' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Tỳ hư sinh đàm', 12 FROM benh_dong_y_excel b WHERE b.name='Đàm Mê Tâm Khiếu' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Tỳ hư sinh đàm' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Can khí uất kết', 13 FROM benh_dong_y_excel b WHERE b.name='Đàm Mê Tâm Khiếu' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Can khí uất kết' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Uống nhiều rượu bia', 0 FROM benh_dong_y_excel b WHERE b.name='Đàm hoả nội nhiễu' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Uống nhiều rượu bia' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Ăn uống nhiều đồ béo ngọt', 1 FROM benh_dong_y_excel b WHERE b.name='Đàm hoả nội nhiễu' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Ăn uống nhiều đồ béo ngọt' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Tỳ vị vận hóa kém', 2 FROM benh_dong_y_excel b WHERE b.name='Đàm hoả nội nhiễu' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Tỳ vị vận hóa kém' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Can hỏa vượng', 3 FROM benh_dong_y_excel b WHERE b.name='Đàm hoả nội nhiễu' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Can hỏa vượng' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Căng thẳng kéo dài', 4 FROM benh_dong_y_excel b WHERE b.name='Đàm hoả nội nhiễu' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Căng thẳng kéo dài' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Uất ức, giận dữ', 5 FROM benh_dong_y_excel b WHERE b.name='Đàm hoả nội nhiễu' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Uất ức, giận dữ' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Uất ức lâu ngày hóa hỏa', 6 FROM benh_dong_y_excel b WHERE b.name='Đàm hoả nội nhiễu' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Uất ức lâu ngày hóa hỏa' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Căng thẳng thần kinh', 7 FROM benh_dong_y_excel b WHERE b.name='Đàm hoả nội nhiễu' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Căng thẳng thần kinh' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Ăn uống nhiều chất béo ngọt', 8 FROM benh_dong_y_excel b WHERE b.name='Đàm hoả nội nhiễu' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Ăn uống nhiều chất béo ngọt' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Lạm dụng rượu bia', 9 FROM benh_dong_y_excel b WHERE b.name='Đàm hoả nội nhiễu' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Lạm dụng rượu bia' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Tỳ vị hư nhược vận hóa kém', 10 FROM benh_dong_y_excel b WHERE b.name='Đàm hoả nội nhiễu' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Tỳ vị hư nhược vận hóa kém' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Can hỏa vượng gây nhiễu tâm', 11 FROM benh_dong_y_excel b WHERE b.name='Đàm hoả nội nhiễu' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Can hỏa vượng gây nhiễu tâm' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Lo âu suy nghĩ quá độ', 0 FROM benh_dong_y_excel b WHERE b.name='Tâm âm hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Lo âu suy nghĩ quá độ' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Căng thẳng kéo dài', 1 FROM benh_dong_y_excel b WHERE b.name='Tâm âm hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Căng thẳng kéo dài' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Lao lực quá sức', 2 FROM benh_dong_y_excel b WHERE b.name='Tâm âm hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Lao lực quá sức' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Thức khuya thường xuyên', 3 FROM benh_dong_y_excel b WHERE b.name='Tâm âm hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Thức khuya thường xuyên' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Thận âm hư tổn', 4 FROM benh_dong_y_excel b WHERE b.name='Tâm âm hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Thận âm hư tổn' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Hỏa vượng thiêu đốt tâm âm', 5 FROM benh_dong_y_excel b WHERE b.name='Tâm âm hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Hỏa vượng thiêu đốt tâm âm' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Lo âu, suy nghĩ quá độ', 6 FROM benh_dong_y_excel b WHERE b.name='Tâm âm hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Lo âu, suy nghĩ quá độ' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Lao lực quá độ', 7 FROM benh_dong_y_excel b WHERE b.name='Tâm âm hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Lao lực quá độ' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Thức khuya, thiếu ngủ', 8 FROM benh_dong_y_excel b WHERE b.name='Tâm âm hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Thức khuya, thiếu ngủ' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Thận âm hư không nuôi dưỡng Tâm', 9 FROM benh_dong_y_excel b WHERE b.name='Tâm âm hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Thận âm hư không nuôi dưỡng Tâm' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Hỏa nhiệt làm tổn thương âm dịch', 10 FROM benh_dong_y_excel b WHERE b.name='Tâm âm hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Hỏa nhiệt làm tổn thương âm dịch' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Căng thẳng tinh thần kéo dài', 11 FROM benh_dong_y_excel b WHERE b.name='Tâm âm hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Căng thẳng tinh thần kéo dài' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Lo lắng quá độ', 0 FROM benh_dong_y_excel b WHERE b.name='Tâm Dương Hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Lo lắng quá độ' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Suy nghĩ nhiều', 1 FROM benh_dong_y_excel b WHERE b.name='Tâm Dương Hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Suy nghĩ nhiều' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Lao động quá sức', 2 FROM benh_dong_y_excel b WHERE b.name='Tâm Dương Hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Lao động quá sức' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Ăn uống không điều độ', 3 FROM benh_dong_y_excel b WHERE b.name='Tâm Dương Hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Ăn uống không điều độ' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Sống ở nơi ẩm thấp lạnh lẽo', 4 FROM benh_dong_y_excel b WHERE b.name='Tâm Dương Hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Sống ở nơi ẩm thấp lạnh lẽo' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Tỳ Vị hư yếu lâu ngày', 5 FROM benh_dong_y_excel b WHERE b.name='Tâm Dương Hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Tỳ Vị hư yếu lâu ngày' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Thận Dương không giúp được Tâm', 6 FROM benh_dong_y_excel b WHERE b.name='Tâm Dương Hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Thận Dương không giúp được Tâm' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Căng thẳng kéo dài', 0 FROM benh_dong_y_excel b WHERE b.name='Tâm Khí Hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Căng thẳng kéo dài' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Lao lực quá sức', 1 FROM benh_dong_y_excel b WHERE b.name='Tâm Khí Hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Lao lực quá sức' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Dinh dưỡng kém', 2 FROM benh_dong_y_excel b WHERE b.name='Tâm Khí Hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Dinh dưỡng kém' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Tỳ khí hư tổn', 3 FROM benh_dong_y_excel b WHERE b.name='Tâm Khí Hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Tỳ khí hư tổn' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Bệnh lâu ngày suy nhược', 4 FROM benh_dong_y_excel b WHERE b.name='Tâm Khí Hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Bệnh lâu ngày suy nhược' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Lo nghĩ quá độ', 5 FROM benh_dong_y_excel b WHERE b.name='Tâm Khí Hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Lo nghĩ quá độ' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Lo lắng quá mức', 6 FROM benh_dong_y_excel b WHERE b.name='Tâm Khí Hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Lo lắng quá mức' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Suy nghĩ nhiều', 7 FROM benh_dong_y_excel b WHERE b.name='Tâm Khí Hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Suy nghĩ nhiều' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Tình chí bất điều', 8 FROM benh_dong_y_excel b WHERE b.name='Tâm Khí Hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Tình chí bất điều' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Lao động trí óc quá sức', 9 FROM benh_dong_y_excel b WHERE b.name='Tâm Khí Hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Lao động trí óc quá sức' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Ăn uống thất thường', 10 FROM benh_dong_y_excel b WHERE b.name='Tâm Khí Hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Ăn uống thất thường' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Thiếu ngủ kéo dài', 11 FROM benh_dong_y_excel b WHERE b.name='Tâm Khí Hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Thiếu ngủ kéo dài' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Tỳ Vị hư yếu', 12 FROM benh_dong_y_excel b WHERE b.name='Tâm Khí Hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Tỳ Vị hư yếu' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Thận âm hư', 13 FROM benh_dong_y_excel b WHERE b.name='Tâm Khí Hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Thận âm hư' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Tỳ dương hư tổn', 0 FROM benh_dong_y_excel b WHERE b.name='Tâm Dương Hư Suy' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Tỳ dương hư tổn' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Nhiễm lạnh lâu ngày', 1 FROM benh_dong_y_excel b WHERE b.name='Tâm Dương Hư Suy' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Nhiễm lạnh lâu ngày' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Ăn uống thiếu chất', 2 FROM benh_dong_y_excel b WHERE b.name='Tâm Dương Hư Suy' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Ăn uống thiếu chất' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Lao lực quá sức', 3 FROM benh_dong_y_excel b WHERE b.name='Tâm Dương Hư Suy' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Lao lực quá sức' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Lo nghĩ quá độ', 4 FROM benh_dong_y_excel b WHERE b.name='Tâm Dương Hư Suy' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Lo nghĩ quá độ' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Tâm tư u uất', 5 FROM benh_dong_y_excel b WHERE b.name='Tâm Dương Hư Suy' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Tâm tư u uất' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Thận dương suy yếu', 6 FROM benh_dong_y_excel b WHERE b.name='Tâm Dương Hư Suy' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Thận dương suy yếu' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Lo lắng, suy nghĩ nhiều', 7 FROM benh_dong_y_excel b WHERE b.name='Tâm Dương Hư Suy' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Lo lắng, suy nghĩ nhiều' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Sợ hãi quá độ', 8 FROM benh_dong_y_excel b WHERE b.name='Tâm Dương Hư Suy' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Sợ hãi quá độ' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Lao động quá sức', 9 FROM benh_dong_y_excel b WHERE b.name='Tâm Dương Hư Suy' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Lao động quá sức' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Ăn uống không điều độ', 10 FROM benh_dong_y_excel b WHERE b.name='Tâm Dương Hư Suy' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Ăn uống không điều độ' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Thức khuya, thiếu ngủ kéo dài', 11 FROM benh_dong_y_excel b WHERE b.name='Tâm Dương Hư Suy' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Thức khuya, thiếu ngủ kéo dài' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Tỳ Vị hư yếu', 12 FROM benh_dong_y_excel b WHERE b.name='Tâm Dương Hư Suy' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Tỳ Vị hư yếu' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Thận Dương không đủ', 13 FROM benh_dong_y_excel b WHERE b.name='Tâm Dương Hư Suy' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Thận Dương không đủ' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Căng thẳng kéo dài', 0 FROM benh_dong_y_excel b WHERE b.name='Tâm hoả thượng viêm' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Căng thẳng kéo dài' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Uất ức, giận dữ', 1 FROM benh_dong_y_excel b WHERE b.name='Tâm hoả thượng viêm' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Uất ức, giận dữ' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Ăn nhiều đồ cay nóng', 2 FROM benh_dong_y_excel b WHERE b.name='Tâm hoả thượng viêm' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Ăn nhiều đồ cay nóng' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Thức khuya, thiếu ngủ', 3 FROM benh_dong_y_excel b WHERE b.name='Tâm hoả thượng viêm' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Thức khuya, thiếu ngủ' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Can hỏa vượng', 4 FROM benh_dong_y_excel b WHERE b.name='Tâm hoả thượng viêm' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Can hỏa vượng' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Âm hư hỏa vượng', 5 FROM benh_dong_y_excel b WHERE b.name='Tâm hoả thượng viêm' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Âm hư hỏa vượng' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Tức giận, uất hận kéo dài', 6 FROM benh_dong_y_excel b WHERE b.name='Tâm hoả thượng viêm' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Tức giận, uất hận kéo dài' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Lo lắng, suy nghĩ nhiều', 7 FROM benh_dong_y_excel b WHERE b.name='Tâm hoả thượng viêm' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Lo lắng, suy nghĩ nhiều' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Ăn nhiều đồ cay nóng, nhiều dầu mỡ', 8 FROM benh_dong_y_excel b WHERE b.name='Tâm hoả thượng viêm' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Ăn nhiều đồ cay nóng, nhiều dầu mỡ' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Can khí uất kết hóa hỏa', 9 FROM benh_dong_y_excel b WHERE b.name='Tâm hoả thượng viêm' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Can khí uất kết hóa hỏa' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Tỳ vị thấp nhiệt', 10 FROM benh_dong_y_excel b WHERE b.name='Tâm hoả thượng viêm' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Tỳ vị thấp nhiệt' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Tỳ vị hư nhược', 0 FROM benh_dong_y_excel b WHERE b.name='Tâm huyết hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Tỳ vị hư nhược' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Lao lực quá sức', 1 FROM benh_dong_y_excel b WHERE b.name='Tâm huyết hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Lao lực quá sức' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Lo nghĩ quá độ', 2 FROM benh_dong_y_excel b WHERE b.name='Tâm huyết hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Lo nghĩ quá độ' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Căng thẳng kéo dài', 3 FROM benh_dong_y_excel b WHERE b.name='Tâm huyết hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Căng thẳng kéo dài' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Mất máu sau bệnh', 4 FROM benh_dong_y_excel b WHERE b.name='Tâm huyết hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Mất máu sau bệnh' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Ăn uống thiếu chất', 5 FROM benh_dong_y_excel b WHERE b.name='Tâm huyết hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Ăn uống thiếu chất' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Hỏa truyền sang tiểu trường', 0 FROM benh_dong_y_excel b WHERE b.name='Tâm di nhiệt sang tiểu trường' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Hỏa truyền sang tiểu trường' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Lo nghĩ quá độ', 1 FROM benh_dong_y_excel b WHERE b.name='Tâm di nhiệt sang tiểu trường' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Lo nghĩ quá độ' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Uất ức kéo dài', 2 FROM benh_dong_y_excel b WHERE b.name='Tâm di nhiệt sang tiểu trường' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Uất ức kéo dài' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Ăn nhiều đồ cay nóng', 3 FROM benh_dong_y_excel b WHERE b.name='Tâm di nhiệt sang tiểu trường' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Ăn nhiều đồ cay nóng' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Uống nhiều rượu bia', 4 FROM benh_dong_y_excel b WHERE b.name='Tâm di nhiệt sang tiểu trường' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Uống nhiều rượu bia' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Tâm hỏa vượng', 5 FROM benh_dong_y_excel b WHERE b.name='Tâm di nhiệt sang tiểu trường' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Tâm hỏa vượng' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Căng thẳng kéo dài', 6 FROM benh_dong_y_excel b WHERE b.name='Tâm di nhiệt sang tiểu trường' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Căng thẳng kéo dài' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Uất ức, giận dữ', 7 FROM benh_dong_y_excel b WHERE b.name='Tâm di nhiệt sang tiểu trường' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Uất ức, giận dữ' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Hỏa nhiệt truyền sang tiểu trường', 8 FROM benh_dong_y_excel b WHERE b.name='Tâm di nhiệt sang tiểu trường' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Hỏa nhiệt truyền sang tiểu trường' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Lo nghĩ quá độ làm tổn thương Tỳ', 0 FROM benh_dong_y_excel b WHERE b.name='Tỳ dương hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Lo nghĩ quá độ làm tổn thương Tỳ' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Ăn uống không điều độ', 1 FROM benh_dong_y_excel b WHERE b.name='Tỳ dương hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Ăn uống không điều độ' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Ăn nhiều đồ sống lạnh', 2 FROM benh_dong_y_excel b WHERE b.name='Tỳ dương hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Ăn nhiều đồ sống lạnh' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Lao động quá sức', 3 FROM benh_dong_y_excel b WHERE b.name='Tỳ dương hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Lao động quá sức' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Bệnh lâu ngày làm Tỳ dương suy yếu', 4 FROM benh_dong_y_excel b WHERE b.name='Tỳ dương hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Bệnh lâu ngày làm Tỳ dương suy yếu' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Thận dương hư không ôn ấm được Tỳ', 5 FROM benh_dong_y_excel b WHERE b.name='Tỳ dương hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Thận dương hư không ôn ấm được Tỳ' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Ăn uống không điều độ', 0 FROM benh_dong_y_excel b WHERE b.name='Đại Trường Thấp Nhiệt' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Ăn uống không điều độ' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Thường xuyên ăn đồ cay nóng', 1 FROM benh_dong_y_excel b WHERE b.name='Đại Trường Thấp Nhiệt' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Thường xuyên ăn đồ cay nóng' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Uống nhiều rượu bia', 2 FROM benh_dong_y_excel b WHERE b.name='Đại Trường Thấp Nhiệt' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Uống nhiều rượu bia' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Cảm nhiễm thấp nhiệt ngoại tà', 3 FROM benh_dong_y_excel b WHERE b.name='Đại Trường Thấp Nhiệt' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Cảm nhiễm thấp nhiệt ngoại tà' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Tỳ vị vận hóa kém', 4 FROM benh_dong_y_excel b WHERE b.name='Đại Trường Thấp Nhiệt' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Tỳ vị vận hóa kém' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Thấp nhiệt tích trệ đại trường', 5 FROM benh_dong_y_excel b WHERE b.name='Đại Trường Thấp Nhiệt' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Thấp nhiệt tích trệ đại trường' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Căng thẳng kéo dài', 0 FROM benh_dong_y_excel b WHERE b.name='Can khí uất kết' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Căng thẳng kéo dài' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Kìm nén cảm xúc', 1 FROM benh_dong_y_excel b WHERE b.name='Can khí uất kết' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Kìm nén cảm xúc' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Uất ức, giận dữ', 2 FROM benh_dong_y_excel b WHERE b.name='Can khí uất kết' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Uất ức, giận dữ' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Lối sống áp lực', 3 FROM benh_dong_y_excel b WHERE b.name='Can khí uất kết' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Lối sống áp lực' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Thiếu vận động', 4 FROM benh_dong_y_excel b WHERE b.name='Can khí uất kết' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Thiếu vận động' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Can khí sơ tiết kém', 5 FROM benh_dong_y_excel b WHERE b.name='Can khí uất kết' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Can khí sơ tiết kém' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Căng thẳng, stress kéo dài', 6 FROM benh_dong_y_excel b WHERE b.name='Can khí uất kết' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Căng thẳng, stress kéo dài' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Tức giận, uất ức không được giải tỏa', 7 FROM benh_dong_y_excel b WHERE b.name='Can khí uất kết' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Tức giận, uất ức không được giải tỏa' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Chế độ ăn uống không điều độ', 8 FROM benh_dong_y_excel b WHERE b.name='Can khí uất kết' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Chế độ ăn uống không điều độ' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Thức khuya, thiếu ngủ', 9 FROM benh_dong_y_excel b WHERE b.name='Can khí uất kết' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Thức khuya, thiếu ngủ' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Ít vận động', 10 FROM benh_dong_y_excel b WHERE b.name='Can khí uất kết' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Ít vận động' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Can khí phạm tỳ vị', 11 FROM benh_dong_y_excel b WHERE b.name='Can khí uất kết' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Can khí phạm tỳ vị' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Can khí ảnh hưởng đến tâm', 12 FROM benh_dong_y_excel b WHERE b.name='Can khí uất kết' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Can khí ảnh hưởng đến tâm' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Suy nghĩ quá nhiều', 6 FROM benh_dong_y_excel b WHERE b.name='Tâm huyết hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Suy nghĩ quá nhiều' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Lo lắng, muộn phiền kéo dài', 7 FROM benh_dong_y_excel b WHERE b.name='Tâm huyết hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Lo lắng, muộn phiền kéo dài' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Kích động, sợ hãi quá độ', 8 FROM benh_dong_y_excel b WHERE b.name='Tâm huyết hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Kích động, sợ hãi quá độ' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Lao động trí óc quá sức', 9 FROM benh_dong_y_excel b WHERE b.name='Tâm huyết hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Lao động trí óc quá sức' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Mất ngủ, ngủ không sâu giấc', 10 FROM benh_dong_y_excel b WHERE b.name='Tâm huyết hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Mất ngủ, ngủ không sâu giấc' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Ăn uống không điều độ, thiếu dinh dưỡng', 11 FROM benh_dong_y_excel b WHERE b.name='Tâm huyết hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Ăn uống không điều độ, thiếu dinh dưỡng' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Tỳ vị hư yếu sinh hóa huyết kém', 12 FROM benh_dong_y_excel b WHERE b.name='Tâm huyết hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Tỳ vị hư yếu sinh hóa huyết kém' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Căng thẳng kéo dài', 0 FROM benh_dong_y_excel b WHERE b.name='Can vị bất hoà' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Căng thẳng kéo dài' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Uất ức, giận dữ', 1 FROM benh_dong_y_excel b WHERE b.name='Can vị bất hoà' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Uất ức, giận dữ' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Tâm trạng không thoải mái', 2 FROM benh_dong_y_excel b WHERE b.name='Can vị bất hoà' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Tâm trạng không thoải mái' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Ăn uống thất thường', 3 FROM benh_dong_y_excel b WHERE b.name='Can vị bất hoà' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Ăn uống thất thường' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Ăn không đúng giờ', 4 FROM benh_dong_y_excel b WHERE b.name='Can vị bất hoà' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Ăn không đúng giờ' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Can khí uất kết', 5 FROM benh_dong_y_excel b WHERE b.name='Can vị bất hoà' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Can khí uất kết' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Vị khí nghịch lên', 6 FROM benh_dong_y_excel b WHERE b.name='Can vị bất hoà' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Vị khí nghịch lên' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Kìm nén cảm xúc', 7 FROM benh_dong_y_excel b WHERE b.name='Can vị bất hoà' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Kìm nén cảm xúc' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Thói quen ăn uống vội vàng', 8 FROM benh_dong_y_excel b WHERE b.name='Can vị bất hoà' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Thói quen ăn uống vội vàng' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Can mộc khắc Tỳ thổ', 9 FROM benh_dong_y_excel b WHERE b.name='Can vị bất hoà' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Can mộc khắc Tỳ thổ' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Thận tinh bất túc ảnh hưởng tâm thận', 13 FROM benh_dong_y_excel b WHERE b.name='Tâm huyết hư' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Thận tinh bất túc ảnh hưởng tâm thận' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Lo lắng, suy nghĩ nhiều', 0 FROM benh_dong_y_excel b WHERE b.name='Tâm Thận Bất Giao' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Lo lắng, suy nghĩ nhiều' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Kích động, dễ sợ hãi', 1 FROM benh_dong_y_excel b WHERE b.name='Tâm Thận Bất Giao' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Kích động, dễ sợ hãi' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Tâm trạng bất ổn kéo dài', 2 FROM benh_dong_y_excel b WHERE b.name='Tâm Thận Bất Giao' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Tâm trạng bất ổn kéo dài' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Lao động trí óc quá sức', 3 FROM benh_dong_y_excel b WHERE b.name='Tâm Thận Bất Giao' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Lao động trí óc quá sức' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Thức khuya nhiều', 4 FROM benh_dong_y_excel b WHERE b.name='Tâm Thận Bất Giao' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Thức khuya nhiều' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Quan hệ tình dục không điều độ', 5 FROM benh_dong_y_excel b WHERE b.name='Tâm Thận Bất Giao' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Quan hệ tình dục không điều độ' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Thận âm hư tổn', 6 FROM benh_dong_y_excel b WHERE b.name='Tâm Thận Bất Giao' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Thận âm hư tổn' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Tâm hỏa vượng', 7 FROM benh_dong_y_excel b WHERE b.name='Tâm Thận Bất Giao' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Tâm hỏa vượng' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Căng thẳng kéo dài', 8 FROM benh_dong_y_excel b WHERE b.name='Tâm Thận Bất Giao' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Căng thẳng kéo dài' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tinh-than', 'Sợ hãi quá độ', 9 FROM benh_dong_y_excel b WHERE b.name='Tâm Thận Bất Giao' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Sợ hãi quá độ' AND COALESCE(z.nhom,'')=COALESCE('tinh-than',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'sinh-hoat', 'Ăn uống không điều độ', 10 FROM benh_dong_y_excel b WHERE b.name='Tâm Thận Bất Giao' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Ăn uống không điều độ' AND COALESCE(z.nhom,'')=COALESCE('sinh-hoat',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Thận âm hư', 11 FROM benh_dong_y_excel b WHERE b.name='Tâm Thận Bất Giao' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Thận âm hư' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));
INSERT INTO benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel, nhom, noi_dung, thu_tu) SELECT b.id, 'tang-phu', 'Tâm huyết hư', 12 FROM benh_dong_y_excel b WHERE b.name='Tâm Thận Bất Giao' AND NOT EXISTS (SELECT 1 FROM benh_dong_y_excel_nguyen_nhan z WHERE z.id_benh_dong_y_excel=b.id AND z.noi_dung='Tâm huyết hư' AND COALESCE(z.nhom,'')=COALESCE('tang-phu',''));

-- 5) Liên kết Triệu chứng - Pháp trị (935)
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sợ Lạnh' WHERE pt.the_benh='Hàn Thấp Nội Uẩn' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Phân Nát' WHERE pt.the_benh='Hàn Thấp Nội Uẩn' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mặt Trắng Bệch' WHERE pt.the_benh='Hàn Thấp Nội Uẩn' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='sắc mặt tối' WHERE pt.the_benh='Hàn Thấp Nội Uẩn' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sốt' WHERE pt.the_benh='Bàng Quang Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='đau lưng' WHERE pt.the_benh='Bàng Quang Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu Nhiều Lần' WHERE pt.the_benh='Bàng Quang Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu Gấp' WHERE pt.the_benh='Bàng Quang Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu buốt' WHERE pt.the_benh='Bàng Quang Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Hàn Nhiệt Vãng Lai' WHERE pt.the_benh='Can Đởm Uất Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu Nhiều Lần' WHERE pt.the_benh='Can Đởm Uất Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu Gấp' WHERE pt.the_benh='Can Đởm Uất Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu buốt' WHERE pt.the_benh='Can Đởm Uất Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Chóng mặt' WHERE pt.the_benh='Thận Âm Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sốt nhẹ' WHERE pt.the_benh='Thận Âm Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Họng Khát' WHERE pt.the_benh='Thận Âm Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Môi Khô' WHERE pt.the_benh='Thận Âm Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Khó Tiêu' WHERE pt.the_benh='Tỳ Vị Lưỡng Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='bụng đầy' WHERE pt.the_benh='Tỳ Vị Lưỡng Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đại Tiện không thành Khuôn' WHERE pt.the_benh='Tỳ Vị Lưỡng Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='đau lưng' WHERE pt.the_benh='Trung Khí Hạ Hãm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Vô Lực' WHERE pt.the_benh='Trung Khí Hạ Hãm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mặt Sắc Trắng' WHERE pt.the_benh='Trung Khí Hạ Hãm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu Máu' WHERE pt.the_benh='Trung Khí Hạ Hãm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sốt' WHERE pt.the_benh='Nhiệt Kết Bàng Quang' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='đau lưng' WHERE pt.the_benh='Nhiệt Kết Bàng Quang' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu buốt' WHERE pt.the_benh='Nhiệt Kết Bàng Quang' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu Máu' WHERE pt.the_benh='Nhiệt Kết Bàng Quang' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='đau lưng' WHERE pt.the_benh='Khí Trệ Huyết Ứ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Bụng Chướng' WHERE pt.the_benh='Khí Trệ Huyết Ứ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu Máu' WHERE pt.the_benh='Khí Trệ Huyết Ứ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu buốt' WHERE pt.the_benh='Khí Trệ Huyết Ứ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='đau đầu' WHERE pt.the_benh='Can Dương Thượng Kháng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='hoa mắt' WHERE pt.the_benh='Can Dương Thượng Kháng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mặt Đỏ' WHERE pt.the_benh='Can Dương Thượng Kháng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đắng Miệng' WHERE pt.the_benh='Can Dương Thượng Kháng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Chóng mặt' WHERE pt.the_benh='Can Thận  Âm Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu Nhiều' WHERE pt.the_benh='Can Thận  Âm Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Hung Phiền' WHERE pt.the_benh='Đàm Thấp Ủng Thịnh' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ăn Ít' WHERE pt.the_benh='Đàm Thấp Ủng Thịnh' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='buồn nôn' WHERE pt.the_benh='Đàm Thấp Ủng Thịnh' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đàm Dãi' WHERE pt.the_benh='Đàm Thấp Ủng Thịnh' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu Nhiều Lần' WHERE pt.the_benh='Hạ Tiêu Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu Gấp' WHERE pt.the_benh='Hạ Tiêu Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu buốt' WHERE pt.the_benh='Hạ Tiêu Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu Mủ' WHERE pt.the_benh='Hạ Tiêu Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mỏi Lưng' WHERE pt.the_benh='Hạ Tiêu Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu Ít' WHERE pt.the_benh='Khí Trệ Nội Trở' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Hoặc Bí Tiểu' WHERE pt.the_benh='Khí Trệ Nội Trở' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Khó Tiêu' WHERE pt.the_benh='Khí Trệ Nội Trở' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='chán ăn' WHERE pt.the_benh='Khí Trệ Nội Trở' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mỏi Lưng' WHERE pt.the_benh='Thấp Nhiệt Hỗ Kết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='phiền táo' WHERE pt.the_benh='Thấp Nhiệt Hỗ Kết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Miệng  Có Mùi Khai' WHERE pt.the_benh='Thấp Nhiệt Hỗ Kết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưng Gối Mỏi Yếu' WHERE pt.the_benh='Thận Khí Bất Cố' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sắc Trắng Bệch' WHERE pt.the_benh='Thận Khí Bất Cố' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu Nhiều Lần' WHERE pt.the_benh='Thận Khí Bất Cố' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sốt' WHERE pt.the_benh='Thấp Nhiệt Hạ Chú' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Thời Kỳ Cuối Có Tiểu Máu' WHERE pt.the_benh='Thấp Nhiệt Hạ Chú' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mệt Mỏi' WHERE pt.the_benh='Nhiệt Tà Thương Dinh' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mỏi Lưng' WHERE pt.the_benh='Nhiệt Tà Thương Dinh' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Xuất Tinh Ra Máu' WHERE pt.the_benh='Nhiệt Tà Thương Dinh' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Yếu Sinh Lý' WHERE pt.the_benh='Nhiệt Tà Thương Dinh' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tinh Hoàn Kết Cứng' WHERE pt.the_benh='Thận Khuy Can Uất' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='miệng khô' WHERE pt.the_benh='Thận Khuy Can Uất' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Thích Uống' WHERE pt.the_benh='Thận Khuy Can Uất' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tinh Hoàn Kết Cứng' WHERE pt.the_benh='Hàn Thấp Hiệp Đàm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Chóng mặt' WHERE pt.the_benh='Âm Dương Lưỡng Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='đau đầu' WHERE pt.the_benh='Âm Dương Lưỡng Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mỏi Lưng' WHERE pt.the_benh='Âm Dương Lưỡng Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu nhiều' WHERE pt.the_benh='Âm Dương Lưỡng Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sợ Lạnh' WHERE pt.the_benh='Hàn Thấp Hiệp Đàm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi Bệu' WHERE pt.the_benh='Hàn Thấp Hiệp Đàm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tinh Hoàn Sưng Đỏ' WHERE pt.the_benh='Can Kinh Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sốt' WHERE pt.the_benh='Can Kinh Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='miệng khô' WHERE pt.the_benh='Can Kinh Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='ù tai' WHERE pt.the_benh='Thận Hư Thất Tàng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Hoạt Tinh' WHERE pt.the_benh='Thận Hư Thất Tàng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sắc Trắng Bệch' WHERE pt.the_benh='Thận Hư Thất Tàng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Chóng mặt' WHERE pt.the_benh='Thận Hư Thất Tàng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Di tinh' WHERE pt.the_benh='Thấp Nhiệt Nội Uẩn' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu Đỏ' WHERE pt.the_benh='Thấp Nhiệt Nội Uẩn' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='miệng khô' WHERE pt.the_benh='Thấp Nhiệt Nội Uẩn' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đắng Miệng' WHERE pt.the_benh='Thấp Nhiệt Nội Uẩn' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mệt Mỏi' WHERE pt.the_benh='Tâm Thận Bất Giao' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='mất ngủ' WHERE pt.the_benh='Tâm Thận Bất Giao' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='hay quên' WHERE pt.the_benh='Tâm Thận Bất Giao' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Xuất Tinh Sớm' WHERE pt.the_benh='Tâm Thận Bất Giao' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Xuất Tinh Sớm' WHERE pt.the_benh='Âm Hư Hỏa Vượng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='miệng khô' WHERE pt.the_benh='Âm Hư Hỏa Vượng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Thích Uống' WHERE pt.the_benh='Âm Hư Hỏa Vượng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi Đỏ' WHERE pt.the_benh='Âm Hư Hỏa Vượng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mệt Mỏi' WHERE pt.the_benh='Hạ Nguyên Bất Cố' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu Ra Dưỡng Chấp' WHERE pt.the_benh='Hạ Nguyên Bất Cố' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mặt Sắc Trắng' WHERE pt.the_benh='Hạ Nguyên Bất Cố' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Chi lạnh' WHERE pt.the_benh='Hạ Nguyên Bất Cố' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Chóng mặt' WHERE pt.the_benh='Mệnh Môn Hỏa Suy' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sắc Trắng Bệch' WHERE pt.the_benh='Mệnh Môn Hỏa Suy' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mệt Mỏi' WHERE pt.the_benh='Mệnh Môn Hỏa Suy' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Gối Mềm Yếu' WHERE pt.the_benh='Mệnh Môn Hỏa Suy' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu Không Thông' WHERE pt.the_benh='Thấp Nhiệt Uẩn Kết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Nhiệt Kết hoặc bí Tiểu' WHERE pt.the_benh='Thấp Nhiệt Uẩn Kết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='tiểu rắt' WHERE pt.the_benh='Phế Nhiệt Ủng Thịnh' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='họng khô' WHERE pt.the_benh='Phế Nhiệt Ủng Thịnh' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Thích Uống' WHERE pt.the_benh='Phế Nhiệt Ủng Thịnh' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tia Tiểu Yếu' WHERE pt.the_benh='Thận Khí Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sắc Trắng Bệch' WHERE pt.the_benh='Thận Khí Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Vị Hàn' WHERE pt.the_benh='Thận Khí Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mỏi Lưng' WHERE pt.the_benh='Hàn Thấp Nghi Can' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Âm Nang Sưng Đau Trĩu Xuống' WHERE pt.the_benh='Hàn Thấp Nghi Can' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Phù Thũng' WHERE pt.the_benh='Phong Thủy Phạm Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu Máu' WHERE pt.the_benh='Phong Thủy Phạm Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ho' WHERE pt.the_benh='Phong Thủy Phạm Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Phát Sốt' WHERE pt.the_benh='Phong Thủy Phạm Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Phù Thũng' WHERE pt.the_benh='Hỏa Nhiệt Uẩn Thận' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Phát Sốt' WHERE pt.the_benh='Hỏa Nhiệt Uẩn Thận' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu Máu Đại Thể' WHERE pt.the_benh='Hỏa Nhiệt Uẩn Thận' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Phù Thũng' WHERE pt.the_benh='Can Thận Âm Suy' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='đau đầu' WHERE pt.the_benh='Can Thận Âm Suy' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='hoa mắt' WHERE pt.the_benh='Can Thận Âm Suy' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mỏi Lưng' WHERE pt.the_benh='Can Thận Âm Suy' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Phù Thũng' WHERE pt.the_benh='Thận Dương Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mặt Trắng Bệch' WHERE pt.the_benh='Thận Dương Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sợ Lạnh' WHERE pt.the_benh='Thận Dương Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mỏi Lưng' WHERE pt.the_benh='Thận Dương Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Da Phát Ban Đỏ' WHERE pt.the_benh='Tâm Tỳ Tích Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Miệng Lưỡi Lở Loét' WHERE pt.the_benh='Tâm Tỳ Tích Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Khoang Miệng Lở Loét' WHERE pt.the_benh='Tâm Hoả Thượng Viêm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mặt Mọc Đinh Nhọt' WHERE pt.the_benh='Tâm Hoả Thượng Viêm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Nặng Bụng Dưới' WHERE pt.the_benh='Tiểu Trường Khí Trệ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đầy Tức' WHERE pt.the_benh='Tiểu Trường Khí Trệ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Trướng Đau' WHERE pt.the_benh='Tiểu Trường Khí Trệ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mặt Nổi Mụn Sẩn' WHERE pt.the_benh='Nhiệt Phế Hun Chưng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Vùng Mũi Mọc Nhọt Độc' WHERE pt.the_benh='Nhiệt Phế Hun Chưng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Bụng Đầy Trướng Đau' WHERE pt.the_benh='Đại Trường Ứ Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Bụng Dưới Ấn Đau' WHERE pt.the_benh='Đại Trường Ứ Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Bụng Đầy Trướng' WHERE pt.the_benh='Đại Trường Táo Kết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Nhiệt Thịnh' WHERE pt.the_benh='Đại Trường Táo Kết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Táo Bón' WHERE pt.the_benh='Đại Trường Táo Kết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Hậu Môn Sa Xuống, Đau' WHERE pt.the_benh='Đại Trường Thấp Nhiệt Hạ Huyết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Cầu Ra Máu Đỏ Tươi' WHERE pt.the_benh='Đại Trường Thấp Nhiệt Hạ Huyết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Phù Mặt Và Tay Chân' WHERE pt.the_benh='Tỳ Thấp Sinh Đàm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Nổi U Cục' WHERE pt.the_benh='Tỳ Thấp Sinh Đàm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Miệng Môi Khô' WHERE pt.the_benh='Can Hỏa Vị Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Vú Sưng Đau' WHERE pt.the_benh='Can Hỏa Vị Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau họng' WHERE pt.the_benh='Vị Hỏa Thượng Viêm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='miệng khô' WHERE pt.the_benh='Vị Hỏa Thượng Viêm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mang Tai Sưng Đỏ' WHERE pt.the_benh='Vị Hỏa Thượng Viêm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ngực Sườn Trướng Đau' WHERE pt.the_benh='Can Khí Uất Kết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tình Chí Uất Ức' WHERE pt.the_benh='Can Khí Uất Kết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Phát Sốt' WHERE pt.the_benh='Can Hỏa Thượng Viêm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sườn đau' WHERE pt.the_benh='Can Hỏa Thượng Viêm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mụn Rộp nổi quanh Vùng Eo Lưng' WHERE pt.the_benh='Can Hỏa Thượng Viêm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Miệng Loét' WHERE pt.the_benh='Can Tỳ Lưỡng Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Vết Thương Lở Loét Lâu Ngày, Không Liều Miệng' WHERE pt.the_benh='Can Tỳ Lưỡng Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Chóng mặt' WHERE pt.the_benh='Can Thận Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='ù tai' WHERE pt.the_benh='Can Thận Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Cốt Chưng' WHERE pt.the_benh='Can Thận Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Triều Nhiệt' WHERE pt.the_benh='Can Thận Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='tức ngực' WHERE pt.the_benh='Can Đởm Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau Sườn' WHERE pt.the_benh='Can Đởm Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='đầy bụng' WHERE pt.the_benh='Can Đởm Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Táo Bón' WHERE pt.the_benh='Can Đởm Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Xương Cột Sống Đau Mỏi' WHERE pt.the_benh='Thận Khuy Cốt Không' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Chi lạnh' WHERE pt.the_benh='Thận Khuy Cốt Không' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Gối Mềm Yếu' WHERE pt.the_benh='Thận Khuy Cốt Không' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu Nhiều Lần' WHERE pt.the_benh='Bàng Quang Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu Gấp' WHERE pt.the_benh='Bàng Quang Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sỏi' WHERE pt.the_benh='Bàng Quang Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu Nhỏ Giọt' WHERE pt.the_benh='Bàng Quang Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tê Tay Chân' WHERE pt.the_benh='Khí Trệ Huyết Ứ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sưng Đau' WHERE pt.the_benh='Khí Trệ Huyết Ứ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi Tím' WHERE pt.the_benh='Khí Trệ Huyết Ứ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mạch Sáp' WHERE pt.the_benh='Khí Trệ Huyết Ứ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='U Cục' WHERE pt.the_benh='Ứ Huyết Ngưng Trệ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Máu Tụ Sưng, Ấn Đau' WHERE pt.the_benh='Ứ Huyết Ngưng Trệ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Da Sắc Đỏ Tím' WHERE pt.the_benh='Huyết Ứ Hoá Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Phát Sốt' WHERE pt.the_benh='Huyết Ứ Hoá Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='mạch sác' WHERE pt.the_benh='Huyết Ứ Hoá Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Dịch Mủ Trong Loãng' WHERE pt.the_benh='Khí Hư Huyết Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi Nhạt' WHERE pt.the_benh='Khí Hư Huyết Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='mạch Tế' WHERE pt.the_benh='Khí Hư Huyết Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Chóng mặt' WHERE pt.the_benh='Trung Khí Hạ Hãm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mệt Mỏi' WHERE pt.the_benh='Trung Khí Hạ Hãm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='sa nội tạng' WHERE pt.the_benh='Trung Khí Hạ Hãm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Da khô' WHERE pt.the_benh='Dinh Vệ Bất Hoà' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Hành Kinh Da Nổi Sẩn' WHERE pt.the_benh='Xung Nhâm Thất Điều' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Chảy Máu Đầu Vú' WHERE pt.the_benh='Xung Nhâm Thất Điều' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='U Cục Ở Vú' WHERE pt.the_benh='Xung Nhâm Thất Điều' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tứ Chi Quyết Lạnh' WHERE pt.the_benh='Hư Hãn' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mạch Tế Muốn Tuyệt' WHERE pt.the_benh='Hư Hãn' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Âm Dịch Hao Tổn' WHERE pt.the_benh='Can Hãm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi Đỏ' WHERE pt.the_benh='Can Hãm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mạch Sác' WHERE pt.the_benh='Can Hãm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Hỏa Độc Tích Thịnh' WHERE pt.the_benh='Hoả Hãm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Hôn mê' WHERE pt.the_benh='Hoả Hãm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Kinh Quyết' WHERE pt.the_benh='Hoả Hãm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sốt Cao' WHERE pt.the_benh='Tẩu Hoàng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Phát Ban' WHERE pt.the_benh='Tẩu Hoàng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Hôn mê' WHERE pt.the_benh='Tẩu Hoàng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Nói Nhảm' WHERE pt.the_benh='Tẩu Hoàng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Áp Xe Tự Vỡ' WHERE pt.the_benh='Hoả Độc Kết Tụ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sưng Đau, Không Chịu Nổi' WHERE pt.the_benh='Hoả Độc Kết Tụ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sưng Đỏ Đau' WHERE pt.the_benh='Thấp Nhiệt Độc Thịnh' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Rêu Lưỡi Vàng' WHERE pt.the_benh='Thấp Nhiệt Độc Thịnh' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mạch Sác' WHERE pt.the_benh='Thấp Nhiệt Độc Thịnh' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đầu Mặt Kết Độc' WHERE pt.the_benh='Ngoại Cảm Thử Độc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Phát Sốt' WHERE pt.the_benh='Ngoại Cảm Thử Độc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mạch Sác' WHERE pt.the_benh='Ngoại Cảm Thử Độc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Má Sưng Đau' WHERE pt.the_benh='Phong Ôn Thời Độc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Da Nóng, Sưng Đỏ' WHERE pt.the_benh='Phong Ôn Thời Độc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sợ Lạnh' WHERE pt.the_benh='Phong Độc Ngoại Xâm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Phát Sốt' WHERE pt.the_benh='Phong Độc Ngoại Xâm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Nổi Cục' WHERE pt.the_benh='Phong Độc Ngoại Xâm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sưng Đau' WHERE pt.the_benh='Phong Độc Ngoại Xâm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Nổi Cục' WHERE pt.the_benh='Đàm Hoả Ngưng Kết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sưng Đỏ Ấn Đau' WHERE pt.the_benh='Đàm Hoả Ngưng Kết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Khối U Cứng Chắc' WHERE pt.the_benh='Đàm Trọc Hỗ Kết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Không Di Động' WHERE pt.the_benh='Đàm Trọc Hỗ Kết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Da Cơ Sưng Nóng' WHERE pt.the_benh='Hoả Tà Tích Thịnh' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi Đỏ' WHERE pt.the_benh='Hoả Tà Tích Thịnh' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mạch Sác' WHERE pt.the_benh='Hoả Tà Tích Thịnh' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mặt Mọc Mụn Trứng Cá' WHERE pt.the_benh='Táo Phạm Bì Mao' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mũi Đỏ' WHERE pt.the_benh='Táo Phạm Bì Mao' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Da khô' WHERE pt.the_benh='Táo Phạm Bì Mao' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Chi Đỏ Sưng Đau' WHERE pt.the_benh='Thấp Nhiệt Hạ Chú' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu Vàng' WHERE pt.the_benh='Thấp Nhiệt Hạ Chú' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Rêu Nhờn' WHERE pt.the_benh='Thấp Nhiệt Hạ Chú' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Phát Sốt' WHERE pt.the_benh='Thấp Nhiệt Uẩn Trở' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='miệng đắng' WHERE pt.the_benh='Thấp Nhiệt Uẩn Trở' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu Đỏ' WHERE pt.the_benh='Thấp Nhiệt Uẩn Trở' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Rêu Nhờn' WHERE pt.the_benh='Thấp Nhiệt Uẩn Trở' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Viêm Trên Da, Đỏ Ngứa, Tiết dịch' WHERE pt.the_benh='Thử Thấp Hun Chưng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Nhọt ở Đầu Mặt Đễ vễ và mưng Mủ' WHERE pt.the_benh='Thử Nhiệt Uẩn Uất' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Chi Lạnh,Tê Sưng, Đau Xương' WHERE pt.the_benh='Hàn Đàm Trở Lạc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Hạch sưng Đỏ kết Độc' WHERE pt.the_benh='Phong Thấp Khách Biểu' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Nổi Bọng Nước Ngứa Ngáy' WHERE pt.the_benh='Phong Thấp Khách Biểu' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Da Nổi Mụn Đỏ' WHERE pt.the_benh='Phong Nhiệt Ngoại Phạm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Bệnh Càng Nặng' WHERE pt.the_benh='Phong Nhiệt Ngoại Phạm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Da Nổi Mụn Trắng' WHERE pt.the_benh='Phong Hàn Ngoại Tập' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Gặp Lạnh bệnh  càng tăng nặng' WHERE pt.the_benh='Phong Hàn Ngoại Tập' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Da vàng' WHERE pt.the_benh='Thấp Nhiệt Hun Chưng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mắt Vàng' WHERE pt.the_benh='Thấp Nhiệt Hun Chưng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu Vàng' WHERE pt.the_benh='Thấp Nhiệt Hun Chưng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Táo Bón' WHERE pt.the_benh='Thấp Nhiệt Hun Chưng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='sắc mặt tối' WHERE pt.the_benh='Thấp Nhiệt Thai Hoàng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Rêu Trắng' WHERE pt.the_benh='Thấp Nhiệt Thai Hoàng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sốt' WHERE pt.the_benh='Ngoại Cảm Phong Hàn' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sợ Lạnh' WHERE pt.the_benh='Ngoại Cảm Phong Hàn' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Nghẹt Mũi' WHERE pt.the_benh='Ngoại Cảm Phong Hàn' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Rêu Trắng' WHERE pt.the_benh='Ngoại Cảm Phong Hàn' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sốt' WHERE pt.the_benh='Ngoại Cảm Phong Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ho' WHERE pt.the_benh='Ngoại Cảm Phong Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Miệng Khát' WHERE pt.the_benh='Ngoại Cảm Phong Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sốt' WHERE pt.the_benh='Cảm Thụ Phong Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Họng Đỏ' WHERE pt.the_benh='Cảm Thụ Phong Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Họng Đỏ, Sưng Đau, Ngứa Tiết dịch' WHERE pt.the_benh='Cảm Thụ Phong Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ho' WHERE pt.the_benh='Phong Hàn Khái Thấu' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sốt nhẹ' WHERE pt.the_benh='Phong Hàn Khái Thấu' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ho đàm trong' WHERE pt.the_benh='Phong Hàn Khái Thấu' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Rêu Trắng' WHERE pt.the_benh='Phong Hàn Khái Thấu' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sốt' WHERE pt.the_benh='Phong Nhiệt Khái Thấu' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Họng Đỏ' WHERE pt.the_benh='Phong Nhiệt Khái Thấu' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ho đàm trong' WHERE pt.the_benh='Phong Nhiệt Khái Thấu' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sắc Lưỡi Không Tươi' WHERE pt.the_benh='Phong Nhiệt Khái Thấu' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ho' WHERE pt.the_benh='Đàm Nhiệt Ủng Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Thở Gấp' WHERE pt.the_benh='Đàm Nhiệt Ủng Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đàm Dính' WHERE pt.the_benh='Đàm Nhiệt Ủng Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi Đỏ' WHERE pt.the_benh='Đàm Nhiệt Ủng Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mình hàn (sợ lạnh)' WHERE pt.the_benh='Thời Kỳ Sơ Khởi' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sốt Cao' WHERE pt.the_benh='Thời Kỳ Nung Mủ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau Ngực' WHERE pt.the_benh='Thời Kỳ Nung Mủ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ho' WHERE pt.the_benh='Thời Kỳ Nung Mủ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Thở Gấp' WHERE pt.the_benh='Thời Kỳ Nung Mủ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mệt Mỏi' WHERE pt.the_benh='Hàn Đàm Ủng Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ăn Ít' WHERE pt.the_benh='Hàn Đàm Ủng Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='sắc mặt vàng' WHERE pt.the_benh='Hàn Đàm Ủng Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi Nhạt' WHERE pt.the_benh='Hàn Đàm Ủng Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sốt' WHERE pt.the_benh='Phế Vị Tích Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Khoang Miệng Lở Loét' WHERE pt.the_benh='Phế Vị Tích Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Chảy Dãi' WHERE pt.the_benh='Phế Vị Tích Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Phân Nát' WHERE pt.the_benh='Tỳ Hư Tiết Tả' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Khó Tiêu' WHERE pt.the_benh='Tỳ Hư Tiết Tả' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi Nhạt' WHERE pt.the_benh='Tỳ Hư Tiết Tả' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Rêu Trắng' WHERE pt.the_benh='Tỳ Hư Tiết Tả' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Người Nóng' WHERE pt.the_benh='Thấp Nhiệt Tiết Tả' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='phân nát hoặc ỉa lổng kéo dài' WHERE pt.the_benh='Thấp Nhiệt Tiết Tả' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau Bụng Âm Ỉ' WHERE pt.the_benh='Hư Hàn Chứng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sắc Mặt Trắng' WHERE pt.the_benh='Hư Hàn Chứng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau Bụng' WHERE pt.the_benh='Hàn Thương Trúng Dương' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tay Chân Lạnh' WHERE pt.the_benh='Hàn Thương Trúng Dương' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Phân Nát' WHERE pt.the_benh='Hàn Thương Trúng Dương' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi Nhạt' WHERE pt.the_benh='Hàn Thương Trúng Dương' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tự Hãn' WHERE pt.the_benh='Khí Âm Lưỡng Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi Đỏ' WHERE pt.the_benh='Khí Âm Lưỡng Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mạch kết đại' WHERE pt.the_benh='Khí Âm Lưỡng Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Hồi Hộp' WHERE pt.the_benh='Âm Hư Hỏa Vượng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='mất ngủ' WHERE pt.the_benh='Âm Hư Hỏa Vượng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi Đỏ' WHERE pt.the_benh='Âm Hư Hỏa Vượng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='mạch sác' WHERE pt.the_benh='Âm Hư Hỏa Vượng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sắc mặt ảm đạm' WHERE pt.the_benh='Tâm Tỳ Lưỡng Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi Nhạt' WHERE pt.the_benh='Tâm Tỳ Lưỡng Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ăn Kém' WHERE pt.the_benh='Tâm Tỳ Lưỡng Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sắc Mặt Trắng' WHERE pt.the_benh='Khí Huyết Lưỡng Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mệt Mỏi' WHERE pt.the_benh='Khí Huyết Lưỡng Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi Nhạt' WHERE pt.the_benh='Khí Huyết Lưỡng Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='mạch Tế' WHERE pt.the_benh='Khí Huyết Lưỡng Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sắc Mặt Trắng' WHERE pt.the_benh='Tỳ Thận Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sợ Lạnh' WHERE pt.the_benh='Tỳ Thận Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi Bệu' WHERE pt.the_benh='Tỳ Thận Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='chân tay lạnh' WHERE pt.the_benh='Tỳ Thận Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Gò Má Đỏ' WHERE pt.the_benh='Can Thận Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đạo Hãn' WHERE pt.the_benh='Can Thận Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mỏi Lưng' WHERE pt.the_benh='Can Thận Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sốt nhẹ' WHERE pt.the_benh='Can Thận Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau Khớp' WHERE pt.the_benh='Ngoại Cảm Phong Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau Bụng' WHERE pt.the_benh='Ngoại Cảm Phong Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Phát Ban' WHERE pt.the_benh='Ngoại Cảm Phong Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sốt nhẹ' WHERE pt.the_benh='Âm Hư Hỏa Vượng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi Đỏ' WHERE pt.the_benh='Âm Hư Hỏa Vượng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Phát Ban' WHERE pt.the_benh='Âm Hư Hỏa Vượng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu Nhiều Lần' WHERE pt.the_benh='Bàng Quang Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu Gấp' WHERE pt.the_benh='Bàng Quang Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='nước tiểu đỏ' WHERE pt.the_benh='Bàng Quang Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu Vàng' WHERE pt.the_benh='Bàng Quang Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sốt' WHERE pt.the_benh='Phong Thủy Hình' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ho' WHERE pt.the_benh='Phong Thủy Hình' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Phù Thũng' WHERE pt.the_benh='Phong Thủy Hình' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu Ít' WHERE pt.the_benh='Phong Thủy Hình' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sốt' WHERE pt.the_benh='Thấp Nhiệt Hình' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mụn nhọt sưng đau' WHERE pt.the_benh='Thấp Nhiệt Hình' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Phù Thũng' WHERE pt.the_benh='Thấp Nhiệt Hình' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu Đỏ' WHERE pt.the_benh='Thấp Nhiệt Hình' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Viêm Họng Tái Phát' WHERE pt.the_benh='Phong Nhiệt Lưu Luyến' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu Máu Kéo Dài' WHERE pt.the_benh='Phong Nhiệt Lưu Luyến' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu Máu Lâu Ngày' WHERE pt.the_benh='Huyết Ứ Bất Thanh' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sắc Lưỡi Không Tươi' WHERE pt.the_benh='Huyết Ứ Bất Thanh' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mệt Mỏi' WHERE pt.the_benh='Tỳ Thận Lưỡng Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ăn Ít' WHERE pt.the_benh='Tỳ Thận Lưỡng Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Da vàng' WHERE pt.the_benh='Tỳ Thận Lưỡng Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi Nhạt' WHERE pt.the_benh='Tỳ Thận Lưỡng Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu Máu Lâu Ngày' WHERE pt.the_benh='Thận Âm Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Môi Đỏ' WHERE pt.the_benh='Thận Âm Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi Đỏ' WHERE pt.the_benh='Thận Âm Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tứ Chi Lạnh' WHERE pt.the_benh='Tỳ Thận Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mình hàn' WHERE pt.the_benh='Tỳ Thận Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Phù Nhiều' WHERE pt.the_benh='Tỳ Thận Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Phù Ấn Lõm' WHERE pt.the_benh='Tỳ Thận Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sắc Trắng' WHERE pt.the_benh='Tỳ Thận Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi Nhạt' WHERE pt.the_benh='Tỳ Thận Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Hình Béo' WHERE pt.the_benh='Thấp Nhiệt Lưu Luyến' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sợ Nóng' WHERE pt.the_benh='Thấp Nhiệt Lưu Luyến' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi Đỏ' WHERE pt.the_benh='Thấp Nhiệt Lưu Luyến' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Rêu Nhờn' WHERE pt.the_benh='Thấp Nhiệt Lưu Luyến' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sắc Mặt Vàng Vọt' WHERE pt.the_benh='Hồi Trùng (Giun Đũa)' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau Bụng Quanh Rốn' WHERE pt.the_benh='Hồi Trùng (Giun Đũa)' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau Bụng' WHERE pt.the_benh='Sán Lá Ruột' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Xét Nghiệm Phân Dương Tính' WHERE pt.the_benh='Sán Lá Ruột' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau Bụng Thượng Vị Cấp Tính' WHERE pt.the_benh='Giun Chui Ống Mật' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Chi Lạnh mà quyết' WHERE pt.the_benh='Giun Chui Ống Mật' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Hình Gầy' WHERE pt.the_benh='Tích Trệ Thương Tỳ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tóc Khô' WHERE pt.the_benh='Tích Trệ Thương Tỳ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='bụng đầy' WHERE pt.the_benh='Tích Trệ Thương Tỳ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='phiền táo' WHERE pt.the_benh='Tích Trệ Thương Tỳ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sốt' WHERE pt.the_benh='Phong Nhiệt Khái Thấu' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Nổi Hạch To' WHERE pt.the_benh='Phong Nhiệt Khái Thấu' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Chạm Vào Đau' WHERE pt.the_benh='Phong Nhiệt Khái Thấu' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sưng Đỏ' WHERE pt.the_benh='Phong Nhiệt Khái Thấu' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Lúc Nóng Lúc Lạnh' WHERE pt.the_benh='Dinh Vệ Bất Hoà' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='sợ gió' WHERE pt.the_benh='Dinh Vệ Bất Hoà' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ra Mồ Hôi' WHERE pt.the_benh='Dinh Vệ Bất Hoà' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mặt Sắc Trắng' WHERE pt.the_benh='Khí Hư Nội Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Vô Lực' WHERE pt.the_benh='Khí Hư Nội Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi Nhạt' WHERE pt.the_benh='Khí Hư Nội Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mạch Nhuyễn' WHERE pt.the_benh='Khí Hư Nội Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Triều Nhiệt' WHERE pt.the_benh='Âm Hư Nội Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đạo Hãn' WHERE pt.the_benh='Âm Hư Nội Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='mồ hôi trộm (đạo hãn)' WHERE pt.the_benh='Âm Hư Nội Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi Đỏ' WHERE pt.the_benh='Âm Hư Nội Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ít Rêu' WHERE pt.the_benh='Âm Hư Nội Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='mồ hôi trộm' WHERE pt.the_benh='Âm Hư Đạo Hãn' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='mồ hôi trộm (đạo hãn)' WHERE pt.the_benh='Âm Hư Đạo Hãn' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi Đỏ' WHERE pt.the_benh='Âm Hư Đạo Hãn' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tâm Phiền' WHERE pt.the_benh='Âm Hư Đạo Hãn' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sốt' WHERE pt.the_benh='Thượng Thịnh Hạ Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='khát nước' WHERE pt.the_benh='Thượng Thịnh Hạ Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Không ra Mồ Hôi' WHERE pt.the_benh='Thượng Thịnh Hạ Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu nhiều' WHERE pt.the_benh='Thượng Thịnh Hạ Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Chi lạnh' WHERE pt.the_benh='Thượng Thịnh Hạ Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sắc Mặt Trắng' WHERE pt.the_benh='Hạ Nguyên Hư Hãm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Chi lạnh' WHERE pt.the_benh='Hạ Nguyên Hư Hãm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='tiểu trong' WHERE pt.the_benh='Hạ Nguyên Hư Hãm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi Nhạt' WHERE pt.the_benh='Hạ Nguyên Hư Hãm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='đau đầu' WHERE pt.the_benh='Thấp Nhiệt Ủng Trệ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='mũi tắc' WHERE pt.the_benh='Thấp Nhiệt Ủng Trệ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Giảm Khứa Giác' WHERE pt.the_benh='Thấp Nhiệt Ủng Trệ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Nước Mũi Đặc' WHERE pt.the_benh='Thấp Nhiệt Ủng Trệ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Động Tác Múa Vờn Không Thể Tự Chủ' WHERE pt.the_benh='Phong Tà Phạm Can' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Nổi Mề Đay Thành Từng Đám' WHERE pt.the_benh='Doanh Hư Huyết Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Da Đỏ' WHERE pt.the_benh='Doanh Hư Huyết Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ngứa Ngáy' WHERE pt.the_benh='Doanh Hư Huyết Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sốt' WHERE pt.the_benh='Ma Chẩn Sơ Khởi' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Gò Má Đỏ' WHERE pt.the_benh='Ma Chẩn Sơ Khởi' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ho' WHERE pt.the_benh='Ma Chẩn Sơ Khởi' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sợ Ánh Sáng' WHERE pt.the_benh='Ma Chẩn Sơ Khởi' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Hạ Sốt' WHERE pt.the_benh='Ma Chẩn Cuối Kỳ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ho Ít' WHERE pt.the_benh='Ma Chẩn Cuối Kỳ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi Đỏ' WHERE pt.the_benh='Ma Chẩn Cuối Kỳ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Rêu Ít' WHERE pt.the_benh='Ma Chẩn Cuối Kỳ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sốt' WHERE pt.the_benh='Phong Nhiệt Hiệp Thấp' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Nổi Ban' WHERE pt.the_benh='Phong Nhiệt Hiệp Thấp' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='lở loét' WHERE pt.the_benh='Phong Nhiệt Hiệp Thấp' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Người Nóng' WHERE pt.the_benh='Phong Ôn Bệnh Độc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='đau đầu' WHERE pt.the_benh='Phong Ôn Bệnh Độc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Quai Hàm Sưng Đau' WHERE pt.the_benh='Phong Ôn Bệnh Độc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Người Nóng' WHERE pt.the_benh='Vệ Phận Thấp Trọng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Buồn Ngủ' WHERE pt.the_benh='Vệ Phận Thấp Trọng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='buồn nôn' WHERE pt.the_benh='Vệ Phận Thấp Trọng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Rêu Nhờn' WHERE pt.the_benh='Vệ Phận Thấp Trọng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sốt Cao' WHERE pt.the_benh='Khí Phận Nhiệt Trọng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='đau đầu' WHERE pt.the_benh='Khí Phận Nhiệt Trọng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='phiền táo' WHERE pt.the_benh='Khí Phận Nhiệt Trọng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='nôn mửa' WHERE pt.the_benh='Khí Phận Nhiệt Trọng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ho Dữ Dội Từng Cơn' WHERE pt.the_benh='Hàn Đàm Thúc Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Khò Khè' WHERE pt.the_benh='Hàn Đàm Thúc Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đàm Dính' WHERE pt.the_benh='Hàn Đàm Thúc Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Nôn Mửa' WHERE pt.the_benh='Hàn Đàm Thúc Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ho Từng Cơn' WHERE pt.the_benh='Nhiệt Đàm Thúc Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Khò Khè' WHERE pt.the_benh='Nhiệt Đàm Thúc Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đàm Dính' WHERE pt.the_benh='Nhiệt Đàm Thúc Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Nôn Mửa' WHERE pt.the_benh='Nhiệt Đàm Thúc Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiêu Nhầy Máu Mủ' WHERE pt.the_benh='Thấp Nhiệt Tích Trệ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Cảm Giác Mót rặn' WHERE pt.the_benh='Thấp Nhiệt Tích Trệ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau Bụng' WHERE pt.the_benh='Thương Thực Tiết Tả' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='đại tiện lỏng' WHERE pt.the_benh='Thương Thực Tiết Tả' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='lỏng' WHERE pt.the_benh='Thương Thực Tiết Tả' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Hình Gầy' WHERE pt.the_benh='Phế Tỳ Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='mũi tắc' WHERE pt.the_benh='Phế Tỳ Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Giảm Khứa Giác' WHERE pt.the_benh='Phế Tỳ Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Nước Mũi Đặc' WHERE pt.the_benh='Phế Tỳ Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sốt Cao' WHERE pt.the_benh='Thử Thương Phế Vị' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Không Ra Mồ Hôi' WHERE pt.the_benh='Thử Thương Phế Vị' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Miệng Khát' WHERE pt.the_benh='Thử Thương Phế Vị' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu nhiều' WHERE pt.the_benh='Thử Thương Phế Vị' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ra Mồ Hôi' WHERE pt.the_benh='Dương Hư Bất Cố' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Da Lạnh' WHERE pt.the_benh='Dương Hư Bất Cố' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi Nhạt' WHERE pt.the_benh='Dương Hư Bất Cố' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu trong dài' WHERE pt.the_benh='Dương Hư Bất Cố' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sốt Cao' WHERE pt.the_benh='Ma Chẩn Toàn Phát' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ho Nhiều' WHERE pt.the_benh='Ma Chẩn Toàn Phát' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Nổi Ban' WHERE pt.the_benh='Ma Chẩn Toàn Phát' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Miệng Khát' WHERE pt.the_benh='Ma Chẩn Toàn Phát' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Da khô' WHERE pt.the_benh='Huyết Hư Phong Táo' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Nứt Nẻ' WHERE pt.the_benh='Huyết Hư Phong Táo' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ngứa Ngáy' WHERE pt.the_benh='Huyết Hư Phong Táo' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='U Cục' WHERE pt.the_benh='Đàm Thấp Kết Tụ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Trơn Nhẵn, Di Động' WHERE pt.the_benh='Đàm Thấp Kết Tụ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Hồi Hộp' WHERE pt.the_benh='Tâm Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='đoản hơi' WHERE pt.the_benh='Tâm Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='bứt rứt' WHERE pt.the_benh='Tâm Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='lạnh' WHERE pt.the_benh='Tâm Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Hồi Hộp' WHERE pt.the_benh='Tâm Âm Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='mất ngủ' WHERE pt.the_benh='Tâm Âm Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Gò Má Đỏ' WHERE pt.the_benh='Tâm Âm Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='miệng khô' WHERE pt.the_benh='Tâm Âm Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Chóng mặt' WHERE pt.the_benh='Tâm Âm Dương Lưỡng Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='bứt rứt' WHERE pt.the_benh='Tâm Âm Dương Lưỡng Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Hồi Hộp' WHERE pt.the_benh='Tâm Âm Dương Lưỡng Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mạch kết đại' WHERE pt.the_benh='Tâm Âm Dương Lưỡng Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Hồi Hộp' WHERE pt.the_benh='Tâm Huyết Ứ Trở' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau Ngực' WHERE pt.the_benh='Tâm Huyết Ứ Trở' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='tê chân tay' WHERE pt.the_benh='Tâm Huyết Ứ Trở' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi Tím' WHERE pt.the_benh='Tâm Huyết Ứ Trở' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Chóng mặt' WHERE pt.the_benh='Đàm Mê Tâm Khiếu' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='hoa mắt' WHERE pt.the_benh='Đàm Mê Tâm Khiếu' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Choáng váng' WHERE pt.the_benh='Đàm Mê Tâm Khiếu' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='tiếng nói trầm' WHERE pt.the_benh='Đàm Mê Tâm Khiếu' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Nói Nhảm' WHERE pt.the_benh='Đàm Mê Tâm Khiếu' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='không nói được' WHERE pt.the_benh='Đàm Mê Tâm Khiếu' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='ngại nói' WHERE pt.the_benh='Đàm Mê Tâm Khiếu' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sốt Cao' WHERE pt.the_benh='Nhiệt Nhập Tâm Bào' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='phiền táo' WHERE pt.the_benh='Nhiệt Nhập Tâm Bào' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Hôn mê' WHERE pt.the_benh='Nhiệt Nhập Tâm Bào' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Nói Nhảm' WHERE pt.the_benh='Nhiệt Nhập Tâm Bào' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='không nói được' WHERE pt.the_benh='Nhiệt Nhập Tâm Bào' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tình Chí Uất Ức' WHERE pt.the_benh='Tâm Hư Đởm Khiếp' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sợ Nóng' WHERE pt.the_benh='Tâm Hư Đởm Khiếp' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Hồi hộp sợ hãi' WHERE pt.the_benh='Tâm Hư Đởm Khiếp' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='sợ hãi' WHERE pt.the_benh='Tâm Hư Đởm Khiếp' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='mất ngủ' WHERE pt.the_benh='Tâm Hư Đởm Khiếp' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mệt Mỏi' WHERE pt.the_benh='Tâm Tỳ Lưỡng Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='chán ăn' WHERE pt.the_benh='Tâm Tỳ Lưỡng Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Hồi hộp sợ hãi' WHERE pt.the_benh='Tâm Tỳ Lưỡng Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='sợ hãi' WHERE pt.the_benh='Tâm Tỳ Lưỡng Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='mất ngủ' WHERE pt.the_benh='Tâm Tỳ Lưỡng Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='mất ngủ' WHERE pt.the_benh='Tâm Thận Bất Giao' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mỏi Lưng' WHERE pt.the_benh='Tâm Thận Bất Giao' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Di tinh' WHERE pt.the_benh='Tâm Thận Bất Giao' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau Bụng' WHERE pt.the_benh='Tiểu Trường Hư Hàn' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='thích xoa bóp' WHERE pt.the_benh='Tiểu Trường Hư Hàn' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Bụng sôi lục ục' WHERE pt.the_benh='Tiểu Trường Hư Hàn' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Phân Nát' WHERE pt.the_benh='Tiểu Trường Hư Hàn' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tâm Phiền' WHERE pt.the_benh='Tiểu Trường Thực Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Miệng lở' WHERE pt.the_benh='Tiểu Trường Thực Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau họng' WHERE pt.the_benh='Tiểu Trường Thực Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu Đỏ' WHERE pt.the_benh='Tiểu Trường Thực Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='nước tiểu đỏ' WHERE pt.the_benh='Tiểu Trường Thực Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sườn phải đau tức' WHERE pt.the_benh='Can Khí Uất Kết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='bụng dưới đau tức' WHERE pt.the_benh='Can Khí Uất Kết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tình Chí Uất Ức' WHERE pt.the_benh='Can Khí Uất Kết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Chóng mặt' WHERE pt.the_benh='Can Âm Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='miệng khô' WHERE pt.the_benh='Can Âm Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='bứt rứt' WHERE pt.the_benh='Can Âm Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau Sườn' WHERE pt.the_benh='Can Âm Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sườn đau' WHERE pt.the_benh='Can Âm Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Chóng mặt' WHERE pt.the_benh='Can Hỏa Thượng Viêm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='mắt đỏ' WHERE pt.the_benh='Can Hỏa Thượng Viêm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ngực Sườn Trướng Đau' WHERE pt.the_benh='Can Hỏa Thượng Viêm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu Đỏ' WHERE pt.the_benh='Can Hỏa Thượng Viêm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='nước tiểu đỏ' WHERE pt.the_benh='Can Hỏa Thượng Viêm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Chóng mặt' WHERE pt.the_benh='Can Dương Thượng Kháng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='đau đầu' WHERE pt.the_benh='Can Dương Thượng Kháng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='run rẩy' WHERE pt.the_benh='Can Dương Thượng Kháng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='mất ngủ' WHERE pt.the_benh='Can Dương Thượng Kháng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Chóng mặt' WHERE pt.the_benh='Can Thận Âm Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='hoa mắt' WHERE pt.the_benh='Can Thận Âm Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mỏi Lưng' WHERE pt.the_benh='Can Thận Âm Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Di tinh' WHERE pt.the_benh='Can Thận Âm Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='đau đầu' WHERE pt.the_benh='Tâm Can Hỏa Vượng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='mắt đỏ' WHERE pt.the_benh='Tâm Can Hỏa Vượng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='mất ngủ' WHERE pt.the_benh='Tâm Can Hỏa Vượng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Hung Phiền' WHERE pt.the_benh='Tâm Can Hỏa Vượng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='tức ngực' WHERE pt.the_benh='Can Đởm Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sườn đau' WHERE pt.the_benh='Can Đởm Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau Liên Sườn' WHERE pt.the_benh='Can Đởm Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau Sườn' WHERE pt.the_benh='Can Đởm Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ngực Sườn Trướng Đau' WHERE pt.the_benh='Can Đởm Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Bụng Đầy Trướng' WHERE pt.the_benh='Can Đởm Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='bụng chướng' WHERE pt.the_benh='Can Đởm Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Bụng Chướng' WHERE pt.the_benh='Can Đởm Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Táo Bón' WHERE pt.the_benh='Can Đởm Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau Bụng' WHERE pt.the_benh='Tỳ Vị Hư Nhược' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Hư Hàn' WHERE pt.the_benh='Tỳ Vị Hư Nhược' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ăn Ít' WHERE pt.the_benh='Tỳ Vị Hư Nhược' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Phân Nát' WHERE pt.the_benh='Tỳ Vị Hư Nhược' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Chóng mặt' WHERE pt.the_benh='Trung Khí Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mệt Mỏi' WHERE pt.the_benh='Trung Khí Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='sa nội tạng' WHERE pt.the_benh='Trung Khí Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='chán ăn' WHERE pt.the_benh='Hàn Thấp Khốn Tỳ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Phân Nát' WHERE pt.the_benh='Hàn Thấp Khốn Tỳ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Phù Thũng' WHERE pt.the_benh='Hàn Thấp Khốn Tỳ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu Ít' WHERE pt.the_benh='Hàn Thấp Khốn Tỳ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='vàng da' WHERE pt.the_benh='Thấp Nhiệt Ủng Tỳ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu Đỏ' WHERE pt.the_benh='Thấp Nhiệt Ủng Tỳ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ngực Sườn Trướng Đau' WHERE pt.the_benh='Thấp Nhiệt Ủng Tỳ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau Sườn' WHERE pt.the_benh='Can Tỳ Bất Hoà' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau Liên Sườn' WHERE pt.the_benh='Can Tỳ Bất Hoà' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sườn đau' WHERE pt.the_benh='Can Tỳ Bất Hoà' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='bụng đầy' WHERE pt.the_benh='Can Tỳ Bất Hoà' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau Bụng Âm Ỉ' WHERE pt.the_benh='Can Tỳ Bất Hoà' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau Bụng' WHERE pt.the_benh='Can Tỳ Bất Hoà' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='đại tiện lỏng' WHERE pt.the_benh='Can Tỳ Bất Hoà' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mình hàn' WHERE pt.the_benh='Tỳ Thận Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau Bụng' WHERE pt.the_benh='Tỳ Thận Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau Bụng' WHERE pt.the_benh='Vị Khí Hư Hàn' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='thích xoa bóp' WHERE pt.the_benh='Vị Khí Hư Hàn' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='ưa chườm' WHERE pt.the_benh='Vị Khí Hư Hàn' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Bụng Đầy Trướng' WHERE pt.the_benh='Thực Trệ Đình Vị' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='bụng chướng' WHERE pt.the_benh='Thực Trệ Đình Vị' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Bụng Chướng' WHERE pt.the_benh='Thực Trệ Đình Vị' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='bụng chướng đau' WHERE pt.the_benh='Thực Trệ Đình Vị' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ngực Sườn Trướng Đau' WHERE pt.the_benh='Thực Trệ Đình Vị' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Bụng ngực đầy tức' WHERE pt.the_benh='Thực Trệ Đình Vị' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='ợ chua' WHERE pt.the_benh='Thực Trệ Đình Vị' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='ợ chua hoặc sôi bụng' WHERE pt.the_benh='Thực Trệ Đình Vị' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Nôn Ra Nước Chua' WHERE pt.the_benh='Thực Trệ Đình Vị' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='đau thượng vị' WHERE pt.the_benh='Vị Âm Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau thượng vị lan sườn' WHERE pt.the_benh='Vị Âm Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Miệng Khát' WHERE pt.the_benh='Vị Âm Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='họng khô' WHERE pt.the_benh='Vị Âm Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau Dạ Dày' WHERE pt.the_benh='Vị Hoả Thượng Viêm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Dạ dầy trướng đau' WHERE pt.the_benh='Vị Hoả Thượng Viêm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='bụng đói thì đau nhiều' WHERE pt.the_benh='Vị Hoả Thượng Viêm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='hôi miệng' WHERE pt.the_benh='Vị Hoả Thượng Viêm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='răng lợi lung lay' WHERE pt.the_benh='Vị Hoả Thượng Viêm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ngực Sườn Trướng Đau' WHERE pt.the_benh='Can Vị Bất Hoà' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Nôn Mửa' WHERE pt.the_benh='Can Vị Bất Hoà' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Hung Phiền' WHERE pt.the_benh='Tỳ Vị Bất Hoà' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='ợ hơi' WHERE pt.the_benh='Tỳ Vị Bất Hoà' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='bụng chướng' WHERE pt.the_benh='Tỳ Vị Bất Hoà' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Bụng Chướng' WHERE pt.the_benh='Tỳ Vị Bất Hoà' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Phân Nát' WHERE pt.the_benh='Tỳ Vị Bất Hoà' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ho đàm loãng trắng' WHERE pt.the_benh='Phế Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ho đàm trong' WHERE pt.the_benh='Phế Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tự Hãn' WHERE pt.the_benh='Phế Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ho khan' WHERE pt.the_benh='Phế Âm Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Triều Nhiệt' WHERE pt.the_benh='Phế Âm Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi Đỏ' WHERE pt.the_benh='Phế Âm Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='họng khô' WHERE pt.the_benh='Phế Âm Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sợ Lạnh' WHERE pt.the_benh='Hàn Đàm Trở Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='suyễn' WHERE pt.the_benh='Hàn Đàm Trở Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Dịch Đàm Trong Loãng' WHERE pt.the_benh='Hàn Đàm Trở Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ho đàm loãng trắng' WHERE pt.the_benh='Phế Thấp Thông Điều' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='khó thở' WHERE pt.the_benh='Phế Thấp Thông Điều' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Phù Thũng' WHERE pt.the_benh='Phế Thấp Thông Điều' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu Ít' WHERE pt.the_benh='Phế Thấp Thông Điều' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ho đàm trong' WHERE pt.the_benh='Đàm Thấp Ủng Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ho đàm loãng trắng' WHERE pt.the_benh='Đàm Thấp Ủng Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='tức ngực' WHERE pt.the_benh='Đàm Thấp Ủng Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Dịch Đàm Trong Loãng' WHERE pt.the_benh='Đàm Thấp Ủng Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sợ Lạnh' WHERE pt.the_benh='Phong Hàn Phạm Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ho đàm trong' WHERE pt.the_benh='Phong Hàn Phạm Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ho đàm loãng trắng' WHERE pt.the_benh='Phong Hàn Phạm Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='mũi tắc' WHERE pt.the_benh='Phong Hàn Phạm Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='ngạt mũi' WHERE pt.the_benh='Phong Hàn Phạm Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Nghẹt Mũi' WHERE pt.the_benh='Phong Hàn Phạm Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='chảy máu mũi' WHERE pt.the_benh='Phong Hàn Phạm Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ho đàm trong' WHERE pt.the_benh='Phong Nhiệt Phạm Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ho đàm loãng trắng' WHERE pt.the_benh='Phong Nhiệt Phạm Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='đờm vàng đặc' WHERE pt.the_benh='Phong Nhiệt Phạm Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='đờm vàng' WHERE pt.the_benh='Phong Nhiệt Phạm Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='miệng khô' WHERE pt.the_benh='Phong Nhiệt Phạm Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau họng' WHERE pt.the_benh='Phong Nhiệt Phạm Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ho đàm trong' WHERE pt.the_benh='Can Hỏa Phạm Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đàm Dãi' WHERE pt.the_benh='Can Hỏa Phạm Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ho đàm loãng trắng' WHERE pt.the_benh='Can Hỏa Phạm Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đàm Nhiều' WHERE pt.the_benh='Can Hỏa Phạm Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ho ra mủ máu' WHERE pt.the_benh='Can Hỏa Phạm Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau Ngực' WHERE pt.the_benh='Can Hỏa Phạm Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau bụng dữ dội' WHERE pt.the_benh='Can Hỏa Phạm Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ho' WHERE pt.the_benh='Phế Tỳ Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='tức ngực' WHERE pt.the_benh='Phế Tỳ Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='chán ăn' WHERE pt.the_benh='Phế Tỳ Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Phân Nát' WHERE pt.the_benh='Phế Tỳ Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ho đàm loãng trắng' WHERE pt.the_benh='Phế Thận Âm Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ho đàm trong' WHERE pt.the_benh='Phế Thận Âm Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ngũ Tâm Phiền Nhiệt' WHERE pt.the_benh='Phế Thận Âm Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Nấc' WHERE pt.the_benh='Phế Thận Âm Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mỏi Lưng' WHERE pt.the_benh='Phế Thận Âm Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sốt' WHERE pt.the_benh='Ứ Nhiệt Trở Trường' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau Bụng' WHERE pt.the_benh='Ứ Nhiệt Trở Trường' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='ỉa có chất nhầy máu mủ' WHERE pt.the_benh='Thấp Nhiệt Trệ Trường' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Cảm Giác Mót rặn' WHERE pt.the_benh='Thấp Nhiệt Trệ Trường' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Bụng Đầy Trướng' WHERE pt.the_benh='Trường Phủ Táo Kết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Nhiệt Thịnh' WHERE pt.the_benh='Trường Phủ Táo Kết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Táo Bón' WHERE pt.the_benh='Trường Phủ Táo Kết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mình hàn' WHERE pt.the_benh='Thận Dương Hư Tổn' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Chi lạnh' WHERE pt.the_benh='Thận Dương Hư Tổn' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mỏi Lưng' WHERE pt.the_benh='Thận Dương Hư Tổn' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='liệt dương' WHERE pt.the_benh='Thận Dương Hư Tổn' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Chóng mặt' WHERE pt.the_benh='Thận Bất Nạp Khí' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mỏi Lưng' WHERE pt.the_benh='Thận Bất Nạp Khí' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Thở Gấp' WHERE pt.the_benh='Thận Bất Nạp Khí' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='đoản hơi' WHERE pt.the_benh='Thận Bất Nạp Khí' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='thở ngắn hơi' WHERE pt.the_benh='Thận Bất Nạp Khí' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưng Gối Mỏi Yếu' WHERE pt.the_benh='Thận Hư Thủy Phiếm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='lưng gối mỏi đau' WHERE pt.the_benh='Thận Hư Thủy Phiếm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='lưng gối mỏi' WHERE pt.the_benh='Thận Hư Thủy Phiếm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='lưng gối' WHERE pt.the_benh='Thận Hư Thủy Phiếm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='lưng gối mỏi đau (nhão mềm)' WHERE pt.the_benh='Thận Hư Thủy Phiếm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Hồi Hộp' WHERE pt.the_benh='Thận Hư Thủy Phiếm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Phù Thũng' WHERE pt.the_benh='Thận Hư Thủy Phiếm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Chóng mặt' WHERE pt.the_benh='Thận Âm Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='ù tai' WHERE pt.the_benh='Thận Âm Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mỏi Lưng' WHERE pt.the_benh='Thận Âm Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Di tinh' WHERE pt.the_benh='Thận Âm Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Gò Má Đỏ' WHERE pt.the_benh='Thận Khuy Hỏa Vượng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Triều Nhiệt' WHERE pt.the_benh='Thận Khuy Hỏa Vượng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Chóng mặt' WHERE pt.the_benh='Thận Khuy Hỏa Vượng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='ù tai' WHERE pt.the_benh='Thận Khuy Hỏa Vượng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu Nhiều Lần' WHERE pt.the_benh='Bàng Quang Hư Hàn' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='đái dầm' WHERE pt.the_benh='Bàng Quang Hư Hàn' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='mộng tinh' WHERE pt.the_benh='Bàng Quang Hư Hàn' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu Nhiều Lần' WHERE pt.the_benh='Bàng Quang Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu Gấp' WHERE pt.the_benh='Bàng Quang Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sỏi' WHERE pt.the_benh='Bàng Quang Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='tiểu rắt' WHERE pt.the_benh='Bàng Quang Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sốt nhẹ' WHERE pt.the_benh='Ngoại Cảm Phong Hàn' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sợ Lạnh' WHERE pt.the_benh='Ngoại Cảm Phong Hàn' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='mũi tắc' WHERE pt.the_benh='Ngoại Cảm Phong Hàn' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sốt nhẹ' WHERE pt.the_benh='Ngoại Cảm Phong Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ho đàm trong' WHERE pt.the_benh='Ngoại Cảm Phong Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau Bụng' WHERE pt.the_benh='Ngoại Cảm Phong Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau Khớp' WHERE pt.the_benh='Hàn Tà Trở Lạc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Chi lạnh' WHERE pt.the_benh='Hàn Tà Trở Lạc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Co Rút' WHERE pt.the_benh='Hàn Tà Trở Lạc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='gân co rút' WHERE pt.the_benh='Hàn Tà Trở Lạc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tứ Chi Lạnh' WHERE pt.the_benh='Dương Hư Quyết Nghịch' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Hôn mê' WHERE pt.the_benh='Dương Hư Quyết Nghịch' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='choáng váng' WHERE pt.the_benh='Dương Hư Quyết Nghịch' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Hung Phiền' WHERE pt.the_benh='Thử Thấp Trúng Trở' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='buồn nôn' WHERE pt.the_benh='Thử Thấp Trúng Trở' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='phiền khát' WHERE pt.the_benh='Thử Nhiệt Thương Chính' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Miệng Khát' WHERE pt.the_benh='Thử Nhiệt Thương Chính' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='khát nước' WHERE pt.the_benh='Thử Nhiệt Thương Chính' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='khát' WHERE pt.the_benh='Thử Nhiệt Thương Chính' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau Khớp' WHERE pt.the_benh='Thấp Độc Tẩm Dâm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sưng Đỏ' WHERE pt.the_benh='Thấp Độc Tẩm Dâm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau Nhức' WHERE pt.the_benh='Thấp Trệ Kinh Lạc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='tê chân tay' WHERE pt.the_benh='Thấp Trệ Kinh Lạc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tê Tay Chân' WHERE pt.the_benh='Thấp Trệ Kinh Lạc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='phong hàn thấp tà lấn vào' WHERE pt.the_benh='Thấp Trệ Kinh Lạc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mình hàn' WHERE pt.the_benh='Phong Thấp Tý Trở' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Hư Hàn' WHERE pt.the_benh='Phong Thấp Tý Trở' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mình hàn (sợ lạnh)' WHERE pt.the_benh='Phong Thấp Tý Trở' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='lưng gối mỏi đau' WHERE pt.the_benh='Phong Thấp Tý Trở' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ho khan' WHERE pt.the_benh='Táo Thấp Phạm Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ho đàm trong' WHERE pt.the_benh='Táo Thấp Phạm Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='họng khô' WHERE pt.the_benh='Táo Thấp Phạm Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Thở Gấp' WHERE pt.the_benh='Táo Thấp Phạm Phế' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sốt Cao' WHERE pt.the_benh='Hỏa Tà Thực Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Hôn mê' WHERE pt.the_benh='Hỏa Tà Thực Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Cuồng thao vọng động' WHERE pt.the_benh='Hỏa Tà Thực Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Phát Ban' WHERE pt.the_benh='Hỏa Tà Thực Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='bứt rứt' WHERE pt.the_benh='Âm Hư Nội Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Gò Má Đỏ' WHERE pt.the_benh='Âm Hư Nội Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Chóng mặt' WHERE pt.the_benh='Khí Hư Hạ Hãm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mệt Mỏi' WHERE pt.the_benh='Khí Hư Hạ Hãm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đa Kinh' WHERE pt.the_benh='Âm Hư Nội Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='sắc đỏ' WHERE pt.the_benh='Âm Hư Nội Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sa Tử Cung' WHERE pt.the_benh='Khí Hư Hạ Hãm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ớn Lạnh' WHERE pt.the_benh='Hàn Trở Ngưng Trệ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau Bụng' WHERE pt.the_benh='Hàn Trở Ngưng Trệ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='kinh nguyệt ít' WHERE pt.the_benh='Hàn Trở Ngưng Trệ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Kinh Trễ' WHERE pt.the_benh='Hàn Trở Ngưng Trệ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mệt Mỏi' WHERE pt.the_benh='Tâm Phế Lưỡng Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='uể oải' WHERE pt.the_benh='Tâm Phế Lưỡng Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Hồi Hộp' WHERE pt.the_benh='Tâm Phế Lưỡng Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ngủ Ít' WHERE pt.the_benh='Tâm Phế Lưỡng Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ngực Sườn Đầy Tức' WHERE pt.the_benh='Can Khí Uất Kết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='kinh nguyệt không đều' WHERE pt.the_benh='Can Khí Uất Kết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Phụ Nữ Có Thai' WHERE pt.the_benh='Tâm Dương Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Phù Chân' WHERE pt.the_benh='Tâm Dương Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sợ Lạnh' WHERE pt.the_benh='Tâm Dương Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Hồi Hộp' WHERE pt.the_benh='Tâm Dương Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sợ Lạnh' WHERE pt.the_benh='Thận Dương Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='đau lưng' WHERE pt.the_benh='Thận Dương Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='kinh nguyệt không đều' WHERE pt.the_benh='Thận Dương Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='kinh nguyệt ít' WHERE pt.the_benh='Khí Uất Huyết Trệ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sắc Tím' WHERE pt.the_benh='Khí Uất Huyết Trệ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Bụng Dưới Trướng Đau' WHERE pt.the_benh='Khí Uất Huyết Trệ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Chóng mặt' WHERE pt.the_benh='Khí Huyết Hư Nhược' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mệt Mỏi' WHERE pt.the_benh='Khí Huyết Hư Nhược' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='kinh nguyệt ít' WHERE pt.the_benh='Khí Huyết Hư Nhược' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sắc Nhạt' WHERE pt.the_benh='Khí Huyết Hư Nhược' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Hung Phiền' WHERE pt.the_benh='Đàm Thấp Trở Trệ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tứ Chi Nặng Mỏi' WHERE pt.the_benh='Đàm Thấp Trở Trệ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Khí Hư (Phụ Nữ)' WHERE pt.the_benh='Đàm Thấp Trở Trệ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Bế Kinh' WHERE pt.the_benh='Đàm Thấp Trở Trệ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Hạ Sườn Đầy Tức' WHERE pt.the_benh='Can Hỏa Nội Sí' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='phiền táo' WHERE pt.the_benh='Can Hỏa Nội Sí' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đa Kinh' WHERE pt.the_benh='Can Hỏa Nội Sí' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='sắc đỏ' WHERE pt.the_benh='Can Hỏa Nội Sí' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Khó Tiêu' WHERE pt.the_benh='Tỳ Hư Huyết Nhược' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Bụng Chướng' WHERE pt.the_benh='Tỳ Hư Huyết Nhược' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đa Kinh' WHERE pt.the_benh='Tỳ Hư Huyết Nhược' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đi Cầu Phân Sệt' WHERE pt.the_benh='Tỳ Hư Huyết Nhược' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tứ Chi Quyết Lạnh' WHERE pt.the_benh='Vong Dương Hư Thoát' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Hôn mê' WHERE pt.the_benh='Vong Dương Hư Thoát' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sốc' WHERE pt.the_benh='Vong Dương Hư Thoát' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tâm Phiền' WHERE pt.the_benh='Can Kinh Uất Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ngực Sườn Đầy Tức' WHERE pt.the_benh='Can Kinh Uất Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Chóng mặt' WHERE pt.the_benh='Can Thận Âm Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='hoa mắt' WHERE pt.the_benh='Can Thận Âm Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mỏi Lưng' WHERE pt.the_benh='Can Thận Âm Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mình hàn' WHERE pt.the_benh='Tỳ Thận Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mỏi Lưng' WHERE pt.the_benh='Tỳ Thận Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Khó Tiêu' WHERE pt.the_benh='Tỳ Thận Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='đại tiện lỏng' WHERE pt.the_benh='Tỳ Thận Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Khí Hư (Phụ Nữ)' WHERE pt.the_benh='Can Thận Âm Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Chóng mặt' WHERE pt.the_benh='Âm Dương Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mệt Mỏi' WHERE pt.the_benh='Âm Dương Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mặt Đỏ' WHERE pt.the_benh='Âm Dương Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Hoả Thăng' WHERE pt.the_benh='Âm Dương Bất Túc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ngứa Ngáy Âm Hộ' WHERE pt.the_benh='Thấp Độc Đới Hạ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='thấp nhiệt' WHERE pt.the_benh='Thấp Độc Đới Hạ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Khí Hư (Phụ Nữ)' WHERE pt.the_benh='Thấp Độc Đới Hạ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Hàn Nhiệt' WHERE pt.the_benh='Nhiệt Độc Ủng Kết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Khí Hư Ra Nhiều, Có Mùi Hôi' WHERE pt.the_benh='Nhiệt Độc Ủng Kết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sốt nhẹ' WHERE pt.the_benh='Ứ Huyết Tích Trệ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi Tím' WHERE pt.the_benh='Ứ Huyết Tích Trệ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau Bụng' WHERE pt.the_benh='Ứ Huyết Tích Trệ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Cự Án' WHERE pt.the_benh='Ứ Huyết Tích Trệ' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Kỳ Kinh Rối Loạn Lượng Nhiều' WHERE pt.the_benh='Khí Nghịch Huyết Lưu' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau Bụng' WHERE pt.the_benh='Khí Nghịch Huyết Lưu' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Khối U' WHERE pt.the_benh='Ứ Độc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='đau lưng' WHERE pt.the_benh='Thận Khi Khuy Tổn' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Suy Nhược' WHERE pt.the_benh='Thận Khi Khuy Tổn' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Động Thai' WHERE pt.the_benh='Thận Khi Khuy Tổn' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Bất An' WHERE pt.the_benh='Thận Khi Khuy Tổn' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Chóng mặt' WHERE pt.the_benh='Tỳ Vị Hư Nhược' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='bứt rứt' WHERE pt.the_benh='Tỳ Vị Hư Nhược' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='buồn nôn' WHERE pt.the_benh='Tỳ Vị Hư Nhược' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='chán ăn' WHERE pt.the_benh='Tỳ Vị Hư Nhược' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Chóng mặt' WHERE pt.the_benh='Can Vị Bất Hòa' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='bứt rứt' WHERE pt.the_benh='Can Vị Bất Hòa' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Nôn Ra Nước Chua' WHERE pt.the_benh='Can Vị Bất Hòa' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mang Thai Phù Thũng' WHERE pt.the_benh='Thận Hư Thủy Tràn' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='đau lưng' WHERE pt.the_benh='Thận Hư Thủy Tràn' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Bụng Chướng' WHERE pt.the_benh='Thận Hư Thủy Tràn' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Chóng mặt' WHERE pt.the_benh='Âm Hư Dương Cang' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='đau đầu' WHERE pt.the_benh='Âm Hư Dương Cang' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='hoa mắt' WHERE pt.the_benh='Âm Hư Dương Cang' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='miệng khô' WHERE pt.the_benh='Âm Hư Dương Cang' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='hoa mắt' WHERE pt.the_benh='Âm Hư Can Vượng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='đau đầu' WHERE pt.the_benh='Âm Hư Can Vượng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Kinh Quyết' WHERE pt.the_benh='Âm Hư Can Vượng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='phiền táo' WHERE pt.the_benh='Âm Hư Can Vượng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ít Sữa' WHERE pt.the_benh='Huyết Hư Khí Nhược' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Vú Sưng Đau' WHERE pt.the_benh='Nhũ Ứ Trở Lạc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Thời Kỳ Cai Sữa Vú Căng Đau' WHERE pt.the_benh='Nhũ Ứ Trở Lạc' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Da mắt hơi vàng' WHERE pt.the_benh='Thấp Nhiệt Thai Hoàng' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='ù tai' WHERE pt.the_benh='Can Thận  Âm Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ngũ Tâm Phiền Nhiệt' WHERE pt.the_benh='Can Thận  Âm Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Nổi Sẩn Toàn Thân' WHERE pt.the_benh='Dinh Vệ Bất Hoà' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Hành Kinh Nôn Ra Máu' WHERE pt.the_benh='Can Kinh Uất Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau Bụng' WHERE pt.the_benh='Nhiệt Độc Ủng Kết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sợ Lạnh' WHERE pt.the_benh='Huyết Hư Ngoại Cảm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Phát Nhiệt' WHERE pt.the_benh='Huyết Hư Ngoại Cảm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Chóng mặt' WHERE pt.the_benh='Huyết Hư Ngoại Cảm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='mũi tắc' WHERE pt.the_benh='Huyết Hư Ngoại Cảm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Dễ Nổi Nóng' WHERE pt.the_benh='Can Khí Uất Kết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Hay thở Dài' WHERE pt.the_benh='Can Khí Uất Kết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='cảm xúc thất thường' WHERE pt.the_benh='Can Khí Uất Kết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='lo âu' WHERE pt.the_benh='Can Khí Uất Kết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Hồi Hộp' WHERE pt.the_benh='Can Khí Uất Kết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='vướng víu ở cổ họng' WHERE pt.the_benh='Can Khí Uất Kết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='tức ngực' WHERE pt.the_benh='Can Khí Uất Kết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='sườn đau tức' WHERE pt.the_benh='Can Khí Uất Kết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='đầy bụng' WHERE pt.the_benh='Can Khí Uất Kết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='ăn uống kém' WHERE pt.the_benh='Can Khí Uất Kết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='ợ hơi' WHERE pt.the_benh='Can Khí Uất Kết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='hoặc đau bụng kinh' WHERE pt.the_benh='Can Khí Uất Kết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='kinh nguyệt không đều' WHERE pt.the_benh='Can Khí Uất Kết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Hàn Nhiệt Vãng Lai' WHERE pt.the_benh='Can Khí Uất Kết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Hay Cáu Gắt' WHERE pt.the_benh='Can Khí Uất Kết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiêu hóa kém' WHERE pt.the_benh='Tỳ Dương Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='đại tiện lỏng' WHERE pt.the_benh='Tỳ Dương Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sợ Lạnh' WHERE pt.the_benh='Tỳ Dương Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mệt Mỏi' WHERE pt.the_benh='Tỳ Dương Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tích thủy' WHERE pt.the_benh='Tỳ Dương Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi Nhạt' WHERE pt.the_benh='Tỳ Dương Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Bụng Đầy Trướng' WHERE pt.the_benh='Tỳ Dương Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='chán ăn' WHERE pt.the_benh='Tỳ Dương Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='uể oải' WHERE pt.the_benh='Tỳ Dương Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='lười vận động' WHERE pt.the_benh='Tỳ Dương Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='phù nề' WHERE pt.the_benh='Tỳ Dương Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu Ít' WHERE pt.the_benh='Tỳ Dương Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu trong dài' WHERE pt.the_benh='Tỳ Dương Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='ăn uống kém' WHERE pt.the_benh='Trung Khí Hạ Hãm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='đại tiện lỏng' WHERE pt.the_benh='Trung Khí Hạ Hãm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sa Tử Cung' WHERE pt.the_benh='Trung Khí Hạ Hãm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='ăn uống kém' WHERE pt.the_benh='Tỳ Bất Thống Huyết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Bụng Đầy Trướng' WHERE pt.the_benh='Tỳ Bất Thống Huyết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='đại tiện lỏng' WHERE pt.the_benh='Tỳ Bất Thống Huyết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Hơi thở ngắn' WHERE pt.the_benh='Tỳ Bất Thống Huyết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='chân tay lạnh' WHERE pt.the_benh='Tỳ Bất Thống Huyết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau Sườn' WHERE pt.the_benh='Can Khí Uất Kết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tinh thần mệt mỏi' WHERE pt.the_benh='Tâm Dương Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='ăn uống kém' WHERE pt.the_benh='Tâm Dương Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tay Chân Lạnh' WHERE pt.the_benh='Tâm Dương Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mạch kết đại' WHERE pt.the_benh='Tâm Dương Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tinh thần mệt mỏi' WHERE pt.the_benh='Tỳ Dương Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='ăn uống kém' WHERE pt.the_benh='Tỳ Dương Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tay Chân Lạnh' WHERE pt.the_benh='Tỳ Dương Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau Bụng Âm Ỉ' WHERE pt.the_benh='Tỳ Dương Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Lười nói, ngại vận động' WHERE pt.the_benh='Tỳ Dương Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đại tiện lỏng nát' WHERE pt.the_benh='Tỳ Dương Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sợ lạnh, thích ấm' WHERE pt.the_benh='Tỳ Dương Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Thích chườm ấm' WHERE pt.the_benh='Tỳ Dương Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Kinh nguyệt ra nhiều' WHERE pt.the_benh='Tỳ Dương Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sắc kinh nhạt loãng' WHERE pt.the_benh='Tỳ Dương Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi nhợt bệu' WHERE pt.the_benh='Tỳ Dương Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Rêu lưỡi trắng mỏng' WHERE pt.the_benh='Tỳ Dương Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mạch trầm trì nhược' WHERE pt.the_benh='Tỳ Dương Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sắc mặt vàng bủng' WHERE pt.the_benh='Tỳ Dương Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Cơ thể gầy yếu' WHERE pt.the_benh='Tỳ Dương Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Phù nhẹ chi dưới' WHERE pt.the_benh='Tỳ Dương Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Kinh nguyệt ra nhiều' WHERE pt.the_benh='Tỳ Bất Thống Huyết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sắc mặt vàng bủng' WHERE pt.the_benh='Tỳ Bất Thống Huyết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Chảy máu dưới da' WHERE pt.the_benh='Tỳ Bất Thống Huyết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đại tiện ra máu' WHERE pt.the_benh='Tỳ Bất Thống Huyết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu tiện ra máu' WHERE pt.the_benh='Tỳ Bất Thống Huyết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Rong kinh' WHERE pt.the_benh='Tỳ Bất Thống Huyết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Băng huyết' WHERE pt.the_benh='Tỳ Bất Thống Huyết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Máu kinh nhạt màu' WHERE pt.the_benh='Tỳ Bất Thống Huyết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi nhạt rêu trắng' WHERE pt.the_benh='Tỳ Bất Thống Huyết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mạch hư nhược' WHERE pt.the_benh='Tỳ Bất Thống Huyết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Cơ thể mệt mỏi' WHERE pt.the_benh='Tỳ Bất Thống Huyết' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='chán ăn' WHERE pt.the_benh='Phế Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='sợ gió' WHERE pt.the_benh='Phế Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi Nhạt' WHERE pt.the_benh='Phế Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Rêu lưỡi trắng mỏng' WHERE pt.the_benh='Phế Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mạch hư nhược' WHERE pt.the_benh='Phế Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Cơ thể mệt mỏi' WHERE pt.the_benh='Phế Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đầy bụng sau ăn' WHERE pt.the_benh='Phế Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Ho kéo dài' WHERE pt.the_benh='Phế Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiếng ho yếu' WHERE pt.the_benh='Phế Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Khó thở khi vận động' WHERE pt.the_benh='Phế Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Dễ cảm mạo' WHERE pt.the_benh='Phế Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tự hãn (đổ mồ hôi trộm)' WHERE pt.the_benh='Phế Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sắc mặt trắng bệch' WHERE pt.the_benh='Phế Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiếng nói nhỏ yếu' WHERE pt.the_benh='Phế Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Bụng Đầy Trướng' WHERE pt.the_benh='Trung Khí Hạ Hãm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Kinh nguyệt ra nhiều' WHERE pt.the_benh='Trung Khí Hạ Hãm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mạch hư nhược' WHERE pt.the_benh='Trung Khí Hạ Hãm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Hơi thở ngắn' WHERE pt.the_benh='Trung Khí Hạ Hãm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sắc mặt nhợt nhạt' WHERE pt.the_benh='Trung Khí Hạ Hãm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sa dạ dày' WHERE pt.the_benh='Trung Khí Hạ Hãm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sa trực tràng' WHERE pt.the_benh='Trung Khí Hạ Hãm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Thường xuyên mót rặn' WHERE pt.the_benh='Trung Khí Hạ Hãm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Cảm giác trĩ hạ' WHERE pt.the_benh='Trung Khí Hạ Hãm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Băng lậu' WHERE pt.the_benh='Trung Khí Hạ Hãm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi nhợt rêu trắng' WHERE pt.the_benh='Trung Khí Hạ Hãm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Người mệt mỏi' WHERE pt.the_benh='Trung Khí Hạ Hãm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Khí đoản' WHERE pt.the_benh='Trung Khí Hạ Hãm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Lười nói' WHERE pt.the_benh='Trung Khí Hạ Hãm' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau Bụng Âm Ỉ' WHERE pt.the_benh='Thận Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='chán ăn' WHERE pt.the_benh='Thận Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau lưng mỏi gối' WHERE pt.the_benh='Thận Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu đêm nhiều lần' WHERE pt.the_benh='Thận Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu trong dài' WHERE pt.the_benh='Thận Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='kinh nguyệt không đều' WHERE pt.the_benh='Thận Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau bụng kinh' WHERE pt.the_benh='Thận Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi nhạt bệu' WHERE pt.the_benh='Thận Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sắc mặt trắng bệch' WHERE pt.the_benh='Thận Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Cơ thể mệt mỏi' WHERE pt.the_benh='Thận Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tinh thần uể oải' WHERE pt.the_benh='Thận Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Thiếu hụt ý chí' WHERE pt.the_benh='Thận Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiêu chảy lúc sáng sớm' WHERE pt.the_benh='Thận Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Sợ lạnh, tay chân lạnh' WHERE pt.the_benh='Thận Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Khí hư loãng lạnh' WHERE pt.the_benh='Thận Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Rêu lưỡi trắng trơn' WHERE pt.the_benh='Thận Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Mạch trầm trì vô lực' WHERE pt.the_benh='Thận Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO phap_tri_trieu_chung (id_phap_tri, id_trieu_chung) SELECT pt.id, tc.id FROM phap_tri pt JOIN trieu_chung tc ON tc.ten_trieu_chung='Phù thũng chi dưới' WHERE pt.the_benh='Thận Dương Hư' ON CONFLICT DO NOTHING;

-- 6) Liên kết Triệu chứng - Thể đo (418)
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mình hàn' WHERE b.name='Tâm Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Chi lạnh' WHERE b.name='Tâm Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mình hàn (sợ lạnh)' WHERE b.name='Tâm Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Sắc Mặt Trắng' WHERE b.name='Tâm Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mệt Mỏi' WHERE b.name='Tâm Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='uể oải' WHERE b.name='Tâm Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Tứ Chi Lạnh' WHERE b.name='Tâm Dương Hư Suy' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='choáng váng' WHERE b.name='Tâm Dương Hư Suy' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='thở ngắn hơi' WHERE b.name='Tâm Dương Hư Suy' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau Bụng' WHERE b.name='Đại Trường Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='ỉa có chất nhầy máu mủ' WHERE b.name='Đại Trường Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Hồi Hộp' WHERE b.name='Tâm Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi Nhạt' WHERE b.name='Tâm Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mạch kết đại' WHERE b.name='Tâm Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Vô Lực' WHERE b.name='Tâm Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='ngại nói' WHERE b.name='Tâm Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='lo âu' WHERE b.name='Tâm Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='trống ngực' WHERE b.name='Tâm Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='tim đập dồn dập' WHERE b.name='Tâm Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Hơi thở ngắn' WHERE b.name='Tâm Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='mệt mỏi rã rời' WHERE b.name='Tâm Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='chân tay vô lực' WHERE b.name='Tâm Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Sắc mặt nhợt nhạt' WHERE b.name='Tâm Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='đổ mồ hôi trộm' WHERE b.name='Tâm Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='tự ha' WHERE b.name='Tâm Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='rêu lưỡi trắng' WHERE b.name='Tâm Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='nhịp tim không đều' WHERE b.name='Tâm Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Hồi Hộp' WHERE b.name='Tâm Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='hay quên' WHERE b.name='Tâm Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='mất ngủ' WHERE b.name='Tâm Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='uể oải' WHERE b.name='Tâm Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mạch kết đại' WHERE b.name='Tâm Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mặt Trắng Bệch' WHERE b.name='Tâm Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Sắc Trắng Bệch' WHERE b.name='Tâm Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='sắc mặt xanh xao' WHERE b.name='Tâm Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Đánh trống ngực' WHERE b.name='Tâm Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='ngực bị đau thắt' WHERE b.name='Tâm Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='đau nhói' WHERE b.name='Tâm Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Tinh thần mệt mỏi' WHERE b.name='Tâm Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='tự ra mồ hôi lạnh' WHERE b.name='Tâm Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='rêu lưỡi trắng nhuận' WHERE b.name='Tâm Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Chất lưỡi bệu nhợt' WHERE b.name='Tâm Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mạch trầm vi tế' WHERE b.name='Tâm Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='buồn nôn' WHERE b.name='Đàm hoả nội nhiễu' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='ăn uống kém' WHERE b.name='Đàm hoả nội nhiễu' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='đổ mồ hôi trộm' WHERE b.name='Tâm âm hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Ngũ Tâm Phiền Nhiệt' WHERE b.name='Tâm âm hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Sắc mặt nhợt nhạt' WHERE b.name='Tâm âm hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Hồi Hộp' WHERE b.name='Tâm huyết hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi Nhạt' WHERE b.name='Tâm huyết hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Chóng mặt' WHERE b.name='Tâm huyết hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='hay quên' WHERE b.name='Tâm huyết hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='hoa mắt' WHERE b.name='Tâm huyết hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='kinh nguyệt ít' WHERE b.name='Tâm huyết hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='lo âu' WHERE b.name='Tâm huyết hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='ăn uống kém' WHERE b.name='Tâm huyết hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Sắc mặt nhợt nhạt' WHERE b.name='Tâm huyết hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Đánh trống ngực' WHERE b.name='Tâm huyết hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Bụng Đầy Trướng' WHERE b.name='Tâm huyết ứ trệ' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='hay quên' WHERE b.name='Tâm huyết ứ trệ' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='kinh nguyệt không đều' WHERE b.name='Tâm huyết ứ trệ' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mạch Sáp' WHERE b.name='Tâm huyết ứ trệ' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='ăn uống kém' WHERE b.name='Tâm huyết ứ trệ' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Sắc mặt nhợt nhạt' WHERE b.name='Đàm Mê Tâm Khiếu' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='ăn uống kém' WHERE b.name='Đàm Mê Tâm Khiếu' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Tự Hãn' WHERE b.name='Tâm Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='đoản hơi' WHERE b.name='Tâm Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='ăn uống kém' WHERE b.name='Tâm Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Tinh thần mệt mỏi' WHERE b.name='Tâm Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='kinh nguyệt không đều' WHERE b.name='Can khí uất kết' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Dễ Nổi Nóng' WHERE b.name='Can khí uất kết' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Hay thở Dài' WHERE b.name='Can khí uất kết' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='ăn uống kém' WHERE b.name='Can khí uất kết' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Tinh thần uất ức' WHERE b.name='Can khí uất kết' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Hay lo âu' WHERE b.name='Can khí uất kết' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Đầy bụng khó tiêu' WHERE b.name='Can khí uất kết' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau bụng đi ngoài' WHERE b.name='Can khí uất kết' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Tức ngực sườn' WHERE b.name='Can khí uất kết' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau đầu chóng mặt' WHERE b.name='Can khí uất kết' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Căng thẳng thần kinh' WHERE b.name='Can khí uất kết' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau bụng kinh' WHERE b.name='Can khí uất kết' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Căng tức vú' WHERE b.name='Can khí uất kết' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi đỏ nhạt' WHERE b.name='Can khí uất kết' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Rêu lưỡi mỏng trắng' WHERE b.name='Can khí uất kết' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mạch huyền' WHERE b.name='Can khí uất kết' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mệt mỏi toàn thân' WHERE b.name='Can khí uất kết' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Sắc mặt sạm' WHERE b.name='Can khí uất kết' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi Đỏ' WHERE b.name='Đởm nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='buồn nôn' WHERE b.name='Đởm nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='đầy bụng' WHERE b.name='Đởm nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='miệng đắng' WHERE b.name='Đởm nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Sợ Ánh Sáng' WHERE b.name='Đởm nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Dễ Nổi Nóng' WHERE b.name='Đởm nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='ăn uống kém' WHERE b.name='Đởm nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Tức ngực sườn' WHERE b.name='Đởm nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau đầu chóng mặt' WHERE b.name='Đởm nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Bứt rứt khó ngủ' WHERE b.name='Đởm nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Hay nằm mơ' WHERE b.name='Đởm nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Rêu lưỡi vàng dày' WHERE b.name='Đởm nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mạch huyền sác' WHERE b.name='Đởm nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Sắc mặt đỏ' WHERE b.name='Đởm nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Người nóng bứt rứt' WHERE b.name='Đởm nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='chán ăn' WHERE b.name='Đàm Mê Tâm Khiếu' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='đầy bụng' WHERE b.name='Đàm Mê Tâm Khiếu' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi Bệu' WHERE b.name='Đàm Mê Tâm Khiếu' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Ý thức u ám' WHERE b.name='Đàm Mê Tâm Khiếu' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Ngơ ngẩn, vô cảm' WHERE b.name='Đàm Mê Tâm Khiếu' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Nói năng lảm nhảm' WHERE b.name='Đàm Mê Tâm Khiếu' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Tâm thần phân liệt' WHERE b.name='Đàm Mê Tâm Khiếu' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Đột ngột hôn mê' WHERE b.name='Đàm Mê Tâm Khiếu' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Co giật chân tay' WHERE b.name='Đàm Mê Tâm Khiếu' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Khó thở, đờm khò khè' WHERE b.name='Đàm Mê Tâm Khiếu' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Rêu lưỡi nhờn trắng' WHERE b.name='Đàm Mê Tâm Khiếu' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mạch huyền hoạt' WHERE b.name='Đàm Mê Tâm Khiếu' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Sắc mặt ám trệ' WHERE b.name='Đàm Mê Tâm Khiếu' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Cơ thể nặng nề' WHERE b.name='Đàm Mê Tâm Khiếu' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='tức ngực' WHERE b.name='Đàm hoả nội nhiễu' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Sắc mặt vàng bủng' WHERE b.name='Đàm hoả nội nhiễu' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mạch huyền hoạt' WHERE b.name='Đàm hoả nội nhiễu' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Tâm thần bất an' WHERE b.name='Đàm hoả nội nhiễu' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Dễ cáu gắt' WHERE b.name='Đàm hoả nội nhiễu' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Đầu óc choáng váng' WHERE b.name='Đàm hoả nội nhiễu' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mất ngủ, hay mơ' WHERE b.name='Đàm hoả nội nhiễu' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Miệng đắng, họng khô' WHERE b.name='Đàm hoả nội nhiễu' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Đầy bụng, ăn kém' WHERE b.name='Đàm hoả nội nhiễu' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Hoa mắt chóng mặt' WHERE b.name='Đàm hoả nội nhiễu' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Hay hồi hộp, đánh trống ngực' WHERE b.name='Đàm hoả nội nhiễu' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi đỏ, rêu vàng nhờn' WHERE b.name='Đàm hoả nội nhiễu' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mạch hoạt sác' WHERE b.name='Đàm hoả nội nhiễu' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Người nặng nề' WHERE b.name='Đàm hoả nội nhiễu' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Thân nhiệt nóng' WHERE b.name='Đàm hoả nội nhiễu' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Tay Chân Lạnh' WHERE b.name='Tâm Dương Hư Suy' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='ăn uống kém' WHERE b.name='Tâm Dương Hư Suy' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='đổ mồ hôi trộm' WHERE b.name='Tâm Dương Hư Suy' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='rêu lưỡi trắng' WHERE b.name='Tâm Dương Hư Suy' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Tinh thần mệt mỏi' WHERE b.name='Tâm Dương Hư Suy' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mạch hư nhược' WHERE b.name='Tâm Dương Hư Suy' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Sắc mặt trắng bệch' WHERE b.name='Tâm Dương Hư Suy' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Hay hồi hộp' WHERE b.name='Tâm Dương Hư Suy' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Dễ hoảng sợ' WHERE b.name='Tâm Dương Hư Suy' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Bụng lạnh đầy' WHERE b.name='Tâm Dương Hư Suy' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Ngực đau nhói' WHERE b.name='Tâm Dương Hư Suy' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi nhạt bệu' WHERE b.name='Tâm Dương Hư Suy' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mạch tế sác' WHERE b.name='Tâm Dương Hư Suy' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Cơ thể suy nhược' WHERE b.name='Tâm Dương Hư Suy' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Cơ thể mệt mỏi' WHERE b.name='Tâm âm hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mạch tế sác' WHERE b.name='Tâm âm hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Hồi hộp, lo âu' WHERE b.name='Tâm âm hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Hay quên, mất ngủ' WHERE b.name='Tâm âm hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Dễ hoảng hốt' WHERE b.name='Tâm âm hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Miệng khô, khát nước' WHERE b.name='Tâm âm hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Đầu choáng, tai ù' WHERE b.name='Tâm âm hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Lòng bàn tay chân nóng' WHERE b.name='Tâm âm hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi đỏ ít rêu' WHERE b.name='Tâm âm hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Người gầy, sắc mặt kém' WHERE b.name='Tâm âm hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Sợ Lạnh' WHERE b.name='Tâm Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau Bụng' WHERE b.name='Tâm Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='buồn nôn' WHERE b.name='Tâm Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='chân tay lạnh' WHERE b.name='Tâm Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='kinh nguyệt không đều' WHERE b.name='Tâm Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Khí Hư Nhiều' WHERE b.name='Tâm Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='ăn uống kém' WHERE b.name='Tâm Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Rêu lưỡi trắng mỏng' WHERE b.name='Tâm Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Hồi hộp trống ngực' WHERE b.name='Tâm Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Dễ giật mình' WHERE b.name='Tâm Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Uể oải tinh thần' WHERE b.name='Tâm Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Đầy bụng chậm tiêu' WHERE b.name='Tâm Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mệt mỏi chân tay' WHERE b.name='Tâm Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Chóng mặt ù tai' WHERE b.name='Tâm Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiêu chảy' WHERE b.name='Tâm Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi nhợt' WHERE b.name='Tâm Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mạch vi tế' WHERE b.name='Tâm Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mặt nhợt nhạt' WHERE b.name='Tâm Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Tự đổ mồ hôi' WHERE b.name='Tâm Dương Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='buồn nôn' WHERE b.name='Tâm Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Chóng mặt' WHERE b.name='Tâm Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='đau đầu' WHERE b.name='Tâm Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='hay quên' WHERE b.name='Tâm Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='kinh nguyệt không đều' WHERE b.name='Tâm Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='mất ngủ' WHERE b.name='Tâm Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Đầy bụng khó tiêu' WHERE b.name='Tâm Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Rêu lưỡi mỏng trắng' WHERE b.name='Tâm Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Hồi hộp trống ngực' WHERE b.name='Tâm Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Dễ giật mình' WHERE b.name='Tâm Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Khó tập trung' WHERE b.name='Tâm Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='U uất, buồn rầu' WHERE b.name='Tâm Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Hay mê sảng' WHERE b.name='Tâm Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mỏi mệt toàn thân' WHERE b.name='Tâm Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Ra mồ hôi trộm' WHERE b.name='Tâm Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Khó có thai' WHERE b.name='Tâm Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mạch tế nhược' WHERE b.name='Tâm Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Người gầy yếu' WHERE b.name='Tâm Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mệt mỏi vô lực' WHERE b.name='Tâm Khí Hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='buồn nôn' WHERE b.name='Tâm Dương Hư Suy' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='đau đầu' WHERE b.name='Tâm Dương Hư Suy' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='hay quên' WHERE b.name='Tâm Dương Hư Suy' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='kinh nguyệt không đều' WHERE b.name='Tâm Dương Hư Suy' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='mất ngủ' WHERE b.name='Tâm Dương Hư Suy' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Sắc mặt nhợt nhạt' WHERE b.name='Tâm Dương Hư Suy' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Đầy bụng khó tiêu' WHERE b.name='Tâm Dương Hư Suy' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Hồi hộp trống ngực' WHERE b.name='Tâm Dương Hư Suy' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Dễ giật mình' WHERE b.name='Tâm Dương Hư Suy' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Ra mồ hôi trộm' WHERE b.name='Tâm Dương Hư Suy' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mạch tế nhược' WHERE b.name='Tâm Dương Hư Suy' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Trầm cảm, u uất' WHERE b.name='Tâm Dương Hư Suy' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mệt mỏi, uể oải' WHERE b.name='Tâm Dương Hư Suy' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Chóng mặt, hoa mắt' WHERE b.name='Tâm Dương Hư Suy' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Tê bì chân tay' WHERE b.name='Tâm Dương Hư Suy' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Cảm giác lạnh chân tay' WHERE b.name='Tâm Dương Hư Suy' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau bụng, tiêu chảy lúc sáng sớm' WHERE b.name='Tâm Dương Hư Suy' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Khí hư loãng' WHERE b.name='Tâm Dương Hư Suy' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Khó thụ thai' WHERE b.name='Tâm Dương Hư Suy' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi nhợt, rêu mỏng' WHERE b.name='Tâm Dương Hư Suy' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Giảm cân' WHERE b.name='Tâm Dương Hư Suy' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Sức đề kháng kém' WHERE b.name='Tâm Dương Hư Suy' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi Đỏ' WHERE b.name='Tâm hoả thượng viêm' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='đau đầu' WHERE b.name='Tâm hoả thượng viêm' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='khát nước' WHERE b.name='Tâm hoả thượng viêm' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='mắt đỏ' WHERE b.name='Tâm hoả thượng viêm' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='miệng đắng' WHERE b.name='Tâm hoả thượng viêm' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mạch Sác' WHERE b.name='Tâm hoả thượng viêm' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Rêu Lưỡi Vàng' WHERE b.name='Tâm hoả thượng viêm' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau đầu chóng mặt' WHERE b.name='Tâm hoả thượng viêm' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mạch huyền' WHERE b.name='Tâm hoả thượng viêm' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Bứt rứt khó ngủ' WHERE b.name='Tâm hoả thượng viêm' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Người nóng bứt rứt' WHERE b.name='Tâm hoả thượng viêm' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mạch hoạt sác' WHERE b.name='Tâm hoả thượng viêm' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Hay hồi hộp' WHERE b.name='Tâm hoả thượng viêm' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Miệng khô, khát nước' WHERE b.name='Tâm hoả thượng viêm' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Tính tình nóng nảy' WHERE b.name='Tâm hoả thượng viêm' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu tiện đỏ' WHERE b.name='Tâm hoả thượng viêm' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Loét miệng lưỡi' WHERE b.name='Tâm hoả thượng viêm' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Bồn chồn, dễ cáu gắt' WHERE b.name='Tâm hoả thượng viêm' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mất ngủ, hay mê sảng' WHERE b.name='Tâm hoả thượng viêm' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Nóng nảy, hay quên' WHERE b.name='Tâm hoả thượng viêm' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau tức ngực' WHERE b.name='Tâm hoả thượng viêm' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Buồn nôn, ợ hơi' WHERE b.name='Tâm hoả thượng viêm' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mặt đỏ, mắt đỏ' WHERE b.name='Tâm hoả thượng viêm' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Họng khô, đau rát' WHERE b.name='Tâm hoả thượng viêm' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mụn nhọt, lở loét' WHERE b.name='Tâm hoả thượng viêm' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi đỏ, rêu vàng khô' WHERE b.name='Tâm hoả thượng viêm' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Sốt nhẹ về chiều' WHERE b.name='Tâm hoả thượng viêm' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Da nóng' WHERE b.name='Tâm hoả thượng viêm' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='khát nước' WHERE b.name='Tâm di nhiệt sang tiểu trường' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='miệng khô' WHERE b.name='Tâm di nhiệt sang tiểu trường' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu buốt' WHERE b.name='Tâm di nhiệt sang tiểu trường' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='tiểu rắt' WHERE b.name='Tâm di nhiệt sang tiểu trường' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mạch Sác' WHERE b.name='Tâm di nhiệt sang tiểu trường' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Rêu Lưỡi Vàng' WHERE b.name='Tâm di nhiệt sang tiểu trường' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Tâm Phiền' WHERE b.name='Tâm di nhiệt sang tiểu trường' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Bứt rứt khó ngủ' WHERE b.name='Tâm di nhiệt sang tiểu trường' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Sắc mặt đỏ' WHERE b.name='Tâm di nhiệt sang tiểu trường' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu tiện đỏ' WHERE b.name='Tâm di nhiệt sang tiểu trường' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Nước tiểu ít' WHERE b.name='Tâm di nhiệt sang tiểu trường' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Đầu lưỡi đỏ' WHERE b.name='Tâm di nhiệt sang tiểu trường' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mạch hữu lực' WHERE b.name='Tâm di nhiệt sang tiểu trường' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Miệng Lưỡi Lở Loét' WHERE b.name='Tâm di nhiệt sang tiểu trường' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Tâm phiền, hồi hộp' WHERE b.name='Tâm di nhiệt sang tiểu trường' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Khát nước, thích lạnh' WHERE b.name='Tâm di nhiệt sang tiểu trường' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu buốt, tiểu rắt' WHERE b.name='Tâm di nhiệt sang tiểu trường' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Nóng rát niệu đạo' WHERE b.name='Tâm di nhiệt sang tiểu trường' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi đỏ, đầu lưỡi đỏ' WHERE b.name='Tâm di nhiệt sang tiểu trường' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Rêu lưỡi vàng mỏng' WHERE b.name='Tâm di nhiệt sang tiểu trường' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mạch sác, mạch huyền' WHERE b.name='Tâm di nhiệt sang tiểu trường' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Sợ Lạnh' WHERE b.name='Tỳ dương hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Tay Chân Lạnh' WHERE b.name='Tỳ dương hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau Bụng Âm Ỉ' WHERE b.name='Tỳ dương hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Bụng Đầy Trướng' WHERE b.name='Tỳ dương hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='chân tay lạnh' WHERE b.name='Tỳ dương hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='ăn uống kém' WHERE b.name='Tỳ dương hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Đại tiện lỏng nát' WHERE b.name='Tỳ dương hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Sợ lạnh, thích ấm' WHERE b.name='Tỳ dương hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Thích chườm ấm' WHERE b.name='Tỳ dương hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi nhợt bệu' WHERE b.name='Tỳ dương hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mạch trầm trì nhược' WHERE b.name='Tỳ dương hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Sắc mặt vàng bủng' WHERE b.name='Tỳ dương hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Cơ thể mệt mỏi' WHERE b.name='Tỳ dương hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Băng lậu' WHERE b.name='Tỳ dương hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Người mệt mỏi' WHERE b.name='Tỳ dương hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Người gầy yếu' WHERE b.name='Tỳ dương hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Kinh nguyệt loãng nhạt' WHERE b.name='Tỳ dương hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Rêu lưỡi trắng dày' WHERE b.name='Tỳ dương hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Sôi bụng' WHERE b.name='Tỳ dương hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Kinh nguyệt lượng nhiều' WHERE b.name='Tỳ dương hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Kinh nguyệt màu nhạt' WHERE b.name='Tỳ dương hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Sắc mặt vàng úa' WHERE b.name='Tỳ dương hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi Đỏ' WHERE b.name='Đại Trường Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Sốt nhẹ' WHERE b.name='Đại Trường Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='khát nước' WHERE b.name='Đại Trường Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Đại tiện lỏng nát' WHERE b.name='Đại Trường Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Rêu lưỡi vàng dày' WHERE b.name='Đại Trường Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Người mệt mỏi' WHERE b.name='Đại Trường Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Phân có nhầy máu' WHERE b.name='Đại Trường Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Hậu môn nóng rát' WHERE b.name='Đại Trường Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mót rặn' WHERE b.name='Đại Trường Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Bụng đau quặn' WHERE b.name='Đại Trường Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu tiện vàng' WHERE b.name='Đại Trường Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mạch nhu sác' WHERE b.name='Đại Trường Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Khó chịu' WHERE b.name='Đại Trường Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu tiện vàng đỏ' WHERE b.name='Đại Trường Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Sắc mặt kém tươi' WHERE b.name='Đại Trường Thấp Nhiệt' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mệt Mỏi' WHERE b.name='Can khí uất kết' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='buồn nôn' WHERE b.name='Can khí uất kết' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Chóng mặt' WHERE b.name='Can khí uất kết' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='đau đầu' WHERE b.name='Can khí uất kết' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='mất ngủ' WHERE b.name='Can khí uất kết' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Rêu lưỡi trắng mỏng' WHERE b.name='Can khí uất kết' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Dễ cáu giận' WHERE b.name='Can khí uất kết' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Hay buồn bực' WHERE b.name='Can khí uất kết' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Khó chịu trong lòng' WHERE b.name='Can khí uất kết' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Trầm cảm nhẹ' WHERE b.name='Can khí uất kết' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Đầy bụng, chướng hơi' WHERE b.name='Can khí uất kết' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Ăn uống kém ngon' WHERE b.name='Can khí uất kết' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Ợ hơi, ợ chua' WHERE b.name='Can khí uất kết' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau bụng lâm râm' WHERE b.name='Can khí uất kết' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Rối loạn tiêu hóa' WHERE b.name='Can khí uất kết' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau tức ngực sườn' WHERE b.name='Can khí uất kết' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau vùng thượng vị' WHERE b.name='Can khí uất kết' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Căng cơ' WHERE b.name='Can khí uất kết' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Khó chịu trước kỳ kinh' WHERE b.name='Can khí uất kết' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Ngực căng tức trước kỳ kinh' WHERE b.name='Can khí uất kết' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi có thể bình thường hoặc hơi đỏ' WHERE b.name='Can khí uất kết' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Sắc mặt có thể không tươi' WHERE b.name='Can khí uất kết' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Khó chịu toàn thân' WHERE b.name='Can khí uất kết' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Hay thở Dài' WHERE b.name='Can vị bất hoà' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Tinh thần uất ức' WHERE b.name='Can vị bất hoà' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Đầy bụng khó tiêu' WHERE b.name='Can vị bất hoà' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Tức ngực sườn' WHERE b.name='Can vị bất hoà' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mạch huyền' WHERE b.name='Can vị bất hoà' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Người mệt mỏi' WHERE b.name='Can vị bất hoà' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Dễ cáu gắt' WHERE b.name='Can vị bất hoà' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Sắc mặt kém tươi' WHERE b.name='Can vị bất hoà' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Ợ hơi, ợ chua' WHERE b.name='Can vị bất hoà' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau vùng thượng vị' WHERE b.name='Can vị bất hoà' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Chán ăn, buồn nôn' WHERE b.name='Can vị bất hoà' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau tức hạ sườn' WHERE b.name='Can vị bất hoà' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi đỏ, rêu mỏng' WHERE b.name='Can vị bất hoà' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Dễ Nổi Nóng' WHERE b.name='Can vị bất hoà' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='ăn uống kém' WHERE b.name='Can vị bất hoà' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Cơ thể mệt mỏi' WHERE b.name='Can vị bất hoà' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Đầy bụng, chướng hơi' WHERE b.name='Can vị bất hoà' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Tâm trạng bất ổn' WHERE b.name='Can vị bất hoà' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Đại tiện không thông' WHERE b.name='Can vị bất hoà' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Tức ngực, sườn đau' WHERE b.name='Can vị bất hoà' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Hồi Hộp' WHERE b.name='Tâm Thận Bất Giao' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Chóng mặt' WHERE b.name='Tâm Thận Bất Giao' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='đau đầu' WHERE b.name='Tâm Thận Bất Giao' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='hay quên' WHERE b.name='Tâm Thận Bất Giao' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='kinh nguyệt không đều' WHERE b.name='Tâm Thận Bất Giao' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='mất ngủ' WHERE b.name='Tâm Thận Bất Giao' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='ù tai' WHERE b.name='Tâm Thận Bất Giao' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='ăn uống kém' WHERE b.name='Tâm Thận Bất Giao' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='đổ mồ hôi trộm' WHERE b.name='Tâm Thận Bất Giao' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Đánh trống ngực' WHERE b.name='Tâm Thận Bất Giao' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Dễ cáu gắt' WHERE b.name='Tâm Thận Bất Giao' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mạch tế sác' WHERE b.name='Tâm Thận Bất Giao' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi đỏ ít rêu' WHERE b.name='Tâm Thận Bất Giao' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Sắc mặt kém tươi' WHERE b.name='Tâm Thận Bất Giao' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Bồn chồn' WHERE b.name='Tâm Thận Bất Giao' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Khô miệng, khát nước' WHERE b.name='Tâm Thận Bất Giao' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Nóng ran trong người' WHERE b.name='Tâm Thận Bất Giao' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu đêm nhiều lần' WHERE b.name='Tâm Thận Bất Giao' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau lưng mỏi gối' WHERE b.name='Tâm Thận Bất Giao' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Khô âm đạo' WHERE b.name='Tâm Thận Bất Giao' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Rối loạn tiền mãn kinh' WHERE b.name='Tâm Thận Bất Giao' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Gầy sút cân' WHERE b.name='Tâm Thận Bất Giao' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Khó Tiêu' WHERE b.name='Tâm Thận Bất Giao' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Hồi hộp trống ngực' WHERE b.name='Tâm Thận Bất Giao' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mất ngủ, ngủ không yên' WHERE b.name='Tâm Thận Bất Giao' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Lo âu, bồn chồn' WHERE b.name='Tâm Thận Bất Giao' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Nóng bừng mặt' WHERE b.name='Tâm Thận Bất Giao' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Khô hạn âm đạo' WHERE b.name='Tâm Thận Bất Giao' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Cảm giác nóng trong xương' WHERE b.name='Tâm Thận Bất Giao' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='buồn nôn' WHERE b.name='Thận âm dương lưỡng hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='chán ăn' WHERE b.name='Thận âm dương lưỡng hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='chân tay lạnh' WHERE b.name='Thận âm dương lưỡng hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Da khô' WHERE b.name='Thận âm dương lưỡng hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='hay quên' WHERE b.name='Thận âm dương lưỡng hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='kinh nguyệt không đều' WHERE b.name='Thận âm dương lưỡng hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Sắc mặt nhợt nhạt' WHERE b.name='Thận âm dương lưỡng hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='đổ mồ hôi trộm' WHERE b.name='Thận âm dương lưỡng hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Đầy bụng khó tiêu' WHERE b.name='Thận âm dương lưỡng hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Hồi hộp, lo âu' WHERE b.name='Thận âm dương lưỡng hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Dễ giật mình' WHERE b.name='Thận âm dương lưỡng hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mệt mỏi, uể oải' WHERE b.name='Thận âm dương lưỡng hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu đêm nhiều lần' WHERE b.name='Thận âm dương lưỡng hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau lưng mỏi gối' WHERE b.name='Thận âm dương lưỡng hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mất ngủ, ngủ không yên' WHERE b.name='Thận âm dương lưỡng hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Khô hạn âm đạo' WHERE b.name='Thận âm dương lưỡng hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Tiểu tiện không tự chủ' WHERE b.name='Thận âm dương lưỡng hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Rùng mình, sợ lạnh' WHERE b.name='Thận âm dương lưỡng hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Ù tai, giảm thính lực' WHERE b.name='Thận âm dương lưỡng hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mờ mắt' WHERE b.name='Thận âm dương lưỡng hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau nhức xương khớp' WHERE b.name='Thận âm dương lưỡng hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Run chân tay' WHERE b.name='Thận âm dương lưỡng hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Vô sinh, hiếm muộn' WHERE b.name='Thận âm dương lưỡng hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Rối loạn kinh nguyệt' WHERE b.name='Thận âm dương lưỡng hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi nhạt, rêu mỏng' WHERE b.name='Thận âm dương lưỡng hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mạch trầm tế' WHERE b.name='Thận âm dương lưỡng hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Gầy yếu, sút cân' WHERE b.name='Thận âm dương lưỡng hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='kinh nguyệt không đều' WHERE b.name='Tâm huyết hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Đầy bụng khó tiêu' WHERE b.name='Tâm huyết hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Hồi hộp trống ngực' WHERE b.name='Tâm huyết hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mạch tế nhược' WHERE b.name='Tâm huyết hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mệt mỏi, uể oải' WHERE b.name='Tâm huyết hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Chóng mặt, hoa mắt' WHERE b.name='Tâm huyết hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Tê bì chân tay' WHERE b.name='Tâm huyết hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Khí hư loãng' WHERE b.name='Tâm huyết hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Mất ngủ, hay mê sảng' WHERE b.name='Tâm huyết hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Hay quên, mất tập trung' WHERE b.name='Tâm huyết hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Dễ xúc động, hay khóc' WHERE b.name='Tâm huyết hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Lo âu, bất an' WHERE b.name='Tâm huyết hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Đau đầu âm ỉ' WHERE b.name='Tâm huyết hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Kinh ít, màu nhạt' WHERE b.name='Tâm huyết hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Lưỡi nhạt, rêu mỏng trắng' WHERE b.name='Tâm huyết hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Da xanh xao' WHERE b.name='Tâm huyết hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Môi khô, nhợt nhạt' WHERE b.name='Tâm huyết hư' ON CONFLICT DO NOTHING;
INSERT INTO benh_dong_y_excel_trieu_chung (id_benh_dong_y_excel, id_trieu_chung) SELECT b.id, tc.id FROM benh_dong_y_excel b JOIN trieu_chung tc ON tc.ten_trieu_chung='Sụt cân' WHERE b.name='Tâm huyết hư' ON CONFLICT DO NOTHING;

COMMIT;
