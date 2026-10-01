import { test } from "node:test";
import assert from "node:assert/strict";
import { timBaiNenLinkNguoc, daCoLink, chonNeo, tronSo, duongBai, TRAN_BAI_CU, TRAN_MOI_BAI_CU } from "./lien-ket-nguoc.mjs";

const MOI = {
	slug: "huyet-than-mon-ho-tro-giac-ngu",
	tieuDe: "Huyệt Thần Môn hỗ trợ giấc ngủ theo Đông y",
	tuKhoa: ["huyệt Thần Môn", "hỗ trợ giấc ngủ", "mất ngủ theo Đông y"],
	cumId: "cum-mat-ngu",
};
const bai = (id, tieuDe, tuKhoa, chu, them = {}) => ({ id, slug: id, tieuDe, tuKhoa, chu, than: chu, ...them });

test("daCoLink: nhận cả dạng thiếu '/' cuối, không nhận slug chỉ là tiền tố", () => {
	assert.equal(daCoLink("xem [bài](/blog/huyet-than-mon-ho-tro-giac-ngu/) nhé", MOI.slug), true);
	assert.equal(daCoLink("xem /blog/huyet-than-mon-ho-tro-giac-ngu nhé", MOI.slug), true);
	assert.equal(daCoLink("không có link nào", MOI.slug), false);
	// Bẫy: slug khác DÀI HƠN nhưng bắt đầu bằng slug này.
	assert.equal(daCoLink("/blog/huyet-than-mon-ho-tro-giac-ngu-phan-2/", MOI.slug), false);
});

test("chonNeo: chọn cụm DÀI nhất có thật trong bài cũ, không có thì null", () => {
	assert.equal(chonNeo(MOI, "Bài này nói về huyệt Thần Môn và cách bấm."), "huyệt Thần Môn");
	// So bỏ dấu: bài cũ viết không dấu vẫn khớp.
	assert.equal(chonNeo(MOI, "noi ve huyet than mon"), "huyệt Thần Môn");
	assert.equal(chonNeo(MOI, "Bài này nói về châm cứu vai gáy."), null);
});

test("cùng cụm thì được nối, bài khác mảng nhu cầu thì KHÔNG", () => {
	const ds = timBaiNenLinkNguoc(MOI, [
		bai("mat-ngu-the-benh", "Mất ngủ theo thể bệnh Đông y", ["mất ngủ theo Đông y"], "Người mất ngủ theo Đông y chia nhiều thể.", { cumId: "cum-mat-ngu" }),
		bai("cham-cuu-vai-gay", "Châm cứu vai gáy", ["châm cứu vai gáy"], "Vai gáy đau mỏi do phong hàn.", { cumId: "cum-xuong-khop" }),
	]);
	assert.deepEqual(ds.map((x) => x.slug), ["mat-ngu-the-benh"]);
});

test("bài cũ ĐÃ trỏ sang rồi thì im lặng, không đề xuất lại", () => {
	const chu = `Xem thêm [bài mới](${duongBai(MOI.slug)}) về giấc ngủ.`;
	const ds = timBaiNenLinkNguoc(MOI, [bai("mat-ngu-the-benh", "Mất ngủ theo thể bệnh Đông y", ["mất ngủ theo Đông y"], chu, { cumId: "cum-mat-ngu" })]);
	assert.deepEqual(ds, []);
});

test("không bao giờ tự nối vào CHÍNH bài mới", () => {
	assert.deepEqual(timBaiNenLinkNguoc(MOI, [bai(MOI.slug, MOI.tieuDe, MOI.tuKhoa, "chữ", { cumId: "cum-mat-ngu" })]), []);
});

// Neo không có thật trong bài cũ thì người biên tập phải viết thêm câu — phải NÓI RÕ, chứ
// không im lặng đưa ra một chữ neo mà họ không chèn vào đâu được.
test("thiếu neo sẵn có → canVietThem true và lý do nói rõ", () => {
	const [x] = timBaiNenLinkNguoc(MOI, [
		bai("ngu-khong-sau", "Ngủ không sâu giấc", ["mất ngủ theo Đông y"], "Giấc nông, dễ tỉnh, hay mộng.", { cumId: "cum-mat-ngu" }),
	]);
	assert.equal(x.neo, null);
	assert.equal(x.canVietThem, true);
	assert.match(x.lyDo, /viết thêm một câu/);
});

test("bài có neo sẵn được xếp TRƯỚC bài phải viết thêm (việc rẻ hơn)", () => {
	const ds = timBaiNenLinkNguoc(MOI, [
		bai("khong-co-neo", "Ngủ không sâu giấc", ["mất ngủ theo Đông y"], "Giấc nông, dễ tỉnh.", { cumId: "cum-mat-ngu" }),
		bai("co-neo", "Mất ngủ theo thể bệnh", ["mất ngủ theo Đông y"], "Bấm huyệt Thần Môn mỗi tối.", { cumId: "cum-mat-ngu" }),
	]);
	assert.deepEqual(ds.map((x) => x.slug), ["co-neo", "khong-co-neo"]);
});

test(`không nhờ quá ${TRAN_BAI_CU} bài cũ cùng trỏ sang một bài mới`, () => {
	const cu = Array.from({ length: 12 }, (_, i) =>
		bai(`cu-${i}`, `Mất ngủ theo thể bệnh ${i}`, ["mất ngủ theo Đông y"], "Bấm huyệt Thần Môn.", { cumId: "cum-mat-ngu" }),
	);
	assert.equal(timBaiNenLinkNguoc(MOI, cu).length, TRAN_BAI_CU);
});

test("tronSo: khử trùng theo slug, bản mới lên trước, cắt theo trần", () => {
	let so = null;
	for (const s of ["a", "b", "c", "d"]) so = tronSo(so, { slug: s, tieuDe: s, neo: null, canVietThem: true, lyDo: "x" }, `2026-10-0${s === "a" ? 1 : 2}`);
	assert.equal(so.ds.length, TRAN_MOI_BAI_CU);
	assert.deepEqual(so.ds.map((x) => x.slug), ["d", "c", "b"]);
	// Cùng slug nhắc lại thì THAY, không thành hai dòng.
	const lai = tronSo(so, { slug: "c", tieuDe: "c2", neo: "x", canVietThem: false, lyDo: "y" }, "2026-10-03");
	assert.equal(lai.ds.filter((x) => x.slug === "c").length, 1);
	assert.equal(lai.ds[0].slug, "c");
});

test("không ném với dữ liệu rỗng/hỏng", () => {
	assert.deepEqual(timBaiNenLinkNguoc({}, []), []);
	assert.deepEqual(timBaiNenLinkNguoc(MOI, undefined), []);
	assert.deepEqual(timBaiNenLinkNguoc(MOI, [{}]), []);
	assert.equal(daCoLink(undefined, undefined), false);
	assert.equal(chonNeo({}, undefined), null);
});
