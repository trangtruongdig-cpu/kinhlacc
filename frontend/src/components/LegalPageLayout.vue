<script setup lang="ts">
/**
 * LegalPageLayout — Khung chung cho các "trang Tin Cậy" (Về Chúng Tôi, Liên Hệ,
 * Chính Sách Bảo Mật, Điều Khoản, Quy Trình Biên Tập).
 *
 * Gồm: PublicTopBar (điều hướng) + 1 cột chữ dễ đọc (prose) + SiteFooter.
 * Các trang con chỉ cần đặt nội dung vào <slot> bằng h2/p/ul thông thường — style prose lo phần còn lại.
 */
import PublicTopBar from '@/components/PublicTopBar.vue'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import SiteFooter from '@/components/SiteFooter.vue'

defineProps<{
  /** Tiêu đề lớn của trang (H1) */
  title: string
  /** Mô tả ngắn dưới tiêu đề (tuỳ chọn) */
  lead?: string
  /** Ngày cập nhật lần cuối, dạng chữ "05/06/2026" (tuỳ chọn) */
  updated?: string
}>()
</script>

<template>
  <div class="legal-page">
    <PublicTopBar :title="title" badge="" />
    <AppBreadcrumb />

    <main class="legal-main">
      <article class="legal-prose">
        <header class="legal-header">
          <h1 class="legal-h1">{{ title }}</h1>
          <p v-if="lead" class="legal-lead">{{ lead }}</p>
          <p v-if="updated" class="legal-updated">Cập nhật lần cuối: {{ updated }}</p>
        </header>

        <slot />
      </article>
    </main>

    <SiteFooter />
  </div>
</template>

<style scoped>
.legal-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-app);
}
.legal-main {
  flex: 1;
  width: 100%;
  max-width: 820px;
  margin: 0 auto;
  padding: var(--space-10) var(--space-6) var(--space-16);
}
.legal-header {
  margin-bottom: var(--space-8);
  padding-bottom: var(--space-6);
  border-bottom: 1px solid var(--border);
}
.legal-h1 {
  font-size: var(--font-size-4xl);
  font-weight: 800;
  color: var(--text-brand);
  margin: 0;
}
.legal-lead {
  margin: var(--space-3) 0 0;
  font-size: var(--font-size-lg);
  color: var(--text-muted);
  line-height: 1.6;
}
.legal-updated {
  margin: var(--space-4) 0 0;
  font-size: var(--font-size-xs);
  color: var(--text-subtle);
}

/* ---------- Prose: style cho nội dung trong slot ---------- */
.legal-prose :deep(h2) {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--text-brand);
  margin: var(--space-10) 0 var(--space-3);
}
.legal-prose :deep(h3) {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--text);
  margin: var(--space-6) 0 var(--space-2);
}
.legal-prose :deep(p) {
  font-size: var(--font-size-base);
  line-height: 1.75;
  color: var(--text);
  margin: var(--space-3) 0;
}
.legal-prose :deep(ul),
.legal-prose :deep(ol) {
  margin: var(--space-3) 0;
  padding-left: var(--space-6);
}
.legal-prose :deep(li) {
  font-size: var(--font-size-base);
  line-height: 1.7;
  color: var(--text);
  margin: var(--space-2) 0;
}
.legal-prose :deep(a) {
  color: var(--primary);
  text-decoration: underline;
}
.legal-prose :deep(strong) {
  font-weight: 700;
  color: var(--text-brand);
}
/* Đánh dấu chỗ bạn cần điền thông tin thật */
.legal-prose :deep(mark.fill) {
  background: var(--warning-bg);
  color: var(--warning-fg);
  border: 1px dashed var(--warning-border);
  border-radius: var(--radius-sm);
  padding: 0 6px;
  font-weight: 600;
  font-style: normal;
}
.legal-prose :deep(.legal-card) {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-5);
  margin: var(--space-4) 0;
}
</style>
