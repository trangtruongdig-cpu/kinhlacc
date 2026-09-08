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

// ── BẢN GỌN CHO BẢN ĐỒ 3D ──
// Engine 3D chỉ đọc sáu thứ của mỗi huyệt: id (link "Xem Thêm"), ten (nhãn), và bốn mục VỊ TRÍ /
// CHỦ TRỊ / CHÂM CỨU / GIẢI PHẪU (mục CHÂM CỨU còn dùng để suy góc kim — xem needleSpec trong
// map3d.js). Từ điển đầy đủ nặng 437KB sau gzip, bản gọn chỉ 98KB — bớt 339KB mỗi lần mở bản đồ.
// Sinh bằng data/_build-acu-3d.cjs, chạy lại mỗi khi acupoints.js đổi.
// dict-facets.js (index tra ngược Nguồn↔Huyệt) engine KHÔNG dùng → cũng bỏ khỏi nhánh 3D.
const DATA_SCRIPTS_3D: string[] = [
  'data/acupoints-3d.js',
  'data/acu-index.js',
  'data/acu-coords3d.js',
  'data/meridians.js',
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
  // Giai đoạn 3 — chỉ gán window.HUMAN_ATLAS_INDEX/HUMAN_ATLAS_VI, map3d.js đọc 2 biến này lúc
  // chạy (không bắt buộc — panel Hệ Cơ Quan tự ẩn tính năng nếu thiếu) nên phải nạp TRƯỚC map3d.js.
  'data/human-atlas-index.js',
  'data/human-atlas-vi.js',
  'data/meridian-paths.js',
  // Kết quả bắn tia "dán huyệt vào da" nướng sẵn (data/_build-surface-cache.cjs). Không có nó thì
  // lần vào trang ĐẦU TIÊN phải tự bắn ~4000 tia vào lưới da 30K tam giác — đo được 20 giây, tức
  // phần lớn thời gian chờ. Không bắt buộc: thiếu tệp thì map3d.js tính lại như cũ, chỉ chậm.
  'data/acu-surface-cache.js',
  'map3d.js',
  'hand-foot-inset.js',
]

