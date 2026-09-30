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
