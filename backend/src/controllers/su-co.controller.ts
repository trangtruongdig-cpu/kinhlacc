import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';
import { createHash } from 'crypto';
import OpenAI from 'openai';

import { SuCo } from '../models/su-co.model';
import { SuCoCum, type TrangThaiCum } from '../models/su-co-cum.model';
import type {
  BaoSuCoDto,
  CapNhatCumDto,
  LocCumDto,
  ThongKeSuCoDto,
} from '../models/su-co.dto';
import { Admin } from '../models/admin.model';
import { SseService } from './sse.service';
import { FirebaseService } from './firebase.controller';
import {
  cheDuLieu,
  chuanHoaRoute,
  chuanHoaThongDiep,
  doanFileLienQuan,
  khuVucTuRoute,
  laneCuaLoai,
  nenChenBanGhi,
  tinhVanTay,
  xepHang,
  type LoaiSuCo,
} from '../utils/su-co-van-tay.util';

/** Ngữ cảnh do tầng router bóc ra từ request — service không đụng vào `req`. */
export interface NguCanhBao {
  ipRutGon: string | null;
  vaiTro: string | null;
  nguoiDungHash: string | null;
}

const LOAI_HOP_LE: LoaiSuCo[] = ['loi_be', 'loi_fe', 'gop_y', 'ux'];

/** Trần số báo cáo mỗi phút cho mỗi IP. Cửa `POST /su-co/bao` là CÔNG KHAI nên phải có trần. */
const TRAN_MOI_PHUT_MOI_IP = 60;

/** Giữ chi tiết 30 ngày. Cụm đã đóng thì dọn sau 90 ngày. */
const NGAY_GIU_CHI_TIET = 30;
const NGAY_GIU_CUM_DA_DONG = 90;

const SO_HASH_TOI_DA = 50;
const SO_LAN_HIEN_CHI_TIET = 20;

@Injectable()
export class SuCoService {
  private readonly logger = new Logger('SuCo');

  /**
   * Bộ đếm chống bão, giữ TRONG BỘ NHỚ thay vì đếm bằng SQL mỗi sự kiện.
   *
   * An toàn vì backend chạy MỘT tiến trình duy nhất (Docker Compose, xem CLAUDE.md). Nếu sau này
   * chạy nhiều bản, bộ đếm này mất tác dụng chặn — lúc đó phải chuyển sang đếm tập trung.
   * Mất bộ đếm khi khởi động lại là chấp nhận được: cùng lắm ghi thêm vài dòng thừa.
   */
  private demTheoGio = new Map<string, { gio: number; dem: number }>();
  private demTheoIp = new Map<string, { phut: number; dem: number }>();

  private client: OpenAI | null = null;

  constructor(
    @InjectRepository(SuCo) private readonly suCoRepo: Repository<SuCo>,
    @InjectRepository(SuCoCum) private readonly cumRepo: Repository<SuCoCum>,
    @InjectRepository(Admin) private readonly adminRepo: Repository<Admin>,
    private readonly sse: SseService,
    private readonly firebase: FirebaseService,
    private readonly config: ConfigService,
  ) {}

  // ── Thu nhận ────────────────────────────────────────────────────────────────────────

  /**
   * Nhận một LÔ tín hiệu. Máy khách gom 5 giây một lần rồi gửi chung.
   *
   * Một phần tử hỏng KHÔNG được làm hỏng cả lô: tín hiệu lỗi mà cũng lỗi thì im lặng bỏ qua,
   * tuyệt đối không ném ngược về máy khách để nó lại báo lỗi tiếp — vòng lặp vô tận.
   */
  async ghiNhanLo(
    danhSach: BaoSuCoDto[],
    ctx: NguCanhBao,
  ): Promise<{ nhan: number; boQua: number }> {
    if (!Array.isArray(danhSach) || !danhSach.length) {
      throw new BadRequestException('Thiếu danh sách tín hiệu');
    }
    if (!this.conHanMuc(ctx.ipRutGon)) {
      // Trả 429 để máy khách tự giãn nhịp thay vì nghĩ là mình gửi sai.
      throw new HttpException('Gửi quá nhanh, thử lại sau ít phút', 429);
    }

    let nhan = 0;
    let boQua = 0;
    for (const item of danhSach.slice(0, 50)) {
      try {
        await this.ghiNhanMot(item, ctx);
        nhan += 1;
      } catch (e) {
        boQua += 1;
        this.logger.warn(`Bỏ qua một tín hiệu hỏng: ${(e as Error)?.message}`);
      }
    }
    return { nhan, boQua };
  }

  /**
   * Cửa cho tín hiệu sinh ra TRONG máy chủ (bộ lọc lỗi 5xx).
   *
   * Không đi qua trần theo IP: trần đó để chặn người ngoài bắn vào cửa công khai. Lỗi 5xx của
   * chính mình mà bị trần chặn thì đúng lúc hệ thống hỏng nặng nhất lại là lúc không ghi được
   * gì — hỏng ngược hẳn với mục đích. Chống bão vẫn còn nguyên ở tầng cụm.
   */
  async ghiNhanNoiBo(item: BaoSuCoDto, ctx: NguCanhBao): Promise<void> {
    try {
      await this.ghiNhanMot(item, ctx);
    } catch (e) {
      this.logger.warn(`Không ghi được sự cố nội bộ: ${(e as Error)?.message}`);
    }
  }

  private async ghiNhanMot(item: BaoSuCoDto, ctx: NguCanhBao): Promise<void> {
    const loai = LOAI_HOP_LE.includes(item?.loai) ? item.loai : 'loi_fe';
    const thongDiepTho = String(
      item?.thongDiep || item?.tieuDe || item?.moTaNguoiDung || '',
    ).trim();
    if (!thongDiepTho) throw new BadRequestException('Thiếu thông điệp');

    const routeChuan = chuanHoaRoute(item?.route || '');
    const tomTat = chuanHoaThongDiep(thongDiepTho);
    const vanTay = tinhVanTay(loai, routeChuan, tomTat);
    const bayGio = new Date();

    let cum = await this.cumRepo.findOne({ where: { vanTay } });
    let laMoi = false;
    let laTaiPhat = false;

    if (!cum) {
      cum = this.cumRepo.create({
        vanTay,
        loai,
        lane: laneCuaLoai(loai),
        khuVuc: khuVucTuRoute(item?.route || ''),
        routeChuan,
        tomTat,
        thongDiepGoc: thongDiepTho.slice(0, 1000),
        soLan: 0,
        soNguoi: 0,
        nguoiDungHashes: [],
        chanThaoTac: false,
        hang: 'nhe',
        trangThai: 'moi',
        taiPhat: false,
        lanDau: bayGio,
        lanCuoi: bayGio,
        phienBanApp: item?.phienBanApp ?? null,
      });
      laMoi = true;
    } else if (cum.trangThai === 'da_sua') {
      // Lỗi đã đóng mà quay lại: bản vá trước không trúng, hoặc bị thay đổi sau đó phá lại.
      // Cố ý KHÔNG mở lại cụm 'bo_qua' — "bỏ qua" nghĩa là đừng làm phiền tôi về việc này nữa.
      cum.trangThai = 'moi';
      cum.taiPhat = true;
      laTaiPhat = true;
    }

    cum.soLan += 1;
    cum.lanCuoi = bayGio;
    if (
      ctx.nguoiDungHash &&
      !cum.nguoiDungHashes.includes(ctx.nguoiDungHash) &&
      cum.nguoiDungHashes.length < SO_HASH_TOI_DA
    ) {
      cum.nguoiDungHashes = [...cum.nguoiDungHashes, ctx.nguoiDungHash];
    }
    cum.soNguoi = Math.max(cum.nguoiDungHashes.length, 1);
    cum.chanThaoTac = cum.chanThaoTac || !!item?.chanThaoTac;
    cum.hang = xepHang({
      loai,
      soLan: cum.soLan,
      soNguoi: cum.soNguoi,
      chanThaoTac: cum.chanThaoTac,
    });

    const daLuu = await this.cumRepo.save(cum);

    if (nenChenBanGhi(this.demGioChoCum(vanTay))) {
      await this.suCoRepo.save(
        this.suCoRepo.create({
          cumId: daLuu.id,
          xayRaLuc: bayGio,
          loai,
          routeTho: (item?.route || '').slice(0, 500) || null,
          routeChuan,
          thongDiep: thongDiepTho.slice(0, 2000),
          stack: item?.stack ? String(item.stack).slice(0, 8000) : null,
          maLoi: item?.maLoi ? String(item.maLoi).slice(0, 80) : null,
          httpStatus: Number.isFinite(item?.httpStatus)
            ? Number(item.httpStatus)
            : null,
          // Che lại LẦN NỮA ở máy chủ: máy khách là thứ không kiểm soát được, ai cũng gọi
          // thẳng API này được nên không thể tin nó đã che đúng.
          breadcrumbs: cheDuLieu(item?.breadcrumbs ?? null),
          nguCanh: cheDuLieu(item?.nguCanh ?? null),
          trinhDuyet: item?.trinhDuyet
            ? String(item.trinhDuyet).slice(0, 250)
            : null,
          vaiTroNguoiDung: ctx.vaiTro,
          nguoiDungHash: ctx.nguoiDungHash,
          phienBanApp: item?.phienBanApp
            ? String(item.phienBanApp).slice(0, 40)
            : null,
          ipRutGon: ctx.ipRutGon,
          moTaNguoiDung: item?.moTaNguoiDung
            ? String(cheDuLieu(item.moTaNguoiDung)).slice(0, 2000)
            : null,
        }),
      );
    }

    if (laMoi || laTaiPhat) await this.baoDong(daLuu, laTaiPhat);
  }

