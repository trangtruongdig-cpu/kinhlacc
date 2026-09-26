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
