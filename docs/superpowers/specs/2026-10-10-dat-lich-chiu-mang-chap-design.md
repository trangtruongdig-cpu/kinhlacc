# Đặt lịch chịu được mạng chập — và vì sao "42 phút mất kết nối" KHÔNG TỒN TẠI

Ngày: 10/10/2026 · Trạng thái: **ĐẶC TẢ, chưa dựng** · Căn cứ: lời người dùng 10/10/2026 —
*"tài nguyên vps khá khiêm tốn… thiết kế backend, frontend sao cho đỡ bị ngắt quãng, nhất là
đặt lịch không bị trùng và chuyển lịch ngay lập tức. Tôi sợ sẽ dễ bị ảnh hưởng bởi mạng"*, và
câu nghi vấn chuyển sang từ một phiên song song: *"gốc rễ còn đó: đường truyền… 42 phút mất kết
nối giữa buổi demo là chuyện đáng tìm — có thể là wifi chỗ demo, cũng có thể là backend/nginx"*.

## Phần 0 — ĐIỀU PHẢI CHỐT TRƯỚC: không có 42 phút nào

Comment hiện tại trong `frontend/src/views/AppointmentsView.vue` (diff chưa commit) viết:

> *"vé chuyển THÀNH CÔNG trên máy chủ (b#84, 18:21:33) rồi kết nối chết 42 phút ngay sau đó —
> ba lời gọi kế tiếp 'Failed to fetch' trong 0,4 giây và mãi 19:03 mới báo về được."*

**Nửa sau của câu đó là suy diễn, và nó sai.** Bốn phép đo độc lập:

| Phép đo | Số | Nói gì |
|---|---|---|
| `breadcrumbs` của `su_co#6172` | dấu vết cuối **18:21:37**, không mục nào sau đó | tab KHÔNG có hoạt động nào trong "42 phút" |
| `ngu_canh.msTroi` | **387 ms** | request thất bại ngay, không hề treo |
| `su-co.controller.ts:202` | `xayRaLuc: bayGio` | mốc là **giờ máy chủ NHẬN BÁO CÁO**; `dto.xayRaLuc` của máy khách bị **bỏ** (grep `\.xayRaLuc` → rỗng) |
| `su_co_cum` #1715–1717 | `so_lan = 2`, lần đầu **29/09 20:53**, lần cuối **09/10 19:03** | 2 lần trong 10 ngày, 1 IP — không phải lỗi hệ thống |

Nên "42 phút" = (giờ máy chủ nhận báo cáo) − (giờ chuyển vé). Hiệu của hai mốc **không cùng hệ
quy chiếu** thì không đo được gì cả.

Dòng thời gian thật, đọc từ breadcrumbs:

```
18:21:25 · bấm: Chuyển vé      ← mở hộp thoại
18:21:31 · bấm: 09:30          ← chọn ca đích
18:21:32 · bấm: Chuyển vé      ← xác nhận. Máy chủ ghi b#86 18:21:32, movedAt 18:21:33 ✓
18:21:37 · bấm: DIV            ← dấu vết CUỐI CÙNG
   … im lặng, không một cú bấm …
19:03:35 · ba lỗi NETWORK tới được máy chủ, mỗi lỗi trôi 387 ms
```

Chữ ký khớp **máy khách ngủ rồi thức**: 19:03 thức → `visibilitychange`/`pageshow` → `revive()`
→ `requestResync()` → `loadDay()` bắn 3 GET song song → chết trong 387 ms vì wifi chưa lên →
rồi `POST /su-co/bao` thành công vài giây sau.

⚠️ **Cùng chữ ký đó có bốn lần khác, mỗi lần một IP khác, và luôn là ĐÚNG BỘ request song song
của một trang rồi im:**

| Lúc | IP | Bộ request |
|---|---|---|
| 09/10 00:25:45–47 | `1.52.172.*` | 3 route `/demo/*` của trang `/` |
| 09/10 14:08:08–09 | `14.231.167.*` | 3 route `/demo/*` của trang `/` |
| 09/10 19:03:35–37 | `118.70.99.*` | 3 route của `/app/appointments` |
| 10/10 07:39:36–38 | `116.105.240.*` | 3 route của `/thu-vien` |

Máy chủ chết thì **mọi IP trúng cùng một mốc**. Ở đây mỗi lần một IP, rồi im — đó là máy khách.

**Việc của phần 0 (làm trước mọi thứ khác, vì nó chống chẩn đoán sai lần sau):**

1. Sửa comment đó cho đúng. Giữ bản sửa `luotTai` (nó đúng vì lý do khác — xem phần D), nhưng
   bỏ câu "kết nối chết 42 phút".
2. **Lưu `xayRaLuc` của máy khách** vào cột mới `xay_ra_luc_khach timestamptz NULL`. Cố ý KHÔNG
   đổi nghĩa cột `xay_ra_luc` cũ — gom cụm và thống kê 24 giờ đang đọc nó, đổi là làm lệch hết.
   Không có cột này thì mọi sự cố mạng về sau vẫn không có mốc thật, và lại sinh ra một "42 phút".

## Số đo hiện trạng (đo 10/10/2026)

### Backend lúc rảnh thì KHOẺ — không phải VPS kiệt sức

```
/auth/me  (không chạm CSDL)   n=30   min 33 ms · trung vị 37 ms · p90 41 ms · max 45 ms
/nguon    (có CSDL)           n=10   min 255 ms · trung vị 264 ms · p90 340 ms
6 request song song           xong trong 1,62 s — KHÔNG xếp hàng, có cái còn nhanh hơn khi chạy lẻ
```

30 mẫu liên tiếp không một lần vọt. Nên giả thuyết "event loop bị việc nền chiếm" và "pool nghẽn
thường trực" đều **không đứng được** ở trạng thái bình thường.

### Vấn đề thật: 854 lần chậm · 69 IP · 9 ngày · tới 45 giây

```
Phân bố (giây làm tròn):  3s:94  4s:282  5s:135  6s:91  7s:76  8s:36  …  37s:12  42s:1  45s:1
```

⚠️ **854 là SÀN, không phải số thật.** `baoSuCo.ts` có `TRAN_CA_PHIEN = 20` và 5 lần/vân
tay/phiên, `NGUONG_CHAM_MS = 3000` — mọi thứ dưới 3 giây và mọi thứ vượt trần đều không được ghi.

### Thủ phạm là BYTE, không phải CPU

| Route | Số byte | TTFB lúc rảnh | Lần chậm | **Số IP khác nhau** |
|---|---|---|---|---|
| `/duoc-lieu?page=1&limit=40` | **777.920** (gzip **300.342**) | 1,02 s | 86 · tb 6,5 s · max 37,2 s | **34** |
| `/bai-thuoc/lite` | cần auth | — | 119 · tb 6,0 s · max 23,9 s | 24 |
| `/nguon?page=1&limit=40` | **5.678** | 0,25 s | 66 · tb 5,7 s | 26 |
| `/phuong-thang?page=1&limit=40` | **7.287** | 0,40 s | 65 · tb 5,7 s | 25 |
| `/huyet-vi` | **343.243** (gzip **57.865**) | 0,63 s | 33 · tb 5,1 s | 10 |
| `/nhht/cong-thuc` | **319.602** (gzip **27.972**) | 0,37 s | 36 · tb 5,2 s | 10 |
| `/demo/ket-qua-do-list?count=6` | **962.695** | 0,25 s | — | — |
| `/demo/chan-doan-ref` | **696.403** | 2,55 s | 16 · tb 6,2 s | 12 |

**Hai dòng in đậm nhỏ là mảnh ghép quyết định.** `/nguon` chỉ **5,6 KB** mà bị báo chậm 66 lần từ
26 IP. 5,6 KB không thể mất 3 giây trên bất kỳ đường truyền nào. Nhưng `/thu-vien` bắn **cả ba**
cùng nhịp, nên 778 KB của `/duoc-lieu` ăn hết băng thông và **kéo theo cả hai anh em bé** vào
cùng con số. `baoApiCham` đo đồng hồ treo tường ở trình duyệt nên nó **tố oan** `/nguon`.

⚠️ Hệ quả cho việc chẩn đoán về sau: **đừng đi tối ưu route bị báo chậm nhiều nhất.** Hỏi trước:
nó có đi cùng nhịp với một response béo nào không.

⚠️ **Số trong bảng này là byte CHƯA NÉN; cột gzip mới là thứ đi trên dây.** Sau khi đo lại có
nén, lời giải thích "byte" **yếu đi đáng kể** cho nhóm route nhẹ: 8 route của lượt 17:53 cộng
lại chỉ khoảng 95 KB nén — không đủ để thành 4,1 giây trên một đường bình thường. Nên **nguyên
nhân của cụm 4,1 giây vẫn CHƯA chốt được**; chỉ riêng `/duoc-lieu` (300 KB nén) là chắc chắn
nặng thật. Đừng viết lại mục này thành "đã hiểu rồi" khi chưa có `$request_time`.

**34 IP khác nhau cùng chậm một route thì không phải wifi chỗ demo.** Nhưng lỗi cũng không ở
đường truyền của họ — ở chỗ ta gửi 778 KB cho một danh sách 40 dòng.

### Đợt nghẽn nhiều-IP: ĐÃ truy ra — build chạy trên chính máy production

*(Phần này viết lại 10/10/2026 sau khi vào được VPS. Bản trước ghi là "chưa giải thích được".)*

**Máy thật:** 1 nhân CPU · 1.971 MB RAM · swap 2.047 MB (đang dùng 213 MB) · đĩa 20 GB đầy 78%.

⚠️ **Và máy KHÔNG hề kiệt sức khi rỗi** — phải nói rõ vì lượt đo đầu của tôi suýt kết luận ngược:
`load average 1.51` đo lúc 20:25 chỉ là **dư âm của lần khởi động container 3 phút trước đó**.
Đo lại bằng `vmstat 1 6`: `r=0` (không ai xếp hàng) · `wa=0` (không chờ đĩa) · `id=93–99%` ·
`si/so=0` (không thrash swap). **Load average một mình không phân định được gì — phải `vmstat`.**

Thủ phạm thật của các đợt nhiều-IP: `docker-compose.yml` khai `build:` cho **cả bốn** service,
nên **ảnh được build ngay trên máy đang phục vụ khách**. Và `frontend/Dockerfile` dòng 59 chạy
`npm run blog:pre && npm run build-only && npm run blog:post` — tức **sinh trọn 18.425 trang
tĩnh** trên chính cái nhân CPU duy nhất đó.

Đo ngày 10/10/2026: backend build xong 20:04:46 · cms 20:16:16 · frontend 20:21:47 —
**18 phút build liên tục** trong giờ phục vụ.

Đối chiếu `git reflog` trên VPS với các đợt nghẽn nhiều-IP:

| Đợt nghẽn | `git pull` trên VPS | Lệch |
|---|---|---|
| 07/10 **07:47** (9 lần) | 07/10 **07:45** | **2 phút** |
| 06/10 **21:30–21:31** (17 lần, 2 IP, max 32,1 s) | 06/10 **21:28** | **2 phút** |

⚠️ **Hai trên hai đợt kiểm được thì khớp, nhưng KHÔNG phải mọi đợt đều khớp** — `07/10 09:22`
(29 lần, 3 IP, `effective/:date` mất 13,9 s) và `08/10 23:58` không có deploy nào gần đó. Nên
build là **một** nguyên nhân đã chứng minh, không phải nguyên nhân duy nhất. Phần còn lại vẫn
chưa truy được, vì:

1. **nginx chưa ghi `$request_time`** — `log_format main` trong `kinhlac_frontend` không có nó.
2. **Log container không sống qua lần dựng lại** — log backend hiện chỉ lùi tới 13:23 cùng ngày,
   nên đợt 07/10 **đã mất vĩnh viễn**.
3. **App chỉ ghi THẤT BẠI, không ghi THÀNH CÔNG** → đếm được *số lần* chậm, không tính được
   *tỉ lệ*.

## Phần A — Thao tác GHI phải LẶP LẠI ĐƯỢC VÔ HẠI

Đây là lớp **duy nhất** ngăn hại tới **dữ liệu**, và là chỗ hiện đang mong manh nhất.

Hiện trạng: `fetch` ném `TypeError("Failed to fetch")` cho mọi kiểu đứt đường và **không nói
được máy chủ đã nhận lệnh hay chưa**. Cách chống hiện tại là một `alert()` nhờ người dùng tự kỷ
luật đừng bấm lại — **giải pháp bằng lời, không phải bằng máy**.

Hậu quả thật nếu người dùng bấm lại:

| Thao tác | Lần 2 gây gì |
|---|---|
| `book` | trúng `ux_appt_booking_active` → báo *"ca vừa có người khác đặt mất"* trong khi **chính mình** đang giữ ca đó |
| `move` | nếu đổi ca đích thì vé **đi hai chặng**; lịch sử có hai dòng `MOVED` cho một ý định |
| `cancel` | sau khi `move` thành công, lệnh `cancel` lặp lại có thể nhắm vào **vé mới** |

### Thiết kế

Bảng mới, DDL idempotent đặt trong `SchemaBootstrapService` (theo đúng lối repo đang dùng):

```sql
CREATE TABLE IF NOT EXISTS thao_tac_ghi (
  khoa        varchar(64) PRIMARY KEY,
  route       varchar(80) NOT NULL,
  ket_qua     jsonb,
  tao_luc     timestamptz NOT NULL DEFAULT now()
);
```

Máy khách sinh `Idempotency-Key` (`crypto.randomUUID()`) **một lần cho mỗi Ý ĐỊNH**, không phải
mỗi lần gửi: mở hộp thoại Chuyển vé → sinh khoá; mọi lần thử lại dùng **cùng** khoá đó; đóng hộp
thoại hoặc đổi ca đích → khoá mới.

Backend, **trong chính transaction đã có** (`book` / `move` / `cancel`):

1. `INSERT INTO thao_tac_ghi(khoa, route) VALUES ($1,$2)` — **trước** khi làm việc.
2. Trúng `23505` → rollback, đọc `ket_qua` của dòng cũ, trả **HTTP 200** kèm header
   `Idempotent-Replay: 1`.
3. Không trúng → làm việc như hiện nay, `UPDATE … SET ket_qua = $3` trước `commit`.

⚠️ **Phát lại thì KHÔNG được phát SSE lần hai.** Lời gọi `sseService.emitEvent()` nằm sau
`commit`; ở nhánh phát lại phải bỏ qua nó, không thì mọi màn hình vá lưới hai lần và nhân viên
nhận hai lần toast cho một việc.

⚠️ **Chỉ ba phương thức `book` / `move` / `cancel`** (và biến thể `*My`). `close` / `open` /
`complete` chỉ đặt `status` về một giá trị cố định nên gọi lại đã vô hại — thêm khoá cho chúng
là công không mua được gì.

⚠️ **INSERT nằm TRONG transaction là có chủ ý.** Lần gửi thứ hai tới trong lúc lần một chưa
commit sẽ **bị chặn chờ** trên unique index cho tới khi lần một xong — đúng hành vi muốn có. Và
nếu lần một `rollback` (ví dụ `ConflictException` thật) thì khoá cũng mất theo, nên thất bại vẫn
thử lại được. Để INSERT ngoài transaction là mất cả hai tính chất.

⚠️ **Không có header thì xử sự y như hôm nay.** Route nội bộ, máy khách bản cũ còn mở trong tab,
và `.ics` không gửi header này.

Dọn dẹp: xoá dòng cũ hơn 24 giờ, gắn vào cron `su-co` đã có chứ không thêm cron mới.

## Phần B — `api.ts`: hạn giờ và thử lại có kỷ luật

[`frontend/src/services/api.ts`](frontend/src/services/api.ts) — 163 dòng, hiện **không timeout,
không retry**. Một request treo giữ nguyên trạng thái "đang xử lý" và khoá nút vô thời hạn.

| | Hạn giờ | Thử lại | Khi nào |
|---|---|---|---|
| GET | 12 s | 2 lần (300 ms, 1.200 ms) | lỗi mạng · quá hạn · 502/503/504 |
| Ghi | 20 s | 1 lần | **chỉ khi** có `Idempotency-Key` (tức sau phần A) |

12 giây là rất rộng so với p90 đo được (41 ms route nhẹ, 2,55 s route nặng nhất) — cố ý, để
không cắt oan người đang ở đường yếu.

⚠️ **Tuyệt đối không thử lại 4xx.** 409 là *"ca đã có người đặt"*, 403 là thiếu quyền — thử lại
chỉ đốt thêm một vòng mạng để nhận đúng câu trả lời cũ.
⚠️ **`navigator.onLine === false` thì đừng thử lại**, chờ sự kiện `online`. Cùng lý lẽ với
`revive()` trong `stores/realtime.ts`.
⚠️ Giữ nguyên đường 401 → `/login` đang có.

Đặt ở **một chỗ duy nhất** là `api.ts`, không rải vào view — đó là điều làm nó rẻ.

## Phần C — Cắt byte

⚠️ **Viết lại 10/10/2026 sau khi đo lại CÓ NÉN.** Bản trước của mục này dùng số byte **chưa
nén** và vì thế phóng đại gấp 2–12 lần, lại còn đề xuất một việc **đã làm rồi**. Giữ lại lời
đính chính này vì nó là bài học về phép đo, không phải về mã.

| Route | Chưa nén | **Thật trên đường truyền (gzip)** | Tiết kiệm |
|---|---|---|---|
| `/duoc-lieu?page=1&limit=40` | 777.920 | **300.342** | 61% |
| `/huyet-vi` | 343.243 | **57.865** | 83% |
| `/nhht/cong-thuc` | 319.602 | **27.972** | 91% |
| `/demo/chan-doan-ref` | 213.098 | **37.525** | 82% |

- **gzip ĐÃ bật** cho mọi route API (`content-encoding: gzip`).
- **ETag ĐÃ chạy** — Express tự sinh; gửi lại kèm `If-None-Match` trả **304 / 0 byte**. Đã đo
  trên `/huyet-vi`. **Bỏ hẳn việc "thêm ETag"** khỏi kế hoạch.

Vậy phần C còn **đúng một việc**, và nó là việc một dòng:

**`ViThuocService.findLite()` không có `.select()`.** Nó gọi `createQueryBuilder('vt')` rồi trả
**mọi cột** của `ViThuoc` — gồm `mo_ta`, `thanh_phan`, `duoc_ly`, `bao_che`, `don_thuoc`,
`chu_tri`, `tham_khao`, `nuoi_duong`, `tinh_vi_quy_kinh`. Tên hàm là "lite" nhưng dữ liệu thì
không. Danh sách ở `/thu-vien` không hiển thị trường nào trong số đó.

Đích: 300 KB → **dưới 40 KB** (gzip) cho 40 mục.

⚠️ **Cắt trường là ĐỔI HỢP ĐỒNG.** `findLite` còn được dùng ở chỗ khác ngoài `/duoc-lieu` —
phải grep mọi nơi gọi nó và mọi view đọc các trường bị bỏ trước khi cắt. Một view đọc `mo_ta`
từ danh sách sẽ hiện **trống mà không lỗi gì**.

⚠️ **Nghiệm thu bằng số byte CÓ NÉN** (`curl --compressed`), không phải số thô — chính chỗ này
đã lừa tôi một lần.

## Phần D — Giữ nguyên những gì đã đúng

Phần lớn lớp "nói thật trạng thái" **đã có**, kể cả trong diff chưa commit:

- `luotTai` (bộ đếm thế hệ chống phản hồi cũ ghi đè) — **giữ**. Nó đúng vì lý do độc lập với
  "42 phút": lưới đang tải chỉ mờ đi (`opacity: .6`), nút vẫn bấm được, và `effective/:date`
  **thật sự** đã có lần mất 6,5 s (`10/10 13:15:44`, IP `171.251.153.*`) — đủ kịp bấm Chuyển vé
  trong lúc chờ. Số 6,5 s này đã kiểm chứng, giữ lại trong comment.
- `laLoiMang()` — giữ, nhưng sau phần A thì **đổi câu**: không còn phải nhờ người dùng tự kỷ luật.
- `taiNgayHong` + băng "số đang hiện là bản cũ" — giữ.
- `isStale` của `stores/realtime.ts` — nên hiện ở màn đặt lịch (hiện chưa dùng ở đó).

## KHÔNG làm gì về chống trùng lịch — nó đã đủ

Đọc hết `appointment-slot.controller.ts` không tìm ra đường lọt:

| Lớp | Nơi |
|---|---|
| `UNIQUE ("slotDate","slotTime")` | `appointment_slots_unique_slot` |
| `UNIQUE INDEX` bộ phận trên vé còn hiệu lực | `ux_appt_booking_active` |
| `pessimistic_write` trong transaction | `book`, `cancel`, `move`, `close`, `open`, `complete` |
| Khoá **cả hai** ca theo **id tăng dần** | `move()` — A→B và B→A đồng thời không kẹt chết |
| Bắt `code === '23505'` → `ConflictException` | cả `book` và `move` |

Nỗi lo "trùng lịch" của người dùng vì vậy đã được chống bằng ràng buộc CSDL, không bằng may mắn.
Điều còn thiếu là **lặp lại vô hại** (phần A) — chuyện khác hẳn với chống đua.

## Phần E — Hai lỗi thật tìm được dọc đường

### E1. Hai bảng cùng một nghiệp vụ, hai kiểu thời gian

```
appointment_slots."createdAt"/"updatedAt"   timestamp WITHOUT time zone
appointment_bookings."createdAt"/…         timestamp WITH time zone
```

Và comment đầu lớp `AppointmentBooking` nói `timestamptz` để *"khớp với appointment_slots"* —
**câu đó sai**. Mọi phép so hoặc sắp xếp trộn hai bảng lệch 7 giờ; một truy vấn chẩn đoán trong
chính lần truy này trả về 0 dòng đúng vì lý do đó.

Số đo để quyết cách vá: `max(slots."updatedAt") = 2026-10-10 12:44:00` (trần) ·
`max(bookings."updatedAt") = 2026-10-10 12:32:17+00` · `now() = 13:09:51+00`. Tức **giá trị trần
đang là UTC**, nên `ALTER … TYPE timestamptz USING "updatedAt" AT TIME ZONE 'UTC'`.

⚠️ **Đo lại ngay trước khi chạy ALTER.** Kết luận "đang là UTC" dựa trên hai mốc gần nhau ở một
thời điểm; nếu sai thì toàn bộ mốc lịch hẹn dịch 7 giờ. Sao lưu trước, theo `backend/sql/README.md`.

### E2. `xayRaLuc` của máy khách bị bỏ

Xem phần 0, việc số 2.

## Phần F — ĐÃ ĐO: build KHÔNG phải thủ phạm. Thủ phạm là 30 giây khởi động lại

⚠️ **Viết lại 10/10/2026 sau lượt deploy có đo. Giả thuyết ở bản trước của mục này SAI**, và nó
sai theo kiểu đắt nhất: nghe rất hợp lý (1 nhân CPU, build 18 phút, 2/2 đợt nghẽn trùng giờ
`git pull`) nên suýt nữa đã đẻ ra cả một kế hoạch dời build sang CI.

**Phép đo:** 1.080 mẫu `/auth/me`, mỗi giây một mẫu, bao trọn một lượt deploy thật (21:20 → 21:38).

| | Đường nền (máy rỗi) | Trong lúc build 18 phút |
|---|---|---|
| trung vị | 23 ms | **17 ms** |
| p90 | 35 ms | **31 ms** |
| p99 | — | 156 ms |
| max | 209 ms | **20.235 ms** ← đúng một lần |

Và đo riêng các route NẶNG trong lúc load đạt đỉnh (5,98 trên máy 1 nhân):
`/nguon` 221 ms (nền 255–340) · `/demo/chan-doan-ref` 546 ms (nền 2.554) — **không chậm hơn, có
chỗ còn nhanh hơn**.

Tức: **CPU bị chiếm 6 lần quá tải mà người dùng không thấy gì.** Linux vẫn chia phần cho tiến
trình Node, và Node thì chờ I/O chứ không tranh CPU. Lượt `max = 20 giây` duy nhất rơi đúng vào
khoảng container dựng lại.

**Thủ phạm thật, đo được:** backend mất **30 giây** từ lúc container khởi động đến lúc nghe được
(14:36:22 → 14:36:52 UTC: Nest boot + `SchemaBootstrap` 74 câu DDL + nối Aiven). Trong 30 giây
đó `/api/` trả **502**.

