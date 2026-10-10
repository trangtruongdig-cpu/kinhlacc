# Đặt lịch chịu được mạng chập — Kế hoạch thực thi

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Làm cho thao tác đặt / chuyển / huỷ vé **lặp lại được vô hại** khi mạng chập, và cắt phần byte thừa duy nhất còn lại.

**Architecture:** Máy khách sinh `Idempotency-Key` một lần cho mỗi *ý định*; backend `INSERT` khoá đó vào bảng `thao_tac_ghi` **trong chính transaction đã có**, trúng `23505` thì rollback và trả lại kết quả cũ (không phát SSE lần hai). `api.ts` thêm hạn giờ và tự thử lại, với phần quyết định tách ra thành module thuần kiểm được bằng `node --test`.

**Tech Stack:** NestJS 11 + TypeORM + PostgreSQL (Aiven) · Vue 3 + Vite · jest (backend) · `node --test` (frontend, chạy thẳng `.ts` nhờ Node 26 type-stripping — đã kiểm chứng trên `cms/src/lib/loi-tieng-viet.test.ts`)

**Đặc tả:** `docs/superpowers/specs/2026-10-10-dat-lich-chiu-mang-chap-design.md` (`6221ae3`)

## Global Constraints

- Quy ước đặt tên **đảo ngược** của repo: `src/routers/*.router.ts` là `@Controller`, `src/controllers/*.controller.ts` là `@Injectable` service, `src/models/*.model.ts` là `@Entity`.
- Entity mới **phải** đăng ký trong `src/app.module.ts` ở `TypeOrmModule.forFeature([...])`.
- `DB_SYNCHRONIZE` **tắt**. Mọi thay đổi lược đồ đi qua `SchemaBootstrapService.STATEMENTS` (DDL idempotent, chạy mỗi lần khởi động) — **không** `psql` tay.
- Mọi route GHI phải giữ nguyên `@UseGuards(NhanVienGuard)` hoặc kiểm chủ sở hữu đang có. **Không** đổi phân quyền trong kế hoạch này.
- Backend build bằng SWC **không kiểm kiểu** → sau mỗi task phải chạy `npm run type-check`.
- `npm run lint` **GHI vào tệp** (`--fix`). Muốn kiểm mà không ghi thì `npx eslint .`.
- Câu chữ ra màn hình dùng **tiếng Việt**, theo phạm vi hành nghề Y sỹ (không "khám/chữa bệnh"; dùng "đo", "phòng chẩn trị", "thầy thuốc").
- Nghiệm thu số byte **luôn dùng `curl --compressed`** — gzip đã bật, đo byte thô là tự lừa mình.
- Không thêm dependency mới ở cả hai package.

---

## Giai đoạn 0 — Chốt lại sự thật

### Task 1: Sửa câu "42 phút" đang dạy sai trong comment

**Files:**
- Modify: `frontend/src/views/AppointmentsView.vue` (khối comment của `laLoiMang`)

**Interfaces:**
- Consumes: không
- Produces: không (chỉ comment)

- [ ] **Step 1: Tìm đúng khối comment**

Run: `grep -n "42 phút" frontend/src/views/AppointmentsView.vue`
Expected: một dòng trong comment đầu hàm `laLoiMang`.

- [ ] **Step 2: Thay đoạn sai bằng đoạn đã kiểm chứng**

Thay câu *"vé chuyển THÀNH CÔNG trên máy chủ (b#84, 18:21:33) rồi kết nối chết 42 phút ngay sau đó — ba lời gọi kế tiếp 'Failed to fetch' trong 0,4 giây và mãi 19:03 mới báo về được."* bằng:

```
 * `fetch` ném TypeError("Failed to fetch") cho mọi kiểu đứt đường, và nó KHÔNG nói được máy chủ
 * đã nhận lệnh hay chưa. Đo thật 09/10/2026: vé chuyển THÀNH CÔNG (b#86, movedAt 18:21:33), rồi
 * ba lời gọi kế tiếp chết với msTroi = 387 ms. Trong hoàn cảnh ấy câu "Lỗi: Failed to fetch" đọc
 * ra thành "chuyển không được" và người dùng sẽ chuyển lại lần nữa — trong khi vé đã đi rồi.
 *
 * ⚠️ ĐỪNG suy khoảng mất kết nối bằng hiệu của hai mốc: `su_co.xay_ra_luc` là giờ MÁY CHỦ NHẬN
 * BÁO CÁO, không phải giờ lỗi xảy ra. Một phiên trước đã lấy hiệu đó ra và kết luận nhầm là
 * "mất kết nối 42 phút"; breadcrumbs cho thấy tab đó chỉ đơn giản không có hoạt động nào.
```

- [ ] **Step 3: Kiểm không làm hỏng cú pháp**

Run: `cd frontend && npm run type-check`
Expected: không lỗi mới.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/views/AppointmentsView.vue
git commit -m "docs(dat-lich): bỏ câu '42 phút mất kết nối' — hiệu hai mốc không cùng hệ quy chiếu"
```

---

### Task 2: Lưu mốc thời gian của MÁY KHÁCH

Hiện `BaoSuCoDto.xayRaLuc` được khai nhưng **không dùng ở đâu** — máy chủ luôn ghi giờ nó nhận được. Thêm cột riêng, **không** đổi nghĩa cột cũ (gom cụm và thống kê 24 giờ đang đọc `xay_ra_luc`).

**Files:**
- Create: `backend/src/utils/moc-khach.util.ts`
- Create: `backend/src/utils/moc-khach.spec.ts`
- Modify: `backend/src/models/su-co.model.ts`
- Modify: `backend/src/schema-bootstrap.service.ts` (thêm vào `STATEMENTS`)
- Modify: `backend/src/controllers/su-co.controller.ts:202` (khối `this.suCoRepo.create`)

**Interfaces:**
- Consumes: không
- Produces: `docMocKhach(iso: string | undefined, bayGio: Date): Date | null`

- [ ] **Step 1: Viết phép kiểm trước**

Tạo `backend/src/utils/moc-khach.spec.ts`:

```ts
import { docMocKhach } from './moc-khach.util';

describe('docMocKhach — mốc do MÁY KHÁCH khai, không tin tuyệt đối', () => {
  const bayGio = new Date('2026-10-09T12:03:35.000Z');

  it('nhận mốc ISO hợp lệ trong quá khứ gần', () => {
    expect(docMocKhach('2026-10-09T11:21:33.000Z', bayGio))
      .toEqual(new Date('2026-10-09T11:21:33.000Z'));
  });

  it('bỏ mốc quá XA trong quá khứ — đồng hồ máy khách sai thì thà không có', () => {
    expect(docMocKhach('2026-09-01T00:00:00.000Z', bayGio)).toBeNull();
  });

  it('bỏ mốc ở TƯƠNG LAI quá 5 phút', () => {
    expect(docMocKhach('2026-10-09T13:00:00.000Z', bayGio)).toBeNull();
  });

  it('chấp nhận lệch nhỏ về tương lai (đồng hồ máy khách nhanh vài giây)', () => {
    expect(docMocKhach('2026-10-09T12:04:00.000Z', bayGio))
      .toEqual(new Date('2026-10-09T12:04:00.000Z'));
  });

  it('bỏ chuỗi rác, chuỗi rỗng và undefined — không được ném lỗi', () => {
    expect(docMocKhach('hôm qua', bayGio)).toBeNull();
    expect(docMocKhach('', bayGio)).toBeNull();
    expect(docMocKhach(undefined, bayGio)).toBeNull();
  });
});
```

- [ ] **Step 2: Chạy để thấy nó ĐỎ**

Run: `cd backend && npm test -- moc-khach`
Expected: FAIL — `Cannot find module './moc-khach.util'`.

- [ ] **Step 3: Viết hàm**

Tạo `backend/src/utils/moc-khach.util.ts`:

```ts
/** Quá khứ xa hơn ngần này thì coi như đồng hồ máy khách sai, không nhận. */
const LUI_TOI_DA_MS = 24 * 60 * 60 * 1000;
/** Đồng hồ máy khách nhanh hơn ngần này thì cũng không nhận. */
const TOI_TOI_DA_MS = 5 * 60 * 1000;

