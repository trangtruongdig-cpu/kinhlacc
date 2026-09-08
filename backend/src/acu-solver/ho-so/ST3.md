# HỒ SƠ HUYỆT ST3 — Cự Liêu (Focks: CỰ LIÊU)

Kinh ST (Vị), huyệt thứ 3. Hạng nghiệm thu: **C** — chưa vào sổ

## 1. Nguồn chữ
**Từ điển app:** Tại nơi gặp nhau của đường giữa mắt kéo xuống và chân cánh mũi kéo ra, ngay dưới huyệt Tứ Bạch (Vi 2).

**Atlas Focks — vị trí:** Nhìn thẳng về phía trước, trên đường vuông góc đi qua tâm đồng tử, ở chỗ ngang với mép dưới của cánh mũi.

**Atlas Focks — cách xác định:** Bốn điểm đầu tiên của kinh Vị (Ma/ST) nằm trên trên đường vuông góc đi qua tâm đồng tử khi bệnh nhân nhìn thẳng về phía trước. Huyệt Cự liêu (Ma 3) nằm ở giao điểm của đường vuông góc đi qua tâm đồng tử với đường ngang với mép dưới của cánh mũi.

**WHO 2008:** (chưa thu thập — agent thư lại điền)

## 2. Ảnh atlas — BẰNG CHỨNG MẠNH NHẤT, phải ĐO chứ đừng chỉ tả
- /Users/truongtrang/Desktop/kinhlacc-atlas-hinh/ST3_p41_0.jpeg

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
1. `node do-anh-atlas.cjs ST3 --luoi` → toạ độ pixel của mọi chấm huyệt trên trang (chấm ĐỎ =
   huyệt của trang này, chấm ĐEN = các huyệt vẽ kèm).
2. Mở ảnh bằng công cụ Read, gán nhãn cho từng toạ độ pixel (máy tách được chấm nhưng không đọc được chữ).
3. Chọn HAI huyệt làm mốc mà bản vẽ có và mesh cũng có, chiếu huyệt đang xét lên đoạn nối chúng:
   `t = ((X−A)·(B−A)) / |B−A|²` tính trên pixel.
4. `node doi-chieu-ti-le.cjs ST3 <A> <B> --anh <t vừa tính>` → in ngay chênh lệch quy ra cm.
Đây là phép kiểm ĐỘC LẬP với cốt độ và với mốc xương, tức độc lập với chính engine đã dựng toạ độ.

## 3. Toạ độ engine đang dựng
x=0.0206 y=0.9104 z=0.0412  →  ngang 3.54cm · cao 156.5cm · trước-sau 7.08cm · conf=cao

## 4. Khung đường kinh
Đoạn **mat** — vùng: mặt. Ranh mô: trục dọc đồng tử, xuống bờ dưới xương hàm dưới rồi ra góc hàm, trên cơ cắn
Các huyệt trong đoạn: ST1 → ST2 → ST3 → ST4 → ST5 → ST6

## 6. Hàng xóm cùng kinh (khoảng cách ĐO so với SÁCH ĐÒI)
- **ST2** Tứ Bạch: đo thẳng 2.32cm, đo trên da 1.7cm
  > Ngay giữa mi dưới thẳng xuống 1 thốn, chỗ lõm dưới hố mắt, bờ dưới cơ vòng mi.
- **ST4** Địa Thương: đo thẳng 2.87cm, đo trên da 3.5cm
  > Cách khóe miệng 0,4 thốn, hoặc trên đường ngang qua mép và rãnh mép mũi.

## 7. Huyệt lân cận khác kinh (bán kính 4cm) — dùng để bắt CHẬP HUYỆT và sai vùng
- ST2 Tứ Bạch — 2.32cm
- ST4 Địa Thương — 2.87cm
- LI20 Nghênh Hương — 3.34cm
- GV28 Ngân Giao — 3.91cm

## 8. Cấu trúc giải phẫu gần nhất trên mesh atlas
- Xương gò má trái (bone) — 1.15cm
- Xương hàm trên trái (bone) — 1.17cm
- Răng hàm nhỏ vĩnh viễn hàm trên 1 trái (bone) — 1.74cm
- Răng hàm nhỏ vĩnh viễn hàm trên 2 trái (bone) — 1.82cm
- Lợi của hàm trên (bone) — 1.85cm

## 9. Cờ mà các bộ kiểm máy đã bắn
- RẢI DỌC ĐƯỜNG dời 4.55cm (conf=cao)
- XA ĐƯỜNG KINH 1.13cm
- AUDIT cờ soát: RẢI DỌC ĐƯỜNG: dời 4.55cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt

## 10. Đã ghi CÒN NGỜ trong sổ
Loại: duong
RẢI DỌC ĐƯỜNG: dời 4.55cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt
