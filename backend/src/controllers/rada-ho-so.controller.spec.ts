import { boDau, tachTacDung, veCua } from './rada-ho-so.controller';

describe('rada-ho-so: tách pháp trị khỏi chứng trạng', () => {
  it('tách được câu y văn thường gặp', () => {
    const r = tachTacDung('Lương huyết, chỉ huyết. Trị bên trên có nhiệt, chảy máu cam');
    expect(r.phap).toBe('Lương huyết, chỉ huyết');
    expect(r.chung).toBe('Trị bên trên có nhiệt, chảy máu cam');
  });

  /**
   * CHỐT CHỐNG TÁI DIỄN. Bản thử đầu dùng /\bTrị\b/ và bảng thể bệnh ra RỖNG mà không lỗi nào:
   * trong JS `\w` = [A-Za-z0-9_], "ị" không phải `\w` nên `\bTrị\b` KHÔNG BAO GIỜ khớp.
   * Nếu ai đó "dọn" regex về dạng có \b, phép kiểm này phải đỏ.
   */
  it('KHÔNG được quay lại \\b: mọi dạng chữ Việt có dấu đều phải tách được', () => {
    expect(/\bTrị\b/u.test('Lương huyết. Trị chảy máu cam')).toBe(false); // vì sao phải tránh \b
    for (const [cau, phap] of [
      ['Dưỡng âm, thanh nhiệt. Trị âm hư, phát sốt', 'Dưỡng âm, thanh nhiệt'],
      ['Giáng vị, bình can; Trị can uất khí nghịch', 'Giáng vị, bình can'],
      ['Kiện tỳ, phục mạch, Chữa xuất huyết do tỳ vị hư', 'Kiện tỳ, phục mạch'],
      ['Thanh nhiệt. Dùng cho người huyết nhiệt', 'Thanh nhiệt'],
    ] as [string, string][]) {
      expect(tachTacDung(cau).phap).toBe(phap);
    }
  });

  it('câu không có mốc "Trị" thì coi là chứng trạng, không bịa ra pháp trị', () => {
    const r = tachTacDung('Chảy máu cam kéo dài ở người cao tuổi');
    expect(r.phap).toBe('');
    expect(r.chung).toBe('Chảy máu cam kéo dài ở người cao tuổi');
  });

  it('không ném với đầu vào rỗng hoặc không phải chuỗi', () => {
    for (const x of [null, undefined, '', 123, {}]) expect(() => tachTacDung(x as unknown)).not.toThrow();
  });
});

describe('rada-ho-so: vế pháp trị', () => {
  it('tách theo vế để gom thể bệnh, bỏ vế quá ngắn', () => {
    expect(veCua('Dưỡng âm, thanh nhiệt')).toEqual(['duong am', 'thanh nhiet']);
    expect(veCua('Bổ khí, bổ')).toEqual(['bo khi']); // "bo" dưới 4 ký tự
  });

  it('cùng pháp trị viết khác thứ tự cho cùng tập vế', () => {
    expect(veCua('Thanh nhiệt, lương huyết').sort()).toEqual(veCua('Lương huyết, thanh nhiệt').sort());
  });
});

describe('rada-ho-so: chuẩn hoá', () => {
  it('bỏ dấu và đ/Đ, gộp khoảng trắng', () => {
    expect(boDau('  Chảy   Máu  Cam ')).toBe('chay mau cam');
    expect(boDau('Đương quy')).toBe('duong quy');
  });

  /** Từ vựng Đông y và tiếng Việt hiện đại là HAI khoá khác nhau — đây là lý do hồ sơ cụm
   *  bắt buộc nhận mảng biến thể chứ không nhận một từ. */
  it('"nục huyết" và "chảy máu cam" KHÔNG tự khớp nhau', () => {
    expect(boDau('nục huyết')).not.toBe(boDau('chảy máu cam'));
  });
});
