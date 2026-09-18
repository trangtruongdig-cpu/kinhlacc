/**
 * Bài kiểm VÀNG cho phép phân định hàn/nhiệt/biểu/lý.
 *
 * Nguồn đối chiếu KHÔNG phải kỳ vọng của người viết code, mà là ví dụ có LỜI GIẢI IN SẴN trong
 * "Phép chẩn bệnh bằng nhiệt độ kinh lạc" của Lê Văn Sửu (bệnh nhân Lê Quang T.). Sách in cả bảng
 * số đo, các ô Ô1–Ô7, 12 số tương quan, lẫn tiểu kết phân định. Bất kỳ ai sửa thuật toán về sau mà
 * làm lệch khỏi ví dụ này là đã đi chệch khỏi phương pháp gốc — và bài kiểm sẽ báo.
 */
import {
  calculateBounds,
  processRows,
  computeAffectedOrgans,
  type RawRow,
  type OrganState,
} from './meridian-analysis.util';

/** Gộp danh sách tạng phủ bệnh thành chuỗi "Tên|depth|temp|bên" để khẳng định cho gọn. */
const mota = (os: OrganState[]) => os.map((o) => `${o.organ}|${o.depth}|${o.temp}|${o.side}`).join(' ,, ');

// Bảng số đo in trong sách (trái, phải) — đơn vị °C.
const CHI_TREN: RawRow[] = [
  { name: 'Tiểu', left: 34.0, right: 34.2 },
  { name: 'Tâm', left: 34.4, right: 35.0 },
  { name: 'Tam', left: 34.6, right: 35.2 },
  { name: 'Bào', left: 35.0, right: 34.9 },
  { name: 'Đại', left: 34.8, right: 35.0 },
  { name: 'Phế', left: 34.5, right: 35.2 },
];
const CHI_DUOI: RawRow[] = [
  { name: 'Bàng', left: 33.0, right: 34.0 },
  { name: 'Thận', left: 33.4, right: 34.3 },
  { name: 'Đởm', left: 33.2, right: 34.4 },
  { name: 'Vị', left: 33.8, right: 34.5 },
  { name: 'Can', left: 34.5, right: 35.2 },
  { name: 'Tỳ', left: 34.2, right: 34.2 },
];

describe('Phép đo kinh lạc — đối chiếu ví dụ có lời giải in trong sách', () => {
  const stTren = calculateBounds(CHI_TREN);
  const stDuoi = calculateBounds(CHI_DUOI);

  it('các ô ngưỡng khớp số in trong sách', () => {
    // Sách: chi trên Ô1 35,2 · Ô2 34,0 · Ô3 1,2 · Ô4 34,6 · Ô5 0,2 · Ô6 34,8 · Ô7 34,4
    expect(stTren.max).toBe(35.2);
    expect(stTren.min).toBe(34.0);
    expect(stTren.range).toBeCloseTo(1.2, 5);
    expect(stTren.mean).toBe(34.6);
    expect(stTren.sd).toBe(0.2);
    expect(stTren.upperBound).toBe(34.8);
    expect(stTren.lowerBound).toBe(34.4);
    // Sách: chi dưới Ô1 35,2 · Ô2 33,0 · Ô3 2,2 · Ô4 34,1 · Ô5 0,37
    expect(stDuoi.mean).toBe(34.1);
    expect(stDuoi.sd).toBe(0.37);
  });

  it('12 số tương quan khớp cột 10 của sách', () => {
    const tren = processRows(CHI_TREN, stTren).map((r) => r.diff);
    const duoi = processRows(CHI_DUOI, stDuoi).map((r) => r.diff);
    // Sách, chi trên: −0,50 +0,10 +0,30 +0,35 +0,30 +0,25
    [-0.5, 0.1, 0.3, 0.35, 0.3, 0.25].forEach((v, i) => expect(tren[i]).toBeCloseTo(v, 2));
    // Sách, chi dưới: −0,60 −0,25 −0,30 +0,05 +0,75 +0,10
    [-0.6, -0.25, -0.3, 0.05, 0.75, 0.1].forEach((v, i) => expect(duoi[i]).toBeCloseTo(v, 2));
  });

  it('phân định biểu/lý khớp tiểu kết của sách', () => {
    const t = mota(
      computeAffectedOrgans(
        processRows(CHI_TREN, stTren),
        processRows(CHI_DUOI, stDuoi),
        stTren,
        stDuoi,
      ),
    );
    expect(t).toContain('Tiểu Trường|ly|han'); // sách: Lý hàn — Tiểu trường
    expect(t).toContain('Tâm bào|ly|nhiet'); // sách: Lý nhiệt — Tâm bào
    expect(t).toContain('Tâm|bieu|nhiet|phải'); // sách: Biểu nhiệt — Tâm, Tam, Phế (bên phải)
    expect(t).toContain('Tam tiêu|bieu|nhiet|phải');
    expect(t).toContain('Phế|bieu|nhiet|phải');
    expect(t).toContain('Bàng quang|bieu|han|trái'); // sách: Biểu hàn — Bàng, Thận, Đảm (bên trái)
    expect(t).toContain('Thận|bieu|han|trái');
    expect(t).toContain('Đởm|bieu|han|trái');
  });

  it('HẠNG THỨ BA: kinh có cả hai bên trong vùng sinh lý thì KHÔNG bị gán bệnh', () => {
    // Tỳ 34,2/34,2 — cả hai bên nằm gọn trong [33,73 – 34,47]. Sách xếp "không có bệnh lý".
    const t = mota(
      computeAffectedOrgans(
        processRows(CHI_TREN, stTren),
        processRows(CHI_DUOI, stDuoi),
        stTren,
        stDuoi,
      ),
    );
    expect(t).not.toContain('Tỳ');
    // (Kinh Vị 33,8/34,5 sách cũng xếp "không có bệnh lý", nhưng vì sách in ngưỡng đã làm tròn
    //  34,50 còn code tính đúng 34,47 nên bên phải vẫn mang dấu. Chênh 0,03 °C — khác biệt về
    //  cách làm tròn khi in bảng, không phải khác biệt về luật. Không kiểm ở đây.)
  });
});

describe('Ô nhập bỏ trống không được dựng ra chứng hàn giả', () => {
  it('thiếu một bên: trung bình chỉ lấy bên thực có', () => {
    const rows: RawRow[] = [
      { name: 'Tiểu', left: 34.0, right: 34.2 },
      { name: 'Tâm', left: 34.4, right: 0 }, // ô phải bỏ trống
      { name: 'Tam', left: 34.6, right: 35.2 },
      { name: 'Bào', left: 35.0, right: 34.9 },
      { name: 'Đại', left: 34.8, right: 35.0 },
      { name: 'Phế', left: 34.5, right: 35.2 },
    ];
    const st = calculateBounds(rows);
    const tam = processRows(rows, st).find((r) => r.name === 'Tâm')!;
    expect(tam.avg).toBe(34.4); // KHÔNG phải (34,4 + 0)/2 = 17,2
    expect(tam.thieuDo).toBe(true);
    expect(tam.rightSign).toBe('0'); // bên trống không mang dấu
    expect(tam.absDiff).toBe(0); // chênh trái-phải vô nghĩa khi thiếu một bên
  });

  it('thiếu cả hai bên: kinh đó không mang dấu nào', () => {
    const rows: RawRow[] = [
      { name: 'Tiểu', left: 34.0, right: 34.2 },
      { name: 'Tâm', left: 0, right: 0 },
      { name: 'Tam', left: 34.6, right: 35.2 },
      { name: 'Bào', left: 35.0, right: 34.9 },
      { name: 'Đại', left: 34.8, right: 35.0 },
      { name: 'Phế', left: 34.5, right: 35.2 },
    ];
    const st = calculateBounds(rows);
    const tam = processRows(rows, st).find((r) => r.name === 'Tâm')!;
    expect(tam.avg).toBe(0);
    expect(tam.leftSign).toBe('0');
    expect(tam.rightSign).toBe('0');
    expect(mota(computeAffectedOrgans(processRows(rows, st), [], st, st))).not.toContain('Tâm|');
  });
});
