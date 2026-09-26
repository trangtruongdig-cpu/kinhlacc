# Bot Thẩm Định Thư Viện — Kế hoạch 2: bộ luật văn phong + lớp thầy thuốc

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng bộ luật văn phong rút từ chính các mục viết đạt, rồi cho một lớp đọc-hiểu bằng mô hình ngôn ngữ soi các mục đầu hàng đợi, ghi lời phê KÈM TRÍCH DẪN NGUYÊN VĂN và bản sửa đề xuất vào bệnh án — không tự ghi vào kho nội dung.

**Architecture:** Thêm hai service vào backend NestJS bên cạnh lớp 1 đã có: một dịch vụ gọi mô hình (hai tầng, có trần chi tiêu) và một dịch vụ điều phối ca soi. Mọi phép kiểm rào chắn viết thành hàm thuần trong `src/utils/` để test không cần mạng lẫn database. Bộ luật lưu ở bảng mới `td_luat_van_phong` trong `kinhlac_cms`, có phiên bản và trạng thái duyệt.

**Tech Stack:** NestJS 11, `openai` SDK trỏ Yescale (đã có trong repo), `pg` Client thuần, Jest, `@nestjs/schedule`.

**Spec:** `docs/superpowers/specs/2026-09-25-bot-tham-dinh-thu-vien-design.md`
**Kế hoạch trước:** `docs/superpowers/plans/2026-09-25-bot-tham-dinh-lop-1.md` (đã thi công xong)

## Global Constraints

- **Bot là biên tập viên, không phải tác giả.** Bot **không được** thêm bất kỳ sự kiện y học nào từ trí nhớ của mô hình. Bốn bậc căn cứ, **bậc 2 bị CẤM**:
  | Bậc | Căn cứ | Dùng |
  |---|---|---|
  | 1 | Chữ trong kho, qua liên kết chéo 8 bộ | **Có** |
  | 2 | Y văn từ trí nhớ LLM, kể cả có dẫn sách | **CẤM** |
  | 3 | Học **bố cục** từ trang đối thủ (không chép chữ) | Có — nhưng lớp 3, ngoài kế hoạch này |
  | 4 | Không đủ căn cứ → ghi "cần người bổ sung", dừng | **Có** |
- **Không có `trichDan` thì không được phê.** Lời phê thiếu trích dẫn, hoặc trích dẫn KHÔNG khớp nguyên văn trong thân bài, bị loại ngay ở khâu ghi — không đợi người duyệt bắt. Đây là thứ duy nhất phân biệt "đọc rồi phê" với "bịa".
- **Mọi lời phê trục văn phong phải quy chiếu về một điều trong bộ luật.** Không quy chiếu được thì không phải lỗi. Nhờ vậy khi bot phê sai, người dùng sửa *bộ luật* chứ không cãi từng lời phê.
- **Bot không ghi vào bảng `ec_*`.** Kế hoạch này chỉ ghi `td_ho_so` / `td_nhan_xet`. Việc áp bản sửa là kế hoạch 3.
- **Phạm vi hành nghề Y sỹ** (đã chốt trong sổ tay): không được hàm ý "khám, chữa bệnh". Bảng từ: khám→đo, phòng khám→phòng chẩn trị, bác sĩ→thầy thuốc. Đây vừa là luật cho lời phê của bot, vừa là thứ bot phải dò trong nội dung.
- **Ngôn ngữ nghiệp vụ là tiếng Việt.** Tên bảng, cột, hàm, biến nghiệp vụ dùng từ Việt không dấu.
- **Quy ước đặt tên ngược của repo:** `src/routers/*.router.ts` là `@Controller`; `src/controllers/*.controller.ts` là `@Injectable` service.
- **Đăng ký thủ công trong `src/app.module.ts`** — cả `controllers` và `providers`.
- **Không giữ pool thường trực thứ hai.** Dùng lại `ThamDinhCmsService`: mở một `pg.Client` lúc vào ca, đóng lúc hết ca.
- **Ghi vào Aiven phải theo LÔ.** RTT đo được 88ms. Đã trả giá ở kế hoạch 1: ghi lẻ từng mục làm ca cả kho mất 3 giờ thay vì 2 phút rưỡi.
- **`@nestjs/schedule` v12 là ESM thuần**, jest của repo chạy CJS. Spec nào chạm vào chuỗi import có nó (kể cả gián tiếp) phải `jest.mock('@nestjs/schedule', () => ({ Cron: () => () => undefined, CronExpression: {} }))`.

## Cấu hình mới

| Biến | Việc | Mặc định |
|---|---|---|
| `THAM_DINH_MOI_CA` | số mục lớp 2 đọc mỗi ca | 100 |
| `THAM_DINH_TRAN_TIEN` | trần chi tiêu mỗi ca, tính bằng số lượt gọi mô hình | 300 |
| `THAM_DINH_MODEL_KY` | model tầng đọc kỹ | `claude-sonnet-5` |
| `THAM_DINH_SO_MUC_KY` | bao nhiêu mục đầu hàng đợi được tầng đọc kỹ xử lý | 50 |

`YESCALE_API_KEY`, `YESCALE_BASE_URL`, `YESCALE_MODEL` (= `gemini-2.5-flash-lite`) đã có sẵn trong `backend/.env`. Thiếu `YESCALE_API_KEY` thì lớp 2 **nằm im**, không ném lỗi — cùng lối với Telegram và push trong `su-co`.

## File Structure

| File | Trách nhiệm |
|---|---|
| `backend/src/utils/tham-dinh-luat.util.ts` | Kiểu bộ luật văn phong; kiểm một lời phê có quy chiếu điều luật có thật hay không. Hàm thuần. |
| `backend/src/utils/tham-dinh-luat.util.spec.ts` | Test cho trên. |
| `backend/src/utils/tham-dinh-loi-phe.util.ts` | Bóc JSON khỏi phản hồi mô hình; lọc lời phê qua bốn rào chắn (trích dẫn khớp nguyên văn, bậc căn cứ, quy chiếu điều luật, độ dài). Hàm thuần. |
| `backend/src/utils/tham-dinh-loi-phe.util.spec.ts` | Test cho trên. |
| `backend/src/utils/tham-dinh-hang-doi.util.ts` | Tính điểm ưu tiên và xếp hàng đợi lớp 2. Hàm thuần. |
| `backend/src/utils/tham-dinh-hang-doi.util.spec.ts` | Test cho trên. |
| `backend/src/controllers/tham-dinh-llm.service.ts` | Cửa duy nhất gọi mô hình: hai tầng, đếm lượt, trần chi tiêu, không ném lỗi ra ngoài ca. |
| `backend/src/controllers/tham-dinh-llm.service.spec.ts` | Test cho trên. |
| `backend/src/controllers/tham-dinh-thay-thuoc.controller.ts` | Điều phối: lập thước, chạy ca lớp 2, dựng lời nhắc, ghi nhận xét. |
| `backend/src/controllers/tham-dinh-thay-thuoc.controller.spec.ts` | Test cho trên. |
| `backend/src/controllers/tham-dinh-cms.service.ts` | **Sửa**: DDL bảng bộ luật + cột vân tay lớp 2; đọc hàng đợi; đọc chùm liên quan; ghi nhận xét lớp `thay_thuoc`. |
| `backend/src/routers/tham-dinh.router.ts` | **Sửa**: bốn endpoint mới. |
| `backend/src/models/tham-dinh.dto.ts` | **Sửa**: kiểu bộ luật, lời phê, lược kê ca lớp 2. |
| `backend/src/app.module.ts` | **Sửa**: đăng ký hai service mới. |

---

### Task 1: Kiểu bộ luật văn phong và phép kiểm quy chiếu

**Files:**
- Create: `backend/src/utils/tham-dinh-luat.util.ts`
- Test: `backend/src/utils/tham-dinh-luat.util.spec.ts`

**Interfaces:**
- Consumes: không
- Produces:
  - `export type TrucLuat = 'bo_cuc' | 'thuat_ngu' | 'cau_chu' | 'pham_vi_hanh_nghe'`
  - `export interface DieuLuat { ma: string; truc: TrucLuat; noiDung: string; viDu: string }`
  - `export interface BoLuatVanPhong { phienBan: number; boApDung: string[]; dieu: DieuLuat[]; daDuyet: boolean }`
  - `export function traDieu(bo: BoLuatVanPhong, ma: string): DieuLuat | null`
  - `export function apDungCho(bo: BoLuatVanPhong, tenBo: string): boolean`
  - `export const LUAT_PHAM_VI_HANH_NGHE: DieuLuat`
  - `export function doPhamViHanhNghe(s: string): Array<{ tu: string; thay: string; viTri: number }>`

- [ ] **Step 1: Viết test thất bại**

Tạo `backend/src/utils/tham-dinh-luat.util.spec.ts`:

```typescript
import {
  traDieu, apDungCho, doPhamViHanhNghe, LUAT_PHAM_VI_HANH_NGHE,
  type BoLuatVanPhong,
} from './tham-dinh-luat.util';

const BO: BoLuatVanPhong = {
  phienBan: 1,
  boApDung: ['huyet_vi', 'benh_hoc'],
  daDuyet: true,
  dieu: [
    { ma: 'BC1', truc: 'bo_cuc', noiDung: 'Mục huyệt mở đầu bằng câu định vị gọn.', viDu: 'Ở chỗ lõm…' },
    { ma: 'TN1', truc: 'thuat_ngu', noiDung: 'Một khái niệm chỉ gọi một tên trong cùng bài.', viDu: '' },
  ],
};

describe('traDieu', () => {
  it('tra được điều luật theo mã', () => {
    expect(traDieu(BO, 'BC1')!.truc).toBe('bo_cuc');
  });

  it('mã không có thật → null, để khâu lọc loại lời phê đó', () => {
    expect(traDieu(BO, 'KHONG-CO')).toBeNull();
  });

  it('không phân biệt hoa thường — mô hình hay trả về "bc1"', () => {
    expect(traDieu(BO, 'bc1')!.ma).toBe('BC1');
  });
});

describe('apDungCho', () => {
  it('bộ có khai thì áp dụng', () => {
    expect(apDungCho(BO, 'huyet_vi')).toBe(true);
  });

  it('bộ không khai thì KHÔNG áp dụng — thước của huyệt không đo được bài thuốc', () => {
    expect(apDungCho(BO, 'bai_thuoc')).toBe(false);
  });

  it('danh sách rỗng nghĩa là áp dụng cho mọi bộ', () => {
    expect(apDungCho({ ...BO, boApDung: [] }, 'bai_thuoc')).toBe(true);
  });
});

describe('doPhamViHanhNghe', () => {
  /**
   * Đã chốt trong sổ tay dự án: người dùng hành nghề Y sỹ, nội dung KHÔNG được hàm ý
   * "khám, chữa bệnh". Đây là luật cứng, không phải văn phong — nên nó là hằng số trong
   * mã chứ không nằm trong bộ luật rút từ mẫu, và không ai sửa nó qua màn duyệt được.
   */
  it('bắt chữ "bác sĩ" và nêu chữ thay', () => {
    const r = doPhamViHanhNghe('Bác sĩ sẽ khám cho bệnh nhân.');
    expect(r.find((x) => x.tu === 'bác sĩ')!.thay).toBe('thầy thuốc');
  });

  it('bắt chữ "phòng khám"', () => {
    expect(doPhamViHanhNghe('Đến phòng khám để đo.').map((x) => x.tu)).toContain('phòng khám');
  });

  it('bắt "khám bệnh" nhưng KHÔNG bắt chữ "khám" đứng trong "khám phá"', () => {
    expect(doPhamViHanhNghe('khám bệnh định kỳ').map((x) => x.tu)).toContain('khám bệnh');
    expect(doPhamViHanhNghe('khám phá cơ thể')).toEqual([]);
  });

  it('câu sạch thì không báo gì', () => {
    expect(doPhamViHanhNghe('Thầy thuốc đo kinh lạc tại phòng chẩn trị.')).toEqual([]);
  });

  it('LUAT_PHAM_VI_HANH_NGHE có mã cố định để lời phê quy chiếu được', () => {
    expect(LUAT_PHAM_VI_HANH_NGHE.ma).toBe('PV1');
    expect(LUAT_PHAM_VI_HANH_NGHE.truc).toBe('pham_vi_hanh_nghe');
  });
});
```

- [ ] **Step 2: Chạy test cho chắc là nó hỏng**

Run: `npm test --prefix backend -- tham-dinh-luat`
Expected: FAIL — `Cannot find module './tham-dinh-luat.util'`

- [ ] **Step 3: Viết bản cài đặt**

Tạo `backend/src/utils/tham-dinh-luat.util.ts`:

