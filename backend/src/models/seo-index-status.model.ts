import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * Trạng thái index trên Google của 1 URL (lấy qua GSC URL Inspection API).
 *
 * "Cockpit Index" dùng bảng này để biết: trong ~907 URL sitemap, trang nào ĐÃ được Google
 * index, trang nào CHƯA → từ đó ép index (nộp lại sitemap, ping IndexNow). Lưu lại kết quả
 * để mở dashboard không phải gọi Google mỗi lần (URL Inspection có trần ~2000 lượt/ngày).
 */
@Entity('seo_index_status')
export class SeoIndexStatus {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: 'text' })
  url: string;

  /** verdict tổng của Google: PASS = ổn/được index, NEUTRAL, FAIL. */
  @Column({ type: 'varchar', length: 30, nullable: true })
  verdict: string | null;

  /** vd "Submitted and indexed", "Crawled - currently not indexed", "URL is unknown to Google". */
  @Column({ type: 'varchar', length: 160, nullable: true })
  coverage_state: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  robots_state: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  fetch_state: string | null;

  @Column({ type: 'text', nullable: true })
  google_canonical: string | null;

  /** Thời điểm Google crawl gần nhất (chuỗi ISO thô từ GSC). */
  @Column({ type: 'text', nullable: true })
  last_crawl_time: string | null;

  /** Lỗi khi gọi GSC (nếu có) — để hiện và thử lại. */
  @Column({ type: 'text', nullable: true })
  loi: string | null;

  /** Lần kiểm tra gần nhất qua GSC. NULL = chưa kiểm bao giờ. */
  @Column({ type: 'timestamptz', nullable: true })
  checked_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;
}
