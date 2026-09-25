# Hoàn thiện huyệt vị: ảnh dựng từ mô hình 3D + lấp nội dung còn trống

Ngày: 25/09/2026 · Nhịp tiếp theo của việc di cư thư viện về CMS
(xem `2026-09-25-di-cu-thu-vien-ve-cms-design.md`).

## Vì sao

Trang huyệt trong CMS đang dùng lại đúng ảnh của bản tĩnh: webp 600×363, trung bình 12KB,
và chỉ có **một** ảnh cho mỗi huyệt. Với một trang muốn làm cơ sở tri thức cho người mới học
Đông Y — và muốn được chia sẻ — đó là điểm yếu nhìn thấy ngay.

Đồng thời có một tài sản chưa dùng: pipeline `acu-solver` đã nướng xong **toạ độ 3D của 361
huyệt** trên mô hình Human Atlas có **402 cơ, 296 xương, 639 động mạch, 139 dây thần kinh**,
mỗi thứ là một mesh riêng có mã FMA và tên tiếng Việt. Đủ để **tự dựng ảnh giải phẫu** thay vì
mượn ảnh của sách.

## Quy mô (đo 25/09/2026)

Độ đầy của `ec_huyet_vi` (1.059 mục), tách theo việc có mã quốc tế hay không:

| | Tổng | giai_phau | tac_dung | pho_huyet | anh |
|---|---|---|---|---|---|
| **Có mã quốc tế** (12 chính kinh + Nhâm/Đốc) | 357 | thiếu **4** | thiếu **33** | thiếu **23** | thiếu 11 |
| **Không mã** (kỳ huyệt / tân huyệt / nhĩ huyệt) | 702 | thiếu 663 | thiếu 690 | thiếu 644 | thiếu 364 |

Đối chiếu ngược vào từ điển CD gốc: nó cũng chỉ có 392 mục "GIẢI PHẪU" và 336 mục "TÁC DỤNG".
**Bộ di cư không làm hụt gì** — nguồn vốn đã thiếu.

Khớp mã sau chuẩn hoá (`HE→HT`, `K→KI`): **357/361 khớp, 0 mã trùng**. Bốn huyệt lệch là
`ST3`, `ST7`, `KI15`, `GB3` — có trong CMS nhưng thiếu `ma_huyet`, sửa tay.

Sổ nghiệm thu toạ độ `backend/src/acu-solver/huyet-chot.json`: **361/361 huyệt có chốt** —
344 hạng A (có bằng chứng ngoài engine, trôi > 0,5cm là hồi quy), 17 hạng B (engine dựng,
kiểm sạch), **0 mục nghi ngờ**.

## Kết luận đo đạc đảo lại đề bài

667 ô "thiếu giải phẫu" **hầu như không phải huyệt chính kinh**. Phần huyệt chính kinh gần như
đã đủ — chỉ còn **60 ô trống**. Còn 702 mục kia là kỳ huyệt/tân huyệt mà **cả Focks lẫn WHO đều
không có**: hai nguồn đó chuẩn hoá đúng 361 huyệt chính, tức đúng bộ ta đã có.

**Quyết định: không lấp 663 ô kỳ huyệt.** Để trống là trung thực; suy diễn là cách hỏng dữ liệu
(bài học `loai_huyet` dò regex trên văn xuôi sai 10/16 lần, xem
`hoan-thien-huyet-vi-tu-dien-1059`). Muốn lấp thì phải có sách kỳ huyệt Trung văn, khi nào có
thì mở spec riêng.

## Ranh giới với phiên kinhlacc-a5

Hai phiên cùng làm một cây mã. `a5` đã bàn giao (25/09/2026, 22:5x):

