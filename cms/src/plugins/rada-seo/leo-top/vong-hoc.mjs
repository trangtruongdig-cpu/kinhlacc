// Vòng học: loại sửa nào hay ĐI CÙNG việc lên hạng (thuần, không I/O).
//
// Phần còn lại của bước 7 đặc tả 2D. Ca đêm đã đo hạng ở +14 / +28 ngày sau khi người quản trị
// bấm "Đã sửa theo phiếu" (`kho.ghiDoLai`), nhưng chưa ai gom các lần đo đó lại, nên câu hỏi
// đáng tiền nhất vẫn chưa trả lời được: trong các việc phiếu đề nghị, việc nào thật sự đáng làm.
//
// ⚠️ ĐÂY LÀ ĐỒNG XUẤT HIỆN, KHÔNG PHẢI NHÂN QUẢ. Một phiếu thường mang NHIỀU loại sửa cùng lúc
// (thêm ý + đưa câu trả lời lên đầu + cắt đoạn rườm), và người quản trị sửa cả gói rồi mới bấm.
// Nên khi hạng lên, không có cách nào biết loại nào đã giúp. Bảng này chỉ nói "những phiếu CÓ
// loại sửa X thì sau đó lên hạng bao nhiêu lần", và giao diện phải nói đúng câu đó. Trình bày
// nó như bằng chứng nhân quả là mời người ta kết luận sai trên cỡ mẫu một chữ số.
//
// ⚠️ GOM THEO MỤC CỦA PHIẾU, KHÔNG GOM THEO CHỮ. Các cờ trong `phieu.traiNghiem` là CÂU tự do do
// `ban-do.mjs` dựng ("Trả lời muộn: đoạn trả lời đứng sau 320 chữ", "Có 4 khối quảng cáo trên
// trang"). Khớp chuỗi để chia nhỏ chúng sẽ hỏng IM LẶNG ngay lần đầu ai đó sửa cách diễn đạt —
// và hỏng theo kiểu tệ nhất: bảng vẫn ra số, chỉ là số của nhóm rỗng. Mục của phiếu thì có cấu
// trúc và đổi tên là gãy ngay.

/** Hạng bình quân xê dịch dưới mức này thì coi như ĐỨNG YÊN — GSC làm tròn và nhiễu theo ngày. */
export const NGUONG_DOI_HANG = 0.5;
/** Dưới chừng này phiên có số đo cuối thì KHÔNG kết luận gì về một loại sửa. */
export const TOI_THIEU_KET_LUAN = 5;

/** Mục của phiếu ↔ tên người đọc hiểu. Đổi khoá ở đây là gãy phép kiểm, đúng như mong muốn. */
export const LOAI_SUA = Object.freeze({
	themY: "Thêm ý cốt lõi còn thiếu",
	duaTraLoiLenDau: "Đưa câu trả lời lên đầu",
	cat: "Cắt đoạn rườm / ý thừa",
	traiNghiem: "Sửa yếu tố trải nghiệm",
	boSungCanCu: "Bổ sung căn cứ / dẫn nguồn",
	taiSanRieng: "Thêm tài sản riêng (ảnh huyệt, đồ hình, liên kết từ điển)",
});

/** Các loại sửa mà MỘT phiếu đề nghị. Mục rỗng không tính là một loại sửa. */
export function loaiSuaCuaPhieu(phieu) {
	if (!phieu || typeof phieu !== "object") return [];
	const ra = [];
	for (const k of Object.keys(LOAI_SUA)) {
		const v = phieu[k];
		if (k === "duaTraLoiLenDau" ? v === true : Array.isArray(v) && v.length > 0) ra.push(k);
	}
	return ra;
}

/**
 * Kết quả của MỘT phiên: so hạng bình quân ở mốc đo CUỐI CÙNG với hạng lúc mở phiên.
 * Hạng NHỎ hơn là tốt hơn, nên `doi` dương nghĩa là đã lên.
 *
 * @returns {{ketQua: 'len'|'yen'|'tut'|'chua_du', doi: number|null, mocCuoi: number|null,
 *   viTriBanDau: number|null, viTriSau: number|null}}
 */
