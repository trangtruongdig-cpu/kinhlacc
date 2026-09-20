// ═══════════════════════════════════════════════════════════════════════════
// NGŨ HÀNH HỒI TÁC — TẦNG LUẬN NỀN (không phụ thuộc phiếu đo)
//
// Đây là tầng A của bộ NHHT: dựng đủ bộ máy luận rồi mới cho ca bệnh gọi vào (tầng B).
// Ba thứ tầng này trả lời, mà bảng khung trần ở khungNHHT.ts không trả lời được:
//   ① SÁU quan hệ ngũ hành — không chỉ sinh/khắc, mà cả tương thừa, tương vũ,
//      mẫu bệnh cập tử, tử đạo mẫu khí (bốn quan hệ BỆNH LÝ).
//   ② Các PHÁP TRỊ ngũ hành cổ điển, mỗi pháp có điều kiện áp dụng rõ ràng.
//   ③ PHƯƠNG CHÂM: gộp ① + ② + hai trục phương huyệt (Ngũ Du theo HÀNH, Nguyên–Lạc theo
//      cặp BIỂU–LÝ) thành một khối chỉ đạo trị, kèm KIỂM MÂU THUẪN và cảnh báo an toàn.
//
// GIỚI HẠN PHẢI NHỚ (bất biến affine): z của mỗi hành là số TƯƠNG ĐỐI trong nội bộ một
// phiếu đo — nhân/cộng cả 24 số thì z không đổi. Nên "Mộc thực" có thể chỉ là "Mộc đỡ hư
// nhất" ở người suy kiệt. Vì vậy mọi mệnh lệnh TẢ đều phải đi qua `chinhKhi`: chính khí
// khuyết thì hạ tả xuống "không bổ", không được tả người đã hư.
// ═══════════════════════════════════════════════════════════════════════════

import {
  type HanhId, HANH_TEN, KINH, KINH_THEO_HANH, hanhCuaKinh, motherOf, sonOf, controllerOf, huyetTheoHanh,
} from './nguDuHuyet'
import {
  type KhungLoai, type KhungInfo, KHUNG_TEN, KHUNG_MOTA, khungForOrgan, autoKhung,
  phuongHuyetNHHT, phuongHuyetBoMauTaCon,
  type PhuongHuyetNHHT, type PhuongHuyetBoMauTaCon,
} from './khungNHHT'
import { phoiNguyenLac, type PhoiNguyenLac } from './nguyenLac'

// ───────────────────────────────────────────────────────────────────────────
// ① SÁU QUAN HỆ NGŨ HÀNH
// ───────────────────────────────────────────────────────────────────────────

/** Hai quan hệ SINH LÝ (lúc nào cũng có) + bốn quan hệ BỆNH LÝ (chỉ có khi lệch). */
export type QuanHeLoai = 'sinh' | 'khac' | 'thua' | 'vu' | 'mau-cap-tu' | 'tu-dao-mau'

export const QUAN_HE_TEN: Record<QuanHeLoai, { ten: string; han: string; benhLy: boolean; mota: string }> = {
  sinh: { ten: 'Tương sinh', han: '相生', benhLy: false, mota: 'hành mẹ nuôi hành con — vòng nuôi dưỡng' },
  khac: { ten: 'Tương khắc', han: '相克', benhLy: false, mota: 'hành này kìm hành kia — vòng chế ước, giữ cho không thái quá' },
  thua: { ten: 'Tương thừa', han: '相乘', benhLy: true, mota: 'kẻ khắc THỪA THẾ đè nén quá tay: hoặc nó quá mạnh, hoặc kẻ bị khắc quá yếu' },
  vu: { ten: 'Tương vũ', han: '相侮', benhLy: true, mota: 'kẻ bị khắc mạnh lên, QUAY LẠI lấn kẻ khắc mình (phản khắc)' },
  'mau-cap-tu': { ten: 'Mẫu bệnh cập tử', han: '母病及子', benhLy: true, mota: 'mẹ suy không nuôi nổi con — con hư theo mẹ' },
  'tu-dao-mau': { ten: 'Tử đạo mẫu khí', han: '子盜母氣', benhLy: true, mota: 'con hao tổn rút ngược khí của mẹ — mẹ hư theo con' },
}

/** Quan hệ SINH LÝ tĩnh giữa hai hành (không cần số đo). null nếu là chính nó. */
export function quanHeTinh(a: HanhId, b: HanhId): { loai: 'sinh' | 'khac'; chieu: 'thuan' | 'nghich' } | null {
  if (a === b) return null
  if (sonOf(a) === b) return { loai: 'sinh', chieu: 'thuan' } // a sinh b
  if (motherOf(a) === b) return { loai: 'sinh', chieu: 'nghich' } // b sinh a
  if (controllerOf(b) === a) return { loai: 'khac', chieu: 'thuan' } // a khắc b
  return { loai: 'khac', chieu: 'nghich' } // b khắc a
}

/**
 * Ngưỡng phát hiện quan hệ bệnh lý.
 * NGUỒN KHÁC NHAU, đừng trộn khi chỉnh:
 *  • thua/vu: lấy NGUYÊN từ VongNguHanh.vue (mô hình + hằng số đã qua workflow thẩm định) —
 *    sửa ở đây mà không sửa ở đó thì đồ hình và phương châm sẽ nói hai đằng.
 *  • mauCapTu/tuDaoMau: ngưỡng ĐỀ XUẤT của bản dựng này, CHƯA thẩm định trên dải số thật.
 *    Hai quan hệ này chỉ nên dùng để GỢI Ý, chưa đủ tư cách làm mệnh lệnh chính.
 */
