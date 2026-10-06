// Màn điều khiển Rada SEO trong /_emdash/admin/plugins/rada-seo/rada.
// Chỉ HIỂN THỊ và gọi route của plugin; mọi luật nằm phía máy chủ.
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { toaDoNanHoa } from "./viet/mang-nhen-xem.mjs";
import { ROUTE_MO_MAN, routeChoTab, TAI_LAI_KHI_SANG } from "./lib/tai-man.mjs";
import { boDong, datDong } from "./lib/bo-dong.mjs";
import { gomLoiCa } from "./lib/gom-loi-ca.mjs";

async function goi(route, body) {
	const res = await fetch(`/_emdash/api/plugins/rada-seo/${route}`, {
		method: "POST",
		credentials: "same-origin",
		// X-EmDash-Request là thứ CHỊU LỰC: thiếu nó production trả 403 CSRF_REJECTED.
		headers: { "Content-Type": "application/json", "X-EmDash-Request": "1" },
		body: JSON.stringify(body ?? {}),
	});
	const j = await res.json().catch(() => null);
	if (!res.ok || j?.success === false) {
		const e = new Error(j?.error?.message ?? `Lỗi ${res.status}`);
		// Mã HTTP đi kèm để màn hình phân biệt "không đủ quyền" (403) với lỗi thật.
		e.status = res.status;
		throw e;
	}
	return j?.data ?? j;
}

// Người duyệt bậc Editor (40) thấy trang này nhưng chỉ route của tab Nháp cho họ đọc; các tab còn
// lại trả 403 (plugins:manage). Lời báo phải nói được điều đó thay vì in lỗi thô của máy chủ.
const CHI_QUAN_TRI = "Tab này chỉ dành cho quản trị viên.";
const KHONG_QUYEN_NHAP = "Tài khoản của bạn chưa có quyền xem danh sách nháp (cần quyền sửa bài).";
const loiCua = (e, khi403 = CHI_QUAN_TRI) => (e?.status === 403 ? khi403 : e?.message ?? "Lỗi không rõ");

/** Chỗ của một tab khi chưa có dữ liệu: đang tải, lỗi thật (đỏ), hoặc không đủ quyền (khung xám). */
function ChuaCoDuLieu({ loi }) {
	if (loi === CHI_QUAN_TRI || loi === KHONG_QUYEN_NHAP)
		return (
			<div style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: "12px 16px", margin: "8px 0", background: "#f9fafb", maxWidth: 640 }}>
				<b>{loi}</b>
				{loi === CHI_QUAN_TRI && <div style={{ marginTop: 4 }}>Bạn vẫn dùng được tab “Nháp” và khung “Phiếu Rada” ở cột phải trình soạn bài.</div>}
			</div>
		);
	return <div style={{ padding: 24, color: loi ? "#b91c1c" : undefined }}>{loi || "Đang tải…"}</div>;
}

const gio = (s) => (s ? new Date(s).toLocaleString("vi-VN") : "—");
/**
 * Lý do lò viết hỏng mà NGƯỜI phải xử — trả câu tiếng Việt, hoặc "" nếu không có.
 *
 * Lỗi nội dung (model trả sai dạng JSON, vướng phạm vi Y sỹ) KHÔNG lọt qua đây: vòng sửa 3 lượt
 * sinh ra để lo đúng những thứ đó, và bài trượt hẳn thì đã nằm ở chip "Cần xem lại". In lời máy
 * ra màn hình chỉ bắt người đọc lọc nhiễu.
 */
function cheoNguoi(ghiChu) {
	const ds = ghiChu ?? [];
	if (ds.some((g) => /HTTP 429|quota/i.test(g))) return "Hết quota API của Google AI Studio — đổi model trong cms/.env hoặc bật thanh toán.";
	if (ds.some((g) => /thiếu GRAVITY|chưa khai model|chưa cấu hình/i.test(g))) return "Chưa cấu hình model viết — xem GRAVITY_* trong cms/.env.";
	if (ds.some((g) => /hết hạn ngạch/i.test(g))) return "Hết hạn ngạch bài đêm nay. Bấm “Viết ngay” ở một bài cụ thể thì không bị trần này.";
	if (ds.some((g) => /nháp chờ duyệt/i.test(g))) return "Đủ nháp chờ duyệt — duyệt bớt ở tab Nháp rồi viết tiếp.";
	return "";
}

/** "2 phút trước" — đủ để biết lò viết mới chạy hay đã kẹt, không cần đồng hồ chính xác. */
function lucTruoc(iso) {
	const ms = Date.now() - Date.parse(iso);
	if (!Number.isFinite(ms) || ms < 0) return "vừa xong";
	const giay = Math.round(ms / 1000);
	if (giay < 60) return `${giay} giây trước`;
	const phut = Math.round(giay / 60);
	if (phut < 60) return `${phut} phút trước`;
	return `${Math.round(phut / 60)} giờ trước`;
}
const o = { padding: "6px 8px", borderBottom: "1px solid #e5e5e5", textAlign: "left", verticalAlign: "top" };

// ---- Nút ----
// CSS của khu quản trị EmDash XOÁ SẠCH kiểu mặc định của <button>: không viền, không nền. Nút
// trần hiện ra như chữ thường — người dùng đã không nhận ra "Bật lịch", "Chạy thật", "Lưu"… là
// nút bấm được. MỌI nút trên màn này phải đi qua <Nut>, không dùng <button> trần.
const NUT = {
	display: "inline-block",
	padding: "4px 12px",
	margin: "2px 0",
	border: "1px solid #d1d5db",
	borderRadius: 6,
	background: "#fff",
	color: "#111827",
	cursor: "pointer",
	font: "inherit",
	lineHeight: 1.4,
	boxShadow: "0 1px 1px rgba(0,0,0,0.05)",
};
/** Việc chính của mỗi chỗ (Chạy thật, Lưu, Duyệt, Nhận…). */
const NUT_CHINH = { background: "#1f2937", borderColor: "#1f2937", color: "#fff", fontWeight: 600 };
/** Tab đang mở. */
const NUT_DANG_CHON = { background: "#e5e7eb", borderColor: "#6b7280", fontWeight: 700 };
const NUT_TAT = { opacity: 0.45, cursor: "not-allowed", boxShadow: "none" };

function Nut({ chinh, dangChon, disabled, style, type = "button", ...con }) {
	return (
		<button
			type={type}
			disabled={disabled}
			aria-pressed={dangChon === undefined ? undefined : !!dangChon}
			style={{ ...NUT, ...(chinh && NUT_CHINH), ...(dangChon && NUT_DANG_CHON), ...(disabled && NUT_TAT), ...style }}
			{...con}
		/>
	);
}

/**
 * Nút TỰ giữ trạng thái bận của chính nó.
 *
 * ⚠️ Vì sao không dùng một cờ toàn cục: cờ `dangBan` cũ in "⏳ đang xử lý…" ở CUỐI THANH QUY
 * TRÌNH, tức chỗ mắt người vừa bấm một nút giữa bảng không nhìn tới. Nên nó không ngăn được cú
 * bấm thứ hai — mà cú bấm thứ hai mới là thứ xếp thêm một lượt tải lại vào hàng trên pool max:1.
 *
 * `onBam` phải trả Promise. Không trả (ví dụ người bấm Cancel ở hộp xác nhận) thì nút nhả ngay —
 * đúng hành vi muốn có, nhưng nghĩa là chống bấm đôi chỉ hiệu lực khi có việc thật đang chạy.
 */
function NutBan({ onBam, chuBan = "Đang gửi…", children, ...con }) {
	const [ban, setBan] = useState(false);
	return (
		<Nut
			{...con}
			disabled={ban || con.disabled}
			onClick={() => {
				if (ban) return;
				setBan(true);
				// `finally` chứ không `then`: lỗi cũng phải nhả nút, không thì một lần hỏng là nút
				// chết hẳn tới khi tải lại trang.
				Promise.resolve(onBam?.()).finally(() => setBan(false));
			}}
		>
			{ban ? `⏳ ${chuBan}` : children}
		</Nut>
	);
}

// Ô "máy đang tự làm gì" đầu tab Radar — câu do máy chủ tính (tinh-trang.mjs), ở đây chỉ vẽ.
const DAU_TINH_TRANG = { ok: ["✓", "#15803d"], cho: ["•", "#92400e"], thieu: ["✗", "#b91c1c"] };
function OTinhTrang({ ds }) {
	if (!ds || ds.length === 0) return null;
	return (
		<div style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: "10px 14px", margin: "8px 0 16px", background: "#f9fafb" }}>
			<div style={{ fontWeight: 600, marginBottom: 4 }}>Máy đang tự làm gì</div>
			{ds.map((x, i) => {
				const [dau, mau] = DAU_TINH_TRANG[x.muc] ?? DAU_TINH_TRANG.cho;
				return (
					<div key={i} style={{ margin: "2px 0" }}>
						<span style={{ color: mau, fontWeight: 700, display: "inline-block", width: 18 }}>{dau}</span>
						{x.luc ? x.chu.replace("{luc}", gio(x.luc)) : x.chu}
					</div>
				);
			})}
		</div>
	);
}

// ---- Thanh tab (2C-2) ----
/**
 * BẢY TAB NÀY LÀ MỘT QUY TRÌNH, không phải bảy ngăn rời.
 *
 * Trước 06/10/2026 chúng là bảy cái nút phẳng xếp ngang: không thấy thứ tự, không thấy chặng
 * nào đẻ ra chặng nào, và không biết chặng nào đang có việc nếu chưa bấm vào. Tư duy thì
 * đúng mà màn hình không nói ra được — người dùng phải tự nhớ.
 *
 * Nay chia theo HAI VÒNG, vì chúng thật sự là hai việc khác nhau:
 *   CHIẾM ĐẤT  — tìm chỗ chưa có rồi viết mới (radar → khoảng trống → hướng → kế hoạch → nháp)
 *   GIỮ ĐẤT    — nâng cái đã có (leo top → mạng nhện)
 * `moTa` hiện thành chú thích dưới số thứ tự: một dòng nói chặng đó LÀM GÌ, để người mới
 * không phải đoán từ cái tên.
 */
const TABS = [
	{ key: "radar", label: "Radar", so: 1, vong: "chiem", moTa: "Quét đối thủ" },
	{ key: "khoang-trong", label: "Khoảng trống", so: 2, vong: "chiem", moTa: "Chỗ mình có tháp" },
	{ key: "huong", label: "Hướng nội dung", so: 3, vong: "chiem", moTa: "Gom thành cụm" },
	{ key: "ke-hoach", label: "Kế hoạch", so: 4, vong: "chiem", moTa: "Bài dự kiến" },
	{ key: "nhap", label: "Nháp", so: 5, vong: "chiem", moTa: "Chờ duyệt, đăng" },
	{ key: "leo-top", label: "Leo top", so: 6, vong: "giu", moTa: "Nâng trang đã có" },
	{ key: "mang-nhen", label: "Mạng nhện", so: 7, vong: "giu", moTa: "Link cũ → mới" },
];
const VONG = {
	chiem: { ten: "Chiếm đất — viết mới", mau: "#1d4ed8", nen: "#eff6ff", vien: "#bfdbfe" },
	giu: { ten: "Giữ đất — nâng cái đã có", mau: "#15803d", nen: "#f0fdf4", vien: "#bbf7d0" },
};

/**
 * Một chặng trong thanh quy trình. Huy hiệu số là VIỆC ĐANG CHỜ ở chặng đó (route `viec-dem`),
 * không phải tổng số bản ghi — người ta cần biết chỗ nào phải động tay, không cần biết kho to
 * cỡ nào.
 */
function ChangQuyTrinh({ t, dangChon, dem, onChon }) {
	const v = VONG[t.vong];
	return (
		<button
			type="button"
			onClick={onChon}
			title={t.moTa}
			style={{
				display: "flex",
				alignItems: "center",
				gap: 8,
				padding: "6px 10px",
				border: `1px solid ${dangChon ? v.mau : "#e5e7eb"}`,
				borderRadius: 10,
				background: dangChon ? v.nen : "#fff",
				cursor: "pointer",
				font: "inherit",
				textAlign: "left",
				boxShadow: dangChon ? `inset 0 0 0 1px ${v.vien}` : "none",
			}}
		>
			<span
				style={{
					width: 22,
					height: 22,
					borderRadius: "50%",
					background: dangChon ? v.mau : "#f3f4f6",
					color: dangChon ? "#fff" : "#6b7280",
					display: "inline-flex",
					alignItems: "center",
					justifyContent: "center",
					fontSize: 12,
					fontWeight: 700,
					flex: "0 0 auto",
				}}
			>
				{t.so}
			</span>
			<span style={{ lineHeight: 1.15 }}>
				<span style={{ fontWeight: dangChon ? 700 : 500, fontSize: 14 }}>{t.label}</span>
				<span style={{ display: "block", fontSize: 11, color: "#9ca3af" }}>{t.moTa}</span>
			</span>
			{dem > 0 && (
				// Chỉ hiện khi CÓ việc. Huy hiệu "0" khắp nơi làm mắt thôi nhìn vào huy hiệu.
				<span
					style={{
						marginLeft: 2,
						minWidth: 20,
						padding: "1px 6px",
						borderRadius: 999,
						background: v.mau,
						color: "#fff",
						fontSize: 11,
						fontWeight: 700,
						textAlign: "center",
					}}
				>
					{dem}
				</span>
			)}
		</button>
	);
}

/**
 * Nút MÀN VIỆC — đứng TRÊN thanh quy trình, không nằm trong nó.
 *
 * Thanh quy trình trả lời "hệ thống gồm những gì"; màn Việc trả lời "giờ tôi làm gì". Hai câu
 * khác nhau nên hai chỗ khác nhau, và câu thứ hai đứng trước vì đó là câu người dùng mở màn để
 * hỏi (họ chốt điều đó 06/10/2026).
 */
function NutManViec({ tab, tong, onChon }) {
	const dangChon = tab === "viec";
	return (
		<button
			type="button"
			onClick={() => onChon("viec")}
			style={{
				display: "flex",
				alignItems: "center",
				gap: 10,
				width: "100%",
				maxWidth: 420,
				padding: "10px 14px",
				margin: "0 0 14px",
				border: `1px solid ${dangChon ? "#92400e" : "#e5e7eb"}`,
				borderRadius: 10,
				background: dangChon ? "#fffbeb" : "#fff",
				cursor: "pointer",
				font: "inherit",
				textAlign: "left",
			}}
		>
			<span style={{ fontSize: 18 }}>📋</span>
			<span style={{ lineHeight: 1.2 }}>
				<span style={{ fontWeight: 700, fontSize: 15 }}>Hôm nay làm gì</span>
				<span style={{ display: "block", fontSize: 11, color: "#9ca3af" }}>Việc đang chờ bạn, xếp việc chặn dây chuyền trước</span>
			</span>
			<span style={{ flex: 1 }} />
			{/* Chỉ hiện khi CÓ việc — huy hiệu "0" khắp nơi làm mắt thôi nhìn vào huy hiệu. */}
			{tong > 0 && (
				<span style={{ minWidth: 24, padding: "2px 8px", borderRadius: 999, background: "#92400e", color: "#fff", fontSize: 12, fontWeight: 700, textAlign: "center" }}>
					{tong}
				</span>
			)}
		</button>
	);
}

/** Thanh quy trình: hai vòng, có mũi tên giữa các chặng để thấy cái nào đẻ ra cái nào. */
function ThanhQuyTrinh({ tab, dem, onChon }) {
	const nhom = (v) => TABS.filter((t) => t.vong === v);
	return (
		<div style={{ margin: "0 0 16px" }}>
			{["chiem", "giu"].map((v) => (
				<div key={v} style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
					<span style={{ fontSize: 11, color: VONG[v].mau, fontWeight: 700, width: 128, flex: "0 0 auto" }}>{VONG[v].ten}</span>
					{nhom(v).map((t, i) => (
						<Fragment key={t.key}>
							{i > 0 && <span style={{ color: "#d1d5db", fontSize: 13 }}>→</span>}
							<ChangQuyTrinh t={t} dangChon={tab === t.key} dem={dem?.[t.key] ?? 0} onChon={() => onChon(t.key)} />
						</Fragment>
					))}
				</div>
			))}
		</div>
	);
}
const TAB_LS_KEY = "rada-seo:tab";
/**
 * ⚠️ Tab ĐÃ LƯU thắng tab mặc định. `viec` chỉ là giá trị rơi về khi localStorage trống hoặc giữ
 * một key không còn tồn tại — người đang làm dở ở tab Leo top mở lại trang phải về Leo top, không
 * bị kéo về màn Việc.
 */
function tabDaLuu() {
	try {
		const v = localStorage.getItem(TAB_LS_KEY);
		return v === "viec" || TABS.some((t) => t.key === v) ? v : "viec";
	} catch {
		return "viec";
	}
}
function luuTab(tab) {
	try {
		localStorage.setItem(TAB_LS_KEY, tab);
	} catch {
		// riêng tư trình duyệt/không có localStorage: bỏ qua, tab vẫn đổi được trong phiên này.
	}
}

// Site thật — admin.jsx chạy trong trình duyệt nên không đọc được RADA_SEO_SITE của máy chủ;
// cùng giá trị mặc định với noi-bo/nap.mjs và noi-bo/kiem-duong.mjs.
const TRANG_GOC = "https://kinhlac.online";
const NHAN_KE_HOACH = { de_xuat: "Chờ duyệt", da_duyet: "Đã duyệt", bo_qua: "Đã bỏ", dang_viet: "Đang viết", co_nhap: "Có nháp", da_dang: "Đã đăng", can_xem: "Cần xem lại" };
const NHAN_Y_DINH = { tra_cuu: "Tra cứu", tim_hieu: "Tìm hiểu", so_sanh: "So sánh", huong_dan: "Hướng dẫn" };
/**
 * Màn duyệt sửa được các bài ở những trạng thái này (đích đặt được: KE_HOACH_MAN_DUYET ở plugin.mjs).
 * can_xem: lò viết bỏ cuộc (nộp hết lượt đều trượt / giữ chỗ hết hạn lần 2) — "Duyệt lại" hoặc "Bỏ".
 */
const KE_HOACH_SUA_DUOC = new Set(["de_xuat", "da_duyet", "bo_qua", "can_xem"]);

/**
 * MÀN VIỆC — "giờ tôi làm gì", tab mặc định.
 *
 * Người dùng chốt 06/10/2026: mở Rada SEO ra, điều cần biết trong 5 giây đầu là một danh sách
 * việc bấm-là-xong, không phải bảy ngăn dữ liệu để tự đi tìm.
 *
 * Luật gom/xếp/lý do nằm ở `lib/xep-viec.mjs` (có phép kiểm); ở đây chỉ VẼ và gọi route.
 */

/** Mã hành động → nhãn nút. Mã do `lib/xep-viec.mjs` khai, bảng này là phần UI của nó. */
const NHAN_HANH_DONG = {
	nhan: "Nhận",
	bo: "Bỏ",
	duyet: "Duyệt",
	mo_nhap: "Mở để duyệt ↗",
	xem_phieu: "Xem phiếu ↗",
	da_sua: "Đã sửa",
	mo_bai_cu: "Mở bài cũ ↗",
	do: "Dò sơ hở ↗",
	mo_radar: "Mở Radar ↗",
	mo_cms: "Mở CMS ↗",
	mo_tham_dinh: "Mở màn thẩm định ↗",
};
/** Hành động nào GHI (cần nút tự báo bận + dòng rời hàng đợi), hành động nào chỉ điều hướng. */
const HANH_DONG_GHI = new Set(["nhan", "bo", "duyet", "da_sua"]);
/** Việc loại nào thì nút điều hướng dẫn sang tab nào. */
const TAB_DICH = { mo_nhap: "nhap", xem_phieu: "leo-top", mo_bai_cu: "mang-nhen", do: "leo-top", mo_radar: "radar" };
/** Hành động mở một trang NGOÀI màn này (khu quản trị CMS), không phải đổi tab. */
const DUONG_NGOAI = {
	mo_cms: "/_emdash/admin/collections/nguon_y_van",
	// ⚠️ Việc sửa chữ làm ở APP, không ở CMS: màn duyệt của bot thẩm định nằm tại /app/tham-dinh.
	// Dẫn sang CMS là bắt người đi tìm một màn không tồn tại ở đó.
	mo_tham_dinh: `${TRANG_GOC}/app/tham-dinh`,
};

function DongViec({ v, onGhi, onSangTab, onXong }) {
	const [loi, setLoi] = useState("");
	// ⚠️ `datHuong` đòi `trongSo` nguyên 1..5 khi nhận hướng (kho.mjs) — thiếu nó thì route trả
	// "Nhận hướng cần trọng số nguyên 1..5". Mặc định 3 (giữa thang) để "bấm là xong" vẫn đúng:
	// việc hay làm phải là mặc định, không thêm một bước bắt buộc cho nó.
	const [trongSo, setTrongSo] = useState(3);
	const laNhanHuong = v.loai === "nhan_huong";
	// Việc HỆ THỐNG nổi bật: nó không phải việc nội dung, và nó chặn mọi thứ phía sau. Nhưng vẫn
	// là một dòng trong cùng hàng đợi — tách ra một khối cảnh báo riêng là quay lại đúng cái bệnh
	// "cảnh báo nằm một chỗ, việc nằm chỗ khác".
	const laHeThong = v.loai === "he_thong_ket";
	return (
		<li
			style={{
				listStyle: "none",
				padding: laHeThong ? "10px 12px" : "10px 0",
				borderTop: "1px solid #f3f4f6",
				...(laHeThong && { background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, marginBottom: 6 }),
			}}
		>
			<div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
				<span style={{ fontWeight: 700, fontSize: 14, color: laHeThong ? "#b91c1c" : undefined }}>
					{laHeThong && "⚠ "}
					{v.nhan}
				</span>
				<span style={{ fontSize: 14 }}>{v.ten}</span>
				{v.duong && (
					<a href={v.duong.startsWith("http") ? v.duong : `${TRANG_GOC}${v.duong}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12 }}>
						{v.duong}
					</a>
				)}
				{v.hienThi > 0 && v.loai !== "nhan_huong" && <span style={{ fontSize: 12, color: "#6b7280" }}>{v.hienThi} lượt hiển thị đang chờ</span>}
				<span style={{ flex: 1 }} />
				{laNhanHuong && (
					<label style={{ fontSize: 12, color: "#6b7280" }}>
						Mức ưu tiên{" "}
						<select value={trongSo} onChange={(e) => setTrongSo(Number(e.target.value))} style={{ font: "inherit", fontSize: 12 }}>
							{[1, 2, 3, 4, 5].map((n) => (
								<option key={n} value={n}>
									{n}
								</option>
							))}
						</select>
					</label>
				)}
				{v.hanhDong.map((h) =>
					HANH_DONG_GHI.has(h) ? (
						<NutBan
							key={h}
							chinh={h === "nhan" || h === "duyet"}
							chuBan="Đang gửi…"
							style={{ fontSize: 12, padding: "3px 10px" }}
							onBam={() => {
								setLoi("");
								return onGhi(v, h, { trongSo })
									.then(() => onXong?.(v.heQua ?? ""))
									.catch((e) => setLoi(loiCua(e)));
							}}
						>
							{NHAN_HANH_DONG[h]}
						</NutBan>
					) : DUONG_NGOAI[h] ? (
						// Mở một trang NGOÀI màn này (khu quản trị CMS): dùng <a> chứ không phải nút đổi
						// tab — bấm giữa/Cmd phải mở được tab mới, và người đọc thấy trước nó dẫn đi đâu.
						<a key={h} href={DUONG_NGOAI[h]} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12 }} onClick={() => onXong?.(v.heQua ?? "")}>
							{NHAN_HANH_DONG[h]}
						</a>
					) : (
						<Nut
							key={h}
							onClick={() => {
								// Nút điều hướng cũng nói hệ quả: người bấm "Mở để duyệt" cần biết ở đó
								// phải làm gì, không chỉ bị đẩy sang một tab khác.
								onXong?.(v.heQua ?? "");
								onSangTab(TAB_DICH[h] ?? "radar");
							}}
							style={{ fontSize: 12, padding: "3px 10px" }}
						>
							{NHAN_HANH_DONG[h]}
						</Nut>
					),
				)}
			</div>
			{/* Câu VÌ SAO — chỗ chữa "không hiểu nó đang làm gì". Lời giải thích đi kèm TỪNG việc. */}
			<div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{v.viSao}</div>
			{loi && <div style={{ fontSize: 12, color: "#b91c1c", marginTop: 2 }}>{loi}</div>}
		</li>
	);
}

function ManViecTab({ dl, loi, onTai, onSangTab, onGhi }) {
	// Câu HỆ QUẢ của cú bấm vừa rồi. Dòng đã rời hàng đợi nên câu này hiện ở đầu màn — nó trả lời
	// "tôi vừa khởi động cái gì, bao giờ thấy kết quả", thay cho một chữ "Đã lưu".
	const [heQua, setHeQua] = useState("");
	if (!dl) return loi ? <ChuaCoDuLieu loi={loi} /> : <ChoMotChut viec="Đang gom việc đang chờ bạn" />;
	const ds = dl.viec ?? [];
	return (
		<div>
			<div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
				<Nut onClick={onTai}>Tải lại</Nut>
				<span style={{ color: "#666", fontSize: 13 }}>
					{ds.length > 0 ? `${ds.length} việc đang chờ bạn, xếp việc CHẶN dây chuyền trước rồi việc rẻ sau.` : "Không có việc nào chờ bạn."}
					{dl.tuDem && " (số lấy từ bản đệm 60 giây)"}
				</span>
			</div>
			{heQua && (
				<div style={{ border: "1px solid #bbf7d0", background: "#f0fdf4", borderRadius: 8, padding: "8px 12px", marginBottom: 10, fontSize: 13, maxWidth: 860 }}>
					✓ {heQua}
				</div>
			)}
			{/* Sổ việc đã làm. ⚠️ "Tuần này", KHÔNG phải "bạn làm": ctx của plugin không mang thông
			    tin người dùng nên sổ chỉ biết MỐC, không biết AI. */}
			{dl.tuan && (
				<div style={{ fontSize: 13, color: "#374151", marginBottom: 10 }}>
					{dl.tuan.cau}
					{dl.tuan.tong > 0 && <span style={{ color: "#9ca3af" }}> Sổ tính từ {dl.tuan.tuNgayCoMoc}.</span>}
				</div>
			)}
			{/* ⚠️ Rỗng phải nói VÌ SAO rỗng: "hết việc", "chưa dò" và "chưa hỏi được kho" là ba
			    chuyện khác hẳn nhau, và rỗng trơn thì cả ba đọc ra như "không có việc". */}
			{ds.length === 0 && dl.cauRong && (
				<div style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: "10px 14px", background: "#f9fafb", maxWidth: 760 }}>{dl.cauRong}</div>
			)}
			<ul style={{ margin: 0, padding: 0, maxWidth: 980 }}>
				{ds.map((v) => (
					<DongViec key={v.khoa} v={v} onGhi={onGhi} onSangTab={onSangTab} onXong={setHeQua} />
				))}
			</ul>
			{/* KHOANG VÁ NỀN — tách HẲN khỏi hàng đợi trên, trần 3 dòng.
			    ⚠️ Trụ Chữ một mình có 1.744 mục hạng "hỏng". Trộn vào hàng đợi SEO là nhấn chìm nó
			    — đúng cái bẫy "65.321 lời phê chờ bạn duyệt" đã ghi trong CLAUDE.md. */}
			{(dl.vaNen?.length > 0 || dl.cauNen) && (
				<div style={{ marginTop: 18, maxWidth: 980 }}>
					<div style={{ fontWeight: 600, fontSize: 14 }}>Vá nền — kho tri thức</div>
					<div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>
						Việc không gấp nhưng chặn về lâu dài: nền mỏng thì mọi bài viết đứng trên nó cũng mỏng theo.
					</div>
					<ul style={{ margin: 0, padding: 0 }}>
						{(dl.vaNen ?? []).map((v) => (
							<DongViec key={v.khoa} v={v} onGhi={onGhi} onSangTab={onSangTab} onXong={setHeQua} />
						))}
					</ul>
					{dl.cauNen && <div style={{ fontSize: 12, color: "#92400e", marginTop: 4 }}>{dl.cauNen}</div>}
				</div>
			)}

			{/* VÒNG HỌC — loại sửa nào hay đi cùng việc lên hạng. ⚠️ Ghi chú đồng-xuất-hiện do máy
			    chủ tính kèm và LUÔN in: một phiếu mang nhiều loại sửa cùng lúc, người quản trị sửa
			    cả gói rồi mới bấm, nên không quy công cho loại nào được. */}
			{dl.vongHoc?.bang?.length > 0 && (
				<div style={{ marginTop: 18, maxWidth: 860 }}>
					<div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Sửa xong có lên hạng không</div>
					<table style={{ borderCollapse: "collapse", fontSize: 13 }}>
						<thead>
							<tr style={{ textAlign: "left", color: "#6b7280" }}>
								<th style={{ padding: "2px 10px 2px 0" }}>Loại sửa</th>
								<th style={{ padding: "2px 10px 2px 0" }}>Phiên</th>
								<th style={{ padding: "2px 10px 2px 0" }}>Lên</th>
								<th style={{ padding: "2px 10px 2px 0" }}>Yên</th>
								<th style={{ padding: "2px 10px 2px 0" }}>Tụt</th>
							</tr>
						</thead>
						<tbody>
							{dl.vongHoc.bang.map((x) => (
								// Dưới 5 phiên thì MỜ: 1/1 = 100% chẳng nói gì.
								<tr key={x.ma} style={{ opacity: x.duKetLuan ? 1 : 0.45 }}>
									<td style={{ padding: "2px 10px 2px 0" }}>{x.ten}</td>
									<td style={{ padding: "2px 10px 2px 0" }}>{x.soPhien}</td>
									<td style={{ padding: "2px 10px 2px 0" }}>{x.len}</td>
									<td style={{ padding: "2px 10px 2px 0" }}>{x.yen}</td>
									<td style={{ padding: "2px 10px 2px 0" }}>{x.tut}</td>
								</tr>
							))}
						</tbody>
					</table>
					{/* ⚠️ `ghiChu` là MẢNG chuỗi (xem vong-hoc.mjs), không phải một chuỗi — render thẳng
					    thì các câu nối liền không khoảng cách. */}
					{(dl.vongHoc.ghiChu ?? []).map((g, i) => (
						<div key={i} style={{ fontSize: 12, color: "#92400e", marginTop: 4 }}>
							⚠️ {g}
						</div>
					))}
				</div>
			)}
		</div>
	);
}

/** Danh sách "chủ đề + link mở tab mới", dùng chung cho bằng chứng bài đối thủ và tài sản nội bộ. */
function DanhSachLink({ ds, hienThi, toiDa = 5 }) {
	if (!ds || ds.length === 0) return <>—</>;
	return ds.slice(0, toiDa).map((x, i) => (
		<span key={i}>
			{i > 0 && "; "}
			<a href={hienThi(x).href} target="_blank" rel="noopener noreferrer">
				{hienThi(x).nhan}
			</a>
		</span>
	));
}

function CumNguNghiaTab({ dl, loi, onTai, onSangTab }) {
	const [cumMo, setCumMo] = useState(null);
	const [hoSo, setHoSo] = useState(null);
	const [hoSoLoi, setHoSoLoi] = useState("");
	const [dangTai, setDangTai] = useState(null);
	const [dangGiao, setDangGiao] = useState(false);
	const [giaoKq, setGiaoKq] = useState(null);
	const [giaoLoi, setGiaoLoi] = useState("");
	const [dangViet, setDangViet] = useState(false);
	const [vietKq, setVietKq] = useState(null);
	if (!dl) return loi ? <ChuaCoDuLieu loi={loi} /> : <ChoMotChut viec="Đang hỏi 657 cụm ngữ nghĩa trong kho app" />;

	const cum = dl.ds ?? [];
	// Hồ sơ dựng theo TÊN CHỦ TRỊ ĐẦU của cụm, các chủ trị còn lại làm biến thể.
	const batDauHoSo = (c) => {
		if (cumMo === c.id) return setCumMo(null);
		setDangTai(c.id); setHoSoLoi(""); setHoSo(null); setGiaoKq(null); setGiaoLoi(""); setVietKq(null);
		const ten = c.chuTri?.[0] ?? c.ten;
		goi("khoang-trong-ho-so", { cum: ten, bienThe: (c.chuTri ?? []).slice(1, 8) })
			.then((h) => { setHoSo(h); setCumMo(c.id); })
			.catch((e) => { setHoSoLoi(loiCua(e)); setCumMo(c.id); })
			.finally(() => setDangTai(null));
	};
	const giaoViec = (c) => {
		setDangGiao(true); setGiaoLoi(""); setGiaoKq(null);
		goi("khoang-trong-giao-viec", { cum: c.chuTri?.[0] ?? c.ten, bienThe: (c.chuTri ?? []).slice(1, 8) })
			.then(setGiaoKq)
			.catch((e) => setGiaoLoi(loiCua(e)))
			.finally(() => setDangGiao(false));
	};
	const vietNgay = () => {
		setDangViet(true); setVietKq(null);
		goi("lo-viet-chay", { keHoachId: giaoKq?.id })
			.then(setVietKq)
			.catch((e) => setGiaoLoi(loiCua(e)))
			.finally(() => setDangViet(false));
	};

	return (
		<div>
			<div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
				<Nut onClick={onTai}>Tải lại</Nut>
				<span style={{ color: "#666", fontSize: 13 }}>
					{cum.length} cụm ngữ nghĩa đạt ngưỡng tháp. Mỗi cụm gom nhiều chủ trị cùng nghĩa — đây là
					tầng trên của tab Khoảng trống, nơi mỗi chủ trị đứng một dòng riêng. Tháp đếm bài thuốc,
					vị thuốc và huyệt (huyệt khớp qua tên phác đồ châm cứu; rê chuột vào số huyệt để xem khớp
					qua phác đồ nào). Đường kinh KHÔNG cộng vào tháp — cả kho chỉ có 18 đường.
				</span>
			</div>
			{dl.loi && <div style={{ color: "#b91c1c", marginBottom: 10 }}>{dl.loi}</div>}
			{dl.gscGhiChu && <div style={{ color: "#6b7280", fontSize: 12, marginBottom: 8 }}>{dl.gscGhiChu}</div>}
			{!cum.length && !dl.loi && <p style={{ color: "#6b7280" }}>Chưa có cụm nào đạt ngưỡng.</p>}

			{cum.length > 0 && (
				<table style={{ borderCollapse: "collapse", width: "100%", maxWidth: 1100 }}>
					<thead>
						<tr>
							<th style={o}>Cụm ngữ nghĩa</th>
							<th style={o}>Tháp của mình</th>
							<th style={o}>Trang mình</th>
							<th style={o} />
						</tr>
					</thead>
					<tbody>
						{cum.map((c) => (
							<Fragment key={c.id}>
								<tr>
									<td style={o}>
										<div style={{ fontWeight: 600 }}>{c.ten}</div>
										<div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
											{c.soChuTri} chủ trị: {(c.chuTri ?? []).slice(0, 5).join(" · ")}
											{c.soChuTri > 5 && " …"}
										</div>
									</td>
									<td style={o}>
										{c.soBai} bài · {c.soVi} vị
										{/* Nhánh huyệt gộp bằng Set ở máy chủ. HIỆN LUÔN cả hai đầu của phép khớp
										    (chủ trị nào → phác đồ nào): cụm ngữ nghĩa gom tới 17 chủ trị, nên một chủ
										    trị lạc vào cụm là kéo trọn phác đồ của nó sang. Giấu vào tooltip thì con
										    số trông như sự thật và không ai lần ngược được. */}
										{c.soHuyet > 0 && (
											<>
												<div style={{ color: "#15803d", fontWeight: 600 }}>
													{c.soHuyet} huyệt{c.soKinh ? ` · ${c.soKinh} kinh` : ""}
												</div>
												<div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
													{(c.khopQua ?? []).slice(0, 2).map((k, i) => (
														<div key={i}>“{k.chuTri}” → {k.ten} ({k.soHuyet})</div>
													))}
													{(c.khopQua ?? []).length > 2 && <div>… +{c.khopQua.length - 2} phác đồ</div>}
												</div>
											</>
										)}
									</td>
									<td style={o}><SoTrangGsc c={c} coGsc={dl.coGsc} /></td>
									<td style={o}>
										<Nut onClick={() => batDauHoSo(c)} disabled={dangTai === c.id} dangChon={cumMo === c.id}>
											{dangTai === c.id ? "Đang dựng…" : cumMo === c.id ? "Đóng hồ sơ" : "Mở hồ sơ"}
										</Nut>
									</td>
								</tr>
								{cumMo === c.id && (
									<tr>
										<td colSpan={4} style={{ ...o, background: "#fafafa" }}>
											{hoSoLoi ? (
												<div style={{ color: "#b91c1c" }}>{hoSoLoi}</div>
											) : (
												<HoSoCum
													hoSo={hoSo}
													onGiao={() => giaoViec(c)}
													dangGiao={dangGiao}
													giaoKq={giaoKq}
													giaoLoi={giaoLoi}
													onSangTab={onSangTab}
													daCo={c.daCo}
													onViet={vietNgay}
													dangViet={dangViet}
													vietKq={vietKq}
												/>
											)}
										</td>
									</tr>
								)}
							</Fragment>
						))}
					</tbody>
				</table>
			)}
		</div>
	);
}

/**
 * Thứ tự VIỆC, không phải thứ tự vòng đời: trạng thái nào đang chờ NGƯỜI làm thì đứng trước.
 * Tab mở ở chip đầu tiên CÓ BÀI, nên việc gấp nhất là thứ hiện ra mặc định — không phải thứ
 * người dùng phải tự mò trong ô chọn (đo 02/10/2026: bộ lọc nằm trong <select> nên không ai thấy).
 */
const CHIP_KE_HOACH = [
	{ key: "can_xem", nhan: "Cần xem lại", mau: "#b91c1c", mo: "Máy viết hết lượt mà chưa đạt. Đọc lý do rồi duyệt lại hoặc bỏ." },
	{ key: "de_xuat", nhan: "Chờ duyệt", mau: "#92400e", mo: "Bài dự kiến chờ bạn đồng ý trước khi máy viết." },
	{ key: "da_duyet", nhan: "Chờ viết", mau: "#15803d", mo: "Đã duyệt. Bấm “Viết ngay”, hoặc để ca đêm 03:30 tự viết." },
	{ key: "dang_viet", nhan: "Đang viết", mau: "#6b7280", mo: "Lò viết đang giữ chỗ. Nếu kẹt (model hỏng giữa chừng) thì bấm “Thu hồi ngay” để viết lại." },
	{ key: "co_nhap", nhan: "Có nháp", mau: "#1d4ed8", mo: "Máy viết xong rồi. Bấm “Mở nháp để sửa & đăng” — trình soạn của CMS mở ra, sửa xong bấm Publish ở đó." },
	{ key: "da_dang", nhan: "Đã đăng", mau: "#6b7280", mo: "Xong." },
	{ key: "bo_qua", nhan: "Đã bỏ", mau: "#9ca3af", mo: "" },
];

function TheTrangThai({ tt }) {
	const c = CHIP_KE_HOACH.find((x) => x.key === tt);
	return (
		<span style={{ fontSize: 12, fontWeight: 600, color: c?.mau ?? "#6b7280", border: `1px solid ${c?.mau ?? "#d1d5db"}`, borderRadius: 999, padding: "2px 8px", whiteSpace: "nowrap" }}>
			{NHAN_KE_HOACH[tt] ?? tt}
		</span>
	);
}

function KeHoachRow({ k, tenCum, onDuyet, onBo, onViet, dangViet, vietKq, onThuHoi }) {
	const [moRong, setMoRong] = useState(false);
	const bc = k.bangChung ?? {};
	const suaDuoc = KE_HOACH_SUA_DUOC.has(k.trangThai);
	return (
		<>
			<tr>
				{/* Cột 1 gánh phần nhận dạng: tiêu đề là thứ người đọc tìm, không phải danh sách từ khoá. */}
				<td style={o}>
					<div style={{ fontWeight: 600 }}>{k.tieuDeLamViec}</div>
					<div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
						{(tenCum ?? k.cumChuTri) && <>{tenCum ?? k.cumChuTri} · </>}
						{k.tuKhoaChinh}
						{k.nguonGoc === "khoang_trong" && <> · từ Khoảng trống</>}
					</div>
					<Nut onClick={() => setMoRong(!moRong)} style={{ marginTop: 6, fontSize: 12, padding: "2px 8px" }}>
						{moRong ? "▾ Thu gọn" : "▸ Chi tiết"}
					</Nut>
				</td>
				<td style={o}>
					<TheTrangThai tt={k.trangThai} />
					{k.trangThai === "bo_qua" && k.lyDoBo ? <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{k.lyDoBo}</div> : null}
					{k.trangThai === "can_xem" && (
						// loiCuoi là lời máy chủ trả cho lượt nộp cuối — chữ thô, chỉ hiển thị qua JSX text.
						<div style={{ fontSize: 12, color: "#92400e", marginTop: 4 }}>
							{k.lyDoCanXem && <div>{k.lyDoCanXem}</div>}
							{(k.loiCuoi ?? []).length > 0 && (
								<ul style={{ margin: "4px 0 0", paddingLeft: 16 }}>
									{k.loiCuoi.map((l, i) => (
										<li key={i}>{l}</li>
									))}
								</ul>
							)}
						</div>
					)}
				</td>
				{/* Cột "Việc tiếp theo": MỘT nút chính cho mỗi trạng thái. Trước đây nút Duyệt, ô lý do
				    và nút Bỏ nằm chen nhau nên không rõ việc nào mới là việc nên làm. */}
				<td style={o}>
					{suaDuoc ? (
						<div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
							{k.trangThai !== "da_duyet" && (
								<NutBan chinh onBam={() => onDuyet(k.id)} chuBan="Đang duyệt…">{k.trangThai === "can_xem" ? "Duyệt lại" : "Duyệt"}</NutBan>
							)}
							{k.trangThai === "da_duyet" && (
								<Nut chinh onClick={() => onViet?.(k.id)} disabled={!!dangViet}>
									{dangViet === k.id ? "Đang viết…" : "Viết ngay"}
								</Nut>
							)}
							{k.trangThai !== "bo_qua" && (
								// MỘT nút, bấm là bỏ. Bắt gõ lý do là một bước thừa cho việc hay làm nhất ở
								// bảng này; máy chủ vẫn đòi lý do nên gửi kèm câu mặc định, và nó hiện lại ở
								// cột Trạng thái. Muốn ghi lý do riêng thì sửa sau trong chi tiết.
								<NutBan onBam={() => onBo(k.id, "Người quản trị bỏ")} chuBan="Đang bỏ…" style={{ fontSize: 12, padding: "3px 8px" }}>Bỏ</NutBan>
							)}
							{vietKq?.id === k.id && (
								<div style={{ flexBasis: "100%", fontSize: 13, color: vietKq.daBatDau ? "#1d4ed8" : "#92400e" }}>
									{vietKq.daBatDau
										? `Lò viết đang viết bằng ${vietKq.model} — bài đạt sẽ thành nháp ở tab Nháp (40–90 giây).`
										: `Lò viết không nhận bài: ${vietKq.ghiChu}`}
								</div>
							)}
						</div>
					) : k.trangThai === "dang_viet" ? (
						// Trạng thái trung gian VẪN phải chỉ đường: "—" làm người dùng tưởng bài chết ở đây.
						<div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
							{/* KHÔNG có phần trăm: model viết một lượt rồi trả cả bài, không báo tiến độ từng
							    phần. Thứ đo được là ĐÃ GIỮ BAO LÂU và ĐANG Ở LƯỢT NỘP THỨ MẤY — nói đúng
							    cái mình biết, không vẽ thanh tiến trình giả. */}
							<span style={{ fontSize: 12, color: "#6b7280" }}>
								{k.giuLuc ? `Bắt đầu ${lucTruoc(k.giuLuc)}` : "Lò viết đang giữ"}
								{(k.soLanNop ?? 0) > 0 && ` · lượt nộp ${k.soLanNop}/3`}
								{" · "}một bài mất 40–90 giây
							</span>
							<NutBan onBam={() => onThuHoi?.(k.id)} chuBan="Đang thu hồi…" style={{ fontSize: 12, padding: "3px 8px" }}>Thu hồi ngay</NutBan>
						</div>
					) : k.trangThai === "co_nhap" && k.contentId ? (
						<div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
							<a
								href={`/_emdash/admin/content/bai_viet/${k.contentId}`}
								style={{ fontSize: 13, fontWeight: 600 }}
							>
								Mở nháp để sửa &amp; đăng →
							</a>
							<span style={{ fontSize: 12, color: "#6b7280" }}>Sửa trong trình soạn rồi bấm Publish ở đó.</span>
						</div>
					) : k.trangThai === "da_dang" && k.slug ? (
						<a href={`${TRANG_GOC}/blog/${k.slug}/`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13 }}>
							Xem bài đã đăng →
						</a>
					) : (
						<span style={{ color: "#9ca3af" }}>—</span>
					)}
				</td>
			</tr>
			{moRong && (
				<tr>
					<td colSpan={3} style={{ ...o, background: "#fafafa", fontSize: 13 }}>
						<div><b>Ý định:</b> {NHAN_Y_DINH[k.yDinh] ?? k.yDinh}</div>
						{(k.tuKhoaPhu ?? []).length > 0 && <div><b>Từ khoá phụ:</b> {k.tuKhoaPhu.join(", ")}</div>}
						<div>
							<b>Trụ cột:</b>{" "}
							<a href={`${TRANG_GOC}${k.trangTruCot}`} target="_blank" rel="noopener noreferrer">{k.trangTruCot}</a>
						</div>
						<div>
							<b>Link đích ({(k.lienKetDich ?? []).length}):</b>{" "}
							<DanhSachLink ds={k.lienKetDich} toiDa={12} hienThi={(d) => ({ href: `${TRANG_GOC}${d}`, nhan: d })} />
						</div>
						<div>
							<b>Bằng chứng:</b> {bc.soDoiThu ?? 0} đối thủ / {bc.soBai ?? 0} bài{bc.trungXuHuong && " 📈"}
						</div>
						{(bc.canhBaoTrung ?? []).length > 0 && (
							<ul style={{ margin: "4px 0 0", paddingLeft: 16, fontSize: 12, color: "#92400e" }}>
								{bc.canhBaoTrung.map((t, i) => (
									<li key={i}>
										{/* 3 chữ số, làm tròn XUỐNG ở máy chủ: 0,296 không được hiện thành "0.30" = ngưỡng trùng. */}
										⚠ gần giống: {t.tieuDe} (độ giống {Number(t.doGiong).toFixed(3)} — dưới ngưỡng trùng 0.30, vẫn nhận)
									</li>
								))}
							</ul>
						)}
						{(bc.baiDoiThu ?? []).length > 0 && (
							<div>
								<b>Bài đối thủ khớp hướng:</b>{" "}
								<DanhSachLink ds={bc.baiDoiThu} toiDa={5} hienThi={(b) => ({ href: b.url, nhan: b.chuDe || b.url })} />
							</div>
						)}
					</td>
				</tr>
			)}
		</>
	);
}

function KeHoachTab({ dl, loi, onDuyet, onBo, onViet, dangViet, vietKq, onThuHoi, onTai }) {
	// Lò viết chạy NỀN ở máy chủ: không có sự kiện đẩy về, nên trang phải tự hỏi lại. Thiếu cái
	// này thì người bấm "Viết ngay" nhìn mãi một màn hình "Đang viết" mà không biết đã xong chưa
	// (đo 02/10/2026). Chỉ hỏi khi CÒN bài đang viết, và dừng ngay khi hết — không hỏi vô cớ.
	const soDangViet = (dl?.keHoach ?? []).filter((k) => k.trangThai === "dang_viet").length;
	const [caViet, setCaViet] = useState(null);
	const taiCa = useCallback(() => goi("lo-viet-ca-gan-nhat").then((r) => setCaViet(r.ca), () => {}), []);
	// ⚠️ Phụ thuộc vào SỐ BÀI ĐANG VIẾT, không phải vào cả `dl`. Để `dl` ở đây thì mỗi lượt tải
	// lại (nhịp 10 giây) sinh một đối tượng mới → effect chạy lại → thêm một vòng mạng nữa cho
	// một con số không đổi.
	useEffect(() => {
		taiCa();
	}, [taiCa, soDangViet]);
	useEffect(() => {
		if (!soDangViet || !onTai) return;
		const h = setInterval(() => {
			onTai();
			taiCa();
		}, 10_000);
		return () => clearInterval(h);
	}, [soDangViet, onTai, taiCa]);
	const dem = {};
	for (const k of dl?.keHoach ?? []) dem[k.trangThai] = (dem[k.trangThai] ?? 0) + 1;
	// Mặc định = chip đầu tiên CÓ BÀI theo thứ tự việc. Người mở tab thấy ngay việc gấp nhất.
	const macDinh = CHIP_KE_HOACH.find((c) => dem[c.key])?.key ?? "tat_ca";
	const [loc, setLoc] = useState(null);
	if (!dl) return <ChuaCoDuLieu loi={loi} />;
	const chon = loc ?? macDinh;
	const cumById = new Map(dl.cum.map((c) => [c.id, c]));
	const items = dl.keHoach.filter((k) => chon === "tat_ca" || k.trangThai === chon);
	const moTa = CHIP_KE_HOACH.find((c) => c.key === chon)?.mo ?? "";
	return (
		<div>
			{loi && <p style={{ color: "#b91c1c" }}>{loi}</p>}
			<h2 style={{ marginBottom: 8 }}>Kế hoạch ({dl.keHoach.length})</h2>
			{/* Bộ lọc là CHIP CÓ SỐ, không phải <select>: trạng thái nào đang có việc phải thấy ngay
			    mà không cần mở ra xem. Chip rỗng vẫn hiện (mờ) để biết vòng đời có những chặng nào. */}
			<div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
				{CHIP_KE_HOACH.map((c) => {
					const n = dem[c.key] ?? 0;
					return (
						<Nut key={c.key} dangChon={chon === c.key} onClick={() => setLoc(c.key)} style={{ opacity: n ? 1 : 0.45 }}>
							<span style={{ color: n ? c.mau : undefined, fontWeight: 600 }}>{c.nhan}</span> ({n})
						</Nut>
					);
				})}
				<Nut dangChon={chon === "tat_ca"} onClick={() => setLoc("tat_ca")}>Tất cả ({dl.keHoach.length})</Nut>
			</div>
			{moTa && <p style={{ color: "#6b7280", fontSize: 13, margin: "0 0 4px" }}>{moTa}</p>}
			<p style={{ color: "#6b7280", fontSize: 12, margin: "0 0 8px", display: "flex", gap: 8, alignItems: "center" }}>
				{soDangViet > 0 && <span>⟳ Đang tự hỏi lại mỗi 10 giây vì còn {soDangViet} bài đang viết.</span>}
				<Nut onClick={onTai} style={{ fontSize: 12, padding: "2px 8px" }}>Tải lại</Nut>
			</p>
			{/* CHỈ báo thứ NGƯỜI phải xử: hết quota, thiếu cấu hình. Lỗi nội dung (model trả sai dạng,
			    phạm vi Y sỹ) là việc vòng sửa 3 lượt tự lo; trượt hẳn thì bài đã sang "Cần xem lại"
			    và có chip riêng — in thêm lời máy ở đây chỉ làm người đọc phải lọc nhiễu. */}
			{caViet?.daTao === 0 && cheoNguoi(caViet.ghiChu) && (
				<div style={{ border: "1px solid #fcd34d", background: "#fffbeb", borderRadius: 8, padding: "8px 12px", margin: "0 0 12px", fontSize: 13 }}>
					{cheoNguoi(caViet.ghiChu)}
				</div>
			)}
			{items.length === 0 ? (
				<p style={{ color: "#6b7280" }}>Không có bài dự kiến nào ở trạng thái này.</p>
			) : (
				<table style={{ borderCollapse: "collapse", width: "100%", maxWidth: 1000 }}>
					<thead>
						<tr>
							<th style={o}>Bài dự kiến</th>
							<th style={o}>Trạng thái</th>
							<th style={o}>Việc tiếp theo</th>
						</tr>
					</thead>
					<tbody>
						{items.map((k) => (
							<KeHoachRow
								key={k.id}
								k={k}
								tenCum={cumById.get(k.cumId)?.ten}
								onDuyet={onDuyet}
								onBo={onBo}
								onViet={onViet}
								dangViet={dangViet}
								vietKq={vietKq}
								onThuHoi={onThuHoi}
							/>
						))}
					</tbody>
				</table>
			)}
		</div>
	);
}

// ---- Tab "Leo top" (2D) ----
const NHAN_LEO_TOP = {
	cho_serp: "Chờ Gravity tìm top",
	cho_doc: "Chờ Gravity đọc trang",
	co_phieu: "Có phiếu — chờ sửa",
	da_sua: "Đã sửa — chờ đo lại",
	xong: "Xong",
	bo: "Bỏ dở",
};
/** Cùng giá trị với kho.MOC_DO_LAI / kho.NGAY_PHIEU_TINH_TRAN (admin.jsx chạy trong trình duyệt, không import kho). */
const MOC_DO_LAI = [14, 28];
const NGAY_PHIEU_TINH_TRAN = 30;
const NGAY_MS = 86_400_000;
/** "YYYY-MM-DD" theo giờ Việt Nam — khớp kho.ngayVN. */
const ngayVN = (ms = Date.now()) => new Date(ms + 7 * 3600 * 1000).toISOString().slice(0, 10);
const so = (x, n = 1) => (x == null || !Number.isFinite(Number(x)) ? "—" : Number(x).toFixed(n));
/**
 * Hiển thị/ngày của mốc ban đầu. Phiên tạo trước Task 6 chưa có trường này: chia cho số ngày
 * lịch của cửa sổ (28 ngày lùi + hôm nay = 29) — như kho.taoPhienLeoTop.
 */
const soNgayBanDau = (p) => (p.cuaSoBanDau?.soNgay > 28 ? p.cuaSoBanDau.soNgay : 29);
const hienThiNgayBanDau = (p) => p.hienThiNgay ?? (p.hienThi == null ? null : p.hienThi / soNgayBanDau(p));
const hienThiNgayDoLai = (x) => x.hienThiNgay ?? (x.cuaSoNgay ? x.hienThi / x.cuaSoNgay : null);
/** Nhãn cột trang trong bảng ý × trang. */
const nhanTrang = (t) => (t?.laMinh ? "Mình" : t?.thuTu ? `#${t.thuTu}` : "?");
const tenMienCua = (u) => {
	try {
		return new URL(u).hostname.replace(/^www\./, "");
	} catch {
		return u;
	}
};

function DsChu({ ds, trong = "—" }) {
	if (!ds || ds.length === 0) return <>{trong}</>;
	return (
		<ul style={{ margin: "2px 0", paddingLeft: 18 }}>
			{ds.map((x, i) => (
				<li key={i}>{x}</li>
			))}
		</ul>
	);
}

function PhienLeoTop({ p, onDaSua }) {
	const [ngay, setNgay] = useState(p.ngaySua ?? ngayVN());
	const bd = p.banDo;
	const ph = p.phieu;
	const serpTheoUrl = new Map((p.serp ?? []).map((t) => [t.url, t]));
	// Cột = các trang đã vào bản đồ (đo được + có báo cáo), theo thứ tự hạng; trang mình cuối.
	const cot = (bd?.soHo ?? []).map((h) => ({ url: h.url, t: serpTheoUrl.get(h.url) }));
	const hang = [
		...(bd?.yCotLoi ?? []).map((y) => ({ ten: y.ten, loai: `cốt lõi ${Math.round((y.tiLe ?? 0) * 100)}%`, co: new Set(y.trangCo) })),
		...(bd?.yThua ?? []).map((y) => ({ ten: y.ten, loai: `thừa ${Math.round((y.tiLe ?? 0) * 100)}%`, co: new Set(y.trangCo) })),
		...(ph?.khacBiet ?? []).map((ten) => ({ ten, loai: "khác biệt (chỉ mình có)", co: new Set(cot.filter((c) => c.t?.laMinh).map((c) => c.url)) })),
	];
	const nen = (c) => (c.t?.laMinh ? { background: "#fef3c7", fontWeight: 600 } : {});
	const suaDuoc = p.trangThai === "co_phieu" || p.trangThai === "da_sua";
	return (
		<div style={{ background: "#fafafa", padding: 12, border: "1px solid #e5e5e5" }}>
			{(p.serp ?? []).some((t) => t.trangThai === "loi") && (
				<p style={{ fontSize: 12, color: "#92400e" }}>
					Trang không đo được:{" "}
					{p.serp.filter((t) => t.trangThai === "loi").map((t) => `${nhanTrang(t)} ${tenMienCua(t.url)} (${t.loi})`).join(" · ")}
				</p>
			)}
			{!bd ? (
				<p>Chưa có bản đồ sơ hở — phiên đang ở bước "{NHAN_LEO_TOP[p.trangThai] ?? p.trangThai}".</p>
			) : (
				<>
					<h4>Bảng ý × trang</h4>
					<div style={{ overflowX: "auto" }}>
						<table style={{ borderCollapse: "collapse" }}>
							<thead>
								<tr>
									<th style={o}>Ý</th>
									<th style={o}>Loại</th>
									{cot.map((c) => (
										<th key={c.url} style={{ ...o, ...nen(c) }} title={c.url}>
											<a href={c.url} target="_blank" rel="noopener noreferrer">{nhanTrang(c.t)}</a>
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{hang.map((h, i) => (
									<tr key={i}>
										<td style={o}>{h.ten}</td>
										<td style={{ ...o, fontSize: 12, color: "#6b7280" }}>{h.loai}</td>
										{cot.map((c) => (
											<td key={c.url} style={{ ...o, textAlign: "center", ...nen(c) }}>{h.co.has(c.url) ? "✓" : "—"}</td>
										))}
									</tr>
								))}
							</tbody>
						</table>
					</div>
					{(bd.ghiChu ?? []).length > 0 && <DsChu ds={bd.ghiChu} />}

					<h4>Sơ hở từng trang</h4>
					<table style={{ borderCollapse: "collapse", width: "100%" }}>
						<thead>
							<tr><th style={o}>Trang</th><th style={o}>Thiếu ý cốt lõi</th><th style={o}>Trải nghiệm</th><th style={o}>Thiếu căn cứ</th></tr>
						</thead>
						<tbody>
							{(bd?.soHo ?? []).map((h, i) => {
								const t = serpTheoUrl.get(h.url);
								return (
									<tr key={i} style={t?.laMinh ? { background: "#fef3c7" } : undefined}>
										<td style={o}>
											{nhanTrang(t)}{" "}
											<a href={h.url} target="_blank" rel="noopener noreferrer">{tenMienCua(h.url)}</a>
										</td>
										<td style={o}><DsChu ds={h.thieuY} /></td>
										<td style={o}><DsChu ds={h.traiNghiem} /></td>
										<td style={o}><DsChu ds={h.thieuCanCu} /></td>
									</tr>
								);
							})}
						</tbody>
					</table>

					<h4>Dấu hiệu người thắng (top 3 đều có, hạng 4–10 phần lớn không)</h4>
					<DsChu ds={bd.dauHieuThang} trong="Chưa đủ trang top 3 và hạng 4–10 để so, hoặc không có đặc điểm nào tách được." />
				</>
			)}

			{ph && (
				<>
					<h4>Phiếu sửa trang của mình</h4>
					<ol style={{ paddingLeft: 20 }}>
						<li><b>Thêm ý cốt lõi còn thiếu:</b> <DsChu ds={ph.themY} trong="không thiếu ý nào" /></li>
						<li><b>Đưa câu trả lời lên đầu bài:</b> {ph.duaTraLoiLenDau ? "Có — top 3 trả lời thẳng ở đầu, trang mình trả lời muộn." : "Không cần."}</li>
						<li><b>Cắt đoạn rườm / ý thừa:</b> <DsChu ds={ph.cat} trong="không có" /></li>
						<li><b>Trải nghiệm đọc:</b> <DsChu ds={ph.traiNghiem} trong="không có sơ hở" /></li>
						<li><b>Tài sản riêng nên đưa vào:</b> <DsChu ds={ph.taiSanRieng} trong="không tìm thấy trong từ điển" /></li>
					</ol>
					<div><b>Ý khác biệt — giữ lại:</b> <DsChu ds={ph.khacBiet} trong="không có" /></div>
					<div><b>Căn cứ cần bổ sung:</b> <DsChu ds={ph.boSungCanCu} trong="không có" /></div>
					{(ph.ghiChu ?? []).length > 0 && (
						<div style={{ color: "#92400e" }}><b>Ghi chú phạm vi Y sỹ:</b> <DsChu ds={ph.ghiChu} /></div>
					)}
				</>
			)}

			{suaDuoc && (
				<p>
					Ngày sửa (giờ Việt Nam):{" "}
					<input type="date" value={ngay} max={ngayVN()} onChange={(e) => setNgay(e.target.value)} />{" "}
					<NutBan
						chinh={p.trangThai !== "da_sua"}
						chuBan="Đang ghi mốc…"
						onBam={() => {
							// Người bấm Cancel thì KHÔNG trả Promise — nút nhả ngay, không nhá "đang ghi
							// mốc…" cho một việc không xảy ra.
							if (p.trangThai === "da_sua" && (p.doLai ?? []).length > 0 && !window.confirm("Đổi ngày sửa sẽ xoá các lần đo lại đã có. Tiếp tục?")) return undefined;
							return onDaSua(p.id, ngay);
						}}
					>
						{p.trangThai === "da_sua" ? "Đổi ngày sửa" : "Đã sửa theo phiếu"}
					</NutBan>
					{p.trangThai === "da_sua" && <span style={{ fontSize: 12, color: "#92400e" }}> · đổi ngày sẽ xoá các lần đo lại đã có</span>}
				</p>
			)}

			{(p.trangThai === "da_sua" || p.trangThai === "xong") && (
				<>
					<h4>Đo lại hạng (sửa ngày {p.ngaySua})</h4>
					<table style={{ borderCollapse: "collapse" }}>
						<thead>
							<tr><th style={o}>Mốc</th><th style={o}>Ngày đo</th><th style={o}>Hạng: trước → sau</th><th style={o}>Hiển thị/ngày: trước → sau</th><th style={o}>Cửa sổ</th></tr>
						</thead>
						<tbody>
							{MOC_DO_LAI.map((m) => {
								const x = (p.doLai ?? []).find((d) => d.sauNgay === m);
								return (
									<tr key={m}>
										<td style={o}>+{m} ngày</td>
										{x ? (
											<>
												<td style={o}>{x.ngay}</td>
												<td style={o}>{so(p.viTriBanDau)} → {x.viTri == null ? "không có số liệu" : so(x.viTri)}</td>
												<td style={o}>{so(hienThiNgayBanDau(p), 2)} → {so(hienThiNgayDoLai(x), 2)}</td>
												<td style={{ ...o, fontSize: 12, color: "#6b7280" }}>
													{soNgayBanDau(p)} ngày → {x.cuaSoNgay ?? "?"} ngày
												</td>
											</>
										) : (
											<td style={{ ...o, color: "#6b7280" }} colSpan={4}>chưa tới hạn hoặc ca đêm chưa đo</td>
										)}
									</tr>
								);
							})}
						</tbody>
					</table>
					<p style={{ fontSize: 12, color: "#666" }}>
						Cửa sổ ban đầu và cửa sổ đo lại dài khác nhau, nên chỉ so hạng bình quân và hiển thị MỖI NGÀY — không so tổng hiển thị.
					</p>
					<p style={{ fontSize: 12, color: "#92400e" }}>
						Hiển thị/ngày tăng giảm còn do cả trang web lớn lên hay mùa vụ — đọc cùng hạng, đừng coi riêng số này là kết quả của bản sửa.
					</p>
				</>
			)}
		</div>
	);
}

/**
 * Vòng học (2D bước 7): loại sửa nào hay ĐI CÙNG việc lên hạng.
 * ⚠️ Giao diện BẮT BUỘC in ghi chú của máy chủ: đây là đồng xuất hiện trên cỡ mẫu nhỏ, không
 * phải nhân quả. Bỏ ghi chú đi là mời người đọc kết luận sai trên 1–2 phiên.
 */
function TongHopVongHoc({ th }) {
	const [mo, setMo] = useState(false);
	const co = (th.bang ?? []).length > 0;
	return (
		<div style={{ border: "1px solid #d4d4d8", padding: 8, marginBottom: 12 }}>
			<b>Loại sửa nào hay đi cùng việc lên hạng</b>{" "}
			<button type="button" onClick={() => setMo(!mo)} style={{ marginLeft: 6 }}>
				{mo ? "Thu lại" : `Xem (${th.soPhienDoDuoc ?? 0} phiên đã đo xong)`}
			</button>
			{mo && (
				<>
					{co ? (
						<table style={{ borderCollapse: "collapse", fontSize: 13, marginTop: 6, width: "100%" }}>
							<thead>
								<tr style={{ textAlign: "left", borderBottom: "1px solid #e4e4e7" }}>
									<th>Loại sửa</th><th>Phiên</th><th>Lên</th><th>Đứng yên</th><th>Tụt</th><th>Hạng đổi (trung vị)</th>
								</tr>
							</thead>
							<tbody>
								{th.bang.map((r) => (
									<tr key={r.ma} style={{ borderBottom: "1px solid #f4f4f5", opacity: r.duKetLuan ? 1 : 0.65 }}>
										<td>
											{r.ten}
											{!r.duKetLuan && <span style={{ color: "#92400e" }}> · quá ít phiên</span>}
										</td>
										<td>{r.soPhien}</td>
										<td style={{ color: "#166534" }}>{r.len}</td>
										<td>{r.yen}</td>
										<td style={{ color: "#b91c1c" }}>{r.tut}</td>
										<td>{r.doiTrungVi == null ? "—" : r.doiTrungVi > 0 ? `lên ${so(r.doiTrungVi, 2)}` : r.doiTrungVi < 0 ? `tụt ${so(-r.doiTrungVi, 2)}` : "0"}</td>
									</tr>
								))}
							</tbody>
						</table>
					) : null}
					{(th.ghiChu ?? []).map((g, i) => (
						<p key={i} style={{ margin: "6px 0 0", color: "#92400e", fontSize: 13 }}>{g}</p>
					))}
				</>
			)}
		</div>
	);
}

/**
 * Việc RẺ: trang người ta THẤY mà không bấm (CTR thấp hơn hẳn mức thường thấy Ở CÙNG HẠNG).
 * Tách khỏi ca soi SERP vì ca soi không chữa được lỗi tiêu đề — xem leo-top/ctr.mjs.
 * Nạp theo YÊU CẦU (mỗi lần bấm là một lượt gọi Search Console), không nạp cùng tab.
 */
function ViecTieuDe() {
	const [dl, setDl] = useState(null);
	const [dangTai, setDangTai] = useState(false);
	const [loi, setLoi] = useState("");
	const tai = () => {
		setDangTai(true);
		setLoi("");
		goi("leo-top-viec-tieu-de")
			.then((d) => setDl(d), (e) => setLoi(loiCua(e)))
			.finally(() => setDangTai(false));
	};
	const pt = (x) => (x == null ? "—" : `${(x * 100).toFixed(1)}%`);
	return (
		<div style={{ border: "1px solid #d4d4d8", padding: 8, marginBottom: 12 }}>
			<b>Sửa tiêu đề/mô tả — không cần soi SERP</b>{" "}
			<button type="button" onClick={tai} disabled={dangTai} style={{ marginLeft: 6 }}>
				{dangTai ? "Đang đọc Search Console…" : dl ? "Đọc lại" : "Xem danh sách"}
			</button>
			<p style={{ margin: "4px 0 0", color: "#52525b", fontSize: 13 }}>
				Trang có lượt hiển thị bình thường mà ít người bấm, so với mức thường thấy Ở CÙNG HẠNG của chính site này.
				CTR thô vô dụng vì hạng 1 luôn được nhấp nhiều hơn hạng 10 — ở đây đã trừ phần đó.
			</p>
			{loi && <p style={{ color: "#b91c1c" }}>{loi}</p>}
			{dl && (
				<>
					{dl.ghiChu && <p style={{ margin: "6px 0 0", color: "#92400e", fontSize: 13 }}>{dl.ghiChu}</p>}
					{dl.ds?.length ? (
						<table style={{ borderCollapse: "collapse", fontSize: 13, marginTop: 6, width: "100%" }}>
							<thead>
								<tr style={{ textAlign: "left", borderBottom: "1px solid #e4e4e7" }}>
									<th>Từ khoá</th><th>Trang</th><th>Hạng</th><th>Hiển thị</th><th>CTR</th><th>Mức thường</th><th>Ước mất</th>
								</tr>
							</thead>
							<tbody>
								{dl.ds.map((x) => (
									<tr key={`${x.tuKhoa}|${x.trang}`} style={{ borderBottom: "1px solid #f4f4f5" }}>
										<td>{x.tuKhoa}</td>
										<td style={{ maxWidth: 240, overflowWrap: "anywhere" }}>{x.trang}</td>
										<td>{so(x.viTri)}</td>
										<td>{x.hienThi}</td>
										<td style={{ color: "#b91c1c" }}>{pt(x.ctr)}</td>
										<td>{pt(x.ctrKyVong)}</td>
										<td><b>{x.nhapDangMat}</b> lượt</td>
									</tr>
								))}
							</tbody>
						</table>
					) : (
						<p style={{ margin: "6px 0 0", fontSize: 13 }}>Không có trang nào rơi vào loại này.</p>
					)}
				</>
			)}
		</div>
	);
}

/**
 * Hạng của bài mới đăng — nhãn cho mã `hang` do máy chủ tính (leo-top/bai-moi.mjs HANG_BAI).
 * Chép nhãn sang đây vì admin.jsx chạy trong trình duyệt, không import mã plugin (xem ghi chú
 * ở NGAY_PHIEU_TINH_TRAN). Phán định thì KHÔNG chép — nó ở máy chủ và có phép kiểm.
 */
const HANG_BAI_MOI = {
	tam_leo: { nhan: "Đúng tầm leo top", mau: "#15803d" },
	chua_hien: { nhan: "Chưa có hiển thị", mau: "#b91c1c" },
	ngoai_50: { nhan: "Ngoài top 50", mau: "#92400e" },
	dau_bang: { nhan: "Đầu bảng", mau: "#1d4ed8" },
	moi: { nhan: "Còn non", mau: "#6b7280" },
};

/**
 * Bài lò viết ĐÃ ĐĂNG, kèm số thật của Search Console — khâu nối Khoảng trống → Kế hoạch →
 * Nháp → Leo top. Mỗi dòng nói được: bài này ra từ cụm nào, đăng bao lâu, Google đã cho hạng
 * mấy, và còn việc gì.
 *
 * ⚠️ Cột "Việc" KHÔNG bao giờ nói bài còn non là bài kém — xem ghi chú ở leo-top/bai-moi.mjs.
 */
function BaiMoiDang({ ds, dem, ghiChu, onSangTab }) {
	const [moHet, setMoHet] = useState(false);
	// SOI INDEX: phân định "chưa index" (việc kỹ thuật) với "đã index mà không ai tìm" (việc nội
	// dung). Trước đó cột Việc chỉ dám nói "0 lượt hiển thị" rồi dừng — đúng nhưng không quyết
	// được gì. Đắt (7,5 s/trang) nên chỉ soi theo yêu cầu, và chỉ nhóm "chưa có hiển thị".
	const [soi, setSoi] = useState(null);
	const [dangSoi, setDangSoi] = useState(false);
	const canSoi = (ds ?? []).filter((x) => x.hang === "chua_hien").map((x) => x.duong);
	const soiIndex = () => {
		setDangSoi(true);
		goi("leo-top-soi-index", { duong: canSoi })
			.then(setSoi, (e) => setSoi({ ds: [], ghiChu: loiCua(e) }))
			.finally(() => setDangSoi(false));
	};
	const traSoi = new Map((soi?.ds ?? []).map((x) => [x.duong, x]));
	if (!ds?.length) return null;
	// Mặc định chỉ hiện phần có việc: còn non và đầu bảng thì không phải làm gì.
	const coViec = ds.filter((x) => x.hang !== "moi" && x.hang !== "dau_bang");
	const hien = moHet || !coViec.length ? ds : coViec;
	return (
		<div style={{ marginBottom: 16 }}>
			<h3 style={{ margin: "0 0 2px" }}>
				Bài đã đăng từ lò viết <span style={{ color: "#666", fontWeight: 400 }}>({ds.length})</span>
			</h3>
			<div style={{ color: "#666", fontSize: 13, marginBottom: 6 }}>
				Vòng khép lại: khoảng trống → kế hoạch → nháp → đăng → hạng thật. Số lấy từ Search Console 28 ngày gần nhất.
			</div>
			{ghiChu && <div style={{ color: "#92400e", fontSize: 13, marginBottom: 6 }}>{ghiChu}</div>}
			<div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
				{Object.entries(HANG_BAI_MOI).map(([k, v]) =>
					dem?.[k] ? (
						<span key={k} style={{ fontSize: 12, border: `1px solid ${v.mau}`, color: v.mau, borderRadius: 999, padding: "1px 8px" }}>
							{v.nhan}: <b>{dem[k]}</b>
						</span>
					) : null,
				)}
				{hien.length < ds.length && (
					<Nut onClick={() => setMoHet(true)} style={{ fontSize: 12, padding: "2px 8px" }}>Hiện cả {ds.length} bài</Nut>
				)}
				{moHet && coViec.length > 0 && (
					<Nut onClick={() => setMoHet(false)} style={{ fontSize: 12, padding: "2px 8px" }}>Chỉ bài có việc</Nut>
				)}
				{canSoi.length > 0 && (
					<Nut chinh disabled={dangSoi} onClick={soiIndex} style={{ fontSize: 12, padding: "2px 8px" }}>
						{dangSoi ? `Đang hỏi Google… (~${Math.ceil(canSoi.length * 8)}s)` : `Kiểm index ${Math.min(canSoi.length, 8)} bài`}
					</Nut>
				)}
			</div>
			{soi?.ghiChu && <div style={{ color: "#92400e", fontSize: 12, marginBottom: 6 }}>{soi.ghiChu}</div>}
			{(soi?.loi ?? []).length > 0 && <div style={{ color: "#b91c1c", fontSize: 12, marginBottom: 6 }}>{soi.loi.join(" · ")}</div>}
			<table style={{ borderCollapse: "collapse", width: "100%" }}>
				<thead>
					<tr>
						<th style={o}>Bài</th><th style={o}>Từ cụm</th><th style={o}>Đăng</th><th style={o}>Hiển thị</th><th style={o}>Nhấp</th><th style={o}>Hạng</th><th style={o}>Việc</th>
					</tr>
				</thead>
				<tbody>
					{hien.map((x) => {
						const h = HANG_BAI_MOI[x.hang] ?? { nhan: x.hang, mau: "#6b7280" };
						return (
							<tr key={x.keHoachId}>
								<td style={o}>
									<a href={`${TRANG_GOC}${x.duong}`} target="_blank" rel="noopener noreferrer">{x.tieuDe}</a>
								</td>
								<td style={o}>{x.cum || "—"}</td>
								<td style={o}>{x.tuoi == null ? "—" : `${x.tuoi} ngày`}</td>
								<td style={o}>{x.so ? x.so.hienThi.toLocaleString("vi-VN") : "—"}</td>
								<td style={o}>{x.so ? x.so.nhap.toLocaleString("vi-VN") : "—"}</td>
								<td style={o}>{x.so ? so(x.so.viTri) : "—"}</td>
								<td style={o}>
									<span style={{ color: h.mau, fontWeight: 600 }}>{h.nhan}</span>
									{x.hang === "chua_hien" &&
										(traSoi.has(x.duong) ? (
											// Có câu trả lời thật thì nói thẳng VIỆC NÀO, không khuyên chung chung nữa.
											(() => {
												const k = traSoi.get(x.duong);
												const daIndex = k.ketLuan === "PASS";
												return (
													<div style={{ fontSize: 12, color: daIndex ? "#92400e" : "#b91c1c" }}>
														{daIndex ? "Đã index" : "CHƯA index"} — {k.trangThai || k.ketLuan || "không rõ"}
														{k.robots && k.robots !== "ALLOWED" && <> · robots: {k.robots}</>}
														{k.lanCrawlCuoi && <div style={{ color: "#9ca3af" }}>Google ghé lần cuối {gio(k.lanCrawlCuoi)}</div>}
														{k.canonicalGoogle && k.canonicalMinh && k.canonicalGoogle !== k.canonicalMinh && (
															<div style={{ color: "#b91c1c" }}>⚠ Google chọn canonical khác: {k.canonicalGoogle}</div>
														)}
														<div style={{ color: "#6b7280" }}>
															{daIndex ? "Đã vào chỉ mục mà không ai tìm tới — việc của NỘI DUNG." : "Chưa vào chỉ mục — việc KỸ THUẬT, không phải viết lại."}
														</div>
													</div>
												);
											})()
										) : (
											<div style={{ fontSize: 12, color: "#6b7280" }}>Chưa biết đã index hay chưa — bấm “Kiểm index” ở trên.</div>
										))}
									{x.hang === "ngoai_50" && (
										<div style={{ fontSize: 12, color: "#6b7280" }}>
											Việc của nội dung, chưa phải việc leo top.{" "}
											<Nut onClick={() => onSangTab?.("khoang-trong")} style={{ fontSize: 11, padding: "1px 6px" }}>Mở Khoảng trống</Nut>
										</div>
									)}
									{x.hang === "tam_leo" && <div style={{ fontSize: 12, color: "#6b7280" }}>Ca đêm thứ Tư sẽ nhận từ khoá của trang này.</div>}
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}

/**
 * HÀNG ĐỢI leo top — từ khoá hạng 4–50 của chính site mình, xếp theo ưu tiên. Đúng danh sách ca
 * đêm thứ Tư sẽ lấy 5 mục đầu.
 *
 * Trước 03/10/2026 danh sách này chỉ tồn tại BÊN TRONG ca đêm: muốn biết tuần này sẽ soi từ khoá
 * nào, hay còn bao nhiêu từ khoá đang chờ, thì phải đợi tới thứ Tư rồi đọc nhật ký. Có số liệu
 * Search Console mà không ai nhìn thấy thì không theo dõi được, cũng không leo được.
 *
 * Nạp theo YÊU CẦU: truy vấn quét tới 100.000 hàng GSC (máy chủ đệm 30 phút).
 */
function HangDoiLeoTop() {
	const [dl, setDl] = useState(null);
	const [dangTai, setDangTai] = useState(false);
	const [loi, setLoi] = useState("");
	const tai = () => {
		setDangTai(true);
		setLoi("");
		goi("leo-top-ung-vien")
			.then(setDl, (e) => setLoi(loiCua(e)))
			.finally(() => setDangTai(false));
	};
	const nhan = { tieu_de: "sửa tiêu đề", noi_dung: "soi SERP", chua_ro: "chưa rõ" };
	return (
		<div style={{ border: "1px solid #d4d4d8", padding: 8, marginBottom: 12 }}>
			<b>Hàng đợi leo top — từ khoá hạng 4–50 của mình</b>{" "}
			<Nut onClick={tai} disabled={dangTai} style={{ marginLeft: 6 }}>
				{dangTai ? "Đang đọc Search Console…" : dl ? "Đọc lại" : "Xem hàng đợi"}
			</Nut>
			<p style={{ margin: "4px 0 0", color: "#52525b", fontSize: 13 }}>
				Ca đêm thứ Tư lấy 5 mục đầu danh sách này. Cột <b>Loại việc</b> nói chữa bằng cách nào: “sửa tiêu đề”
				là thấy mà không bấm (không cần soi SERP), “soi SERP” là bấm bình thường mà hạng không lên.
			</p>
			{loi && <p style={{ color: "#b91c1c" }}>{loi}</p>}
			{dl && (
				<>
					{dl.ghiChu && <p style={{ margin: "6px 0 0", color: "#92400e", fontSize: 13 }}>{dl.ghiChu}</p>}
					{dl.soDangTheoDoi > 0 && (
						<p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 12 }}>
							{dl.soDangTheoDoi} cặp đã có phiên nên không nằm trong hàng đợi.
						</p>
					)}
					{dl.ds?.length ? (
						<table style={{ borderCollapse: "collapse", fontSize: 13, marginTop: 6, width: "100%" }}>
							<thead>
								<tr style={{ textAlign: "left", borderBottom: "1px solid #e4e4e7" }}>
									<th>Từ khoá</th><th>Trang</th><th>Hạng</th><th>Hiển thị</th><th>Nhấp</th><th>Loại việc</th><th>Ưu tiên</th>
								</tr>
							</thead>
							<tbody>
								{dl.ds.map((x, i) => (
									// tuKhoa là chữ người lạ gõ vào Google — chỉ hiển thị qua JSX text.
									<tr key={`${x.tuKhoa}|${x.trang}`} style={{ borderBottom: "1px solid #f4f4f5", background: i < 5 ? "#f0fdf4" : undefined }}>
										<td>{x.tuKhoa}</td>
										<td style={{ maxWidth: 240, overflowWrap: "anywhere" }}>{x.trang}</td>
										<td>{so(x.viTri)}</td>
										<td>{x.hienThi}</td>
										<td>{x.nhap}</td>
										<td>{nhan[x.loaiViec] ?? x.loaiViec}</td>
										<td>{x.uuTien == null ? "—" : Math.round(x.uuTien)}</td>
									</tr>
								))}
							</tbody>
						</table>
					) : (
						<p style={{ margin: "6px 0 0", fontSize: 13 }}>Không có từ khoá nào ở hạng 4–50 đủ lượt hiển thị.</p>
					)}
					{dl.ds?.length > 0 && <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 12 }}>5 dòng tô xanh là phần ca đêm sẽ nhận.</p>}
				</>
			)}
		</div>
	);
}

/**
 * PHIẾU SỬA NHỎ — việc rẻ nhất trong cả hệ thống, và là trục ngược chiều với "viết bài mới".
 *
 * Người ta hỏi gì mà trang mình CÓ câu trả lời nhưng máy không nhặt ra được. Đo thật trên
 * `/huyet/phuc-tho/`: 51/97 lượt hiển thị chờ một dòng FAQ hoặc một tiêu đề mục — không có
 * việc viết lại nào. Phiếu xếp RẺ TRƯỚC: phiếu nói "viết lại bài" thì người ta để đó.
 */
function SuaNho({ nhanViec }) {
	const [dl, setDl] = useState(null);
	const [dangTai, setDangTai] = useState(false);
	const [loi, setLoi] = useState("");
	const [mo, setMo] = useState(null);
	// Theo dõi: chụp số TRƯỚC khi sửa, rồi so với số bây giờ. Không có mốc trước thì câu "sửa
	// xong có lên hạng không" vĩnh viễn không trả lời được.
	const [theoDoi, setTheoDoi] = useState(null);
	const [dangDanh, setDangDanh] = useState(null);
	const taiTheoDoi = () => goi("leo-top-sua-nho-theo-doi").then(setTheoDoi, () => {});
	const danhDau = (duong) => {
		setDangDanh(duong);
		goi("leo-top-sua-nho-danh-dau", { duong })
			.then(taiTheoDoi, (e) => setLoi(loiCua(e)))
			.finally(() => setDangDanh(null));
	};
	useEffect(() => {
		taiTheoDoi();
	}, []);
	const daDanh = new Set((theoDoi?.ds ?? []).map((x) => x.duong));
	const tai = () => {
		setDangTai(true);
		setLoi("");
		goi("leo-top-sua-nho")
			.then(setDl, (e) => setLoi(loiCua(e)))
			.finally(() => setDangTai(false));
	};
		const mau = { them_faq: "#15803d", them_tieu_de: "#92400e", thieu_noi_dung: "#b91c1c" };
	/** Trang trong phiếu là URL đầy đủ; sổ theo dõi khoá theo ĐƯỜNG DẪN. */
	const duongCua = (u) => String(u ?? "").replace(/^https?:\/\/[^/]+/, "");
	return (
		<div style={{ border: "1px solid #86efac", background: "#f0fdf4", padding: 8, marginBottom: 12 }}>
			<b>Sửa nhỏ để máy nhặt được câu trả lời</b>{" "}
			<Nut onClick={tai} disabled={dangTai} style={{ marginLeft: 6 }}>
				{dangTai ? "Đang soi trang…" : dl ? "Soi lại" : "Soi trang của mình"}
			</Nut>
			<p style={{ margin: "4px 0 0", color: "#52525b", fontSize: 13 }}>
				Trang mình ĐÃ trả lời nhưng không trùng chữ người ta gõ, nên máy không nhặt ra. Phần lớn chỉ cần thêm một dòng FAQ
				hoặc một tiêu đề mục — rẻ hơn viết bài mới một bậc.
			</p>
			{loi && <p style={{ color: "#b91c1c" }}>{loi}</p>}
			{dl && (
				<>
					{dl.ghiChu && <p style={{ margin: "6px 0 0", color: "#92400e", fontSize: 13 }}>{dl.ghiChu}</p>}
					{(dl.loi ?? []).length > 0 && <p style={{ margin: "4px 0 0", color: "#b91c1c", fontSize: 12 }}>{dl.loi.join(" · ")}</p>}
					{dl.ds?.length ? (
						<table style={{ borderCollapse: "collapse", fontSize: 13, marginTop: 6, width: "100%" }}>
							<thead>
								<tr style={{ textAlign: "left", borderBottom: "1px solid #e4e4e7" }}>
									<th>Trang</th><th>Hiển thị đang chờ</th><th>FAQ hiện có</th><th>Việc</th><th />
								</tr>
							</thead>
							<tbody>
								{dl.ds.map((p) => (
									<Fragment key={p.trang}>
										<tr style={{ borderBottom: "1px solid #f4f4f5" }}>
											<td style={{ maxWidth: 260, overflowWrap: "anywhere" }}>
												<a href={p.trang} target="_blank" rel="noopener noreferrer">{p.trang.replace(/^https?:\/\/[^/]+/, "")}</a>
											</td>
											<td><b>{p.hienThiChoSua}</b></td>
											<td>{p.coFaq ? `${p.soCauHoiFaq} câu` : <span style={{ color: "#b91c1c" }}>chưa có</span>}</td>
											<td>{p.dong.length} việc</td>
											<td style={{ whiteSpace: "nowrap" }}>
												<Nut onClick={() => setMo(mo === p.trang ? null : p.trang)} style={{ fontSize: 12, padding: "2px 8px" }}>
													{mo === p.trang ? "Thu" : "Xem"}
												</Nut>{" "}
												{daDanh.has(duongCua(p.trang)) ? (
													<span style={{ fontSize: 12, color: "#15803d" }}>đang theo dõi</span>
												) : (
													<Nut
														chinh
														disabled={dangDanh === duongCua(p.trang)}
														onClick={() => danhDau(duongCua(p.trang))}
														style={{ fontSize: 12, padding: "2px 8px" }}
														title="Chụp số hiện tại để sau so được"
													>
														{dangDanh === duongCua(p.trang) ? "…" : "Theo dõi"}
													</Nut>
												)}
											</td>
										</tr>
										{mo === p.trang && (
											<tr>
												<td colSpan={5} style={{ background: "#fff", padding: 8 }}>
													{p.dong.map((d, i) => (
														// tuKhoa là chữ người lạ gõ vào Google — chỉ hiển thị qua JSX text.
														<div key={i} style={{ marginBottom: 4 }}>
															<span style={{ color: mau[d.viec] ?? "#374151", fontWeight: 600 }}>
																{nhanViec?.[d.viec]?.nhan ?? d.viec}
															</span>{" "}
															<span style={{ color: "#6b7280" }}>{d.hienThi} hiển thị</span> — “{d.tuKhoa}”
															<div style={{ fontSize: 12, color: "#6b7280" }}>{nhanViec?.[d.viec]?.mo}</div>
														</div>
													))}
												</td>
											</tr>
										)}
									</Fragment>
								))}
							</tbody>
						</table>
					) : (
						<p style={{ margin: "6px 0 0", fontSize: 13 }}>Đã soi {dl.soTrangSoi ?? 0} trang — không trang nào còn việc sửa nhỏ.</p>
					)}
				</>
			)}

			{/* Vì sao KHÔNG có nút "sửa ngay": với `them_faq`/`them_tieu_de` thì bản vá ĐÃ tự
			    chạy ở khâu build. Nút "Theo dõi" ghi MỐC để sau còn so — thứ duy nhất không tự
			    có được, vì sau khi sửa thì số cũ đã mất. */}
			<div style={{ ...KHUNG_O, background: "#fff", marginTop: 10, fontSize: 13 }}>
				<b>Việc “thêm dòng FAQ” TỰ SỬA ở lần build tới.</b> Vòng <code>cau-hoi-gsc</code> → <code>faq-that</code> kéo đúng
				câu người ta gõ vào FAQ của trang, ghép với mục nội dung đã có — không ai phải sửa tay, không câu trả lời nào
				được sinh mới. Bấm <b>Theo dõi</b> để chụp số hiện tại, rồi quay lại sau 14 ngày xem có lên hạng không.
			</div>

			{theoDoi?.ds?.length > 0 && (
				<div style={{ marginTop: 10 }}>
					<b style={{ fontSize: 13 }}>Đang theo dõi ({theoDoi.ds.length})</b>
					<table style={{ borderCollapse: "collapse", fontSize: 13, marginTop: 4, width: "100%" }}>
						<thead>
							<tr style={{ textAlign: "left", borderBottom: "1px solid #e4e4e7" }}>
								<th>Trang</th><th>Đánh dấu</th><th>Hạng trước → nay</th><th>Hiển thị trước → nay</th><th>Kết luận</th>
							</tr>
						</thead>
						<tbody>
							{theoDoi.ds.map((x) => {
								const t = x.truoc, b = x.bayGio;
								const doi = t && b ? t.viTri - b.viTri : null; // dương = LÊN hạng (số nhỏ hơn)
								return (
									<tr key={x.duong} style={{ borderBottom: "1px solid #f4f4f5" }}>
										<td style={{ maxWidth: 260, overflowWrap: "anywhere" }}>{x.duong}</td>
										<td>{x.tuoi} ngày trước</td>
										<td>{t ? so(t.viTri) : "—"} → {b ? so(b.viTri) : "—"}</td>
										<td>{t ? t.hienThi : "—"} → {b ? b.hienThi : "—"}</td>
										<td>
											{!x.duKetLuan ? (
												// Cùng lý lẽ với bài còn non: vu oan ở đây là kết luận một bản sửa
												// vô dụng khi nó chưa kịp có tác dụng.
												<span style={{ color: "#6b7280" }}>chưa đủ 14 ngày</span>
											) : doi == null ? (
												<span style={{ color: "#6b7280" }}>thiếu số liệu</span>
											) : doi > 0.3 ? (
												<span style={{ color: "#15803d", fontWeight: 600 }}>lên {so(doi)} bậc</span>
											) : doi < -0.3 ? (
												<span style={{ color: "#b91c1c" }}>tụt {so(-doi)} bậc</span>
											) : (
												<span style={{ color: "#6b7280" }}>gần như không đổi</span>
											)}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
					<p style={{ fontSize: 12, color: "#9ca3af", margin: "4px 0 0" }}>
						⚠️ Đây là ĐỒNG XUẤT HIỆN, không phải nhân quả — cùng lúc đó Google cũng đổi thuật toán và đối thủ cũng sửa bài.
					</p>
				</div>
			)}
		</div>
	);
}

function LeoTopTab({ dl, loi, onDaSua, onTai, onSangTab }) {
	const [mo, setMo] = useState(null);
	if (!dl) return <ChuaCoDuLieu loi={loi} />;
	const phien = dl.phien ?? [];
	const now = Date.now();
	const choSua = phien
		.filter((p) => p.trangThai === "co_phieu")
		.map((p) => {
			const t = Date.parse(p.soHoLuc ?? p.taoLuc);
			return { p, tuoi: Number.isFinite(t) ? Math.floor((now - t) / NGAY_MS) : null };
		});
	const demTT = {};
	for (const p of phien) demTT[p.trangThai] = (demTT[p.trangThai] ?? 0) + 1;
	const dangSoi = (demTT.cho_serp ?? 0) + (demTT.cho_doc ?? 0);
	const baiMoi = dl.baiMoi ?? [];
	return (
		<div>
			{loi && <p style={{ color: "#b91c1c" }}>{loi}</p>}
			{!dl.gscCoCauHinh && (
				<p style={{ color: "#92400e" }}>
					Plugin chưa cấu hình Search Console (biến GSC_OAUTH_* trong cms/.env): không lấy được từ khoá mới, không đo lại hạng, và không biết bài mới đăng đang ở đâu.
				</p>
			)}

			<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8, margin: "0 0 14px", maxWidth: 900 }}>
				<ODo so={choSua.length} nhan="phiếu chờ bấm đã sửa" mau={choSua.length ? "#92400e" : undefined} />
				<ODo so={dangSoi} nhan="phiên đang soi" />
				<ODo so={demTT.da_do_lai ?? 0} nhan="phiên đã đo lại" mau="#15803d" />
				<ODo so={baiMoi.length} nhan="bài lò viết đã đăng" />
				<ODo so={dl.demBaiMoi?.tam_leo ?? 0} nhan="bài đúng tầm leo top" mau="#15803d" />
				<ODo so={dl.demBaiMoi?.chua_hien ?? 0} nhan="bài chưa có hiển thị" mau={dl.demBaiMoi?.chua_hien ? "#b91c1c" : undefined} />
			</div>

			{choSua.length > 0 && (
				<div style={{ border: "1px solid #f59e0b", background: "#fffbeb", padding: 8, marginBottom: 12 }}>
					<b>{choSua.length} phiếu chờ bấm "Đã sửa theo phiếu":</b>
					<ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
						{choSua.map(({ p, tuoi }) => (
							<li key={p.id}>
								{p.tuKhoa} — ra phiếu {tuoi == null ? "?" : `${tuoi} ngày trước`}
								{tuoi != null && tuoi >= NGAY_PHIEU_TINH_TRAN && " (quá 30 ngày: không còn giữ chỗ trong trần 10 phiên mở, vẫn bấm đã sửa được)"}
							</li>
						))}
					</ul>
				</div>
			)}

			{/* CẦU TOÀN SITE. Đây là câu trả lời cho "viết gì cho thu hút": không đoán, mà đọc từ
			    chính truy vấn người ta đã gõ. Đo 03/10/2026: 70% tra tên, 25% hỏi vị trí. */}
			{dl.cauToanSite?.soTuKhoa > 0 && (
				<div style={{ border: "1px solid #93c5fd", background: "#eff6ff", padding: 8, marginBottom: 12 }}>
					<b>Người ta hỏi gì khi tới site này (28 ngày)</b>
					<KhoiCau cau={dl.cauToanSite} />
					<div style={{ fontSize: 12, color: "#1e40af", marginTop: 4 }}>
						Dạng hỏi đông nhất: <b>{dl.cauToanSite.yDinh[0]?.nhan}</b>
						{dl.cauToanSite.yDinh[1] && <> rồi tới <b>{dl.cauToanSite.yDinh[1].nhan}</b></>}. Trang nào cũng phải đáp đúng hai
						dạng đó ngay phần đầu; viết thêm phần không ai hỏi thì không kéo được lượt nhấp nào.
					</div>
				</div>
			)}

			{dl.gscCoCauHinh && <SuaNho nhanViec={dl.nhanViec} />}
			<BaiMoiDang ds={baiMoi} dem={dl.demBaiMoi} ghiChu={dl.baiMoiGhiChu} onSangTab={onSangTab} />
			{dl.gscCoCauHinh && <HangDoiLeoTop />}
			{dl.gscCoCauHinh && <ViecTieuDe />}
			{dl.tongHop && <TongHopVongHoc th={dl.tongHop} />}

			<h3 style={{ margin: "0 0 6px" }}>
				Phiên leo top ({phien.length}) <Nut onClick={onTai}>Tải lại</Nut>
			</h3>
			<table style={{ borderCollapse: "collapse", width: "100%" }}>
				<thead>
					<tr><th style={o}>Từ khoá</th><th style={o}>Trang của mình</th><th style={o}>Hạng ban đầu</th><th style={o}>Hiển thị/ngày</th><th style={o}>Trạng thái</th><th style={o}>Tạo lúc</th></tr>
				</thead>
				<tbody>
					{phien.map((p) => (
						<Fragment key={p.id}>
							<tr style={{ opacity: p.trangThai === "bo" ? 0.5 : 1 }}>
								<td style={o}>
									{/* tuKhoa là chữ người lạ gõ vào Google — chỉ hiển thị qua JSX text. */}
									<Nut onClick={() => setMo(mo === p.id ? null : p.id)}>{mo === p.id ? "▾" : "▸"} {p.tuKhoa}</Nut>
									{/* tuCum do máy chủ gắn: trang này là bài lò viết viết từ cụm đó. */}
									{p.tuCum && <div style={{ fontSize: 12, color: "#15803d", marginTop: 2 }}>bài của lò viết · cụm “{p.tuCum}”</div>}
									{(p.tuKhoaPhu ?? []).length > 0 && (
										<div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
											Từ khoá khác của trang này:{" "}
											{p.tuKhoaPhu.map((x) => `${x.tuKhoa} (hạng ${so(x.viTri)}, ${x.hienThi} hiển thị)`).join(" · ")}
										</div>
									)}
								</td>
								<td style={o}>
									<a href={p.trangMinh} target="_blank" rel="noopener noreferrer">{p.trangMinh}</a>
								</td>
								<td style={o}>{so(p.viTriBanDau)}</td>
								<td style={o}>{so(hienThiNgayBanDau(p), 2)}</td>
								<td style={o}>
									{NHAN_LEO_TOP[p.trangThai] ?? p.trangThai}
									{p.ngaySua && ` · sửa ${p.ngaySua}`}
								</td>
								<td style={o}>{gio(p.taoLuc)}</td>
							</tr>
							{mo === p.id && (
								<tr>
									<td colSpan={6} style={o}>
										<PhienLeoTop p={p} onDaSua={onDaSua} />
									</td>
								</tr>
							)}
						</Fragment>
					))}
				</tbody>
			</table>
			{phien.length === 0 && (
				<p style={{ color: "#666" }}>
					Chưa có phiên nào — ca đêm thứ Tư lấy từ khoá hạng 4–50 từ Search Console. Bài mới đăng cần vài tuần mới vào dải đó.
				</p>
			)}
		</div>
	);
}

/**
 * SƠ ĐỒ MẠNG NHỆN NGƯỢC. Mỗi bài MỚI là một trung tâm, các bài cũ nên trỏ về nó là nan hoa.
 *
 * ⚠️ Đây là ĐỀ XUẤT CHỜ NGƯỜI BẤM, không phải link đã có trên trang. Gọi nó là "liên kết" trên
 * màn hình là nói dối — người biên tập chèn trong khung Phiếu Rada ở trình soạn.
 */
function SoDoNanHoa({ t }) {
	const n = t.nan.length;
	const toa = toaDoNanHoa(n);
	return (
		<svg viewBox="0 0 320 260" style={{ width: "100%", maxWidth: 340, height: "auto" }} role="img" aria-label={`Sơ đồ ${n} bài cũ trỏ về ${t.tieuDe}`}>
			{toa.map((p, i) => (
				<line key={`l${i}`} x1="160" y1="130" x2={p.x} y2={p.y} stroke={t.nan[i].canVietThem ? "#fcd34d" : "#86efac"} strokeWidth="2" />
			))}
			{toa.map((p, i) => (
				<g key={`n${i}`}>
					<circle cx={p.x} cy={p.y} r="7" fill={t.nan[i].canVietThem ? "#fef3c7" : "#dcfce7"} stroke={t.nan[i].canVietThem ? "#d97706" : "#16a34a"} />
					<title>{`${t.nan[i].tieuDeCu || t.nan[i].id}${t.nan[i].canVietThem ? " — phải viết thêm một câu" : ` — neo sẵn: ${t.nan[i].neo}`}`}</title>
				</g>
			))}
			<circle cx="160" cy="130" r="16" fill="#1d4ed8" />
			<text x="160" y="135" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">{n}</text>
		</svg>
	);
}

function MangNhenTab({ dl, loi, onTai }) {
	const [mo, setMo] = useState(null);
	const [dangDo, setDangDo] = useState(false);
	const [doKq, setDoKq] = useState(null);
	const doLai = () => {
		setDangDo(true);
		setDoKq(null);
		goi("mang-nhen-do-lai")
			.then((r) => {
				setDoKq(r);
				onTai();
			}, (e) => setDoKq({ ghiChu: loiCua(e) }))
			.finally(() => setDangDo(false));
	};
	if (!dl) return loi ? <ChuaCoDuLieu loi={loi} /> : <ChoMotChut viec="Đang đọc sổ gợi ý link ngược" />;
	const tt = dl.trungTam ?? [];
	return (
		<div>
			<div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
				<Nut onClick={onTai}>Tải lại</Nut>
				{/* Sổ chỉ được ghi lúc Publish, nên bài đăng TRƯỚC khi có tính năng này không bao giờ
				    vào sổ. Nút dò lại lấp đúng chỗ đó; chạy lại nhiều lần không đẻ đề xuất trùng. */}
				<Nut chinh disabled={dangDo} onClick={doLai}>{dangDo ? "Đang dò…" : "Dò lại cho bài đã đăng"}</Nut>
				{doKq && (
					<span style={{ fontSize: 13, color: doKq.ghiChu ? "#92400e" : "#15803d" }}>
						{doKq.ghiChu || `Đã dò ${doKq.soBai} bài · ghi ${doKq.daGhi} đề xuất.`}
					</span>
				)}
				<span style={{ color: "#666", fontSize: 13 }}>
					Lò viết chèn link mới → cũ. Chiều ngược lại (cũ → mới) thì bài cũ không bao giờ tự biết có bài mới, nên bài mới nhận 0
					link nội bộ đúng lúc cần nhất. Đây là sổ gợi ý cho chiều đó.
				</span>
			</div>
			<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8, margin: "0 0 14px", maxWidth: 760 }}>
				<ODo so={tt.length} nhan="bài mới được đỡ" />
				<ODo so={dl.soDeXuat ?? 0} nhan="đề xuất chờ bấm" mau="#1d4ed8" />
				<ODo so={dl.soBaiCu ?? 0} nhan="bài cũ liên quan" />
				<ODo so={dl.soCanVietThem ?? 0} nhan="phải viết thêm câu" mau={dl.soCanVietThem ? "#92400e" : undefined} />
			</div>
			{/* Nói rõ đây là đề xuất: màn hình đếm 20 "đề xuất" mà người đọc tưởng 20 link đã chèn
			    thì mọi phép đo sau đó đều lệch. */}
			<div style={{ ...KHUNG_O, background: "#fffbeb", borderColor: "#fcd34d", fontSize: 13, marginBottom: 12 }}>
				Đây là <b>đề xuất chờ bấm</b>, chưa phải link đã có trên trang. Người biên tập chèn trong khung <b>Phiếu Rada</b> ở cột
				phải trình soạn bài. Nan <span style={{ color: "#16a34a" }}>xanh</span> là bài cũ đã có sẵn cụm để bọc thành link; nan{" "}
				<span style={{ color: "#d97706" }}>vàng</span> là phải viết thêm một câu — việc đắt hơn nên xếp sau.
			</div>
			{!tt.length && (
				<p style={{ color: "#6b7280" }}>
					Sổ còn trống. Nó tự ghi khi một bài được <b>Publish</b>, nên bài đăng <b>trước</b> khi có tính năng này không có trong
					đó — bấm <b>“Dò lại cho bài đã đăng”</b> ở trên để lấp.
				</p>
			)}
			{tt.map((t) => (
				<div key={t.slug} style={{ ...KHUNG_O, background: "#fff", marginBottom: 10 }}>
					<div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
						<div style={{ flex: "1 1 320px", minWidth: 260 }}>
							<div style={{ fontWeight: 600 }}>
								<a href={`${TRANG_GOC}/blog/${t.slug}/`} target="_blank" rel="noopener noreferrer">{t.tieuDe}</a>
							</div>
							<div style={{ fontSize: 13, color: "#6b7280", margin: "2px 0 6px" }}>
								{t.soNan} bài cũ nên trỏ về đây{t.soCanVietThem ? ` · ${t.soCanVietThem} bài phải viết thêm câu` : ""}
							</div>
							<Nut onClick={() => setMo(mo === t.slug ? null : t.slug)} style={{ fontSize: 12, padding: "3px 8px" }}>
								{mo === t.slug ? "Thu danh sách" : "Xem từng bài cũ"}
							</Nut>
							{mo === t.slug && (
								<ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 13 }}>
									{t.nan.map((x, i) => (
										<li key={i} style={{ marginBottom: 3 }}>
											{x.tieuDeCu || <span style={{ color: "#9ca3af" }}>(không tra ra tên, id {x.id})</span>}
											{x.canVietThem ? (
												<span style={{ color: "#92400e" }}> — ✎ phải viết thêm một câu{x.lyDo ? ` (${x.lyDo})` : ""}</span>
											) : (
												<span style={{ color: "#15803d" }}> — neo sẵn: “{x.neo}”</span>
											)}
										</li>
									))}
								</ul>
							)}
						</div>
						<div style={{ flex: "0 0 auto" }}>
							<SoDoNanHoa t={t} />
						</div>
					</div>
				</div>
			))}
			{dl.soChuaTraDuocTen > 0 && (
				<p style={{ fontSize: 12, color: "#9ca3af" }}>{dl.soChuaTraDuocTen} bài cũ không có trong sổ nháp của lò viết — tên tra từ CMS.</p>
			)}
		</div>
	);
}

// ---- Tab "Nháp" (2C-3): bài lò viết đã tạo, chờ người duyệt ----
const NHAN_NHAP = { cho_duyet: "Chờ duyệt", da_dang: "Đã đăng" };

/** Phiếu tóm tắt do máy chủ tính (viet/dang.mjs tomTatPhieu) — chỉ con số, không lời khuyên độ dài. */
function PhieuTomTat({ t }) {
	if (!t) return "—";
	return (
		<div style={{ fontSize: 12 }}>
			<div>
				SEO {t.seo} · YMYL {t.ymyl} · nguồn bỏ {t.nguonBo} · link gỡ {t.linkGo} · ảnh bìa: {t.anh ?? "không"}
			</div>
			{(t.canXemKy ?? []).length > 0 && (
				// Cờ do máy chủ tính (tomTatPhieu.canXemKy) — chỉ nêu SỐ, không khuyên gì về độ dài.
				<div style={{ margin: "4px 0", padding: "4px 8px", border: "1px solid #f59e0b", background: "#fffbeb", borderRadius: 6, color: "#92400e" }}>
					<b>⚠ Cần đọc kỹ</b>
					<ul style={{ margin: "2px 0 0", paddingLeft: 16 }}>
						{t.canXemKy.map((c) => (
							<li key={c.ma}>{c.chu}</li>
						))}
					</ul>
				</div>
			)}
			{(t.seoTruot ?? []).length > 0 && <div style={{ color: "#92400e" }}>SEO chưa đạt: {t.seoTruot.join("; ")}</div>}
			{(t.canhBao ?? []).length > 0 && <div style={{ color: "#92400e" }}>Cảnh báo: {t.canhBao.join("; ")}</div>}
			{t.loiCapNhat && <div style={{ color: "#b91c1c" }}>{t.loiCapNhat}</div>}
			{t.khoiPhuc && <div style={{ color: "#6b7280" }}>{t.khoiPhuc}</div>}
		</div>
	);
}

function NhapTab({ dl, loi, onTai }) {
	if (!dl) return <ChuaCoDuLieu loi={loi} />;
	const nhap = dl.nhap ?? [];
	const moCoi = dl.moCoi ?? [];
	return (
		<div>
			{loi && <p style={{ color: "#b91c1c" }}>{loi}</p>}
			<div style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: "10px 14px", margin: "8px 0 16px", background: "#f9fafb" }}>
				Bài máy viết luôn là <b>nháp</b>: đọc, sửa trong trình soạn rồi tự bấm Publish. Khung "Phiếu Rada" ở cột phải trình
				soạn có phiếu đầy đủ. Publish bị chặn nếu còn chữ vượt phạm vi Y sỹ hoặc ảnh hỏng.
				<br />
				<b>Lưu ý:</b> bài đã Publish nằm trong CMS; trang /blog/ công khai chưa đọc từ CMS cho tới kế hoạch 3.
			</div>
			<h2>
				Nháp của lò viết ({nhap.length}) <Nut onClick={onTai}>Tải lại</Nut>
			</h2>
			<table style={{ borderCollapse: "collapse", width: "100%" }}>
				<thead>
					<tr><th style={o}>Tiêu đề</th><th style={o}>Bài dự kiến</th><th style={o}>Ngày tạo</th><th style={o}>Trạng thái</th><th style={o}>Số từ</th><th style={o}>Phiếu</th></tr>
				</thead>
				<tbody>
					{nhap.map((n) => (
						<tr key={n.id}>
							<td style={o}>
								{(n.tomTat?.canXemKy ?? []).length > 0 && <span title="Phiếu có cờ — xem cột Phiếu" style={{ color: "#b45309", fontWeight: 700 }}>⚠ </span>}
								{/* tieuDe là chữ máy viết — chỉ hiển thị qua JSX text. */}
								<a href={n.adminUrl}>{n.tieuDe || n.slug || n.id}</a>
								<div style={{ fontSize: 12, color: "#6b7280" }}>{n.duong ?? (n.slug ? `/${n.slug}` : "(chưa có slug)")}</div>
							</td>
							<td style={o}>
								{n.tenKeHoach || n.keHoachId}
								{n.trangThaiKeHoach && <div style={{ fontSize: 12, color: "#6b7280" }}>{NHAN_KE_HOACH[n.trangThaiKeHoach] ?? n.trangThaiKeHoach}</div>}
							</td>
							<td style={o}>{gio(n.taoLuc)}</td>
							<td style={o}>
								{NHAN_NHAP[n.trangThai] ?? n.trangThai}
								{n.dangLuc && <div style={{ fontSize: 12, color: "#6b7280" }}>{gio(n.dangLuc)}</div>}
								{/* Chữ do máy chủ dựng (viet/indexnow.mjs chuIndexNow): "IndexNow: đã báo HH:mm DD/MM" hoặc "IndexNow: lỗi …". */}
								{n.indexNowChu && <div style={{ fontSize: 12, color: n.indexNow?.ok ? "#15803d" : "#b91c1c" }}>{n.indexNowChu}</div>}
							</td>
							<td style={{ ...o, whiteSpace: "nowrap" }}>{n.tomTat?.soTu == null ? "—" : n.tomTat.soTu}</td>
							<td style={o}>
								<PhieuTomTat t={n.tomTat} />
							</td>
						</tr>
					))}
				</tbody>
			</table>
			{nhap.length === 0 && <p>Chưa có nháp nào — routine viết đêm sẽ lấy các bài dự kiến đã duyệt ở tab Kế hoạch.</p>}
			{moCoi.length > 0 && (
				<>
					<h2>Nháp của bài "Cần xem lại" ({moCoi.length})</h2>
					<p style={{ fontSize: 13, color: "#6b7280" }}>
						Lò viết đã tạo nháp trong CMS nhưng chưa ghi sổ xong thì bài dự kiến chuyển sang "Cần xem lại". Mở nháp để xem, rồi
						Publish hoặc xoá trong CMS; xử lý bài dự kiến ở tab Kế hoạch.
					</p>
					<table style={{ borderCollapse: "collapse", width: "100%" }}>
						<thead>
							<tr><th style={o}>Bài dự kiến</th><th style={o}>Nháp</th><th style={o}>Lý do</th></tr>
						</thead>
						<tbody>
							{moCoi.map((k) => (
								<tr key={k.id}>
									<td style={o}>{k.tenKeHoach || k.id}</td>
									<td style={o}>
										<a href={k.adminUrl}>{k.slug ? `/${k.slug}` : k.contentId}</a>
									</td>
									<td style={{ ...o, fontSize: 12, color: "#92400e" }}>
										{k.lyDoCanXem}
										{(k.loiCuoi ?? []).length > 0 && (
											<ul style={{ margin: "4px 0 0", paddingLeft: 16 }}>
												{k.loiCuoi.map((l, i) => (
													<li key={i}>{l}</li>
												))}
											</ul>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</>
			)}
		</div>
	);
}

// ---- Tab Khoảng trống (02/10/2026) ----
// Trục: CHIỀU CAO THÁP, không phải số bài đối thủ. Ba giỏ tách bạch vì là ba loại VIỆC:
// viết mới / leo top / chờ người xác nhận nghĩa. Xem khoang-trong/ho-so.mjs.
const KHUNG_O = { border: "1px solid #e5e5e5", borderRadius: 8, padding: "10px 12px", background: "#fafafa" };

function HoSoCum({ hoSo, onGiao, dangGiao, giaoKq, giaoLoi, onSangTab, daCo, onViet, dangViet, vietKq, onNangHanNgach }) {
	if (!hoSo) return null;
	return (
		<div style={{ ...KHUNG_O, marginTop: 10 }}>
			<div style={{ marginBottom: 8 }}>
				<b>Hồ sơ cụm — {hoSo.cum}</b>{" "}
				<span style={{ color: "#666" }}>
					{hoSo.soBaiThuoc} bài thuốc · {hoSo.soViKhacNhau} vị · {hoSo.theBenh?.length ?? 0} thể bệnh · {hoSo.nguonYVan?.length ?? 0} nguồn
					{hoSo.huyet?.length ? ` · ${hoSo.huyet.length} huyệt` : ""}
					{hoSo.kinhTheoHuyet?.length ? ` · ${hoSo.kinhTheoHuyet.length} đường kinh` : ""}
				</span>
				{hoSo.bienThe?.length > 1 && <div style={{ color: "#666", fontSize: 12 }}>Gom theo từ vựng Đông y: {hoSo.bienThe.join(" · ")}</div>}
			</div>

			{(hoSo.canhBao ?? []).map((c, i) => (
				<div key={i} style={{ color: "#b91c1c", marginBottom: 6 }}>⚠ {c}</div>
			))}

			{(hoSo.theBenh ?? []).map((t, i) => (
				<div key={i} style={{ ...KHUNG_O, background: "#fff", marginBottom: 8 }}>
					<div><b>{t.phapTri}</b> <span style={{ color: "#666" }}>— {t.soBai} bài thuốc</span></div>
					{t.chungTrangTheoYVan?.[0] && <div style={{ color: "#444", fontSize: 13, margin: "4px 0" }}>{t.chungTrangTheoYVan[0]}</div>}
					<div style={{ fontSize: 13 }}>
						Vị chính:{" "}
						<DanhSachLink ds={t.viThuocChinh} toiDa={6} hienThi={(v) => ({ href: `${TRANG_GOC}${v.duong}`, nhan: `${v.ten}${v.tinhVi ? ` (${v.tinhVi})` : ""}` })} />
					</div>
					<div style={{ fontSize: 13 }}>
						Bài tiêu biểu: <DanhSachLink ds={t.baiThuocTieuBieu} toiDa={3} hienThi={(b) => ({ href: `${TRANG_GOC}${b.duong}`, nhan: b.ten })} />
					</div>
				</div>
			))}

			<div style={{ fontSize: 13, marginBottom: 6 }}>
				Vị hay dùng nhất:{" "}
				<DanhSachLink ds={hoSo.viHayDung} toiDa={12} hienThi={(v) => ({ href: `${TRANG_GOC}${v.duong}`, nhan: `${v.ten} (${v.soBaiDung})` })} />
			</div>
			<div style={{ fontSize: 13 }}>
				Nguồn y văn:{" "}
				<DanhSachLink ds={hoSo.nguonYVan} toiDa={8} hienThi={(n) => ({ href: `${TRANG_GOC}${n.duong}`, nhan: `${n.ten}${n.nienDai ? ` [${n.nienDai}]` : ""} ×${n.soBaiDan}` })} />
			</div>

			{/* CẦU THẬT của trang đang có. Không có khối này thì hồ sơ chỉ nói mình CÓ gì, và bài
			    viết ra là đoán xem người đọc muốn gì. */}
			{hoSo.cau?.soTuKhoa > 0 && (
				<div style={{ ...KHUNG_O, background: "#eff6ff", borderColor: "#93c5fd", marginTop: 8 }}>
					<div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Người ta đang hỏi gì (28 ngày, Search Console)</div>
					<KhoiCau cau={hoSo.cau} />
					<div style={{ fontSize: 12, color: "#1e40af", marginTop: 4 }}>
						Dạng hỏi đông nhất là <b>{hoSo.cau.yDinh[0]?.nhan}</b> — bài phải trả lời đúng cái đó ngay phần đầu.
					</div>
				</div>
			)}

			{/* Nhánh HUYỆT — thứ các cổng y tế tổng hợp không có. Đo 03/10/2026: vinmec có 4 URL
			    châm cứu trên 35.710. `phacDoKhop` hiện ra để người đọc tự thấy phép khớp tên
			    đúng hay trật, vì đó là chỗ dễ vu oan nhất của nhánh này. */}
			{hoSo.huyet?.length > 0 && (
				<div style={{ ...KHUNG_O, background: "#fff", marginTop: 8 }}>
					<div style={{ fontSize: 13, marginBottom: 4 }}>
						<b>Phương huyệt ({hoSo.huyet.length})</b>{" "}
						<span style={{ color: "#666" }}>
							khớp qua: {(hoSo.phacDoKhop ?? []).map((p) => `${p.ten} (${p.soHuyet})`).join(" · ") || "—"}
						</span>
					</div>
					<div style={{ fontSize: 13 }}>
						{hoSo.huyet.slice(0, 16).map((h, i) => (
							<span key={`${h.ten}-${i}`}>
								{i > 0 && " · "}
								{h.duong ? (
									<a href={`${TRANG_GOC}${h.duong}`} target="_blank" rel="noopener noreferrer">{h.ten}</a>
								) : (
									<span title="Chưa tra ra slug trang huyệt trong CMS">{h.ten}</span>
								)}
								<span style={{ color: "#6b7280" }}>
									{h.ma ? ` ${h.ma}` : ""}{h.kinh ? ` · ${h.kinh}` : ""}{h.soNguonDan ? ` · ${h.soNguonDan} nguồn` : ""}
								</span>
							</span>
						))}
					</div>
				</div>
			)}

			{/* HAI đường đo kinh độc lập nhau. Để cạnh nhau chính là ý đáng viết: chỗ hai bảng
			    gặp nhau là chỗ thuốc và huyệt cùng nói một đường kinh. */}
			{(hoSo.kinhTheoHuyet?.length > 0 || hoSo.kinhTheoViThuoc?.length > 0) && (
				<div style={{ fontSize: 13, marginTop: 6, color: "#374151" }}>
					{hoSo.kinhTheoHuyet?.length > 0 && (
						<div>Kinh của huyệt: {hoSo.kinhTheoHuyet.slice(0, 6).map((k) => `${k.ten} (${k.so})`).join(" · ")}</div>
					)}
					{hoSo.kinhTheoViThuoc?.length > 0 && (
						<div>Quy kinh của vị thuốc: {hoSo.kinhTheoViThuoc.slice(0, 6).map((k) => `${k.ten} (${k.so})`).join(" · ")}</div>
					)}
				</div>
			)}

			<div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
				{daCo ? (
					// Cụm đã có trang: viết bài mới là tự trùng chính mình — đẩy sang việc leo top.
					<Nut onClick={() => onSangTab?.("leo-top")}>Trang đã có — sang tab Leo top</Nut>
				) : (
					<Nut chinh onClick={onGiao} disabled={dangGiao || !hoSo.theBenh?.length}>
						{dangGiao ? "Đang giao…" : "Giao cho lò viết"}
					</Nut>
				)}
				<span style={{ color: "#666", fontSize: 12 }}>
					{daCo ? "Cụm này đã có trang nhắm nhu cầu; việc còn lại là nâng hạng trang đó." : "Tạo một bài dự kiến đã duyệt; lò viết nhận ở ca sau, bài nộp về tab Nháp — không tự đăng."}
				</span>
			</div>
			{giaoKq && (
				<div style={{ ...KHUNG_O, background: "#f0fdf4", borderColor: "#86efac", marginTop: 8, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
					<span>
						{giaoKq.daCoSan ? "Cụm này đã có bài dự kiến" : "✓ Đã tạo bài dự kiến"} <b>{giaoKq.tieuDeLamViec}</b> ({giaoKq.soLienKet} liên kết nội bộ)
						{giaoKq.daCoSan && " — không tạo thêm bài trùng."}
					</span>
					<Nut chinh onClick={onViet} disabled={dangViet}>{dangViet ? "Đang gọi model…" : "Viết ngay"}</Nut>
					<Nut onClick={() => onSangTab?.("ke-hoach")}>Mở tab Kế hoạch</Nut>
				</div>
			)}
			{vietKq &&
				(vietKq.daBatDau ? (
					<div style={{ ...KHUNG_O, background: "#eff6ff", borderColor: "#93c5fd", marginTop: 8, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
						<span>
							Lò viết nhận <b>{vietKq.soBai}</b> bài, đang viết bằng <b>{vietKq.model}</b>. Một bài mất 40–90 giây
							(có vòng sửa tối đa 3 lượt); bài đạt thành <b>nháp chờ duyệt</b>, không tự đăng.
						</span>
						<Nut onClick={() => onSangTab?.("nhap")}>Mở tab Nháp</Nut>
					</div>
				) : (
					// Lò viết từ chối lặng lẽ ở nhiều chỗ (hết hạn ngạch đêm, đủ nháp chờ duyệt…).
					// Nói thẳng lý do thay vì báo "đã bắt đầu" rồi để người dùng đợi một bài không tới.
					<div style={{ ...KHUNG_O, background: "#fffbeb", borderColor: "#fcd34d", marginTop: 8 }}>
						<div>
							Lò viết <b>không nhận bài nào</b>: {vietKq.ghiChu}.
							{typeof vietKq.conLaiDemNay === "number" && ` Hạn ngạch còn lại đêm nay: ${vietKq.conLaiDemNay} bài.`}
						</div>
						{/^hết hạn ngạch/.test(vietKq.ghiChu ?? "") && (
							<div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
								<span style={{ fontSize: 13 }}>Nâng hạn ngạch đêm nay:</span>
								{[3, 4, 5].map((n) => (
									<Nut key={n} onClick={() => onNangHanNgach?.(n)}>{n} bài</Nut>
								))}
							</div>
						)}
					</div>
				))}
			{giaoLoi && <div style={{ color: "#b91c1c", marginTop: 8 }}>{giaoLoi}</div>}

			{/* Lỗ thủng tháp là việc cho NGƯỜI: bot không tự viết được một mục từ điển mới. */}
			{hoSo.loThung?.length > 0 && (
				<div style={{ ...KHUNG_O, background: "#fff7ed", borderColor: "#fdba74", marginTop: 10 }}>
					<b style={{ color: "#9a3412" }}>Lỗ thủng tháp — việc cho người</b>
					<div style={{ fontSize: 13, marginTop: 4 }}>
						Vị dùng nhiều trong cụm này mà <b>chưa có mục từ điển</b>:{" "}
						{hoSo.loThung.map((v) => `${v.ten} (${v.soBaiDung} bài)`).join(", ")}
					</div>
				</div>
			)}
		</div>
	);
}

function GioCum({ ten, mo, ds, mau, coGsc, hienHoSo, cumMo, hoSo, hoSoLoi, dangTai, onGiao, dangGiao, giaoKq, giaoLoi, onSangTab, onViet, dangViet, vietKq, onNangHanNgach }) {
	if (!ds?.length) return null;
	return (
		<div style={{ marginBottom: 18 }}>
			<h3 style={{ margin: "0 0 2px", color: mau }}>{ten} <span style={{ color: "#666", fontWeight: 400 }}>({ds.length})</span></h3>
			<div style={{ color: "#666", fontSize: 13, marginBottom: 6 }}>{mo}</div>
			<table style={{ borderCollapse: "collapse", width: "100%", maxWidth: 860 }}>
				<thead>
					<tr>
						<th style={o}>Cụm</th>
						<th style={o}>Tháp</th>
						<th style={o}>Huyệt</th>
						<th style={o}>Trang mình</th>
						<th style={o} />
					</tr>
				</thead>
				<tbody>
					{ds.map((x) => (
						<Fragment key={x.ten}>
							<tr>
								<td style={o}><b>{x.ten}</b>{x.lyDo && <div style={{ color: "#92400e", fontSize: 12 }}>⚠ {x.lyDo}</div>}</td>
								<td style={o}>{x.soBai} bài · {x.soVi} vị</td>
								<td style={o}>
									{x.soHuyet ? (
										<span title={(x.khopTen ?? []).join(" · ")}>{x.soHuyet} huyệt{x.soKinh ? ` · ${x.soKinh} kinh` : ""}</span>
									) : (
										<span style={{ color: "#9ca3af" }}>—</span>
									)}
								</td>
								<td style={o}><SoTrangGsc c={x} coGsc={coGsc} /></td>
								<td style={o}>
									<Nut onClick={() => hienHoSo(x.ten)} disabled={dangTai === x.ten} dangChon={cumMo === x.ten}>
										{dangTai === x.ten ? "Đang dựng…" : cumMo === x.ten ? "Đóng hồ sơ" : "Mở hồ sơ"}
									</Nut>
								</td>
							</tr>
							{/* Hồ sơ bung NGAY DƯỚI hàng được bấm. Đặt sau cả bảng thì bấm hàng đầu của một
							    bảng 25 dòng là hồ sơ hiện ngoài tầm nhìn, trông y như nút không ăn. */}
							{cumMo === x.ten && (
								<tr>
									<td style={{ ...o, background: "#fafafa" }} colSpan={5}>
										{hoSoLoi ? (
											<div style={{ color: "#b91c1c" }}>{hoSoLoi}</div>
										) : (
											<HoSoCum hoSo={hoSo} onGiao={onGiao} dangGiao={dangGiao} giaoKq={giaoKq} giaoLoi={giaoLoi} onSangTab={onSangTab} daCo={x.daCo} onViet={onViet} dangViet={dangViet} vietKq={vietKq} onNangHanNgach={onNangHanNgach} />
										)}
									</td>
								</tr>
							)}
						</Fragment>
					))}
				</tbody>
			</table>
		</div>
	);
}

/**
 * Số Search Console của TRANG MÌNH cho một cụm. Đây là thứ biến chữ "đã có" thành việc đọc
 * được: đã có trang mà hạng 37 với 6 lượt hiển thị là việc LEO TOP; hạng 2 thì để yên.
 *
 * `so == null` nghĩa là Search Console không có dòng nào cho trang này trong 28 ngày — tức 0
 * lượt hiển thị, KHÁC HẲN "chưa hỏi được Google" (lúc đó `coGsc` false). Hai thứ nói hai câu.
 */
/**
 * CẦU — người ta gõ gì để tới trang này, hỏi theo dạng nào. Đây là nửa còn thiếu bên cạnh tháp:
 * tháp nói mình CÓ gì, cái này nói người ta HỎI gì. Chỗ hai thứ gặp nhau mới là việc đáng viết.
 */
function KhoiCau({ cau, gon }) {
	if (!cau?.soTuKhoa) return null;
	return (
		<div style={{ fontSize: 12, marginTop: 3 }}>
			<span style={{ color: "#1d4ed8", fontWeight: 600 }}>
				{cau.soTuKhoa} truy vấn · {cau.hienThi} hiển thị · {cau.nhap} nhấp
			</span>
			<div style={{ color: "#6b7280" }}>{cau.yDinh.map((y) => `${y.nhan} ${Math.round((y.hienThi / cau.hienThi) * 100)}%`).join(" · ")}</div>
			{!gon && (
				// Chữ người lạ gõ vào Google — chỉ hiển thị qua JSX text, không dựng HTML.
				<div style={{ color: "#374151", marginTop: 2 }}>{cau.dauBang.map((x) => `“${x.tuKhoa}” (${x.hienThi})`).join(" · ")}</div>
			)}
		</div>
	);
}

function SoTrangGsc({ c, coGsc }) {
	if (!c.daCo) return <span style={{ color: "#15803d" }}>chưa có</span>;
	const duong = c.duongTrang ?? `/${c.bo === "benh_hoc" ? "benh-hoc" : "cham-cuu-tri-benh"}/${c.slug}/`;
	const s = c.so;
	// Hạng 4–50 là dải ca soi SERP nhận việc; ngoài dải đó thì việc khác hẳn.
	const dangLeo = s && s.viTri >= 4 && s.viTri <= 50;
	return (
		<>
			<a href={`${TRANG_GOC}${duong}`} target="_blank" rel="noopener noreferrer">đã có</a>
			{!coGsc ? null : s ? (
				<div style={{ fontSize: 12, color: dangLeo ? "#92400e" : "#6b7280", marginTop: 2 }}>
					hạng {so(s.viTri)} · {s.hienThi} hiển thị · {s.nhap} nhấp
					{dangLeo && <div style={{ fontWeight: 600 }}>đúng dải leo top</div>}
				</div>
			) : (
				<div style={{ fontSize: 12, color: "#b91c1c", marginTop: 2 }}>0 lượt hiển thị trong 28 ngày</div>
			)}
			<KhoiCau cau={c.cau} gon />
		</>
	);
}

/**
 * Màn chờ có ĐỒNG HỒ. Một dòng chữ đứng im không phân biệt được "đang chạy" với "đã treo";
 * thấy giây nhảy là biết nó còn sống, và biết luôn đã chờ bao lâu để mà kêu.
 */
function ChoMotChut({ viec }) {
	const [giay, setGiay] = useState(0);
	useEffect(() => {
		const h = setInterval(() => setGiay((x) => x + 1), 1000);
		return () => clearInterval(h);
	}, []);
	return (
		<div style={{ padding: 24, color: "#666" }}>
			{viec}… <b>{giay}s</b>
			{giay > 12 && <div style={{ color: "#92400e", marginTop: 6 }}>Lâu hơn thường lệ — kho app có thể đang nguội hoặc không nối được.</div>}
		</div>
	);
}

function KhoangTrongTab({ dl, loi, onTai, onSangTab }) {
	const [cumMo, setCumMo] = useState(null);
	const [hoSo, setHoSo] = useState(null);
	const [hoSoLoi, setHoSoLoi] = useState("");
	const [dangTai, setDangTai] = useState(null);
	const [dangGiao, setDangGiao] = useState(false);
	const [giaoKq, setGiaoKq] = useState(null);
	const [giaoLoi, setGiaoLoi] = useState("");
	const [dangViet, setDangViet] = useState(false);
	const [vietKq, setVietKq] = useState(null);
	if (!dl)
		return loi ? (
			<ChuaCoDuLieu loi={loi} />
		) : (
			// Nói rõ đang chờ gì, không để người dùng nhìn "Đang tải…" trơ mà tưởng hỏng. Lượt
			// nguội nay ~1,5 giây (trước là 10 giây, xem da-mau.util.ts), và tab Radar đã hâm sẵn
			// kho app nên thường tới đây là đã ấm.
			<ChoMotChut viec="Đang hỏi kho app và đối chiếu trang đã có" />
		);

	const hienHoSo = (ten) => {
		if (cumMo === ten) { setCumMo(null); return; }
		setDangTai(ten); setHoSoLoi(""); setHoSo(null);
		setGiaoKq(null); setGiaoLoi(""); setVietKq(null);
		goi("khoang-trong-ho-so", { cum: ten, bienThe: [] })
			.then((h) => { setHoSo(h); setCumMo(ten); })
			.catch((e) => { setHoSoLoi(loiCua(e)); setCumMo(ten); })
			.finally(() => setDangTai(null));
	};

	const giaoViec = () => {
		if (!cumMo) return;
		setDangGiao(true); setGiaoLoi(""); setGiaoKq(null);
		goi("khoang-trong-giao-viec", { cum: cumMo, bienThe: [] })
			.then(setGiaoKq)
			.catch((e) => setGiaoLoi(loiCua(e)))
			.finally(() => setDangGiao(false));
	};
	// Lò viết chạy NỀN ở máy chủ: route trả ngay, bài xuất hiện ở tab Nháp sau vài phút.
	const vietNgay = () => {
		setDangViet(true);
		setVietKq(null);
		goi("lo-viet-chay", { keHoachId: giaoKq?.id })
			.then(setVietKq)
			.catch((e) => setGiaoLoi(loiCua(e)))
			.finally(() => setDangViet(false));
	};
	const nangHanNgach = (n) => {
		setDangViet(true);
		goi("lo-viet-han-ngach", { so: n })
			.then(() => goi("lo-viet-chay", { keHoachId: giaoKq?.id }))
			.then(setVietKq)
			.catch((e) => setGiaoLoi(loiCua(e)))
			.finally(() => setDangViet(false));
	};
	const phu = { hienHoSo, cumMo, hoSo, hoSoLoi, dangTai, onGiao: giaoViec, dangGiao, giaoKq, giaoLoi, onSangTab, onViet: vietNgay, dangViet, vietKq, onNangHanNgach: nangHanNgach, coGsc: dl.coGsc };

	return (
		<div>
			<div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
				<Nut onClick={onTai}>Tải lại</Nut>
				<span style={{ color: "#666", fontSize: 13 }}>
					{dl.soUngVien} cụm có tháp dày trong kho. Trục đo là chiều cao tháp (vị thuốc, bài thuốc, nguồn y văn đứng sau), không phải số bài đối thủ.
				</span>
			</div>
			{dl.loi && <div style={{ color: "#b91c1c", marginBottom: 10 }}>{dl.loi}</div>}
			{dl.gscGhiChu && <div style={{ color: "#6b7280", fontSize: 12, marginBottom: 8 }}>{dl.gscGhiChu}</div>}

			<GioCum
				ten="Chờ viết" mau="#15803d"
				mo="Có tháp, chưa có trang nhắm nhu cầu. Đây là việc của lò viết."
				ds={dl.choViet} {...phu}
			/>
			<GioCum
				ten="Đã có trang — việc leo top" mau="#92400e"
				mo="Trang đã tồn tại. Viết bài mới ở đây là tự trùng chính mình; đưa sang tab Leo top."
				ds={dl.leoTop} {...phu}
			/>
			<GioCum
				ten="Chờ bạn xác nhận nghĩa" mau="#b45309"
				mo="Cụm có nghĩa kép giữa Đông y và tiếng Việt thường dùng. Máy KHÔNG tự xếp hạng — tháp đo được có thể thuộc nghĩa khác với điều người đọc đang tìm."
				ds={dl.choXacNhan} {...phu}
			/>

			{!dl.choViet?.length && !dl.leoTop?.length && !dl.choXacNhan?.length && !dl.loi && (
				<div style={{ color: "#666" }}>Chưa có cụm nào đạt ngưỡng tháp.</div>
			)}
		</div>
	);
}

// ---- Tab Radar: gọn lại (02/10/2026) ----
//
// Bỏ bảng "Khoảng trống" cũ (bộ `cum` tính bằng luật): tab Khoảng trống đo theo chiều cao tháp
// đã thay nó, để hai bảng cạnh nhau thì người dùng không biết tin bảng nào. Thay bằng một dòng
// dẫn sang tab đó — cùng lối liên thông với các tab khác.
//
// Nhật ký ca rút từ 9 cột còn 4: thứ cần liếc là ca nào, lúc nào, làm được bao nhiêu, có lỗi
// không. Chi tiết nằm trong dòng mở rộng.
function ODo({ so, nhan, mau, lon }) {
	return (
		<div style={{ border: "1px solid #e5e5e5", borderRadius: 8, padding: lon ? "12px 16px" : "8px 12px", minWidth: 0, background: "#fff" }}>
			<div style={{ fontSize: lon ? 32 : 20, fontWeight: 700, color: mau, fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>{so}</div>
			<div style={{ fontSize: lon ? 13 : 12, color: "#6b7280" }}>{nhan}</div>
		</div>
	);
}

/** Thanh tiến trình gọn — chỉ vẽ khi biết TỔNG, không thì một thanh chạy mãi nói dối. */
function Thanh({ da, tong }) {
	if (!tong) return null;
	const pt = Math.min(100, Math.round((da / tong) * 100));
	return (
		<div style={{ height: 6, background: "#e5e7eb", borderRadius: 999, overflow: "hidden", minWidth: 90 }}>
			<div style={{ width: `${pt}%`, height: "100%", background: "#15803d" }} />
		</div>
	);
}

const PHA = { "thu-thap": "đang lấy sitemap", trich: "đang trích chữ", doc: "đang đọc bằng model", xong: "đang kết ca" };

/** Dòng tiến độ của ca đang chạy. `tienDo` chỉ có khi máy chủ báo có ca (xem KHOA_TIEN_DO). */
function TienDoCa({ td }) {
	if (!td) return null;
	const ten = PHA[td.pha] ?? td.pha;
	return (
		<span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#92400e", fontSize: 13 }}>
			{td.site ? `${td.site}: ` : ""}{ten}
			{td.tong ? ` ${td.da}/${td.tong}` : ""}
			{td.soSite > 1 ? ` · site ${td.siteSo}/${td.soSite}` : ""}
			<Thanh da={td.da} tong={td.tong} />
		</span>
	);
}

function DongCa({ c }) {
	const [mo, setMo] = useState(false);
	const ten =
		c.loai === "indexnow"
			? c.kieu === "go"
				? "IndexNow (gỡ)"
				: "IndexNow (đăng)"
			: c.loai === "claude"
				? "Đọc trang"
				: // Ca một site phải NÓI TÊN SITE: nhật ký toàn dòng "Ca radar" thì không ai phân biệt
					// được lượt bấm cho VinMEC với ca đêm chạy cả kho.
					c.tenMien
					? `Ca riêng · ${c.tenMien}`
					: c.ghi
						? "Ca radar (cả kho)"
						: "Chạy thử";
	const lam = [
		c.soUrlMoi ? `${c.soUrlMoi} URL mới` : "",
		c.soSitemapDaDoc ? `${c.soSitemapDaDoc} sitemap đọc xong` : "",
		c.soSitemapBoQua ? `${c.soSitemapBoQua} sitemap đã có trong sổ` : "",
		c.soTrich ? `${c.soTrich} trang trích` : "",
		c.loai === "claude" && c.soDoc ? `${c.soDoc} trang đọc` : "",
		c.soDocAi ? `${c.soDocAi} trang đọc bằng model` : "",
		c.soCum ? `${c.soCum} cụm` : "",
		c.soDoLai ? `${c.soDoLai} phiên đo lại` : "",
	].filter(Boolean);
	const coLoi = (c.loi ?? []).length > 0;
	const coTin = (c.thongTin ?? []).length > 0;
	return (
		<>
			<tr>
				<td style={o}>{gio(c.batDau)}</td>
				<td style={o}>{ten}</td>
				<td style={o}>{lam.join(" · ") || "—"}</td>
				<td style={o}>
					{coLoi ? <span style={{ color: "#b91c1c" }}>{(c.loi ?? []).length} lỗi</span> : <span style={{ color: "#15803d" }}>✓</span>}
					{(coLoi || coTin) && (
						<Nut onClick={() => setMo(!mo)} style={{ fontSize: 11, padding: "2px 6px", marginLeft: 6 }}>{mo ? "▾" : "▸"}</Nut>
					)}
				</td>
			</tr>
			{mo && (
				<tr>
					<td colSpan={4} style={{ ...o, background: "#fafafa", fontSize: 12 }}>
						{(c.loi ?? []).map((x, k) => (
							<div key={`l${k}`} style={{ color: "#b91c1c" }}>{x}</div>
						))}
						{/* thongTin: điều ca cố ý bỏ qua (vd chưa cấu hình Search Console) — không phải lỗi. */}
						{(c.thongTin ?? []).map((x, k) => (
							<div key={`t${k}`} style={{ color: "#6b7280" }}>{x}</div>
						))}
					</td>
				</tr>
			)}
		</>
	);
}

function RadarTab({ dl, loi, thongBao, lichRadar, form, setForm, onTai, onLam, onSangTab, onLuuDoiThu }) {
	// Ca chạy NỀN ở máy chủ: không tự tải lại thì bảng đứng im suốt vài phút và trông như hỏng.
	// 5 giây, khớp với hạn đệm đếm URL (10 s) ở máy chủ: cứ hai nhịp thì một nhịp có số mới, nhịp
	// kia gần như không tốn gì. Nhanh hơn nữa chỉ làm kẹt cái pool max:1 mà số vẫn y nguyên.
	useEffect(() => {
		if (!dl.dangChay) return;
		const h = setInterval(onTai, 5000);
		return () => clearInterval(h);
	}, [dl.dangChay, onTai]);
	const tong = (k) => dl.doiThu.reduce((n, d) => n + (d.dem?.[k] ?? 0), 0);
	const caCuoi = (dl.ca ?? []).find((c) => c.loai === "radar" && c.ghi);
	/**
	 * Site này ĐÃ chạy ca riêng mà vẫn 0 URL? Tra trong 10 dòng nhật ký đang hiện.
	 * ⚠️ Chỉ KHẲNG ĐỊNH được chiều dương: không thấy dòng nào không có nghĩa là chưa chạy (ca có
	 * thể đã trôi khỏi 10 dòng). Nên câu mặc định vẫn là "chưa quét lần nào" — vu oan một site
	 * đang chạy tốt đắt hơn là bỏ sót một site hỏng, vì người ta sẽ đi tìm lỗi không có thật.
	 */
	const caLoiCuaSite = (tenMien) => (dl.ca ?? []).some((c) => c.tenMien === tenMien && (c.loi ?? []).length > 0);
	const loiGom = gomLoiCa(dl.ca);
	return (
		<div>
			{/* ⚠️ CẢNH BÁO LÊN ĐẦU, trước mọi con số. Trước 06/10/2026 chúng nằm DƯỚI sáu ô số và
			    một đoạn văn bốn dòng — "26 giờ chưa đọc được trang nào" chìm nghỉm giữa những con
			    số trông vẫn to và khoẻ. */}
			{dl.canhBaoCaDem && <p style={{ color: "#b91c1c", fontWeight: 600, margin: "0 0 6px" }}>⚠ Hơn 26 giờ chưa có ca radar thành công — xem Nhật ký ca cuối trang.</p>}
			{dl.canhBaoClaude && (
				<p style={{ color: "#b91c1c", fontWeight: 600, margin: "0 0 6px" }}>
					⚠ {dl.choAi} trang chờ đọc mà 26 giờ qua chưa đọc được trang nào — kiểm GRAVITY_API_KEY trong cms/.env và hạn mức của khoá.
				</p>
			)}
			<OTinhTrang ds={dl.tinhTrang} />
			{thongBao && <p style={{ color: "#15803d", fontWeight: 600 }}>{thongBao}</p>}
			{loi && <p style={{ color: "#b91c1c" }}>{loi}</p>}

			{/* HAI ô lớn, bốn số nhỏ. Sáu ô bằng nhau là sáu con số KHÁC LOẠI mà mắt phải tự phân
			    hạng: "7 đối thủ theo dõi" là cấu hình, "104 chờ model đọc" là hàng đợi có thể đang
			    kẹt, "392 ngoài ngành" là chất lượng nguồn. Chỉ hai số đầu quyết được việc gì. */}
			<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 220px))", gap: 10, margin: "10px 0 8px" }}>
				<ODo lon so={dl.choAi} nhan="chờ model đọc" mau={dl.choAi > (dl.nhipDoc?.nguongHangCho ?? 80) ? "#b91c1c" : "#92400e"} />
				<ODo lon so={tong("da_phan_tich").toLocaleString("vi-VN")} nhan="trang đã đọc" mau="#15803d" />
			</div>
			<div style={{ fontSize: 13, color: "#6b7280", margin: "0 0 10px" }}>
				{dl.doiThu.length} đối thủ · {tong("cho").toLocaleString("vi-VN")} URL chờ trích · {tong("ngoai_nganh").toLocaleString("vi-VN")} ngoài ngành · ca gần
				nhất {caCuoi ? gio(caCuoi.batDau) : "—"}
			</div>
			{/* Hàng đợi chỉ có nghĩa khi đi kèm NHỊP: "1.178 trang chờ" không nói được gì, còn
			    "1.178 trang · 40 trang/đêm → 30 đêm" thì quyết được có nâng trần hay không.
			    ⚠️ Phần GIẢI THÍCH gấp lại: nội dung giữ nguyên vì nó thật sự hữu ích, chỉ không
			    được chặn đường mắt — bốn dòng văn nằm giữa màn thì người ta bỏ qua cả khối. */}
			{dl.choAi > 0 && dl.nhipDoc?.tranDem > 0 && (
				<details style={{ fontSize: 13, color: dl.choAi / dl.nhipDoc.tranDem > 7 ? "#92400e" : "#6b7280", margin: "0 0 12px" }}>
					<summary style={{ cursor: "pointer" }}>
						Hàng đợi {dl.choAi.toLocaleString("vi-VN")} trang · nhịp {dl.nhipDoc.tranDem} trang/đêm →{" "}
						<b>~{Math.ceil(dl.choAi / dl.nhipDoc.tranDem)} đêm</b> mới đọc hết
					</summary>
					<div style={{ marginTop: 4 }}>
						Trang <b>đúng ngách được trích trước</b>, nên phần đáng đọc tới sớm hơn nhiều con số đó. Muốn nhanh hơn nữa thì
						nâng <code>RADA_SEO_TRAN_DOC_DEM</code> (và <code>RADA_SEO_NGUONG_HANG_CHO</code>, đang{" "}
						{dl.nhipDoc.nguongHangCho}) — mỗi trang là một lượt gọi model.
					</div>
				</details>
			)}
			{dl.demTuDem && (
				// "Số không nhúc nhích" khác hẳn "số đứng yên vì ca chưa làm gì" — nói ra để khỏi
				// phải đoán. Đệm 10 giây, nhịp tải lại 5 giây.
				<div style={{ fontSize: 12, color: "#9ca3af", margin: "-8px 0 10px" }}>Số URL lấy từ bản đệm (làm mới mỗi 10 giây).</div>
			)}

			{!dl.caDemBat && <p style={{ color: "#92400e", fontSize: 13 }}>Máy này không bật RADA_SEO_CA_DEM: chỉ chạy thử được, ca đêm thật chạy trên VPS.</p>}

			<div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
				{/* Cron dò MỖI GIỜ, chỉ chạy ca ở tick 19:30 UTC (xem LICH_RADAR) → nextRunAt là tick kế, không phải ca kế. */}
				<span style={{ fontSize: 13, color: "#6b7280" }}>
					Lịch đêm: {lichRadar ? `02:30 hằng ngày · tick kế ${gio(lichRadar.nextRunAt)}` : "chưa bật"}
				</span>
				<NutBan chinh={!lichRadar} onBam={() => onLam("lich-bat")} chuBan="Đang hẹn…">{lichRadar ? "Hẹn lại" : "Bật lịch"}</NutBan>
				<Nut disabled={dl.dangChay} onClick={() => onLam("ca-chay", { ghi: false }).then(() => setTimeout(onTai, 2000))}>Chạy thử</Nut>
				<Nut chinh disabled={dl.dangChay || !dl.caDemBat} onClick={() => onLam("ca-chay", { ghi: true }).then(() => setTimeout(onTai, 2000))}>Chạy thật</Nut>
				<Nut onClick={onTai}>Tải lại</Nut>
				{dl.dangChay && (dl.tienDo ? <TienDoCa td={dl.tienDo} /> : <span style={{ color: "#92400e" }}>· đang chạy…</span>)}
			</div>

			<h3 style={{ margin: "0 0 6px" }}>Đối thủ</h3>
			<form onSubmit={(e) => { e.preventDefault(); onLuuDoiThu(); }} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
				<input placeholder="tên miền, vd vinmec.com" value={form.tenMien} onChange={(e) => setForm({ ...form, tenMien: e.target.value })} style={{ width: 200 }} />
				<input placeholder="tên hiển thị" value={form.ten} onChange={(e) => setForm({ ...form, ten: e.target.value })} style={{ width: 150 }} />
				<label style={{ fontSize: 13 }}>
					<input type="checkbox" checked={form.laCuaMinh} onChange={(e) => setForm({ ...form, laCuaMinh: e.target.checked })} /> site của mình
				</label>
				<Nut chinh type="submit">Thêm</Nut>
			</form>
			{/* Tiến độ THEO SITE: lịch đêm chạy chung cả kho, nên bảng này phải tự nói site nào
			    xong tới đâu, và mỗi dòng có nút chạy riêng. Luồng URL: chờ trích → chờ đọc →
			    đã đọc (ngoài ngành / lỗi là hai lối ra). */}
			<table style={{ borderCollapse: "collapse", width: "100%", maxWidth: 1000, marginBottom: 18 }}>
				<thead>
					<tr>
						<th style={o}>Tên miền</th><th style={o}>Chờ trích</th><th style={o}>Chờ đọc</th><th style={o}>Đã đọc</th>
						<th style={o}>Ngoài ngành</th><th style={o}>Lỗi</th><th style={o}>Tiến độ</th><th style={o} />
					</tr>
				</thead>
				<tbody>
					{dl.doiThu.map((d) => {
						const m = d.dem ?? {};
						const xong = (m.da_phan_tich ?? 0) + (m.ngoai_nganh ?? 0) + (m.loi ?? 0);
						const tongUrl = xong + (m.cho ?? 0) + (m.cho_ai ?? 0);
						const dangLam = dl.tienDo?.site === d.id;
						return (
							<tr key={d.id} style={dangLam ? { background: "#fffbeb" } : undefined}>
								<td style={o}>{d.ten} {d.laCuaMinh && <b style={{ color: "#1d4ed8" }}>(của mình)</b>}</td>
								<td style={o}>{m.cho ?? 0}</td>
								<td style={o}>{m.cho_ai ?? 0}</td>
								<td style={o}>{m.da_phan_tich ?? 0}</td>
								<td style={o}>{m.ngoai_nganh ?? 0}</td>
								<td style={o}>{m.loi || "—"}</td>
								<td style={o}>
									{tongUrl ? (
										<>
											{/* Mẫu số là URL ĐÃ BIẾT, không phải cả site: mỗi ca đào sâu thêm nên số này còn tăng. */}
											<div style={{ fontSize: 12, color: "#6b7280" }}>{xong}/{tongUrl} URL đã biết</div>
											<Thanh da={xong} tong={tongUrl} />
										</>
									) : caLoiCuaSite(d.id) ? (
										// ⚠️ HAI cái 0 khác hẳn nhau. "Chưa quét lần nào" là chuyện bình thường của site vừa
										// thêm; "quét rồi mà 0 URL" là hỏng và cần người đi xem. Gọi cả hai là "chưa quét" là
										// đúng cái bệnh "một con số cho hai trạng thái" repo đã ghi hai lần.
										<span style={{ color: "#b91c1c", fontSize: 12 }}>đã chạy nhưng 0 URL — xem Nhật ký ca</span>
									) : (
										<span style={{ color: "#6b7280", fontSize: 12 }}>chưa quét lần nào</span>
									)}
									{dangLam && <div style={{ fontSize: 12, color: "#92400e" }}>{PHA[dl.tienDo.pha] ?? dl.tienDo.pha}{dl.tienDo.tong ? ` ${dl.tienDo.da}/${dl.tienDo.tong}` : ""}</div>}
								</td>
								<td style={o}>
									<Nut
										chinh
										disabled={dl.dangChay || !dl.caDemBat}
										onClick={() => onLam("ca-chay", { ghi: true, tenMien: d.id }).then(() => setTimeout(onTai, 1500))}
										style={{ fontSize: 12, padding: "3px 8px" }}
										title={dl.caDemBat ? `Quét, trích và đọc riêng ${d.id}` : "Máy này không bật RADA_SEO_CA_DEM"}
									>
										Chạy
									</Nut>{" "}
									{d.dem.loi > 0 && <NutBan onBam={() => onLam("url-dat-lai", { tenMien: d.id })} chuBan="Đang đặt lại…" style={{ fontSize: 12, padding: "3px 8px" }}>Thử lại</NutBan>}{" "}
									<NutBan
										chuBan="Đang xoá…"
										// Bấm Cancel thì KHÔNG trả Promise — nút nhả ngay, không nhá "đang xoá…".
										onBam={() => (confirm(`Xoá ${d.id} và mọi URL của nó?`) ? onLam("doi-thu-xoa", { tenMien: d.id }) : undefined)}
										style={{ fontSize: 12, padding: "3px 8px" }}
									>
										Xoá
									</NutBan>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
			<p style={{ color: "#6b7280", fontSize: 13, margin: "-10px 0 18px" }}>
				Nút <b>Chạy</b> ở mỗi dòng chỉ làm việc của site đó: lấy sitemap, trích chữ, đọc bằng model.
				Các việc toàn kho (dò xu hướng, tính lại khoảng trống, chiến lược tuần, đo lại leo top) vẫn thuộc ca đêm và nút “Chạy thật” ở trên.
			</p>

			{/* Bảng cụm cũ (tính bằng luật) đã bỏ: tab Khoảng trống đo theo chiều cao tháp thay nó. */}
			<div style={{ ...KHUNG_O, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 18 }}>
				<span style={{ fontSize: 13 }}>
					Chủ đề đối thủ đã đọc được dùng ở <b>tab Khoảng trống</b> (đo theo chiều cao tháp) và <b>tab Hướng nội dung</b> (657 cụm ngữ nghĩa).
				</span>
				<Nut onClick={() => onSangTab("khoang-trong")}>Mở Khoảng trống</Nut>
				<Nut onClick={() => onSangTab("huong")}>Mở Hướng nội dung</Nut>
			</div>

			{/* ⚠️ Một câu thay cho việc bấm ▸ bảy lần: bảng dưới ghi "1 lỗi" ở mỗi dòng mà không nói
			    lỗi gì, nên không thấy được bảy dòng đó là CÙNG một lỗi. */}
			{loiGom.cau && <div style={{ fontSize: 13, color: "#b91c1c", margin: "0 0 6px" }}>⚠ {loiGom.cau}</div>}
			<h3 style={{ margin: "0 0 6px" }}>Nhật ký ca</h3>
			<table style={{ borderCollapse: "collapse", width: "100%", maxWidth: 900 }}>
				<thead>
					<tr><th style={o}>Lúc</th><th style={o}>Ca</th><th style={o}>Làm được</th><th style={o}>Kết quả</th></tr>
				</thead>
				<tbody>
					{(dl.ca ?? []).map((c) => (
						<DongCa key={`${c.batDau}-${c.loai}-${c.kieu ?? ""}-${c.slug ?? ""}`} c={c} />
					))}
				</tbody>
			</table>
		</div>
	);
}

function RadaSeo() {
	const [dl, setDl] = useState(null);
	const [loi, setLoi] = useState("");
	const [form, setForm] = useState({ tenMien: "", ten: "", laCuaMinh: false });
	const [tab, setTab] = useState(tabDaLuu);
	const [clDl, setClDl] = useState(null);
	const [cLoi, setCLoi] = useState("");
	const [ltDl, setLtDl] = useState(null);
	const [ltLoi, setLtLoi] = useState("");
	const [thongBao, setThongBao] = useState("");
	const [nhDl, setNhDl] = useState(null);
	const [nhLoi, setNhLoi] = useState("");
	const [mnDl, setMnDl] = useState(null);
	// Hàng đợi việc + huy hiệu trên thanh quy trình, cùng MỘT route `viec` (đệm 60 giây ở máy
	// chủ). Trước 06/10/2026 huy hiệu có route `viec-dem` riêng, mà nó đọc lại đúng dsKeHoach +
	// dsLeoTop + goi_y_nguoc mà hàng đợi cần — 3 lượt đi-về cho dữ liệu đã có.
	const [vcDl, setVcDl] = useState(null);
	const [vcLoi, setVcLoi] = useState("");
	const [mnLoi, setMnLoi] = useState("");
	const [ktDl, setKtDl] = useState(null);
	const [ktLoi, setKtLoi] = useState("");
	const [khDangViet, setKhDangViet] = useState(null);
	const [cnDl, setCnDl] = useState(null);
	const [cnLoi, setCnLoi] = useState("");
	const [khVietKq, setKhVietKq] = useState(null);

	// `tai` trả true khi route tổng quan từ chối vì quyền (403) — xem useEffect bên dưới.
	const tai = useCallback(() => goi("tong-quan").then((d) => { setDl(d); setLoi(""); return false; }, (e) => { setLoi(loiCua(e)); return e?.status === 403; }), []);
	const taiCL = useCallback(() => goi("chien-luoc-tong-quan").then((d) => { setClDl(d); setCLoi(""); }, (e) => setCLoi(loiCua(e))), []);
	// Tải theo yêu cầu: route này hỏi sang app và quét bảng bài thuốc, không nên chạy khi mở màn.
	const taiCN = useCallback(() => goi("cum-ngu-nghia").then((d) => { setCnDl(d); setCnLoi(""); }, (e) => setCnLoi(loiCua(e))), []);
	const taiKT = useCallback(() => goi("khoang-trong-tong-quan").then((d) => { setKtDl(d); setKtLoi(""); }, (e) => setKtLoi(loiCua(e))), []);
	const taiLT = useCallback(() => goi("leo-top-tong-quan").then((d) => { setLtDl(d); setLtLoi(""); }, (e) => setLtLoi(loiCua(e))), []);
	// Trả true khi route từ chối vì quyền (403) — Editor chỉ đọc được tab Nháp.
	const taiViec = useCallback(
		() => goi("viec").then((d) => { setVcDl(d); setVcLoi(""); return false; }, (e) => { setVcLoi(loiCua(e)); return e?.status === 403; }),
		[],
	);
	const taiMn = useCallback(() => goi("mang-nhen-tong-quan").then((d) => { setMnDl(d); setMnLoi(""); }, (e) => setMnLoi(loiCua(e))), []);
	const taiNh = useCallback(() => goi("nhap-tong-quan").then((d) => { setNhDl(d); setNhLoi(""); }, (e) => setNhLoi(loiCua(e, KHONG_QUYEN_NHAP))), []);
	// Bảng tra route → hàm tải. `admin.jsx` giữ phần GỌI, `lib/tai-man.mjs` giữ phần LUẬT (route
	// nào lúc nào) — chỉ phần luật là kiểm được, vì JSX không có hạ tầng test ở repo này.
	const theoRoute = {
		viec: taiViec,
		"tong-quan": tai,
		"chien-luoc-tong-quan": taiCL,
		"cum-ngu-nghia": taiCN,
		"khoang-trong-tong-quan": taiKT,
		"leo-top-tong-quan": taiLT,
		"mang-nhen-tong-quan": taiMn,
		"nhap-tong-quan": taiNh,
	};
	const daTai = useRef(new Set());
	// ⚠️ `theoRoute` dựng lại MỖI lượt render. Đưa nó vào mảng phụ thuộc của effect thì effect
	// chạy lại mỗi lượt render — một vòng mạng nữa cho con số không đổi. Đã có lỗi đúng kiểu này
	// ở tab Kế hoạch (useEffect phụ thuộc cả object `dl`). Nên giữ trong ref, `taiRoute` phụ
	// thuộc RỖNG.
	const theoRouteRef = useRef(theoRoute);
	theoRouteRef.current = theoRoute;
	const taiRoute = useCallback((r) => {
		const f = theoRouteRef.current[r];
		if (!f) return Promise.resolve();
		daTai.current.add(r);
		return f();
	}, []);

	useEffect(() => {
		// ⚠️ Chỉ HAI route lúc mở màn (xem `lib/tai-man.mjs`). Trước 06/10/2026 là NĂM, mà pool
		// CSDL là max:1 nên chúng xếp hàng: ~19 lượt đi-về ≈ 1,9 giây, và người xem tab Radar trả
		// tiền cho bốn tab chưa mở.
		//
		// Không phải quản trị viên (Editor): mở thẳng tab Nháp — tab duy nhất họ đọc được. Không
		// ghi vào localStorage: cùng trình duyệt đăng nhập lại bằng tài khoản quản trị vẫn về tab
		// đã lưu.
		taiRoute("viec").then((khongQuyen) => {
			if (khongQuyen) setTab("nhap");
		});
		for (const r of ROUTE_MO_MAN) if (r !== "viec") taiRoute(r);
	}, [taiRoute]);
	// ⚠️ Những nút CÒN tải lại cả màn: chúng đổi nhiều dòng cùng lúc (xoá đối thủ, đặt lại URL)
	// nên phản hồi không nói đủ. Dấu hiệu bận nằm ở CHÍNH NÚT (xem `NutBan`), không phải một cờ
	// toàn cục in ở cuối thanh quy trình — chỗ đó mắt người vừa bấm một nút giữa bảng không nhìn
	// tới, nên nó không ngăn được cú bấm thứ hai, mà cú bấm thứ hai mới là thứ xếp thêm một lượt
	// tải lại vào hàng trên pool max:1.
	const lam = (route, body) => goi(route, body).then(tai, (e) => setLoi(loiCua(e)));
	const lamCL = (route, body) => goi(route, body).then(taiCL, (e) => setCLoi(loiCua(e)));

	const doiTab = (t) => {
		setTab(t);
		luuTab(t);
		// Tab nào cần route gì thì `lib/tai-man.mjs` nói. Chỉ tải LẦN ĐẦU — nút "Tải lại" trong
		// từng tab lo phần làm mới; tải lại mỗi lần sang là trả một vòng mạng để nhận đúng con số
		// đang hiện. Riêng Kế hoạch tải lại MỖI lần sang (TAI_LAI_KHI_SANG): bài dự kiến vừa giao
		// từ tab Khoảng trống phải hiện ngay, không thì người dùng tưởng nút Giao không ăn.
		for (const r of routeChoTab(t)) if (TAI_LAI_KHI_SANG.has(t) || !daTai.current.has(r)) taiRoute(r);
	};

	// ⚠️ PHẢI có effect này, không chỉ dựa vào doiTab: tab được KHÔI PHỤC từ localStorage lúc mở
	// màn (useState(tabDaLuu)) chứ không đi qua doiTab, nên người mở lại trang khi đang ở tab
	// Khoảng trống sẽ kẹt ở "Đang tải…" vĩnh viễn — route chưa bao giờ được gọi. Đã cắn 02/10/2026.
	useEffect(() => {
		for (const r of routeChoTab(tab)) if (!daTai.current.has(r)) taiRoute(r);
	}, [tab, taiRoute]);

	// Không trả sớm khi chưa có dữ liệu: thanh tab phải luôn hiện, không thì người không đủ quyền
	// xem tab Radar bị kẹt ở một dòng lỗi, không có lối sang tab Nháp.
	const lichRadar = dl?.lich?.find((l) => l.name === "radar");
	return (
		<div style={{ padding: 24, maxWidth: 1200 }}>
			<h1>Rada SEO</h1>
			<NutManViec tab={tab} tong={vcDl?.tong ?? 0} onChon={doiTab} />
			<ThanhQuyTrinh tab={tab} dem={vcDl?.demTab} onChon={doiTab} />

			{tab === "radar" &&
				(!dl ? (
					<ChuaCoDuLieu loi={loi} />
				) : (
					<RadarTab
						dl={dl}
						loi={loi}
						thongBao={thongBao}
						lichRadar={lichRadar}
						form={form}
						setForm={setForm}
						onTai={tai}
						onLam={lam}
						onSangTab={doiTab}
						onLuuDoiThu={() =>
							goi("doi-thu-luu", form).then(
								(r) => {
									setForm({ tenMien: "", ten: "", laCuaMinh: false });
									setThongBao(r?.caDauTien ? "Đã bắt đầu ca radar đầu tiên — vài phút nữa bấm “Tải lại”." : "");
									tai();
									if (r?.caDauTien) setTimeout(tai, 2000);
								},
								(e) => setLoi(loiCua(e)),
							)
						}
					/>
				))}

			{tab === "viec" && (
				<ManViecTab
					dl={vcDl}
					loi={vcLoi}
					onTai={taiViec}
					onSangTab={doiTab}
					onGhi={(v, h, them) => {
						// Dòng rời hàng đợi CHỈ KHI máy chủ xác nhận — cố ý không optimistic update.
						const roiHangDoi = () =>
							setVcDl((d) => (d ? { ...d, viec: boDong(d.viec, v.khoa, "khoa"), tong: Math.max(0, (d.tong ?? 1) - 1) } : d));
						const xong = (p) => p.then(roiHangDoi);
						if (v.loai === "nhan_huong")
							return xong(
								goi(
									"huong-dat",
									h === "nhan"
										? // trongSo BẮT BUỘC khi nhận (kho.datHuong đòi nguyên 1..5).
											{ id: v.id, trangThai: "da_nhan", trongSo: them?.trongSo ?? 3 }
										: { id: v.id, trangThai: "bo_qua", lyDoBo: "Người quản trị bỏ" },
								),
							);
						if (v.loai === "duyet_ke_hoach")
							return xong(goi("ke-hoach-dat", h === "duyet" ? { id: v.id, trangThai: "da_duyet" } : { id: v.id, trangThai: "bo_qua", lyDoBo: "Người quản trị bỏ" }));
						if (v.loai === "lam_phieu_leo_top") return xong(goi("leo-top-da-sua", { id: v.id }));
						// Việc sửa nhỏ: bản vá ĐÃ tự chạy trong vòng build (cau-hoi-gsc → faq-that),
						// nên nút này ghi MỐC để sau còn so hạng, không phải "đi sửa".
						return xong(goi("leo-top-sua-nho-danh-dau", { duong: v.meta?.trang ?? v.duong }));
					}}
				/>
			)}

			{tab === "huong" && <CumNguNghiaTab dl={cnDl} loi={cnLoi} onTai={taiCN} onSangTab={doiTab} />}

			{tab === "ke-hoach" && (
				<KeHoachTab
					dl={clDl}
					loi={cLoi}
					// ⚠️ Cập nhật CỤC BỘ, không gọi lại `chien-luoc-tong-quan` (3 lượt đọc kho trên pool
					// max:1) để biết điều phản hồi đã nói. Và cố ý KHÔNG optimistic update: state đổi
					// chỉ khi máy chủ xác nhận — duyệt là ghi thật, báo xong khi chưa xong là để
					// người duyệt tưởng bài đã vào hàng viết.
					//
					// ⚠️ `datDong` (ĐỔI trạng thái) chứ KHÔNG `boDong` (xoá dòng): tab này có bộ lọc
					// theo trạng thái và bộ đếm theo trạng thái, nên xoá dòng là làm bài vừa duyệt
					// biến mất khỏi nhóm "Đã duyệt" lẫn "Tất cả", và bộ đếm sai theo. Route trả bản
					// ghi đầy đủ với trangThai mới nên truyền thẳng được.
					onDuyet={(id) =>
						goi("ke-hoach-dat", { id, trangThai: "da_duyet" }).then(
							(r) => setClDl((d) => (d ? { ...d, keHoach: datDong(d.keHoach, id, r) } : d)),
							(e) => setCLoi(loiCua(e)),
						)
					}
					onBo={(id, lyDo) =>
						goi("ke-hoach-dat", { id, trangThai: "bo_qua", lyDoBo: lyDo }).then(
							(r) => setClDl((d) => (d ? { ...d, keHoach: datDong(d.keHoach, id, r) } : d)),
							(e) => setCLoi(loiCua(e)),
						)
					}
					dangViet={khDangViet}
					vietKq={khVietKq}
					onTai={taiCL}
					onThuHoi={(id) => lamCL("ke-hoach-thu-hoi", { id })}
					onViet={(id) => {
						setKhDangViet(id);
						setKhVietKq(null);
						goi("lo-viet-chay", { keHoachId: id })
							.then((r) => setKhVietKq({ ...r, id }))
							.catch((e) => setKhVietKq({ id, daBatDau: false, ghiChu: loiCua(e) }))
							.finally(() => {
								setKhDangViet(null);
								taiCL();
							});
					}}
				/>
			)}

			{tab === "leo-top" && (
				<LeoTopTab
					dl={ltDl}
					loi={ltLoi}
					onTai={taiLT}
					// ⚠️ Chỗ ĐẮT NHẤT: `leo-top-tong-quan` tốn `dsLeoTop` + `dsKeHoach` + HAI lượt GSC,
					// mà việc chỉ là đổi trạng thái MỘT phiếu. Dòng KHÔNG rời bảng (nó chỉ đổi trạng
					// thái, và người vừa bấm cần thấy mốc vừa chụp), nên dùng `datDong`: nó GỘP vào
					// dòng cũ nên `tuCum` — thứ chỉ `leo-top-tong-quan` gắn, route này không trả —
					// giữ nguyên, và các cột hạng/hiển thị/nhấp không phải hỏi GSC lại.
					onDaSua={(id, ngay) =>
						goi("leo-top-da-sua", { id, ngay }).then(
							(r) => setLtDl((d) => (d ? { ...d, phien: datDong(d.phien, id, r) } : d)),
							(e) => setLtLoi(loiCua(e)),
						)
					}
					onSangTab={doiTab}
				/>
			)}

			{tab === "khoang-trong" && <KhoangTrongTab dl={ktDl} loi={ktLoi} onTai={taiKT} onSangTab={doiTab} />}

			{tab === "mang-nhen" && <MangNhenTab dl={mnDl} loi={mnLoi} onTai={taiMn} />}

			{tab === "nhap" && <NhapTab dl={nhDl} loi={nhLoi} onTai={taiNh} />}
		</div>
	);
}

export const pages = { "/rada": RadaSeo };
