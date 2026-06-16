<script setup lang="ts">
/**
 * XoaTaiKhoanView — "Yêu Cầu Xoá Tài Khoản & Dữ Liệu" (/xoa-tai-khoan).
 *
 * Đây là URL công khai để dán vào ô "Account deletion / Xoá tài khoản" trong
 * Google Play Console (yêu cầu bắt buộc: người dùng phải xoá được tài khoản KHÔNG cần cài app).
 *
 * Luồng: người dùng nhập SĐT + mật khẩu của tài khoản app, tick xác nhận → gọi
 * POST /patient-auth/request-deletion. Backend xác minh rồi SOFT DELETE (set deletedAt):
 * tài khoản không đăng nhập lại được, dữ liệu được giữ lại theo quy định lưu hồ sơ y tế
 * rồi xoá hẳn theo lịch.
 *
 * Gọi fetch trực tiếp (KHÔNG dùng wrapper @/services/api) vì wrapper tự redirect /login
 * khi gặp 401 — mà ở đây 401 chỉ nghĩa là "sai SĐT/mật khẩu", cần báo tại chỗ.
 */
import { ref, computed } from 'vue'
import LegalPageLayout from '@/components/LegalPageLayout.vue'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const phone = ref('')
const password = ref('')
const confirmed = ref(false)
const status = ref<'idle' | 'submitting' | 'success'>('idle')
const errorMsg = ref('')

const canSubmit = computed(
  () =>
    phone.value.trim().length > 0 &&
    password.value.length > 0 &&
    confirmed.value &&
    status.value !== 'submitting',
)

