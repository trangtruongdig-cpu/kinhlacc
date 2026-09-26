import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ThamDinhCmsService } from './tham-dinh-cms.service';
import { ThamDinhLlmService } from './tham-dinh-llm.service';
import { Cron } from '@nestjs/schedule';

import { bocJson, locLoiPhe } from '../utils/tham-dinh-loi-phe.util';
import { xepHangDoi } from '../utils/tham-dinh-hang-doi.util';
import { apDungCho, type BoLuatVanPhong } from '../utils/tham-dinh-luat.util';
import type { LuocKeCaThayThuoc } from '../models/tham-dinh.dto';
import { LUAT_PHAM_VI_HANH_NGHE, type DieuLuat } from '../utils/tham-dinh-luat.util';

/**
 * Lớp 2 — thầy thuốc. Đọc hiểu bằng mô hình ngôn ngữ, phê KÈM TRÍCH DẪN, soạn bản sửa đề
 * xuất. Không tự ghi vào kho nội dung: mọi thay đổi phải qua nút duyệt (kế hoạch 3).
 */
@Injectable()
export class ThamDinhThayThuocService {
  private readonly logger = new Logger('ThamDinhThayThuoc');
  private dangChay = false;

  constructor(
    private readonly cms: ThamDinhCmsService,
    private readonly llm: ThamDinhLlmService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Mười mục viết đạt, lọc từ bệnh án lớp 1 (dày trên 800 ký tự, đủ phần, ít nhận xét máy
   * nhất) và trải đều năm bộ mà lớp 2 thật sự soi.
   *
   * KHÔNG lấy `bai_viet`: mười một bài đó là bài viết SEO dài, văn phong khác hẳn mục từ
   * điển, rút thước từ chúng thì bot đi phê mục huyệt bằng thước của bài blog.
   */
  static readonly MUC_MAU: Array<{ bo: string; slug: string; tieuDe: string }> = [
    { bo: 'huyet_vi', slug: 'quan-nguyen', tieuDe: 'Quan Nguyên' },
    { bo: 'huyet_vi', slug: 'bach-hoi', tieuDe: 'Bách Hội' },
    { bo: 'huyet_vi', slug: 'trung-cuc', tieuDe: 'Trung Cực' },
    { bo: 'benh_hoc', slug: 'huyet-ap-thap', tieuDe: 'Huyết Áp Thấp' },
    { bo: 'benh_hoc', slug: 'kinh-nguyet-den-khong-dung-ky', tieuDe: 'Kinh Nguyệt Đến Không Đúng Kỳ' },
    { bo: 'cham_cuu_tri_benh', slug: 'viem-gan-sieu-vi', tieuDe: 'Viêm Gan Siêu Vi' },
    { bo: 'cham_cuu_tri_benh', slug: 'loang-xuong', tieuDe: 'Loãng Xương' },
    { bo: 'duoc_lieu', slug: '80', tieuDe: 'Quy Bản' },
    { bo: 'duoc_lieu', slug: '101', tieuDe: 'Tiền Hồ' },
    { bo: 'kinh_mach', slug: 'dai-truong', tieuDe: 'Kinh Thủ Dương Minh Đại Trường' },
  ];

  loiNhacLapThuoc(): string {
    return [
      'Bạn đọc một số mục từ điển Đông y do chính chủ biên soạn và cho là VIẾT ĐẠT.',
      'Việc của bạn: rút ra bộ luật văn phong mô tả CÁCH HỌ ĐÃ VIẾT, để về sau đem đo các mục khác.',
      '',
      'Luật cứng:',
      '- Chỉ mô tả cái QUAN SÁT ĐƯỢC trong các mục mẫu. Không thêm, không bịa quy tắc từ trí nhớ của bạn',
      '  về "văn phong y học chuẩn". Nếu mẫu không cho thấy điều gì thì không có điều luật đó.',
      '- Mỗi điều luật phải kèm một ví dụ TRÍCH nguyên văn từ chính mục mẫu.',
      '- Viết bằng tiếng Việt.',
      '- 8 đến 15 điều là vừa. Ít hơn thì thước quá thô, nhiều hơn thì không ai duyệt nổi.',
      '',
      'Bốn trục, dùng đúng các mã này cho khoá "truc":',
      '  bo_cuc    — thứ tự các phần, mục nào mở đầu bằng gì, phần nào bắt buộc có',
      '  thuat_ngu — cách gọi tên khái niệm, viết hoa, cách dẫn tên huyệt/vị/sách',
      '  cau_chu   — độ dài câu, lối xưng hô, cách dùng dấu, cách ghi liều và đơn vị',
      '  pham_vi_hanh_nghe — chữ được dùng và chữ phải tránh khi nói về việc đo và điều trị',
      '',
      'Mã điều luật: hai chữ cái đầu của trục + số thứ tự, vd BC1, TN1, CC1, PV1.',
      '',
      'Trả về ĐÚNG một mảng JSON, không kèm lời dẫn, không bọc trong khối mã:',
      '[{"ma":"BC1","truc":"bo_cuc","noiDung":"...","viDu":"..."}]',
    ].join('\n');
  }

  async lapThuoc(): Promise<{ phienBan: number | null; soDieu: number; loi: string[] }> {
    const loi: string[] = [];
    if (!this.cms.daCauHinh()) {
      loi.push('Chưa cấu hình CMS_DB_* — bot nằm im.');
      return { phienBan: null, soDieu: 0, loi };
    }
    if (!this.llm.daCauHinh()) {
      loi.push('Chưa cấu hình YESCALE_API_KEY — bot nằm im.');
      return { phienBan: null, soDieu: 0, loi };
    }

    this.llm.moCa();
    try {
      await this.cms.moKetNoi();
      await this.cms.dungBang();

      const khung = await this.cms.docCauHinhBo();
      const phan: string[] = [];

      for (const m of ThamDinhThayThuocService.MUC_MAU) {
        const bo = khung.find((k) => k.bo === m.bo);
        if (!bo) {
          loi.push(`Không có cấu hình bộ "${m.bo}"`);
          continue;
        }
        const ma = await this.cms.maTuSlug(m.bo, m.slug);
        if (!ma) {
          loi.push(`Không tìm thấy mục ${m.bo}/${m.slug}`);
          continue;
        }
        const than = await this.cms.docThanBai(m.bo, ma, bo.than);
        const chu = Object.entries(than)
          .filter(([, v]) => v.trim())
          .map(([k, v]) => `### ${k}\n${v}`)
          .join('\n\n');
        phan.push(`## [${m.bo}] ${m.tieuDe}\n\n${chu}`);
      }

      if (!phan.length) {
        loi.push('Không đọc được mục mẫu nào.');
        return { phienBan: null, soDieu: 0, loi };
      }

      // Lập thước là việc làm MỘT LẦN và chi phối mọi lời phê về sau — luôn dùng tầng đọc kỹ.
      const traLoi = await this.llm.goi(this.loiNhacLapThuoc(), phan.join('\n\n---\n\n'), true);
      if (!traLoi) {
        loi.push('Mô hình không trả lời.');
        return { phienBan: null, soDieu: 0, loi };
      }

      const tho = bocJson(traLoi);
      if (!Array.isArray(tho)) {
        loi.push('Phản hồi không phải mảng JSON.');
        return { phienBan: null, soDieu: 0, loi };
      }

      const TRUC_HOP_LE = new Set(['bo_cuc', 'thuat_ngu', 'cau_chu', 'pham_vi_hanh_nghe']);
      const dieu: DieuLuat[] = [];
      for (const x of tho as Array<Record<string, unknown>>) {
        const ma = typeof x?.ma === 'string' ? x.ma.trim().toUpperCase() : '';
        const truc = typeof x?.truc === 'string' ? x.truc.trim() : '';
        const noiDung = typeof x?.noiDung === 'string' ? x.noiDung.trim() : '';
        if (!ma || !TRUC_HOP_LE.has(truc) || !noiDung) continue;
        if (dieu.some((d) => d.ma === ma)) continue;
        dieu.push({
          ma,
          truc: truc as DieuLuat['truc'],
          noiDung: noiDung.slice(0, 600),
          viDu: (typeof x?.viDu === 'string' ? x.viDu : '').trim().slice(0, 600),
        });
      }

      // Luật cứng luôn có mặt, bất kể mô hình có rút ra được hay không. Người duyệt gỡ
      // các điều khác được, riêng điều này thì không.
      if (!dieu.some((d) => d.ma === LUAT_PHAM_VI_HANH_NGHE.ma)) {
        dieu.unshift(LUAT_PHAM_VI_HANH_NGHE);
      }

      const phienBan = await this.cms.luuBoLuat({
        phienBan: 0,
        boApDung: [...new Set(ThamDinhThayThuocService.MUC_MAU.map((m) => m.bo))],
        dieu,
        daDuyet: false,
      });

      this.logger.log(`lập thước xong: bản ${phienBan}, ${dieu.length} điều, CHỜ DUYỆT`);
      return { phienBan, soDieu: dieu.length, loi };
    } catch (e) {
      loi.push((e as Error).message);
      return { phienBan: null, soDieu: 0, loi };
    } finally {
      await this.cms.dongKetNoi();
    }
  }

  // ══ Ca soi lớp 2 ═════════════════════════════════════════════════════════════════

  loiNhacSoi(luat: BoLuatVanPhong): string {
    const bang = luat.dieu
      .map((d) => `  [${d.ma}] (${d.truc}) ${d.noiDung}${d.viDu ? ` — vd: "${d.viDu}"` : ''}`)
      .join('\n');

    return [
      'Bạn là biên tập viên của một thư viện từ điển Đông y tiếng Việt. Bạn KHÔNG phải tác giả.',
      '',
      'BỘ LUẬT VĂN PHONG (bản ' + luat.phienBan + ') — thước đo duy nhất:',
      bang,
      '',
      'Bốn luật cứng:',
      '1. Mỗi lời phê PHẢI kèm "trichDan" là NGUYÊN VĂN một đoạn có thật trong bài dưới đây.',
      '   Hệ thống đối chiếu từng chữ; trích dẫn không khớp thì lời phê bị LOẠI, không ai đọc.',
      '   Chép đúng, đừng tóm tắt lại, đừng sửa chính tả trong lúc chép.',
      '2. Chỉ dùng chữ CÓ TRONG BÀI hoặc trong phần "nền tham khảo". Không được thêm sự kiện y',
      '   học từ trí nhớ của bạn — đó là bậc 2 và bị CẤM, kể cả khi bạn dẫn được tên sách.',
      '3. Thiếu căn cứ để sửa thì ghi "cần người bổ sung" trong "nhanXet" và bỏ trống "deXuat".',
      '   Nói thẳng là không đủ căn cứ tốt hơn nhiều so với đoán.',
      '4. Lời phê về văn phong phải trỏ "dieuLuat" về một mã trong bộ luật trên. Không trỏ về',
      '   được điều nào thì đó không phải lỗi — đừng phê.',
      '',
      'Ba trục cần soi:',
      '  · Mạch lạc y văn — bố cục, câu cụt, câu mất chủ ngữ, đoạn lặp ý',
      '  · Nhất quán thuật ngữ — cùng khái niệm gọi hai tên trong một bài; xưng hô lẫn lộn;',
      '    phạm vi hành nghề (khám→đo, phòng khám→phòng chẩn trị, bác sĩ→thầy thuốc)',
      '  · Y lý tự mâu thuẫn — chủ trị nói chứng hàn mà phối huyệt toàn tả nhiệt; liều ở',
      '    thành phần lệch liều ở cách dùng',
      '',
      'Trả về ĐÚNG một mảng JSON, không lời dẫn, không bọc khối mã. Không thấy vấn đề gì thì [].',
      '[{"truong":"vi_tri","kieu":"cau_cut","trichDan":"…","nhanXet":"…","deXuat":"…",',
      ' "bacCanCu":1,"dieuLuat":"BC1"}]',
      '',
      '"kieu" là mã ngắn không dấu bạn tự đặt, dùng lại nhất quán giữa các bài: cau_cut,',
      'lap_y, thuat_ngu_lech, thieu_dinh_vi, mau_thuan_y_ly, pham_vi_hanh_nghe, bo_cuc_lech.',
      '"bacCanCu": 1 nếu bản sửa dựng từ chữ đã có; bỏ trống nếu chỉ nêu vấn đề.',
      'Tối đa 8 lời phê một bài — chọn cái đáng sửa nhất, đừng liệt kê cho đủ.',
    ].join('\n');
  }

  dungNoiDungSoi(
    m: { bo: string; tieuDe: string },
    than: Record<string, string>,
    chum: Array<{ bo: string; tieuDe: string; tomTat: string }>,
  ): string {
    const phan = Object.entries(than)
      .filter(([, v]) => v && v.trim())
      .map(([k, v]) => `### ${k}\n${v}`)
      .join('\n\n');

    const nen = chum.length
      ? '\n\n---\n## Nền tham khảo — các mục KHÁC trong kho có nhắc tới mục này.\n' +
        'Đây KHÔNG phải bài đang soi; dùng để bắt mâu thuẫn bắc cầu và để lấy chữ cho bản sửa bậc 1.\n\n' +
        chum.map((c) => `- [${c.bo}] ${c.tieuDe}: ${c.tomTat}`).join('\n')
      : '';

    return `# [${m.bo}] ${m.tieuDe}\n\n${phan}${nen}`;
  }

  /** 03:00 mỗi ngày — sau lớp 1 (02:00), trước khâu kết tinh (06:00). */
  @Cron('0 3 * * *')
  async caDemThayThuoc(): Promise<void> {
    await this.chayCaThayThuoc();
  }

  async chayCaThayThuoc(gioiHan = 0): Promise<LuocKeCaThayThuoc> {
    const lk: LuocKeCaThayThuoc = {
      batDau: new Date().toISOString(), ketThuc: '', soMucSoi: 0, soMucConLai: 0,
      soLoiPheNhan: 0, soLoiPheLoai: 0, soLuotGoiModel: 0, chamTran: false,
      lyDoLoai: [], loi: [],
    };
    const xong = () => {
      lk.ketThuc = new Date().toISOString();
      return lk;
    };

    if (!this.cms.daCauHinh() || !this.llm.daCauHinh()) {
      lk.loi.push('Chưa cấu hình CMS_DB_* hoặc YESCALE_API_KEY — bot nằm im.');
      return xong();
    }
    if (this.dangChay) {
      lk.loi.push('Đang có một ca chạy dở.');
      return xong();
    }
    this.dangChay = true;
    this.llm.moCa();

    const demLyDo = new Map<string, number>();

    try {
      await this.cms.moKetNoi();
      await this.cms.dungBang();

      const luat = await this.cms.docBoLuat(true);
      if (!luat) {
        lk.loi.push('Chưa có bộ luật văn phong ĐÃ DUYỆT — lập thước và duyệt trước đã.');
        return xong();
      }

      const moiCa = gioiHan || this.soTuCauHinh('THAM_DINH_MOI_CA', 100);
      const soMucKy = this.soTuCauHinh('THAM_DINH_SO_MUC_KY', 50);

      // Lọc theo thước TRƯỚC khi xếp: mục ngoài phạm vi bộ luật mà lọt vào hàng đợi thì
      // nó chiếm một suất rồi bị bỏ qua, và suất đó mất trắng.
      const ungVien = (await this.cms.docUngVienSoi()).filter((u) => apDungCho(luat, u.bo));
      const hangDoi = xepHangDoi(ungVien, moiCa);
      const khung = await this.cms.docCauHinhBo();

      for (const [i, u] of hangDoi.entries()) {
        if (!this.llm.conHanMuc()) {
          lk.chamTran = true;
          lk.soMucConLai = hangDoi.length - i;
          break;
        }

        const bo = khung.find((k) => k.bo === u.bo);
        if (!bo) continue;

        const than = await this.cms.docThanBai(u.bo, u.ma, bo.than);
        if (!Object.values(than).some((v) => v.trim())) continue;

        const chum = await this.cms.docChumLienQuan(u.tieuDe, u.bo, u.ma);
        const traLoi = await this.llm.goi(
          this.loiNhacSoi(luat),
          this.dungNoiDungSoi(u, than, chum),
          i < soMucKy,
        );
        lk.soMucSoi += 1;
        if (!traLoi) continue;

        const loc = locLoiPhe(bocJson(traLoi), than, luat);
        for (const x of loc.loai) demLyDo.set(x.lyDo, (demLyDo.get(x.lyDo) || 0) + 1);
        lk.soLoiPheNhan += loc.nhan.length;
        lk.soLoiPheLoai += loc.loai.length;

        // Ghi CẢ KHI rỗng: đóng van vân tay để đêm mai không đọc lại mục này.
        await this.cms.ghiLoiPheThayThuoc(u.bo, u.ma, u.vanTayNoiDung, loc.nhan);
      }
    } catch (e) {
      lk.loi.push((e as Error).message);
      this.logger.error(`ca thầy thuốc hỏng: ${(e as Error).message}`);
    } finally {
      await this.cms.dongKetNoi();
      this.dangChay = false;
    }

    lk.soLuotGoiModel = this.llm.soLuotDaGoi();
    lk.lyDoLoai = [...demLyDo.entries()]
      .map(([lyDo, soLan]) => ({ lyDo, soLan }))
      .sort((a, b) => b.soLan - a.soLan)
      .slice(0, 3);

    this.logger.log(
      `ca thầy thuốc xong: ${lk.soMucSoi} mục · nhận ${lk.soLoiPheNhan} / loại ${lk.soLoiPheLoai} ` +
        `· ${lk.soLuotGoiModel} lượt gọi${lk.chamTran ? ' · CHẠM TRẦN' : ''}`,
    );
    return xong();
  }

  private soTuCauHinh(ten: string, macDinh: number): number {
    const n = Number(this.config.get<string>(ten));
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : macDinh;
  }
}
