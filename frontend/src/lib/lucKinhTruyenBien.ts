/**
 * lucKinhTruyenBien.ts — CHUYỂN BIẾN có thể tiếp theo của ca đang định vị ở một kinh (theo SÁCH:
 * Thương Hàn Luận), KHÁC với huongTruyen (đo thực tế giữa 2 lần khám ở lucKinh.ts).
 *
 * Bảng đã thẩm định qua workflow (6 chuyên gia THL + 1 design lead, 2026-08-01):
 *  - vaoLy  = bệnh NẶNG lên / truyền vào sâu (đỏ, "nặng").
 *  - raBieu = bệnh LUI / hồi phục / xuất ra ngoài (xanh, "điềm lành"); tam âm hồi phục = "âm chứng
 *             chuyển dương" xuất ra kinh BIỂU-LÝ (Thiếu Âm→Thái Dương, Thái Âm→Dương Minh, Quyết Âm→Thiếu Dương).
 * Lưu ý lâm sàng: nhánh vào lý của THIẾU ÂM tùy hàn/nhiệt hóa (hàn→Quyết Âm vong dương ·
 * nhiệt→Dương Minh cấp hạ tồn âm). QUYẾT ÂM là tận cùng — vào lý không có kinh mới (vong dương/tử chứng).
 * THÁI DƯƠNG ngoài cùng — ra biểu = giải ngay tại biểu (khỏi), không lui về kinh nào.
 */
import { KINH_META, type KinhSlug } from './lucKinh'

export interface ChuyenBienHuong {
  slug: KinhSlug | null // kinh đích (null = không có kinh: khỏi ở biểu / tử chứng ở tận cùng)
  ten: string // nhãn hiển thị (tên kinh, hoặc "Giải ở biểu (khỏi)"…)
  coChe: string // cơ chế ngắn (tooltip)
}
export interface ChuyenBien {
  vaoLy: ChuyenBienHuong // nặng lên
  raBieu: ChuyenBienHuong // lui / hồi phục
}

const tenOf = (s: KinhSlug): string => KINH_META[s].ten

// Bảng thô (nhánh vào lý của thieu-am chọn theo hàn/nhiệt ở hàm dưới).
const BANG: Record<KinhSlug, { vaoLy: ChuyenBienHuong; raBieu: ChuyenBienHuong }> = {
  'thai-duong': {
    vaoLy: { slug: 'duong-minh', ten: tenOf('duong-minh'), coChe: 'Hóa nhiệt nhập lý → Dương Minh (Vị gia thực: đại nhiệt, đại khát, mạch hồng đại).' },
    raBieu: { slug: null, ten: 'Giải ở biểu — khỏi', coChe: 'Thái Dương là tầng ngoài cùng: phát hãn đúng pháp → tà theo mồ hôi ra, khỏi ngay tại biểu.' },
  },
  'duong-minh': {
    vaoLy: { slug: 'thieu-am', ten: tenOf('thieu-am'), coChe: 'Táo nhiệt phủ thực thiêu kiệt tân dịch → thương chân âm, nhập Thiếu Âm (cấp hạ tồn âm).' },
    raBieu: { slug: 'thai-duong', ten: tenOf('thai-duong'), coChe: 'Thanh nhiệt (Bạch Hổ) / thông phủ (Thừa Khí) → nhiệt lui, vị khí hòa, giải ra ngoài.' },
  },
  'thieu-duong': {
    vaoLy: { slug: 'thai-am', ten: tenOf('thai-am'), coChe: 'Khu cơ bất lợi, hòa giải bất thành, tà hãm vào lý → Thái Âm (Tỳ hư: bụng đầy, tự lợi).' },
    raBieu: { slug: 'thai-duong', ten: tenOf('thai-duong'), coChe: 'Hòa giải (Tiểu Sài Hồ) khu cơ phục → thấu ra biểu theo hãn mà giải.' },
  },
  'thai-am': {
    vaoLy: { slug: 'thieu-am', ten: tenOf('thieu-am'), coChe: 'Tỳ dương hư nặng lan Thận dương → Thiếu Âm (vong dương, tứ chi quyết lãnh).' },
    raBieu: { slug: 'duong-minh', ten: tenOf('duong-minh'), coChe: 'Chính khí phục — "hư tắc Thái Âm, thực tắc Dương Minh": trung dương vượng thì xuất ra Dương Minh.' },
  },
  'thieu-am': {
    // vaoLy đặt tạm hàn hóa; hàm dưới đổi sang Dương Minh nếu nhiệt hóa.
    vaoLy: { slug: 'quyet-am', ten: tenOf('quyet-am'), coChe: 'Hàn hóa vong dương, âm hàn cực thịnh → Quyết Âm (hàn nhiệt thác tạp, quyết nghịch).' },
    raBieu: { slug: 'thai-duong', ten: tenOf('thai-duong'), coChe: 'Âm chứng chuyển dương: tay chân ấm lại, phản phát nhiệt, mạch trầm→phù → xuất ra Thái Dương (điềm lành).' },
  },
  'quyet-am': {
    vaoLy: { slug: null, ten: 'Tận cùng — vong dương / tử chứng', coChe: 'Quyết Âm là tầng sâu nhất (tam âm chi tận): vào sâu không còn kinh mới, hàn nhiệt thác tạp cực độ → tử chứng.' },
    raBieu: { slug: 'thieu-duong', ten: tenOf('thieu-duong'), coChe: 'Dương khí hồi phục → xuất ra Thiếu Dương ("ẩu nhi phát nhiệt, Tiểu Sài Hồ chủ chi").' },
  },
}

/** Chuyển biến của 1 kinh trội. `nhietHoa` chỉ ảnh hưởng nhánh vào lý của Thiếu Âm (nhiệt→Dương Minh). */
export function truyenBienCua(slug: KinhSlug, opts?: { nhietHoa?: boolean }): ChuyenBien {
  const base = BANG[slug]
  if (slug === 'thieu-am' && opts?.nhietHoa) {
    return {
      vaoLy: { slug: 'duong-minh', ten: tenOf('duong-minh'), coChe: 'Nhiệt hóa thiêu kiệt chân âm → Dương Minh (cấp hạ tồn âm, tránh vong âm).' },
      raBieu: base.raBieu,
    }
  }
  return base
}
