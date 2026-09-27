import {
  thayTrongJson, doanKhacBiet, cacDoanKhacBiet, apTheoDoanKhacBiet,
} from './tham-dinh-ap-sua.util';

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

  /**
   * Ca THẬT làm lượt áp đầu tiên thất bại (27/09/2026): `rutChu` gộp khoảng trắng khi đưa
   * bài cho mô hình, nên trích dẫn mang khoảng trắng ĐÃ GỘP, còn span gốc thì giữ nguyên
   * xuống dòng và khoảng trắng đôi. Bản đầu chỉ khớp được khi cả span BẰNG trích dẫn, nên
   * mọi trích dẫn nằm giữa một span dài đều trả về 0 và không bản sửa nào áp được.
   */
  it('trích dẫn nằm GIỮA span dài và khoảng trắng lệch', () => {
    const goc = 'Mở đầu.  Nôn kèm\ntheo  có tiếng ( thức ăn) là Ẩu. Kết thúc.';
    const r = thayTrongJson(goc, 'Nôn kèm theo có tiếng ( thức ăn) là Ẩu.', 'Nôn kèm theo có tiếng (thức ăn) là Ẩu.');
    expect(r.soLanThay).toBe(1);
    expect(r.ketQua).toBe('Mở đầu.  Nôn kèm theo có tiếng (thức ăn) là Ẩu. Kết thúc.');
  });

  it('khớp thẳng thì GIỮ NGUYÊN khoảng trắng gốc, kể cả xuống dòng', () => {
    // Lượt một khớp thẳng nên xuống dòng sau đoạn thay vẫn còn — đó là điều mong muốn:
    // chỉ đoạn được sửa mới đổi, phần còn lại của span không bị chuẩn hoá theo.
    const r = thayTrongJson('AAA  giữa\n  BBB', 'giữa', 'GIỮA');
    expect(r.ketQua).toBe('AAA  GIỮA\n  BBB');
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

describe('doanKhacBiet', () => {
  it('bóc ra đúng đoạn khác nhau, bỏ tiền tố và hậu tố chung', () => {
    const d = doanKhacBiet('có vật ( thức ăn) là Ẩu', 'có vật (thức ăn) là Ẩu');
    expect(d).toEqual({ tim: '( thức', thay: '(thức' });
  });

  it('trích dẫn và bản sửa giống nhau → null', () => {
    expect(doanKhacBiet('abc', 'abc')).toBeNull();
  });

  it('đoạn khác biệt quá ngắn → null, thay một hai ký tự là quá mạo hiểm', () => {
    expect(doanKhacBiet('abc', 'abd')).toBeNull();
  });
});

describe('apTheoDoanKhacBiet', () => {
  /**
   * Ca THẬT (27/09/2026): trích dẫn 177 ký tự trải qua BỐN khối Portable Text vì `rutChu`
   * nối các khối bằng khoảng trắng — mô hình thấy chúng liền một câu. Không span nào chứa
   * trọn trích dẫn, nên thay cả trích dẫn là không bao giờ khớp.
   *
   * Nhưng đoạn KHÁC BIỆT thì nhỏ và nằm trong một span. Điều kiện an toàn: chỉ thay trong
   * span mà chữ của nó là ĐOẠN CON của trích dẫn — tức span đó đúng là phần bot đã đọc.
   * Cùng đoạn khác biệt xuất hiện ở span khác trong bài thì KHÔNG được đụng.
   */
  const trich = 'Sách Y Tông Kim Giám ghi: Nôn kèm theo có vật ( thức ăn) là Ẩu. Nôn có tiếng là Can ẩu.';
  const sua = 'Sách Y Tông Kim Giám ghi: Nôn kèm theo có vật (thức ăn) là Ẩu. Nôn có tiếng là Can ẩu.';

  function khoi(text: string) {
    return { _type: 'block', _key: 'k' + text.length, markDefs: [],
      children: [{ _type: 'span', _key: 's', text, marks: [] }] };
  }

  it('thay trong span THUỘC trích dẫn', () => {
    const j = [khoi('Sách Y Tông Kim Giám ghi:'), khoi('Nôn kèm theo có vật ( thức ăn) là Ẩu.')];
    const r = apTheoDoanKhacBiet(j, trich, sua);
    expect(r.soLanThay).toBe(1);
    const kq = r.ketQua as typeof j;
    expect(kq[1].children[0].text).toBe('Nôn kèm theo có vật (thức ăn) là Ẩu.');
  });

  it('KHÔNG đụng span ngoài trích dẫn dù chứa cùng đoạn khác biệt', () => {
    const j = [
      khoi('Nôn kèm theo có vật ( thức ăn) là Ẩu.'),
      khoi('Mùi chua do thương thực ( thức ăn tích trệ ).'),
    ];
    const r = apTheoDoanKhacBiet(j, trich, sua);
    expect(r.soLanThay).toBe(1);
    const kq = r.ketQua as typeof j;
    expect(kq[1].children[0].text).toBe('Mùi chua do thương thực ( thức ăn tích trệ ).');
  });

  it('không span nào thuộc trích dẫn → 0, để bên gọi huỷ giao dịch', () => {
    const r = apTheoDoanKhacBiet([khoi('Chuyện khác hoàn toàn.')], trich, sua);
    expect(r.soLanThay).toBe(0);
  });
});

describe('cacDoanKhacBiet', () => {
  /**
   * Ca thật: bản sửa vừa bỏ khoảng trắng trong "( thức ăn)" vừa thêm dấu chấm sau "Can ẩu",
   * cách nhau 60 ký tự. Lấy MỘT đoạn khác biệt thì nó phình ra trùm cả hai và xuyên nhiều
   * khối Portable Text — không span nào chứa nổi, và không bản sửa nào áp được.
   */
  it('tách hai thay đổi rải rác thành hai đoạn', () => {
    const a = 'có vật ( thức ăn) là Ẩu = nôn. Nôn không có vật là Can ẩu Nôn có vật là Thổ';
    const b = 'có vật (thức ăn) là Ẩu = nôn. Nôn không có vật là Can ẩu. Nôn có vật là Thổ';
    const d = cacDoanKhacBiet(a, b);
    expect(d.length).toBeGreaterThanOrEqual(2);
    expect(d.some((x) => x.tim.includes('thức') && x.thay.includes('(thức'))).toBe(true);
    expect(d.some((x) => x.thay.includes('ẩu.'))).toBe(true);
  });

  it('giống nhau → không đoạn nào', () => {
    expect(cacDoanKhacBiet('abc def', 'abc def')).toEqual([]);
  });
});
