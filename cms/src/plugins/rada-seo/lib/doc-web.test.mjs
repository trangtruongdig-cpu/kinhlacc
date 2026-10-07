import { test } from "node:test";
import assert from "node:assert/strict";
import { urlDocDuoc, taoDocWeb, taoDocTrang, voiHanGio, TRAN_BYTE_THAN } from "./doc-web.mjs";

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

test("taoDocTrang: trả status + x-robots-tag + html kể cả khi không 2xx; URL cấm hay lỗi mạng → null", async () => {
	const goi = [];
	const fetchGia = async (url) => {
		goi.push(url);
		if (url.includes("hong")) throw new Error("mạng");
		if (url.includes("404")) return new Response("mất", { status: 404 });
		return new Response("<title>x</title>", { status: 200, headers: { "X-Robots-Tag": "noindex" } });
	};
	const doc = taoDocTrang(fetchGia);
	assert.deepEqual(await doc("https://a.com/ok"), { status: 200, xRobots: "noindex", html: "<title>x</title>" });
	assert.deepEqual(await doc("https://a.com/404"), { status: 404, xRobots: "", html: "mất" });
	assert.equal(await doc("https://a.com/hong"), null);
	assert.equal(await doc("http://127.0.0.1/huyet/"), null);
	assert.deepEqual(goi, ["https://a.com/ok", "https://a.com/404", "https://a.com/hong"]);
});

// ---- Trần cỡ thân (fix round 1) ----
/** Response thân luồng: `soKhoi` khối × `coKhoi` byte; `treo` = không bao giờ đóng luồng. */
function phanHoiLuong({ soKhoi = 0, coKhoi = 64 * 1024, treo = false, status = 200 } = {}) {
	const dem = { khoi: 0, huy: false };
	const khoi = new TextEncoder().encode("a".repeat(coKhoi));
	const body = new ReadableStream({
		pull(c) {
			if (dem.khoi < soKhoi) {
				dem.khoi++;
				c.enqueue(khoi);
			} else if (!treo) c.close();
			else return new Promise(() => {});
		},
		cancel() {
			dem.huy = true;
		},
	});
	return { res: new Response(body, { status }), dem };
}

test("taoDocWeb / taoDocTrang: đọc tối đa 1,5 MB rồi huỷ luồng; taoDocTrang đánh dấu catBot", async () => {
	const a = phanHoiLuong({ soKhoi: 80 }); // 5 MB
	const html = await taoDocWeb(async () => a.res)("https://a.com/to");
	assert.equal(html.length, TRAN_BYTE_THAN);
	assert.equal(a.dem.huy, true);
	assert.ok(a.dem.khoi < 30, `đọc ${a.dem.khoi} khối — không được đọc hết luồng`);

	const b = phanHoiLuong({ soKhoi: 80 });
	const r = await taoDocTrang(async () => b.res)("https://a.com/to");
	assert.equal(r.html.length, TRAN_BYTE_THAN);
	assert.equal(r.catBot, true);
	assert.equal(b.dem.huy, true);

	// Trang nhỏ: nguyên vẹn, không có cờ catBot.
	const c = phanHoiLuong({ soKhoi: 2, coKhoi: 10 });
	assert.deepEqual(await taoDocTrang(async () => c.res)("https://a.com/nho"), { status: 200, xRobots: "", html: "a".repeat(20) });
});

test("thân không có luồng (fetch giả chỉ có text()) vẫn bị cắt ở trần (khi content-length khai ≤ 5 MB)", async () => {
	const res = { ok: true, status: 200, headers: new Headers({ "content-length": String(TRAN_BYTE_THAN + 10) }), body: null, text: async () => "b".repeat(TRAN_BYTE_THAN + 10) };
	assert.equal((await taoDocWeb(async () => res)("https://a.com/x")).length, TRAN_BYTE_THAN);
	const r = await taoDocTrang(async () => res)("https://a.com/x");
	assert.equal(r.html.length, TRAN_BYTE_THAN);
	assert.equal(r.catBot, true);
});

