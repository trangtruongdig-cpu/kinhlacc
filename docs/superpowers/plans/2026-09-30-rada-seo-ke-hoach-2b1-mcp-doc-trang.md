# Rada SEO — Kế hoạch 2B-1: Claude đọc trang đối thủ qua MCP (bỏ khoá API)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Plugin `rada-seo` thôi gọi Claude Haiku qua API; nó chỉ trích sẵn chữ trang đối thủ, còn việc đọc do một routine Claude trong tài khoản claude.ai của người dùng làm qua ba công cụ MCP của plugin, có trần 40 trang/đêm phía máy chủ.

**Architecture:** Đặc tả `docs/superpowers/specs/2026-09-30-radar-lo-viet-plugin-cms-design.md`, mục "Nguồn AI — Claude trong tài khoản người dùng, qua MCP". Vòng đời URL: `cho` → (ca radar trích) `cho_ai` → (Claude ghi) `da_phan_tich`. Công cụ MCP khai bằng `definePlugin({ mcp: { tools } })`, mỗi công cụ trỏ tới một route private có `permission` bậc contributor và `input` zod. Logic của công cụ ở `mcp-viec.mjs` (thuần, kiểm bằng kho giả + kv giả). EmDash đã có máy chủ MCP `/_emdash/api/mcp` + OAuth; nginx chỉ cần chuyển `/.well-known/oauth-*`.

**Tech Stack:** EmDash 0.39.1 plugin native, zod 4.6.5, `node:test`, React 19.

## Global Constraints

- **Không khoá API nào**: gỡ `@anthropic-ai/sdk` và `lib/claude.mjs`. Plugin KHÔNG gọi mô hình.
- Trần phía máy chủ: `TRAN_TRANG_MOI_DEM = 40` (ngày tính theo giờ VN, UTC+7), `TRAN_TRANG_MOI_LUOT = 10`.
- Công cụ MCP: `rada_lay_viec` → route `mcp-lay-viec` (permission `content:read_drafts`); `rada_ghi_phan_tich` → `mcp-ghi-phan-tich` (`content:create`); `rada_xong_phan_tich` → `mcp-xong-phan-tich` (`content:create`). Tất cả `destructive: false`, route và công cụ dùng CHUNG một khuôn zod.
- Tài khoản CMS của Claude là **contributor** (không phải author: author có `content:publish_own`).
- Lời dặn cách đọc trang nằm ở máy chủ (`loi-dan.mjs`) và trả về trong `rada_lay_viec`.
- Giữ nguyên mọi rào của 2A: công tắc `RADA_SEO_CA_DEM`, lịch `30 * * * *` + lọc giờ UTC 19, khoá KV `compareAndDelete`, `PluginRouteError`, ghi kho theo lô 20 + nghỉ 150ms, nghỉ 300ms giữa lượt tải, hạn chót ca.
- Nghiệm thu chỉ trên **bàn thử** (cấu hình thay thế + libsql + `PGHOST` chết) theo công thức ở `docs/superpowers/plans/2026-09-30-rada-seo-ket-qua-buoc-0.md`; không `npm run build` trong `cms/`; sau build thử `npx astro sync`.
- Commit chỉ tệp của mình (`git commit -m … -- <paths>`); trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Lệnh kiểm (trong `cms/`): `node --test "src/plugins/rada-seo/**/*.test.mjs"`.

---

### Task 1: Trích chữ thay cho Haiku + logic công cụ MCP (mô-đun thuần)

**Files:**
- Create: `cms/src/plugins/rada-seo/radar/trich.mjs`, `radar/trich.test.mjs`, `loi-dan.mjs`, `mcp-viec.mjs`, `mcp-viec.test.mjs`
- Replace (toàn văn dưới đây): `cms/src/plugins/rada-seo/kho.mjs`, `kho.test.mjs`, `ca-radar.mjs`, `ca-radar.test.mjs`, `__test__/kho-gia.mjs`
- Delete: `cms/src/plugins/rada-seo/radar/phan-tich.test.mjs` (thay bằng `trich.test.mjs`; `phan-tich.mjs` xoá ở Task 2 cùng `lib/claude.mjs`)

**Interfaces:**
- Produces: `trichTrang({url, docWeb, epBuoc?}) → {trangThai:'cho_ai', chu} | {trangThai:'ngoai_nganh'} | {trangThai:'loi', loi}`;
  kho: `TRANG_THAI_URL`, `layUrlChoAi(s, n)`, `demChoAi(s)`, `ghiPhanTich(s, items, now) → {daGhi, boQua}` (+ mọi hàm cũ);
  ca-radar: `chayCaRadar({s, docWeb, ghi, tranMoiDoiThu?, nghi?, now?, hanChot?})` (KHÔNG còn `claude`/`nganSach`; ca có `soSeTrich, soTrich, soNgoaiNganh, soLoiTrang, soXuHuong, soCum, xuHuong[]`), `capNhatKhoangTrong(s, {xuHuong, now, nghi})`, `xuHuongGanNhat(s)`;
  loi-dan: `BOI_CANH`, `LOI_NHAC_TRICH`;
  mcp-viec: `TRAN_TRANG_MOI_DEM`, `TRAN_TRANG_MOI_LUOT`, `ngayVN(ms)`, `layViec({s, kv, nowMs?, soTrang?})`, `ghiPhanTich({s, kv, ketQua, nowMs?}) → {daGhi, boQua, soThieuChuDe}`, `xongPhanTich({s, kv, nowMs?, nghi?})`;
  kho-gia: thêm `taoKvGia()`.
- Khoá KV: `claude:giao:<YYYY-MM-DD>` (số trang đã giao trong đêm), `claude:doc:<YYYY-MM-DD>` (số đã đọc).

- [ ] **Step 1: Viết phép kiểm mới (thất bại)** — ghi `radar/trich.test.mjs`, `mcp-viec.test.mjs`, và thay `kho.test.mjs`, `ca-radar.test.mjs`, `__test__/kho-gia.mjs` bằng toàn văn dưới đây; xoá `radar/phan-tich.test.mjs`.

`cms/src/plugins/rada-seo/__test__/kho-gia.mjs`:

```js
// Kho giả cho phép kiểm: mô phỏng StorageCollection của EmDash (where khớp đúng / {in},
// orderBy một khoá, limit, cursor là vị trí). Đủ cho kho.mjs, không hơn.
function khop(data, where = {}) {
	return Object.entries(where).every(([k, v]) =>
		v && typeof v === "object" && Array.isArray(v.in) ? v.in.includes(data[k]) : data[k] === v,
	);
}

export function taoBoSuuTap() {
	const m = new Map();
	return {
		_m: m,
		async get(id) { return m.has(id) ? structuredClone(m.get(id)) : null; },
		async put(id, data) { m.set(id, structuredClone(data)); },
		async delete(id) { return m.delete(id); },
		async exists(id) { return m.has(id); },
		async getMany(ids) { const r = new Map(); for (const id of ids) if (m.has(id)) r.set(id, structuredClone(m.get(id))); return r; },
		async putMany(items) { for (const { id, data } of items) m.set(id, structuredClone(data)); },
		async deleteMany(ids) { let n = 0; for (const id of ids) if (m.delete(id)) n++; return n; },
		async count(where) { return [...m.values()].filter((d) => khop(d, where)).length; },
		async query({ where, orderBy, limit = 50, cursor } = {}) {
			let rows = [...m.entries()].filter(([, d]) => khop(d, where)).map(([id, data]) => ({ id, data: structuredClone(data) }));
			if (orderBy) {
				const [k, huong] = Object.entries(orderBy)[0];
				rows.sort((a, b) => (a.data[k] < b.data[k] ? -1 : a.data[k] > b.data[k] ? 1 : 0) * (huong === "desc" ? -1 : 1));
			}
			const tu = cursor ? Number(cursor) : 0;
			const trang = rows.slice(tu, tu + Math.min(limit, 100));
			const hasMore = tu + trang.length < rows.length;
			return { items: trang, hasMore, cursor: hasMore ? String(tu + trang.length) : undefined };
		},
	};
}

export function taoKhoGia() {
	return { doi_thu: taoBoSuuTap(), url: taoBoSuuTap(), cum: taoBoSuuTap(), ca: taoBoSuuTap() };
}

/** docWeb giả từ một bảng URL → chữ. */
export const webGia = (bang) => async (url) => bang[url] ?? "";

/** KV giả: get/set/delete + getVersioned/compareAndSet/compareAndDelete như ctx.kv. */
export function taoKvGia() {
	const m = new Map();
	let rev = 0;
	return {
		_m: m,
		async get(k) { return m.has(k) ? structuredClone(m.get(k).value) : null; },
		async set(k, v) { m.set(k, { value: structuredClone(v), revision: String(++rev) }); },
		async delete(k) { return m.delete(k); },
		async getVersioned(k) { return m.has(k) ? structuredClone(m.get(k)) : null; },
		async compareAndSet(k, r, v) {
			const cu = m.get(k);
			if ((cu?.revision ?? null) !== r) return { applied: false };
			const revision = String(++rev);
			m.set(k, { value: structuredClone(v), revision });
			return { applied: true, revision };
		},
		async compareAndDelete(k, r) {
			if (m.get(k)?.revision !== r) return { applied: false };
			m.delete(k);
			return { applied: true };
		},
	};
}
```

`cms/src/plugins/rada-seo/radar/trich.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { trichTrang } from "./trich.mjs";
import { htmlSangChu, laDongY } from "./trang.mjs";
import { webGia } from "../__test__/kho-gia.mjs";

const HTML_DY = `<html><head><title>Bấm huyệt chữa mất ngủ</title><meta name="description" content="Cách bấm huyệt an thần"></head>
<body><script>x()</script><p>Huyệt Thần Môn &amp; Tam Âm Giao giúp ngủ ngon hơn theo Đông y.</p></body></html>`;
const HTML_TAY = `<html><head><title>Tăng huyết áp ở người trẻ</title></head><body><p>Menu: Đông y · Nội khoa. Huyết áp cao là bệnh lý tim mạch phổ biến ở người trẻ tuổi.</p></body></html>`;

test("htmlSangChu bỏ script, giải mã thực thể", () => {
	const r = htmlSangChu(HTML_DY);
	assert.equal(r.tieuDe, "Bấm huyệt chữa mất ngủ");
	assert.equal(r.moTa, "Cách bấm huyệt an thần");
	assert.ok(r.than.includes("Thần Môn & Tam Âm Giao"));
	assert.ok(!r.than.includes("x()"));
});

test("laDongY: 'huyết áp' KHÔNG phải Đông y", () => {
	assert.equal(laDongY("Tăng huyết áp ở người trẻ"), false);
	assert.equal(laDongY("Bấm huyệt chữa mất ngủ"), true);
});

test("trang Đông y → chờ Claude, chữ có tiêu đề + mô tả + nội dung", async () => {
	const kq = await trichTrang({ url: "https://a.vn/x", docWeb: webGia({ "https://a.vn/x": HTML_DY }) });
	assert.equal(kq.trangThai, "cho_ai");
	assert.ok(kq.chu.startsWith("TIÊU ĐỀ: Bấm huyệt chữa mất ngủ\nMÔ TẢ: Cách bấm huyệt an thần\nNỘI DUNG:"));
});

test("trang ngoài ngành dù menu có chữ 'Đông y'", async () => {
	const kq = await trichTrang({ url: "https://b.vn/huyet-ap", docWeb: webGia({ "https://b.vn/huyet-ap": HTML_TAY }) });
	assert.deepEqual(kq, { trangThai: "ngoai_nganh" });
});

test("không tải được / quá ít chữ → lỗi", async () => {
	assert.equal((await trichTrang({ url: "https://a.vn/y", docWeb: webGia({}) })).trangThai, "loi");
	assert.equal((await trichTrang({ url: "https://a.vn/z", docWeb: webGia({ "https://a.vn/z": "<p>ngắn</p>" }) })).trangThai, "loi");
});
```

`cms/src/plugins/rada-seo/mcp-viec.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { layViec, ghiPhanTich, xongPhanTich, ngayVN, TRAN_TRANG_MOI_DEM } from "./mcp-viec.mjs";
import * as kho from "./kho.mjs";
import { taoKhoGia, taoKvGia } from "./__test__/kho-gia.mjs";

// 01:30 giờ VN ngày 2026-10-01 = 18:30Z ngày 2026-09-30.
const DEM = Date.parse("2026-09-30T18:30:00.000Z");
const nghi = async () => {};

async function khoCo(n) {
	const s = taoKhoGia();
	await kho.luuDoiThu(s, { tenMien: "minh.vn", laCuaMinh: true }, "t");
	await kho.luuDoiThu(s, { tenMien: "a.vn" }, "t");
	for (let i = 0; i < n; i++) await s.url.put(`u${i}`, { doiThuId: i % 2 ? "a.vn" : "b.vn", url: `https://a.vn/${i}`, trangThai: "cho_ai", chu: `TIÊU ĐỀ: bài ${i}` });
	return s;
}

test("ngayVN tính theo UTC+7", () => {
	assert.equal(ngayVN(DEM), "2026-10-01");
	assert.equal(ngayVN(Date.parse("2026-09-30T16:59:00Z")), "2026-09-30");
});

test("layViec: giao tối đa 10 trang/lượt, kèm lời dặn; trần 40 trang/đêm giữ ở máy chủ", async () => {
	const s = await khoCo(60);
	const kv = taoKvGia();
	const v1 = await layViec({ s, kv, nowMs: DEM, soTrang: 50 });
	assert.equal(v1.trang.length, 10);
	assert.ok(v1.trang[0].chu.startsWith("TIÊU ĐỀ"));
	assert.ok(v1.boiCanh.includes("Kinhlac") && v1.huongDan.includes("rada_ghi_phan_tich"));
	assert.equal(v1.conLaiDemNay, TRAN_TRANG_MOI_DEM - 10);
	for (let i = 0; i < 3; i++) await layViec({ s, kv, nowMs: DEM });
	const het = await layViec({ s, kv, nowMs: DEM });
	assert.equal(het.trang.length, 0);
	assert.equal(het.conLaiDemNay, 0);
	// Đêm sau: hạn ngạch mới.
	assert.equal((await layViec({ s, kv, nowMs: DEM + 24 * 3600e3 })).trang.length, 10);
});

test("ghiPhanTich: chuẩn hoá, bỏ mục thiếu chủ đề/từ khoá, đếm số đã đọc trong đêm", async () => {
	const s = await khoCo(3);
	const kv = taoKvGia();
	const kq = await ghiPhanTich({
		s, kv, nowMs: DEM,
		ketQua: [
			{ id: "u0", chuDe: " Bấm huyệt trị mất ngủ ", tuKhoa: ["bấm huyệt trị mất ngủ", " "], tomTat: ["a"] },
			{ id: "u1", chuDe: "", tuKhoa: ["x"], tomTat: [] },
			{ id: "u9", chuDe: "lạ", tuKhoa: ["x"], tomTat: [] },
		],
	});
	assert.deepEqual(kq, { daGhi: 1, boQua: ["u9"], soThieuChuDe: 1 });
	const u0 = await s.url.get("u0");
	assert.equal(u0.chuDe, "Bấm huyệt trị mất ngủ");
	assert.deepEqual(u0.tuKhoa, ["bấm huyệt trị mất ngủ"]);
	assert.equal(await kv.get("claude:doc:2026-10-01"), 1);
});

test("xongPhanTich: tính khoảng trống từ những gì Claude đã đọc, ghi nhật ký 'claude'", async () => {
	const s = await khoCo(0);
	const kv = taoKvGia();
	await s.url.put("m1", { doiThuId: "minh.vn", url: "https://minh.vn/1", trangThai: "cho_ai", chu: "x" });
	await s.url.put("d1", { doiThuId: "a.vn", url: "https://a.vn/1", trangThai: "cho_ai", chu: "x" });
	await s.url.put("d2", { doiThuId: "b.vn", url: "https://b.vn/1", trangThai: "cho_ai", chu: "x" });
	await ghiPhanTich({
		s, kv, nowMs: DEM,
		ketQua: [
			{ id: "m1", chuDe: "Đồng hồ kinh lạc 12 canh giờ", tuKhoa: ["đồng hồ kinh lạc"], tomTat: [] },
			{ id: "d1", chuDe: "Bấm huyệt trị mất ngủ tại nhà", tuKhoa: ["bấm huyệt trị mất ngủ"], tomTat: [] },
			{ id: "d2", chuDe: "Bấm huyệt trị mất ngủ cho người già", tuKhoa: ["bấm huyệt trị mất ngủ"], tomTat: [] },
		],
	});
	const kq = await xongPhanTich({ s, kv, nowMs: DEM, nghi });
	assert.equal(kq.soDocDemNay, 3);
	assert.equal(kq.soCum, 1);
	const [cum] = await kho.dsCum(s);
	assert.equal(cum.soDoiThu, 2);
	const [ca] = await kho.dsCa(s);
	assert.equal(ca.loai, "claude");
	assert.equal(ca.soDoc, 3);
});
```

`cms/src/plugins/rada-seo/kho.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import * as kho from "./kho.mjs";
import { taoKhoGia } from "./__test__/kho-gia.mjs";

const NOW = "2026-10-01T00:00:00.000Z";

test("đối thủ: khoá là tên miền, xoá kéo theo URL", async () => {
	const s = taoKhoGia();
	await kho.luuDoiThu(s, { tenMien: "a.vn", ten: "A" }, NOW);
	await kho.luuDoiThu(s, { tenMien: "a.vn", ten: "A2", laCuaMinh: true }, "sau");
	const ds = await kho.dsDoiThu(s);
	assert.equal(ds.length, 1);
	assert.equal(ds[0].taoLuc, NOW);
	assert.equal(ds[0].laCuaMinh, true);
	await kho.themUrlMoi(s, "a.vn", ["https://a.vn/1", "https://a.vn/2"], { ghi: true, now: NOW });
	assert.equal(await kho.xoaDoiThu(s, "a.vn"), 2);
	assert.equal(s.url._m.size, 0);
});

test("themUrlMoi: chỉ thêm URL chưa có; ghi=false chỉ đếm", async () => {
	const s = taoKhoGia();
	assert.equal(await kho.themUrlMoi(s, "a.vn", ["https://a.vn/1"], { ghi: true, now: NOW }), 1);
	assert.equal(await kho.themUrlMoi(s, "a.vn", ["https://a.vn/1", "https://a.vn/2"], { ghi: false, now: NOW }), 1);
	assert.equal(s.url._m.size, 1);
	assert.deepEqual(await kho.demUrl(s, "a.vn"), { cho: 1, cho_ai: 0, da_phan_tich: 0, ngoai_nganh: 0, loi: 0 });
});

test("thayCum: giữ cụm đã bỏ qua và không thêm lại cụm giống nó", async () => {
	const s = taoKhoGia();
	const c1 = { tenCum: "Bấm huyệt trị mất ngủ tại nhà", tuKhoa: ["bấm huyệt trị mất ngủ"], diem: 10 };
	const c2 = { tenCum: "Ngũ hành và ăn uống theo mùa", tuKhoa: ["ngũ hành ăn uống"], diem: 5 };
	assert.equal(await kho.thayCum(s, [c1, c2], NOW), 2);
	const [dau] = await kho.dsCum(s);
	await kho.datTrangThaiCum(s, dau.id, "bo_qua");
	const c1DemSau = { tenCum: "Bấm huyệt trị mất ngủ tại nhà hiệu quả", tuKhoa: ["bấm huyệt trị mất ngủ"], diem: 11 };
	assert.equal(await kho.thayCum(s, [c1DemSau, c2], NOW), 1);
	const ds = await kho.dsCum(s);
	assert.equal(ds.length, 2);
	assert.equal(ds.filter((c) => c.trangThai === "bo_qua").length, 1);
	await assert.rejects(kho.datTrangThaiCum(s, dau.id, "linh_tinh"), /không hợp lệ/);
});

test("ghiTheoLo: 45 mục → 3 lượt putMany (20/20/5), nghỉ GIỮA các lô", async () => {
	const s = taoKhoGia();
	const lo = [];
	const goc = s.url.putMany;
	s.url.putMany = async (items) => { lo.push(items.length); return goc(items); };
	let nghi = 0;
	const items = Array.from({ length: 45 }, (_, i) => ({ id: `u${i}`, data: { i } }));
	await kho.ghiTheoLo(s.url, items, { nghi: async (ms) => { assert.equal(ms, kho.NGHI_GIUA_LO_MS); nghi++; } });
	assert.deepEqual(lo, [20, 20, 5]);
	assert.equal(nghi, 2);
	assert.equal(s.url._m.size, 45);
});

test("themUrlMoi và thayCum ghi theo lô 20", async () => {
	const s = taoKhoGia();
	const lo = [];
	for (const col of [s.url, s.cum]) {
		const goc = col.putMany;
		col.putMany = async (items) => { lo.push(items.length); return goc(items); };
	}
	const nghi = async () => {};
	const urls = Array.from({ length: 45 }, (_, i) => `https://a.vn/${i}`);
	assert.equal(await kho.themUrlMoi(s, "a.vn", urls, { ghi: true, now: NOW, nghi }), 45);
	assert.deepEqual(lo, [20, 20, 5]);
	lo.length = 0;
	const cum = Array.from({ length: 25 }, (_, i) => ({ tenCum: `Cụm số ${i} riêng biệt ${"x".repeat(i)}`, tuKhoa: [`khoa${i}`], diem: i }));
	assert.equal(await kho.thayCum(s, cum, NOW, { nghi }), 25);
	assert.deepEqual(lo, [20, 5]);
});

test("datLaiUrlLoi: chỉ URL 'loi' của đúng đối thủ về 'cho'", async () => {
	const s = taoKhoGia();
	await kho.themUrlMoi(s, "a.vn", ["https://a.vn/1", "https://a.vn/2", "https://a.vn/3"], { ghi: true, now: NOW });
	await kho.themUrlMoi(s, "b.vn", ["https://b.vn/1"], { ghi: true, now: NOW });
	await kho.capNhatUrl(s, kho.idUrl("https://a.vn/1"), { trangThai: "loi", loi: "x" });
	await kho.capNhatUrl(s, kho.idUrl("https://a.vn/2"), { trangThai: "loi", loi: "y" });
	await kho.capNhatUrl(s, kho.idUrl("https://a.vn/3"), { trangThai: "da_phan_tich" });
	await kho.capNhatUrl(s, kho.idUrl("https://b.vn/1"), { trangThai: "loi" });
	assert.equal(await kho.datLaiUrlLoi(s, "a.vn", { nghi: async () => {} }), 2);
	assert.deepEqual(await kho.demUrl(s, "a.vn"), { cho: 2, cho_ai: 0, da_phan_tich: 1, ngoai_nganh: 0, loi: 0 });
	assert.deepEqual(await kho.demUrl(s, "b.vn"), { cho: 0, cho_ai: 0, da_phan_tich: 0, ngoai_nganh: 0, loi: 1 });
	const r = await s.url.get(kho.idUrl("https://a.vn/1"));
	assert.equal(r.loi, undefined);
});

test("layUrlChoAi + ghiPhanTich: chỉ nhận URL đang 'cho_ai', bỏ trường chu, báo id bỏ qua", async () => {
	const s = taoKhoGia();
	await s.url.put("u1", { doiThuId: "a.vn", url: "https://a.vn/1", trangThai: "cho_ai", chu: "TIÊU ĐỀ: x" });
	await s.url.put("u2", { doiThuId: "a.vn", url: "https://a.vn/2", trangThai: "da_phan_tich", chuDe: "cũ" });
	const cho = await kho.layUrlChoAi(s, 10);
	assert.deepEqual(cho, [{ id: "u1", url: "https://a.vn/1", doiThuId: "a.vn", chu: "TIÊU ĐỀ: x" }]);
	assert.equal(await kho.demChoAi(s), 1);
	const kq = await kho.ghiPhanTich(s, [
		{ id: "u1", chuDe: "Bấm huyệt", tuKhoa: ["bấm huyệt"], tomTat: ["a"] },
		{ id: "u2", chuDe: "đè", tuKhoa: ["x"], tomTat: [] },
		{ id: "khong-co", chuDe: "x", tuKhoa: ["x"], tomTat: [] },
	], NOW);
	assert.deepEqual(kq, { daGhi: 1, boQua: ["u2", "khong-co"] });
	const u1 = await s.url.get("u1");
	assert.equal(u1.trangThai, "da_phan_tich");
	assert.equal(u1.chu, undefined);
	assert.equal((await s.url.get("u2")).chuDe, "cũ");
	assert.deepEqual(await kho.layUrlChoAi(s, 0), []);
});
```

`cms/src/plugins/rada-seo/ca-radar.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { chayCaRadar, xuHuongGanNhat } from "./ca-radar.mjs";
import * as kho from "./kho.mjs";
import { taoKhoGia, webGia } from "./__test__/kho-gia.mjs";

const trang = (tieuDe) => `<html><head><title>${tieuDe}</title></head><body><p>${tieuDe}. Nội dung Đông y đủ dài để phân tích về huyệt vị và kinh lạc.</p></body></html>`;
const BANG = {
	"https://a.vn/sitemap.xml": "<urlset><url><loc>https://a.vn/mat-ngu</loc></url><url><loc>https://a.vn/huyet-ap</loc></url></urlset>",
	"https://a.vn/mat-ngu": trang("Bấm huyệt trị mất ngủ"),
	"https://a.vn/huyet-ap": "<html><head><title>Tăng huyết áp</title></head><body><p>Huyết áp cao là bệnh tim mạch thường gặp ở người lớn tuổi.</p></body></html>",
	"https://b.vn/sitemap.xml": "<urlset><url><loc>https://b.vn/mat-ngu-2</loc></url><url><loc>https://b.vn/het</loc></url></urlset>",
	// Tiêu đề phải có cụm Đông y ("bấm huyệt"): "huyệt" đứng một mình cố ý không tính.
	"https://b.vn/mat-ngu-2": trang("Bấm huyệt trị mất ngủ hiệu quả"),
};
const WEB = webGia(BANG);
const khoiTao = async () => {
	const s = taoKhoGia();
	await kho.luuDoiThu(s, { tenMien: "a.vn" }, "t");
	await kho.luuDoiThu(s, { tenMien: "b.vn" }, "t");
	return s;
};
const nghi = async () => {};

test("chạy thử: chỉ quét + đếm, không ghi URL/cụm, báo trước số trang sẽ trích, vẫn ghi nhật ký", async () => {
	const s = await khoiTao();
	const ca = await chayCaRadar({ s, docWeb: WEB, ghi: false, nghi });
	assert.equal(ca.ghi, false);
	assert.equal(ca.soUrlMoi, 4);
	assert.equal(ca.soSeTrich, 4);
	assert.equal(s.url._m.size, 0);
	assert.equal(s.cum._m.size, 0);
	assert.equal((await kho.dsCa(s)).length, 1);
	const ca1 = await chayCaRadar({ s, docWeb: WEB, ghi: false, tranMoiDoiThu: 1, nghi });
	assert.equal(ca1.soSeTrich, 2);
});

test("chạy thật: trích chữ → 'cho_ai', ngoài ngành & lỗi tải tách riêng, không ai bị gọi", async () => {
	const s = await khoiTao();
	const ca = await chayCaRadar({ s, docWeb: WEB, ghi: true, nghi });
	assert.equal(ca.soTrich, 2);
	assert.equal(ca.soNgoaiNganh, 1);
	assert.equal(ca.soLoiTrang, 1);
	assert.equal(await kho.demChoAi(s), 2);
	const [mot] = await kho.layUrlChoAi(s, 1);
	assert.ok(mot.chu.startsWith("TIÊU ĐỀ: Bấm huyệt trị mất ngủ"));
	// Chưa ai đọc → chưa có khoảng trống.
	assert.equal(ca.soCum, 0);
	// Chạy lại: không còn URL 'cho' → không tải lại trang.
	let taiTrang = 0;
	await chayCaRadar({ s, docWeb: async (u) => {
		if (/^https:\/\/[ab]\.vn\/(?!sitemap|robots)/.test(u)) taiTrang++;
		return BANG[u] ?? "";
	}, ghi: true, nghi });
	assert.equal(taiTrang, 0);
});

test("xu hướng của ca radar gần nhất được lưu để lần tính lại sau dùng", async () => {
	const s = await khoiTao();
	const web = async (u) => (u.startsWith("https://suggestqueries") ? '["q",["bấm huyệt trị mất ngủ"]]' : BANG[u] ?? "");
	await chayCaRadar({ s, docWeb: web, ghi: true, nghi });
	assert.ok((await xuHuongGanNhat(s)).includes("bấm huyệt trị mất ngủ"));
	await chayCaRadar({ s, docWeb: web, ghi: false, nghi });
	assert.ok((await xuHuongGanNhat(s)).length > 0, "ca thử không che xu hướng của ca thật");
});

test("hạn chót đã qua: không trích trang nào, ghi chú vào nhật ký", async () => {
	const s = await khoiTao();
	const ca = await chayCaRadar({ s, docWeb: WEB, ghi: true, nghi, hanChot: Date.now() - 1 });
	assert.equal(ca.soTrich, 0);
	assert.ok(ca.loi.includes("Dừng trích: chạm hạn ca"));
});
```

- [ ] **Step 2: Chạy, xác nhận thất bại**

Run: `node --test "src/plugins/rada-seo/**/*.test.mjs"` → FAIL (thiếu `trich.mjs`, `mcp-viec.mjs`, `layUrlChoAi`…).

- [ ] **Step 3: Viết mã** — tạo/thay toàn văn:


`cms/src/plugins/rada-seo/radar/trich.mjs`:

```js
// Trích chữ MỘT trang đối thủ cho Claude đọc sau (qua MCP). Plugin KHÔNG gọi mô hình nào:
// việc hiểu nội dung do Claude trong tài khoản của người dùng làm theo lịch đêm (đặc tả, mục
// "Nguồn AI"). Ở đây chỉ tải, lọc ngách (không tốn gì) và cắt chữ sẵn.
import { htmlSangChu, laDongY, TRAN_KY_TU } from "./trang.mjs";

/**
 * @param {{url: string, docWeb: (u: string) => Promise<string>, epBuoc?: boolean}} o
 * @returns {Promise<{trangThai: 'cho_ai', chu: string} | {trangThai: 'ngoai_nganh'} | {trangThai: 'loi', loi: string}>}
 */
export async function trichTrang({ url, docWeb, epBuoc = false }) {
	const html = await docWeb(url);
	if (!html) return { trangThai: "loi", loi: "Không tải được trang (rỗng hoặc bị chặn)" };
	const { tieuDe, moTa, than } = htmlSangChu(html);
	const chu = [
		tieuDe && `TIÊU ĐỀ: ${tieuDe}`,
		moTa && `MÔ TẢ: ${moTa}`,
		than && `NỘI DUNG: ${than.slice(0, TRAN_KY_TU)}`,
	]
		.filter(Boolean)
		.join("\n");
	if (chu.replace(/\s/g, "").length < 40) return { trangThai: "loi", loi: "Trang gần như không có chữ" };
	// Lọc ngách chỉ theo URL + tiêu đề + mô tả: thân bài có menu toàn trang.
	if (!epBuoc && !laDongY(`${url}\n${tieuDe}\n${moTa}`)) return { trangThai: "ngoai_nganh" };
	return { trangThai: "cho_ai", chu };
}
```

`cms/src/plugins/rada-seo/loi-dan.mjs`:

```js
// Lời dặn cho Claude khi đọc trang đối thủ. Trả về trong kết quả của công cụ MCP
// `rada_lay_viec`, nên routine luôn đọc bản ĐANG CHẠY trên máy chủ — sửa ở đây là đủ,
// không phải sửa lời dặn đã dán trong claude.ai.

export const BOI_CANH = `Lĩnh vực kinh doanh của chúng tôi (Kinhlac): Y học cổ truyền / Đông Y, tập trung ngách:
- Đo nhiệt độ kinh lạc / chẩn đoán kinh lạc (phương pháp 24 tỉnh huyệt)
- Huyệt vị, đường kinh, châm cứu (tra cứu + đồ hình 3D)
- Vị thuốc, bài thuốc (tính vị quy kinh), biện chứng luận trị
- Phần mềm số hoá / quản lý phòng khám Đông Y`;

export const LOI_NHAC_TRICH = `Với MỖI trang (chữ đã trích sẵn trong trường "chu"), xác định:
- chuDe: chủ đề chính của bài (1 câu ngắn, tiếng Việt có dấu, viết hoa chữ cái đầu).
- tuKhoa: 3 từ khoá SEO hàng đầu, liên quan tới lĩnh vực trên; kết hợp dài và ngắn; phải thực sự xuất hiện/đúng trọng tâm bài.
- tomTat: các ý phụ khác nhau của bài, tối đa 6 ý, mỗi ý một câu ngắn.
Nội dung mỏng thì suy luận từ tiêu đề và mô tả; tuyệt đối không bịa số liệu. Gửi kết quả bằng rada_ghi_phan_tich, mỗi lượt tối đa 10 trang, giữ nguyên "id".`;
```

`cms/src/plugins/rada-seo/mcp-viec.mjs`:

```js
// Ba việc Claude (lịch đêm trong tài khoản của người dùng) làm qua MCP: lấy trang đã trích →
// ghi kết quả đọc → báo xong để tính lại khoảng trống. Thuần: nhận `s` (storage) và `kv`.
//
// TRẦN PHÍA MÁY CHỦ: mỗi đêm (theo giờ Việt Nam) giao tối đa TRAN_TRANG_MOI_DEM trang. Đó là
// thứ giữ hạn mức gói Claude của người dùng — lời dặn trong routine có thể bị bỏ qua, trần
// ở đây thì không.
import * as kho from "./kho.mjs";
import { capNhatKhoangTrong, xuHuongGanNhat } from "./ca-radar.mjs";
import { BOI_CANH, LOI_NHAC_TRICH } from "./loi-dan.mjs";

export const TRAN_TRANG_MOI_DEM = 40;
export const TRAN_TRANG_MOI_LUOT = 10;

/** "2026-10-01" theo giờ Việt Nam (UTC+7) — đêm 02:00 VN vẫn thuộc ngày đó. */
export function ngayVN(ms) {
	return new Date(ms + 7 * 3600 * 1000).toISOString().slice(0, 10);
}

/** Cộng kv số nguyên, chịu tranh chấp (CAS, thử lại tối đa 5 lần). */
async function cong(kv, khoa, them) {
	for (let i = 0; i < 5; i++) {
		const cu = await kv.getVersioned(khoa);
		const moi = (cu?.value ?? 0) + them;
		const r = await kv.compareAndSet(khoa, cu?.revision ?? null, moi);
		if (r.applied) return moi;
	}
	throw new Error("Không cập nhật được bộ đếm (tranh chấp)");
}

/**
 * @returns {Promise<{trang: {id: string, url: string, chu: string}[], conLaiDemNay: number,
 *   conTrongHangCho: number, boiCanh: string, huongDan: string}>}
 */
export async function layViec({ s, kv, nowMs = Date.now(), soTrang = TRAN_TRANG_MOI_LUOT }) {
	const khoa = `claude:giao:${ngayVN(nowMs)}`;
	const daGiao = (await kv.get(khoa)) ?? 0;
	const duocLay = Math.max(0, Math.min(soTrang, TRAN_TRANG_MOI_LUOT, TRAN_TRANG_MOI_DEM - daGiao));
	const trang = await kho.layUrlChoAi(s, duocLay);
	const tong = trang.length ? await cong(kv, khoa, trang.length) : daGiao;
	return {
		trang: trang.map(({ id, url, chu }) => ({ id, url, chu })),
		conLaiDemNay: TRAN_TRANG_MOI_DEM - tong,
		conTrongHangCho: await kho.demChoAi(s),
		boiCanh: BOI_CANH,
		huongDan: LOI_NHAC_TRICH,
	};
}

/** Chuẩn hoá một kết quả Claude gửi lên (khuôn đã kiểm ở route; đây là lớp phòng thủ thứ hai). */
function chuan(x) {
	const sach = (a, n) => (Array.isArray(a) ? a.map((v) => String(v).trim()).filter(Boolean).slice(0, n) : []);
	return { id: String(x.id), chuDe: String(x.chuDe ?? "").trim(), tuKhoa: sach(x.tuKhoa, 8), tomTat: sach(x.tomTat, 8) };
}

/** @returns {Promise<{daGhi: number, boQua: string[]}>} */
export async function ghiPhanTich({ s, kv, ketQua, nowMs = Date.now() }) {
	const items = ketQua.map(chuan).filter((x) => x.chuDe && x.tuKhoa.length);
	const hong = ketQua.length - items.length;
	const kq = await kho.ghiPhanTich(s, items, new Date(nowMs).toISOString());
	if (kq.daGhi) await cong(kv, `claude:doc:${ngayVN(nowMs)}`, kq.daGhi);
	return { daGhi: kq.daGhi, boQua: kq.boQua, soThieuChuDe: hong };
}

/** Tính lại khoảng trống và ghi một dòng nhật ký loại "claude". */
export async function xongPhanTich({ s, kv, nowMs = Date.now(), nghi }) {
	const batDau = new Date(nowMs).toISOString();
	const ngay = ngayVN(nowMs);
	const ca = { loai: "claude", batDau, ketThuc: null, ghi: true, soDoc: (await kv.get(`claude:doc:${ngay}`)) ?? 0, soCum: 0, loi: [] };
	try {
		ca.soCum = await capNhatKhoangTrong(s, { xuHuong: await xuHuongGanNhat(s), now: batDau, nghi });
	} catch (e) {
		ca.loi.push(`khoảng trống: ${String(e?.message ?? e).slice(0, 300)}`);
	}
	ca.ketThuc = new Date().toISOString();
	await kho.ghiCa(s, ca);
	return { soDocDemNay: ca.soDoc, soCum: ca.soCum, conTrongHangCho: await kho.demChoAi(s), loi: ca.loi };
}
```

`cms/src/plugins/rada-seo/kho.mjs`:

```js
// Dữ liệu của Rada SEO trong storage của plugin (bảng theo namespace plugin, ở kho CMS).
// Mọi hàm nhận `s` = ctx.storage để thử được bằng kho giả.
import { createHash } from "node:crypto";
import { timTrung } from "./luat/trung-lap.mjs";

export const KHAI_BAO_KHO = {
	doi_thu: { indexes: ["tenMien"] },
	url: { indexes: ["doiThuId", "trangThai", ["doiThuId", "trangThai"]] },
	cum: { indexes: ["trangThai", "diem"] },
	ca: { indexes: ["batDau"] },
};

export const TRANG_THAI_CUM = ["cho_viet", "co_nhap", "da_dang", "bo_qua", "phu_boi_tu_dien"];

/**
 * Nghỉ giữa hai lô ghi. CMS chỉ có MỘT kết nối trong pool (astro.config: max 1, chờ tối đa
 * 10 s). putMany của EmDash chạy một INSERT mỗi dòng trong MỘT giao dịch; ở RTT ~88 ms tới
 * Aiven, 300 dòng giữ kết nối đó ~26 s → blog và khu quản trị hết hạn chờ. Chia lô 20 dòng
 * (~1,8 s) và nghỉ giữa các lô để request của người thật chen vào được.
 */
export const NGHI_GIUA_LO_MS = 150;
const choThat = (ms) => new Promise((r) => setTimeout(r, ms));

/** putMany theo lô `co` mục, nghỉ NGHI_GIUA_LO_MS giữa hai lô (không nghỉ sau lô cuối). */
export async function ghiTheoLo(col, items, { nghi = choThat, co = 20 } = {}) {
	for (let i = 0; i < items.length; i += co) {
		if (i > 0) await nghi(NGHI_GIUA_LO_MS);
		await col.putMany(items.slice(i, i + co));
	}
}

const bam = (s) => createHash("sha1").update(s).digest("hex").slice(0, 24);
export const idUrl = (url) => bam(url);

/** Đọc hết các trang của một truy vấn. */
export async function tatCa(col, opts = {}) {
	const ra = [];
	let cursor;
	do {
		const r = await col.query({ ...opts, limit: 100, cursor });
		ra.push(...r.items);
		cursor = r.hasMore ? r.cursor : undefined;
	} while (cursor);
	return ra;
}

export async function dsDoiThu(s) {
	return (await tatCa(s.doi_thu)).map((r) => ({ id: r.id, ...r.data }));
}

/** Khoá tự nhiên là tên miền → thêm lại cùng tên miền chỉ cập nhật. */
export async function luuDoiThu(s, { tenMien, ten, laCuaMinh }, now) {
	const cu = await s.doi_thu.get(tenMien);
	await s.doi_thu.put(tenMien, { tenMien, ten: ten || tenMien, laCuaMinh: !!laCuaMinh, taoLuc: cu?.taoLuc ?? now });
}

export async function xoaDoiThu(s, tenMien) {
	const urls = await tatCa(s.url, { where: { doiThuId: tenMien } });
	if (urls.length) await s.url.deleteMany(urls.map((r) => r.id));
	await s.doi_thu.delete(tenMien);
	return urls.length;
}

/** Thêm URL chưa có; trả số URL mới. `ghi=false` chỉ đếm. */
export async function themUrlMoi(s, tenMien, urls, { ghi, now, nghi }) {
	const ids = urls.map(idUrl);
	const daCo = await s.url.getMany(ids);
	const moi = urls.filter((u, i) => !daCo.has(ids[i]));
	if (ghi && moi.length)
		await ghiTheoLo(s.url, moi.map((url) => ({ id: idUrl(url), data: { doiThuId: tenMien, url, trangThai: "cho", taoLuc: now } })), { nghi });
	return moi.length;
}

export async function layUrlCho(s, tenMien, n) {
	const r = await s.url.query({ where: { doiThuId: tenMien, trangThai: "cho" }, limit: Math.min(n, 100) });
	return r.items.map((x) => ({ id: x.id, ...x.data }));
}

export async function capNhatUrl(s, id, patch) {
	const cu = await s.url.get(id);
	if (cu) await s.url.put(id, { ...cu, ...patch });
}

/**
 * Đưa mọi URL 'loi' của một đối thủ về 'cho' để ca sau thử lại (lỗi mạng tạm, trang chặn
 * nhất thời). Bỏ trường `loi` cũ. @returns {Promise<number>} số URL đã đặt lại
 */
export async function datLaiUrlLoi(s, tenMien, { nghi } = {}) {
	const rows = await tatCa(s.url, { where: { doiThuId: tenMien, trangThai: "loi" } });
	await ghiTheoLo(
		s.url,
		rows.map((r) => {
			const { loi: _bo, ...con } = r.data;
			return { id: r.id, data: { ...con, trangThai: "cho" } };
		}),
		{ nghi },
	);
	return rows.length;
}

/**
 * Vòng đời một URL: cho (mới gom) → cho_ai (đã trích chữ, chờ Claude đọc qua MCP)
 * → da_phan_tich (Claude đã ghi chủ đề). Nhánh cụt: ngoai_nganh, loi.
 */
export const TRANG_THAI_URL = ["cho", "cho_ai", "da_phan_tich", "ngoai_nganh", "loi"];

export async function demUrl(s, tenMien) {
	const ra = {};
	for (const t of TRANG_THAI_URL) ra[t] = await s.url.count({ doiThuId: tenMien, trangThai: t });
	return ra;
}

/** Trang đã trích chữ, chờ Claude đọc (mọi đối thủ). */
export async function layUrlChoAi(s, n) {
	if (n <= 0) return [];
	const r = await s.url.query({ where: { trangThai: "cho_ai" }, limit: Math.min(n, 100) });
	return r.items.map((x) => ({ id: x.id, url: x.data.url, doiThuId: x.data.doiThuId, chu: x.data.chu }));
}

export async function demChoAi(s) {
	return s.url.count({ trangThai: "cho_ai" });
}

/**
 * Ghi kết quả Claude đọc. Chỉ nhận URL đang 'cho_ai' — id lạ hay URL đã đọc rồi thì bỏ qua
 * và báo lại, không ghi đè. Bỏ trường `chu` sau khi đọc: không ai cần nó nữa mà nó nặng nhất.
 * @param {{id: string, chuDe: string, tuKhoa: string[], tomTat: string[]}[]} items
 * @returns {Promise<{daGhi: number, boQua: string[]}>}
 */
export async function ghiPhanTich(s, items, now) {
	const cu = await s.url.getMany(items.map((x) => x.id));
	const ghi = [], boQua = [];
	for (const x of items) {
		const d = cu.get(x.id);
		if (!d || d.trangThai !== "cho_ai") {
			boQua.push(x.id);
			continue;
		}
		const { chu: _bo, ...conLai } = d;
		ghi.push({ id: x.id, data: { ...conLai, trangThai: "da_phan_tich", chuDe: x.chuDe, tuKhoa: x.tuKhoa, tomTat: x.tomTat, phanTichLuc: now } });
	}
	if (ghi.length) await s.url.putMany(ghi);
	return { daGhi: ghi.length, boQua };
}

/** Chủ đề đã phân tích, tách theo "của mình" hay đối thủ. */
export async function chuDeDaPhanTich(s, doiThu) {
	const cuaMinh = new Set(doiThu.filter((d) => d.laCuaMinh).map((d) => d.id));
	const rows = await tatCa(s.url, { where: { trangThai: "da_phan_tich" } });
	const minh = [], doiThuTopics = [];
	for (const r of rows) {
		const t = { id: r.id, doiThuId: r.data.doiThuId, chuDe: r.data.chuDe, tuKhoa: r.data.tuKhoa ?? [] };
		(cuaMinh.has(t.doiThuId) ? minh : doiThuTopics).push(t);
	}
	return { minh, doiThu: doiThuTopics };
}

export async function dsCum(s, n = 100) {
	const r = await s.cum.query({ orderBy: { diem: "desc" }, limit: Math.min(n, 100) });
	return r.items.map((x) => ({ id: x.id, ...x.data }));
}

/**
 * Thay các cụm "cho_viet" bằng lứa mới. Cụm đã khoá (bỏ qua / có nháp / đã đăng / phủ bởi từ
 * điển) được GIỮ, và cụm mới nào giống một cụm đã khoá thì không thêm — nhờ vậy bấm "Bỏ qua"
 * có tác dụng qua các đêm dù tên cụm mỗi đêm hơi khác.
 * @returns {Promise<number>} số cụm đã ghi
 */
export async function thayCum(s, cumMoi, now, { nghi } = {}) {
	const cu = await tatCa(s.cum);
	const khoa = cu.filter((r) => r.data.trangThai !== "cho_viet").map((r) => ({ id: r.id, tieuDe: r.data.tenCum, tuKhoa: r.data.tuKhoa }));
	const xoa = cu.filter((r) => r.data.trangThai === "cho_viet").map((r) => r.id);
	if (xoa.length) await s.cum.deleteMany(xoa);
	const ghi = cumMoi.filter((c) => !timTrung({ tieuDe: c.tenCum, tuKhoa: c.tuKhoa }, khoa));
	if (ghi.length) await ghiTheoLo(s.cum, ghi.map((c) => ({ id: bam(c.tenCum), data: { ...c, trangThai: "cho_viet", capNhatLuc: now } })), { nghi });
	return ghi.length;
}

export async function datTrangThaiCum(s, id, trangThai) {
	if (!TRANG_THAI_CUM.includes(trangThai)) throw new Error(`Trạng thái cụm không hợp lệ: ${trangThai}`);
	const cu = await s.cum.get(id);
	if (!cu) throw new Error("Không có cụm này");
	await s.cum.put(id, { ...cu, trangThai });
}

export async function ghiCa(s, ca) {
	await s.ca.put(`${ca.batDau}-${ca.loai}`, ca);
}

export async function dsCa(s, n = 10) {
	const r = await s.ca.query({ orderBy: { batDau: "desc" }, limit: n });
	return r.items.map((x) => x.data);
}
```

`cms/src/plugins/rada-seo/ca-radar.mjs`:

```js
// Một ca radar (plugin, KHÔNG gọi mô hình): quét sitemap mọi đối thủ → trích chữ các URL mới
// (có trần) để Claude đọc sau qua MCP → dò xu hướng → tính lại khoảng trống từ những gì Claude
// đã đọc → ghi nhật ký ca. `ghi=false` (chạy thử) chỉ quét và đếm, không ghi URL hay cụm —
// nhưng VẪN ghi nhật ký ca để thấy lần thử đã chạy.
import { thuThapUrl } from "./radar/sitemap.mjs";
import { trichTrang } from "./radar/trich.mjs";
import { timXuHuong } from "./radar/xu-huong.mjs";
import { timKhoangTrong } from "./radar/khoang-trong.mjs";
import * as kho from "./kho.mjs";

/** Nghỉ giữa các lượt tải trang: CMS còn phục vụ ảnh, khu quản trị và blog cho người thật. */
export const NGHI_GIUA_LUOT_MS = 300;

const cho = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Tính lại danh sách khoảng trống từ các URL Claude đã đọc. Dùng ở cuối ca radar VÀ khi
 * Claude báo đọc xong (mcp-viec.mjs) — nên tách riêng.
 * @returns {Promise<number>} số cụm đã ghi
 */
export async function capNhatKhoangTrong(s, { xuHuong, now, nghi }) {
	const doiThu = await kho.dsDoiThu(s);
	const { minh, doiThu: dt } = await kho.chuDeDaPhanTich(s, doiThu);
	const cum = timKhoangTrong({ chuDeMinh: minh, chuDeDoiThu: dt, xuHuong });
	return kho.thayCum(s, cum, now, { nghi });
}

/** Xu hướng mà ca radar gần nhất (có ghi) đã dò — để lần tính lại sau đó dùng tiếp. */
export async function xuHuongGanNhat(s) {
	const ca = await kho.dsCa(s, 20);
	return ca.find((c) => c.loai === "radar" && c.ghi && Array.isArray(c.xuHuong))?.xuHuong ?? [];
}

/**
 * @param {{s: object, docWeb: Function, ghi: boolean, tranMoiDoiThu?: number,
 *          nghi?: (ms: number) => Promise<void>, now?: () => string, hanChot?: number}} o
 *   hanChot: mốc epoch ms — quá mốc thì thôi trích (khoá ca sắp hết hạn)
 */
