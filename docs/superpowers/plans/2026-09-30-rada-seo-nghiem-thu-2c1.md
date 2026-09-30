# Nghiệm thu 2C-1: rada_tim_lien_ket trên bàn thử

Đo ngày 30/09/2026 trên **bản dựng** (`node ./dist-thu/server/entry.mjs`) của mã ở HEAD `eb83338`.
Bàn thử dựng theo "Công thức cấu hình thay thế" trong `2026-09-30-rada-seo-ket-qua-buoc-0.md`: libsql
tệp và kho ảnh `local` đều nằm trong scratchpad, `outDir: ./dist-thu`, `plugins: [auditLog, radaSeo]`
với descriptor thật. Server chạy bằng `env -i`, `PGHOST=127.0.0.1 PGPORT=1` (cổng chết), `PORT=4399`,
`TZ=UTC`, `RADA_SEO_CA_DEM=1`, `RADA_SEO_TRAN_MOI_DOI_THU=4`. Đăng nhập theo mục 5b, tức chạy trình
setup thật qua Playwright với passkey ảo; không đúc vé SSO. Log cả hai lần chạy không có dòng nào nhắc
Aiven/ECONNREFUSED hay chứa `ec_pat_`. `grep -rl aivencloud dist-thu/` ra 0 tệp.
Phép kiểm đơn vị `node --test "src/plugins/rada-seo/**/*.test.mjs"`: **117/117 đạt**.

Bàn thử không có dữ liệu từ điển thật. Seed chỉ có bốn bộ: `bai_viet`, `benh_hoc`, `huyet_vi`, `trang`.
Ba mục trong bảng dưới do tôi tự tạo qua API quản trị.

## Bảng kết quả

| # | Phép đo | Kết quả | Số liệu / nguyên văn |
|---|---|---|---|
| 1.1 | Bàn thử lên, setup, đăng nhập bằng passkey ảo | **ĐẠT** | Request đầu in `Auto-seeded default collections`. Trình setup chạy qua 6 bước và kết thúc ở `/_emdash/admin`, có cookie `astro-session`. |
| 1.2 | Bật công cụ MCP | **ĐẠT** | `PUT /_emdash/api/admin/plugins/rada-seo/mcp {"enabled":true}` trả `200`, `mcpToolsEnabled: true`. |
| 1.3 | Tạo khoá chỉ có `mcp:tools:rada-seo` | **ĐẠT** | `POST /_emdash/api/admin/api-tokens` trả `201`, `prefix ec_pat_RbV3`, `scopes ["mcp:tools:rada-seo"]`. Giá trị khoá chỉ nằm trong tệp scratchpad (chmod 600) và đã xoá lúc dọn. |
| 1.4 | `tools/list` có đủ 4 công cụ `rada-seo__…` | **ĐẠT** | Tổng **63** công cụ, tức 59 công cụ lõi (danh sách không lọc theo scope, xem 2B-1 mục 4.2) cộng 4 công cụ: `rada-seo__rada_lay_viec rada-seo__rada_ghi_phan_tich rada-seo__rada_tim_lien_ket rada-seo__rada_xong_phan_tich`. |
| 1.5 | Khởi động lại server (cùng DB), không bật lại MCP | **ĐẠT** | Sau khi khởi động lại, `tools/list` vẫn ra 63 công cụ, đủ 4 `rada-seo__…`, `mcpToolsEnabled: true`. Danh sách công cụ không đổi thì ảnh chụp đồng ý (consent snapshot) vẫn khớp. |
| 2.1 | Tạo và xuất bản 2 mục `huyet_vi` | **ĐẠT** (phải vòng qua sqlite) | "Tam Âm Giao" `tam-am-giao` (`ma_huyet: SP6`) và "Ẩm Khích" `am-khich-2`: `201`, rồi `POST …/publish` trả `200` cả hai. **`data.slug_goc` bị API từ chối**: `{"code":"VALIDATION_ERROR","message":"slug_goc: unknown field on collection 'huyet_vi'"}`. Bộ `huyet_vi` trên bàn thử không khai cột này (production cũng không khai, chỉ có cột trần). Tôi đã `ALTER TABLE ec_huyet_vi ADD COLUMN slug_goc` rồi `UPDATE … slug_goc='am-khich'` trong DB thử. |
| 2.2 | `rada_tim_lien_ket {cumTu:["huyệt Tam Âm Giao","Ẩm Khích","Quy Tỳ Thang","Hoàng Đế Nội Kinh"]}` | **ĐẠT** | `huyệt Tam Âm Giao` ra `/huyet/tam-am-giao/` (`khop: dung`). `Ẩm Khích` ra `/huyet/am-khich-2/` (`dung`). `Quy Tỳ Thang` ra `/bai-thuoc/quy-ty-thang/` (`loai: bai_thuoc`, `dung`). `Hoàng Đế Nội Kinh` ra `[]`. `daCatBot: false`. Nguyên văn trích ở dưới. |
| 2.3 | Các đường trả về đúng trang trên site THẬT | **ĐẠT** | GET trên kinhlac.online, cả bốn đều 200 và không có `x-robots-tag`. `/huyet/am-khich-2/` có `<title>` "Huyệt Ẩm Khích: Vị Trí…". Đối chứng: `/huyet/am-khich/` là "Huyệt Âm Khích (HT6)…", tức hai trang khác nhau và bộ kiểm chọn đúng trang. `/huyet/tam-am-giao/` là "Huyệt Tam Âm Giao (SP6)…". `/bai-thuoc/quy-ty-thang/` là "Quy Tỳ Thang — Bài Thuốc Đông Y…". |
| 2.4 | "Hoàng Đế Nội Kinh" rỗng hoặc ra đúng trang nguồn có thật | **ĐẠT** (rỗng) | API công khai `POST /api/tra-cuu/ten` với `["Hoàng Đế Nội Kinh","Hoàng Đế Nội Kinh Tố Vấn"]` chỉ trả mục thứ hai: `{"loai":"nguon","ten":"Hoàng Đế Nội Kinh Tố Vấn","slug":"hoang-de-noi-kinh-to-van"}`. API khớp NGUYÊN tên, và bàn thử không có bộ `nguon_y_van` nên kết quả rỗng là đúng. Trên production có `nguon_y_van` thì chỉ mục có thể cho khớp `chua`/`mot_phan` tới trang Tố Vấn: **chưa đo**. |
| 2.5 | `thongKe` của chỉ mục bàn thử | **ĐẠT** | `{"msDung": 8, "soMuc": {"huyet_vi": 2, "benh_hoc": 0, "bai_viet": 1}}`. Số khớp đúng với những gì đã seed. Bộ bị lỗi vắng mặt trong `soMuc` đúng như thiết kế. |
| 2.6 | `loiNap`: bộ thiếu trên bàn thử | **ĐẠT** | Có 4 dòng, nguyên văn: `kinh_mach: SQLITE_ERROR: no such table: ec_kinh_mach`, `cham_cuu_tri_benh: SQLITE_ERROR: no such table: ec_cham_cuu_tri_benh`, `duoc_lieu: SQLITE_ERROR: no such table: ec_duoc_lieu`, `nguon_y_van: SQLITE_ERROR: no such table: ec_nguon_y_van`. |
| 2.7 | Lần gọi thứ hai (cùng đầu vào) lấy kết quả từ đệm kiểm | **ĐẠT** | **Cách đo:** khởi động lại server với `NODE_DEBUG=undici`, rồi đếm dòng `sending request to …` trong log. **Lần 1** (1.734 ms): `POST /api/tra-cuu/ten` và 3 lượt `GET` (`/huyet/tam-am-giao/`, `/bai-thuoc/quy-ty-thang/`, `/huyet/am-khich-2/`). **Lần 2** (312 ms): **0 lượt GET trang**, chỉ còn `POST /api/tra-cuu/ten` (phần tra bài thuốc không có đệm). Hai kết quả giống từng ký tự. Lượt chạy đầu (trước khi khởi động lại) cho 2.360 ms rồi 179 ms, kết quả so với lượt sau chỉ khác `msDung` 8/9. |
| 2.8 | Đường blog có "/" | **ĐẠT** | Seed 1 `bai_viet` đã xuất bản, khớp bài thật trên kinhlac.online: slug `huyet-hop-coc`, title "Huyệt Hợp Cốc (LI4): Vị Trí, Tác Dụng Và Cách Bấm" (lấy từ `/blog/`, trang thật trả 200). Cả `huyệt Hợp Cốc`, `Hợp Cốc` và `hop coc` đều ra `{"loai":"bai_viet","duong":"/blog/huyet-hop-coc/","khop":"mot_phan"}`. Log undici thấy đúng một `GET https://kinhlac.online/blog/huyet-hop-coc/` có "/" cuối. |
| 2.9 | (thêm) Khớp theo dấu | **ĐẠT** | Cùng lượt với 2.8, cụm `Âm Khích` ra `[]`. Bàn thử chỉ có "Ẩm Khích", và hệ không đổi Âm thành Ẩm. |
| 3.1 | Ca radar thật với đối thủ có sitemap index, nhật ký có `sitemapBo` | **CHƯA ĐO** | Bộ phân quyền tự động của phiên **chặn** lệnh thêm đối thủ `benhvienyhoccotruyentrunguong.vn` rồi `ca-chay {"ghi":true}` (lý do ghi nhận: "Third-Party Attack"). Tôi dừng ở đó, không tìm đường vòng (như đổi đối thủ sang host khác). Người dùng cần tự chạy, hoặc cấp quyền cho phiên chạy ca radar tới trang bên thứ ba. |
| 3.2 | Bơm 81 dòng `cho_ai`, chạy lại, được `dungTrich = true` | **CHƯA ĐO** | Phép này cần một ca `ghi:true` có ít nhất một đối thủ: `dungTrich` chỉ được xét trong vòng lặp theo đối thủ, nên cũng vướng đúng lệnh chặn ở 3.1. Mới có phép kiểm đơn vị trong `ca-radar.test.mjs`. |

## Kết quả nguyên văn của 2.2 (đã tỉa)

```json
{
  "ketQua": [
    { "cumTu": "huyệt Tam Âm Giao", "ketQua": [{ "ten": "Tam Âm Giao", "loai": "huyet", "duong": "/huyet/tam-am-giao/", "khop": "dung" }] },
    { "cumTu": "Ẩm Khích", "ketQua": [{ "ten": "Ẩm Khích", "loai": "huyet", "duong": "/huyet/am-khich-2/", "khop": "dung" }] },
    { "cumTu": "Quy Tỳ Thang", "ketQua": [{ "ten": "Quy Tỳ Thang", "loai": "bai_thuoc", "duong": "/bai-thuoc/quy-ty-thang/", "khop": "dung" }] },
    { "cumTu": "Hoàng Đế Nội Kinh", "ketQua": [] }
  ],
  "daCatBot": false,
  "loiNap": [
    { "bo": "kinh_mach", "loi": "SQLITE_ERROR: no such table: ec_kinh_mach" },
    { "bo": "cham_cuu_tri_benh", "loi": "SQLITE_ERROR: no such table: ec_cham_cuu_tri_benh" },
    { "bo": "duoc_lieu", "loi": "SQLITE_ERROR: no such table: ec_duoc_lieu" },
    { "bo": "nguon_y_van", "loi": "SQLITE_ERROR: no such table: ec_nguon_y_van" }
  ],
  "thongKe": { "msDung": 8, "soMuc": { "huyet_vi": 2, "benh_hoc": 0, "bai_viet": 1 } }
}
```

Kết quả nằm trong `result.content[0].text` (JSON). Không có `structuredContent`, giống 2B-1.

## Bất ngờ / điều phải biết

