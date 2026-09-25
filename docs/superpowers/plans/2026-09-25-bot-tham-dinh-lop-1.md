# Bot Thẩm Định Thư Viện — Kế hoạch 1: nền móng + lớp máy quét

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng bệnh án cho từng mục từ trong thư viện và một lớp máy quét chạy mỗi đêm, kết tinh phát hiện thành cụm việc nộp vào tab "Góp Ý & Lỗi" — không gọi mô hình ngôn ngữ lần nào.

**Architecture:** Dịch vụ chạy trong backend NestJS (`defaultdb`), mở một kết nối `pg` tạm sang database `kinhlac_cms` để đọc kho và ghi hai bảng bệnh án. Các phép dò viết thành hàm thuần trong `src/utils/` để test không cần database. Cụm việc nộp bằng cách gọi thẳng `SuCoService.ghiNhanLo()` trong tiến trình, không đi qua HTTP.

**Tech Stack:** NestJS 11, TypeORM (cho `defaultdb`), `pg` Client thuần (cho `kinhlac_cms`), Jest, `@nestjs/schedule`.

**Spec:** `docs/superpowers/specs/2026-09-25-bot-tham-dinh-thu-vien-design.md`

## Global Constraints

- **Ngôn ngữ nghiệp vụ là tiếng Việt.** Tên bảng, cột, hàm, biến nghiệp vụ dùng từ Việt không dấu (`thamDinh`, `nhanXet`, `vanTayNoiDung`). Không dịch sang tiếng Anh.
- **Quy ước đặt tên ngược của repo:** `src/routers/*.router.ts` là `@Controller`; `src/controllers/*.controller.ts` là `@Injectable` service. Theo đúng lối này.
- **Đăng ký thủ công trong `src/app.module.ts`** — cả ba danh sách (`TypeOrmModule.forFeature`, `controllers`, `providers`). Không có tự động dò.
- **Không giữ pool thường trực thứ hai.** Cụm Aiven `max_connections = 20`, đang dùng 12, backend pool `max: 10`. Kết nối sang `kinhlac_cms` phải mở lúc vào ca, đóng lúc hết ca, dùng `pg.Client` (một kết nối) chứ không phải `pg.Pool`.
- **Mọi nhận xét phải có `trich_dan`** — nguyên văn câu bị phê. Không trích được thì không ghi.
- **Route nộp cụm là đường của BỘ** (`/huyet/`), không kèm slug. `chuanHoaRoute` chỉ thay số bằng `:id`, slug chữ giữ nguyên.
- **Bot chỉ ĐỌC `kinhlac_cms`** ở kế hoạch này; không ghi vào bảng `ec_*` một dòng nào.
- **`npm run build` dùng SWC, KHÔNG kiểm kiểu.** Phép kiểm kiểu thật là `npm run type-check`. Chạy nó trước mỗi commit.
- **`npm run lint` GHI ĐÈ file** (chạy `--fix`). Muốn kiểm không ghi thì `npx eslint .`.

---

## File Structure

| File | Trách nhiệm |
|---|---|
| `backend/src/utils/tham-dinh-chu.util.ts` | Phép dò trên MỘT chuỗi: rác di sản D1–D6, lỗi dấu câu. Hàm thuần, không I/O. |
| `backend/src/utils/tham-dinh-chu.util.spec.ts` | Test cho trên. |
| `backend/src/utils/tham-dinh-muc.util.ts` | Phép dò trên MỘT mục từ: thiếu trường, thiếu trường cốt lõi, trộn trường. Khung trường của 8 bộ. |
| `backend/src/utils/tham-dinh-muc.util.spec.ts` | Test cho trên. |
| `backend/src/utils/tham-dinh-cum.util.ts` | Gom nhận xét thành cụm việc; dựng thông điệp; vân tay nội dung. |
| `backend/src/utils/tham-dinh-cum.util.spec.ts` | Test cho trên. |
| `backend/src/models/tham-dinh.dto.ts` | Kiểu dữ liệu: `NhanXet`, `HoSoMuc`, `CumViec`, `MucKho`. |
| `backend/src/controllers/tham-dinh-cms.service.ts` | Kết nối tạm sang `kinhlac_cms`: mở/đóng, DDL bệnh án idempotent, đọc kho theo lô, ghi hồ sơ + nhận xét. |
| `backend/src/controllers/tham-dinh.controller.ts` | Điều phối ca soi lớp 1, kết tinh cụm, nộp `su_co`, `@Cron`. |
| `backend/src/routers/tham-dinh.router.ts` | API cho tab: chạy tay, xem hồ sơ một mục, thống kê. |
| `backend/src/app.module.ts` | Đăng ký service + router (sửa). |

---

### Task 1: Phép dò rác di sản và dấu câu

**Files:**
- Create: `backend/src/utils/tham-dinh-chu.util.ts`
- Test: `backend/src/utils/tham-dinh-chu.util.spec.ts`

**Interfaces:**
- Consumes: không
- Produces:
  - `export type MaLoiChu = 'rac_nhi_phan' | 'dau_thanh_hong' | 'chu_han_chua_dich' | 'mojibake' | 'tcvn3' | 'dau_cau_sai'`
  - `export interface LoiChu { ma: MaLoiChu; trichDan: string; viTri: number }`
  - `export function doChu(s: string): LoiChu[]`

- [ ] **Step 1: Viết test thất bại**

Tạo `backend/src/utils/tham-dinh-chu.util.spec.ts`:

```typescript
import { doChu } from './tham-dinh-chu.util';

/**
 * Sáu dạng rác di sản đến từ bộ đọc file .dat của app Windows cũ (trượt offset).
 * D5 (mojibake) và D6 (TCVN3) PHẢI dò riêng: mọi ký tự của chúng đều "hợp lệ"
 * nên phép kiểm tập ký tự không thấy gì. Đây là bài học đã trả giá một lần.
 */
describe('doChu — rác di sản', () => {
  it('bắt mojibake: UTF-8 bị đọc như Latin-1', () => {
    const loi = doChu('Triá»‡u chá»©ng: sốt cao');
    expect(loi.map((l) => l.ma)).toContain('mojibake');
  });

  it('bắt TCVN3: bảng mã font cũ chưa chuyển', () => {
    const loi = doChu('NguyÔn Ngäc Bich biên soạn');
    expect(loi.map((l) => l.ma)).toContain('tcvn3');
  });

  it('bắt dấu thanh hỏng — rác CHÍNH LÀ dấu thanh bị vỡ', () => {
    const loi = doChu('Ba·c hà tri· ho');
    expect(loi.map((l) => l.ma)).toContain('dau_thanh_hong');
  });

  it('bắt chữ Hán lẫn giữa câu tiếng Việt', () => {
    const loi = doChu('Tiêu痞 tán kết');
    expect(loi.map((l) => l.ma)).toContain('chu_han_chua_dich');
  });

  it('KHÔNG báo khi cả chuỗi là chữ Hán — đó là tên Hán hợp lệ', () => {
    expect(doChu('合谷').map((l) => l.ma)).not.toContain('chu_han_chua_dich');
  });

  it('bắt khoảng trắng thừa trước dấu câu', () => {
    const loi = doChu('Chủ trị : đau đầu , chóng mặt');
    expect(loi.map((l) => l.ma)).toContain('dau_cau_sai');
  });

  it('chuỗi sạch thì không báo gì', () => {
    expect(doChu('Hợp Cốc — huyệt Nguyên của kinh Thủ Dương minh Đại trường.')).toEqual([]);
  });

  it('trả về nguyên văn câu bị phê, không phải cả bài', () => {
    const loi = doChu('Câu sạch đứng trước. Câu hỏng Ba·c hà nằm giữa. Câu sạch đứng sau.');
    expect(loi[0].trichDan).toContain('Ba·c hà');
    expect(loi[0].trichDan).not.toContain('Câu sạch đứng trước');
  });
});
```

- [ ] **Step 2: Chạy test cho chắc là nó hỏng**

Run: `npm test --prefix backend -- tham-dinh-chu`
Expected: FAIL — `Cannot find module './tham-dinh-chu.util'`

- [ ] **Step 3: Viết bản cài đặt tối thiểu**

Tạo `backend/src/utils/tham-dinh-chu.util.ts`:

