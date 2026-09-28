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

describe('ThamDinhCmsService — đếm người dùng kết nối', () => {
  /**
   * Đo thật 29/09/2026: người duyệt bấm hai nút cách nhau hai giây, request đầu xong thì
   * `finally { dongKetNoi() }` đóng kết nối ngay dưới chân request thứ hai, và người kia
   * nhận "Internal server error · Chưa mở kết nối CMS".
   *
   * Thiết kế "mở vào ca, đóng hết ca" đúng cho ca soi chạy tuần tự nhưng sai cho API.
   * Đếm người dùng giữ được cả hai: vẫn MỘT kết nối (trần Aiven 20 slot), vẫn đóng khi
   * hết người, nhưng không đóng giữa chừng.
   */
  function svcGia() {
    const s = new ThamDinhCmsService({
      get: (k: string) =>
        ({ CMS_DB_HOST: 'h', CMS_DB_PORT: '1', CMS_DB_USER: 'u',
           CMS_DB_PASSWORD: 'p', CMS_DB_NAME: 'd' })[k],
    } as never);
    let daDong = 0;
    // Gắn sẵn một client giả: moKetNoi sẽ ping nó và thấy còn sống.
    (s as unknown as { client: unknown }).client = {
      query: () => Promise.resolve({ rows: [] }),
      end: () => {
        daDong += 1;
        return Promise.resolve();
      },
      on: () => undefined,
    };
    return { s, conSong: () => (s as unknown as { client: unknown }).client !== null,
             soLanDong: () => daDong };
  }

  it('hai người cùng dùng: người đầu đóng thì kết nối VẪN SỐNG cho người sau', async () => {
    const { s, conSong, soLanDong } = svcGia();
    await s.moKetNoi();
    await s.moKetNoi();

    await s.dongKetNoi();
    expect(conSong()).toBe(true);
    expect(soLanDong()).toBe(0);

    await s.dongKetNoi();
    expect(conSong()).toBe(false);
    expect(soLanDong()).toBe(1);
  });

  it('đóng nhiều hơn mở cũng không làm số đếm âm', async () => {
    const { s } = svcGia();
    await s.moKetNoi();
    await s.dongKetNoi();
    await s.dongKetNoi();
    await s.dongKetNoi();
    // Mở lại sau đó vẫn phải dùng được, không bị kẹt ở số đếm âm.
    (s as unknown as { client: unknown }).client = {
      query: () => Promise.resolve({ rows: [] }),
      end: () => Promise.resolve(),
      on: () => undefined,
    };
    await s.moKetNoi();
    await s.dongKetNoi();
    expect((s as unknown as { client: unknown }).client).toBeNull();
  });
});
