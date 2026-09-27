import { thayTrongJson } from './tham-dinh-ap-sua.util';

describe('thayTrongJson', () => {
  /**
   * `de_xuat` của bot là CHỮ THUẦN (rutChu đã bóc định dạng), còn cột ec_* là JSONB
   * Portable Text. Ghi đè cả cột là xoá sạch cấu trúc khối và mọi định dạng — nên phép áp
   * phải THAY TẠI CHỖ: tìm span chứa trích dẫn, thay đúng đoạn đó, giữ nguyên phần còn lại.
   */
  it('thay trong span của Portable Text, giữ nguyên cấu trúc khối', () => {
    const pt = [
      { _type: 'block', _key: 'k1', style: 'normal', markDefs: [],
        children: [{ _type: 'span', _key: 'k2', text: 'Câu sai ở đây. Câu khác.', marks: [] }] },
    ];
    const r = thayTrongJson(pt, 'Câu sai ở đây.', 'Câu đã sửa.');
    expect(r.soLanThay).toBe(1);
    const kq = r.ketQua as typeof pt;
    expect(kq[0].children[0].text).toBe('Câu đã sửa. Câu khác.');
    expect(kq[0]._key).toBe('k1');
    expect(kq[0].children[0]._type).toBe('span');
  });

  it('thay trong mảng chuỗi phẳng', () => {
    const r = thayTrongJson(['Bổ khí', 'Câu sai'], 'Câu sai', 'Câu đúng');
    expect(r.ketQua).toEqual(['Bổ khí', 'Câu đúng']);
    expect(r.soLanThay).toBe(1);
  });

  it('thay trong chuỗi trần', () => {
    expect(thayTrongJson('abc def', 'def', 'xyz').ketQua).toBe('abc xyz');
  });

  it('không tìm thấy → soLanThay 0 và giá trị KHÔNG đổi', () => {
    const goc = { a: 'xin chào' };
    const r = thayTrongJson(goc, 'không có', 'gì cả');
    expect(r.soLanThay).toBe(0);
    expect(r.ketQua).toEqual(goc);
  });

  it('khớp kể cả khi trích dẫn khác khoảng trắng — mô hình hay đổi xuống dòng thành cách', () => {
    const r = thayTrongJson('Một  câu\nnhiều khoảng', 'Một câu nhiều khoảng', 'Gọn');
    expect(r.soLanThay).toBe(1);
    expect(r.ketQua).toBe('Gọn');
  });

  it('xuất hiện nhiều chỗ thì thay HẾT — bỏ sót một chỗ là để lại nửa lỗi', () => {
    const r = thayTrongJson(['Lỗi', 'giữa', 'Lỗi'], 'Lỗi', 'Sửa');
    expect(r.soLanThay).toBe(2);
    expect(r.ketQua).toEqual(['Sửa', 'giữa', 'Sửa']);
  });

  it('không đụng khoá kỹ thuật dù giá trị trùng', () => {
    const pt = [{ _type: 'block', _key: 'abc', children: [{ _type: 'span', text: 'abc xyz' }] }];
    const r = thayTrongJson(pt, 'abc', 'ABC');
    const kq = r.ketQua as Array<{ _key: string; children: Array<{ text: string }> }>;
    expect(kq[0]._key).toBe('abc');
    expect(kq[0].children[0].text).toBe('ABC xyz');
    expect(r.soLanThay).toBe(1);
  });

  it('trích dẫn rỗng → không làm gì, tránh thay vào mọi chỗ', () => {
    expect(thayTrongJson('abc', '', 'x').soLanThay).toBe(0);
  });

  it('null và số giữ nguyên', () => {
    expect(thayTrongJson(null, 'a', 'b').ketQua).toBeNull();
    expect(thayTrongJson({ n: 5 }, 'a', 'b').ketQua).toEqual({ n: 5 });
  });
});
