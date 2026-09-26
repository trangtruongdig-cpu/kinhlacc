import { rutChu } from './tham-dinh-rut-chu.util';

/**
 * Bốn hình dữ liệu JSON có thật trong kho, đã đo 26/09/2026.
 *
 * Hàm `td_chu()` của CSDL chỉ nhặt khoá `text` (nó viết cho Portable Text), nên hình thứ
 * tư — MẢNG OBJECT — nó trả về rỗng mà không báo lỗi gì. Cột `ec_bai_thuoc.thanh_phan`
 * đúng là hình đó: 13.889 bài có dữ liệu, td_chu rút ra 0. Dùng thẳng td_chu thì bot
 * phán "thiếu thành phần" cho gần 14.000 bài thuốc — cụm giả lớn nhất bảng.
 */
describe('rutChu', () => {
  it('chuỗi trần → chính nó', () => {
    expect(rutChu('Kiện Tỳ, lợi thấp.')).toBe('Kiện Tỳ, lợi thấp.');
  });

  it('mảng chuỗi phẳng → nối bằng khoảng trắng', () => {
    expect(rutChu(['Bổ khí', 'kiện Tỳ'])).toBe('Bổ khí kiện Tỳ');
  });

  it('Portable Text → nhặt các span text theo thứ tự', () => {
    const pt = [
      { _type: 'block', _key: 'k1', style: 'normal', markDefs: [],
        children: [{ _type: 'span', _key: 'k2', text: 'Tư Thận Âm,', marks: [] },
                   { _type: 'span', _key: 'k3', text: ' tráng Dương.', marks: [] }] },
    ];
    expect(rutChu(pt)).toBe('Tư Thận Âm, tráng Dương.');
  });

  it('MẢNG OBJECT (thành phần bài thuốc) → nhặt được tên và liều', () => {
    const tp = [
      { id: 145, ten: 'Bán hạ', lieu: '6g' },
      { id: null, ten: 'Quan quế', lieu: '4g' },
    ];
    const ra = rutChu(tp);
    expect(ra).toContain('Bán hạ');
    expect(ra).toContain('6g');
    expect(ra).toContain('Quan quế');
  });

  it('bỏ khoá kỹ thuật, không để _type/_key lọt vào chữ', () => {
    const ra = rutChu([{ _type: 'block', _key: 'k9', style: 'normal', ten: 'Cam thảo' }]);
    expect(ra).toBe('Cam thảo');
  });

  it('null, undefined, mảng rỗng → chuỗi rỗng', () => {
    expect(rutChu(null)).toBe('');
    expect(rutChu(undefined)).toBe('');
    expect(rutChu([])).toBe('');
  });

  it('số giữ nguyên giá trị, không thành rỗng', () => {
    expect(rutChu([{ ten: 'Sinh khương', lieu: 3 }])).toContain('3');
  });

  it('không trả về chuỗi chỉ gồm khoảng trắng — đó là thứ làm bẫy im lặng', () => {
    expect(rutChu([{ id: 1 }, { id: 2 }])).toBe('');
  });
});
