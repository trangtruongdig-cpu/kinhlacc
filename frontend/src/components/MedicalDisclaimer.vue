<script setup lang="ts">
/**
 * MedicalDisclaimer — Hộp "Tuyên Bố Miễn Trừ Y Tế" dùng lại được (chuẩn YMYL).
 *
 * Vì sao cần: web nói về chẩn đoán/chữa bệnh → Google xếp nhóm YMYL (soi rất gắt).
 * Hộp này là tín hiệu TIN CẬY bắt buộc: nhắc người đọc nội dung chỉ để THAM KHẢO,
 * không thay thế thầy thuốc. Gắn ở cuối mỗi bài blog + trang demo kết quả/bài thuốc.
 *
 * Cách dùng:
 *   <MedicalDisclaimer />                         → bản chung (mặc định)
 *   <MedicalDisclaimer context="measurement" />   → thêm câu "đây là ca mẫu minh hoạ"
 *   <MedicalDisclaimer context="formula" />       → thêm câu cho bài thuốc
 *   <MedicalDisclaimer compact />                  → bản gọn 1 dòng (cho chân trang)
 */
withDefaults(
  defineProps<{
    /** 'general' = chung · 'measurement' = trang kết quả đo · 'formula' = bài thuốc */
    context?: 'general' | 'measurement' | 'formula'
    /** true = bản gọn 1 dòng (dùng trong footer) */
    compact?: boolean
  }>(),
  { context: 'general', compact: false },
)
</script>

<template>
  <!-- Bản gọn cho chân trang -->
  <p v-if="compact" class="md-compact">
    <strong>Miễn trừ y tế:</strong> Nội dung trên website chỉ mang tính tham khảo &amp; học tập,
    không thay thế việc thăm khám, chẩn đoán hay điều trị của thầy thuốc/bác sỹ có chuyên môn.
  </p>

  <!-- Bản đầy đủ -->
  <aside v-else class="md-box" role="note" aria-label="Tuyên bố miễn trừ y tế">
    <div class="md-head">
      <svg class="md-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 2 3 6v6c0 5 3.8 8.4 9 10 5.2-1.6 9-5 9-10V6l-9-4Zm-1 6h2v6h-2V8Zm0 8h2v2h-2v-2Z"
        />
      </svg>
      <span class="md-title">Tuyên Bố Miễn Trừ Y Tế</span>
    </div>

    <p class="md-text">
      Thông tin trên trang chỉ mang tính <strong>tham khảo và học tập</strong>,
      <strong>không thay thế</strong> việc thăm khám, chẩn đoán hay điều trị của thầy thuốc/bác sỹ
      có chuyên môn. <strong>Không tự ý</strong> dùng thông tin tại đây để tự chẩn đoán hoặc tự điều trị.
    </p>

    <p v-if="context === 'measurement'" class="md-text">
      Đây là <strong>ca đo mẫu</strong> dùng để minh hoạ cách đọc kết quả; các chỉ số và kết luận
      <strong>không phải là chẩn đoán</strong> dành cho bạn hay bất kỳ người đọc nào.
    </p>

    <p v-if="context === 'formula'" class="md-text">
      Phân tích bài thuốc theo y văn cổ truyền chỉ để <strong>tra cứu</strong>. Việc dùng vị thuốc,
      gia giảm và liều lượng <strong>phải</strong> do thầy thuốc có chuyên môn chỉ định trên từng người bệnh.
    </p>

    <p class="md-text md-text--last">
      Khi có dấu hiệu bất thường về sức khoẻ, hãy <strong>đến cơ sở y tế</strong> hoặc gặp thầy thuốc.
      Trong trường hợp cấp cứu, gọi <strong>115</strong>.
    </p>
  </aside>
</template>

<style scoped>
.md-box {
  background: var(--warning-bg);
  border: 1px solid var(--warning-border);
  border-left: 4px solid var(--warning);
  border-radius: var(--radius-md);
  padding: var(--space-4) var(--space-5);
  margin: var(--space-6) 0;
  color: var(--warning-fg);
}
.md-head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}
.md-icon {
  flex-shrink: 0;
  color: var(--warning);
}
.md-title {
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--warning-fg);
}
.md-text {
  font-size: var(--font-size-sm);
  line-height: 1.65;
  margin: var(--space-2) 0 0;
  color: var(--warning-fg);
}
.md-text--last {
  margin-top: var(--space-3);
}
.md-text strong {
  font-weight: 700;
}

/* Bản gọn cho chân trang */
.md-compact {
  font-size: var(--font-size-xs);
  line-height: 1.6;
  color: var(--text-subtle);
  margin: 0;
}
.md-compact strong {
  color: var(--text-muted);
}
</style>
