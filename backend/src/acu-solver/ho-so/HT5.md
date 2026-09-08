# HỒ SƠ HUYỆT HT5 — Thông Lý (Focks: THÔNG LÝ)

Kinh HT (Tâm), huyệt thứ 5. Hạng nghiệm thu: **C** — chưa vào sổ

## 1. Nguồn chữ
**Từ điển app:** Mặt trước trong cẳng tay, trên nếp gấp cổ tay 1 thốn (huyệt Thần Môn – Tm.7), khe giữa gân cơ trụ trước và cơ gấp chung nông các ngón tay.

**Atlas Focks — vị trí:** Cách khe khớp cổ tay 1 thốn (“nếp gấp cổ tay xa”), bờ gân gấp cổ tay trụ.

**Atlas Focks — cách xác định:** Cẳng tay để ngửa ở tư thế thoải mái. Gân của cơ gấp cổ tay trụ có thể dễ dàng cảm nhận được ở bụng cẳng tay phía xương trụ và gần với nếp gấp cổ tay; điểm bám của nó nằm trên xương đậu. Huyệt Thông lý (He 5) cách khe khớp cổ tay (huyệt Thần môn (He 7) khoảng 1 thốn trên bờ gân gấp cổ tay trụ. Các huyệt Âm khích (He 6) cách huyệt Thần môn (He 7) 0,5 thốn; huyệt Linh đạo (He 4) cách huyệt Thần môn (He 7) 1,5 thốn. Huyệt Kinh cừ (Lu 8) cũng cách khe khớp cổ tay 1 thốn, nhưng ở phía xương quay của cẳng tay.

**WHO 2008:** (chưa thu thập — agent thư lại điền)

## 2. Ảnh atlas — BẰNG CHỨNG MẠNH NHẤT, phải ĐO chứ đừng chỉ tả
- /Users/truongtrang/Desktop/kinhlacc-atlas-hinh/HT5_p113_0.jpeg

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
1. `node do-anh-atlas.cjs HT5 --luoi` → toạ độ pixel của mọi chấm huyệt trên trang (chấm ĐỎ =
   huyệt của trang này, chấm ĐEN = các huyệt vẽ kèm).
2. Mở ảnh bằng công cụ Read, gán nhãn cho từng toạ độ pixel (máy tách được chấm nhưng không đọc được chữ).
3. Chọn HAI huyệt làm mốc mà bản vẽ có và mesh cũng có, chiếu huyệt đang xét lên đoạn nối chúng:
   `t = ((X−A)·(B−A)) / |B−A|²` tính trên pixel.
4. `node doi-chieu-ti-le.cjs HT5 <A> <B> --anh <t vừa tính>` → in ngay chênh lệch quy ra cm.
Đây là phép kiểm ĐỘC LẬP với cốt độ và với mốc xương, tức độc lập với chính engine đã dựng toạ độ.

## 3. Toạ độ engine đang dựng
x=0.1382 y=0.5236 z=0.017  →  ngang 23.76cm · cao 90.01cm · trước-sau 2.92cm · conf=cao

## 4. Khung đường kinh
Đoạn **cang-tay** — vùng: bờ trong mặt trước cẳng tay. Ranh mô: bờ trong gân cơ gấp cổ tay trụ, sát bờ trước xương trụ
Các huyệt trong đoạn: HT3 → HT4 → HT5 → HT6 → HT7

## 5. Cốt độ
Đoạn HT/cang-tay: **12 thốn** từ HT7 (WRIST) đến HT3 (CUBITAL).
1 thốn tại chỗ ≈ **2.01cm** (đo dọc trục chi giữa hai mốc xương).
Huyệt này ở mốc **1 thốn**.
Cả đoạn: HT4=1.5, HT5=1, HT6=0.5

## 6. Hàng xóm cùng kinh (khoảng cách ĐO so với SÁCH ĐÒI)
- **HT4** Linh Đạo: đo thẳng 1.01cm, đo trên da 1.8cm — **sách đòi 0.5 thốn ≈ 1cm** → LỆCH 0.80cm
  > Ở mặt trước trong cẳng tay, trên nếp gấp cổ tay 1,5 thốn.
- **HT6** Âm Khích: đo thẳng 1.03cm, đo trên da 1cm — **sách đòi 0.5 thốn ≈ 1cm** → LỆCH 0.00cm
  > Mặt trước trong cẳng tay, trên nếp gấp cổ tay 0,5 thốn, ở trong khe gân cơ trụ trước và gân cơ gấp chung nông các ngón tay.

## 7. Huyệt lân cận khác kinh (bán kính 4cm) — dùng để bắt CHẬP HUYỆT và sai vùng
- HT4 Linh Đạo — 1.01cm
- HT6 Âm Khích — 1.03cm
- HT7 Thần Môn — 1.77cm
- LU7 Liệt Khuyết — 2.18cm
- PC6 Nội Quan — 2.33cm
- LU8 Kinh Cừ — 2.52cm
- SI6 Dưỡng Lão — 2.57cm
- SI5 Dương Cốc — 2.82cm
- PC7 Đại Lăng — 3.39cm
- TE4 Dương Trì — 3.91cm

## 8. Cấu trúc giải phẫu gần nhất trên mesh atlas
- Cơ gấp các ngón nông trái (muscle) — 0.45cm
- Cơ gấp các ngón sâu trái (muscle) — 0.61cm
- Xương trụ trái (bone) — 0.72cm
- Đầu cánh tay của cơ gấp cổ tay trụ trái (muscle) — 0.75cm
- Cơ sấp vuông trái (muscle) — 0.76cm

## 9. Cờ mà các bộ kiểm máy đã bắn
- RẢI DỌC ĐƯỜNG dời 4.04cm (conf=cao)
- XA ĐƯỜNG KINH 4.02cm
- AUDIT cờ soát: khe cách chỗ cốt độ chỉ ra 3.5 cm (trần 3.1 cm) — giữ nguyên toạ độ cũ, cần soát · RẢI DỌC ĐƯỜNG: dời 4.04cm v
- TỪ ĐIỂN APP kêu: dọc "WRIST" đòi 1 thốn, đo được 1  (lệch 0.01cm)
- ATLAS FOCKS kêu: dọc "WRIST" đòi 1 thốn, đo được 1  (lệch 0.01cm)

## 10. Đã ghi CÒN NGỜ trong sổ
Loại: khe, duong
khe cách chỗ cốt độ chỉ ra 3.5 cm (trần 3.1 cm) — giữ nguyên toạ độ cũ, cần soát · RẢI DỌC ĐƯỜNG: dời 4.04cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt · RẢI DỌC ĐƯỜNG: dời 4.04cm v
