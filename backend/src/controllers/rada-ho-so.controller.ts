import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * RadaHoSoService — dựng HỒ SƠ CỤM cho Rada SEO (plugin trong CMS gọi sang).
 *
 * VÌ SAO NẰM Ở BACKEND, KHÔNG NẰM TRONG PLUGIN
 * Tháp liên kết (vị thuốc ↔ bài thuốc ↔ nguồn y văn) sống ở `defaultdb`; plugin chạy trong
 * tiến trình CMS và chỉ nối `kinhlac_cms`. Hai kho KHÔNG join chéo được, và mở pool thứ hai
 * tới Aiven là đường sập (trần 20 slot, Aiven đã ăn 8). Nên plugin hỏi qua HTTP, cùng lối đã
 * dùng cho `POST /tra-cuu/ten`.
 *
 * Bản sao trong `kinhlac_cms` KHÔNG thay được chỗ này: `ec_bai_thuoc.thanh_phan` ở CMS có
 * `id: null` ở mọi vị (đã đo 02/10/2026), và CMS không có bảng nối nguồn ↔ bài thuốc.
 *
 * NGUYÊN TẮC: hỏi "vị nào THỰC SỰ có mặt trong bài thuốc của cụm", KHÔNG hỏi "vị nào mang
 * nhãn chủ trị". Hai câu hỏi cho hai kết quả khác hẳn — đo trên cụm "chảy máu cam": theo nhãn
 * ra Bạch Đầu Ông, Châu Tử Sâm (vị ít dùng); theo tần suất thật ra Đương quy 19/55 bài,
 * Bạch thược 18, Cam thảo 15. Chỉ cách sau mới dựng được bài đọc lọt tai thầy thuốc.
 */

/** Chuỗi lọt vào `thanh_phan` mà không phải vị thuốc — đo thật: "Sắc uống." 14 lần, "Tán bột." 11 lần. */
const RAC_THANH_PHAN =
  /^(sắc uống|tán bột|làm viên|uống|thêm|gia |sắc |tán |hoàn$|mỗi lần|ngày uống|nước |rượu |giấm |mật )/i;

export const boDau = (s: unknown): string =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Tách `tac_dung` thành PHÁP TRỊ và CHỨNG TRẠNG.
 * "Lương huyết, chỉ huyết. Trị bên trên có nhiệt, chảy máu cam"
 *   → { phap: "Lương huyết, chỉ huyết", chung: "Trị bên trên có nhiệt, chảy máu cam" }
 *
 * ⚠️ KHÔNG dùng `\b`: trong JS `\w` = [A-Za-z0-9_], nên "ị" KHÔNG phải `\w` và `\bTrị\b`
 * không bao giờ khớp. Lỗi này IM LẶNG — mọi bài rơi vào nhánh "không có pháp trị" và bảng
 * thể bệnh ra RỖNG mà không có lỗi nào. Đã cắn một lần khi dựng bản thử.
 */
