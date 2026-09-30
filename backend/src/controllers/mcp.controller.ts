import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ThamDinhService } from './tham-dinh.controller';
import { ThamDinhCmsService } from './tham-dinh-cms.service';
import { SuCoService } from './su-co.controller';

/**
 * Máy chủ MCP cho claude.ai — để hỏi bot và sai bot từ điện thoại.
 *
 * ⚠️ RANH GIỚI ĐÃ CHỐT (30/09/2026): công cụ ở đây chỉ ĐỌC và CHẠY CA. Không có công cụ
 * nào ghi vào kho nội dung. Việc áp bản sửa vẫn phải qua web app, nơi người duyệt nhìn
 * thấy bản gốc và bản sửa cạnh nhau.
 *
 * Lý do giữ ranh giới đó cụ thể chứ không phải nguyên tắc suông: đây là đường mà một dịch
 * vụ BÊN NGOÀI gọi vào, qua một URL nằm trên internet công khai. Chạy ca soi sai thì cùng
 * lắm tốn ít thời gian máy; ghi sai vào 18.416 mục từ điển thì phải lần từng bản `revisions`.
 */
@Injectable()
export class McpService {
  private readonly logger = new Logger('Mcp');

  constructor(
    private readonly config: ConfigService,
    private readonly thamDinh: ThamDinhService,
    private readonly cms: ThamDinhCmsService,
    private readonly suCo: SuCoService,
  ) {}

  /** Token bí mật nằm trong đường dẫn. Thiếu cấu hình thì cửa ĐÓNG, không mở toang. */
  kiemToken(token: string): boolean {
    const that = this.config.get<string>('MCP_TOKEN');
    if (!that || that.trim().length < 32) return false;
    // So sánh độ dài trước rồi từng ký tự, tránh rò rỉ qua thời gian phản hồi.
    if (!token || token.length !== that.length) return false;
    let khac = 0;
    for (let i = 0; i < that.length; i++) khac |= that.charCodeAt(i) ^ token.charCodeAt(i);
    return khac === 0;
  }

  daCauHinh(): boolean {
    const t = this.config.get<string>('MCP_TOKEN');
    return typeof t === 'string' && t.trim().length >= 32;
  }

  // ── Các công cụ ────────────────────────────────────────────────────────────────────

  async nhatKyBot(): Promise<string> {
    await this.cms.moKetNoi();
    try {
      await this.cms.dungBang();
      const n = await this.cms.docNhatKy();
      const dong = (n.caGanNhat as Array<Record<string, unknown>>).map((c) => {
        const loi = Array.isArray(c.loi) && c.loi.length ? ` · LỖI: ${(c.loi as string[])[0]}` : '';
        return `- ${c.lop === 'may' ? 'Máy quét' : 'Thầy thuốc'}: đọc ${c.so_muc} mục, ` +
          `tìm ra ${c.so_phat_hien} (${c.bat_dau})${loi}`;
      });
      return [
        '# Bot thẩm định làm gì gần đây',
        ...dong,
        '',
        `- Lời phê thầy thuốc chờ duyệt: ${n.choDuyet} (trong đó ${n.coBanSua} có bản sửa sẵn)`,
        `- Đã áp vào kho: ${n.daAp}`,
        `- Máy quét còn phát hiện: ${n.mayPhatHien}`,
        n.boLuat
          ? `- Bộ luật văn phong bản ${n.boLuat.phienBan}${n.boLuat.daDuyet ? ' (đã duyệt)' : ' — CHƯA DUYỆT, lớp thầy thuốc đang nằm im'}`
          : '- Chưa có bộ luật văn phong',
      ].join('\n');
    } finally {
      await this.cms.dongKetNoi();
    }
  }

  async loiPheChoDuyet(soLuong: number): Promise<string> {
    await this.cms.moKetNoi();
    try {
      await this.cms.dungBang();
      const r = await this.cms.docNhanXetDeDuyet({ trangThai: 'moi', moiTrang: soLuong });
      const ds = r.danhSach as Array<Record<string, unknown>>;
      if (!ds.length) return 'Không có lời phê nào chờ duyệt.';
      return [
        `# ${r.tong} lời phê chờ duyệt (hiện ${ds.length})`,
        ...ds.map((x) =>
          [
            `\n## [${x.bo}] ${x.tieu_de} — ${x.kieu} · trường ${x.truong}`,
            `PHÊ: ${x.nhan_xet}`,
            `TRÍCH: ${String(x.trich_dan).slice(0, 300)}`,
            x.de_xuat ? `SỬA: ${String(x.de_xuat).slice(0, 300)}` : 'SỬA: (không đề xuất)',
          ].join('\n'),
        ),
        '\n---\nÁp bản sửa vào kho thì mở /app/tham-dinh — MCP này cố ý không ghi vào kho.',
      ].join('\n');
    } finally {
      await this.cms.dongKetNoi();
    }
  }

