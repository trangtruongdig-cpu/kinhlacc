<script lang="ts">
/**
 * Bộ lọc dùng chung cho Pháp trị · Thuốc · Bệnh Tây Y · Triệu chứng.
 *
 * Điều khiển (controlled): trạng thái chọn nằm ở trang cha; component chỉ render
 * và phát sự kiện `pick(groupId, key)` / `clear`. Trang cha giữ nguyên hàm toggle
 * và watcher tải lại dữ liệu — component chỉ thay phần giao diện.
 *
 * Mỗi group:
 *  - variant 'segmented': 1 lựa chọn, ít mục (vd. Phân loại Đông/Tây/Tất cả).
 *  - variant 'chips'    : nhiều mục dạng pill; multi hoặc single (kèm allOption).
 *      · axis     → gom Tổn thương theo 3 trục (Định vị · Tác nhân · Tính chất).
 *      · searchable → ô tìm khi danh mục dài.
 *      · collapse N → chỉ hiện N chip đầu (ưu tiên đã chọn) + "＋M nữa".
 */
export interface FbOption {
  key: string | number
  label: string
  count?: number | null
  nhom?: string | null
}
export interface FbGroup {
  id: string
  label: string
  variant?: 'segmented' | 'chips'
  multi?: boolean
  options: FbOption[]
  selected: Array<string | number>
  /** Nút "Tất Cả" cho nhóm single-select (bấm → phát pick(id, null)). */
  allOption?: { label: string; count?: number | null } | null
  axis?: boolean
  searchable?: boolean
  collapse?: number | null
  /** Rút gọn CHỮ hiển thị chip (giá trị/lọc không đổi). */
  shorten?: 'kinh-mach' | 'ton-thuong'
}
</script>

<script setup lang="ts">
import { reactive, computed } from 'vue'
import { groupTonThuongByAxis, shortTonThuongLabel } from '@/constants/tonThuong'
import { shortKinhMachLabel } from '@/constants/kinhMach'

const props = defineProps<{ groups: FbGroup[] }>()
const emit = defineEmits<{
  (e: 'pick', groupId: string, key: string | number | null): void
  (e: 'clear'): void
}>()

const search = reactive<Record<string, string>>({})
const expanded = reactive<Record<string, boolean>>({})

function isMulti(g: FbGroup): boolean {
  return g.multi ?? g.variant !== 'segmented'
}
function isActive(g: FbGroup, key: string | number): boolean {
  return g.selected.includes(key)
}
function allActive(g: FbGroup): boolean {
  return g.selected.length === 0
}
function pick(g: FbGroup, key: string | number | null): void {
  emit('pick', g.id, key)
}
/** Nhãn hiển thị đã rút gọn (chữ), giữ nguyên o.label làm giá trị/tra cứu. */
function displayLabel(g: FbGroup, o: FbOption): string {
  if (g.shorten === 'kinh-mach') return shortKinhMachLabel(o.label)
  if (g.shorten === 'ton-thuong') return shortTonThuongLabel(o.label)
  return o.label
}
/** Tooltip hiện tên đầy đủ khi nhãn bị rút gọn. */
function titleFor(g: FbGroup, o: FbOption): string | undefined {
  return g.shorten && displayLabel(g, o) !== o.label ? o.label : undefined
}
function setSearch(g: FbGroup, value: string): void {
  search[g.id] = value
}

function visibleOptions(g: FbGroup): FbOption[] {
  const q = (search[g.id] ?? '').trim().toLowerCase()
  if (!q) return g.options
  return g.options.filter((o) => o.label.toLowerCase().includes(q))
}
function axisGroups(g: FbGroup) {
  return groupTonThuongByAxis(visibleOptions(g).map((o) => ({ ...o, name: o.label })))
}

/** Nhóm chip phẳng có đang thu gọn không (có collapse, không tìm kiếm, dư mục). */
function canCollapse(g: FbGroup): boolean {
  return !!g.collapse && !(search[g.id] ?? '').trim() && visibleOptions(g).length > g.collapse
}
function shownFlat(g: FbGroup): FbOption[] {
  if (expanded[g.id] || !canCollapse(g)) return visibleOptions(g)
  const limit = g.collapse as number
  const opts = visibleOptions(g)
  const sel = opts.filter((o) => isActive(g, o.key))
  const rest = opts.filter((o) => !isActive(g, o.key))
  return [...sel, ...rest].slice(0, Math.max(limit, sel.length))
}
function hiddenCount(g: FbGroup): number {
  if (expanded[g.id] || !canCollapse(g)) return 0
  return visibleOptions(g).length - shownFlat(g).length
}