```typescript
/**
 * Bộ luật văn phong — cái thước mà mọi lời phê trục văn phong phải quy chiếu về.
 *
 * Vì sao cần: nếu bot cứ "thấy sao nói vậy" thì mỗi lời phê là một cuộc cãi riêng. Có
 * thước thì khi bot phê sai, người dùng sửa MỘT điều luật, và mọi lời phê dựa vào điều
 * đó tự đúng theo. Thước rút từ chính các mục người dùng cho là viết đạt, không phải từ
 * trí nhớ của mô hình.
 */

export type TrucLuat = 'bo_cuc' | 'thuat_ngu' | 'cau_chu' | 'pham_vi_hanh_nghe';

export interface DieuLuat {
  /** Mã ngắn để lời phê trỏ về, vd "BC1". */
  ma: string;
  truc: TrucLuat;
  noiDung: string;
  /** Câu mẫu lấy từ mục viết đạt — chỗ neo cho người duyệt đối chiếu. */
  viDu: string;
}

export interface BoLuatVanPhong {
  phienBan: number;
  /** Bộ nào chịu thước này. Rỗng = mọi bộ. */
  boApDung: string[];
  dieu: DieuLuat[];
  daDuyet: boolean;
}

export function traDieu(bo: BoLuatVanPhong, ma: string): DieuLuat | null {
  if (!ma) return null;
  const k = ma.trim().toUpperCase();
  return bo.dieu.find((d) => d.ma.toUpperCase() === k) ?? null;
}

export function apDungCho(bo: BoLuatVanPhong, tenBo: string): boolean {
  return !bo.boApDung.length || bo.boApDung.includes(tenBo);
}

/**
 * Phạm vi hành nghề là LUẬT CỨNG, không phải văn phong: người dùng hành nghề Y sỹ, nội
 * dung không được hàm ý "khám, chữa bệnh". Nó là hằng số trong mã chứ không nằm trong bộ
 * luật rút từ mẫu — không ai gỡ nó qua màn duyệt được.
 */
export const LUAT_PHAM_VI_HANH_NGHE: DieuLuat = {
  ma: 'PV1',
  truc: 'pham_vi_hanh_nghe',
  noiDung:
    'Không dùng chữ hàm ý khám chữa bệnh. Bảng từ: khám → đo, phòng khám → phòng chẩn trị, ' +
    'bác sĩ → thầy thuốc, chữa bệnh → điều trị.',
  viDu: 'Thầy thuốc đo kinh lạc tại phòng chẩn trị.',
};

/**
 * Bảng từ cấm. Chú ý "khám" đứng một mình KHÔNG bị bắt — "khám phá", "khám nghiệm" là
 * chữ bình thường. Chỉ bắt các cụm đã ghép nghĩa y tế.
 */
const BANG_TU: Array<{ re: RegExp; tu: string; thay: string }> = [
  { re: /bác\s+sĩ|bác\s+sỹ/gi, tu: 'bác sĩ', thay: 'thầy thuốc' },
  { re: /phòng\s+khám/gi, tu: 'phòng khám', thay: 'phòng chẩn trị' },
  { re: /khám\s+bệnh/gi, tu: 'khám bệnh', thay: 'đo' },
  { re: /chữa\s+bệnh/gi, tu: 'chữa bệnh', thay: 'điều trị' },
  { re: /chẩn\s+đoán\s+bệnh/gi, tu: 'chẩn đoán bệnh', thay: 'nhận định chứng' },
];

export function doPhamViHanhNghe(
  s: string,
): Array<{ tu: string; thay: string; viTri: number }> {
  if (typeof s !== 'string' || !s.trim()) return [];
  const ra: Array<{ tu: string; thay: string; viTri: number }> = [];
  for (const { re, tu, thay } of BANG_TU) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(s))) ra.push({ tu, thay, viTri: m.index });
  }
  return ra.sort((a, b) => a.viTri - b.viTri);
}
```

- [ ] **Step 4: Chạy test cho tới khi xanh**

Run: `npm test --prefix backend -- tham-dinh-luat`
Expected: PASS, 10 ca.

- [ ] **Step 5: Kiểm kiểu rồi commit**

```bash
cd backend && npm run type-check && cd ..
git add backend/src/utils/tham-dinh-luat.util.ts backend/src/utils/tham-dinh-luat.util.spec.ts
git commit -m "feat(tham-dinh): kiểu bộ luật văn phong + luật cứng phạm vi hành nghề"
```

---

### Task 2: Bóc JSON khỏi phản hồi mô hình và bốn rào chắn

**Files:**
- Create: `backend/src/utils/tham-dinh-loi-phe.util.ts`
- Test: `backend/src/utils/tham-dinh-loi-phe.util.spec.ts`

**Interfaces:**
- Consumes: `BoLuatVanPhong`, `traDieu` từ Task 1
- Produces:
  - `export interface LoiPheTho { truong?: string; kieu?: string; trichDan?: string; nhanXet?: string; deXuat?: string; bacCanCu?: number; dieuLuat?: string }`
  - `export interface LoiPheSach { truong: string | null; kieu: string; trichDan: string; nhanXet: string; deXuat: string | null; bacCanCu: number; dieuLuat: string | null }`
  - `export interface KetQuaLoc { nhan: LoiPheSach[]; loai: Array<{ lyDo: string; tho: LoiPheTho }> }`
  - `export function bocJson(s: string): unknown`
  - `export function locLoiPhe(tho: unknown, truong: Record<string, string>, luat: BoLuatVanPhong): KetQuaLoc`

- [ ] **Step 1: Viết test thất bại**

Tạo `backend/src/utils/tham-dinh-loi-phe.util.spec.ts`:

```typescript
import { bocJson, locLoiPhe } from './tham-dinh-loi-phe.util';
import type { BoLuatVanPhong } from './tham-dinh-luat.util';

const LUAT: BoLuatVanPhong = {
  phienBan: 1, boApDung: [], daDuyet: true,
  dieu: [{ ma: 'BC1', truc: 'bo_cuc', noiDung: 'Mở đầu bằng câu định vị.', viDu: '' }],
};

const THAN = {
  vi_tri: 'Ở chỗ lõm phía sau mắt cá trong, ngang với đỉnh mắt cá.',
  chu_tri: 'Trị đau lưng, ù tai, di tinh.',
};

describe('bocJson', () => {
  it('JSON trần', () => {
    expect(bocJson('{"a":1}')).toEqual({ a: 1 });
  });

  it('JSON trong khối ```json — mô hình hay bọc thế này dù bảo đừng', () => {
    expect(bocJson('Đây là kết quả:\n```json\n{"a":1}\n```\nhết.')).toEqual({ a: 1 });
  });

  it('JSON trong khối ``` không ghi ngôn ngữ', () => {
    expect(bocJson('```\n[{"b":2}]\n```')).toEqual([{ b: 2 }]);
  });

  it('có chữ dẫn trước dấu ngoặc mà không có khối mã', () => {
    expect(bocJson('Kết quả: [{"c":3}]')).toEqual([{ c: 3 }]);
  });

  it('không có JSON nào → null, KHÔNG ném lỗi (một mục hỏng không được làm sập cả ca)', () => {
    expect(bocJson('Tôi không tìm thấy vấn đề gì.')).toBeNull();
  });

  it('JSON vỡ → null', () => {
    expect(bocJson('{"a": ')).toBeNull();
  });
});

describe('locLoiPhe — rào chắn', () => {
  /**
   * Rào chắn QUAN TRỌNG NHẤT của cả kế hoạch. Mô hình bịa thì bịa cả câu trích dẫn, nên
   * phép kiểm không phải là "có trichDan không" mà là "trichDan có NẰM TRONG thân bài
   * không". Không khớp nguyên văn thì loại, không thương lượng.
   */
  it('nhận lời phê có trích dẫn khớp nguyên văn trong thân bài', () => {
    const r = locLoiPhe(
      [{ truong: 'vi_tri', kieu: 'cau_cut', trichDan: 'ngang với đỉnh mắt cá',
         nhanXet: 'Câu thiếu chủ ngữ.', bacCanCu: 1 }],
      THAN, LUAT,
    );
    expect(r.nhan).toHaveLength(1);
    expect(r.loai).toHaveLength(0);
  });

  it('LOẠI lời phê có trích dẫn KHÔNG nằm trong thân bài — đó là bịa', () => {
    const r = locLoiPhe(
      [{ truong: 'vi_tri', kieu: 'cau_cut', trichDan: 'câu này không hề có trong bài',
         nhanXet: 'x', bacCanCu: 1 }],
      THAN, LUAT,
    );
    expect(r.nhan).toHaveLength(0);
    expect(r.loai[0].lyDo).toMatch(/không khớp/i);
  });

  it('LOẠI lời phê không có trích dẫn', () => {
    const r = locLoiPhe([{ truong: 'vi_tri', kieu: 'x', nhanXet: 'y', bacCanCu: 1 }], THAN, LUAT);
    expect(r.nhan).toHaveLength(0);
    expect(r.loai[0].lyDo).toMatch(/thiếu trích dẫn/i);
  });

  it('LOẠI bậc căn cứ 2 — y văn từ trí nhớ mô hình bị CẤM, kể cả có dẫn sách', () => {
    const r = locLoiPhe(
      [{ truong: 'chu_tri', kieu: 'thieu_y', trichDan: 'Trị đau lưng', nhanXet: 'x', bacCanCu: 2 }],
      THAN, LUAT,
    );
    expect(r.nhan).toHaveLength(0);
    expect(r.loai[0].lyDo).toMatch(/bậc căn cứ/i);
  });

  it('bỏ trống bậc căn cứ thì hiểu là bậc 1', () => {
    const r = locLoiPhe(
      [{ truong: 'chu_tri', kieu: 'thieu_y', trichDan: 'Trị đau lưng', nhanXet: 'x' }],
      THAN, LUAT,
    );
    expect(r.nhan[0].bacCanCu).toBe(1);
  });

  it('LOẠI lời phê trục văn phong trỏ về điều luật KHÔNG CÓ THẬT', () => {
    const r = locLoiPhe(
      [{ truong: 'vi_tri', kieu: 'bo_cuc', trichDan: 'Ở chỗ lõm', nhanXet: 'x',
         bacCanCu: 1, dieuLuat: 'BC99' }],
      THAN, LUAT,
    );
    expect(r.nhan).toHaveLength(0);
    expect(r.loai[0].lyDo).toMatch(/điều luật/i);
  });

  it('nhận lời phê trỏ về điều luật CÓ THẬT', () => {
    const r = locLoiPhe(
      [{ truong: 'vi_tri', kieu: 'bo_cuc', trichDan: 'Ở chỗ lõm', nhanXet: 'x',
         bacCanCu: 1, dieuLuat: 'BC1' }],
      THAN, LUAT,
    );
    expect(r.nhan).toHaveLength(1);
    expect(r.nhan[0].dieuLuat).toBe('BC1');
  });

  it('trích dẫn khớp kể cả khi mô hình đổi khoảng trắng — chỉ khoảng trắng thôi', () => {
    const r = locLoiPhe(
      [{ truong: 'vi_tri', kieu: 'x', trichDan: 'ngang  với   đỉnh mắt cá',
         nhanXet: 'y', bacCanCu: 1 }],
      THAN, LUAT,
    );
    expect(r.nhan).toHaveLength(1);
  });

  it('trích dẫn tìm khắp thân bài khi mô hình ghi sai tên trường', () => {
    const r = locLoiPhe(
      [{ truong: 'vi_tri', kieu: 'x', trichDan: 'Trị đau lưng', nhanXet: 'y', bacCanCu: 1 }],
      THAN, LUAT,
    );
    expect(r.nhan).toHaveLength(1);
    expect(r.nhan[0].truong).toBe('chu_tri');
  });

  it('không phải mảng → không nhận gì, không ném lỗi', () => {
    expect(locLoiPhe({ loi: 'x' }, THAN, LUAT).nhan).toEqual([]);
    expect(locLoiPhe(null, THAN, LUAT).nhan).toEqual([]);
  });

  it('cắt nhận xét quá dài — bảng để người đọc, không để chứa cả bài', () => {
    const r = locLoiPhe(
      [{ truong: 'vi_tri', kieu: 'x', trichDan: 'Ở chỗ lõm', nhanXet: 'z'.repeat(3000), bacCanCu: 1 }],
      THAN, LUAT,
    );
    expect(r.nhan[0].nhanXet.length).toBe(1000);
  });
});
```

- [ ] **Step 2: Chạy test cho chắc là nó hỏng**

Run: `npm test --prefix backend -- tham-dinh-loi-phe`
Expected: FAIL — không tìm thấy module.

- [ ] **Step 3: Viết bản cài đặt**

Tạo `backend/src/utils/tham-dinh-loi-phe.util.ts`:

```typescript
import { traDieu, type BoLuatVanPhong } from './tham-dinh-luat.util';

