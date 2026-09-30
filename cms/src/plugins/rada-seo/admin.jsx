// Màn điều khiển Rada SEO trong /_emdash/admin/plugins/rada-seo/rada.
// Chỉ HIỂN THỊ và gọi route của plugin; mọi luật nằm phía máy chủ.
import { useCallback, useEffect, useState } from "react";

async function goi(route, body) {
	const res = await fetch(`/_emdash/api/plugins/rada-seo/${route}`, {
		method: "POST",
		credentials: "same-origin",
		// X-EmDash-Request là thứ CHỊU LỰC: thiếu nó production trả 403 CSRF_REJECTED.
		headers: { "Content-Type": "application/json", "X-EmDash-Request": "1" },
		body: JSON.stringify(body ?? {}),
	});
	const j = await res.json().catch(() => null);
	if (!res.ok || j?.success === false) throw new Error(j?.error?.message ?? `Lỗi ${res.status}`);
	return j?.data ?? j;
}

const NHAN_CUM = { cho_viet: "Chờ viết", co_nhap: "Có nháp", da_dang: "Đã đăng", bo_qua: "Bỏ qua", phu_boi_tu_dien: "Từ điển đã phủ" };
const gio = (s) => (s ? new Date(s).toLocaleString("vi-VN") : "—");
const o = { padding: "6px 8px", borderBottom: "1px solid #e5e5e5", textAlign: "left", verticalAlign: "top" };

function RadaSeo() {
	const [dl, setDl] = useState(null);
	const [loi, setLoi] = useState("");
	const [form, setForm] = useState({ tenMien: "", ten: "", laCuaMinh: false });

	const tai = useCallback(() => goi("tong-quan").then((d) => { setDl(d); setLoi(""); }, (e) => setLoi(e.message)), []);
	useEffect(() => {
		tai();
	}, [tai]);
	const lam = (route, body) => goi(route, body).then(tai, (e) => setLoi(e.message));

	if (!dl) return <div style={{ padding: 24 }}>{loi || "Đang tải…"}</div>;
	const lichRadar = dl.lich.find((l) => l.name === "radar");
	return (
		<div style={{ padding: 24, maxWidth: 1200 }}>
			<h1>Rada SEO</h1>
			{loi && <p style={{ color: "#b91c1c" }}>{loi}</p>}
			{dl.canhBaoCaDem && <p style={{ color: "#b91c1c", fontWeight: 600 }}>⚠ Hơn 26 giờ chưa có ca radar thành công — xem nhật ký bên dưới.</p>}
			{!dl.caDemBat && <p style={{ color: "#92400e" }}>Máy này không bật RADA_SEO_CA_DEM: chỉ chạy thử được, ca đêm thật chạy trên VPS.</p>}
			<p>
				Lịch đêm: {lichRadar ? `02:30 hằng ngày · lần tới ${gio(lichRadar.nextRunAt)} · lần trước ${gio(lichRadar.lastRunAt)}` : "chưa bật"}{" "}
				<button onClick={() => lam("lich-bat")}>{lichRadar ? "Hẹn lại" : "Bật lịch"}</button>{" "}
				<button disabled={dl.dangChay} onClick={() => lam("ca-chay", { ghi: false }).then(() => setTimeout(tai, 2000))}>Chạy thử</button>{" "}
				<button disabled={dl.dangChay || !dl.caDemBat} onClick={() => lam("ca-chay", { ghi: true }).then(() => setTimeout(tai, 2000))}>Chạy thật</button>{" "}
				{dl.dangChay && "· đang chạy…"} <button onClick={tai}>Tải lại</button>
			</p>

			<h2>Đối thủ</h2>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					lam("doi-thu-luu", form).then(() => setForm({ tenMien: "", ten: "", laCuaMinh: false }));
				}}
			>
				<input placeholder="tên miền, vd vinmec.com" value={form.tenMien} onChange={(e) => setForm({ ...form, tenMien: e.target.value })} />{" "}
				<input placeholder="tên hiển thị" value={form.ten} onChange={(e) => setForm({ ...form, ten: e.target.value })} />{" "}
				<label>
					<input type="checkbox" checked={form.laCuaMinh} onChange={(e) => setForm({ ...form, laCuaMinh: e.target.checked })} /> site của mình
				</label>{" "}
				<button type="submit">Lưu</button>
			</form>
			<table style={{ borderCollapse: "collapse", width: "100%", marginTop: 8 }}>
				<thead>
					<tr><th style={o}>Tên miền</th><th style={o}>Chờ</th><th style={o}>Đã phân tích</th><th style={o}>Ngoài ngành</th><th style={o}>Lỗi</th><th style={o}></th></tr>
				</thead>
				<tbody>
					{dl.doiThu.map((d) => (
						<tr key={d.id}>
							<td style={o}>{d.ten} {d.laCuaMinh && <b>(của mình)</b>}</td>
							<td style={o}>{d.dem.cho}</td><td style={o}>{d.dem.da_phan_tich}</td><td style={o}>{d.dem.ngoai_nganh}</td><td style={o}>{d.dem.loi}</td>
							<td style={o}><button onClick={() => confirm(`Xoá ${d.id} và mọi URL của nó?`) && lam("doi-thu-xoa", { tenMien: d.id })}>Xoá</button></td>
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
								{c.trangThai === "cho_viet" && <button onClick={() => lam("cum-trang-thai", { id: c.id, trangThai: "bo_qua" })}>Bỏ qua</button>}
								{c.trangThai === "bo_qua" && <button onClick={() => lam("cum-trang-thai", { id: c.id, trangThai: "cho_viet" })}>Khôi phục</button>}
							</td>
						</tr>
					))}
				</tbody>
			</table>
			<p style={{ fontSize: 12, color: "#666" }}>📈 trúng xu hướng tìm kiếm · ⚠ nghiêng chữa trị / hứa kết quả (bị trừ điểm)</p>

			<h2>Nhật ký ca</h2>
			<table style={{ borderCollapse: "collapse", width: "100%" }}>
				<thead>
					<tr><th style={o}>Bắt đầu</th><th style={o}>Kiểu</th><th style={o}>URL mới</th><th style={o}>Phân tích</th><th style={o}>Ngoài ngành</th><th style={o}>Lượt gọi</th><th style={o}>Cụm</th><th style={o}>Lỗi</th></tr>
				</thead>
				<tbody>
					{dl.ca.map((c) => (
						<tr key={c.batDau}>
							<td style={o}>{gio(c.batDau)}</td><td style={o}>{c.ghi ? "thật" : "thử"}</td>
							<td style={o}>{c.soUrlMoi ?? "—"}</td><td style={o}>{c.soPhanTich ?? "—"}</td><td style={o}>{c.soNgoaiNganh ?? "—"}</td>
							<td style={o}>{c.soLuotGoi ?? "—"}</td><td style={o}>{c.soCum ?? "—"}</td>
							<td style={{ ...o, color: "#b91c1c" }}>{(c.loi ?? []).join(" · ")}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

export const pages = { "/rada": RadaSeo };
