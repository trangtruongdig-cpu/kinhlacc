/**
 * heroThree.ts — Nạp Three.js (+ GLTFLoader, meshopt, dữ liệu toạ độ huyệt) cho cảnh 3D
 * TRANG TRÍ ở trang chủ: hình người THẬT (body-layers.glb) phát sáng + đường kinh chạy dọc.
 *
 * Dùng lại đúng các file "global" có sẵn trong public/kinhmach3d (không cần `npm three`).
 * Khác engine Kinh Mạch 3D (acuMap3d.ts): cảnh ở đây là RIÊNG, read-only, không toolbar/drawer,
 * KHÔNG kéo 2.6MB dữ liệu chi tiết huyệt — chỉ cần toạ độ (acu-coords3d.js, ~30KB) để rải đường kinh.
 * Tải TRỄ (chỉ khi banner thật sự hiện) → trang chủ vẫn nhẹ.
 *
 * ĐO TIẾN ĐỘ: 2 file nặng (three.min.js ~590KB, body-layers.glb ~612KB) được tải bằng `fetch`
 * dạng dòng (streaming) để biết đã tải được bao nhiêu % → banner hiện vòng tròn phần trăm,
 * người xem yên tâm chờ thay vì nhìn khoảng trống. three.min.js là JS thuần (không tự nạp
 * worker/wasm theo URL) nên chạy qua Blob URL an toàn; meshopt + GLTFLoader + toạ độ vẫn nạp
 * bằng <script src> như cũ (nhẹ, và meshopt có thể cần wasm nội bộ).
 */

const BASE = `${import.meta.env.BASE_URL || '/'}kinhmach3d/`

// ── PHÁ CACHE (?v=<số build>) ──
// Các asset 3D (three.min.js, acu-coords3d.js, body-layers.glb…) GIỮ NGUYÊN TÊN qua mỗi lần deploy, mà
// nginx phục vụ chúng kèm cache dài → trình duyệt đã tải sẽ KHÔNG hỏi lại server, nên file cập nhật
// (vd toạ độ đường kinh mới) "không lên". acuMap3d.ts đã gắn ?v=<ver> để khắc phục; heroThree TRƯỚC ĐÂY
// QUÊN — nên banner trang chủ dễ kẹt bản cũ. Dùng chung __ACU_ASSET_VER__ (Vite define, = số build) như acuMap3d.
declare const __ACU_ASSET_VER__: string
const ASSET_VER = typeof __ACU_ASSET_VER__ !== 'undefined' ? __ACU_ASSET_VER__ : ''
/** Gắn ?v=<ver> để mỗi build ra URL mới → trình duyệt coi là file mới, bỏ qua bản cache cũ. */
const ver = (p: string) => (ASSET_VER ? `${p}?v=${ASSET_VER}` : p)

const THREE_SRC = ver(`${BASE}vendor/three.min.js`)
const GLTF_SRC = ver(`${BASE}vendor/GLTFLoader.js`)
const MESHOPT_SRC = ver(`${BASE}vendor/meshopt_decoder.js`)
const COORDS_SRC = ver(`${BASE}data/acu-coords3d.js`)
// Thân NAM (mặc định) và thân NỮ — chọn theo giới tính bệnh nhân. Cùng tư thế (tay buông cạnh hông),
// cùng quy ước hướng/tỉ lệ → đường kinh (rải bằng raycast lên da, chuẩn hoá theo chiều cao thân) tự bám
// đúng cả hai. Nếu CHƯA có file nữ, fetchModelBuffer('female') tự rơi về model nam (không vỡ hình).
const MODEL_SRC = ver(`${BASE}models/body-layers.glb`)
const MODEL_SRC_FEMALE = ver(`${BASE}models/body-layers-female.glb`)

/** Giới tính thân hình 3D cần dựng. */
export type BodyVariant = 'male' | 'female'

// Kích thước ước lượng (byte) — chỉ dùng làm mẫu số cho thanh % khi máy chủ KHÔNG gửi Content-Length.
const SIZE_HINT: Record<string, number> = {
  [THREE_SRC]: 590 * 1024,
  [GLTF_SRC]: 94 * 1024,
  [MESHOPT_SRC]: 25 * 1024,
  [COORDS_SRC]: 30 * 1024,
  [MODEL_SRC]: 612 * 1024,
  [MODEL_SRC_FEMALE]: 612 * 1024,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ThreeNS = any

/** Báo tiến độ 1 phần việc: số thực 0 → 1. */
type ProgressFn = (fraction: number) => void

const scriptPromises = new Map<string, Promise<void>>()

/** Gắn 1 thẻ <script src> và đợi nó chạy xong (src có thể là URL thật hoặc Blob URL). */
function runScriptSrc(src: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const el = document.createElement('script')
    el.src = src
    el.async = false // giữ thứ tự thực thi (GLTFLoader cần THREE có trước)
    el.onload = () => resolve()
    el.onerror = () => reject(new Error(`Không tải được script: ${src}`))
    document.head.appendChild(el)
  })
}

/** Nạp 1 script đúng 1 lần (dedupe theo URL) bằng <script src> thường — cho file nhỏ / có wasm nội bộ. */
function loadScriptOnce(src: string): Promise<void> {
  const existing = scriptPromises.get(src)
  if (existing) return existing
  const p = runScriptSrc(src)
  scriptPromises.set(src, p)
  return p
}

