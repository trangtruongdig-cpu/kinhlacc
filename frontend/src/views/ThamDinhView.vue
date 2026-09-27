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

    <p class="td-tong">{{ tong }} lời phê</p>

    <p v-if="dang_tai" class="td-trong">Đang tải…</p>
    <p v-else-if="!danh_sach.length" class="td-trong">Không có lời phê nào ở trạng thái này.</p>

    <article v-for="x in danh_sach" :key="x.id" class="td-the">
      <div class="td-the-dau">
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
.td-ap {
  background: #6a8f5f;
  color: #fff;
  border-color: #5a7c50;
}
.td-nut button:disabled {
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
