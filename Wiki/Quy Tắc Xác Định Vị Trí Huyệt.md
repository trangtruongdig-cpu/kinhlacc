---
type: wiki
status: active
tags: [wiki, yhct, huyet-vi, giai-phau, 3d, kinhlacc]
origin: transcript-claude-code
created: 2026-09-08
updated: 2026-09-08
source: "[[conversations/vscode-2026-09-07]]"
---

# Quy Tắc Xác Định Vị Trí Huyệt

Quy trình xác định vị trí huyệt trên mô hình giải phẫu 3D, chưng cất từ các phiên làm việc
06/09 - 08/09/2026. Áp dụng được cho bất kỳ việc nào cần đặt điểm lên mô hình cơ thể người.

## Vấn đề

Xác định huyệt "theo sách" cho ra một mô tả ngôn ngữ (dưới đầu gối 3 thốn, giữa hai gân...).
Đặt điểm đó lên một mesh giải phẫu cụ thể là bài toán khác: sách đúng nhưng thực địa vẫn sai,
và triệu chứng là **huyệt bay ra ngoài cơ thể** hoặc **đường kinh không đi qua huyệt**.

## Bốn tầng căn cứ, dùng theo thứ tự

### Tầng 1 - Mốc giải phẫu chuẩn WHO

Mọi mô tả vị trí phải neo vào tên mốc giải phẫu theo chuẩn WHO. Do đó **việc dịch tên bộ phận
giải phẫu sang tiếng Việt không phải việc phụ** - nó là cơ sở của mọi phép định vị sau đó.
Bản dịch máy phải được rà lại chuyên môn trước khi dùng chính thức.

### Tầng 2 - Đường kinh làm khung

Dựng đường kinh trước, rồi rải huyệt dọc theo đường. Đường kinh cho ràng buộc về **thứ tự và
khoảng cách** giữa các huyệt kề nhau mà từng huyệt riêng lẻ không có.

Kiểm chứng bằng mắt: đường kinh phải **ngay hàng như trong tranh atlas**. Nếu nhìn cảm quan đã
thấy rối thì chắc chắn sai, không cần đo.

### Tầng 3 - Hệ khe mô (bốn quy tắc)

Huyệt hầu như luôn nằm ở **ranh giới giữa hai cấu trúc**, không nằm giữa lòng một khối cơ:

1. Giữa cơ bắp với cơ bắp
2. Giữa cơ bắp và xương
3. Giữa cơ bắp và gân
4. Giữa gân và xương

Đây là quy tắc do người dùng đặt ra (07/09) và nó **thu hẹp không gian tìm kiếm rất mạnh**:
từ một vùng rộng xuống một đường ranh giới. Chi tiết: [[quy-tac-khe-mo-xac-dinh-huyet]].

### Tầng 4 - Chỉnh theo vùng

Sau khi rải xong theo đường kinh, **chỉnh lại theo phương pháp xác định theo vùng**
(đầu, cổ, tay, chân, cổ chân, khớp, cơ). Lý do: logic đường kinh có thể đúng theo sách mà
thực địa vẫn lệch. Vùng là phép kiểm tra chéo độc lập với đường kinh.

## Thứ tự làm việc: dễ trước, khó sau

Nguyên tắc người dùng chốt (07/09): bắt đầu từ **những huyệt có độ chính xác cao nhất** và
**những vùng dễ xác định nhất**, rồi mới sang vùng khó.

Lý do không chỉ là tâm lý: khi vùng dễ đã neo chắc, nó **trở thành mốc để suy ra vùng khó**
theo đường kinh, theo quy tắc khe mô và theo giải phẫu. Làm ngược lại thì không có gì để tựa.
Xem [[lam-tu-de-den-kho]].

## Đối chiếu: ba nguồn độc lập

Không tin một nguồn duy nhất, kể cả suy luận kỹ thuật của chính mình:

| Nguồn | Dùng để |
|---|---|
| **Atlas of Acupuncture (Claudia Focks)** | Ảnh giải phẫu và sơ đồ toàn kinh. Lưu ý ký hiệu Đức: SJ/TB |
| **Từ điển của chính app** | `kinhlac.online/app/tu-dien`, đồ hình `kinh-NN-chinh.jpg` |
| **Dự án mã nguồn mở** | Human Atlas, Meridian Atlas - kế thừa thay vì tự dò |

Chi tiết: [[doi-chieu-bang-sach-va-tu-dien-cua-app]], [[nguon-atlas-3d-tham-chieu]].

## Hội đồng phản biện cho từng huyệt

Với huyệt khó, quy trình là: gom **đủ bộ tài liệu tham khảo** cho một huyệt (sách, tra mạng,
từ điển) → đưa ra **hội đồng phản biện** → đối chiếu với các huyệt kề bên **cùng vùng, cùng
đường kinh, trên giải phẫu** → mới chốt.

Chậm là chấp nhận được: "Lâu nhưng rất chắc chắn". Xem [[hoi-dong-phan-bien-cho-viec-can-chinh-xac]].

Một bài học của hội đồng: hội đồng chỉ tốt bằng tài liệu nó chịu đọc. Phiên đầu bị người dùng
bác vì **chưa khai thác ảnh trong sách Focks**, dù ảnh chỉ ra rất rõ - lý luận suông không thay
được đo trên ảnh.

## Dấu hiệu sai cần kiểm ngay

- Huyệt nằm ngoài bóng cơ thể, hoặc bị lớp da lấp lên trong khi kinh đó đi nổi trên bề mặt.
- Hai huyệt kề nhau trên cùng một kinh không nối được với nhau (ví dụ U Môn - Bộ Lang, kinh Thận).
- Đường kinh đi mà không qua huyệt.
- Đường kinh gấp khúc **giữa** hai huyệt - gấp **tại** một huyệt thì hợp lệ.

## Liên kết

- [[Taxonomy Kinh Lắc]] - định nghĩa huyệt vị và kinh mạch
- [[Bát Cương và Đồ Hình Thái Cực]] - kết luận biện chứng dẫn tới phương huyệt
- [[Chuẩn Hoá Thể Bệnh và Ánh Xạ YHCT - YHHĐ]] - thể bệnh nào dùng phương huyệt nào
- [[Domain Kinh Lắc]]
