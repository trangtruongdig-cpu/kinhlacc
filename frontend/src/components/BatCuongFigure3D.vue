<script setup lang="ts">
/**
 * BatCuongFigure3D — Hình người kinh lạc 3D CHỈ-XEM cho bảng "Bát Cương" (chẩn đoán Đông Y).
 *
 * FORK của HeroMeridianFigure.vue: dùng lại TOÀN BỘ đường ống Three.js (tải mô hình qua heroThree.ts,
 * rải đường kinh bằng raycast, ống phát sáng + dòng chảy, dựng-trễ theo ngân sách khung, vòng % tải,
 * lazy-boot qua IntersectionObserver, tự huỷ). Khác biệt: KHÔNG còn là banner trang trí — đây là đồ
 * hình TÔ MÀU theo CHẨN ĐOÁN: mỗi đường kinh đo được tô theo hàn/nhiệt; kinh không đo → xám mờ. Có thể
 * "soi" 1 tạng (click), thêm 2 quầng sáng Khí/Huyết (hư–thực). Recolor KHÔNG dựng lại hình học.
 *
 * Khi không có WebGL / lỗi tải → render DEFAULT SLOT (cha truyền hình 2D rơi-về vào).
 */
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { ensureModelDeps, fetchModelBuffer, hasWebGL } from '@/lib/heroThree'

// ── Props & emits ──
interface OrganState {
  name: string // mã kinh NGẮN (đo): một trong Tiểu,Tâm,Tam,Bào,Đại,Phế,Bàng,Thận,Đởm,Vị,Can,Tỳ
  label: string
  organ: string
  side: string
  depth: 'bieu' | 'ly' | 'mixed'
  temp: 'han' | 'nhiet' | 'mixed'
}
const props = defineProps<{
  amDuong: string
  khi: string
  huyet: string
  organs: OrganState[]
  focus: string | null
  gender?: string | null // 'Nam' | 'Nữ' | null — chọn thân hình 3D nam/nữ theo bệnh nhân
}>()

/** Giới tính bệnh nhân → biến thể thân hình ('Nữ' → nữ, còn lại → nam). */
function bodyVariant(): 'male' | 'female' {
  return (props.gender || '').includes('Nữ') ? 'female' : 'male'
}
const emit = defineEmits<{ (e: 'toggle', key: string): void }>()

const host = ref<HTMLDivElement | null>(null)
const canRender = ref(true) // false → render slot rơi-về (không WebGL / lỗi tải/khởi tạo)

// ── Tiến độ tải (giữ y như reference: gộp 3 việc về 1 thanh %) ──
const progress = ref(0)
const loadState = ref<'idle' | 'loading' | 'done'>('idle')
const phaseLabel = ref('Đang Tải Hình Kinh Lạc 3D…')
let scriptsFrac = 0
let modelFrac = 0
let buildFrac = 0
const W_SCRIPTS = 738
const W_MODEL = 612
function recompute() {
  const dl = (W_SCRIPTS * scriptsFrac + W_MODEL * modelFrac) / (W_SCRIPTS + W_MODEL)
  const overall = dl * 0.9 + buildFrac * 0.1
  const pct = Math.min(100, Math.round(overall * 100))
  if (pct > progress.value) progress.value = pct
  phaseLabel.value = dl < 1 ? 'Đang Tải Hình Kinh Lạc 3D…' : 'Đang Dựng Đường Kinh Lạc…'
}