const anySelected = computed(() => props.groups.some((g) => isMulti(g) && g.selected.length > 0))
</script>

<template>
  <div class="fb" role="region" aria-label="Bộ lọc">
    <div
      v-for="g in groups"
      :key="g.id"
      class="fb-group"
      :class="{ 'fb-group--grow': g.variant !== 'segmented' }"
    >
      <div class="fb-group__head">
        <span class="fb-group__label">{{ g.label }}</span>
        <div v-if="g.searchable && g.options.length > 8" class="fb-search">
          <input
            :value="search[g.id] ?? ''"
            type="search"
            class="fb-search__input"
            :placeholder="`Tìm ${g.label.toLowerCase()}…`"
            @input="setSearch(g, ($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>

      <!-- Segmented: 1 lựa chọn, ít mục -->
      <div v-if="g.variant === 'segmented'" class="fb-seg" role="group" :aria-label="g.label">
        <button
          v-for="o in g.options"
          :key="o.key"
          type="button"
          class="fb-seg__btn"
          :class="{ active: isActive(g, o.key) }"
          :aria-pressed="isActive(g, o.key)"
          @click="pick(g, o.key)"
        >
          {{ o.label }}<span v-if="o.count != null" class="fb-count">{{ o.count }}</span>
        </button>
      </div>

      <!-- Chips gom theo 3 trục (Tổn thương) -->
      <div v-else-if="g.axis" class="fb-axes">
        <section v-for="ax in axisGroups(g)" :key="ax.key" class="fb-axis">
          <header class="fb-axis__head">
            <span class="fb-axis__num">{{ ax.num }}</span>
            <span class="fb-axis__title">{{ ax.title }}</span>
            <span class="fb-axis__sub">{{ ax.sub }}</span>
          </header>
          <div class="fb-axis__body">
            <div v-for="sg in ax.subgroups" :key="sg.nhom" class="fb-sub">
              <div v-if="ax.subgroups.length > 1" class="fb-sub__label">{{ sg.label }}</div>
              <div class="fb-chips">
                <button
                  v-for="o in sg.items"
                  :key="o.key"
                  type="button"
                  class="fb-chip"
                  :class="{ active: isActive(g, o.key) }"
                  :aria-pressed="isActive(g, o.key)"
                  :title="titleFor(g, o)"
                  @click="pick(g, o.key)"
                >
                  {{ displayLabel(g, o) }}<span v-if="o.count != null" class="fb-count">{{ o.count }}</span>
                </button>
              </div>
            </div>
          </div>
        </section>
        <p v-if="!axisGroups(g).length" class="fb-empty">Không có mục khớp.</p>
      </div>

      <!-- Chips phẳng: Tạng phủ, Chủng bệnh… (allOption + thu gọn) -->
      <div v-else class="fb-chips">
        <button
          v-if="g.allOption"
          type="button"
          class="fb-chip"
          :class="{ active: allActive(g) }"
          :aria-pressed="allActive(g)"
          @click="pick(g, null)"
        >
          {{ g.allOption.label }}<span v-if="g.allOption.count != null" class="fb-count">{{ g.allOption.count }}</span>
        </button>
        <button
          v-for="o in shownFlat(g)"
          :key="o.key"
          type="button"
          class="fb-chip"
          :class="{ active: isActive(g, o.key) }"
          :aria-pressed="isActive(g, o.key)"
          :title="titleFor(g, o)"
          @click="pick(g, o.key)"
        >
          {{ displayLabel(g, o) }}<span v-if="o.count != null" class="fb-count">{{ o.count }}</span>
        </button>
        <button
          v-if="hiddenCount(g) > 0"
          type="button"
          class="fb-chip fb-chip--more"
          @click="expanded[g.id] = true"
        >
          ＋{{ hiddenCount(g) }} nữa
        </button>
        <button
          v-else-if="g.collapse && expanded[g.id] && canCollapse(g)"
          type="button"
          class="fb-chip fb-chip--more"
          @click="expanded[g.id] = false"
        >
          Thu gọn
        </button>
        <p v-if="!visibleOptions(g).length" class="fb-empty">Không có mục khớp.</p>
      </div>
    </div>

    <button v-if="anySelected" type="button" class="fb-clear" @click="emit('clear')">
      ✕ Xóa lọc
    </button>
  </div>
</template>

