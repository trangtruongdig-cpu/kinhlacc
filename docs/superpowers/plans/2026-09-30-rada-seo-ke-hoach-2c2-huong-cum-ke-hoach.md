# Rada SEO — Kế hoạch 2C-2: hướng nội dung từ đối thủ, cụm theo nghĩa, kế hoạch nội dung

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mỗi tuần routine Claude đọc dữ liệu đối thủ và ĐỀ XUẤT hướng nội dung (trọng số gợi ý), phân cụm theo nghĩa trong các hướng người dùng đã nhận, và đề xuất bài dự kiến; máy chủ tự chấm điểm bằng số đo, kiểm link/trùng/phạm vi Y sỹ; người dùng duyệt hướng và kế hoạch trên màn Rada.

**Architecture:** Đặc tả `docs/superpowers/specs/2026-09-30-rada-seo-2c-cum-ke-hoach-lien-ket-design.md` mục 2 và 4. Logic thuần trong `cms/src/plugins/rada-seo/chien-luoc/` (kiểm bằng kho giả, kv giả, chỉ mục từ fixture thật, bộ kiểm đường giả). `plugin.mjs` chỉ nối route + công cụ MCP. Màn điều khiển thêm 2 tab.

**Tech Stack:** EmDash 0.39.1 plugin native, zod 4.6.5, `node:test`, React 19.

## Global Constraints

- Lệnh kiểm (trong `cms/`): `node --test "src/plugins/rada-seo/**/*.test.mjs"` — hiện 117 đạt; mỗi task kết thúc 0 fail. TDD: kiểm trước, thấy đỏ, rồi mới viết mã.
- Commit chỉ tệp của mình (`git commit -m … -- <paths>`); trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Không build CMS, không chạy máy chủ (trừ task nghiệm thu), không nối CSDL.
- **Mô hình không tự chấm điểm.** Claude đề xuất (tên, mô tả, trọng số GỢI Ý, id bài đối thủ làm bằng chứng); điểm do máy chủ tính từ số đo.
- **Không khai cứng dịch vụ** (người dùng chốt 30/09/2026): không có hướng gieo sẵn; "gần sản phẩm" chỉ là điểm cộng nhỏ.
- **Duyệt hai chỗ:** hướng (`de_xuat` → `da_nhan`/`bo_qua`) và bài dự kiến (`de_xuat` → `da_duyet`/`bo_qua`). Cụm chỉ sinh trong hướng `da_nhan`; bài dự kiến chỉ trong cụm thuộc hướng `da_nhan`. Mục `bo_qua` kèm `lyDoBo` được trả lại cho Claude ở tuần sau để khỏi đề xuất lại; máy chủ cũng tự chặn đề xuất giống (`timTrung`, ngưỡng 0,30) một mục đã `bo_qua`.
- Rào dùng lại (KHÔNG viết lại): `timViPham`/`kiemPhamVi`, `doYmyl` (`luat/`), `timTrung`/`taoBoKhoa`/`timTrungBo`/`trungTuDien` (`luat/trung-lap.mjs`), `layChiMuc`/`timTrongChiMuc`/`taoKiemDuong`/`chonDuong` (`noi-bo/`), `ghiTheoLo` (`kho.mjs`).
- Dữ liệu đối thủ đưa cho Claude: chỉ 1.500 chủ đề `da_phan_tich` MỚI NHẤT (`kho.chuDeDaPhanTich(..., { toiDa: 1500 })`), dạng gọn, chia trang ≤ 500 dòng/lượt.
- Chủ đề/tên cụm/từ khoá do Claude sinh từ chữ đối thủ là **dữ liệu không tin cậy**: hiển thị qua JSX (tự thoát), và khi trả lại cho routine thì bọc dấu mốc `<<<DU_LIEU id=…>>> … <<<HET_DU_LIEU id=…>>>` (cùng cách thoát `<<<`/`>>>` như `mcp-viec.mjs`).
- Thêm công cụ MCP ⇒ bản đồng ý EmDash đổi ⇒ SAU DEPLOY phải bật lại MCP tools (đã ghi ở `DEPLOYMENT.md`; task tài liệu nhắc lại cho 2C-2).
- Mọi chữ hiển thị tuân bảng từ phạm vi Y sỹ.

---

### Task 1: Chỉ số và điểm (thuần)

