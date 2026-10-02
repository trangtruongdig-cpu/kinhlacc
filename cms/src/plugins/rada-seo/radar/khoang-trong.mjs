// Khoảng trống nội dung bằng LUẬT, không gọi mô hình: chủ đề đối thủ có mà mình chưa có,
// gom nhóm theo độ giống (cùng thước với chống trùng), rồi chấm điểm.
//
// Điểm = 3 × số đối thủ cùng viết (tối đa 3) + số bài (tối đa 5) + 3 nếu trúng xu hướng
//        − 8 nếu tên/từ khoá cụm nghiêng chữa trị hay hứa kết quả.
// Nhiều đối thủ cùng viết = có người tìm thật; đó là tín hiệu mạnh nhất nên nhân 3.
import { boDau } from "../luat/chuan-hoa.mjs";
import { doGiong, tapKhoa, taoBoKhoa, timTrungBo, NGUONG_TRUNG } from "../luat/trung-lap.mjs";
import { timViPham } from "../luat/pham-vi-y-sy.mjs";
import { doYmyl } from "../luat/ymyl.mjs";

export const TRAN_CUM = 50;

/**
 * Nhường vòng lặp sự kiện mỗi NHUONG_MOI vòng ngoài. Phép tính chạy TRONG tiến trình CMS đang
 * phục vụ blog, ảnh và khu quản trị; một vòng O(n²) liền mạch trên vài nghìn chủ đề chặn mọi
 * request tới khi xong (cùng bài học với ca soi của bot thẩm định: việc nền không được giành
 * tiến trình với người thật).
 */
const NHUONG_MOI = 200;
const nhuong = () => new Promise((r) => setImmediate(r));

/** gomNhom của trung-lap.mjs viết lại: dùng tập khoá tính sẵn và nhường tiến trình. Cùng kết quả. */
async function gomNhomAsync(bo, nguong = NGUONG_TRUNG) {
	const { ds, tap } = bo;
	const cha = ds.map((_, i) => i);
	const goc = (i) => (cha[i] === i ? i : (cha[i] = goc(cha[i])));
	for (let i = 0; i < ds.length; i++) {
		if (i > 0 && i % NHUONG_MOI === 0) await nhuong();
		for (let j = i + 1; j < ds.length; j++) if (doGiong(tap[i], tap[j]) >= nguong) cha[goc(i)] = goc(j);
	}
	const nhom = new Map();
	ds.forEach((b, i) => {
		const g = goc(i);
		if (!nhom.has(g)) nhom.set(g, []);
		nhom.get(g).push(b.id);
	});
	return [...nhom.values()].map((n) => n.sort((x, y) => (x > y ? 1 : -1)));
}

/**
 * Lọc chủ đề đối thủ mình đã có rồi gom nhóm (id). Tách riêng để phép kiểm so được với
 * timTrung + gomNhom gốc.
 * @returns {Promise<(string|number)[][]>}
 */
export async function nhomKhoangTrong({ chuDeMinh, chuDeDoiThu }) {
	const minh = taoBoKhoa(chuDeMinh.map((m, i) => ({ id: `m${i}`, tieuDe: m.chuDe, tuKhoa: m.tuKhoa })));
	const thieu = [];
	for (let i = 0; i < chuDeDoiThu.length; i++) {
		if (i > 0 && i % NHUONG_MOI === 0) await nhuong();
		const t = chuDeDoiThu[i];
		if (!timTrungBo({ tieuDe: t.chuDe, tuKhoa: t.tuKhoa }, minh)) thieu.push(t);
	}
	return gomNhomAsync(taoBoKhoa(thieu.map((t) => ({ id: t.id, tieuDe: t.chuDe, tuKhoa: t.tuKhoa }))));
}

