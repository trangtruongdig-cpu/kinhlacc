---
type: wiki
status: active
tags: [wiki, frontend, css, layout, grid, adaptive]
created: 2026-09-13
updated: 2026-09-13
source: [[Phiên gỡ lỗi Adaptive Layout Safari và CSS Grid]]
---

# Lỗi giao diện Adaptive trên Safari và xung đột min-content trong CSS Grid

Quá trình gỡ lỗi giao diện `DashboardLayout` co dãn (adaptive) để giữ tỷ lệ khung hình cố định (1440px) trên mọi màn hình đã chỉ ra 2 lỗi thiết kế layout chí mạng. Tài liệu này chưng cất bài học để phòng tránh trong tương lai.

## 1. Lỗi Safari cắt xén layout (Clipping Bug) khi dùng `transform: scale` + `overflow: hidden`

### Hiện tượng
Giao diện bị chém đứt phăng một mảng lớn ở cạnh phải. Dù nội dung đã được thu nhỏ (`scale(0.888)`) để vừa khít màn hình, nhưng các thẻ vẫn mất viền phải, trông như bị cắt bởi một con dao tàng hình.

### Nguyên nhân
Khi sử dụng `transform: scale` để thu nhỏ một khối tĩnh (ví dụ: `width: 1440px`) bên trong một thẻ bọc (wrapper) có `overflow: hidden`, trình duyệt **Safari/WebKit** có một "đặc sản" tính toán sai lệch:
Nó tính toán vùng bị cắt xén (clip path) dựa trên kích thước **chưa scale** của phần tử con. 
Nghĩa là nếu cửa sổ là `1280px` và phần tử con là `1440px`, Safari sẽ cắt bỏ `160px` bên phải CỦA KHỐI GỐC, **SAU ĐÓ** mới đem phần còn lại đi thu nhỏ. Hậu quả là phần tử bị khuyết một mảng lớn.

### Giải pháp
- **TUYỆT ĐỐI KHÔNG** dùng `overflow: hidden` trên thẻ bọc ngoài cùng (wrapper) nếu bên trong nó đang dùng `transform: scale` để thu nhỏ layout lớn hơn màn hình. 
- Mặc định thẻ con sau khi scale sẽ tự nằm gọn trong màn hình mà không sinh ra thanh cuộn (nếu transform-origin là `top left`). Việc gỡ bỏ `overflow: hidden` sẽ cho phép Safari vẽ trọn vẹn phần tử gốc rồi mới thu nhỏ.

## 2. Bẫy `minmax(0, 1fr)` trong CSS Grid bị vỡ bởi nội dung có `min-width`

### Hiện tượng
Các thẻ nội dung (Card) bên trong một cột Grid bị lòi/tràn ra khỏi viền của cột và tràn ra khỏi nền (background), mặc dù cột đó được set là `1fr` hoặc `minmax(0, 1fr)`.

### Nguyên nhân
Trong `grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr)`:
- Cột bên trái (`1.5fr`) chứa một khối nội dung có kích thước tối thiểu nội tại lớn (ví dụ: thẻ canvas 3D hoặc nhiều thẻ con có min-width cộng dồn).
- Khi lưới Grid phân bổ không gian, khối lượng nội dung tối thiểu khổng lồ của cột trái sẽ **chiếm quyền** và ép cột phải (`1fr`) phải thu hẹp lại.
- Nếu cột phải bị ép thu hẹp xuống dưới mức `min-width` của thẻ con bên trong nó (ví dụ: Thẻ Âm Dương có min-width là `349px`, nhưng cột bị ép còn `300px`), thẻ con sẽ **tràn (overflow) ra khỏi cột Grid** và lòi ra ngoài viền nền.

### Giải pháp
- Thay vì để cột chứa thẻ cứng dùng `minmax(0, 1fr)`, phải phân tích và **ép cứng kích thước an toàn tối thiểu** cho nó.
- Chuyển thành: `grid-template-columns: minmax(0, 1.4fr) minmax(360px, 1fr)`.
- Quy tắc thép: Cột chứa các Card cứng (rigid cards) phải được bảo vệ bằng `minmax(<safe-width>, 1fr)` để ngăn chặn các cột khác (dù có tỷ lệ fr lớn hơn) lấn chiếm không gian đến mức làm vỡ layout.

## 3. Position Fixed bóp méo khung nhìn Adaptive

