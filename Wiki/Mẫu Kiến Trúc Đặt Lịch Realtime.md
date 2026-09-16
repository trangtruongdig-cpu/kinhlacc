---
type: wiki
status: active
tags: [wiki, architecture, best-practice]
created: 2026-09-16
updated: 2026-09-16
source: [[Kinh nghiệm thực tiễn]]
---

# Mẫu Kiến Trúc Hệ Thống Đặt Lịch Realtime

Hệ thống đặt lịch (y tế, xe khách, rạp phim) luôn phải đối mặt với hai vấn đề nhức nhối nhất: (1) Trùng vé khi hàng ngàn người giành giật một chỗ, (2) Cập nhật giao diện siêu tốc mà không làm sập máy chủ.

Dưới đây là tri thức chưng cất về 2 kỹ thuật kiến trúc cốt lõi giải quyết triệt để vấn đề này.

## 1. Chống Đặt Trùng: Pessimistic Write Lock
- **Sai lầm phổ biến**: Thường ta sẽ SELECT kiểm tra trạng thái vé -> Nếu "TRỐNG" thì UPDATE trạng thái thành "ĐÃ ĐẶT". Nếu 2 luồng (thread) chạy vào cùng một mili-giây, cả hai sẽ đều thấy vé trống và cùng báo thành công.
- **Kỹ thuật chuẩn**: Đưa lệnh Đặt vào một **Database Transaction**. Khi SELECT, bắt buộc dùng khoá vật lý trên dòng dữ liệu (Row-level lock). Trong TypeORM: `lock: { mode: 'pessimistic_write' }`.
- **Tác dụng**: Người bấm nhanh nhất 0.01 giây sẽ "khoá trái cửa" cái vé đó. Tất cả những truy vấn ập tới trong cùng lúc đó sẽ phải xếp hàng chờ ở cửa DB. Ngay khi người đầu xong, vé biến thành ĐÃ ĐẶT, người số 2 bước vào sẽ ăn ngay lỗi (Conflict 409). 100% không bao giờ trùng vé.

## 2. Giao Diện Thời Gian Thực: Kiến Trúc Zero-Request
- **Sai lầm phổ biến**: Dùng Websocket/SSE báo hiệu cho điện thoại khách hàng: "Ê, có người mới huỷ vé". Điện thoại khách lập tức gọi lại API `GET /slots` để tải mảng vé mới. Kết quả: 
  - (1) Nếu có 100,000 người, Server bị nổ vì dội bom 100,000 requests trong cùng 1 giây. 
  - (2) Trình duyệt di động (Safari/Chrome iOS) rất "lười", nó sẽ lôi dữ liệu cũ trong HTTP Cache ra thay vì gọi server, dẫn đến vé không bao giờ sáng lên.
- **Kỹ thuật chuẩn (Zero-Request Push)**:
  1. **Đóng gói Payload từ gốc**: Ngay khi thay đổi trạng thái (Cancel, Open, Book), Backend gói thẳng cái Entity (Object chứa toàn bộ thông tin chiếc vé) ném thẳng vào kênh SSE.
  2. **Thay máu trên RAM (Frontend Reactivity)**: Điện thoại nhận được cục Data này, CHỈ VIỆC lôi mảng vé trong RAM (`availableSlots`) ra, tìm chiếc vé cũ, và **ghép (splice) đè** chiếc vé mới vào.
  3. **Đổi màu thần tốc (0ms)**: VueJS (hay React) phát hiện mảng bị splice, lập tức vẽ lại màu thẻ trên màn hình. Không sinh ra ĐƯỜNG TẢI mạng nào, không HTTP Cache, tốc độ cập nhật đo bằng vận tốc chớp mắt.
  4. **Bảo mật kênh Public**: Mở cho mọi người (dù không đăng nhập) vẫn hứng được tín hiệu Đổi Màu Vé (trạng thái, thời gian). Nhưng thông tin nhạy cảm (Ai là người đặt) thì chặn bằng lệnh điều kiện ở frontend (chỉ hiển thị nếu có role Admin).

## 3. Lưu Ý Về Reactivity trong Vue 3
Khi làm kỹ thuật thay máu RAM (Zero-request), CẤM DÙNG cách gán index (VD: `arr[index] = newValue`). Vue 3 Proxy không phải lúc nào cũng trigger UI cho cách viết này. Luôn dùng `arr.splice(index, 1, newValue)` để bắt buộc khung giao diện vẽ lại.