export const NGUONG = {
  thuaMin: 1.2, thuaGrad: 1.2,
  vuMin: 0.8,
  mauCapTuMe: -0.8, mauCapTuCon: -0.5,
  tuDaoMauCon: 0.8, tuDaoMauMe: -0.5,
} as const

export interface CanhBenhLy {
  loai: Exclude<QuanHeLoai, 'sinh' | 'khac'>
  tu: HanhId
  den: HanhId
  /** 0..1 — mức độ, để xếp hạng cạnh nào nặng nhất. */
  cuong: number
  nhan: string
  /** false với hai quan hệ mẫu-tử: ngưỡng chưa thẩm định (xem NGUONG). */
  daThamDinh: boolean
}

type ZMap = Partial<Record<HanhId, number | null>>
const HANH_ALL: HanhId[] = ['moc', 'hoa', 'tho', 'kim', 'thuy']

/**
 * Chẩn đồ ngũ hành: từ z của 5 hành, liệt kê mọi cạnh BỆNH LÝ đang có, xếp nặng trước.
 * Hành thiếu số đo (null/undefined) thì mọi cạnh dính tới nó bị bỏ qua — không đoán bừa.
 */
export function chanDoNguHanh(z: ZMap): CanhBenhLy[] {
  const out: CanhBenhLy[] = []
  const zv = (h: HanhId): number | null => {
    const v = z[h]
    return v == null || Number.isNaN(v) ? null : v
  }
  for (const a of HANH_ALL) {
    const za = zv(a)
    if (za == null) continue

    // — trục KHẮC: a khắc b —
    const b = HANH_ALL.find((x) => controllerOf(x) === a) ?? null // hành mà a khắc
    if (b) {
      const zb = zv(b)
      if (zb != null) {
        const thua = Math.max(0, za) + Math.max(0, -zb)
        const vu = Math.max(0, zb - za - 1)
        if (thua >= NGUONG.thuaMin && za - zb >= NGUONG.thuaGrad) {
          out.push({
            loai: 'thua', tu: a, den: b, cuong: Math.min(thua / 3, 1), daThamDinh: true,
            nhan: `${HANH_TEN[a]} thừa thế đè ${HANH_TEN[b]} (${HANH_TEN[a]} z=${za.toFixed(2)} · ${HANH_TEN[b]} z=${zb.toFixed(2)})`,
          })
        } else if (vu >= NGUONG.vuMin) {
          out.push({
            loai: 'vu', tu: b, den: a, cuong: Math.min(vu / 2, 1), daThamDinh: true,
            nhan: `${HANH_TEN[b]} mạnh lên quay lại lấn ${HANH_TEN[a]} (phản khắc)`,
          })
        }
      }
    }

    // — trục SINH: a là mẹ của con c —
    const c = sonOf(a)
    const zc = zv(c)
    if (zc != null) {
      if (za <= NGUONG.mauCapTuMe && zc <= NGUONG.mauCapTuCon) {
        out.push({
          loai: 'mau-cap-tu', tu: a, den: c, cuong: Math.min(Math.abs(za) / 2.5, 1), daThamDinh: false,
          nhan: `${HANH_TEN[a]} (mẹ) suy nên không nuôi nổi ${HANH_TEN[c]} (con) — cả hai cùng hư`,
        })
      }
      if (zc >= NGUONG.tuDaoMauCon && za <= NGUONG.tuDaoMauMe) {
        out.push({
          loai: 'tu-dao-mau', tu: c, den: a, cuong: Math.min(zc / 2.5, 1), daThamDinh: false,
          nhan: `${HANH_TEN[c]} (con) hao tổn rút ngược khí của ${HANH_TEN[a]} (mẹ)`,
        })
      }
    }
  }
  return out.sort((x, y) => y.cuong - x.cuong)
}

// ───────────────────────────────────────────────────────────────────────────
// ② PHÁP TRỊ NGŨ HÀNH CỔ ĐIỂN
// ───────────────────────────────────────────────────────────────────────────

export interface PhapNguHanh {
  id: string
  ten: string
  han: string
  /** 'sinh' = pháp đi theo vòng tương sinh; 'khac' = đi theo vòng tương khắc. */
  truc: 'sinh' | 'khac'
  coChe: string
  nguon: string
  /** Hành cụ thể mà pháp này nói tới — null nghĩa là pháp TỔNG QUÁT, áp cho hành bất kỳ. */
  hanhE?: HanhId
  /** Pháp áp dụng khi hành E ở trạng thái nào. */
  khi: 'hu' | 'thuc' | 'thua' | 'vu'
}

export const PHAP_NGU_HANH: PhapNguHanh[] = [
  // — TỔNG QUÁT (áp cho mọi hành) —
  { id: 'hu-bo-mau', ten: 'Hư tắc bổ kỳ mẫu', han: '虛則補其母', truc: 'sinh', khi: 'hu', nguon: 'Nạn Kinh 69',
    coChe: 'Hành hư thì bồi hành MẸ sinh ra nó — mẹ vượng thì con tự được nuôi, bổ gián tiếp mà bền hơn bổ thẳng.' },
  { id: 'thuc-ta-tu', ten: 'Thực tắc tả kỳ tử', han: '實則瀉其子', truc: 'sinh', khi: 'thuc', nguon: 'Nạn Kinh 69',
    coChe: 'Hành thực thì tả hành CON — mở đường cho khí dư thoát xuôi theo vòng sinh, không chặn ngang gây phản ứng.' },
  { id: 'uc-cuong', ten: 'Ức cường', han: '抑強', truc: 'khac', khi: 'thua', nguon: 'Nội Kinh · trị tương thừa/tương vũ',
    coChe: 'Bên gây hấn quá mạnh thì kìm bên mạnh trước — cắt nguồn đè nén, bên yếu tự hồi.' },
  { id: 'phu-nhuoc', ten: 'Phù nhược', han: '扶弱', truc: 'khac', khi: 'hu', nguon: 'Nội Kinh · trị tương thừa/tương vũ',
    coChe: 'Bên bị đè quá yếu thì nâng bên yếu — đủ sức tự chống lại thế khắc, khỏi phải kìm bên kia.' },

  // — CỤ THỂ theo trục TƯƠNG SINH —
  { id: 'tu-thuy-ham-moc', ten: 'Tư thuỷ hàm mộc', han: '滋水涵木', truc: 'sinh', khi: 'hu', hanhE: 'moc', nguon: 'pháp trị cổ điển',
    coChe: 'Thận thuỷ hư không nuôi được Can mộc (mộc thiếu nước thì khô, dương bốc lên) → bổ Thận âm để dưỡng Can.' },
  { id: 'boi-tho-sinh-kim', ten: 'Bồi thổ sinh kim', han: '培土生金', truc: 'sinh', khi: 'hu', hanhE: 'kim', nguon: 'pháp trị cổ điển',
    coChe: 'Phế kim hư thì kiện Tỳ thổ — mẹ Thổ vượng mới sinh được con Kim, trị gốc hơn là bổ Phế suông.' },
  { id: 'ich-hoa-bo-tho', ten: 'Ích hoả bổ thổ', han: '益火補土', truc: 'sinh', khi: 'hu', hanhE: 'tho', nguon: 'pháp trị cổ điển',
    coChe: 'Tỳ thổ hư hàn thì bồi hoả sinh thổ. Lưu ý dị bản: sách xưa hiểu hoả là TÂM hoả, đời sau đa phần hiểu là mệnh môn hoả (Thận dương).' },
  { id: 'kim-thuy-tuong-sinh', ten: 'Kim thuỷ tương sinh', han: '金水相生', truc: 'sinh', khi: 'hu', hanhE: 'thuy', nguon: 'pháp trị cổ điển',
    coChe: 'Phế kim và Thận thuỷ cùng hư (âm hư) thì bổ cả hai — mẹ con cùng dưỡng, hay dùng ở chứng âm hư.' },

  // — CỤ THỂ theo trục TƯƠNG KHẮC —
  { id: 'ta-kim-binh-moc', ten: 'Tá kim bình mộc', han: '佐金平木', truc: 'khac', khi: 'thuc', hanhE: 'moc', nguon: 'pháp trị cổ điển',
    coChe: 'Can mộc vượng lấn thì trợ Phế kim — mượn kẻ khắc mộc để bình mộc, thay vì tả thẳng Can.' },
  { id: 'boi-tho-che-thuy', ten: 'Bồi thổ chế thuỷ', han: '培土制水', truc: 'khac', khi: 'thuc', hanhE: 'thuy', nguon: 'pháp trị cổ điển',
    coChe: 'Thuỷ tràn (thuỷ thũng, đàm ẩm) thì kiện Tỳ thổ để ngăn — thổ vững thì thuỷ không tràn.' },
  { id: 'ta-nam-bo-bac', ten: 'Tả nam bổ bắc', han: '瀉南補北', truc: 'khac', khi: 'thuc', hanhE: 'hoa', nguon: 'Nạn Kinh 75',
    coChe: 'Tâm hoả (nam) thịnh mà Thận thuỷ (bắc) hư thì tả hoả đồng thời bổ thuỷ — dựng lại thế thuỷ chế hoả.' },
  { id: 'trang-thuy-che-hoa', ten: 'Tráng thuỷ chế hoả', han: '壯水制火', truc: 'khac', khi: 'hu', hanhE: 'thuy', nguon: 'pháp trị cổ điển',
    coChe: 'Hoả bốc lên do thuỷ không đủ chế (HƯ hoả) thì bổ thuỷ chứ không tả hoả — tả hoả ở đây càng hao chính khí.' },
]

/** Các pháp hợp với một hành ở một trạng thái. Pháp tổng quát luôn có mặt, pháp riêng đứng trước. */
export function phapChoHanh(hanh: HanhId, trangThai: 'hu' | 'thuc'): PhapNguHanh[] {
  const rieng = PHAP_NGU_HANH.filter((p) => p.hanhE === hanh && p.khi === trangThai)
  const chung = PHAP_NGU_HANH.filter((p) => !p.hanhE && p.khi === trangThai)
  return [...rieng, ...chung]
}

// ───────────────────────────────────────────────────────────────────────────
// ③ PHƯƠNG CHÂM
// ───────────────────────────────────────────────────────────────────────────

export type BacMenhLenh = 'chinh' | 'ta' | 'kiem'

export interface MenhLenh {
  bac: BacMenhLenh
  tacDong: 'bo' | 'ta'
  hanh: HanhId
  hanhTen: string
  /** Kinh mang mệnh lệnh này. */
  kinh: string
  /** Huyệt Ngũ Du ứng với (hành × kinh) — mỗi kinh có đủ 5 hành trong 5 huyệt. */
  huyet: string | null
  vaiTroHuyet: string | null
  phap: string
  coChe: string
  /** Mệnh lệnh đã bị hạ cấp vì chính khí khuyết (tả → giữ nguyên, không tả thêm). */
  hoanTa?: boolean
}

export interface PhuongChamInput {
  /** Kinh gốc — nơi bệnh khởi (tầng B sẽ định gốc từ phiếu đo; tầng A nhận thẳng). */
  kinhGoc: string
  thuc: boolean
  /** Khung hồi tác; bỏ trống thì tự chọn theo hư/thực. */
  khung?: KhungLoai
  /** z của 5 hành, nếu có — dùng để bắt cạnh bệnh lý và kiểm mâu thuẫn. */
  z?: ZMap
  /** Chính khí tổng của người bệnh. 'khuyet' thì mọi mệnh lệnh TẢ bị hoãn. */
  chinhKhi?: 'du' | 'khuyet' | 'binh'
}

export interface PhuongCham {
  goc: { kinh: string; hanh: HanhId; hanhTen: string; thuc: boolean; laTang: boolean }
  khung: KhungInfo
  khungTen: string
  khungMoTa: string
  /** Câu chỉ đạo một dòng — thứ đọc trước tiên. */
  chiDao: string
  menhLenh: MenhLenh[]
  /** Trục ① — Ngũ Du theo HÀNH (hai kinh: gốc + bạn trong khung). */
  huyetNguDu: PhuongHuyetNHHT | null
  /** Trục ① phụ — Ngũ Du theo Nạn Kinh 69 (một huyệt trên chính kinh gốc). */
  huyetNanKinh: PhuongHuyetBoMauTaCon | null
  /** Trục ② — Nguyên–Lạc theo cặp BIỂU–LÝ (chủ–khách).
   * CHÚ Ý: cặp này LUÔN theo biểu-lý, độc lập với `khung` — Tỳ gốc thì khách luôn là Vị,
   * dù khung đang dùng là Thượng–Hạ (Tỳ–Phế). Không phải mâu thuẫn: hai trục khác nhau. */
  huyetNguyenLac: PhoiNguyenLac | null
  /** Các pháp trị ngũ hành cổ điển HỢP với hành gốc ở trạng thái này — để thầy thuốc tra và
   * cân nhắc, KHÔNG phải mệnh lệnh engine phát ra (mệnh lệnh nằm ở `menhLenh`). */
  phapCoDien: PhapNguHanh[]
  quanHeBenhLy: CanhBenhLy[]
  /** Mâu thuẫn giữa các mệnh lệnh (hồi tác): lệnh này làm nặng hành đang lệch sẵn. */
  mauThuan: string[]
  canhBao: string[]
}

function huyetCua(kinh: string, hanh: HanhId): { ten: string; vaiTro: string } | null {
  const h = huyetTheoHanh(kinh, hanh)
  return h ? { ten: h.ten, vaiTro: h.roleTen } : null
}

/**
 * Luận phương châm cho MỘT kinh gốc ở MỘT trạng thái.
 * Tầng A: không biết gì về phiếu đo — ai gọi thì đưa sẵn kinh gốc + hư/thực (+ z, chính khí nếu có).
 */
