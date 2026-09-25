/* eslint-disable @typescript-eslint/no-var-requires */
const { traTen, traHuyet } = require('./ten-giai-phau.cjs');

describe('traTen', () => {
  it('khớp thẳng khi atlas có đúng tên đó', () => {
    // "Cơ ngực bé" là FMA13109 trong human-atlas-vi.js
    expect(traTen('cơ ngực bé')).toEqual({ conceptId: 'FMA13109', cach: 'thang' });
  });

  it('khớp qua tiền tố "Khu vực" khi atlas chỉ có dạng vùng', () => {
    // atlas không có "Cơ ngực lớn" trần, chỉ có "Khu vực cơ ngực lớn" = FMA34686
    expect(traTen('cơ ngực lớn')).toEqual({ conceptId: 'FMA34686', cach: 'khuVuc' });
  });

  it('trả null cho mô hình KHÔNG chứa, không được đoán bừa', () => {
    // mô hình là cơ–xương–mạch–thần kinh; không có cân, mạc, dây chằng
    expect(traTen('dây chằng vàng')).toBeNull();
    expect(traTen('mạc ngang')).toBeNull();
  });

  it('không nhận nhầm bên trái/phải', () => {
    const r = traTen('cơ ngực bé');
    expect(r).not.toBeNull();
    const ten = require('./ten-giai-phau.cjs').tenCuaConcept(r!.conceptId);
    expect(ten).not.toMatch(/phải|trái/);
  });
});

describe('traHuyet', () => {
  it('tách được cấu trúc tô được và cấu trúc mô hình không có', () => {
    const r = traHuyet('LU1'); // duoiDa: cơ ngực lớn, cơ ngực bé, cơ răng lớn, cơ gian sườn 2
    expect(r.toDuoc.length).toBeGreaterThan(0);
    // bất biến: mọi thứ tô được phải nằm trong duoiDa của chính huyệt đó
    const goc = require('./giai-phau-data.json').points['LU1'].duoiDa;
    for (const x of r.toDuoc) expect(goc).toContain(x.ten);
  });

  it('trả rỗng chứ không ném lỗi với huyệt không có mục giải phẫu', () => {
    expect(traHuyet('KHONG_CO_MA')).toEqual({ toDuoc: [], khongCo: [] });
  });
});
