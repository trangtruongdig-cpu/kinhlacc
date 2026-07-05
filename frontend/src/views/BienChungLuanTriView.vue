<script setup lang="ts">
/**
 * Biện Chứng Luận Trị — GỘP "Thương Hàn Tạp Luận Bệnh" (lý thuyết, bóc lớp) + "Bàn Xoay Biện Chứng"
 * (tra cứu lâm sàng) vào 1 tab. Hai chế độ chung một khung Lục Kinh·Tạng Phủ·Lục Khí:
 *   ① Lý thuyết — bóc lớp Âm Dương → … → Lục Kinh (hiểu mạch tư duy).
 *   ② Tra cứu   — bàn xoay: Khung → nhánh Tây Y / Đông Y → soi bệnh.
 * Từ lý thuyết → lâm sàng liền mạch. <KeepAlive> giữ trạng thái mỗi chế độ khi chuyển qua lại.
 */
import { ref } from 'vue'
import ThuongHanView from './ThuongHanView.vue'
import BanXoayBienChungView from './BanXoayBienChungView.vue'

const mode = ref<'ly-thuyet' | 'tra-cuu'>('tra-cuu')
</script>

<template>
  <div class="bclt">
    <div class="bclt-toggle" role="tablist">
      <button type="button" role="tab" :aria-selected="mode === 'tra-cuu'" class="bclt-tab" :class="{ on: mode === 'tra-cuu' }" @click="mode = 'tra-cuu'">
        <span class="bclt-ic">🧭</span>
        <span class="bclt-txt"><b>Tra cứu lâm sàng</b><small>bàn xoay: nhánh → soi bệnh</small></span>
      </button>
      <button type="button" role="tab" :aria-selected="mode === 'ly-thuyet'" class="bclt-tab" :class="{ on: mode === 'ly-thuyet' }" @click="mode = 'ly-thuyet'">
        <span class="bclt-ic">📖</span>
        <span class="bclt-txt"><b>Lý thuyết</b><small>học thêm: bóc lớp Âm Dương → Lục Kinh</small></span>
      </button>
    </div>

    <KeepAlive>
      <ThuongHanView v-if="mode === 'ly-thuyet'" />
      <BanXoayBienChungView v-else />
    </KeepAlive>
  </div>
</template>

<style scoped>
.bclt { display: flex; flex-direction: column; gap: 14px; }
.bclt-toggle {
  display: flex; align-items: stretch; gap: 8px; flex-wrap: wrap;
  background: var(--surface, #fff); border: 1px solid var(--border, #e7ddcd); border-radius: 14px; padding: 8px;
}
.bclt-tab {
  flex: 1 1 220px; min-width: 200px; font: inherit; cursor: pointer; text-align: left;
  display: flex; align-items: center; gap: 12px; padding: 10px 16px; border-radius: 10px;
  border: 1px solid transparent; background: var(--brown-50, #f7efe2); color: var(--brown-700, #6b4a24);
  transition: all 0.15s;
}
.bclt-tab:hover { border-color: var(--brown-300, #d3b58a); }
.bclt-tab.on { background: linear-gradient(135deg, var(--brown-600, #6b4a24), var(--brown-800, #2e1d0d)); color: #fff; border-color: transparent; box-shadow: 0 6px 16px rgba(60, 40, 15, 0.22); }
.bclt-ic { font-size: 22px; line-height: 1; }
.bclt-txt { display: flex; flex-direction: column; gap: 1px; }
.bclt-txt b { font-size: 15px; font-weight: 800; }
.bclt-txt small { font-size: 12px; opacity: 0.8; }
.bclt-arrow { align-self: center; font-size: 20px; font-weight: 800; color: var(--brown-400, #b98d54); }
@media (max-width: 620px) { .bclt-arrow { display: none; } }
</style>
