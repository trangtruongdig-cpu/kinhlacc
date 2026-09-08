# HỒ SƠ HUYỆT LR8 — Khúc Tuyền (Focks: KHÚC TUYỀN)

Kinh LR (Can), huyệt thứ 8. Hạng nghiệm thu: **A** — Khúc Tuyền — đầu TRONG nếp kheo, ngay TRƯỚC gân bán gân/bán màng. Dựng từ xương/gân atlas. Dịch 0cm so toạ độ cũ.

## 1. Nguồn chữ
**Từ điển app:** Ở đầu trong nếp gấp nhượng chân, nơi khe giữa của bờ trước gân cơ bán mạc và cơ thẳng trong.

**Atlas Focks — vị trí:** Trong quá trình gập đầu gối, ngay gần đầu trong của nếp gấp đầu gối (khe khớp gối) ở chỗ lõm phía trước các gân của cơ bán gân và cơ bán màng.

**Atlas Focks — cách xác định:** Gập đầu gối và xoay nhẹ ra ngoài ở khớp hông. Đầu tiên, sờ nắn gân giống sợi dây nổi bật nhất của cơ bán gân ở vùng khoeo. Nó thấy rõ hơn khi gập đầu gối, phần gân phẳng hơn, khó sờ thấy hơn của cơ bán màng chạy bên dưới. Trượt ngón tay xúc giác của bạn từ gân giống như sợi dây qua phần cơ phình ra về phía xương bánh chè. Sau khoảng 1 thốn, ngón tay cảm thấy có một vết lõm nhỏ giữa các cơ phình ra: huyệt Khúc tuyền (Le/Liv 8). Chỗ này nằm ở phía trước cả hai gân. Huyệt Âm cốc (Ni/Ki 10) nằm sau khoảng 1 thốn về phía hố khoeo, nhìn từ phía trong phía sau gân cơ bán màng và phía trước gân cơ bán gân.

**WHO 2008:** (chưa thu thập — agent thư lại điền)

## 2. Ảnh atlas — BẰNG CHỨNG MẠNH NHẤT, phải ĐO chứ đừng chỉ tả
- /Users/truongtrang/Desktop/kinhlacc-atlas-hinh/LR8_p329_0.jpeg

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
1. `node do-anh-atlas.cjs LR8 --luoi` → toạ độ pixel của mọi chấm huyệt trên trang (chấm ĐỎ =
   huyệt của trang này, chấm ĐEN = các huyệt vẽ kèm).
2. Mở ảnh bằng công cụ Read, gán nhãn cho từng toạ độ pixel (máy tách được chấm nhưng không đọc được chữ).
3. Chọn HAI huyệt làm mốc mà bản vẽ có và mesh cũng có, chiếu huyệt đang xét lên đoạn nối chúng:
   `t = ((X−A)·(B−A)) / |B−A|²` tính trên pixel.
4. `node doi-chieu-ti-le.cjs LR8 <A> <B> --anh <t vừa tính>` → in ngay chênh lệch quy ra cm.
Đây là phép kiểm ĐỘC LẬP với cốt độ và với mốc xương, tức độc lập với chính engine đã dựng toạ độ.

## 3. Toạ độ engine đang dựng
x=0.0119 y=0.2712 z=-0.014  →  ngang 2.05cm · cao 46.62cm · trước-sau -2.41cm · conf=mốc

## 4. Khung đường kinh
Đoạn **cang-chan** — vùng: mặt trong cẳng chân. Ranh mô: sát bờ sau-trong xương chày, lên đầu trong nếp kheo
Các huyệt trong đoạn: LR4 → LR5 → LR6 → LR7 → LR8
Là NÚT MỐC loại "gap" tại POPLITEAL — Khúc Tuyền — đầu trong nếp kheo; kinh bẻ lên đùi trong

## 5. Cốt độ
Đoạn LR/cang-chan: **13 thốn** từ LR4 (MALLEOLUS_MED) đến LR8 (TIBIA_MED_CONDYLE).
1 thốn tại chỗ ≈ **2.83cm** (đo dọc trục chi giữa hai mốc xương).
Huyệt này ở mốc **13 thốn**.
Cả đoạn: LR5=5, LR6=7, LR7=11.6

## 6. Hàng xóm cùng kinh (khoảng cách ĐO so với SÁCH ĐÒI)
- **LR7** Tất Quan: đo thẳng 4.77cm, đo trên da 5.2cm — **sách đòi 1.4000000000000004 thốn ≈ 3.96cm** → LỆCH 1.24cm
  > Ở bờ sau dưới lồi cầu trong xương chầy, cách sau huyệt Âm Lăng Tuyền (Ty 9) một thốn.
- **LR9** Âm Bao: đo thẳng 8.63cm, đo trên da 9cm
  > Ở cách lồi cầu trên trong xương đùi 4 thốn, hoặc từ huyệt Khúc Tuyền (C 8) đo lên 4 thốn, giữa cơ rộng trong và cơ may.

## 7. Huyệt lân cận khác kinh (bán kính 4cm) — dùng để bắt CHẬP HUYỆT và sai vùng
- (không có)

## 8. Cấu trúc giải phẫu gần nhất trên mesh atlas
- Cơ thon trái (muscle) — 0.71cm
- Cơ bán màng trái (muscle) — 0.92cm
- Cơ may trái (muscle) — 1.05cm
- Cơ khép lớn trái (muscle) — 1.36cm
- Xương đùi trái (bone) — 1.46cm

## 9. Cờ mà các bộ kiểm máy đã bắn
- (sạch)
