<script setup lang="ts">
import { usePatientAuthStore } from '@/stores/patientAuth'
import { useRouter } from 'vue-router'

const authStore = usePatientAuthStore()
const router = useRouter()

function handleLogout() {
  authStore.logout()
  router.push({ name: 'patient-login' })
}
</script>

<template>
  <div class="patient-app-layout">
    <header class="app-header">
      <div class="header-inner">
        <h1 class="app-title">Kinh Lạc</h1>
        <div class="user-menu">
          <span class="user-name">{{ authStore.patient?.fullName || authStore.patient?.phone }}</span>
          <button @click="handleLogout" class="btn-logout">Đăng xuất</button>
        </div>
      </div>
    </header>

    <main class="app-main">
      <RouterView />
    </main>

    <!-- Bottom Navigation for mobile -->
    <nav class="bottom-nav">
      <RouterLink :to="{ name: 'patient-dashboard' }" class="nav-item" active-class="nav-item-active">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
        <span>Hồ sơ</span>
      </RouterLink>
      <RouterLink :to="{ name: 'patient-profile' }" class="nav-item" active-class="nav-item-active">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        <span>Tài khoản</span>
      </RouterLink>
    </nav>
  </div>
</template>

<style scoped>
.patient-app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--gray-50);
}
.app-header {
  display: none; /* Ẩn trên mobile, vì đã có Tab "Tài khoản" dưới Bottom Nav */
}
.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-4);
  height: 60px;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}
.app-title {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--brown-700);
}
.user-menu {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}
.user-name {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--gray-700);
}
.btn-logout {
  background: none;
  border: none;
  color: var(--danger);
  font-size: var(--font-size-sm);
  cursor: pointer;
  padding: var(--space-2);
}
.btn-logout:hover {
  text-decoration: underline;
}
.app-main {
  flex: 1;
  padding: 0 var(--space-4);
  padding-bottom: 70px; /* Dành chỗ cho bottom nav */
  width: 100%;
}
/* Đối với các màn hình không phải MeridianResults, ta có thể tạo class padding riêng nếu cần,
   hoặc để view tự lo padding. MeridianResultsView tự xử lý padding bên trong nó. */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: var(--white);
  border-top: 1px solid var(--gray-200);
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 10;
  padding-bottom: env(safe-area-inset-bottom);
}
.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: var(--gray-500);
  text-decoration: none;
  flex: 1;
  height: 100%;
}
.nav-item span {
  font-size: 11px;
  font-weight: 500;
}
.nav-item-active {
  color: var(--brown-600);
}
@media (min-width: 768px) {
  .bottom-nav {
    display: none;
  }
  .app-main {
    padding-bottom: 0;
  }
  .patient-app-layout {
    flex-direction: row;
  }
  .app-header {
    display: block; /* Hiện lại trên desktop sidebar */
    width: 250px;
    height: 100vh;
    position: sticky;
    top: 0;
    border-right: 1px solid var(--gray-200);
    border-bottom: none;
    background: var(--white);
  }
  .header-inner {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: var(--space-6);
    height: auto;
  }
  .app-title {
    margin-bottom: var(--space-8);
  }
  .user-menu {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
    width: 100%;
  }
}
</style>
