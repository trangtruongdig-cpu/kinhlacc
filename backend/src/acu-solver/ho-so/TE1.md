# HỒ SƠ HUYỆT TE1 — Quan Xung (Focks: QUAN XUNG)

Kinh TE (Tam Tiêu), huyệt thứ 1. Hạng nghiệm thu: **A** — Quan Xung — góc móng ngón nhẫn, mé trụ — dựng từ xương đốt ngón xa trong atlas, lát cắt chân móng (60% chiều dài kể từ đầu ngón), cực trị phía đã nêu, rồi chiếu ra da

## 1. Nguồn chữ
**Từ điển app:** Ở bờ trong ngón tay áp út, cách chân móng 0,1 thốn.

**Atlas Focks — vị trí:** Cách góc móng phía ngoài của ngón đeo nhẫn 0,1 thốn.

**Atlas Focks — cách xác định:** Nằm ở giao điểm của hai tiếp tuyến giới hạn móng của ngón đeo nhẫn ở phía ngoài, cách mép thực của móng khoảng 0,1 thốn.

**WHO 2008:** (chưa thu thập — agent thư lại điền)

## 2. Ảnh atlas — BẰNG CHỨNG MẠNH NHẤT, phải ĐO chứ đừng chỉ tả
- /Users/truongtrang/Desktop/kinhlacc-atlas-hinh/TE1_p247_0.jpeg

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
1. `node do-anh-atlas.cjs TE1 --luoi` → toạ độ pixel của mọi chấm huyệt trên trang (chấm ĐỎ =
   huyệt của trang này, chấm ĐEN = các huyệt vẽ kèm).
2. Mở ảnh bằng công cụ Read, gán nhãn cho từng toạ độ pixel (máy tách được chấm nhưng không đọc được chữ).
3. Chọn HAI huyệt làm mốc mà bản vẽ có và mesh cũng có, chiếu huyệt đang xét lên đoạn nối chúng:
   `t = ((X−A)·(B−A)) / |B−A|²` tính trên pixel.
4. `node doi-chieu-ti-le.cjs TE1 <A> <B> --anh <t vừa tính>` → in ngay chênh lệch quy ra cm.
Đây là phép kiểm ĐỘC LẬP với cốt độ và với mốc xương, tức độc lập với chính engine đã dựng toạ độ.

## 3. Toạ độ engine đang dựng
x=0.1412 y=0.4359 z=0.0491  →  ngang 24.27cm · cao 74.93cm · trước-sau 8.44cm · conf=mốc

## 4. Khung đường kinh
Đoạn **ban-tay** — vùng: mu bàn tay. Ranh mô: khe giữa xương bàn ngón 4 và 5, rồi lằn cổ tay mặt mu
Các huyệt trong đoạn: TE1 → TE2 → TE3 → TE4
Là NÚT MỐC loại "dau" tại góc móng ngón đeo nhẫn, mé trụ — Quan Xung — tỉnh huyệt

## 6. Hàng xóm cùng kinh (khoảng cách ĐO so với SÁCH ĐÒI)
- **TE2** Dịch Môn: đo thẳng 8.22cm, đo trên da 8.2cm
  > Giữa xương bàn ngón tay thứ 4 và 5, nơi chỗ lõm ở kẽ ngón tay, ngang phần tiếp nối của thân với đầu trên xương đốt ngón tay.

## 7. Huyệt lân cận khác kinh (bán kính 4cm) — dùng để bắt CHẬP HUYỆT và sai vùng
- HT9 Thiếu Xung — 2.33cm
- SI1 Thiếu Trạch — 3.09cm

## 8. Cấu trúc giải phẫu gần nhất trên mesh atlas
- Đốt ngón xa của ngón nhẫn trái (bone) — 0.33cm
- Đốt ngón giữa của ngón nhẫn trái (bone) — 0.51cm
- Cơ gấp các ngón sâu trái (muscle) — 0.54cm
- Đốt ngón xa của ngón út trái (bone) — 2.04cm
- Cơ gấp các ngón nông trái (muscle) — 2.29cm

## 9. Cờ mà các bộ kiểm máy đã bắn
- (sạch)
