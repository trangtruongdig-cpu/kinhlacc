import { test } from "node:test";
import assert from "node:assert/strict";
import { chamSeo, NGUONG, CAU_NGUONG } from "./seo.mjs";
import { LOI_NHAC_VIET } from "../loi-dan.mjs";
import { KHUON_NOP } from "../viet/viec.mjs";

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

// Chốt chặn 01/10/2026: lời dặn cho mô hình, dải đạt của phiếu và rào cứng lúc nộp phải
// nói CÙNG một thứ. Trước đó lời dặn nói 30–70/100–170 còn phiếu đạt 30–60/120–160, nên bài
// viết đúng lời dặn vẫn bị phiếu báo trượt hai mục.
test("lời dặn nói đúng dải mà phiếu chấm", () => {
	assert.ok(LOI_NHAC_VIET.includes(CAU_NGUONG), "LOI_NHAC_VIET phải nhúng CAU_NGUONG, không gõ lại số");
	for (const k of ["tieuDe", "moTa"]) {
		assert.ok(LOI_NHAC_VIET.includes(`${NGUONG[k][0]}–${NGUONG[k][1]}`), `lời dặn thiếu dải ${k}`);
	}
	// Dải cũ không được còn sót lại ở đâu trong lời dặn.
	for (const cu of ["30–70", "100–170"]) assert.ok(!LOI_NHAC_VIET.includes(cu), `lời dặn còn dải cũ ${cu}`);
});

test("rào cứng lúc nộp chứa trọn dải đạt", () => {
	const hop = (tieuDe, moTa) =>
		KHUON_NOP.safeParse({
			keHoachId: "k1", tieuDe, moTa, md: "x",
			tuKhoa: ["a"],
			faq: [{ q: "q", a: "a" }, { q: "q2", a: "a2" }, { q: "q3", a: "a3" }],
			nguon: [{ title: "n" }],
		}).success;
	// Hai đầu dải đạt đều phải qua được rào cứng, không thì bài đạt phiếu lại bị trả lại.
	for (const t of NGUONG.tieuDe) for (const m of NGUONG.moTa) {
		assert.ok(hop("x".repeat(t), "y".repeat(m)), `rào cứng chặn bài đạt phiếu (tiêu đề ${t}, mô tả ${m})`);
	}
});

test("bắt từng lỗi", () => {
	const r = chamSeo({ ...TOT, tieuDe: "Ngắn", moTa: "ngắn", noiDungMd: "## Một\n\nx", faq: [], soAnhThieuAlt: 2 });
	assert.deepEqual(r.filter((l) => !l.dat).map((l) => l.ma), ["tieu_de_dai", "mo_ta_dai", "tu_khoa_tieu_de", "tu_khoa_doan_dau", "co_h2", "co_faq", "anh_alt"]);
});