  /**
   * Cụm lỗi phần mềm, GOM THEO NGUYÊN NHÂN.
   *
   * Gom là phần đáng giá nhất: 1.486 cụm nhìn như 1.486 việc, quy về nguyên nhân thì còn
   * sáu nhóm, và ba nhóm lớn nhất thường cùng một gốc.
   */
  async nhomLoiPhanMem(): Promise<string> {
    const { danhSach: ds, tong } = await this.suCo.danhSachCum({
      lane: 'loi',
      trangThai: 'dang_mo',
      moiTrang: 100,
    });

    const LUAT: Array<{ re: RegExp; ten: string }> = [
      { re: /failed to fetch|load failed|network/i, ten: 'mạng: gọi API không tới' },
      { re: /timeout|etimedout/i, ten: 'hết giờ chờ' },
      { re: /connection slots|too many clients/i, ten: 'hết slot Postgres' },
      { re: /chưa cấu hình|not configured/i, ten: 'thiếu cấu hình máy chủ' },
      { re: /resizeobserver|extension|aborted/i, ten: 'tiếng ồn trình duyệt' },
      { re: /unauthorized|forbidden/i, ten: 'quyền / đăng nhập' },
      { re: /cannot read|undefined|null/i, ten: 'đọc thuộc tính của null' },
    ];
    const nhom = new Map<
      string,
      { soCum: number; soLan: number; viDu: string; nang: Array<{ id: number; soLan: number }> }
    >();
    for (const c of ds) {
      const chu = c.tomTat || '';
      const ten = LUAT.find((l) => l.re.test(chu))?.ten || 'khác';
      const o = nhom.get(ten) || { soCum: 0, soLan: 0, viDu: chu.slice(0, 70), nang: [] };
      o.soCum += 1;
      o.soLan += c.soLan || 0;
      o.nang.push({ id: c.id, soLan: c.soLan || 0 });
      nhom.set(ten, o);
    }
    const sx = [...nhom.entries()].sort((a, b) => b[1].soLan - a[1].soLan);
    return [
      `# ${tong} cụm lỗi đang mở, gom về ${sx.length} nguyên nhân`,
      ...sx.map(([ten, v]) => {
        // In kèm id của vài cụm NẶNG NHẤT nhóm: không có id thì `ho_so_loi` thành vô dụng,
        // và cụm nặng nhất gần như luôn là cụm đáng mở hồ sơ trước.
        const id = v.nang
          .sort((a, b) => b.soLan - a.soLan)
          .slice(0, 3)
          .map((x) => `#${x.id} (${x.soLan} lần)`)
          .join(', ');
        return `- **${ten}**: ${v.soLan} lần / ${v.soCum} cụm\n  nặng nhất: ${id}\n  vd: ${v.viDu}`;
      }),
      '',
      'Mở hồ sơ sửa lỗi của một cụm: công cụ ho_so_loi với id ở trên.',
    ].join('\n');
  }

  async hoSoLoi(id: number): Promise<string> {
    return this.suCo.hoSoSuaLoi(id);
  }

  async chayQuet(): Promise<string> {
    if (!this.cms.daCauHinh()) return 'Máy chủ chưa khai CMS_DB_* — bot nằm im.';
    // Chạy nền: ca quét cả kho mất vài phút, vượt kiên nhẫn của mọi tầng proxy.
    void this.thamDinh.chayCa(0).catch((e: unknown) => {
      this.logger.error(`ca quét từ MCP chết: ${(e as Error)?.message || e}`);
    });
    return 'Đã khởi động ca quét cả kho, chạy nền vài phút. Hỏi lại bằng công cụ nhat_ky_bot để xem kết quả.';
  }

  async thuTuSua(gioiHan: number): Promise<string> {
    const lk = await this.thamDinh.tuSuaHinhThuc(true, gioiHan);
    return [
      `# Chạy THỬ tự sửa — không ghi gì`,
      `Xét ${lk.soXet} · sẽ sửa ${lk.soApDuoc} · bị chặn ${lk.soChan}`,
      '',
      ...lk.viDu.map((v) => `- [${v.tieuDe}]\n  trước: ${v.truoc}\n  sau  : ${v.sau}`),
      lk.lyDoChan.length ? `\nLý do chặn: ${lk.lyDoChan.map((x) => `${x.soLan}× ${x.lyDo}`).join(' · ')}` : '',
      '',
      'Muốn ghi thật thì mở /app/tham-dinh hoặc gọi POST /tham-dinh/tu-sua?ghi=1 — MCP này cố ý không ghi.',
    ].join('\n');
  }
}
