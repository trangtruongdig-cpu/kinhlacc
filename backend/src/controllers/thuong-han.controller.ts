import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ThuongHanLop } from '../models/thuong-han-lop.model';
import { ThuongHanLucKinh } from '../models/thuong-han-luc-kinh.model';
import { ThuongHanBenhCo } from '../models/thuong-han-benh-co.model';
import { PhapTri } from '../models/phap-tri.model';
import { SEED_LOP, SEED_LUC_KINH } from '../data/thuong-han-seed';
import { THUONG_HAN_CHUAN } from '../data/thuong-han-chuan';
import { suyBenhCoAll } from '../data/thuong-han-suy';
import type { SuyInput, OverrideRow } from '../data/thuong-han-suy';

// ---- Cầu nối GIAI ĐOẠN → KINH (cố định, theo lý thuyết; không cần đổi schema) ----
// Danh mục ton_thuong_tac_nhan gắn vào phap_tri.luc_kinh (chuỗi, cách nhau bằng dấu phẩy).
interface StageHit {
  kinhSlug?: string;
  phan?: string;
}
const KINH_KEY: ReadonlyArray<{ key: string; slug: string }> = [
  { key: 'thái dương', slug: 'thai-duong' },
  { key: 'dương minh', slug: 'duong-minh' },
  { key: 'thiếu dương', slug: 'thieu-duong' },
  { key: 'thái âm', slug: 'thai-am' },
  { key: 'thiếu âm', slug: 'thieu-am' },
  { key: 'quyết âm', slug: 'quyet-am' },
];
const PHAN_KEY: ReadonlyArray<{ key: string; ten: string }> = [
  { key: 'vệ', ten: 'Vệ Phận' },
  { key: 'khí phận', ten: 'Khí Phận' },
  { key: 'dinh', ten: 'Dinh Phận' },
  { key: 'huyết', ten: 'Huyết Phận' },
];

/** Tách chuỗi luc_kinh của pháp trị thành các "chặng" (kinh Lục Kinh hoặc phận Ôn bệnh). */
function parseStages(lucKinh: string | null | undefined): StageHit[] {
  if (!lucKinh) return [];
  return lucKinh
    .split(',')
    .map((part): StageHit => {
      const t = part.trim().toLowerCase();
      const k = KINH_KEY.find((m) => t.includes(m.key));
      if (k) return { kinhSlug: k.slug };
      const p = PHAN_KEY.find((m) => t.includes(m.key));
      if (p) return { phan: p.ten };
      return {};
    })
    .filter((x) => x.kinhSlug || x.phan);
}

/**
 * Service cho tính năng "Thương Hàn Tạp Luận Bệnh".
 * Tự tạo bảng + nạp seed IDEMPOTENT khi boot (giống SchemaBootstrapService) → tính năng
 * hoạt động ở mọi môi trường mà không cần chạy migration tay; không ghi đè bản đã sửa.
 */
@Injectable()
export class ThuongHanService implements OnApplicationBootstrap {
  private readonly logger = new Logger('ThuongHan');

