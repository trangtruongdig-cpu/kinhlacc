/**
 * PHÉP KIỂM CHỐNG TRÔI giữa hai bản sao của thuật toán đo kinh lạc.
 *
 * Thuật toán tồn tại ở BA nơi (lib frontend, util backend, và bản riêng trong
 * MeridianResultsView.vue) — CLAUDE.md dặn phải sửa đồng thời, nhưng trước bài kiểm này
 * không có gì báo khi ai đó chỉ sửa một nơi. Ở đây chạy CẢ HAI bản trên cùng bộ số đo rồi
 * đối chiếu kết quả; lệch một chữ là đỏ.
 *
 * Bản trong .vue không import được từ đây (nằm trong Single File Component) nên vẫn phải
 * canh bằng mắt — xem ghi chú ở cuối file.
 */
import * as be from './meridian-analysis.util';
import * as fe from '../../../frontend/src/lib/meridianAnalysis';

/** Ca có lời giải in trong sách Lê Văn Sửu (bệnh nhân Lê Quang T.) — xem meridian-analysis.util.spec.ts. */
const CA_SACH: Record<string, number> = {
  tieutruongtrai: 34.0,
  tieutruongphai: 34.2,
  tamtrai: 34.4,
  tamphai: 35.0,
  tamtieutrai: 34.6,
  tamtieuphai: 35.2,
  tambaotrai: 35.0,
  tambaophai: 34.9,
  daitrangtrai: 34.8,
  daitrangphai: 35.0,
  phetrai: 34.5,
  phephai: 35.2,
  bangquangtrai: 33.0,
  bangquangphai: 34.0,
  damtrai: 33.5,
  damphai: 33.8,
  vitrai: 34.0,
  viphai: 34.2,
  thantrai: 33.2,
  thanphai: 33.6,
  cantrai: 33.4,
  canphai: 33.9,
  tytrai: 33.8,
  typhai: 34.1,
};

/**
 * Sinh số đo giả lập nhưng TẤT ĐỊNH (không random thật) để mỗi lần chạy cho cùng kết quả.
 *
 * `soMuc` là thứ quyết định bài kiểm có giá trị hay không: số đo rải mịn trên dải 32–37 °C
 * gần như không bao giờ tạo ra thế CÂN BẰNG (đúng 3 kinh hư / 3 kinh thịnh, tổng chênh bằng 0)
 * — mà chính những thế cân bằng đó mới là nơi các nhánh `>`/`>=` của thuật toán rẽ khác nhau.
 * Bản đầu của bài kiểm này rải mịn và KHÔNG bắt được lỗi khi cố tình đổi ngưỡng `huTrenCount > 3`
 * thành `> 2`. Hạ xuống vài mức thô (34,0 / 34,5 / 35,0…) thì các thế hoà xuất hiện dày đặc
 * và bài kiểm bắt được ngay.
 */
function caThu(hat: number, soMuc = 3): Record<string, number> {
  const ten = Object.keys(CA_SACH);
  const ra: Record<string, number> = {};
  let x = hat;
  for (const t of ten) {
    x = (x * 1103515245 + 12345) % 2147483648; // LCG cổ điển
    const muc = Math.floor((x / 2147483648) * soMuc);
    ra[t] = Math.round((33.5 + muc * 0.5) * 10) / 10; // 33,5 / 34,0 / 34,5 …
  }
  return ra;
}

/** Tên 12 ô chi trên (6 kinh × trái/phải) và 12 ô chi dưới, theo đúng thứ tự rawUpper/rawLower đọc. */
const O_TREN = [
  'tieutruongtrai',
  'tieutruongphai',
  'tamtrai',
  'tamphai',
  'tamtieutrai',
  'tamtieuphai',
  'tambaotrai',
  'tambaophai',
  'daitrangtrai',
  'daitrangphai',
  'phetrai',
  'phephai',
];
const O_DUOI = [
  'bangquangtrai',
  'bangquangphai',
  'damtrai',
  'damphai',
  'vitrai',
  'viphai',
  'thantrai',
  'thanphai',
  'cantrai',
  'canphai',
  'tytrai',
  'typhai',
];

/**
 * Ca ĐỐI XỨNG: `soHangThap` kinh nằm ở mức thấp, số còn lại ở mức cao, hai ô trái/phải bằng nhau.
 *
 * Đây là thứ mà sinh ngẫu nhiên gần như không bao giờ tạo ra: khi đúng 3 kinh thấp và 3 kinh cao
 * cách đều trung điểm thì tổng chênh lệch bằng 0 — đúng cái thế hoà mà các nhánh `>` / `>=`
 * của thuật toán rẽ khác nhau. Đo thực tế: 600 ca sinh ngẫu nhiên cho ra 0 ca chạm thế này.
 */
function caDoiXung(
  soHangThapTren: number,
  soHangThapDuoi: number,
  thap = 34.0,
  cao = 35.0,
) {
  const d: Record<string, number> = {};
  O_TREN.forEach(
    (t, i) => (d[t] = Math.floor(i / 2) < soHangThapTren ? thap : cao),
  );
  O_DUOI.forEach(
    (t, i) => (d[t] = Math.floor(i / 2) < soHangThapDuoi ? thap : cao),
  );
  return d;
}

/** Vài ca biên: chưa đo gì, đo một nửa, mọi kinh bằng nhau. */
const CA_BIEN: Array<[string, Record<string, number>]> = [
  [
    'chưa đo ô nào',
    Object.fromEntries(Object.keys(CA_SACH).map((t) => [t, 0])),
  ],
  [
    'chỉ đo chi trên',
    Object.fromEntries(
      Object.entries(CA_SACH).map(([t, v], i) => [t, i < 12 ? v : 0]),
    ),
  ],
  [
    'mọi kinh bằng nhau',
    Object.fromEntries(Object.keys(CA_SACH).map((t) => [t, 34.5])),
  ],
];

