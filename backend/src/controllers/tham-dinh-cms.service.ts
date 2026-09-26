import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'pg';

import { docCauHinhSsl } from '../utils/db-ssl.util';
import type { MucKho } from '../utils/tham-dinh-muc.util';
import type { NhanXetCoMuc } from '../utils/tham-dinh-cum.util';
import type { HoSoMuc } from '../models/tham-dinh.dto';

/**
 * Cửa duy nhất đi sang database `kinhlac_cms`.
 *
 * ⚠️ VÌ SAO Client CHỨ KHÔNG Pool: cụm Aiven có max_connections = 20, đang dùng 12, và
 * pool chính của backend cấu hình max: 10 — lúc cao điểm là 10 + CMS 2 + hệ thống 9 = 21,
 * vượt trần. Cụm đã sập một lần vì chuyện này. Service này mở MỘT kết nối lúc vào ca và
 * đóng lúc hết ca; không bao giờ giữ kết nối rảnh.
 */
@Injectable()
export class ThamDinhCmsService {
  private readonly logger = new Logger('ThamDinhCms');
  private client: Client | null = null;

  constructor(private readonly config: ConfigService) {}

  static readonly DDL: readonly string[] = [
    `CREATE TABLE IF NOT EXISTS td_ho_so (
       id                SERIAL PRIMARY KEY,
       bo                TEXT NOT NULL,
       ma                TEXT NOT NULL,
       slug              TEXT NOT NULL,
       tieu_de           TEXT NOT NULL DEFAULT '',
       van_tay_noi_dung  VARCHAR(16) NOT NULL DEFAULT '',
       diem_sach         INT NOT NULL DEFAULT 0,
       diem_mach_lac     INT,
       diem_du_phan      INT NOT NULL DEFAULT 0,
       diem_lien_ket     INT,
       diem_seo          INT,
       hang              VARCHAR(10) NOT NULL DEFAULT 'tam_duoc',
       uu_tien           INT NOT NULL DEFAULT 0,
       soi_may_luc       timestamptz,
       soi_thay_thuoc_luc timestamptz,
       soi_seo_luc       timestamptz,
       created_at        timestamptz NOT NULL DEFAULT now(),
       updated_at        timestamptz NOT NULL DEFAULT now()
     )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS ux_td_ho_so_bo_ma ON td_ho_so (bo, ma)`,
    `CREATE INDEX IF NOT EXISTS idx_td_ho_so_uu_tien ON td_ho_so (uu_tien DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_td_ho_so_hang ON td_ho_so (hang)`,
    `CREATE TABLE IF NOT EXISTS td_nhan_xet (
       id          SERIAL PRIMARY KEY,
       ho_so_id    INT NOT NULL,
       lop         VARCHAR(12) NOT NULL,
       kieu        VARCHAR(40) NOT NULL,
       truong      VARCHAR(40),
       trich_dan   TEXT NOT NULL DEFAULT '',
       nhan_xet    TEXT NOT NULL DEFAULT '',
       de_xuat     TEXT,
       bac_can_cu  INT,
       nang        BOOLEAN NOT NULL DEFAULT false,
       trang_thai  VARCHAR(12) NOT NULL DEFAULT 'moi',
       duyet_boi   TEXT,
       duyet_luc   timestamptz,
       created_at  timestamptz NOT NULL DEFAULT now()
     )`,
    `CREATE INDEX IF NOT EXISTS idx_td_nhan_xet_ho_so ON td_nhan_xet (ho_so_id)`,
    `CREATE INDEX IF NOT EXISTS idx_td_nhan_xet_kieu ON td_nhan_xet (kieu)`,
    `CREATE INDEX IF NOT EXISTS idx_td_nhan_xet_trang_thai ON td_nhan_xet (trang_thai)`,
  ];

  daCauHinh(): boolean {
    return ['CMS_DB_HOST', 'CMS_DB_PORT', 'CMS_DB_USER', 'CMS_DB_PASSWORD', 'CMS_DB_NAME']
      .every((k) => {
        const v = this.config.get<string>(k);
        return typeof v === 'string' && v.trim().length > 0;
      });
  }

  async moKetNoi(): Promise<void> {
    if (this.client) return;
    this.client = new Client({
      host: this.config.get<string>('CMS_DB_HOST'),
      port: Number(this.config.get<string>('CMS_DB_PORT')),
      user: this.config.get<string>('CMS_DB_USER'),
      password: this.config.get<string>('CMS_DB_PASSWORD'),
      database: this.config.get<string>('CMS_DB_NAME'),
      // Cùng cụm Aiven với database chính, nên cùng cert và cùng luật xác minh.
      ssl: docCauHinhSsl(this.config),
      connectionTimeoutMillis: 10_000,
    });
    // Không có listener 'error' thì pg ném ra process và sập cả backend khi Aiven cắt kết nối.
    this.client.on('error', (e) => this.logger.error(`lỗi kết nối CMS: ${e.message}`));
    await this.client.connect();
  }

  async dongKetNoi(): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.end();
    } finally {
      this.client = null;
    }
  }

  private phaiCo(): Client {
    if (!this.client) throw new Error('Chưa mở kết nối CMS');
    return this.client;
  }

  async dungBang(): Promise<void> {
    for (const s of ThamDinhCmsService.DDL) {
      try {
        await this.phaiCo().query(s);
      } catch (e) {
        this.logger.warn(`DDL bỏ qua: ${(e as Error).message}`);
      }
    }
  }

  /** Khai báo bộ + đường dẫn + danh sách cột thân bài, đọc thẳng từ td_cau_hinh. */
  async docCauHinhBo(): Promise<Array<{ bo: string; duongDan: string; than: string[] }>> {
    const r = await this.phaiCo().query<{ bo: string; duong_dan: string; cot_than: string[] }>(
      `SELECT bo, duong_dan, cot_than FROM td_cau_hinh ORDER BY thu_tu`,
    );
    return r.rows.map((x) => ({ bo: x.bo, duongDan: x.duong_dan, than: x.cot_than || [] }));
  }

  /**
   * Đọc một lô mục từ của một bộ, đã rút chữ khỏi portable text bằng hàm `td_chu`
   * có sẵn trong CSDL (dựng bởi cms/sql/chi-muc-tra-cuu.sql).
   */
  async docLoMuc(bo: string, than: string[], tu: number, soLuong: number): Promise<MucKho[]> {
    const cot = than
      .map((t) => `td_chu(to_jsonb(r.${JSON.stringify(t)})) AS ${JSON.stringify(t)}`)
      .join(', ');
    const sql =
      `SELECT r.id AS ma, r.slug, r.title AS tieu_de${cot ? ', ' + cot : ''} ` +
      `FROM ${JSON.stringify('ec_' + bo)} r ` +
      `WHERE r.status = 'published' AND r.deleted_at IS NULL ` +
      `ORDER BY r.id LIMIT $1 OFFSET $2`;
    const r = await this.phaiCo().query<Record<string, string>>(sql, [soLuong, tu]);
    return r.rows.map((row) => {
      const truong: Record<string, string> = {};
      for (const t of than) truong[t] = row[t] || '';
      return { bo, ma: row.ma, slug: row.slug, tieuDe: row.tieu_de || '', truong };
    });
  }

  /** Toàn bộ tên mục từ, để dựng chỉ mục tra tên. 18.416 dòng ngắn — vài MB, nạp một lần. */
  async docTenMuc(): Promise<Array<{ bo: string; slug: string; tieuDe: string }>> {
    const r = await this.phaiCo().query<{ bo: string; slug: string; tieu_de: string }>(
      `SELECT bo, slug, tieu_de FROM td_muc`,
    );
    return r.rows.map((x) => ({ bo: x.bo, slug: x.slug, tieuDe: x.tieu_de }));
  }

  /** Ghi đè hồ sơ của một mục và thay toàn bộ nhận xét lớp `may` của nó. */
  async ghiHoSo(h: HoSoMuc, nx: NhanXetCoMuc[]): Promise<void> {
    const c = this.phaiCo();
    const r = await c.query<{ id: number }>(
      `INSERT INTO td_ho_so (bo, ma, slug, tieu_de, van_tay_noi_dung, diem_sach,
                             diem_du_phan, hang, uu_tien, soi_may_luc, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, now(), now())
       ON CONFLICT (bo, ma) DO UPDATE SET
         slug = EXCLUDED.slug, tieu_de = EXCLUDED.tieu_de,
         van_tay_noi_dung = EXCLUDED.van_tay_noi_dung, diem_sach = EXCLUDED.diem_sach,
         diem_du_phan = EXCLUDED.diem_du_phan, hang = EXCLUDED.hang,
         uu_tien = EXCLUDED.uu_tien, soi_may_luc = now(), updated_at = now()
       RETURNING id`,
      [h.bo, h.ma, h.slug, h.tieuDe, h.vanTayNoiDung, h.diemSach, h.diemDuPhan, h.hang, h.uuTien],
    );
    const id = r.rows[0].id;

    // Chỉ thay nhận xét của lớp `may`; nhận xét của thầy thuốc và SEO giữ nguyên.
    await c.query(`DELETE FROM td_nhan_xet WHERE ho_so_id = $1 AND lop = 'may'`, [id]);
    for (const n of nx) {
      await c.query(
        `INSERT INTO td_nhan_xet (ho_so_id, lop, kieu, truong, trich_dan, nhan_xet, nang)
         VALUES ($1, 'may', $2, $3, $4, $5, $6)`,
        [id, n.kieu, n.truong, n.trichDan.slice(0, 2000), n.nhanXet, n.nang],
      );
    }
  }
}
