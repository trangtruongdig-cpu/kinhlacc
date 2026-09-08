# HỒ SƠ HUYỆT GB2 — Thính Hội (Focks: THÍNH HỘI)

Kinh GB (Đởm), huyệt thứ 2. Hạng nghiệm thu: **A** — Thính Hội — trước khuyết gian bình tai, dưới Thính Cung 0,5 thốn

## 1. Nguồn chữ
**Từ điển app:** Phía trước rãnh bình tai, ở chỗ lõm khi há miệng, bờ sau tuyến mang tai, dưới huyệt Thính Cung (Ttr.19).

**Atlas Focks — vị trí:** Phía trước tai trong chỗ lõm ngang mức rãnh giữa tai ở bờ dưới mỏm lồi cầu của hàm dưới.

**Atlas Focks — cách xác định:** Chỗ chuyển tiếp từ sụn bình tai sang má (khi chúng ta già đi, rãnh này thấy rõ hơn). Xác định vị trí của huyệt Thính hội (Gb 2) ở mức rãnh giữa tai (intertragic notch 珠間切痕). Huyệt Thính hội (Gb 2) là điểm thấp nhất trong 3 điểm trước tai, các điểm còn lại thiên phía trên hơn: Huyệt Thính cung (Dü/SI 19) ở mức bình tai và huyệt Nhĩ môn (SJ/TB 21) ở mức rãnh trên tai.

**WHO 2008:** (chưa thu thập — agent thư lại điền)

## 2. Ảnh atlas — BẰNG CHỨNG MẠNH NHẤT, phải ĐO chứ đừng chỉ tả
- /Users/truongtrang/Desktop/kinhlacc-atlas-hinh/GB2_p272_0.jpeg

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
1. `node do-anh-atlas.cjs GB2 --luoi` → toạ độ pixel của mọi chấm huyệt trên trang (chấm ĐỎ =
   huyệt của trang này, chấm ĐEN = các huyệt vẽ kèm).
2. Mở ảnh bằng công cụ Read, gán nhãn cho từng toạ độ pixel (máy tách được chấm nhưng không đọc được chữ).
3. Chọn HAI huyệt làm mốc mà bản vẽ có và mesh cũng có, chiếu huyệt đang xét lên đoạn nối chúng:
   `t = ((X−A)·(B−A)) / |B−A|²` tính trên pixel.
4. `node doi-chieu-ti-le.cjs GB2 <A> <B> --anh <t vừa tính>` → in ngay chênh lệch quy ra cm.
Đây là phép kiểm ĐỘC LẬP với cốt độ và với mốc xương, tức độc lập với chính engine đã dựng toạ độ.

## 3. Toạ độ engine đang dựng
x=0.0375 y=0.9156 z=-0.0016  →  ngang 6.45cm · cao 157.39cm · trước-sau -0.28cm · conf=mốc

## 4. Khung đường kinh
Đoạn **thai-duong** — vùng: đuôi mắt → trước tai. Ranh mô: bờ ngoài ổ mắt, trên cung gò má, trước bình tai
Các huyệt trong đoạn: GB1 → GB2 → GB3

## 6. Hàng xóm cùng kinh (khoảng cách ĐO so với SÁCH ĐÒI)
- **GB1** Đồng Tử Liêu: đo thẳng 6.27cm, đo trên da 6.8cm
  > Cách góc ngoài mắt 0,5 thốn, chỗ lõm sát ngoài đường khớp của mỏm ngoài ổ mắt.
- **GB3** Thượng Quan: đo thẳng 3.54cm, đo trên da 3.8cm
  > Ở phía trước tai, bờ trên xương gò má, xác định huyệt Hạ Quan kéo thẳng lên, đến chỗ lõm bờ sau chân tóc mai.

## 7. Huyệt lân cận khác kinh (bán kính 4cm) — dùng để bắt CHẬP HUYỆT và sai vùng
- TE18 Khế Mạch — 0.57cm
- SI19 Thính Cung — 0.71cm
- TE17 Ế Phong — 1.38cm
- TE21 Nhĩ Môn — 1.45cm
- TE19 Lư Tức — 1.79cm
- GB11 Đầu Khiếu Âm — 1.81cm
- GB10 Phù Bạch — 2.45cm
- SI18 Quyền Liêu — 2.73cm
- TE20 Giác Tôn — 3.12cm
- ST7 Hạ Quan — 3.22cm
- GB12 Hoàn Cốt — 3.44cm
- GB3 Thượng Quan — 3.54cm

## 8. Cấu trúc giải phẫu gần nhất trên mesh atlas
- Xương thái dương trái (bone) — 1.04cm
- Xương hàm dưới (bone) — 1.22cm
- Cơ nhị thân trái (muscle) — 2.22cm
- Cơ dài nhất đầu trái (muscle) — 2.28cm
- Cơ ức đòn chũm trái (muscle) — 2.3cm

## 9. Cờ mà các bộ kiểm máy đã bắn
- XA ĐƯỜNG KINH 0cm
