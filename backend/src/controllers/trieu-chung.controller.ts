import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { TrieuChung } from '../models/trieu-chung.model';
import { CreateTrieuChungDto, UpdateTrieuChungDto } from '../models/trieu-chung.dto';

export interface PaginatedTrieuChung {
  data: TrieuChung[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TrieuChungWithStats {
  id: number;
  ten_trieu_chung: string;
  /** matched = chip đến từ ≥1 Pháp Trị thuộc bộ lọc đang chọn (để UI in đậm "đúng filter", còn lại làm mờ). */
  benhTayYList: Array<{
    id: number;
    ten_benh: string;
    matched: boolean;
    chungBenh: string | null;
    chungBenhId: number | null;
  }>;
  baiThuocList: Array<{ id: number; ten_bai_thuoc: string; matched: boolean }>;
  /** phapTriId = một Pháp Trị đại diện (ưu tiên khớp filter) chứa thể bệnh này — để UI deeplink mở Pháp Trị. */
  theBenhList: Array<{ ten: string; matched: boolean; phapTriId: number | null }>;
  benhTayYCount: number;
  baiThuocCount: number;
  theBenhCount: number;
  /** Độ phổ biến = số bệnh Tây Y + số bài thuốc tham chiếu (dùng để sắp xếp giảm dần). */
  doPhoBien: number;
}

/** Bộ lọc cấu trúc cho tab Triệu Chứng — tất cả áp lên Pháp Trị (vì triệu chứng thừa hưởng qua Pháp Trị). */
export interface TrieuChungFilter {
  category?: 'all' | 'dong-y' | 'tay-y';
  tangPhuIds?: number[];
  tonThuong?: string[];
  /** Chủng Bệnh (Thể Bệnh Tây Y) — chỉ áp khi category = 'tay-y'. */
  chungBenhIds?: number[];
}

export interface TrieuChungStatsResult {
  data: TrieuChungWithStats[];
  /** Tạng Phủ (kinh mạch) xuất hiện trên các Pháp Trị có triệu chứng — option cho bộ lọc. */
  tangPhuOptions: Array<{ id: number; name: string }>;
  /** Tổn Thương - Tác Nhân (catalog) — option cho bộ lọc. */
  tonThuongOptions: Array<{ id: number; name: string }>;
  /** Chủng Bệnh (Thể Bệnh Tây Y) có bệnh Tây Y dẫn xuất từ Pháp Trị có triệu chứng — option cho bộ lọc (chỉ dùng khi category = 'tay-y'). */
  chungBenhOptions: Array<{ id: number; name: string }>;
}

/** Một triệu chứng khớp trong kết quả chẩn đoán. */
export interface DiagnosisMatchedSymptom {
  id: number;
  ten_trieu_chung: string;
}

/** Pháp trị thành phần của một thể bệnh (cột Đông Y) — để mở/đối chiếu. */
export interface DiagnosisPhapTriRef {
  id: number;
  nguyen_tac: string | null;
  matchedCount: number;
}

/** Pháp trị cầu nối dẫn tới một bệnh Tây Y (cột Tây Y) — để đối chiếu chuỗi. */
export interface DiagnosisViaRef {
  /** id pháp trị cầu nối. */
  id: number;
  /** thể bệnh (Đông Y) của pháp trị cầu nối. */
  label: string;
  percent: number;
}

/** Một ứng viên (thể bệnh Đông Y hoặc bệnh Tây Y) trong kết quả chẩn đoán. */
export interface DiagnosisCandidate {
  /** Đông Y: id pháp trị đại diện (điểm cao nhất trong thể bệnh). Tây Y: id bệnh Tây Y. */
  id: number;
  /** Nhãn chính: tên thể bệnh (Đông Y) hoặc tên bệnh (Tây Y). */
  label: string;
  /** Nhãn phụ: nguyên tắc của pháp trị đại diện (Đông Y) — null với Tây Y. */
  subLabel: string | null;
  /** Nhóm: tên chủng bệnh = "Thể Bệnh Lớn" (Tây Y) — null với Đông Y. */
  groupLabel: string | null;
  groupId: number | null;
  /** Điểm tin cậy trong [0,1]. Đông Y: cosine(IDF)×coverage trên hợp tập triệu chứng thể bệnh.
   *  Tây Y: max điểm của pháp trị cầu nối (lan theo chuỗi). */
  score: number;
  /** Phần trăm hiển thị = round(score * 100). */
  percent: number;
  /** Số triệu chứng ĐÃ CHỌN mà ứng viên này giải thích được. */
  matchedCount: number;
  /** Tổng số triệu chứng đã chọn (mẫu số chung để dễ đối chiếu giữa các ứng viên). */
  total: number;
  matched: DiagnosisMatchedSymptom[];
  /** Đông Y: các pháp trị cùng thể bệnh (≥1), xếp theo điểm giảm dần. */
  members?: DiagnosisPhapTriRef[];
  /** Tây Y: các pháp trị cầu nối (tối đa 3), xếp theo điểm giảm dần. */
  via?: DiagnosisViaRef[];
}

export interface DiagnosisResult {
  /** Các triệu chứng đầu vào hợp lệ (đã có trong DB). */
  input: DiagnosisMatchedSymptom[];
  /** Xếp hạng pháp trị theo thể bệnh (Đông Y) — đã cắt còn tối đa TOP_N. */
  phapTri: DiagnosisCandidate[];
  /** Tổng số pháp trị khớp ≥1 triệu chứng (trước khi cắt TOP_N) — để báo "đang hiển thị X/total". */
  phapTriTotal: number;
  /** Xếp hạng bệnh Tây Y — đã cắt còn tối đa TOP_N. */
  benhTayY: DiagnosisCandidate[];
  /** Tổng số bệnh Tây Y khớp ≥1 triệu chứng (trước khi cắt TOP_N). */
  benhTayYTotal: number;
}

@Injectable()
export class TrieuChungService {
  constructor(
    @InjectRepository(TrieuChung)
    private readonly repo: Repository<TrieuChung>,
  ) {}

  findAll(): Promise<TrieuChung[]> {
    return this.repo.find({ order: { id: 'ASC' } });
  }

  /**
   * Danh sách triệu chứng kèm thống kê quan hệ cho tab "Triệu Chứng", có BỘ LỌC cấu trúc.
   *
   * Mô hình: triệu chứng "chỉ ở bên Pháp Trị" → thừa hưởng bài thuốc/thể bệnh/bệnh Tây Y QUA Pháp Trị:
   * - bài thuốc: bài thuốc của các Pháp Trị chứa triệu chứng (bai_thuoc_phap_tri ∪ phap_tri.id_bai_thuoc).
   * - thể bệnh: ưu tiên entity the_benh (qua Bệnh Đông Y), fallback text chung_trang (pt.the_benh).
   * - bệnh Tây Y: trực tiếp benh_tay_y_phap_tri + qua bài thuốc benh_tay_y_bai_thuoc.
   *
   * Bộ lọc (Tạng Phủ / Tổn Thương / Đông-Tây) áp lên Pháp Trị → CTE `matching_pt`. Khi CÓ lọc:
   * - chỉ giữ triệu chứng có ≥1 Pháp Trị khớp;
   * - mỗi chip gắn cờ `matched` = đến từ ≥1 Pháp Trị khớp (UI in đậm phần đúng filter, làm mờ phần còn lại).
   * Khi KHÔNG lọc: matching_pt = mọi Pháp Trị → matched=true toàn bộ, trả tất cả triệu chứng.
   */
  async findAllWithStats(filter: TrieuChungFilter = {}): Promise<TrieuChungStatsResult> {
    const category =
      filter.category === 'dong-y' || filter.category === 'tay-y' ? filter.category : 'all';
    const tangPhuIds = [
      ...new Set((filter.tangPhuIds ?? []).map((x) => Number(x)).filter((x) => Number.isFinite(x) && x > 0)),
    ];
    const tonThuong = [
      ...new Set((filter.tonThuong ?? []).map((s) => String(s).trim()).filter(Boolean)),
    ];
    // Chủng Bệnh (Thể Bệnh Tây Y) chỉ có nghĩa trong nhánh Tây Y — bỏ qua khi không phải 'tay-y'.
    const chungBenhIds =
      category === 'tay-y'
        ? [
            ...new Set(
              (filter.chungBenhIds ?? []).map((x) => Number(x)).filter((x) => Number.isFinite(x) && x > 0),
            ),
          ]
        : [];
    const hasFilter =
      category !== 'all' || tangPhuIds.length > 0 || tonThuong.length > 0 || chungBenhIds.length > 0;

    // Pháp trị có bệnh Tây Y liên quan (trực tiếp + qua bài thuốc) — cho category Đông Y / Tây Y.
    const tayYExists = `(
      EXISTS (SELECT 1 FROM benh_tay_y_phap_tri btypt WHERE btypt.id_phap_tri = pt.id)
      OR EXISTS (
        SELECT 1 FROM bai_thuoc_phap_tri btpt
        JOIN benh_tay_y_bai_thuoc btybt ON btybt.id_bai_thuoc = btpt.id_bai_thuoc
        WHERE btpt.id_phap_tri = pt.id
      )
    )`;
    const categoryClause =
      category === 'tay-y' ? tayYExists : category === 'dong-y' ? `NOT ${tayYExists}` : 'TRUE';

    const params: unknown[] = [];
    let tangPhuClause = 'TRUE';
    if (tangPhuIds.length) {
      params.push(tangPhuIds);
      tangPhuClause = `EXISTS (SELECT 1 FROM phap_tri_kinh_mach pkm WHERE pkm.id_phap_tri = pt.id AND pkm.id_kinh_mach = ANY($${params.length}))`;
    }
    let tonThuongClause = 'TRUE';
    if (tonThuong.length) {
      params.push(tonThuong.map((s) => s.toLowerCase()));
      tonThuongClause = `pt.luc_kinh IS NOT NULL AND EXISTS (
        SELECT 1 FROM unnest(string_to_array(pt.luc_kinh, ',')) AS u(v)
        WHERE LOWER(TRIM(u.v)) = ANY($${params.length})
      )`;
    }
    // Chủng Bệnh: pháp trị dẫn tới ≥1 bệnh Tây Y (trực tiếp ∪ qua bài thuốc) thuộc chủng bệnh đã chọn.
    let chungBenhClause = 'TRUE';
    if (chungBenhIds.length) {
      params.push(chungBenhIds);
      chungBenhClause = `(
        EXISTS (
          SELECT 1 FROM benh_tay_y_phap_tri btypt
          JOIN benh_tay_y b ON b.id = btypt.id_benh_tay_y
          WHERE btypt.id_phap_tri = pt.id AND b.id_chung_benh = ANY($${params.length})
        )
        OR EXISTS (
          SELECT 1 FROM bai_thuoc_phap_tri btpt
          JOIN benh_tay_y_bai_thuoc btybt ON btybt.id_bai_thuoc = btpt.id_bai_thuoc
          JOIN benh_tay_y b ON b.id = btybt.id_benh_tay_y
          WHERE btpt.id_phap_tri = pt.id AND b.id_chung_benh = ANY($${params.length})
        )
      )`;
    }
    const symptomFilter = hasFilter
      ? `WHERE EXISTS (SELECT 1 FROM phap_tri_trieu_chung x JOIN matching_pt m ON m.id = x.id_phap_tri WHERE x.id_trieu_chung = tc.id)`
      : '';

    const rows: Array<{
      id: number;
      ten_trieu_chung: string;
      benhTayYList:
        | Array<{ id: number; ten_benh: string; matched: boolean; chungBenh: string | null; chungBenhId: number | null }>
        | string
        | null;
      benhTayYCount: number;
      baiThuocList: Array<{ id: number; ten_bai_thuoc: string; matched: boolean }> | string | null;
      baiThuocCount: number;
      theBenhList: Array<{ ten: string; matched: boolean; phapTriId: number | null }> | string | null;
    }> = await this.repo.query(
      `
      WITH matching_pt AS (
        SELECT pt.id FROM phap_tri pt
        WHERE ${categoryClause} AND ${tangPhuClause} AND ${tonThuongClause} AND ${chungBenhClause}
      )
      SELECT
        tc.id,
        tc.ten_trieu_chung,
        COALESCE(bty.benh_list, '[]'::json) AS "benhTayYList",
        COALESCE(bty.cnt, 0)::int           AS "benhTayYCount",
        COALESCE(bt.bai_thuoc_list, '[]'::json) AS "baiThuocList",
        COALESCE(bt.cnt, 0)::int            AS "baiThuocCount",
        COALESCE(tb.the_benh_list, '[]'::json)  AS "theBenhList"
      FROM trieu_chung tc
      LEFT JOIN (
        -- Bệnh Tây Y qua Pháp Trị (trực tiếp + qua bài thuốc); matched = có ≥1 pháp trị khớp filter. Kèm Chủng Bệnh để UI nhóm.
        SELECT sub.tcid,
               json_agg(json_build_object('id', sub.bty_id, 'ten_benh', sub.ten_benh, 'matched', sub.matched,
                        'chungBenh', sub.cb_name, 'chungBenhId', sub.cb_id)
                        ORDER BY sub.matched DESC, sub.cb_name NULLS LAST, sub.ten_benh) AS benh_list,
               COUNT(*) AS cnt
        FROM (
          SELECT ptc.id_trieu_chung AS tcid, b.id AS bty_id, b.ten_benh,
                 b.id_chung_benh AS cb_id, cb.ten_chung_benh AS cb_name,
                 bool_or(m.id IS NOT NULL) AS matched
          FROM phap_tri_trieu_chung ptc
          JOIN (
            SELECT btypt.id_phap_tri AS pt_id, btypt.id_benh_tay_y AS bty_id FROM benh_tay_y_phap_tri btypt
            UNION
            SELECT btpt.id_phap_tri AS pt_id, btybt.id_benh_tay_y AS bty_id
            FROM bai_thuoc_phap_tri btpt JOIN benh_tay_y_bai_thuoc btybt ON btybt.id_bai_thuoc = btpt.id_bai_thuoc
          ) ptb ON ptb.pt_id = ptc.id_phap_tri
          JOIN benh_tay_y b ON b.id = ptb.bty_id
          LEFT JOIN chung_benh cb ON cb.id = b.id_chung_benh
          LEFT JOIN matching_pt m ON m.id = ptb.pt_id
          GROUP BY ptc.id_trieu_chung, b.id, b.ten_benh, b.id_chung_benh, cb.ten_chung_benh
        ) sub
        GROUP BY sub.tcid
      ) bty ON bty.tcid = tc.id
      LEFT JOIN (
        -- Bài thuốc qua Pháp Trị (bai_thuoc_phap_tri ∪ phap_tri.id_bai_thuoc); matched = có ≥1 pháp trị khớp filter.
        SELECT sub.tcid,
               json_agg(json_build_object('id', sub.id, 'ten_bai_thuoc', sub.ten_bai_thuoc, 'matched', sub.matched)
                        ORDER BY sub.matched DESC, sub.ten_bai_thuoc) AS bai_thuoc_list,
               COUNT(*) AS cnt
        FROM (
          SELECT ptc.id_trieu_chung AS tcid, b.id, b.ten_bai_thuoc,
                 bool_or(m.id IS NOT NULL) AS matched
          FROM phap_tri_trieu_chung ptc
          JOIN (
            SELECT id_phap_tri AS pt_id, id_bai_thuoc FROM bai_thuoc_phap_tri
            UNION
            SELECT id AS pt_id, id_bai_thuoc FROM phap_tri WHERE id_bai_thuoc IS NOT NULL
          ) src ON src.pt_id = ptc.id_phap_tri
          JOIN bai_thuoc b ON b.id = src.id_bai_thuoc
          LEFT JOIN matching_pt m ON m.id = src.pt_id
          GROUP BY ptc.id_trieu_chung, b.id, b.ten_bai_thuoc
        ) sub
        GROUP BY sub.tcid
      ) bt ON bt.tcid = tc.id
      LEFT JOIN (
        -- Thể bệnh: ưu tiên entity the_benh (qua Bệnh Đông Y), fallback text chung_trang; matched theo pháp trị khớp filter.
        -- phapTriId = một pháp trị đại diện (ưu tiên pháp trị khớp filter) chứa thể bệnh này — để UI deeplink mở Pháp Trị.
        SELECT sub.tcid,
               json_agg(json_build_object('ten', sub.lbl, 'matched', sub.matched, 'phapTriId', sub.pt_id)
                        ORDER BY sub.matched DESC, sub.lbl) AS the_benh_list
        FROM (
          SELECT ptc.id_trieu_chung AS tcid, src.lbl,
                 bool_or(m.id IS NOT NULL) AS matched,
                 (array_agg(pt.id ORDER BY (m.id IS NOT NULL) DESC, pt.id))[1] AS pt_id
          FROM phap_tri_trieu_chung ptc
          JOIN phap_tri pt ON pt.id = ptc.id_phap_tri
          LEFT JOIN matching_pt m ON m.id = pt.id
          CROSS JOIN LATERAL (
            SELECT tbe.ten_the_benh AS lbl
            FROM benh_dong_y_phap_tri bdpt
            JOIN the_benh tbe ON tbe.id_benh = bdpt.id_benh_dong_y
            WHERE bdpt.id_phap_tri = pt.id
            UNION
            SELECT TRIM(s) AS lbl
            FROM regexp_split_to_table(COALESCE(pt.the_benh, ''), '[,;|]') AS s
            WHERE TRIM(s) <> ''
          ) src
          WHERE src.lbl IS NOT NULL AND TRIM(src.lbl) <> ''
          GROUP BY ptc.id_trieu_chung, src.lbl
        ) sub
        GROUP BY sub.tcid
      ) tb ON tb.tcid = tc.id
      ${symptomFilter}
      ORDER BY (COALESCE(bty.cnt, 0) + COALESCE(bt.cnt, 0)) DESC, tc.ten_trieu_chung ASC
      `,
      params,
    );

    const parseJson = <T>(v: T[] | string | null): T[] => {
      if (Array.isArray(v)) return v;
      if (typeof v === 'string') {
        try {
          return JSON.parse(v) as T[];
        } catch {
          return [];
        }
      }
      return [];
    };

    const data: TrieuChungWithStats[] = rows.map((r) => {
      const benhTayYList = parseJson<{
        id: number;
        ten_benh: string;
        matched: boolean;
        chungBenh: string | null;
        chungBenhId: number | null;
      }>(r.benhTayYList);
      const baiThuocList = parseJson<{ id: number; ten_bai_thuoc: string; matched: boolean }>(r.baiThuocList);
      // Thể bệnh: gộp distinct (không phân biệt hoa/thường), OR cờ matched; sắp xếp matched-first rồi tiếng Việt.
      // phapTriId: ưu tiên giữ id của bản ghi matched (đúng filter) để deeplink mở đúng pháp trị trong bộ lọc.
      const tbMap = new Map<string, { ten: string; matched: boolean; phapTriId: number | null }>();
      for (const it of parseJson<{ ten: string; matched: boolean; phapTriId: number | null }>(r.theBenhList)) {
        const ten = String(it?.ten ?? '').trim();
        if (!ten) continue;
        const key = ten.toLowerCase();
        const ptId = it?.phapTriId != null ? Number(it.phapTriId) : null;
        const prev = tbMap.get(key);
        if (!prev) {
          tbMap.set(key, { ten, matched: !!it.matched, phapTriId: ptId });
        } else {
          if (it.matched && !prev.matched && ptId != null) prev.phapTriId = ptId;
          if (it.matched) prev.matched = true;
          if (prev.phapTriId == null && ptId != null) prev.phapTriId = ptId;
        }
      }
      const theBenhList = [...tbMap.values()].sort(
        (a, b) => Number(b.matched) - Number(a.matched) || a.ten.localeCompare(b.ten, 'vi'),
      );
      const benhTayYCount = Number(r.benhTayYCount) || 0;
      const baiThuocCount = Number(r.baiThuocCount) || 0;

      return {
        id: Number(r.id),
        ten_trieu_chung: r.ten_trieu_chung,
        benhTayYList,
        baiThuocList,
        theBenhList,
        benhTayYCount,
        baiThuocCount,
        theBenhCount: theBenhList.length,
        doPhoBien: benhTayYCount + baiThuocCount,
      };
    });

    // Option cho bộ lọc (độc lập filter hiện tại để danh sách lựa chọn không tự co lại).
    const tangPhuRows: Array<{ id: number; name: string }> = await this.repo.query(`
      SELECT DISTINCT km.id_kinh_mach AS id, km.ten_kinh_mach AS name
      FROM phap_tri_kinh_mach pkm
      JOIN kinh_mach km ON km.id_kinh_mach = pkm.id_kinh_mach
      WHERE EXISTS (SELECT 1 FROM phap_tri_trieu_chung ptc WHERE ptc.id_phap_tri = pkm.id_phap_tri)
      ORDER BY km.ten_kinh_mach
    `);
    const tonThuongRows: Array<{ id: number; name: string }> = await this.repo.query(`
      SELECT id, ten AS name FROM ton_thuong_tac_nhan ORDER BY ten
    `);
    // Chủng Bệnh có ≥1 bệnh Tây Y dẫn xuất từ một Pháp Trị mang triệu chứng (trực tiếp ∪ qua bài thuốc).
    const chungBenhRows: Array<{ id: number; name: string }> = await this.repo.query(`
      SELECT cb.id, cb.ten_chung_benh AS name
      FROM chung_benh cb
      WHERE EXISTS (
        SELECT 1 FROM benh_tay_y b
        WHERE b.id_chung_benh = cb.id AND (
          EXISTS (
            SELECT 1 FROM benh_tay_y_phap_tri btypt
            JOIN phap_tri_trieu_chung ptc ON ptc.id_phap_tri = btypt.id_phap_tri
            WHERE btypt.id_benh_tay_y = b.id
          )
          OR EXISTS (
            SELECT 1 FROM benh_tay_y_bai_thuoc btybt
            JOIN bai_thuoc_phap_tri btpt ON btpt.id_bai_thuoc = btybt.id_bai_thuoc
            JOIN phap_tri_trieu_chung ptc ON ptc.id_phap_tri = btpt.id_phap_tri
            WHERE btybt.id_benh_tay_y = b.id
          )
        )
      )
      ORDER BY cb.ten_chung_benh
    `);

    return {
      data,
      tangPhuOptions: tangPhuRows.map((o) => ({ id: Number(o.id), name: o.name })),
      tonThuongOptions: tonThuongRows.map((o) => ({ id: Number(o.id), name: o.name })),
      chungBenhOptions: chungBenhRows.map((o) => ({ id: Number(o.id), name: o.name })),
    };
  }

  /**
   * Suy luận chẩn đoán từ một tập triệu chứng đầu vào — MÔ HÌNH CHUỖI QUA PHÁP TRỊ.
   *
   * Đồng pha với tab Danh Sách (pháp-trị-centric): MỌI liên kết dẫn xuất QUA Pháp Trị,
   * KHÔNG dùng quan_he_benh_trieu_chung cho hướng triệu chứng → bệnh Tây Y.
   *
   *  Bước 1 — Chấm điểm PHÁP TRỊ theo độ khớp triệu chứng (cosine trọng số IDF × coverage):
   *    w(t) = ln(1 + N/df(t)); df(t) = số pháp trị chứa t, N = số pháp trị có ≥1 triệu chứng.
   *    Triệu chứng hiếm → trọng số lớn. score_pt = cosine(input, triệu chứng pháp trị) × m/(m+1).
   *  Bước 2 — ĐÔNG Y: gộp pháp trị theo Thể Bệnh (text the_benh), CỘNG DỒN bằng chứng —
   *    tính lại cosine trên HỢP tập triệu chứng của mọi pháp trị cùng thể bệnh.
   *  Bước 3 — TÂY Y: lan điểm theo chuỗi — mỗi bệnh Tây Y (đạt qua benh_tay_y_phap_tri ∪ qua
   *    bài thuốc) nhận score = max score_pt của các pháp trị cầu nối; kèm `via` để đối chiếu.
   *
   * Mẫu số `total` của cả hai cột = số triệu chứng đã chọn (đọc là "giải thích X/N").
   * Trả tối đa TOP_N mỗi cột (kèm tổng số trước khi cắt).
   */
  async diagnose(rawIds: number[]): Promise<DiagnosisResult> {
    const ids = Array.from(
      new Set(
        (Array.isArray(rawIds) ? rawIds : [])
          .map((x) => Number(x))
          .filter((n) => Number.isInteger(n) && n > 0),
      ),
    );
    const empty: DiagnosisResult = {
      input: [],
      phapTri: [],
      phapTriTotal: 0,
      benhTayY: [],
      benhTayYTotal: 0,
    };
    if (ids.length === 0) return empty;

    // Chỉ giữ những triệu chứng thực sự tồn tại (echo lại kèm tên).
    const inputRows: DiagnosisMatchedSymptom[] = await this.repo.query(
      `SELECT id, ten_trieu_chung FROM trieu_chung WHERE id = ANY($1) ORDER BY ten_trieu_chung`,
      [ids],
    );
    if (inputRows.length === 0) return empty;
    const inputIds = inputRows.map((r) => Number(r.id));
    const inputSet = new Set(inputIds);
    const nameById = new Map<number, string>(
      inputRows.map((r) => [Number(r.id), r.ten_trieu_chung]),
    );
    const total = inputRows.length;
    const emptyResult: DiagnosisResult = { ...empty, input: inputRows };

    // ---- Trọng số IDF trên kho Pháp Trị (df = số pháp trị chứa triệu chứng) ----
    const dfRows: Array<{ id_trieu_chung: number; df: string }> = await this.repo.query(
      `SELECT id_trieu_chung, COUNT(DISTINCT id_phap_tri)::text AS df
       FROM phap_tri_trieu_chung GROUP BY id_trieu_chung`,
    );
    const df = new Map<number, number>();
    for (const r of dfRows) df.set(Number(r.id_trieu_chung), Number(r.df));
    const nRows: Array<{ n: string }> = await this.repo.query(
      `SELECT COUNT(DISTINCT id_phap_tri)::text AS n FROM phap_tri_trieu_chung`,
    );
    const N = Number(nRows[0]?.n ?? 0);
    if (N === 0) return emptyResult;

    const weight = (tid: number): number => {
      const d = df.get(tid) ?? 0;
      return d > 0 ? Math.log(1 + N / d) : 0; // triệu chứng không thuộc pháp trị nào → 0
    };
    let inputNormSq = 0;
    for (const tid of inputIds) {
      const w = weight(tid);
      inputNormSq += w * w;
    }
    const inputNorm = Math.sqrt(inputNormSq);
    if (inputNorm === 0) return emptyResult; // không triệu chứng nào nằm trong pháp trị

    // ---- Pháp trị ứng viên (chứa ≥1 triệu chứng đầu vào) + tập triệu chứng đầy đủ ----
    const ptRows: Array<{
      pt_id: number;
      the_benh: string | null;
      nguyen_tac: string | null;
      sym_ids: number[] | null;
      sym_names: string[] | null;
    }> = await this.repo.query(
      `SELECT pt.id AS pt_id,
              NULLIF(TRIM(pt.the_benh), '') AS the_benh,
              pt.nguyen_tac                 AS nguyen_tac,
              array_agg(j.id_trieu_chung ORDER BY j.id_trieu_chung)   AS sym_ids,
              array_agg(tc.ten_trieu_chung ORDER BY j.id_trieu_chung) AS sym_names
       FROM phap_tri pt
       JOIN phap_tri_trieu_chung j ON j.id_phap_tri = pt.id
       JOIN trieu_chung tc ON tc.id = j.id_trieu_chung
       WHERE pt.id IN (
         SELECT id_phap_tri FROM phap_tri_trieu_chung WHERE id_trieu_chung = ANY($1)
       )
       GROUP BY pt.id`,
      [inputIds],
    );

    interface ScoredPt {
      id: number;
      theBenh: string | null;
      nguyenTac: string | null;
      fullIds: number[];
      matched: DiagnosisMatchedSymptom[];
      score: number;
    }
    const scoredPts: ScoredPt[] = [];
    for (const r of ptRows) {
      const fullIds = (r.sym_ids ?? []).map(Number);
      const names = (r.sym_names ?? []).map((s) => String(s));
      let candNormSq = 0;
      let dot = 0;
      const matched: DiagnosisMatchedSymptom[] = [];
      for (let i = 0; i < fullIds.length; i++) {
        const tid = fullIds[i];
        const w = weight(tid);
        candNormSq += w * w;
        if (inputSet.has(tid)) {
          dot += w * w;
          matched.push({ id: tid, ten_trieu_chung: names[i] ?? String(tid) });
        }
      }
      const candNorm = Math.sqrt(candNormSq);
      if (candNorm === 0 || matched.length === 0) continue;
      const cosine = dot / (inputNorm * candNorm);
      if (cosine <= 0) continue;
      scoredPts.push({
        id: Number(r.pt_id),
        theBenh: r.the_benh,
        nguyenTac: r.nguyen_tac,
        fullIds,
        matched,
        score: cosine * (matched.length / (matched.length + 1)),
      });
    }

    // ---- ĐÔNG Y: gộp theo Thể Bệnh, cộng dồn bằng chứng (cosine trên HỢP tập triệu chứng) ----
    interface TheBenhGroup {
      label: string;
      members: ScoredPt[];
    }
    const groups = new Map<string, TheBenhGroup>();
    for (const p of scoredPts) {
      // the_benh rỗng → mỗi pháp trị một nhóm riêng (không gộp các pháp trị "vô danh" với nhau).
      const key = p.theBenh ? p.theBenh.toLowerCase() : `__pt_${p.id}`;
      const label = p.theBenh ?? `Pháp trị #${p.id}`;
      const g = groups.get(key);
      if (g) g.members.push(p);
      else groups.set(key, { label, members: [p] });
    }
    const phapTriAll: DiagnosisCandidate[] = [];
    for (const g of groups.values()) {
      const unionIds = new Set<number>();
      for (const m of g.members) for (const id of m.fullIds) unionIds.add(id);
      let candNormSq = 0;
      let dot = 0;
      const matched: DiagnosisMatchedSymptom[] = [];
      for (const tid of unionIds) {
        const w = weight(tid);
        candNormSq += w * w;
        if (inputSet.has(tid)) {
          dot += w * w;
          matched.push({ id: tid, ten_trieu_chung: nameById.get(tid) ?? String(tid) });
        }
      }
      const candNorm = Math.sqrt(candNormSq);
      if (candNorm === 0 || matched.length === 0) continue;
      const score = (dot / (inputNorm * candNorm)) * (matched.length / (matched.length + 1));
      const members = [...g.members].sort((a, b) => b.score - a.score);
      const top = members[0];
      matched.sort((a, b) => a.ten_trieu_chung.localeCompare(b.ten_trieu_chung, 'vi'));
      phapTriAll.push({
        id: top.id,
        label: g.label,
        subLabel: top.nguyenTac ? String(top.nguyenTac).trim() : null,
        groupLabel: null,
        groupId: null,
        score,
        percent: Math.round(score * 100),
        matchedCount: matched.length,
        total,
        matched,
        members: members.map((m) => ({
          id: m.id,
          nguyen_tac: m.nguyenTac ? String(m.nguyenTac).trim() : null,
          matchedCount: m.matched.length,
        })),
      });
    }
    phapTriAll.sort(
      (a, b) =>
        b.score - a.score ||
        b.matchedCount - a.matchedCount ||
        a.label.localeCompare(b.label, 'vi'),
    );

    // ---- TÂY Y: lan điểm theo chuỗi qua Pháp Trị (trực tiếp ∪ qua bài thuốc) ----
    const benhTayYAll: DiagnosisCandidate[] = [];
    if (scoredPts.length) {
      const ptById = new Map<number, ScoredPt>(scoredPts.map((p) => [p.id, p]));
      const ptIds = scoredPts.map((p) => p.id);
      const mapRows: Array<{
        pt_id: number;
        bty_id: number;
        ten_benh: string;
        cb_id: number | null;
        cb_name: string | null;
      }> = await this.repo.query(
        `SELECT btypt.id_phap_tri AS pt_id, bty.id AS bty_id, bty.ten_benh,
                bty.id_chung_benh AS cb_id, cb.ten_chung_benh AS cb_name
         FROM benh_tay_y_phap_tri btypt
         JOIN benh_tay_y bty ON bty.id = btypt.id_benh_tay_y
         LEFT JOIN chung_benh cb ON cb.id = bty.id_chung_benh
         WHERE btypt.id_phap_tri = ANY($1)
         UNION
         SELECT btpt.id_phap_tri, bty.id, bty.ten_benh,
                bty.id_chung_benh, cb.ten_chung_benh
         FROM bai_thuoc_phap_tri btpt
         JOIN benh_tay_y_bai_thuoc btybt ON btybt.id_bai_thuoc = btpt.id_bai_thuoc
         JOIN benh_tay_y bty ON bty.id = btybt.id_benh_tay_y
         LEFT JOIN chung_benh cb ON cb.id = bty.id_chung_benh
         WHERE btpt.id_phap_tri = ANY($1)`,
        [ptIds],
      );

      interface BtyAgg {
        id: number;
        ten_benh: string;
        cbId: number | null;
        cbName: string | null;
        connecting: ScoredPt[];
        matchedIds: Set<number>;
      }
      const byBty = new Map<number, BtyAgg>();
      for (const r of mapRows) {
        const pt = ptById.get(Number(r.pt_id));
        if (!pt) continue;
        const btyId = Number(r.bty_id);
        let agg = byBty.get(btyId);
        if (!agg) {
          agg = {
            id: btyId,
            ten_benh: r.ten_benh,
            cbId: r.cb_id != null ? Number(r.cb_id) : null,
            cbName: r.cb_name,
            connecting: [],
            matchedIds: new Set<number>(),
          };
          byBty.set(btyId, agg);
        }
        agg.connecting.push(pt);
        for (const m of pt.matched) agg.matchedIds.add(m.id);
      }
      for (const agg of byBty.values()) {
        const connecting = [...agg.connecting].sort((a, b) => b.score - a.score);
        const score = connecting[0]?.score ?? 0;
        if (score <= 0 || agg.matchedIds.size === 0) continue;
        const matched = [...agg.matchedIds]
          .map((id) => ({ id, ten_trieu_chung: nameById.get(id) ?? String(id) }))
          .sort((a, b) => a.ten_trieu_chung.localeCompare(b.ten_trieu_chung, 'vi'));
        const via = connecting.slice(0, 3).map((p) => ({
          id: p.id,
          label: p.theBenh ?? `Pháp trị #${p.id}`,
          percent: Math.round(p.score * 100),
        }));
        benhTayYAll.push({
          id: agg.id,
          label: agg.ten_benh,
          subLabel: null,
          groupLabel: agg.cbName ? String(agg.cbName).trim() : null,
          groupId: agg.cbId,
          score,
          percent: Math.round(score * 100),
          matchedCount: matched.length,
          total,
          matched,
          via,
        });
      }
      benhTayYAll.sort(
        (a, b) =>
          b.score - a.score ||
          b.matchedCount - a.matchedCount ||
          a.label.localeCompare(b.label, 'vi'),
      );
    }

    const TOP = TrieuChungService.DIAGNOSIS_TOP_N;
    return {
      input: inputRows,
      phapTri: phapTriAll.slice(0, TOP),
      phapTriTotal: phapTriAll.length,
      benhTayY: benhTayYAll.slice(0, TOP),
      benhTayYTotal: benhTayYAll.length,
    };
  }

  /** Số ứng viên tối đa trả về mỗi loại. */
  private static readonly DIAGNOSIS_TOP_N = 20;

  async findPaginated(
    page: number = 1,
    limit: number = 20,
    search?: string,
  ): Promise<PaginatedTrieuChung> {
    const skip = (page - 1) * limit;
    const keyword = String(search || '').trim();
    const where = keyword
      ? { ten_trieu_chung: ILike(`%${keyword}%`) }
      : undefined;
    const [data, total] = await this.repo.findAndCount({
      where,
      skip,
      take: limit,
      order: { id: 'ASC' },
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findOne(id: number): Promise<TrieuChung> {
    const item = await this.repo.findOneBy({ id });
    if (!item) {
      throw new NotFoundException(`Triệu chứng #${id} không tồn tại`);
    }
    return item;
  }

  create(dto: CreateTrieuChungDto): Promise<TrieuChung> {
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  async update(id: number, dto: UpdateTrieuChungDto): Promise<TrieuChung> {
    const item = await this.findOne(id);
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async remove(id: number): Promise<void> {
    const item = await this.findOne(id);
    await this.repo.remove(item);
  }
}
