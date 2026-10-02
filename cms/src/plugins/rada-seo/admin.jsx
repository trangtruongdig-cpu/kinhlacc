// Màn điều khiển Rada SEO trong /_emdash/admin/plugins/rada-seo/rada.
// Chỉ HIỂN THỊ và gọi route của plugin; mọi luật nằm phía máy chủ.
import { Fragment, useCallback, useEffect, useState } from "react";

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

const NHAN_CUM = { cho_viet: "Chờ viết", co_nhap: "Có nháp", da_dang: "Đã đăng", bo_qua: "Bỏ qua", phu_boi_tu_dien: "Từ điển đã phủ" };
const gio = (s) => (s ? new Date(s).toLocaleString("vi-VN") : "—");
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
const TABS = [
	{ key: "radar", label: "Radar" },
	{ key: "khoang-trong", label: "Khoảng trống" },
	{ key: "huong", label: "Hướng nội dung" },
	{ key: "ke-hoach", label: "Kế hoạch" },
	{ key: "leo-top", label: "Leo top" },
	{ key: "nhap", label: "Nháp" },
];
const TAB_LS_KEY = "rada-seo:tab";
function tabDaLuu() {
	try {
		const v = localStorage.getItem(TAB_LS_KEY);
		return TABS.some((t) => t.key === v) ? v : "radar";
	} catch {
		return "radar";
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
	if (!dl) return <ChuaCoDuLieu loi={loi} />;

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
					tầng trên của tab Khoảng trống, nơi mỗi chủ trị đứng một dòng riêng.
				</span>
			</div>
			{dl.loi && <div style={{ color: "#b91c1c", marginBottom: 10 }}>{dl.loi}</div>}
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
									<td style={o}>{c.soBai} bài · {c.soVi} vị</td>
									<td style={o}>
										{c.daCo ? (
											<a href={`${TRANG_GOC}/${c.bo === "benh_hoc" ? "benh-hoc" : "cham-cuu-tri-benh"}/${c.slug}/`} target="_blank" rel="noopener noreferrer">đã có</a>
										) : (
											<span style={{ color: "#15803d" }}>chưa có</span>
										)}
									</td>
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
								<Nut chinh onClick={() => onDuyet(k.id)}>{k.trangThai === "can_xem" ? "Duyệt lại" : "Duyệt"}</Nut>
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
								<Nut onClick={() => onBo(k.id, "Người quản trị bỏ")} style={{ fontSize: 12, padding: "3px 8px" }}>Bỏ</Nut>
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
							<Nut onClick={() => onThuHoi?.(k.id)} style={{ fontSize: 12, padding: "3px 8px" }}>Thu hồi ngay</Nut>
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
	useEffect(() => {
		taiCa();
	}, [taiCa, dl]);
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
			{/* Lý do lò viết thất bại nằm ở MÁY CHỦ (route trả lời trước khi ca xong), nên phải đọc
			    lại nhật ký ca. Không có khối này thì người dùng chỉ thấy bài quay về "Chờ viết" mà
			    không biết vì sao — đo 02/10/2026: nguyên nhân thật là hết quota API, chỉ log mới có. */}
			{caViet && caViet.daTao === 0 && (caViet.ghiChu ?? []).length > 0 && (
				<div style={{ border: "1px solid #fcd34d", background: "#fffbeb", borderRadius: 8, padding: "8px 12px", margin: "0 0 12px", fontSize: 13 }}>
					<b>Lần viết gần nhất không ra bài</b> ({gio(caViet.luc)}):
					<ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
						{caViet.ghiChu.slice(0, 3).map((g, i) => (
							<li key={i}>{/HTTP 429/.test(g) ? "Hết quota API của Google AI Studio hôm nay — đổi model trong cms/.env hoặc bật thanh toán." : g.slice(0, 220)}</li>
						))}
					</ul>
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
					<Nut chinh={p.trangThai !== "da_sua"} onClick={() => { if (p.trangThai === "da_sua" && (p.doLai ?? []).length > 0 && !window.confirm("Đổi ngày sửa sẽ xoá các lần đo lại đã có. Tiếp tục?")) return; onDaSua(p.id, ngay); }}>{p.trangThai === "da_sua" ? "Đổi ngày sửa" : "Đã sửa theo phiếu"}</Nut>
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

function LeoTopTab({ dl, loi, onDaSua, onTai }) {
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
	return (
		<div>
			{loi && <p style={{ color: "#b91c1c" }}>{loi}</p>}
			{!dl.gscCoCauHinh && (
				<p style={{ color: "#92400e" }}>
					Plugin chưa cấu hình Search Console (biến GSC_OAUTH_* trong cms/.env): không lấy được từ khoá mới và ca đêm không đo lại hạng.
				</p>
			)}
			{dl.tongHop && <TongHopVongHoc th={dl.tongHop} />}
			{dl.gscCoCauHinh && <ViecTieuDe />}
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
			<h2>
				Phiên leo top ({phien.length}) <Nut onClick={onTai}>Tải lại</Nut>
			</h2>
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
			{phien.length === 0 && <p>Chưa có phiên nào — routine thứ Tư sẽ lấy từ khoá hạng 4–50 từ Search Console.</p>}
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

function GioCum({ ten, mo, ds, mau, hienHoSo, cumMo, hoSo, hoSoLoi, dangTai, onGiao, dangGiao, giaoKq, giaoLoi, onSangTab, onViet, dangViet, vietKq, onNangHanNgach }) {
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
									{x.daCo ? (
										<a href={`${TRANG_GOC}/${x.bo === "benh_hoc" ? "benh-hoc" : "cham-cuu-tri-benh"}/${x.slug}/`} target="_blank" rel="noopener noreferrer">đã có</a>
									) : (
										<span style={{ color: "#15803d" }}>chưa có</span>
									)}
								</td>
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
									<td style={{ ...o, background: "#fafafa" }} colSpan={4}>
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
			// Lượt đầu mất hơn 10 giây (hỏi kho app + nạp trang bệnh học); nói rõ đang chờ gì,
			// không để người dùng nhìn "Đang tải…" trơ mà tưởng hỏng.
			<div style={{ padding: 24, color: "#666" }}>Đang hỏi kho app và đối chiếu trang đã có… lượt đầu mất khoảng 10–15 giây.</div>
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
	const phu = { hienHoSo, cumMo, hoSo, hoSoLoi, dangTai, onGiao: giaoViec, dangGiao, giaoKq, giaoLoi, onSangTab, onViet: vietNgay, dangViet, vietKq, onNangHanNgach: nangHanNgach };

	return (
		<div>
			<div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
				<Nut onClick={onTai}>Tải lại</Nut>
				<span style={{ color: "#666", fontSize: 13 }}>
					{dl.soUngVien} cụm có tháp dày trong kho. Trục đo là chiều cao tháp (vị thuốc, bài thuốc, nguồn y văn đứng sau), không phải số bài đối thủ.
				</span>
			</div>
			{dl.loi && <div style={{ color: "#b91c1c", marginBottom: 10 }}>{dl.loi}</div>}

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
	const taiNh = useCallback(() => goi("nhap-tong-quan").then((d) => { setNhDl(d); setNhLoi(""); }, (e) => setNhLoi(loiCua(e, KHONG_QUYEN_NHAP))), []);
	useEffect(() => {
		// Không phải quản trị viên (Editor): mở thẳng tab Nháp — tab duy nhất họ đọc được. Không ghi
		// vào localStorage: cùng trình duyệt đăng nhập lại bằng tài khoản quản trị vẫn về tab đã lưu.
		tai().then((khongQuyen) => {
			if (khongQuyen) setTab("nhap");
		});
		taiCL();
		taiLT();
		taiNh();
	}, [tai, taiCL, taiLT, taiNh]);
	const lam = (route, body) => goi(route, body).then(tai, (e) => setLoi(loiCua(e)));
	const lamCL = (route, body) => goi(route, body).then(taiCL, (e) => setCLoi(loiCua(e)));

	const doiTab = (t) => {
		setTab(t);
		luuTab(t);
		// Tab Khoảng trống hỏi sang kho app và quét bảng bài thuốc (vài giây), nên chỉ tải khi
		// người dùng mở nó, và chỉ lần đầu — nút "Tải lại" lo phần làm mới.
		if (t === "khoang-trong" && !ktDl) taiKT();
		if (t === "huong" && !cnDl) taiCN();
		// Sang tab Kế hoạch thì tải lại: bài dự kiến vừa tạo từ tab Khoảng trống phải hiện ngay,
		// không bắt người dùng tự bấm "Tải lại" rồi tưởng nút Giao không ăn.
		if (t === "ke-hoach") taiCL();
		if (t === "nhap") taiNh();
	};

	// ⚠️ PHẢI có effect này, không chỉ dựa vào doiTab: tab được KHÔI PHỤC từ localStorage lúc mở
	// màn (useState(tabDaLuu)) chứ không đi qua doiTab, nên người mở lại trang khi đang ở tab
	// Khoảng trống sẽ kẹt ở "Đang tải…" vĩnh viễn — route chưa bao giờ được gọi. Đã cắn 02/10/2026.
	useEffect(() => {
		if (tab === "khoang-trong" && !ktDl && !ktLoi) taiKT();
		if (tab === "huong" && !cnDl && !cnLoi) taiCN();
	}, [tab, ktDl, ktLoi, taiKT, cnDl, cnLoi, taiCN]);

	// Không trả sớm khi chưa có dữ liệu: thanh tab phải luôn hiện, không thì người không đủ quyền
	// xem tab Radar bị kẹt ở một dòng lỗi, không có lối sang tab Nháp.
	const lichRadar = dl?.lich?.find((l) => l.name === "radar");
	return (
		<div style={{ padding: 24, maxWidth: 1200 }}>
			<h1>Rada SEO</h1>
			<p>
				{TABS.map((t) => (
					<Nut key={t.key} dangChon={tab === t.key} onClick={() => doiTab(t.key)} style={{ marginRight: 8 }}>
						{t.label}
					</Nut>
				))}
			</p>

			{tab === "radar" &&
				(!dl ? (
					<ChuaCoDuLieu loi={loi} />
				) : (
					<>
						<OTinhTrang ds={dl.tinhTrang} />
						{thongBao && <p style={{ color: "#15803d", fontWeight: 600 }}>{thongBao}</p>}
						{loi && <p style={{ color: "#b91c1c" }}>{loi}</p>}
						{dl.canhBaoCaDem && <p style={{ color: "#b91c1c", fontWeight: 600 }}>⚠ Hơn 26 giờ chưa có ca radar thành công — xem nhật ký bên dưới.</p>}
						{dl.canhBaoClaude && (
							<p style={{ color: "#b91c1c", fontWeight: 600 }}>
								⚠ {dl.choAi} trang chờ Gravity đọc mà 26 giờ qua Gravity chưa đọc trang nào — khả năng: routine
								không chạy (xem lịch sử chạy ở claude.ai/code/routines), khoá RADA_SEO_MCP_TOKEN sai/thu hồi/hết
								hạn, hoặc môi trường routine chặn mạng tới kinhlac.online.
							</p>
						)}
						{!dl.caDemBat && <p style={{ color: "#92400e" }}>Máy này không bật RADA_SEO_CA_DEM: chỉ chạy thử được, ca đêm thật chạy trên VPS.</p>}
						<p>
							{/* Cron dò MỖI GIỜ và chỉ chạy ca ở tick 19:30 UTC (xem LICH_RADAR) → nextRunAt là tick kế, không phải ca kế. */}
							Lịch đêm: {lichRadar ? `02:30 hằng ngày (cron dò mỗi giờ) · tick kế ${gio(lichRadar.nextRunAt)} · tick trước ${gio(lichRadar.lastRunAt)}` : "chưa bật"}{" "}
							<Nut chinh={!lichRadar} onClick={() => lam("lich-bat")}>{lichRadar ? "Hẹn lại" : "Bật lịch"}</Nut>{" "}
							<Nut disabled={dl.dangChay} onClick={() => lam("ca-chay", { ghi: false }).then(() => setTimeout(tai, 2000))}>Chạy thử</Nut>{" "}
							<Nut chinh disabled={dl.dangChay || !dl.caDemBat} onClick={() => lam("ca-chay", { ghi: true }).then(() => setTimeout(tai, 2000))}>Chạy thật</Nut>{" "}
							{dl.dangChay && "· đang chạy…"} <Nut onClick={tai}>Tải lại</Nut>
						</p>

						<h2>Đối thủ</h2>
						<form
							onSubmit={(e) => {
								e.preventDefault();
								goi("doi-thu-luu", form).then(
									(r) => {
										setForm({ tenMien: "", ten: "", laCuaMinh: false });
										setThongBao(r?.caDauTien ? "Đã bắt đầu ca radar đầu tiên — vài phút nữa bấm “Tải lại”." : "");
										tai();
										// Ca đầu vừa thả chạy nền: tải lại sau chốc lát để thấy "đang chạy".
										if (r?.caDauTien) setTimeout(tai, 2000);
									},
									(e) => setLoi(loiCua(e)),
								);
							}}
						>
							<input placeholder="tên miền, vd vinmec.com" value={form.tenMien} onChange={(e) => setForm({ ...form, tenMien: e.target.value })} />{" "}
							<input placeholder="tên hiển thị" value={form.ten} onChange={(e) => setForm({ ...form, ten: e.target.value })} />{" "}
							<label>
								<input type="checkbox" checked={form.laCuaMinh} onChange={(e) => setForm({ ...form, laCuaMinh: e.target.checked })} /> site của mình
							</label>{" "}
							<Nut chinh type="submit">Lưu</Nut>
						</form>
						<table style={{ borderCollapse: "collapse", width: "100%", marginTop: 8 }}>
							<thead>
								<tr><th style={o}>Tên miền</th><th style={o}>Chờ trích</th><th style={o}>Chờ Gravity đọc</th><th style={o}>Đã phân tích</th><th style={o}>Ngoài ngành</th><th style={o}>Lỗi</th><th style={o}></th></tr>
							</thead>
							<tbody>
								{dl.doiThu.map((d) => (
									<tr key={d.id}>
										<td style={o}>{d.ten} {d.laCuaMinh && <b>(của mình)</b>}</td>
										<td style={o}>{d.dem.cho}</td><td style={o}>{d.dem.cho_ai}</td><td style={o}>{d.dem.da_phan_tich}</td><td style={o}>{d.dem.ngoai_nganh}</td><td style={o}>{d.dem.loi}</td>
										<td style={o}>
												{d.dem.loi > 0 && <Nut onClick={() => lam("url-dat-lai", { tenMien: d.id })}>Thử lại URL lỗi</Nut>}{" "}
												<Nut onClick={() => confirm(`Xoá ${d.id} và mọi URL của nó?`) && lam("doi-thu-xoa", { tenMien: d.id })}>Xoá</Nut>
											</td>
									</tr>
								))}
							</tbody>
						</table>

						<h2>Khoảng trống ({dl.cum.length})</h2>
						<table style={{ borderCollapse: "collapse", width: "100%" }}>
							<thead>
								<tr><th style={o}>Điểm</th><th style={o}>Cụm chủ đề</th><th style={o}>Từ khoá</th><th style={o}>Đối thủ / bài</th><th style={o}>Trạng thái</th><th style={o}></th></tr>
							</thead>
							<tbody>
								{dl.cum.map((c) => (
									<tr key={c.id} style={{ opacity: c.trangThai === "bo_qua" ? 0.5 : 1 }}>
										<td style={o}>{c.diem}{c.coXuHuong && " 📈"}{c.viPham && " ⚠"}</td>
										<td style={o}>{c.tenCum}</td>
										<td style={o}>{(c.tuKhoa ?? []).join(", ")}</td>
										<td style={o}>{c.soDoiThu} / {c.soBai}</td>
										<td style={o}>{NHAN_CUM[c.trangThai] ?? c.trangThai}</td>
										<td style={o}>
											{c.trangThai === "cho_viet" && <Nut onClick={() => lam("cum-trang-thai", { id: c.id, trangThai: "bo_qua" })}>Bỏ qua</Nut>}
											{c.trangThai === "bo_qua" && <Nut onClick={() => lam("cum-trang-thai", { id: c.id, trangThai: "cho_viet" })}>Khôi phục</Nut>}
										</td>
									</tr>
								))}
							</tbody>
						</table>
						<p style={{ fontSize: 12, color: "#666" }}>📈 trúng xu hướng tìm kiếm · ⚠ nghiêng chữa trị / hứa kết quả (bị trừ điểm)</p>

						<h2>Nhật ký ca</h2>
						<table style={{ borderCollapse: "collapse", width: "100%" }}>
							<thead>
								<tr><th style={o}>Bắt đầu</th><th style={o}>Ca</th><th style={o}>URL mới</th><th style={o}>Trích / Gravity đọc</th><th style={o}>Ngoài ngành</th><th style={o}>Cụm</th><th style={o}>Đo lại leo top</th><th style={o}>Lỗi</th><th style={o}>Thông tin</th></tr>
							</thead>
							<tbody>
								{dl.ca.map((c) => (
									<tr key={`${c.batDau}-${c.loai}-${c.kieu ?? ""}-${c.slug ?? ""}`}>
										<td style={o}>{gio(c.batDau)}</td><td style={o}>{c.loai === "indexnow" ? (c.kieu === "go" ? "IndexNow (gỡ bài)" : "IndexNow (đăng bài)") : c.loai === "claude" ? "Gravity đọc" : c.ghi ? "radar" : "radar (thử)"}</td>
										<td style={o}>{c.soUrlMoi ?? "—"}</td><td style={o}>{c.loai === "claude" ? c.soDoc : c.soTrich ?? "—"}</td><td style={o}>{c.soNgoaiNganh ?? "—"}</td>
										<td style={o}>{c.soCum ?? "—"}</td>
										<td style={o}>{c.soDoLai ?? "—"}</td>
										<td style={{ ...o, color: "#b91c1c" }}>{(c.loi ?? []).join(" · ")}</td>
										{/* thongTin: điều ca cố ý bỏ qua (vd chưa cấu hình Search Console) — không phải lỗi. */}
										<td style={{ ...o, color: "#6b7280" }}>{(c.thongTin ?? []).join(" · ")}</td>
									</tr>
								))}
							</tbody>
						</table>
					</>
				))}

			{tab === "huong" && <CumNguNghiaTab dl={cnDl} loi={cnLoi} onTai={taiCN} onSangTab={doiTab} />}

			{tab === "ke-hoach" && (
				<KeHoachTab
					dl={clDl}
					loi={cLoi}
					onDuyet={(id) => lamCL("ke-hoach-dat", { id, trangThai: "da_duyet" })}
					onBo={(id, lyDo) => lamCL("ke-hoach-dat", { id, trangThai: "bo_qua", lyDoBo: lyDo })}
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
					onDaSua={(id, ngay) => goi("leo-top-da-sua", { id, ngay }).then(taiLT, (e) => setLtLoi(loiCua(e)))}
				/>
			)}

			{tab === "khoang-trong" && <KhoangTrongTab dl={ktDl} loi={ktLoi} onTai={taiKT} onSangTab={doiTab} />}

			{tab === "nhap" && <NhapTab dl={nhDl} loi={nhLoi} onTai={taiNh} />}
		</div>
	);
}

export const pages = { "/rada": RadaSeo };
