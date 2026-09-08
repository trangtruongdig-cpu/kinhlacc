# HỒ SƠ HUYỆT LU4 — Hiệp Bạch (Focks: HIỆP BẠCH)

Kinh LU (Phế), huyệt thứ 4. Hạng nghiệm thu: **C** — chưa vào sổ

## 1. Nguồn chữ
**Từ điển app:** Ở mặt trong cánh tay, nơi gặp nhau của bờ ngoài cơ 2 đầu cánh tay với đường ngang dưới đầu nếp nách trước 4 thốn, trên khớp khuỷu (Xích Trạch) 5 thốn, dưới huyệt Thiên Phủ 1 thốn.

**Atlas Focks — vị trí:** Ở mặt trong của cánh tay trên, cách 4 thốn đầu cùng điểm tận cùng nếp nách trước, bên rãnh cơ nhị đầu.

**Atlas Focks — cách xác định:** Để bắp tay co (gồng cơ nhị đầu) chống lại lực cản. Sờ thấy huyệt Hiệp bạch (Lu 4) ở chỗ lõm trên rãnh cơ nhị đầu ngoài, cách đầu nách trước 4 thốn. Đôi khi, có thể cảm nhận được mạch đập (động mạch cánh tay). Hoặc: Nếp nách cách khuỷ tay (huyệt Xích trạch - Lu 5) 9 thốn. Chia đôi đoạn này và định vị khoảng 0,5 thốn (gần với trung tâm trên rãnh cơ nhị đầu ngoài), huyệt Hiệp bạch (Lu 4) trong ở chỗ lõm,. Huyệt Thiên phủ (Lu 3) nằm cách huyệt Hiệp bạch (Lu 4) 1 thốn.

**WHO 2008:** (chưa thu thập — agent thư lại điền)

## 2. Ảnh atlas — BẰNG CHỨNG MẠNH NHẤT, phải ĐO chứ đừng chỉ tả
- /Users/truongtrang/Desktop/kinhlacc-atlas-hinh/LU4_p10_0.jpeg

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
1. `node do-anh-atlas.cjs LU4 --luoi` → toạ độ pixel của mọi chấm huyệt trên trang (chấm ĐỎ =
   huyệt của trang này, chấm ĐEN = các huyệt vẽ kèm).
2. Mở ảnh bằng công cụ Read, gán nhãn cho từng toạ độ pixel (máy tách được chấm nhưng không đọc được chữ).
3. Chọn HAI huyệt làm mốc mà bản vẽ có và mesh cũng có, chiếu huyệt đang xét lên đoạn nối chúng:
   `t = ((X−A)·(B−A)) / |B−A|²` tính trên pixel.
4. `node doi-chieu-ti-le.cjs LU4 <A> <B> --anh <t vừa tính>` → in ngay chênh lệch quy ra cm.
Đây là phép kiểm ĐỘC LẬP với cốt độ và với mốc xương, tức độc lập với chính engine đã dựng toạ độ.

## 3. Toạ độ engine đang dựng
x=0.103 y=0.7437 z=0.0088  →  ngang 17.71cm · cao 127.84cm · trước-sau 1.51cm · conf=khoá

## 4. Khung đường kinh
Đoạn **canh-tay** — vùng: mặt trước-ngoài cánh tay. Ranh mô: bờ ngoài cơ nhị đầu cánh tay
Các huyệt trong đoạn: LU2 → LU3 → LU4 → LU5

## 5. Cốt độ
Đoạn LU/canh-tay: **9.3 thốn** từ LU5 (undefined) đến LU2 (undefined).
1 thốn tại chỗ ≈ **?cm** (đo dọc trục chi giữa hai mốc xương).
Huyệt này ở mốc **5 thốn**.
Cả đoạn: LU3=6, LU4=5

## 6. Hàng xóm cùng kinh (khoảng cách ĐO so với SÁCH ĐÒI)
- **LU3** Thiên Phủ: đo thẳng 3.4cm, đo trên da 4.6cm — **sách đòi 1 thốn**
  > Ở bờ trong bắp cánh tay trong, dưới nếp nách trước 3 thốn nơi bờ ngoài cơ 2 đầu cánh tay, trên huyệt Xích Trạch 6 thốn.
- **LU5** Xích Trạch: đo thẳng 16.73cm, đo trên da 19.4cm
  > Gấp nếp khuỷu tay lại, huyệt ở chỗ lõm bờ ngoài gân cơ nhị đầu cánh tay, bờ trong phần trên cơ ngửa dài, cơ cánh tay trước.

## 7. Huyệt lân cận khác kinh (bán kính 4cm) — dùng để bắt CHẬP HUYỆT và sai vùng
- GB22 Uyên Dịch — 1.25cm
- LU3 Thiên Phủ — 3.4cm
- GB23 Triếp Cân — 3.97cm

## 8. Cấu trúc giải phẫu gần nhất trên mesh atlas
- Đầu ngắn của cơ nhị đầu cánh tay trái (muscle) — 0.94cm
- Đầu dài của cơ nhị đầu cánh tay trái (muscle) — 1.56cm
- Cơ cánh tay trái (muscle) — 3.39cm
- Cơ răng trước trái (muscle) — 3.62cm
- Cơ quạ cánh tay trái (muscle) — 3.77cm

## 9. Cờ mà các bộ kiểm máy đã bắn
- RẢI DỌC ĐƯỜNG dời 5.8cm (conf=khoá)
- XA ĐƯỜNG KINH 5.5cm
- ÉP LÊN DA dời 3.8cm
- AUDIT cờ soát: bản Focks phân tích HỎNG (bắn lệch 27.4cm — quá xa để là bất đồng thật) — đã loại, giữ bản cũ · TẦNG DA: ép lê
- TỪ ĐIỂN APP kêu: dọc "LU3" đòi 1 thốn, đo được 0.9  (lệch 0.36cm)
- ATLAS FOCKS kêu: dọc "AXILLA_ANT" đòi 4 thốn, đo được 3.94  (lệch 0.2cm, SAI CHIỀU)

## 10. Đã ghi CÒN NGỜ trong sổ
Loại: da, duong
TẦNG DA: ép lên da, dời 3.8cm · RẢI DỌC ĐƯỜNG: dời 5.8cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt · TẦNG DA: ép lê