test("hạn giờ phủ cả khâu đọc thân: header về ngay mà thân treo → hết hạn, không treo ca", async () => {
	const t0 = Date.now();
	const a = phanHoiLuong({ soKhoi: 1, treo: true });
	assert.equal(await taoDocWeb(async () => a.res, { hanGioMs: 80 })("https://a.com/treo"), "");
	const b = phanHoiLuong({ soKhoi: 1, treo: true });
	assert.equal(await taoDocTrang(async () => b.res, { hanGioMs: 80 })("https://a.com/treo"), null);
	assert.ok(Date.now() - t0 < 1000);
	assert.equal(b.dem.huy, true, "hết hạn thì huỷ luồng, không để nó chạy ngầm");
});

test("M5 không có luồng: content-length > 5 MB thì từ chối (không gọi text()); ≤ 5 MB thì đọc rồi cắt", async () => {
	let goiText = 0;
	const to = { ok: true, status: 200, headers: new Headers({ "content-length": String(6_000_000) }), body: null, text: async () => (goiText++, "x") };
	assert.equal(await taoDocWeb(async () => to)("https://a.com/to"), "");
	assert.equal(await taoDocTrang(async () => to)("https://a.com/to"), null);
	assert.equal(goiText, 0, "không được nuốt cả thân vào RAM");
	// Không khai độ dài thì không biết trước → cũng từ chối.
	const khongRo = { ok: true, status: 200, headers: new Headers(), body: null, text: async () => (goiText++, "x") };
	assert.equal(await taoDocTrang(async () => khongRo)("https://a.com/khong-ro"), null);
	assert.equal(goiText, 0);
	const vua = { ok: true, status: 200, headers: new Headers({ "content-length": String(TRAN_BYTE_THAN + 10) }), body: null, text: async () => "b".repeat(TRAN_BYTE_THAN + 10) };
	const r = await taoDocTrang(async () => vua)("https://a.com/vua");
	assert.equal(r.html.length, TRAN_BYTE_THAN);
	assert.equal(r.catBot, true);
});

// ---- Sửa sau nghiệm thu 2D: lý do tải hỏng phải là lý do THẬT ----
/** Lỗi kiểu undici: TypeError("fetch failed") với cause mang mã lỗi. */
const loiUndici = (code, message = code) => Object.assign(new TypeError("fetch failed"), { cause: Object.assign(new Error(message), { code }) });
/** Lỗi kiểu ctx.http.fetch của EmDash: bọc SsrfError. */
const loiEmdash = (host, msg) => {
	const ssrf = Object.assign(new Error(msg), { name: "SsrfError", code: "SSRF_BLOCKED" });
	return new Error(`Plugin "rada-seo": blocked fetch to "${host}": ${msg}`, { cause: ssrf });
};

test("taoDocTrang traLyDo: lỗi tải trả { loi } nói đúng nguyên nhân bằng tiếng Việt; mặc định vẫn null", async () => {
	const ca = [
		["https://het.vn/", () => new Promise(() => {}), "quá hạn 0.05 s"],
		["https://amp.chet.vn/", () => Promise.reject(loiEmdash("amp.chet.vn", "Could not resolve hostname: NXDOMAIN")), "không phân giải được tên miền"],
		["https://dns.vn/", () => Promise.reject(loiUndici("ENOTFOUND", "getaddrinfo ENOTFOUND dns.vn")), "không phân giải được tên miền"],
		["https://h2.vn/", () => Promise.reject(loiUndici("ERR_HTTP2_STREAM_ERROR", "Stream closed with error code NGHTTP2_PROTOCOL_ERROR")), "lỗi giao thức"],
		["https://hpe.vn/", () => Promise.reject(loiUndici("HPE_INVALID_HEADER_TOKEN", "Invalid header value char")), "lỗi giao thức"],
		// Chuyển hướng sang tên miền khác rồi bị lớp SSRF chặn: tên miền trong lời báo khác URL gửi.
		["https://tapchi.vn/a", () => Promise.reject(loiEmdash("dongy.example", "Hostname resolves to a non-public IP address")), "chuyển hướng sang tên miền khác bị chặn (dongy.example)"],
		["https://vong.vn/", () => Promise.reject(new Error('Plugin "rada-seo": too many redirects (max 5)')), "chuyển hướng quá nhiều lần"],
		["https://noi.vn/", () => Promise.reject(loiEmdash("noi.vn", "Hostname resolves to a non-public IP address")), "bị chặn (địa chỉ nội bộ)"],
		["https://tuchoi.vn/", () => Promise.reject(loiUndici("ECONNREFUSED")), "máy chủ từ chối kết nối"],
		["https://ngat.vn/", () => Promise.reject(loiUndici("ECONNRESET")), "kết nối bị ngắt giữa chừng"],
		["https://la.vn/", () => Promise.reject(new Error("điều gì đó lạ")), "lỗi mạng: điều gì đó lạ"],
	];
	for (const [url, hanh, mong] of ca) {
		const fetchGia = () => hanh();
		assert.deepEqual(await taoDocTrang(fetchGia, { hanGioMs: 50, traLyDo: true })(url), { loi: mong }, url);
		assert.equal(await taoDocTrang(fetchGia, { hanGioMs: 50 })(url), null, `${url} — mặc định giữ null cho kiem-duong`);
	}
	assert.deepEqual(await taoDocTrang(async () => new Response("x"), { traLyDo: true })("http://127.0.0.1/"), { loi: "bị chặn (địa chỉ nội bộ)" });
	// HTTP 403 vẫn là phản hồi: trả status như cũ.
	assert.equal((await taoDocTrang(async () => new Response("cấm", { status: 403 }), { traLyDo: true })("https://lc.vn/")).status, 403);
});

// Hàm này trả chuỗi rỗng khi hỏng, nên chỗ gọi không phân biệt được "trang rỗng" với "không đọc
// được". Ngày 02/10/2026 đúng chỗ đó làm mất một ca radar: timXuHuong ra 0 xu hướng, nhật ký ca
// sạch bong, chạy cùng hàm ngoài ca thì ra 50. `ghiLoi` là đường để lý do đi ra ngoài.
test("taoDocWeb: báo LÝ DO qua ghiLoi, mà vẫn trả chuỗi rỗng như cũ", async () => {
	const thu = [];
	const fetchGia = async (url) => {
		if (url.includes("hong")) throw new Error("mạng");
		return new Response("x", { status: url.includes("503") ? 503 : 200 });
	};
	const doc = taoDocWeb(fetchGia, { ghiLoi: (x) => thu.push(x) });
	assert.equal(await doc("https://a.com/ok"), "x", "lượt thành công KHÔNG báo gì");
	assert.deepEqual(thu, []);
	assert.equal(await doc("https://a.com/503"), "");
	assert.equal(await doc("https://a.com/hong"), "");
	assert.equal(await doc("http://localhost/x"), "");
	assert.deepEqual(thu.map((x) => x.lyDo), ["HTTP 503", "lỗi mạng: mạng", "đường dẫn không đọc được (địa chỉ nội bộ hay giao thức lạ)"]);
	assert.equal(thu[0].url, "https://a.com/503");
});

test("taoDocWeb: ghiLoi tự ném cũng KHÔNG làm hỏng lượt đọc", async () => {
	const doc = taoDocWeb(async () => new Response("x", { status: 500 }), {
		ghiLoi: () => { throw new Error("sổ hỏng") },
	});
	assert.equal(await doc("https://a.com/x"), "", "báo lỗi hỏng thì vẫn phải trả như cũ");
});

// ——— Đường lùi qua dịch vụ trung gian (mặc định TẮT) ———

