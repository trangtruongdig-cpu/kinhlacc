<script setup lang="ts">
/**
 * TRANG CẦU NỐI sang khu quản trị nội dung (CMS, /_emdash/admin/).
 *
 * Người dùng không đọc gì ở đây — bình thường trang chỉ chớp qua. Nó tồn tại để làm
 * ba việc mà một thẻ <a> không làm được:
 *
 *  1. Xin VÉ từ app backend (`POST /auth/ve-cms`) — backend đọc lại quyền từ CSDL.
 *  2. Đổi vé lấy phiên đăng nhập của CMS, bằng fetch CÙNG NGUỒN GỐC. Nhờ đi trong
 *     thân POST, vé không bao giờ xuất hiện trên thanh địa chỉ, trong log của nginx,
 *     hay trong lịch sử trình duyệt.
 *  3. Nói ra LÝ DO khi hỏng. Trước đây bấm "Quản Trị Nội Dung" mà chưa đăng nhập CMS
 *     thì rơi thẳng vào trang passkey, không ai hiểu vì sao.
 *
 * ⚠️ Cùng nguồn gốc là điều kiện SỐNG CÒN: cookie phiên của CMS chỉ được đặt khi app
 * và CMS ở chung origin. Trên máy thật nginx lo việc đó; ở máy dev là nhờ
 * `server.proxy['/_emdash']` trong vite.config.ts. Bỏ proxy đó là luồng này chết ở dev
 * mà production vẫn chạy — kiểu hỏng khó lần nhất.
 */
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/services/api'

/** Nơi hạ cánh sau khi lập phiên xong. */
const CMS_MAC_DINH = import.meta.env.VITE_CMS_URL || '/_emdash/admin/'

/** Đường đổi vé, do nhà cung cấp "kinhlac" của CMS khai. */
const DUONG_DOI_VE = '/_emdash/api/auth/kinhlac/vao'

const route = useRoute()
const loi = ref<string | null>(null)
const dangChay = ref(true)

/** Chỉ nhận đường dẫn nội bộ. Chặn `//ke-gian.tld` và `/\ke-gian.tld` — mở chuyển
 *  hướng ra ngoài là biến trang này thành bàn đạp lừa đảo. */
function dichAnToan(raw: unknown): string {
  if (typeof raw !== 'string' || !raw) return CMS_MAC_DINH
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return CMS_MAC_DINH
  return raw
}

async function vaoCms() {
  dangChay.value = true
  loi.value = null
  try {
    // 1. Xin vé. `api.post` tự gắn Bearer token và tự đá về /login nếu 401.
    const { ve } = await api.post<{ ve: string; songGiay: number }>('/auth/ve-cms', {})

    // 2. Đổi vé lấy phiên. Dùng fetch trần chứ không dùng `api` vì đây là CMS, không
    //    phải backend: khác đường gốc, và tuyệt đối KHÔNG được gắn token của app vào.
    const res = await fetch(DUONG_DOI_VE, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        // ⚠️ HEADER NÀY KHÔNG PHẢI CHO CÓ — thiếu nó là production trả 403 CSRF_REJECTED
        // trong khi máy dev vẫn chạy ngon, tức kiểu hỏng chỉ lộ ra sau khi deploy.
        //
        // Lý do: EmDash kiểm CSRF ở route công khai bằng cách so Origin với origin của
        // chính request. Trình duyệt gửi `https://kinhlac.online`, nhưng chuỗi thật là
        // Caddy (cắt TLS) → nginx → cms đều HTTP thuần, mà @astrojs/node KHÔNG đọc
        // X-Forwarded-Proto (xem ghi chú EMDASH_SITE_URL trong docker-compose.yml) nên
        // CMS thấy origin của mình là `http://kinhlac.online`. Hai chuỗi lệch nhau ở
        // đúng chữ "s". `X-EmDash-Request: 1` là lối thoát mà chính EmDash công bố:
        // trình duyệt không đặt được header tuỳ biến khi gửi chéo nguồn gốc, nên sự có
        // mặt của nó đã chứng minh cùng nguồn gốc. Đã đo cả hai chiều.
        'X-EmDash-Request': '1',
      },
      body: JSON.stringify({ ve }),
    })
    const data = (await res.json().catch(() => null)) as { thongDiep?: string } | null
    if (!res.ok) {
      throw new Error(data?.thongDiep || `Khu quản trị nội dung từ chối (lỗi ${res.status}).`)
    }

    // 3. `replace` chứ không `href`: bấm Quay lại phải về chỗ cũ trong app, chứ không
    //    quay lại trang này rồi tiêu thêm một vé nữa.
    window.location.replace(dichAnToan(route.query.dich))
  } catch (e) {
    loi.value = e instanceof Error ? e.message : 'Không mở được khu quản trị nội dung.'
    dangChay.value = false
  }
}

onMounted(vaoCms)
</script>

<template>
  <div class="vao-cms">
    <div v-if="dangChay" class="hop">
      <div class="quay" aria-hidden="true"></div>
      <p class="dong">Đang mở khu quản trị nội dung…</p>
    </div>

    <div v-else class="hop">
      <h1 class="tieu-de">Chưa vào được khu quản trị nội dung</h1>
      <p class="loi">{{ loi }}</p>
      <div class="nut-hang">
        <button type="button" class="nut nut--chinh" @click="vaoCms">Thử lại</button>
        <RouterLink class="nut" :to="{ name: 'home' }">Về Trang Chủ</RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.vao-cms {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: var(--space-6, 1.5rem);
}

.hop {
  max-width: 34rem;
  text-align: center;
}

.quay {
  width: 2.5rem;
  height: 2.5rem;
  margin: 0 auto var(--space-4, 1rem);
  border: 3px solid var(--brown-200, #e6d9cc);
  border-top-color: var(--brown-600, #6b4423);
  border-radius: 50%;
  animation: xoay 0.9s linear infinite;
}

@keyframes xoay {
  to {
    transform: rotate(360deg);
  }
}

/* Người dùng bật "giảm chuyển động" thì đừng quay — chỉ mờ dần. */
@media (prefers-reduced-motion: reduce) {
  .quay {
    animation: none;
    opacity: 0.6;
  }
}

.dong {
  color: var(--gray-600, #57534e);
  font-size: 0.95rem;
}

.tieu-de {
  margin: 0 0 var(--space-3, 0.75rem);
  font-size: 1.25rem;
  color: var(--brown-800, #3d1f0a);
}

.loi {
  margin: 0 0 var(--space-5, 1.25rem);
  color: var(--gray-700, #44403c);
  line-height: 1.6;
}

.nut-hang {
  display: flex;
  gap: var(--space-3, 0.75rem);
  justify-content: center;
  flex-wrap: wrap;
}

.nut {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border: 1px solid var(--brown-300, #d6c3b0);
  border-radius: var(--radius-md, 8px);
  background: #fff;
  color: var(--brown-800, #3d1f0a);
  font: inherit;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
}

.nut:hover {
  background: var(--cream-100, #faf6f1);
}

.nut--chinh {
  background: var(--brown-600, #6b4423);
  border-color: var(--brown-600, #6b4423);
  color: #fff;
}

.nut--chinh:hover {
  background: var(--brown-700, #563519);
}
</style>
