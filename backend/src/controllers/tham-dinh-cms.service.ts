import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'pg';

import { docCauHinhSsl } from '../utils/db-ssl.util';
import { rutChu } from '../utils/tham-dinh-rut-chu.util';
import { thayTrongJson, apTheoDoanKhacBiet } from '../utils/tham-dinh-ap-sua.util';
import { cauUpsertHoSo, cauChenNhanXet, type NhanXetGhi } from '../utils/tham-dinh-sql.util';
import type { MucKho } from '../utils/tham-dinh-muc.util';
import type { NhanXetCoMuc } from '../utils/tham-dinh-cum.util';
import type { UngVienSoi } from '../utils/tham-dinh-hang-doi.util';
import type { LoiPheSach } from '../utils/tham-dinh-loi-phe.util';
import type { BoLuatVanPhong, DieuLuat } from '../utils/tham-dinh-luat.util';
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
    // ── Lớp 2 ────────────────────────────────────────────────────────────────────────
    // Vân tay RIÊNG cho lần soi kỹ. `van_tay_noi_dung` bị lớp 1 ghi đè mỗi đêm, nên lấy
    // nó làm mốc thì van tiết kiệm tiền không bao giờ đóng: mục nào cũng "vừa đổi".
    `ALTER TABLE td_ho_so ADD COLUMN IF NOT EXISTS van_tay_thay_thuoc VARCHAR(16)`,
    `CREATE TABLE IF NOT EXISTS td_luat_van_phong (
       phien_ban   INT PRIMARY KEY,
       bo_ap_dung  TEXT[] NOT NULL DEFAULT '{}',
       dieu        JSONB NOT NULL DEFAULT '[]'::jsonb,
       da_duyet    BOOLEAN NOT NULL DEFAULT false,
       duyet_boi   TEXT,
       duyet_luc   timestamptz,
       created_at  timestamptz NOT NULL DEFAULT now()
     )`,
    `CREATE INDEX IF NOT EXISTS idx_td_luat_da_duyet ON td_luat_van_phong (da_duyet, phien_ban DESC)`,
  ];

  daCauHinh(): boolean {
    return ['CMS_DB_HOST', 'CMS_DB_PORT', 'CMS_DB_USER', 'CMS_DB_PASSWORD', 'CMS_DB_NAME']
      .every((k) => {
        const v = this.config.get<string>(k);
        return typeof v === 'string' && v.trim().length > 0;
      });
  }

  async moKetNoi(): Promise<void> {
    // ⚠️ Không chỉ kiểm `this.client` khác null. Khi Aiven cắt kết nối (mạng chập, máy
    // ngủ, hết giờ nhàn rỗi), client CHẾT nhưng vẫn khác null — và mọi request sau đó
    // dùng lại xác chết rồi treo VÔ HẠN. Đã cắn thật: trang /app/tham-dinh kẹt ở "Đang
    // tải…", request không bao giờ kết thúc, phải restart backend mới xong.
    //
    // Nên: có client thì ping một nhịp. Tốn một lượt đi-về (~90ms), đổi lấy việc không
    // bao giờ treo.
    if (this.client) {
      try {
        await this.client.query('SELECT 1');
        return;
      } catch {
        await this.dongKetNoi();
      }
    }
    this.client = new Client({
      host: this.config.get<string>('CMS_DB_HOST'),
      port: Number(this.config.get<string>('CMS_DB_PORT')),
      user: this.config.get<string>('CMS_DB_USER'),
      password: this.config.get<string>('CMS_DB_PASSWORD'),
      database: this.config.get<string>('CMS_DB_NAME'),
      // Cùng cụm Aiven với database chính, nên cùng cert và cùng luật xác minh.
      ssl: docCauHinhSsl(this.config),
      connectionTimeoutMillis: 10_000,
      // Trần cho TỪNG truy vấn. Thiếu nó thì một truy vấn kẹt là kẹt luôn request HTTP,
      // và người dùng chỉ thấy trang quay mãi không có lý do nào.
      query_timeout: 60_000,
      statement_timeout: 60_000,
    });
    // Không có listener 'error' thì pg ném ra process và sập cả backend khi Aiven cắt kết nối.
    // Và phải DỌN client ở đây: giữ lại một client đã chết là để lần mở sau tưởng còn dùng
    // được rồi treo.
    this.client.on('error', (e) => {
      this.logger.error(`lỗi kết nối CMS: ${e.message}`);
      this.client = null;
    });
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
   * Đọc một lô mục từ của một bộ, lấy giá trị JSON THÔ rồi rút chữ bằng `rutChu` ở phía
   * Node.
   *
   * ⚠️ KHÔNG nhờ `td_chu()` của CSDL rút hộ, dù nó có sẵn: hàm đó chỉ nhặt khoá `text`
   * nên nuốt trắng cột hình MẢNG OBJECT — `ec_bai_thuoc.thanh_phan` là đúng hình đó, và
   * 13.889 bài sẽ đi vào bot dưới dạng "trống". Xem chú thích dài trong tham-dinh-rut-chu.
   */
  async docLoMuc(bo: string, than: string[], tu: number, soLuong: number): Promise<MucKho[]> {
    const cot = than
      .map((t) => `to_jsonb(r.${JSON.stringify(t)}) AS ${JSON.stringify(t)}`)
      .join(', ');
    const sql =
      `SELECT r.id AS ma, r.slug, r.title AS tieu_de${cot ? ', ' + cot : ''} ` +
      `FROM ${JSON.stringify('ec_' + bo)} r ` +
      `WHERE r.status = 'published' AND r.deleted_at IS NULL ` +
      `ORDER BY r.id LIMIT $1 OFFSET $2`;
    const r = await this.phaiCo().query<Record<string, unknown>>(sql, [soLuong, tu]);
    return r.rows.map((row) => {
      const truong: Record<string, string> = {};
      for (const t of than) truong[t] = rutChu(row[t]);
      return {
        bo,
        ma: String(row.ma),
        slug: String(row.slug ?? ''),
        tieuDe: typeof row.tieu_de === 'string' ? row.tieu_de : '',
        truong,
      };
    });
  }

  /** Toàn bộ tên mục từ, để dựng chỉ mục tra tên. 18.416 dòng ngắn — vài MB, nạp một lần. */
  async docTenMuc(): Promise<Array<{ bo: string; slug: string; tieuDe: string }>> {
    const r = await this.phaiCo().query<{ bo: string; slug: string; tieu_de: string }>(
      `SELECT bo, slug, tieu_de FROM td_muc`,
    );
    return r.rows.map((x) => ({ bo: x.bo, slug: x.slug, tieuDe: x.tieu_de }));
  }

  /**
   * Ghi đè hồ sơ của CẢ MỘT LÔ mục và thay nhận xét lớp `may` của chúng — ba lượt đi-về
   * cho 200 mục, thay vì tám lượt cho mỗi mục.
   *
   * ⚠️ Đo thật 26/09/2026: RTT tới Aiven 88ms. Ghi lẻ cho ra 0,7 giây một mục, tức 3 giờ
   * cho cả kho. Đừng "đơn giản hoá" về vòng lặp ghi từng mục.
   *
   * Cả lô nằm trong MỘT giao dịch: nửa vời thì hồ sơ có mà nhận xét không, và lần đọc sau
   * tưởng mục ấy sạch.
   */
  async ghiHoSoLo(lo: Array<{ hoSo: HoSoMuc; nhanXet: NhanXetCoMuc[] }>): Promise<void> {
    if (!lo.length) return;
    const c = this.phaiCo();

    const cauHoSo = cauUpsertHoSo(lo.map((x) => x.hoSo));
    if (!cauHoSo) return;

    await c.query('BEGIN');
    try {
      const r = await c.query<{ id: number; bo: string; ma: string }>(
        cauHoSo.sql,
        cauHoSo.thamSo as unknown[],
      );

      const idTheoKhoa = new Map<string, number>();
      for (const x of r.rows) idTheoKhoa.set(`${x.bo}\u0001${x.ma}`, x.id);

      const ids = [...idTheoKhoa.values()];
      if (ids.length) {
        await c.query(
          `DELETE FROM td_nhan_xet WHERE lop = 'may' AND ho_so_id = ANY($1::int[])`,
          [ids],
        );
      }

      const canGhi: NhanXetGhi[] = [];
      for (const x of lo) {
        const id = idTheoKhoa.get(`${x.hoSo.bo}\u0001${x.hoSo.ma}`);
        if (id === undefined) continue;
        for (const n of x.nhanXet) {
          canGhi.push({
            hoSoId: id, kieu: n.kieu, truong: n.truong,
            trichDan: n.trichDan, nhanXet: n.nhanXet, nang: n.nang,
          });
        }
      }

      const cauNx = cauChenNhanXet(canGhi);
      if (cauNx) await c.query(cauNx.sql, cauNx.thamSo as unknown[]);

      await c.query('COMMIT');
    } catch (e) {
      await c.query('ROLLBACK').catch(() => undefined);
      throw e;
    }
  }

  // ══ Lớp 2 — thầy thuốc ═══════════════════════════════════════════════════════════

  /** Đổi slug sang id. Mục mẫu khai bằng slug vì slug là thứ người đọc nhận ra. */
  async maTuSlug(bo: string, slug: string): Promise<string | null> {
    const r = await this.phaiCo().query<{ id: string }>(
      `SELECT r.id FROM ${JSON.stringify('ec_' + bo)} r WHERE r.slug = $1 LIMIT 1`,
      [slug],
    );
    return r.rows.length ? String(r.rows[0].id) : null;
  }

  /**
   * Ứng viên cho hàng đợi lớp 2. Join sang td_muc để lấy độ dày THẬT — td_ho_so không giữ
   * số ký tự, và `diem_du_phan` là tỉ lệ cột có nội dung chứ không phải độ dày.
   */
  async docUngVienSoi(): Promise<UngVienSoi[]> {
    const r = await this.phaiCo().query<{
      bo: string; ma: string; slug: string; tieu_de: string; do_day: number;
      so_loi_may: number; van_tay_noi_dung: string; van_tay_thay_thuoc: string | null;
    }>(
      `SELECT h.bo, h.ma, h.slug, h.tieu_de, m.do_day,
              (SELECT count(*)::int FROM td_nhan_xet n
                 WHERE n.ho_so_id = h.id AND n.lop = 'may'
                   AND n.kieu NOT IN ('lien_ket_dung_duoc', 'ten_vi_la')) AS so_loi_may,
              h.van_tay_noi_dung, h.van_tay_thay_thuoc
       FROM td_ho_so h
       JOIN td_muc m ON m.bo = h.bo AND m.ma = h.ma`,
    );
    return r.rows.map((x) => ({
      bo: x.bo, ma: x.ma, slug: x.slug, tieuDe: x.tieu_de,
      doDay: x.do_day || 0, soLoiMay: x.so_loi_may || 0,
      vanTayNoiDung: x.van_tay_noi_dung || '',
      vanTayThayThuoc: x.van_tay_thay_thuoc,
      diemCoHoiSeo: 0, // lớp 3 nối Search Console vào đây
    }));
  }

  /** Thân bài đầy đủ của một mục, rút chữ bằng rutChu như lớp 1. */
  async docThanBai(bo: string, ma: string, than: string[]): Promise<Record<string, string>> {
    const cot = than
      .map((t) => `to_jsonb(r.${JSON.stringify(t)}) AS ${JSON.stringify(t)}`)
      .join(', ');
    const sql =
      `SELECT ${cot || '1 AS x'} FROM ${JSON.stringify('ec_' + bo)} r WHERE r.id = $1 LIMIT 1`;
    const r = await this.phaiCo().query<Record<string, unknown>>(sql, [ma]);
    const truong: Record<string, string> = {};
    if (!r.rows.length) return truong;
    for (const t of than) truong[t] = rutChu(r.rows[0][t]);
    return truong;
  }

  /**
   * Chùm mục liên quan — "đọc cả chùm, không đọc một mình".
   *
   * Tra bằng chỉ mục toàn văn có sẵn (`td_muc.tsv`, khoá đã bỏ dấu qua `td_bo_dau`), lấy
   * các mục Ở BỘ KHÁC có nhắc tên mục đang soi. Đây là cách duy nhất để phê được loại
   * nhận xét bắc cầu giữa hai mục — vd huyệt nói chủ trị hàn mà bài châm cứu dùng nó lại
   * trị nhiệt.
   */
  async docChumLienQuan(
    tieuDe: string,
    boTru: string,
    ma: string,
  ): Promise<Array<{ bo: string; tieuDe: string; tomTat: string }>> {
    if (!tieuDe.trim()) return [];
    const r = await this.phaiCo().query<{ bo: string; tieu_de: string; tom_tat: string }>(
      `SELECT bo, tieu_de, tom_tat FROM td_muc
       WHERE tsv @@ plainto_tsquery('simple', td_bo_dau($1))
         AND NOT (bo = $2 AND ma = $3)
       ORDER BY do_day DESC LIMIT 4`,
      [tieuDe, boTru, ma],
    );
    return r.rows.map((x) => ({ bo: x.bo, tieuDe: x.tieu_de, tomTat: x.tom_tat }));
  }

  /** Thay toàn bộ nhận xét lớp `thay_thuoc` của một mục và ĐÓNG VAN vân tay. */
  async ghiLoiPheThayThuoc(
    bo: string,
    ma: string,
    vanTay: string,
    ds: LoiPheSach[],
  ): Promise<void> {
    const c = this.phaiCo();
    await c.query('BEGIN');
    try {
      const r = await c.query<{ id: number }>(
        `UPDATE td_ho_so SET van_tay_thay_thuoc = $3, soi_thay_thuoc_luc = now(),
                             updated_at = now()
         WHERE bo = $1 AND ma = $2 RETURNING id`,
        [bo, ma, vanTay],
      );
      if (!r.rows.length) {
        await c.query('ROLLBACK');
        return;
      }
      const id = r.rows[0].id;
      await c.query(`DELETE FROM td_nhan_xet WHERE ho_so_id = $1 AND lop = 'thay_thuoc'`, [id]);
      for (const n of ds) {
        await c.query(
          `INSERT INTO td_nhan_xet
             (ho_so_id, lop, kieu, truong, trich_dan, nhan_xet, de_xuat, bac_can_cu, nang)
           VALUES ($1, 'thay_thuoc', $2, $3, $4, $5, $6, $7, false)`,
          [id, n.kieu, n.truong, n.trichDan, n.nhanXet, n.deXuat, n.bacCanCu],
        );
      }
      await c.query('COMMIT');
    } catch (e) {
      await c.query('ROLLBACK').catch(() => undefined);
      throw e;
    }
  }

  /** Mọi lời phê lớp thầy thuốc còn ở trạng thái `moi`, kèm khoá mục để gom cụm. */
  async docNhanXetThayThuoc(): Promise<NhanXetCoMuc[]> {
    const r = await this.phaiCo().query<{
      bo: string; slug: string; tieu_de: string;
      kieu: string; truong: string | null; trich_dan: string; nhan_xet: string;
    }>(
      `SELECT h.bo, h.slug, h.tieu_de, n.kieu, n.truong, n.trich_dan, n.nhan_xet
       FROM td_nhan_xet n JOIN td_ho_so h ON h.id = n.ho_so_id
       WHERE n.lop = 'thay_thuoc' AND n.trang_thai = 'moi'`,
    );
    return r.rows.map((x) => ({
      bo: x.bo, slug: x.slug, tieuDe: x.tieu_de,
      kieu: x.kieu, truong: x.truong, trichDan: x.trich_dan, nhanXet: x.nhan_xet,
      nang: false,
    }));
  }

  /** Lưu một bản bộ luật MỚI (chưa duyệt). Trả về số phiên bản vừa cấp. */
  async luuBoLuat(bo: BoLuatVanPhong): Promise<number> {
    const c = this.phaiCo();
    const m = await c.query<{ pb: number }>(
      `SELECT COALESCE(MAX(phien_ban), 0) + 1 AS pb FROM td_luat_van_phong`,
    );
    const pb = m.rows[0].pb;
    await c.query(
      `INSERT INTO td_luat_van_phong (phien_ban, bo_ap_dung, dieu, da_duyet)
       VALUES ($1, $2, $3::jsonb, false)`,
      [pb, bo.boApDung, JSON.stringify(bo.dieu)],
    );
    return pb;
  }

  /**
   * Bản bộ luật đang dùng. `chiBanDaDuyet = true` là thứ ca soi phải gọi: chạy bằng bộ
   * luật chưa ai duyệt thì lời phê không có thẩm quyền nào cả.
   */
  async docBoLuat(chiBanDaDuyet: boolean): Promise<BoLuatVanPhong | null> {
    const r = await this.phaiCo().query<{
      phien_ban: number; bo_ap_dung: string[]; dieu: DieuLuat[]; da_duyet: boolean;
    }>(
      `SELECT phien_ban, bo_ap_dung, dieu, da_duyet FROM td_luat_van_phong
       ${chiBanDaDuyet ? 'WHERE da_duyet = true' : ''}
       ORDER BY phien_ban DESC LIMIT 1`,
    );
    if (!r.rows.length) return null;
    const x = r.rows[0];
    return {
      phienBan: x.phien_ban,
      boApDung: x.bo_ap_dung || [],
      dieu: Array.isArray(x.dieu) ? x.dieu : [],
      daDuyet: x.da_duyet,
    };
  }

  async duyetBoLuat(phienBan: number): Promise<void> {
    await this.phaiCo().query(
      `UPDATE td_luat_van_phong SET da_duyet = true, duyet_luc = now() WHERE phien_ban = $1`,
      [phienBan],
    );
  }

  // ══ Kế hoạch 3 — duyệt và áp bản sửa ════════════════════════════════════════════

  /** Nhận xét chờ duyệt, kèm bản gốc của trường để màn duyệt đặt cạnh bản sửa. */
  async docNhanXetDeDuyet(loc: {
    bo?: string; kieu?: string; trangThai?: string; lop?: string; moiTrang?: number; trang?: number;
  }): Promise<{ danhSach: unknown[]; tong: number }> {
    const dk: string[] = [];
    const ts: unknown[] = [];
    const them = (sql: string, gt: unknown) => {
      ts.push(gt);
      dk.push(sql.replace('$?', `$${ts.length}`));
    };
    if (loc.bo) them('h.bo = $?', loc.bo);
    if (loc.kieu) them('n.kieu = $?', loc.kieu);
    them('n.trang_thai = $?', loc.trangThai || 'moi');
    them('n.lop = $?', loc.lop || 'thay_thuoc');

    const where = `WHERE ${dk.join(' AND ')}`;
    const moiTrang = Math.min(Math.max(loc.moiTrang || 25, 1), 100);
    const bo_qua = Math.max((loc.trang || 1) - 1, 0) * moiTrang;

    const dem = await this.phaiCo().query<{ n: number }>(
      `SELECT count(*)::int n FROM td_nhan_xet n JOIN td_ho_so h ON h.id = n.ho_so_id ${where}`,
      ts,
    );
    const r = await this.phaiCo().query(
      `SELECT n.id, n.lop, n.kieu, n.truong, n.trich_dan, n.nhan_xet, n.de_xuat,
              n.bac_can_cu, n.trang_thai, n.created_at,
              h.bo, h.ma, h.slug, h.tieu_de
       FROM td_nhan_xet n JOIN td_ho_so h ON h.id = n.ho_so_id
       ${where} ORDER BY h.bo, h.tieu_de, n.id LIMIT ${moiTrang} OFFSET ${bo_qua}`,
      ts,
    );
    return { danhSach: r.rows, tong: dem.rows[0].n };
  }

  async doiTrangThaiNhanXet(id: number, trangThai: string, boi: string | null): Promise<boolean> {
    const r = await this.phaiCo().query(
      `UPDATE td_nhan_xet SET trang_thai = $2, duyet_boi = $3, duyet_luc = now() WHERE id = $1`,
      [id, trangThai, boi],
    );
    return (r.rowCount || 0) > 0;
  }

  /**
   * Áp một bản sửa vào kho nội dung. MỘT giao dịch, và thứ tự quan trọng:
   *   1. Đọc bản cũ của CẢ bản ghi → ghi vào `revisions` (đường lùi duy nhất).
   *   2. Thay tại chỗ trong cột đang sửa; `soLanThay = 0` thì HUỶ — trích dẫn không còn
   *      trong bài nghĩa là có người đã sửa tay từ lúc bot soi.
   *   3. UPDATE cột + `version = version + 1`, để trigger `td_tr` dựng lại chỉ mục.
   *
   * KHÔNG tắt trigger: duyệt lẻ từng nhận xét nên để nó chạy. Tắt trigger là lối của ghi LÔ.
   */
  async apBanSua(
    id: number,
    boi: string | null,
  ): Promise<{ ok: boolean; lyDo?: string; soLanThay?: number }> {
    const c = this.phaiCo();
    const n = await c.query<{
      bo: string; ma: string; truong: string | null; trich_dan: string; de_xuat: string | null;
    }>(
      `SELECT h.bo, h.ma, n.truong, n.trich_dan, n.de_xuat
       FROM td_nhan_xet n JOIN td_ho_so h ON h.id = n.ho_so_id WHERE n.id = $1`,
      [id],
    );
    if (!n.rows.length) return { ok: false, lyDo: 'Không tìm thấy nhận xét' };
    const { bo, ma, truong, trich_dan, de_xuat } = n.rows[0];
    if (!truong) return { ok: false, lyDo: 'Nhận xét không gắn với trường nào' };
    if (!de_xuat || !de_xuat.trim()) return { ok: false, lyDo: 'Nhận xét không có bản sửa' };

    const bang = JSON.stringify('ec_' + bo);
    const cot = JSON.stringify(truong);

    await c.query('BEGIN');
    try {
      const cu = await c.query<{ ban_ghi: Record<string, unknown>; gia_tri: unknown }>(
        `SELECT to_jsonb(r) AS ban_ghi, to_jsonb(r.${cot}) AS gia_tri
         FROM ${bang} r WHERE r.id = $1 FOR UPDATE`,
        [ma],
      );
      if (!cu.rows.length) {
        await c.query('ROLLBACK');
        return { ok: false, lyDo: 'Không tìm thấy bản ghi trong kho' };
      }

      // Hai lối, theo thứ tự. Lối một: thay trọn trích dẫn — chỉ được khi nó nằm trong MỘT
      // span. Lối hai: trích dẫn trải qua nhiều khối (ca thường gặp, vì `rutChu` nối các
      // khối bằng khoảng trắng) nên chỉ thay đúng đoạn KHÁC BIỆT, và chỉ trong span thuộc
      // đoạn bot đã đọc.
      let { ketQua, soLanThay } = thayTrongJson(cu.rows[0].gia_tri, trich_dan, de_xuat);
      if (soLanThay === 0) {
        const lai = apTheoDoanKhacBiet(cu.rows[0].gia_tri, trich_dan, de_xuat);
        // HOẶC TRỌN VẸN, HOẶC KHÔNG GÌ. Áp được 2 trên 3 đoạn rồi báo thành công là để
        // người duyệt tưởng bản sửa đã vào đủ — tệ hơn hẳn so với bảo họ sửa tay.
        if (lai.soDoan > 0 && lai.soDoanApDuoc === lai.soDoan) {
          ketQua = lai.ketQua;
          soLanThay = lai.soLanThay;
        } else if (lai.soDoanApDuoc > 0) {
          await c.query('ROLLBACK');
          return {
            ok: false,
            soLanThay: 0,
            lyDo:
              `Bản sửa có ${lai.soDoan} thay đổi, chỉ ${lai.soDoanApDuoc} chỗ định vị được ` +
              `trong bài. Không áp một nửa — sửa tay mục này.`,
          };
        }
      }
      if (soLanThay === 0) {
        await c.query('ROLLBACK');
        return {
          ok: false,
          soLanThay: 0,
          lyDo:
            'Không áp được: trích dẫn không nằm trong một span nào, và đoạn khác biệt giữa ' +
            'bản gốc với bản sửa quá ngắn hoặc quá rộng để thay an toàn. Sửa tay mục này.',
        };
      }

      // Đường lùi ghi TRƯỚC khi đụng nội dung.
      await c.query(
        `INSERT INTO revisions (id, collection, entry_id, data, author_id, created_at)
         VALUES (md5(random()::text || clock_timestamp()::text), $1, $2, $3, $4, now()::text)`,
        [bo, ma, JSON.stringify(cu.rows[0].ban_ghi), boi],
      );

      await c.query(
        `UPDATE ${bang} SET ${cot} = $2::jsonb, version = COALESCE(version, 0) + 1,
                            updated_at = now()::text
         WHERE id = $1`,
        [ma, JSON.stringify(ketQua)],
      );

      await c.query(
        `UPDATE td_nhan_xet SET trang_thai = 'da_ap', duyet_boi = $2, duyet_luc = now()
         WHERE id = $1`,
        [id, boi],
      );

      await c.query('COMMIT');
      return { ok: true, soLanThay };
    } catch (e) {
      await c.query('ROLLBACK').catch(() => undefined);
      return { ok: false, lyDo: (e as Error).message };
    }
  }
}
