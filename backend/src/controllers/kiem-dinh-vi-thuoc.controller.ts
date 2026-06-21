import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ViThuoc } from '../models/vi-thuoc.model';
import { NhomNhoDuocLy } from '../models/nhom-nho-duoc-ly.model';
import {
  AiSuggestService,
  DuplicateClusterInput,
  DuplicateClusterVerdict,
} from './ai-suggest.controller';
import { normName } from '../utils/the-do-match.util';
import { catalogKey, formatCatalogLabel } from '../utils/catalog-label.util';

// ── Kiểu trả về cho frontend ────────────────────────────────────────────────

/** Số tham chiếu của một vị thuốc (để gợi ý chọn vị giữ làm chuẩn khi gộp). */
export interface ViThuocRefCounts {
  bai_thuoc: number;
  nhom: number;
  cong_dung: number;
  chu_tri: number;
  kieng_ky: number;
}

export interface DuplicateMember {
  id: number;
  ten_vi_thuoc: string;
  ten_han: string | null;
  ten_pinyin: string | null;
  ten_khoa_hoc: string | null;
  tinh: string | null;
  vi: string | null;
  quy_kinh: string | null;
  refs: ViThuocRefCounts;
  /** Tổng số tham chiếu (xếp hạng vị giữ làm chuẩn). */
  total_refs: number;
  /** Độ đầy đủ dữ liệu 0–4 (tính + vị + quy kinh + có công dụng). */
  completeness: number;
}

export interface DuplicateCluster {
  /** Khoá ổn định = các id thành viên sắp tăng dần, nối bằng "-". */
  key: string;
  /** Vị thuốc gợi ý GIỮ làm chuẩn (nhiều tham chiếu nhất, dữ liệu đầy đủ nhất). */
  suggested_keep_id: number;
  /** Lý do các thành viên bị gom chung (vd "trùng tên", "trùng Hán/pinyin"). */
  reasons: string[];
  members: DuplicateMember[];
}

export interface IssueItem {
  id: number;
  ten_vi_thuoc: string;
}

export interface AuditIssues {
  total: number;
  /** Chưa thuộc nhóm dược lý nào. */
  khong_nhom: IssueItem[];
  /** Không có công dụng lẫn chủ trị (thiếu tác dụng). */
  thieu_tac_dung: IssueItem[];
  /** Chưa khai báo kiêng kỵ (thông tin — nhiều vị có thể không có). */
  thieu_kieng_ky: IssueItem[];
  /** Thiếu tính / vị / quy kinh. */
  thieu_tinh_vi: IssueItem[];
}

export interface NhomCheckResult {
  id: number;
  ten_vi_thuoc: string;
  /** Nhóm nhỏ hiện gán cho vị thuốc. */
  current: { id: number; ten: string }[];
  /** Nhóm nhỏ AI gợi ý (null nếu AI không chắc). */
  suggested: { id: number; ten: string } | null;
  /** `false` khi AI gợi ý một nhóm KHÁC nhóm hiện tại (cần xem lại). */
  match: boolean;
  ly_do?: string;
}

export interface MergeResult {
  keep_id: number;
  keep_name: string;
  merged_ids: number[];
  moved: Record<string, number>;
}

// ── Tiện ích ────────────────────────────────────────────────────────────────

/** Chuẩn hoá tên HÁN/chữ Trung: KHÔNG dùng normName (sẽ xoá hết ký tự CJK). */
function normHan(s: string | null | undefined): string {
  return (s || '').replace(/\s+/g, '').toLowerCase().trim();
}

/** Union-Find đơn giản trên id vị thuốc để gom các vị chung khoá thành cụm. */
class UnionFind {
  private parent = new Map<number, number>();

  add(x: number): void {
    if (!this.parent.has(x)) this.parent.set(x, x);
  }

  find(x: number): number {
    let root = x;
    while (this.parent.get(root) !== root)
      root = this.parent.get(root) as number;
    // Path compression
    let cur = x;
    while (this.parent.get(cur) !== root) {
      const next = this.parent.get(cur) as number;
      this.parent.set(cur, root);
      cur = next;
    }
    return root;
  }

