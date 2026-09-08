/* anchors — TẦNG 1: "MỐC HUYỆT" (cắm mốc trước).
 * Huyệt DỄ ĐỊNH VỊ tuyệt đối vì nằm ngay mốc giải phẫu rõ ràng (lằn cổ tay, rốn, đầu vú, mắt gối…).
 * Đặt CHẮC các mốc này (đa nguồn xác nhận) → mọi huyệt khác (Tầng 2) suy ra THEO mốc, không đi lần lượt.
 * Mỗi mốc:  at = mốc giải phẫu trong model-frame  (HOẶC pos trực tiếp) + lý do dễ định vị.
 * conf = 'mốc' (cao nhất). Bộ này là XƯƠNG SỐNG để bạn duyệt trước.                            */
const { L } = require('./model-frame.cjs');

// acupoint → MỐC giải phẫu mà nó định nghĩa (để CHẤM TAY ghi đè mốc → huyệt Tầng 2 rải lại theo).
const CODE_LM = {
  LU9: 'WRIST', LU5: 'CUBITAL', CV8: 'NAVEL', CV2: 'PUBIS', CV22: 'STERNUM_TOP',
  CV23: 'LARYNX', CV24: 'MENTON', ST35: 'KNEE_EYE_LAT', ST17: 'NIPPLE', ST12: 'CLAVICLE',
  ST31: 'HIP_ANT', CV17: 'STERNUM',
};

