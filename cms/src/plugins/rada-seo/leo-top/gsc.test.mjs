import { test } from "node:test";
import assert from "node:assert/strict";
import { taoGsc } from "./gsc.mjs";

const ENV = {
	GSC_OAUTH_CLIENT_ID: "cid",
	GSC_OAUTH_CLIENT_SECRET: "csec",
	GSC_OAUTH_REFRESH_TOKEN: "rt",
	GSC_SITE_URL: "https://kinhlac.online/",
};
const NOW = Date.parse("2026-09-30T05:00:00Z");

const hang = (q, p, position, impressions, clicks = 0) => ({ keys: [q, p], position, impressions, clicks, ctr: 0 });
const HANG = [
	hang("huyệt thần môn", "https://kinhlac.online/huyet/than-mon/", 6.2, 300, 4),
	hang("mất ngủ đông y", "https://kinhlac.online/blog/mat-ngu/", 12, 900, 2),
	hang("tam âm giao", "https://kinhlac.online/huyet/tam-am-giao/", 2.5, 5000, 90), // đã top 3
	hang("kinh phế", "https://kinhlac.online/kinh/phe/", 55, 800), // ngoài 50
	hang("huyệt hiếm", "https://kinhlac.online/huyet/hiem/", 8, 3), // hiển thị quá ít
	hang("bấm huyệt ngủ ngon", "https://kinhlac.online/blog/bam-huyet/", 30, 100),
];

/** fetch giả: ghi lại mọi lời gọi, trả token rồi trả hàng GSC. */
function taoFetch({ hangs = HANG, token = { access_token: "tok1", expires_in: 3600 }, loiQuery = null, loiToken = null } = {}) {
	const goi = [];
	const f = async (url, init = {}) => {
		goi.push({ url: String(url), init });
		if (String(url).startsWith("https://oauth2.googleapis.com/token")) {
			if (loiToken) return new Response(JSON.stringify({ error: "invalid_grant" }), { status: loiToken });
			return new Response(JSON.stringify(token), { status: 200 });
		}
		if (loiQuery) return new Response(JSON.stringify({ error: { message: "denied" } }), { status: loiQuery });
		return new Response(JSON.stringify({ rows: hangs }), { status: 200 });
	};
	f.goi = goi;
	return f;
}

test("lấy token bằng refresh token rồi truy vấn đúng URL/body", async () => {
	const fetch = taoFetch();
	const g = taoGsc({ fetch, env: ENV, now: () => NOW });
	assert.equal(g.coCauHinh(), true);
	await g.layTuKhoaLeoTop({});
	assert.equal(fetch.goi.length, 2);
	const [tk, q] = fetch.goi;
	assert.equal(tk.url, "https://oauth2.googleapis.com/token");
	assert.equal(tk.init.method, "POST");
	const p = new URLSearchParams(String(tk.init.body));
	assert.equal(p.get("grant_type"), "refresh_token");
	assert.equal(p.get("client_id"), "cid");
	assert.equal(p.get("client_secret"), "csec");
	assert.equal(p.get("refresh_token"), "rt");
	assert.equal(
		q.url,
		"https://searchconsole.googleapis.com/webmasters/v3/sites/" +
			encodeURIComponent("https://kinhlac.online/") +
			"/searchAnalytics/query",
	);
	assert.equal(q.init.method, "POST");
	assert.equal(new Headers(q.init.headers).get("authorization"), "Bearer tok1");
	const body = JSON.parse(q.init.body);
	assert.deepEqual(body.dimensions, ["query", "page"]);
	assert.equal(body.rowLimit, 25000);
	assert.equal(body.dataState, "all");
	assert.equal(body.endDate, "2026-09-30");
	assert.equal(body.startDate, "2026-09-02");
});

test("lọc hạng 4–50, hiển thị ≥ 5, xếp theo cơ hội", async () => {
	const g = taoGsc({ fetch: taoFetch(), env: ENV, now: () => NOW });
	const ds = await g.layTuKhoaLeoTop({});
	assert.deepEqual(ds.map((x) => x.tuKhoa), ["mất ngủ đông y", "huyệt thần môn", "bấm huyệt ngủ ngon"]);
	const d = ds[0];
	assert.equal(d.trang, "https://kinhlac.online/blog/mat-ngu/");
	assert.equal(d.viTri, 12);
	assert.equal(d.hienThi, 900);
	assert.equal(d.nhap, 2);
	// coHoi = hienThi × (viTriMax + 1 − viTri) — giữ công thức của backend.
	assert.equal(d.coHoi, 900 * (50 + 1 - 12));
	assert.equal(ds[1].coHoi, Math.round(300 * (51 - 6.2)));
});

