<script setup lang="ts">
// Mục nhỏ của Section IV — PHƯƠNG HUYỆT NGŨ DU (theo Ngũ Hành Hồi Tác & Nạn Kinh 69).
// Kết nối trực tiếp với danh sách Tạng Phủ tổn thương từ Lớp 3 Tạng Phủ ở trước.
import { ref, reactive, computed, onMounted } from 'vue'
import { api } from '@/services/api'
import { KINH_THEO_HANH, KINH, type HanhId } from '@/lib/nguDuHuyet'
import {
  phuongHuyetNHHT, phuongHuyetBoMauTaCon, autoKhung, KHUNG_TEN, KHUNG_MOTA, KHUNG_ALL,
  type KhungLoai, type HuyetChiDinh,
} from '@/lib/khungNHHT'

const props = defineProps<{
  z: { hoa: number | null; tho: number | null; kim: number | null; thuy: number | null; moc: number | null } | null
  huThuc?: string
}>()
const emit = defineEmits<{ (e: 'goto-acu', ma: string): void; (e: 'goto-dict', id: number): void }>()

interface HuyetViRow {
  idHuyet: number; ten_huyet?: string; ma_huyet?: string; id_tu_dien?: number | null
  loai_huyet?: string; kinhMach?: { ten?: string }
}
const huyetList = ref<HuyetViRow[]>([])
const norm = (s?: string) => (s || '').toLowerCase().normalize('NFC').replace(/\s+/g, ' ').trim()
const huyetMap = computed(() => {
  const m = new Map<string, HuyetViRow>()
  for (const h of huyetList.value) {
    const k = norm(h.ten_huyet)
    if (k && !m.has(k)) m.set(k, h)
  }
  return m
})

onMounted(async () => {
  try {
    const res = await api.get<HuyetViRow[] | { data?: HuyetViRow[] }>('/huyet-vi')
    huyetList.value = Array.isArray(res) ? res : (res?.data ?? [])
  } catch {
    huyetList.value = []
  }
})

const HANH_IDS: HanhId[] = ['moc', 'hoa', 'tho', 'kim', 'thuy']

// Danh sách tất cả 12 tạng phủ
const ALL_ORGANS = Object.keys(KINH)

// Tính toán danh sách Tạng Phủ bị tổn thương/lệch từ số liệu đo ngũ hành
interface OrganStatus {
  organ: string
  hanh: HanhId
  zVal: number
  thuc: boolean
  isSig: boolean // lệch rõ (|z| >= 1)
}

const organStatuses = computed<OrganStatus[]>(() => {
  const z = props.z
  if (!z) return []
  const out: OrganStatus[] = []
  for (const h of HANH_IDS) {
    const v = z[h] ?? 0
    const thuc = v >= 0
    const isSig = Math.abs(v) >= 1
    const organs = KINH_THEO_HANH[h]
    for (const organ of organs) {
      out.push({ organ, hanh: h, zVal: v, thuc, isSig })
    }
  }
  // Ưu tiên tạng phủ có mức lệch rõ lên trước
  return out.sort((a, b) => Math.abs(b.zVal) - Math.abs(a.zVal))
})

// Các tạng phủ tổn thương lệch rõ mặc định được chọn
const selectedOrgans = ref<Set<string>>(new Set())

// Khởi tạo chọn các tạng phủ bị lệch rõ khi có dữ liệu
const initSelected = () => {
  const sigs = organStatuses.value.filter(o => o.isSig).map(o => o.organ)
  if (sigs.length) {
    selectedOrgans.value = new Set(sigs.slice(0, 4))
  } else if (organStatuses.value.length) {
    selectedOrgans.value = new Set(organStatuses.value.slice(0, 2).map(o => o.organ))
  }
}
initSelected()

function toggleOrgan(organ: string) {
  const s = new Set(selectedOrgans.value)
  if (s.has(organ)) s.delete(organ)
  else s.add(organ)
  selectedOrgans.value = s
}

const activeMode = ref<'nhht' | 'bomautacon'>('nhht')

// Ghi đè khung tác động theo từng tạng phủ
const khungOv = reactive<Record<string, KhungLoai | undefined>>({})

function recOf(ci: HuyetChiDinh): HuyetViRow | undefined {
  return huyetMap.value.get(norm(ci.huyet))
}