test("trung gian: TẮT khi không khai gốc — 403 vẫn là 403, không gọi đi đâu khác", async () => {
	const goi = [];
	const doc = taoDocWeb(async (u) => (goi.push(u), new Response("chặn", { status: 403 })));
	assert.equal(await doc("https://lc.com/sitemap.xml"), "");
	assert.deepEqual(goi, ["https://lc.com/sitemap.xml"], "chỉ MỘT lượt, không đi đường vòng");
});

test("trung gian: 403 thì thử lại và trả được thân", async () => {
	const goi = [];
	const doc = taoDocWeb(
		async (u) => {
			goi.push(u);
			return u.startsWith("https://tg.test/")
				? new Response("<urlset><loc>https://lc.com/a</loc></urlset>", { status: 200 })
				: new Response("Just a moment...", { status: 403 });
		},
		{ gocTrungGian: "https://tg.test/" },
	);
	assert.match(await doc("https://lc.com/sitemap.xml"), /<loc>https:\/\/lc\.com\/a<\/loc>/);
	assert.deepEqual(goi, ["https://lc.com/sitemap.xml", "https://tg.test/https://lc.com/sitemap.xml"]);
});

test("trung gian: 404 KHÔNG thử lại — đốt lượt gọi cho URL chết", async () => {
	const goi = [];
	const doc = taoDocWeb(async (u) => (goi.push(u), new Response("mất", { status: 404 })), { gocTrungGian: "https://tg.test/" });
	assert.equal(await doc("https://lc.com/x"), "");
	assert.deepEqual(goi, ["https://lc.com/x"]);
});

test("trung gian: lỗi MẠNG không kích hoạt — chỉ mã từ chối bot mới có", async () => {
	const goi = [];
	const doc = taoDocWeb(
		async (u) => {
			goi.push(u);
			throw new Error("mạng");
		},
		{ gocTrungGian: "https://tg.test/" },
	);
	assert.equal(await doc("https://lc.com/x"), "");
	assert.deepEqual(goi, ["https://lc.com/x"]);
});

test("trung gian: hỏng nốt thì lý do nói rõ ĐÃ THỬ, không giấu mã gốc", async () => {
	const loi = [];
	const doc = taoDocWeb(
		async (u) => new Response("x", { status: u.startsWith("https://tg.test/") ? 451 : 403 }),
		{ gocTrungGian: "https://tg.test/", ghiLoi: (x) => loi.push(x) },
	);
	assert.equal(await doc("https://lc.com/x"), "");
	assert.equal(loi.length, 1, "một URL hỏng = MỘT dòng lý do");
	assert.match(loi[0].lyDo, /403/, "phải giữ mã gốc 403");
	assert.match(loi[0].lyDo, /trung gian/i, "phải nói đã đi đường trung gian");
	assert.equal(loi[0].url, "https://lc.com/x", "lý do gắn với URL THẬT, không phải URL trung gian");
});

test("trung gian: URL nội bộ không bao giờ được gửi sang dịch vụ ngoài", async () => {
	const goi = [];
	const doc = taoDocWeb(async (u) => (goi.push(u), new Response("x", { status: 403 })), { gocTrungGian: "https://tg.test/" });
	assert.equal(await doc("http://backend:3001/rada"), "");
	assert.deepEqual(goi, [], "chặn ngay ở urlDocDuoc, chưa gọi lượt nào");
});

test("trung gian: hạn giờ dùng hạn RIÊNG, dài hơn đường thẳng", async () => {
	const han = [];
	// fetch giả không bao giờ trả lời → lộ ra hạn giờ nào đang được dùng.
	const doc = taoDocWeb(
		async (u, init) => {
			if (u.startsWith("https://tg.test/")) {
				han.push("tg");
				return new Response("ok", { status: 200 });
			}
			return new Response("x", { status: 403 });
		},
		{ gocTrungGian: "https://tg.test/", hanGioMs: 50 },
	);
	assert.equal(await doc("https://lc.com/x"), "ok");
	assert.deepEqual(han, ["tg"]);
});
