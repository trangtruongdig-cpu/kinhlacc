// Khuôn zod cho đầu ra của mô hình ở tầng chiến lược — TẦNG KIỂM THỨ NHẤT.
//
// Trước 02/10/2026 ba khuôn này nằm trong `plugin.mjs`, nên chỉ route MCP đi qua chúng. Khi ca
// tự lập chiến lược gọi thẳng `deXuatHuong`/`ghiCum`/`deXuatKeHoach`, nó sẽ BỎ QUA cả tầng này
// — mà `chien-luoc/viec.mjs` tự gọi mình là "lớp phòng thủ thứ hai", tức nó không thay được
// lớp thứ nhất. Tách ra đây để cả hai đường đi qua CÙNG một khuôn.
//
// Chữ trong các khuôn này do mô hình sinh TỪ CHỮ ĐỐI THỦ, nên trần độ dài là thứ chặn một lượt
// gọi nhồi cả trang vào kho. Trần số lượng trùng trần trong `viec.mjs` — cố ý trùng.
import { z } from "zod";
import { Y_DINH, TRAN_HUONG_MOI_LUOT, TRAN_CUM_MOI_LUOT, TRAN_KE_HOACH_MOI_LUOT } from "./tran.mjs";

export const chuoi = (n) => z.string().trim().min(1).max(n);
export const ID = chuoi(64);
export const TU_KHOA = z.array(chuoi(80)).max(8);
export const DUONG = chuoi(300);

export const KHUON_HUONG = z.object({
	huong: z
		.array(
			z.object({
				ten: chuoi(120),
				moTa: z.string().max(400),
				trongSoGoiY: z.number().int().min(1).max(5),
				lyDo: z.string().max(400),
				idBaiDoiThu: z.array(ID).max(50),
				tuKhoa: TU_KHOA.min(1),
			}),
		)
		.min(1)
		.max(TRAN_HUONG_MOI_LUOT),
});

export const KHUON_CUM = z.object({
	cum: z
		.array(
			z.object({
				huongId: ID,
				ten: chuoi(120),
				moTa: z.string().max(400),
				tuKhoa: TU_KHOA.min(1),
				idBaiDoiThu: z.array(ID).max(50),
			}),
		)
		.min(1)
		.max(TRAN_CUM_MOI_LUOT),
});

export const KHUON_KE_HOACH = z.object({
	keHoach: z
		.array(
			z.object({
				cumId: ID,
				tieuDeLamViec: chuoi(120),
				tuKhoaChinh: chuoi(80),
				tuKhoaPhu: TU_KHOA,
				yDinh: z.enum(Y_DINH),
				trangTruCot: DUONG,
				lienKetDich: z.array(DUONG).max(12),
				goiYNguon: z.array(DUONG).max(12).optional(),
			}),
		)
		.min(1)
		.max(TRAN_KE_HOACH_MOI_LUOT),
});
