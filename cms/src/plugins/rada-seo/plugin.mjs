// Plugin Rada SEO — phần NỐI: khai báo với EmDash, route cho màn điều khiển, hook cron.
// Logic nằm ở các mô-đun thuần (kho, ca-radar, radar/*, luat/*) và có phép kiểm riêng.
//
// Dạng đăng ký đã ĐO ở bước 0 (docs/superpowers/plans/2026-09-30-rada-seo-ket-qua-buoc-0.md):
// EmDash nạp module này qua descriptor native và gọi createPlugin(); default export KHÔNG dùng.
import { definePlugin, PluginRouteError } from "emdash";
import { KHAI_BAO_KHO } from "./kho.mjs";
import * as kho from "./kho.mjs";
import { chuanTenMien } from "./radar/sitemap.mjs";
import { chayCaRadar } from "./ca-radar.mjs";
import { taoDocWeb } from "./lib/doc-web.mjs";
import { taoClaude, taoClientThat, taoNganSach } from "./lib/claude.mjs";

/** 02:30 giờ Việt Nam = 19:30 UTC hôm trước (cron của EmDash chạy theo UTC). */
export const LICH_RADAR = "30 19 * * *";
/** Khoá chống chạy chồng: ca dài nhất đo được + dư. Quá hạn thì coi như ca trước đã chết. */
const KHOA_CA = "ca:dang-chay";
const HAN_KHOA_MS = 3 * 60 * 60 * 1000;
/** Ca thành công gần nhất cũ hơn mức này thì màn điều khiển báo đỏ. */
const CANH_BAO_SAU_MS = 26 * 60 * 60 * 1000;

const soMoiTruong = (ten, macDinh) => {
	const n = Number(process.env[ten]);
	return Number.isFinite(n) && n > 0 ? n : macDinh;
};

/**
 * CÔNG TẮC "CHỈ VPS". Bảng _emdash_cron_tasks nằm trong kho CMS DÙNG CHUNG: mọi tiến trình CMS
 * nối kho (kể cả `npm run dev` ở máy lập trình) đều có thể nhận ca đêm. Chỉ nơi đặt biến này
 * (docker-compose trên VPS, KHÔNG phải cms/.env vì tệp đó được chép qua lại) mới chạy ca.
 */
const caDemBat = () => process.env.RADA_SEO_CA_DEM === "1";

/** @returns {Promise<string|null>} revision của khoá vừa giành được, null nếu đã có ca khác giữ. */
async function giuKhoa(kv) {
	const cu = await kv.getVersioned(KHOA_CA);
	if (cu && cu.value?.het > Date.now()) return null;
	const r = await kv.compareAndSet(KHOA_CA, cu?.revision ?? null, { tu: new Date().toISOString(), het: Date.now() + HAN_KHOA_MS });
	return r.applied ? r.revision : null;
}

async function chayCa(ctx, ghi) {
	const revision = await giuKhoa(ctx.kv);
	if (!revision) {
		ctx.log.warn("Rada SEO: đã có một ca đang chạy, bỏ qua lượt này");
		return null;
	}
	try {
		const nganSach = taoNganSach(soMoiTruong("RADA_SEO_TRAN_LUOT", 200));
		const claude = ghi ? taoClaude({ client: taoClientThat(), nganSach }) : null;
		return await chayCaRadar({
			s: ctx.storage,
			docWeb: taoDocWeb(ctx.http.fetch.bind(ctx.http)),
			claude,
			nganSach,
			ghi,
			tranMoiDoiThu: soMoiTruong("RADA_SEO_TRAN_MOI_DOI_THU", 30),
		});
	} catch (e) {
		// Lỗi trước khi vào ca (vd thiếu ANTHROPIC_API_KEY) vẫn phải hiện trên màn điều khiển.
		const bayGio = new Date().toISOString();
		await kho.ghiCa(ctx.storage, { loai: "radar", batDau: bayGio, ketThuc: bayGio, ghi, loi: [String(e?.message ?? e)] });
		ctx.log.error("Rada SEO: ca hỏng", e);
		return null;
	} finally {
		// So khớp đúng revision đã giành: một ca cũ quá hạn khoá (coi như đã chết, xem giuKhoa)
		// không được xoá khoá của ca MỚI vừa giành lại — compareAndDelete chỉ xoá khi còn khớp.
		await ctx.kv.compareAndDelete(KHOA_CA, revision);
	}
}

const vao = (ctx) => (ctx.input && typeof ctx.input === "object" ? ctx.input : {});

export function createPlugin() {
	return definePlugin({
		id: "rada-seo",
		version: "0.1.0",
		// Đối thủ do người quản trị thêm lúc chạy nên không liệt kê trước được tên miền;
		// lớp chặn nằm ở doc-web.mjs (không IP/localhost) và sitemap.mjs (chỉ cùng tên miền).
		capabilities: ["network:request:unrestricted"],
		storage: KHAI_BAO_KHO,
		// Mục "Rada SEO" ở thanh bên PHẢI khai ở đây. Với format:"native", EmDash 0.39.1 dựng
		// manifest admin từ plugin.admin của definePlugin() và BỎ QUA adminPages của descriptor
		// (chỉ plugin "standard"/sandbox mới đọc chỗ đó). Đo ở nghiệm thu 2A: thiếu khối này thì
		// manifest ra adminPages:[] và thanh bên không có mục nào, dù trang vẫn mở được bằng URL.
		// React component vẫn nạp qua adminEntry của descriptor (admin registry lúc build).
		admin: { pages: [{ path: "/rada", label: "Rada SEO", icon: "chart" }] },
		hooks: {
			cron: async (event, ctx) => {
				if (event.name !== "radar") return;
				if (!caDemBat()) {
					ctx.log.warn("Rada SEO: máy này không bật RADA_SEO_CA_DEM — nhả ca đêm");
					const bayGio = new Date().toISOString();
					await kho.ghiCa(ctx.storage, {
						loai: "radar", batDau: bayGio, ketThuc: bayGio, ghi: false,
						loi: ["Ca đêm bị một tiến trình KHÔNG bật RADA_SEO_CA_DEM nhận — đêm nay radar không chạy"],
					});
					return;
				}
				// THẢ ca chạy nền, không await: EmDash bọc mọi hook cron bằng executeWithTimeout
				// (5 giây mặc định — resolveHook trong node_modules/emdash), và bộ lập lịch cron
				// của Node chỉ lên dây lại SAU KHI hook resolve. Await trọn một ca radar (có thể
				// vài giờ) sẽ vừa ghi "Hook timeout after 5000ms" giả mỗi đêm vừa treo mọi cron
				// task khác của CMS cho tới khi ca xong. Khoá KV (giuKhoa/compareAndDelete ở
				// chayCa) chống chạy chồng nếu một tick cron khác tới trước khi ca này xong.
				chayCa(ctx, true).catch((e) => ctx.log.error("Rada SEO: ca đêm hỏng", e));
			},
		},
		routes: {
			"tong-quan": {
				handler: async (ctx) => {
					const doiThu = await kho.dsDoiThu(ctx.storage);
					for (const d of doiThu) d.dem = await kho.demUrl(ctx.storage, d.id);
					const ca = await kho.dsCa(ctx.storage, 10);
					// "Thành công" = ca thật sự đi qua chayCaRadar (chỉ hàm đó gán soSePhanTich, một
					// số — dòng lỗi trước khi vào ca và dòng "nhả ca" ở trên đều KHÔNG có trường này).
					// Không đòi `loi` rỗng: một ca chạy đúng vẫn có thể đẩy ghi chú hết ngân sách
					// (HetNganSach) hoặc lỗi sitemap của MỘT đối thủ vào `loi` mà cả ca vẫn hoàn tất —
					// đòi rỗng làm cảnh báo "26 giờ" đỏ vĩnh viễn dù đêm nào ca cũng chạy xong. Tra
					// trong 100 ca gần nhất (không phải 10 dòng hiển thị `ca`) để không bỏ sót.
					const canhChe = await kho.dsCa(ctx.storage, 100);
					const thanhCong = canhChe.find((c) => c.ghi && c.ketThuc && typeof c.soSePhanTich === "number");
					const khoa = await ctx.kv.get(KHOA_CA);
					return {
						doiThu,
						cum: await kho.dsCum(ctx.storage, 100),
						ca,
						lich: (await ctx.cron?.list()) ?? [],
						caDemBat: caDemBat(),
						dangChay: !!(khoa && khoa.het > Date.now()),
						canhBaoCaDem: caDemBat() && (!thanhCong || Date.now() - Date.parse(thanhCong.ketThuc) > CANH_BAO_SAU_MS),
					};
				},
			},
			"doi-thu-luu": {
				handler: async (ctx) => {
					const { tenMien, ten, laCuaMinh } = vao(ctx);
					const tm = chuanTenMien(tenMien);
					if (!tm) throw PluginRouteError.badRequest("Tên miền không hợp lệ");
					await kho.luuDoiThu(ctx.storage, { tenMien: tm, ten: String(ten ?? "").trim(), laCuaMinh: !!laCuaMinh }, new Date().toISOString());
					return { tenMien: tm };
				},
			},
			"doi-thu-xoa": {
				handler: async (ctx) => {
					const tm = chuanTenMien(vao(ctx).tenMien);
					if (!tm) throw PluginRouteError.badRequest("Tên miền không hợp lệ");
					return { soUrlDaXoa: await kho.xoaDoiThu(ctx.storage, tm) };
				},
			},
			"cum-trang-thai": {
				handler: async (ctx) => {
					const { id, trangThai } = vao(ctx);
					// Màn điều khiển chỉ được bỏ qua / khôi phục; các trạng thái khác do lò viết đặt.
					if (!["bo_qua", "cho_viet"].includes(trangThai)) throw PluginRouteError.badRequest("Chỉ được đặt bo_qua hoặc cho_viet");
					try {
						await kho.datTrangThaiCum(ctx.storage, String(id), trangThai);
					} catch (e) {
						if (e?.message === "Không có cụm này") throw PluginRouteError.notFound("Không có cụm này");
						throw e;
					}
					return { id, trangThai };
				},
			},
			"lich-bat": {
				// plugin:install KHÔNG chạy với plugin khai trong config (đo ở bước 0) nên phải hẹn
				// qua route. schedule là upsert: bấm lại vô hại.
				handler: async (ctx) => {
					// CHỈ hẹn từ tiến trình UTC có bật ca đêm (tức container VPS). nextCronTime của
					// EmDash gọi croner KHÔNG kèm múi giờ → "30 19 * * *" được tính theo giờ của
					// TIẾN TRÌNH. Hẹn từ máy giờ VN ra 12:30Z (= 19:30 VN, đo ở nghiệm thu 2A), mà
					// dòng _emdash_cron_tasks nằm trong kho DÙNG CHUNG — VPS (UTC) chỉ tính lại sau
					// mỗi lượt chạy, nên đêm đó ca chạy lệch 7 tiếng. Chỉ đúng khi hẹn từ tiến trình UTC.
					if (!caDemBat() || new Date().getTimezoneOffset() !== 0)
						throw PluginRouteError.badRequest("Chỉ hẹn lịch được trên máy chủ chạy ca đêm (RADA_SEO_CA_DEM=1) và theo giờ UTC — hẹn từ máy khác sẽ làm ca đêm lệch giờ");
					await ctx.cron.schedule("radar", { schedule: LICH_RADAR });
					return { lich: await ctx.cron.list() };
				},
			},
			"ca-chay": {
				// Chạy NỀN rồi trả ngay: một ca thật kéo dài nhiều phút, quá hạn chờ của nginx.
				handler: async (ctx) => {
					const ghi = vao(ctx).ghi === true;
					if (ghi && !caDemBat()) throw PluginRouteError.badRequest("Máy này không bật RADA_SEO_CA_DEM — chỉ được chạy thử");
					// Nhìn trước khoá để báo thật cho người bấm (trước đây trả daBatDau:true dù ca bị
					// chặn). Cùng luật hết hạn với giuKhoa. Đây chỉ là lời báo: chốt chặn thật vẫn là
					// giuKhoa trong chayCa, vì hai lời gọi có thể cùng lọt qua bước nhìn này.
					const khoa = await ctx.kv.get(KHOA_CA);
					if (khoa && khoa.het > Date.now()) throw PluginRouteError.conflict("Đang có một ca chạy — chờ ca đó xong");
					chayCa(ctx, ghi).catch((e) => ctx.log.error("Rada SEO: ca nền hỏng", e));
					return { daBatDau: true, ghi };
				},
			},
		},
	});
}
