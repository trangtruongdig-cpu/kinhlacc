<script setup lang="ts">
/**
 * BatCuongOrgans — Cột tạng phủ đặt QUANH hình người. Mỗi tạng phủ = 1 thẻ minh hoạ SVG (tô màu giải
 * phẫu) + tên. Bấm 1 tạng phủ → phát 'toggle' ('organ:'+mã kinh) → cha cô lập đường kinh tương ứng trên
 * hình 3D (các kinh & tạng khác mờ đi) + soi bảng đo. Tức: thấy "kinh tên X quản tạng phủ nào".
 */
import { ORGAN_ART } from '@/lib/organArt'

interface OrganItem {
  name: string // mã kinh NGẮN (row.name) — để soi
  organ: string // tên tạng phủ (khoá ORGAN_ART)
  state: { temp: 'han' | 'nhiet' | 'mixed'; depth: 'bieu' | 'ly' | 'mixed'; side: string } | null
}

const props = defineProps<{ items: OrganItem[]; focus: string | null }>()
const emit = defineEmits<{ (e: 'toggle', key: string): void }>()

function art(organ: string) {
  return ORGAN_ART[organ] || []
}
// Nhóm CỐ ĐỊNH theo bộ kinh: Khí = 6 kinh chi trên · Huyết = 6 kinh chi dưới.
const GROUP_FIXED: Record<string, string[]> = {
  khi: ['Tiểu', 'Tâm', 'Tam', 'Bào', 'Đại', 'Phế'],
  huyet: ['Bàng', 'Thận', 'Đởm', 'Vị', 'Can', 'Tỳ'],
}
// Tạng phủ thuộc 1 NHÓM: Khí/Huyết theo bộ kinh cố định · Biểu/Lý/Hàn/Nhiệt theo trạng thái đo.
function inGroup(o: OrganItem, g: string): boolean {
  const fixed = GROUP_FIXED[g]
  if (fixed) return fixed.includes(o.name)
  const s = o.state
  if (!s) return false
  if (g === 'bieu') return s.depth === 'bieu' || s.depth === 'mixed'
  if (g === 'ly') return s.depth === 'ly' || s.depth === 'mixed'
  if (g === 'han') return s.temp === 'han' || s.temp === 'mixed'
  if (g === 'nhiet') return s.temp === 'nhiet' || s.temp === 'mixed'
  return false
}
function isActive(o: OrganItem) {
  const f = props.focus
  if (!f) return false
  if (f === 'organ:' + o.name) return true
  if (f.startsWith('group:')) return inGroup(o, f.slice(6)) // soi cả nhóm → các tạng trong nhóm cùng nổi
  return false
}
function isDim(o: OrganItem) {
  const f = props.focus
  if (!f) return false
  // Soi 1 tạng/kinh hoặc 1 nhóm → các tạng KHÔNG thuộc tiêu điểm mờ đi.
  if (f.startsWith('organ:')) return f !== 'organ:' + o.name
  if (f.startsWith('group:')) return !inGroup(o, f.slice(6))
  return false
}
function tempLabel(t: string) {
  return t === 'han' ? 'Hàn' : t === 'nhiet' ? 'Nhiệt' : 'Hàn+Nhiệt'
}
</script>

<template>
  <div class="bc-organs">
    <button
      v-for="o in items"
      :key="o.name"
      type="button"
      class="organ-card"
      :class="[o.state ? 'temp-' + o.state.temp : 'is-off', { 'is-active': isActive(o), 'is-dim': isDim(o) }]"
      :title="'Soi kinh ' + o.organ + ' trên hình + bảng đo'"
      :aria-pressed="isActive(o)"
      @click="emit('toggle', 'organ:' + o.name)"
    >
      <svg class="organ-svg" viewBox="0 0 64 64" aria-hidden="true">
        <path
          v-for="(p, i) in art(o.organ)"
          :key="i"
          :d="p.d"
          :fill="p.fill || 'none'"
          :opacity="p.opacity ?? 1"
          :stroke="p.stroke || 'none'"
          :stroke-width="p.sw || 0"
          stroke-linejoin="round"
          stroke-linecap="round"
        />
      </svg>
      <span class="organ-card-name">{{ o.organ }}<small v-if="o.state?.side"> {{ o.state.side }}</small></span>
      <span v-if="o.state" class="organ-card-tag">{{ tempLabel(o.state.temp) }}</span>
    </button>
  </div>
</template>

<style scoped>
.bc-organs {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.organ-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  /* các thẻ LẤP ĐẦY chiều cao cột (bằng hình người) → khít vào nhau, không khoảng trống */
  flex: 1 1 0;
  gap: 1px;
  padding: 4px;
  background: var(--white);
  border: 1px solid var(--brown-100);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: opacity var(--transition-fast), box-shadow var(--transition-fast), border-color var(--transition-fast),
    transform var(--transition-fast);
}
.organ-card:hover {
  border-color: var(--brown-300);
  transform: translateY(-1px);
}
.organ-svg {
  width: 36px;
  height: 36px;
  display: block;
}
.organ-card-name {
  font-size: 11px;
  font-weight: 700;
  color: var(--gray-800);
  line-height: 1.15;
  text-align: center;
}
.organ-card-name small {
  font-weight: 500;
  color: var(--gray-500);
}
.organ-card-tag {
  font-size: 9px;
  font-weight: 700;
  color: #fff;
  padding: 0 6px;
  border-radius: 999px;
  line-height: 1.5;
}

/* Trạng thái Hàn/Nhiệt/mixed → viền + nhãn theo màu */
.temp-han {
  border-color: #6e9ec4;
}
.temp-han .organ-card-tag {
  background: #2f6690;
}
.temp-nhiet {
  border-color: #d98a73;
}
.temp-nhiet .organ-card-tag {
  background: #c0452a;
}
.temp-mixed {
  border-color: #b48ad6;
}
.temp-mixed .organ-card-tag {
  background: #8a4fbf;
}

/* Tạng phủ KHÔNG đo → mờ nhạt, không nhãn */
.is-off {
  opacity: 0.82;
}
.is-off .organ-svg {
  filter: grayscale(0.35);
}

/* Cô lập: cái đang chọn nổi, cái khác mờ hẳn (như đường kinh) */
.organ-card.is-active {
  border-color: var(--brown-600);
  box-shadow: 0 0 0 2px rgba(120, 53, 15, 0.18);
  opacity: 1;
}
.organ-card.is-dim {
  opacity: 0.32;
}
</style>
