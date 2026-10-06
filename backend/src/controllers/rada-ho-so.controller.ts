import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DoNhieuMau } from '../utils/da-mau.util';

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

/** Kết quả của `sucKhoeNen` — vòng NỀN của Rada SEO. */
export type SucKhoeNen = {
  nguon: { ma: string; ten: string; co: number; tong: number; pt: number | null; chuaCoMuc: boolean }[];
  semantic: { soCum: number; chuTriNhieuCum: number };
  chuaDo: string[];
  tuDem: boolean;
};

/** Một bộ của trụ NGUỒN: bao nhiêu mục dẫn được về một cuốn sách. */
export type DemNguon = { co: number; tong: number };

/**
 * Tỉ lệ có nguồn.
 *
 * ⚠️ `tong = 0` trả `pt: null` chứ KHÔNG trả 0: "chưa có mục nào trong bộ" và "có mục mà không
 * mục nào dẫn được nguồn" là hai chuyện khác hẳn, và 0% trên màn thì người đọc không phân biệt
 * được. Cùng lý lẽ với mọi chỗ khác trong repo: một con số cho hai trạng thái là con số vô dụng.
 */
export function tyLeNguon(d: DemNguon): { co: number; tong: number; pt: number | null; chuaCoMuc: boolean } {
  const co = Number(d?.co ?? 0);
  const tong = Number(d?.tong ?? 0);
  return { co, tong, pt: tong > 0 ? Math.round((co / tong) * 1000) / 10 : null, chuaCoMuc: tong === 0 };
}

/** Tên người đọc của từng bộ trong trụ Nguồn. */
const TEN_BO_NGUON: Record<string, string> = {
  bai: 'Bài thuốc',
  vi: 'Vị thuốc',
  huyet: 'Huyệt',
  benhHoc: 'Bệnh học',
  chamCuu: 'Châm cứu trị bệnh',
  kinh: 'Kinh mạch',
};

/**
 * Xếp các bộ theo mức MỎNG — bộ ít nguồn nhất lên đầu, vì đó là chỗ đáng vá trước.
 *
 * ⚠️ Bộ CHƯA CÓ MỤC NÀO (`tong = 0`) xuống CUỐI, không lên đầu dù tỉ lệ là 0. 0/0 không phải
 * "mỏng nhất", nó là "chưa nạp dữ liệu" — xếp nó lên đầu là cử người đi vá một bảng rỗng trong
 * khi 4.085 vị thuốc thật đang thiếu nguồn (số đo 06/10/2026: vị thuốc 205/4.085 = 5%).
 */
export function xepLoNguon(bo: Record<string, DemNguon>): { ma: string; ten: string; co: number; tong: number; pt: number | null; chuaCoMuc: boolean }[] {
  return Object.entries(bo ?? {})
    .map(([ma, d]) => ({ ma, ten: TEN_BO_NGUON[ma] ?? ma, ...tyLeNguon(d) }))
    .sort((a, b) => {
      if (a.chuaCoMuc !== b.chuaCoMuc) return a.chuaCoMuc ? 1 : -1;
      return (a.pt ?? 0) - (b.pt ?? 0);
    });
}

/** Các VẾ pháp trị: "Dưỡng âm, thanh nhiệt" → ["duong am", "thanh nhiet"].
 *  Gom theo VẾ chứ không theo cả cụm — gom cả cụm thì mỗi bài thành một thể và bảng ra rỗng. */
export function veCua(phap: string): string[] {
  return boDau(phap)
    .split(/[,;.]/)
    .map((x) => x.trim())
    .filter((x) => x.length >= 4);
}

/**
 * Khớp tên cụm vào một TÊN CÓ KIỂM SOÁT (tên bệnh `benh_dong_y.tieuket`, tên phác đồ
 * `phac_do_chuan.ten`) — đường duy nhất đưa HUYỆT vào tháp, vì `huyet_vi` không có bảng nối
 * nào tới `chu_tri` (đo 03/10/2026: 445 huyệt, 0 bảng nối; chủ trị của huyệt nằm trong văn
 * xuôi `tac_dung`, mà `tac_dung` của huyệt là PHÁP TRỊ — "Thanh thần trí, cố biểu" — chứ không
 * phải chứng trạng).
 *
 * Khớp theo DÃY TỪ LIỀN NHAU sau khi bỏ dấu, không phải `includes` trên chuỗi: "đau lưng" ⊂
 * "Yêu thống (bệnh đau lưng)" ✓, "tiêu chảy" ⊂ "Viêm ruột / Tiêu chảy / Kiết lỵ" ✓, nhưng
 * "ho" KHÔNG được khớp "hô hấp".
 *
 * ⚠️ **PHẢI CÓ ÍT NHẤT HAI TỪ.** Đây là luật đắt nhất ở đây, và nó có vì số đo chứ không vì
 * lo xa. Đo 03/10/2026 khi cho cụm một từ được khớp: cụm "Ung nhọt, Lở loét & Da liễu" nhận
 * **98 huyệt** qua đúng một chủ trị "Phong" — khớp vào "Trúng Phong (Kẹt Động Mạch Não)",
 * "Thể Phong đàm", "Âm hư động phong". "Phong" trong da liễu là phong ngứa, không phải trúng
 * phong; bài da liễu sẽ mọc ra một mục phương huyệt chữa tai biến. "Viêm" cũng vậy: nó trúng
 * mọi phác đồ "Viêm ...". Hai từ trở lên thì "Yêu Thống" → "Yêu thống (bệnh đau lưng)" ✓ và
 * "huyết ứ" → "Thể Huyết ứ" ✓ vẫn chạy, còn "Phong" và "Viêm" bị loại.
 *
 * `TOI_THIEU_KY_TU` giữ thêm cho trường hợp hai từ mà đều rất ngắn.
 */
const TOI_THIEU_KY_TU = 4;
const TOI_THIEU_TU = 2;

const tachTu = (s: unknown): string[] => boDau(s).replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean);

export function khopTenNhuCau(cum: string, ten: string): boolean {
  const a = tachTu(cum);
  const b = tachTu(ten);
  if (a.length < TOI_THIEU_TU || !b.length || a.join('').length < TOI_THIEU_KY_TU) return false;
  for (let i = 0; i + a.length <= b.length; i++) if (a.every((t, k) => b[i + k] === t)) return true;
  return false;
}

export interface HuyetTrongHoSo {
  ten: string;
  ma: string | null;
  kinh: string | null;
  vaiTro: string | null;
  soNguonDan: number;
}
export interface KinhTrongHoSo {
  ten: string;
  maSo: string | null;
  so: number;
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
  /** Huyệt rút từ phác đồ châm cứu của cụm — nhánh thứ hai của tháp, cạnh nhánh thuốc. */
  huyet: HuyetTrongHoSo[];
  /** Tên bệnh / phác đồ đã khớp. Hiện ra để người đọc tự thấy phép khớp đúng hay sai. */
  phacDoKhop: { ten: string; nguon: 'benh' | 'phac_do'; soHuyet: number }[];
  /** Kinh của các huyệt trên, và quy kinh của các vị thuốc — HAI đường đo độc lập. */
  kinhTheoHuyet: KinhTrongHoSo[];
  kinhTheoViThuoc: KinhTrongHoSo[];
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
  private demUngVien: { khoa: string; luc: number; ds: Awaited<ReturnType<RadaHoSoService['ungVien']>> } | null = null;
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

    // Nhánh huyệt + kinh. Chạy SAU khi đã có `demVi` (cần id vị thuốc để lấy quy kinh).
    const nhanhHuyet = await this.huyetVaKinh(bt, [...new Set([...demVi.values()].map((v) => v.id).filter((x): x is number => x != null))]);

    if (!bai.length) canhBao.push('Không có bài thuốc nào khớp cụm — kiểm lại biến thể từ vựng Đông y.');
    if (!nhanhHuyet.huyet.length)
      canhBao.push('Không có phác đồ châm cứu nào mang tên cụm này — nhánh huyệt của tháp rỗng (chỉ 110 tên bệnh và 139 phác đồ có huyệt).');
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
      ...nhanhHuyet,
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
    {
      id: number;
      ten: string;
      slug: string;
      moTa: string | null;
      soChuTri: number;
      soVi: number;
      soBai: number;
      soHuyet: number;
      soKinh: number;
      khopQua: { chuTri: string; ten: string; soHuyet: number }[];
      thap: number;
      chuTri: string[];
    }[]
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

    const kho = await this.khoTacDung();

    const cum = new Map<number, { id: number; ten: string; slug: string; moTa: string | null; chuTri: { ten: string; khoa: string }[]; soVi: number }>();
    for (const r of dong) {
      const c = cum.get(r.id) ?? { id: r.id, ten: r.ten, slug: r.slug, moTa: r.mo_ta, chuTri: [], soVi: 0 };
      c.chuTri.push({ ten: r.ten_chu_tri, khoa: boDau(r.ten_chu_tri) });
      c.soVi += soViTheoChuTri.get(r.chu_tri_id) ?? 0;
      cum.set(r.id, c);
    }

