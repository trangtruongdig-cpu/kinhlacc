import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { TonThuongTacNhan } from '../models/ton-thuong-tac-nhan.model';
import {
  CreateTonThuongTacNhanDto,
  UpdateTonThuongTacNhanDto,
} from '../models/ton-thuong-tac-nhan.dto';

/**
 * Danh mục CHUẨN "Tổn thương - Tác nhân" chia theo 3 trục (Thương Hàn / Ôn bệnh):
 *  ① ĐỊNH VỊ (giai đoạn): gd-luc-kinh · gd-on-benh · gd-khac
 *  ② TÁC NHÂN (khí/tà):   tn-luc-khi (Lục Khí ↔ bản khí Lục Kinh) · tn-noi-sinh
 *  ③ TÍNH TỔN THƯƠNG:     tinh (bát cương / chính khí)
 * Dùng đúng chính tả bản đang có để ON CONFLICT gộp; giá trị thiếu sẽ được thêm.
 */
const CHUAN_TON_THUONG: ReadonlyArray<readonly [string, string]> = [
  // ① Giai đoạn — Lục Kinh (Thương Hàn)
  ['Thái Dương Kinh Chứng', 'gd-luc-kinh'], ['Dương Minh Kinh Chứng', 'gd-luc-kinh'],
  ['Thiếu Dương Kinh Chứng', 'gd-luc-kinh'], ['Thái Âm Kinh Chứng', 'gd-luc-kinh'],
  ['Thiếu Âm Kinh Chứng', 'gd-luc-kinh'], ['Quyết Âm Kinh Chứng', 'gd-luc-kinh'],
  // ① Giai đoạn — Vệ-Khí-Dinh-Huyết (Ôn bệnh)
  ['Vệ Phận', 'gd-on-benh'], ['Khí Phận', 'gd-on-benh'], ['Dinh Phận', 'gd-on-benh'], ['Huyết Phận', 'gd-on-benh'],
  // ① Giai đoạn — Tam tiêu / Tạp bệnh / diễn biến
  ['Thượng Tiêu', 'gd-khac'], ['Trung Tiêu', 'gd-khac'], ['Hạ Tiêu', 'gd-khac'],
  ['Tạp Bệnh', 'gd-khac'], ['Nội Hãm', 'gd-khac'],
  // ② Tác nhân — Lục Khí 六氣 (mỗi khí là bản khí của một Lục Kinh — Tam Âm Tam Dương)
  ['Phong', 'tn-luc-khi'], ['Hàn', 'tn-luc-khi'], ['Thử', 'tn-luc-khi'],
  ['Thấp', 'tn-luc-khi'], ['Táo', 'tn-luc-khi'], ['Nhiệt', 'tn-luc-khi'],
  // ② Tác nhân — Nội sinh / Độc (sản vật bệnh lý)
  ['Đàm', 'tn-noi-sinh'], ['Ứ Huyết', 'tn-noi-sinh'], ['Khí Trệ', 'tn-noi-sinh'],
  ['Thực Tích', 'tn-noi-sinh'], ['Thuỷ Đình', 'tn-noi-sinh'], ['Độc Tà', 'tn-noi-sinh'],
  // ③ Tính tổn thương — bát cương / chính khí
  ['Khí Hư', 'tinh'], ['Huyết Hư', 'tinh'], ['Âm Hư', 'tinh'], ['Dương Hư', 'tinh'],
  ['Khí Huyết', 'tinh'], ['Tân Dịch Khuy', 'tinh'], ['Hư', 'tinh'], ['Thực', 'tinh'],
];