/** Hiện canvas (mờ vào) — gọi khi ĐÃ đủ thân + đường kinh. Tô màu chẩn đoán ngay khi hiện. */
function revealCanvas() {
  onResize() // đồng bộ cỡ canvas với host SAU khi layout đã ổn (panel hẹp/cao bất thường)
  applyStyles() // tô màu theo chẩn đoán + xin vẽ 1 khung (ensureLoop) trước khi hiện ra
  if (renderer?.domElement) renderer.domElement.style.opacity = '1'
  buildFrac = 1
  progress.value = 100
  loadState.value = 'done'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any

const BODY_H = 1.7

let T: Any = null
let raf = 0
let renderer: Any = null
let scene: Any = null
let camera: Any = null
let figure: Any = null
const disposables: Any[] = []

let raycaster: Any = null
let modelRoot: Any = null
let targets: Any[] = []
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
let linesReady = false
let lastMs = 0
let dragging = false
let moved = false // pointer đã DI CHUYỂN đủ xa → coi là KÉO (không phải click "soi")
let downX = 0
let downY = 0
let lastX = 0
let lastY = 0

// ── Map mã kinh NGẮN (đo) → khoá 3D (Western abbr trong window.ACU_COORDS3D.meridians) ──
const MER3D: Record<string, string> = {
  Tiểu: 'SI',
  Tâm: 'HT',
  Tam: 'TE',
  Bào: 'PC',
  Đại: 'LI',
  Phế: 'LU',
  Bàng: 'BL',
  Thận: 'KI',
  Đởm: 'GB',
  Vị: 'ST',
  Can: 'LR',
  Tỳ: 'SP',
}
const UPPER_LIMB = new Set(['SI', 'HT', 'TE', 'PC', 'LI', 'LU']) // chi trên = Khí
const LOWER_LIMB = new Set(['BL', 'KI', 'GB', 'ST', 'LR', 'SP']) // chi dưới = Huyết

// ── Tô màu/độ mờ từng đường kinh: phản chiếu vật liệu (recolor không dựng lại hình học) ──
// merMats[mer3D] = các material LÕI của mọi ống thuộc kinh đó; merHalos = các material QUẦNG (loang).
const merMats: Record<string, Any[]> = {}
const merHalos: Record<string, Any[]> = {} // ống quầng to, mờ → bật lên khi kinh được CHỌN (loang ra lân cận)

/** stateByMer3D: Map<3Dkey, OrganState> dựng từ props.organs (mã ngắn → khoá 3D). */
function stateByMer3D(): Map<string, OrganState> {
  const m = new Map<string, OrganState>()
  for (const o of props.organs) {
    const k = MER3D[o.name]
    if (k) m.set(k, o)
  }
  return m
}

// Tạng phủ (state) thuộc 1 NHÓM theo TÍNH CHẤT: Biểu/Lý (độ sâu) · Hàn/Nhiệt (tính chất); 'mixed' tính cả hai.
function inGroup(st: OrganState, g: string): boolean {
  if (g === 'bieu') return st.depth === 'bieu' || st.depth === 'mixed'
  if (g === 'ly') return st.depth === 'ly' || st.depth === 'mixed'
  if (g === 'han') return st.temp === 'han' || st.temp === 'mixed'
  if (g === 'nhiet') return st.temp === 'nhiet' || st.temp === 'mixed'
  return false
}
// 1 đường kinh (mer 3D) thuộc nhóm: Khí/Huyết theo BỘ KINH cố định (chi trên/chi dưới) · còn lại theo state.
function meridianInGroup(mer: string, st: OrganState | undefined, g: string): boolean {
  if (g === 'khi') return UPPER_LIMB.has(mer)
  if (g === 'huyet') return LOWER_LIMB.has(mer)
  return !!st && inGroup(st, g)
}

/** Màu + độ mờ + cường độ phát quang MỤC TIÊU cho 1 đường kinh theo chẩn đoán + tiêu điểm. */
function meridianStyle(mer: string): { hex: string; opacity: number; emi: number } {
  const st = stateByMer3D().get(mer)
  let hex: string
  let opacity: number
  let emi: number
  if (st) {
    hex = st.temp === 'han' ? '#2f6690' : st.temp === 'nhiet' ? '#c0452a' : '#8a4fbf' // mixed = tím
    opacity = 0.98
    emi = 0.9 // kinh đo được → phát quang mạnh (đó là Bát Cương)
  } else {
    hex = '#9aa6b2' // xám nhạt — kinh chưa đo
    opacity = 0.5
    emi = 0.35
  }
  const focus = props.focus
  if (focus) {
    if (focus.startsWith('organ:')) {
      // kinh của tạng đang soi (kể cả tạng CHƯA đo) → giữ sáng; các kinh khác mờ HẲN để cô lập.
      const focusMer = MER3D[focus.slice(6)]
      if (mer !== focusMer) {
        opacity *= 0.22
        emi *= 0.35
      }
    } else if (focus.startsWith('group:')) {
      // soi cả 1 NHÓM (Biểu/Lý/Hàn/Nhiệt/Khí/Huyết) → mọi kinh trong nhóm sáng, ngoài nhóm mờ.
      if (!meridianInGroup(mer, st, focus.slice(6))) {
        opacity *= 0.22
        emi *= 0.35
      }
    } else if (focus === 'khi') {
      if (!UPPER_LIMB.has(mer)) {
        opacity *= 0.35
        emi *= 0.4
      }
    } else if (focus === 'huyet') {
      if (!LOWER_LIMB.has(mer)) {
        opacity *= 0.35
        emi *= 0.4
      }
    }
    // focus === 'amDuong' → giữ nguyên tất cả
  }
  return { hex, opacity, emi }
}

/** Quầng LOANG: bật khi kinh được CHỌN riêng, HOẶC khi soi cả nhóm và kinh thuộc nhóm đó. */
function haloStyle(mer: string): { hex: string; opacity: number; emi: number } {
  const st = stateByMer3D().get(mer)
  if (!st) return { hex: '#000000', opacity: 0, emi: 0 }
  const hex = st.temp === 'han' ? '#2f6690' : st.temp === 'nhiet' ? '#c0452a' : '#8a4fbf'
  const f = props.focus
  const selected = f === 'organ:' + st.name || (!!f && f.startsWith('group:') && meridianInGroup(mer, st, f.slice(6)))
  return { hex, opacity: selected ? 0.32 : 0, emi: selected ? 0.9 : 0 }
}

/** Tô lại đường kinh (ống PHÁT QUANG đặc — hiện rõ trên nền sáng) + quầng loang theo props (không dựng lại hình học). */
function applyStyles() {
  if (!T) return
  for (const mer in merMats) {
    const { hex, opacity, emi } = meridianStyle(mer)
    const c = new T.Color(hex)
    for (const mat of merMats[mer] ?? []) {
      mat.color.copy(c).multiplyScalar(0.8)
      if (mat.emissive) mat.emissive.copy(c)
      mat.emissiveIntensity = emi
      mat.opacity = opacity
      mat.needsUpdate = true
    }
  }
  for (const mer in merHalos) {
    const { hex, opacity, emi } = haloStyle(mer)
    const c = new T.Color(hex)
    for (const mat of merHalos[mer] ?? []) {
      mat.color.copy(c).multiplyScalar(0.6)
      if (mat.emissive) mat.emissive.copy(c)
      mat.emissiveIntensity = emi
      mat.opacity = opacity
      mat.visible = opacity > 0.001 // tắt hẳn khi không chọn → không tốn vẽ + sạch hình
      mat.needsUpdate = true
    }
  }
  applyAura()
  // prefers-reduced-motion: vòng lặp đã dừng sau khi dựng → xin VẼ 1 khung để recolor/soi hiện ra.
  ensureLoop()
}

const COORDS = () => (window as unknown as { ACU_COORDS3D?: Any }).ACU_COORDS3D
const merOf = (code: string) => code.replace(/\d+$/, '')
const numOf = (code: string) => +code.replace(/\D/g, '')
const isBilateral = (mer: string) => mer !== 'CV' && mer !== 'GV'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'
type Vec3 = { x: number; y: number; z: number }
let anchorOverride: Record<string, Vec3> | null = null
let anchorsPromise: Promise<Record<string, Vec3> | null> | null = null

/** Tải bộ chốt Chấm Tay từ API (giống reference): { mã: {x,y,z} } hoặc null nếu lỗi/không có. */
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

function withAnchors(base: Any): Any {
  if (!anchorOverride) return base
  const merged: Any = { ...base }
  for (const code in anchorOverride) {
    const a = anchorOverride[code]
    if (a) merged[code] = { ...base[code], x: a.x, y: a.y, z: a.z, snap: false }
  }
  return merged
}

// ── Raycast: đặt huyệt THÂN/ĐẦU lên bề mặt (port từ engine surfacePoint) ──
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

// ── Raycast: đặt huyệt trên CHI, "dán" vào da gần nhất (port limbPoint) ──
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
  if (p.snap === false) return lp
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
    if (p.az % 180 === 0) return null
    return surfacePoint(p.h, (360 - p.az) % 360, p.dir)
  }
  return surfacePoint(p.h, p.az, p.dir)
}

// Sprite tròn (đốm sáng tâm trắng → tản dần) — dùng cho quầng Khí/Huyết.
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

const lineMeshes: Any[] = [] // các ống đường kinh để raycast click "soi"

/**
 * Ống đường kinh ĐẶC, PHÁT QUANG (MeshStandardMaterial emissive) — kiểu của trang Kinh Mạch 3D, hiện
 * rõ trên nền SÁNG (khác hero dùng AdditiveBlending chỉ nổi trên nền tối). Lưu material vào merMats để
 * recolor sau; userData {mer,name} cho click "soi".
 */
function addGlowLine(pts: Any[], mer: string, name: string | null) {
  const curve = new T.CatmullRomCurve3(pts, false, 'centripetal')
  // Kinh ĐÃ ĐO (name != null) → ống dày hơn (nổi bật, là Bát Cương); kinh chưa đo → mảnh.
  const tubeR = (name ? 0.0023 : 0.0012) * bodyHeight
  const geo = new T.TubeGeometry(curve, Math.max(28, pts.length * 6), tubeR, 6, false)
  const { hex, opacity, emi } = meridianStyle(mer)
  const c = new T.Color(hex)
  const mat = new T.MeshStandardMaterial({
    color: c.clone().multiplyScalar(0.8),
    emissive: c.clone(),
    emissiveIntensity: emi,
    roughness: 0.35,
    metalness: 0,
    transparent: true,
    opacity,
    depthTest: true,
  })
  disposables.push(geo, mat)
  ;(merMats[mer] = merMats[mer] || []).push(mat)
  const mesh = new T.Mesh(geo, mat)
  mesh.renderOrder = 3
  mesh.userData = { mer, name } // name != null → kinh ĐÃ ĐO → cho phép click "soi"
  figure.add(mesh)
  lineMeshes.push(mesh)

  // Kinh ĐÃ ĐO → thêm 1 ống QUẦNG to, mờ (tắt sẵn) → bật loang ra khi kinh được CHỌN.
  if (name) {
    const haloGeo = new T.TubeGeometry(curve, Math.max(20, pts.length * 4), 0.011 * bodyHeight, 6, false)
    const haloMat = new T.MeshStandardMaterial({
      color: c.clone().multiplyScalar(0.6),
      emissive: c.clone(),
      emissiveIntensity: 0,
      roughness: 0.6,
      metalness: 0,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: true,
    })
    haloMat.visible = false
    disposables.push(haloGeo, haloMat)
    ;(merHalos[mer] = merHalos[mer] || []).push(haloMat)
    const haloMesh = new T.Mesh(haloGeo, haloMat)
    haloMesh.renderOrder = 2 // sau thân, trước lõi (lõi = 3) → quầng ôm quanh lõi
    figure.add(haloMesh)
  }
}

// ── Quầng Khí / Huyết (Hư–Thực): 2 sprite phát sáng mềm theo trục thân ──
let auraKhi: Any = null // quầng trên (ngực) = Khí
let auraHuyet: Any = null // quầng dưới (bụng) = Huyết

/** Màu + độ mờ quầng từ chuỗi mô tả Hư/Thực (Thịnh). Rỗng → ẩn. */
function tone(s: string): { hex: string; opacity: number } {
  const v = (s || '').toLowerCase()
  if (!v) return { hex: '#ffffff', opacity: 0 } // rỗng → ẩn
  if (v.includes('thịnh') || v.includes('thực')) return { hex: '#d08a5a', opacity: 0.22 } // thực/thịnh → ấm
  // LƯU Ý: "Bình thường" có chứa "hư" (trong "thường") → loại trừ để không nhuộm hư nhầm.
  if (v.includes('hư') && !v.includes('thường')) return { hex: '#4a7fb0', opacity: 0.12 } // hư → xanh nhạt
  return { hex: '#ffffff', opacity: 0.07 } // bình thường / khác → trắng rất nhạt
}

/** Tạo 1 sprite quầng (radial-gradient additive) tại y cho trước, gắn vào figure để xoay cùng thân. */
function makeAura(y: number): Any {
  const tex = new T.CanvasTexture(getDotCanvas())
  const mat = new T.SpriteMaterial({
    map: tex,
    transparent: true,
    opacity: 0,
    blending: T.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
  })
  disposables.push(tex, mat)
  const sp = new T.Sprite(mat)
  const s = 0.55 * bodyHeight
  sp.scale.set(s, s, 1)
  sp.position.set(0, y, 0.15 * bodyHeight) // hơi nhô ra trước thân
  sp.renderOrder = 1 // dưới đường kinh để không lấn nét
  figure.add(sp)
  return sp
}

