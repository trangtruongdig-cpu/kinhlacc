# Rada SEO plugin — Kế hoạch 2A: radar tự hành mỗi đêm

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Plugin native `rada-seo` trong CMS tự quét sitemap đối thủ mỗi đêm, dùng Claude Haiku phân tích từng trang, tìm khoảng trống nội dung bằng luật, và hiện tất cả trên màn `/_emdash/admin/plugins/rada-seo/rada`.

**Architecture:** Đặc tả `docs/superpowers/specs/2026-09-30-radar-lo-viet-plugin-cms-design.md` (mục "Nguồn AI" và "Chọn khoảng trống"). Mọi logic là ES module thuần, nhận phụ thuộc qua tham số (`s` = storage, `docWeb`, `claude`) nên kiểm được bằng `node --test` với kho giả. `plugin.mjs` chỉ là lớp nối EmDash. Dạng đăng ký plugin theo tệp kết quả bước 0 `docs/superpowers/plans/2026-09-30-rada-seo-ket-qua-buoc-0.md`. Kế hoạch 2B (lò viết qua Claude Code) và 3 (chuyển `/blog/`, di chuyển dữ liệu) viết sau.

**Tech Stack:** EmDash 0.39.1 plugin native, Node ≥22, `@anthropic-ai/sdk` 0.129.0 + `zod` 4.6.5 (đầu ra có cấu trúc), `node:test`, React 19 cho màn điều khiển.

## Global Constraints

- Model phân tích trang: **`claude-haiku-4-5`** (người dùng chốt Haiku cho việc số lượng lớn). Gọi qua `client.messages.parse` + `output_config.format: zodOutputFormat(...)`. Timeout 60 000 ms, `maxRetries: 1`.
- Ngân sách tính bằng **số lượt gọi, trừ TRƯỚC khi gọi, lượt hỏng vẫn tính**. `RADA_SEO_TRAN_LUOT` mặc định 200, `RADA_SEO_TRAN_MOI_DOI_THU` mặc định 30.
- **Công tắc chỉ VPS:** cron chỉ chạy ca khi `RADA_SEO_CA_DEM=1`; biến này khai trong `docker-compose.yml`, KHÔNG trong `cms/.env`.
- Lịch radar `30 19 * * *` (UTC) = 02:30 giờ Việt Nam. Hẹn qua route, vì `plugin:install` không chạy với plugin khai trong config.
- Chạy tay mặc định **chạy thử**: chỉ quét + đếm, không gọi Claude, không ghi URL/cụm; vẫn ghi nhật ký ca.
- Chống SSRF hai lớp: `urlDocDuoc` (chỉ http(s), không IP, không localhost, phải có dấu chấm) và `cungTenMien` (chỉ URL cùng tên miền đối thủ đã khai).
- Nghỉ `NGHI_GIUA_LUOT_MS = 300` giữa các lượt phân tích.
- Đăng ký plugin bằng **descriptor native**: `entrypoint` tuyệt đối, `adminEntry: "/src/plugins/rada-seo/admin.jsx"`, module xuất `createPlugin()`.
- Mọi fetch từ màn điều khiển gửi `X-EmDash-Request: 1` (thiếu là 403 CSRF trên production).
- Không đo trên CMS thật: nghiệm thu dùng **bàn thử** (cấu hình thay thế + libsql + `PGHOST` chết) theo công thức trong tệp kết quả bước 0. Không `npm run build` trong `cms/` (ghi đè `cms/dist` của phiên khác); sau build thử phải `npx astro sync`.
- Mọi chữ hiển thị tuân bảng từ phạm vi Y sỹ.
- Commit chỉ tệp của mình (`git commit -m … -- <paths>`); repo có nhiều phiên cùng làm. Trailer commit: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Lệnh chạy phép kiểm (trong `cms/`): `node --test "src/plugins/rada-seo/**/*.test.mjs"` (Node 26 không nhận đường dẫn thư mục).

---

### Task 1: Đọc web an toàn + gọi Claude có ngân sách

**Files:**
- Modify: `cms/package.json`, `cms/package-lock.json` (thêm `@anthropic-ai/sdk`, `zod`)
- Create: `cms/src/plugins/rada-seo/lib/doc-web.mjs`, `cms/src/plugins/rada-seo/lib/claude.mjs`
- Test: `cms/src/plugins/rada-seo/lib/doc-web.test.mjs`, `cms/src/plugins/rada-seo/lib/claude.test.mjs`

**Interfaces:**
- Produces: `urlDocDuoc(url): boolean`, `voiHanGio(promise, ms, tenViec): Promise`, `taoDocWeb(fetchFn, {hanGioMs?}): (url) => Promise<string>` (không bao giờ ném; "" khi hỏng) — doc-web.mjs.
  `MODEL_SANG = "claude-haiku-4-5"`, `class HetNganSach extends Error`, `taoNganSach(tran): {dung(), daDung, tran}`, `taoClientThat(): Anthropic`, `taoClaude({client, nganSach, model?}): {traJson(system, user, khuonZod, maxTokens): Promise<object>}` — claude.mjs.

- [ ] **Step 1: Cài gói**

Run (trong `cms/`): `npm i @anthropic-ai/sdk@0.129.0 zod@4.6.5`
Expected: `package.json` có hai dòng mới trong `dependencies`. `git diff --stat` chỉ đổi `package.json` và `package-lock.json`.

- [ ] **Step 2: Viết phép kiểm (thất bại)**

`cms/src/plugins/rada-seo/lib/doc-web.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { urlDocDuoc, taoDocWeb, voiHanGio } from "./doc-web.mjs";

test("urlDocDuoc chặn đường vào mạng nội bộ", () => {
	assert.equal(urlDocDuoc("https://www.vinmec.com/a"), true);
	for (const u of ["http://backend:3000/x", "http://localhost/x", "http://127.0.0.1/x", "http://[::1]/x", "ftp://a.com/x", "rác"])
		assert.equal(urlDocDuoc(u), false, u);
});

test("taoDocWeb: trả chữ khi 200, rỗng khi lỗi/không 2xx/URL cấm, không bao giờ ném", async () => {
	const goi = [];
	const fetchGia = async (url) => {
		goi.push(url);
		if (url.includes("hong")) throw new Error("mạng");
		return new Response(url.includes("404") ? "x" : "chào", { status: url.includes("404") ? 404 : 200 });
	};
	const doc = taoDocWeb(fetchGia);
	assert.equal(await doc("https://a.com/ok"), "chào");
	assert.equal(await doc("https://a.com/404"), "");
	assert.equal(await doc("https://a.com/hong"), "");
	assert.equal(await doc("http://backend:3000/"), "");
	assert.deepEqual(goi, ["https://a.com/ok", "https://a.com/404", "https://a.com/hong"]);
});

test("voiHanGio ném khi quá hạn", async () => {
	await assert.rejects(voiHanGio(new Promise(() => {}), 20, "thử"), /thử quá hạn 20ms/);
});
```

`cms/src/plugins/rada-seo/lib/claude.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { taoClaude, taoNganSach, HetNganSach, MODEL_SANG } from "./claude.mjs";

const KHUON = z.object({ a: z.string() });

function clientGia(tra) {
	const goi = [];
	return { goi, messages: { parse: async (req) => { goi.push(req); return typeof tra === "function" ? tra(req) : tra; } } };
}

test("gửi đúng model Haiku, khuôn json_schema, và trả parsed_output", async () => {
	const c = clientGia({ stop_reason: "end_turn", parsed_output: { a: "x" } });
	const claude = taoClaude({ client: c, nganSach: taoNganSach(5) });
	assert.deepEqual(await claude.traJson("hệ", "người", KHUON, 800), { a: "x" });
	assert.equal(c.goi[0].model, MODEL_SANG);
	assert.equal(c.goi[0].model, "claude-haiku-4-5");
	assert.equal(c.goi[0].max_tokens, 800);
	assert.equal(c.goi[0].output_config.format.type, "json_schema");
});

test("ngân sách trừ TRƯỚC khi gọi — lượt hỏng vẫn tính, hết thì ném HetNganSach", async () => {
	const ns = taoNganSach(2);
	const c = clientGia(() => { throw new Error("529 quá tải"); });
	const claude = taoClaude({ client: c, nganSach: ns });
	await assert.rejects(claude.traJson("", "", KHUON, 10), /529/);
	await assert.rejects(claude.traJson("", "", KHUON, 10), /529/);
	await assert.rejects(claude.traJson("", "", KHUON, 10), HetNganSach);
	assert.equal(ns.daDung, 2);
	assert.equal(c.goi.length, 2);
});

test("từ chối / bị cắt / không đúng khuôn đều ném lỗi rõ", async () => {
	for (const [tra, mau] of [
		[{ stop_reason: "refusal", parsed_output: null }, /từ chối/],
		[{ stop_reason: "max_tokens", parsed_output: null }, /max_tokens/],
		[{ stop_reason: "end_turn", parsed_output: null }, /đúng khuôn/],
	]) {
		const claude = taoClaude({ client: clientGia(tra), nganSach: taoNganSach(9) });
		await assert.rejects(claude.traJson("", "", KHUON, 10), mau);
	}
});
```

- [ ] **Step 3: Chạy, xác nhận thất bại**

Run: `node --test "src/plugins/rada-seo/lib/*.test.mjs"` → FAIL (module không có).

- [ ] **Step 4: Viết mã**

`cms/src/plugins/rada-seo/lib/doc-web.mjs`:

```js
// Đọc một trang web cho radar: có hạn giờ, không bao giờ ném lỗi (trả "" khi hỏng).
//
// CHỐNG SSRF: CMS chạy chung mạng docker với backend, nên sitemap của đối thủ mà trỏ tới
// http://backend:3000/… thì plugin sẽ gọi vào trong. Chỉ cho phép http(s) tới tên miền có
// dấu chấm, không phải địa chỉ IP, không phải localhost. Radar còn chặn thêm một lớp: chỉ
// đọc URL cùng tên miền với đối thủ đã khai (xem sitemap.mjs).

const UA = "Mozilla/5.0 (compatible; KinhlacSEOBot/1.0; +https://kinhlac.online)";

/** true nếu URL được phép đọc. */
export function urlDocDuoc(url) {
	let u;
	try {
		u = new URL(url);
	} catch {
		return false;
	}
	if (u.protocol !== "http:" && u.protocol !== "https:") return false;
	const h = u.hostname.toLowerCase();
	if (!h.includes(".") || h === "localhost" || h.endsWith(".localhost")) return false;
	if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h) || h.startsWith("[")) return false;
	return true;
}

/** Chạy promise với hạn giờ; hết giờ thì ném lỗi "quá hạn". */
export function voiHanGio(promise, ms, tenViec = "yêu cầu") {
	let hen;
	const het = new Promise((_, reject) => {
		hen = setTimeout(() => reject(new Error(`${tenViec} quá hạn ${ms}ms`)), ms);
	});
	return Promise.race([promise, het]).finally(() => clearTimeout(hen));
}

/**
 * @param {(url: string, init?: RequestInit) => Promise<Response>} fetchFn  ctx.http.fetch
 * @returns {(url: string) => Promise<string>}
 */
export function taoDocWeb(fetchFn, { hanGioMs = 15_000 } = {}) {
	return async (url) => {
		if (!urlDocDuoc(url)) return "";
		try {
			const res = await voiHanGio(
				fetchFn(url, {
					redirect: "follow",
					headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" },
				}),
				hanGioMs,
				"tải trang",
			);
			if (!res.ok) return "";
			return await res.text();
		} catch {
			return "";
		}
	};
}
```

`cms/src/plugins/rada-seo/lib/claude.mjs`:

```js
// Gọi Claude qua SDK chính thức của Anthropic, cho các việc LẶP, SỐ LƯỢNG LỚN của radar
// (phân tích từng trang đối thủ). Việc cần chất lượng — chọn đề tài, viết bài — KHÔNG ở đây:
// Claude Code làm theo lịch (xem đặc tả, mục "Nguồn AI").
//
// NGÂN SÁCH tính bằng SỐ LƯỢT GỌI và trừ TRƯỚC khi gọi — lượt hỏng vẫn tính. Không đếm lượt
// hỏng thì một sự cố bên nhà cung cấp thành vòng gọi vô hạn (bài học của bot thẩm định).
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

/** Model cho việc sàng lọc số lượng lớn — người dùng chốt Haiku (30/09/2026). */
export const MODEL_SANG = "claude-haiku-4-5";

export class HetNganSach extends Error {
	constructor(tran) {
		super(`Hết ngân sách: đã dùng đủ ${tran} lượt gọi mô hình trong ca này`);
		this.name = "HetNganSach";
	}
}

/** @returns {{dung(): void, readonly daDung: number, readonly tran: number}} */
export function taoNganSach(tran) {
	let daDung = 0;
	return {
		dung() {
			if (daDung >= tran) throw new HetNganSach(tran);
			daDung++;
		},
		get daDung() {
			return daDung;
		},
		get tran() {
			return tran;
		},
	};
}

/**
 * Client thật. Đọc khoá lúc CHẠY (không ở tầng module: astro.config chạy lúc build nên biến
 * môi trường đọc ở tầng module có thể bị đóng băng vào bản dựng).
 */
export function taoClientThat() {
	const apiKey = process.env.ANTHROPIC_API_KEY;
	if (!apiKey) throw new Error("Thiếu ANTHROPIC_API_KEY — radar không gọi được Claude.");
	// Timeout khai tay + 1 lần thử lại: mặc định của SDK là 10 phút × 3 lượt.
	return new Anthropic({ apiKey, timeout: 60_000, maxRetries: 1 });
}

/**
 * @param {{client: {messages: {parse: Function}}, nganSach: ReturnType<typeof taoNganSach>, model?: string}} o
 */
export function taoClaude({ client, nganSach, model = MODEL_SANG }) {
	return {
		/** Trả object đã qua kiểm khuôn zod; ném lỗi khi từ chối, bị cắt, hay không đọc được. */
		async traJson(system, user, khuon, maxTokens) {
			nganSach.dung();
			const res = await client.messages.parse({
				model,
				max_tokens: maxTokens,
				system,
				messages: [{ role: "user", content: user }],
				output_config: { format: zodOutputFormat(khuon) },
			});
			if (res.stop_reason === "refusal") throw new Error("Claude từ chối trả lời trang này");
			if (res.stop_reason === "max_tokens") throw new Error("Câu trả lời bị cắt vì chạm max_tokens");
			if (!res.parsed_output) throw new Error("Claude không trả về JSON đúng khuôn");
			return res.parsed_output;
		},
	};
}
```

- [ ] **Step 5: Chạy, xác nhận đạt**

Run: `node --test "src/plugins/rada-seo/lib/*.test.mjs"` → `pass 6`, `fail 0`.

- [ ] **Step 6: Commit**

```bash
git add cms/package.json cms/package-lock.json cms/src/plugins/rada-seo/lib/
git commit -m "feat(rada-seo): đọc web chống SSRF, gọi Claude Haiku có ngân sách lượt" -- cms/package.json cms/package-lock.json cms/src/plugins/rada-seo/lib/
```

---

### Task 2: Radar — sitemap, trang, phân tích, xu hướng

**Files:**
- Create: `cms/src/plugins/rada-seo/__test__/kho-gia.mjs` (kho giả + `webGia`, dùng chung cho Task 2–5)
- Create: `cms/src/plugins/rada-seo/radar/sitemap.mjs`, `radar/trang.mjs`, `radar/phan-tich.mjs`, `radar/xu-huong.mjs`
- Test: `radar/sitemap.test.mjs`, `radar/phan-tich.test.mjs`, `radar/xu-huong.test.mjs`

**Interfaces:**
- Consumes: `boDau` (`luat/chuan-hoa.mjs`, kế hoạch 1).
- Produces: `TRAN_SITEMAP=15`, `TRAN_URL=300`, `layLoc(xml)`, `laSitemapIndex(xml)`, `chuanTenMien(s): string` ("" nếu không hợp lệ), `cungTenMien(url, tenMien)`, `laUrlNoiDung(url, tenMien)`, `thuThapUrl(tenMien, docWeb, {tranSitemap?, tranUrl?}): Promise<string[]>` — sitemap.mjs.
  `TRAN_KY_TU=5000`, `TU_DONG_Y`, `htmlSangChu(html): {tieuDe, moTa, than}`, `laDongY(vanBan)` — trang.mjs.
  `BOI_CANH`, `LOI_NHAC_TRICH`, `KHUON_TRICH` (zod), `phanTichTrang({url, docWeb, claude, epBuoc?}): Promise<{trangThai: 'da_phan_tich'|'ngoai_nganh'|'loi', chuDe?, tuKhoa?: string[], tomTat?: string[], loi?}>` — phan-tich.mjs.
  `HAT_GIONG`, `docGoiY(chu)`, `timXuHuong({docWeb, hatGiong?, tran?}): Promise<string[]>` — xu-huong.mjs.
  `taoBoSuuTap()`, `taoKhoGia(): {doi_thu, url, cum, ca}`, `webGia(bang)` — __test__/kho-gia.mjs.

Nguồn gốc: prompt, bộ lọc ngách, sitemap, xu hướng CHÉP từ `backend/src/controllers/seo.controller.ts` (BUSINESS_CONTEXT 48–52, EXTRACT 54–66, DONG_Y_TERMS 185–193, DEFAULT_TREND_SEEDS 163–174, collectUrlsFromSitemaps 799–827, htmlToText 2232–2254, googleSuggest 2004–2014). Khác bản cũ có chủ ý: thêm chặn cùng tên miền; lời nhắc bỏ phần quy định JSON vì khuôn zod lo; `tu_khoa`/`tom_tat` thành mảng.

- [ ] **Step 1: Viết kho giả**

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
```

- [ ] **Step 2: Viết phép kiểm (thất bại)**

`cms/src/plugins/rada-seo/radar/sitemap.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { layLoc, chuanTenMien, laUrlNoiDung, thuThapUrl } from "./sitemap.mjs";
import { webGia } from "../__test__/kho-gia.mjs";

test("chuanTenMien", () => {
	assert.equal(chuanTenMien("https://www.Vinmec.com/vi/"), "vinmec.com");
	assert.equal(chuanTenMien("nhathuoclongchau.com.vn"), "nhathuoclongchau.com.vn");
	assert.equal(chuanTenMien("khong co cham"), "");
});

test("layLoc giải mã thực thể XML", () => {
	assert.deepEqual(layLoc("<url><loc> https://a.com/x?a=1&amp;b=2 </loc></url>"), ["https://a.com/x?a=1&b=2"]);
});

test("laUrlNoiDung: bỏ trang chủ, tệp, và URL khác tên miền", () => {
	assert.equal(laUrlNoiDung("https://www.a.com/bai-1", "a.com"), true);
	assert.equal(laUrlNoiDung("https://a.com/", "a.com"), false);
	assert.equal(laUrlNoiDung("https://a.com/anh.jpg", "a.com"), false);
	assert.equal(laUrlNoiDung("https://b.com/bai", "a.com"), false);
});

