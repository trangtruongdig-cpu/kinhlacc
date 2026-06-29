import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PhuongThang } from '../models/phuong-thang.model';

/**
 * PhuongThangService — nghiệp vụ TRA CỨU bài thuốc/cổ phương (công khai, chỉ đọc).
 * - findLite: danh sách + tìm kiếm + phân trang (trường nhẹ cho list).
 * - findBySlug: chi tiết 1 bài (đủ thành phần liên kết vị thuốc).
 * - findByViThuoc: TRA NGƯỢC — các bài thuốc có chứa 1 vị thuốc (cho trang dược liệu).
 */
@Injectable()
export class PhuongThangService {
  constructor(
    @InjectRepository(PhuongThang)
    private readonly repo: Repository<PhuongThang>,
  ) {}

  async findLite(opts: { page?: number; limit?: number; q?: string }) {
    const page = Math.max(1, opts.page || 1);
    const limit = Math.min(60, Math.max(1, opts.limit || 24));
    const qb = this.repo
      .createQueryBuilder('p')
      .select(['p.id', 'p.ten', 'p.slug', 'p.xuat_xu', 'p.tac_gia', 'p.diem_pho_bien', 'p.so_benh']);
    const q = (opts.q || '').trim().toLowerCase();
    if (q) qb.where('lower(p.ten) LIKE :q', { q: `%${q}%` });
    // Sắp: (1) bài được DÙNG TRONG NHIỀU BỆNH (Đông y) lên đầu — thực sự dùng trị bệnh; (2) rồi tới
    // độ thông dụng theo thành phần (bài chưa được y văn bệnh nhắc); (3) cuối cùng A→Z.
    qb.orderBy('p.so_benh', 'DESC').addOrderBy('p.diem_pho_bien', 'DESC').addOrderBy('p.ten', 'ASC')
      .skip((page - 1) * limit).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  findBySlug(slug: string) {
    return this.repo.findOne({ where: { slug } });
  }

  /** Bài thuốc chứa vị thuốc id (JSONB containment, có GIN index). */
  findByViThuoc(idViThuoc: number, limit = 60) {
    return this.repo
      .createQueryBuilder('p')
      .select(['p.id', 'p.ten', 'p.slug', 'p.tac_gia'])
      .where('p.thanh_phan @> :j', { j: JSON.stringify([{ id: idViThuoc }]) })
      .orderBy('p.ten', 'ASC')
      .take(Math.min(200, limit))
      .getMany();
  }

  /** Tổng số bài (cho prerender/sitemap). */
  count() {
    return this.repo.count();
  }

  /** Lấy theo lô (id, slug, …) phục vụ prerender tĩnh & sitemap. */
  allForBuild(offset: number, limit: number) {
    return this.repo.find({ order: { id: 'ASC' }, skip: offset, take: limit });
  }
}
