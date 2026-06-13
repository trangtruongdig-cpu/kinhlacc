/**
 * acuMap3d.ts — Bộ quản lý "Đồ Hình Kinh Lạc 3D" (engine vanilla map3d.js + Three.js).
 *
 * Engine gốc (public/kinhmach3d/map3d.js) là IIFE: chạy MỘT lần khi tải, bám DOM theo id
 * (#mapStage, #mapReset…) và biến toàn cục (window.ACUPOINTS…). Để dùng trong SPA Vue mà
 * KHÔNG phải viết lại 64KB engine, ta:
 *   1) Nạp script + dữ liệu MỘT lần (boot), dựng sẵn khối DOM (#acu3dRoot) cho engine bám vào.
 *   2) Khi vào trang  → di chuyển khối DOM đó vào khung của component (mount).
 *   3) Khi rời trang  → trả khối DOM về chỗ ẩn (unmount) — GIỮ NGUYÊN 1 WebGL context,
 *      không tạo mới mỗi lần điều hướng (tránh rò rỉ context, trình duyệt chỉ cho ~16 context).
 *
 * Render-on-demand của engine tự dừng khi document.body.dataset.view != 'meridian', nên khi
 * ẩn đi gần như không tốn CPU/GPU.
 */

// Đường dẫn gốc tới thư mục asset trong public/ (tôn trọng BASE_URL khi deploy dưới sub-path).
export const BASE = `${import.meta.env.BASE_URL || '/'}kinhmach3d/`

// ── CACHE-BUSTING ──
// Các file engine 3D (map3d.js, data/*.js, model .glb…) GIỮ NGUYÊN TÊN qua mỗi lần deploy. Cấu hình
// nginx cũ từng phục vụ chúng kèm `Cache-Control: immutable` (1 năm) → trình duyệt nào đã tải về sẽ
// KHÔNG hỏi lại server suốt 1 năm, nên bản cập nhật (điểm chấm huyệt, đường kinh…) "không lên" trên
// các máy đó (hay gặp trên điện thoại đã mở tab 3D từ trước). Đổi header server sang no-cache KHÔNG
// cứu được các máy đã lỡ cache — chỉ ĐỔI URL mới cứu được. Vì vậy gắn ?v=<số build> vào mọi asset:
// mỗi lần build ra số mới → URL mới → trình duyệt coi là file mới → tải lại, bỏ qua bản cache cũ.
// __ACU_ASSET_VER__ do Vite define nhúng (xem vite.config.ts); typeof tránh lỗi nếu thiếu define.
declare const __ACU_ASSET_VER__: string
const ASSET_VER = typeof __ACU_ASSET_VER__ !== 'undefined' ? __ACU_ASSET_VER__ : ''
/** Ghép đường dẫn 1 asset trong /kinhmach3d/ kèm ?v=<ver> để phá cache trình duyệt theo mỗi build. */
function asset(path: string): string {
  return ASSET_VER ? `${BASE}${path}?v=${ASSET_VER}` : `${BASE}${path}`
}

// ── DỮ LIỆU THUẦN (không cần Three.js) ──
// Các file này chỉ gán window.ACUPOINTS / ACU_INDEX / ACU_COORDS3D / MERIDIANS / DICT_FACETS. Trang "Từ Điển"
// (tra cứu huyệt + lý thuyết kinh + tra theo Nguồn/Đặc Tính) chỉ cần chừng này → nạp riêng cho NHẸ, không kéo 3D.
// dict-facets.js (index tra ngược Nguồn↔Huyệt, Đặc Tính↔Huyệt) do _build-dict.cjs sinh ra — xem README-tu-dien-facets.md.
const DATA_SCRIPTS: string[] = [
  'data/acupoints.js',
  'data/acu-index.js',
  'data/acu-coords3d.js',
  'data/meridians.js',
  'data/dict-facets.js',
]

// ── ENGINE 3D ── (Three + bộ mở rộng + dữ liệu riêng của 3D + map3d). Nạp SAU phần dữ liệu thuần.
// map3d.js phải chạy sau khi THREE + toàn bộ dữ liệu trên + spacing/handfoot đã có (xem thứ tự THỰC THI bên dưới).
const ENGINE_SCRIPTS: string[] = [
  'vendor/three.min.js',
  'vendor/OrbitControls.js',
  'vendor/GLTFLoader.js',
  'vendor/meshopt_decoder.js',
  'data/spacing.js',
  'data/handfoot-bones.js',
  'map3d.js',
  'hand-foot-inset.js',
]

// Khối DOM mà engine bám vào — TRÙNG cấu trúc #meridian-map trong index.html của webapp gốc.
const HOST_HTML = `
  <div class="map-toolbar">
    <button id="mapReset" class="mv-btn active">↻ Đặt Lại Góc Nhìn</button>
    <button id="mapFlow" class="mv-btn" title="Bật/tắt dòng kinh khí chạy (tắt cho nhẹ)">✦ Dòng Chảy</button>
    <button id="mapMirror" class="mv-btn active" title="Hiện huyệt & đường kinh đối xứng cả hai bên">⇋ Hai Bên</button>
    <button id="mapInsetBtn" class="mv-btn" title="Phóng to bàn tay / bàn chân để xem từng huyệt móng, đốt, lòng bàn">✋ Bàn Tay/Chân</button>
    <button id="mapEdit" class="mv-btn" title="Chế độ Chấm tay: chọn 1 huyệt rồi bấm lên cơ thể để đặt/dời đúng vị trí">✎ Chấm Tay</button>
    <div class="map-layers" id="mapLayers" title="Trượt để bóc tách lớp giải phẫu (Da · Cơ · Xương)"></div>
    <div class="map-search">
      <input id="mapSearch" type="search" placeholder="Tìm huyệt / mã (CV4, Quan Nguyên)…" autocomplete="off" />
      <span id="mapCount" class="count dark"></span>
    </div>
  </div>
  <div class="map-body">
    <div class="map-stage" id="mapStage">
      <div class="map-credit" tabindex="0" role="note" aria-label="Nguồn mô hình giải phẫu">
        <span class="map-credit-i" aria-hidden="true">&#9432;</span>
        <span class="map-credit-text">Mô hình giải phẫu: BodyParts3D © DBCLS · CC BY-SA 2.1 JP</span>
      </div>
      <div class="hf-inset" id="hfInset"></div>
    </div>
    <aside class="map-drawer" id="mapDrawer">
      <div class="map-legend" id="mapLegend"></div>
      <div class="drawer-body" id="drawerBody"></div>
    </aside>
  </div>
`

let bootPromise: Promise<void> | null = null
let dictPromise: Promise<void> | null = null
let hostEl: HTMLElement | null = null
let parkingEl: HTMLElement | null = null

/** Nạp 1 script (đợi onload) và gắn vào <head>. */
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const el = document.createElement('script')
    el.src = src
    el.async = false // giữ đúng thứ tự thực thi
    el.onload = () => resolve()
    el.onerror = () => reject(new Error(`Không tải được script: ${src}`))
    document.head.appendChild(el)
  })
}

/** Nạp file CSS của viewer (1 lần). */
function ensureCss(): void {
  if (document.getElementById('acu3d-css')) return
  const link = document.createElement('link')
  link.id = 'acu3d-css'
  link.rel = 'stylesheet'
  link.href = asset('map.css')
  document.head.appendChild(link)
}

/**
 * Tải SẴN model .glb song song với đám script (1 lần).
 * Bình thường GLTFLoader chỉ bắt đầu tải model SAU khi map3d.js chạy — mà map3d.js phải đợi
 * acupoints.js (2.6MB) tải xong trước. Preload cho model tải CHỒNG lên lúc tải JS nên khi
 * map3d.js cần thì model đã sẵn → hiện model nhanh hơn rõ rệt.
 */
function ensureModelPreload(): void {
  if (document.getElementById('acu3d-model-preload')) return
  const link = document.createElement('link')
  link.id = 'acu3d-model-preload'
  link.rel = 'preload'
  link.as = 'fetch'
  link.href = asset('models/body-layers.glb')
  // KHÔNG đặt crossOrigin: GLTFLoader tải bằng XHR same-origin → để khớp request (tránh tải 2 lần).
  document.head.appendChild(link)
}

/**
 * Nạp DỮ LIỆU THUẦN một lần (window.ACUPOINTS / ACU_INDEX / ACU_COORDS3D / MERIDIANS) — KHÔNG kéo Three.js.
 * Trang "Từ Điển" (tra cứu huyệt + lý thuyết kinh) gọi hàm này; trang 3D cũng dùng lại đúng promise này
 * (xem ensureBooted) nên dữ liệu chỉ tải/parse 1 lần dù mở cả hai trang.
 */
export function ensureDictData(): Promise<void> {
  if (dictPromise) return dictPromise
  // Một vài chỗ (đường dẫn ảnh…) đọc window.ACU_MAP_BASE → đặt sẵn cho cả nhánh dùng dữ liệu thuần.
  ;(window as unknown as { ACU_MAP_BASE?: string }).ACU_MAP_BASE = BASE
  // el.async=false giữ ĐÚNG thứ tự THỰC THI dù các <script> tải song song.
  dictPromise = Promise.all(DATA_SCRIPTS.map((s) => loadScript(asset(s)))).then(() => undefined)
  return dictPromise
}

let benhPromise: Promise<void> | null = null
/**
 * Nạp riêng dữ liệu BỆNH (window.BENH = Châm Cứu Trị Bệnh + Bệnh Học) — MỘT lần.
 * CHỈ trang "Từ Điển" cần, nên KHÔNG nằm trong DATA_SCRIPTS → trang Kinh Mạch 3D không tải thừa ~2.3MB.
 * File này độc lập (chỉ gán window.BENH) nên nạp song song, không phụ thuộc thứ tự với dữ liệu khác.
 */
export function ensureBenhData(): Promise<void> {
  if (benhPromise) return benhPromise
  benhPromise = loadScript(asset('data/benh.js')).then(() => undefined)
  return benhPromise
}

/**
 * Khởi động engine MỘT lần: đặt base path, nạp CSS, dựng khối DOM (ẩn), nạp script.
 * Trả Promise dùng lại cho mọi lần gọi sau.
 */
export function ensureBooted(): Promise<void> {
  if (bootPromise) return bootPromise

  bootPromise = (async () => {
    // map3d.js đọc window.ACU_MAP_BASE để dựng đường dẫn model .glb cho đúng trong SPA.
    ;(window as unknown as { ACU_MAP_BASE?: string }).ACU_MAP_BASE = BASE
    // …và ACU_ASSET_VER để gắn ?v=<số build> vào URL model .glb (khớp với preload bên dưới, phá cache).
    ;(window as unknown as { ACU_ASSET_VER?: string }).ACU_ASSET_VER = ASSET_VER
    // Địa chỉ API backend cho tính năng "Chấm Tay" (lưu/tải chốt). Khớp với api.ts:
    //   dev  → http://localhost:3001 (gọi thẳng backend)
    //   prod → /api  (nginx VPS chuyển /api/* sang backend, cắt prefix /api)
    ;(window as unknown as { ACU_API_BASE?: string }).ACU_API_BASE =
      import.meta.env.VITE_API_URL || 'http://localhost:3001'

    ensureCss()
    ensureModelPreload() // bắt đầu tải model NGAY, song song với đám script bên dưới

    // Chỗ "đỗ" ẩn để giữ khối DOM khi không hiển thị (vẫn nằm trong document → getElementById thấy).
    parkingEl = document.createElement('div')
    parkingEl.id = 'acu3dParking'
    parkingEl.style.display = 'none'

    hostEl = document.createElement('div')
    hostEl.id = 'acu3dRoot'
    hostEl.className = 'acu3d'
    hostEl.innerHTML = HOST_HTML

    parkingEl.appendChild(hostEl)
    document.body.appendChild(parkingEl)

    // Nạp SONG SONG cả 2 nhóm: ensureDictData() chèn ngay các <script> dữ liệu (dùng chung promise với
    // trang Từ Điển → không tải lại), ENGINE_SCRIPTS chèn ngay sau đó. el.async=false bảo đảm THỨ TỰ THỰC
    // THI = thứ tự chèn (dữ liệu → THREE → map3d), nên map3d luôn thấy đủ globals + THREE. Tải vẫn đồng thời.
    const dict = ensureDictData()
    const engine = Promise.all(ENGINE_SCRIPTS.map((s) => loadScript(asset(s))))
    await Promise.all([dict, engine])
  })()

  return bootPromise
}

/**
 * Gắn đồ hình vào khung của component (trang Kinh Mạch 3D vừa mở).
 * Engine tự initScene khi #mapStage có kích thước (ResizeObserver nội bộ).
 */
export async function mountAcuMap(container: HTMLElement): Promise<void> {
  await ensureBooted()
  if (!hostEl) return
  container.appendChild(hostEl)
  // Bật render-on-demand của engine (vòng animate chỉ vẽ khi 2 cờ này đúng).
  document.body.dataset.view = 'meridian'
  document.body.dataset.msub = 'map'
}

/**
 * Tháo đồ hình khi rời trang: tắt render trước, rồi trả khối DOM về chỗ đỗ ẩn.
 * KHÔNG huỷ engine/WebGL context — lần sau mở lại tức thì.
 */
export function unmountAcuMap(): void {
  // Tắt render TRƯỚC để engine không vẽ lúc khung đang bị thu về size 0.
  if (document.body.dataset.view === 'meridian') delete document.body.dataset.view
  if (document.body.dataset.msub === 'map') delete document.body.dataset.msub
  if (hostEl && parkingEl) parkingEl.appendChild(hostEl)
}
