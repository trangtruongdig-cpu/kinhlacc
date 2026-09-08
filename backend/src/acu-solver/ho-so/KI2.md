# HỒ SƠ HUYỆT KI2 — Nhiên Cốc (Focks: NHIÊN CỐC)

Kinh KI (Thận), huyệt thứ 2. Hạng nghiệm thu: **B** — conf=WHO-lấp, src=who+duong

## 1. Nguồn chữ
**Từ điển app:** Ở chỗ lõm sát giữa bờ dưới xương thuyền, trên đường nối da gan chân và mu chân.

**Atlas Focks — vị trí:** Ở mép trong của bàn chân trong một chỗ lõm ở bờ dưới trước của xương thuyền (ghe), trên ranh giới da gan và da mu bàn chân.

**Atlas Focks — cách xác định:** Từ xa đến gần, sờ nắn trên bờ trong của xương bàn chân cho đến khi bạn lần đầu tiên cảm nhận được đáy của trục xương bàn chân thứ nhất huyệt Công tôn (Mi/SP 4), sau đó là xương chêm trong và cuối cùng là xương thuyền (ghe) nổi rõ hơn. Huyệt Nhiên cốc (Ni/KID 2) nằm ở góc đuôi của khớp nối giữa xương chêm trong và xương thuyền.

**WHO 2008:** (chưa thu thập — agent thư lại điền)

## 2. Ảnh atlas — BẰNG CHỨNG MẠNH NHẤT, phải ĐO chứ đừng chỉ tả
- /Users/truongtrang/Desktop/kinhlacc-atlas-hinh/KI2_p211_0.jpeg

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
1. `node do-anh-atlas.cjs KI2 --luoi` → toạ độ pixel của mọi chấm huyệt trên trang (chấm ĐỎ =
   huyệt của trang này, chấm ĐEN = các huyệt vẽ kèm).
2. Mở ảnh bằng công cụ Read, gán nhãn cho từng toạ độ pixel (máy tách được chấm nhưng không đọc được chữ).
3. Chọn HAI huyệt làm mốc mà bản vẽ có và mesh cũng có, chiếu huyệt đang xét lên đoạn nối chúng:
   `t = ((X−A)·(B−A)) / |B−A|²` tính trên pixel.
4. `node doi-chieu-ti-le.cjs KI2 <A> <B> --anh <t vừa tính>` → in ngay chênh lệch quy ra cm.
Đây là phép kiểm ĐỘC LẬP với cốt độ và với mốc xương, tức độc lập với chính engine đã dựng toạ độ.

## 3. Toạ độ engine đang dựng
x=0.0329 y=0.0207 z=0.004  →  ngang 5.66cm · cao 3.56cm · trước-sau 0.69cm · conf=WHO-lấp

## 4. Khung đường kinh
Đoạn **ban-chan** — vùng: gan bàn chân → mắt cá trong. Ranh mô: gan bàn chân, rồi vòng quanh mắt cá trong giữa xương chày và gân gót
Các huyệt trong đoạn: KI1 → KI2 → KI3 → KI4 → KI5 → KI6

## 6. Hàng xóm cùng kinh (khoảng cách ĐO so với SÁCH ĐÒI)
- **KI1** Dũng Tuyền: đo thẳng 5.95cm, đo trên da 7.4cm
  > Dưới lòng bàn chân, huyệt ở điểm nối 2/5 trước với 3/5 sau của đoạn đầu ngón chân thứ 2 và giữa bờ sau gót chân, chỗ lõm dưới bàn chân.
- **KI3** Thái Khê: đo thẳng 6.36cm, đo trên da 6.4cm
  > Tại trung điểm giữa đường nối bờ sau mắt cá trong và mép trong gân gót, khe giữa gân gót chân ở phía sau.

## 7. Huyệt lân cận khác kinh (bán kính 4cm) — dùng để bắt CHẬP HUYỆT và sai vùng
- SP5 Thương Khâu — 1.98cm
- KI6 Chiếu Hải — 3.03cm
- SP4 Công Tôn — 3.37cm

## 8. Cấu trúc giải phẫu gần nhất trên mesh atlas
- Cơ dạng ngón chân cái trái (muscle) — 0.45cm
- Cơ chày sau trái (bone) — 1.1cm
- Cơ gấp ngón chân cái dài trái (muscle) — 1.41cm
- Xương ghe bàn chân trái (bone) — 1.52cm
- Xương chêm trong trái (bone) — 1.58cm

## 9. Cờ mà các bộ kiểm máy đã bắn
- RẢI DỌC ĐƯỜNG dời 1.82cm (conf=WHO-lấp)
- XA ĐƯỜNG KINH 1.4cm