  union(a: number, b: number): void {
    this.add(a);
    this.add(b);
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.parent.set(ra, rb);
  }
}

interface HerbRow {
  id: number;
  ten_vi_thuoc: string;
  ten_han: string | null;
  ten_pinyin: string | null;
  ten_khoa_hoc: string | null;
  tinh: string | null;
  vi: string | null;
  quy_kinh: string | null;
}

@Injectable()
export class KiemDinhViThuocService {
  constructor(
    @InjectRepository(ViThuoc)
    private readonly repo: Repository<ViThuoc>,
    @InjectRepository(NhomNhoDuocLy)
    private readonly nhomNhoRepo: Repository<NhomNhoDuocLy>,
    private readonly ai: AiSuggestService,
  ) {}

  // ── A. Gom biến thể ───────────────────────────────────────────────────────

  /**
   * Phát hiện các CỤM vị thuốc nghi trùng (tất định, không AI). Gom theo khoá chuẩn hoá:
   * tên / tên Hán / pinyin / tên khoa học / các tên gọi khác. Union-Find nối các vị chung
   * bất kỳ khoá nào. Mỗi cụm kèm số tham chiếu + gợi ý vị giữ làm chuẩn.
   */
  async detectDuplicates(): Promise<DuplicateCluster[]> {
    const herbs: HerbRow[] = await this.repo.query(
      `SELECT id, ten_vi_thuoc, ten_han, ten_pinyin, ten_khoa_hoc, tinh, vi, quy_kinh FROM vi_thuoc`,
    );
    const aliasRows: { id_vi_thuoc: number; ten_goi_khac: string }[] =
      await this.repo.query(
        `SELECT id_vi_thuoc, ten_goi_khac FROM vi_thuoc_ten_goi_khac`,
      );
    const aliasByHerb = new Map<number, string[]>();
    for (const a of aliasRows) {
      const id = Number(a.id_vi_thuoc);
      const arr = aliasByHerb.get(id) ?? [];
      arr.push(a.ten_goi_khac);
      aliasByHerb.set(id, arr);
    }

    // Khoá có tiền tố namespace để tên không "đụng" pinyin/Hán/khoa học.
    const keyToIds = new Map<string, Set<number>>();
    const addKey = (key: string, id: number) => {
      const set = keyToIds.get(key) ?? new Set<number>();
      set.add(id);
      keyToIds.set(key, set);
    };

    const uf = new UnionFind();
    for (const h of herbs) {
      const id = Number(h.id);
      uf.add(id);
      const nm = normName(h.ten_vi_thuoc);
      if (nm) addKey('n:' + nm, id);
      const hp = normName(h.ten_pinyin || '');
      if (hp) addKey('p:' + hp, id);
      const hk = normName(h.ten_khoa_hoc || '');
      if (hk) addKey('k:' + hk, id);
      const hh = normHan(h.ten_han);
      if (hh) addKey('h:' + hh, id);
      for (const al of aliasByHerb.get(id) ?? []) {
        const ak = normName(al);
        // Tên gọi khác coi như cùng "không gian" với tên chính.
        if (ak) addKey('n:' + ak, id);
      }
    }

    // Nối các vị cùng khoá + ghi lại lý do gom của mỗi cặp gốc.
    const NS_LABEL: Record<string, string> = {
      n: 'trùng tên',
      p: 'trùng pinyin',
      k: 'trùng tên khoa học',
      h: 'trùng tên Hán',
    };
    const reasonByPair = new Map<number, Set<string>>(); // root → reasons
    for (const idSet of keyToIds.values()) {
      if (idSet.size < 2) continue;
      const ids = [...idSet];
      for (let i = 1; i < ids.length; i++) uf.union(ids[0], ids[i]);
    }

    // Gom theo root.
    const groups = new Map<number, number[]>();
    for (const h of herbs) {
      const id = Number(h.id);
      const r = uf.find(id);
      const arr = groups.get(r) ?? [];
      arr.push(id);
      groups.set(r, arr);
    }
    // Ghi lý do theo root sau khi đã có cụm.
    for (const [key, idSet] of keyToIds) {
      if (idSet.size < 2) continue;
      const ns = key.slice(0, 1);
      const label = NS_LABEL[ns] || 'trùng khoá';
      const root = uf.find([...idSet][0]);
      const set = reasonByPair.get(root) ?? new Set<string>();
      set.add(label);
      reasonByPair.set(root, set);
    }

    const clustersIds = [...groups.entries()].filter(
      ([, ids]) => ids.length >= 2,
    );
    if (!clustersIds.length) return [];

    // Số tham chiếu của tất cả vị thuốc trong các cụm.
    const allIds = clustersIds.flatMap(([, ids]) => ids);
    const [bt, nn, cd, ct, kk] = await Promise.all([
      this.countByViThuoc('bai_thuoc_chi_tiet', allIds),
      this.countByViThuoc('nhom_nho_vi_thuoc', allIds),
      this.countByViThuoc('vi_thuoc_cong_dung', allIds),
      this.countByViThuoc('vi_thuoc_chu_tri', allIds),
      this.countByViThuoc('vi_thuoc_kieng_ky', allIds),
    ]);

    const herbById = new Map<number, HerbRow>(
      herbs.map((h) => [Number(h.id), h]),
    );

    const clusters: DuplicateCluster[] = clustersIds.map(([root, ids]) => {
      const members: DuplicateMember[] = ids.map((id) => {
        const h = herbById.get(id) as HerbRow;
        const refs: ViThuocRefCounts = {
          bai_thuoc: bt.get(id) ?? 0,
          nhom: nn.get(id) ?? 0,
          cong_dung: cd.get(id) ?? 0,
          chu_tri: ct.get(id) ?? 0,
          kieng_ky: kk.get(id) ?? 0,
        };
        const total_refs =
          refs.bai_thuoc +
          refs.nhom +
          refs.cong_dung +
          refs.chu_tri +
          refs.kieng_ky;
        const completeness =
          (h.tinh ? 1 : 0) +
          (h.vi ? 1 : 0) +
          (h.quy_kinh && String(h.quy_kinh).trim() ? 1 : 0) +
          (refs.cong_dung > 0 ? 1 : 0);
        return {
          id,
          ten_vi_thuoc: h.ten_vi_thuoc,
          ten_han: h.ten_han,
          ten_pinyin: h.ten_pinyin,
          ten_khoa_hoc: h.ten_khoa_hoc,
          tinh: h.tinh,
          vi: h.vi,
          quy_kinh: h.quy_kinh,
          refs,
          total_refs,
          completeness,
        };
      });
      // Vị giữ làm chuẩn: nhiều tham chiếu nhất → đầy đủ nhất → id nhỏ nhất.
      members.sort(
        (a, b) =>
          b.total_refs - a.total_refs ||
          b.completeness - a.completeness ||
          a.id - b.id,
      );
      const key = [...ids].sort((a, b) => a - b).join('-');
      return {
        key,
        suggested_keep_id: members[0].id,
        reasons: [...(reasonByPair.get(root) ?? new Set<string>())],
        members,
      };
    });

    // Cụm nhiều thành viên / nhiều tham chiếu lên trước.
    clusters.sort(
      (a, b) =>
        b.members.length - a.members.length ||
        b.members.reduce((s, m) => s + m.total_refs, 0) -
          a.members.reduce((s, m) => s + m.total_refs, 0),
    );
    return clusters;
  }