export function tachTacDung(s: unknown): { phap: string; chung: string } {
  const t = String(s ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  const i = t.search(/(?:^|[.;,]\s*)(?:Trị|Chữa|Dùng cho|Dùng khi)\s/u);
  return i > 0
    ? { phap: t.slice(0, i).replace(/[.。]\s*$/, '').trim(), chung: t.slice(i).replace(/^[.,;\s]+/, '').trim() }
    : { phap: '', chung: t };
}

/** Các VẾ pháp trị: "Dưỡng âm, thanh nhiệt" → ["duong am", "thanh nhiet"].
 *  Gom theo VẾ chứ không theo cả cụm — gom cả cụm thì mỗi bài thành một thể và bảng ra rỗng. */
export function veCua(phap: string): string[] {
  return boDau(phap)
    .split(/[,;.]/)
    .map((x) => x.trim())
    .filter((x) => x.length >= 4);
}

export interface ViTrongHoSo {
  ten: string;
  id: number | null;
  duong: string | null;
  tinhVi: string;
  quyKinh: string;
  soBaiDung: number;
}
export interface TheBenh {
  phapTri: string;
  ve: string;
  soBai: number;
  chungTrangTheoYVan: string[];
  viThuocChinh: ViTrongHoSo[];
  baiThuocTieuBieu: { ten: string; duong: string; xuatXu: string | null }[];
}
export interface HoSoCum {
  cum: string;
  bienThe: string[];
  soBaiThuoc: number;
  soViKhacNhau: number;
  theBenh: TheBenh[];
  viHayDung: ViTrongHoSo[];
  nguonYVan: { ten: string; duong: string; nienDai: string | null; soBaiDan: number }[];
  loThung: { ten: string; soBaiDung: number }[];
  canhBao: string[];
}

@Injectable()
export class RadaHoSoService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /** Trần biến thể: mỗi biến thể là một mệnh đề ILIKE, nhiều quá thì quét bảng lâu. */
  private static readonly TRAN_BIEN_THE = 8;
  /** Thể bệnh phải có ít nhất chừng này bài mới đáng nêu — ít hơn là nhiễu. */
  private static readonly TOI_THIEU_BAI_MOI_THE = 3;

  /**
   * Đệm cho `ungVien`: phép đếm phải tải toàn bộ `tac_dung` (13.911 dòng) rồi so 113 cụm —
   * mất ~11 giây. Tab Khoảng trống hỏi lại mỗi lần người dùng bấm "Tải lại", và kho từ điển
   * đổi theo ngày chứ không theo phút, nên giữ 10 phút là đủ.
   *
   * Đệm nằm trong BỘ NHỚ TIẾN TRÌNH — chỉ đúng khi chạy MỘT container, cùng giả định với
   * `@Cron` và `sse.service` (xem CLAUDE.md, mục Deployment).
   */
  private static readonly HAN_DEM_MS = 10 * 60 * 1000;
  private demUngVien: { khoa: string; luc: number; ds: { ten: string; soVi: number; soBai: number; thap: number }[] } | null = null;
  private demCum: { khoa: string; luc: number; ds: Awaited<ReturnType<RadaHoSoService["cumNguNghia"]>> } | null = null;

  /**
   * @param bienThe các cách gọi cùng một chứng ("chảy máu cam", "nục huyết", "tỵ nục").
   *   Bắt buộc truyền đủ: tra một từ tiếng Việt hiện đại trên kho dùng từ Hán Việt thì tháp
   *   hụt hẳn — đo thật: "chảy máu cam" ra 6 mục chủ trị, thêm "nục huyết" + "tỵ nục" ra 17.
   */
  async dungHoSo(cum: string, bienThe: string[]): Promise<HoSoCum> {
    const bt = [...new Set([cum, ...bienThe].map((x) => String(x ?? '').trim()).filter(Boolean))].slice(
      0,
      RadaHoSoService.TRAN_BIEN_THE,
    );
    const canhBao: string[] = [];
    const dk = bt.map((_, i) => `tac_dung ILIKE $${i + 1}`).join(' OR ');
    const tham = bt.map((x) => `%${x}%`);

    const bai: { id: number; ten: string; slug: string; xuat_xu: string | null; thanh_phan: unknown; tac_dung: string }[] =
      await this.dataSource.query(
        `SELECT id, ten, slug, xuat_xu, thanh_phan, tac_dung FROM phuong_thang WHERE ${dk}`,
        tham,
      );

    const dsVi: { id: number; ten_vi_thuoc: string; ten_khac: string | null; tinh: string | null; vi: string | null; quy_kinh: string | null }[] =
      await this.dataSource.query(`SELECT id, ten_vi_thuoc, ten_khac, tinh, vi, quy_kinh FROM vi_thuoc`);

    // Bảng tra tên → mục vị thuốc. KHÔNG tin `id` trong `thanh_phan`: đã đo Sinh địa và Thục
    // địa cùng mang id 64, tức link sẽ trỏ sai mục.
    const traVi = new Map<string, (typeof dsVi)[number]>();
    for (const v of dsVi) {
      traVi.set(boDau(v.ten_vi_thuoc), v);
      for (const k of String(v.ten_khac ?? '').split(/[,;\n]/)) if (k.trim()) traVi.set(boDau(k), v);
    }
    const khoaVi = [...traVi.keys()];
    /** Tên trong thành phần thường NGẮN hơn tên mục ("Sinh địa" ↔ "Sinh Địa Hoàng"). Khớp đúng
     *  trước; không có thì lấy mục DUY NHẤT bắt đầu bằng tên đó. Nhiều mục khớp thì TRẢ NULL —
     *  đoán sai còn tệ hơn không gắn link, vì link sai dẫn người đọc tới vị thuốc khác. */
    const traLong = (ten: string) => {
      const k = boDau(ten);
      const dung = traVi.get(k);
      if (dung) return dung;
      const hop = khoaVi.filter((x) => x.startsWith(`${k} `));
      const id = new Set(hop.map((x) => traVi.get(x)!.id));
      return id.size === 1 ? traVi.get(hop[0])! : null;
    };

    type NhomThe = {
      bai: { ten: string; slug: string; xuatXu: string | null; soVi: number }[];
      vi: Map<string, ViTrongHoSo>;
      chung: string[];
      nhan: Map<string, number>;
    };
    const theo = new Map<string, NhomThe>();
    const demVi = new Map<string, ViTrongHoSo>();

    for (const b of bai) {
      let tp: unknown = b.thanh_phan;
      if (typeof tp === 'string') {
        try {
          tp = JSON.parse(tp);
        } catch {
          tp = [];
        }
      }
      const viBai: ViTrongHoSo[] = [];
      for (const x of Array.isArray(tp) ? (tp as { ten?: string }[]) : []) {
        const ten = String(x?.ten ?? '').trim();
        if (!ten || RAC_THANH_PHAN.test(ten)) continue;
        const v = traLong(ten);
        const muc: ViTrongHoSo = {
          ten,
          id: v?.id ?? null,
          duong: v ? `/duoc-lieu/${v.id}/` : null,
          tinhVi: [v?.tinh, v?.vi].filter(Boolean).join(', '),
          quyKinh: v?.quy_kinh ?? '',
          soBaiDung: 0,
        };
        viBai.push(muc);
        const o = demVi.get(boDau(ten)) ?? { ...muc };
        o.soBaiDung++;
        demVi.set(boDau(ten), o);
      }

      const { phap, chung } = tachTacDung(b.tac_dung);
      if (!phap) continue;
      for (const ve of veCua(phap)) {
        const t: NhomThe = theo.get(ve) ?? { bai: [], vi: new Map(), chung: [], nhan: new Map() };
        t.nhan.set(phap, (t.nhan.get(phap) ?? 0) + 1);
        t.bai.push({ ten: b.ten, slug: b.slug, xuatXu: b.xuat_xu, soVi: viBai.length });
        if (chung) t.chung.push(chung);
        for (const v of viBai) {
          const o = t.vi.get(boDau(v.ten)) ?? { ...v, soBaiDung: 0 };
          o.soBaiDung++;
          t.vi.set(boDau(v.ten), o);
        }
        theo.set(ve, t);
      }
    }

    // Một pháp trị 4 vế ("Thanh nhiệt, tả hỏa, lương huyết, giải độc") sinh 4 thể mang CÙNG tập
    // bài. Bỏ thể trùng: cùng nhãn pháp trị, hoặc tập bài chồng nhau từ 70%.
    const nhanCua = (t: { nhan: Map<string, number> }) => [...t.nhan.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const tho = [...theo.entries()]
      .filter(([, t]) => t.bai.length >= RadaHoSoService.TOI_THIEU_BAI_MOI_THE)
      .sort((a, b) => b[1].bai.length - a[1].bai.length);
    const giu: { ve: string; t: NhomThe }[] = [];
    for (const [ve, t] of tho) {
      const tapT = new Set(t.bai.map((b) => b.slug));
      const trung = giu.some((g) => {
        if (nhanCua(g.t) === nhanCua(t)) return true;
        const tapG = new Set(g.t.bai.map((b) => b.slug));
        return [...tapT].filter((x) => tapG.has(x)).length / tapT.size >= 0.7;
      });
      if (!trung) giu.push({ ve, t });
    }

    const theBenh: TheBenh[] = giu.map(({ ve, t }) => ({
      phapTri: nhanCua(t),
      ve,
      soBai: t.bai.length,
      chungTrangTheoYVan: [...new Set(t.chung)].slice(0, 3),
      viThuocChinh: [...t.vi.values()].filter((v) => v.duong).sort((a, b) => b.soBaiDung - a.soBaiDung).slice(0, 6),
      baiThuocTieuBieu: t.bai
        .sort((a, b) => b.soVi - a.soVi)
        .slice(0, 3)
        .map((b) => ({ ten: b.ten, duong: `/bai-thuoc/${b.slug}/`, xuatXu: b.xuatXu })),
    }));

    // Nguồn: CHỈ `loai = 'sach'`. Bảng `nguon` chứa cả tên tác giả (478 dòng) — không lọc thì
    // "Lý Diên", "Thẩm Kim Ngao" hiện ra như sách tham khảo.
    const nguon: { slug: string; ten: string; nien_dai: string | null; so: string }[] = await this.dataSource.query(
      `SELECT n.slug, n.ten, n.nien_dai, COUNT(*)::int AS so
         FROM nguon n
         JOIN nguon_phuong_thang np ON np.nguon_id = n.id
         JOIN phuong_thang p ON p.id = np.phuong_thang_id
        WHERE n.loai = 'sach' AND (${dk.replace(/tac_dung/g, 'p.tac_dung')})
        GROUP BY 1, 2, 3
        ORDER BY so DESC, n.nien_dai NULLS LAST
        LIMIT 8`,
      tham,
    );

    const viHayDung = [...demVi.values()].sort((a, b) => b.soBaiDung - a.soBaiDung);
    // LỖ THỦNG THÁP: vị dùng nhiều mà KHÔNG có mục từ điển. Đây là việc cho người, không phải
    // cho bot — đo thật: "Sinh địa" có mặt trong 1.427 bài thuốc toàn kho mà kho chỉ có
    // "Sinh địa thán", "Sinh địa trấp", "Can địa hoàng".
    const loThung = viHayDung.filter((v) => !v.duong && v.soBaiDung >= 3).slice(0, 10).map((v) => ({ ten: v.ten, soBaiDung: v.soBaiDung }));

    if (!bai.length) canhBao.push('Không có bài thuốc nào khớp cụm — kiểm lại biến thể từ vựng Đông y.');
    if (!theBenh.length && bai.length) canhBao.push('Có bài thuốc nhưng không rút được thể bệnh nào từ pháp trị.');
    if (!nguon.length && bai.length) canhBao.push('Không có nguồn y văn nào nối với các bài thuốc này.');

    return {
      cum,
      bienThe: bt,
      soBaiThuoc: bai.length,
      soViKhacNhau: demVi.size,
      theBenh,
      viHayDung: viHayDung.filter((v) => v.duong).slice(0, 12),
      nguonYVan: nguon.map((n) => ({ ten: n.ten, duong: `/nguon/${n.slug}/`, nienDai: n.nien_dai, soBaiDan: Number(n.so) })),
      loThung,
      canhBao,
    };
  }

  /**
   * CỤM NGỮ NGHĨA: 657 cụm trong `kl_seo_semantic_cluster`, mỗi cụm gom nhiều chủ trị cùng
   * nghĩa. Đây là tầng TRÊN của `ungVien`: "Mụn nhọt", "ung nhọt", "nhọt độc" là ba dòng riêng
   * ở đó nhưng cùng MỘT cụm ở đây — gom lại thì tháp thật của cụm mới hiện đúng độ lớn.
   *
   * Đếm bài thuốc phải quét `tac_dung` cho mọi chủ trị của mọi cụm, nên dùng chung đệm với
   * `ungVien` (xem HAN_DEM_MS).
   */
  async cumNguNghia(toiThieuThap = 20): Promise<
    { id: number; ten: string; slug: string; moTa: string | null; soChuTri: number; soVi: number; soBai: number; thap: number; chuTri: string[] }[]
  > {
    const khoa = `cum:${toiThieuThap}`;
    if (this.demCum && this.demCum.khoa === khoa && Date.now() - this.demCum.luc < RadaHoSoService.HAN_DEM_MS) return this.demCum.ds;

    const dong: { id: number; ten: string; slug: string; mo_ta: string | null; chu_tri_id: number; ten_chu_tri: string }[] =
      await this.dataSource.query(
        `SELECT cl.id, cl.name AS ten, cl.slug, cl.description AS mo_ta, ct.chu_tri_id, t.ten_chu_tri
           FROM kl_seo_semantic_cluster cl
           JOIN kl_seo_semantic_chu_tri ct ON ct.cluster_id = cl.id
           JOIN chu_tri t ON t.id = ct.chu_tri_id
          WHERE length(t.ten_chu_tri) BETWEEN 4 AND 40`,
      );
    const soViTheoChuTri = new Map<number, number>();
    for (const r of (await this.dataSource.query(
      `SELECT id_chu_tri, COUNT(*)::int AS n FROM vi_thuoc_chu_tri GROUP BY 1`,
    )) as { id_chu_tri: number; n: string }[])
      soViTheoChuTri.set(r.id_chu_tri, Number(r.n));

    const tacDung: { tac_dung: string }[] = await this.dataSource.query(
      `SELECT tac_dung FROM phuong_thang WHERE tac_dung IS NOT NULL`,
    );
    const kho = tacDung.map((r) => boDau(r.tac_dung));

    const cum = new Map<number, { id: number; ten: string; slug: string; moTa: string | null; chuTri: { ten: string; khoa: string }[]; soVi: number }>();
    for (const r of dong) {
      const c = cum.get(r.id) ?? { id: r.id, ten: r.ten, slug: r.slug, moTa: r.mo_ta, chuTri: [], soVi: 0 };
      c.chuTri.push({ ten: r.ten_chu_tri, khoa: boDau(r.ten_chu_tri) });
      c.soVi += soViTheoChuTri.get(r.chu_tri_id) ?? 0;
      cum.set(r.id, c);
    }

    // Một bài thuốc chỉ đếm MỘT lần cho mỗi cụm, dù khớp nhiều chủ trị của cụm đó.
    const ds = [...cum.values()]
      .map((c) => {
        const khoaCum = [...new Set(c.chuTri.map((x) => x.khoa))];
        const soBai = kho.filter((x) => khoaCum.some((k) => x.includes(k))).length;
        return {
          id: c.id,
          ten: c.ten,
          slug: c.slug,
          moTa: c.moTa,
          soChuTri: c.chuTri.length,
          soVi: c.soVi,
          soBai,
          thap: c.soVi + soBai,
          chuTri: c.chuTri.map((x) => x.ten).slice(0, 12),
        };
      })
      .filter((x) => x.thap >= toiThieuThap)
      .sort((a, b) => b.thap - a.thap);
    this.demCum = { khoa, luc: Date.now(), ds };
    return ds;
  }

  /**
   * Ứng viên khoảng trống: chủ trị có THÁP DÀY. Lọc "đã có trang nhắm nhu cầu" là việc của
   * plugin (nó biết các bộ CMS); ở đây chỉ đo tháp.
   *
   * Đếm vị thuốc bằng bảng nối (nhanh), đếm bài thuốc bằng một lượt quét duy nhất trong Node —
   * subquery ILIKE theo từng dòng chủ trị là 3.588 lượt quét toàn bảng, đã đo quá 120 giây.
   */
  async ungVien(toiThieuVi = 8, toiThieuThap = 25): Promise<{ ten: string; soVi: number; soBai: number; thap: number }[]> {
    const khoa = `${toiThieuVi}:${toiThieuThap}`;
    if (this.demUngVien && this.demUngVien.khoa === khoa && Date.now() - this.demUngVien.luc < RadaHoSoService.HAN_DEM_MS)
      return this.demUngVien.ds;
    const ct: { id: number; ten_chu_tri: string; n: string }[] = await this.dataSource.query(
      `SELECT ct.id, ct.ten_chu_tri, COUNT(*)::int AS n
         FROM chu_tri ct JOIN vi_thuoc_chu_tri v ON v.id_chu_tri = ct.id
        WHERE length(ct.ten_chu_tri) BETWEEN 4 AND 30
        GROUP BY 1, 2 HAVING COUNT(*) >= $1 ORDER BY n DESC`,
      [toiThieuVi],
    );
    const tacDung: { tac_dung: string }[] = await this.dataSource.query(
      `SELECT tac_dung FROM phuong_thang WHERE tac_dung IS NOT NULL`,
    );
    const kho = tacDung.map((r) => boDau(r.tac_dung));
    const ds = ct
      .map((r) => {
        const k = boDau(r.ten_chu_tri);
        const soBai = kho.filter((x) => x.includes(k)).length;
        return { ten: r.ten_chu_tri, soVi: Number(r.n), soBai, thap: Number(r.n) + soBai };
      })
      .filter((x) => x.thap >= toiThieuThap)
      .sort((a, b) => b.thap - a.thap);
    this.demUngVien = { khoa, luc: Date.now(), ds };
    return ds;
  }
}