/** Cập nhật màu/độ mờ 2 quầng theo props.khi / props.huyet (gọi trong applyStyles + watch). */
function applyAura() {
  if (auraKhi) {
    const tk = tone(props.khi)
    auraKhi.material.color.set(tk.hex)
    auraKhi.material.opacity = tk.opacity
    auraKhi.material.needsUpdate = true
  }
  if (auraHuyet) {
    const th = tone(props.huyet)
    auraHuyet.material.color.set(th.hex)
    auraHuyet.material.opacity = th.opacity
    auraHuyet.material.needsUpdate = true
  }
}

const FRAME_BUDGET_MS = 8

/** Rải đường kinh lên bề mặt — RẢI DẦN theo ngân sách khung (giữ figure đứng yên lúc raycast). */
function buildMeridiansDeferred() {
  const C = COORDS()
  if (!C || !C.points) {
    console.warn('[BatCuongFigure3D] window.ACU_COORDS3D chưa có → không vẽ được đường kinh', C)
    linesReady = true
    revealCanvas()
    return
  }
  const placed = withAnchors(C.points)
  const codes = Object.keys(placed)
  const groups: Record<string, { mer: string; num: number; pos: Any }[]> = {}
  let idx = 0

  const step = () => {
    if (!alive || !renderer) return
    try {
      const start = performance.now()
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
      console.error('[BatCuongFigure3D] lỗi dựng đường kinh:', e)
      linesReady = true
      revealCanvas()
      return
    }
    buildFrac = codes.length ? (idx / codes.length) * 0.6 : 0.6
    recompute()
    if (idx < codes.length) {
      requestAnimationFrame(step)
      return
    }
    finalizeLinesDeferred(groups)
  }
  requestAnimationFrame(step)
}

/** Dựng ống phát sáng từ các điểm đã raycast — rải theo khung; màu/độ mờ lấy từ meridianStyle. */
function finalizeLinesDeferred(groups: Record<string, { mer: string; num: number; pos: Any }[]>) {
  const SPLIT = 0.16 * bodyHeight
  const sb = stateByMer3D()
  const jobs: { run: Any[]; mer: string; name: string | null; i: number }[] = []
  let i = 0
  for (const key in groups) {
    const all = (groups[key] ?? []).sort((a, b) => a.num - b.num)
    const first = all[0]
    if (!first) continue
    const mer = first.mer
    const name = sb.get(mer)?.name ?? null // mã ngắn (đo) nếu kinh này có đo → cho phép click "soi"
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
      jobs.push({ run, mer, name, i })
      i++
    }
  }

  let j = 0
  const buildStep = () => {
    if (!alive || !renderer) return
    try {
      const start = performance.now()
      while (j < jobs.length) {
        const job = jobs[j]
        if (!job) {
          j++
          continue
        }
        addGlowLine(job.run, job.mer, job.name)
        j++
        if (performance.now() - start > FRAME_BUDGET_MS) break
      }
    } catch (e) {
      console.error('[BatCuongFigure3D] lỗi hoàn tất đường kinh:', e)
      linesReady = true
      revealCanvas()
      return
    }
    buildFrac = 0.6 + (jobs.length ? (j / jobs.length) * 0.4 : 0.4)
    recompute()
    if (j < jobs.length) {
      requestAnimationFrame(buildStep)
      return
    }
    // Quầng Khí (ngực) + Huyết (bụng) — dựng 1 lần sau khi xong các ống.
    auraKhi = makeAura(bodyMinY + 0.72 * bodyHeight)
    auraHuyet = makeAura(bodyMinY + 0.42 * bodyHeight)
    linesReady = true
    revealCanvas() // ĐỦ thân + đường kinh + quầng → tô màu chẩn đoán rồi hiện cả khối ra
  }
  requestAnimationFrame(buildStep)
}

/** Chuẩn hoá mô hình (hướng, tỉ lệ, canh tâm) từ buffer .glb đã tải. */
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
        const raw = new T.Box3().setFromObject(modelRoot)
        const rs = new T.Vector3()
        raw.getSize(rs)
        const min = Math.min(rs.x, rs.y, rs.z)
        if (rs.y === min) modelRoot.rotation.x = -Math.PI / 2
        modelRoot.updateMatrixWorld(true)

        // Thân MỜ như bóng kính → nhường sân khấu cho ĐƯỜNG KINH màu (Bát Cương là nhân vật chính).
        // Thân ĐỤC màu da (như Kinh Mạch 3D) → có bề mặt sáng để đường kinh màu nổi lên + che kinh mặt sau.
        const bodyMat = new T.MeshStandardMaterial({
          color: 0xe7d6bf,
          roughness: 0.78,
          metalness: 0,
          side: T.DoubleSide,
        })
        disposables.push(bodyMat)
        targets = []
        modelRoot.traverse((o: Any) => {
          if (o.isSkinnedMesh && o.skeleton) o.skeleton.pose()
          if (o.isMesh) {
            o.material = bodyMat
            if (o.geometry && !o.geometry.attributes.normal) o.geometry.computeVertexNormals()
            o.frustumCulled = false
            targets.push(o)
          }
        })

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
        figure.updateMatrixWorld(true)
        resolve()
      },
      (err: Any) => reject(err instanceof Error ? err : new Error(String(err))),
    )
  })
}

/**
 * Mặc "quần" mờ đục (briefs) — bọc 1 lớp vải ĐỤC ôm vùng chậu để che kín bộ phận sinh dục khi IN / XOAY
 * ở MỌI góc (người dùng đã chọn cách này). Dựng vỏ bằng raycast quanh thân theo từng vòng (ring) nên vỏ
 * ÔM theo thân. Tay buông cạnh hông sẽ làm tia trúng tay → bán kính lồi bất thường; nên kẹp mỗi vòng theo
 * NGƯỠNG = trung vị × hệ số: tay bị kẹp về cỡ hông (nằm NGOÀI quần, tự nhiên), còn mặt trước (nơi bộ phận
 * sinh dục nhô ra) vẫn được phủ trọn. KHÔNG thêm vào targets/lineMeshes → không ảnh hưởng rải huyệt / click
 * "soi". (Đoạn đường kinh ngang vùng chậu bị quần che — đánh đổi đã được chấp nhận.)
 */
function addBriefs() {
  if (!T || !figure || !raycaster || !targets.length) return
  const RINGS = 7
  const SEG = 48
  const yTop = bodyMinY + 0.57 * bodyHeight
  // Hở ra ngoài da CHỈ 0.006 — NHỎ HƠN mức đặt ống đường kinh (skin + 0.01×bodyHeight) → quần nằm sát da,
  // các ống đường kinh nổi BÊN NGOÀI quần (không bị che), mà vẫn trùm kín da/bộ phận sinh dục bên trong.
  const offset = 0.006 * bodyHeight
  const o = new T.Vector3()
  const c = new T.Vector3()
  const dir = new T.Vector3()
  const verts: number[] = []
  const def = 0.12 * bodyHeight
  // DÒ ĐÁY VÙNG KÍN ở mặt trước: hạ dần tia bắn thẳng mặt trước tới khi hết trúng thân trước (qua đáy
  // dương vật, vào khe giữa hai chân) → đó là gấu cần cho GIỮA-TRƯỚC để che kín dương vật.
  let yFront = bodyMinY + 0.46 * bodyHeight
  for (let f = 0.5; f >= 0.3; f -= 0.01) {
    const yy = bodyMinY + f * bodyHeight
    o.set(0, yy, bodyHeight)
    c.set(0, yy, 0)
    raycaster.set(o, dir.copy(c).sub(o).normalize())
    const hits = raycaster.intersectObjects(targets, true)
    if (hits.length && hits[0] && hits[0].point.z > 0.005 * bodyHeight) yFront = yy
    else break
  }
  yFront = Math.max(yFront, bodyMinY + 0.34 * bodyHeight) // chốt an toàn: không xuống quá thấp
  // DÒ ĐÁY MÔNG ở mặt sau (tương tự mặt trước) → gấu giữa-sau hạ xuống che kín mông & rãnh mông.
  let yBack = bodyMinY + 0.46 * bodyHeight
  for (let f = 0.5; f >= 0.3; f -= 0.01) {
    const yy = bodyMinY + f * bodyHeight
    o.set(0, yy, -bodyHeight)
    c.set(0, yy, 0)
    raycaster.set(o, dir.copy(c).sub(o).normalize())
    const hits = raycaster.intersectObjects(targets, true)
    if (hits.length && hits[0] && hits[0].point.z < -0.005 * bodyHeight) yBack = yy
    else break
  }
  yBack = Math.max(yBack, bodyMinY + 0.34 * bodyHeight)
  // GẤU CẮT KIỂU QUẦN LÓT: hai bên (hông) giữ CAO (trên chỗ hai chân tách → vẫn ôm, không khố); GIỮA-TRƯỚC
  // hạ tới yFront (che dương vật/tinh hoàn), GIỮA-SAU hạ tới yBack (che mông). hemY nội suy theo hướng.
  const ySide = Math.min(bodyMinY + 0.46 * bodyHeight, Math.max(yFront, yBack) + 0.04 * bodyHeight)
  const drop = 0.035 * bodyHeight // kéo dài gấu xuống chút nữa → nhìn CHÉO không thấy lọt dưới gấu
  const hemFloor = bodyMinY + 0.32 * bodyHeight // nhưng không xuống quá thấp (tránh tách hẳn hai ống chân)
  const hemY = (deg: number) => {
    const cd = Math.cos((deg * Math.PI) / 180)
    const front = Math.max(0, cd) ** 1.1 // 1 ở giữa-TRƯỚC → 0 ở hông
    const back = Math.max(0, -cd) ** 1.1 // 1 ở giữa-SAU → 0 ở hông
    const base = ySide + (yFront - ySide) * front + (yBack - ySide) * back
    return Math.max(base - drop, hemFloor)
  }
  // Độ NHÔ ra trước nhất của vùng kín (đỉnh dương vật) → làm "sàn TÚI" đẩy mặt trước ra ôm trọn vùng kín.
  let gf = 0
  for (let f = 0.4; f <= 0.54; f += 0.02) {
    const yy = bodyMinY + f * bodyHeight
    o.set(0, yy, bodyHeight)
    c.set(0, yy, 0)
    raycaster.set(o, dir.copy(c).sub(o).normalize())
    const hits = raycaster.intersectObjects(targets, true)
    if (hits.length && hits[0]) gf = Math.max(gf, Math.hypot(hits[0].point.x, hits[0].point.z))
  }
  const gTop = bodyMinY + 0.52 * bodyHeight // trên mức này "túi" giảm dần về 0 (ôm về bụng, không che kinh)
  // BẢO VỆ mặt trước (vùng kín) & mặt sau: không bao giờ khử ở đây → luôn phủ kín. Các hướng còn lại, nếu
  // bán kính vọt cao bất thường so với trung vị → coi là TRÚNG TAY → khử để nội suy vẽ lại theo hông thật.
  const isProtected = (deg: number) => deg < 35 || deg > 325 || (deg > 145 && deg < 215)

  for (let r = 0; r < RINGS; r++) {
    const t = r / (RINGS - 1)
    // 1) Mỗi hướng có gấu riêng (cắt kiểu quần lót) → y riêng; đo bán kính thân tại đúng (y, hướng) đó.
    const raw: (number | null)[] = []
    const yArr: number[] = []
    for (let s = 0; s < SEG; s++) {
      const az = (s / SEG) * Math.PI * 2
      const y = yTop + (hemY((s / SEG) * 360) - yTop) * t
      yArr.push(y)
      o.set(Math.sin(az) * bodyHeight, y, Math.cos(az) * bodyHeight)
      c.set(0, y, 0)
      raycaster.set(o, dir.copy(c).sub(o).normalize())
      const hits = raycaster.intersectObjects(targets, true)
      raw.push(hits.length && hits[0] ? Math.hypot(hits[0].point.x, hits[0].point.z) : null)
    }
    // 2) Trung vị (bền với mẫu lồi) → ngưỡng nhận biết "gai" bán kính do tay.
    const known = raw.filter((val): val is number => val != null).sort((a, b) => a - b)
    const med = known.length ? (known[Math.floor(known.length / 2)] ?? def) : def
    // 2b) Khử GAI do tay (ngoài vùng bảo vệ): biến thành null để bước nội suy vẽ lại theo đường cong hông.
    for (let s = 0; s < SEG; s++) {
      const val = raw[s]
      if (val != null && !isProtected((s / SEG) * 360) && val > med * 1.45) raw[s] = null
    }
    // 3) Chỗ tia trượt → NỘI SUY theo 2 hàng xóm gần nhất (ôm sát khe chân thay vì loe ra).
    const fill = (i: number): number => {
      const cur = raw[i]
      if (cur != null) return cur
      let lv: number | null = null
      let rv: number | null = null
      let ld = 0
      let rd = 0
      for (let k = 1; k <= SEG; k++) {
        const val = raw[(i - k + SEG) % SEG]
        if (val != null) {
          lv = val
          ld = k
          break
        }
      }
      for (let k = 1; k <= SEG; k++) {
        const val = raw[(i + k) % SEG]
        if (val != null) {
          rv = val
          rd = k
          break
        }
      }
      if (lv != null && rv != null) return (lv * rd + rv * ld) / (ld + rd)
      return lv ?? rv ?? def
    }
    // 4) Dựng đỉnh — y theo gấu cắt riêng từng hướng. Vùng GIỮA-TRƯỚC (không có đường kinh) thêm "sàn túi" =
    //    độ nhô vùng kín để bọc kín dương vật/tinh hoàn; ngoài vùng đó giữ sát da để KHÔNG che đường kinh.
    for (let s = 0; s < SEG; s++) {
      const deg = (s / SEG) * 360
      const az = (s / SEG) * Math.PI * 2
      const yv = yArr[s] ?? yTop
      let R = Math.min(fill(s), med * 1.6)
      if (deg < 35 || deg > 325) {
        const floorFrac = yv >= gTop ? Math.max(0, (yTop - yv) / (yTop - gTop)) : 1
        R = Math.max(R, gf * floorFrac)
      }
      R += offset
      verts.push(Math.sin(az) * R, yv, Math.cos(az) * R)
    }
  }

  // 4) Nối các vòng thành ống kín (s cuộn vòng).
  const indices: number[] = []
  const at = (r: number, s: number) => r * SEG + (s % SEG)
  for (let r = 0; r < RINGS - 1; r++) {
    for (let s = 0; s < SEG; s++) {
      const a = at(r, s)
      const b = at(r, s + 1)
      const d = at(r + 1, s)
      const e = at(r + 1, s + 1)
      indices.push(a, d, b, b, d, e)
    }
  }

  const geo = new T.BufferGeometry()
  geo.setAttribute('position', new T.Float32BufferAttribute(verts, 3))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  const mat = new T.MeshStandardMaterial({
    color: 0x59636f, // vải xám trung tính, ĐỤC → đọc rõ là "quần", không chói át đường kinh màu
    roughness: 0.95,
    metalness: 0,
    side: T.DoubleSide,
  })
  disposables.push(geo, mat)
  const mesh = new T.Mesh(geo, mat)
  mesh.renderOrder = 2
  figure.add(mesh)
}

