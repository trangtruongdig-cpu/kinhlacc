<script setup lang="ts">
/**
 * PublicTopBar — Thanh điều hướng dùng chung cho các trang "xem thử" CÔNG KHAI
 * (3D, Kết Quả Đo, Bài Thuốc). Cho khách quay về Trang Chủ và mời đăng nhập để dùng thật.
 */
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// `badge`: nhãn nhỏ cạnh tiêu đề. Mặc định "Bản Xem Thử" cho trang xem thử;
// trang mở đầy đủ (vd Thư Viện) truyền badng khác, hoặc rỗng để ẩn.
withDefaults(defineProps<{ title: string; badge?: string }>(), { badge: 'Bản Xem Thử' })

const router = useRouter()
const auth = useAuthStore()

const isAuthed = computed(() => auth.isAuthenticated)
const ctaLabel = computed(() => (isAuthed.value ? 'Vào Hệ Thống' : 'Đăng Nhập'))

function goHome() {
  router.push({ name: 'landing' })
}
function enter() {
  router.push({ name: isAuthed.value ? 'dashboard' : 'login' })
}
</script>

<template>
  <header class="ptb">
    <div class="ptb-inner">
      <button class="ptb-brand" @click="goHome" title="Về Trang Chủ">
        <svg width="28" height="28" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="30" stroke="var(--brown-300)" stroke-width="2" />
          <path d="M32 12C32 12 20 22 20 32C20 38.627 25.373 44 32 44C38.627 44 44 38.627 44 32C44 22 32 12 32 12Z" fill="var(--brown-600)" />
          <circle cx="32" cy="32" r="4" fill="var(--white)" />
        </svg>
        <span class="ptb-brand-text">Kinh Lạc Trương Gia</span>
      </button>

      <div class="ptb-center">
        <span class="ptb-title">{{ title }}</span>
        <span v-if="badge" class="ptb-badge">{{ badge }}</span>
      </div>

      <div class="ptb-actions">
        <a class="ptb-link" href="/blog/">Cẩm Nang</a>
        <button class="ptb-link" @click="goHome">← Trang Chủ</button>
        <button class="ptb-cta" @click="enter">{{ ctaLabel }}</button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.ptb {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(250, 246, 239, 0.92);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border);
}
.ptb-inner {
  max-width: 1280px;
  margin: 0 auto;
  height: 60px;
  padding: 0 var(--space-5);
  display: flex;
  align-items: center;
  gap: var(--space-4);
}
.ptb-brand {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  flex-shrink: 0;
}
.ptb-brand-text {
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--brown-800);
  white-space: nowrap;
}
.ptb-center {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin: 0 auto;
  min-width: 0;
}
.ptb-title {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ptb-badge {
  flex-shrink: 0;
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--brown-700);
  background: var(--brown-100);
  border: 1px solid var(--brown-200);
  padding: 3px 10px;
  border-radius: var(--radius-full);
}
.ptb-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
}
.ptb-link {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-muted);
  white-space: nowrap;
}
.ptb-link:hover {
  color: var(--brown-700);
  background: var(--brown-50);
}
.ptb-cta {
  height: 38px;
  padding: 0 var(--space-5);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--white);
  background: linear-gradient(135deg, var(--brown-600) 0%, var(--brown-700) 100%);
  box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.24);
  white-space: nowrap;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}
.ptb-cta:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(var(--primary-rgb), 0.34);
}

@media (max-width: 768px) {
  .ptb-center {
    display: none;
  }
  .ptb-link {
    display: none;
  }
}
</style>
