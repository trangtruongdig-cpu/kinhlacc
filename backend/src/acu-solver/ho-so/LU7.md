# HỒ SƠ HUYỆT LU7 — Liệt Khuyết (Focks: LIỆT KHUYẾT)

Kinh LU (Phế), huyệt thứ 7. Hạng nghiệm thu: **A** — conf=khoá, src=book+duong

## 1. Nguồn chữ
**Từ điển app:** Dưới đầu xương quay nối với thân xương, cách lằn chỉ ngang cổ tay 1,5 thốn. Hoặc chéo 2 ngón tay trỏ và ngón tay cái của 2 bàn tay với nhau, huyệt ở chỗ lõm ngay dưới đầu ngón tay trỏ.

**Atlas Focks — vị trí:** Ở cạnh xương quay của cẳng tay, ngay phía trên mỏm trâm quay, cách khe khớp cổ tay (“nếp gấp cổ tay”) khoảng 1,5 thốn trong một rãnh hình chữ V.

**Atlas Focks — cách xác định:** Đầu tiên đặt ngón tay trỏ lên hố lào (huyệt Dương khê (Di 5), và từ đó lướt qua mỏm trâm cho đến khi ngón tay cảm nhận được khoảng trống giữa hai gân (cơ cánh tay quay/cơ giạng dài ngón tay cái). Vị trí huyệt Liệt khuyết (Lu 7) tại đây.

**WHO 2008:** (chưa thu thập — agent thư lại điền)

## 2. Ảnh atlas — BẰNG CHỨNG MẠNH NHẤT, phải ĐO chứ đừng chỉ tả
- /Users/truongtrang/Desktop/kinhlacc-atlas-hinh/LU7_p13_0.jpeg

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
1. `node do-anh-atlas.cjs LU7 --luoi` → toạ độ pixel của mọi chấm huyệt trên trang (chấm ĐỎ =
   huyệt của trang này, chấm ĐEN = các huyệt vẽ kèm).
2. Mở ảnh bằng công cụ Read, gán nhãn cho từng toạ độ pixel (máy tách được chấm nhưng không đọc được chữ).
3. Chọn HAI huyệt làm mốc mà bản vẽ có và mesh cũng có, chiếu huyệt đang xét lên đoạn nối chúng:
   `t = ((X−A)·(B−A)) / |B−A|²` tính trên pixel.
4. `node doi-chieu-ti-le.cjs LU7 <A> <B> --anh <t vừa tính>` → in ngay chênh lệch quy ra cm.
Đây là phép kiểm ĐỘC LẬP với cốt độ và với mốc xương, tức độc lập với chính engine đã dựng toạ độ.

## 3. Toạ độ engine đang dựng
x=0.1482 y=0.5314 z=0.0163  →  ngang 25.48cm · cao 91.35cm · trước-sau 2.8cm · conf=khoá

## 4. Khung đường kinh
Đoạn **cang-tay** — vùng: mặt trước-ngoài cẳng tay. Ranh mô: bờ ngoài gân cơ gan tay dài, sát bờ trong xương quay, cạnh động mạch quay
Các huyệt trong đoạn: LU5 → LU6 → LU7 → LU8 → LU9

## 5. Cốt độ
Đoạn LU/cang-tay: **12 thốn** từ LU9 (WRIST) đến LU5 (CUBITAL).
1 thốn tại chỗ ≈ **2.01cm** (đo dọc trục chi giữa hai mốc xương).
Huyệt này ở mốc **1.5 thốn**.
Cả đoạn: LU6=7, LU7=1.5, LU8=1

## 6. Hàng xóm cùng kinh (khoảng cách ĐO so với SÁCH ĐÒI)
- **LU6** Khổng Tối: đo thẳng 11.17cm, đo trên da 13.1cm — **sách đòi 5.5 thốn ≈ 11.05cm** → LỆCH 2.05cm
  > Ở bờ ngoài cẳng tay, trên cổ tay 7 thốn, nơi gặp nhau của bờ trong cơ ngửa dài hay bờ ngoài của cơ gan tay to với đường ngang trên khớp cổ tay 7 thốn, trên đường thẳng nối huyệt Xích Trạch (P 5) và Thái Uyên (P 9).
- **LU8** Kinh Cừ: đo thẳng 1.17cm, đo trên da 1.2cm — **sách đòi 0.5 thốn ≈ 1cm** → LỆCH 0.20cm
  > Trên lằn chỉ cổ tay 1 thốn, ở mặt trong đầu dưới xương quay.

## 7. Huyệt lân cận khác kinh (bán kính 4cm) — dùng để bắt CHẬP HUYỆT và sai vùng
- LU8 Kinh Cừ — 1.17cm
- PC6 Nội Quan — 1.26cm
- HT4 Linh Đạo — 2cm
- HT5 Thông Lý — 2.18cm
- HT6 Âm Khích — 2.86cm
- PC5 Gian Sử — 3.23cm
- PC7 Đại Lăng — 3.38cm
- HT7 Thần Môn — 3.44cm
- SI6 Dưỡng Lão — 3.99cm

## 8. Cấu trúc giải phẫu gần nhất trên mesh atlas
- Cơ gấp cổ tay quay trái (muscle) — 0.35cm
- Cơ gấp ngón cái dài trái (muscle) — 0.5cm
- Cơ sấp vuông trái (muscle) — 0.64cm
- Cơ gấp các ngón sâu trái (muscle) — 0.71cm
- Cơ gấp các ngón nông trái (muscle) — 0.73cm

## 9. Cờ mà các bộ kiểm máy đã bắn
- RẢI DỌC ĐƯỜNG dời 2.46cm (conf=khoá)
- XA ĐƯỜNG KINH 2.27cm
- TỪ ĐIỂN APP kêu: dọc "WRIST" đòi 1.5 thốn, đo được 1.5  (lệch 0cm)
- ATLAS FOCKS kêu: dọc "WRIST" đòi 1.5 thốn, đo được 1.5  (lệch 0cm)
