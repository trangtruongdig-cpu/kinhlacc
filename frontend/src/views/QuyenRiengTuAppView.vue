<script setup lang="ts">
/**
 * QuyenRiengTuAppView — "Chính Sách Quyền Riêng Tư (Ứng Dụng)" (/quyen-rieng-tu-app).
 *
 * Mục đích: URL chính sách quyền riêng tư để dán vào Google Play Console cho APP Flutter
 * "Kinh Lạc Trương Gia" (app_kinhlac) — app dành cho BỆNH NHÂN (đăng ký, đặt lịch, xem
 * lịch sử khám). Khác với /chinh-sach-bao-mat (viết cho website + phòng khám): ở đây
 * BỆNH NHÂN là người trực tiếp tạo tài khoản và là chủ thể dữ liệu.
 *
 * Bám sát thực tế app (đã đối chiếu mã nguồn app_kinhlac):
 *   - Quyền duy nhất: INTERNET (không camera/vị trí/danh bạ/ảnh).
 *   - Dữ liệu: SĐT + mật khẩu (đăng nhập), hồ sơ (họ tên, giới tính, ngày/giờ sinh,
 *     địa chỉ, tỉnh), tiền sử bệnh, lịch sử khám/đo kinh lạc, lịch hẹn.
 *   - Lưu cục bộ: access_token + hồ sơ (shared_preferences). Gửi tới https://kinhlac.online/api.
 *   - KHÔNG quảng cáo, KHÔNG SDK phân tích bên thứ ba, KHÔNG bán dữ liệu.
 *
 * Đáp ứng yêu cầu Google Play Data Safety: nêu rõ dữ liệu thu thập/mục đích/chia sẻ,
 * mã hoá khi truyền, và CÁCH XOÁ TÀI KHOẢN & DỮ LIỆU (bắt buộc từ 2023).
 *
 * ⚠️ Bản nháp thiện chí, KHÔNG phải tư vấn pháp lý. Đổi tên pháp nhân/đầu mối thật khi cần.
 */
import LegalPageLayout from '@/components/LegalPageLayout.vue'
import MedicalDisclaimer from '@/components/MedicalDisclaimer.vue'
</script>

