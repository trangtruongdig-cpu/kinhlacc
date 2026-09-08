# HỒ SƠ HUYỆT SI9 — Kiên Trinh (Focks: KIÊN TRINH)

Kinh SI (Tiểu Trường), huyệt thứ 9. Hạng nghiệm thu: **C** — chưa vào sổ

## 1. Nguồn chữ
**Từ điển app:** Đặt cánh tay lên hông sườn, huyệt ở mặt sau vai, từ đầu chỉ nếp nách thẳng lên 1 thốn hoặc chỗ lõm ở giao điểm đường dọc từ Kiên Ngung (Đtr 15) xuống và đường ngang qua lằn sau nách, cách tuyến giữa lưng 6 thốn.

**Atlas Focks — vị trí:** Với cánh tay khép lại (vị trí bình thường), trên nếp gấp nách phía sau, cách đầu nếp gấp khoảng 1 thốn, cạnh bờ dưới của cơ delta.

**Atlas Focks — cách xác định:** Khi bệnh nhân ngồi thẳng, sờ nắn từ đầu của nếp gấp nách đi lên cho đến khi có thể cảm nhận được bờ dưới của cơ delta. Nếu nghi ngờ, hãy để cơ căng. Huyệt Kiên trinh (Dü/SP 9) nằm ở bờ dưới cơ.

**WHO 2008:** (chưa thu thập — agent thư lại điền)

## 2. Ảnh atlas — BẰNG CHỨNG MẠNH NHẤT, phải ĐO chứ đừng chỉ tả
- /Users/truongtrang/Desktop/kinhlacc-atlas-hinh/SI9_p129_0.jpeg

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
1. `node do-anh-atlas.cjs SI9 --luoi` → toạ độ pixel của mọi chấm huyệt trên trang (chấm ĐỎ =
   huyệt của trang này, chấm ĐEN = các huyệt vẽ kèm).
2. Mở ảnh bằng công cụ Read, gán nhãn cho từng toạ độ pixel (máy tách được chấm nhưng không đọc được chữ).
3. Chọn HAI huyệt làm mốc mà bản vẽ có và mesh cũng có, chiếu huyệt đang xét lên đoạn nối chúng:
   `t = ((X−A)·(B−A)) / |B−A|²` tính trên pixel.
4. `node doi-chieu-ti-le.cjs SI9 <A> <B> --anh <t vừa tính>` → in ngay chênh lệch quy ra cm.
Đây là phép kiểm ĐỘC LẬP với cốt độ và với mốc xương, tức độc lập với chính engine đã dựng toạ độ.

## 3. Toạ độ engine đang dựng
x=0.1227 y=0.7409 z=-0.0494  →  ngang 21.09cm · cao 127.36cm · trước-sau -8.49cm · conf=cao

## 4. Khung đường kinh
Đoạn **vai** — vùng: vùng bả vai. Ranh mô: quanh hố dưới gai và bờ trong xương bả vai
Các huyệt trong đoạn: SI8 → SI9 → SI10 → SI11 → SI12 → SI13 → SI14

## 6. Hàng xóm cùng kinh (khoảng cách ĐO so với SÁCH ĐÒI)
- **SI8** Tiểu Hải: đo thẳng 13.96cm, đo trên da 13.7cm
  > Co khuỷu tay, huyệt ở giữa mỏm khuỷu và mỏm trên ròng rọc đầu dưới xương cánh tay, nơi tận cơ 3 đầu cánh tay.
- **SI10** Nhu Du: đo thẳng 11.24cm, đo trên da 13.4cm
  > Huyệt ở phía sau lưng, chỗ lõm nơi đầu xương giáp vai hoặc là nơi gặp nhau của đường nếp nách sau kéo dài và chỗ lõm dưới sống vai.

## 7. Huyệt lân cận khác kinh (bán kính 4cm) — dùng để bắt CHẬP HUYỆT và sai vùng
- TE12 Tiêu Lạc — 2.66cm

## 8. Cấu trúc giải phẫu gần nhất trên mesh atlas
- Đầu ngoài của cơ tam đầu cánh tay trái (muscle) — 1.42cm
- Đầu dài của cơ tam đầu cánh tay trái (muscle) — 2.34cm
- Phần gai vai của cơ delta trái (muscle) — 3.49cm
- Xương cánh tay trái (bone) — 5cm
- Đầu trong của cơ tam đầu cánh tay trái (muscle) — 5.05cm

## 9. Cờ mà các bộ kiểm máy đã bắn
- RẢI DỌC ĐƯỜNG dời 17.6cm (conf=cao)
- XA ĐƯỜNG KINH 7.15cm
- AUDIT cờ soát: RẢI DỌC ĐƯỜNG: dời 17.6cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt
- TỪ ĐIỂN APP kêu: dọc "LI15" đòi 1 thốn, đo được 3.85  (lệch 9.74cm, SAI CHIỀU)

## 10. Đã ghi CÒN NGỜ trong sổ
Loại: duong
RẢI DỌC ĐƯỜNG: dời 17.6cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt
