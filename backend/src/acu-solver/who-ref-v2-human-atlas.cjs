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
  ST2:  { pos: { x: 0.030, y: 0.910, z: 0.088 }, note: 'Tứ Bạch: OLD-STALE — chưa recalib (cần lỗ dưới ổ mắt, thiếu mốc xương rõ)' },
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

  // ——— ĐỐI CHIẾU thốn (WHO độc lập) — GIỮ NGUYÊN, tự động dùng model-frame-v2 mới khi solve ———
  ST36: { constraints: [{ axis: 'vertical', dir: 'down', cun: 3, ref: 'KNEE_EYE_LAT' }, { axis: 'lateral', dir: 'out', cun: 1, ref: 'KNEE_EYE_LAT' }], note: 'WHO: 3 thốn dưới ST35, 1 khoát ngoài mào chày' },
  ST25: { constraints: [{ axis: 'lateral', dir: 'out', cun: 2, ref: 'NAVEL' }], note: 'WHO: 2 thốn ngang rốn' },
  CV4:  { constraints: [{ axis: 'vertical', dir: 'down', cun: 3, ref: 'NAVEL' }], note: 'WHO: 3 thốn dưới rốn' },
  CV12: { constraints: [{ axis: 'vertical', dir: 'up', cun: 4, ref: 'NAVEL' }], note: 'WHO: 4 thốn trên rốn (giữa rốn–mũi ức)' },
  LU7:  { constraints: [{ axis: 'vertical', dir: 'up', cun: 1.5, ref: 'WRIST' }], note: 'WHO: 1,5 thốn trên lằn cổ tay, hố lào' },
  LU5:  { pos: { x: 0.1374, y: 0.6493, z: -0.0187 }, note: 'WHO: Xích Trạch trên nếp khuỷu, bờ ngoài gân cơ nhị đầu (= CUBITAL, model-frame-v2) [TRUNG BÌNH]' },
};
