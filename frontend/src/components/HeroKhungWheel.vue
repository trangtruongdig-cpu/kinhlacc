<script setup lang="ts">
/**
 * HeroKhungWheel — "Hình" hero trang chủ: dùng LẠI đúng các bàn xoay THẬT của app (rich, nhiều lớp),
 * VỪA XOAY vừa LUÂN CHUYỂN qua 4 CẢNH theo ĐÚNG thứ tự bóc lớp sách (nông → sâu):
 *   ① Âm Dương 太極  → BienChungWheel lớp 1 (Thái Cực to) — chạy qua 5 biến thể dư/khuyết
 *     (Dương thịnh · Âm thịnh · Âm hư · Dương hư · Âm Dương cân bằng), MỖI biến thể kèm câu
 *     "hội chứng" minh hoạ — TÁI DÙNG computeTongCuong() thật (không bịa số), y hệt cách trang
 *     Kết Quả Đo suy Bát Cương, chỉ khác là 5 tổ hợp mẫu cho ĐỦ các trạng thái, không phải 1 ca.
 *   ② Tạng Phủ 五臟 (Ngũ Hành) → VongNguHanh — hiện CÂN BẰNG (chỉ tương sinh/khắc bình thường)
 *     trước, rồi mới XỘC XỆCH (tương thừa/vũ nổi lên) theo z-score ca mẫu thật — một lượt "trước/sau"
 *     mỗi khi quay lại cảnh này.
 *   ③ Lục Khí 六氣  → VongLucKhi (Khí → Kinh bản khí → Tạng/Phủ)
 *   ④ Lục Kinh 六經  → VongLucKinh (Khung: Lục Kinh · Tạng Phủ · Lục Khí + truyền biến ①→⑥) — ĐỨNG CUỐI
 *     (tầng SÂU nhất, kết luận sau cùng).
 *
 * NHỊP PHIM: mỗi CẢNH (mode) dài đúng SCENE_MS như nhau (không cảnh nào bị rớt/kéo dài bất thường —
 * "lệch mắt" trước đây là do 1 con trỏ "step" DÙNG CHUNG cho 3 danh sách độ dài khác nhau, cộng với
 * mỗi cảnh dài cố định 9,5s bất kể có bao nhiêu mục cần chiếu). Nay mỗi cảnh tự chia đều SCENE_MS
 * cho ĐÚNG số mục của nó (5 biến thể Âm Dương / 2 pha Ngũ Hành / 6 khí / 6 kinh), tính bằng ĐỒNG HỒ
 * thời gian-trong-cảnh (elapsedInMode) thay vì đếm nhịp rời rạc — mượt, không cộng dồn sai số.
 *
 * Ở hero chỉ là TRANG TRÍ: khoá tương tác (pointer-events:none), ẩn nút/chú thích/thẻ của component,
 * và cho cả đĩa XOAY chậm (CSS). Tôn trọng prefers-reduced-motion: đứng yên ở lớp Âm Dương.
 */
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import VongLucKinh from '@/components/VongLucKinh.vue'
import VongLucKhi from '@/components/VongLucKhi.vue'
import VongNguHanh from '@/components/VongNguHanh.vue'
import BienChungWheel from '@/components/BienChungWheel.vue'
import { computeTongCuong, type NguHanhZ, type TongCuong } from '@/lib/meridianAnalysis'

const props = defineProps<{
  // Ca mẫu THẬT (tính lại từ số thô, xem LandingView) — để lớp ② vẽ ngũ giác méo đúng, không bịa số.
  nguHanhZ?: NguHanhZ | null
  tongCuong?: TongCuong | null
}>()

const KINH: { slug: string; ten: string }[] = [
  { slug: 'thai-duong', ten: 'Thái Dương' },
  { slug: 'duong-minh', ten: 'Dương Minh' },
  { slug: 'thieu-duong', ten: 'Thiếu Dương' },
  { slug: 'thai-am', ten: 'Thái Âm' },
  { slug: 'thieu-am', ten: 'Thiếu Âm' },
  { slug: 'quyet-am', ten: 'Quyết Âm' },
]
const KHI_KEYS = ['Hàn', 'Táo', 'Thử', 'Thấp', 'Nhiệt', 'Phong'] // key Lục Khí (constants/lucKhi.ts)

