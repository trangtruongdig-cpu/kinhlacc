/**
 * LỤC KHÍ 六氣 (六淫) — sáu khí gây bệnh & cách TÁC ĐỘNG tới TẠNG PHỦ.
 *
 * Song song với Lục Kinh: mỗi Khí là BẢN KHÍ của một Lục Kinh (đặt cùng vị trí góc
 * để hai đồ hình khớp không gian). `key` khớp chỉ mục `lucKhi` ở backend
 * (Phong · Hàn · Thử · Thấp · Táo · Nhiệt) để nối sang thể bệnh / pháp trị.
 *
 * nodes = idx tạng trong Ngũ Hành penta [0 Can · 1 Tâm · 2 Tỳ · 3 Phế · 4 Thận]
 * (五氣通五臟 + tạng kiêm phạm) → tâm đồ hình sáng tạng bị khí tác động.
 * rel  = MỐI LIÊN QUAN ngũ hành: khí truyền từ tạng này sang tạng khác bằng
 *        cung SINH (mẹ→con) hay KHẮC (thừa/vũ) nào → tâm làm nổi cung đó.
 *        (from,to = idx node; type = sinh|khac; note = giải thích cơ chế.)
 */
export interface LucKhiRel {
  from: number
  to: number
  type: 'sinh' | 'khac'
  note: string
}
export interface LucKhiInfo {
  key: string
  han: string
  hanh: 'moc' | 'hoaT' | 'hoaQ' | 'tho' | 'kim' | 'thuy'
  group: 'duong' | 'am' // theo kinh bản khí: Dương (biểu/phủ) · Âm (lý/tạng)
  deg: number // vị trí góc = chỗ Lục Kinh bản khí (khớp đồ hình Lục Kinh)
  mua: string
  tinh: string // đặc tính gây bệnh (6 dâm)
  kinhVi: string // bản khí ↔ Lục Kinh
  kinhHan: string
  tangVi: string // tạng/phủ bị tác động (chính)
  tangHan: string
  tacDong: string // khí tác động tạng phủ (đầy đủ)
  trieuChung: string
  triPhap: string
  phuongThuoc: string
  nodes: number[]
  rel: LucKhiRel
}

export const LUC_KHI: LucKhiInfo[] = [
  {
    key: 'Hàn', han: '寒', hanh: 'thuy', group: 'duong', deg: 0, mua: 'Đông',
    tinh: 'Âm tà · hại Dương khí · ngưng trệ (đau) · thu dẫn (co rút)',
    kinhVi: 'Thái Dương', kinhHan: '太陽', tangVi: 'Thận · Bàng Quang', tangHan: '腎 膀胱',
    tacDong: 'Thông ở Thận; ngoại hàn trước hết bó Phế–vệ / kinh Thái Dương (biểu); trúng hàn thì tổn Dương Tỳ Vị (nôn, tiêu chảy) và Thận dương.',
    trieuChung: 'Sợ lạnh, không mồ hôi, đau đầu mình, đau co rút, tay chân lạnh, tiêu lỏng, mạch phù khẩn (biểu) hay trầm trì (lý).',
    triPhap: 'Tân ôn giải biểu · Ôn trung / Hồi dương', phuongThuoc: 'Ma Hoàng Thang · Lý Trung Thang · Tứ Nghịch Thang',
    nodes: [4, 1, 3],
    rel: { from: 4, to: 1, type: 'khac', note: 'Thủy khắc Hỏa — hàn thủy thịnh lấn Tâm dương (thủy khí lăng Tâm).' },
  },
  {
    key: 'Táo', han: '燥', hanh: 'kim', group: 'duong', deg: 60, mua: 'Thu',
    tinh: 'Càn sáp · dễ thương tân dịch · dễ thương Phế (Phế ưa nhuận ghét táo)',
    kinhVi: 'Dương Minh', kinhHan: '陽明', tangVi: 'Phế', tangHan: '肺',
    tacDong: 'Thương Phế trước tiên, hun đốt tân dịch (bì phu, đại tràng). Phân Ôn táo (kèm nhiệt) và Lương táo (kèm hàn).',
    trieuChung: 'Mũi họng khô, ho khan ít đờm hoặc đờm dính khó khạc, da khô nứt môi, đại tiện táo, tiểu ít.',
    triPhap: 'Nhuận táo dưỡng Phế tân', phuongThuoc: 'Tang Hạnh Thang · Thanh Táo Cứu Phế Thang',
    nodes: [3, 4],
    rel: { from: 3, to: 4, type: 'sinh', note: 'Kim sinh Thủy — Phế táo tân khuy thì Thận âm mất nguồn (mẹ bệnh cập con).' },
  },
  {
    key: 'Thử', han: '暑', hanh: 'hoaT', group: 'duong', deg: 300, mua: 'Hạ (Tướng Hỏa)',
    tinh: 'Dương tà viêm nhiệt · thăng tán → hao khí thương tân · thường hiệp Thấp',
    kinhVi: 'Thiếu Dương', kinhHan: '少陽', tangVi: 'Tâm · Tỳ', tangHan: '心 脾',
    tacDong: 'Thông ở Tâm; thăng tán làm hao khí – hao tân (Phế Vị); hay hiệp thấp mà khốn Tỳ. Chỉ có ngoại thử (theo mùa Hạ).',
    trieuChung: 'Sốt cao, mồ hôi nhiều, khát, mệt rũ, tiểu vàng; kèm thấp thì ngực bĩ, buồn nôn, tiêu chảy; nặng trúng thử hôn quyết.',
    triPhap: 'Thanh thử ích khí sinh tân · Thanh thử hóa thấp', phuongThuoc: 'Thanh Thử Ích Khí Thang · Lục Nhất Tán',
    nodes: [1, 3, 2],
    rel: { from: 1, to: 3, type: 'khac', note: 'Hỏa khắc Kim — thử nhiệt hun đốt Phế khí, hao khí thương tân.' },
  },
  {
    key: 'Thấp', han: '濕', hanh: 'tho', group: 'am', deg: 240, mua: 'Trưởng Hạ',
    tinh: 'Âm tà · trọng trọc (nặng, đục) · niêm trệ (dính, dai) · xu hạ · trở khí cơ, hại Tỳ dương',
    kinhVi: 'Thái Âm', kinhHan: '太陰', tangVi: 'Tỳ', tangHan: '脾',
    tacDong: 'Trực tiếp khốn Tỳ (Tỳ ưa ráo ghét ẩm) → vận hóa đình; trọc âm dồn xuống Thận · Bàng Quang (đại tiện nhão, tiểu đục, đới hạ, phù).',
    trieuChung: 'Đầu nặng như bọc, mình nặng mỏi, ngực bụng bĩ đầy, ăn kém buồn nôn, đại tiện nhão, tiểu đục, phù, rêu lưỡi nhờn.',
    triPhap: 'Táo thấp kiện Tỳ · Lợi thủy thẩm thấp', phuongThuoc: 'Bình Vị Tán · Ngũ Linh Tán · Hoắc Hương Chính Khí Tán',
    nodes: [2, 4],
    rel: { from: 2, to: 4, type: 'khac', note: 'Thổ khắc Thủy — thấp thổ ủng trệ, trọc âm dồn xuống Thận · Bàng Quang.' },
  },
  {
    key: 'Nhiệt', han: '熱', hanh: 'hoaQ', group: 'am', deg: 180, mua: 'Hạ (Quân Hỏa)',
    tinh: 'Dương tà viêm thượng · hao khí thương tân · sinh phong động huyết · nhiễu tâm thần',
    kinhVi: 'Thiếu Âm', kinhHan: '少陰', tangVi: 'Tâm', tangHan: '心',
    tacDong: 'Thông ở Tâm (nhiễu thần); nhiệt cực động Can phong (co giật); bức huyết vọng hành → xuất huyết; hun tân dịch (Vị, Phế, Thận); sinh thũng dương.',
    trieuChung: 'Sốt cao, mặt mắt đỏ, khát, tâm phiền mất ngủ, mê sảng, co giật, chảy máu (cam / nôn / tiêu), mụn nhọt, lưỡi đỏ giáng.',
    triPhap: 'Thanh nhiệt tả hỏa · Lương huyết · Thanh tâm', phuongThuoc: 'Bạch Hổ Thang · Hoàng Liên Giải Độc Thang · Tê Giác Địa Hoàng Thang',
    nodes: [1, 3, 0],
    rel: { from: 1, to: 3, type: 'khac', note: 'Hỏa khắc Kim — nhiệt hình Phế; nhiệt cực còn động Can phong (Mộc).' },
  },
  {
    key: 'Phong', han: '風', hanh: 'moc', group: 'am', deg: 120, mua: 'Xuân',
    tinh: 'Dương tà · khai tiết (chủ biểu) · thiện hành sổ biến · chủ động (run co) · bách bệnh chi trưởng',
    kinhVi: 'Quyết Âm', kinhHan: '厥陰', tangVi: 'Can · Phế', tangHan: '肝 肺',
    tacDong: 'Thông ở Can (nội phong do Can vượng); ngoại phong trước hết phạm bì mao – Phế – vệ (ho, hắt hơi); "trưởng" của các tà, dẫn hàn/thấp/nhiệt cùng vào.',
    trieuChung: 'Sợ gió ra mồ hôi, phát sốt, ngạt/chảy mũi, ho, ngứa, mày đay chạy chỗ; nội phong: choáng váng, run giật, co quắp, méo miệng.',
    triPhap: 'Sơ phong giải biểu (ngoại) · Bình can tức phong (nội)', phuongThuoc: 'Quế Chi Thang · Ngân Kiều Tán · Thiên Ma Câu Đằng Ẩm',
    nodes: [0, 2, 3],
    rel: { from: 0, to: 2, type: 'khac', note: 'Mộc khắc Thổ — Can phong vượng thừa Tỳ thổ (Can Tỳ bất hòa).' },
  },
]

export const lucKhiByKey: Record<string, LucKhiInfo> = Object.fromEntries(
  LUC_KHI.map((k) => [k.key, k]),
)
