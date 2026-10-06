import { khopTenNhuCau, boDau, tachTacDung, veCua, tyLeNguon, xepLoNguon } from './rada-ho-so.controller';

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

describe('khopTenNhuCau — đường DUY NHẤT đưa huyệt vào tháp', () => {
  it('khớp dãy từ liền nhau trong tên bệnh / tên phác đồ thật', () => {
    expect(khopTenNhuCau('đau lưng', 'Yêu thống (bệnh đau lưng)')).toBe(true);
    expect(khopTenNhuCau('tiêu chảy', 'Viêm ruột / Tiêu chảy / Kiết lỵ')).toBe(true);
    expect(khopTenNhuCau('cảm cúm', 'Bệnh Cảm Cúm')).toBe(true);
  });

  it('KHÔNG khớp khi chỉ trùng một phần từ — "ho" không phải "hô hấp"', () => {
    expect(khopTenNhuCau('ho', 'Bệnh hô hấp')).toBe(false);
    expect(khopTenNhuCau('', 'Bệnh Cảm Cúm')).toBe(false);
  });

  it('CHỦ TRỊ MỘT TỪ không bao giờ khớp — đây là luật chịu lực', () => {
    // Đo 03/10/2026: cho một từ khớp thì cụm "Ung nhọt, Lở loét & Da liễu" nhận 98 huyệt qua
    // đúng chủ trị "Phong" — khớp vào các phác đồ TRÚNG PHONG (tai biến). Bài da liễu sẽ mọc
    // ra một mục phương huyệt chữa tai biến mà không ai đọc lại để biết.
    expect(khopTenNhuCau('Phong', 'Trúng Phong (Kẹt Động Mạch Não)')).toBe(false);
    expect(khopTenNhuCau('Viêm', 'Viêm gan / Viêm túi mật / Sỏi mật')).toBe(false);
    expect(khopTenNhuCau('sốt', 'Sốt xuất huyết')).toBe(false);
    // Hai từ thì vẫn chạy — luật này không giết nhánh huyệt.
    expect(khopTenNhuCau('huyết ứ', 'Liệt Dây Thần Kinh Mặt - Thể Huyết ứ')).toBe(true);
    expect(khopTenNhuCau('Yêu Thống', 'Yêu thống (bệnh đau lưng)')).toBe(true);
  });

  it('các từ phải LIỀN NHAU và đúng thứ tự, không phải "có mặt đâu đó"', () => {
    expect(khopTenNhuCau('đau lưng', 'Đau đầu và mỏi lưng')).toBe(false);
    expect(khopTenNhuCau('lưng đau', 'Yêu thống (bệnh đau lưng)')).toBe(false);
  });

  it('bỏ dấu và dấu câu hai bên: "Tiêu Chảy" ≡ "tiêu-chảy"', () => {
    expect(khopTenNhuCau('Tiêu Chảy', 'viêm ruột, tiêu-chảy')).toBe(true);
  });
});

describe('rada-ho-so: sức khoẻ NỀN — xếp lỗ theo mức mỏng', () => {
  it('tỉ lệ tính đúng, và tổng = 0 KHÔNG được ra NaN', () => {
    // Bộ rỗng là chuyện thật (bảng chưa nạp), và NaN% trên màn thì người đọc không phân biệt
    // được với 0% — hai chuyện khác hẳn: "chưa có mục nào" vs "có mục mà không mục nào dẫn nguồn".
    expect(tyLeNguon({ co: 205, tong: 4085 }).pt).toBe(5);
    expect(tyLeNguon({ co: 0, tong: 0 }).pt).toBe(null);
    expect(tyLeNguon({ co: 0, tong: 0 }).chuaCoMuc).toBe(true);
    expect(tyLeNguon({ co: 0, tong: 10 }).chuaCoMuc).toBe(false);
  });

  it('xếp MỎNG NHẤT lên đầu — đó là chỗ đáng vá trước', () => {
    const ds = xepLoNguon({
      bai: { co: 13939, tong: 32197 },
      vi: { co: 205, tong: 4085 },
      huyet: { co: 433, tong: 1053 },
    });
    expect(ds[0].ma).toBe('vi');
    expect(ds[0].pt).toBe(5);
    expect(ds.map((x) => x.ma)).toEqual(['vi', 'huyet', 'bai']);
  });

  it('bộ CHƯA CÓ MỤC NÀO xếp CUỐI, không xếp đầu dù tỉ lệ là 0', () => {
    // 0/0 không phải "mỏng nhất" — nó là "chưa nạp dữ liệu". Xếp nó lên đầu là cử người đi vá
    // một bảng rỗng trong khi 4.085 vị thuốc thật đang thiếu nguồn.
    const ds = xepLoNguon({ bai: { co: 0, tong: 0 }, vi: { co: 205, tong: 4085 } });
    expect(ds[0].ma).toBe('vi');
    expect(ds[ds.length - 1].ma).toBe('bai');
  });

  it('bộ ĐẦY ĐỦ (100%) vẫn có trong danh sách, chỉ xuống cuối', () => {
    const ds = xepLoNguon({ bai: { co: 10, tong: 10 }, vi: { co: 1, tong: 10 } });
    expect(ds.map((x) => x.ma)).toEqual(['vi', 'bai']);
    expect(ds[1].pt).toBe(100);
  });
});
