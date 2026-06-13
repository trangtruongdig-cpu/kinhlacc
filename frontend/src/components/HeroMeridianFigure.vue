<script setup lang="ts">
/**
 * HeroMeridianFigure — Hình người kinh lạc 3D cho banner trang chủ.
 *
 * Dùng MÔ HÌNH THẬT (body-layers.glb — đúng file trang Kinh Mạch 3D) tô trong suốt phát sáng,
 * + các đường kinh chính phát sáng "chạy" dọc cơ thể (đốm khí trôi). Đường kinh được rải lên ĐÚNG
 * bề mặt mô hình bằng raycast — port gọn từ engine map3d.js (surfacePoint / limbPoint), nhưng đây là
 * cảnh RIÊNG, read-only, không toolbar/drawer, không kéo 2.6MB dữ liệu chi tiết huyệt.
 *
 * Toàn bộ tải TRỄ qua heroThree.ts; chỉ chạy khi banner thật sự hiện ra. Tự huỷ (giải phóng WebGL)
 * khi rời trang. Không có WebGL / lỗi tải → im lặng (banner có lớp rơi-về riêng).
 */
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { ensureModelDeps, fetchModelBuffer, hasWebGL } from '@/lib/heroThree'

const host = ref<HTMLDivElement | null>(null)

/**
 * Prop tuỳ chọn (mặc định TẮT — banner trang chủ giữ nguyên hành vi cũ):
 *  • interactive — cho người dùng KÉO để xoay (vẫn chỉ-xem, không có công cụ chỉnh sửa).
 *  • showPoints  — vẽ thêm CHẤM HUYỆT phát sáng trên các đường kinh.
 * Dùng cho trang Landing để "nhá hàng" đồ hình 3D ở chế độ chỉ-xem.
 */
const props = defineProps<{ interactive?: boolean; showPoints?: boolean }>()

// ── Tiến độ tải (cho người xem yên tâm chờ) ──
// Chia 3 việc: tải engine 3D (script) · tải mô hình .glb · dựng đường kinh — gộp về 1 thanh %.
const progress = ref(0) // 0..100, chỉ TĂNG (không lùi)
const loadState = ref<'idle' | 'loading' | 'done'>('idle')
const phaseLabel = ref('Đang Tải Hình Kinh Lạc 3D…')
let scriptsFrac = 0 // 0..1 — nhóm script (three.js…)
let modelFrac = 0 // 0..1 — file mô hình body-layers.glb
let buildFrac = 0 // 0..1 — dựng đường kinh (raycast)
// Trọng số theo dung lượng (KB): script ~738 · model ~612 → chia 90% cho "tải", 10% cho "dựng".
const W_SCRIPTS = 738
const W_MODEL = 612
function recompute() {
  const dl = (W_SCRIPTS * scriptsFrac + W_MODEL * modelFrac) / (W_SCRIPTS + W_MODEL) // 0..1 phần tải
  const overall = dl * 0.9 + buildFrac * 0.1
  const pct = Math.min(100, Math.round(overall * 100))
  if (pct > progress.value) progress.value = pct
  phaseLabel.value = dl < 1 ? 'Đang Tải Hình Kinh Lạc 3D…' : 'Đang Dựng Đường Kinh Lạc…'
}