**`a5` đã xong, đã commit (b7747d7, 5b83b8b), không ghi nữa:** `title`, `ma_huyet`, `ten_khac`,
`ten_han`, `pinyin`, `ten_anh`, `pho_huyet`, `ghi_chu`, `tham_khao`, `cho_index`, `y_nghia_ten`,
`dac_tinh`, `vi_tri`, `giai_phau`, `tac_dung`, `chu_tri`, `cham_cuu`, `xuat_xu`, `anh`,
`the_loai`; các trang `/kinh/<slug>`, `/thu-vien/*`, `/bai-thuoc/*`, `/duoc-lieu/*`,
`ThuVienKhung.astro`.

**Thuộc spec này:** xưởng ảnh 3D (kể cả ghi đè `anh`), 60 ô nội dung, trường công dụng mới,
`src/pages/huyet/[slug].astro`, thẻ đường kinh.

**Ba ràng buộc `a5` dặn — vi phạm là hỏng im lặng:**

1. Ghi lô phải `ALTER TABLE ec_huyet_vi DISABLE TRIGGER USER;` trước và `ENABLE` sau, rồi chạy
   `node scripts-di-cu/dung-chi-muc.mjs huyet_vi`. Trigger `td_tr` chạy cho TỪNG HÀNG; để bật mà
   ghi 1.059 hàng thì rất chậm. Mẫu: `scripts-di-cu/the-loai-huyet.mjs`.
2. **Cột nội dung mới phải khai vào mảng `than` của mục `huyet_vi` trong `dung-chi-muc.mjs`.**
   Bỏ bước này thì nội dung vẫn hiện trên trang nhưng **tra cứu không bao giờ tìm ra** — không
   báo lỗi. Sửa xong phải nhắn `a5`.
3. Trường kiểu image cần đúng dạng `{ id, meta: { storageKey } }`. Chỉ để `id` thì
   `/_emdash/api/media/file/<id>` trả 404 mà thẻ `<img>` vẫn hiện — nhìn qua tưởng có ảnh.

## Khối 1 — Xưởng ảnh 3D

### Lập trường về ảnh của sách

Không đăng lại ảnh của Focks. Dùng ảnh sách làm **tham chiếu bố cục** (hình đó cho thấy vùng
nào, góc nào, mốc nào), rồi **dựng lại từ mô hình 3D của mình**. Ảnh xuất bản là ảnh của ta.

Lý do quyết định không phải bản quyền mà là thứ hạng: Google hạ trang chép lại, và bản PDF Việt
hoá đang lưu hành rộng. Ảnh tự dựng là thứ duy nhất trang này có mà bản PDF không có.

### Phương án dựng (chọn A)

- **A. Trang xưởng riêng + Playwright** ← chọn. Dựng `frontend/public/kinhmach3d/xuong-anh.html`
  theo lối `review-v2.html` đã có: nạp `body-core.glb`, các lớp giải phẫu, `acu-coords3d.js`,
  `meridian-paths.js`, rồi phơi ra `window.__CHUP({ma, kieu})`. Playwright mở **một lần**, nạp
  model **một lần**, lặp 361 huyệt. Dùng đúng engine đang chạy thật nên chất lượng bằng thứ
  người dùng đã thấy.
- **B. Mở rộng `render-doi-chieu.cjs`** — loại. Thuần JS, tất định, nhưng hiện là đám mây chấm
  xám + phông bitmap 5×7 không dấu; muốn đăng được phải tự viết đổ bóng, khử răng cưa, chữ có
  dấu — tức viết lại một renderer.
- **C. Chụp trang 3D của app** — loại. Đòi đăng nhập, UI che khuất, mỗi ảnh tải lại model 15MB.

### Bốn ảnh mỗi huyệt

| Mã | Ảnh | Nội dung | Sách có? |
|---|---|---|---|
| `da` | Trên da | cận cảnh vùng, huyệt sáng, mốc xương/gân gần nhất có nhãn tiếng Việt | ✅ |
| `gp` | Trên giải phẫu | **cùng góc, cùng khung**, bóc da, tô sáng đúng những cơ/xương mà mục GIẢI PHẪU của chính huyệt đó gọi tên | ✅ (vẽ chung vùng) |
| `lan` | Huyệt lân cận | vùng rộng hơn, mọi huyệt trong bán kính ~6cm **kể cả khác kinh**, có nhãn mã + tên | ❌ |
| `kinh` | Toàn đường kinh | toàn thân, đường kinh nổi, huyệt đang xem nhấn mạnh | ❌ |

`da` và `gp` phải **cùng camera** — đặt cạnh nhau mới đọc được như hai bảng của sách.

Ảnh `gp` là chỗ hơn sách: hình sách vẽ chung cả vùng, còn ta tô đúng cơ mà chữ nhắc tên, lấy từ
`backend/src/acu-solver/giai-phau-data.json` (361 huyệt, đã bóc sẵn `duoiDa[]`, `thanKinh`,
`tietDoan`). **Chữ và hình cùng một nguồn nên không vênh nhau được.**

Ảnh `lan` tính bằng khoảng cách 3D giữa các huyệt — có toạ độ cả 361 huyệt nên tính thẳng.

### Khung hình

Khởi đầu từ 10 vùng đã có trong `render-doi-chieu.cjs` (`dau`, `co`, `nguc`, `bung`, `canh-tay`,
`ban-tay`, `dui`, `cang-chan`, `ban-chan`, `than`) cộng hướng nhìn mặc định theo kinh đã khai ở
`VIEW`. Mỗi huyệt suy khung từ vùng cơ thể của nó; chỗ nào lệch thì đè bằng bảng ngoại lệ trong
tệp cấu hình, **không sửa rải rác trong mã**.

### Nhãn

Nhãn vẽ bằng lớp HTML/SVG phủ trên canvas WebGL rồi chụp cả trang — **không vẽ chữ trong WebGL**
(chữ tiếng Việt có dấu trong texture rất xấu). Nhãn gồm: mã huyệt, tên Việt, và với ảnh `gp` là
tên cơ/xương được tô.

Tên mốc lấy từ `backend/src/acu-solver/landmark-glossary.cjs` (mốc xương đã đặt tên) và tên Việt
của cấu trúc giải phẫu lấy từ `frontend/public/kinhmach3d/data/human-atlas-vi.js` (tra theo mã
FMA). **Không tự dịch tên giải phẫu** — bộ tên Việt đã rà tay, chạy lại script dịch máy cũ là
làm xấu đi (xem `atlas-vi-dich-ten-giai-phau`).

### Định dạng và ngân sách đĩa — ĐIỀU KIỆN CỨNG

Số đo `a5` gửi: phần ảnh hiện tại là **22MB / 753 tệp** trong `./data/cms-uploads`
(684 ảnh huyệt webp 600px = 8,3MB; 92 sơ đồ kinh jpg = 14MB).

- Xuất PNG từ Playwright → chuyển **WebP q80** bằng `sharp 0.35.4` (có trong `cms/node_modules`)
  hoặc `cwebp` (có ở `/opt/homebrew/bin`). PNG thô dễ lên 500MB–1GB, không được nạp thẳng.
- **Không cùng độ phân giải cho mọi loại**: `kinh` (toàn thân) 1400px; `da`, `gp`, `lan` 800px.
- **Trần cứng: tổng ảnh mới ≤ 1,5GB.** Đĩa VPS còn 4,7G/20G nhưng co giãn theo Docker — cache
  build từng phình tới 3,21GB làm đĩa tụt còn 3,2G (đo 25/09/2026, `deploy.sh` đã cắt xuống 1GB).
  4,7G trống **không phải** 4,7G dành cho ảnh.
- **Phải đo thật rồi báo trước khi nạp.** Chụp thử một kinh, nhân lên, báo người dùng và `a5`
  cùng lúc. Vượt trần thì dừng, không tự ý nạp.
- ⚠️ `./data/cms-uploads` **không được git theo dõi và không có bản sao**. Ảnh huyệt cũ mất thì
  kéo lại được từ kinhlac.online; ảnh 3D mất là mất hẳn. Giữ bản gốc PNG/WebP ngoài VPS.

### Độ tin cậy toạ độ

