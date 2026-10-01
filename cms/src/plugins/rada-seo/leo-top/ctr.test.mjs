import { test } from "node:test";
import assert from "node:assert/strict";
import { duongCongCtr, phanLoaiViec, gan, ctrCua, HIEN_THI_TIN_DUOC, MAU_TOI_THIEU } from "./ctr.mjs";

/** Lô hàng giả: mỗi bậc vị trí `so` hàng, CTR đúng bằng `ctr`. */
const lo = (viTri, ctr, so = MAU_TOI_THIEU, hienThi = 1000) =>
	Array.from({ length: so }, (_, i) => ({ tuKhoa: `k${viTri}-${i}`, trang: "/x/", viTri, hienThi, nhap: Math.round(hienThi * ctr) }));

/** Đường cong hình thật: hạng càng xa, CTR càng thấp. */
const KHO = [...lo(1, 0.3), ...lo(2, 0.2), ...lo(3, 0.15), ...lo(5, 0.08), ...lo(10, 0.03), ...lo(20, 0.01)];

test("ctrCua: hiển thị 0 → null, không chia cho 0", () => {
	assert.equal(ctrCua({ hienThi: 0, nhap: 0 }), null);
	assert.equal(ctrCua({ hienThi: 100, nhap: 7 }), 0.07);
});

test("đường cong dựng từ dữ liệu của chính site, nội suy bậc trống", () => {
	const d = duongCongCtr(KHO);
	assert.ok(d.soBac > 0, "phải dựng được ít nhất một bậc");
	// Bậc có mẫu: đúng giá trị đã gieo (cửa sổ trơn gộp bậc kề nên cho phép sai số).
	assert.ok(Math.abs(d.ky(1) - 0.3) < 0.08, `hạng 1 ≈ 0,30, nhận ${d.ky(1)}`);
	assert.ok(Math.abs(d.ky(20) - 0.01) < 0.03, `hạng 20 ≈ 0,01, nhận ${d.ky(20)}`);
	// Bậc 7 không có mẫu nào → nội suy giữa 5 và 10, phải nằm giữa hai giá trị đó.
	const b7 = d.ky(7);
	assert.ok(b7 !== null && b7 < d.ky(5) && b7 > d.ky(10), `bậc 7 phải nằm giữa bậc 5 và 10, nhận ${b7}`);
	// Kỳ vọng phải GIẢM theo hạng — nếu không thì mọi phân loại đều vô nghĩa.
	assert.ok(d.ky(1) > d.ky(10), "hạng 1 phải có kỳ vọng cao hơn hạng 10");
});

test("thiếu mẫu → đường cong RỖNG, mọi hàng thành chua_ro (thà không kết luận)", () => {
	const d = duongCongCtr(lo(5, 0.1, MAU_TOI_THIEU - 3));
	assert.equal(d.soBac, 0);
	assert.equal(d.ky(5), null);
	const pl = phanLoaiViec({ viTri: 5, hienThi: 5000, nhap: 0 }, d);
	assert.equal(pl.loai, "chua_ro");
	assert.match(pl.ly, /chưa dựng được đường cong/i);
});

test("CTR thấp hơn hẳn kỳ vọng ở CÙNG hạng → tieu_de, kèm số nhấp đang mất", () => {
	const d = duongCongCtr(KHO);
	const ky = d.ky(10);
	const pl = phanLoaiViec({ viTri: 10, hienThi: 2000, nhap: Math.round(2000 * ky * 0.3) }, d);
	assert.equal(pl.loai, "tieu_de");
	assert.ok(pl.nhapDangMat > 0, "phải ước lượng được số nhấp đang mất");
	assert.match(pl.ly, /chưa cần soi SERP/i);
});

test("CTR ĐẠT kỳ vọng mà hạng vẫn xa → noi_dung (việc của ca soi SERP)", () => {
	const d = duongCongCtr(KHO);
	const pl = phanLoaiViec({ viTri: 10, hienThi: 2000, nhap: Math.round(2000 * d.ky(10)) }, d);
	assert.equal(pl.loai, "noi_dung");
	assert.equal(pl.nhapDangMat, 0);
});

// Đây là cái bẫy chính của cả tệp: hạng 1 luôn được nhấp nhiều hơn hạng 10, nên so CTR THÔ
// giữa hai hạng sẽ luôn kết tội trang ở hạng xa. US8938463 / US8706748 nói đúng chuyện này.
test("CTR thô thấp nhưng ĐÚNG mức của hạng đó thì KHÔNG bị kết tội", () => {
	const d = duongCongCtr(KHO);
	const xa = phanLoaiViec({ viTri: 20, hienThi: 3000, nhap: Math.round(3000 * d.ky(20)) }, d);
	assert.equal(xa.loai, "noi_dung", "hàng ở hạng 20 có CTR 1% là bình thường, không phải lỗi tiêu đề");
	// Cùng CTR 1% nhưng ở hạng 1 thì lại là lỗi thật.
	const gan1 = phanLoaiViec({ viTri: 1, hienThi: 3000, nhap: 30 }, d);
	assert.equal(gan1.loai, "tieu_de", "CTR 1% ở hạng 1 là bất thường");
});

test("ít hiển thị → chua_ro, không kết tội trên nhiễu", () => {
	const d = duongCongCtr(KHO);
	const pl = phanLoaiViec({ viTri: 10, hienThi: HIEN_THI_TIN_DUOC - 1, nhap: 0 }, d);
	assert.equal(pl.loai, "chua_ro");
	assert.match(pl.ly, /nhiễu/i);
});

test("gan(): uuTien hạ trang tieu_de xuống dưới trang noi_dung cùng cơ hội", () => {
	const d = duongCongCtr(KHO);
	const ky = d.ky(10);
	const [td, nd] = gan(
		[
			{ tuKhoa: "a", trang: "/a/", viTri: 10, hienThi: 2000, nhap: Math.round(2000 * ky * 0.2), coHoi: 1000 },
			{ tuKhoa: "b", trang: "/b/", viTri: 10, hienThi: 2000, nhap: Math.round(2000 * ky), coHoi: 1000 },
		],
		d,
	);
	assert.equal(td.loaiViec, "tieu_de");
	assert.equal(nd.loaiViec, "noi_dung");
	assert.equal(td.coHoi, nd.coHoi, "cơ hội thô vẫn bằng nhau");
	assert.ok(nd.uuTien > td.uuTien, "nhưng ưu tiên soi SERP phải nghiêng về trang noi_dung");
});

test("không ném với dữ liệu rỗng/hỏng", () => {
	for (const x of [undefined, null, []]) assert.equal(duongCongCtr(x).soBac, 0);
	assert.equal(phanLoaiViec(undefined, duongCongCtr([])).loai, "chua_ro");
	assert.deepEqual(gan(undefined, duongCongCtr([])), []);
});