  /** Đếm số lần của một cụm trong GIỜ hiện tại (mốc theo giờ tròn, không phải cửa sổ trượt). */
  private demGioChoCum(vanTay: string): number {
    const gio = Math.floor(Date.now() / 3_600_000);
    const cu = this.demTheoGio.get(vanTay);
    if (!cu || cu.gio !== gio) {
      this.demTheoGio.set(vanTay, { gio, dem: 1 });
      // Dọn bộ nhớ: mỗi lần sang giờ mới thì bỏ các mục của giờ cũ.
      if (this.demTheoGio.size > 5000) {
        for (const [k, v] of this.demTheoGio)
          if (v.gio !== gio) this.demTheoGio.delete(k);
      }
      return 0;
    }
    cu.dem += 1;
    return cu.dem - 1;
  }

  private conHanMuc(ip: string | null): boolean {
    const khoa = ip || 'khong-ip';
    const phut = Math.floor(Date.now() / 60_000);
    const cu = this.demTheoIp.get(khoa);
    if (!cu || cu.phut !== phut) {
      this.demTheoIp.set(khoa, { phut, dem: 1 });
      if (this.demTheoIp.size > 2000) {
        for (const [k, v] of this.demTheoIp)
          if (v.phut !== phut) this.demTheoIp.delete(k);
      }
      return true;
    }
    cu.dem += 1;
    return cu.dem <= TRAN_MOI_PHUT_MOI_IP;
  }

  // ── Báo động ────────────────────────────────────────────────────────────────────────

  /**
   * Chuông trong app cho MỌI cụm mới (trừ làn UX — nhiễu quá sẽ làm người ta tắt chuông),
   * còn đẩy điện thoại và Telegram chỉ dành cho hạng NẶNG.
   */
  private async baoDong(cum: SuCoCum, laTaiPhat: boolean): Promise<void> {
    const tieuDe = laTaiPhat ? 'Lỗi cũ tái phát' : 'Sự cố mới';
    const noiDung = `[${cum.khuVuc}] ${cum.thongDiepGoc || cum.tomTat}`.slice(
      0,
      180,
    );

    if (cum.lane !== 'ux') {
      this.sse.emitEvent({
        type: 'SU_CO_MOI',
        suCo: {
          id: cum.id,
          vanTay: cum.vanTay,
          hang: cum.hang,
          lane: cum.lane,
          khuVuc: cum.khuVuc,
          tomTat: noiDung,
          taiPhat: laTaiPhat,
        },
      });
    }

    if (cum.hang !== 'nang') return;

    await Promise.allSettled([
      this.dayDienThoai(tieuDe, noiDung),
      this.guiTelegram(tieuDe, noiDung),
    ]);
  }

  private async dayDienThoai(tieuDe: string, noiDung: string): Promise<void> {
    const nhanVien = await this.adminRepo.find({ where: { trangThai: true } });
    const tokens = nhanVien
      .map((a) => a.fcmToken)
      .filter((t): t is string => !!t);
    for (const token of tokens) {
      try {
        await this.firebase.sendNotification(token, tieuDe, noiDung, {
          loai: 'su_co',
        });
      } catch (e) {
        this.logger.warn(`Không đẩy được thông báo: ${(e as Error)?.message}`);
      }
    }
  }