/** Hiện canvas (mờ vào) — gọi khi ĐÃ đủ thân + đường kinh, để cả khối hiện cùng lúc. */
function revealCanvas() {
  if (renderer?.domElement) renderer.domElement.style.opacity = '1'
  buildFrac = 1
  progress.value = 100
  loadState.value = 'done' // lớp % mờ đi, nhường cho hình
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any

const BODY_H = 1.7 // chuẩn hoá chiều cao thân về 1.7 đơn vị (giống engine)

let T: Any = null // window.THREE
let raf = 0
let renderer: Any = null
let scene: Any = null
let camera: Any = null
let figure: Any = null // Group cha: mô hình + đường kinh (xoay cùng nhau)
let flows: { tex: Any; speed: number; phase: number }[] = [] // dải sáng "kinh khí" chạy dọc mỗi đường
const disposables: Any[] = []
let flowCanvas: HTMLCanvasElement | null = null

// Khung raycast (đặt sau khi nạp mô hình)
let raycaster: Any = null
let modelRoot: Any = null
let targets: Any[] = [] // mesh để bắn tia (mô hình 1-mesh → lấy hits[0] = mặt da ngoài)
let bodyMinY = 0
let bodyHeight = BODY_H

let ro: ResizeObserver | null = null
let io: IntersectionObserver | null = null
let bootIo: IntersectionObserver | null = null
let booted = false
let alive = true
let visible = true
let inView = true
let reduceMotion = false
let linesReady = false // dựng xong đường kinh → mới cho xoay (tránh raycast lệch khung khi đang xoay)
let flowT = 0 // thời gian tích luỹ cho dòng chảy "kinh khí"
let lastMs = 0 // mốc khung trước → tính delta thời gian (xoay đều theo thực thời gian)
let dragging = false // người dùng đang kéo xoay (chỉ ở chế độ interactive)
let lastX = 0
let lastY = 0

// ── Dữ liệu toạ độ (acu-coords3d.js → window.ACU_COORDS3D) ──
const COORDS = () => (window as unknown as { ACU_COORDS3D?: Any }).ACU_COORDS3D
const merOf = (code: string) => code.replace(/\d+$/, '')
const numOf = (code: string) => +code.replace(/\D/g, '')
const isBilateral = (mer: string) => mer !== 'CV' && mer !== 'GV'

// ── Chốt "Chấm Tay" (DB) → đè lên toạ độ tĩnh để banner KHỚP vị trí huyệt đã chỉnh tay ──
// Trang "Kinh Mạch 3D" lưu vị trí Chấm Tay vào DB, CHUẨN-HOÁ theo bodyHeight — ĐÚNG hệ mà limbPoint() ở đây
// dùng, nên đè thẳng vào C.points[mã] là khớp. acu-coords3d.js (file tĩnh) không có các chỉnh đó. Nạp chốt qua
// API /kinh-mach-3d/anchors (đã @Public → chạy cả khi CHƯA đăng nhập, cho landing công khai). Lỗi/anonymous/
// rỗng → bỏ qua, vẫn vẽ toạ độ tĩnh như cũ. LƯU Ý: KHÔNG chạy solver "Căn Tổng Thể" (cần đăng nhập) ở đây →
// banner chỉ DỜI đúng các huyệt đã chấm, không nội suy "gold" giữa các chốt như trang Kinh Mạch 3D.
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'
type Vec3 = { x: number; y: number; z: number }
let anchorOverride: Record<string, Vec3> | null = null
let anchorsPromise: Promise<Record<string, Vec3> | null> | null = null

/** Tải bộ chốt Chấm Tay từ API; trả { mã: {x,y,z} } hoặc null nếu lỗi/không có (không bao giờ ném lỗi). */
function fetchAnchors(): Promise<Record<string, Vec3> | null> {
  return fetch(`${API_BASE}/kinh-mach-3d/anchors`)
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => {
      const pts = (j && j.points) as Record<string, Vec3> | null
      if (!pts) return null
      const out: Record<string, Vec3> = {}
      for (const k in pts) {
        const p = pts[k]
        if (p && typeof p.x === 'number' && typeof p.y === 'number' && typeof p.z === 'number') {
          out[k] = { x: p.x, y: p.y, z: p.z }
        }
      }
      return Object.keys(out).length ? out : null
    })
    .catch(() => null)
}

/** C.points đã đè chốt Chấm Tay (nếu có): giữ nguyên cờ gốc, ép snap:false ở điểm bị đè (đặt ĐÚNG điểm). */
function withAnchors(base: Any): Any {
  if (!anchorOverride) return base
  const merged: Any = { ...base }
  for (const code in anchorOverride) {
    const a = anchorOverride[code]
    if (a) merged[code] = { ...(base[code] || {}), x: a.x, y: a.y, z: a.z, snap: false }
  }
  return merged
}

// ── Raycast: đặt huyệt THÂN/ĐẦU theo (h, az, dir) lên bề mặt (port từ engine surfacePoint) ──
function surfacePoint(h: number, az: number, dir?: string): Any | null {
  const y = bodyMinY + h * bodyHeight
  const azr = (az * Math.PI) / 180
  const o = new T.Vector3()
  const t = new T.Vector3()
  if (dir === 'top') {
    o.set(Math.sin(azr) * 0.04 * bodyHeight, bodyMinY + bodyHeight * 1.25, Math.cos(azr) * 0.06 * bodyHeight)
    t.set(0, y, Math.cos(azr) * 0.04 * bodyHeight)
  } else {
    const R = bodyHeight
    o.set(Math.sin(azr) * R, y, Math.cos(azr) * R)
    t.set(0, y, 0)
  }
  raycaster.set(o, t.clone().sub(o).normalize())
  const hits = raycaster.intersectObjects(targets, true)
  if (!hits.length) return null
  const p = hits[0].point.clone()
  const out = dir === 'top' ? new T.Vector3(0, 1, 0) : new T.Vector3(p.x, 0, p.z).normalize()
  return p.add(out.multiplyScalar(0.01 * bodyHeight))
}

// ── Raycast: đặt huyệt trên CHI theo (x, y, z) chuẩn-hoá, "dán" vào da gần nhất (port limbPoint) ──
const SNAP_DIRS = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
]
function limbPoint(p: Any): Any | null {
  const lp = new T.Vector3((p.x || 0) * bodyHeight, bodyMinY + (p.y || 0) * bodyHeight, (p.z || 0) * bodyHeight)
  if (p.snap === false) return lp // không dán da → giữ nguyên điểm trục chi
  const R = 0.45 * bodyHeight
  const dirs = p.snapDir === 'front' ? [[0, 0, 1]] : p.snapDir === 'back' ? [[0, 0, -1]] : SNAP_DIRS
  let best: Any = null
  let bestD = Infinity
  for (const d of dirs) {
    const [dx = 0, dy = 0, dz = 0] = d
    const o = new T.Vector3(lp.x + dx * R, lp.y + dy * R, lp.z + dz * R)
    raycaster.set(o, lp.clone().sub(o).normalize())
    const hits = raycaster.intersectObjects(targets, true)
    if (hits.length) {
      const dd = hits[0].point.distanceTo(lp)
      if (dd < bestD) {
        bestD = dd
        best = hits[0].point.clone()
      }
    }
  }
  if (!best) return lp
  const out = new T.Vector3(best.x, 0, best.z)
  return best.add((out.lengthSq() > 1e-9 ? out.normalize() : new T.Vector3(0, 0, 1)).multiplyScalar(0.01 * bodyHeight))
}

/** Toạ độ 3D của 1 huyệt; mirror=true để lấy bản đối xứng (bên phải). */
function pointOf(p: Any, mirror: boolean): Any | null {
  if (p.x !== undefined || p.y !== undefined || p.z !== undefined) {
    return limbPoint(mirror ? { ...p, x: -(p.x || 0) } : p)
  }
  if (mirror) {
    if (p.az % 180 === 0) return null // điểm giữa (trước/sau) không có bản gương
    return surfacePoint(p.h, (360 - p.az) % 360, p.dir)
  }
  return surfacePoint(p.h, p.az, p.dir)
}

/**
 * Texture "kinh khí": 1 dải dọc — nền sáng yếu (đường kinh luôn thấy) + 1 vạch sáng mạnh.
 * Lặp dọc ống + trượt offset mỗi khung → các vạch sáng CHẠY dọc đường kinh (dòng chảy).
 */
function getFlowCanvas(): HTMLCanvasElement {
  if (flowCanvas) return flowCanvas
  const c = document.createElement('canvas')
  c.width = 64
  c.height = 1
  const ctx = c.getContext('2d') as CanvasRenderingContext2D
  const g = ctx.createLinearGradient(0, 0, 64, 0)
  g.addColorStop(0.0, 'rgba(255,255,255,0.1)')
  g.addColorStop(0.42, 'rgba(255,255,255,0.1)')
  g.addColorStop(0.5, 'rgba(255,255,255,0.95)')
  g.addColorStop(0.58, 'rgba(255,255,255,0.1)')
  g.addColorStop(1.0, 'rgba(255,255,255,0.1)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 1)
  flowCanvas = c
  return c
}

/** Ống đường kinh phát sáng + dòng chảy (vạch sáng trôi dọc). */
function addGlowLine(pts: Any[], color: Any, phase: number, speed: number) {
  const curve = new T.CatmullRomCurve3(pts)
  const tubeR = 0.0072 * bodyHeight // mảnh vừa — rõ nét, không thành mảng loá
  const geo = new T.TubeGeometry(curve, Math.max(28, pts.length * 7), tubeR, 8, false)
  const tex = new T.CanvasTexture(getFlowCanvas())
  tex.wrapS = tex.wrapT = T.RepeatWrapping
  const len = curve.getLength()
  tex.repeat.set(Math.max(1, Math.round(len / (0.22 * bodyHeight))), 1) // số "vạch" dọc ống ~ đều nhau
  tex.offset.x = phase
  const mat = new T.MeshBasicMaterial({
    map: tex,
    color,
    transparent: true,
    opacity: 1,
    blending: T.AdditiveBlending,
    depthWrite: false,
    depthTest: true, // TÔN TRỌNG chiều sâu → chỉ thấy đường kinh MẶT TRƯỚC (mặt sau bị thân che) → rõ khối, bớt loá
  })
  disposables.push(geo, mat, tex)
  const mesh = new T.Mesh(geo, mat)
  mesh.renderOrder = 2 // sau thân (thân ghi độ sâu trước) để depthTest che đúng
  figure.add(mesh)
  flows.push({ tex, speed, phase })
}

// Sprite tròn (đốm sáng tâm trắng → tản dần) cho CHẤM HUYỆT.
let dotCanvas: HTMLCanvasElement | null = null
function getDotCanvas(): HTMLCanvasElement {
  if (dotCanvas) return dotCanvas
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const ctx = c.getContext('2d') as CanvasRenderingContext2D
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0.0, 'rgba(255,255,255,1)')
  g.addColorStop(0.35, 'rgba(255,255,255,0.85)')
  g.addColorStop(0.7, 'rgba(255,255,255,0.18)')
  g.addColorStop(1.0, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 64)
  dotCanvas = c
  return c
}

/** Vẽ TOÀN BỘ huyệt thành 1 đám chấm sáng (Points) — tô màu theo từng đường kinh. */
function addPoints(items: { pos: Any; color: Any }[]) {
  if (!items.length) return
  const geo = new T.BufferGeometry()
  const posArr = new Float32Array(items.length * 3)
  const colArr = new Float32Array(items.length * 3)
  items.forEach((it, i) => {
    posArr[i * 3] = it.pos.x
    posArr[i * 3 + 1] = it.pos.y
    posArr[i * 3 + 2] = it.pos.z
    colArr[i * 3] = it.color.r
    colArr[i * 3 + 1] = it.color.g
    colArr[i * 3 + 2] = it.color.b
  })
  geo.setAttribute('position', new T.BufferAttribute(posArr, 3))
  geo.setAttribute('color', new T.BufferAttribute(colArr, 3))
  const tex = new T.CanvasTexture(getDotCanvas())
  const mat = new T.PointsMaterial({
    size: 0.034 * bodyHeight,
    map: tex,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    depthTest: true, // TÔN TRỌNG chiều sâu → huyệt mặt sau bị thân che (khớp với đường kinh)
    blending: T.AdditiveBlending,
    sizeAttenuation: true,
  })
  disposables.push(geo, mat, tex)
  const cloud = new T.Points(geo, mat)
  cloud.renderOrder = 3 // trên đường kinh
  figure.add(cloud)
}

// Mỗi khung hình chỉ dành tối đa chừng này (ms) cho việc dựng → luôn còn chỗ cho render +
// giữ vòng Âm Dương (SVG xoay trên luồng chính) không bị khựng. ~8ms < 16ms (60fps) → mượt.
const FRAME_BUDGET_MS = 8

/**
 * Rải đường kinh lên bề mặt mô hình — RẢI DẦN qua nhiều khung hình theo NGÂN SÁCH THỜI GIAN:
 * mỗi khung raycast huyệt tới khi hết ~8ms thì NHƯỜNG khung sau (thay vì cố làm 1 lô lớn gây đơ);
 * xong mới dựng ống (cũng rải theo khung) rồi hiện ra. GIỮ figure đứng yên (rotation 0) trong lúc
 * raycast để mọi điểm cùng một hệ toạ độ.
 */
function buildMeridiansDeferred() {
  const C = COORDS()
  if (!C || !C.points) {
    console.warn('[HeroFigure] window.ACU_COORDS3D chưa có → không vẽ được đường kinh', C)
    linesReady = true
    revealCanvas() // vẫn hiện thân người dù thiếu đường kinh
    return
  }
  const placed = withAnchors(C.points) // đè chốt Chấm Tay (DB) lên toạ độ tĩnh, nếu có
  const codes = Object.keys(placed)
  const groups: Record<string, { mer: string; num: number; pos: Any }[]> = {}
  let idx = 0

  const step = () => {
    if (!alive || !renderer) return
    try {
      const start = performance.now()
      // Làm từng huyệt cho tới khi hết ngân sách thời gian khung này → nhường lại cho render/xoay.
      while (idx < codes.length) {
        const code = codes[idx]
        if (code === undefined) break
        const p = placed[code]
        const mer = merOf(code)
        const num = numOf(code)
        const left = pointOf(p, false)
        if (left) (groups[mer + '|L'] = groups[mer + '|L'] || []).push({ mer, num, pos: left })
        if (isBilateral(mer)) {
          const right = pointOf(p, true)
          if (right) (groups[mer + '|R'] = groups[mer + '|R'] || []).push({ mer, num, pos: right })
        }
        idx++
        if (performance.now() - start > FRAME_BUDGET_MS) break
      }
    } catch (e) {
      console.error('[HeroFigure] lỗi dựng đường kinh:', e)
      linesReady = true // lỗi → vẫn hiện + cho người tự xoay
      revealCanvas()
      return
    }
    // raycast chiếm 60% phần "dựng"; 40% còn lại để dành cho dựng ống bên dưới → % nhích đều cả 2 bước.
    buildFrac = codes.length ? (idx / codes.length) * 0.6 : 0.6
    recompute()
    if (idx < codes.length) {
      requestAnimationFrame(step)
      return
    }
    finalizeLinesDeferred(C, groups)
  }
  requestAnimationFrame(step)
}

/**
 * Dựng ống phát sáng từ các điểm đã raycast — cũng RẢI theo khung (mỗi khung ~8ms) để không khựng:
 * trước hết gom thành các "đoạn" cần vẽ (rẻ), rồi dựng ống vài cái/khung tới khi xong mới hiện ra.
 */
function finalizeLinesDeferred(C: Any, groups: Record<string, { mer: string; num: number; pos: Any }[]>) {
  const SPLIT = 0.16 * bodyHeight // nhảy không gian lớn (vd BL lưng↔chân) → cắt đoạn
  // Bước 1 (rẻ): gom mọi nhóm kinh|bên thành danh sách "đoạn" ống cần dựng.
  const jobs: { run: Any[]; color: Any; i: number }[] = []
  const pointItems: { pos: Any; color: Any }[] = [] // toạ độ + màu mọi huyệt (cho chế độ showPoints)
  let i = 0
  for (const key in groups) {
    const all = (groups[key] ?? []).sort((a, b) => a.num - b.num)
    const first = all[0]
    if (!first) continue
    const mer = first.mer
    const color = new T.Color(C.meridians[mer]?.color || '#ffd98a')
    if (props.showPoints) for (const it of all) pointItems.push({ pos: it.pos, color })
    const runs: Any[][] = []
    let cur: Any[] = [first.pos]
    for (let j = 1; j < all.length; j++) {
      const curPt = all[j]
      const prevPt = all[j - 1]
      if (!curPt || !prevPt) continue
      if (curPt.pos.distanceTo(prevPt.pos) > SPLIT) {
        runs.push(cur)
        cur = []
      }
      cur.push(curPt.pos)
    }
    runs.push(cur)
    for (const run of runs) {
      if (run.length < 2) continue
      jobs.push({ run, color, i })
      i++
    }
  }

  // Bước 2 (nặng): dựng ống (TubeGeometry + texture) — rải theo ngân sách thời gian từng khung.
  let j = 0
  const buildStep = () => {
    if (!alive || !renderer) return
    try {
      const start = performance.now()
      while (j < jobs.length) {
        const job = jobs[j]
        if (!job) { j++; continue }
        addGlowLine(job.run, job.color, (job.i * 0.137) % 1, 0.13 + (job.i % 4) * 0.03)
        j++
        if (performance.now() - start > FRAME_BUDGET_MS) break
      }
    } catch (e) {
      console.error('[HeroFigure] lỗi hoàn tất đường kinh:', e)
      linesReady = true
      revealCanvas()
      return
    }
    buildFrac = 0.6 + (jobs.length ? (j / jobs.length) * 0.4 : 0.4) // 60% → 100% phần "dựng"
    recompute()
    if (j < jobs.length) {
      requestAnimationFrame(buildStep)
      return
    }
    if (props.showPoints) addPoints(pointItems) // chấm huyệt vẽ 1 lần sau khi xong các ống
    linesReady = true
    revealCanvas() // ĐỦ thân + đường kinh (+ huyệt) → mới hiện cả khối ra
  }
  requestAnimationFrame(buildStep)
}

/** Chuẩn hoá mô hình (hướng, tỉ lệ, canh tâm) từ buffer .glb ĐÃ tải (đo % ở nơi gọi). Trả Promise. */
function parseModel(buf: ArrayBuffer): Promise<void> {
  return new Promise((resolve, reject) => {
    const loader = new T.GLTFLoader()
    const w = window as unknown as { MeshoptDecoder?: Any }
    if (w.MeshoptDecoder) loader.setMeshoptDecoder(w.MeshoptDecoder)
    loader.parse(
      buf,
      '',
      (gltf: Any) => {
        modelRoot = gltf.scene
        modelRoot.updateMatrixWorld(true)
        // Hướng: nếu Y là trục NHỎ NHẤT (Y = độ dày) thì model nằm → xoay cho đứng.
        let raw = new T.Box3().setFromObject(modelRoot)
        const rs = new T.Vector3()
        raw.getSize(rs)
        const min = Math.min(rs.x, rs.y, rs.z)
        if (rs.y === min) modelRoot.rotation.x = -Math.PI / 2
        modelRoot.updateMatrixWorld(true)

        // Thân = khối ngọc-đồng ấm, ĐỦ ĐẶC để thấy rõ hình khối + GHI ĐỘ SÂU (che đường kinh mặt sau).
        const bodyMat = new T.MeshStandardMaterial({
          color: 0x8a5d33,
          emissive: 0x241408,
          emissiveIntensity: 0.22,
          roughness: 0.72,
          metalness: 0,
          transparent: true,
          opacity: 0.55,
          depthWrite: true, // che đường kinh mặt sau → thấy chiều sâu, bớt loá (vẫn ghi bề mặt gần nhất dù DoubleSide)
          side: T.DoubleSide, // 2 mặt → raycast luôn bắt được bề mặt (an toàn cho việc dựng đường kinh)
        })
        disposables.push(bodyMat)
        targets = []
        modelRoot.traverse((o: Any) => {
          if (o.isSkinnedMesh && o.skeleton) o.skeleton.pose() // về tư thế bind cho raycast khớp
          if (o.isMesh) {
            o.material = bodyMat
            if (o.geometry && !o.geometry.attributes.normal) o.geometry.computeVertexNormals()
            o.frustumCulled = false
            targets.push(o)
          }
        })

        // Tỉ lệ + canh tâm (đặt tâm thân về gốc toạ độ để xoay đẹp).
        let box = new T.Box3().setFromObject(modelRoot)
        const size = new T.Vector3()
        box.getSize(size)
        modelRoot.scale.setScalar(BODY_H / size.y)
        modelRoot.updateMatrixWorld(true)
        box = new T.Box3().setFromObject(modelRoot)
        const ctr = new T.Vector3()
        box.getCenter(ctr)
        modelRoot.position.sub(ctr)
        modelRoot.updateMatrixWorld(true)
        box = new T.Box3().setFromObject(modelRoot)
        bodyMinY = box.min.y
        bodyHeight = box.max.y - box.min.y

        figure.add(modelRoot)
        figure.updateMatrixWorld(true) // để raycast (thực hiện ở world-space) đúng
        resolve()
      },
      (err: Any) => reject(err instanceof Error ? err : new Error(String(err))),
    )
  })
}

async function init(modelBuf: ArrayBuffer) {
  const el = host.value
  if (!el) return
  anchorsPromise = fetchAnchors() // nạp chốt Chấm Tay SONG SONG với việc tải/parse model (không chặn)
  const w = Math.max(1, el.clientWidth)
  const h = Math.max(1, el.clientHeight)

  scene = new T.Scene()
  camera = new T.PerspectiveCamera(30, w / h, 0.1, 50)
  camera.position.set(0, 0, 3.6) // nhìn thẳng vào tâm → người to & căn giữa khung
  camera.lookAt(0, 0, 0)

  renderer = new T.WebGLRenderer({ alpha: true, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setSize(w, h)
  renderer.setClearColor(0x000000, 0)
  if (T.sRGBEncoding !== undefined) renderer.outputEncoding = T.sRGBEncoding
  el.appendChild(renderer.domElement)
  renderer.domElement.style.display = 'block'
  renderer.domElement.style.opacity = '0' // ẩn tới khi đủ thân + đường kinh → hiện cả khối cùng lúc
  renderer.domElement.style.transition = 'opacity 0.7s ease'

  // Ánh sáng nền thấp + đèn chính chếch → thân có MẢNG SÁNG-TỐI (rõ hình khối, không bẹt/loá).
  scene.add(new T.AmbientLight(0xffffff, 0.42))
  const key = new T.PointLight(0xffe9c4, 1.35)
  key.position.set(1.8, 2.0, 2.6)
  scene.add(key)

  figure = new T.Group()
  scene.add(figure)
  raycaster = new T.Raycaster()

  await parseModel(modelBuf)
  if (!alive) return

  ro = new ResizeObserver(onResize)
  ro.observe(el)
  io = new IntersectionObserver((ents) => {
    inView = ents[0]?.isIntersecting ?? true
    if (inView && visible && alive && !raf) raf = requestAnimationFrame(loop)
  })
  io.observe(el)
  document.addEventListener('visibilitychange', onVisibility)
  reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

  // Chế độ chỉ-xem-tương-tác: cho KÉO để xoay (không có công cụ chỉnh sửa nào).
  if (props.interactive) {
    const cv = renderer.domElement
    cv.style.cursor = 'grab'
    cv.style.touchAction = 'none' // bắt được thao tác kéo, không cuộn trang
    cv.addEventListener('pointerdown', onPointerDown)
    cv.addEventListener('pointermove', onPointerMove)
    cv.addEventListener('pointercancel', onPointerUp)
    window.addEventListener('pointerup', onPointerUp) // bắt cả khi thả chuột ngoài canvas
  }

  // Render ngầm (canvas còn opacity 0) trong lúc dựng; revealCanvas() chỉ mờ-hiện khi ĐÃ đủ
  // thân + đường kinh → cả khối hiện cùng lúc (không "thân trước, đường kinh sau").
  raf = requestAnimationFrame(loop)
  // Đợi chốt Chấm Tay (đã fetch song song ở trên) rồi mới dựng đường kinh để đè đúng vị trí.
  anchorOverride = await anchorsPromise
  if (!alive) return
  buildMeridiansDeferred()
}

function onResize() {
  const el = host.value
  if (!el || !renderer || !camera) return
  const w = Math.max(1, el.clientWidth)
  const h = Math.max(1, el.clientHeight)
  renderer.setSize(w, h)
  camera.aspect = w / h
  camera.updateProjectionMatrix()
}

function onVisibility() {
  visible = !document.hidden
  ensureLoop()
}

/** Bật lại vòng lặp nếu đang dừng (sau khi kéo xoay ở chế độ reduceMotion, đổi tab…). */
function ensureLoop() {
  if (alive && visible && inView && !raf) raf = requestAnimationFrame(loop)
}

function loop(ms: number) {
  raf = 0
  if (!alive) return

  const dt = lastMs ? Math.min(0.05, (ms - lastMs) / 1000) : 0
  lastMs = ms

  // Chỉ xoay + chạy dòng chảy SAU khi đường kinh đã dựng xong (lúc raycast giữ figure đứng yên).
  if (linesReady && !reduceMotion) {
    if (!dragging) figure.rotation.y += dt * 0.45 // tự xoay quanh trục dọc (~14s/vòng); tạm dừng khi đang kéo
    flowT += dt
    for (const f of flows) f.tex.offset.x = f.phase - flowT * f.speed // vạch sáng chạy dọc đường kinh
  }

  renderer.render(scene, camera)

  // Đứng yên (giảm chuyển động, không kéo) → vẽ nốt 1 khung rồi DỪNG để đỡ tốn pin.
  // Người dùng kéo (interactive) sẽ gọi ensureLoop() để vẽ lại khung mới.
  if (linesReady && reduceMotion && !dragging) return
  if (visible && inView) raf = requestAnimationFrame(loop)
}

// ── Kéo để xoay (chỉ khi interactive, sau khi đã dựng xong đường kinh) ──
function onPointerDown(e: PointerEvent) {
  if (!props.interactive || !linesReady || !figure) return
  dragging = true
  lastX = e.clientX
  lastY = e.clientY
  if (renderer?.domElement) renderer.domElement.style.cursor = 'grabbing'
  renderer?.domElement?.setPointerCapture?.(e.pointerId)
  ensureLoop()
}
function onPointerMove(e: PointerEvent) {
  if (!dragging || !figure) return
  const dx = e.clientX - lastX
  const dy = e.clientY - lastY
  lastX = e.clientX
  lastY = e.clientY
  figure.rotation.y += dx * 0.01 // kéo ngang → xoay quanh trục dọc
  figure.rotation.x = Math.max(-0.6, Math.min(0.6, figure.rotation.x + dy * 0.006)) // kéo dọc → nghiêng nhẹ (có chặn)
  ensureLoop()
}
function onPointerUp(e: PointerEvent) {
  if (!dragging) return
  dragging = false
  if (renderer?.domElement) renderer.domElement.style.cursor = 'grab'
  renderer?.domElement?.releasePointerCapture?.(e.pointerId)
}

async function boot() {
  if (booted || !alive) return
  booted = true
  loadState.value = 'loading'
  scriptsFrac = modelFrac = buildFrac = 0
  progress.value = 0
  try {
    // Tải SONG SONG: script engine 3D + dữ liệu .glb — mỗi phần báo % riêng, gộp về 1 thanh.
    let buf!: ArrayBuffer
    await Promise.all([
      ensureModelDeps((f) => {
        scriptsFrac = f
        recompute()
      }).then((t) => {
        T = t
      }),
      fetchModelBuffer((f) => {
        modelFrac = f
        recompute()
      }).then((b) => {
        buf = b
      }),
    ])
    if (!alive) return
    await init(buf)
  } catch {
    // Lỗi tải/khởi tạo → im lặng; ẩn lớp % và banner dùng lớp rơi-về.
    loadState.value = 'done'
  }
}

onMounted(() => {
  if (!hasWebGL()) return
  const el = host.value
  if (!el) return
  // Chỉ tải Three/mô hình khi banner THỰC SỰ hiện (bỏ qua khi ẩn trên mobile, hoãn tới khi cuộn tới).
  bootIo = new IntersectionObserver((ents) => {
    if (ents.some((e) => e.isIntersecting)) {
      bootIo?.disconnect()
      bootIo = null
      boot()
    }
  })
  bootIo.observe(el)
})

onBeforeUnmount(() => {
  alive = false
  if (raf) cancelAnimationFrame(raf)
  document.removeEventListener('visibilitychange', onVisibility)
  window.removeEventListener('pointerup', onPointerUp)
  bootIo?.disconnect()
  ro?.disconnect()
  io?.disconnect()
  for (const d of disposables) d.dispose?.()
  disposables.length = 0
  // Dọn geometry của mô hình (vật liệu đã nằm trong disposables).
  modelRoot?.traverse?.((o: Any) => o.geometry?.dispose?.())
  flows = []
  targets = []
  if (renderer) {
    renderer.dispose()
    renderer.forceContextLoss?.()
    renderer.domElement?.remove()
    renderer = null
  }
  scene = null
  camera = null
  figure = null
  modelRoot = null
  raycaster = null
})
</script>

<template>
  <div ref="host" class="hero-figure" :class="{ 'is-interactive': interactive }" aria-hidden="true">
    <!-- Vòng tròn % tải — hiện trong lúc tải engine 3D + mô hình + dựng đường kinh, mờ đi khi xong -->
    <div v-if="loadState !== 'idle'" class="hf-loader" :class="{ 'is-done': loadState === 'done' }">
      <div class="hf-ring" :style="{ '--p': progress }">
        <span class="hf-pct">{{ progress }}<small>%</small></span>
      </div>
      <span class="hf-label">{{ phaseLabel }}</span>
    </div>
  </div>
</template>

<style scoped>
.hero-figure {
  position: relative;
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 0 14px rgba(255, 224, 170, 0.28));
}
/* Chế độ chỉ-xem-tương-tác: nhận thao tác kéo (con trỏ "grab" do JS đặt trên canvas). */
.hero-figure.is-interactive {
  pointer-events: auto;
  touch-action: none;
}
.hero-figure :deep(canvas) {
  width: 100% !important;
  height: 100% !important;
  display: block;
}

/* ---------- Vòng tròn % tải ---------- */
.hf-loader {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  opacity: 1;
  transition: opacity 0.5s ease;
  pointer-events: none;
}
.hf-loader.is-done {
  opacity: 0; /* tải xong → mờ đi, nhường chỗ cho hình người hiện ra */
}
/* Vòng tiến độ vẽ bằng conic-gradient theo biến --p (0..100) */
.hf-ring {
  --p: 0;
  position: relative;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: conic-gradient(#ffe0aa calc(var(--p) * 1%), rgba(255, 255, 255, 0.16) 0);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 18px rgba(255, 224, 170, 0.25);
  animation: hf-breathe 2.4s ease-in-out infinite;
}
.hf-ring::after {
  content: '';
  position: absolute;
  inset: 8px;
  border-radius: 50%;
  background: rgba(20, 11, 4, 0.74); /* "lỗ" giữa vòng — tông tối ấm khớp banner */
}
.hf-pct {
  position: relative;
  z-index: 1;
  color: #fff;
  font-weight: 700;
  font-size: 20px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.hf-pct small {
  font-size: 12px;
  font-weight: 600;
  opacity: 0.75;
  margin-left: 1px;
}
.hf-label {
  color: rgba(255, 255, 255, 0.88);
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
}
@keyframes hf-breathe {
  0%,
  100% {
    box-shadow: 0 0 14px rgba(255, 224, 170, 0.2);
  }
  50% {
    box-shadow: 0 0 26px rgba(255, 224, 170, 0.4);
  }
}
@media (prefers-reduced-motion: reduce) {
  .hf-ring {
    animation: none;
  }
}
</style>