<style scoped>
.fb {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg, 12px);
  background: var(--surface-2, #fbf8f2);
}
.fb-group { display: flex; flex-direction: column; gap: 6px; }
.fb-group__head { display: flex; align-items: center; gap: 10px; min-height: 22px; }
.fb-group__label {
  font-size: 11px; font-weight: 800; letter-spacing: 0.04em;
  text-transform: uppercase; color: var(--brown-700);
}
.fb-search { margin-left: auto; }
.fb-search__input {
  width: 190px; max-width: 46vw; padding: 4px 10px;
  font-size: 12px; font-family: inherit;
  border: 1px solid var(--gray-300); border-radius: var(--radius-full, 999px);
  background: var(--white); color: var(--gray-800);
}
.fb-search__input:focus { outline: none; border-color: var(--brown-500); box-shadow: var(--focus-ring); }

/* Chips */
.fb-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.fb-chip {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 4px 10px; font-size: 13px; font-weight: 600; font-family: inherit;
  border: 1px solid var(--gray-300); border-radius: var(--radius-full, 999px);
  background: var(--white); color: var(--gray-700);
  cursor: pointer; transition: all var(--transition-fast);
}
.fb-chip:hover { border-color: var(--brown-400); color: var(--brown-700); }
.fb-chip.active { background: var(--brown-600); border-color: var(--brown-600); color: var(--white); }
.fb-chip--more { border-style: dashed; color: var(--brown-700); background: transparent; }
.fb-chip--more:hover { background: var(--brown-50); }
.fb-count {
  font-size: 11px; font-weight: 700; padding: 0 5px;
  border-radius: var(--radius-full, 999px); background: var(--gray-100); color: var(--gray-600);
}
.fb-chip.active .fb-count { background: rgba(255, 255, 255, 0.24); color: var(--white); }

/* Segmented */
.fb-seg {
  display: inline-flex; flex-wrap: wrap; gap: 2px; padding: 3px; width: fit-content;
  background: var(--gray-100); border: 1px solid var(--gray-200); border-radius: var(--radius-md);
}
.fb-seg__btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 14px; font-size: 13px; font-weight: 600; font-family: inherit;
  border: none; background: transparent; color: var(--gray-600);
  border-radius: calc(var(--radius-md) - 3px); cursor: pointer; transition: all var(--transition-fast);
}
.fb-seg__btn:hover { color: var(--brown-700); }
.fb-seg__btn.active {
  background: var(--white); color: var(--brown-800);
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.08));
}
.fb-seg__btn .fb-count { background: transparent; color: inherit; opacity: 0.65; padding: 0 3px; }
.fb-seg__btn.active .fb-count { background: var(--brown-100); color: var(--brown-700); opacity: 1; }

/* Tổn thương theo 3 trục */
.fb-axes { display: flex; flex-direction: column; gap: 8px; }
.fb-axis {
  border: 1px solid var(--gray-200); border-radius: var(--radius-md);
  background: var(--white); overflow: hidden;
}
.fb-axis__head {
  display: flex; align-items: center; gap: 7px; padding: 5px 9px;
  background: var(--gray-100); border-bottom: 1px solid var(--gray-200);
}
.fb-axis__num {
  display: inline-flex; align-items: center; justify-content: center;
  width: 18px; height: 18px; flex: none; font-size: 11px; font-weight: 800;
  color: var(--white); background: var(--brown-600); border-radius: 50%;
}
.fb-axis__title {
  font-size: 11px; font-weight: 800; letter-spacing: 0.04em;
  text-transform: uppercase; color: var(--brown-800);
}
.fb-axis__sub { font-size: 10px; color: var(--gray-500); }
.fb-axis__body {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 8px 14px; padding: 9px; align-items: start;
}
.fb-sub__label {
  font-size: 10px; font-weight: 700; color: var(--brown-700);
  margin: 0 0 5px; padding-bottom: 3px; border-bottom: 1px dashed var(--gray-200);
}

.fb-empty { font-size: 12px; color: var(--gray-500); margin: 2px 0; }
.fb-clear {
  align-self: flex-start; padding: 5px 12px; font-size: 12px; font-weight: 700;
  color: var(--danger-fg, #9a3620); background: var(--danger-bg, #fbeae5);
  border: 1px solid var(--danger-border, #f1c4b7); border-radius: var(--radius-full, 999px);
  cursor: pointer; transition: filter var(--transition-fast);
}
.fb-clear:hover { filter: brightness(0.97); }
</style>
