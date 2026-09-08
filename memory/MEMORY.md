# Bộ nhớ Javis - Index

> Chỉ mục bộ nhớ dài hạn của Javis. Mỗi dòng = 1 ký ức, trỏ tới file trong `facts/`.
> Nội dung file này được nạp vào đầu mỗi câu hỏi để Javis nhớ ngữ cảnh.

- [User giảng dạy PTIT và có nền YHCT](facts/nguoi-dung-giang-day-ptit-va-yhct.md) — User vừa giảng dạy CNTT tại PTIT (khóa luận, VECOM) vừa có tư liệu chuyên môn Y học cổ truyền - gắn trực tiếp với domain app kinhlacc.
- [Vault kinhlacc location](facts/kinhlacc-vault-location.md) — Vault kinhlacc nằm tại /Users/truongtrang/Desktop/kinhlacc
- [Tuỳ biến phải sống sót qua bản cập nhật Javis](facts/giu-custom-khi-update-javis.md) — Mọi phần custom user đặt làm (driver engine, code lõi) phải giữ được khi Javis lên phiên bản mới - đây là điều kiện user nêu rõ, không phải mong muốn phụ.
- [Ưu tiên mượn gói subscription sẵn có, không mua API key mới](facts/uu-tien-goi-subscription-thay-vi-api-key.md) — User có Antigravity IDE trên máy và muốn Javis chạy bằng gói đang trả tiền + đăng nhập OAuth ngay trên trang Models, không muốn mua quota API riêng.

## Cách làm việc (rút từ transcript VS Code, 07/07–08/09/2026)

- [Tư duy trước khi code](facts/tu-duy-truoc-khi-code.md) — trình phương án rồi chờ chốt, đừng sửa code ngay; user nhắc ≥4 lần.
- [Tiết kiệm token là ràng buộc](facts/tiet-kiem-token-la-rang-buoc.md) — gộp việc theo lô, đừng đọc lại file đã đọc.
- [Làm từ dễ đến khó](facts/lam-tu-de-den-kho.md) — neo phần chắc chắn trước, dùng nó suy ra phần khó.
- [Hội đồng phản biện cho việc cần chính xác](facts/hoi-dong-phan-bien-cho-viec-can-chinh-xac.md) — user chấp nhận chậm để đổi lấy chắc: "Lâu nhưng rất chắc chắn".
- [Commit trừ tiến trình song song](facts/commit-tru-tien-trinh-song-song.md) — nhiều phiên Claude chung repo; đừng commit hộ phiên khác.
- [Bảng phương án, duyệt một lần](facts/bang-phuong-an-duyet-mot-lan.md) — liệt kê thành bảng thay vì hỏi lắt nhắt.
- [Trả lời bằng tiếng Việt](facts/tra-loi-bang-tieng-viet.md) — user không đọc được tiếng Anh.

## Quyết định miền YHCT

- [Thống nhất "Đảm" thành "Đởm"](facts/thong-nhat-dam-thanh-doi.md) — chuẩn toàn hệ thống; tài liệu gốc dùng "Đảm" nên dễ lẫn.
- [Thể lưỡng phải gộp phương huyệt](facts/the-luong-phai-gop-phuong-huyet.md) — thể kép lấy trọn phương huyệt của các thể đơn cấu thành.
- [Mỗi huyệt cần ghi chú ý nghĩa](facts/moi-huyet-can-ghi-chu-y-nghia.md) — để người châm biết châm nhằm mục đích gì; văn y khoa, không văn nói.
- [Bài thuốc dùng chung, không lặp thể](facts/bai-thuoc-dung-chung-khong-lap-the.md) — mỗi thể xuất hiện tối đa 1 lần.
- [YHHĐ lồng dưới YHCT theo công thức](facts/yhhd-long-duoi-yhct-theo-cong-thuc.md) — cái có công thức làm cha; mục đích là lộ căn nguyên.
- [Thương Hàn chỉ áp cho thể đo ra](facts/thuong-han-chi-ap-cho-the-do-ra.md) — không gán Lục Kinh cho mọi ca.
- [Quy tắc khe mô xác định huyệt](facts/quy-tac-khe-mo-xac-dinh-huyet.md) — huyệt ở ranh giới cơ/gân/xương; rải theo kinh xong phải chỉnh theo vùng.

## Sản phẩm & giao diện

- [Landing page phải giống app 100%](facts/landing-page-phai-giong-app-100.md) — điểm user bực nhất, "nhắc lại quá nhiều lần".
- [Quyền lễ tân & che thông tin bệnh nhân](facts/quyen-le-tan-va-che-thong-tin-benh-nhan.md) — chỉ xem, không tạo ca; tên `*****rang`, SĐT `0xxxx353`.
- [Ẩn lối đăng nhập ở trang chủ](facts/an-loi-dang-nhap-o-trang-chu.md) — khách không thấy; tự vào `/app`.

## Nguồn & hạ tầng

- [Đối chiếu bằng sách và từ điển của app](facts/doi-chieu-bang-sach-va-tu-dien-cua-app.md) — Atlas of Acupuncture (Focks) + `kinhlac.online/app/tu-dien`.
- [Nguồn atlas 3D tham chiếu](facts/nguon-atlas-3d-tham-chieu.md) — Human Atlas, Meridian Atlas; "lấy họ làm gốc mình tuỳ biến theo".
- [Ollama khi hết token](facts/ollama-khi-het-token.md) — phương án dự phòng cục bộ.

## Hội thoại đã lưu

- `conversations/vscode-YYYY-MM-DD.md` — 24 ngày (07/07–08/09/2026), 392 tin nhắn do chính user viết, trích từ transcript Claude Code.
- [File hội thoại tồn tại nhưng engine hiện tại không đọc được](facts/conversation-files-exist-but-unreadable.md) — 24 ngày transcript VS Code (07/07–08/09/2026) nằm trong vault nhưng engine openrouter không có tool đọc file
