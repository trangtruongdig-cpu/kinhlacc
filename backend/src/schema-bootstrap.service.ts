import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * Đảm bảo các schema BỔ SUNG (thêm cột/bảng cho tính năng mới) tồn tại ngay khi backend khởi động.
 *
 * Vì `synchronize` TẮT và `deploy.sh` KHÔNG tự chạy migration, mỗi lần lên môi trường mới rất dễ
 * thiếu bảng/cột → API truy vấn lỗi → danh sách "không hiển thị". Service này chạy một bộ DDL
 * IDEMPOTENT (toàn `IF NOT EXISTS`, KHÔNG có lệnh phá huỷ) trên mỗi lần boot → tự lành, không cần
 * thao tác tay. An toàn chạy lại nhiều lần; lỗi 1 câu (vd thiếu quyền) chỉ cảnh báo, không làm sập app.
 *
 * Khi thêm migration kiểu "thêm cột/bảng" mới, chỉ cần thêm câu DDL idempotent vào đây.
 */
@Injectable()
export class SchemaBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger('SchemaBootstrap');

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  private static readonly STATEMENTS: ReadonlyArray<string> = [
    // trieu_chung.nhom — gom nhóm triệu chứng
    `ALTER TABLE trieu_chung ADD COLUMN IF NOT EXISTS nhom VARCHAR(40)`,
    `CREATE INDEX IF NOT EXISTS idx_trieu_chung_nhom ON trieu_chung (nhom)`,
    // Nguyên nhân có cấu trúc của pháp trị
    `CREATE TABLE IF NOT EXISTS phap_tri_nguyen_nhan (
       id          SERIAL PRIMARY KEY,
       id_phap_tri INTEGER NOT NULL REFERENCES phap_tri(id) ON DELETE CASCADE,
       nhom        VARCHAR(40),
       noi_dung    TEXT,
       thu_tu      INTEGER NOT NULL DEFAULT 0
     )`,
    `CREATE INDEX IF NOT EXISTS idx_ptnn_phap_tri ON phap_tri_nguyen_nhan (id_phap_tri)`,
    // Nguyên nhân có cấu trúc của thể đo (benh_dong_y_excel)
    `CREATE TABLE IF NOT EXISTS benh_dong_y_excel_nguyen_nhan (
       id                   SERIAL PRIMARY KEY,
       id_benh_dong_y_excel INTEGER NOT NULL REFERENCES benh_dong_y_excel(id) ON DELETE CASCADE,
       nhom                 VARCHAR(40),
       noi_dung             TEXT,
       thu_tu               INTEGER NOT NULL DEFAULT 0
     )`,
    `CREATE INDEX IF NOT EXISTS idx_bdyenn_benh_dong_y_excel ON benh_dong_y_excel_nguyen_nhan (id_benh_dong_y_excel)`,
    // Chẩn đoán (Hỏi & Chẩn đoán) lưu vào ca khám
    `ALTER TABLE examinations ADD COLUMN IF NOT EXISTS "chanDoan" jsonb`,
    // Cockpit Index — trạng thái index từng URL sitemap (GSC URL Inspection)
    `CREATE TABLE IF NOT EXISTS seo_index_status (
       id              SERIAL PRIMARY KEY,
       url             TEXT NOT NULL,
       verdict         VARCHAR(30),
       coverage_state  VARCHAR(160),
       robots_state    VARCHAR(80),
       fetch_state     VARCHAR(80),
       google_canonical TEXT,
       last_crawl_time TEXT,
       loi             TEXT,
       checked_at      TIMESTAMPTZ,
       created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
     )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS ux_seo_index_status_url ON seo_index_status (url)`,
  ];

  async onApplicationBootstrap(): Promise<void> {
    let ok = 0;
    for (const sql of SchemaBootstrapService.STATEMENTS) {
      try {
        await this.dataSource.query(sql);
        ok += 1;
      } catch (e) {
        this.logger.warn(`Bỏ qua 1 DDL bootstrap: ${(e as Error).message}`);
      }
    }
    this.logger.log(`Schema bootstrap xong: ${ok}/${SchemaBootstrapService.STATEMENTS.length} câu DDL OK`);
  }
}
