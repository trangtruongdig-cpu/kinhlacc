<script setup lang="ts">
/**
 * QuyTrinhBienTapView — "Quy Trình Biên Tập" (/quy-trinh-bien-tap).
 * Vai trò YMYL: minh bạch AI VÀ ai viết / ai duyệt / nguồn ở đâu → tín hiệu E-E-A-T mạnh.
 * Đây cũng là nơi công khai "van an toàn" cho nội dung tự đăng (xem YMYL-PLAN.md mục 6).
 */
import LegalPageLayout from '@/components/LegalPageLayout.vue'
</script>

<template>
  <LegalPageLayout
    title="Quy Trình Biên Tập"
    lead="Cách chúng tôi tạo, kiểm chứng và cập nhật nội dung Y tế — để bạn yên tâm về độ tin cậy."
    updated="05/06/2026"
  >
    <h2>Nguyên Tắc</h2>
    <p>
      Nội dung Y tế trên website được biên soạn theo hướng <strong>tra cứu &amp; giáo dục</strong>, dựa trên
      y văn cổ truyền và dữ liệu có cấu trúc của chúng tôi. Chúng tôi không đưa ra lời khuyên điều trị thay cho
      thầy thuốc, và luôn kèm <a href="/dieu-khoan">tuyên bố miễn trừ y tế</a>.
    </p>

    <h2>Ai Viết &amp; Ai Duyệt</h2>
    <ul>
      <li><strong>Biên soạn:</strong> đội ngũ nội dung của chúng tôi (xem <a href="/ve-chung-toi">Về Chúng Tôi</a>).</li>
      <li>
        <strong>Rà soát chuyên môn:</strong> nội dung mang tính Y khoa do
        <strong>Trương Đình Trang</strong> (Y Sỹ Y Học Cổ Truyền, đang theo học) biên soạn và rà soát,
        đối chiếu với y văn cổ truyền và tài liệu chuyên ngành trước khi xuất bản
        (xem <a href="/ve-chung-toi">Về Chúng Tôi</a>).
      </li>
      <li><strong>Ghi nhận tác giả:</strong> mỗi bài viết hiển thị tên người biên soạn/người duyệt và ngày cập nhật.</li>
    </ul>

    <h2>Nguồn &amp; Kiểm Chứng</h2>
    <ul>
      <li>Ưu tiên y văn cổ truyền, giáo trình, và nguồn chính thống; có mục "Nguồn tham khảo" ở cuối bài khi cần.</li>
      <li>Dữ liệu tra cứu (huyệt vị, đường kinh, vị thuốc) lấy từ cơ sở dữ liệu nội bộ đã chuẩn hoá.</li>
      <li>Khi phát hiện sai sót, chúng tôi sửa và ghi chú ngày cập nhật.</li>
    </ul>

    <h2>Minh Bạch Về AI</h2>
    <p>
      Một số bản nháp có thể được hỗ trợ bởi <strong>trí tuệ nhân tạo (AI)</strong> để tăng tốc biên soạn.
      Tuy vậy:
    </p>
    <ul>
      <li>Nội dung mang tính Y khoa <strong>luôn được người có chuyên môn rà soát</strong> trước khi xuất bản.</li>
      <li>Bài có hỗ trợ AI sẽ được <strong>ghi rõ</strong> để bạn biết.</li>
      <li>AI <strong>không</strong> tự đưa ra phác đồ/liều lượng điều trị để người đọc tự áp dụng.</li>
    </ul>

    <h2>Phân Loại Rủi Ro Nội Dung</h2>
    <p>Để bảo đảm an toàn (chuẩn YMYL), chúng tôi phân loại nội dung trước khi đăng:</p>
    <ul>
      <li>
        <strong>🟢 Dữ kiện tra cứu</strong> (mô tả huyệt, vị trí, đường kinh, tính vị quy kinh): được xuất bản
        theo quy trình thường.
      </li>
      <li>
        <strong>🔴 Nội dung liên quan chẩn đoán/điều trị</strong>: chỉ xuất bản sau khi người có chuyên môn duyệt;
        trước khi duyệt có thể tạm thời <strong>không hiển thị cho công cụ tìm kiếm</strong> (noindex).
      </li>
    </ul>

    <h2>Đính Chính &amp; Phản Hồi</h2>
    <p>
      Nếu bạn thấy thông tin chưa chính xác, vui lòng báo cho chúng tôi qua trang <a href="/lien-he">Liên Hệ</a>.
      Chúng tôi tiếp nhận và cập nhật trong thời gian sớm nhất.
    </p>
  </LegalPageLayout>
</template>
