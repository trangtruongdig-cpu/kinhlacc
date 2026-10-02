# Bộ Luận Giải — đọc một bài thuốc như luận một quẻ

Ngày: 02/10/2026 · Trạng thái: **THIẾT KẾ — đã chốt người đọc, cách làm và thứ tự làm** ·
Đứng trên `2026-10-02-do-thi-tri-thuc-thap-va-truc-ngang.md` (đồ thị cho biết CÁI GÌ nối CÁI GÌ;
tài liệu này nói VÌ SAO) — không thay thế nó.

## 1. Yêu cầu của người dùng (nguyên văn, 02/10/2026)

> Nếu chúng ta tìm ra khoảng trống và nhu cầu tìm kiếm thực sự của khách hàng mà chỉ làm theo
> kiểu viết bài và chờ index lấy traffic thì chẳng phải đây là 1 kiểu website hứng truy cập để
> lấy tiền quảng cáo hay sao. Tầm nhìn của tôi ở chỗ khác.
>
> Tra cứu 1 vị thuốc, 1 huyệt, 1 chứng trạng… website như 1 bác sỹ bách khoa toàn thư […] để có
> thể biết được tôi bệnh nhân chảy máu cam thì có thể uống những vị thuốc gì? Tại sao uống vị đó
> thì khỏi? có bao nhiêu trường hợp thì uống được? trường hợp nào thì không?

Và sau khi bác bản thiết kế đầu:

> Chắc phải làm như quẻ bói và luận giải thì mới đúng hướng tôi mong muốn được. Bắt đầu từ 1 bài
> thuốc, 1 vị thuốc. Bài thuốc này chữa được gì vì sao? từng vị có tác dụng gì? cả bài có tác
> dụng gì?.. Giống như quẻ bói luận quẻ.

## 2. ⚠️ Bản thiết kế ĐẦU đã bị bác — ghi lại để không ai đề xuất lại

Bản đầu gom tập thực thể cùng trị một chứng rồi **đếm trên quần thể**: "34 vị trị chảy máu cam,
25/34 tính Hàn hoặc Lương, quy Can 25 · Phế 24 · Tâm 13". Số liệu đó đúng và vẫn dùng được ở chỗ
khác, nhưng nó **thống kê trên một nhóm**, không ĐỌC được một đối tượng. Người dùng bác đúng.

**Luận quẻ thì ngược**: trước mặt là MỘT quẻ, đọc theo cấu trúc bên trong — từng hào có nghĩa
riêng, thượng/hạ quái hợp lại, rồi cả quẻ thành một lời. Và người luận **không suy ra** nghĩa của
hào từ nguyên lý, họ **tra** nó trong kinh văn rồi **ráp** và liên hệ.

Áp vào đây thì khớp từng chỗ:

| Luận quẻ | Luận bài thuốc |
|---|---|
| một quẻ | một bài thuốc |
| từng hào | từng vị thuốc |
| vị trí hào làm nên nghĩa | **quân – thần – tá – sứ** |
| thượng quái / hạ quái | thế của cả bài (hàn-nhiệt · thăng-giáng · quy kinh) |
| kinh văn tra hào | tính–vị–quy kinh–công năng ĐÃ CHÉP |
| **hào biến: quẻ A → quẻ B, đọc cặp** | **bài gốc → bài gia giảm, đọc chỗ biến** |

Nên **đơn vị đầu ra là MỘT đối tượng, đọc theo trình tự cố định**, không phải một bảng tổng hợp
trên nhiều đối tượng.

## 3. Số đo thật (đo 02/10/2026 trên `defaultdb`)

### Chất liệu để đọc — tốt

| | |
|---|---|
| `phuong_thang` | 13.942 bài · 13.889 có thành phần · trung bình **8,2 vị/bài** |
| ô (bài × vị) | 114.558 · **91.455 (80%) nối được về `vi_thuoc`** |
| trong 80% đó | **100% đọc ra `tinh`, 100% đọc ra `quy_kinh`** |
| liều | 88.444 ô (77%) · **95% parse ra gam** |
| bài tự khai trị gì (`tac_dung`) | **13.911/13.942 = 99,8%** |
| xuất xứ | 13.937/13.942 |
| cạnh lần ngược sách (`nguon_phuong_thang`) | 13.939/13.942 |
| `vi_thuoc` tinh · vi · quy_kinh | **95% · 95% · 92%** |
| vị có kiêng kỵ | 715/1.045 = **68%** |

