<script setup lang="ts">
/**
 * MyRecordsView — Hồ Sơ Chẩn Trị của chính người bệnh.
 *
 * Trình bày = DẢI MỐC ĐO theo thời gian (cùng lối với dải truyền biến ở trang Kết Quả Đo): mỗi mốc
 * là một ô BẤM ĐƯỢC mở thẳng lần đo đó, mang ngày · kinh (Lục Kinh) · một dòng thể chất ngắn
 * (Khí · Huyết · Hư-Thực · Biểu-Lý). Giữa hai mốc là số ngày + hướng chuyển biến.
 *
 * Cố ý KHÔNG bày chi tiết ở đây: người bệnh cần liếc là thấy đang chuyển tốt hay xấu, muốn sâu hơn
 * thì bấm vào mốc. Các con số tính tại máy người đọc bằng lib/tomTatCaDo.ts — cùng bộ hàm trang
 * Kết Quả Đo dùng, nên không lệch trang chi tiết.
 */
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { usePatientAuthStore } from '@/stores/patientAuth'
import MedicalDisclaimer from '@/components/MedicalDisclaimer.vue'
import AmDuongTaiji from '@/components/AmDuongTaiji.vue'
import { tomTatCaDo, soSanhCaDo, type CaDoInput, type TomTat, type ChuyenBien } from '@/lib/tomTatCaDo'
import type { TongCuong } from '@/lib/meridianAnalysis'
import type { TheKinhMap } from '@/lib/lucKinh'

const authStore = usePatientAuthStore()
const records = ref<CaDoInput[]>([])
const theKinhMap = ref<TheKinhMap | null>(null)
const isLoading = ref(true)

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

/** Gọi API bằng ĐÚNG token người bệnh (không dùng wrapper api.ts — wrapper ưu tiên token nhân viên
 * nếu máy đó có cả hai phiên, sẽ tra nhầm hồ sơ). */
async function layJson<T>(path: string): Promise<T | null> {
  if (!authStore.token) return null
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${authStore.token}` },
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

async function fetchRecords() {
  isLoading.value = true
  try {
    const data = await layJson<CaDoInput[]>('/examinations/my-records')
    if (Array.isArray(data)) records.value = data
  } finally {
    isLoading.value = false
  }
}

/** Bản đồ thể bệnh → Lục Kinh do engine suy. Hỏng/không có → lib rơi về bảng tĩnh, vẫn ra kết luận. */
async function fetchTheKinhMap() {
  const m = await layJson<TheKinhMap>('/thuong-han/the-kinh')
  if (m && Object.keys(m).length) theKinhMap.value = m
}

onMounted(() => {
  fetchRecords()
  fetchTheKinhMap()
})

// ── Dựng dải mốc ──────────────────────────────────────────────────────────────────────────────
interface Moc {
  id: number
  patientId: number | null
  ngay: string
  gio: string
  kinhSlug: string | null
  kinhTen: string
  kinhHan: string
  /** Thể chất dạng chip: Khí · Huyết · Hư-Thực · Biểu-Lý (mỗi mục một chip). */
  chips: { nhan: string; cuc: 'duong' | 'am' | 'trung' }[]
  /** Tổng cương — vào thẳng đồ hình Thái Cực dư/khuyết. */
  tongCuong: TongCuong | null
  moiNhat: boolean
  /** So với mốc liền trước (null ở mốc đầu). */
  cb: ChuyenBien | null
}

/** API trả mới → cũ; dải phải đi cũ → mới. */
const tomTats = computed<TomTat[]>(() =>
  records.value
    .map((r) => tomTatCaDo(r, theKinhMap.value))
    .sort((a, b) => a.ts - b.ts),
)

/** Chip thể chất. Cực ẤM (dương) cho thịnh/Thực, LAM (âm) cho hư — đúng quy ước màu Âm-Dương
 * đang dùng khắp app; Biểu/Lý là vị trí, không thuộc cực nào nên để trung tính. */
function chipsTheChat(t: TomTat): { nhan: string; cuc: 'duong' | 'am' | 'trung' }[] {
  const cuc = (v: string): 'duong' | 'am' | 'trung' => {
    if (/thịnh|Thực/.test(v)) return 'duong'
    if (/hư|Hư/.test(v)) return 'am'
    return 'trung'
  }
  return [t.khi, t.huyet, t.huThuc, t.viTri]
    .map((x) => (x || '').trim())
    .filter(Boolean)
    .map((nhan) => ({ nhan, cuc: cuc(nhan) }))
}

const mocs = computed<Moc[]>(() => {
  const arr = tomTats.value
  return arr.map((t, i) => ({
    id: t.id,
    patientId: t.patientId,
    ngay: t.ts ? new Date(t.ts).toLocaleDateString('vi-VN') : '—',
    gio: t.ts ? new Date(t.ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '',
    kinhSlug: t.lucKinh ? t.lucKinh.kinh.slug : null,
    kinhTen: t.lucKinh ? t.lucKinh.kinh.ten : 'Chưa định vị',
    kinhHan: t.lucKinh ? t.lucKinh.kinh.han : '',
    chips: chipsTheChat(t),
    tongCuong: t.tongCuong,
    moiNhat: i === arr.length - 1,
    cb: i > 0 ? soSanhCaDo(arr[i - 1]!, t) : null,
  }))
})

function nhanHuong(cb: ChuyenBien): string {
  if (!cb.lucKinh) return ''
  if (cb.lucKinh.loai === 'ra-bieu') return 'bệnh lui'
  if (cb.lucKinh.loai === 'vao-ly') return 'vào sâu'
  return 'giữ kinh'
}
function muiTen(cb: ChuyenBien): string {
  if (!cb.lucKinh) return '→'
  return cb.lucKinh.loai === 'ra-bieu' ? '↑' : cb.lucKinh.loai === 'vao-ly' ? '↓' : '→'
}
/** Dải chạy cũ → mới; mốc MỚI NHẤT mới là thứ cần thấy trước, nên cuộn sẵn về cuối. */
const scrollRef = ref<HTMLElement | null>(null)
watch(
  mocs,
  async () => {
    await nextTick()
    const el = scrollRef.value
    if (el) el.scrollLeft = el.scrollWidth
  },
  { flush: 'post' },
)

function khoangCach(cb: ChuyenBien): string {
  if (cb.soNgay === null) return ''
  if (cb.soNgay === 0) return 'cùng ngày'
  return `${cb.soNgay} ngày`
}

</script>

<template>
  <div class="my-records">
    <header class="page-head">
      <h2 class="page-title">Hồ Sơ Chẩn Trị</h2>
      <p class="page-sub">Bấm vào một lần đo để xem chi tiết kết quả đo nhiệt độ Kinh Lạc.</p>
    </header>

    <div v-if="isLoading" class="loading">Đang tải danh sách...</div>

    <div v-else-if="!mocs.length" class="empty-state">
      <div class="empty-icon">📋</div>
      <p>Bạn chưa có hồ sơ chẩn trị nào.</p>
    </div>

    <template v-else>
      <section class="mach">
        <div class="mach-head">
          <h3 class="mach-title">{{ mocs.length }} lần đo</h3>
        </div>

        <div ref="scrollRef" class="mach-scroll">
        <ol class="mach-line">
          <li v-for="m in mocs" :key="m.id" class="mach-item">
            <!-- Nối với mốc trước: đợt mới / số ngày + hướng -->
            <span v-if="m.cb && m.cb.dotMoi" class="mach-break" title="Cách lần trước quá lâu — tính là đợt đo mới">
              ⋯ đợt mới
            </span>
            <span v-else-if="m.cb" class="mach-conn" :class="'mach-conn--' + (m.cb.lucKinh?.loai || 'giu')">
              <span class="mach-days">{{ khoangCach(m.cb) }}</span>
              <span class="mach-arrow">{{ muiTen(m.cb) }}</span>
              <span class="mach-nhan">{{ nhanHuong(m.cb) }}</span>
            </span>

            <RouterLink
              class="mach-cell"
              :class="{ 'is-moi': m.moiNhat }"
              :to="{
                name: 'patient-record-detail',
                params: { patientId: m.patientId ?? authStore.patient?.id, examId: m.id },
              }"
              :title="`Xem chi tiết lần đo ${m.ngay}`"
            >
              <span class="mach-top">
                <span class="mach-date">{{ m.ngay }} <i>{{ m.gio }}</i></span>
                <span v-if="m.moiNhat" class="mach-moi">mới nhất</span>
              </span>
              <span class="mach-kinh" :data-kinh="m.kinhSlug || 'none'">
                {{ m.kinhTen }} <i v-if="m.kinhHan">{{ m.kinhHan }}</i>
              </span>

              <!-- Tổng cương: đưa NGUYÊN đồ hình Thái Cực dư/khuyết của trang Kết Quả Đo ra đây -->
              <span v-if="m.tongCuong && m.tongCuong.amDuong" class="mach-tc">
                <AmDuongTaiji :tong-cuong="m.tongCuong" compact class="mach-taiji" />
                <span class="mach-tc-chu">
                  <!-- Tổng cương phải đọc ĐỦ ba cương: [Vị trí] [Chính khí] [Tính chất] —
                       vd "Biểu Thực Nhiệt"; riêng "Dương thịnh" là kết luận rút gọn, để làm dòng phụ. -->
                  <b class="mach-tc-nhan">{{ m.tongCuong.hoiChung || m.tongCuong.amDuong }}</b>
                  <i v-if="m.tongCuong.hoiChung && m.tongCuong.amDuong" class="mach-tc-phu">{{ m.tongCuong.amDuong }}</i>
                </span>
              </span>

              <span v-if="m.chips.length" class="mach-chips">
                <span v-for="c in m.chips" :key="c.nhan" class="mach-chip" :class="'mach-chip--' + c.cuc">
                  {{ c.nhan }}
                </span>
              </span>
            </RouterLink>
          </li>
        </ol>
        </div>
      </section>

      <MedicalDisclaimer compact />
    </template>
  </div>
</template>

<style scoped>
.my-records {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-width: 0;
}
.page-head {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.page-title {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--gray-900);
}
.page-sub {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}
.loading,
.empty-state {
  text-align: center;
  padding: var(--space-12) var(--space-4);
  color: var(--gray-500);
  background: var(--white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}
.empty-icon {
  font-size: 48px;
  margin-bottom: var(--space-4);
}

.mach {
  min-width: 0;
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.mach-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-2);
}
.mach-title {
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--brown-800);
}

/* Khung cuộn riêng: width:100% + min-width:0 chặn dải ngang đẩy tràn cả trang. */
.mach-scroll {
  width: 100%;
  min-width: 0;
  overflow-x: auto;
}

/* Dải mốc — điện thoại: xếp DỌC (một mốc một dòng, dễ bấm) */
.mach-line {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.mach-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

/* Ô một lần đo */
.mach-cell {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px 10px;
  padding: var(--space-3);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  background: var(--surface-2);
  text-decoration: none;
  color: inherit;
  transition: all var(--transition-fast);
}
.mach-cell:hover {
  border-color: var(--brown-300);
  background: var(--brown-50);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}
.mach-cell.is-moi {
  border-color: var(--brown-600);
  background: var(--white);
  box-shadow: var(--shadow-sm);
}
.mach-top {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  width: 100%;
}
.mach-date {
  font-weight: 700;
  color: var(--gray-900);
}
.mach-date i {
  font-style: normal;
  font-weight: 500;
  font-size: var(--font-size-sm);
  color: var(--text-subtle);
}
.mach-kinh {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: #fff;
  background: var(--gray-500);
  border-radius: var(--radius-full);
  padding: 3px 12px;
}
.mach-kinh i {
  font-style: normal;
  font-weight: 500;
  opacity: 0.85;
}
/* Cùng bảng màu 6 kinh với dải truyền biến ở trang Kết Quả Đo — hai nơi phải đọc như một. */
.mach-kinh[data-kinh='thai-duong'] { background: #3d6a8c; }
.mach-kinh[data-kinh='duong-minh'] { background: #a3801f; }
.mach-kinh[data-kinh='thieu-duong'] { background: #bd5730; }
.mach-kinh[data-kinh='thai-am'] { background: #8c6f2e; }
.mach-kinh[data-kinh='thieu-am'] { background: #ab3644; }
.mach-kinh[data-kinh='quyet-am'] { background: #4c7742; }
.mach-kinh[data-kinh='none'] {
  background: var(--gray-100);
  color: var(--text-subtle);
  border: 1px solid var(--gray-200);
}
/* Tổng cương = đồ hình Thái Cực + nhãn */
.mach-tc {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
}
/* AmDuongTaiji bản compact vốn to 240px cho đồ hình bóc lớp — ở đây chỉ cần một hình nhỏ cạnh
   nhãn, nên ghi đè cả khung thẻ lẫn cỡ SVG bên trong. */
.mach-taiji {
  flex: 0 0 auto;
  padding: 0;
  background: none;
  border: none;
  border-radius: 0;
}
.mach-taiji :deep(.ad-svg) {
  width: 64px;
  height: 64px;
}
.mach-tc-chu {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.mach-tc-nhan {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--brown-800);
  line-height: 1.25;
}
.mach-tc-phu {
  font-style: normal;
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}
/* Thể chất dạng chip */
.mach-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.mach-chip {
  font-size: var(--font-size-xs);
  font-weight: 600;
  padding: 2px 9px;
  border-radius: var(--radius-full);
  border: 1px solid var(--gray-200);
  background: var(--surface-2);
  color: var(--gray-700);
  white-space: nowrap;
}
.mach-chip--duong {
  background: #f6ead2;
  border-color: #e3cfb0;
  color: #6f4a22;
}
.mach-chip--am {
  background: #e2ebf2;
  border-color: #c6d6e2;
  color: #2f5670;
}
.mach-moi {
  margin-left: auto;
  font-size: var(--font-size-2xs);
  font-weight: 700;
  color: var(--brown-700);
  background: var(--brown-100);
  border-radius: var(--radius-full);
  padding: 2px 8px;
}

/* Nối giữa hai mốc */
.mach-conn,
.mach-break {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: center;
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--text-muted);
  padding: 2px 10px;
  border-radius: var(--radius-full);
  border: 1px dashed var(--gray-300);
  background: var(--white);
}
.mach-arrow {
  font-size: var(--font-size-md);
  line-height: 1;
}
.mach-conn--ra-bieu {
  color: var(--success-fg);
  border-color: var(--success-border);
  background: var(--success-bg);
}
.mach-conn--vao-ly {
  color: var(--warning-fg);
  border-color: var(--warning-border);
  background: var(--warning-bg);
}
.mach-break {
  color: var(--text-subtle);
}

/* Màn rộng: dải nằm NGANG như ở trang Kết Quả Đo */
@media (min-width: 720px) {
  /* Dải chạy NGANG liền mạch rồi cuộn — cho xuống dòng thì nhiều mốc sẽ xếp thành bậc thang gãy. */
  .mach-scroll {
    padding-bottom: var(--space-2);
  }
  .mach-line {
    flex-direction: row;
    flex-wrap: nowrap;
    align-items: stretch;
    gap: var(--space-2);
    width: max-content;
  }
  .mach-item {
    flex: 0 0 auto;
  }
  .mach-cell {
    width: 232px;
  }
  .mach-the {
    font-size: var(--font-size-xs);
  }
  .mach-item {
    flex-direction: row;
    align-items: stretch;
    gap: var(--space-2);
  }
  .mach-conn,
  .mach-break {
    align-self: center;
  }
  .mach-cell {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    min-width: 170px;
    height: 100%;
  }
  .mach-moi {
    margin-left: 0;
  }
}
</style>