test("toiDa cắt danh sách; boQua loại đúng khoá tuKhoa|trang", async () => {
	const g = taoGsc({ fetch: taoFetch(), env: ENV, now: () => NOW });
	assert.equal((await g.layTuKhoaLeoTop({ toiDa: 1 })).length, 1);
	const boQua = new Set(["mất ngủ đông y|https://kinhlac.online/blog/mat-ngu/"]);
	const ds = await g.layTuKhoaLeoTop({ boQua });
	assert.deepEqual(ds.map((x) => x.tuKhoa), ["huyệt thần môn", "bấm huyệt ngủ ngon"]);
	// Cùng từ khoá nhưng trang KHÁC thì không bị bỏ.
	const ds2 = await g.layTuKhoaLeoTop({ boQua: new Set(["mất ngủ đông y|https://kinhlac.online/khac/"]) });
	assert.equal(ds2[0].tuKhoa, "mất ngủ đông y");
});

test("token dùng lại trong hạn, lấy mới khi sắp hết hạn (đệm 60 s)", async () => {
	let t = NOW;
	const fetch = taoFetch({ token: { access_token: "tok1", expires_in: 3600 } });
	const g = taoGsc({ fetch, env: ENV, now: () => t });
	await g.layTuKhoaLeoTop({});
	t += 3000 * 1000; // còn 600 s
	await g.layTuKhoaLeoTop({});
	assert.equal(fetch.goi.filter((x) => x.url.includes("oauth2")).length, 1);
	t = NOW + (3600 - 59) * 1000; // trong vùng đệm 60 s cuối → lấy mới
	await g.layTuKhoaLeoTop({});
	assert.equal(fetch.goi.filter((x) => x.url.includes("oauth2")).length, 2);
});

test("thiếu biến → coCauHinh()=false và báo lỗi tiếng Việt có tên biến, không gọi mạng", async () => {
	const fetch = taoFetch();
	const g = taoGsc({ fetch, env: { GSC_OAUTH_CLIENT_ID: "cid" }, now: () => NOW });
	assert.equal(g.coCauHinh(), false);
	await assert.rejects(g.layTuKhoaLeoTop({}), (e) => {
		assert.match(e.message, /GSC_OAUTH_CLIENT_SECRET/);
		assert.match(e.message, /GSC_OAUTH_REFRESH_TOKEN/);
		assert.doesNotMatch(e.message, /GSC_OAUTH_CLIENT_ID/);
		assert.match(e.message, /Chưa cấu hình/);
		return true;
	});
	await assert.rejects(g.layViTri({ tuKhoa: "a", trang: "b" }), /Chưa cấu hình/);
	assert.equal(fetch.goi.length, 0);
});

test("lỗi 403 chỉ ra quyền trên property; token hỏng chỉ ra biến refresh token", async () => {
	const g403 = taoGsc({ fetch: taoFetch({ loiQuery: 403 }), env: ENV, now: () => NOW });
	await assert.rejects(g403.layTuKhoaLeoTop({}), (e) => {
		assert.match(e.message, /quyền/);
		assert.match(e.message, /https:\/\/kinhlac\.online\//);
		assert.match(e.message, /GSC_SITE_URL/);
		return true;
	});
	const g401 = taoGsc({ fetch: taoFetch({ loiQuery: 401 }), env: ENV, now: () => NOW });
	await assert.rejects(g401.layTuKhoaLeoTop({}), /GSC_OAUTH_REFRESH_TOKEN/);
	const gTok = taoGsc({ fetch: taoFetch({ loiToken: 400 }), env: ENV, now: () => NOW });
	await assert.rejects(gTok.layTuKhoaLeoTop({}), (e) => {
		assert.match(e.message, /GSC_OAUTH_REFRESH_TOKEN/);
		assert.match(e.message, /GSC_OAUTH_CLIENT_ID|GSC_OAUTH_CLIENT_SECRET/);
		return true;
	});
});

test("layViTri lọc đúng từ khoá + trang trong 14 ngày; không có hàng → null", async () => {
	const fetch = taoFetch({ hangs: [hang("huyệt thần môn", "https://kinhlac.online/huyet/than-mon/", 4.4, 120)] });
	const g = taoGsc({ fetch, env: ENV, now: () => NOW });
	const r = await g.layViTri({ tuKhoa: "huyệt thần môn", trang: "https://kinhlac.online/huyet/than-mon/" });
	assert.deepEqual(r, { viTri: 4.4, hienThi: 120 });
	const body = JSON.parse(fetch.goi.at(-1).init.body);
	assert.equal(body.startDate, "2026-09-16");
	const loc = body.dimensionFilterGroups[0].filters;
	assert.deepEqual(
		loc.map((f) => [f.dimension, f.operator, f.expression]),
		[
			["query", "equals", "huyệt thần môn"],
			["page", "equals", "https://kinhlac.online/huyet/than-mon/"],
		],
	);
	const g0 = taoGsc({ fetch: taoFetch({ hangs: [] }), env: ENV, now: () => NOW });
	assert.equal(await g0.layViTri({ tuKhoa: "x", trang: "y" }), null);
});
