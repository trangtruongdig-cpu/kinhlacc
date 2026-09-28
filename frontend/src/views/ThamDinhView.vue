<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { api } from '@/services/api'

/**
 * Màn duyệt bản sửa của bot thẩm định.
 *
 * Trang này khoá bằng `meta.page: 'tham-dinh'` — KHÔNG khai vào `constants/pages.ts`, nên
 * `authStore.can()` chỉ trả true cho vai trò Quản Trị. Cùng lối đã dùng cho tab `su-co`.
 */

interface NhanXet {
  id: number
  lop: string
  kieu: string
  truong: string | null
  trich_dan: string
  nhan_xet: string
  de_xuat: string | null
  bac_can_cu: number | null
  trang_thai: string
  bo: string
  slug: string
  tieu_de: string
}

const dang_tai = ref(false)
const danh_sach = ref<NhanXet[]>([])
const tong = ref(0)
const loc_bo = ref('')
const loc_trang_thai = ref('moi')
const thong_bao = ref<{ id: number; chu: string; xau: boolean } | null>(null)
const dang_xu_ly = ref<number | null>(null)
const da_chon = ref<Set<number>>(new Set())
const dang_chay_lo = ref(false)
const ket_qua_lo = ref<{ xong: number; tu_choi: number; loi: string[] } | null>(null)

const NHAN_BO: Record<string, string> = {
  huyet_vi: 'Huyệt Vị',
  kinh_mach: 'Kinh Mạch',
  benh_hoc: 'Bệnh Học',
  cham_cuu_tri_benh: 'Châm Cứu Trị Bệnh',
  duoc_lieu: 'Dược Liệu',
  bai_thuoc: 'Bài Thuốc',
  bai_viet: 'Bài Viết',
}

const cac_bo = computed(() => [...new Set(danh_sach.value.map((x) => x.bo))])

async function tai() {
  dang_tai.value = true
  try {
    const q = new URLSearchParams({ trangThai: loc_trang_thai.value, moiTrang: '50' })
    if (loc_bo.value) q.set('bo', loc_bo.value)
    const r = await api.get<{ danhSach: NhanXet[]; tong: number }>(`/tham-dinh/nhan-xet?${q}`)
    danh_sach.value = r.danhSach || []
    tong.value = r.tong || 0
    da_chon.value = new Set()
    ket_qua_lo.value = null
  } catch (e) {
    thong_bao.value = { id: 0, chu: `Không tải được: ${(e as Error).message}`, xau: true }
  } finally {
    dang_tai.value = false
  }
}

async function doi_trang_thai(x: NhanXet, trangThai: string) {
  dang_xu_ly.value = x.id
  try {
    await api.patch(`/tham-dinh/nhan-xet/${x.id}`, { trangThai })
    danh_sach.value = danh_sach.value.filter((y) => y.id !== x.id)
    tong.value = Math.max(tong.value - 1, 0)
  } catch (e) {
    thong_bao.value = { id: x.id, chu: (e as Error).message, xau: true }
  } finally {
    dang_xu_ly.value = null
  }
}

/**
 * Áp bản sửa vào kho. Có thể bị TỪ CHỐI với lý do đọc được — thường là "bản sửa có N thay
 * đổi, chỉ M chỗ định vị được". Hiện nguyên văn lý do thay vì gộp thành "lỗi": người duyệt
 * cần biết mình phải đi sửa tay, không phải thử lại.
 */
async function ap(x: NhanXet) {
  dang_xu_ly.value = x.id
  try {
    const r = await api.post<{ ok: boolean; lyDo?: string; soLanThay?: number }>(
      `/tham-dinh/nhan-xet/${x.id}/ap`,
      {},
    )
    if (r.ok) {
      danh_sach.value = danh_sach.value.filter((y) => y.id !== x.id)
      tong.value = Math.max(tong.value - 1, 0)
      thong_bao.value = { id: 0, chu: `Đã áp vào kho (${r.soLanThay} chỗ).`, xau: false }
    } else {
      thong_bao.value = { id: x.id, chu: r.lyDo || 'Không áp được.', xau: true }
    }
  } catch (e) {
    thong_bao.value = { id: x.id, chu: (e as Error).message, xau: true }
  } finally {
    dang_xu_ly.value = null
  }
}

