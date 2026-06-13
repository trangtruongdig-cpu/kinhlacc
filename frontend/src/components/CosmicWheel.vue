<script setup lang="ts">
/**
 * CosmicWheel — Vòng tròn Đông Y vẽ HOÀN TOÀN bằng SVG + CSS (không dùng ảnh).
 * 4 vòng lồng vào nhau, mỗi vòng tự xoay 1 tốc độ / chiều khác nhau:
 *   ┌ Lục Kinh (六經)  — vòng ngoài cùng, 6 cung (3 Dương + 3 Âm)
 *   ├ Ngũ Hành (五行) — 5 cung: Mộc 木 · Hỏa 火 · Thổ 土 · Kim 金 · Thủy 水
 *   ├ Tứ Khí  (四氣)  — 4 cung: Hàn 寒 · Lương 涼 · Ôn 溫 · Nhiệt 熱 (lạnh → nóng)
 *   └ Âm Dương (陰陽) — Thái Cực ở chính giữa
 *
 * Mỗi cung có chữ Hán (lớn) + tên tiếng Việt (nhỏ). Màu lấy theo bảng "Ngũ Hành dịu"
 * của theme, nhưng làm sáng/phát quang hơn để nổi trên nền nâu của hero.
 *
 * Toàn bộ toạ độ tính trong khung viewBox 0 0 400 400, tâm tại (200, 200).
 */

const CX = 200
const CY = 200

// Điểm trên đường tròn: góc tính từ đỉnh (12 giờ), chiều kim đồng hồ.
function pt(r: number, deg: number) {
  const a = (deg * Math.PI) / 180
  return { x: CX + r * Math.sin(a), y: CY - r * Math.cos(a) }
}

// Vẽ 1 cung hình "vành khuyên" (donut wedge) từ a0 → a1 độ.
function donut(rOut: number, rIn: number, a0: number, a1: number): string {
  const o0 = pt(rOut, a0)
  const o1 = pt(rOut, a1)
  const i1 = pt(rIn, a1)
  const i0 = pt(rIn, a0)
  const large = a1 - a0 > 180 ? 1 : 0
  const f = (n: number) => n.toFixed(2)
  return [
    `M${f(o0.x)} ${f(o0.y)}`,
    `A${rOut} ${rOut} 0 ${large} 1 ${f(o1.x)} ${f(o1.y)}`,
    `L${f(i1.x)} ${f(i1.y)}`,
    `A${rIn} ${rIn} 0 ${large} 0 ${f(i0.x)} ${f(i0.y)}`,
    'Z',
  ].join(' ')
}

interface RingItem {
  han: string
  viet: string
  fill: string
  text: string
}
interface Seg extends RingItem {
  d: string
  mid: number
}

// Chia 360° cho N cung; chừa 1 khe nhỏ (gap) giữa các cung cho thoáng.
function buildRing(items: RingItem[], rOut: number, rIn: number, gap: number): Seg[] {
  const step = 360 / items.length
  return items.map((it, i) => {
    const a0 = i * step + gap / 2
    const a1 = (i + 1) * step - gap / 2
    return { ...it, d: donut(rOut, rIn, a0, a1), mid: i * step + step / 2 }
  })
}

// ---- Bảng màu (sáng/phát quang để đọc rõ trên nền nâu) ----
const MOC = { fill: 'rgba(126,176,112,.34)', text: '#e7f4dc' }
const HOA = { fill: 'rgba(204,112,79,.38)', text: '#f9ddcc' }
const THO = { fill: 'rgba(208,168,92,.36)', text: '#f7e7c2' }
const KIM = { fill: 'rgba(228,216,184,.30)', text: '#faf3e4' }
const THUY = { fill: 'rgba(92,154,184,.36)', text: '#dcedf3' }

const YANG = { fill: 'rgba(214,178,108,.24)', text: '#f5e9d2' } // Dương — ấm (vàng)
const YIN = { fill: 'rgba(150,170,184,.22)', text: '#e8eff4' } // Âm — mát (lam tro)

const COLD = { fill: 'rgba(86,140,178,.34)', text: '#dcebf4' }
const COOL = { fill: 'rgba(96,162,150,.32)', text: '#ddf1ea' }
const WARM = { fill: 'rgba(206,160,86,.34)', text: '#f7e7c5' }
const HOT = { fill: 'rgba(202,98,72,.36)', text: '#f9d9c8' }

