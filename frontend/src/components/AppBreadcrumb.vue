<script setup lang="ts">
/**
 * AppBreadcrumb — thanh "đường dẫn" (breadcrumb) NHÌN THẤY cho các trang công khai SPA.
 *
 * Đọc lối đi từ NGUỒN CHUNG `route-seo.json` (qua routeSeo) theo TÊN route — KHÔNG khai báo
 * lại ở từng trang. "Trang Chủ" luôn đứng đầu; mục cuối là trang hiện tại (chữ thường, không link).
 * Khớp 1-1 với BreadcrumbList JSON-LD sinh trong useSeo.ts.
 *
 * Trang không có breadcrumb (vd Trang Chủ) => component tự ẩn (không render gì).
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { routeSeo } from '@/seo/routeSeo'

const route = useRoute()

// Lối đi: [Trang Chủ] + các mục cấu hình. Mục cuối = trang hiện tại.
const trail = computed(() => {
  const name = typeof route.name === 'string' ? route.name : ''
  const items = routeSeo[name]?.breadcrumb ?? []
  if (!items.length) return []
  return [{ name: 'Trang Chủ', path: '/' }, ...items]
})
</script>

<template>
  <nav v-if="trail.length" class="crumb" aria-label="Đường dẫn">
    <ol class="crumb-list">
      <li v-for="(c, i) in trail" :key="c.path" class="crumb-item">
        <RouterLink v-if="i < trail.length - 1" :to="c.path" class="crumb-link">{{ c.name }}</RouterLink>
        <span v-else class="crumb-current" aria-current="page">{{ c.name }}</span>
        <span v-if="i < trail.length - 1" class="crumb-sep" aria-hidden="true">›</span>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.crumb {
  max-width: 1280px;
  margin: 0 auto;
  padding: var(--space-3) var(--space-5) 0;
}
.crumb-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1, 4px);
  font-size: var(--font-size-sm);
}
.crumb-item {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1, 4px);
}
.crumb-link {
  color: var(--text-muted);
  text-decoration: none;
}
.crumb-link:hover {
  color: var(--primary);
  text-decoration: underline;
}
.crumb-current {
  color: var(--text-brand);
  font-weight: 600;
}
.crumb-sep {
  color: var(--text-subtle);
}
</style>
