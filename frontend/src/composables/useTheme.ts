import { ref, computed } from 'vue'

/**
 * Hệ thống giao diện (theme) cho phần mềm.
 *
 * Toàn bộ design-system dùng thang màu thương hiệu `--brown-50 … --brown-900`
 * (xem main.css). Mỗi theme chỉ cần thay 10 biến này + `--primary-rgb`; mọi
 * thành phần (sidebar, hero, nút, chip, link, focus ring…) tự đổi theo vì đều
 * tham chiếu các token đó. Neutral (xám ấm) giữ nguyên để luôn dễ đọc.
 *
 * Chế độ "auto": mỗi ngày tự chọn một bảng màu khác nhau (xoay vòng theo ngày,
 * tính theo giờ Việt Nam) — đổi màu mới mỗi ngày mà vẫn phối hài hoà.
 */

type Step = '50' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'

export interface Theme {
  id: string
  name: string
  /** r, g, b của bước 600 (primary) — để dựng rgba() động (focus ring…). */
  primaryRgb: string
  ramp: Record<Step, string>
  /** true nếu là theme do người dùng tự tạo (lưu trong trình duyệt). */
  custom?: boolean
}

// Bảng màu được tuyển chọn theo phong cách Đông Y: trầm, đất, dịu mắt.
// Mỗi bước 600 đủ tối để chữ trắng trên nền primary luôn rõ.
export const themes: Theme[] = [
  {
    id: 'brown',
    name: 'Nâu Truyền Thống',
    primaryRgb: '138, 94, 40',
    ramp: {
      '50': '#faf6ef', '100': '#f1e7d6', '200': '#e3cfb0', '300': '#cfad78', '400': '#bd9050',
      '500': '#a4743a', '600': '#8a5e28', '700': '#6f4a22', '800': '#54391d', '900': '#3a2715',
    },
  },
  {
    id: 'green',
    name: 'Lục Trà',
    primaryRgb: '76, 110, 64',
    ramp: {
      '50': '#f2f6ef', '100': '#dfead7', '200': '#c3d6b4', '300': '#9dba88', '400': '#7a9e64',
      '500': '#5f8550', '600': '#4c6e40', '700': '#3d5734', '800': '#2f4429', '900': '#20311d',
    },
  },
  {
    id: 'indigo',
    name: 'Chàm',
    primaryRgb: '52, 82, 110',
    ramp: {
      '50': '#eef2f7', '100': '#d9e1ec', '200': '#b5c6da', '300': '#86a2c1', '400': '#5d80a6',
      '500': '#436889', '600': '#34526e', '700': '#2a4258', '800': '#213444', '900': '#172430',
    },
  },
  {
    id: 'terracotta',
    name: 'Đất Nung',
    primaryRgb: '147, 69, 46',
    ramp: {
      '50': '#fbf1ec', '100': '#f4dccf', '200': '#e8baa2', '300': '#d89170', '400': '#c66f4b',
      '500': '#b15639', '600': '#93452e', '700': '#763826', '800': '#5b2c1f', '900': '#3e1f16',
    },
  },
  {
    id: 'plum',
    name: 'Tử Đằng',
    primaryRgb: '93, 61, 98',
    ramp: {
      '50': '#f5f0f5', '100': '#e7d9e7', '200': '#ccb4ce', '300': '#ac87af', '400': '#8d6391',
      '500': '#744c78', '600': '#5d3d62', '700': '#4b324f', '800': '#3a273d', '900': '#281b2a',
    },
  },
  {
    id: 'teal',
    name: 'Thanh Tùng',
    primaryRgb: '51, 99, 88',
    ramp: {
      '50': '#edf5f3', '100': '#d6e8e3', '200': '#aed2c9', '300': '#7eb4a7', '400': '#569587',
      '500': '#3f7b6d', '600': '#336358', '700': '#2a5048', '800': '#213e38', '900': '#172b27',
    },
  },
  {
    id: 'ochre',
    name: 'Hoàng Thổ',
    primaryRgb: '130, 99, 39',
    ramp: {
      '50': '#f9f4e8', '100': '#f0e4c5', '200': '#e1ca8b', '300': '#ccac56', '400': '#b8923a',
      '500': '#9e7b2f', '600': '#826327', '700': '#6a5022', '800': '#523e1d', '900': '#392b15',
    },
  },
]

const STORAGE_KEY = 'theme_mode'
const CUSTOM_KEY = 'custom_themes'
const CLINIC_TZ = 'Asia/Ho_Chi_Minh'

// ============ Sinh dải màu từ một màu chủ đạo ============
// Người dùng chỉ chọn "tông" (hue + độ rực); hệ thống ấn định độ sáng cho từng
// bước nên bước 600 luôn đủ tối cho chữ trắng → palette tự sinh luôn dễ đọc.
const STEPS: Step[] = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900']
const TARGET_L: Record<Step, number> = { '50': 0.955, '100': 0.89, '200': 0.79, '300': 0.65, '400': 0.54, '500': 0.44, '600': 0.355, '700': 0.285, '800': 0.22, '900': 0.15 }
const SAT_SCALE: Record<Step, number> = { '50': 0.5, '100': 0.66, '200': 0.8, '300': 0.9, '400': 0.98, '500': 1, '600': 1, '700': 0.98, '800': 0.92, '900': 0.84 }

function normalizeHex(hex: string): string | null {
  const m = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec((hex || '').trim())
  if (!m) return null
  let h = m[1]! // group 1 luôn có khi regex khớp
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  return '#' + h.toLowerCase()
}
function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0, s = 0
  const d = max - min
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
  }
  return [h, s, l]
}
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = (((h % 360) + 360) % 360) / 360
  if (s === 0) { const v = l * 255; return [v, v, v] }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return [hue2rgb(p, q, h + 1 / 3) * 255, hue2rgb(p, q, h) * 255, hue2rgb(p, q, h - 1 / 3) * 255]
}

/** Sinh thang 50→900 từ một màu chủ đạo bất kỳ (đảm bảo dễ đọc & hài hoà). */
export function generateRamp(baseHex: string): Theme['ramp'] {
  const norm = normalizeHex(baseHex) || '#8a5e28'
  const [r, g, b] = hexToRgb(norm)
  const [h, rawS] = rgbToHsl(r, g, b)
  const s = Math.max(0.18, Math.min(0.72, rawS)) // không xám, không chói
  const ramp = {} as Theme['ramp']
  for (const step of STEPS) {
    const [rr, gg, bb] = hslToRgb(h, s * SAT_SCALE[step], TARGET_L[step])
    ramp[step] = rgbToHex(rr, gg, bb)
  }
  return ramp
}
function rgbStringFromHex(hex: string): string {
  const [r, g, b] = hexToRgb(normalizeHex(hex) || '#8a5e28')
  return `${r}, ${g}, ${b}`
}

// ============ Theme tuỳ chỉnh (lưu trong trình duyệt) ============
const customThemes = ref<Theme[]>([])

function isValidTheme(t: any): t is Theme {
  return !!t && typeof t.id === 'string' && typeof t.name === 'string' && !!t.ramp && typeof t.ramp['600'] === 'string'
}
function loadCustom() {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY)
    const arr = raw ? JSON.parse(raw) : []
    customThemes.value = Array.isArray(arr) ? arr.filter(isValidTheme).map((t: Theme) => ({ ...t, custom: true })) : []
  } catch {
    customThemes.value = []
  }
}
function saveCustom() {
  try {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(customThemes.value))
  } catch {
    /* bỏ qua */
  }
}

/** Tất cả theme khả dụng = dựng sẵn + tuỳ chỉnh. */
const allThemes = computed<Theme[]>(() => [...themes, ...customThemes.value])

// ============ Chọn theo ngày / áp dụng ============
/** Số ngày kể từ epoch tính theo giờ phòng khám — đổi đúng nửa đêm VN. */
function clinicEpochDay(): number {
  const ymd = new Intl.DateTimeFormat('en-CA', {
    timeZone: CLINIC_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
  const [y, m, d] = ymd.split('-').map((x) => parseInt(x, 10))
  return Math.floor(Date.UTC(y ?? 1970, (m || 1) - 1, d || 1) / 86400000)
}

/** Bảng màu của hôm nay (xoay vòng qua mọi theme đang có). */
export function dailyTheme(): Theme {
  const list = allThemes.value
  const idx = ((clinicEpochDay() % list.length) + list.length) % list.length
  return list[idx]! // list luôn có ≥1 theme dựng sẵn
}

// 'auto' = đổi theo ngày; hoặc một theme.id cố định do người dùng ghim.
const mode = ref<string>('auto')

function resolve(m: string): Theme {
  if (m === 'auto') return dailyTheme()
  return allThemes.value.find((t) => t.id === m) ?? dailyTheme()
}

const effectiveTheme = computed<Theme>(() => resolve(mode.value))

function applyTheme(t: Theme) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  ;(Object.keys(t.ramp) as Step[]).forEach((k) => {
    root.style.setProperty(`--brown-${k}`, t.ramp[k])
  })
  // --focus-ring trong main.css tham chiếu var(--primary-rgb) nên tự đổi theo.
  root.style.setProperty('--primary-rgb', t.primaryRgb)
  root.dataset.theme = t.id
}

export function setMode(m: string) {
  mode.value = m
  try {
    localStorage.setItem(STORAGE_KEY, m)
  } catch {
    /* localStorage có thể bị chặn — bỏ qua */
  }
  applyTheme(effectiveTheme.value)
}

/** Tạo & lưu một theme tuỳ chỉnh từ màu chủ đạo. Trả về theme vừa tạo. */
export function addCustomTheme(opts: { name: string; baseHex: string }): Theme {
  const ramp = generateRamp(opts.baseHex)
  const theme: Theme = {
    id: `custom-${Date.now().toString(36)}`,
    name: (opts.name || '').trim() || 'Màu Của Tôi',
    primaryRgb: rgbStringFromHex(ramp['600']),
    ramp,
    custom: true,
  }
  customThemes.value = [...customThemes.value, theme]
  saveCustom()
  return theme
}

/** Xoá một theme tuỳ chỉnh; nếu đang dùng thì quay về chế độ "auto". */
export function removeCustomTheme(id: string) {
  customThemes.value = customThemes.value.filter((t) => t.id !== id)
  saveCustom()
  if (mode.value === id) setMode('auto')
  else applyTheme(effectiveTheme.value)
}

/** Gọi 1 lần lúc khởi động app (main.ts) để áp theme trước khi render. */
export function initTheme() {
  loadCustom()
  let saved = 'auto'
  try {
    saved = localStorage.getItem(STORAGE_KEY) || 'auto'
  } catch {
    saved = 'auto'
  }
  if (saved !== 'auto' && !allThemes.value.some((t) => t.id === saved)) saved = 'auto'
  mode.value = saved
  applyTheme(effectiveTheme.value)
}

export function useTheme() {
  return {
    mode,
    themes,
    customThemes,
    allThemes,
    effectiveTheme,
    dailyTheme,
    setMode,
    addCustomTheme,
    removeCustomTheme,
    generateRamp,
  }
}
