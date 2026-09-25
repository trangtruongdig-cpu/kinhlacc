// traCuu.ts — Các phép tra cứu của thư viện, đọc từ bảng chỉ mục td_muc.

import { truyVan } from "./csdl";

export interface MucThuVien {
	bo: string;
	nhan: string;
	duong_dan: string;
	mo_ta: string;
	thu_tu: number;
	so_muc: number;
}

export interface KetQua {
	bo: string;
	nhan: string;
	duong_dan: string;
	slug: string;
	tieu_de: string;
	ten_khac: string;
	tom_tat: string;
	diem: number;
}

/** Bảng mục lục thư viện kèm số mục từ mỗi mục. */
export async function danhSachMuc(): Promise<MucThuVien[]> {
	return truyVan<MucThuVien>(`
		SELECT ch.bo, ch.nhan, ch.duong_dan, ch.mo_ta, ch.thu_tu,
		       COALESCE(d.n, 0)::int AS so_muc
		FROM td_cau_hinh ch
		LEFT JOIN (SELECT bo, count(*) n FROM td_muc GROUP BY bo) d ON d.bo = ch.bo
		WHERE ch.bo <> 'bai_viet'
		ORDER BY ch.thu_tu
	`);
}

export async function mucTheoBo(bo: string): Promise<MucThuVien | null> {
	const r = await danhSachMuc();
	return r.find((x) => x.bo === bo) ?? null;
}

/**
 * Tra một từ khoá.
 *
 * Thang điểm xếp trên xuống: trùng khít tên → tên bắt đầu bằng từ khoá → khớp tên gọi
 * khác → tên có chứa → chỉ khớp trong thân bài. Trong cùng một bậc mới xét tới ts_rank_cd.
 *
 * tsv đã đánh trọng số A/B/C (tiêu đề / tên khác / thân bài), nên trọng số truyền vào
 * ts_rank_cd theo thứ tự {D,C,B,A}.
 */
export async function traCuu(
	tu: string,
	{ bo, gioiHan = 60 }: { bo?: string; gioiHan?: number } = {},
): Promise<KetQua[]> {
	const t = tu.trim();
	if (!t) return [];
	// Tra theo CỤM LIỀN. Đo trên kho thật: "tri ho" ghép rời ra 146 mục, ghép liền còn 8;
	// "phong thap" 123 → 17. Bỏ dấu xong thì "mat" trúng cả "mắt", "ngu" trúng cả "ngũ",
	// nên ghép rời gần như quét trúng mọi bài dài.
	//
	// ⚠️ ĐỪNG thêm lưới "không thấy thì ghép rời": đã thử và hỏng. Gõ một câu vô nghĩa
	// như "khong co tu nay dau" thì năm từ thông dụng AND lại với nhau, bài dài nào cũng
	// đủ cả năm → 120+ kết quả rác thay vì một câu "không tìm thấy" thành thật. Khi không
	// có gì khớp, trang kết quả gọi goiYTheoTung() để mách mục từ gần đúng.
	return chay(t, bo, gioiHan, "phraseto_tsquery");
}

/**
 * Khi tra không ra gì: tách từ khoá thành từng chữ rồi mách những mục từ có TÊN dính
 * tới. Thà nói "không có, hay là mục này?" còn hơn đổ ra một trang khớp vu vơ.
 */
export async function goiYTheoTung(tu: string, gioiHan = 8): Promise<KetQua[]> {
	const tu_le = tu
		.trim()
		.split(/\s+/)
		.filter((x) => x.length >= 2)
		.slice(0, 4);
	if (!tu_le.length) return [];

	const gom = new Map<string, KetQua>();
	for (const x of tu_le) {
		for (const k of await goiY(x, 4)) gom.set(`${k.bo}/${k.slug}`, k);
	}
	return [...gom.values()].slice(0, gioiHan);
}

async function chay(
	t: string,
	bo: string | undefined,
	gioiHan: number,
	hamHoi: "phraseto_tsquery" | "plainto_tsquery",
): Promise<KetQua[]> {
	return truyVan<KetQua>(
		`
		WITH q AS (
			SELECT td_bo_dau($1) AS k,
			       ${hamHoi}('simple', td_bo_dau($1)) AS tq,
			       plainto_tsquery('simple', td_bo_dau($1)) AS tq_roi
		)
		SELECT m.bo, ch.nhan, ch.duong_dan, m.slug, m.tieu_de, m.ten_khac, m.tom_tat,
			CASE
				WHEN m.khoa = q.k                            THEN 100
				WHEN m.khoa LIKE q.k || '%'                  THEN 90
				WHEN m.khoa_khac LIKE '%' || q.k || '%'      THEN 80
				WHEN m.khoa LIKE '%' || q.k || '%'           THEN 70
				-- Mọi chữ đều nằm trong TÊN nhưng không liền nhau: "kinh phe" phải ra
				-- "Kinh Thủ Thái âm Phế". Trọng số {D,C,B,A} = {0,0,0,1} nên chỉ tính
				-- phần A, tức chỉ xét tiêu đề, không xét thân bài.
				WHEN ts_rank_cd('{0,0,0,1}', m.tsv, q.tq_roi) > 0 THEN 60
				ELSE 40
			END AS diem
		FROM td_muc m
		JOIN td_cau_hinh ch ON ch.bo = m.bo
		CROSS JOIN q
		WHERE ($2::text IS NULL OR m.bo = $2)
		  AND (
			m.khoa LIKE '%' || q.k || '%'
			OR m.khoa_khac LIKE '%' || q.k || '%'
			OR (q.tq IS NOT NULL AND m.tsv @@ q.tq)
			OR ts_rank_cd('{0,0,0,1}', m.tsv, q.tq_roi) > 0
		  )
		ORDER BY diem DESC,
			ts_rank_cd('{0.1,0.3,0.6,1.0}', m.tsv, q.tq) DESC,
			length(m.tieu_de), m.tieu_de
		LIMIT $3
	`,
		[t, bo ?? null, gioiHan],
	);
}

/** Các chữ cái đang có mục từ, cho thanh A–Z. */
export async function chuCaiCua(bo: string): Promise<{ chu_cai: string; n: number }[]> {
	return truyVan(
		`SELECT chu_cai, count(*)::int AS n FROM td_muc WHERE bo = $1 GROUP BY 1 ORDER BY 1`,
		[bo],
	);
}

/** Duyệt mục từ: lọc theo chữ cái và/hoặc thẻ đặc tính. */
export async function duyet(
	bo: string,
	{
		chuCai, the, trang = 1, moiTrang = 200,
	}: { chuCai?: string; the?: string; trang?: number; moiTrang?: number } = {},
): Promise<{ muc: KetQua[]; tong: number }> {
	const lech = (Math.max(1, trang) - 1) * moiTrang;
	const tham: unknown[] = [bo];
	let dk = "";
	if (chuCai) { tham.push(chuCai); dk += ` AND m.chu_cai = $${tham.length}`; }
	if (the) {
		tham.push(the);
		dk += ` AND EXISTS (SELECT 1 FROM td_nhan n WHERE n.bo = m.bo AND n.ma = m.ma AND n.ma_the = $${tham.length})`;
	}

	const [muc, dem] = await Promise.all([
		truyVan<KetQua>(
			`SELECT m.bo, ch.nhan, ch.duong_dan, m.slug, m.tieu_de, m.ten_khac, m.tom_tat, 0 AS diem
			 FROM td_muc m JOIN td_cau_hinh ch ON ch.bo = m.bo
			 WHERE m.bo = $1 ${dk}
			 ORDER BY m.tieu_de
			 LIMIT ${moiTrang} OFFSET ${lech}`,
			tham,
		),
		truyVan<{ n: number }>(
			`SELECT count(*)::int AS n FROM td_muc m WHERE m.bo = $1 ${dk}`,
			tham,
		),
	]);
	return { muc, tong: dem[0]?.n ?? 0 };
}

export interface TheLoc {
	nhom: string;
	ten: string;
	ma_the: string;
	n: number;
}

/**
 * Các thẻ lọc của một mục, kèm số mục từ mang thẻ đó.
 *
 * Gom theo MÃ THẺ, không theo tên hiển thị. Dữ liệu di sản viết cùng một thẻ nhiều
 * kiểu — "Hơi hàn" 94, "Hơi Hàn" 9, "hơi Hàn" 1 — nên gom theo tên thì ra ba chip,
 * mỗi chip đếm thiếu, trong khi bấm vào lại lọc ra đủ 104. Lấy cách viết phổ biến
 * nhất làm nhãn.
 */
export async function theLocCua(bo: string): Promise<TheLoc[]> {
	return truyVan<TheLoc>(
		`SELECT ma_the,
		        (array_agg(ten ORDER BY dem DESC, ten))[1]  AS ten,
		        (array_agg(nhom ORDER BY dem DESC, nhom))[1] AS nhom,
		        sum(dem)::int AS n
		 FROM (
		   SELECT ma_the, ten, nhom, count(*)::int AS dem
		   FROM td_nhan WHERE bo = $1
		   GROUP BY 1, 2, 3
		 ) x
		 GROUP BY ma_the
		 ORDER BY min(nhom), sum(dem) DESC`,
		[bo],
	);
}

/** Gợi ý gõ tới đâu hiện tới đó — chỉ khớp TÊN, không lục thân bài cho nhanh. */
export async function goiY(tu: string, gioiHan = 8): Promise<KetQua[]> {
	const t = tu.trim();
	if (!t) return [];
	return truyVan<KetQua>(
		`
		WITH q AS (SELECT td_bo_dau($1) AS k)
		SELECT m.bo, ch.nhan, ch.duong_dan, m.slug, m.tieu_de, m.ten_khac, '' AS tom_tat,
			CASE WHEN m.khoa = q.k THEN 100
			     WHEN m.khoa LIKE q.k || '%' THEN 90
			     WHEN m.khoa_khac LIKE q.k || '%' OR m.khoa_khac LIKE '% ' || q.k || '%' THEN 80
			     ELSE 70 END AS diem
		FROM td_muc m JOIN td_cau_hinh ch ON ch.bo = m.bo CROSS JOIN q
		WHERE m.khoa LIKE '%' || q.k || '%' OR m.khoa_khac LIKE '%' || q.k || '%'
		ORDER BY diem DESC, length(m.tieu_de), m.tieu_de
		LIMIT $2
	`,
		[t, gioiHan],
	);
}

/** Tổng số mục từ toàn thư viện (không tính bài viết). */
export async function tongSoMuc(): Promise<number> {
	const r = await truyVan<{ n: number }>(
		`SELECT count(*)::int AS n FROM td_muc WHERE bo <> 'bai_viet'`,
	);
	return r[0]?.n ?? 0;
}

/** Chữ cái đầu của một mục từ — để cột trái mở sẵn đúng vần đang xem. */
export async function chuCaiCuaMuc(bo: string, slug: string): Promise<string | undefined> {
	const r = await truyVan<{ chu_cai: string }>(
		`SELECT chu_cai FROM td_muc WHERE bo = $1 AND slug = $2 LIMIT 1`,
		[bo, slug],
	);
	return r[0]?.chu_cai;
}
