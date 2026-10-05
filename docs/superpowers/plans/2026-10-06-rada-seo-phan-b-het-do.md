# Rada SEO phần B — hết đơ

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cắt số lượt đi-về CSDL khi mở màn Rada SEO từ 19 xuống 11, và làm mỗi cú bấm nút không còn kéo lại toàn bộ `tong-quan`.

**Architecture:** Ba thay đổi độc lập nhau. (1) Danh sách "route nào gọi lúc nào" tách thành một module THUẦN có phép kiểm, rồi `admin.jsx` đọc từ đó — ba route tổng quan chuyển sang tải-khi-mở-tab. (2) Hành động ghi cập nhật state CỤC BỘ thay cho gọi lại `tong-quan`. (3) Mỗi nút tự mang trạng thái bận của chính nó, thay cho một cờ toàn cục in ở cuối thanh quy trình.

**Tech Stack:** React (JSX, không TypeScript) trong plugin EmDash native · `node --test` cho phép kiểm `.mjs` · Kysely + `pg.Pool` (`max: 1`) tới Postgres Aiven.

## Global Constraints

Đặc tả: `docs/superpowers/specs/2026-10-06-rada-seo-man-viec-design.md` (phần B).

- **Pool CSDL của CMS là `max: 1`** — mọi truy vấn xếp hàng, `Promise.all` KHÔNG nhanh hơn. Chỉ **giảm SỐ truy vấn** mới nhanh. RTT tới Aiven đo được **98,9 ms**.
- **Con số thật của phần B: 19 lượt → 11 lượt.** Spec ghi "→ 4" và con số đó đúng, nhưng chỉ đạt khi có phần A (tab Việc thành tab mặc định, `tong-quan` cũng tải-khi-mở-tab). Phần B một mình vẫn phải gọi `tong-quan` vì tab Radar còn là tab mở đầu. **Đừng ghi 4 vào ghi chú hay commit của phần này.**
- **`X-EmDash-Request: 1`** trong mọi lời gọi `fetch` là thứ CHỊU LỰC — bỏ đi thì máy dev vẫn chạy còn production trả **403 CSRF_REJECTED**.
- **Phép kiểm chạy bằng** `node --test "cms/src/plugins/rada-seo/**/*.test.mjs"`. Dùng `--test-concurrency=2` khi cần tín hiệu sạch (chạy song song mặc định làm hai phép kiểm nhạy thời gian trượt giả).
- **KHÔNG optimistic update.** Dòng chỉ rời hàng đợi / state chỉ đổi khi máy chủ xác nhận.
- **`admin.jsx` là JSX, không có hạ tầng test.** Mọi logic đáng kiểm phải tách sang `.mjs` thuần — cùng lối `viet/mang-nhen-xem.mjs` (hàm `toaDoNanHoa`) đã làm.
- Lint: `npx oxlint` / `npx eslint .` để kiểm KHÔNG ghi. `npm run lint` có `--fix`, nó GHI vào file.

---

### Task 1: Tách "route nào gọi lúc nào" thành module thuần, rồi lazy-load ba route tổng quan

**Files:**
- Create: `cms/src/plugins/rada-seo/lib/tai-man.mjs`
- Create: `cms/src/plugins/rada-seo/lib/tai-man.test.mjs`
- Modify: `cms/src/plugins/rada-seo/admin.jsx:2294-2330` (useEffect mở màn + `doiTab` + useEffect khôi phục tab)
- Modify: `cms/src/plugins/rada-seo/plugin.test.mjs` (thêm phép đếm tổng lượt của các route mở màn)

**Interfaces:**
- Produces: `ROUTE_MO_MAN: string[]` — route gọi khi mở màn, bất kể tab nào.
- Produces: `routeChoTab(tab: string): string[]` — route mà việc MỞ tab đó cần, không kể route đã có trong `ROUTE_MO_MAN`.
- Produces: `TAI_LAI_KHI_SANG: Set<string>` — tab phải tải lại MỖI lần sang (không chỉ lần đầu).

- [ ] **Step 1: Viết phép kiểm thất bại cho module thuần**

Tạo `cms/src/plugins/rada-seo/lib/tai-man.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { ROUTE_MO_MAN, routeChoTab, TAI_LAI_KHI_SANG } from "./tai-man.mjs";

test("mở màn chỉ gọi tong-quan và viec-dem — ba route tổng quan kia tải khi mở tab", () => {
	// Vì sao có phép kiểm này: trước 06/10/2026 useEffect mở màn gọi NĂM route, mà pool CSDL là
	// max:1 nên chúng xếp hàng — người xem tab Radar trả tiền cho bốn tab chưa mở. Chốt này gãy
	// ngay khi ai thêm một route vào đường mở màn.
	assert.deepEqual([...ROUTE_MO_MAN].sort(), ["tong-quan", "viec-dem"]);
});

test("mỗi tab khai đúng route của nó, và không khai lại route mở màn", () => {
	assert.deepEqual(routeChoTab("khoang-trong"), ["khoang-trong-tong-quan"]);
	assert.deepEqual(routeChoTab("huong"), ["cum-ngu-nghia"]);
	assert.deepEqual(routeChoTab("ke-hoach"), ["chien-luoc-tong-quan"]);
	assert.deepEqual(routeChoTab("nhap"), ["nhap-tong-quan"]);
	assert.deepEqual(routeChoTab("leo-top"), ["leo-top-tong-quan"]);
	assert.deepEqual(routeChoTab("mang-nhen"), ["mang-nhen-tong-quan"]);
	// Tab Radar sống bằng `tong-quan`, đã có trong ROUTE_MO_MAN — khai lại là tải hai lần.
	assert.deepEqual(routeChoTab("radar"), []);
	for (const t of ["khoang-trong", "huong", "ke-hoach", "nhap", "leo-top", "mang-nhen", "radar"])
		for (const r of routeChoTab(t)) assert.ok(!ROUTE_MO_MAN.includes(r), `${t} khai lại route mở màn: ${r}`);
});

test("tab không có tên thì trả mảng rỗng, không ném", () => {
	assert.deepEqual(routeChoTab("khong-co-tab-nay"), []);
	assert.deepEqual(routeChoTab(undefined), []);
});

test("Kế hoạch tải lại MỖI lần sang, các tab khác chỉ lần đầu", () => {
	// Bài dự kiến vừa giao từ tab Khoảng trống phải hiện ngay, không bắt người dùng tự bấm "Tải
	// lại" rồi tưởng nút Giao không ăn.
	assert.ok(TAI_LAI_KHI_SANG.has("ke-hoach"));
	assert.ok(!TAI_LAI_KHI_SANG.has("khoang-trong"));
	assert.ok(!TAI_LAI_KHI_SANG.has("huong"));
});
```

- [ ] **Step 2: Chạy để chắc chắn nó thất bại**

```bash
cd /Users/truongtrang/Desktop/kinhlacc && node --test cms/src/plugins/rada-seo/lib/tai-man.test.mjs
```

Mong đợi: FAIL — `Cannot find module './tai-man.mjs'`.

- [ ] **Step 3: Viết module thuần**

Tạo `cms/src/plugins/rada-seo/lib/tai-man.mjs`:

```js
/**
 * Route nào được gọi lúc nào — tách khỏi `admin.jsx` để CÓ THỂ KIỂM ĐƯỢC.
 *
 * ⚠️ Pool CSDL của CMS là `max: 1` (xem `astro.config.mjs` — Aiven chỉ còn ~7 slot), nên mọi
 * truy vấn XẾP HÀNG trên một kết nối và `Promise.all` không nhanh hơn một mili giây nào. Chỉ
 * giảm SỐ route mới nhanh. RTT tới Aiven đo được 98,9 ms.
 *
 * Trước 06/10/2026 `useEffect` mở màn gọi NĂM route (~19 lượt đi-về ≈ 1,9 giây khi đã ấm), và
 * `dsKeHoach` bị đọc BA lần trong cùng lượt đó. Người xem tab Radar trả tiền cho bốn tab chưa mở.
 */

/** Gọi khi mở màn, bất kể tab nào đang mở. `tong-quan` cho tab Radar, `viec-dem` cho huy hiệu. */
export const ROUTE_MO_MAN = ["tong-quan", "viec-dem"];

/**
 * Route mà việc MỞ tab đó cần. KHÔNG kể route đã có trong `ROUTE_MO_MAN` — khai lại là tải hai
 * lần cho đúng dữ liệu đó.
 */
const THEO_TAB = {
	radar: [], // sống bằng `tong-quan`, đã ở ROUTE_MO_MAN
	"khoang-trong": ["khoang-trong-tong-quan"],
	huong: ["cum-ngu-nghia"],
	"ke-hoach": ["chien-luoc-tong-quan"],
	"leo-top": ["leo-top-tong-quan"],
	"mang-nhen": ["mang-nhen-tong-quan"],
	nhap: ["nhap-tong-quan"],
};

export function routeChoTab(tab) {
	return THEO_TAB[tab] ?? [];
}

/**
 * Tab phải tải lại MỖI lần sang, không chỉ lần đầu.
 *
 * Chỉ Kế hoạch: bài dự kiến vừa giao từ tab Khoảng trống phải hiện ngay, không thì người dùng
 * tưởng nút Giao không ăn. Các tab khác giữ dữ liệu cũ và có nút "Tải lại" lo phần làm mới —
 * tải lại mỗi lần sang là trả một vòng mạng để nhận đúng con số đang hiện.
 */
export const TAI_LAI_KHI_SANG = new Set(["ke-hoach"]);
```

- [ ] **Step 4: Chạy lại, phải xanh**

```bash
cd /Users/truongtrang/Desktop/kinhlacc && node --test cms/src/plugins/rada-seo/lib/tai-man.test.mjs
```

Mong đợi: PASS 4/4.

