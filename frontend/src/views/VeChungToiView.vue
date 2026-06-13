<script setup lang="ts">
/**
 * VeChungToiView — Trang "Về Chúng Tôi" (/ve-chung-toi).
 * Vai trò YMYL: thể hiện Authoritativeness (nguồn gốc phương pháp) + Experience (dữ liệu thật)
 * + Expertise (đội ngũ chuyên môn). Đây là một trong những trang Google soi kỹ nhất.
 *
 * Đã điền thông tin thật: pháp nhân "Kinh Lạc Trương Gia", người sáng lập Trương Đình Trang
 * (Y Sỹ YHCT đang học). Định vị: đo kinh lạc (cảm hứng từ sách "Biện Chứng Luận Trị" của Lê Văn Sửu)
 * chỉ là 1 tính năng nhỏ; phần mềm là công trình phát triển riêng, lớn hơn nhiều.
 */
import LegalPageLayout from '@/components/LegalPageLayout.vue'
import MedicalDisclaimer from '@/components/MedicalDisclaimer.vue'
</script>

<template>
  <LegalPageLayout
    title="Về Chúng Tôi"
    lead="Nền tảng số hoá Y Học Cổ Truyền: biện chứng luận trị, tra cứu huyệt vị, đồ hình 3D, đo kinh lạc và quản lý phòng khám."
    updated="05/06/2026"
  >
    <h2>Sứ Mệnh</h2>
    <p>
      Chúng tôi xây dựng nền tảng giúp thầy thuốc, giảng viên, sinh viên và người quan tâm Y Học Cổ Truyền
      <strong>tra cứu, học tập và số hoá</strong> tri thức Đông Y: đo nhiệt độ kinh lạc thành biểu đồ,
      tra cứu hơn 1.000 huyệt vị, đồ hình kinh lạc 3D, phân tích bài thuốc theo tính vị quy kinh và
      quản lý hồ sơ phòng khám.
    </p>

    <h2>Nguồn Gốc &amp; Tính Sáng Tạo</h2>
    <p>
      Tính năng <strong>đo nhiệt độ kinh lạc (24 tỉnh huyệt)</strong> trong sản phẩm lấy cảm hứng từ cuốn
      <strong>"Biện Chứng Luận Trị"</strong> của lương y <strong>Lê Văn Sửu</strong> — một hướng chẩn đoán
      kết hợp lý luận Đông Y với đo lường, từng được báo chí và giới khoa học trong nước giới thiệu
      (xem mục "Tham khảo &amp; ghi nhận" bên dưới).
    </p>
    <p>
      Tuy vậy, <strong>đo kinh lạc chỉ là một tính năng nhỏ</strong> trong nền tảng. Phần lớn sản phẩm là
      <strong>công trình phát triển riêng</strong> của chúng tôi: số hoá biện chứng luận trị, tra cứu hơn
      1.000 huyệt vị, đồ hình kinh lạc 3D, phân tích bài thuốc theo tính vị quy kinh và quản lý hồ sơ
      phòng khám. Chúng tôi kế thừa tinh thần học thuật từ y văn đã công bố, đồng thời xây dựng một hệ
      thống lớn hơn nhiều so với phép đo ban đầu.
    </p>

    <h2>Đội Ngũ &amp; Cố Vấn Chuyên Môn</h2>
    <p>Nội dung Y tế trên nền tảng được biên soạn và rà soát, đối chiếu với y văn cổ truyền:</p>
    <div class="legal-card">
      <p>
        <strong>Người sáng lập &amp; phụ trách nội dung:</strong>
        Trương Đình Trang — Y Sỹ Y Học Cổ Truyền (đang theo học)
      </p>
      <p>
        <strong>Nguồn cảm hứng phương pháp đo kinh lạc:</strong>
        Cuốn "Biện Chứng Luận Trị" của lương y Lê Văn Sửu.
      </p>
      <p>
        <strong>Cơ sở chuyên môn:</strong>
        Y văn Đông Y cổ truyền, giáo trình và tài liệu chuyên ngành đã công bố.
      </p>
    </div>

    <h2>Dữ Liệu Của Chúng Tôi</h2>
    <p>
      Khác với các trang tổng hợp, nền tảng dựa trên <strong>dữ liệu thật và có cấu trúc</strong>: kho tra cứu
      hơn 1.000 huyệt vị, 12 chính kinh và kỳ kinh bát mạch, hệ thống bài thuốc — vị thuốc theo tính vị quy kinh,
      cùng các ca đo kinh lạc thực tế (đã ẩn danh) dùng để minh hoạ cách đọc kết quả.
    </p>

    <h2>Tham Khảo &amp; Ghi Nhận</h2>
    <ul>
      <li>
        <a href="https://nhandan.vn/chan-benh-bang-do-nhiet-do-kinh-lac-post411042.html" target="_blank" rel="noopener">
          Chẩn bệnh bằng đo nhiệt độ kinh lạc — Báo Nhân Dân
        </a>
      </li>
      <li>
        <a href="https://vusta.vn/thay-thuoc-dong-y-xem-mach-bang-phan-mem-va-may-do-p86229.html" target="_blank" rel="noopener">
          Thầy thuốc Đông Y xem mạch bằng phần mềm và máy đo — VUSTA
        </a>
      </li>
    </ul>

    <h2>Liên Hệ</h2>
    <p>
      Mọi câu hỏi, góp ý hoặc đề nghị hợp tác, xem trang <a href="/lien-he">Liên Hệ</a>.
    </p>

    <MedicalDisclaimer />
  </LegalPageLayout>
</template>
