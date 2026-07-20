<script setup lang="ts">
/**
 * BatCuongSummary — Bảng tóm tắt chữ của Bát Cương, đặt cạnh đồ hình (2D hoặc 3D).
 * Đọc nhanh kết luận: ① Âm/Dương (tổng cương) · ② Biểu·Lý · ③ Hư·Thực · ④ Thể Chất (Khí·Huyết).
 * Bấm hàng Âm/Dương, Hư-Thực hoặc Khí/Huyết → phát 'toggle' để soi bảng đo (như đồ hình).
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
  khi: { huCount: number; total: number; sum: number; mean: number }
  huyet: { huCount: number; total: number; sum: number; mean: number }
  huThuc: { lechCount: number; tongDo: number; totalLech: number; nguong: number }
}

import type { TongCuong } from '@/lib/meridianAnalysis'
import AmDuongTaiji from './AmDuongTaiji.vue'

const props = defineProps<{
  /** Tổng cương (Âm-Dương) — suy từ ma trận Hàn·Nhiệt × Hư·Thực. */
  tongCuong: TongCuong
  khi: string
  huyet: string
  huThuc: string
  /** Kinh "lệch" (bằng chứng Hư-Thực) kèm hướng biên độ: 'high' vượt ngưỡng / 'low' dưới ngưỡng. */
  huThucOrgans?: { name: string; organ: string; side: string; tone: 'high' | 'low' }[]
  explain: Explain | null
  organs: OrganState[]
  focus: string | null
}>()

const emit = defineEmits<{ (e: 'toggle', key: string): void; (e: 'detail', name: string): void }>()

import { computed } from 'vue'

// 'mixed' xuất hiện ở CẢ hai danh sách của cặp (đúng bản chất vừa Hàn vừa Nhiệt / vừa Biểu vừa Lý).
const bieuList = computed(() => props.organs.filter((o) => o.depth === 'bieu' || o.depth === 'mixed'))
const lyList = computed(() => props.organs.filter((o) => o.depth === 'ly' || o.depth === 'mixed'))

function tone(v: string): 'hu' | 'thuc' | 'neutral' | 'none' {
  if (!v) return 'none'
  // toLowerCase(): "Hư"/"Thực" đứng đầu câu viết hoa (khác "Khí hư"/"Khí thịnh" viết thường giữa câu).
  const s = v.toLowerCase()
  if (s.includes('thịnh') || s.includes('thực')) return 'thuc'
  // "Bình thường" có chứa "hư" (trong "thường") → loại trừ để không nhận nhầm là hư.
  if (s.includes('hư') && !s.includes('thường')) return 'hu'
  return 'neutral'
}
const khiTone = computed(() => tone(props.khi))
const huyetTone = computed(() => tone(props.huyet))
// ④ giờ làm nổi cả NHÓM kinh (Khí = chi trên · Huyết = chi dưới) trên hình + bảng đo.
const khiActive = computed(() => props.focus === 'group:khi')
const huyetActive = computed(() => props.focus === 'group:huyet')
// Giá trị gốc là "Khí hư"/"Khí thịnh" — nút bên cạnh đã ghi rõ "Khí" rồi nên bỏ tiền tố khi hiển thị
// (tránh lặp chữ "Khí Khí hư"); giữ nguyên props.khi/huyet (có tiền tố) cho tone()/toneCls() so khớp.
function stripLabel(v: string, label: string): string {
  return v && v.startsWith(label + ' ') ? v.slice(label.length + 1) : v
}
const khiVerdict = computed(() => stripLabel(props.khi, 'Khí'))
const huyetVerdict = computed(() => stripLabel(props.huyet, 'Huyết'))

// ── Giải thích VÌ SAO (lộ con số trung gian) ──
const numF = (n: number) => String(n).replace('.', ',')