  /** Đếm số dòng theo id_vi_thuoc trong một bảng nối (tên bảng là hằng nội bộ — an toàn). */
  private async countByViThuoc(
    table: string,
    ids: number[],
  ): Promise<Map<number, number>> {
    if (!ids.length) return new Map();
    const rows: { id_vi_thuoc: number; c: number }[] = await this.repo.query(
      `SELECT id_vi_thuoc, COUNT(*)::int AS c FROM ${table} WHERE id_vi_thuoc = ANY($1::int[]) GROUP BY id_vi_thuoc`,
      [ids],
    );
    return new Map(rows.map((r) => [Number(r.id_vi_thuoc), Number(r.c)]));
  }

  /** Chuyển tiếp AI xác nhận cụm trùng (delegate sang AiSuggestService). */
  confirmDuplicates(
    clusters: DuplicateClusterInput[],
  ): Promise<DuplicateClusterVerdict[]> {
    return this.ai.confirmDuplicateViThuoc(clusters);
  }

  /**
   * Gộp các vị BIẾN THỂ vào một vị CHUẨN trong một transaction:
   * dời mọi tham chiếu (bài thuốc, nhóm dược, công dụng, chủ trị, kiêng kỵ, kinh mạch) sang
   * vị chuẩn, thêm tên biến thể + tên gọi khác của chúng vào danh sách "tên gọi khác" của vị
   * chuẩn (không mất tên cũ), rồi xoá vị biến thể.
   */
  async merge(keepId: number, mergeIdsRaw: number[]): Promise<MergeResult> {
    const keep = Number(keepId);
    if (!Number.isFinite(keep) || keep <= 0) {
      throw new BadRequestException('keepId không hợp lệ');
    }
    const mergeIds = [
      ...new Set(
        (mergeIdsRaw ?? [])
          .map(Number)
          .filter((n) => Number.isFinite(n) && n > 0 && n !== keep),
      ),
    ];
    if (!mergeIds.length) {
      throw new BadRequestException('Danh sách vị thuốc cần gộp rỗng');
    }

    return this.repo.manager.transaction(async (mgr) => {
      const involved = [keep, ...mergeIds];
      const herbs: { id: number; ten_vi_thuoc: string }[] = await mgr.query(
        `SELECT id, ten_vi_thuoc FROM vi_thuoc WHERE id = ANY($1::int[])`,
        [involved],
      );
      const keepHerb = herbs.find((h) => Number(h.id) === keep);
      if (!keepHerb)
        throw new NotFoundException('Không tìm thấy vị thuốc giữ lại');
      const foundMergeIds = herbs
        .map((h) => Number(h.id))
        .filter((id) => mergeIds.includes(id));
      if (!foundMergeIds.length) {
        throw new NotFoundException('Không tìm thấy vị thuốc cần gộp');
      }

      const moved: Record<string, number> = {};
      // 1) Các bảng nối có khoá kép (id_vi_thuoc + cột kia) — bỏ qua dòng đã có ở vị chuẩn.
      moved.cong_dung = await this.moveLink(
        mgr,
        'vi_thuoc_cong_dung',
        'id_cong_dung',
        keep,
        foundMergeIds,
      );
      moved.chu_tri = await this.moveLink(
        mgr,
        'vi_thuoc_chu_tri',
        'id_chu_tri',
        keep,
        foundMergeIds,
      );
      moved.kieng_ky = await this.moveLink(
        mgr,
        'vi_thuoc_kieng_ky',
        'id_kieng_ky',
        keep,
        foundMergeIds,
      );
      moved.kinh_mach = await this.moveLink(
        mgr,
        'vi_thuoc_kinh_mach',
        'id_kinh_mach',
        keep,
        foundMergeIds,
      );
      moved.nhom_nho = await this.moveLink(
        mgr,
        'nhom_nho_vi_thuoc',
        'id_nhom_nho',
        keep,
        foundMergeIds,
      );

      // 2) Bài thuốc: dời sang vị chuẩn — mỗi bài chỉ giữ 1 dòng cho vị này.
      moved.bai_thuoc = await this.moveLink(
        mgr,
        'bai_thuoc_chi_tiet',
        'id_bai_thuoc',
        keep,
        foundMergeIds,
      );

      // 3) Tên gọi khác: gộp tên biến thể + alias của chúng vào vị chuẩn (khử trùng).
      const aliasRows: { id_vi_thuoc: number; ten_goi_khac: string }[] =
        await mgr.query(
          `SELECT id_vi_thuoc, ten_goi_khac FROM vi_thuoc_ten_goi_khac WHERE id_vi_thuoc = ANY($1::int[])`,
          [involved],
        );
      const seen = new Set<string>();
      seen.add(catalogKey(keepHerb.ten_vi_thuoc));
      for (const r of aliasRows) {
        if (Number(r.id_vi_thuoc) === keep)
          seen.add(catalogKey(r.ten_goi_khac));
      }
      const toAdd: string[] = [];
      const consider = (raw: string) => {
        const label = formatCatalogLabel(raw);
        if (!label) return;
        const k = catalogKey(label);
        if (seen.has(k)) return;
        seen.add(k);
        toAdd.push(label);
      };
      for (const h of herbs) {
        if (foundMergeIds.includes(Number(h.id))) consider(h.ten_vi_thuoc);
      }
      for (const r of aliasRows) {
        if (Number(r.id_vi_thuoc) !== keep) consider(r.ten_goi_khac);
      }
      for (const label of toAdd) {
        await mgr.query(
          `INSERT INTO vi_thuoc_ten_goi_khac (id_vi_thuoc, ten_goi_khac) VALUES ($1, $2)`,
          [keep, label],
        );
      }
      moved.ten_goi_khac = toAdd.length;

      // 4) Xoá vị biến thể — cascade dọn các dòng nối còn sót (đã trùng ở vị chuẩn).
      await mgr.query(`DELETE FROM vi_thuoc WHERE id = ANY($1::int[])`, [
        foundMergeIds,
      ]);

      return {
        keep_id: keep,
        keep_name: keepHerb.ten_vi_thuoc,
        merged_ids: foundMergeIds,
        moved,
      };
    });
  }

