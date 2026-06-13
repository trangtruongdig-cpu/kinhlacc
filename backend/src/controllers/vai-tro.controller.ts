import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VaiTro } from '../models/vai-tro.model';
import { Admin } from '../models/admin.model';
import { CreateVaiTroDto, UpdateVaiTroDto } from '../models/vai-tro.dto';
import { APP_PAGE_KEYS, sanitizeTrangCho } from '../constants/pages';

/** Bỏ dấu tiếng Việt + tạo slug cho mã vai trò. */
function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 50) || 'vai_tro';
}

@Injectable()
export class VaiTroService {
  constructor(
    @InjectRepository(VaiTro)
    private readonly vaiTroRepo: Repository<VaiTro>,
    @InjectRepository(Admin)
    private readonly adminRepo: Repository<Admin>,
  ) {}

  findAll(): Promise<VaiTro[]> {
    return this.vaiTroRepo.find({ order: { laQuanTri: 'DESC', laHeThong: 'DESC', ten: 'ASC' } });
  }

  async findOne(id: string): Promise<VaiTro> {
    const vt = await this.vaiTroRepo.findOne({ where: { id } });
    if (!vt) throw new NotFoundException('Không tìm thấy vai trò.');
    return vt;
  }

  async create(dto: CreateVaiTroDto): Promise<VaiTro> {
    const ten = (dto.ten || '').trim();
    if (!ten) throw new BadRequestException('Tên vai trò không được để trống.');

    let ma = dto.ma ? slugify(dto.ma) : slugify(ten);
    // Đảm bảo mã duy nhất bằng cách thêm hậu tố nếu trùng.
    let suffix = 1;
    const base = ma;
    while (await this.vaiTroRepo.findOne({ where: { ma } })) {
      ma = `${base}_${suffix++}`;
    }

    const vt = this.vaiTroRepo.create({
      ma,
      ten,
      moTa: (dto.moTa || '').trim(),
      laQuanTri: false,
      laHeThong: false,
      trangCho: sanitizeTrangCho(dto.trangCho),
    });
    return this.vaiTroRepo.save(vt);
  }

  async update(id: string, dto: UpdateVaiTroDto): Promise<VaiTro> {
    const vt = await this.findOne(id);
    if (dto.ten !== undefined) {
      const ten = dto.ten.trim();
      if (!ten) throw new BadRequestException('Tên vai trò không được để trống.');
      vt.ten = ten;
    }
    if (dto.moTa !== undefined) vt.moTa = dto.moTa.trim();
    if (dto.trangCho !== undefined) {
      // Vai trò Quản Trị Viên luôn full quyền, không cần chỉnh trang.
      vt.trangCho = vt.laQuanTri
        ? sanitizeTrangCho([...APP_PAGE_KEYS])
        : sanitizeTrangCho(dto.trangCho);
    }
    return this.vaiTroRepo.save(vt);
  }

  async remove(id: string): Promise<void> {
    const vt = await this.findOne(id);
    if (vt.laHeThong) {
      throw new BadRequestException('Không thể xoá vai trò mặc định của hệ thống.');
    }
    const dangDung = await this.adminRepo.count({ where: { vaiTroId: id } });
    if (dangDung > 0) {
      throw new ConflictException(
        `Còn ${dangDung} tài khoản đang dùng vai trò này. Hãy chuyển họ sang vai trò khác trước khi xoá.`,
      );
    }
    await this.vaiTroRepo.remove(vt);
  }

  /** Seed 4 vai trò mặc định nếu chưa có (dùng cho script seed lần đầu). */
  async ensureDefaults(): Promise<void> {
    const defaults: Array<Partial<VaiTro>> = [
      {
        ma: 'admin',
        ten: 'Quản Trị Viên',
        moTa: 'Toàn quyền hệ thống: quản lý tài khoản, phân quyền và toàn bộ dữ liệu.',
        laQuanTri: true,
        laHeThong: true,
        trangCho: sanitizeTrangCho([...APP_PAGE_KEYS]),
      },
      {
        ma: 'bac_si',
        ten: 'Bác Sĩ',
        moTa: 'Khám bệnh, kê đơn, tra cứu chuyên môn (không quản lý tài khoản).',
        laQuanTri: false,
        laHeThong: true,
        trangCho: [
          'home', 'patients', 'appointments', 'western-medicine', 'meridian-diseases',
          'kinh-mach-3d', 'tu-dien', 'medicines', 'symptoms', 'treatments',
        ],
      },
      {
        ma: 'le_tan',
        ten: 'Lễ Tân',
        moTa: 'Quản lý bệnh nhân và lịch trị liệu.',
        laQuanTri: false,
        laHeThong: true,
        trangCho: ['home', 'patients', 'appointments'],
      },
      {
        ma: 'thu_ngan',
        ten: 'Thu Ngân / Kế Toán',
        moTa: 'Xem bệnh nhân và lịch trị liệu (phục vụ thu ngân).',
        laQuanTri: false,
        laHeThong: true,
        trangCho: ['home', 'patients', 'appointments'],
      },
    ];

    for (const def of defaults) {
      const existed = await this.vaiTroRepo.findOne({ where: { ma: def.ma } });
      if (!existed) await this.vaiTroRepo.save(this.vaiTroRepo.create(def));
    }
  }

  /** Lấy vai trò Quản Trị Viên (admin). */
  getAdminRole(): Promise<VaiTro | null> {
    return this.vaiTroRepo.findOne({ where: { ma: 'admin' } });
  }
}
