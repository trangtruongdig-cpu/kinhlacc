# Bot Thẩm Định Thư Viện — thầy thuốc đọc kho, tester soi trang, người đối sánh đối thủ

Ngày chốt thiết kế: 25/09/2026. Trạng thái: **đã duyệt, chờ viết kế hoạch thi công**.

## Vì sao

Thư viện có 18.416 mục từ, phần lớn số hoá từ đĩa CD từ điển. Ba thứ hỏng cùng lúc mà
không ai thấy hết được bằng mắt:

1. **Rác mã hoá di sản** còn sót sau các đợt dọn (bộ đọc `.dat` trượt offset).
2. **Văn phong y học chưa mạch lạc** — người đọc cảm thấy, nhưng không chỉ được ra bài nào.
3. **Nội dung nằm sai ô** — đã bắt được ngay ở mẫu bốc ngẫu nhiên đầu tiên.

Không con mắt người nào soi hết 18.416 mục. Cần một bộ đọc tự động vừa **tỉ mẩn như tester**
vừa **đọc hiểu như thầy thuốc**, ghi chú từng bài, rồi kết tinh thành **kế hoạch sửa** — chứ
không phải một bãi cảnh báo.

## Số đo mở đầu (đo thật 25/09/2026, không ước lượng)

### Kho

| Bộ | Số mục | Trung vị thân bài | Dưới 200 ký tự |
|---|---|---|---|
| Bài thuốc | 13.942 | 155 | 9.112 |
| Dược liệu | 1.045 | 82 | 809 |
| Huyệt vị | 1.059 | 336 | 287 |
| Bệnh học | 100 | 11.645 | 0 |
| Châm cứu trị bệnh | 100 | 4.243 | 0 |
| Kinh mạch | 20 | 4.043 | 0 |
| Thư mục nguồn | 2.139 | 4 | 2.139 (mỏng là đúng bản chất) |
| Bài viết | 11 | 5.869 | 0 |
| **Tổng** | **18.416** | | **8,12 triệu ký tự** |

Trừ thư mục nguồn: **10.208 mục dưới ngưỡng 200 ký tự**. Chỉ **1.279 mục** có thân bài đủ
dày để phê văn phong.

### Google (Search Console, 27/06 → 23/09/2026)

| Đường | Trang có hiển thị | Hiển thị | Nhấp |
|---|---|---|---|
| `/huyet/` | 484 / 1.059 | 4.819 | 147 |
| `/kinh/` | 11 / 20 | 300 | 38 |
| `/benh-hoc/` | 27 / 100 | 64 | **0** |
| `/cham-cuu-tri-benh/` | 25 / 100 | 53 | 2 |
| `/bai-thuoc/` | **0** / 13.942 | 0 | 0 |
| `/duoc-lieu/` | **0** / 1.045 | 0 | 0 |

Toàn site: **570 trang có hiển thị trên 18.416 mục (3%)**, 46 từ khoá ở hạng 5–30.

Ba điều đọc ra, và chúng định hình toàn bộ thứ tự ưu tiên:

- **Huyệt vị là mỏ vàng bỏ hoang.** 484 trang gom 75% lượt hiển thị toàn site, phần lớn 46 từ
  khoá gần top là huyệt (*"huyệt lãi câu"* hạng 8,0 · *"huyệt hạ quan ở đâu"* hạng 6,2). Mà
  trang huyệt trung vị chỉ 336 ký tự. Người tìm đúng thứ mình có, mình xếp gần trang nhất,
  trang thì mỏng.
- **15.000 trang bài thuốc + dược liệu Google chưa hề biết tới.** Không phải hạng thấp — là
  vắng mặt. Với chúng, câu hỏi đúng là "làm sao được vào chỉ mục", không phải "gọt câu chữ".
- **Bệnh học: 64 hiển thị, 0 nhấp** dù dày nhất kho. Bệnh nằm ở tiêu đề và đoạn mô tả, không
  ở thân bài.

## Phạm vi và ranh giới

### Bot là biên tập viên, không phải tác giả

Bot **được**: đọc hiểu, phát hiện câu tối nghĩa, thuật ngữ bất nhất, mâu thuẫn y lý, chỗ
thiếu; soạn lại chữ đã có; tổng hợp từ các mục liên kết trong kho.

Bot **không được**: thêm bất kỳ sự kiện y học nào từ trí nhớ của mô hình.

Đây là luật dễ trôi nhất khi về sau có người thấy "cho nó viết thêm tí nữa thì trang dày hơn".
Ghi ở đây để lần sau ai định nới thì biết mình đang nới cái gì.

### Bốn bậc căn cứ — bậc 2 bị cấm

| Bậc | Căn cứ | Dùng |
|---|---|---|
| 1 | Chữ trong kho, qua liên kết chéo 8 bộ | **Có** |
| 2 | Y văn từ trí nhớ LLM, kể cả có dẫn sách | **CẤM** — dẫn sách vẫn có thể dẫn sai |
| 3 | Học **bố cục** từ trang đối thủ (không chép chữ) | **Có** |
| 4 | Không đủ căn cứ → ghi "cần người bổ sung", dừng | **Có** |

Hệ quả phải nói thẳng: với phần lớn 10.208 mục mỏng, bot chỉ đánh dấu chứ không sinh nội dung.
**Kho sẽ không tự dày lên.** Thứ bot cho là bản đồ chính xác chỗ nào thiếu gì, xếp theo thứ tự
đáng sửa trước — với 10.208 mục thì biết sửa cái nào trước mới là thứ dùng được.

### Mức can thiệp

Bot ghi nhận xét **và** soạn sẵn bản sửa, đặt cạnh bản gốc ở trạng thái chờ. Chỉ khi người
duyệt bấm thì mới ghi vào kho. Bot không tự ghi đè bất cứ thứ gì.

## Ràng buộc hạ tầng (đo 25/09/2026)

- **Hai database khác nhau** trên cùng cụm Aiven: nội dung ở `kinhlac_cms`, còn `su_co` +
  GSC + cron ở `defaultdb`. Postgres không join chéo database.
- **`max_connections = 20`, đang dùng 12.** Backend production cấu hình pool `max: 10`; lúc
  cao điểm là 10 + CMS 2 + hệ thống 9 = **21, vượt trần**. Cụm đã sập một lần vì chuyện này
  hôm 25/09. → Bot **không được giữ pool thường trực thứ hai**: mở một kết nối lúc vào ca,
  đóng lúc hết ca, chạy giờ vắng.
- Ghi vào bảng `ec_*` có ba bẫy hỏng im lặng — xem phần "Duyệt và áp bản sửa".

## Kiến trúc

Bot **sống ở backend** (`defaultdb`): ở đó có sẵn `@Cron`, client LLM, `GscService`,
`SseService`, và cửa `POST /su-co/bao`. Nó mở kết nối tạm sang `kinhlac_cms` để đọc kho và
ghi bệnh án.

Bệnh án **nằm ở `kinhlac_cms`**, cạnh nội dung, vì 90% truy vấn là join với `td_muc` và `ec_*`.

```
 Lớp 1 MÁY QUÉT ──┐
 toàn kho, mỗi đêm │
                   │        ┌──────────────┐        ┌─────────────┐
 Lớp 2 THẦY THUỐC ─┼───────▶│  BỆNH ÁN     │ mỗi   │  CỤM VIỆC   │
 LLM, theo hàng đợi│        │  td_ho_so    │ sáng  │ POST        │
                   │        │  td_nhan_xet │──────▶│ /su-co/bao  │
 Lớp 3 ĐỐI SÁNH ───┘        └──────────────┘        └─────────────┘
 GSC + trang đối thủ
```

**Bệnh án ghi lẻ, tab nhận gom.** Bot giữ 18.416 bệnh án cho riêng nó, nhưng chỉ nộp vào Góp Ý
& Lỗi những **cụm việc**.

## Dữ liệu — hai bảng ở `kinhlac_cms`

### `td_ho_so` — một hàng cho một mục từ, là trí nhớ của bot