// Khối DOM mà engine bám vào. BỐ CỤC ĐỔI HẲN theo góp ý người dùng ("lấy Human Atlas làm gốc, tuỳ
// biến theo"): không còn thanh công cụ cố định + sidebar cố định như app thường — canvas 3D
// (#mapStage) CHIẾM TRỌN khung, mọi điều khiển là THẺ NỔI (glass) đè lên canvas, đúng vị trí của
// app/page.tsx (github.com/ashemag/human-atlas): Hệ Cơ Quan góc trên-trái, tìm kiếm góc trên-phải,
// nút góc nhìn cạnh phải, Bóc Tách dưới-giữa, sheet chi tiết trượt vào từ phải CHỈ khi có lựa chọn.
// Panel "Hệ Cơ Quan" + panel "Chấm Tay" dựng bằng JS (nội dung phụ thuộc dữ liệu LAYERS) và tự
// chèn vào #mapStage — xem ensureSystemsPanel()/ensureEditPanel() trong map3d.js. Danh sách 14 đường
// kinh là TAB CON "Kinh Lạc" của panel đó (không còn thẻ chú giải #mapLegend nổi riêng).
const HOST_HTML = `
  <div class="map-body">
    <div class="map-stage" id="mapStage">
      <div class="map-search-stack">
        <div class="map-search glass">
          <input id="mapSearch" type="search" placeholder="Tìm huyệt / mã (CV4, Quan Nguyên)…" autocomplete="off" />
          <span id="mapCount" class="count dark"></span>
        </div>
        <div class="map-part-search glass">
          <input id="mapPartSearch" type="search" placeholder="Tìm bộ phận (tim, gan, xương đùi…)" autocomplete="off" />
          <div class="map-part-results glass" id="mapPartResults"></div>
        </div>
      </div>
      <div class="map-tools-float glass">
        <button id="mapView34" class="mv-btn view-btn active" data-view="three-quarter" title="Góc nhìn 3/4 (mặc định)">¾</button>
        <button id="mapViewFront" class="mv-btn view-btn" data-view="front" title="Nhìn thẳng mặt trước">Tr</button>
        <button id="mapViewSide" class="mv-btn view-btn" data-view="side" title="Nhìn nghiêng một bên">Ng</button>
        <button id="mapViewBack" class="mv-btn view-btn" data-view="back" title="Nhìn thẳng mặt sau (xem kinh Bàng Quang chạy dọc lưng)">Sa</button>
        <div class="mv-sep"></div>
        <button id="mapRotate" class="mv-btn" title="Tự xoay mô hình (tắt khi đã bóc tách hoặc đang xem riêng)">⟳</button>
        <div class="mv-sep"></div>
        <button id="mapFlow" class="mv-btn" title="Bật/tắt dòng kinh khí chạy (tắt cho nhẹ)">✦</button>
        <button id="mapMirror" class="mv-btn active" title="Hiện huyệt & đường kinh đối xứng cả hai bên">⇋</button>
        <button id="mapInsetBtn" class="mv-btn" title="Phóng to bàn tay / bàn chân để xem từng huyệt móng, đốt, lòng bàn">✋</button>
        <button id="mapEdit" class="mv-btn" title="Chế độ Chấm tay: chọn 1 huyệt rồi bấm lên cơ thể để đặt/dời đúng vị trí">✎</button>
        <div class="mv-sep"></div>
        <button id="mapSystems" class="mv-btn active" title="Ẩn/hiện panel Hệ Cơ Quan">🫀</button>
      </div>
      <div class="map-caption" id="mapCaption"><span class="map-caption-line"></span><span id="mapCaptionText">Cơ Thể Người Trưởng Thành</span><span class="map-caption-line"></span></div>
      <div class="map-explode-dock glass">
        <div class="msp-explode-main">
          <div class="msp-explode"><label>Bóc Tách (Explode) <span id="mspExplodeV">0%</span></label>
          <input type="range" id="mspExplode" min="0" max="100" step="1" value="0"></div>
          <div class="msp-explode-ends"><span>Lắp Ráp</span><span>Tách Rời</span></div>
        </div>
        <button type="button" class="dock-reset" id="mapResetAll" title="Lắp lại cơ thể, bật lại mọi hệ, bỏ chọn — về đúng trạng thái ban đầu">
          <span class="dock-reset-i" aria-hidden="true">↺</span><span>Đặt Lại</span>
        </button>
      </div>
      <div class="map-credit" tabindex="0" role="note" aria-label="Nguồn mô hình giải phẫu">
        <span class="map-credit-i" aria-hidden="true">&#9432;</span>
        <span class="map-credit-text">Mô hình giải phẫu: BodyParts3D © DBCLS · CC BY 4.0</span>
      </div>
      <div class="hf-inset" id="hfInset"></div>
      <aside class="map-drawer glass" id="mapDrawer">
        <button class="dr-close" id="drCloseBtn" title="Đóng" aria-label="Đóng">✕</button>
        <div class="drawer-body" id="drawerBody"></div>
        <div class="dr-actions" id="drActions" hidden>
          <button type="button" class="dr-primary" id="drIsolate" aria-pressed="false">
            <span class="dr-ico" aria-hidden="true">◎</span>
            <span class="dr-primary-label">Chỉ Xem Riêng Bộ Phận</span>
            <span class="dr-chev" aria-hidden="true">›</span>
          </button>
          <button type="button" class="dr-secondary" id="drClear">Bỏ Chọn</button>
        </div>
      </aside>
    </div>
  </div>
`

