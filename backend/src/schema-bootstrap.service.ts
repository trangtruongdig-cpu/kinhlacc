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
    // vi_thuoc — nội dung y văn nhập từ từ điển Đông Y cũ (12 mục text)
    `ALTER TABLE vi_thuoc ADD COLUMN IF NOT EXISTS xuat_xu VARCHAR(500)`,
    `ALTER TABLE vi_thuoc ADD COLUMN IF NOT EXISTS ho_khoa_hoc VARCHAR(500)`,
    `ALTER TABLE vi_thuoc ADD COLUMN IF NOT EXISTS ten_khac TEXT`,
    `ALTER TABLE vi_thuoc ADD COLUMN IF NOT EXISTS mo_ta TEXT`,
    `ALTER TABLE vi_thuoc ADD COLUMN IF NOT EXISTS thanh_phan TEXT`,
    `ALTER TABLE vi_thuoc ADD COLUMN IF NOT EXISTS duoc_ly TEXT`,
    `ALTER TABLE vi_thuoc ADD COLUMN IF NOT EXISTS tinh_vi_quy_kinh TEXT`,
    `ALTER TABLE vi_thuoc ADD COLUMN IF NOT EXISTS nuoi_duong TEXT`,
    `ALTER TABLE vi_thuoc ADD COLUMN IF NOT EXISTS bao_che TEXT`,
    `ALTER TABLE vi_thuoc ADD COLUMN IF NOT EXISTS don_thuoc TEXT`,
    `ALTER TABLE vi_thuoc ADD COLUMN IF NOT EXISTS chu_tri TEXT`,
    `ALTER TABLE vi_thuoc ADD COLUMN IF NOT EXISTS tham_khao TEXT`,
    // kinh_mach — biểu hiện lâm sàng khi kinh bị tắc nghẽn/rối loạn (popup "Chi tiết kinh mạch")
    `ALTER TABLE kinh_mach ADD COLUMN IF NOT EXISTS bieu_hien_tac_nghen TEXT`,
    // examinations.huThuc — cương Hư-Thực độc lập (không còn gắn Khí/Huyết chi trên/chi dưới)
    `ALTER TABLE examinations ADD COLUMN IF NOT EXISTS "huThuc" VARCHAR(50)`,
    // Bối cảnh môi trường + địa điểm của ca đo (lấy tự động từ GPS máy đang khám).
    // Nhiệt độ MT trước đây có ô nhập trên form nhưng KHÔNG có cột nên bị vứt bỏ khi lưu.
    `ALTER TABLE examinations ADD COLUMN IF NOT EXISTS "nhietDoMoiTruong" NUMERIC(5,2)`,
    `ALTER TABLE examinations ADD COLUMN IF NOT EXISTS "doAmMoiTruong" NUMERIC(5,2)`,
    `ALTER TABLE examinations ADD COLUMN IF NOT EXISTS "tinhThanh" VARCHAR(120)`,
    `ALTER TABLE examinations ADD COLUMN IF NOT EXISTS "phuongXa" VARCHAR(120)`,
    `ALTER TABLE examinations ADD COLUMN IF NOT EXISTS "viDo" DOUBLE PRECISION`,
    `ALTER TABLE examinations ADD COLUMN IF NOT EXISTS "kinhDo" DOUBLE PRECISION`,
    // Thời điểm khám THỰC TẾ — tách khỏi createdAt (lúc bấm lưu) để thầy thuốc lùi/tiến được
    // giờ khám cho ca nhập bù. Ca cũ lấy luôn createdAt làm mốc để danh sách không bị trống.
    //
    // PHẢI cùng kiểu `timestamp` KHÔNG múi giờ như "createdAt": driver pg ghi/đọc kiểu này theo
    // giờ máy chạy Node, nên copy qua lại là khớp tuyệt đối. Dùng TIMESTAMPTZ thì câu backfill
    // chạy TRONG database (session GMT) hiểu giá trị mộc là giờ GMT → toàn bộ ca cũ bị đẩy lên
    // 7 tiếng so với giờ đang hiển thị.
    `ALTER TABLE examinations ADD COLUMN IF NOT EXISTS "thoiDiemKham" TIMESTAMP`,
    // Sửa lại nếu cột đã lỡ tạo dạng TIMESTAMPTZ: hàng backfill trả về đúng createdAt gốc,
    // hàng đã sửa tay quy từ mốc tuyệt đối về giờ VN. Có guard nên chạy lại nhiều lần vẫn an toàn.
    `DO $$
     BEGIN
       IF EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_name = 'examinations'
           AND column_name = 'thoiDiemKham'
           AND data_type = 'timestamp with time zone'
       ) THEN
         ALTER TABLE examinations
           ALTER COLUMN "thoiDiemKham" TYPE TIMESTAMP
           USING CASE
             WHEN ("thoiDiemKham" AT TIME ZONE 'UTC') = "createdAt" THEN "createdAt"
             ELSE "thoiDiemKham" AT TIME ZONE 'Asia/Ho_Chi_Minh'
           END;
       END IF;
     END $$`,
    `UPDATE examinations SET "thoiDiemKham" = "createdAt" WHERE "thoiDiemKham" IS NULL`,
    `CREATE INDEX IF NOT EXISTS idx_examinations_thoi_diem_kham ON examinations ("patientId", "thoiDiemKham" DESC)`,
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