export async function chayCaRadar({ s, docWeb, ghi, tranMoiDoiThu = 30, nghi = cho, now = () => new Date().toISOString(), hanChot = Infinity }) {
	const ca = {
		loai: "radar", batDau: now(), ketThuc: null, ghi,
		soUrlMoi: 0, soSeTrich: 0, soTrich: 0, soNgoaiNganh: 0, soLoiTrang: 0,
		soXuHuong: 0, soCum: 0, xuHuong: [], loi: [],
	};
	const doiThu = await kho.dsDoiThu(s);
	let dung = null;
	for (const d of doiThu) {
		try {
			const urls = await thuThapUrl(d.tenMien, docWeb);
			const soMoi = await kho.themUrlMoi(s, d.tenMien, urls, { ghi, now: now(), nghi });
			ca.soUrlMoi += soMoi;
			const hang = await kho.layUrlCho(s, d.tenMien, tranMoiDoiThu);
			// Chạy thử không ghi URL mới nên layUrlCho không thấy chúng — cộng tay để bản xem trước
			// báo đúng số trang ca thật SẼ trích (vẫn chặn bởi trần mỗi đối thủ).
			ca.soSeTrich += ghi ? hang.length : Math.min(tranMoiDoiThu, hang.length + soMoi);
			if (!ghi || dung) continue;
			for (const u of hang) {
				if (Date.now() > hanChot) {
					dung = "Dừng trích: chạm hạn ca";
					ca.loi.push(dung);
					break;
				}
				const kq = await trichTrang({ url: u.url, docWeb });
				await kho.capNhatUrl(s, u.id, { ...kq, trichLuc: now() });
				if (kq.trangThai === "cho_ai") ca.soTrich++;
				else if (kq.trangThai === "ngoai_nganh") ca.soNgoaiNganh++;
				else ca.soLoiTrang++;
				await nghi(NGHI_GIUA_LUOT_MS);
			}
		} catch (e) {
			ca.loi.push(`${d.tenMien}: ${String(e?.message ?? e).slice(0, 300)}`);
		}
	}
	if (ghi) {
		try {
			ca.xuHuong = await timXuHuong({ docWeb });
			ca.soXuHuong = ca.xuHuong.length;
			ca.soCum = await capNhatKhoangTrong(s, { xuHuong: ca.xuHuong, now: now(), nghi });
		} catch (e) {
			ca.loi.push(`khoảng trống: ${String(e?.message ?? e).slice(0, 300)}`);
		}
	}
	ca.ketThuc = now();
	await kho.ghiCa(s, ca);
	return ca;
}
```

- [ ] **Step 4: Chạy, xác nhận đạt**

Run: `node --test "src/plugins/rada-seo/**/*.test.mjs"` → `fail 0` (plugin.test.mjs vẫn đạt vì `plugin.mjs` chưa đổi: tham số thừa `claude` bị bỏ qua).

- [ ] **Step 5: Commit**

```bash
git add cms/src/plugins/rada-seo/
git commit -m "feat(rada-seo): trích chữ trang cho Claude đọc qua MCP, bỏ phân tích Haiku trong ca radar" -- cms/src/plugins/rada-seo/
```

---

### Task 2: Nối công cụ MCP vào plugin, gỡ SDK, cập nhật màn điều khiển

**Files:**
- Replace (toàn văn): `cms/src/plugins/rada-seo/plugin.mjs`, `plugin.test.mjs`, `admin.jsx`
- Delete: `cms/src/plugins/rada-seo/lib/claude.mjs`, `lib/claude.test.mjs`, `radar/phan-tich.mjs`
- Modify: `cms/package.json`, `cms/package-lock.json` (`npm uninstall @anthropic-ai/sdk`; GIỮ `zod`)

**Interfaces:**
- Consumes: mọi thứ của Task 1.
- Produces: route `mcp-lay-viec`, `mcp-ghi-phan-tich`, `mcp-xong-phan-tich`; `plugin.mcp.tools` = `rada_lay_viec`, `rada_ghi_phan_tich`, `rada_xong_phan_tich`; `tong-quan` thêm `choAi`, `canhBaoClaude` (có trang chờ mà > 26 giờ không có ca loại "claude"); ca radar "thành công" = `loai==="radar" && ghi && ketThuc && typeof soSeTrich==="number"`.

- [ ] **Step 1: Thay `plugin.test.mjs` (thất bại)**

`cms/src/plugins/rada-seo/plugin.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { createPlugin, LICH_RADAR, GIO_UTC_CHAY } from "./plugin.mjs";
import * as kho from "./kho.mjs";
import { taoKhoGia } from "./__test__/kho-gia.mjs";

const taoCtx = () => {
	const log = [];
	return {
		storage: taoKhoGia(),
		log: { warn: (m) => log.push(["warn", m]), error: (m) => log.push(["error", m]), info: (m) => log.push(["info", m]) },
		_log: log,
		kv: {
			async get() { return null; },
			async getVersioned() { return null; },
			async compareAndSet() { return { applied: false }; },
			async compareAndDelete() {},
		},
		cron: { lich: null, async schedule(ten, o) { this.lich = { ten, ...o }; }, async list() { return this.lich ? [this.lich] : []; } },
	};
};
const coBien = (ten, giaTri, fn) => async () => {
	const cu = process.env[ten];
	if (giaTri === undefined) delete process.env[ten];
	else process.env[ten] = giaTri;
	try { await fn(); } finally { if (cu === undefined) delete process.env[ten]; else process.env[ten] = cu; }
};

test("lịch chạy mỗi giờ phút 30 (giống nhau ở mọi múi giờ tròn giờ), ca thật chốt ở 19 giờ UTC", () => {
	assert.equal(LICH_RADAR, "30 * * * *");
	assert.equal(GIO_UTC_CHAY, 19);
});

test("cron: ngoài giờ 19 UTC thì trả ngay, không ghi, không log — kể cả máy không bật ca đêm", coBien("RADA_SEO_CA_DEM", undefined, async (t) => {
	const p = createPlugin();
	for (const gioLech of [0, 5, 12, 18, 20, 23]) {
		const ctx = taoCtx();
		const goc = Date.prototype.getUTCHours;
		Date.prototype.getUTCHours = () => gioLech;
		try {
			await p.hooks.cron.handler({ name: "radar" }, ctx);
		} finally {
			Date.prototype.getUTCHours = goc;
		}
		assert.equal(ctx.storage.ca._m.size, 0, `giờ ${gioLech}`);
		assert.equal(ctx._log.length, 0, `giờ ${gioLech}`);
	}
}));

test("cron: đúng 19 giờ UTC trên máy không bật ca đêm → ghi dòng 'nhả ca'", coBien("RADA_SEO_CA_DEM", undefined, async () => {
	const p = createPlugin();
	const ctx = taoCtx();
	const goc = Date.prototype.getUTCHours;
	Date.prototype.getUTCHours = () => GIO_UTC_CHAY;
	try {
		await p.hooks.cron.handler({ name: "radar" }, ctx);
	} finally {
		Date.prototype.getUTCHours = goc;
	}
	const ca = await kho.dsCa(ctx.storage);
	assert.equal(ca.length, 1);
	assert.match(ca[0].loi[0], /RADA_SEO_CA_DEM/);
}));

test("lich-bat: chỉ đòi RADA_SEO_CA_DEM=1, không còn đòi múi giờ UTC", async () => {
	const p = createPlugin();
	await coBien("RADA_SEO_CA_DEM", undefined, async () => {
		await assert.rejects(p.routes["lich-bat"].handler(taoCtx()), /RADA_SEO_CA_DEM/);
	})();
	await coBien("RADA_SEO_CA_DEM", "1", async () => {
		const goc = Date.prototype.getTimezoneOffset;
		Date.prototype.getTimezoneOffset = () => -420; // giờ Việt Nam
		try {
			const ctx = taoCtx();
			await p.routes["lich-bat"].handler(ctx);
			assert.deepEqual(ctx.cron.lich, { ten: "radar", schedule: LICH_RADAR });
		} finally {
			Date.prototype.getTimezoneOffset = goc;
		}
	})();
});

test("url-dat-lai: tên miền sai → badRequest; đúng → đặt lại URL lỗi", async () => {
	const p = createPlugin();
	await assert.rejects(p.routes["url-dat-lai"].handler({ ...taoCtx(), input: { tenMien: "khong co cham" } }), (e) => e?.name === "PluginRouteError" || /không hợp lệ/.test(e.message));
	const ctx = { ...taoCtx(), input: { tenMien: "https://www.A.vn/" } };
	await kho.themUrlMoi(ctx.storage, "a.vn", ["https://a.vn/1"], { ghi: true, now: "t" });
	await kho.capNhatUrl(ctx.storage, kho.idUrl("https://a.vn/1"), { trangThai: "loi" });
	assert.deepEqual(await p.routes["url-dat-lai"].handler(ctx), { tenMien: "a.vn", soUrlDatLai: 1 });
});

test("MCP: 3 công cụ, mỗi cái trỏ route có thật, có permission bậc contributor và khuôn zod", () => {
	const p = createPlugin();
	const tools = p.mcp.tools;
	assert.deepEqual(Object.keys(tools).sort(), ["rada_ghi_phan_tich", "rada_lay_viec", "rada_xong_phan_tich"]);
	for (const [ten, t] of Object.entries(tools)) {
		const r = p.routes[t.route];
		assert.ok(r, `${ten} → route ${t.route}`);
		assert.ok(["content:read_drafts", "content:create"].includes(r.permission), `${ten} permission`);
		assert.equal(typeof r.input?.safeParse, "function", `${ten} route input zod`);
		assert.equal(t.input, r.input, `${ten} dùng chung khuôn với route`);
		assert.equal(t.destructive, false);
		assert.match(ten, /^[A-Za-z0-9_-]+$/);
	}
	// Khuôn ghi chặn lô quá 10 và mục thiếu từ khoá.
	const ghi = p.routes["mcp-ghi-phan-tich"].input;
	const muc = { id: "u", chuDe: "x", tuKhoa: ["a"], tomTat: [] };
	assert.equal(ghi.safeParse({ ketQua: Array(11).fill(muc) }).success, false);
	assert.equal(ghi.safeParse({ ketQua: [{ ...muc, tuKhoa: [] }] }).success, false);
	assert.equal(ghi.safeParse({ ketQua: [muc] }).success, true);
});

test("tong-quan: báo đỏ Claude khi có trang chờ mà chưa có ca 'claude' trong 26 giờ", async () => {
	const p = createPlugin();
	const ctx = taoCtx();
	await ctx.storage.url.put("u1", { doiThuId: "a.vn", url: "https://a.vn/1", trangThai: "cho_ai", chu: "x" });
	let kq = await p.routes["tong-quan"].handler(ctx);
	assert.equal(kq.choAi, 1);
	assert.equal(kq.canhBaoClaude, true);
	const vua = new Date().toISOString();
	await kho.ghiCa(ctx.storage, { loai: "claude", batDau: vua, ketThuc: vua, ghi: true, soDoc: 3, loi: [] });
	kq = await p.routes["tong-quan"].handler(ctx);
	assert.equal(kq.canhBaoClaude, false);
});
```

- [ ] **Step 2: Chạy, xác nhận thất bại**

Run: `node --test src/plugins/rada-seo/plugin.test.mjs` → FAIL (`p.mcp` chưa có).

- [ ] **Step 3: Thay `plugin.mjs` và `admin.jsx`, gỡ SDK**

`cms/src/plugins/rada-seo/plugin.mjs`:

```js
// Plugin Rada SEO — phần NỐI: khai báo với EmDash, route cho màn điều khiển, hook cron.
// Logic nằm ở các mô-đun thuần (kho, ca-radar, radar/*, luat/*) và có phép kiểm riêng.
//
// Dạng đăng ký đã ĐO ở bước 0 (docs/superpowers/plans/2026-09-30-rada-seo-ket-qua-buoc-0.md):
// EmDash nạp module này qua descriptor native và gọi createPlugin(); default export KHÔNG dùng.
import { definePlugin, PluginRouteError } from "emdash";
import { KHAI_BAO_KHO } from "./kho.mjs";
import * as kho from "./kho.mjs";
import { chuanTenMien } from "./radar/sitemap.mjs";
import { chayCaRadar } from "./ca-radar.mjs";
import { taoDocWeb } from "./lib/doc-web.mjs";
import { z } from "zod";
import { layViec, ghiPhanTich, xongPhanTich, TRAN_TRANG_MOI_LUOT } from "./mcp-viec.mjs";

/**
 * Lịch cron: phút 30 MỖI GIỜ. Ca thật chỉ chạy ở tick có giờ UTC = GIO_UTC_CHAY (19:30 UTC =
 * 02:30 giờ Việt Nam); 23 tick còn lại trả ngay, không ghi gì.
 *
 * Vì sao không hẹn thẳng "30 19 * * *": EmDash tính lại next_run_at SAU MỖI LƯỢT NHẬN, bằng
 * croner KHÔNG kèm múi giờ → theo múi giờ của TIẾN TRÌNH ĐÃ NHẬN. Bảng _emdash_cron_tasks nằm
 * trong kho CMS dùng chung, nên chỉ cần MỘT tick bị một tiến trình giờ VN (máy lập trình) nhận
 * là ca đêm trôi 7 tiếng, và trôi mãi. "30 * * * *" cho ra cùng mốc ở mọi múi giờ tròn giờ,
 * còn phép so giờ UTC trong hook thì không phụ thuộc múi giờ tiến trình.
 */
export const LICH_RADAR = "30 * * * *";
export const GIO_UTC_CHAY = 19;
/** Khoá chống chạy chồng: ca dài nhất đo được + dư. Quá hạn thì coi như ca trước đã chết. */
const KHOA_CA = "ca:dang-chay";
const HAN_KHOA_MS = 3 * 60 * 60 * 1000;
/** Ca thành công gần nhất cũ hơn mức này thì màn điều khiển báo đỏ. */
const CANH_BAO_SAU_MS = 26 * 60 * 60 * 1000;

const soMoiTruong = (ten, macDinh) => {
	const n = Number(process.env[ten]);
	return Number.isFinite(n) && n > 0 ? n : macDinh;
};

/**
 * CÔNG TẮC "CHỈ VPS". Bảng _emdash_cron_tasks nằm trong kho CMS DÙNG CHUNG: mọi tiến trình CMS
 * nối kho (kể cả `npm run dev` ở máy lập trình) đều có thể nhận ca đêm. Chỉ nơi đặt biến này
 * (docker-compose trên VPS, KHÔNG phải cms/.env vì tệp đó được chép qua lại) mới chạy ca.
 */
const caDemBat = () => process.env.RADA_SEO_CA_DEM === "1";

/** @returns {Promise<string|null>} revision của khoá vừa giành được, null nếu đã có ca khác giữ. */
async function giuKhoa(kv) {
	const cu = await kv.getVersioned(KHOA_CA);
	if (cu && cu.value?.het > Date.now()) return null;
	const r = await kv.compareAndSet(KHOA_CA, cu?.revision ?? null, { tu: new Date().toISOString(), het: Date.now() + HAN_KHOA_MS });
	return r.applied ? r.revision : null;
}

