<script setup lang="ts">
/**
 * DaiMocCaDo — dải mốc các lần đo theo thời gian: ngày · kinh Lục Kinh · Thái Cực tổng cương ·
 * chip thể chất, nối nhau bằng khối chuyển biến (số ngày + hướng, hoặc dấu cắt đợt).
 *
 * Tách ra từ cổng bệnh nhân để TRANG THẦY THUỐC dùng chung đúng một cách đọc. Hai nơi chỉ khác
 * nhau ở route đích khi bấm vào một mốc, nên đó là prop.
 *
 * Thứ tự bày ra: MỚI NHẤT TRƯỚC. `mocs` bên trong vẫn giữ cũ→mới vì `cb` của mỗi mốc là chuyển
 * biến so với mốc liền trước; chỉ đảo ở khâu hiển thị, và khối nối đặt XUỐNG DƯỚI mỗi mốc.
 */
import { computed } from 'vue'
import AmDuongTaiji from '@/components/AmDuongTaiji.vue'
import { tomTatCaDo, soSanhCaDo, type CaDoInput, type TomTat, type ChuyenBien } from '@/lib/tomTatCaDo'
import type { TongCuong } from '@/lib/meridianAnalysis'
import { dinhViChac, type TheKinhMap } from '@/lib/lucKinh'

const props = withDefaults(
  defineProps<{
    records: CaDoInput[]
    theKinhMap?: TheKinhMap | null
    /** Route mở khi bấm một mốc — cổng bệnh nhân và trang thầy thuốc đi hai đường khác nhau. */
    routeName?: string
    /** Dùng khi bản ghi không kèm patientId (cổng bệnh nhân lấy từ phiên đăng nhập). */
    fallbackPatientId?: number | null
  }>(),
  { theKinhMap: null, routeName: 'meridian-results', fallbackPatientId: null },
)

interface Moc {
  id: number
  patientId?: number | null
  ngay: string
  gio: string
  kinhSlug: string | null
  kinhTen: string
  kinhHan: string
  chips: { nhan: string; cuc: 'duong' | 'am' | 'trung' }[]
  tongCuong: TongCuong | null
  moiNhat: boolean
  /** So với mốc liền trước (null ở mốc đầu). */
  cb: ChuyenBien | null
  /** Bước này có đầu nào định vị chưa đủ chắc không → nhãn phải mang dấu ngờ. */
  cbNgo: boolean
  /** Vì sao ngờ — nêu đích danh mốc hụt và Bát Cương đo được của nó. */
  cbNgoLyDo: string
}

/** Dải phải đi cũ → mới ở khâu TÍNH (để `cb` đúng ngữ nghĩa), dù bày ra thì ngược lại. */
const tomTats = computed<TomTat[]>(() =>
  props.records.map((r) => tomTatCaDo(r, props.theKinhMap)).sort((a, b) => a.ts - b.ts),
)

/** Chip thể chất. Cực ẤM (dương) cho thịnh, LAM (âm) cho hư — đúng quy ước màu Âm-Dương của app.
 *
 * Hội chứng tổng cương đã đọc đủ ba cương ("Biểu Thực Nhiệt") nên Hư-Thực và Biểu-Lý ở đây là
 * LẶP LẠI — chỉ giữ Khí · Huyết. Ca thiếu số đo không dựng được hội chứng thì bày lại đủ bốn. */
function chipsTheChat(t: TomTat): { nhan: string; cuc: 'duong' | 'am' | 'trung' }[] {
  const cuc = (v: string): 'duong' | 'am' | 'trung' => {
    if (/thịnh|Thực/.test(v)) return 'duong'
    if (/hư|Hư/.test(v)) return 'am'
    return 'trung'
  }
  const nguon = t.tongCuong?.hoiChung ? [t.khi, t.huyet] : [t.khi, t.huyet, t.huThuc, t.viTri]
  return nguon
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
    cbNgo: i > 0 && (!dinhViChac(arr[i - 1]!.lucKinh) || !dinhViChac(t.lucKinh)),
    cbNgoLyDo: i > 0 ? lyDoNgo(arr[i - 1]!, t) : '',
  }))
})

/** Câu giải thích dấu ngờ: gọi đích danh mốc nào hụt và Bát Cương đo được của nó, để thầy thuốc
 *  đọc một câu là biết nên tin bao nhiêu. */
function lyDoNgo(truoc: TomTat, sau: TomTat): string {
  const hut: string[] = []
  const mo = (t: TomTat) => {
    const ngay = t.ts ? new Date(t.ts).toLocaleDateString('vi-VN') : '—'
    const hc = t.tongCuong?.hoiChung
    return `mốc ${ngay}${hc ? ` (Bát Cương đo được: ${hc})` : ''}`
  }
  if (!dinhViChac(truoc.lucKinh)) hut.push(mo(truoc))
  if (!dinhViChac(sau.lucKinh)) hut.push(mo(sau))
  if (!hut.length) return ''
  return (
    `${hut.join(' và ')} — Bát Cương đo được chưa khớp trọn chữ ký kinh, ` +
    'nên hướng này suy từ tên thể bệnh, chưa được số đo xác nhận.'
  )
}

/** Mới nhất trước — thứ người đọc cần thấy đầu tiên, khỏi cuộn tới cuối dải. */
const mocsHienThi = computed<Moc[]>(() => [...mocs.value].reverse())

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
function khoangCach(cb: ChuyenBien): string {
  if (cb.soNgay === null) return ''
  if (cb.soNgay === 0) return 'cùng ngày'
  return `${cb.soNgay} ngày`
}
/**
 * Nhãn khoảng cách trên chip nối. Dải bày ra mới → cũ, nên ô bên PHẢI của chip là mốc CŨ hơn —
 * chip đang mô tả chiều phải → trái, ngược thói quen đọc. Chữ "trước" ghim mốc cũ vào đúng phía
 * nó đứng, để không ai đọc thành "từ mốc mới sang mốc cũ thì bệnh lui".
 */
function nhanKhoangCach(cb: ChuyenBien): string {
  if (cb.soNgay === null) return ''
  if (cb.soNgay === 0) return 'cùng ngày'
  return `${cb.soNgay} ngày trước`
}
</script>

<template>
<section class="mach">
  <div class="mach-head">
    <h3 class="mach-title">{{ mocs.length }} lần đo</h3>
  </div>

  <div class="mach-scroll">
  <ol class="mach-line">
    <li v-for="m in mocsHienThi" :key="m.id" class="mach-item">
      <RouterLink
        class="mach-cell"
        :class="{ 'is-moi': m.moiNhat }"
        :to="{
          name: routeName,
          params: { patientId: m.patientId ?? fallbackPatientId, examId: m.id },
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
            <!-- TỔNG CƯƠNG (Dương thịnh / Âm hư / Dương hư / Âm thịnh) là cương TỔNG QUÁT, đứng
                 trên cùng trong Bát Cương — nên nó là dòng chính. Hội chứng ba cương đầy đủ
                 ("Biểu Hư Hàn") là phần diễn giải chi tiết, làm dòng phụ. -->
            <b class="mach-tc-nhan">{{ m.tongCuong.amDuong || m.tongCuong.hoiChung }}</b>
            <i v-if="m.tongCuong.hoiChung && m.tongCuong.amDuong" class="mach-tc-phu">{{ m.tongCuong.hoiChung }}</i>
          </span>
        </span>

        <span v-if="m.chips.length" class="mach-chips">
          <span v-for="c in m.chips" :key="c.nhan" class="mach-chip" :class="'mach-chip--' + c.cuc">
            {{ c.nhan }}
          </span>
        </span>
      </RouterLink>

      <!-- Nối với mốc CŨ HƠN (nằm sau, vì dải xếp mới → cũ): đợt mới / số ngày + hướng -->
      <span v-if="m.cb && m.cb.dotMoi" class="mach-break" title="Cách lần đo trước đó quá lâu — tính là đợt đo mới, không nối diễn biến">
        ⋯ đợt mới
      </span>
      <span
        v-else-if="m.cb"
        class="mach-conn"
        :class="['mach-conn--' + (m.cb.lucKinh?.loai || 'giu'), { 'is-ngo': m.cbNgo }]"
        :title="m.cbNgo
          ? `So với lần đo trước đó ${khoangCach(m.cb)}: ${nhanHuong(m.cb)}.\n\nCHƯA CHẮC: ${m.cbNgoLyDo}`
          : `So với lần đo trước đó ${khoangCach(m.cb)}: ${nhanHuong(m.cb)}`"
      >
        <span class="mach-days">{{ nhanKhoangCach(m.cb) }}</span>
        <span class="mach-arrow">{{ muiTen(m.cb) }}</span>
        <span class="mach-nhan">{{ nhanHuong(m.cb) }}<template v-if="m.cbNgo">?</template></span>
      </span>
    </li>
  </ol>
  </div>
</section>
</template>

<style scoped>
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
  font-size: var(--font-size-lg);
  font-weight: 800;
  color: var(--brown-800);
  line-height: 1.2;
  letter-spacing: -0.01em;
}
.mach-tc-phu {
  font-style: normal;
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  line-height: 1.3;
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
/* Dấu ngờ: vẫn nói hướng, nhưng nhạt đi + nét đứt để mắt tự hạ tin cậy — cùng quy ước với dải
   truyền biến trên trang Kết Quả Đo. */
.mach-conn.is-ngo {
  opacity: 0.74;
  border-style: dashed;
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