    // Một bài thuốc chỉ đếm MỘT lần cho mỗi cụm, dù khớp nhiều chủ trị của cụm đó. Huyệt cũng
    // vậy, và phải gộp bằng Set: cụm có 17 chủ trị thì một huyệt dễ trúng nhiều chủ trị cùng lúc.
    const banDoHuyet = await this.huyetTheoTen();
    // Dò MỘT lượt cho mọi khoá của mọi cụm, rồi HỢP TẬP theo cụm. Kết quả giống hệt
    // `kho.filter((x) => khoaCum.some((k) => x.includes(k))).length` — đó chính là lực lượng
    // của hợp — nhưng không phải quét lại kho cho từng khoá.
    const moiKhoa = [...new Set([...cum.values()].flatMap((c) => c.chuTri.map((x) => x.khoa)))];
    const viTriKhoa = new Map(moiKhoa.map((k, i) => [k, i]));
    const theoKhoa = new DoNhieuMau(moiKhoa).theoMau(kho);
    const ds = [...cum.values()]
      .map((c) => {
        const khoaCum = [...new Set(c.chuTri.map((x) => x.khoa))];
        const hop = new Set<number>();
        for (const k of khoaCum) {
          const i = viTriKhoa.get(k);
          if (i !== undefined) for (const j of theoKhoa[i]) hop.add(j);
        }
        const soBai = hop.size;
        const { soHuyet, soKinh, khopQua } = this.gopHuyet(
          c.chuTri.map((x) => x.ten),
          banDoHuyet,
        );
        return {
          id: c.id,
          ten: c.ten,
          slug: c.slug,
          moTa: c.moTa,
          soChuTri: c.chuTri.length,
          soVi: c.soVi,
          soBai,
          soHuyet,
          soKinh,
          // Xếp theo số huyệt giảm dần: dòng kéo nhiều huyệt nhất là dòng đáng soi trước.
          khopQua: [...khopQua].sort((a, b) => b.soHuyet - a.soHuyet).slice(0, 8),
          thap: c.soVi + soBai + soHuyet,
          chuTri: c.chuTri.map((x) => x.ten).slice(0, 12),
        };
      })
      .filter((x) => x.thap >= toiThieuThap)
      .sort((a, b) => b.thap - a.thap);
    this.demCum = { khoa, luc: Date.now(), ds };
    return ds;
  }

  /**
   * Tên bệnh / tên phác đồ → TẬP huyệt và TẬP kinh của nó. 110 + 139 tên, chừng 1.800 cạnh —
   * nhỏ và ít đổi, nên đệm chung một hạn với `ungVien`.
   *
   * ⚠️ Trả TẬP chứ không trả số đếm. Một huyệt nằm trong nhiều phác đồ của cùng một cụm là
   * chuyện thường (Túc Tam Lý có mặt khắp nơi); cộng số đếm của từng phác đồ là đếm nó nhiều
   * lần và thổi tháp lên — đo thật: "Khí hư" khớp 9 phác đồ, cộng dồn ra 103 huyệt.
   */
  private demHuyetTheoTen: { luc: number; ds: { ten: string; huyet: number[]; kinh: number[] }[] } | null = null;
  /**
   * `tac_dung` của 13.911 bài thuốc, đã `boDau`, dùng chung cho `ungVien` và `cumNguNghia`.
   * Mỗi lượt lấy là ~1,7 MB chữ qua mạng tới Aiven; hai phương thức tự lấy riêng là trả tiền
   * hai lần cho đúng một kho. Đệm cùng hạn với các đệm khác (10 phút).
   */
  private demKho: { luc: number; kho: string[] } | null = null;
  private async khoTacDung(): Promise<string[]> {
    if (this.demKho && Date.now() - this.demKho.luc < RadaHoSoService.HAN_DEM_MS) return this.demKho.kho;
    const r: { tac_dung: string }[] = await this.dataSource.query(`SELECT tac_dung FROM phuong_thang WHERE tac_dung IS NOT NULL`);
    const kho = r.map((x) => boDau(x.tac_dung));
    this.demKho = { luc: Date.now(), kho };
    return kho;
  }

  private async huyetTheoTen(): Promise<{ ten: string; huyet: number[]; kinh: number[] }[]> {
    if (this.demHuyetTheoTen && Date.now() - this.demHuyetTheoTen.luc < RadaHoSoService.HAN_DEM_MS) return this.demHuyetTheoTen.ds;
    const hang: { ten: string; id_huyet: number; id_kinh_mach: number | null }[] = await this.dataSource.query(
      `SELECT b.tieuket AS ten, p.id_huyet, h.id_kinh_mach
         FROM benh_dong_y b JOIN phac_do_dieu_tri p ON p.id_benh = b.id JOIN huyet_vi h ON h.id_huyet = p.id_huyet
        WHERE b.tieuket IS NOT NULL
       UNION ALL
       SELECT c.ten, x.id_huyet, h.id_kinh_mach
         FROM phac_do_chuan c JOIN phac_do_chuan_huyet x ON x.id_phac_do_chuan = c.id JOIN huyet_vi h ON h.id_huyet = x.id_huyet
        WHERE c.ten IS NOT NULL`,
    );
    const theo = new Map<string, { huyet: Set<number>; kinh: Set<number> }>();
    for (const r of hang) {
      const o = theo.get(r.ten) ?? { huyet: new Set<number>(), kinh: new Set<number>() };
      o.huyet.add(Number(r.id_huyet));
      if (r.id_kinh_mach != null) o.kinh.add(Number(r.id_kinh_mach));
      theo.set(r.ten, o);
    }
    const ds = [...theo].map(([ten, o]) => ({ ten, huyet: [...o.huyet], kinh: [...o.kinh] }));
    this.demHuyetTheoTen = { luc: Date.now(), ds };
    return ds;
  }

  /**
   * Gộp tập huyệt/kinh của MỌI tên khớp với bất kỳ cách gọi nào trong `cach`.
   * Gộp bằng Set — xem ghi chú ở `huyetTheoTen`.
   *
   * ⚠️ ĐÃ THỬ VÀ ĐÃ BỎ một cờ "lạc đàn": gắn cờ khi cả nhánh huyệt của một cụm nhiều chủ trị
   * chỉ đến từ MỘT chủ trị. Đo 03/10/2026: nó bắn **38/62 cụm**, và phần lớn là vu oan —
   * "Đau nhức xương khớp & Phong thấp" ← "Yêu Thống" là ĐÚNG, chỉ là trong 16 chủ trị của cụm
   * chỉ một cái có phác đồ (cả kho chỉ có 110 + 139 tên phác đồ). Một chủ trị khớp lẻ loi KHÔNG
   * phải bằng chứng xếp nhầm cụm. Chỗ xếp nhầm thật ("Yêu Thống" nằm trong cụm đau đầu) phải
   * nhìn bằng nghĩa, không đếm được bằng cách này — `khopQua` hiện ra là đủ để người tự thấy.
   */
  private gopHuyet(cach: string[], banDo: { ten: string; huyet: number[]; kinh: number[] }[]) {
    const huyet = new Set<number>();
    const kinh = new Set<number>();
    const khopTen: string[] = [];
    const khopQua: { chuTri: string; ten: string; soHuyet: number }[] = [];
    for (const t of banDo) {
      // ⚠️ Ghi lại CẢ HAI ĐẦU của phép khớp. Cụm ngữ nghĩa gom tới 17 chủ trị, nên một chủ trị
      // lạc vào cụm là kéo trọn phác đồ của nó sang — đo 03/10/2026: cụm "Ung nhọt, Lở loét &
      // Da liễu" nhận 98 huyệt qua "Trúng Phong" và "Gout (Thống phong)". Không ghi lại đầu
      // CHỦ TRỊ thì con số 98 trông như sự thật và không ai lần ngược được.
      const qua = cach.find((c) => khopTenNhuCau(c, t.ten));
      if (!qua) continue;
      khopTen.push(t.ten);
      khopQua.push({ chuTri: qua, ten: t.ten, soHuyet: t.huyet.length });
      for (const h of t.huyet) huyet.add(h);
      for (const k of t.kinh) kinh.add(k);
    }
    return { soHuyet: huyet.size, soKinh: kinh.size, khopTen, khopQua };
  }

  /**
   * Nhánh HUYỆT + KINH của tháp. Trước 03/10/2026 hồ sơ chỉ có thuốc, nên trên một site Đông y
   * có 445 huyệt và 18 đường kinh, KHÔNG cụm huyệt nào có thể thành khoảng trống — xem ghi chú
   * ở `khopTenNhuCau`.
   *
   * Hai đường vào, cả hai đều là KHOÁ NGOẠI thật, không đoán:
   *   phác đồ điều trị (`benh_dong_y` → `phac_do_dieu_tri`) và phác đồ chuẩn (`phac_do_chuan`).
   * Chỉ phép khớp TÊN BỆNH ↔ TÊN CỤM là so chữ, và nó so hai danh mục ngắn có kiểm soát
   * (110 + 139 tên), không so vào văn xuôi.
   *
   * @param idVi id vị thuốc đang có mặt trong các bài thuốc của cụm — để lấy quy kinh.
   */
  private async huyetVaKinh(
    bt: string[],
    idVi: number[],
  ): Promise<Pick<HoSoCum, 'huyet' | 'phacDoKhop' | 'kinhTheoHuyet' | 'kinhTheoViThuoc'>> {
    const [benh, phacDo]: [{ id: number; ten: string }[], { id: number; ten: string }[]] = await Promise.all([
      this.dataSource.query(`SELECT id, tieuket AS ten FROM benh_dong_y WHERE tieuket IS NOT NULL`),
      this.dataSource.query(`SELECT id, ten FROM phac_do_chuan WHERE ten IS NOT NULL`),
    ]);
    const hop = (ds: { id: number; ten: string }[]) => ds.filter((x) => bt.some((c) => khopTenNhuCau(c, x.ten)));
    const benhKhop = hop(benh);
    const phacDoKhop = hop(phacDo);
    if (!benhKhop.length && !phacDoKhop.length)
      return { huyet: [], phacDoKhop: [], kinhTheoHuyet: [], kinhTheoViThuoc: await this.kinhCuaVi(idVi) };

    type Hang = { id_huyet: number; ten_huyet: string; ma_huyet: string | null; kinh: string | null; vai_tro: string | null; tu: number };
    const hang: Hang[] = [];
    if (benhKhop.length)
      hang.push(
        ...(await this.dataSource.query(
          `SELECT h.id_huyet, h.ten_huyet, h.ma_huyet, k.ten_kinh_mach AS kinh, p.vai_tro_huyet AS vai_tro, p.id_benh AS tu
             FROM phac_do_dieu_tri p
             JOIN huyet_vi h ON h.id_huyet = p.id_huyet
             LEFT JOIN kinh_mach k ON k.id_kinh_mach = h.id_kinh_mach
            WHERE p.id_benh = ANY($1)`,
          [benhKhop.map((x) => x.id)],
        )),
      );
    if (phacDoKhop.length)
      hang.push(
        ...(await this.dataSource.query(
          `SELECT h.id_huyet, h.ten_huyet, h.ma_huyet, k.ten_kinh_mach AS kinh, c.vai_tro_huyet AS vai_tro, c.id_phac_do_chuan AS tu
             FROM phac_do_chuan_huyet c
             JOIN huyet_vi h ON h.id_huyet = c.id_huyet
             LEFT JOIN kinh_mach k ON k.id_kinh_mach = h.id_kinh_mach
            WHERE c.id_phac_do_chuan = ANY($1)`,
          [phacDoKhop.map((x) => x.id)],
        )),
      );

    // Nguồn y văn đứng sau từng huyệt (`nguon_huyet`, 2.505 cạnh) — chiều cao tháp của nhánh này.
    const idH = [...new Set(hang.map((h) => h.id_huyet))];
    const demNguon = new Map<number, number>();
    if (idH.length)
      for (const r of (await this.dataSource.query(
        `SELECT huyet_id, COUNT(*)::int AS n FROM nguon_huyet WHERE huyet_id = ANY($1) GROUP BY 1`,
        [idH],
      )) as { huyet_id: number; n: number }[])
        demNguon.set(Number(r.huyet_id), Number(r.n));

    const theoHuyet = new Map<number, HuyetTrongHoSo>();
    const demKinh = new Map<string, number>();
    for (const h of hang) {
      if (!theoHuyet.has(h.id_huyet))
        theoHuyet.set(h.id_huyet, {
          ten: h.ten_huyet,
          ma: h.ma_huyet,
          // ⚠️ KHÔNG dựng đường `/huyet/...` ở đây. Trang huyệt tĩnh khoá theo SLUG TÊN
          // ("Á Môn" → /huyet/a-mon/), và slug đó do CMS giữ — có cả bản khử trùng
          // ("a-huyet-1", "a-huyet-2"). Suy slug từ tên ở phía backend là đoán, mà đoán trật
          // thì sinh link chết trong bài viết. Plugin tra slug thật trong bộ CMS rồi gắn.
          kinh: h.kinh,
          vaiTro: h.vai_tro,
          soNguonDan: demNguon.get(Number(h.id_huyet)) ?? 0,
        });
      if (h.kinh) demKinh.set(h.kinh, (demKinh.get(h.kinh) ?? 0) + 1);
    }
    const demTheoPhacDo = (ds: { id: number; ten: string }[], nguon: 'benh' | 'phac_do') =>
      ds.map((x) => ({ ten: x.ten, nguon, soHuyet: new Set(hang.filter((h) => h.tu === x.id).map((h) => h.id_huyet)).size }));

    return {
      huyet: [...theoHuyet.values()].sort((a, b) => b.soNguonDan - a.soNguonDan).slice(0, 24),
      phacDoKhop: [...demTheoPhacDo(benhKhop, 'benh'), ...demTheoPhacDo(phacDoKhop, 'phac_do')].sort((a, b) => b.soHuyet - a.soHuyet),
      kinhTheoHuyet: [...demKinh].map(([ten, so]) => ({ ten, maSo: null, so })).sort((a, b) => b.so - a.so),
      kinhTheoViThuoc: await this.kinhCuaVi(idVi),
    };
  }

  /**
   * Quy kinh của các vị thuốc trong cụm — đường đo kinh ĐỘC LẬP với đường huyệt. Hai bảng
   * xếp cạnh nhau chính là thứ đáng viết: "thuốc quy kinh Phế, huyệt cũng nằm trên kinh Phế".
   */
  private async kinhCuaVi(idVi: number[]): Promise<KinhTrongHoSo[]> {
    if (!idVi.length) return [];
    const r: { ten: string; ky_hieu: string | null; n: number }[] = await this.dataSource.query(
      `SELECT k.ten_kinh_mach AS ten, k.ky_hieu_quoc_te AS ky_hieu, COUNT(*)::int AS n
         FROM vi_thuoc_kinh_mach v JOIN kinh_mach k ON k.id_kinh_mach = v.id_kinh_mach
        WHERE v.id_vi_thuoc = ANY($1) GROUP BY 1, 2 ORDER BY n DESC`,
      [idVi],
    );
    return r.map((x) => ({ ten: x.ten, maSo: x.ky_hieu, so: Number(x.n) }));
  }

  /**
   * Ứng viên khoảng trống: chủ trị có THÁP DÀY. Lọc "đã có trang nhắm nhu cầu" là việc của
   * plugin (nó biết các bộ CMS); ở đây chỉ đo tháp.
   *
   * Đếm vị thuốc bằng bảng nối (nhanh), đếm bài thuốc bằng một lượt quét duy nhất trong Node —
   * subquery ILIKE theo từng dòng chủ trị là 3.588 lượt quét toàn bảng, đã đo quá 120 giây.
   */
  async ungVien(
    toiThieuVi = 8,
    toiThieuThap = 25,
  ): Promise<{ ten: string; soVi: number; soBai: number; soHuyet: number; soKinh: number; thap: number; khopTen: string[] }[]> {
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
    const kho = await this.khoTacDung();
    const banDoHuyet = await this.huyetTheoTen();
    // MỘT lượt dò cho mọi chủ trị. Quét thẳng tay là (số chủ trị × 13.911) phép so chuỗi —
    // xem ghi chú ở da-mau.util.ts, chính nó làm màn Khoảng trống chờ 10 giây.
    const khoaChuTri = ct.map((r) => boDau(r.ten_chu_tri));
    const theoKhoa = new DoNhieuMau(khoaChuTri).theoMau(kho);
    const ds = ct
      .map((r, i) => {
        const soBai = theoKhoa[i].size;
        // ⚠️ `soKinh` KHÔNG cộng vào tháp: cả kho chỉ có 18 đường kinh nên nó gần như là hằng
        // số — cộng vào chỉ làm mọi con số to lên đều nhau mà thứ tự không đổi. Nó ở đây để
        // người đọc biết cụm chạm tới mấy đường kinh, không phải để xếp hạng.
        // `khopTen` hiện ra trên màn: phép khớp tên là chỗ dễ vu oan nhất của nhánh này, nên
        // người đọc phải thấy được NÓ ĐÃ KHỚP VÀO ĐÂU mà không phải mở CSDL.
        const { soHuyet, soKinh, khopTen } = this.gopHuyet([r.ten_chu_tri], banDoHuyet);
        return { ten: r.ten_chu_tri, soVi: Number(r.n), soBai, soHuyet, soKinh, thap: Number(r.n) + soBai + soHuyet, khopTen: khopTen.slice(0, 6) };
      })
      .filter((x) => x.thap >= toiThieuThap)
      .sort((a, b) => b.thap - a.thap);
    this.demUngVien = { khoa, luc: Date.now(), ds };
    return ds;
  }
  /** Đệm sức khoẻ nền: ba trụ dưới đây quét vài bảng lớn, không nên tính lại cho mỗi lần mở tab. */
  private demNen: { luc: number; kq: SucKhoeNen } | null = null;
  private static readonly HAN_NEN_MS = 10 * 60 * 1000;

  /**
   * SỨC KHOẺ NỀN — bốn trụ của kho tri thức (vòng NỀN của Rada SEO).
   *
   * Người dùng chốt 06/10/2026: "kho đầy đủ và có hệ thống" đo bằng Tháp · Nguồn · Semantic ·
   * Chữ. Ba trụ đầu sống ở `defaultdb` nên tính ngay đây; trụ Chữ sống ở `kinhlac_cms` (bảng
   * `td_ho_so` của bot thẩm định) và KHÔNG join chéo được, nên nó đi đường riêng — xem `chuaDo`.
   *
   * ⚠️ Số đo thật 06/10/2026, để lần sau ai thấy số lạ thì biết mốc: bài thuốc 13.939/32.197
   * (43,3%), vị thuốc 205/4.085 (5,0%), huyệt 433/1.053 (41,1%). Vị thuốc là lỗ lớn nhất.
   */
  async sucKhoeNen(): Promise<SucKhoeNen> {
    if (this.demNen && Date.now() - this.demNen.luc < RadaHoSoService.HAN_NEN_MS)
      return { ...this.demNen.kq, tuDem: true };

    const mot = async (sql: string): Promise<DemNguon> => {
      const r = (await this.dataSource.query(sql)) as Array<{ co: number; tong: number }>;
      return { co: Number(r?.[0]?.co ?? 0), tong: Number(r?.[0]?.tong ?? 0) };
    };

    // TRỤ NGUỒN — mỗi mục có dẫn được về một cuốn sách không. Đây là trụ E-E-A-T thật của site,
    // và là thứ đối thủ bệnh viện không có.
    const nguon = xepLoNguon({
      bai: await mot(
        'select count(*)::int tong, count(distinct n.phuong_thang_id)::int co from phuong_thang p left join nguon_phuong_thang n on n.phuong_thang_id = p.id',
      ),
      vi: await mot('select count(*)::int tong, count(distinct n.vi_thuoc_id)::int co from vi_thuoc v left join nguon_vi_thuoc n on n.vi_thuoc_id = v.id'),
      huyet: await mot(
        'select count(*)::int tong, count(distinct n.huyet_id)::int co from huyet_vi h left join nguon_huyet n on n.huyet_id = h.id_huyet',
      ),
    });

    // TRỤ SEMANTIC — 657 cụm. Chủ trị nằm ở HAI cụm là BÌNH THƯỜNG ("Đau thần kinh tọa" thuộc
    // cả cơ xương khớp lẫn thần kinh), nên con số này KHÔNG phải lỗi; nó là chỗ đáng NHÌN BẰNG
    // NGHĨA. Đừng dựng phép dò tự động ở đây — đã thử và bắn 38/62 cụm, phần lớn vu oan.
    const sem = (await this.dataSource.query(
      'select (select count(*)::int from kl_seo_semantic_cluster) so_cum, (select count(*)::int from (select chu_tri_id from kl_seo_semantic_chu_tri group by chu_tri_id having count(*) > 1) t) chu_tri_nhieu_cum',
    )) as Array<{ so_cum: number; chu_tri_nhieu_cum: number }>;

    const kq: SucKhoeNen = {
      nguon,
      semantic: { soCum: Number(sem?.[0]?.so_cum ?? 0), chuTriNhieuCum: Number(sem?.[0]?.chu_tri_nhieu_cum ?? 0) },
      // ⚠️ Nói THẲNG cái gì chưa đo được và vì sao — im lặng ở đây đọc ra như "trụ đó đã sạch".
      chuaDo: [
        'Trụ CHỮ (bot thẩm định: mục hạng hỏng/yếu) sống ở kho kinhlac_cms, không join chéo với kho app — xem ở /app/tham-dinh.',
        'Tầng Bệnh học và Châm cứu trị bệnh của tháp đo ở phía CMS (bộ benh_hoc, cham_cuu_tri_benh), không ở đây.',
      ],
      tuDem: false,
    };
    this.demNen = { luc: Date.now(), kq };
    return kq;
  }

}
