import { test } from "node:test";
import assert from "node:assert/strict";
import { kiemLienKetThan } from "./lien-ket-than.mjs";

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

const THAN = `Mở đầu nói về [kinh Tâm](/kinh/tam/) và giấc ngủ.

## Huyệt thường dùng

- [Thần Môn](/huyet/than-mon/) nằm ở cổ tay.
- [Tam Âm Giao](https://kinhlac.online/huyet/tam-am-giao) ở cẳng chân.
- [Nội Quan](/huyet/noi-quan/#vi-tri) giữa hai gân.
- Xem [mất ngủ](/benh-hoc/mat-ngu/?a=1) và [Hoàng Kỳ](/duoc-lieu/12/).
- Lại nhắc [Thần Môn](/huyet/than-mon/) lần hai.
`;

test("link trong kế hoạch giữ nguyên, không cần tải; đếm link đích KHÁC NHAU còn lại", async () => {
	const { kiem, goi } = kiemGia({});
	const r = await kiemLienKetThan(THAN, { keHoach: KE_HOACH, kiemDuong: kiem, goc: GOC });
	assert.equal(r.md, THAN);
	assert.equal(r.soDich, 5);
	assert.equal(r.coTruCot, true);
	assert.equal(r.dat, true);
	assert.deepEqual(r.goBo, []);
	assert.equal(goi.length, 0);
});

test("link ngoài trong thân → gỡ, giữ chữ neo; ảnh markdown không đụng tới", async () => {
	const { kiem } = kiemGia({});
	const md = `Theo [PubMed](https://pubmed.ncbi.nlm.nih.gov/1/ "tiêu đề") và [thư](mailto:a@b.vn), ![ảnh](https://x.vn/a.png) còn [Thần Môn](/huyet/than-mon/).`;
	const r = await kiemLienKetThan(md, { keHoach: KE_HOACH, kiemDuong: kiem, goc: GOC });
	assert.equal(r.md, `Theo PubMed và thư, ![ảnh](https://x.vn/a.png) còn [Thần Môn](/huyet/than-mon/).`);
	assert.deepEqual(r.goBo, [
		{ href: "https://pubmed.ncbi.nlm.nih.gov/1/", neo: "PubMed", lyDo: "link_ngoai" },
		{ href: "mailto:a@b.vn", neo: "thư", lyDo: "link_ngoai" },
	]);
	assert.equal(r.soDich, 1);
	assert.equal(r.coTruCot, false);
	assert.equal(r.dat, false);
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
	const r = await kiemLienKetThan(md, { keHoach: KE_HOACH, kiemDuong: kiem, goc: GOC });
	assert.equal(r.md, "[huyệt Bách Hội](/huyet/bach-hoi/) Ẩm Khích [bài về giấc ngủ](https://kinhlac.online/blog/giac-ngu/) trang bịa neo");
	assert.deepEqual(
		r.goBo.map((x) => [x.href, x.lyDo]),
		[
			["/huyet/am-khich/", "khong_dat"],
			["/huyet/khong-co/", "khong_dat"],
			["#muc-2", "neo_trong_trang"],
		],
	);
	// Ngoài kế hoạch thì không tính vào soDich.
	assert.equal(r.soDich, 0);
	assert.ok(goi.some(([d, t]) => d === "/huyet/bach-hoi/" && t === "Bách Hội"));
});

test("kiemDuong ném lỗi → gỡ (loi_kiem), không ném ra ngoài; link trong khối code không đụng", async () => {
	const kiem = async () => {
		throw new Error("mạng chập");
	};
	const md = "Chữ [X Y](/huyet/x-y/).\n\n```\n[giữ](/huyet/a/)\n```\n";
	const r = await kiemLienKetThan(md, { keHoach: KE_HOACH, kiemDuong: kiem, goc: GOC });
	assert.equal(r.md, "Chữ X Y.\n\n```\n[giữ](/huyet/a/)\n```\n");
	assert.deepEqual(r.goBo.map((x) => x.lyDo), ["loi_kiem"]);
});

test("kế hoạch dạng {duong, ten}; trụ cột không tính vào soDich dù nằm trong lienKetDich", async () => {
	const { kiem } = kiemGia({});
	const keHoach = {
		trangTruCot: { duong: "/kinh/tam/", ten: "Kinh Tâm" },
		lienKetDich: [{ duong: "/kinh/tam/", ten: "Kinh Tâm" }, { duong: "/huyet/than-mon", ten: "Thần Môn" }],
	};
	const r = await kiemLienKetThan("[Tâm](/kinh/tam) và [Thần Môn](/huyet/than-mon/)", { keHoach, kiemDuong: kiem, goc: GOC });
	assert.equal(r.coTruCot, true);
	assert.equal(r.soDich, 1);
	assert.deepEqual(r.goBo, []);
});

test("cùng một đường nội bộ ngoài kế hoạch chỉ kiểm theo từng chữ neo; md rỗng không lỗi", async () => {
	const { kiem, goi } = kiemGia({ "/huyet/bach-hoi/": "Bách Hội" });
	const r = await kiemLienKetThan("[Bách Hội](/huyet/bach-hoi/) rồi [Bách Hội](/huyet/bach-hoi/)", { keHoach: KE_HOACH, kiemDuong: kiem, goc: GOC });
	assert.equal(goi.length, 1);
	assert.equal(r.goBo.length, 0);
	const rong = await kiemLienKetThan("", { keHoach: {}, kiemDuong: kiem, goc: GOC });
	assert.deepEqual(rong, { md: "", soDich: 0, coTruCot: false, dat: false, goBo: [] });
});
