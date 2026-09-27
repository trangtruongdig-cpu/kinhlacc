/**
 * ĐỌC VÀ XÁC MINH VÉ ĐĂNG NHẬP MỘT LẦN do app Kinh Lạc cấp.
 *
 * Vé là một JWT HS256 ký bằng `CMS_SSO_SECRET` — bí mật mà app backend và CMS cùng biết.
 * Bên cấp: `backend/src/controllers/auth.controller.ts` → `taoVeCms()`.
 *
 * ⚠️ Cố ý KHÔNG kéo thêm thư viện JWT nào vào CMS. Xác minh HS256 là đúng một lời gọi
 * `crypto.subtle.verify` — thêm một gói phụ thuộc vào khu xác thực chỉ để tiết kiệm ba
 * chục dòng là đổi lấy một thứ phải theo dõi vá lỗi mãi mãi.
 */

/** Phần thân của vé, sau khi đã xác minh chữ ký. */
export interface VeCms {
	/** id tài khoản bên app — chỉ dùng để ghi log, CMS không lưu. */
	sub: string;
	/** Định danh bên CMS. EmDash tra người dùng BẰNG EMAIL. */
	email: string;
	/** Tên hiển thị. */
	ten: string;
	/** Bậc vai trò EmDash: 40 = Biên tập, 50 = Quản trị. */
	vaiTro: number;
	/** Mã riêng của vé — dùng để chặn tái sử dụng. */
	jti: string;
	/** Hạn dùng, giây kể từ mốc Unix. */
	exp: number;
}

export class VeKhongHopLe extends Error {
	constructor(
		readonly ma: string,
		thongDiep: string,
	) {
		super(thongDiep);
		this.name = "VeKhongHopLe";
	}
}

const NGUOI_CAP = "kinhlac-app";
const NGUOI_NHAN = "kinhlac-cms";

/** Chỉ nhận đúng 40 và 50. Vé đòi bậc khác là vé hỏng hoặc vé bịa. */
const BAC_HOP_LE = new Set([40, 50]);

/** Kiểu trả về ghi rõ `Uint8Array<ArrayBuffer>` chứ không để `Uint8Array` trần: từ TS 5.7
 *  `Uint8Array` mặc định là `Uint8Array<ArrayBufferLike>`, mà `BufferSource` của
 *  `crypto.subtle.verify` không nhận kiểu đó. */
function giaiBase64Url(s: string): Uint8Array<ArrayBuffer> {
	const dem = s.replace(/-/g, "+").replace(/_/g, "/");
	const bu = dem + "=".repeat((4 - (dem.length % 4)) % 4);
	const tho = atob(bu);
	const mang = new Uint8Array(new ArrayBuffer(tho.length));
	for (let i = 0; i < tho.length; i++) mang[i] = tho.charCodeAt(i);
	return mang;
}

function giaiJson(s: string): unknown {
	return JSON.parse(new TextDecoder().decode(giaiBase64Url(s)));
}

/**
 * Xác minh chữ ký và các trường bắt buộc của vé.
 *
 * Ném `VeKhongHopLe` cho MỌI trường hợp không đạt — nơi gọi trả về một thông điệp
 * duy nhất cho mọi mã lỗi, để vé sai không trở thành công cụ dò xét.
 */
export async function docVe(token: string, biMat: string): Promise<VeCms> {
	const phan = token.split(".");
	if (phan.length !== 3) throw new VeKhongHopLe("dang_sai", "Vé không đúng dạng JWT.");
	const [pHeader, pThan, pKy] = phan;

	let header: { alg?: string; typ?: string };
	let than: Record<string, unknown>;
	try {
		header = giaiJson(pHeader) as typeof header;
		than = giaiJson(pThan) as typeof than;
	} catch {
		throw new VeKhongHopLe("giai_ma_hong", "Không đọc được nội dung vé.");
	}

	// Chốt thuật toán. Thiếu dòng này là mở đúng lỗ "alg: none" kinh điển: kẻ tấn công
	// gửi vé không ký và thư viện ngoan ngoãn chấp nhận.
	if (header.alg !== "HS256") {
		throw new VeKhongHopLe("alg_sai", "Vé phải ký bằng HS256.");
	}

	const khoa = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(biMat),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["verify"],
	);
	const dat = await crypto.subtle.verify(
		"HMAC",
		khoa,
		giaiBase64Url(pKy),
		new TextEncoder().encode(`${pHeader}.${pThan}`),
	);
	if (!dat) throw new VeKhongHopLe("chu_ky_sai", "Chữ ký của vé không khớp.");

	if (than.iss !== NGUOI_CAP) throw new VeKhongHopLe("iss_sai", "Vé không phải do app Kinh Lạc cấp.");
	// `aud` của jsonwebtoken có thể là chuỗi hoặc mảng.
	const aud = Array.isArray(than.aud) ? than.aud : [than.aud];
	if (!aud.includes(NGUOI_NHAN)) throw new VeKhongHopLe("aud_sai", "Vé không dành cho CMS này.");

	const exp = typeof than.exp === "number" ? than.exp : 0;
	if (!exp || exp * 1000 <= Date.now()) {
		throw new VeKhongHopLe("het_han", "Vé đã hết hạn.");
	}

	const email = typeof than.email === "string" ? than.email.trim().toLowerCase() : "";
	const vaiTro = typeof than.vaiTro === "number" ? than.vaiTro : 0;
	const jti = typeof than.jti === "string" ? than.jti : "";
	const sub = typeof than.sub === "string" ? than.sub : "";
	const ten = typeof than.ten === "string" && than.ten.trim() ? than.ten.trim() : email;

	if (!email) throw new VeKhongHopLe("thieu_email", "Vé thiếu email.");
	if (!jti) throw new VeKhongHopLe("thieu_jti", "Vé thiếu mã riêng.");
	if (!BAC_HOP_LE.has(vaiTro)) throw new VeKhongHopLe("vai_tro_sai", "Vé mang bậc vai trò lạ.");

	return { sub, email, ten, vaiTro, jti, exp };
}

// ---------------------------------------------------------------------------
// Chặn dùng lại vé
// ---------------------------------------------------------------------------

/**
 * Mã những vé đã tiêu, giữ tới lúc chúng hết hạn.
 *
 * ⚠️ NẰM TRONG BỘ NHỚ TIẾN TRÌNH — chỉ đúng khi chạy MỘT container, đúng như hiện
 * trạng triển khai (xem "Deployment paths" trong CLAUDE.md, cùng lý lẽ với `@Cron`
 * và `sse.service`). Thêm bản sao thứ hai là mỗi bản giữ một sổ riêng và một vé
 * tiêu được hai lần. Vé chỉ sống 60 giây nên thiệt hại có trần, nhưng vẫn phải sửa
 * sang kho dùng chung nếu có ngày nhân bản.
 */
const veDaTieu = new Map<string, number>();

/** Đánh dấu vé đã tiêu. Trả `false` nếu nó ĐÃ được tiêu trước đó. */
export function tieuVe(jti: string, expGiay: number): boolean {
	const bayGio = Date.now();
	// Dọn rác tiện thể: sổ chỉ phình tới số vé cấp ra trong 60 giây.
	for (const [ma, han] of veDaTieu) if (han <= bayGio) veDaTieu.delete(ma);

	if (veDaTieu.has(jti)) return false;
	veDaTieu.set(jti, expGiay * 1000);
	return true;
}