// CODE → { at: '<MỐC>' | pos:{x,y,z}, why }
const A = {
  /* ===== VAI / NÁCH — 11 huyệt =====
   *
   * Vùng hình học phức tạp nhất: nhiều lớp chồng, mốc di động theo tư thế. Nhưng atlas cho đúng thứ
   * cần — BA PHẦN cơ delta tách riêng (phần đòn / phần mỏm cùng / phần gai vai). Kiên Ngung nằm giữa
   * phần ĐÒN và phần MỎM CÙNG; Kiên Liêu nằm giữa phần MỎM CÙNG và phần GAI VAI.
   *
   * Việc này gỡ một nút thắt cũ: LI16 Cự Cốt trước đây có toạ độ TRÙNG KHÍT LI15, làm đoạn LI/vai
   * không dựng được đường kinh. Nay Cự Cốt neo vào hõm giữa đầu cùng vai xương đòn và gai xương bả vai.
   *
   * CHƯA CẮM SI9 Kiên Trinh và SI10 Nhu Du: cả hai neo vào AXILLA_POST (nếp nách sau), mà mốc đó đang
   * ở y=136,4cm — chỉ thấp hơn gai xương bả vai 1,7cm, trong khi nếp nách sau thật phải cách 6-8cm.
   * Dựng theo mốc sai thì SI9 và SI10 hội tụ (đo được cách 0,3cm). Để lại chờ soát AXILLA_POST.
   *
   * Ba lỗi công thức đã tự bắt: LU1 đặt 1,6 thốn dưới LU2 (đúng là 1) làm nó TRÙNG KHÍT SP20; và hai
   * lần dò gai xương bả vai bằng "điểm thấp nhất" đều bắt nhầm (góc dưới bả vai, rồi mép dải lọc) —
   * gai vai là SỐNG NHÔ RA SAU, phải dò bằng điểm sau nhất.                                          */
  GB21:  { pos: { x: 0.0611, y: 0.8373, z: -0.0088 }, why: 'Kiên Tỉnh — trung điểm mỏm gai C7 và mỏm cùng vai. Dịch 14.5cm so toạ độ cũ' },
  LI15:  { pos: { x: 0.1009, y: 0.8128, z: 0.0116 }, why: 'Kiên Ngung — hõm trước-dưới mỏm cùng vai, giữa phần ĐÒN và phần MỎM CÙNG của cơ delta. Dịch 7cm so toạ độ cũ' },
  LI16:  { pos: { x: 0.0706, y: 0.8411, z: -0.0239 }, why: 'Cự Cốt — hõm giữa đầu cùng vai xương đòn và gai xương bả vai. Dịch 2.9cm so toạ độ cũ' },
  LU1:   { pos: { x: 0.0552, y: 0.7904, z: 0.0483 }, why: 'Trung Phủ — dưới Vân Môn 1 thốn (gian sườn 1), 6 thốn ngang. Dịch 5.7cm so toạ độ cũ' },
  LU2:   { pos: { x: 0.0512, y: 0.8025, z: 0.0406 }, why: 'Vân Môn — hố dưới đòn, 6 thốn ngang (đo dọc mặt cong). Dịch 5.3cm so toạ độ cũ' },
  PC1:   { pos: { x: 0.0485, y: 0.7412, z: 0.0707 }, why: 'Thiên Trì — ngang đầu vú, 5 thốn ngang (ngoài đầu vú 1 thốn). Dịch 4.2cm so toạ độ cũ' },
  SI11:  { pos: { x: 0.0476, y: 0.7794, z: -0.083 }, why: 'Thiên Tông — hố dưới gai, 1/3 trên đường nối giữa gai vai với góc dưới xương bả vai. Dịch 8.4cm so toạ độ cũ' },
  SI12:  { pos: { x: 0.047, y: 0.8214, z: -0.0742 }, why: 'Bỉnh Phong — hố TRÊN gai, thẳng trên Thiên Tông. Dịch 3.4cm so toạ độ cũ' },
  SI13:  { pos: { x: 0.0305, y: 0.8136, z: -0.0761 }, why: 'Khúc Viên — đầu TRONG hố trên gai. Dịch 3.4cm so toạ độ cũ' },
  SP20: { pos: { x: 0.0666, y: 0.7984, z: 0.0398 }, why: 'Chu Vinh — khe gian sườn 2, cách đường giữa 6 thốn' },
  TE14:  { pos: { x: 0.1153, y: 0.8146, z: -0.0435 }, why: 'Kiên Liêu — hõm sau-dưới mỏm cùng vai, giữa phần MỎM CÙNG và phần GAI VAI của cơ delta. Dịch 6.5cm so toạ độ cũ' },

  /* ===== LƯNG — 38 huyệt hai đường Bàng Quang + bốn lỗ cùng =====
   *
   * Dựng từ mỏm gai đốt sống (đã có đủ C7–L5 trong model-frame) cộng thốn ngang lưng. Bốn đốt cùng
   * S1–S4 suy bằng cách chia đều chiều cao khối xương cùng.
   *
   * THỐN NGANG ĐO DỌC MẶT CONG, không đo theo đường thẳng: lưng cong, đi thẳng 5,8cm từ đường giữa
   * sẽ chui vào trong người ở chỗ cong. Lấy lát cắt ngang, giữ đường bao SAU, cộng dồn chiều dài cung
   * rồi dừng ở đúng số thốn. Vì thế toạ độ x nhỏ hơn số thốn nhân ra (đường trong ra x≈2,2cm cho
   * 1,5 thốn = 2,9cm cung).
   *
   * Vị trí cũ sai nặng và có hệ thống: BL11 và BL13 nằm ở x≈0 — tức ĐÈ LÊN ĐỐC MẠCH; BL11 lại ở
   * y=147,5cm, cao hơn cả mỏm gai C7 (144,6cm). Đường ngoài thì lúc 5,8cm lúc 1,1cm.
   *
   * Một lỗi của chính cách dựng đã tự bắt: lấy VERT_SACRUM (TRỌNG TÂM cả khối xương cùng, y=94,8cm)
   * làm "đốt kế tiếp" của L5 thì khe L5/S1 tụt xuống 97,7cm — thấp hơn cả mức S1, làm BL26 rơi xuống
   * DƯỚI BL27. Phải dùng ĐỈNH xương cùng.                                                           */
  BL11: { pos: { x: 0.0168, y: 0.8250, z: -0.0726 }, why: 'đường Bàng Quang TRONG — cách đường giữa lưng 1,5 thốn' },
  BL12: { pos: { x: 0.0168, y: 0.8113, z: -0.0738 }, why: 'đường Bàng Quang TRONG — cách đường giữa lưng 1,5 thốn' },
  BL13: { pos: { x: 0.0168, y: 0.7985, z: -0.0736 }, why: 'đường Bàng Quang TRONG — cách đường giữa lưng 1,5 thốn' },
  BL14: { pos: { x: 0.0168, y: 0.7806, z: -0.0771 }, why: 'đường Bàng Quang TRONG — cách đường giữa lưng 1,5 thốn' },
  BL15: { pos: { x: 0.0168, y: 0.7596, z: -0.0780 }, why: 'đường Bàng Quang TRONG — cách đường giữa lưng 1,5 thốn' },
  BL16: { pos: { x: 0.0168, y: 0.7435, z: -0.0759 }, why: 'đường Bàng Quang TRONG — cách đường giữa lưng 1,5 thốn' },
  BL17: { pos: { x: 0.0168, y: 0.7288, z: -0.0718 }, why: 'đường Bàng Quang TRONG — cách đường giữa lưng 1,5 thốn' },
  BL18: { pos: { x: 0.0168, y: 0.6969, z: -0.0682 }, why: 'đường Bàng Quang TRONG — cách đường giữa lưng 1,5 thốn' },
  BL19: { pos: { x: 0.0168, y: 0.6830, z: -0.0654 }, why: 'đường Bàng Quang TRONG — cách đường giữa lưng 1,5 thốn' },
  BL20: { pos: { x: 0.0168, y: 0.6703, z: -0.0636 }, why: 'đường Bàng Quang TRONG — cách đường giữa lưng 1,5 thốn' },
  BL21: { pos: { x: 0.0168, y: 0.6536, z: -0.0622 }, why: 'đường Bàng Quang TRONG — cách đường giữa lưng 1,5 thốn' },
  BL22: { pos: { x: 0.0168, y: 0.6351, z: -0.0591 }, why: 'đường Bàng Quang TRONG — cách đường giữa lưng 1,5 thốn' },
  BL23: { pos: { x: 0.0168, y: 0.6190, z: -0.0578 }, why: 'đường Bàng Quang TRONG — cách đường giữa lưng 1,5 thốn' },
  BL24: { pos: { x: 0.0168, y: 0.6063, z: -0.0573 }, why: 'đường Bàng Quang TRONG — cách đường giữa lưng 1,5 thốn' },
  BL25: { pos: { x: 0.0168, y: 0.5931, z: -0.0583 }, why: 'đường Bàng Quang TRONG — cách đường giữa lưng 1,5 thốn' },
  BL26: { pos: { x: 0.0168, y: 0.5851, z: -0.0606 }, why: 'đường Bàng Quang TRONG — cách đường giữa lưng 1,5 thốn' },
  BL27: { pos: { x: 0.0168, y: 0.5763, z: -0.0646 }, why: 'đường Bàng Quang TRONG — cách đường giữa lưng 1,5 thốn' },
  BL28: { pos: { x: 0.0168, y: 0.5595, z: -0.0717 }, why: 'đường Bàng Quang TRONG — cách đường giữa lưng 1,5 thốn' },
  BL29: { pos: { x: 0.0168, y: 0.5427, z: -0.0796 }, why: 'đường Bàng Quang TRONG — cách đường giữa lưng 1,5 thốn' },
  BL30: { pos: { x: 0.0168, y: 0.5259, z: -0.0821 }, why: 'đường Bàng Quang TRONG — cách đường giữa lưng 1,5 thốn' },
  BL31:  { pos: { x: 0.0047, y: 0.5763, z: -0.0649 }, why: 'lỗ cùng sau thứ 1' },
  BL32:  { pos: { x: 0.0096, y: 0.5595, z: -0.0698 }, why: 'lỗ cùng sau thứ 2' },
  BL33:  { pos: { x: 0.0067, y: 0.5427, z: -0.0736 }, why: 'lỗ cùng sau thứ 3' },
  BL34:  { pos: { x: 0.0071, y: 0.5259, z: -0.0778 }, why: 'lỗ cùng sau thứ 4' },
  BL41: { pos: { x: 0.0336, y: 0.8113, z: -0.0792 }, why: 'đường Bàng Quang NGOÀI — cách đường giữa lưng 3 thốn' },
  BL42: { pos: { x: 0.0336, y: 0.7985, z: -0.0790 }, why: 'đường Bàng Quang NGOÀI — cách đường giữa lưng 3 thốn' },
  BL43: { pos: { x: 0.0336, y: 0.7806, z: -0.0845 }, why: 'đường Bàng Quang NGOÀI — cách đường giữa lưng 3 thốn' },
  BL44: { pos: { x: 0.0336, y: 0.7596, z: -0.0836 }, why: 'đường Bàng Quang NGOÀI — cách đường giữa lưng 3 thốn' },
  BL45: { pos: { x: 0.0336, y: 0.7435, z: -0.0794 }, why: 'đường Bàng Quang NGOÀI — cách đường giữa lưng 3 thốn' },
  BL46: { pos: { x: 0.0336, y: 0.7288, z: -0.0776 }, why: 'đường Bàng Quang NGOÀI — cách đường giữa lưng 3 thốn' },
  BL47: { pos: { x: 0.0336, y: 0.6969, z: -0.0705 }, why: 'đường Bàng Quang NGOÀI — cách đường giữa lưng 3 thốn' },
  BL48: { pos: { x: 0.0336, y: 0.6830, z: -0.0671 }, why: 'đường Bàng Quang NGOÀI — cách đường giữa lưng 3 thốn' },
  BL49: { pos: { x: 0.0336, y: 0.6703, z: -0.0643 }, why: 'đường Bàng Quang NGOÀI — cách đường giữa lưng 3 thốn' },
  BL50: { pos: { x: 0.0336, y: 0.6536, z: -0.0625 }, why: 'đường Bàng Quang NGOÀI — cách đường giữa lưng 3 thốn' },
  BL51: { pos: { x: 0.0336, y: 0.6351, z: -0.0587 }, why: 'đường Bàng Quang NGOÀI — cách đường giữa lưng 3 thốn' },
  BL52: { pos: { x: 0.0336, y: 0.6190, z: -0.0552 }, why: 'đường Bàng Quang NGOÀI — cách đường giữa lưng 3 thốn' },
  BL53: { pos: { x: 0.0336, y: 0.5595, z: -0.0745 }, why: 'đường Bàng Quang NGOÀI — cách đường giữa lưng 3 thốn' },
  BL54: { pos: { x: 0.0336, y: 0.5259, z: -0.0819 }, why: 'đường Bàng Quang NGOÀI — cách đường giữa lưng 3 thốn' },

  /* ===== ĐỐC MẠCH — 26 huyệt đường giữa sau =====
   *
   * Đây là kinh DUY NHẤT chưa từng qua engine: 28 huyệt vẫn ở dạng cực toạ độ {h,az} từ bản dựng tay
   * cũ. Nay chuyển sang Descartes, dựng từ hai nguồn hình học có sẵn:
   *   · GV3–GV14: khe DƯỚI mỏm gai đốt sống (trung điểm hai mỏm gai liên tiếp), chiếu ra da lưng;
   *   · GV15–GV24: trên CUNG SỌ, theo thốn tính từ chân tóc.
   *
   * PHÁT HIỆN LỚN CỦA ĐỢT NÀY: thang thốn trên cung sọ SAI. Ảnh sách cho mốc dứt khoát — Bách Hội là
   * giao của đường giữa với ĐƯỜNG NỐI HAI ĐỈNH TAI. Dựng theo mốc đó thì nó rơi đúng đỉnh sọ (y=171,9;
   * 31%% chiều dài cung), còn thang chia đều 18 thốn đẩy nó tới 44%%, LỆCH RA SAU ĐỈNH 6,6cm.
   * Đã neo lại cung bằng ba mốc đo được — xem HEAD_ARC_NEO trong model-frame.cjs. Việc này sửa luôn
   * hai mốc chân tóc và mọi huyệt đầu của BL/GB, không riêng Đốc Mạch.
   *
   * GV1 (Trường Cường) chưa dựng: atlas không có xương cụt tách riêng. GV28 (Ngân Giao) nằm trong
   * khoang miệng, không có trên mặt da — cả hai để lại.                                             */
  GV2:   { pos: { x: 0, y: 0.5066, z: -0.0734 }, why: 'Yêu Du — mốc riêng dò trên mesh' },
  GV3:   { pos: { x: 0, y: 0.5931, z: -0.0582 }, why: 'Yêu Dương Quan — khe dưới mỏm gai đốt sống L4/L5, chiếu ra da lưng đường giữa' },
  GV4:   { pos: { x: 0, y: 0.619, z: -0.0559 }, why: 'Mệnh Môn — khe dưới mỏm gai đốt sống L2/L3, chiếu ra da lưng đường giữa' },
  GV5:   { pos: { x: 0, y: 0.6351, z: -0.0576 }, why: 'Huyền Xu — khe dưới mỏm gai đốt sống L1/L2, chiếu ra da lưng đường giữa' },
  GV6:   { pos: { x: 0, y: 0.6703, z: -0.0587 }, why: 'Tích Trung — khe dưới mỏm gai đốt sống T11/T12, chiếu ra da lưng đường giữa' },
  GV7:   { pos: { x: 0, y: 0.683, z: -0.0591 }, why: 'Trung Xu — khe dưới mỏm gai đốt sống T10/T11, chiếu ra da lưng đường giữa' },
  GV8:   { pos: { x: 0, y: 0.6969, z: -0.0619 }, why: 'Cân Súc — khe dưới mỏm gai đốt sống T9/T10, chiếu ra da lưng đường giữa' },
  GV9:   { pos: { x: 0, y: 0.7288, z: -0.0694 }, why: 'Chí Dương — khe dưới mỏm gai đốt sống T7/T8, chiếu ra da lưng đường giữa' },
  GV10:  { pos: { x: 0, y: 0.7435, z: -0.0726 }, why: 'Linh Đài — khe dưới mỏm gai đốt sống T6/T7, chiếu ra da lưng đường giữa' },
  GV11:  { pos: { x: 0, y: 0.7596, z: -0.073 }, why: 'Thần Đạo — khe dưới mỏm gai đốt sống T5/T6, chiếu ra da lưng đường giữa' },
  GV12:  { pos: { x: 0, y: 0.7985, z: -0.069 }, why: 'Thân Trụ — khe dưới mỏm gai đốt sống T3/T4, chiếu ra da lưng đường giữa' },
  GV13:  { pos: { x: 0, y: 0.825, z: -0.0684 }, why: 'Đào Đạo — khe dưới mỏm gai đốt sống T1/T2, chiếu ra da lưng đường giữa' },
  GV14:  { pos: { x: 0, y: 0.8363, z: -0.0667 }, why: 'Đại Chuỳ — khe dưới mỏm gai đốt sống C7/T1, chiếu ra da lưng đường giữa' },
  GV15:  { pos: { x: 0, y: 0.9061, z: -0.0544 }, why: 'Á Môn — trên CUNG SỌ ở 14.5 thốn (thang đã neo bằng Bách Hội)' },
  GV16:  { pos: { x: 0, y: 0.9145, z: -0.0601 }, why: 'Phong Phủ — trên CUNG SỌ ở 14 thốn (thang đã neo bằng Bách Hội)' },
  GV17:  { pos: { x: 0, y: 0.9424, z: -0.072 }, why: 'Não Hộ — trên CUNG SỌ ở 12.5 thốn (thang đã neo bằng Bách Hội)' },
  GV18:  { pos: { x: 0, y: 0.9739, z: -0.0641 }, why: 'Cường Gian — trên CUNG SỌ ở 11 thốn (thang đã neo bằng Bách Hội)' },
  GV19:  { pos: { x: 0, y: 0.994, z: -0.0433 }, why: 'Hậu Đỉnh — trên CUNG SỌ ở 9.5 thốn (thang đã neo bằng Bách Hội)' },
  GV20:  { pos: { x: 0, y: 1, z: -0.0149 }, why: 'Bách Hội — trên CUNG SỌ ở 8 thốn (thang đã neo bằng Bách Hội)' },
  GV21:  { pos: { x: 0, y: 0.9993, z: 0.0028 }, why: 'Tiền Đỉnh — trên CUNG SỌ ở 6.5 thốn (thang đã neo bằng Bách Hội)' },
  GV22:  { pos: { x: 0, y: 0.9937, z: 0.0179 }, why: 'Tín Hội — trên CUNG SỌ ở 5 thốn (thang đã neo bằng Bách Hội)' },
  GV23:  { pos: { x: 0, y: 0.9892, z: 0.0279 }, why: 'Thượng Tinh — trên CUNG SỌ ở 4 thốn (thang đã neo bằng Bách Hội)' },
  GV24:  { pos: { x: 0, y: 0.9863, z: 0.0292 }, why: 'Thần Đình — trên CUNG SỌ ở 3.5 thốn (thang đã neo bằng Bách Hội)' },
  GV25:  { pos: { x: 0, y: 0.9109, z: 0.0611 }, why: 'Tố Liêu — mốc riêng dò trên mesh' },
  GV26:  { pos: { x: 0, y: 0.9036, z: 0.0526 }, why: 'Nhân Trung — mốc riêng dò trên mesh' },
  GV27:  { pos: { x: 0, y: 0.9003, z: 0.0515 }, why: 'Đoài Đoan — mốc riêng dò trên mesh' },

  /* ===== NHÂM MẠCH — 21 huyệt đường giữa trước =====
   *
   * Vùng dễ thứ tư. Đường giữa KHÔNG phụ thuộc thốn ngang (thứ đã ba lần sai đơn vị), chỉ phụ thuộc
   * ba đoạn cốt độ dọc mà cả sáu đầu mút đều là XƯƠNG đo được: bờ trên xương mu →5 thốn→ rốn →8 thốn→
   * khớp ức-mũi ức →9 thốn→ hõm ức. Rốn lấy bằng cách dò điểm LÕM nhất trên da đường giữa bụng
   * (lõm 0,38cm so lân cận), không phải suy từ đốt sống.
   *
   * Xong đường giữa thì ngực–bụng–lưng có trục gốc để đo ngang ra — đó là lý do làm nó trước.
   *
   * Đợt này bắt được LỖI MỐC LÕI: STERNUM_TOP thấp hơn đáy hõm ức 3,4cm (xem ghi chú trong
   * model-frame.cjs). Nó ảnh hưởng cả trục chest_up và mọi huyệt ngực.
   * Và một lỗi bảng thốn của chính tôi: xếp CV6 ở 4,5 thốn kể từ xương mu làm nó nhảy LÊN TRÊN CV7 —
   * đúng phải 3,5 (tức 1,5 thốn dưới rốn).                                                          */
  CV16:  { pos: { x: 0, y: 0.7343, z: 0.0666 }, why: 'Trung Đình — đường giữa trước, dựng theo cốt độ WHO trên ba đoạn xương: bờ trên xương mu →5 thốn→ rốn →8 thốn→ khớp ức-mũi ức →9 thốn→ hõm ức; rồi chiếu ra da đường giữa' },
  CV17: { pos: { x: 0.0000, y: 0.7458, z: 0.0862 }, why: 'Đản Trung — khe gian sườn 4, đường giữa' },
  CV18: { pos: { x: 0.0000, y: 0.7648, z: 0.0629 }, why: 'Ngọc Đường — khe gian sườn 3, đường giữa' },
  CV19: { pos: { x: 0.0000, y: 0.7827, z: 0.0552 }, why: 'Tử Cung — khe gian sườn 2, đường giữa' },
  CV20: { pos: { x: 0.0000, y: 0.8033, z: 0.0454 }, why: 'Hoa Cái — khe gian sườn 1, đường giữa' },
  CV21: { pos: { x: 0.0000, y: 0.8063, z: 0.0414 }, why: 'Nhâm Mạch ngực — đường giữa' },
  CV22: { pos: { x: 0.0000, y: 0.8153, z: 0.0369 }, why: 'Nhâm Mạch ngực — đường giữa' },

  /* ===== KHUỶU & GỐI — 12 nút khớp lớn =====
   *
   * Vùng dễ thứ ba. Xong nhóm này thì CẲNG TAY và CẲNG CHÂN bị kẹp giữa hai đầu đều đã chốt (cổ tay
   * ↔ khuỷu, cổ chân ↔ gối) — đó là lúc nội suy cốt độ mới thực sự đáng tin.
   *
   * Mốc dựng: lồi cầu trong/ngoài = đầu dưới xương cánh tay, cực trị hai phía · mỏm khuỷu = đầu trên
   * xương trụ, điểm sau nhất · gân cơ nhị đầu = đầu xa khối nhị đầu (kẹp LU5 ngoài / PC3 trong) ·
   * bánh chè, chỏm xương mác, lồi cầu trong xương chầy · ba gân vùng kheo (nhị đầu đùi ngoài, bán gân
   * và bán màng trong).
   *
   * HAI LỖI ĐÃ TỰ BẮT VÀ SỬA TRONG ĐỢT NÀY:
   *  1. Lấy ĐẦU BÁM của gân làm mốc nếp kheo — sai, vì gân bám xuống tận chỏm mác / xương chầy, thấp
   *     hơn nếp kheo và tách xa nhau, làm BL40 văng ra x=13,4cm và cách da 4,6cm. Phải cắt gân TẠI
   *     mức khe khớp gối.
   *  2. Chiếu LR8 ra da mặt SAU như KI10 — sai, nó trùng khít KI10. Khúc Tuyền ở đầu TRONG nếp kheo
   *     và ở TRƯỚC hai gân, nên phải chiếu ra da MẶT TRONG.
   *
   * BẢY HUYỆT DỊCH XA đã qua SOI ẢNH SÁCH trước khi cắm (SI8, KI10, BL40 soi trực tiếp; bốn huyệt còn
   * lại dùng chung quy tắc đã được ba ca kia xác nhận). Không dùng hai chỉ số nội bộ để phán xử chúng:
   * đo thấy cắm cả 12 làm "huyệt lệch khỏi đường kinh" 75→88 và "quãng rải" 4,78→5,00cm, nhưng cả hai
   * đo TÍNH NHẤT QUÁN giữa huyệt và đường — mà đường lại đi qua chính các mốc. Cắm mốc ĐÚNG nhưng khác
   * chỗ cũ thì đường bị bẻ theo, các huyệt lân cận (vẫn sai) lệch ra xa hơn, và huyệt được cắm thôi bị
   * rải nên quãng rải của hàng xóm tăng. Chỉ số xấu vì XÁO TRỘN, không vì mốc tệ. Phán xử bằng ba thứ
   * độc lập: quan-he-check (chiều giải phẫu), region-check (đúng bộ phận), và ẢNH SÁCH.             */
  LU5:   { pos: { x: 0.1345, y: 0.6518, z: 0.003 }, why: 'Xích Trạch — nếp khuỷu, bờ NGOÀI (quay) gân cơ nhị đầu. Dựng từ xương/gân atlas' },
  PC3:   { pos: { x: 0.1196, y: 0.6518, z: 0.0025 }, why: 'Khúc Trạch — nếp khuỷu, bờ TRONG (trụ) gân cơ nhị đầu. Dựng từ xương/gân atlas. SỬA: lệch 5.5cm so toạ độ cũ' },
  LI11:  { pos: { x: 0.1426, y: 0.6483, z: 0.0007 }, why: 'Khúc Trì — đầu NGOÀI nếp khuỷu, giữa Xích Trạch và lồi cầu ngoài. Dựng từ xương/gân atlas' },
  HT3:   { pos: { x: 0.1067, y: 0.6533, z: -0.005 }, why: 'Thiếu Hải — đầu TRONG nếp khuỷu, giữa Khúc Trạch và lồi cầu trong. Dựng từ xương/gân atlas. SỬA: lệch 6.6cm so toạ độ cũ' },
  GB34:  { pos: { x: 0.0702, y: 0.2499, z: -0.0007 }, why: 'Dương Lăng Tuyền — hõm TRƯỚC-DƯỚI chỏm xương mác. Dựng từ xương/gân atlas' },

  SI8:   { pos: { x: 0.1128, y: 0.6604, z: -0.0459 }, why: 'Tiểu Hải — rãnh giữa mỏm khuỷu và lồi cầu trong. Dựng từ xương atlas: trung điểm hai mốc, chiếu ra da mặt sau. ĐÃ SOI ẢNH: hình ghi rõ hai mốc "Mỏm khuỷu" và "Mỏm lồi cầu trong", huyệt nằm chính giữa — khớp cách dựng. SỬA LẦN 2: cửa sổ chiếu da rộng 1,7cm làm điểm trượt 0,2cm RA NGOÀI rãnh; siết cửa sổ x còn ±0,43cm thì về đúng rãnh.' },
  TE10:  { pos: { x: 0.1224, y: 0.6645, z: -0.0497 }, why: 'Thiên Tỉnh — trên mỏm khuỷu 1 thốn, mặt sau. Dựng từ xương/gân atlas. Dịch 0cm so toạ độ cũ.' },
  ST35:  { pos: { x: 0.0592, y: 0.2507, z: 0.0132 }, why: 'Độc Tỵ — mắt gối NGOÀI — hõm dưới-ngoài bánh chè, cạnh dây chằng bánh chè. Dựng từ xương/gân atlas. Dịch 0cm so toạ độ cũ.' },
  SP9:   { pos: { x: 0.0169, y: 0.2471, z: -0.0138 }, why: 'Âm Lăng Tuyền — hõm dưới bờ lồi cầu TRONG xương chầy. Dựng từ xương/gân atlas. Dịch 0cm so toạ độ cũ.' },
  BL40:  { pos: { x: 0.0485, y: 0.2619, z: -0.0544 }, why: 'Uỷ Trung — giữa nếp kheo, giữa gân nhị đầu đùi và gân bán gân. Dựng từ xương/gân atlas. Dịch 0cm so toạ độ cũ. ĐÃ SOI ẢNH: giữa nếp lằn kheo, giữa gân nhị đầu đùi và gân bán gân/bán màng — khớp cách dựng. Ảnh còn cho cốt độ đùi sau: BL36 →6 thốn→ BL37 →7→ BL38 →1→ nếp kheo.' },
  KI10:  { pos: { x: 0.029, y: 0.2727, z: -0.0486 }, why: 'Âm Cốc — đầu TRONG nếp kheo, giữa gân bán gân và gân bán màng. Dựng từ xương/gân atlas. Dịch 0cm so toạ độ cũ. ĐÃ SOI ẢNH: hình ghi rõ huyệt nằm giữa "gân cơ bán gân" và "gân của cơ bán màng" — khớp cách dựng.' },
  LR8:   { pos: { x: 0.0119, y: 0.2712, z: -0.014 }, why: 'Khúc Tuyền — đầu TRONG nếp kheo, ngay TRƯỚC gân bán gân/bán màng. Dựng từ xương/gân atlas. Dịch 0cm so toạ độ cũ.' },

  /* ===== CỔ TAY & CỔ CHÂN — 12 nút khớp =====
   *
   * Vùng dễ thứ hai sau góc móng, và là nút giữa của mọi kinh chi: cẳng tay bị kẹp giữa cổ tay và
   * khuỷu, bàn tay bị kẹp giữa cổ tay và đầu ngón — chốt chắc hai đầu thì đoạn giữa tự đúng.
   *
   * Atlas có đủ mốc để dựng thẳng, không phải đếm thốn: 8 xương cổ tay riêng lẻ (xương đậu định HT7,
   * xương tháp định SI5), xương quay/trụ (lằn khớp = đầu xa hai xương, y=88,4cm), gân cơ gấp cổ tay
   * quay + gan tay dài (kẹp PC7), gân duỗi ngón cái dài/ngắn (hố lào định LI5), GÂN GÓT có sẵn trong
   * atlas (định KI3 và BL60), xương sên/ghe/hộp, cơ chày trước + duỗi ngón cái dài (kẹp ST41).
   *
   * Quy tắc KI3 lấy từ ảnh sách: trên đường NGANG qua đỉnh mắt cá trong, giữa mắt cá và gân Achilles.
   * Bảng giải phẫu trong ảnh đó còn cho luôn thứ tự cả vùng (LR4 trước nhất → SP5 dưới-trước →
   * KI3 sau), dùng để kiểm chiều trước-sau của bốn huyệt quanh mắt cá trong.                        */
  LU9:   { pos: { x: 0.1658, y: 0.5166, z: 0.0215 }, why: 'Thái Uyên — lằn cổ tay, mé quay, ngoài gân cơ gấp cổ tay quay, trên ĐM quay. Dựng từ xương/gân thật trong atlas' },
  PC7:   { pos: { x: 0.154, y: 0.5146, z: 0.0247 }, why: 'Đại Lăng — giữa lằn cổ tay, giữa gân cơ gan tay dài và gân gấp cổ tay quay. Dựng từ xương/gân thật trong atlas' },
  HT7:   { pos: { x: 0.1389, y: 0.5146, z: 0.0219 }, why: 'Thần Môn — lằn cổ tay, mé trụ, bờ quay xương đậu. Dựng từ xương/gân thật trong atlas. SỬA: lệch 4.4cm so toạ độ cũ' },
  TE4:   { pos: { x: 0.143, y: 0.5124, z: -0.0022 }, why: 'Dương Trì — giữa lằn cổ tay mặt mu. Dựng từ xương/gân thật trong atlas' },
  SI5:   { pos: { x: 0.1333, y: 0.5139, z: 0.0047 }, why: 'Dương Cốc — khe giữa mỏm trâm trụ và xương tháp, mặt mu mé trụ. Dựng từ xương/gân thật trong atlas' },
  /* LI5 Dương Khê đã chuyển xuống VÒNG 27 — mục cũ dựng bằng phép dò GÂN duỗi ngón cái và ra
   * y = 85,55cm, thấp hơn lằn cổ tay 2,9cm. Xem lý do đo lại ở vòng 27. */
  KI3:   { pos: { x: 0.0215, y: 0.0467, z: -0.0197 }, why: 'Thái Khê — giữa đỉnh mắt cá trong và gân gót, ngang đỉnh mắt cá. Dựng từ xương/gân thật trong atlas. SỬA: lệch 4.8cm so toạ độ cũ' },
  BL60:  { pos: { x: 0.0515, y: 0.0286, z: -0.0383 }, why: 'Côn Lôn — giữa đỉnh mắt cá ngoài và gân gót. Dựng từ xương/gân thật trong atlas' },
  SP5:   { pos: { x: 0.0286, y: 0.0314, z: 0.0046 }, why: 'Thương Khâu — hõm trước-dưới mắt cá trong, giữa mắt cá và xương ghe. Dựng từ xương/gân thật trong atlas. SỬA: lệch 7cm so toạ độ cũ' },
  LR4:   { pos: { x: 0.0329, y: 0.0515, z: 0.0016 }, why: 'Trung Phong — trước mắt cá trong, mé trong gân cơ chày trước. Dựng từ xương/gân thật trong atlas. SỬA: lệch 6.8cm so toạ độ cũ' },
  ST41:  { pos: { x: 0.045, y: 0.0484, z: 0.0144 }, why: 'Giải Khê — giữa lằn cổ chân trước, giữa gân chày trước và gân duỗi ngón cái dài. Dựng từ xương/gân thật trong atlas' },
  /* GB40 SỬA: mốc cũ đặt ở z=6,9cm — tận giữa mu bàn chân, trong khi mắt cá ngoài ở z=−4,5.
   * Sách: hõm TRƯỚC–DƯỚI mắt cá ngoài. Sai này làm đường Đởm gấp ngược 145° ở bàn chân —
   * chính phép đo GÓC GẤP của đường mới lộ ra, ba bộ kiểm kia đều không thấy. */
  GB40: { pos: { x: 0.0728, y: 0.0212, z: -0.0073 }, why: 'Khâu Khư — hõm trước–dưới mắt cá ngoài' },

  /* ===== TỈNH HUYỆT — 12 điểm đầu/cuối kinh ở góc móng =====
   *
   * Đây là nhóm huyệt CHẮC CHẮN NHẤT của cả hệ, và vì thế được cắm làm mốc trước tiên: atlas gán nhãn
   * riêng cho TỪNG đốt ngón xa (đốt ngón cái, trỏ, giữa, nhẫn, út của cả tay lẫn chân), nên vị trí
   * suy thẳng từ hình học xương chứ không phải đếm thốn. Quy tắc lấy từ ảnh trong sách Focks: huyệt
   * nằm ở GIAO của bờ gần móng với bờ bên móng — tức góc móng, phía đã nêu.
   *
   * Dựng bằng: trục dọc đốt ngón xa (hai điểm xa nhau nhất) → đầu ngón là đầu xa cổ tay/mắt cá →
   * lát cắt chân móng ở 60% chiều dài kể từ đầu ngón → điểm cực trị theo phía yêu cầu → chiếu ra da.
   *
   * Vì sao chúng phải là MỐC chứ không để engine tự giải: chúng neo hai đầu của 12 đường kinh. Vùng
   * dễ định vị làm xong thì vùng khó mới suy ra được — cẳng tay nội suy giữa cổ tay và khuỷu, bàn tay
   * nội suy giữa cổ tay và đầu ngón. Sai một đầu mút là cả đoạn lệch theo.
   *
   * Đợt này bắt được một lỗi nặng: HT9 Thiếu Xung (ngón út) đang ở y=154cm — NGANG ĐẦU — lệch 80,4cm.
   * Mười huyệt còn lại chỉ dịch 0,3–2,3cm, tức vị trí cũ đại khái đúng, nay có gốc hình học thật.  */
  LU11:  { pos: { x: 0.1849, y: 0.4671, z: 0.0376 }, why: 'Thiếu Thương — góc móng ngón cái tay, mé quay — dựng từ xương đốt ngón xa trong atlas, lát cắt chân móng (60% chiều dài kể từ đầu ngón), cực trị phía đã nêu, rồi chiếu ra da' },
  LI1:   { pos: { x: 0.182, y: 0.4363, z: 0.0426 }, why: 'Thương Dương — góc móng ngón trỏ, mé quay — dựng từ xương đốt ngón xa trong atlas, lát cắt chân móng (60% chiều dài kể từ đầu ngón), cực trị phía đã nêu, rồi chiếu ra da' },
  PC9:   { pos: { x: 0.1629, y: 0.4255, z: 0.0543 }, why: 'Trung Xung — giữa đầu ngón giữa — dựng từ xương đốt ngón xa trong atlas, lát cắt chân móng (60% chiều dài kể từ đầu ngón), cực trị phía đã nêu, rồi chiếu ra da' },
  HT9:   { pos: { x: 0.1316, y: 0.4441, z: 0.0442 }, why: 'Thiếu Xung — góc móng ngón út tay, mé quay — dựng từ xương đốt ngón xa trong atlas, lát cắt chân móng (60% chiều dài kể từ đầu ngón), cực trị phía đã nêu, rồi chiếu ra da. SỬA LỚN: lệch 80.4cm so toạ độ cũ' },
  SI1:   { pos: { x: 0.1275, y: 0.4441, z: 0.0409 }, why: 'Thiếu Trạch — góc móng ngón út tay, mé trụ — dựng từ xương đốt ngón xa trong atlas, lát cắt chân móng (60% chiều dài kể từ đầu ngón), cực trị phía đã nêu, rồi chiếu ra da' },
  TE1:   { pos: { x: 0.1412, y: 0.4359, z: 0.0491 }, why: 'Quan Xung — góc móng ngón nhẫn, mé trụ — dựng từ xương đốt ngón xa trong atlas, lát cắt chân móng (60% chiều dài kể từ đầu ngón), cực trị phía đã nêu, rồi chiếu ra da' },
  SP1:   { pos: { x: 0.0579, y: 0.005, z: 0.0727 }, why: 'Ẩn Bạch — góc móng ngón cái chân, mé trong — dựng từ xương đốt ngón xa trong atlas, lát cắt chân móng (60% chiều dài kể từ đầu ngón), cực trị phía đã nêu, rồi chiếu ra da' },
  LR1:   { pos: { x: 0.0692, y: 0.0029, z: 0.0727 }, why: 'Đại Đôn — góc móng ngón cái chân, mé ngoài — dựng từ xương đốt ngón xa trong atlas, lát cắt chân móng (60% chiều dài kể từ đầu ngón), cực trị phía đã nêu, rồi chiếu ra da' },
  ST45:  { pos: { x: 0.0826, y: 0.0031, z: 0.0696 }, why: 'Lệ Đoài — góc móng ngón chân 2, mé ngoài — dựng từ xương đốt ngón xa trong atlas, lát cắt chân móng (60% chiều dài kể từ đầu ngón), cực trị phía đã nêu, rồi chiếu ra da' },
  GB44:  { pos: { x: 0.0966, y: 0.0063, z: 0.0589 }, why: 'Túc Khiếu Âm — góc móng ngón chân 4, mé ngoài — dựng từ xương đốt ngón xa trong atlas, lát cắt chân móng (60% chiều dài kể từ đầu ngón), cực trị phía đã nêu, rồi chiếu ra da' },
  BL67:  { pos: { x: 0.0977, y: 0.0035, z: 0.0443 }, why: 'Chí Âm — góc móng ngón chân út, mé ngoài — dựng từ xương đốt ngón xa trong atlas, lát cắt chân móng (60% chiều dài kể từ đầu ngón), cực trị phía đã nêu, rồi chiếu ra da' },
  KI1:   { pos: { x: 0.0559, y: 0.0046, z: 0.0242 }, why: 'Dũng Tuyền — gan bàn chân, 1/3 trước đường nối kẽ ngón 2-3 (đầu xa xương bàn chân 2 và 3) với điểm sau nhất xương gót, hạ xuống mặt gan chân' },


  // ===== Chi trên (LU) =====
  // Trung Phủ = Mộ huyệt Phế (quan trọng) · Vân Môn dưới đòn — hố dưới-đòn, KHÔNG phải mỏm vai

  // ===== Đầu–cổ–ngực–bụng (đường giữa & ngực, CV + ST) =====
  CV24: { at: 'MENTON',       why: 'Thừa Tương — lõm giữa dưới môi dưới' },
  CV23: { at: 'LARYNX',       why: 'Liêm Tuyền — bờ trên sụn giáp (yết hầu)' },
  ST17: { at: 'NIPPLE',       why: 'Nhũ Trung — chính giữa đầu vú' },
  ST12: { pos: { x: 0.0444, y: 0.8388, z: 0.0144 }, why: 'cột Vị ngực — cách đường giữa 4 thốn (đường giữa đòn)' },
  ST8:  { pos: { x: 0.0372, y: 0.9651, z: 0.0146 }, why: 'Đầu Duy — góc trán chân tóc (mốc đầu). SỬA: giá trị cũ (0,086; 0,957; 0,060) đặt trên mesh CŨ, cách da mesh v2 tới 10,5cm dù mang nhãn tin cậy CAO NHẤT (conf=mốc) — nay dò lại bằng điểm da NGOÀI nhất của dải trán trên (y 0,962–0,978, z>0,01), khớp x≈3,7 thốn ngang đầu' },

  // ===== Chi dưới (ST) =====
  ST31: { pos: { x: 0.0768, y: 0.5065, z: 0.0348 }, why: 'Bễ Quan — nếp bẹn, phễu đùi. SỬA: giá trị cũ (0,156; 0,495; 0,029) = x 26,8cm, tức NẰM TRÊN BÀN TAY — kiểm vùng bằng atlas cho xương gần nhất là "xương đốt bàn tay 2 trái", cách 1,9cm. Lệch 15,1cm mà vẫn mang conf=mốc, và nó bẻ cong cả đoạn đùi kinh Vị (đường trắc địa ST30→ST31 ra 82,9cm trong khi đường thẳng chỉ 21,8cm). Nay suy lại theo sách: mức bờ trên xương mu, trên đường nối gai chậu trước trên với xương bánh chè, rồi chiếu ra da' },

  /* ===== VÒNG 9 — VÙNG ĐẦU / MẶT (25 huyệt) =========================================================
   * Vùng khó nhất nên làm SAU CÙNG, đúng thứ tự "dễ trước, khó sau": mọi mốc dưới đây đều tựa vào
   * kết quả các vòng trước (Đầu Duy ST8, cung sọ Ấn Đường→C7, ổ mắt, cung gò má, lỗ tai).
   * Ba lỗi đã bắt trong vòng này, ghi lại để khỏi lặp:
   *  (1) THỐN NGANG ĐẦU sai 22% (1,74 → 1,42 cm) và ĐỒNG TỬ lệch vào trong 0,6cm — xem model-frame.cjs;
   *  (2) bảng thốn DỌC cũ lệch chuẩn WHO từ BL6 trở lên (ghi 6,5/8/9,5 thay vì 5,5/7/8,5 tính từ
   *      Ấn Đường), chính chỗ lệch đó đẩy huyệt lên đỉnh sọ tạo "vòng phình" người dùng nhìn thấy;
   *  (3) đo ngang bằng dải |Δy| cố định thì hỏng ở đỉnh sọ (đi ngang thì y tụt mạnh) — phải cắt bằng
   *      mặt phẳng VUÔNG GÓC tiếp tuyến cung dọc rồi bò trên da. Không huyệt nào cách da quá 1,5cm. */
  BL1:  { pos: { x: 0.0070, y: 0.9499, z: 0.0472 }, why: 'Tình Minh — hõm trên-trong khoé mắt trong' },
  BL2:  { pos: { x: 0.0098, y: 0.9540, z: 0.0475 }, why: 'Toản Trúc — hõm đầu TRONG lông mày' },
  BL3:  { pos: { x: 0.0112, y: 0.9818, z: 0.0323 }, why: 'Mi Xung — trên chân tóc trước 0,5 thốn, thẳng trên Toản Trúc (BL2)' },
  BL4:  { pos: { x: 0.0122, y: 0.9843, z: 0.0298 }, why: 'Khúc Sai — trên chân tóc trước 0,5 thốn, cách đường giữa 1,5 thốn' },
  BL5:  { pos: { x: 0.0117, y: 0.9880, z: 0.0247 }, why: 'Ngũ Xứ — trên chân tóc trước 1 thốn, cách đường giữa 1,5 thốn' },
  BL6:  { pos: { x: 0.0132, y: 0.9941, z: 0.0127 }, why: 'Thừa Quang — trên chân tóc trước 2,5 thốn, cách đường giữa 1,5 thốn' },
  BL7:  { pos: { x: 0.0133, y: 0.9980, z: -0.0095 }, why: 'Thông Thiên — trên chân tóc trước 4 thốn, cách đường giữa 1,5 thốn' },
  BL8:  { pos: { x: 0.0116, y: 0.9961, z: -0.0285 }, why: 'Lạc Khước — trên chân tóc trước 5,5 thốn, cách đường giữa 1,5 thốn' },
  BL9:  { pos: { x: 0.0085, y: 0.9452, z: -0.0723 }, why: 'Ngọc Chẩm — ngang bờ trên ụ chẩm ngoài, cách đường giữa 1,3 thốn' },
  GB1:  { pos: { x: 0.0311, y: 0.9304, z: 0.0311 }, why: 'Đồng Tử Liêu — ngoài khoé mắt ngoài 0,5 thốn, bờ ngoài ổ mắt' },
  GB2:  { pos: { x: 0.0375, y: 0.9156, z: -0.0016 }, why: 'Thính Hội — trước khuyết gian bình tai, dưới Thính Cung 0,5 thốn' },
  GB3:  { pos: { x: 0.0376, y: 0.9242, z: 0.0171 }, why: 'Thượng Quan — bờ TRÊN cung gò má, thẳng trên Hạ Quan' },
  /* Cụm QUANH TAI dựng lại (đợt 9b): mô hình KHÔNG có vành tai — biên dạng ngang đầu trơn tuột,
   * không có chỗ nhô — nên mốc cũ lấy "điểm ngoài nhất của xương thái dương" là sai chỗ, đẩy GB2 lên
   * cao hơn ST7 tới 4,4cm (luật "GB3 phải cao hơn ST7" bắt được). Nay suy từ ba mốc xương đo được:
   * hõm ống tai (vỏ ngoài xương thái dương lõm nhất, y 158,1 · z −1,5), mỏm chũm (y 155,3) và đoạn
   * cung gò má còn là THANH XƯƠNG SẠCH ở z≈2,9cm (bờ trên 158,5 · bờ dưới 157,6).
   * Độ sâu da lấy bằng NỘI SUY tại đúng (y,z), không dán vào đỉnh lưới — ba huyệt trước tai chỉ cách
   * nhau 0,7cm nên dán đỉnh là chập làm một (đã đo SI19 ≡ GB2). */
  ST7:  { pos: { x: 0.0369, y: 0.9150, z: 0.0171 }, why: 'Hạ Quan — hõm bờ DƯỚI cung gò má, trước lồi cầu hàm dưới' },
  TE21: { pos: { x: 0.0390, y: 0.9239, z: -0.0016 }, why: 'Nhĩ Môn — trước khuyết trên bình tai, trên Thính Cung 0,5 thốn' },
  SI19: { pos: { x: 0.0382, y: 0.9197, z: -0.0016 }, why: 'Thính Cung — trước bình tai, ngang ống tai ngoài' },
  GB12: { pos: { x: 0.0335, y: 0.9035, z: -0.0170 }, why: 'Hoàn Cốt — hõm sau-dưới mỏm chũm' },
  GB4:  { pos: { x: 0.0387, y: 0.9633, z: 0.0098 }, why: 'Hàm Yếm — 1/4 đường nối Đầu Duy (ST8) với Khúc Tấn (GB7)' },
  GB5:  { pos: { x: 0.0402, y: 0.9614, z: 0.0050 }, why: 'Huyền Lư — giữa đường nối Đầu Duy (ST8) với Khúc Tấn (GB7)' },
  GB6:  { pos: { x: 0.0417, y: 0.9596, z: 0.0002 }, why: 'Huyền Ly — 3/4 đường nối Đầu Duy (ST8) với Khúc Tấn (GB7)' },
  GB7:  { pos: { x: 0.0432, y: 0.9578, z: -0.0046 }, why: 'Khúc Tấn — chân tóc thái dương, trước đỉnh tai' },
  GB13: { pos: { x: 0.0231, y: 0.9774, z: 0.0296 }, why: 'Bản Thần — trên chân tóc trước 0,5 thốn, cách đường giữa 3 thốn' },
  GB14: { pos: { x: 0.0165, y: 0.9648, z: 0.0402 }, why: 'Dương Bạch — trên lông mày 1 thốn, đường dọc đồng tử' },
  GB15: { pos: { x: 0.0178, y: 0.9829, z: 0.0284 }, why: 'Đầu Lâm Khấp — trên chân tóc trước 0,5 thốn, đường dọc đồng tử' },
  GB16: { pos: { x: 0.0178, y: 0.9861, z: 0.0244 }, why: 'Mục Song — trên chân tóc trước 1,5 thốn, đường dọc đồng tử' },
  GB17: { pos: { x: 0.0178, y: 0.9915, z: 0.0102 }, why: 'Chính Doanh — trên chân tóc trước 2,5 thốn, đường dọc đồng tử' },
  GB18: { pos: { x: 0.0189, y: 0.9952, z: -0.0036 }, why: 'Thừa Linh — trên chân tóc trước 4 thốn, đường dọc đồng tử' },
  GB19: { pos: { x: 0.0149, y: 0.9424, z: -0.0713 }, why: 'Não Không — ngang Não Hộ (GV17), đường dọc đồng tử' },
  ST1:  { pos: { x: 0.0184, y: 0.9400, z: 0.0433 }, why: 'Thừa Khấp — bờ dưới ổ mắt, trục dọc đồng tử' },
  TE23: { pos: { x: 0.0308, y: 0.9499, z: 0.0347 }, why: 'Ty Trúc Không — hõm đầu NGOÀI lông mày' },

  /* ===== VÒNG 27 — HỘI ĐỒNG VÒNG 2: ĐO TRÊN ẢNH SÁCH (08/09/2026) ==================================
   * Vòng 1 có giao việc "đọc ảnh atlas" nhưng sản phẩm chỉ là câu chữ, nên rốt cuộc mọi phán quyết
   * vẫn dựa vào cốt độ và mốc xương. Người dùng chỉ ra chỗ ấy. Vòng 2 dựng hai công cụ mới —
   * do-anh-atlas.cjs (tách chấm huyệt trên ảnh sách thành toạ độ pixel) và doi-chieu-ti-le.cjs (chiếu
   * huyệt lên đoạn nối hai mốc, so t trên ảnh với t trên mesh) — rồi cho 17 agent đo lại cả 23 huyệt.
   * Phán quyết: hoi-dong/TE-vong2-phan-quyet.json.
   *
   * Vì sao phép tỉ lệ đáng tin hơn: nó KHÔNG cần thang thốn, không cần biết đoạn dài mấy centimet.
   * Nhờ vậy nó gỡ được thế treo của TE11/12/13 mà vòng 1 phải bỏ dở vì ba cách đo thang cánh tay cho
   * 2,57 / 3,27 / 3,49 cm/thốn.
   *
   * TE12 và TE13 — SỬA, và phải sửa CÙNG LÚC. Hai huyệt đang CHẬP: cách nhau 0,33cm trên một đoạn
   * 25,85cm, lại ĐẢO THỨ TỰ (TE12 cao hơn TE13 0,32cm trong khi sách xếp TE13 ở trên). Ba cặp mốc
   * độc lập trên ảnh cùng chỉ một hướng: TE12 lệch +5,79 / +5,62 / +6,51cm, TE13 lệch −3,35 / −2,47 /
   * −2,05cm. Suy từ thang thốn của sách cho t = 0,426 (TE12) và 0,745 (TE13), lệch 0,44cm và 0,13cm
   * so với số đo trên ảnh — hai đường độc lập gặp nhau.
   * Dựng bằng TỈ LỆ trên dây cung TE10→TE14 (t = 0,409 và 0,750), GIỮ NGUYÊN vector lệch ngang: ảnh
   * là hình chiếu nên chỉ đo được chiều dọc, còn độ lệch ngang chính là thứ đặt huyệt vào khe giữa
   * hai đầu cơ tam đầu, không có bằng chứng nào nói nó sai.
   * SAI SỐ TỒN DƯ ĐÃ BIẾT: TE10 vẫn chưa chốt (thẩm tra nghi nó cao 0,9–1,9cm). Hạ TE10 1cm thì TE12
   * dời 0,58cm và TE13 dời 0,25cm — nhỏ hơn nhiều so với 5,79 và 3,35cm đang sửa, nên sửa trước là
   * đúng, nhưng phải soát lại hai huyệt này sau khi TE10 được chốt.
   * TE11 KHÔNG SỬA: nó nhạy nhất với TE10 (hạ TE10 1cm thì TE11 dời 0,91cm, gần bằng chính sai số
   * đang muốn sửa), và thẩm tra đã bác phép nghiệm thu mà chủ toạ đề nghị cho nó.
   * NGHIỆM THU: TE12↔TE13 nở từ 0,33cm lên 8,80cm; thứ tự cao độ TE11 120,8 < TE12 124,9 < TE13 133,7.
   *
   * LI5 Dương Khê — KHÔNG thuộc kinh TE, nhưng lộ ra từ chính phiên này và là lỗi nặng hơn mọi lỗi
   * của kinh TE. Khi chất vấn "TE4 lệch 1,38cm", hội đồng khớp affine 8 mốc rồi jackknife: bỏ LI5 ra
   * thì sai số nền tụt 1,38 → 0,88cm, bỏ bất kỳ mốc nào khác đều không cải thiện. Đo lại trực tiếp:
   * LI5 thấp hơn SI5 2,78cm dù cả LI5, SI5 và TE4 đều phải nằm trên lằn cổ tay; LI4→LI5 chỉ 2,73cm
   * trong khi ảnh đòi ~5,5cm. Dựng lại vào HÕM LÀO GIẢI PHẪU: trung điểm mỏm trâm quay (điểm thấp
   * nhất của xương quay về phía quay: 27,91/89,12/1,59cm) và tâm xương thuyền (26,09/88,19/1,77cm),
   * rồi đẩy ra da phía quay-lưng.
   * NGHIỆM THU: cao độ 88,65cm — ngang SI5 88,34 · TE4 88,08 · mốc WRIST 88,41; LI4→LI5 ra 5,84cm;
   * thứ tự ngang tại lằn cổ tay LI5 29,32 › TE4 24,58 › SI5 22,91, đúng chiều quay→trụ.
   * Mục này THAY mục LI5 cũ (dựng bằng phép dò gân duỗi ngón cái, cho y = 85,55cm). Phép dò gân
   * ấy hỏng ở chỗ nào thì chưa rõ, nhưng nó đặt huyệt thấp hơn lằn cổ tay 2,9cm và làm LI4→LI5
   * co lại còn 2,73cm — bằng nửa số ảnh sách đòi. Dùng mốc XƯƠNG thì cả ba phép nghiệm thu đạt. */
  TE12: { pos: { x: 0.1281, y: 0.7264, z: -0.0487 }, why: 'Tiêu Lạc — t=0,409 trên dây cung TE10→TE14 theo ba cặp mốc đo trên ảnh sách; giữ nguyên lệch ngang. Gỡ chập với TE13' },
  TE13: { pos: { x: 0.1256, y: 0.7775, z: -0.0466 }, why: 'Nhu Hội — t=0,750 trên dây cung TE10→TE14 (ảnh), khớp thang thốn sách 8/11 lệch 0,13cm' },
  LI5:  { pos: { x: 0.1706, y: 0.5157, z: 0.0127 }, why: 'Dương Khê — hõm lào giải phẫu, giữa mỏm trâm quay và xương thuyền, ngang lằn cổ tay. Điểm cũ thấp hơn SI5 2,78cm' },
  /* LI6–LI10 — HỆ QUẢ BẮT BUỘC của việc dời LI5, và lại đúng cái lỗi khung đã sửa cho kinh TE.
   * Đoạn LI/cang-tay của đường kinh chỉ neo hai đầu LI5→LI11, nên khi LI5 dời 3,2cm thì đường trắc
   * địa cắt góc sang mặt TRƯỚC và kéo cả năm huyệt theo: LI6 rơi CHẬP vào PC5 (cách 0,05cm), LI7 trôi
   * 5,73cm, LI8 trôi 3,45cm. Sách nói rõ cả năm nằm TRÊN ĐƯỜNG NỐI LI5–LI11 theo số thốn của thang
   * cẳng tay 12 thốn, nên dựng thẳng như thế rồi chỉ nâng lên mặt da bằng đỉnh GẦN NHẤT.
   * Không đẩy theo hướng "quay-lưng": làm thế thì LI10 văng ra z = −3,0cm trong khi LI11 ngay trên nó
   * ở z = +0,1cm, tức tự bẻ cong đoạn mà sách bảo là thẳng.
   * NGHIỆM THU: chiếu lên trục WRIST→CUBITAL ra đúng 3 / 5 / 8 / 9 / 10 thốn; LI6↔PC5 nở từ 0,05cm
   * lên 4,14cm; u (0 = giữa khe quay–trụ, 1 = tâm xương quay) ra 2,56–3,25 — nhất quán với chính giá
   * trị đo được trước khi đụng vào LI5 (LI7 2,27 · LI9 2,97 · LI10 3,08), tức dải bờ quay không đổi. */
  LI6:  { pos: { x: 0.1604, y: 0.5492, z: 0.0046 }, why: 'Thiên Lịch — 3 thốn trên lằn cổ tay, trên đường nối LI5–LI11' },
  LI7:  { pos: { x: 0.1560, y: 0.5732, z: 0.0068 }, why: 'Ôn Lưu — 5 thốn trên lằn cổ tay, trên đường nối LI5–LI11' },
  LI8:  { pos: { x: 0.1527, y: 0.6082, z: 0.0029 }, why: 'Hạ Liêm — 8 thốn trên lằn cổ tay (dưới LI11 4 thốn)' },
  LI9:  { pos: { x: 0.1504, y: 0.6200, z: 0.0035 }, why: 'Thượng Liêm — 9 thốn trên lằn cổ tay (dưới LI11 3 thốn)' },
  LI10: { pos: { x: 0.1466, y: 0.6314, z: 0.0031 }, why: 'Thủ Tam Lý — 10 thốn trên lằn cổ tay (dưới LI11 2 thốn)' },


  /* ===== VÒNG 10 — CẲNG CHÂN MẶT TRONG (rà soát toàn diện bắt được) ================================
   * Kinh Can và kinh Tỳ đang chạy ĐÈ LÊN NHAU ở cẳng chân: đo được LR5 cách SP7 đúng 0,28cm, trong khi
   * sách tách bạch rõ — Can bám MẶT TRONG xương chày (mặt xương dưới da), Tỳ bám BỜ SAU xương chày.
   * Cả hai đường trước đây chỉ là trắc địa nối hai đầu đoạn nên tự hội tụ vào cùng một sườn bắp chân,
   * đẩy LR5/LR6 ra sau xương chày 4,5cm. Nay neo theo mặt cắt xương chày ở đúng cao độ thốn.
   * Lưới xương THƯA (~11 điểm mỗi lát) nên dùng phân vị z thay cho min/max. */
  LR5:  { pos: { x: 0.0290, y: 0.1297, z: -0.0073 }, why: 'Lãi Câu — mặt trong xương chày, trên mắt cá trong 5 thốn' },
  LR6:  { pos: { x: 0.0206, y: 0.1671, z: -0.0093 }, why: 'Trung Đô — mặt trong xương chày, trên mắt cá trong 7 thốn' },
  /* SP7 SỬA: lần đầu nội suy trên trục SP5→SP9, nhưng bảng cốt độ khai xaMoc/ganMoc nên phép
   * kiểm đo trên trục MỐC XƯƠNG (mắt cá trong → lồi cầu trong xương chày) — ra 5,1 thốn thay vì 6.
   * Thang thốn phải lấy theo mốc xương, không theo hai huyệt đầu đoạn. */
  SP7:  { pos: { x: 0.0215, y: 0.1516, z: -0.0149 }, why: 'Lậu Cốc — sau bờ trong xương chày, trên mắt cá trong 6 thốn' },

  /* ===== VÒNG 11 — bốn huyệt CHỒNG KHÍT do rà soát toàn diện bắt được ==============================
   * ST17/ST18/LR14 cùng rơi vào đầu vú (cách nhau 0,00cm) và GV27/GV28 cùng một chỗ. Ba huyệt ngực
   * chỉ khác nhau ở KHE SƯỜN nên phải neo theo xương sườn, không neo theo đầu vú. */
  ST18: { pos: { x: 0.0444, y: 0.7231, z: 0.0684 }, why: 'Nhũ Căn — khe gian sườn 5, cách đường giữa 4 thốn' },
  LR14: { pos: { x: 0.0438, y: 0.7026, z: 0.0680 }, why: 'Kỳ Môn — khe gian sườn 6, đường dọc qua đầu vú' },
  GV1:  { pos: { x: 0.0000, y: 0.4933, z: -0.0647 }, why: 'Trường Cường — giữa đầu xương cụt và hậu môn' },
  GV28: { pos: { x: 0.0000, y: 0.9026, z: 0.0468 }, why: 'Ngân Giao — hãm môi trên, NẰM TRONG MIỆNG (không có mặt da; suy lùi vào trong từ Đoài Đoan GV27)' },

  /* ===== VÒNG 12 — ba huyệt LÌA DA (rà soát toàn diện bắt được, cách da 1,6–2,0cm) =================
   * CV24 từng suy từ "điểm nhô nhất hàm dưới trên đường giữa" — mốc đó là bờ ổ RĂNG, không phải mỏm
   * cằm, nên đẩy huyệt lên ngang môi trên. Rãnh cằm–môi là chỗ LÕM THẬT trên da nên dò thẳng bằng cực
   * tiểu địa phương của biên dạng da đường giữa. HT1 Cực Tuyền vẫn để nguyên: hố nách là nếp gấp sâu,
   * đỉnh da gần nhất đã cách 1,9cm — đó là giới hạn của mesh chứ không phải lỗi quy tắc. */
  CV24: { pos: { x: 0.0000, y: 0.8819, z: 0.0481 }, why: 'Thừa Tương — chỗ lõm rãnh cằm–môi, chính giữa' },
  HT8:  { pos: { x: 0.1374, y: 0.4785, z: 0.0140 }, why: 'Thiếu Phủ — gan bàn tay, giữa xương đốt bàn 4 và 5' },
  LR13: { pos: { x: 0.0764, y: 0.6289, z: -0.0076 }, why: 'Chương Môn — đầu tự do xương sườn 11' },

  /* ===== VÒNG 13 — BỐN CỘT DỌC THÂN (đối chiếu sơ đồ atlas trang 469) ==============================
   * Atlas vẽ ngực–bụng thành bốn cột THẲNG ĐỨNG song song, từ đường giữa ra: Nhâm (0) · Thận · Vị · Tỳ.
   * Quy ước thốn đổi giữa ngực và bụng: Thận 2 thốn ở ngực nhưng 0,5 ở bụng; Vị 4 ở ngực, 2 ở bụng;
   * Tỳ 6 ở ngực, 4 ở bụng. Đo lại thì 15 huyệt rơi khỏi cột của mình — nặng nhất Thuỷ Đạo ST28 nằm
   * ở x=0,5cm tức gần như trên đường giữa, và Phủ Xá SP13 văng ra x=14,0cm tận hông.
   * Cao độ giữ nguyên (suy từ đốt sống / xương sườn / rốn, đã kiểm riêng), chỉ đặt lại khoảng ngang.
   * Hai cột lưng (BL 1,5 và 3 thốn) đo lại đều ĐẠT, không phải sửa. */
  KI23: { pos: { x: 0.0222, y: 0.7458, z: 0.0726 }, why: 'Thần Phong — khe gian sườn 4, cách đường giữa 2 thốn' },
  KI24: { pos: { x: 0.0222, y: 0.7648, z: 0.0701 }, why: 'Linh Khư — khe gian sườn 3, cách đường giữa 2 thốn' },
  KI25: { pos: { x: 0.0222, y: 0.7821, z: 0.0601 }, why: 'Thần Tàng — khe gian sườn 2, cách đường giữa 2 thốn' },
  KI26: { pos: { x: 0.0222, y: 0.8033, z: 0.0405 }, why: 'Úc Trung — khe gian sườn 1, cách đường giữa 2 thốn' },
  SP18: { pos: { x: 0.0666, y: 0.7505, z: 0.0638 }, why: 'Thiên Khê — khe gian sườn 4, cách đường giữa 6 thốn' },
  SP19: { pos: { x: 0.0666, y: 0.7745, z: 0.0510 }, why: 'Hung Hương — khe gian sườn 3, cách đường giữa 6 thốn' },
  SP20: { pos: { x: 0.0666, y: 0.7984, z: 0.0398 }, why: 'Chu Vinh — khe gian sườn 2, cách đường giữa 6 thốn' },

  /* ===== VÒNG 14 — TOÀN BỘ VÙNG BỤNG dựng thẳng từ CỐT ĐỘ (sơ đồ atlas trang 469) ==================
   * Atlas vẽ bụng thành bốn cột THẲNG ĐỨNG song song. Muốn đạt thế thì CẢ cao độ LẪN khoảng ngang
   * đều phải suy từ thang thốn; để khâu rải nội suy dọc đường thì huyệt trôi, có khi chập hẳn
   * (đo được SP15 ≡ SP16 cách nhau 0,02cm sau khi đường bụng đổi).
   * Thang cao độ: trên rốn dùng rốn→mũi ức = 8 thốn; dưới rốn dùng rốn→bờ trên xương mu = 5 thốn.
   * Khoảng ngang: Nhâm 0 · Thận 0,5 · Vị 2 · Tỳ 4 thốn (quy ước VÙNG BỤNG — ở ngực là 2/4/6).
   * Tự kiểm: cặp gần nhau nhất trong nhóm là CV12–KI19 cách 0,96cm, đúng bằng 0,5 thốn sách quy. */
  CV2:  { pos: { x: 0.0000, y: 0.5089, z: 0.0462 }, why: 'Khúc Cốt — 5 thốn dưới rốn, đường giữa' },
  CV3:  { pos: { x: 0.0000, y: 0.5298, z: 0.0523 }, why: 'Trung Cực — 4 thốn dưới rốn, đường giữa' },
  CV4:  { pos: { x: 0.0000, y: 0.5508, z: 0.0561 }, why: 'Quan Nguyên — 3 thốn dưới rốn, đường giữa' },
  CV5:  { pos: { x: 0.0000, y: 0.5717, z: 0.0583 }, why: 'Thạch Môn — 2 thốn dưới rốn, đường giữa' },
  CV6:  { pos: { x: 0.0000, y: 0.5822, z: 0.0606 }, why: 'Khí Hải — 1.5 thốn dưới rốn, đường giữa' },
  CV7:  { pos: { x: 0.0000, y: 0.5927, z: 0.0588 }, why: 'Âm Giao — 1 thốn dưới rốn, đường giữa' },
  CV8:  { pos: { x: 0.0000, y: 0.6136, z: 0.0607 }, why: 'Thần Khuyết — ngang rốn, đường giữa' },
  CV9:  { pos: { x: 0.0000, y: 0.6283, z: 0.0631 }, why: 'Thuỷ Phân — 1 thốn trên rốn, đường giữa' },
  CV10: { pos: { x: 0.0000, y: 0.6431, z: 0.0650 }, why: 'Hạ Quản — 2 thốn trên rốn, đường giữa' },
  CV11: { pos: { x: 0.0000, y: 0.6578, z: 0.0676 }, why: 'Kiến Lý — 3 thốn trên rốn, đường giữa' },
  CV12: { pos: { x: 0.0000, y: 0.6725, z: 0.0681 }, why: 'Trung Quản — 4 thốn trên rốn, đường giữa' },
  CV13: { pos: { x: 0.0000, y: 0.6873, z: 0.0677 }, why: 'Thượng Quản — 5 thốn trên rốn, đường giữa' },
  CV14: { pos: { x: 0.0000, y: 0.7020, z: 0.0688 }, why: 'Cự Khuyết — 6 thốn trên rốn, đường giữa' },
  CV15: { pos: { x: 0.0000, y: 0.7168, z: 0.0679 }, why: 'Cưu Vĩ — 7 thốn trên rốn, đường giữa' },
  KI11: { pos: { x: 0.0056, y: 0.5089, z: 0.0426 }, why: 'Hoành Cốt — 5 thốn dưới rốn, cách đường giữa 0,5 thốn' },
  /* LẬT BÊN — bốn chốt này từng mang x ÂM trong khi cả 23 huyệt Thận còn lại mang x DƯƠNG, tức đoạn
   * KI12–KI15 nhảy sang nửa bụng BÊN KIA rồi lại nhảy về ở KI16. Đồ hình kinh Thận (kinh-08-chinh)
   * vẽ cả chuỗi bụng thành MỘT hàng dọc cách đường giữa 0,5 thốn, không có chỗ nào bắt chéo. Câu
   * VỊ TRÍ của cả bốn đều ghi "đo ngang ra 0,5 thốn" (dir=out) nên không phải sách bảo thế. Đây là
   * lỗi gõ dấu trừ; giữ chú thích để lần sau ai sửa toạ độ khỏi chép lại.                          */
  KI12: { pos: { x: 0.0056, y: 0.5298, z: 0.0515 }, why: 'Đại Hách — 4 thốn dưới rốn, cách đường giữa 0,5 thốn' },
  KI13: { pos: { x: 0.0056, y: 0.5508, z: 0.0565 }, why: 'Khí Huyệt — 3 thốn dưới rốn, cách đường giữa 0,5 thốn' },
  KI14: { pos: { x: 0.0056, y: 0.5717, z: 0.0592 }, why: 'Tứ Mãn — 2 thốn dưới rốn, cách đường giữa 0,5 thốn' },
  KI15: { pos: { x: 0.0056, y: 0.5927, z: 0.0597 }, why: 'Trung Chú — 1 thốn dưới rốn, cách đường giữa 0,5 thốn' },
  KI16: { pos: { x: 0.0056, y: 0.6136, z: 0.0618 }, why: 'Hoang Du — ngang rốn, cách đường giữa 0,5 thốn' },
  KI17: { pos: { x: 0.0056, y: 0.6431, z: 0.0653 }, why: 'Thương Khúc — 2 thốn trên rốn, cách đường giữa 0,5 thốn' },
  KI18: { pos: { x: 0.0056, y: 0.6578, z: 0.0675 }, why: 'Thạch Quan — 3 thốn trên rốn, cách đường giữa 0,5 thốn' },
  KI19: { pos: { x: 0.0056, y: 0.6725, z: 0.0686 }, why: 'Âm Đô — 4 thốn trên rốn, cách đường giữa 0,5 thốn' },
  KI20: { pos: { x: 0.0056, y: 0.6873, z: 0.0685 }, why: 'Phúc Thông Cốc — 5 thốn trên rốn, cách đường giữa 0,5 thốn' },
  KI21: { pos: { x: 0.0056, y: 0.7020, z: 0.0690 }, why: 'U Môn — 6 thốn trên rốn, cách đường giữa 0,5 thốn' },
  ST19: { pos: { x: 0.0222, y: 0.7020, z: 0.0705 }, why: 'Bất Dung — 6 thốn trên rốn, cách đường giữa 2 thốn' },
  ST20: { pos: { x: 0.0222, y: 0.6873, z: 0.0693 }, why: 'Thừa Mãn — 5 thốn trên rốn, cách đường giữa 2 thốn' },
  ST21: { pos: { x: 0.0222, y: 0.6725, z: 0.0689 }, why: 'Lương Môn — 4 thốn trên rốn, cách đường giữa 2 thốn' },
  ST22: { pos: { x: 0.0222, y: 0.6578, z: 0.0690 }, why: 'Quan Môn — 3 thốn trên rốn, cách đường giữa 2 thốn' },
  ST23: { pos: { x: 0.0222, y: 0.6431, z: 0.0659 }, why: 'Thái Ất — 2 thốn trên rốn, cách đường giữa 2 thốn' },
  ST24: { pos: { x: 0.0222, y: 0.6283, z: 0.0645 }, why: 'Hoạt Nhục Môn — 1 thốn trên rốn, cách đường giữa 2 thốn' },
  ST25: { pos: { x: 0.0222, y: 0.6136, z: 0.0624 }, why: 'Thiên Khu — ngang rốn, cách đường giữa 2 thốn' },
  ST26: { pos: { x: 0.0222, y: 0.5927, z: 0.0614 }, why: 'Ngoại Lăng — 1 thốn dưới rốn, cách đường giữa 2 thốn' },
  ST27: { pos: { x: 0.0222, y: 0.5717, z: 0.0575 }, why: 'Đại Cự — 2 thốn dưới rốn, cách đường giữa 2 thốn' },
  ST28: { pos: { x: 0.0222, y: 0.5508, z: 0.0509 }, why: 'Thuỷ Đạo — 3 thốn dưới rốn, cách đường giữa 2 thốn' },
  ST29: { pos: { x: 0.0222, y: 0.5298, z: 0.0470 }, why: 'Quy Lai — 4 thốn dưới rốn, cách đường giữa 2 thốn' },
  ST30: { pos: { x: 0.0222, y: 0.5089, z: 0.0416 }, why: 'Khí Xung — 5 thốn dưới rốn, cách đường giữa 2 thốn' },
  SP13: { pos: { x: 0.0444, y: 0.5236, z: 0.0415 }, why: 'Phủ Xá — 4.3 thốn dưới rốn, cách đường giữa 4 thốn' },
  SP14: { pos: { x: 0.0444, y: 0.5864, z: 0.0505 }, why: 'Phúc Kết — 1.3 thốn dưới rốn, cách đường giữa 4 thốn' },
  SP15: { pos: { x: 0.0444, y: 0.6136, z: 0.0521 }, why: 'Đại Hoành — ngang rốn, cách đường giữa 4 thốn' },
  SP16: { pos: { x: 0.0444, y: 0.6578, z: 0.0605 }, why: 'Phúc Ai — 3 thốn trên rốn, cách đường giữa 4 thốn' },

  /* ===== VÒNG 16 — BA CỘT NGỰC + Nhâm Mạch ngực (sơ đồ atlas trang 469) ============================
   * Quy ước thốn NGỰC khác BỤNG: Thận 2 (bụng 0,5) · Vị 4 (bụng 2) · Tỳ 6 (bụng 4). Cao độ giữ nguyên
   * vì đã neo theo khe gian sườn; chỉ đặt lại khoảng ngang. Sau khi đặt, cả bốn cột đều đúng một trị
   * số duy nhất, và đường kinh dựng trên chúng có dao động ngang 0,0cm — đúng như atlas vẽ. */
  KI22: { pos: { x: 0.0222, y: 0.7231, z: 0.0693 }, why: 'Bộ Lang — khe gian sườn 5, cách đường giữa 2 thốn' },
  KI27: { pos: { x: 0.0222, y: 0.8063, z: 0.0405 }, why: 'cột Thận ngực — cách đường giữa 2 thốn' },
  ST13: { pos: { x: 0.0444, y: 0.8136, z: 0.0335 }, why: 'cột Vị ngực — cách đường giữa 4 thốn (đường giữa đòn)' },
  ST14: { pos: { x: 0.0444, y: 0.8033, z: 0.0349 }, why: 'Khố Phòng — khe gian sườn 1, cách đường giữa 4 thốn' },
  ST15: { pos: { x: 0.0444, y: 0.7827, z: 0.0588 }, why: 'Ốc Ế — khe gian sườn 2, cách đường giữa 4 thốn' },
  ST16: { pos: { x: 0.0444, y: 0.7648, z: 0.0644 }, why: 'Ưng Song — khe gian sườn 3, cách đường giữa 4 thốn' },
  ST17: { pos: { x: 0.0444, y: 0.7458, z: 0.0741 }, why: 'Nhũ Trung — khe gian sườn 4, cách đường giữa 4 thốn' },
  SP17: { pos: { x: 0.0666, y: 0.7250, z: 0.0644 }, why: 'Thực Đậu — khe gian sườn 5, cách đường giữa 6 thốn' },

  /* ===== VÒNG 17 — SI14/SI15 vai-gáy (sơ đồ atlas trang 470) =======================================
   * Kiên Trung Du SI15 đo được nằm ở x=0,0 — tức ĐÈ LÊN Mạch Đốc, mà sách ghi rõ nó cách mỏm gai C7
   * 2 thốn. Kiên Ngoại Du SI14 cách mỏm gai T1 3 thốn. Neo thẳng theo hai mỏm gai ấy. */
  SI15: { pos: { x: 0.0224, y: 0.8413, z: -0.0677 }, why: 'Kiên Trung Du — cách mỏm gai C7 2 thốn' },
  SI14: { pos: { x: 0.0336, y: 0.8313, z: -0.0671 }, why: 'Kiên Ngoại Du — cách mỏm gai T1 3 thốn' },

  /* ===== VÒNG 19 — chuyển huyệt "TẠM" thành MỐC dựng từ xương ======================================
   * Chín huyệt còn ở mức tin cậy thấp nhất, nhưng câu vị trí của sách lại nêu mốc xương RẤT RÕ —
   * chỉ là chưa ai dựng. Ba mốc phải dò lại vì cách dò đầu tiên sai:
   *  · gai chậu TRƯỚC TRÊN: phải là điểm TRƯỚC nhất của NỬA TRÊN cánh chậu (12,6 · 97,3 · 3,9);
   *    công thức trộn z với y lần đầu bốc phải mặt trong xương cùng, ra x=2,0cm;
   *  · đầu tự do sườn 12: lấy điểm NGOÀI nhất, không phải TRƯỚC nhất (sườn 12 ngắn, "trước nhất" là
   *    đầu SAU khớp với đốt sống, ra x=2,1cm);
   *  · đường NÁCH GIỮA: phải chặn theo bề ngang lồng ngực ở chính cao độ ấy — cánh tay buông sát bên
   *    nên "điểm da ngoài nhất" rơi vào CÁNH TAY (đo được x=24cm, lồng ngực chỉ rộng tới 13,6cm). */
  GB24: { pos: { x: 0.0443, y: 0.6842, z: 0.0673 }, why: 'Nhật Nguyệt — khe gian sườn 7, đường dọc qua đầu vú' },
  SP21: { pos: { x: 0.1062, y: 0.7013, z: 0.0030 }, why: 'Đại Bao — đường nách giữa, khe gian sườn 6' },
  GB22: { pos: { x: 0.0966, y: 0.7427, z: 0.0055 }, why: 'Uyên Dịch — đường nách giữa, khe gian sườn 4' },
  GB23: { pos: { x: 0.0926, y: 0.7231, z: 0.0091 }, why: 'Triếp Cân — trước Uyên Dịch 1 thốn, khe gian sườn 5' },
  GB26: { pos: { x: 0.0821, y: 0.6086, z: 0.0048 }, why: 'Đái Mạch — giữa đầu tự do sườn 11 và 12, ngang rốn' },
  GB27: { pos: { x: 0.0734, y: 0.5508, z: 0.0387 }, why: 'Ngũ Xu — trước gai chậu trước trên, ngang Quan Nguyên CV4' },
  GB28: { pos: { x: 0.0734, y: 0.5452, z: 0.0387 }, why: 'Duy Đạo — dưới Ngũ Xu 0,5 thốn' },
  TE15: { pos: { x: 0.0762, y: 0.8386, z: -0.0212 }, why: 'Thiên Liêu — trung điểm Đại Chuỳ GV14 và mỏm cùng vai' },
  SP10: { pos: { x: 0.0354, y: 0.2997, z: 0.0263 }, why: 'Huyết Hải — trên bờ TRONG-TRÊN xương bánh chè 2 thốn' },

  /* ===== VÒNG 20 — nhóm "tạm" đợt 2: huyệt sách định nghĩa THEO HUYỆT KHÁC ==========================
   * Loại này rẻ nhất mà chắc nhất: sách nói thẳng "trung điểm của A và B" hoặc "cách A N thốn về
   * hướng H". Dựng đúng câu ấy thì đúng theo định nghĩa, không cần suy đoán.
   * Ba chỗ phải dò lại mốc: góc hàm dưới (thêm ràng buộc z<0 mới bắt đúng ngành sau, chứ "x lớn trừ y"
   * bốc phải bờ dưới thân hàm ở phía trước, ra z=+4,1 tức dưới cằm) — và cả TE17 lẫn cụm quanh tai
   * đều phải NỘI SUY độ sâu da bên vì mô hình không có vành tai (xem VÒNG 9b). */
  GB11: { pos: { x: 0.0361, y: 0.9145, z: -0.0120 }, why: 'Khiếu Âm — trung điểm Phù Bạch GB10 và Hoàn Cốt GB12' },
  BL56: { pos: { x: 0.0318, y: 0.1875, z: -0.0603 }, why: 'Thừa Cân — trung điểm Hợp Dương BL55 và Thừa Sơn BL57' },
  LR7:  { pos: { x: 0.0169, y: 0.2471, z: -0.0268 }, why: 'Tất Quan — ngang Âm Lăng Tuyền SP9, lùi ra SAU 1 thốn' },
  KI5:  { pos: { x: 0.0202, y: 0.0391, z: -0.0223 }, why: 'Thuỷ Tuyền — thẳng dưới Thái Khê KI3 1 thốn' },
  PC2:  { pos: { x: 0.1053, y: 0.8005, z: 0.0111 }, why: 'Thiên Tuyền — dưới đầu nếp nách trước 2 thốn' },
  LI13: { pos: { x: 0.1287, y: 0.7031, z: 0.0043 }, why: 'Thủ Ngũ Lý — trên Khúc Trì LI11 3 thốn, đường LI11→LI15' },
  LI14: { pos: { x: 0.1121, y: 0.7715, z: 0.0141 }, why: 'Tý Nhu — chỗ bám cơ delta, trên Khúc Trì LI11 7 thốn' },
  SP12: { pos: { x: 0.0397, y: 0.5099, z: 0.0391 }, why: 'Xung Môn — ngang bờ trên xương mu, cách đường giữa 3,5 thốn' },
  ST4:  { pos: { x: 0.0218, y: 0.8938, z: 0.0400 }, why: 'Địa Thương — ngoài khoé miệng 0,4 thốn' },
  TE17: { pos: { x: 0.0346, y: 0.9098, z: -0.0063 }, why: 'Ế Phong — hõm giữa góc hàm dưới và mỏm chũm' },

  /* KI6 Chiếu Hải: SỬA — đo được nó ở x=8,4cm, lệch ra NGOÀI 4,7cm so với Thái Khê KI3, tức đã rời
   * bờ trong cổ chân. Neo lại theo đỉnh mắt cá TRONG (đầu dưới xương chày), hạ 1 thốn. */
  KI6:  { pos: { x: 0.0254, y: 0.0255, z: -0.0112 }, why: 'Chiếu Hải — hõm dưới đỉnh mắt cá trong 1 thốn' },

  /* ===== VÒNG 21 — nhóm CỔ và vài huyệt lẻ (đợt 3) =================================================
   * Atlas không có cơ ức–đòn–chũm, nhưng CÓ SỤN GIÁP — đúng mốc mà sách dùng: Phù Đột LI18 ngang bờ
   * trên sụn giáp, Thiên Song SI16 lùi sau nó 0,5 thốn, Thiên Dũ TE16 ngang góc hàm dưới.
   * Góc hàm dưới phải dò bằng "dải NGOÀI nhất rồi lấy điểm THẤP nhất" — hai công thức trước đều hỏng:
   * lọc z<0 chỉ còn ngành hàm đi lên (ra y=157,5, cao hơn cả ống tai), trộn x với z thì bốc phải bờ
   * dưới cằm ở phía trước (z=+3,9). */
  LI18: { pos: { x: 0.0272, y: 0.8776, z: 0.0031 }, why: 'Phù Đột — ngang bờ trên sụn giáp, cách đường giữa 3 thốn' },
  SI16: { pos: { x: 0.0297, y: 0.8776, z: -0.0025 }, why: 'Thiên Song — sau Phù Đột LI18 0,5 thốn' },
  ST11: { pos: { x: 0.0167, y: 0.8257, z: 0.0307 }, why: 'Khí Xá — sát bờ trên xương đòn, cách đường giữa 1,5 thốn' },
  TE16: { pos: { x: 0.0322, y: 0.8844, z: -0.0103 }, why: 'Thiên Dũ — ngang góc hàm dưới, bờ sau cơ ức–đòn–chũm' },
  SI10: { pos: { x: 0.1188, y: 0.8061, z: -0.0469 }, why: 'Nhu Du — dưới mỏm cùng vai, trên nếp nách sau' },
  BL39: { pos: { x: 0.0613, y: 0.2579, z: -0.0477 }, why: 'Uỷ Dương — ngoài Uỷ Trung BL40 đúng 1 thốn, trên nếp kheo' },
  GB10: { pos: { x: 0.0374, y: 0.9231, z: -0.0137 }, why: 'Phù Bạch — giữa Thiên Xung GB9 và Hoàn Cốt GB12, trên chân vành tai' },

  /* ===== VÒNG 22 — bốn huyệt lộ ra SAU khi cắm nhóm cổ =============================================
   * Cắm Phù Đột LI18 và Khí Xá ST11 xong thì lộ ngay: Nhân Nghênh ST9 đang ở y=142,5 tức tận ĐÁY CỔ,
   * trong khi sách đặt nó NGANG củ hầu (bờ trên sụn giáp, y=150,9) — lệch 8,7cm, kéo Thuỷ Đột ST10
   * lệch theo. Hoà Liêu LI19 thì chui vào trong mặt 2,4cm. Đây là giá trị của việc dựng theo cụm:
   * huyệt đúng làm huyệt sai bên cạnh nó lộ ra. */
  ST9:  { pos: { x: 0.0167, y: 0.8776, z: 0.0387 }, why: 'Nhân Nghênh — ngang bờ trên sụn giáp, cách đường giữa 1,5 thốn' },
  ST10: { pos: { x: 0.0167, y: 0.8517, z: 0.0144 }, why: 'Thuỷ Đột — trung điểm Nhân Nghênh ST9 và Khí Xá ST11' },
  LI19: { pos: { x: 0.0041, y: 0.9036, z: 0.0584 }, why: 'Hoà Liêu — ngang Nhân Trung GV26, cách đường giữa 0,5 thốn' },

  /* ===== VÒNG 23 — BÀN CHÂN dựng từ XƯƠNG ĐỐT BÀN (sơ đồ atlas tr.462) =============================
   * Sách tả mọi huyệt vùng này theo xương đốt bàn: "khe giữa xương bàn 4 và 5", "đầu sau xương bàn 5",
   * "chỗ nối thân và chỏm xương bàn 2". Atlas có đủ 5 xương đốt bàn + xương gót — chỉ THIẾU xương đốt
   * NGÓN, nên huyệt kẽ ngón suy ra trước chỏm xương bàn (tỉ lệ 1,03–1,05 dọc trục xương) rồi dán da.
   * Tự kiểm: ở mức kẽ ngón, thứ tự ngang ra được BL 17,1 › GB 14,1 › ST 12,2 › LR 10,4 › SP 7,3 —
   * đúng thứ tự năm đường mà atlas vẽ trên mu bàn chân. */
  ST42: { pos: { x: 0.0602, y: 0.0488, z: 0.0155 }, why: 'Xung Dương — chỗ cao nhất mu chân, giữa gốc xương bàn 2 và 3' },
  ST43: { pos: { x: 0.0694, y: 0.0299, z: 0.0415 }, why: 'Hãm Cốc — khe xương bàn 2–3, chỗ nối thân và chỏm' },
  ST44: { pos: { x: 0.0711, y: 0.0236, z: 0.0508 }, why: 'Nội Đình — kẽ ngón chân 2–3, phía mu chân' },
  GB42: { pos: { x: 0.0807, y: 0.0277, z: 0.0288 }, why: 'Địa Ngũ Hội — khe xương bàn 4–5, sau khớp bàn–ngón' },
  GB41: { pos: { x: 0.0664, y: 0.0464, z: 0.0109 }, why: 'Túc Lâm Khấp — ngay xa chỗ nối gốc xương bàn 4–5' },
  GB43: { pos: { x: 0.0818, y: 0.0235, z: 0.0381 }, why: 'Hiệp Khê — kẽ ngón chân 4–5, phía mu chân' },
  LR2:  { pos: { x: 0.0607, y: 0.0247, z: 0.0541 }, why: 'Hành Gian — kẽ ngón chân 1–2, phía mu chân' },
  LR3:  { pos: { x: 0.0541, y: 0.0463, z: 0.0245 }, why: 'Thái Xung — hõm giữa hai gốc xương bàn 1 và 2' },
  BL64: { pos: { x: 0.0854, y: 0.0147, z: -0.0039 }, why: 'Kinh Cốt — lồi củ gốc xương bàn chân 5, bờ ngoài' },
  BL65: { pos: { x: 0.0996, y: 0.0089, z: 0.0267 }, why: 'Thúc Cốt — sau chỏm xương bàn chân 5, ranh da đỏ–trắng' },
  BL66: { pos: { x: 0.0997, y: 0.0088, z: 0.0332 }, why: 'Thông Cốc — trước khớp bàn–ngón 5, bờ ngoài' },
  BL62: { pos: { x: 0.0684, y: 0.0244, z: -0.0260 }, why: 'Thân Mạch — dưới đỉnh mắt cá ngoài 0,5 thốn' },
  BL63: { pos: { x: 0.0744, y: 0.0192, z: -0.0195 }, why: 'Kim Môn — trước–dưới Thân Mạch 0,5 thốn' },
  BL61: { pos: { x: 0.0729, y: 0.0101, z: -0.0260 }, why: 'Bộc Tham — mặt ngoài xương gót, thẳng dưới Thân Mạch BL62' },
  SP4:  { pos: { x: 0.0312, y: 0.0256, z: 0.0229 }, why: 'Công Tôn — chỗ nối thân và gốc xương bàn chân 1, bờ trong' },
  SP3:  { pos: { x: 0.0381, y: 0.0108, z: 0.0471 }, why: 'Thái Bạch — sau–dưới chỏm xương bàn chân 1, ranh da đỏ–trắng' },
  SP2:  { pos: { x: 0.0424, y: 0.0131, z: 0.0544 }, why: 'Đại Đô — trước khớp bàn–ngón 1, bờ trong' },

  /* ===== VÒNG 24 — BÀN TAY dựng từ XƯƠNG ĐỐT BÀN (sơ đồ atlas tr.472/473) ==========================
   * Như bàn chân, nhưng KHÁC một điểm quan trọng: bàn tay buông xuôi nên trục dài của xương đốt bàn
   * là TRỤC Y (ngón chỉ xuống), không phải Z như bàn chân. Hướng suy từ chính dữ liệu đã kiểm
   * (LU9 > PC7 > HT7): phía QUAY = x lớn · phía TRỤ = x nhỏ · gan tay = z lớn · mu tay = z nhỏ.
   * Tự kiểm: thứ tự quay→trụ ra LU10 32,0 › LI 31,0 › PC8 27,5 › TE 24,0 › SI 21,5 — đúng thứ tự
   * năm đường mà atlas vẽ trên bàn tay. */
  LI4:  { pos: { x: 0.1803, y: 0.4833, z: 0.0153 }, why: 'Hợp Cốc — bờ quay, giữa xương bàn tay 2' },
  LI3:  { pos: { x: 0.1798, y: 0.4683, z: 0.0214 }, why: 'Tam Gian — sau khớp bàn–ngón 2, ranh da đỏ–trắng' },
  LI2:  { pos: { x: 0.1797, y: 0.4620, z: 0.0213 }, why: 'Nhị Gian — trước khớp bàn–ngón 2, ranh da đỏ–trắng' },
  SI4:  { pos: { x: 0.1248, y: 0.5014, z: 0.0151 }, why: 'Uyển Cốt — giữa xương móc và gốc xương bàn tay 5' },
  SI3:  { pos: { x: 0.1244, y: 0.4750, z: 0.0223 }, why: 'Hậu Khê — sau khớp bàn–ngón 5, ranh da đỏ–trắng' },
  SI2:  { pos: { x: 0.1253, y: 0.4699, z: 0.0224 }, why: 'Tiền Cốc — trước khớp bàn–ngón 5, ranh da đỏ–trắng' },
  TE3:  { pos: { x: 0.1406, y: 0.4752, z: 0.0119 }, why: 'Trung Chử — tâm rãnh gian cốt bàn 4–5 tại CỔ xương bàn 4 (chỗ thân loe thành chỏm), ép lên da mặt mu. Hội đồng 08/09: điểm cũ treo 0,5cm ngoài da; cao độ cổ xương đo lại TRÙNG cao độ cũ nên KHÔNG dời dọc — phần "lùi về phía đầu ngón" hội đồng đề nghị không được phép đo xác nhận' },
  TE2:  { pos: { x: 0.1391, y: 0.4679, z: 0.0122 }, why: 'Dịch Môn — kẽ ngón 4–5, mu tay' },
  LU10: { pos: { x: 0.1860, y: 0.4984, z: 0.0220 }, why: 'Ngư Tế — giữa xương bàn tay 1, ranh da đỏ–trắng' },
  PC8:  { pos: { x: 0.1601, y: 0.4698, z: 0.0339 }, why: 'Lao Cung — gan tay, khe xương bàn 2–3' },

  /* ===== VÒNG 25 — GB29/GB30 vùng mông (phép kiểm GÓC GẤP chỉ ra) ==================================
   * Đoạn mông là chỗ DUY NHẤT còn gấp GIỮA hai huyệt (64°, cách mọi huyệt 2,6cm) — dấu hiệu đường tự
   * đi lệch vì hai đầu chưa có mốc. Sách nêu mốc rất rõ: Cư Liêu ở trung điểm gai chậu trước trên và
   * đỉnh mấu chuyển lớn; Hoàn Khiêu ở chỗ nối 1/3 ngoài với 2/3 trong đoạn mấu chuyển lớn–khe xương cùng.
   * Lại vấp bẫy "cánh tay": ở tầm hông tay buông sát bên nên điểm da ngoài nhất rơi vào cánh tay
   * (GB29 ra x=28,1cm trong khi mấu chuyển chỉ 15,0) — phải chặn theo bề ngang xương. */
  GB29: { pos: { x: 0.0953, y: 0.5287, z: -0.0019 }, why: 'Cư Liêu — trung điểm gai chậu trước trên và đỉnh mấu chuyển lớn' },
  GB30: { pos: { x: 0.0939, y: 0.4948, z: -0.0139 }, why: 'Hoàn Khiêu — nối 1/3 ngoài và 2/3 trong đoạn mấu chuyển lớn–khe xương cùng' },

  /* ===== VÒNG 26 — KINH TAM TIÊU sau HỘI ĐỒNG PHẢN BIỆN (08/09/2026) ===============================
   * Nguồn: hoi-dong/TE-phan-quyet.json — 27 agent (thư lại tra WHO 2008 → 3 phản biện độc lập theo ba
   * giác quan → chủ toạ từng cụm → 2 thẩm tra đối kháng). Chỉ chép vào đây những phán quyết mà CẢ
   * hội đồng LẪN hai thẩm tra cùng đứng, và mà tôi đã đo lại được trên chính mesh.
   *
   * A. CẲNG TAY TE5–TE9 — LỖI KHUNG, KHÔNG PHẢI LỖI TỪNG HUYỆT.
   * Đoạn TE/cang-tay của đường kinh chỉ neo hai đầu TE4→TE10, nên đường trắc địa CẮT GÓC qua mặt trụ
   * (đo được đường chạy ở x = 19,2–21,2cm trong khi khe gian cốt ở x ≈ 23,4–24,6cm), rồi khâu rải kéo
   * cả năm huyệt theo. Hậu quả đo được: cả năm nằm NGOÀI rìa xương trụ, chiếm dải của kinh Tiểu Trường
   * (u = −1,5 đến −5,5, trong đó u = 0 là giữa khe, −1 là tâm xương trụ). TE9 lệch 3,43cm.
   * Nay dựng thẳng từ hình học: mức dọc theo thang WRIST→CUBITAL (2,008cm/thốn — thẩm tra đã bác đề
   * nghị đổi sang TE4→mỏm khuỷu 2,128, vì nó neo vào HUYỆT và lấy mỏm khuỷu thay nếp khuỷu), ngang
   * đặt đúng TÂM KHE gian cốt quay–trụ tại mức đó, rồi ép lên da mặt MU.
   * Vì chúng thành mốc tầng 1, bake-paths sẽ lấy chúng làm điểm neo và đường kinh hết cắt góc.
   * THỐN ĐO DỌC TRỤC, KỂ CẢ SAU KHI ÉP RA DA. Trục WRIST→CUBITAL nghiêng 4,97cm theo z trên 24,10cm,
   * nên đẩy huyệt ra mặt da mu (z tụt ~5cm) làm hình chiếu lên trục tăng 0,6 thốn nếu cứ giữ nguyên
   * cao độ — audit bắt đúng chỗ này (TE6 ra 3,6 thốn thay vì 3). Phải giải ngược lại cao độ cho hình
   * chiếu đúng mức, lặp vì z của da lại phụ thuộc cao độ.
   * NGHIỆM THU NGOÀI ENGINE — dùng phép NHẤT QUÁN LIÊN KINH, không dùng phép "cùng cao độ":
   * cả 11 huyệt cẳng tay của năm kinh kia (PC6=2,00 · PC5=3,00 · PC4=5,00 · LU7=1,50 · LU6=7,00 ·
   * HT5=1,00 · HT4=1,50 · SI6=1,00 · SI7=5,00 · LI6=3,00 · LI7=5,00 thốn) đều chiếu lên chính trục này
   * ĐÚNG số thốn sách. TE5–TE9 sau khi dựng cũng ra đúng 2/3/3/4/7. Lưu ý phép nghiệm thu mà thẩm tra
   * đề nghị — "TE5 phải CÙNG CAO ĐỘ với PC6 vì là cặp thấu châm" — KHÔNG dùng được khi trục nghiêng:
   * hai huyệt cùng 2 thốn nhưng nằm hai mặt đối nhau thì lệch cao độ đúng 4,8cm × 0,206 = 0,99cm, và
   * đo được 1,01cm. Cùng MỨC TRÊN TRỤC mới là điều kiện đúng, không phải cùng cao độ.
   *
   * B. TE7 Hội Tông không ở tâm khe: sách cho nó cùng mức 3 thốn với Chi Câu TE6 nhưng lệch về phía
   * TRỤ, sát BỜ QUAY của xương trụ — nên đặt ở u ≈ −0,75, không phải u = 0.
   *
   * C. TE11 Thanh Lãnh Uyên: hội đồng đồng thuận SỬA (hạ 2,7cm) nhưng TÔI KHÔNG ÁP. Cách dựng ấy phụ
   * thuộc hằng số 2,60cm/thốn suy từ giả định "mỏm khuỷu → mỏm cùng vai = 11 thốn". Ba phép đo cho ba
   * kết quả: 2,57 (giả định ấy) · 3,27 (bảng cot-do-chi hiện dùng, neo vào hai HUYỆT TE10–TE14) ·
   * 3,49 (nếp nách → nếp khuỷu = 9 thốn theo WHO, nhưng phép dò nếp nách trên mesh này không đơn điệu
   * nên KHÔNG tin được). Chưa có hai phép đo độc lập nào khớp nhau thì chưa được chốt thang — đúng
   * luật đã vấp ba lần trước. TE11/TE12/TE13 để lại chờ chốt mốc nếp nách. */
  TE5:  { pos: { x: 0.1430, y: 0.5304, z: -0.0122 }, why: 'Ngoại Quan — 2 thốn trên lằn cổ tay, TÂM khe gian cốt quay–trụ, mặt mu. Nghiệm thu: đối diện PC6 lệch 0,03cm' },
  TE6:  { pos: { x: 0.1410, y: 0.5416, z: -0.0146 }, why: 'Chi Câu — 3 thốn trên lằn cổ tay, tâm khe gian cốt, mặt mu' },
  TE7:  { pos: { x: 0.1358, y: 0.5408, z: -0.0143 }, why: 'Hội Tông — cùng mức 3 thốn với Chi Câu nhưng sát BỜ QUAY của xương trụ (u≈−0,75), không ở tâm khe' },
  TE8:  { pos: { x: 0.1403, y: 0.5525, z: -0.0200 }, why: 'Tam Dương Lạc — 4 thốn trên lằn cổ tay, tâm khe gian cốt, mặt mu' },
  TE9:  { pos: { x: 0.1380, y: 0.5857, z: -0.0332 }, why: 'Tứ Độc — 7 thốn trên lằn cổ tay (5 thốn dưới mỏm khuỷu), tâm khe gian cốt. Điểm cũ lệch 3,43cm sang dải kinh Tiểu Trường' },
  TE16: { pos: { x: 0.0283, y: 0.8880, z: -0.0194 }, why: 'Thiên Dũ — ngang GÓC HÀM DƯỚI (dò bằng mức bờ sau ngành hàm bắt đầu quay ra trước, y=152,65cm), tại BỜ SAU cơ ức–đòn–chũm. Điểm cũ đè lên bụng cơ' },
  TE23: { pos: { x: 0.0308, y: 0.9423, z: 0.0347 }, why: 'Ty Trúc Không — hõm ngay trên KHỚP TRÁN–GÒ MÁ (hai xương cách 0,013cm ở cao 161,38cm). Nghiệm thu: cách GB1 2,05cm, hội đồng đòi 1,6–2,2 (trước 3,35)' },
};

