/**
 * Bộ thu tín hiệu phía trình duyệt cho tab "Góp Ý & Lỗi".
 *
 * BA luật bất di bất dịch của file này:
 *   1. KHÔNG BAO GIỜ ném lỗi ra ngoài. Bộ báo lỗi mà tự gây lỗi thì vừa mất tín hiệu vừa
 *      làm hỏng trang đang chạy — tệ hơn hẳn việc không có nó.
 *   2. KHÔNG báo lỗi của chính đường gửi báo cáo. Nếu không, một backend sập sẽ sinh vòng lặp
 *      vô tận: gửi hỏng → báo lỗi gửi hỏng → lại gửi hỏng.
 *   3. Có TRẦN cứng theo phiên. Một trang vỡ bắn hàng nghìn lỗi mỗi phút; không chặn ở đây thì
 *      máy người dùng và DB cùng gánh.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const DUONG_BAO = `${API_BASE}/su-co/bao`

/** Gom tín hiệu 5 giây rồi gửi một lượt — đỡ tốn kết nối trên mạng di động yếu. */
const NHIP_GUI_MS = 5000

/** Trần theo PHIÊN. Vượt là im lặng bỏ — 6 lần giống nhau không nói thêm gì so với 5. */
const TRAN_MOI_VAN_TAY = 5
const TRAN_CA_PHIEN = 20
const SO_VET_GIU = 20

/** API chậm hơn mốc này thì coi là tín hiệu trải nghiệm, không phải lỗi. */
const NGUONG_CHAM_MS = 3000

export type LoaiSuCoFE = 'loi_fe' | 'gop_y' | 'ux'

export interface TinHieu {
  loai: LoaiSuCoFE
  route?: string
  thongDiep: string
  stack?: string
  maLoi?: string
  httpStatus?: number
  breadcrumbs?: string[]
  nguCanh?: Record<string, unknown>
  trinhDuyet?: string
  phienBanApp?: string
  chanThaoTac?: boolean
  moTaNguoiDung?: string
  tieuDe?: string
}

// ── Trạng thái phiên ────────────────────────────────────────────────────────────────────

const vet: string[] = []
const demTheoVanTay = new Map<string, number>()
let demCaPhien = 0
let hangDoi: TinHieu[] = []
let henGui: ReturnType<typeof setTimeout> | null = null
let daKhoiDong = false

// ── Che dữ liệu (lớp thứ nhất; máy chủ che lại lớp thứ hai) ─────────────────────────────

const KHOA_CHE = new Set([
  'password',
  'pass',
  'pwd',
  'token',
  'access_token',
  'refresh_token',
  'authorization',
  'secret',
  'apikey',
  'api_key',
  'hoten',
  'ho_ten',
  'fullname',
  'sdt',
  'phone',
  'sodienthoai',
  'ngaysinh',
  'ngay_sinh',
  'diachi',
  'dia_chi',
  'address',
  'cccd',
  'cmnd',
  'email',
  'tiensu',
  'medicalhistory',
  'ghichu',
  'notes',
  'reason',
  'lydo',
])
const RE_SDT = /\b(?:0|\+84)\d{8,10}\b/g

function che(giaTri: unknown, sau = 0): unknown {
  if (giaTri == null) return giaTri
  if (typeof giaTri === 'string') {
    const s = giaTri.replace(RE_SDT, '***')
    return s.length > 300 ? s.slice(0, 300) + '…' : s
  }
  if (typeof giaTri !== 'object') return giaTri
  if (sau > 5) return '[sâu]'
  if (Array.isArray(giaTri)) return giaTri.slice(0, 20).map((v) => che(v, sau + 1))
  const ra: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(giaTri as Record<string, unknown>)) {
    ra[k] = KHOA_CHE.has(k.toLowerCase()) ? '***' : che(v, sau + 1)
  }
  return ra
}

// ── Vết (breadcrumbs) ───────────────────────────────────────────────────────────────────

/**
 * Ghi một thao tác vào vòng đệm 20 bước.
 *
 * Đây là thứ biến "lỗi không tái hiện được" thành "lỗi tái hiện được" — trong phần lớn trường
 * hợp còn quý hơn stack trace, vì stack nói lỗi vỡ Ở ĐÂU còn vết nói người dùng đã LÀM GÌ.
 */
export function ghiVet(noiDung: string): void {
  try {
    const gio = new Date().toLocaleTimeString('vi-VN')
    vet.push(`${gio} · ${String(noiDung).slice(0, 200)}`)
    while (vet.length > SO_VET_GIU) vet.shift()
  } catch {
    // Ghi vết hỏng thì thôi, không được làm gì hơn.
  }
}

// ── Gửi ─────────────────────────────────────────────────────────────────────────────────

function vanTayTho(t: TinHieu): string {
  return `${t.loai}|${(t.route || '').replace(/\d+/g, ':n')}|${t.thongDiep
    .toLowerCase()
    .replace(/\d+/g, ':n')
    .slice(0, 120)}`
}

function trinhDuyet(): string {
  try {
    return `${navigator.userAgent} · ${window.innerWidth}x${window.innerHeight}`.slice(0, 250)
  } catch {
    return ''
  }
}

/** Đẩy một tín hiệu vào hàng đợi. Mọi lối vào công khai đều đi qua đây. */
function xepHang(t: TinHieu): void {
  try {
    if (demCaPhien >= TRAN_CA_PHIEN) return
    const vt = vanTayTho(t)
    const dem = demTheoVanTay.get(vt) || 0
    if (dem >= TRAN_MOI_VAN_TAY) return
    demTheoVanTay.set(vt, dem + 1)
    demCaPhien += 1

    hangDoi.push({
      ...t,
      route: t.route ?? (typeof location !== 'undefined' ? location.pathname : ''),
      breadcrumbs: t.breadcrumbs ?? [...vet],
      trinhDuyet: t.trinhDuyet ?? trinhDuyet(),
      phienBanApp: import.meta.env.VITE_APP_VERSION || import.meta.env.MODE,
      nguCanh: che(t.nguCanh) as Record<string, unknown> | undefined,
      thongDiep: String(t.thongDiep).slice(0, 2000),
    })

    if (!henGui) henGui = setTimeout(guiNgay, NHIP_GUI_MS)
  } catch {
    // Im lặng — xem luật 1 ở đầu file.
  }
}

/** Gửi hàng đợi. `dungBeacon` cho lúc rời trang: fetch bị huỷ, sendBeacon thì không. */
function guiNgay(dungBeacon = false): void {
  try {
    if (henGui) {
      clearTimeout(henGui)
      henGui = null
    }
    if (!hangDoi.length) return

    const lo = JSON.stringify({ danhSach: hangDoi })
    hangDoi = []

    if (dungBeacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(DUONG_BAO, new Blob([lo], { type: 'application/json' }))
      return
    }

    const token = localStorage.getItem('access_token') || localStorage.getItem('patient_token')
    void fetch(DUONG_BAO, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: lo,
      // Cho phép request sống sót qua lúc chuyển trang.
      keepalive: true,
    }).catch(() => {
      // Gửi hỏng thì BỎ LUÔN, không thử lại và tuyệt đối không báo lỗi.
      // Xem luật 2 ở đầu file: đây là chỗ sinh vòng lặp vô tận nếu làm sai.
    })
  } catch {
    hangDoi = []
  }
}

// ── Lối vào công khai ───────────────────────────────────────────────────────────────────

export function baoLoi(t: Omit<TinHieu, 'loai'>): void {
  xepHang({ ...t, loai: 'loi_fe' })
}

export function baoUx(t: Omit<TinHieu, 'loai'>): void {
  xepHang({ ...t, loai: 'ux' })
}

/** Góp ý do người dùng tự gõ — gửi NGAY, không đợi nhịp 5 giây. */
export function baoGopY(tieuDe: string, moTa: string, nguCanh?: Record<string, unknown>): void {
  xepHang({
    loai: 'gop_y',
    thongDiep: tieuDe,
    tieuDe,
    moTaNguoiDung: moTa,
    nguCanh,
  })
  guiNgay()
}

/** Báo một lời gọi API hỏng. Gọi từ `api.ts` — nơi mọi request đều đi qua. */
export function baoLoiApi(
  method: string,
  path: string,
  status: number | null,
  thongDiep: string,
  msTroi: number,
): void {
  // Không bao giờ tự báo lỗi của chính đường báo lỗi (luật 2).
  if (path.startsWith('/su-co')) return

  // 401 là phiên hết hạn — chuyện thường ngày, không phải lỗi phần mềm.
  if (status === 401) return

  baoLoi({
    thongDiep: `${method} ${path} → ${status ?? 'NETWORK'}: ${thongDiep}`,
    maLoi: status ? `HTTP_${status}` : 'NETWORK',
    httpStatus: status ?? undefined,
    // Một lệnh GHI hỏng nghĩa là việc người dùng đang làm KHÔNG xong.
    chanThaoTac: ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method),
    nguCanh: { method, path, msTroi },
  })
}

/** Báo một lời gọi API quá chậm (không phải lỗi, nhưng người dùng đang phải chờ). */
export function baoApiCham(method: string, path: string, msTroi: number): void {
  if (path.startsWith('/su-co') || msTroi < NGUONG_CHAM_MS) return
  baoUx({
    thongDiep: `Chậm: ${method} ${path} mất ${Math.round(msTroi / 100) / 10}s`,
    nguCanh: { method, path, msTroi },
  })
}

// ── Khởi động ───────────────────────────────────────────────────────────────────────────

let lanBamCuoi = 0
let demBamLienTiep = 0

/**
 * Cắm các móc toàn cục. Gọi MỘT lần ở `main.ts`, trước khi mount app.
 */
export function khoiDongBaoSuCo(): void {
  if (daKhoiDong || typeof window === 'undefined') return
  daKhoiDong = true

  window.addEventListener('error', (e) => {
    // Lỗi tải tài nguyên (ảnh/script) có `e.error` rỗng — vẫn đáng báo, nhưng nội dung khác.
    const loi = e.error as Error | undefined
    baoLoi({
      thongDiep: loi?.message || e.message || 'Lỗi không rõ',
      stack: loi?.stack,
      maLoi: loi?.name || 'ERROR',
      nguCanh: { file: e.filename, dong: e.lineno },
    })
  })

  window.addEventListener('unhandledrejection', (e) => {
    const ly = e.reason as { message?: string; stack?: string; name?: string } | string
    baoLoi({
      thongDiep: typeof ly === 'string' ? ly : ly?.message || 'Promise bị từ chối',
      stack: typeof ly === 'string' ? undefined : ly?.stack,
      maLoi: typeof ly === 'string' ? 'REJECTION' : ly?.name || 'REJECTION',
    })
  })

  // Rời trang: đẩy nốt hàng đợi bằng sendBeacon. `pagehide` đáng tin hơn `beforeunload`
  // trên di động — Safari iOS thường không bắn `beforeunload` khi người dùng chuyển app.
  window.addEventListener('pagehide', () => guiNgay(true))
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') guiNgay(true)
  })

  // Vết: mỗi cú bấm ghi lại nhãn của thứ được bấm (không ghi nội dung ô nhập liệu).
  document.addEventListener(
    'click',
    (e) => {
      const el = e.target as HTMLElement | null
      if (!el) return
      const nhan = (el.closest('button,a,[role=button]') as HTMLElement | null)?.innerText
      ghiVet(`bấm: ${(nhan || el.tagName).slice(0, 60).replace(/\s+/g, ' ')}`)

      // Rage-click: bấm dồn dập cùng một chỗ = người dùng tưởng nút hỏng.
      const gio = Date.now()
      demBamLienTiep = gio - lanBamCuoi < 400 ? demBamLienTiep + 1 : 1
      lanBamCuoi = gio
      if (demBamLienTiep === 5) {
        baoUx({
          thongDiep: `Bấm dồn dập vào "${(nhan || el.tagName).slice(0, 60)}" — có vẻ không phản hồi`,
        })
        demBamLienTiep = 0
      }
    },
    { capture: true, passive: true },
  )
}

/** Cắm vào Vue Router để mỗi lần đổi trang đều thành một vết. */
export function ghiVetDoiTrang(duong: string): void {
  ghiVet(`mở trang ${duong}`)
}
