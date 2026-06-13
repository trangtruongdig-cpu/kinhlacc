<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/composables/useTheme'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// ----- Giao diện (theme đổi theo ngày / ghim / tự tạo) -----
const { allThemes, effectiveTheme, mode, dailyTheme, setMode, addCustomTheme, removeCustomTheme, generateRamp } =
  useTheme()
const themeMenuOpen = ref(false)
function pickTheme(id: string) {
  setMode(id)
  themeMenuOpen.value = false
}
function deleteTheme(id: string) {
  removeCustomTheme(id)
}

// Trình tạo màu tuỳ chỉnh
type RampStep = '50' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'
const previewSteps: RampStep[] = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900']
const creatorOpen = ref(false)
const newName = ref('Màu Của Tôi')
const newColor = ref('#8a5e28')
const previewRamp = computed(() => generateRamp(newColor.value))
function openCreator() {
  themeMenuOpen.value = false
  newName.value = 'Màu Của Tôi'
  newColor.value = effectiveTheme.value.ramp['600']
  creatorOpen.value = true
}
function onHexInput(e: Event) {
  const v = (e.target as HTMLInputElement).value.trim()
  if (/^#?[0-9a-fA-F]{6}$/.test(v)) newColor.value = v.startsWith('#') ? v : '#' + v
}
function saveCustomTheme() {
  const t = addCustomTheme({ name: newName.value, baseHex: newColor.value })
  setMode(t.id)
  creatorOpen.value = false
}

// Desktop: thu gọn thành rail hẹp. Mobile/tablet (≤1024px): drawer trượt.
const isSidebarCollapsed = ref(false)
const isMobileOpen = ref(false)

const MOBILE_BP = 1024
function isMobileViewport() {
  return typeof window !== 'undefined' && window.innerWidth <= MOBILE_BP
}

// Khoá cuộn nền khi mở drawer trên mobile
watch(isMobileOpen, (open) => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = open ? 'hidden' : ''
  }
})
onBeforeUnmount(() => {
  if (typeof document !== 'undefined') document.body.style.overflow = ''
})

const navItems = [
  { name: 'Trang Chủ', routeName: 'home', icon: 'home' },
  { name: 'Bệnh Nhân', routeName: 'patients', icon: 'patients' },
  { name: 'Lịch Trị Liệu', routeName: 'appointments', icon: 'calendar' },
  { name: 'Bệnh Tây Y', routeName: 'western-medicine', icon: 'stethoscope' },
  { name: 'Bệnh Đo Kinh Lạc', routeName: 'meridian-diseases', icon: 'rules' },
  { name: 'Kinh Mạch 3D', routeName: 'kinh-mach-3d', icon: 'activity' },
  { name: 'Từ Điển', routeName: 'tu-dien', icon: 'book' },
  { name: 'Chẩn Đoán Lưỡi', routeName: 'chan-doan-luoi', icon: 'tongue' },
  { name: 'Quản Lý Thuốc', routeName: 'medicines', icon: 'pill' },
  { name: 'Triệu Chứng', routeName: 'symptoms', icon: 'clipboard' },
  { name: 'Pháp Trị', routeName: 'treatments', icon: 'shield' },
  { name: 'Quản Lý Người Dùng', routeName: 'users', icon: 'users' },
  { name: 'SEO Radar', routeName: 'seo', icon: 'radar' },
]

// Chỉ hiện những mục mà vai trò hiện tại được phép vào (routeName trùng key trang).
const visibleNavItems = computed(() => navItems.filter((i) => authStore.can(i.routeName)))

const currentRouteName = computed(() => route.name)

function navigate(routeName: string) {
  router.push({ name: routeName })
  isMobileOpen.value = false
}

// Nút trong header sidebar: desktop → thu gọn rail; mobile → đóng drawer.
function toggleSidebar() {
  if (isMobileViewport()) {
    isMobileOpen.value = false
  } else {
    isSidebarCollapsed.value = !isSidebarCollapsed.value
  }
}

// Nút hamburger ở top-header (chỉ hiện ≤1024px)
function toggleMobile() {
  isMobileOpen.value = !isMobileOpen.value
}

function closeMobile() {
  isMobileOpen.value = false
}

function handleLogout() {
  authStore.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="dashboard-layout" :class="{ collapsed: isSidebarCollapsed, 'mobile-open': isMobileOpen }">
    <!-- Backdrop cho drawer trên mobile -->
    <div class="sidebar-backdrop" @click="closeMobile" aria-hidden="true"></div>

    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo" @click="navigate('home')">
          <svg class="logo-svg" width="36" height="36" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="30" stroke="var(--brown-300)" stroke-width="2"/>
            <path d="M32 12C32 12 20 22 20 32C20 38.627 25.373 44 32 44C38.627 44 44 38.627 44 32C44 22 32 12 32 12Z" fill="var(--brown-600)"/>
            <circle cx="32" cy="32" r="4" fill="var(--white)"/>
          </svg>
          <Transition name="fade-text">
            <span v-show="!isSidebarCollapsed" class="logo-text">Y Học Cổ Truyền</span>
          </Transition>
        </div>
        <button class="sidebar-toggle" @click="toggleSidebar" aria-label="Toggle sidebar">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path v-if="!isSidebarCollapsed" fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/>
            <path v-else fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
          </svg>
        </button>
      </div>

      <nav class="sidebar-nav">
        <button
          v-for="item in visibleNavItems"
          :key="item.routeName"
          class="nav-item"
          :class="{ active: currentRouteName === item.routeName || (item.routeName === 'patients' && currentRouteName === 'patient-detail') || (item.routeName === 'appointments' && currentRouteName === 'schedule-config') }"
          @click="navigate(item.routeName)"
        >
          <span class="nav-icon">
            <!-- Home icon -->
            <svg v-if="item.icon === 'home'" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
            </svg>
            <!-- Calendar icon -->
            <svg v-if="item.icon === 'calendar'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            <!-- Stethoscope (Western Medicine) icon -->
            <svg v-if="item.icon === 'stethoscope'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13a9 9 0 0018 0v-5m-9 14a5 5 0 01-5-5V7a2 2 0 012-2h6a2 2 0 012 2v5a5 5 0 01-5 5zm0 0v-4" /></svg>
            <!-- Activity (Meridian) icon -->
            <svg v-if="item.icon === 'activity'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
            <!-- Book (Dictionary) icon -->
            <svg v-if="item.icon === 'book'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.5C10.5 5 8 4.5 4 4.5v13c4 0 6.5.5 8 2 1.5-1.5 4-2 8-2v-13c-4 0-6.5.5-8 2zM12 6.5v13" /></svg>
            <!-- Table / rules (benh_dong_y_excel) icon -->
            <svg v-if="item.icon === 'rules'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 6h18M3 12h18M3 18h18M3 6v12M9 6v12M15 6v12M21 6v12" /></svg>
            <!-- Tongue (ChanDoanLuoi) icon -->
            <svg v-if="item.icon === 'tongue'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3C8 3 5 6 5 10v4c0 2.5 1.5 4.5 4 5.5l2 .5a2 2 0 002 0l2-.5c2.5-1 4-3 4-5.5v-4c0-4-3-7-7-7z"/><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6M9 9h6"/></svg>
            <!-- Pill (Medicines) icon -->
            <svg v-if="item.icon === 'pill'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 20.5L3.5 13.5a5 5 0 017.07-7.07l7 7a5 5 0 01-7.07 7.07z" /><path stroke-linecap="round" stroke-linejoin="round" d="M8.5 8.5l7 7" /></svg>
            <!-- Clipboard (Symptoms) icon -->
            <svg v-if="item.icon === 'clipboard'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            <!-- Shield (Treatments) icon -->
            <svg v-if="item.icon === 'shield'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            <!-- Patients icon -->
            <svg v-if="item.icon === 'patients'" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
            </svg>
            <!-- Users (quản lý người dùng) icon -->
            <svg v-if="item.icon === 'users'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-3.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a3 3 0 10-2.5-1.35"/></svg>
            <!-- Radar (SEO Radar) icon -->
            <svg v-if="item.icon === 'radar'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><path stroke-linecap="round" d="M12 12l6-4"/></svg>
          </span>
          <Transition name="fade-text">
            <span v-show="!isSidebarCollapsed" class="nav-label">{{ item.name }}</span>
          </Transition>
          <span v-if="(currentRouteName === item.routeName || (item.routeName === 'patients' && currentRouteName === 'patient-detail') || (item.routeName === 'appointments' && currentRouteName === 'schedule-config')) && !isSidebarCollapsed" class="nav-active-dot"></span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <div class="user-info">
          <div class="user-avatar">
            {{ (authStore.username || 'A').charAt(0).toUpperCase() }}
          </div>
          <Transition name="fade-text">
            <div v-show="!isSidebarCollapsed" class="user-details">
              <span class="user-name">{{ authStore.user?.hoTen || authStore.username || 'Admin' }}</span>
              <span class="user-role">{{ authStore.tenVaiTro }}</span>
            </div>
          </Transition>
        </div>
        <button class="logout-btn" @click="handleLogout" title="Đăng xuất">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm7.707 8.707a1 1 0 01-1.414-1.414L10.586 9H6a1 1 0 110-2h4.586L9.293 5.707a1 1 0 011.414-1.414l3 3a1 1 0 010 1.414l-3 3z" clip-rule="evenodd"/>
          </svg>
          <Transition name="fade-text">
            <span v-show="!isSidebarCollapsed">Đăng xuất</span>
          </Transition>
        </button>
      </div>
    </aside>

    <!-- Main content -->
    <main class="main-content">
      <header class="top-header">
        <div class="header-left">
          <button class="mobile-menu-btn" @click="toggleMobile" aria-label="Mở menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          </button>
          <h1 class="page-title">
            {{ currentRouteName === 'patient-detail' ? 'Chi Tiết Bệnh Nhân' : (currentRouteName === 'new-examination' ? 'Khám Mới' : currentRouteName === 'meridian-results' ? 'Kết Quả Đo Kinh Lạc' : currentRouteName === 'western-medicine' ? 'Bệnh Tây Y' : currentRouteName === 'meridian-diseases' ? 'Bệnh Đo Kinh Lạc' : currentRouteName === 'medicines' ? 'Quản Lý Thuốc' : currentRouteName === 'symptoms' ? 'Triệu Chứng' : currentRouteName === 'treatments' ? 'Pháp Trị' : currentRouteName === 'schedule-config' ? 'Cấu Hình Giờ Khám' : (navItems.find(i => i.routeName === currentRouteName)?.name || 'Trang Chủ')) }}
          </h1>
        </div>
        <div class="header-right">
          <!-- Chọn giao diện (theme) -->
          <div class="theme-switch">
            <button
              class="theme-btn"
              :class="{ open: themeMenuOpen }"
              @click="themeMenuOpen = !themeMenuOpen"
              :title="'Giao diện: ' + effectiveTheme.name"
              aria-label="Đổi giao diện"
            >
              <span class="theme-swatch">
                <i :style="{ background: effectiveTheme.ramp['300'] }"></i>
                <i :style="{ background: effectiveTheme.ramp['500'] }"></i>
                <i :style="{ background: effectiveTheme.ramp['700'] }"></i>
              </span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3a9 9 0 100 18h1.5a2.5 2.5 0 002-4 2.5 2.5 0 012-4H20a9 9 0 00-8-7z"/><circle cx="7.5" cy="11.5" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="8" r="1.2" fill="currentColor" stroke="none"/><circle cx="16.5" cy="11.5" r="1.2" fill="currentColor" stroke="none"/></svg>
            </button>

            <div v-if="themeMenuOpen" class="theme-overlay" @click="themeMenuOpen = false" aria-hidden="true"></div>

            <div v-if="themeMenuOpen" class="theme-menu" role="menu">
              <div class="theme-menu-title">Giao Diện</div>

              <button
                class="theme-opt theme-opt--auto"
                :class="{ active: mode === 'auto' }"
                @click="pickTheme('auto')"
                role="menuitem"
              >
                <span class="theme-swatch">
                  <i :style="{ background: dailyTheme().ramp['300'] }"></i>
                  <i :style="{ background: dailyTheme().ramp['500'] }"></i>
                  <i :style="{ background: dailyTheme().ramp['700'] }"></i>
                </span>
                <span class="theme-opt-text">
                  <span class="theme-opt-name">Tự Động Theo Ngày</span>
                  <span class="theme-opt-sub">Hôm nay: {{ dailyTheme().name }}</span>
                </span>
                <svg v-if="mode === 'auto'" class="theme-check" width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 111.42-1.42l2.79 2.79 6.79-6.79a1 1 0 011.42 0z" clip-rule="evenodd"/></svg>
              </button>

              <div class="theme-menu-divider"></div>

              <div class="theme-list">
                <div
                  v-for="t in allThemes"
                  :key="t.id"
                  class="theme-opt"
                  :class="{ active: mode === t.id }"
                  @click="pickTheme(t.id)"
                  role="menuitem"
                >
                  <span class="theme-swatch">
                    <i :style="{ background: t.ramp['300'] }"></i>
                    <i :style="{ background: t.ramp['500'] }"></i>
                    <i :style="{ background: t.ramp['700'] }"></i>
                  </span>
                  <span class="theme-opt-name">{{ t.name }}</span>
                  <svg v-if="mode === t.id" class="theme-check" width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 111.42-1.42l2.79 2.79 6.79-6.79a1 1 0 011.42 0z" clip-rule="evenodd"/></svg>
                  <button v-if="t.custom" class="theme-del" @click.stop="deleteTheme(t.id)" title="Xoá màu này" aria-label="Xoá màu">
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" clip-rule="evenodd"/></svg>
                  </button>
                </div>
              </div>

              <div class="theme-menu-divider"></div>
              <button class="theme-create-btn" @click="openCreator">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"/></svg>
                Tạo Màu Mới
              </button>
            </div>
          </div>

          <span class="header-greeting">Xin chào, <strong>{{ authStore.username || 'Admin' }}</strong></span>
        </div>
      </header>

      <div class="content-area">
        <!-- Giữ riêng trang "Từ Điển" trong bộ nhớ (keep-alive): dữ liệu ~5MB + việc dựng bản đồ tra cứu
             rất nặng, chỉ nên chạy 1 lần. Các trang khác vẫn mount/unmount bình thường để luôn tải dữ liệu mới. -->
        <RouterView v-slot="{ Component }">
          <keep-alive :include="['TuDienView']">
            <component :is="Component" />
          </keep-alive>
        </RouterView>
      </div>
    </main>

    <!-- Modal: tạo giao diện tuỳ chỉnh -->
    <div v-if="creatorOpen" class="tc-overlay" @click.self="creatorOpen = false">
      <div class="tc-modal" role="dialog" aria-modal="true">
        <div class="tc-head">
          <h3>Tạo Giao Diện Mới</h3>
          <button class="tc-close" @click="creatorOpen = false" aria-label="Đóng">×</button>
        </div>

        <div class="tc-body">
          <label class="tc-field">
            <span class="tc-label">Tên giao diện</span>
            <input class="tc-input" v-model="newName" maxlength="24" placeholder="Màu của tôi" />
          </label>

          <div class="tc-field">
            <span class="tc-label">Màu chủ đạo</span>
            <div class="tc-color-row">
              <input type="color" class="tc-color" v-model="newColor" aria-label="Chọn màu" />
              <input class="tc-input tc-hex" :value="newColor" @input="onHexInput" spellcheck="false" maxlength="7" />
            </div>
            <span class="tc-hint">Chọn một tông màu — hệ thống tự tạo dải màu hài hoà, đảm bảo dễ đọc.</span>
          </div>

          <div class="tc-preview">
            <span class="tc-label">Dải Màu (50 → 900)</span>
            <div class="tc-ramp">
              <i v-for="s in previewSteps" :key="s" :style="{ background: previewRamp[s] }" :title="s"></i>
            </div>
            <div class="tc-mock">
              <div class="tc-mock-hero" :style="{ background: `linear-gradient(135deg, ${previewRamp['600']}, ${previewRamp['800']})` }">Aa</div>
              <button class="tc-mock-btn" :style="{ background: previewRamp['600'] }">Nút Chính</button>
              <span class="tc-mock-chip" :style="{ background: previewRamp['100'], color: previewRamp['800'] }">Nhãn</span>
            </div>
          </div>
        </div>

        <div class="tc-foot">
          <button class="tc-btn tc-btn--ghost" @click="creatorOpen = false">Huỷ</button>
          <button class="tc-btn tc-btn--primary" :style="{ background: previewRamp['600'] }" @click="saveCustomTheme">
            Lưu &amp; Áp Dụng
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-layout{display:flex;min-height:100vh;background:var(--bg-app)}

/* Backdrop (chỉ dùng ở chế độ drawer ≤1024px) */
.sidebar-backdrop{position:fixed;inset:0;background:rgba(28,24,18,.45);backdrop-filter:blur(2px);z-index:90;opacity:0;visibility:hidden;transition:opacity var(--transition-base),visibility var(--transition-base)}

/* Sidebar */
.sidebar{width:var(--sidebar-width);background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column;transition:width var(--transition-base),transform var(--transition-base);position:fixed;top:0;left:0;bottom:0;z-index:100;overflow:hidden}
.collapsed .sidebar{width:var(--sidebar-collapsed-width)}

.sidebar-header{display:flex;align-items:center;justify-content:space-between;padding:var(--space-5) var(--space-4);border-bottom:1px solid var(--gray-100);min-height:var(--header-height)}
.sidebar-logo{display:flex;align-items:center;gap:var(--space-3);cursor:pointer;overflow:hidden}
.logo-svg{flex-shrink:0}
.logo-text{font-size:var(--font-size-sm);font-weight:700;color:var(--brown-800);white-space:nowrap}

.sidebar-toggle{width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:var(--radius-sm);color:var(--gray-500);transition:all var(--transition-fast);flex-shrink:0}
.sidebar-toggle:hover{background:var(--gray-100);color:var(--brown-600)}

/* Nav items */
.sidebar-nav{flex:1;padding:var(--space-4) var(--space-3);display:flex;flex-direction:column;gap:var(--space-1);overflow-y:auto}
.nav-item{display:flex;align-items:center;gap:var(--space-3);padding:11px var(--space-3);min-height:44px;border-radius:var(--radius-md);color:var(--gray-600);font-size:var(--font-size-sm);font-weight:500;transition:background var(--transition-fast),color var(--transition-fast);position:relative;overflow:hidden;white-space:nowrap}
.nav-item:hover{background:var(--brown-50);color:var(--brown-700)}
.nav-item.active{background:linear-gradient(135deg,var(--brown-50) 0%,var(--brown-100) 100%);color:var(--brown-800);font-weight:600}
.nav-item.active .nav-icon{color:var(--brown-600)}
.collapsed .nav-item{justify-content:center;padding:11px}
.nav-icon{width:20px;height:20px;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:color var(--transition-fast)}
.nav-label{white-space:nowrap}
.nav-active-dot{position:absolute;right:12px;width:6px;height:6px;border-radius:50%;background:var(--brown-500)}

/* Sidebar footer */
.sidebar-footer{padding:var(--space-4) var(--space-3);border-top:1px solid var(--gray-100);display:flex;flex-direction:column;gap:var(--space-3)}
.user-info{display:flex;align-items:center;gap:var(--space-3);padding:var(--space-2) var(--space-3);overflow:hidden}
.user-avatar{width:36px;height:36px;border-radius:var(--radius-full);background:linear-gradient(135deg,var(--brown-400),var(--brown-600));color:var(--white);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:var(--font-size-sm);flex-shrink:0}
.user-details{display:flex;flex-direction:column;overflow:hidden;white-space:nowrap}
.user-name{font-size:var(--font-size-sm);font-weight:600;color:var(--black)}
.user-role{font-size:var(--font-size-xs);color:var(--gray-500)}

.logout-btn{display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3);min-height:44px;border-radius:var(--radius-md);color:var(--gray-500);font-size:var(--font-size-sm);transition:all var(--transition-fast);white-space:nowrap;overflow:hidden}
.logout-btn:hover{background:var(--danger-bg);color:var(--danger)}
.collapsed .logout-btn{justify-content:center}

/* Text transitions */
.fade-text-enter-active{transition:opacity var(--transition-base) .05s}
.fade-text-leave-active{transition:opacity 100ms}
.fade-text-enter-from,.fade-text-leave-to{opacity:0}

/* Main content */
.main-content{flex:1;min-width:0;margin-left:var(--sidebar-width);transition:margin-left var(--transition-base);display:flex;flex-direction:column;min-height:100vh}
.collapsed .main-content{margin-left:var(--sidebar-collapsed-width)}

.top-header{height:var(--header-height);padding:0 var(--space-8);display:flex;align-items:center;justify-content:space-between;gap:var(--space-3);background:var(--surface);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:50}
.header-left{display:flex;align-items:center;gap:var(--space-4);min-width:0}
.mobile-menu-btn{display:none;width:40px;height:40px;flex-shrink:0;align-items:center;justify-content:center;border-radius:var(--radius-sm);color:var(--gray-600);transition:all var(--transition-fast)}
.mobile-menu-btn:hover{background:var(--gray-100);color:var(--brown-700)}
.page-title{font-size:var(--font-size-lg);font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.header-greeting{font-size:var(--font-size-sm);color:var(--gray-600);white-space:nowrap}
.header-greeting strong{color:var(--brown-700);font-weight:600}

/* ---- Theme switcher ---- */
.header-right{display:flex;align-items:center;gap:var(--space-4)}
.theme-switch{position:relative}
.theme-btn{display:flex;align-items:center;gap:var(--space-2);height:38px;padding:0 var(--space-3);border:1px solid var(--border);border-radius:var(--radius-md);color:var(--gray-600);background:var(--surface);transition:all var(--transition-fast)}
.theme-btn:hover,.theme-btn.open{border-color:var(--brown-300);color:var(--brown-700);background:var(--brown-50)}
.theme-swatch{display:inline-flex;border-radius:var(--radius-full);overflow:hidden;box-shadow:inset 0 0 0 1px rgba(0,0,0,.06)}
.theme-swatch i{width:8px;height:16px;display:block}
.theme-overlay{position:fixed;inset:0;z-index:80}
.theme-menu{position:absolute;top:calc(100% + 8px);right:0;z-index:81;width:248px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);box-shadow:var(--shadow-lg);padding:var(--space-2);animation:theme-pop .14s ease}
@keyframes theme-pop{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
.theme-menu-title{font-size:var(--font-size-xs);font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--text-subtle);padding:var(--space-2) var(--space-3) var(--space-1)}
.theme-menu-divider{height:1px;background:var(--gray-100);margin:var(--space-2) var(--space-1)}
.theme-list{display:flex;flex-direction:column;gap:2px;max-height:240px;overflow-y:auto}
.theme-opt{display:flex;align-items:center;gap:var(--space-3);width:100%;padding:var(--space-2) var(--space-3);border-radius:var(--radius-md);text-align:left;color:var(--text);cursor:pointer;transition:background var(--transition-fast)}
.theme-opt:hover{background:var(--brown-50)}
.theme-opt.active{background:var(--brown-50)}
.theme-opt .theme-swatch i{height:20px}
.theme-opt-text{display:flex;flex-direction:column;min-width:0}
.theme-opt-name{font-size:var(--font-size-sm);font-weight:600;white-space:nowrap}
.theme-opt-sub{font-size:var(--font-size-xs);color:var(--text-subtle);white-space:nowrap}
.theme-opt--auto .theme-opt-name{flex:0}
.theme-opt .theme-check{margin-left:auto;color:var(--brown-600);flex-shrink:0}
.theme-del{margin-left:auto;width:22px;height:22px;border-radius:var(--radius-sm);color:var(--gray-400);display:flex;align-items:center;justify-content:center;flex-shrink:0;opacity:0;transition:all var(--transition-fast)}
.theme-opt:hover .theme-del{opacity:1}
.theme-del:hover{background:var(--danger-bg);color:var(--danger)}
.theme-opt .theme-check + .theme-del{margin-left:6px}
.theme-create-btn{display:flex;align-items:center;gap:var(--space-2);width:100%;padding:var(--space-2) var(--space-3);border-radius:var(--radius-md);font-size:var(--font-size-sm);font-weight:600;color:var(--brown-700);transition:background var(--transition-fast)}
.theme-create-btn:hover{background:var(--brown-50)}

