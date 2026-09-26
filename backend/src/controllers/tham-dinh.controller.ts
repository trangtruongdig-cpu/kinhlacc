import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';

import { ThamDinhCmsService } from './tham-dinh-cms.service';
import { SuCoService } from './su-co.controller';
import { doMuc, dungChiMucTen, doLienKet } from '../utils/tham-dinh-muc.util';
import { gomCum, vanTayNoiDung, type CumViec, type NhanXetCoMuc } from '../utils/tham-dinh-cum.util';
import type { HangHoSo, HoSoMuc, LuocKeCa } from '../models/tham-dinh.dto';

const LO = 200;

/**
 * Trần của `SuCoService.ghiNhanLo`: nó chỉ xử lý `danhSach.slice(0, 50)`, phần dư rơi
 * lặng lẽ — không lỗi, không đếm. Nên bên này phải tự chia lô.
 */
const LO_NOP_CUM = 50;

/**
 * Lớp 1 — máy quét. Đọc toàn kho, ghi bệnh án, gom cụm việc, nộp vào tab "Góp Ý & Lỗi".
 * KHÔNG gọi mô hình ngôn ngữ lần nào; chạy hết 18.416 mục trong vài phút.
 */
@Injectable()
export class ThamDinhService {
  private readonly logger = new Logger('ThamDinh');
  private dangChay = false;

  constructor(
    private readonly cms: ThamDinhCmsService,
    private readonly suCo: SuCoService,
    private readonly config: ConfigService,
  ) {}

  /** 02:00 mỗi ngày — giờ vắng, để không tranh kết nối Postgres với người đọc. */
  @Cron('0 2 * * *')
  async caDem(): Promise<void> {
    await this.chayCa();
  }

  xepHangHoSo(soNang: number, soNhanXet: number, _doDay: number): HangHoSo {
    if (soNang > 0) return 'hong';
    if (soNhanXet >= 5) return 'yeu';
    if (soNhanXet > 0) return 'tam_duoc';
    return 'tot';
  }

  /** Nộp cụm việc sang tab "Góp Ý & Lỗi", chia lô để không chạm trần của ghiNhanLo. */
  async nopCum(cum: CumViec[]): Promise<number> {
    let nhan = 0;
    for (let i = 0; i < cum.length; i += LO_NOP_CUM) {
      const me = cum.slice(i, i + LO_NOP_CUM);
      const r = await this.suCo.ghiNhanLo(
        me.map((c) => ({
          loai: 'gop_y' as const,
          route: c.route,
          thongDiep: c.thongDiep,
          chanThaoTac: c.nang,
          moTaNguoiDung:
            `${c.moTa}\n${c.slugs.map((s) => `${c.route}${s}/`).join('\n')}`.slice(0, 20000),
          nguCanh: { nguon: 'tham-dinh', kieu: c.kieu, bo: c.bo, soMuc: c.soMuc },
        })),
        { ipRutGon: null, vaiTro: 'bot', nguoiDungHash: null },
      );
      nhan += r.nhan;
    }
    return nhan;
  }

  async chayCa(gioiHan = 0): Promise<LuocKeCa> {
    const lk: LuocKeCa = {
      batDau: new Date().toISOString(), ketThuc: '', soMucDoc: 0, soMucBoQua: 0,
      soNhanXet: 0, soCum: 0, soCumNop: 0, loi: [],
    };

    if (!this.cms.daCauHinh()) {
      lk.loi.push('Chưa cấu hình CMS_DB_* — bot nằm im.');
      lk.ketThuc = new Date().toISOString();
      return lk;
    }
    if (this.dangChay) {
      lk.loi.push('Đang có một ca chạy dở.');
      lk.ketThuc = new Date().toISOString();
      return lk;
    }
    this.dangChay = true;

    const tatCaNhanXet: NhanXetCoMuc[] = [];
    const duongDanBo: Record<string, string> = {};

    try {
      await this.cms.moKetNoi();
      await this.cms.dungBang();

      // Dựng MỘT LẦN cho cả ca: 18.416 tên, nạp lại mỗi mục là 18.416 lượt truy vấn.
      const chiMucTen = dungChiMucTen(await this.cms.docTenMuc());

      for (const bo of await this.cms.docCauHinhBo()) {
        duongDanBo[bo.bo] = bo.duongDan;
        let tu = 0;
        for (;;) {
          const lo = await this.cms.docLoMuc(bo.bo, bo.than, tu, LO);
          if (!lo.length) break;

          // Soi cả lô trong bộ nhớ trước, rồi ghi MỘT LẦN. Ghi lẻ từng mục tốn 8 lượt
          // đi-về × 88ms — ba tiếng cho cả kho.
          const canGhi: Array<{ hoSo: HoSoMuc; nhanXet: NhanXetCoMuc[] }> = [];
          for (const m of lo) {
            const nx = [...doMuc(m), ...doLienKet(m, chiMucTen)];
            const nang = nx.filter((x) => x.nang).length;
            const coMuc = nx.map((n) => ({ ...n, bo: m.bo, slug: m.slug, tieuDe: m.tieuDe }));
            canGhi.push({
              hoSo: {
                bo: m.bo, ma: m.ma, slug: m.slug, tieuDe: m.tieuDe,
                vanTayNoiDung: vanTayNoiDung(m.truong, bo.than),
                diemSach: Math.max(0, 100 - nx.length * 10),
                diemMachLac: null,
                diemDuPhan: Math.round(
                  (bo.than.filter((t) => (m.truong[t] || '').trim()).length / (bo.than.length || 1)) * 100,
                ),
                diemLienKet: null, diemSeo: null,
                hang: this.xepHangHoSo(nang, nx.length, 0),
                uuTien: nang * 100 + nx.length,
                soiMayLuc: null, soiThayThuocLuc: null, soiSeoLuc: null,
              },
              nhanXet: coMuc,
            });
            tatCaNhanXet.push(...coMuc);
            lk.soMucDoc++;
            if (gioiHan && lk.soMucDoc >= gioiHan) break;
          }
          await this.cms.ghiHoSoLo(canGhi);
          if (gioiHan && lk.soMucDoc >= gioiHan) break;
          tu += LO;
        }
        if (gioiHan && lk.soMucDoc >= gioiHan) break;
      }
    } catch (e) {
      lk.loi.push((e as Error).message);
      this.logger.error(`ca soi hỏng: ${(e as Error).message}`);
    } finally {
      await this.cms.dongKetNoi();
      this.dangChay = false;
    }

    lk.soNhanXet = tatCaNhanXet.length;
    const cum = gomCum(tatCaNhanXet, duongDanBo);
    lk.soCum = cum.length;

    try {
      lk.soCumNop = await this.nopCum(cum);
    } catch (e) {
      lk.loi.push(`Nộp cụm hỏng: ${(e as Error).message}`);
    }

    lk.ketThuc = new Date().toISOString();
    this.logger.log(
      `ca soi xong: ${lk.soMucDoc} mục · ${lk.soNhanXet} nhận xét · ${lk.soCumNop}/${lk.soCum} cụm`,
    );
    return lk;
  }
}
