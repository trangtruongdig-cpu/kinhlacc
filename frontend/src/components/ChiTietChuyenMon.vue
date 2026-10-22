<script setup lang="ts">
/**
 * Vỏ TẦNG 3 — chi tiết chuyên môn, đóng sẵn.
 *
 * Dùng <details> của trình duyệt chứ không dựng toggle bằng JS: nội dung vẫn nằm trong DOM
 * nên trợ lý AI, bot tìm kiếm và Ctrl+F đều thấy, và không có state nào để sai.
 *
 * ⚠️ Đây là chỗ LÙI XUỐNG, không phải chỗ bỏ đi. Mọi thứ trước đây hiện mặc định phải còn
 * đủ ở trong này — mở ra là thấy nguyên vẹn. Ranh giới này là phần chịu lực của cả thiết kế:
 * "gọn mắt" mà mất thông tin y văn thì không phải gọn, là hỏng.
 */
withDefaults(defineProps<{ nhan?: string }>(), { nhan: 'Chi tiết chuyên môn' })
</script>

<template>
  <details class="ctcm">
    <summary class="ctcm-nhan">{{ nhan }}</summary>
    <div class="ctcm-than"><slot /></div>
  </details>
</template>

<style scoped>
.ctcm {
  margin-top: var(--space-6);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
}
.ctcm-nhan {
  padding: var(--space-3) var(--space-4);
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--text-muted);
  cursor: pointer;
  list-style: none;
}
.ctcm-nhan::-webkit-details-marker { display: none; }
.ctcm-nhan::before { content: '▸ '; }
.ctcm[open] .ctcm-nhan::before { content: '▾ '; }
.ctcm-than { padding: 0 var(--space-4) var(--space-4); }
</style>
