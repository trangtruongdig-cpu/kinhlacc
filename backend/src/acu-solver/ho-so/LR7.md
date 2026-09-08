# HỒ SƠ HUYỆT LR7 — Tất Quan (Focks: LAN VĨ)

> ⚠️ TÊN HAI NGUỒN KHÁC NHAU — app "Tất Quan" vs Focks "LAN VĨ". Phải trọng tài TRƯỚC khi bàn toạ độ: nếu mã lệch thì đang dựng nhầm huyệt.

Kinh LR (Can), huyệt thứ 7. Hạng nghiệm thu: **A** — Tất Quan — ngang Âm Lăng Tuyền SP9, lùi ra SAU 1 thốn

## 1. Nguồn chữ
**Từ điển app:** Ở bờ sau dưới lồi cầu trong xương chầy, cách sau huyệt Âm Lăng Tuyền (Ty 9) một thốn.

**Atlas Focks — vị trí:** Điểm nhạy áp lực nhất dưới huyệt Túc tam lý (Ma/ST 36) khoảng 2 thốn trên kinh Vị (Ma/ST) của chân phải.

**Atlas Focks — cách xác định:** Huyệt ở chân phải (tương ứng với vị trí một bên của ruột thừa ở bụng phải). Định hướng từ huyệt Túc tam lý (Ma/ST 36, dưới khe khớp gối 3 thốn và cách mép xương chày bề rộng 1 ngón tay). Sau đó sờ nắn xuống khoảng 2 thốn dọc theo kinh Vị (Ma/ST) và xác định vị trí huyệt Lan vĩ (Ex-LE 7) ở chỗ nhạy cảm với áp lực nhất.

**WHO 2008:** (chưa thu thập — agent thư lại điền)

## 2. Ảnh atlas — BẰNG CHỨNG MẠNH NHẤT, phải ĐO chứ đừng chỉ tả
- /Users/truongtrang/Desktop/kinhlacc-atlas-hinh/LR7_p328_0.jpeg
- /Users/truongtrang/Desktop/kinhlacc-atlas-hinh/LR7_p460_0.jpeg

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
1. `node do-anh-atlas.cjs LR7 --luoi` → toạ độ pixel của mọi chấm huyệt trên trang (chấm ĐỎ =
   huyệt của trang này, chấm ĐEN = các huyệt vẽ kèm).
2. Mở ảnh bằng công cụ Read, gán nhãn cho từng toạ độ pixel (máy tách được chấm nhưng không đọc được chữ).
3. Chọn HAI huyệt làm mốc mà bản vẽ có và mesh cũng có, chiếu huyệt đang xét lên đoạn nối chúng:
   `t = ((X−A)·(B−A)) / |B−A|²` tính trên pixel.
4. `node doi-chieu-ti-le.cjs LR7 <A> <B> --anh <t vừa tính>` → in ngay chênh lệch quy ra cm.
Đây là phép kiểm ĐỘC LẬP với cốt độ và với mốc xương, tức độc lập với chính engine đã dựng toạ độ.

## 3. Toạ độ engine đang dựng
x=0.0169 y=0.2471 z=-0.0268  →  ngang 2.91cm · cao 42.48cm · trước-sau -4.61cm · conf=mốc

## 4. Khung đường kinh
Đoạn **cang-chan** — vùng: mặt trong cẳng chân. Ranh mô: sát bờ sau-trong xương chày, lên đầu trong nếp kheo
Các huyệt trong đoạn: LR4 → LR5 → LR6 → LR7 → LR8

## 5. Cốt độ
Đoạn LR/cang-chan: **13 thốn** từ LR4 (MALLEOLUS_MED) đến LR8 (TIBIA_MED_CONDYLE).
1 thốn tại chỗ ≈ **2.83cm** (đo dọc trục chi giữa hai mốc xương).
Huyệt này ở mốc **11.6 thốn**.
Cả đoạn: LR5=5, LR6=7, LR7=11.6

## 6. Hàng xóm cùng kinh (khoảng cách ĐO so với SÁCH ĐÒI)
- **LR6** Trung Đô: đo thẳng 14.09cm, đo trên da 15.9cm — **sách đòi 4.6 thốn ≈ 13.02cm** → LỆCH 2.88cm
  > Ở bờ sau xương chày, trên mắt cá trong 7 thốn.
- **LR8** Khúc Tuyền: đo thẳng 4.77cm, đo trên da 5.2cm — **sách đòi 1.4000000000000004 thốn ≈ 3.96cm** → LỆCH 1.24cm
  > Ở đầu trong nếp gấp nhượng chân, nơi khe giữa của bờ trước gân cơ bán mạc và cơ thẳng trong.

## 7. Huyệt lân cận khác kinh (bán kính 4cm) — dùng để bắt CHẬP HUYỆT và sai vùng
- SP9 Âm Lăng Tuyền — 2.23cm

## 8. Cấu trúc giải phẫu gần nhất trên mesh atlas
- Cơ bán gân trái (muscle) — 1.06cm
- Đầu trong của cơ bụng chân trái (muscle) — 1.4cm
- Xương chày trái (bone) — 1.76cm
- Cơ bán màng trái (muscle) — 1.99cm
- Xương đùi trái (bone) — 2.98cm

## 9. Cờ mà các bộ kiểm máy đã bắn
- XA ĐƯỜNG KINH 0cm
- ATLAS FOCKS kêu: dọc "ST36" đòi 2 thốn, đo được 2.05  (lệch 0.12cm, SAI CHIỀU)
