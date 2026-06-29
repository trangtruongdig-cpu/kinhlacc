import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Nguon } from '../models/nguon.model';

const fold = (s: string) =>
  String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase().replace(/\s+/g, ' ').trim();
const slugify = (s: string) => fold(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'nguon';

export interface NguonInput {
  ten?: string; loai?: string; ten_khac?: string | null; tac_gia?: string | null;
  nien_dai?: string | null; link?: string | null; ghi_chu?: string | null; mo_ta?: string | null;
}

/**
 * NguonService — nghiệp vụ SỔ CÁI TRÍCH DẪN.
 * Đọc (công khai): danh sách (sắp theo độ phổ biến), chi tiết + TRA NGƯỢC (huyệt/vị thuốc/bài thuốc trích nguồn này).
 * Quản trị: thêm/sửa/xoá + GỘP 2 nguồn trùng (dồn mọi link rồi xoá mục thừa).
 */
@Injectable()
export class NguonService {
  constructor(
    @InjectRepository(Nguon)
    private readonly repo: Repository<Nguon>,
  ) {}

  async findLite(opts: { page?: number; limit?: number; q?: string; loai?: string }) {
    const page = Math.max(1, opts.page || 1);
    const limit = Math.min(80, Math.max(1, opts.limit || 30));
    const where: string[] = [];
    const params: unknown[] = [];
    if (opts.loai === 'sach' || opts.loai === 'tac_gia') {
      params.push(opts.loai);
      where.push(`loai = $${params.length}`);
    }
    const q = (opts.q || '').trim().toLowerCase();
    if (q) {
      params.push(`%${q}%`);
      where.push(`(lower(ten) LIKE $${params.length} OR lower(coalesce(ten_khac,'')) LIKE $${params.length})`);
    }
    const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const totalRows = await this.repo.manager.query(`SELECT count(*)::int AS c FROM nguon ${whereSql}`, params);
    const total = totalRows[0]?.c ?? 0;
    params.push(limit); const limIdx = params.length;
    params.push((page - 1) * limit); const offIdx = params.length;
    const data = await this.repo.manager.query(
      `SELECT n.id, n.slug, n.ten, n.loai, n.tac_gia, n.nien_dai,
         ((SELECT count(*) FROM nguon_huyet WHERE nguon_id = n.id)
          + (SELECT count(*) FROM nguon_vi_thuoc WHERE nguon_id = n.id)
          + (SELECT count(*) FROM nguon_phuong_thang WHERE nguon_id = n.id))::int AS ref_count
       FROM nguon n ${whereSql}
       ORDER BY ref_count DESC, n.ten ASC
       LIMIT $${limIdx} OFFSET $${offIdx}`,
      params,
    );
    return { data, total, page, limit };
  }

  /** Chi tiết 1 nguồn + tra ngược: huyệt (id), vị thuốc, bài thuốc trích nguồn này. */
  async findBySlug(slug: string) {
    const n = await this.repo.findOne({ where: { slug } });
    if (!n) throw new NotFoundException('Không tìm thấy nguồn');
    return this.withRefs(n);
  }

  async findByIdRaw(id: number) {
    const n = await this.repo.findOne({ where: { id } });
    if (!n) throw new NotFoundException('Không tìm thấy nguồn');
    return this.withRefs(n);
  }

  /** Nguồn mà 1 VỊ THUỐC trích (để trang dược liệu linkify nội bộ chính xác). */
  findByViThuoc(id: number) {
    return this.repo.manager.query(
      `SELECT n.slug, n.ten, n.ten_khac, nvt.context
       FROM nguon_vi_thuoc nvt JOIN nguon n ON n.id = nvt.nguon_id WHERE nvt.vi_thuoc_id = $1`,
      [id],
    );
  }

  /** Nguồn mà 1 BÀI THUỐC trích (xuất xứ + tác giả). */
  findByPhuongThang(id: number) {
    return this.repo.manager.query(
      `SELECT n.slug, n.ten, n.ten_khac, npt.context
       FROM nguon_phuong_thang npt JOIN nguon n ON n.id = npt.nguon_id WHERE npt.phuong_thang_id = $1`,
      [id],
    );
  }

  private async withRefs(n: Nguon) {
    const m = this.repo.manager;
    const huyetRows = await m.query('SELECT huyet_id FROM nguon_huyet WHERE nguon_id = $1', [n.id]);
    const viThuoc = await m.query(
      `SELECT v.id, v.ten_vi_thuoc AS ten, nvt.context
       FROM nguon_vi_thuoc nvt JOIN vi_thuoc v ON v.id = nvt.vi_thuoc_id
       WHERE nvt.nguon_id = $1 ORDER BY v.ten_vi_thuoc ASC LIMIT 400`,
      [n.id],
    );
    const baiThuoc = await m.query(
      `SELECT p.id, p.ten, p.slug, npt.context
       FROM nguon_phuong_thang npt JOIN phuong_thang p ON p.id = npt.phuong_thang_id
       WHERE npt.nguon_id = $1 ORDER BY p.ten ASC LIMIT 400`,
      [n.id],
    );
    const counts = await m.query(
      `SELECT (SELECT count(*) FROM nguon_huyet WHERE nguon_id = $1)::int AS huyet,
              (SELECT count(*) FROM nguon_vi_thuoc WHERE nguon_id = $1)::int AS vi_thuoc,
              (SELECT count(*) FROM nguon_phuong_thang WHERE nguon_id = $1)::int AS bai_thuoc`,
      [n.id],
    );
    // Với tác giả: kèm các SÁCH do người này biên soạn (khớp trường tac_gia).
    let sachCungTacGia: unknown[] = [];
    if (n.loai === 'tac_gia') {
      sachCungTacGia = await m.query(
        `SELECT id, slug, ten FROM nguon WHERE loai = 'sach' AND lower(coalesce(tac_gia,'')) LIKE $1 ORDER BY ten ASC LIMIT 100`,
        [`%${fold(n.ten)}%`],
      );
    }
    return {
      ...n,
      huyetIds: huyetRows.map((r: { huyet_id: number }) => r.huyet_id),
      viThuoc,
      baiThuoc,
      sachCungTacGia,
      counts: counts[0] ?? { huyet: 0, vi_thuoc: 0, bai_thuoc: 0 },
    };
  }

  private async uniqueSlug(base: string, exceptId?: number): Promise<string> {
    let slug = base;
    let i = 2;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const found = await this.repo.findOne({ where: { slug } });
      if (!found || found.id === exceptId) return slug;
      slug = `${base}-${i++}`;
    }
  }

  async create(input: NguonInput) {
    const ten = (input.ten || '').trim();
    if (!ten) throw new BadRequestException('Thiếu tên nguồn');
    const loai = input.loai === 'tac_gia' ? 'tac_gia' : 'sach';
    const slug = await this.uniqueSlug(slugify(ten));
    const row = this.repo.create({
      ten, loai, slug, norm_key: fold(ten),
      ten_khac: input.ten_khac ?? null, tac_gia: input.tac_gia ?? null,
      nien_dai: input.nien_dai ?? null, link: input.link ?? null,
      ghi_chu: input.ghi_chu ?? null, mo_ta: input.mo_ta ?? null,
    });
    return this.repo.save(row);
  }

  async update(id: number, input: NguonInput) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Không tìm thấy nguồn');
    if (input.ten != null && input.ten.trim() && input.ten.trim() !== row.ten) {
      row.ten = input.ten.trim();
      row.norm_key = fold(row.ten);
    }
    if (input.loai === 'sach' || input.loai === 'tac_gia') row.loai = input.loai;
    for (const k of ['ten_khac', 'tac_gia', 'nien_dai', 'link', 'ghi_chu', 'mo_ta'] as const) {
      if (input[k] !== undefined) row[k] = input[k];
    }
    return this.repo.save(row);
  }

  async remove(id: number) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Không tìm thấy nguồn');
    await this.repo.delete(id); // link tables ON DELETE CASCADE
    return { ok: true };
  }

  /** GỘP: dồn mọi link của fromId sang intoId, GHI tên 'from' vào biến thể của 'into', rồi xoá 'from'. */
  async merge(fromId: number, intoId: number) {
    if (!fromId || !intoId || fromId === intoId) throw new BadRequestException('Cần 2 nguồn khác nhau');
    const into = await this.repo.findOne({ where: { id: intoId } });
    const from = await this.repo.findOne({ where: { id: fromId } });
    if (!into || !from) throw new NotFoundException('Không tìm thấy nguồn để gộp');
    // Gom biến thể: tên + các biến thể của 'from' vào ten_khac của 'into' (không trùng, bỏ chính tên 'into').
    const aliases = new Set((into.ten_khac ? into.ten_khac.split(' | ') : []).map((s) => s.trim()).filter(Boolean));
    aliases.add(from.ten.trim());
    if (from.ten_khac) from.ten_khac.split(' | ').forEach((a) => { const t = a.trim(); if (t) aliases.add(t); });
    aliases.delete(into.ten.trim());
    const newTenKhac = [...aliases].join(' | ') || null;
    await this.repo.manager.transaction(async (tx) => {
      await tx.query('INSERT INTO nguon_huyet (nguon_id, huyet_id) SELECT $1, huyet_id FROM nguon_huyet WHERE nguon_id = $2 ON CONFLICT DO NOTHING', [intoId, fromId]);
      await tx.query('INSERT INTO nguon_vi_thuoc (nguon_id, vi_thuoc_id, context) SELECT $1, vi_thuoc_id, context FROM nguon_vi_thuoc WHERE nguon_id = $2 ON CONFLICT DO NOTHING', [intoId, fromId]);
      await tx.query('INSERT INTO nguon_phuong_thang (nguon_id, phuong_thang_id, context) SELECT $1, phuong_thang_id, context FROM nguon_phuong_thang WHERE nguon_id = $2 ON CONFLICT DO NOTHING', [intoId, fromId]);
      await tx.update(Nguon, intoId, { ten_khac: newTenKhac });
      await tx.delete(Nguon, fromId);
    });
    return { ok: true, into: intoId, ten_khac: newTenKhac };
  }

  /**
   * GỢI Ý TRÙNG — cặp nghi là biến thể (cùng loại, một tên CHỨA tên kia) để admin gộp 1 chạm.
   * Sắp theo độ phổ biến tổng để gộp cái nhiều link làm "mục giữ lại".
   */
  async suggestDuplicates(opts: { loai?: string; limit?: number }) {
    const limit = Math.min(300, Math.max(1, opts.limit || 100));
    const params: unknown[] = [];
    let loaiSql = '';
    if (opts.loai === 'sach' || opts.loai === 'tac_gia') {
      params.push(opts.loai);
      loaiSql = `AND a.loai = $${params.length}`;
    }
    params.push(limit);
    const rows = await this.repo.manager.query(
      `WITH ref AS (
         SELECT n.id,
           ((SELECT count(*) FROM nguon_huyet WHERE nguon_id = n.id)
            + (SELECT count(*) FROM nguon_vi_thuoc WHERE nguon_id = n.id)
            + (SELECT count(*) FROM nguon_phuong_thang WHERE nguon_id = n.id))::int AS c
         FROM nguon n)
       SELECT a.id AS a_id, a.ten AS a_ten, a.slug AS a_slug, ra.c AS a_ref,
              b.id AS b_id, b.ten AS b_ten, b.slug AS b_slug, rb.c AS b_ref, a.loai
       FROM nguon a
       JOIN nguon b ON a.loai = b.loai AND a.id <> b.id
         AND length(a.norm_key) >= 5
         AND b.norm_key LIKE '%' || a.norm_key || '%'
         AND length(b.norm_key) > length(a.norm_key)
       JOIN ref ra ON ra.id = a.id
       JOIN ref rb ON rb.id = b.id
       WHERE TRUE ${loaiSql}
       ORDER BY (ra.c + rb.c) DESC, length(a.norm_key) DESC
       LIMIT $${params.length}`,
      params,
    );
    return { pairs: rows, total: rows.length };
  }

  count() {
    return this.repo.count();
  }
}
