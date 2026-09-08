# HỒ SƠ HUYỆT HT6 — Âm Khích (Focks: ÂM KHÍCH)

Kinh HT (Tâm), huyệt thứ 6. Hạng nghiệm thu: **B** — conf=khe-khoá, src=book+khe+duong

## 1. Nguồn chữ
**Từ điển app:** Mặt trước trong cẳng tay, trên nếp gấp cổ tay 0,5 thốn, ở trong khe gân cơ trụ trước và gân cơ gấp chung nông các ngón tay.

**Atlas Focks — vị trí:** Cách khe khớp cổ tay 0,5 thốn (nếp gấp cổ tay xa), bờ gân gấp cổ tay trụ.

**Atlas Focks — cách xác định:** Cẳng tay để ngửa ở tư thế thoải mái. Gân của cơ gấp cổ tay trụ có thể dễ dàng cảm nhận được ở bụng cẳng tay phía xương trụ và gần với nếp gấp cổ tay; điểm bám của nó nằm trên xương đậu. Huyệt Âm khích (He 6) cách khe khớp cổ tay (huyệt Thần môn (He 7) khoảng 0,5 thốn trên bờ gân gấp cổ tay trụ. Huyệt Thông lý (He 5) và huyệt Linh đạo (He 4) nằm trên cùng một đường thẳng, cách nhau 0,5 cun.

**WHO 2008:** (chưa thu thập — agent thư lại điền)

## 2. Ảnh atlas — BẰNG CHỨNG MẠNH NHẤT, phải ĐO chứ đừng chỉ tả
- /Users/truongtrang/Desktop/kinhlacc-atlas-hinh/HT6_p114_0.jpeg

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
1. `node do-anh-atlas.cjs HT6 --luoi` → toạ độ pixel của mọi chấm huyệt trên trang (chấm ĐỎ =
   huyệt của trang này, chấm ĐEN = các huyệt vẽ kèm).
2. Mở ảnh bằng công cụ Read, gán nhãn cho từng toạ độ pixel (máy tách được chấm nhưng không đọc được chữ).
3. Chọn HAI huyệt làm mốc mà bản vẽ có và mesh cũng có, chiếu huyệt đang xét lên đoạn nối chúng:
   `t = ((X−A)·(B−A)) / |B−A|²` tính trên pixel.
4. `node doi-chieu-ti-le.cjs HT6 <A> <B> --anh <t vừa tính>` → in ngay chênh lệch quy ra cm.
Đây là phép kiểm ĐỘC LẬP với cốt độ và với mốc xương, tức độc lập với chính engine đã dựng toạ độ.

## 3. Toạ độ engine đang dựng
x=0.1386 y=0.5183 z=0.0198  →  ngang 23.83cm · cao 89.1cm · trước-sau 3.4cm · conf=khe-khoá

## 4. Khung đường kinh
Đoạn **cang-tay** — vùng: bờ trong mặt trước cẳng tay. Ranh mô: bờ trong gân cơ gấp cổ tay trụ, sát bờ trước xương trụ
Các huyệt trong đoạn: HT3 → HT4 → HT5 → HT6 → HT7

## 5. Cốt độ
Đoạn HT/cang-tay: **12 thốn** từ HT7 (WRIST) đến HT3 (CUBITAL).
1 thốn tại chỗ ≈ **2.01cm** (đo dọc trục chi giữa hai mốc xương).
Huyệt này ở mốc **0.5 thốn**.
Cả đoạn: HT4=1.5, HT5=1, HT6=0.5

## 6. Hàng xóm cùng kinh (khoảng cách ĐO so với SÁCH ĐÒI)
- **HT5** Thông Lý: đo thẳng 1.03cm, đo trên da 1cm — **sách đòi 0.5 thốn ≈ 1cm** → LỆCH 0.00cm
  > Mặt trước trong cẳng tay, trên nếp gấp cổ tay 1 thốn (huyệt Thần Môn – Tm.7), khe giữa gân cơ trụ trước và cơ gấp chung nông các ngón tay.
- **HT7** Thần Môn: đo thẳng 0.73cm, đo trên da 0.7cm — **sách đòi 0.5 thốn ≈ 1cm** → LỆCH -0.30cm
  > Ở phía xương trụ, nằm trên lằn chỉ cổ tay, nơi chỗ lõm sát bờ ngoài gân cơ trụ trước và góc ngoài bờ trên xương trụ.

## 7. Huyệt lân cận khác kinh (bán kính 4cm) — dùng để bắt CHẬP HUYỆT và sai vùng
- HT7 Thần Môn — 0.73cm
- HT5 Thông Lý — 1.03cm
- HT4 Linh Đạo — 2.02cm
- LU8 Kinh Cừ — 2.8cm
- SI5 Dương Cốc — 2.85cm
- PC7 Đại Lăng — 2.85cm
- LU7 Liệt Khuyết — 2.86cm
- SI6 Dưỡng Lão — 2.97cm
- PC6 Nội Quan — 3.25cm
- SI4 Uyển Cốt — 3.84cm
- TE4 Dương Trì — 3.99cm

## 8. Cấu trúc giải phẫu gần nhất trên mesh atlas
- Đầu cánh tay của cơ gấp cổ tay trụ trái (muscle) — 0.62cm
- Cơ gấp các ngón nông trái (muscle) — 0.73cm
- Cơ gấp các ngón sâu trái (muscle) — 0.76cm
- Cơ gan tay dài trái (muscle) — 0.87cm
- Xương trụ trái (bone) — 1.14cm

## 9. Cờ mà các bộ kiểm máy đã bắn
- RẢI DỌC ĐƯỜNG dời 2.09cm (conf=khe-khoá)
- XA ĐƯỜNG KINH 2.09cm
- TỪ ĐIỂN APP kêu: dọc "WRIST" đòi 0.5 thốn, đo được 0.5  (lệch 0.01cm)
- ATLAS FOCKS kêu: dọc "WRIST" đòi 0.5 thốn, đo được 0.5  (lệch 0.01cm)