/**
 * Dựng đủ chuỗi rawUpper → calculateBounds → processRows rồi mới gọi computeDiagnosis.
 *
 * ⚠️ Bỏ qua processRows là đưa RawRow (chưa có `avg`) vào chỗ chờ ProcessedRow: mọi phép so
 * biến thành NaN, HAI bản cùng cho kết quả rác nên bài kiểm luôn xanh mà chẳng kiểm gì.
 * Bản nháp đầu của file này mắc đúng lỗi đó và không bắt được ngưỡng bị sửa lệch.
 */
function chanDoanHaiBan(d: Record<string, number>) {
  const beTho = { tren: be.rawUpper(d), duoi: be.rawLower(d) };
  const beSt = {
    tren: be.calculateBounds(beTho.tren),
    duoi: be.calculateBounds(beTho.duoi),
  };
  const feTho = { tren: fe.rawUpper(d), duoi: fe.rawLower(d) };
  const feSt = {
    tren: fe.calculateBounds(feTho.tren),
    duoi: fe.calculateBounds(feTho.duoi),
  };
  return {
    be: be.computeDiagnosis(
      d,
      be.processRows(beTho.tren, beSt.tren),
      be.processRows(beTho.duoi, beSt.duoi),
      beSt.tren,
      beSt.duoi,
    ),
    fe: fe.computeDiagnosis(
      d,
      fe.processRows(feTho.tren, feSt.tren),
      fe.processRows(feTho.duoi, feSt.duoi),
      feSt.tren,
      feSt.duoi,
    ),
  };
}

describe('Hai bản thuật toán phải cho CÙNG kết quả', () => {
  it('ca có lời giải in trong sách', () => {
    const { be: a, fe: b } = chanDoanHaiBan(CA_SACH);
    expect({
      amDuong: b.amDuong,
      khi: b.khi,
      huyet: b.huyet,
      huThuc: b.huThuc,
    }).toEqual({
      amDuong: a.amDuong,
      khi: a.khi,
      huyet: a.huyet,
      huThuc: a.huThuc,
    });
  });

  it.each(CA_BIEN)('ca biên: %s', (_ten, d) => {
    const { be: a, fe: b } = chanDoanHaiBan(d);
    expect([b.amDuong, b.khi, b.huyet, b.huThuc]).toEqual([
      a.amDuong,
      a.khi,
      a.huyet,
      a.huThuc,
    ]);
  });

  it('600 ca sinh tất định (nhiều độ thô) — chẩn đoán Bát Cương trùng khớp từng ca', () => {
    for (let hat = 1; hat <= 600; hat++) {
      const d = caThu(hat, 2 + (hat % 5)); // 2–6 mức: đủ dày thế hoà để chạm mọi nhánh rẽ
      const { be: a, fe: b } = chanDoanHaiBan(d);
      expect(`hạt ${hat}: ${b.amDuong}/${b.khi}/${b.huyet}/${b.huThuc}`).toBe(
        `hạt ${hat}: ${a.amDuong}/${a.khi}/${a.huyet}/${a.huThuc}`,
      );
    }
  });

  it('bảng tạng phủ bệnh (biểu/lý · hàn/nhiệt · bên) trùng khớp', () => {
    for (let hat = 1; hat <= 300; hat++) {
      const d = caThu(hat, 2 + (hat % 5));
      const beT = be.rawUpper(d),
        beD = be.rawLower(d);
      const beStT = be.calculateBounds(beT),
        beStD = be.calculateBounds(beD);
      const feT = fe.rawUpper(d),
        feD = fe.rawLower(d);
      const feStT = fe.calculateBounds(feT),
        feStD = fe.calculateBounds(feD);
      const a = be
        .computeAffectedOrgans(
          be.processRows(beT, beStT),
          be.processRows(beD, beStD),
          beStT,
          beStD,
        )
        .map((o) => `${o.organ}|${o.depth}|${o.temp}|${o.side}`);
      const b = fe
        .computeAffectedOrgans(
          fe.processRows(feT, feStT),
          fe.processRows(feD, feStD),
          feStT,
          feStD,
        )
        .map((o) => `${o.organ}|${o.depth}|${o.temp}|${o.side}`);
      expect(`hạt ${hat}: ${b.join(' ,, ')}`).toBe(
        `hạt ${hat}: ${a.join(' ,, ')}`,
      );
    }
  });

  it('49 ca ĐỐI XỨNG (0–6 kinh thấp ở mỗi chi) — nơi các nhánh rẽ sát nhau nhất', () => {
    for (let tren = 0; tren <= 6; tren++) {
      for (let duoi = 0; duoi <= 6; duoi++) {
        const d = caDoiXung(tren, duoi);
        const { be: a, fe: b } = chanDoanHaiBan(d);
        expect(
          `${tren}-${duoi}: ${b.amDuong}/${b.khi}/${b.huyet}/${b.huThuc}`,
        ).toBe(`${tren}-${duoi}: ${a.amDuong}/${a.khi}/${a.huyet}/${a.huThuc}`);
      }
    }
  });

  it('ngưỡng trên/dưới và dung sai của calculateBounds trùng khớp', () => {
    for (let hat = 1; hat <= 300; hat++) {
      const d = caThu(hat, 2 + (hat % 5));
      expect(fe.calculateBounds(fe.rawUpper(d))).toEqual(
        be.calculateBounds(be.rawUpper(d)),
      );
      expect(fe.calculateBounds(fe.rawLower(d))).toEqual(
        be.calculateBounds(be.rawLower(d)),
      );
    }
  });
});
