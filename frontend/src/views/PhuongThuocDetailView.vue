<script setup lang="ts">
/**
 * PhuongThuocDetailView — CHI TIẾT 1 BÀI THUỐC công khai (/bai-thuoc/:slug).
 * Thành phần liên kết NGƯỢC sang từ điển dược liệu (/duoc-lieu/:id) khi khớp được vị.
 * Dữ liệu: GET /phuong-thang/:slug (@Public).
 */
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import PublicTopBar from '@/components/PublicTopBar.vue'
import ThuVienNav from '@/components/ThuVienNav.vue'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import VanBanYVan from '@/components/VanBanYVan.vue'
import { api } from '@/services/api'
import { useDictLinks } from '@/lib/dictLinks'
import { headTinhKhop } from '@/lib/seoTinh'

interface ThanhPhan { ten: string; lieu: string; id: number | null }
interface Bai {
  id: number; ten: string; slug: string
  xuat_xu?: string | null; tac_gia?: string | null
  thanh_phan?: ThanhPhan[]; cach_dung?: string | null
  tac_dung?: string | null; ghi_chu?: string | null
}

const route = useRoute()
const links = useDictLinks()
const inApp = links.inApp
const bai = ref<Bai | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
// Phần phân tích dựng sẵn lúc build (scripts/phan-tich-bai-thuoc.mjs → phan-tich.json cạnh
// trang tĩnh). Chỉ đếm/liệt kê dữ liệu vị thuốc có sẵn; không có tệp (bài thêm sau lần build,
// hoặc máy dev) thì hai khối này đơn giản là không hiện.
interface HangVi { ten: string; id: number | null; lieu: string; tinh: string; vi: string; kinh: string[] }
interface PhanTich {
  pt: { soVi: number; soCoDuLieu: number; khi: [string, number][]; vi: [string, number][]; kinh: [string, number][]; bang: HangVi[] } | null
  lq: { slug: string; ten: string; chung: number }[]
}
const phanTich = ref<PhanTich | null>(null)
const ke = (ds: [string, number][]) => ds.slice(0, 4).map(([k, n]) => `${k} (${n})`).join(', ')

async function loadPhanTich(slug: string) {
  phanTich.value = null
  try {
    const r = await fetch(`/bai-thuoc/${encodeURIComponent(slug)}/phan-tich.json`)
    if (r.ok && (r.headers.get('content-type') || '').includes('json')) phanTich.value = await r.json()
  } catch { /* không có tệp phân tích — bỏ qua */ }
}

const xuatXuSlug = ref<string | null>(null)
const tacGiaSlug = ref<string | null>(null)

async function load(slug: string) {
  loading.value = true
  error.value = null
  bai.value = null
  try {
    bai.value = await api.get<Bai>(`/phuong-thang/${encodeURIComponent(slug)}`)
    const b = bai.value
    xuatXuSlug.value = null; tacGiaSlug.value = null
    if (b) {
      api.get<{ slug: string; context: string }[]>(`/nguon/by-phuong-thang/${b.id}`)
        .then((rs) => { for (const r of rs || []) { if (r.context === 'xuat_xu') xuatXuSlug.value = r.slug; else if (r.context === 'tac_gia') tacGiaSlug.value = r.slug } })
        .catch(() => {})
      // Tải thẳng từ HTML tĩnh → head đã đúng (tiêu đề ≤60 ký tự, chữ sửa tay trong CMS);
      // trước 30/09/2026 dòng dưới đè nó bằng tiêu đề 94–110 ký tự và Google đọc bản đè.
      if (!headTinhKhop()) {
        document.title = `${b.ten} — Bài Thuốc Đông Y`
        const vi = (b.thanh_phan || []).map((t) => t.ten).filter(Boolean).slice(0, 8).join(', ')
        const desc = `Bài thuốc ${b.ten}${b.tac_dung ? ': ' + b.tac_dung : ''}. Thành phần: ${vi}.`.slice(0, 160)
        const m = document.querySelector('meta[name="description"]')
        if (m) m.setAttribute('content', desc)
      }
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

watch(() => route.params.slug, (s) => { if (s) { load(String(s)); loadPhanTich(String(s)) } })
onMounted(() => { load(String(route.params.slug)); loadPhanTich(String(route.params.slug)) })
</script>

<template>
  <div class="pd">
    <PublicTopBar v-if="!inApp" title="Bài thuốc" />
    <!-- Thanh tab thư viện — giữ khách trong mạch tra cứu thay vì cụt đường ở Trang Chủ. -->
    <ThuVienNav v-if="!inApp" active="baithuoc" />
    <AppBreadcrumb v-if="!inApp" />

    <div class="pd-body">
      <div v-if="loading" class="pd-msg">Đang tải…</div>
      <div v-else-if="error" class="pd-msg pd-err">Không tìm thấy bài thuốc. {{ error }}</div>

      <article v-else-if="bai" class="pd-card">
        <h1 class="pd-title">{{ bai.ten }}</h1>
        <div class="pd-meta">
          <span v-if="bai.xuat_xu" class="pd-meta-item">Xuất xứ:
            <RouterLink v-if="xuatXuSlug" :to="links.nguon(xuatXuSlug)" class="pd-srclink"><strong>{{ bai.xuat_xu }}</strong></RouterLink>
            <strong v-else>{{ bai.xuat_xu }}</strong>
          </span>
          <span v-if="bai.tac_gia" class="pd-meta-item">Tác giả:
            <RouterLink v-if="tacGiaSlug" :to="links.nguon(tacGiaSlug)" class="pd-srclink"><strong>{{ bai.tac_gia }}</strong></RouterLink>
            <strong v-else>{{ bai.tac_gia }}</strong>
          </span>
        </div>

        <section v-if="bai.tac_dung" class="pd-sec">
          <h2 class="pd-h2">Tác dụng</h2>
          <VanBanYVan :text="bai.tac_dung" :vi-thuoc="bai.thanh_phan" />
        </section>

        <section v-if="bai.thanh_phan && bai.thanh_phan.length" class="pd-sec">
          <h2 class="pd-h2">Thành phần <span class="pd-count">({{ bai.thanh_phan.length }} vị)</span></h2>
          <ul class="pd-ingredients">
            <li v-for="(t, i) in bai.thanh_phan" :key="i" class="pd-ing">
              <RouterLink v-if="t.id" :to="links.viThuoc(t.id)" class="pd-ing-name pd-ing-link">{{ t.ten }}</RouterLink>
              <span v-else class="pd-ing-name">{{ t.ten }}</span>
              <span v-if="t.lieu" class="pd-ing-dose">{{ t.lieu }}</span>
            </li>
          </ul>
        </section>

        <section v-if="phanTich?.pt" class="pd-sec">
          <h2 class="pd-h2">Tính vị, quy kinh các vị</h2>
          <p class="pd-note">
            Trong {{ phanTich.pt.soCoDuLieu }}/{{ phanTich.pt.soVi }} vị có dữ liệu<template v-if="phanTich.pt.khi.length">; tính {{ ke(phanTich.pt.khi) }}</template><template v-if="phanTich.pt.vi.length">; vị {{ ke(phanTich.pt.vi) }}</template><template v-if="phanTich.pt.kinh.length">; quy kinh {{ ke(phanTich.pt.kinh) }}</template>.
          </p>
          <div class="pd-tbl-wrap">
            <table class="pd-tbl">
              <thead><tr><th>Vị thuốc</th><th>Tính</th><th>Vị</th><th>Quy kinh</th></tr></thead>
              <tbody>
                <tr v-for="(r, i) in phanTich.pt.bang" :key="i">
                  <td>
                    <RouterLink v-if="r.id" :to="links.viThuoc(r.id)" class="pd-ing-link">{{ r.ten }}</RouterLink>
                    <span v-else>{{ r.ten }}</span>
                  </td>
                  <td>{{ r.tinh }}</td><td>{{ r.vi }}</td><td>{{ r.kinh.join(', ') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section v-if="phanTich?.lq?.length" class="pd-sec">
          <h2 class="pd-h2">Bài thuốc có thành phần gần giống</h2>
          <ul class="pd-lq">
            <li v-for="x in phanTich.lq" :key="x.slug">
              <RouterLink :to="links.baiThuoc(x.slug)" class="pd-ing-link">{{ x.ten }}</RouterLink>
              <span class="pd-count"> — chung {{ x.chung }} vị</span>
            </li>
          </ul>
        </section>

        <section v-if="bai.cach_dung" class="pd-sec">
          <h2 class="pd-h2">Cách bào chế &amp; sử dụng</h2>
          <VanBanYVan :text="bai.cach_dung" :vi-thuoc="bai.thanh_phan" />
        </section>

        <section v-if="bai.ghi_chu" class="pd-sec">
          <h2 class="pd-h2">Ghi chú</h2>
          <VanBanYVan :text="bai.ghi_chu" :vi-thuoc="bai.thanh_phan" />
        </section>

        <p class="pd-disclaimer">
          Nội dung là <strong>cổ phương tham khảo</strong>, sưu tầm từ y văn cổ truyền. <strong>Không tự ý dùng</strong> —
          hãy tham khảo thầy thuốc Y Học Cổ Truyền trước khi áp dụng.
        </p>
      </article>
    </div>
  </div>
</template>

<style scoped>
.pd { min-height: 100vh; min-height: 100dvh; background: var(--bg-app); }
.pd-body { max-width: 760px; margin: 0 auto; padding: var(--space-6) var(--space-5) var(--space-12); }
.pd-msg { text-align: center; padding: var(--space-10); color: var(--text-muted); }
.pd-err { color: var(--danger, #b91c1c); }
.pd-card { background: var(--surface, #fff); border: 1px solid var(--border, #e5e0d6); border-radius: 14px; padding: var(--space-6); }
.pd-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--text-brand); margin: 0 0 10px; }
.pd-meta { display: flex; flex-wrap: wrap; gap: 16px; padding-bottom: 14px; border-bottom: 1px solid var(--border, #eee); margin-bottom: 16px; }
.pd-meta-item { font-size: 13.5px; color: var(--text-muted); }
.pd-srclink { color: var(--brown-700, #6b4f2a); text-decoration: underline dotted; text-underline-offset: 2px; }
.pd-srclink:hover { text-decoration: underline; }
.pd-sec { margin-bottom: 18px; }
.pd-h2 { font-size: 16px; font-weight: 700; color: var(--brown-800, #5b3a1a); margin: 0 0 8px; }
.pd-count { font-size: 13px; font-weight: 500; color: var(--text-muted); }
.pd-text { font-size: 14.5px; line-height: 1.7; color: var(--text); margin: 0; white-space: pre-line; }
.pd-ingredients { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 6px; }
.pd-ing { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; padding: 7px 12px; background: var(--surface-2, #faf8f3); border: 1px solid var(--border, #eee); border-radius: 8px; }
.pd-ing-name { font-weight: 600; color: var(--brown-800, #5b3a1a); }
.pd-ing-link { color: var(--brown-600, #8a5a1a); text-decoration: none; }
.pd-ing-link:hover { text-decoration: underline; }
.pd-ing-dose { font-family: ui-monospace, monospace; font-size: 13px; color: var(--gray-600); white-space: nowrap; }
.pd-note { font-size: 13.5px; line-height: 1.6; color: var(--text-muted); margin: 0 0 8px; }
.pd-tbl-wrap { overflow-x: auto; }
.pd-tbl { width: 100%; border-collapse: collapse; font-size: 13.5px; }
.pd-tbl th, .pd-tbl td { text-align: left; padding: 6px 10px; border-bottom: 1px solid var(--border, #eee); }
.pd-tbl th { font-weight: 600; color: var(--brown-800, #5b3a1a); background: var(--surface-2, #faf8f3); }
.pd-lq { margin: 0; padding-left: 18px; line-height: 1.8; }
.pd-disclaimer { margin-top: 20px; padding: 12px 14px; background: #fbf6e9; border: 1px solid #ecd9a0; border-radius: 8px; font-size: 12.5px; line-height: 1.6; color: #6b5a2e; }
</style>
