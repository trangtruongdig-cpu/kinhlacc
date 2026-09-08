# HỒ SƠ HUYỆT LR9 — Âm Bao (Focks: ÂM BAO)

Kinh LR (Can), huyệt thứ 9. Hạng nghiệm thu: **C** — chưa vào sổ

## 1. Nguồn chữ
**Từ điển app:** Ở cách lồi cầu trên trong xương đùi 4 thốn, hoặc từ huyệt Khúc Tuyền (C 8) đo lên 4 thốn, giữa cơ rộng trong và cơ may.

**Atlas Focks — vị trí:** Cách lồi cầu trong xương chày 4 thốn, giữa cơ may và cơ rộng trong. Các cách xác định khác: 4 thốn trên huyệt Khúc tuyền (Le/Liv 8) hoặc 4 thốn gần điểm chuyển tiếp giữa trục xương đùi và lồi cầu, hoặc 4 thốn trên điểm giữa lồi cầu xương đùi.

**Atlas Focks — cách xác định:** Đo từ huyệt Khúc tuyền (Le/Liv 8) (gần đầu trong của nếp gấp đầu gối (khe khớp gối) ở chỗ lõm phía trước các gân của cơ bán gân và cơ bán màng) lên khoảng cách 4 thốn và xác định vị trí huyệt Âm bao (Le/Liv 9) ở ranh giới của cơ may đoạn thu hẹp và cơ rộng trong. Theo chuẩn hoá của tổ chức y tế thế giới: huyệt Âm bao (Le/Liv 9) giữa cơ may và cơ thon, trên bờ trên xương bánh chè 4 thốn.

**WHO 2008:** (chưa thu thập — agent thư lại điền)

## 2. Ảnh atlas — BẰNG CHỨNG MẠNH NHẤT, phải ĐO chứ đừng chỉ tả
- /Users/truongtrang/Desktop/kinhlacc-atlas-hinh/LR9_p330_0.jpeg
- /Users/truongtrang/Desktop/kinhlacc-atlas-hinh/LR9_p461_0.jpeg
- /Users/truongtrang/Desktop/kinhlacc-atlas-hinh/LR9_p461_1.jpeg

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
1. `node do-anh-atlas.cjs LR9 --luoi` → toạ độ pixel của mọi chấm huyệt trên trang (chấm ĐỎ =
   huyệt của trang này, chấm ĐEN = các huyệt vẽ kèm).
2. Mở ảnh bằng công cụ Read, gán nhãn cho từng toạ độ pixel (máy tách được chấm nhưng không đọc được chữ).
3. Chọn HAI huyệt làm mốc mà bản vẽ có và mesh cũng có, chiếu huyệt đang xét lên đoạn nối chúng:
   `t = ((X−A)·(B−A)) / |B−A|²` tính trên pixel.
4. `node doi-chieu-ti-le.cjs LR9 <A> <B> --anh <t vừa tính>` → in ngay chênh lệch quy ra cm.
Đây là phép kiểm ĐỘC LẬP với cốt độ và với mốc xương, tức độc lập với chính engine đã dựng toạ độ.

## 3. Toạ độ engine đang dựng
x=0.0115 y=0.3214 z=-0.0141  →  ngang 1.98cm · cao 55.25cm · trước-sau -2.42cm · conf=cao

## 4. Khung đường kinh
Đoạn **dui** — vùng: mặt trong đùi. Ranh mô: giữa cơ khép dài và cơ may, tới nếp bẹn
Các huyệt trong đoạn: LR8 → LR9 → LR10 → LR11 → LR12

## 5. Cốt độ
Đoạn LR/dui: **21.7 thốn** từ LR8 (undefined) đến LR12 (undefined).
1 thốn tại chỗ ≈ **?cm** (đo dọc trục chi giữa hai mốc xương).
Huyệt này ở mốc **4 thốn**.
Cả đoạn: LR9=4, LR10=18.7, LR11=19.7

## 6. Hàng xóm cùng kinh (khoảng cách ĐO so với SÁCH ĐÒI)
- **LR8** Khúc Tuyền: đo thẳng 8.63cm, đo trên da 9cm
  > Ở đầu trong nếp gấp nhượng chân, nơi khe giữa của bờ trước gân cơ bán mạc và cơ thẳng trong.
- **LR10** Túc Ngũ Lý: đo thẳng 30.98cm, đo trên da 40.7cm — **sách đòi 14.7 thốn**
  > Ở bờ trong đùi, huyệt Âm Liêm (C.11) đo xuống 1 thốn, hoặc dưới nếp nhăn của bẹn 3 thốn.

## 7. Huyệt lân cận khác kinh (bán kính 4cm) — dùng để bắt CHẬP HUYỆT và sai vùng
- (không có)

## 8. Cấu trúc giải phẫu gần nhất trên mesh atlas
- Cơ thon trái (muscle) — 0.34cm
- Cơ bán màng trái (muscle) — 0.96cm
- Cơ may trái (muscle) — 1.98cm
- Cơ khép lớn trái (muscle) — 2.3cm
- Cơ rộng trong trái (muscle) — 3.35cm

## 9. Cờ mà các bộ kiểm máy đã bắn
- RẢI DỌC ĐƯỜNG dời 1.59cm (conf=cao)
- XA ĐƯỜNG KINH 1.42cm
- AUDIT cờ soát: hai bản sách lệch nhau 5.2cm — đã lấy bản cũ
- TỪ ĐIỂN APP kêu: dọc "FEMUR_MED_EPICONDYLE" đòi 4 thốn, đo được 3.65  (lệch 0.8cm)
- ATLAS FOCKS kêu: dọc "LR8" đòi 4 thốn, đo được 3.79  (lệch 0.49cm)

## 10. Đã ghi CÒN NGỜ trong sổ
Loại: khe, sach
nằm giữa bụng cơ (sâu 0.51 thốn trong khối Cơ thon trái) · hai bản sách lệch nhau 5.2cm — đã lấy bản cũ
