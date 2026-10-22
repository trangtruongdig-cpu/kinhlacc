<script setup lang="ts">
/**
 * Dải CÂU CHỐT — dòng chữ lớn nhất màn, là thứ bệnh nhân ngồi cách 1m đọc được.
 *
 * Vì sao cần: đo 22/10/2026, riêng bước 1 của màn Kết Quả Đo có 219 phần tử, 13 cỡ chữ, và
 * cỡ nhỏ nhất là 9px. Thông tin không được phân tầng — nó được nhét vào bằng cách thu nhỏ
 * chữ. Dải này dựng lại tầng trên cùng: MỘT ý, đọc được từ xa.
 *
 * Thuật ngữ (`chinh`) ở trên, lời thường (`thuong`) ngay dưới và nhỏ hơn: thầy thuốc đọc
 * dòng trên, bệnh nhân đọc dòng dưới.
 *
 * ⚠️ `chinh` rỗng thì KHÔNG hiện gì — một dải trống còn tệ hơn không có dải.
 */
defineProps<{ chinh: string; thuong?: string; phu?: string }>()
</script>

<template>
  <div v-if="chinh" class="cc-dai">
    <p class="cc-chinh">{{ chinh }}</p>
    <p v-if="thuong" class="cc-thuong">{{ thuong }}</p>
    <p v-if="phu" class="cc-phu">{{ phu }}</p>
  </div>
</template>

<style scoped>
/* Chỉ dùng token — không viết cứng px. PHẲNG: một đường viền, không bóng đổ. */
.cc-dai {
  padding: var(--space-5) var(--space-4);
  margin-bottom: var(--space-5);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
}
.cc-chinh {
  margin: 0;
  font-size: var(--font-size-3xl);
  font-weight: 700;
  line-height: 1.25;
  color: var(--text);
}
.cc-thuong {
  margin: var(--space-2) 0 0;
  font-size: var(--font-size-base);
  line-height: 1.5;
  color: var(--text-muted);
}
.cc-phu {
  margin: var(--space-2) 0 0;
  font-size: var(--font-size-sm);
  color: var(--text-subtle);
}
</style>