- [ ] **Step 5: Thêm phép đếm lượt CSDL thật vào `plugin.test.mjs`**

Thêm vào cuối `cms/src/plugins/rada-seo/plugin.test.mjs`. Lưu ý `ROUTE_MO_MAN` phải import — thêm vào khối import đầu file: `import { ROUTE_MO_MAN } from "./lib/tai-man.mjs";`

```js
test("mở màn hỏi kho ÍT lượt — đếm thật trên các route trong ROUTE_MO_MAN", async () => {
	// Phép kiểm này đo cái mà `tai-man.test.mjs` không đo được: `tai-man.mjs` chỉ nói GỌI MẤY
	// ROUTE, còn đây đếm MỖI ROUTE TỐN MẤY LƯỢT đọc kho. Hai con số khác nhau và cả hai đều
	// trôi được.
	const p = createPlugin();
	const ctx = taoCtx();
	ctx.kv = taoKvGia();
	for (const t of ["a.vn", "b.vn", "c.vn"]) await kho.luuDoiThu(ctx.storage, { tenMien: t }, "t");

	let soLuot = 0;
	for (const bo of ["ke_hoach", "leo_top", "huong", "goi_y_nguoc", "url", "ca", "cum", "doi_thu"]) {
		const b = ctx.storage[bo];
		if (!b) continue;
		for (const m of ["query", "count", "get"]) {
			if (typeof b[m] !== "function") continue;
			const goc = b[m].bind(b);
			b[m] = (...a) => (soLuot++, goc(...a));
		}
	}

	for (const r of ROUTE_MO_MAN) await p.routes[r].handler(ctx);
	// Ngưỡng đặt theo số đo, KHÔNG đặt rộng cho dễ qua: nới trần là chốt hết tác dụng canh chừng.
	assert.ok(soLuot <= 24, `mở màn hỏi kho ${soLuot} lượt — trước đây 19 lượt là CHƯA tính 3 đối thủ`);

	// Lượt hai: đệm phải ăn. `viec-dem` đệm 60 giây, `demUrlTatCa` đệm 10 giây.
	const sauLan1 = soLuot;
	for (const r of ROUTE_MO_MAN) await p.routes[r].handler(ctx);
	assert.ok(soLuot - sauLan1 < sauLan1, `lượt hai (${soLuot - sauLan1}) phải ít hơn lượt đầu (${sauLan1}) — đệm không ăn`);
});
```

- [ ] **Step 6: Chạy phép kiểm plugin, phải xanh**

```bash
cd /Users/truongtrang/Desktop/kinhlacc && node --test --test-concurrency=2 cms/src/plugins/rada-seo/plugin.test.mjs 2>&1 | tail -20
```

Mong đợi: `pass` tăng thêm 1, `fail 0`. Nếu `soLuot` vượt 24 thì ĐỪNG nới trần — đọc xem route nào vừa thêm lượt đọc.

- [ ] **Step 7: Sửa `admin.jsx` dùng module mới**

Thêm vào khối import đầu `admin.jsx` (sau dòng `import { toaDoNanHoa } …`):

```js
import { ROUTE_MO_MAN, routeChoTab, TAI_LAI_KHI_SANG } from "./lib/tai-man.mjs";
```

Thay toàn bộ `useEffect` mở màn (hiện ở `admin.jsx:2294-2303`) bằng:

```js
	// Bảng tra: route → hàm tải của nó. `admin.jsx` giữ phần gọi, `lib/tai-man.mjs` giữ phần
	// LUẬT (route nào lúc nào) vì chỉ phần luật là kiểm được.
	const theoRoute = {
		"tong-quan": tai,
		"viec-dem": taiDem,
		"chien-luoc-tong-quan": taiCL,
		"cum-ngu-nghia": taiCN,
		"khoang-trong-tong-quan": taiKT,
		"leo-top-tong-quan": taiLT,
		"mang-nhen-tong-quan": taiMn,
		"nhap-tong-quan": taiNh,
	};
	const daTai = useRef(new Set());
	// ⚠️ `theoRoute` dựng lại MỖI lượt render. Đưa nó vào mảng phụ thuộc của effect thì effect
	// chạy lại mỗi lượt render — một vòng mạng nữa cho con số không đổi. Đã có lỗi đúng kiểu này
	// ở tab Kế hoạch (useEffect phụ thuộc cả object `dl`). Nên giữ nó trong một ref và để
	// `taiRoute` có mảng phụ thuộc RỖNG.
	const theoRouteRef = useRef(theoRoute);
	theoRouteRef.current = theoRoute;
	const taiRoute = useCallback((r) => {
		const f = theoRouteRef.current[r];
		if (!f) return Promise.resolve();
		daTai.current.add(r);
		return f();
	}, []);

	useEffect(() => {
		// Không phải quản trị viên (Editor): mở thẳng tab Nháp — tab duy nhất họ đọc được. Không
		// ghi vào localStorage: cùng trình duyệt đăng nhập lại bằng tài khoản quản trị vẫn về tab
		// đã lưu.
		taiRoute("tong-quan").then((khongQuyen) => {
			if (khongQuyen) setTab("nhap");
		});
		for (const r of ROUTE_MO_MAN) if (r !== "tong-quan") taiRoute(r);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [taiRoute]);
```

