# HỒ SƠ HUYỆT HT4 — Linh Đạo (Focks: LINH ĐẠO)

Kinh HT (Tâm), huyệt thứ 4. Hạng nghiệm thu: **C** — chưa vào sổ

## 1. Nguồn chữ
**Từ điển app:** Ở mặt trước trong cẳng tay, trên nếp gấp cổ tay 1,5 thốn.

**Atlas Focks — vị trí:** Từ khe khớp cổ tay ("nếp gấp cổ tay xa") lên 1,5 thốn, bờ gân cơ gấp cổ tay trụ.

**Atlas Focks — cách xác định:** Cẳng tay để ngửa ở tư thế thoải mái. Gân của cơ gấp cổ tay trụ có thể dễ dàng cảm nhận được ở bụng cẳng tay phía xương trụ và gần với nếp gấp cổ tay; điểm bám của nó nằm trên xương đậu. Huyệt Linh đạo (He 4) nằm cách khe khớp cổ tay (huyệt Thần môn (He 7) khoảng 1,5 thốn. Các huyệt Thông lý (He 5), Âm khích (He 6) và Thần môn (He 7) xếp thành một hàng về phía cổ tay, mỗi cái cách nhau 0,5 thốn. Huyệt Liệt khuyết (Lu 7) cách khe khớp cổ tay khoảng 1,5 thốn ở bụng cẳng tay phía xương quay.

**WHO 2008:** (chưa thu thập — agent thư lại điền)

## 2. Ảnh atlas — BẰNG CHỨNG MẠNH NHẤT, phải ĐO chứ đừng chỉ tả
- /Users/truongtrang/Desktop/kinhlacc-atlas-hinh/HT4_p112_0.jpeg

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
1. `node do-anh-atlas.cjs HT4 --luoi` → toạ độ pixel của mọi chấm huyệt trên trang (chấm ĐỎ =
   huyệt của trang này, chấm ĐEN = các huyệt vẽ kèm).
2. Mở ảnh bằng công cụ Read, gán nhãn cho từng toạ độ pixel (máy tách được chấm nhưng không đọc được chữ).
3. Chọn HAI huyệt làm mốc mà bản vẽ có và mesh cũng có, chiếu huyệt đang xét lên đoạn nối chúng:
   `t = ((X−A)·(B−A)) / |B−A|²` tính trên pixel.
4. `node doi-chieu-ti-le.cjs HT4 <A> <B> --anh <t vừa tính>` → in ngay chênh lệch quy ra cm.
Đây là phép kiểm ĐỘC LẬP với cốt độ và với mốc xương, tức độc lập với chính engine đã dựng toạ độ.

## 3. Toạ độ engine đang dựng
x=0.1368 y=0.5292 z=0.0158  →  ngang 23.52cm · cao 90.97cm · trước-sau 2.72cm · conf=cao

## 4. Khung đường kinh
Đoạn **cang-tay** — vùng: bờ trong mặt trước cẳng tay. Ranh mô: bờ trong gân cơ gấp cổ tay trụ, sát bờ trước xương trụ
Các huyệt trong đoạn: HT3 → HT4 → HT5 → HT6 → HT7

## 5. Cốt độ
Đoạn HT/cang-tay: **12 thốn** từ HT7 (WRIST) đến HT3 (CUBITAL).
1 thốn tại chỗ ≈ **2.01cm** (đo dọc trục chi giữa hai mốc xương).
Huyệt này ở mốc **1.5 thốn**.
Cả đoạn: HT4=1.5, HT5=1, HT6=0.5

## 6. Hàng xóm cùng kinh (khoảng cách ĐO so với SÁCH ĐÒI)
- **HT3** Thiếu Hải: đo thẳng 22.24cm, đo trên da 23.8cm — **sách đòi 10.5 thốn ≈ 21.1cm** → LỆCH 2.70cm
  > Co tay lại, huyệt nằm ở cuối đầu nếp gấp khuỷu tay, mặt trong cánh tay, cách mỏm trên lồi cầu trong 0,5 thốn.
- **HT5** Thông Lý: đo thẳng 1.01cm, đo trên da 1.8cm — **sách đòi 0.5 thốn ≈ 1cm** → LỆCH 0.80cm
  > Mặt trước trong cẳng tay, trên nếp gấp cổ tay 1 thốn (huyệt Thần Môn – Tm.7), khe giữa gân cơ trụ trước và cơ gấp chung nông các ngón tay.

## 7. Huyệt lân cận khác kinh (bán kính 4cm) — dùng để bắt CHẬP HUYỆT và sai vùng
- HT5 Thông Lý — 1.01cm
- PC6 Nội Quan — 1.6cm
- LU7 Liệt Khuyết — 2cm
- HT6 Âm Khích — 2.02cm
- HT7 Thần Môn — 2.74cm
- SI6 Dưỡng Lão — 2.74cm
- LU8 Kinh Cừ — 2.77cm
- PC5 Gian Sử — 3.14cm
- SI5 Dương Cốc — 3.3cm

## 8. Cấu trúc giải phẫu gần nhất trên mesh atlas
- Cơ gấp các ngón nông trái (muscle) — 0.33cm
- Cơ gấp các ngón sâu trái (muscle) — 0.55cm
- Cơ sấp vuông trái (muscle) — 0.65cm
- Cơ gan tay dài trái (muscle) — 0.7cm
- Đầu cánh tay của cơ gấp cổ tay trụ trái (muscle) — 0.85cm

## 9. Cờ mà các bộ kiểm máy đã bắn
- RẢI DỌC ĐƯỜNG dời 4.09cm (conf=cao)
- XA ĐƯỜNG KINH 4.08cm
- AUDIT cờ soát: RẢI DỌC ĐƯỜNG: dời 4.09cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt
- TỪ ĐIỂN APP kêu: dọc "WRIST" đòi 1.5 thốn, đo được 1.5  (lệch 0cm)
- ATLAS FOCKS kêu: dọc "WRIST" đòi 1.5 thốn, đo được 1.5  (lệch 0cm)

## 10. Đã ghi CÒN NGỜ trong sổ
Loại: duong
RẢI DỌC ĐƯỜNG: dời 4.09cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt
