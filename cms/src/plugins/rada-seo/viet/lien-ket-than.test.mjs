import { test } from "node:test";
import assert from "node:assert/strict";
import { markdownToPortableText } from "emdash/client";
import { kiemLienKetThan } from "./lien-ket-than.mjs";

// Soát link chạy trên Portable Text SAU bộ chuyển thật (rà soát 2C-3 H1): bộ tách link của
// chính EmDash quyết định thứ gì thành link, nên không còn hai bộ tách lệch nhau.
const GOC = "https://kinhlac.online";
const KE_HOACH = {
	trangTruCot: "/kinh/tam/",
	lienKetDich: ["/huyet/than-mon/", "/huyet/tam-am-giao/", "/huyet/noi-quan/", "/benh-hoc/mat-ngu/", "/duoc-lieu/12/", "/nguon/thuong-han-luan/"],
};
function kiemGia(song) {
	const goi = [];
	// song: đường → tên có trên trang (null = sống, không cần tên)
	const kiem = async (duong, ten) => {
		goi.push([duong, ten]);
		if (!(duong in song)) return false;
		return song[duong] == null || !ten || ten === song[duong];
	};
	return { kiem, goi };
}
const pt = (md) => markdownToPortableText(md);
/** Mọi href còn lại trong PT. */
const hrefs = (p) => p.flatMap((b) => b.markDefs ?? []).map((m) => m.href);
/** Chữ của một khối. */
const chu = (b) => (b.children ?? []).map((c) => c.text).join("");
/** Mọi mark tham chiếu đều có markDef trong khối. */
function khongMoCoi(p) {
	for (const b of p) {
		const defs = new Set((b.markDefs ?? []).map((m) => m._key));
		for (const s of b.children ?? []) for (const m of s.marks ?? []) if (!["strong", "em", "code", "strike-through"].includes(m)) assert.ok(defs.has(m), `mark ${m} mồ côi`);
	}
}

const THAN = `Mở đầu nói về [kinh Tâm](/kinh/tam/) và giấc ngủ.

## Huyệt thường dùng

- [Thần Môn](/huyet/than-mon/) nằm ở cổ tay.
- [Tam Âm Giao](https://kinhlac.online/huyet/tam-am-giao) ở cẳng chân.
- [Nội Quan](/huyet/noi-quan/#vi-tri) giữa hai gân.
- Xem [mất ngủ](/benh-hoc/mat-ngu/?a=1) và [Hoàng Kỳ](/duoc-lieu/12/).
- Lại nhắc [Thần Môn](/huyet/than-mon/) lần hai.`;

test("link trong kế hoạch giữ (href chuẩn về đường nội bộ), không cần tải; đếm link đích KHÁC NHAU", async () => {
	const { kiem, goi } = kiemGia({});
	const r = await kiemLienKetThan(pt(THAN), { keHoach: KE_HOACH, kiemDuong: kiem, goc: GOC });
	assert.equal(r.soDich, 5);
	assert.equal(r.coTruCot, true);
	assert.equal(r.dat, true);
	assert.deepEqual(r.goBo, []);
	assert.deepEqual(r.nguyHiem, []);
	assert.equal(goi.length, 0);
	assert.deepEqual(hrefs(r.pt), ["/kinh/tam/", "/huyet/than-mon/", "/huyet/tam-am-giao/", "/huyet/noi-quan/", "/benh-hoc/mat-ngu/", "/duoc-lieu/12/", "/huyet/than-mon/"]);
	khongMoCoi(r.pt);
});

test("link ngoài → gỡ mark + markDef, giữ chữ neo; không sửa PT vào", async () => {
	const { kiem } = kiemGia({});
	const vao = pt(`Theo [PubMed](https://pubmed.ncbi.nlm.nih.gov/1/) và [thư](mailto:a@b.vn) còn [Thần Môn](/huyet/than-mon/).`);
	const truoc = structuredClone(vao);
	const r = await kiemLienKetThan(vao, { keHoach: KE_HOACH, kiemDuong: kiem, goc: GOC });
	assert.deepEqual(vao, truoc);
	assert.equal(chu(r.pt[0]), "Theo PubMed và thư còn Thần Môn.");
	assert.deepEqual(hrefs(r.pt), ["/huyet/than-mon/"]);
	assert.deepEqual(r.goBo, [
		{ href: "https://pubmed.ncbi.nlm.nih.gov/1/", neo: "PubMed", lyDo: "link_ngoai" },
		{ href: "mailto:a@b.vn", neo: "thư", lyDo: "link_ngoai" },
	]);
	assert.equal(r.soDich, 1);
	assert.equal(r.coTruCot, false);
	assert.equal(r.dat, false);
	khongMoCoi(r.pt);
});

test("H1: link bộ tách của EmDash nhận mà regex cũ bỏ sót (//evil.com, 'java script:') → nguy hiểm, gỡ sạch", async () => {
	const { kiem } = kiemGia({});
	const vao = pt("Xem [a]b](//evil.com) nhé. Và [x](java script:alert(1)) cùng [y](javascript:alert(1)) và [z](data:text/html,1) và [w](/\\evil.com) và [v](JAVASCRIPT:x).");
	// Chứng minh tiền đề: bộ chuyển thật sinh ra đủ các markDef này.
	assert.equal(hrefs(vao).length, 6);
	const r = await kiemLienKetThan(vao, { keHoach: KE_HOACH, kiemDuong: kiem, goc: GOC });
	assert.deepEqual(hrefs(r.pt), []);
	assert.deepEqual(
		r.nguyHiem.map((x) => x.href),
		["//evil.com", "java script:alert(1", "javascript:alert(1", "data:text/html,1", "/\\evil.com", "JAVASCRIPT:x"],
	);
	khongMoCoi(r.pt);
});