  /**
   * Dời dòng nối sang vị chuẩn. Với MỖI giá trị đích (`otherCol`) chỉ chuyển ĐÚNG MỘT dòng
   * (DISTINCT ON + ctid) để khi gộp ≥2 biến thể cùng trỏ về một đích không tạo khoá trùng;
   * các dòng dư còn lại sẽ bị CASCADE xoá khi xoá vị biến thể. Bỏ qua đích vị chuẩn đã có.
   */
  private async moveLink(
    mgr: EntityManager,
    table: string,
    otherCol: string,
    keepId: number,
    mergeIds: number[],
  ): Promise<number> {
    const rows: unknown[] = await mgr.query(
      `UPDATE ${table} s SET id_vi_thuoc = $1
       WHERE s.ctid IN (
         SELECT DISTINCT ON (x.${otherCol}) x.ctid
         FROM ${table} x
         WHERE x.id_vi_thuoc = ANY($2::int[])
           AND NOT EXISTS (
             SELECT 1 FROM ${table} t WHERE t.id_vi_thuoc = $1 AND t.${otherCol} = x.${otherCol}
           )
         ORDER BY x.${otherCol}, x.ctid
       )
       RETURNING 1`,
      [keepId, mergeIds],
    );
    return Array.isArray(rows) ? rows.length : 0;
  }

