# HỒ SƠ HUYỆT HT2 — Thanh Linh (Focks: THANH LINH)

Kinh HT (Tâm), huyệt thứ 2. Hạng nghiệm thu: **C** — chưa vào sổ

## 1. Nguồn chữ
**Từ điển app:** Ở phía trên đầu nếp gấp khuỷu tay 3 thốn, ở rãnh giữa cơ nhị đầu cánh tay, cơ cánh tay trước.

**Atlas Focks — vị trí:** Trên nếp gấp khuỷu tay 3 thốn, ở bờ trong của cơ hai đầu cánh tay.

**Atlas Focks — cách xác định:** Khuỷu tay gấp lại, sờ từ đầu nếp gấp khuỷu tay huyệt Thiếu hải (He 3) lên 3 thốn về phía nách. Huyệt Thanh linh (He 2) nằm trong rãnh phía trước bờ trong của cơ hai đầu cánh tay. Để dễ thấy hơn, hãy căng cơ bắp tay.

**WHO 2008:** (chưa thu thập — agent thư lại điền)

## 2. Ảnh atlas — BẰNG CHỨNG MẠNH NHẤT, phải ĐO chứ đừng chỉ tả
- /Users/truongtrang/Desktop/kinhlacc-atlas-hinh/HT2_p110_0.jpeg

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
1. `node do-anh-atlas.cjs HT2 --luoi` → toạ độ pixel của mọi chấm huyệt trên trang (chấm ĐỎ =
   huyệt của trang này, chấm ĐEN = các huyệt vẽ kèm).
2. Mở ảnh bằng công cụ Read, gán nhãn cho từng toạ độ pixel (máy tách được chấm nhưng không đọc được chữ).
3. Chọn HAI huyệt làm mốc mà bản vẽ có và mesh cũng có, chiếu huyệt đang xét lên đoạn nối chúng:
   `t = ((X−A)·(B−A)) / |B−A|²` tính trên pixel.
4. `node doi-chieu-ti-le.cjs HT2 <A> <B> --anh <t vừa tính>` → in ngay chênh lệch quy ra cm.
Đây là phép kiểm ĐỘC LẬP với cốt độ và với mốc xương, tức độc lập với chính engine đã dựng toạ độ.

## 3. Toạ độ engine đang dựng
x=0.0936 y=0.7123 z=-0.0035  →  ngang 16.09cm · cao 122.44cm · trước-sau -0.6cm · conf=khoá

## 4. Khung đường kinh
Đoạn **canh-tay** — vùng: mặt trong cánh tay. Ranh mô: rãnh bờ trong cơ nhị đầu, cạnh động mạch cánh tay
Các huyệt trong đoạn: HT1 → HT2 → HT3

## 5. Cốt độ
Đoạn HT/canh-tay: **6.8 thốn** từ HT3 (undefined) đến HT1 (undefined).
1 thốn tại chỗ ≈ **?cm** (đo dọc trục chi giữa hai mốc xương).
Huyệt này ở mốc **3 thốn**.
Cả đoạn: HT2=3

## 6. Hàng xóm cùng kinh (khoảng cách ĐO so với SÁCH ĐÒI)
- **HT1** Cực Tuyền: đo thẳng 12.89cm, đo trên da 12.1cm — **sách đòi 3.8 thốn**
  > Chỗ lõm ở giữa hố nách, khe giữa động mạch nách, sau gân cơ nhị đầu và gân cơ quạ cánh tay.
- **HT3** Thiếu Hải: đo thẳng 10.39cm, đo trên da 12.5cm
  > Co tay lại, huyệt nằm ở cuối đầu nếp gấp khuỷu tay, mặt trong cánh tay, cách mỏm trên lồi cầu trong 0,5 thốn.

## 7. Huyệt lân cận khác kinh (bán kính 4cm) — dùng để bắt CHẬP HUYỆT và sai vùng
- GB23 Triếp Cân — 2.86cm
- SP21 Đại Bao — 3.08cm

## 8. Cấu trúc giải phẫu gần nhất trên mesh atlas
- Đầu ngắn của cơ nhị đầu cánh tay trái (muscle) — 0.83cm
- Cơ răng trước trái (muscle) — 1.87cm
- Cơ cánh tay trái (muscle) — 2.52cm
- Cơ chéo bụng ngoài trái (muscle) — 2.54cm
- Cơ gian sườn ngoài (muscle) — 2.61cm

## 9. Cờ mà các bộ kiểm máy đã bắn
- RẢI DỌC ĐƯỜNG dời 7.77cm (conf=khoá)
- XA ĐƯỜNG KINH 7.76cm
- ÉP LÊN DA dời 3.2cm
- AUDIT cờ soát: TẦNG DA: ép lên da, dời 3.2cm · RẢI DỌC ĐƯỜNG: dời 7.77cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt
- TỪ ĐIỂN APP kêu: dọc "CUBITAL" đòi 3 thốn, đo được 3.64  (lệch 2.19cm)
- ATLAS FOCKS kêu: dọc "CUBITAL" đòi 3 thốn, đo được 3.64  (lệch 2.19cm)

## 10. Đã ghi CÒN NGỜ trong sổ
Loại: da, duong
TẦNG DA: ép lên da, dời 3.2cm · RẢI DỌC ĐƯỜNG: dời 7.77cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt
