# HỒ SƠ HUYỆT PC5 — Gian Sử (Focks: GIAN SỬ/SỨ)

> ⚠️ TÊN HAI NGUỒN KHÁC NHAU — app "Gian Sử" vs Focks "GIAN SỬ/SỨ". Phải trọng tài TRƯỚC khi bàn toạ độ: nếu mã lệch thì đang dựng nhầm huyệt.

Kinh PC (Tâm Bào), huyệt thứ 5. Hạng nghiệm thu: **C** — chưa vào sổ

## 1. Nguồn chữ
**Từ điển app:** Bàn tay để ngửa, huyệt ở trên lằn chỉ cổ tay 3 thốn, giữa khe gân cơ gan tay lớn và bé.

**Atlas Focks — vị trí:** Cách khe khớp cổ tay khoảng 3 thốn giữa các gân của cơ gan tay dài và cơ gấp cổ tay quay.

**Atlas Focks — cách xác định:** Khe khớp cổ tay có thể được sờ thấy rõ ràng bằng các cử động thả lỏng của bàn tay. Đo khoảng 3 thốn tính từ tâm khe khớp, huyệt Đại lăng (Pe/Pc 7). Ở đây, xác định vị trí huyệt Gian sử (Pe/Pc 5) giữa hai gân, làm lộ gân bằng cách siết chặt nắm tay. Nếu chỉ nhìn thấy một gân thì đó là gân gấp cổ tay quay.

**WHO 2008:** (chưa thu thập — agent thư lại điền)

## 2. Ảnh atlas — BẰNG CHỨNG MẠNH NHẤT, phải ĐO chứ đừng chỉ tả
- /Users/truongtrang/Desktop/kinhlacc-atlas-hinh/PC5_p241_0.jpeg

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
1. `node do-anh-atlas.cjs PC5 --luoi` → toạ độ pixel của mọi chấm huyệt trên trang (chấm ĐỎ =
   huyệt của trang này, chấm ĐEN = các huyệt vẽ kèm).
2. Mở ảnh bằng công cụ Read, gán nhãn cho từng toạ độ pixel (máy tách được chấm nhưng không đọc được chữ).
3. Chọn HAI huyệt làm mốc mà bản vẽ có và mesh cũng có, chiếu huyệt đang xét lên đoạn nối chúng:
   `t = ((X−A)·(B−A)) / |B−A|²` tính trên pixel.
4. `node doi-chieu-ti-le.cjs PC5 <A> <B> --anh <t vừa tính>` → in ngay chênh lệch quy ra cm.
Đây là phép kiểm ĐỘC LẬP với cốt độ và với mốc xương, tức độc lập với chính engine đã dựng toạ độ.

## 3. Toạ độ engine đang dựng
x=0.1384 y=0.5473 z=0.0142  →  ngang 23.79cm · cao 94.08cm · trước-sau 2.44cm · conf=cao

## 4. Khung đường kinh
Đoạn **cang-tay** — vùng: giữa mặt trước cẳng tay. Ranh mô: giữa gân cơ gan tay dài và gân cơ gấp cổ tay quay
Các huyệt trong đoạn: PC3 → PC4 → PC5 → PC6 → PC7

## 5. Cốt độ
Đoạn PC/cang-tay: **12 thốn** từ PC7 (WRIST) đến PC3 (CUBITAL).
1 thốn tại chỗ ≈ **2.01cm** (đo dọc trục chi giữa hai mốc xương).
Huyệt này ở mốc **3 thốn**.
Cả đoạn: PC4=5, PC5=3, PC6=2

## 6. Hàng xóm cùng kinh (khoảng cách ĐO so với SÁCH ĐÒI)
- **PC4** Khích Môn: đo thẳng 4.12cm, đo trên da 3.9cm — **sách đòi 2 thốn ≈ 4.02cm** → LỆCH -0.12cm
  > Trên khớp cổ tay 5 thốn, giữa 2 khe cơ gan tay lớn và bé.
- **PC6** Nội Quan: đo thẳng 2.05cm, đo trên da 2.8cm — **sách đòi 1 thốn ≈ 2.01cm** → LỆCH 0.79cm
  > Trên cổ tay 2 thốn, dưới huyệt Gian Sử (Tb 5) 1 thốn, giữa khe gân cơ gan tay lớn và bé.

## 7. Huyệt lân cận khác kinh (bán kính 4cm) — dùng để bắt CHẬP HUYỆT và sai vùng
- PC6 Nội Quan — 2.05cm
- HT4 Linh Đạo — 3.14cm
- LU7 Liệt Khuyết — 3.23cm

## 8. Cấu trúc giải phẫu gần nhất trên mesh atlas
- Cơ gấp các ngón nông trái (muscle) — 0.15cm
- Cơ gan tay dài trái (muscle) — 0.41cm
- Cơ gấp cổ tay quay trái (muscle) — 0.42cm
- Cơ gấp các ngón sâu trái (muscle) — 0.72cm
- Cơ sấp vuông trái (muscle) — 1.29cm

## 9. Cờ mà các bộ kiểm máy đã bắn
- RẢI DỌC ĐƯỜNG dời 3.53cm (conf=cao)
- XA ĐƯỜNG KINH 3.46cm
- AUDIT cờ soát: mô tả "bờ ? cơ gấp cổ tay quay (gân)" không nêu phía nào — chỉ đủ xác nhận, không đủ để dời 0.86 thốn · RẢI DỌ
- TỪ ĐIỂN APP kêu: dọc "WRIST" đòi 3 thốn, đo được 3  (lệch 0.01cm)
- ATLAS FOCKS kêu: dọc "WRIST" đòi 3 thốn, đo được 3  (lệch 0.01cm)

## 10. Đã ghi CÒN NGỜ trong sổ
Loại: mota, duong, khac
mô tả "bờ ? cơ gấp cổ tay quay (gân)" không nêu phía nào — chỉ đủ xác nhận, không đủ để dời 0.86 thốn · RẢI DỌC ĐƯỜNG: dời 3.53cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt · RẢI DỌ