// ---- Dữ liệu 3 vòng ----
const lucKinh = buildRing(
  [
    { han: '太陽', viet: 'Thái Dương', ...YANG },
    { han: '陽明', viet: 'Dương Minh', ...YANG },
    { han: '少陽', viet: 'Thiếu Dương', ...YANG },
    { han: '太陰', viet: 'Thái Âm', ...YIN },
    { han: '少陰', viet: 'Thiếu Âm', ...YIN },
    { han: '厥陰', viet: 'Quyết Âm', ...YIN },
  ],
  198,
  151,
  2,
)

const nguHanh = buildRing(
  [
    { han: '木', viet: 'Mộc', ...MOC },
    { han: '火', viet: 'Hỏa', ...HOA },
    { han: '土', viet: 'Thổ', ...THO },
    { han: '金', viet: 'Kim', ...KIM },
    { han: '水', viet: 'Thủy', ...THUY },
  ],
  148,
  104,
  2,
)

const tuKhi = buildRing(
  [
    { han: '寒', viet: 'Hàn', ...COLD },
    { han: '涼', viet: 'Lương', ...COOL },
    { han: '溫', viet: 'Ôn', ...WARM },
    { han: '熱', viet: 'Nhiệt', ...HOT },
  ],
  101,
  62,
  2.5,
)

// Bán kính đặt chữ. LƯU Ý: tiếng VIỆT (dòng chính) dùng bán kính LỚN (vòng NGOÀI, rộng chỗ),
// chữ HÁN (phụ chú) dùng bán kính NHỎ (vòng TRONG) — xem cách gắn trong <template>.
const LK_HAN = 182 // ← Việt (Lục Kinh): hơi lùi vào để dấu chồng (vd "Thiếu") không chạm vành đồng
const LK_VIET = 163 // ← Hán (Lục Kinh)
const NH_HAN = 132 // ← Việt (Ngũ Hành)
const NH_VIET = 114 // ← Hán (Ngũ Hành)
const TK_HAN = 90 // ← Việt (Tứ Khí)
const TK_VIET = 75 // ← Hán (Tứ Khí)

// ---- Thái Cực ở giữa ----
const R = 50 // bán kính Thái Cực
const yang = '#f4e7d1' // nửa sáng
const yin = '#4b3319' // nửa tối
// Đường cong chữ S kinh điển (nửa tối nằm bên phải + bướu trên).
const taiji = `M200 ${CY - R} a ${R / 2} ${R / 2} 0 0 0 0 ${R} a ${R / 2} ${R / 2} 0 0 1 0 ${R} a ${R} ${R} 0 0 1 0 ${-2 * R} Z`
const dot = R / 5
</script>

