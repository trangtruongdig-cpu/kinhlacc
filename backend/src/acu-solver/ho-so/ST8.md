# HỒ SƠ HUYỆT ST8 — Đầu Duy (Focks: ĐẦU DUY)

Kinh ST (Vị), huyệt thứ 8. Hạng nghiệm thu: **A** — Đầu Duy — góc trán chân tóc (mốc đầu). SỬA: giá trị cũ (0,086; 0,957; 0,060) đặt trên mesh CŨ, cách da mesh v2 tới 10,5cm dù mang nhãn tin cậy CAO NHẤT (conf=mốc) — nay dò lại bằng điểm da NGOÀI nhất của dải trán trên (y 0,962–0,978, z>0,01), khớp x≈3,7 thốn ngang đầu

## 1. Nguồn chữ
**Từ điển app:** Nơi góc trán, cách bờ chân tóc 0,5 thốn, trên đường khớp đỉnh trán, từ huyệt Thần Đình (Đc 24) đo ra 4 thốn.

**Atlas Focks — vị trí:** Ở góc thái dương của trán, trên bờ cơ thái dương và cách chân tóc trước 0,5 thốn hoặc ra ngoài 4,5 thốn so với đường giữa trước (huyệt Thần đình Du/GV-24)

**Atlas Focks — cách xác định:** Định vị huyệt Đầu duy (Ma 8) ở góc trán-thái dương, cách đường chân tóc phía trước 0,5 thốn. Các chuyển động nhai của cơ thái dương thường có thể sờ thấy ở đây. Các huyệt Thần đình (Du/GV 24), đường giữa trán; My xung (Bl 3), phía trên khóe mắt trong; Khúc sai (Bl 4), đường giữa trán ra 1,5 thốn; Đầu lâm khấp (Gb 15), đường đồng tử; Bản thần (Gb 13), 3 thốn so với đường giữa trán cũng cách đường chân tóc phía trước 0,5 thốn. Khoảng cách ám chỉ khoảng cách thốn cơ thể: từ Du/GV 24 đến Ma 8 = 4,5 thốn. Ma 8 tới Gb 7 (vết lõm ở đỉnh tai, trong đường chân tóc thái dương) một đường vòng cung trên đó các điểm Ma 8, Gb 4-7 được phân bố với các khoảng cách bằng nhau (chia thành năm phần).

**WHO 2008:** (chưa thu thập — agent thư lại điền)

## 2. Ảnh atlas — BẰNG CHỨNG MẠNH NHẤT, phải ĐO chứ đừng chỉ tả
- /Users/truongtrang/Desktop/kinhlacc-atlas-hinh/ST8_p46_0.jpeg

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
1. `node do-anh-atlas.cjs ST8 --luoi` → toạ độ pixel của mọi chấm huyệt trên trang (chấm ĐỎ =
   huyệt của trang này, chấm ĐEN = các huyệt vẽ kèm).
2. Mở ảnh bằng công cụ Read, gán nhãn cho từng toạ độ pixel (máy tách được chấm nhưng không đọc được chữ).
3. Chọn HAI huyệt làm mốc mà bản vẽ có và mesh cũng có, chiếu huyệt đang xét lên đoạn nối chúng:
   `t = ((X−A)·(B−A)) / |B−A|²` tính trên pixel.
4. `node doi-chieu-ti-le.cjs ST8 <A> <B> --anh <t vừa tính>` → in ngay chênh lệch quy ra cm.
Đây là phép kiểm ĐỘC LẬP với cốt độ và với mốc xương, tức độc lập với chính engine đã dựng toạ độ.

## 3. Toạ độ engine đang dựng
x=0.0372 y=0.9651 z=0.0146  →  ngang 6.39cm · cao 165.9cm · trước-sau 2.51cm · conf=mốc

## 4. Khung đường kinh
Đoạn **nhanh-tran** — vùng: NHÁNH lên trán. Ranh mô: dưới cung gò má lên góc trán chân tóc
Các huyệt trong đoạn: ST6 → ST7 → ST8
Là NÚT MỐC loại "cuoi" tại HAIRLINE_ANT — Đầu Duy — điểm cuối NHÁNH trán, không phải cuối kinh

## 6. Hàng xóm cùng kinh (khoảng cách ĐO so với SÁCH ĐÒI)
- **ST7** Hạ Quan: đo thẳng 8.62cm, đo trên da 14cm
  > Khi ngậm miệng lại, huyệt ở chỗ lõm phía trước tai, dưới xương gò má, nơi góc phía trước của mỏm tiếp xương thái dương và lồi cầu xương hàm dưới.
- **ST9** Nhân Nghênh: đo thẳng 15.99cm, đo trên da 18.7cm
  > Nơi gặp nhau của bờ trước cơ ức – đòn chũm và đường ngang qua chỗ lồi nhất của yết hầu, sờ ở cổ có động mạch cảnh đập.

## 7. Huyệt lân cận khác kinh (bán kính 4cm) — dùng để bắt CHẬP HUYỆT và sai vùng
- GB4 Hàm Yến — 0.92cm
- GB5 Huyền Lư — 1.84cm
- GB6 Huyền Ly — 2.76cm
- GB7 Khúc Tân — 3.68cm

## 8. Cấu trúc giải phẫu gần nhất trên mesh atlas
- Xương trán (bone) — 0.46cm
- Xương đỉnh trái (bone) — 0.5cm
- Xương bướm (bone) — 3.54cm
- Xương thái dương trái (bone) — 3.7cm
- Xương gò má trái (bone) — 5.32cm

## 9. Cờ mà các bộ kiểm máy đã bắn
- TỪ ĐIỂN APP kêu: ngang "GV24" đòi 4 thốn, đo được 4.5  (lệch 0.71cm)
