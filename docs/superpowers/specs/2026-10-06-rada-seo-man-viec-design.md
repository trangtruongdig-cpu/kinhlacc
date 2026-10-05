# Rada SEO — MÀN VIỆC: ba vòng, một hàng đợi, và hiệu quả đo được

Ngày: 06/10/2026 · Trạng thái: **ĐẶC TẢ, chưa dựng** · Thay cho cách tổ chức bảy-tab-phẳng
(commit `9d04cdc` đã gom thành hai vòng; tài liệu này thêm **vòng thứ ba** và đổi tab mặc định).

Căn cứ: lời người dùng 06/10/2026 — *"dùng kiểu đơ đơ mà không mô tả rõ được… không hiểu nó
đang làm gì? cố hiểu thì nó lại rất chậm và chưa trực quan quy trình"*, và *"phải chạy mượt và
hiệu quả công việc phải thấy được"*.

## Vì sao có tài liệu này

Màn Rada SEO đã đúng về tư duy (bảy chặng là một quy trình) nhưng sai về chỗ đặt trọng tâm: nó
mở ra là **bảy ngăn dữ liệu**, trong khi câu người dùng cần trả lời trong 5 giây đầu là **"giờ
tôi làm gì"**. Người dùng chốt điều đó 06/10/2026.

Ba lời phàn nàn ứng với ba nguyên nhân khác hẳn nhau, và phải chữa riêng:

| Lời phàn nàn | Nguyên nhân đo được | Chữa ở |
|---|---|---|
| "đơ đơ" | mở màn 19 lượt đi-về tuần tự trên pool `max: 1` | phần B |
| "không hiểu nó đang làm gì" | màn hình trình bày DỮ LIỆU, không trình bày VIỆC | phần A |
| "hiệu quả phải thấy được" | `tongHopLoaiSua` chôn ở tab 6; không có mốc thời gian để đếm việc đã làm | phần C |
| "thiếu nền" (người dùng bổ sung) | tháp chỉ 3 tầng; `benh_hoc`/`cham_cuu`/`nguon` bị dùng ngược | phần D |

## Số đo hiện trạng (đọc từ code 06/10/2026)

Mở màn gọi **năm** route trong một `useEffect` (`admin.jsx:2294-2303`). Pool CSDL của CMS là
`max: 1` (`astro.config.mjs`) nên chúng **xếp hàng**, không song song — `Promise.all` ở đây không
nhanh hơn một mili giây nào:

| Route | Lượt đi-về | Ghi chú |
|---|---|---|
| `tong-quan` | ~8 | đã cắt từ ~44 |
| `chien-luoc-tong-quan` | 3 | `dsHuong` + `dsCumNghia` + `dsKeHoach` |
| `leo-top-tong-quan` | 4 + GSC | `dsLeoTop` + `dsKeHoach` + `gscTheoTrang` + `gscTuKhoa` |
| `nhap-tong-quan` | 1 | |
| `viec-dem` | 3 | `dsKeHoach` + `dsLeoTop` + `goi_y_nguoc` |

**≈ 19 lượt × RTT 98,9 ms ≈ 1,9 giây** khi mọi đệm đã ấm. `dsKeHoach` bị đọc **ba lần**,
`dsLeoTop` **hai lần**, trong cùng một lượt mở màn. Người xem tab Radar trả tiền cho bốn tab
chưa mở.

---

## A. Màn Việc

Tab mới `Việc`, **đứng trước thanh quy trình và là tab mặc định**. Thanh ba vòng giữ nguyên, tụt
xuống thành điều hướng phụ: nó trả lời *"hệ thống gồm những gì"*, màn Việc trả lời *"giờ tôi làm
gì"*.

**Hai luật về việc tab nào mở ra đầu tiên** — cả hai đã có tiền lệ trong `admin.jsx` và phải giữ:

- **Tab đã lưu trong localStorage THẮNG tab mặc định.** `viec` chỉ là giá trị rơi về khi
  `TAB_LS_KEY` trống hoặc giữ một key không còn tồn tại. Người đang làm dở ở tab Leo top mở lại
  trang phải về Leo top, không bị kéo về màn Việc.
- **Người bậc Editor (40) vẫn mở thẳng tab Nháp.** Route `viec` đọc `ke_hoach` + `leo_top` +
  `goi_y_nguoc` nên giữ quyền mặc định `plugins:manage`; Editor gọi nó sẽ nhận 403. Nhánh
  `tai().then((khongQuyen) => …)` hiện có phải mở rộng cho route mới, không thì Editor thấy màn
  Việc kẹt ở một dòng lỗi và không có lối sang tab Nháp.

### Dòng việc

Mỗi dòng có đúng bốn thứ: **động từ · đối tượng · nút hành động · một câu vì sao**.

```
① Nhận hướng  "Châm cứu cho dân văn phòng"              [Nhận] [Bỏ]
   Bot đang đứng chờ — không nhận thì bước 3, 4, 5 nằm im cả tuần.

② Duyệt nháp  "Huyệt Túc Tam Lý: công dụng và cách bấm"  [Mở để duyệt ↗]
   Model đã viết xong, đã tốn tiền. Chưa duyệt thì tiền đó nằm im.

③ Thêm 1 dòng FAQ  /huyet/phuc-tho/                      [Xem phiếu] [Đã sửa]
   51/97 lượt hiển thị đang chờ đúng một dòng. Việc 2 phút.
```

Tên việc là **động từ**, không phải tên bảng. Câu "vì sao" dưới mỗi dòng chính là chỗ chữa
"không hiểu nó đang làm gì": lời giải thích đi kèm TỪNG việc, không nằm trong tài liệu mà không
ai đọc.

### Làm việc NGAY tại dòng (người dùng chốt)

Năm loại việc làm xong được bằng **một lời gọi ghi** — chúng có nút hành động tại chỗ:

| Việc | Route | Có sẵn |
|---|---|---|
| Nhận / bỏ hướng | `huong-dat` | ✓ |
| Duyệt / bỏ kế hoạch | `ke-hoach-dat` | ✓ |
| Đánh dấu đã sửa | `leo-top-da-sua` | ✓ |
| Giao cụm thành bài dự kiến | `khoang-trong-giao-viec` | ✓ |
| Viết ngay | `lo-viet-chay` | ✓ |

Hai loại **không** làm ngay được, và chúng có nút mở đúng chỗ thay vì nút hành động:

- **Mạng nhện** — plugin chỉ sinh ĐỀ XUẤT; việc chèn link là người biên tập tự làm trong CMS.
  Không có route chèn, và cố ý không có: tự sửa thân bài đã đăng là đổi nội dung người đọc đang
  xem mà không ai duyệt.
- **Nháp** — duyệt/đăng làm ở khu quản trị bộ blog của EmDash.

### Thứ tự xếp: CHẶN trước, RẺ sau

Khác với "rẻ trước" thuần của `leo-top/so-ho-ai.mjs`, và lý do cụ thể: một hướng không nhận là
bot đứng im cả tuần dù việc chỉ mất 10 giây; một dòng FAQ không thêm thì chỉ mất vài lượt nhấp.

1. **Hướng chờ nhận** — chặn cả dây chuyền (`ghiCum` chỉ nhận cụm thuộc hướng `da_nhan`).
2. **Nháp chờ duyệt** — tiền model đã chi rồi.
3. **Kế hoạch chờ duyệt** — mở đường cho lò viết.
4. **Phiếu leo top `them_faq`** (giá 1), rồi **`them_tieu_de`** (giá 2).
5. **Mạng nhện có neo sẵn** (xanh) trước loại phải viết thêm câu (vàng).
6. **`thieu_noi_dung`** (giá 3) — việc viết thật, xếp cuối.

### Hàng đợi rỗng phải nói VÌ SAO rỗng

⚠️ Rỗng trơn là câu trả lời sai. Ba trạng thái khác hẳn nhau và phải nói ba câu khác nhau:

- *"Không có việc nào chờ anh — bot đã đọc 40/40 trang đêm qua, hàng đợi còn 1.138 trang, ~28
  đêm nữa"* → thật sự hết việc
- *"Không hỏi được kho app: ECONNREFUSED tới http://backend:3001"* → hỏng đường
- *"Chưa ai dò — bấm Dò lại cho bài đã đăng"* → chưa có dữ liệu

Cùng bài học `cauKhoangTrong()` và tab Mạng nhện: **một con số cho ba trạng thái là con số vô
dụng**, và cái rỗng đọc ra như "chưa có việc" trong khi thật ra là "chưa ai dò".

---

## B. Hết đơ

**B1. Mở màn gọi MỘT route.** Route mới `viec` đọc đúng bốn thứ (`dsHuong`, `dsKeHoach`,
`dsLeoTop`, `goi_y_nguoc`), đệm KV 60 giây — cùng lối `viec-dem` đang dùng. Bốn route tổng quan
kia chuyển sang **tải khi mở tab**, đúng tiền lệ `khoang-trong` và `huong`.

**≈ 19 lượt → 4 lượt. ≈ 1,9 s → ≈ 0,4 s.**

⚠️ Phải giữ cả `useEffect` theo `tab` lẫn nhánh trong `doiTab` — tab được KHÔI PHỤC từ
localStorage không đi qua `doiTab`, và đó là lỗi đã cắn 02/10/2026 (kẹt ở "Đang tải…" vĩnh viễn).

**B2. `viec-dem` biến mất, nhập vào `viec`.** Huy hiệu trên thanh quy trình lấy từ chính hàng đợi
vừa tải. Việc này tự nó bỏ `dsKeHoach` lần thứ ba và `dsLeoTop` lần thứ hai.

**B3. Hành động KHÔNG tải lại cả màn.** Bấm Duyệt → dòng **mờ đi + spinner ngay tại dòng** → máy
chủ trả OK thì dòng rời hàng đợi; trả lỗi thì dòng sáng lại kèm câu lỗi tại chỗ. Thay cho
`lam()` hiện tại, vốn `goi(route).then(tai)` kéo lại toàn bộ `tong-quan` sau mỗi cú bấm.

⚠️ **Cố ý KHÔNG làm optimistic update.** Dòng rời hàng đợi chỉ khi máy chủ xác nhận. "Duyệt" là
ghi thật; báo xong khi chưa xong là đúng cái lỗi `ghiNhanLo` từng mắc (xử lý `slice(0, 50)` rồi
thôi, không đếm phần dư).

**B4. Dấu hiệu bận ở ĐÚNG nút vừa bấm.** Nút tự đổi chữ (`Duyệt` → `⏳ Đang duyệt…`) và tự vô
hiệu hoá. Cờ `dangBan` toàn cục ở cuối thanh quy trình bỏ đi — nó in ở chỗ mắt người bấm không
nhìn, nên không ngăn được cú bấm thứ hai, mà cú bấm thứ hai mới là thứ xếp thêm một lượt tải lại
vào hàng.

**Phép kiểm neo lại** (`plugin.test.mjs`, cùng kiểu phép đếm `url.count` đã có):

- mở màn được phép hỏi kho **tối đa 4 lượt**
- `dsKeHoach` chỉ được đọc **một** lần trong một lượt mở màn

Không có chốt này thì lần sau ai thêm một route vào `useEffect` mở màn là trở về 19 lượt, mà
không gì báo.

⚠️ **B1–B4 không chữa lượt mở màn NGUỘI.** `tong-quan` còn hâm sẵn kho app và `demUrlTatCa` đệm
10 giây; lần đầu trong ngày vẫn chậm vì đệm rỗng, và đó là giới hạn của `max: 1` chứ không phải
của màn hình. Cái B1 mua được là **mỗi cú bấm sau đó** — phần gặp nhiều nhất.

---

## C. Hiệu quả thấy được

Ba tầng, theo khoảng cách thời gian từ cú bấm.

**C1. Ngay sau khi bấm — nói ra HỆ QUẢ, không nói "Đã lưu".**

> Đã nhận hướng → **ca 02:30 đêm nay** sẽ phân cụm cho nó
> Đã duyệt bài → **lò viết 03:30** sẽ viết, sáng mai có nháp
> Đã đánh dấu sửa → chụp mốc hạng **14,2**; đo lại sau **7 · 14 · 28 ngày**

Không cần dữ liệu mới, chỉ là chữ. Mỗi cú bấm tự nói ra nó vừa khởi động cái gì và khi nào thấy
kết quả.

**C2. Sổ việc đã làm** — một dòng ở đầu màn Việc: *"Tuần này 14 việc: 9 FAQ · 3 bài duyệt · 2
hướng nhận"*.

