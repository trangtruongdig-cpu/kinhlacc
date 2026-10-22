# Màn Kết Quả Đo: thiết kế lại cho việc GIẢNG GIẢI

Ngày 22/10/2026. Phạm vi: `/app/patients/:id/examinations/:examId` (`MeridianResultsView.vue`).

## Vì sao làm

Người dùng mô tả: *"giao diện khá nặng nề nhiều thông tin, thiết kế chưa phẳng, bố cục chưa
nhiều khoảng nghỉ"* và *"đa phần là các thông tin kỹ thuật nên kéo theo mobile càng khó tối ưu"*.

Đo thật trên bản sống 22/10/2026, **chỉ riêng bước 1** của màn (1440×692):

| | Số đo |
|---|---|
| Phần tử nhìn thấy trong một màn | **219** |
| Nút / link | **41** |
| Cỡ chữ khác nhau | **13** |
| Màu chữ / màu nền | **16 / 18** (nền chồng phủ 137% diện tích) |
| Kiểu viền / bóng đổ / bo góc | **13 / 4 / 6** |
| Chiều cao trang | 1.874px = **2,7 màn** |

Và trong `MeridianResultsView.vue` (**7.460 dòng**):

| | Dùng biến hệ thống | Viết cứng |
|---|---|---|
| `font-size` | 104 | **193** |
| `padding`/`margin` | 98 | **230** |
| `border-radius` | 66 | 84 |
| màu (hex/rgb) | — | **305** |
| `box-shadow` | — | 20 |

Các cỡ chữ viết cứng hay dùng nhất:
`10px ×34 · 11px ×32 · 12px ×30 · 13px ×14 · 11.5px ×13 · 12.5px ×12 · 9px ×9 · 9.5px ×5`

**Tám cỡ chữ tí hon trong khoảng 9–13px.** Đó là gốc của "nặng nề": thông tin không được
phân tầng, nó được nhét vào bằng cách THU NHỎ CHỮ. Bóng đổ, nền chồng, 6 kiểu bo góc chỉ là
hệ quả đi kèm.

⚠️ **Hệ thống token KHÔNG thiếu** — `main.css` đã có 10 cỡ chữ, 10 bậc khoảng cách, 5 bo góc,
4 bóng. Vấn đề là 65–70% chỗ không dùng nó. Luật ở đây là TUÂN THỦ, không phải viết thêm bộ mới.

## Điều quyết định toàn bộ thiết kế

Hỏi người dùng *"khi mở màn này, việc bạn làm nhiều nhất là gì"*, câu trả lời:
**giảng giải cho bệnh nhân đang ngồi trước mặt**.

Màn đang được thiết kế như BẢNG ĐIỀU KHIỂN nhưng được dùng như TẤM BẢNG GIẢNG. Hai việc đó
đòi hai thứ trái ngược:

| | Bảng điều khiển | Tấm bảng giảng |
|---|---|---|
| Người đọc | thầy thuốc, biết thuật ngữ | bệnh nhân, không biết gì |
| Khoảng cách nhìn | 40cm, chăm chú | ~1m, liếc ngang |
| Cần | nhiều dữ liệu cùng lúc | MỘT ý tại một thời điểm |
| Nút bấm | càng sẵn càng tốt | là NHIỄU — bệnh nhân không bấm |
| Chữ 9–11px | đọc được | KHÔNG đọc được |

Không có cách trình bày nào phục vụ tốt cả hai cùng lúc. Người dùng chốt hướng **B — thiết kế
lại hẳn màn chính** theo việc giảng giải, chi tiết chuyên môn lùi xuống mục mở rộng.

## Cấu trúc hiện có (đã đo, đừng dựng lại)

Màn ĐÃ có ba bước; 219 phần tử nói trên là của riêng bước 1:

| Bước hiện tại | Chứa |
|---|---|
| 1 Kết Quả Đo & Bát Cương | I. Kết quả đo · II. Kết luận bát cương |
| 2 Chẩn Đoán & Điều Trị | III. Mô hình bệnh lý · IV. 81 huyệt · V. 7 bài thuốc |
| 3 Biện Chứng – Pháp Trị | ① Giai đoạn · ② Tác nhân · ③ Bát cương chính khí |

Nặng nề nằm BÊN TRONG mỗi bước. Không cần thêm cơ chế bước mới.

## Thiết kế

### 1. Đổi thứ tự ba bước

Hiện là *đo → chữa → giải thích*. Mạch khi ngồi với bệnh nhân là *đo → giải thích → chữa*.

Thứ tự mới: `1 Kết quả đo` → `2 Vì sao` (biện chứng, đang là bước 3) → `3 Chữa thế nào`
(điều trị, đang là bước 2).

Chỉ đổi THỨ TỰ HIỂN THỊ. Không đụng nội dung, không đụng engine, không đụng route.

### 2. Mỗi bước có đúng một CÂU CHỐT

Dòng chữ lớn nhất màn, nói kết luận bằng tiếng thường. Ví dụ ca #9709:

| Bước | Câu chốt |
|---|---|
| 1 | "Cơ thể đang **thiên về Dương Hư** — phần nóng ấm bị thiếu" |
| 2 | "Bệnh đang ở **Thiếu Dương** — giai đoạn nửa ngoài nửa trong" |
| 3 | "Hướng chữa: **ôn dương, kiện tỳ** — làm ấm và nâng tiêu hoá" |

⚠️ **Thuật ngữ không bao giờ đi một mình.** Mỗi thuật ngữ Đông Y kèm một dòng tiếng Việt
thường ngay dưới, cỡ nhỏ hơn: bệnh nhân đọc dòng dưới, thầy thuốc đọc dòng trên.

### 3. Ba tầng thông tin trong mỗi bước

Thay cho một mặt phẳng đổ hết:

- **Tầng 1 — luôn hiện:** câu chốt + MỘT hình (đồ hình cơ thể / vòng Ngũ Hành).
  Tối đa **7 phần tử**.
- **Tầng 2 — hiện, chữ nhỏ hơn:** 3–5 ý đỡ cho câu chốt (tạng phủ nào hư, kinh nào, thể bệnh gì).
- **Tầng 3 — ĐÓNG SẴN, bấm mới mở:** mục "Chi tiết chuyên môn" chứa 24 số đo, bát cương đầy
  đủ, 81 huyệt, 7 bài thuốc, chip cell-reference.

⚠️ **Tầng 3 KHÔNG mất gì.** Mọi thứ hiện có vẫn còn, vẫn trong DOM, chỉ không hiện mặc định.
Đây là ranh giới chịu lực của thiết kế: "lùi xuống" khác hẳn "bỏ đi".

Mục tiêu đo được ở bước 1: **219 phần tử → ngưỡng ≤ 35 ở tầng 1+2** (nhắm 25–30);
**41 nút → 4 nút in phiếu** cộng ‹ › chuyển bước, phần còn lại nằm trong tầng 3.
Hai con số này khớp với bảng Nghiệm thu bên dưới — sửa một chỗ thì sửa cả hai.

### 4. Hệ thống thị giác

Năm bậc chữ, ánh xạ vào token SẴN CÓ trong `main.css`:

| Vai trò | Token |
|---|---|
| Câu chốt | `--font-size-3xl` |
| Tiêu đề bước | `--font-size-xl` |
| Thân bài | `--font-size-base` |
| Phụ / chú thích | `--font-size-sm` |
| Nhãn nhỏ nhất | `--font-size-xs` |

- **Sàn cứng: không gì dưới 12px** ở tầng 1–2. Tám cỡ 9–13px gom hết về `sm` và `xs`.
- **Phẳng:** bỏ cả 20 `box-shadow` ở tầng 1–2. Phân tách khối bằng MỘT đường viền 1px HOẶC
  nền khác một bậc — không dùng cả hai cùng lúc.
- **Bo góc:** chỉ `--radius-md` cho thẻ, `--radius-full` cho chip. Bỏ bốn kiểu còn lại.
- **Khoảng nghỉ:** tối thiểu `--space-4` giữa hai khối, `--space-6` giữa hai nhóm.

### 5. Thanh bên tự thu

Vào màn này thì thanh bên thu lại, mở bằng nút. Bệnh nhân không cần thấy 19 mục quản trị.

## Phạm vi — cái gì KHÔNG đụng

- Engine tính toán, thuật toán đo kinh lạc, dữ liệu, mọi route: **không đụng**.
- Bốn nút in phiếu: giữ nguyên chức năng, chuyển lên thanh trên cùng.
- CSS cũ (7.460 dòng): **ở lại phục vụ tầng 3**. Tầng 1–2 viết MỚI theo token.
  Đây là quyết định về chi phí và rủi ro: không sửa 305 màu cứng và 193 cỡ chữ cứng bằng tay;
  phần cũ nằm trong mục đóng sẵn nên không ảnh hưởng cảm nhận, và nếu có lỗi thì lỗi nằm ở
  phần mới, dễ lần.
- Các màn khác trong `/app`: lần này **không đụng**. Nguyên tắc chốt ở đây rồi mới nhân rộng.

## Nghiệm thu

Đo lại bằng chính script đã dùng để chẩn đoán (đếm phần tử/nút/cỡ chữ/màu trong viewport):

| | Trước | Đích |
|---|---|---|
| Phần tử nhìn thấy (bước 1, tầng 1+2) | 219 | ≤ 35 |
| Nút trong vùng nội dung | 41 | ≤ 8 |
| Cỡ chữ khác nhau | 13 | ≤ 5 |
| Cỡ chữ nhỏ nhất | 9px | ≥ 12px |
| `box-shadow` ở tầng 1–2 | 4 kiểu | 0 |

Và một phép kiểm chịu lực: **mở "Chi tiết chuyên môn" thì mọi thông tin cũ phải còn đủ** —
so danh sách mục trước/sau, không được thiếu mục nào.

⚠️ Phép đo phải có chốt tự kiểm (xem memory `phep-do-ui-phai-co-chot-tu-kiem`): chạy script
đo khi KHÔNG thay đổi gì, hai lượt phải ra cùng số. Màn này có đồ hình vẽ theo nhu cầu nên
so ảnh chụp là phép đo dối.

## Rủi ro đã biết

- **Đổi thói quen làm việc.** Thầy thuốc quen mọi thứ hiện sẵn sẽ phải bấm thêm một lần để
  vào tầng 3. Đây là đánh đổi người dùng đã chốt khi chọn hướng B.
- **`MeridianResultsView.vue` đã 7.460 dòng.** Thêm tầng 1–2 làm nó dài hơn nữa. Nên tách
  phần mới thành component riêng ngay từ đầu, đừng nhồi tiếp vào file này.
- **Ba bản sao thuật toán** (xem CLAUDE.md): lib frontend, util backend, bản riêng trong
  chính file này. Thiết kế này KHÔNG đụng thuật toán, nhưng ai sửa tiếp phải nhớ luật đó.
- **Câu chốt là chữ do người viết, không phải engine sinh.** Phải lấy từ dữ liệu đã có
  (bát cương, lục kinh, pháp trị) chứ không bịa thêm kết luận y học mới — ranh giới này
  cùng loại với luật phạm vi hành nghề Y sỹ.
