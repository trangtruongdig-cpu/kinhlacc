import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';

import { ThamDinhCmsService } from './tham-dinh-cms.service';
import { SuCoService } from './su-co.controller';
import { doMuc, dungChiMucTen, doLienKet } from '../utils/tham-dinh-muc.util';
import { gomCum, vanTayNoiDung, type CumViec, type NhanXetCoMuc } from '../utils/tham-dinh-cum.util';
import { chiKhacHinhThuc } from '../utils/tham-dinh-sua-hinh-thuc.util';
import type { HangHoSo, HoSoMuc, LuocKeCa, LuocKeTuSua } from '../models/tham-dinh.dto';

const LO = 200;

/**
 * Nghỉ giữa hai lô, tính bằng mili giây.
 *
 * ⚠️ Không phải để chiều máy chủ — để KHÔNG GIÀNH backend với người đang xem web. Đo thật
 * 30/09/2026: trong lúc ca soi chạy, `/demo/bai-thuoc/50` treo 12 giây rồi đứt; ngay sau
 * khi ca xong, chính nó trả 200 trong 10 mili giây.
 *
 * Tab Góp Ý & Lỗi ghi lại hậu quả bằng con số: 172 lần "failed to fetch" và 27 lần lỗi
 * 500 trên các trang `/demo/*` — tức khách vào trang giới thiệu đúng lúc bot làm việc thì
 * thấy trang hỏng. Ca soi chạy 20 phút mỗi đêm; thêm 92 nhịp nghỉ 120ms chỉ tốn 11 giây.
 */
const NGHI_GIUA_LO_MS = 120;

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
          // ⚠️ Một lô hỏng KHÔNG được giết cả ca. Đo thật trên production 29/09/2026: ca
          // máy quét ghi xong lô 200 mục đầu rồi chết với "Query read timeout" — 18.216
          // mục còn lại không được đọc, và lược kê chỉ nói "200 mục" như thể đó là toàn
          // bộ việc. Kết nối tới Aiven chập là chuyện sẽ còn xảy ra; ca soi phải sống
          // qua được.
          try {
            await this.cms.ghiHoSoLo(canGhi);
            // Nhường một nhịp cho request của người dùng thật.
            await new Promise((r) => setTimeout(r, NGHI_GIUA_LO_MS));
          } catch (e) {
            lk.soMucBoQua += canGhi.length;
            lk.soMucDoc -= canGhi.length;
            lk.loi.push(`lô tại ${bo.bo}+${tu}: ${(e as Error).message}`);
            // Kết nối có thể đã chết; moKetNoi tự ping và mở lại nếu cần.
            try {
              await this.cms.moKetNoi();
            } catch {
              lk.loi.push('không mở lại được kết nối — dừng ca.');
              throw e;
            }
          }
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

    // Ghi nhật ký SAU khi đã đóng kết nối ở finally, nên phải mở lại một nhịp. Đổi lại,
    // nhật ký ghi được cả những ca hỏng giữa chừng — vốn là loại ca đáng ghi nhất.
    try {
      await this.cms.moKetNoi();
      await this.cms.ghiCaSoi({
        lop: 'may',
        batDau: lk.batDau,
        ketThuc: lk.ketThuc,
        soMuc: lk.soMucDoc,
        soPhatHien: lk.soNhanXet,
        soLieu: { soCum: lk.soCum, soCumNop: lk.soCumNop, soMucBoQua: lk.soMucBoQua },
        loi: lk.loi,
      });
    } catch {
      /* nhật ký hỏng không được làm hỏng ca */
    } finally {
      await this.cms.dongKetNoi();
    }

    this.logger.log(
      `ca soi xong: ${lk.soMucDoc} mục · ${lk.soNhanXet} nhận xét · ${lk.soCumNop}/${lk.soCum} cụm`,
    );
    return lk;
  }

  // ══ Tự sửa lỗi HÌNH THỨC ═════════════════════════════════════════════════════════

  /**
   * Kiểu lỗi được phép tự sửa. Danh sách này CỐ Ý chỉ có một dòng.
   *
   * Rác mã hoá (mojibake, tcvn3, dấu thanh hỏng) KHÔNG nằm đây dù cũng là "lỗi chữ":
   * máy biết chữ đó hỏng nhưng không biết chữ đúng là gì, đoán là hỏng thêm. Chúng chỉ
   * có 21 chỗ trong cả kho — sửa tay nhanh hơn viết luật đoán.
   */
  private static readonly KIEU_TU_SUA = ['dau_cau_sai'];

  /** 04:00 mỗi ngày — sau lớp 1 (02:00) và lớp 2 (03:00), trước khâu báo cáo. */
  @Cron('0 4 * * *')
  async caDemTuSua(): Promise<void> {
    await this.tuSuaHinhThuc(false);
  }

  /**
   * Tự sửa lỗi hình thức trong kho. Đây là chỗ DUY NHẤT bot đổi nội dung mà không có
   * người bấm, nên nó có ba lớp chặn, và cả ba đều phải qua:
   *
   *   1. Chỉ kiểu lỗi trong `KIEU_TU_SUA` — hiện chỉ có lỗi dấu câu.
   *   2. Bản sửa phải do máy sinh bằng luật (`suaHinhThuc`), không phải do mô hình viết.
   *   3. `chiKhacHinhThuc` — bỏ hết khoảng trắng và dấu câu khỏi hai bản thì phần chữ
   *      còn lại phải GIỐNG HỆT. Khác một chữ là chặn.
   *
   * Lớp 3 là lớp chịu lực. Lúc bàn chuyện cho bot tự sửa, phép dò dấu câu đang vu oan
   * 2.604 lượt; không có lớp đó thì 2.604 chỗ viết đúng đã bị sửa thành sai.
   *
   * `thu = true` (mặc định của endpoint) chỉ in ra chứ không ghi.
   */
  async tuSuaHinhThuc(thu = true, gioiHan = 200): Promise<LuocKeTuSua> {
    const lk: LuocKeTuSua = {
      thu, soXet: 0, soApDuoc: 0, soChan: 0, soHong: 0, viDu: [], lyDoChan: [], loi: [],
    };
    if (!this.cms.daCauHinh()) {
      lk.loi.push('Chưa cấu hình CMS_DB_* — bot nằm im.');
      return lk;
    }

    const demChan = new Map<string, number>();
    try {
      await this.cms.moKetNoi();
      await this.cms.dungBang();

      const ds = await this.cms.docNhanXetTuSuaDuoc(
        ThamDinhService.KIEU_TU_SUA,
        Math.min(Math.max(gioiHan, 1), 2000),
      );
      lk.soXet = ds.length;

      for (const x of ds) {
        // Lớp chặn cuối, kiểm LẠI ngay trước khi ghi. Bản sửa đã qua phép này lúc sinh,
        // nhưng giữa hai thời điểm có thể có người sửa tay bài — kiểm lại thì rẻ.
        if (!chiKhacHinhThuc(x.trichDan, x.deXuat)) {
          lk.soChan += 1;
          demChan.set('bản sửa đụng vào chữ, không chỉ hình thức',
            (demChan.get('bản sửa đụng vào chữ, không chỉ hình thức') || 0) + 1);
          continue;
        }

        if (lk.viDu.length < 10) {
          lk.viDu.push({ tieuDe: x.tieuDe, truoc: x.trichDan.slice(0, 120), sau: x.deXuat.slice(0, 120) });
        }

        if (thu) {
          lk.soApDuoc += 1;
          continue;
        }

        const r = await this.cms.apBanSua(x.id, 'bot-tu-sua');
        if (r.ok) {
          lk.soApDuoc += 1;
        } else {
          lk.soHong += 1;
          const ly = r.lyDo || 'không rõ';
          demChan.set(ly, (demChan.get(ly) || 0) + 1);
        }
      }
    } catch (e) {
      lk.loi.push((e as Error).message);
    } finally {
      await this.cms.dongKetNoi();
    }

    lk.lyDoChan = [...demChan.entries()]
      .map(([lyDo, soLan]) => ({ lyDo, soLan }))
      .sort((a, b) => b.soLan - a.soLan)
      .slice(0, 5);

    this.logger.log(
      `tự sửa hình thức${thu ? ' (THỬ)' : ''}: xét ${lk.soXet} · ` +
        `${thu ? 'sẽ sửa' : 'đã sửa'} ${lk.soApDuoc} · chặn ${lk.soChan} · hỏng ${lk.soHong}`,
    );
    return lk;
  }
}