<template>
  <div class="wheel-wrap" aria-hidden="false">
    <svg class="wheel" viewBox="0 0 400 400" role="img" aria-label="Vòng tròn Âm Dương, Ngũ Hành, Tứ Khí, Lục Kinh">
      <title>Âm Dương · Ngũ Hành · Tứ Khí · Lục Kinh</title>

      <defs>
        <!-- Mặt đá/đồng khắc chìm: đậm hơn nền nâu hero → medallion TÁCH khỏi nền;
             tối ở rìa, ấm sáng nhẹ ở tâm, hơi top-lit (cy 40%). -->
        <radialGradient id="cw-stone" cx="50%" cy="40%" r="64%">
          <stop offset="0%" stop-color="#5b3f20" />
          <stop offset="46%" stop-color="#4a3219" />
          <stop offset="80%" stop-color="#37230f" />
          <stop offset="100%" stop-color="#2a1a0a" />
        </radialGradient>
        <!-- Hào quang kem ấm ở giữa: giữ màu các Hành/Tứ Khí/Thái Cực đúng tông & nổi. -->
        <radialGradient id="cw-glow" cx="50%" cy="46%" r="48%">
          <stop offset="0%" stop-color="rgba(250,240,218,.32)" />
          <stop offset="52%" stop-color="rgba(248,236,212,.10)" />
          <stop offset="100%" stop-color="rgba(248,236,212,0)" />
        </radialGradient>
        <!-- Vành đồng hai tông (khung kim loại): sáng kem trên → đồng tối dưới. -->
        <linearGradient id="cw-rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#fbf2dd" />
          <stop offset="48%" stop-color="#e3cd9a" />
          <stop offset="100%" stop-color="#a4743a" />
        </linearGradient>
        <!-- Bóng đổ vào trong ở mép đĩa → cảm giác recessed/khắc chìm. -->
        <radialGradient id="cw-inner-shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="rgba(0,0,0,0)" />
          <stop offset="76%" stop-color="rgba(0,0,0,0)" />
          <stop offset="92%" stop-color="rgba(20,11,4,.34)" />
          <stop offset="100%" stop-color="rgba(12,6,2,.60)" />
        </radialGradient>
      </defs>

      <!-- ====== Nền medallion (tĩnh, vẽ TRƯỚC các vòng nên không xoay) ====== -->
      <g class="cw-backdrop" aria-hidden="true">
        <!-- mặt đá/đồng khắc — nền chính, đậm hơn hero -->
        <circle :cx="CX" :cy="CY" r="196" fill="url(#cw-stone)" />
        <!-- lõi sáng ấm ở tâm (vẽ trên mặt đá) -->
        <circle :cx="CX" :cy="CY" r="160" fill="url(#cw-glow)" />
        <!-- bóng lõm ở mép → recessed -->
        <circle :cx="CX" :cy="CY" r="196" fill="url(#cw-inner-shadow)" />
        <!-- chỉ tối mảnh ôm trong (định nét, mờ dưới vòng ngoài) -->
        <circle :cx="CX" :cy="CY" r="190.5" fill="none" stroke="rgba(34,20,8,.5)" stroke-width="1" />
      </g>

      <!-- ====== Vòng Lục Kinh (ngoài cùng) ====== -->
      <g class="ring spin-a">
        <path v-for="(s, i) in lucKinh" :key="'lk' + i" :d="s.d" :fill="s.fill" class="seg" />
        <g v-for="(s, i) in lucKinh" :key="'lkt' + i" :transform="`rotate(${s.mid} 200 200)`">
          <text class="viet viet-lk" x="200" :y="CY - LK_HAN" :fill="s.text">{{ s.viet }}</text>
          <text class="han han-lk" x="200" :y="CY - LK_VIET" :fill="s.text">{{ s.han }}</text>
        </g>
      </g>

      <!-- ====== Vòng Ngũ Hành ====== -->
      <g class="ring spin-b">
        <path v-for="(s, i) in nguHanh" :key="'nh' + i" :d="s.d" :fill="s.fill" class="seg" />
        <g v-for="(s, i) in nguHanh" :key="'nht' + i" :transform="`rotate(${s.mid} 200 200)`">
          <text class="viet viet-nh" x="200" :y="CY - NH_HAN" :fill="s.text">{{ s.viet }}</text>
          <text class="han han-nh" x="200" :y="CY - NH_VIET" :fill="s.text">{{ s.han }}</text>
        </g>
      </g>

      <!-- ====== Vòng Tứ Khí ====== -->
      <g class="ring spin-c">
        <path v-for="(s, i) in tuKhi" :key="'tk' + i" :d="s.d" :fill="s.fill" class="seg" />
        <g v-for="(s, i) in tuKhi" :key="'tkt' + i" :transform="`rotate(${s.mid} 200 200)`">
          <text class="viet viet-tk" x="200" :y="CY - TK_HAN" :fill="s.text">{{ s.viet }}</text>
          <text class="han han-tk" x="200" :y="CY - TK_VIET" :fill="s.text">{{ s.han }}</text>
        </g>
      </g>

      <!-- ====== Thái Cực / Âm Dương ở giữa ====== -->
      <g class="core spin-d">
        <circle :cx="CX" :cy="CY" :r="R" :fill="yang" stroke="rgba(247,239,222,.6)" stroke-width="1" />
        <path :d="taiji" :fill="yin" />
        <circle :cx="CX" :cy="CY - R / 2" :r="dot" :fill="yang" />
        <circle :cx="CX" :cy="CY + R / 2" :r="dot" :fill="yin" />
        <!-- 陽 trên nửa SÁNG (trái) → tô màu TỐI; 陰 trên nửa TỐI (phải) → tô màu SÁNG -->
        <text class="han yy" :x="CX - R * 0.33" :y="CY + 0.5" :fill="yin">陽</text>
        <text class="han yy" :x="CX + R * 0.33" :y="CY + 0.5" :fill="yang">陰</text>
      </g>

      <!-- ====== Khung & vạch ngăn (vẽ TRÊN cùng cho nét sắc) ====== -->
      <g fill="none">
        <!-- vành đồng hai tông ngoài cùng (khung medallion) -->
        <circle :cx="CX" :cy="CY" r="197" stroke="url(#cw-rim)" stroke-width="2.6" stroke-opacity=".92" />
        <!-- vạch ngăn kem mảnh giữa các vòng -->
        <g class="rims">
          <circle :cx="CX" :cy="CY" r="150" />
          <circle :cx="CX" :cy="CY" r="102" />
          <circle :cx="CX" :cy="CY" r="60" />
        </g>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.wheel-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}
.wheel {
  width: 100%;
  height: auto;
  display: block;
  overflow: visible;
  filter: drop-shadow(0 6px 18px rgba(0, 0, 0, 0.28));
}

/* Cung màu — viền kem mảnh cho tách bạch */
.seg {
  stroke: rgba(247, 242, 233, 0.28);
  stroke-width: 0.8;
}

/* Chữ — viền tối (paint-order) để đọc rõ trên nền nhiều màu.
   TIẾNG VIỆT = dòng CHÍNH (to, đậm, rõ); CHỮ HÁN = phụ chú (nhỏ, mờ). */
.wheel text {
  font-family: var(--font-family, 'Inter', sans-serif);
  text-anchor: middle;
  dominant-baseline: middle;
  paint-order: stroke;
  stroke-linejoin: round;
  user-select: none;
}

/* Hán — phụ chú: nhỏ, nhạt, nhẹ nét (vẫn rõ nhờ viền vẽ trước).
   Viền đặt ở chính .han/.viet (KHÔNG ở .wheel text) để không bị specificity đè. */
.han {
  font-weight: 500;
  opacity: 0.6;
  stroke: rgba(34, 20, 8, 0.6);
  stroke-width: 0.8px;
}
.han-lk {
  font-size: 9px;
  letter-spacing: 0.5px;
}
.han-nh {
  font-size: 12px;
}
.han-tk {
  font-size: 8.5px;
}

/* Việt — dòng chính: to, đậm 800, contrast đầy, viền dày hơn để nổi mọi màu */
.viet {
  font-weight: 800;
  opacity: 1;
  letter-spacing: 0.2px;
  stroke: rgba(34, 20, 8, 0.72);
  stroke-width: 1.1px;
}
.viet-lk {
  font-size: 14px;
  letter-spacing: 0.1px;
}
.viet-nh {
  font-size: 16px;
}
.viet-tk {
  font-size: 12px;
}

/* Thái Cực 陽/陰 — cặp cân bằng, giữ nguyên, không viền, full opacity */
.yy {
  font-size: 11px;
  font-weight: 700;
  stroke-width: 0;
  opacity: 1;
}

/* Vạch ngăn tĩnh giữa các vòng */
.rims circle {
  stroke: rgba(248, 240, 224, 0.4);
  stroke-width: 1;
}

/* ---- Xoay: mỗi vòng 1 tốc độ + chiều khác nhau ---- */
.ring,
.core {
  transform-box: view-box;
  transform-origin: 200px 200px;
}
@keyframes cw-spin {
  to {
    transform: rotate(360deg);
  }
}
.spin-a {
  animation: cw-spin 90s linear infinite;
} /* Lục Kinh — chậm, thuận */
.spin-b {
  animation: cw-spin 64s linear infinite reverse;
} /* Ngũ Hành — ngược chiều */
.spin-c {
  animation: cw-spin 46s linear infinite;
} /* Tứ Khí — thuận */
.spin-d {
  animation: cw-spin 28s linear infinite;
} /* Thái Cực — nhanh nhất */

/* Tôn trọng người dùng tắt hiệu ứng chuyển động */
@media (prefers-reduced-motion: reduce) {
  .ring,
  .core {
    animation: none;
  }
}
</style>
