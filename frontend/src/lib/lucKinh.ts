/**
 * lucKinh.ts — Định vị ca bệnh theo LỤC KINH (Thương Hàn Luận), TÁI DÙNG kết quả engine
 * `suyBenhCoAll` đã có (backend/src/data/thuong-han-suy.ts) qua bảng thể → kinh đã được lương y
 * duyệt + workflow thẩm định (2026-07-31).
 *
 * Hai việc:
 *  1) locateLucKinh(thể đo được + Bát Cương) → KẾT LUẬN 1 ca: kinh trội + giai đoạn + độ tin + lý do.
 *  2) (dùng cho truyền biến) mỗi lần đo → 1 kinh trội; xâu chuỗi theo thời gian ở nơi gọi.
 *
 * Nguồn spec 6 kinh: đề cương THL + chữ ký Bát Cương + mẫu kết luận do 6 tác nhân chuyên gia soạn
 * và 1 tác nhân phản biện thẩm định (workflow luc-kinh-spec). organKinh (tạng phủ↔kinh) khớp 100%
 * với bộ chuẩn backend.
 */

export type KinhSlug = 'thai-duong' | 'duong-minh' | 'thieu-duong' | 'thai-am' | 'thieu-am' | 'quyet-am'
export type Muc = 'A' | 'B' // A = chắc Thương Hàn · B = đúng vị trí kinh nhưng thiên nội thương (cần soi)

export interface KinhMeta {
  slug: KinhSlug
  ten: string
  han: string
  tangPhu: string
  khi: string
  viTri: string
  /** Thứ tự truyền kinh (1 nông → 6 sâu): Thái Dương→Dương Minh→Thiếu Dương→Thái Âm→Thiếu Âm→Quyết Âm. */
  thuTu: number
  /** Tầng biểu→lý (1 biểu nông … 6 lý sâu nhất) — để suy HƯỚNG truyền biến. */
  tang: number
  /** Chữ ký Bát Cương kỳ vọng (để đối chiếu số đo). */
  chuKy: Partial<Record<'bieu' | 'ly' | 'han' | 'nhiet' | 'hu' | 'thuc', 1>>
  deCuong: string
  /** Mẫu câu kết luận, {the} = giai đoạn/thể, {tinhChat} = Bát Cương của ca. */
  ketLuan: string
}

export const KINH_META: Record<KinhSlug, KinhMeta> = {
  'thai-duong': {
    slug: 'thai-duong', ten: 'Thái Dương', han: '太陽', tangPhu: 'Bàng Quang / Tiểu Trường', khi: 'Hàn Thủy', viTri: 'Biểu',
    thuTu: 1, tang: 1, chuKy: { bieu: 1, han: 1 },
    deCuong: 'Mạch phù, đầu gáy cứng đau, sợ lạnh (太陽之為病，脈浮，頭項強痛而惡寒 — điều 1).',
    ketLuan: 'Định vị kinh Thái Dương (Bàng Quang / Tiểu Trường) — {the}, tính chất {tinhChat}. Pháp trị: giải biểu tán hàn, điều hòa doanh vệ.',
  },
  'duong-minh': {
    slug: 'duong-minh', ten: 'Dương Minh', han: '陽明', tangPhu: 'Vị / Đại Trường', khi: 'Táo Kim', viTri: 'Lý thực nhiệt',
    thuTu: 2, tang: 2, chuKy: { ly: 1, nhiet: 1, thuc: 1 },
    deCuong: 'Vị gia thực (陽明之為病，胃家實是也 — điều 180): tà nhiệt kết ở Vị / Đại Trường, dương nhiệt cực thịnh.',
    ketLuan: 'Định vị kinh Dương Minh (Vị / Đại Trường) — {the}, tính chất {tinhChat}. Pháp trị: thanh nhiệt tả hạ (kinh chứng thanh khí sinh tân, phủ chứng thông phủ).',
  },
  'thieu-duong': {
    slug: 'thieu-duong', ten: 'Thiếu Dương', han: '少陽', tangPhu: 'Đởm / Tam Tiêu', khi: 'Tướng Hỏa', viTri: 'Bán biểu bán lý',
    thuTu: 3, tang: 3, chuKy: { nhiet: 1 },
    deCuong: 'Miệng đắng, họng khô, hoa mắt (少陽之為病，口苦、咽乾、目眩也): tà uất bán biểu bán lý.',
    ketLuan: 'Định vị kinh Thiếu Dương (Đởm / Tam Tiêu) — {the}, tính chất {tinhChat}. Bán biểu bán lý; pháp trị hòa giải Thiếu Dương.',
  },
  'thai-am': {
    slug: 'thai-am', ten: 'Thái Âm', han: '太陰', tangPhu: 'Tỳ / Phế', khi: 'Thấp Thổ', viTri: 'Lý hư hàn',
    thuTu: 4, tang: 4, chuKy: { ly: 1, han: 1, hu: 1 },
    deCuong: 'Bụng đầy nôn, ăn không xuống, tự lợi (太陰之為病，腹滿而吐…自利益甚 — điều 273): Tỳ dương hư, hàn thấp nội thịnh.',
    ketLuan: 'Định vị kinh Thái Âm (Tỳ / Phế) — {the}, tính chất {tinhChat}. Pháp trị: ôn trung kiện Tỳ, tán hàn táo thấp.',
  },
  'thieu-am': {
    slug: 'thieu-am', ten: 'Thiếu Âm', han: '少陰', tangPhu: 'Thận / Tâm', khi: 'Quân Hỏa', viTri: 'Lý hư (hàn/nhiệt hóa)',
    thuTu: 5, tang: 5, chuKy: { ly: 1, hu: 1 },
    deCuong: 'Mạch vi tế, chỉ muốn nằm (少陰之為病，脈微細，但欲寐也): tâm-thận suy, lý hư toàn thân.',
    ketLuan: 'Định vị kinh Thiếu Âm (gốc Tâm – Thận) — {the}, tính chất {tinhChat}. Pháp trị phù chính: hồi dương cứu nghịch (hàn hóa) hoặc tư âm thanh nhiệt (nhiệt hóa).',
  },
  'quyet-am': {
    slug: 'quyet-am', ten: 'Quyết Âm', han: '厥陰', tangPhu: 'Can / Tâm Bào', khi: 'Phong Mộc', viTri: 'Hàn nhiệt thác tạp',
    thuTu: 6, tang: 6, chuKy: {},
    deCuong: 'Tiêu khát, khí xông lên tim, đói mà không muốn ăn (厥陰之為病…): thượng nhiệt hạ hàn, hàn nhiệt thác tạp.',
    ketLuan: 'Định vị kinh Quyết Âm (Can / Tâm Bào) — {the}, tính chất {tinhChat}. Hàn nhiệt thác tạp; pháp trị điều hòa hàn nhiệt.',
  },
}

export const KINH_ORDER: KinhSlug[] = ['thai-duong', 'duong-minh', 'thieu-duong', 'thai-am', 'thieu-am', 'quyet-am']

/** Hướng truyền biến giữa 2 lần đo — so tầng biểu→lý (tang). Sâu hơn = truyền vào lý (nặng lên),
 * nông hơn = lui ra biểu (đang hồi phục). Dùng cho timeline lịch sử đo cùng đợt bệnh. */
export function huongTruyen(prev: KinhSlug, cur: KinhSlug): { nhan: string; loai: 'vao-ly' | 'ra-bieu' | 'giu' } {
  const dp = KINH_META[prev].tang, dc = KINH_META[cur].tang
  if (dc > dp) return { nhan: `truyền vào lý (${KINH_META[prev].ten} → ${KINH_META[cur].ten})`, loai: 'vao-ly' }
  if (dc < dp) return { nhan: `lui ra biểu (${KINH_META[prev].ten} → ${KINH_META[cur].ten})`, loai: 'ra-bieu' }
  return { nhan: `giữ kinh ${KINH_META[cur].ten}`, loai: 'giu' }
}