// Tính các Card Phương huyệt Ngũ Hành Hồi Tác theo danh sách Tạng Phủ đã chọn
const nhhtCards = computed(() => {
  const out = []
  for (const organ of selectedOrgans.value) {
    const st = organStatuses.value.find(s => s.organ === organ)
    if (!st) continue
    const khung = khungOv[organ] ?? autoKhung(props.huThuc)
    const ph = phuongHuyetNHHT(organ, st.thuc, khung)
    if (!ph) continue
    out.push({
      organ,
      hanh: st.hanh,
      zVal: st.zVal,
      thuc: st.thuc,
      khung,
      ph,
      taRec: recOf(ph.ta),
      boRec: recOf(ph.bo)
    })
  }
  return out
})

// Tính các Card Bổ Mẫu Tả Con theo danh sách Tạng Phủ đã chọn
const bmCards = computed(() => {
  const out = []
  for (const organ of selectedOrgans.value) {
    const st = organStatuses.value.find(s => s.organ === organ)
    if (!st) continue
    const bm = phuongHuyetBoMauTaCon(organ, st.thuc)
    if (!bm) continue
    out.push({
      organ,
      hanh: st.hanh,
      zVal: st.zVal,
      thuc: st.thuc,
      bm,
      rec: recOf(bm.targetHuyet)
    })
  }
  return out
})

const HANH_COLOR: Record<HanhId, string> = { moc: '#4f7d39', hoa: '#b23a29', tho: '#b3872c', kim: '#8a7a52', thuy: '#35638d' }

// CHỈ ĐỊNH gộp: Dồn các Tạng Phủ chọn thành 2 nhóm TẢ / BỔ
interface RxItem { huyet: string; kinh: string; hanhTen: string; role: string; rec?: HuyetViRow; targetOrgan: string }
const rx = computed(() => {
  const ta = new Map<string, RxItem>(), bo = new Map<string, RxItem>()
  const add = (m: Map<string, RxItem>, ci: HuyetChiDinh, targetOrgan: string, rec?: HuyetViRow) => {
    const key = `${ci.huyet}_${ci.kinh}`
    if (!m.has(key)) m.set(key, { huyet: ci.huyet, kinh: ci.kinh, hanhTen: ci.hanhTen, role: ci.role, rec, targetOrgan })
  }
  if (activeMode.value === 'nhht') {
    for (const c of nhhtCards.value) {
      add(ta, c.ph.ta, c.organ, c.taRec)
      add(bo, c.ph.bo, c.organ, c.boRec)
    }
  } else {
    for (const c of bmCards.value) {
      if (c.bm.targetHuyet.boTa === 'ta') add(ta, c.bm.targetHuyet, c.organ, c.rec)
      else add(bo, c.bm.targetHuyet, c.organ, c.rec)
    }
  }
  return { ta: [...ta.values()], bo: [...bo.values()] }
})
</script>

<template>
  <div class="ngd">
    <div class="ngd-head">
      <div class="ngd-head-titles">
        <span class="ngd-title">Phương Huyệt Ngũ Du</span>
        <span class="ngd-sub">Tác động Tạng Phủ tổn thương theo Ngũ Hành &amp; Nạn Kinh</span>
      </div>
      <div class="ngd-mode-tabs">
        <button
          type="button"
          class="ngd-mode-btn"
          :class="{ 'is-active': activeMode === 'nhht' }"
          @click="activeMode = 'nhht'"
        >
          🔄 Ngũ Hành Hồi Tác
        </button>
        <button
          type="button"
          class="ngd-mode-btn"
          :class="{ 'is-active': activeMode === 'bomautacon' }"
          @click="activeMode = 'bomautacon'"
        >
          🌱 Bổ Mẫu Tả Con (Nạn Kinh 69)
        </button>
      </div>
    </div>

    <!-- THANH KẾT NỐI TẠNG PHỦ TỔN THƯƠNG TỪ LỚP 3 -->
    <div class="ngd-organ-selector-box">
      <div class="ngd-selector-label">
        🎯 <b>TẠNG PHỦ TỔN THƯƠNG CẦN LẬP PHÁC ĐỒ CHÂM CỨU:</b>
        <span class="ngd-selector-hint">(Đồng bộ từ chẩn đoán Lớp Tạng Phủ ở trước — nhấp để chọn/bỏ chọn tạng phủ tác động)</span>
      </div>
      <div class="ngd-organ-chips">
        <button
          v-for="st in organStatuses"
          :key="st.organ"
          type="button"
          class="ngd-organ-chip"
          :class="{
            'is-selected': selectedOrgans.has(st.organ),
            'is-sig': st.isSig,
            'is-thuc': st.thuc,
            'is-hu': !st.thuc
          }"
          @click="toggleOrgan(st.organ)"
        >
          <span class="ngd-oc-check">{{ selectedOrgans.has(st.organ) ? '✓' : '+' }}</span>
          <b class="ngd-oc-name">{{ st.organ }}</b>
          <span class="ngd-oc-tag">{{ st.thuc ? 'Thực' : 'Hư' }}</span>
        </button>
      </div>
    </div>

    <!-- KHỐI TỔNG HỢP CHỈ ĐỊNH PHƯƠNG HUYỆT CA BỆNH -->
    <div v-if="rx.ta.length || rx.bo.length" class="ngd-prescription-box">
      <div class="ngd-rx-header">
        📝 <b>CHỈ ĐỊNH PHƯƠNG HUYỆT TỔNG HỢP CA BỆNH</b>
        <span class="ngd-rx-sub">(Châm tả &amp; Bổ cứu trực tiếp vào các đường kinh tổn thương)</span>
      </div>

      <div class="ngd-rx-body">
        <!-- NHÓM TẢ -->
        <div v-if="rx.ta.length" class="ngd-rx-group">
          <span class="ngd-rx-tag ngd-rx-tag--ta">🔴 CHÂM TẢ (Tiết thực / Hạ hỏa)</span>
          <div class="ngd-rx-chips">
            <div v-for="item in rx.ta" :key="item.huyet + item.kinh" class="ngd-rx-chip ngd-rx-chip--ta">
              <span class="ngd-rx-name">{{ item.huyet }}</span>
              <span class="ngd-rx-detail">({{ item.role }} · {{ item.hanhTen }} · {{ item.kinh }} <small>← trị {{ item.targetOrgan }}</small>)</span>
              <button v-if="item.rec?.ma_huyet" type="button" class="ngd-map" title="Xem trên đồ hình 3D"
                @click="emit('goto-acu', item.rec!.ma_huyet!)">🧭 3D</button>
              <button v-else-if="item.rec?.id_tu_dien" type="button" class="ngd-map" title="Tra ở Từ Điển"
                @click="emit('goto-dict', item.rec!.id_tu_dien!)">📖 Từ điển</button>
            </div>
          </div>
        </div>

        <!-- NHÓM BỔ -->
        <div v-if="rx.bo.length" class="ngd-rx-group">
          <span class="ngd-rx-tag ngd-rx-tag--bo">🟢 CHÂM BỔ / CỨU (Phù chính / Ích khí)</span>
          <div class="ngd-rx-chips">
            <div v-for="item in rx.bo" :key="item.huyet + item.kinh" class="ngd-rx-chip ngd-rx-chip--bo">
              <span class="ngd-rx-name">{{ item.huyet }}</span>
              <span class="ngd-rx-detail">({{ item.role }} · {{ item.hanhTen }} · {{ item.kinh }} <small>← trị {{ item.targetOrgan }}</small>)</span>
              <button v-if="item.rec?.ma_huyet" type="button" class="ngd-map" title="Xem trên đồ hình 3D"
                @click="emit('goto-acu', item.rec!.ma_huyet!)">🧭 3D</button>
              <button v-else-if="item.rec?.id_tu_dien" type="button" class="ngd-map" title="Tra ở Từ Điển"
                @click="emit('goto-dict', item.rec!.id_tu_dien!)">📖 Từ điển</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- NẾU CHƯA CHỌN TẠNG PHỦ NÀO -->
    <p v-if="!selectedOrgans.size" class="ngd-empty">
      Chưa chọn tạng phủ tổn thương nào. Nhấp vào các thẻ tạng phủ ở trên để tạo phác đồ châm cứu.
    </p>

    <!-- CHI TIẾT THEO TỪNG TẠNG PHỦ TỔN THƯƠNG (NGỮ CẢNH NHHT) -->
    <div v-else-if="activeMode === 'nhht'" class="ngd-cards">
      <div v-for="c in nhhtCards" :key="c.organ" class="ngd-card">
        <div class="ngd-card-head">
          <span class="ngd-goc" :style="{ '--hc': HANH_COLOR[c.hanh] }">
            Tạng/Phủ <b>{{ c.organ }}</b> · Hành {{ c.ph.hanhETen }}
            <span class="ngd-tt" :class="c.thuc ? 'is-thuc' : 'is-hu'">{{ c.thuc ? 'THỰC' : 'HƯ' }}</span>
          </span>

          <label class="ngd-sel">Khung tác động:
            <select :value="c.khung" @change="khungOv[c.organ] = ($event.target as HTMLSelectElement).value as KhungLoai"
              :title="KHUNG_MOTA[c.khung]">
              <option v-for="k in KHUNG_ALL" :key="k" :value="k">{{ KHUNG_TEN[k] }} ({{ KHUNG_MOTA[k] }})</option>
            </select>
          </label>
        </div>

        <div class="ngd-khung-line">
          Cặp Hồi Tác: <b>{{ c.ph.khung.ngoai }}</b> (ngoài) – <b>{{ c.ph.khung.trong }}</b> (trong)
        </div>

        <div class="ngd-rows">
          <div class="ngd-row">
            <span class="ngd-badge ngd-badge--ta">TẢ</span>
            <span class="ngd-chip ngd-chip--ta">
              <b class="ngd-hy">{{ c.ph.ta.huyet }}</b>
              <span class="ngd-meta">{{ c.ph.ta.role }} · {{ c.ph.ta.hanhTen }} huyệt · kinh {{ c.ph.ta.kinh }}</span>
            </span>
            <button v-if="c.taRec?.ma_huyet" type="button" class="ngd-map" title="Xem trên đồ hình 3D"
              @click="emit('goto-acu', c.taRec!.ma_huyet!)">🧭 3D</button>
            <button v-else-if="c.taRec?.id_tu_dien" type="button" class="ngd-map" title="Tra ở Từ Điển"
              @click="emit('goto-dict', c.taRec!.id_tu_dien!)">📖 Từ điển</button>
          </div>
          <div class="ngd-row">
            <span class="ngd-badge ngd-badge--bo">BỔ</span>
            <span class="ngd-chip ngd-chip--bo">
              <b class="ngd-hy">{{ c.ph.bo.huyet }}</b>
              <span class="ngd-meta">{{ c.ph.bo.role }} · {{ c.ph.bo.hanhTen }} huyệt · kinh {{ c.ph.bo.kinh }}</span>
            </span>
            <button v-if="c.boRec?.ma_huyet" type="button" class="ngd-map" title="Xem trên đồ hình 3D"
              @click="emit('goto-acu', c.boRec!.ma_huyet!)">🧭 3D</button>
            <button v-else-if="c.boRec?.id_tu_dien" type="button" class="ngd-map" title="Tra ở Từ Điển"
              @click="emit('goto-dict', c.boRec!.id_tu_dien!)">📖 Từ điển</button>
          </div>
        </div>

        <p class="ngd-giaithich">💡 <b>Lý luận súc tích</b>: {{ c.ph.giaiThich }}</p>
      </div>
    </div>

    <!-- CHI TIẾT THEO TỪNG TẠNG PHỦ TỔN THƯƠNG (NGỮ CẢNH NẠN KINH 69) -->
    <div v-else-if="activeMode === 'bomautacon'" class="ngd-cards">
      <div v-for="c in bmCards" :key="c.organ" class="ngd-card">
        <div class="ngd-card-head">
          <span class="ngd-goc" :style="{ '--hc': HANH_COLOR[c.hanh] }">
            Tạng/Phủ <b>{{ c.organ }}</b> · Hành {{ c.bm.hanhETen }}
            <span class="ngd-tt" :class="c.thuc ? 'is-thuc' : 'is-hu'">{{ c.thuc ? 'THỰC' : 'HƯ' }}</span>
          </span>
        </div>

        <div class="ngd-rows">
          <div class="ngd-row">
            <span class="ngd-badge" :class="c.thuc ? 'ngd-badge--ta' : 'ngd-badge--bo'">{{ c.thuc ? 'TẢ TỬ' : 'BỔ MẪU' }}</span>
            <span class="ngd-chip" :class="c.thuc ? 'ngd-chip--ta' : 'ngd-chip--bo'">
              <b class="ngd-hy">{{ c.bm.targetHuyet.huyet }}</b>
              <span class="ngd-meta">{{ c.bm.targetHuyet.role }} · {{ c.bm.targetHuyet.hanhTen }} huyệt · kinh {{ c.bm.targetHuyet.kinh }}</span>
            </span>
            <button v-if="c.rec?.ma_huyet" type="button" class="ngd-map" title="Xem trên đồ hình 3D"
              @click="emit('goto-acu', c.rec!.ma_huyet!)">🧭 3D</button>
            <button v-else-if="c.rec?.id_tu_dien" type="button" class="ngd-map" title="Tra ở Từ Điển"
              @click="emit('goto-dict', c.rec!.id_tu_dien!)">📖 Từ điển</button>
          </div>
        </div>

        <p class="ngd-giaithich">💡 <b>Lý luận súc tích (Nạn Kinh 69)</b>: {{ c.bm.giaiThich }}</p>
      </div>
    </div>

    <p class="ngd-note">
      ⚠ Gợi ý theo Ngũ Hành Hồi Tác &amp; Nạn Kinh 69 — kèm <b>ôn/thanh</b> theo Hàn-Nhiệt (Bát Cương) &amp; thủ pháp bổ/tả; đối chiếu tứ chẩn trước khi châm.
    </p>
  </div>
