# HỒ SƠ HUYỆT TE6 — Chi Câu (Focks: CHI CÂU)

Kinh TE (Tam Tiêu), huyệt thứ 6. Hạng nghiệm thu: **A** — Hiệu chỉnh lần 2: thốn đo dọc TRỤC WRIST-CUBITAL kể cả sau khi ép ra da mặt mu (trục nghiêng 4,97cm/24,10cm nên không bù thì hình chiếu dư 0,6 thốn). Chiếu lên trục ra đúng 2/3/3/4/7 thốn, nhất quán với 11 huyệt cẳng tay của 5 kinh kia

## 1. Nguồn chữ
**Từ điển app:** Trên lằn cổ tay 3 thốn, giữa khe xương trụ và xương quay, trên huyệt Ngoại Quan (Ttu.5) 1 thốn.

**Atlas Focks — vị trí:** Trên lưng cẳng tay, cách nếp gấp cổ tay 3 thốn, trong chỗ lõm giữa xương quay và xương trụ, nằm phía quay của cơ duỗi các ngón.

**Atlas Focks — cách xác định:** Khe khớp cổ tay có thể được sờ thấy rõ ràng bằng cử động thả lỏng của bàn tay. Đo lên khoảng 3 thốn tính từ tâm khe khớp. Cơ duỗi các ngón thường chạy ở đây ở giữa xương quay và xương trụ. Xác định vị trí huyệt Chi câu (SJ/TB 6) ở chỗ lõm gần mép của xương quay và phía quay của cơ duỗi các ngón. Huyệt Hội tông (SJ/TB 7) nằm ngang mức ở chỗ lõm giữa xương trụ và cơ duỗi các ngón. Huyệt Gian sử (Pe/Pc 5) nằm gần như đối diện ở phía bụng của cẳng tay.

**WHO 2008:** (chưa thu thập — agent thư lại điền)

## 2. Ảnh atlas — BẰNG CHỨNG MẠNH NHẤT, phải ĐO chứ đừng chỉ tả
- /Users/truongtrang/Desktop/kinhlacc-atlas-hinh/TE6_p252_0.jpeg

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
1. `node do-anh-atlas.cjs TE6 --luoi` → toạ độ pixel của mọi chấm huyệt trên trang (chấm ĐỎ =
   huyệt của trang này, chấm ĐEN = các huyệt vẽ kèm).
2. Mở ảnh bằng công cụ Read, gán nhãn cho từng toạ độ pixel (máy tách được chấm nhưng không đọc được chữ).
3. Chọn HAI huyệt làm mốc mà bản vẽ có và mesh cũng có, chiếu huyệt đang xét lên đoạn nối chúng:
   `t = ((X−A)·(B−A)) / |B−A|²` tính trên pixel.
4. `node doi-chieu-ti-le.cjs TE6 <A> <B> --anh <t vừa tính>` → in ngay chênh lệch quy ra cm.
Đây là phép kiểm ĐỘC LẬP với cốt độ và với mốc xương, tức độc lập với chính engine đã dựng toạ độ.

## 3. Toạ độ engine đang dựng
x=0.141 y=0.5416 z=-0.0146  →  ngang 24.24cm · cao 93.1cm · trước-sau -2.51cm · conf=mốc

## 4. Khung đường kinh
Đoạn **cang-tay** — vùng: giữa mặt sau cẳng tay. Ranh mô: khe gian cốt giữa xương quay và xương trụ, mặt mu
Các huyệt trong đoạn: TE4 → TE5 → TE6 → TE7 → TE8 → TE9 → TE10

## 5. Cốt độ
Đoạn TE/cang-tay: **12 thốn** từ TE4 (WRIST) đến TE10 (CUBITAL).
1 thốn tại chỗ ≈ **2.01cm** (đo dọc trục chi giữa hai mốc xương).
Huyệt này ở mốc **3 thốn**.
Cả đoạn: TE5=2, TE6=3, TE7=3, TE8=4, TE9=7

## 6. Hàng xóm cùng kinh (khoảng cách ĐO so với SÁCH ĐÒI)
- **TE5** Ngoại Quan: đo thẳng 2cm, đo trên da 0.8cm — **sách đòi 1 thốn ≈ 2.01cm** → LỆCH -1.21cm
  > Trên lằn chỉ cổ tay 2 thốn, giữa xương quay và xương trụ, ở mặt giữa sau cánh tay.
- **TE7** Hội Tông: đo thẳng 0.91cm, đo trên da 1.1cm — **sách đòi 0 thốn**
  > Mặt sau cẳng tay, trên lằn cổ tay 3 thốn, ngang huyệt Chi Câu (Ttu 6), cách 1 thốn, về phía sát bờ ngoài xương trụ.

## 7. Huyệt lân cận khác kinh (bán kính 4cm) — dùng để bắt CHẬP HUYỆT và sai vùng
- TE7 Hội Tông — 0.91cm
- TE5 Ngoại Quan — 2cm
- TE8 Tam Dương Lạc — 2.09cm
- LI6 Thiên Lịch — 2.54cm

## 8. Cấu trúc giải phẫu gần nhất trên mesh atlas
- Cơ duỗi ngón út trái (muscle) — 1.29cm
- Cơ duỗi các ngón trái (muscle) — 1.71cm
- Cơ duỗi cổ tay trụ trái (muscle) — 1.73cm
- Cơ dạng ngón cái dài trái (muscle) — 1.9cm
- Cơ duỗi ngón cái dài trái (muscle) — 1.93cm

## 9. Cờ mà các bộ kiểm máy đã bắn
- XA ĐƯỜNG KINH 0cm
- TỪ ĐIỂN APP kêu: dọc "WRIST" đòi 3 thốn, đo được 3  (lệch 0cm)
- ATLAS FOCKS kêu: dọc "WRIST" đòi 3 thốn, đo được 3  (lệch 0cm)
