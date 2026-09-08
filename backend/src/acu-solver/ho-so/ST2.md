# HỒ SƠ HUYỆT ST2 — Tứ Bạch (Focks: TỨ BẠCH)

Kinh ST (Vị), huyệt thứ 2. Hạng nghiệm thu: **B** — conf=WHO-lấp, src=who+duong

## 1. Nguồn chữ
**Từ điển app:** Ngay giữa mi dưới thẳng xuống 1 thốn, chỗ lõm dưới hố mắt, bờ dưới cơ vòng mi.

**Atlas Focks — vị trí:** Nhìn thẳng về phía trước, trên đường vuông góc đi qua tâm đồng tử, ở chỗ lỗ sâu dưới hốc mắt.

**Atlas Focks — cách xác định:** Bốn điểm đầu tiên của kinh Vị (Ma/ST) nằm trên trên đường vuông góc đi qua tâm đồng tử khi bệnh nhân nhìn thẳng về phía trước. Bờ dưới hốc mắt như một cạnh xương có thể sờ thấy rõ ràng. Bắt đầu từ mép dưới của hốc mắt, sờ theo dọc theo đường đồng tử cho đến lỗ sâu hơn dưới hốc mắt (thường nằm ở phía trong hơn một chút so với đường đồng tử) vị trí huyệt Tứ bạch (Ma 2) tại đây.

**WHO 2008:** (chưa thu thập — agent thư lại điền)

## 2. Ảnh atlas — BẰNG CHỨNG MẠNH NHẤT, phải ĐO chứ đừng chỉ tả
- /Users/truongtrang/Desktop/kinhlacc-atlas-hinh/ST2_p40_0.jpeg

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
1. `node do-anh-atlas.cjs ST2 --luoi` → toạ độ pixel của mọi chấm huyệt trên trang (chấm ĐỎ =
   huyệt của trang này, chấm ĐEN = các huyệt vẽ kèm).
2. Mở ảnh bằng công cụ Read, gán nhãn cho từng toạ độ pixel (máy tách được chấm nhưng không đọc được chữ).
3. Chọn HAI huyệt làm mốc mà bản vẽ có và mesh cũng có, chiếu huyệt đang xét lên đoạn nối chúng:
   `t = ((X−A)·(B−A)) / |B−A|²` tính trên pixel.
4. `node doi-chieu-ti-le.cjs ST2 <A> <B> --anh <t vừa tính>` → in ngay chênh lệch quy ra cm.
Đây là phép kiểm ĐỘC LẬP với cốt độ và với mốc xương, tức độc lập với chính engine đã dựng toạ độ.

## 3. Toạ độ engine đang dựng
x=0.0196 y=0.9238 z=0.0421  →  ngang 3.37cm · cao 158.8cm · trước-sau 7.24cm · conf=WHO-lấp

## 4. Khung đường kinh
Đoạn **mat** — vùng: mặt. Ranh mô: trục dọc đồng tử, xuống bờ dưới xương hàm dưới rồi ra góc hàm, trên cơ cắn
Các huyệt trong đoạn: ST1 → ST2 → ST3 → ST4 → ST5 → ST6

## 6. Hàng xóm cùng kinh (khoảng cách ĐO so với SÁCH ĐÒI)
- **ST1** Thừa Khấp: đo thẳng 2.8cm, đo trên da 3.4cm
  > Dưới đồng tử 0,7 thốn, ở chỗ gặp nhau của bờ dưới xương ổ mắt với đường dọc chính giữa mắt.
- **ST3** Cự Liêu: đo thẳng 2.32cm, đo trên da 1.7cm
  > Tại nơi gặp nhau của đường giữa mắt kéo xuống và chân cánh mũi kéo ra, ngay dưới huyệt Tứ Bạch (Vi 2).

## 7. Huyệt lân cận khác kinh (bán kính 4cm) — dùng để bắt CHẬP HUYỆT và sai vùng
- ST3 Cự Liêu — 2.32cm
- LI20 Nghênh Hương — 2.75cm
- ST1 Thừa Khấp — 2.8cm
- GB1 Đồng Tử Liêu — 2.96cm
- TE23 Ty Trúc Không — 3.93cm

## 8. Cấu trúc giải phẫu gần nhất trên mesh atlas
- Cơ thẳng dưới trái (muscle) — 1.34cm
- Cơ thẳng ngoài trái (muscle) — 1.59cm
- Cơ chéo dưới trái (muscle) — 1.61cm
- Xương gò má trái (bone) — 1.72cm
- Xương hàm trên trái (bone) — 1.75cm

## 9. Cờ mà các bộ kiểm máy đã bắn
- RẢI DỌC ĐƯỜNG dời 2.39cm (conf=WHO-lấp)
- XA ĐƯỜNG KINH 1.13cm