// 5 biến thể Âm Dương MINH HOẠ — TÁI DÙNG đúng computeTongCuong(nhiệt, hàn, biểu, lý, hưThực), y hệt
// ma trận trong meridianAnalysis.ts (không viết lại luật ở đây). Không gắn ca mẫu thật (chỉ khối
// Tab ③ ở LandingView mới dùng ca thật) — đây là 5 tổ hợp SÁCH cho đủ trạng thái để dạy khái niệm.
const AM_DUONG_DEMO: TongCuong[] = [
  computeTongCuong(4, 0, 4, 0, 'Thực'), // Dương thịnh — Biểu Thực Nhiệt
  computeTongCuong(0, 4, 4, 0, 'Thực'), // Âm thịnh — Biểu Thực Hàn
  computeTongCuong(4, 0, 0, 4, 'Hư'), // Âm hư — Lý Hư Nhiệt
  computeTongCuong(0, 4, 0, 4, 'Hư'), // Dương hư — Lý Hư Hàn
  computeTongCuong(0, 0, 0, 0, 'Bình thường'), // Âm Dương cân bằng
]

const reduce =
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
const motion = ref(!reduce)

const mode = ref(0) // 0 Âm Dương · 1 Tạng Phủ/Ngũ Hành · 2 Lục Khí · 3 Lục Kinh — ĐÚNG thứ tự bóc lớp
const SCENE_MS = 9000 // MỌI cảnh dài bằng nhau — nhịp phim đều, không cảnh nào cảm giác vội/lê thê

// Đồng hồ thời gian-trong-cảnh: nowMs tick 100ms, modeStartAt mốc lúc vào cảnh hiện tại.
const nowMs = ref(Date.now())
const modeStartAt = ref(Date.now())
watch(mode, () => { modeStartAt.value = Date.now() })
const elapsedInMode = computed(() => Math.max(0, nowMs.value - modeStartAt.value))

// ① Âm Dương — chia đều SCENE_MS cho 5 biến thể.
const AM_STEP_MS = SCENE_MS / AM_DUONG_DEMO.length
const amIndex = computed(() => Math.min(AM_DUONG_DEMO.length - 1, Math.floor(elapsedInMode.value / AM_STEP_MS)))
const activeAmDemo = computed(() => (mode.value === 0 ? AM_DUONG_DEMO[amIndex.value]! : null))
const dinhViAmDuong = computed(() => {
  const d = activeAmDemo.value
  if (!d || !d.loai || d.loai === 'unknown') return null
  const cuc = d.loai.startsWith('duong') ? 'duong' : d.loai.startsWith('am') ? 'am' : null
  return { kinh: [] as string[], khi: [] as string[], tang: [] as string[], amDuong: cuc as 'duong' | 'am' | null, amLoai: d.loai }
})

// ② Tạng Phủ/Ngũ Hành — pha CÂN BẰNG chiếm ~32% cảnh (đủ đọc rồi chuyển), còn lại XỘC XỆCH (nhiều
// chi tiết hơn: dư/khuyết + tương thừa/vũ + gợi ý hướng cân bằng nên cần thời gian đọc nhiều hơn).
const NGUHANH_CANBANG_MS = Math.round(SCENE_MS * 0.32)
const nguHanhSkewed = computed(() => mode.value === 1 && elapsedInMode.value >= NGUHANH_CANBANG_MS)
// z=0 (ĐÃ ĐO, đúng mốc) chứ không phải null (THIẾU ĐO) — null làm VongNguHanh vẽ dấu "?" ở mỗi nút,
// trông như lỗi/thiếu dữ liệu chứ không phải "cân bằng". z=0 cho nút đặc, ngũ giác đều, không quầng.
const NGU_HANH_Z_CANBANG: NguHanhZ = { hoa: 0, tho: 0, kim: 0, thuy: 0, moc: 0 }
const nguHanhZActive = computed(() => (nguHanhSkewed.value ? (props.nguHanhZ ?? NGU_HANH_Z_CANBANG) : NGU_HANH_Z_CANBANG))
const tongCuongActive = computed(() => (nguHanhSkewed.value ? (props.tongCuong ?? null) : null))

// ③ Lục Khí — chia đều SCENE_MS cho 6 khí.
const KHI_STEP_MS = SCENE_MS / KHI_KEYS.length
const khiIndex = computed(() => Math.min(KHI_KEYS.length - 1, Math.floor(elapsedInMode.value / KHI_STEP_MS)))
const activeKhi = computed(() => (mode.value === 2 ? KHI_KEYS[khiIndex.value]! : null))

// ④ Lục Kinh — chia đều SCENE_MS cho 6 kinh.
const KINH_STEP_MS = SCENE_MS / KINH.length
const kinhIndex = computed(() => Math.min(KINH.length - 1, Math.floor(elapsedInMode.value / KINH_STEP_MS)))
const activeKinh = computed(() => (mode.value === 3 ? KINH[kinhIndex.value]!.slug : null))

