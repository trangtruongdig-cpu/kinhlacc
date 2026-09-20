import {
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ThuongHanChungModel } from '../models/thuong-han-chung.model';
import {
  THUONG_HAN_CHUNG,
  type ThuongHanChung,
} from '../data/thuong-han-chung';
import { quyDoiLieu, HE_QUY_DOI, LUU_Y_BAO_CHE } from '../data/thuong-han-lieu';
import { chuanTenVi as chuanVi } from '../data/ten-vi-thuoc';

/**
 * Kho CHỨNG–PHƯƠNG Thương Hàn. Ba vai như bên Ngũ Hành Hồi Tác:
 *  • data/thuong-han-chung.ts giữ bộ chuẩn (soạn theo Tống bản, thầy thuốc duyệt từng kinh);
 *  • bảng `thuong_han_chung` là nơi tri thức SỐNG — sửa được trên app, sửa rồi thì seed không đè;
 *  • ca bệnh chỉ TRA, không luận lại.
 *
 * Liên kết sang kho bài thuốc dò theo THÀNH PHẦN (không theo tên) ngay lúc khởi động, vì id bài
 * thuốc khác nhau giữa các môi trường nên không thể ghi cứng vào tệp dữ liệu.
 */
@Injectable()
export class ThuongHanChungService implements OnApplicationBootstrap {
  private readonly logger = new Logger('ThuongHanChung');