</template>

<style scoped>
.ngd { margin-top: 14px; border-top: 1px dashed var(--brown-200, #e0d3bf); padding-top: 12px; }
.ngd-head { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.ngd-head-titles { display: flex; flex-direction: column; }
.ngd-title { font-weight: 800; color: var(--brown-800, #4b3626); font-size: 1.05rem; }
.ngd-sub { font-weight: 500; color: var(--gray-500, #8a7c68); font-size: 0.78rem; margin-top: 1px; }

.ngd-mode-tabs { display: flex; gap: 6px; }
.ngd-mode-btn { font-size: 0.76rem; font-weight: 700; padding: 5px 12px; border-radius: 8px; border: 1px solid var(--brown-200, #d9c9b0); background: #fff; color: var(--brown-700, #6f5f47); cursor: pointer; transition: all 0.2s ease; }
.ngd-mode-btn.is-active { background: var(--brown-700, #4b3626); color: #fff; border-color: var(--brown-700, #4b3626); box-shadow: 0 2px 4px rgba(0,0,0,0.1); }

.ngd-organ-selector-box { background: #fbf8f3; border: 1px solid #ebd9c3; border-radius: 10px; padding: 10px 12px; margin-bottom: 14px; }
.ngd-selector-label { font-size: 0.82rem; color: #4b3626; margin-bottom: 8px; display: flex; flex-direction: column; gap: 2px; }
.ngd-selector-hint { font-size: 0.74rem; font-weight: normal; color: #7f6e59; }

.ngd-organ-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.ngd-organ-chip { font-size: 0.78rem; font-weight: 600; padding: 4px 10px; border-radius: 999px; border: 1px solid #dcd0bf; background: #fff; color: #5a4838; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; transition: all 0.15s ease; }
.ngd-organ-chip:hover { background: #f5ece0; }
.ngd-organ-chip.is-selected { background: #4b3626; color: #fff; border-color: #4b3626; }
.ngd-organ-chip.is-selected .ngd-oc-tag { background: rgba(255,255,255,0.25); color: #fff; }
.ngd-oc-check { font-weight: 800; font-size: 0.82rem; }
.ngd-oc-tag { font-size: 0.68rem; font-weight: 700; padding: 1px 5px; border-radius: 4px; }
.ngd-organ-chip.is-thuc .ngd-oc-tag { background: #fce8e4; color: #a82e1e; }
.ngd-organ-chip.is-hu .ngd-oc-tag { background: #e4eef6; color: #235885; }

.ngd-prescription-box { background: #fdfaf5; border: 1.5px solid var(--brown-300, #d4c3aa); border-radius: 10px; padding: 12px 14px; margin-bottom: 14px; box-shadow: 0 2px 6px rgba(0,0,0,0.03); }
.ngd-rx-header { font-size: 0.88rem; color: var(--brown-900, #3a2618); margin-bottom: 10px; border-bottom: 1px solid #ebd9c3; padding-bottom: 6px; }
.ngd-rx-sub { font-size: 0.75rem; font-weight: normal; color: var(--gray-500, #8a7c68); margin-left: 6px; }

.ngd-rx-body { display: flex; flex-direction: column; gap: 10px; }
.ngd-rx-group { display: flex; flex-direction: column; gap: 6px; }
.ngd-rx-tag { font-size: 0.74rem; font-weight: 800; padding: 2px 8px; border-radius: 4px; display: inline-block; width: fit-content; }
.ngd-rx-tag--ta { background: #fce8e4; color: #a82e1e; }
.ngd-rx-tag--bo { background: #e4f3de; color: #2e5c1e; }

.ngd-rx-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.ngd-rx-chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 999px; font-size: 0.84rem; border: 1px solid; }
.ngd-rx-chip--ta { background: #fff8f7; border-color: #f3c2b8; }
.ngd-rx-chip--bo { background: #f7fcf5; border-color: #c7e5bb; }
.ngd-rx-name { font-weight: 800; color: #2c1d11; }
.ngd-rx-detail { font-size: 0.74rem; color: #6e5e49; }
.ngd-rx-detail small { color: #8a6d48; font-weight: 600; }

.ngd-empty { color: var(--gray-500, #8a7c68); font-size: 0.86rem; margin: 8px 0; font-style: italic; }
.ngd-cards { display: flex; flex-direction: column; gap: 10px; }
.ngd-card { border: 1px solid var(--brown-200, #e5d9c6); border-radius: 10px; padding: 10px 12px; background: var(--cream-50, #faf6ee); }
.ngd-card-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 6px; }
.ngd-goc { font-size: 0.9rem; color: var(--brown-800, #4b3626); border-left: 3px solid var(--hc); padding-left: 7px; }
.ngd-goc b { color: var(--hc); }
.ngd-tt { font-size: 0.7rem; font-weight: 800; padding: 1px 6px; border-radius: 999px; margin-left: 4px; }
.ngd-tt.is-thuc { background: #f4dcd6; color: #b23a29; }
.ngd-tt.is-hu { background: #d8e4ef; color: #35638d; }
.ngd-sel { font-size: 0.76rem; color: var(--gray-600, #6f5f47); display: inline-flex; align-items: center; gap: 4px; }
.ngd-sel select { font-size: 0.78rem; padding: 2px 6px; border: 1px solid var(--brown-200, #d9c9b0); border-radius: 6px; background: #fff; color: var(--brown-800, #4b3626); font-weight: 600; }
.ngd-khung-line { font-size: 0.78rem; color: var(--gray-600, #6f5f47); margin-bottom: 8px; }
.ngd-rows { display: flex; flex-direction: column; gap: 6px; }
.ngd-row { display: flex; align-items: center; gap: 8px; }
.ngd-badge { font-size: 0.68rem; font-weight: 800; width: 48px; text-align: center; padding: 2px 0; border-radius: 5px; flex: 0 0 auto; }
.ngd-badge--ta { background: #f4dcd6; color: #b23a29; }
.ngd-badge--bo { background: #dcecd4; color: #3f6a2c; }
.ngd-chip { display: inline-flex; align-items: baseline; gap: 7px; padding: 3px 10px; border-radius: 999px; border: 1px solid; }
.ngd-chip--ta { border-color: #e2b6ac; background: #fbf1ee; }
.ngd-chip--bo { border-color: #b9d3a8; background: #f2f7ec; }
.ngd-hy { font-size: 0.9rem; color: var(--brown-800, #3f2f1e); }
.ngd-meta { font-size: 0.72rem; color: var(--gray-500, #8a7c68); }
.ngd-map { border: 1px solid #d9c9b0; background: #fff; cursor: pointer; font-size: 0.75rem; font-weight: 600; line-height: 1; padding: 3px 6px; border-radius: 6px; color: #4b3626; transition: background 0.15s; }
.ngd-map:hover { background: var(--brown-100, #efe5d5); }
.ngd-giaithich { margin: 8px 0 0; font-size: 0.78rem; color: var(--brown-700, #5a4636); line-height: 1.45; }
.ngd-note { margin: 10px 0 0; font-size: 0.74rem; color: var(--gray-500, #8a7c68); line-height: 1.45; }
</style>