| Cột | Việc |
|---|---|
| `bo`, `ma`, `slug` | khoá về `td_muc` |
| `van_tay_noi_dung` | băm thân bài lúc soi — **van tiết kiệm tiền**: chưa đổi thì lớp 2 không đọc lại |
| `diem_sach`, `diem_mach_lac`, `diem_du_phan`, `diem_lien_ket`, `diem_seo` | năm trục, 0–100 |
| `hang` | `tot` · `tam_duoc` · `yeu` · `hong` |
| `uu_tien` | điểm xếp hàng đợi |
| `soi_may_luc`, `soi_thay_thuoc_luc`, `soi_seo_luc` | ba mốc riêng — ba lớp chạy ba nhịp |

### `td_nhan_xet` — từng ghi chú một

| Cột | Việc |
|---|---|
| `ho_so_id`, `lop` | `may` · `thay_thuoc` · `seo` |
| `kieu` | mã lỗi, vd `thieu_phoi_huyet` — **đây là thứ dùng để gom cụm** |
| `truong` | nhận xét về cột nào (`vi_tri`, `chu_tri`…) |
| `trich_dan` | **nguyên văn câu có vấn đề** |
| `nhan_xet` | lời phê |
| `de_xuat`, `bac_can_cu` | bản sửa + bậc căn cứ (1 hoặc 3) |
| `trang_thai` | `moi` · `da_duyet` · `da_ap` · `bo_qua` |
| `duyet_boi`, `duyet_luc` | ai duyệt, lúc nào |

`trich_dan` là thứ giữ bot trung thực: **không trích được câu thì không được phê**. Nhận xét
thiếu `trich_dan` bị loại ngay ở khâu ghi, không đợi người duyệt bắt.

⚠️ Sổ tay dự án ghi: file `.sql` viết `timestamptz` nhưng DB thật tạo cột `timestamp`, làm mọi
mốc thời gian đọc ra **sớm 7 tiếng**. Sau khi tạo bảng phải **đo kiểu cột thật**, đừng tin file.

## Bước 0 — Lập thước (làm một lần, trước mọi thứ)

Người dùng chỉ 5–10 mục viết đạt. Bot đọc, rút ra bộ luật văn phong — bố cục các phần, cách
dùng thuật ngữ, độ dài câu, lối xưng hô, cách dẫn y văn — trình duyệt từng điều. Bộ luật lưu
có phiên bản.

**Mọi lời phê trục văn phong phải quy chiếu về một điều trong bộ luật.** Không quy chiếu được
thì không phải lỗi. Nhờ vậy khi bot phê sai, người dùng sửa *bộ luật*, không cãi từng lời phê.

## Lớp 1 — Máy quét (miễn phí, toàn kho, mỗi đêm)

Không gọi LLM lần nào. Năm nhóm phép dò:

| Nhóm | Dò gì | Căn cứ |
|---|---|---|
| Sạch chữ | 6 dạng rác di sản D1–D6, cộng lỗi dấu câu (khoảng trắng trước dấu phẩy, gạch ngang lẫn lộn, viết hoa giữa câu) | chép logic từ `backend/sql/audit-rac-tu-dien.sql` |
| Đủ phần | trường nào trống; trường **cốt lõi** nào trống (huyệt thiếu `vi_tri`, dược liệu thiếu `chu_tri` → hạng nặng) | `td_cau_hinh.cot_than` |
| Trộn trường | nội dung sai ô — `thanh_phan` chứa "Sắc uống" trong khi `cach_dung` trống | nợ cũ: 7.129 phần tử trên 6.491 bài |
| Liên kết hụt | vị thuốc trong bài có mục dược liệu mà chưa nối; huyệt chưa nối về kinh; tên mục được nhắc mà không thành link | đối chiếu `td_muc` giữa 8 bộ |
| Trang vỡ *(tester)* | mã HTTP, `<html lang>`, `<title>` thiếu/trùng, mô tả thiếu/trùng, H1 thiếu hoặc nhiều, ảnh 404, link nội bộ chết, JSON-LD sai cú pháp, thời gian trả trang | tải trang thật |

Lớp này cho bản đồ toàn kho **ngay ngày đầu**, và xếp hàng đợi cho lớp 2.

Một việc lớp 1 phải bắt được ngay lượt chạy đầu: toàn kho đang gắn `locale = 'en'` trong khi
nội dung là tiếng Việt. Nếu trang render ra `<html lang="en">` thì đó là một dòng sửa ảnh
hưởng 18.416 trang.

## Lớp 2 — Thầy thuốc (LLM, có hàng đợi)

Chỉ đọc mục **có thân bài thật** và **vân tay nội dung đã đổi** kể từ lần soi trước.

Hàng đợi: `điểm cơ hội GSC × 3 + mức hỏng máy chấm × 2 + độ dày`. Kết quả thực tế: 484 trang
huyệt có người tìm lên đầu, 9.112 bài thuốc trống rỗng xuống cuối.

Bot **đọc cả chùm, không đọc một mình**: soi huyệt Lãi Câu thì đọc kèm mục kinh Can chứa nó,
các mục châm cứu trị bệnh nhắc tên nó, các huyệt cùng nhóm. Đó là cách thầy thuốc thật đọc, và
là cách duy nhất để phê được loại nhận xét bắc cầu giữa hai mục.

Ba trục, mỗi lời phê bắt buộc kèm `trich_dan`:

- **Mạch lạc y văn** — bố cục có theo lối *đại cương → nguyên nhân → chứng trạng → chẩn đoán →
  điều trị*; câu cụt, câu mất chủ ngữ, đoạn lặp ý
- **Nhất quán thuật ngữ** — cùng khái niệm gọi hai tên trong một bài; xưng hô lẫn lộn; **phạm vi
  hành nghề** (đã chốt trong sổ tay: không được hàm ý "khám, chữa bệnh"; bảng từ: khám→đo,
  phòng khám→phòng chẩn trị, bác sĩ→thầy thuốc)
- **Y lý tự mâu thuẫn** — chủ trị nói chứng hàn mà phối huyệt toàn tả nhiệt; liều ở thành phần
  lệch liều ở cách dùng

**Hai tầng mô hình.** Model mặc định `gemini-2.5-flash-lite` quét toàn kho tốn cỡ 1–2 đô — rẻ
đến mức không phải cân nhắc — nhưng phê văn phong y học Đông y thì không tin được bằng người.
Chia hai tầng: flash-lite **sàng** toàn kho, model mạnh **đọc kỹ** vài trăm mục đầu hàng đợi.

## Lớp 3 — Đối sánh đối thủ

Với mỗi từ khoá đang ở hạng 5–30:

1. Tra SERP lấy 3 trang đứng trên mình — `GOOGLE_CSE_API_KEY` + `GOOGLE_CSE_CX` đã có sẵn
2. Tải 3 trang, bóc **bố cục**: có những mục gì, thứ tự nào, trả lời câu hỏi nào, dài bao
   nhiêu, có FAQ/ảnh/bảng không
3. So với trang mình → danh sách **"họ có, mình không"**

Ví dụ có thật hiện nay: *"huyệt hạ quan ở đâu"* — mình hạng 6,2. Chữ *"ở đâu"* nói rõ người ta
hỏi vị trí. Nếu 3 trang trên mình đều mở đầu bằng câu định vị gọn kèm hình, còn trang mình vùi
vị trí giữa bài, đó là một dòng nhận xét cụ thể sửa được.

Với 15.000 trang **chưa vào chỉ mục**, lớp 3 hỏi câu khác: vì sao chưa index — mỏng dưới
ngưỡng? có thẻ noindex? không có trong sitemap? không có liên kết nội bộ nào trỏ tới? Bốn
nguyên nhân đều máy kiểm được và cách xử lý khác hẳn nhau.

## Kết tinh thành cụm việc

Gom theo `kieu` (kiểu lỗi) × `bo`. Nộp qua `POST /su-co/bao`:

```
loai: 'gop_y'   ·   route: '/huyet/'   ·   lane: gop_y
thongDiep: "Thiếu phần Phối huyệt"
moTaNguoiDung:
   484 mục huyệt vị thiếu phần Phối huyệt.
   Trong đó 46 mục đang có người tìm trên Google (hạng 5–30).
   Bậc 1 dựng được cho 312 mục — chữ đã có trong kho.
   172 mục còn lại cần người bổ sung.
```

⚠️ **Route phải là đường của BỘ, không kèm slug.** `chuanHoaRoute` chỉ thay *số* bằng `:id`,
slug chữ giữ nguyên — gửi `/huyet/lai-cau/` thì 484 mục thành 484 cụm, đúng thứ cơ chế vân tay
dựng ra để chặn. Gửi `/huyet/` thì vân tay ổn định, một kiểu lỗi một cụm.

`loai: 'gop_y'` xếp vào lane `gop_y`, không lẫn với lỗi phần mềm ở lane `loi`.

## Duyệt và áp bản sửa

**Bot không bao giờ tự ghi vào bảng nội dung.** Khi người duyệt bấm, hệ thống áp theo đúng
đường của EmDash, trong một giao dịch:

1. Ghi bản cũ vào bảng `revisions` (lùi lại được)
2. Cập nhật cột nội dung + tăng `version`
3. Để trigger `td_tr` chạy (duyệt lẻ vài mục nên không tắt trigger)
4. **Kiểm lại**: gõ một cụm chỉ có trong phần vừa thêm vào ô tìm — phải ra đúng mục

Bước 4 nghe thừa nhưng không thừa. Ba bẫy hỏng im lặng đã ghi trong sổ tay:

- Cột nội dung **mới** không tự vào ô tìm kiếm; phải khai tên cột vào mảng `than` trong
  `cms/scripts-di-cu/dung-chi-muc.mjs` rồi dựng lại chỉ mục. Bỏ bước này thì nội dung vẫn hiện
  đúng trên trang mà tra cứu không bao giờ ra — không lỗi, không cảnh báo.
- Trường kiểu `image` cần đúng dạng `{ id, meta: { storageKey } }`; chỉ có `id` thì ảnh 404 mà
  thẻ `<img>` vẫn render.
- Ghi **lô** thì phải `ALTER TABLE ... DISABLE TRIGGER USER` rồi dựng lại chỉ mục; ghi lẻ thì
  không.

## Nhịp một ngày

| Giờ | Việc | Tốn |
|---|---|---|
| 02:00 | Lớp 1 quét toàn kho, cập nhật hồ sơ, xếp lại hàng đợi | 0đ, vài phút |
| 02:30 | Lớp 3 kéo GSC 28 ngày, tra SERP, đọc trang đối thủ | quota CSE |
| 03:00 | Lớp 2 đọc `THAM_DINH_MOI_CA` mục đầu hàng đợi (mặc định 100) | vài đô/tháng |
| 06:00 | Kết tinh, nộp cụm việc, bắn SSE | 0đ |

`@Cron` chạy được vì Docker Compose là **một tiến trình duy nhất**. Thêm instance thứ hai là
cron chạy đôi — cùng cảnh báo đã ghi trong sổ tay cho `appointment-reminder.service.ts`.

## Giao diện — hai chỗ, không dựng tab thứ ba

**Cụm việc dùng lại tab "Góp Ý & Lỗi" y nguyên.** Chúng vào lane `gop_y`, hiện cùng danh sách,
dùng cùng bộ lọc, cùng nút đổi trạng thái. Không sửa gì ở tab đó ngoài việc thêm một chip nguồn
`tham-dinh` để lọc riêng khi cần.

**Màn duyệt bản sửa là trang mới** — `meta.page: 'tham-dinh'`, khoá bằng vai trò Quản Trị theo
đúng lối `su-co` đã làm (không có trong `constants/pages.ts` nên `authStore.can()` chỉ trả true
cho Quản Trị). Trang này Góp Ý & Lỗi không gánh được, vì nó cần thứ tab kia không có: bản gốc
và bản sửa đặt cạnh nhau, trích dẫn được tô, và nút duyệt từng nhận xét một.

Từ một cụm việc trong tab Góp Ý & Lỗi có liên kết "Xem N bản sửa đã soạn" dẫn sang trang này,
lọc sẵn theo `kieu` của cụm.