test("thuThapUrl: robots → index → sitemap con; bỏ sitemap trỏ ra ngoài và .gz; khử trùng; có trần", async () => {
	const web = webGia({
		"https://a.com/robots.txt": "Sitemap: https://a.com/idx.xml\nSitemap: http://backend:3000/noi-bo.xml",
		"https://a.com/idx.xml": "<sitemapindex><sitemap><loc>https://a.com/s1.xml</loc></sitemap><sitemap><loc>https://evil.com/s.xml</loc></sitemap><sitemap><loc>https://a.com/s2.xml.gz</loc></sitemap></sitemapindex>",
		"https://a.com/s1.xml": "<urlset><url><loc>https://a.com/b1</loc></url><url><loc>https://a.com/b2</loc></url><url><loc>https://a.com/b1</loc></url><url><loc>https://a.com/</loc></url></urlset>",
		"https://a.com/sitemap.xml": "<urlset><url><loc>https://www.a.com/b3</loc></url></urlset>",
	});
	assert.deepEqual((await thuThapUrl("a.com", web)).sort(), ["https://a.com/b1", "https://a.com/b2", "https://www.a.com/b3"]);
	assert.equal((await thuThapUrl("a.com", web, { tranUrl: 2 })).length, 2);
});
```

`cms/src/plugins/rada-seo/radar/phan-tich.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { phanTichTrang } from "./phan-tich.mjs";
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

test("trang ngoài ngành: không gọi Claude, dù menu có chữ 'Đông y'", async () => {
	let goi = 0;
	const claude = { traJson: async () => { goi++; return {}; } };
	const kq = await phanTichTrang({ url: "https://b.vn/huyet-ap", docWeb: webGia({ "https://b.vn/huyet-ap": HTML_TAY }), claude });
	assert.deepEqual(kq, { trangThai: "ngoai_nganh" });
	assert.equal(goi, 0);
});

test("trang Đông y: gửi bối cảnh + nội dung, chuẩn hoá kết quả", async () => {
	let user = "";
	const claude = { traJson: async (_s, u, _k, max) => { user = u; assert.equal(max, 800); return { chu_de: " Bấm huyệt trị mất ngủ ", tu_khoa: ["bấm huyệt mất ngủ", " ", "huyệt thần môn"], tom_tat: ["a", "b"] }; } };
	const kq = await phanTichTrang({ url: "https://a.vn/x", docWeb: webGia({ "https://a.vn/x": HTML_DY }), claude });
	assert.deepEqual(kq, { trangThai: "da_phan_tich", chuDe: "Bấm huyệt trị mất ngủ", tuKhoa: ["bấm huyệt mất ngủ", "huyệt thần môn"], tomTat: ["a", "b"] });
	assert.ok(user.includes("Kinhlac") && user.includes("TIÊU ĐỀ: Bấm huyệt chữa mất ngủ"));
});

test("không tải được → lỗi, không gọi Claude", async () => {
	const kq = await phanTichTrang({ url: "https://a.vn/y", docWeb: webGia({}), claude: null });
	assert.equal(kq.trangThai, "loi");
});
```

`cms/src/plugins/rada-seo/radar/xu-huong.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { timXuHuong, docGoiY } from "./xu-huong.mjs";

test("docGoiY chịu được rác", () => {
	assert.deepEqual(docGoiY('["q",["a","b"]]'), ["a", "b"]);
	assert.deepEqual(docGoiY("<html>"), []);
});

test("timXuHuong khử trùng theo dạng bỏ dấu, có trần", async () => {
	const web = async (url) => (url.includes(encodeURIComponent("châm cứu")) ? '["x",["châm cứu là gì","CHÂM CỨU LÀ GÌ","cham cuu la gi"]]' : '["x",["bấm huyệt"]]');
	assert.deepEqual(await timXuHuong({ docWeb: web, hatGiong: ["châm cứu", "khác"] }), ["châm cứu là gì", "bấm huyệt"]);
	assert.equal((await timXuHuong({ docWeb: web, hatGiong: ["châm cứu"], tran: 1 })).length, 1);
});
```

- [ ] **Step 3: Chạy, xác nhận thất bại**

Run: `node --test "src/plugins/rada-seo/radar/*.test.mjs"` → FAIL.

- [ ] **Step 4: Viết mã**

`cms/src/plugins/rada-seo/radar/sitemap.mjs`:

```js
// Gom URL bài viết của một đối thủ từ sitemap (theo robots.txt + hai vị trí quen thuộc).
// Chỉ đọc URL CÙNG TÊN MIỀN với đối thủ đã khai — một sitemap trỏ ra ngoài không kéo được
// radar đi đọc nơi khác (lớp chống SSRF thứ hai, sau urlDocDuoc).

export const TRAN_SITEMAP = 15;
export const TRAN_URL = 300;

