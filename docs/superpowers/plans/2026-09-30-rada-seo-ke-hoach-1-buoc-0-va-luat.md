# Rada SEO plugin — Kế hoạch 1: Bước 0 (plugin thử) + bộ luật thuần

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đo xem plugin native EmDash 0.39.1 có chạy được cron / trang admin / tạo nháp / nạp ảnh trên Node không (chốt chặn), và dựng năm bộ luật thuần (chuẩn hoá, chống trùng, phạm vi Y sỹ, YMYL, SEO, lọc nguồn/link) mà mọi phần sau dùng.

**Architecture:** Đặc tả: `docs/superpowers/specs/2026-09-30-radar-lo-viet-plugin-cms-design.md`. Bộ luật là ES module thuần trong `cms/src/plugins/rada-seo/luat/`, không import EmDash, kiểm bằng `node --test`. Plugin thử là một tệp `definePlugin` riêng, gỡ khỏi `astro.config.mjs` sau khi đo. Kế hoạch 2 (plugin radar + lò viết) và 3 (chuyển `/blog/` + di chuyển dữ liệu) chỉ viết SAU khi Task 1 có số đo.

**Tech Stack:** EmDash 0.39.1 (Astro, `output: "server"`), Node ≥22, `node:test`.

## Global Constraints

- Plugin phải là **native**: `definePlugin({ id, version, ... })` trong mảng `plugins` — sandbox của EmDash chỉ có trên Cloudflare.
- **Build xanh không chứng minh gì.** Mọi phép đo plugin chạy trên BẢN DỰNG: `npm run build && node ./dist/server/entry.mjs` trong `cms/`, không dùng `astro dev`.
- Sửa `cms/astro.config.mjs` có thể làm sập dev server của phiên Claude khác — báo người dùng trước khi sửa; chạy bản dựng ở cổng riêng (`PORT=4399`).
- Quyền (capability) đúng tên của 0.39.1: `content:read`, `content:write`, `media:read`, `media:write`, `network:request`.
- Route plugin nằm ở `/_emdash/api/plugins/<id>/<route>`.
- Mọi chữ hiển thị tuân bảng từ phạm vi Y sỹ (không "khám/chữa bệnh", "bác sĩ" về mình).
- Không mở pool Postgres riêng (Aiven còn ~11 slot).
- Commit chỉ tệp của mình (`git commit -- <paths>`); repo có nhiều phiên cùng làm.

---

### Task 1: Bước 0 — plugin thử, đo bốn điều (CHỐT CHẶN)

**Files:**
- Create: `cms/src/plugins/rada-seo-thu.mjs`
- Create: `cms/src/plugins/rada-seo-thu-admin.jsx`
- Modify: `cms/astro.config.mjs` (mảng `plugins`, dòng ~145) — tạm thời
- Create: `docs/superpowers/plans/2026-09-30-rada-seo-ket-qua-buoc-0.md`

**Interfaces:**
- Produces: tệp kết quả ghi ĐẠT/TRƯỢT cho 4 điều + cách làm thật sự chạy được (tên hook, dạng `admin.entry`, dạng `content` chấp nhận). Kế hoạch 2 đọc tệp này.

- [ ] **Step 1: Viết plugin thử**

`cms/src/plugins/rada-seo-thu.mjs`:

```js
// Plugin THỬ cho bước 0 của Rada SEO — đo 4 điều rồi gỡ. Không dùng cho production.
import { definePlugin } from "emdash";

// PNG 1×1 trong suốt.
const PNG = Uint8Array.from(
	atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="),
	(c) => c.charCodeAt(0),
);

export default definePlugin({
	id: "rada-seo-thu",
	version: "0.0.1",
	capabilities: ["content:read", "content:write", "media:read", "media:write", "network:request"],
	allowedHosts: ["api.yescale.io"],
	hooks: {
		"plugin:install": async (_e, ctx) => {
			await ctx.cron?.schedule("nhip", { schedule: "*/2 * * * *" });
		},
		cron: async (event, ctx) => {
			const cu = (await ctx.kv.get("cron:so-lan")) ?? 0;
			await ctx.kv.set("cron:so-lan", cu + 1);
			await ctx.kv.set("cron:lan-cuoi", { luc: new Date().toISOString(), ten: event.name });
		},
	},
	routes: {
		"trang-thai": {
			handler: async (ctx) => ({
				soLan: await ctx.kv.get("cron:so-lan"),
				lanCuoi: await ctx.kv.get("cron:lan-cuoi"),
				tasks: await ctx.cron?.list(),
			}),
		},
		"hen-gio": {
			handler: async (ctx) => {
				await ctx.cron.schedule("nhip", { schedule: "*/2 * * * *" });
				return { tasks: await ctx.cron.list() };
			},
		},
		"tao-nhap": {
			handler: async (ctx) =>
				ctx.content.create("bai_viet", {
					title: "[THỬ rada] xoá tôi",
					description: "Bài thử của bước 0 Rada SEO — xoá sau khi đo.",
					content: [
						{
							_type: "block",
							_key: "a1",
							style: "normal",
							markDefs: [],
							children: [{ _type: "span", _key: "s1", text: "Nội dung thử.", marks: [] }],
						},
					],
				}),
		},
		"nap-anh": {
			handler: async (ctx) => ctx.media.upload("rada-thu.png", "image/png", PNG.buffer),
		},
		"goi-mang": {
			handler: async (ctx) => {
				const r = await ctx.http.fetch("https://api.yescale.io/v1/models");
				return { status: r.status };
			},
		},
	},
	admin: {
		entry: "./src/plugins/rada-seo-thu-admin.jsx",
		pages: [{ path: "/rada", label: "Rada SEO (thử)", icon: "radar" }],
	},
});
```

`cms/src/plugins/rada-seo-thu-admin.jsx`:

