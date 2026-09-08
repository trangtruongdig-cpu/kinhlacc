# HỒ SƠ HUYỆT TE2 — Dịch Môn (Focks: DỊCH MÔN)

Kinh TE (Tam Tiêu), huyệt thứ 2. Hạng nghiệm thu: **A** — Dịch Môn — kẽ ngón 4–5, mu tay

## 1. Nguồn chữ
**Từ điển app:** Giữa xương bàn ngón tay thứ 4 và 5, nơi chỗ lõm ở kẽ ngón tay, ngang phần tiếp nối của thân với đầu trên xương đốt ngón tay.

**Atlas Focks — vị trí:** Giữa ngón út và ngón đeo nhẫn, gần nếp gấp liên ngón.

**Atlas Focks — cách xác định:** Nắm lỏng tay, xác định vị trí nếp gấp liên ngón giữa ngón út và ngón đeo nhẫn (ngón thứ 4 và thứ 5) và xác định vị trí huyệt Dịch môn (SJ/TB 2) ở gần cuối nếp gấp. SJ 2 là một huyệt trong các huyệt Bát tà (baxie: Ex-UE 9) gần đầu các nếp gấp liên ngón tay. Ở vị trí tương ứng trên bàn chân là huyệt Hiệp khê (Gb 43) (nếp gấp giữa các ngón chân thứ 4 và thứ 5) là một trong các huyệt Bát phong (bafeng: Ex-LE 10).

**WHO 2008:** (chưa thu thập — agent thư lại điền)

## 2. Ảnh atlas — BẰNG CHỨNG MẠNH NHẤT, phải ĐO chứ đừng chỉ tả
- /Users/truongtrang/Desktop/kinhlacc-atlas-hinh/TE2_p248_0.jpeg

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
1. `node do-anh-atlas.cjs TE2 --luoi` → toạ độ pixel của mọi chấm huyệt trên trang (chấm ĐỎ =
   huyệt của trang này, chấm ĐEN = các huyệt vẽ kèm).
2. Mở ảnh bằng công cụ Read, gán nhãn cho từng toạ độ pixel (máy tách được chấm nhưng không đọc được chữ).
3. Chọn HAI huyệt làm mốc mà bản vẽ có và mesh cũng có, chiếu huyệt đang xét lên đoạn nối chúng:
   `t = ((X−A)·(B−A)) / |B−A|²` tính trên pixel.
4. `node doi-chieu-ti-le.cjs TE2 <A> <B> --anh <t vừa tính>` → in ngay chênh lệch quy ra cm.
Đây là phép kiểm ĐỘC LẬP với cốt độ và với mốc xương, tức độc lập với chính engine đã dựng toạ độ.

## 3. Toạ độ engine đang dựng
x=0.1394 y=0.4679 z=0.0136  →  ngang 23.96cm · cao 80.43cm · trước-sau 2.34cm · conf=mốc

## 4. Khung đường kinh
Đoạn **ban-tay** — vùng: mu bàn tay. Ranh mô: khe giữa xương bàn ngón 4 và 5, rồi lằn cổ tay mặt mu
Các huyệt trong đoạn: TE1 → TE2 → TE3 → TE4

## 6. Hàng xóm cùng kinh (khoảng cách ĐO so với SÁCH ĐÒI)
- **TE1** Quan Xung: đo thẳng 8.22cm, đo trên da 8.2cm
  > Ở bờ trong ngón tay áp út, cách chân móng 0,1 thốn.
- **TE3** Trung Chử: đo thẳng 1.3cm, đo trên da 1.9cm
  > Trên mu tay, giữa ngón tay xương bàn tay thứ 4 và thứ 5, trong chỗ lõm trên kẽ ngón tay 1 thốn.

## 7. Huyệt lân cận khác kinh (bán kính 4cm) — dùng để bắt CHẬP HUYỆT và sai vùng
- TE3 Trung Chử — 1.3cm
- HT8 Thiếu Phủ — 1.86cm
- SI2 Tiền Cốc — 2.88cm
- SI3 Hậu Khê — 3.22cm

## 8. Cấu trúc giải phẫu gần nhất trên mesh atlas
- Xương đốt bàn tay 4 trái (bone) — 0.91cm
- Cơ duỗi các ngón trái (muscle) — 0.95cm
- Tập hợp của các cơ gian cốt mu của bàn tay trái (muscle) — 1.21cm
- Cơ duỗi ngón út trái (muscle) — 1.39cm
- Đốt ngón gần của ngón nhẫn trái (bone) — 1.43cm

## 9. Cờ mà các bộ kiểm máy đã bắn
- XA ĐƯỜNG KINH 0cm
- ÉP LÊN DA dời 0.2cm
