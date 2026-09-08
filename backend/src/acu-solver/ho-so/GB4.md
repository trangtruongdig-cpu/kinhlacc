# HỒ SƠ HUYỆT GB4 — Hàm Yến (Focks: HÀM YẾN)

Kinh GB (Đởm), huyệt thứ 4. Hạng nghiệm thu: **A** — Hàm Yếm — 1/4 đường nối Đầu Duy (ST8) với Khúc Tấn (GB7)

## 1. Nguồn chữ
**Từ điển app:** Trong chân tóc vùng thái dương, nơi có di động khi há miệng nhai, huyệt Đầu Duy (Vi 8) đo xuống một thốn, tại 1/4 trên và 3/4 dưới của đoạn nối huyệt Đầu Duy và Khúc Tân (Đ 7).

**Atlas Focks — vị trí:** Trong vùng chân tóc thái dương, trên ranh giới giữa phần tư thứ nhất và thứ hai của đường nối giữa huyệt Đầu duy (Ma/ST 8) và huyệt Khúc tấn/mấn (Gb 7).

**Atlas Focks — cách xác định:** Đầu tiên tìm, xác định hai điểm mốc: huyệt Đầu duy (Ma/ST 8) (ở góc trán/thái dương) và huyệt Khúc tấn/mấn (Gb 7) (phần lõm ở ngang chóp tai, xấp xỉ đường chân tóc quanh tai). Sau đó chia đường này làm 4 phần. Trên đường này, từ huyệt Đầu duy (Ma/ST 8), xác định vị trí huyệt Hàm yến (Gb 4) tại điểm phần tư đầu tiên (giữa phần tư thứ nhất và thứ 2). Huyệt thường nằm trong chân tóc thái dương và phần trước của cơ thái dương, có thể cảm nhận được khi nhai.

**WHO 2008:** (chưa thu thập — agent thư lại điền)

## 2. Ảnh atlas — BẰNG CHỨNG MẠNH NHẤT, phải ĐO chứ đừng chỉ tả
- /Users/truongtrang/Desktop/kinhlacc-atlas-hinh/GB4_p274_0.jpeg

Mỗi trang thường có hai bảng: **bản vẽ sơ đồ xương** (bên trái) và **ảnh chụp người thật** (bên phải).
Bản vẽ là thứ đáng giá nhất vì nó đặt huyệt đang xét CẠNH NHIỀU HUYỆT KINH KHÁC trên cùng một hình —
vị trí tương đối giữa chúng không phụ thuộc cỡ ảnh hay tầm vóc người mẫu.

**KÝ HIỆU TRONG ẢNH LÀ TIẾNG ĐỨC** (bản Focks dịch từ *Leitfaden Akupunktur*). Đọc nhầm ký hiệu là
phán quyết sai từ gốc mà không ai phát hiện:
| trong ảnh | tiếng Đức | kinh | mã quốc tế |
|---|---|---|---|
| Lu | Lunge | Phế | LU |
| Di | Dickdarm | Đại Trường | **LI** |
| Ma | Magen | Vị | ST |
| Mi | Milz | Tỳ | SP |
| He | Herz | Tâm | HT |
| **Dü** | Dünndarm | Tiểu Trường | **SI** |
| Bl | Blase | Bàng Quang | BL |
| Ni | Niere | Thận | KI |
| Pe | Perikard | Tâm Bào | PC |
| **SJ / 3E / TB** | San Jiao | Tam Tiêu | **TE** |
| Gb / G | Gallenblase | Đởm | GB |
| Le / Liv | Leber | Can | LR |
| Du | Du Mai | Đốc | GV |
| Ren | Ren Mai | Nhâm | CV |
| Ex-UE | Extrapunkte obere Extremität | kỳ huyệt chi trên | (ngoài kinh) |
| Ex-LE / Ex-KH / Ex-B | chi dưới / đầu-cổ / lưng | kỳ huyệt | (ngoài kinh) |

Chú ý hai chỗ dễ lẫn nhất: **Dü là Tiểu Trường (SI), không phải Đốc**; **SJ là Tam Tiêu (TE), không
phải Tiểu Trường**.

**CÁCH ĐO (bắt buộc, đừng tả bằng lời):**
1. `node do-anh-atlas.cjs GB4 --luoi` → toạ độ pixel của mọi chấm huyệt trên trang (chấm ĐỎ =
   huyệt của trang này, chấm ĐEN = các huyệt vẽ kèm).
2. Mở ảnh bằng công cụ Read, gán nhãn cho từng toạ độ pixel (máy tách được chấm nhưng không đọc được chữ).
3. Chọn HAI huyệt làm mốc mà bản vẽ có và mesh cũng có, chiếu huyệt đang xét lên đoạn nối chúng:
   `t = ((X−A)·(B−A)) / |B−A|²` tính trên pixel.
4. `node doi-chieu-ti-le.cjs GB4 <A> <B> --anh <t vừa tính>` → in ngay chênh lệch quy ra cm.
Đây là phép kiểm ĐỘC LẬP với cốt độ và với mốc xương, tức độc lập với chính engine đã dựng toạ độ.

## 3. Toạ độ engine đang dựng
x=0.0387 y=0.9633 z=0.0098  →  ngang 6.65cm · cao 165.59cm · trước-sau 1.68cm · conf=mốc

## 4. Khung đường kinh
Đoạn **chan-toc-ben** — vùng: chân tóc thái dương. Ranh mô: vòng theo chân tóc thái dương, trên cơ thái dương
Các huyệt trong đoạn: GB3 → GB4 → GB5 → GB6 → GB7

## 6. Hàng xóm cùng kinh (khoảng cách ĐO so với SÁCH ĐÒI)
- **GB3** Thượng Quan: đo thẳng 6.84cm, đo trên da 12.2cm
  > Ở phía trước tai, bờ trên xương gò má, xác định huyệt Hạ Quan kéo thẳng lên, đến chỗ lõm bờ sau chân tóc mai.
- **GB5** Huyền Lư: đo thẳng 0.92cm, đo trên da 0.4cm
  > Ở sát động mạch Thái Dương nông, trên đường nối huyệt Hàm Yến (Đ 4) và Khúc Tân (Đ 7), cách Hàm Yến 0,6 thốn.

## 7. Huyệt lân cận khác kinh (bán kính 4cm) — dùng để bắt CHẬP HUYỆT và sai vùng
- ST8 Đầu Duy — 0.92cm
- GB5 Huyền Lư — 0.92cm
- GB6 Huyền Ly — 1.84cm
- GB7 Khúc Tân — 2.76cm
- GB8 Suất Cốc — 3.66cm

## 8. Cấu trúc giải phẫu gần nhất trên mesh atlas
- Xương đỉnh trái (bone) — 0.33cm
- Xương trán (bone) — 0.67cm
- Xương thái dương trái (bone) — 3.25cm
- Xương bướm (bone) — 3.47cm
- Xương gò má trái (bone) — 5.54cm

## 9. Cờ mà các bộ kiểm máy đã bắn
- XA ĐƯỜNG KINH 0cm
