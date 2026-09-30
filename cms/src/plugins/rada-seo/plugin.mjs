// Plugin Rada SEO — phần NỐI: khai báo với EmDash, route cho màn điều khiển, hook cron.
// Logic nằm ở các mô-đun thuần (kho, ca-radar, radar/*, luat/*) và có phép kiểm riêng.
//
// Dạng đăng ký đã ĐO ở bước 0 (docs/superpowers/plans/2026-09-30-rada-seo-ket-qua-buoc-0.md):
// EmDash nạp module này qua descriptor native và gọi createPlugin(); default export KHÔNG dùng.
import { definePlugin } from "emdash";
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

async function giuKhoa(kv) {
	const cu = await kv.getVersioned(KHOA_CA);
	if (cu && cu.value?.het > Date.now()) return false;
	const r = await kv.compareAndSet(KHOA_CA, cu?.revision ?? null, { tu: new Date().toISOString(), het: Date.now() + HAN_KHOA_MS });
	return r.applied;
}

async function chayCa(ctx, ghi) {
	if (!(await giuKhoa(ctx.kv))) {
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
		await ctx.kv.delete(KHOA_CA);
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
				await chayCa(ctx, true);
			},
		},
		routes: {
			"tong-quan": {
				handler: async (ctx) => {
					const doiThu = await kho.dsDoiThu(ctx.storage);
					for (const d of doiThu) d.dem = await kho.demUrl(ctx.storage, d.id);
					const ca = await kho.dsCa(ctx.storage, 10);
					const thanhCong = ca.find((c) => c.ghi && !c.loi?.length && c.ketThuc);
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
					if (!tm) throw new Error("Tên miền không hợp lệ");
					await kho.luuDoiThu(ctx.storage, { tenMien: tm, ten: String(ten ?? "").trim(), laCuaMinh: !!laCuaMinh }, new Date().toISOString());
					return { tenMien: tm };
				},
			},
			"doi-thu-xoa": {
				handler: async (ctx) => ({ soUrlDaXoa: await kho.xoaDoiThu(ctx.storage, chuanTenMien(vao(ctx).tenMien)) }),
			},
			"cum-trang-thai": {
				handler: async (ctx) => {
					const { id, trangThai } = vao(ctx);
					// Màn điều khiển chỉ được bỏ qua / khôi phục; các trạng thái khác do lò viết đặt.
					if (!["bo_qua", "cho_viet"].includes(trangThai)) throw new Error("Chỉ được đặt bo_qua hoặc cho_viet");
					await kho.datTrangThaiCum(ctx.storage, String(id), trangThai);
					return { id, trangThai };
				},
			},
			"lich-bat": {
				// plugin:install KHÔNG chạy với plugin khai trong config (đo ở bước 0) nên phải hẹn
				// qua route. schedule là upsert: bấm lại vô hại.
				handler: async (ctx) => {
					await ctx.cron.schedule("radar", { schedule: LICH_RADAR });
					return { lich: await ctx.cron.list() };
				},
			},
			"ca-chay": {
				// Chạy NỀN rồi trả ngay: một ca thật kéo dài nhiều phút, quá hạn chờ của nginx.
				handler: async (ctx) => {
					const ghi = vao(ctx).ghi === true;
					if (ghi && !caDemBat()) throw new Error("Máy này không bật RADA_SEO_CA_DEM — chỉ được chạy thử");
					void chayCa(ctx, ghi);
					return { daBatDau: true, ghi };
				},
			},
		},
	});
}