/** Chủ đề đại diện của nhóm: bài giống các bài còn lại nhất. */
function daiDien(baiNhom) {
	const tap = baiNhom.map((b) => tapKhoa({ tieuDe: b.chuDe, tuKhoa: b.tuKhoa }));
	let tot = 0, diemTot = -1;
	tap.forEach((a, i) => {
		const d = tap.reduce((s, b, j) => (i === j ? s : s + doGiong(a, b)), 0);
		if (d > diemTot) (diemTot = d), (tot = i);
	});
	return baiNhom[tot];
}

/** 6 từ khoá xuất hiện nhiều nhất trong nhóm (khử trùng theo dạng bỏ dấu). */
function tuKhoaNhom(baiNhom) {
	const dem = new Map();
	for (const b of baiNhom)
		for (const k of b.tuKhoa) {
			const kk = boDau(k).trim();
			if (!kk) continue;
			const cu = dem.get(kk) ?? { chu: k.trim(), n: 0 };
			cu.n++;
			dem.set(kk, cu);
		}
	return [...dem.values()].sort((a, b) => b.n - a.n).slice(0, 6).map((x) => x.chu);
}

/** Trúng xu hướng khi một cụm tìm kiếm chứa trọn một từ khoá ≥ 2 từ của nhóm, hoặc ngược lại. */
export function trungXuHuong(tuKhoa, xuHuong) {
	const xh = xuHuong.map((x) => boDau(x));
	return tuKhoa.some((k) => {
		const kk = boDau(k).trim();
		if (kk.split(/\s+/).length < 2) return false;
		return xh.some((x) => x.includes(kk) || kk.includes(x));
	});
}

export function chamDiem({ soDoiThu, soBai, coXuHuong, viPham }) {
	return 3 * Math.min(soDoiThu, 3) + Math.min(soBai, 5) + (coXuHuong ? 3 : 0) - (viPham ? 8 : 0);
}

/**
 * Tin nội bộ của cơ quan: thư mời báo giá, đoàn công tác, thi đua, tuyển dụng… Đối thủ ở đây
 * phần lớn là BỆNH VIỆN, nên sitemap của họ đầy loại trang này; chúng qua được phép lọc
 * 'ngoai_nganh' vì có nhắc Y học cổ truyền, rồi thành "khoảng trống nội dung".
 *
 * ⚠️ Đo thật 02/10/2026: hai cụm ĐẦU BẢNG là "Thư mời báo giá dịch vụ truyền thông" (8đ) và
 * "Đoàn công tác … tham dự hội nghị quốc tế tại Thụy Sĩ" (8đ) — tức khâu lập kế hoạch sẽ cử
 * bot đi viết bài về thư mời báo giá. Một việc giả đứng đầu bảng tệ hơn bảng ngắn đi hai dòng.
 *
 * Chỉ khớp trên TÊN cụm (lấy từ tiêu đề trang), không khớp trên từ khoá: từ khoá của một bài
 * chuyên môn hay có tên bệnh viện, và tên cơ quan KHÔNG phải dấu hiệu tin nội bộ —
 * "Hướng dẫn thực hành châm cứu tại Bệnh viện Y học cổ truyền Trung ương" là bài chuyên môn.
 */
const TIN_NOI_BO = [
	"thư mời", "báo giá", "mời thầu", "đấu thầu", "chào giá", "gói thầu",
	"tuyển dụng", "trúng tuyển", "tuyển sinh", "xét tuyển",
	"đoàn công tác", "hội nghị", "hội thảo", "tập huấn", "lễ ", "kỷ niệm", "đại hội",
	"thi đua", "khen thưởng", "phát động", "ra quân", "tình nguyện", "hiến máu",
	"chi bộ", "đảng bộ", "công đoàn", "đoàn thanh niên",
	"lịch nghỉ", "lịch trực", "thông báo nghỉ", "giá dịch vụ", "quyết định số",
	// Văn bản pháp quy và quản trị nội bộ — cùng loại, bắt được ở lượt đo thứ hai.
	"nghị định", "thông tư", "nghị quyết", "quy chế", "nội quy", "đề án",
	"công khai tài chính", "ngân sách", "viên chức", "vị trí việc làm",
	"chống lãng phí", "tiết kiệm", "cải cách hành chính", "chuyển đổi số",
	"hợp tác quốc tế", "hợp tác y tế", "ký kết", "biên bản ghi nhớ",
	// Trang "về chúng tôi" của cơ quan. "giới thiệu" phải đi KÈM đơn vị — "Giới thiệu huyệt
	// Tam Âm Giao" là bài chuyên môn.
	"tri ân", "cơ cấu tổ chức", "ban giám đốc", "lịch sử phát triển",
	"giới thiệu phòng", "giới thiệu khoa", "giới thiệu trung tâm", "giới thiệu bệnh viện",
];
export function laTinNoiBo(tenCum) {
	const t = boDau(String(tenCum ?? "")).toLowerCase();
	return TIN_NOI_BO.some((x) => t.includes(boDau(x).toLowerCase()));
}

/**
 * Tên cụm rỗng nghĩa — không dùng được làm việc viết. "Khác" là chủ đề mà MÔ HÌNH trả về khi
 * nó không đọc ra chủ đề; chúng có thật trong kho (đợt đọc qua mcp-bridge). Giữ lại thì bảng
 * việc có mấy dòng tên "Khác" mà không ai biết phải viết gì.
 */
const TEN_RONG = new Set(["khac", "khong ro", "chua ro", "tin tuc", "tong hop", "chu de khac", "khong xac dinh"]);
export function laTenRong(tenCum) {
	const t = boDau(String(tenCum ?? "")).trim().toLowerCase().replace(/[.,;:!?]+$/, "");
	return !t || TEN_RONG.has(t);
}

/**
 * @param {{
 *   chuDeMinh: {chuDe: string, tuKhoa: string[]}[],
 *   chuDeDoiThu: {id: string, doiThuId: string, chuDe: string, tuKhoa: string[]}[],
 *   xuHuong: string[],
 * }} o
 * @returns {Promise<{tenCum: string, tuKhoa: string[], soDoiThu: number, soBai: number, coXuHuong: boolean, viPham: boolean, diem: number, viDu: string[]}[]>}
 */
export async function timKhoangTrong({ chuDeMinh, chuDeDoiThu, xuHuong }) {
	const theoId = new Map(chuDeDoiThu.map((t) => [t.id, t]));
	const nhom = await nhomKhoangTrong({ chuDeMinh, chuDeDoiThu });
	const ra = nhom.map((ids) => {
		const bai = ids.map((id) => theoId.get(id));
		const tuKhoa = tuKhoaNhom(bai);
		const tenCum = daiDien(bai).chuDe;
		const chu = `${tenCum}. ${tuKhoa.join(", ")}`;
		const viPham = timViPham(chu).length > 0 || doYmyl(chu).some((v) => v.loai === "hua_hen");
		const soDoiThu = new Set(bai.map((b) => b.doiThuId)).size;
		const coXuHuong = trungXuHuong(tuKhoa, xuHuong);
		return {
			tenCum,
			tuKhoa,
			soDoiThu,
			soBai: bai.length,
			coXuHuong,
			viPham,
			diem: chamDiem({ soDoiThu, soBai: bai.length, coXuHuong, viPham }),
			viDu: bai.slice(0, 5).map((b) => b.chuDe),
		};
	});
	// Bỏ cụm không dùng được làm việc viết. Bỏ HẲN, không hạ điểm: hạ điểm thì nó vẫn nằm trong
	// bảng và vẫn có ngày trôi lên đầu khi kho vơi. Bảng này được lập lại mỗi đêm nên bỏ sai
	// chỉ mất một đêm, còn một việc giả đứng đầu bảng thì có người thật đi viết theo.
	const dung = ra.filter((c) => !laTinNoiBo(c.tenCum) && !laTenRong(c.tenCum));
	return dung.sort((a, b) => b.diem - a.diem || b.soBai - a.soBai).slice(0, TRAN_CUM);
}
