import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ThamDinhCmsService } from './tham-dinh-cms.service';
import { ThamDinhLlmService } from './tham-dinh-llm.service';
import { bocJson } from '../utils/tham-dinh-loi-phe.util';
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
}
