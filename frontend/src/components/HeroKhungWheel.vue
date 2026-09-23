<script setup lang="ts">
/**
 * HeroKhungWheel — "Hình" hero trang chủ: KỂ MỘT CÂU CHUYỆN xuyên suốt (không phải 4 cảnh rời rạc),
 * lấy THÁI CỰC làm trục xuyên suốt, thu nhỏ dần khi chuyện đi sâu hơn — do lương y yêu cầu (đối thoại
 * "cần hiệu ứng chuyển cảnh... lấy trung tâm là đồ hình thái cực"):
 *
 *   HỒI 1 — Âm Dương 太極 (BienChungWheel lớp 1, Thái Cực TO, làm tiêu điểm):
 *     Cân bằng → Âm thịnh → Dương thịnh → Âm hư → Dương hư. "Vạn vật từ 2 khí Âm Dương, vốn có xu
 *     hướng cân bằng — nhưng thực tế Âm thường bất túc, Dương thường hữu dư."
 *   HỒI 2 — Tạng Phủ 五臟 (VongNguHanh): Thái Cực LÙI làm nền mờ phía sau, Ngũ Hành lên tiêu điểm.
 *     Pha A "cân bằng" (chỉ tương sinh/khắc, nền Thái Cực CŨNG cân bằng — "Ngũ Hành cân bằng nhờ
 *     tương sinh/khắc thì Âm Dương cũng cân bằng"). Pha B "mất cân bằng" (tương thừa/vũ nổi lên —
 *     4 CẶP riêng biệt, mỗi biến thể Âm Dương lệch (nền) đi kèm MỘT kiểu Tạng Phủ sộc sệch RIÊNG
 *     (Thủy thừa Hỏa · Hỏa thừa Kim · Mộc vũ Kim · Thổ sinh Kim bất cập) đổi CÙNG LÚC, không phải 1
 *     ví dụ cố định — "Âm Dương lệch kiểu nào, Tạng Phủ cũng sộc sệch kiểu đó".
 *   HỒI 3 — Lục Khí 六氣 (VongLucKhi) · HỒI 4 — Lục Kinh 六經 (VongLucKinh): Thái Cực THU NHỎ hẳn về
 *     tâm (2 đồ hình này vốn đã có Thái Cực nhỏ ở tâm) — không còn là tiêu điểm mà là điểm tựa cho
 *     mối quan hệ Lục Khí/Tam Âm Tam Dương với Tạng Phủ xoay quanh.
 *
 * TOÀN BỘ dữ liệu là MINH HOẠ SÁCH (TÁI DÙNG computeTongCuong() thật, không viết lại luật), KHÔNG gắn
 * ca mẫu thật — Hero kể khái niệm chung, khối Tab ③ Biện Chứng·Pháp Trị ở LandingView mới dùng ca thật.
 *
 * NHỊP PHIM: mỗi HỒI dài đúng SCENE_MS như nhau, mỗi hồi tự chia đều SCENE_MS cho ĐÚNG số nhịp của nó
 * (5 biến thể Âm Dương / cân bằng·mất cân bằng-với-4-biến-thể-nền của Ngũ Hành / 6 khí / 6 kinh), tính
 * bằng ĐỒNG HỒ thời gian-trong-hồi (elapsedInMode) — không dùng 1 con trỏ "step" chung cho nhiều danh
 * sách khác độ dài (từng gây "lệch mắt").
 *
 * Ở hero chỉ là TRANG TRÍ: khoá tương tác (pointer-events:none), ẩn nút/chú thích/thẻ của component,
 * và cho cả đĩa XOAY chậm (CSS). Tôn trọng prefers-reduced-motion: đứng yên ở hồi Âm Dương.
 */
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import VongLucKinh from '@/components/VongLucKinh.vue'
import VongLucKhi from '@/components/VongLucKhi.vue'
import VongNguHanh from '@/components/VongNguHanh.vue'
import BienChungWheel from '@/components/BienChungWheel.vue'
import { computeTongCuong, type NguHanhZ, type TongCuong } from '@/lib/meridianAnalysis'

const KINH: { slug: string; ten: string }[] = [
  { slug: 'thai-duong', ten: 'Thái Dương' },
  { slug: 'duong-minh', ten: 'Dương Minh' },
  { slug: 'thieu-duong', ten: 'Thiếu Dương' },
  { slug: 'thai-am', ten: 'Thái Âm' },
  { slug: 'thieu-am', ten: 'Thiếu Âm' },
  { slug: 'quyet-am', ten: 'Quyết Âm' },
]
const KHI_KEYS = ['Hàn', 'Táo', 'Thử', 'Thấp', 'Nhiệt', 'Phong'] // key Lục Khí (constants/lucKhi.ts)

// HỒI 1 — 5 biến thể Âm Dương, CÂN BẰNG đứng đầu (mở chuyện: vạn vật vốn cân bằng), rồi mới tới 4
// biến thể lệch. TÁI DÙNG đúng computeTongCuong(nhiệt, hàn, biểu, lý, hưThực) — không viết lại luật.
const AM_CANBANG = computeTongCuong(0, 0, 0, 0, 'Bình thường') // Âm Dương cân bằng
const AM_DUONG_DEMO: TongCuong[] = [
  AM_CANBANG,
  computeTongCuong(0, 4, 4, 0, 'Thực'), // Âm thịnh — Biểu Thực Hàn
  computeTongCuong(4, 0, 4, 0, 'Thực'), // Dương thịnh — Biểu Thực Nhiệt
  computeTongCuong(4, 0, 0, 4, 'Hư'), // Âm hư — Lý Hư Nhiệt
  computeTongCuong(0, 4, 0, 4, 'Hư'), // Dương hư — Lý Hư Hàn
]
// z=0 (ĐÃ ĐO, đúng mốc) chứ không phải null (THIẾU ĐO) — null làm VongNguHanh vẽ dấu "?" ở mỗi nút,
// trông như lỗi/thiếu dữ liệu chứ không phải "cân bằng". z=0 cho nút đặc, ngũ giác đều, không quầng.
const NGU_HANH_Z_CANBANG: NguHanhZ = { hoa: 0, tho: 0, kim: 0, thuy: 0, moc: 0 }

// HỒI 2 pha B — MỖI biến thể Âm Dương lệch (bỏ cân bằng, đã dùng ở pha A) đi kèm MỘT kiểu Tạng Phủ
// sộc sệch RIÊNG (4 cặp, không dùng chung 1 ví dụ) — nối đúng ý "Âm Dương lệch kiểu nào, Tạng Phủ
// sộc sệch kiểu đó", đủ cả 3 dạng sách dạy (tương thừa · tương vũ · sinh bất cập) cho phong phú.
// Đã dò tay từng cặp qua đúng công thức thừa/vũ/bất-cập trong VongNguHanh.vue (T_THUC=1, GRAD=1.2,
// ngưỡng vũ=0.8, ngưỡng bất cập zm<=-1) để CHỈ nổi đúng 1 quan hệ dự định, không lẫn quan hệ khác.
interface NguHanhCase { z: NguHanhZ; nhan: string }
const NGUHANH_LECH_DEMO: NguHanhCase[] = [
  // Âm thịnh (Hàn thực) — Thủy thịnh dập Hỏa: "Thủy thừa Hỏa" (hàn thịnh, dương khí bị át).
  { z: { hoa: -1.3, tho: 0.2, kim: 0.1, thuy: 1.6, moc: 0 }, nhan: 'Thủy thừa Hỏa' },
  // Dương thịnh (Nhiệt thực) — Hỏa viêm thịnh hun Phế: "Hỏa thừa Kim" (hoả hình kim).
  { z: { hoa: 1.6, tho: 0.1, kim: -1.3, thuy: 0, moc: 0.2 }, nhan: 'Hỏa thừa Kim' },
  // Âm hư (Nhiệt hư) — Phế Kim âm hư, Can Mộc vượng phản khắc: "Mộc vũ Kim" (mộc hoả hình kim).
  { z: { hoa: 0, tho: 0, kim: -1.1, thuy: -0.3, moc: 0.9 }, nhan: 'Mộc vũ Kim' },
  // Dương hư (Hàn hư) — Tỳ Thận dương hư, mẹ Thổ hư không nuôi đủ con Kim: "Thổ sinh Kim bất cập".
  { z: { hoa: 0, tho: -1.1, kim: -0.3, thuy: -0.9, moc: 0 }, nhan: 'Thổ sinh Kim bất cập' },
]

const reduce =
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
const motion = ref(!reduce)

const mode = ref(0) // 0 Âm Dương · 1 Tạng Phủ/Ngũ Hành · 2 Lục Khí · 3 Lục Kinh
const SCENE_MS = 9000 // MỌI hồi dài bằng nhau — nhịp phim đều, không hồi nào cảm giác vội/lê thê

// Đồng hồ thời gian-trong-hồi: nowMs tick 100ms, modeStartAt mốc lúc vào hồi hiện tại.
const nowMs = ref(Date.now())
const modeStartAt = ref(Date.now())
watch(mode, () => { modeStartAt.value = Date.now() })
const elapsedInMode = computed(() => Math.max(0, nowMs.value - modeStartAt.value))

// HỒI 1 — Âm Dương: chia đều SCENE_MS cho 5 biến thể.
const AM_STEP_MS = SCENE_MS / AM_DUONG_DEMO.length
const amIndex = computed(() => Math.min(AM_DUONG_DEMO.length - 1, Math.floor(elapsedInMode.value / AM_STEP_MS)))
const activeAmDemo = computed(() => (mode.value === 0 ? AM_DUONG_DEMO[amIndex.value]! : null))
const dinhViAmDuong = computed(() => {
  const d = activeAmDemo.value
  if (!d || !d.loai || d.loai === 'unknown') return null
  const cuc = d.loai.startsWith('duong') ? 'duong' : d.loai.startsWith('am') ? 'am' : null
  return { kinh: [] as string[], khi: [] as string[], tang: [] as string[], amDuong: cuc as 'duong' | 'am' | null, amLoai: d.loai }
})

// HỒI 2 — Tạng Phủ/Ngũ Hành: pha A "cân bằng" chiếm ~28% hồi (đủ đọc rồi chuyển — mở đầu đơn giản),
// pha B "mất cân bằng" chiếm phần còn lại, TỰ chia đều cho 4 CẶP (Âm Dương lệch, Tạng Phủ sộc sệch
// tương ứng) — đổi CÙNG LÚC cả 2 lớp, đúng ý "Âm Dương lệch kiểu nào, Tạng Phủ sộc sệch kiểu đó".
const NGUHANH_CANBANG_MS = Math.round(SCENE_MS * 0.28)
const nguHanhSkewed = computed(() => mode.value === 1 && elapsedInMode.value >= NGUHANH_CANBANG_MS)
const NGUHANH_BG_STEP_MS = (SCENE_MS - NGUHANH_CANBANG_MS) / NGUHANH_LECH_DEMO.length
const nguHanhBgIndex = computed(() =>
  Math.min(NGUHANH_LECH_DEMO.length - 1, Math.floor((elapsedInMode.value - NGUHANH_CANBANG_MS) / NGUHANH_BG_STEP_MS)),
)
// index+1 vì AM_DUONG_DEMO[0] = cân bằng (đã dùng riêng ở pha A) — 4 mục lệch bắt đầu từ [1].
const nguHanhBgAmDuong = computed(() => (nguHanhSkewed.value ? AM_DUONG_DEMO[nguHanhBgIndex.value + 1]! : null))
const nguHanhLechCase = computed(() => (nguHanhSkewed.value ? NGUHANH_LECH_DEMO[nguHanhBgIndex.value]! : null))
const nguHanhZActive = computed(() => nguHanhLechCase.value?.z ?? NGU_HANH_Z_CANBANG)
const tongCuongActive = computed(() => nguHanhBgAmDuong.value)

// HỒI 3 — Lục Khí: chia đều SCENE_MS cho 6 khí.
const KHI_STEP_MS = SCENE_MS / KHI_KEYS.length
const khiIndex = computed(() => Math.min(KHI_KEYS.length - 1, Math.floor(elapsedInMode.value / KHI_STEP_MS)))
const activeKhi = computed(() => (mode.value === 2 ? KHI_KEYS[khiIndex.value]! : null))

// HỒI 4 — Lục Kinh: chia đều SCENE_MS cho 6 kinh.
const KINH_STEP_MS = SCENE_MS / KINH.length
const kinhIndex = computed(() => Math.min(KINH.length - 1, Math.floor(elapsedInMode.value / KINH_STEP_MS)))
const activeKinh = computed(() => (mode.value === 3 ? KINH[kinhIndex.value]!.slug : null))

// Câu "thuyết minh" dưới đĩa — mỗi hồi nói rõ đang xem trạng thái nào VÀ vì sao (nối ý giữa các hồi),
// để người xem không lạc vào hình mà quên nghĩa (giống banner "Định vị" ở khối Tab ③ bên dưới).
const caption = computed(() => {
  if (mode.value === 0) {
    const d = activeAmDemo.value
    if (!d) return ''
    return d.hoiChung ? `${d.amDuong} · Hội chứng: ${d.hoiChung}` : `${d.amDuong} · gốc của vạn vật`
  }
  if (mode.value === 1) {
    if (!nguHanhSkewed.value) return 'Tạng Phủ cân bằng · tương sinh–khắc đều → Âm Dương cũng cân bằng'
    const bg = nguHanhBgAmDuong.value
    const lech = nguHanhLechCase.value
    return `${bg ? bg.amDuong : ''} · Tạng Phủ sộc sệch: ${lech ? lech.nhan : ''}`
  }
  if (mode.value === 2) {
    return activeKhi.value ? `Lục Khí · ${activeKhi.value} tác động tạng phủ` : ''
  }
  if (mode.value === 3) {
    const k = KINH[kinhIndex.value]
    return k ? `Lục Kinh · Tam Âm Tam Dương · kinh ${k.ten}` : ''
  }
  return ''
})

let tickTimer: ReturnType<typeof setInterval> | null = null
let modeTimer: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  if (!motion.value) return
  tickTimer = setInterval(() => { nowMs.value = Date.now() }, 100)
  modeTimer = setInterval(() => {
    mode.value = (mode.value + 1) % 4
  }, SCENE_MS)
})
onBeforeUnmount(() => {
  if (tickTimer) clearInterval(tickTimer)
  if (modeTimer) clearInterval(modeTimer)
})
</script>

<template>
  <div class="hkw">
    <div class="hkw-stage" :class="{ motion }">
      <!-- HỒI 1 — Âm Dương: Thái Cực to, TIÊU ĐIỂM, chạy qua cân bằng + 4 biến thể lệch -->
      <div class="hkw-layer hkw-l-amduong" :class="{ on: mode === 0 }" aria-hidden="true">
        <BienChungWheel :lop="1" :dinhvi="dinhViAmDuong" />
      </div>
      <!-- HỒI 2 — Tạng Phủ: Thái Cực LÙI làm nền (qua tong-cuong), Ngũ Hành lên tiêu điểm -->
      <div class="hkw-layer hkw-l-nguhanh" :class="{ on: mode === 1 }" aria-hidden="true">
        <VongNguHanh :z="nguHanhZActive" :tong-cuong="tongCuongActive" />
      </div>
      <!-- HỒI 3 — Lục Khí: Thái Cực đã thu nhỏ về tâm (vốn có sẵn trong đồ hình này) -->
      <div class="hkw-layer hkw-l-khi" :class="{ on: mode === 2 }" aria-hidden="true">
        <VongLucKhi :show-card="false" :active-khi="activeKhi" />
      </div>
      <!-- HỒI 4 — Lục Kinh: Thái Cực nhỏ ở tâm, Tam Âm Tam Dương xoay quanh -->
      <div class="hkw-layer hkw-l-kinh" :class="{ on: mode === 3 }" aria-hidden="true">
        <VongLucKinh :active-kinh="activeKinh" />
      </div>
    </div>
    <p class="hkw-cap" :key="caption">{{ caption }}</p>
  </div>
</template>

