<script setup lang="ts">
/**
 * BatCuongSummary — Bảng tóm tắt chữ của Bát Cương, đặt cạnh đồ hình (2D hoặc 3D).
 * Đọc nhanh kết luận: ① Âm/Dương · ② Biểu·Lý · ③ Hàn·Nhiệt · ④ Khí·Huyết + chú giải.
 * Bấm hàng Âm/Dương hoặc Khí/Huyết → phát 'toggle' để soi bảng đo (như đồ hình).
 */
interface OrganState {
  name: string
  label: string
  organ: string
  side: string
  depth: 'bieu' | 'ly' | 'mixed'
  temp: 'han' | 'nhiet' | 'mixed'
}

// Các con số trung gian của công thức → để GIẢI THÍCH vì sao ra kết luận (không giấu công thức).
interface Explain {
  amDuong: { avgDam: number; midTuc: number; diff: number }
  khi: { huCount: number; total: number; sum: number; mean: number }
  huyet: { huCount: number; total: number; sum: number; mean: number }
}

const props = defineProps<{
  amDuong: string
  khi: string
  huyet: string
  explain: Explain | null
  organs: OrganState[]
  focus: string | null
}>()

const emit = defineEmits<{ (e: 'toggle', key: string): void }>()

import { computed } from 'vue'

const amLabel = computed(() => props.amDuong?.trim() || 'Chưa rõ')
const amActive = computed(() => props.focus === 'amDuong')

// 'mixed' xuất hiện ở CẢ hai danh sách của cặp (đúng bản chất vừa Hàn vừa Nhiệt / vừa Biểu vừa Lý).
const bieuList = computed(() => props.organs.filter((o) => o.depth === 'bieu' || o.depth === 'mixed'))
const lyList = computed(() => props.organs.filter((o) => o.depth === 'ly' || o.depth === 'mixed'))
const hanList = computed(() => props.organs.filter((o) => o.temp === 'han' || o.temp === 'mixed'))
const nhietList = computed(() => props.organs.filter((o) => o.temp === 'nhiet' || o.temp === 'mixed'))

function tone(v: string): 'hu' | 'thuc' | 'neutral' | 'none' {
  if (!v) return 'none'
  if (v.includes('thịnh') || v.includes('thực')) return 'thuc'
  // "Bình thường" có chứa "hư" (trong "thường") → loại trừ để không nhận nhầm là hư.
  if (v.includes('hư') && !v.includes('thường')) return 'hu'
  return 'neutral'
}
const khiTone = computed(() => tone(props.khi))
const huyetTone = computed(() => tone(props.huyet))
// ④ giờ làm nổi cả NHÓM kinh (Khí = chi trên · Huyết = chi dưới) trên hình + bảng đo.
const khiActive = computed(() => props.focus === 'group:khi')
const huyetActive = computed(() => props.focus === 'group:huyet')

// ── Giải thích VÌ SAO (lộ con số trung gian) ──
const numF = (n: number) => String(n).replace('.', ',')
const signF = (n: number) => (n > 0 ? '+' : '') + numF(n)

const amDuongWhy = computed(() => {
  const e = props.explain?.amDuong
  if (!e) return ''
  const rel =
    e.diff < 0 ? 'thấp hơn → Dương suy' : e.diff > 0 ? 'cao hơn → Âm suy' : 'tương đương → cân bằng'
  return `Đởm ${numF(e.avgDam)} so TB chi dưới ${numF(e.midTuc)} (chênh ${signF(e.diff)}): Đởm ${rel}.`
})
function hutWhy(e: Explain['khi'] | undefined, hu: string, thuc: string): string {
  if (!e) return ''
  const half = e.total / 2
  let reason: string
  if (e.huCount > half) reason = `${e.huCount}/${e.total} kinh dưới mức TB → ${hu}`
  else if (e.huCount < half) reason = `${e.huCount}/${e.total} kinh dưới mức TB → ${thuc}`
  else reason = `${e.huCount}/${e.total} dưới TB, tổng chênh ${signF(e.sum)} → ${e.sum < 0 ? hu : e.sum > 0 ? thuc : 'cân bằng'}`
  return `TB ${numF(e.mean)}; ${reason}.`
}
const khiWhy = computed(() => hutWhy(props.explain?.khi, 'Khí hư', 'Khí thịnh'))
const huyetWhy = computed(() => hutWhy(props.explain?.huyet, 'Huyết hư', 'Huyết thịnh'))
</script>

<template>
  <aside class="bcs">
    <h5 class="sum-title">Tóm tắt Bát Cương</h5>

    <!-- ① Âm — Dương -->
    <div
      class="sum-row sum-row--am sum-row--clickable"
      :class="{ 'is-active': amActive }"
      role="button"
      tabindex="0"
      :aria-pressed="amActive"
      @click="emit('toggle', 'amDuong')"
      @keydown.enter.prevent="emit('toggle', 'amDuong')"
      @keydown.space.prevent="emit('toggle', 'amDuong')"
    >
      <div class="sum-head">
        <span class="sum-pair">① Âm — Dương</span>
        <span class="sum-pill">{{ amLabel }}</span>
      </div>
      <span v-if="amDuongWhy" class="sum-why">{{ amDuongWhy }}</span>
    </div>

    <!-- ② Biểu — Lý -->
    <div class="sum-row sum-row--bl">
      <div class="sum-head"><span class="sum-pair">② Biểu — Lý</span></div>
      <div class="sum-groups">
        <div
          v-for="g in [
            { lb: 'Biểu', key: 'bieu', dot: 'dot--bieu', list: bieuList },
            { lb: 'Lý', key: 'ly', dot: 'dot--ly', list: lyList },
          ]"
          :key="g.key"
          class="sum-grp"
        >
          <button
            type="button"
            class="grp-btn"
            :class="{ 'is-active': focus === 'group:' + g.key }"
            :disabled="!g.list.length"
            :title="'Soi cả nhóm ' + g.lb + ' trên hình + bảng đo'"
            @click="emit('toggle', 'group:' + g.key)"
          ><i class="dot" :class="g.dot" />{{ g.lb }}</button>
          <div class="organ-cloud">
            <button
              v-for="o in g.list"
              :key="g.key + o.name"
              type="button"
              class="organ-pill"
              :class="{ 'is-active': focus === 'organ:' + o.name }"
              :title="'Soi ' + o.organ + ' trên bảng đo'"
              @click="emit('toggle', 'organ:' + o.name)"
            >{{ o.organ }}<small v-if="o.side"> {{ o.side }}</small></button>
            <span v-if="!g.list.length" class="sub-empty">—</span>
          </div>
        </div>
      </div>
      <span class="sum-why">Lệch 1 bên (trái/phải) → Biểu (nông); lệch cả 2 bên so TB → Lý (sâu). Bấm 1 kinh để soi chỉ số ở bảng I.</span>
    </div>

    <!-- ③ Hàn — Nhiệt -->
    <div class="sum-row sum-row--hn">
      <div class="sum-head"><span class="sum-pair">③ Hàn — Nhiệt</span></div>
      <div class="sum-groups">
        <div
          v-for="g in [
            { lb: 'Hàn', key: 'han', dot: 'dot--han', list: hanList },
            { lb: 'Nhiệt', key: 'nhiet', dot: 'dot--nhiet', list: nhietList },
          ]"
          :key="g.key"
          class="sum-grp"
        >
          <button
            type="button"
            class="grp-btn"
            :class="{ 'is-active': focus === 'group:' + g.key }"
            :disabled="!g.list.length"
            :title="'Soi cả nhóm ' + g.lb + ' trên hình + bảng đo'"
            @click="emit('toggle', 'group:' + g.key)"
          ><i class="dot" :class="g.dot" />{{ g.lb }}</button>
          <div class="organ-cloud">
            <button
              v-for="o in g.list"
              :key="g.key + o.name"
              type="button"
              class="organ-pill"
              :class="{ 'is-active': focus === 'organ:' + o.name }"
              :title="'Soi ' + o.organ + ' trên bảng đo'"
              @click="emit('toggle', 'organ:' + o.name)"
            >{{ o.organ }}<small v-if="o.side"> {{ o.side }}</small></button>
            <span v-if="!g.list.length" class="sub-empty">—</span>
          </div>
        </div>
      </div>
      <span class="sum-why">Trị số dưới mức trung bình → Hàn (lạnh); trên trung bình → Nhiệt (nóng). Bấm 1 kinh để soi chỉ số ở bảng I.</span>
    </div>

    <!-- ④ Hư — Thực -->
    <div class="sum-row sum-row--ht">
      <div class="sum-head"><span class="sum-pair">④ Hư — Thực</span></div>
      <div class="sum-groups">
        <div class="sum-grp sum-grp--kh">
          <button
            type="button"
            class="grp-btn"
            :class="{ 'is-active': khiActive }"
            :disabled="khiTone === 'none'"
            title="Soi cả nhóm Khí (6 kinh chi trên) trên hình + bảng đo"
            @click="khiTone !== 'none' && emit('toggle', 'group:khi')"
          >Khí</button>
          <b class="kh-verdict" :class="'tone-' + khiTone">{{ khi || '—' }}</b>
        </div>
        <span v-if="khiWhy" class="sum-why sum-why--sub">{{ khiWhy }}</span>
        <div class="sum-grp sum-grp--kh">
          <button
            type="button"
            class="grp-btn"
            :class="{ 'is-active': huyetActive }"
            :disabled="huyetTone === 'none'"
            title="Soi cả nhóm Huyết (6 kinh chi dưới) trên hình + bảng đo"
            @click="huyetTone !== 'none' && emit('toggle', 'group:huyet')"
          >Huyết</button>
          <b class="kh-verdict" :class="'tone-' + huyetTone">{{ huyet || '—' }}</b>
        </div>
        <span v-if="huyetWhy" class="sum-why sum-why--sub">{{ huyetWhy }}</span>
      </div>
    </div>

    <div class="sum-legend">
      <span><i class="dot dot--han" />Hàn</span>
      <span><i class="dot dot--nhiet" />Nhiệt</span>
      <span><i class="dot dot--mixed" />Hàn+Nhiệt</span>
      <span><i class="lg-halo" />Biểu (nông)</span>
      <span><i class="lg-fill" />Lý (sâu)</span>
    </div>
  </aside>
</template>

<style scoped>
.bcs {
  flex: 1 1 200px;
  min-width: 190px;
  /* CHIA ĐÔI: 4 mục Bát cương xếp 2 cột (①② trên · ③④ dưới) → tóm tắt thấp một nửa */
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2);
  align-content: start;
}
.sum-title,
.sum-legend {
  grid-column: 1 / -1;
}
@media (max-width: 720px) {
  .bcs { grid-template-columns: 1fr; }
}
.sum-title {
  margin: 0 0 var(--space-1);
  font-size: var(--font-size-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--gray-500);
}
.sum-row {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--brown-100);
  border-left: 3px solid var(--brown-300);
  border-radius: var(--radius-md);
  background: var(--surface-2);
}
/* Viền màu theo từng cặp cương cho dễ phân biệt */
.sum-row--am { border-left-color: var(--brown-600); }
.sum-row--bl { border-left-color: #0e7490; }
.sum-row--hn { border-left-color: #b45309; }
.sum-row--ht { border-left-color: #15803d; }
.sum-row--clickable {
  cursor: pointer;
  transition: box-shadow var(--transition-fast), border-color var(--transition-fast);
}
.sum-row--clickable:hover {
  border-color: var(--brown-300);
}
.sum-row.is-active {
  box-shadow: 0 0 0 2px rgba(120, 53, 15, 0.16);
}

.sum-head {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  flex-wrap: wrap;
}
.sum-pair {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--brown-700);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}
.sum-pill {
  background: var(--brown-600);
  color: #fff;
  font-weight: 700;
  font-size: var(--font-size-xs);
  padding: 2px 12px;
  border-radius: 999px;
}

.sum-groups {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.sum-grp {
  display: flex;
  gap: 6px;
  align-items: flex-start;
}
.sum-grp--kh {
  align-items: baseline;
}

/* Nút nhóm (Biểu/Lý/Hàn/Nhiệt/Khí/Huyết) — bề rộng tối thiểu để các cụm chip thẳng hàng */
.grp-btn {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 56px;
  margin-top: 1px;
  padding: 2px 10px;
  border: 1px solid var(--brown-200);
  border-radius: 999px;
  background: var(--white);
  color: var(--brown-700);
  font-size: var(--font-size-xs);
  font-weight: 700;
  cursor: pointer;
  transition: background var(--transition-fast), box-shadow var(--transition-fast), border-color var(--transition-fast);
}
.grp-btn .dot {
  margin-right: 0;
}
.grp-btn:hover:not(:disabled) {
  border-color: var(--brown-400);
}
.grp-btn:disabled {
  cursor: default;
  opacity: 0.5;
}
.grp-btn.is-active {
  background: var(--brown-600);
  color: #fff;
  border-color: var(--brown-600);
  box-shadow: 0 0 0 2px rgba(120, 53, 15, 0.18);
}

/* Cụm chip tạng phủ — tự xuống dòng, căn đều, ngay ngắn */
.organ-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-content: flex-start;
  flex: 1;
  min-width: 0;
  padding-top: 1px;
}
.organ-pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 9px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--brown-800);
  background: var(--white);
  border: 1px solid var(--brown-200);
  border-radius: 999px;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast), background var(--transition-fast);
}
.organ-pill:hover {
  border-color: var(--brown-400);
}
.organ-pill small {
  font-weight: 500;
  opacity: 0.7;
  margin-left: 2px;
}
.organ-pill.is-active {
  border-color: var(--brown-600);
  background: var(--brown-50);
  box-shadow: 0 0 0 2px rgba(120, 53, 15, 0.16);
}
.sub-empty {
  color: var(--gray-400);
  align-self: center;
}
.kh-verdict {
  font-size: var(--font-size-sm);
  font-weight: 700;
}
/* Dòng GIẢI THÍCH công thức — luôn ở DƯỚI cùng mỗi mục; chữ nhỏ, nghiêng, nhạt. */
.sum-why {
  font-size: 11px;
  font-style: italic;
  color: var(--gray-500);
  line-height: 1.45;
}
.sum-why--sub {
  margin-left: 62px;
  margin-top: -3px;
}
.dot {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  margin-right: 4px;
  vertical-align: baseline;
}
.dot--bieu {
  background: #fff;
  border: 1.5px dashed var(--brown-500);
}
.dot--ly {
  background: var(--brown-500);
}
.dot--han {
  background: #2f6690;
}
.dot--nhiet {
  background: #c0452a;
}
.dot--mixed {
  background: linear-gradient(90deg, #2f6690 0 50%, #c0452a 50% 100%);
}
.tone-hu {
  color: #2f6690;
}
.tone-thuc {
  color: #c0452a;
}
.tone-neutral,
.tone-none {
  color: var(--gray-500);
}
.sum-legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-3);
  margin-top: var(--space-1);
  font-size: 11px;
  color: var(--gray-600);
}
.sum-legend span {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.lg-halo {
  display: inline-block;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  border: 1.5px dashed var(--gray-500);
}
.lg-fill {
  display: inline-block;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: rgba(176, 140, 100, 0.5);
}
</style>