export function phuongChamNen(input: PhuongChamInput): PhuongCham | null {
  const { kinhGoc, thuc, z, chinhKhi } = input
  const hanhE = hanhCuaKinh(kinhGoc)
  const def = KINH[kinhGoc]
  if (!hanhE || !def) return null
  const khungLoai: KhungLoai = input.khung ?? autoKhung(thuc ? 'thực' : 'hư')
  const khung = khungForOrgan(khungLoai, kinhGoc)
  if (!khung) return null

  const C = controllerOf(hanhE) // hành khắc E
  const eTen = HANH_TEN[hanhE]
  const phapList = phapChoHanh(hanhE, thuc ? 'thuc' : 'hu')
  const khuyet = chinhKhi === 'khuyet'

  // — Mệnh lệnh: dựng THEO đúng luật NHHT đang dùng cho phương huyệt, để phương châm và
  //   huyệt không bao giờ nói hai đằng (chúng là hai cách trình bày CÙNG một kết luận).
  const menhLenh: MenhLenh[] = []
  const push = (bac: BacMenhLenh, tacDong: 'bo' | 'ta', hanh: HanhId, kinh: string, phap: string, coChe: string) => {
    const h = huyetCua(kinh, hanh)
    const hoanTa = tacDong === 'ta' && khuyet
    menhLenh.push({
      bac, tacDong, hanh, hanhTen: HANH_TEN[hanh], kinh,
      huyet: h?.ten ?? null, vaiTroHuyet: h?.vaiTro ?? null,
      phap, coChe, ...(hoanTa ? { hoanTa: true } : {}),
    })
  }

  if (thuc) {
    push('chinh', 'ta', hanhE, khung.partner, 'Thực tắc tả kỳ tử / tiết thực',
      `${eTen} thực thì xả bớt ngay tại Kinh Bạn ${khung.partner} của khung ${KHUNG_TEN[khungLoai]}.`)
    push('ta', 'bo', C, kinhGoc, 'Ức cường bằng kẻ khắc',
      `Bồi ${HANH_TEN[C]} — kẻ khắc ${eTen} — ngay trên kinh gốc để chế cái vượng, chặn Tương Thừa và Tương Vũ.`)
  } else {
    push('chinh', 'bo', hanhE, khung.partner, 'Phù nhược / bồi bản hành',
      `${eTen} hư thì nâng chính khí bản hành tại Kinh Bạn ${khung.partner} của khung ${KHUNG_TEN[khungLoai]}.`)
    push('ta', 'ta', C, kinhGoc, 'Ức cường — ngắt đè nén',
      `Kìm ${HANH_TEN[C]} đang thừa thế khắc phạt ${eTen} quá tay, ngay trên kinh gốc.`)
  }
  // Kiêm: đường vòng tương sinh (Nạn Kinh 69) — luôn nằm trên chính kinh gốc.
  const hanhKiem = thuc ? sonOf(hanhE) : motherOf(hanhE)
  push('kiem', thuc ? 'ta' : 'bo', hanhKiem, kinhGoc,
    thuc ? 'Thực tắc tả kỳ tử' : 'Hư tắc bổ kỳ mẫu',
    thuc
      ? `Mở đường cho khí dư của ${eTen} thoát xuôi sang hành con ${HANH_TEN[hanhKiem]}.`
      : `Bồi hành mẹ ${HANH_TEN[hanhKiem]} để nuôi ${eTen} từ gốc, bền hơn bổ thẳng.`)

  // — Cạnh bệnh lý + kiểm mâu thuẫn (HỒI TÁC): mỗi mệnh lệnh soi ngược lên các hành khác.
  const quanHeBenhLy = z ? chanDoNguHanh(z) : []
  const mauThuan: string[] = []
  if (z) {
    for (const ml of menhLenh) {
      const zMuc = z[ml.hanh]
      if (zMuc == null) continue
      if (ml.tacDong === 'bo' && zMuc >= 1) {
        mauThuan.push(`Lệnh BỔ ${ml.hanhTen} (${ml.bac}) nhưng ${ml.hanhTen} đang THỰC sẵn (z=${zMuc.toFixed(2)}) — bổ thêm là chồng thực.`)
      }
      if (ml.tacDong === 'ta' && zMuc <= -1) {
        mauThuan.push(`Lệnh TẢ ${ml.hanhTen} (${ml.bac}) nhưng ${ml.hanhTen} đang HƯ sẵn (z=${zMuc.toFixed(2)}) — tả vào chỗ đã hư.`)
      }
      // Hồi tác gián tiếp: bổ một hành là tăng sức khắc của nó lên hành bị khắc.
      const biKhac = HANH_ALL.find((x) => controllerOf(x) === ml.hanh)
      const zBiKhac = biKhac ? z[biKhac] : null
      if (ml.tacDong === 'bo' && biKhac && zBiKhac != null && zBiKhac <= -1) {
        mauThuan.push(`Bổ ${ml.hanhTen} sẽ nặng thêm thế khắc lên ${HANH_TEN[biKhac]} vốn đã hư (z=${zBiKhac.toFixed(2)}) — cân nhắc phù nhược trước.`)
      }
    }
  }

  const canhBao: string[] = []
  if (khuyet) {
    canhBao.push('Chính khí KHUYẾT: mọi mệnh lệnh TẢ đã bị hoãn thành "giữ nguyên, không tả thêm". Lấy phù chính làm gốc, công tà là việc sau.')
  }
  if (!z) {
    canhBao.push('Chưa có z của 5 hành nên KHÔNG kiểm được mâu thuẫn hồi tác — phương châm này mới chỉ đúng về hình thức luận.')
  }
  if (chinhKhi == null) {
    canhBao.push('Chưa biết chính khí tổng. Nhắc lại: z là số TƯƠNG ĐỐI trong nội bộ phiếu — "thực" có thể chỉ là "đỡ hư nhất", nên chưa vội tả.')
  }
  const chuaThamDinh = quanHeBenhLy.filter((c) => !c.daThamDinh).length
  if (chuaThamDinh > 0) {
    canhBao.push(`${chuaThamDinh} cạnh mẫu-tử phát hiện bằng ngưỡng CHƯA thẩm định — chỉ dùng làm gợi ý, đừng nâng thành mệnh lệnh.`)
  }

  const chinh = menhLenh.find((m) => m.bac === 'chinh')!
  const chiDao =
    `${kinhGoc} (${eTen}) ${thuc ? 'THỰC' : 'HƯ'} — khung ${KHUNG_TEN[khungLoai]}: ` +
    `${chinh.tacDong === 'bo' ? 'BỔ' : 'TẢ'} ${chinh.hanhTen} tại ${chinh.kinh}` +
    `${chinh.huyet ? ` (${chinh.huyet})` : ''} — ${chinh.phap}.`

  return {
    goc: { kinh: kinhGoc, hanh: hanhE, hanhTen: eTen, thuc, laTang: def.am },
    khung, khungTen: KHUNG_TEN[khungLoai], khungMoTa: KHUNG_MOTA[khungLoai],
    chiDao,
    menhLenh,
    huyetNguDu: phuongHuyetNHHT(kinhGoc, thuc, khungLoai),
    huyetNanKinh: phuongHuyetBoMauTaCon(kinhGoc, thuc),
    huyetNguyenLac: phoiNguyenLac(kinhGoc),
    phapCoDien: phapList,
    quanHeBenhLy,
    mauThuan,
    canhBao,
  }
}

