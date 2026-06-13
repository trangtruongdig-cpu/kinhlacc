/* who-ref — NGUỒN ĐỘC LẬP #2: chuẩn WHO Standard Acupuncture Point Locations (2008).
 * Vai trò:  (a) LẤP các huyệt sách mô tả định tính (không có thốn) bằng định nghĩa mốc của WHO;
 *           (b) ĐỐI CHIẾU độc lập giá trị thốn của các huyệt đã giải (phát hiện bất đồng).
 * Định dạng mỗi mã:
 *   { pos:{x,y,z}, note }                      — vị trí trực tiếp (huyệt neo mốc giải phẫu)
 *   { constraints:[{axis,dir,cun,ref}], note } — dạng ràng buộc, solver giải y như sách
 * Toạ độ trực tiếp đã calibrate về khung model (mm-scale 1.70). CHỈ LU/ST/CV (3 kinh mẫu).   */
module.exports = {
  // ——— LU: huyệt định tính ở bàn tay ———
  LU10: { pos: { x: 0.177, y: 0.500, z: 0.037 }, note: 'Ngư Tế: giữa xương bàn ngón 1, mé tay quay, ranh da đỏ–trắng' },
  LU11: { pos: { x: 0.193, y: 0.466, z: 0.040 }, note: 'Thiếu Thương: góc móng ngón cái mé quay 0,1 thốn (tỉnh huyệt)' },

  // ——— ST: mặt + bàn chân ———
  ST2:  { pos: { x: 0.030, y: 0.910, z: 0.088 }, note: 'Tứ Bạch: thẳng dưới đồng tử, lỗ dưới ổ mắt' },
  ST5:  { pos: { x: 0.046, y: 0.886, z: 0.030 }, note: 'Đại Nghênh: bờ trước cơ cắn, rãnh ĐM mặt, bờ dưới hàm dưới' },
  ST6:  { pos: { x: 0.050, y: 0.906, z: 0.032 }, note: 'Giáp Xa: 1 khoát ngón trước-trên góc hàm, đỉnh cơ cắn' },
  ST7:  { pos: { x: 0.050, y: 0.926, z: 0.039 }, note: 'Hạ Quan: lõm dưới cung gò má, trước lồi cầu hàm dưới' },
  ST41: { pos: { x: 0.046, y: 0.067, z: 0.008 }, note: 'Giải Khê: giữa nếp cổ chân trước, giữa 2 gân duỗi' },
  ST42: { pos: { x: 0.070, y: 0.041, z: 0.009 }, note: 'Xung Dương: đỉnh mu chân, trên ĐM mu chân' },
  ST43: { pos: { x: 0.065, y: 0.041, z: 0.026 }, note: 'Hãm Cốc: lõm nối thân–đầu xương bàn 2, kẽ ngón 2–3' },
  ST44: { pos: { x: 0.086, y: 0.003, z: 0.063 }, note: 'Nội Đình: mép màng da kẽ ngón 2–3' },
  ST45: { pos: { x: 0.085, y: 0.009, z: 0.079 }, note: 'Lệ Đoài: góc ngoài móng ngón 2, 0,1 thốn (tỉnh huyệt)' },
  ST31: { pos: { x: 0.156, y: 0.495, z: 0.029 }, note: 'Bễ Quan: phễu đùi, ngang nếp bẹn, ~13 thốn trên gối' },
  ST17: { pos: { x: 0.086, y: 0.735, z: 0.069 }, note: 'Nhũ Trung: chính giữa đầu vú (mốc, 4 thốn ngang giữa ngực)' },
  ST9:  { pos: { x: 0.040, y: 0.840, z: 0.072 }, note: 'Nhân Nghênh: ngang yết hầu, bờ trước cơ ức-đòn-chũm, cạnh ĐM cảnh (~1,5 thốn ngang)' },
  ST10: { pos: { x: 0.038, y: 0.822, z: 0.074 }, note: 'Thủy Đột: giữa Nhân Nghênh–Khí Xá, bờ trước cơ ức-đòn-chũm' },
  ST12: { pos: { x: 0.078, y: 0.832, z: 0.030 }, note: 'Khuyết Bồn: hố trên đòn, giữa xương đòn, thẳng trên đầu vú (4 thốn ngang)' },

  // ——— CV: đáy chậu + cằm ———
  CV1:  { pos: { x: 0.000, y: 0.448, z: 0.000 }, note: 'Hội Âm: trung tâm đáy chậu' },
  CV24: { pos: { x: 0.000, y: 0.884, z: 0.072 }, note: 'Thừa Tương: lõm chính giữa dưới môi dưới' },
  CV17: { pos: { x: 0.000, y: 0.735, z: 0.055 }, note: 'Đản Trung: giữa 2 đầu vú, đường dọc giữa ức (khe sườn 4)' },

  // ——— ĐỐI CHIẾU thốn (WHO độc lập) cho vài huyệt then chốt → kiểm bất đồng với sách ———
  ST36: { constraints: [{ axis: 'vertical', dir: 'down', cun: 3, ref: 'KNEE_EYE_LAT' }, { axis: 'lateral', dir: 'out', cun: 1, ref: 'KNEE_EYE_LAT' }], note: 'WHO: 3 thốn dưới ST35, 1 khoát ngoài mào chày' },
  ST25: { constraints: [{ axis: 'lateral', dir: 'out', cun: 2, ref: 'NAVEL' }], note: 'WHO: 2 thốn ngang rốn' },
  CV4:  { constraints: [{ axis: 'vertical', dir: 'down', cun: 3, ref: 'NAVEL' }], note: 'WHO: 3 thốn dưới rốn' },
  CV12: { constraints: [{ axis: 'vertical', dir: 'up', cun: 4, ref: 'NAVEL' }], note: 'WHO: 4 thốn trên rốn (giữa rốn–mũi ức)' },
  LU7:  { constraints: [{ axis: 'vertical', dir: 'up', cun: 1.5, ref: 'WRIST' }], note: 'WHO: 1,5 thốn trên lằn cổ tay, hố lào' },
  LU5:  { pos: { x: 0.148, y: 0.646, z: 0.000 }, note: 'WHO: Xích Trạch trên nếp khuỷu, bờ ngoài gân cơ nhị đầu' },
};
