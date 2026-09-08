# HỒ SƠ HUYỆT LU6 — Khổng Tối (Focks: KHỔNG TỐI)

Kinh LU (Phế), huyệt thứ 6. Hạng nghiệm thu: **C** — chưa vào sổ

## 1. Nguồn chữ
**Từ điển app:** Ở bờ ngoài cẳng tay, trên cổ tay 7 thốn, nơi gặp nhau của bờ trong cơ ngửa dài hay bờ ngoài của cơ gan tay to với đường ngang trên khớp cổ tay 7 thốn, trên đường thẳng nối huyệt Xích Trạch (P 5) và Thái Uyên (P 9).

**Atlas Focks — vị trí:** Trên đường nối giữa huyệt Xích trạch (Lu 5) (nếp gấp khuỷu tay) và huyệt Thái uyên (Lu 9) (nếp cổ tay), cách Xích trạch (Lu 5) 5 thốn và cách Thái uyên (Lu 9) 7 thốn.

**Atlas Focks — cách xác định:** Hơi uốn cong cánh tay để thấy gân bắp tay. Chia đôi khoảng cách giữa huyệt Xích trạch (Lu 5) (ở nếp gấp khuỷu tay, trên mặt hướng tâm của gân cơ nhị đầu) và huyệt Thái uyên (Lu 9) (nếp cổ tay,ngoài động mạch quay ở khe cổ tay). Tiếp theo, tìm điểm giữa của khoảng cách giữa Lu 5 và Lu 9; huyệt Khổng tối dịch về phía khuỷu tay, cách điểm này 1 thốn. Huyệt Khích môn (Pe 4) dịch từ trung điểm về phía cổ thay 1 thốn, nằm giữa các gân.

**WHO 2008:** (chưa thu thập — agent thư lại điền)

## 2. Ảnh atlas — BẰNG CHỨNG MẠNH NHẤT, phải ĐO chứ đừng chỉ tả
- /Users/truongtrang/Desktop/kinhlacc-atlas-hinh/LU6_p12_0.jpeg

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
1. `node do-anh-atlas.cjs LU6 --luoi` → toạ độ pixel của mọi chấm huyệt trên trang (chấm ĐỎ =
   huyệt của trang này, chấm ĐEN = các huyệt vẽ kèm).
2. Mở ảnh bằng công cụ Read, gán nhãn cho từng toạ độ pixel (máy tách được chấm nhưng không đọc được chữ).
3. Chọn HAI huyệt làm mốc mà bản vẽ có và mesh cũng có, chiếu huyệt đang xét lên đoạn nối chúng:
   `t = ((X−A)·(B−A)) / |B−A|²` tính trên pixel.
4. `node doi-chieu-ti-le.cjs LU6 <A> <B> --anh <t vừa tính>` → in ngay chênh lệch quy ra cm.
Đây là phép kiểm ĐỘC LẬP với cốt độ và với mốc xương, tức độc lập với chính engine đã dựng toạ độ.

## 3. Toạ độ engine đang dựng
x=0.1297 y=0.5934 z=0.0102  →  ngang 22.3cm · cao 102.01cm · trước-sau 1.75cm · conf=cao

## 4. Khung đường kinh
Đoạn **cang-tay** — vùng: mặt trước-ngoài cẳng tay. Ranh mô: bờ ngoài gân cơ gan tay dài, sát bờ trong xương quay, cạnh động mạch quay
Các huyệt trong đoạn: LU5 → LU6 → LU7 → LU8 → LU9

## 5. Cốt độ
Đoạn LU/cang-tay: **12 thốn** từ LU9 (WRIST) đến LU5 (CUBITAL).
1 thốn tại chỗ ≈ **2.01cm** (đo dọc trục chi giữa hai mốc xương).
Huyệt này ở mốc **7 thốn**.
Cả đoạn: LU6=7, LU7=1.5, LU8=1

## 6. Hàng xóm cùng kinh (khoảng cách ĐO so với SÁCH ĐÒI)
- **LU5** Xích Trạch: đo thẳng 10.15cm, đo trên da 11.3cm — **sách đòi 5 thốn ≈ 10.05cm** → LỆCH 1.25cm
  > Gấp nếp khuỷu tay lại, huyệt ở chỗ lõm bờ ngoài gân cơ nhị đầu cánh tay, bờ trong phần trên cơ ngửa dài, cơ cánh tay trước.
- **LU7** Liệt Khuyết: đo thẳng 11.17cm, đo trên da 13.1cm — **sách đòi 5.5 thốn ≈ 11.05cm** → LỆCH 2.05cm
  > Dưới đầu xương quay nối với thân xương, cách lằn chỉ ngang cổ tay 1,5 thốn. Hoặc chéo 2 ngón tay trỏ và ngón tay cái của 2 bàn tay với nhau, huyệt ở chỗ lõm ngay dưới đầu ngón tay trỏ.

## 7. Huyệt lân cận khác kinh (bán kính 4cm) — dùng để bắt CHẬP HUYỆT và sai vùng
- (không có)

## 8. Cấu trúc giải phẫu gần nhất trên mesh atlas
- Cơ gấp cổ tay quay trái (muscle) — 0.17cm
- Cơ gan tay dài trái (muscle) — 0.95cm
- Cơ gấp các ngón nông trái (muscle) — 0.95cm
- Cơ gấp các ngón sâu trái (muscle) — 1.61cm
- Đầu cánh tay của cơ gấp cổ tay trụ trái (muscle) — 2.86cm

## 9. Cờ mà các bộ kiểm máy đã bắn
- RẢI DỌC ĐƯỜNG dời 4.22cm (conf=cao)
- XA ĐƯỜNG KINH 3.99cm
- AUDIT cờ soát: khe cách chỗ cốt độ chỉ ra 3.6 cm (trần 3.1 cm) — giữ nguyên toạ độ cũ, cần soát · RẢI DỌC ĐƯỜNG: dời 4.22cm v
- TỪ ĐIỂN APP kêu: dọc "WRIST" đòi 7 thốn, đo được 7  (lệch 0.01cm)
- ATLAS FOCKS kêu: dọc "LU5" đòi 5 thốn, đo được 4.87  (lệch 0.26cm)

## 10. Đã ghi CÒN NGỜ trong sổ
Loại: khe, duong
khe cách chỗ cốt độ chỉ ra 3.6 cm (trần 3.1 cm) — giữ nguyên toạ độ cũ, cần soát · RẢI DỌC ĐƯỜNG: dời 4.22cm về đường kinh — toạ độ cũ sai nhiều, nên soát mắt · RẢI DỌC ĐƯỜNG: dời 4.22cm v
