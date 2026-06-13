<script setup lang="ts">
/**
 * LienHeView — Trang "Liên Hệ" (/lien-he).
 * Vai trò YMYL: cung cấp NAP (Name–Address–Phone) thật → tín hiệu Trust quan trọng.
 * Đã điền mặc định: email lienhe@kinhlac.online + website. Thêm địa chỉ/điện thoại thật khi có
 * (NAP đầy đủ giúp tăng độ tin cậy địa phương).
 */
import LegalPageLayout from '@/components/LegalPageLayout.vue'
</script>

<template>
  <LegalPageLayout
    title="Liên Hệ"
    lead="Bạn cần hỗ trợ, tư vấn sản phẩm hay hợp tác? Liên hệ với chúng tôi qua các kênh dưới đây."
    updated="05/06/2026"
  >
    <h2>Thông Tin Liên Hệ</h2>
    <div class="legal-card">
      <p><strong>Đơn vị:</strong> Kinh Lạc Trương Gia</p>
      <p><strong>Người phụ trách:</strong> Trương Đình Trang (Y Sỹ Y Học Cổ Truyền — đang theo học)</p>
      <p><strong>Địa chỉ:</strong> Số 16, đường Ao Sen, An Khánh, Hoài Đức, Hà Nội</p>
      <p>
        <strong>Điện thoại / Zalo:</strong>
        <a href="tel:0353247247">0353.247.247</a>
      </p>
      <p>
        <strong>Email:</strong>
        <a href="mailto:lienhe@kinhlac.online">lienhe@kinhlac.online</a>
      </p>
      <p>
        <strong>Website:</strong>
        <a href="https://kinhlac.online">kinhlac.online</a>
      </p>
      <p><strong>Giờ làm việc:</strong> Thứ 2 – Thứ 7, 8:00 – 17:00</p>
    </div>

    <h2>Hỗ Trợ Sản Phẩm</h2>
    <p>
      Với câu hỏi về cách dùng phần mềm, đo kinh lạc, tra cứu huyệt vị hay quản lý phòng khám,
      vui lòng gửi email kèm mô tả cụ thể để được hỗ trợ nhanh nhất.
    </p>

    <h2>Về Dữ Liệu Cá Nhân</h2>
    <p>
      Yêu cầu liên quan tới dữ liệu cá nhân (xem, sửa, xoá…) xin gửi tới đầu mối nêu trong
      <a href="/chinh-sach-bao-mat">Chính Sách Bảo Mật</a>.
    </p>

    <h2>Lưu Ý Y Tế</h2>
    <p>
      Đây <strong>không phải</strong> kênh tư vấn khám chữa bệnh. Khi có vấn đề sức khoẻ, hãy đến cơ sở y tế
      hoặc gặp thầy thuốc có chuyên môn. Trường hợp cấp cứu, gọi <strong>115</strong>.
    </p>
  </LegalPageLayout>
</template>