### Bài học đi kèm
Trong một layout dùng `transform: scale` để ép khung hình (VD: `1440px`), các thành phần dùng `position: fixed` (như Sidebar, Header) sẽ bị tách khỏi luồng (document flow). Điều này khiến thẻ cha tính toán sai kích thước, bù trừ sai margin, gây ra tràn viền vô lý hoặc lệch form.
- **Giải pháp**: Phải bọc tất cả trong một container tĩnh và thay thế `position: fixed` bằng `position: sticky`.

## 4. Lỗi "Nổ Layout" (Flex/Grid Blowout) khiến Chrome tự động Zoom Out toàn trang

### Hiện tượng
Trên thiết bị di động (ví dụ 412px), toàn bộ trang web đột nhiên bị thu nhỏ lại (chữ bé xíu) và xuất hiện hai dải màu trống ở hai bên mép màn hình. Các thẻ tưởng chừng đã được set `width: 100%` nhưng thực tế vẫn bị cắt ngang ở bên phải.

### Nguyên nhân
Đây là bẫy kinh điển của Flexbox và CSS Grid. Mặc định, các phần tử con trong Flex/Grid có thuộc tính ẩn là `min-width: auto`. Điều này có nghĩa là chúng **không bao giờ được phép co lại nhỏ hơn kích thước tối thiểu nội tại của nội dung bên trong chúng**.
Nếu một phần tử con ở tít sâu bên trong (ví dụ: một cái Bảng `table` có `min-width: 640px`, hoặc một hàng nút bấm có `white-space: nowrap`) đòi hỏi không gian rộng hơn màn hình, nó sẽ đẩy phình phần tử cha của nó. Lực đẩy này truyền ngược lên tận gốc (Flex Blowout), ép toàn bộ trang web phình to ra 640px. 
Khi trang web 640px bị nhét vào màn hình 412px, trình duyệt sẽ tự động Zoom Out toàn trang để hiển thị cho đủ, gây ra hiện tượng chữ bé và dư viền.

### Giải pháp
- **TUYỆT ĐỐI KHÔNG** dùng `overflow-x: hidden` trên wrapper ngoài cùng để che giấu lỗi, vì nó sẽ gây cắt xén nội dung.
- Phải tìm và áp đặt `min-width: 0` vào **tất cả** các thẻ Flex/Grid Container dọc theo chuỗi phả hệ từ phần tử gốc xuống đến phần tử gây lỗi. Lệnh `min-width: 0` sẽ ghi đè `min-width: auto` mặc định, cho phép các khối Flex/Grid được phép co lại nhỏ hơn nội dung bên trong chúng, từ đó trao lại quyền kiểm soát thanh cuộn cho thẻ con (như `.table-responsive`).

## 5. Bẫy Specificity khi dùng `:deep()` để ép rớt dòng trong Vue 3

### Hiện tượng
Khi dùng `.parent :deep(.child-root) { flex-direction: row !important; }` để ép một danh sách dọc trong component con rớt thành hàng ngang trên mobile, lệnh CSS bị Vô hiệu hoá hoàn toàn, danh sách vẫn đứng dọc.

### Nguyên nhân
Dù dùng `:deep()` và `!important`, nhưng nếu phần tử gốc của component con (root element) cũng tự định nghĩa CSS Scoped của riêng nó (ví dụ `.child-root { flex-direction: column; }`), Vue SFC Compiler đôi khi xếp thứ tự ưu tiên của component con cao hơn (hoặc do class matching không triệt để), khiến lệnh từ component cha bị đánh bật.

### Giải pháp
- Không "gọi với" từ file cha. Cách mạnh mẽ và an toàn nhất để làm responsive cho cấu trúc cốt lõi của một component là viết `@media` query **trực tiếp vào trong file component con đó**. Điều này đảm bảo Specificity luôn đúng và dễ bảo trì.

## 6. Trải nghiệm UX: Bottom Sheet thay thế Modal trên Mobile

### Bài học đi kèm
Trên thiết bị di động, các hộp thoại (Modal/Popup) hiển thị ở chính giữa màn hình là một thiết kế tồi vì ngón tay người dùng rất khó với tới nút tắt (X) ở góc trên. 
- **Giải pháp**: Thiết kế lại toàn bộ Modal thành dạng **Bottom Sheet** (Vuốt từ dưới đáy lên) ở `@media (max-width: 768px)`.
- **CSS cốt lõi**: Đẩy Modal xuống đáy bằng `align-items: flex-end`, bỏ margin, set `width: 100%`, bo tròn 2 góc trên (`border-radius: 20px 20px 0 0`), và thêm animation `slideUp` mượt mà (0.35s cubic-bezier). Thêm một vạch kẻ mờ ảo (Drag Indicator) ở trên cùng đỉnh Modal để thao túng tâm lý người dùng rằng "bảng này có thể tương tác/vuốt".