/**
 * Tải nội dung 1 URL dạng dòng (đo %). Trả về toàn bộ byte.
 * Có Content-Length → % chính xác; không có → ước lượng theo SIZE_HINT (thanh vẫn tiến mượt).
 */
async function fetchBytes(src: string, onProgress?: ProgressFn): Promise<Uint8Array> {
  const res = await fetch(src, { credentials: 'same-origin' })
  if (!res.ok) throw new Error(`HTTP ${res.status} khi tải ${src}`)
  const total = Number(res.headers.get('content-length')) || SIZE_HINT[src] || 0
  const reader = res.body?.getReader?.()
  if (!reader) {
    // Trình duyệt không cho đọc dòng → đọc 1 lần.
    const buf = new Uint8Array(await res.arrayBuffer())
    onProgress?.(1)
    return buf
  }
  const chunks: Uint8Array[] = []
  let loaded = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    if (value) {
      chunks.push(value)
      loaded += value.length
      if (total) onProgress?.(Math.min(1, loaded / total))
    }
  }
  onProgress?.(1)
  const out = new Uint8Array(loaded)
  let off = 0
  for (const c of chunks) {
    out.set(c, off)
    off += c.length
  }
  return out
}

/** Tải script qua fetch (đo %) rồi chạy bằng Blob URL — chỉ tải 1 lần. Lỗi fetch → rơi về <script src>. */
function loadScriptMeasured(src: string, onProgress?: ProgressFn): Promise<void> {
  const existing = scriptPromises.get(src)
  if (existing) return existing
  const p = (async () => {
    let code: string | null = null
    try {
      const bytes = await fetchBytes(src, onProgress)
      code = new TextDecoder('utf-8').decode(bytes)
    } catch {
      code = null
    }
    if (code == null) {
      onProgress?.(1) // không đo được → coi như xong để thanh % không kẹt
      await runScriptSrc(src)
      return
    }
    const url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }))
    try {
      await runScriptSrc(url)
    } finally {
      URL.revokeObjectURL(url)
    }
  })()
  scriptPromises.set(src, p)
  return p
}

let threePromise: Promise<ThreeNS> | null = null

/** Trả về window.THREE, nạp 1 lần nếu chưa có (engine 3D có thể đã nạp sẵn → dùng lại). */
export function ensureThree(onProgress?: ProgressFn): Promise<ThreeNS> {
  const w = window as unknown as { THREE?: ThreeNS }
  if (w.THREE) {
    onProgress?.(1)
    return Promise.resolve(w.THREE)
  }
  if (threePromise) return threePromise
  threePromise = loadScriptMeasured(THREE_SRC, onProgress).then(() => {
    const t = (window as unknown as { THREE?: ThreeNS }).THREE
    if (!t) throw new Error('THREE không khả dụng sau khi tải three.min.js')
    return t
  })
  return threePromise
}

/**
 * Nạp đủ để dựng hình người thật: THREE → GLTFLoader (gắn vào THREE) + meshopt + toạ độ huyệt.
 * `onProgress` báo tiến độ 0 → 1 của RIÊNG nhóm script (three nặng nhất → chiếm 85%, 3 file nhỏ 15%).
 */
export async function ensureModelDeps(onProgress?: ProgressFn): Promise<ThreeNS> {
  // three.min.js (~590KB) nặng nhất → đo byte thật, chiếm 85% thanh tiến độ của nhóm script.
  const THREE = await ensureThree((f) => onProgress?.(f * 0.85))
  // GLTFLoader cần THREE có trước; meshopt + toạ độ độc lập → nạp song song (nhẹ, đếm theo bước).
  const small = [GLTF_SRC, MESHOPT_SRC, COORDS_SRC]
  let done = 0
  await Promise.all(
    small.map((s) =>
      loadScriptOnce(s).then(() => {
        done++
        onProgress?.(0.85 + (done / small.length) * 0.15)
      }),
    ),
  )
  onProgress?.(1)
  return THREE
}

/**
 * Tải file .glb của thân hình theo `variant` (nam/nữ) dạng dòng (đo %), trả ArrayBuffer để
 * GLTFLoader.parse(). Nếu chọn 'female' mà file nữ chưa có / lỗi tải → RƠI VỀ model nam (không vỡ hình).
 */
export async function fetchModelBuffer(onProgress?: ProgressFn, variant: BodyVariant = 'male'): Promise<ArrayBuffer> {
  const src = variant === 'female' ? MODEL_SRC_FEMALE : MODEL_SRC
  try {
    const bytes = await fetchBytes(src, onProgress)
    return bytes.buffer as ArrayBuffer
  } catch (e) {
    if (variant === 'female' && src !== MODEL_SRC) {
      console.warn('[heroThree] không tải được model nữ → dùng model nam:', e)
      const bytes = await fetchBytes(MODEL_SRC, onProgress)
      return bytes.buffer as ArrayBuffer
    }
    throw e
  }
}

/** Trình duyệt có hỗ trợ WebGL không (để rơi-về hình SVG khi không có). */
export function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')))
  } catch {
    return false
  }
}