// ---- CHẤM TAY (backend): trộn chốt người dùng (TRUYỀN QUA THAM SỐ) vào BẢN SAO của A.
//      KHÔNG đọc file, KHÔNG sửa state dùng chung (A/L) — để gọi lại nhiều lần / song song vẫn đúng.
// buildAnchors(userAnchors) → { anchorMap, landmarkOverrides }:
//   anchorMap         = A (mốc tác giả) đã trộn chốt người dùng (mỗi chốt thành MỐC, ưu tiên tuyệt đối)
//   landmarkOverrides = { MỐC_GIẢI_PHẪU: {x,y,z} } để CALLER áp TẠM vào L rồi KHÔI PHỤC (giữ solver thuần).
function buildAnchors(userAnchors) {
  const anchorMap = {};
  for (const [code, def] of Object.entries(A)) anchorMap[code] = { ...def };   // bản sao nông, không đụng A gốc
  const landmarkOverrides = {};
  for (const [code, p] of Object.entries(userAnchors || {})) {
    if (!p || typeof p.x !== 'number') continue;
    const lm = (A[code] && A[code].at) || CODE_LM[code] || null;
    anchorMap[code] = { pos: { x: p.x, y: p.y, z: p.z }, why: 'CHẤM TAY (bạn tự đặt)', at: lm, user: true };
    if (lm && L[lm]) landmarkOverrides[lm] = { x: p.x, y: p.y, z: p.z };        // chốt trùng mốc → đề nghị ghi đè mốc
  }
  return { anchorMap, landmarkOverrides };
}

// dựng map vị trí mốc từ anchorMap: ưu tiên pos, sau đó tra L[at] (L đã được caller áp override nếu có).
function resolveAnchors(anchorMap) {
  const out = {};
  for (const [code, def] of Object.entries(anchorMap)) {
    const pos = def.pos || (def.at && L[def.at] ? { x: L[def.at].x, y: L[def.at].y, z: L[def.at].z } : null);
    if (pos) out[code] = { pos, why: def.why, at: def.at || null, user: !!def.user };
  }
  return out;
}

module.exports = { ANCHORS: A, CODE_LM, buildAnchors, resolveAnchors };
