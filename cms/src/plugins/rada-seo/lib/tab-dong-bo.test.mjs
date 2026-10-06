import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { routeChoTab } from "./tai-man.mjs";

const SRC = readFileSync(new URL("../admin.jsx", import.meta.url), "utf8");

/** Các `key:` trong khối `const TABS = [...]` của admin.jsx. */
function tabCuaThanh() {
	const i = SRC.indexOf("const TABS = [");
	assert.ok(i > 0, "không tìm thấy khối TABS trong admin.jsx");
	const khoi = SRC.slice(i, SRC.indexOf("\n];", i));
	return [...khoi.matchAll(/key:\s*"([^"]+)"/g)].map((m) => m[1]);
}

/** Các khoá của bảng `theoRoute` trong admin.jsx. */
function routeCoHamTai() {
	const i = SRC.indexOf("const theoRoute = {");
	assert.ok(i > 0, "không tìm thấy bảng theoRoute trong admin.jsx");
	const khoi = SRC.slice(i, SRC.indexOf("\n\t};", i));
	return new Set([...khoi.matchAll(/^\s*"?([a-z][\w-]*)"?:/gm)].map((m) => m[1]));
}

test("mọi tab trên thanh quy trình phải khai được route của nó", () => {
	// ⚠️ Thêm một tab đúng cách đòi sửa BA nơi ở HAI tệp: `TABS` và `theoRoute` (admin.jsx),
	// `THEO_TAB` (tai-man.mjs). Lệch bất kỳ cặp nào cho ra một tab RỖNG VĨNH VIỄN, không lỗi:
	// `routeChoTab` trả `[]` và `taiRoute` bỏ qua khoá lạ, cả hai KHÔNG ghi log.
	//
	// Phép kiểm cũ ở `tai-man.test.mjs` tự nhận canh việc này nhưng nó CHỈ đọc `tai-man.mjs` —
	// `admin.jsx` chỉ xuất hiện trong chú thích. Chốt hứa mà không thực hiện thì nguy hiểm hơn
	// không có chốt, vì người sửa tin là có.
	for (const tab of tabCuaThanh()) assert.doesNotThrow(() => routeChoTab(tab), `tab "${tab}" không khai được trong THEO_TAB`);
});

test("mọi route mà THEO_TAB nhắc phải có hàm tải trong admin.jsx", () => {
	const coHam = routeCoHamTai();
	for (const tab of [...tabCuaThanh(), "viec"])
		for (const r of routeChoTab(tab)) assert.ok(coHam.has(r), `tab "${tab}" cần route "${r}" nhưng admin.jsx KHÔNG có hàm tải cho nó`);
});

test("tab `viec` phải có thật trong admin.jsx — nó là tab MẶC ĐỊNH", () => {
	// Nó không nằm trong TABS (đứng riêng trên thanh), nên chốt riêng.
	assert.match(SRC, /tab === "viec"/, "admin.jsx không render tab `viec`");
	assert.match(SRC, /return v === "viec" \|\| TABS\.some/, "tabDaLuu không còn nhận `viec` làm giá trị hợp lệ");
});