/** Hình dạng lời phê như mô hình trả về — mọi trường đều có thể thiếu hoặc sai kiểu. */
export interface LoiPheTho {
  truong?: string;
  kieu?: string;
  trichDan?: string;
  nhanXet?: string;
  deXuat?: string;
  bacCanCu?: number;
  dieuLuat?: string;
}

/** Lời phê đã qua rào chắn, sẵn sàng ghi vào bệnh án. */
export interface LoiPheSach {
  truong: string | null;
  kieu: string;
  trichDan: string;
  nhanXet: string;
  deXuat: string | null;
  bacCanCu: number;
  dieuLuat: string | null;
}

export interface KetQuaLoc {
  nhan: LoiPheSach[];
  /** Giữ lại cái bị loại kèm lý do — đó là số liệu để chỉnh lời nhắc, đừng vứt đi. */
  loai: Array<{ lyDo: string; tho: LoiPheTho }>;
}

const TRAN_NHAN_XET = 1000;
const TRAN_DE_XUAT = 4000;

/**
 * Bóc JSON khỏi phản hồi. Mô hình hay bọc trong khối ``` dù lời nhắc bảo đừng, và hay
 * kèm một câu dẫn trước.
 *
 * Trả null thay vì ném lỗi: một mục hỏng không được làm sập cả ca 100 mục.
 */