  // ── B. Rà soát nhóm dược / tác dụng / kiêng kỵ ────────────────────────────

  /** Rà soát tất định (không AI): liệt kê vị thuốc thiếu dữ liệu, phân theo loại vấn đề. */
  async listIssues(): Promise<AuditIssues> {
    const rows: {
      id: number;
      ten_vi_thuoc: string;
      tinh: string | null;
      vi: string | null;
      quy_kinh: string | null;
      has_nhom: boolean;
      has_cong_dung: boolean;
      has_chu_tri: boolean;
      has_kieng_ky: boolean;
    }[] = await this.repo.query(`
      SELECT v.id, v.ten_vi_thuoc, v.tinh, v.vi, v.quy_kinh,
        EXISTS(SELECT 1 FROM nhom_nho_vi_thuoc n WHERE n.id_vi_thuoc = v.id) AS has_nhom,
        EXISTS(SELECT 1 FROM vi_thuoc_cong_dung c WHERE c.id_vi_thuoc = v.id) AS has_cong_dung,
        EXISTS(SELECT 1 FROM vi_thuoc_chu_tri ct WHERE ct.id_vi_thuoc = v.id) AS has_chu_tri,
        EXISTS(SELECT 1 FROM vi_thuoc_kieng_ky k WHERE k.id_vi_thuoc = v.id) AS has_kieng_ky
      FROM vi_thuoc v
      ORDER BY v.ten_vi_thuoc ASC
    `);

    const khong_nhom: IssueItem[] = [];
    const thieu_tac_dung: IssueItem[] = [];
    const thieu_kieng_ky: IssueItem[] = [];
    const thieu_tinh_vi: IssueItem[] = [];
    for (const r of rows) {
      const item: IssueItem = {
        id: Number(r.id),
        ten_vi_thuoc: r.ten_vi_thuoc,
      };
      if (!r.has_nhom) khong_nhom.push(item);
      if (!r.has_cong_dung && !r.has_chu_tri) thieu_tac_dung.push(item);
      if (!r.has_kieng_ky) thieu_kieng_ky.push(item);
      if (!r.tinh || !r.vi || !(r.quy_kinh && String(r.quy_kinh).trim())) {
        thieu_tinh_vi.push(item);
      }
    }
    return {
      total: rows.length,
      khong_nhom,
      thieu_tac_dung,
      thieu_kieng_ky,
      thieu_tinh_vi,
    };
  }

  /**
   * Dùng AI đối chiếu NHÓM hiện tại của từng vị thuốc với nhóm AI gợi ý (so toàn bộ nhóm nhỏ
   * ứng viên). `match=false` nghĩa AI gợi ý một nhóm KHÁC → cần xem lại. Giới hạn 60 vị/lượt
   * để kiểm soát chi phí token; frontend gửi theo lô.
   */
  async checkNhom(idsRaw: number[]): Promise<NhomCheckResult[]> {
    const ids = [
      ...new Set(
        (idsRaw ?? []).map(Number).filter((n) => Number.isFinite(n) && n > 0),
      ),
    ].slice(0, 60);
    if (!ids.length) throw new BadRequestException('Danh sách vị thuốc rỗng');

    const herbs: { id: number; ten_vi_thuoc: string }[] = await this.repo.query(
      `SELECT id, ten_vi_thuoc FROM vi_thuoc WHERE id = ANY($1::int[])`,
      [ids],
    );
    if (!herbs.length) throw new NotFoundException('Không tìm thấy vị thuốc');

    const nhomList = await this.nhomNhoRepo.find();
    const candidates = nhomList.map((n) => ({
      id: n.id,
      ten_nhom: n.ten_nhom,
      mo_ta: n.mo_ta,
      lieu_luong: n.lieu_luong,
    }));
    const nhomById = new Map<number, string>(
      nhomList.map((n) => [n.id, n.ten_nhom]),
    );

    const curRows: {
      id_vi_thuoc: number;
      id_nhom_nho: number;
      ten_nhom: string;
    }[] = await this.repo.query(
      `SELECT nv.id_vi_thuoc, nv.id_nhom_nho, nn.ten_nhom
         FROM nhom_nho_vi_thuoc nv JOIN nhom_nho_duoc_ly nn ON nn.id = nv.id_nhom_nho
         WHERE nv.id_vi_thuoc = ANY($1::int[])`,
      [ids],
    );
    const curByHerb = new Map<number, { id: number; ten: string }[]>();
    for (const r of curRows) {
      const hid = Number(r.id_vi_thuoc);
      const arr = curByHerb.get(hid) ?? [];
      arr.push({ id: Number(r.id_nhom_nho), ten: r.ten_nhom });
      curByHerb.set(hid, arr);
    }

    const suggestions = await this.ai.classifyViThuoc({
      vi_thuoc: herbs.map((h) => ({
        id: Number(h.id),
        ten_vi_thuoc: h.ten_vi_thuoc,
      })),
      nhom_nho_candidates: candidates,
    });

    return suggestions.map((s) => {
      const current = curByHerb.get(s.id) ?? [];
      const suggested =
        s.id_nhom_nho != null
          ? { id: s.id_nhom_nho, ten: nhomById.get(s.id_nhom_nho) ?? '' }
          : null;
      // Lệch nhóm chỉ khi AI có gợi ý cụ thể KHÁC nhóm hiện tại.
      const match = suggested
        ? current.some((c) => c.id === suggested.id)
        : true;
      return {
        id: s.id,
        ten_vi_thuoc: s.ten_vi_thuoc,
        current,
        suggested,
        match,
        ly_do: s.ly_do,
      };
    });
  }
}
