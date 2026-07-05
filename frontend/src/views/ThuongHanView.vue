<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/services/api'
import BienChungWheel from '@/components/BienChungWheel.vue'
import VongLucKinh from '@/components/VongLucKinh.vue'
import VongLucKhi from '@/components/VongLucKhi.vue'
import BenhCoBang from '@/components/BenhCoBang.vue'
import { lucKhiByKey, type LucKhiInfo } from '@/constants/lucKhi'

/**
 * Thương Hàn Tạp Luận Bệnh — hành trình "bóc lớp" lý thuyết (GĐ1: ①→⑤).
 * Vòng mọc dần theo lớp; panel bên phải lấy nội dung từ /thuong-han/lop (sửa được trong DB).
 */
interface LopContent {
  slug: string
  ten: string
  ten_han: string | null
  tom_tat: string | null
  khai_niem: string | null
  vi_du: string | null
  vi_sao: string | null
  lien_he_app: string | null
}

// Meta tĩnh (đảm bảo stepper + vòng chạy được ngay cả khi API chưa seed).
const LOPS = [
  { thu_tu: 1, slug: 'am-duong', ten: 'Âm Dương', ten_han: '太極', hint: 'Một chia thành hai' },
  { thu_tu: 2, slug: 'ngu-hanh', ten: 'Ngũ Hành', ten_han: '五行', hint: 'Năm vận động · sinh–khắc' },
  { thu_tu: 3, slug: 'tang-phu', ten: 'Tạng Phủ', ten_han: '臟腑', hint: 'Năm tạng, sáu phủ' },
  { thu_tu: 4, slug: 'luc-khi', ten: 'Lục Khí', ten_han: '六氣', hint: 'Sáu khí · Tam Âm Tam Dương' },
  { thu_tu: 5, slug: 'luc-kinh', ten: 'Lục Kinh', ten_han: '六經', hint: 'Tiêu ⊗ Bản = sáu kinh' },
]

interface DiseaseRec {
  ten: string | null
  nguyen_tac: string | null
  bai_thuoc: string[]
}
interface ChiMuc {
  tong: number
  records: Record<number, DiseaseRec>
  lucKinh: Record<string, number[]>
  phan: Record<string, number[]>
  tapBenh: number[]
  lucKhi: Record<string, number[]>
  tangPhu: Record<string, number[]>
}
interface LucKinhInfo {
  slug: string
  ten: string
  ten_han: string | null
  ban_khi: string | null
  ban_khi_han: string | null
  tong_hoa_note: string | null
  trung_kien: string | null
  tang_phu_dich: string | null
  trieu_chung: string | null
  tri_phap: string | null
  truyen_bien: string | null
}
interface WheelSel {
  type: string
  key: string
  label: string
  organs?: string[]
  kinh?: string // owner Lục Kinh (lớp 5: bấm tầng phụ Khí/Tạng)
  khi?: string // owner Lục Khí (lớp 4: bấm tầng phụ Kinh/Tạng)
  tang?: string // owner Tạng Phủ (lớp 3)
}

const current = ref(1)
const mode = ref(1)
const content = ref<Record<string, LopContent>>({})
const chiMuc = ref<ChiMuc | null>(null)
const lucKinhData = ref<Record<string, LucKinhInfo>>({})
const selected = ref<WheelSel | null>(null)
const expanded = ref<string | null>(null)
// Lọc sâu 3 trục — mỗi lớp có 1 TRỤC CHÍNH, drill-down theo 2 trục còn lại.
type AxisT = 'kinh' | 'khi' | 'tang'
const sub = ref<Record<AxisT, string | null>>({ kinh: null, khi: null, tang: null })
const loading = ref(true)

const PRIMARY_BY_LOP: Record<number, AxisT | null> = { 1: null, 2: null, 3: 'tang', 4: 'khi', 5: 'kinh' }
const AXIS_LABEL: Record<AxisT, string> = { kinh: 'Lục Kinh biện chứng', khi: 'Tác nhân · Lục Khí', tang: 'Tạng Phủ tổn thương' }
const resetSub = () => { sub.value = { kinh: null, khi: null, tang: null } }