let bootPromise: Promise<void> | null = null
let dictPromise: Promise<void> | null = null
let dictLevel: 'full' | 'slim' | null = null
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
  // PHẢI đặt crossOrigin: với as='fetch', preload KHÔNG có crossOrigin đi ở chế độ khác với XHR của
  // GLTFLoader nên trình duyệt coi là hai tài nguyên riêng và tải 15MB HAI LẦN — im lặng, không cảnh
  // báo nào. Đo ngày 08/09/2026: có crossOrigin → 1 lần; bỏ đi → 2 lần. (Chú thích cũ ở đây dặn
  // NGƯỢC LẠI là sai, đã kiểm bằng trình duyệt.)
  link.crossOrigin = 'anonymous'
  link.href = asset('models/body-core.glb')
  // PHẢI TRÙNG ĐÚNG file map3d.js tải ĐẦU TIÊN (MODEL_URL). Ngày 08/09/2026 chỗ này còn trỏ
  // body-layers-v2.glb trong khi map3d.js đã chuyển sang body-core.glb → trình duyệt tải CẢ HAI,
  // 22MB + 14MB, trang chậm gấp đôi mà không có lỗi nào báo.
  document.head.appendChild(link)
}

/**
 * Nạp DỮ LIỆU THUẦN một lần (window.ACUPOINTS / ACU_INDEX / ACU_COORDS3D / MERIDIANS) — KHÔNG kéo Three.js.
 * Trang "Từ Điển" (tra cứu huyệt + lý thuyết kinh) gọi hàm này; trang 3D cũng dùng lại đúng promise này
 * (xem ensureBooted) nên dữ liệu chỉ tải/parse 1 lần dù mở cả hai trang.
 */
export function ensureDictData(): Promise<void> {
  return loadDict('full')
}

/**
 * Nạp dữ liệu huyệt ở MỘT TRONG HAI MỨC.
 *  'full' — từ điển đầy đủ, cho trang Từ Điển (cần noiDung/phối huyệt/xuất xứ… và dict-facets).
 *  'slim' — bản gọn cho bản đồ 3D (bớt 339KB sau gzip).
 *
 * BẪY PHẢI XỬ LÝ, VÌ NÓ IM LẶNG: hai mức cùng gán window.ACUPOINTS. Nếu người dùng mở Bản Đồ 3D
 * trước (nạp bản gọn) rồi sang Từ Điển, mà ta chỉ cache một promise chung thì Từ Điển sẽ dùng lại
 * bản gọn và các mục Xuất Xứ / Phối Huyệt / Tác Dụng biến mất — không lỗi, không cảnh báo, chỉ
 * thiếu chữ. Nên ở đây nhớ MỨC đã nạp: xin 'full' mà đang có 'slim' thì nạp đè bản đầy đủ.
 * Chiều ngược lại vô hại: đã có 'full' thì 3D dùng luôn, khỏi tải gì thêm.
 */
function loadDict(muc: 'full' | 'slim'): Promise<void> {
  if (dictPromise && (dictLevel === 'full' || muc === 'slim')) return dictPromise
  // Một vài chỗ (đường dẫn ảnh…) đọc window.ACU_MAP_BASE → đặt sẵn cho cả nhánh dùng dữ liệu thuần.
  ;(window as unknown as { ACU_MAP_BASE?: string }).ACU_MAP_BASE = BASE
  const ds = muc === 'full' ? DATA_SCRIPTS : DATA_SCRIPTS_3D
  const nap = () => Promise.all(ds.map((s) => loadScript(asset(s)))).then(() => undefined)
  dictLevel = muc
  /* PHẢI CHÈN NGAY, KHÔNG ĐƯỢC BỌC TRONG .then() — đây là lỗi đã làm trang trắng xoá một lần.
   * ensureBooted() chèn ENGINE_SCRIPTS ĐỒNG BỘ ngay sau khi gọi hàm này, và cả hai nhóm dựa vào
   * el.async=false để giữ thứ tự THỰC THI = thứ tự CHÈN (dữ liệu → THREE → map3d). Nếu nhánh nạp
   * lần đầu đi qua .then() thì nó chèn ở microtask, tức SAU engine — map3d.js chạy khi chưa có
   * window.ACUPOINTS và treo ở "Đang tải đồ hình…" vĩnh viễn, không có lỗi nào trong console.
   * Chỉ nhánh NÂNG CẤP slim→full mới được chờ, vì lúc ấy engine đã chạy xong từ lâu. */
  dictPromise = dictPromise ? dictPromise.then(nap) : nap()
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
    const dict = loadDict('slim')   // bản đồ 3D chỉ cần bản gọn
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