export function ketQuaPhien(p) {
	const banDau = Number(p?.viTriBanDau);
	const ds = (Array.isArray(p?.doLai) ? p.doLai : []).filter((x) => Number.isFinite(Number(x?.viTri)) && Number.isFinite(Number(x?.sauNgay)));
	const rong = { ketQua: "chua_du", doi: null, mocCuoi: null, viTriBanDau: Number.isFinite(banDau) ? banDau : null, viTriSau: null };
	if (!Number.isFinite(banDau) || !ds.length) return rong;
	const cuoi = ds.reduce((a, b) => (Number(b.sauNgay) > Number(a.sauNgay) ? b : a));
	const sau = Number(cuoi.viTri);
	const doi = banDau - sau;
	return {
		ketQua: doi > NGUONG_DOI_HANG ? "len" : doi < -NGUONG_DOI_HANG ? "tut" : "yen",
		doi: Math.round(doi * 100) / 100,
		mocCuoi: Number(cuoi.sauNgay),
		viTriBanDau: banDau,
		viTriSau: sau,
	};
}

const trungVi = (xs) => {
	if (!xs.length) return null;
	const s = [...xs].sort((a, b) => a - b);
	const g = s.length >> 1;
	return Math.round((s.length % 2 ? s[g] : (s[g - 1] + s[g]) / 2) * 100) / 100;
};

/**
 * Gom mọi phiên đã có số đo cuối, theo loại sửa.
 *
 * @param {{phieu: object, viTriBanDau: number, doLai: object[]}[]} phien
 * @returns {{bang: {ma: string, ten: string, soPhien: number, len: number, yen: number,
 *   tut: number, doiTrungVi: number|null, duKetLuan: boolean}[], soPhienDoDuoc: number,
 *   soPhienChuaDu: number, ghiChu: string[]}}
 */
export function tongHopLoaiSua(phien = []) {
	const dem = new Map(Object.keys(LOAI_SUA).map((k) => [k, { len: 0, yen: 0, tut: 0, doi: [] }]));
	let doDuoc = 0;
	let chuaDu = 0;
	for (const p of phien) {
		const kq = ketQuaPhien(p);
		if (kq.ketQua === "chua_du") {
			chuaDu++;
			continue;
		}
		doDuoc++;
		for (const ma of loaiSuaCuaPhieu(p?.phieu)) {
			const o = dem.get(ma);
			if (!o) continue;
			o[kq.ketQua]++;
			o.doi.push(kq.doi);
		}
	}
	const bang = [...dem.entries()]
		.map(([ma, o]) => {
			const soPhien = o.len + o.yen + o.tut;
			return {
				ma,
				ten: LOAI_SUA[ma],
				soPhien,
				len: o.len,
				yen: o.yen,
				tut: o.tut,
				doiTrungVi: trungVi(o.doi),
				duKetLuan: soPhien >= TOI_THIEU_KET_LUAN,
			};
		})
		.filter((x) => x.soPhien > 0)
		// Xếp theo số phiên trước, không theo tỉ lệ lên: 1/1 = 100% mà không nói được gì.
		.sort((a, b) => b.soPhien - a.soPhien || b.len - a.len);
	const ghiChu = [];
	if (!doDuoc) {
		ghiChu.push("Chưa phiên nào có số đo cuối (cần qua mốc +28 ngày kể từ ngày bấm “Đã sửa theo phiếu”) — bảng còn rỗng vì chưa có dữ liệu, không phải vì các việc đó vô ích.");
	} else if (!bang.some((x) => x.duKetLuan)) {
		ghiChu.push(`Mọi loại sửa đều dưới ${TOI_THIEU_KET_LUAN} phiên — đọc để biết đã làm gì, ĐỪNG kết luận loại nào hiệu quả hơn.`);
	}
	ghiChu.push("Một phiếu thường mang nhiều loại sửa cùng lúc và người quản trị sửa cả gói, nên đây là ĐỒNG XUẤT HIỆN, không phải nhân quả.");
	if (chuaDu) ghiChu.push(`${chuaDu} phiên chưa tới mốc đo cuối — chưa tính vào bảng.`);
	return { bang, soPhienDoDuoc: doDuoc, soPhienChuaDu: chuaDu, ghiChu };
}