```typescript
/**
 * Phép dò rác ký tự trên MỘT chuỗi. Hàm thuần, không I/O — để test chạy không cần database.
 *
 * Logic chép từ `backend/sql/audit-rac-tu-dien.sql` (bản SQL chỉ đọc, dò 6 dạng D1–D6).
 * Giữ hai bản là cố ý: bản SQL để rà toàn kho bằng psql khi cần con số tổng, bản này để
 * ghi nhận xét kèm TRÍCH DẪN cho từng mục.
 */

export type MaLoiChu =
  | 'rac_nhi_phan'
  | 'dau_thanh_hong'
  | 'chu_han_chua_dich'
  | 'mojibake'
  | 'tcvn3'
  | 'dau_cau_sai';

export interface LoiChu {
  ma: MaLoiChu;
  /** Nguyên văn câu chứa lỗi — thứ giữ cho lời phê kiểm chứng được. */
  trichDan: string;
  viTri: number;
}

/** Cắt chuỗi thành câu để trích dẫn gọn. Xuống dòng cũng tính là hết câu. */
function cacCau(s: string): Array<{ cau: string; tu: number }> {
  const ra: Array<{ cau: string; tu: number }> = [];
  const re = /[^.!?\n]+[.!?]?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    const cau = m[0].trim();
    if (cau) ra.push({ cau, tu: m.index });
  }
  return ra.length ? ra : [{ cau: s.trim(), tu: 0 }];
}

// D5 — mojibake: dấu tiếng Việt UTF-8 bị đọc như Latin-1 ("Triá»‡u chá»©ng").
const RE_MOJIBAKE = /Ã.|á»./;

// D6 — TCVN3/ABC: chữ hoa Latin-1 lọt vào giữa từ tiếng Việt ("NguyÔn Ngäc").
const RE_TCVN3 = /[a-zà-ỹ][ÔÕÖÐÝÞßäëïöüÿ]|[ÔÕÖÐÝÞßäëïöüÿ][a-zà-ỹ]/;

// D2 — dấu thanh hỏng: ký tự dấu câu Latin-1 dính liền chữ ("Ba·c hà", "tri·").
const RE_DAU_HONG = /[a-zà-ỹ][·¸¹º»¼½¾][a-zà-ỹ ]|[a-zà-ỹ][·¸¹º»¼½¾](?=\s|$)/i;

// D1 — rác nhị phân: ký tự điều khiển, hoặc bảng chữ không liên quan (Cyrillic, Armenian, Tamil).
const RE_NHI_PHAN = /[\u0000-\u0008\u000B\u000C\u000E-\u001FЀ-ӿ԰-֏஀-௿]/;

const RE_HAN = /[㐀-䶿一-鿿豈-﫿]/;
const RE_VIET = /[a-zà-ỹ]/i;

// Dấu câu: khoảng trắng đứng TRƯỚC dấu, hoặc thiếu khoảng trắng SAU dấu giữa hai chữ.
const RE_DAU_CAU = /\s+[,;:.!?]|[,;](?=\S)/;

export function doChu(s: string): LoiChu[] {
  if (typeof s !== 'string' || !s.trim()) return [];
  const ra: LoiChu[] = [];

  for (const { cau, tu } of cacCau(s)) {
    const them = (ma: MaLoiChu) => ra.push({ ma, trichDan: cau, viTri: tu });

    if (RE_NHI_PHAN.test(cau)) them('rac_nhi_phan');
    if (RE_MOJIBAKE.test(cau)) them('mojibake');
    if (RE_TCVN3.test(cau)) them('tcvn3');
    if (RE_DAU_HONG.test(cau)) them('dau_thanh_hong');

    // Chữ Hán CHỈ là lỗi khi lẫn trong câu tiếng Việt. Cả câu là chữ Hán thì đó là
    // tên Hán hợp lệ (ten_han, ten_pinyin) — đã đo: 832 dòng hợp lệ, đừng báo nhầm.
    if (RE_HAN.test(cau) && RE_VIET.test(cau)) them('chu_han_chua_dich');

    if (RE_DAU_CAU.test(cau)) them('dau_cau_sai');
  }
  return ra;
}
```

- [ ] **Step 4: Chạy test cho tới khi xanh**

Run: `npm test --prefix backend -- tham-dinh-chu`
Expected: PASS, 8 ca.

- [ ] **Step 5: Kiểm kiểu rồi commit**

```bash
cd backend && npm run type-check && cd ..
git add backend/src/utils/tham-dinh-chu.util.ts backend/src/utils/tham-dinh-chu.util.spec.ts
git commit -m "feat(tham-dinh): phép dò rác di sản và dấu câu trên một chuỗi"
```

---

### Task 2: Phép dò trên một mục từ — thiếu trường, trộn trường

**Files:**
- Create: `backend/src/utils/tham-dinh-muc.util.ts`
- Test: `backend/src/utils/tham-dinh-muc.util.spec.ts`

**Interfaces:**
- Consumes: `LoiChu`, `MaLoiChu`, `doChu` từ Task 1
- Produces:
  - `export interface MucKho { bo: string; ma: string; slug: string; tieuDe: string; truong: Record<string, string> }`
  - `export interface NhanXetTho { kieu: string; truong: string | null; trichDan: string; nhanXet: string; nang: boolean }`
  - `export const KHUNG_TRUONG: Record<string, { than: string[]; cotLoi: string[] }>`
  - `export function doMuc(m: MucKho): NhanXetTho[]`

- [ ] **Step 1: Viết test thất bại**

Tạo `backend/src/utils/tham-dinh-muc.util.spec.ts`:

```typescript
import { doMuc, KHUNG_TRUONG, type MucKho } from './tham-dinh-muc.util';

function muc(bo: string, truong: Record<string, string>): MucKho {
  return { bo, ma: 'X1', slug: 'thu-nghiem', tieuDe: 'Mục thử', truong };
}

describe('KHUNG_TRUONG', () => {
  it('khai đủ 8 bộ của thư viện', () => {
    expect(Object.keys(KHUNG_TRUONG).sort()).toEqual(
      [
        'bai_thuoc', 'bai_viet', 'benh_hoc', 'cham_cuu_tri_benh',
        'duoc_lieu', 'huyet_vi', 'kinh_mach', 'nguon_y_van',
      ].sort(),
    );
  });

  it('trường cốt lõi luôn nằm trong danh sách trường thân bài', () => {
    for (const [bo, k] of Object.entries(KHUNG_TRUONG)) {
      for (const c of k.cotLoi) {
        expect(k.than).toContain(c);
      }
      expect(bo).toBeTruthy();
    }
  });
});

describe('doMuc — thiếu trường', () => {
  it('huyệt thiếu vi_tri là lỗi NẶNG (trường cốt lõi)', () => {
    const r = doMuc(muc('huyet_vi', { tac_dung: 'Sơ phong', vi_tri: '' }));
    const l = r.find((x) => x.kieu === 'thieu_truong_cot_loi' && x.truong === 'vi_tri');
    expect(l).toBeDefined();
    expect(l!.nang).toBe(true);
  });

  it('huyệt thiếu ghi_chu chỉ là lỗi thường', () => {
    const r = doMuc(muc('huyet_vi', { vi_tri: 'Chỗ lõm…', ghi_chu: '' }));
    const l = r.find((x) => x.truong === 'ghi_chu');
    expect(l!.kieu).toBe('thieu_truong');
    expect(l!.nang).toBe(false);
  });
});

describe('doMuc — trộn trường', () => {
  /**
   * Nợ đã ghi trong sổ tay: 7.129 phần tử trong thanh_phan thực ra là CÁCH DÙNG,
   * trên 6.491 bài; 4.140 bài có cach_dung TRỐNG vì nội dung bị nhét sang chỗ khác.
   * Bốc ngẫu nhiên một bài lúc khảo sát đã trúng ngay một ca.
   */
  it('bắt cách dùng bị nhét vào thành phần', () => {
    const r = doMuc(
      muc('bai_thuoc', {
        thanh_phan: 'Chích thảo 4g Đảng sâm 4g Trúc diệp 20g Sắc uống.',
        cach_dung: '',
      }),
    );
    const l = r.find((x) => x.kieu === 'tron_truong');
    expect(l).toBeDefined();
    expect(l!.trichDan).toContain('Sắc uống');
  });

  it('KHÔNG báo trộn khi cach_dung đã có nội dung riêng', () => {
    const r = doMuc(
      muc('bai_thuoc', {
        thanh_phan: 'Chích thảo 4g Đảng sâm 4g',
        cach_dung: 'Sắc uống ngày một thang.',
      }),
    );
    expect(r.find((x) => x.kieu === 'tron_truong')).toBeUndefined();
  });
});

describe('doMuc — chuyển tiếp lỗi chữ', () => {
  it('lỗi chữ trong một trường được gắn đúng tên trường', () => {
    const r = doMuc(muc('huyet_vi', { vi_tri: 'Ba·c hà nằm ở đây' }));
    const l = r.find((x) => x.kieu === 'dau_thanh_hong');
    expect(l!.truong).toBe('vi_tri');
  });
});
```

- [ ] **Step 2: Chạy test cho chắc là nó hỏng**

Run: `npm test --prefix backend -- tham-dinh-muc`
Expected: FAIL — `Cannot find module './tham-dinh-muc.util'`

- [ ] **Step 3: Viết bản cài đặt**

Tạo `backend/src/utils/tham-dinh-muc.util.ts`:

```typescript
import { doChu } from './tham-dinh-chu.util';

/** Một mục từ đã rút chữ khỏi portable text, sẵn sàng để soi. */
export interface MucKho {
  bo: string;
  ma: string;
  slug: string;
  tieuDe: string;
  /** tên cột → chữ thuần của cột đó */
  truong: Record<string, string>;
}

export interface NhanXetTho {
  kieu: string;
  truong: string | null;
  trichDan: string;
  nhanXet: string;
  /** Lỗi chặn người đọc hiểu được mục → nâng hạng cụm. */
  nang: boolean;
}

/**
 * Khung trường của 8 bộ. `than` chép từ `cms/scripts-di-cu/dung-chi-muc.mjs` — phải khớp,
 * vì đó cũng là danh sách cột được đưa vào ô tìm kiếm.
 *
 * `cotLoi` là phán đoán nghiệp vụ: thiếu nó thì mục VÔ DỤNG với người đọc, không chỉ là
 * thiếu sót. Huyệt không có vị trí thì không châm được; bài thuốc không có thành phần thì
 * không phải bài thuốc.
 */
export const KHUNG_TRUONG: Record<string, { than: string[]; cotLoi: string[] }> = {
  huyet_vi: {
    than: ['y_nghia_ten', 'dac_tinh', 'vi_tri', 'giai_phau', 'tac_dung', 'chu_tri',
           'cham_cuu', 'xuat_xu', 'pho_huyet', 'ghi_chu', 'tham_khao'],
    cotLoi: ['vi_tri', 'tac_dung', 'chu_tri'],
  },
  kinh_mach: {
    than: ['dai_cuong', 'dac_tinh', 'van_hanh', 'duong_chinh', 'kinh_can', 'kinh_biet',
           'lac_doc', 'lac_ngang', 'trieu_chung', 'chu_tri', 'dieu_tri'],
    cotLoi: ['duong_chinh', 'chu_tri'],
  },
  cham_cuu_tri_benh: {
    than: ['dai_cuong', 'nguyen_nhan', 'trieu_chung', 'dieu_tri'],
    cotLoi: ['trieu_chung', 'dieu_tri'],
  },
  benh_hoc: {
    than: ['dai_cuong', 'nguyen_nhan', 'chan_doan', 'dieu_tri', 'benh_an', 'tham_khao'],
    cotLoi: ['nguyen_nhan', 'chan_doan', 'dieu_tri'],
  },
  duoc_lieu: {
    than: ['mo_ta', 'thanh_phan_hoa_hoc', 'duoc_ly', 'tinh_vi_quy_kinh', 'nuoi_duong',
           'bao_che', 'chu_tri', 'don_thuoc', 'xuat_xu', 'tham_khao', 'cong_dung_ds', 'kieng_ky_ds'],
    cotLoi: ['tinh_vi_quy_kinh', 'chu_tri'],
  },
  bai_thuoc: {
    than: ['thanh_phan', 'cach_dung', 'tac_dung', 'xuat_xu', 'ghi_chu'],
    cotLoi: ['thanh_phan', 'tac_dung'],
  },
  nguon_y_van: { than: ['ghi_chu', 'nien_dai', 'loai'], cotLoi: [] },
  bai_viet: { than: ['description', 'content'], cotLoi: ['content'] },
};

/**
 * Câu chỉ CÁCH DÙNG. Gặp chúng ở cuối `thanh_phan` là dấu hiệu ranh giới bản ghi legacy sai.
 * Danh sách rút từ chính kho, không phải đoán.
 */
const CUM_CACH_DUNG = [
  'sắc uống', 'ngày uống', 'tán bột', 'làm hoàn', 'chia ', 'uống với',
  'ngày một thang', 'sắc với', 'hoà uống', 'ngậm nuốt',
];

function co(s: string | undefined): boolean {
  return typeof s === 'string' && s.trim().length > 0;
}

export function doMuc(m: MucKho): NhanXetTho[] {
  const ra: NhanXetTho[] = [];
  const khung = KHUNG_TRUONG[m.bo];
  if (!khung) return ra;

  // ── Lỗi chữ trong từng trường ──────────────────────────────────────────────
  for (const [ten, chu] of Object.entries(m.truong)) {
    for (const l of doChu(chu)) {
      ra.push({
        kieu: l.ma,
        truong: ten,
        trichDan: l.trichDan,
        nhanXet: `Lỗi chữ trong trường "${ten}".`,
        nang: l.ma === 'rac_nhi_phan' || l.ma === 'mojibake' || l.ma === 'tcvn3',
      });
    }
  }

  // ── Thiếu trường ───────────────────────────────────────────────────────────
  for (const ten of khung.than) {
    if (co(m.truong[ten])) continue;
    const cotLoi = khung.cotLoi.includes(ten);
    ra.push({
      kieu: cotLoi ? 'thieu_truong_cot_loi' : 'thieu_truong',
      truong: ten,
      trichDan: '',
      nhanXet: cotLoi
        ? `Thiếu "${ten}" — thiếu trường này thì mục không dùng được.`
        : `Thiếu "${ten}".`,
      nang: cotLoi,
    });
  }

  // ── Trộn trường: cách dùng nằm trong thành phần ────────────────────────────
  const tp = m.truong['thanh_phan'] || '';
  if (tp) {
    const thap = tp.toLowerCase();
    const trung = CUM_CACH_DUNG.find((c) => thap.includes(c));
    if (trung && !co(m.truong['cach_dung'])) {
      const cau = tp.split(/(?<=[.!?])\s+/).find((c) => c.toLowerCase().includes(trung)) || tp;
      ra.push({
        kieu: 'tron_truong',
        truong: 'thanh_phan',
        trichDan: cau.trim(),
        nhanXet: 'Câu chỉ cách dùng nằm trong "thành phần", mà "cách dùng" thì trống. '
               + 'Chuyển sang đúng ô — xoá suông là mất thông tin.',
        nang: false,
      });
    }
  }

  return ra;
}
```

- [ ] **Step 4: Chạy test cho tới khi xanh**

Run: `npm test --prefix backend -- tham-dinh-muc`
Expected: PASS.

- [ ] **Step 5: Kiểm kiểu rồi commit**

```bash
cd backend && npm run type-check && cd ..
git add backend/src/utils/tham-dinh-muc.util.ts backend/src/utils/tham-dinh-muc.util.spec.ts
git commit -m "feat(tham-dinh): khung trường 8 bộ + dò thiếu trường và trộn trường"
```

---

### Task 3: Gom nhận xét thành cụm việc

**Files:**
- Create: `backend/src/utils/tham-dinh-cum.util.ts`
- Test: `backend/src/utils/tham-dinh-cum.util.spec.ts`

**Interfaces:**
- Consumes: `NhanXetTho` từ Task 2
- Produces:
  - `export interface NhanXetCoMuc extends NhanXetTho { bo: string; slug: string; tieuDe: string }`
  - `export interface CumViec { kieu: string; bo: string; route: string; thongDiep: string; moTa: string; soMuc: number; nang: boolean; slugs: string[] }`
  - `export function gomCum(ds: NhanXetCoMuc[], duongDanBo: Record<string, string>): CumViec[]`
  - `export function vanTayNoiDung(truong: Record<string, string>, than: string[]): string`

- [ ] **Step 1: Viết test thất bại**

Tạo `backend/src/utils/tham-dinh-cum.util.spec.ts`:

```typescript
import { gomCum, vanTayNoiDung, type NhanXetCoMuc } from './tham-dinh-cum.util';
import { chuanHoaRoute, tinhVanTay } from './su-co-van-tay.util';

const DUONG = { huyet_vi: '/huyet/', bai_thuoc: '/bai-thuoc/' };

function nx(slug: string, kieu = 'thieu_truong_cot_loi'): NhanXetCoMuc {
  return {
    kieu, bo: 'huyet_vi', slug, tieuDe: `Huyệt ${slug}`,
    truong: 'pho_huyet', trichDan: '', nhanXet: 'Thiếu', nang: false,
  };
}

describe('gomCum', () => {
  /**
   * Phép kiểm QUAN TRỌNG NHẤT của kế hoạch này.
   *
   * Vân tay cụm của tab Góp Ý & Lỗi là sha1(loai|route_chuan|thong_diep_chuan), và
   * chuanHoaRoute chỉ thay SỐ bằng :id — slug chữ giữ nguyên. Nộp kèm slug thì 484 mục
   * huyệt sinh 484 cụm và tab thành bãi rác trong một đêm.
   */
  it('484 nhận xét cùng kiểu trên 484 slug khác nhau → ĐÚNG 1 cụm', () => {
    const ds = Array.from({ length: 484 }, (_, i) => nx(`huyet-${i}`));
    const cum = gomCum(ds, DUONG);
    expect(cum).toHaveLength(1);
    expect(cum[0].soMuc).toBe(484);
  });

  it('route của cụm là đường của BỘ, không kèm slug', () => {
    const cum = gomCum([nx('lai-cau'), nx('hop-coc')], DUONG);
    expect(cum[0].route).toBe('/huyet/');
    expect(chuanHoaRoute(cum[0].route)).toBe('/huyet');
  });

  it('vân tay tính từ route bộ là ổn định giữa hai lần chạy', () => {
    const a = gomCum([nx('lai-cau')], DUONG)[0];
    const b = gomCum([nx('hop-coc')], DUONG)[0];
    const vt = (c: typeof a) => tinhVanTay('gop_y', chuanHoaRoute(c.route), c.thongDiep.toLowerCase());
    expect(vt(a)).toBe(vt(b));
  });

  it('kiểu lỗi khác nhau → cụm khác nhau', () => {
    const cum = gomCum([nx('a', 'thieu_truong_cot_loi'), nx('b', 'mojibake')], DUONG);
    expect(cum).toHaveLength(2);
  });

  it('cùng kiểu nhưng khác bộ → cụm khác nhau', () => {
    const ds: NhanXetCoMuc[] = [nx('a'), { ...nx('b'), bo: 'bai_thuoc' }];
    expect(gomCum(ds, DUONG)).toHaveLength(2);
  });

  it('xếp cụm nặng lên trước, rồi tới cụm nhiều mục', () => {
    const ds: NhanXetCoMuc[] = [
      ...Array.from({ length: 50 }, (_, i) => nx(`x${i}`, 'thieu_truong')),
      { ...nx('y', 'mojibake'), nang: true },
    ];
    const cum = gomCum(ds, DUONG);
    expect(cum[0].kieu).toBe('mojibake');
  });

  it('danh sách slug bị cắt ở 200 để thân cụm không phình', () => {
    const ds = Array.from({ length: 484 }, (_, i) => nx(`huyet-${i}`));
    expect(gomCum(ds, DUONG)[0].slugs).toHaveLength(200);
  });
});

describe('vanTayNoiDung', () => {
  it('nội dung không đổi → vân tay không đổi', () => {
    const a = vanTayNoiDung({ vi_tri: 'Chỗ lõm', chu_tri: 'Đau đầu' }, ['vi_tri', 'chu_tri']);
    const b = vanTayNoiDung({ chu_tri: 'Đau đầu', vi_tri: 'Chỗ lõm' }, ['vi_tri', 'chu_tri']);
    expect(a).toBe(b);
  });

  it('đổi một chữ → vân tay đổi', () => {
    const a = vanTayNoiDung({ vi_tri: 'Chỗ lõm' }, ['vi_tri']);
    const b = vanTayNoiDung({ vi_tri: 'Chỗ lõm.' }, ['vi_tri']);
    expect(a).not.toBe(b);
  });

  it('bỏ qua cột không khai trong thân bài', () => {
    const a = vanTayNoiDung({ vi_tri: 'A', ghi_chu: 'X' }, ['vi_tri']);
    const b = vanTayNoiDung({ vi_tri: 'A', ghi_chu: 'Y' }, ['vi_tri']);
    expect(a).toBe(b);
  });
});
```

- [ ] **Step 2: Chạy test cho chắc là nó hỏng**

Run: `npm test --prefix backend -- tham-dinh-cum`
Expected: FAIL — không tìm thấy module.

- [ ] **Step 3: Viết bản cài đặt**

Tạo `backend/src/utils/tham-dinh-cum.util.ts`:

```typescript
import { createHash } from 'crypto';
import type { NhanXetTho } from './tham-dinh-muc.util';

export interface NhanXetCoMuc extends NhanXetTho {
  bo: string;
  slug: string;
  tieuDe: string;
}

export interface CumViec {
  kieu: string;
  bo: string;
  /** Đường của BỘ, không kèm slug — xem ghi chú dưới. */
  route: string;
  thongDiep: string;
  moTa: string;
  soMuc: number;
  nang: boolean;
  slugs: string[];
}

/** Thân cụm chỉ liệt kê tối đa ngần này slug; phần còn lại đếm số. */
const TRAN_SLUG = 200;

const NHAN_KIEU: Record<string, string> = {
  rac_nhi_phan: 'Còn rác nhị phân trong nội dung',
  dau_thanh_hong: 'Dấu thanh tiếng Việt bị hỏng',
  chu_han_chua_dich: 'Chữ Hán chưa dịch lẫn trong câu tiếng Việt',
  mojibake: 'Lỗi mã hoá mojibake',
  tcvn3: 'Còn bảng mã TCVN3 chưa chuyển',
  dau_cau_sai: 'Lỗi dấu câu',
  thieu_truong: 'Thiếu phần nội dung',
  thieu_truong_cot_loi: 'Thiếu phần cốt lõi',
  tron_truong: 'Nội dung nằm sai ô',
};

function nhan(kieu: string, truong: string | null): string {
  const g = NHAN_KIEU[kieu] || kieu;
  return truong ? `${g} — ${truong}` : g;
}

/**
 * Gom nhận xét lẻ thành CỤM VIỆC.
 *
 * ⚠️ `route` là đường của BỘ ("/huyet/"), tuyệt đối không kèm slug. Vân tay cụm của tab
 * Góp Ý & Lỗi là sha1(loai|route_chuan|thong_diep_chuan), mà `chuanHoaRoute` chỉ thay SỐ
 * bằng ":id" — slug chữ giữ nguyên. Kèm slug vào thì 484 mục huyệt thành 484 cụm, đúng
 * thứ cơ chế vân tay dựng ra để chặn.
 */
export function gomCum(
  ds: NhanXetCoMuc[],
  duongDanBo: Record<string, string>,
): CumViec[] {
  const gom = new Map<string, { nx: NhanXetCoMuc[]; nang: boolean }>();

  for (const n of ds) {
    const khoa = `${n.bo}|${n.kieu}|${n.truong ?? ''}`;
    const o = gom.get(khoa) || { nx: [], nang: false };
    o.nx.push(n);
    o.nang = o.nang || n.nang;
    gom.set(khoa, o);
  }

  const ra: CumViec[] = [];
  for (const [khoa, o] of gom) {
    const [bo, kieu, truong] = khoa.split('|');
    const slugs = [...new Set(o.nx.map((x) => x.slug))];
    const viDu = o.nx.find((x) => x.trichDan)?.trichDan;

    ra.push({
      kieu,
      bo,
      route: duongDanBo[bo] || `/${bo}/`,
      thongDiep: nhan(kieu, truong || null),
      moTa:
        `${slugs.length} mục trong bộ "${bo}".\n` +
        (viDu ? `Ví dụ: "${viDu.slice(0, 200)}"\n` : '') +
        (slugs.length > TRAN_SLUG ? `(liệt kê ${TRAN_SLUG} mục đầu)\n` : ''),
      soMuc: slugs.length,
      nang: o.nang,
      slugs: slugs.slice(0, TRAN_SLUG),
    });
  }

  // Nặng trước, rồi nhiều mục trước — đó là thứ tự đáng làm.
  return ra.sort((a, b) => Number(b.nang) - Number(a.nang) || b.soMuc - a.soMuc);
}

/**
 * Vân tay nội dung — van tiết kiệm tiền của lớp 2: bài chưa đổi thì không gọi mô hình.
 * Chỉ tính trên các cột khai là thân bài, theo thứ tự cố định để không phụ thuộc thứ tự khoá.
 */
export function vanTayNoiDung(truong: Record<string, string>, than: string[]): string {
  const noi = [...than]
    .sort()
    .map((t) => `${t}=${(truong[t] || '').trim()}`)
    .join('\u0001');
  return createHash('sha1').update(noi).digest('hex').slice(0, 16);
}
```

- [ ] **Step 4: Chạy test cho tới khi xanh**

Run: `npm test --prefix backend -- tham-dinh-cum`
Expected: PASS, 10 ca.

- [ ] **Step 5: Kiểm kiểu rồi commit**

```bash
cd backend && npm run type-check && cd ..
git add backend/src/utils/tham-dinh-cum.util.ts backend/src/utils/tham-dinh-cum.util.spec.ts
git commit -m "feat(tham-dinh): gom nhận xét thành cụm việc, vân tay nội dung"
```

---

### Task 4: Kiểu dữ liệu bệnh án

**Files:**
- Create: `backend/src/models/tham-dinh.dto.ts`

**Interfaces:**
- Consumes: `NhanXetCoMuc`, `CumViec` từ Task 3
- Produces: `HoSoMuc`, `LuocKeCa`, `LocHoSo`, `ThongKeThamDinh`

- [ ] **Step 1: Viết file kiểu**

Tạo `backend/src/models/tham-dinh.dto.ts`:

```typescript
/**
 * Kiểu dữ liệu của bệnh án mục từ.
 *
 * ⚠️ DTO ở repo này là *type* TS thuần nên biến mất khi biên dịch — không có gì kiểm thân
 * request. Endpoint nào nhận dữ liệu ngoài phải gắn `@Body(new ZodPipe(...))`.
 * Kế hoạch này chỉ có endpoint không thân request nên chưa cần.
 */

export type HangHoSo = 'tot' | 'tam_duoc' | 'yeu' | 'hong';
export type LopSoi = 'may' | 'thay_thuoc' | 'seo';
export type TrangThaiNhanXet = 'moi' | 'da_duyet' | 'da_ap' | 'bo_qua';

export interface HoSoMuc {
  id?: number;
  bo: string;
  ma: string;
  slug: string;
  tieuDe: string;
  vanTayNoiDung: string;
  diemSach: number;
  diemMachLac: number | null;
  diemDuPhan: number;
  diemLienKet: number | null;
  diemSeo: number | null;
  hang: HangHoSo;
  uuTien: number;
  soiMayLuc: Date | null;
  soiThayThuocLuc: Date | null;
  soiSeoLuc: Date | null;
}

/** Kết quả một ca soi, trả về cho người bấm chạy tay. */
export interface LuocKeCa {
  batDau: string;
  ketThuc: string;
  soMucDoc: number;
  soMucBoQua: number;
  soNhanXet: number;
  soCum: number;
  soCumNop: number;
  loi: string[];
}

export interface LocHoSo {
  bo?: string;
  hang?: HangHoSo;
  q?: string;
  trang?: number;
  moiTrang?: number;
}

export interface ThongKeThamDinh {
  tongMuc: number;
  theoHang: Record<HangHoSo, number>;
  theoBo: Array<{ bo: string; soMuc: number; diemTrungBinh: number }>;
  soiLanCuoi: string | null;
}
```

- [ ] **Step 2: Kiểm kiểu rồi commit**

```bash
cd backend && npm run type-check && cd ..
git add backend/src/models/tham-dinh.dto.ts
git commit -m "feat(tham-dinh): kiểu dữ liệu bệnh án mục từ"
```

---

### Task 5: Kết nối tạm sang kinhlac_cms + DDL bệnh án

**Files:**
- Create: `backend/src/controllers/tham-dinh-cms.service.ts`
- Test: `backend/src/controllers/tham-dinh-cms.service.spec.ts`

**Interfaces:**
- Consumes: `MucKho` (Task 2), `HoSoMuc` (Task 4)
- Produces:
  - `class ThamDinhCmsService`
  - `daCauHinh(): boolean`
  - `moKetNoi(): Promise<void>` / `dongKetNoi(): Promise<void>`
  - `dungBang(): Promise<void>`
  - `docCauHinhBo(): Promise<Array<{ bo: string; duongDan: string; than: string[] }>>`
  - `docLoMuc(bo: string, than: string[], tu: number, soLuong: number): Promise<MucKho[]>`
  - `ghiHoSo(h: HoSoMuc, nx: NhanXetCoMuc[]): Promise<void>`
  - `static readonly DDL: readonly string[]`

- [ ] **Step 1: Viết test thất bại**

Tạo `backend/src/controllers/tham-dinh-cms.service.spec.ts`:

```typescript
import { ThamDinhCmsService } from './tham-dinh-cms.service';

describe('ThamDinhCmsService.DDL', () => {
  /**
   * Bảng bệnh án nằm ở database `kinhlac_cms`, KHÔNG phải `defaultdb`, nên
   * SchemaBootstrapService (chạy trên dataSource chính) không dựng được. Service này tự
   * chạy DDL của mình, và DDL phải idempotent y như lối của SchemaBootstrap.
   */
  it('toàn bộ DDL đều idempotent — không câu nào phá huỷ', () => {
    for (const s of ThamDinhCmsService.DDL) {
      expect(s).toMatch(/IF NOT EXISTS/i);
      expect(s).not.toMatch(/\bDROP\b|\bTRUNCATE\b|\bDELETE FROM\b/i);
    }
  });

  it('cột thời gian khai timestamptz — sổ tay ghi rõ bẫy lệch 7 tiếng', () => {
    const tao = ThamDinhCmsService.DDL.filter((s) => /CREATE TABLE/i.test(s)).join('\n');
    expect(tao).toMatch(/timestamptz/i);
    expect(tao).not.toMatch(/\btimestamp\b(?!tz)/i);
  });

  it('dựng đủ hai bảng bệnh án', () => {
    const all = ThamDinhCmsService.DDL.join('\n');
    expect(all).toMatch(/CREATE TABLE IF NOT EXISTS td_ho_so/i);
    expect(all).toMatch(/CREATE TABLE IF NOT EXISTS td_nhan_xet/i);
  });

  it('td_ho_so có khoá duy nhất theo (bo, ma) để ghi đè được', () => {
    const all = ThamDinhCmsService.DDL.join('\n');
    expect(all).toMatch(/UNIQUE INDEX IF NOT EXISTS[\s\S]*td_ho_so[\s\S]*\(bo, ma\)/i);
  });
});

describe('ThamDinhCmsService.daCauHinh', () => {
  function svc(env: Record<string, string | undefined>) {
    return new ThamDinhCmsService({ get: (k: string) => env[k] } as never);
  }

  it('thiếu cấu hình thì NẰM IM, không ném lỗi', () => {
    expect(svc({}).daCauHinh()).toBe(false);
  });

  it('đủ năm biến thì sẵn sàng', () => {
    const s = svc({
      CMS_DB_HOST: 'h', CMS_DB_PORT: '16359', CMS_DB_USER: 'u',
      CMS_DB_PASSWORD: 'p', CMS_DB_NAME: 'kinhlac_cms',
    });
    expect(s.daCauHinh()).toBe(true);
  });
});
```

- [ ] **Step 2: Chạy test cho chắc là nó hỏng**

Run: `npm test --prefix backend -- tham-dinh-cms`
Expected: FAIL — không tìm thấy module.

- [ ] **Step 3: Viết bản cài đặt**

