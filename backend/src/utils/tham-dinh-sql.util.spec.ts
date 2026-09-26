import { cauUpsertHoSo, cauChenNhanXet } from './tham-dinh-sql.util';
import type { HoSoMuc } from '../models/tham-dinh.dto';

function hs(bo: string, ma: string): HoSoMuc {
  return {
    bo, ma, slug: `s-${ma}`, tieuDe: `T ${ma}`, vanTayNoiDung: 'abc',
    diemSach: 90, diemMachLac: null, diemDuPhan: 50, diemLienKet: null, diemSeo: null,
    hang: 'tam_duoc', uuTien: 3,
    soiMayLuc: null, soiThayThuocLuc: null, soiSeoLuc: null,
  };
}

/**
 * Vì sao phải ghi theo LÔ, đo thật 26/09/2026: RTT tới cụm Aiven là 88ms. Ghi lẻ từng
 * mục tốn 8 lượt đi-về (1 upsert + 1 delete + ~6 chèn nhận xét) = ~0,7 giây một mục,
 * tức **3 giờ** cho 18.416 mục. Kế hoạch dự tính "vài phút" — lệch 40 lần.
 * Gộp một lô 200 mục xuống còn 3 lượt đi-về đưa cả ca về dưới một phút.
 */
describe('cauUpsertHoSo', () => {
  it('một câu cho cả lô, mỗi hồ sơ 9 tham số', () => {
    const { sql, thamSo } = cauUpsertHoSo([hs('huyet_vi', 'a'), hs('huyet_vi', 'b')])!;
    expect(thamSo).toHaveLength(18);
    expect(sql).toMatch(/\(\$1,\$2,\$3,\$4,\$5,\$6,\$7,\$8,\$9, now\(\), now\(\)\)/);
    expect(sql).toMatch(/\(\$10,\$11,\$12,\$13,\$14,\$15,\$16,\$17,\$18, now\(\), now\(\)\)/);
  });

  it('giữ ON CONFLICT (bo, ma) và trả về đủ khoá để ghép id', () => {
    const { sql } = cauUpsertHoSo([hs('huyet_vi', 'a')])!;
    expect(sql).toMatch(/ON CONFLICT \(bo, ma\) DO UPDATE/i);
    expect(sql).toMatch(/RETURNING id, bo, ma/i);
  });

  /**
   * Postgres từ chối cả câu với "ON CONFLICT DO UPDATE command cannot affect row a
   * second time" nếu một lô chứa hai dòng cùng khoá. Một lô hỏng là mất trắng 200 mục.
   */
  it('khử trùng khoá (bo, ma) trong lô — giữ bản CUỐI', () => {
    const a = hs('huyet_vi', 'x');
    const b = { ...hs('huyet_vi', 'x'), diemSach: 10 };
    const { thamSo } = cauUpsertHoSo([a, b])!;
    expect(thamSo).toHaveLength(9);
    expect(thamSo[5]).toBe(10);
  });

  it('lô rỗng → không có câu nào', () => {
    expect(cauUpsertHoSo([])).toBeNull();
  });
});

describe('cauChenNhanXet', () => {
  const nx = (hoSoId: number, kieu: string) => ({
    hoSoId, kieu, truong: 'vi_tri', trichDan: 'x', nhanXet: 'y', nang: false,
  });

  it('một câu cho cả lô, mỗi nhận xét 6 tham số', () => {
    const r = cauChenNhanXet([nx(1, 'a'), nx(2, 'b')])!;
    expect(r.thamSo).toHaveLength(12);
    expect(r.sql).toMatch(/VALUES \(\$1,'may',\$2,\$3,\$4,\$5,\$6\), \(\$7,'may',\$8,\$9,\$10,\$11,\$12\)/);
  });

  it('cắt trích dẫn ở 2000 ký tự', () => {
    const r = cauChenNhanXet([{ ...nx(1, 'a'), trichDan: 'z'.repeat(5000) }])!;
    expect((r.thamSo[3] as string).length).toBe(2000);
  });

  it('lô rỗng → null, để bên gọi khỏi bắn một truy vấn thừa', () => {
    expect(cauChenNhanXet([])).toBeNull();
  });
});
