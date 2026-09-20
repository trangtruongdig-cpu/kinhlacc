<script setup lang="ts">
/**
 * TRỢ LÝ LÝ LUẬN cho một ca — bốn bước, đúng mạch thầy thuốc làm việc:
 *   ① THỂ TRẠNG đo được (Bát Cương + kinh Lục Kinh) — máy đưa tới đây là hết phần của số đo;
 *   ② TRIỆU CHỨNG theo lý luận Thương Hàn: gộp dấu hiệu của các chứng trong kinh ấy + các pháp trị
 *      đã gắn kinh ấy, bày thành checklist để HỎI người bệnh;
 *   ③ tick tới đâu, chấm điểm tới đó → chứng–phương Thương Hàn và pháp trị nào khớp nhất;
 *   ④ bài thuốc của chúng đưa xuống Thang Đặc Trị để Y sỹ tự quyết vị.
 *
 * Kế thừa, không dựng lại: triệu chứng/mạch/lưỡi lấy từ ba danh mục chuẩn của app, pháp trị lấy từ
 * bảng `phap_tri` (đã gắn lục kinh, triệu chứng và bài thuốc sẵn). Máy không tự chốt chứng — nó chỉ
 * xếp hạng theo số dấu hiệu khớp và nói rõ khớp mấy trên mấy.
 */
import { ref, computed, watch } from 'vue'
import { api } from '@/services/api'

const props = defineProps<{
  kinhSlug: string | null
  kinhTen?: string
  chac?: boolean
  /** Tóm tắt thể trạng đo được (Bát Cương) để nhắc lại ngay tại chỗ luận. */
  theTrang?: string
}>()

interface ViPhuong { ten: string; lieuGoc: string; lieuGram: number | null; vaiTro?: string; canhBaoLieu?: string | null }
interface DauHieu { trieuChung: Array<{ id: number | null; ten: string }>; mach: Array<{ id: number; ten: string }>; luoi: Array<{ id: number; ten: string }> }
interface ChungRow {
  slug: string; kinh: string; phan_loai: string; ten: string; han: string | null
  dieu_van: number[] | null; de_cuong: string | null; mach: string | null; luoi: string | null
  cau_hoi_chot: string[] | null; phap_tri: string | null; dau_hieu: DauHieu | null
  chu_phuong: { ten: string; han: string; dang: string; heQuyDoi?: string; viThuoc: ViPhuong[]; cachDung?: string } | null
  gia_giam: Array<{ khi: string; thi: string }> | null
  cam_ky: string[] | null
  id_bai_thuoc: number | null; khop_phan_tram: number | null
}
interface PhapTriRow {
  id: number; theBenh: string | null; nguyenTac: string | null; batCuong: string | null
  idBaiThuoc: number | null; tenBaiThuoc: string | null; trieuChung: string[]
}

const emit = defineEmits<{
  (e: 'chon', v: { slug: string; ten: string; idBaiThuoc: number | null; phuongTen: string; viThuoc: ViPhuong[] } | null): void
}>()

const chung = ref<ChungRow[]>([])
const phapTri = ref<PhapTriRow[]>([])
const loading = ref(false)
const chonSlug = ref<string | null>(null)
const moChiTiet = ref<string | null>(null)
const moDanhSach = ref(false)
/** Dấu hiệu người bệnh CÓ — khoá đã chuẩn hoá để khớp giữa hai nguồn. */
const daTick = ref<Set<string>>(new Set())
/** Chứng đang được "lấy trọn bộ dấu hiệu". Phải khai báo TRƯỚC `load()` — load chạy ngay lúc setup
 *  (watch immediate), chạm ref khai báo sau là TDZ và hỏng cả component. */
const chungDangLay = ref<string | null>(null)

const chuan = (t: string) =>
  t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

async function load() {
  chung.value = []
  phapTri.value = []
  chonSlug.value = null
  moChiTiet.value = null
  daTick.value = new Set()
  chungDangLay.value = null
  if (!props.kinhSlug) return
  loading.value = true
  try {
    const res = await api.get<{ chung: ChungRow[]; phapTri: PhapTriRow[] }>(
      `/thuong-han-chung/goi-y?kinh=${encodeURIComponent(props.kinhSlug)}`,
    )
    chung.value = res.chung ?? []
    phapTri.value = res.phapTri ?? []
  } catch {
    chung.value = []
    phapTri.value = []
  } finally {
    loading.value = false
  }
}
watch(() => props.kinhSlug, load, { immediate: true })

/** Checklist: gộp dấu hiệu của MỌI chứng + MỌI pháp trị của kinh này, chia ba nhóm. */
const checklist = computed(() => {
  const tc = new Map<string, string>()
  const mach = new Map<string, string>()
  const luoi = new Map<string, string>()
  for (const c of chung.value) {
    for (const t of c.dau_hieu?.trieuChung ?? []) tc.set(chuan(t.ten), t.ten)
    for (const m of c.dau_hieu?.mach ?? []) mach.set(chuan(m.ten), m.ten)
    for (const l of c.dau_hieu?.luoi ?? []) luoi.set(chuan(l.ten), l.ten)
  }
  for (const p of phapTri.value) for (const t of p.trieuChung) tc.set(chuan(t), t)
  const sx = (m: Map<string, string>) => [...m.entries()].sort((a, b) => a[1].localeCompare(b[1], 'vi'))
  return { trieuChung: sx(tc), mach: sx(mach), luoi: sx(luoi) }
})
const tongDauHieu = computed(
  () => checklist.value.trieuChung.length + checklist.value.mach.length + checklist.value.luoi.length,
)
function tick(key: string) {
  const s = new Set(daTick.value)
  if (s.has(key)) s.delete(key)
  else s.add(key)
  daTick.value = s
}

/** Chấm điểm: khớp mấy dấu hiệu trên tổng dấu hiệu của chứng / pháp trị ấy. */
function chamChung(c: ChungRow) {
  const ds = [
    ...(c.dau_hieu?.trieuChung ?? []).map((t) => chuan(t.ten)),
    ...(c.dau_hieu?.mach ?? []).map((m) => chuan(m.ten)),
    ...(c.dau_hieu?.luoi ?? []).map((l) => chuan(l.ten)),
  ]
  const khop = ds.filter((k) => daTick.value.has(k)).length
  return { khop, tong: ds.length, ti: ds.length ? khop / ds.length : 0 }
}
function chamPhapTri(p: PhapTriRow) {
  const ds = p.trieuChung.map(chuan)
  const khop = ds.filter((k) => daTick.value.has(k)).length
  return { khop, tong: ds.length, ti: ds.length ? khop / ds.length : 0 }
}
const chungXepHang = computed(() =>
  chung.value
    .map((c) => ({ c, diem: chamChung(c) }))
    .sort((a, b) => b.diem.khop - a.diem.khop || b.diem.ti - a.diem.ti),
)
const phapTriXepHang = computed(() =>
  phapTri.value
    .map((p) => ({ p, diem: chamPhapTri(p) }))
    .sort((a, b) => b.diem.khop - a.diem.khop || b.diem.ti - a.diem.ti),
)
const coTick = computed(() => daTick.value.size > 0)

/**
 * LIÊN KẾT HAI CHIỀU. Chiều xuôi: tick dấu hiệu → xếp hạng chứng/pháp trị.
 * Chiều ngược: rê hoặc chốt một chứng/pháp trị → dấu hiệu CỦA NÓ sáng lên trong checklist, để thấy
 * ngay "chứng này đòi những dấu gì, người bệnh đã có mấy dấu". Thiếu chiều ngược thì thầy thuốc phải
 * tự nhớ chứng nào gồm dấu nào — đúng thứ máy nên gánh.
 */
const soiKeys = ref<Set<string>>(new Set())
function keysCuaChung(c: ChungRow): string[] {
  return [
    ...(c.dau_hieu?.trieuChung ?? []).map((t) => chuan(t.ten)),
    ...(c.dau_hieu?.mach ?? []).map((m) => chuan(m.ten)),
    ...(c.dau_hieu?.luoi ?? []).map((l) => chuan(l.ten)),
  ]
}
function soiChung(c: ChungRow | null) {
  soiKeys.value = c ? new Set(keysCuaChung(c)) : new Set()
}
function soiPhapTri(p: PhapTriRow | null) {
  soiKeys.value = p ? new Set(p.trieuChung.map(chuan)) : new Set()
}
/** Khi đã chốt một chứng thì giữ nguyên vùng soi của chứng ấy (không cần rê chuột). */
const soiHienHanh = computed(() => {
  if (soiKeys.value.size) return soiKeys.value
  const c = chung.value.find((x) => x.slug === chonSlug.value)
  return c ? new Set(keysCuaChung(c)) : new Set<string>()
})
/**
 * "Lấy dấu hiệu của chứng này" — THAY THẾ bộ tick hiện có, không cộng dồn.
 * Cộng dồn thì muốn xem chứng khác phải bỏ tick từng cái một; và điểm của mọi chứng đều phình lên
 * vì bộ tick lẫn dấu hiệu của chứng trước. Bấm lại chính chứng đang lấy thì nhả hết.
 */
function tickTatCa(c: ChungRow) {
  if (chungDangLay.value === c.slug) {
    daTick.value = new Set()
    chungDangLay.value = null
    return
  }
  daTick.value = new Set(keysCuaChung(c))
  chungDangLay.value = c.slug
}
/** Tick tay một dấu hiệu là thầy thuốc tự hỏi bệnh — thoát khỏi chế độ "lấy theo chứng". */
watch(daTick, () => {
  const c = chung.value.find((x) => x.slug === chungDangLay.value)
  if (!c) return
  const ds = keysCuaChung(c)
  const khop = ds.length === daTick.value.size && ds.every((k) => daTick.value.has(k))
  if (!khop) chungDangLay.value = null
})

const chungDangChon = computed(() => chung.value.find((r) => r.slug === chonSlug.value) ?? null)
watch(chungDangChon, (c) => {
  emit('chon', c ? {
    slug: c.slug, ten: c.ten, idBaiThuoc: c.id_bai_thuoc,
    phuongTen: c.chu_phuong?.ten ?? '', viThuoc: c.chu_phuong?.viThuoc ?? [],
  } : null)
})
function chonChung(slug: string) {
  chonSlug.value = chonSlug.value === slug ? null : slug
  moChiTiet.value = chonSlug.value
}

const PHAN_LOAI_TEN: Record<string, string> = {
  'kinh-chung': 'Kinh chứng', 'phu-chung': 'Phủ chứng', 'bien-chung': 'Biến chứng', 'kiem-chung': 'Kiêm chứng',
}
</script>

<template>
  <div class="thdc">
    <!-- ① THỂ TRẠNG ĐO ĐƯỢC -->
    <div class="thdc-head">
      <span class="thdc-label">Lý luận Thương Hàn</span>
      <b v-if="kinhTen" class="thdc-kinh">{{ kinhTen }}</b>
      <span v-if="theTrang" class="thdc-the">{{ theTrang }}</span>
      <span v-if="kinhSlug && !chac" class="thdc-ngo">định vị chưa chắc — xem như gợi ý</span>
    </div>

    <p v-if="!kinhSlug" class="thdc-empty">Ca này chưa định vị được kinh nào theo Lục Kinh.</p>
    <p v-else-if="loading" class="thdc-empty">Đang nạp chứng &amp; pháp trị của kinh {{ kinhTen }}…</p>
    <p v-else-if="!chung.length && !phapTri.length" class="thdc-empty">
      Kinh {{ kinhTen }} chưa dựng chứng nào và chưa có pháp trị nào gắn kinh này.
    </p>

    <template v-else>
      <!-- ② HỎI NGƯỜI BỆNH -->
      <div class="thdc-buoc">
        <span class="thdc-buoc-so">1</span>
        <span class="thdc-buoc-ten">Hỏi người bệnh</span>
        <span class="thdc-buoc-phu">
          {{ tongDauHieu }} dấu hiệu của kinh {{ kinhTen }} — bấm dấu hiệu người bệnh CÓ; rê vào một chứng bên dưới để xem dấu hiệu của chứng ấy
        </span>
        <button v-if="coTick" type="button" class="thdc-bo" @click="daTick = new Set(); chungDangLay = null">✕ bỏ chọn ({{ daTick.size }})</button>
      </div>

      <div class="thdc-ds">
        <div v-if="checklist.trieuChung.length" class="thdc-nhom">
          <span class="thdc-nhom-ten">Triệu chứng</span>
          <button
            v-for="[k, ten] in checklist.trieuChung" :key="k" type="button"
            class="thdc-chip" :class="{ 'is-on': daTick.has(k), 'is-soi': soiHienHanh.has(k) }" @click="tick(k)"
          >{{ ten }}</button>
        </div>
        <div v-if="checklist.mach.length" class="thdc-nhom">
          <span class="thdc-nhom-ten">Mạch</span>
          <button
            v-for="[k, ten] in checklist.mach" :key="k" type="button"
            class="thdc-chip thdc-chip--mach" :class="{ 'is-on': daTick.has(k), 'is-soi': soiHienHanh.has(k) }" @click="tick(k)"
          >{{ ten }}</button>
        </div>
        <div v-if="checklist.luoi.length" class="thdc-nhom">
          <span class="thdc-nhom-ten">Lưỡi</span>
          <button
            v-for="[k, ten] in checklist.luoi" :key="k" type="button"
            class="thdc-chip thdc-chip--luoi" :class="{ 'is-on': daTick.has(k), 'is-soi': soiHienHanh.has(k) }" @click="tick(k)"
          >{{ ten }}</button>
        </div>
      </div>

      <!-- ③ KHỚP NHẤT -->
      <div class="thdc-buoc">
        <span class="thdc-buoc-so">2</span>
        <span class="thdc-buoc-ten">Khớp nhất</span>
        <span class="thdc-buoc-phu">
          <template v-if="coTick">xếp theo số dấu hiệu khớp — bấm để chốt và đưa bài thuốc xuống thang</template>
          <template v-else>chưa tick dấu hiệu nào; dưới đây là toàn bộ {{ chung.length }} chứng &amp; {{ phapTri.length }} pháp trị của kinh</template>
        </span>
      </div>

      <div class="thdc-ket">
        <div class="thdc-cot">
          <span class="thdc-cot-ten">Chứng – phương Thương Hàn</span>
          <button
            v-for="(x, i) in chungXepHang" :key="x.c.slug" type="button"
            class="thdc-hang"
            :class="{ 'is-chon': chonSlug === x.c.slug, 'is-mo': coTick && i === 0 && x.diem.khop > 0 }"
            v-show="moDanhSach || i < 6"
            :title="`Dấu hiệu của chứng này: ${keysCuaChung(x.c).length} — rê chuột để soi trên checklist`"
            @mouseenter="soiChung(x.c)"
            @mouseleave="soiChung(null)"
            @focus="soiChung(x.c)"
            @blur="soiChung(null)"
            @click="chonChung(x.c.slug)"
          >
            <span class="thdc-phan">{{ PHAN_LOAI_TEN[x.c.phan_loai] || x.c.phan_loai }}</span>
            <span class="thdc-ten">{{ x.c.ten }}</span>
            <span v-if="coTick" class="thdc-diem" :class="{ 'is-tot': x.diem.khop > 0 }">{{ x.diem.khop }}/{{ x.diem.tong }}</span>
            <span class="thdc-phuong">{{ x.c.chu_phuong?.ten }}</span>
            <span
              class="thdc-tickall"
              :class="{ 'is-dang-lay': chungDangLay === x.c.slug }"
              :title="chungDangLay === x.c.slug
                ? 'Đang lấy dấu hiệu của chứng này — bấm để nhả hết'
                : 'Lấy trọn bộ dấu hiệu của chứng này (thay cho bộ đang tick)'"
              @click.stop="tickTatCa(x.c)"
            >{{ chungDangLay === x.c.slug ? '⊖' : '⊕' }}</span>
          </button>
        </div>

        <div class="thdc-cot">
          <span class="thdc-cot-ten">Pháp trị của phòng chẩn trị</span>
          <div
            v-for="(x, i) in phapTriXepHang" :key="x.p.id"
            class="thdc-hang thdc-hang--pt"
            v-show="moDanhSach || i < 6"
            :title="x.p.trieuChung.join(' · ')"
            @mouseenter="soiPhapTri(x.p)"
            @mouseleave="soiPhapTri(null)"
          >
            <div class="thdc-pt-tren">
              <span class="thdc-ten">{{ x.p.theBenh }}</span>
              <span v-if="coTick" class="thdc-diem" :class="{ 'is-tot': x.diem.khop > 0 }">{{ x.diem.khop }}/{{ x.diem.tong }}</span>
            </div>
            <div class="thdc-pt-duoi">
              <span v-if="x.p.nguyenTac" class="thdc-nt">{{ x.p.nguyenTac }}</span>
              <span class="thdc-phuong">{{ x.p.tenBaiThuoc || '— chưa gắn bài —' }}</span>
            </div>
          </div>
        </div>
      </div>
      <button type="button" class="thdc-xem" @click="moDanhSach = !moDanhSach">
        {{ moDanhSach ? '▲ Thu gọn danh sách' : `▼ Xem đủ ${chung.length} chứng · ${phapTri.length} pháp trị` }}
      </button>

      <!-- ④ CHI TIẾT CHỨNG ĐÃ CHỐT -->
      <div v-if="chungDangChon && moChiTiet === chungDangChon.slug" class="thdc-chitiet">
        <div class="thdc-ct-head">
          <b>{{ chungDangChon.ten }}</b>
          <span v-if="chungDangChon.dieu_van?.length" class="thdc-dieu">Điều {{ chungDangChon.dieu_van.join(', ') }}</span>
          <span v-if="chungDangChon.id_bai_thuoc" class="thdc-kho">đã đưa vào thang · kho #{{ chungDangChon.id_bai_thuoc }}</span>
          <button type="button" class="thdc-dong" @click="moChiTiet = null">✕</button>
        </div>
        <p class="thdc-decuong">{{ chungDangChon.de_cuong }}</p>
        <p class="thdc-mach"><b>Mạch:</b> {{ chungDangChon.mach }}<template v-if="chungDangChon.luoi"> · <b>Lưỡi:</b> {{ chungDangChon.luoi }}</template></p>
        <p v-if="chungDangChon.phap_tri" class="thdc-phap"><b>Pháp trị:</b> {{ chungDangChon.phap_tri }}</p>

        <div v-if="chungDangChon.chu_phuong" class="thdc-rx">
          <div class="thdc-rx-head">
            <b>{{ chungDangChon.chu_phuong.ten }}</b> <em>{{ chungDangChon.chu_phuong.han }}</em>
            <span class="thdc-he">{{ chungDangChon.chu_phuong.heQuyDoi }}</span>
          </div>
          <table class="thdc-vi">
            <tbody>
              <tr v-for="v in chungDangChon.chu_phuong.viThuoc" :key="v.ten" :class="{ 'is-canh': v.canhBaoLieu }">
                <td class="thdc-vi-ten">{{ v.ten }}</td>
                <td class="thdc-vi-lieu">{{ v.lieuGram != null ? `${v.lieuGram}g` : '—' }}</td>
                <td class="thdc-vi-goc">{{ v.lieuGoc }}</td>
                <td class="thdc-vi-vai">{{ v.vaiTro || '' }}</td>
              </tr>
            </tbody>
          </table>
          <p v-for="v in (chungDangChon.chu_phuong.viThuoc || []).filter((x) => x.canhBaoLieu)" :key="`w-${v.ten}`" class="thdc-canh">
            ⚠ {{ v.canhBaoLieu }}
          </p>
        </div>

        <div v-if="chungDangChon.gia_giam?.length" class="thdc-gg">
          <span class="thdc-sublabel">Gia giảm</span>
          <ul><li v-for="(g, i) in chungDangChon.gia_giam" :key="i"><b>{{ g.khi }}</b> → {{ g.thi }}</li></ul>
        </div>
        <div v-if="chungDangChon.cam_ky?.length" class="thdc-camky">
          <span class="thdc-sublabel thdc-sublabel--do">Cấm kỵ</span>
          <ul><li v-for="(k, i) in chungDangChon.cam_ky" :key="i">{{ k }}</li></ul>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.thdc { margin-bottom: var(--space-3); padding: 10px 12px; border: 1px solid var(--brown-200, #e0d5c5); border-left: 3px solid var(--brown-600, #7a5a3c); border-radius: 8px; background: #fbf7f1; }
.thdc-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.thdc-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--brown-700, #5a4636); }
.thdc-kinh { font-size: var(--font-size-sm); color: var(--brown-800, #43342a); }
.thdc-the { font-size: 10px; padding: 1px 8px; border-radius: 999px; background: var(--surface-2, #f6f1e9); color: var(--brown-700, #5a4636); text-transform: none; }
.thdc-ngo { font-size: 10px; padding: 1px 8px; border-radius: 999px; background: #f6e9d8; color: #8a5a20; text-transform: none; }
.thdc-empty { margin: 6px 0 0; font-size: 11px; color: var(--gray-600, #6b7280); text-transform: none; }
.thdc-buoc { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; margin-top: 10px; }
.thdc-buoc-so { width: 16px; height: 16px; border-radius: 50%; background: var(--brown-700, #5a4636); color: #fff; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.thdc-buoc-ten { font-size: var(--font-size-xs); font-weight: 700; color: var(--brown-800, #43342a); }
.thdc-buoc-phu { font-size: 10px; color: var(--gray-600, #6b7280); text-transform: none; }
.thdc-bo { margin-left: auto; padding: 1px 8px; border: none; background: none; color: var(--gray-600, #6b7280); font-size: 10px; cursor: pointer; text-transform: none; }
.thdc-bo:hover { color: #8f2f21; }
.thdc-ds { margin-top: 5px; display: flex; flex-direction: column; gap: 4px; }
.thdc-nhom { display: flex; align-items: flex-start; gap: 5px; flex-wrap: wrap; }
.thdc-nhom-ten { min-width: 62px; padding-top: 3px; font-size: 10px; font-weight: 700; color: var(--brown-700, #5a4636); }
.thdc-chip { padding: 2px 9px; border: 1px solid var(--brown-200, #e0d5c5); border-radius: 999px; background: #fff; color: var(--gray-700, #4b5563); font-size: 11px; cursor: pointer; text-transform: none; }
.thdc-chip:hover { border-color: var(--brown-500, #8d6b4b); }
.thdc-chip.is-on { background: var(--brown-700, #5a4636); border-color: var(--brown-700, #5a4636); color: #fff; font-weight: 600; }
.thdc-chip--mach.is-on { background: #35638d; border-color: #35638d; }
.thdc-chip--luoi.is-on { background: #b23a29; border-color: #b23a29; }
.thdc-ket { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 5px; }
@media (max-width: 980px) { .thdc-ket { grid-template-columns: 1fr; } }
.thdc-cot { display: flex; flex-direction: column; gap: 3px; }
.thdc-cot-ten { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--brown-700, #5a4636); }
.thdc-hang { display: flex; align-items: center; gap: 6px; width: 100%; padding: 4px 8px; border: 1px solid var(--brown-200, #e0d5c5); border-radius: 7px; background: #fff; cursor: pointer; text-align: left; }
.thdc-hang:hover { border-color: var(--brown-500, #8d6b4b); }
.thdc-hang.is-chon { border-color: var(--brown-700, #5a4636); box-shadow: 0 0 0 2px rgba(122, 90, 60, 0.15); }
.thdc-hang.is-mo { background: rgba(79, 125, 57, 0.06); }
.thdc-hang--pt { cursor: default; }
.thdc-phan { font-size: 9px; font-weight: 700; padding: 1px 6px; border-radius: 999px; background: #ece4d8; color: #6b5540; white-space: nowrap; }
.thdc-ten { flex: 1; font-size: 11px; font-weight: 600; color: var(--brown-800, #43342a); }
.thdc-nt { font-size: 10px; color: var(--gray-600, #6b7280); text-transform: none; }
.thdc-diem { font-size: 10px; font-weight: 700; padding: 0 6px; border-radius: 999px; background: rgba(0, 0, 0, 0.06); color: var(--gray-600, #6b7280); }
.thdc-diem.is-tot { background: rgba(79, 125, 57, 0.15); color: #3d6029; }
.thdc-phuong { font-size: 10px; color: var(--gray-600, #6b7280); text-transform: none; max-width: 40%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.thdc-xem { margin-top: 6px; padding: 2px 8px; border: none; background: none; color: var(--brown-700, #5a4636); font-size: 10px; cursor: pointer; text-transform: none; }
.thdc-chitiet { margin-top: 9px; padding: 9px 10px; border: 1px dashed var(--brown-200, #e0d5c5); border-radius: 8px; background: #fff; }
.thdc-ct-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: var(--font-size-sm); }
.thdc-dieu, .thdc-kho, .thdc-he { font-size: 10px; padding: 1px 8px; border-radius: 999px; text-transform: none; }
.thdc-dieu { background: var(--surface-2, #f6f1e9); color: var(--brown-700, #5a4636); }
.thdc-kho { background: rgba(79, 125, 57, 0.12); color: #3d6029; font-weight: 700; }
.thdc-he { background: none; color: var(--gray-600, #6b7280); margin-left: auto; }
.thdc-dong { border: none; background: none; color: var(--gray-600, #6b7280); cursor: pointer; font-size: 12px; }
.thdc-decuong { margin: 6px 0 0; font-size: 11px; line-height: 1.6; color: var(--gray-800, #374151); text-transform: none; }
.thdc-mach, .thdc-phap { margin: 4px 0 0; font-size: 11px; color: var(--gray-700, #4b5563); text-transform: none; }
.thdc-sublabel { display: block; margin-bottom: 3px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--brown-700, #5a4636); }
.thdc-sublabel--do { color: #8f2f21; }
.thdc-gg, .thdc-camky { margin-top: 8px; }
.thdc-gg ul, .thdc-camky ul { margin: 0; padding-left: 17px; font-size: 11px; line-height: 1.6; color: var(--gray-700, #4b5563); text-transform: none; }
.thdc-camky { padding: 6px 9px; border-radius: 7px; background: rgba(178, 58, 41, 0.06); }
.thdc-camky ul { color: #7a3226; }
.thdc-rx { margin-top: 8px; }
.thdc-rx-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: var(--font-size-xs); }
.thdc-rx-head em { font-style: normal; opacity: 0.6; }
.thdc-vi { width: 100%; margin-top: 5px; border-collapse: collapse; font-size: 11px; }
.thdc-vi td { padding: 2px 4px; border-bottom: 1px solid rgba(0, 0, 0, 0.05); }
.thdc-vi tr.is-canh td { background: rgba(178, 58, 41, 0.05); }
.thdc-vi-ten { font-weight: 600; color: var(--brown-800, #43342a); }
.thdc-vi-lieu { width: 54px; font-weight: 700; text-align: right; }
.thdc-vi-goc { width: 96px; color: var(--gray-600, #6b7280); text-transform: none; }
.thdc-vi-vai { width: 40px; color: var(--gray-600, #6b7280); }
.thdc-canh { margin: 4px 0 0; font-size: 10px; line-height: 1.5; color: #8a4b20; text-transform: none; }
.thdc-hang--pt { display: flex; flex-direction: column; align-items: stretch; gap: 2px; cursor: default; }
.thdc-pt-tren, .thdc-pt-duoi { display: flex; align-items: center; gap: 6px; }
.thdc-pt-duoi { font-size: 10px; }
.thdc-hang--pt .thdc-ten { white-space: normal; }
.thdc-hang--pt .thdc-phuong { margin-left: auto; max-width: 55%; }
.thdc-chip.is-soi { border-color: var(--brown-700, #5a4636); border-width: 2px; padding: 1px 8px; }
.thdc-chip.is-on.is-soi { box-shadow: 0 0 0 2px rgba(122, 90, 60, 0.3); }
.thdc-tickall { padding: 0 4px; font-size: 13px; color: var(--gray-500, #9ca3af); cursor: pointer; }
.thdc-tickall:hover { color: var(--brown-700, #5a4636); }
.thdc-tickall.is-dang-lay { color: var(--brown-700, #5a4636); font-weight: 700; }
</style>
