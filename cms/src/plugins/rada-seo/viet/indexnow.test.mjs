import { test } from "node:test";
import assert from "node:assert/strict";
import * as ix from "./indexnow.mjs";
import * as kho from "../kho.mjs";
import { taoKhoGia, taoKvGia } from "../__test__/kho-gia.mjs";

const ENV = { RADA_SEO_CA_DEM: "1" };
const KHOA = "3ca42ea20a96a20d494868c1877e263c";
const BAI = "https://kinhlac.online/blog/huyet-hop-coc/";
const DS = "https://kinhlac.online/blog/";
const API = "https://api.indexnow.org/indexnow";

/** fetch giả: `trang` = hàng đợi phản hồi cho GET trang bài (phần tử cuối lặp lại); `api` cho POST. */
function fetchGia({ trang = [200], api = { status: 200, body: "" } } = {}) {
	const goi = [];
	let i = 0;
	const fn = async (url, init = {}) => {
		goi.push({ url: String(url), method: init.method ?? "GET", body: init.body, headers: init.headers });
		if (String(url) === API) {
			if (api instanceof Error) throw api;
			return new Response(api.body ?? "", { status: api.status });
		}
		const x = trang[Math.min(i++, trang.length - 1)];
		if (x instanceof Error) throw x;
		if (typeof x === "object") return new Response("<html></html>", x);
		return new Response("<html></html>", { status: x });
	};
	fn.goi = goi;
	return fn;
}
function boThu(tuyChon = {}) {
	const ghi = [];
	const ngu = [];
	const dong = { ms: Date.parse("2026-10-01T07:05:00.000Z") };
	return {
		s: taoKhoGia(),
		kv: taoKvGia(),
		log: { info: (...a) => ghi.push(["info", ...a]), warn: (...a) => ghi.push(["warn", ...a]), error: (...a) => ghi.push(["error", ...a]) },
		fetch: fetchGia(tuyChon),
		env: ENV,
		nghi: async (ms) => { ngu.push(ms); },
		now: () => dong.ms,
		ghi, ngu, dong,
	};
}
const VIEC = { id: "c1", slug: "huyet-hop-coc", kieu: "dang" };
const post = (b) => b.fetch.goi.filter((g) => g.method === "POST");

test("cauHinh: khoá + gốc lấy từ env, có mặc định; chỉ bật khi RADA_SEO_CA_DEM=1; EMDASH_SITE_URL hỏng → mặc định", () => {
	assert.deepEqual(ix.cauHinh({}), { bat: false, key: KHOA, goc: "https://kinhlac.online", host: "kinhlac.online", keyLocation: `https://kinhlac.online/${KHOA}.txt` });
	const c = ix.cauHinh({ RADA_SEO_CA_DEM: "1", INDEXNOW_KEY: " abc123 ", EMDASH_SITE_URL: "https://thu.example.vn/duong/" });
	assert.deepEqual(c, { bat: true, key: "abc123", goc: "https://thu.example.vn", host: "thu.example.vn", keyLocation: "https://thu.example.vn/abc123.txt" });
	assert.equal(ix.cauHinh({ EMDASH_SITE_URL: "không phải url" }).goc, "https://kinhlac.online");
	assert.equal(ix.cauHinh({ RADA_SEO_CA_DEM: "true" }).bat, false);
	assert.equal(ix.cauHinh({ INDEXNOW_KEY: "  " }).key, KHOA);
});

test("urlBao: trang bài (có / cuối) + trang danh sách", () => {
	assert.deepEqual(ix.urlBao("https://kinhlac.online", "huyet-hop-coc"), [BAI, DS]);
});