export function bocJson(s: string): unknown {
  if (typeof s !== 'string' || !s.trim()) return null;

  const khoi = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const ungVien = [khoi?.[1], s].filter((x): x is string => typeof x === 'string');

  for (const u of ungVien) {
    const t = u.trim();
    try {
      return JSON.parse(t);
    } catch {
      // Cắt từ dấu mở đầu tiên tới dấu đóng cuối — vớt được ca "Kết quả: [...]".
      const dau = t.search(/[[{]/);
      const cuoi = Math.max(t.lastIndexOf(']'), t.lastIndexOf('}'));
      if (dau >= 0 && cuoi > dau) {
        try {
          return JSON.parse(t.slice(dau, cuoi + 1));
        } catch {
          /* thử ứng viên tiếp theo */
        }
      }
    }
  }
  return null;
}

/** Gộp khoảng trắng để so trích dẫn: mô hình hay đổi xuống dòng thành dấu cách. */
function gonTrang(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

/**
 * Bốn rào chắn, theo thứ tự:
 *   1. Có trích dẫn.
 *   2. Trích dẫn KHỚP NGUYÊN VĂN một chỗ nào đó trong thân bài. Đây là thứ duy nhất
 *      phân biệt "đọc rồi phê" với "bịa" — mô hình bịa thì bịa cả câu trích.
 *   3. Bậc căn cứ thuộc {1, 3}. Bậc 2 (y văn từ trí nhớ mô hình) bị CẤM.
 *   4. Lời phê có trỏ điều luật thì điều đó phải CÓ THẬT trong bộ luật.
 */
export function locLoiPhe(
  tho: unknown,
  truong: Record<string, string>,
  luat: BoLuatVanPhong,
): KetQuaLoc {
  const ra: KetQuaLoc = { nhan: [], loai: [] };
  if (!Array.isArray(tho)) return ra;

  const goiY = Object.entries(truong).map(([ten, chu]) => ({ ten, gon: gonTrang(chu) }));

  for (const x of tho as LoiPheTho[]) {
    if (!x || typeof x !== 'object') {
      ra.loai.push({ lyDo: 'không phải đối tượng', tho: x });
      continue;
    }

    const trich = typeof x.trichDan === 'string' ? x.trichDan.trim() : '';
    if (!trich) {
      ra.loai.push({ lyDo: 'thiếu trích dẫn', tho: x });
      continue;
    }

    // Tìm khắp thân bài, không chỉ trường mô hình khai: nó hay ghi sai tên trường mà
    // câu trích thì đúng. Trường thật lấy theo chỗ tìm thấy.
    const gonTrich = gonTrang(trich);
    const trungO = goiY.find((g) => g.gon.includes(gonTrich));
    if (!trungO) {
      ra.loai.push({ lyDo: 'trích dẫn không khớp nguyên văn trong thân bài', tho: x });
      continue;
    }

    const bac = typeof x.bacCanCu === 'number' ? x.bacCanCu : 1;
    if (bac !== 1 && bac !== 3) {
      ra.loai.push({ lyDo: `bậc căn cứ ${bac} không được phép`, tho: x });
      continue;
    }

    const maLuat = typeof x.dieuLuat === 'string' ? x.dieuLuat.trim() : '';
    if (maLuat && !traDieu(luat, maLuat)) {
      ra.loai.push({ lyDo: `điều luật "${maLuat}" không có trong bộ luật`, tho: x });
      continue;
    }

    ra.nhan.push({
      truong: trungO.ten,
      kieu: (typeof x.kieu === 'string' && x.kieu.trim()) || 'nhan_xet_chung',
      trichDan: trich.slice(0, 2000),
      nhanXet: (typeof x.nhanXet === 'string' ? x.nhanXet : '').trim().slice(0, TRAN_NHAN_XET),
      deXuat: typeof x.deXuat === 'string' && x.deXuat.trim()
        ? x.deXuat.trim().slice(0, TRAN_DE_XUAT)
        : null,
      bacCanCu: bac,
      dieuLuat: maLuat ? traDieu(luat, maLuat)!.ma : null,
    });
  }

  return ra;
}
```

- [ ] **Step 4: Chạy test cho tới khi xanh**

Run: `npm test --prefix backend -- tham-dinh-loi-phe`
Expected: PASS, 17 ca.

- [ ] **Step 5: Kiểm kiểu rồi commit**

```bash
cd backend && npm run type-check && cd ..
git add backend/src/utils/tham-dinh-loi-phe.util.ts backend/src/utils/tham-dinh-loi-phe.util.spec.ts
git commit -m "feat(tham-dinh): bóc JSON phản hồi mô hình + bốn rào chắn chống bịa"
```

---

### Task 3: Xếp hàng đợi lớp 2

**Files:**
- Create: `backend/src/utils/tham-dinh-hang-doi.util.ts`
- Test: `backend/src/utils/tham-dinh-hang-doi.util.spec.ts`

**Interfaces:**
- Consumes: không
- Produces:
  - `export interface UngVienSoi { bo: string; ma: string; slug: string; tieuDe: string; doDay: number; soLoiMay: number; vanTayNoiDung: string; vanTayThayThuoc: string | null; diemCoHoiSeo: number }`
  - `export function diemUuTien(u: UngVienSoi): number`
  - `export function xepHangDoi(ds: UngVienSoi[], soLuong: number): UngVienSoi[]`
  - `export const DAY_TOI_THIEU = 800`

- [ ] **Step 1: Viết test thất bại**

Tạo `backend/src/utils/tham-dinh-hang-doi.util.spec.ts`:

```typescript
import { diemUuTien, xepHangDoi, DAY_TOI_THIEU, type UngVienSoi } from './tham-dinh-hang-doi.util';

function uv(p: Partial<UngVienSoi> = {}): UngVienSoi {
  return {
    bo: 'huyet_vi', ma: 'm1', slug: 's1', tieuDe: 'T', doDay: 2000, soLoiMay: 0,
    vanTayNoiDung: 'v1', vanTayThayThuoc: null, diemCoHoiSeo: 0, ...p,
  };
}

describe('diemUuTien', () => {
  /** Công thức của spec: cơ hội SEO × 3 + mức hỏng máy × 2 + độ dày. */
  it('cơ hội SEO nặng gấp ba lần mức hỏng máy', () => {
    const a = diemUuTien(uv({ diemCoHoiSeo: 10, soLoiMay: 0 }));
    const b = diemUuTien(uv({ diemCoHoiSeo: 0, soLoiMay: 10 }));
    expect(a).toBeGreaterThan(b);
  });

  it('bài dài hơn thì ưu tiên hơn khi mọi thứ khác bằng nhau', () => {
    expect(diemUuTien(uv({ doDay: 9000 }))).toBeGreaterThan(diemUuTien(uv({ doDay: 1000 })));
  });

  it('độ dày KHÔNG được lấn át — 20.000 ký tự không thắng nổi một mục có người tìm', () => {
    const dai = diemUuTien(uv({ doDay: 20000, diemCoHoiSeo: 0 }));
    const coNguoiTim = diemUuTien(uv({ doDay: 1000, diemCoHoiSeo: 20 }));
    expect(coNguoiTim).toBeGreaterThan(dai);
  });
});

describe('xepHangDoi', () => {
  /**
   * Van tiết kiệm tiền. Bài chưa đổi kể từ lần soi kỹ trước thì không gọi mô hình lại —
   * đây là chỗ giữ cho chi phí không nhân lên mỗi đêm.
   */
  it('BỎ mục có vân tay không đổi kể từ lần soi thầy thuốc trước', () => {
    const ds = [uv({ ma: 'a', vanTayNoiDung: 'v1', vanTayThayThuoc: 'v1' })];
    expect(xepHangDoi(ds, 10)).toHaveLength(0);
  });

  it('GIỮ mục đã đổi nội dung', () => {
    const ds = [uv({ ma: 'a', vanTayNoiDung: 'v2', vanTayThayThuoc: 'v1' })];
    expect(xepHangDoi(ds, 10)).toHaveLength(1);
  });

  it('GIỮ mục chưa soi kỹ lần nào', () => {
    expect(xepHangDoi([uv({ vanTayThayThuoc: null })], 10)).toHaveLength(1);
  });

  it('BỎ mục mỏng — dưới ngưỡng thì không có gì để phê văn phong', () => {
    expect(xepHangDoi([uv({ doDay: DAY_TOI_THIEU - 1 })], 10)).toHaveLength(0);
  });

  it('BỎ bài thuốc và dược liệu — giai đoạn đầu việc của chúng là vào chỉ mục Google', () => {
    const ds = [uv({ bo: 'bai_thuoc' }), uv({ bo: 'duoc_lieu' }), uv({ bo: 'huyet_vi' })];
    expect(xepHangDoi(ds, 10).map((x) => x.bo)).toEqual(['huyet_vi']);
  });

  it('cắt đúng số lượng xin, lấy phần đầu hàng đợi', () => {
    const ds = Array.from({ length: 20 }, (_, i) => uv({ ma: `m${i}`, diemCoHoiSeo: i }));
    const r = xepHangDoi(ds, 5);
    expect(r).toHaveLength(5);
    expect(r[0].diemCoHoiSeo).toBe(19);
  });

  it('số lượng 0 → hàng đợi rỗng, không phải "lấy tất"', () => {
    expect(xepHangDoi([uv()], 0)).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Chạy test cho chắc là nó hỏng**

Run: `npm test --prefix backend -- tham-dinh-hang-doi`
Expected: FAIL — không tìm thấy module.

- [ ] **Step 3: Viết bản cài đặt**

Tạo `backend/src/utils/tham-dinh-hang-doi.util.ts`:

```typescript
/**
 * Xếp hàng đợi cho lớp thầy thuốc.
 *
 * Lớp 1 quét cả kho vì nó miễn phí. Lớp 2 gọi mô hình nên phải chọn, và chọn theo cái gì
 * là quyết định đắt nhất của cả bot: 484 trang huyệt gom 75% lượt hiển thị toàn site,
 * còn 9.112 bài thuốc trống rỗng thì đọc kỹ cũng không ra chữ nào để phê.
 */

export interface UngVienSoi {
  bo: string;
  ma: string;
  slug: string;
  tieuDe: string;
  /** Số ký tự thân bài, lấy từ td_muc.do_day. */
  doDay: number;
  soLoiMay: number;
  vanTayNoiDung: string;
  /** Vân tay tại lần soi kỹ gần nhất; null = chưa soi kỹ lần nào. */
  vanTayThayThuoc: string | null;
  /** Điểm cơ hội từ Search Console. Lớp 3 mới nối; tới đó vẫn là 0 và công thức không đổi. */
  diemCoHoiSeo: number;
}

/** Dưới ngưỡng này thì không có đủ chữ để phê văn phong — đo thật: trung vị mục huyệt 336 ký tự. */
export const DAY_TOI_THIEU = 800;

/**
 * Giai đoạn đầu KHÔNG đưa bài thuốc và dược liệu vào lớp 2: 15.000 trang ấy Google chưa
 * hề biết tới, việc của chúng là vào được chỉ mục, không phải gọt câu chữ.
 */
const BO_NGOAI_PHAM_VI = new Set(['bai_thuoc', 'duoc_lieu', 'nguon_y_van']);

/**
 * Điểm ưu tiên. Độ dày chia 2000 rồi chặn trần 5 để nó KHÔNG lấn át: một mục 20.000 ký tự
 * không được đứng trên một mục có người tìm thật trên Google.
 */
export function diemUuTien(u: UngVienSoi): number {
  const day = Math.min(u.doDay / 2000, 5);
  return u.diemCoHoiSeo * 3 + u.soLoiMay * 2 + day;
}

export function xepHangDoi(ds: UngVienSoi[], soLuong: number): UngVienSoi[] {
  if (soLuong <= 0) return [];
  return ds
    .filter((u) => !BO_NGOAI_PHAM_VI.has(u.bo))
    .filter((u) => u.doDay >= DAY_TOI_THIEU)
    // Van vân tay: chưa đổi thì không gọi mô hình lại.
    .filter((u) => u.vanTayThayThuoc !== u.vanTayNoiDung)
    .sort((a, b) => diemUuTien(b) - diemUuTien(a))
    .slice(0, soLuong);
}
```

- [ ] **Step 4: Chạy test cho tới khi xanh**

Run: `npm test --prefix backend -- tham-dinh-hang-doi`
Expected: PASS, 11 ca.

- [ ] **Step 5: Kiểm kiểu rồi commit**

```bash
cd backend && npm run type-check && cd ..
git add backend/src/utils/tham-dinh-hang-doi.util.ts backend/src/utils/tham-dinh-hang-doi.util.spec.ts
git commit -m "feat(tham-dinh): hàng đợi lớp 2 — van vân tay, ngưỡng dày, ngoài phạm vi"
```

---

### Task 4: Bảng bộ luật, cột vân tay lớp 2, và các phép đọc/ghi mới

**Files:**
- Modify: `backend/src/controllers/tham-dinh-cms.service.ts`
- Modify: `backend/src/controllers/tham-dinh-cms.service.spec.ts`
- Modify: `backend/src/models/tham-dinh.dto.ts`

**Interfaces:**
- Consumes: `UngVienSoi` (Task 3), `LoiPheSach` (Task 2), `BoLuatVanPhong` (Task 1)
- Produces trên `ThamDinhCmsService`:
  - `docUngVienSoi(): Promise<UngVienSoi[]>`
  - `docThanBai(bo: string, ma: string, than: string[]): Promise<Record<string, string>>`
  - `docChumLienQuan(tieuDe: string, boTru: string, ma: string): Promise<Array<{ bo: string; tieuDe: string; tomTat: string }>>`
  - `ghiLoiPheThayThuoc(bo: string, ma: string, vanTay: string, ds: LoiPheSach[]): Promise<void>`
  - `luuBoLuat(bo: BoLuatVanPhong): Promise<number>`
  - `docBoLuat(chiBanDaDuyet: boolean): Promise<BoLuatVanPhong | null>`
  - `duyetBoLuat(phienBan: number): Promise<void>`

- [ ] **Step 1: Viết test thất bại**

Thêm vào cuối `backend/src/controllers/tham-dinh-cms.service.spec.ts`:

```typescript
describe('ThamDinhCmsService.DDL — phần của lớp 2', () => {
  it('dựng bảng bộ luật văn phong', () => {
    const all = ThamDinhCmsService.DDL.join('\n');
    expect(all).toMatch(/CREATE TABLE IF NOT EXISTS td_luat_van_phong/i);
  });

  /**
   * Vân tay của lớp 2 phải là CỘT RIÊNG. `van_tay_noi_dung` bị lớp 1 ghi đè mỗi đêm, nên
   * lấy nó làm mốc thì van tiết kiệm tiền không bao giờ đóng: mục nào cũng "vừa đổi".
   */
  it('có cột vân tay riêng cho lần soi thầy thuốc', () => {
    const all = ThamDinhCmsService.DDL.join('\n');
    expect(all).toMatch(/van_tay_thay_thuoc/i);
  });

  it('thêm cột bằng ALTER ... ADD COLUMN IF NOT EXISTS, không dựng lại bảng', () => {
    const them = ThamDinhCmsService.DDL.filter((s) => /van_tay_thay_thuoc/i.test(s) && /ALTER/i.test(s));
    expect(them.length).toBeGreaterThan(0);
    for (const s of them) expect(s).toMatch(/ADD COLUMN IF NOT EXISTS/i);
  });

  it('bảng bộ luật cũng dùng timestamptz', () => {
    const tao = ThamDinhCmsService.DDL.filter((s) => /CREATE TABLE/i.test(s)).join('\n');
    expect(tao).not.toMatch(/\btimestamp\b(?!tz)/i);
  });
});
```

- [ ] **Step 2: Chạy test cho chắc là nó hỏng**

Run: `npm test --prefix backend -- tham-dinh-cms`
Expected: FAIL — 3 ca mới đỏ (chưa có `td_luat_van_phong`, chưa có `van_tay_thay_thuoc`).

- [ ] **Step 3: Thêm DDL**

Trong `backend/src/controllers/tham-dinh-cms.service.ts`, thêm vào CUỐI mảng `DDL` (giữ nguyên các câu đã có):

```typescript
    `ALTER TABLE td_ho_so ADD COLUMN IF NOT EXISTS van_tay_thay_thuoc VARCHAR(16)`,
    `CREATE TABLE IF NOT EXISTS td_luat_van_phong (
       phien_ban   INT PRIMARY KEY,
       bo_ap_dung  TEXT[] NOT NULL DEFAULT '{}',
       dieu        JSONB NOT NULL DEFAULT '[]'::jsonb,
       da_duyet    BOOLEAN NOT NULL DEFAULT false,
       duyet_boi   TEXT,
       duyet_luc   timestamptz,
       created_at  timestamptz NOT NULL DEFAULT now()
     )`,
    `CREATE INDEX IF NOT EXISTS idx_td_luat_da_duyet ON td_luat_van_phong (da_duyet, phien_ban DESC)`,
```

- [ ] **Step 4: Thêm các phép đọc/ghi**

Trong cùng file, thêm các phương thức sau vào lớp `ThamDinhCmsService` (đặt sau `ghiHoSoLo`):

```typescript
  /**
   * Ứng viên cho hàng đợi lớp 2. Join sang td_muc để lấy độ dày thật — td_ho_so không
   * giữ số ký tự, và `diem_du_phan` là tỉ lệ cột có nội dung chứ không phải độ dày.
   */
  async docUngVienSoi(): Promise<UngVienSoi[]> {
    const r = await this.phaiCo().query<{
      bo: string; ma: string; slug: string; tieu_de: string; do_day: number;
      so_loi_may: number; van_tay_noi_dung: string; van_tay_thay_thuoc: string | null;
    }>(
      `SELECT h.bo, h.ma, h.slug, h.tieu_de, m.do_day,
              (SELECT count(*)::int FROM td_nhan_xet n
                 WHERE n.ho_so_id = h.id AND n.lop = 'may'
                   AND n.kieu NOT IN ('lien_ket_dung_duoc', 'ten_vi_la')) AS so_loi_may,
              h.van_tay_noi_dung, h.van_tay_thay_thuoc
       FROM td_ho_so h
       JOIN td_muc m ON m.bo = h.bo AND m.ma = h.ma`,
    );
    return r.rows.map((x) => ({
      bo: x.bo, ma: x.ma, slug: x.slug, tieuDe: x.tieu_de,
      doDay: x.do_day || 0, soLoiMay: x.so_loi_may || 0,
      vanTayNoiDung: x.van_tay_noi_dung || '',
      vanTayThayThuoc: x.van_tay_thay_thuoc,
      diemCoHoiSeo: 0, // lớp 3 nối Search Console vào đây
    }));
  }

  /** Thân bài đầy đủ của một mục, rút chữ bằng rutChu như lớp 1. */
  async docThanBai(bo: string, ma: string, than: string[]): Promise<Record<string, string>> {
    const cot = than
      .map((t) => `to_jsonb(r.${JSON.stringify(t)}) AS ${JSON.stringify(t)}`)
      .join(', ');
    const sql =
      `SELECT ${cot || '1 AS x'} FROM ${JSON.stringify('ec_' + bo)} r WHERE r.id = $1 LIMIT 1`;
    const r = await this.phaiCo().query<Record<string, unknown>>(sql, [ma]);
    const truong: Record<string, string> = {};
    if (!r.rows.length) return truong;
    for (const t of than) truong[t] = rutChu(r.rows[0][t]);
    return truong;
  }

  /**
   * Chùm mục liên quan — "đọc cả chùm, không đọc một mình".
   *
   * Tra bằng chỉ mục toàn văn có sẵn (`td_muc.tsv`, khoá đã bỏ dấu qua `td_bo_dau`), lấy
   * các mục Ở BỘ KHÁC có nhắc tên mục đang soi. Đây là cách duy nhất để phê được loại
   * nhận xét bắc cầu giữa hai mục — vd huyệt nói chủ trị hàn mà bài châm cứu dùng nó lại
   * trị nhiệt.
   */
  async docChumLienQuan(
    tieuDe: string,
    boTru: string,
    ma: string,
  ): Promise<Array<{ bo: string; tieuDe: string; tomTat: string }>> {
    if (!tieuDe.trim()) return [];
    const r = await this.phaiCo().query<{ bo: string; tieu_de: string; tom_tat: string }>(
      `SELECT bo, tieu_de, tom_tat FROM td_muc
       WHERE tsv @@ plainto_tsquery('simple', td_bo_dau($1))
         AND NOT (bo = $2 AND ma = $3)
       ORDER BY do_day DESC LIMIT 4`,
      [tieuDe, boTru, ma],
    );
    return r.rows.map((x) => ({ bo: x.bo, tieuDe: x.tieu_de, tomTat: x.tom_tat }));
  }

  /** Thay toàn bộ nhận xét lớp `thay_thuoc` của một mục và đóng van vân tay. */
  async ghiLoiPheThayThuoc(
    bo: string,
    ma: string,
    vanTay: string,
    ds: LoiPheSach[],
  ): Promise<void> {
    const c = this.phaiCo();
    await c.query('BEGIN');
    try {
      const r = await c.query<{ id: number }>(
        `UPDATE td_ho_so SET van_tay_thay_thuoc = $3, soi_thay_thuoc_luc = now(),
                             updated_at = now()
         WHERE bo = $1 AND ma = $2 RETURNING id`,
        [bo, ma, vanTay],
      );
      if (!r.rows.length) {
        await c.query('ROLLBACK');
        return;
      }
      const id = r.rows[0].id;
      await c.query(`DELETE FROM td_nhan_xet WHERE ho_so_id = $1 AND lop = 'thay_thuoc'`, [id]);
      for (const n of ds) {
        await c.query(
          `INSERT INTO td_nhan_xet
             (ho_so_id, lop, kieu, truong, trich_dan, nhan_xet, de_xuat, bac_can_cu, nang)
           VALUES ($1, 'thay_thuoc', $2, $3, $4, $5, $6, $7, false)`,
          [id, n.kieu, n.truong, n.trichDan, n.nhanXet, n.deXuat, n.bacCanCu],
        );
      }
      await c.query('COMMIT');
    } catch (e) {
      await c.query('ROLLBACK').catch(() => undefined);
      throw e;
    }
  }

  /** Lưu một bản bộ luật MỚI (chưa duyệt). Trả về số phiên bản vừa cấp. */
  async luuBoLuat(bo: BoLuatVanPhong): Promise<number> {
    const c = this.phaiCo();
    const m = await c.query<{ pb: number }>(
      `SELECT COALESCE(MAX(phien_ban), 0) + 1 AS pb FROM td_luat_van_phong`,
    );
    const pb = m.rows[0].pb;
    await c.query(
      `INSERT INTO td_luat_van_phong (phien_ban, bo_ap_dung, dieu, da_duyet)
       VALUES ($1, $2, $3::jsonb, false)`,
      [pb, bo.boApDung, JSON.stringify(bo.dieu)],
    );
    return pb;
  }

  /**
   * Bản bộ luật đang dùng. `chiBanDaDuyet = true` là thứ ca soi phải gọi: chạy bằng bộ
   * luật chưa ai duyệt thì lời phê không có thẩm quyền nào cả.
   */
  async docBoLuat(chiBanDaDuyet: boolean): Promise<BoLuatVanPhong | null> {
    const r = await this.phaiCo().query<{
      phien_ban: number; bo_ap_dung: string[]; dieu: DieuLuat[]; da_duyet: boolean;
    }>(
      `SELECT phien_ban, bo_ap_dung, dieu, da_duyet FROM td_luat_van_phong
       ${chiBanDaDuyet ? 'WHERE da_duyet = true' : ''}
       ORDER BY phien_ban DESC LIMIT 1`,
    );
    if (!r.rows.length) return null;
    const x = r.rows[0];
    return {
      phienBan: x.phien_ban,
      boApDung: x.bo_ap_dung || [],
      dieu: Array.isArray(x.dieu) ? x.dieu : [],
      daDuyet: x.da_duyet,
    };
  }

  async duyetBoLuat(phienBan: number): Promise<void> {
    await this.phaiCo().query(
      `UPDATE td_luat_van_phong SET da_duyet = true, duyet_luc = now() WHERE phien_ban = $1`,
      [phienBan],
    );
  }
```

Và thêm các import ở đầu file:

```typescript
import type { UngVienSoi } from '../utils/tham-dinh-hang-doi.util';
import type { LoiPheSach } from '../utils/tham-dinh-loi-phe.util';
import type { BoLuatVanPhong, DieuLuat } from '../utils/tham-dinh-luat.util';
```

- [ ] **Step 5: Chạy test cho tới khi xanh**

Run: `npm test --prefix backend -- tham-dinh-cms`
Expected: PASS, 10 ca (6 cũ + 4 mới).

- [ ] **Step 6: Kiểm kiểu rồi commit**

```bash
cd backend && npm run type-check && cd ..
git add backend/src/controllers/tham-dinh-cms.service.ts backend/src/controllers/tham-dinh-cms.service.spec.ts
git commit -m "feat(tham-dinh): bảng bộ luật văn phong, vân tay lớp 2, đọc chùm liên quan"
```

---

### Task 5: Dịch vụ gọi mô hình — hai tầng, trần chi tiêu

**Files:**
- Create: `backend/src/controllers/tham-dinh-llm.service.ts`
- Test: `backend/src/controllers/tham-dinh-llm.service.spec.ts`

**Interfaces:**
- Consumes: không (chỉ `ConfigService` và SDK `openai`)
- Produces:
  - `class ThamDinhLlmService`
  - `daCauHinh(): boolean`
  - `moCa(): void` / `soLuotDaGoi(): number` / `conHanMuc(): boolean`
  - `goi(loiNhac: string, noiDung: string, doKy: boolean): Promise<string | null>`
  - `modelCuaTang(doKy: boolean): string`

- [ ] **Step 1: Viết test thất bại**

Tạo `backend/src/controllers/tham-dinh-llm.service.spec.ts`:

```typescript
import { ThamDinhLlmService } from './tham-dinh-llm.service';

function svc(env: Record<string, string | undefined> = {}) {
  return new ThamDinhLlmService({ get: (k: string) => env[k] } as never);
}

describe('ThamDinhLlmService.daCauHinh', () => {
  it('thiếu YESCALE_API_KEY thì NẰM IM, không ném lỗi', () => {
    expect(svc({}).daCauHinh()).toBe(false);
  });

  it('có khoá thì sẵn sàng', () => {
    expect(svc({ YESCALE_API_KEY: 'k' }).daCauHinh()).toBe(true);
  });
});

describe('ThamDinhLlmService.modelCuaTang', () => {
  /**
   * Hai tầng vì một lý do đo được: flash-lite quét cả kho tốn 1–2 đô, rẻ đến mức không
   * phải cân nhắc, nhưng phê văn y học Đông y thì không tin được bằng người. Tầng sàng
   * chạy rộng, tầng đọc kỹ chạy vài chục mục đầu hàng đợi.
   */
  it('tầng sàng dùng YESCALE_MODEL', () => {
    expect(svc({ YESCALE_MODEL: 'gemini-2.5-flash-lite' }).modelCuaTang(false))
      .toBe('gemini-2.5-flash-lite');
  });

  it('tầng đọc kỹ dùng THAM_DINH_MODEL_KY', () => {
    expect(svc({ YESCALE_MODEL: 'a', THAM_DINH_MODEL_KY: 'claude-sonnet-5' }).modelCuaTang(true))
      .toBe('claude-sonnet-5');
  });

  it('không khai model đọc kỹ thì dùng chung model sàng — KHÔNG được tự chọn model lạ', () => {
    expect(svc({ YESCALE_MODEL: 'a' }).modelCuaTang(true)).toBe('a');
  });

  it('không khai gì cả thì rơi về gemini-2.5-flash-lite', () => {
    expect(svc({}).modelCuaTang(false)).toBe('gemini-2.5-flash-lite');
  });
});

describe('ThamDinhLlmService — trần chi tiêu', () => {
  /**
   * Trần tính bằng SỐ LƯỢT GỌI chứ không phải token: lượt gọi là thứ đếm được chắc chắn
   * ngay tại chỗ, còn token thì phải tin con số nhà cung cấp trả về. Chạm trần thì DỪNG,
   * ghi chỗ dừng, mai chạy tiếp — không phải bỏ dở cả ca.
   */
  it('mặc định 300 lượt mỗi ca', () => {
    const s = svc({ YESCALE_API_KEY: 'k' });
    s.moCa();
    expect(s.conHanMuc()).toBe(true);
  });

  it('đếm lượt và chặn khi chạm trần', async () => {
    const s = svc({ YESCALE_API_KEY: 'k', THAM_DINH_TRAN_TIEN: '2' });
    s.moCa();
    (s as unknown as { goiThat: () => Promise<string> }).goiThat = () => Promise.resolve('ok');

    expect(await s.goi('l', 'n', false)).toBe('ok');
    expect(await s.goi('l', 'n', false)).toBe('ok');
    expect(s.conHanMuc()).toBe(false);
    expect(await s.goi('l', 'n', false)).toBeNull();
    expect(s.soLuotDaGoi()).toBe(2);
  });

  it('moCa() đặt lại bộ đếm — ca mai không gánh nợ của ca hôm nay', () => {
    const s = svc({ YESCALE_API_KEY: 'k', THAM_DINH_TRAN_TIEN: '1' });
    s.moCa();
    (s as unknown as { goiThat: () => Promise<string> }).goiThat = () => Promise.resolve('ok');
    return s.goi('l', 'n', false).then(() => {
      expect(s.conHanMuc()).toBe(false);
      s.moCa();
      expect(s.conHanMuc()).toBe(true);
      expect(s.soLuotDaGoi()).toBe(0);
    });
  });

  it('lỗi mạng KHÔNG ném ra ngoài — một mục hỏng không được làm sập ca', async () => {
    const s = svc({ YESCALE_API_KEY: 'k' });
    s.moCa();
    (s as unknown as { goiThat: () => Promise<string> }).goiThat = () =>
      Promise.reject(new Error('502 upstream'));
    expect(await s.goi('l', 'n', false)).toBeNull();
    // Lượt hỏng VẪN tính vào trần: nếu không, một sự cố bên nhà cung cấp thành vòng lặp
    // gọi không giới hạn.
    expect(s.soLuotDaGoi()).toBe(1);
  });

  it('chưa cấu hình thì trả null ngay, không đụng mạng', async () => {
    const s = svc({});
    s.moCa();
    expect(await s.goi('l', 'n', false)).toBeNull();
    expect(s.soLuotDaGoi()).toBe(0);
  });
});
```

- [ ] **Step 2: Chạy test cho chắc là nó hỏng**

Run: `npm test --prefix backend -- tham-dinh-llm`
Expected: FAIL — không tìm thấy module.

- [ ] **Step 3: Viết bản cài đặt**

Tạo `backend/src/controllers/tham-dinh-llm.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

/**
 * Cửa duy nhất gọi mô hình của bot thẩm định.
 *
 * Ba tính chất, và cả ba đều là chống-tự-bắn-chân chứ không phải tiện nghi:
 *   · KHÔNG NÉM LỖI. Trả null. Một mục hỏng không được làm sập ca 100 mục.
 *   · ĐẾM MỌI LƯỢT, kể cả lượt hỏng. Không đếm lượt hỏng thì một sự cố bên nhà cung cấp
 *     biến thành vòng lặp gọi không giới hạn.
 *   · THIẾU CẤU HÌNH THÌ NẰM IM. Cùng lối với Telegram và push trong `su-co`.
 */
@Injectable()
export class ThamDinhLlmService {
  private readonly logger = new Logger('ThamDinhLlm');
  private client: OpenAI | null = null;
  private daGoi = 0;

  constructor(private readonly config: ConfigService) {}

  daCauHinh(): boolean {
    const k = this.config.get<string>('YESCALE_API_KEY');
    return typeof k === 'string' && k.trim().length > 0;
  }

  moCa(): void {
    this.daGoi = 0;
  }

  soLuotDaGoi(): number {
    return this.daGoi;
  }

  private tranTien(): number {
    const n = Number(this.config.get<string>('THAM_DINH_TRAN_TIEN'));
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 300;
  }

  conHanMuc(): boolean {
    return this.daGoi < this.tranTien();
  }

  modelCuaTang(doKy: boolean): string {
    const sang = this.config.get<string>('YESCALE_MODEL') || 'gemini-2.5-flash-lite';
    if (!doKy) return sang;
    return this.config.get<string>('THAM_DINH_MODEL_KY') || sang;
  }

  async goi(loiNhac: string, noiDung: string, doKy: boolean): Promise<string | null> {
    if (!this.daCauHinh()) return null;
    if (!this.conHanMuc()) return null;

    this.daGoi += 1;
    try {
      return await this.goiThat(loiNhac, noiDung, doKy);
    } catch (e) {
      this.logger.warn(`gọi mô hình hỏng: ${(e as Error).message}`);
      return null;
    }
  }

  /** Tách riêng để test thay được mà không cần mạng. */
  protected async goiThat(loiNhac: string, noiDung: string, doKy: boolean): Promise<string> {
    const phanHoi = await this.layClient().chat.completions.create({
      model: this.modelCuaTang(doKy),
      temperature: 0.1,
      max_tokens: doKy ? 4000 : 2000,
      messages: [
        { role: 'system', content: loiNhac },
        { role: 'user', content: noiDung },
      ],
    });
    return phanHoi.choices?.[0]?.message?.content?.trim() || '';
  }

  private layClient(): OpenAI {
    if (!this.client) {
      this.client = new OpenAI({
        apiKey: this.config.get<string>('YESCALE_API_KEY'),
        baseURL: this.config.get<string>('YESCALE_BASE_URL') || 'https://api.yescale.io/v1',
      });
    }
    return this.client;
  }
}
```

- [ ] **Step 4: Chạy test cho tới khi xanh**

Run: `npm test --prefix backend -- tham-dinh-llm`
Expected: PASS, 11 ca.

Ghi chú: test thay `goiThat` bằng cách gán đè lên thực thể. Nó là `protected` nên TypeScript
không cho gán thẳng — test đã ép kiểu qua `as unknown as { goiThat: ... }`, đúng ý đồ.

- [ ] **Step 5: Kiểm kiểu rồi commit**

```bash
cd backend && npm run type-check && cd ..
git add backend/src/controllers/tham-dinh-llm.service.ts backend/src/controllers/tham-dinh-llm.service.spec.ts
git commit -m "feat(tham-dinh): dịch vụ gọi mô hình hai tầng, trần chi tiêu theo lượt"
```

---

### Task 6: Bước 0 — lập thước từ mười mục viết đạt

**Files:**
- Create: `backend/src/controllers/tham-dinh-thay-thuoc.controller.ts`
- Test: `backend/src/controllers/tham-dinh-thay-thuoc.controller.spec.ts`
- Modify: `backend/src/models/tham-dinh.dto.ts`

**Interfaces:**
- Consumes: `ThamDinhCmsService` (Task 4), `ThamDinhLlmService` (Task 5), `bocJson` (Task 2), `LUAT_PHAM_VI_HANH_NGHE` (Task 1)
- Produces:
  - `class ThamDinhThayThuocService`
  - `static readonly MUC_MAU: Array<{ bo: string; slug: string; tieuDe: string }>`
  - `loiNhacLapThuoc(): string`
  - `lapThuoc(): Promise<{ phienBan: number | null; soDieu: number; loi: string[] }>`

**Mười mục mẫu** — lọc từ bệnh án lớp 1 (mục dày trên 800 ký tự, đủ phần, ít nhận xét máy nhất), trải đều các bộ có thân bài thật:

| Bộ | Mục | Độ dày | Lỗi máy |
|---|---|---|---|
| huyet_vi | Quan Nguyên (`quan-nguyen`) | 10.375 | 0 |
| huyet_vi | Bách Hội (`bach-hoi`) | 6.477 | 0 |
| huyet_vi | Trung Cực (`trung-cuc`) | 6.152 | 0 |
| benh_hoc | Huyết Áp Thấp (`huyet-ap-thap`) | 18.813 | 3 |
| benh_hoc | Kinh Nguyệt Đến Không Đúng Kỳ (`kinh-nguyet-den-khong-dung-ky`) | 7.603 | 3 |
| cham_cuu_tri_benh | Viêm Gan Siêu Vi (`viem-gan-sieu-vi`) | 4.720 | 0 |
| cham_cuu_tri_benh | Loãng Xương (`loang-xuong`) | 8.473 | 1 |
| duoc_lieu | Quy Bản (`80`) | 6.801 | 0 |
| duoc_lieu | Tiền Hồ (`101`) | 6.151 | 0 |
| kinh_mach | Kinh Thủ Dương Minh Đại Trường (`dai-truong`) | 4.048 | 4 |

⚠️ `duoc_lieu` dùng `slug` là SỐ (`80`, `101`) — đó là slug thật trong kho, không phải nhầm.

- [ ] **Step 1: Viết test thất bại**

Tạo `backend/src/controllers/tham-dinh-thay-thuoc.controller.spec.ts`:

```typescript
jest.mock('@nestjs/schedule', () => ({
  Cron: () => () => undefined,
  CronExpression: {},
}));

import { ThamDinhThayThuocService } from './tham-dinh-thay-thuoc.controller';

describe('ThamDinhThayThuocService.MUC_MAU', () => {
  it('đúng mười mục, trải trên năm bộ', () => {
    const m = ThamDinhThayThuocService.MUC_MAU;
    expect(m).toHaveLength(10);
    expect(new Set(m.map((x) => x.bo)).size).toBe(5);
  });

  it('không mục nào thuộc bài thuốc — thước phải rút từ bộ mà lớp 2 thật sự soi', () => {
    expect(ThamDinhThayThuocService.MUC_MAU.find((x) => x.bo === 'bai_thuoc')).toBeUndefined();
  });
});

describe('ThamDinhThayThuocService.loiNhacLapThuoc', () => {
  const s = new ThamDinhThayThuocService(null as never, null as never, null as never);

  it('cấm mô hình thêm kiến thức ngoài — đây là luật dễ trôi nhất', () => {
    const l = s.loiNhacLapThuoc();
    expect(l).toMatch(/không.*(thêm|bịa)/i);
  });

  it('đòi trả về JSON mảng điều luật với đủ bốn khoá', () => {
    const l = s.loiNhacLapThuoc();
    for (const k of ['ma', 'truc', 'noiDung', 'viDu']) expect(l).toContain(k);
  });

  it('đòi mỗi điều luật kèm ví dụ LẤY TỪ chính mục mẫu', () => {
    expect(s.loiNhacLapThuoc()).toMatch(/ví dụ.*(trích|lấy).*(mẫu|bài)/i);
  });
});

describe('ThamDinhThayThuocService.lapThuoc — khi chưa cấu hình', () => {
  it('thiếu khoá mô hình thì NẰM IM, không ném lỗi', async () => {
    const llm = { daCauHinh: () => false, moCa: () => undefined } as never;
    const cms = { daCauHinh: () => true } as never;
    const s = new ThamDinhThayThuocService(cms, llm, null as never);
    const r = await s.lapThuoc();
    expect(r.phienBan).toBeNull();
    expect(r.loi[0]).toMatch(/chưa cấu hình/i);
  });

  it('thiếu cấu hình kho cũng nằm im', async () => {
    const llm = { daCauHinh: () => true, moCa: () => undefined } as never;
    const cms = { daCauHinh: () => false } as never;
    const s = new ThamDinhThayThuocService(cms, llm, null as never);
    expect((await s.lapThuoc()).phienBan).toBeNull();
  });
});
```

- [ ] **Step 2: Chạy test cho chắc là nó hỏng**

Run: `npm test --prefix backend -- tham-dinh-thay-thuoc`
Expected: FAIL — không tìm thấy module.

- [ ] **Step 3: Viết bản cài đặt (phần lập thước)**

Tạo `backend/src/controllers/tham-dinh-thay-thuoc.controller.ts`:

```typescript
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
```

- [ ] **Step 4: Thêm `maTuSlug` vào ThamDinhCmsService**

Mục mẫu khai bằng `slug` cho người đọc, nhưng khoá của `td_ho_so` và `ec_*` là `id`. Thêm vào
`backend/src/controllers/tham-dinh-cms.service.ts`:

```typescript
  /** Đổi slug sang id. Mục mẫu khai bằng slug vì slug là thứ người đọc nhận ra. */
  async maTuSlug(bo: string, slug: string): Promise<string | null> {
    const r = await this.phaiCo().query<{ id: string }>(
      `SELECT r.id FROM ${JSON.stringify('ec_' + bo)} r WHERE r.slug = $1 LIMIT 1`,
      [slug],
    );
    return r.rows.length ? String(r.rows[0].id) : null;
  }
```

- [ ] **Step 5: Chạy test cho tới khi xanh**

Run: `npm test --prefix backend -- tham-dinh-thay-thuoc`
Expected: PASS, 7 ca.

- [ ] **Step 6: Kiểm kiểu rồi commit**

```bash
cd backend && npm run type-check && cd ..
git add backend/src/controllers/tham-dinh-thay-thuoc.controller.ts \
        backend/src/controllers/tham-dinh-thay-thuoc.controller.spec.ts \
        backend/src/controllers/tham-dinh-cms.service.ts
git commit -m "feat(tham-dinh): Bước 0 — lập thước văn phong từ mười mục viết đạt"
```

---

### Task 7: Ca soi lớp 2

**Files:**
- Modify: `backend/src/controllers/tham-dinh-thay-thuoc.controller.ts`
- Modify: `backend/src/controllers/tham-dinh-thay-thuoc.controller.spec.ts`
- Modify: `backend/src/models/tham-dinh.dto.ts`

**Interfaces:**
- Consumes: `xepHangDoi` (Task 3), `locLoiPhe` + `bocJson` (Task 2), `apDungCho` (Task 1), các phép đọc/ghi (Task 4)
- Produces:
  - `loiNhacSoi(luat: BoLuatVanPhong): string`
  - `dungNoiDungSoi(m, than, chum): string`
  - `chayCaThayThuoc(gioiHan?: number): Promise<LuocKeCaThayThuoc>`

- [ ] **Step 1: Viết test thất bại**

Thêm vào cuối `backend/src/controllers/tham-dinh-thay-thuoc.controller.spec.ts`:

```typescript
import type { BoLuatVanPhong } from '../utils/tham-dinh-luat.util';

const LUAT: BoLuatVanPhong = {
  phienBan: 3, boApDung: ['huyet_vi'], daDuyet: true,
  dieu: [
    { ma: 'BC1', truc: 'bo_cuc', noiDung: 'Mở đầu bằng câu định vị.', viDu: 'Ở chỗ lõm…' },
    { ma: 'PV1', truc: 'pham_vi_hanh_nghe', noiDung: 'Không dùng chữ hàm ý khám chữa bệnh.', viDu: '' },
  ],
};

describe('ThamDinhThayThuocService.loiNhacSoi', () => {
  const s = new ThamDinhThayThuocService(null as never, null as never, null as never);

  it('nhúng đủ các điều luật kèm mã để lời phê quy chiếu được', () => {
    const l = s.loiNhacSoi(LUAT);
    expect(l).toContain('BC1');
    expect(l).toContain('PV1');
    expect(l).toContain('Mở đầu bằng câu định vị.');
  });

  it('đòi trichDan là NGUYÊN VĂN và nói rõ sẽ bị loại nếu không khớp', () => {
    const l = s.loiNhacSoi(LUAT);
    expect(l).toMatch(/nguyên văn/i);
    expect(l).toMatch(/loại|bỏ/i);
  });

  it('cấm bậc 2 một cách tường minh', () => {
    expect(s.loiNhacSoi(LUAT)).toMatch(/bậc 2|trí nhớ/i);
  });

  it('cho phép nói "cần người bổ sung" khi không đủ căn cứ — bậc 4', () => {
    expect(s.loiNhacSoi(LUAT)).toMatch(/cần người bổ sung/i);
  });
});

describe('ThamDinhThayThuocService.dungNoiDungSoi', () => {
  const s = new ThamDinhThayThuocService(null as never, null as never, null as never);

  it('gói thân bài theo từng trường, có nhãn trường', () => {
    const r = s.dungNoiDungSoi(
      { bo: 'huyet_vi', tieuDe: 'Thái Khê' },
      { vi_tri: 'Ở chỗ lõm', chu_tri: 'Đau lưng' },
      [],
    );
    expect(r).toContain('vi_tri');
    expect(r).toContain('Ở chỗ lõm');
  });

  it('bỏ trường rỗng — đừng tốn token cho ô trống', () => {
    const r = s.dungNoiDungSoi({ bo: 'huyet_vi', tieuDe: 'T' }, { vi_tri: 'A', ghi_chu: '' }, []);
    expect(r).not.toContain('ghi_chu');
  });

  it('kèm chùm liên quan và nói rõ đó là NỀN, không phải bài đang soi', () => {
    const r = s.dungNoiDungSoi(
      { bo: 'huyet_vi', tieuDe: 'T' }, { vi_tri: 'A' },
      [{ bo: 'kinh_mach', tieuDe: 'Kinh Can', tomTat: 'Kinh Can chạy từ…' }],
    );
    expect(r).toContain('Kinh Can');
    expect(r).toMatch(/nền|tham khảo|không phải bài đang soi/i);
  });
});

describe('ThamDinhThayThuocService.chayCaThayThuoc — rào chắn vào ca', () => {
  function svc(over: Record<string, unknown> = {}) {
    const cms = {
      daCauHinh: () => true, moKetNoi: () => Promise.resolve(), dongKetNoi: () => Promise.resolve(),
      dungBang: () => Promise.resolve(), docBoLuat: () => Promise.resolve(null),
      ...over,
    } as never;
    const llm = { daCauHinh: () => true, moCa: () => undefined, soLuotDaGoi: () => 0 } as never;
    return new ThamDinhThayThuocService(cms, llm, { get: () => undefined } as never);
  }

  /**
   * Phép nghiệm thu số 2 của spec: bộ luật phải được người dùng duyệt TRƯỚC khi lớp 2
   * chạy lần đầu. Chạy bằng thước chưa ai duyệt thì lời phê không có thẩm quyền nào.
   */
  it('chưa có bộ luật ĐÃ DUYỆT thì không soi mục nào', async () => {
    const lk = await svc().chayCaThayThuoc();
    expect(lk.soMucSoi).toBe(0);
    expect(lk.loi[0]).toMatch(/bộ luật/i);
  });

  it('thiếu khoá mô hình thì nằm im', async () => {
    const cms = { daCauHinh: () => true } as never;
    const llm = { daCauHinh: () => false, moCa: () => undefined } as never;
    const s = new ThamDinhThayThuocService(cms, llm, { get: () => undefined } as never);
    const lk = await s.chayCaThayThuoc();
    expect(lk.soMucSoi).toBe(0);
    expect(lk.loi[0]).toMatch(/chưa cấu hình/i);
  });
});
```

- [ ] **Step 2: Chạy test cho chắc là nó hỏng**

Run: `npm test --prefix backend -- tham-dinh-thay-thuoc`
Expected: FAIL — `loiNhacSoi is not a function`

- [ ] **Step 3: Thêm kiểu lược kê vào DTO**

Thêm vào `backend/src/models/tham-dinh.dto.ts`:

```typescript
/** Kết quả một ca soi lớp thầy thuốc. */
export interface LuocKeCaThayThuoc {
  batDau: string;
  ketThuc: string;
  /** Số mục thật sự gửi cho mô hình. */
  soMucSoi: number;
  /** Số mục đứng trong hàng đợi nhưng không tới lượt (hết trần hoặc hết hạn mức). */
  soMucConLai: number;
  soLoiPheNhan: number;
  soLoiPheLoai: number;
  soLuotGoiModel: number;
  chamTran: boolean;
  /** Ba lý do loại nhiều nhất — số liệu để chỉnh lời nhắc, không phải để vứt. */
  lyDoLoai: Array<{ lyDo: string; soLan: number }>;
  loi: string[];
}
```

- [ ] **Step 4: Viết bản cài đặt**

Thêm vào `backend/src/controllers/tham-dinh-thay-thuoc.controller.ts` (giữ nguyên phần Task 6):

```typescript
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
```

Thêm các import còn thiếu ở đầu file:

```typescript
import { Cron } from '@nestjs/schedule';
import { locLoiPhe } from '../utils/tham-dinh-loi-phe.util';
import { xepHangDoi } from '../utils/tham-dinh-hang-doi.util';
import { apDungCho, type BoLuatVanPhong } from '../utils/tham-dinh-luat.util';
import type { LuocKeCaThayThuoc } from '../models/tham-dinh.dto';
```

- [ ] **Step 5: Chạy test cho tới khi xanh**

Run: `npm test --prefix backend -- tham-dinh-thay-thuoc`
Expected: PASS, 16 ca.

- [ ] **Step 6: Kiểm kiểu, chạy toàn bộ test, commit**

```bash
cd backend && npm run type-check && npm test -- tham-dinh && cd ..
git add backend/src/controllers/tham-dinh-thay-thuoc.controller.ts \
        backend/src/controllers/tham-dinh-thay-thuoc.controller.spec.ts \
        backend/src/models/tham-dinh.dto.ts
git commit -m "feat(tham-dinh): ca soi lớp thầy thuốc — hàng đợi, đọc chùm, lọc rào chắn"
```

---

### Task 8: Kết tinh lời phê lớp 2 thành cụm việc

**Files:**
- Modify: `backend/src/controllers/tham-dinh-thay-thuoc.controller.ts`
- Modify: `backend/src/controllers/tham-dinh-thay-thuoc.controller.spec.ts`
- Modify: `backend/src/controllers/tham-dinh-cms.service.ts`

**Vì sao task này bắt buộc, không phải tô điểm:** không có nó thì 100 lời phê mỗi đêm nằm
im trong `td_nhan_xet` và **không ai thấy** cho tới khi màn duyệt xong ở kế hoạch 3. Spec
chốt rõ: *"Bệnh án ghi lẻ, tab nhận gom."* Lớp 1 đã nộp cụm từ kế hoạch trước; lớp 2 phải
đi cùng một cửa, nếu không thì tab Góp Ý & Lỗi kể một nửa câu chuyện.

**Interfaces:**
- Consumes: `gomCum` + `NhanXetCoMuc` (kế hoạch 1, `tham-dinh-cum.util.ts`), `ThamDinhService.nopCum` (kế hoạch 1)
- Produces trên `ThamDinhCmsService`: `docNhanXetThayThuoc(): Promise<NhanXetCoMuc[]>`

- [ ] **Step 1: Viết test thất bại**

Thêm vào cuối `backend/src/controllers/tham-dinh-thay-thuoc.controller.spec.ts`:

```typescript
describe('ThamDinhThayThuocService — kết tinh cụm', () => {
  /**
   * Cụm của lớp 2 phải gom y như lớp 1: theo BỘ + KIỂU, route là đường của bộ. Nộp kèm
   * slug thì 100 lời phê thành 100 cụm và tab thành bãi rác trong một đêm — đúng thứ cơ
   * chế vân tay dựng ra để chặn.
   */
  it('gom lời phê cùng kiểu trên nhiều mục thành MỘT cụm', async () => {
    const nhanXet = Array.from({ length: 40 }, (_, i) => ({
      kieu: 'cau_cut', truong: 'vi_tri', trichDan: 'x', nhanXet: 'y', nang: false,
      bo: 'huyet_vi', slug: `h-${i}`, tieuDe: `H${i}`,
    }));
    const cms = {
      daCauHinh: () => true, moKetNoi: () => Promise.resolve(), dongKetNoi: () => Promise.resolve(),
      dungBang: () => Promise.resolve(),
      docNhanXetThayThuoc: () => Promise.resolve(nhanXet),
      docCauHinhBo: () => Promise.resolve([{ bo: 'huyet_vi', duongDan: '/huyet/', than: [] }]),
    } as never;
    let nopCho: unknown[] = [];
    const lop1 = { nopCum: (c: unknown[]) => { nopCho = c; return Promise.resolve(c.length); } } as never;
    const s = new ThamDinhThayThuocService(cms, null as never, null as never, lop1);

    expect(await s.ketTinhCum()).toBe(1);
    expect((nopCho[0] as { route: string }).route).toBe('/huyet/');
    expect((nopCho[0] as { soMuc: number }).soMuc).toBe(40);
  });

  it('không có lời phê nào thì không nộp gì', async () => {
    const cms = {
      daCauHinh: () => true, moKetNoi: () => Promise.resolve(), dongKetNoi: () => Promise.resolve(),
      dungBang: () => Promise.resolve(),
      docNhanXetThayThuoc: () => Promise.resolve([]),
      docCauHinhBo: () => Promise.resolve([]),
    } as never;
    let goi = 0;
    const lop1 = { nopCum: () => { goi++; return Promise.resolve(0); } } as never;
    const s = new ThamDinhThayThuocService(cms, null as never, null as never, lop1);
    expect(await s.ketTinhCum()).toBe(0);
    expect(goi).toBe(0);
  });
});
```

- [ ] **Step 2: Chạy test cho chắc là nó hỏng**

Run: `npm test --prefix backend -- tham-dinh-thay-thuoc`
Expected: FAIL — `ketTinhCum is not a function`

- [ ] **Step 3: Thêm phép đọc vào ThamDinhCmsService**

```typescript
  /** Mọi lời phê lớp thầy thuốc còn ở trạng thái `moi`, kèm khoá mục để gom cụm. */
  async docNhanXetThayThuoc(): Promise<NhanXetCoMuc[]> {
    const r = await this.phaiCo().query<{
      bo: string; slug: string; tieu_de: string;
      kieu: string; truong: string | null; trich_dan: string; nhan_xet: string;
    }>(
      `SELECT h.bo, h.slug, h.tieu_de, n.kieu, n.truong, n.trich_dan, n.nhan_xet
       FROM td_nhan_xet n JOIN td_ho_so h ON h.id = n.ho_so_id
       WHERE n.lop = 'thay_thuoc' AND n.trang_thai = 'moi'`,
    );
    return r.rows.map((x) => ({
      bo: x.bo, slug: x.slug, tieuDe: x.tieu_de,
      kieu: x.kieu, truong: x.truong, trichDan: x.trich_dan, nhanXet: x.nhan_xet,
      nang: false,
    }));
  }
```

Thêm import: `import type { NhanXetCoMuc } from '../utils/tham-dinh-cum.util';` (nếu file chưa
có — kế hoạch 1 đã import kiểu này rồi, kiểm trước khi thêm trùng).

- [ ] **Step 4: Thêm ketTinhCum vào ThamDinhThayThuocService**

Sửa constructor để nhận thêm service của lớp 1 (nó giữ `nopCum`, đã chia lô 50 sẵn):

```typescript
  constructor(
    private readonly cms: ThamDinhCmsService,
    private readonly llm: ThamDinhLlmService,
    private readonly config: ConfigService,
    private readonly lop1: ThamDinhService,
  ) {}
```

Thêm phương thức:

```typescript
  /**
   * Gom lời phê lớp thầy thuốc thành cụm việc rồi nộp vào tab Góp Ý & Lỗi.
   *
   * Dùng lại `gomCum` và `nopCum` của lớp 1 — cùng một cửa, cùng một luật gom cụm, cùng
   * cách chia lô 50. Viết đường nộp thứ hai là cách chắc chắn nhất để hai đường lệch nhau
   * sau vài tháng.
   */
  async ketTinhCum(): Promise<number> {
    await this.cms.moKetNoi();
    try {
      await this.cms.dungBang();
      const nhanXet = await this.cms.docNhanXetThayThuoc();
      if (!nhanXet.length) return 0;

      const duongDanBo: Record<string, string> = {};
      for (const b of await this.cms.docCauHinhBo()) duongDanBo[b.bo] = b.duongDan;

      const cum = gomCum(nhanXet, duongDanBo);
      await this.lop1.nopCum(cum);
      this.logger.log(`kết tinh lớp 2: ${nhanXet.length} lời phê → ${cum.length} cụm`);
      return cum.length;
    } finally {
      await this.cms.dongKetNoi();
    }
  }
```

Và gọi nó ở cuối `chayCaThayThuoc`, ngay trước dòng `lk.soLuotGoiModel = ...`:

```typescript
    if (lk.soLoiPheNhan > 0) {
      try {
        await this.ketTinhCum();
      } catch (e) {
        lk.loi.push(`Kết tinh cụm hỏng: ${(e as Error).message}`);
      }
    }
```

⚠️ `ketTinhCum` tự mở và đóng kết nối, mà `chayCaThayThuoc` gọi nó trong khối `finally` đã
đóng kết nối rồi — nên đặt lời gọi **sau** `finally`, không phải trong `try`. `moKetNoi()` là
idempotent (thấy client đã có thì thôi), nhưng `dongKetNoi()` của nó sẽ đóng kết nối mà vòng
lặp soi còn đang dùng nếu đặt sai chỗ.

Thêm import:

```typescript
import { ThamDinhService } from './tham-dinh.controller';
import { gomCum } from '../utils/tham-dinh-cum.util';
```

- [ ] **Step 5: Sửa các test cũ cho khớp constructor mới**

Mọi chỗ `new ThamDinhThayThuocService(a, b, c)` trong spec phải thêm tham số thứ tư
`null as never`. Chạy test và sửa cho tới khi hết lỗi tham số.

- [ ] **Step 6: Chạy test cho tới khi xanh**

Run: `npm test --prefix backend -- tham-dinh-thay-thuoc`
Expected: PASS, 18 ca.

- [ ] **Step 7: Kiểm kiểu rồi commit**

```bash
cd backend && npm run type-check && npm test -- tham-dinh && cd ..
git add backend/src/controllers/tham-dinh-thay-thuoc.controller.ts \
        backend/src/controllers/tham-dinh-thay-thuoc.controller.spec.ts \
        backend/src/controllers/tham-dinh-cms.service.ts
git commit -m "feat(tham-dinh): kết tinh lời phê lớp 2 thành cụm việc, nộp cùng cửa lớp 1"
```

---

### Task 9: API và đăng ký vào module

**Files:**
- Modify: `backend/src/routers/tham-dinh.router.ts`
- Modify: `backend/src/app.module.ts`
- Modify: `backend/.env`

**Interfaces:**
- Consumes: `ThamDinhThayThuocService` (Task 6, 7), `ThamDinhCmsService` (Task 4)
- Produces: bốn endpoint mới dưới `/tham-dinh`

- [ ] **Step 1: Thêm endpoint vào router**

Trong `backend/src/routers/tham-dinh.router.ts`, thêm vào lớp `ThamDinhRouter` (giữ nguyên ba
endpoint đã có):

```typescript
  /** Bước 0 — đọc mười mục viết đạt, rút bộ luật văn phong, lưu bản CHỜ DUYỆT. */
  @Post('lap-thuoc')
  lapThuoc(): Promise<{ phienBan: number | null; soDieu: number; loi: string[] }> {
    return this.thayThuoc.lapThuoc();
  }

  /** Bộ luật mới nhất. `daDuyet=1` để lấy bản đang có hiệu lực. */
  @Get('bo-luat')
  async boLuat(@Query('daDuyet') daDuyet?: string): Promise<BoLuatVanPhong | null> {
    await this.cms.moKetNoi();
    try {
      await this.cms.dungBang();
      return await this.cms.docBoLuat(daDuyet === '1');
    } finally {
      await this.cms.dongKetNoi();
    }
  }

  /**
   * Duyệt một bản bộ luật. Đây là nút mà phép nghiệm thu số 2 của spec nói tới: lớp 2
   * không chạy được cho tới khi có người bấm.
   */
  @Post('bo-luat/:phienBan/duyet')
  async duyetBoLuat(
    @Param('phienBan', ParseIntPipe) phienBan: number,
  ): Promise<{ ok: true }> {
    await this.cms.moKetNoi();
    try {
      await this.cms.dungBang();
      await this.cms.duyetBoLuat(phienBan);
      return { ok: true };
    } finally {
      await this.cms.dongKetNoi();
    }
  }

  /** Chạy tay một ca lớp 2. `gioiHan` để thử vài mục trước khi thả cả hàng đợi. */
  @Post('soi-ky')
  soiKy(@Query('gioiHan') gioiHan?: string): Promise<LuocKeCaThayThuoc> {
    const n = Number(gioiHan);
    return this.thayThuoc.chayCaThayThuoc(Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);
  }
```

Sửa constructor và import của router:

```typescript
import { Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';

import { ThamDinhService } from '../controllers/tham-dinh.controller';
import { ThamDinhThayThuocService } from '../controllers/tham-dinh-thay-thuoc.controller';
import { ThamDinhCmsService } from '../controllers/tham-dinh-cms.service';
import { QuanTriGuard } from '../middlewares/auth/quan-tri.guard';
import type { LuocKeCa, LuocKeCaThayThuoc } from '../models/tham-dinh.dto';
import type { BoLuatVanPhong } from '../utils/tham-dinh-luat.util';

@Controller('tham-dinh')
@UseGuards(QuanTriGuard)
export class ThamDinhRouter {
  constructor(
    private readonly thamDinh: ThamDinhService,
    private readonly thayThuoc: ThamDinhThayThuocService,
    private readonly cms: ThamDinhCmsService,
  ) {}
```

- [ ] **Step 2: Đăng ký vào app.module.ts**

Thêm hai import và hai provider (router đã đăng ký từ kế hoạch 1, không thêm lại):

```typescript
// đầu file, cạnh các import ThamDinh* đã có
import { ThamDinhThayThuocService } from './controllers/tham-dinh-thay-thuoc.controller';
import { ThamDinhLlmService } from './controllers/tham-dinh-llm.service';

// trong providers: [...], cạnh ThamDinhCmsService
ThamDinhThayThuocService,
ThamDinhLlmService,
```

- [ ] **Step 3: Khai cấu hình vào backend/.env**

⚠️ `backend/.env` có `CA_CERTIFICATE` là PEM nhiều dòng trong nháy kép — **đừng `source` cả
file trong shell**. Nối thêm vào cuối:

```bash
cat >> backend/.env <<'ENVEOF'

# ── Bot thẩm định lớp 2 ──
THAM_DINH_MODEL_KY=claude-sonnet-5
THAM_DINH_MOI_CA=100
THAM_DINH_SO_MUC_KY=50
THAM_DINH_TRAN_TIEN=300
ENVEOF
```

- [ ] **Step 4: Kiểm kiểu và khởi động thử**

```bash
cd backend && npm run type-check
```
Expected: không lỗi.

```bash
cd backend && npm run start:dev
```
Expected: thấy bốn dòng ánh xạ route `/tham-dinh/lap-thuoc`, `/tham-dinh/bo-luat`,
`/tham-dinh/bo-luat/:phienBan/duyet`, `/tham-dinh/soi-ky`. Ctrl-C sau khi thấy.
Ghi chú: macOS không có lệnh `timeout`. Cổng 3001 bận thì tắt tiến trình cũ trước —
`pkill -f "nest start --watch"`.

- [ ] **Step 5: Commit**

```bash
git add backend/src/routers/tham-dinh.router.ts backend/src/app.module.ts
git commit -m "feat(tham-dinh): API lập thước, duyệt bộ luật, chạy ca lớp 2"
```

---

### Task 10: Nghiệm thu trên kho thật

**Files:**
- Create: `backend/tmp/nghiem-thu-lop-2.mjs`

**Interfaces:**
- Consumes: bảng `td_luat_van_phong`, `td_nhan_xet` (lớp `thay_thuoc`)

- [ ] **Step 1: Lập thước và ĐỌC bộ luật**

```bash
TOKEN=$(curl -s -X POST localhost:3001/auth/admin/login -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["access_token"])')
curl -s -X POST localhost:3001/tham-dinh/lap-thuoc -H "Authorization: Bearer $TOKEN"
curl -s localhost:3001/tham-dinh/bo-luat -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

Expected: `soDieu` trong khoảng 8–16, `loi: []`, và bộ luật có điều `PV1`.

**DỪNG LẠI Ở ĐÂY.** Đọc từng điều luật cho người dùng duyệt. Điều nào họ bác thì sửa
`MUC_MAU` hoặc `loiNhacLapThuoc()` rồi lập lại, **không** sửa tay bộ luật trong database —
thước phải rút được lại từ mẫu, nếu không thì lần sau chạy lại là mất.

- [ ] **Step 2: Duyệt bộ luật**

```bash
curl -s -X POST localhost:3001/tham-dinh/bo-luat/1/duyet -H "Authorization: Bearer $TOKEN"
```

- [ ] **Step 3: Soi thử 5 mục**

```bash
curl -s -X POST "localhost:3001/tham-dinh/soi-ky?gioiHan=5" -H "Authorization: Bearer $TOKEN" \
  | python3 -m json.tool
```

Expected: `soMucSoi: 5`, `soLoiPheNhan` > 0, `loi: []`.

⚠️ Nhìn kỹ `lyDoLoai`. Tỉ lệ loại cao vì "trích dẫn không khớp nguyên văn" là tín hiệu
lời nhắc chưa đủ rõ, **không phải** lý do để nới rào chắn. Nới rào là mở cửa cho bịa.

- [ ] **Step 4: Viết script nghiệm thu**

Tạo `backend/tmp/nghiem-thu-lop-2.mjs`:

```javascript
// Nghiệm thu lớp 2 trên kho thật. CHỈ ĐỌC.
// Chạy: node backend/tmp/nghiem-thu-lop-2.mjs
import { readFileSync } from "node:fs";
import pg from "pg";

// Parser hiểu giá trị NHIỀU DÒNG: backend/.env cất CA_CERTIFICATE là PEM 26 dòng.
function docEnv(duong) {
	const txt = readFileSync(duong, "utf8");
	const ra = {};
	const re = /^([A-Za-z_][A-Za-z0-9_]*)=(?:"([\s\S]*?)"|'([\s\S]*?)'|(.*))$/gm;
	let m;
	while ((m = re.exec(txt))) ra[m[1]] = m[2] ?? m[3] ?? m[4] ?? "";
	return ra;
}

const env = docEnv(new URL("../.env", import.meta.url));
const ca = (env.DB_CA_CERT || env.CA_CERTIFICATE || "").trim();
const c = new pg.Client({
	host: env.CMS_DB_HOST, port: +env.CMS_DB_PORT, user: env.CMS_DB_USER,
	password: env.CMS_DB_PASSWORD, database: env.CMS_DB_NAME,
	ssl: ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: false },
});
await c.connect();

// 1. Bộ luật đã duyệt chưa
const a = await c.query(`SELECT phien_ban, da_duyet, jsonb_array_length(dieu)::int so_dieu
  FROM td_luat_van_phong ORDER BY phien_ban DESC LIMIT 3`);
console.table(a.rows);

// 2. MỌI nhận xét lớp thầy thuốc phải có trích dẫn — rào chắn số một
const b = await c.query(`SELECT count(*)::int n FROM td_nhan_xet
  WHERE lop='thay_thuoc' AND trim(trich_dan) = ''`);
console.log("① Nhận xét thầy thuốc thiếu trích dẫn:", b.rows[0].n, b.rows[0].n === 0 ? "✓" : "✗ PHẢI BẰNG 0");

// 3. Bậc căn cứ 2 bị CẤM — không dòng nào được mang bậc 2
const d = await c.query(`SELECT count(*)::int n FROM td_nhan_xet
  WHERE lop='thay_thuoc' AND bac_can_cu = 2`);
console.log("② Nhận xét mang bậc căn cứ 2:", d.rows[0].n, d.rows[0].n === 0 ? "✓" : "✗ PHẢI BẰNG 0");

// 4. Trích dẫn phải NẰM TRONG bài. Kiểm lại ở tầng database, độc lập với mã lọc —
//    mã lọc có thể sai, và đây là chỗ duy nhất bắt được nếu nó sai.
const e2 = await c.query(`
  SELECT count(*)::int n FROM td_nhan_xet n
  JOIN td_ho_so h ON h.id = n.ho_so_id
  JOIN td_muc m ON m.bo = h.bo AND m.ma = h.ma
  WHERE n.lop='thay_thuoc'
    AND position(regexp_replace(left(n.trich_dan, 60), '\\s+', ' ', 'g')
                 in regexp_replace(m.tom_tat, '\\s+', ' ', 'g')) = 0
    AND length(m.tom_tat) >= 380`);
console.log("③ Trích dẫn không thấy trong 400 ký tự đầu bài:", e2.rows[0].n,
  "(chỉ là dấu hiệu — tóm tắt chỉ giữ 400 ký tự đầu nên số này KHÔNG phải bằng 0)");

// 5. Van vân tay có đóng không: mục đã soi kỹ phải có van_tay_thay_thuoc
const f = await c.query(`SELECT
  count(*) FILTER (WHERE soi_thay_thuoc_luc IS NOT NULL)::int da_soi,
  count(*) FILTER (WHERE soi_thay_thuoc_luc IS NOT NULL AND van_tay_thay_thuoc IS NULL)::int hong
  FROM td_ho_so`);
console.log("④ Đã soi kỹ:", f.rows[0].da_soi, "· thiếu vân tay:", f.rows[0].hong,
  f.rows[0].hong === 0 ? "✓" : "✗ van không đóng, đêm mai sẽ đọc lại và tốn tiền lần nữa");

// 6. Kiểu lời phê nhiều nhất — danh sách việc của lớp 2
console.table((await c.query(`SELECT kieu, count(*)::int so_muc FROM td_nhan_xet
  WHERE lop='thay_thuoc' GROUP BY 1 ORDER BY 2 DESC LIMIT 10`)).rows);

// 7. Bao nhiêu lời phê có bản sửa soạn sẵn
const g = await c.query(`SELECT count(*)::int tong,
  count(*) FILTER (WHERE de_xuat IS NOT NULL AND trim(de_xuat) <> '')::int co_ban_sua
  FROM td_nhan_xet WHERE lop='thay_thuoc'`);
console.log("⑤ Lời phê:", g.rows[0].tong, "· có bản sửa soạn sẵn:", g.rows[0].co_ban_sua);

await c.end();
```

- [ ] **Step 5: Chạy nghiệm thu**

```bash
node backend/tmp/nghiem-thu-lop-2.mjs
```

Expected: ① và ② bằng 0; ④ `hong` bằng 0.

- [ ] **Step 6: Người dùng đọc và chấm tỉ lệ phê đúng**

Phép nghiệm thu số 3 của spec: *"Lớp 2 chạy trên 50 mục huyệt đầu hàng đợi: mỗi nhận xét đều
trích được câu trong bài; người dùng đọc và xác nhận tỉ lệ phê đúng chấp nhận được."*

In hai mươi lời phê đầu kèm trích dẫn và bản sửa cho người dùng chấm. Đây là cổng chặn của
con người — **không có phép kiểm tự động nào thay được**, vì câu hỏi là "lời phê này có đúng
về y lý không", và chỉ thầy thuốc trả lời được.

```bash
node -e "
const {readFileSync}=require('fs');const pg=require('./backend/node_modules/pg');
const t=readFileSync('backend/.env','utf8');const e={};
const re=/^([A-Za-z_][A-Za-z0-9_]*)=(?:\"([\s\S]*?)\"|'([\s\S]*?)'|(.*))\$/gm;let m;
while((m=re.exec(t)))e[m[1]]=m[2]??m[3]??m[4]??'';
const c=new pg.Client({host:e.CMS_DB_HOST,port:+e.CMS_DB_PORT,user:e.CMS_DB_USER,
  password:e.CMS_DB_PASSWORD,database:e.CMS_DB_NAME,ssl:{ca:e.CA_CERTIFICATE,rejectUnauthorized:true}});
c.connect().then(()=>c.query(\`SELECT h.bo,h.tieu_de,n.kieu,n.truong,n.trich_dan,n.nhan_xet,n.de_xuat
  FROM td_nhan_xet n JOIN td_ho_so h ON h.id=n.ho_so_id WHERE n.lop='thay_thuoc' LIMIT 20\`))
 .then(r=>{for(const x of r.rows){
   console.log('\n▸ ['+x.bo+'] '+x.tieu_de+' · '+x.kieu+' · '+x.truong);
   console.log('  trích: '+JSON.stringify(x.trich_dan.slice(0,160)));
   console.log('  phê  : '+x.nhan_xet);
   if(x.de_xuat) console.log('  sửa  : '+x.de_xuat.slice(0,240));
 }return c.end()});
"
```

- [ ] **Step 7: Commit**

```bash
git add -f backend/tmp/nghiem-thu-lop-2.mjs
git commit -m "test(tham-dinh): script nghiệm thu lớp 2 trên kho thật"
```

Ghi chú: `.gitignore` loại cả `backend/tmp/*`, nên phải `-f` — cùng lối đã làm với
`nghiem-thu-tham-dinh.mjs` của kế hoạch 1.

---

## Ngoài phạm vi kế hoạch này

- **Màn duyệt bản sửa** (`meta.page: 'tham-dinh'`, bản gốc và bản sửa cạnh nhau, tô trích dẫn,
  nút duyệt từng nhận xét) → kế hoạch 3
- **Áp bản sửa vào `ec_*`** — ghi `revisions`, tăng `version`, để trigger `td_tr` chạy, rồi
  kiểm lại bằng ô tìm kiếm → kế hoạch 3
- **Lớp 3 (đối sánh GSC + trang đối thủ)** và **phép dò trang render** → kế hoạch 4.
  Chỗ cắm đã chừa sẵn: `UngVienSoi.diemCoHoiSeo` hiện luôn là 0, công thức `diemUuTien`
  không phải đổi khi nối Search Console vào.
- Bot **vẫn không ghi** vào bảng `ec_*` ở kế hoạch này.