async function init(modelBuf: ArrayBuffer) {
  const el = host.value
  if (!el) return
  anchorsPromise = fetchAnchors()
  const w = Math.max(1, el.clientWidth)
  const h = Math.max(1, el.clientHeight)

  scene = new T.Scene()
  scene.background = new T.Color(0xeef1f4) // nền SÁNG như trang Kinh Mạch 3D → đường kinh hiện rõ
  camera = new T.PerspectiveCamera(30, w / h, 0.1, 50)
  camera.position.set(0, 0, 3.6) // nhìn thẳng vào tâm (front view) → người căn giữa
  camera.lookAt(0, 0, 0)

  // preserveDrawingBuffer: true → cho phép chụp canvas (toDataURL) đưa đồ hình 3D vào phiếu IN.
  renderer = new T.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setSize(w, h)
  if (T.sRGBEncoding !== undefined) renderer.outputEncoding = T.sRGBEncoding
  el.appendChild(renderer.domElement)
  renderer.domElement.style.display = 'block'
  renderer.domElement.style.opacity = '0'
  renderer.domElement.style.transition = 'opacity 0.7s ease'

  // Ánh sáng kiểu Kinh Mạch 3D: bán cầu nền + key + fill + rim → thân có khối, lộ nét.
  scene.add(new T.HemisphereLight(0xffffff, 0x8a95a5, 0.55))
  const key = new T.DirectionalLight(0xfff4e8, 1.15)
  key.position.set(1.2, 2.0, 2.2)
  scene.add(key)
  const fill = new T.DirectionalLight(0xdfeaff, 0.22)
  fill.position.set(-1.5, 0.8, -1.0)
  scene.add(fill)
  const rim = new T.DirectionalLight(0xbfd3ff, 0.8)
  rim.position.set(0, 1.4, -2.6)
  scene.add(rim)

  figure = new T.Group()
  scene.add(figure)
  raycaster = new T.Raycaster()

  await parseModel(modelBuf)
  if (!alive) return
  addBriefs() // mặc "quần" che vùng kín NGAY sau khi dựng thân, trước khi rải đường kinh

  ro = new ResizeObserver(onResize)
  ro.observe(el)
  io = new IntersectionObserver((ents) => {
    inView = ents[0]?.isIntersecting ?? true
    if (inView && visible && alive && !raf) raf = requestAnimationFrame(loop)
  })
  io.observe(el)
  document.addEventListener('visibilitychange', onVisibility)
  reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

  // Luôn cho KÉO để xoay (read-only, không có công cụ chỉnh sửa) + phân biệt click "soi" vs kéo.
  const cv = renderer.domElement
  cv.style.cursor = 'grab'
  cv.style.touchAction = 'none'
  cv.addEventListener('pointerdown', onPointerDown)
  cv.addEventListener('pointermove', onPointerMove)
  cv.addEventListener('pointercancel', onPointerUp)
  window.addEventListener('pointerup', onPointerUp)

  raf = requestAnimationFrame(loop)
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
  ensureLoop() // đổi cỡ → vẽ lại (kể cả khi vòng lặp đã dừng do giảm chuyển động)
}

function onVisibility() {
  visible = !document.hidden
  ensureLoop()
}

function ensureLoop() {
  if (alive && visible && inView && !raf) raf = requestAnimationFrame(loop)
}

function loop(ms: number) {
  raf = 0
  if (!alive) return

  const dt = lastMs ? Math.min(0.05, (ms - lastMs) / 1000) : 0
  lastMs = ms

  if (linesReady && !reduceMotion && !dragging) figure.rotation.y += dt * 0.45

  renderer.render(scene, camera)

  if (linesReady && reduceMotion && !dragging) return
  if (visible && inView) raf = requestAnimationFrame(loop)
}

// ── Kéo để xoay + phân biệt click "soi" (di chuyển < 5px = click) ──
function onPointerDown(e: PointerEvent) {
  if (!linesReady || !figure) return
  dragging = true
  moved = false
  downX = e.clientX
  downY = e.clientY
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
  if (Math.abs(e.clientX - downX) > 5 || Math.abs(e.clientY - downY) > 5) moved = true
  figure.rotation.y += dx * 0.01
  figure.rotation.x = Math.max(-0.6, Math.min(0.6, figure.rotation.x + dy * 0.006))
  ensureLoop()
}
function onPointerUp(e: PointerEvent) {
  if (!dragging) return
  dragging = false
  if (renderer?.domElement) renderer.domElement.style.cursor = 'grab'
  renderer?.domElement?.releasePointerCapture?.(e.pointerId)
  if (!moved) pick(e) // di chuyển < 5px → coi là CLICK → thử "soi" 1 tạng
}

/** Click: raycast vào ống đường kinh; trúng kinh ĐÃ ĐO (userData.name) → emit('toggle','organ:'+name). */
function pick(e: PointerEvent) {
  if (!raycaster || !camera || !renderer || !lineMeshes.length) return
  const rect = renderer.domElement.getBoundingClientRect()
  const ndc = new T.Vector2(
    ((e.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1,
    -((e.clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1,
  )
  raycaster.setFromCamera(ndc, camera)
  const lineHits = raycaster.intersectObjects(lineMeshes, false)
  // Thân người che tia → chỉ "soi" đường kinh MẶT TRƯỚC (khớp depthTest), bỏ kinh ở mặt sau thân.
  const bodyHits = raycaster.intersectObjects(targets, true)
  const bodyNear = bodyHits.length ? bodyHits[0].distance : Infinity
  for (const hit of lineHits) {
    if (hit.distance > bodyNear) break // đường kinh nằm SAU thân → người dùng không thấy → bỏ
    const name = hit.object?.userData?.name
    if (name) {
      emit('toggle', 'organ:' + name)
      return
    }
    // trúng kinh CHƯA ĐO ở mặt trước → bỏ qua, thử hit kế tiếp (nông hơn được duyệt trước)
  }
}

async function boot() {
  if (booted || !alive) return
  booted = true
  loadState.value = 'loading'
  scriptsFrac = modelFrac = buildFrac = 0
  progress.value = 0
  try {
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
      }, bodyVariant()).then((b) => {
        buf = b
      }),
    ])
    if (!alive) return
    await init(buf)
  } catch {
    // Lỗi tải/khởi tạo → rơi về SLOT 2D.
    loadState.value = 'done'
    canRender.value = false
  }
}

onMounted(() => {
  if (!hasWebGL()) {
    canRender.value = false
    return
  }
  const el = host.value
  if (!el) return
  // Lazy-boot: chỉ tải Three/mô hình khi panel CUỘN tới (IntersectionObserver).
  bootIo = new IntersectionObserver((ents) => {
    if (ents.some((e) => e.isIntersecting)) {
      bootIo?.disconnect()
      bootIo = null
      boot()
    }
  })
  bootIo.observe(el)
})

// Recolor (không dựng lại hình học) khi chẩn đoán / tiêu điểm đổi.
watch(() => [props.organs, props.focus, props.khi, props.huyet], applyStyles, { deep: true })

/**
 * Chụp đồ hình ở `count` góc xoay quanh trục đứng (mặc định 4: mặt trước → phải → sau → trái) để đưa
 * vào phiếu IN. Cần renderer đã dựng xong đường kinh (linesReady) + preserveDrawingBuffer: true. Tô màu
 * chẩn đoán trước mỗi lần render để mọi góc đều đúng màu. Trả mảng dataURL PNG; rỗng nếu chưa sẵn sàng.
 */
function captureViews(count = 4): string[] {
  if (!T || !renderer || !scene || !camera || !figure || !linesReady) return []
  // Lưu trạng thái khung xem tương tác để khôi phục nguyên vẹn sau khi chụp.
  const savedX = figure.rotation.x
  const savedY = figure.rotation.y
  const savedCamX = camera.position.x
  const savedCamY = camera.position.y
  const savedCamZ = camera.position.z
  const savedFov = camera.fov
  const savedPR = renderer.getPixelRatio()
  const out: string[] = []
  try {
    // Chụp khổ DỌC SÁT THÂN (350×700, hẹp ngang) + camera GẦN hơn khung xem (3.6 → 3.25) → thân người
    // to, bớt lề trắng 2 bên, rõ từng đường kinh hàn (xanh) / nhiệt (đỏ). updateStyle=false để không đụng
    // CSS canvas. Tỉ lệ 0,5 vẫn dư chỗ cho tay buông cạnh hông (không cắt tay).
    renderer.setPixelRatio(2)
    renderer.setSize(350, 700, false)
    camera.aspect = 350 / 700
    camera.position.set(0, 0, 3.25)
    camera.fov = 30
    camera.updateProjectionMatrix()
    applyStyles() // tô màu chẩn đoán trước khi chụp
    figure.rotation.x = 0
    for (let i = 0; i < count; i++) {
      figure.rotation.y = (i / count) * Math.PI * 2
      figure.updateMatrixWorld(true)
      renderer.render(scene, camera)
      out.push(renderer.domElement.toDataURL('image/png'))
    }
  } catch {
    return []
  } finally {
    // Trả camera + góc xoay + cỡ canvas về đúng khung xem tương tác.
    camera.position.set(savedCamX, savedCamY, savedCamZ)
    camera.fov = savedFov
    figure.rotation.x = savedX
    figure.rotation.y = savedY
    figure.updateMatrixWorld(true)
    renderer.setPixelRatio(savedPR)
    onResize() // đặt lại size + camera.aspect theo host + updateProjectionMatrix + vẽ lại 1 khung
  }
  return out
}

defineExpose({ captureViews })

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
  modelRoot?.traverse?.((o: Any) => o.geometry?.dispose?.())
  targets = []
  lineMeshes.length = 0
  for (const k in merMats) merMats[k] = [] // dọn tham chiếu vật liệu theo kinh (không xoá khoá)
  for (const k in merHalos) merHalos[k] = []
  auraKhi = null
  auraHuyet = null
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
  <!-- Không WebGL / lỗi tải → render hình rơi-về 2D do cha truyền vào slot -->
  <div v-if="!canRender" class="bcf3d-fallback"><slot /></div>
  <div v-else ref="host" class="bcf3d-host">
    <!-- Vòng tròn % tải (giữ y như HeroMeridianFigure) -->
    <div v-if="loadState !== 'idle'" class="hf-loader" :class="{ 'is-done': loadState === 'done' }">
      <div class="hf-ring" :style="{ '--p': progress }">
        <span class="hf-pct">{{ progress }}<small>%</small></span>
      </div>
      <span class="hf-label">{{ phaseLabel }}</span>
    </div>
    <div v-if="loadState === 'done'" class="bcf3d-hint">Kéo để xoay · Bấm đường kinh để soi</div>
  </div>
</template>

<style scoped>
.bcf3d-fallback {
  width: 100%;
  min-height: 360px;
}
.bcf3d-host {
  position: relative;
  width: 100%;
  min-height: 280px;
  height: 100%;
  pointer-events: auto;
  touch-action: none;
  border-radius: var(--radius-md);
  overflow: hidden;
  /* Nền SÁNG đúng như trang Kinh Mạch 3D → đường kinh (ống phát quang đặc) hiện rõ. */
  background: linear-gradient(180deg, #f6f9fc 0%, #d7dfe9 100%);
  box-shadow: inset 0 0 0 1px rgba(120, 90, 60, 0.1), 0 1px 4px rgba(60, 40, 20, 0.12);
}
.bcf3d-host :deep(canvas) {
  width: 100% !important;
  height: 100% !important;
  display: block;
}
.bcf3d-hint {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 8px;
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: rgba(70, 60, 48, 0.72);
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);
  pointer-events: none;
  user-select: none;
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
  opacity: 0;
}
.hf-ring {
  --p: 0;
  position: relative;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: conic-gradient(#2f6f4f calc(var(--p) * 1%), rgba(60, 80, 70, 0.14) 0);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 16px rgba(47, 111, 79, 0.2);
  animation: hf-breathe 2.4s ease-in-out infinite;
}
.hf-ring::after {
  content: '';
  position: absolute;
  inset: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
}
.hf-pct {
  position: relative;
  z-index: 1;
  color: #2f4a3a;
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
  color: rgba(60, 74, 64, 0.9);
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);
}
@keyframes hf-breathe {
  0%,
  100% {
    box-shadow: 0 0 12px rgba(47, 111, 79, 0.16);
  }
  50% {
    box-shadow: 0 0 22px rgba(47, 111, 79, 0.32);
  }
}
@media (prefers-reduced-motion: reduce) {
  .hf-ring {
    animation: none;
  }
}
</style>
