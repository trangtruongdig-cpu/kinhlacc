<script setup lang="ts">
/**
 * DieuKhoanView — "Điều Khoản Sử Dụng" (/dieu-khoan).
 * Vai trò YMYL: giới hạn trách nhiệm + nêu rõ bản chất công cụ (tham khảo/chuyên môn,
 * KHÔNG phải tư vấn y khoa) → giảm rủi ro pháp lý + tăng Trust.
 *
 * ⚠️ Bản nháp thiện chí, không phải tư vấn pháp lý.
 */
import LegalPageLayout from '@/components/LegalPageLayout.vue'
import MedicalDisclaimer from '@/components/MedicalDisclaimer.vue'
</script>

<template>
  <LegalPageLayout
    title="Điều Khoản Sử Dụng"
    lead="Khi truy cập và sử dụng website, bạn đồng ý với các điều khoản dưới đây."
    updated="05/06/2026"
  >
    <h2>1. Chấp Nhận Điều Khoản</h2>
    <p>
      Bằng việc truy cập <strong>kinhlac.online</strong> và các tính năng đi kèm, bạn xác nhận đã đọc, hiểu
      và đồng ý tuân thủ các điều khoản này. Nếu không đồng ý, vui lòng ngừng sử dụng dịch vụ.
    </p>

    <h2>2. Bản Chất Dịch Vụ</h2>
    <p>
      Website cung cấp <strong>công cụ tra cứu, học tập và hỗ trợ chuyên môn</strong> về Y Học Cổ Truyền
      (đo kinh lạc, từ điển huyệt vị, đồ hình 3D, phân tích bài thuốc, quản lý phòng khám).
      Đây <strong>không phải</strong> dịch vụ khám, chữa bệnh và <strong>không thay thế</strong> tư vấn của
      thầy thuốc/bác sỹ có chuyên môn.
    </p>

    <h2>3. Không Phải Tư Vấn Y Khoa</h2>
    <p>
      Mọi nội dung (mô tả huyệt, bài thuốc, kết quả đo mẫu, bài viết) chỉ mang tính tham khảo &amp; giáo dục.
      Người dùng <strong>không được</strong> dùng thông tin tại đây để tự chẩn đoán hoặc tự điều trị.
      Quyết định y khoa phải do người có chuyên môn đưa ra trên từng trường hợp cụ thể.
    </p>

    <h2>4. Trách Nhiệm Của Người Dùng</h2>
    <ul>
      <li>Cung cấp thông tin chính xác; tự bảo mật tài khoản và mật khẩu.</li>
      <li>Khi nhập hồ sơ bệnh nhân, phải có cơ sở pháp lý và sự đồng ý hợp lệ của bệnh nhân.</li>
      <li>Không dùng dịch vụ vào mục đích trái pháp luật hoặc xâm phạm quyền của người khác.</li>
    </ul>

    <h2>5. Sở Hữu Trí Tuệ</h2>
    <p>
      Giao diện, mã nguồn, cơ sở dữ liệu tra cứu và nội dung do chúng tôi biên soạn thuộc quyền sở hữu của
      <strong>Kinh Lạc Trương Gia</strong>. Bạn có thể tham khảo cho mục đích cá nhân/học tập, nhưng không
      sao chép, phân phối lại vì mục đích thương mại khi chưa có sự đồng ý bằng văn bản.
    </p>

    <h2>6. Giới Hạn Trách Nhiệm</h2>
    <p>
      Chúng tôi nỗ lực bảo đảm thông tin chính xác nhưng <strong>không cam kết</strong> mọi nội dung luôn đầy đủ,
      cập nhật hay phù hợp với mọi trường hợp. Trong phạm vi pháp luật cho phép, chúng tôi không chịu trách nhiệm
      đối với thiệt hại phát sinh từ việc <strong>tự ý</strong> áp dụng thông tin trên website mà không có ý kiến
      của người có chuyên môn.
    </p>

    <h2>7. Thay Đổi Điều Khoản</h2>
    <p>
      Chúng tôi có thể cập nhật điều khoản theo thời gian; ngày "Cập nhật lần cuối" ở đầu trang phản ánh phiên bản
      hiện hành. Việc tiếp tục sử dụng đồng nghĩa với chấp nhận bản cập nhật.
    </p>

    <h2>8. Luật Áp Dụng</h2>
    <p>Các điều khoản này được điều chỉnh theo pháp luật Việt Nam.</p>

    <MedicalDisclaimer />
  </LegalPageLayout>
</template>
