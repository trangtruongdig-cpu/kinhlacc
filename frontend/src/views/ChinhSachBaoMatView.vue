<script setup lang="ts">
/**
 * ChinhSachBaoMatView — "Chính Sách Bảo Mật" (/chinh-sach-bao-mat).
 * BẮT BUỘC vì hệ thống lưu hồ sơ bệnh nhân (dữ liệu sức khoẻ = dữ liệu cá nhân NHẠY CẢM
 * theo Nghị định 13/2023/NĐ-CP). Vừa là chuẩn YMYL/Trust, vừa là nghĩa vụ pháp lý.
 *
 * ⚠️ Đây là bản nháp thiện chí, KHÔNG phải tư vấn pháp lý. Nên nhờ luật sư rà trước khi công bố.
 * Đã điền mặc định: đơn vị "Kinh Lạc", đầu mối baomat@kinhlac.online. Đổi sang tên pháp nhân
 * đã đăng ký + đầu mối thật của bạn khi cần.
 */
import LegalPageLayout from '@/components/LegalPageLayout.vue'
</script>

<template>
  <LegalPageLayout
    title="Chính Sách Bảo Mật"
    lead="Chúng tôi tôn trọng và bảo vệ dữ liệu cá nhân của bạn, đặc biệt là dữ liệu sức khoẻ."
    updated="05/06/2026"
  >
    <p>
      Chính sách này mô tả cách chúng tôi thu thập, sử dụng, lưu trữ và bảo vệ dữ liệu cá nhân khi bạn dùng
      website và phần mềm tại <strong>kinhlac.online</strong>. Chúng tôi tuân thủ
      <strong>Nghị định 13/2023/NĐ-CP</strong> về bảo vệ dữ liệu cá nhân.
    </p>

    <h2>1. Dữ Liệu Chúng Tôi Thu Thập</h2>
    <ul>
      <li><strong>Tài khoản:</strong> tên đăng nhập, mật khẩu (đã mã hoá), vai trò, thông tin liên hệ.</li>
      <li>
        <strong>Hồ sơ bệnh nhân (do người dùng là cơ sở khám chữa bệnh nhập):</strong> họ tên, giới tính,
        năm sinh, kết quả đo kinh lạc, chẩn đoán, đơn thuốc. Đây là <strong>dữ liệu cá nhân nhạy cảm</strong>.
      </li>
      <li><strong>Dữ liệu kỹ thuật:</strong> địa chỉ IP, loại trình duyệt, trang đã xem (qua công cụ phân tích truy cập).</li>
    </ul>

    <h2>2. Mục Đích Sử Dụng</h2>
    <ul>
      <li>Cung cấp và vận hành tính năng (đo kinh lạc, tra cứu, quản lý hồ sơ).</li>
      <li>Bảo mật tài khoản, phòng chống gian lận, cải thiện sản phẩm.</li>
      <li>Liên hệ hỗ trợ khi bạn yêu cầu.</li>
    </ul>
    <p>Chúng tôi <strong>không bán</strong> dữ liệu cá nhân của bạn cho bên thứ ba.</p>

    <h2>3. Vai Trò Đối Với Hồ Sơ Bệnh Nhân</h2>
    <p>
      Với hồ sơ bệnh nhân do <strong>cơ sở khám chữa bệnh</strong> nhập vào hệ thống: cơ sở đó là bên kiểm soát
      dữ liệu và chịu trách nhiệm lấy sự đồng ý của bệnh nhân; chúng tôi là bên cung cấp nền tảng xử lý dữ liệu
      theo yêu cầu của cơ sở.
    </p>

    <h2>4. Lưu Trữ &amp; Bảo Mật</h2>
    <ul>
      <li>Kết nối qua <strong>HTTPS</strong>; mật khẩu được băm (hash), không lưu dạng rõ.</li>
      <li>Dữ liệu lưu trên hạ tầng máy chủ/cơ sở dữ liệu có kiểm soát truy cập.</li>
      <li>Phân quyền theo vai trò — chỉ người được cấp quyền mới xem được dữ liệu tương ứng.</li>
    </ul>

    <h2>5. Công Cụ Phân Tích &amp; Cookie</h2>
    <p>
      Website có thể dùng <strong>Google Analytics</strong> và cookie để hiểu lượt truy cập và cải thiện trải nghiệm.
      Bạn có thể tắt cookie trong trình duyệt; một số tính năng có thể hoạt động không trọn vẹn.
    </p>

    <h2>6. Quyền Của Bạn</h2>
    <p>Theo Nghị định 13/2023/NĐ-CP, bạn có quyền: được biết, đồng ý/rút đồng ý, truy cập, chỉnh sửa,
      xoá, hạn chế xử lý và khiếu nại về dữ liệu cá nhân của mình.</p>
    <p>
      Để thực hiện các quyền trên, liên hệ:
      <a href="mailto:baomat@kinhlac.online">baomat@kinhlac.online</a>.
    </p>

    <h2>7. Thời Gian Lưu Trữ</h2>
    <p>
      Chúng tôi lưu dữ liệu trong thời gian cần thiết để cung cấp dịch vụ hoặc theo quy định pháp luật,
      sau đó xoá hoặc ẩn danh hoá. Với hồ sơ bệnh nhân, dữ liệu được lưu trong suốt thời gian cơ sở khám
      chữa bệnh còn sử dụng dịch vụ; khi cơ sở ngừng sử dụng, dữ liệu sẽ được xoá hoặc bàn giao lại theo
      yêu cầu của cơ sở.
    </p>

    <h2>8. Thay Đổi Chính Sách</h2>
    <p>
      Khi cập nhật chính sách, chúng tôi sẽ đổi ngày "Cập nhật lần cuối" ở đầu trang. Vui lòng xem lại định kỳ.
    </p>

    <h2>9. Đơn Vị Chịu Trách Nhiệm</h2>
    <div class="legal-card">
      <p><strong>Đơn vị:</strong> Kinh Lạc Trương Gia</p>
      <p><strong>Địa chỉ:</strong> Số 16, đường Ao Sen, An Khánh, Hoài Đức, Hà Nội</p>
      <p><strong>Người phụ trách dữ liệu:</strong> Trương Đình Trang</p>
      <p>
        <strong>Email / điện thoại:</strong>
        <a href="mailto:baomat@kinhlac.online">baomat@kinhlac.online</a> ·
        <a href="tel:0353247247">0353.247.247</a>
      </p>
    </div>

    <p>
      <em>Lưu ý: bản chính sách này nhằm minh bạch thông tin, không thay thế tư vấn pháp lý. Bạn nên nhờ
      luật sư rà soát cho phù hợp thực tế hoạt động.</em>
    </p>
  </LegalPageLayout>
</template>
