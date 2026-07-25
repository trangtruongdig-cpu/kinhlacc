<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { mountAcuMap, unmountAcuMap } from '@/lib/acuMap3d'

const route = useRoute()
const router = useRouter()
const mountPoint = ref<HTMLElement | null>(null)
const loading = ref(true)
const progress = ref(0) // % tải model cho màn chờ to (0 = chưa có số → chỉ hiện spinner)
const error = ref<string | null>(null)

// Kênh tiến trình từ engine map3d.js (đặt trên window) → màn chờ to của Vue.
interface AcuExportPoint {
  code: string
  mer: string
  name: string
  merName: string
  color: string
  side: 'front' | 'back'
  front: { x: number; y: number } | null
  back: { x: number; y: number } | null
}
interface AcuExportResult {
  width: number
  height: number
  front: string | null
  back: string | null
  points: AcuExportPoint[]
  missing: string[]
}
interface AcuWin {
  ACU_MODEL_READY?: boolean
  ACU_ON_MODEL_PROGRESS?: (pct: number) => void
  ACU_ON_MODEL_READY?: () => void
  AcuMap?: {
    focus: (c: string) => void
    exportPrintDiagram?: (codes: string[], opts?: { width?: number; height?: number }) => Promise<AcuExportResult>
  }
}
// Payload MeridianResultsView để lại trong sessionStorage trước khi điều hướng sang đây với
// ?diagram=<mã huyệt,...> — cho phiếu in tên đầy đủ + ghi chú kỹ thuật (map3d.js chỉ biết toạ độ 3D).
interface AcuPrintPayload {
  patientName: string
  examDate: string
  theBenh?: string
  groups: Array<{ method: string; items: Array<{ code: string; name: string; note?: string }> }>
}
const ACU_PRINT_PAYLOAD_KEY = 'kinhlac:acu-print-payload'
let safetyTimer: ReturnType<typeof setTimeout> | null = null
function finishLoading() {
  progress.value = 100
  loading.value = false
  if (safetyTimer) {
    clearTimeout(safetyTimer)
    safetyTimer = null
  }
}
// Mobile: nút gạt ẩn mô hình 3D để danh sách kinh/huyệt chiếm trọn chiều cao.
// Ẩn bằng display:none là an toàn — onResize của engine có guard `if(!w||!h)return`,
// và ResizeObserver trên #mapStage tự chỉnh lại canvas khi hiện mô hình trở lại.
const showModel = ref(true)

// Mobile: phóng to mô hình 3D ra TOÀN màn hình để xem cho rõ (khung mặc định khá nhỏ).
// Khi bật: .km3d-mount phủ kín màn hình (position:fixed), ẩn ngăn danh sách → mô hình chiếm trọn.
const expanded = ref(false)

/**
 * Sau khi đổi kích thước khung (vào/ra toàn màn hình), canh lại camera cho mô hình vừa khít.
 * Engine có sẵn ResizeObserver trên #mapStage (tự đổi tỉ lệ canvas); ta bấm hộ nút "Đặt Lại Góc
 * Nhìn" để khung hình vừa vặn màn hình mới. Đợi 2 frame cho layout + observer chạy xong rồi mới canh.
 */
function refitModel() {
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      document.getElementById('mapReset')?.click()
    }),
  )
}

function toggleExpand() {
  expanded.value = !expanded.value
  // Khoá cuộn trang nền khi xem toàn màn hình để không bị "trôi" phía sau.
  document.body.style.overflow = expanded.value ? 'hidden' : ''
  refitModel()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && expanded.value) toggleExpand()
}

// Mở từ kết quả khám (?from=meridian-results&patientId&examId&view) → hiện nút "Quay lại kết quả
// khám" bay đúng ca khám + đúng tab (thay vì reset về tab đầu).
function qp(name: string): string | null {
  const v = route.query[name]
  const s = Array.isArray(v) ? v[0] : v
  return s ? String(s) : null
}
const backTarget = computed(() => {
  if (qp('from') !== 'meridian-results') return null
  const patientId = qp('patientId')
  const examId = qp('examId')
  if (!patientId || !examId) return null
  return { patientId, examId, view: qp('view') || '2' }
})
function goBackToResults() {
  const t = backTarget.value
  if (!t) return
  router.push({
    name: 'meridian-results',
    params: { patientId: t.patientId, examId: t.examId },
    query: { view: t.view },
  })
}

// ───────────────────────── "In phiếu châm huyệt" (?diagram=LU9,ST36,...) ─────────────────────────
function escHtml(v: unknown): string {
  return String(v ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string)
}

const ACP_MARGIN = 190 // lề trái/phải quanh ảnh thân người, dành chỗ cho nhãn + đường dẫn chỉ

// Xếp nhãn dọc theo lề, tránh đè nhau: sắp theo chiều cao thực tế trên ảnh rồi đẩy xuống tối thiểu
// `minGap` mỗi khi 2 nhãn kề nhau quá gần (kỹ thuật "callout ladder" quen thuộc trong bản đồ/atlas).
function layoutLabelSlots<T extends { y: number }>(points: T[], imgH: number, minGap: number): (T & { labelY: number })[] {
  const sorted = [...points].sort((a, b) => a.y - b.y)
  let prevY = -Infinity
  return sorted.map((p) => {
    const desired = p.y * imgH
    const y = Math.max(desired, prevY + minGap)
    prevY = y
    return { ...p, labelY: Math.min(y, imgH - 10) }
  })
}

function buildSideSvg(
  side: 'front' | 'back',
  imgDataUrl: string | null,
  points: AcuExportPoint[],
  labelOf: (code: string) => string,
  W: number,
  H: number,
): string {
  if (!imgDataUrl) {
    return `<div class="acp-empty">Không chụp được ảnh ${side === 'front' ? 'mặt trước' : 'mặt sau'}.</div>`
  }
  const M = ACP_MARGIN
  const totalW = W + M * 2
  const pts = points
    .filter((p) => p.side === side && p[side])
    .map((p) => {
      const proj = p[side] as { x: number; y: number }
      return { code: p.code, name: labelOf(p.code) || p.name, color: p.color, x: proj.x, y: proj.y }
    })
  const left = layoutLabelSlots(
    pts.filter((p) => p.x < 0.5),
    H,
    24,
  )
  const right = layoutLabelSlots(
    pts.filter((p) => p.x >= 0.5),
    H,
    24,
  )

  const dotsMarkup = pts
    .map((p) => `<circle cx="${(M + p.x * W).toFixed(1)}" cy="${(p.y * H).toFixed(1)}" r="4.2" fill="${p.color}" stroke="#fff" stroke-width="1.2" />`)
    .join('')
  const leaderAndLabel = (p: { code: string; name: string; color: string; x: number; y: number; labelY: number }, anchor: 'start' | 'end', labelX: number) => {
    const dotX = M + p.x * W
    const dotY = p.y * H
    const textX = anchor === 'end' ? labelX - 6 : labelX + 6
    return (
      `<line x1="${labelX.toFixed(1)}" y1="${p.labelY.toFixed(1)}" x2="${dotX.toFixed(1)}" y2="${dotY.toFixed(1)}" stroke="${p.color}" stroke-width="1" opacity="0.8" />` +
      `<circle cx="${labelX.toFixed(1)}" cy="${p.labelY.toFixed(1)}" r="2.4" fill="${p.color}" />` +
      `<text x="${textX.toFixed(1)}" y="${p.labelY.toFixed(1)}" text-anchor="${anchor}" dominant-baseline="middle" class="acp-label">${escHtml(p.code)} <tspan class="acp-label-name">${escHtml(p.name)}</tspan></text>`
    )
  }
  const leftMarkup = left.map((p) => leaderAndLabel(p, 'end', M - 10)).join('')
  const rightMarkup = right.map((p) => leaderAndLabel(p, 'start', M + W + 10)).join('')

  return `<svg class="acp-svg" viewBox="0 0 ${totalW} ${H}" xmlns="http://www.w3.org/2000/svg">
    <image href="${imgDataUrl}" x="${M}" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid meet" />
    ${dotsMarkup}
    ${leftMarkup}
    ${rightMarkup}
  </svg>`
}

function renderAcuPrintSheet(result: AcuExportResult, payload: AcuPrintPayload | null) {
  const labelOf = (code: string): string => {
    if (!payload) return ''
    for (const g of payload.groups) {
      const it = g.items.find((i) => i.code === code)
      if (it) return it.name
    }
    return ''
  }
  const frontSvg = buildSideSvg('front', result.front, result.points, labelOf, result.width, result.height)
  const backSvg = buildSideSvg('back', result.back, result.points, labelOf, result.width, result.height)

  const legendHtml = payload
    ? payload.groups
        .map(
          (g) =>
            `<div class="acp-grp"><div class="acp-grp-h">${escHtml(g.method)} <i>(${g.items.length})</i></div><ul class="acp-list">${g.items
              .map(
                (it) =>
                  `<li><b>${escHtml(it.code)}</b> ${escHtml(it.name)}${it.note ? ` <span class="acp-note">— ${escHtml(it.note)}</span>` : ''}</li>`,
              )
              .join('')}</ul></div>`,
        )
        .join('')
    : `<ul class="acp-list">${result.points
        .map((p) => `<li><b>${escHtml(p.code)}</b> ${escHtml(p.name)} <span class="acp-note">(${escHtml(p.merName)})</span></li>`)
        .join('')}</ul>`

  const missingHtml = result.missing.length
    ? `<div class="acp-missing">⚠ Không xác định được vị trí trên đồ hình 3D: ${result.missing.map((c) => escHtml(c)).join(', ')}</div>`
    : ''

  const printedAt = new Date().toLocaleString('vi-VN')
  const heading = payload?.theBenh ? `PHIẾU CHÂM HUYỆT — ${payload.theBenh.toUpperCase()}` : 'PHIẾU CHÂM HUYỆT'
  const title = payload?.patientName ? `Phiếu châm huyệt - ${payload.patientName}` : 'Phiếu châm huyệt'

  const html = `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>${escHtml(title)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: "Times New Roman", Times, "Liberation Serif", serif; color: #1f2937; margin: 0; padding: 16px 20px; font-size: 11px; line-height: 1.4; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  h1 { font-size: 16px; margin: 0 0 2px; }
  .acp-meta { font-size: 11px; color: #4b5563; margin-bottom: 10px; }
  .acp-diagrams { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
  .acp-diagram { text-align: center; }
  .acp-svg { width: 320px; height: auto; border: 1px solid #e5e7eb; border-radius: 6px; background: #fff; }
  .acp-cap { font-weight: 700; font-size: 11px; margin-top: 4px; }
  .acp-label { font-size: 9px; fill: #1f2937; font-family: Arial, sans-serif; }
  .acp-label-name { font-weight: 700; }
  .acp-legend { margin-top: 14px; column-count: 2; column-gap: 22px; }
  .acp-grp { break-inside: avoid; margin-bottom: 8px; }
  .acp-grp-h { font-weight: 700; font-size: 11.5px; border-bottom: 1px solid #d6cbb8; padding-bottom: 2px; margin-bottom: 3px; }
  .acp-list { margin: 0; padding-left: 14px; }
  .acp-list li { margin-bottom: 2px; }
  .acp-note { color: #6b7280; font-size: 10px; }
  .acp-missing { margin-top: 10px; font-size: 10.5px; color: #b45309; }
  .acp-empty { width: 320px; padding: 40px 10px; text-align: center; color: #9ca3af; border: 1px dashed #d1d5db; border-radius: 6px; }
  .foot { margin-top: 16px; font-size: 9.5px; color: #6b7280; text-align: center; }
  @media print { body { padding: 8px 12px; } }
</style>
</head>
<body>
  <h1>${escHtml(heading)}</h1>
  <div class="acp-meta">${payload?.patientName ? `Bệnh nhân: <b>${escHtml(payload.patientName)}</b>` : ''}${payload?.examDate ? ` · Ngày khám: ${escHtml(payload.examDate)}` : ''}</div>
  <div class="acp-diagrams">
    <div class="acp-diagram">${frontSvg}<div class="acp-cap">Mặt trước</div></div>
    <div class="acp-diagram">${backSvg}<div class="acp-cap">Mặt sau</div></div>
  </div>
  ${missingHtml}
  <div class="acp-legend">${legendHtml}</div>
  <div class="foot">Phiếu in lúc ${escHtml(printedAt)} · Vị trí huyệt trên đồ hình mang tính minh hoạ tương đối, tham khảo thêm hướng dẫn của bác sĩ.</div>
  <script>window.onload=function(){setTimeout(function(){window.print()},150)}<\/script>
</body>
</html>`

  const win = window.open('', '_blank', 'width=900,height=1200')
  if (!win) {
    alert('Trình duyệt đang chặn cửa sổ in. Vui lòng cho phép pop-up cho trang này rồi thử lại.')
    return false
  }
  win.document.open()
  win.document.write(html)
  win.document.close()
  win.focus()
  return true
}

