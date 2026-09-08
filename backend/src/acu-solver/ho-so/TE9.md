# HỒ SƠ HUYỆT TE9 — Tứ Độc (Focks: TỨ ĐỘC)

Kinh TE (Tam Tiêu), huyệt thứ 9. Hạng nghiệm thu: **A** — Hiệu chỉnh lần 2: thốn đo dọc TRỤC WRIST-CUBITAL kể cả sau khi ép ra da mặt mu (trục nghiêng 4,97cm/24,10cm nên không bù thì hình chiếu dư 0,6 thốn). Chiếu lên trục ra đúng 2/3/3/4/7 thốn, nhất quán với 11 huyệt cẳng tay của 5 kinh kia

## 1. Nguồn chữ
**Từ điển app:** Ở mặt sau cẳng tay, dưới khớp khuỷu 5 thốn, giữa khe xương trụ và xương quay.

**Atlas Focks — vị trí:** Cách nếp gấp cổ tay 7 thốn, giữa xương quay và xương trụ.

**Atlas Focks — cách xác định:** Sau lưng cẳng tay, đo từ khe khớp cổ tay lên 7 thốn, hoặc từ mỏm lồi cầu ngoài của xương cánh tay xuống 5 thốn và xác định vị trí huyệt Tứ độc (SJ/TB 9) ở chỗ lõm giữa cơ duỗi các ngón và cơ duỗi cổ tay trụ. Đường giữa mặt lưng giữa của cổ tay và mỏm lồi cầu ngoài của xương cánh tay đóng vai trò định hướng. Hoặc: Bắt đầu từ điểm giữa giữa nếp gấp khuỷu tay và khe khớp cổ tay (khoảng cách = 12 cun), đo về phía khuỷu 1 thốn và xác định huyệt Tứ độc (SJ/TB 9) ở giữa xương quay và xương trụ.

**WHO 2008:** (chưa thu thập — agent thư lại điền)

## 2. Ảnh atlas — BẰNG CHỨNG MẠNH NHẤT, phải ĐO chứ đừng chỉ tả
- /Users/truongtrang/Desktop/kinhlacc-atlas-hinh/TE9_p255_0.jpeg

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
1. `node do-anh-atlas.cjs TE9 --luoi` → toạ độ pixel của mọi chấm huyệt trên trang (chấm ĐỎ =
   huyệt của trang này, chấm ĐEN = các huyệt vẽ kèm).
2. Mở ảnh bằng công cụ Read, gán nhãn cho từng toạ độ pixel (máy tách được chấm nhưng không đọc được chữ).
3. Chọn HAI huyệt làm mốc mà bản vẽ có và mesh cũng có, chiếu huyệt đang xét lên đoạn nối chúng:
   `t = ((X−A)·(B−A)) / |B−A|²` tính trên pixel.
4. `node doi-chieu-ti-le.cjs TE9 <A> <B> --anh <t vừa tính>` → in ngay chênh lệch quy ra cm.
Đây là phép kiểm ĐỘC LẬP với cốt độ và với mốc xương, tức độc lập với chính engine đã dựng toạ độ.

## 3. Toạ độ engine đang dựng
x=0.138 y=0.5857 z=-0.0332  →  ngang 23.72cm · cao 100.68cm · trước-sau -5.71cm · conf=mốc

## 4. Khung đường kinh
Đoạn **cang-tay** — vùng: giữa mặt sau cẳng tay. Ranh mô: khe gian cốt giữa xương quay và xương trụ, mặt mu
Các huyệt trong đoạn: TE4 → TE5 → TE6 → TE7 → TE8 → TE9 → TE10

## 5. Cốt độ
Đoạn TE/cang-tay: **12 thốn** từ TE4 (WRIST) đến TE10 (CUBITAL).
1 thốn tại chỗ ≈ **2.01cm** (đo dọc trục chi giữa hai mốc xương).
Huyệt này ở mốc **7 thốn**.
Cả đoạn: TE5=2, TE6=3, TE7=3, TE8=4, TE9=7

## 6. Hàng xóm cùng kinh (khoảng cách ĐO so với SÁCH ĐÒI)
- **TE8** Tam Dương Lạc: đo thẳng 6.15cm, đo trên da 14.8cm — **sách đòi 3 thốn ≈ 6.03cm** → LỆCH 8.77cm
  > Trên lằn cổ tay 4 thốn, khe giữa xương quay và trụ, ở mặt sau cẳng tay.
- **TE10** Thiên Tỉnh: đo thẳng 14.1cm, đo trên da 14.7cm — **sách đòi 5 thốn ≈ 10.05cm** → LỆCH 4.65cm
  > Chỗ lõm trên đầu mỏm khuỷu xương trụ, trên khớp khuỷu một thốn, nơi gân cơ tam đầu cánh tay.

## 7. Huyệt lân cận khác kinh (bán kính 4cm) — dùng để bắt CHẬP HUYỆT và sai vùng
- (không có)

## 8. Cấu trúc giải phẫu gần nhất trên mesh atlas
- Cơ duỗi các ngón trái (muscle) — 1.86cm
- Cơ duỗi cổ tay trụ trái (muscle) — 2.31cm
- Cơ duỗi ngón út trái (muscle) — 2.46cm
- Cơ duỗi cổ tay quay ngắn trái (muscle) — 2.78cm
- Cơ dạng ngón cái dài trái (muscle) — 3.15cm

## 9. Cờ mà các bộ kiểm máy đã bắn
- XA ĐƯỜNG KINH 0cm
- TỪ ĐIỂN APP kêu: dọc "CUBITAL" đòi 5 thốn, đo được 5  (lệch 0cm)
- ATLAS FOCKS kêu: dọc "WRIST" đòi 7 thốn, đo được 7  (lệch 0cm)