  constructor(
    @InjectRepository(ThuongHanLop)
    private readonly lopRepo: Repository<ThuongHanLop>,
    @InjectRepository(ThuongHanLucKinh)
    private readonly lucKinhRepo: Repository<ThuongHanLucKinh>,
    @InjectRepository(PhapTri)
    private readonly phapTriRepo: Repository<PhapTri>,
    @InjectRepository(ThuongHanBenhCo)
    private readonly benhCoRepo: Repository<ThuongHanBenhCo>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  private static readonly DDL: ReadonlyArray<string> = [
    `CREATE TABLE IF NOT EXISTS thuong_han_lop (
       id          SERIAL PRIMARY KEY,
       slug        VARCHAR(40) UNIQUE NOT NULL,
       thu_tu      INTEGER NOT NULL DEFAULT 0,
       ten         VARCHAR(120) NOT NULL,
       ten_han     VARCHAR(40),
       tom_tat     TEXT,
       khai_niem   TEXT,
       vi_du       TEXT,
       vi_sao      TEXT,
       lien_he_app TEXT,
       du_lieu     JSONB
     )`,
    `CREATE TABLE IF NOT EXISTS thuong_han_luc_kinh (
       id             SERIAL PRIMARY KEY,
       slug           VARCHAR(40) UNIQUE NOT NULL,
       thu_tu         INTEGER NOT NULL DEFAULT 0,
       ten            VARCHAR(60) NOT NULL,
       ten_han        VARCHAR(20),
       nhom           VARCHAR(10) NOT NULL DEFAULT 'duong',
       deg            INTEGER NOT NULL DEFAULT 0,
       ban_khi        VARCHAR(40),
       ban_khi_han    VARCHAR(20),
       hanh           VARCHAR(10),
       tong_hoa       VARCHAR(20),
       tong_hoa_note  TEXT,
       khai_hap_xu    VARCHAR(10),
       trung_kien     VARCHAR(80),
       tang_phu_dich  VARCHAR(80),
       tang_phu_han   VARCHAR(40),
       tang_phu_type  VARCHAR(10),
       tang_phu_sub   TEXT,
       trieu_chung    TEXT,
       tri_phap       VARCHAR(120),
       truyen_bien    TEXT,
       bai_thuoc_refs JSONB
     )`,
    `CREATE TABLE IF NOT EXISTS thuong_han_benh_co (
       id_phap_tri    INTEGER PRIMARY KEY,
       he             VARCHAR(12),
       giai_doan_slug VARCHAR(40),
       tang_phu       TEXT,
       khi            TEXT,
       ghi_chu        TEXT,
       nguoi_sua      VARCHAR(80),
       updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
     )`,
  ];

  async onApplicationBootstrap(): Promise<void> {
    try {
      for (const ddl of ThuongHanService.DDL) {
        await this.dataSource.query(ddl);
      }
      // Nạp seed CHỈ cho slug còn thiếu → không đè bản đã chỉnh; repo.save xử lý jsonb an toàn.
      const haveLop = new Set((await this.lopRepo.find({ select: ['slug'] })).map((r) => r.slug));
      const missingLop = SEED_LOP.filter((s) => !haveLop.has(s.slug));
      if (missingLop.length) await this.lopRepo.save(missingLop);

      const haveKinh = new Set((await this.lucKinhRepo.find({ select: ['slug'] })).map((r) => r.slug));
      const missingKinh = SEED_LUC_KINH.filter((s) => !haveKinh.has(s.slug));
      if (missingKinh.length) await this.lucKinhRepo.save(missingKinh);

      this.logger.log(
        `Thương Hàn: bảng OK, seed thêm ${missingLop.length} lớp / ${missingKinh.length} kinh.`,
      );

      // Log phủ sóng "định vị" ngay khi boot → có số liệu thật để quyết định UI.
      const tq = await this.tongQuan();
      const cov = tq.lucKinh.map((k) => `${k.ten}=${k.so_the}`).join(' · ');
      this.logger.log(
        `Thương Hàn phủ sóng pháp trị: ${cov} · Vệ/Khí/Dinh/Huyết=${tq.veKhiDinhHuyet
          .map((p) => p.so_the)
          .join('/')} · CHƯA gắn=${tq.chuaGan}/${tq.tong}`,
      );
    } catch (err) {
      this.logger.warn(`Bỏ qua khởi tạo Thương Hàn (không chặn boot): ${(err as Error).message}`);
    }
  }

  findLop(): Promise<ThuongHanLop[]> {
    return this.lopRepo.find({ order: { thu_tu: 'ASC' } });
  }

  findLucKinh(): Promise<ThuongHanLucKinh[]> {
    return this.lucKinhRepo.find({ order: { thu_tu: 'ASC' } });
  }

  /**
   * Tổng quan phủ sóng: mỗi kinh có bao nhiêu pháp trị (thể bệnh) đã gắn giai đoạn,
   * tạng phủ + khí TỰ SUY từ lý thuyết GĐ1, và bao nhiêu thể CHƯA gắn (lỗ hổng lý thuyết).
   */
  async tongQuan() {
    const phaps = await this.phapTriRepo.find({ select: ['id', 'luc_kinh'] });
    const kinhRows = await this.lucKinhRepo.find({ order: { thu_tu: 'ASC' } });
    const kinhCount: Record<string, number> = {};
    const phanCount: Record<string, number> = {};
    let chuaGan = 0;
    for (const p of phaps) {
      const st = parseStages(p.luc_kinh);
      if (!st.length) {
        chuaGan++;
        continue;
      }
      const slugs = new Set<string>();
      const phans = new Set<string>();
      for (const s of st) {
        if (s.kinhSlug) slugs.add(s.kinhSlug);
        if (s.phan) phans.add(s.phan);
      }
      slugs.forEach((s) => (kinhCount[s] = (kinhCount[s] || 0) + 1));
      phans.forEach((s) => (phanCount[s] = (phanCount[s] || 0) + 1));
    }
    return {
      tong: phaps.length,
      chuaGan,
      lucKinh: kinhRows.map((k) => ({
        slug: k.slug,
        ten: k.ten,
        ten_han: k.ten_han,
        nhom: k.nhom,
        tang_phu: k.tang_phu_dich,
        khi: k.ban_khi,
        tri_phap: k.tri_phap,
        so_the: kinhCount[k.slug] || 0,
      })),
      veKhiDinhHuyet: PHAN_KEY.map((p) => ({ ten: p.ten, so_the: phanCount[p.ten] || 0 })),
    };
  }

  /** Danh sách thể bệnh/pháp trị ở một giai đoạn (kinh) + tạng phủ/khí tự suy. */
  async dinhViTheoKinh(slug: string) {
    const kinh = await this.lucKinhRepo.findOne({ where: { slug } });
    if (!kinh) return { kinh: null, items: [] };
    const km = KINH_KEY.find((k) => k.slug === slug);
    const keyword = km ? km.key : kinh.ten.toLowerCase();
    const rows = await this.phapTriRepo
      .createQueryBuilder('p')
      .select([
        'p.id',
        'p.chung_trang',
        'p.nguyen_tac',
        'p.bat_phap',
        'p.ton_thuong',
        'p.tac_nhan',
        'p.luc_kinh',
      ])
      .where('p.luc_kinh ILIKE :k', { k: `%${keyword}%` })
      .orderBy('p.id', 'ASC')
      .getMany();
    // Lọc lại bằng parseStages để tránh khớp nhầm chuỗi ILIKE.
    const items = rows
      .filter((r) => parseStages(r.luc_kinh).some((s) => s.kinhSlug === slug))
      .map((r) => ({
        id: r.id,
        the: r.chung_trang,
        nguyen_tac: r.nguyen_tac,
        bat_phap: r.bat_phap,
        ton_thuong: r.ton_thuong,
        tac_nhan: r.tac_nhan,
      }));
    return {
      kinh: {
        slug: kinh.slug,
        ten: kinh.ten,
        ten_han: kinh.ten_han,
        nhom: kinh.nhom,
        tang_phu: kinh.tang_phu_dich,
        tang_phu_han: kinh.tang_phu_han,
        khi: kinh.ban_khi,
        ban_khi_han: kinh.ban_khi_han,
        tong_hoa_note: kinh.tong_hoa_note,
        tri_phap: kinh.tri_phap,
        truyen_bien: kinh.truyen_bien,
      },
      items,
    };
  }

  /**
   * BỆNH CƠ tự suy cho toàn kho pháp trị (đọc DB thô + chạy engine CHUẨN) + đối chiếu +
   * hoà ghi đè tay. KHÔNG ghi gì trong lúc đọc. Kết quả để hiển thị / soi.
   */
  async benhCo(): Promise<{ results: unknown[]; summary: Record<string, unknown>; consistency: unknown }> {
    const q = <T = Record<string, unknown>>(sql: string): Promise<T[]> =>
      this.dataSource.query(sql) as Promise<T[]>;
    const [phapTri, btpt, btct, viThuoc, btNames, ptTc, trieuChung, overrides] = await Promise.all([
      q(`SELECT id, the_benh, nguyen_tac, y_nghia_co_che, trieu_chung_mo_ta, luc_kinh, id_bai_thuoc FROM phap_tri ORDER BY id`),
      q(`SELECT id_bai_thuoc, id_phap_tri FROM bai_thuoc_phap_tri`),
      q(`SELECT id_bai_thuoc, id_vi_thuoc, vai_tro FROM bai_thuoc_chi_tiet`),
      q(`SELECT id, tinh, quy_kinh FROM vi_thuoc`),
      q(`SELECT id, ten_bai_thuoc FROM bai_thuoc`),
      q(`SELECT id_phap_tri, id_trieu_chung FROM phap_tri_trieu_chung`),
      q(`SELECT id, ten_trieu_chung FROM trieu_chung`),
      this.benhCoRepo.find(),
    ]);
    const input = {
      phapTri, btpt, btct, viThuoc, btNames, ptTc, trieuChung,
      overrides: overrides as unknown as OverrideRow[],
      chuan: THUONG_HAN_CHUAN,
    } as unknown as SuyInput;
    const { results, summary } = suyBenhCoAll(input);
    const consistency = (THUONG_HAN_CHUAN as { consistency?: unknown }).consistency ?? null;
    return { results, summary, consistency };
  }

  /**
   * Bản đồ NÉN thể bệnh → Lục Kinh do CHÍNH ENGINE suy — MỘT NGUỒN SỰ THẬT cho kết luận Lục Kinh
   * ở trang Kết Quả Đo (thay bảng tĩnh phía frontend). Gộp theo tên thể (chuẩn hoá bỏ dấu), mỗi thể
   * lấy phân loại độ tin CAO nhất; chỉ trục Lục Kinh (thể ôn bệnh/tạp bệnh → không có trong map = ngoài).
   */
  async theKinhMap(): Promise<Record<string, { kinh: string; kinh_phu: string | null; do_tin: string; ten: string }>> {
    const q = <T = Record<string, unknown>>(sql: string): Promise<T[]> =>
      this.dataSource.query(sql) as Promise<T[]>;
    const [phapTri, btpt, btct, viThuoc, btNames, ptTc, trieuChung, overrides] = await Promise.all([
      q(`SELECT id, the_benh, nguyen_tac, y_nghia_co_che, trieu_chung_mo_ta, luc_kinh, id_bai_thuoc FROM phap_tri ORDER BY id`),
      q(`SELECT id_bai_thuoc, id_phap_tri FROM bai_thuoc_phap_tri`),
      q(`SELECT id_bai_thuoc, id_vi_thuoc, vai_tro FROM bai_thuoc_chi_tiet`),
      q(`SELECT id, tinh, quy_kinh FROM vi_thuoc`),
      q(`SELECT id, ten_bai_thuoc FROM bai_thuoc`),
      q(`SELECT id_phap_tri, id_trieu_chung FROM phap_tri_trieu_chung`),
      q(`SELECT id, ten_trieu_chung FROM trieu_chung`),
      this.benhCoRepo.find(),
    ]);
    const { results } = suyBenhCoAll({
      phapTri, btpt, btct, viThuoc, btNames, ptTc, trieuChung,
      overrides: overrides as unknown as OverrideRow[], chuan: THUONG_HAN_CHUAN,
    } as unknown as SuyInput);
    const norm = (s: string | null | undefined): string =>
      (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const rank: Record<string, number> = { cao: 3, vua: 2, thap: 1 };
    const map: Record<string, { kinh: string; kinh_phu: string | null; do_tin: string; ten: string }> = {};
    for (const r of results as Array<{ the_benh: string | null; giai_doan: { he: string; slug?: string; slug_phu?: string; ten: string; do_tin: string } | null }>) {
      const g = r.giai_doan;
      if (!g || g.he !== 'luc-kinh' || !g.slug) continue;
      const key = norm(r.the_benh);
      if (!key) continue;
      const cur = map[key];
      if (!cur || (rank[g.do_tin] ?? 0) > (rank[cur.do_tin] ?? 0)) {
        map[key] = { kinh: g.slug, kinh_phu: g.slug_phu ?? null, do_tin: g.do_tin, ten: g.ten };
      }
    }
    return map;
  }

  /**
   * CHỈ MỤC: gom thể bệnh theo Lục Kinh · Lục Khí · Tạng Phủ (từ dữ liệu chuẩn luc_kinh +
   * kinh mạch). Dùng cho vòng lý thuyết: trỏ vào đâu → liệt kê thể bệnh tương ứng.
   */
  async chiMuc(): Promise<Record<string, unknown>> {
    const q = <T = Record<string, unknown>>(sql: string): Promise<T[]> => this.dataSource.query(sql) as Promise<T[]>;
    const [pts, links, kms, btLinks, btNames] = await Promise.all([
      q<{ id: number; the_benh: string | null; nguyen_tac: string | null; luc_kinh: string | null; id_bai_thuoc: number | null }>(`SELECT id, the_benh, nguyen_tac, luc_kinh, id_bai_thuoc FROM phap_tri ORDER BY the_benh`),
      q<{ id_phap_tri: number; id_kinh_mach: number }>(`SELECT id_phap_tri, id_kinh_mach FROM phap_tri_kinh_mach`),
      q<{ id_kinh_mach: number; ten_viet_tat: string | null }>(`SELECT id_kinh_mach, ten_viet_tat FROM kinh_mach`),
      q<{ id_phap_tri: number; id_bai_thuoc: number }>(`SELECT id_phap_tri, id_bai_thuoc FROM bai_thuoc_phap_tri`),
      q<{ id: number; ten_bai_thuoc: string | null }>(`SELECT id, ten_bai_thuoc FROM bai_thuoc`),
    ]);
    const kmName = new Map(kms.map((k) => [k.id_kinh_mach, k.ten_viet_tat]));
    const kmByPt = new Map<number, string[]>();
    for (const l of links) {
      const n = kmName.get(l.id_kinh_mach);
      if (!n) continue;
      if (!kmByPt.has(l.id_phap_tri)) kmByPt.set(l.id_phap_tri, []);
      kmByPt.get(l.id_phap_tri)!.push(n);
    }
    const btName = new Map(btNames.map((b) => [b.id, b.ten_bai_thuoc]));
    const btByPt = new Map<number, string[]>();
    const addBt = (pt: number, bt: number | null): void => {
      const n = bt != null ? btName.get(bt) : null;
      if (!n) return;
      if (!btByPt.has(pt)) btByPt.set(pt, []);
      if (!btByPt.get(pt)!.includes(n)) btByPt.get(pt)!.push(n);
    };
    for (const l of btLinks) addBt(l.id_phap_tri, l.id_bai_thuoc);
    for (const p of pts) addBt(p.id, p.id_bai_thuoc);

    const KINH_SLUG: Record<string, string> = {
      'Thái Dương Kinh Chứng': 'thai-duong', 'Dương Minh Kinh Chứng': 'duong-minh', 'Thiếu Dương Kinh Chứng': 'thieu-duong',
      'Thái Âm Kinh Chứng': 'thai-am', 'Thiếu Âm Kinh Chứng': 'thieu-am', 'Quyết Âm Kinh Chứng': 'quyet-am',
    };
    const PHAN = new Set(['Vệ Phận', 'Khí Phận', 'Dinh Phận', 'Huyết Phận']);
    const LUCKHI = new Set(['Phong', 'Hàn', 'Thử', 'Thấp', 'Táo', 'Nhiệt']);
    const TAM_TIEU = new Set(['Thượng Tiêu', 'Trung Tiêu', 'Hạ Tiêu']);
    const records: Record<number, { ten: string | null; nguyen_tac: string | null; bai_thuoc: string[] }> = {};
    const lucKinh: Record<string, number[]> = {}, phan: Record<string, number[]> = {}, tamTieu: Record<string, number[]> = {}, lucKhi: Record<string, number[]> = {}, tangPhu: Record<string, number[]> = {};
    const tapBenh: number[] = [];
    const push = (o: Record<string, number[]>, k: string, id: number): void => { (o[k] = o[k] || []).push(id); };
    for (const p of pts) {
      records[p.id] = { ten: p.the_benh, nguyen_tac: p.nguyen_tac, bai_thuoc: (btByPt.get(p.id) ?? []).slice(0, 6) };
      for (const t of (p.luc_kinh || '').split(',').map((s) => s.trim()).filter(Boolean)) {
        if (KINH_SLUG[t]) push(lucKinh, KINH_SLUG[t], p.id);
        else if (PHAN.has(t)) push(phan, t, p.id);
        else if (TAM_TIEU.has(t)) push(tamTieu, t, p.id);
        else if (t === 'Tạp Bệnh') tapBenh.push(p.id);
        else if (LUCKHI.has(t)) push(lucKhi, t, p.id);
      }
      for (const org of new Set(kmByPt.get(p.id) || [])) push(tangPhu, org, p.id);
    }
    return { tong: pts.length, records, lucKinh, phan, tamTieu, tapBenh, lucKhi, tangPhu };
  }

  /**
   * BÀN XOAY BIỆN CHỨNG: lớp Bệnh Tây Y (con của thể bệnh Đông Y) + cầu nối qua BÀI THUỐC chung.
   * Dùng CHUNG với /chi-muc (khung Lục Kinh·Tạng Phủ·Lục Khí + records thể bệnh Đông Y).
   * - nhomKhoa: 6 chuyên khoa (chung_benh) làm bàn xoay cấp trên.
   * - tayY: mỗi bệnh Tây Y → phap_tri_ids (thể bệnh Đông Y cha, nối qua bài thuốc), bài thuốc, triệu chứng.
   * - ptTrieuChung: triệu chứng của từng pháp trị (bổ sung cho records của /chi-muc).
   */
  async bienChung(): Promise<Record<string, unknown>> {
    const q = <T = Record<string, unknown>>(sql: string): Promise<T[]> => this.dataSource.query(sql) as Promise<T[]>;
    const [nhomRows, tayYRows, tyBt, tyPt, tyTc, ptTc, ptLk] = await Promise.all([
      q<{ id: number; ten: string }>(`SELECT id, ten_chung_benh AS ten FROM chung_benh ORDER BY id`),
      q<{ id: number; ten: string; nhom_id: number }>(`SELECT id, ten_benh AS ten, id_chung_benh AS nhom_id FROM benh_tay_y ORDER BY ten_benh`),
      q<{ b: number; ten: string | null }>(`SELECT bty.id_benh_tay_y AS b, bt.ten_bai_thuoc AS ten FROM benh_tay_y_bai_thuoc bty JOIN bai_thuoc bt ON bt.id = bty.id_bai_thuoc`),
      q<{ b: number; p: number }>(`SELECT DISTINCT bty.id_benh_tay_y AS b, bp.id_phap_tri AS p FROM benh_tay_y_bai_thuoc bty JOIN bai_thuoc_phap_tri bp ON bp.id_bai_thuoc = bty.id_bai_thuoc`),
      q<{ b: number; ten: string | null }>(`SELECT q.id_benh_tay_y AS b, tc.ten_trieu_chung AS ten FROM quan_he_benh_trieu_chung q JOIN trieu_chung tc ON tc.id = q.id_trieu_chung`),
      q<{ p: number; ten: string | null }>(`SELECT pt.id_phap_tri AS p, tc.ten_trieu_chung AS ten FROM phap_tri_trieu_chung pt JOIN trieu_chung tc ON tc.id = pt.id_trieu_chung`),
      q<{ id: number; lk: string | null }>(`SELECT id, luc_kinh AS lk FROM phap_tri`),
    ]);
    const collect = <T extends { ten: string | null }>(rows: T[], key: (r: T) => number): Map<number, string[]> => {
      const m = new Map<number, string[]>();
      for (const r of rows) {
        const k = key(r);
        if (!r.ten) continue;
        const arr = m.get(k) ?? [];
        if (!arr.includes(r.ten)) arr.push(r.ten);
        m.set(k, arr);
      }
      return m;
    };
    const btMap = collect(tyBt, (r) => r.b);
    const tcMap = collect(tyTc, (r) => r.b);
    const ptMap = new Map<number, number[]>();
    for (const r of tyPt) { const a = ptMap.get(r.b) ?? []; a.push(r.p); ptMap.set(r.b, a); }
    const ptTcMap = collect(ptTc, (r) => r.p);

    const tayY = tayYRows.map((r) => ({
      id: r.id, ten: r.ten, nhom_id: r.nhom_id,
      phap_tri_ids: ptMap.get(r.id) ?? [],
      bai_thuoc: (btMap.get(r.id) ?? []).slice(0, 8),
      trieu_chung: tcMap.get(r.id) ?? [],
    }));
    const ptTrieuChung: Record<number, string[]> = {};
    for (const [p, arr] of ptTcMap) ptTrieuChung[p] = arr;
    // Tổn thương-Tác nhân THÔ (cột luc_kinh) — frontend bucket theo 3 trục (Định vị/Tác nhân/Tính chất).
    const ptTonThuong: Record<number, string[]> = {};
    for (const r of ptLk) {
      const vals = [...new Set((r.lk ?? '').split(',').map((s) => s.trim()).filter(Boolean))];
      if (vals.length) ptTonThuong[r.id] = vals;
    }
    const usedNhom = new Set(tayYRows.map((r) => r.nhom_id));
    const nhomKhoa = nhomRows
      .filter((n) => usedNhom.has(n.id))
      .map((n) => ({ id: n.id, ten: n.ten, so: tayYRows.filter((r) => r.nhom_id === n.id).length }));
    return { nhomKhoa, tayY, ptTrieuChung, ptTonThuong };
  }

  /** Lưu (hoặc xoá nếu rỗng) ghi đè tay bệnh cơ của 1 pháp trị — Hybrid. */
  async saveOverride(idPhapTri: number, dto: Partial<ThuongHanBenhCo>): Promise<{ saved?: boolean; deleted?: boolean; override?: ThuongHanBenhCo }> {
    const clean = (v: unknown): string | null => {
      const s = typeof v === 'string' ? v.trim() : v;
      return s ? String(s) : null;
    };
    const empty = !clean(dto.giai_doan_slug) && !clean(dto.tang_phu) && !clean(dto.khi) && !clean(dto.ghi_chu);
    if (empty) {
      await this.benhCoRepo.delete({ id_phap_tri: idPhapTri });
      return { deleted: true };
    }
    const row = this.benhCoRepo.create({
      id_phap_tri: idPhapTri,
      he: clean(dto.he),
      giai_doan_slug: clean(dto.giai_doan_slug),
      tang_phu: clean(dto.tang_phu),
      khi: clean(dto.khi),
      ghi_chu: clean(dto.ghi_chu),
      nguoi_sua: clean(dto.nguoi_sua),
      updated_at: new Date(),
    });
    await this.benhCoRepo.save(row);
    return { saved: true, override: row };
  }
}
