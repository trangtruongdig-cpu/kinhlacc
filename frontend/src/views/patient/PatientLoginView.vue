<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePatientAuthStore } from '@/stores/patientAuth'

const router = useRouter()
const authStore = usePatientAuthStore()
const phone = ref('')
const password = ref('')
const showPassword = ref(false)

onMounted(() => {
  if (authStore.isAuthenticated) router.push({ name: 'patient-dashboard' })
})

async function handleLogin() {
  if (!phone.value.trim() || !password.value.trim()) {
    authStore.error = 'Vui lòng nhập đầy đủ thông tin'
    return
  }
  const success = await authStore.login(phone.value.trim(), password.value)
  if (success) router.push({ name: 'patient-dashboard' })
}
</script>

<template>
  <div class="login-page">
    <div class="login-container">
      <div class="form-wrapper">
        <RouterLink :to="{ name: 'landing' }" class="back-home">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
          <span>Về Trang Chủ</span>
        </RouterLink>
        
        <div class="form-header">
          <h2 class="form-title">Đăng Nhập Khách Hàng</h2>
          <p class="form-description">Xem kết quả đo và theo dõi điều trị</p>
        </div>

        <Transition name="fade">
          <div v-if="authStore.error" class="error-alert" role="alert" @click="authStore.clearError()">
            <span>{{ authStore.error }}</span>
          </div>
        </Transition>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label class="form-label">Số điện thoại</label>
            <input v-model="phone" type="tel" class="form-input" placeholder="Nhập số điện thoại" autocomplete="tel"/>
          </div>

          <div class="form-group">
            <label class="form-label">Mật khẩu</label>
            <div class="input-wrapper">
              <input v-model="password" :type="showPassword ? 'text' : 'password'" class="form-input" placeholder="Nhập mật khẩu" autocomplete="current-password"/>
              <button type="button" class="password-toggle" @click="showPassword = !showPassword">
                <span v-if="showPassword">Ẩn</span>
                <span v-else>Hiện</span>
              </button>
            </div>
          </div>

          <button type="submit" class="btn-login" :disabled="authStore.isLoading">
            <span v-if="authStore.isLoading" class="btn-spinner"></span>
            <span v-else>Đăng nhập</span>
          </button>
        </form>

        <p class="register-prompt">
          Chưa có tài khoản? 
          <RouterLink :to="{ name: 'patient-register' }" class="register-link">Đăng ký ngay</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gray-50);
  padding: var(--space-4);
}
.login-container {
  width: 100%;
  max-width: 400px;
  background: var(--white);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}
.form-wrapper {
  padding: var(--space-8) var(--space-6);
}
.back-home {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  margin-bottom: var(--space-6);
  font-size: var(--font-size-sm);
  color: var(--gray-500);
  text-decoration: none;
}
.form-header {
  margin-bottom: var(--space-8);
  text-align: center;
}
.form-title {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--black);
  margin-bottom: var(--space-2);
}
.form-description {
  color: var(--gray-500);
  font-size: var(--font-size-sm);
}
.error-alert {
  background: var(--danger-bg);
  color: var(--danger);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-4);
  text-align: center;
}
.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.form-label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--gray-700);
}
.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
.form-input {
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid var(--gray-300);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  outline: none;
  transition: border-color var(--transition-fast);
}
.form-input:focus {
  border-color: var(--brown-500);
}
.password-toggle {
  position: absolute;
  right: 12px;
  color: var(--brown-600);
  font-size: var(--font-size-sm);
  font-weight: 600;
  background: none;
  border: none;
  cursor: pointer;
}
.btn-login {
  width: 100%;
  padding: 14px;
  margin-top: var(--space-4);
  background: linear-gradient(135deg, var(--brown-600) 0%, var(--brown-700) 100%);
  color: var(--white);
  font-weight: 600;
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
}
.btn-login:disabled {
  opacity: 0.7;
}
.register-prompt {
  margin-top: var(--space-6);
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--gray-600);
}
.register-link {
  color: var(--brown-600);
  font-weight: 600;
  text-decoration: none;
}
.btn-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin { 100% { transform: rotate(360deg); } }
</style>