// Hư-Thực: cương ĐỘC LẬP (biên độ/diện rộng phản ứng toàn thân — cả 12 kinh), KHÔNG còn gắn
// với Khí/Huyết chi trên/chi dưới. Xem công thức đầy đủ ở MeridianResultsView.vue's diagnosis.
// Bấm → soi đúng các kinh "lệch" trên hình + bảng đo (giống Biểu-Lý/Hàn-Nhiệt đã soi được).
const huThucTone = computed(() => tone(props.huThuc))
const huThucActive = computed(() => props.focus === 'group:huthuc')
// 2 nhóm chip theo BIÊN ĐỘ (không phải thực/hư từng tạng): cao = vượt ngưỡng trên · thấp = dưới ngưỡng dưới.
const htCao = computed(() => (props.huThucOrgans ?? []).filter((o) => o.tone === 'high'))
const htThap = computed(() => (props.huThucOrgans ?? []).filter((o) => o.tone === 'low'))
// Giải thích biểu hiện lâm sàng của cường độ mạch — ứng với Hư/Thực (không áp dụng khi Bình thường).
const HU_THUC_INFO: Record<'thuc' | 'hu', { title: string; body: string }> = {
  thuc: { title: 'Mạch Hữu Lực', body: 'Tà khí đang mạnh, cơ thể phản ứng dữ dội, nhiều nơi lệch rõ.' },
  hu: { title: 'Mạch Vô Lực', body: 'Chính khí suy, phản ứng yếu ớt, lệch ít hoặc lệch nhẹ dù có bệnh.' },
}
const huThucInfo = computed(() => {
  const t = huThucTone.value
  return t === 'thuc' || t === 'hu' ? HU_THUC_INFO[t] : null
})
const huThucWhy = computed(() => {
  const e = props.explain?.huThuc
  if (!e) return ''
  if (e.lechCount === 0) return `0/${e.tongDo} kinh lệch khỏi khoảng bình thường → Bình thường.`
  return `${e.lechCount}/${e.tongDo} kinh lệch khỏi khoảng bình thường, tổng lệch ${numF(e.totalLech)} (ngưỡng ~${numF(e.nguong)}).`
})
</script>

<template>
  <aside class="bcs">
    <h5 class="sum-title">Tóm tắt Bát Cương</h5>

    <!-- ① Âm — Dương = TỔNG CƯƠNG (kết luận tổng quát, suy từ Hàn·Nhiệt × Hư·Thực) — không bấm soi.
    Dùng chung AmDuongTaiji (đồ hình Thái Cực thừa/thiếu) với Tab "Biện Chứng – Pháp Trị" — tránh
    2 nơi cùng vẽ lại 1 kết luận Âm-Dương theo 2 kiểu khác nhau. -->
    <div class="sum-tong-wrap">
      <AmDuongTaiji :tong-cuong="tongCuong" />
    </div>

    <!-- ② Biểu — Lý -->
    <div class="sum-row sum-row--bl">
      <div class="sum-head"><span class="sum-pair">② Biểu — Lý</span><span class="sum-tempkey"><i class="dot dot--han" />Hàn<i class="dot dot--nhiet" />Nhiệt</span></div>
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
            <span v-for="o in g.list" :key="g.key + o.name" class="organ-pill-wrap">
              <button
                type="button"
                class="organ-pill"
                :class="['temp-' + o.temp, { 'is-active': focus === 'organ:' + o.name }]"
                :title="o.organ + ' — ' + (o.temp === 'han' ? 'Hàn' : o.temp === 'nhiet' ? 'Nhiệt' : 'Hàn+Nhiệt') + '. Bấm soi bảng đo'"
                @click="emit('toggle', 'organ:' + o.name)"
              >{{ o.organ }}<small v-if="o.side"> {{ o.side }}</small></button>
              <button
                type="button"
                class="organ-pill__detail"
                :title="'Chi tiết kinh ' + o.organ"
                @click.stop="emit('detail', o.name)"
              >i</button>
            </span>
            <span v-if="!g.list.length" class="sub-empty">—</span>
          </div>
        </div>
      </div>
      <span class="sum-why">Nhóm theo độ sâu: Biểu (nông) / Lý (sâu); màu chip = Hàn (lạnh) / Nhiệt (nóng). Bấm 1 kinh soi bảng I.</span>
    </div>

    <!-- ③ Hư — Thực (cương độc lập — biên độ/diện rộng phản ứng toàn thân, KHÔNG gắn Khí/Huyết) -->
    <div
      class="sum-row sum-row--ht sum-row--clickable"
      :class="{ 'is-active': huThucActive }"
      role="button"
      tabindex="0"
      :aria-pressed="huThucActive"
      :title="'Soi các kinh lệch (Hư-Thực) trên hình + bảng đo'"
      @click="emit('toggle', 'group:huthuc')"
      @keydown.enter.prevent="emit('toggle', 'group:huthuc')"
      @keydown.space.prevent="emit('toggle', 'group:huthuc')"
    >
      <div class="sum-head">
        <span class="sum-pair">③ Hư — Thực</span>
        <span class="sum-pill-group">
          <span class="sum-pill" :class="'tone-bg-' + huThucTone">{{ huThuc || '—' }}</span>
          <button
            v-if="huThucInfo"
            type="button"
            class="sum-info-btn"
            :title="huThucInfo.title + ' — ' + huThucInfo.body"
            aria-label="Giải thích biểu hiện Hư/Thực"
            @click.stop="emit('detail', '__huthuc_info__')"
          >i</button>
        </span>
      </div>
      <!-- Kinh LỆCH (bằng chứng) chia theo BIÊN ĐỘ: cao ↑ vượt ngưỡng · thấp ↓ dưới ngưỡng.
           KHÔNG gọi thực/hư từng tạng (hướng nóng/lạnh đã ở Hàn-Nhiệt). Bấm 1 kinh → soi bảng đo. -->
      <div v-if="htCao.length || htThap.length" class="sum-groups sum-groups--ht" @click.stop>
        <div
          v-for="g in [
            { lb: 'Cao', arrow: '↑', key: 'cao', hint: 'vượt ngưỡng trên', list: htCao },
            { lb: 'Thấp', arrow: '↓', key: 'thap', hint: 'dưới ngưỡng dưới', list: htThap },
          ]"
          :key="g.key"
          class="sum-grp"
        >
          <span class="ht-grp-lb" :class="'ht-grp-lb--' + g.key">{{ g.lb }} <b class="ht-arrow">{{ g.arrow }}</b></span>
          <div class="organ-cloud">
            <button
              v-for="o in g.list"
              :key="g.key + o.name"
              type="button"
              class="organ-pill ht-pill"
              :class="['ht-pill--' + g.key, { 'is-active': focus === 'organ:' + o.name }]"
              :title="o.organ + ' — ' + g.hint + '. Bấm soi bảng đo'"
              @click.stop="emit('toggle', 'organ:' + o.name)"
            >{{ o.organ }}<small v-if="o.side"> {{ o.side }}</small></button>
            <span v-if="!g.list.length" class="sub-empty">—</span>
          </div>
        </div>
      </div>
      <span v-if="huThucWhy" class="sum-why">{{ huThucWhy }}</span>
    </div>

    <!-- ④ Thể Chất (Khí — chi trên / Huyết — chi dưới) — biện chứng ĐỘC LẬP, tách khỏi Hư-Thực -->
    <div class="sum-row sum-row--tc">
      <div class="sum-head"><span class="sum-pair">④ Thể Chất</span></div>
      <div class="sum-groups sum-groups--tc">
        <div class="sum-grp sum-grp--kh">
          <button
            type="button"
            class="grp-btn"
            :class="{ 'is-active': khiActive }"
            :disabled="khiTone === 'none'"
            title="Soi cả nhóm Khí (6 kinh chi trên) trên hình + bảng đo"
            @click="khiTone !== 'none' && emit('toggle', 'group:khi')"
          >Khí</button>
          <b class="kh-verdict" :class="'tone-' + khiTone">{{ khiVerdict || '—' }}</b>
        </div>
        <div class="sum-grp sum-grp--kh">
          <button
            type="button"
            class="grp-btn"
            :class="{ 'is-active': huyetActive }"
            :disabled="huyetTone === 'none'"
            title="Soi cả nhóm Huyết (6 kinh chi dưới) trên hình + bảng đo"
            @click="huyetTone !== 'none' && emit('toggle', 'group:huyet')"
          >Huyết</button>
          <b class="kh-verdict" :class="'tone-' + huyetTone">{{ huyetVerdict || '—' }}</b>
        </div>
      </div>
      <span class="sum-why">Khí = chi trên (6 kinh) · Huyết = chi dưới (6 kinh) — phản ánh thể trạng khí huyết hiện tại.</span>
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
  /* ① và ④ chiếm trọn hàng (banner); ②③ chia đôi cột ở giữa → tóm tắt thấp một nửa */
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
  gap: 3px;
  padding: 5px var(--space-2);
  border: 1px solid var(--brown-100);
  border-left: 3px solid var(--brown-300);
  border-radius: var(--radius-md);
  background: var(--surface-2);
}
/* Viền màu theo từng cặp cương cho dễ phân biệt */
.sum-row--bl { border-left-color: #0e7490; }
.sum-row--ht { border-left-color: #15803d; }
/* ④ Thể Chất — hàng ĐỘC LẬP, chiếm trọn chiều rộng (giống ① tổng cương) để Khí/Huyết nằm ngang hàng */
.sum-row--tc { border-left-color: #7c3aed; grid-column: 1 / -1; }
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
.sum-pill.tone-bg-hu { background: #2f6690; }
.sum-pill.tone-bg-thuc { background: #c0452a; }
.sum-pill.tone-bg-neutral,
.sum-pill.tone-bg-none { background: var(--brown-600); }

/* ① TỔNG CƯƠNG (Âm-Dương) = AmDuongTaiji, chiếm cả 2 cột làm banner đầu bảng. */
.sum-tong-wrap { grid-column: 1 / -1; }
/* Nhóm pill + nút "i" làm 1 khối — bọc cả 2 xuống dòng cùng nhau, không để icon tách lẻ 1 mình */
.sum-pill-group { display: inline-flex; align-items: center; gap: 4px; flex-wrap: nowrap; }
/* "i" giải thích biểu hiện lâm sàng của Hư/Thực — giống nút "i" ở thẻ tạng phủ, đứng riêng cạnh pill */
.sum-info-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 9px;
  font-weight: 800;
  font-style: italic;
  color: var(--brown-500);
  background: var(--white);
  border: 1px solid var(--brown-200);
  border-radius: 50%;
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);
}
.sum-info-btn:hover {
  background: var(--brown-600);
  color: #fff;
  border-color: var(--brown-600);
}

.sum-groups {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
/* ④ Thể Chất — Khí/Huyết nằm NGANG hàng (hàng độc lập rộng rãi, khác kiểu xếp dọc của ② Biểu-Lý) */
.sum-groups--tc {
  flex-direction: row;
  flex-wrap: wrap;
  gap: var(--space-5);
}
/* ③ Hư-Thực: 2 nhóm chip theo biên độ (cao ↑ / thấp ↓) — nhãn xanh theo màu cương, chip trung tính. */
.sum-groups--ht { margin-top: 3px; }
.ht-grp-lb {
  flex: none;
  min-width: 52px;
  margin-top: 2px;
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: #15803d;
}
.ht-arrow { font-size: var(--font-size-sm); font-weight: 800; }
.ht-pill.is-active {
  border-color: #15803d;
  background: #eef6f0;
  box-shadow: 0 0 0 2px rgba(21, 128, 61, 0.16);
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
/* Màu chip theo Hàn/Nhiệt (đã lồng Hàn-Nhiệt vào Biểu-Lý — bỏ ô Hàn-Nhiệt riêng) */
.organ-pill.temp-han { border-color: #4b7ea3; color: #285a80; background: #eef4f9; }
.organ-pill.temp-nhiet { border-color: #cf6b52; color: #a83a20; background: #fbeeea; }
.organ-pill.temp-mixed { border-color: #9070a0; color: #6a3d6d; background: linear-gradient(90deg, #eef4f9 0 50%, #fbeeea 50%); }
.sum-tempkey { display: inline-flex; align-items: center; font-size: 10px; color: var(--gray-500); }
.sum-tempkey .dot { width: 8px; height: 8px; margin: 0 2px 0 5px; }
.organ-pill-wrap {
  display: inline-flex;
  align-items: stretch;
}
.organ-pill-wrap .organ-pill {
  border-radius: 999px 0 0 999px;
  border-right: none;
}
.organ-pill__detail {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  font-size: 10px;
  font-weight: 800;
  font-style: italic;
  color: var(--brown-500);
  background: var(--white);
  border: 1px solid var(--brown-200);
  border-radius: 0 999px 999px 0;
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);
}
.organ-pill__detail:hover {
  background: var(--brown-600);
  color: #fff;
  border-color: var(--brown-600);
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
