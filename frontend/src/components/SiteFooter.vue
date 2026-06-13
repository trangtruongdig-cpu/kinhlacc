<script setup lang="ts">
/**
 * SiteFooter — Chân trang dùng chung cho các trang CÔNG KHAI (trust + demo).
 *
 * Vai trò YMYL: gom các link "trang Tin Cậy" (Về Chúng Tôi, Liên Hệ, Bảo Mật, Điều Khoản,
 * Quy Trình Biên Tập) cho hiện ở MỌI trang công khai → tín hiệu tin cậy chạy khắp web.
 * Kèm bản miễn trừ y tế gọn.
 */
import { RouterLink } from 'vue-router'
import MedicalDisclaimer from '@/components/MedicalDisclaimer.vue'

const trustLinks = [
  { to: '/ve-chung-toi', label: 'Về Chúng Tôi' },
  { to: '/lien-he', label: 'Liên Hệ' },
  { to: '/chinh-sach-bao-mat', label: 'Chính Sách Bảo Mật' },
  { to: '/dieu-khoan', label: 'Điều Khoản Sử Dụng' },
  { to: '/quy-trinh-bien-tap', label: 'Quy Trình Biên Tập' },
]
const exploreLinks = [
  { to: '/thu-vien', label: 'Từ Điển Huyệt Vị' },
  { to: '/xem-3d', label: 'Đồ Hình Kinh Lạc 3D' },
  { to: '/xem-ket-qua-do', label: 'Kết Quả Đo Kinh Lạc' },
  { to: '/xem-bai-thuoc', label: 'Phân Tích Bài Thuốc' },
]
</script>

<template>
  <footer class="sf">
    <div class="sf-inner">
      <div class="sf-cols">
        <div class="sf-col sf-col--brand">
          <div class="sf-brand">
            <svg width="28" height="28" viewBox="0 0 64 64" fill="none" aria-hidden="true">
              <circle cx="32" cy="32" r="30" stroke="rgba(255,255,255,.3)" stroke-width="2" />
              <path
                d="M32 12C32 12 20 22 20 32C20 38.627 25.373 44 32 44C38.627 44 44 38.627 44 32C44 22 32 12 32 12Z"
                fill="rgba(255,255,255,.9)"
              />
              <circle cx="32" cy="32" r="4" fill="var(--brown-700)" />
            </svg>
            <span class="sf-brand-text">Kinh Lạc Trương Gia</span>
          </div>
          <p class="sf-tagline">Đông Y nghìn năm, giờ đọc được bằng dữ liệu.</p>
        </div>

        <nav class="sf-col" aria-label="Khám phá">
          <h3 class="sf-col-title">Khám Phá</h3>
          <RouterLink v-for="l in exploreLinks" :key="l.to" :to="l.to" class="sf-link">{{ l.label }}</RouterLink>
        </nav>

        <nav class="sf-col" aria-label="Thông tin & pháp lý">
          <h3 class="sf-col-title">Thông Tin &amp; Pháp Lý</h3>
          <RouterLink v-for="l in trustLinks" :key="l.to" :to="l.to" class="sf-link">{{ l.label }}</RouterLink>
        </nav>
      </div>

      <div class="sf-disclaimer">
        <MedicalDisclaimer compact />
      </div>

      <p class="sf-copy">Kinh Lạc Trương Gia · Phần Mềm Y Học Cổ Truyền · © 2026 · kinhlac.online</p>
    </div>
  </footer>
</template>

<style scoped>
.sf {
  background: var(--brown-900);
  color: rgba(255, 255, 255, 0.72);
}
.sf-inner {
  max-width: 1180px;
  margin: 0 auto;
  padding: var(--space-12) var(--space-6) var(--space-8);
}
.sf-cols {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr;
  gap: var(--space-8);
}
.sf-brand {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}
.sf-brand-text {
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--white);
}
.sf-tagline {
  margin: var(--space-3) 0 0;
  font-size: var(--font-size-sm);
  color: rgba(255, 255, 255, 0.55);
  max-width: 30ch;
}
.sf-col-title {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--white);
  margin: 0 0 var(--space-3);
}
.sf-col {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.sf-link {
  font-size: var(--font-size-sm);
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  width: fit-content;
  transition: color var(--transition-fast);
}
.sf-link:hover {
  color: var(--white);
  text-decoration: underline;
}
.sf-disclaimer {
  margin-top: var(--space-8);
  padding-top: var(--space-5);
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}
.sf-disclaimer :deep(.md-compact) {
  color: rgba(255, 255, 255, 0.5);
}
.sf-disclaimer :deep(.md-compact strong) {
  color: rgba(255, 255, 255, 0.72);
}
.sf-copy {
  margin: var(--space-5) 0 0;
  font-size: var(--font-size-xs);
  color: rgba(255, 255, 255, 0.45);
}

@media (max-width: 768px) {
  .sf-cols {
    grid-template-columns: 1fr;
    gap: var(--space-6);
  }
}
</style>