### Biến quẻ — 31% và đó là SÀN

**4.381/13.942 (31%)** bài có tên bắt đầu bằng tên một bài khác có thật trong kho; **1.865 bài
gốc** sinh biến thể. Gốc sinh nhiều nhất: Tứ Vật Thang 37 · An Thần Hoàn 32 · Hoàng Kỳ Thang 21 ·
Nhị Trần Thang 20 · Tiêu Dao Tán 17 · Bát Trân Thang 14.

⚠️ **31% là SÀN.** Phép chuẩn hoá lúc đo dùng `NFD` + `[^a-z0-9\s]` nên **ăn mất chữ `đ`**
("Địa" → "ia", "Độc" → "oc"), tức đang đếm thiếu. Bản dựng thật phải map `đ → d` tường minh.

Ghi chú cũ của người dùng khớp với chỗ này: *"vị **gia** mới là linh hồn của phương"*.

### Thế của bài trên trục hàn/nhiệt — một trục là KHÔNG ĐỦ

Chỉ tính bài có ≥3 vị định được cực:

| Thế | Số bài | Luận được bằng tổng số? |
|---|---|---|
| thuần ấm | 1.961 | ✓ |
| thuần lạnh | 573 | ✓ |
| trộn **có chủ** (≥70% một bên) | 4.169 | ✓ — bên trội là pháp chính, bên kia là **tá chế** |
| trộn **cân bằng** (<70%) | **4.216** | ✗ cần vai trò / liều có trọng số |

→ **6.703 bài luận được mà KHÔNG cần biết vai trò.** Việc chấm vai trò vì thế không phải việc
của cả kho, mà nhắm vào nhóm 4.216 — một con số có đáy, còn chia nhỏ tiếp theo độ nổi tiếng.

### Vai trò quân–thần–tá–sứ — gần như trống

`bai_thuoc_chi_tiet.vai_tro` tồn tại (model ghi chú "Quân, Thần, Tá, Sứ...") nhưng chỉ
**112/4.210 dòng = 2,7%**, phủ **20 bài** trên 706. Phân bố: tá 51 · thần 29 · quân 22 · sứ 10.

Ba tín hiệu suy vai trò, đã đo:

| Tín hiệu | Phủ |
|---|---|
| **tên bài chứa tên vị, xếp theo VỊ TRÍ trong tên** | **4.012 bài (29%)** — 3.383 một ứng viên + 629 nhiều ứng viên |
| liều trội ≥2× trung vị | 4.680 bài (34%) |
| quy ước sứ (Cam Thảo / Sinh Khương / Đại Táo) | 3.875 bài (28%) |

⚠️ **Liều một mình KHÔNG định được quân.** Bài #7183 *Ma Hoàng Thang II*: chín vị **cùng đúng
80g** (cổ phương ghi "各四兩"), Phục linh 120g, Ma hoàng chỉ 40g. Lấy "quân = liều lớn nhất" thì
máy chọn **Phục linh** làm quân của một bài tên là **Ma Hoàng Thang**. Chỉ 589 bài (4%) có liều
đồng loạt bằng nhau, nhưng cái bẫy nằm ở chỗ tín hiệu liều **trông như** luôn dùng được.

⚠️ **Phải xếp theo VỊ TRÍ trong tên, không chỉ khớp có/không.** Lượt đo đầu chỉ lấy "đúng một
khớp" nên *Thược Dược Cam Thảo Thang Gia Vị* ra quân = **Cam Thảo** (sai). Xếp theo vị trí thì
đúng: *Quế Chi Gia Thược Dược Đại Hoàng Thang* → quân Quế chi; *Thược Dược Tri Mẫu Thang* → quân
Thược dược.

## 4. ⚠️ Thăng–giáng–phù–trầm: ĐỌC thì 15/15, SUY thì 53% — đừng lặp lại phép suy

Trục này **không có cột nào** trong CSDL. Có hai đường lấy, và chúng cho kết quả khác hẳn nhau.