/** Thể (theo tên) → kinh + mức (đã lương y duyệt + workflow thẩm định). `phu` = kinh phụ (lưỡng hư
 * bắc cầu 2 kinh — vá đúng lỗ hổng engine chỉ mang 1 kinh). Thể KHÔNG có ở đây = ngoài Thương Hàn. */
interface TheEntry { kinh: KinhSlug; muc: Muc; phu?: KinhSlug }
const RAW_THE: Array<[string, TheEntry]> = [
  // Thái Dương
  ['Phế hàn khái suyễn', { kinh: 'thai-duong', muc: 'A' }],
  ['Phế nhiệt khái suyễn', { kinh: 'thai-duong', muc: 'A' }],
  ['Chứng cảm sốt', { kinh: 'thai-duong', muc: 'A' }],
  ['Tâm hoả thượng viêm', { kinh: 'thai-duong', muc: 'B' }],
  ['Tâm di nhiệt sang tiểu trường', { kinh: 'thai-duong', muc: 'B' }],
  ['Tiểu trường khí thống', { kinh: 'thai-duong', muc: 'B' }],
  ['Bàng quang thấp nhiệt', { kinh: 'thai-duong', muc: 'B' }],
  // Dương Minh
  ['Vị hoả thịnh', { kinh: 'duong-minh', muc: 'A' }],
  ['Vị âm hư', { kinh: 'duong-minh', muc: 'B' }],
  ['Can vị bất hoà', { kinh: 'duong-minh', muc: 'B', phu: 'thieu-duong' }],
  ['Đại Trường Thấp Nhiệt', { kinh: 'duong-minh', muc: 'B' }],
  // Thiếu Dương
  ['Can Đởm Hỏa Vượng, Thấp Nhiệt', { kinh: 'thieu-duong', muc: 'A' }],
  ['Can khí uất kết', { kinh: 'thieu-duong', muc: 'B' }],
  // Thái Âm
  ['Tỳ dương hư', { kinh: 'thai-am', muc: 'A' }],
  ['Tỳ vị khí hư', { kinh: 'thai-am', muc: 'A' }],
  ['Tỳ vị thấp khốn', { kinh: 'thai-am', muc: 'A' }],
  ['Đàm trọc trở phế', { kinh: 'thai-am', muc: 'B' }],
  ['Phế khí hư', { kinh: 'thai-am', muc: 'B' }],
  ['Phế âm hư', { kinh: 'thai-am', muc: 'B' }],
  ['Phế tỳ lưỡng hư', { kinh: 'thai-am', muc: 'B' }],
  ['Phế thận lưỡng hư', { kinh: 'thai-am', muc: 'B', phu: 'thieu-am' }],
  // Thiếu Âm
  ['Thận dương hư', { kinh: 'thieu-am', muc: 'A' }],
  ['Tâm Thận Bất Giao', { kinh: 'thieu-am', muc: 'A' }],
  ['Thận âm hư', { kinh: 'thieu-am', muc: 'A' }],
  ['Thận âm dương lưỡng hư', { kinh: 'thieu-am', muc: 'B' }],
  ['Tâm Khí Hư', { kinh: 'thieu-am', muc: 'B' }],
  ['Tâm Dương Hư Suy', { kinh: 'thieu-am', muc: 'B' }],
  ['Tâm huyết hư', { kinh: 'thieu-am', muc: 'B' }],
  ['Tâm huyết ứ trệ', { kinh: 'thieu-am', muc: 'B' }],
  ['Đàm Mê Tâm Khiếu', { kinh: 'thieu-am', muc: 'B' }],
  ['Tâm Dương Hư', { kinh: 'thieu-am', muc: 'B' }],
  ['Tâm âm hư', { kinh: 'thieu-am', muc: 'B' }],
  ['Tâm dương bất túc - Tâm khí hư', { kinh: 'thieu-am', muc: 'B' }],
  ['Tâm âm bất túc - Tâm huyết hư', { kinh: 'thieu-am', muc: 'B' }],
  ['Tâm tỳ lưỡng hư', { kinh: 'thieu-am', muc: 'B', phu: 'thai-am' }],
  ['Tỳ thận dương hư', { kinh: 'thieu-am', muc: 'B', phu: 'thai-am' }],
  ['Thận Hư Hỏa Vượng', { kinh: 'thieu-am', muc: 'B' }],
  // Quyết Âm
  ['Can dương thượng cang', { kinh: 'quyet-am', muc: 'B' }],
  ['Can âm bất túc', { kinh: 'quyet-am', muc: 'B' }],
  ['Can Kinh Huyết Ứ', { kinh: 'quyet-am', muc: 'B' }],
]

/** Bỏ dấu + đ→d + gọn khoảng trắng — khớp tên thể bất kể hoa/thường/dấu. */
export function normThe(s: string | null | undefined): string {
  return (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}
const THE_MAP = new Map<string, TheEntry>(RAW_THE.map(([name, e]) => [normThe(name), e]))

export function lucKinhCuaThe(name: string): TheEntry | null {
  return THE_MAP.get(normThe(name)) ?? null
}

/** Bản đồ thể → kinh do ENGINE suy (từ /thuong-han/the-kinh) — 1 NGUỒN SỰ THẬT. Khoá = normThe(tên thể). */
export type TheKinhMap = Record<string, { kinh: string; kinh_phu?: string | null; do_tin?: string }>
/**
 * Tra kinh của 1 thể — ENGINE là NGUỒN CHÍNH: nếu bản đồ engine có thể này thì lấy theo engine
 * (kinh + kinh phụ + độ tin đã gạn nội thương). Engine chỉ phủ ~21/51 thể (khớp theo tên pháp trị),
 * nên thể engine CHƯA phủ thì rơi về bảng tĩnh để KHÔNG mất độ phủ (kết luận không hụt thể).
 */
function resolveThe(name: string, engineMap?: TheKinhMap | null): TheEntry | null {
  const key = normThe(name)
  const e = engineMap?.[key]
  if (e) return { kinh: e.kinh as KinhSlug, muc: e.do_tin === 'thap' ? 'B' : 'A', phu: (e.kinh_phu as KinhSlug) || undefined }
  return THE_MAP.get(key) ?? null
}

/** Tách chữ ký Bát Cương từ chuỗi hội chứng (vd "Lý Thực Hàn" → {ly,thuc,han}). */
function parseChuKy(hoiChung: string | null | undefined): Set<string> {
  const t = normThe(hoiChung)
  const out = new Set<string>()
  if (/\bbieu\b/.test(t)) out.add('bieu')
  if (/\bly\b|\bnoi\b/.test(t)) out.add('ly')
  if (/han|lanh/.test(t)) out.add('han')
  if (/nhiet|nong|hoa/.test(t)) out.add('nhiet')
  if (/\bhu\b/.test(t)) out.add('hu')
  if (/\bthuc\b/.test(t)) out.add('thuc')
  return out
}

export interface LucKinhVerdict {
  kinh: KinhMeta
  phu: KinhMeta | null // kinh phụ (hợp bệnh / lưỡng hư bắc cầu)
  hopBenh: boolean
  giaiDoan: string // nhãn giai đoạn/thể suy được (vd "hàn hóa", "kinh chứng"…)
  tinhChat: string // Bát Cương của ca (hội chứng)
  doTin: 'cao' | 'vua' | 'thap'
  ketLuan: string // câu kết luận đã điền
  lyDo: string[]
  batCuongKhop: boolean // chữ ký kinh có khớp Bát Cương đo được không
  theThuongHan: { ten: string; kinh: KinhSlug; muc: Muc }[]
  theNgoai: string[] // thể đo được nhưng ngoài Thương Hàn (không phân tích sâu)
}

/**
 * Kết luận Lục Kinh cho MỘT ca: dồn phiếu các thể đo được (A nặng, B nhẹ, kinh phụ ½), lấy kinh
 * trội; đối chiếu chữ ký Bát Cương để chỉnh độ tin; suy nhánh giai đoạn theo hàn/nhiệt.
 * Trả null nếu không thể đo được nào thuộc Thương Hàn (→ ngoài phạm vi, không ép).
 */
export function locateLucKinh(
  theNames: string[],
  tongCuong?: { hoiChung?: string | null; amDuong?: string | null } | null,
  engineMap?: TheKinhMap | null,
): LucKinhVerdict | null {
  const vote: Record<KinhSlug, number> = {
    'thai-duong': 0, 'duong-minh': 0, 'thieu-duong': 0, 'thai-am': 0, 'thieu-am': 0, 'quyet-am': 0,
  }
  const theThuongHan: LucKinhVerdict['theThuongHan'] = []
  const theNgoai: string[] = []
  let coA = false

  for (const name of theNames) {
    const e = resolveThe(name, engineMap)
    if (!e) { theNgoai.push(name); continue }
    const w = e.muc === 'A' ? 2 : 1
    vote[e.kinh] += w
    if (e.phu) vote[e.phu] += w * 0.5
    if (e.muc === 'A') coA = true
    theThuongHan.push({ ten: name, kinh: e.kinh, muc: e.muc })
  }

  if (!theThuongHan.length) return null

  const ranked = (Object.keys(vote) as KinhSlug[])
    .map((k) => [k, vote[k]] as [KinhSlug, number])
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
  const [topSlug, topVal] = ranked[0]!
  const secondary = ranked[1] && ranked[1][1] >= topVal * 0.6 ? ranked[1][0] : null
  const kinh = KINH_META[topSlug]
  const phu = secondary ? KINH_META[secondary] : null

  // Đối chiếu chữ ký Bát Cương
  const chuKy = parseChuKy(tongCuong?.hoiChung)
  const expect = Object.keys(kinh.chuKy)
  const batCuongKhop = expect.length > 0 && expect.every((k) => chuKy.has(k))

  // Suy nhánh giai đoạn (nhẹ) theo hàn/nhiệt của ca
  const coNhiet = chuKy.has('nhiet'), coHan = chuKy.has('han')
  let giaiDoan = `${kinh.ten} chứng`
  if (topSlug === 'thieu-am') giaiDoan = coNhiet && !coHan ? 'Thiếu Âm nhiệt hóa' : 'Thiếu Âm hàn hóa'
  else if (topSlug === 'duong-minh') giaiDoan = chuKy.has('thuc') ? 'Dương Minh kinh/phủ chứng' : 'Dương Minh nhiệt'
  else if (topSlug === 'thai-duong') giaiDoan = 'Thái Dương biểu chứng'
  else if (topSlug === 'thai-am') giaiDoan = 'Thái Âm hư hàn chứng'

  // Độ tin
  let doTin: 'cao' | 'vua' | 'thap' = 'thap'
  if (coA && batCuongKhop) doTin = 'cao'
  else if (coA || batCuongKhop || topVal >= 3) doTin = 'vua'

  const tinhChat = tongCuong?.hoiChung || tongCuong?.amDuong || '—'
  const ketLuan = kinh.ketLuan.replace('{the}', giaiDoan).replace('{tinhChat}', tinhChat)

  const lyDo: string[] = []
  const nA = theThuongHan.filter((t) => t.kinh === topSlug && t.muc === 'A').map((t) => t.ten)
  const nB = theThuongHan.filter((t) => t.kinh === topSlug && t.muc === 'B').map((t) => t.ten)
  if (nA.length) lyDo.push(`Thể chắc Thương Hàn ở kinh này: ${nA.join(', ')}.`)
  if (nB.length) lyDo.push(`Thể hướng ${kinh.ten} (thiên nội thương, cần soi): ${nB.join(', ')}.`)
  lyDo.push(batCuongKhop
    ? `Bát Cương đo được (${tinhChat}) KHỚP chữ ký ${kinh.ten} (${kinh.viTri}).`
    : `Bát Cương đo được (${tinhChat}) chưa khớp trọn chữ ký ${kinh.ten} — cần đối chiếu triệu chứng.`)
  if (phu) lyDo.push(`Có bắc cầu / hợp bệnh với kinh ${phu.ten}.`)

  return {
    kinh, phu, hopBenh: !!phu, giaiDoan, tinhChat, doTin, ketLuan, lyDo,
    batCuongKhop, theThuongHan, theNgoai,
  }
}
