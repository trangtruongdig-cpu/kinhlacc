# HỒ SƠ HUYỆT SI7 — Chi Chính (Focks: CHI CHÍNH)

Kinh SI (Tiểu Trường), huyệt thứ 7. Hạng nghiệm thu: **C** — chưa vào sổ

## 1. Nguồn chữ
**Từ điển app:** Tại sát bờ sau xương trụ, cách cổ tay 5 thốn, trên đường nối huyệt Dương Cốc và huyệt Tiểu Hải.

**Atlas Focks — vị trí:** Ở mặt ngoài cẳng tay, cách đường cổ tay 5 thốn trên đường nối huyệt Dương cốc (Dü/SI 5) khe khớp cổ tay trong, với huyệt Tiểu hải (Dü/SI 8) (lõm ở mỏm khuỷu và lồi cầu trong) hoặc cách điểm giữa đường này 1 thốn.

**Atlas Focks — cách xác định:** Bắt đầu từ điểm giữa đường nối huyệt Dương cốc (Dü/SI 5) (khe khớp cổ tay trong) và huyệt Tiểu hải (Dü/SI 8) (lõm ở mỏm khuỷu và lồi cầu trong), đo 1 thốn về pía cổ tay và xác định vị trí huyệt Chi chính (Dü/SI 7) tại đây. Huyệt có thể sờ thấy được giữa bờ xương trụ và cơ gấp cổ tay trụ hơi về phía bụng tay.

**WHO 2008:** (chưa thu thập — agent thư lại điền)

## 2. Ảnh atlas — BẰNG CHỨNG MẠNH NHẤT, phải ĐO chứ đừng chỉ tả
- /Users/truongtrang/Desktop/kinhlacc-atlas-hinh/SI7_p127_0.jpeg

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
1. `node do-anh-atlas.cjs SI7 --luoi` → toạ độ pixel của mọi chấm huyệt trên trang (chấm ĐỎ =
   huyệt của trang này, chấm ĐEN = các huyệt vẽ kèm).
2. Mở ảnh bằng công cụ Read, gán nhãn cho từng toạ độ pixel (máy tách được chấm nhưng không đọc được chữ).
3. Chọn HAI huyệt làm mốc mà bản vẽ có và mesh cũng có, chiếu huyệt đang xét lên đoạn nối chúng:
   `t = ((X−A)·(B−A)) / |B−A|²` tính trên pixel.
4. `node doi-chieu-ti-le.cjs SI7 <A> <B> --anh <t vừa tính>` → in ngay chênh lệch quy ra cm.
Đây là phép kiểm ĐỘC LẬP với cốt độ và với mốc xương, tức độc lập với chính engine đã dựng toạ độ.

## 3. Toạ độ engine đang dựng
x=0.1206 y=0.5642 z=-0.0053  →  ngang 20.73cm · cao 96.99cm · trước-sau -0.91cm · conf=khe

## 4. Khung đường kinh
Đoạn **cang-tay** — vùng: mặt sau-trong cẳng tay. Ranh mô: sát bờ sau xương trụ
Các huyệt trong đoạn: SI5 → SI6 → SI7 → SI8

## 5. Cốt độ
Đoạn SI/cang-tay: **12 thốn** từ SI5 (WRIST) đến SI8 (CUBITAL).
1 thốn tại chỗ ≈ **2.01cm** (đo dọc trục chi giữa hai mốc xương).
Huyệt này ở mốc **5 thốn**.
Cả đoạn: SI6=1, SI7=5

## 6. Hàng xóm cùng kinh (khoảng cách ĐO so với SÁCH ĐÒI)
- **SI6** Dưỡng Lão: đo thẳng 8.05cm, đo trên da 9.4cm — **sách đòi 4 thốn ≈ 8.04cm** → LỆCH 1.36cm
  > Co khuỷu tay với lòng bàn tay đặt vào ngực, huyệt ở chỗ mỏm trâm xương trụ, từ huyệt Dương Cốc (Ttr 5) đo lên 1 thốn.
- **SI8** Tiểu Hải: đo thẳng 18cm, đo trên da 19.7cm — **sách đòi 7 thốn ≈ 14.07cm** → LỆCH 5.63cm
  > Co khuỷu tay, huyệt ở giữa mỏm khuỷu và mỏm trên ròng rọc đầu dưới xương cánh tay, nơi tận cơ 3 đầu cánh tay.

## 7. Huyệt lân cận khác kinh (bán kính 4cm) — dùng để bắt CHẬP HUYỆT và sai vùng
- PC4 Khích Môn — 3.34cm

## 8. Cấu trúc giải phẫu gần nhất trên mesh atlas
- Đầu trụ của cơ gấp cổ tay trụ trái (muscle) — 0.56cm
- Đầu cánh tay của cơ gấp cổ tay trụ trái (muscle) — 0.56cm
- Xương trụ trái (bone) — 1.46cm
- Cơ gấp các ngón sâu trái (muscle) — 1.51cm
- Cơ duỗi cổ tay trụ trái (muscle) — 1.53cm

## 9. Cờ mà các bộ kiểm máy đã bắn
- RẢI DỌC ĐƯỜNG dời 6.4cm (conf=khe)
- XA ĐƯỜNG KINH 6.38cm
- AUDIT cờ soát: RẢI DỌC ĐƯỜNG: dời 6.4cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt
- TỪ ĐIỂN APP kêu: dọc "WRIST" đòi 5 thốn, đo được 5  (lệch 0.01cm)
- ATLAS FOCKS kêu: dọc "WRIST" đòi 1 thốn, đo được 5  (lệch 8.03cm)

## 10. Đã ghi CÒN NGỜ trong sổ
Loại: duong
RẢI DỌC ĐƯỜNG: dời 6.4cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt
