<script setup lang="ts">
/**
 * DuocLieuDetailView — Chi tiết một vị thuốc, CÔNG KHAI (khách chưa đăng nhập).
 * Tái dùng <ViThuocDetail source="public"> (đọc /duoc-lieu/:id) + thư viện ảnh theo giai đoạn.
 */
import { computed, defineAsyncComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PublicTopBar from '@/components/PublicTopBar.vue'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import MedicalDisclaimer from '@/components/MedicalDisclaimer.vue'
const ViThuocDetail = defineAsyncComponent(() => import('@/components/ViThuocDetail.vue'))

const route = useRoute()
const router = useRouter()
const id = computed(() => Number(route.params.id))

function onLoaded(h: { id: number; ten: string }) {
  document.title = `${h.ten} — Vị thuốc Đông Y | Từ điển dược liệu`
  const m = document.querySelector('meta[name="description"]')
  if (m) m.setAttribute('content', `Tra cứu vị thuốc ${h.ten}: tính, vị, quy kinh, công dụng, chủ trị, kiêng kỵ và hình ảnh từ nguyên liệu đến thành phẩm.`)
}
</script>

<template>
  <div class="dld">
    <PublicTopBar title="Từ điển dược liệu" />
    <AppBreadcrumb />

    <div class="dld-body">
      <button type="button" class="dld-back" @click="router.push({ name: 'duoc-lieu' })">‹ Về từ điển dược liệu</button>

      <div class="dld-card">
        <ViThuocDetail :vi-thuoc-id="id" source="public" @loaded="onLoaded" />
      </div>

      <div class="dld-cta">
        <div>
          <h3 class="dld-cta-title">Tra cứu toàn bộ kho dược liệu &amp; bài thuốc</h3>
          <p class="dld-cta-sub">Đăng nhập để dùng đầy đủ: phân tích bài thuốc, đồ thị tri thức, quản lý phòng khám.</p>
        </div>
        <button class="dld-cta-btn" @click="router.push({ name: 'login' })">Đăng nhập →</button>
      </div>

      <MedicalDisclaimer context="formula" />
    </div>
  </div>
</template>

<style scoped>
.dld { min-height: 100vh; background: var(--bg-app); }
.dld-body { max-width: 920px; margin: 0 auto; padding: var(--space-6) var(--space-5) var(--space-12); }
.dld-back { margin-bottom: var(--space-4); padding: 6px 12px; border-radius: 8px; border: 1px solid var(--border, #e5e0d6); background: #fff; cursor: pointer; font-size: 13px; color: var(--brown-700, #6b4f2a); }
.dld-back:hover { background: var(--brown-50, #f7f3ec); }
.dld-card { padding: var(--space-5); background: var(--surface, #fff); border: 1px solid var(--border, #e5e0d6); border-radius: 14px; }
.dld-cta { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-4); padding: var(--space-5); margin-top: var(--space-6); border-radius: var(--radius-lg); color: #fff; background: linear-gradient(135deg, var(--brown-600, #8a6d3b) 0%, var(--brown-800, #5b3a1a) 100%); }
.dld-cta-title { font-size: var(--font-size-lg); font-weight: 800; margin-bottom: 4px; }
.dld-cta-sub { font-size: var(--font-size-sm); color: rgba(255,255,255,0.85); }
.dld-cta-btn { height: 46px; padding: 0 var(--space-5); border-radius: var(--radius-lg); background: #fff; color: var(--brown-700, #6b4f2a); font-weight: 700; white-space: nowrap; }
.dld-cta-btn:hover { transform: translateY(-2px); }
</style>