function bat_tat(id: number) {
  const t = new Set(da_chon.value)
  if (t.has(id)) t.delete(id)
  else t.add(id)
  da_chon.value = t
}

const co_the_ap = computed(() => danh_sach.value.filter((x) => x.de_xuat))

function chon_het_ap_duoc() {
  da_chon.value = new Set(co_the_ap.value.map((x) => x.id))
}

function bo_chon_het() {
  da_chon.value = new Set()
}

/**
 * Áp hàng loạt. Chạy TUẦN TỰ, không song song: mỗi lượt áp là một giao dịch trên cùng
 * một kết nối sang kho, bắn song song chỉ làm chúng xếp hàng sau nhau mà khó đọc lỗi hơn.
 *
 * Không dừng khi gặp một cái từ chối — cái bị từ chối là chuyện thường (bản sửa có nhiều
 * thay đổi mà chỉ định vị được một phần), và dừng cả mẻ vì nó thì phí.
 */
async function ap_hang_loat() {
  const ds = danh_sach.value.filter((x) => da_chon.value.has(x.id) && x.de_xuat)
  if (!ds.length) return
  dang_chay_lo.value = true
  ket_qua_lo.value = { xong: 0, tu_choi: 0, loi: [] }
  try {
    for (const x of ds) {
      try {
        const r = await api.post<{ ok: boolean; lyDo?: string }>(
          `/tham-dinh/nhan-xet/${x.id}/ap`,
          {},
        )
        if (r.ok) {
          ket_qua_lo.value.xong += 1
          danh_sach.value = danh_sach.value.filter((y) => y.id !== x.id)
          tong.value = Math.max(tong.value - 1, 0)
        } else {
          ket_qua_lo.value.tu_choi += 1
          ket_qua_lo.value.loi.push(`${x.tieu_de}: ${r.lyDo || 'không áp được'}`)
        }
      } catch (e) {
        ket_qua_lo.value.tu_choi += 1
        ket_qua_lo.value.loi.push(`${x.tieu_de}: ${(e as Error).message}`)
      }
    }
  } finally {
    dang_chay_lo.value = false
    da_chon.value = new Set()
  }
}

function duong_dan(x: NhanXet): string {
  const tien_to: Record<string, string> = {
    huyet_vi: '/huyet/',
    kinh_mach: '/kinh/',
    benh_hoc: '/benh-hoc/',
    cham_cuu_tri_benh: '/cham-cuu-tri-benh/',
    duoc_lieu: '/duoc-lieu/',
    bai_thuoc: '/bai-thuoc/',
  }
  return `${tien_to[x.bo] || `/${x.bo}/`}${x.slug}/`
}

onMounted(tai)
</script>

<template>
  <div class="tham-dinh">
    <header class="td-dau">
      <div>
        <h1>Thẩm Định Thư Viện</h1>
        <p class="td-phu">
          Lời phê của bot, kèm bản sửa soạn sẵn. Bấm <strong>Áp vào kho</strong> thì bản cũ được
          giữ trong <code>revisions</code> — lùi lại được.
        </p>
      </div>
      <div class="td-loc">
        <select v-model="loc_trang_thai" @change="tai">
          <option value="moi">Chờ duyệt</option>
          <option value="da_duyet">Đã duyệt, chưa áp</option>
          <option value="da_ap">Đã áp vào kho</option>
          <option value="bo_qua">Đã bỏ qua</option>
        </select>
        <select v-model="loc_bo" @change="tai">
          <option value="">Mọi bộ</option>
          <option v-for="b in cac_bo" :key="b" :value="b">{{ NHAN_BO[b] || b }}</option>
        </select>
        <button type="button" @click="tai" :disabled="dang_tai">Tải lại</button>
      </div>
    </header>

    <p v-if="thong_bao && thong_bao.id === 0" :class="['td-bao', thong_bao.xau ? 'xau' : 'tot']">
      {{ thong_bao.chu }}
    </p>

    <div v-if="danh_sach.length" class="td-lo">
      <label class="td-chon-het">
        <input
          type="checkbox"
          :checked="da_chon.size > 0 && da_chon.size === co_the_ap.length"
          :indeterminate="da_chon.size > 0 && da_chon.size < co_the_ap.length"
          @change="da_chon.size === co_the_ap.length ? bo_chon_het() : chon_het_ap_duoc()"
        />
        Chọn {{ co_the_ap.length }} lời phê có bản sửa
      </label>
      <span class="td-dem">đã chọn {{ da_chon.size }}</span>
      <button
        type="button"
        class="td-ap"
        :disabled="!da_chon.size || dang_chay_lo"
        @click="ap_hang_loat"
      >
        {{ dang_chay_lo ? 'Đang áp…' : `Áp ${da_chon.size} bản sửa vào kho` }}
      </button>
    </div>

    <div v-if="ket_qua_lo" class="td-bao" :class="ket_qua_lo.tu_choi ? 'xau' : 'tot'">
      Áp xong {{ ket_qua_lo.xong }} · từ chối {{ ket_qua_lo.tu_choi }}
      <ul v-if="ket_qua_lo.loi.length" class="td-ly-do">
        <li v-for="(l, i) in ket_qua_lo.loi" :key="i">{{ l }}</li>
      </ul>
    </div>

    <p class="td-tong">{{ tong }} lời phê</p>

    <p v-if="dang_tai" class="td-trong">Đang tải…</p>
    <p v-else-if="!danh_sach.length" class="td-trong">Không có lời phê nào ở trạng thái này.</p>

    <article v-for="x in danh_sach" :key="x.id" class="td-the">
      <div class="td-the-dau">
        <input
          v-if="x.de_xuat"
          type="checkbox"
          :checked="da_chon.has(x.id)"
          :disabled="dang_chay_lo"
          @change="bat_tat(x.id)"
        />
        <a :href="duong_dan(x)" target="_blank" rel="noopener">{{ x.tieu_de }}</a>
        <span class="td-nhan">{{ NHAN_BO[x.bo] || x.bo }}</span>
        <span class="td-nhan td-kieu">{{ x.kieu }}</span>
        <span v-if="x.truong" class="td-nhan">{{ x.truong }}</span>
        <span v-if="x.bac_can_cu" class="td-nhan">bậc {{ x.bac_can_cu }}</span>
      </div>

      <p class="td-phe">{{ x.nhan_xet }}</p>

      <div class="td-doi">
        <div class="td-cot">
          <h3>Bản gốc</h3>
          <blockquote>{{ x.trich_dan }}</blockquote>
        </div>
        <div class="td-cot">
          <h3>Bản sửa</h3>
          <blockquote v-if="x.de_xuat" class="td-sua">{{ x.de_xuat }}</blockquote>
          <p v-else class="td-trong">Chỉ nêu vấn đề, không đề xuất bản sửa.</p>
        </div>
      </div>

      <p v-if="thong_bao && thong_bao.id === x.id" :class="['td-bao', thong_bao.xau ? 'xau' : 'tot']">
        {{ thong_bao.chu }}
      </p>

      <div class="td-nut">
        <button
          type="button"
          class="td-ap"
          :disabled="dang_xu_ly === x.id || !x.de_xuat"
          @click="ap(x)"
        >
          Áp vào kho
        </button>
        <button type="button" :disabled="dang_xu_ly === x.id" @click="doi_trang_thai(x, 'da_duyet')">
          Duyệt, sửa tay
        </button>
        <button type="button" :disabled="dang_xu_ly === x.id" @click="doi_trang_thai(x, 'bo_qua')">
          Bỏ qua
        </button>
      </div>
    </article>
  </div>
</template>

<style scoped>
.tham-dinh {
  padding: 1.25rem;
  max-width: 1100px;
}
.td-dau {
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}
.td-dau h1 {
  margin: 0 0 0.25rem;
  font-size: 1.4rem;
}
.td-phu {
  margin: 0;
  color: var(--mau-chu-nhat, #6b5d4f);
  font-size: 0.9rem;
  max-width: 60ch;
}
.td-loc {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.td-loc select,
.td-loc button,
.td-nut button {
  padding: 0.4rem 0.7rem;
  border: 1px solid var(--mau-vien, #d8cfc2);
  border-radius: 6px;
  background: #fff;
  font: inherit;
  cursor: pointer;
}
.td-tong {
  margin: 0 0 0.75rem;
  color: var(--mau-chu-nhat, #6b5d4f);
  font-size: 0.9rem;
}
.td-the {
  border: 1px solid var(--mau-vien, #d8cfc2);
  border-radius: 8px;
  padding: 0.9rem;
  margin-bottom: 0.9rem;
  background: var(--mau-nen-the, #fffdf9);
}
.td-the-dau {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}
.td-the-dau a {
  font-weight: 600;
  color: inherit;
}
.td-nhan {
  font-size: 0.75rem;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  background: var(--mau-nen-nhan, #f0e9dd);
  color: var(--mau-chu-nhat, #6b5d4f);
}
.td-kieu {
  font-family: ui-monospace, monospace;
}
.td-phe {
  margin: 0 0 0.7rem;
  line-height: 1.5;
}
.td-doi {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}
.td-cot h3 {
  margin: 0 0 0.3rem;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--mau-chu-nhat, #6b5d4f);
}
.td-doi blockquote {
  margin: 0;
  padding: 0.55rem 0.7rem;
  border-left: 3px solid var(--mau-vien, #d8cfc2);
  background: #fff;
  font-size: 0.9rem;
  line-height: 1.55;
  white-space: pre-wrap;
}
.td-doi .td-sua {
  border-left-color: #6a8f5f;
}
.td-nut {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  flex-wrap: wrap;
}
/*
 * ⚠️ Phải đủ mạnh để thắng style `button` toàn cục của app. Bản đầu chỉ đặt
 * `background` + `color: #fff`; style chung đè mất màu nền, còn chữ trắng thì ở lại —
 * ra một nút TRẮNG TRƠN không đọc được chữ, mà nhìn ảnh chụp thì tưởng nút thiếu nhãn.
 */
.tham-dinh button.td-ap,
.tham-dinh button.td-ap:hover {
  background-color: #6a8f5f !important;
  color: #fff !important;
  border-color: #5a7c50 !important;
}
.tham-dinh button.td-ap:disabled {
  background-color: #b9c9b3 !important;
  border-color: #b9c9b3 !important;
}
.td-lo {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
  padding: 0.6rem 0.75rem;
  margin-bottom: 0.75rem;
  border: 1px solid var(--mau-vien, #d8cfc2);
  border-radius: 8px;
  background: var(--mau-nen-the, #fffdf9);
}
.td-chon-het {
  display: flex;
  gap: 0.4rem;
  align-items: center;
  cursor: pointer;
}
.td-dem {
  color: var(--mau-chu-nhat, #6b5d4f);
  font-size: 0.88rem;
}
.td-lo button {
  margin-left: auto;
  padding: 0.4rem 0.7rem;
  border: 1px solid var(--mau-vien, #d8cfc2);
  border-radius: 6px;
  font: inherit;
  cursor: pointer;
}
.td-ly-do {
  margin: 0.4rem 0 0;
  padding-left: 1.1rem;
}
.td-ly-do li {
  margin-bottom: 0.2rem;
}
.td-nut button:disabled,
.td-lo button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.td-bao {
  margin: 0.6rem 0 0;
  padding: 0.5rem 0.7rem;
  border-radius: 6px;
  font-size: 0.88rem;
  line-height: 1.5;
}
.td-bao.xau {
  background: #fdf0ee;
  color: #8a3a2c;
}
.td-bao.tot {
  background: #eef5ea;
  color: #3f6134;
}
.td-trong {
  color: var(--mau-chu-nhat, #6b5d4f);
  font-size: 0.9rem;
}
@media (max-width: 720px) {
  .td-doi {
    grid-template-columns: 1fr;
  }
}
</style>