function giaiMaXml(s) {
	return s
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&(?:apos|#39);/g, "'");
}

/** Các giá trị <loc> trong một sitemap. */
export function layLoc(xml) {
	const ra = [];
	for (const m of String(xml ?? "").matchAll(/<loc>\s*([\s\S]*?)\s*<\/loc>/gi)) {
		const u = giaiMaXml(m[1].trim());
		if (u) ra.push(u);
	}
	return ra;
}

export function laSitemapIndex(xml) {
	return /<sitemapindex[\s>]/i.test(String(xml ?? ""));
}

/** "https://www.Vinmec.com/vi/" → "vinmec.com". Rỗng nếu không giống tên miền. */
export function chuanTenMien(s) {
	const h = String(s ?? "")
		.trim()
		.toLowerCase()
		.replace(/^[a-z]+:\/\//, "")
		.replace(/[/?#].*$/, "")
		.replace(/:\d+$/, "")
		.replace(/^www\./, "");
	return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(h) ? h : "";
}

/** URL có thuộc đúng tên miền này (kể cả www.) không. */
export function cungTenMien(url, tenMien) {
	try {
		return new URL(url).hostname.toLowerCase().replace(/^www\./, "") === tenMien;
	} catch {
		return false;
	}
}

/** Bỏ ảnh/tệp và trang chủ trần. */
export function laUrlNoiDung(url, tenMien) {
	if (!/^https?:\/\//i.test(url) || !cungTenMien(url, tenMien)) return false;
	if (/\.(jpe?g|png|gif|webp|svg|css|js|pdf|zip|rar|mp4|mp3|ico|xml|woff2?|ttf)(\?|$)/i.test(url)) return false;
	return new URL(url).pathname.replace(/\/+$/, "") !== "";
}

/**
 * @param {string} tenMien  đã qua chuanTenMien
 * @param {(url: string) => Promise<string>} docWeb
 * @returns {Promise<string[]>}
 */
export async function thuThapUrl(tenMien, docWeb, { tranSitemap = TRAN_SITEMAP, tranUrl = TRAN_URL } = {}) {
	const hang = [];
	const robots = await docWeb(`https://${tenMien}/robots.txt`);
	for (const m of robots.matchAll(/^\s*sitemap:\s*(\S+)/gim)) if (cungTenMien(m[1], tenMien)) hang.push(m[1].trim());
	hang.push(`https://${tenMien}/sitemap.xml`, `https://${tenMien}/sitemap_index.xml`);

	const daXem = new Set();
	const trang = new Set();
	let daDoc = 0;
	while (hang.length && daDoc < tranSitemap && trang.size < tranUrl) {
		const sm = hang.shift();
		if (daXem.has(sm) || /\.gz($|\?)/i.test(sm)) continue;
		daXem.add(sm);
		const xml = await docWeb(sm);
		daDoc++;
		if (!xml) continue;
		if (laSitemapIndex(xml)) {
			for (const loc of layLoc(xml)) if (cungTenMien(loc, tenMien) && !daXem.has(loc)) hang.push(loc);
		} else {
			for (const loc of layLoc(xml)) {
				if (laUrlNoiDung(loc, tenMien)) trang.add(loc);
				if (trang.size >= tranUrl) break;
			}
		}
	}
	return [...trang];
}
```

`cms/src/plugins/rada-seo/radar/trang.mjs`:

```js
// HTML → chữ, và bộ lọc ngách Đông Y (chép từ SeoService của app, 30/09/2026).
import { boDau } from "../luat/chuan-hoa.mjs";

export const TRAN_KY_TU = 5000;

// So khớp KHÔNG dấu. Tránh "huyet" trần (trùng "huyết áp" Tây Y) → chỉ cụm cụ thể.
export const TU_DONG_Y = [
	"dong y", "y hoc co truyen", "yhct", "co truyen",
	"kinh lac", "kinh mach", "duong kinh", "12 duong kinh", "tinh huyet",
	"cham cuu", "bam huyet", "an huyet", "huyet vi", "huyet dao", "xoa bop",
	"bai thuoc", "vi thuoc", "thao duoc", "thuoc nam", "thuoc bac", "duoc lieu", "thang thuoc",
	"tinh vi quy kinh", "quy kinh", "tu khi ngu vi",
	"bien chung luan tri", "luan tri", "bat cuong", "tang phu", "khi huyet", "am duong", "ngu hanh",
	"cay chi", "dien chan", "thuy cham", "cuu ngai", "mach chan", "vong chan",
];

function giaiMaHtml(s) {
	return s
		.replace(/&nbsp;/gi, " ")
		.replace(/&amp;/gi, "&")
		.replace(/&lt;/gi, "<")
		.replace(/&gt;/gi, ">")
		.replace(/&quot;/gi, '"')
		.replace(/&(?:#39|apos);/gi, "'")
		.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}

/** @returns {{tieuDe: string, moTa: string, than: string}} */
export function htmlSangChu(html) {
	const h = String(html ?? "");
	const tieuDe = (h.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "").trim();
	const moTa = (
		h.match(/<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["']/i)?.[1] ||
		h.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([\s\S]*?)["']/i)?.[1] ||
		""
	).trim();
	const than = giaiMaHtml(
		h
			.replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, " ")
			.replace(/<!--[\s\S]*?-->/g, " ")
			.replace(/<[^>]+>/g, " "),
	)
		.replace(/\s+/g, " ")
		.trim();
	return { tieuDe: giaiMaHtml(tieuDe), moTa: giaiMaHtml(moTa), than };
}

/**
 * Có thuộc ngách Đông Y không. CHỈ xét URL + tiêu đề + mô tả, KHÔNG xét thân bài: thân có
 * menu toàn trang nên trang nào của một bệnh viện có mục "Đông y" cũng sẽ khớp.
 */
export function laDongY(vanBan) {
	const t = boDau(vanBan).replace(/\s+/g, " ");
	return TU_DONG_Y.some((k) => t.includes(k));
}
```

`cms/src/plugins/rada-seo/radar/phan-tich.mjs`:

```js
// Phân tích MỘT trang đối thủ: tải → lọc ngách (không tốn lượt gọi) → Claude trích chủ đề.
import { z } from "zod";
import { htmlSangChu, laDongY, TRAN_KY_TU } from "./trang.mjs";

export const BOI_CANH = `Lĩnh vực kinh doanh của chúng tôi (Kinhlac): Y học cổ truyền / Đông Y, tập trung ngách:
- Đo nhiệt độ kinh lạc / chẩn đoán kinh lạc (phương pháp 24 tỉnh huyệt)
- Huyệt vị, đường kinh, châm cứu (tra cứu + đồ hình 3D)
- Vị thuốc, bài thuốc (tính vị quy kinh), biện chứng luận trị
- Phần mềm số hoá / quản lý phòng khám Đông Y`;

// Chép từ EXTRACT_SYSTEM_PROMPT của app; bỏ phần quy định định dạng JSON vì khuôn zod lo.
export const LOI_NHAC_TRICH = `Bạn là thành viên của một đội ngũ SEO chuyên nghiệp trong lĩnh vực Y học cổ truyền (Đông Y).
Nhiệm vụ: phân tích NỘI DUNG một bài blog của đối thủ (đã được trích sẵn text) để giúp team xây chiến lược nội dung & từ khoá.

Hãy xác định:
- chu_de: chủ đề chính của bài blog (1 câu ngắn).
- tu_khoa: 3 từ khoá SEO hàng đầu trong bài, liên quan tới lĩnh vực kinh doanh của chúng tôi. Kết hợp từ khoá dài (long tail) và ngắn (short tail). Từ khoá phải thực sự xuất hiện/đúng trọng tâm bài.
- tom_tat: các ý phụ khác nhau của bài, mỗi phần tử một ý ngắn gọn.

Tiếng Việt có dấu, viết hoa chữ cái đầu. Nếu nội dung quá mỏng, vẫn suy luận từ tiêu đề & mô tả; tuyệt đối không bịa số liệu.`;

export const KHUON_TRICH = z.object({
	chu_de: z.string(),
	tu_khoa: z.array(z.string()),
	tom_tat: z.array(z.string()),
});

/**
 * @param {{url: string, docWeb: (u: string) => Promise<string>, claude: {traJson: Function}, epBuoc?: boolean}} o
 * @returns {Promise<{trangThai: 'da_phan_tich'|'ngoai_nganh'|'loi', chuDe?: string, tuKhoa?: string[], tomTat?: string[], loi?: string}>}
 */
export async function phanTichTrang({ url, docWeb, claude, epBuoc = false }) {
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
	if (!epBuoc && !laDongY(`${url}\n${tieuDe}\n${moTa}`)) return { trangThai: "ngoai_nganh" };
	const user = `${BOI_CANH}\n\nURL bài blog đối thủ: ${url}\n\nNỘI DUNG ĐÃ TRÍCH:\n"""\n${chu}\n"""`;
	const kq = await claude.traJson(LOI_NHAC_TRICH, user, KHUON_TRICH, 800);
	return {
		trangThai: "da_phan_tich",
		chuDe: kq.chu_de.trim(),
		tuKhoa: kq.tu_khoa.map((s) => s.trim()).filter(Boolean).slice(0, 5),
		tomTat: kq.tom_tat.map((s) => s.trim()).filter(Boolean).slice(0, 8),
	};
}
```

`cms/src/plugins/rada-seo/radar/xu-huong.mjs`:

```js
// Dò xu hướng tìm kiếm qua gợi ý của Google (không khoá, không mô hình).
import { boDau } from "../luat/chuan-hoa.mjs";

export const HAT_GIONG = [
	"đo kinh lạc", "đo nhiệt độ kinh lạc", "huyệt", "bấm huyệt", "kinh lạc",
	"châm cứu", "bài thuốc đông y", "tính vị quy kinh", "huyệt đạo", "12 đường kinh",
];

/** Đọc phản hồi của suggestqueries (client=firefox): ["q", ["gợi ý", …]]. */
export function docGoiY(chu) {
	try {
		const d = JSON.parse(chu);
		return Array.isArray(d) && Array.isArray(d[1]) ? d[1].map(String) : [];
	} catch {
		return [];
	}
}

/**
 * @param {{docWeb: (u: string) => Promise<string>, hatGiong?: string[], tran?: number}} o
 * @returns {Promise<string[]>} cụm tìm kiếm, khử trùng theo dạng bỏ dấu
 */
export async function timXuHuong({ docWeb, hatGiong = HAT_GIONG, tran = 50 }) {
	const gap = new Map();
	for (const h of hatGiong.slice(0, 12)) {
		const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=vi&gl=vn&q=${encodeURIComponent(h)}`;
		for (const g of docGoiY(await docWeb(url))) {
			const k = boDau(g).trim();
			if (k && !gap.has(k)) gap.set(k, g.trim());
		}
	}
	return [...gap.values()].slice(0, tran);
}
```

- [ ] **Step 5: Chạy, xác nhận đạt**

Run: `node --test "src/plugins/rada-seo/radar/*.test.mjs"` → `pass 11`, `fail 0`.

- [ ] **Step 6: Commit**

```bash
git add cms/src/plugins/rada-seo/__test__/ cms/src/plugins/rada-seo/radar/
git commit -m "feat(rada-seo): radar quét sitemap, lọc ngách, Haiku phân tích trang, dò xu hướng" -- cms/src/plugins/rada-seo/__test__/ cms/src/plugins/rada-seo/radar/
```

---

### Task 3: Khoảng trống bằng luật

**Files:**
- Create: `cms/src/plugins/rada-seo/radar/khoang-trong.mjs`
- Test: `cms/src/plugins/rada-seo/radar/khoang-trong.test.mjs`

**Interfaces:**
- Consumes: `boDau`, `doGiong`, `gomNhom`, `tapKhoa`, `timTrung` (kế hoạch 1), `timViPham`, `doYmyl`.
- Produces: `TRAN_CUM=50`, `trungXuHuong(tuKhoa, xuHuong): boolean`, `chamDiem({soDoiThu, soBai, coXuHuong, viPham}): number`, `timKhoangTrong({chuDeMinh: {chuDe, tuKhoa[]}[], chuDeDoiThu: {id, doiThuId, chuDe, tuKhoa[]}[], xuHuong: string[]}): {tenCum, tuKhoa, soDoiThu, soBai, coXuHuong, viPham, diem, viDu}[]` (xếp điểm giảm dần).

- [ ] **Step 1: Viết phép kiểm (thất bại)**

`cms/src/plugins/rada-seo/radar/khoang-trong.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { timKhoangTrong, chamDiem, trungXuHuong } from "./khoang-trong.mjs";

// "Của mình" = 22 bài thật ngày 30/09/2026.
const MINH = JSON.parse(readFileSync(new URL("../luat/__fixture__/bai-viet-30-09.json", import.meta.url), "utf8")).map((b) => ({ chuDe: b.tieuDe, tuKhoa: b.tuKhoa }));

const DT = [
	{ id: "1", doiThuId: "a.vn", chuDe: "Bấm huyệt trị mất ngủ tại nhà", tuKhoa: ["bấm huyệt trị mất ngủ", "huyệt thần môn"] },
	{ id: "2", doiThuId: "b.vn", chuDe: "Các huyệt trị mất ngủ hiệu quả", tuKhoa: ["huyệt trị mất ngủ", "bấm huyệt trị mất ngủ"] },
	{ id: "3", doiThuId: "c.vn", chuDe: "Bấm huyệt trị mất ngủ cho người già", tuKhoa: ["bấm huyệt trị mất ngủ", "mất ngủ người già"] },
	// Mình ĐÃ có (7 bài 24 tỉnh huyệt) → không phải khoảng trống.
	{ id: "4", doiThuId: "a.vn", chuDe: "Đo nhiệt độ kinh lạc bằng 24 tỉnh huyệt", tuKhoa: ["đo nhiệt độ kinh lạc", "24 tỉnh huyệt"] },
	{ id: "5", doiThuId: "b.vn", chuDe: "Ngũ hành và ăn uống theo mùa", tuKhoa: ["ngũ hành ăn uống", "ăn uống theo mùa"] },
];

test("chủ đề mình đã có bị loại; nhiều đối thủ cùng viết đứng đầu", () => {
	const kq = timKhoangTrong({ chuDeMinh: MINH, chuDeDoiThu: DT, xuHuong: [] });
	assert.ok(!kq.some((c) => c.viDu.some((v) => v.includes("24 tỉnh huyệt"))));
	assert.equal(kq[0].soDoiThu, 3);
	assert.equal(kq[0].soBai, 3);
	assert.ok(kq[0].tuKhoa.includes("bấm huyệt trị mất ngủ"));
	assert.ok(kq.some((c) => c.tenCum === "Ngũ hành và ăn uống theo mùa" && c.soDoiThu === 1));
});

test("cụm nghiêng chữa trị bị phạt 8 điểm", () => {
	const kq = timKhoangTrong({ chuDeMinh: [], chuDeDoiThu: [{ id: "x", doiThuId: "a", chuDe: "Châm cứu chữa liệt mặt", tuKhoa: ["châm cứu chữa liệt"] }], xuHuong: [] });
	assert.equal(kq[0].viPham, true);
	assert.equal(kq[0].diem, chamDiem({ soDoiThu: 1, soBai: 1, coXuHuong: false, viPham: true }));
	assert.equal(kq[0].diem, -4);
});

test("trungXuHuong chỉ tính từ khoá ≥ 2 từ", () => {
	assert.equal(trungXuHuong(["bấm huyệt trị mất ngủ"], ["bam huyet tri mat ngu o dau"]), true);
	assert.equal(trungXuHuong(["huyệt"], ["huyệt thái dương"]), false);
});
```

- [ ] **Step 2: Chạy, xác nhận thất bại**

Run: `node --test src/plugins/rada-seo/radar/khoang-trong.test.mjs` → FAIL.

- [ ] **Step 3: Viết mã**

`cms/src/plugins/rada-seo/radar/khoang-trong.mjs`:

```js
// Khoảng trống nội dung bằng LUẬT, không gọi mô hình: chủ đề đối thủ có mà mình chưa có,
// gom nhóm theo độ giống (cùng thước với chống trùng), rồi chấm điểm.
//
// Điểm = 3 × số đối thủ cùng viết (tối đa 3) + số bài (tối đa 5) + 3 nếu trúng xu hướng
//        − 8 nếu tên/từ khoá cụm nghiêng chữa trị hay hứa kết quả.
// Nhiều đối thủ cùng viết = có người tìm thật; đó là tín hiệu mạnh nhất nên nhân 3.
import { boDau } from "../luat/chuan-hoa.mjs";
import { doGiong, gomNhom, tapKhoa, timTrung } from "../luat/trung-lap.mjs";
import { timViPham } from "../luat/pham-vi-y-sy.mjs";
import { doYmyl } from "../luat/ymyl.mjs";

export const TRAN_CUM = 50;

/** Chủ đề đại diện của nhóm: bài giống các bài còn lại nhất. */
function daiDien(baiNhom) {
	const tap = baiNhom.map((b) => tapKhoa({ tieuDe: b.chuDe, tuKhoa: b.tuKhoa }));
	let tot = 0, diemTot = -1;
	tap.forEach((a, i) => {
		const d = tap.reduce((s, b, j) => (i === j ? s : s + doGiong(a, b)), 0);
		if (d > diemTot) (diemTot = d), (tot = i);
	});
	return baiNhom[tot];
}

/** 6 từ khoá xuất hiện nhiều nhất trong nhóm (khử trùng theo dạng bỏ dấu). */
function tuKhoaNhom(baiNhom) {
	const dem = new Map();
	for (const b of baiNhom)
		for (const k of b.tuKhoa) {
			const kk = boDau(k).trim();
			if (!kk) continue;
			const cu = dem.get(kk) ?? { chu: k.trim(), n: 0 };
			cu.n++;
			dem.set(kk, cu);
		}
	return [...dem.values()].sort((a, b) => b.n - a.n).slice(0, 6).map((x) => x.chu);
}

/** Trúng xu hướng khi một cụm tìm kiếm chứa trọn một từ khoá ≥ 2 từ của nhóm, hoặc ngược lại. */
export function trungXuHuong(tuKhoa, xuHuong) {
	const xh = xuHuong.map((x) => boDau(x));
	return tuKhoa.some((k) => {
		const kk = boDau(k).trim();
		if (kk.split(/\s+/).length < 2) return false;
		return xh.some((x) => x.includes(kk) || kk.includes(x));
	});
}

export function chamDiem({ soDoiThu, soBai, coXuHuong, viPham }) {
	return 3 * Math.min(soDoiThu, 3) + Math.min(soBai, 5) + (coXuHuong ? 3 : 0) - (viPham ? 8 : 0);
}

/**
 * @param {{
 *   chuDeMinh: {chuDe: string, tuKhoa: string[]}[],
 *   chuDeDoiThu: {id: string, doiThuId: string, chuDe: string, tuKhoa: string[]}[],
 *   xuHuong: string[],
 * }} o
 * @returns {{tenCum: string, tuKhoa: string[], soDoiThu: number, soBai: number, coXuHuong: boolean, viPham: boolean, diem: number, viDu: string[]}[]}
 */
export function timKhoangTrong({ chuDeMinh, chuDeDoiThu, xuHuong }) {
	const minh = chuDeMinh.map((m, i) => ({ id: `m${i}`, tieuDe: m.chuDe, tuKhoa: m.tuKhoa }));
	const thieu = chuDeDoiThu.filter((t) => !timTrung({ tieuDe: t.chuDe, tuKhoa: t.tuKhoa }, minh));
	const theoId = new Map(thieu.map((t) => [t.id, t]));
	const nhom = gomNhom(thieu.map((t) => ({ id: t.id, tieuDe: t.chuDe, tuKhoa: t.tuKhoa })));
	const ra = nhom.map((ids) => {
		const bai = ids.map((id) => theoId.get(id));
		const tuKhoa = tuKhoaNhom(bai);
		const tenCum = daiDien(bai).chuDe;
		const chu = `${tenCum}. ${tuKhoa.join(", ")}`;
		const viPham = timViPham(chu).length > 0 || doYmyl(chu).some((v) => v.loai === "hua_hen");
		const soDoiThu = new Set(bai.map((b) => b.doiThuId)).size;
		const coXuHuong = trungXuHuong(tuKhoa, xuHuong);
		return {
			tenCum,
			tuKhoa,
			soDoiThu,
			soBai: bai.length,
			coXuHuong,
			viPham,
			diem: chamDiem({ soDoiThu, soBai: bai.length, coXuHuong, viPham }),
			viDu: bai.slice(0, 5).map((b) => b.chuDe),
		};
	});
	return ra.sort((a, b) => b.diem - a.diem || b.soBai - a.soBai).slice(0, TRAN_CUM);
}
```

- [ ] **Step 4: Chạy, xác nhận đạt**

Run: `node --test src/plugins/rada-seo/radar/khoang-trong.test.mjs` → `pass 3`, `fail 0`.

- [ ] **Step 5: Commit**

```bash
git add cms/src/plugins/rada-seo/radar/khoang-trong.mjs cms/src/plugins/rada-seo/radar/khoang-trong.test.mjs
git commit -m "feat(rada-seo): khoảng trống nội dung bằng luật, không gọi mô hình" -- cms/src/plugins/rada-seo/radar/
```

---

### Task 4: Kho dữ liệu của plugin

**Files:**
- Create: `cms/src/plugins/rada-seo/kho.mjs`
- Test: `cms/src/plugins/rada-seo/kho.test.mjs`

**Interfaces:**
- Consumes: `timTrung` (kế hoạch 1); `taoKhoGia` (Task 2) trong phép kiểm.
- Produces (mọi hàm nhận `s` = `ctx.storage`): `KHAI_BAO_KHO`, `TRANG_THAI_CUM`, `idUrl(url)`, `tatCa(col, opts)`, `dsDoiThu(s)`, `luuDoiThu(s, {tenMien, ten, laCuaMinh}, now)`, `xoaDoiThu(s, tenMien): number`, `themUrlMoi(s, tenMien, urls, {ghi, now}): number`, `layUrlCho(s, tenMien, n)`, `capNhatUrl(s, id, patch)`, `demUrl(s, tenMien): {cho, da_phan_tich, ngoai_nganh, loi}`, `chuDeDaPhanTich(s, doiThu): {minh, doiThu}`, `dsCum(s, n?)`, `thayCum(s, cumMoi, now): number`, `datTrangThaiCum(s, id, trangThai)`, `ghiCa(s, ca)`, `dsCa(s, n?)`.
- Dữ liệu: `doi_thu` khoá = tên miền `{tenMien, ten, laCuaMinh, taoLuc}`; `url` khoá = `idUrl(url)` `{doiThuId, url, trangThai, chuDe?, tuKhoa?, tomTat?, loi?, phanTichLuc?, taoLuc}`; `cum` `{tenCum, tuKhoa, soDoiThu, soBai, coXuHuong, viPham, diem, viDu, trangThai, capNhatLuc}`; `ca` khoá = `${batDau}-${loai}`.

- [ ] **Step 1: Viết phép kiểm (thất bại)**

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
	assert.deepEqual(await kho.demUrl(s, "a.vn"), { cho: 1, da_phan_tich: 0, ngoai_nganh: 0, loi: 0 });
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
```

- [ ] **Step 2: Chạy, xác nhận thất bại**

Run: `node --test src/plugins/rada-seo/kho.test.mjs` → FAIL.

- [ ] **Step 3: Viết mã**

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
export async function themUrlMoi(s, tenMien, urls, { ghi, now }) {
	const ids = urls.map(idUrl);
	const daCo = await s.url.getMany(ids);
	const moi = urls.filter((u, i) => !daCo.has(ids[i]));
	if (ghi && moi.length)
		await s.url.putMany(moi.map((url) => ({ id: idUrl(url), data: { doiThuId: tenMien, url, trangThai: "cho", taoLuc: now } })));
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

export async function demUrl(s, tenMien) {
	const ra = {};
	for (const t of ["cho", "da_phan_tich", "ngoai_nganh", "loi"]) ra[t] = await s.url.count({ doiThuId: tenMien, trangThai: t });
	return ra;
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
export async function thayCum(s, cumMoi, now) {
	const cu = await tatCa(s.cum);
	const khoa = cu.filter((r) => r.data.trangThai !== "cho_viet").map((r) => ({ id: r.id, tieuDe: r.data.tenCum, tuKhoa: r.data.tuKhoa }));
	const xoa = cu.filter((r) => r.data.trangThai === "cho_viet").map((r) => r.id);
	if (xoa.length) await s.cum.deleteMany(xoa);
	const ghi = cumMoi.filter((c) => !timTrung({ tieuDe: c.tenCum, tuKhoa: c.tuKhoa }, khoa));
	if (ghi.length) await s.cum.putMany(ghi.map((c) => ({ id: bam(c.tenCum), data: { ...c, trangThai: "cho_viet", capNhatLuc: now } })));
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

- [ ] **Step 4: Chạy, xác nhận đạt**

Run: `node --test src/plugins/rada-seo/kho.test.mjs` → `pass 3`, `fail 0`.

- [ ] **Step 5: Commit**

```bash
git add cms/src/plugins/rada-seo/kho.mjs cms/src/plugins/rada-seo/kho.test.mjs
git commit -m "feat(rada-seo): kho dữ liệu plugin — đối thủ, URL, cụm, nhật ký ca" -- cms/src/plugins/rada-seo/kho.mjs cms/src/plugins/rada-seo/kho.test.mjs
```

---

### Task 5: Một ca radar

**Files:**
- Create: `cms/src/plugins/rada-seo/ca-radar.mjs`
- Test: `cms/src/plugins/rada-seo/ca-radar.test.mjs`

**Interfaces:**
- Consumes: `thuThapUrl` (Task 2), `phanTichTrang` (Task 2), `timXuHuong` (Task 2), `timKhoangTrong` (Task 3), `HetNganSach` (Task 1), mọi hàm `kho` (Task 4).
- Produces: `NGHI_GIUA_LUOT_MS = 300`, `chayCaRadar({s, docWeb, claude, nganSach, ghi, tranMoiDoiThu?, nghi?, now?}): Promise<ca>` với `ca = {loai:'radar', batDau, ketThuc, ghi, soUrlMoi, soSePhanTich, soPhanTich, soNgoaiNganh, soLoiTrang, soXuHuong, soCum, soLuotGoi, loi: string[]}`.

- [ ] **Step 1: Viết phép kiểm (thất bại)**

`cms/src/plugins/rada-seo/ca-radar.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { chayCaRadar } from "./ca-radar.mjs";
import { taoNganSach } from "./lib/claude.mjs";
import * as kho from "./kho.mjs";
import { taoKhoGia, webGia } from "./__test__/kho-gia.mjs";

const trang = (tieuDe) => `<html><head><title>${tieuDe}</title></head><body><p>${tieuDe}. Nội dung Đông y đủ dài để phân tích về huyệt vị và kinh lạc.</p></body></html>`;
const WEB = webGia({
	"https://a.vn/sitemap.xml": "<urlset><url><loc>https://a.vn/mat-ngu</loc></url><url><loc>https://a.vn/huyet-ap</loc></url></urlset>",
	"https://a.vn/mat-ngu": trang("Bấm huyệt trị mất ngủ"),
	"https://a.vn/huyet-ap": "<html><head><title>Tăng huyết áp</title></head><body><p>Huyết áp cao là bệnh tim mạch thường gặp ở người lớn tuổi.</p></body></html>",
	"https://b.vn/sitemap.xml": "<urlset><url><loc>https://b.vn/mat-ngu-2</loc></url></urlset>",
	// Tiêu đề phải có cụm Đông y ("bấm huyệt"): "huyệt" đứng một mình cố ý không tính.
	"https://b.vn/mat-ngu-2": trang("Bấm huyệt trị mất ngủ hiệu quả"),
});
// Claude giả vẫn trừ ngân sách như bản thật (taoClaude trừ trước khi gọi).
const claudeGia = (ns) => ({
	goi: 0,
	async traJson(_s, user) {
		ns.dung();
		this.goi++;
		const t = user.match(/TIÊU ĐỀ: (.*)/)[1];
		return { chu_de: t, tu_khoa: ["bấm huyệt trị mất ngủ", t.toLowerCase()], tom_tat: [] };
	},
});
const khoiTao = async () => {
	const s = taoKhoGia();
	await kho.luuDoiThu(s, { tenMien: "a.vn" }, "t");
	await kho.luuDoiThu(s, { tenMien: "b.vn" }, "t");
	return s;
};
const nghi = async () => {};

test("chạy thử: chỉ quét + đếm, không gọi Claude, không ghi URL/cụm, vẫn ghi nhật ký", async () => {
	const s = await khoiTao();
	const ns = taoNganSach(10);
	const claude = claudeGia(ns);
	const ca = await chayCaRadar({ s, docWeb: WEB, claude, nganSach: ns, ghi: false, nghi });
	assert.equal(ca.ghi, false);
	assert.equal(ca.soUrlMoi, 3);
	assert.equal(claude.goi, 0);
	assert.equal(s.url._m.size, 0);
	assert.equal(s.cum._m.size, 0);
	assert.equal((await kho.dsCa(s)).length, 1);
});

test("chạy thật: phân tích, lọc ngoài ngành không tốn lượt, ra khoảng trống 2 đối thủ", async () => {
	const s = await khoiTao();
	const ns = taoNganSach(10);
	const claude = claudeGia(ns);
	const ca = await chayCaRadar({ s, docWeb: WEB, claude, nganSach: ns, ghi: true, nghi });
	assert.equal(ca.soPhanTich, 2);
	assert.equal(ca.soNgoaiNganh, 1);
	assert.equal(ca.soLuotGoi, 2);
	assert.equal(claude.goi, 2);
	const cum = await kho.dsCum(s);
	assert.equal(cum[0].soDoiThu, 2);
	assert.equal(cum[0].trangThai, "cho_viet");
	// Chạy lại: không còn URL chờ → không gọi thêm.
	await chayCaRadar({ s, docWeb: WEB, claude, nganSach: ns, ghi: true, nghi });
	assert.equal(claude.goi, 2);
});

test("hết ngân sách: dừng gọi, ghi lỗi vào nhật ký, vẫn tính khoảng trống", async () => {
	const s = await khoiTao();
	const ns = taoNganSach(1);
	const ca = await chayCaRadar({ s, docWeb: WEB, claude: claudeGia(ns), nganSach: ns, ghi: true, nghi });
	assert.equal(ca.soPhanTich, 1);
	assert.ok(ca.loi.some((l) => l.includes("Hết ngân sách")));
	assert.equal((await kho.dsCa(s))[0].soLuotGoi, 1);
});
```

- [ ] **Step 2: Chạy, xác nhận thất bại**

Run: `node --test src/plugins/rada-seo/ca-radar.test.mjs` → FAIL.

- [ ] **Step 3: Viết mã**

`cms/src/plugins/rada-seo/ca-radar.mjs`:

```js
// Một ca radar: quét sitemap mọi đối thủ → phân tích URL mới (có trần) → dò xu hướng →
// tìm khoảng trống → ghi nhật ký ca. `ghi=false` (chạy thử) chỉ quét và đếm: KHÔNG gọi
// Claude, KHÔNG ghi URL hay cụm — nhưng VẪN ghi nhật ký ca để thấy lần thử đã chạy.
import { thuThapUrl } from "./radar/sitemap.mjs";
import { phanTichTrang } from "./radar/phan-tich.mjs";
import { timXuHuong } from "./radar/xu-huong.mjs";
import { timKhoangTrong } from "./radar/khoang-trong.mjs";
import { HetNganSach } from "./lib/claude.mjs";
import * as kho from "./kho.mjs";

/** Nghỉ giữa các lượt đọc/gọi: CMS còn phục vụ ảnh, khu quản trị và blog cho người thật. */
export const NGHI_GIUA_LUOT_MS = 300;

const cho = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * @param {{s: object, docWeb: Function, claude: {traJson: Function}|null, nganSach: {daDung: number},
 *          ghi: boolean, tranMoiDoiThu?: number, nghi?: (ms: number) => Promise<void>, now?: () => string}} o
 */
export async function chayCaRadar({ s, docWeb, claude, nganSach, ghi, tranMoiDoiThu = 30, nghi = cho, now = () => new Date().toISOString() }) {
	const ca = {
		loai: "radar", batDau: now(), ketThuc: null, ghi,
		soUrlMoi: 0, soSePhanTich: 0, soPhanTich: 0, soNgoaiNganh: 0, soLoiTrang: 0,
		soXuHuong: 0, soCum: 0, soLuotGoi: 0, loi: [],
	};
	const doiThu = await kho.dsDoiThu(s);
	let hetTien = false;
	for (const d of doiThu) {
		try {
			const urls = await thuThapUrl(d.tenMien, docWeb);
			ca.soUrlMoi += await kho.themUrlMoi(s, d.tenMien, urls, { ghi, now: now() });
			const hang = await kho.layUrlCho(s, d.tenMien, tranMoiDoiThu);
			ca.soSePhanTich += hang.length;
			if (!ghi || hetTien) continue;
			for (const u of hang) {
				let kq;
				try {
					kq = await phanTichTrang({ url: u.url, docWeb, claude });
				} catch (e) {
					if (e instanceof HetNganSach) {
						hetTien = true;
						ca.loi.push(e.message);
						break;
					}
					kq = { trangThai: "loi", loi: String(e?.message ?? e).slice(0, 300) };
				}
				await kho.capNhatUrl(s, u.id, { ...kq, phanTichLuc: now() });
				if (kq.trangThai === "da_phan_tich") ca.soPhanTich++;
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
			const xuHuong = await timXuHuong({ docWeb });
			ca.soXuHuong = xuHuong.length;
			const { minh, doiThu: dt } = await kho.chuDeDaPhanTich(s, doiThu);
			const cum = timKhoangTrong({ chuDeMinh: minh, chuDeDoiThu: dt, xuHuong });
			ca.soCum = await kho.thayCum(s, cum, now());
		} catch (e) {
			ca.loi.push(`khoảng trống: ${String(e?.message ?? e).slice(0, 300)}`);
		}
	}
	ca.soLuotGoi = nganSach?.daDung ?? 0;
	ca.ketThuc = now();
	await kho.ghiCa(s, ca);
	return ca;
}
```

- [ ] **Step 4: Chạy cả bộ**

Run: `node --test "src/plugins/rada-seo/**/*.test.mjs"` → `pass 46`, `fail 0` (20 của kế hoạch 1 + 26 mới).

- [ ] **Step 5: Commit**

```bash
git add cms/src/plugins/rada-seo/ca-radar.mjs cms/src/plugins/rada-seo/ca-radar.test.mjs
git commit -m "feat(rada-seo): ca radar — quét, phân tích có trần, khoảng trống, nhật ký" -- cms/src/plugins/rada-seo/ca-radar.mjs cms/src/plugins/rada-seo/ca-radar.test.mjs
```

---

### Task 6: Nối plugin vào EmDash + màn điều khiển + công tắc VPS

**Files:**
- Create: `cms/src/plugins/rada-seo/plugin.mjs`, `cms/src/plugins/rada-seo/descriptor.mjs`, `cms/src/plugins/rada-seo/admin.jsx`
- Modify: `cms/astro.config.mjs` (dòng 3 thêm import; dòng 145 `plugins: [auditLog]`)
- Modify: `docker-compose.yml` (khối `environment:` của service `cms`, sau dòng 119 `EMDASH_SITE_URL`)
- Modify: `cms/.env.example` (thêm `ANTHROPIC_API_KEY`)

**Interfaces:**
- Consumes: mọi thứ của Task 1–5.
- Produces: plugin id `rada-seo`; route (POST `/_emdash/api/plugins/rada-seo/<tên>`, phong bì `{success, data}`): `tong-quan`, `doi-thu-luu {tenMien, ten, laCuaMinh}`, `doi-thu-xoa {tenMien}`, `cum-trang-thai {id, trangThai ∈ bo_qua|cho_viet}`, `lich-bat`, `ca-chay {ghi: boolean}`; hook `cron` tên việc `"radar"`; `LICH_RADAR = "30 19 * * *"`; `radaSeo` (descriptor).

- [ ] **Step 1: Viết `plugin.mjs`**

`cms/src/plugins/rada-seo/plugin.mjs`:

```js
// Plugin Rada SEO — phần NỐI: khai báo với EmDash, route cho màn điều khiển, hook cron.
// Logic nằm ở các mô-đun thuần (kho, ca-radar, radar/*, luat/*) và có phép kiểm riêng.
//
// Dạng đăng ký đã ĐO ở bước 0 (docs/superpowers/plans/2026-09-30-rada-seo-ket-qua-buoc-0.md):
// EmDash nạp module này qua descriptor native và gọi createPlugin(); default export KHÔNG dùng.
import { definePlugin } from "emdash";
import { KHAI_BAO_KHO } from "./kho.mjs";
import * as kho from "./kho.mjs";
import { chuanTenMien } from "./radar/sitemap.mjs";
import { chayCaRadar } from "./ca-radar.mjs";
import { taoDocWeb } from "./lib/doc-web.mjs";
import { taoClaude, taoClientThat, taoNganSach } from "./lib/claude.mjs";

/** 02:30 giờ Việt Nam = 19:30 UTC hôm trước (cron của EmDash chạy theo UTC). */
export const LICH_RADAR = "30 19 * * *";
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

async function giuKhoa(kv) {
	const cu = await kv.getVersioned(KHOA_CA);
	if (cu && cu.value?.het > Date.now()) return false;
	const r = await kv.compareAndSet(KHOA_CA, cu?.revision ?? null, { tu: new Date().toISOString(), het: Date.now() + HAN_KHOA_MS });
	return r.applied;
}

async function chayCa(ctx, ghi) {
	if (!(await giuKhoa(ctx.kv))) {
		ctx.log.warn("Rada SEO: đã có một ca đang chạy, bỏ qua lượt này");
		return null;
	}
	try {
		const nganSach = taoNganSach(soMoiTruong("RADA_SEO_TRAN_LUOT", 200));
		const claude = ghi ? taoClaude({ client: taoClientThat(), nganSach }) : null;
		return await chayCaRadar({
			s: ctx.storage,
			docWeb: taoDocWeb(ctx.http.fetch.bind(ctx.http)),
			claude,
			nganSach,
			ghi,
			tranMoiDoiThu: soMoiTruong("RADA_SEO_TRAN_MOI_DOI_THU", 30),
		});
	} catch (e) {
		// Lỗi trước khi vào ca (vd thiếu ANTHROPIC_API_KEY) vẫn phải hiện trên màn điều khiển.
		const bayGio = new Date().toISOString();
		await kho.ghiCa(ctx.storage, { loai: "radar", batDau: bayGio, ketThuc: bayGio, ghi, loi: [String(e?.message ?? e)] });
		ctx.log.error("Rada SEO: ca hỏng", e);
		return null;
	} finally {
		await ctx.kv.delete(KHOA_CA);
	}
}

const vao = (ctx) => (ctx.input && typeof ctx.input === "object" ? ctx.input : {});

export function createPlugin() {
	return definePlugin({
		id: "rada-seo",
		version: "0.1.0",
		// Đối thủ do người quản trị thêm lúc chạy nên không liệt kê trước được tên miền;
		// lớp chặn nằm ở doc-web.mjs (không IP/localhost) và sitemap.mjs (chỉ cùng tên miền).
		capabilities: ["network:request:unrestricted"],
		storage: KHAI_BAO_KHO,
		hooks: {
			cron: async (event, ctx) => {
				if (event.name !== "radar") return;
				if (!caDemBat()) {
					ctx.log.warn("Rada SEO: máy này không bật RADA_SEO_CA_DEM — nhả ca đêm");
					const bayGio = new Date().toISOString();
					await kho.ghiCa(ctx.storage, {
						loai: "radar", batDau: bayGio, ketThuc: bayGio, ghi: false,
						loi: ["Ca đêm bị một tiến trình KHÔNG bật RADA_SEO_CA_DEM nhận — đêm nay radar không chạy"],
					});
					return;
				}
				await chayCa(ctx, true);
			},
		},
		routes: {
			"tong-quan": {
				handler: async (ctx) => {
					const doiThu = await kho.dsDoiThu(ctx.storage);
					for (const d of doiThu) d.dem = await kho.demUrl(ctx.storage, d.id);
					const ca = await kho.dsCa(ctx.storage, 10);
					const thanhCong = ca.find((c) => c.ghi && !c.loi?.length && c.ketThuc);
					const khoa = await ctx.kv.get(KHOA_CA);
					return {
						doiThu,
						cum: await kho.dsCum(ctx.storage, 100),
						ca,
						lich: (await ctx.cron?.list()) ?? [],
						caDemBat: caDemBat(),
						dangChay: !!(khoa && khoa.het > Date.now()),
						canhBaoCaDem: caDemBat() && (!thanhCong || Date.now() - Date.parse(thanhCong.ketThuc) > CANH_BAO_SAU_MS),
					};
				},
			},
			"doi-thu-luu": {
				handler: async (ctx) => {
					const { tenMien, ten, laCuaMinh } = vao(ctx);
					const tm = chuanTenMien(tenMien);
					if (!tm) throw new Error("Tên miền không hợp lệ");
					await kho.luuDoiThu(ctx.storage, { tenMien: tm, ten: String(ten ?? "").trim(), laCuaMinh: !!laCuaMinh }, new Date().toISOString());
					return { tenMien: tm };
				},
			},
			"doi-thu-xoa": {
				handler: async (ctx) => ({ soUrlDaXoa: await kho.xoaDoiThu(ctx.storage, chuanTenMien(vao(ctx).tenMien)) }),
			},
			"cum-trang-thai": {
				handler: async (ctx) => {
					const { id, trangThai } = vao(ctx);
					// Màn điều khiển chỉ được bỏ qua / khôi phục; các trạng thái khác do lò viết đặt.
					if (!["bo_qua", "cho_viet"].includes(trangThai)) throw new Error("Chỉ được đặt bo_qua hoặc cho_viet");
					await kho.datTrangThaiCum(ctx.storage, String(id), trangThai);
					return { id, trangThai };
				},
			},
			"lich-bat": {
				// plugin:install KHÔNG chạy với plugin khai trong config (đo ở bước 0) nên phải hẹn
				// qua route. schedule là upsert: bấm lại vô hại.
				handler: async (ctx) => {
					await ctx.cron.schedule("radar", { schedule: LICH_RADAR });
					return { lich: await ctx.cron.list() };
				},
			},
			"ca-chay": {
				// Chạy NỀN rồi trả ngay: một ca thật kéo dài nhiều phút, quá hạn chờ của nginx.
				handler: async (ctx) => {
					const ghi = vao(ctx).ghi === true;
					if (ghi && !caDemBat()) throw new Error("Máy này không bật RADA_SEO_CA_DEM — chỉ được chạy thử");
					void chayCa(ctx, ghi);
					return { daBatDau: true, ghi };
				},
			},
		},
	});
}
```

- [ ] **Step 2: Viết `descriptor.mjs` và `admin.jsx`**

`cms/src/plugins/rada-seo/descriptor.mjs`:

```js
// Descriptor native của Rada SEO cho mảng `plugins` trong astro.config.mjs.
// Dạng này (entrypoint TUYỆT ĐỐI, adminEntry "/src/…" tính từ gốc cms) là dạng DUY NHẤT đo
// được là chạy ở EmDash 0.39.1 — "./src/…" gãy build với UNRESOLVED_IMPORT.
import { fileURLToPath } from "node:url";

export const radaSeo = {
	id: "rada-seo",
	version: "0.1.0",
	format: "native",
	entrypoint: fileURLToPath(new URL("./plugin.mjs", import.meta.url)),
	adminEntry: "/src/plugins/rada-seo/admin.jsx",
	adminPages: [{ path: "/rada", label: "Rada SEO", icon: "chart" }],
};
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

	const tai = useCallback(() => goi("tong-quan").then(setDl, (e) => setLoi(e.message)), []);
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
			{!dl.caDemBat && <p style={{ color: "#92400e" }}>Máy này không bật RADA_SEO_CA_DEM: chỉ chạy thử được, ca đêm thật chạy trên VPS.</p>}
			<p>
				Lịch đêm: {lichRadar ? `02:30 hằng ngày · lần tới ${gio(lichRadar.nextRunAt)} · lần trước ${gio(lichRadar.lastRunAt)}` : "chưa bật"}{" "}
				<button onClick={() => lam("lich-bat")}>{lichRadar ? "Hẹn lại" : "Bật lịch"}</button>{" "}
				<button disabled={dl.dangChay} onClick={() => lam("ca-chay", { ghi: false })}>Chạy thử</button>{" "}
				<button disabled={dl.dangChay || !dl.caDemBat} onClick={() => lam("ca-chay", { ghi: true })}>Chạy thật</button>{" "}
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
					<tr><th style={o}>Tên miền</th><th style={o}>Chờ</th><th style={o}>Đã phân tích</th><th style={o}>Ngoài ngành</th><th style={o}>Lỗi</th><th style={o}></th></tr>
				</thead>
				<tbody>
					{dl.doiThu.map((d) => (
						<tr key={d.id}>
							<td style={o}>{d.ten} {d.laCuaMinh && <b>(của mình)</b>}</td>
							<td style={o}>{d.dem.cho}</td><td style={o}>{d.dem.da_phan_tich}</td><td style={o}>{d.dem.ngoai_nganh}</td><td style={o}>{d.dem.loi}</td>
							<td style={o}><button onClick={() => confirm(`Xoá ${d.id} và mọi URL của nó?`) && lam("doi-thu-xoa", { tenMien: d.id })}>Xoá</button></td>
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
							<td style={o}>{c.tuKhoa.join(", ")}</td>
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
					<tr><th style={o}>Bắt đầu</th><th style={o}>Kiểu</th><th style={o}>URL mới</th><th style={o}>Phân tích</th><th style={o}>Ngoài ngành</th><th style={o}>Lượt gọi</th><th style={o}>Cụm</th><th style={o}>Lỗi</th></tr>
				</thead>
				<tbody>
					{dl.ca.map((c) => (
						<tr key={c.batDau}>
							<td style={o}>{gio(c.batDau)}</td><td style={o}>{c.ghi ? "thật" : "thử"}</td>
							<td style={o}>{c.soUrlMoi ?? "—"}</td><td style={o}>{c.soPhanTich ?? "—"}</td><td style={o}>{c.soNgoaiNganh ?? "—"}</td>
							<td style={o}>{c.soLuotGoi ?? "—"}</td><td style={o}>{c.soCum ?? "—"}</td>
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

- [ ] **Step 3: Nạp module thật (phép kiểm tối thiểu cho plugin — build xanh không chứng minh gì)**

Run (trong `cms/`):
`node -e "import('./src/plugins/rada-seo/plugin.mjs').then(m=>{const p=m.createPlugin();console.log(p.id,p.version,Object.keys(p.routes).join(','))})"`
Expected: `rada-seo 0.1.0 tong-quan,doi-thu-luu,doi-thu-xoa,cum-trang-thai,lich-bat,ca-chay`

- [ ] **Step 4: Đăng ký trong `cms/astro.config.mjs`**

Thêm sau dòng `import auditLog from "@emdash-cms/plugin-audit-log";`:

```js
import { radaSeo } from "./src/plugins/rada-seo/descriptor.mjs";
```

Đổi `plugins: [auditLog],` thành:

```js
			// Rada SEO — radar đối thủ tự hành. Ca đêm CHỈ chạy nơi có RADA_SEO_CA_DEM=1
			// (docker-compose trên VPS): bảng cron dùng chung kho, xem src/plugins/rada-seo/plugin.mjs.
			plugins: [auditLog, radaSeo],
```

- [ ] **Step 5: Công tắc và khoá**

`docker-compose.yml`, trong `environment:` của service `cms`, ngay sau `EMDASH_SITE_URL: https://kinhlac.online`:

```yaml
      # Rada SEO: CHỈ VPS được chạy ca đêm. Đặt ở ĐÂY, không trong cms/.env — tệp đó chép qua
      # lại máy dev, mà máy dev nhận ca đêm là chạy ca bằng mã của máy dev (bảng cron dùng chung).
      RADA_SEO_CA_DEM: "1"
```

`cms/.env.example`, thêm cuối tệp:

```
# Rada SEO — Claude Haiku phân tích trang đối thủ. Thiếu thì ca radar ghi lỗi vào nhật ký.
ANTHROPIC_API_KEY=
# Trần lượt gọi mỗi ca (kể cả lượt hỏng) và số URL phân tích mỗi đối thủ mỗi ca.
# RADA_SEO_TRAN_LUOT=200
# RADA_SEO_TRAN_MOI_DOI_THU=30
```

- [ ] **Step 6: Commit**

```bash
git add cms/src/plugins/rada-seo/plugin.mjs cms/src/plugins/rada-seo/descriptor.mjs cms/src/plugins/rada-seo/admin.jsx cms/astro.config.mjs docker-compose.yml cms/.env.example
git commit -m "feat(rada-seo): plugin native + màn điều khiển + công tắc ca đêm chỉ VPS" -- cms/src/plugins/rada-seo/plugin.mjs cms/src/plugins/rada-seo/descriptor.mjs cms/src/plugins/rada-seo/admin.jsx cms/astro.config.mjs docker-compose.yml cms/.env.example
```

---

### Task 7: Nghiệm thu trên bàn thử

**Files:**
- Create: `docs/superpowers/plans/2026-09-30-rada-seo-nghiem-thu-2a.md`
- Tạm (xoá cuối task, KHÔNG commit): `cms/astro.config.thu.mjs`, `cms/dist-thu/`

**Interfaces:**
- Consumes: plugin từ Task 6; công thức bàn thử trong `docs/superpowers/plans/2026-09-30-rada-seo-ket-qua-buoc-0.md` mục "Công thức cấu hình thay thế" (dựng, đăng nhập SSO, đánh dấu setup, Playwright, dọn).

- [ ] **Step 1: Dựng bàn thử**

Theo đúng công thức bước 0, với `plugins: [auditLog, radaSeo]` (import descriptor thật). Chạy server với thêm `RADA_SEO_CA_DEM=1 RADA_SEO_TRAN_LUOT=12 RADA_SEO_TRAN_MOI_DOI_THU=4` và `ANTHROPIC_API_KEY` nếu người dùng đã cấp (KHÔNG in khoá ra log hay tệp). Expected: `curl -s -o /dev/null -w '%{http_code}' http://localhost:4399/` = `200`.

- [ ] **Step 2: Đo route + chạy thử**

Đăng nhập SSO, rồi (cookie jar + `X-EmDash-Request: 1`):
1. `doi-thu-luu {"tenMien":"https://kinhlac.online/","laCuaMinh":true}` → `data.tenMien = "kinhlac.online"`.
2. `doi-thu-luu {"tenMien":"benhvienyhoccotruyentrunguong.vn"}`.
3. `doi-thu-luu {"tenMien":"localhost"}` → lỗi "Tên miền không hợp lệ".
4. `lich-bat` → `data.lich` có `name:"radar"`, `schedule:"30 19 * * *"`.
5. `ca-chay {"ghi":false}`; chờ tới khi `tong-quan.dangChay=false` (hỏi lại mỗi ~15 s qua nhiều lượt gọi riêng, không vòng `sleep`). Expected: `ca[0].ghi=false`, `soUrlMoi > 0`, `soLuotGoi = 0`, `cum` rỗng, và `doiThu[*].dem.cho = 0` (chạy thử không ghi URL).

- [ ] **Step 3: Chạy thật (chỉ khi có `ANTHROPIC_API_KEY`)**

`ca-chay {"ghi":true}`; chờ xong. Expected: `soLuotGoi ≤ 12`; `soPhanTich + soNgoaiNganh + soLoiTrang ≥ 1`; `doiThu[*].dem` có `da_phan_tich` hoặc `ngoai_nganh` > 0. Ghi nguyên văn 3 chủ đề đã trích + (nếu có) 3 cụm khoảng trống vào tệp nghiệm thu. Không có khoá → ghi "CHƯA ĐO: thiếu khoá" và kiểm rằng `ca-chay {"ghi":true}` ghi nhật ký lỗi "Thiếu ANTHROPIC_API_KEY".

- [ ] **Step 4: Màn điều khiển**

Playwright mở `/_emdash/admin/plugins/rada-seo/rada` (bấm "Get Started" nếu có hộp chào), chụp ảnh vào scratchpad, TỰ MỞ ảnh ra xem. Expected: tiêu đề "Rada SEO", bảng đối thủ đủ 2 dòng, nhật ký ca có dòng "thử". Bấm "Bỏ qua" ở một cụm (nếu có cụm) → tải lại → cụm mờ đi, nút thành "Khôi phục".

- [ ] **Step 5: Ghi kết quả, dọn**

Tạo `docs/superpowers/plans/2026-09-30-rada-seo-nghiem-thu-2a.md` (tiếng Việt): bảng từng phép đo Step 2–4 ĐẠT/TRƯỢT kèm số liệu, chủ đề/cụm trích nguyên văn, lỗi gặp. Dừng server, xoá `cms/astro.config.thu.mjs` và `cms/dist-thu/`, chạy `cd cms && npx astro sync` rồi xác nhận `cms/.emdash/migrations.json` lại là `"type": "postgres"`. `git status --short cms/` không còn tệp tạm.

- [ ] **Step 6: Commit**

```bash
git add docs/superpowers/plans/2026-09-30-rada-seo-nghiem-thu-2a.md
git commit -m "docs(rada-seo): nghiệm thu 2A trên bàn thử" -- docs/superpowers/plans/2026-09-30-rada-seo-nghiem-thu-2a.md
```

---

## Sau kế hoạch này

- **Triển khai lên VPS** (người dùng quyết): khai `ANTHROPIC_API_KEY` vào `cms/.env` trên VPS; sau deploy mở màn Rada SEO bấm "Bật lịch"; thêm site của mình (`kinhlac.online`, đánh dấu "của mình") và các đối thủ. Kiểm healthcheck có gọi vào container CMS (cron chỉ khởi động sau request đầu).
- **Kế hoạch 2B — lò viết:** hồ sơ cho Claude Code (khoảng trống + tóm tắt + bài đã có + tên từ điển), lịch Claude Code, route nộp bài xác thực bằng khoá `ec_pat_`, rào chắn luật + chống trùng + trùng từ điển, markdown → Portable Text (`markdownToPortableText` từ `emdash/client`), slug không dấu, ảnh, phiếu chấm `editorPanels`, IndexNow khi đăng.
- **Kế hoạch 3:** `/blog/` sang CMS, di chuyển `seo_*` + 22 nháp + đổi tên 3 bài vượt phạm vi, tab SEO Radar của app thành nút mở màn plugin.
