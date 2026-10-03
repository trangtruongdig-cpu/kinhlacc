import { DoNhieuMau } from './da-mau.util';

describe('DoNhieuMau — thay cho 30 triệu phép so chuỗi', () => {
  it('khớp CHUỖI CON đúng như String.includes, kể cả mẫu là hậu tố của mẫu khác', () => {
    const mau = ['mat ngu', 'ngu', 'tieu chay', 'ho'];
    const d = new DoNhieuMau(mau);
    const chu = 'tri mat ngu va tieu chay';
    const thay = [...d.timTrong(chu)].sort();
    const thang = mau.map((m, i) => (chu.includes(m) ? i : -1)).filter((i) => i >= 0).sort();
    expect(thay).toEqual(thang);
    // "ngu" nằm trong "mat ngu" → phải bắt được cả hai.
    expect(thay).toContain(mau.indexOf('ngu'));
  });

  it('theoMau trả đúng tập văn bản chứa từng mẫu', () => {
    const mau = ['a', 'bc'];
    const d = new DoNhieuMau(mau);
    const ra = d.theoMau(['xax', 'bcd', 'abc', 'zzz']);
    expect([...ra[0]].sort()).toEqual([0, 2]);
    expect([...ra[1]].sort()).toEqual([1, 2]);
  });

  it('KẾT QUẢ GIỐNG HỆT bản quét thẳng tay trên dữ liệu ngẫu nhiên', () => {
    // Phép kiểm vàng: ngữ nghĩa phải trùng `includes`, vì đổi nó là lặng lẽ đổi mọi con số tháp.
    const tu = ['mat', 'ngu', 'tieu', 'chay', 'dau', 'lung', 'phong', 'han', 'nhiet', 'huyet'];
    const r = (n: number) => Array.from({ length: n }, () => tu[Math.floor(Math.random() * tu.length)]).join(' ');
    const mau = Array.from({ length: 40 }, () => r(1 + Math.floor(Math.random() * 2)));
    const chu = Array.from({ length: 200 }, () => r(8));
    const d = new DoNhieuMau(mau);
    const nhanh = d.theoMau(chu);
    mau.forEach((m, i) => {
      const thang = new Set(chu.map((c, j) => (c.includes(m) ? j : -1)).filter((j) => j >= 0));
      expect([...nhanh[i]].sort((a, b) => a - b)).toEqual([...thang].sort((a, b) => a - b));
    });
  });

  it('mẫu rỗng bị bỏ — nó khớp mọi văn bản nên không nói lên điều gì', () => {
    const d = new DoNhieuMau(['', 'ab']);
    expect(d.timTrong('zzz').size).toBe(0);
    expect([...d.timTrong('zabz')]).toEqual([1]);
  });

  it('nhanh hơn hẳn quét thẳng tay ở cỡ thật', () => {
    // Cỡ thật: ~2.200 khoá × 13.911 bài. Ở đây rút nhỏ 10 lần cho phép kiểm chạy nhanh.
    const mau = Array.from({ length: 220 }, (_, i) => `khoa${i} x`);
    const chu = Array.from({ length: 1400 }, (_, i) => `noi dung bai ${i} khoa${i % 220} x cuoi`);
    const t0 = Date.now();
    const ra = new DoNhieuMau(mau).theoMau(chu);
    const nhanh = Date.now() - t0;
    expect(ra.reduce((n, s) => n + s.size, 0)).toBeGreaterThan(0);
    const t1 = Date.now();
    for (const m of mau) chu.filter((c) => c.includes(m));
    expect(nhanh).toBeLessThanOrEqual(Math.max(50, Date.now() - t1));
  });
});