```jsx
// Trang admin THỬ — chỉ cần hiện ra được là đạt.
export const pages = {
	"/rada": function TrangThu() {
		return <div style={{ padding: 24 }}>Rada SEO thử — trang admin plugin đã nạp.</div>;
	},
};
```

- [ ] **Step 2: Nạp module thật (chưa build)**

Run (trong `cms/`): `node -e "import('./src/plugins/rada-seo-thu.mjs').then(m=>console.log(m.default.id, m.default.version))"`
Expected: `rada-seo-thu 0.0.1`. Nếu ném lỗi → ghi lỗi vào tệp kết quả, sửa theo thông điệp, chạy lại.

- [ ] **Step 3: Báo người dùng rồi đăng ký plugin**

Nói trước với người dùng: "sắp sửa `cms/astro.config.mjs`, dev server CMS đang chạy (nếu có) sẽ nạp lại". Rồi sửa `cms/astro.config.mjs`:

```js
import radaSeoThu from "./src/plugins/rada-seo-thu.mjs";
// …
			plugins: [auditLog, radaSeoThu],
```

- [ ] **Step 4: Build và chạy bản dựng ở cổng riêng**

Run (trong `cms/`): `npm run build && PORT=4399 HOST=127.0.0.1 node ./dist/server/entry.mjs`
(chạy nền). Expected: server lắng nghe, không có `definePlugin() requires` trong log. Mở `http://127.0.0.1:4399/` bằng curl — phải 200 (plugin hỏng thì MỌI trang 500).

- [ ] **Step 5: Đo điều 1 — cron**

Đăng nhập admin trên trình duyệt ở `http://127.0.0.1:4399/_emdash/admin` (passkey hoặc SSO), rồi dùng DevTools/fetch từ phiên đó:
`fetch('/_emdash/api/plugins/rada-seo-thu/hen-gio',{method:'POST',headers:{'X-EmDash-Request':'1'}}).then(r=>r.json())`
Chờ 5 phút, gọi `trang-thai`. ĐẠT khi `soLan ≥ 2` và `lanCuoi.luc` trong 3 phút gần nhất. TRƯỢT → ghi lại, phương án lùi (kế hoạch 2): route được crontab VPS gọi theo giờ.

- [ ] **Step 6: Đo điều 2 — trang admin**

Mở `/_emdash/admin`, tìm mục "Rada SEO (thử)" ở thanh bên. ĐẠT khi trang hiện dòng "Rada SEO thử — trang admin plugin đã nạp." TRƯỢT → thử lần lượt `entry` dạng đường dẫn tuyệt đối từ gốc cms (`/src/plugins/rada-seo-thu-admin.jsx`) rồi dạng package (`"rada-seo-thu/admin"` qua `package.json#exports`); ghi dạng nào chạy. Cả ba trượt → ghi TRƯỢT; phương án lùi: màn điều khiển dựng bằng trang Astro riêng `cms/src/pages/_rada/…` gọi route plugin.

- [ ] **Step 7: Đo điều 3 — tạo nháp**

`fetch('/_emdash/api/plugins/rada-seo-thu/tao-nhap',{method:'POST',headers:{'X-EmDash-Request':'1'}}).then(r=>r.json())`
ĐẠT khi: trả về item có `id`; trong admin, bộ Bài viết có "[THỬ rada] xoá tôi" ở trạng thái NHÁP (chưa published); mở trình sửa thấy "Nội dung thử."; `curl http://127.0.0.1:4399/blog/<slug>/` KHÔNG ra bài (nháp không lộ). Ghi dạng `content` được chấp nhận (Portable Text mảng block). Xoá bài thử trong admin.

- [ ] **Step 8: Đo điều 4 — nạp ảnh + gọi mạng**

Gọi `nap-anh`. ĐẠT khi trả `{mediaId, storageKey, url}` và `curl -o /dev/null -w '%{http_code}' http://127.0.0.1:4399<url>` ra `200`. Gọi `goi-mang`: ĐẠT khi có `status` (bất kỳ mã HTTP nào — đo đường mạng, không đo khoá). Xoá ảnh thử trong thư viện.

- [ ] **Step 9: Ghi kết quả, gỡ plugin thử**

Tạo `docs/superpowers/plans/2026-09-30-rada-seo-ket-qua-buoc-0.md`:

```markdown
# Kết quả bước 0 — Rada SEO plugin (đo trên bản dựng, EmDash 0.39.1)

| # | Điều | Kết quả | Cách chạy được / lỗi gặp |
|---|---|---|---|
| 1 | Cron trên Node | ĐẠT/TRƯỢT | soLan=…, lanCuoi=… |
| 2 | Trang admin React | ĐẠT/TRƯỢT | dạng `entry` chạy được: … |
| 3 | content.create nháp | ĐẠT/TRƯỢT | trạng thái sau tạo: …; dạng content: … |
| 4 | media.upload + http | ĐẠT/TRƯỢT | url=… → 200/… ; http status=… |

Kết luận cho kế hoạch 2: …
```

Gỡ `radaSeoThu` khỏi `cms/astro.config.mjs` (khôi phục đúng dòng `plugins: [auditLog],`), xoá hai tệp thử, dừng server cổng 4399.

- [ ] **Step 10: DỪNG nếu có điều TRƯỢT mà phương án lùi không đo được**

Báo người dùng bảng kết quả. Có TRƯỢT → bàn lại trước khi viết kế hoạch 2.

- [ ] **Step 11: Commit**

```bash
git add docs/superpowers/plans/2026-09-30-rada-seo-ket-qua-buoc-0.md
git commit -m "docs(rada-seo): kết quả bước 0 — plugin native EmDash trên Node" -- docs/superpowers/plans/2026-09-30-rada-seo-ket-qua-buoc-0.md
git diff --quiet -- cms/astro.config.mjs && echo "astro.config sạch"
```
Expected: `astro.config sạch`.

---

### Task 2: Chuẩn hoá chữ + chống trùng chủ đề

**Files:**
- Create: `cms/src/plugins/rada-seo/luat/chuan-hoa.mjs`
- Create: `cms/src/plugins/rada-seo/luat/trung-lap.mjs`
- Test: `cms/src/plugins/rada-seo/luat/trung-lap.test.mjs`
- Đã có: `cms/src/plugins/rada-seo/luat/__fixture__/bai-viet-30-09.json` (22 bài thật đọc từ `seo_bai_viet` ngày 30/09/2026: `{id, tieuDe, tuKhoa[], trangThai}`)

**Interfaces:**
- Produces: `boDau(s): string`, `chuanHoaManh(s): string` (chuan-hoa.mjs);
  `NGUONG_TRUNG = 0.3`, `tachTu(s): string[]`, `tapKhoa({tieuDe, tuKhoa}): Set<string>`, `doGiong(a: Set, b: Set): number`, `gomNhom(ds, nguong?): id[][]`, `timTrung(moi, ds, nguong?): {id, doGiong} | null`, `trungTuDien(tuKhoaChinh, tenTuDien: Set<string>): string | null` (trung-lap.mjs).

- [ ] **Step 1: Viết phép kiểm (thất bại)**

`cms/src/plugins/rada-seo/luat/trung-lap.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gomNhom, timTrung, trungTuDien, tapKhoa, doGiong } from "./trung-lap.mjs";

const BAI = JSON.parse(readFileSync(new URL("./__fixture__/bai-viet-30-09.json", import.meta.url), "utf8"));

test("phép kiểm vàng: 7 bài '24 tỉnh huyệt' chung một nhóm, còn lại đứng riêng", () => {
	const nhieu = gomNhom(BAI).filter((n) => n.length > 1);
	assert.deepEqual(nhieu, [[1, 13, 16, 17, 19, 21, 22]]);
});

test("hai bài châm cứu #10–#20 dưới ngưỡng (0,27) — mốc biên đã đo", () => {
	const a = BAI.find((b) => b.id === 10), b = BAI.find((b) => b.id === 20);
	const v = doGiong(tapKhoa(a), tapKhoa(b));
	assert.ok(v > 0.25 && v < 0.3, `đo được ${v}`);
});

test("chủ đề mới về 24 tỉnh huyệt bị bắt trùng", () => {
	const r = timTrung({ tieuDe: "Phương pháp đo nhiệt độ 24 tỉnh huyệt trong chẩn đoán kinh lạc", tuKhoa: ["đo nhiệt độ kinh lạc"] }, BAI);
	assert.ok(r && [1, 13, 16, 17, 19, 21, 22].includes(r.id));
});

test("chủ đề mới khác hẳn không bị bắt", () => {
	assert.equal(timTrung({ tieuDe: "Ngũ hành tương sinh tương khắc trong ăn uống", tuKhoa: ["ngũ hành ăn uống"] }, BAI), null);
});

test("trùng từ điển: bỏ tiền tố 'huyệt'", () => {
	const ten = new Set(["tam am giao", "tuc tam ly", "quan nguyen"]);
	assert.equal(trungTuDien("huyệt tam âm giao", ten), "tam am giao");
	assert.equal(trungTuDien("Huyệt Quan Nguyên", ten), "quan nguyen");
	assert.equal(trungTuDien("đo nhiệt độ kinh lạc", ten), null);
});
```

- [ ] **Step 2: Chạy, xác nhận thất bại**

Run (trong `cms/`): `node --test src/plugins/rada-seo/luat/trung-lap.test.mjs`
Expected: FAIL — `Cannot find module …/trung-lap.mjs`.

- [ ] **Step 3: Viết mã**

`cms/src/plugins/rada-seo/luat/chuan-hoa.mjs`:

```js
// Chuẩn hoá chữ Việt cho các phép so khớp của Rada SEO.

/** Bỏ dấu thanh + dấu mũ, đ→d, về chữ thường. */
export function boDau(s) {
	return String(s ?? "")
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/đ/g, "d")
		.replace(/Đ/g, "D")
		.toLowerCase();
}

/** Bỏ dấu + thay mọi thứ không phải chữ/số bằng một khoảng trắng. */
export function chuanHoaManh(s) {
	return boDau(s).replace(/[^a-z0-9]+/g, " ").trim();
}
```

`cms/src/plugins/rada-seo/luat/trung-lap.mjs`:

```js
// Chống trùng chủ đề: so một chủ đề với các bài đã có (kể cả nháp) và với tên mục từ điển.
//
// Đo trên 22 bài thật ngày 30/09/2026 (__fixture__/bai-viet-30-09.json): nhóm "đo nhiệt độ
// 24 tỉnh huyệt" (7 bài) nối liền ở ngưỡng 0,30; cặp khác đề tài giống nhất là #10–#20 (0,27).
// Đổi tập từ dừng hay cách tách cặp từ là đổi mọi con số này — chạy lại phép kiểm vàng.
import { boDau, chuanHoaManh } from "./chuan-hoa.mjs";

export const NGUONG_TRUNG = 0.3;

const TU_DUNG = new Set(
	(
		"va cua trong theo cho voi cac nhung mot la gi tu den hien dai hieu qua quan trong " +
		"cach giai phap kham pha luu y tac dung vi tri dong y hoc co truyen"
	).split(" "),
);

/** Tách từ đã bỏ dấu, bỏ từ dừng. */
export function tachTu(s) {
	return boDau(s)
		.replace(/[^a-z0-9 ]/g, " ")
		.split(/\s+/)
		.filter((w) => w && !TU_DUNG.has(w));
}

/**
 * Tập CẶP TỪ liền nhau từ tiêu đề + 3 từ khoá đầu. Dùng cặp chứ không dùng từ lẻ vì
 * "tỉnh huyệt", "kinh lạc" mới mang nghĩa; từ lẻ "huyet" có ở mọi bài.
 */
export function tapKhoa({ tieuDe = "", tuKhoa = [] }) {
	const t = [...tachTu(tieuDe), ...tachTu(tuKhoa.slice(0, 3).join(" "))];
	const tap = new Set();
	for (let i = 0; i < t.length - 1; i++) tap.add(`${t[i]}_${t[i + 1]}`);
	return tap;
}

/** Hệ số Jaccard giữa hai tập. */
export function doGiong(a, b) {
	let chung = 0;
	for (const x of a) if (b.has(x)) chung++;
	const hop = a.size + b.size - chung;
	return hop === 0 ? 0 : chung / hop;
}

/**
 * Gom nhóm liên kết đơn: hai bài giống ≥ ngưỡng thì chung nhóm, bắc cầu.
 * @param {{id:number|string, tieuDe:string, tuKhoa:string[]}[]} ds
 * @returns {(number|string)[][]} mọi nhóm (kể cả nhóm một bài), mỗi nhóm xếp theo id
 */
export function gomNhom(ds, nguong = NGUONG_TRUNG) {
	const tap = ds.map(tapKhoa);
	const cha = ds.map((_, i) => i);
	const goc = (i) => (cha[i] === i ? i : (cha[i] = goc(cha[i])));
	for (let i = 0; i < ds.length; i++)
		for (let j = i + 1; j < ds.length; j++)
			if (doGiong(tap[i], tap[j]) >= nguong) cha[goc(i)] = goc(j);
	const nhom = new Map();
	ds.forEach((b, i) => {
		const g = goc(i);
		if (!nhom.has(g)) nhom.set(g, []);
		nhom.get(g).push(b.id);
	});
	return [...nhom.values()].map((n) => n.sort((x, y) => (x > y ? 1 : -1)));
}

/**
 * Bài có sẵn giống chủ đề mới nhất, nếu vượt ngưỡng.
 * @returns {{id:number|string, doGiong:number} | null}
 */
export function timTrung(moi, ds, nguong = NGUONG_TRUNG) {
	const a = tapKhoa(moi);
	let tot = null;
	for (const b of ds) {
		const v = doGiong(a, tapKhoa(b));
		if (v >= nguong && (!tot || v > tot.doGiong)) tot = { id: b.id, doGiong: v };
	}
	return tot;
}

const TIEN_TO = /^(huyet|kinh|bai thuoc|vi thuoc|duoc lieu|cay|benh) /;

/**
 * Từ khoá chính có trùng tên một mục từ điển không. `tenTuDien` là Set các tên đã qua
 * chuanHoaManh. Thử cả nguyên dạng lẫn dạng bỏ tiền tố ("huyệt tam âm giao" → "tam am giao").
 * @returns {string|null} tên khớp
 */
export function trungTuDien(tuKhoaChinh, tenTuDien) {
	const k = chuanHoaManh(tuKhoaChinh);
	if (tenTuDien.has(k)) return k;
	const bo = k.replace(TIEN_TO, "");
	return bo !== k && tenTuDien.has(bo) ? bo : null;
}
```

- [ ] **Step 4: Chạy, xác nhận đạt**

Run: `node --test src/plugins/rada-seo/luat/trung-lap.test.mjs`
Expected: `pass 5`, `fail 0`. (Đã đo: cặp #16–#17 = 0,304 — sát ngưỡng; nếu đổi `TU_DUNG` mà #17 rời nhóm thì phép kiểm vàng báo ngay.)

- [ ] **Step 5: Commit**

```bash
git add cms/src/plugins/rada-seo/luat/chuan-hoa.mjs cms/src/plugins/rada-seo/luat/trung-lap.mjs cms/src/plugins/rada-seo/luat/trung-lap.test.mjs cms/src/plugins/rada-seo/luat/__fixture__/bai-viet-30-09.json
git commit -m "feat(rada-seo): chống trùng chủ đề, phép kiểm vàng trên 22 bài thật" -- cms/src/plugins/rada-seo/luat/
```

---

### Task 3: Rào phạm vi hành nghề Y sỹ

**Files:**
- Create: `cms/src/plugins/rada-seo/luat/pham-vi-y-sy.mjs`
- Test: `cms/src/plugins/rada-seo/luat/pham-vi-y-sy.test.mjs`

**Interfaces:**
- Produces: `timViPham(vanBan): {ma, tu, cau, goiY}[]` với `ma ∈ chua|tri|kham_benh|hua_khoi|bac_si_minh`; `kiemPhamVi({tieuDe, moTa, noiDung}): {chan: boolean, viPhamDau: [], viPhamThan: []}`.

- [ ] **Step 1: Viết phép kiểm (thất bại)**

`cms/src/plugins/rada-seo/luat/pham-vi-y-sy.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { timViPham, kiemPhamVi } from "./pham-vi-y-sy.mjs";

const ma = (s) => timViPham(s).map((v) => v.ma);

test("bắt đúng các tiêu đề/từ khoá thật đã lọt ngày 30/09", () => {
	assert.deepEqual(ma("Ứng dụng châm cứu chữa bệnh hiệu quả và kỹ thuật châm cứu an toàn"), ["chua"]);
	assert.deepEqual(ma("đông y chữa thoái hóa khớp"), ["chua"]);
	assert.deepEqual(ma("trị đau khớp bằng đông y"), ["tri"]);
	assert.deepEqual(ma("thuốc nam trị ho"), ["tri"]);
});

test("không vu oan thuật ngữ YHCT và từ đồng dạng", () => {
	for (const s of [
		"Biện Chứng Luận Trị Theo Kinh Lạc: Chìa Khóa Chẩn Đoán Và Điều Trị Đông Y",
		"Khám Phá Bài Thuốc Xương Khớp Đông Y",
		"giá trị dinh dưỡng của hạt sen",
		"trị số nhiệt độ ở tỉnh huyệt",
		"pháp trị và chủ trị của bài thuốc",
		"Hồ Sơ Chẩn Trị",
		"vật lý trị liệu kết hợp châm cứu",
		"Phần mềm Đông Y: Giải pháp Số hóa Toàn diện cho Phòng khám",
	]) assert.deepEqual(ma(s), [], s);
});

test("câu miễn trừ nói về người khác được bỏ qua", () => {
	assert.deepEqual(ma("Bài viết không thay thế việc thăm khám và chữa trị của bác sĩ có chuyên môn."), []);
});

test("bắt khám bệnh, hứa khỏi, bác sĩ-của-mình", () => {
	assert.deepEqual(ma("Hãy đến khám bệnh sớm."), ["kham_benh"]);
	assert.deepEqual(ma("Giúp khỏi hẳn đau lưng."), ["hua_khoi"]);
	assert.deepEqual(ma("Đội ngũ bác sĩ giàu kinh nghiệm."), ["bac_si_minh"]);
});

test("kiemPhamVi: chặn khi lỗi ở tiêu đề, chỉ cờ khi lỗi ở thân", () => {
	assert.equal(kiemPhamVi({ tieuDe: "Châm cứu chữa bệnh", noiDung: "" }).chan, true);
	const r = kiemPhamVi({ tieuDe: "Châm cứu là gì", noiDung: "Châm cứu giúp chữa mất ngủ." });
	assert.equal(r.chan, false);
	assert.equal(r.viPhamThan.length, 1);
});
```

- [ ] **Step 2: Chạy, xác nhận thất bại**

Run: `node --test src/plugins/rada-seo/luat/pham-vi-y-sy.test.mjs` → FAIL (module không có).

- [ ] **Step 3: Viết mã**

`cms/src/plugins/rada-seo/luat/pham-vi-y-sy.mjs`:

```js
// Rào phạm vi hành nghề Y sỹ: chữ nào hàm ý "khám bệnh, chữa bệnh" thì không được đứng
// trong bài máy viết. Đây là LUẬT, không nhờ mô hình tự chấm — ngày 30/09/2026 mô hình đã
// gắn "An toàn" cho "Ứng dụng châm cứu chữa bệnh hiệu quả…".
//
// GIỮ NGUYÊN (thuật ngữ YHCT chuẩn): điều trị, chẩn trị, pháp trị, chủ trị, luận trị, chẩn đoán.
// "Phòng khám" KHÔNG chặn: trong blog nó gần như luôn nói về khách hàng mua phần mềm.
// Câu miễn trừ ("không thay thế… thăm khám… bác sĩ") được bỏ qua — nó nói về người KHÁC.

const LUAT = [
	{ ma: "chua", mau: /(?<!\p{L})chữa(?!\p{L})/u, goiY: "hỗ trợ / cải thiện / theo lý luận Đông Y" },
	{
		ma: "tri",
		// Loại: điều trị, chẩn trị, pháp trị, chủ trị, luận trị, giá trị, cai trị; trị liệu, trị số.
		mau: /(?<!(?:điều|chẩn|pháp|chủ|luận|giá|cai) )(?<!\p{L})trị(?!\p{L})(?! (?:liệu|số)(?!\p{L}))/u,
		goiY: "hỗ trợ / điều hoà",
	},
	{ ma: "kham_benh", mau: /(?<!\p{L})khám (?:bệnh|chữa)(?!\p{L})/u, goiY: "đo kinh lạc / tư vấn" },
	{ ma: "hua_khoi", mau: /(?<!\p{L})(?:khỏi (?:hẳn|bệnh|hoàn toàn)|dứt điểm)(?!\p{L})/u, goiY: "bỏ lời hứa kết quả" },
	{ ma: "bac_si_minh", mau: /(?:đội ngũ bác s[ĩỹ]|bác s[ĩỹ] (?:của chúng tôi|kinh lạc))/u, goiY: "thầy thuốc / Y sỹ Y học cổ truyền" },
];

const MIEN_TRU = /không thay thế|thăm khám|tham khảo ý kiến/u;

/** Tách câu theo dấu kết câu và xuống dòng. */
function tachCau(s) {
	return String(s ?? "").split(/(?<=[.!?])\s+|\n+/u).filter((c) => c.trim());
}

/**
 * @returns {{ma:string, tu:string, cau:string, goiY:string}[]}
 */
export function timViPham(vanBan) {
	const ra = [];
	for (const cau of tachCau(vanBan)) {
		const thuong = cau.toLowerCase();
		if (MIEN_TRU.test(thuong)) continue;
		for (const l of LUAT) {
			const m = thuong.match(l.mau);
			if (m) ra.push({ ma: l.ma, tu: m[0], cau: cau.trim(), goiY: l.goiY });
		}
	}
	return ra;
}

/**
 * `chan` = vi phạm ở tiêu đề hoặc mô tả → không tạo nháp nếu viết lại vẫn trượt.
 * Vi phạm trong thân bài → viết lại một lần, còn thì cờ đỏ.
 */
export function kiemPhamVi({ tieuDe = "", moTa = "", noiDung = "" }) {
	const dau = [...timViPham(tieuDe), ...timViPham(moTa)];
	const than = timViPham(noiDung);
	return { chan: dau.length > 0, viPhamDau: dau, viPhamThan: than };
}
```

- [ ] **Step 4: Chạy, xác nhận đạt**

Run: `node --test src/plugins/rada-seo/luat/pham-vi-y-sy.test.mjs` → `pass 5`, `fail 0`.

- [ ] **Step 5: Commit**

```bash
git add cms/src/plugins/rada-seo/luat/pham-vi-y-sy.mjs cms/src/plugins/rada-seo/luat/pham-vi-y-sy.test.mjs
git commit -m "feat(rada-seo): rào phạm vi Y sỹ bằng luật, bắt đúng 4 tiêu đề thật đã lọt" -- cms/src/plugins/rada-seo/luat/
```

---

### Task 4: Dò liều lượng / phác đồ / lời hứa (YMYL)

**Files:**
- Create: `cms/src/plugins/rada-seo/luat/ymyl.mjs`
- Test: `cms/src/plugins/rada-seo/luat/ymyl.test.mjs`

**Interfaces:**
- Produces: `doYmyl(vanBan): {loai: 'lieu'|'phac_do'|'hua_hen', doan: string}[]` — mảng rỗng = không cờ đỏ.

- [ ] **Step 1: Viết phép kiểm (thất bại)**

`cms/src/plugins/rada-seo/luat/ymyl.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { doYmyl } from "./ymyl.mjs";

const loai = (s) => doYmyl(s).map((v) => v.loai);

test("bắt liều lượng", () => {
	assert.deepEqual(loai("Bán hạ 6g, Trần bì 4,5 g"), ["lieu", "lieu"]);
	assert.deepEqual(loai("uống 2 viên"), ["lieu"]);
});

test("bắt phác đồ", () => {
	assert.deepEqual(loai("Ngày uống 1 thang, chia 2 lần"), ["lieu", "phac_do"]);
	assert.deepEqual(loai("liệu trình 10 ngày"), ["phac_do"]);
});

test("bắt lời hứa — đúng tiêu đề bài #6 đã đăng", () => {
	assert.deepEqual(loai("Bệnh Hô Hấp Đông Y: Chẩn Đoán, Điều Trị Ho, Viêm Phế Quản Hiệu Quả"), ["hua_hen"]);
});

test("không bắt số không phải liều", () => {
	assert.deepEqual(loai("12 đường kinh và 24 tỉnh huyệt, năm 1983"), []);
});
```

- [ ] **Step 2: Chạy, xác nhận thất bại**

Run: `node --test src/plugins/rada-seo/luat/ymyl.test.mjs` → FAIL.

- [ ] **Step 3: Viết mã**

`cms/src/plugins/rada-seo/luat/ymyl.mjs`:

```js
// Dò liều lượng, phác đồ và lời hứa kết quả trong bài máy viết. Trúng → nháp vẫn tạo nhưng
// mang cờ đỏ YMYL để người duyệt đọc kỹ; KHÔNG tự sửa (liều là nội dung, không phải hình thức).

const MAU = [
	{ loai: "lieu", mau: /\d+(?:[.,]\d+)?\s?(?:g|gam|gram|mg|ml|viên|thang|chén)(?!\p{L})/giu },
	{ loai: "phac_do", mau: /(?:ngày (?:uống|dùng|sắc)|mỗi ngày|liệu trình|phác đồ)[^.\n]{0,20}\d/giu },
	{ loai: "hua_hen", mau: /điều trị[^.:;!?\n]{0,40}hiệu quả|cam kết|100\s?%/giu },
];

/** @returns {{loai:'lieu'|'phac_do'|'hua_hen', doan:string}[]} */
export function doYmyl(vanBan) {
	const s = String(vanBan ?? "");
	const ra = [];
	for (const { loai, mau } of MAU) for (const m of s.matchAll(mau)) ra.push({ loai, doan: m[0] });
	return ra;
}
```

- [ ] **Step 4: Chạy, xác nhận đạt**

Run: `node --test src/plugins/rada-seo/luat/ymyl.test.mjs` → `pass 4`, `fail 0`.

- [ ] **Step 5: Commit**

```bash
git add cms/src/plugins/rada-seo/luat/ymyl.mjs cms/src/plugins/rada-seo/luat/ymyl.test.mjs
git commit -m "feat(rada-seo): dò liều lượng, phác đồ, lời hứa kết quả" -- cms/src/plugins/rada-seo/luat/
```

---

### Task 5: Tự chấm SEO

**Files:**
- Create: `cms/src/plugins/rada-seo/luat/seo.mjs`
- Test: `cms/src/plugins/rada-seo/luat/seo.test.mjs`

**Interfaces:**
- Consumes: `boDau` từ `chuan-hoa.mjs` (Task 2).
- Produces: `chamSeo({tieuDe, moTa, noiDungMd, tuKhoaChinh, faq, soAnhThieuAlt}): {ma, dat, ghiChu}[]`, `ma` theo thứ tự: `tieu_de_dai, mo_ta_dai, tu_khoa_tieu_de, tu_khoa_doan_dau, co_h2, co_faq, anh_alt`.

- [ ] **Step 1: Viết phép kiểm (thất bại)**

`cms/src/plugins/rada-seo/luat/seo.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { chamSeo } from "./seo.mjs";

const TOT = {
	tieuDe: "Đồng hồ kinh lạc: 12 đường kinh vượng theo giờ",
	moTa: "Đồng hồ kinh lạc chia ngày thành 12 canh giờ, mỗi giờ một đường kinh vượng. Bài giải thích nguyên lý, bảng giờ và cách vận dụng trong sinh hoạt.",
	noiDungMd: "Đồng hồ kinh lạc là cách người xưa...\n\n## Nguyên lý\n\nx\n\n## Bảng giờ\n\ny",
	tuKhoaChinh: "đồng hồ kinh lạc",
	faq: [1, 2, 3],
	soAnhThieuAlt: 0,
};

test("bài đạt mọi luật", () => {
	assert.deepEqual(chamSeo(TOT).filter((l) => !l.dat), []);
});

test("so từ khoá không phân biệt dấu/hoa", () => {
	const r = chamSeo({ ...TOT, tieuDe: "DONG HO KINH LAC va 12 duong kinh vuong theo gio" });
	assert.equal(r.find((l) => l.ma === "tu_khoa_tieu_de").dat, true);
});

test("bắt từng lỗi", () => {
	const r = chamSeo({ ...TOT, tieuDe: "Ngắn", moTa: "ngắn", noiDungMd: "## Một\n\nx", faq: [], soAnhThieuAlt: 2 });
	assert.deepEqual(r.filter((l) => !l.dat).map((l) => l.ma), ["tieu_de_dai", "mo_ta_dai", "tu_khoa_tieu_de", "tu_khoa_doan_dau", "co_h2", "co_faq", "anh_alt"]);
});
```

- [ ] **Step 2: Chạy, xác nhận thất bại**

Run: `node --test src/plugins/rada-seo/luat/seo.test.mjs` → FAIL.

- [ ] **Step 3: Viết mã**

`cms/src/plugins/rada-seo/luat/seo.mjs`:

```js
// Tự chấm SEO bằng luật. Chỉ cảnh báo (vàng), không chặn: SEO sai thì người duyệt sửa được
// trong vài giây, khác với lỗi phạm vi Y sỹ.
import { boDau } from "./chuan-hoa.mjs";

const co = (vanBan, tuKhoa) => boDau(vanBan).includes(boDau(tuKhoa));

/** Đoạn văn đầu tiên không phải tiêu đề mục, không phải ảnh. */
function doanDau(md) {
	for (const k of String(md ?? "").split(/\n\s*\n/)) {
		const t = k.trim();
		if (t && !t.startsWith("#") && !t.startsWith("![")) return t;
	}
	return "";
}

/**
 * @param {{tieuDe:string, moTa:string, noiDungMd:string, tuKhoaChinh:string, faq:unknown[], soAnhThieuAlt:number}} b
 * @returns {{ma:string, dat:boolean, ghiChu:string}[]}
 */
export function chamSeo({ tieuDe = "", moTa = "", noiDungMd = "", tuKhoaChinh = "", faq = [], soAnhThieuAlt = 0 }) {
	const soH2 = (String(noiDungMd).match(/^## /gm) || []).length;
	return [
		{ ma: "tieu_de_dai", dat: tieuDe.length >= 30 && tieuDe.length <= 60, ghiChu: `tiêu đề ${tieuDe.length} ký tự (30–60)` },
		{ ma: "mo_ta_dai", dat: moTa.length >= 120 && moTa.length <= 160, ghiChu: `mô tả ${moTa.length} ký tự (120–160)` },
		{ ma: "tu_khoa_tieu_de", dat: !!tuKhoaChinh && co(tieuDe, tuKhoaChinh), ghiChu: `từ khoá chính "${tuKhoaChinh}" trong tiêu đề` },
		{ ma: "tu_khoa_doan_dau", dat: !!tuKhoaChinh && co(doanDau(noiDungMd), tuKhoaChinh), ghiChu: "từ khoá chính trong đoạn đầu" },
		{ ma: "co_h2", dat: soH2 >= 2, ghiChu: `${soH2} mục H2 (≥2)` },
		{ ma: "co_faq", dat: Array.isArray(faq) && faq.length >= 3, ghiChu: `${Array.isArray(faq) ? faq.length : 0} câu FAQ (≥3)` },
		{ ma: "anh_alt", dat: soAnhThieuAlt === 0, ghiChu: `${soAnhThieuAlt} ảnh thiếu alt` },
	];
}
```

- [ ] **Step 4: Chạy, xác nhận đạt**

Run: `node --test src/plugins/rada-seo/luat/seo.test.mjs` → `pass 3`, `fail 0`.

- [ ] **Step 5: Commit**

```bash
git add cms/src/plugins/rada-seo/luat/seo.mjs cms/src/plugins/rada-seo/luat/seo.test.mjs
git commit -m "feat(rada-seo): tự chấm SEO bằng luật" -- cms/src/plugins/rada-seo/luat/
```

---

### Task 6: Lọc nguồn bịa và link nội bộ chết

**Files:**
- Create: `cms/src/plugins/rada-seo/luat/loc-nguon-link.mjs`
- Test: `cms/src/plugins/rada-seo/luat/loc-nguon-link.test.mjs`

**Interfaces:**
- Produces: `chuanDuong(href): string` (luôn `/…/`), `locNguon(ds: {ten, url?}[], {urlDaQuet: Set, duongCoThat: Set}): {giu, bo}`, `locLink(md, duongCoThat: Set): {md, goBo: string[], soLinkTuDien: number}`.

- [ ] **Step 1: Viết phép kiểm (thất bại)**

`cms/src/plugins/rada-seo/luat/loc-nguon-link.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { locNguon, locLink, chuanDuong } from "./loc-nguon-link.mjs";

const DUONG = new Set(["/huyet/tam-am-giao/", "/kinh/ty/", "/nguon/hoang-de-noi-kinh/", "/blog/dong-ho-kinh-lac/"]);

test("chuanDuong", () => {
	assert.equal(chuanDuong("/huyet/tam-am-giao?x=1#a"), "/huyet/tam-am-giao/");
});

test("locNguon: giữ URL đã quét và trang /nguon/ có thật, loại sách nhớ ra", () => {
	const r = locNguon(
		[
			{ ten: "Vinmec", url: "https://www.vinmec.com/bai-a/" },
			{ ten: "Hoàng Đế Nội Kinh", url: "/nguon/hoang-de-noi-kinh" },
			{ ten: "Châm cứu học, NXB Y học 2005" },
			{ ten: "Trang bịa", url: "https://example.com/khong-co" },
		],
		{ urlDaQuet: new Set(["https://www.vinmec.com/bai-a"]), duongCoThat: DUONG },
	);
	assert.deepEqual(r.giu.map((n) => n.ten), ["Vinmec", "Hoàng Đế Nội Kinh"]);
	assert.deepEqual(r.bo.map((n) => n.ten), ["Châm cứu học, NXB Y học 2005", "Trang bịa"]);
});

test("locLink: gỡ link chết giữ chữ, đếm link từ điển, không đụng ảnh và link ngoài", () => {
	const md = "Xem [Tam Âm Giao](/huyet/tam-am-giao) và [kinh Tỳ](/kinh/ty/), [bài cũ](/blog/dong-ho-kinh-lac/), [ma](/huyet/khong-co/). ![ảnh](/x.png) [ngoài](https://a.vn)";
	const r = locLink(md, DUONG);
	assert.deepEqual(r.goBo, ["/huyet/khong-co/"]);
	assert.equal(r.soLinkTuDien, 2);
	assert.ok(r.md.includes(", ma."));
	assert.ok(r.md.includes("![ảnh](/x.png)"));
	assert.ok(r.md.includes("[ngoài](https://a.vn)"));
});
```

- [ ] **Step 2: Chạy, xác nhận thất bại**

Run: `node --test src/plugins/rada-seo/luat/loc-nguon-link.test.mjs` → FAIL.

- [ ] **Step 3: Viết mã**

`cms/src/plugins/rada-seo/luat/loc-nguon-link.mjs`:

```js
// Rào chống bịa cho nguồn tham khảo và liên kết nội bộ — cùng tinh thần "trích dẫn phải
// khớp thật" của bot thẩm định: thứ gì không trỏ tới một chỗ CÓ THẬT thì bị gỡ.

const NHOM_TU_DIEN = /^\/(huyet|kinh|benh-hoc|cham-cuu-tri-benh|nguon|bai-thuoc|duoc-lieu)\//;

/** Đường dẫn nội bộ về dạng chuẩn: bỏ query/hash, luôn có "/" cuối. */
export function chuanDuong(href) {
	const p = String(href).split(/[?#]/)[0];
	return p.endsWith("/") ? p : `${p}/`;
}

/** URL ngoài về dạng so khớp: bỏ hash, bỏ "/" cuối. */
function chuanUrl(u) {
	return String(u).split("#")[0].replace(/\/+$/, "");
}

/**
 * Giữ nguồn là URL đã thật sự quét được, hoặc một trang /nguon/ có thật.
 * Nguồn không có URL (tên sách mô hình nhớ ra) bị loại.
 * @param {{ten:string, url?:string}[]} ds
 * @param {{urlDaQuet:Set<string>, duongCoThat:Set<string>}} kho
 */
export function locNguon(ds, { urlDaQuet, duongCoThat }) {
	const quet = new Set([...urlDaQuet].map(chuanUrl));
	const giu = [], bo = [];
	for (const n of ds ?? []) {
		const u = n?.url;
		const ok = !!u && (u.startsWith("/") ? duongCoThat.has(chuanDuong(u)) : quet.has(chuanUrl(u)));
		(ok ? giu : bo).push(n);
	}
	return { giu, bo };
}

/**
 * Gỡ link nội bộ trỏ tới trang không có (giữ lại chữ), đếm link còn lại vào từ điển.
 * @param {string} md
 * @param {Set<string>} duongCoThat  đường dẫn dạng chuanDuong
 */
export function locLink(md, duongCoThat) {
	const goBo = [];
	let soLinkTuDien = 0;
	const ra = String(md ?? "").replace(/(?<!!)\[([^\]]+)\]\((\/[^)\s]*)\)/g, (toan, chu, href) => {
		const d = chuanDuong(href);
		if (!duongCoThat.has(d)) {
			goBo.push(href);
			return chu;
		}
		if (NHOM_TU_DIEN.test(d)) soLinkTuDien++;
		return toan;
	});
	return { md: ra, goBo, soLinkTuDien };
}
```

- [ ] **Step 4: Chạy cả bộ luật**

Run (trong `cms/`): `node --test "src/plugins/rada-seo/luat/*.test.mjs"` (Node 26 không nhận đường dẫn thư mục)
Expected: `pass 20`, `fail 0`.

- [ ] **Step 5: Commit**

```bash
git add cms/src/plugins/rada-seo/luat/loc-nguon-link.mjs cms/src/plugins/rada-seo/luat/loc-nguon-link.test.mjs
git commit -m "feat(rada-seo): lọc nguồn bịa và link nội bộ chết" -- cms/src/plugins/rada-seo/luat/
```

---

## Sau kế hoạch này

- Kế hoạch 2 (viết sau khi có tệp kết quả bước 0): plugin `rada-seo` — storage (đối thủ, URL, khoảng trống, nhật ký ca), client Yescale (parse thân `text/plain`, timeout khai tay, trần lượt gọi kể cả lượt hỏng), ca radar 02:30, ca viết 05:00 (5 bài, nghỉ khi ≥25 nháp), ảnh (ảnh thật cho huyệt/kinh, AI chỉ cho bìa), phiếu chấm `editorPanels`, màn điều khiển, hook `content:afterPublish` → IndexNow.
- Kế hoạch 3: `/blog/` sang CMS (nginx, bỏ `build-blog`, denylist service worker, sitemap mục lục + `/blog/sitemap.xml`, `kiem-sitemap`/`kiem-seo`), di chuyển `seo_*` + 22 nháp (người dùng chọn bài giữ trong nhóm trùng) + đổi tiêu đề/slug bài vượt phạm vi, gắn tab SEO Radar của app thành nút mở màn plugin.
