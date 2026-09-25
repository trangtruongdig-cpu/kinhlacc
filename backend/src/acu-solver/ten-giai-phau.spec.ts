/* eslint-disable @typescript-eslint/no-require-imports -- module đích là .cjs, không có bản ESM */
const boTra = require('./ten-giai-phau.cjs') as {
  traTen(
    ten: string,
  ): { conceptId: string; cach: 'thang' | 'khuVuc' | 'bang' } | null;
  traHuyet(code: string): {
    toDuoc: { ten: string; conceptId: string }[];
    khongCo: string[];
  };
  tenCuaConcept(id: string): string | null;
};
const giaiphaudata = require('./giai-phau-data.json') as {
  points: Record<string, { duoiDa?: string[] }>;
};
const traTen = (
  ten: string,
): {
  conceptId: string;
  cach: 'thang' | 'khuVuc' | 'bang';
} | null => boTra.traTen(ten);
const traHuyet = (
  code: string,
): {
  toDuoc: { ten: string; conceptId: string }[];
  khongCo: string[];
} => boTra.traHuyet(code);

describe('traTen', () => {
  it('khớp thẳng khi atlas có đúng tên đó', () => {
    // "Cơ ngực bé" là FMA13109 trong human-atlas-vi.js
    expect(traTen('cơ ngực bé')).toEqual({
      conceptId: 'FMA13109',
      cach: 'thang',
    });
  });

  it('khớp qua tiền tố "Khu vực" khi atlas chỉ có dạng vùng', () => {
    // atlas không có "Cơ ngực lớn" trần, chỉ có "Khu vực cơ ngực lớn" = FMA34686
    expect(traTen('cơ ngực lớn')).toEqual({
      conceptId: 'FMA34686',
      cach: 'khuVuc',
    });
  });

  it('trả null cho mô hình KHÔNG chứa, không được đoán bừa', () => {
    // mô hình là cơ–xương–mạch–thần kinh; không có cân, mạc, dây chằng
    // các mục dưới đây đã nằm sẵn trong bảng đồng nghĩa với giá trị null
    expect(traTen('dây chằng vàng')).toBeNull();
    expect(traTen('mạc ngang')).toBeNull();
  });

  it('trả null cho tên KHÔNG có trong bảng cũng KHÔNG có trong atlas', () => {
    // "cơ ngang gai" là tên thật trong giải phẫu từ điển nhưng:
    // - KHÔNG nằm trong bảng đồng nghĩa (ten-giai-phau-map.json)
    // - KHÔNG nằm trong atlas 3D (human-atlas-vi.js)
    // → nên phải trả null, KHÔNG được đoán theo fuzzy matching hay ký tự chữ cái
    expect(traTen('cơ ngang gai')).toBeNull();
  });

  it('khoá bảng được chuẩn hoá, nên viết hoa hay viết thường đều khớp', () => {
    // bảng có "cân cơ chéo ngoài" (viết thường) → null
    // gọi với "Cân Cơ Chéo Ngoài" (viết hoa) phải chuẩn hoá khoá rồi vẫn khớp bảng
    expect(traTen('Cân Cơ Chéo Ngoài')).toBeNull();
    // nếu khoá KHÔNG được chuẩn hoá, lời gọi này sẽ chạy vào nhánh khớp thẳng/khu vực,
    // có nguy hiểm trả nhầm mã FMA nếu atlas có tên tương tự với dạng hoa
  });

  it('không nhận nhầm bên trái/phải', () => {
    const r = traTen('cơ ngực bé');
    expect(r).not.toBeNull();
    const ten = boTra.tenCuaConcept(r!.conceptId);
    expect(ten).not.toMatch(/phải|trái/);
  });
});

describe('traHuyet', () => {
  it('tách được cấu trúc tô được và cấu trúc mô hình không có', () => {
    const r = traHuyet('LU1'); // duoiDa: cơ ngực lớn, cơ ngực bé, cơ răng lớn, cơ gian sườn 2
    expect(r.toDuoc.length).toBeGreaterThan(0);
    // bất biến: mọi thứ tô được phải nằm trong duoiDa của chính huyệt đó
    const goc = giaiphaudata.points['LU1'].duoiDa;
    for (const x of r.toDuoc) expect(goc).toContain(x.ten);
  });

  it('trả rỗng chứ không ném lỗi với huyệt không có mục giải phẫu', () => {
    expect(traHuyet('KHONG_CO_MA')).toEqual({ toDuoc: [], khongCo: [] });
  });
});
