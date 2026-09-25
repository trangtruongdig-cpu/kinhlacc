<script setup lang="ts">
/**
 * Nút nổi "Báo lỗi / Góp ý".
 *
 * Vì sao cần dù đã có bộ bắt lỗi tự động: máy chỉ thấy được thứ nó ném ra exception. Những lỗi
 * tệ nhất lại IM LẶNG — nút bấm không phản hồi, số hiện sai, danh sách thiếu mất một dòng. Chỉ
 * người đang dùng mới biết, và họ chỉ nói nếu việc nói mất chưa tới mười giây.
 */
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { baoGopY } from '@/lib/baoSuCo'

const route = useRoute()
const moRong = ref(false)
const tieuDe = ref('')
const moTa = ref('')
const daGui = ref(false)

function mo() {
  moRong.value = true
  daGui.value = false
}

function dong() {
  moRong.value = false
  tieuDe.value = ''
  moTa.value = ''
}

function gui() {
  const td = tieuDe.value.trim()
  if (!td) return
  baoGopY(td, moTa.value.trim(), { trang: route.fullPath })
  daGui.value = true
  tieuDe.value = ''
  moTa.value = ''
  // Để lời cảm ơn kịp đọc rồi mới đóng.
  setTimeout(() => (moRong.value = false), 1800)
}
</script>

<template>
  <div class="goc-bao-loi">
    <button v-if="!moRong" class="nut-noi" title="Báo lỗi hoặc góp ý" @click="mo">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
        />
      </svg>
      <span class="nut-chu">Báo lỗi</span>
    </button>

    <div v-else class="khung">
      <header class="khung-dau">
        <strong>Báo lỗi / Góp ý</strong>
        <button class="nut-dong" aria-label="Đóng" @click="dong">×</button>
      </header>

      <p v-if="daGui" class="cam-on">
        Đã gửi. Cảm ơn bạn — góp ý vào thẳng bảng xử lý của quản trị.
      </p>

      <template v-else>
        <p class="giai-thich">
          Hệ thống tự kèm sẵn trang bạn đang xem và các thao tác gần nhất, nên bạn chỉ cần tả ngắn
          gọn.
        </p>
        <input
          v-model="tieuDe"
          class="o-nhap"
          type="text"
          maxlength="120"
          placeholder="Chuyện gì xảy ra? (bắt buộc)"
          @keydown.enter="gui"
        />
        <textarea
          v-model="moTa"
          class="o-nhap o-mo-ta"
          rows="3"
          maxlength="1000"
          placeholder="Bạn đang định làm gì, và nó sai thế nào?"
        ></textarea>
        <div class="hang-nut">
          <button class="nut-gui" :disabled="!tieuDe.trim()" @click="gui">Gửi</button>
          <button class="nut-huy" @click="dong">Huỷ</button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.goc-bao-loi {
  position: fixed;
  right: var(--space-4);
  bottom: var(--space-4);
  z-index: 800;
}

.nut-noi {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 44px;
  padding: 0 var(--space-4);
  border: 1px solid var(--border-brand);
  border-radius: var(--radius-full);
  background: var(--surface);
  color: var(--text-brand);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  box-shadow: var(--shadow-md);
  transition:
    box-shadow var(--transition-fast),
    transform var(--transition-fast);
}
.nut-noi:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-1px);
}

.khung {
  width: min(340px, calc(100vw - var(--space-8)));
  background: var(--surface);
  border: 1px solid var(--border-brand);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  padding: var(--space-4);
}
.khung-dau {
  display: flex;
  align-items: center;
  margin-bottom: var(--space-3);
  color: var(--text-brand);
  font-size: var(--font-size-sm);
}
.nut-dong {
  margin-left: auto;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  font-size: 20px;
  line-height: 1;
  color: var(--text-muted);
  cursor: pointer;
}

.giai-thich {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  margin: 0 0 var(--space-3);
  line-height: 1.5;
}
.cam-on {
  font-size: var(--font-size-sm);
  color: var(--success);
  margin: 0;
  line-height: 1.5;
}

.o-nhap {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  margin-bottom: var(--space-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text);
  font: inherit;
  font-size: var(--font-size-sm);
}
.o-mo-ta {
  resize: vertical;
}

.hang-nut {
  display: flex;
  gap: var(--space-2);
}
.nut-gui {
  flex: 1;
  min-height: 40px;
  border: none;
  border-radius: var(--radius-md);
  background: var(--primary);
  color: var(--white);
  font-weight: 600;
  font-size: var(--font-size-sm);
  cursor: pointer;
}
.nut-gui:disabled {
  opacity: 0.45;
  cursor: default;
}
.nut-huy {
  min-height: 40px;
  padding: 0 var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--text-muted);
  font-size: var(--font-size-sm);
  cursor: pointer;
}

@media (max-width: 640px) {
  .nut-chu {
    display: none;
  }
  .nut-noi {
    padding: 0;
    width: 44px;
    justify-content: center;
  }
}
</style>
