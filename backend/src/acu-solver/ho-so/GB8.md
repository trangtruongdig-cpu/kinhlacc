# HỒ SƠ HUYỆT GB8 — Suất Cốc (Focks: SUẤT CỐC)

Kinh GB (Đởm), huyệt thứ 8. Hạng nghiệm thu: **C** — chưa vào sổ

## 1. Nguồn chữ
**Từ điển app:** Gấp vành tai, huyệt ở ngay trên đỉnh vành tai, trong chân tóc 1,5 thốn.

**Atlas Focks — vị trí:** Nằm ngay phía trên đỉnh tai, chỗ lõm ở bờ trên của cơ thái dương, cách đường chân tóc khoảng 1,5 thốn.

**Atlas Focks — cách xác định:** Tìm đỉnh vành tai, ở đây tại chân tóc thái dương là huyệt Giác tôn (SJ/TB 20). Sờ nắn từ đây thẳng lên trên đến khi ngón tay trượt vào một chỗ lõm xương nhỏ huyệt Suất cốc (Gb 8), thường nhạy cảm với áp lực. Để tham chiếu: Huyệt cách đường chân tóc quanh tai khoảng 1,5 thốn (bề rộng 2 ngón tay). Trong quá trình cử động nhai, sờ thấy được chuyển động của cơ thái dương ở huyệt Suất cốc (Gb 8). Huyệt Thiên xung (Gb 9) nằm cùng mức, từ huyệt Suất cốc (Gb 8) ngang ra sau 0,5 thốn.

**WHO 2008:** (chưa thu thập — agent thư lại điền)

## 2. Ảnh atlas — BẰNG CHỨNG MẠNH NHẤT, phải ĐO chứ đừng chỉ tả
- /Users/truongtrang/Desktop/kinhlacc-atlas-hinh/GB8_p279_0.jpeg

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
1. `node do-anh-atlas.cjs GB8 --luoi` → toạ độ pixel của mọi chấm huyệt trên trang (chấm ĐỎ =
   huyệt của trang này, chấm ĐEN = các huyệt vẽ kèm).
2. Mở ảnh bằng công cụ Read, gán nhãn cho từng toạ độ pixel (máy tách được chấm nhưng không đọc được chữ).
3. Chọn HAI huyệt làm mốc mà bản vẽ có và mesh cũng có, chiếu huyệt đang xét lên đoạn nối chúng:
   `t = ((X−A)·(B−A)) / |B−A|²` tính trên pixel.
4. `node doi-chieu-ti-le.cjs GB8 <A> <B> --anh <t vừa tính>` → in ngay chênh lệch quy ra cm.
Đây là phép kiểm ĐỘC LẬP với cốt độ và với mốc xương, tức độc lập với chính engine đã dựng toạ độ.

## 3. Toạ độ engine đang dựng
x=0.0419 y=0.9501 z=-0.0066  →  ngang 7.2cm · cao 163.32cm · trước-sau -1.13cm · conf=cao

## 4. Khung đường kinh
Đoạn **sau-tai** — vùng: trên và sau tai. Ranh mô: vòng trên đỉnh tai rồi xuống sau tai, tới bờ dưới mỏm chũm
Các huyệt trong đoạn: GB7 → GB8 → GB9 → GB10 → GB11 → GB12

## 6. Hàng xóm cùng kinh (khoảng cách ĐO so với SÁCH ĐÒI)
- **GB7** Khúc Tân: đo thẳng 1.39cm, đo trên da 0.8cm
  > Tại giao điểm của đường nằm ngang bờ trên tai ngoài và đường thẳng trước tai ngoài, trên chân tóc, sát động mạch thái dương nông.
- **GB9** Thiên Xung: đo thẳng 2.14cm, đo trên da 2.6cm
  > Sau huyệt Suất Cốc 0,5 thốn, ở trên và sau tai, trong chân tóc 2 thốn, vùng cơ tai trên.

## 7. Huyệt lân cận khác kinh (bán kính 4cm) — dùng để bắt CHẬP HUYỆT và sai vùng
- GB7 Khúc Tân — 1.39cm
- GB6 Huyền Ly — 2.01cm
- GB9 Thiên Xung — 2.14cm
- GB5 Huyền Lư — 2.8cm
- GB4 Hàm Yến — 3.66cm

## 8. Cấu trúc giải phẫu gần nhất trên mesh atlas
- Xương đỉnh trái (bone) — 0.15cm
- Xương thái dương trái (bone) — 0.5cm
- Xương trán (bone) — 3.67cm
- Xương bướm (bone) — 3.82cm
- Xương hàm dưới (bone) — 5.66cm

## 9. Cờ mà các bộ kiểm máy đã bắn
- RẢI DỌC ĐƯỜNG dời 11.43cm (conf=cao)
- XA ĐƯỜNG KINH 10.64cm
- AUDIT cờ soát: RẢI DỌC ĐƯỜNG: dời 11.43cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt

## 10. Đã ghi CÒN NGỜ trong sổ
Loại: duong
RẢI DỌC ĐƯỜNG: dời 11.43cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt
