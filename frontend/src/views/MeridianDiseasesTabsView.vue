<script setup lang="ts">
import { ref } from 'vue'
import MeridianDiseasesView from './MeridianDiseasesView.vue'
import ModernDiseasesView from './ModernDiseasesView.vue'
import KinhMachView from './KinhMachView.vue'
import HuyetViView from './HuyetViView.vue'
import PhacDoDieuTriView from './PhacDoDieuTriView.vue'
import TonThuongTacNhanView from './TonThuongTacNhanView.vue'

type SubTab = 'dong-y' | 'hien-dai' | 'kinh-mach' | 'huyet-vi' | 'phac-do' | 'ton-thuong'
const activeSub = ref<SubTab>('dong-y')

const tabs: { key: SubTab; label: string }[] = [
  { key: 'dong-y', label: 'Bệnh YHCT - Đông Y' },
  { key: 'hien-dai', label: 'Bệnh Y Học Hiện Đại' },
  { key: 'kinh-mach', label: 'Kinh Mạch' },
  { key: 'huyet-vi', label: 'Huyệt Vị' },
  { key: 'phac-do', label: 'Phương Huyệt' },
  { key: 'ton-thuong', label: 'Tổn Thương - Tác Nhân' },
]
</script>

<template>
  <div class="diseases-tabs">
    <div class="sub-tab-bar">
      <button
        v-for="t in tabs"
        :key="t.key"
        type="button"
        class="sub-tab-btn"
        :class="{ active: activeSub === t.key }"
        @click="activeSub = t.key"
      >
        {{ t.label }}
      </button>
    </div>

    <KeepAlive>
      <MeridianDiseasesView v-if="activeSub === 'dong-y'" />
      <ModernDiseasesView v-else-if="activeSub === 'hien-dai'" />
      <KinhMachView v-else-if="activeSub === 'kinh-mach'" />
      <HuyetViView v-else-if="activeSub === 'huyet-vi'" />
      <PhacDoDieuTriView v-else-if="activeSub === 'phac-do'" />
      <TonThuongTacNhanView v-else />
    </KeepAlive>
  </div>
</template>

<style scoped>
.diseases-tabs { width: 100%; }
.sub-tab-bar {
  display: flex;
  gap: 4px;
  padding: 4px;
  margin: var(--space-4) auto 0;
  max-width: 1400px;
  background: var(--white);
  border: 1px solid var(--brown-200);
  border-radius: var(--radius-lg);
  width: fit-content;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  flex-wrap: wrap;
}
.sub-tab-btn {
  padding: var(--space-2) var(--space-5);
  border-radius: var(--radius-md);
  border: none;
  background: transparent;
  font-weight: 600;
  font-size: var(--font-size-sm);
  color: var(--gray-600);
  cursor: pointer;
  transition: all var(--transition-base);
}
.sub-tab-btn:hover { color: var(--brown-700); }
.sub-tab-btn.active {
  background: var(--brown-600);
  color: var(--white);
  box-shadow: 0 2px 4px rgba(161, 98, 7, 0.2);
}
</style>
