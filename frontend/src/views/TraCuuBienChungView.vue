<script setup lang="ts">
/**
 * TraCuuBienChungView — TRANG CÔNG KHAI (không cần đăng nhập) để tra cứu Biện Chứng Luận Trị miễn phí.
 * Gói view GỘP (Tra cứu ↔ Lý thuyết) — đọc các endpoint @Public /thuong-han/* — trong chrome landing gọn.
 */
import BienChungLuanTriView from './BienChungLuanTriView.vue'
</script>

<template>
  <div class="pub">
    <header class="pub-head">
      <RouterLink to="/" class="pub-logo">
        <span class="pub-logo-dot">◉</span> <span>Y Học Cổ Truyền</span>
      </RouterLink>
      <nav class="pub-nav">
        <RouterLink to="/" class="pub-link">← Trang chủ</RouterLink>
      </nav>
    </header>

    <main class="pub-main">
      <BienChungLuanTriView />
    </main>

    <footer class="pub-foot">
      辨證盤 · <b>Bàn Xoay Biện Chứng</b> — số hoá trí tuệ cổ nhân · tra cứu miễn phí
      · <RouterLink to="/" class="pub-foot-link">Y Học Cổ Truyền</RouterLink>
    </footer>
  </div>
</template>

<style scoped>
.pub { min-height: 100vh; min-height: 100dvh; background: var(--bg, #faf6ee); display: flex; flex-direction: column; }
.pub-head {
  position: sticky; top: 0; z-index: 20;
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 12px clamp(14px, 4vw, 40px);
  background: color-mix(in srgb, var(--surface, #fff) 88%, transparent); backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--border, #e7ddcd);
}
.pub-logo { display: inline-flex; align-items: center; gap: 8px; font-weight: 800; font-size: 17px; color: var(--brown-700, #6b4a24); text-decoration: none; }
.pub-logo-dot { color: var(--brown-500, #8a5a2a); }
.pub-nav { display: flex; align-items: center; gap: 8px; }
.pub-link { font-size: 14px; font-weight: 700; text-decoration: none; padding: 7px 15px; border-radius: 999px; color: var(--brown-700, #6b4a24); border: 1px solid transparent; }
.pub-link:hover { border-color: var(--border, #e7ddcd); }
.pub-main { flex: 1; width: 100%; max-width: 1400px; margin: 0 auto; padding: clamp(14px, 3vw, 28px); }
.pub-foot { text-align: center; font-size: 12.5px; color: var(--text-muted, #8a7a60); padding: 20px; border-top: 1px solid var(--border, #e7ddcd); }
.pub-foot-link { color: var(--brown-600, #6b4a24); font-weight: 700; text-decoration: none; }
</style>