Thay `doiTab` (hiện `admin.jsx:2320-2332`) bằng:

```js
	const doiTab = (t) => {
		setTab(t);
		luuTab(t);
		// Tab nào cần route gì thì `lib/tai-man.mjs` nói. Lần đầu mới tải; nút "Tải lại" trong
		// từng tab lo phần làm mới. Riêng Kế hoạch tải lại MỖI lần sang (xem TAI_LAI_KHI_SANG).
		for (const r of routeChoTab(t)) if (TAI_LAI_KHI_SANG.has(t) || !daTai.current.has(r)) taiRoute(r);
	};
```

Thay `useEffect` khôi phục tab (hiện `admin.jsx:2337-2340`) bằng:

```js
	// ⚠️ PHẢI có effect này, không chỉ dựa vào doiTab: tab được KHÔI PHỤC từ localStorage lúc mở
	// màn (useState(tabDaLuu)) chứ không đi qua doiTab, nên người mở lại trang khi đang ở tab
	// Khoảng trống sẽ kẹt ở "Đang tải…" vĩnh viễn — route chưa bao giờ được gọi. Đã cắn
	// 02/10/2026.
	useEffect(() => {
		for (const r of routeChoTab(tab)) if (!daTai.current.has(r)) taiRoute(r);
	}, [tab, taiRoute]);
```

Và thêm `useRef` vào khối import React đầu file:

```js
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
```

- [ ] **Step 8: Kiểm kiểu và lint KHÔNG ghi**

```bash
cd /Users/truongtrang/Desktop/kinhlacc/cms && npx oxlint src/plugins/rada-seo/ 2>&1 | tail -15 && git -C .. status --short
```

Mong đợi: oxlint không báo lỗi mới; `git status` chỉ hiện các file của task này (oxlint KHÔNG được sửa file nào — nếu có, đó là `--fix` lọt vào, hoàn nguyên ngay).

- [ ] **Step 9: Chạy TOÀN BỘ phép kiểm của plugin**

```bash
cd /Users/truongtrang/Desktop/kinhlacc && node --test --test-concurrency=2 "cms/src/plugins/rada-seo/**/*.test.mjs" 2>&1 | tail -15
```

Mong đợi: `fail 0`. Nếu `leo-top/do-trang.test.mjs` đỏ một mình vì phép đo đồng hồ, chạy `uptime` xem máy có bão hoà trước khi nghi mã — đó là giới hạn đã biết, KHÔNG phải lý do nới ngưỡng.

- [ ] **Step 10: Commit**

```bash
cd /Users/truongtrang/Desktop/kinhlacc && git add cms/src/plugins/rada-seo/lib/tai-man.mjs cms/src/plugins/rada-seo/lib/tai-man.test.mjs cms/src/plugins/rada-seo/admin.jsx cms/src/plugins/rada-seo/plugin.test.mjs && git commit -m "$(cat <<'MSG'
perf(rada-seo): mở màn gọi 2 route thay vì 5 — pool CSDL là max:1

useEffect mở màn gọi tong-quan + chien-luoc + leo-top + nhap + viec-dem.
Pool của CMS là max:1 nên chúng XẾP HÀNG (Promise.all không nhanh hơn một
mili giây nào), RTT tới Aiven 98,9 ms: ~19 lượt ≈ 1,9 giây khi đã ấm. Và
dsKeHoach bị đọc BA lần trong cùng lượt đó, dsLeoTop hai lần.

Ba route tổng quan chuyển sang tải-khi-mở-tab, đúng tiền lệ khoang-trong
và huong đã làm. Còn 2 route lúc mở màn.

Luật "route nào lúc nào" tách sang lib/tai-man.mjs vì admin.jsx là JSX,
không có hạ tầng test — cùng lối viet/mang-nhen-xem.mjs. Hai phép kiểm đo
HAI thứ khác nhau và cả hai đều trôi được: tai-man.test.mjs đếm SỐ ROUTE,
plugin.test.mjs đếm SỐ LƯỢT đọc kho mỗi route tốn.

⚠️ Giữ cả effect theo `tab` lẫn nhánh trong doiTab: tab khôi phục từ
localStorage KHÔNG đi qua doiTab, bỏ effect là kẹt "Đang tải…" vĩnh viễn
(đã cắn 02/10/2026).

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
)"
---

### Task 2: Hành động ghi KHÔNG tải lại cả màn

**Files:**
- Modify: `cms/src/plugins/rada-seo/admin.jsx` — `lamCL` (dòng ~2317), `KeHoachTab` nhận thêm prop
- Create: `cms/src/plugins/rada-seo/lib/bo-dong.mjs`
- Create: `cms/src/plugins/rada-seo/lib/bo-dong.test.mjs`

**Interfaces:**
- Consumes: không gì từ Task 1 (độc lập — có thể làm song song).
- Produces: `boDong(ds, id): object[]` — bỏ một dòng khỏi mảng theo `id`, trả mảng MỚI.
- Produces: `datDong(ds, id, thay): object[]` — thay một dòng theo `id` bằng `{...cu, ...thay}`, trả mảng MỚI.

**Vì sao:** `lamCL = (route, body) => banTrongKhi(goi(route, body).then(taiCL, …))` — duyệt MỘT bài dự kiến thì kéo lại cả `chien-luoc-tong-quan` (3 lượt đọc kho: `dsHuong` + `dsCumNghia` + `dsKeHoach`). Dòng vừa duyệt biến mất là thông tin đã có trong phản hồi; không cần hỏi lại kho để biết.

- [ ] **Step 1: Viết phép kiểm thất bại**

Tạo `cms/src/plugins/rada-seo/lib/bo-dong.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { boDong, datDong } from "./bo-dong.mjs";

const ds = [{ id: "a", t: 1 }, { id: "b", t: 2 }, { id: "c", t: 3 }];

test("boDong bỏ đúng một dòng và KHÔNG sửa mảng gốc", () => {
	const r = boDong(ds, "b");
	assert.deepEqual(r.map((x) => x.id), ["a", "c"]);
	assert.equal(ds.length, 3, "sửa mảng gốc là React không thấy thay đổi");
});

test("boDong với id không có thì trả mảng y nguyên nội dung", () => {
	assert.deepEqual(boDong(ds, "khong-co").map((x) => x.id), ["a", "b", "c"]);
});

test("boDong chịu được mảng rỗng và undefined", () => {
	assert.deepEqual(boDong([], "a"), []);
	assert.deepEqual(boDong(undefined, "a"), []);
});

test("datDong gộp vào dòng cũ, không thay cả dòng", () => {
	const r = datDong(ds, "b", { t: 9 });
	assert.deepEqual(r[1], { id: "b", t: 9 });
	assert.equal(ds[1].t, 2, "sửa dòng gốc là React không thấy thay đổi");
});

test("datDong giữ nguyên các khoá không khai trong `thay`", () => {
	const r = datDong([{ id: "a", x: 1, y: 2 }], "a", { x: 5 });
	assert.deepEqual(r[0], { id: "a", x: 5, y: 2 });
});
```

- [ ] **Step 2: Chạy để chắc chắn thất bại**

```bash
cd /Users/truongtrang/Desktop/kinhlacc && node --test cms/src/plugins/rada-seo/lib/bo-dong.test.mjs
```

Mong đợi: FAIL — `Cannot find module './bo-dong.mjs'`.

- [ ] **Step 3: Viết module**

Tạo `cms/src/plugins/rada-seo/lib/bo-dong.mjs`:

```js
/**
 * Cập nhật CỤC BỘ một danh sách sau khi máy chủ xác nhận — thay cho việc gọi lại route tổng quan.
 *
 * Vì sao: `lamCL("ke-hoach-dat", …)` duyệt MỘT bài rồi kéo lại cả `chien-luoc-tong-quan` (3 lượt
 * đọc kho trên pool max:1). Dòng vừa duyệt biến mất là thông tin đã có trong phản hồi; hỏi lại
 * kho để biết điều mình đã biết là trả một vòng mạng không mua gì.
 *
 * ⚠️ Cả hai hàm trả mảng MỚI. Sửa tại chỗ thì React so tham chiếu thấy y nguyên và KHÔNG vẽ lại —
 * người bấm thấy màn đứng im rồi bấm tiếp.
 */

/** Bỏ dòng có `id` khỏi `ds`. Không có thì trả bản sao nội dung y nguyên. */
export function boDong(ds, id) {
	return (Array.isArray(ds) ? ds : []).filter((x) => x?.id !== id);
}

/** Gộp `thay` vào dòng có `id`. Các khoá không khai trong `thay` giữ nguyên. */
export function datDong(ds, id, thay) {
	return (Array.isArray(ds) ? ds : []).map((x) => (x?.id === id ? { ...x, ...thay } : x));
}
```

- [ ] **Step 4: Chạy lại, phải xanh**

```bash
cd /Users/truongtrang/Desktop/kinhlacc && node --test cms/src/plugins/rada-seo/lib/bo-dong.test.mjs
```

Mong đợi: PASS 5/5.

- [ ] **Step 5: Dùng trong `admin.jsx` — duyệt/bỏ kế hoạch không tải lại cả màn**

Thêm vào khối import đầu `admin.jsx`:

```js
import { boDong, datDong } from "./lib/bo-dong.mjs";
```

Thay hai lời gọi `onDuyet` và `onBo` của `KeHoachTab` (hiện ở `admin.jsx:2371-2372`) bằng:

```js
					onDuyet={(id) =>
						goi("ke-hoach-dat", { id, trangThai: "da_duyet" }).then(
							// Dòng rời danh sách CHỈ KHI máy chủ xác nhận — cố ý không optimistic
							// update: "duyệt" là ghi thật, báo xong khi chưa xong là để người duyệt
							// tưởng bài đã vào hàng viết.
							() => setClDl((d) => (d ? { ...d, keHoach: boDong(d.keHoach, id) } : d)),
							(e) => setCLoi(loiCua(e)),
						)
					}
					onBo={(id, lyDo) =>
						goi("ke-hoach-dat", { id, trangThai: "bo_qua", lyDoBo: lyDo }).then(
							() => setClDl((d) => (d ? { ...d, keHoach: boDong(d.keHoach, id) } : d)),
							(e) => setCLoi(loiCua(e)),
						)
					}
```

⚠️ **Trước khi viết, kiểm tên trường thật:** `chien-luoc-tong-quan` trả `{ huong, cum, keHoach }` (xem `plugin.mjs:791-793`). Nếu tên khác thì sửa theo tên thật, đừng đoán.

- [ ] **Step 5b: Nút "Đã sửa" của Leo top — chỗ ĐẮT NHẤT**

`onDaSua` hiện gọi `taiLT` = `leo-top-tong-quan`, tốn `dsLeoTop` + `dsKeHoach` + **hai lượt GSC**
(`gscTheoTrang` + `gscTuKhoa`). Đánh dấu một trang đã sửa thì trả cả vòng đó — trong khi việc chỉ
là đổi trạng thái MỘT phiếu.

Thêm `datDong` vào import, rồi thay `onDaSua` (hiện ở `admin.jsx:2392`):

```jsx
					onDaSua={(id, ngay) =>
						goi("leo-top-da-sua", { id, ngay }).then(
							// Dòng KHÔNG rời bảng — nó chỉ đổi trạng thái, và người vừa bấm cần
							// thấy mốc vừa chụp. `datDong` gộp vào dòng cũ nên các cột khác
							// (hạng, hiển thị, nhấp) giữ nguyên, không phải hỏi GSC lại.
							(r) => setLtDl((d) => (d ? { ...d, ds: datDong(d.ds, id, r ?? { trangThai: "dang_sua" }) } : d)),
							(e) => setLtLoi(loiCua(e)),
						)
					}
```

⚠️ **Kiểm `leo-top-da-sua` trả về gì trước khi viết** — nếu nó trả phiếu đã cập nhật thì truyền
thẳng; nếu trả `{ ok: true }` thì phải khai tay trường đổi:

```bash
cd /Users/truongtrang/Desktop/kinhlacc/cms/src/plugins/rada-seo && sed -n '1261,1300p' plugin.mjs
```

⚠️ Và kiểm tên trường của `leo-top-tong-quan`: nó trả `{ ds, … }` (xem `plugin.mjs:1081`). Nếu
tên khác thì sửa theo tên thật.

- [ ] **Step 6: Giữ `lamCL` cho đúng chỗ còn cần nó**

`onThuHoi` (`ke-hoach-thu-hoi`) ĐỔI trạng thái bài chứ không bỏ bài khỏi danh sách, và nó cũng gỡ các trường `giuLuc`/`soLanNop` mà màn hình đang hiện. Giữ `lamCL` cho riêng nó — một lượt tải lại ở đây là đúng, vì phản hồi không nói đủ.

Để nguyên:

```js
					onThuHoi={(id) => lamCL("ke-hoach-thu-hoi", { id })}
```

- [ ] **Step 7: Kiểm bằng mắt trên bản DỰNG, không phải `astro dev`**

```bash
cd /Users/truongtrang/Desktop/kinhlacc/cms && npm run build 2>&1 | tail -5
```

Mong đợi: build xanh. ⚠️ `npm run build` xanh **không chứng minh plugin nạp được** — lỗi nạp module chỉ nổ lúc chạy (mọi trang 500). Kiểm thêm:

```bash
cd /Users/truongtrang/Desktop/kinhlacc/cms && node -e "import('./src/plugins/rada-seo/plugin.mjs').then((m) => console.log('nạp được, số route:', Object.keys(m.default?.routes ?? m.routes ?? {}).length), (e) => { console.error('NẠP HỎNG:', e.message); process.exit(1); })"
```

Mong đợi: in ra số route (44), không lỗi.

- [ ] **Step 8: Chạy toàn bộ phép kiểm**

```bash
cd /Users/truongtrang/Desktop/kinhlacc && node --test --test-concurrency=2 "cms/src/plugins/rada-seo/**/*.test.mjs" 2>&1 | tail -12
```

Mong đợi: `fail 0`.

- [ ] **Step 9: Commit**

```bash
cd /Users/truongtrang/Desktop/kinhlacc && git add cms/src/plugins/rada-seo/lib/bo-dong.mjs cms/src/plugins/rada-seo/lib/bo-dong.test.mjs cms/src/plugins/rada-seo/admin.jsx && git commit -m "perf(rada-seo): duyệt một bài không còn kéo lại cả tổng quan

lamCL gọi route rồi tải lại chien-luoc-tong-quan (3 lượt đọc kho trên pool
max:1) sau MỖI cú bấm. Dòng vừa duyệt biến mất là thông tin đã có trong
phản hồi — hỏi lại kho để biết điều mình đã biết là một vòng mạng không
mua gì.

Cố ý KHÔNG optimistic update: dòng rời danh sách chỉ khi máy chủ xác nhận.
Duyệt là ghi thật; báo xong khi chưa xong là để người duyệt tưởng bài đã
vào hàng viết.

onThuHoi GIỮ lamCL: nó đổi trạng thái và gỡ giuLuc/soLanNop mà màn hình
đang hiện, nên phản hồi không nói đủ — một lượt tải lại ở đó là đúng.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Nút tự báo bận, bỏ cờ toàn cục

**Files:**
- Modify: `cms/src/plugins/rada-seo/admin.jsx` — thêm component `NutBan`, sửa `Nut`, bỏ `dangBan` khỏi `ThanhQuyTrinh`

**Interfaces:**
- Consumes: không gì (độc lập).
- Produces: `<NutBan onBam={() => Promise} chuBan="Đang duyệt…">Duyệt</NutBan>` — nút tự giữ trạng thái bận của chính nó.

**Vì sao:** cờ `dangBan` in `⏳ đang xử lý…` ở **cuối thanh quy trình** — chỗ mắt người bấm nút giữa bảng không nhìn. Nên nó không ngăn được cú bấm thứ hai, mà cú bấm thứ hai mới là thứ xếp thêm một lượt tải lại vào hàng.

- [ ] **Step 1: Đọc component `Nut` hiện có để khớp kiểu dáng**

```bash
cd /Users/truongtrang/Desktop/kinhlacc/cms/src/plugins/rada-seo && grep -n "function Nut" -A 20 admin.jsx | head -26
```

Ghi lại kiểu dáng thật (màu, padding, border-radius) để `NutBan` trông y hệt — **đừng tự sáng tác màu mới**, màn này dùng bảng màu riêng của plugin.

- [ ] **Step 2: Viết `NutBan` ngay dưới `Nut` trong `admin.jsx`**

```jsx
/**
 * Nút TỰ giữ trạng thái bận của chính nó.
 *
 * ⚠️ Vì sao không dùng một cờ toàn cục: cờ `dangBan` cũ in "⏳ đang xử lý…" ở CUỐI THANH QUY
 * TRÌNH, tức chỗ mắt người vừa bấm một nút giữa bảng không nhìn tới. Nên nó không ngăn được cú
 * bấm thứ hai — mà cú bấm thứ hai mới là thứ xếp thêm một lượt tải lại vào hàng trên pool max:1.
 *
 * `onBam` phải trả về Promise. Không trả thì nút nhả ngay và mất tác dụng chống bấm đôi.
 */
function NutBan({ onBam, chuBan = "Đang gửi…", children, ...con }) {
	const [ban, setBan] = useState(false);
	return (
		<Nut
			{...con}
			disabled={ban || con.disabled}
			onClick={() => {
				if (ban) return;
				setBan(true);
				// `finally` chứ không `then`: lỗi cũng phải nhả nút, không thì một lần hỏng là nút
				// chết hẳn tới khi tải lại trang.
				Promise.resolve(onBam?.()).finally(() => setBan(false));
			}}
		>
			{ban ? `⏳ ${chuBan}` : children}
		</Nut>
	);
}
```

- [ ] **Step 3: Kiểm `Nut` có nhận `disabled` không**

Nếu `Nut` hiện không truyền `disabled` xuống `<button>`, sửa nó để truyền — nút vô hiệu hoá mà vẫn bấm được là chống bấm đôi giả:

```bash
cd /Users/truongtrang/Desktop/kinhlacc/cms/src/plugins/rada-seo && grep -n "function Nut" -A 20 admin.jsx | grep -n "disabled"
```

Rỗng nghĩa là CHƯA truyền — phải thêm `disabled={disabled}` vào `<button>` và `opacity: disabled ? 0.5 : 1` vào style.

- [ ] **Step 4: Đổi các nút hành động sang `NutBan`**

Trong `KeHoachTab`, `LeoTopTab`, `CumNguNghiaTab`: mỗi nút gọi route ghi đổi từ `<Nut onClick={…}>` sang `<NutBan onBam={…} chuBan="…">`. Chữ bận phải nói ĐÚNG việc đang làm:

| Nút | `chuBan` |
|---|---|
| Duyệt | `Đang duyệt…` |
| Bỏ | `Đang bỏ…` |
| Đã sửa | `Đang ghi mốc…` |
| Giao việc | `Đang giao…` |
| Viết ngay | `Đang gọi lò viết…` |
| Thu hồi | `Đang thu hồi…` |

⚠️ Nút **Chạy ca** giữ nguyên cách hiện tại: ca chạy NỀN và trả ngay, nên "bận" của nó không phải thời gian chạy ca. Cờ `dl.dangChay` + nhịp tự tải 5 giây đã lo đúng việc đó.

- [ ] **Step 5: Bỏ `dangBan` khỏi `ThanhQuyTrinh`**

Trong `ThanhQuyTrinh` (dòng ~218), bỏ prop `dangBan` và cả dòng:

```jsx
					{v === "giu" && dangBan && <span style={{ color: "#92400e", fontSize: 13, marginLeft: 8 }}>⏳ đang xử lý…</span>}
```

Và ở `RadaSeo`, bỏ `dangBan={dangBan}` khỏi `<ThanhQuyTrinh …>`. **Giữ** `banTrongKhi`/`dangBan` nếu `lam()` (tab Radar) còn dùng — chỉ bỏ phần HIỆN nó ở thanh quy trình.

- [ ] **Step 6: Kiểm lint và nạp module**

```bash
cd /Users/truongtrang/Desktop/kinhlacc/cms && npx oxlint src/plugins/rada-seo/ 2>&1 | tail -10 && npm run build 2>&1 | tail -4
```

Mong đợi: không lỗi mới, build xanh.

- [ ] **Step 7: Chạy toàn bộ phép kiểm**

```bash
cd /Users/truongtrang/Desktop/kinhlacc && node --test --test-concurrency=2 "cms/src/plugins/rada-seo/**/*.test.mjs" 2>&1 | tail -12
```

Mong đợi: `fail 0`.

- [ ] **Step 8: Commit**

```bash
cd /Users/truongtrang/Desktop/kinhlacc && git add cms/src/plugins/rada-seo/admin.jsx && git commit -m "fix(rada-seo): nút tự báo bận tại chỗ, bỏ cờ toàn cục ở cuối thanh

Cờ dangBan in '⏳ đang xử lý…' ở CUỐI thanh quy trình — chỗ mắt người vừa
bấm một nút giữa bảng không nhìn tới. Nên nó không ngăn được cú bấm thứ
hai, mà cú bấm thứ hai mới là thứ xếp thêm một lượt tải lại vào hàng trên
pool max:1.

NutBan tự giữ trạng thái của chính nó, đổi chữ thành việc đang làm ('Đang
duyệt…', 'Đang gọi lò viết…') và tự vô hiệu hoá. Nhả nút trong `finally`
chứ không `then`: lỗi cũng phải nhả, không thì một lần hỏng là nút chết
hẳn tới khi tải lại trang.

Nút Chạy ca GIỮ nguyên: ca chạy nền và trả ngay, 'bận' của nó không phải
thời gian chạy ca — cờ dl.dangChay + nhịp tự tải 5 giây đã lo đúng việc.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Nghiệm thu phần B

Chạy sau cả ba task:

```bash
cd /Users/truongtrang/Desktop/kinhlacc && node --test --test-concurrency=2 "cms/src/plugins/rada-seo/**/*.test.mjs" 2>&1 | tail -8
cd cms && node -e "import('./src/plugins/rada-seo/plugin.mjs').then((m) => console.log('route:', Object.keys(m.default?.routes ?? m.routes ?? {}).length), (e) => { console.error('NẠP HỎNG:', e.message); process.exit(1); })"
```

**Số phải đạt:**

| Phép đo | Trước | Sau |
|---|---|---|
| Route gọi lúc mở màn | 5 | **2** |
| Lượt đọc kho lúc mở màn (3 đối thủ) | ~19 | **≤ 24 trong phép kiểm** (ngưỡng có biên cho dữ liệu thử) |
| `dsKeHoach` đọc mỗi lượt mở màn | 3 lần | **1 lần** (`viec-dem`) |
| Lượt tải lại sau khi duyệt một bài | 3 | **0** |
| Lượt tải lại sau khi bấm "Đã sửa" | 4 + 2 GSC | **0** |

⚠️ **Đo tốc độ thật phải trên bản DỰNG** (`node ./dist/server/entry.mjs`), không phải `astro dev`: mỗi lời gọi admin trong dev còn tốn phần biên dịch lại của Vite.

⚠️ **Không kết luận "đã nhanh" từ máy dev.** Pool `max: 1` và RTT 98,9 ms là của Aiven; máy dev nối cùng kho nên con số gần đúng, nhưng `DB_POOL_MAX=3` ở `.env` dev làm hành vi xếp hàng khác production.

## Việc phần B KHÔNG làm, và vì sao

- **B2 (`viec-dem` nhập vào `viec`)** cần route `viec` — thuộc **phần A**. Làm xong A thì bỏ `viec-dem` khỏi `ROUTE_MO_MAN`, mở màn còn **1 route / 4 lượt**.
- **Lượt mở màn NGUỘI** vẫn chậm: `demUrlTatCa` đệm 10 giây và kho app hâm sẵn tối đa 5 phút một lần. Đó là giới hạn của `max: 1`, không phải của màn hình.