**Đường SAI — suy từ tính và vị** theo luật Bản Thảo Cương Mục (khí dương + vị dương → thăng phù;
khí âm + vị âm → trầm giáng). Đã viết, đã đo, **không dùng được**:

| Vị | Luật suy | Sách |
|---|---|---|
| **Sài Hồ** | trầm giáng | **thăng tán** ✗ |
| **Thăng Ma** | không phân định | **thăng** ✗ |
| **Cát Căn** | không phân định | **thăng** ✗ |
| **Tô Tử** | thăng phù | **giáng khí** (nó là HẠT) ✗ |
| **Hạnh Nhân** | không phân định | **giáng khí** ✗ |

~8 đúng / 4 sai / 3 không phán trên 15 ca = **53%**, chỉ hơn tung đồng xu. Và phân bố cả kho ra
**51% thăng phù so với 9% trầm giáng** — tỉ lệ 5:1 không thể đúng với một bộ bản thảo; đó là
**thiên lệch hệ thống** vì vị "Cam" rất phổ biến mà luật tính nó là dương.

**Đường ĐÚNG — đọc chiều từ lời công năng đã chép.** "giáng khí", "thăng dương", "phát tán giải
biểu", "thu liễm", "tiềm dương" là **sự kiện đã chép**, không phải suy diễn. Đo trên cùng 15 ca:

```
Thăng Ma thăng ✓   Tô Tử giáng ✓   Bán Hạ giáng ✓   Sài Hồ thăng ✓
Mẫu Lệ giáng ✓     Cát Cánh thăng ✓   Bạc Hà thăng ✓   Thạch Quyết Minh giáng ✓
Cát Căn · Ma Hoàng · Hoàng Kỳ · Hạnh Nhân · Đại Hoàng · Chỉ Thực · Ngưu Tất → "cả hai"
⇒ 15 đúng · 0 SAI
```

Tính chất đáng giá không phải con số 15 mà là **0 lần phán ngược**: nó hoặc nói đúng, hoặc nói
"cả hai", không bao giờ nói Sài Hồ là trầm giáng. Và "cả hai" là câu trả lời **thật** — Ma Hoàng
vừa tán biểu (thăng) vừa lợi thuỷ (giáng).

Phủ: **258 vị (25%) có chiều nói rõ trong chữ** (52 thăng · 177 giáng · 29 cả hai).

⚠️ `bo_phan_dung` phủ **1045/1045 = 100%** và gỡ thêm được 369 vị (hạt/quả/rễ/khoáng → giáng;
hoa/lá/cành → thăng), đưa tổng lên 627/1.045 = 60%. **NHƯNG nhánh đó chưa được phép kiểm nào
chạm tới** — cả 15 ca trên đều lấy nhãn từ phần chữ. → **Nhánh chữ BẬT; nhánh bộ phận dùng NẰM
IM cho tới khi có bộ đáp án riêng của nó.**

## 5. Trình tự luận một bài thuốc — tám bước, cố định

| | Bước | Chất liệu · phủ |
|---|---|---|
| 0 | **Biến quẻ** — bài có gốc trong kho không? Có thì **luận gốc trước, rồi đọc chỗ biến** | ≥31% |
| 1 | Tên và xuất xứ — bài này ở sách nào | 13.937 |
| 2 | **Lời bài tự khai** trị gì | 13.911 |
| 3 | **Mổ từng hào** — tên · liều · tính · vị · **chiều** · quy kinh · công năng · vai trò nếu định được | 80% ô |
| 4 | **Thế của bài trên BA trục** — hàn/nhiệt · thăng/giáng · quy kinh | mục 3 |
| 5 | **Tổng luận** — bảng tra tính×vị → bát pháp, có trọng số liều và vai trò | suy từ 3+4 |
| 6 | **Chỗ phải dè** — CHỈ từ `kieng_ky`, **tự khai không phải màn sàng an toàn** | 68% |
| 7 | **Lần ngược sách** | 13.939 |

Bước 5 không khó như trông: **tính × vị → bát pháp là một bảng ĐÓNG** cổ nhân lập sẵn (Ôn+Tân →
phát hãn · Hàn+Khổ → thanh · Cam+Bình → bổ hoà · Khổ Hàn+quy Đại Trường → hạ). Năm tính nhân năm
vị, hết. Chỗ khó là **thế của bài có bị trộn hay không** (mục 3).

Bảng đó **nằm cùng chỗ với bảng luật**, trong `backend/src/data/luat-luan-giai.ts`, và **mỗi ô
phải dẫn nguồn** như mọi điều luật khác — không hằng số nào được nằm rải trong mã. Nó do người
khai, không do mô hình sinh.

**Luận một vị thuốc** dùng cùng trình tự, khác chất liệu, và thêm hai bước đếm được mà sách không
in sẵn:

- **vị này hay đi cùng vị nào** — đếm đồng xuất hiện trên 13.889 bài. Phép đếm đó tự tìm ra các
  cặp kinh điển (Ma Hoàng–Quế Chi, Hoàng Cầm–Hoàng Liên, Đương Quy–Xuyên Khung); vì chúng đã nổi
  tiếng, chúng cũng là **phép kiểm cho chính phép đếm**.
- **vị này đứng quân ở bài nào, đứng tá sứ ở bài nào** — phân bố vai trò là tính cách của vị thuốc.

## 6. Nghiệm thu nền móng: 13.911 bài có đáp án in kèm

Bước 5 rút ra pháp trị. Bước 2 là **lời bài tự khai**. Hai cái đó **so được với nhau**.

- **Khớp** → lời luận đứng được, và đó chính là câu "vì sao".
- **Lệch** → **hiện ra, không che.** Hoặc máy luận sai, hoặc dữ liệu bài sai — cả hai đều đáng biết.

Đây là bộ nghiệm thu quy mô kho, cùng tinh thần với phép kiểm vàng của phép đo kinh lạc: **neo
vào ví dụ đã có lời giải in trong sách**. Tỉ lệ khớp phải đo và ghi lại ở lượt đầu, rồi mọi lần
sửa phải so với số đó.

## 7. Ba luật chịu lực

1. **ĐỌC, không SUY.** Đã đo: đọc 15/15 · suy 53% và sai cả Sài Hồ. Mọi trục mới phải tìm đường
   đọc trước khi nghĩ đến đường suy.
2. **Phép dò chưa đo tỉ lệ đúng thì chưa được bật.** Nhánh bộ phận dùng (369 vị) nằm im. Cùng lý
   lẽ với "chưa đo tỉ lệ đúng của một phép dò thì chưa được cho nó tự sửa" — phép dò dấu câu từng
   vu oan 2.604 lượt.
3. **Không phán còn hơn phán sai.** "Cả hai" · "chưa định được vai trò" · "trộn cân bằng, không
   luận được bằng tổng số" đều là đầu ra **hợp lệ**. Bài tắc cả hai trục thì **nói là tắc**.

   ⚠️ Lượt đo 02/10 có ra một con số cho nhóm "tắc cả hai trục" (3.070/4.216), nhưng nó tính bằng
   chính **phép suy chiều đã bị loại ở mục 4**, nên **không dùng được**. Số thật phải đo lại bằng
   chiều ĐỌC, ở GĐ 0. Ghi lại ở đây vì một con số vô hiệu để trong tài liệu còn nguy hơn không có
   số nào: sáu tuần sau không ai nhớ nó sinh ra từ đâu.

## 8. Thành phần

```
đích luận (một bài thuốc / một vị thuốc)
   │ GomHao — chỉ cạnh CÓ THẬT; khai rõ KHÔNG GIAN ID của hai đầu mỗi cạnh
   ▼
Hào[] { vị, liều, tính, vị, chiều, quy kinh, công năng, vai trò?, nguồn nhãn }
   │ TheCuaBai — ba trục; giữ cả nhóm thiểu số, KHÔNG làm tròn đi
   ▼
The { hànNhiệt, thăngGiáng, quyKinh, ngoạiLệ[] }
   │ TongLuan — bảng tra tính×vị → bát pháp, trọng số liều/vai trò
   ▼
KetQuaLuan { hào[], thế, pháp trị rút ra, đối chiếu lời tự khai, chỗ phải dè, nguồn[] }
   │ DungLoi
   ├──► mặt NGHỀ (/app) — thuật ngữ đầy đủ, bảng thô
   └──► mặt CÔNG KHAI (trang tĩnh) — giọng tra cứu y văn, KHÔNG khuyên ai uống gì
```

- `GomHao` là **chỗ duy nhất** chạm cạnh. Dùng lại kỷ luật khai không gian id của
  `backend/tmp/do-do-thi-tri-thuc.mjs`: bẫy hai không gian id huyệt cho ra 432 dòng sai mà **không
  một lỗi nào**.
- `TheCuaBai`, `TongLuan` là **hàm thuần, không I/O** → kiểm riêng được.
- **Bảng luật đặt trong MÃ**, không trong CSDL: `backend/src/data/luat-luan-giai.ts`. Tiền lệ sẵn
  (`thuong-han-chuan.ts`, `nhht-cong-thuc.ts`). Trong git thì sửa có vết, có người duyệt, và không
  trôi lặng — bộ luật văn phong của bot từng bị **sửa tay trong CSDL rồi mất ở lượt chạy sau**.
- `KetQuaLuan` là **hợp đồng**; hai bộ dựng lời mỏng. Thêm mặt thứ ba không phải sửa phép luận.

⚠️ **MỘT bản sao duy nhất của lõi.** Repo đã chảy máu vì nhân bản: *"BA bản sao thuật toán phải
sửa đồng thời"* với phép đo kinh lạc, và `cms/src/lib/khung-blog.mjs` là bản chép tay. Lõi phải
chạy ở cả backend (`/app`, API) và khâu build trang tĩnh. **Chưa đo được** SWC có nhập trơn một
module ES không phụ thuộc hay không — đó là **việc đo ĐẦU TIÊN** của khâu thực thi. Không trơn thì
chọn lại chỗ đặt, **không** chép bản thứ hai.

## 9. Lỗi dữ liệu đã bắt được — ghi lại, không sửa trong phạm vi này

- **`phap_tri.chung_trang` có trong model mà KHÔNG có trong CSDL.** Dư âm "migration tách bảng
  Step 6 còn dở"; SWC không kiểm kiểu nên không ai biết.
- **`phap_tri` có đủ 16 ô luận chứng, 12 ô RỖNG TRƠN (0/380)** — gồm cả `y_nghia_co_che`,
  `bat_cuong`, `bat_phap`, `luc_dam`, `am_duong`, `ton_thuong`, `tac_nhan`, `ban_chat`,
  `vi_tri_tien_trinh`, `mach_chan`, `chat_luoi`, `nguyen_nhan`. Chỉ `nguyen_tac` 98,7% ·
  `luc_kinh` 94,5% · `trieu_chung_mo_ta` 71,8% có chữ. Ai đó đã dựng bảng cho đúng tầm nhìn này
  rồi chưa nạp.
- **`thanh_phan` lẫn thứ không phải vị thuốc**: "Sắc uống." 3.873 · "Tán bột." 1.648 · "Sắc uống
  ấm." 165 · và liều rơi vào ô TÊN ("40g" 307 · "80g" 140 · "20g" 135) ≈ 900 ô lệch cột.
- **`vi_thuoc_ten_goi_khac` chỉ có 96 dòng** — quá mỏng. Tên thật bị coi là không khớp:
  **Bạch linh 404** (=Phục Linh) · Tân lang 243 · Xích linh 187 · **Quy vĩ 130 / Quy thân 124**
  (=phần của Đương Quy) · Bạch cương tằm 115 · Cam cúc hoa 93 · Đơn sâm 74.
- ⚠️ **Trục ĐỘC gần như không được ghi: 6/1045 vị** có chữ "độc" trong cột `vi`. Với bộ bản thảo
  1.045 vị thì con số đó không thể đúng. Bằng chứng: **Khinh Phấn** (thuỷ ngân clorua) xuất hiện
  **150 lượt** trong thành phần các bài mà **không có mặt trong bảng `vi_thuoc`**.
  → Vì vậy bước 6 **chỉ** dựa `kieng_ky` và **phải tự khai là không phải màn sàng an toàn**. Một
  trang in tiêu đề "chỗ phải dè" rồi bỏ sót Khinh Phấn thì **tệ hơn** trang không có mục đó: nó
  làm người đọc tin là đã được cảnh báo. Cùng lý lẽ với "hoặc trọn vẹn, hoặc không gì".

## 10. Hai điều người dùng ĐÃ CHỐT (02/10/2026)

