# HỒ SƠ HUYỆT KI8 — Giao Tín (Focks: GIAO TÍN)

Kinh KI (Thận), huyệt thứ 8. Hạng nghiệm thu: **C** — chưa vào sổ

## 1. Nguồn chữ
**Từ điển app:** Huyệt Thái Khê (Th 3) đo lên 2 thốn, trước huyệt Phục Lưu 0,5 thốn, cạnh bờ sau trong xương chầy.

**Atlas Focks — vị trí:** Trên đỉnh của mắt cá trong 2 thốn, bờ sau xương chày.

**Atlas Focks — cách xác định:** Đỉnh của mắt cá trong đo lên 2 thốn về phía khớp gối và xác định vị trí huyệt Giao tín (Ni/KID 8) ở bờ sau xương chày.

**WHO 2008:** (chưa thu thập — agent thư lại điền)

## 2. Ảnh atlas — BẰNG CHỨNG MẠNH NHẤT, phải ĐO chứ đừng chỉ tả
- /Users/truongtrang/Desktop/kinhlacc-atlas-hinh/KI8_p216_0.jpeg

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
1. `node do-anh-atlas.cjs KI8 --luoi` → toạ độ pixel của mọi chấm huyệt trên trang (chấm ĐỎ =
   huyệt của trang này, chấm ĐEN = các huyệt vẽ kèm).
2. Mở ảnh bằng công cụ Read, gán nhãn cho từng toạ độ pixel (máy tách được chấm nhưng không đọc được chữ).
3. Chọn HAI huyệt làm mốc mà bản vẽ có và mesh cũng có, chiếu huyệt đang xét lên đoạn nối chúng:
   `t = ((X−A)·(B−A)) / |B−A|²` tính trên pixel.
4. `node doi-chieu-ti-le.cjs KI8 <A> <B> --anh <t vừa tính>` → in ngay chênh lệch quy ra cm.
Đây là phép kiểm ĐỘC LẬP với cốt độ và với mốc xương, tức độc lập với chính engine đã dựng toạ độ.

## 3. Toạ độ engine đang dựng
x=0.0258 y=0.0809 z=-0.0169  →  ngang 4.44cm · cao 13.91cm · trước-sau -2.91cm · conf=khoá

## 4. Khung đường kinh
Đoạn **cang-chan** — vùng: mặt trong-sau cẳng chân. Ranh mô: bờ trong gân gót lên rãnh trong cơ bụng chân, tới đầu trong nếp kheo
Các huyệt trong đoạn: KI6 → KI7 → KI8 → KI9 → KI10

## 5. Cốt độ
Đoạn KI/cang-chan: **13 thốn** từ KI3 (MALLEOLUS_MED) đến KI10 (TIBIA_MED_CONDYLE).
1 thốn tại chỗ ≈ **2.83cm** (đo dọc trục chi giữa hai mốc xương).
Huyệt này ở mốc **2 thốn**, lệch ngang 0.5 thốn về phía truoc.
Cả đoạn: KI7=2, KI8=2, KI9=5

## 6. Hàng xóm cùng kinh (khoảng cách ĐO so với SÁCH ĐÒI)
- **KI7** Phục Lưu: đo thẳng 1.43cm, đo trên da 1.2cm — **sách đòi 0 thốn**
  > Giữa mắt cá chân trong và gân gót (huyệt Thái Khê (Th.3) đo thẳng lên 2 thốn, trong khe của mặt trước gân gót chân và cơ gấp dài riêng ngón cái.
- **KI9** Trúc Tân: đo thẳng 9.45cm, đo trên da 9.6cm — **sách đòi 3 thốn ≈ 8.49cm** → LỆCH 1.11cm
  > Trên huyệt Thái Khê (Th.3) 5 thốn, sau bờ trong xương chày 2 thốn, khe giữa gân gót chân và cơ dép.

## 7. Huyệt lân cận khác kinh (bán kính 4cm) — dùng để bắt CHẬP HUYỆT và sai vùng
- KI7 Phục Lưu — 1.43cm
- SP6 Tam Âm Giao — 2.97cm

## 8. Cấu trúc giải phẫu gần nhất trên mesh atlas
- Cơ gấp các ngón chân dài trái (muscle) — 1.06cm
- Cơ chày sau trái (bone) — 1.88cm
- Xương chày trái (bone) — 2.07cm
- Cơ dép trái (muscle) — 2.17cm
- Gân gót trái (connective) — 2.18cm

## 9. Cờ mà các bộ kiểm máy đã bắn
- RẢI DỌC ĐƯỜNG dời 4.48cm (conf=khoá)
- XA ĐƯỜNG KINH 3.84cm
- AUDIT cờ soát: RẢI DỌC ĐƯỜNG: dời 4.48cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt
- TỪ ĐIỂN APP kêu: dọc "KI3" đòi 2 thốn, đo được 2.08  (lệch 0.23cm)
- ATLAS FOCKS kêu: dọc "MALLEOLUS_MED" đòi 2 thốn, đo được 2.08  (lệch 0.23cm)

## 10. Đã ghi CÒN NGỜ trong sổ
Loại: duong
RẢI DỌC ĐƯỜNG: dời 4.48cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt
