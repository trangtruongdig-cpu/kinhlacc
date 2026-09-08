# HỒ SƠ HUYỆT PC1 — Thiên Trì (Focks: THIÊN TRÌ)

Kinh PC (Tâm Bào), huyệt thứ 1. Hạng nghiệm thu: **A** — Thiên Trì — ngang đầu vú, 5 thốn ngang (ngoài đầu vú 1 thốn). Dịch 4.2cm so toạ độ cũ

## 1. Nguồn chữ
**Từ điển app:** Ngang đầu ngực, cách 1 thốn, ở khoảng gian sườn 4, dưới hố nách 3 thốn, giữa huyệt Thiên Khê (Ty.18) và huyệt Nhũ Trung (Vi 17).

**Atlas Focks — vị trí:** Cách tâm núm vú 1 thốn về phía ngoài và hơi hướng lên trong khoang gian sườn 4 (ICR).

**Atlas Focks — cách xác định:** Tại khoang gian sườn thứ 4 ở mức núm vú. Sau đó xác định vị trí huyệt Thiên trì (Pe/P 1) cách núm vú 1 thốn (lưu ý: khoang gian sườn cong lên theo chiều ngang). Hoặc: Để định hướng chính xác ở vùng liên sườn, trước tiên hãy xác định vị trí khớp sụn cơ ức. Bên cạnh này là phần sụn sườn bám của xương sườn thứ 2, khoang gian sườn bên dưới là khoang gian sườn (ICR) thứ 2, sau đó đo 2 khoang gian sườn xuống dưới đến khoang gian sườn thứ 4, đường giữa ngực ra ngoài 5 thốn và xác định vị trí huyệt Thiên trì (Pe/P 1) ở đó. Cùng mức khoang liên sườn thứ tư là huyệt Đản trung (Ren 17) đường giữa ngực; huyệt Thần phong (Ni/KID 23) đường giữa ngực ra ngoài 2 thốn; huyệt Nhũ trung (Ma/ST 17) đường vú; huyệt Thiên khê (Mi/SP 18) đường giữa ngực ra ngoài 6 thốn; huyệt Uyên dịch (Gb 22) 3 thốn dưới đường giữa nách và huyệt Trấp cân (Gb 23) trước đường giữa nách 1 thốn.

**WHO 2008:** (chưa thu thập — agent thư lại điền)

## 2. Ảnh atlas — BẰNG CHỨNG MẠNH NHẤT, phải ĐO chứ đừng chỉ tả
- /Users/truongtrang/Desktop/kinhlacc-atlas-hinh/PC1_p236_0.png
- /Users/truongtrang/Desktop/kinhlacc-atlas-hinh/PC1_p236_1.jpeg

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
1. `node do-anh-atlas.cjs PC1 --luoi` → toạ độ pixel của mọi chấm huyệt trên trang (chấm ĐỎ =
   huyệt của trang này, chấm ĐEN = các huyệt vẽ kèm).
2. Mở ảnh bằng công cụ Read, gán nhãn cho từng toạ độ pixel (máy tách được chấm nhưng không đọc được chữ).
3. Chọn HAI huyệt làm mốc mà bản vẽ có và mesh cũng có, chiếu huyệt đang xét lên đoạn nối chúng:
   `t = ((X−A)·(B−A)) / |B−A|²` tính trên pixel.
4. `node doi-chieu-ti-le.cjs PC1 <A> <B> --anh <t vừa tính>` → in ngay chênh lệch quy ra cm.
Đây là phép kiểm ĐỘC LẬP với cốt độ và với mốc xương, tức độc lập với chính engine đã dựng toạ độ.

## 3. Toạ độ engine đang dựng
x=0.0485 y=0.7412 z=0.0707  →  ngang 8.34cm · cao 127.41cm · trước-sau 12.15cm · conf=mốc

## 4. Khung đường kinh
Đoạn **canh-tay** — vùng: thành ngực bên → mặt trước cánh tay. Ranh mô: rãnh giữa cơ nhị đầu và cơ quạ-cánh tay
Các huyệt trong đoạn: PC1 → PC2 → PC3
Là NÚT MỐC loại "dau" tại NIPPLE — Thiên Trì — mốc theo đầu vú

## 6. Hàng xóm cùng kinh (khoảng cách ĐO so với SÁCH ĐÒI)
- **PC2** Thiên Tuyền: đo thẳng 17.44cm, đo trên da 20cm
  > Dưới đầu nếp nách trước, cách 2 thốn, giữa 2 cơ phần ngắn và cơ phần dài của cơ nhị đầu cánh tay.

## 7. Huyệt lân cận khác kinh (bán kính 4cm) — dùng để bắt CHẬP HUYỆT và sai vùng
- ST17 Nhũ Trung — 1.21cm
- ST18 Nhũ Căn — 3.21cm
- SP18 Thiên Khê — 3.69cm

## 8. Cấu trúc giải phẫu gần nhất trên mesh atlas
- Phần ức sườn của cơ ngực lớn trái (muscle) — 0.54cm
- Sụn sườn 5 trái (bone) — 2.62cm
- Xương sườn 5 trái (bone) — 2.74cm
- Cơ gian sườn trong (muscle) — 2.94cm
- Cơ gian sườn ngoài (muscle) — 3.26cm

## 9. Cờ mà các bộ kiểm máy đã bắn
- TỪ ĐIỂN APP kêu: dọc "NIPPLE" đòi 3 thốn, đo được 0.39  (lệch 4.39cm)
- ATLAS FOCKS kêu: dọc "NIPPLE" đòi 1 thốn, đo được 0.39  (lệch 1.03cm)