⚠️ **Và tôi suýt chẩn đoán sai lần nữa ngay tại đây.** Thấy 502 thì nghĩ ngay tới ghi chú cũ
"nginx ghim IP container cũ", bèn `nginx -s reload`, rồi API sống lại. Nhưng đối chiếu mốc:
backend sẵn sàng lúc 14:36:52, còn lệnh reload chạy lúc **14:37:01** — tức **sau 9 giây**. Lần
reload ấy **không chữa gì cả**; backend tự xong. `resolve` trong `upstream` (nginx 1.27,
`resolver 127.0.0.11 valid=10s`) vẫn đang làm đúng việc của nó.
**Hai nguyên nhân gây 502 sau deploy là khác nhau và phải phân định bằng mốc giờ, không bằng trí nhớ.**

**Kết luận cho ba đường đã nêu:**

| | Quyết | Vì sao |
|---|---|---|
| **F1** build ở nơi khác | **Chưa cần** | Build không làm chậm người dùng. Dời sang CI là công lớn mua một thứ đã không hỏng. |
| **F2** deploy ngoài giờ | **Vẫn nên** | Nhưng vì 30 giây 502, không vì 18 phút build. |
| **F3** `renice` dockerd | **BỎ** | Nó sinh ra để chữa cái không tồn tại. Giữ lại là để người sau tưởng đã có hàng rào. |

**Việc đáng làm thật, thay cho cả ba:** rút ngắn hoặc che 30 giây đó. Rẻ nhất là cho nginx
`proxy_next_upstream` / trang chờ thay vì 502 trần; đúng nhất là deploy xen kẽ (container mới
healthy rồi mới tắt cái cũ). **Chưa làm — cần một kế hoạch riêng**, và phải cân với việc
`docker-compose.yml` hiện dựng lại cả ba service cùng lúc.

⚠️ Một lỗi thật còn lại của `deploy.sh`: lượt này **dừng ở bước [6/7]** vì
`Error response from daemon: Conflict. The container name "/<hash>_kinhlac_frontend" is already
in use` — xác container đổi tên còn sót từ lần deploy hỏng trước. Bốn container vẫn lên đúng và
mã mới vẫn ra production, nhưng **bước [7/7] dọn đĩa không chạy**.

### Hai dụng cụ đo đều từng báo XANH GIẢ, và cùng một lý do

Ghi lại vì lỗi này sẽ tái diễn ở bất kỳ chốt nào đo "nhẹ/nhanh" mà quên hỏi "có đúng không":

- `tmp/do-byte-api.mjs` in **"✓ 157 B"** rực xanh trong lúc API trả 502 — trang lỗi thì nhẹ.
- `tmp/do-trong-luc-build.mjs` in **"hỏng=0"** suốt 30 giây API chết — `fetch` coi 502 là phản
  hồi hợp lệ, mà 502 lại về rất NHANH nên nó còn kéo trung vị xuống.

Cả hai nay kiểm mã HTTP. **Một chốt báo đạt khi hệ thống đang chết còn tệ hơn không có chốt.**

## Phép kiểm

| Phép kiểm | Neo vào |
|---|---|
| `appointment-idempotency.spec.ts` | gọi `book` hai lần cùng khoá → **một** vé, lần hai trả y hệt, **không** phát SSE lần hai |
| | gọi `move` hai lần cùng khoá → vé đi **một** chặng, một dòng `MOVED` |
| | `cancel` lặp lại bằng khoá cũ sau khi `move` → **không** đụng vé mới |
| | không gửi header → xử sự y như hôm nay |
| `api.ts` | 4xx **không** được thử lại · ghi không có khoá thì **không** thử lại · quá hạn thì ném lỗi phân biệt được |
| `appointment-chuyen-ve.spec.ts` | đã có, giữ nguyên — bốn luật chuyển vé |
| Nghiệm thu byte | `curl -w %{size_download}` cho 4 route của phần C, có ngưỡng, chạy lặp lại được |

## Thứ tự dựng (người dùng chốt 10/10/2026: "chốt lại sự thật trước")

1. **Phần 0** — sửa comment sai, thêm `xay_ra_luc_khach`.
2. **Phần A + B + E** — phần chịu lực: lặp lại vô hại, hạn giờ, hai lỗi.
3. **Phần C** — cắt byte.
4. **Phần F** — hạ tầng: thôi build trên máy production.

Phần C để sau không phải vì nó nhẹ (nó chữa phần lớn 854 lần chậm), mà vì nó **đụng hợp đồng
API** nên cần một lượt grep cẩn thận, trong khi A + B gói gọn trong ba phương thức và một tệp.