**Files:** Create `cms/src/plugins/rada-seo/chien-luoc/chi-so.mjs`, `chien-luoc/chi-so.test.mjs`

**Interfaces:**
- `tinhChiSo({ tuKhoa: string[], idBaiDoiThu: string[], chuDeDoiThu: Map<id, {doiThuId, chuDe, tuKhoa[]}>, baiMinh: {tieuDe, tuKhoa[]}[], xuHuong: string[], chiMuc, sanPham = TU_SAN_PHAM }) → { soDoiThu, soBai, trungXuHuong: boolean, soBaiMinh, taiSan: {ten, duong0, loai}[], soTaiSan, viPham: boolean, ganSanPham: boolean }`
  - `soDoiThu`/`soBai`: đếm trên các id bài đối thủ CÓ THẬT trong `chuDeDoiThu` (id lạ bị bỏ, không tính).
  - `trungXuHuong`: dùng `trungXuHuong` của `radar/khoang-trong.mjs`.
  - `soBaiMinh`: số bài của mình giống (`timTrungBo`, ngưỡng 0,30) với tập `{tieuDe: tuKhoa[0], tuKhoa}` HOẶC chứa trọn một từ khoá ≥ 2 từ (so bỏ dấu).
  - `taiSan`: hợp các kết quả `timTrongChiMuc(chiMuc, tk, {toiDa: 5})` cho từng từ khoá, chỉ hạng `dung`/`ten_khac`/`chua`, khử trùng theo `duong[0]`, tối đa 15.
  - `viPham`: `timViPham` hoặc `doYmyl(...).some(loai==="hua_hen")` trên `tuKhoa.join(", ")`.
  - `ganSanPham`: từ khoá chứa (bỏ dấu) một mục `TU_SAN_PHAM = ["do kinh lac", "do nhiet do kinh lac", "24 tinh huyet", "phan mem", "3d", "tra cuu huyet", "tu dien"]`.
- `diemHuong(chiSo) → number` (0..100, làm tròn): `nhuCau = min(soDoiThu,5)/5*0.6 + min(soBai,20)/20*0.3 + (trungXuHuong?0.1:0)`; `khoangTrong = 1/(1+soBaiMinh)`; `taiSan = min(soTaiSan,10)/10`; `diem = 100*(0.4*nhuCau + 0.3*khoangTrong + 0.3*taiSan) + (ganSanPham?5:0) − (viPham?40:0)`, kẹp [0,100].
- `diemCum(chiSo, trongSo 1..5) → number` = `round(diemHuong(chiSo) * (0.6 + 0.1*trongSo))`.

- [ ] **Step 1: Kiểm (đỏ)** — dựng `chiMuc` từ `noi-bo/__fixture__/muc-noi-bo-30-09.json`; `chuDeDoiThu` giả 6 bài của 3 đối thủ về "mất ngủ"/"Thần Môn"; `baiMinh` giả. Khẳng định:
  - hướng "mất ngủ" (tuKhoa `["mất ngủ", "huyệt thần môn", "an thần"]`, 5 id thật + 1 id lạ) → `soDoiThu=3`, `soBai=5` (id lạ bỏ), `taiSan` có `/benh-hoc/mat-ngu/` và `/huyet/than-mon/`, `viPham=false`;
  - cùng hướng mà `baiMinh` đã có 2 bài "mất ngủ" → `diemHuong` NHỎ HƠN bản không có bài của mình;
  - từ khoá "châm cứu chữa liệt mặt" → `viPham=true`, điểm ≤ bản sạch − 40 (kẹp 0);
  - "đo nhiệt độ kinh lạc" → `ganSanPham=true`, +5;
  - `diemCum` tăng đơn điệu theo `trongSo`; `diemHuong` luôn trong [0,100].
- [ ] **Step 2–5:** đỏ → mã → xanh → Commit `feat(rada-seo): chỉ số và điểm hướng/cụm đo được, không để mô hình tự chấm`.

---

### Task 2: Kho — hướng, cụm theo nghĩa, kế hoạch

**Files:** Modify `cms/src/plugins/rada-seo/kho.mjs`, `kho.test.mjs`, `__test__/kho-gia.mjs` (thêm bộ sưu tập giả)

**Interfaces:**
- `KHAI_BAO_KHO` thêm: `huong: { indexes: ["trangThai", "diem"] }`, `cum_nghia: { indexes: ["huongId", "trangThai", "diem"] }`, `ke_hoach: { indexes: ["cumId", "trangThai", "taoLuc"] }`. (Bộ `cum` cũ — khoảng trống bằng luật — GIỮ, nay là "bằng chứng".)
- `TRANG_THAI_HUONG = ["de_xuat","da_nhan","bo_qua"]`, `TRANG_THAI_KE_HOACH = ["de_xuat","da_duyet","bo_qua","dang_viet","co_nhap","da_dang"]`.
- `dsHuong(s, { trangThai? })`, `luuHuongMoi(s, ds, now)` (id = `h_` + bam(tenChuanHoa); cùng tên → cập nhật chỉ số, GIỮ `trangThai`/`trongSo`/`lyDoBo` người dùng đã đặt), `datHuong(s, id, { trangThai, trongSo?, lyDoBo? })` (kiểm hợp lệ; `da_nhan` bắt buộc `trongSo` 1..5).
- `dsCumNghia(s, { huongId? })`, `thayCumNghia(s, huongId, ds, now)` (thay các cụm `de_xuat` của hướng đó; giữ cụm đã có bài dự kiến `da_duyet`+), `dsKeHoach(s, { trangThai? })`, `themKeHoach(s, ds, now)`, `datKeHoach(s, id, { trangThai, lyDoBo? })`.
- Mọi ghi nhiều dòng qua `ghiTheoLo`.

- [ ] **Step 1: Kiểm (đỏ):** giữ trạng thái người dùng khi Claude đề xuất lại cùng tên; `datHuong("da_nhan")` thiếu `trongSo` → ném; `thayCumNghia` không xoá cụm có bài dự kiến đã duyệt; `datKeHoach` bác trạng thái lạ. **Step 2–5** → Commit `feat(rada-seo): kho hướng nội dung, cụm theo nghĩa, kế hoạch`.

---

### Task 3: Việc chiến lược (thuần) — dữ liệu, đề xuất hướng, ghi cụm, đề xuất kế hoạch

**Files:** Create `cms/src/plugins/rada-seo/chien-luoc/viec.mjs`, `chien-luoc/viec.test.mjs`; Modify `cms/src/plugins/rada-seo/loi-dan.mjs`

**Interfaces:**
- `layDuLieu({ s, content, chiMuc, trang = 0, coTrang = 500 }) → { chuDeDoiThu: string[] (dòng "id|chủ đề|từ khoá1; từ khoá2; từ khoá3|tên miền", mỗi dòng bọc dấu mốc DU_LIEU), tongChuDe, conTrang: boolean, baiMinh: {tieuDe, tuKhoa}[] (bài `bai_viet` đã đăng từ `chiMuc` + chủ đề `da_phan_tich` của đối thủ `laCuaMinh`), huong: {id, ten, trangThai, trongSo?, lyDoBo?}[], cum: {id, huongId, ten, trangThai}[], keHoach: {id, cumId, tieuDeLamViec, trangThai, lyDoBo?}[], loiNhac: { deXuatHuong, phanCum, lapKeHoach } }` — `huong/cum/keHoach` chỉ gửi ở trang 0.
- `deXuatHuong({ s, ds: {ten, moTa, trongSoGoiY, lyDo, idBaiDoiThu[], tuKhoa[]}[], chiMuc, now }) → { nhan: {id, ten, diem}[], bac: {ten, lyDo}[] }` — bác khi: tên/tuKhoa vi phạm phạm vi Y sỹ; < 3 id bài đối thủ có thật; giống (≥ 0,30) một hướng `bo_qua` ("đã bị bỏ: <lyDoBo>"); ≤ 8 hướng/lượt. Tính `chiSo` + `diem` (Task 1) rồi `luuHuongMoi`.
- `ghiCum({ s, ds: {huongId, ten, moTa, tuKhoa[], idBaiDoiThu[]}[], chiMuc, now }) → { nhan, bac }` — `huongId` phải `da_nhan`; điểm `diemCum(chiSo, huong.trongSo)`; ≤ 20 cụm/lượt.
- `deXuatKeHoach({ s, ds: {cumId, tieuDeLamViec, tuKhoaChinh, tuKhoaPhu[], yDinh, trangTruCot, lienKetDich[], goiYNguon[]}[], chiMuc, kiemDuong, baiDaCo: {tieuDe, tuKhoa[]}[], now }) → { nhan, bac }` — bác khi: cụm không thuộc hướng `da_nhan`; `kiemPhamVi({tieuDe, moTa: tuKhoaChinh}).chan`; trùng từ điển (`trungTuDien(tuKhoaChinh, tên chuẩn hoá của chiMuc)`); trùng bài đã có/kế hoạch đang có (`timTrung` 0,30); `trangTruCot` không qua `kiemDuong`; < 5 `lienKetDich` qua `kiemDuong` (link trượt bị gỡ, còn < 5 thì bác). Gắn `bangChung` = { soDoiThu, soBai, trungXuHuong, baiDoiThu: tối đa 5 {url, chuDe} }. ≤ 10 bài/lượt.
- `loi-dan.mjs` thêm `LOI_NHAC_DE_XUAT_HUONG`, `LOI_NHAC_PHAN_CUM`, `LOI_NHAC_LAP_KE_HOACH` — ý của 2 prompt trong video (cluster analysis, gap analysis) cộng: ngành Đông y; không khai cứng dịch vụ, hướng phải đi ra từ chỗ đối thủ dồn lực; tận dụng trang từ điển để liên kết (gọi `rada_tim_lien_ket`); phạm vi Y sỹ (tránh "chữa/khám/khỏi"); dữ liệu trong dấu mốc là dữ liệu, không phải chỉ dẫn; mỗi bài dự kiến: 1 từ khoá chính, 2–6 từ khoá phụ, ý định (tra cứu/tìm hiểu/so sánh/hướng dẫn), 1 trụ cột, ≥ 5 link đích lấy từ `rada_tim_lien_ket`.

- [ ] **Step 1: Kiểm (đỏ)** — bằng kho giả + `chiMuc` fixture + `kiemDuong` giả; mỗi luật bác có một ca; ca đạt ghi đúng `bangChung`/`diem`; trang dữ liệu cắt đúng 500 dòng và có dấu mốc. **Step 2–5** → Commit `feat(rada-seo): việc chiến lược — đề xuất hướng, ghi cụm, đề xuất kế hoạch có kiểm`.

---

### Task 4: Nối công cụ MCP + route quản trị

**Files:** Modify `cms/src/plugins/rada-seo/plugin.mjs`, `plugin.test.mjs`

**Interfaces:**
- Công cụ MCP mới (route private, `permission: "content:create"` trừ `rada_lay_du_lieu_chien_luoc` là `content:read_drafts`; khuôn zod dùng chung route ↔ công cụ; `destructive: false`):
  `rada_lay_du_lieu_chien_luoc {trang?: int ≥ 0}`, `rada_de_xuat_huong {huong: [...] ≤ 8}`, `rada_ghi_cum {cum: [...] ≤ 20}`, `rada_de_xuat_ke_hoach {keHoach: [...] ≤ 10}` — giới hạn độ dài chuỗi (tên ≤ 120, mô tả ≤ 400, từ khoá ≤ 80, ≤ 8 từ khoá, ≤ 12 link, id ≤ 64).
- Route quản trị (mặc định `plugins:manage`): `chien-luoc-tong-quan` (hướng + cụm + kế hoạch, kèm chỉ số/bằng chứng), `huong-dat {id, trangThai, trongSo?, lyDoBo?}`, `ke-hoach-dat {id, trangThai, lyDoBo?}` — lỗi qua `PluginRouteError`.
- [ ] Kiểm: 8 công cụ, mỗi công cụ trỏ route có thật + permission bậc contributor + chung khuôn; khuôn bác vượt trần; route quản trị gọi đúng hàm kho. Nạp module in đủ 8 công cụ. → Commit `feat(rada-seo): công cụ MCP chiến lược và route duyệt hướng/kế hoạch`.

---

### Task 5: Màn điều khiển — tab "Hướng nội dung" và "Kế hoạch"

**Files:** Modify `cms/src/plugins/rada-seo/admin.jsx`

