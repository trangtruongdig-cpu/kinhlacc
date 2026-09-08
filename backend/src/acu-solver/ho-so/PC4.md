# HỒ SƠ HUYỆT PC4 — Khích Môn (Focks: KHÍCH MÔN)

Kinh PC (Tâm Bào), huyệt thứ 4. Hạng nghiệm thu: **C** — chưa vào sổ

## 1. Nguồn chữ
**Từ điển app:** Trên khớp cổ tay 5 thốn, giữa 2 khe cơ gan tay lớn và bé.

**Atlas Focks — vị trí:** Cách khe khớp cổ tay khoảng 5 thốn giữa các gân của cơ gan tay dài và cơ gấp cổ tay quay.

**Atlas Focks — cách xác định:** Bắt đầu từ điểm giữa huyệt Đại lăng (Pe/Pc 7) (giữa khe khớp cổ tay) và huyệt Khúc trạc (Pe/Pc 3) (ở nếp gấp khuỷu tay), đo về phía cổ tay 1 thốn và xác định vị trí huyệt Khích môn (Pe/Pc 4) giữa hai gân. Nếu chỉ nhìn thấy một gân thì đó là gân cơ gấp cổ tay quay.

**WHO 2008:** (chưa thu thập — agent thư lại điền)

## 2. Ảnh atlas — BẰNG CHỨNG MẠNH NHẤT, phải ĐO chứ đừng chỉ tả
- /Users/truongtrang/Desktop/kinhlacc-atlas-hinh/PC4_p240_0.jpeg

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
1. `node do-anh-atlas.cjs PC4 --luoi` → toạ độ pixel của mọi chấm huyệt trên trang (chấm ĐỎ =
   huyệt của trang này, chấm ĐEN = các huyệt vẽ kèm).
2. Mở ảnh bằng công cụ Read, gán nhãn cho từng toạ độ pixel (máy tách được chấm nhưng không đọc được chữ).
3. Chọn HAI huyệt làm mốc mà bản vẽ có và mesh cũng có, chiếu huyệt đang xét lên đoạn nối chúng:
   `t = ((X−A)·(B−A)) / |B−A|²` tính trên pixel.
4. `node doi-chieu-ti-le.cjs PC4 <A> <B> --anh <t vừa tính>` → in ngay chênh lệch quy ra cm.
Đây là phép kiểm ĐỘC LẬP với cốt độ và với mốc xương, tức độc lập với chính engine đã dựng toạ độ.

## 3. Toạ độ engine đang dựng
x=0.1296 y=0.5694 z=0.0111  →  ngang 22.28cm · cao 97.88cm · trước-sau 1.91cm · conf=cao

## 4. Khung đường kinh
Đoạn **cang-tay** — vùng: giữa mặt trước cẳng tay. Ranh mô: giữa gân cơ gan tay dài và gân cơ gấp cổ tay quay
Các huyệt trong đoạn: PC3 → PC4 → PC5 → PC6 → PC7

## 5. Cốt độ
Đoạn PC/cang-tay: **12 thốn** từ PC7 (WRIST) đến PC3 (CUBITAL).
1 thốn tại chỗ ≈ **2.01cm** (đo dọc trục chi giữa hai mốc xương).
Huyệt này ở mốc **5 thốn**.
Cả đoạn: PC4=5, PC5=3, PC6=2

## 6. Hàng xóm cùng kinh (khoảng cách ĐO so với SÁCH ĐÒI)
- **PC3** Khúc Trạch: đo thẳng 14.34cm, đo trên da 17cm — **sách đòi 7 thốn ≈ 14.07cm** → LỆCH 2.93cm
  > Trên nếp gấp khớp khuỷu tay, chỗ lõm phía trong khuỷu tay, bờ trong gân cơ 2 đầu cánh tay.
- **PC5** Gian Sử: đo thẳng 4.12cm, đo trên da 3.9cm — **sách đòi 2 thốn ≈ 4.02cm** → LỆCH -0.12cm
  > Bàn tay để ngửa, huyệt ở trên lằn chỉ cổ tay 3 thốn, giữa khe gân cơ gan tay lớn và bé.

## 7. Huyệt lân cận khác kinh (bán kính 4cm) — dùng để bắt CHẬP HUYỆT và sai vùng
- SI7 Chi Chính — 3.34cm

## 8. Cấu trúc giải phẫu gần nhất trên mesh atlas
- Cơ gan tay dài trái (muscle) — 0.2cm
- Cơ gấp các ngón nông trái (muscle) — 0.44cm
- Cơ gấp cổ tay quay trái (muscle) — 0.81cm
- Cơ gấp các ngón sâu trái (muscle) — 0.91cm
- Đầu cánh tay của cơ gấp cổ tay trụ trái (muscle) — 1.42cm

## 9. Cờ mà các bộ kiểm máy đã bắn
- RẢI DỌC ĐƯỜNG dời 4.39cm (conf=cao)
- XA ĐƯỜNG KINH 4.3cm
- AUDIT cờ soát: mô tả "bờ ? cơ gấp cổ tay quay" không nêu phía nào — chỉ đủ xác nhận, không đủ để dời 0.33 thốn · RẢI DỌC ĐƯỜN
- TỪ ĐIỂN APP kêu: dọc "WRIST" đòi 5 thốn, đo được 5  (lệch 0.01cm)
- ATLAS FOCKS kêu: dọc "WRIST" đòi 5 thốn, đo được 5  (lệch 0.01cm)

## 10. Đã ghi CÒN NGỜ trong sổ
Loại: mota, duong, khac
mô tả "bờ ? cơ gấp cổ tay quay" không nêu phía nào — chỉ đủ xác nhận, không đủ để dời 0.33 thốn · RẢI DỌC ĐƯỜNG: dời 4.39cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt · RẢI DỌC ĐƯỜN