const currentLop = computed(() => LOPS[current.value - 1]!)
const currentContent = computed<LopContent | null>(() => content.value[currentLop.value.slug] ?? null)
const rows = computed(() => {
  const c = currentContent.value
  if (!c) return []
  return [
    { label: 'Khái niệm', text: c.khai_niem },
    { label: 'Ví dụ', text: c.vi_du },
    { label: 'Vì sao quan trọng', text: c.vi_sao },
    { label: 'Liên hệ trong app', text: c.lien_he_app },
  ].filter((r) => !!r.text)
})

const inter = (a: number[], b: number[]): number[] => { const sb = new Set(b); return a.filter((x) => sb.has(x)) }
const axisData = (cm: ChiMuc, t: AxisT): Record<string, number[]> => (t === 'kinh' ? cm.lucKinh : t === 'khi' ? cm.lucKhi : cm.tangPhu)

// TRỤC CHÍNH của lớp hiện tại — chỉ có hiệu lực khi mục đang chọn khớp trục đó (lớp 1,2 = null).
const primaryType = computed<AxisT | null>(() => {
  const p = PRIMARY_BY_LOP[current.value] ?? null
  if (!p || !selected.value) return null
  return selected.value.type === p ? p : null
})
// 2 trục lọc sâu = 2 trục còn lại (thứ tự hiển thị: Kinh → Tạng → Khí, bỏ trục chính).
const subAxes = computed<AxisT[]>(() => {
  const p = primaryType.value
  return p ? (['kinh', 'tang', 'khi'] as AxisT[]).filter((a) => a !== p) : []
})
// Id thể bệnh của MỤC CHÍNH đang chọn (nền để lọc sâu).
const baseIds = computed<number[]>(() => {
  const s = selected.value, cm = chiMuc.value, p = primaryType.value
  if (!s || !cm || !p) return []
  if (p === 'tang' && s.organs?.length) {
    const seen = new Set<number>()
    for (const org of s.organs) for (const id of cm.tangPhu[org] ?? []) seen.add(id)
    return [...seen]
  }
  return axisData(cm, p)[s.key] ?? []
})
// Id sau khi giao tập với các trục lọc sâu đang bật.
const matchedIds = computed<number[]>(() => {
  const cm = chiMuc.value
  if (!cm || !primaryType.value) return []
  let ids = baseIds.value
  for (const a of subAxes.value) { const v = sub.value[a]; if (v) ids = inter(ids, axisData(cm, a)[v] ?? []) }
  return ids
})
// Danh sách chip cho 1 trục lọc sâu (đếm chéo theo trục kia đang bật).
function optsFor(axis: AxisT): { key: string; count: number }[] {
  const cm = chiMuc.value
  if (!cm || !baseIds.value.length) return []
  let scope = baseIds.value
  for (const a of subAxes.value) { if (a === axis) continue; const v = sub.value[a]; if (v) scope = inter(scope, axisData(cm, a)[v] ?? []) }
  const out: { key: string; count: number }[] = []
  for (const [k, ids] of Object.entries(axisData(cm, axis))) {
    const c = inter(scope, ids).length
    if (c > 0 || sub.value[axis] === k) out.push({ key: k, count: c })
  }
  return out.sort((a, b) => b.count - a.count)
}
// Các khối chip theo trục (có ① ②), bỏ khối rỗng.
const subBlocks = computed<{ axis: AxisT; no: string; label: string; options: { key: string; count: number }[] }[]>(() =>
  subAxes.value
    .map((axis, i) => ({ axis, no: '①②'[i] ?? '', label: AXIS_LABEL[axis], options: optsFor(axis) }))
    .filter((b) => b.options.length),
)
const anySub = computed(() => !!(sub.value.kinh || sub.value.khi || sub.value.tang))
const subLabel = computed(() => [sub.value.kinh, sub.value.tang, sub.value.khi].filter(Boolean).join(' · '))
interface DiseaseGroup {
  ten: string
  variants: { id: number; nguyen_tac: string | null; bai_thuoc: string[] }[]
}
// GỘP THEO TÊN chỉ ở UI (không đụng dữ liệu): tên trùng → 1 dòng, mở ra xem các biến thể (pháp/bài).
const matchedGroups = computed<DiseaseGroup[]>(() => {
  const cm = chiMuc.value
  if (!cm) return []
  const g = new Map<string, DiseaseGroup>()
  for (const id of matchedIds.value) {
    const r = cm.records[id]
    if (!r) continue
    const ten = r.ten ?? '(không tên)'
    if (!g.has(ten)) g.set(ten, { ten, variants: [] })
    g.get(ten)!.variants.push({ id, nguyen_tac: r.nguyen_tac, bai_thuoc: r.bai_thuoc })
  }
  return [...g.values()].sort((a, b) => a.ten.localeCompare(b.ten, 'vi'))
})
// Số thể bệnh mỗi Lục Kinh (cho badge trên đồ hình lớp 5).
const lucKinhCounts = computed<Record<string, number>>(() => {
  const cm = chiMuc.value
  if (!cm) return {}
  const out: Record<string, number> = {}
  for (const [slug, ids] of Object.entries(cm.lucKinh)) out[slug] = ids.length
  return out
})
// Tóm tắt lý thuyết Lục Kinh (giàu) khi trỏ vào 1 kinh.
const selectedKinh = computed<LucKinhInfo | null>(() => {
  const s = selected.value
  if (!s || s.type !== 'kinh') return null
  return lucKinhData.value[s.key] ?? null
})
// Số thể bệnh mỗi Lục Khí (badge trên đồ hình lớp 4).
const lucKhiCounts = computed<Record<string, number>>(() => {
  const cm = chiMuc.value
  if (!cm) return {}
  const out: Record<string, number> = {}
  for (const [khi, ids] of Object.entries(cm.lucKhi)) out[khi] = ids.length
  return out
})
// Tóm tắt "Lục Khí tác động Tạng Phủ" khi trỏ vào 1 khí.
const selectedKhi = computed<LucKhiInfo | null>(() => {
  const s = selected.value
  if (!s || s.type !== 'khi') return null
  return lucKhiByKey[s.key] ?? null
})
// Slug Lục Kinh → tên Việt (fallback TĨNH khi API /thuong-han/luc-kinh chưa nạp).
const KINH_TEN: Record<string, string> = {
  'thai-duong': 'Thái Dương', 'duong-minh': 'Dương Minh', 'thieu-duong': 'Thiếu Dương',
  'thai-am': 'Thái Âm', 'thieu-am': 'Thiếu Âm', 'quyet-am': 'Quyết Âm',
}
function kinhLabel(slug: string): string {
  const i = lucKinhData.value[slug]
  return i ? `${i.ten} ${i.ten_han ?? ''}`.trim() : (KINH_TEN[slug] ?? slug)
}
// Nhãn chip lọc sâu: trục Lục Kinh hiện tên Việt (không phải slug); trục khác giữ nguyên key.
function chipLabel(axis: AxisT, key: string): string {
  if (axis === 'kinh') return lucKinhData.value[key]?.ten ?? KINH_TEN[key] ?? key
  return key
}
// Nhãn mục CHÍNH (owner) khi bấm sâu từ một cung trên đồ hình.
function ownerLabel(axis: AxisT, key: string): string {
  if (axis === 'kinh') return kinhLabel(key)
  if (axis === 'khi') { const k = lucKhiByKey[key]; return k ? `Lục Khí ${k.key} ${k.han}` : `Lục Khí ${key}` }
  return key
}
function onSelect(sel: WheelSel) {
  expanded.value = null
  const primary = PRIMARY_BY_LOP[current.value] ?? null
  const stype: string = sel.type === 'phu' ? 'tang' : sel.type // phủ cũng là tạng phủ (trục tang)
  // Lớp không có bộ lọc (Âm Dương / Ngũ Hành) → chỉ ghi nhận để hiển thị lý thuyết
  if (!primary) { selected.value = { ...sel, type: stype }; resetSub(); return }
  // Chọn/đổi MỤC CHÍNH của lớp
  if (stype === primary) {
    const same = selected.value?.type === primary && selected.value.key === sel.key
    selected.value = { ...sel, type: stype }
    if (!same) resetSub()
    return
  }
  // Bấm tầng phụ trên đồ hình → owner = mục CHÍNH của cung theo trục chính của lớp
  // (lớp 5 kinh: sel.kinh · lớp 4 khí: sel.khi · lớp 3 tạng: sel.tang) → gắn primary rồi đặt lọc sâu.
  const owner = primary === 'kinh' ? sel.kinh : primary === 'khi' ? sel.khi : primary === 'tang' ? sel.tang : undefined
  if (owner) {
    const same = selected.value?.type === primary && selected.value.key === owner
    if (!same) { selected.value = { type: primary, key: owner, label: ownerLabel(primary, owner) }; resetSub() }
  }
  if (stype === 'kinh' || stype === 'khi' || stype === 'tang') {
    sub.value[stype] = sub.value[stype] === sel.key ? null : sel.key
  }
}
function toggleExpand(ten: string) {
  expanded.value = expanded.value === ten ? null : ten
}
function toggleSub(axis: AxisT, key: string) {
  sub.value[axis] = sub.value[axis] === key ? null : key
  expanded.value = null
}
function clearSub() {
  resetSub()
  expanded.value = null
}

function go(n: number) {
  current.value = Math.min(LOPS.length, Math.max(1, n))
  selected.value = null
  expanded.value = null
  resetSub()
}

async function load() {
  loading.value = true
  try {
    const data = await api.get<LopContent[]>('/thuong-han/lop')
    const map: Record<string, LopContent> = {}
    for (const l of data ?? []) map[l.slug] = l
    content.value = map
    try {
      chiMuc.value = await api.get<ChiMuc>('/thuong-han/chi-muc')
      const lk = await api.get<LucKinhInfo[]>('/thuong-han/luc-kinh')
      const m: Record<string, LucKinhInfo> = {}
      for (const k of lk ?? []) m[k.slug] = k
      lucKinhData.value = m
    } catch {
      // Chưa có endpoint / lỗi — vòng vẫn chạy, chỉ không kết nối pháp trị.
    }
  } catch {
    // Chưa seed / lỗi mạng — vẫn cho bóc lớp bằng meta tĩnh.
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>

<template>
  <div class="th-page">
    <!-- Header -->
    <header class="th-hero">
      <div class="th-hero-main">
        <span class="th-eyebrow">傷寒雜病論 · Trương Trọng Cảnh</span>
        <h1 class="th-title">Thương Hàn Tạp Luận Bệnh</h1>
        <p class="th-sub">
          Bóc từng lớp lý thuyết — từ <b>Âm Dương</b> tới <b>Lục Kinh</b> — để người mới cũng thấy
          được mạch tư duy dẫn tới lâm sàng.
        </p>
      </div>
      <div class="th-modes">
        <button type="button" class="th-mode" :class="{ active: mode === 1 }" @click="mode = 1">① Bóc lớp lý thuyết</button>
        <button type="button" class="th-mode" :class="{ active: mode === 2 }" @click="mode = 2">② Bệnh cơ lâm sàng</button>
      </div>
    </header>

    <BenhCoBang v-if="mode === 2" />

    <div v-else class="th-body">
      <!-- Cột trái: thanh chọn lớp -->
      <nav class="th-steps" aria-label="Chọn lớp lý thuyết">
        <button
          v-for="l in LOPS"
          :key="l.slug"
          class="th-step"
          :class="{ active: current === l.thu_tu, done: current > l.thu_tu }"
          @click="go(l.thu_tu)"
        >
          <span class="th-step-no">{{ l.thu_tu }}</span>
          <span class="th-step-txt">
            <b>{{ l.ten }} <i class="han">{{ l.ten_han }}</i></b>
            <small>{{ l.hint }}</small>
          </span>
        </button>
      </nav>

      <!-- Giữa: vòng mọc dần -->
      <section class="th-wheel">
        <VongLucKinh v-if="current === 5" :counts="lucKinhCounts" :active-kinh="selected?.type === 'kinh' ? selected.key : null" :active-tang="sub.tang" :active-khi="sub.khi" @select="onSelect" />
        <VongLucKhi v-else-if="current === 4" :counts="lucKhiCounts" :show-card="false" :active-khi="selected?.type === 'khi' ? selected.key : null" :active-kinh="sub.kinh" :active-tang="sub.tang" @select="onSelect" />
        <BienChungWheel v-else :lop="current" :active-tang="current === 3 && selected?.type === 'tang' ? selected.key : null" @select="onSelect" />
        <div class="th-nav">
          <button class="th-btn" :disabled="current === 1" @click="go(current - 1)">◄ Lớp trước</button>
          <span class="th-progress">Lớp {{ current }} / {{ LOPS.length }}</span>
          <button class="th-btn primary" :disabled="current === LOPS.length" @click="go(current + 1)">Bóc lớp sau ►</button>
        </div>
      </section>

      <!-- Phải: giảng giải -->
      <aside class="th-panel">
        <div class="th-panel-head">
          <h2>{{ currentLop.ten }} <span class="han">{{ currentLop.ten_han }}</span></h2>
          <p v-if="currentContent?.tom_tat" class="th-tomtat">{{ currentContent.tom_tat }}</p>
          <p v-else class="th-tomtat muted">{{ currentLop.hint }}</p>
        </div>

        <!-- KẾT NỐI PHÁP TRỊ: trỏ vào vòng → liệt kê thể bệnh tương ứng (chỉ lớp 3/4/5) -->
        <div v-if="selected && primaryType" class="th-link">
          <!-- Tóm tắt lý thuyết Lục Kinh (giàu, như card Trang Chủ) -->
          <dl v-if="selectedKinh" class="th-sum">
            <div v-if="selectedKinh.ban_khi" class="th-sum-row"><dt>Bản khí</dt><dd>{{ selectedKinh.ban_khi }} {{ selectedKinh.ban_khi_han }}</dd></div>
            <div v-if="selectedKinh.tong_hoa_note" class="th-sum-row"><dt>Tòng hóa</dt><dd>{{ selectedKinh.tong_hoa_note }}</dd></div>
            <div v-if="selectedKinh.trung_kien" class="th-sum-row"><dt>Trung kiến</dt><dd>{{ selectedKinh.trung_kien }}</dd></div>
            <div v-if="selectedKinh.tang_phu_dich" class="th-sum-row"><dt>Tạng phủ</dt><dd>{{ selectedKinh.tang_phu_dich }}</dd></div>
            <div v-if="selectedKinh.trieu_chung" class="th-sum-row"><dt>Triệu chứng</dt><dd>{{ selectedKinh.trieu_chung }}</dd></div>
            <div v-if="selectedKinh.tri_phap" class="th-sum-row"><dt>Trị pháp</dt><dd>{{ selectedKinh.tri_phap }}</dd></div>
            <div v-if="selectedKinh.truyen_bien" class="th-sum-row"><dt>Truyền biến</dt><dd>{{ selectedKinh.truyen_bien }}</dd></div>
          </dl>

          <!-- Tóm tắt "Lục Khí tác động Tạng Phủ" khi trỏ vào 1 khí -->
          <dl v-if="selectedKhi" class="th-sum">
            <div class="th-sum-row"><dt>Đặc tính</dt><dd>{{ selectedKhi.tinh }}</dd></div>
            <div class="th-sum-row"><dt>Bản khí</dt><dd>↔ Kinh {{ selectedKhi.kinhVi }} {{ selectedKhi.kinhHan }} · mùa {{ selectedKhi.mua }}</dd></div>
            <div class="th-sum-row"><dt>Tác động tạng phủ</dt><dd><b>{{ selectedKhi.tangVi }}</b> {{ selectedKhi.tangHan }} — {{ selectedKhi.tacDong }}</dd></div>
            <div class="th-sum-row"><dt>Cơ chế ngũ hành</dt><dd><b>{{ selectedKhi.rel.type === 'sinh' ? 'Sinh' : 'Khắc' }}</b> · {{ selectedKhi.rel.note }}</dd></div>
            <div class="th-sum-row"><dt>Triệu chứng</dt><dd>{{ selectedKhi.trieuChung }}</dd></div>
            <div class="th-sum-row"><dt>Trị pháp</dt><dd>{{ selectedKhi.triPhap }} — <i>{{ selectedKhi.phuongThuoc }}</i></dd></div>
          </dl>

          <!-- LỌC SÂU: bấm mục chính → bấm tiếp 2 trục còn lại (giao tập) — đồng bộ 2 chiều với đồ hình -->
          <div v-if="subBlocks.length" class="th-sf">
            <div v-for="b in subBlocks" :key="b.axis" class="th-sf-axis">
              <span class="th-sf-label"><i class="th-sf-no">{{ b.no }}</i> {{ b.label }}</span>
              <div class="th-sf-chips">
                <button v-for="o in b.options" :key="o.key" type="button" class="th-chip" :class="[b.axis, { on: sub[b.axis] === o.key, mute: !o.count }]" @click="toggleSub(b.axis, o.key)">{{ chipLabel(b.axis, o.key) }} <i>{{ o.count }}</i></button>
              </div>
            </div>
            <button v-if="anySub" type="button" class="th-sf-clear" @click="clearSub">✕ Bỏ lọc sâu</button>
          </div>

          <div class="th-link-head">
            <span class="th-link-label">{{ selected.label }}<template v-if="subLabel"> · {{ subLabel }}</template></span>
            <span class="th-link-count">{{ matchedGroups.length }} thể · {{ matchedIds.length }} bản ghi</span>
          </div>
          <div v-if="matchedGroups.length" style="max-height:44vh;overflow-y:auto;display:flex;flex-direction:column;gap:3px">
            <div v-for="g in matchedGroups" :key="g.ten" @click="toggleExpand(g.ten)" style="cursor:pointer;padding:7px 10px;background:#fff;border-left:3px solid #d3b58a;border-radius:8px;color:#2a1c0e;font-size:13.5px">
              <span style="color:#a4743a;margin-right:6px">{{ expanded === g.ten ? '▾' : '▸' }}</span><b style="color:#2a1c0e">{{ g.ten }}</b><span v-if="g.variants.length > 1" style="margin-left:6px;color:#fff;background:#a4743a;font-size:11px;font-weight:800;padding:1px 7px;border-radius:999px">×{{ g.variants.length }}</span>
              <div v-if="expanded === g.ten" style="margin-top:6px;font-size:12.5px;color:#3a2c1a">
                <div v-for="(v, i) in g.variants" :key="v.id" style="padding-top:5px;border-top:1px dashed #e7ddcd">
                  <span v-if="g.variants.length > 1" style="color:#6b4a24;font-weight:700">Biến thể {{ i + 1 }} </span>
                  <span style="color:#8a7a60">Pháp:</span> {{ v.nguyen_tac || '—' }}<br />
                  <span style="color:#8a7a60">Bài:</span> {{ v.bai_thuoc.length ? v.bai_thuoc.join(' · ') : '—' }}
                </div>
              </div>
            </div>
          </div>
          <p v-else class="th-loading">Chưa có thể bệnh nào gắn mục này.</p>
        </div>

        <template v-else>
          <p class="th-hint">
            🔗 Trỏ vào <b>Lục Kinh</b>, <b>Lục Khí</b> hay <b>Tạng Phủ</b> trên vòng để xem các
            <b>thể bệnh</b> tương ứng trong kho pháp trị.
          </p>
          <dl v-if="rows.length" class="th-rows">
            <div v-for="(r, i) in rows" :key="i" class="th-row">
              <dt>{{ r.label }}</dt>
              <dd>{{ r.text }}</dd>
            </div>
          </dl>
          <p v-else-if="loading" class="th-loading">Đang tải nội dung…</p>
        </template>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.th-page { display: flex; flex-direction: column; gap: var(--space-5, 20px); }

/* Hero */
.th-hero {
  background: linear-gradient(135deg, var(--brown-600, #6b4a24) 0%, var(--brown-800, #2e1d0d) 100%);
  border-radius: var(--radius-lg, 16px);
  padding: var(--space-7, 28px) var(--space-8, 32px);
  color: var(--white, #fff);
  display: flex; align-items: flex-end; justify-content: space-between; gap: var(--space-5, 20px); flex-wrap: wrap;
}
.th-eyebrow { font-size: var(--font-size-xs, 12px); font-weight: 700; letter-spacing: 0.04em; color: var(--brown-100, #e9d6b3); opacity: 0.9; }
.th-title { font-size: var(--font-size-2xl, 28px); font-weight: 800; margin: 6px 0 8px; }
.th-sub { font-size: var(--font-size-sm, 14px); color: rgba(255, 255, 255, 0.82); max-width: 60ch; line-height: 1.55; }
.th-sub b { color: #f3d8a6; }
.th-modes { display: flex; flex-direction: column; gap: 8px; }
.th-mode { font: inherit; font-size: var(--font-size-xs, 12px); font-weight: 700; padding: 6px 14px; border-radius: 999px; white-space: nowrap; cursor: pointer; border: 1px solid rgba(255, 255, 255, 0.18); background: rgba(255, 255, 255, 0.06); color: rgba(255, 255, 255, 0.72); transition: background 0.15s, color 0.15s; }
.th-mode:hover { background: rgba(255, 255, 255, 0.12); color: #fff; }
.th-mode.active { background: rgba(255, 255, 255, 0.18); border-color: rgba(255, 255, 255, 0.32); color: #fff; }

/* Body layout */
.th-body { display: grid; grid-template-columns: 232px minmax(300px, 1fr) minmax(280px, 380px); gap: var(--space-5, 20px); align-items: start; }

/* Steps */
.th-steps { display: flex; flex-direction: column; gap: 8px; }
.th-step {
  display: flex; align-items: center; gap: 12px; text-align: left; cursor: pointer;
  background: var(--surface, #fff); border: 1px solid var(--border, #e7ddcd); border-radius: var(--radius-md, 12px);
  padding: 12px 14px; transition: border-color 0.15s, background 0.15s, transform 0.15s; color: var(--text, #3a2c1a);
}
.th-step:hover { border-color: var(--brown-400, #b98a4e); transform: translateX(2px); }
.th-step.active { border-color: var(--brown-500, #a4743a); background: var(--brown-50, #f7efe2); box-shadow: 0 2px 10px rgba(120, 78, 30, 0.12); }
.th-step.done .th-step-no { background: var(--brown-500, #a4743a); color: #fff; }
.th-step-no {
  flex-shrink: 0; width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center;
  font-weight: 800; font-size: 13px; background: var(--brown-100, #ecdcc0); color: var(--brown-700, #6b4a24);
}
.th-step.active .th-step-no { background: var(--brown-600, #6b4a24); color: #fff; }
.th-step-txt { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.th-step-txt b { font-size: 14px; font-weight: 700; }
.th-step-txt .han { font-weight: 500; opacity: 0.6; font-style: normal; font-size: 12px; }
.th-step-txt small { font-size: 11px; color: var(--text-muted, #8a7a60); }

/* Wheel */
.th-wheel { display: flex; flex-direction: column; align-items: center; gap: var(--space-4, 16px); }
.th-nav { display: flex; align-items: center; gap: var(--space-4, 16px); }
.th-btn {
  font: inherit; font-weight: 700; font-size: 13px; cursor: pointer;
  background: var(--surface, #fff); border: 1px solid var(--border, #e7ddcd); color: var(--text, #3a2c1a);
  padding: 9px 16px; border-radius: 999px; transition: background 0.15s, border-color 0.15s;
}
.th-btn:hover:not(:disabled) { border-color: var(--brown-400, #b98a4e); }
.th-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.th-btn.primary { background: var(--brown-600, #6b4a24); color: #fff; border-color: var(--brown-600, #6b4a24); }
.th-btn.primary:hover:not(:disabled) { background: var(--brown-700, #563b1c); }
.th-progress { font-size: 13px; font-weight: 700; color: var(--text-muted, #8a7a60); }

/* Panel */
.th-panel {
  background: var(--surface, #fff); border: 1px solid var(--border, #e7ddcd); border-radius: var(--radius-lg, 16px);
  padding: var(--space-5, 20px); display: flex; flex-direction: column; gap: var(--space-4, 16px);
  position: sticky; top: var(--space-4, 16px);
}
.th-panel-head h2 { font-size: var(--font-size-xl, 20px); font-weight: 800; color: var(--brown-700, #6b4a24); margin: 0 0 6px; }
.th-panel-head .han { font-weight: 500; opacity: 0.55; font-size: 0.8em; }
.th-tomtat { font-size: 14px; font-weight: 600; color: var(--text, #3a2c1a); line-height: 1.5; margin: 0; }
.th-tomtat.muted { color: var(--text-muted, #8a7a60); font-weight: 500; }
.th-rows { display: flex; flex-direction: column; gap: var(--space-4, 16px); margin: 0; }
.th-row dt { font-size: 12px; font-weight: 800; letter-spacing: 0.02em; text-transform: uppercase; color: var(--brown-500, #a4743a); margin-bottom: 3px; }
.th-row dd { margin: 0; font-size: 13.5px; line-height: 1.6; color: var(--text, #3a2c1a); }
.th-loading { font-size: 13px; color: var(--text-muted, #8a7a60); line-height: 1.5; }
.th-hint { font-size: 13px; color: var(--text-muted, #8a7a60); line-height: 1.55; background: var(--brown-50, #f7efe2); border: 1px dashed var(--brown-300, #d3b58a); border-radius: var(--radius-md, 12px); padding: 12px 14px; }
.th-hint b { color: var(--brown-700, #6b4a24); }
.th-link { display: flex; flex-direction: column; gap: 10px; }
.th-link-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding-bottom: 8px; border-bottom: 2px solid var(--brown-200, #e6d3b3); }
.th-link-label { font-size: 16px; font-weight: 800; color: var(--brown-700, #6b4a24); }
.th-link-count { font-size: 12px; font-weight: 700; color: #fff; background: var(--brown-600, #6b4a24); padding: 3px 10px; border-radius: 999px; white-space: nowrap; }
.th-sum { margin: 0 0 4px; padding: 10px 12px; background: var(--brown-50, #f7efe2); border: 1px solid var(--brown-200, #e6d3b3); border-radius: var(--radius-md, 12px); display: flex; flex-direction: column; gap: 5px; }
.th-sum-row { display: grid; grid-template-columns: 80px 1fr; gap: 8px; font-size: 12.5px; line-height: 1.45; margin: 0; }
.th-sum-row dt { color: var(--brown-600, #6b4a24); font-weight: 700; }
.th-sum-row dd { margin: 0; color: var(--text, #3a2c1a); }

/* Lọc sâu (Tạng Phủ · Tác nhân) */
.th-sf { display: flex; flex-direction: column; gap: 8px; padding: 10px 12px; background: var(--brown-50, #f7efe2); border: 1px solid var(--brown-200, #e6d3b3); border-radius: var(--radius-md, 12px); }
.th-sf-axis { display: flex; flex-direction: column; gap: 5px; }
.th-sf-label { font-size: 11.5px; font-weight: 800; letter-spacing: 0.02em; color: var(--brown-600, #6b4a24); text-transform: uppercase; display: inline-flex; align-items: center; gap: 6px; }
.th-sf-no { font-style: normal; color: #b7822e; }
.th-sf-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.th-chip { font: inherit; font-size: 12.5px; font-weight: 700; cursor: pointer; padding: 3px 9px; border-radius: 999px; border: 1px solid var(--brown-300, #d3b58a); background: #fff; color: var(--brown-700, #6b4a24); display: inline-flex; align-items: center; gap: 5px; transition: background 0.12s, border-color 0.12s, color 0.12s; }
.th-chip i { font-style: normal; font-size: 11px; font-weight: 800; padding: 0 5px; border-radius: 999px; background: var(--brown-100, #efe2cc); color: var(--brown-600, #6b4a24); }
.th-chip:hover { border-color: var(--brown-500, #8a5a2a); }
.th-chip.kinh.on { background: #b7822e; border-color: #b7822e; color: #fff; }
.th-chip.tang.on { background: #6b4a24; border-color: #6b4a24; color: #fff; }
.th-chip.khi.on { background: #b1502f; border-color: #b1502f; color: #fff; }
.th-chip.on i { background: rgba(255, 255, 255, 0.28); color: #fff; }
.th-chip.mute { opacity: 0.45; }
.th-sf-clear { align-self: flex-start; font: inherit; font-size: 11.5px; font-weight: 700; cursor: pointer; padding: 2px 8px; border-radius: 999px; border: 1px solid transparent; background: transparent; color: var(--text-muted, #8a7a60); }
.th-sf-clear:hover { color: #b1502f; border-color: var(--brown-200, #e6d3b3); }

.th-next {
  font-size: 13px; line-height: 1.55; color: var(--brown-700, #6b4a24);
  background: var(--brown-50, #f7efe2); border: 1px dashed var(--brown-300, #d3b58a);
  border-radius: var(--radius-md, 12px); padding: 12px 14px;
}
.th-next b { color: var(--brown-800, #2e1d0d); }

/* Responsive */
@media (max-width: 1080px) {
  .th-body { grid-template-columns: 1fr; }
  .th-steps { flex-direction: row; flex-wrap: wrap; }
  .th-step { flex: 1 1 180px; }
  .th-panel { position: static; }
}
</style>
