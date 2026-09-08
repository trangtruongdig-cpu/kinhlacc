# HỒ SƠ HUYỆT TE3 — Trung Chử (Focks: TRUNG CHỬ)

Kinh TE (Tam Tiêu), huyệt thứ 3. Hạng nghiệm thu: **A** — Hội đồng phản biện 08/09: TE3 ép lên da mặt mu tại cổ xương bàn 4 (cao độ giữ nguyên, phần lùi dọc hội đồng đề nghị KHÔNG được phép đo xác nhận). TE16 ngang góc hàm 152,65cm tại bờ SAU cơ ức-đòn-chũm. TE23 hõm trên khớp trán-gò má, nghiệm thu cách GB1 2,05cm

## 1. Nguồn chữ
**Từ điển app:** Trên mu tay, giữa ngón tay xương bàn tay thứ 4 và thứ 5, trong chỗ lõm trên kẽ ngón tay 1 thốn.

**Atlas Focks — vị trí:** Ở mặt sau của bàn tay trong chỗ lõm giữa xương bàn tay thứ 4 và thứ 5, gần khớp bàn tay. Nằm ở vùng chuyển tiếp từ thân lên đầu của hai xương bàn tay.

**Atlas Focks — cách xác định:** Đặt bàn tay của bạn ở tư thế thoải mái hoặc nắm lỏng tay. Dùng ngón tay, sờ từ đầu xa giữa các khớp gốc của ngón đeo nhẫn và ngón út gần vào rãnh giữa xương bàn tay thứ 4 và thứ 5 cho đến khi gặp điểm sâu nhất/rộng nhất của rãnh, phần xa so với gốc khớp; đây là vị trí huyệt Trung chử (SJ/TB 3). Nằm ở cùng mức có huyệt Ngoại lao cung (wailaogong: Ex-UE 8) nằm ở vị trí tương đương giữa xương bàn tay thứ 2 và thứ 3) và trên các cạnh của bàn tay huyệt Hâu khê (Dü/SI 3) trong khu vực chuyển tiếp giữa thân và đầu của xương bàn tay ngón út và huyệt Tam gian (Di/Li 3) trong khu vực chuyển tiếp giữa thân và đầu của xương bàn ngón tay thứ 2.

**WHO 2008:** (chưa thu thập — agent thư lại điền)

## 2. Ảnh atlas — BẰNG CHỨNG MẠNH NHẤT, phải ĐO chứ đừng chỉ tả
- /Users/truongtrang/Desktop/kinhlacc-atlas-hinh/TE3_p249_0.jpeg

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
1. `node do-anh-atlas.cjs TE3 --luoi` → toạ độ pixel của mọi chấm huyệt trên trang (chấm ĐỎ =
   huyệt của trang này, chấm ĐEN = các huyệt vẽ kèm).
2. Mở ảnh bằng công cụ Read, gán nhãn cho từng toạ độ pixel (máy tách được chấm nhưng không đọc được chữ).
3. Chọn HAI huyệt làm mốc mà bản vẽ có và mesh cũng có, chiếu huyệt đang xét lên đoạn nối chúng:
   `t = ((X−A)·(B−A)) / |B−A|²` tính trên pixel.
4. `node doi-chieu-ti-le.cjs TE3 <A> <B> --anh <t vừa tính>` → in ngay chênh lệch quy ra cm.
Đây là phép kiểm ĐỘC LẬP với cốt độ và với mốc xương, tức độc lập với chính engine đã dựng toạ độ.

## 3. Toạ độ engine đang dựng
x=0.1406 y=0.4752 z=0.0119  →  ngang 24.17cm · cao 81.69cm · trước-sau 2.05cm · conf=mốc

## 4. Khung đường kinh
Đoạn **ban-tay** — vùng: mu bàn tay. Ranh mô: khe giữa xương bàn ngón 4 và 5, rồi lằn cổ tay mặt mu
Các huyệt trong đoạn: TE1 → TE2 → TE3 → TE4

## 6. Hàng xóm cùng kinh (khoảng cách ĐO so với SÁCH ĐÒI)
- **TE2** Dịch Môn: đo thẳng 1.3cm, đo trên da 1.9cm
  > Giữa xương bàn ngón tay thứ 4 và 5, nơi chỗ lõm ở kẽ ngón tay, ngang phần tiếp nối của thân với đầu trên xương đốt ngón tay.
- **TE4** Dương Trì: đo thẳng 6.85cm, đo trên da 6.7cm
  > Ở chỗ lõm trên lằn ngang khớp xương cổ tay, khe giữa gân cơ duỗi chung ngón tay và cơ duỗi riêng ngón tay trỏ, khe giữa đầu dưới xương quay và xương trụ.

## 7. Huyệt lân cận khác kinh (bán kính 4cm) — dùng để bắt CHẬP HUYỆT và sai vùng
- HT8 Thiếu Phủ — 0.87cm
- TE2 Dịch Môn — 1.3cm
- SI3 Hậu Khê — 3.31cm
- SI2 Tiền Cốc — 3.32cm

## 8. Cấu trúc giải phẫu gần nhất trên mesh atlas
- Cơ duỗi các ngón trái (muscle) — 0.56cm
- Tập hợp của các cơ gian cốt mu của bàn tay trái (muscle) — 0.73cm
- Xương đốt bàn tay 4 trái (bone) — 0.75cm
- Xương đốt bàn tay 5 trái (bone) — 1.23cm
- Cơ duỗi ngón út trái (muscle) — 1.42cm

## 9. Cờ mà các bộ kiểm máy đã bắn
- XA ĐƯỜNG KINH 0.18cm
