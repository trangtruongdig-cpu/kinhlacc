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
