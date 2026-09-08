# HỒ SƠ HUYỆT TE8 — Tam Dương Lạc (Focks: TAM DƯƠNG LẠC)

Kinh TE (Tam Tiêu), huyệt thứ 8. Hạng nghiệm thu: **A** — Hiệu chỉnh lần 2: thốn đo dọc TRỤC WRIST-CUBITAL kể cả sau khi ép ra da mặt mu (trục nghiêng 4,97cm/24,10cm nên không bù thì hình chiếu dư 0,6 thốn). Chiếu lên trục ra đúng 2/3/3/4/7 thốn, nhất quán với 11 huyệt cẳng tay của 5 kinh kia

## 1. Nguồn chữ
**Từ điển app:** Trên lằn cổ tay 4 thốn, khe giữa xương quay và trụ, ở mặt sau cẳng tay.

**Atlas Focks — vị trí:** Mặt lưng cẳng tay, cách khe khớp cổ tay 4 thốn (“nếp gấp cổ tay”) giữa xương quay và xương trụ, trên cơ duỗi các ngón.

**Atlas Focks — cách xác định:** Khe khớp cổ tay có thể được sờ thấy dễ dàng bằng cử động thả lỏng của bàn tay. Đo lên khoảng 4 thốn tính từ tâm khe khớp. Ở đây, xác định vị trí huyệt Tam dương lạc (SJ/TB 8) giữa xương quay và xương trụ và lệch về phía quay trên cơ duỗi các ngón. Hoặc: Chia khoảng cách giữa nếp gấp khuỷu tay và khoảng cách cổ tay (khoảng cách = 12 cun) thành 3 phần và xác định vị trí huyệt Tam dương lạc (SJ/TB 8) giữa xương quay và xương trụ ở khoảng cách 1/3 từ cổ tay lên.

**WHO 2008:** (chưa thu thập — agent thư lại điền)

## 2. Ảnh atlas — BẰNG CHỨNG MẠNH NHẤT, phải ĐO chứ đừng chỉ tả
- /Users/truongtrang/Desktop/kinhlacc-atlas-hinh/TE8_p254_0.jpeg

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
1. `node do-anh-atlas.cjs TE8 --luoi` → toạ độ pixel của mọi chấm huyệt trên trang (chấm ĐỎ =
   huyệt của trang này, chấm ĐEN = các huyệt vẽ kèm).
2. Mở ảnh bằng công cụ Read, gán nhãn cho từng toạ độ pixel (máy tách được chấm nhưng không đọc được chữ).
3. Chọn HAI huyệt làm mốc mà bản vẽ có và mesh cũng có, chiếu huyệt đang xét lên đoạn nối chúng:
   `t = ((X−A)·(B−A)) / |B−A|²` tính trên pixel.
4. `node doi-chieu-ti-le.cjs TE8 <A> <B> --anh <t vừa tính>` → in ngay chênh lệch quy ra cm.
Đây là phép kiểm ĐỘC LẬP với cốt độ và với mốc xương, tức độc lập với chính engine đã dựng toạ độ.

## 3. Toạ độ engine đang dựng
x=0.1403 y=0.5525 z=-0.02  →  ngang 24.12cm · cao 94.97cm · trước-sau -3.44cm · conf=mốc

## 4. Khung đường kinh
Đoạn **cang-tay** — vùng: giữa mặt sau cẳng tay. Ranh mô: khe gian cốt giữa xương quay và xương trụ, mặt mu
Các huyệt trong đoạn: TE4 → TE5 → TE6 → TE7 → TE8 → TE9 → TE10

## 5. Cốt độ
Đoạn TE/cang-tay: **12 thốn** từ TE4 (WRIST) đến TE10 (CUBITAL).
1 thốn tại chỗ ≈ **2.01cm** (đo dọc trục chi giữa hai mốc xương).
Huyệt này ở mốc **4 thốn**.
Cả đoạn: TE5=2, TE6=3, TE7=3, TE8=4, TE9=7

## 6. Hàng xóm cùng kinh (khoảng cách ĐO so với SÁCH ĐÒI)
- **TE7** Hội Tông: đo thẳng 2.37cm, đo trên da 3.1cm — **sách đòi 1 thốn ≈ 2.01cm** → LỆCH 1.09cm
  > Mặt sau cẳng tay, trên lằn cổ tay 3 thốn, ngang huyệt Chi Câu (Ttu 6), cách 1 thốn, về phía sát bờ ngoài xương trụ.
- **TE9** Tứ Độc: đo thẳng 6.15cm, đo trên da 14.8cm — **sách đòi 3 thốn ≈ 6.03cm** → LỆCH 8.77cm
  > Ở mặt sau cẳng tay, dưới khớp khuỷu 5 thốn, giữa khe xương trụ và xương quay.

## 7. Huyệt lân cận khác kinh (bán kính 4cm) — dùng để bắt CHẬP HUYỆT và sai vùng
- TE6 Chi Câu — 2.09cm
- TE7 Hội Tông — 2.37cm
- LI6 Thiên Lịch — 3.3cm
- LI7 Ôn Lưu — 3.66cm

## 8. Cấu trúc giải phẫu gần nhất trên mesh atlas
- Cơ duỗi các ngón trái (muscle) — 1.63cm
- Cơ duỗi ngón út trái (muscle) — 1.79cm
- Cơ dạng ngón cái dài trái (muscle) — 1.98cm
- Cơ duỗi cổ tay trụ trái (muscle) — 2.06cm
- Cơ duỗi ngón cái dài trái (muscle) — 2.38cm

## 9. Cờ mà các bộ kiểm máy đã bắn
- XA ĐƯỜNG KINH 0cm
- TỪ ĐIỂN APP kêu: dọc "WRIST" đòi 4 thốn, đo được 4  (lệch 0.01cm)
- ATLAS FOCKS kêu: dọc "WRIST" đòi 4 thốn, đo được 4  (lệch 0.01cm)
