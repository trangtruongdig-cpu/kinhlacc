# HỒ SƠ HUYỆT LU8 — Kinh Cừ (Focks: KINH CỪ/CỰ)

> ⚠️ TÊN HAI NGUỒN KHÁC NHAU — app "Kinh Cừ" vs Focks "KINH CỪ/CỰ". Phải trọng tài TRƯỚC khi bàn toạ độ: nếu mã lệch thì đang dựng nhầm huyệt.

Kinh LU (Phế), huyệt thứ 8. Hạng nghiệm thu: **B** — conf=cao, src=book+duong

## 1. Nguồn chữ
**Từ điển app:** Trên lằn chỉ cổ tay 1 thốn, ở mặt trong đầu dưới xương quay.

**Atlas Focks — vị trí:** Bên ngoài động mạch quay, cách khe khớp cổ tay 1 thốn (nếp gấp cổ tay xa nhất).

**Atlas Focks — cách xác định:** Khi cử động lỏng tay có thể sờ thấy rõ khe khớp lòng bàn tay. Ở mức này có thể cảm nhận động mạch quay, huyệt Thái uyên (Lu 9) nằm ngoài động mạch, huyệt Kinh cừ/cự (Lu 8) cách Lu 9 gần 1 thốn. Huyệt Dương khê (Di 5) nằm gần Lu 8 nhưng ở mặt lưng cổ tay trong hố lào.

**WHO 2008:** (chưa thu thập — agent thư lại điền)

## 2. Ảnh atlas — BẰNG CHỨNG MẠNH NHẤT, phải ĐO chứ đừng chỉ tả
- /Users/truongtrang/Desktop/kinhlacc-atlas-hinh/LU8_p14_0.jpeg

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
1. `node do-anh-atlas.cjs LU8 --luoi` → toạ độ pixel của mọi chấm huyệt trên trang (chấm ĐỎ =
   huyệt của trang này, chấm ĐEN = các huyệt vẽ kèm).
2. Mở ảnh bằng công cụ Read, gán nhãn cho từng toạ độ pixel (máy tách được chấm nhưng không đọc được chữ).
3. Chọn HAI huyệt làm mốc mà bản vẽ có và mesh cũng có, chiếu huyệt đang xét lên đoạn nối chúng:
   `t = ((X−A)·(B−A)) / |B−A|²` tính trên pixel.
4. `node doi-chieu-ti-le.cjs LU8 <A> <B> --anh <t vừa tính>` → in ngay chênh lệch quy ra cm.
Đây là phép kiểm ĐỘC LẬP với cốt độ và với mốc xương, tức độc lập với chính engine đã dựng toạ độ.

## 3. Toạ độ engine đang dựng
x=0.1526 y=0.5263 z=0.0173  →  ngang 26.23cm · cao 90.47cm · trước-sau 2.97cm · conf=cao

## 4. Khung đường kinh
Đoạn **cang-tay** — vùng: mặt trước-ngoài cẳng tay. Ranh mô: bờ ngoài gân cơ gan tay dài, sát bờ trong xương quay, cạnh động mạch quay
Các huyệt trong đoạn: LU5 → LU6 → LU7 → LU8 → LU9

## 5. Cốt độ
Đoạn LU/cang-tay: **12 thốn** từ LU9 (WRIST) đến LU5 (CUBITAL).
1 thốn tại chỗ ≈ **2.01cm** (đo dọc trục chi giữa hai mốc xương).
Huyệt này ở mốc **1 thốn**.
Cả đoạn: LU6=7, LU7=1.5, LU8=1

## 6. Hàng xóm cùng kinh (khoảng cách ĐO so với SÁCH ĐÒI)
- **LU7** Liệt Khuyết: đo thẳng 1.17cm, đo trên da 1.2cm — **sách đòi 0.5 thốn ≈ 1cm** → LỆCH 0.20cm
  > Dưới đầu xương quay nối với thân xương, cách lằn chỉ ngang cổ tay 1,5 thốn. Hoặc chéo 2 ngón tay trỏ và ngón tay cái của 2 bàn tay với nhau, huyệt ở chỗ lõm ngay dưới đầu ngón tay trỏ.
- **LU9** Thái Uyên: đo thẳng 2.91cm, đo trên da 2.8cm — **sách đòi 1 thốn ≈ 2.01cm** → LỆCH 0.79cm
  > Trên lằn chỉ ngang cổ tay, nơi chỗ lõm trên động mạch tay quay, dưới huyệt là rãnh mạch tay quay.

## 7. Huyệt lân cận khác kinh (bán kính 4cm) — dùng để bắt CHẬP HUYỆT và sai vùng
- LU7 Liệt Khuyết — 1.17cm
- PC7 Đại Lăng — 2.39cm
- PC6 Nội Quan — 2.42cm
- HT5 Thông Lý — 2.52cm
- HT4 Linh Đạo — 2.77cm
- HT6 Âm Khích — 2.8cm
- LU9 Thái Uyên — 2.91cm
- HT7 Thần Môn — 3.2cm
- LI5 Dương Khê — 3.68cm

## 8. Cấu trúc giải phẫu gần nhất trên mesh atlas
- Cơ gấp ngón cái dài trái (muscle) — 0.54cm
- Cơ sấp vuông trái (muscle) — 0.67cm
- Cơ gấp cổ tay quay trái (muscle) — 0.77cm
- Xương quay trái (bone) — 0.89cm
- Cơ gấp các ngón sâu trái (muscle) — 1.03cm

## 9. Cờ mà các bộ kiểm máy đã bắn
- RẢI DỌC ĐƯỜNG dời 2.04cm (conf=cao)
- XA ĐƯỜNG KINH 1.93cm
- TỪ ĐIỂN APP kêu: dọc "WRIST" đòi 1 thốn, đo được 1  (lệch 0cm)
- ATLAS FOCKS kêu: dọc "WRIST" đòi 1 thốn, đo được 1  (lệch 0cm)
