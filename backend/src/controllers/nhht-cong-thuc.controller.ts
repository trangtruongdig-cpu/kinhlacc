import {
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { NhhtCongThuc } from '../models/nhht-cong-thuc.model';
import {
  NHHT_CONG_THUC,
  NHHT_SINH_LUC,
  type NhhtCongThuc as CongThucSeed,
} from '../data/nhht-cong-thuc';

/**
 * Ngũ Hành Hồi Tác — kho CÔNG THỨC.
 *
 * Ba vai rạch ròi, đừng trộn:
 *  • ENGINE (frontend/src/lib/nguHanhHoiTac.ts) sinh bộ chuẩn — kết tinh ở data/nhht-cong-thuc.ts.
 *  • BẢNG nhht_cong_thuc là nơi tri thức SỐNG: thầy thuốc sửa được, sửa rồi thì seed không đè.
 *  • CA BỆNH chỉ TRA bảng, không luận lại — nên luôn truy được "phiếu này theo công thức nào".
 */
@Injectable()
export class NhhtCongThucService implements OnApplicationBootstrap {
  private readonly logger = new Logger('NhhtCongThuc');

  constructor(
    @InjectRepository(NhhtCongThuc)
    private readonly repo: Repository<NhhtCongThuc>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  private static readonly DDL = `CREATE TABLE IF NOT EXISTS nhht_cong_thuc (
       ma               VARCHAR(60) PRIMARY KEY,
       kinh             VARCHAR(40) NOT NULL,
       hanh             VARCHAR(20) NOT NULL,
       trang_thai       VARCHAR(10) NOT NULL,
       khung            VARCHAR(20) NOT NULL,
       khung_ten        VARCHAR(40) NOT NULL,
       kinh_ban         VARCHAR(40),
       chi_dao          TEXT,
       menh_lenh        JSONB,
       huyet_ngu_du     JSONB,
       huyet_nan_kinh   JSONB,
       huyet_nguyen_lac JSONB,
       phap_co_dien     JSONB,
       ghi_chu          TEXT,
       sua_tay          BOOLEAN NOT NULL DEFAULT false,
       nguoi_sua        VARCHAR(80),
       updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
     )`;

  private toRow(s: CongThucSeed): Partial<NhhtCongThuc> {
    return {
      ma: s.ma,
      kinh: s.kinh,
      hanh: s.hanh,
      trang_thai: s.trangThai,
      khung: s.khung,
      khung_ten: s.khungTen,
      kinh_ban: s.kinhBan,
      chi_dao: s.chiDao,
      menh_lenh: s.menhLenh,
      huyet_ngu_du: s.huyetNguDu,
      huyet_nan_kinh: s.huyetNanKinh,
      huyet_nguyen_lac: s.huyetNguyenLac,
      phap_co_dien: s.phapCoDien,
      sua_tay: false,
    };
  }

  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.dataSource.query(NhhtCongThucService.DDL);
      const daCo = await this.repo.find({ select: ['ma', 'sua_tay'] });
      const co = new Map(daCo.map((r) => [r.ma, r]));
      const themMoi: Partial<NhhtCongThuc>[] = [];
      const capNhat: Partial<NhhtCongThuc>[] = [];
      for (const s of NHHT_CONG_THUC) {
        const cu = co.get(s.ma);
        if (!cu) themMoi.push(this.toRow(s));
        // Engine đổi thì bảng phải theo — NHƯNG chỉ với bản thầy thuốc CHƯA đụng vào.
        // Bản có cờ sua_tay là quyết định lâm sàng, không được ghi đè bằng bộ chuẩn.
        else if (!cu.sua_tay) capNhat.push(this.toRow(s));
      }
      if (themMoi.length) await this.repo.save(themMoi as NhhtCongThuc[]);
      if (capNhat.length) await this.repo.save(capNhat as NhhtCongThuc[]);
      const suaTay = await this.repo.count({ where: { sua_tay: true } });
      this.logger.log(
        `NHHT: bảng OK, bộ chuẩn ${NHHT_CONG_THUC.length} công thức (sinh ${NHHT_SINH_LUC}), ` +
          `thêm mới ${themMoi.length}, đồng bộ lại ${capNhat.length}, thầy thuốc giữ riêng ${suaTay}.`,
      );
    } catch (err) {
      this.logger.warn(
        `Bỏ qua khởi tạo NHHT (không chặn boot): ${(err as Error).message}`,
      );
    }
  }

  /** Cả kho, xếp theo kinh → trạng thái → khung. Lọc được theo kinh/trạng thái/khung. */
  async findAll(loc?: { kinh?: string; trangThai?: string; khung?: string }) {
    const qb = this.repo.createQueryBuilder('c');
    if (loc?.kinh) qb.andWhere('c.kinh = :kinh', { kinh: loc.kinh });
    if (loc?.trangThai)
      qb.andWhere('c.trang_thai = :tt', { tt: loc.trangThai });
    if (loc?.khung) qb.andWhere('c.khung = :khung', { khung: loc.khung });
    return qb
      .orderBy('c.kinh', 'ASC')
      .addOrderBy('c.trang_thai', 'ASC')
      .addOrderBy('c.khung', 'ASC')
      .getMany();
  }

  /**
   * TRA công thức cho một ca đã định gốc. Đây là lối vào của phiếu đo — ca bệnh không luận lại,
   * chỉ đối chiếu. Thiếu khung thì tự chọn theo hư/thực (Thực→Biểu-Lý · Hư→Thượng-Hạ).
   */
  async tra(kinh: string, thuc: boolean, khung?: string) {
    const kh = khung || (thuc ? 'bieuly' : 'thuongha');
    const row = await this.repo.findOne({
      where: { kinh, trang_thai: thuc ? 'thực' : 'hư', khung: kh },
    });
    if (!row)
      throw new NotFoundException(
        `Không có công thức NHHT cho ${kinh} · ${thuc ? 'thực' : 'hư'} · ${kh}`,
      );
    return row;
  }

  /** Thầy thuốc ghi đè một công thức — đánh dấu sua_tay để seed không bao giờ đè lại. */
  async ghiDe(ma: string, patch: Partial<NhhtCongThuc>, nguoiSua?: string) {
    const row = await this.repo.findOne({ where: { ma } });
    if (!row) throw new NotFoundException(`Không có công thức ${ma}`);
    const { ma: _bo, ...duocSua } = patch;
    void _bo;
    Object.assign(row, duocSua, {
      sua_tay: true,
      nguoi_sua: nguoiSua ?? row.nguoi_sua,
      updated_at: new Date(),
    });
    return this.repo.save(row);
  }

  /** Trả một công thức về đúng bản engine sinh (bỏ ghi đè tay). */
  async khoiPhuc(ma: string) {
    const seed = NHHT_CONG_THUC.find((s) => s.ma === ma);
    if (!seed) throw new NotFoundException(`Bộ chuẩn không có công thức ${ma}`);
    const row = await this.repo.findOne({ where: { ma } });
    const moi = {
      ...(row ?? {}),
      ...this.toRow(seed),
      ghi_chu: null,
      nguoi_sua: null,
      updated_at: new Date(),
    };
    return this.repo.save(moi as NhhtCongThuc);
  }

  /**
   * Đối chiếu bảng đang dùng với bộ chuẩn engine — liệt kê công thức nào đã lệch và lệch ở đâu.
   * Dùng để thầy thuốc nhìn lại các chỗ mình đã sửa, và để phát hiện bảng trôi khỏi engine.
   */
  async doiChieu() {
    const rows = await this.repo.find();
    const byMa = new Map(rows.map((r) => [r.ma, r]));
    const lech: Array<{ ma: string; truong: string[]; sua_tay: boolean }> = [];
    const thieu: string[] = [];
    for (const s of NHHT_CONG_THUC) {
      const r = byMa.get(s.ma);
      if (!r) {
        thieu.push(s.ma);
        continue;
      }
      const truong: string[] = [];
      const khac = (a: unknown, b: unknown): boolean =>
        JSON.stringify(a) !== JSON.stringify(b);
      if (r.chi_dao !== s.chiDao) truong.push('chi_dao');
      if (khac(r.menh_lenh, s.menhLenh)) truong.push('menh_lenh');
      if (khac(r.huyet_ngu_du, s.huyetNguDu)) truong.push('huyet_ngu_du');
      if (khac(r.huyet_nan_kinh, s.huyetNanKinh)) truong.push('huyet_nan_kinh');
      if (khac(r.huyet_nguyen_lac, s.huyetNguyenLac))
        truong.push('huyet_nguyen_lac');
      if (truong.length) lech.push({ ma: s.ma, truong, sua_tay: r.sua_tay });
    }
    return {
      sinhLuc: NHHT_SINH_LUC,
      tongChuan: NHHT_CONG_THUC.length,
      tongBang: rows.length,
      thieu,
      lech,
    };
  }
}