async function submit() {
  errorMsg.value = ''
  if (!canSubmit.value) return
  status.value = 'submitting'
  try {
    const res = await fetch(`${API_BASE}/patient-auth/request-deletion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone.value.trim(), password: password.value }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      if (res.status === 401) {
        errorMsg.value = 'Số điện thoại hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.'
      } else {
        errorMsg.value = data?.message || `Đã có lỗi xảy ra (mã ${res.status}). Vui lòng thử lại.`
      }
      status.value = 'idle'
      return
    }
    status.value = 'success'
    password.value = ''
  } catch {
    errorMsg.value = 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.'
    status.value = 'idle'
  }
}
</script>

<template>
  <LegalPageLayout
    title="Yêu Cầu Xoá Tài Khoản"
    lead="Xoá tài khoản và dữ liệu cá nhân của bạn trong ứng dụng “Kinh Lạc Trương Gia”."
    updated="16/06/2026"
  >
    <p>
      Trang này dành cho người dùng ứng dụng <strong>“Kinh Lạc Trương Gia”</strong> muốn xoá tài khoản và
      dữ liệu cá nhân liên quan. Bạn có thể thực hiện ngay tại đây mà không cần cài đặt ứng dụng.
    </p>

    <h2>Dữ liệu sẽ bị xoá</h2>
    <ul>
      <li>Thông tin tài khoản: số điện thoại, mật khẩu.</li>
      <li>Hồ sơ cá nhân: họ tên, giới tính, ngày/giờ sinh, địa chỉ, tỉnh/thành.</li>
      <li>Dữ liệu sức khoẻ gắn với tài khoản: tiền sử bệnh, lịch sử khám/đo, lịch hẹn.</li>
    </ul>
    <p>
      Sau khi gửi yêu cầu, tài khoản của bạn <strong>bị vô hiệu hoá ngay</strong> (không đăng nhập lại được).
      Dữ liệu được gỡ khỏi hoạt động bình thường và <strong>xoá hẳn theo chính sách lưu trữ</strong>;
      một phần hồ sơ khám chữa bệnh có thể được lưu giữ trong thời hạn pháp luật yêu cầu, sau đó xoá.
      Hành động này <strong>không thể hoàn tác</strong>.
    </p>

    <!-- Thành công -->
    <div v-if="status === 'success'" class="xtk-result xtk-result--ok" role="status">
      <strong>Đã tiếp nhận yêu cầu xoá tài khoản.</strong>
      <p>
        Tài khoản của bạn đã được vô hiệu hoá. Nếu cần hỗ trợ thêm, liên hệ
        <a href="mailto:baomat@kinhlac.online">baomat@kinhlac.online</a>.
      </p>
    </div>

    <!-- Biểu mẫu -->
    <form v-else class="xtk-form" @submit.prevent="submit">
      <h2>Xác minh &amp; gửi yêu cầu</h2>
      <p>Nhập đúng số điện thoại và mật khẩu của tài khoản cần xoá để xác minh đây là tài khoản của bạn.</p>

      <label class="xtk-field">
        <span class="xtk-label">Số điện thoại</span>
        <input
          v-model="phone"
          type="tel"
          inputmode="tel"
          autocomplete="tel"
          placeholder="Số điện thoại đăng ký"
          class="xtk-input"
          required
        />
      </label>

      <label class="xtk-field">
        <span class="xtk-label">Mật khẩu</span>
        <input
          v-model="password"
          type="password"
          autocomplete="current-password"
          placeholder="Mật khẩu tài khoản"
          class="xtk-input"
          required
        />
      </label>

      <label class="xtk-check">
        <input v-model="confirmed" type="checkbox" />
        <span>Tôi hiểu rằng tài khoản và dữ liệu của tôi sẽ bị xoá và hành động này không thể hoàn tác.</span>
      </label>

      <p v-if="errorMsg" class="xtk-error" role="alert">{{ errorMsg }}</p>

      <button type="submit" class="xtk-submit" :disabled="!canSubmit">
        {{ status === 'submitting' ? 'Đang gửi yêu cầu…' : 'Xoá tài khoản của tôi' }}
      </button>
    </form>

    <h2>Cách khác: gửi yêu cầu thủ công</h2>
    <p>
      Nếu không đăng nhập được, bạn có thể gửi yêu cầu xoá tới
      <a href="mailto:baomat@kinhlac.online?subject=Yêu%20cầu%20xoá%20tài%20khoản%20Kinh%20Lạc&body=Tôi%20muốn%20xoá%20tài%20khoản%20và%20dữ%20liệu.%20Số%20điện%20thoại%20đăng%20ký:%20">baomat@kinhlac.online</a>
      hoặc gọi <a href="tel:0353247247">0353.247.247</a> (ghi rõ số điện thoại đã đăng ký).
      Chúng tôi xử lý trong vòng tối đa <strong>30 ngày</strong>.
    </p>
  </LegalPageLayout>
</template>

<style scoped>
.xtk-form {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-6);
  margin: var(--space-5) 0;
}
.xtk-field {
  display: block;
  margin: var(--space-4) 0;
}
.xtk-label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text);
  margin-bottom: var(--space-2);
}
.xtk-input {
  width: 100%;
  height: 44px;
  padding: 0 var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  background: var(--bg-app);
  color: var(--text);
  box-sizing: border-box;
}
.xtk-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.18);
}
.xtk-check {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  margin: var(--space-4) 0;
  font-size: var(--font-size-sm);
  line-height: 1.6;
  color: var(--text);
  cursor: pointer;
}
.xtk-check input {
  margin-top: 3px;
  flex-shrink: 0;
}
.xtk-error {
  color: var(--danger, #c0392b);
  font-size: var(--font-size-sm);
  margin: var(--space-3) 0;
}
.xtk-submit {
  width: 100%;
  height: 46px;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--white);
  background: var(--danger, #c0392b);
  cursor: pointer;
  transition: opacity var(--transition-fast);
}
.xtk-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.xtk-result {
  border-radius: var(--radius-md);
  padding: var(--space-5);
  margin: var(--space-5) 0;
}
.xtk-result--ok {
  background: var(--success-bg, #e9f7ef);
  border: 1px solid var(--success-border, #a3e0bd);
  color: var(--success-fg, #1e7e44);
}
.xtk-result--ok p {
  margin: var(--space-2) 0 0;
}
</style>
