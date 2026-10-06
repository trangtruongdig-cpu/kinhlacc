import test from "node:test";
import assert from "node:assert/strict";
import { xepHangDoi, LOAI_VIEC, tomTatTuan } from "./xep-viec.mjs";

// `rong` = ĐÃ DÒ sơ hở nhưng không có việc nào. KHÁC với "chưa dò" (`suaNho: null`), thứ có test
// riêng bên dưới — gộp hai trạng thái này là đúng cái bẫy tab Mạng nhện đã cắn.
const rong = { huong: [], keHoach: [], leoTop: [], goiYNguoc: [], suaNho: { kq: { ds: [] } } };

test("CHẶN trước, RẺ sau — hướng chờ nhận luôn đứng trên việc 2 phút", () => {
	// Luật đắt nhất của hàng đợi, và nó KHÁC "rẻ trước" thuần của so-ho-ai.mjs: một hướng không
	// nhận là bot đứng im cả tuần (ghiCum chỉ nhận cụm thuộc hướng da_nhan) dù việc chỉ mất 10
	// giây; một dòng FAQ không thêm thì chỉ mất vài lượt nhấp.
	const r = xepHangDoi({
		...rong,
		huong: [{ id: "h1", ten: "Châm cứu dân văn phòng", trangThai: "de_xuat", diem: 80 }],
		keHoach: [
			{ id: "k1", tieuDeLamViec: "Bài A", trangThai: "de_xuat" },
			{ id: "k2", tieuDeLamViec: "Bài B", trangThai: "co_nhap" },
		],
		suaNho: { kq: { ds: [{ trang: "/huyet/x/", dong: [{ tuKhoa: "x ở đâu", viec: "them_faq", hienThi: 51 }] }] } },
	});
	assert.deepEqual(
		r.viec.map((v) => v.loai),
		["nhan_huong", "duyet_nhap", "duyet_ke_hoach", "them_faq"],
	);
});

test("mỗi dòng việc mang một câu VÌ SAO — đó là chỗ chữa 'không hiểu nó đang làm gì'", () => {
	const r = xepHangDoi({ ...rong, huong: [{ id: "h1", ten: "H", trangThai: "de_xuat" }] });
	assert.equal(r.viec.length, 1);
	assert.ok(r.viec[0].viSao.length > 20, "câu vì sao phải nói được điều gì, không phải nhãn");
	for (const k of Object.keys(LOAI_VIEC)) assert.ok(LOAI_VIEC[k].viSao?.length > 20, `${k} thiếu câu vì sao`);
});

test("chỉ lấy việc ĐANG CHỜ NGƯỜI — hướng đã nhận, bài đã duyệt, phiếu đã sửa thì không phải việc", () => {
	const r = xepHangDoi({
		...rong,
		huong: [{ id: "h1", ten: "H", trangThai: "da_nhan" }],
		keHoach: [
			{ id: "k1", tieuDeLamViec: "A", trangThai: "da_duyet" },
			{ id: "k2", tieuDeLamViec: "B", trangThai: "dang_viet" },
			{ id: "k3", tieuDeLamViec: "C", trangThai: "da_dang" },
			{ id: "k4", tieuDeLamViec: "D", trangThai: "bo_qua" },
		],
		leoTop: [{ id: "p1", trangMinh: "/a/", trangThai: "da_sua" }],
	});
	assert.deepEqual(r.viec, []);
});

test("bài 'cần xem lại' LÀ việc — lò viết bỏ cuộc thì phải có người quyết", () => {
	const r = xepHangDoi({ ...rong, keHoach: [{ id: "k1", tieuDeLamViec: "A", trangThai: "can_xem" }] });
	assert.equal(r.viec.length, 1);
	assert.equal(r.viec[0].loai, "duyet_nhap");
});

test("mạng nhện: bài CÓ NEO sẵn xếp trước bài phải viết thêm câu", () => {
	// Việc rẻ hơn đứng trước: có neo thì chỉ bọc một cụm thành link; không neo thì phải viết thêm.
	const r = xepHangDoi({
		...rong,
		goiYNguoc: [
			{ id: "cu1", data: { ds: [{ slug: "01MOI", tieuDe: "Bài mới A", neo: null, canVietThem: true, lyDo: "Từ khoá trùng 35%" }] } },
			{ id: "cu2", data: { ds: [{ slug: "01MOI", tieuDe: "Bài mới A", neo: "đo kinh lạc", canVietThem: false, lyDo: "Có neo sẵn" }] } },
		],
	});
	assert.deepEqual(r.viec.map((v) => v.loai), ["mang_nhen_co_neo", "mang_nhen_can_viet"]);
});

test("việc sửa nhỏ xếp RẺ trước, và `thieu_noi_dung` xuống CUỐI cả hàng đợi", () => {
	// Một phiếu nói "viết lại bài" thì người ta để đó; phiếu nói "thêm một dòng FAQ" thì làm trong
	// hai phút. Phân loại sai về phía đắt là giết chính cái phiếu.
	const r = xepHangDoi({
		...rong,
		suaNho: {
			kq: {
				ds: [
					{ trang: "/a/", dong: [{ tuKhoa: "q1", viec: "thieu_noi_dung", hienThi: 900 }] },
					{ trang: "/b/", dong: [{ tuKhoa: "q2", viec: "them_tieu_de", hienThi: 10 }] },
					{ trang: "/c/", dong: [{ tuKhoa: "q3", viec: "them_faq", hienThi: 5 }] },
				],
			},
		},
		goiYNguoc: [{ id: "cu1", data: { ds: [{ slug: "01MOI", tieuDe: "Bài mới A", neo: "neo", canVietThem: false }] } }],
	});
	assert.deepEqual(
		r.viec.map((v) => v.loai),
		["them_faq", "them_tieu_de", "mang_nhen_co_neo", "thieu_noi_dung"],
	);
	// `hienThi` 900 KHÔNG được kéo việc đắt lên đầu — giá quyết định bậc, hiển thị chỉ xếp trong bậc.
});

test("trong cùng một bậc thì NHIỀU LƯỢT HIỂN THỊ trước", () => {
	const r = xepHangDoi({
		...rong,
		suaNho: {
			kq: {
				ds: [
					{ trang: "/it/", dong: [{ tuKhoa: "q1", viec: "them_faq", hienThi: 3 }] },
					{ trang: "/nhieu/", dong: [{ tuKhoa: "q2", viec: "them_faq", hienThi: 51 }] },
				],
			},
		},
	});
	assert.deepEqual(r.viec.map((v) => v.duong), ["/nhieu/", "/it/"]);
});

test("CHƯA DÒ sơ hở thì hiện MỘT dòng khởi động, không im lặng", () => {
	// Im lặng ở đây đọc ra như "không có việc", trong khi thật ra là "chưa ai dò" — đúng cái bẫy
	// tab Mạng nhện đã cắn. Và KHÔNG được tự tải trang trong đường mở màn: route sua-nho tải
	// THẬT 15 trang, nghỉ 150 ms mỗi lượt.
	const r = xepHangDoi({ ...rong, suaNho: null });
	assert.equal(r.viec.length, 1);
	assert.equal(r.viec[0].loai, "do_so_ho");
	assert.match(r.viec[0].viSao, /chưa dò/i);
});

test("hàng đợi rỗng nói VÌ SAO rỗng — ba trạng thái, ba câu khác nhau", () => {
	// Một con số cho ba trạng thái là con số vô dụng.
	const hetViec = xepHangDoi({ ...rong, suaNho: { kq: { ds: [] } } });
	assert.deepEqual(hetViec.viec, []);
	assert.ok(hetViec.cauRong.length > 10);

	const hong = xepHangDoi({ ...rong, suaNho: { kq: { ds: [] } }, loiKho: "ECONNREFUSED tới backend" });
	assert.match(hong.cauRong, /ECONNREFUSED/);
	assert.notEqual(hong.cauRong, hetViec.cauRong);

	const chuaDo = xepHangDoi({});
	assert.notEqual(chuaDo.cauRong, hetViec.cauRong, "chưa dò KHÁC hết việc");
});

test("mỗi dòng khai HÀNH ĐỘNG bằng mã, UI tra bảng — module thuần không biết gì về nút", () => {
	const r = xepHangDoi({
		...rong,
		huong: [{ id: "h1", ten: "H", trangThai: "de_xuat" }],
		keHoach: [{ id: "k1", tieuDeLamViec: "A", trangThai: "co_nhap" }],
	});
	assert.deepEqual(r.viec.find((v) => v.loai === "nhan_huong").hanhDong, ["nhan", "bo"]);
	assert.deepEqual(r.viec.find((v) => v.loai === "duyet_nhap").hanhDong, ["mo_nhap"]);
});

test("chịu được dữ liệu thiếu/sai dạng mà không ném — kho hỏng một phần vẫn phải ra hàng đợi", () => {
	assert.deepEqual(xepHangDoi({}).viec.map((v) => v.loai), ["do_so_ho"]);
	assert.deepEqual(xepHangDoi(undefined).viec.map((v) => v.loai), ["do_so_ho"]);
	// `suaNho: { kq: null }` là ĐÃ hỏi mà kết quả sai dạng — không phải "chưa dò", nên không ra
	// dòng khởi động; nhưng cũng không được ném.
	const r = xepHangDoi({ ...rong, huong: null, keHoach: "hong", goiYNguoc: [{ id: "x" }], suaNho: { kq: null } });
	assert.deepEqual(r.viec, []);
});

test("huy hiệu trên thanh quy trình tính từ CHÍNH hàng đợi, không cần route riêng", () => {
	// `viec-dem` là một route riêng đọc lại dsKeHoach + dsLeoTop + goi_y_nguoc — tức đọc lại đúng
	// thứ hàng đợi đã đọc. Gộp vào đây bỏ được 3 lượt đi-về mỗi lần mở màn.
	const { demTab } = xepHangDoi({
		...rong,
		huong: [{ id: "h1", ten: "H", trangThai: "de_xuat" }],
		keHoach: [
			{ id: "k1", tieuDeLamViec: "A", trangThai: "de_xuat" },
			{ id: "k2", tieuDeLamViec: "B", trangThai: "co_nhap" },
			{ id: "k3", tieuDeLamViec: "C", trangThai: "can_xem" },
		],
		leoTop: [{ id: "p1", trangMinh: "/a/", tuKhoa: "q", trangThai: "co_phieu" }],
		goiYNguoc: [{ id: "cu1", data: { ds: [{ slug: "01MOI", tieuDe: "Bài mới A", neo: "neo", canVietThem: false }] } }],
		suaNho: { kq: { ds: [{ trang: "/b/", dong: [{ tuKhoa: "q2", viec: "them_faq", hienThi: 9 }] }] } },
	});
	assert.equal(demTab.huong, 1);
	assert.equal(demTab["ke-hoach"], 1);
	assert.equal(demTab.nhap, 2, "co_nhap và can_xem đều là việc của tab Nháp");
	assert.equal(demTab["leo-top"], 2, "phiếu leo top + việc thêm FAQ đều thuộc tab Leo top");
	assert.equal(demTab["mang-nhen"], 1);
	// Tab không có việc thì KHÔNG có khoá — huy hiệu "0" khắp nơi làm mắt thôi nhìn vào huy hiệu.
	assert.equal(demTab.radar, undefined);
	assert.equal(demTab["khoang-trong"], undefined);
});

test("dòng khởi động 'dò sơ hở' KHÔNG đội huy hiệu tab Leo top", () => {
	// Nó là lời mời đi dò, không phải việc đang chờ. Đếm nó vào huy hiệu là báo có việc trong khi
	// chưa biết có việc hay không.
	const { demTab, viec } = xepHangDoi({});
	assert.deepEqual(viec.map((v) => v.loai), ["do_so_ho"]);
	assert.equal(demTab["leo-top"], undefined);
});

test("mỗi dòng có KHOÁ duy nhất — `id` một mình không đủ để xoá đúng dòng", () => {
	// `id` là id của bản ghi nguồn. Hai loại việc khác nhau có thể trỏ cùng một bản ghi (một phiếu
	// leo top vừa cần sửa tiêu đề vừa cần thêm FAQ), nên xoá khỏi hàng đợi theo `id` là có thể xoá
	// nhầm dòng người dùng chưa làm.
	const r = xepHangDoi({
		...rong,
		suaNho: {
			kq: {
				ds: [{ trang: "/a/", dong: [{ tuKhoa: "q", viec: "them_faq", hienThi: 1 }, { tuKhoa: "q", viec: "them_tieu_de", hienThi: 1 }] }],
			},
		},
	});
	assert.equal(r.viec.length, 2);
	assert.equal(r.viec[0].id, r.viec[1].id, "cùng bản ghi nguồn thì id trùng — đó là tiền đề của phép kiểm này");
	assert.notEqual(r.viec[0].khoa, r.viec[1].khoa);
	assert.equal(new Set(r.viec.map((v) => v.khoa)).size, r.viec.length);
});

test("mạng nhện: dòng việc nói tên bài MỚI (thứ biết được), không giả vờ biết tên bài cũ", () => {
	// Đo cấu trúc thật 06/10/2026: sổ `goi_y_nguoc` khoá theo contentId bài CŨ, và mỗi mục trong
	// `ds` là { slug, tieuDe, neo, canVietThem, lyDo } của bài MỚI. Tên bài CŨ KHÔNG nằm trong sổ
	// — nó phải tra sang CMS. Nên dòng việc phải nói tên bài mới và nêu rõ việc là "chèn link TỪ
	// một bài cũ SANG bài này"; bịa một cái tên cho bài cũ là nói dối người đọc.
	const r = xepHangDoi({
		...rong,
		goiYNguoc: [{ id: "01CU", data: { ds: [{ slug: "01MOI", tieuDe: "Cách Đo Kinh Lạc", neo: "đo kinh lạc", canVietThem: false, lyDo: "Có neo sẵn" }] } }],
	});
	assert.equal(r.viec.length, 1);
	const v = r.viec[0];
	assert.equal(v.ten, "Cách Đo Kinh Lạc");
	assert.equal(v.meta.contentIdCu, "01CU");
	assert.equal(v.meta.slugMoi, "01MOI");
	assert.equal(v.meta.neo, "đo kinh lạc");
	assert.equal(/không tra ra/.test(v.ten), false);
});

