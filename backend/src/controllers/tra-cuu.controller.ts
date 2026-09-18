import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Nguon } from '../models/nguon.model';

/** Chuẩn hoá tên để đối khớp: bỏ dấu, đ->d, gộp khoảng trắng, hạ thường.
 *  Giữ ĐÚNG luật fold() của nguon.controller để khớp được cột norm_key. */
const fold = (s: string) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const slugify = (s: string) =>
  fold(s)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** Chuẩn hoá MẠNH: bỏ luôn mọi dấu câu và khoảng trắng.
 *  Sổ nguồn có 42 bản ghi chỉ khác nhau ở dấu gạch/dấu phẩy
 *  ("Tam Nhân Cực - Bệnh Chứng Phương Luận" / "Tam Nhân Cực–Bệnh Chứng
 *  Phương Luận" / "Tam Nhân Cực-Bệnh Chứng Phương Luận" là một cuốn).
 *  Khớp theo khoá này thì cách người viết đánh dấu câu không còn cản. */
const foldManh = (s: string) => fold(s).replace(/[^a-z0-9]+/g, '');

export type LoaiMuc = 'nguon' | 'bai_thuoc' | 'vi_thuoc';

export interface MucTuDien {
  loai: LoaiMuc;
  /** Tên chính thức của mục từ (có thể khác tên người viết dùng trong y văn). */
  ten: string;
  slug?: string;
  id?: number;
}

/** Tên tối thiểu 4 ký tự: ngắn hơn thì dễ khớp bừa ("Q.4", "Cam"). */
const DO_DAI_TOI_THIEU = 4;
const TOI_DA_MOI_LAN = 200;
const CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * TraCuuService — TRA TÊN RIÊNG TRONG Y VĂN RA MỤC TỪ.
 *
 * Bài toán: nội dung từ điển là văn xuôi, nhắc tên sách ("… (Kim Quỹ Yếu
 * Lược)"), tên bài thuốc ("… gọi là Ích Vị Thăng Dương Thang") và tên vị
 * thuốc giữa câu. Người đọc muốn bấm vào là sang mục đó, không phải copy
 * tên đi tìm.
 *
 * Cách làm: client trích sẵn các cụm NGHI LÀ TÊN RIÊNG (nó biết vị trí:
 * trong ngoặc đơn cuối câu, sau chữ "gọi là"…) rồi hỏi một lượt. Nhờ vậy
 * không phải tải 13.942 tên bài thuốc về máy người đọc, và không bao giờ
 * link nhầm liều lượng "(30g)" hay tên Latin "(Spongilla fragilis)".
 *
 * Nguồn và vị thuốc: giữ index trong bộ nhớ (2.155 + 1.045 bản ghi, kể cả
 * tên khác của nguồn) vì cần đối khớp sau khi bỏ dấu.
 * Bài thuốc: KHÔNG cache (13.942 bản ghi) — tra thẳng bằng cột slug đã có index.
 */
@Injectable()
export class TraCuuService {
  constructor(
    @InjectRepository(Nguon)
    private readonly repo: Repository<Nguon>,
  ) {}

  private nguonIndex: Map<string, MucTuDien> | null = null;
  private viThuocIndex: Map<string, MucTuDien> | null = null;
  private napLuc = 0;

  private async napIndex(): Promise<void> {
    if (this.nguonIndex && this.viThuocIndex && Date.now() - this.napLuc < CACHE_TTL_MS) return;

    // do_trich = số chỗ đang trích nguồn này. Khi nhiều bản ghi trùng nhau
    // sau chuẩn hoá mạnh, giữ bản ĐƯỢC TRÍCH NHIỀU NHẤT — đó là bản người
    // dùng thực sự đọc, và cũng là bản nên giữ nếu sau này gộp sổ nguồn.
    const nguonRows: { ten: string; slug: string; ten_khac: string | null; do_trich: number }[] =
      await this.repo.query(`
        select n.ten, n.slug, n.ten_khac,
               (select count(*) from nguon_phuong_thang x where x.nguon_id = n.id)
             + (select count(*) from nguon_vi_thuoc y where y.nguon_id = n.id) as do_trich
        from nguon n
        where n.ten is not null
      `);
    const nguonIdx = new Map<string, MucTuDien>();
    const diem = new Map<string, number>();
    for (const r of nguonRows) {
      const bienThe = [r.ten, ...(r.ten_khac ? r.ten_khac.split(' | ') : [])];
      for (const nm of bienThe) {
        const t = String(nm || '').trim();
        if (t.length < DO_DAI_TOI_THIEU) continue;
        const d = Number(r.do_trich) || 0;
        for (const k of [fold(t), foldManh(t)]) {
          if (!nguonIdx.has(k) || d > (diem.get(k) ?? -1)) {
            nguonIdx.set(k, { loai: 'nguon', ten: r.ten, slug: r.slug });
            diem.set(k, d);
          }
        }
      }
    }

    const viRows: { id: number; ten_vi_thuoc: string }[] = await this.repo.query(
      `select id, ten_vi_thuoc from vi_thuoc where ten_vi_thuoc is not null`,
    );
    const viIdx = new Map<string, MucTuDien>();
    for (const r of viRows) {
      const t = String(r.ten_vi_thuoc || '').trim();
      if (t.length < DO_DAI_TOI_THIEU) continue;
      const k = fold(t);
      if (!viIdx.has(k)) viIdx.set(k, { loai: 'vi_thuoc', ten: t, id: r.id });
    }

    this.nguonIndex = nguonIdx;
    this.viThuocIndex = viIdx;
    this.napLuc = Date.now();
  }

  /**
   * Tra một lô tên. Trả về map "tên như trong y văn" -> các mục từ khớp.
   * Một tên có thể khớp nhiều loại; client chọn theo ngữ cảnh nó đang đọc
   * (cụm trong ngoặc đơn thì ưu tiên nguồn, cụm sau "gọi là" thì ưu tiên
   * bài thuốc).
   */
  async traTen(tens: string[]): Promise<Record<string, MucTuDien[]>> {
    await this.napIndex();

    const goc = new Map<string, string>(); // key chuẩn hoá -> tên gốc đầu tiên gặp
    for (const raw of Array.isArray(tens) ? tens : []) {
      const t = String(raw || '').trim();
      if (t.length < DO_DAI_TOI_THIEU || t.length > 140) continue;
      const k = fold(t);
      if (!k) continue;
      if (!goc.has(k)) goc.set(k, t);
      if (goc.size >= TOI_DA_MOI_LAN) break;
    }
    if (!goc.size) return {};

    const ra: Record<string, MucTuDien[]> = {};
    const them = (tenGoc: string, muc: MucTuDien) => {
      if (!ra[tenGoc]) ra[tenGoc] = [];
      if (!ra[tenGoc].some((m) => m.loai === muc.loai)) ra[tenGoc].push(muc);
    };

    // Nguồn + vị thuốc: đối khớp trong index bộ nhớ.
    // Nguồn thử thêm khoá chuẩn hoá mạnh để dấu câu không cản việc khớp.
    for (const [k, tenGoc] of goc) {
      const n = this.nguonIndex?.get(k) ?? this.nguonIndex?.get(foldManh(tenGoc));
      if (n) them(tenGoc, n);
      const v = this.viThuocIndex?.get(k);
      if (v) them(tenGoc, v);
    }

    // Bài thuốc: tra bằng slug (cột đã có index)
    const slugToKey = new Map<string, string>();
    for (const [k, tenGoc] of goc) {
      const sl = slugify(tenGoc);
      if (sl && !slugToKey.has(sl)) slugToKey.set(sl, tenGoc);
    }
    if (slugToKey.size) {
      const rows: { ten: string; slug: string }[] = await this.repo.query(
        `select ten, slug from phuong_thang where slug = any($1)`,
        [[...slugToKey.keys()]],
      );
      for (const r of rows) {
        const tenGoc = slugToKey.get(r.slug);
        if (tenGoc) them(tenGoc, { loai: 'bai_thuoc', ten: r.ten, slug: r.slug });
      }
    }

    return ra;
  }
}
