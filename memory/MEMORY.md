# Bộ nhớ Javis - Index

> Chỉ mục bộ nhớ dài hạn của Javis. Mỗi dòng = 1 ký ức, trỏ tới file trong `facts/`.
> Nội dung file này được nạp vào đầu mỗi câu hỏi để Javis nhớ ngữ cảnh.

- [User giảng dạy PTIT và có nền YHCT](facts/nguoi-dung-giang-day-ptit-va-yhct.md) — User vừa giảng dạy CNTT tại PTIT (khóa luận, VECOM) vừa có tư liệu chuyên môn Y học cổ truyền - gắn trực tiếp với domain app kinhlacc.
- [Vault kinhlacc location](facts/kinhlacc-vault-location.md) — Vault kinhlacc nằm tại /Users/truongtrang/Desktop/kinhlacc
- [Tuỳ biến phải sống sót qua bản cập nhật Javis](facts/giu-custom-khi-update-javis.md) — Mọi phần custom user đặt làm (driver engine, code lõi) phải giữ được khi Javis lên phiên bản mới - đây là điều kiện user nêu rõ, không phải mong muốn phụ.
- [Ưu tiên mượn gói subscription sẵn có, không mua API key mới](facts/uu-tien-goi-subscription-thay-vi-api-key.md) — User có Antigravity IDE trên máy và muốn Javis chạy bằng gói đang trả tiền + đăng nhập OAuth ngay trên trang Models, không muốn mua quota API riêng.

## Lịch sử dự án & hành trình quyết định

- [Nguồn gốc .NET desktop, qua nhiều lần đổi framework](facts/nguon-goc-net-desktop-doi-framework.md) — app kinhlacc ban đầu là desktop .NET (di sản ở `Kinhlac/`), đã đổi framework nhiều lần tới bản NestJS+Vue hiện tại.
- [Hành trình công cụ code: VS Code → +Antigravity → thử Javis dashboard](facts/hanh-trinh-cong-cu-code-vscode-antigravity-javis.md) — 3 bề mặt AI-code cùng sửa 1 working tree song song, không phải chuyển hẳn.
- [Trưng cất tri thức phải sâu logic y học, không chỉ đếm cấu trúc](facts/trung-cat-tri-thuc-phai-sau-khong-chi-cau-truc.md) — user bác bỏ consolidation chỉ tóm tắt schema/số bảng; đòi cơ chế bát cương/ngũ hành/lục kinh.

## Cách làm việc (rút từ transcript VS Code, 07/07–08/09/2026)

- [Tư duy trước khi code](facts/tu-duy-truoc-khi-code.md) — trình phương án rồi chờ chốt, đừng sửa code ngay; user nhắc ≥4 lần.
- [Kế thừa dự án có sẵn thay vì tự làm](facts/ke-thua-du-an-co-san-thay-vi-tu-lam.md) — luôn tìm mã nguồn mở tương đương trước khi tự dựng; "lấy họ làm gốc mình tuỳ biến theo".
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
- [Lục Cương hiện tại, còn thiếu 2 để đủ Bát Cương](facts/bat-cuong-hien-moi-la-luc-cuong.md) — Hư-Thực đang suy từ khí/huyết; cần chuẩn hoá tên theo cặp, làm nổi chỉ số khi bấm vào.
- [Cơ chế bóc lớp & đồ hình thái cực ở Kết Quả Đo](facts/co-che-boc-lop-va-do-hinh-thai-cuc.md) — thứ tự cố định Âm Dương→Tạng Phủ→Lục Khí→Lục Kinh; quy ước vành khăn dư/khuyết.
- [Gộp thể bệnh trùng công thức](facts/gop-the-benh-trung-cong-thuc.md) — căn cứ gộp là CÔNG THỨC chứ không phải tên gọi.
- [Đối chiếu app cũ 84 chứng bằng thuật toán](facts/doi-chieu-app-cu-84-chung.md) — quan trọng nhất là khớp công thức/logic; không bịa công thức khi thiếu.
- [Tự động lấy địa điểm & nhiệt độ khi đo](facts/tu-dong-lay-dia-diem-va-nhiet-do-khi-do.md) — bỏ nhập tay Tỉnh/TP, Địa chỉ, Nhiệt độ MT; lấy tự động qua định vị.

## Sản phẩm & giao diện

- [Landing page phải giống app 100%](facts/landing-page-phai-giong-app-100.md) — điểm user bực nhất, "nhắc lại quá nhiều lần".
- [Định vị lại sản phẩm, bỏ thương hiệu Trương Gia](facts/dinh-vi-lai-san-pham-bo-truong-gia.md) — 28/07: đổi title/landing vì app đã đồ sộ hơn "chỉ đo kinh lạc".
- [Quyền lễ tân & che thông tin bệnh nhân](facts/quyen-le-tan-va-che-thong-tin-benh-nhan.md) — chỉ xem, không tạo ca; tên `*****rang`, SĐT `0xxxx353`.
- [Ẩn lối đăng nhập ở trang chủ](facts/an-loi-dang-nhap-o-trang-chu.md) — khách không thấy; tự vào `/app`.
- [Quy cách tem nhãn vị thuốc in A4](facts/tem-nhan-vi-thuoc-in-a4.md) — lưới 2x4 đúng mẫu pdf, chữ Hán tự sinh vì user không viết được.

## Nguồn & hạ tầng

