<script setup lang="ts">
import { usePatientAuthStore } from '@/stores/patientAuth'
import { useRouter, useRoute } from 'vue-router'

const authStore = usePatientAuthStore()
const router = useRouter()
const route = useRoute()

function handleLogout() {
  authStore.logout()
  router.push({ name: 'patient-login' })
}

// Đang ở trang chi tiết kết quả → hiện nút "Về Hồ Sơ"
const isDetailPage = () => route.path.startsWith('/ho-so/kham-benh/') && route.params.examId
</script>

<template>
  <div class="patient-app-layout">
    <header class="app-header">
      <div class="header-inner">
        <!-- Logo / tên app -->
        <div class="app-brand">
          <svg width="26" height="26" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="30" stroke="var(--brown-400)" stroke-width="2"/>
            <path d="M32 12C32 12 20 22 20 32C20 38.627 25.373 44 32 44C38.627 44 44 38.627 44 32C44 22 32 12 32 12Z" fill="var(--brown-600)"/>
            <circle cx="32" cy="32" r="4" fill="white"/>
          </svg>
          <span class="app-title">Kinh Lạc Gia Minh</span>
        </div>

        <!-- Menu sidebar (desktop) -->
        <nav class="sidebar-nav">
          <RouterLink :to="{ name: 'patient-records' }" class="sidebar-link" active-class="sidebar-link--active">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Hồ Sơ Khám
          </RouterLink>
          <a href="https://zalo.me/84353247247" target="_blank" rel="noopener noreferrer" class="sidebar-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
            Hỗ trợ Zalo
          </a>
        </nav>

        <!-- Thông tin user + đăng xuất -->
        <div class="user-menu">
          <span class="user-avatar">{{ (authStore.patient?.fullName || authStore.patient?.phone || '?')[0].toUpperCase() }}</span>
          <div class="user-info">
            <span class="user-name">{{ authStore.patient?.fullName || authStore.patient?.phone }}</span>
            <button @click="handleLogout" class="btn-logout">Đăng xuất</button>
          </div>
        </div>
      </div>
    </header>

    <main class="app-main">
      <!-- Nút Về Hồ Sơ (mobile): chỉ hiện khi đang ở trang chi tiết kết quả -->
      <div v-if="isDetailPage()" class="mobile-back-bar">
        <button class="mobile-back-btn" @click="router.push({ name: 'patient-records' })">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd"/></svg>
          Về Hồ Sơ
        </button>
      </div>
      <RouterView />
    </main>

    <!-- Bottom Navigation for mobile -->
    <nav class="bottom-nav">
      <RouterLink :to="{ name: 'patient-records' }" class="nav-item" active-class="nav-item-active">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
        <span>Hồ sơ</span>
      </RouterLink>
      <a href="https://zalo.me/84353247247" target="_blank" rel="noopener noreferrer" class="nav-item">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
        <span>Hỗ trợ</span>
      </a>
      <button class="nav-item nav-item-logout" @click="handleLogout">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        <span>Đăng xuất</span>
      </button>
    </nav>
  </div>
</template>

<style scoped>
.patient-app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--gray-50, #f8f5f0);
}
/* ── Header (sidebar trên desktop, ẩn mobile) ── */
.app-header {
  display: none;
}
.header-inner {
  display: flex;
  flex-direction: column;
  padding: 1.5rem 1.25rem;
  height: 100%;
  gap: 1.5rem;
}
.app-brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.app-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--brown-700);
  line-height: 1.2;
}
/* sidebar nav links */
.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}
.sidebar-link {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--gray-600);
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
}
.sidebar-link:hover { background: var(--gray-100); color: var(--brown-700); }
.sidebar-link--active { background: var(--brown-50, #fdf5eb); color: var(--brown-700); font-weight: 700; }
/* user info */
.user-menu {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding-top: 1rem;
  border-top: 1px solid var(--gray-200);
}
.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--brown-500);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  flex-shrink: 0;
}
.user-info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  overflow: hidden;
}
.user-name {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--gray-800);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.btn-logout {
  background: none;
  border: none;
  color: var(--danger, #c0392b);
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0;
  text-align: left;
}
.btn-logout:hover { text-decoration: underline; }

/* ── Mobile back bar ── */
.mobile-back-bar {
  padding: 0.5rem 1rem 0;
}
.mobile-back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: none;
  border: none;
  color: var(--brown-600);
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.3rem 0;
}
.mobile-back-btn:hover { text-decoration: underline; }

/* ── Main ── */
.app-main {
  flex: 1;
  padding: 0 var(--space-4) 70px var(--space-4); /* Dành chỗ bottom nav + lề 2 bên trên mobile */
  width: 100%;
}

/* ── Bottom nav (mobile) ── */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: var(--white, #fff);
  border-top: 1px solid var(--gray-200);
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 100;
  padding-bottom: env(safe-area-inset-bottom);
}
.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  color: var(--gray-500);
  text-decoration: none;
  flex: 1;
  height: 100%;
  background: none;
  border: none;
  cursor: pointer;
}
.nav-item span { font-size: 11px; font-weight: 500; }
.nav-item-active { color: var(--brown-600); }
.nav-item-logout { color: var(--danger, #c0392b); }
.nav-item-logout span { color: var(--danger, #c0392b); }

/* ── Desktop: sidebar layout ── */
@media (min-width: 768px) {
  .bottom-nav { display: none; }
  .app-main { padding: var(--space-6) var(--space-8); }
  .patient-app-layout { flex-direction: row; }
  .app-header {
    display: flex;
    width: 240px;
    min-height: 100vh;
    position: sticky;
    top: 0;
    border-right: 1px solid var(--gray-200);
    background: var(--white, #fff);
    box-shadow: 2px 0 8px rgba(0,0,0,0.04);
  }
  .mobile-back-bar { display: none; }
}
</style>