test("đăng: trang lên 200 ngay → POST đúng hình {host,key,keyLocation,urlList}; ghi nhap.indexNow + dòng ca kiểu indexnow", async () => {
	const b = boThu();
	await kho.themNhap(b.s, { keHoachId: "k1", contentId: "c1", slug: "huyet-hop-coc", tieuDe: "t", phieu: {} }, "2026-09-30T00:00:00.000Z");
	const kq = await ix.baoIndexNow(VIEC, b);
	assert.deepEqual(kq, { ok: true, ma: 200 });
	assert.equal(b.fetch.goi[0].url, BAI);
	assert.equal(b.fetch.goi[0].method, "GET");
	const p = post(b);
	assert.equal(p.length, 1);
	assert.equal(p[0].url, API);
	assert.match(p[0].headers["Content-Type"], /^application\/json/);
	assert.deepEqual(JSON.parse(p[0].body), { host: "kinhlac.online", key: KHOA, keyLocation: `https://kinhlac.online/${KHOA}.txt`, urlList: [BAI, DS] });
	assert.deepEqual(b.ngu, [], "trang lên ngay thì không chờ");
	const n = await b.s.nhap.get("c1");
	assert.deepEqual(n.indexNow, { luc: "2026-10-01T07:05:00.000Z", ok: true, ma: 200 });
	assert.equal(n.trangThai, "cho_duyet", "không đụng trường khác của nháp");
	const ca = await kho.dsCa(b.s, 10);
	assert.equal(ca.length, 1);
	assert.equal(ca[0].loai, "indexnow");
	assert.equal(ca[0].kieu, "dang");
	assert.equal(ca[0].slug, "huyet-hop-coc");
	assert.equal(ca[0].ok, true);
	assert.equal(ca[0].ma, 200);
	assert.deepEqual(ca[0].loi, []);
	assert.equal(typeof ca[0].batDau, "string");
	assert.ok(ca[0].ketThuc);
	assert.ok(!JSON.stringify(ca[0]).includes(KHOA), "nhật ký không in khoá");
});

test("202 cũng là được nhận; bài người viết (không có nhap) vẫn báo, chỉ ghi dòng ca", async () => {
	const b = boThu({ api: { status: 202 } });
	assert.deepEqual(await ix.baoIndexNow(VIEC, b), { ok: true, ma: 202 });
	assert.equal(await b.s.nhap.get("c1"), null, "không tự đẻ bản ghi nháp");
	assert.equal((await kho.dsCa(b.s, 10)).length, 1);
});

test("bộ đệm còn giữ bản chưa đăng: 404, 404 rồi 200 → chờ 3 s hai lần rồi mới báo", async () => {
	const b = boThu({ trang: [404, 404, 200] });
	assert.deepEqual(await ix.baoIndexNow(VIEC, b), { ok: true, ma: 200 });
	assert.deepEqual(b.ngu, [3000, 3000]);
	assert.equal(post(b).length, 1);
});

test("trang chưa lên 200 sau 4 lần → ghi lỗi, KHÔNG báo; mốc chống lặp được gỡ để lần đăng lại thử được", async () => {
	const b = boThu({ trang: [404] });
	await kho.themNhap(b.s, { keHoachId: "k1", contentId: "c1", slug: "huyet-hop-coc", tieuDe: "t", phieu: {} }, "2026-09-30T00:00:00.000Z");
	const kq = await ix.baoIndexNow(VIEC, b);
	assert.equal(kq.ok, false);
	assert.equal(kq.ma, null);
	assert.match(kq.loi, /chưa lên 200 sau 4 lần/);
	assert.match(kq.loi, /HTTP 404/);
	assert.equal(b.fetch.goi.length, 4);
	assert.deepEqual(b.ngu, [3000, 3000, 3000], "không ngủ sau lần cuối");
	assert.equal(post(b).length, 0);
	const n = await b.s.nhap.get("c1");
	assert.equal(n.indexNow.ok, false);
	assert.equal(n.indexNow.loi, kq.loi);
	const [ca] = await kho.dsCa(b.s, 10);
	assert.deepEqual(ca.loi, [`/blog/huyet-hop-coc/: ${kq.loi}`]);
	assert.equal(await b.kv.get("indexnow:dang:huyet-hop-coc"), null);
});

test("trang không tải được (lỗi mạng) cũng tính là chưa lên, nêu lý do", async () => {
	const b = boThu({ trang: [Object.assign(new Error("fetch failed"), { cause: { code: "ECONNREFUSED" } })] });
	const kq = await ix.baoIndexNow(VIEC, b);
	assert.equal(kq.ok, false);
	assert.match(kq.loi, /từ chối kết nối/);
	assert.equal(post(b).length, 0);
});

test("trang 200 nhưng mang x-robots-tag noindex → không báo", async () => {
	const b = boThu({ trang: [{ status: 200, headers: { "x-robots-tag": "noindex" } }] });
	const kq = await ix.baoIndexNow(VIEC, b);
	assert.equal(kq.ok, false);
	assert.match(kq.loi, /noindex/);
	assert.equal(post(b).length, 0);
});

test("IndexNow trả mã khác 200/202 → lỗi kèm mã + 200 ký tự đầu của thân", async () => {
	const b = boThu({ api: { status: 422, body: `{"message":"${"x".repeat(400)}"}` } });
	const kq = await ix.baoIndexNow(VIEC, b);
	assert.equal(kq.ok, false);
	assert.equal(kq.ma, 422);
	assert.ok(kq.loi.startsWith("HTTP 422: {\"message\":\"xxx"));
	assert.equal(kq.loi.length, "HTTP 422: ".length + 200);
	const [ca] = await kho.dsCa(b.s, 10);
	assert.equal(ca.ok, false);
	assert.equal(ca.ma, 422);
	assert.equal(await b.kv.get("indexnow:dang:huyet-hop-coc"), null, "hỏng thì lần sau thử lại được");
});

test("lời gọi IndexNow ném (mạng) → lỗi được ghi, không ném ra ngoài", async () => {
	const b = boThu({ api: new Error("fetch failed") });
	const kq = await ix.baoIndexNow(VIEC, b);
	assert.equal(kq.ok, false);
	assert.equal(kq.ma, null);
	assert.match(kq.loi, /fetch failed/);
	assert.equal((await kho.dsCa(b.s, 10)).length, 1);
});

test("chống lặp: cùng slug trong 10 phút không báo lần hai; quá 10 phút thì báo lại", async () => {
	const b = boThu();
	await ix.baoIndexNow(VIEC, b);
	b.dong.ms += 9 * 60 * 1000;
	assert.deepEqual(await ix.baoIndexNow(VIEC, b), { boQua: "vua_bao" });
	assert.equal(post(b).length, 1);
	assert.equal((await kho.dsCa(b.s, 10)).length, 1, "lượt bỏ qua không ghi nhật ký");
	b.dong.ms += 2 * 60 * 1000;
	assert.deepEqual(await ix.baoIndexNow(VIEC, b), { ok: true, ma: 200 });
	assert.equal(post(b).length, 2);
	assert.equal((await kho.dsCa(b.s, 10)).length, 2);
});

test("gỡ bài: báo cùng hai URL, KHÔNG chờ trang 200; mốc chống lặp riêng với lượt đăng", async () => {
	const b = boThu({ trang: [404] });
	await ix.baoIndexNow(VIEC, { ...b, fetch: fetchGia() });
	const kq = await ix.baoIndexNow({ ...VIEC, kieu: "go" }, b);
	assert.deepEqual(kq, { ok: true, ma: 200 });
	assert.equal(b.fetch.goi.length, 1);
	assert.deepEqual(JSON.parse(b.fetch.goi[0].body).urlList, [BAI, DS]);
	const ca = await kho.dsCa(b.s, 10);
	assert.equal(ca.filter((c) => c.kieu === "go").length, 1);
	assert.equal(ca.filter((c) => c.kieu === "dang").length, 1, "đăng rồi gỡ trong cùng mili-giây vẫn là hai dòng nhật ký");
});

