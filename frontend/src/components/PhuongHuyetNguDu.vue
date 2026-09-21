<script setup lang="ts">
// Mục nhỏ của Section IV — PHƯƠNG HUYỆT NGŨ DU (theo Ngũ Hành Hồi Tác & Bổ Mẫu Tả Tử Nạn Kinh 69).
// Kết nối trực tiếp và tự động đối sánh từ kết quả đo 12 đường kinh thực tế của ca bệnh.
//
// ĐỐI CHIẾU, KHÔNG TỰ LUẬN: phương huyệt lấy từ KHO CÔNG THỨC `nhht_cong_thuc` (GET /nhht/cong-thuc)
// — cùng bộ mà trang Bệnh Đo Kinh Lạc → Phương Huyệt hiển thị và thầy thuốc sửa được. Mỗi thẻ ghi rõ
// mã công thức đã dùng, nên về sau luôn truy được "ca này chữa theo công thức nào".
// Engine lib (khungNHHT) chỉ còn là LƯỚI ĐỠ khi chưa tải được kho — lúc đó thẻ tự báo "tính tại chỗ".
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '@/services/api'
import { KINH_THEO_HANH, KINH, hanhCuaKinh, type HanhId } from '@/lib/nguDuHuyet'
import {
  phuongHuyetNHHT, phuongHuyetBoMauTaCon, autoKhung, KHUNG_TEN, KHUNG_MOTA, KHUNG_ALL,
  type KhungLoai, type HuyetChiDinh,
} from '@/lib/khungNHHT'
import { dinhGoc, chamHoiTac, QUAN_HE_TEN } from '@/lib/nguHanhHoiTac'