test("mạng nhện: thiếu `tieuDe` thì nói THẲNG là chưa tra ra, không bịa", () => {
	const r = xepHangDoi({ ...rong, goiYNguoc: [{ id: "01CU", data: { ds: [{ slug: "01MOI", canVietThem: true }] } }] });
	assert.match(r.viec[0].ten, /chưa tra ra/i);
});

test("sổ việc tuần đếm theo MỐC, và nói rõ mốc chỉ có từ ngày cài", () => {
	// ⚠️ Giới hạn không tránh được: `datLuc` chỉ ghi từ 06/10/2026, nên việc làm trước đó không
	// bao giờ vào sổ — tuần đầu dòng này ghi số thấp GIẢ. Phải nói ra, đúng cái bẫy tab Mạng nhện
	// đã cắn (rỗng vì chưa ai dò, mà đọc ra như "không có việc").
	const now = Date.parse("2026-10-10T09:00:00.000Z");
	const d = (n) => new Date(now - n * 86400000).toISOString();
	const r = tomTatTuan(
		{
			huong: [{ id: "h1", datLuc: d(2) }, { id: "h2", datLuc: d(9) }, { id: "h3" }],
			keHoach: [{ id: "k1", datLuc: d(1) }, { id: "k2", datLuc: d(3) }, { id: "k3", datLuc: d(20) }],
			leoTop: [{ id: "p1", ngaySua: "2026-10-08" }, { id: "p2", ngaySua: "2026-09-01" }],
		},
		{ now },
	);
	assert.equal(r.huong, 1, "hướng quyết trong 7 ngày");
	assert.equal(r.keHoach, 2, "bài duyệt/bỏ trong 7 ngày");
	assert.equal(r.trangDaSua, 1);
	assert.equal(r.tong, 4);
	assert.ok(r.tuNgayCoMoc, "phải nói mốc chỉ có từ ngày nào");
	assert.match(r.cau, /tuần này/i);
	// KHÔNG nói "bạn làm": ctx của plugin không mang thông tin người dùng, nên sổ không biết ai.
	assert.equal(/bạn làm|anh làm/i.test(r.cau), false);
});

test("sổ việc tuần: chưa có việc nào có mốc thì nói THẲNG là chưa có mốc, không nói 0 việc", () => {
	const r = tomTatTuan({ huong: [{ id: "h1" }], keHoach: [{ id: "k1" }], leoTop: [] }, { now: Date.parse("2026-10-10T00:00:00Z") });
	assert.equal(r.tong, 0);
	assert.match(r.cau, /chưa có việc nào/i);
	assert.match(r.cau, /mốc/i, "phải nói ra là vì chưa ghi mốc, không phải vì chưa làm gì");
});

test("sổ việc tuần chịu được dữ liệu thiếu", () => {
	assert.equal(tomTatTuan({}, {}).tong, 0);
	assert.equal(tomTatTuan(undefined, undefined).tong, 0);
	assert.equal(tomTatTuan({ keHoach: [{ datLuc: "không-phải-ngày" }] }, { now: Date.now() }).tong, 0);
});

test("mỗi loại việc nói ra HỆ QUẢ của cú bấm, không phải 'Đã lưu'", () => {
	// "Đã lưu" không nói được điều gì. Người bấm cần biết việc vừa làm khởi động cái gì và khi
	// nào thấy kết quả — đó là nửa còn lại của việc chữa "không hiểu nó đang làm gì".
	for (const [k, v] of Object.entries(LOAI_VIEC)) {
		if (k === "do_so_ho") continue; // chỉ điều hướng, không ghi gì
		assert.ok(v.heQua?.length > 15, `${k} thiếu câu hệ quả`);
		assert.equal(/đã lưu|thành công/i.test(v.heQua), false, `${k}: câu hệ quả không được là "đã lưu"`);
	}
});

test("câu hệ quả của việc chặn dây chuyền phải nêu CA NÀO sẽ chạy tiếp", () => {
	// Nhận hướng xong thì ca 02:30 phân cụm; duyệt bài xong thì lò viết 03:30 viết. Không nói giờ
	// thì người bấm không biết bao giờ quay lại xem.
	assert.match(LOAI_VIEC.nhan_huong.heQua, /02:30/);
	assert.match(LOAI_VIEC.duyet_ke_hoach.heQua, /03:30/);
});