- [Đối chiếu bằng sách và từ điển của app](facts/doi-chieu-bang-sach-va-tu-dien-cua-app.md) — Atlas of Acupuncture (Focks) + `kinhlac.online/app/tu-dien`.
- [Nguồn atlas 3D tham chiếu](facts/nguon-atlas-3d-tham-chieu.md) — Human Atlas, Meridian Atlas; "lấy họ làm gốc mình tuỳ biến theo".
- [Ollama khi hết token](facts/ollama-khi-het-token.md) — phương án dự phòng cục bộ.
- [VPS cập nhật bằng git pull, không phải Vercel/Docker](facts/trien-khai-len-vps-bang-git-pull.md) — "commit và pull" = commit→push→SSH pull VPS; coi chừng local changes chặn pull.

## Dự án song song: VEDEI (Viện TMĐT & Kinh tế số)

- [Dự án VEDEI - Viện TMĐT & Kinh tế số Việt Nam](facts/du-an-vedei-vien-tmdt-kinh-te-so.md) — trực thuộc VECOM, khác miền hoàn toàn với kinhlacc; "viện/gọi vốn/mentor" luôn nói về dự án này.
- [Mô hình mentor-mentee thu tiền 2 đầu](facts/mo-hinh-mentor-mentee-vedei.md) — 1 mentor - 3-5 mentee, 3 tháng; đúng thứ tự đăng ký→test→nộp tiền ghép cặp→học→đồng hành→tốt nghiệp.
- [Khung năng lực & 20 môn học](facts/khung-nang-luc-va-20-mon-hoc-vedei.md) — tên Viện chọn "Kinh tế số" (không phải "Kinh doanh số"); 3 cột chuyên ngành x 3 cấp độ, map rõ môn→năng lực.
- [Tài chính VEDEI: các con số đã chốt](facts/mo-hinh-tai-chinh-vien-vedei.md) — Nett 25% viện CỐ ĐỊNH không theo quy mô; LMS thuê trước tự xây sau; vốn tối thiểu 1,5 tỷ.

## Hội thoại đã lưu

- `conversations/vscode-YYYY-MM-DD.md` — 24 ngày (07/07–08/09/2026), 392 tin nhắn do chính user viết, trích từ transcript Claude Code.
- `conversations/YYYY-MM-DD.md` (không tiền tố vscode-) — 4 file chat trực tiếp trên Javis dashboard (08/12, 08/13, 09/08, 09/09/2026), khác nguồn với transcript VS Code ở trên.
- [File hội thoại tồn tại nhưng engine hiện tại không đọc được](facts/conversation-files-exist-but-unreadable.md) — 24 ngày transcript VS Code (07/07–08/09/2026) nằm trong vault nhưng engine openrouter không có tool đọc file
- [Cơ chế Ngũ Hành lệch (tương thừa/tương vũ) suy từ Bát Cương hư-thực; Lục Kinh suy luận tương tự](facts/co-che-tuong-thua-tuong-vu-tu-bat-cuong.md) — Bát cương hư/thực (cao/thấp) → xác định hành ngũ hành bị lệch qua tương thừa/tương vũ (khác tương sinh/khắc bình thường); lục kinh giai đoạn/tầng bệnh suy luận theo logic tương tự.
- [OpenRouter model miễn phí trả lỗi 404 khi giao việc nền viết wiki](facts/openrouter-mien-phi-loi-404-khi-giao-viec-nen.md) — Giao 3 task nền viết wiki (Bát Cương, Lục Kinh, Ngũ Hành) qua OpenRouter model free đều lỗi 404 'unavailable for free' - cần đổi model trả phí mới chạy được.
- [Mục tiêu sản phẩm: suy luận bệnh YHHĐ từ dữ liệu đo kinh lạc](facts/muc-tieu-suy-benh-yhhd-tu-do-kinh-lac.md) — Tab bệnh Y học hiện đại đã có phân loại/biện chứng/pháp trị/triệu chứng/vị thuốc; mục tiêu là suy ra bệnh đó trực tiếp từ số đo kinh lạc.
- [Ingest lớn có thể tạo fact "mồ côi" trong MEMORY.md](facts/ingest-co-the-tao-fact-mo-coi.md) — Fact ghi đúng chuẩn ở facts/ nhưng quên thêm dòng vào MEMORY.md thì coi như vô hình, không được nạp vào context.
- [Không tìm thấy transcript Cursor trong vault](facts/khong-tim-thay-transcript-cursor-trong-vault.md) — Đã quét kỹ toàn vault (grep + glob + thư mục ẩn), kết quả âm tính; nếu có, dữ liệu Cursor nằm ngoài vault ở kho lưu cục bộ của app Cursor.
- [Ba tiêu chí đánh giá phần mềm kinhlacc](facts/tieu-chi-danh-gia-phan-mem-kinhlacc.md) — User dùng cố định 3 trục để đánh giá app: UX tối giản, hạ tầng ổn định + bảo mật trên VPS giá rẻ, kế thừa tri thức/dữ liệu để suy luận bệnh YHHĐ từ đo kinh lạc.
- [Toàn quyền thực thi sau khi duyệt kế hoạch rủi ro](facts/toan-quyen-thuc-thi-sau-khi-duyet-ke-hoach.md) — Sau khi duyệt bảng tóm tắt rủi ro & kế hoạch sửa, user cho Javis toàn quyền tự làm, chỉ cần báo kết quả hoặc khó khăn.
- [Tối ưu schema CSDL theo bài toán tổng thể, không mở rộng phản ứng](facts/toi-uu-schema-tong-the-thay-vi-mo-rong-phan-ung.md) — User muốn phân tích toàn bộ CSDL (thừa/thiếu) trước khi tối ưu, thay vì kiểu cũ: phát sinh vấn đề tới đâu mới mở/thu bảng tới đó.
