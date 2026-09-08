# HỒ SƠ HUYỆT CV1 — Hội Âm (Focks: HỘI ÂM)

Kinh CV (Nhâm), huyệt thứ 1. Hạng nghiệm thu: **B** — conf=WHO-lấp, src=who

## 1. Nguồn chữ
**Từ điển app:** Giữa tiền âm và hậu âm (Giáp Ất) hoặc ở giữa bìu dái và hậu môn (đàn ông) hoặc ở đường sau của âm thần và hậu môn (phụ nữ), huyệt ở giữa nút đáy chậu (chỗ tụ hội của các nếp da chạy từ hậu môn, phần sinh dục ngoài và 2 bên háng tới).

**Atlas Focks — vị trí:** Ở giữa đáy chậu.

**Atlas Focks — cách xác định:** Ở phụ nữ: Nằm ở giữa hậu môn và mép sau môi âm hộ. Ở nam giới: Nằm ở giữa hậu môn và gốc bìu.

**WHO 2008:** (chưa thu thập — agent thư lại điền)

## 2. Ảnh atlas — BẰNG CHỨNG MẠNH NHẤT, phải ĐO chứ đừng chỉ tả
- /Users/truongtrang/Desktop/kinhlacc-atlas-hinh/CV1_p338_0.jpeg

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
1. `node do-anh-atlas.cjs CV1 --luoi` → toạ độ pixel của mọi chấm huyệt trên trang (chấm ĐỎ =
   huyệt của trang này, chấm ĐEN = các huyệt vẽ kèm).
2. Mở ảnh bằng công cụ Read, gán nhãn cho từng toạ độ pixel (máy tách được chấm nhưng không đọc được chữ).
3. Chọn HAI huyệt làm mốc mà bản vẽ có và mesh cũng có, chiếu huyệt đang xét lên đoạn nối chúng:
   `t = ((X−A)·(B−A)) / |B−A|²` tính trên pixel.
4. `node doi-chieu-ti-le.cjs CV1 <A> <B> --anh <t vừa tính>` → in ngay chênh lệch quy ra cm.
Đây là phép kiểm ĐỘC LẬP với cốt độ và với mốc xương, tức độc lập với chính engine đã dựng toạ độ.

## 3. Toạ độ engine đang dựng
x=-0.0016 y=0.492 z=0.0076  →  ngang -0.28cm · cao 84.57cm · trước-sau 1.31cm · conf=WHO-lấp

## 4. Khung đường kinh
Đoạn **bung-duoi** — vùng: đáy chậu → rốn. Ranh mô: trên đường trắng giữa bụng
Các huyệt trong đoạn: CV1 → CV2 → CV3 → CV4 → CV5 → CV6 → CV7 → CV8
Là NÚT MỐC loại "dau" tại null — Hội Âm — trung tâm đáy chậu

## 6. Hàng xóm cùng kinh (khoảng cách ĐO so với SÁCH ĐÒI)
- **CV2** Khúc Cốt: đo thẳng 7.25cm, đo trên da 9.8cm
  > Ở trên xương mu, dưới huyệt Trung Cực 1 thốn hoặc chỗ lõm ngay chính giữa bờ trên xương mu.

## 7. Huyệt lân cận khác kinh (bán kính 4cm) — dùng để bắt CHẬP HUYỆT và sai vùng
- (không có)

## 8. Cấu trúc giải phẫu gần nhất trên mesh atlas
- Xương chậu phải (bone) — 1.09cm
- Cơ mu trực tràng phải (muscle) — 1.45cm
- Xương chậu trái (bone) — 1.52cm
- Cơ thon phải (muscle) — 1.55cm
- Cơ khép bé phải (muscle) — 1.68cm

## 9. Cờ mà các bộ kiểm máy đã bắn
- ÉP LÊN DA dời 2.1cm