export interface PaginatedTonThuongTacNhan {
  data: TonThuongTacNhan[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class TonThuongTacNhanService implements OnApplicationBootstrap {
  private readonly logger = new Logger('TonThuongTacNhan');

  constructor(
    @InjectRepository(TonThuongTacNhan)
    private readonly repo: Repository<TonThuongTacNhan>,
  ) {}

  /** Thêm cột nhom (idempotent) + phân loại/nạp danh mục chuẩn 3 trục. Không xoá dữ liệu. */
  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.repo.query(
        `ALTER TABLE ton_thuong_tac_nhan ADD COLUMN IF NOT EXISTS nhom VARCHAR(30)`,
      );
      // Đổi tên chuẩn cũ "Nhiệt - Hỏa" → "Nhiệt" (Lục Khí), gộp nếu đã có "Nhiệt".
      await this.repo.query(
        `UPDATE ton_thuong_tac_nhan SET ten='Nhiệt', nhom='tn-luc-khi'
         WHERE ten='Nhiệt - Hỏa' AND NOT EXISTS (SELECT 1 FROM ton_thuong_tac_nhan t2 WHERE t2.ten='Nhiệt')`,
      );
      await this.repo.query(`DELETE FROM ton_thuong_tac_nhan WHERE ten='Nhiệt - Hỏa'`);
      // Ghi chú "bản khí ↔ Lục Kinh" cho 6 Lục Khí (chỉ điền chỗ trống) — nối lớp ④→⑤.
      const BAN_KHI: ReadonlyArray<readonly [string, string]> = [
        ['Phong', 'Phong Mộc · Quyết Âm 厥陰'], ['Hàn', 'Hàn Thủy · Thái Dương 太陽'],
        ['Thử', 'Tướng Hỏa · Thiếu Dương 少陽'], ['Thấp', 'Thấp Thổ · Thái Âm 太陰'],
        ['Táo', 'Táo Kim · Dương Minh 陽明'], ['Nhiệt', 'Quân Hỏa · Thiếu Âm 少陰'],
      ];
      for (const [ten, gc] of BAN_KHI) {
        await this.repo.query(
          `UPDATE ton_thuong_tac_nhan SET ghi_chu=$2 WHERE ten=$1 AND (ghi_chu IS NULL OR ghi_chu='')`,
          [ten, gc],
        );
      }
      const rows = CHUAN_TON_THUONG;
      const values = rows.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ');
      const params = rows.flatMap((r) => [r[0], r[1]]);
      await this.repo.query(
        `INSERT INTO ton_thuong_tac_nhan (ten, nhom) VALUES ${values}
         ON CONFLICT (ten) DO UPDATE SET nhom = EXCLUDED.nhom`,
        params,
      );
      this.logger.log(`Danh mục Tổn thương-Tác nhân: chuẩn hoá ${rows.length} mục theo 3 trục.`);
    } catch (err) {
      this.logger.warn(`Bỏ qua chuẩn hoá danh mục (không chặn boot): ${(err as Error).message}`);
    }
  }

  findAll(): Promise<TonThuongTacNhan[]> {
    return this.repo.find({ order: { id: 'ASC' } });
  }

  async findPaginated(
    page: number = 1,
    limit: number = 20,
    search?: string,
  ): Promise<PaginatedTonThuongTacNhan> {
    const skip = (page - 1) * limit;
    const keyword = String(search || '').trim();
    const where = keyword ? { ten: ILike(`%${keyword}%`) } : undefined;
    const [data, total] = await this.repo.findAndCount({
      where,
      skip,
      take: limit,
      order: { id: 'ASC' },
    });
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findOne(id: number): Promise<TonThuongTacNhan> {
    const item = await this.repo.findOneBy({ id });
    if (!item) {
      throw new NotFoundException(`Tổn thương - Tác nhân #${id} không tồn tại`);
    }
    return item;
  }

  async create(dto: CreateTonThuongTacNhanDto): Promise<TonThuongTacNhan> {
    const ten = (dto.ten ?? '').trim();
    if (!ten) {
      throw new ConflictException('Tên không được để trống');
    }
    const existed = await this.repo.findOneBy({ ten });
    if (existed) {
      throw new ConflictException(`Tên "${ten}" đã tồn tại`);
    }
    const ghi_chu = dto.ghi_chu != null ? String(dto.ghi_chu).trim() || null : null;
    const nhom = dto.nhom != null ? String(dto.nhom).trim() || null : null;
    const entity = this.repo.create({ ten, nhom, ghi_chu });
    return this.repo.save(entity);
  }

  async update(id: number, dto: UpdateTonThuongTacNhanDto): Promise<TonThuongTacNhan> {
    const item = await this.findOne(id);
    if (dto.ten !== undefined) {
      const ten = dto.ten.trim();
      if (!ten) {
        throw new ConflictException('Tên không được để trống');
      }
      if (ten !== item.ten) {
        const existed = await this.repo.findOneBy({ ten });
        if (existed && existed.id !== id) {
          throw new ConflictException(`Tên "${ten}" đã tồn tại`);
        }
      }
      item.ten = ten;
    }
    if (dto.nhom !== undefined) {
      item.nhom = dto.nhom != null ? String(dto.nhom).trim() || null : null;
    }
    if (dto.ghi_chu !== undefined) {
      item.ghi_chu = dto.ghi_chu != null ? String(dto.ghi_chu).trim() || null : null;
    }
    return this.repo.save(item);
  }

  async remove(id: number): Promise<void> {
    const item = await this.findOne(id);
    await this.repo.remove(item);
  }
}