test("link nội bộ ngoài kế hoạch: kiemDuong với chữ neo (và bản bỏ tiền tố) → đạt giữ, trượt gỡ", async () => {
	const { kiem, goi } = kiemGia({ "/huyet/bach-hoi/": "Bách Hội", "/huyet/am-khich/": "Âm Khích", "/blog/giac-ngu/": null });
	const md = [
		"[huyệt Bách Hội](/huyet/bach-hoi/)",
		"[Ẩm Khích](/huyet/am-khich/)",
		"[bài về giấc ngủ](https://kinhlac.online/blog/giac-ngu/)",
		"[trang bịa](/huyet/khong-co/)",
		"[neo](#muc-2)",
	].join(" ");
	const r = await kiemLienKetThan(pt(md), { keHoach: KE_HOACH, kiemDuong: kiem, goc: GOC });
	assert.equal(chu(r.pt[0]), "huyệt Bách Hội Ẩm Khích bài về giấc ngủ trang bịa neo");
	assert.deepEqual(hrefs(r.pt), ["/huyet/bach-hoi/", "/blog/giac-ngu/"]);
	assert.deepEqual(
		r.goBo.map((x) => [x.href, x.lyDo]),
		[
			["/huyet/am-khich/", "khong_dat"],
			["/huyet/khong-co/", "khong_dat"],
			["#muc-2", "neo_trong_trang"],
		],
	);
	assert.equal(r.soDich, 0);
	assert.ok(goi.some(([d, t]) => d === "/huyet/bach-hoi/" && t === "Bách Hội"));
});

test("kiemDuong ném lỗi → gỡ (loi_kiem), không ném ra ngoài", async () => {
	const kiem = async () => {
		throw new Error("mạng chập");
	};
	const r = await kiemLienKetThan(pt("Chữ [X Y](/huyet/x-y/)."), { keHoach: KE_HOACH, kiemDuong: kiem, goc: GOC });
	assert.equal(chu(r.pt[0]), "Chữ X Y.");
	assert.deepEqual(r.goBo.map((x) => x.lyDo), ["loi_kiem"]);
});

test("kế hoạch dạng {duong, ten}; trụ cột không tính vào soDich dù nằm trong lienKetDich", async () => {
	const { kiem } = kiemGia({});
	const keHoach = {
		trangTruCot: { duong: "/kinh/tam/", ten: "Kinh Tâm" },
		lienKetDich: [{ duong: "/kinh/tam/", ten: "Kinh Tâm" }, { duong: "/huyet/than-mon", ten: "Thần Môn" }],
	};
	const r = await kiemLienKetThan(pt("[Tâm](/kinh/tam) và [Thần Môn](/huyet/than-mon/)"), { keHoach, kiemDuong: kiem, goc: GOC });
	assert.equal(r.coTruCot, true);
	assert.equal(r.soDich, 1);
	assert.deepEqual(r.goBo, []);
});

test("cùng một đường nội bộ ngoài kế hoạch chỉ kiểm theo từng chữ neo; PT rỗng không lỗi", async () => {
	const { kiem, goi } = kiemGia({ "/huyet/bach-hoi/": "Bách Hội" });
	const r = await kiemLienKetThan(pt("[Bách Hội](/huyet/bach-hoi/) rồi [Bách Hội](/huyet/bach-hoi/)"), { keHoach: KE_HOACH, kiemDuong: kiem, goc: GOC });
	assert.equal(goi.length, 1);
	assert.equal(r.goBo.length, 0);
	const rong = await kiemLienKetThan([], { keHoach: {}, kiemDuong: kiem, goc: GOC });
	assert.deepEqual(rong, { pt: [], soDich: 0, coTruCot: false, dat: false, goBo: [], nguyHiem: [] });
});

test("I9: trần 20 đường mới mỗi lượt — phần dư gỡ 'vuot_tran', không gọi kiemDuong", async () => {
	const { kiem, goi } = kiemGia({});
	const md = Array.from({ length: 25 }, (_, i) => `[Mục ${i}](/huyet/muc-${i}/)`).join(" ");
	const r = await kiemLienKetThan(pt(md), { keHoach: KE_HOACH, kiemDuong: kiem, goc: GOC });
	assert.equal(new Set(goi.map(([d]) => d)).size, 20);
	assert.equal(r.goBo.filter((g) => g.lyDo === "vuot_tran").length, 5);
	assert.equal(r.goBo.filter((g) => g.lyDo === "khong_dat").length, 20);
});

test("I9: hạn tổng 30 s — kiemDuong treo không giữ cả lượt; phần còn lại gỡ 'het_gio'", async () => {
	let t = 0;
	const now = () => t;
	const kiem = async (duong) => {
		if (duong === "/huyet/treo/") return new Promise(() => {});
		t += 40_000; // mỗi lượt kiểm "tốn" 40 s trên đồng hồ tiêm
		return true;
	};
	const md = "[Treo](/huyet/treo/) [A](/huyet/a/) [B](/huyet/b/) [Thần Môn](/huyet/than-mon/)";
	const r = await kiemLienKetThan(pt(md), { keHoach: KE_HOACH, kiemDuong: kiem, goc: GOC, hanTongMs: 30, now });
	assert.deepEqual(
		r.goBo.map((g) => [g.href, g.lyDo]),
		[["/huyet/treo/", "het_gio"], ["/huyet/b/", "het_gio"]],
	);
	// Link trong kế hoạch không cần kiểm nên không bị hạn tổng gỡ.
	assert.deepEqual(hrefs(r.pt), ["/huyet/a/", "/huyet/than-mon/"]);
});