/**
 * Mốc thời điểm lỗi do MÁY KHÁCH khai. Không tin tuyệt đối — chỉ nhận khi nằm trong một cửa sổ
 * hợp lý quanh giờ máy chủ.
 *
 * Vì sao cần: `baoSuCo.ts` gom tín hiệu vào hàng đợi, nên khi mất mạng thì mọi lỗi tới máy chủ
 * dồn về mốc HỒI MẠNG. Không có cột này thì không cách nào biết lỗi thật sự xảy ra lúc nào, và
 * một phiên đã vì thế kết luận nhầm là "mất kết nối 42 phút" (xem spec 10/10/2026).
 */
export function docMocKhach(iso: string | undefined, bayGio: Date): Date | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  const lech = bayGio.getTime() - t;
  if (lech > LUI_TOI_DA_MS) return null;
  if (lech < -TOI_TOI_DA_MS) return null;
  return new Date(t);
}
```

- [ ] **Step 4: Chạy lại cho XANH**

Run: `cd backend && npm test -- moc-khach`
Expected: PASS, 5 phép kiểm.

- [ ] **Step 5: Thêm cột vào entity**

Trong `backend/src/models/su-co.model.ts`, ngay sau khối `xayRaLuc`:

```ts
  /**
   * Mốc do MÁY KHÁCH khai (đã lọc qua `docMocKhach`). Null khi không có hoặc không đáng tin.
   * KHÁC `xayRaLuc` — cột kia là giờ máy chủ NHẬN ĐƯỢC báo cáo.
   */
  @Column({ name: 'xay_ra_luc_khach', type: 'timestamptz', nullable: true })
  xayRaLucKhach: Date | null;
```

- [ ] **Step 6: Thêm DDL idempotent**

Trong `backend/src/schema-bootstrap.service.ts`, thêm vào mảng `STATEMENTS`:

```ts
    `ALTER TABLE su_co ADD COLUMN IF NOT EXISTS xay_ra_luc_khach timestamptz`,
```

- [ ] **Step 7: Ghi giá trị khi nhận báo cáo**

Trong `backend/src/controllers/su-co.controller.ts`, thêm `import { docMocKhach } from '../utils/moc-khach.util';` ở đầu tệp, rồi trong khối `this.suCoRepo.create({ ... })` thêm ngay dưới dòng `xayRaLuc: bayGio,`:

```ts
          xayRaLucKhach: docMocKhach(item?.xayRaLuc, bayGio),
```

- [ ] **Step 8: Kiểm kiểu và chạy toàn bộ test**

Run: `cd backend && npm run type-check && npm test -- su-co`
Expected: type-check sạch; các test `su-co-van-tay` cũ vẫn PASS.

- [ ] **Step 9: Commit**

```bash
git add backend/src/utils/moc-khach.util.ts backend/src/utils/moc-khach.spec.ts \
        backend/src/models/su-co.model.ts backend/src/schema-bootstrap.service.ts \
        backend/src/controllers/su-co.controller.ts
git commit -m "feat(su-co): lưu mốc của máy khách — không có nó thì sự cố mạng mãi không có giờ thật"
```

---

## Giai đoạn 1 — Phần chịu lực (A + B)

### Task 3: Bảng `thao_tac_ghi` và lối phát lại

**Files:**
- Create: `backend/src/models/thao-tac-ghi.model.ts`
- Create: `backend/src/utils/thao-tac-ghi.util.ts`
- Modify: `backend/src/schema-bootstrap.service.ts`
- Modify: `backend/src/app.module.ts` (`TypeOrmModule.forFeature`)

**Interfaces:**
- Consumes: không
- Produces:
  - `class ThaoTacGhi { khoa: string; route: string; ketQua: unknown | null; taoLuc: Date }`
  - `class PhatLaiThaoTac extends Error { readonly khoa: string }`
  - `laTrungKhoa(e: unknown): boolean`

- [ ] **Step 1: Tạo entity**

`backend/src/models/thao-tac-ghi.model.ts`:

```ts
import { Entity, Column, PrimaryColumn, CreateDateColumn, Index } from 'typeorm';

/**
 * SỔ KHOÁ CHỐNG LẶP cho thao tác GHI.
 *
 * Vì sao cần: `fetch` ném "Failed to fetch" cho mọi kiểu đứt đường và KHÔNG nói được máy chủ đã
 * nhận lệnh hay chưa. Người dùng thấy báo lỗi thì bấm lại — mà lần đầu có thể đã thành công.
 * Trước đây chống bằng một `alert()` nhờ người dùng tự kỷ luật; nay chống bằng máy.
 *
 * Khoá do MÁY KHÁCH sinh, một lần cho mỗi Ý ĐỊNH (mở hộp thoại Chuyển vé → sinh khoá; mọi lần
 * thử lại dùng CÙNG khoá; đổi ca đích → khoá mới).
 */
@Entity('thao_tac_ghi')
@Index('idx_thao_tac_ghi_tao_luc', ['taoLuc'])
export class ThaoTacGhi {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  khoa: string;

  @Column({ type: 'varchar', length: 80 })
  route: string;

  /** Thân phản hồi của lần làm THẬT, để lần bấm lại nhận lại y hệt. */
  @Column({ name: 'ket_qua', type: 'jsonb', nullable: true })
  ketQua: unknown | null;

  @CreateDateColumn({ name: 'tao_luc', type: 'timestamptz' })
  taoLuc: Date;
}
```

- [ ] **Step 2: Tạo util**

`backend/src/utils/thao-tac-ghi.util.ts`:

```ts
/**
 * Ném ra khi khoá chống lặp đã được dùng → đây là lần BẤM LẠI, không phải việc mới.
 *
 * Cố ý là một lớp lỗi chứ không phải cờ trả về: `INSERT` trùng khoá làm Postgres HUỶ cả
 * transaction, nên không thể đi tiếp — phải thoát ra tới chỗ `rollbackTransaction()` rồi mới
 * đọc được kết quả cũ bằng một kết nối sạch.
 */
export class PhatLaiThaoTac extends Error {
  constructor(public readonly khoa: string) {
    super('PHAT_LAI');
    this.name = 'PhatLaiThaoTac';
  }
}

/**
 * Mã lỗi "trùng khoá" của Postgres.
 *
 * ⚠️ Phải bọc RIÊNG quanh lệnh chèn khoá, đừng bắt ở `catch` chung: trong cùng transaction còn
 * có `ux_appt_booking_active` cũng ném đúng mã `23505`, mà ý nghĩa thì ngược hẳn nhau — một cái
 * là "bấm lại", cái kia là "ca đã có người khác đặt".
 */
export function laTrungKhoa(e: unknown): boolean {
  return (e as { code?: string } | null)?.code === '23505';
}
```

- [ ] **Step 3: Thêm DDL idempotent**

Trong `backend/src/schema-bootstrap.service.ts`, thêm vào `STATEMENTS`:

```ts
    `CREATE TABLE IF NOT EXISTS thao_tac_ghi (
       khoa     VARCHAR(64) PRIMARY KEY,
       route    VARCHAR(80) NOT NULL,
       ket_qua  JSONB,
       tao_luc  TIMESTAMPTZ NOT NULL DEFAULT now()
     )`,
    `CREATE INDEX IF NOT EXISTS idx_thao_tac_ghi_tao_luc ON thao_tac_ghi (tao_luc)`,
```

- [ ] **Step 4: Đăng ký entity**

Trong `backend/src/app.module.ts`: thêm `import { ThaoTacGhi } from './models/thao-tac-ghi.model';` và thêm `ThaoTacGhi` vào mảng `TypeOrmModule.forFeature([...])`.

- [ ] **Step 5: Kiểm kiểu và khởi động thật**

Run: `cd backend && npm run type-check`
Expected: sạch.

Run: `cd backend && npm run start:dev` (để chạy ~15 giây rồi Ctrl-C)
Expected: log `SchemaBootstrap` không báo lỗi; bảng `thao_tac_ghi` đã có.

- [ ] **Step 6: Xác nhận bảng tồn tại thật**

Run:
```bash
cd backend && node -e "
const fs=require('fs'),pg=require('pg');
const E=fs.readFileSync('.env','utf8').split('\n');
const v=k=>{const l=E.find(x=>x.startsWith(k+'='));return l?l.slice(k.length+1).replace(/^[\"']|[\"']\$/g,''):undefined};
const c=new pg.Client({host:v('DB_HOST'),port:+v('DB_PORT'),user:v('DB_USER'),password:v('DB_PASSWORD'),database:v('DB_NAME'),ssl:{rejectUnauthorized:false}});
c.connect().then(()=>c.query(\"select column_name,data_type from information_schema.columns where table_name='thao_tac_ghi' order by 1\"))
 .then(r=>{console.table(r.rows);return c.end()});
"
```
Expected: 4 cột — `ket_qua jsonb`, `khoa character varying`, `route character varying`, `tao_luc timestamp with time zone`.

- [ ] **Step 7: Commit**

```bash
git add backend/src/models/thao-tac-ghi.model.ts backend/src/utils/thao-tac-ghi.util.ts \
        backend/src/schema-bootstrap.service.ts backend/src/app.module.ts
git commit -m "feat(dat-lich): sổ khoá chống lặp cho thao tác ghi"
```

---

### Task 4: Gắn khoá chống lặp vào `book`

**Files:**
- Modify: `backend/src/controllers/appointment-slot.controller.ts` (`book`, dòng ~338)
- Modify: `backend/src/routers/appointment-slot.router.ts:231-238` (`book`) và `:48-58` (`bookMy`)
- Create: `backend/src/controllers/appointment-idempotency.spec.ts`

**Interfaces:**
- Consumes: `ThaoTacGhi`, `PhatLaiThaoTac`, `laTrungKhoa` (Task 3)
- Produces: `book(id: number, dto: BookSlotDto, khoa?: string)` — chữ ký cũ vẫn gọi được vì `khoa` là tham số tuỳ chọn.

- [ ] **Step 1: Viết phép kiểm trước**

Tạo `backend/src/controllers/appointment-idempotency.spec.ts`:

```ts
import { AppointmentSlotsService } from './appointment-slot.controller';
import { AppointmentSlot } from '../models/appointment-slot.model';
import { AppointmentBooking } from '../models/appointment-booking.model';
import { ThaoTacGhi } from '../models/thao-tac-ghi.model';

function caGia(p: Partial<AppointmentSlot>): AppointmentSlot {
  return {
    id: 1, slotDate: '2026-10-10', slotTime: '09:30:00', status: 'OPEN',
    patientId: null, reason: null, notes: null,
    reminded1h: false, reminded30m: false, reminded15m: false,
    createdAt: new Date(), updatedAt: new Date(), ...p,
  } as AppointmentSlot;
}

function veGia(p: Partial<AppointmentBooking>): AppointmentBooking {
  return {
    id: 100, slotId: 1, patientId: 5639, slotDate: '2026-10-10', slotTime: '09:30:00',
    status: 'BOOKED', reason: 'đau vai gáy', notes: null,
    cancelledBy: null, cancelledAt: null,
    movedToId: null, movedToDate: null, movedToTime: null, movedFromId: null, movedAt: null,
    createdAt: new Date(), updatedAt: new Date(), ...p,
  } as AppointmentBooking;
}

/**
 * Kho trong bộ nhớ có MÔ PHỎNG khoá chính của `thao_tac_ghi`: chèn trùng thì ném 23505.
 * Nhận NHIỀU ca để Task 5 (`move`) dùng lại được mà không phải dựng helper thứ hai.
 */
function dungService(dsCa: AppointmentSlot[], ve: AppointmentBooking | null = null) {
  const cacCa = new Map<number, AppointmentSlot>(dsCa.map((c) => [c.id, c]));
  const soKhoa = new Map<string, { khoa: string; route: string; ketQua: unknown }>();
  let idTiepTheo = 900;

  const manager = {
    findOne: jest.fn(async (entity: unknown, opts: any) => {
      if (entity === AppointmentSlot) return cacCa.get(opts.where.id) ?? null;
      if (entity === AppointmentBooking) {
        return ve && ve.slotId === opts.where.slotId && ve.status === opts.where.status ? ve : null;
      }
      return null;
    }),
    create: jest.fn((_e: unknown, data: any) => ({ ...data })),
    save: jest.fn(async (x: any) => { if (x.id == null) x.id = idTiepTheo++; return x; }),
    insert: jest.fn(async (entity: unknown, data: any) => {
      if (entity === ThaoTacGhi) {
        if (soKhoa.has(data.khoa)) {
          const e: any = new Error('duplicate key'); e.code = '23505'; throw e;
        }
        soKhoa.set(data.khoa, { ...data, ketQua: null });
      }
      return { identifiers: [] };
    }),
    update: jest.fn(async (entity: unknown, where: any, data: any) => {
      if (entity === ThaoTacGhi && soKhoa.has(where.khoa)) {
        soKhoa.get(where.khoa)!.ketQua = data.ketQua;
      }
      return { affected: 1 };
    }),
  };

  const queryRunner = {
    connect: jest.fn(), startTransaction: jest.fn(),
    commitTransaction: jest.fn(), rollbackTransaction: jest.fn(),
    release: jest.fn(), manager,
  };

  const suKien: any[] = [];
  const thaoTacRepo = { findOneBy: jest.fn(async ({ khoa }: any) => soKhoa.get(khoa) ?? null) };

  const service = new AppointmentSlotsService(
    {} as any,
    {} as any,
    { sendToToken: jest.fn() } as any,
    { findOne: jest.fn(async () => ({ id: 5639, fullName: 'Khách thử' })) } as any,
    { emitEvent: jest.fn((e: any) => suKien.push(e)) } as any,
    thaoTacRepo as any,
    { createQueryRunner: () => queryRunner } as any,
  );
  return { service, suKien, soKhoa, queryRunner };
}

describe('book — bấm lại khi mạng chập KHÔNG được làm hai lần', () => {
  const GIO_TRUOC = '2026-10-10T00:00:00.000Z';
  beforeEach(() => jest.useFakeTimers().setSystemTime(new Date(GIO_TRUOC)));
  afterEach(() => jest.useRealTimers());

  it('cùng một khoá gọi hai lần → chỉ ĐẶT một lần, lần hai trả lại kết quả cũ', async () => {
    const { service, soKhoa } = dungService([caGia({ id: 10, status: 'OPEN' })]);
    const lan1 = await service.book(10, { patientId: 5639 } as any, 'k-abc');
    const lan2 = await service.book(10, { patientId: 5639 } as any, 'k-abc');

    expect(soKhoa.size).toBe(1);
    expect(lan2).toEqual(lan1);
  });

  it('lần BẤM LẠI không được phát SSE lần hai', async () => {
    const { service, suKien } = dungService([caGia({ id: 10, status: 'OPEN' })]);
    await service.book(10, { patientId: 5639 } as any, 'k-abc');
    const sauLan1 = suKien.length;
    await service.book(10, { patientId: 5639 } as any, 'k-abc');

    expect(suKien.length).toBe(sauLan1);
  });

  it('KHÔNG có khoá thì xử sự y như trước — không được phá máy khách bản cũ', async () => {
    const { service, soKhoa } = dungService([caGia({ id: 10, status: 'OPEN' })]);
    const kq = await service.book(10, { patientId: 5639 } as any);

    expect(soKhoa.size).toBe(0);
    expect(kq.slot.status).toBe('BOOKED');
  });
});
```

- [ ] **Step 2: Chạy để thấy nó ĐỎ**

Run: `cd backend && npm test -- appointment-idempotency`
Expected: FAIL — `book` chưa nhận tham số thứ ba, `soKhoa.size` là 0.

- [ ] **Step 3: Thêm repo vào constructor**

Trong `appointment-slot.controller.ts`, thêm import:

```ts
import { ThaoTacGhi } from '../models/thao-tac-ghi.model';
import { PhatLaiThaoTac, laTrungKhoa } from '../utils/thao-tac-ghi.util';
```

Và thêm tham số thứ **sáu** của constructor (đúng vị trí `{} as any` thứ sáu mà phép kiểm đang truyền):

```ts
    @InjectRepository(ThaoTacGhi)
    private readonly thaoTacRepo: Repository<ThaoTacGhi>,
```

⚠️ Thứ tự tham số phải khớp với phép kiểm. Nếu vị trí thứ sáu đang là thứ khác, **sửa phép kiểm cho khớp code**, đừng xáo trộn constructor đang dùng ở nơi khác.

- [ ] **Step 4: Gắn khoá vào `book`**

Đổi chữ ký:

```ts
  async book(
    id: number,
    dto: BookSlotDto,
    khoa?: string,
  ): Promise<{ slot: AppointmentSlot; booking: PatientBookingView }> {
```

Ngay sau `const m = queryRunner.manager;` (hoặc đầu khối `try`, **trước** mọi thao tác khác):

```ts
      // Khoá chống lặp PHẢI chèn TRƯỚC khi làm việc: lần gửi thứ hai tới lúc lần một chưa
      // commit sẽ bị CHẶN CHỜ trên khoá chính, đúng hành vi muốn có.
      if (khoa) {
        try {
          await queryRunner.manager.insert(ThaoTacGhi, { khoa, route: 'book' });
        } catch (e) {
          // Bọc RIÊNG quanh lệnh này: ux_appt_booking_active cũng ném 23505 nhưng nghĩa ngược hẳn.
          if (!laTrungKhoa(e)) throw e;
          throw new PhatLaiThaoTac(khoa);
        }
      }
```

Ngay **trước** `await queryRunner.commitTransaction();`:

```ts
      if (khoa) {
        await queryRunner.manager.update(
          ThaoTacGhi, { khoa },
          { ketQua: { slot: savedSlot, booking: toBookingView(savedBooking) } },
        );
      }
```

Trong khối `catch (err)`, **ngay sau** `await queryRunner.rollbackTransaction();`:

```ts
      if (err instanceof PhatLaiThaoTac) {
        // Lần BẤM LẠI: trả lại y hệt kết quả cũ, và KHÔNG phát SSE lần hai (khối phát nằm sau
        // `finally`, nên `return` ở đây bỏ qua nó).
        const cu = await this.thaoTacRepo.findOneBy({ khoa: err.khoa });
        return cu?.ketQua as { slot: AppointmentSlot; booking: PatientBookingView };
      }
```

- [ ] **Step 5: Chạy lại cho XANH**

Run: `cd backend && npm test -- appointment-idempotency`
Expected: PASS, 3 phép kiểm.

- [ ] **Step 6: Nhận header ở router**

Trong `appointment-slot.router.ts`, thêm `Headers` vào import từ `@nestjs/common`, rồi:

```ts
  @UseGuards(NhanVienGuard)
  @Post(':id/book')
  async book(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: BookSlotDto,
    @Headers('idempotency-key') khoa?: string,
  ) {
    const { slot } = await this.service.book(id, dto, khoa);
    return { success: true, data: slot };
  }
```

Và cho `bookMy` (dòng ~48), truyền khoá xuống `this.service.bookMy(id, patientId, dto, khoa)`; đổi `bookMy` trong service thành:

```ts
  async bookMy(
    id: number,
    patientId: number,
    dto: BookSlotDto,
    khoa?: string,
  ): Promise<{ slot: AppointmentSlot; booking: PatientBookingView }> {
    return this.book(id, { ...dto, patientId }, khoa);
  }
```

- [ ] **Step 7: Kiểm kiểu và chạy cả bộ test đặt lịch**

Run: `cd backend && npm run type-check && npm test -- appointment`
Expected: type-check sạch; `appointment-chuyen-ve` cũ vẫn PASS.

- [ ] **Step 8: Commit**

```bash
git add backend/src/controllers/appointment-slot.controller.ts \
        backend/src/routers/appointment-slot.router.ts \
        backend/src/controllers/appointment-idempotency.spec.ts
git commit -m "feat(dat-lich): book lặp lại vô hại — bấm lại khi mạng chập không đặt hai lần"
```

---

### Task 5: Gắn khoá chống lặp vào `move`

**Files:**
- Modify: `backend/src/controllers/appointment-slot.controller.ts` (`move` ~558, `moveMy` ~684)
- Modify: `backend/src/routers/appointment-slot.router.ts:251-262` và `:72-82`
- Modify: `backend/src/controllers/appointment-idempotency.spec.ts`

**Interfaces:**
- Consumes: Task 3, Task 4 (cùng lối)
- Produces: `move(id: number, targetId: number, by?: 'PATIENT' | 'STAFF', khoa?: string)`

- [ ] **Step 1: Thêm phép kiểm**

Thêm vào `appointment-idempotency.spec.ts`. Dùng lại `dungService` của Task 4 — nó đã nhận mảng ca và một vé:

```ts
describe('move — bấm lại KHÔNG được chuyển vé đi hai chặng', () => {
  const haiCa = () => [
    caGia({ id: 486, slotTime: '09:30:00', status: 'BOOKED', patientId: 5639 }),
    caGia({ id: 490, slotTime: '14:45:00', status: 'OPEN' }),
  ];

  it('cùng khoá gọi hai lần → vé chỉ đi MỘT chặng, lần hai trả lại kết quả cũ', async () => {
    const { service, soKhoa } = dungService(haiCa(), veGia({ slotId: 486 }));
    const lan1 = await service.move(486, 490, 'STAFF', 'k-move-1');
    const lan2 = await service.move(486, 490, 'STAFF', 'k-move-1');

    expect(soKhoa.size).toBe(1);
    expect(lan2.booking.id).toBe(lan1.booking.id);
  });

  it('lần bấm lại KHÔNG phát SSE và KHÔNG gửi thông báo cho khách lần hai', async () => {
    const { service, suKien } = dungService(haiCa(), veGia({ slotId: 486 }));
    await service.move(486, 490, 'STAFF', 'k-move-1');
    const sau1 = suKien.length;
    await service.move(486, 490, 'STAFF', 'k-move-1');
    expect(suKien.length).toBe(sau1);
  });
});
```

- [ ] **Step 2: Chạy để thấy ĐỎ**

Run: `cd backend && npm test -- appointment-idempotency`
Expected: FAIL — `move` chưa nhận tham số thứ tư.

- [ ] **Step 3: Sửa `move`**

Chữ ký: `async move(id: number, targetId: number, by: 'PATIENT' | 'STAFF' = 'STAFF', khoa?: string)`.

Ngay sau `const m = queryRunner.manager;`:

```ts
      if (khoa) {
        try {
          await m.insert(ThaoTacGhi, { khoa, route: 'move' });
        } catch (e) {
          if (!laTrungKhoa(e)) throw e;
          throw new PhatLaiThaoTac(khoa);
        }
      }
```

Trước `await queryRunner.commitTransaction();`:

```ts
      if (khoa) {
        await m.update(ThaoTacGhi, { khoa }, {
          ketQua: {
            from: savedFrom, to: savedTo,
            booking: toBookingView(newBooking), moved: toBookingView(oldBooking),
          },
        });
      }
```

Trong `catch (err)`, ngay sau `rollbackTransaction()` và **trước** nhánh kiểm `23505` đang có:

```ts
      if (err instanceof PhatLaiThaoTac) {
        const cu = await this.thaoTacRepo.findOneBy({ khoa: err.khoa });
        return cu?.ketQua as Awaited<ReturnType<AppointmentSlotsService['move']>>;
      }
```

⚠️ Nhánh này phải đứng **trước** nhánh `if ((err as { code?: string }).code === '23505')`, nếu không câu *"Ca mới vừa có người khác đặt mất"* sẽ nuốt mất lần phát lại.

Và `moveMy`: `async moveMy(id: number, patientId: number, targetId: number, khoa?: string)` → `return this.move(id, targetId, 'PATIENT', khoa);`

- [ ] **Step 4: Chạy lại cho XANH**

Run: `cd backend && npm test -- appointment-idempotency`
Expected: PASS.

- [ ] **Step 5: Nhận header ở router**

```ts
  @UseGuards(NhanVienGuard)
  @Put(':id/move')
  async move(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { targetSlotId: number },
    @Headers('idempotency-key') khoa?: string,
  ) {
    const kq = await this.service.move(id, Number(dto.targetSlotId), 'STAFF', khoa);
    return { success: true, ...kq };
  }
```

⚠️ Giữ nguyên hình dạng phản hồi hiện có — `AppointmentsView.confirmMove` đang đọc `res.from` / `res.to`. Đọc lại dòng gốc trước khi sửa.

Làm tương tự cho `@Put(':id/my-move')` → `this.service.moveMy(id, patientId, targetId, khoa)`.

- [ ] **Step 6: Kiểm kiểu và chạy cả bộ**

Run: `cd backend && npm run type-check && npm test -- appointment`
Expected: tất cả PASS, gồm cả 4 luật của `appointment-chuyen-ve`.

- [ ] **Step 7: Commit**

```bash
git add backend/src/controllers/appointment-slot.controller.ts \
        backend/src/routers/appointment-slot.router.ts \
        backend/src/controllers/appointment-idempotency.spec.ts
git commit -m "feat(dat-lich): move lặp lại vô hại — bấm lại không chuyển vé đi hai chặng"
```

---

### Task 6: Gắn khoá chống lặp vào `cancel`

**Files:**
- Modify: `backend/src/controllers/appointment-slot.controller.ts` (`cancel` ~453, `cancelMy` ~532)
- Modify: `backend/src/routers/appointment-slot.router.ts:241-248` và `:61-69`
- Modify: `backend/src/controllers/appointment-idempotency.spec.ts`

**Interfaces:**
- Consumes: Task 3
- Produces: `cancel(id: number, by?: 'PATIENT' | 'STAFF', khoa?: string)`

- [ ] **Step 1: Thêm phép kiểm**

```ts
describe('cancel — bấm lại không được huỷ nhầm vé khác', () => {
  it('cùng khoá gọi hai lần → chỉ huỷ một lần, lần hai trả kết quả cũ', async () => {
    const { service, soKhoa } = dungService(
      [caGia({ id: 10, status: 'BOOKED', patientId: 5639 })],
      veGia({ slotId: 10 }),
    );
    const lan1 = await service.cancel(10, 'STAFF', 'k-huy-1');
    const lan2 = await service.cancel(10, 'STAFF', 'k-huy-1');
    expect(soKhoa.size).toBe(1);
    expect(lan2).toEqual(lan1);
  });
});
```

- [ ] **Step 2: Chạy để thấy ĐỎ**

Run: `cd backend && npm test -- appointment-idempotency`
Expected: FAIL.

- [ ] **Step 3: Sửa `cancel` theo đúng ba chỗ như Task 5**

Chữ ký `async cancel(id: number, by: 'PATIENT' | 'STAFF' = 'STAFF', khoa?: string)`; chèn khoá đầu `try`; `update` kết quả `{ slot: savedSlot, booking: savedBooking ? toBookingView(savedBooking) : null }` trước commit; nhánh `PhatLaiThaoTac` sau rollback.

`cancelMy` truyền khoá xuống `this.cancel(id, 'PATIENT', khoa)`.

- [ ] **Step 4: Chạy lại cho XANH**

Run: `cd backend && npm test -- appointment-idempotency`
Expected: PASS.

- [ ] **Step 5: Nhận header ở hai router `cancel` và `my-cancel`** (cùng khuôn Task 5 Step 5)

- [ ] **Step 6: Kiểm kiểu + toàn bộ test backend**

Run: `cd backend && npm run type-check && npm test`
Expected: toàn bộ PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/src/controllers/appointment-slot.controller.ts \
        backend/src/routers/appointment-slot.router.ts \
        backend/src/controllers/appointment-idempotency.spec.ts
git commit -m "feat(dat-lich): cancel lặp lại vô hại"
```

---

### Task 7: Chính sách hạn giờ và thử lại (module THUẦN, kiểm được)

Tách phần *quyết định* ra khỏi `api.ts` để kiểm được bằng `node --test` mà **không thêm vitest**.

**Files:**
- Create: `frontend/src/lib/thuLaiApi.ts`
- Create: `frontend/src/lib/thuLaiApi.test.ts`

**Interfaces:**
- Consumes: không
- Produces:
  - `HAN_GIO_DOC_MS = 12000`, `HAN_GIO_GHI_MS = 20000`
  - `nenThuLai(opts: { laGhi: boolean; coKhoa: boolean; lanDaThu: number; status: number | null; laLoiMang: boolean }): boolean`
  - `treTruocKhiThu(lanDaThu: number): number`

- [ ] **Step 1: Viết phép kiểm trước**

`frontend/src/lib/thuLaiApi.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nenThuLai, treTruocKhiThu, HAN_GIO_DOC_MS, HAN_GIO_GHI_MS } from './thuLaiApi.ts';

const doc = { laGhi: false, coKhoa: false, lanDaThu: 0, status: null, laLoiMang: true };

test('ĐỌC: lỗi mạng thì thử lại', () => {
  assert.equal(nenThuLai(doc), true);
});

test('ĐỌC: thử tối đa 2 lần rồi thôi', () => {
  assert.equal(nenThuLai({ ...doc, lanDaThu: 1 }), true);
  assert.equal(nenThuLai({ ...doc, lanDaThu: 2 }), false);
});

test('TUYỆT ĐỐI không thử lại 4xx — 409 là "ca đã có người đặt", thử lại chỉ nhận lại y thế', () => {
  for (const s of [400, 401, 403, 404, 409, 422]) {
    assert.equal(nenThuLai({ ...doc, laLoiMang: false, status: s }), false, `status ${s}`);
  }
});

test('ĐỌC: 502/503/504 thì thử lại', () => {
  for (const s of [502, 503, 504]) {
    assert.equal(nenThuLai({ ...doc, laLoiMang: false, status: s }), true, `status ${s}`);
  }
});

test('GHI: KHÔNG có khoá chống lặp thì KHÔNG thử lại — đây là luật an toàn dữ liệu', () => {
  assert.equal(nenThuLai({ laGhi: true, coKhoa: false, lanDaThu: 0, status: null, laLoiMang: true }), false);
});

test('GHI: có khoá thì được thử lại ĐÚNG MỘT lần', () => {
  const ghi = { laGhi: true, coKhoa: true, status: null, laLoiMang: true };
  assert.equal(nenThuLai({ ...ghi, lanDaThu: 0 }), true);
  assert.equal(nenThuLai({ ...ghi, lanDaThu: 1 }), false);
});

test('độ trễ tăng dần, không phải hằng số', () => {
  assert.equal(treTruocKhiThu(0), 300);
  assert.equal(treTruocKhiThu(1), 1200);
});

test('hạn giờ GHI rộng hơn hạn giờ ĐỌC', () => {
  assert.ok(HAN_GIO_GHI_MS > HAN_GIO_DOC_MS);
});
```

- [ ] **Step 2: Chạy để thấy ĐỎ**

Run: `cd frontend && node --test src/lib/thuLaiApi.test.ts`
Expected: FAIL — không tìm thấy `./thuLaiApi.ts`.

- [ ] **Step 3: Viết module**

`frontend/src/lib/thuLaiApi.ts`:

```ts
/**
 * Luật hạn giờ và thử lại cho `services/api.ts`.
 *
 * Tách riêng vì đây là phần DUY NHẤT có thể sai một cách im lặng, và frontend không có bộ chạy
 * test cho `src/` — module thuần thì `node --test` chạy thẳng được (Node 26 tự bóc kiểu), khỏi
 * phải thêm vitest chỉ để canh mấy nhánh if.
 */

/** Rộng gấp ~300 lần p90 đo được (41 ms) — cố ý, để không cắt oan người ở đường yếu. */
export const HAN_GIO_DOC_MS = 12_000;
export const HAN_GIO_GHI_MS = 20_000;

const MA_DANG_THU_LAI = new Set([502, 503, 504]);

export function nenThuLai(opts: {
  laGhi: boolean;
  coKhoa: boolean;
  lanDaThu: number;
  status: number | null;
  laLoiMang: boolean;
}): boolean {
  const { laGhi, coKhoa, lanDaThu, status, laLoiMang } = opts;

  // ⚠️ Thao tác GHI không mang khoá chống lặp thì TUYỆT ĐỐI không thử lại: không ai biết máy chủ
  // đã làm xong hay chưa, và thử lại mù là cách tạo ra vé đặt hai lần.
  if (laGhi && !coKhoa) return false;

  const tran = laGhi ? 1 : 2;
  if (lanDaThu >= tran) return false;

  if (laLoiMang) return true;
  // 4xx là câu trả lời THẬT của máy chủ (409 = ca đã có người đặt). Thử lại chỉ nhận lại y thế.
  return status != null && MA_DANG_THU_LAI.has(status);
}

/** 300 ms rồi 1.200 ms. Không thử lại tức thì — mạng vừa chập cần một nhịp để hồi. */
export function treTruocKhiThu(lanDaThu: number): number {
  return lanDaThu === 0 ? 300 : 1_200;
}
```

- [ ] **Step 4: Chạy lại cho XANH**

Run: `cd frontend && node --test src/lib/thuLaiApi.test.ts`
Expected: `pass 8`, `fail 0`.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/thuLaiApi.ts frontend/src/lib/thuLaiApi.test.ts
git commit -m "feat(api): luật hạn giờ và thử lại, tách thuần để kiểm được không cần vitest"
```

---

### Task 8: Áp hạn giờ + thử lại vào `api.ts`

**Files:**
- Modify: `frontend/src/services/api.ts:110-163`

**Interfaces:**
- Consumes: `nenThuLai`, `treTruocKhiThu`, `HAN_GIO_DOC_MS`, `HAN_GIO_GHI_MS` (Task 7)
- Produces: `api.post/put/patch/delete(path, body, khoa?)` — tham số thứ ba tuỳ chọn là `Idempotency-Key`.

- [ ] **Step 1: Thêm import và hàm phụ**

Đầu `api.ts`:

```ts
import { nenThuLai, treTruocKhiThu, HAN_GIO_DOC_MS, HAN_GIO_GHI_MS } from '@/lib/thuLaiApi'
```

Thêm trước `request`:

```ts
const nguMs = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** `fetch` ném TypeError cho MỌI kiểu đứt đường; AbortError là do chính ta cắt vì quá hạn. */
function laLoiMangHoacQuaHan(err: unknown): boolean {
  const e = err as { name?: string } | null
  return e?.name === 'TypeError' || e?.name === 'AbortError'
}
```

- [ ] **Step 2: Viết lại `request`**

```ts
async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  khoa?: string,
): Promise<T> {
  const laGhi = method !== 'GET'
  const hanGio = laGhi ? HAN_GIO_GHI_MS : HAN_GIO_DOC_MS
  let lanDaThu = 0

  for (;;) {
    const startedAt = Date.now()
    if (DEBUG_API) {
      const bodyPart = body !== undefined ? ` body=${shortJson(body)}` : ''
      console.log(`[API] → ${method} ${path}${bodyPart}${lanDaThu ? ` (thử lần ${lanDaThu + 1})` : ''}`)
    }
    // Không có hạn giờ thì một request treo sẽ khoá nút bấm vô thời hạn — đã đo một lượt
    // treo rất lâu trên đường chập.
    const canh = new AbortController()
    const dongHo = setTimeout(() => canh.abort(), hanGio)
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers: { ...getAuthHeaders(), ...(khoa ? { 'Idempotency-Key': khoa } : {}) },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: canh.signal,
      })
      if (!res.ok && nenThuLai({ laGhi, coKhoa: !!khoa, lanDaThu, status: res.status, laLoiMang: false })) {
        await nguMs(treTruocKhiThu(lanDaThu))
        lanDaThu += 1
        continue
      }
      return await handleResponse<T>(res, method, path, startedAt)
    } catch (err: any) {
      const laMang = laLoiMangHoacQuaHan(err)
      if (laMang && nenThuLai({ laGhi, coKhoa: !!khoa, lanDaThu, status: null, laLoiMang: true })) {
        // Máy đang mất mạng hẳn thì thử lại ngay là vô ích; vẫn đếm một lần rồi nghỉ.
        await nguMs(treTruocKhiThu(lanDaThu))
        lanDaThu += 1
        continue
      }
      if (laMang) {
        const elapsed = Date.now() - startedAt
        const lyDo = err?.name === 'AbortError' ? `quá hạn ${hanGio}ms` : err.message || 'Failed to fetch'
        console.error(`[API] ✗ ${method} ${path} NETWORK ${elapsed}ms err="${lyDo}"`)
        baoLoiApi(method, path, null, lyDo, elapsed)
      }
      throw err
    } finally {
      clearTimeout(dongHo)
    }
  }
}
```

- [ ] **Step 3: Cho các phương thức nhận khoá**

```ts
export const api = {
  get<T>(path: string): Promise<T> {
    return request<T>('GET', path)
  },
  post<T>(path: string, body: unknown, khoa?: string): Promise<T> {
    return request<T>('POST', path, body, khoa)
  },
  put<T>(path: string, body: unknown, khoa?: string): Promise<T> {
    return request<T>('PUT', path, body, khoa)
  },
  patch<T>(path: string, body: unknown, khoa?: string): Promise<T> {
    return request<T>('PATCH', path, body, khoa)
  },
  delete<T>(path: string, khoa?: string): Promise<T> {
    return request<T>('DELETE', path, undefined, khoa)
  },
  // `upload` giữ nguyên — multipart không đi qua đường thử lại.
  ...
}
```

- [ ] **Step 4: Kiểm kiểu**

Run: `cd frontend && npm run type-check`
Expected: sạch.

- [ ] **Step 5: Kiểm bằng tay — hạn giờ có thật sự cắt không**

Chạy `npm run dev`, mở DevTools → Network → chọn "Offline", bấm một nút ĐỌC bất kỳ.
Expected: không treo quá ~14 giây (12 s + 2 lần nghỉ), console in `quá hạn 12000ms`.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/services/api.ts
git commit -m "feat(api): hạn giờ 12s/20s + tự thử lại có kỷ luật; ghi chỉ thử lại khi có khoá"
```

---

### Task 9: Máy khách sinh khoá cho ba thao tác

**Files:**
- Modify: `frontend/src/views/AppointmentsView.vue` (`confirmMove`, `runSlotAction` nhánh `cancel`, hàm đặt vé)
- Modify: `frontend/src/views/patient/PatientScheduleView.vue` (đặt / huỷ / chuyển của khách)

**Interfaces:**
- Consumes: `api.post/put(path, body, khoa)` (Task 8)
- Produces: không

- [ ] **Step 1: Thêm hàm sinh khoá vào `AppointmentsView.vue`**

```ts
/**
 * Khoá chống lặp: sinh MỘT lần cho mỗi Ý ĐỊNH, không phải mỗi lần gửi.
 *
 * Mở hộp thoại Chuyển vé → sinh khoá; bấm lại vì mạng chập → dùng LẠI khoá đó, máy chủ nhận ra
 * và trả lại kết quả cũ. Đổi ca đích hoặc đóng hộp thoại → ý định khác → khoá khác.
 */
function khoaMoi(): string {
  return crypto.randomUUID()
}
let khoaChuyen: string | null = null
```

- [ ] **Step 2: Gắn vào `confirmMove`**

Trong hàm mở hộp thoại chuyển vé (`openMoveModal` hoặc tương đương) thêm `khoaChuyen = khoaMoi()`.
Trong `closeMoveModal` thêm `khoaChuyen = null`.
Ở chỗ chọn ca đích (`moveTargetId` đổi) cũng đặt `khoaChuyen = khoaMoi()`.

Trong `confirmMove`, đổi lời gọi thành:

```ts
    const res = await api.put<{ from: AppointmentSlot; to: AppointmentSlot }>(
      `/appointment-slots/${moveSlotId.value}/move`,
      { targetSlotId: moveTargetId.value },
      khoaChuyen ?? undefined,
    )
```

- [ ] **Step 3: Gắn vào `runSlotAction` nhánh huỷ**

```ts
  // Khoá sinh tại CÚ BẤM: mỗi lần người dùng chủ động bấm Huỷ là một ý định mới.
  const khoa = type === 'cancel' ? khoaMoi() : undefined
  const res = await api.put<...>(`/appointment-slots/${slot.id}/${endpoint}`, {}, khoa)
```

⚠️ `close`/`open`/`complete` **không** cần khoá — chúng chỉ đặt `status` về một giá trị cố định nên gọi lại đã vô hại.

- [ ] **Step 4: Làm tương tự ở `PatientScheduleView.vue`** cho `my-book`, `my-cancel`, `my-move`.

- [ ] **Step 5: Kiểm kiểu**

Run: `cd frontend && npm run type-check`
Expected: sạch.

- [ ] **Step 6: Nghiệm thu bằng tay — đúng cảnh người dùng gặp**

Chạy backend + frontend. Mở tab Lịch Trị Liệu, bấm Chuyển vé, chọn ca đích.
Trong DevTools → Network bật "Offline" **ngay sau** khi bấm xác nhận, rồi tắt Offline và bấm xác nhận **lần nữa**.
Expected: vé chỉ chuyển MỘT chặng. Kiểm trong CSDL: chỉ một dòng `MOVED`.

Run:
```bash
cd backend && node -e "
const fs=require('fs'),pg=require('pg');
const E=fs.readFileSync('.env','utf8').split('\n');
const v=k=>{const l=E.find(x=>x.startsWith(k+'='));return l?l.slice(k.length+1).replace(/^[\"']|[\"']\$/g,''):undefined};
const c=new pg.Client({host:v('DB_HOST'),port:+v('DB_PORT'),user:v('DB_USER'),password:v('DB_PASSWORD'),database:v('DB_NAME'),ssl:{rejectUnauthorized:false}});
c.connect().then(()=>c.query(\"select id,\\\"slotId\\\",status,\\\"movedToId\\\" from appointment_bookings order by id desc limit 5\"))
 .then(r=>{console.table(r.rows);return c.end()});
"
```
Expected: đúng một dòng `MOVED` cho lượt vừa thử.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/views/AppointmentsView.vue frontend/src/views/patient/PatientScheduleView.vue
git commit -m "feat(dat-lich): máy khách sinh khoá chống lặp cho đặt/chuyển/huỷ vé"
```

---

## Giai đoạn 2 — E1, tách riêng vì nó đụng dữ liệu thật

### Task 10: Đồng nhất kiểu cột thời gian của `appointment_slots`

⚠️ **Task này có `ALTER COLUMN` trên bảng lịch hẹn đang dùng. Sai là mọi mốc dịch 7 giờ.**

**Files:**
- Create: `backend/sql/dong-nhat-moc-thoi-gian-appointment-slots.sql`
- Modify: `backend/src/models/appointment-booking.model.ts` (sửa comment sai)

**Interfaces:**
- Consumes: không
- Produces: không (chỉ lược đồ)

- [ ] **Step 1: ĐO LẠI để xác nhận giá trị hiện tại là UTC**

Run:
```bash
cd backend && node -e "
const fs=require('fs'),pg=require('pg');
const E=fs.readFileSync('.env','utf8').split('\n');
const v=k=>{const l=E.find(x=>x.startsWith(k+'='));return l?l.slice(k.length+1).replace(/^[\"']|[\"']\$/g,''):undefined};
const c=new pg.Client({host:v('DB_HOST'),port:+v('DB_PORT'),user:v('DB_USER'),password:v('DB_PASSWORD'),database:v('DB_NAME'),ssl:{rejectUnauthorized:false}});
c.connect().then(()=>c.query(\`select (select max(\\\"updatedAt\\\")::text from appointment_slots) as slots_tho,
  (select max(\\\"updatedAt\\\")::text from appointment_bookings) as bookings_tz, now()::text as now_utc\`))
 .then(r=>{console.table(r.rows);return c.end()});
"
```
Expected: `slots_tho` **gần với** `now_utc` (lệch vài phút/giờ theo hoạt động), **không** lệch đúng 7 giờ.

⚠️ **Nếu `slots_tho` lệch đúng ~7 giờ so với `now_utc` thì DỪNG LẠI** — giá trị đang là giờ VN, và câu `USING` dưới đây sai. Báo người dùng, đừng tự đoán.

- [ ] **Step 2: Sao lưu hai cột trước khi đổi**

```sql
CREATE TABLE IF NOT EXISTS appointment_slots_moc_backup AS
  SELECT id, "createdAt", "updatedAt" FROM appointment_slots;
```
Run câu trên qua cùng lối `node -e` ở Step 1.
Expected: bảng sao lưu có đúng số dòng bằng `appointment_slots`.

- [ ] **Step 3: Viết tệp migration**

`backend/sql/dong-nhat-moc-thoi-gian-appointment-slots.sql`:

```sql
-- Đồng nhất kiểu mốc thời gian của appointment_slots với appointment_bookings.
--
-- Vì sao: `appointment_slots."createdAt"/"updatedAt"` là `timestamp WITHOUT time zone` còn
-- `appointment_bookings` là `WITH`. Hai bảng của CÙNG một nghiệp vụ, hai hệ quy chiếu — mọi phép
-- so hoặc sắp xếp trộn hai bảng lệch 7 giờ. Đã làm một truy vấn chẩn đoán trả về 0 dòng
-- (10/10/2026) mà không báo lỗi gì.
--
-- ⚠️ ĐO LẠI trước khi chạy: câu USING dưới đây đúng khi giá trị đang lưu là UTC. Phép đo
-- 10/10/2026: max(slots) = 12:44:00 (trần) vs now() = 13:09:51+00 → đang là UTC.
-- ⚠️ SAO LƯU trước (xem backend/sql/README.md).

ALTER TABLE appointment_slots
  ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'UTC';
```

- [ ] **Step 4: Chạy migration**

Chạy nội dung tệp trên qua `node -e` như Step 1.
Expected: không lỗi.

- [ ] **Step 5: Nghiệm thu — hai bảng nay cùng hệ quy chiếu**

Run truy vấn kiểm kiểu:
```sql
SELECT table_name, column_name, data_type FROM information_schema.columns
WHERE table_name IN ('appointment_slots','appointment_bookings')
  AND column_name IN ('createdAt','updatedAt') ORDER BY 1,2;
```
Expected: cả 4 dòng đều `timestamp with time zone`.

Và kiểm giá trị **không dịch**:
```sql
SELECT s.id, b."updatedAt" AS backup_tho, s."updatedAt" AS sau_khi_doi
FROM appointment_slots s JOIN appointment_slots_moc_backup b ON b.id = s.id LIMIT 5;
```
Expected: `sau_khi_doi` hiển thị cùng giờ đồng hồ với `backup_tho` (chỉ thêm `+00`).

- [ ] **Step 6: Sửa comment sai trong model**

Trong `backend/src/models/appointment-booking.model.ts`, câu *"TIMESTAMPTZ — khớp với appointment_slots…"* nay mới đúng; thêm một dòng:

```ts
  // (Từ 10/10/2026 appointment_slots cũng đã là timestamptz — trước đó câu trên SAI, hai bảng
  //  lệch 7 giờ. Xem backend/sql/dong-nhat-moc-thoi-gian-appointment-slots.sql.)
```

- [ ] **Step 7: Chạy toàn bộ test backend**

Run: `cd backend && npm test && npm run type-check`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add backend/sql/dong-nhat-moc-thoi-gian-appointment-slots.sql \
        backend/src/models/appointment-booking.model.ts
git commit -m "fix(dat-lich): appointment_slots dùng timestamptz — hai bảng cùng nghiệp vụ thôi lệch 7 giờ"
```

- [ ] **Step 9: Dọn bảng sao lưu SAU KHI đã yên tâm vài ngày**

Không làm ngay. Ghi lại: `DROP TABLE appointment_slots_moc_backup;`

---

## Giai đoạn 3 — Cắt byte (phần C, đã co lại còn một việc)

### Task 11: `findLite` chỉ lấy trường của DANH SÁCH

**Files:**
- Create: `backend/tmp/do-byte-api.mjs`
- Modify: `backend/src/controllers/vi-thuoc.controller.ts` (`findLite`, ~dòng 204)

**Interfaces:**
- Consumes: không
- Produces: `/duoc-lieu` trả ít cột hơn — **đổi hợp đồng API**.

- [ ] **Step 1: Viết chốt đo byte TRƯỚC khi sửa**

`backend/tmp/do-byte-api.mjs`:

```js
// Đo số byte CÓ NÉN của các route hay bị báo chậm. Chỉ đọc.
// ⚠️ Phải đo CÓ NÉN: gzip đã bật, đo byte thô là tự lừa mình (đã mắc một lần 10/10/2026).
const GOC = process.env.API_GOC || 'https://kinhlac.online/api';
const NGUONG = { '/duoc-lieu?page=1&limit=40&q=': 40_000 };

let hong = 0;
for (const [duong, tran] of Object.entries(NGUONG)) {
  const res = await fetch(GOC + duong, { headers: { 'Accept-Encoding': 'gzip' } });
  const buf = Buffer.from(await res.arrayBuffer());
  const n = buf.length;
  const dat = n <= tran;
  if (!dat) hong++;
  console.log(`${dat ? '✓' : '✗'} ${duong}  ${n} B  (trần ${tran})`);
}
process.exit(hong ? 1 : 0);
```

- [ ] **Step 2: Chạy để thấy nó ĐỎ**

Run: `cd backend && node tmp/do-byte-api.mjs`
Expected: `✗ /duoc-lieu…  ~300000 B (trần 40000)`, mã thoát 1.

- [ ] **Step 3: Grep mọi nơi dùng `findLite` trước khi cắt**

Run:
```bash
cd /Users/truongtrang/Desktop/kinhlacc
grep -rn "findLite" backend/src | grep -v spec
grep -rn "duoc-lieu?\|/duoc-lieu'" frontend/src | head -20
```
Expected: danh sách nơi gọi. **Đọc từng chỗ** xem có view nào đọc `mo_ta`, `duoc_ly`, `bao_che`, `don_thuoc`, `tham_khao`, `thanh_phan`, `nuoi_duong`, `tinh_vi_quy_kinh`, `chu_tri` từ kết quả danh sách không.

⚠️ Nếu có, **thêm trường đó vào `.select()`** thay vì bỏ qua — một view đọc trường đã bị cắt sẽ hiện **trống mà không lỗi gì**.

- [ ] **Step 4: Thêm `.select()`**

Trong `vi-thuoc.controller.ts`, ngay sau `const qb = this.repo.createQueryBuilder('vt');`:

```ts
    // Danh sách KHÔNG cần thân bài. Trước đây không có .select() nên mỗi mục kéo theo cả
    // mo_ta / duoc_ly / bao_che / don_thuoc / tham_khao — 40 mục thành ~300 KB (đã nén).
    // Tên hàm là "lite" nhưng dữ liệu thì không; đo 10/10/2026.
    qb.select([
      'vt.id', 'vt.ten_vi_thuoc', 'vt.tinh', 'vt.vi', 'vt.quy_kinh', 'vt.lieu_dung',
      'vt.ten_khoa_hoc', 'vt.ten_han', 'vt.ten_pinyin', 'vt.bo_phan_dung',
      'vt.so_bai_thuoc', 'vt.anh_dai_dien', 'vt.cong_dung_tom_tat',
    ]);
```

⚠️ `andWhere` đang lọc theo `vt.ten_khac`? Không — nó lọc theo các cột đã có trong `select`. Nhưng `.select()` **không** giới hạn được `WHERE`, nên bộ lọc vẫn chạy bình thường.

- [ ] **Step 5: Chạy lại chốt đo**

Run: `cd backend && npm run start:dev` (nền), rồi `API_GOC=http://localhost:3001 node tmp/do-byte-api.mjs`
Expected: `✓ /duoc-lieu…` dưới 40.000 B, mã thoát 0.

- [ ] **Step 6: Nghiệm thu bằng mắt — trang thư viện còn đủ chữ**

Mở `http://localhost:5173/thu-vien`, tab Dược Liệu.
Expected: danh sách vẫn hiện tên, ảnh, tính/vị/quy kinh, công dụng tóm tắt. Mở một mục ra trang chi tiết: **vẫn đủ** mô tả, bào chế, dược lý (trang chi tiết gọi route khác).

- [ ] **Step 7: Kiểm kiểu + test**

Run: `cd backend && npm run type-check && npm test`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add backend/src/controllers/vi-thuoc.controller.ts backend/tmp/do-byte-api.mjs
git commit -m "perf(duoc-lieu): findLite thôi kéo cả thân bài — 300 KB còn dưới 40 KB cho 40 mục"
```

---

## Giai đoạn 4 — Hạ tầng (phần F)

### Task 12: ĐO trước, rồi mới chọn đường cho việc build

Spec nêu ba đường (F1 build ở nơi khác · F2 deploy ngoài giờ · F3 `renice`), và ghi rõ **F3 chưa đo**. Task này là phép đo đó — kết quả tự chọn đường.

**Files:**
- Create: `backend/tmp/do-trong-luc-build.mjs`
- (Tuỳ kết quả) Modify: `/root/kinhlacc/deploy.sh` trên VPS

**Interfaces:**
- Consumes: không
- Produces: số liệu để quyết định; không có mã sản phẩm.

- [ ] **Step 1: Viết máy đo**

`backend/tmp/do-trong-luc-build.mjs`:

```js
// Bắn /auth/me mỗi giây trong N giây, in phân bố. Đường nền đo 10/10/2026: p90 = 41 ms.
// Dùng để trả lời: trong lúc deploy build trên VPS, người dùng chậm đi bao nhiêu.
const GOC = process.env.API_GOC || 'https://kinhlac.online/api';
const GIAY = Number(process.env.GIAY || 180);
const xs = [];
for (let i = 0; i < GIAY; i++) {
  const t0 = Date.now();
  try { await fetch(GOC + '/auth/me'); xs.push(Date.now() - t0); }
  catch { xs.push(-1); }
  await new Promise((r) => setTimeout(r, 1000));
}
const ok = xs.filter((x) => x >= 0).sort((a, b) => a - b);
const p = (q) => ok[Math.floor(ok.length * q)];
console.log(`n=${xs.length} hỏng=${xs.filter((x) => x < 0).length}`);
console.log(`min=${ok[0]}ms  trung vị=${p(0.5)}ms  p90=${p(0.9)}ms  max=${ok[ok.length - 1]}ms`);
```

- [ ] **Step 2: Đo ĐƯỜNG NỀN (không build)**

Run: `cd backend && GIAY=120 node tmp/do-trong-luc-build.mjs`
Expected: p90 quanh 40–60 ms.

- [ ] **Step 3: Đo TRONG LÚC BUILD, chưa đụng gì**

Trên VPS (giờ vắng): `cd /root/kinhlacc && nohup bash deploy.sh > deploy.log 2>&1 &`
Cùng lúc, ở máy dev: `cd backend && GIAY=600 node tmp/do-trong-luc-build.mjs`
Expected: ghi lại p90 và max. **Đây là con số phải cải thiện.**

- [ ] **Step 4: Thử F3 — `renice` dockerd trong lúc build**

Trên VPS, sửa `deploy.sh`: trước nhóm lệnh `docker compose build` thêm
```bash
renice -n 19 -p $(pgrep -x dockerd) >/dev/null 2>&1 || true
```
và sau nhóm lệnh build:
```bash
renice -n 0 -p $(pgrep -x dockerd) >/dev/null 2>&1 || true
```

Chạy lại Step 3.

- [ ] **Step 5: ĐỌC SỐ rồi mới quyết**

- p90 trong lúc build **giảm rõ** (ví dụ 4.000 ms → dưới 500 ms) → **giữ F3**, commit sửa `deploy.sh`, ghi số đo vào spec.
- p90 **không đổi** → `nice` không lan tới BuildKit như spec đã ngờ. **Bỏ F3**, chuyển sang **F1** (build ở nơi khác, VPS chỉ `pull`) và mở một kế hoạch riêng cho nó. Trong lúc chờ, áp **F2**: chỉ deploy ngoài giờ phục vụ.

⚠️ **Không được giữ F3 khi số đo không ủng hộ nó** — một hàng rào không có tác dụng còn tệ hơn không có hàng rào, vì nó làm người ta tưởng đã an toàn.

- [ ] **Step 6: Ghi kết quả vào spec**

Cập nhật bảng F1/F2/F3 trong `docs/superpowers/specs/2026-10-10-dat-lich-chiu-mang-chap-design.md` với số đo thật, bỏ chữ "CHƯA ĐO".

- [ ] **Step 7: Commit**

```bash
git add backend/tmp/do-trong-luc-build.mjs docs/superpowers/specs/2026-10-10-dat-lich-chiu-mang-chap-design.md
git commit -m "perf(deploy): đo ảnh hưởng của build tới người dùng, chốt đường xử lý phần F"
```

---

## Việc KHÔNG nằm trong kế hoạch này, và lý do

| Việc | Vì sao bỏ |
|---|---|
| Thêm `ETag` cho `/huyet-vi`, `/nhht/cong-thuc` | **Đã chạy sẵn** — Express tự sinh, `If-None-Match` trả 304/0 byte (đo 10/10/2026) |
| Bật gzip | **Đã bật sẵn** cho mọi route API |
| Chống trùng lịch | Đã đủ: `UNIQUE(slotDate,slotTime)` + `ux_appt_booking_active` + `pessimistic_write` + khoá hai ca theo id tăng dần |
| Khoá chống lặp cho `close`/`open`/`complete` | Chúng đặt `status` về một giá trị cố định → gọi lại đã vô hại |
| Thêm `vitest` cho frontend | Phần logic đã tách thuần, `node --test` chạy thẳng `.ts` (Node 26) |
| Bật `$request_time` ở nginx | Đáng làm, nhưng là việc đo lường chứ không phải việc của đặt lịch — nên đi kèm phần F |