// Câu "thuyết minh" dưới đĩa — mỗi cảnh nói rõ đang xem trạng thái nào, để người xem KHÔNG lạc vào
// hình mà quên nghĩa (giống banner "Định vị" ở khối Tab ③ Biện Chứng · Pháp Trị bên dưới).
const caption = computed(() => {
  if (mode.value === 0) {
    const d = activeAmDemo.value
    if (!d) return ''
    return d.hoiChung ? `${d.amDuong} · Hội chứng: ${d.hoiChung}` : d.amDuong
  }
  if (mode.value === 1) {
    return nguHanhSkewed.value
      ? 'Tạng Phủ mất cân bằng · tương thừa – tương vũ nổi lên'
      : 'Tạng Phủ cân bằng · tương sinh – tương khắc đều'
  }
  if (mode.value === 2) {
    return activeKhi.value ? `Lục Khí · ${activeKhi.value} tác động tạng phủ` : ''
  }
  if (mode.value === 3) {
    const k = KINH[kinhIndex.value]
    return k ? `Lục Kinh · kinh ${k.ten}` : ''
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
      <!-- ① Âm Dương — Thái Cực to, chạy qua 5 biến thể dư/khuyết + cân bằng -->
      <div class="hkw-layer hkw-l-amduong" :class="{ on: mode === 0 }" aria-hidden="true">
        <BienChungWheel :lop="1" :dinhvi="dinhViAmDuong" />
      </div>
      <!-- ② Tạng Phủ/Ngũ Hành — VongNguHanh: cân bằng trước, xộc xệch (méo THẬT theo z-score ca mẫu) sau -->
      <div class="hkw-layer hkw-l-nguhanh" :class="{ on: mode === 1 }" aria-hidden="true">
        <VongNguHanh :z="nguHanhZActive" :tong-cuong="tongCuongActive" />
      </div>
      <!-- ③ Lục Khí — Khí → Kinh (bản khí) → Tạng; chạy đèn từng khí để tâm Ngũ Hành sáng (khí tác động tạng phủ) -->
      <div class="hkw-layer hkw-l-khi" :class="{ on: mode === 2 }" aria-hidden="true">
        <VongLucKhi :show-card="false" :active-khi="activeKhi" />
      </div>
      <!-- ④ Lục Kinh — Khung đầy đủ, chạy đèn lần lượt từng kinh + cặp biểu-lý (đứng CUỐI — tầng sâu nhất) -->
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
/* Câu thuyết minh dưới đĩa — đổi theo cảnh, fade nhẹ mỗi lần đổi chữ (key đổi → remount → transition). */
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
/* SỬA LẦN 2 — chẩn đoán lần đầu SAI GỐC: BienChungWheel có "vành ngoài CỐ ĐỊNH" (circle :r="DISC-1",
   DISC=200, comment gốc trong code "vành ngoài CỐ ĐỊNH") nằm NGOÀI nhóm .taiji, dùng làm khung tham
   chiếu không đổi cho mọi lớp — Thái Cực ở lớp 1 vốn NHỎ HƠN vành này (còn nhiều lớp chưa "nở" ra).
   Lần sửa trước tôi phóng RIÊNG .taiji lên 1.3× mà quên vành ngoài này → Thái Cực vượt khỏi vành cố
   định, vành cố định (không được phóng theo) tụt lại thành MỘT VÒNG NHỎ LỌT THỎM BÊN TRONG — đúng
   thứ bị phàn nàn. Sửa đúng gốc: bỏ hẳn scale riêng cho .taiji, tính lại scale NGOÀI (áp cho toàn bộ
   .hkw-l-amduong, tức áp đều lên CẢ Thái Cực lẫn vành ngoài) sao cho VÀNH NGOÀI (chứ không phải Thái
   Cực) đạt tỉ lệ ~0,94 khớp 3 lớp kia — Thái Cực khi đó tự nhiên nhỏ hơn vành một chút, ĐÚNG quan hệ
   gốc của component (nông ở lớp 1, "nở" dần khi bóc thêm lớp), không còn lệch. */
.hkw-l-amduong { transform: scale(1.18); }
/* VongLucKhi có Thái Cực TÂM riêng (class "core", TR=13 đơn vị svg — cố tình rất nhỏ, chỉ là điểm
   nhấn phụ giữa vòng Khí/Kinh/Tạng ở NGỮ CẢNH GỐC của nó). Đặt cạnh Thái Cực TO ở lớp Âm Dương thì
   2 chấm âm-dương bên trong (dotR=TR/5≈2,6 đơn vị) gần như biến mất — phóng riêng cho cân xứng,
   KHÔNG sửa VongLucKhi.vue (component dùng chung nhiều nơi khác, TR=13 vẫn đúng ở đó).
   `transform-origin: center` KHÔNG neo theo khối hình trên SVG (mặc định neo theo cả khung nhìn,
   transform-box: view-box) — làm Thái Cực bị PHÓNG LỆCH ra khỏi tâm thật (200,200), trông chông
   chênh và crossfade giữa các cảnh bị giật. Phải khai `transform-box: fill-box` để "center" lấy
   đúng tâm khối `.core` (đối xứng quanh CX=CY=200 nên fill-box trùng tâm thật). */
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
