/* who-ref-v2-human-atlas — BẢN NHÁP: 20 mốc HUYỆT (khác 24 mốc GIẢI PHẪU của model-frame-v2)
 * đã recalibrate trên mesh Human Atlas mới, thay cho toạ độ tay đặt trên mesh CŨ.
 *
 * Đi kèm BẮT BUỘC với model-frame-v2-human-atlas.cjs (không dùng lẫn với model-frame.cjs gốc —
 * hệ mốc xương khác nhau sẽ cho toạ độ sai).
 *
 * PHƯƠNG PHÁP: mỗi huyệt dò theo ĐÚNG mô tả giải phẫu trong note gốc (vd ST6 "góc hàm" → điểm
 * sau-dưới-ngoài nhất xương hàm dưới; LU11 "đầu ngón cái" → đốt xa ngón cái), KHÔNG đặt tay ước
 * lượng. Đối chiếu khoảng cách 3D với toạ độ CŨ (mesh cũ) — lệch lớn không nhất thiết là SAI (có
 * thể bản cũ mới là bên lệch, xem model-frame-v2's ghi chú XIPHOID/HIP_ANT làm ví dụ), nhưng
 * ĐÁNG SOÁT MẮT trước khi tin dùng lâm sàng, đặc biệt nhóm "ĐỘ TIN THẤP" bên dưới.
 *
 * ĐỘ TIN CẬY (lệch 3D so với mesh cũ, chỉ mang tính tham khảo — không phải thước đo đúng/sai):
 *   CAO   (<3cm, khớp mô tả rõ): LU11, ST42, ST45
 *   TRUNG BÌNH (3-8cm, có mốc xương rõ nhưng vùng mô mềm dày): LU10, ST5, ST6, ST7, ST41, ST43,
 *              ST44, ST12, CV24
 *   THẤP  (>8cm, mô tả khó bắt bằng xương/heuristic thô — NÊN CHẤM TAY LẠI): ST9, ST10, ST17,
 *              CV17 (đã cải thiện X qua xương sườn nhưng Y/Z còn thô), ST31 (đùi, xem note riêng),
 *              CV1 (đáy chậu, gần như không có mốc xương sát)
 *
 * ST31 riêng: mô tả "phễu đùi, ngang nếp bẹn" có độ ngang (X) LỚN hơn hẳn mọi mốc xương lân cận
 * (mấu chuyển lớn xương đùi, gai chậu trước trên) — nghi bản CŨ (X=0.156) tự nó cũng là ước lượng,
 * không phải đo chuẩn. Cả 2 phương án (lerp trục đùi, mấu chuyển lớn) đều KHÔNG khớp bản cũ — đây
 * là điểm CẦN chấm tay trực tiếp trên mesh mới, không nên tin số tôi đưa ra dưới đây.               */
