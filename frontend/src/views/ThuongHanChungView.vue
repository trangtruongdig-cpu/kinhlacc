<script setup lang="ts">
/**
 * TAB THƯƠNG HÀN — kho CHỨNG–PHƯƠNG (Thương Hàn Luận, Tống bản).
 *
 * Cùng lối với tab Ngũ Hành Hồi Tác: tri thức nằm ở bảng `thuong_han_chung`, engine seed bộ chuẩn,
 * thầy thuốc sửa được, ca bệnh chỉ TRA. Mỗi chứng là một CÔNG THỨC đầy đủ: điều văn → chứng trạng →
 * câu hỏi chốt → pháp trị → chủ phương (liều cổ + liều gram) → cấm kỵ → bài thuốc trong kho.
 */
import { ref, computed, onMounted } from 'vue'
import { api } from '@/services/api'

interface ViPhuong {
  ten: string
  lieuGoc: string
  lieuGram: number | null
  vaiTro?: string
  canhBaoLieu?: string | null
}
interface ChungRow {
  slug: string
  kinh: string
  phan_loai: string
  ten: string
  han: string | null
  dieu_van: number[] | null
  de_cuong: string | null
  mach: string | null
  luoi: string | null
  cau_hoi_chot: string[] | null
  trieu_chung: string[] | null
  phap_tri: string | null
  chu_phuong: { ten: string; han: string; dang: string; heQuyDoi?: string; viThuoc: ViPhuong[]; cachDung?: string } | null
  gia_giam: Array<{ khi: string; thi: string }> | null
  cam_ky: string[] | null
  truyen_sang: string[] | null
  id_bai_thuoc: number | null
  khop_phan_tram: number | null
  ghi_chu: string | null
  sua_tay: boolean
}

const rows = ref<ChungRow[]>([])
const loading = ref(false)
const q = ref('')
const kinhChon = ref('thai-duong')

/** 6 kinh — hiện mới dựng Thái Dương; các kinh sau bật dần khi được duyệt. */
const KINH_TAB: ReadonlyArray<{ id: string; ten: string; han: string }> = [
  { id: 'thai-duong', ten: 'Thái Dương', han: '太陽' },
  { id: 'duong-minh', ten: 'Dương Minh', han: '陽明' },
  { id: 'thieu-duong', ten: 'Thiếu Dương', han: '少陽' },
  { id: 'thai-am', ten: 'Thái Âm', han: '太陰' },
  { id: 'thieu-am', ten: 'Thiếu Âm', han: '少陰' },
  { id: 'quyet-am', ten: 'Quyết Âm', han: '厥陰' },
]
const PHAN_LOAI_TEN: Record<string, string> = {
  'kinh-chung': 'Kinh chứng',
  'phu-chung': 'Phủ chứng',
  'bien-chung': 'Biến chứng',
  'kiem-chung': 'Kiêm chứng',
}

async function load() {
  loading.value = true
  try {
    rows.value = await api.get<ChungRow[]>('/thuong-han-chung')
  } catch {
    rows.value = []
  } finally {
    loading.value = false
  }
}
onMounted(load)

const soTheoKinh = computed(() => {
  const m: Record<string, number> = {}
  for (const r of rows.value) m[r.kinh] = (m[r.kinh] ?? 0) + 1
  return m
})
const danhSach = computed(() => {
  const theoKinh = rows.value.filter((r) => r.kinh === kinhChon.value)
  const t = q.value.trim().toLowerCase()
  if (!t) return theoKinh
  return theoKinh.filter((r) => {
    const vi = (r.chu_phuong?.viThuoc || []).map((v) => v.ten).join(' ')
    return `${r.ten} ${r.han} ${r.de_cuong} ${r.chu_phuong?.ten} ${vi} ${r.phap_tri}`.toLowerCase().includes(t)
  })
})
const soCanhBao = computed(
  () => danhSach.value.filter((r) => (r.chu_phuong?.viThuoc || []).some((v) => v.canhBaoLieu)).length,
)
</script>