async function chayCa(ctx, ghi) {
	const revision = await giuKhoa(ctx.kv);
	if (!revision) {
		ctx.log.warn("Rada SEO: đã có một ca đang chạy, bỏ qua lượt này");
		return null;
	}
	try {
		return await chayCaRadar({
			// Dừng trích 15 phút trước khi khoá hết hạn: quá hạn khoá thì một ca khác được
			// giành khoá và chạy chồng lên ca này.
			hanChot: Date.now() + HAN_KHOA_MS - 15 * 60 * 1000,
			s: ctx.storage,
			docWeb: taoDocWeb(ctx.http.fetch.bind(ctx.http)),
			ghi,
			tranMoiDoiThu: soMoiTruong("RADA_SEO_TRAN_MOI_DOI_THU", 30),
		});
	} catch (e) {
		// Lỗi ngoài dự kiến (vd kho không ghi được) vẫn phải hiện trên màn điều khiển.
		const bayGio = new Date().toISOString();
		await kho.ghiCa(ctx.storage, { loai: "radar", batDau: bayGio, ketThuc: bayGio, ghi, loi: [String(e?.message ?? e)] });
		ctx.log.error("Rada SEO: ca hỏng", e);
		return null;
	} finally {
		// So khớp đúng revision đã giành: một ca cũ quá hạn khoá (coi như đã chết, xem giuKhoa)
		// không được xoá khoá của ca MỚI vừa giành lại — compareAndDelete chỉ xoá khi còn khớp.
		await ctx.kv.compareAndDelete(KHOA_CA, revision);
	}
}

const vao = (ctx) => (ctx.input && typeof ctx.input === "object" ? ctx.input : {});

/** Tuổi (ms) của ca gần nhất thoả điều kiện trong 100 ca gần nhất; Infinity nếu không có. */
function tuoiCa(dsCa, dieuKien) {
	const c = dsCa.find(dieuKien);
	return c ? Date.now() - Date.parse(c.ketThuc) : Infinity;
}

// ---- Công cụ MCP cho Claude (lịch đêm trong tài khoản người dùng) ----
// Quyền: tài khoản của Claude là CONTRIBUTOR (tạo nháp được, không đăng được). Hai quyền dưới
// đều có ở bậc đó. Route MCP phải khai `permission` tường minh và `input` bằng zod.
const KHUON_LAY_VIEC = z.object({ soTrang: z.number().int().min(1).max(TRAN_TRANG_MOI_LUOT).optional() });
const KHUON_GHI = z.object({
	ketQua: z
		.array(
			z.object({
				id: z.string().min(1).max(64),
				chuDe: z.string().min(1).max(300),
				tuKhoa: z.array(z.string().min(1).max(120)).min(1).max(8),
				tomTat: z.array(z.string().max(400)).max(8),
			}),
		)
		.min(1)
		.max(TRAN_TRANG_MOI_LUOT),
});
const KHUON_RONG = z.object({});

export function createPlugin() {
	return definePlugin({
		id: "rada-seo",
		version: "0.1.0",
		// Đối thủ do người quản trị thêm lúc chạy nên không liệt kê trước được tên miền;
		// lớp chặn nằm ở doc-web.mjs (không IP/localhost) và sitemap.mjs (chỉ cùng tên miền).
		capabilities: ["network:request:unrestricted"],
		storage: KHAI_BAO_KHO,
		// Mục "Rada SEO" ở thanh bên PHẢI khai ở đây. Với format:"native", EmDash 0.39.1 dựng
		// manifest admin từ plugin.admin của definePlugin() và BỎ QUA adminPages của descriptor
		// (chỉ plugin "standard"/sandbox mới đọc chỗ đó). Đo ở nghiệm thu 2A: thiếu khối này thì
		// manifest ra adminPages:[] và thanh bên không có mục nào, dù trang vẫn mở được bằng URL.
		// React component vẫn nạp qua adminEntry của descriptor (admin registry lúc build).
		admin: { pages: [{ path: "/rada", label: "Rada SEO", icon: "chart" }] },
		hooks: {
			cron: async (event, ctx) => {
				if (event.name !== "radar") return;
				// 23/24 tick mỗi ngày dừng ở đây, IM LẶNG (xem LICH_RADAR). Phải đứng TRƯỚC phép kiểm
				// công tắc: không thì máy lập trình ghi một dòng "nhả ca" mỗi giờ.
				if (new Date().getUTCHours() !== GIO_UTC_CHAY) return;
				if (!caDemBat()) {
					ctx.log.warn("Rada SEO: máy này không bật RADA_SEO_CA_DEM — nhả ca đêm");
					const bayGio = new Date().toISOString();
					await kho.ghiCa(ctx.storage, {
						loai: "radar", batDau: bayGio, ketThuc: bayGio, ghi: false,
						loi: ["Ca đêm bị một tiến trình KHÔNG bật RADA_SEO_CA_DEM nhận — đêm nay radar không chạy"],
					});
					return;
				}
				// THẢ ca chạy nền, không await: EmDash bọc mọi hook cron bằng executeWithTimeout
				// (5 giây mặc định — resolveHook trong node_modules/emdash), và bộ lập lịch cron
				// của Node chỉ lên dây lại SAU KHI hook resolve. Await trọn một ca radar (có thể
				// vài giờ) sẽ vừa ghi "Hook timeout after 5000ms" giả mỗi đêm vừa treo mọi cron
				// task khác của CMS cho tới khi ca xong. Khoá KV (giuKhoa/compareAndDelete ở
				// chayCa) chống chạy chồng nếu một tick cron khác tới trước khi ca này xong.
				chayCa(ctx, true).catch((e) => ctx.log.error("Rada SEO: ca đêm hỏng", e));
			},
		},
		routes: {
			"tong-quan": {
				handler: async (ctx) => {
					const doiThu = await kho.dsDoiThu(ctx.storage);
					for (const d of doiThu) d.dem = await kho.demUrl(ctx.storage, d.id);
					const ca = await kho.dsCa(ctx.storage, 10);
					// "Thành công" = ca thật sự đi qua chayCaRadar (chỉ hàm đó gán soSeTrich, một
					// số — dòng lỗi trước khi vào ca và dòng "nhả ca" ở trên đều KHÔNG có trường này).
					// Không đòi `loi` rỗng: một ca chạy đúng vẫn có thể đẩy ghi chú chạm hạn ca
					// hoặc lỗi sitemap của MỘT đối thủ vào `loi` mà cả ca vẫn hoàn tất —
					// đòi rỗng làm cảnh báo "26 giờ" đỏ vĩnh viễn dù đêm nào ca cũng chạy xong. Tra
					// trong 100 ca gần nhất (không phải 10 dòng hiển thị `ca`) để không bỏ sót.
					const canhChe = await kho.dsCa(ctx.storage, 100);
					const tuoiRadar = tuoiCa(canhChe, (c) => c.loai === "radar" && c.ghi && c.ketThuc && typeof c.soSeTrich === "number");
					const tuoiClaude = tuoiCa(canhChe, (c) => c.loai === "claude" && c.ketThuc);
					const choAi = await kho.demChoAi(ctx.storage);
					const khoa = await ctx.kv.get(KHOA_CA);
					return {
						doiThu,
						cum: await kho.dsCum(ctx.storage, 100),
						ca,
						lich: (await ctx.cron?.list()) ?? [],
						caDemBat: caDemBat(),
						dangChay: !!(khoa && khoa.het > Date.now()),
						choAi,
						canhBaoCaDem: caDemBat() && tuoiRadar > CANH_BAO_SAU_MS,
						// Có trang chờ mà 26 giờ Claude không đọc: routine không chạy, hoặc connector
						// mất đăng nhập (token OAuth không tự làm mới khi không có người — chưa được
						// tài liệu nào bảo đảm, xem đặc tả mục "Nguồn AI").
						canhBaoClaude: choAi > 0 && tuoiClaude > CANH_BAO_SAU_MS,
					};
				},
			},
			"doi-thu-luu": {
				handler: async (ctx) => {
					const { tenMien, ten, laCuaMinh } = vao(ctx);
					const tm = chuanTenMien(tenMien);
					if (!tm) throw PluginRouteError.badRequest("Tên miền không hợp lệ");
					await kho.luuDoiThu(ctx.storage, { tenMien: tm, ten: String(ten ?? "").trim(), laCuaMinh: !!laCuaMinh }, new Date().toISOString());
					return { tenMien: tm };
				},
			},
			"doi-thu-xoa": {
				handler: async (ctx) => {
					const tm = chuanTenMien(vao(ctx).tenMien);
					if (!tm) throw PluginRouteError.badRequest("Tên miền không hợp lệ");
					return { soUrlDaXoa: await kho.xoaDoiThu(ctx.storage, tm) };
				},
			},
			"url-dat-lai": {
				// URL 'loi' (trang chặn tạm, mạng chập) không tự thử lại; nút này đưa chúng về 'cho'.
				handler: async (ctx) => {
					const tm = chuanTenMien(vao(ctx).tenMien);
					if (!tm) throw PluginRouteError.badRequest("Tên miền không hợp lệ");
					return { tenMien: tm, soUrlDatLai: await kho.datLaiUrlLoi(ctx.storage, tm) };
				},
			},
			"cum-trang-thai": {
				handler: async (ctx) => {
					const { id, trangThai } = vao(ctx);
					// Màn điều khiển chỉ được bỏ qua / khôi phục; các trạng thái khác do lò viết đặt.
					if (!["bo_qua", "cho_viet"].includes(trangThai)) throw PluginRouteError.badRequest("Chỉ được đặt bo_qua hoặc cho_viet");
					try {
						await kho.datTrangThaiCum(ctx.storage, String(id), trangThai);
					} catch (e) {
						if (e?.message === "Không có cụm này") throw PluginRouteError.notFound("Không có cụm này");
						throw e;
					}
					return { id, trangThai };
				},
			},
			"lich-bat": {
				// plugin:install KHÔNG chạy với plugin khai trong config (đo ở bước 0) nên phải hẹn
				// qua route. schedule là upsert: bấm lại vô hại.
				handler: async (ctx) => {
					// Chỉ hẹn từ máy chạy ca đêm (RADA_SEO_CA_DEM=1, tức container VPS). KHÔNG còn đòi
					// tiến trình UTC: LICH_RADAR "30 * * * *" ra cùng mốc ở mọi múi giờ tròn giờ, và
					// giờ chạy thật do phép so giờ UTC trong hook cron quyết định.
					if (!caDemBat())
						throw PluginRouteError.badRequest("Chỉ hẹn lịch được trên máy chủ chạy ca đêm (RADA_SEO_CA_DEM=1)");
					await ctx.cron.schedule("radar", { schedule: LICH_RADAR });
					return { lich: await ctx.cron.list() };
				},
			},
			"mcp-lay-viec": {
				permission: "content:read_drafts",
				input: KHUON_LAY_VIEC,
				handler: async (ctx) => layViec({ s: ctx.storage, kv: ctx.kv, soTrang: ctx.input?.soTrang }),
			},
			"mcp-ghi-phan-tich": {
				permission: "content:create",
				input: KHUON_GHI,
				handler: async (ctx) => ghiPhanTich({ s: ctx.storage, kv: ctx.kv, ketQua: ctx.input.ketQua }),
			},
			"mcp-xong-phan-tich": {
				permission: "content:create",
				input: KHUON_RONG,
				handler: async (ctx) => xongPhanTich({ s: ctx.storage, kv: ctx.kv }),
			},
			"ca-chay": {
				// Chạy NỀN rồi trả ngay: một ca thật kéo dài nhiều phút, quá hạn chờ của nginx.
				handler: async (ctx) => {
					const ghi = vao(ctx).ghi === true;
					if (ghi && !caDemBat()) throw PluginRouteError.badRequest("Máy này không bật RADA_SEO_CA_DEM — chỉ được chạy thử");
					// Nhìn trước khoá để báo thật cho người bấm (trước đây trả daBatDau:true dù ca bị
					// chặn). Cùng luật hết hạn với giuKhoa. Đây chỉ là lời báo: chốt chặn thật vẫn là
					// giuKhoa trong chayCa, vì hai lời gọi có thể cùng lọt qua bước nhìn này.
					const khoa = await ctx.kv.get(KHOA_CA);
					if (khoa && khoa.het > Date.now()) throw PluginRouteError.conflict("Đang có một ca chạy — chờ ca đó xong");
					chayCa(ctx, ghi).catch((e) => ctx.log.error("Rada SEO: ca nền hỏng", e));
					return { daBatDau: true, ghi };
				},
			},
		},
		mcp: {
			tools: {
				rada_lay_viec: {
					description:
						"Rada SEO: lấy tối đa 10 trang đối thủ đã trích chữ sẵn, đang chờ đọc. Kèm bối cảnh doanh nghiệp và lời dặn cách đọc. Trả mảng rỗng khi hết việc hoặc đã chạm trần 40 trang/đêm.",
					route: "mcp-lay-viec",
					input: KHUON_LAY_VIEC,
					destructive: false,
				},
				rada_ghi_phan_tich: {
					description:
						"Rada SEO: ghi kết quả đọc (chuDe, tuKhoa, tomTat) cho các trang lấy từ rada_lay_viec, tối đa 10 trang mỗi lượt, giữ nguyên id.",
					route: "mcp-ghi-phan-tich",
					input: KHUON_GHI,
					destructive: false,
				},
				rada_xong_phan_tich: {
					description:
						"Rada SEO: báo đã đọc xong đêm nay — máy chủ tính lại danh sách khoảng trống nội dung và ghi nhật ký.",
					route: "mcp-xong-phan-tich",
					input: KHUON_RONG,
					destructive: false,
				},
			},
		},
	});
}
```

`cms/src/plugins/rada-seo/admin.jsx`:

```jsx
// Màn điều khiển Rada SEO trong /_emdash/admin/plugins/rada-seo/rada.
// Chỉ HIỂN THỊ và gọi route của plugin; mọi luật nằm phía máy chủ.
import { useCallback, useEffect, useState } from "react";