## Cấu hình mới

| Biến | Việc | Bắt buộc |
|---|---|---|
| `CMS_DB_HOST`, `CMS_DB_PORT`, `CMS_DB_USER`, `CMS_DB_PASSWORD`, `CMS_DB_NAME` | kết nối tạm sang `kinhlac_cms` (giá trị đã có trong `cms/.env`) | có — thiếu thì bot nằm im, không lỗi |
| `THAM_DINH_MOI_CA` | số mục lớp 2 đọc mỗi ca. Mặc định **100** | không |
| `THAM_DINH_TRAN_TIEN` | trần chi tiêu mỗi ca, tính bằng số lần gọi mô hình. Mặc định **300** | không |
| `THAM_DINH_MODEL_KY` | model tầng đọc kỹ. Không đặt thì dùng `YESCALE_MODEL` cho cả hai tầng | không |

Thiếu cấu hình thì bot **nằm im chứ không ném lỗi** — cùng lối với Telegram và push trong
`su-co`.

## Rào chắn

- Mọi `de_xuat` mang `bac_can_cu` 1 hoặc 3; bậc 2 bị cấm
- Nhận xét không có `trich_dan` → loại ở khâu ghi
- Không giữ kết nối thứ hai: mở vào ca, đóng hết ca
- Van `van_tay_noi_dung`: bài chưa đổi thì không gọi LLM
- Trần chi tiêu mỗi ca (`THAM_DINH_TRAN_TIEN`, mặc định 300 lượt gọi); chạm trần thì dừng, ghi chỗ dừng, mai chạy tiếp
- Bot chỉ đọc `kinhlac_cms`; không chạm dữ liệu bệnh nhân ở `defaultdb` ngoài bảng `su_co`

## Kiểm thử (viết trước phần cài đặt)

Theo lối `backend/src/utils/su-co-van-tay.util.spec.ts` đã có:

1. **Vân tay cụm ổn định**: 484 nhận xét cùng kiểu trên 484 slug khác nhau → đúng **1** cụm
2. **Lớp 1 có đáp án sẵn**: chuỗi mojibake, chuỗi TCVN3, `thanh_phan` chứa "Sắc uống", huyệt
   thiếu `vi_tri` → mỗi ca ra đúng một mã lỗi đã biết
3. **Van vân tay**: mục không đổi → lớp 2 gọi LLM **0 lần**
4. **Bậc căn cứ**: nhận xét không `trich_dan` → bị loại
5. **Áp bản sửa**: sau khi áp, `revisions` có bản cũ, và tra cứu ra được chữ mới
6. **Kiểu cột thời gian**: đọc `information_schema` xác nhận cột là `timestamptz` thật

## Việc KHÔNG làm (chốt để khỏi phình)

- Bot **không tự deploy**, không tự chạy lại pipeline nào
- Bot **không tự ghi đè** nội dung; mọi thay đổi đi qua nút duyệt
- Bot **không viết nội dung y học mới** từ trí nhớ mô hình (bậc 2)
- Giai đoạn đầu **không đưa 15.000 trang bài thuốc/dược liệu vào lớp 2** — việc của chúng là
  vào được chỉ mục Google trước, không phải gọt câu chữ
- Không thay thế `audit-rac-tu-dien.sql` — lớp 1 dùng lại logic của nó, không thay nó

## Phép nghiệm thu

1. Chạy lớp 1 toàn kho: 18.416 hồ sơ được tạo, không mục nào sót
2. Bộ luật văn phong được người dùng duyệt trước khi lớp 2 chạy lần đầu
3. Lớp 2 chạy trên 50 mục huyệt đầu hàng đợi: mỗi nhận xét đều trích được câu trong bài; người
   dùng đọc và xác nhận tỉ lệ phê đúng chấp nhận được
4. Cụm việc nộp lên tab: số cụm bằng số **kiểu lỗi × bộ**, không bằng số mục
5. Duyệt thử 1 bản sửa: `revisions` giữ bản cũ, tra cứu ra chữ mới, trang render đúng
6. Chạy một đêm trọn vẹn không làm số kết nối Postgres vượt 14
