# HỒ SƠ HUYỆT SP8 — Địa Cơ (Focks: ĐỊA CƠ)

Kinh SP (Tỳ), huyệt thứ 8. Hạng nghiệm thu: **C** — chưa vào sổ

## 1. Nguồn chữ
**Từ điển app:** Ở sát bờ sau trong xương chầy, dưới đường khớp ngang đầu gối 5 thốn, dưới huyệt Âm Lăng Tuyền 3 thốn.

**Atlas Focks — vị trí:** Cách huyệt Âm lăng tuyền (Mi/SP 9), điểm nối thân và lồi cầu xương chày) 3 thốn, tại bờ trong xương chày.

**Atlas Focks — cách xác định:** Đo từ điểm nối thân và lồi cầu trong xương chày (huyệt Âm lăng tuyền (Mi/SP 9) xuống 3 thốn (1 khoát tay); xác định vị trí của huyệt Địa cơ (Mi/SP 8) ở bờ trong xương chày, trên đường nối giữa Mi/SP 9 và điểm cao nhất của mắt cá trong.

**WHO 2008:** (chưa thu thập — agent thư lại điền)

## 2. Ảnh atlas — BẰNG CHỨNG MẠNH NHẤT, phải ĐO chứ đừng chỉ tả
- /Users/truongtrang/Desktop/kinhlacc-atlas-hinh/SP8_p95_0.jpeg

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
1. `node do-anh-atlas.cjs SP8 --luoi` → toạ độ pixel của mọi chấm huyệt trên trang (chấm ĐỎ =
   huyệt của trang này, chấm ĐEN = các huyệt vẽ kèm).
2. Mở ảnh bằng công cụ Read, gán nhãn cho từng toạ độ pixel (máy tách được chấm nhưng không đọc được chữ).
3. Chọn HAI huyệt làm mốc mà bản vẽ có và mesh cũng có, chiếu huyệt đang xét lên đoạn nối chúng:
   `t = ((X−A)·(B−A)) / |B−A|²` tính trên pixel.
4. `node doi-chieu-ti-le.cjs SP8 <A> <B> --anh <t vừa tính>` → in ngay chênh lệch quy ra cm.
Đây là phép kiểm ĐỘC LẬP với cốt độ và với mốc xương, tức độc lập với chính engine đã dựng toạ độ.

## 3. Toạ độ engine đang dựng
x=0.0152 y=0.2129 z=-0.0239  →  ngang 2.61cm · cao 36.6cm · trước-sau -4.11cm · conf=WHO+khe

## 4. Khung đường kinh
Đoạn **cang-chan** — vùng: mặt trong cẳng chân. Ranh mô: sát bờ sau xương chày, trước cơ dép
Các huyệt trong đoạn: SP5 → SP6 → SP7 → SP8 → SP9

## 5. Cốt độ
Đoạn SP/cang-chan: **13 thốn** từ SP5 (MALLEOLUS_MED) đến SP9 (TIBIA_MED_CONDYLE).
1 thốn tại chỗ ≈ **2.83cm** (đo dọc trục chi giữa hai mốc xương).
Huyệt này ở mốc **10 thốn**.
Cả đoạn: SP6=3, SP7=6, SP8=10

## 6. Hàng xóm cùng kinh (khoảng cách ĐO so với SÁCH ĐÒI)
- **SP7** Lậu Cốc: đo thẳng 10.71cm, đo trên da 12.1cm — **sách đòi 4 thốn ≈ 11.32cm** → LỆCH 0.78cm
  > Ở chỗ lõm sát bờ sau trong xương chày, từ đỉnh cao của mắt cá trong đo thẳng lên 6 thốn.
- **SP9** Âm Lăng Tuyền: đo thẳng 6.14cm, đo trên da 9.3cm — **sách đòi 3 thốn ≈ 8.49cm** → LỆCH 0.81cm
  > Ở chỗ lõm làm thành bởi bờ sau trong đầu trên xương chầy với đường ngang qua nơi lồi cao nhất của củ cơ cẳng chân trước xương chầy, ở mặt trong đầu gối. Hoặc dùng ngón tay lần theo bờ trong xương ống chân, đến ngay dưới chỗ lồi xương cao nhất, đó là huyệt.

## 7. Huyệt lân cận khác kinh (bán kính 4cm) — dùng để bắt CHẬP HUYỆT và sai vùng
- (không có)

## 8. Cấu trúc giải phẫu gần nhất trên mesh atlas
- Đầu trong của cơ bụng chân trái (muscle) — 1cm
- Cơ dép trái (muscle) — 3.3cm
- Cơ khoeo trái (muscle) — 3.92cm
- Cơ bán gân trái (muscle) — 4.05cm
- Cơ gan chân trái (muscle) — 4.32cm

## 9. Cờ mà các bộ kiểm máy đã bắn
- RẢI DỌC ĐƯỜNG dời 7.1cm (conf=WHO+khe)
- XA ĐƯỜNG KINH 6.96cm
- ÉP LÊN DA dời 3.2cm
- AUDIT cờ soát: TẦNG DA: ép lên da, dời 3.2cm · RẢI DỌC ĐƯỜNG: dời 7.1cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt
- ATLAS FOCKS kêu: dọc "SP9" đòi 3 thốn, đo được 2.22  (lệch 1.93cm)

## 10. Đã ghi CÒN NGỜ trong sổ
Loại: da, duong
TẦNG DA: ép lên da, dời 3.2cm · RẢI DỌC ĐƯỜNG: dời 7.1cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt
