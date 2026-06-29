import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { ViThuoc } from '../models/vi-thuoc.model';
import { ViThuocCongDung } from '../models/vi-thuoc-cong-dung.model';
import { ViThuocChuTri } from '../models/vi-thuoc-chu-tri.model';
import { ViThuocKiengKy } from '../models/vi-thuoc-kieng-ky.model';
import { ViThuocTenGoiKhac } from '../models/vi-thuoc-ten-goi-khac.model';
import { ViThuocKinhMach } from '../models/vi-thuoc-kinh-mach.model';
import { KinhMach } from '../models/kinh-mach.model';
import { NhomNhoViThuoc } from '../models/nhom-nho-vi-thuoc.model';
import { CreateViThuocDto, UpdateViThuocDto } from '../models/dongy-thuoc.dto';
import { catalogKey, formatCatalogLabel } from '../utils/catalog-label.util';
import { AiSuggestService } from './ai-suggest.controller';

const VI_THUOC_RELATIONS = {
  congDungLinks: { congDung: true },
  chuTriLinks: { chuTri: true },
  kiengKyLinks: { kiengKy: true },
  tenGoiKhacList: true,
  kinhMachLinks: { kinhMach: true },
} as const;

@Injectable()
export class ViThuocService {
  constructor(
    @InjectRepository(ViThuoc)
    private repo: Repository<ViThuoc>,
    private readonly aiSuggest: AiSuggestService,
  ) {}

  /** Điều kiện "thiếu" 1 trong 4 trường tên khoa học/Hán/pinyin/bộ phận dùng (coi chuỗi rỗng = thiếu). */
  private static readonly MISSING_TKH =
    "(v.ten_khoa_hoc IS NULL OR v.ten_khoa_hoc = '' OR v.ten_han IS NULL OR v.ten_han = '' " +
    "OR v.ten_pinyin IS NULL OR v.ten_pinyin = '' OR v.bo_phan_dung IS NULL OR v.bo_phan_dung = '')";

  /** Đếm số vị thuốc còn thiếu tên khoa học/Hán/pinyin/bộ phận dùng. */
  async countMissingTenKhoaHoc(): Promise<number> {
    return this.repo
      .createQueryBuilder('v')
      .where(ViThuocService.MISSING_TKH)
      .getCount();
  }

  /**
   * AI điền tên khoa học/Hán/pinyin/bộ phận dùng cho 1 LÔ vị thuốc còn thiếu, lưu DB.
   * Dùng con trỏ `afterId` (id tăng dần) để KHÔNG lặp lại vị AI không điền được → frontend gọi
   * tới khi processed=0. Chỉ điền trường đang TRỐNG (không ghi đè dữ liệu đã có). AI chỉ điền dữ
   * liệu tham chiếu (Latin/Hán/pinyin/bộ phận) — chuẩn, ít rủi ro; vẫn nên rà lại.
   */
  async aiFillTenKhoaHocBatch(
    limit = 15,
    afterId = 0,
  ): Promise<{
    processed: number;
    filled: number;
    remaining: number;
    lastId: number;
    items: Array<{
      id: number;
      ten: string;
      ten_khoa_hoc: string;
      ten_han: string;
      ten_pinyin: string;
      bo_phan_dung: string;
      loi?: string;
    }>;
  }> {
    const n = Math.min(Math.max(1, Math.floor(limit) || 15), 30);
    const after = Math.max(0, Math.floor(afterId) || 0);
    const rows = await this.repo
      .createQueryBuilder('v')
      .where(ViThuocService.MISSING_TKH)
      .andWhere('v.id > :after', { after })
      .orderBy('v.id', 'ASC')
      .take(n)
      .getMany();

    let filled = 0;
    const items: Array<{
      id: number;
      ten: string;
      ten_khoa_hoc: string;
      ten_han: string;
      ten_pinyin: string;
      bo_phan_dung: string;
      loi?: string;
    }> = [];
    for (const v of rows) {
      try {
        const s = await this.aiSuggest.suggestTenKhoaHoc(v.ten_vi_thuoc);
        let changed = false;
        if (!v.ten_khoa_hoc && s.ten_khoa_hoc) {
          v.ten_khoa_hoc = s.ten_khoa_hoc;
          changed = true;
        }
        if (!v.ten_han && s.ten_han) {
          v.ten_han = s.ten_han;
          changed = true;
        }
        if (!v.ten_pinyin && s.ten_pinyin) {
          v.ten_pinyin = s.ten_pinyin;
          changed = true;
        }
        if (!v.bo_phan_dung && s.bo_phan_dung) {
          v.bo_phan_dung = s.bo_phan_dung;
          changed = true;
        }
        if (changed) {
          await this.repo.save(v);
          filled++;
        }
        items.push({
          id: v.id,
          ten: v.ten_vi_thuoc,
          ten_khoa_hoc: v.ten_khoa_hoc || '',
          ten_han: v.ten_han || '',
          ten_pinyin: v.ten_pinyin || '',
          bo_phan_dung: v.bo_phan_dung || '',
        });
      } catch (e) {
        items.push({
          id: v.id,
          ten: v.ten_vi_thuoc,
          ten_khoa_hoc: '',
          ten_han: '',
          ten_pinyin: '',
          bo_phan_dung: '',
          loi: e instanceof Error ? e.message : String(e),
        });
      }
    }

    const lastId = rows.length ? rows[rows.length - 1].id : after;
    // remaining = số vị THIẾU còn lại SAU con trỏ này (đảm bảo hội tụ về 0).
    const remaining = await this.repo
      .createQueryBuilder('v')
      .where(ViThuocService.MISSING_TKH)
      .andWhere('v.id > :lastId', { lastId })
      .getCount();
    return { processed: rows.length, filled, remaining, lastId, items };
  }

  findAll(): Promise<ViThuoc[]> {
    return this.repo.find({
      relations: VI_THUOC_RELATIONS,
      order: { ten_vi_thuoc: 'ASC' },
    });
  }

  /**
   * Lightweight, paginated list cho tab Vị thuốc.
   * - Bỏ congDungLinks/chuTriLinks/kiengKyLinks/tenGoiKhacList để query nhanh.
   * - Giữ kinhMachLinks vì UI cần để render quy kinh & mở modal sửa.
   * - Hỗ trợ filter theo nhóm nhỏ dược lý (idNhomNho) hoặc nhóm lớn (idNhomLon) qua bảng nối.
   */
  async findLite(opts: {
    page?: number;
    limit?: number;
    q?: string;
    idNhomNho?: number | null;
    idNhomLon?: number | null;
    sort?: 'phobien' | 'ten';
  }): Promise<{ data: ViThuoc[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, Math.floor(opts.page ?? 1));
    const limit = Math.max(1, Math.min(200, Math.floor(opts.limit ?? 12)));
    const q = (opts.q ?? '').trim();
    const idNhomNho = Number.isFinite(opts.idNhomNho as number) ? Number(opts.idNhomNho) : null;
    const idNhomLon = Number.isFinite(opts.idNhomLon as number) ? Number(opts.idNhomLon) : null;

    const qb = this.repo.createQueryBuilder('vt');
    if (q) {
      const term = `%${q}%`;
      qb.andWhere(
        '(vt.ten_vi_thuoc ILIKE :term OR vt.tinh ILIKE :term OR vt.vi ILIKE :term OR vt.quy_kinh ILIKE :term OR vt.lieu_dung ILIKE :term OR vt.ten_khoa_hoc ILIKE :term OR vt.ten_han ILIKE :term OR vt.ten_pinyin ILIKE :term OR vt.bo_phan_dung ILIKE :term)',
        { term },
      );
    }
    if (idNhomNho != null) {
      qb.andWhere(
        '(EXISTS (SELECT 1 FROM nhom_nho_vi_thuoc nnvt WHERE nnvt.id_vi_thuoc = vt.id AND nnvt.id_nhom_nho = :nnId))',
        { nnId: idNhomNho },
      );
    } else if (idNhomLon != null) {
      qb.andWhere(
        '(EXISTS (SELECT 1 FROM nhom_nho_vi_thuoc nnvt JOIN nhom_nho_duoc_ly nnd ON nnd.id = nnvt.id_nhom_nho WHERE nnvt.id_vi_thuoc = vt.id AND nnd.id_nhom_lon = :nlId))',
        { nlId: idNhomLon },
      );
    }

    // Mặc định: VỊ THƯỜNG DÙNG lên đầu (so_bai_thuoc giảm dần), rồi A→Z. sort='ten' để về thứ tự chữ cái.
    if (opts.sort === 'ten') qb.orderBy('vt.ten_vi_thuoc', 'ASC');
    else qb.orderBy('vt.so_bai_thuoc', 'DESC').addOrderBy('vt.ten_vi_thuoc', 'ASC');
    const [items, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();

    let data: ViThuoc[] = [];
    if (items.length) {
      const ids = items.map((x) => x.id);
      const fetched = await this.repo.find({
        where: { id: In(ids) },
        relations: { kinhMachLinks: { kinhMach: true } },
      });
      // GIỮ ĐÚNG thứ tự đã sắp (find theo In(ids) không bảo đảm thứ tự) → map lại theo ids.
      const byId = new Map(fetched.map((f) => [f.id, f]));
      data = ids.map((id) => byId.get(id)).filter((x): x is ViThuoc => !!x);
    }

    return { data, total, page, limit };
  }

  findOne(id: number): Promise<ViThuoc | null> {
    return this.repo.findOne({
      where: { id },
      relations: VI_THUOC_RELATIONS,
    });
  }

  /**
   * Dò các "tên khác" của 1 vị thuốc xem có TRÙNG tên một vị thuốc KHÁC đang có trong kho không
   * → có thể là biến thể/bản trùng. Trả danh sách vị khớp để hiện cảnh báo + link đối chiếu.
   */
  async bienTheTenKhac(
    id: number,
  ): Promise<Array<{ ten: string; id: number; ten_vi_thuoc: string; ten_han?: string; loai: 'trung' | 'goi-y' }>> {
    const herb = await this.repo.findOne({ where: { id }, relations: { tenGoiKhacList: true } });
    if (!herb) return [];
    const names = new Set<string>();
    // từ prose "tên khác" (bỏ phần trong ngoặc = nguồn) + danh sách tên gọi khác có cấu trúc
    for (const n of String(herb.ten_khac || '').replace(/\([^)]*\)/g, '').split(/[,;、，\n]/)) {
      const t = n.trim();
      if (t.length >= 2) names.add(t);
    }
    for (const g of herb.tenGoiKhacList || []) {
      const t = (g.ten_goi_khac || '').trim();
      if (t.length >= 2) names.add(t);
    }
    const norm = (s: string) =>
      String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')
        .replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
    const toks = (s: string) => norm(s).split(' ').filter((w) => w.length >= 2);
    const hanOf = (s: string) => String(s || '').replace(/[^一-鿿]/g, ''); // chỉ giữ chữ Hán

    const all = await this.repo.find({ select: { id: true, ten_vi_thuoc: true, ten_han: true } });
    const byNorm = new Map<string, { id: number; ten_vi_thuoc: string }>();
    for (const v of all) {
      if (v.id === id) continue;
      const k = norm(v.ten_vi_thuoc);
      if (k && !byNorm.has(k)) byNorm.set(k, { id: v.id, ten_vi_thuoc: v.ten_vi_thuoc });
    }

    const out: Array<{ ten: string; id: number; ten_vi_thuoc: string; ten_han?: string; loai: 'trung' | 'goi-y' }> = [];
    const seen = new Set<number>();
    // 1) TRÙNG: tên khác (đã ghi) khớp đúng tên một vị khác
    for (const n of names) {
      const hit = byNorm.get(norm(n));
      if (hit && !seen.has(hit.id)) {
        seen.add(hit.id);
        out.push({ ten: n, id: hit.id, ten_vi_thuoc: hit.ten_vi_thuoc, loai: 'trung' });
      }
    }
    // 2) GỢI Ý: vị gần giống theo gốc tên Việt (token ⊆), chuỗi con Hán, HOẶC chung chữ Hán "hiếm".
    // Chữ Hán hiếm (xuất hiện ở ≤ MAXFREQ vị) là dấu hiệu đặc trưng một loại cây → vd 茯 (Phục linh/Phục thần),
    // tránh nhiễu từ chữ phổ biến (草,子,花,大,白...). Bắt được Phục Thần (茯神) ↔ Phục Linh (茯苓) dù chỉ chung 1 chữ.
    const MAXFREQ = 8;
    // Tiền tố bào chế/phẩm cấp (Hán) — bỏ để lấy "gốc": Sinh/Thục/Sao/Chích/Bạch/Xích... KHÔNG gồm 土(thổ).
    const HAN_MOD = new Set(
      '生熟炒炙焦炭鲜鮮干乾老嫩大小白赤黑北川广廣制製煨煅蜜酒醋盐鹽青陈陳煅炮'.split(''),
    );
    const stripHanMod = (h: string) => { let i = 0; while (i < h.length && HAN_MOD.has(h[i])) i++; return h.slice(i); };
    const selfTok = toks(herb.ten_vi_thuoc);
    const selfHan = hanOf(herb.ten_han);
    const selfBase = stripHanMod(selfHan);
    const hanFreq = new Map<string, number>();
    for (const v of all) {
      for (const ch of new Set(hanOf(v.ten_han).split(''))) hanFreq.set(ch, (hanFreq.get(ch) || 0) + 1);
    }
    // Hán hiếm = chữ ĐỊNH DANH ít gặp (loại bỏ chữ tiền tố bào chế như 生熟炒... để tránh nhiễu "cùng kiểu chế")
    const selfRare = [...new Set(selfHan.split(''))].filter(
      (ch) => !HAN_MOD.has(ch) && (hanFreq.get(ch) || 0) <= MAXFREQ,
    );
    if (selfTok.length >= 2 || selfHan.length >= 2) {
      for (const v of all) {
        if (v.id === id || seen.has(v.id)) continue;
        const oTok = toks(v.ten_vi_thuoc);
        const oHan = hanOf(v.ten_han);
        // token: tập tên ngắn hơn là con của tên dài hơn (>=2 token chung)
        const subset = (a: string[], b: string[]) => a.length >= 2 && a.every((w) => b.includes(w));
        const vietHit = subset(selfTok, oTok) || subset(oTok, selfTok);
        // Hán: chuỗi con (tên Hán ngắn hơn >=2 chữ nằm trong tên kia)
        const hanHit =
          selfHan.length >= 2 && oHan.length >= 2 && (oHan.includes(selfHan) || selfHan.includes(oHan));
        // Hán cùng GỐC sau khi bỏ tiền tố bào chế: 生地黄/熟地黄 → 地黄 == 地黄 (Sinh địa ↔ Thục địa)
        const oBase = stripHanMod(oHan);
        const hanBaseHit =
          selfBase.length >= 2 && oBase.length >= 2 &&
          (selfBase === oBase || oBase.includes(selfBase) || selfBase.includes(oBase));
        // Hán hiếm: chung ít nhất 1 chữ Hán đặc trưng
        const oChars = new Set(oHan.split(''));
        const hanRareHit = selfRare.some((ch) => oChars.has(ch));
        if (vietHit || hanHit || hanBaseHit || hanRareHit) {
          seen.add(v.id);
          out.push({ ten: v.ten_vi_thuoc, id: v.id, ten_vi_thuoc: v.ten_vi_thuoc, ten_han: v.ten_han || undefined, loai: 'goi-y' });
        }
        if (out.length >= 30) break;
      }
    }
    return out;
  }

  /**
   * GỘP vị thuốc trùng/biến thể `fromId` VÀO `keepId` (giữ keepId là vị chuẩn). Trong 1 transaction:
   * - Chuyển tham chiếu bài thuốc: bai_thuoc_chi_tiet.id_vi_thuoc + phuong_thang.thanh_phan[].id (from→keep).
   * - Thêm tên của `from` (+ tên gọi khác của nó) vào "tên gọi khác" của `keep`.
   * - Xoá `from` (CASCADE dọn link riêng) + cập nhật lại so_bai_thuoc của `keep`.
   */
  async gop(keepId: number, fromId: number): Promise<{ merged: string; into: string }> {
    if (!keepId || !fromId || keepId === fromId) {
      throw new BadRequestException('Tham số gộp không hợp lệ.');
    }
    const keep = await this.repo.findOneBy({ id: keepId });
    const from = await this.repo.findOne({ where: { id: fromId }, relations: { tenGoiKhacList: true } });
    if (!keep || !from) throw new NotFoundException('Vị thuốc cần gộp không tồn tại.');

    await this.repo.manager.transaction(async (m) => {
      // 1) bai_thuoc_chi_tiet: bỏ dòng trùng (cùng bài đã có keep) rồi chuyển phần còn lại sang keep
      await m.query(
        `DELETE FROM bai_thuoc_chi_tiet WHERE id_vi_thuoc = $1 AND id_bai_thuoc IN (SELECT id_bai_thuoc FROM bai_thuoc_chi_tiet WHERE id_vi_thuoc = $2)`,
        [fromId, keepId],
      );
      await m.query(`UPDATE bai_thuoc_chi_tiet SET id_vi_thuoc = $1 WHERE id_vi_thuoc = $2`, [keepId, fromId]);
      // 2) phuong_thang.thanh_phan (JSONB): đổi id thành phần from -> keep
      await m.query(
        `UPDATE phuong_thang SET thanh_phan = (
           SELECT jsonb_agg(CASE WHEN (e->>'id')::int = $2 THEN jsonb_set(e, '{id}', to_jsonb($1::int)) ELSE e END)
           FROM jsonb_array_elements(thanh_phan) e)
         WHERE thanh_phan IS NOT NULL
           AND EXISTS (SELECT 1 FROM jsonb_array_elements(thanh_phan) e WHERE (e->>'id')::int = $2)`,
        [keepId, fromId],
      );
      // 3) thêm tên from + tên gọi khác của from vào ten_goi_khac của keep (nếu chưa có)
      const names = [from.ten_vi_thuoc, ...(from.tenGoiKhacList || []).map((t) => t.ten_goi_khac)]
        .map((s) => (s || '').trim())
        .filter(Boolean);
      for (const nm of names) {
        await m.query(
          `INSERT INTO vi_thuoc_ten_goi_khac (id_vi_thuoc, ten_goi_khac)
           SELECT $1::int, $2::text WHERE NOT EXISTS (SELECT 1 FROM vi_thuoc_ten_goi_khac WHERE id_vi_thuoc = $1::int AND lower(ten_goi_khac) = lower($2::text))`,
          [keepId, nm],
        );
      }
      // 4) xoá from (CASCADE dọn cong_dung/chu_tri/kieng_ky/kinh_mach/nhom của nó)
      await m.delete(ViThuoc, { id: fromId });
      // 5) cập nhật so_bai_thuoc của keep
      await m.query(
        `UPDATE vi_thuoc SET so_bai_thuoc = (
           SELECT COUNT(*) FROM phuong_thang p WHERE p.thanh_phan IS NOT NULL
             AND EXISTS (SELECT 1 FROM jsonb_array_elements(p.thanh_phan) e WHERE (e->>'id')::int = $1))
         WHERE id = $1`,
        [keepId],
      );
    });
    return { merged: from.ten_vi_thuoc, into: keep.ten_vi_thuoc };
  }

  private pickScalar(dto: Partial<CreateViThuocDto>): Partial<ViThuoc> {
    const o: Partial<ViThuoc> = {};
    if (dto.ten_vi_thuoc !== undefined) o.ten_vi_thuoc = dto.ten_vi_thuoc;
    if (dto.tinh !== undefined) o.tinh = dto.tinh;
    if (dto.vi !== undefined) o.vi = dto.vi;
    if (dto.quy_kinh !== undefined) o.quy_kinh = dto.quy_kinh;
    if (dto.lieu_dung !== undefined) o.lieu_dung = dto.lieu_dung;
    if (dto.ten_khoa_hoc !== undefined) o.ten_khoa_hoc = dto.ten_khoa_hoc;
    if (dto.ten_han !== undefined) o.ten_han = dto.ten_han;
    if (dto.ten_pinyin !== undefined) o.ten_pinyin = dto.ten_pinyin;
    if (dto.bo_phan_dung !== undefined) o.bo_phan_dung = dto.bo_phan_dung;
    for (const f of ['xuat_xu', 'ho_khoa_hoc', 'ten_khac', 'mo_ta', 'thanh_phan', 'duoc_ly', 'tinh_vi_quy_kinh', 'nuoi_duong', 'bao_che', 'don_thuoc', 'chu_tri', 'tham_khao'] as const) {
      if (dto[f] !== undefined) (o as Record<string, unknown>)[f] = dto[f];
    }
    return o;
  }

  private async syncLinkedRows(
    mgr: EntityManager,
    viId: number,
    dto: Partial<CreateViThuocDto>,
    isCreate: boolean,
  ): Promise<void> {
    const patchCd = dto.cong_dung_links;
    if (patchCd !== undefined || isCreate) {
      await mgr.delete(ViThuocCongDung, { id_vi_thuoc: viId });
      const byCd = new Map<number, { ghi_chu?: string }>();
      for (const row of patchCd ?? []) {
        const idCd = Number(row.id_cong_dung);
        if (!Number.isFinite(idCd)) continue;
        byCd.set(idCd, { ghi_chu: row.ghi_chu });
      }
      for (const [idCd, row] of byCd) {
        const note = row.ghi_chu?.trim() ? formatCatalogLabel(row.ghi_chu) : null;
        await mgr.insert(ViThuocCongDung, {
          id_vi_thuoc: viId,
          id_cong_dung: idCd,
          ghi_chu: note || null,
        });
      }
    }

    const patchCt = dto.chu_tri_links;
    if (patchCt !== undefined || isCreate) {
      await mgr.delete(ViThuocChuTri, { id_vi_thuoc: viId });
      const byCt = new Map<number, { ghi_chu?: string }>();
      for (const row of patchCt ?? []) {
        const idCt = Number(row.id_chu_tri);
        if (!Number.isFinite(idCt)) continue;
        byCt.set(idCt, { ghi_chu: row.ghi_chu });
      }
      for (const [idCt, row] of byCt) {
        const note = row.ghi_chu?.trim() ? formatCatalogLabel(row.ghi_chu) : null;
        await mgr.insert(ViThuocChuTri, {
          id_vi_thuoc: viId,
          id_chu_tri: idCt,
          ghi_chu: note || null,
        });
      }
    }

    const patchKk = dto.kieng_ky_links;
    if (patchKk !== undefined || isCreate) {
      await mgr.delete(ViThuocKiengKy, { id_vi_thuoc: viId });
      const byKk = new Map<number, { ghi_chu?: string }>();
      for (const row of patchKk ?? []) {
        const idKk = Number(row.id_kieng_ky);
        if (!Number.isFinite(idKk)) continue;
        byKk.set(idKk, { ghi_chu: row.ghi_chu });
      }
      for (const [idKk, row] of byKk) {
        const note = row.ghi_chu?.trim() ? formatCatalogLabel(row.ghi_chu) : null;
        await mgr.insert(ViThuocKiengKy, {
          id_vi_thuoc: viId,
          id_kieng_ky: idKk,
          ghi_chu: note || null,
        });
      }
    }

    const patchAliases = dto.ten_goi_khac_list;
    if (patchAliases !== undefined || isCreate) {
      await mgr.delete(ViThuocTenGoiKhac, { id_vi_thuoc: viId });
      const seenAlias = new Set<string>();
      for (const raw of patchAliases ?? []) {
        const t = formatCatalogLabel(String(raw ?? ''));
        if (!t) continue;
        const k = catalogKey(t);
        if (seenAlias.has(k)) continue;
        seenAlias.add(k);
        await mgr.insert(ViThuocTenGoiKhac, {
          id_vi_thuoc: viId,
          ten_goi_khac: t,
        });
      }
    }

    const patchKm = dto.kinh_mach_ids;
    if (patchKm !== undefined || isCreate) {
      await mgr.delete(ViThuocKinhMach, { id_vi_thuoc: viId });
      const seenKm = new Set<number>();
      const orderedIds: number[] = [];
      for (const raw of patchKm ?? []) {
        const idKm = Number(raw);
        if (!Number.isFinite(idKm) || seenKm.has(idKm)) continue;
        seenKm.add(idKm);
        orderedIds.push(idKm);
        await mgr.insert(ViThuocKinhMach, {
          id_vi_thuoc: viId,
          id_kinh_mach: idKm,
        });
      }
      // Sync denormalized text column `quy_kinh` so existing analytics keep working.
      if (patchKm !== undefined) {
        const rows = orderedIds.length
          ? await mgr.find(KinhMach, {
              where: orderedIds.map((id) => ({ idKinhMach: id })),
            })
          : [];
        const byId = new Map(rows.map((r) => [r.idKinhMach, r]));
        const text = orderedIds
          .map((id) => byId.get(id)?.ten_kinh_mach?.trim())
          .filter((s): s is string => !!s)
          .join(', ');
        await mgr.update(ViThuoc, viId, { quy_kinh: text || null } as any);
      }
    }

    const patchNn = dto.nhom_nho_ids;
    if (patchNn !== undefined || isCreate) {
      await mgr.delete(NhomNhoViThuoc, { idViThuoc: viId });
      const seenNn = new Set<number>();
      for (const raw of patchNn ?? []) {
        const idNn = Number(raw);
        if (Number.isFinite(idNn) && idNn > 0) seenNn.add(idNn);
      }
      if (seenNn.size) {
        const rows = Array.from(seenNn).map((idNhomNho) => ({
          idNhomNho,
          idViThuoc: viId,
          thu_tu: 0,
        }));
        await mgr
          .createQueryBuilder()
          .insert()
          .into(NhomNhoViThuoc)
          .values(rows)
          .orIgnore()
          .execute();
      }
    }
  }

  async create(dto: CreateViThuocDto): Promise<ViThuoc> {
    return this.repo.manager.transaction(async (mgr) => {
      const item = mgr.create(ViThuoc, this.pickScalar(dto) as ViThuoc);
      const saved = await mgr.save(item);
      await this.syncLinkedRows(mgr, saved.id, dto, true);
      return (await mgr.findOne(ViThuoc, {
        where: { id: saved.id },
        relations: VI_THUOC_RELATIONS,
      })) as ViThuoc;
    });
  }

  async update(id: number, dto: UpdateViThuocDto): Promise<ViThuoc | null> {
    const patch = this.pickScalar(dto);
    if (Object.keys(patch).length > 0) {
      await this.repo.update(id, patch);
    }
    await this.repo.manager.transaction(async (mgr) => {
      await this.syncLinkedRows(mgr, id, dto, false);
    });
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.repo.manager.transaction(async (m) => {
      // Gỡ tham chiếu trong cổ phương (phuong_thang.thanh_phan[].id = id) → null, tránh để lại link gãy.
      // (Khác với "Gộp" — gộp chuyển sang vị đại diện; xoá thì chỉ bỏ liên kết, giữ tên trong bài.)
      await m.query(
        `UPDATE phuong_thang SET thanh_phan = (
           SELECT jsonb_agg(CASE WHEN (e->>'id')::int = $1 THEN jsonb_set(e, '{id}', 'null'::jsonb) ELSE e END)
           FROM jsonb_array_elements(thanh_phan) e)
         WHERE thanh_phan IS NOT NULL
           AND EXISTS (SELECT 1 FROM jsonb_array_elements(thanh_phan) e WHERE (e->>'id')::int = $1)`,
        [id],
      );
      await m.delete(ViThuoc, { id }); // CASCADE dọn bai_thuoc_chi_tiet + các link riêng
    });
  }
}
