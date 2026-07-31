<script setup lang="ts">
/**
 * AmDuongTaiji — Thái Cực DƯ/KHUYẾT, ĐÚNG kiểu sách giáo khoa YHCT: Thái Cực ĐEN-TRẮNG THẬT
 * (bán kính R, tâm CX,CY) LUÔN CỐ ĐỊNH — đây chính là mốc "chuẩn/bình thường", không hề méo dạng
 * hay xê dịch. Vòng NÉT ĐỨT mới là mốc KHÔNG BÌNH THƯỜNG — nó phóng TO hơn (dư/thịnh) hoặc thu
 * NHỎ hơn (khuyết/hư) rồi dịch dọc theo trục cực đang bất thường, sao cho cạnh đối cực vẫn áp sát
 * viền Thái Cực chuẩn — chỉ cạnh phía cực bất thường mới lồi ra/lõm vào so với chuẩn. Thêm màu
 * (sách gốc chỉ có đen trắng) tô đúng phần lệch giữa 2 vòng để dễ đọc hơn:
 *   - DƯ (thịnh): phần vòng nét đứt lồi ra NGOÀI Thái Cực chuẩn — tô ĐẬM — "cần TẢ (phạt) bớt".
 *   - KHUYẾT (hư): phần Thái Cực chuẩn mà vòng nét đứt KHÔNG còn phủ tới — tô NHẠT — "cần BỔ".
 * Độc lập, dữ liệu từ tongCuong (amDuong · loai · hoiChung · reason) — đã map ở lib/meridianAnalysis.
 * Quy ước: Dương = nửa PHẢI (sáng/kem, góc 90°) · Âm = nửa TRÁI (tối/nâu, góc 270°).
 */
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import type { TongCuong } from '@/lib/meridianAnalysis'

// compact: chỉ vẽ taiji (không chữ), to hơn — dùng làm LỚP 1 của đồ hình bóc lớp ở Tab 3.
const props = defineProps<{ tongCuong: TongCuong; compact?: boolean }>()

// id clip riêng cho MỖI instance (trang render 2 chỗ cùng lúc — Tóm Tắt Bát Cương + tab
// Biện Chứng-Pháp Trị — id trùng nhau sẽ khiến clip-path lấy nhầm định nghĩa của instance khác).
let uidCounter = 0
const uid = `ad-clip-${uidCounter++}-${Date.now().toString(36)}`

// ── Hình học Thái Cực CHUẨN (vòng nét đứt — mốc "bình thường", LUÔN cố định) ──
// CX/CY để dư biên (không chỉ vừa khít R) — vòng nét đứt dịch ra ngoài vẫn nằm TRỌN trong viewBox,
// không tràn ra ngoài khung SVG che các phần tử khác cạnh nó.
const CX = 140
const CY = 140
const R = 92
const HALF = R / 2
const DOT_R = R / 5
const UP = CY - HALF
const DN = CY + HALF
const HALF_LEFT = `M${CX} ${CY - R} A${R} ${R} 0 0 0 ${CX} ${CY + R} Z`
const YANG = '#f4e7d1'
const YIN = '#4b3319'
const WARM = '#c0452a' // Dương/Nhiệt — khớp am-duong-thinh đã dùng ở BatCuongSummary
const COOL = '#245c8a' // Âm/Hàn — khớp am-am-thinh

const D2R = Math.PI / 180
function pt(r: number, deg: number, cx = CX, cy = CY) {
  const a = deg * D2R
  return { x: cx + r * Math.sin(a), y: cy - r * Math.cos(a) }
}
function circleClipD(cx: number, cy: number, r: number): string {
  const p0 = pt(r, 90, cx, cy)
  const p1 = pt(r, 270, cx, cy)
  return `M${p0.x} ${p0.y} A${r} ${r} 0 1 0 ${p1.x} ${p1.y} A${r} ${r} 0 1 0 ${p0.x} ${p0.y} Z`
}
// Toàn viewBox TRỪ 1 vòng tròn (evenodd) — dùng để clip "phần NẰM NGOÀI" vòng đó.
const VB = CX + CY // = 280, cạnh viewBox (CX=CY nên viewBox luôn vuông)
function outsideClip(cx: number, cy: number, r: number): string {
  return `M0 0 H${VB} V${VB} H0 Z ${circleClipD(cx, cy, r)}`
}