Cần thêm `datLuc` vào `kho.datKeHoach` và `kho.datHuong`. Hiện `datKeHoach` chỉ ghi
`{ ...cu, trangThai }` (`kho.mjs:537`) nên **không có cách nào đếm việc đã làm**.

⚠️ **Chỉ ghi được MỐC, không ghi được AI.** `ctx` của plugin EmDash không mang thông tin người
dùng (đã kiểm 06/10/2026), nên không có `datBoi`. Sổ vì vậy nói *"tuần này 14 việc"*, KHÔNG nói
*"anh làm 14 việc"* — đúng một người quản trị thì hai câu như nhau, nhưng câu thứ hai là lời hứa
dữ liệu không đỡ được. Muốn có "ai làm" thì phải đi qua `ctx.log` hoặc một trường do màn hình
truyền lên, và cả hai đều là dữ liệu máy khách tự khai — không dùng.

⚠️ **Giới hạn không tránh được:** sổ chỉ ghi từ ngày cài, nên việc làm trước đó không bao giờ vào
sổ — tuần đầu dòng này ghi số thấp giả. Dòng phải nói rõ *"tính từ 06/10/2026"*. Đúng cái bẫy tab
Mạng nhện đã cắn: rỗng vì chưa ai dò, mà đọc ra như "không có việc".

**C3. Kết quả đo được** — *"12 trang anh đã sửa: 7 lên · 3 yên · 2 tụt"*. Nâng `tongHopLoaiSua`
từ tab 6 (`plugin.mjs:1116`) lên màn Việc. **Dùng lại engine `leo-top/vong-hoc.mjs`, không viết
lại.**

Ba ranh giới trung thực giữ nguyên nguyên văn, **không được nới**:

- **ĐỒNG XUẤT HIỆN, KHÔNG PHẢI NHÂN QUẢ** — một phiếu mang nhiều loại sửa, người quản trị sửa cả
  gói rồi mới bấm, nên không quy công cho loại nào được. Ghi chú này LUÔN in (đã có phép kiểm).
- **Dưới 5 phiên thì hàng mờ đi** (`TOI_THIEU_KET_LUAN = 5`, `duKetLuan: false`) — 1/1 = 100%
  chẳng nói gì. Bảng xếp theo SỐ PHIÊN, không theo tỉ lệ lên.
- **Bài dưới 14 ngày không bị kết tội** (`TUOI_DU_KET_LUAN`) — GSC chậm 2–3 ngày, trang mới cần
  nhiều tuần mới ổn hạng. Chưa cấu hình GSC thì về hạng `moi`, KHÔNG phải `chua_hien`.

⚠️ C3 là tầng duy nhất trả lời thật câu "công việc có hiệu quả không", và nó **cần 5 phiên × 28
ngày mới nói được gì**. Tuần đầu nó ghi "chưa đủ dữ liệu để kết luận" — đó là câu đúng, không
phải lỗi. C1 và C2 là thứ thấy ngay.

---

## D. Vòng NỀN (người dùng bổ sung 06/10/2026)

Thanh quy trình thành **ba** vòng. NỀN đứng đầu vì hai vòng kia đứng trên nó về nhân quả: nền
vững → tháp cao → chiếm được đất → giữ được đất.

```
NỀN — kho tri thức        ⓪ Tháp · Nguồn · Semantic · Chữ
CHIẾM ĐẤT — viết mới      ①→②→③→④→⑤
GIỮ ĐẤT — nâng cái đã có  ⑥→⑦
```

### Bốn trụ, và chúng đang nằm ở hai hệ thống khác nhau

| Trụ | Con số | Lấy từ |
|---|---|---|
| Tháp | cụm nào có ô trống (xem D4) | `/rada/cum-ngu-nghia` |
| Nguồn | % bài thuốc / vị / huyệt dẫn được sách (33.516 cạnh) | `/rada/ung-vien` + `soNguonDan` |
| Semantic | cụm gom nhiều mảng, kèm dòng truy nguyên `chủ trị → phác đồ` | `khopQua` |
| Chữ | 1.744 hỏng · 3.022 yếu · 4.212 trống trường | `/tham-dinh/trang-thai` |

### D1. Việc nền KHÔNG được trộn vào hàng đợi SEO

Hàng đợi có **hai khoang riêng**: *Việc hôm nay* (SEO, gấp — 5–15 dòng) và *Vá nền* (**tối đa 3
dòng**).

"Tối đa 3 dòng" là **trần HIỂN THỊ, không phải hạn ngạch theo ngày**: khoang luôn hiện 3 việc nền
đứng đầu, làm xong một việc thì việc kế tiếp lên thay ngay trong lượt tải sau. Cố ý không đếm
"hôm nay đã làm mấy việc nền rồi" — một bộ đếm theo ngày cần mốc thời gian theo người dùng, mà
`ctx` không có người dùng (xem C2), nên nó sẽ là bộ đếm dùng chung cho mọi người và chặn sai
đối tượng. Cùng lý lẽ với `boHanNgach: true` khi người bấm "Viết ngay".

⚠️ Trụ Chữ một mình có 1.744 mục hỏng. Trộn vào là nhấn chìm cả hàng đợi — đúng cái bẫy đã ghi
trong CLAUDE.md: màn hình báo *"65.321 lời phê chờ bạn duyệt"* thì người ta thôi đọc cả màn hình.

### D2. Trụ Semantic KHÔNG tự dò được — chuyện đã thử rồi bỏ

Phép dò tự động "gắn cờ khi cả nhánh huyệt của một cụm chỉ đến từ MỘT chủ trị" đã **bắn 38/62
cụm, phần lớn vu oan** (cả kho chỉ có 110 + 139 tên phác đồ nên một chủ trị khớp lẻ loi là chuyện
thường).

Nên trụ này **không sinh việc tự động**. Nó hiện bảng *chủ trị → phác đồ → mấy huyệt* để người tự
thấy chỗ xếp nhầm, kèm nút chạy `backend/tmp/go-chu-tri-trung-cum.mjs` ở chế độ **thử**. Hứa một
phép dò ở đây là hứa thứ đã đo thấy không chạy.

⚠️ Và **chủ trị nằm ở hai cụm là BÌNH THƯỜNG** — "Đau thần kinh tọa" thuộc cả cơ xương khớp lẫn
thần kinh. Đừng dựng phép dò "chủ trị trùng cụm". Chỗ sai thật là cụm SỌT GOM (#492).

### D3. Trụ Chữ sống ở app KHÁC, phải đi qua HTTP

Bot thẩm định ở `defaultdb` + `/app/tham-dinh`; plugin ở `kinhlac_cms`. Hai kho **không join
chéo** và mở pool thứ hai tới Aiven là đường sập (trần 20, Aiven đã ăn 8).

Cần thêm **`GET /rada/suc-khoe-nen`** ở `rada-ho-so.router.ts` gộp bốn con số; plugin hỏi qua
`RADA_SEO_API` — đúng lối `/rada/ho-so-cum` đang dùng, bằng `fetch` toàn cục (KHÔNG
`ctx.http.fetch`: bộ chặn SSRF của EmDash cấm host nội bộ).

⚠️ Gốc API khai KHÔNG kèm `/api`, và cổng là **3001** ở cả hai nơi — `http://backend:3001` trên
VPS. Khai 3000 là `ECONNREFUSED` trên production trong khi máy dev chạy ngon (đã xảy ra
03/10/2026).

### D4. Tháp NỀN có SÁU tầng — và ĐỪNG CỘNG chúng lại

`thap = soVi + soBai + soHuyet` (`rada-ho-so.controller.ts:421`) chỉ có **ba** tầng. Ba tầng còn
lại đã có trong code nhưng bị dùng **ngược**: `benh_hoc` và `cham_cuu_tri_benh` khai là
`BO_NHU_CAU` (`khoang-trong/ho-so.mjs:155`) chỉ để trả lời *"mình đã có trang chưa, đừng viết
trùng"*; `nguon_y_van` chỉ có `soNguonDan` cho **riêng huyệt** (dòng 582).

Lý do nó bị bỏ sót, nói ra thì rõ: **"mình có TRANG rồi" và "mình có TRI THỨC NỀN" là hai chuyện
khác nhau**, mà code gộp làm một. Trang bệnh học "Mất ngủ" 47.211 ký tự — với vòng Chiếm đất là
*"đừng viết nữa, tự trùng"*; với vòng Nền là *"một tầng rất dày"*. Cùng dữ liệu, hai cách đọc,
chỉ cách thứ nhất được dùng.

| Tầng | Đo gì | Đã có? |
|---|---|---|
| Vị thuốc | `soVi` | ✓ |
| Bài thuốc | `soBai` | ✓ |
| Huyệt | `soHuyet` qua phác đồ | ✓ |
| **Bệnh học** | có trang / số ký tự | ✗ chỉ dùng làm cờ chống trùng |
| **Châm cứu trị bệnh** | có trang / số ký tự | ✗ như trên |
| **Nguồn y văn** | số sách dẫn được | ✗ chỉ có cho huyệt |

Kinh mạch **hiện ra nhưng không cộng** — cả kho 18 đường, nó gần như hằng số.

⚠️ **ĐỪNG CỘNG — hiện sáu ô.** Cộng 47.211 ký tự với 55 bài thuốc ra một con số vô nghĩa. Thước
nền là **một thanh sáu ô**, mỗi ô đầy hoặc trống; "chỗ mỏng" = ô nào trống, đọc được bằng mắt:

```
chảy máu cam   Vị 55 · Bài 55 · Huyệt 12 · Bệnh học ▢ · Châm cứu ▢ · Nguồn 8
                                            ↑ hai ô trống — đây là chỗ mỏng
mất ngủ        Vị 113 · Bài 113 · Huyệt 27 · Bệnh học ▣47k · Châm cứu ▣ · Nguồn 14
```

### D5. KHÔNG được sửa `thap` cũ

Vòng Chiếm đất giữ nguyên `soVi + soBai + soHuyet`: `toiThieuThap` lọc theo chính nó và có phép
kiểm neo lại, nên đổi nó là **lặng lẽ đổi mọi con số của tab Khoảng trống**. Thước nền là
**trường mới** (`tangNen`), đứng cạnh, không thay thế.

### Hiệu năng của tab Nền

Bốn trụ đều là truy vấn nặng: `cumNguNghia` **3,0 s**, `ungVien` **1,3 s** — và đó là số **sau**
khi đã tối ưu bằng Aho–Corasick (trước: 10,2 s). Tab Nền vì vậy **tải khi mở, không tải lúc mở
màn**, đệm 10 phút. Nếu không thì phần D phá đúng cái phần B vừa cắt được.

---

## Ranh giới — những gì tài liệu này KHÔNG làm

- **Không bỏ bảy tab.** Chúng là đường tự khảo cứu, chỉ tụt xuống hàng hai.
- **Không tự chèn link mạng nhện**, không tự sửa thân bài đã đăng.
- **Không tự nhận hướng.** Cổng người ở giữa giữ nguyên — hướng quyết định cả tháng nội dung, và
  mô hình đã từng gắn nhãn "An toàn" cho tiêu đề vượt phạm vi Y sỹ.
- **Không sinh việc nền tự động cho trụ Semantic** (xem D2).
- **Không nới ba ranh giới của vòng học** (xem C3).

## Phép kiểm

| Phép | Neo điều gì |
|---|---|
| `plugin.test.mjs` — mở màn ≤ 4 lượt, `dsKeHoach` đọc 1 lần | B1, B2 |
| `plugin.test.mjs` — hàng đợi rỗng trả ba câu KHÁC nhau | A (rỗng nói vì sao) |
| `plugin.test.mjs` — thứ tự xếp: hướng chờ nhận luôn đứng trước phiếu `them_faq` | A (chặn trước, rẻ sau) |
| `plugin.test.mjs` — khoang vá nền tối đa 3 dòng dù kho có 1.744 mục hỏng | D1 |
| `leo-top/vong-hoc.test.mjs` (đã có) — ghi chú đồng-xuất-hiện luôn in | C3 |
| `rada-ho-so.controller.spec.ts` — `thap` KHÔNG đổi giá trị khi thêm `tangNen` | D5 |

## Chia kế hoạch

1. **Phần B** trước — nó độc lập, chữa cái đau nhất, và không đổi dữ liệu.
2. **Phần A** — màn Việc trên nền B đã nhanh.
3. **Phần C** — cần thêm `datLuc`/`datBoi`, nên đi sau A.
4. **Phần D** — cần route backend mới (`/rada/suc-khoe-nen`) + trường `tangNen`, nặng nhất, đi
   cuối.

Mỗi phần là một kế hoạch riêng, nghiệm thu được độc lập.