/* ---- Modal tạo màu tuỳ chỉnh ---- */
.tc-overlay{position:fixed;inset:0;z-index:200;background:rgba(28,24,18,.5);backdrop-filter:blur(2px);display:flex;align-items:center;justify-content:center;padding:var(--space-4);animation:tc-fade .15s ease}
@keyframes tc-fade{from{opacity:0}to{opacity:1}}
.tc-modal{width:100%;max-width:440px;background:var(--surface);border-radius:var(--radius-lg);box-shadow:var(--shadow-xl);overflow:hidden;animation:theme-pop .18s ease}
.tc-head{display:flex;align-items:center;justify-content:space-between;padding:var(--space-5) var(--space-6);border-bottom:1px solid var(--gray-100)}
.tc-head h3{font-size:var(--font-size-md);font-weight:700;color:var(--text)}
.tc-close{width:32px;height:32px;border-radius:var(--radius-sm);font-size:22px;line-height:1;color:var(--gray-500);display:flex;align-items:center;justify-content:center}
.tc-close:hover{background:var(--gray-100);color:var(--text)}
.tc-body{padding:var(--space-6);display:flex;flex-direction:column;gap:var(--space-5)}
.tc-field{display:flex;flex-direction:column;gap:var(--space-2)}
.tc-label{font-size:var(--font-size-sm);font-weight:600;color:var(--text-muted)}
.tc-input{height:40px;padding:0 var(--space-3);border:1px solid var(--border);border-radius:var(--radius-md);color:var(--text);background:var(--surface);font-size:var(--font-size-sm)}
.tc-input:focus{outline:none;border-color:var(--brown-400);box-shadow:var(--focus-ring)}
.tc-color-row{display:flex;gap:var(--space-3);align-items:center}
.tc-color{width:54px;height:40px;padding:2px;border:1px solid var(--border);border-radius:var(--radius-md);background:var(--surface);cursor:pointer;flex-shrink:0}
.tc-hex{flex:1;text-transform:uppercase}
.tc-hint{font-size:var(--font-size-xs);color:var(--text-subtle)}
.tc-preview{display:flex;flex-direction:column;gap:var(--space-3)}
.tc-ramp{display:flex;height:34px;border-radius:var(--radius-md);overflow:hidden;box-shadow:inset 0 0 0 1px rgba(0,0,0,.06)}
.tc-ramp i{flex:1;display:block}
.tc-mock{display:flex;align-items:center;gap:var(--space-3);flex-wrap:wrap}
.tc-mock-hero{width:48px;height:48px;border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;flex-shrink:0}
.tc-mock-btn{height:38px;padding:0 var(--space-4);border-radius:var(--radius-md);color:#fff;font-size:var(--font-size-sm);font-weight:600}
.tc-mock-chip{padding:4px 12px;border-radius:var(--radius-full);font-size:var(--font-size-xs);font-weight:600}
.tc-foot{display:flex;justify-content:flex-end;gap:var(--space-3);padding:var(--space-4) var(--space-6);border-top:1px solid var(--gray-100);background:var(--surface-2)}
.tc-btn{height:40px;padding:0 var(--space-5);border-radius:var(--radius-md);font-size:var(--font-size-sm);font-weight:600;transition:all var(--transition-fast)}
.tc-btn--ghost{color:var(--text-muted);border:1px solid var(--border)}
.tc-btn--ghost:hover{background:var(--gray-100)}
.tc-btn--primary{color:#fff}
.tc-btn--primary:hover{filter:brightness(.94)}

.content-area{flex:1;padding:var(--space-8);min-width:0}

/* ============ Responsive ============ */
@media(max-width:1280px){
  .content-area{padding:var(--space-6)}
}
@media(max-width:1024px){
  /* Drawer mode: sidebar trượt từ trái, có backdrop */
  .sidebar{transform:translateX(-100%);width:var(--sidebar-width) !important;box-shadow:var(--shadow-xl)}
  .mobile-open .sidebar{transform:translateX(0)}
  .mobile-open .sidebar-backdrop{opacity:1;visibility:visible}
  .main-content,.collapsed .main-content{margin-left:0}
  /* Ở drawer luôn hiển thị label đầy đủ kể cả khi cờ collapsed bật */
  .collapsed .nav-item{justify-content:flex-start;padding:11px var(--space-3)}
  .mobile-menu-btn{display:flex}
  .content-area{padding:var(--space-5)}
}
@media(max-width:768px){
  .top-header{padding:0 var(--space-4)}
  .header-greeting{display:none}
  .content-area{padding:var(--space-4)}
}
@media(max-width:480px){
  .top-header{padding:0 var(--space-3)}
  .page-title{font-size:var(--font-size-md)}
  .content-area{padding:var(--space-3)}
}
</style>
