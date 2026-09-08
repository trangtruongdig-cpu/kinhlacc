# HỒ SƠ HUYỆT SI6 — Dưỡng Lão (Focks: DƯỠNG LÃO)

Kinh SI (Tiểu Trường), huyệt thứ 6. Hạng nghiệm thu: **B** — conf=tạm, src=book+duong

## 1. Nguồn chữ
**Từ điển app:** Co khuỷu tay với lòng bàn tay đặt vào ngực, huyệt ở chỗ mỏm trâm xương trụ, từ huyệt Dương Cốc (Ttr 5) đo lên 1 thốn.

**Atlas Focks — vị trí:** Ở mặt ngoài của cẳng tay trong chỗ lõm phía trong và gần với mỏm trâm trụ, sờ thấy khi bàn tay di chuyển từ tư thế sấp sang tư thế ngửa.

**Atlas Focks — cách xác định:** Gập nhẹ khuỷu tay. Đặt ngón tay sờ vào phần xa của mỏm trâm trụ. Trong quá trình chuyển động của bàn tay từ tư thế quay sấp sang tư thế nửa ngửa, ngón tay sẽ cảm nhận được một rãnh xương ở độ dốc gần mỏm trâm (rãnh trượt của gân cơ duỗi cổ tay trụ). Rãnh xương này cũng có thể được cảm nhận khi bệnh nhân đặt tay lên ngực (tư thế nửa ngửa). Xác định vị trí huyệt Dưỡng lão (Dü/SI 6) tại rãnh này.

**WHO 2008:** (chưa thu thập — agent thư lại điền)

## 2. Ảnh atlas — BẰNG CHỨNG MẠNH NHẤT, phải ĐO chứ đừng chỉ tả
- /Users/truongtrang/Desktop/kinhlacc-atlas-hinh/SI6_p126_0.jpeg

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
1. `node do-anh-atlas.cjs SI6 --luoi` → toạ độ pixel của mọi chấm huyệt trên trang (chấm ĐỎ =
   huyệt của trang này, chấm ĐEN = các huyệt vẽ kèm).
2. Mở ảnh bằng công cụ Read, gán nhãn cho từng toạ độ pixel (máy tách được chấm nhưng không đọc được chữ).
3. Chọn HAI huyệt làm mốc mà bản vẽ có và mesh cũng có, chiếu huyệt đang xét lên đoạn nối chúng:
   `t = ((X−A)·(B−A)) / |B−A|²` tính trên pixel.
4. `node doi-chieu-ti-le.cjs SI6 <A> <B> --anh <t vừa tính>` → in ngay chênh lệch quy ra cm.
Đây là phép kiểm ĐỘC LẬP với cốt độ và với mốc xương, tức độc lập với chính engine đã dựng toạ độ.

## 3. Toạ độ engine đang dựng
x=0.1325 y=0.5198 z=0.0037  →  ngang 22.78cm · cao 89.35cm · trước-sau 0.64cm · conf=tạm

## 4. Khung đường kinh
Đoạn **cang-tay** — vùng: mặt sau-trong cẳng tay. Ranh mô: sát bờ sau xương trụ
Các huyệt trong đoạn: SI5 → SI6 → SI7 → SI8

## 5. Cốt độ
Đoạn SI/cang-tay: **12 thốn** từ SI5 (WRIST) đến SI8 (CUBITAL).
1 thốn tại chỗ ≈ **2.01cm** (đo dọc trục chi giữa hai mốc xương).
Huyệt này ở mốc **1 thốn**.
Cả đoạn: SI6=1, SI7=5

## 6. Hàng xóm cùng kinh (khoảng cách ĐO so với SÁCH ĐÒI)
- **SI5** Dương Cốc: đo thẳng 1.04cm, đo trên da 0.8cm — **sách đòi 1 thốn ≈ 2.01cm** → LỆCH -1.21cm
  > Ở bờ trong cổ ngón tay, nơi chỗ lõm giữa xương hạt đậu và đầu mỏm trâm xương trụ.
- **SI7** Chi Chính: đo thẳng 8.05cm, đo trên da 9.4cm — **sách đòi 4 thốn ≈ 8.04cm** → LỆCH 1.36cm
  > Tại sát bờ sau xương trụ, cách cổ tay 5 thốn, trên đường nối huyệt Dương Cốc và huyệt Tiểu Hải.

## 7. Huyệt lân cận khác kinh (bán kính 4cm) — dùng để bắt CHẬP HUYỆT và sai vùng
- SI5 Dương Cốc — 1.04cm
- TE4 Dương Trì — 2.43cm
- HT5 Thông Lý — 2.57cm
- HT4 Linh Đạo — 2.74cm
- HT6 Âm Khích — 2.97cm
- HT7 Thần Môn — 3.43cm
- TE5 Ngoại Quan — 3.75cm
- PC6 Nội Quan — 3.93cm
- SI4 Uyển Cốt — 3.95cm
- LU7 Liệt Khuyết — 3.99cm

## 8. Cấu trúc giải phẫu gần nhất trên mesh atlas
- Cơ duỗi cổ tay trụ trái (muscle) — 0.63cm
- Xương trụ trái (bone) — 0.73cm
- Cơ duỗi ngón út trái (muscle) — 1.19cm
- Đầu cánh tay của cơ gấp cổ tay trụ trái (muscle) — 1.26cm
- Cơ sấp vuông trái (muscle) — 1.49cm

## 9. Cờ mà các bộ kiểm máy đã bắn
- RẢI DỌC ĐƯỜNG dời 2.61cm (conf=tạm)
- XA ĐƯỜNG KINH 0.77cm
- TỪ ĐIỂN APP kêu: dọc "SI5" đòi 1 thốn, đo được 0.52  (lệch 0.97cm)