async function goi(route, body) {
	const res = await fetch(`/_emdash/api/plugins/rada-seo/${route}`, {
		method: "POST",
		credentials: "same-origin",
		// X-EmDash-Request là thứ CHỊU LỰC: thiếu nó production trả 403 CSRF_REJECTED.
		headers: { "Content-Type": "application/json", "X-EmDash-Request": "1" },
		body: JSON.stringify(body ?? {}),
	});
	const j = await res.json().catch(() => null);
	if (!res.ok || j?.success === false) throw new Error(j?.error?.message ?? `Lỗi ${res.status}`);
	return j?.data ?? j;
}

const NHAN_CUM = { cho_viet: "Chờ viết", co_nhap: "Có nháp", da_dang: "Đã đăng", bo_qua: "Bỏ qua", phu_boi_tu_dien: "Từ điển đã phủ" };
const gio = (s) => (s ? new Date(s).toLocaleString("vi-VN") : "—");
const o = { padding: "6px 8px", borderBottom: "1px solid #e5e5e5", textAlign: "left", verticalAlign: "top" };

function RadaSeo() {
	const [dl, setDl] = useState(null);
	const [loi, setLoi] = useState("");
	const [form, setForm] = useState({ tenMien: "", ten: "", laCuaMinh: false });

	const tai = useCallback(() => goi("tong-quan").then((d) => { setDl(d); setLoi(""); }, (e) => setLoi(e.message)), []);
	useEffect(() => {
		tai();
	}, [tai]);
	const lam = (route, body) => goi(route, body).then(tai, (e) => setLoi(e.message));

	if (!dl) return <div style={{ padding: 24 }}>{loi || "Đang tải…"}</div>;
	const lichRadar = dl.lich.find((l) => l.name === "radar");
	return (
		<div style={{ padding: 24, maxWidth: 1200 }}>
			<h1>Rada SEO</h1>
			{loi && <p style={{ color: "#b91c1c" }}>{loi}</p>}
			{dl.canhBaoCaDem && <p style={{ color: "#b91c1c", fontWeight: 600 }}>⚠ Hơn 26 giờ chưa có ca radar thành công — xem nhật ký bên dưới.</p>}
			{dl.canhBaoClaude && (
				<p style={{ color: "#b91c1c", fontWeight: 600 }}>
					⚠ {dl.choAi} trang chờ Claude đọc mà 26 giờ qua Claude chưa đọc trang nào — kiểm tra routine đêm và connector MCP trong claude.ai (có thể đã mất đăng nhập).
				</p>
			)}
			{!dl.caDemBat && <p style={{ color: "#92400e" }}>Máy này không bật RADA_SEO_CA_DEM: chỉ chạy thử được, ca đêm thật chạy trên VPS.</p>}
			<p>
				{/* Cron dò MỖI GIỜ và chỉ chạy ca ở tick 19:30 UTC (xem LICH_RADAR) → nextRunAt là tick kế, không phải ca kế. */}
				Lịch đêm: {lichRadar ? `02:30 hằng ngày (cron dò mỗi giờ) · tick kế ${gio(lichRadar.nextRunAt)} · tick trước ${gio(lichRadar.lastRunAt)}` : "chưa bật"}{" "}
				<button onClick={() => lam("lich-bat")}>{lichRadar ? "Hẹn lại" : "Bật lịch"}</button>{" "}
				<button disabled={dl.dangChay} onClick={() => lam("ca-chay", { ghi: false }).then(() => setTimeout(tai, 2000))}>Chạy thử</button>{" "}
				<button disabled={dl.dangChay || !dl.caDemBat} onClick={() => lam("ca-chay", { ghi: true }).then(() => setTimeout(tai, 2000))}>Chạy thật</button>{" "}
				{dl.dangChay && "· đang chạy…"} <button onClick={tai}>Tải lại</button>
			</p>

			<h2>Đối thủ</h2>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					lam("doi-thu-luu", form).then(() => setForm({ tenMien: "", ten: "", laCuaMinh: false }));
				}}
			>
				<input placeholder="tên miền, vd vinmec.com" value={form.tenMien} onChange={(e) => setForm({ ...form, tenMien: e.target.value })} />{" "}
				<input placeholder="tên hiển thị" value={form.ten} onChange={(e) => setForm({ ...form, ten: e.target.value })} />{" "}
				<label>
					<input type="checkbox" checked={form.laCuaMinh} onChange={(e) => setForm({ ...form, laCuaMinh: e.target.checked })} /> site của mình
				</label>{" "}
				<button type="submit">Lưu</button>
			</form>
			<table style={{ borderCollapse: "collapse", width: "100%", marginTop: 8 }}>
				<thead>
					<tr><th style={o}>Tên miền</th><th style={o}>Chờ trích</th><th style={o}>Chờ Claude</th><th style={o}>Đã phân tích</th><th style={o}>Ngoài ngành</th><th style={o}>Lỗi</th><th style={o}></th></tr>
				</thead>
				<tbody>
					{dl.doiThu.map((d) => (
						<tr key={d.id}>
							<td style={o}>{d.ten} {d.laCuaMinh && <b>(của mình)</b>}</td>
							<td style={o}>{d.dem.cho}</td><td style={o}>{d.dem.cho_ai}</td><td style={o}>{d.dem.da_phan_tich}</td><td style={o}>{d.dem.ngoai_nganh}</td><td style={o}>{d.dem.loi}</td>
							<td style={o}>
									{d.dem.loi > 0 && <button onClick={() => lam("url-dat-lai", { tenMien: d.id })}>Thử lại URL lỗi</button>}{" "}
									<button onClick={() => confirm(`Xoá ${d.id} và mọi URL của nó?`) && lam("doi-thu-xoa", { tenMien: d.id })}>Xoá</button>
								</td>
						</tr>
					))}
				</tbody>
			</table>

			<h2>Khoảng trống ({dl.cum.length})</h2>
			<table style={{ borderCollapse: "collapse", width: "100%" }}>
				<thead>
					<tr><th style={o}>Điểm</th><th style={o}>Cụm chủ đề</th><th style={o}>Từ khoá</th><th style={o}>Đối thủ / bài</th><th style={o}>Trạng thái</th><th style={o}></th></tr>
				</thead>
				<tbody>
					{dl.cum.map((c) => (
						<tr key={c.id} style={{ opacity: c.trangThai === "bo_qua" ? 0.5 : 1 }}>
							<td style={o}>{c.diem}{c.coXuHuong && " 📈"}{c.viPham && " ⚠"}</td>
							<td style={o}>{c.tenCum}</td>
							<td style={o}>{(c.tuKhoa ?? []).join(", ")}</td>
							<td style={o}>{c.soDoiThu} / {c.soBai}</td>
							<td style={o}>{NHAN_CUM[c.trangThai] ?? c.trangThai}</td>
							<td style={o}>
								{c.trangThai === "cho_viet" && <button onClick={() => lam("cum-trang-thai", { id: c.id, trangThai: "bo_qua" })}>Bỏ qua</button>}
								{c.trangThai === "bo_qua" && <button onClick={() => lam("cum-trang-thai", { id: c.id, trangThai: "cho_viet" })}>Khôi phục</button>}
							</td>
						</tr>
					))}
				</tbody>
			</table>
			<p style={{ fontSize: 12, color: "#666" }}>📈 trúng xu hướng tìm kiếm · ⚠ nghiêng chữa trị / hứa kết quả (bị trừ điểm)</p>

			<h2>Nhật ký ca</h2>
			<table style={{ borderCollapse: "collapse", width: "100%" }}>
				<thead>
					<tr><th style={o}>Bắt đầu</th><th style={o}>Ca</th><th style={o}>URL mới</th><th style={o}>Trích / Claude đọc</th><th style={o}>Ngoài ngành</th><th style={o}>Cụm</th><th style={o}>Lỗi</th></tr>
				</thead>
				<tbody>
					{dl.ca.map((c) => (
						<tr key={c.batDau}>
							<td style={o}>{gio(c.batDau)}</td><td style={o}>{c.loai === "claude" ? "Claude đọc" : c.ghi ? "radar" : "radar (thử)"}</td>
							<td style={o}>{c.soUrlMoi ?? "—"}</td><td style={o}>{c.loai === "claude" ? c.soDoc : c.soTrich ?? "—"}</td><td style={o}>{c.soNgoaiNganh ?? "—"}</td>
							<td style={o}>{c.soCum ?? "—"}</td>
							<td style={{ ...o, color: "#b91c1c" }}>{(c.loi ?? []).join(" · ")}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

export const pages = { "/rada": RadaSeo };
```

Rồi (trong `cms/`): `git rm -q src/plugins/rada-seo/lib/claude.mjs src/plugins/rada-seo/lib/claude.test.mjs src/plugins/rada-seo/radar/phan-tich.mjs` và `npm uninstall @anthropic-ai/sdk`. Kiểm: `grep -rn "anthropic\|ANTHROPIC\|lib/claude\|phan-tich" src/plugins/rada-seo` → không còn dòng nào ngoài chú thích lịch sử trong `mcp-viec.mjs`/`loi-dan.mjs` (nếu có). `git diff --stat -- package.json package-lock.json` chỉ gỡ sdk.

- [ ] **Step 4: Chạy, xác nhận đạt + nạp module thật**

Run: `node --test "src/plugins/rada-seo/**/*.test.mjs"` → `pass 65`, `fail 0`.
Run: `node -e "import('./src/plugins/rada-seo/plugin.mjs').then(m=>{const p=m.createPlugin();console.log(p.id,Object.keys(p.routes).join(','),Object.keys(p.mcp.tools).join(','))})"`
Expected: `rada-seo tong-quan,doi-thu-luu,doi-thu-xoa,url-dat-lai,cum-trang-thai,lich-bat,mcp-lay-viec,mcp-ghi-phan-tich,mcp-xong-phan-tich,ca-chay rada_lay_viec,rada_ghi_phan_tich,rada_xong_phan_tich`

- [ ] **Step 5: Commit**

```bash
git add -A cms/src/plugins/rada-seo/ && git add cms/package.json cms/package-lock.json
git commit -m "feat(rada-seo): ba công cụ MCP cho Claude đọc trang, trần 40 trang/đêm; gỡ SDK Anthropic" -- cms/src/plugins/rada-seo/ cms/package.json cms/package-lock.json
```

---

### Task 3: nginx cho OAuth, lời dặn routine, hướng dẫn deploy

**Files:**
- Modify: `frontend/nginx.conf` — chèn khối dưới NGAY TRƯỚC dòng `    # ---- CMS: khu quản trị, API và ảnh của EmDash ----`
- Create: `cms/src/plugins/rada-seo/routine/dem-doc-doi-thu.md`
- Modify: `DEPLOYMENT.md` — thay TOÀN BỘ mục `## Rada SEO (plugin CMS)` (từ tiêu đề đó tới hết dòng `---` ngay trước `## 9. Vận hành thường ngày`) bằng toàn văn dưới
- Modify: `cms/.env.example` — xoá 5 dòng khối "Rada SEO — Claude Haiku…" (`ANTHROPIC_API_KEY`, `RADA_SEO_TRAN_LUOT`), giữ lại dạng: `# Rada SEO — số trang trích mỗi đối thủ mỗi đêm (mặc định 30).` + `# RADA_SEO_TRAN_MOI_DOI_THU=30`

- [ ] **Step 1: Khối nginx**

```nginx
    # ---- OAuth của EmDash cho connector MCP (claude.ai → Rada SEO) ----
    # Máy khách MCP tìm máy chủ cấp quyền ở /.well-known/oauth-protected-resource[/…] và
    # /.well-known/oauth-authorization-server[/…] TẠI GỐC tên miền (RFC 9728 / RFC 8414), không
    # nằm dưới /_emdash/. Thiếu khối này, try_files trả index.html của SPA với mã 200 → connector
    # báo "không đăng nhập được" mà không nói vì sao. Endpoint MCP (/_emdash/api/mcp) và trang
    # đồng ý OAuth thì đã đi qua khối /_emdash/ ở trên.
    location ^~ /.well-known/oauth- {
        proxy_cache off;
        proxy_pass         http://kinhlac_cms;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }

```

Kiểm cú pháp không cần máy chủ: `grep -n "location ^~ /.well-known/oauth-" frontend/nginx.conf` ra đúng 1 dòng, nằm trước `location ^~ /_emdash/`.

- [ ] **Step 2: Lời dặn routine**

`cms/src/plugins/rada-seo/routine/dem-doc-doi-thu.md`:

```markdown
# Lời dặn cho routine đêm "Rada SEO — đọc trang đối thủ"

Dán nguyên phần trong khung dưới vào ô prompt khi tạo routine ở claude.ai/code/routines.
Lịch: mỗi ngày **03:00** giờ Việt Nam (sau ca radar 02:30 của máy chủ). Connector: chỉ để
**Kinh Lạc CMS** (`https://kinhlac.online/_emdash/api/mcp`), bỏ chọn các connector khác.

Cách đọc từng trang KHÔNG nằm ở đây mà do máy chủ trả về trong `huongDan` của `rada_lay_viec`
— sửa cách đọc thì sửa `cms/src/plugins/rada-seo/loi-dan.mjs`, không phải sửa routine.

```text
Bạn đang chạy ca đêm "đọc trang đối thủ" cho Rada SEO của kinhlac.online, qua connector MCP
"Kinh Lạc CMS". Tên công cụ có thể mang tiền tố của connector; tìm công cụ có tên kết thúc
bằng rada_lay_viec, rada_ghi_phan_tich, rada_xong_phan_tich.

Làm lặp:
1. Gọi rada_lay_viec (soTrang = 10). Đọc boiCanh và huongDan trong kết quả — đó là quy tắc.
2. Nếu mảng "trang" rỗng: sang bước 4.
3. Đọc từng trang theo huongDan, rồi gọi rada_ghi_phan_tich MỘT lần cho cả lượt, giữ nguyên
   "id" của từng trang. Quay lại bước 1.
4. Gọi rada_xong_phan_tich đúng MỘT lần. Kết thúc, báo lại: số trang đã đọc (soDocDemNay),
   số cụm khoảng trống (soCum), số trang còn chờ (conTrongHangCho), và lỗi nếu có.

Luật:
- CHỈ dùng ba công cụ trên. KHÔNG tạo, sửa, xoá hay đăng bài; KHÔNG gọi công cụ content_* hay
  media_* nào.
- Không bịa: trang mỏng thì suy từ tiêu đề và mô tả; không thêm số liệu không có trong trang.
- Công cụ trả lỗi: thử lại lượt đó MỘT lần; vẫn lỗi thì bỏ qua lượt đó, vẫn gọi
  rada_xong_phan_tich ở cuối, và ghi lỗi vào báo cáo.
- Máy chủ giới hạn 40 trang mỗi đêm; khi rada_lay_viec trả rỗng là đã xong, đừng cố lấy thêm.
```

## Khi routine báo lỗi đăng nhập

Màn Rada SEO sẽ báo đỏ "26 giờ qua Claude chưa đọc trang nào". Vào claude.ai → Settings →
Connectors → Kinh Lạc CMS → kết nối lại (đăng nhập bằng tài khoản CMS vai **contributor**
dành riêng cho Claude). Nếu việc này lặp lại mỗi vài ngày, token OAuth không tự làm mới khi
không có người — chuyển sang đường lùi bằng khoá `ec_pat_` (xem `DEPLOYMENT.md`, mục Rada SEO).
```

- [ ] **Step 3: DEPLOYMENT.md**

Mục mới (toàn văn):

```markdown
## Rada SEO (plugin CMS)

Plugin `cms/src/plugins/rada-seo/` quét sitemap đối thủ mỗi đêm 02:30 giờ VN và **trích sẵn
chữ** các bài mới. Việc ĐỌC hiểu do **Claude trong tài khoản claude.ai của chủ site** làm qua
MCP (routine 03:00), không có khoá API nào. Kết quả hiện ở mục **Rada SEO** trong khu quản trị.

**Biến môi trường — đặt đúng chỗ:**

- `RADA_SEO_CA_DEM: "1"` và `TZ: UTC` → **`docker-compose.yml`**, KHÔNG phải `cms/.env`:
  tệp `.env` được chép qua lại máy dev, mà chỉ VPS được phép chạy ca đêm (bảng cron nằm
  trong kho CMS dùng chung).
- `RADA_SEO_TRAN_MOI_DOI_THU` (số trang trích mỗi đối thủ mỗi đêm, mặc định 30) → `cms/.env`.
- **Không còn** `ANTHROPIC_API_KEY` (bỏ 30/09/2026). Ai thấy biến này ở `cms/.env` thì xoá.

**Sau lần deploy đầu — theo đúng thứ tự:**

1. Kiểm OAuth tới được CMS: `curl -s https://kinhlac.online/.well-known/oauth-protected-resource/_emdash/api/mcp`
   phải ra JSON (không phải HTML của SPA). Ra HTML là khối nginx `/.well-known/oauth-` chưa
   vào bản đang chạy.
2. `/_emdash/admin` → **Rada SEO** → **"Bật lịch"**; thêm site của mình (tick **"site của
   mình"**) và các đối thủ; bấm **"Chạy thật"** một lần, đọc Nhật ký ca: cột "Trích" > 0.
3. Bật công cụ MCP của plugin: `/_emdash/admin` → Plugins → Rada SEO → bật **MCP tools**
   (API: `PUT /_emdash/api/admin/plugins/rada-seo/mcp {"enabled":true}`, quyền quản trị).
4. Tạo **tài khoản CMS riêng cho Claude, vai CONTRIBUTOR** (bậc 20). KHÔNG dùng vai author:
   author tự đăng được bài của chính mình (`content:publish_own`). Contributor tạo nháp được,
   không đăng được, không sửa được — "chỉ người duyệt bấm Publish" do CMS giữ.
5. claude.ai → Settings → Connectors → thêm connector tuỳ chỉnh
   `https://kinhlac.online/_emdash/api/mcp`, đăng nhập bằng tài khoản ở bước 4.
6. claude.ai/code/routines → routine mới, lịch 03:00 giờ VN, CHỈ chọn connector ở bước 5,
   prompt dán từ `cms/src/plugins/rada-seo/routine/dem-doc-doi-thu.md`. Bấm "Run now" một
   lần và đọc Nhật ký ca: phải có dòng "Claude đọc".
7. **Theo dõi 2 đêm liền.** Dải đỏ "26 giờ qua Claude chưa đọc trang nào" = routine không
   chạy HOẶC connector mất đăng nhập. Tài liệu Anthropic KHÔNG bảo đảm token OAuth tự làm mới
   khi không có người; nếu phải đăng nhập lại mỗi vài ngày → chuyển sang khoá `ec_pat_`
   (tạo cho tài khoản contributor, scope `mcp:tools:rada-seo`) khai trong `.mcp.json` của
   routine, và mở `kinhlac.online` trong danh sách tên miền của môi trường routine.

**Đừng:**

- **Đừng bấm "Chạy thử"/"Chạy thật" từ máy lập trình** khi VPS có thể đang chạy ca: khoá
  chống chạy chồng nằm trong kho dùng chung.
- Hai dải đỏ "26 giờ" là BÌNH THƯỜNG cho tới khi ca radar và lượt Claude đầu tiên chạy xong.

URL bị đánh dấu lỗi (trang chặn tạm, mạng chập) không tự thử lại; dùng nút **"Thử lại URL
lỗi"** ở dòng đối thủ. Máy chủ giao cho Claude tối đa **40 trang mỗi đêm** — trần giữ hạn
mức gói Claude, nằm ở `cms/src/plugins/rada-seo/mcp-viec.mjs`.

---
```

- [ ] **Step 4: Commit**

```bash
git add frontend/nginx.conf cms/src/plugins/rada-seo/routine/dem-doc-doi-thu.md DEPLOYMENT.md cms/.env.example
git commit -m "docs(rada-seo): nginx chuyển OAuth sang CMS, lời dặn routine đêm, hướng dẫn nối Claude qua MCP" -- frontend/nginx.conf cms/src/plugins/rada-seo/routine/dem-doc-doi-thu.md DEPLOYMENT.md cms/.env.example
```

---

### Task 4: Nghiệm thu MCP trên bàn thử

**Files:**
- Create: `docs/superpowers/plans/2026-09-30-rada-seo-nghiem-thu-2b1.md`
- Có thể sửa: `DEPLOYMENT.md`, `cms/src/plugins/rada-seo/routine/dem-doc-doi-thu.md` — CHỈ để thay đường dẫn/tên công cụ bằng giá trị ĐO được (vd đường `.well-known` thật, tiền tố tên công cụ MCP thật).
- Tạm (xoá cuối task): `cms/astro.config.thu.mjs`, `cms/dist-thu/`

- [ ] **Step 1: Dựng bàn thử** theo công thức bước 0 (libsql, `PGHOST` chết, `PORT=4399`, `RADA_SEO_CA_DEM=1 TZ=UTC RADA_SEO_TRAN_MOI_DOI_THU=4`), đăng nhập SSO, đánh dấu setup xong. Thêm `kinhlac.online` (của mình) và `benhvienyhoccotruyentrunguong.vn`; "Chạy thật" (`ca-chay {"ghi":true}`), chờ xong. Expected: nhật ký ca radar `soTrich > 0`, `tong-quan.choAi > 0`, `canhBaoClaude = true`.

- [ ] **Step 2: Bật công cụ MCP** — `PUT /_emdash/api/admin/plugins/rada-seo/mcp {"enabled":true}` (cookie + `X-EmDash-Request: 1`). Expected: `data.enabled = true`, `data.tools` có 3 công cụ.

- [ ] **Step 3: Khoá truy cập cho MCP** — tạo khoá qua `POST /_emdash/api/admin/api-tokens` (đọc `node_modules/emdash/dist/astro/routes/api/admin/api-tokens/index.mjs` để biết khuôn body) với scopes `["mcp:tools:rada-seo", "content:read"]`. Ghi lại khuôn body đã dùng. KHÔNG in giá trị khoá vào tệp nào.

- [ ] **Step 4: Đi trọn vòng MCP bằng HTTP** tới `http://localhost:4399/_emdash/api/mcp` với `Authorization: Bearer <khoá>` (JSON-RPC 2.0, transport streamable HTTP; header `Accept: application/json, text/event-stream`): `initialize` → `tools/list` (ghi TÊN THẬT của 3 công cụ, kể cả tiền tố) → `tools/call rada_lay_viec {soTrang:3}` (3 trang, có `chu`, `boiCanh`, `huongDan`) → `tools/call rada_ghi_phan_tich` với kết quả GIẢ ghi rõ "[BÀN THỬ]" trong `chuDe` cho đúng các id vừa nhận → `tools/call rada_xong_phan_tich`. Expected: `daGhi = 3`; nhật ký có dòng "Claude đọc" `soDoc = 3`; `tong-quan.canhBaoClaude = false`.

- [ ] **Step 5: Trần và quyền**
  - Gọi `rada_lay_viec` tới khi rỗng: tổng số trang giao ≤ 40 và `conLaiDemNay` về 0 (nếu hàng chờ < 40, ghi số thật).
  - `tools/call rada_ghi_phan_tich` với 11 mục → bị từ chối bởi khuôn.
  - Khoá chỉ có scope `content:read` (không `mcp:tools…`) → `tools/list` không có công cụ rada hoặc bị 403; ghi nguyên văn.
  - `tools/list` với khoá có `mcp:tools:rada-seo`: có hay không các công cụ `content_*` lõi — ghi lại (quyết định cách khoá tài khoản contributor ở 2B-2).

- [ ] **Step 6: OAuth metadata** — `curl -s http://localhost:4399/.well-known/oauth-protected-resource` và các biến thể có hậu tố `/_emdash/api/mcp`, `/.well-known/oauth-authorization-server/_emdash`: ghi đường nào ra JSON, trường `authorization_servers`, `registration_endpoint`. Sửa `DEPLOYMENT.md` bước 1 cho đúng đường đo được. Ghi chú: trên bàn thử origin là `http://localhost:4399`; trên VPS là `EMDASH_SITE_URL`.

- [ ] **Step 7: Màn điều khiển** — Playwright chụp `/_emdash/admin/plugins/rada-seo/rada`, tự mở ảnh: cột "Chờ Claude", nhật ký có dòng "Claude đọc", không còn dải đỏ Claude.

- [ ] **Step 8: Ghi kết quả, dọn, commit** — `docs/superpowers/plans/2026-09-30-rada-seo-nghiem-thu-2b1.md` (bảng ĐẠT/TRƯỢT/CHƯA ĐO từng bước, nguyên văn tên công cụ, khuôn body khoá, đường `.well-known` thật). Dừng server, xoá tệp tạm, `npx astro sync` → `migrations.json` về `"type": "postgres"`, `git status` sạch.

```bash
git add docs/superpowers/plans/2026-09-30-rada-seo-nghiem-thu-2b1.md
git commit -m "docs(rada-seo): nghiệm thu 2B-1 — trọn vòng MCP trên bàn thử" -- docs/superpowers/plans/2026-09-30-rada-seo-nghiem-thu-2b1.md DEPLOYMENT.md cms/src/plugins/rada-seo/routine/dem-doc-doi-thu.md
```

---

## Sau kế hoạch này

- **Người dùng làm (không tự động được):** deploy; tạo tài khoản contributor cho Claude; thêm connector trong claude.ai; tạo routine 03:00 theo `routine/dem-doc-doi-thu.md`; theo dõi 2 đêm (dải đỏ "26 giờ Claude chưa đọc").
- **Kế hoạch 2B-2 — lò viết:** công cụ `rada_lay_de_tai` / `rada_nop_bai`, hook `content:beforeSave` chấm mọi đường ghi `bai_viet`, ảnh thật từ thư viện, phiếu chấm `editorPanels`, IndexNow khi đăng, vá lỗ "thăm khám" trong bộ luật phạm vi Y sỹ, chuẩn `chuanUrl` (query/www) trước khi làm rào chặn nguồn.