<template>
  <div class="thl">
    <div class="thl-head">
      <div>
        <h2 class="thl-title">Chứng – Phương Thương Hàn Luận</h2>
        <p class="thl-sub">
          Tầng giữa 6 kinh và kho bài thuốc: mỗi chứng là một công thức — điều văn, câu hỏi chốt,
          chủ phương kèm liều quy đổi, cấm kỵ. Ca bệnh đối chiếu vào đây để ra bài thuốc.
        </p>
      </div>
      <span class="thl-badge">
        {{ danhSach.length }} chứng<template v-if="soCanhBao"> · {{ soCanhBao }} bài có cảnh báo liều</template>
      </span>
    </div>

    <div class="thl-bar">
      <div class="thl-kinh">
        <button
          v-for="k in KINH_TAB"
          :key="k.id"
          type="button"
          class="thl-kinh-btn"
          :class="{ 'is-active': kinhChon === k.id, 'is-empty': !soTheoKinh[k.id] }"
          :title="soTheoKinh[k.id] ? `${soTheoKinh[k.id]} chứng` : 'Chưa dựng — sẽ bổ sung sau khi kinh trước được duyệt'"
          @click="kinhChon = k.id"
        >
          {{ k.ten }} <em>{{ k.han }}</em>
          <span class="thl-kinh-so">{{ soTheoKinh[k.id] ?? 0 }}</span>
        </button>
      </div>
      <input v-model="q" class="thl-search" type="search" placeholder="Tìm theo chứng, phương, vị thuốc…" />
    </div>

    <p v-if="loading" class="thl-empty">Đang nạp kho chứng–phương…</p>
    <p v-else-if="!danhSach.length" class="thl-empty">
      Kinh này chưa dựng chứng nào. Bộ chuẩn nằm ở bảng <code>thuong_han_chung</code>, backend tự seed khi khởi động.
    </p>

    <div class="thl-grid">
      <article v-for="c in danhSach" :key="c.slug" class="thl-card">
        <header class="thl-card-head">
          <div>
            <span class="thl-phan" :class="`thl-phan--${c.phan_loai}`">{{ PHAN_LOAI_TEN[c.phan_loai] || c.phan_loai }}</span>
            <h3 class="thl-card-ten">{{ c.ten }} <em v-if="c.han">{{ c.han }}</em></h3>
          </div>
          <span v-if="c.dieu_van?.length" class="thl-dieu">Điều {{ c.dieu_van.join(', ') }}</span>
          <span v-if="c.sua_tay" class="thl-sua">đã chỉnh</span>
        </header>

        <p class="thl-decuong">{{ c.de_cuong }}</p>
        <p class="thl-mach">
          <b>Mạch:</b> {{ c.mach }}<template v-if="c.luoi"> · <b>Lưỡi:</b> {{ c.luoi }}</template>
        </p>

        <div v-if="c.cau_hoi_chot?.length" class="thl-hoi">
          <span class="thl-label">Câu hỏi chốt (máy định vị tới kinh, người định vị tới chứng)</span>
          <ul>
            <li v-for="(h, i) in c.cau_hoi_chot" :key="i">{{ h }}</li>
          </ul>
        </div>

        <p class="thl-phap"><b>Pháp trị:</b> {{ c.phap_tri }}</p>

        <div v-if="c.chu_phuong" class="thl-phuong">
          <div class="thl-phuong-head">
            <b>{{ c.chu_phuong.ten }}</b> <em>{{ c.chu_phuong.han }}</em>
            <span v-if="c.chu_phuong.dang !== 'thang'" class="thl-dang">dạng {{ c.chu_phuong.dang }}</span>
            <!-- Trang chi tiết bài thuốc định tuyến theo SLUG chứ không theo id, nên ở đây chỉ nêu
                 mã trong kho + độ khớp thành phần; bấm sang bài sẽ nối khi có slug ổn định. -->
            <span
              v-if="c.id_bai_thuoc"
              class="thl-bai"
              :title="`Bài trong kho bai_thuoc, khớp thành phần ${c.khop_phan_tram}%`"
            >kho #{{ c.id_bai_thuoc }} · khớp {{ c.khop_phan_tram }}%</span>
            <span v-else class="thl-bai thl-bai--thieu">kho chưa có bài</span>
          </div>
          <table class="thl-vi">
            <tbody>
              <tr v-for="v in c.chu_phuong.viThuoc" :key="v.ten" :class="{ 'is-canh': v.canhBaoLieu }">
                <td class="thl-vi-ten">{{ v.ten }}</td>
                <td class="thl-vi-lieu">{{ v.lieuGram != null ? `${v.lieuGram}g` : '—' }}</td>
                <td class="thl-vi-goc">{{ v.lieuGoc }}</td>
                <td class="thl-vi-vai">{{ v.vaiTro || '' }}</td>
              </tr>
            </tbody>
          </table>
          <p v-for="v in (c.chu_phuong.viThuoc || []).filter((x) => x.canhBaoLieu)" :key="`w-${v.ten}`" class="thl-canh">
            ⚠ {{ v.canhBaoLieu }}
          </p>
          <p v-if="c.chu_phuong.cachDung" class="thl-cachdung"><b>Cách dùng:</b> {{ c.chu_phuong.cachDung }}</p>
          <p class="thl-he">{{ c.chu_phuong.heQuyDoi }}</p>
        </div>

        <div v-if="c.gia_giam?.length" class="thl-giagiam">
          <span class="thl-label">Gia giảm</span>
          <ul>
            <li v-for="(g, i) in c.gia_giam" :key="i"><b>{{ g.khi }}</b> → {{ g.thi }}</li>
          </ul>
        </div>

        <div v-if="c.cam_ky?.length" class="thl-camky">
          <span class="thl-label thl-label--do">Cấm kỵ</span>
          <ul>
            <li v-for="(k, i) in c.cam_ky" :key="i">{{ k }}</li>
          </ul>
        </div>

        <p v-if="c.truyen_sang?.length" class="thl-truyen">Thường truyền sang: {{ c.truyen_sang.join(' · ') }}</p>
      </article>
    </div>
  </div>
</template>

<style scoped>
.thl { padding: var(--space-2) 0; }
.thl-head { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-4); flex-wrap: wrap; }
.thl-title { margin: 0; font-size: var(--font-size-lg); font-weight: 700; color: var(--brown-800, #43342a); }
.thl-sub { margin: 4px 0 0; max-width: 760px; font-size: var(--font-size-sm); color: var(--gray-600, #6b7280); text-transform: none; line-height: 1.55; }
.thl-badge { padding: 3px 12px; border-radius: 999px; background: var(--surface-2, #f6f1e9); color: var(--brown-700, #5a4636); font-size: var(--font-size-xs); font-weight: 700; }
.thl-bar { display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap; margin: var(--space-3) 0; }
.thl-kinh { display: flex; gap: 6px; flex-wrap: wrap; }
.thl-kinh-btn { display: inline-flex; align-items: center; gap: 5px; padding: 4px 12px; border: 1px solid var(--brown-200, #e0d5c5); border-radius: 999px; background: var(--surface-1, #fff); color: var(--brown-700, #5a4636); font-size: var(--font-size-xs); font-weight: 600; cursor: pointer; }
.thl-kinh-btn em { font-style: normal; opacity: 0.6; }
.thl-kinh-btn.is-active { background: var(--brown-700, #5a4636); border-color: var(--brown-700, #5a4636); color: #fff; }
.thl-kinh-btn.is-empty { opacity: 0.45; }
.thl-kinh-so { padding: 0 6px; border-radius: 999px; background: rgba(0, 0, 0, 0.08); font-size: 10px; }
.thl-search { flex: 1; min-width: 220px; padding: 6px 12px; border: 1px solid var(--brown-200, #e0d5c5); border-radius: 8px; font-size: var(--font-size-sm); }
.thl-empty { padding: var(--space-4); color: var(--gray-600, #6b7280); font-size: var(--font-size-sm); text-transform: none; }
.thl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(420px, 1fr)); gap: var(--space-3); }
.thl-card { border: 1px solid var(--brown-200, #e0d5c5); border-radius: 12px; padding: var(--space-3) var(--space-4); background: var(--surface-1, #fff); }
.thl-card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
.thl-card-ten { margin: 4px 0 0; font-size: var(--font-size-md); font-weight: 700; color: var(--brown-800, #43342a); }
.thl-card-ten em { font-style: normal; font-weight: 500; opacity: 0.6; font-size: 0.85em; }
.thl-phan { padding: 1px 9px; border-radius: 999px; font-size: 10px; font-weight: 700; background: #ece4d8; color: #6b5540; }
.thl-phan--phu-chung { background: rgba(53, 99, 141, 0.12); color: #2b5070; }
.thl-phan--bien-chung { background: rgba(178, 58, 41, 0.1); color: #8f2f21; }
.thl-dieu { font-size: 10px; font-weight: 700; color: var(--brown-700, #5a4636); background: var(--surface-2, #f6f1e9); padding: 2px 8px; border-radius: 999px; text-transform: none; }
.thl-sua { font-size: 10px; font-weight: 700; padding: 1px 7px; border-radius: 999px; background: var(--brown-700, #5a4636); color: #fff; }
.thl-decuong { margin: 8px 0 0; font-size: var(--font-size-sm); line-height: 1.6; color: var(--gray-800, #374151); text-transform: none; }
.thl-mach, .thl-phap { margin: 5px 0 0; font-size: var(--font-size-xs); color: var(--gray-700, #4b5563); text-transform: none; }
.thl-label { display: block; margin-bottom: 3px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--brown-700, #5a4636); }
.thl-label--do { color: #8f2f21; }
.thl-hoi, .thl-giagiam, .thl-camky { margin-top: 9px; }
.thl-hoi ul, .thl-giagiam ul, .thl-camky ul { margin: 0; padding-left: 18px; font-size: var(--font-size-xs); line-height: 1.6; color: var(--gray-700, #4b5563); text-transform: none; }
.thl-camky { padding: 7px 9px; border-radius: 8px; background: rgba(178, 58, 41, 0.06); }
.thl-camky ul { color: #7a3226; }
.thl-phuong { margin-top: 10px; padding: 8px 10px; border: 1px dashed var(--brown-200, #e0d5c5); border-radius: 8px; }
.thl-phuong-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: var(--font-size-sm); }
.thl-phuong-head em { font-style: normal; opacity: 0.6; }
.thl-dang { font-size: 10px; padding: 1px 7px; border-radius: 999px; background: #f6e9d8; color: #8a5a20; }
.thl-bai { margin-left: auto; font-size: 10px; font-weight: 700; padding: 2px 9px; border-radius: 999px; background: rgba(79, 125, 57, 0.12); color: #3d6029; text-decoration: none; text-transform: none; }
.thl-bai--thieu { background: rgba(0, 0, 0, 0.06); color: var(--gray-600, #6b7280); }
.thl-vi { width: 100%; margin-top: 6px; border-collapse: collapse; font-size: var(--font-size-xs); }
.thl-vi td { padding: 2px 4px; border-bottom: 1px solid rgba(0, 0, 0, 0.05); }
.thl-vi tr.is-canh td { background: rgba(178, 58, 41, 0.05); }
.thl-vi-ten { font-weight: 600; color: var(--brown-800, #43342a); }
.thl-vi-lieu { width: 64px; font-weight: 700; text-align: right; }
.thl-vi-goc { width: 110px; color: var(--gray-600, #6b7280); text-transform: none; }
.thl-vi-vai { width: 44px; color: var(--gray-600, #6b7280); }
.thl-canh { margin: 5px 0 0; font-size: 10px; line-height: 1.5; color: #8a4b20; text-transform: none; }
.thl-cachdung, .thl-he { margin: 5px 0 0; font-size: 10px; color: var(--gray-600, #6b7280); text-transform: none; line-height: 1.5; }
.thl-truyen { margin: 8px 0 0; font-size: 10px; color: var(--gray-600, #6b7280); text-transform: none; }
</style>
