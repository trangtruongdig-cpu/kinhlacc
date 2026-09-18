# Thuật toán đo nhiệt độ kinh lạc — đặc tả và lý do

> Tài liệu này ghi lại **logic cốt lõi** của phần mềm: công thức, nguồn gốc, và vì sao mỗi
> quyết định được chọn như vậy. Đọc nó trước khi sửa bất cứ dòng nào trong
> `frontend/src/lib/meridianAnalysis.ts` hoặc `backend/src/utils/meridian-analysis.util.ts`.
>
> Lập ngày 19/09/2026, sau một vòng thẩm định gồm ba phản biện độc lập và một vòng thẩm tra
> đối kháng, đối chiếu với nguồn sơ cấp và với 12 ca đo thật.

---

## 1. Nguồn gốc — cái gì là của ai

Phép đo **không phải** do phần mềm này nghĩ ra. Chuỗi kế thừa:

| Mốc | Người / việc |
|---|---|
| ~1950, Nhật Bản | **Akabane 赤羽** — *Tri nhiệt cảm độ trắc định pháp* (知熱感度測定法): hơ ngải ở tỉnh huyệt, đếm số lần đến khi bệnh nhân thấy nóng, so **tỉ lệ trái–phải** của cùng một kinh |
| 1983, Việt Nam | **Lê Văn Sửu** — thay giác quan bệnh nhân bằng cảm biến nhiệt, giữ nguyên 24 tỉnh huyệt; đặt "nguyên tắc chia ba" và luật biểu/lý. Đề tài Nhà nước 48070203 |
| — | Mô hình bảng tính Excel (còn lưu trong `map.md`) |
| nay | Phần mềm này: chép lại bảng tính, rồi xây thêm tầng Lục Kinh và truyền biến |

Nguồn sơ cấp: hai chương sách trên `dokinhlac.com.vn` (chứng chỉ TLS hết hạn — tải bằng `curl -k`).

**Hệ quả cần nhớ:** phần đo và cách đọc số là **cài đặt lại một quy tắc đã in**, không phải phát
minh. Phần thật sự mới nằm ở chỗ khác — xem mục 8.

---

## 2. Dữ liệu vào

24 số: 12 đường kinh × 2 bên, đo ở **tỉnh huyệt** đầu ngón tay/chân, đơn vị °C.
Chia **hai nhóm tính ngưỡng ĐỘC LẬP** (sách: *"hai chi xa gần trung tâm tạng phủ khác nhau"*):

- **Chi trên**: Tiểu Trường · Tâm · Tam Tiêu · Tâm Bào · Đại Trường · Phế
- **Chi dưới**: Bàng Quang · Thận · Đởm · Vị · Can · Tỳ

Dải thực tế đo được trên ca thật: range chi trên trung vị **1,05 °C**, chi dưới **1,60 °C**;
chênh trái–phải trung vị **0,30 °C**. Ô nhập lượng tử hoá 0,1 °C.

---

## 3. Ngưỡng — "nguyên tắc chia ba"

```
mean = (MAX + MIN) / 2        ← TRUNG ĐIỂM KHOẢNG, không phải trung bình cộng
sd   = (MAX − MIN) / 6        ← sách gọi "sai số giới hạn"
trần = mean + sd  ·  sàn = mean − sd
```

Đây chính là **1/3 giữa** của khoảng [MIN, MAX]: 1/3 trên là **nhiệt** (dấu `+`), 1/3 dưới là
**hàn** (dấu `−`), 1/3 giữa là *"biến đổi sinh lý cho phép"* (không mang dấu).

Chứng minh đồng nhất: 1/3 giữa = `[MIN+R/3, MAX−R/3]` = `mean ± R/6` = `mean ± sd`. ✔

⚠️ **Đừng đổi sang trung bình cộng hay trung vị.** Trông có vẻ "đúng thống kê hơn" (trung điểm
khoảng có điểm gãy 0% — chỉ MAX và MIN quyết định ngưỡng, 10 số còn lại không ảnh hưởng gì),
nhưng đổi là **ly khai khỏi phương pháp gốc**, phải là quyết định của thầy thuốc chứ không phải
của kỹ thuật. Bằng chứng nó là của sách: ví dụ in trong sách có Ô4 = 34,6, đúng bằng trung điểm,
trong khi trung bình cộng 12 số là 34,7333.

---

## 4. Đại lượng mỗi đường kinh

| Tên trong code | Tên trong sách | Công thức |
|---|---|---|
| `avg` | trung bình của kinh | trung bình các bên **thực có** |
| `diff` | **số tương quan** (cột 10) | `avg − mean` |
| `absDiff` | **độ dao động nhiệt** (cột 12) | `|trái − phải|` |
| `leftSign`/`rightSign` | dấu `+`/`−`/`0` | so **giá trị đơn** với trần/sàn |

**Ô bỏ trống về đây dưới dạng `0`** (form nhập dùng `Number(...) || 0`). Số 0 **không phải** "lạnh
nhất" — nó là *không có số đo*. `calculateBounds` đã lọc `v > 0`, nên `processRows` cũng phải lọc:
nếu chia đôi vô điều kiện thì một ô trống kéo `avg` xuống một nửa và biến kinh lành thành kinh hàn
nặng — đo được: **đổi kết luận ~50% số ca, không cảnh báo gì**. Đã vá; có cờ `thieuDo`.

---

## 5. Phân định Biểu / Lý × Hàn / Nhiệt — **BA hạng**

Sách phân mỗi kinh vào **một trong ba** hạng:

| Hạng | Điều kiện | Ý nghĩa |
|---|---|---|
| **Lý** | cả hai bên đều mang dấu, **cùng dấu** | bệnh ở sâu |
| **Biểu** | chỉ **một** bên mang dấu, **hoặc** hai bên mang dấu **trái dấu** | bệnh ở nông |
| **Không biểu không lý** | **cả hai bên đều KHÔNG mang dấu** | *"Các kinh này không có bệnh lý"* |

Hạng thứ ba từng **thiếu hẳn** trong code. Khi hai bên đều không mang dấu thì tổng ba dấu chỉ còn
lại dấu của số tương quan — mà số tương quan hầu như không bao giờ đúng bằng 0 (nhiệt độ có số lẻ
0,1) — nên kinh lành luôn bị tổng `±1` đẩy vào nhóm Biểu. Đó là lý do bảng tạng phủ **luôn đủ 12/12**
với mọi phiếu, kể cả phiếu trắng. Vá xong gỡ được **7,6%** chẩn thừa trên 12 ca thật.

### Cửa chặn sai số cho Biểu — cố ý KHÔNG cài

Sách viết: *"được xem là bệnh lý khi giá trị tuyệt đối của số tương quan **từ gần bằng** cho đến
lớn hơn sai số giới hạn"*. Cụm "gần bằng" không định lượng được, và trong **chính ví dụ có lời giải
của sách**, kinh Tâm có số tương quan 0,1 trên sai số 0,2 (một nửa) vẫn được xếp Biểu nhiệt. Áp
ngưỡng cứng `|diff| ≥ sd` sẽ loại nhầm **Tâm, Thận, Đởm** — cả ba sách đều xếp là bệnh lý.

Ngoại lệ của sách cũng phải nhớ nếu sau này cài: *hai bên **trái dấu** thì vẫn là bệnh lý kể cả khi
số tương quan nhỏ*.

### Hạng "cận nhiệt" — **còn nợ**

Sách có thêm hạng *cận nhiệt* cho trường hợp một bên nằm **đúng ngay ngưỡng** (trong ví dụ là Đại
Trường và Can). Code hiện xếp chúng thành Biểu nhiệt. Chưa cài.

---

## 6. Hai trục nông–sâu và thứ tự truyền kinh — **không được lẫn**

Đây là lỗi khái niệm từng gây hậu quả nặng nhất, nên ghi kỹ.

| Trục | Trường | Thứ tự | Trả lời câu hỏi |
|---|---|---|---|
| **Thứ tự truyền kinh** | `thuTu` | Thái Dương → **Dương Minh** → **Thiếu Dương** → Thái Âm → Thiếu Âm → Quyết Âm | *tà đã đi được mấy chặng* (Tố Vấn · Nhiệt luận) |
| **Nông → sâu (vị trí)** | `tang` | Thái Dương → **Thiếu Dương** → **Dương Minh** → Thái Âm → Thiếu Âm → Quyết Âm | *tà đang nằm ở đâu* |

Hai trục chỉ khác nhau ở **đúng một chỗ**: Thiếu Dương (bán biểu bán lý) **nông hơn** Dương Minh
(lý thực nhiệt). Trước đây `tang` là bản sao của `thuTu`, nên:

- `Thiếu Dương → Dương Minh` bị dán nhãn **"bệnh lui"**, trong khi Thương Hàn Luận gọi đó là
  **chuyển thuộc Dương Minh** (điều 229–230, chứng Đại Sài Hồ): tà từ bán biểu bán lý vào phủ hoá
  táo thực — **bệnh tiến**.
- `Dương Minh → Thiếu Dương` bị gọi là "truyền vào lý", trong khi đó là **ra bán biểu bán lý** —
  bệnh lui.

**Luật dùng**: `thuTu` cho tuần kinh / việt kinh; `tang` cho vào lý / ra biểu. Khi hai trục nói
ngược nhau thì dùng tên riêng của Thương Hàn Luận, đừng ép vào "tiến/lui" chung chung.

