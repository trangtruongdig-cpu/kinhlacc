<script setup lang="ts">
/**
 * HeroKhungWheel — "Hình" hero trang chủ: dùng LẠI đúng các bàn xoay THẬT của app (rich, nhiều lớp),
 * VỪA XOAY vừa LUÂN CHUYỂN qua 3 lớp cho đỡ đơn điệu:
 *   ① Lục Kinh 六經  → VongLucKinh (Khung: Lục Kinh · Tạng Phủ · Lục Khí + truyền biến ①→⑥)
 *   ② Lục Khí 六氣  → VongLucKhi (Khí → Kinh bản khí → Tạng/Phủ)
 *   ③ Tạng Phủ 五臟 → BienChungWheel lớp 3 (auto): tự trỏ lần lượt Ngũ Tạng → sáng cung SINH/KHẮC + thẻ tàng tượng
 *
 * Ở hero chỉ là TRANG TRÍ: khoá tương tác (pointer-events:none), ẩn nút/chú thích/thẻ của component,
 * và cho cả đĩa XOAY chậm (CSS). Tôn trọng prefers-reduced-motion: đứng yên ở lớp Lục Kinh.
 */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import VongLucKinh from '@/components/VongLucKinh.vue'
import VongLucKhi from '@/components/VongLucKhi.vue'
import BienChungWheel from '@/components/BienChungWheel.vue'

// Mỗi lớp có 6 nan; "chạy đèn" (chase) lần lượt để đĩa nào cũng SỐNG động, không chỉ đứng xoay.
const KINH_SLUGS = ['thai-duong', 'duong-minh', 'thieu-duong', 'thai-am', 'thieu-am', 'quyet-am'] // slug Lục Kinh
const KHI_KEYS = ['Hàn', 'Táo', 'Thử', 'Thấp', 'Nhiệt', 'Phong'] // key Lục Khí (constants/lucKhi.ts)

const reduce =
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
const motion = ref(!reduce)

const mode = ref(0) // 0 = Lục Kinh · 1 = Lục Khí · 2 = Tạng Phủ (Ngũ Hành sinh/khắc)
const step = ref(0) // 0..5 — con trỏ "chạy đèn" dùng chung cho cả ① (kinh) và ③ (khí)

// ① Lục Kinh: trỏ lần lượt từng kinh → kinh + cặp biểu-lý (Trung Kiến) sáng lên, xoay quanh vòng.
const activeKinh = computed(() => (mode.value === 0 ? (KINH_SLUGS[step.value % 6] ?? null) : null))
// ② Lục Khí: trỏ lần lượt từng Khí → tâm Ngũ Hành sáng cung Sinh/Khắc (khí tác động tạng phủ).
const activeKhi = computed(() => (mode.value === 1 ? (KHI_KEYS[step.value % 6] ?? null) : null))

let modeTimer: ReturnType<typeof setInterval> | null = null
let stepTimer: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  if (!motion.value) return
  modeTimer = setInterval(() => {
    mode.value = (mode.value + 1) % 3
  }, 9500) // ≥ 1 chu kỳ "chạy đèn" (6 nhịp × 1,4s) để mỗi vòng đi hết hiệu ứng rồi mới chuyển
  stepTimer = setInterval(() => {
    step.value = (step.value + 1) % 6
  }, 1400)
})
onBeforeUnmount(() => {
  if (modeTimer) clearInterval(modeTimer)
  if (stepTimer) clearInterval(stepTimer)
})
</script>

<template>
  <div class="hkw">
    <div class="hkw-stage" :class="{ motion }">
      <!-- ① Lục Kinh — Khung đầy đủ, chạy đèn lần lượt từng kinh + cặp biểu-lý -->
      <div class="hkw-layer hkw-l-kinh" :class="{ on: mode === 0 }" aria-hidden="true">
        <VongLucKinh :active-kinh="activeKinh" />
      </div>
      <!-- ② Lục Khí — Khí → Kinh (bản khí) → Tạng; chạy đèn từng khí để tâm Ngũ Hành sáng (khí tác động tạng phủ) -->
      <div class="hkw-layer hkw-l-khi" :class="{ on: mode === 1 }" aria-hidden="true">
        <VongLucKhi :show-card="false" :active-khi="activeKhi" />
      </div>
      <!-- ③ Tạng Phủ — HÌNH RIÊNG: Ngũ Tạng · Ngũ Hành tương sinh/khắc (BienChungWheel lớp 3); auto = tự chạy đèn từng tạng -->
      <div class="hkw-layer hkw-l-tang" :class="{ on: mode === 2 }" aria-hidden="true">
        <BienChungWheel :lop="3" :auto="true" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.hkw {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.hkw-stage {
  position: relative;
  width: 100%;
  aspect-ratio: 1; /* giữ chỗ vuông để 2 lớp xếp chồng không nhảy */
}
.hkw-layer {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 1s ease;
  pointer-events: none; /* hero = trang trí, khoá mọi tương tác/hover */
}
.hkw-layer.on {
  opacity: 1;
}
/* Chuẩn cỡ ĐĨA giữa 3 vòng (bán kính vành / viewBox khác nhau) → crossfade KHÔNG nhảy cỡ.
   Vành ngoài: Lục Kinh 191/210=.910 · Lục Khí 197/200=.985 · Tạng Phủ 199/210=.948 → scale về cùng ~.940.
   transform-origin mặc định = tâm layer; layer đã phủ khít hộp vuông (dưới) nên scale KHÔNG dời tâm. */
.hkw-l-kinh { transform: scale(1.033); }
.hkw-l-khi { transform: scale(0.954); }
.hkw-l-tang { transform: scale(0.992); }

/* Panel chi tiết (BienChungWheel) trên NỀN TỐI hero → nền đậm + chữ sáng cho dễ đọc. */
.hkw-layer :deep(.bcw-hoverinfo) { background: rgba(24, 14, 6, 0.8); border-color: rgba(214, 180, 120, 0.55) !important; }
.hkw-layer :deep(.bcw-hoverinfo .hi-tag),
.hkw-layer :deep(.bcw-hoverinfo .hi-func),
.hkw-layer :deep(.bcw-hoverinfo .hi-item) { color: #e9dabc !important; }
.hkw-layer :deep(.bcw-hoverinfo .hi-item b),
.hkw-layer :deep(.bcw-hoverinfo .hi-main) { color: #fff6e4 !important; }

/* KHOÁ VỊ TRÍ: ép cả 3 vòng vào CÙNG một hộp vuông TUYỆT ĐỐI (bỏ max-width theo vh + flex-column
   của component) → viewBox vuong map khít hộp vuông, tâm đĩa TRÙNG KHÍT giữa 3 lớp, không lệch khi crossfade. */
.hkw-layer :deep(.vlk),
.hkw-layer :deep(.bcw) {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  margin: 0;
  padding: 0;
  gap: 0;
  display: block;
}
/* Thẻ chi tiết Tạng Phủ nổi tuyệt đối NGAY DƯỚI đáy đĩa (top:100%) → KHÔNG chiếm chỗ trong luồng
   (không đẩy đĩa lệch lên) VÀ không đè lên đồ hình tròn. Kinh/Khí không có thẻ nên tâm vẫn trùng. */
.hkw-layer :deep(.bcw-hoverinfo),
.hkw-layer :deep(.bcw-quainote) {
  position: absolute;
  left: 50%;
  top: 100%;
  transform: translateX(-50%);
  margin: 10px 0 0;
  width: max-content;
  max-width: 96%;
}
/* Ẩn phần điều khiển/chú thích/thẻ của bản app (chỉ chừa lại ĐĨA) */
.hkw-layer :deep(.vlk-halfbtns),
.hkw-layer :deep(.vlk-legend),
.hkw-layer :deep(.vlk-hint),
.hkw-layer :deep(.vlk-card),
.hkw-layer :deep(.bcw-legend) {
  display: none !important;
}

/* KHÔNG xoay đĩa: đồ hình nhiều CHỮ + badge số ①-⑥ — xoay sẽ làm chữ ngả nghiêng, số nhìn như lệch/dính,
   khác hẳn bản gốc trong app. Giữ ĐỨNG THẲNG như bản gốc; sống động đã có nhờ crossfade + "chạy đèn". */
.hkw-layer :deep(.vlk-svg),
.hkw-layer :deep(.bcw-svg) {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%; /* viewBox vuông → xMidYMid meet phủ khít, đĩa nằm CHÍNH GIỮA hộp */
  filter: none;
}

@media (prefers-reduced-motion: reduce) {
  .hkw-layer {
    transition: none;
  }
}

/* Mobile (≤860px): hero xếp DỌC (đĩa trên · chữ dưới). Thẻ chi tiết nổi absolute
   (top:100%, không chiếm chỗ trong luồng) sẽ ĐÈ lên tiêu đề/CTA hero.
   → Ẩn thẻ trang trí này trên mobile; vòng vẫn crossfade "chạy đèn" bình thường.
   (Vòng xoay TƯƠNG TÁC thật nằm ở section "Biện Chứng" bên dưới, không bị ảnh hưởng.) */
@media (max-width: 860px) {
  .hkw-layer :deep(.bcw-hoverinfo),
  .hkw-layer :deep(.bcw-quainote) {
    display: none !important;
  }
}
</style>
