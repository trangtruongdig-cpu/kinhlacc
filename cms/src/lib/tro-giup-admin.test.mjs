/**
 * node --test src/lib/tro-giup-admin.test.mjs
 *
 * Chạy mảnh trợ giúp trên một TRANG GIẢ mô phỏng khu quản trị, trong Chromium thật.
 *
 * ⚠️ GIỚI HẠN PHẢI BIẾT: trang giả do tôi dựng theo những gì đọc được trong
 * `@emdash-cms/admin/dist`, KHÔNG phải ảnh chụp DOM thật (không vào được khu quản trị
 * mà không có phiên đăng nhập). Nên phép kiểm này chứng minh LOGIC đúng — dò được ô,
 * gọi đúng API, dựng đúng câu, sửa đúng href — chứ KHÔNG chứng minh selector khớp với
 * bản EmDash đang chạy. Chỗ đó chỉ có người mở khu quản trị mới xác nhận được, và mảnh
 * mã tự kêu bằng console.warn khi dò trượt.
 *
 * Bỏ qua khi máy không có Playwright — phép kiểm này là phần thêm, không phải cổng chặn.
 */

import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { resolve } from "node:path";

/** Mượn hàm dựng mảnh mã từ nguồn TS (Node 26 tự lột kiểu). */
const { scriptTroGiupAdmin } = await import("./tro-giup-admin.ts");

let chromium = null;
try {
	const require = createRequire(import.meta.url);
	chromium = require(
		resolve(process.env.NPM_ROOT_G || "/opt/homebrew/lib/node_modules", "playwright"),
	).chromium;
} catch {
	/* không có Playwright — các phép kiểm dưới sẽ tự bỏ qua */
}

/** Trang giả: thanh trên có nút View Site, thân có ô đường dẫn kèm nhãn. */
const TRANG_GIA = `<!doctype html><html><head><title>giả</title></head><body>
<header><a href="/">View Site</a></header>
<main>
  <div>
    <label for="o-slug">Slug</label>
    <input id="o-slug" type="text" value="kim-quy-yeau-luoc">
  </div>
</main>
</body></html>`;

describe("mảnh trợ giúp khu quản trị", { skip: chromium ? false : "không có Playwright" }, () => {
	let trinh;
	before(async () => {
		trinh = await chromium.launch();
	});
	after(async () => {
		await trinh?.close();
	});

	/** Mở trang giả ở đúng đường của một mục đang sửa, với API bị giả lập. */
	async function moTrang(apiGia) {
		const trang = await trinh.newPage();
		const than = [];
		trang.on("pageerror", (e) => than.push(`pageerror: ${e.message}`));
		trang.on("console", (m) => {
			if (m.type() === "error") than.push(`console.error: ${m.text()}`);
		});

		await trang.route("**/*", async (route) => {
			const u = new URL(route.request().url());
			if (u.pathname.startsWith("/_emdash/api/")) {
				const d = apiGia(u);
				return route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify(d ?? {}),
				});
			}
			return route.fulfill({ status: 200, contentType: "text/html", body: TRANG_GIA });
		});

		await trang.goto("https://vi-du.test/_emdash/admin/content/nguon_y_van/01ABC");
		await trang.addScriptTag({ content: scriptTroGiupAdmin("https://kinhlac.online") });
		await trang.waitForTimeout(300);
		return { trang, than };
	}

	const API_MAC_DINH = (u) => {
		if (u.pathname === "/_emdash/api/content/nguon_y_van/01ABC")
			return { data: { slug: "kim-quy-yeau-luoc", status: "published", title: "Kim Quỹ Yếu Lược" } };
		if (u.pathname === "/_emdash/api/collections/nguon_y_van")
			return { data: { urlPattern: "/nguon/{slug}/" } };
		if (u.pathname === "/_emdash/api/content/nguon_y_van") return { data: [] };
		return {};
	};

	test('nút "View Site" trỏ tới trang thật của mục đang sửa', async () => {
		const { trang, than } = await moTrang(API_MAC_DINH);
		await trang.waitForTimeout(400);
		const href = await trang.getAttribute("header a", "href");
		assert.equal(href, "https://kinhlac.online/nguon/kim-quy-yeau-luoc/");
		assert.equal(await trang.getAttribute("header a", "target"), "_blank");
		assert.deepEqual(than, []);
		await trang.close();
	});

	test("đổi đường dẫn của mục ĐÃ ĐĂNG thì hiện cảnh báo trang tĩnh", async () => {
		const { trang, than } = await moTrang(API_MAC_DINH);
		await trang.waitForTimeout(400);
		await trang.fill("#o-slug", "kim-quy-yeu-luoc"); // sửa lỗi gõ "yeau" → "yeu"
		await trang.waitForTimeout(700);
		const chu = await trang.textContent(".kinhlac-canh-bao");
		assert.match(chu, /đã đăng với đường dẫn "kim-quy-yeau-luoc"/);
		assert.match(chu, /nginx phục vụ thẳng/);
		assert.deepEqual(than, []);
		await trang.close();
	});

	test("đường dẫn trùng mục khác thì báo NGAY, chưa cần bấm Lưu", async () => {
		const { trang, than } = await moTrang((u) => {
			if (u.pathname === "/_emdash/api/content/nguon_y_van" && u.searchParams.get("q") === "thuong-han-luan")
				return { data: [{ id: "01XYZ", slug: "thuong-han-luan", title: "Thương Hàn Luận" }] };
			return API_MAC_DINH(u);
		});
		await trang.waitForTimeout(400);
		await trang.fill("#o-slug", "thuong-han-luan");
		await trang.waitForTimeout(800);
		const chu = await trang.textContent(".kinhlac-canh-bao");
		assert.match(chu, /Thương Hàn Luận/);
		assert.match(chu, /Lưu sẽ bị từ chối/);
		assert.deepEqual(than, []);
		await trang.close();
	});

	test("chính mục đang sửa giữ slug đó thì KHÔNG báo trùng", async () => {
		// Bẫy dễ dính nhất: API trả về chính mục đang mở, lọc thiếu `id !== m.id` là
		// người biên tập bị báo "trùng" với chính mình ngay khi vừa mở trang.
		const { trang } = await moTrang((u) => {
			if (u.pathname === "/_emdash/api/content/nguon_y_van")
				return { data: [{ id: "01ABC", slug: "kim-quy-yeau-luoc", title: "Kim Quỹ Yếu Lược" }] };
			return API_MAC_DINH(u);
		});
		await trang.waitForTimeout(900);
		const hien = await trang.evaluate(() => {
			const k = document.querySelector(".kinhlac-canh-bao");
			return k ? getComputedStyle(k).display : "không có";
		});
		assert.notEqual(hien, "block");
		await trang.close();
	});

	test("dò trượt ô đường dẫn thì KÊU chứ không im", async () => {
		const trang = await trinh.newPage();
		const than = [];
		trang.on("console", (m) => than.push(m.text()));
		await trang.route("**/*", (r) =>
			r.fulfill({
				status: 200,
				contentType: "text/html",
				body: "<!doctype html><html><body><main>không có ô nào</main></body></html>",
			}),
		);
		await trang.goto("https://vi-du.test/_emdash/admin/content/nguon_y_van/01ABC");
		await trang.addScriptTag({ content: scriptTroGiupAdmin("https://kinhlac.online") });
		await trang.waitForTimeout(400);
		assert.ok(
			than.some((d) => d.includes("KHÔNG dò ra ô đường dẫn")),
			"phải ghi console.warn khi không dò ra ô đường dẫn",
		);
		await trang.close();
	});
});