test("baoIndexNow không bao giờ ném: kho hỏng → log, trả lỗi", async () => {
	const b = boThu();
	b.s.ca.put = async () => { throw new Error("kho sập"); };
	const kq = await ix.baoIndexNow(VIEC, b);
	assert.equal(kq.ok, true, "đã báo được thì kết quả vẫn là được");
	assert.ok(b.ghi.some((g) => g[0] === "error"));
	const c = boThu();
	c.kv.get = async () => { throw new Error("kv sập"); };
	const kq2 = await ix.baoIndexNow(VIEC, c);
	assert.equal(kq2.ok, false);
	assert.equal(post(c).length, 0);
});

// ---- thaIndexNow: quyết định ĐỒNG BỘ trong hook, việc thật chạy nền ----
const ctxGia = (b) => ({ storage: b.s, kv: b.kv, log: b.log, http: { fetch: b.fetch } });
const suKien = (them = {}, collection = "bai_viet") => ({ collection, content: { id: "c1", slug: "huyet-hop-coc", ...them } });
const tuy = (b, env = ENV) => ({ env, nghi: b.nghi, now: b.now });

test("thaIndexNow: không bật RADA_SEO_CA_DEM → không làm gì (máy dev không báo)", () => {
	const b = boThu();
	assert.equal(ix.thaIndexNow(suKien(), ctxGia(b), "dang", tuy(b, {})), null);
	assert.equal(b.fetch.goi.length, 0);
});

test("thaIndexNow: bộ khác, slug rỗng, bài noIndex → bỏ qua", () => {
	const b = boThu();
	assert.equal(ix.thaIndexNow(suKien({}, "posts"), ctxGia(b), "dang", tuy(b)), null);
	assert.equal(ix.thaIndexNow(suKien({ slug: "" }), ctxGia(b), "dang", tuy(b)), null);
	assert.equal(ix.thaIndexNow(suKien({ slug: undefined }), ctxGia(b), "dang", tuy(b)), null);
	assert.equal(ix.thaIndexNow(suKien({ seo: { noIndex: true } }), ctxGia(b), "dang", tuy(b)), null);
	assert.equal(ix.thaIndexNow(undefined, ctxGia(b), "dang", tuy(b)), null);
	assert.equal(ix.thaIndexNow(suKien(), undefined, "dang", tuy(b)), null);
	assert.equal(b.fetch.goi.length, 0);
});

test("thaIndexNow: bật → trả promise của việc nền (hook không await), việc nền báo và ghi", async () => {
	const b = boThu();
	const p = ix.thaIndexNow(suKien({ seo: { noIndex: false } }), ctxGia(b), "dang", tuy(b));
	assert.ok(p instanceof Promise);
	assert.deepEqual(await p, { ok: true, ma: 200 });
	assert.equal(post(b).length, 1);
	const pg = ix.thaIndexNow(suKien(), ctxGia(b), "go", tuy(b));
	assert.deepEqual(await pg, { ok: true, ma: 200 });
});

test("thaIndexNow: ctx thiếu http → không ném, promise trả lỗi", async () => {
	const b = boThu();
	const p = ix.thaIndexNow(suKien(), { storage: b.s, kv: b.kv, log: b.log }, "dang", tuy(b));
	const kq = await p;
	assert.equal(kq?.ok, false);
});

test("chuIndexNow: chữ cho tab Nháp — giờ VN dạng HH:mm DD/MM, hoặc lỗi + lý do; chưa báo → rỗng", () => {
	assert.equal(ix.chuIndexNow({ luc: "2026-10-01T07:05:00.000Z", ok: true, ma: 200 }), "IndexNow: đã báo 14:05 01/10");
	assert.equal(ix.chuIndexNow({ luc: "2026-10-01T07:05:00.000Z", ok: false, ma: 422, loi: "HTTP 422: sai khoá" }), "IndexNow: lỗi HTTP 422: sai khoá");
	assert.equal(ix.chuIndexNow({ ok: false }), "IndexNow: lỗi không rõ");
	assert.equal(ix.chuIndexNow(undefined), "");
	assert.equal(ix.chuIndexNow(null), "");
});
