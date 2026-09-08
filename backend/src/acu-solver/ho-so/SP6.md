# HỒ SƠ HUYỆT SP6 — Tam Âm Giao (Focks: TAM ÂM GIAO)

Kinh SP (Tỳ), huyệt thứ 6. Hạng nghiệm thu: **C** — chưa vào sổ

## 1. Nguồn chữ
**Từ điển app:** Ở sát bờ sau – trong xương chày, bờ trước cơ gấp dài các ngón chân và cơ cẳng chân sau, từ đỉnh cao của mắt cá chân trong đo lên 3 thốn.

**Atlas Focks — vị trí:** Bờ trong xương chày, trên điểm cao nhất của mắt cá trong khoảng 3 thốn.

**Atlas Focks — cách xác định:** Từ điểm cao nhất của mắt cá trong, đo lên 3 thốn (chiều rộng 1 bàn tay) và xác định vị trí huyệt Tam âm giao (Mi/SP 6) tại đây, trong chỗ lõm thường nhạy cảm với áp lực ở bờ sau của xương chày. Đôi khi, điểm này cũng nằm ở xa hơn xương chày về vùng bụng chân, độ nhạy với áp lực sẽ quyết định. Ở trạng thái sung mãn, huyệt cũng thường nổi lên. Ở vị trí bên ngoài tương đương là Tuyệt cốt/Huyền chung (Gb 39) (3 thốn trên điểm cao nhất của mắt cá ngoài ở bờ trước xương mác, điểm giao nhau của ba kinh dương).

**WHO 2008:** (chưa thu thập — agent thư lại điền)

## 2. Ảnh atlas — BẰNG CHỨNG MẠNH NHẤT, phải ĐO chứ đừng chỉ tả
- /Users/truongtrang/Desktop/kinhlacc-atlas-hinh/SP6_p93_0.jpeg

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
1. `node do-anh-atlas.cjs SP6 --luoi` → toạ độ pixel của mọi chấm huyệt trên trang (chấm ĐỎ =
   huyệt của trang này, chấm ĐEN = các huyệt vẽ kèm).
2. Mở ảnh bằng công cụ Read, gán nhãn cho từng toạ độ pixel (máy tách được chấm nhưng không đọc được chữ).
3. Chọn HAI huyệt làm mốc mà bản vẽ có và mesh cũng có, chiếu huyệt đang xét lên đoạn nối chúng:
   `t = ((X−A)·(B−A)) / |B−A|²` tính trên pixel.
4. `node doi-chieu-ti-le.cjs SP6 <A> <B> --anh <t vừa tính>` → in ngay chênh lệch quy ra cm.
Đây là phép kiểm ĐỘC LẬP với cốt độ và với mốc xương, tức độc lập với chính engine đã dựng toạ độ.

## 3. Toạ độ engine đang dựng
x=0.0263 y=0.0969 z=-0.0234  →  ngang 4.52cm · cao 16.66cm · trước-sau -4.02cm · conf=khoá

## 4. Khung đường kinh
Đoạn **cang-chan** — vùng: mặt trong cẳng chân. Ranh mô: sát bờ sau xương chày, trước cơ dép
Các huyệt trong đoạn: SP5 → SP6 → SP7 → SP8 → SP9

## 5. Cốt độ
Đoạn SP/cang-chan: **13 thốn** từ SP5 (MALLEOLUS_MED) đến SP9 (TIBIA_MED_CONDYLE).
1 thốn tại chỗ ≈ **2.83cm** (đo dọc trục chi giữa hai mốc xương).
Huyệt này ở mốc **3 thốn**.
Cả đoạn: SP6=3, SP7=6, SP8=10

## 6. Hàng xóm cùng kinh (khoảng cách ĐO so với SÁCH ĐÒI)
- **SP5** Thương Khâu: đo thẳng 12.25cm, đo trên da 13cm — **sách đòi 3 thốn ≈ 8.49cm** → LỆCH 4.51cm
  > Ở chỗ lõm phía dưới – trước mắt cá chân trong, bờ trên gân cơ cẳng chân sau, sát khe khớp gót – sên – thuyền.
- **SP7** Lậu Cốc: đo thẳng 9.55cm, đo trên da 13.7cm — **sách đòi 3 thốn ≈ 8.49cm** → LỆCH 5.21cm
  > Ở chỗ lõm sát bờ sau trong xương chày, từ đỉnh cao của mắt cá trong đo thẳng lên 6 thốn.

## 7. Huyệt lân cận khác kinh (bán kính 4cm) — dùng để bắt CHẬP HUYỆT và sai vùng
- KI7 Phục Lưu — 2.84cm
- KI8 Giao Tín — 2.97cm

## 8. Cấu trúc giải phẫu gần nhất trên mesh atlas
- Cơ gan chân trái (muscle) — 0.71cm
- Cơ dép trái (muscle) — 0.86cm
- Gân gót trái (connective) — 1.04cm
- Cơ gấp các ngón chân dài trái (muscle) — 1.27cm
- Cơ chày sau trái (bone) — 2.46cm

## 9. Cờ mà các bộ kiểm máy đã bắn
- RẢI DỌC ĐƯỜNG dời 6.35cm (conf=khoá)
- XA ĐƯỜNG KINH 6.33cm
- ÉP LÊN DA dời 2.6cm
- AUDIT cờ soát: TẦNG DA: ép lên da, dời 2.6cm · RẢI DỌC ĐƯỜNG: dời 6.35cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt
- TỪ ĐIỂN APP kêu: dọc "MALLEOLUS_MED" đòi 3 thốn, đo được 3  (lệch 0.01cm)
- ATLAS FOCKS kêu: dọc "MALLEOLUS_MED" đòi 3 thốn, đo được 3  (lệch 0.01cm)

## 10. Đã ghi CÒN NGỜ trong sổ
Loại: khe, da, duong
nằm trong lòng xương — phải lùi ra mặt xương · TẦNG DA: ép lên da, dời 2.6cm · RẢI DỌC ĐƯỜNG: dời 6.35cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt
