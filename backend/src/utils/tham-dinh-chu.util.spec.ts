import { doChu } from './tham-dinh-chu.util';

/**
 * Sáu dạng rác di sản đến từ bộ đọc file .dat của app Windows cũ (trượt offset).
 * D5 (mojibake) và D6 (TCVN3) PHẢI dò riêng: mọi ký tự của chúng đều "hợp lệ"
 * nên phép kiểm tập ký tự không thấy gì. Đây là bài học đã trả giá một lần.
 */
describe('doChu — rác di sản', () => {
  it('bắt mojibake: UTF-8 bị đọc như Latin-1', () => {
    const loi = doChu('Triá»‡u chá»©ng: sốt cao');
    expect(loi.map((l) => l.ma)).toContain('mojibake');
  });

  it('bắt TCVN3: bảng mã font cũ chưa chuyển', () => {
    const loi = doChu('NguyÔn Ngäc Bich biên soạn');
    expect(loi.map((l) => l.ma)).toContain('tcvn3');
  });

  it('bắt dấu thanh hỏng — rác CHÍNH LÀ dấu thanh bị vỡ', () => {
    const loi = doChu('Ba·c hà tri· ho');
    expect(loi.map((l) => l.ma)).toContain('dau_thanh_hong');
  });

  it('bắt chữ Hán lẫn giữa câu tiếng Việt', () => {
    const loi = doChu('Tiêu痞 tán kết');
    expect(loi.map((l) => l.ma)).toContain('chu_han_chua_dich');
  });

  it('KHÔNG báo khi cả chuỗi là chữ Hán — đó là tên Hán hợp lệ', () => {
    expect(doChu('合谷').map((l) => l.ma)).not.toContain('chu_han_chua_dich');
  });

  it('bắt khoảng trắng thừa trước dấu câu', () => {
    const loi = doChu('Chủ trị : đau đầu , chóng mặt');
    expect(loi.map((l) => l.ma)).toContain('dau_cau_sai');
  });

  it('chuỗi sạch thì không báo gì', () => {
    expect(doChu('Hợp Cốc — huyệt Nguyên của kinh Thủ Dương minh Đại trường.')).toEqual([]);
  });

  it('trả về nguyên văn câu bị phê, không phải cả bài', () => {
    const loi = doChu('Câu sạch đứng trước. Câu hỏng Ba·c hà nằm giữa. Câu sạch đứng sau.');
    expect(loi[0].trichDan).toContain('Ba·c hà');
    expect(loi[0].trichDan).not.toContain('Câu sạch đứng trước');
  });
});

/**
 * Ba ca dưới đây đến từ lượt nghiệm thu đầu trên kho thật (26/09/2026, 50 huyệt): bản dò
 * đầu tiên báo 13 mục "tcvn3" và 34 mục "dau_cau_sai", và cả 47 đều là vu oan.
 *
 * Bài học: phép dò rác chạy trên 18.416 mục thì một mẫu quá rộng không cho ra "vài cảnh
 * báo thừa" — nó cho ra một cụm việc giả đứng đầu bảng, và người đọc mất lòng tin vào cả
 * bảng. Thà bỏ sót còn hơn.
 */
describe('doChu — chữ tiếng Việt hợp lệ, KHÔNG được báo', () => {
  it('"Ôn cứu" — Ô mở đầu từ là chữ Việt, không phải TCVN3', () => {
    expect(doChu('Ôn cứu 5 – 10 phút.').map((l) => l.ma)).not.toContain('tcvn3');
  });

  it('"Ôn Lưu (Đtr 7)" trong phối huyệt cũng vậy', () => {
    expect(doChu('Phối Lậu Cốc (Ty 7) + Ôn Lưu (Đtr 7) trị ruột sôi.').map((l) => l.ma))
      .not.toContain('tcvn3');
  });

  it('"0,5 thốn" — dấu phẩy thập phân, không phải lỗi dấu câu', () => {
    expect(doChu('Châm thẳng 0,5 – 1 thốn.').map((l) => l.ma)).not.toContain('dau_cau_sai');
  });

  it('nhưng dấu phẩy dính chữ thì vẫn bắt', () => {
    expect(doChu('Trị đau đầu,chóng mặt').map((l) => l.ma)).toContain('dau_cau_sai');
  });

  it('và dấu phẩy sau số mà dính CHỮ thì vẫn bắt', () => {
    expect(doChu('Cứu 3,Ôn châm 5 phút').map((l) => l.ma)).toContain('dau_cau_sai');
  });

  it('TAB trước dấu hai chấm là canh cột, không phải lỗi gõ', () => {
    // Mục tham_khao của huyệt vị trình bày dạng bảng: "Liệt Khuyết<TAB>: thiên về…".
    expect(doChu('Liệt Khuyết\t: thiên về giải Phế vệ.').map((l) => l.ma))
      .not.toContain('dau_cau_sai');
  });
});