⚠️ Mọi thành phần vẽ trục dọc theo `tang` **phải khai nhãn hàng theo đúng thứ tự `tang`**, nếu
không chấm rơi sai hàng mà không có lỗi nào báo.

---

## 7. Bất biến affine — giới hạn cốt tử của phép đo

Mọi ngưỡng đều dựng lại từ **chính 24 số của lần đo đó**. Suy ra: áp `x → a·x + b` (a > 0) cho cả
bộ thì **mọi đầu ra y hệt** — Bát Cương, Khí/Huyết, Hư/Thực, tổng cương, định vị Lục Kinh.

| Tình huống | Kết luận Bát Cương / Lục Kinh |
|---|---|
| Toàn thân nguội 2 °C | **không đổi một chữ** |
| Toàn thân ấm 1 °C | **không đổi một chữ** |
| Đổi máy đo, đổi thang đơn vị | **không đổi một chữ** |

**Mặt tốt**: miễn nhiễm với nhiệt độ phòng, độ ẩm chung, hiệu chuẩn máy.
**Mặt trái**: hệ **mù hoàn toàn với mức tuyệt đối** — người khoẻ lên thật và người chỉ có da ẩm hơn
cho ra cùng một kết quả. Đây là lý do phải có trục chính khí riêng (mục 8).

---

## 8. Phần phần mềm tự xây

### 8.1 Bảng tra thể bệnh → Lục Kinh (`lucKinh.ts`)

Thể bệnh (từ rule engine `BenhDongYExcel`) → kinh, qua bảng tra đã được lương y duyệt. Dồn phiếu:
thể mức **A** (chắc Thương Hàn) 2 điểm, mức **B** (thiên nội thương) 1 điểm, kinh phụ ½.

**Đây là phần mới thật sự** và là tài sản trí tuệ dạng **cơ sở dữ liệu tri thức** — không phải phát
minh về phương pháp đo. Đúng/sai của nó nằm ở bảng tra, kiểm được bằng lâm sàng, không kiểm được
bằng toán.

### 8.2 Phá hoà phiếu — **có căn cứ, không theo thứ tự khai báo**

Khi nhiều kinh bằng điểm, `sort` ổn định của JavaScript từng tự lấy kinh đứng trước trong danh sách
khai báo — tức **kinh nông hơn luôn thắng**. Hoà xảy ra ở **4/12 ca thật**.

Luật hiện tại, theo thứ tự:
1. Kinh có **thể mức A** thắng kinh chỉ có thể mức B
2. Còn hoà thì kinh có **Bát Cương đo được khớp chữ ký** thắng (căn cứ từ số đo, không phải từ tên thể)
3. Vẫn đồng hạng thì **nói ra** (`hoaPhieu`, `dongHang`) và **hạ độ tin một bậc**

### 8.3 Trục chính khí (`soSanhChinhKhi`) — trục thứ hai, độc lập

Chỗ **duy nhất** trong hệ nhìn thấy mức tuyệt đối. Bốn ràng buộc, mỗi cái đều có lý do:

| Ràng buộc | Vì sao |
|---|---|
| So bằng **°C thô** | chuẩn hoá lại là quay về bất biến affine |
| **Neo vào lần đo trước** của chính bệnh nhân | không có chuẩn dân số nào |
| **Không** chia cho `sd` | `sd` nở cùng nhịp với độ tụt → tự xoá tín hiệu (công suất 93,7% → 73,6%) |
| **Không** khử trôi nền | khử trôi là mù đúng chỗ cần nhìn (toàn thân nguội 2 °C → chỉ số ra 0) |
| Dùng **tổng độ**, không đếm số kinh | đếm số kinh có công suất ~50% và **đi ngược chiều** khi hồi phục nhiều |

Ngưỡng nhiễu hiện dùng **0,3 °C**, suy từ độ tản trái–phải đo được trên ca thật (hai bên cùng người
cùng lúc lẽ ra phải bằng nhau). ⚠️ Đây là **ước lượng gián tiếp** — xem mục 10.

Khi trục vị trí và trục chính khí **không cùng hướng**, giao diện tách hai dòng và nói rõ: *tà lui
ra nông mà chính khí chưa lên thì chưa phải bệnh lui*. Không ép hai thứ vào một câu.

### 8.4 Ngưỡng cắt đợt bệnh — **quy ước vận hành**

`GAP_DOT_NGAY = 45`. **Không có cơ sở y lý nào** cho con số này; truyền biến Lục Kinh vốn mô tả
ngoại cảm diễn tiến theo **ngày**, nên mọi mốc tính bằng tháng đều là lựa chọn vận hành. Vì vậy:

- luôn hiện **số ngày thật** cạnh dấu cắt
- khoảng **45–90 ngày** đánh dấu ngờ (`moiDotNgo`)
- ca đầu đợt vẫn **đối chiếu tham khảo** được với lần đo trước ở đợt khác — trục chính khí so được
  bất kể đợt vì nó đo nhiệt độ tuyệt đối

---

## 9. Chống trôi

### Phép kiểm vàng

`backend/src/utils/meridian-analysis.util.spec.ts` neo vào **ví dụ có lời giải in sẵn trong sách**
(bệnh nhân Lê Quang T.): các ô ngưỡng, **cả 12 số tương quan**, phân định biểu/lý của 8 kinh, và
việc kinh Tỳ không bị gán bệnh. Ai sửa thuật toán lệch khỏi sách sẽ bị bài kiểm chặn.

```bash
npm test --prefix backend -- meridian-analysis
```

### BA bản sao thuật toán — phải sửa đồng thời

1. `frontend/src/lib/meridianAnalysis.ts`
2. `backend/src/utils/meridian-analysis.util.ts`
3. bản riêng bên trong `frontend/src/views/MeridianResultsView.vue`

Sửa một nơi thì trang kết quả đo và API gợi ý pháp trị cho **hai chẩn đoán khác nhau trên cùng một ca**.

### Không cần cột phiên bản thuật toán

`findOne`, `findByPatient` và thống kê bệnh nhân đều **tính lại từ `inputData`** mỗi lần đọc; các
cột `amDuong`/`khi`/`huyet`/`huThuc` trong `examinations` chỉ là dấu vết. Đổi thuật toán là mọi ca cũ
tự động đọc theo luật mới. (Mặt trái: phiếu đã in trước đây sẽ khác phiếu in lại — chuyện phải nói
với thầy thuốc, không phải chuyện code.)

---

## 10. Những gì CHƯA xác minh — đừng sửa khi chưa biết

| Mục | Tình trạng |
|---|---|
| Công thức trục **Khí / Huyết** (chi trên = Khí, chi dưới = Huyết) | **Chưa rõ** là chép của Lê Văn Sửu hay phần mềm tự đặt. Cần bản sách giấy. Lưu ý: phản biện y lý chỉ ra Phế chủ khí và Tâm chủ huyết mạch **đều là kinh tay**, còn Tố Vấn thiên 24 xếp khí/huyết theo **tên Lục Kinh** (mỗi tên gồm một kinh tay + một kinh chân) |
| Công thức trục **Hư / Thực** (đếm số kinh lệch, bỏ chiều) | **Chưa rõ** nguồn. Nó thiên về đo *độ tản giữa các kinh so với độ tản hai bên*, thang không có mốc 0 (người không bệnh vẫn "Thực" ~53% số lần) và bão hoà từ ~0,5 °C. ⚠️ `huThuc` có **138 chỗ dùng trong 20 file**, gồm cả chọn **huyệt bổ/tả** — đổi nó là đổi chẩn đoán mọi ca cũ |
| **Nhiễu lặp lại thật của máy** | **Chưa ai đo.** Thí nghiệm rẻ nhất và quyết định nhất: đo lặp 20 lần trên một người, cùng buổi. Ở nhiễu 0,05 °C thì Hư/Thực đạt κ = 0,86 (dùng tốt); ở 0,2 °C thì κ = 0,35 (không dùng được). Chưa có số này thì mọi kết luận về độ tin cậy — kể cả ngưỡng 0,3 °C của trục chính khí — đều là phỏng đoán |

### Hai chỗ khái niệm còn vênh

- **"Biểu/Lý" mang hai nghĩa khác nhau.** Của phép đo: *hình dạng lệch* (một bên hay hai bên). Của
  Thương Hàn Luận: *vị trí tà khí* trong tiến trình bệnh ngoại cảm. Tầng Lục Kinh đang lấy nghĩa
  thứ nhất làm đầu vào cho chỗ cần nghĩa thứ hai.
- **Thang thời gian.** Truyền biến Lục Kinh mô tả bệnh ngoại cảm theo ngày; phần mềm so hai lần đo
  cách nhau hàng tuần đến hàng tháng.

---

## 11. Quy trình đo — thiên lệch có hệ thống

Sách dặn: *đo huyệt bên trái trước, bên phải sau*; *đo tay trước, chân sau*; *những điểm đo đầu
tiên phải chờ máy nóng 2–3 phút*. Nghĩa là **bên phải luôn đo sau bên trái** — mà phần mềm đọc
chênh lệch trái–phải thành "Biểu". Trên 12 ca thật, lệch bên 0,3 °C do thứ tự đo đủ làm **6/12 ca
đổi hội chứng**.

Trong dữ liệu thật, lệch trái–phải (≈0,31 °C) **lớn ngang** chênh lệch giữa các kinh (≈0,22–0,44 °C).
