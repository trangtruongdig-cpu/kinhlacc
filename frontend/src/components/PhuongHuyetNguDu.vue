<script setup lang="ts">
// Mục nhỏ của Section IV — PHƯƠNG HUYỆT NGŨ DU (theo Ngũ Hành Hồi Tác).
// Nhận sao ngũ hành lệch (nguHanhZ) → tính cặp huyệt Bổ/Tả theo khung NHHT, tra HUYỆT THẬT từ DB
// (bảng huyet_vi) để lấy mã huyệt → link đồ hình 3D / Từ Điển. GỢI Ý — đối chiếu tứ chẩn trước khi châm.
import { ref, reactive, computed, onMounted } from 'vue'
import { api } from '@/services/api'
import { KINH_THEO_HANH, type HanhId } from '@/lib/nguDuHuyet'
import {
  phuongHuyetNHHT, autoKhung, gocMacDinh, KHUNG_TEN, KHUNG_MOTA, KHUNG_ALL,
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
const THRESH = 1 // |z| ≥ 1 mới coi là lệch rõ (khớp ngưỡng thực/hư của phapTri)

// Ghi đè khung / tạng gốc theo từng hành (mặc định: auto theo Bát Cương / tạng đứng trước)
const khungOv = reactive<Record<string, KhungLoai | undefined>>({})
const organOv = reactive<Record<string, string | undefined>>({})

function recOf(ci: HuyetChiDinh): HuyetViRow | undefined {
  return huyetMap.value.get(norm(ci.huyet))
}

const cards = computed(() => {
  const z = props.z
  if (!z) return []
  const sig = HANH_IDS
    .map((h) => ({ h, v: z[h] }))
    .filter((x): x is { h: HanhId; v: number } => x.v != null && Math.abs(x.v) >= THRESH)
    .sort((a, b) => Math.abs(b.v) - Math.abs(a.v))
    .slice(0, 3)
  return sig
    .map(({ h, v }) => {
      const thuc = v >= 0
      const organ = organOv[h] ?? gocMacDinh(h)
      const khung = khungOv[h] ?? autoKhung(props.huThuc)
      const ph = phuongHuyetNHHT(organ, thuc, khung)
      if (!ph) return null
      return { h, v, thuc, organ, khung, ph, taRec: recOf(ph.ta), boRec: recOf(ph.bo), organs: KINH_THEO_HANH[h] }
    })
    .filter((c): c is NonNullable<typeof c> => c != null)
})

const HANH_COLOR: Record<HanhId, string> = { moc: '#4f7d39', hoa: '#b23a29', tho: '#b3872c', kim: '#8a7a52', thuy: '#35638d' }
</script>

<template>
  <div class="ngd">
    <div class="ngd-head">
      <span class="ngd-title">Phương huyệt Ngũ Du <span class="ngd-sub">Ngũ Hành Hồi Tác</span></span>
    </div>
    <p class="ngd-intro">
      Theo <b>đối sánh kết quả đo</b> (không theo mô hình thể bệnh như trên): các tạng phủ đo ra
      <i>xộc xệch</i> hư/thực → cặp huyệt Ngũ Du bổ/tả để lập lại cân bằng. Bổ trợ cho phương huyệt theo thể bệnh.
    </p>

    <p v-if="!cards.length" class="ngd-empty">
      Ngũ hành tương đối cân — chưa thấy tạng lệch rõ (|z| ≥ 1) để lập phương huyệt.
    </p>

    <div v-else class="ngd-cards">
      <div v-for="c in cards" :key="c.h" class="ngd-card">
        <div class="ngd-card-head">
          <span class="ngd-goc" :style="{ '--hc': HANH_COLOR[c.h] }">
            Gốc <b>{{ c.ph.gocOrgan }}</b> · {{ c.ph.hanhETen }}
            <span class="ngd-tt" :class="c.thuc ? 'is-thuc' : 'is-hu'">{{ c.thuc ? 'THỰC' : 'HƯ' }}</span>
          </span>
          <label class="ngd-sel">Tạng gốc
            <select :value="c.organ" @change="organOv[c.h] = ($event.target as HTMLSelectElement).value">
              <option v-for="o in c.organs" :key="o" :value="o">{{ o }}</option>
            </select>
          </label>
          <label class="ngd-sel">Khung
            <select :value="c.khung" @change="khungOv[c.h] = ($event.target as HTMLSelectElement).value as KhungLoai"
              :title="KHUNG_MOTA[c.khung]">
              <option v-for="k in KHUNG_ALL" :key="k" :value="k">{{ KHUNG_TEN[k] }}</option>
            </select>
          </label>
        </div>

        <div class="ngd-khung-line">
          Khung <b>{{ c.ph.khung.ngoai }}</b> (ngoài) – <b>{{ c.ph.khung.trong }}</b> (trong)
          · <span class="ngd-khung-mota">{{ KHUNG_MOTA[c.khung] }}</span>
        </div>

        <div class="ngd-rows">
          <div class="ngd-row">
            <span class="ngd-badge ngd-badge--ta">TẢ</span>
            <span class="ngd-chip ngd-chip--ta">
              <b class="ngd-hy">{{ c.ph.ta.huyet }}</b>
              <span class="ngd-meta">{{ c.ph.ta.role }} · {{ c.ph.ta.hanhTen }} huyệt · {{ c.ph.ta.kinh }}</span>
            </span>
            <button v-if="c.taRec?.ma_huyet" type="button" class="ngd-map" title="Xem trên đồ hình 3D"
              @click="emit('goto-acu', c.taRec!.ma_huyet!)">🧭</button>
            <button v-else-if="c.taRec?.id_tu_dien" type="button" class="ngd-map" title="Tra ở Từ Điển"
              @click="emit('goto-dict', c.taRec!.id_tu_dien!)">📖</button>
          </div>
          <div class="ngd-row">
            <span class="ngd-badge ngd-badge--bo">BỔ</span>
            <span class="ngd-chip ngd-chip--bo">
              <b class="ngd-hy">{{ c.ph.bo.huyet }}</b>
              <span class="ngd-meta">{{ c.ph.bo.role }} · {{ c.ph.bo.hanhTen }} huyệt · {{ c.ph.bo.kinh }}</span>
            </span>
            <button v-if="c.boRec?.ma_huyet" type="button" class="ngd-map" title="Xem trên đồ hình 3D"
              @click="emit('goto-acu', c.boRec!.ma_huyet!)">🧭</button>
            <button v-else-if="c.boRec?.id_tu_dien" type="button" class="ngd-map" title="Tra ở Từ Điển"
              @click="emit('goto-dict', c.boRec!.id_tu_dien!)">📖</button>
          </div>
        </div>

        <p class="ngd-giaithich">{{ c.ph.giaiThich }}</p>
      </div>
    </div>

    <p class="ngd-note">
      ⚠ Gợi ý theo Ngũ Hành Hồi Tác — kèm <b>ôn/thanh</b> theo Hàn-Nhiệt (Bát Cương) &amp; thủ pháp bổ/tả;
      đối chiếu tứ chẩn trước khi châm.
    </p>
  </div>
</template>

<style scoped>
.ngd { margin-top: 14px; border-top: 1px dashed var(--brown-200, #e0d3bf); padding-top: 12px; }
.ngd-head { display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px; }
.ngd-title { font-weight: 800; color: var(--brown-800, #4b3626); font-size: 0.98rem; }
.ngd-sub { font-weight: 600; color: var(--gray-500, #8a7c68); font-size: 0.78rem; }
.ngd-intro { font-size: 0.79rem; color: var(--gray-600, #6f5f47); line-height: 1.5; margin: 0 0 10px; }
.ngd-empty { color: var(--gray-500, #8a7c68); font-size: 0.86rem; margin: 4px 0; }
.ngd-cards { display: flex; flex-direction: column; gap: 10px; }
.ngd-card { border: 1px solid var(--brown-200, #e5d9c6); border-radius: 10px; padding: 10px 12px; background: var(--cream-50, #faf6ee); }
.ngd-card-head { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-bottom: 6px; }
.ngd-goc { font-size: 0.9rem; color: var(--brown-800, #4b3626); border-left: 3px solid var(--hc); padding-left: 7px; }
.ngd-goc b { color: var(--hc); }
.ngd-tt { font-size: 0.7rem; font-weight: 800; padding: 1px 6px; border-radius: 999px; margin-left: 4px; }
.ngd-tt.is-thuc { background: #f4dcd6; color: #b23a29; }
.ngd-tt.is-hu { background: #d8e4ef; color: #35638d; }
.ngd-sel { font-size: 0.74rem; color: var(--gray-500, #8a7c68); display: inline-flex; align-items: center; gap: 4px; }
.ngd-sel select { font-size: 0.78rem; padding: 2px 4px; border: 1px solid var(--brown-200, #d9c9b0); border-radius: 6px; background: #fff; color: var(--brown-800, #4b3626); }
.ngd-khung-line { font-size: 0.8rem; color: var(--gray-600, #6f5f47); margin-bottom: 8px; }
.ngd-khung-mota { font-style: italic; }
.ngd-rows { display: flex; flex-direction: column; gap: 6px; }
.ngd-row { display: flex; align-items: center; gap: 8px; }
.ngd-badge { font-size: 0.68rem; font-weight: 800; width: 30px; text-align: center; padding: 2px 0; border-radius: 5px; flex: 0 0 auto; }
.ngd-badge--ta { background: #f4dcd6; color: #b23a29; }
.ngd-badge--bo { background: #dcecd4; color: #3f6a2c; }
.ngd-chip { display: inline-flex; align-items: baseline; gap: 7px; padding: 3px 10px; border-radius: 999px; border: 1px solid; }
.ngd-chip--ta { border-color: #e2b6ac; background: #fbf1ee; }
.ngd-chip--bo { border-color: #b9d3a8; background: #f2f7ec; }
.ngd-hy { font-size: 0.9rem; color: var(--brown-800, #3f2f1e); }
.ngd-meta { font-size: 0.72rem; color: var(--gray-500, #8a7c68); }
.ngd-map { border: none; background: transparent; cursor: pointer; font-size: 0.95rem; line-height: 1; padding: 2px; border-radius: 6px; }
.ngd-map:hover { background: var(--brown-100, #efe5d5); }
.ngd-giaithich { margin: 8px 0 0; font-size: 0.8rem; color: var(--brown-700, #5a4636); line-height: 1.5; }
.ngd-note { margin: 10px 0 0; font-size: 0.74rem; color: var(--gray-500, #8a7c68); line-height: 1.45; }
</style>
