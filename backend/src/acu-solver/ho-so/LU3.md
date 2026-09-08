# HỒ SƠ HUYỆT LU3 — Thiên Phủ (Focks: THIÊN PHỦ)

Kinh LU (Phế), huyệt thứ 3. Hạng nghiệm thu: **C** — chưa vào sổ

## 1. Nguồn chữ
**Từ điển app:** Ở bờ trong bắp cánh tay trong, dưới nếp nách trước 3 thốn nơi bờ ngoài cơ 2 đầu cánh tay, trên huyệt Xích Trạch 6 thốn.

**Atlas Focks — vị trí:** Ở mặt trong trên cánh tay, cách 3 thốn so với đầu cùng điểm tận cùng nếp nách trước, bên rãnh cơ nhị đầu.

**Atlas Focks — cách xác định:** Để bắp tay co (gồng cơ nhị đầu) chống lại lực cản. Tìm huyệt Thiên phủ (Lu 3) ở chỗ lõm trên rãnh cơ nhị đầu ngoài, cách đầu nách trước 3 thốn. Đôi khi, có thể cảm nhận được mạch đập (động mạch cánh tay). Hoặc: Chia khoảng cách giữa nếp gấp nách và nếp gấp khuỷu tay (Xích trạch - Lu 5) thành ba phần. huyệt Thiên phủ (Lu 3) nằm ở điểm 1/3 của đường nối tính từ nếp nách. Huyệt Hiệp bạch (Lu 4) cách huyệt Thiên phủ (Lu 3) 1 thốn. Huyệt Thiên tuyền (Pe 2) nằm giữa 2 đầu của cơ nhị đầu cánh tay cách nếp nách 2 thốn.

**WHO 2008:** (chưa thu thập — agent thư lại điền)

## 2. Ảnh atlas — BẰNG CHỨNG MẠNH NHẤT, phải ĐO chứ đừng chỉ tả
- /Users/truongtrang/Desktop/kinhlacc-atlas-hinh/LU3_p9_0.jpeg

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
1. `node do-anh-atlas.cjs LU3 --luoi` → toạ độ pixel của mọi chấm huyệt trên trang (chấm ĐỎ =
   huyệt của trang này, chấm ĐEN = các huyệt vẽ kèm).
2. Mở ảnh bằng công cụ Read, gán nhãn cho từng toạ độ pixel (máy tách được chấm nhưng không đọc được chữ).
3. Chọn HAI huyệt làm mốc mà bản vẽ có và mesh cũng có, chiếu huyệt đang xét lên đoạn nối chúng:
   `t = ((X−A)·(B−A)) / |B−A|²` tính trên pixel.
4. `node doi-chieu-ti-le.cjs LU3 <A> <B> --anh <t vừa tính>` → in ngay chênh lệch quy ra cm.
Đây là phép kiểm ĐỘC LẬP với cốt độ và với mốc xương, tức độc lập với chính engine đã dựng toạ độ.

## 3. Toạ độ engine đang dựng
x=0.0969 y=0.7603 z=0.0176  →  ngang 16.66cm · cao 130.7cm · trước-sau 3.03cm · conf=cao

## 4. Khung đường kinh
Đoạn **canh-tay** — vùng: mặt trước-ngoài cánh tay. Ranh mô: bờ ngoài cơ nhị đầu cánh tay
Các huyệt trong đoạn: LU2 → LU3 → LU4 → LU5

## 5. Cốt độ
Đoạn LU/canh-tay: **9.3 thốn** từ LU5 (undefined) đến LU2 (undefined).
1 thốn tại chỗ ≈ **?cm** (đo dọc trục chi giữa hai mốc xương).
Huyệt này ở mốc **6 thốn**.
Cả đoạn: LU3=6, LU4=5

## 6. Hàng xóm cùng kinh (khoảng cách ĐO so với SÁCH ĐÒI)
- **LU2** Vân Môn: đo thẳng 11.4cm, đo trên da 12cm — **sách đòi 3.3000000000000007 thốn**
  > Bờ dưới xương đòn gánh, nơi chỗ lõm ngang cơ ngực to, giữa cơ Delta, nơi có gian sườn 1, cách đường ngực 06 thốn, trên huyệt Trung Phủ 1,6 thốn.
- **LU4** Hiệp Bạch: đo thẳng 3.4cm, đo trên da 4.6cm — **sách đòi 1 thốn**
  > Ở mặt trong cánh tay, nơi gặp nhau của bờ ngoài cơ 2 đầu cánh tay với đường ngang dưới đầu nếp nách trước 4 thốn, trên khớp khuỷu (Xích Trạch) 5 thốn, dưới huyệt Thiên Phủ 1 thốn.

## 7. Huyệt lân cận khác kinh (bán kính 4cm) — dùng để bắt CHẬP HUYỆT và sai vùng
- LI14 Tý Nhu — 3.3cm
- LU4 Hiệp Bạch — 3.4cm
- GB22 Uyên Dịch — 3.67cm

## 8. Cấu trúc giải phẫu gần nhất trên mesh atlas
- Phần ức sườn của cơ ngực lớn trái (muscle) — 2.59cm
- Phần bụng của cơ ngực lớn trái (muscle) — 2.65cm
- Đầu ngắn của cơ nhị đầu cánh tay trái (muscle) — 3cm
- Cơ răng trước trái (muscle) — 3.32cm
- Đầu dài của cơ nhị đầu cánh tay trái (muscle) — 3.38cm

## 9. Cờ mà các bộ kiểm máy đã bắn
- RẢI DỌC ĐƯỜNG dời 6.38cm (conf=cao)
- XA ĐƯỜNG KINH 5.62cm
- ÉP LÊN DA dời 4.3cm
- AUDIT cờ soát: bản Focks phân tích HỎNG (bắn lệch 20.5cm — quá xa để là bất đồng thật) — đã loại, giữ bản cũ · TẦNG DA: ép lê
- TỪ ĐIỂN APP kêu: dọc "LU5" đòi 6 thốn, đo được 5.77  (lệch 0.79cm)
- ATLAS FOCKS kêu: dọc "AXILLA_ANT" đòi 3 thốn, đo được 3.05  (lệch 0.16cm, SAI CHIỀU)

## 10. Đã ghi CÒN NGỜ trong sổ
Loại: da, duong
TẦNG DA: ép lên da, dời 4.3cm · RẢI DỌC ĐƯỜNG: dời 6.38cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt · TẦNG DA: ép lê
