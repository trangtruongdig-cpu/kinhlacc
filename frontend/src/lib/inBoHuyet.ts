// In nhanh MỘT bộ huyệt (bệnh chứng / NHHT / Bộ Huyệt) — dùng chung ở cả 3 tab con của Phương
// Huyệt, để khỏi phải mở tab Huyệt Vị rồi tự chọn lại từng huyệt đã thấy sẵn trong khung.
// Cùng payload/luồng với SoanPhieuHuyet.vue (điều hướng sang Kinh Mạch 3D — trang đó chỉ là
// "xưởng" mượn engine chụp ảnh thân người rồi tự đóng lại, xem phieu-huyet-tab-huyet-vi.md).
import type { Router } from 'vue-router'

export interface HuyetDeIn {
  ma_huyet: string | null | undefined
  ten_huyet: string | null | undefined
  vai_tro?: string | null
  vi_thuoc?: string | null
  han?: string | null
  cong_nang?: string | null
}

const chuanHoaMa = (ma: string | null | undefined): string => (ma || '').toUpperCase().replace(/[^A-Z0-9]/g, '')

/** Mở cửa sổ Kinh Mạch 3D → tự dựng + in phiếu cho đúng danh sách huyệt của 1 bộ. */
export function moPhieuInBoHuyet(router: Router, tenBo: string, huyet: HuyetDeIn[]) {
  const dung = huyet
    .map((h) => ({ ...h, code: chuanHoaMa(h.ma_huyet) }))
    .filter((h) => h.code)
  if (!dung.length) {
    alert('Bộ huyệt này không có huyệt nào tra được mã quốc tế — không dựng được đồ hình.')
    return
  }
  const payload = {
    patientName: '',
    examDate: '',
    theBenh: tenBo,
    loai: 'phuong-huyet' as const,
    groups: [
      {
        method: tenBo,
        items: dung.map((h) => ({
          code: h.code,
          name: h.ten_huyet || h.code,
          viThuoc: h.vi_thuoc || undefined,
          han: h.han || undefined,
          yNghia: h.vai_tro && h.cong_nang ? `${h.vai_tro} — ${h.cong_nang}` : h.cong_nang || h.vai_tro || undefined,
        })),
      },
    ],
  }
  try {
    sessionStorage.setItem('kinhlac:acu-print-payload', JSON.stringify(payload))
  } catch {
    /* storage bị chặn — vẫn in được, chỉ mất tên/ghi chú, còn nguyên mã + chấm huyệt */
  }
  const url = router.resolve({
    name: 'kinh-mach-3d',
    query: { diagram: dung.map((h) => h.code).join(','), from: 'phuong-huyet', view: '2' },
  }).href
  const w = window.open(url, '_blank')
  if (!w) alert('Trình duyệt đang chặn cửa sổ mới. Cho phép pop-up cho trang này rồi thử lại.')
}

/** Mở tab mới, bay thẳng tới 1 huyệt trên Kinh Mạch 3D — xem "nó ở đâu" mà không rời trang đang đọc. */
export function moXem3D(router: Router, maHuyet: string | null | undefined) {
  const ma = chuanHoaMa(maHuyet)
  if (!ma) {
    alert('Huyệt này chưa có mã quốc tế nên chưa định vị được trên đồ hình 3D.')
    return
  }
  const url = router.resolve({ name: 'kinh-mach-3d', query: { focus: ma } }).href
  window.open(url, '_blank')
}

/** Tra mã huyệt theo TÊN (khớp chính xác, không phân biệt hoa/thường) — dùng cho nơi dữ liệu chỉ
 * ghi tên huyệt (vd menh_lenh của NHHT) chứ không kèm sẵn mã. Không khớp được thì bỏ qua, không đoán. */
export function traMaTheoTen(ten: string | null | undefined, danhSach: Array<{ ten_huyet: string | null; ma_huyet: string | null }>): string | null {
  const t = (ten || '').trim().toLowerCase()
  if (!t) return null
  const hit = danhSach.find((h) => (h.ten_huyet || '').trim().toLowerCase() === t)
  return hit?.ma_huyet || null
}