// ───────────────────────────────────────────────────────────────────────────
// ④ ĐỊNH GỐC — tầng B: từ phiếu đo tìm ra kinh KHỞI BỆNH
//
// Không phải kinh nào đo lệch cũng là gốc. Ngũ hành lan: Mộc thực đè Thổ thì Thổ cũng lệch, nhưng
// trị Thổ là trị ngọn. Hai bước:
//   ① HÀNH gốc = nguồn phát của cạnh bệnh lý NẶNG NHẤT (kẻ thừa, kẻ vũ, mẹ suy, con hao).
//      Không có cạnh bệnh lý nào thì mới lấy hành lệch mạnh nhất.
//   ② KINH gốc trong hành đó = kinh thật sự đo lệch; cả tạng lẫn phủ cùng lệch thì theo trục
//      Biểu–Lý của Bát Cương (Biểu → phủ, Lý → tạng). Trước đây chỗ này lấy cứng phần tử đầu
//      mảng nên hành Hoả luôn ra "Tâm", không bao giờ ra Tiểu trường / Tâm bào / Tam tiêu.
// ───────────────────────────────────────────────────────────────────────────

export interface KinhLech {
  kinh: string
  thuc: boolean
}

export interface DinhGocInput {
  z: ZMap
  /** Các kinh đo lệch kèm hướng (từ Bát Cương của phiếu). */
  kinhLech: KinhLech[]
  /** Bát Cương vị trí: 'Biểu' | 'Lý' | 'Biểu Lý' — chọn phủ hay tạng khi cả hai cùng lệch. */
  viTri?: string
}

export interface DinhGoc {
  hanhGoc: HanhId | null
  kinhGoc: string | null
  thuc: boolean
  /** Vì sao chọn kinh này — luôn nói được, để thầy thuốc bác bỏ được. */
  lyDo: string[]
  /** Kinh lệch nhưng là HỆ QUẢ lan từ gốc theo sinh/khắc — trị sau, hoặc không cần trị riêng. */
  keoTheo: Array<{ kinh: string; vi: string }>
  canhBenhLy: CanhBenhLy[]
  /** Không đủ căn cứ để chỉ ra gốc (vd mọi hành đều thiếu số đo). */
  khongChac: boolean
  /** Chỗ chẩn đồ ngũ hành NHÌN KHÔNG THẤY — phải nói ra, đừng im lặng bỏ qua. */
  canhBao: string[]
}

/** Hành nguồn phát của một cạnh bệnh lý (kẻ gây ra), theo từng loại quan hệ. */
function nguonCua(c: CanhBenhLy): HanhId {
  // thua: kẻ khắc đè xuống · vu: kẻ bị khắc phản lại · mau-cap-tu: mẹ suy · tu-dao-mau: con hao
  return c.tu
}