Tạo `backend/src/controllers/tham-dinh-cms.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'pg';

import type { MucKho } from '../utils/tham-dinh-muc.util';
import type { NhanXetCoMuc } from '../utils/tham-dinh-cum.util';
import type { HoSoMuc } from '../models/tham-dinh.dto';

/**
 * Cửa duy nhất đi sang database `kinhlac_cms`.
 *
 * ⚠️ VÌ SAO Client CHỨ KHÔNG Pool: cụm Aiven có max_connections = 20, đang dùng 12, và
 * pool chính của backend cấu hình max: 10 — lúc cao điểm là 10 + CMS 2 + hệ thống 9 = 21,
 * vượt trần. Cụm đã sập một lần vì chuyện này. Service này mở MỘT kết nối lúc vào ca và
 * đóng lúc hết ca; không bao giờ giữ kết nối rảnh.
 */
@Injectable()
export class ThamDinhCmsService {
  private readonly logger = new Logger('ThamDinhCms');
  private client: Client | null = null;

  constructor(private readonly config: ConfigService) {}

  static readonly DDL: readonly string[] = [
    `CREATE TABLE IF NOT EXISTS td_ho_so (
       id                SERIAL PRIMARY KEY,
       bo                TEXT NOT NULL,
       ma                TEXT NOT NULL,
       slug              TEXT NOT NULL,
       tieu_de           TEXT NOT NULL DEFAULT '',
       van_tay_noi_dung  VARCHAR(16) NOT NULL DEFAULT '',
       diem_sach         INT NOT NULL DEFAULT 0,
       diem_mach_lac     INT,
       diem_du_phan      INT NOT NULL DEFAULT 0,
       diem_lien_ket     INT,
       diem_seo          INT,
       hang              VARCHAR(10) NOT NULL DEFAULT 'tam_duoc',
       uu_tien           INT NOT NULL DEFAULT 0,
       soi_may_luc       timestamptz,
       soi_thay_thuoc_luc timestamptz,
       soi_seo_luc       timestamptz,
       created_at        timestamptz NOT NULL DEFAULT now(),
       updated_at        timestamptz NOT NULL DEFAULT now()
     )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS ux_td_ho_so_bo_ma ON td_ho_so (bo, ma)`,
    `CREATE INDEX IF NOT EXISTS idx_td_ho_so_uu_tien ON td_ho_so (uu_tien DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_td_ho_so_hang ON td_ho_so (hang)`,
    `CREATE TABLE IF NOT EXISTS td_nhan_xet (
       id          SERIAL PRIMARY KEY,
       ho_so_id    INT NOT NULL,
       lop         VARCHAR(12) NOT NULL,
       kieu        VARCHAR(40) NOT NULL,
       truong      VARCHAR(40),
       trich_dan   TEXT NOT NULL DEFAULT '',
       nhan_xet    TEXT NOT NULL DEFAULT '',
       de_xuat     TEXT,
       bac_can_cu  INT,
       nang        BOOLEAN NOT NULL DEFAULT false,
       trang_thai  VARCHAR(12) NOT NULL DEFAULT 'moi',
       duyet_boi   TEXT,
       duyet_luc   timestamptz,
       created_at  timestamptz NOT NULL DEFAULT now()
     )`,
    `CREATE INDEX IF NOT EXISTS idx_td_nhan_xet_ho_so ON td_nhan_xet (ho_so_id)`,
    `CREATE INDEX IF NOT EXISTS idx_td_nhan_xet_kieu ON td_nhan_xet (kieu)`,
    `CREATE INDEX IF NOT EXISTS idx_td_nhan_xet_trang_thai ON td_nhan_xet (trang_thai)`,
  ];

  daCauHinh(): boolean {
    return ['CMS_DB_HOST', 'CMS_DB_PORT', 'CMS_DB_USER', 'CMS_DB_PASSWORD', 'CMS_DB_NAME']
      .every((k) => {
        const v = this.config.get<string>(k);
        return typeof v === 'string' && v.trim().length > 0;
      });
  }

  async moKetNoi(): Promise<void> {
    if (this.client) return;
    const ca = this.config.get<string>('CA_CERTIFICATE');
    this.client = new Client({
      host: this.config.get<string>('CMS_DB_HOST'),
      port: Number(this.config.get<string>('CMS_DB_PORT')),
      user: this.config.get<string>('CMS_DB_USER'),
      password: this.config.get<string>('CMS_DB_PASSWORD'),
      database: this.config.get<string>('CMS_DB_NAME'),
      ssl: ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: false },
      connectionTimeoutMillis: 10_000,
    });
    // Không có listener 'error' thì pg ném ra process và sập cả backend khi Aiven cắt kết nối.
    this.client.on('error', (e) => this.logger.error(`lỗi kết nối CMS: ${e.message}`));
    await this.client.connect();
  }

  async dongKetNoi(): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.end();
    } finally {
      this.client = null;
    }
  }

  private phaiCo(): Client {
    if (!this.client) throw new Error('Chưa mở kết nối CMS');
    return this.client;
  }

  async dungBang(): Promise<void> {
    for (const s of ThamDinhCmsService.DDL) {
      try {
        await this.phaiCo().query(s);
      } catch (e) {
        this.logger.warn(`DDL bỏ qua: ${(e as Error).message}`);
      }
    }
  }

  /** Khai báo bộ + đường dẫn + danh sách cột thân bài, đọc thẳng từ td_cau_hinh. */
  async docCauHinhBo(): Promise<Array<{ bo: string; duongDan: string; than: string[] }>> {
    const r = await this.phaiCo().query<{ bo: string; duong_dan: string; cot_than: string[] }>(
      `SELECT bo, duong_dan, cot_than FROM td_cau_hinh ORDER BY thu_tu`,
    );
    return r.rows.map((x) => ({ bo: x.bo, duongDan: x.duong_dan, than: x.cot_than || [] }));
  }

  /**
   * Đọc một lô mục từ của một bộ, đã rút chữ khỏi portable text bằng hàm `td_chu`
   * có sẵn trong CSDL (dựng bởi cms/sql/chi-muc-tra-cuu.sql).
   */
  async docLoMuc(bo: string, than: string[], tu: number, soLuong: number): Promise<MucKho[]> {
    const cot = than
      .map((t) => `td_chu(to_jsonb(r.${JSON.stringify(t)})) AS ${JSON.stringify(t)}`)
      .join(', ');
    const sql =
      `SELECT r.id AS ma, r.slug, r.title AS tieu_de${cot ? ', ' + cot : ''} ` +
      `FROM ${JSON.stringify('ec_' + bo)} r ` +
      `WHERE r.status = 'published' AND r.deleted_at IS NULL ` +
      `ORDER BY r.id LIMIT $1 OFFSET $2`;
    const r = await this.phaiCo().query<Record<string, string>>(sql, [soLuong, tu]);
    return r.rows.map((row) => {
      const truong: Record<string, string> = {};
      for (const t of than) truong[t] = row[t] || '';
      return { bo, ma: row.ma, slug: row.slug, tieuDe: row.tieu_de || '', truong };
    });
  }

  /** Ghi đè hồ sơ của một mục và thay toàn bộ nhận xét lớp `may` của nó. */
  async ghiHoSo(h: HoSoMuc, nx: NhanXetCoMuc[]): Promise<void> {
    const c = this.phaiCo();
    const r = await c.query<{ id: number }>(
      `INSERT INTO td_ho_so (bo, ma, slug, tieu_de, van_tay_noi_dung, diem_sach,
                             diem_du_phan, hang, uu_tien, soi_may_luc, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, now(), now())
       ON CONFLICT (bo, ma) DO UPDATE SET
         slug = EXCLUDED.slug, tieu_de = EXCLUDED.tieu_de,
         van_tay_noi_dung = EXCLUDED.van_tay_noi_dung, diem_sach = EXCLUDED.diem_sach,
         diem_du_phan = EXCLUDED.diem_du_phan, hang = EXCLUDED.hang,
         uu_tien = EXCLUDED.uu_tien, soi_may_luc = now(), updated_at = now()
       RETURNING id`,
      [h.bo, h.ma, h.slug, h.tieuDe, h.vanTayNoiDung, h.diemSach, h.diemDuPhan, h.hang, h.uuTien],
    );
    const id = r.rows[0].id;

    // Chỉ thay nhận xét của lớp `may`; nhận xét của thầy thuốc và SEO giữ nguyên.
    await c.query(`DELETE FROM td_nhan_xet WHERE ho_so_id = $1 AND lop = 'may'`, [id]);
    for (const n of nx) {
      await c.query(
        `INSERT INTO td_nhan_xet (ho_so_id, lop, kieu, truong, trich_dan, nhan_xet, nang)
         VALUES ($1, 'may', $2, $3, $4, $5, $6)`,
        [id, n.kieu, n.truong, n.trichDan.slice(0, 2000), n.nhanXet, n.nang],
      );
    }
  }
}
```

- [ ] **Step 4: Chạy test cho tới khi xanh**

Run: `npm test --prefix backend -- tham-dinh-cms`
Expected: PASS, 6 ca.

- [ ] **Step 5: Kiểm kiểu rồi commit**

```bash
cd backend && npm run type-check && cd ..
git add backend/src/controllers/tham-dinh-cms.service.ts backend/src/controllers/tham-dinh-cms.service.spec.ts
git commit -m "feat(tham-dinh): cửa sang kinhlac_cms + DDL bệnh án idempotent"
```

---

### Task 6: Điều phối ca soi lớp 1 và nộp cụm việc

**Files:**
- Create: `backend/src/controllers/tham-dinh.controller.ts`
- Test: `backend/src/controllers/tham-dinh.controller.spec.ts`

**Interfaces:**
- Consumes: `ThamDinhCmsService` (Task 5), `doMuc` (Task 2), `gomCum`/`vanTayNoiDung` (Task 3), `SuCoService.ghiNhanLo` (đã có)
- Produces:
  - `class ThamDinhService`
  - `chayCa(gioiHan?: number): Promise<LuocKeCa>`
  - `xepHangHoSo(soNhanXetNang: number, soNhanXet: number, doDay: number): HangHoSo`

- [ ] **Step 1: Viết test thất bại**

Tạo `backend/src/controllers/tham-dinh.controller.spec.ts`:

```typescript
import { ThamDinhService } from './tham-dinh.controller';

describe('ThamDinhService.xepHangHoSo', () => {
  const s = new ThamDinhService(null as never, null as never, null as never);

  it('không nhận xét nào → tốt', () => {
    expect(s.xepHangHoSo(0, 0, 1200)).toBe('tot');
  });

  it('có lỗi nặng → hỏng, bất kể bài dài bao nhiêu', () => {
    expect(s.xepHangHoSo(1, 1, 20000)).toBe('hong');
  });

  it('nhiều nhận xét thường mà không nặng → yếu', () => {
    expect(s.xepHangHoSo(0, 6, 800)).toBe('yeu');
  });

  it('vài nhận xét nhẹ → tạm được', () => {
    expect(s.xepHangHoSo(0, 2, 800)).toBe('tam_duoc');
  });
});

describe('ThamDinhService.chayCa — khi chưa cấu hình', () => {
  it('thiếu CMS_DB_* thì NẰM IM, trả lược kê rỗng, không ném lỗi', async () => {
    const cms = { daCauHinh: () => false } as never;
    const s = new ThamDinhService(cms, null as never, null as never);
    const lk = await s.chayCa();
    expect(lk.soMucDoc).toBe(0);
    expect(lk.loi[0]).toMatch(/chưa cấu hình/i);
  });
});
```

- [ ] **Step 2: Chạy test cho chắc là nó hỏng**

Run: `npm test --prefix backend -- tham-dinh.controller`
Expected: FAIL — không tìm thấy module.

- [ ] **Step 3: Viết bản cài đặt**

Tạo `backend/src/controllers/tham-dinh.controller.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';

import { ThamDinhCmsService } from './tham-dinh-cms.service';
import { SuCoService } from './su-co.controller';
import { doMuc } from '../utils/tham-dinh-muc.util';
import { gomCum, vanTayNoiDung, type NhanXetCoMuc } from '../utils/tham-dinh-cum.util';
import type { HangHoSo, LuocKeCa } from '../models/tham-dinh.dto';

const LO = 200;

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

      for (const bo of await this.cms.docCauHinhBo()) {
        duongDanBo[bo.bo] = bo.duongDan;
        let tu = 0;
        for (;;) {
          const lo = await this.cms.docLoMuc(bo.bo, bo.than, tu, LO);
          if (!lo.length) break;

          for (const m of lo) {
            const nx = doMuc(m);
            const nang = nx.filter((x) => x.nang).length;
            await this.cms.ghiHoSo(
              {
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
              nx.map((n) => ({ ...n, bo: m.bo, slug: m.slug, tieuDe: m.tieuDe })),
            );
            for (const n of nx) {
              tatCaNhanXet.push({ ...n, bo: m.bo, slug: m.slug, tieuDe: m.tieuDe });
            }
            lk.soMucDoc++;
            if (gioiHan && lk.soMucDoc >= gioiHan) break;
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

    if (cum.length) {
      try {
        const r = await this.suCo.ghiNhanLo(
          cum.map((c) => ({
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
        lk.soCumNop = r.nhan;
      } catch (e) {
        lk.loi.push(`Nộp cụm hỏng: ${(e as Error).message}`);
      }
    }

    lk.ketThuc = new Date().toISOString();
    this.logger.log(
      `ca soi xong: ${lk.soMucDoc} mục · ${lk.soNhanXet} nhận xét · ${lk.soCumNop}/${lk.soCum} cụm`,
    );
    return lk;
  }
}
```

- [ ] **Step 4: Chạy test cho tới khi xanh**

Run: `npm test --prefix backend -- tham-dinh.controller`
Expected: PASS, 5 ca.

- [ ] **Step 5: Kiểm kiểu rồi commit**

```bash
cd backend && npm run type-check && cd ..
git add backend/src/controllers/tham-dinh.controller.ts backend/src/controllers/tham-dinh.controller.spec.ts
git commit -m "feat(tham-dinh): ca soi lớp 1 — quét kho, ghi bệnh án, nộp cụm việc"
```

---

### Task 7: API và đăng ký vào module

**Files:**
- Create: `backend/src/routers/tham-dinh.router.ts`
- Modify: `backend/src/app.module.ts`
- Modify: `backend/.env.example` (nếu có; nếu không thì bỏ qua bước đó)

**Interfaces:**
- Consumes: `ThamDinhService` (Task 6), `ThamDinhCmsService` (Task 5)
- Produces: ba endpoint dưới `/tham-dinh`

- [ ] **Step 1: Viết router**

Tạo `backend/src/routers/tham-dinh.router.ts`:

```typescript
import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';

import { ThamDinhService } from '../controllers/tham-dinh.controller';
import { QuanTriGuard } from '../middlewares/auth/quan-tri.guard';
import type { LuocKeCa } from '../models/tham-dinh.dto';

/**
 * Toàn bộ endpoint đều là của Quản Trị.
 *
 * ⚠️ JwtAuthGuard toàn cục KHÔNG đủ: token bệnh nhân cũng là token hợp lệ. Mọi route GHI
 * phải có guard vai trò riêng — đây là chỗ từng hở 85 route.
 */
@Controller('tham-dinh')
@UseGuards(QuanTriGuard)
export class ThamDinhRouter {
  constructor(private readonly thamDinh: ThamDinhService) {}

  /** Chạy tay một ca soi. `gioiHan` để thử trên một nhúm mục trước khi chạy cả kho. */
  @Post('chay')
  chay(@Query('gioiHan') gioiHan?: string): Promise<LuocKeCa> {
    const n = Number(gioiHan);
    return this.thamDinh.chayCa(Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);
  }

  /** Thử trên 50 mục — dùng lúc nghiệm thu, không đụng cả kho. */
  @Post('chay-thu')
  chayThu(): Promise<LuocKeCa> {
    return this.thamDinh.chayCa(50);
  }

  @Get('trang-thai')
  trangThai(): { sanSang: boolean } {
    return { sanSang: true };
  }
}
```

- [ ] **Step 2: Kiểm tên guard cho đúng**

Run: `ls backend/src/middlewares/auth/`
Nếu không có `quan-tri.guard.ts`, tìm tên thật:
Run: `grep -rn "QuanTriGuard" backend/src --include=*.ts | head -3`
Sửa đường import trong router cho khớp tên file thật.

- [ ] **Step 3: Đăng ký vào app.module.ts**

Mở `backend/src/app.module.ts`. Module này liệt kê thủ công, không tự dò. Thêm ba chỗ:

```typescript
// đầu file
import { ThamDinhRouter } from './routers/tham-dinh.router';
import { ThamDinhService } from './controllers/tham-dinh.controller';
import { ThamDinhCmsService } from './controllers/tham-dinh-cms.service';

// trong controllers: [...]
ThamDinhRouter,

// trong providers: [...]
ThamDinhService,
ThamDinhCmsService,
```

Không thêm gì vào `TypeOrmModule.forFeature([...])` — hai bảng bệnh án nằm ở `kinhlac_cms`,
không do TypeORM quản.

- [ ] **Step 4: Kiểm kiểu và khởi động thử**

```bash
cd backend && npm run type-check
```
Expected: không lỗi.

```bash
cd backend && timeout 40 npm run start:dev 2>&1 | tail -30
```
Expected: thấy dòng ánh xạ route `/tham-dinh/chay`, không có lỗi khởi tạo.
Ghi chú: macOS không có lệnh `timeout`; dùng `npm run start:dev` rồi Ctrl-C sau khi thấy log.

- [ ] **Step 5: Commit**

```bash
git add backend/src/routers/tham-dinh.router.ts backend/src/app.module.ts
git commit -m "feat(tham-dinh): API chạy ca soi + đăng ký vào app module"
```

---

### Task 8: Dò liên kết hụt giữa các bộ

**Files:**
- Modify: `backend/src/utils/tham-dinh-muc.util.ts` (thêm hàm, giữ nguyên phần cũ)
- Modify: `backend/src/utils/tham-dinh-muc.util.spec.ts` (thêm describe mới)
- Modify: `backend/src/controllers/tham-dinh.controller.ts:chayCa` (dựng chỉ mục tên trước vòng lặp)

**Interfaces:**
- Consumes: `MucKho`, `NhanXetTho` (Task 2)
- Produces:
  - `export interface ChiMucTen { khop(cum: string): { bo: string; slug: string; tieuDe: string } | null }`
  - `export function dungChiMucTen(muc: Array<{ bo: string; slug: string; tieuDe: string }>): ChiMucTen`
  - `export function doLienKet(m: MucKho, chiMuc: ChiMucTen): NhanXetTho[]`

**Vì sao task này đáng làm:** đây là thứ mở đường cho **bậc 1** của kế hoạch 2 — bot chỉ được
soạn bản bổ sung từ chữ đã có trong kho, mà muốn vậy phải biết mục nào nối được với mục nào.
Nó cũng tự nó đã có ích: vị thuốc trong bài mà không khớp mục dược liệu nào thường là **tên
viết sai** hoặc **kho thiếu vị đó** — cả hai đều đáng biết.

- [ ] **Step 1: Viết test thất bại**

Thêm vào cuối `backend/src/utils/tham-dinh-muc.util.spec.ts`:

```typescript
import { dungChiMucTen, doLienKet } from './tham-dinh-muc.util';

const CHI_MUC = dungChiMucTen([
  { bo: 'duoc_lieu', slug: 'cam-thao', tieuDe: 'Cam thảo' },
  { bo: 'duoc_lieu', slug: 'dang-sam', tieuDe: 'Đảng sâm' },
  { bo: 'duoc_lieu', slug: 'phuc-linh', tieuDe: 'Phục linh' },
  { bo: 'duoc_lieu', slug: 'truc-diep', tieuDe: 'Trúc diệp' },
  { bo: 'benh_hoc', slug: 'tang-tao', tieuDe: 'Tạng táo' },
]);

describe('dungChiMucTen', () => {
  it('khớp không cần dấu', () => {
    expect(CHI_MUC.khop('dang sam')!.slug).toBe('dang-sam');
  });

  it('khớp không phân biệt hoa thường và dấu câu', () => {
    expect(CHI_MUC.khop('CAM THẢO,')!.slug).toBe('cam-thao');
  });

  it('không khớp thì trả null, không đoán bừa', () => {
    expect(CHI_MUC.khop('hoàng kỳ')).toBeNull();
  });
});

describe('doLienKet', () => {
  /**
   * Ca thật bốc được lúc khảo sát: bài Trúc Nhự Thang IX. Thành phần ghi liền một dải,
   * mỗi vị đều có mục dược liệu riêng trong kho mà trang bài thuốc không nối sang.
   */
  it('nhận ra các vị nối được sang mục dược liệu', () => {
    const r = doLienKet(
      {
        bo: 'bai_thuoc', ma: 'X', slug: 'truc-nhu-thang-ix', tieuDe: 'Trúc Nhự Thang IX',
        truong: { thanh_phan: 'Chích thảo 4g Đảng sâm 4g Phục linh 4g Trúc diệp 20g' },
      },
      CHI_MUC,
    );
    const l = r.find((x) => x.kieu === 'lien_ket_dung_duoc');
    expect(l).toBeDefined();
    expect(l!.nhanXet).toContain('3');
  });

  it('nêu tên vị không khớp mục nào — sai chính tả hoặc kho thiếu vị', () => {
    const r = doLienKet(
      {
        bo: 'bai_thuoc', ma: 'X', slug: 'b', tieuDe: 'B',
        truong: { thanh_phan: 'Cam thảo 4g Hoàng kỳ 12g' },
      },
      CHI_MUC,
    );
    const l = r.find((x) => x.kieu === 'ten_vi_la');
    expect(l).toBeDefined();
    expect(l!.trichDan).toContain('Hoàng kỳ');
  });

  it('không nhận nhầm chính mục đang xét làm liên kết', () => {
    const r = doLienKet(
      {
        bo: 'duoc_lieu', ma: 'X', slug: 'cam-thao', tieuDe: 'Cam thảo',
        truong: { chu_tri: 'Cam thảo dùng trị ho.' },
      },
      CHI_MUC,
    );
    expect(r.find((x) => x.kieu === 'lien_ket_dung_duoc')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Chạy test cho chắc là nó hỏng**

Run: `npm test --prefix backend -- tham-dinh-muc`
Expected: FAIL — `dungChiMucTen is not a function`

- [ ] **Step 3: Viết bản cài đặt**

Thêm vào cuối `backend/src/utils/tham-dinh-muc.util.ts`:

```typescript
/** Tra cứu tên mục từ theo cụm chữ đã chuẩn hoá. */
export interface ChiMucTen {
  khop(cum: string): { bo: string; slug: string; tieuDe: string } | null;
}

/**
 * Chuẩn hoá MẠNH: bỏ dấu thanh và mọi dấu câu.
 * Cùng lối với khoá tra cứu chéo đã dùng ở tầng từ điển — nhờ nó "Trúc Nhự Thang-…" và
 * "Trúc Nhự Thang – …" cùng trỏ một mục.
 */
function chuanHoaTen(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function dungChiMucTen(
  muc: Array<{ bo: string; slug: string; tieuDe: string }>,
): ChiMucTen {
  const bang = new Map<string, { bo: string; slug: string; tieuDe: string }>();
  for (const m of muc) {
    const k = chuanHoaTen(m.tieuDe);
    if (k && !bang.has(k)) bang.set(k, m);
  }
  return {
    khop(cum: string) {
      return bang.get(chuanHoaTen(cum)) ?? null;
    },
  };
}

/** Số từ tối đa của một tên vị thuốc — quét cửa sổ tới ngần này rồi thôi. */
const TOI_DA_TU_TEN = 4;

/**
 * Quét một chuỗi, nhặt ra các cụm khớp tên mục từ trong kho, ưu tiên cụm DÀI NHẤT.
 *
 * Quét dài nhất trước là bắt buộc: thành phần bài thuốc hay ghi liền không phân cách
 * ("Bạch chỉ Bán hạ Cam thảo Độc hoạt"), tách theo dấu cách thì không ra vị nào.
 */
function quetTen(
  s: string,
  chiMuc: ChiMucTen,
): { khop: Array<{ cum: string; muc: { bo: string; slug: string; tieuDe: string } }>; du: string[] } {
  const tu = s.split(/\s+/).filter(Boolean);
  const khop: Array<{ cum: string; muc: { bo: string; slug: string; tieuDe: string } }> = [];
  const du: string[] = [];
  let i = 0;

  while (i < tu.length) {
    let trung: { dai: number; muc: { bo: string; slug: string; tieuDe: string }; cum: string } | null = null;
    for (let d = Math.min(TOI_DA_TU_TEN, tu.length - i); d >= 1; d--) {
      const cum = tu.slice(i, i + d).join(' ');
      const m = chiMuc.khop(cum);
      if (m) {
        trung = { dai: d, muc: m, cum };
        break;
      }
    }
    if (trung) {
      khop.push({ cum: trung.cum, muc: trung.muc });
      i += trung.dai;
    } else {
      // Bỏ qua phần liều lượng và chữ nối — chúng không phải tên vị.
      if (!/^\d|^(g|gam|chi|lang|va|voi)$/i.test(tu[i])) du.push(tu[i]);
      i++;
    }
  }
  return { khop, du };
}

/**
 * Dò liên kết hụt. Hai loại phát hiện, đều là đầu vào cho bậc 1 của lớp thầy thuốc:
 *   · `lien_ket_dung_duoc` — mục khác trong kho nói về đúng thứ bài này nhắc tới
 *   · `ten_vi_la` — tên vị không khớp mục nào: hoặc viết sai, hoặc kho thiếu vị đó
 */
export function doLienKet(m: MucKho, chiMuc: ChiMucTen): NhanXetTho[] {
  const ra: NhanXetTho[] = [];
  const tp = m.truong['thanh_phan'];
  if (!tp || !tp.trim()) return ra;

  const { khop, du } = quetTen(tp, chiMuc);
  const khac = khop.filter((k) => !(k.muc.bo === m.bo && k.muc.slug === m.slug));

  if (khac.length) {
    ra.push({
      kieu: 'lien_ket_dung_duoc',
      truong: 'thanh_phan',
      trichDan: khac.map((k) => k.cum).join(' · '),
      nhanXet:
        `${khac.length} vị trong bài có mục riêng trong kho — nối được, và đủ căn cứ để dựng ` +
        `phần phân tích mà không cần viết thêm chữ nào từ ngoài.`,
      nang: false,
    });
  }

  // Cụm chữ còn lại đủ dài để là tên vị mà không khớp mục nào.
  const nghi = du.filter((t) => t.length >= 3);
  if (nghi.length) {
    ra.push({
      kieu: 'ten_vi_la',
      truong: 'thanh_phan',
      trichDan: nghi.slice(0, 12).join(' '),
      nhanXet:
        'Có chữ trong thành phần không khớp mục dược liệu nào: hoặc tên viết sai, ' +
        'hoặc kho thiếu vị đó. Cần người đối chiếu sách.',
      nang: false,
    });
  }

  return ra;
}
```

- [ ] **Step 4: Chạy test cho tới khi xanh**

Run: `npm test --prefix backend -- tham-dinh-muc`
Expected: PASS — cả phần cũ lẫn 6 ca mới.

- [ ] **Step 5: Nối vào ca soi**

Trong `backend/src/controllers/tham-dinh.controller.ts`, sửa `chayCa`:

Thêm import:

```typescript
import { doMuc, dungChiMucTen, doLienKet } from '../utils/tham-dinh-muc.util';
```

Thêm vào `ThamDinhCmsService` một phép đọc tên (file `tham-dinh-cms.service.ts`):

```typescript
  /** Toàn bộ tên mục từ, để dựng chỉ mục tra tên. 18.416 dòng ngắn — vài MB, nạp một lần. */
  async docTenMuc(): Promise<Array<{ bo: string; slug: string; tieuDe: string }>> {
    const r = await this.phaiCo().query<{ bo: string; slug: string; tieu_de: string }>(
      `SELECT bo, slug, tieu_de FROM td_muc`,
    );
    return r.rows.map((x) => ({ bo: x.bo, slug: x.slug, tieuDe: x.tieu_de }));
  }
```

Trong `chayCa`, ngay sau `await this.cms.dungBang();`:

```typescript
      const chiMucTen = dungChiMucTen(await this.cms.docTenMuc());
```

Và trong vòng lặp từng mục, đổi dòng tính `nx`:

```typescript
            const nx = [...doMuc(m), ...doLienKet(m, chiMucTen)];
```

- [ ] **Step 6: Kiểm kiểu, chạy toàn bộ test, commit**

```bash
cd backend && npm run type-check && npm test -- tham-dinh && cd ..
git add backend/src/utils/tham-dinh-muc.util.ts backend/src/utils/tham-dinh-muc.util.spec.ts \
        backend/src/controllers/tham-dinh-cms.service.ts backend/src/controllers/tham-dinh.controller.ts
git commit -m "feat(tham-dinh): dò liên kết hụt giữa các bộ + tên vị lạ trong bài thuốc"
```

---

### Task 9: Nghiệm thu trên kho thật

**Files:**
- Create: `backend/tmp/nghiem-thu-tham-dinh.mjs`

**Interfaces:**
- Consumes: bảng `td_ho_so`, `td_nhan_xet` do ca soi sinh ra

- [ ] **Step 1: Thêm cấu hình vào backend/.env**

Chép giá trị từ `cms/.env` sang `backend/.env` (đổi tiền tố):

```
CMS_DB_HOST=<PGHOST của cms/.env>
CMS_DB_PORT=<PGPORT>
CMS_DB_USER=<PGUSER>
CMS_DB_PASSWORD=<PGPASSWORD>
CMS_DB_NAME=kinhlac_cms
```

⚠️ `backend/.env` có `CA_CERTIFICATE` là PEM nhiều dòng trong nháy kép — **đừng `source` cả
file trong shell**, phải lọc dòng.

- [ ] **Step 2: Chạy thử 50 mục**

```bash
curl -s -X POST localhost:3001/tham-dinh/chay-thu -H "Authorization: Bearer $TOKEN" | head -40
```
Expected: `soMucDoc: 50`, `soNhanXet` > 0, `loi: []`.

- [ ] **Step 3: Viết script nghiệm thu**

Tạo `backend/tmp/nghiem-thu-tham-dinh.mjs`:

```javascript
// Nghiệm thu lớp 1 trên kho thật. CHỈ ĐỌC.
// Chạy: node backend/tmp/nghiem-thu-tham-dinh.mjs
import { readFileSync } from "node:fs";
import pg from "pg";

const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split("\n").filter((l) => /^[A-Za-z_]+=/.test(l))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1).replace(/^["']|["']$/g, "")]; }),
);
const c = new pg.Client({
  host: env.CMS_DB_HOST, port: +env.CMS_DB_PORT, user: env.CMS_DB_USER,
  password: env.CMS_DB_PASSWORD, database: env.CMS_DB_NAME,
  ssl: env.CA_CERTIFICATE ? { ca: env.CA_CERTIFICATE, rejectUnauthorized: true } : { rejectUnauthorized: false },
});
await c.connect();

// 1. Đủ mục: số hồ sơ phải bằng số mục trong chỉ mục
const a = await c.query(`SELECT
  (SELECT count(*) FROM td_muc)::int   AS trong_chi_muc,
  (SELECT count(*) FROM td_ho_so)::int AS co_ho_so`);
console.log("① Đủ mục:", a.rows[0]);

// 2. Kiểu cột thời gian PHẢI là timestamptz — sổ tay ghi bẫy lệch 7 tiếng
const b = await c.query(`SELECT column_name, data_type FROM information_schema.columns
  WHERE table_name IN ('td_ho_so','td_nhan_xet') AND data_type LIKE 'timestamp%'`);
const sai = b.rows.filter((r) => r.data_type !== "timestamp with time zone");
console.log("② Cột thời gian:", sai.length ? "SAI KIỂU → " + JSON.stringify(sai) : "đúng timestamptz");

// 3. Mọi nhận xét về lỗi chữ phải có trích dẫn
const d = await c.query(`SELECT count(*)::int n FROM td_nhan_xet
  WHERE lop='may' AND trich_dan='' AND kieu NOT IN ('thieu_truong','thieu_truong_cot_loi')`);
console.log("③ Nhận xét lỗi chữ thiếu trích dẫn:", d.rows[0].n, d.rows[0].n === 0 ? "✓" : "✗ PHẢI BẰNG 0");

// 4. Phân bố hạng
console.table((await c.query(`SELECT hang, count(*)::int n FROM td_ho_so GROUP BY 1 ORDER BY 2 DESC`)).rows);

// 5. Mười kiểu lỗi nhiều nhất — đây là danh sách việc
//    Phải thấy cả 'lien_ket_dung_duoc' (đầu vào cho bậc 1 của lớp thầy thuốc).
console.table((await c.query(`SELECT kieu, truong, count(*)::int so_muc FROM td_nhan_xet
  WHERE lop='may' GROUP BY 1,2 ORDER BY 3 DESC LIMIT 10`)).rows);

await c.end();
```

- [ ] **Step 4: Chạy ca đầy đủ rồi nghiệm thu**

```bash
curl -s -X POST localhost:3001/tham-dinh/chay -H "Authorization: Bearer $TOKEN" | tail -5
node backend/tmp/nghiem-thu-tham-dinh.mjs
```

Expected:
- ① `co_ho_so` bằng `trong_chi_muc` (18.416)
- ② "đúng timestamptz"
- ③ bằng 0
- ⑤ ra danh sách kiểu lỗi kèm số mục

- [ ] **Step 5: Kiểm cụm việc trong tab Góp Ý & Lỗi**

Mở tab "Góp Ý & Lỗi", lọc lane `gop_y`. Kiểm bằng mắt:
- Số cụm cỡ **hàng chục**, không phải hàng nghìn — nếu thấy hàng nghìn thì route đã kèm slug, quay lại Task 3.
- Mỗi cụm có `×N` với N là số mục dính.
- Bấm vào một cụm thấy danh sách đường dẫn mục trong phần mô tả.

- [ ] **Step 6: Kiểm số kết nối Postgres không vượt trần**

Chạy trong lúc ca soi đang chạy:

```bash
node -e "
const pg=require('/Users/truongtrang/Desktop/kinhlacc/cms/node_modules/pg');
const fs=require('fs');
const e=Object.fromEntries(fs.readFileSync('/Users/truongtrang/Desktop/kinhlacc/cms/.env','utf8').split('\n').filter(l=>/^[A-Za-z_]+=/.test(l)).map(l=>{const i=l.indexOf('=');return [l.slice(0,i),l.slice(i+1)]}));
const c=new pg.Client({host:e.PGHOST,port:+e.PGPORT,user:e.PGUSER,password:e.PGPASSWORD,database:e.PGDATABASE,ssl:{ca:fs.readFileSync('/Users/truongtrang/Desktop/kinhlacc/cms/aiven-ca.pem','utf8'),rejectUnauthorized:true}});
c.connect().then(()=>c.query('SELECT count(*)::int n FROM pg_stat_activity')).then(r=>{console.log('kết nối đang dùng:',r.rows[0].n);return c.end()});
"
```

Expected: ≤ 14. Vượt thì kiểm lại `dongKetNoi()` có được gọi trong `finally` không.

- [ ] **Step 7: Commit**

```bash
git add backend/tmp/nghiem-thu-tham-dinh.mjs
git commit -m "test(tham-dinh): script nghiệm thu lớp 1 trên kho thật"
```

---

## Ngoài phạm vi kế hoạch này

- **Lớp 2 (thầy thuốc LLM), lập thước văn phong, màn duyệt bản sửa** → kế hoạch 2
- **Lớp 3 (đối sánh GSC + đối thủ)** → kế hoạch 3
- **Phép dò trang render** (mã HTTP, `<html lang>`, ảnh 404, link chết) → kế hoạch 3, vì nó
  cần tải trang thật và chịu chung hạ tầng lấy trang với phần đọc trang đối thủ
- Bot **không ghi vào bảng `ec_*`** ở kế hoạch này