type Mode = 'du' | 'khuyet' | 'balance'
type Pole = 'duong' | 'am' | 'none'
interface Cfg { pole: Pole; mode: Mode; shift: number }
const BALANCE: Cfg = { pole: 'none', mode: 'balance', shift: 0 }
const CFG: Record<string, Cfg> = {
  'duong-thinh': { pole: 'duong', mode: 'du', shift: 0.2 },
  'am-thinh': { pole: 'am', mode: 'du', shift: 0.2 },
  'am-hu': { pole: 'am', mode: 'khuyet', shift: 0.2 }, // Âm THIẾU (không phải Dương dư) → khuyết bên Âm
  'duong-hu': { pole: 'duong', mode: 'khuyet', shift: 0.2 }, // Dương THIẾU → khuyết bên Dương
  'thien-duong': { pole: 'duong', mode: 'du', shift: 0.11 },
  'thien-am': { pole: 'am', mode: 'du', shift: 0.11 },
  'can-bang': BALANCE,
}
const cfg = computed<Cfg>(() => CFG[props.tongCuong?.loai || ''] ?? BALANCE)

// Góc cực: Dương = 90° (phải) · Âm = 270° (trái).
const poleDeg = computed(() => (cfg.value.pole === 'duong' ? 90 : cfg.value.pole === 'am' ? 270 : 0))
// Vòng NÉT ĐỨT (mốc KHÔNG bình thường): CÙNG bán kính R với Thái Cực chuẩn — KHÔNG phình to/thu
// nhỏ, chỉ DỊCH TÂM sang trái/phải. Dịch VỀ phía cực (mode 'du') → cực đó lồi ra (dư). Dịch RA
// XA cực (mode 'khuyet', tức về phía cực đối) → cực đó hụt vào (khuyết). 1 phép dịch tạo ra CẢ
// 2 hình lưỡi liềm cùng lúc (lồi 1 bên, khuyết bên kia) — chỉ đánh dấu màu đúng bên đang xét.
const shiftDeg = computed(() => (cfg.value.mode === 'khuyet' ? poleDeg.value + 180 : poleDeg.value))
const refR = R
const refCenter = computed(() => pt(R * cfg.value.shift, shiftDeg.value))
const bandColor = computed(() => (cfg.value.pole === 'duong' ? WARM : cfg.value.pole === 'am' ? COOL : 'transparent'))
// DƯ: hình lưỡi liềm của vòng nét đứt (đã dịch) lồi ra NGOÀI Thái Cực chuẩn (cố định).
const duFillD = computed(() => circleClipD(refCenter.value.x, refCenter.value.y, refR))
const duClip = computed(() => outsideClip(CX, CY, R))
// KHUYẾT: hình lưỡi liềm của Thái Cực chuẩn (cố định) mà vòng nét đứt (đã dịch) KHÔNG còn phủ tới.
const khuyetFillD = computed(() => circleClipD(CX, CY, R))
const khuyetClip = computed(() => outsideClip(refCenter.value.x, refCenter.value.y, refR))

const badge = computed(() => {
  if (cfg.value.mode === 'du') return { txt: 'DƯ · CẦN TẢ', sym: '▲', cls: 'ad-b-du' }
  if (cfg.value.mode === 'khuyet') return { txt: 'KHUYẾT · CẦN BỔ', sym: '▽', cls: 'ad-b-khuyet' }
  return null
})
const poleLabel = computed(() => (cfg.value.pole === 'duong' ? 'Dương' : cfg.value.pole === 'am' ? 'Âm' : ''))
const verdict = computed(() => props.tongCuong?.amDuong || 'Chưa rõ')
const loaiCls = computed(() => 'am-' + (props.tongCuong?.loai || 'unknown'))
// Nút "i" cạnh verdict → mở MODAL GIỮA màn hình (giống popup Hư-Thực/Tạng phủ) giải thích DƯ/KHUYẾT.
const infoOpen = ref(false)
function closeInfo() {
  infoOpen.value = false
}
watch(infoOpen, (open) => {
  if (open) document.addEventListener('click', closeInfo, { once: true })
})
onBeforeUnmount(() => document.removeEventListener('click', closeInfo))
const modalInfo = computed(() => {
  const p = poleLabel.value
  if (cfg.value.mode === 'du')
    return { title: `${p} DƯ · CẦN TẢ`, body: `Cực ${p} đang THỊNH (phần dư ôm ra ngoài Thái Cực chuẩn). Nguyên tắc: TẢ (phạt) bớt phần dư để lập lại cân bằng Âm-Dương.` }
  if (cfg.value.mode === 'khuyet')
    return { title: `${p} KHUYẾT · CẦN BỔ`, body: `Cực ${p} đang HƯ (phần khuyết hụt vào trong). Nguyên tắc: BỔ thêm phần thiếu để lập lại cân bằng Âm-Dương.` }
  return null
})
</script>

<template>
  <div class="ad-card" :class="[loaiCls, { 'ad-card--compact': compact }]">
    <div class="ad-fig">
      <svg :viewBox="`0 0 ${VB} ${VB}`" class="ad-svg" role="img" aria-label="Thái Cực dư/khuyết">
        <defs>
          <clipPath :id="'du-' + uid"><path fill-rule="evenodd" :d="duClip" /></clipPath>
          <clipPath :id="'khuyet-' + uid"><path fill-rule="evenodd" :d="khuyetClip" /></clipPath>
        </defs>

        <!-- Thái Cực ĐEN-TRẮNG THẬT — mốc CHUẨN, LUÔN cố định (bán kính R, tâm CX,CY), không
        méo dạng, không xê dịch theo loai. Không viền nét liền — chỉ tô màu thuần, viền nét đứt
        (vòng KHÔNG bình thường) là đường viền DUY NHẤT hiển thị. -->
        <circle :cx="CX" :cy="CY" :r="R" :fill="YANG" />
        <path :d="HALF_LEFT" :fill="YIN" />
        <circle :cx="CX" :cy="UP" :r="HALF" :fill="YIN" />
        <circle :cx="CX" :cy="DN" :r="HALF" :fill="YANG" />
        <circle :cx="CX" :cy="UP" :r="DOT_R" :fill="YANG" />
        <circle :cx="CX" :cy="DN" :r="DOT_R" :fill="YIN" />

        <!-- DƯ: đúng phần vòng nét đứt (đã phóng to) lồi ra NGOÀI Thái Cực chuẩn — tô ĐẬM = cần TẢ bớt -->
        <path v-if="cfg.mode === 'du'" :d="duFillD" :fill="bandColor" class="ad-band ad-band--du" :clip-path="`url(#du-${uid})`" />
        <!-- KHUYẾT: đúng phần Thái Cực chuẩn mà vòng nét đứt (đã thu nhỏ) CHƯA phủ tới — tô NHẠT = cần BỔ -->
        <path v-if="cfg.mode === 'khuyet'" :d="khuyetFillD" :fill="bandColor" class="ad-band ad-band--khuyet" :clip-path="`url(#khuyet-${uid})`" />

        <!-- Vòng NÉT ĐỨT — mốc KHÔNG BÌNH THƯỜNG: phóng to/thu nhỏ + dịch theo cực đang lệch.
             Tô MÀU THEO CHIỀU (dư = cam-đỏ · khuyết = xanh) + viền tương phản để nổi trên mọi nền. -->
        <circle :cx="refCenter.x" :cy="refCenter.y" :r="refR" fill="none" class="ad-ref-ring" :class="'ad-ref-ring--' + cfg.mode" />
      </svg>
    </div>

    <div v-if="!compact" class="ad-text">
      <div class="ad-verdict-row">
        <span class="ad-tag">Tổng cương · Âm–Dương</span>
        <span class="ad-verdict" :class="loaiCls">{{ verdict }}</span>
        <!-- "i" nhỏ cạnh verdict thay badge to: hover có title, bấm mở popover DƯ·CẦN TẢ / KHUYẾT·CẦN BỔ -->
        <span v-if="badge" class="ad-info-wrap">
          <button
            type="button"
            class="ad-info-btn"
            :class="{ 'is-open': infoOpen }"
            :title="poleLabel + ' ' + badge.txt"
            :aria-expanded="infoOpen"
            aria-label="Giải thích dư/khuyết"
            @click.stop="infoOpen = !infoOpen"
          >i</button>
        </span>
        <!-- Modal GIỮA màn hình (giống popup Hư-Thực / Tạng phủ) — nổi vào giữa, có nền mờ + nút đóng -->
        <Teleport to="body">
          <div v-if="infoOpen && modalInfo" class="adm-overlay" @click.self="closeInfo">
            <div class="adm-modal" :class="'adm-modal--' + cfg.mode" role="dialog" aria-modal="true" @click.stop>
              <div class="adm-head">
                <span class="adm-sym">{{ badge?.sym }}</span>
                <h4 class="adm-title">{{ modalInfo.title }}</h4>
                <button type="button" class="adm-close" aria-label="Đóng" @click="closeInfo">✕</button>
              </div>
              <p class="adm-body">{{ modalInfo.body }}</p>
            </div>
          </div>
        </Teleport>
      </div>
      <p v-if="tongCuong?.hoiChung" class="ad-hoichung">Hội chứng: <b>{{ tongCuong.hoiChung }}</b></p>
      <p v-if="tongCuong?.reason" class="ad-reason">{{ tongCuong.reason }}</p>
    </div>
  </div>
</template>

<style scoped>
.ad-card {
  display: flex; gap: var(--space-3); align-items: center; flex-wrap: wrap;
  padding: var(--space-3); background: var(--surface-2); border: 1px solid var(--brown-100);
  border-left: 4px solid var(--brown-600); border-radius: var(--radius-md);
}
/* compact: chỉ taiji (không chữ), to hơn — dùng làm LỚP 1 của đồ hình bóc lớp ở Tab 3 */
.ad-card--compact { justify-content: center; padding: var(--space-4); }
.ad-card--compact .ad-svg { width: 240px; height: 240px; }
.ad-fig { position: relative; flex: none; }
/* KHÔNG overflow:visible — mọi nội dung (kể cả vòng nét đứt dịch lệch tâm) phải nằm TRỌN trong
   viewBox (đã chừa dư biên ở CX/CY) để không tràn/che các phần tử khác cạnh khối này. */
.ad-svg { width: 128px; height: 128px; display: block; filter: drop-shadow(0 3px 8px rgba(60, 40, 15, 0.22)); }

/* Vòng NÉT ĐỨT — mốc lệch khỏi "bình thường". Dày + đục + VIỀN KÉP (tối+sáng) để KHÔNG trùng nền
   (nổi cả trên kem lẫn nền navy của đồ hình); màu theo chiều để nhìn phát biết dư hay khuyết. */