// Trang này được MỞ RIÊNG (window.open, không router.push) chỉ để tải engine 3D + chụp ảnh phiếu in —
// trang "Kết quả khám" gốc vẫn đứng yên. Sau khi mở được cửa sổ phiếu in, tự đóng tab tạm này lại →
// bác sĩ chỉ còn thấy phiếu in đọng lại, không phải dọn thêm 1 tab đồ hình 3D thừa.
function printAcuDiagram(codes: string[], payload: AcuPrintPayload | null) {
  const w = window as unknown as AcuWin
  if (!w.AcuMap?.exportPrintDiagram) {
    alert('Đồ hình 3D chưa sẵn sàng, vui lòng thử lại.')
    return
  }
  w.AcuMap.exportPrintDiagram(codes, { width: 900, height: 1400 })
    .then((result) => {
      const opened = renderAcuPrintSheet(result, payload)
      if (opened && window.opener) window.close()
    })
    .catch((e: unknown) => {
      console.error(e)
      alert('Không dựng được phiếu châm huyệt: ' + (e instanceof Error ? e.message : String(e)))
    })
}

/**
 * Cầu nối engine → SPA: drawer 3D có sẵn 2 link "Xem thêm" (href #acu/<id>) và "Lý thuyết kinh
 * đầy đủ" (href #meridian/<mã>) — di sản từ webapp gốc, không tự điều hướng trong SPA. Bắt sự kiện
 * hashchange để đẩy sang trang "Từ Điển" đúng mục huyệt / đúng đường kinh.
 */
function onHashNav() {
  const h = location.hash
  let m: RegExpExecArray | null
  if ((m = /^#acu\/(\d+)/.exec(h))) {
    router.push({ name: 'tu-dien', query: { acu: m[1] } })
  } else if ((m = /^#meridian\/([A-Za-z]+)/.exec(h))) {
    router.push({ name: 'tu-dien', query: { mer: m[1] } })
  }
}

onMounted(async () => {
  const w = window as unknown as AcuWin
  if (w.ACU_MODEL_READY) {
    // Model đã tải sẵn từ lần trước (engine singleton) → khỏi hiện màn chờ.
    loading.value = false
  } else {
    // Engine báo % khi tải model + báo "xong" → màn chờ to hiện % rồi tự ẩn.
    w.ACU_ON_MODEL_PROGRESS = (pct: number) => {
      progress.value = Math.max(progress.value, Math.min(99, pct))
    }
    w.ACU_ON_MODEL_READY = finishLoading
    // Phòng hờ: nếu engine không báo "xong" (vd khung 0px nên model chưa tải), 30s sau vẫn ẩn màn chờ.
    safetyTimer = setTimeout(() => {
      loading.value = false
    }, 30000)
  }
  try {
    if (mountPoint.value) await mountAcuMap(mountPoint.value)
    window.addEventListener('hashchange', onHashNav)
    window.addEventListener('keydown', onKeydown)
    // Mở từ "Từ Điển" với ?focus=<mã huyệt> → bay tới huyệt đó (engine đã sẵn sàng sau mountAcuMap).
    const focus = route.query.focus
    const code = Array.isArray(focus) ? focus[0] : focus
    if (code) w.AcuMap?.focus(code)
    // Mở từ "Kết quả khám" với ?diagram=LU9,ST36,... → tự dựng + mở cửa sổ in "Phiếu châm huyệt".
    // Tên huyệt/ghi chú kỹ thuật (nếu có) lấy từ payload MeridianResultsView để lại trong sessionStorage
    // trước khi điều hướng (exportPrintDiagram của map3d.js chỉ biết mã + toạ độ 3D, không biết ghi chú).
    const diagram = qp('diagram')
    if (diagram) {
      const codes = [...new Set(diagram.split(',').map((s) => s.trim()).filter(Boolean))]
      if (codes.length) {
        let payload: AcuPrintPayload | null = null
        try {
          const raw = sessionStorage.getItem(ACU_PRINT_PAYLOAD_KEY)
          if (raw) payload = JSON.parse(raw) as AcuPrintPayload
          sessionStorage.removeItem(ACU_PRINT_PAYLOAD_KEY)
        } catch {
          /* payload hỏng/bị chặn storage — vẫn in được, chỉ thiếu tên đầy đủ + ghi chú kỹ thuật */
        }
        printAcuDiagram(codes, payload)
      }
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e)
    finishLoading()
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('hashchange', onHashNav)
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = '' // phòng khi rời trang lúc đang phóng to
  if (safetyTimer) {
    clearTimeout(safetyTimer)
    safetyTimer = null
  }
  // Gỡ callback để engine không gọi vào component đã huỷ ở lần điều hướng sau.
  const w = window as unknown as AcuWin
  w.ACU_ON_MODEL_PROGRESS = undefined
  w.ACU_ON_MODEL_READY = undefined
  unmountAcuMap()
})
</script>

<template>
  <div class="km3d-page">
    <div v-if="error" class="km3d-error">
      <p><strong>Không tải được đồ hình 3D.</strong></p>
      <p>{{ error }}</p>
    </div>

    <!-- Chỉ hiện khi mở từ trang Kết Quả Khám (kèm ?from=meridian-results...) — bay về đúng ca + đúng tab. -->
    <button v-if="backTarget" type="button" class="km3d-back" @click="goBackToResults">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      <span>Quay lại kết quả khám</span>
    </button>

    <!-- Nút gạt ẩn/hiện mô hình 3D — chỉ hiện trên mobile (CSS), để dành chỗ cho danh sách. -->
    <button
      type="button"
      class="km3d-toggle"
      :aria-pressed="!showModel"
      @click="showModel = !showModel"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
      </svg>
      <span>{{ showModel ? 'Ẩn mô hình 3D — mở rộng danh sách' : 'Hiện mô hình 3D' }}</span>
    </button>

    <div class="km3d-mount" :class="{ 'hide-model': !showModel, 'is-expanded': expanded }" ref="mountPoint">
      <!-- Nút phóng to mô hình ra TOÀN màn hình (mobile) — bấm lại hoặc Esc để thu nhỏ. -->
      <button
        type="button"
        class="km3d-expand"
        :aria-pressed="expanded"
        :title="expanded ? 'Thu nhỏ mô hình' : 'Phóng to mô hình toàn màn hình'"
        @click="toggleExpand"
      >
        <svg v-if="!expanded" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
        </svg>
        <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" />
        </svg>
        <span>{{ expanded ? 'Thu Nhỏ' : 'Phóng To' }}</span>
      </button>

      <div v-if="loading" class="km3d-loading">
        <div class="km3d-spinner" aria-hidden="true"></div>
        <p>Đang tải đồ hình kinh lạc 3D…<span v-if="progress > 0"> {{ progress }}%</span></p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.km3d-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  animation: fadeIn 0.4s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.km3d-error {
  flex: none;
  background: var(--danger-bg);
  color: var(--danger);
  border: 1px solid var(--danger-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-5);
  font-size: var(--font-size-sm);
}
.km3d-error p { margin: 0 0 var(--space-1); }

/* Khung chứa đồ hình — engine 3D (.acu3d) gắn vào đây. Đặt chiều cao CỐ ĐỊNH (calc) để
 * .acu3d{height:100%} luôn resolve chắc chắn (tránh bẫy percentage-height của flexbox).
 * 140px ≈ header 64 + padding trên/dưới của content-area. */
.km3d-mount {
  flex: none;
  height: calc(100vh - 140px);
  height: calc(100dvh - 140px); /* dvh: canvas 3D không bị thanh URL mobile che/đẩy */
  min-height: 440px;
  position: relative;
}

.km3d-loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  color: var(--brown-600);
  background: var(--surface);
  border: 1px solid var(--gray-200);
  border-radius: 14px;
  z-index: 5;
}
.km3d-spinner {
  width: 36px; height: 36px;
  border: 3px solid var(--gray-200);
  border-top-color: var(--brown-500);
  border-radius: 50%;
  animation: km3d-spin 0.7s linear infinite;
}
@keyframes km3d-spin { to { transform: rotate(360deg); } }

/* Nút "Phóng To" — nổi ở góc dưới-phải khung 3D, chỉ hiện trên mobile (≤860px). */
.km3d-expand {
  display: none;
  position: absolute;
  right: 12px;
  bottom: 12px;
  z-index: 6;
  align-items: center;
  gap: var(--space-2);
  padding: 9px 14px;
  background: var(--brown-700);
  color: #fff;
  border: 0;
  border-radius: 999px;
  font-size: var(--font-size-sm);
  font-weight: 700;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.22);
  cursor: pointer;
}
.km3d-expand svg { flex: none; }
/* Khi đang ẩn mô hình (mở rộng danh sách) thì không có gì để phóng to → ẩn nút. */
.km3d-mount.hide-model .km3d-expand { display: none !important; }

/* Chế độ TOÀN MÀN HÌNH: khung 3D phủ kín màn hình, ẩn ngăn danh sách → mô hình to hết cỡ. */
.km3d-mount.is-expanded {
  position: fixed;
  inset: 0;
  z-index: 1000;
  height: 100vh;
  height: 100dvh; /* dvh: trừ thanh URL mobile */
  height: 100dvh; /* trừ thanh địa chỉ trình duyệt mobile để không bị tràn */
  min-height: 0;
  margin: 0;
  border-radius: 0;
  background: var(--surface);
}
.km3d-mount.is-expanded :deep(.acu3d) { border: 0; border-radius: 0; }
.km3d-mount.is-expanded :deep(.map-drawer) { display: none; }
/* Giữ nút ở góc dưới-phải (tránh đè thanh công cụ/ô tìm kiếm ở trên); luôn hiện để có lối thoát. */
.km3d-mount.is-expanded .km3d-expand {
  display: inline-flex !important;
}

/* Nút quay lại kết quả khám — chỉ hiện khi đến từ MeridianResultsView (?from=...). */
.km3d-back {
  display: inline-flex;
  align-self: flex-start;
  align-items: center;
  gap: var(--space-2);
  padding: 8px var(--space-4);
  background: var(--surface);
  color: var(--brown-700);
  border: 1px solid var(--brown-200);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
  transition: all var(--transition-fast);
}
.km3d-back:hover { background: var(--brown-50); border-color: var(--brown-300); }
.km3d-back svg { flex: none; }

/* Nút gạt ẩn/hiện mô hình 3D — mặc định ẨN, chỉ hiện trên mobile (≤860px). */
.km3d-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  width: 100%;
  padding: 9px var(--space-4);
  background: var(--surface);
  color: var(--brown-700);
  border: 1px solid var(--brown-200);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
  transition: all var(--transition-fast);
}
.km3d-toggle:hover { background: var(--brown-50); border-color: var(--brown-300); }
.km3d-toggle svg { flex: none; }

@media (max-width: 860px) {
  .km3d-toggle { display: flex; }
  .km3d-expand { display: inline-flex; }
  /* Khi ẩn mô hình: giấu sân khấu 3D, cho ngăn chọn (kinh + huyệt) chiếm trọn chiều cao. */
  .km3d-mount.hide-model :deep(.map-stage) { display: none; }
  .km3d-mount.hide-model :deep(.map-drawer) { max-height: none; flex: 1 1 auto; }
}
@media (max-width: 768px) {
  /* Trừ thêm chiều cao của nút gạt phía trên (≈54px) để khung không tràn quá viewport. */
  .km3d-mount { height: calc(100vh - 162px); height: calc(100dvh - 162px); }
}
@media (max-width: 480px) {
  /* Điện thoại nhỏ: hạ chiều cao tối thiểu để đồ hình không lấn quá nhiều. */
  .km3d-mount { min-height: 360px; }
}
@media (max-height: 480px) {
  /* Điện thoại xoay NGANG (màn thấp): không ép khung cao hơn viewport. */
  .km3d-mount { height: calc(100vh - 144px); height: calc(100dvh - 144px); min-height: 240px; }
}
</style>