  constructor(
    @InjectRepository(ThuongHanChungModel)
    private readonly repo: Repository<ThuongHanChungModel>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  private static readonly DDL = `CREATE TABLE IF NOT EXISTS thuong_han_chung (
       slug            VARCHAR(60) PRIMARY KEY,
       kinh            VARCHAR(40) NOT NULL,
       phan_loai       VARCHAR(20) NOT NULL,
       ten             VARCHAR(160) NOT NULL,
       han             VARCHAR(60),
       dieu_van        JSONB,
       de_cuong        TEXT,
       mach            VARCHAR(120),
       luoi            VARCHAR(160),
       cau_hoi_chot    JSONB,
       trieu_chung     JSONB,
       phap_tri        TEXT,
       chu_phuong      JSONB,
       gia_giam        JSONB,
       cam_ky          JSONB,
       truyen_sang     JSONB,
       dau_hieu        JSONB,
       id_bai_thuoc    INTEGER,
       khop_phan_tram  INTEGER,
       ghi_chu         TEXT,
       sua_tay         BOOLEAN NOT NULL DEFAULT false,
       nguoi_sua       VARCHAR(80),
       updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
     )`;

  /** Gắn liều gram + cảnh báo vào từng vị, để nơi dùng không phải tự quy đổi lại. */
  private chuPhuongKemLieu(c: ThuongHanChung) {
    return {
      ...c.chuPhuong,
      heQuyDoi: HE_QUY_DOI.ten,
      viThuoc: c.chuPhuong.viThuoc.map((v) => {
        const q = quyDoiLieu(v.ten, v.lieuGoc);
        return {
          ...v,
          lieuGram: q.gram,
          cachQuyDoi: q.cach,
          canhBaoLieu: q.canhBao ?? null,
          // Hai loại nhắc khác nhau: canhBaoLieu chỉ bật khi VƯỢT ngưỡng liều, còn luuYBaoChe đúng
          // ở MỌI liều (Bán hạ 9g không vượt ngưỡng nhưng vẫn phải dùng loại đã chế).
          luuYBaoChe: LUU_Y_BAO_CHE[v.ten] ?? null,
        };
      }),
    };
  }

  private toRow(c: ThuongHanChung): Partial<ThuongHanChungModel> {
    return {
      slug: c.slug,
      kinh: c.kinh,
      phan_loai: c.phanLoai,
      ten: c.ten,
      han: c.han,
      dieu_van: c.dieuVan,
      de_cuong: c.deCuong,
      mach: c.mach,
      luoi: c.luoi ?? null,
      cau_hoi_chot: c.cauHoiChot,
      trieu_chung: c.trieuChung,
      phap_tri: c.phapTri,
      chu_phuong: this.chuPhuongKemLieu(c),
      gia_giam: c.giaGiam ?? null,
      cam_ky: c.camKy ?? null,
      truyen_sang: c.truyenSang ?? null,
      sua_tay: false,
    };
  }

  /** Dò chủ phương vào kho theo tập vị; đòi đủ QUÂN + THẦN (vị "gia" mới làm nên chứng). */
  private async doKhopBaiThuoc(): Promise<
    Map<string, { id: number; phanTram: number }>
  > {
    const rows: Array<{ id: number; ten_vi_thuoc: string | null }> =
      await this.dataSource.query(
        `SELECT bt.id, vt.ten_vi_thuoc
         FROM bai_thuoc bt
         JOIN bai_thuoc_chi_tiet ct ON ct.id_bai_thuoc = bt.id
         JOIN vi_thuoc vt ON vt.id = ct.id_vi_thuoc`,
      );
    const khoVi = new Map<number, Set<string>>();
    for (const r of rows) {
      const k = chuanVi(r.ten_vi_thuoc);
      if (!k) continue;
      if (!khoVi.has(r.id)) khoVi.set(r.id, new Set());
      khoVi.get(r.id)!.add(k);
    }

    const out = new Map<string, { id: number; phanTram: number }>();
    for (const c of THUONG_HAN_CHUNG) {
      const A = new Set(c.chuPhuong.viThuoc.map((v) => chuanVi(v.ten)));
      const cotLoi = c.chuPhuong.viThuoc
        .filter((v) => v.vaiTro === 'quân' || v.vaiTro === 'thần')
        .map((v) => chuanVi(v.ten));
      let tot: { id: number; phanTram: number } | null = null;
      for (const [id, vi] of khoVi) {
        if (!vi.size) continue;
        const giao = [...A].filter((x) => vi.has(x)).length;
        const jac = giao / new Set([...A, ...vi]).size;
        if (jac < 0.8 || !cotLoi.every((q) => vi.has(q))) continue;
        const pt = Math.round(jac * 100);
        if (!tot || pt > tot.phanTram) tot = { id, phanTram: pt };
      }
      if (tot) out.set(c.slug, tot);
    }
    return out;
  }

  /**
   * KẾ THỪA ba danh mục chuẩn của app thay vì bắt thầy thuốc đọc câu hỏi văn xuôi:
   * `trieu_chung` (1033 mục) · `mach_chan` (44) · `thiet_chan` (48).
   * Triệu chứng khớp theo TÊN; mạch và lưỡi của Thương Hàn viết thành câu ("Huyền, hoặc huyền tế")
   * nên dò theo cách khác: tên trong danh mục có XUẤT HIỆN trong câu ấy không (bỏ tiền tố "mạch").
   * Nhờ vậy giao diện bày được CHECKLIST tick, và tick xong thì chấm được chứng nào khớp nhất.
   */
  private async khopDauHieu(): Promise<Map<string, unknown>> {
    const tc = await this.dataSource.query<
      Array<{ id: number; ten_trieu_chung: string }>
    >(`SELECT id, ten_trieu_chung FROM trieu_chung`);
    const mc = await this.dataSource.query<
      Array<{ id: number; ten_mach_chan: string }>
    >(`SELECT id, ten_mach_chan FROM mach_chan`);
    const ttc = await this.dataSource.query<
      Array<{ id: number; ten_thiet_chan: string }>
    >(`SELECT id, ten_thiet_chan FROM thiet_chan`);
    const chuan = (t: string | null | undefined) =>
      (t || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/gi, 'd')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
    const tcMap = new Map(tc.map((r) => [chuan(r.ten_trieu_chung), r]));
    // Mạch/lưỡi: bỏ tiền tố "mach"/"luoi" để "Mạch Phù" khớp được chữ "phù" trong câu mô tả.
    const goc = (t: string) =>
      chuan(t)
        .replace(/^(mach|luoi)\s+/, '')
        .trim();
    const mcList = mc
      .map((r) => ({ ...r, key: goc(r.ten_mach_chan) }))
      .filter((r) => r.key.length >= 2);
    const ttcList = ttc
      .map((r) => ({ ...r, key: goc(r.ten_thiet_chan) }))
      .filter((r) => r.key.length >= 3);

    const out = new Map<string, unknown>();
    for (const c of THUONG_HAN_CHUNG) {
      const dsTrieu = (c.trieuChung || []).map((t) => {
        const r = tcMap.get(chuan(t));
        return r ? { id: r.id, ten: r.ten_trieu_chung } : { id: null, ten: t };
      });
      const cauMach = chuan(c.mach);
      const dsMach = mcList
        .filter((m) => cauMach.includes(m.key))
        .map((m) => ({ id: m.id, ten: m.ten_mach_chan }));
      const cauLuoi = chuan(c.luoi);
      const dsLuoi = cauLuoi
        ? ttcList
            .filter((t) => cauLuoi.includes(t.key))
            .map((t) => ({ id: t.id, ten: t.ten_thiet_chan }))
        : [];
      out.set(c.slug, { trieuChung: dsTrieu, mach: dsMach, luoi: dsLuoi });
    }
    return out;
  }

  /**
   * Cột thêm sau khi bảng đã tồn tại: CREATE TABLE IF NOT EXISTS KHÔNG đụng tới bảng cũ, nên phải
   * ALTER riêng. Bỏ bước này thì service chết lặng ở boot ("column ... does not exist") và bảng
   * không được seed — đã mắc 20/09/2026.
   */
  private static readonly ALTER: ReadonlyArray<string> = [
    `ALTER TABLE thuong_han_chung ADD COLUMN IF NOT EXISTS dau_hieu JSONB`,
    `ALTER TABLE thuong_han_chung ADD COLUMN IF NOT EXISTS khop_phan_tram INTEGER`,
    `ALTER TABLE thuong_han_chung ADD COLUMN IF NOT EXISTS id_bai_thuoc INTEGER`,
  ];

  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.dataSource.query(ThuongHanChungService.DDL);
      for (const sql of ThuongHanChungService.ALTER)
        await this.dataSource.query(sql);
      const daCo = await this.repo.find({ select: ['slug', 'sua_tay'] });
      const co = new Map(daCo.map((r) => [r.slug, r]));
      const khop = await this.doKhopBaiThuoc();
      const dauHieu = await this.khopDauHieu();

      const ghi: Partial<ThuongHanChungModel>[] = [];
      let themMoi = 0;
      let dongBo = 0;
      for (const c of THUONG_HAN_CHUNG) {
        const cu = co.get(c.slug);
        // Bản thầy thuốc đã sửa là quyết định lâm sàng — không đè bằng bộ chuẩn.
        if (cu?.sua_tay) continue;
        const k = khop.get(c.slug);
        ghi.push({
          ...this.toRow(c),
          dau_hieu: dauHieu.get(c.slug) ?? null,
          id_bai_thuoc: k?.id ?? null,
          khop_phan_tram: k?.phanTram ?? null,
        });
        if (cu) dongBo++;
        else themMoi++;
      }
      if (ghi.length) await this.repo.save(ghi as ThuongHanChungModel[]);
      const chuaGan = THUONG_HAN_CHUNG.length - khop.size;
      this.logger.log(
        `Thương Hàn chứng: bảng OK, bộ chuẩn ${THUONG_HAN_CHUNG.length} chứng, thêm mới ${themMoi}, ` +
          `đồng bộ ${dongBo}, gắn được bài thuốc ${khop.size}${chuaGan ? `, CHƯA gắn ${chuaGan}` : ''}.`,
      );
    } catch (err) {
      this.logger.warn(
        `Bỏ qua khởi tạo Thương Hàn chứng (không chặn boot): ${(err as Error).message}`,
      );
    }
  }

  /**
   * GỢI Ý CHO MỘT CA: đo → kinh → (hỏi triệu chứng) → pháp trị → bài thuốc.
   *
   * Mắt xích PHÁP TRỊ vốn đã có sẵn trong app (bảng `phap_tri`: 380 bản ghi, 289 gắn triệu chứng
   * chuẩn, 379 gắn bài thuốc, và có tag `luc_kinh`) — nên ở đây KHÔNG dựng lại hệ lý luận, chỉ lọc
   * theo kinh rồi trả kèm triệu chứng + bài thuốc để giao diện bày checklist và chấm điểm.
   * Hai nguồn song song, không trộn: `chung` là chứng–phương Thương Hàn (cổ phương, điều văn, cấm
   * kỵ), `phapTri` là hệ pháp trị của phòng chẩn trị.
   */
  async goiYTheoKinh(kinhSlug: string) {
    const TEN: Record<string, string> = {
      'thai-duong': 'thái dương',
      'duong-minh': 'dương minh',
      'thieu-duong': 'thiếu dương',
      'thai-am': 'thái âm',
      'thieu-am': 'thiếu âm',
      'quyet-am': 'quyết âm',
    };
    const ten = TEN[kinhSlug];
    const chung = await this.findAll(kinhSlug);
    if (!ten) return { kinh: kinhSlug, chung, phapTri: [] };

    const rows = await this.dataSource.query<
      Array<{
        id: number;
        the_benh: string | null;
        nguyen_tac: string | null;
        bat_cuong: string | null;
        luc_kinh: string | null;
        id_bai_thuoc: number | null;
        ten_bai_thuoc: string | null;
        trieu_chung: string | null;
      }>
    >(
      `SELECT pt.id, pt.the_benh, pt.nguyen_tac, pt.bat_cuong, pt.luc_kinh,
              pt.id_bai_thuoc, bt.ten_bai_thuoc,
              string_agg(DISTINCT tc.ten_trieu_chung, '|') AS trieu_chung
         FROM phap_tri pt
         LEFT JOIN bai_thuoc bt ON bt.id = pt.id_bai_thuoc
         LEFT JOIN phap_tri_trieu_chung ptc ON ptc.id_phap_tri = pt.id
         LEFT JOIN trieu_chung tc ON tc.id = ptc.id_trieu_chung
        WHERE LOWER(pt.luc_kinh) LIKE $1
        GROUP BY pt.id, bt.ten_bai_thuoc
        ORDER BY pt.the_benh`,
      [`%${ten}%`],
    );

    return {
      kinh: kinhSlug,
      chung,
      phapTri: rows.map((r) => ({
        id: r.id,
        theBenh: r.the_benh,
        nguyenTac: r.nguyen_tac,
        batCuong: r.bat_cuong,
        idBaiThuoc: r.id_bai_thuoc,
        tenBaiThuoc: r.ten_bai_thuoc,
        trieuChung: r.trieu_chung
          ? r.trieu_chung.split('|').filter(Boolean)
          : [],
      })),
    };
  }

  findAll(kinh?: string) {
    const qb = this.repo.createQueryBuilder('c');
    if (kinh) qb.where('c.kinh = :kinh', { kinh });
    return qb
      .orderBy('c.kinh', 'ASC')
      .addOrderBy('c.phan_loai', 'ASC')
      .addOrderBy('c.slug', 'ASC')
      .getMany();
  }

  async findOne(slug: string) {
    const row = await this.repo.findOne({ where: { slug } });
    if (!row) throw new NotFoundException(`Không có chứng ${slug}`);
    return row;
  }

  /** Lối vào của PHIẾU ĐO: đã định vị kinh rồi thì lấy các chứng của kinh đó để hỏi tiếp. */
  tra(kinh: string) {
    return this.findAll(kinh);
  }

  async ghiDe(
    slug: string,
    patch: Partial<ThuongHanChungModel>,
    nguoiSua?: string,
  ) {
    const row = await this.findOne(slug);
    const { slug: _bo, ...duocSua } = patch;
    void _bo;
    Object.assign(row, duocSua, {
      sua_tay: true,
      nguoi_sua: nguoiSua ?? row.nguoi_sua,
      updated_at: new Date(),
    });
    return this.repo.save(row);
  }

  async khoiPhuc(slug: string) {
    const seed = THUONG_HAN_CHUNG.find((c) => c.slug === slug);
    if (!seed) throw new NotFoundException(`Bộ chuẩn không có chứng ${slug}`);
    const khop = (await this.doKhopBaiThuoc()).get(slug);
    const row = await this.repo.findOne({ where: { slug } });
    const moi = {
      ...(row ?? {}),
      ...this.toRow(seed),
      id_bai_thuoc: khop?.id ?? null,
      khop_phan_tram: khop?.phanTram ?? null,
      ghi_chu: null,
      nguoi_sua: null,
      updated_at: new Date(),
    };
    return this.repo.save(moi as ThuongHanChungModel);
  }
}