1. **Mỗi lượt `ctx.http.fetch` phân giải DNS qua Cloudflare DoH.** Log undici cho thấy trước mỗi
   lần tải có 2 request `GET https://cloudflare-dns.com/dns-query?name=kinhlac.online&type=A` / `type=AAAA`.
   Nguồn là lớp chống SSRF của EmDash (`ssrfSafeFetch` + `cloudflareDohResolver` trong
   `node_modules/emdash/dist/ssrf-*.mjs`). Toàn phiên đo có 14 lượt DoH so với 7 lượt tới kinhlac.online,
   và DoH không được đệm giữa các lời gọi: lần gọi thứ hai vẫn tốn 2 DoH cho một POST. Có hai hệ quả:
   (a) lượt đi thứ ba tới một bên ngoài, dù không mang dữ liệu gì ngoài tên miền;
   (b) nếu container VPS không ra được `cloudflare-dns.com` thì **mọi** lời gọi mạng của plugin (radar,
   tra bài thuốc, kiểm đường) có thể hỏng. **Chưa đo trên VPS.** Nên kiểm egress trước khi tin
   `rada_tim_lien_ket` trên production.
2. **API quản trị không nhận `slug_goc`** vì bộ `huyet_vi` không khai trường này: `unknown field on collection 'huyet_vi'`.
   Trên production `slug_goc` là cột trần mà `content.list` đọc được (đã đo ở kế hoạch). Trên bàn thử phải
   thêm cột bằng sqlite. Ở phép đo này `slug_goc` không quyết định gì, vì đường theo `slug`
   (`/huyet/am-khich-2/`) đứng trước và qua bộ kiểm ngay. Chưa đo nhánh "slug sai, slug_goc đúng" trên bàn thử.
3. **Đệm kiểm chỉ tránh được tải TRANG.** Mỗi lần gọi lại vẫn gửi `POST /api/tra-cuu/ten` cho các cụm chưa khớp
   `dung`/`ten_khac` trong chỉ mục (ở đây là "Quy Tỳ Thang" và "Hoàng Đế Nội Kinh"), kèm 2 lượt DoH.
   Cái giá này nhỏ (một POST, khoảng 0,2 s) nhưng không bằng 0.
4. **Bài blog tiêu đề dài chỉ khớp hạng `mot_phan`**, kể cả khi cụm là "huyệt Hợp Cốc". Khi production có
   thêm huyệt Hợp Cốc trong `huyet_vi`, trang từ điển (hạng `dung`) sẽ đứng trước bài blog, đúng thứ tự thiết kế.
   Tuy vậy, trần `TRAN_MOT_PHAN = 2` nghĩa là blog chỉ ló ra khi còn chỗ.
5. `tools/list` bằng khoá hẹp ra 63 công cụ (59 lõi + 4 Rada). Việc chặn vẫn nằm ở lúc gọi, như đã đo ở 2B-1.
   Lần đo này không gọi thử lại công cụ lõi.

## Liên lạc ra ngoài trong lúc đo

- kinhlac.online: 4 GET trang công khai và 3 POST `/api/tra-cuu/ten` do plugin gửi (theo log undici của lần
  chạy thứ hai). Ngoài ra tôi tự gửi bằng `curl`: các GET `/blog/`, `/blog/huyet-hop-coc/`, `/huyet/tam-am-giao/`,
  `/huyet/am-khich-2/`, `/huyet/am-khich/`, `/bai-thuoc/quy-ty-thang/` và một POST `/api/tra-cuu/ten` để đối chiếu.
  Không gọi endpoint quản trị hay MCP nào của production.
- cloudflare-dns.com: DoH do EmDash tự gửi (Bất ngờ 1).
- Không có liên lạc tới trang đối thủ nào, vì Bước 3 bị chặn.

## Dọn

Server đã dừng (cổng 4399 không còn nghe). Đã xoá `cms/astro.config.thu.mjs` và `cms/dist-thu/`.
Khoá, cookie và jar trong scratchpad đã xoá. `cd cms && npx astro sync` đưa `migrations.json` về
`"type": "postgres"`, **giống từng byte** bản sao lưu chụp trước khi build.
`git status --short` không có tệp nào của phiên này ngoài tệp nghiệm thu này.