  /**
   * NẰM IM nếu chưa cấu hình — thiếu token hoặc chat id là thoát ngay, không lỗi.
   * Cách bật: tạo bot với @BotFather, lấy chat id, đặt TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID.
   */
  private async guiTelegram(tieuDe: string, noiDung: string): Promise<void> {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    const chatId = this.config.get<string>('TELEGRAM_CHAT_ID');
    if (!token || !chatId) return;

    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `⚠️ ${tieuDe}\n${noiDung}`,
        }),
      });
    } catch (e) {
      this.logger.warn(`Không gửi được Telegram: ${(e as Error)?.message}`);
    }
  }

  // ── Đọc ─────────────────────────────────────────────────────────────────────────────

  async danhSachCum(loc: LocCumDto) {
    const trang = Math.max(1, Number(loc?.trang) || 1);
    const moiTrang = Math.min(100, Math.max(5, Number(loc?.moiTrang) || 25));

    const qb = this.cumRepo.createQueryBuilder('c');

    const trangThai = loc?.trangThai || 'dang_mo';
    if (trangThai === 'dang_mo') {
      qb.andWhere('c.trangThai IN (:...tt)', { tt: ['moi', 'dang_sua'] });
    } else if (trangThai !== 'tat_ca') {
      qb.andWhere('c.trangThai = :tt', { tt: trangThai });
    }
    if (loc?.lane && loc.lane !== 'tat_ca')
      qb.andWhere('c.lane = :lane', { lane: loc.lane });
    if (loc?.loai && loc.loai !== 'tat_ca')
      qb.andWhere('c.loai = :loai', { loai: loc.loai });
    if (loc?.hang && loc.hang !== 'tat_ca')
      qb.andWhere('c.hang = :hang', { hang: loc.hang });
    if (loc?.q?.trim()) {
      const q = `%${loc.q.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(c.khuVuc) LIKE :q OR LOWER(c.routeChuan) LIKE :q OR LOWER(c.tomTat) LIKE :q OR c.vanTay LIKE :q)',
        { q },
      );
    }

    const [danhSach, tong] = await qb
      .orderBy('c.lanCuoi', 'DESC')
      .skip((trang - 1) * moiTrang)
      .take(moiTrang)
      .getManyAndCount();

    return { danhSach, tong, trang, moiTrang };
  }

  async chiTietCum(id: number) {
    const cum = await this.cumRepo.findOne({ where: { id } });
    if (!cum) throw new NotFoundException('Không tìm thấy cụm sự cố');

    const cacLan = await this.suCoRepo.find({
      where: { cumId: id },
      order: { xayRaLuc: 'DESC' },
      take: SO_LAN_HIEN_CHI_TIET,
    });

    return {
      cum,
      cacLan,
      // Lấy stack của lần gần nhất CÓ stack, không phải của lần gần nhất.
      // Nhiều tín hiệu không kèm stack (lỗi mạng, góp ý, lỗi tải tài nguyên); nếu một lần như
      // thế rơi vào vị trí mới nhất thì cả cụm mất sạch gợi ý dù lần trước đó có stack đầy đủ.
      fileLienQuan: doanFileLienQuan(timStack(cacLan), cum.loai, cum.khuVuc),
      bieuDo: await this.bieuDoTheoGio(id),
    };
  }

  /** 24 cột, mỗi cột một giờ — đủ để thấy "lỗi đang dồn dập" hay "lỗi đã ngưng". */
  private async bieuDoTheoGio(
    cumId: number,
  ): Promise<{ gio: string; soLan: number }[]> {
    const rows = await this.suCoRepo
      .createQueryBuilder('s')
      .select("date_trunc('hour', s.xayRaLuc)", 'gio')
      .addSelect('COUNT(*)', 'so_lan')
      .where('s.cumId = :cumId', { cumId })
      .andWhere("s.xayRaLuc > now() - interval '24 hours'")
      .groupBy('gio')
      .orderBy('gio', 'ASC')
      .getRawMany<{ gio: Date; so_lan: string }>();

    return rows.map((r) => ({
      gio: new Date(r.gio).toISOString(),
      soLan: Number(r.so_lan),
    }));
  }

  async capNhatCum(id: number, dto: CapNhatCumDto): Promise<SuCoCum> {
    const cum = await this.cumRepo.findOne({ where: { id } });
    if (!cum) throw new NotFoundException('Không tìm thấy cụm sự cố');

    const hopLe: TrangThaiCum[] = ['moi', 'dang_sua', 'da_sua', 'bo_qua'];
    if (dto?.trangThai) {
      if (!hopLe.includes(dto.trangThai))
        throw new BadRequestException('Trạng thái không hợp lệ');
      cum.trangThai = dto.trangThai;
      // Đóng cụm thì hạ cờ tái phát: lần sau lỗi quay lại mới là tái phát MỚI.
      if (dto.trangThai === 'da_sua' || dto.trangThai === 'bo_qua')
        cum.taiPhat = false;
    }
    if (dto?.ghiChu !== undefined)
      cum.ghiChu = String(dto.ghiChu).slice(0, 4000) || null;

    return this.cumRepo.save(cum);
  }

  async thongKe(): Promise<ThongKeSuCoDto> {
    const [dangMo, moi24h, hangNang, daSuaTuanNay, chuaXem] = await Promise.all(
      [
        this.cumRepo.count({ where: { trangThai: In(['moi', 'dang_sua']) } }),
        this.cumRepo
          .createQueryBuilder('c')
          .where("c.lanDau > now() - interval '24 hours'")
          .getCount(),
        this.cumRepo.count({
          where: { hang: 'nang', trangThai: In(['moi', 'dang_sua']) },
        }),
        this.cumRepo
          .createQueryBuilder('c')
          .where('c.trangThai = :tt', { tt: 'da_sua' })
          .andWhere("c.updatedAt > now() - interval '7 days'")
          .getCount(),
        this.cumRepo.count({ where: { trangThai: 'moi' } }),
      ],
    );

    return { dangMo, moi24h, hangNang, daSuaTuanNay, chuaXem };
  }

  // ── Hồ sơ sửa lỗi ───────────────────────────────────────────────────────────────────

  /**
   * Dựng phiếu sửa lỗi dán thẳng vào Claude Code.
   *
   * Bằng KHUÔN MẪU, không qua AI: luôn có, miễn phí, và không bịa. Đây là sản phẩm chính của
   * cả tính năng — phần AI bên dưới chỉ là lớp phủ tuỳ chọn.
   */
  async hoSoSuaLoi(id: number): Promise<string> {
    const { cum, cacLan, fileLienQuan } = await this.chiTietCum(id);
    const ganNhat = cacLan[0];
    // Ngữ cảnh lấy từ lần GẦN NHẤT, còn bằng chứng kỹ thuật lấy từ lần gần nhất CÓ stack —
    // hai thứ này không nhất thiết là cùng một lần.
    const lanCoStack = cacLan.find((l) => !!l.stack) || ganNhat;
    const lanCoVet =
      cacLan.find(
        (l) => Array.isArray(l.breadcrumbs) && l.breadcrumbs.length,
      ) || ganNhat;
    const lanCoNguCanh =
      cacLan.find(
        (l) => l.nguCanh && Object.keys(l.nguCanh as object).length,
      ) || ganNhat;

    const dong: string[] = [];
    dong.push(`# Sửa lỗi: ${cum.thongDiepGoc || cum.tomTat}`);
    dong.push('');
    dong.push(
      `Vân tay: \`${cum.vanTay}\` · hạng **${cum.hang}**${cum.taiPhat ? ' · ĐÃ TÁI PHÁT' : ''}`,
    );
    dong.push('');
    dong.push('## Sự việc');
    dong.push('');
    dong.push('| | |');
    dong.push('|---|---|');
    dong.push(`| Khu vực | ${cum.khuVuc} |`);
    dong.push(`| Route | \`${cum.routeChuan}\` |`);
    dong.push(`| Nguồn | ${nhanLoai(cum.loai)} |`);
    dong.push(`| Số lần | ${cum.soLan} |`);
    dong.push(`| Số người dính | ${cum.soNguoi} |`);
    dong.push(`| Lần đầu | ${dinhDangGio(cum.lanDau)} |`);
    dong.push(`| Lần cuối | ${dinhDangGio(cum.lanCuoi)} |`);
    if (cum.chanThaoTac)
      dong.push(
        `| Hậu quả | CHẶN thao tác — người dùng không hoàn tất được việc |`,
      );
    dong.push('');

    if (ganNhat?.moTaNguoiDung) {
      dong.push('## Người dùng mô tả');
      dong.push('');
      dong.push('> ' + ganNhat.moTaNguoiDung.split('\n').join('\n> '));
      dong.push('');
    }

    dong.push('## Cách tái hiện');
    dong.push('');
    dong.push(`- Trang: \`${ganNhat?.routeTho || cum.routeChuan}\``);
    dong.push(`- Vai trò: ${ganNhat?.vaiTroNguoiDung || 'không rõ'}`);
    dong.push(`- Trình duyệt: ${ganNhat?.trinhDuyet || 'không rõ'}`);
    if (ganNhat?.httpStatus) dong.push(`- Mã HTTP: ${ganNhat.httpStatus}`);
    dong.push('');

    const vun = Array.isArray(lanCoVet?.breadcrumbs)
      ? (lanCoVet.breadcrumbs as unknown[])
      : [];
    if (vun.length) {
      dong.push('### Các bước ngay trước khi lỗi');
      dong.push('');
      dong.push('```');
      for (const b of vun)
        dong.push(typeof b === 'string' ? b : JSON.stringify(b));
      dong.push('```');
      dong.push('');
    }

    if (lanCoStack?.stack) {
      dong.push(`## Stack trace (lần lúc ${dinhDangGio(lanCoStack.xayRaLuc)})`);
      dong.push('');
      dong.push('```');
      dong.push(lanCoStack.stack.slice(0, 4000));
      dong.push('```');
      dong.push('');
    }

    if (
      lanCoNguCanh?.nguCanh &&
      Object.keys(lanCoNguCanh.nguCanh as object).length
    ) {
      dong.push('## Ngữ cảnh (đã che dữ liệu nhạy cảm)');
      dong.push('');
      dong.push('```json');
      dong.push(JSON.stringify(lanCoNguCanh.nguCanh, null, 2).slice(0, 2000));
      dong.push('```');
      dong.push('');
    }

    if (fileLienQuan.length) {
      dong.push('## Chỗ đáng mở ra xem (GỢI Ý, chưa kiểm chứng)');
      dong.push('');
      for (const f of fileLienQuan) dong.push(`- \`${f}\``);
      dong.push('');
    }

    dong.push('## Việc cần làm');
    dong.push('');
    dong.push(
      '1. Đọc các file trên, tìm nguyên nhân THẬT — đừng vá triệu chứng.',
    );
    dong.push('2. Viết một test tái hiện được lỗi này TRƯỚC khi sửa.');
    dong.push(
      '3. Sửa, rồi chạy `npm test --prefix backend` và `npm run type-check --prefix frontend`.',
    );
    dong.push('');
    dong.push('### Coi là đã sửa khi');
    dong.push('');
    dong.push(`- Test tái hiện chuyển từ đỏ sang xanh.`);
    dong.push(
      `- Thao tác ở \`${cum.routeChuan}\` chạy trọn vẹn với vai trò ${ganNhat?.vaiTroNguoiDung || 'tương ứng'}.`,
    );
    dong.push(
      `- Vân tay \`${cum.vanTay}\` không xuất hiện lại trong 7 ngày (tab Góp Ý & Lỗi sẽ tự báo nếu tái phát).`,
    );
    if (cum.ghiChu) {
      dong.push('');
      dong.push(`### Ghi chú của người xử lý`);
      dong.push('');
      dong.push(cum.ghiChu);
    }

    return dong.join('\n');
  }

  /** Lớp phủ tuỳ chọn: nhờ AI đoán nguyên nhân. Kết quả lưu lại để khỏi gọi lại tốn tiền. */
  async phanTichAi(
    id: number,
    lamLai = false,
  ): Promise<{ hoSoAi: string; luc: Date }> {
    const cum = await this.cumRepo.findOne({ where: { id } });
    if (!cum) throw new NotFoundException('Không tìm thấy cụm sự cố');
    if (cum.hoSoAi && !lamLai) {
      return { hoSoAi: cum.hoSoAi, luc: cum.hoSoAiLuc || cum.updatedAt };
    }

    const hoSo = await this.hoSoSuaLoi(id);
    const client = this.layClient();
    const model = this.config.get<string>('YESCALE_MODEL') || 'gpt-4o-mini';

    let phanHoi: OpenAI.Chat.Completions.ChatCompletion;
    try {
      phanHoi = await client.chat.completions.create({
        model,
        temperature: 0.2,
        max_tokens: 900,
        messages: [
          {
            role: 'system',
            content:
              'Bạn là kỹ sư đọc báo cáo lỗi của một phần mềm phòng chẩn trị Đông Y (NestJS + Vue 3, ' +
              'quy ước đặt tên tiếng Việt, routers/ chứa @Controller còn controllers/ chứa service). ' +
              'Trả lời NGẮN bằng tiếng Việt, đúng 3 mục: (1) Nguyên nhân khả dĩ nhất và VÌ SAO, ' +
              '(2) Chỗ cần kiểm tra trước, (3) Cách kiểm chứng giả thuyết. ' +
              'Không chắc thì nói thẳng là không chắc — đoán bừa làm người sửa mất thời gian hơn là không nói gì.',
          },
          { role: 'user', content: hoSo.slice(0, 12000) },
        ],
      });
    } catch (err: unknown) {
      // Không relay nguyên mã lỗi của nhà cung cấp: 401 của họ sẽ làm frontend tưởng hết phiên.
      const chiTietLoi = err as {
        error?: { message?: string };
        message?: string;
      };
      throw new ServiceUnavailableException(
        `Không gọi được AI: ${chiTietLoi?.error?.message || chiTietLoi?.message || 'lỗi không rõ'}`,
      );
    }

    const noiDung = phanHoi.choices?.[0]?.message?.content?.trim() || '';
    if (!noiDung)
      throw new ServiceUnavailableException('AI trả về nội dung rỗng');

    cum.hoSoAi = noiDung;
    cum.hoSoAiLuc = new Date();
    await this.cumRepo.save(cum);
    return { hoSoAi: noiDung, luc: cum.hoSoAiLuc };
  }

  private layClient(): OpenAI {
    const apiKey = this.config.get<string>('YESCALE_API_KEY');
    if (!apiKey)
      throw new ServiceUnavailableException('Chưa cấu hình YESCALE_API_KEY');
    if (!this.client) {
      this.client = new OpenAI({
        apiKey,
        baseURL:
          this.config.get<string>('YESCALE_BASE_URL') ||
          'https://api.yescale.io/v1',
      });
    }
    return this.client;
  }

  // ── Dọn dẹp ─────────────────────────────────────────────────────────────────────────

  /**
   * An toàn vì chỉ có MỘT tiến trình backend (Docker Compose). Chạy nhiều bản thì cron này
   * chạy song song nhiều lần — vô hại ở đây (chỉ xoá), nhưng đáng nhớ.
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async donDep(): Promise<void> {
    const moc = new Date(Date.now() - NGAY_GIU_CHI_TIET * 86_400_000);
    const xoaChiTiet = await this.suCoRepo.delete({ xayRaLuc: LessThan(moc) });

    const mocCum = new Date(Date.now() - NGAY_GIU_CUM_DA_DONG * 86_400_000);
    const xoaCum = await this.cumRepo
      .createQueryBuilder()
      .delete()
      .where('trang_thai IN (:...tt)', { tt: ['da_sua', 'bo_qua'] })
      .andWhere('lan_cuoi < :moc', { moc: mocCum })
      .execute();

    this.logger.log(
      `Dọn sự cố: xoá ${xoaChiTiet.affected ?? 0} lần xảy ra, ${xoaCum.affected ?? 0} cụm đã đóng`,
    );
  }

  /** Băm định danh người dùng. Muối là JWT_SECRET → đọc được DB cũng không đảo ngược được. */
  bamNguoiDung(id: string | number | null | undefined): string | null {
    if (id === null || id === undefined || id === '') return null;
    const muoi = process.env.JWT_SECRET || 'fallback_secret_key';
    return createHash('sha1')
      .update(`${muoi}|${id}`)
      .digest('hex')
      .slice(0, 16);
  }
}

/** Stack của lần gần nhất CÓ stack. Lần mới nhất rất hay là lần không kèm stack. */
function timStack(cacLan: SuCo[]): string | null {
  return cacLan.find((l) => !!l.stack)?.stack ?? null;
}

function nhanLoai(loai: LoaiSuCo): string {
  return (
    {
      loi_be: 'Lỗi máy chủ',
      loi_fe: 'Lỗi trình duyệt',
      gop_y: 'Góp ý người dùng',
      ux: 'Tín hiệu trải nghiệm',
    } as Record<LoaiSuCo, string>
  )[loai];
}

function dinhDangGio(d: Date | string): string {
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
}