> **Người đọc → "cả hai, một lõi hai mặt".** Mặt công khai nói giọng tra cứu y văn; mặt `/app`
> nói giọng nghề. Một bộ máy luận duy nhất.
>
> **Thứ tự làm → mặt `/app` TRƯỚC.** Người dùng là thầy thuốc, họ đọc và phán lời luận có ra gì
> không **trước khi** một trang công khai nào ra đời. `robots.txt` đã chặn `/app` nên sai thì sửa
> tự do. Phép nghiệm thu 13.911 bài chạy được ngay, không cần trang nào.

⚠️ **Phạm vi hành nghề Y sỹ.** Câu "bệnh nhân chảy máu cam thì uống vị gì" đọc nguyên văn là **kê
đơn**. Mặt công khai phải ở giọng tra cứu y văn ("y văn ghi…", "sách X chép…"), dùng bảng từ đã
chốt (khám→đo, phòng khám→phòng chẩn trị, bác sĩ→thầy thuốc), và **không** câu nào khuyên người
đọc dùng gì.

## 11. Chia giai đoạn

- **GĐ 0 — bộ đo cố định.** `backend/tmp/do-luan-giai.mjs` (chỉ đọc, mã thoát 1 khi trượt): in
  lại MỌI con số của tài liệu này bằng một lệnh. Kèm phép kiểm "đọc chiều" trên bộ 15 ca đáp án,
  và phép kiểm "nối sai không gian id thì cho số KHÁC nối đúng". Theo đúng tiền lệ GĐ 0 của
  `do-do-thi-tri-thuc.mjs` — không có nó thì mọi số ở đây chỉ là lời kể.
- **GĐ 1 — lõi luận + mặt `/app`, trên bài thuốc.** `GomHao` · `TheCuaBai` · `TongLuan` ·
  `luat-luan-giai.ts` · màn luận trong `/app`. Việc đo đầu tiên: SWC nhập lõi được không.
- **GĐ 2 — nghiệm thu quy mô kho.** Chạy đối chiếu bước 5 ↔ bước 2 trên 13.911 bài, ghi lại tỉ lệ
  khớp làm mốc. Danh sách lệch là việc đọc lại cho người.
- **GĐ 3 — biến quẻ.** Nối bài biến thể về bài gốc (sửa `đ → d` trước), luận theo cặp.
- **GĐ 4 — luận vị thuốc**, kèm đếm cặp đồng xuất hiện và phân bố vai trò.
- **GĐ 5 — mặt công khai**, sau khi người dùng đã phán lời luận ở `/app` là dùng được.

## 12. Tách ra, làm sau, KHÔNG chặn gì

- Nạp vài trăm tên đồng nghĩa vào `vi_thuoc_ten_goi_khac` (danh sách tần số ở mục 9 đã tự xếp thứ
  tự ưu tiên). Nâng độ phủ ô từ 80% lên.
- Chấm tay vai trò quân–thần–tá–sứ cho nhóm **4.216 bài trộn cân bằng**, không phải cả kho.
- Lấp 12 trục `phap_tri` (380 × 12 ≈ 4.500 ô) từ 2.139 nguồn y văn.
- Dọn `thanh_phan`: "Sắc uống." / "Tán bột." / ô lệch cột.
- Trục độc: quyết định nghiệp vụ riêng, cần nguồn ngoài kho hiện có.

## 13. Nghiệm thu

- Mọi con số trong tài liệu này in lại được bằng `node backend/tmp/do-luan-giai.mjs`.
- Bộ 15 ca đáp án chiều: **0 lần phán ngược** là chốt tuyệt đối (ngưỡng 0). Số "không phán" được
  phép tăng; số phán SAI phải bằng 0.
- Nhánh bộ phận dùng không được bật khi chưa có bộ đáp án riêng của nó.
- Chọn ngẫu nhiên 20 bài mỗi hạng (thuần · trộn có chủ · trộn cân bằng), đọc tay lời luận.
- Tỉ lệ khớp bước 5 ↔ bước 2 ghi lại ở lượt đầu; mọi lần sửa phải so với số đó, **sửa được thật
  thì phải nâng số lên theo**.
- Mặt công khai: không câu nào khuyên người đọc dùng gì (phép dò theo bảng từ phạm vi hành nghề).