.ad-ref-ring {
  stroke: var(--gray-500, #7d7264);
  stroke-width: 2.4;
  stroke-dasharray: 5 3.5;
  opacity: 1;
  filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.55)) drop-shadow(0 0 1.5px rgba(255, 255, 255, 0.7));
}
.ad-ref-ring--du { stroke: #d1502e; } /* DƯ (thừa ra) → viền CAM-ĐỎ, phóng TO ra ngoài */
.ad-ref-ring--khuyet { stroke: #3a86bd; } /* KHUYẾT (hụt vào) → viền XANH, thu NHỎ vào trong */

/* DƯ — phần Thái Cực lồi ra NGOÀI vòng chuẩn: tô ĐẶC + quầng sáng cam mạnh = "thừa hẳn ra". */
.ad-band--du {
  opacity: 0.9;
  stroke: #a8341c;
  stroke-width: 1.3;
  filter: drop-shadow(0 0 6px rgba(224, 150, 60, 0.95));
}
/* KHUYẾT — phần vòng chuẩn Thái Cực CHƯA phủ tới: tô NHẠT + viền NÉT ĐỨT xanh bao quanh = "chỗ
   RỖNG đang THIẾU" (khác hẳn DƯ đặc). */
.ad-band--khuyet {
  opacity: 0.4;
  stroke: #3a86bd;
  stroke-width: 1.8;
  stroke-dasharray: 3.5 2.5;
}

.ad-b-du { background: #c0452a; }
.ad-b-khuyet { background: #2f6690; }
/* "i" nhỏ cạnh verdict (thay badge to) + popover DƯ·CẦN TẢ / KHUYẾT·CẦN BỔ */
.ad-info-wrap { position: relative; display: inline-flex; align-self: center; }
/* Nút i trung tính (nâu nhạt) — không tô đỏ chói; màu DƯ/KHUYẾT chỉ hiện ở viền popover. */
.ad-info-btn {
  display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px;
  border-radius: 50%; border: 1px solid var(--brown-300, #d3b58a); color: var(--brown-700, #5a3e1e);
  background: var(--white, #fff); font-size: 11px; font-weight: 800; font-style: italic;
  cursor: pointer; line-height: 1; transition: all var(--transition-fast);
}
.ad-info-btn:hover, .ad-info-btn.is-open { background: var(--brown-50, #f7efe2); border-color: var(--brown-500, #a4743a); }
/* Popover: nền TỐI trung tính (không chói), DỜI SANG PHẢI nút i (không đè dòng Hội chứng) */
/* Popover DƯỚI nút i, căn giữa (như popover Hư-Thực) — nền tối SẠCH, không viền màu, không hồng */
/* Modal GIỮA màn hình (Teleport body) — nổi vào giữa như popup Hư-Thực/Tạng phủ */
.adm-overlay {
  position: fixed; inset: 0; z-index: 340;
  background: rgba(15, 23, 42, 0.5); display: flex; align-items: center; justify-content: center;
  padding: var(--space-4); animation: adm-fade 0.16s ease;
}
@keyframes adm-fade { from { opacity: 0; } to { opacity: 1; } }
.adm-modal {
  width: 100%; max-width: 380px; background: var(--surface, #fff);
  border: 1px solid var(--border, #e7ddcd); border-top: 4px solid var(--brown-600, #6b4a24);
  border-radius: var(--radius-lg, 14px); box-shadow: 0 18px 48px rgba(30, 20, 8, 0.3); overflow: hidden;
}
.adm-modal--du { border-top-color: #c0452a; }
.adm-modal--khuyet { border-top-color: #2f6690; }
.adm-head { display: flex; align-items: center; gap: 8px; padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--brown-100, #e7ddcd); }
.adm-sym { font-size: 16px; font-weight: 800; }
.adm-modal--du .adm-sym { color: #c0452a; }
.adm-modal--khuyet .adm-sym { color: #2f6690; }
.adm-title { margin: 0; flex: 1; font-size: var(--font-size-base); font-weight: 800; color: var(--brown-800, #3a2712); }
.adm-close {
  flex: none; width: 26px; height: 26px; border: none; background: transparent; cursor: pointer;
  font-size: 15px; color: var(--gray-500); border-radius: 6px;
}
.adm-close:hover { background: var(--brown-50, #f7efe2); color: var(--brown-700); }
.adm-body { margin: 0; padding: var(--space-3) var(--space-4) var(--space-4); font-size: var(--font-size-sm); line-height: 1.6; color: var(--brown-800, #3a2712); }

.ad-text { flex: 1 1 200px; min-width: 180px; display: flex; flex-direction: column; gap: 4px; }
.ad-verdict-row { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
.ad-tag { font-size: var(--font-size-xs); font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; color: var(--gray-500); }
.ad-verdict { font-size: var(--font-size-lg); font-weight: 800; color: #fff; padding: 3px 14px; border-radius: 999px; background: var(--brown-600); }
/* Màu verdict theo loại (đồng bộ BatCuongSummary) */
.ad-verdict.am-duong-thinh { background: #c0452a; }
.ad-verdict.am-am-hu { background: #d98324; }
.ad-verdict.am-am-thinh { background: #245c8a; }
.ad-verdict.am-duong-hu { background: #4b7ea3; }
.ad-verdict.am-thien-duong { background: #cf6b52; }
.ad-verdict.am-thien-am { background: #5f86a6; }
.ad-verdict.am-can-bang, .ad-verdict.am-unknown { background: var(--brown-500); }
.ad-hoichung { margin: 0; font-size: var(--font-size-sm); color: var(--brown-800); }
.ad-hoichung b { font-weight: 800; }
.ad-reason { margin: 0; font-size: var(--font-size-xs); font-style: italic; color: var(--gray-600); line-height: 1.5; }
</style>