344/361 hạng A, 17 hạng B. Đủ để đăng. 17 huyệt hạng B ghi chú nhỏ dưới ảnh ("vị trí do engine
dựng, chưa có bằng chứng ngoài"), không giấu.

## Khối 2 — Lấp 60 ô trống

Chỉ trên 357 huyệt có mã: 4 `giai_phau` (GB33, HT6, LR14, ST25), 33 `tac_dung`, 23 `pho_huyet`.

Quy trình: bóc từ PDF Focks Việt hoá (`~/Downloads/Huyet vi thuong dung.pdf`, 516 trang, có lớp
chữ, 394 trang có mục "Tác dụng/chỉ định chính") → **viết lại bằng lời mình** → xuất **hồ sơ 60
dòng** (huyệt · ô · bản nháp · trang nguồn) cho người dùng duyệt → duyệt xong mới ghi.

⚠️ Khớp theo **mã**, không theo tên: sách dùng ký hiệu Đức ghép Anh ("Ma/ST 36", "Dü/SI 3"), và
bỏ dấu xong "Dü" (Tiểu Trường) trùng "Du" (Đốc Mạch) — **luôn thử vế tiếng Anh trước**. Đã dính
một lần, 27 huyệt Đốc Mạch bị gán nhầm (xem `dung-atlas-focks-doi-chieu`).

## Khối 3 — Mục "Công dụng theo nhóm chỉ định"

Trường MỚI `cong_dung_nhom` (json), **giữ nguyên `tac_dung`** của từ điển bên cạnh. Dạng:
nhóm công dụng → các chỉ định, ví dụ *"Giải nhiệt: viêm sưng vùng miệng và mặt, mắt đỏ, chảy máu
cam"*. Lối này dạy người mới học tốt hơn câu cổ văn "Khu phong hoá đàm, lý Phế, chỉ khát".

**Thí điểm kinh Phế (11 huyệt) trước.** Người dùng xem trang thật, chỉnh giọng văn và bố cục,
duyệt khuôn, rồi mới chạy 350 huyệt còn lại. Sửa khuôn lúc 11 huyệt rẻ hơn lúc 361.

Ghi công Claudia Focks và Phùng Văn Chiến rõ ràng trên trang.

## Khối 4 — Trình bày và nối

- **Thẻ đường kinh:** đẩy `{ma, ten, nhom:"Đường Kinh"}` vào mảng `the_loai`. Tầng lọc của `a5`
  (bảng `td_nhan`) đọc từ CỘT chứ không đọc taxonomy, nên đường này không cần `a5` đụng vào.
- **Huyệt trước/sau** trên cùng kinh + breadcrumb sang `/kinh/<slug>` — suy từ mã, không lưu.
- **Nối trích dẫn:** chỉ thêm `d.pho_huyet` vào lời gọi `rutNguon()` trong
  `components/KhungSeoYKhoa.astro`. **Không viết bộ dò thứ hai** — bộ lọc nhiễu ở
  `utils/trich-dan.ts` đã chặn tên vị thuốc và liều lượng, dựng lại sẽ mất phần đó.
- **Ảnh:** dùng `urlAnh()` ở `src/utils/anh.ts`, không tự ghép URL.

## Tệp sẽ thêm hoặc sửa

**Thêm:**

| Tệp | Việc |
|---|---|
| `frontend/public/kinhmach3d/xuong-anh.html` | trang xưởng, `noindex`, phơi `window.__CHUP({ma, kieu})` |
| `backend/src/acu-solver/chup-huyet.cjs` | Playwright lái xưởng, xuất PNG ra thư mục tạm |
| `backend/src/acu-solver/khung-anh.json` | bảng khung hình theo vùng + ngoại lệ từng huyệt |
| `cms/scripts-di-cu/anh-huyet-3d.mjs` | chuyển WebP, đo dung lượng, nạp thư viện ảnh, gắn vào huyệt |
| `cms/scripts-di-cu/boc-focks.mjs` | bóc PDF theo mã huyệt, xuất hồ sơ chờ duyệt |
| `cms/scripts-di-cu/the-duong-kinh.mjs` | đẩy thẻ `nhom:"Đường Kinh"` vào `the_loai` |

**Sửa:**

| Tệp | Việc |
|---|---|
| `cms/src/pages/huyet/[slug].astro` | khối bốn ảnh, mục công dụng, huyệt trước/sau, breadcrumb kinh |
| `cms/src/components/KhungSeoYKhoa.astro` | thêm `d.pho_huyet` vào `rutNguon()` |
| `cms/scripts-di-cu/dung-chi-muc.mjs` | khai cột mới vào mảng `than` của `huyet_vi` — **nhắn `a5` sau khi sửa** |

## Thứ tự

1. Thí điểm **kinh Phế (11 huyệt)** trọn cả bốn khối → người dùng duyệt trang thật.
2. Đo dung lượng ảnh thật, báo người dùng + `a5`, đối chiếu trần 1,5GB.
3. Nhân ra 350 huyệt còn lại.

## Phép nghiệm thu

1. **Đủ ảnh**: 361 huyệt × 4 loại, không loại nào hụt; ảnh `da` và `gp` cùng khung camera.
2. **Huyệt nằm trên da**: chạy `skin-clamp.cjs`, không huyệt nào chìm trong thịt hay bay ra ngoài.
3. **Hình khớp chữ**: với 10 huyệt lấy ngẫu nhiên, cơ được tô sáng trong ảnh `gp` phải đúng bằng
   danh sách `duoiDa[]` của huyệt đó trong `giai-phau-data.json`.
4. **Dung lượng**: tổng thư mục ảnh mới ≤ 1,5GB, đo bằng `du -sh` trước khi nạp.
5. **60 ô có nguồn**: mỗi ô lấp phải ghi được trang sách đã đối chiếu; không ô nào không nguồn.
6. **Tra cứu thấy nội dung mới**: gõ một cụm chỉ có trong `cong_dung_nhom` vào ô tìm của
   `/thu-vien/huyet_vi/` phải ra đúng huyệt. Đây là phép bắt lỗi quên khai `dung-chi-muc.mjs`.
7. **Ảnh không vỡ**: gọi `/_emdash/api/media/file/<id>` của 5 ảnh bất kỳ, phải 200 chứ không 404.

## Rủi ro đã biết

- **Ảnh phụ thuộc GPU/driver.** Chụp cả 1.444 ảnh trong MỘT lượt trên MỘT máy; chụp bù lẻ tẻ sau
  này dễ lệch tông. Ghi lại máy và phiên bản Chromium đã dùng.
- **Nạp model chậm.** Cảnh nặng mất gần một phút dựng đường kinh; dùng `window.__ACU3D()` để dò
  chứ đừng đoán (xem `duong-kinh-dung-tre-theo-khung`).
- **Khung camera phải đo từ THÂN**, không từ `Box3(modelRoot)` — nó nuốt chấm sentinel 1e4 làm
  ảnh ra trắng trơn mà không báo lỗi nào (xem `khung-camera-phai-do-tu-than`).
- **Volume ảnh không có bản sao** (mục ngân sách đĩa ở trên).
- **Quên khai chỉ mục** → nội dung mới tra không ra, im lặng (phép nghiệm thu 6 bắt việc này).

## Ngoài phạm vi

- **663 ô kỳ huyệt/tân huyệt** — không nguồn, không lấp, không suy diễn.
- **Viết lại VỊ TRÍ của 361 huyệt theo chuẩn WHO** — đáng làm nhưng là 361 lần đọc-đối-viết,
  mở spec riêng.
- **Ảnh cho 698 huyệt không có toạ độ 3D** — giữ ảnh webp 600px hiện có.
- **Toạ độ 3D** (`acu-coords3d.js`, pipeline bake) — không đụng. Spec này chỉ ĐỌC.
- **Trang `/kinh/<slug>`, thư viện, dược liệu, bài thuốc** — của `a5`.