<style scoped>
.hkw {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.hkw-stage {
  position: relative;
  width: 100%;
  aspect-ratio: 1; /* giữ chỗ vuông để các lớp xếp chồng không nhảy */
}
.hkw-layer {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 1.1s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none; /* hero = trang trí, khoá mọi tương tác/hover */
}
.hkw-layer.on {
  opacity: 1;
}
/* Câu thuyết minh dưới đĩa — đổi theo hồi, fade nhẹ mỗi lần đổi chữ (key đổi → remount → transition). */
.hkw-cap {
  margin: 0;
  min-height: 1.4em;
  font-size: 13px;
  font-weight: 700;
  color: var(--brown-100, #f2e6cc);
  text-align: center;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.55);
  animation: hkw-cap-in 0.5s ease;
}
@keyframes hkw-cap-in {
  from { opacity: 0; transform: translateY(3px); }
  to { opacity: 1; transform: translateY(0); }
}
/* Chuẩn cỡ ĐĨA giữa 4 vòng — ĐO BẰNG getBoundingClientRect() thật (script Playwright), không suy
   viewBox bằng tay. Tỉ lệ "vành ngoài / khung" nhắm tới ~0,94 cho cả 4 lớp — xem ghi chú riêng cho
   Âm Dương (dưới, chỗ khai báo scale 1.18: vành ngoài CỐ ĐỊNH của BienChungWheel, không phải Thái
   Cực, mới là mốc phải khớp) và cho Lục Khí (chú thích tại rule `.hkw-l-khi :deep(.core)`: viewBox
   thật của VongLucKhi.vue là "-16.5 -16.5 433 433", không phải 400×400 như comment đầu file đó).
   transform-origin mặc định = tâm layer; layer đã phủ khít hộp vuông (dưới) nên scale KHÔNG dời tâm. */
.hkw-l-nguhanh { transform: scale(1.033); }
.hkw-l-khi { transform: scale(1.033); }
.hkw-l-kinh { transform: scale(1.033); }

/* KHOÁ VỊ TRÍ: ép cả 4 vòng vào CÙNG một hộp vuông TUYỆT ĐỐI (bỏ max-width theo vh + flex-column
   của component) → viewBox vuong map khít hộp vuông, tâm đĩa TRÙNG KHÍT giữa các lớp, không lệch khi crossfade. */
.hkw-layer :deep(.vlk),
.hkw-layer :deep(.vnh),
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
/* VongNguHanh tự bọc SVG trong .vnh-stage (không phải root) — cũng phải khoá tuyệt đối, nếu không
   SVG (bị ép absolute bên dưới) rớt khỏi luồng và .vnh-stage sụp về cao 0. */
.hkw-layer :deep(.vnh-stage) {
  position: absolute;
  inset: 0;
}
/* "Vành ngoài CỐ ĐỊNH" (circle :r="DISC-1", DISC=200, comment gốc trong BienChungWheel.vue) nằm
   NGOÀI nhóm .taiji, dùng làm khung tham chiếu không đổi cho mọi lớp — Thái Cực lớp 1 vốn NHỎ HƠN
   vành này. Scale NGOÀI .hkw-l-amduong phải nhắm vào ĐÚNG vành này (không phải riêng .taiji) để
   Thái Cực + vành cùng lớn theo tỉ lệ gốc, không lệch tâm/lọt thỏm. Đo pixel thật: vành đạt ~0,94,
   Thái Cực ~0,93 (nhỏ hơn vành một chút — ĐÚNG quan hệ gốc: nông ở lớp 1, "nở" dần khi bóc thêm lớp). */
.hkw-l-amduong { transform: scale(1.18); }
/* VongLucKhi có Thái Cực TÂM riêng (class "core", TR=13 đơn vị svg — cố tình rất nhỏ, chỉ là điểm
   nhấn phụ giữa vòng Khí/Kinh/Tạng ở NGỮ CẢNH GỐC của nó). Đặt cạnh Thái Cực TO ở HỒI 1 thì 2 chấm
   âm-dương bên trong (dotR=TR/5≈2,6 đơn vị) gần như biến mất — phóng riêng cho cân xứng, KHÔNG sửa
   kích thước gốc trong VongLucKhi.vue (dùng chung nhiều nơi khác, TR=13 vẫn đúng ở đó).
   `transform-origin: center` KHÔNG neo theo khối hình trên SVG (mặc định neo theo cả khung nhìn,
   transform-box: view-box) — làm Thái Cực bị PHÓNG LỆCH ra khỏi tâm thật (200,200). Phải khai
   `transform-box: fill-box` để "center" lấy đúng tâm khối `.core` (đối xứng quanh CX=CY=200 nên
   fill-box trùng tâm thật). */
.hkw-l-khi :deep(.core) {
  transform-box: fill-box;
  transform-origin: center;
  transform: scale(2.8);
}

/* Ẩn phần điều khiển/chú thích/thẻ của bản app (chỉ chừa lại ĐĨA) */
.hkw-layer :deep(.vlk-halfbtns),
.hkw-layer :deep(.vlk-legend),
.hkw-layer :deep(.vlk-hint),
.hkw-layer :deep(.vlk-card),
.hkw-layer :deep(.vnh-ctrls),
.hkw-layer :deep(.vnh-legend),
.hkw-layer :deep(.vnh-phaptri),
.hkw-layer :deep(.bcw-hoverinfo),
.hkw-layer :deep(.bcw-quainote),
.hkw-layer :deep(.bcw-legend) {
  display: none !important;
}

/* KHÔNG xoay đĩa: đồ hình nhiều CHỮ + badge số ①-⑥ — xoay sẽ làm chữ ngả nghiêng, số nhìn như lệch/dính,
   khác hẳn bản gốc trong app. Giữ ĐỨNG THẲNG như bản gốc; sống động đã có nhờ crossfade + "chạy đèn". */
.hkw-layer :deep(.vlk-svg),
.hkw-layer :deep(.vnh-svg),
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
  .hkw-cap {
    animation: none;
  }
}
</style>