module.exports = {
  // ——— LU: huyệt định tính ở bàn tay ———
  LU10: { pos: { x: 0.1701, y: 0.4978, z: 0.0225 }, note: 'Ngư Tế: giữa xương bàn ngón 1, mé tay quay, ranh da đỏ–trắng [TRUNG BÌNH]' },
  LU11: { pos: { x: 0.1878, y: 0.4637, z: 0.0404 }, note: 'Thiếu Thương: góc móng ngón cái mé quay 0,1 thốn (tỉnh huyệt) [CAO]' },

  // ——— ST: mặt + bàn chân ———
  ST2:  { pos: { x: 0.0123, y: 0.9356, z: 0.0415 }, note: 'Tứ Bạch (lỗ dưới ổ mắt): ĐÃ RECALIB trên mesh v2 — trục dọc đồng tử (x=0,0152 từ TK trên ổ mắt) × cao độ dưới bờ dưới ổ mắt 0,8cm (đỉnh xương hàm trên FMA53650 y=0,9371), rồi chiếu ra da [TRUNG BÌNH]. Giá trị cũ (0,030; 0,910; 0,088) là toạ độ mesh CŨ, cách da 6,6cm và kéo theo cả ST3 (neo vào ST2)' },
  ST5:  { pos: { x: 0.0121, y: 0.8865, z: 0.0358 }, note: 'Đại Nghênh: bờ trước cơ cắn, rãnh ĐM mặt, bờ dưới hàm dưới [TRUNG BÌNH]' },
  ST6:  { pos: { x: 0.0165, y: 0.8769, z: 0.023 }, note: 'Giáp Xa: 1 khoát ngón trước-trên góc hàm, đỉnh cơ cắn [TRUNG BÌNH]' },
  ST7:  { pos: { x: 0.0368, y: 0.9175, z: 0.0126 }, note: 'Hạ Quan: lõm dưới cung gò má, trước lồi cầu hàm dưới [TRUNG BÌNH — đã sửa 1 lần do lật hướng z]' },
  ST41: { pos: { x: 0.0431, y: 0.0381, z: 0.0028 }, note: 'Giải Khê: giữa nếp cổ chân trước, giữa 2 gân duỗi [TRUNG BÌNH]' },
  ST42: { pos: { x: 0.0532, y: 0.0388, z: 0.0077 }, note: 'Xung Dương: đỉnh mu chân, trên ĐM mu chân [CAO]' },
  ST43: { pos: { x: 0.067, y: 0.0151, z: 0.0405 }, note: 'Hãm Cốc: lõm nối thân–đầu xương bàn 2, kẽ ngón 2–3 [TRUNG BÌNH]' },
  ST44: { pos: { x: 0.0708, y: 0.011, z: 0.0491 }, note: 'Nội Đình: mép màng da kẽ ngón 2–3 [TRUNG BÌNH]' },
  ST45: { pos: { x: 0.0802, y: 0.0046, z: 0.0714 }, note: 'Lệ Đoài: góc ngoài móng ngón 2, 0,1 thốn (tỉnh huyệt) [CAO]' },
  ST31: { pos: { x: 0.0658, y: 0.5162, z: -0.0102 }, note: 'Bễ Quan: phễu đùi, ngang nếp bẹn, ~13 thốn trên gối [THẤP — xem cảnh báo riêng ở đầu file, NÊN CHẤM TAY]' },
  ST17: { pos: { x: 0.0735, y: 0.7553, z: 0.027 }, note: 'Nhũ Trung: chính giữa đầu vú (mốc, 4 thốn ngang giữa ngực) [THẤP — X từ xương sườn thật, Y/Z còn thô, NÊN CHẤM TAY]' },
  ST9:  { pos: { x: 0.0224, y: 0.8648, z: 0.0066 }, note: 'Nhân Nghênh: ngang yết hầu, bờ trước cơ ức-đòn-chũm, cạnh ĐM cảnh (~1,5 thốn ngang) [THẤP — không có mốc xương, NÊN CHẤM TAY]' },
  ST10: { pos: { x: 0.0212, y: 0.8542, z: 0.0066 }, note: 'Thủy Đột: giữa Nhân Nghênh–Khí Xá, bờ trước cơ ức-đòn-chũm [THẤP — không có mốc xương, NÊN CHẤM TAY]' },
  ST12: { pos: { x: 0.0449, y: 0.8269, z: -0.0011 }, note: 'Khuyết Bồn: hố trên đòn, giữa xương đòn, thẳng trên đầu vú (4 thốn ngang) [TRUNG BÌNH]' },

  // ——— CV: đáy chậu + cằm ———
  CV1:  { pos: { x: -0.0084, y: 0.492, z: -0.0027 }, note: 'Hội Âm: trung tâm đáy chậu [THẤP — gần như không có mốc xương, NÊN CHẤM TAY]' },
  CV24: { pos: { x: 0, y: 0.8757, z: 0.0342 }, note: 'Thừa Tương: lõm chính giữa dưới môi dưới (= MENTON, model-frame-v2) [TRUNG BÌNH]' },
  CV17: { pos: { x: 0.0, y: 0.7553, z: 0.0211 }, note: 'Đản Trung: giữa 2 đầu vú, đường dọc giữa ức (khe sườn 4) [THẤP — xem ST17]' },
  CV18: { pos: { x: 0, y: 0.7543, z: 0.0551 }, note: 'Ngọc Đường: khớp ức-sườn 4, trục chest_up (XIPHOID→STERNUM_TOP, 9 thốn) tại 3,2 thốn trên XIPHOID (quy ước cổ điển: 5 huyệt CV17-21 cách đều 1,6 thốn trên thân ức 9 thốn) [TRUNG BÌNH]. SỬA: mô tả gốc chỉ nêu mức khớp sườn, không có số thốn + vitri từng để trống → rơi vào mốc STERNUM chung, trùng hệt CV19/CV20 (phát hiện qua audit khe mô độc lập kinhlacc-61)' },
  CV19: { pos: { x: 0, y: 0.7656, z: 0.0523 }, note: 'Tử Cung: khớp ức-sườn 4 (giữa), trục chest_up tại 4,8 thốn trên XIPHOID [TRUNG BÌNH]. SỬA: cùng lỗi trùng mốc STERNUM như CV18' },
  CV20: { pos: { x: 0, y: 0.777, z: 0.0496 }, note: 'Hoa Cái: khớp xương ức (giữa), trục chest_up tại 6,4 thốn trên XIPHOID [TRUNG BÌNH]. SỬA: cùng lỗi trùng mốc STERNUM như CV18' },
  CV21: { pos: { x: 0, y: 0.7884, z: 0.0469 }, note: 'Toàn Cơ: bờ trên khớp ức-sườn 1, trục chest_up tại 8 thốn trên XIPHOID (1 thốn dưới STERNUM_TOP) [TRUNG BÌNH]' },

  // ——— LI: bàn/ngón tay trỏ + cổ tay + mũi (đợt 2 — LI/PC/SP) ———
  LI1: { pos: { x: 0.1779, y: 0.4331, z: 0.0471 }, note: 'Thương Dương: góc ngoài chân móng ngón trỏ, mé quay (tỉnh huyệt) [TRUNG BÌNH]' },
  LI2: { pos: { x: 0.1763, y: 0.4458, z: 0.0311 }, note: 'Nhị Gian: đầu xa đốt gần ngón trỏ, mé quay, ranh da đỏ-trắng [TRUNG BÌNH]' },
  LI3: { pos: { x: 0.1705, y: 0.4621, z: 0.0251 }, note: 'Tam Gian: giữa thân đốt gần ngón trỏ, mé quay [TRUNG BÌNH]' },
  LI4: { pos: { x: 0.1655, y: 0.492, z: 0.0196 }, note: 'Hợp Cốc: giữa xương bàn tay 1-2, mặt mu [TRUNG BÌNH]' },
  LI5: { pos: { x: 0.1627, y: 0.5184, z: 0.0088 }, note: 'Dương Khê: hố lào, mỏm trâm quay [TRUNG BÌNH]' },
  LI20: { pos: { x: 0.0049, y: 0.9202, z: 0.0472 }, note: 'Nghinh Hương: rãnh mũi-má, cạnh cánh mũi [THẤP — xương hàm trên+mũi, không có mốc rãnh rõ, NÊN CHẤM TAY]' },
  LI8: { pos: { x: 0.1455, y: 0.6043, z: -0.0091 }, note: 'Hạ Liêm: 4 thốn dưới Khúc Trì (LI11), trên đường nối Khúc Trì-Dương Khê [THẤP — nội suy trục forearm, không đo trực tiếp]' },
  LI17: { pos: { x: 0.042, y: 0.865, z: -0.01 }, note: 'Thiên Đỉnh: ngang cổ, sau bó ức-đòn-chũm, cách sụn giáp 3 thốn [THẤP — ước lượng thô cạnh LARYNX, NÊN CHẤM TAY]' },
  LI19: { pos: { x: 0.015, y: 0.90, z: 0.05 }, note: 'Hòa Liêu: cách rãnh nhân trung 0,5 thốn [THẤP — ước lượng thô vùng mũi, NÊN CHẤM TAY]' },
  LI7: { pos: { x: 0.1522, y: 0.5729, z: -0.0027 }, note: 'Ôn Lưu: cách Dương Khê (LI5) 5 thốn trên đường nối LI5-LI11 [THẤP — nội suy, parser bị nhầm ref do 2 huyệt tham chiếu quá gần nhau trong câu, thêm mốc để né chứ không sửa parser lõi]' },

  // ——— SP: ngón chân cái + gối trong (đợt 2) ———
  SP1: { pos: { x: 0.0669, y: 0.0065, z: 0.0762 }, note: 'Ẩn Bạch: góc trong móng ngón chân cái (tỉnh huyệt) [TRUNG BÌNH]' },
  SP4: { pos: { x: 0.0442, y: 0.0259, z: 0.0224 }, note: 'Công Tôn: nối thân-đầu sau xương bàn chân 1, ranh da gan-mu chân [TRUNG BÌNH — trước đó bị bug parser neo nhầm PUBIS (đã sửa regex "xương mu"), nay mốc riêng]' },
  SP2: { pos: { x: 0.0669, y: 0.02, z: 0.062 }, note: 'Đại Đô: lõm khớp bàn-ngón chân cái, mé trong, ranh da gan-mu chân [THẤP — ước lượng gần SP1/SP3, chưa dò riêng]' },
  SP3: { pos: { x: 0.0502, y: 0.011, z: 0.0518 }, note: 'Thái Bạch: đầu xa xương bàn chân 1, mé trong, ranh da đỏ-trắng [TRUNG BÌNH]' },
  SP8: { pos: { x: 0.0486, y: 0.2178, z: -0.0074 }, note: 'Địa Cơ: 3 thốn dưới Âm Lăng Tuyền [THẤP — nội suy trục leg_lower từ SP9, không đo trực tiếp]' },
  SP9: { pos: { x: 0.0462, y: 0.2602, z: -0.0014 }, note: 'Âm Lăng Tuyền: lồi cầu trong đầu trên xương chầy [TRUNG BÌNH — đối xứng cách sửa KNEE_EYE_LAT, ưu tiên cả trong lẫn trước]' },
  SP11: { pos: { x: 0.0451, y: 0.3889, z: 0.0200 }, note: 'Cơ Môn: 6 thốn trên Huyết Hải (SP10), rồi định vị khe giữa cơ may–cơ thẳng đùi tại cao độ đó (interface-geom.gapBetween) [TRUNG BÌNH — NÊN CHẤM TAY]. SỬA: bản cũ nội suy theo trục "thigh" (đường TRƯỚC, ASIS–mắt gối) trong khi Cơ Môn là điểm TRONG đùi — lệch 7,2cm, bị cả audit khe mô (kinhlacc-61, vượt trần trượt 3,1cm nên không tự sửa được) lẫn kiểm tra khoảng-cách-da độc lập của tôi cùng chỉ ra' },
  SP19: { pos: { x: 0.09, y: 0.775, z: 0.02 }, note: 'Hung Hương: khoang liên sườn 3, cách đường giữa 6 thốn [THẤP — ước lượng thô theo mức xương sườn, chưa dò riêng]' },
  SP21: { pos: { x: 0.1222, y: 0.707, z: -0.0172 }, note: 'Đại Bao: 6 thốn dưới hố nách [THẤP — nội suy trục upperarm từ AXILLA_ANT, không đo trực tiếp]' },

  // ——— PC: lòng bàn tay + ngón giữa (đợt 2) ———
  PC8: { pos: { x: 0.1486, y: 0.4856, z: 0.015 }, note: 'Lao Cung: giữa lòng bàn tay, khe đầu xương bàn 3-4 [TRUNG BÌNH — xương không có nếp lằn tay thật, xấp xỉ]' },
  PC9: { pos: { x: 0.1611, y: 0.4254, z: 0.0539 }, note: 'Trung Xung: giữa đầu ngón tay giữa (tỉnh huyệt) [TRUNG BÌNH]' },

  // ——— SI: bàn tay mé trụ + xương bả vai + mặt (đợt 3 — SI/KI/LR) ———
  SI1: { pos: { x: 0.1308, y: 0.4404, z: 0.046 }, note: 'Thiếu Trạch: góc trong chân móng ngón út, mé trụ (tỉnh huyệt) [TRUNG BÌNH]' },
  SI2: { pos: { x: 0.1336, y: 0.4547, z: 0.0331 }, note: 'Tiền Cốc: trước khớp bàn-ngón út, mé trụ [TRUNG BÌNH]' },
  SI3: { pos: { x: 0.1315, y: 0.4725, z: 0.0233 }, note: 'Hậu Khê: sau khớp bàn-ngón út, mé trụ [TRUNG BÌNH]' },
  SI4: { pos: { x: 0.1406, y: 0.5038, z: 0.0133 }, note: 'Uyển Cốt: giữa xương móc và xương bàn tay 5 [TRUNG BÌNH]' },
  SI5: { pos: { x: 0.1374, y: 0.5109, z: 0.0128 }, note: 'Dương Cốc: giữa xương đậu và mỏm trâm trụ [TRUNG BÌNH]' },
  SI9: { pos: { x: 0.0947, y: 0.8212, z: -0.0376 }, note: 'Kiên Trinh: mặt sau vai, 1 thốn trên nếp nách sau [THẤP — ước lượng góc trên-ngoài xương bả vai, NÊN CHẤM TAY]' },
  SI11: { pos: { x: 0.0632, y: 0.7842, z: -0.0409 }, note: 'Thiên Tông: hố dưới gai xương bả vai [THẤP — centroid nửa dưới scapula, không có mốc gai vai riêng, NÊN CHẤM TAY]' },
  SI14: { pos: { x: 0.04, y: 0.8191, z: -0.0441 }, note: 'Kiên Ngoại Du: bờ trong xương bả vai, ngang đốt sống ngực 1 [THẤP — ước lượng bờ trong-trên scapula, NÊN CHẤM TAY]' },
  SI17: { pos: { x: 0.0195, y: 0.8828, z: 0.0112 }, note: 'Thiên Dung: sau góc hàm dưới, trước cơ ức-đòn-chũm [THẤP — ước lượng lùi sau từ góc hàm (ST6), NÊN CHẤM TAY]' },
  SI18: { pos: { x: 0.0271, y: 0.9065, z: 0.0261 }, note: 'Quyền Liêu: dưới xương gò má [TRUNG BÌNH]' },
  SI19: { pos: { x: 0.0426, y: 0.9146, z: 0.0038 }, note: 'Thính Cung: trước bình tai, sau lồi cầu hàm [THẤP — ước lượng lùi sau-trên từ ST7, NÊN CHẤM TAY]' },

  // ——— KI: gan bàn chân + xương thuyền (đợt 3) ———
  KI1: { pos: { x: 0.0556, y: 0.005, z: 0.0126 }, note: 'Dũng Tuyền: lòng bàn chân, 2/5 trước-3/5 sau [THẤP — raycast từ đầu xương bàn chân 2 xuống da gan chân, NÊN CHẤM TAY]' },
  KI2: { pos: { x: 0.0341, y: 0.0312, z: 0.0042 }, note: 'Nhiên Cốc: bờ dưới xương thuyền, mé trong bàn chân [TRUNG BÌNH]' },

  // ——— LR: ngón chân cái mé ngoài + bẹn + sườn 11 (đợt 3) ———
  LR1: { pos: { x: 0.0725, y: 0.0071, z: 0.0763 }, note: 'Đại Đôn: góc ngoài chân móng ngón chân cái (tỉnh huyệt) [TRUNG BÌNH]' },
  LR2: { pos: { x: 0.0596, y: 0.0131, z: 0.0509 }, note: 'Hành Gian: kẽ ngón chân 1-2, phía mu chân [TRUNG BÌNH]' },
  LR3: { pos: { x: 0.0578, y: 0.0131, z: 0.0511 }, note: 'Thái Xung: sau kẽ ngón 1-2, góc 2 xương bàn chân 1-2 [THẤP — rất gần LR2, chưa tách biệt tốt bằng heuristic, NÊN CHẤM TAY]' },
  LR11: { pos: { x: 0.0553, y: 0.5089, z: -0.02 }, note: 'Âm Liêm: bẹn, sát bờ trong động mạch đùi [THẤP — nội suy giữa SP12 và đường giữa, không đo trực tiếp, NÊN CHẤM TAY]' },
  LR13: { pos: { x: 0.0644, y: 0.6376, z: -0.0076 }, note: 'Chương Môn: đầu xương sườn tự do 11 [TRUNG BÌNH]' },

  // ——— TE: ngón áp út + bàn tay 4-5 (đợt 3 — BL/GB/TE) ———
  TE1: { pos: { x: 0.1467, y: 0.4335, z: 0.0517 }, note: 'Quan Xung: bờ trong ngón áp út, cách chân móng 0,1 thốn (tỉnh huyệt) [TRUNG BÌNH]' },
  TE2: { pos: { x: 0.1432, y: 0.4676, z: 0.0219 }, note: 'Dịch Môn: giữa xương bàn ngón 4-5, kẽ ngón [TRUNG BÌNH]' },
  TE3: { pos: { x: 0.1449, y: 0.4728, z: 0.0207 }, note: 'Trung Chử: trên mu tay, giữa xương bàn 4-5, trong kẽ ngón 1 thốn [TRUNG BÌNH]' },
  TE12: { pos: { x: 0.1123, y: 0.7274, z: -0.0257 }, note: 'Tiêu Lạc: giữa cánh tay sau, 5 thốn trên khớp khuỷu [THẤP — nội suy OLECRANON-ACROMION, NÊN CHẤM TAY]' },
  TE13: { pos: { x: 0.1023, y: 0.7859, z: -0.0222 }, note: 'Nhu Hội: dưới mỏm vai 3 thốn, bờ sau cơ delta [THẤP — nội suy ACROMION-OLECRANON, NÊN CHẤM TAY]' },
  TE21: { pos: { x: 0.0224, y: 0.9236, z: 0.006 }, note: 'Nhĩ Môn: trước bình tai [THẤP — ước lượng từ MASTOID dịch ra trước, NÊN CHẤM TAY]' },
  TE23: { pos: { x: 0.06, y: 0.918, z: 0.05 }, note: 'Ty Trúc Không: đuôi lông mày [THẤP — ước lượng thô, không có mốc xương, NÊN CHẤM TAY]' },

  // ——— GB: mấu chuyển/xương mác/sườn 12/bàn chân 4-5 (đợt 3) ———
  GB1: { pos: { x: 0.045, y: 0.925, z: 0.088 }, note: 'Đồng Tử Liêu: cách góc ngoài mắt 0,5 thốn [THẤP — ước lượng quanh PUPIL, NÊN CHẤM TAY]' },
  GB12: { pos: { x: 0.045, y: 0.895, z: -0.01 }, note: 'Hoàn Cốt: sau-dưới mỏm xương chũm [THẤP — ước lượng từ MASTOID, NÊN CHẤM TAY]' },
  GB20: { pos: { x: 0.035, y: 0.9, z: -0.03 }, note: 'Phong Trì: đáy hộp sọ, giữa cơ ức-đòn-chũm và cơ thang [THẤP — ước lượng từ MASTOID, NÊN CHẤM TAY]' },
  GB25: { pos: { x: 0.0499, y: 0.6358, z: -0.0245 }, note: 'Đái Mạch: đầu xương sườn tự do 12 (= RIB12, model-frame-v2) [TRUNG BÌNH]' },
  GB29: { pos: { x: 0.0928, y: 0.5338, z: 0.006 }, note: 'Cư Liêu: trung điểm đường nối HIP_ANT (gai chậu trước trên) và GREATER_TROCHANTER, rồi chiếu ra mặt da gần nhất (toSkin, bias giữ nguyên cao độ) [TRUNG BÌNH]. SỬA: bản cốt-độ tự động trước đây không hỗ trợ ràng buộc "trung điểm 2 mốc" → rơi thẳng vào GREATER_TROCHANTER (trùng hệt GB30); điểm trung điểm thô còn cách da 2,1cm (do bề mặt cong lõm giữa 2 mốc xương) — kinhlacc-94 đo xác nhận trước khi chiếu da, đã kiểm mặt da gần nhất đúng phía (không nhảy sang mặt sau như GB31)' },
  GB30: { pos: { x: 0.058, y: 0.5012, z: -0.0259 }, note: 'Hoàn Khiêu: điểm chia 1/3 ngoài–2/3 trong đường nối GREATER_TROCHANTER và khe xương cùng (đo trực tiếp mỏm thấp nhất gần đường giữa của xương cùng FMA16202: x≈-0.0007,y≈0.5007,z≈-0.0500, rồi lấy 1/3 từ phía trochanter) [TRUNG BÌNH]. SỬA: cùng lỗi thiếu ràng buộc "chia tỉ lệ đoạn thẳng" như GB29, trước đây trùng hệt GREATER_TROCHANTER' },
  GB31: { pos: { x: 0.0893, y: 0.3544, z: 0.008 }, force: true, note: 'Phong Thị: cao độ = 7 thốn trên POPLITEAL theo trục thigh_lateral (đúng cốt-độ sách, xác nhận độc lập bởi kinhlacc-61 — KHÔNG dùng mốc "đầu ngón giữa chạm đùi" vì tay mesh này ngắn hơn chuẩn nhân trắc, sẽ đẩy sai ~7cm); x/z = điểm DA NGOÀI NHẤT (x lớn nhất) trong dải y=0,3544±0,004 [TRUNG BÌNH]. SỬA 2 LẦN: (1) nội suy thẳng trục thigh_lateral (x=8,7cm) và (2) khe giữa cơ nhị đầu đùi–cơ rộng ngoài (x=9,9cm) ĐỀU sai — kinhlacc-94 chỉ ra x của GB31 phải NHỎ HƠN GB29/30 (trên) và LỚN HƠN GB32/33/34 (dưới, đùi thon dần) vì kinh Đởm chạy dọc mặt ngoài đùi, nhưng cả 2 cách trên cho x=8,7-9,9cm < GB32(11,5cm) — đùi "thắt vào rồi phình ra" là vô lý. Nguyên nhân gốc: trục nội suy thẳng (2 mốc xương) và khe-2-cơ đều cắt qua BÊN TRONG chỗ đùi phình ra ở bụng cơ tứ đầu/nhị đầu, không chạm mặt ngoài thật — phải tìm trực tiếp đỉnh ngoài của mặt da mới đúng. x=15,2cm — cần bake lại rồi nhờ kinhlacc-94 đo lại cả dãy GB29→35 để xác nhận hết thắt-phình' },
  GB34: { pos: { x: 0.0624, y: 0.2442, z: -0.0139 }, note: 'Dương Lăng Tuyền: trước-dưới chỏm xương mác [TRUNG BÌNH — từ FIBULA_HEAD, lệch trước-dưới theo mô tả]' },
  GB41: { pos: { x: 0.0805, y: 0.0099, z: 0.0397 }, note: 'Túc Lâm Khấp: trước khớp bàn-ngón chân 4-5 [TRUNG BÌNH]' },
  GB43: { pos: { x: 0.0826, y: 0.0091, z: 0.0415 }, note: 'Hiệp Khê: kẽ ngón chân 4-5, phía mu chân [TRUNG BÌNH]' },
  GB44: { pos: { x: 0.088, y: 0.008, z: 0.06 }, note: 'Túc Khiếu Âm: góc ngoài móng ngón chân 4 (tỉnh huyệt) [THẤP — ước lượng theo tỉ lệ bàn chân, NÊN CHẤM TAY]' },

  // ——— BL: đầu/gáy + cùng-mông + bắp chân + bàn chân (đợt 3 — kinh lớn nhất) ———
  BL1: { pos: { x: 0.009, y: 0.9294, z: 0.09 }, note: 'Tinh Minh: góc trong mắt [THẤP — ước lượng giữa GLABELLA-PUPIL (2 mốc này đều OLD-STALE), NÊN CHẤM TAY]' },
  BL2: { pos: { x: 0.009, y: 0.935, z: 0.088 }, note: 'Toàn Trúc: đầu trong chân mày [THẤP — ước lượng, NÊN CHẤM TAY]' },
  BL3: { pos: { x: 0.009, y: 0.945, z: 0.075 }, note: 'Mi Xung: thẳng trên Toàn Trúc, chân tóc [THẤP — ước lượng, NÊN CHẤM TAY]' },
  BL10: { pos: { x: 0.02, y: 0.8936, z: -0.064 }, note: 'Thiên Trụ: gáy, dưới u chẩm ngoài [THẤP — ước lượng từ MASTOID, NÊN CHẤM TAY]' },
  BL27: { pos: { x: 0.008, y: 0.5614, z: -0.0418 }, note: 'Tiểu Trường Du: dưới đốt xương thiêng 1 [THẤP — mô tả sách trùng BL31 (cùng mức xương thiêng 1), dùng chung toạ độ, NÊN CHẤM TAY]' },
  BL28: { pos: { x: 0.008, y: 0.5514, z: -0.0418 }, note: 'Bàng Quang Du: ngang đốt xương thiêng 2 [THẤP — trùng mức BL32, NÊN CHẤM TAY]' },
  BL29: { pos: { x: 0.008, y: 0.5364, z: -0.0418 }, note: 'Trung Lữ Du: ngang đốt xương thiêng 3 [THẤP — trùng mức BL33, NÊN CHẤM TAY]' },
  BL30: { pos: { x: 0.008, y: 0.5214, z: -0.0418 }, note: 'Bạch Hoàn Du: ngang đốt xương thiêng 4 [THẤP — trùng mức BL34, NÊN CHẤM TAY]' },
  BL31: { pos: { x: 0.008, y: 0.5614, z: -0.0418 }, note: 'Thượng Liêu: lỗ cùng 1 [THẤP — ước lượng quanh VERT_SACRUM, NÊN CHẤM TAY]' },
  BL32: { pos: { x: 0.008, y: 0.5514, z: -0.0418 }, note: 'Thứ Liêu: lỗ cùng 2 [THẤP — ước lượng, NÊN CHẤM TAY]' },
  BL33: { pos: { x: 0.008, y: 0.5364, z: -0.0418 }, note: 'Trung Liêu: lỗ cùng 3 [THẤP — ước lượng, NÊN CHẤM TAY]' },
  BL34: { pos: { x: 0.008, y: 0.5214, z: -0.0418 }, note: 'Hạ Liêu: lỗ cùng 4 [THẤP — ước lượng, NÊN CHẤM TAY]' },
  BL35: { pos: { x: 0.006, y: 0.53, z: -0.045 }, note: 'Hội Dương: ngang đầu dưới xương cụt [THẤP — ước lượng dưới VERT_SACRUM, NÊN CHẤM TAY]' },
  BL36: { pos: { x: 0.06, y: 0.42, z: -0.06 }, note: 'Thừa Phò: điểm giữa nếp mông [THẤP — ước lượng thô, NÊN CHẤM TAY]' },
  BL37: { pos: { x: 0.0472, y: 0.3551, z: -0.0468 }, note: 'Ân Môn: dưới nếp mông 6 thốn [THẤP — nội suy BL36-POPLITEAL theo tỉ lệ WHO 6/14, NÊN CHẤM TAY]' },
  BL54: { pos: { x: 0.016, y: 0.5214, z: -0.0418 }, note: 'Trật Biên: ngang lỗ cùng 4, cách Đốc Mạch 3 thốn [THẤP — cùng mức BL30/34, gấp đôi độ lệch ngang, NÊN CHẤM TAY]' },
  BL67: { pos: { x: 0.09, y: 0.005, z: 0.055 }, note: 'Chí Âm: góc ngoài móng ngón út chân (tỉnh huyệt) [THẤP — ước lượng theo tỉ lệ bàn chân, NÊN CHẤM TAY]' },
  BL57: { pos: { x: 0.0457, y: 0.1547, z: -0.0259 }, note: 'Thừa Sơn: giữa bụng chân, khe 2 cơ sinh đôi [THẤP — nội suy giữa POPLITEAL-MALLEOLUS_LAT, NÊN CHẤM TAY]' },
  BL60: { pos: { x: 0.053, y: 0.033, z: -0.0303 }, note: 'Côn Lôn: giữa mắt cá ngoài và gân gót [TRUNG BÌNH — nội suy MALLEOLUS_LAT-CALCANEUS]' },
  BL65: { pos: { x: 0.0821, y: 0.0105, z: 0.0211 }, note: 'Thúc Cốt: sau đầu nhỏ xương bàn chân 5 [TRUNG BÌNH]' },
  BL66: { pos: { x: 0.0875, y: 0.0089, z: 0.0303 }, note: 'Thông Cốc: trước khớp bàn-ngón chân 5 [TRUNG BÌNH]' },

  // ——— ĐỐI CHIẾU thốn (WHO độc lập) — GIỮ NGUYÊN, tự động dùng model-frame-v2 mới khi solve ———
  ST36: { constraints: [{ axis: 'vertical', dir: 'down', cun: 3, ref: 'KNEE_EYE_LAT' }, { axis: 'lateral', dir: 'out', cun: 1, ref: 'KNEE_EYE_LAT' }], note: 'WHO: 3 thốn dưới ST35, 1 khoát ngoài mào chày' },
  ST25: { constraints: [{ axis: 'lateral', dir: 'out', cun: 2, ref: 'NAVEL' }], note: 'WHO: 2 thốn ngang rốn' },
  CV4:  { constraints: [{ axis: 'vertical', dir: 'down', cun: 3, ref: 'NAVEL' }], note: 'WHO: 3 thốn dưới rốn' },
  CV12: { constraints: [{ axis: 'vertical', dir: 'up', cun: 4, ref: 'NAVEL' }], note: 'WHO: 4 thốn trên rốn (giữa rốn–mũi ức)' },
  LU7:  { constraints: [{ axis: 'vertical', dir: 'up', cun: 1.5, ref: 'WRIST' }], note: 'WHO: 1,5 thốn trên lằn cổ tay, hố lào' },
  LU5:  { pos: { x: 0.1374, y: 0.6493, z: -0.0187 }, note: 'WHO: Xích Trạch trên nếp khuỷu, bờ ngoài gân cơ nhị đầu (= CUBITAL, model-frame-v2) [TRUNG BÌNH]' },
};