export function dinhGoc(input: DinhGocInput): DinhGoc {
  const { z, kinhLech, viTri } = input
  const canhBenhLy = chanDoNguHanh(z)
  const lyDo: string[] = []

  // ① HÀNH gốc
  let hanhGoc: HanhId | null = null
  const canhManh = canhBenhLy.find((c) => c.daThamDinh) ?? canhBenhLy[0] ?? null
  if (canhManh) {
    hanhGoc = nguonCua(canhManh)
    lyDo.push(
      `${QUAN_HE_TEN[canhManh.loai].ten} (${QUAN_HE_TEN[canhManh.loai].han}) là quan hệ bệnh lý nặng nhất — ` +
        `${canhManh.nhan}. Nguồn phát là ${HANH_TEN[hanhGoc]}.`,
    )
    if (!canhManh.daThamDinh) {
      lyDo.push('Cạnh này bắt bằng ngưỡng CHƯA thẩm định (quan hệ mẫu-tử) — nên xem là gợi ý.')
    }
  } else {
    let max = 0
    for (const h of HANH_ALL) {
      const v = z[h]
      if (v == null) continue
      if (Math.abs(v) > max) { max = Math.abs(v); hanhGoc = h }
    }
    if (hanhGoc) {
      lyDo.push(`Không có quan hệ bệnh lý nào vượt ngưỡng; lấy hành lệch mạnh nhất: ${HANH_TEN[hanhGoc]} (z=${z[hanhGoc]!.toFixed(2)}).`)
    }
  }
  // CẢNH BÁO "hành bị che": z của mỗi hành gộp tạng + phủ, nên tạng thực mà phủ hư (hoặc ngược lại)
  // thì hai chiều triệt tiêu và hành đó tụt về ~0 — chẩn đồ ngũ hành không nhìn thấy nó nữa, dù kinh
  // vẫn đang lệch thật. Gặp thật ở ca đo 15/09/2026: Can THỰC + Đởm HƯ → Mộc z=0,08.
  const canhBao: string[] = []
  for (const h of HANH_ALL) {
    const cungHanh = kinhLech.filter((k) => hanhCuaKinh(k.kinh) === h)
    if (cungHanh.length < 2) continue
    const coThuc = cungHanh.some((k) => k.thuc)
    const coHu = cungHanh.some((k) => !k.thuc)
    const zh = z[h]
    if (coThuc && coHu && zh != null && Math.abs(zh) < 0.5) {
      canhBao.push(
        `Hành ${HANH_TEN[h]} bị CHE: ${cungHanh.map((k) => `${k.kinh} ${k.thuc ? 'thực' : 'hư'}`).join(' + ')} ` +
          `lệch ngược chiều nên z gộp chỉ còn ${zh.toFixed(2)} — chẩn đồ ngũ hành không thấy hành này, ` +
          `nhưng kinh thì vẫn đang lệch. Cân nhắc trị theo từng kinh thay vì theo hành.`,
      )
    }
  }

  if (!hanhGoc) {
    return { hanhGoc: null, kinhGoc: null, thuc: false, lyDo: ['Thiếu số đo của cả 5 hành — không định được gốc.'], keoTheo: [], canhBenhLy, khongChac: true, canhBao }
  }

  // ② KINH gốc trong hành đó
  const ungVien = kinhLech.filter((k) => hanhCuaKinh(k.kinh) === hanhGoc)
  let kinhGoc: string | null = null
  let thuc = (z[hanhGoc] ?? 0) > 0
  let khongChac = false

  if (ungVien.length === 1) {
    kinhGoc = ungVien[0]!.kinh
    thuc = ungVien[0]!.thuc
    lyDo.push(`Trong hành ${HANH_TEN[hanhGoc]}, chỉ ${kinhGoc} đo lệch — lấy làm kinh gốc.`)
  } else if (ungVien.length > 1) {
    const laBieu = /biểu/i.test(viTri || '') && !/lý/i.test(viTri || '')
    const laLy = /lý|nội/i.test(viTri || '') && !/biểu/i.test(viTri || '')
    const phu = ungVien.filter((k) => KINH[k.kinh]?.am === false)
    const tang = ungVien.filter((k) => KINH[k.kinh]?.am === true)
    let chon: KinhLech | undefined
    if (laBieu && phu.length) { chon = phu[0]; lyDo.push(`Cả tạng lẫn phủ của hành ${HANH_TEN[hanhGoc]} cùng lệch; Bát Cương ở BIỂU nên lấy phủ ${chon!.kinh}.`) }
    else if (laLy && tang.length) { chon = tang[0]; lyDo.push(`Cả tạng lẫn phủ của hành ${HANH_TEN[hanhGoc]} cùng lệch; Bát Cương ở LÝ nên lấy tạng ${chon!.kinh}.`) }
    else {
      chon = tang[0] ?? phu[0]
      khongChac = true
      lyDo.push(
        `Hành ${HANH_TEN[hanhGoc]} có ${ungVien.length} kinh cùng lệch (${ungVien.map((k) => k.kinh).join(', ')}) mà Bát Cương ` +
          `không nghiêng hẳn Biểu hay Lý — tạm lấy ${chon!.kinh}, thầy thuốc nên tự chọn lại.`,
      )
    }
    kinhGoc = chon!.kinh
    thuc = chon!.thuc
  } else {
    // Hành lệch nhưng không kinh nào của nó nằm trong danh sách đo lệch (z hành gộp từ nhiều kinh).
    kinhGoc = KINH_THEO_HANH[hanhGoc][0]!
    khongChac = true
    lyDo.push(`Hành ${HANH_TEN[hanhGoc]} lệch nhưng không kinh nào của nó vượt ngưỡng Bát Cương — tạm lấy ${kinhGoc}, độ chắc thấp.`)
  }

  // Kinh KÉO THEO: đích của các cạnh bệnh lý phát từ hành gốc.
  const keoTheo: Array<{ kinh: string; vi: string }> = []
  for (const c of canhBenhLy) {
    if (c.tu !== hanhGoc) continue
    for (const k of kinhLech) {
      if (hanhCuaKinh(k.kinh) !== c.den) continue
      if (keoTheo.some((x) => x.kinh === k.kinh)) continue
      keoTheo.push({ kinh: k.kinh, vi: `${QUAN_HE_TEN[c.loai].ten} từ ${HANH_TEN[c.tu]} sang ${HANH_TEN[c.den]}` })
    }
  }

  return { hanhGoc, kinhGoc, thuc, lyDo, keoTheo, canhBenhLy, khongChac, canhBao }
}

// ───────────────────────────────────────────────────────────────────────────
// ⑤ HỒI TÁC — vòng kín: đo → phương châm → can thiệp → ĐO LẠI → chấm lại
//
// "Hồi tác" nghĩa gốc là PHẢN HỒI. Bốn tầng trên mới chỉ ra được mệnh lệnh; tầng này trả lời câu
// thầy thuốc thật sự cần: lần trước làm vậy, người bệnh có chuyển không.
//
// Chấm trên HÌNH DẠNG PHÂN BỐ, không chấm mức tuyệt đối:
//   • hành gốc cũ đã về gần mốc chưa (|z| giảm bao nhiêu),
//   • số cạnh bệnh lý (thừa/vũ/mẫu-tử) còn mấy,
//   • năm hành có đều hơn không (tổng |z|).
// BẤT BIẾN AFFINE: cả ba chỉ số này đều mù với việc người bệnh nóng/nguội đi toàn thân — mức tuyệt
// đối chỉ nhìn thấy qua `soSanhChinhKhi` (°C thô). Vì vậy hàm này KHÔNG kết luận "khoẻ lên"; nó chỉ
// nói "ngũ hành cân hơn / lệch hơn", và nơi dùng phải đặt cạnh trục chính khí.
// ───────────────────────────────────────────────────────────────────────────

export type HoiTacMuc = 'chuyen-tot' | 'chua-chuyen' | 'nang-them' | 'khong-du-cu'

export interface HoiTac {
  muc: HoiTacMuc
  /** Câu một dòng cho thầy thuốc đọc. */
  nhan: string
  /** |z| của hành gốc lần trước, ở hai lần đo. */
  zGocTruoc: number | null
  zGocSau: number | null
  soCanhTruoc: number
  soCanhSau: number
  tongLechTruoc: number
  tongLechSau: number
  /** Gốc lần này có còn là gốc lần trước không — đổi gốc là tín hiệu riêng, không phải xấu. */
  doiGoc: boolean
  canhBao: string[]
}

