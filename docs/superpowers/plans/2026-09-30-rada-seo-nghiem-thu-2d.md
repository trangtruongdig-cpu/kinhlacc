# Nghiệm thu 2D: leo top (GSC → SERP → sơ hở → phiếu → đo lại), trên bàn thử

Đo ngày 30/09/2026 trên **bản dựng** (`node ./dist-thu/server/entry.mjs`) của mã ở HEAD `c6984de`.
Bàn thử dựng theo "Công thức cấu hình thay thế" trong `2026-09-30-rada-seo-ket-qua-buoc-0.md`. DB là
libsql tệp và kho ảnh `local`, cả hai nằm trong scratchpad; `outDir: ./dist-thu`;
`plugins: [auditLog, radaSeo]` với descriptor thật (`src/plugins/rada-seo/descriptor.mjs`). Server chạy
bằng `env -i`, `PGHOST=127.0.0.1 PGPORT=1` (cổng chết), `PORT=4399`, `TZ=UTC`, `RADA_SEO_CA_DEM=1`, và
ba biến `GSC_OAUTH_CLIENT_ID/CLIENT_SECRET/REFRESH_TOKEN`. Ba biến này được `grep` thẳng từ `cms/.env`
vào môi trường của lệnh, không in ra và không ghi vào tệp nào. Đăng nhập theo mục 5b: chạy trình setup
thật qua Playwright với passkey ảo, không đúc vé SSO.

**Search Console là THẬT và chỉ đọc**: property `https://kinhlac.online/` (mặc định khi thiếu
`GSC_SITE_URL`). Trang SERP cũng là trang THẬT: tôi tự chọn URL công khai từ kết quả công cụ tìm web
của phiên (WebSearch), không cào Google.

Log server chỉ có 3 dòng (khởi động, migration, auto-seed). Không dòng nào chứa `ec_pat_`, Aiven hay
ECONNREFUSED. 12 ký tự đầu của cả ba giá trị GSC không xuất hiện trong log, trong `dist-thu/` hay trong
thư mục bàn thử. `grep -rl aivencloud dist-thu/` ra 0 tệp. Phép kiểm đơn vị
`node --test "src/plugins/rada-seo/**/*.test.mjs"` đạt **274/274**.

## Dữ liệu bơm vào

Phần lớn dữ liệu là thật (GSC, 7 trang SERP, trang của mình trên kinhlac.online). Tôi chỉ bơm tay ở
hai chỗ, đều qua bảng `_plugin_storage` (`plugin_id='rada-seo'`, bộ `leo_top`):

- **Báo cáo đọc trang** (`rada_ghi_so_ho`) là dữ liệu GIẢ do tôi soạn, đúng như đề bài.
- **Đẩy lùi một phiên để đo lại được hôm nay.** Phiên `lt_4245…` ("huyệt hạ quan ở đâu") được đặt
  `trangThai: da_sua`, `ngaySua: 2026-09-15`, `taoLuc` 01/09, `soHoLuc` 02/09 và `doLai: []`. Phiên này
  không có bản đồ và phiếu. Mục đích: để ca chạy đo lại mốc +14 bằng GSC thật, và để có `doLai` mà
  thử hộp xác nhận.

## Bảng kết quả

| # | Phép đo | Kết quả | Số liệu / nguyên văn |
|---|---|---|---|
| 1 | Bật MCP, `tools/list` có 12 công cụ `rada-seo__…` | **ĐẠT** | `PUT …/plugins/rada-seo/mcp {"enabled":true}` trả `200`. Khoá `ec_pat_PBUW…` chỉ có scope `["mcp:tools:rada-seo"]`. Tổng **71** công cụ = 59 lõi (danh sách không lọc theo scope, như 2B-1) + 12: `rada_lay_viec rada_ghi_phan_tich rada_tim_lien_ket rada_lay_du_lieu_chien_luoc rada_de_xuat_huong rada_ghi_cum rada_de_xuat_ke_hoach rada_lay_tu_khoa_leo_top rada_nop_serp rada_lay_trang_serp rada_ghi_so_ho rada_xong_phan_tich`. |
| 2.1 | `rada_lay_tu_khoa_leo_top` với GSC thật | **ĐẠT** | Lượt đầu mất 1.067 ms và mở 5 phiên, mọi phiên ở `cho_serp`. Ba dòng mẫu (từ khoá · trang · hạng bình quân · hiển thị 29 ngày → hiển thị/ngày): **"huyệt thượng cự hư"** · `/huyet/thuong-cu-hu/` · 5,23 · 31 → 1,15/ngày; **"huyệt lãi câu"** · `/huyet/lai-cau/` · 8,2 · 50 → 1,85/ngày; **"huyệt hạ quan ở đâu"** · `/huyet/ha-quan/` · 7,06 · 47 → 1,74/ngày. Cửa sổ gốc là `{soNgay: 29, tu: 2026-09-02, den: 2026-09-30}`. Mọi `tuKhoa` đều có dạng `<<<TU_KHOA>>>huyệt lãi câu<<<HET_TU_KHOA>>>`. Có `huongDan`, kèm đoạn AN TOÀN về TRANG_SERP/TU_KHOA. Không có `loi`. |
| 2.2 | Gọi lại ngay: không mở trùng | **ĐẠT** | Lượt 2 (636 ms): `dangMo` gồm 5 phiên cũ, cũ nhất đứng trước, và `moi` gồm 5 phiên MỚI (cặp khác: "huyệt lãi câu nằm ở đâu", "phục thỏ", "hạ quan là gì", "huyệt phục thố ở đâu", "huyệt đại chung"). Đây là đúng thiết kế: trần là 10 phiên mở và ≤ 5 phiên mỗi lượt. Không cặp từ khoá–trang nào trùng. Lượt 3 (26 ms): `dangMo` 10, `moi` 0, ghiChu `Đã có 10 phiên chưa xong (trần 10) nên không mở phiên mới: …`. Lượt này không gọi GSC. |
| 3.1 | `rada_nop_serp` với URL công khai thật | **ĐẠT** (nhưng 4/7 trang đối thủ không tải được) | Phiên "huyệt thượng cự hư". **Lần 1**: 5 URL, 1.219 ms. Tải được 2 trang (dongyvugiaduong.com, hoctrilieu.com) và trang mình (tự thêm, `thuTu null`). **Lần 2** (nộp lại khi phiên đang `cho_doc`, thay danh sách cũ): 7 URL, **1.240 ms**, `soTrangDo 4`. Từng trang: #1 bacsituyetlan.com `loi` · #2 tapchidongy.net `loi` · #3 dongyvugiaduong.com ok · #4 amp.thaythuoccuaban.com `loi` · #5 chuabenh.net ok · #6 nhathuoclongchau.com.vn `HTTP 403` · #7 hoctrilieu.com ok · Mình ok. Ba trang `loi` cùng một câu: `không tải được (quá hạn 10 s, bị chặn hoặc lỗi mạng)`. Không trang nào `catBot`, `boQua []`. |
| 3.2 | `rada_lay_trang_serp` trả chữ có dấu mốc | **ĐẠT** (phần thoát ký tự chưa thử được trên dữ liệu thật) | 21 ms, 4 trang. Mỗi trang có dạng `<<<TRANG_SERP id=3>>>\n…\n<<<HET_TRANG_SERP id=3>>>`, id là `thuTu` (của mình là id=8). Độ dài: 1.512 / 6.048 / 5.246 / 3.867 ký tự. 6.048 = 6.000 chữ trang + 48 ký tự dấu mốc, nên trần 6.000 đúng. Không trang thật nào chứa `<<<`/`>>>`, nên luật thoát sang `‹‹‹`/`›››` không được thử ở đây; phần đó do phép kiểm đơn vị giữ. |
| 4.1 | Phiếu: "Chống chỉ định" vào `themY` | **ĐẠT** | Báo cáo giả: 3 trang đối thủ đều có ý "Chống chỉ định", trang mình chỉ có "Chỉ định". `yCotLoi`: `Vị trí huyệt (100%)`, `Tác dụng huyệt (100%)`, `Chống chỉ định (100%)`, `Cách bấm huyệt (67%)`, `Phối huyệt (67%)`. `phieu.themY = ["Chống chỉ định","Cách bấm huyệt","Phối huyệt"]`, `khacBiet = ["Chỉ định"]`. Hai ý khác cực tính KHÔNG bị gộp. |
| 4.2 | Đoạn "chữa khỏi hẳn" vào `cat` | **ĐẠT** | `phieu.cat = ["Đoạn nói bấm huyệt này giúp chữa khỏi hẳn viêm đại tràng"]`. |
| 4.3 | Lời khuyên độ dài bị bỏ | **ĐẠT** | Mục `ruom` "Nên viết dài hơn để đủ 1.500 chữ" và ý "Viết dài hơn cho đủ ý" của trang mình không có mặt trong `cat`, `themY` hay `khacBiet`. |
| 4.4 | Gửi lại đúng báo cáo thì trả `daGhiTruoc` | **ĐẠT** | Lượt 2 (23 ms): `"daGhiTruoc": true` và cùng phiếu. Khác biệt duy nhất: `loiNap` rỗng, vì lượt này không nạp chỉ mục. |
| 4.5 | Thiếu báo cáo trang mình thì trả 400 kèm lý do tiếng Việt | **ĐẠT** | Route: `HTTP 400 {"code":"BAD_REQUEST","message":"Chưa ghi được sơ hở: thiếu báo cáo cho trang của mình (laMinh: true). Phiên vẫn ở cho_doc: gửi lại báo cáo đủ trang, hoặc nộp lại danh sách URL bằng công cụ có tên kết thúc bằng rada_nop_serp."}`. Qua MCP: `isError` với cùng câu, có tiền tố `[BAD_REQUEST]`. Phiên vẫn ở `cho_doc`. |
| 4.6 | (thêm) Chưa đủ 5 trang thì không kết luận ý thừa | **ĐẠT** | `ghiChu: ["Chỉ đo được 3 trang đối thủ (cần ≥ 5) — chưa kết luận ý nào là thừa."]`. |
| 5.1 | Tab Leo top: danh sách phiên | **ĐẠT** | Dùng Playwright, tôi đã tự mở ảnh. Tab hiện "Phiên leo top (10)" với các cột Từ khoá / Trang của mình / Hạng ban đầu / Hiển thị/ngày / Trạng thái / Tạo lúc. Khung vàng đầu tab: **`1 phiếu chờ bấm "Đã sửa theo phiếu": huyệt thượng cự hư — ra phiếu 0 ngày trước`**. |
| 5.2 | Mở phiên: bảng ý × trang, cột Mình tô, phiếu | **ĐẠT** | Có dòng cam "Trang không đo được: #1 bacsituyetlan.com (…) · #2 … · #4 … · #6 nhathuoclongchau.com.vn (HTTP 403)". Bảng "Ý × trang" có các cột `#3 #5 #7 Mình`. Ô tiêu đề và ô của cột Mình có nền `rgb(254, 243, 199)` (vàng), các ô khác trong suốt. Hàng "Chống chỉ định · cốt lõi 100% · ✓ ✓ ✓ —", hàng "Chỉ định · khác biệt (chỉ mình có) · — — — ✓". Tiếp theo là bảng "Sơ hở từng trang" (hàng Mình tô vàng), khối "Dấu hiệu người thắng" và "Phiếu sửa trang của mình" đủ mục: thêm ý, đưa câu trả lời lên đầu ("Không cần"), cắt, trải nghiệm đọc, tài sản riêng, ý khác biệt, căn cứ. |
| 5.3 | "Đã sửa theo phiếu" kèm ngày thì trạng thái thành `da_sua` | **ĐẠT** | Chọn 2026-09-30 rồi bấm nút. DB: `da_sua`, `ngaySua 2026-09-30`, `doLai []`. Màn hiện "Đã sửa — chờ đo lại · sửa 2026-09-30", nút đổi thành "Đổi ngày sửa", và bảng mốc +14/+28 ghi "chưa tới hạn hoặc ca đêm chưa đo". Lượt này không bật hộp thoại nào (chưa có `doLai`). |
| 5.4 | Đổi ngày khi đã có `doLai` thì hỏi xác nhận | **ĐẠT** | Thử trên phiên `lt_4245…` có `doLai` thật từ mục 6.2. Hộp thoại: `Đổi ngày sửa sẽ xoá các lần đo lại đã có. Tiếp tục?`. Bấm **Huỷ**: DB giữ `ngaySua 2026-09-15` và lần đo +14. Bấm **Đồng ý** (ngày 2026-09-20): `ngaySua 2026-09-20`, `doLai []`. |
| 5.5 | Console không lỗi; tab Radar có cột mới | **ĐẠT** | Cả ba kịch bản Playwright có **0 lỗi** console. Nhật ký ca ở tab Radar có đủ cột `… Cụm · Đo lại leo top · Lỗi · Thông tin`; ca vừa chạy hiện `1` ở cột "Đo lại leo top". |
| 6.1 | Ca có GSC: không có dòng "chưa cấu hình GSC" | **ĐẠT** | `POST ca-chay {"ghi":true}` trả `{daBatDau:true, ghi:true}`. Ca `radar` chạy 1,8 s: `soDoLai: 1`, `thongTin: []`, `loi: []`. |
| 6.2 | (thêm) Phiên tới hạn được đo lại bằng GSC thật | **ĐẠT** | Phiên `lt_4245…` (sửa ngày 15/09, 15 ngày trước): `doLai = [{ngay: "2026-09-30", sauNgay: 14, viTri: 7.07, hienThi: 46, cuaSoNgay: 13, hienThiNgay: 4.18}]`. Cửa sổ 13 ngày = [15/09 + 3, 30/09]. Màn hiện "+14 ngày · 2026-09-30 · 7.1 → 7.1 · 1.74 → 4.18 · 29 ngày → 13 ngày". Vẫn `da_sua` (chưa tới mốc 28). |
| 6.3 | Phiên `da_sua` chưa tới hạn không bị đo | **ĐẠT** | Phiên "huyệt thượng cự hư" (sửa hôm nay) sau ca vẫn có `doLai: []`. |
| 7 | Grep bí mật | **ĐẠT** | Log server: 0 dòng `ec_pat_`, 0 dòng aiven/ECONNREFUSED, 0 lần trúng chuỗi con của 3 giá trị GSC. `grep -rl aivencloud dist-thu/` ra 0 trước khi xoá. `dist-thu/` có chữ `GSC_OAUTH` (tên biến trong lời báo và màn quản trị), không có giá trị nào. |

## Bất ngờ / điều phải biết

1. **10 phiên chỉ phủ 5 trang.** GSC trả nhiều biến thể của cùng một câu hỏi. Kết quả: 3 phiên cho
   `/huyet/ha-quan/` ("hạ quan", "huyệt hạ quan ở đâu", "hạ quan là gì"), 3 phiên cho `/huyet/phuc-tho/`
   ("huyệt phục thỏ", "phục thỏ", "huyệt phục thố ở đâu") và 2 phiên cho `/huyet/lai-cau/`. Routine sẽ
   làm gần như cùng một việc SERP và ra ba phiếu cho một trang, còn trần 10 phiên đầy sau hai lượt
   gọi. Luật chỉ chặn trùng **cặp** từ khoá–trang, không chặn trùng **trang**.
2. **Lượt đầu trả mỗi phiên mới hai lần**: có cả trong `dangMo` lẫn trong `moi` (5 id giống nhau).
   Lời dặn bảo làm `dangMo` trước, nên một mô hình đọc máy móc có thể xử lý mỗi phiên hai lần. Nộp hai
   lần thì chỉ thay danh sách SERP, nên không hỏng dữ liệu, chỉ tốn lượt.
3. **4/7 trang đối thủ thật không tải được, và lời báo gộp mọi nguyên nhân làm một.** Cả lượt chỉ mất
   ~1,2 s, vậy mà câu báo vẫn là "quá hạn 10 s, bị chặn hoặc lỗi mạng". Tôi `curl` từ máy dev để tìm
   nguyên nhân thật:
   - bacsituyetlan.com: `HTTP/2 stream … PROTOCOL_ERROR`.
   - amp.thaythuoccuaban.com: `Could not resolve host` (tên miền con AMP đã chết, dù WebSearch vẫn trả).
   - tapchidongy.net: 301 sang tên miền khác `dongydieuphap.com`.
   - nhathuoclongchau.com.vn: 403 (chặn bot), đã được báo đúng là `HTTP 403`.

   Trên kho thật, kỳ vọng "≥ 5 trang đối thủ để kết luận ý thừa" sẽ khó đạt. Tỉ lệ tải được ~50% với
   SERP y học tiếng Việt thì routine nên gửi đủ 10 URL, không phải 5.
4. **Phiếu bảo trang mình "Không ghi ngày cập nhật" dù trang có ghi.** Trang thật in
   `Cập nhật 2026-09-30`: dạng ISO, không có dấu hai chấm, không `<time>`, không
   `article:modified_time` hay `dateModified`. `do-trang` chỉ đọc dạng `dd/mm/yyyy` sau "Cập nhật:".
   Dòng "Biên soạn: Ban Biên Tập" cũng không được tính là ký tên. Nhãn "biên soạn" không có trong danh
   sách, và "Ban Biên Tập" không phải tên người. Điều này có thể đúng ý đồ E-E-A-T, nhưng phiếu sẽ đòi
   điều này cho **mọi** trang từ điển. Muốn phiếu bớt ồn thì hoặc thêm `dateModified` vào JSON-LD của
   trang tĩnh (builder), hoặc cho máy đo đọc thêm dạng ISO.
5. **Chữ của dongyvugiaduong.com chỉ còn 1.512 ký tự, gần hết là menu** ("Skip to content Cấy chỉ &
   trường châm, …"). Bài thật có lẽ nằm ngoài vùng `htmlSangChu` giữ lại, hoặc nạp bằng JS. Báo cáo đọc
   của Claude cho trang kiểu này sẽ nghèo ý, và kéo tỉ lệ ý cốt lõi xuống.
6. **Ca radar với `ghi: true` cũng gọi Google Suggest** (`suggestqueries.google.com`, 50 gợi ý
   `xuHuong`). Đây là hành vi có từ 2A, không phải của 2D, nhưng chạy thật trên bàn thử là có lượt gọi
   đó.
7. **So hiển thị/ngày giữa hai cửa sổ dễ đọc nhầm.** Mốc +14 hiện `1.74 → 4.18` (gấp 2,4 lần) chỉ vì
   cửa sổ 13 ngày gần đây nằm trọn trong giai đoạn trang đang lên. Phiên này không hề sửa gì (tôi đặt
   `da_sua` bằng tay), nên đây là nền tăng tự nhiên, không phải hiệu quả của phiếu. Dòng chú thích
   trên màn có nói "chỉ để so", nhưng không nói tới xu hướng nền.
8. Ô ngày trên màn hiện `09/30/2026` (theo locale en-US của Chromium không đầu), còn nhãn ghi
   "Ngày sửa (giờ Việt Nam)". Trình duyệt tiếng Việt sẽ hiện `30/09/2026`.

## Liên lạc ra ngoài trong lúc đo

- **oauth2.googleapis.com / searchconsole.googleapis.com**: 2 lượt `lay_tu_khoa` có gọi GSC (lượt 3
  không gọi vì đã đủ trần), 1 lượt `layViTri` trong ca, và `coCauHinh()` không gọi mạng. Tất cả chỉ đọc.
- **Trang đối thủ** (GET, qua ssrfSafeFetch của EmDash): mỗi URL của hai lượt nộp SERP được tải một
  lần. Gồm bacsituyetlan.com, tapchidongy.net, dongyvugiaduong.com, amp.thaythuoccuaban.com,
  chuabenh.net, nhathuoclongchau.com.vn, hoctrilieu.com. Tổng 12 lượt tải trang đối thủ, cộng 2 lượt
  tải `kinhlac.online/huyet/thuong-cu-hu/`. Để chẩn đoán, tôi tự `curl` thêm 3 trang lỗi và một lần
  trang của mình.
- **suggestqueries.google.com**: do ca radar (xem Bất ngờ 6).
- **cloudflare-dns.com**: DoH do lớp chống SSRF của EmDash tự gửi (xem 2C-1).
- **WebSearch** của phiên Claude Code: 2 truy vấn để chọn URL. Không có lượt cào google.com nào.
- Không gọi endpoint quản trị hay MCP nào của production. Không chạm DB CMS thật hay DB app. Không ký
  vé SSO.

## Dọn

Server đã dừng (cổng 4399 không còn nghe). Đã xoá `cms/astro.config.thu.mjs`, `cms/dist-thu/`, DB thử,
thư mục ảnh, khoá `ec_pat_…`, cookie và jar trong scratchpad. `cd cms && npx astro sync` đưa
`migrations.json` về `"type": "postgres"`, **giống từng byte** bản sao lưu chụp trước khi build.
`git status --short` sạch trước khi commit tệp này.
