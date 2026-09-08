# HỒ SƠ HUYỆT KI4 — Đại Chung (Focks: ĐẠI CHUNG)

Kinh KI (Thận), huyệt thứ 4. Hạng nghiệm thu: **C** — chưa vào sổ

## 1. Nguồn chữ
**Từ điển app:** Ở chỗ lõm tạo nên do gân gót bám vào bờ trên trong xương gót, dưới huyệt Thái Khê 0,5 thốn.

**Atlas Focks — vị trí:** Phía trước bờ trong của gân Achilles phía trên điểm bám của nó vào xương gót, cách huyệt Thái khê (Ni/KID 3) khoảng 0,5 thốn xuống dưới và ra sau.

**Atlas Focks — cách xác định:** Từ đỉnh của mắt cá trong, vẽ một đường ngang lên đến mép trong của gân Achilles, sau đó đo 0,5 thốn xuống dưới. Huyệt Đại chung (Ni/KID 4) nằm trong một hõm phía trước gân Achilles, hơi phía trên điểm bám của nó vào xương gót. Hoặc: Huyệt Đại chung (Ni/KID 4) nằm giữa của đường nối huyệt Thái khê (Ni/KID 3) và huyệt huyệt Thuỷ tuyền (Ni/KID 5), phía trước gân Achilles.

**WHO 2008:** (chưa thu thập — agent thư lại điền)

## 2. Ảnh atlas — BẰNG CHỨNG MẠNH NHẤT, phải ĐO chứ đừng chỉ tả
- /Users/truongtrang/Desktop/kinhlacc-atlas-hinh/KI4_p213_0.jpeg

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
1. `node do-anh-atlas.cjs KI4 --luoi` → toạ độ pixel của mọi chấm huyệt trên trang (chấm ĐỎ =
   huyệt của trang này, chấm ĐEN = các huyệt vẽ kèm).
2. Mở ảnh bằng công cụ Read, gán nhãn cho từng toạ độ pixel (máy tách được chấm nhưng không đọc được chữ).
3. Chọn HAI huyệt làm mốc mà bản vẽ có và mesh cũng có, chiếu huyệt đang xét lên đoạn nối chúng:
   `t = ((X−A)·(B−A)) / |B−A|²` tính trên pixel.
4. `node doi-chieu-ti-le.cjs KI4 <A> <B> --anh <t vừa tính>` → in ngay chênh lệch quy ra cm.
Đây là phép kiểm ĐỘC LẬP với cốt độ và với mốc xương, tức độc lập với chính engine đã dựng toạ độ.

## 3. Toạ độ engine đang dựng
x=0.022 y=0.0356 z=-0.0212  →  ngang 3.78cm · cao 6.12cm · trước-sau -3.64cm · conf=khe

## 4. Khung đường kinh
Đoạn **ban-chan** — vùng: gan bàn chân → mắt cá trong. Ranh mô: gan bàn chân, rồi vòng quanh mắt cá trong giữa xương chày và gân gót
Các huyệt trong đoạn: KI1 → KI2 → KI3 → KI4 → KI5 → KI6

## 6. Hàng xóm cùng kinh (khoảng cách ĐO so với SÁCH ĐÒI)
- **KI3** Thái Khê: đo thẳng 1.93cm, đo trên da 1.7cm
  > Tại trung điểm giữa đường nối bờ sau mắt cá trong và mép trong gân gót, khe giữa gân gót chân ở phía sau.
- **KI5** Thủy Tuyền: đo thẳng 0.7cm, đo trên da 0.4cm
  > Thẳng dưới huyệt Thái Khê (Th.3) 1 thốn, trên xương gót chân, bờ sau gân gấp dài ngón chân cái.

## 7. Huyệt lân cận khác kinh (bán kính 4cm) — dùng để bắt CHẬP HUYỆT và sai vùng
- KI5 Thủy Tuyền — 0.7cm
- KI3 Thái Khê — 1.93cm
- KI6 Chiếu Hải — 2.51cm

## 8. Cấu trúc giải phẫu gần nhất trên mesh atlas
- Cơ gấp các ngón chân dài trái (muscle) — 0.47cm
- Cơ chày sau trái (bone) — 1.16cm
- Xương sên trái (bone) — 1.23cm
- Cơ gấp ngón chân cái dài trái (muscle) — 1.56cm
- Xương chày trái (bone) — 2.16cm

## 9. Cờ mà các bộ kiểm máy đã bắn
- RẢI DỌC ĐƯỜNG dời 5.38cm (conf=khe)
- XA ĐƯỜNG KINH 5.38cm
- AUDIT cờ soát: RẢI DỌC ĐƯỜNG: dời 5.38cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt
- TỪ ĐIỂN APP kêu: dọc "KI3" đòi 0.5 thốn, đo được 0.68  (lệch 0.51cm)
- ATLAS FOCKS kêu: dọc "KI3" đòi 0.5 thốn, đo được 0.68  (lệch 0.51cm)

## 10. Đã ghi CÒN NGỜ trong sổ
Loại: duong
RẢI DỌC ĐƯỜNG: dời 5.38cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt
