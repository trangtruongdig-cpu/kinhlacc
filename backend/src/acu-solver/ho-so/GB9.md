# HỒ SƠ HUYỆT GB9 — Thiên Xung (Focks: THIÊN XUNG)

Kinh GB (Đởm), huyệt thứ 9. Hạng nghiệm thu: **C** — chưa vào sổ

## 1. Nguồn chữ
**Từ điển app:** Sau huyệt Suất Cốc 0,5 thốn, ở trên và sau tai, trong chân tóc 2 thốn, vùng cơ tai trên.

**Atlas Focks — vị trí:** Trên đỉnh tai (huyệt Giác tôn (SJ/TB 20) 1,5 thốn là huyệt Suất cốc (SJ/TB 20) và ra phía sau 0,5 thốn. Vị trí này thẳng xuống xấp xỉ rìa sau của tai.

**Atlas Focks — cách xác định:** Đầu tiên, tìm huyệt Suất cốc (SJ/TB 20) trong một chỗ lõm xương nhỏ trên đỉnh tai 1,5 thốn. Từ đó lui về sau khoảng 0,5 thốn và xác định vị trí huyệt Thiên xung (Gb 9) trong một “vết lõm xương” nhỏ, thường sờ thấy được. Huyệt Thiên xung (Gb 9) cùng với huyệt Hoàn cốt (Gb 12) (ở vùng lõm phía sau và bên dưới xương chũm) làm điểm định hướng cho đường kinh chạy cong gần như song song với mép sau của tai ở vùng chân tóc và trên đó có các huyệt Phù bạch (Gb 10) và huyệt Đầu khiếu âm (Gb 11) nằm ở hai đầu của phần thứ 2 (xem hình).

**WHO 2008:** (chưa thu thập — agent thư lại điền)

## 2. Ảnh atlas — BẰNG CHỨNG MẠNH NHẤT, phải ĐO chứ đừng chỉ tả
- /Users/truongtrang/Desktop/kinhlacc-atlas-hinh/GB9_p280_0.jpeg

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
1. `node do-anh-atlas.cjs GB9 --luoi` → toạ độ pixel của mọi chấm huyệt trên trang (chấm ĐỎ =
   huyệt của trang này, chấm ĐEN = các huyệt vẽ kèm).
2. Mở ảnh bằng công cụ Read, gán nhãn cho từng toạ độ pixel (máy tách được chấm nhưng không đọc được chữ).
3. Chọn HAI huyệt làm mốc mà bản vẽ có và mesh cũng có, chiếu huyệt đang xét lên đoạn nối chúng:
   `t = ((X−A)·(B−A)) / |B−A|²` tính trên pixel.
4. `node doi-chieu-ti-le.cjs GB9 <A> <B> --anh <t vừa tính>` → in ngay chênh lệch quy ra cm.
Đây là phép kiểm ĐỘC LẬP với cốt độ và với mốc xương, tức độc lập với chính engine đã dựng toạ độ.

## 3. Toạ độ engine đang dựng
x=0.0399 y=0.9382 z=-0.0097  →  ngang 6.86cm · cao 161.28cm · trước-sau -1.67cm · conf=khoá

## 4. Khung đường kinh
Đoạn **sau-tai** — vùng: trên và sau tai. Ranh mô: vòng trên đỉnh tai rồi xuống sau tai, tới bờ dưới mỏm chũm
Các huyệt trong đoạn: GB7 → GB8 → GB9 → GB10 → GB11 → GB12

## 6. Hàng xóm cùng kinh (khoảng cách ĐO so với SÁCH ĐÒI)
- **GB8** Suất Cốc: đo thẳng 2.14cm, đo trên da 2.6cm
  > Gấp vành tai, huyệt ở ngay trên đỉnh vành tai, trong chân tóc 1,5 thốn.
- **GB10** Phù Bạch: đo thẳng 2.72cm, đo trên da 5cm
  > Tại bờ trên chân vành tai, trong chân tóc 01 thốn. Hoặc lấy tỉ lệ 1/3 trên và 2/3 dưới của đoạn nối huyệt Thiên Xung (Đ.9) và Hoàn Cốt (Đ.12).

## 7. Huyệt lân cận khác kinh (bán kính 4cm) — dùng để bắt CHẬP HUYỆT và sai vùng
- GB8 Suất Cốc — 2.14cm
- GB10 Phù Bạch — 2.72cm
- TE21 Nhĩ Môn — 2.83cm
- TE19 Lư Tức — 2.94cm
- SI19 Thính Cung — 3.48cm
- GB7 Khúc Tân — 3.53cm
- TE18 Khế Mạch — 3.61cm
- TE20 Giác Tôn — 3.71cm

## 8. Cấu trúc giải phẫu gần nhất trên mesh atlas
- Xương thái dương trái (bone) — 0.46cm
- Xương đỉnh trái (bone) — 0.74cm
- Xương hàm dưới (bone) — 3.88cm
- Cơ dài nhất đầu trái (muscle) — 3.98cm
- Xương bướm (bone) — 4.02cm

## 9. Cờ mà các bộ kiểm máy đã bắn
- RẢI DỌC ĐƯỜNG dời 12.79cm (conf=khoá)
- XA ĐƯỜNG KINH 10.52cm
- AUDIT cờ soát: RẢI DỌC ĐƯỜNG: dời 12.79cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt
- ATLAS FOCKS kêu: dọc "TE20" đòi 1.5 thốn, đo được 1.3  (lệch 0.55cm)

## 10. Đã ghi CÒN NGỜ trong sổ
Loại: duong
RẢI DỌC ĐƯỜNG: dời 12.79cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt
