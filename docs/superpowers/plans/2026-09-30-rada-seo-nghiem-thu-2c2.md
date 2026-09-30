# Nghiệm thu 2C-2: hướng → cụm → bài dự kiến, trên bàn thử

Đo ngày 30/09/2026 trên **bản dựng** (`node ./dist-thu/server/entry.mjs`) của mã ở HEAD `aa6a4b9`
(tức `98c792d` cộng bản sửa màn duyệt). Bàn thử dựng theo "Công thức cấu hình thay thế" trong
`2026-09-30-rada-seo-ket-qua-buoc-0.md`. DB là libsql tệp và kho ảnh `local`, cả hai nằm trong
scratchpad; `outDir: ./dist-thu`; `plugins: [auditLog, radaSeo]` với descriptor thật. Server chạy bằng
`env -i`, `PGHOST=127.0.0.1 PGPORT=1` (cổng chết), `PORT=4399`, `TZ=UTC`, `RADA_SEO_CA_DEM=1`. Đăng nhập
theo mục 5b: chạy trình setup thật qua Playwright với passkey ảo, không đúc vé SSO.
Log server không có dòng nào chứa `ec_pat_`, Aiven hay ECONNREFUSED, và `grep -rl aivencloud dist-thu/`
ra 0 tệp. Phép kiểm đơn vị `node --test "src/plugins/rada-seo/**/*.test.mjs"` đạt **159/159**.

## Dữ liệu bơm vào

Bàn thử không được quét trang bên thứ ba, nên tôi **bơm thẳng** vào bảng `_plugin_storage`
(`plugin_id='rada-seo'`, khoá chính `(plugin_id, collection, id)`, cột `data` là JSON; bảng
`_plugin_indexes` rỗng, truy vấn đọc thẳng `json_extract`):

- 3 đối thủ giả `dongy-mau-a.example`, `suckhoe-mau-b.example`, `duongsinh-mau-c.example` (bộ `doi_thu`,
  id là tên miền).
- 40 dòng `url` ở trạng thái `da_phan_tich`, id là `sha1(url)[:24]` giống `idUrl`, mỗi dòng có
  `chuDe`, `tuKhoa` và `phanTichLuc` cách nhau 1 phút. Nội dung: 13 bài mất ngủ, 12 bài xương khớp,
  9 bài dưỡng sinh theo mùa và 6 bài lạc đề (giảm cân nhanh, trà giảm cân, da mặt, mụn, gối, chiều cao).
- Từ điển: qua API quản trị, tạo và xuất bản `huyet_vi` "Thần Môn" `than-mon`, "Tam Âm Giao"
  `tam-am-giao`, và `benh_hoc` "Mất Ngủ" `mat-ngu`. Cả ba đều `201` rồi `publish` `200`.

## Bảng kết quả