const props = defineProps<{
  z: { hoa: number | null; tho: number | null; kim: number | null; thuy: number | null; moc: number | null } | null
  huThuc?: string
  /** Bát Cương vị trí ('Biểu' | 'Lý' | 'Biểu Lý') — định gốc dùng để chọn phủ hay tạng. */
  viTri?: string
  /** z ngũ hành của lần đo LIỀN TRƯỚC — để chấm hồi tác (phương châm lần đó có đáp ứng không). */
  zTruoc?: { hoa: number | null; tho: number | null; kim: number | null; thuy: number | null; moc: number | null } | null
  /** Kinh đo lệch của lần trước — để chấm gốc lần đó bằng kinh thật. */
  lechTruoc?: Array<{ name: string; tone: 'high' | 'low' }> | null
  ngayTruoc?: string
  soNgayTruoc?: number | null
  /** Lần trước thuộc ĐỢT KHÁC (cách quá ngưỡng) — khi đó không chấm phương châm, chỉ đối chiếu. */
  khacDot?: boolean
  lechRows?: Array<{ name: string; tone: 'high' | 'low' }>
  matchedBenhIds?: number[]
  /** Bỏ ô đổi khung tính (chỉ hợp khi thầy thuốc đang chỉnh cho bệnh nhân thật) — dùng cho trang
   *  demo công khai, chỉ xem không thao tác. Mặc định false để không đổi hành vi app hiện có. */
  readonly?: boolean
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

// ── KHO CÔNG THỨC NHHT (nguồn sự thật, sửa được trên app) ─────────────────
interface CongThucKho {
  ma: string; kinh: string; hanh: string; trang_thai: string; khung: string; khung_ten: string
  kinh_ban: string | null; chi_dao: string | null
  menh_lenh: Array<{ bac: string; tacDong: string; hanh: string; kinh: string; huyet: string | null; vaiTro: string | null; phap: string }> | null
  huyet_ngu_du: { bo: HuyetChiDinh; ta: HuyetChiDinh; giaiThich: string } | null
  huyet_nan_kinh: (HuyetChiDinh & { giaiThich: string }) | null
  huyet_nguyen_lac: { chuKinh: string; nguyen: { ten: string; ma: string }; khachKinh: string; lac: { ten: string; ma: string }; giaiThich: string } | null
  sua_tay: boolean; ghi_chu: string | null
}
const khoCongThuc = ref<CongThucKho[]>([])
/** khoá tra: kinh|trạng thái|khung */
const khoIndex = computed(() => {
  const m = new Map<string, CongThucKho>()
  for (const c of khoCongThuc.value) m.set(`${c.kinh}|${c.trang_thai}|${c.khung}`, c)
  return m
})
function traKho(organ: string, thuc: boolean, khung: KhungLoai): CongThucKho | null {
  return khoIndex.value.get(`${organ}|${thuc ? 'thực' : 'hư'}|${khung}`) ?? null
}

onMounted(async () => {
  const [huyet, kho] = await Promise.allSettled([
    api.get<HuyetViRow[] | { data?: HuyetViRow[] }>('/huyet-vi'),
    api.get<CongThucKho[]>('/nhht/cong-thuc'),
  ])
  huyetList.value =
    huyet.status === 'fulfilled' ? (Array.isArray(huyet.value) ? huyet.value : (huyet.value?.data ?? [])) : []
  khoCongThuc.value = kho.status === 'fulfilled' && Array.isArray(kho.value) ? kho.value : []
})

// Ánh xạ tên ngắn kinh mạch trong lechRows sang tên tạng phủ đầy đủ
const SHORT_TO_ORGAN: Record<string, string> = {
  'Tiểu': 'Tiểu trường',
  'Tâm': 'Tâm',
  'Tam': 'Tam tiêu',
  'Bào': 'Tâm bào',
  'Đại': 'Đại trường',
  'Phế': 'Phế',
  'Bàng': 'Bàng quang',
  'Thận': 'Thận',
  'Đởm': 'Đởm',
  'Vị': 'Vị',
  'Can': 'Can',
  'Tỳ': 'Tỳ',
}

interface OrganStatus {
  organ: string
  hanh: HanhId
  thuc: boolean
  isDamaged: boolean
}

// Tính toán chính xác trạng thái của từng đường kinh từ BÁT CƯƠNG HƯ-THỰC ĐO ĐẠC THỰC TẾ
const organStatuses = computed<OrganStatus[]>(() => {
  const lechMap = new Map<string, 'high' | 'low'>()
  if (props.lechRows && props.lechRows.length > 0) {
    for (const r of props.lechRows) {
      const fullOrgan = SHORT_TO_ORGAN[r.name] || r.name
      lechMap.set(fullOrgan, r.tone)
    }
  }

  const out: OrganStatus[] = []
  for (const organ of Object.keys(KINH)) {
    const hanh = hanhCuaKinh(organ) || 'tho'
    const tone = lechMap.get(organ)
    if (tone) {
      out.push({ organ, hanh, thuc: tone === 'high', isDamaged: true })
    } else {
      out.push({ organ, hanh, thuc: false, isDamaged: false })
    }
  }

  return out.sort((a, b) => (b.isDamaged ? 1 : 0) - (a.isDamaged ? 1 : 0))
})

// ── TẦNG B — ĐỊNH GỐC: kinh nào KHỞI bệnh, kinh nào chỉ lan theo ngũ hành ──────
// Không phải kinh nào đo lệch cũng đáng trị: Mộc thực đè Thổ thì Thổ cũng lệch, trị Thổ là trị
// ngọn. Hàm dinhGoc chấm theo cạnh bệnh lý nặng nhất, rồi chọn kinh trong hành đó theo Biểu–Lý.
const dinhGocCa = computed(() => {
  const kinhLech = organStatuses.value
    .filter((o) => o.isDamaged)
    .map((o) => ({ kinh: o.organ, thuc: o.thuc }))
  if (!props.z || !kinhLech.length) return null
  return dinhGoc({ z: props.z, kinhLech, viTri: props.viTri })
})

// HỒI TÁC: gốc lần trước chấm lại trên chính z của lần trước, rồi so với lần này.
const hoiTac = computed(() => {
  if (!props.zTruoc || !props.z) return null
  const kinhLechTruoc = (props.lechTruoc ?? []).map((r) => ({
    kinh: SHORT_TO_ORGAN[r.name] || r.name,
    thuc: r.tone === 'high',
  }))
  const gocTruoc = dinhGoc({ z: props.zTruoc, kinhLech: kinhLechTruoc, viTri: props.viTri })
  return chamHoiTac(props.zTruoc, props.z, gocTruoc.hanhGoc, dinhGocCa.value?.hanhGoc ?? null, !!props.khacDot)
})
const HOI_TAC_TEN: Record<string, string> = {
  'chuyen-tot': 'CÓ ĐÁP ỨNG', 'chua-chuyen': 'CHƯA CHUYỂN', 'nang-them': 'LỆCH THÊM', 'khong-du-cu': 'CHƯA ĐỦ CĂN CỨ',
}

/** Chính khí tổng KHUYẾT → mọi mệnh lệnh TẢ phải hoãn (z chỉ là số tương đối trong nội bộ phiếu). */
const chinhKhiKhuyet = computed(() => /hư/i.test(props.huThuc || ''))

// Các tạng phủ tổn thương thực tế được chọn mặc định
const selectedOrgans = ref<Set<string>>(new Set())

const initSelected = () => {
  const damaged = organStatuses.value.filter(o => o.isDamaged).map(o => o.organ)
  if (damaged.length) {
    selectedOrgans.value = new Set(damaged)
  } else {
    selectedOrgans.value = new Set(['Phế', 'Tỳ'])
  }
}

watch(() => props.lechRows, () => {
  initSelected()
}, { immediate: true, deep: true })

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

// Tính các Card Phương huyệt Ngũ Hành Hồi Tác
const nhhtCards = computed(() => {
  const out = []
  for (const organ of selectedOrgans.value) {
    const st = organStatuses.value.find(s => s.organ === organ)
    if (!st) continue
    const khung = khungOv[organ] ?? autoKhung(props.huThuc)
    const ct = traKho(organ, st.thuc, khung)
    // Từ kho: dựng lại đúng hình dạng `ph` mà thẻ đang dùng. Từ engine: chỉ khi kho chưa về.
    const ph = ct?.huyet_ngu_du
      ? {
          ...phuongHuyetNHHT(organ, st.thuc, khung)!,
          ta: ct.huyet_ngu_du.ta,
          bo: ct.huyet_ngu_du.bo,
          giaiThich: ct.huyet_ngu_du.giaiThich,
        }
      : phuongHuyetNHHT(organ, st.thuc, khung)
    if (!ph) continue
    out.push({
      organ,
      hanh: st.hanh,
      thuc: st.thuc,
      isDamaged: st.isDamaged,
      khung,
      ph,
      ct,
      maCongThuc: ct?.ma ?? null,
      tuKho: !!ct,
      laGoc: dinhGocCa.value?.kinhGoc === organ,
      keoTheo: dinhGocCa.value?.keoTheo.find((k) => k.kinh === organ)?.vi ?? null,
      taRec: recOf(ph.ta),
      boRec: recOf(ph.bo)
    })
  }
  // Kinh GỐC đứng đầu — thầy thuốc nhìn thấy chỗ cần trị trước, không phải cuộn tìm.
  return out.sort((a, b) => (b.laGoc ? 1 : 0) - (a.laGoc ? 1 : 0))
})

// Tính các Card Bổ Mẫu Tả Con
const bmCards = computed(() => {
  const out = []
  for (const organ of selectedOrgans.value) {
    const st = organStatuses.value.find(s => s.organ === organ)
    if (!st) continue
    // Nạn Kinh 69 không phụ thuộc khung, nhưng vẫn nằm trong cùng công thức của kho.
    const ct = traKho(organ, st.thuc, khungOv[organ] ?? autoKhung(props.huThuc))
    const goc = phuongHuyetBoMauTaCon(organ, st.thuc)
    const bm = ct?.huyet_nan_kinh && goc
      ? { ...goc, targetHuyet: ct.huyet_nan_kinh, giaiThich: ct.huyet_nan_kinh.giaiThich }
      : goc
    if (!bm) continue
    out.push({
      organ,
      hanh: st.hanh,
      thuc: st.thuc,
      isDamaged: st.isDamaged,
      bm,
      ct,
      maCongThuc: ct?.ma ?? null,
      tuKho: !!ct,
      rec: recOf(bm.targetHuyet)
    })
  }
  return out
})

const HANH_COLOR: Record<HanhId, string> = { moc: '#4f7d39', hoa: '#b23a29', tho: '#b3872c', kim: '#8a7a52', thuy: '#35638d' }

// CHỈ ĐỊNH gộp: Dồn các Tạng Phủ chọn thành 2 nhóm TẢ / BỔ
interface RxItem { huyet: string; kinh: string; hanhTen: string; role: string; rec?: HuyetViRow; targetOrgan: string; phuongPhap: 'Tả' | 'Bổ'; relationTag?: string }
const rx = computed(() => {
  const ta = new Map<string, RxItem>(), bo = new Map<string, RxItem>()
  const add = (m: Map<string, RxItem>, ci: HuyetChiDinh, targetOrgan: string, phuongPhap: 'Tả' | 'Bổ', rec?: HuyetViRow, relationTag?: string) => {
    const key = `${ci.huyet}_${ci.kinh}`
    if (!m.has(key)) m.set(key, { huyet: ci.huyet, kinh: ci.kinh, hanhTen: ci.hanhTen, role: ci.role, rec, targetOrgan, phuongPhap, relationTag })
  }
  if (activeMode.value === 'nhht') {
    for (const c of nhhtCards.value) {
      add(ta, c.ph.ta, c.organ, 'Tả', c.taRec)
      add(bo, c.ph.bo, c.organ, 'Bổ', c.boRec)
    }
  } else {
    for (const c of bmCards.value) {
      const relName = c.bm.thuc ? `Tả Tử` : `Bổ Mẫu`
      if (c.bm.targetHuyet.boTa === 'ta') add(ta, c.bm.targetHuyet, c.organ, 'Tả', c.rec, relName)
      else add(bo, c.bm.targetHuyet, c.organ, 'Bổ', c.rec, relName)
    }
  }
  return { ta: [...ta.values()], bo: [...bo.values()] }
})

function getPrintPayload(mode: 'nhht' | 'bomautacon') {
  const isNHHT = mode === 'nhht'
  const title = isNHHT
    ? 'PHÁC ĐỒ PHƯƠNG HUYỆT NGŨ DU — NGŨ HÀNH HỒI TÁC'
    : 'PHÁC ĐỒ PHƯƠNG HUYỆT NGŨ DU — BỔ "MẪU" TẢ "TỬ" (NẠN KINH 69)'

  const taList: Array<{ code: string; name: string; note: string; ct: string | null }> = []
  const boList: Array<{ code: string; name: string; note: string; ct: string | null }> = []

  if (isNHHT) {
    for (const c of nhhtCards.value) {
      if (c.ph.ta) {
        taList.push({
          code: c.taRec?.ma_huyet || c.ph.ta.huyet,
          name: c.ph.ta.huyet,
          note: `${c.ph.ta.role} · ${c.ph.ta.hanhTen} · Kinh ${c.ph.ta.kinh} (Tả Hồi Tác ← ${c.organ} Thực)`,
          ct: c.maCongThuc,
        })
      }
      if (c.ph.bo) {
        boList.push({
          code: c.boRec?.ma_huyet || c.ph.bo.huyet,
          name: c.ph.bo.huyet,
          note: `${c.ph.bo.role} · ${c.ph.bo.hanhTen} · Kinh ${c.ph.bo.kinh} (Bổ Hồi Tác ← ${c.organ} Hư)`,
          ct: c.maCongThuc,
        })
      }
    }
  } else {
    for (const c of bmCards.value) {
      const relName = c.bm.thuc ? 'Tả Tử' : 'Bổ Mẫu'
      const item = {
        code: c.rec?.ma_huyet || c.bm.targetHuyet.huyet,
        name: c.bm.targetHuyet.huyet,
        note: `${c.bm.targetHuyet.role} · ${c.bm.targetHuyet.hanhTen} · Kinh ${c.bm.targetHuyet.kinh} (${relName} ← ${c.organ} ${c.bm.thuc ? 'Thực' : 'Hư'})`,
        ct: c.maCongThuc,
      }
      if (c.bm.targetHuyet.boTa === 'ta') taList.push(item)
      else boList.push(item)
    }
  }

  const allCodes = [...new Set([...taList, ...boList].map(i => i.code).filter(Boolean))]

  const payload = {
    patientName: '',
    examDate: '',
    theBenh: title,
    groups: [
      {
        method: isNHHT ? 'CHÂM TẢ (Tiết Thực / Hạ Hỏa — Ngũ Hành Hồi Tác)' : 'CHÂM TẢ (Tả Tử — Khi Tạng Phủ THỰC Nạn Kinh 69)',
        items: taList.map(i => ({
          code: i.code,
          name: i.name,
          note: i.note,
          yNghia: i.ct
            ? `${isNHHT ? 'Ngũ Hành Hồi Tác' : 'Nạn Kinh 69'} · công thức ${i.ct}`
            : (isNHHT ? 'Thuật toán Ngũ Hành Hồi Tác (tính tại chỗ)' : 'Thuật toán Nạn Kinh 69 (tính tại chỗ)'),
          source: 'Bát Cương 12 Kinh',
        })),
      },
      {
        method: isNHHT ? 'CHÂM BỔ / CỨU (Phù Chính / Ích Khí — Ngũ Hành Hồi Tác)' : 'CHÂM BỔ (Bổ Mẫu — Khi Tạng Phủ HƯ Nạn Kinh 69)',
        items: boList.map(i => ({
          code: i.code,
          name: i.name,
          note: i.note,
          yNghia: i.ct
            ? `${isNHHT ? 'Ngũ Hành Hồi Tác' : 'Nạn Kinh 69'} · công thức ${i.ct}`
            : (isNHHT ? 'Thuật toán Ngũ Hành Hồi Tác (tính tại chỗ)' : 'Thuật toán Nạn Kinh 69 (tính tại chỗ)'),
          source: 'Bát Cương 12 Kinh',
        })),
      },
    ],
  }

  return { payload, allCodes, title }
}

defineExpose({
  getPrintPayload,
})
</script>

<template>
  <div class="ngd">
    <div class="ngd-head">
      <div class="ngd-head-titles">
        <span class="ngd-title">Phương Huyệt Ngũ Du</span>
        <span class="ngd-sub">Tác động Tạng Phủ tổn thương theo Ngũ Hành Hồi Tác &amp; Nạn Kinh 69</span>
      </div>
      <div class="ngd-mode-tabs">
        <button
          type="button"
          class="ngd-mode-btn"
          :class="{ 'is-active': activeMode === 'nhht' }"
          @click="activeMode = 'nhht'"
        >
          Ngũ Hành Hồi Tác
        </button>
        <button
          type="button"
          class="ngd-mode-btn"
          :class="{ 'is-active': activeMode === 'bomautacon' }"
          @click="activeMode = 'bomautacon'"
        >
          Bổ "Mẫu" Tả "Tử"
        </button>
      </div>
    </div>

    <!-- THANH KẾT NỐI TẠNG PHỦ TỔN THƯƠNG CHÍNH XÁC TỪ BÁT CƯƠNG HƯ-THỰC DO ĐẠC -->
    <div class="ngd-organ-selector-box">
      <div class="ngd-selector-label">
        <b>ĐƯỜNG KINH / TẠNG PHỦ TỔN THƯƠNG DO ĐẠC:</b>
        <span class="ngd-selector-hint">(Tự động khớp từ 12 đường kinh bị Hư/Thực trong Bát Cương)</span>
      </div>
      <div class="ngd-organ-chips">
        <button
          v-for="st in organStatuses"
          :key="st.organ"
          type="button"
          class="ngd-organ-chip"
          :class="{
            'is-selected': selectedOrgans.has(st.organ),
            'is-damaged': st.isDamaged,
            'is-thuc': st.isDamaged && st.thuc,
            'is-hu': st.isDamaged && !st.thuc,
            'is-normal': !st.isDamaged
          }"
          @click="toggleOrgan(st.organ)"
        >
          <span class="ngd-oc-check">{{ selectedOrgans.has(st.organ) ? '✓' : '+' }}</span>
          <b class="ngd-oc-name">{{ st.organ }}</b>
          <span class="ngd-oc-tag">{{ st.isDamaged ? (st.thuc ? 'Thực' : 'Hư') : 'Bình' }}</span>
        </button>
      </div>
    </div>

    <!-- KHỐI TỔNG HỢP CHỈ ĐỊNH PHƯƠNG HUYỆT CA BỆNH (HIỂN THỊ TỰ ĐỘNG THEO MÔ HÌNH CHUẨN) -->
    <div v-if="rx.ta.length || rx.bo.length" class="ngd-prescription-box">
      <div class="ngd-rx-header">
        <div class="ngd-rx-title-group">
          <b>CHỈ ĐỊNH PHƯƠNG HUYỆT CA BỆNH</b>
          <span class="ngd-rx-sub">
            ({{ activeMode === 'bomautacon' ? 'Nạn Kinh 69' : 'Ngũ Hành Hồi Tác' }})
          </span>
        </div>
      </div>

      <div class="ngd-rx-body">
        <!-- NHÓM TẢ / TẢ TỬ -->
        <div v-if="rx.ta.length" class="ngd-rx-group">
          <span class="ngd-rx-tag ngd-rx-tag--ta">
            {{ activeMode === 'bomautacon' ? 'CHÂM TẢ (Tả Tử — Thực)' : 'CHÂM TẢ (Tiết Thực)' }}
          </span>
          <div class="ngd-rx-chips">
            <div v-for="item in rx.ta" :key="item.huyet + item.kinh" class="ngd-rx-chip ngd-rx-chip--ta">
              <span class="ngd-rx-name">{{ item.huyet }}</span>
              <span class="ngd-rx-detail">
                ({{ item.role }} · {{ item.hanhTen }} · {{ item.kinh }}
                <b v-if="item.relationTag" style="color: #a82e1e; font-weight: 700;">· {{ item.relationTag }}</b>
                <small>← trị {{ item.targetOrgan }}</small>)
              </span>
              <button v-if="item.rec?.ma_huyet" type="button" class="ngd-map" title="Xem trên đồ hình 3D"
                @click="emit('goto-acu', item.rec!.ma_huyet!)">[3D]</button>
              <button v-else-if="item.rec?.id_tu_dien" type="button" class="ngd-map" title="Tra ở Từ Điển"
                @click="emit('goto-dict', item.rec!.id_tu_dien!)">[Từ điển]</button>
            </div>
          </div>
        </div>

        <!-- NHÓM BỔ / BỔ MẪU -->
        <div v-if="rx.bo.length" class="ngd-rx-group">
          <span class="ngd-rx-tag ngd-rx-tag--bo">
            {{ activeMode === 'bomautacon' ? 'CHÂM BỔ (Bổ Mẫu — Hư)' : 'CHÂM BỔ / CỨU (Phù Chính)' }}
          </span>
          <div class="ngd-rx-chips">
            <div v-for="item in rx.bo" :key="item.huyet + item.kinh" class="ngd-rx-chip ngd-rx-chip--bo">
              <span class="ngd-rx-name">{{ item.huyet }}</span>
              <span class="ngd-rx-detail">
                ({{ item.role }} · {{ item.hanhTen }} · {{ item.kinh }}
                <b v-if="item.relationTag" style="color: #2e5c1e; font-weight: 700;">· {{ item.relationTag }}</b>
                <small>← trị {{ item.targetOrgan }}</small>)
              </span>
              <button v-if="item.rec?.ma_huyet" type="button" class="ngd-map" title="Xem trên đồ hình 3D"
                @click="emit('goto-acu', item.rec!.ma_huyet!)">[3D]</button>
              <button v-else-if="item.rec?.id_tu_dien" type="button" class="ngd-map" title="Tra ở Từ Điển"
                @click="emit('goto-dict', item.rec!.id_tu_dien!)">[Từ điển]</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Ở ĐÂY CHỈ GIỮ THỨ THUỘC VỀ CA BỆNH. Lý luận định gốc (quan hệ tương thừa/tương vũ, vì sao
         chọn kinh này) đã nằm ở tab Bệnh Đo Kinh Lạc → Phương Huyệt dưới dạng công thức — bày lại
         ở trang Kết Quả Đo chỉ làm thầy thuốc phải cuộn qua một lần nữa. -->
    <div v-if="hoiTac || chinhKhiKhuyet" class="ngd-dai">
      <span v-if="hoiTac" class="ngd-dai-muc" :class="`is-${khacDot ? 'khong-du-cu' : hoiTac.muc}`">
        <b>{{ khacDot ? 'Đối chiếu khác đợt' : HOI_TAC_TEN[hoiTac.muc] }}</b>
        <template v-if="ngayTruoc"> so với {{ ngayTruoc }}</template>
        <template v-if="soNgayTruoc"> · {{ soNgayTruoc }} ngày</template>
        — {{ hoiTac.nhan }}
      </span>
      <span v-if="chinhKhiKhuyet" class="ngd-dai-canh">
        ⚠ Bát Cương toàn thân HƯ — hoãn mọi mệnh lệnh TẢ, lấy phù chính làm gốc.
      </span>
    </div>


    <!-- NẾU CHƯA CHỌN TẠNG PHỦ NÀO -->
    <p v-if="!selectedOrgans.size" class="ngd-empty">
      Chưa chọn tạng phủ tổn thương nào. Nhấp vào các thẻ kinh/tạng phủ ở trên để tạo phác đồ châm cứu.
    </p>

    <!-- CHI TIẾT THEO TỪNG TẠNG PHỦ (GỌN GÀNG, THU GỌN / MỞ RỘNG) -->
    <div v-else-if="activeMode === 'nhht'" class="ngd-cards">
      <div v-for="c in nhhtCards" :key="c.organ" class="ngd-card">
        <!-- HEADER THẺ: GỌN GÀNG 1 DÒNG MẶC ĐỊNH -->
        <div class="ngd-card-compact-head">
          <div class="ngd-card-summary-left">
            <span class="ngd-goc" :style="{ '--hc': HANH_COLOR[c.hanh] }">
              <b>{{ c.organ }}</b> ({{ c.ph.hanhETen }})
              <span class="ngd-tt" :class="c.thuc ? 'is-thuc' : 'is-hu'">{{ c.thuc ? 'THỰC' : 'HƯ' }}</span>
            </span>
            <span v-if="c.laGoc" class="ngd-vai ngd-vai--goc" title="Kinh khởi bệnh — trị trước">GỐC</span>
            <span v-else-if="c.keoTheo" class="ngd-vai ngd-vai--keo" :title="c.keoTheo">lan theo</span>
            <span class="ngd-khung-tag">Khung {{ KHUNG_TEN[c.khung] }}</span>
            <RouterLink v-if="c.maCongThuc" class="ngd-ct-tag ngd-ct-tag--link"
              :to="{ name: 'meridian-diseases', query: { tab: 'phac-do', ct: c.maCongThuc } }"
              title="Mở công thức đầy đủ (phương châm · 3 mệnh lệnh · Nguyên–Lạc · pháp ngũ hành)">
              #{{ c.maCongThuc }}<span v-if="c.ct?.sua_tay" class="ngd-ct-sua">đã chỉnh</span>
            </RouterLink>
            <span v-else class="ngd-ct-tag ngd-ct-tag--local" title="Chưa tải được kho công thức — số liệu do máy tính tại chỗ">tính tại chỗ</span>
          </div>

          <div class="ngd-card-quick-huyet">
            <span class="ngd-qh ngd-qh--ta">
              Tả: <b>{{ c.ph.ta.huyet }}</b>
              <button v-if="c.taRec?.ma_huyet" type="button" class="ngd-map" title="Xem trên đồ hình 3D"
                @click="emit('goto-acu', c.taRec!.ma_huyet!)">3D</button>
              <button v-else-if="c.taRec?.id_tu_dien" type="button" class="ngd-map" title="Tra ở Từ Điển"
                @click="emit('goto-dict', c.taRec!.id_tu_dien!)">Từ điển</button>
            </span>
            <span class="ngd-qh ngd-qh--bo">
              Bổ: <b>{{ c.ph.bo.huyet }}</b>
              <button v-if="c.boRec?.ma_huyet" type="button" class="ngd-map" title="Xem trên đồ hình 3D"
                @click="emit('goto-acu', c.boRec!.ma_huyet!)">3D</button>
              <button v-else-if="c.boRec?.id_tu_dien" type="button" class="ngd-map" title="Tra ở Từ Điển"
                @click="emit('goto-dict', c.boRec!.id_tu_dien!)">Từ điển</button>
            </span>
          </div>

          <label class="ngd-sel ngd-sel--inline">Khung:
            <select v-if="!props.readonly" :value="c.khung" :title="KHUNG_MOTA[c.khung]"
              @change="khungOv[c.organ] = ($event.target as HTMLSelectElement).value as KhungLoai">
              <option v-for="k in KHUNG_ALL" :key="k" :value="k">{{ KHUNG_TEN[k] }}</option>
            </select>
            <span v-else class="ngd-khung-ro" :title="KHUNG_MOTA[c.khung]">{{ KHUNG_TEN[c.khung] }}</span>
          </label>
        </div>
      </div>
    </div>

    <!-- CHI TIẾT BỔ MẪU TẢ TỬ (NẠN KINH 69) THU GỌN / MỞ RỘNG -->
    <div v-else-if="activeMode === 'bomautacon'" class="ngd-cards">
      <div v-for="c in bmCards" :key="c.organ" class="ngd-card">
        <div class="ngd-card-compact-head">
          <div class="ngd-card-summary-left">
            <span class="ngd-goc" :style="{ '--hc': HANH_COLOR[c.hanh] }">
              <b>{{ c.organ }}</b> ({{ c.bm.hanhETen }})
              <span class="ngd-tt" :class="c.thuc ? 'is-thuc' : 'is-hu'">{{ c.thuc ? 'THỰC' : 'HƯ' }}</span>
            </span>
            <RouterLink v-if="c.maCongThuc" class="ngd-ct-tag ngd-ct-tag--link"
              :to="{ name: 'meridian-diseases', query: { tab: 'phac-do', ct: c.maCongThuc } }"
              title="Mở công thức đầy đủ trong trang Phương Huyệt">
              #{{ c.maCongThuc }}<span v-if="c.ct?.sua_tay" class="ngd-ct-sua">đã chỉnh</span>
            </RouterLink>
            <span v-else class="ngd-ct-tag ngd-ct-tag--local" title="Chưa tải được kho công thức — số liệu do máy tính tại chỗ">tính tại chỗ</span>
          </div>

          <div class="ngd-card-quick-huyet">
            <span class="ngd-qh" :class="c.thuc ? 'ngd-qh--ta' : 'ngd-qh--bo'">
              {{ c.thuc ? 'Tả Tử:' : 'Bổ Mẫu:' }} <b>{{ c.bm.targetHuyet.huyet }}</b>
            </span>
          </div>

          <span v-if="c.maCongThuc" class="ngd-meta ngd-meta--nk">{{ c.bm.targetHuyet.role }} · {{ c.bm.targetHuyet.hanhTen }} huyệt · kinh {{ c.bm.targetHuyet.kinh }}</span>
          <button v-if="c.rec?.ma_huyet" type="button" class="ngd-map" title="Xem trên đồ hình 3D"
            @click="emit('goto-acu', c.rec!.ma_huyet!)">3D</button>
          <button v-else-if="c.rec?.id_tu_dien" type="button" class="ngd-map" title="Tra ở Từ Điển"
            @click="emit('goto-dict', c.rec!.id_tu_dien!)">Từ điển</button>
        </div>
      </div>
    </div>

    <p class="ngd-note">
      Gợi ý lâm sàng: Ngũ Hành Hồi Tác &amp; Nạn Kinh 69 — kèm thủ pháp bổ/tả &amp; nhiệt/hàn Bát Cương; đối chiếu Tứ Chẩn trước khi lập phác đồ.
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
.ngd-organ-chip.is-normal { opacity: 0.6; }
.ngd-organ-chip.is-normal .ngd-oc-tag { background: #eee; color: #777; }

.ngd-prescription-box { background: #fdfaf5; border: 1.5px solid var(--brown-300, #d4c3aa); border-radius: 10px; padding: 12px 14px; margin-bottom: 14px; box-shadow: 0 2px 6px rgba(0,0,0,0.03); }
.ngd-rx-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid #ebd9c3; padding-bottom: 6px; flex-wrap: wrap; gap: 8px; }
.ngd-rx-title-group { font-size: 0.88rem; color: var(--brown-900, #3a2618); }
.ngd-rx-sub { font-size: 0.75rem; font-weight: normal; color: var(--gray-500, #8a7c68); margin-left: 6px; }

.ngd-rx-body { display: flex; flex-direction: column; gap: 10px; }
.ngd-rx-group { display: flex; flex-direction: column; gap: 6px; }
.ngd-rx-tag { font-size: 0.74rem; font-weight: 800; padding: 2px 8px; border-radius: 4px; display: inline-block; width: fit-content; }
.ngd-rx-tag--ta { background: #fce8e4; color: #a82e1e; }
.ngd-rx-tag--bo { background: #e4f3de; color: #2e5c1e; }

.ngd-rx-chips { display: flex; flex-wrap: wrap; gap: 5px 8px; }
.ngd-rx-chip { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 6px; font-size: 0.78rem; border: 1px solid; }
.ngd-rx-chip--ta { background: #fff8f7; border-color: #f3c2b8; }
.ngd-rx-chip--bo { background: #f7fcf5; border-color: #c7e5bb; }
.ngd-rx-name { font-weight: 800; color: #2c1d11; white-space: nowrap; }
.ngd-rx-detail { font-size: 0.72rem; color: #6e5e49; white-space: nowrap; }
.ngd-rx-detail small { color: #8a6d48; font-weight: 600; }

.ngd-empty { color: var(--gray-500, #8a7c68); font-size: 0.86rem; margin: 8px 0; font-style: italic; }
.ngd-cards { display: flex; flex-direction: column; gap: 8px; }
.ngd-card { border: 1px solid var(--brown-200, #e5d9c6); border-radius: 10px; padding: 8px 12px; background: var(--cream-50, #faf6ee); }

.ngd-card-compact-head { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
.ngd-card-summary-left { display: flex; align-items: center; gap: 8px; }
.ngd-goc { font-size: 0.88rem; color: var(--brown-800, #4b3626); border-left: 3px solid var(--hc); padding-left: 6px; }
.ngd-goc b { color: var(--hc); }
.ngd-tt { font-size: 0.68rem; font-weight: 800; padding: 1px 5px; border-radius: 999px; margin-left: 4px; }
.ngd-tt.is-thuc { background: #f4dcd6; color: #b23a29; }
.ngd-tt.is-hu { background: #d8e4ef; color: #35638d; }
.ngd-khung-tag { font-size: 0.74rem; font-weight: 600; color: #7f6e59; background: #f0e6d6; padding: 2px 7px; border-radius: 6px; }

.ngd-card-quick-huyet { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; }
.ngd-qh--ta { color: #a82e1e; }
.ngd-qh--bo { color: #2e5c1e; }

.ngd-expand-btn { font-size: 0.74rem; font-weight: 700; color: var(--brown-800, #4b3626); border: 1px solid #d9c9b0; background: #fff; padding: 3px 8px; border-radius: 6px; cursor: pointer; transition: background 0.15s; }
.ngd-expand-btn:hover { background: #f5ece0; }

.ngd-card-expand-body { margin-top: 10px; padding-top: 10px; border-top: 1px dashed #e5d9c6; display: flex; flex-direction: column; gap: 8px; }
.ngd-card-controls { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
.ngd-sel { font-size: 0.76rem; color: var(--gray-600, #6f5f47); display: inline-flex; align-items: center; gap: 4px; }
.ngd-sel select { font-size: 0.78rem; padding: 2px 6px; border: 1px solid var(--brown-200, #d9c9b0); border-radius: 6px; background: #fff; color: var(--brown-800, #4b3626); font-weight: 600; }
.ngd-khung-line { font-size: 0.78rem; color: var(--gray-600, #6f5f47); }

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
.ngd-giaithich { margin: 4px 0 0; font-size: 0.78rem; color: var(--brown-700, #5a4636); line-height: 1.45; background: #f7f1e7; padding: 6px 8px; border-radius: 6px; }
.ngd-note { margin: 10px 0 0; font-size: 0.74rem; color: var(--gray-500, #8a7c68); line-height: 1.45; }

/* ── Đối chiếu KHO CÔNG THỨC: chip mã công thức (bấm sang trang Phương Huyệt) ── */
.ngd-ct-tag {
  display: inline-flex; align-items: center; gap: 5px; padding: 1px 8px; border-radius: 999px;
  border: 1px solid var(--brown-200); background: var(--surface-2);
  font-size: 10px; font-weight: 700; letter-spacing: 0.02em; color: var(--brown-700); text-transform: none;
}
.ngd-ct-tag--local { border-style: dashed; color: var(--gray-600); }
.ngd-ct-sua { padding: 0 5px; border-radius: 999px; background: var(--brown-700); color: #fff; font-size: 9px; }
.ngd-ct-tag--link { text-decoration: none; cursor: pointer; }
.ngd-ct-tag--link:hover { border-color: var(--brown-600); background: var(--surface-1); }
.ngd-sel--inline { font-size: 11px; color: var(--gray-700); display: inline-flex; align-items: center; gap: 4px; }
.ngd-sel--inline select { font-size: 11px; padding: 1px 4px; }
.ngd-khung-ro { font-size: 11px; font-weight: 700; color: var(--brown-800, #4b3626); }
.ngd-meta--nk { font-size: 11px; color: var(--gray-600); }

/* ── Tầng B: dải định gốc + vai trò từng kinh ─────────────────────────────── */
.ngd-vai { font-size: 9px; font-weight: 700; padding: 1px 7px; border-radius: 999px; letter-spacing: 0.04em; }
.ngd-vai--goc { background: var(--brown-700, #5a4636); color: #fff; }
.ngd-vai--keo { background: #ece4d8; color: #6b5540; text-transform: none; }

/* ── Hồi tác (so hai lần đo) ──────────────────────────────────────────────── */
/* Dải mảnh của CA BỆNH (hồi tác + cảnh báo an toàn) — lý luận định gốc để ở tab tra cứu. */
.ngd-dai { display: flex; flex-wrap: wrap; gap: 8px; margin: 8px 0; padding: 6px 10px; border-radius: 8px; background: #fbf7f1; border-left: 3px solid var(--brown-600, #7a5a3c); font-size: 11px; line-height: 1.55; text-transform: none; }
.ngd-dai-muc { color: var(--gray-800, #374151); }
.ngd-dai-muc.is-chuyen-tot b { color: #3d6029; }
.ngd-dai-muc.is-nang-them b { color: #8f2f21; }
.ngd-dai-muc.is-chua-chuyen b { color: #8a5a20; }
.ngd-dai-canh { color: #8a4b20; }
</style>
