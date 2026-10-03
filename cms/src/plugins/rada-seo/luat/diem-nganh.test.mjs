import { test } from "node:test";
import assert from "node:assert/strict";
import { diemNganh, xepTheoNganh } from "./diem-nganh.mjs";

test("trang đúng ngách điểm cao hơn hẳn trang lạc đề", () => {
	const cham = diemNganh("https://a.vn/vie/bai-viet/xoa-bop-bam-huyet-chua-thoai-hoa-co-chan");
	const huyetAp = diemNganh("https://a.vn/vie/bai-viet/huong-dan-uong-thuoc-huyet-ap-dung-cach");
	assert.ok(cham > huyetAp, `${cham} phải lớn hơn ${huyetAp}`);
	assert.ok(diemNganh("https://a.vn/dong-y-tri-mat-ngu") > 0);
});

test("tin nội bộ và trang dịch vụ bị TRỪ điểm, nhưng vẫn ở lại hàng đợi", () => {
	// Trừ điểm ≠ loại bỏ: `xepTheoNganh` chỉ xếp lại chỗ đứng, không bỏ phần tử nào.
	assert.ok(diemNganh("https://a.vn/tin-tuc/thu-moi-bao-gia-dich-vu") < 0);
	assert.ok(diemNganh("https://a.vn/bac-si-nguyen-van-a") < 0);
	const ds = [{ url: "https://a.vn/tuyen-dung" }, { url: "https://a.vn/cham-cuu-mat-ngu" }];
	assert.equal(xepTheoNganh(ds).length, 2, "không được bỏ phần tử nào");
});

test("xếp theo điểm giảm dần, HOÀ thì giữ nguyên thứ tự vào (mới trước)", () => {
	const ds = [
		{ url: "https://a.vn/khong-ro-1" },
		{ url: "https://a.vn/cham-cuu-dau-lung" },
		{ url: "https://a.vn/khong-ro-2" },
		{ url: "https://a.vn/tuyen-dung" },
	];
	assert.deepEqual(
		xepTheoNganh(ds).map((x) => x.url.split("/").pop()),
		["cham-cuu-dau-lung", "khong-ro-1", "khong-ro-2", "tuyen-dung"],
	);
});

test('⚠️ "huyet" trong slug KHÔNG tự cho điểm — "huyệt" và "huyết" trộn làm một khi bỏ dấu', () => {
	// Đo 03/10/2026: 270 URL chứa "huyet" của vinmec là huyết áp / sốt xuất huyết / huyết học.
	assert.equal(diemNganh("https://a.vn/sot-xuat-huyet-o-tre-em"), 0);
	assert.equal(diemNganh("https://a.vn/benh-huyet-hoc"), 0);
	// Phải đi kèm cụm rõ nghĩa mới tính.
	assert.ok(diemNganh("https://a.vn/bam-huyet-tri-mat-ngu") > 0);
});

test("URL hỏng hoặc rỗng thì ra 0, không ném", () => {
	assert.equal(diemNganh("khong-phai-url"), 0);
	assert.equal(diemNganh(null), 0);
	assert.equal(diemNganh(""), 0);
});

test("điểm 0 là 'không biết gì', KHÁC với điểm âm — và cả hai đều ở lại", () => {
	assert.equal(diemNganh("https://a.vn/abc-xyz"), 0);
	assert.ok(diemNganh("https://a.vn/bang-gia-dich-vu") < 0);
});
