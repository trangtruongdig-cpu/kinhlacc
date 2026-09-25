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
    `ALTER TABLE vi_thuoc ADD COLUMN IF NOT EXISTS cong_dung_tom_tat VARCHAR(500)`,
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

    // ── BỘ HUYỆT: mở rộng phac_do_chuan (vốn chỉ gắn bệnh chứng) để ôm luôn quan hệ
    // huyệt↔huyệt kinh điển (Nguyên-Lạc, Bát Mạch Giao Hội, Du-Mộ, Tứ Quan…) và nhóm "bài thuốc
    // tương đương" — tái dùng bộ máy kế thừa + vai_tro_huyet sẵn có, không dựng bảng mới.
    `ALTER TABLE phac_do_chuan ADD COLUMN IF NOT EXISTS loai VARCHAR(40) NOT NULL DEFAULT 'chung_benh'`,
    `CREATE INDEX IF NOT EXISTS idx_phac_do_chuan_loai ON phac_do_chuan (loai)`,

    // ── PHIẾU HUYỆT: ghép "huyệt ⇄ vị thuốc" để in cột vị thuốc tương ứng ──
    // Ghép mặc định, KHÔNG phải chân lý: một huyệt ứng vị nào còn tuỳ ngữ cảnh phương (Chương Môn
    // = Nhân sâm là trong Tứ Quân Tử). Vì vậy lúc soạn phiếu vẫn sửa được tại chỗ, cột này chỉ là
    // gợi ý điền sẵn. `cong_nang_ghep` là câu công năng NGẮN để in vừa dòng phiếu — công dụng
    // trong vi_thuoc dài hàng đoạn, in ra vỡ bảng.
    `ALTER TABLE huyet_vi ADD COLUMN IF NOT EXISTS id_vi_thuoc INTEGER`,
    `ALTER TABLE huyet_vi ADD COLUMN IF NOT EXISTS cong_nang_ghep VARCHAR(255)`,
    `CREATE INDEX IF NOT EXISTS idx_huyet_vi_id_vi_thuoc ON huyet_vi (id_vi_thuoc)`,

    // ── Cờ nhắc hẹn (AppointmentReminderService) — trước đây ALTER tay trên production ──
    `ALTER TABLE appointment_slots ADD COLUMN IF NOT EXISTS "reminded1h"  boolean NOT NULL DEFAULT false`,
    `ALTER TABLE appointment_slots ADD COLUMN IF NOT EXISTS "reminded30m" boolean NOT NULL DEFAULT false`,
    `ALTER TABLE appointment_slots ADD COLUMN IF NOT EXISTS "reminded15m" boolean NOT NULL DEFAULT false`,

    // ── LỊCH SỬ ĐẶT VÉ: tách "lượt đặt" khỏi "ô giờ" ──
    // Ô giờ được dùng lại (A huỷ → B đặt), nên `appointment_slots.patientId` bị ghi đè và lượt đặt
    // của A biến mất. Bảng này giữ lịch sử bất biến; ô giờ chỉ còn giữ trạng thái hiện tại.
    `CREATE TABLE IF NOT EXISTS appointment_bookings (
       id            SERIAL PRIMARY KEY,
       "slotId"      INTEGER NOT NULL,
       "patientId"   INTEGER NOT NULL,
       "slotDate"    DATE NOT NULL,
       "slotTime"    TIME NOT NULL,
       status        VARCHAR(20) NOT NULL DEFAULT 'BOOKED',
       reason        TEXT,
       notes         TEXT,
       "cancelledBy" VARCHAR(10),
       -- TIMESTAMPTZ cho khớp appointment_slots (xem rebuild-appointment-system.sql).
       -- Dùng TIMESTAMP trần ở đây thì backfill bên dưới chép từ timestamptz sang sẽ lệch 7 tiếng.
       "cancelledAt" TIMESTAMPTZ,
       "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
       "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
       CONSTRAINT appointment_bookings_status_check
         CHECK (status IN ('BOOKED', 'CANCELLED', 'COMPLETED'))
     )`,
    `CREATE INDEX IF NOT EXISTS idx_appt_booking_slot ON appointment_bookings ("slotId")`,
    `CREATE INDEX IF NOT EXISTS idx_appt_booking_patient ON appointment_bookings ("patientId", "slotDate" DESC)`,
    // Chốt ở TẦNG DB: mỗi ô giờ nhiều nhất MỘT lượt đặt còn hiệu lực. Đây mới là bảo đảm thật
    // chống đặt trùng — khoá pessimistic chỉ chặn trong phạm vi một tiến trình backend.
    `CREATE UNIQUE INDEX IF NOT EXISTS ux_appt_booking_active
       ON appointment_bookings ("slotId") WHERE status = 'BOOKED'`,

    // Backfill: dựng lại lịch sử từ dữ liệu vé đang có. Chỉ chép ô giờ CÒN gắn bệnh nhân —
    // lượt đặt nào đã bị ghi đè trước khi có bảng này thì đã mất hẳn, không cứu được.
    `INSERT INTO appointment_bookings
       ("slotId", "patientId", "slotDate", "slotTime", status, reason, notes, "cancelledAt", "createdAt", "updatedAt")
     SELECT s.id, s."patientId", s."slotDate", s."slotTime",
            CASE WHEN s.status IN ('BOOKED','COMPLETED','CANCELLED') THEN s.status ELSE 'BOOKED' END,
            s.reason, s.notes,
            CASE WHEN s.status = 'CANCELLED' THEN s."updatedAt" ELSE NULL END,
            s."createdAt", s."updatedAt"
       FROM appointment_slots s
      WHERE s."patientId" IS NOT NULL
        AND s.status IN ('BOOKED','COMPLETED','CANCELLED')
        AND NOT EXISTS (SELECT 1 FROM appointment_bookings b WHERE b."slotId" = s.id)`,

    // Khoá bí mật cho đường dẫn lịch .ics bệnh nhân đăng ký (xem patient.model.ts).
    `ALTER TABLE patients ADD COLUMN IF NOT EXISTS "icsToken" TEXT`,
    `CREATE UNIQUE INDEX IF NOT EXISTS ux_patients_ics_token ON patients ("icsToken") WHERE "icsToken" IS NOT NULL`,

    // Dọn ô giờ đã huỷ: bỏ mọi dấu vết bệnh nhân (notes trước đây KHÔNG được xoá → ghi chú riêng
    // của người trước dính sang người đặt sau) và trả về OPEN.
    //
    // OPEN cho MỌI ngày, kể cả ngày đã qua: 'CANCELLED' là trạng thái của LƯỢT ĐẶT, không phải
    // của ô giờ. Lịch sử huỷ đã nằm ở appointment_bookings (câu INSERT ngay bên trên chạy trước),
    // nên giữ thêm nhãn trên ô giờ chỉ tạo ra nút "Mở lại" thủ công vô nghĩa.
    `UPDATE appointment_slots
        SET "patientId" = NULL, reason = NULL, notes = NULL,
            "reminded1h" = false, "reminded30m" = false, "reminded15m" = false,
            status = 'OPEN'
      WHERE status = 'CANCELLED'`,

    // Thiếu 2 index này làm mỗi lượt dò "bài thuốc demo công khai" (đếm số vị/kiểm chỉ định theo
    // id_bai_thuoc) phải quét toàn bảng lặp lại cho từng ứng viên — quan sát thực tế trên production
    // là request treo >30s và giữ luôn 1 kết nối DB, kéo các request khác (kể cả không liên quan
    // bai_thuoc) chờ theo do pool bị chiếm dụng. Xem trang-cong-khai-tai-cham.md.
    `CREATE INDEX IF NOT EXISTS idx_bai_thuoc_chi_tiet_id_bai_thuoc ON bai_thuoc_chi_tiet (id_bai_thuoc)`,
    `CREATE INDEX IF NOT EXISTS idx_bai_thuoc_phap_tri_id_bai_thuoc ON bai_thuoc_phap_tri (id_bai_thuoc)`,

    // ── Tab "Góp Ý & Lỗi" ────────────────────────────────────────────────────────────
    // Cột thời gian dùng TIMESTAMPTZ ở CẢ entity lẫn đây. Bảng cũ trong dự án bị lệch 7 tiếng
    // vì file .sql ghi timestamptz còn DB thật là timestamp — bảng mới thì khớp từ đầu.
    `CREATE TABLE IF NOT EXISTS su_co_cum (
       id                SERIAL PRIMARY KEY,
       van_tay           VARCHAR(16) NOT NULL UNIQUE,
       loai              VARCHAR(10) NOT NULL,
       lane              VARCHAR(10) NOT NULL,
       khu_vuc           VARCHAR(60) NOT NULL,
       route_chuan       TEXT NOT NULL,
       tom_tat           TEXT NOT NULL,
       thong_diep_goc    TEXT,
       so_lan            INTEGER NOT NULL DEFAULT 0,
       so_nguoi          INTEGER NOT NULL DEFAULT 0,
       nguoi_dung_hashes JSONB NOT NULL DEFAULT '[]',
       chan_thao_tac     BOOLEAN NOT NULL DEFAULT false,
       hang              VARCHAR(6) NOT NULL DEFAULT 'nhe',
       trang_thai        VARCHAR(12) NOT NULL DEFAULT 'moi',
       tai_phat          BOOLEAN NOT NULL DEFAULT false,
       lan_dau           TIMESTAMPTZ NOT NULL DEFAULT now(),
       lan_cuoi          TIMESTAMPTZ NOT NULL DEFAULT now(),
       ghi_chu           TEXT,
       ho_so_ai          TEXT,
       ho_so_ai_luc      TIMESTAMPTZ,
       phien_ban_app     VARCHAR(40),
       created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
       updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
     )`,
    `CREATE INDEX IF NOT EXISTS idx_su_co_cum_trang_thai ON su_co_cum (trang_thai)`,
    `CREATE INDEX IF NOT EXISTS idx_su_co_cum_lan_cuoi ON su_co_cum (lan_cuoi DESC)`,
    `CREATE TABLE IF NOT EXISTS su_co (
       id                 SERIAL PRIMARY KEY,
       cum_id             INTEGER NOT NULL REFERENCES su_co_cum(id) ON DELETE CASCADE,
       xay_ra_luc         TIMESTAMPTZ NOT NULL DEFAULT now(),
       loai               VARCHAR(10) NOT NULL,
       route_tho          TEXT,
       route_chuan        TEXT NOT NULL,
       thong_diep         TEXT NOT NULL,
       stack              TEXT,
       ma_loi             VARCHAR(80),
       http_status        INTEGER,
       breadcrumbs        JSONB,
       ngu_canh           JSONB,
       trinh_duyet        VARCHAR(250),
       vai_tro_nguoi_dung VARCHAR(40),
       nguoi_dung_hash    VARCHAR(16),
       phien_ban_app      VARCHAR(40),
       ip_rut_gon         VARCHAR(45),
       mo_ta_nguoi_dung   TEXT
     )`,
    `CREATE INDEX IF NOT EXISTS idx_su_co_cum_id ON su_co (cum_id)`,
    `CREATE INDEX IF NOT EXISTS idx_su_co_xay_ra_luc ON su_co (xay_ra_luc DESC)`,
    // Token thiết bị của nhân viên — để đẩy cảnh báo sự cố hạng nặng ra điện thoại.
    `ALTER TABLE admins ADD COLUMN IF NOT EXISTS fcm_token TEXT`,
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