<template>
  <LegalPageLayout
    title="Chính Sách Quyền Riêng Tư"
    lead="Áp dụng cho ứng dụng di động “Kinh Lạc Trương Gia” trên Google Play (dành cho người bệnh)."
    updated="16/06/2026"
  >
    <p>
      Chính sách này mô tả cách ứng dụng <strong>“Kinh Lạc Trương Gia”</strong> (gọi tắt là
      <strong>“ứng dụng”</strong>) thu thập, sử dụng, lưu trữ, chia sẻ và bảo vệ dữ liệu cá nhân của bạn.
      Ứng dụng dành cho người bệnh để đăng ký tài khoản, đặt lịch khám và xem lịch sử khám của chính mình
      tại phòng khám Đông Y Kinh Lạc Trương Gia. Chúng tôi tuân thủ
      <strong>Nghị định 13/2023/NĐ-CP</strong> về bảo vệ dữ liệu cá nhân và chính sách của Google Play.
    </p>

    <h2>1. Dữ Liệu Ứng Dụng Thu Thập</h2>
    <ul>
      <li>
        <strong>Thông tin tài khoản:</strong> số điện thoại (dùng để đăng nhập) và mật khẩu
        (được lưu dưới dạng đã mã hoá/băm phía máy chủ, không lưu dạng rõ).
      </li>
      <li>
        <strong>Thông tin hồ sơ cá nhân:</strong> họ tên, giới tính, ngày sinh, giờ sinh, địa chỉ, tỉnh/thành.
      </li>
      <li>
        <strong>Dữ liệu sức khoẻ (nhạy cảm):</strong> tiền sử bệnh, lịch sử khám và kết quả đo kinh lạc,
        ghi chú khám, lịch hẹn. Đây là <strong>dữ liệu cá nhân nhạy cảm</strong> nên được bảo vệ ở mức cao.
      </li>
    </ul>
    <p>
      Ứng dụng <strong>không</strong> thu thập vị trí, danh bạ, ảnh, máy ảnh, micrô hay danh tính thiết bị.
      Ứng dụng <strong>không</strong> chứa quảng cáo và <strong>không</strong> nhúng bộ công cụ (SDK) theo dõi
      của bên thứ ba.
    </p>

    <h2>2. Quyền Truy Cập Thiết Bị</h2>
    <p>
      Ứng dụng chỉ yêu cầu quyền <strong>Truy cập Internet</strong> để kết nối tới máy chủ và đồng bộ dữ liệu.
      Ứng dụng không yêu cầu các quyền nhạy cảm như vị trí, máy ảnh, danh bạ hay bộ nhớ ảnh.
    </p>

    <h2>3. Mục Đích Sử Dụng Dữ Liệu</h2>
    <ul>
      <li>Tạo và xác thực tài khoản, đăng nhập an toàn.</li>
      <li>Đặt lịch hẹn khám và quản lý lịch hẹn của bạn.</li>
      <li>Hiển thị hồ sơ cá nhân và lịch sử khám/đo kinh lạc của chính bạn.</li>
      <li>Hỗ trợ, chăm sóc người bệnh và cải thiện chất lượng dịch vụ.</li>
    </ul>
    <p>Chúng tôi <strong>không bán</strong> và <strong>không chia sẻ</strong> dữ liệu cá nhân của bạn cho bên thứ ba vì mục đích quảng cáo.</p>

    <h2>4. Lưu Trữ &amp; Chia Sẻ Dữ Liệu</h2>
    <ul>
      <li>
        Dữ liệu được gửi và lưu trên máy chủ của chúng tôi tại <strong>kinhlac.online</strong>, dùng cho
        hoạt động khám chữa bệnh của phòng khám.
      </li>
      <li>
        Trên thiết bị, ứng dụng chỉ lưu cục bộ <strong>mã đăng nhập (token)</strong> và <strong>hồ sơ tóm tắt</strong>
        để giữ phiên đăng nhập; khi bạn đăng xuất, các dữ liệu này được xoá khỏi thiết bị.
      </li>
      <li>
        Dữ liệu sức khoẻ của bạn được dùng nội bộ để phục vụ việc khám, chữa bệnh; chỉ nhân sự được phân quyền
        của phòng khám mới truy cập được.
      </li>
    </ul>

    <h2>5. Bảo Mật</h2>
    <ul>
      <li>Mọi kết nối giữa ứng dụng và máy chủ dùng <strong>HTTPS</strong> (mã hoá khi truyền).</li>
      <li>Mật khẩu được băm (hash) phía máy chủ, không lưu ở dạng rõ.</li>
      <li>Hệ thống phân quyền theo vai trò — chỉ người được cấp quyền mới xem được dữ liệu tương ứng.</li>
    </ul>

    <h2>6. Xoá Tài Khoản &amp; Dữ Liệu</h2>
    <p>
      Bạn có thể yêu cầu <strong>xoá tài khoản và toàn bộ dữ liệu cá nhân</strong> liên quan bất cứ lúc nào:
    </p>
    <ul>
      <li>
        <strong>Tự xoá trực tuyến:</strong> truy cập trang
        <a href="/xoa-tai-khoan">kinhlac.online/xoa-tai-khoan</a>, xác minh bằng số điện thoại và mật khẩu
        rồi gửi yêu cầu — không cần cài đặt ứng dụng.
      </li>
      <li>
        Hoặc gửi yêu cầu tới email <a href="mailto:baomat@kinhlac.online">baomat@kinhlac.online</a> hoặc gọi
        <a href="tel:0353247247">0353.247.247</a>, ghi rõ số điện thoại đăng ký tài khoản.
      </li>
      <li>
        Chúng tôi sẽ xác minh và xoá dữ liệu trong vòng <strong>tối đa 30 ngày</strong>, trừ phần dữ liệu phải
        lưu giữ theo quy định pháp luật về hồ sơ khám chữa bệnh (nếu có), phần này sẽ được hạn chế truy cập
        và xoá khi hết thời hạn lưu giữ.
      </li>
      <li>Bạn cũng có thể đăng xuất bất cứ lúc nào để xoá dữ liệu phiên đăng nhập khỏi thiết bị.</li>
    </ul>

    <h2>7. Thời Gian Lưu Trữ</h2>
    <p>
      Chúng tôi lưu dữ liệu trong thời gian cần thiết để cung cấp dịch vụ và theo quy định pháp luật, sau đó
      xoá hoặc ẩn danh hoá. Khi bạn yêu cầu xoá tài khoản, dữ liệu sẽ được xử lý theo Mục 6.
    </p>

    <h2>8. Trẻ Em</h2>
    <p>
      Ứng dụng dành cho người dùng trưởng thành hoặc người giám hộ thay mặt người bệnh. Chúng tôi không chủ
      đích thu thập dữ liệu của trẻ em khi chưa có sự đồng ý của cha mẹ hoặc người giám hộ hợp pháp.
    </p>

    <h2>9. Quyền Của Bạn</h2>
    <p>
      Theo Nghị định 13/2023/NĐ-CP, bạn có quyền: được biết, đồng ý/rút đồng ý, truy cập, chỉnh sửa, xoá,
      hạn chế xử lý và khiếu nại về dữ liệu cá nhân của mình. Để thực hiện, liên hệ
      <a href="mailto:baomat@kinhlac.online">baomat@kinhlac.online</a>.
    </p>

    <h2>10. Thay Đổi Chính Sách</h2>
    <p>
      Khi cập nhật chính sách, chúng tôi sẽ đổi ngày “Cập nhật lần cuối” ở đầu trang. Vui lòng xem lại định kỳ.
      Việc tiếp tục dùng ứng dụng đồng nghĩa với chấp nhận bản cập nhật.
    </p>

    <h2>11. Đơn Vị Chịu Trách Nhiệm</h2>
    <div class="legal-card">
      <p><strong>Đơn vị:</strong> Kinh Lạc Trương Gia</p>
      <p><strong>Ứng dụng:</strong> Kinh Lạc Trương Gia (Android — Google Play)</p>
      <p><strong>Địa chỉ:</strong> Số 16, đường Ao Sen, An Khánh, Hoài Đức, Hà Nội</p>
      <p><strong>Người phụ trách dữ liệu:</strong> Trương Đình Trang</p>
      <p>
        <strong>Email / điện thoại:</strong>
        <a href="mailto:baomat@kinhlac.online">baomat@kinhlac.online</a> ·
        <a href="tel:0353247247">0353.247.247</a>
      </p>
    </div>

    <MedicalDisclaimer />

    <p>
      <em>Lưu ý: bản chính sách này nhằm minh bạch thông tin, không thay thế tư vấn pháp lý. Bạn nên nhờ
      luật sư rà soát cho phù hợp thực tế hoạt động.</em>
    </p>
  </LegalPageLayout>
</template>