| # | Phép đo | Kết quả | Số liệu / nguyên văn |
|---|---|---|---|
| 1 | Bật MCP, `tools/list` có 8 công cụ `rada-seo__…` | **ĐẠT** | `PUT …/plugins/rada-seo/mcp {"enabled":true}` trả `200`. Khoá `ec_pat_37iV…` chỉ có scope `["mcp:tools:rada-seo"]`. Tổng **67** công cụ, gồm 59 công cụ lõi (danh sách không lọc theo scope, như 2B-1) cộng 8: `rada_lay_viec rada_ghi_phan_tich rada_tim_lien_ket rada_lay_du_lieu_chien_luoc rada_de_xuat_huong rada_ghi_cum rada_de_xuat_ke_hoach rada_xong_phan_tich`. |
| 2.1 | `rada_lay_du_lieu_chien_luoc`: dấu mốc | **ĐẠT** | 40/40 dòng có dạng `<<<DU_LIEU id=X>>>X\|chủ đề\|từ khoá\|tên miền<<<HET_DU_LIEU id=X>>>`, ba id trùng nhau. `baiMinh: []`, `loiNap` có 4 bộ thiếu trên bàn thử, giống 2C-1. |
| 2.2 | `rada_lay_du_lieu_chien_luoc`: chia trang | **ĐẠT** | Bơm TẠM thêm 520 dòng đệm (cũ hơn), tổng 560. `trang 0`: 500 dòng, `conTrang true`, có `huong/cum/keHoach`, và 40 bài thật nằm đầu vì mới nhất. `trang 1`: 60 dòng, `conTrang false`, không có `huong`. `trang 2`: 0 dòng. Sau đó đã xoá 520 dòng đệm (còn 40). |
| 3.1 | Hướng "mất ngủ" thật được nhận, số do máy chủ đếm | **ĐẠT** | "Mất ngủ theo Đông y", từ khoá `mất ngủ, khó ngủ, giấc ngủ, huyệt thần môn, tam âm giao`, dẫn 5 id. Kết quả: **điểm 61**, `soDoiThu 3`, `soBai 12` (máy chủ tự dò ra 12/13 bài mất ngủ), `soTaiSan 3` (`/benh-hoc/mat-ngu/`, `/huyet/than-mon/`, `/huyet/tam-am-giao/`), `soBangChungBoQua 0`. |
| 3.2 | Hướng "chữa…" bị bác | **ĐẠT** | "Chữa mất ngủ dứt điểm bằng châm cứu" bị bác: `vượt phạm vi Y sỹ: "chữa" — hỗ trợ / cải thiện / theo lý luận Đông Y`. |
| 3.3 | "Giảm cân nhanh" dẫn 20 id lạc đề bị bác | **ĐẠT** | Hướng dẫn 20 id (mùa, khớp, da, mụn…) với từ khoá `giảm cân nhanh, đông y, sức khỏe, y học cổ truyền` bị bác: `không đủ bài đối thủ khớp hướng: máy chủ dò được 1 bài trong 40 chủ đề mới nhất (cần ≥ 3) — id dẫn không khớp tên/từ khoá không được tính`. |
| 3.4 | (thêm) Dẫn id lạc đề không thổi được điểm | **ĐẠT** | "Đau khớp và xương khớp theo YHCT": lần đầu không dẫn id nào thì được điểm 50, `soBai 10`. Gửi lại cùng tên, dẫn 2 id đúng và 3 id lạc đề: vẫn **điểm 50**, `soBai 10`, `soBangChungBoQua 3`, `idBaiDoiThu` còn 2. |
| 3.5 | (thêm) Bằng chứng do máy chủ tìm khi mô hình không dẫn id | **ĐẠT** | "Dưỡng sinh theo mùa" (`idBaiDoiThu: []`) được lưu với `baiDoiThu` 5 bài và `idBaiDoiThu` 0. |
| 4.1 | Màn duyệt: nhận hướng với trọng số, thấy điểm và bằng chứng | **ĐẠT** | Dùng Playwright, đã tự mở ảnh. Chọn 4 rồi bấm "Nhận" cho Mất ngủ, chọn 3 rồi bấm "Nhận" cho Đau khớp. DB: `da_nhan`, `trongSo` 4 và 3. Hàng mở rộng hiện "Tài sản nội bộ (3): Mất Ngủ; Thần Môn; Tam Âm Giao" và **"Bài đối thủ khớp hướng (máy chủ tìm):"** với 5 bài. Hàng Đau khớp có dòng cam **"3 bằng chứng không khớp đã loại"**, cả ở ô "Đối thủ / bài" lẫn phần mở rộng. Console: 0 lỗi. |
| 4.2 | Bỏ hướng có lý do, đề xuất lại dưới tên khác thì bị bác kèm lý do cũ | **ĐẠT** | Trên màn, bỏ "Dưỡng sinh theo mùa" với lý do "Dưỡng sinh theo mùa quá xa sản phẩm đo kinh lạc — để sau". Đề xuất lại ba lần. (a) "Sống thuận bốn mùa theo tiết khí" có chung từ khoá: bác `đã bị bỏ: Dưỡng sinh theo mùa quá xa sản phẩm đo kinh lạc — để sau (cùng từ khoá với hướng <<<DU_LIEU id=h_b210…>>>Dưỡng sinh theo mùa<<<HET_DU_LIEU …>>>)`. (b) "Sống thuận bốn mùa" với từ khoá khác, trong đó có "ăn uống theo mùa": bác cùng lý do (cùng từ khoá). (c) "Nhịp sống bốn mùa" với từ khoá KHÁC HẲN (`giờ ngủ, tiết khí lập đông, dưỡng sinh mùa hè thanh nhiệt, hoàng đế nội kinh`): bác `… (cùng nhóm bài đối thủ với hướng …)`, tức nhánh Jaccard tập chủ đề. |
| 4.3 | Đề xuất gần một hướng đang có thì vào `gop` | **ĐẠT** | "Chứng mất ngủ, khó ngủ về đêm" cho ra `gop: [{ten, vaoId: "h_2f08…", vaoTen: "<<<DU_LIEU id=h_2f08…>>>Mất ngủ theo Đông y<<<HET_DU_LIEU …>>>"}]`, `nhan: []`. Hướng cũ giữ `da_nhan`, `trongSo 4`, điểm 61. |
| 5 | `rada_ghi_cum` | **ĐẠT** | Ba cụm được nhận: "Huyệt vị hỗ trợ giấc ngủ" (điểm 53, 5 bài / 3 đối thủ), "Bài thuốc an thần cổ phương" (36, 2/1), "Chứng tý và phong thấp" (37, 3/2). Cụm "Dưỡng sinh mùa đông" trong hướng đã bỏ bị bác: `hướng chưa được nhận (hoặc không có) — chỉ phân cụm trong hướng đã nhận`. |
| 6.1 | Kế hoạch được nhận: trụ cột và ≥ 5 link sống trên kinhlac.online | **ĐẠT** | "Bấm huyệt hỗ trợ giấc ngủ: Thần Môn, Tam Âm Giao và Nội Quan", trụ cột `/benh-hoc/mat-ngu/`, 6 link: `/huyet/than-mon/ tam-am-giao/ noi-quan/ bach-hoi/ tam-du/ phong-tri/`. Kết quả `nhan`, `lienKetDich` 6, `linkBiGo []`. Trước đó tôi đã `curl` cả bảy trang, đều `200`, không có `x-robots-tag`, `<title>` đúng tên huyệt/bệnh. |
| 6.2 | Kế hoạch trùng từ điển bị bác | **ĐẠT** | "Huyệt Thần Môn nằm ở đâu", từ khoá chính `huyệt Thần Môn`: `từ khoá chính trùng tên mục từ điển "than mon" — trang từ điển đã phủ; …` |
| 6.3 | Kế hoạch thiếu link bị bác | **ĐẠT** | Kế hoạch có 4 link, trong đó `/benh-hoc/dau-khop/` và `/huyet/an-mien/` là trang chết (site thật trả `404` + `x-robots-tag: noindex`): `chỉ còn 2 link đích sống (cần ≥ 5, không tính trụ cột)`. Cả lượt 6.1–6.3 mất 539 ms. |
| 6.4 | (thêm) `canhBaoTrung` lên màn | **ĐẠT** | "Thần Môn, Tam Âm Giao: cặp huyệt hỗ trợ giấc ngủ sâu" (độ giống 0,296 so với bài 6.1) được nhận, `bangChung.canhBaoTrung = [{tieuDe: "Bấm huyệt hỗ trợ…", doGiong: 0.3}]`. Màn hiện dòng cam `⚠ gần giống: Bấm huyệt hỗ trợ giấc ngủ: … (độ giống 0.30)`. Lượt này mất 32 ms vì mọi đường đã có trong đệm kiểm. |
| 7.1 | Duyệt kế hoạch khi hướng chưa nhận thì hiện lời 400 | **ĐẠT** | Bấm "Khôi phục" cho Mất ngủ (về `de_xuat`) rồi bấm "Duyệt" bài 6.1. Màn hiện dòng đỏ **"Hướng của bài dự kiến này chưa được nhận — nhận hướng trước rồi mới duyệt bài"**. Console có đúng 1 lỗi `400 (Bad Request)` của chính lời gọi đó. |
| 7.2 | Duyệt kế hoạch trên màn | **ĐẠT** | Nhận lại hướng (trọng số 4) rồi bấm "Duyệt": bài 6.1 thành "Đã duyệt", chỉ còn nút "Bỏ". |
| 8.1 | Gửi lại cụm với một cụm đổi tên thì cụm cũ thành "cụm cũ" | **ĐẠT** | `rada_ghi_cum` gửi "Huyệt vị cho giấc ngủ ngon" (tên mới) và "Bài thuốc an thần cổ phương". Kết quả: cụm "Huyệt vị hỗ trợ giấc ngủ" có `trangThai: "cu"` và vẫn giữ 2 bài. Màn Kế hoạch hiện tiêu đề cụm màu xám với nhãn **"— cụm cũ (đã được thay)"**. Bài chưa duyệt của cụm này (6.4) vẫn hiện với nút "Duyệt"/"Bỏ"; bấm "Duyệt" thì thành "Đã duyệt". |
| 8.2 | (thêm) Lập bài mới trong cụm cũ bị bác | **ĐẠT** | `cụm đã cũ (bị thay ở lứa phân cụm mới) — chỉ lập bài trong cụm đang đề xuất`. |
| 9 | `daCatBot` | **ĐẠT** | Gửi 5 bài, mỗi bài có trụ cột đã đệm cộng 12 đường `/huyet/ban-thu-cat-bot-i-j/` chưa đệm (60 trang mới, đều không tồn tại trên site thật). 3 bài đầu (36 trang) bị bác `chỉ còn 0 link đích sống`. Bài 4 và 5 bị bác `hết lượt kiểm — gọi lại với ít bài hơn (mỗi lượt tối đa 40 trang chưa có trong đệm, 80 s)`. Kết quả có `daCatBot: true`, 1.461 ms. Số lượt tải thật là 40 thì chỉ **suy ra** từ cách chia bài, tôi không đếm bằng log undici. |

## Bất ngờ / điều phải biết

1. **Cụm không có bài dự kiến nào thì không hiện ở đâu trên màn.** Tab Kế hoạch gom theo bài, nên cụm
   mới "Huyệt vị cho giấc ngủ ngon" và "Chứng tý và phong thấp" (0 bài) không có chỗ nào để thấy.
   Đây là thiết kế từ 683af7f, lượt sửa này không đổi.
2. **`doGiong` làm tròn 2 chữ số nên màn hiện "0.30"**, trong khi ngưỡng trùng là `< 0,30` (giá trị thật
   0,296). Người duyệt dễ đọc thành "đúng ngưỡng mà vẫn lọt".
3. **Lời bác "trùng từ điển" in khoá đã chuẩn hoá** (`"than mon"`), không in tên có dấu "Thần Môn".
4. Cụm chỉ đếm chủ đề nằm trong tập của hướng (thiết kế của 98c792d). Vì vậy "Bài thuốc an thần cổ
   phương" chỉ được 2 bài: bài "Trà thảo dược an thần" không lọt vào tập hướng Mất ngủ, do từ khoá của
   hướng không có "an thần". Không bị bác, chỉ ra điểm thấp.
5. Ô "lý do bỏ" của một hàng giữ nguyên chữ đã gõ sau khi bấm "Bỏ" (state của hàng không xoá). Chỉ là
   chuyện hiển thị.
6. Ngưỡng "cụm quá chung" (10% và 30 bài) **không được thử thật**: kho chỉ có 40 chủ đề, nên trần là 30
   và không cụm nào chạm tới. Vẫn cần soát một lượt trên kho thật, như báo cáo 98c792d đã lưu ý.

## Liên lạc ra ngoài trong lúc đo

- kinhlac.online: plugin gửi các GET trang công khai khi kiểm link. Gồm 7 trang của 6.1, 4 trang của 6.3
  (trong đó 2 trang chết), `/huyet/than-du/`, và khoảng 40 đường `/huyet/ban-thu-cat-bot-*` (404) ở mục 9.
  Không có POST `/api/tra-cuu/ten` nào, vì lượt này không gọi `rada_tim_lien_ket`. Tôi tự `curl` GET 14
  trang để chọn link (`/huyet/…`, `/benh-hoc/…`, `/bai-thuoc/quy-ty-thang/`, `/duoc-lieu/lac-tien/`,
  `/blog/`). Không gọi endpoint quản trị hay MCP nào của production.
- cloudflare-dns.com: DoH do lớp chống SSRF của EmDash tự gửi (xem 2C-1).
- Không liên lạc với trang đối thủ nào. Ba tên miền đối thủ là `.example`, không bao giờ được tải.

## Dọn

Server đã dừng (cổng 4399 không còn nghe). Đã xoá `cms/astro.config.thu.mjs` và `cms/dist-thu/`.
Khoá, cookie và jar trong scratchpad đã xoá. `cd cms && npx astro sync` đưa `migrations.json` về
`"type": "postgres"`, **giống từng byte** bản sao lưu chụp trước khi build. `git status --short` sạch
trước khi commit tệp này.
