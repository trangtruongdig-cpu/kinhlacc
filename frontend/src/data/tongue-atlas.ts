// Atlas đặc điểm lưỡi — 20 class từ dataset TCM-Tongue (Dryad doi:10.5061/dryad.1c59zw48r)
// Mỗi entry: metadata Việt + tham số SVG + thể bệnh liên quan

export type AtlasCategory = 'chat-luoi' | 'hinh-dang' | 'reu-luoi' | 'vung'

export interface SvgParams {
  bodyColor: string        // màu nền chất lưỡi
  bodyScale?: number       // 1 = bình thường, >1 = phì đại, <1 = teo nhỏ
  coatingColor?: string    // màu rêu, undefined = không rêu
  coatingOpacity?: number  // 0-1
  coatingCoverage?: 'full' | 'root' | 'partial'  // phân bố rêu
  features?: AtlasFeature[]
}

export type AtlasFeature =
  | 'cracks'        // nứt nẻ
  | 'tooth-marks'   // răng cưa
  | 'red-dots'      // điểm đỏ/chấm hồng
  | 'peeling'       // bong tróc
  | 'greasy'        // nhờn bóng
  | 'zone-root'     // vùng chân nổi bật
  | 'zone-sides'    // vùng hai bên nổi bật
  | 'zone-center'   // vùng giữa nổi bật
  | 'zone-tip'      // vùng đầu nổi bật

export interface TongueAtlasEntry {
  id: string               // class name (pinyin, dùng làm folder ảnh)
  vi: string               // Tên Việt
  en: string               // English
  category: AtlasCategory
  description: string      // Mô tả hình ảnh
  clinical: string         // Ý nghĩa lâm sàng Đông Y
  patterns: string[]       // Thể bệnh liên quan (khớp với rule engine)
  svg: SvgParams
  images: string[]         // Đường dẫn ảnh thực (điền sau khi chạy script)
}

export const ATLAS: TongueAtlasEntry[] = [
  // ─────────────────────────────────────────────
  // CHẤT LƯỠI — màu sắc
  // ─────────────────────────────────────────────
  {
    id: 'jiankangshe',
    vi: 'Lưỡi Hồng Bình',
    en: 'Healthy Tongue',
    category: 'chat-luoi',
    description: 'Chất lưỡi hồng tươi, rêu trắng mỏng, không khô không ướt quá',
    clinical: 'Khí huyết điều hòa, tạng phủ bình thường, chính khí sung túc',
    patterns: [],
    svg: { bodyColor: '#e8908a', coatingColor: '#f5f0ea', coatingOpacity: 0.55, coatingCoverage: 'full' },
    images: [],
  },
  {
    id: 'hongshe',
    vi: 'Lưỡi Đỏ',
    en: 'Red Tongue',
    category: 'chat-luoi',
    description: 'Chất lưỡi đỏ hơn bình thường, đậm màu rõ rệt',
    clinical: 'Nhiệt chứng (thực nhiệt hoặc âm hư hỏa vượng). Nhiệt tà nhập lý, hao tổn tân dịch',
    patterns: ['nhiet', 'am_hu'],
    svg: { bodyColor: '#c03030', coatingColor: '#f0e080', coatingOpacity: 0.4, coatingCoverage: 'full' },
    images: [],
  },
  {
    id: 'zishe',
    vi: 'Lưỡi Tím / Xanh Tím',
    en: 'Purple Tongue',
    category: 'chat-luoi',
    description: 'Chất lưỡi tím hoặc xanh tím, có thể có điểm ứ huyết',
    clinical: 'Ứ huyết điển hình. Hàn ngưng huyết hoặc khí trệ huyết ứ. Bệnh nặng lâu ngày',
    patterns: ['u_huyet', 'han', 'can_uat'],
    svg: { bodyColor: '#7a4070', coatingColor: '#d8d0c8', coatingOpacity: 0.3, coatingCoverage: 'full' },
    images: [],
  },
  {
    id: 'nhashe',
    vi: 'Lưỡi Nhạt',
    en: 'Pale Tongue',
    category: 'chat-luoi',
    description: 'Chất lưỡi nhợt nhạt, ít đỏ, trắng bệch',
    clinical: 'Khí hư, Huyết hư, Dương hư. Hàn chứng. Khí huyết bất túc không nuôi dưỡng lưỡi',
    patterns: ['khi_hu', 'huyet_hu', 'duong_hu', 'han'],
    svg: { bodyColor: '#e8c8c4', coatingColor: '#f8f4f0', coatingOpacity: 0.5, coatingCoverage: 'full' },
    images: [],
  },
  {
    id: 'dosamshe',
    vi: 'Lưỡi Đỏ Sẫm',
    en: 'Crimson / Deep Red Tongue',
    category: 'chat-luoi',
    description: 'Chất lưỡi đỏ sẫm như máu đỏ tươi, sắc đậm hơn lưỡi đỏ',
    clinical: 'Nhiệt cực thịnh, nhiệt nhập dinh huyết. Âm hư trọng chứng. Ứ huyết kết hợp',
    patterns: ['nhiet', 'am_hu', 'u_huyet'],
    svg: { bodyColor: '#9a1818', coatingColor: '#f0e090', coatingOpacity: 0.35, coatingCoverage: 'partial' },
    images: [],
  },

  // ─────────────────────────────────────────────
  // HÌNH DẠNG
  // ─────────────────────────────────────────────
  {
    id: 'pangdashe',
    vi: 'Lưỡi Phì Đại',
    en: 'Swollen / Enlarged Tongue',
    category: 'hinh-dang',
    description: 'Lưỡi to bè, dày, chiếm đầy miệng, thường kèm dấu răng hai bên',
    clinical: 'Đàm thấp thịnh, Tỳ Vị hư hàn. Dương hư thủy thấp không được khí hóa',
    patterns: ['dam_thap', 'khi_hu', 'duong_hu'],
    svg: { bodyColor: '#e8a0a0', bodyScale: 1.18, coatingColor: '#f5f0ea', coatingOpacity: 0.6, coatingCoverage: 'full', features: ['tooth-marks'] },
    images: [],
  },
  {
    id: 'shoushe',
    vi: 'Lưỡi Teo Nhỏ',
    en: 'Thin / Contracted Tongue',
    category: 'hinh-dang',
    description: 'Lưỡi thon, nhỏ, mỏng so với bình thường',
    clinical: 'Âm hư nặng, Khí huyết đại hư. Tân dịch kiệt, cơ nhục không được nuôi dưỡng',
    patterns: ['am_hu', 'huyet_hu'],
    svg: { bodyColor: '#d09090', bodyScale: 0.82, coatingColor: '#f0ece4', coatingOpacity: 0.2 },
    images: [],
  },
  {
    id: 'hongdianshe',
    vi: 'Lưỡi Điểm Đỏ / Chấm Hồng',
    en: 'Red Dots Tongue',
    category: 'hinh-dang',
    description: 'Trên mặt lưỡi có nhiều chấm đỏ hoặc điểm gai nổi đỏ',
    clinical: 'Nhiệt nhập dinh huyết, nhiệt độc tương tranh. Ứ huyết cục bộ. Tâm Can nhiệt thịnh',
    patterns: ['nhiet', 'u_huyet'],
    svg: { bodyColor: '#d04040', features: ['red-dots'] },
    images: [],
  },
  {
    id: 'liewenshe',
    vi: 'Lưỡi Nứt Nẻ',
    en: 'Cracked Tongue',
    category: 'hinh-dang',
    description: 'Trên mặt lưỡi có nhiều vết nứt, rãnh nông hoặc sâu, dọc hoặc ngang',
    clinical: 'Âm hư tân dịch hao tổn. Nhiệt hao tổn tân. Huyết hư không nuôi dưỡng',
    patterns: ['am_hu', 'nhiet'],
    svg: { bodyColor: '#cc3838', features: ['cracks'] },
    images: [],
  },
  {
    id: 'chihenshe',
    vi: 'Lưỡi Răng Cưa',
    en: 'Tooth-Marked Tongue',
    category: 'hinh-dang',
    description: 'Rìa lưỡi có dấu ấn của răng, rìa lượn sóng kiểu răng cưa',
    clinical: 'Tỳ khí hư — lưỡi thiếu trương lực, dựa vào răng. Thấp thịnh. Thường kèm phì đại',
    patterns: ['khi_hu', 'dam_thap'],
    svg: { bodyColor: '#e8a8a0', bodyScale: 1.1, features: ['tooth-marks'] },
    images: [],
  },

  // ─────────────────────────────────────────────
  // RÊU LƯỠI
  // ─────────────────────────────────────────────
  {
    id: 'baitaishe',
    vi: 'Rêu Trắng',
    en: 'White Coating',
    category: 'reu-luoi',
    description: 'Rêu lưỡi màu trắng, có thể mỏng (trắng mỏng) hoặc dày (trắng dày)',
    clinical: 'Trắng mỏng: Ngoại cảm phong hàn hoặc bình thường. Trắng dày: Hàn thấp nội thịnh, hàn tà nhập lý',
    patterns: ['han', 'duong_hu'],
    svg: { bodyColor: '#e8908a', coatingColor: '#f8f5f0', coatingOpacity: 0.85, coatingCoverage: 'full' },
    images: [],
  },
  {
    id: 'huangtaishe',
    vi: 'Rêu Vàng',
    en: 'Yellow Coating',
    category: 'reu-luoi',
    description: 'Rêu lưỡi màu vàng từ nhạt đến đậm, có thể vàng nhờn',
    clinical: 'Nhiệt chứng. Vàng nhạt: nhiệt nhẹ. Vàng đậm: nhiệt thịnh. Vàng nhờn dày: Thấp nhiệt kết',
    patterns: ['nhiet', 'thap_nhiet'],
    svg: { bodyColor: '#c83030', coatingColor: '#d4a030', coatingOpacity: 0.8, coatingCoverage: 'full' },
    images: [],
  },
  {
    id: 'heitaishe',
    vi: 'Rêu Đen',
    en: 'Black Coating',
    category: 'reu-luoi',
    description: 'Rêu lưỡi màu xám đến đen, thường dày và nhờn hoặc gai đen khô',
    clinical: 'Bệnh nặng hoặc mãn tính. Đen khô: Nhiệt cực hao tổn tân. Đen nhờn: Hàn cực thấp thịnh',
    patterns: ['nhiet', 'han'],
    svg: { bodyColor: '#b02020', coatingColor: '#303030', coatingOpacity: 0.75, coatingCoverage: 'full', features: ['greasy'] },
    images: [],
  },
  {
    id: 'huataishe',
    vi: 'Rêu Trơn / Nhờn',
    en: 'Smooth / Greasy Coating',
    category: 'reu-luoi',
    description: 'Rêu dày, bóng nhờn, khó cạo, cảm giác ẩm ướt trơn',
    clinical: 'Đàm thấp điển hình. Thấp nhiệt nung nấu. Trung tiêu đàm ẩm tích trệ',
    patterns: ['dam_thap', 'thap_nhiet'],
    svg: { bodyColor: '#e09090', coatingColor: '#d8d0b8', coatingOpacity: 0.7, coatingCoverage: 'full', features: ['greasy'] },
    images: [],
  },
  {
    id: 'botaishe',
    vi: 'Rêu Bong Tróc',
    en: 'Peeling / Exfoliated Coating',
    category: 'reu-luoi',
    description: 'Rêu lưỡi bong từng mảng, có vùng không rêu, trông như bản đồ (map tongue)',
    clinical: 'Âm hư, Vị âm hư. Khí huyết bất túc. Bệnh lâu ngày hao tổn chính khí',
    patterns: ['am_hu', 'huyet_hu'],
    svg: { bodyColor: '#d05050', features: ['peeling'] },
    images: [],
  },
  {
    id: 'khongreuhe',
    vi: 'Không Rêu / Lưỡi Gương',
    en: 'Peeled / Mirror Tongue',
    category: 'reu-luoi',
    description: 'Hoàn toàn không có rêu, bề mặt lưỡi trơn bóng như gương',
    clinical: 'Âm hư cực trọng, Vị khí suy kiệt. Tân dịch đã cạn. Tiên lượng xấu trong bệnh nặng',
    patterns: ['am_hu'],
    svg: { bodyColor: '#c84040' },
    images: [],
  },

  // ─────────────────────────────────────────────
  // VÙNG LƯỠI đặc trưng (zone-specific)
  // ─────────────────────────────────────────────
  {
    id: 'shenquao',
    vi: 'Vùng Thận Lõm',
    en: 'Renal Zone Depression',
    category: 'vung',
    description: 'Chân lưỡi (vùng Thận) có rãnh lõm, chỉ nứt hoặc thiếu rêu',
    clinical: 'Thận hư (Thận âm hư hoặc Thận dương hư). Tinh khí Thận suy giảm',
    patterns: ['duong_hu', 'am_hu'],
    svg: { bodyColor: '#e09090', features: ['zone-root', 'cracks'] },
    images: [],
  },
  {
    id: 'shenqutu',
    vi: 'Vùng Thận Lồi',
    en: 'Renal Zone Protrusion',
    category: 'vung',
    description: 'Chân lưỡi (vùng Thận) có phần lồi ra hoặc rêu dày hơn hẳn',
    clinical: 'Thận hư thấp thịnh, Thủy thấp tràn lan vùng hạ tiêu',
    patterns: ['duong_hu', 'dam_thap'],
    svg: { bodyColor: '#e09090', coatingColor: '#f0f0e8', coatingOpacity: 0.9, coatingCoverage: 'root', features: ['zone-root'] },
    images: [],
  },
  {
    id: 'gandanao',
    vi: 'Vùng Can Đởm Lõm',
    en: 'Hepatobiliary Zone Depression',
    category: 'vung',
    description: 'Hai bên lưỡi (vùng Can Đởm) có rãnh, lõm hoặc thiếu rêu',
    clinical: 'Can âm hư, Can khí hư. Đởm khí bất túc',
    patterns: ['can_uat', 'am_hu'],
    svg: { bodyColor: '#c87070', features: ['zone-sides'] },
    images: [],
  },
  {
    id: 'gandantu',
    vi: 'Vùng Can Đởm Lồi',
    en: 'Hepatobiliary Zone Protrusion',
    category: 'vung',
    description: 'Hai bên lưỡi (vùng Can Đởm) lồi hoặc đỏ hơn, rêu dày hơn',
    clinical: 'Can uất hóa hỏa, Can Đởm thấp nhiệt. Khí uất lâu ngày',
    patterns: ['can_uat', 'thap_nhiet'],
    svg: { bodyColor: '#c06060', coatingColor: '#d4a030', coatingOpacity: 0.7, coatingCoverage: 'partial', features: ['zone-sides'] },
    images: [],
  },
  {
    id: 'piweiao',
    vi: 'Vùng Tỳ Vị Lõm',
    en: 'Spleen-Stomach Zone Depression',
    category: 'vung',
    description: 'Giữa lưỡi (vùng Tỳ Vị) có rãnh dọc sâu hoặc thiếu rêu',
    clinical: 'Tỳ Vị khí hư, Vị âm hư. Rãnh dọc giữa là dấu hiệu Tỳ Vị suy yếu',
    patterns: ['khi_hu', 'am_hu'],
    svg: { bodyColor: '#d08080', features: ['zone-center', 'cracks'] },
    images: [],
  },
  {
    id: 'xinfeiao',
    vi: 'Vùng Tâm Phế Lõm',
    en: 'Heart-Lung Zone Depression',
    category: 'vung',
    description: 'Đầu lưỡi (vùng Tâm Phế) có rãnh, lõm hoặc thiếu gai lưỡi',
    clinical: 'Tâm Phế khí hư hoặc âm hư. Phế âm hư gây ho khan, Tâm hư gây hồi hộp',
    patterns: ['khi_hu', 'am_hu'],
    svg: { bodyColor: '#d07070', features: ['zone-tip'] },
    images: [],
  },
  {
    id: 'xinfeitu',
    vi: 'Vùng Tâm Phế Lồi / Đỏ',
    en: 'Heart-Lung Zone Protrusion / Redness',
    category: 'vung',
    description: 'Đầu lưỡi (vùng Tâm Phế) đỏ rõ hơn phần còn lại hoặc có gai đỏ',
    clinical: 'Tâm hỏa thịnh, Phế nhiệt. Mất ngủ, lo lắng, nhiệt độ cao',
    patterns: ['nhiet'],
    svg: { bodyColor: '#d08080', features: ['red-dots', 'zone-tip'] },
    images: [],
  },
]

// Nhóm theo category
export function groupByCategory(atlas: TongueAtlasEntry[]) {
  return {
    'chat-luoi': atlas.filter(e => e.category === 'chat-luoi'),
    'hinh-dang': atlas.filter(e => e.category === 'hinh-dang'),
    'reu-luoi':  atlas.filter(e => e.category === 'reu-luoi'),
    'vung':      atlas.filter(e => e.category === 'vung'),
  }
}

export const CATEGORY_LABELS: Record<AtlasCategory, string> = {
  'chat-luoi': 'Chất Lưỡi',
  'hinh-dang': 'Hình Dạng',
  'reu-luoi':  'Rêu Lưỡi',
  'vung':      'Vùng Đặc Trưng',
}