const tongLech = (z: ZMap): number =>
  HANH_ALL.reduce((s, h) => s + (z[h] == null ? 0 : Math.abs(z[h]!)), 0)

/**
 * Chấm hồi tác giữa hai lần đo liền nhau CỦA CÙNG MỘT ĐỢT.
 * `hanhGocTruoc` là hành gốc engine chấm ở lần trước — thứ mà phương châm lần đó nhắm vào.
 */
export function chamHoiTac(
  zTruoc: ZMap | null | undefined,
  zSau: ZMap | null | undefined,
  hanhGocTruoc: HanhId | null,
  hanhGocSau: HanhId | null,
  /** Hai phiếu thuộc HAI ĐỢT (cách quá ngưỡng): có thể là hai bệnh khác nhau → KHÔNG chấm phương
   *  châm, chỉ mô tả hình dạng phân bố. Nếu không nói rõ, câu kết luận sẽ hứa nhiều hơn dữ liệu. */
  khacDot = false,
): HoiTac | null {
  if (!zTruoc || !zSau) return null
  const canhTruoc = chanDoNguHanh(zTruoc)
  const canhSau = chanDoNguHanh(zSau)
  const zGocTruoc = hanhGocTruoc && zTruoc[hanhGocTruoc] != null ? Math.abs(zTruoc[hanhGocTruoc]!) : null
  const zGocSau = hanhGocTruoc && zSau[hanhGocTruoc] != null ? Math.abs(zSau[hanhGocTruoc]!) : null
  const tlTruoc = tongLech(zTruoc)
  const tlSau = tongLech(zSau)
  const doiGoc = !!hanhGocTruoc && !!hanhGocSau && hanhGocTruoc !== hanhGocSau

  const canhBao: string[] = []
  let muc: HoiTacMuc = 'khong-du-cu'
  let nhan = 'Chưa đủ căn cứ để chấm hồi tác.'

  if (zGocTruoc != null && zGocSau != null) {
    const chenh = zGocSau - zGocTruoc
    const gocTen = HANH_TEN[hanhGocTruoc!]
    const doDoc = `(|z| ${zGocTruoc.toFixed(2)} → ${zGocSau.toFixed(2)})`
    if (chenh <= -0.4) {
      muc = khacDot ? 'khong-du-cu' : 'chuyen-tot'
      nhan = khacDot
        ? `Hành gốc ${gocTen} của đợt trước nay bớt lệch ${doDoc} — chỉ là đối chiếu hình dạng giữa hai đợt, không nói lên phương châm đợt trước.`
        : `Hành gốc ${gocTen} bớt lệch ${doDoc} — phương châm lần trước có đáp ứng.`
    } else if (chenh >= 0.4) {
      muc = khacDot ? 'khong-du-cu' : 'nang-them'
      nhan = khacDot
        ? `Hành gốc ${gocTen} của đợt trước nay lệch thêm ${doDoc} — hai đợt khác nhau, chưa kết luận được gì về phương châm.`
        : `Hành gốc ${gocTen} lệch thêm ${doDoc} — xem lại phương châm lần trước.`
    } else {
      muc = khacDot ? 'khong-du-cu' : 'chua-chuyen'
      nhan = `Hành gốc ${gocTen} gần như giữ nguyên ${doDoc}.`
    }
    // Đối chứng bằng hai chỉ số còn lại: nếu chúng đi NGƯỢC với kết luận trên thì phải nói ra.
    if (muc === 'chuyen-tot' && (canhSau.length > canhTruoc.length || tlSau > tlTruoc + 0.5)) {
      canhBao.push(
        `Hành gốc đỡ lệch nhưng toàn cục thì không: cạnh bệnh lý ${canhTruoc.length}→${canhSau.length}, ` +
          `tổng lệch ${tlTruoc.toFixed(2)}→${tlSau.toFixed(2)} — có thể chỉ chuyển chỗ lệch sang hành khác.`,
      )
    }
  } else if (tlTruoc > 0) {
    muc = tlSau < tlTruoc - 0.5 ? 'chuyen-tot' : tlSau > tlTruoc + 0.5 ? 'nang-them' : 'chua-chuyen'
    nhan = `Chưa chấm được theo hành gốc; xét toàn cục: tổng lệch ${tlTruoc.toFixed(2)} → ${tlSau.toFixed(2)}.`
  }

  if (doiGoc) {
    canhBao.push(
      `Gốc đã đổi từ ${HANH_TEN[hanhGocTruoc!]} sang ${HANH_TEN[hanhGocSau!]} — phương châm lần này nhắm chỗ khác, ` +
        `đừng đọc hai lần đo như cùng một mạch bệnh.`,
    )
  }
  canhBao.push(
    'Ba chỉ số trên đều là HÌNH DẠNG phân bố, bất biến khi người bệnh nóng/nguội đi toàn thân — mức tuyệt đối phải đọc ở trục chính khí (°C).',
  )

  return {
    muc, nhan, zGocTruoc, zGocSau,
    soCanhTruoc: canhTruoc.length, soCanhSau: canhSau.length,
    tongLechTruoc: Number(tlTruoc.toFixed(2)), tongLechSau: Number(tlSau.toFixed(2)),
    doiGoc, canhBao,
  }
}