- Thanh tab trên cùng: "Radar" (nội dung cũ), "Hướng nội dung", "Kế hoạch". Nhớ tab trong `localStorage` (bọc try/catch).
- **Hướng nội dung:** bảng điểm giảm dần: tên, mô tả, điểm, số đối thủ/số bài, bài của mình, tài sản nội bộ (số + mở rộng xem danh sách link), trúng xu hướng, trọng số gợi ý, trạng thái; nút **Nhận** (chọn trọng số 1–5, mặc định = gợi ý) / **Bỏ** (ô lý do bắt buộc) / **Khôi phục**. Mở rộng một dòng: tối đa 5 bài đối thủ làm bằng chứng (chủ đề + link mở tab mới, `rel="noopener noreferrer"`).
- **Kế hoạch:** nhóm theo hướng → cụm; mỗi bài dự kiến: tiêu đề tạm, từ khoá chính/phụ, ý định, trụ cột (link), số link đích, bằng chứng; nút **Duyệt** / **Bỏ** (lý do) ; lọc theo trạng thái.
- Mọi chữ qua JSX (không `dangerouslySetInnerHTML`); fetch kèm `X-EmDash-Request: 1`.
- [ ] Kiểm: `transformSync` esbuild biên dịch được (như đã làm ở 2B-1); nạp module plugin vẫn đủ. → Commit `feat(rada-seo): tab duyệt hướng nội dung và kế hoạch`.

---

### Task 6: Routine chiến lược + tài liệu

**Files:** Create `cms/src/plugins/rada-seo/routine/tuan-chien-luoc.md`; Modify `DEPLOYMENT.md` (mục Rada), `docs/superpowers/specs/2026-09-30-rada-seo-2c-cum-ke-hoach-lien-ket-design.md` (đánh dấu 2C-2 đã dựng, tên công cụ thật)

- Routine CHỦ NHẬT 06:00 giờ VN, cùng môi trường "chỉ kinhlac.online", không connector, không push, cùng khoá `RADA_SEO_MCP_TOKEN`. Prompt: gọi `rada_lay_du_lieu_chien_luoc` (lặp trang tới hết) → đọc `loiNhac` → `rada_de_xuat_huong` (≤ 8) → với mỗi hướng `da_nhan`: `rada_ghi_cum` → với cụm điểm cao: `rada_tim_lien_ket` rồi `rada_de_xuat_ke_hoach` (≤ 10/tuần) → báo cáo số nhận/bác và lý do bác. Không Bash, không sửa tệp, không git; không thấy công cụ `rada_*` thì dừng và báo.
- `DEPLOYMENT.md`: sau deploy 2C-2 BẬT LẠI MCP tools (8 công cụ); tạo routine chiến lược; lần chạy đầu cần ≥ vài trăm chủ đề đối thủ đã đọc, không thì đề xuất sẽ mỏng.
- [ ] Commit `docs(rada-seo): routine chiến lược hằng tuần, bước bật lại MCP cho 2C-2`.

---

### Task 7: Nghiệm thu trên bàn thử

**Files:** Create `docs/superpowers/plans/2026-09-30-rada-seo-nghiem-thu-2c2.md`

Theo công thức bàn thử (passkey ảo). Bàn thử không được quét site bên thứ ba (bộ kiểm quyền đã chặn) ⇒ **bơm thẳng** vào bảng storage của plugin trên DB thử: 3 đối thủ giả, ~40 URL `da_phan_tich` với chủ đề/từ khoá THẬT phong cách Đông y (mất ngủ, xương khớp, dưỡng sinh…); seed vài mục `huyet_vi`/`benh_hoc` đã xuất bản (Thần Môn, Tam Âm Giao, Mất Ngủ…).

- [ ] Bật MCP tools → `tools/list` có 8 công cụ `rada-seo__…`.
- [ ] Qua MCP bằng khoá chỉ `mcp:tools:rada-seo`: `rada_lay_du_lieu_chien_luoc` (dấu mốc, trang), `rada_de_xuat_huong` (1 hướng đạt + 1 hướng "chữa" bị bác + 1 hướng thiếu bằng chứng bị bác), duyệt hướng trên màn Rada (Playwright, tự mở ảnh chụp), `rada_ghi_cum`, `rada_de_xuat_ke_hoach` (1 đạt với link đích thật đã kiểm trên kinhlac.online, 1 trùng từ điển bị bác, 1 thiếu link bị bác), duyệt kế hoạch trên màn Rada.
- [ ] Đề xuất lại đúng hướng đã Bỏ → bị bác kèm lý do cũ.
- [ ] Ghi bảng ĐẠT/TRƯỢT/CHƯA ĐO, dọn bàn thử (`npx astro sync` → `migrations.json` về postgres), commit tệp nghiệm thu.

---

## Sau kế hoạch này

2D (leo top — bản đồ sơ hở), 2C-3 (viết bài + bản sửa theo phiếu leo top).
