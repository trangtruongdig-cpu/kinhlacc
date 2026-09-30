import {
  suaHinhThuc,
  chiKhacHinhThuc,
  sauKhiSuaConLoi,
} from './tham-dinh-sua-hinh-thuc.util';

describe('suaHinhThuc', () => {
  it('bỏ khoảng trắng thừa trước dấu câu', () => {
    expect(suaHinhThuc('Chủ trị : đau đầu , chóng mặt')).toBe('Chủ trị: đau đầu, chóng mặt');
  });

  it('thêm khoảng trắng sau dấu phẩy dính chữ', () => {
    expect(suaHinhThuc('3 lát,Táo 2 quả')).toBe('3 lát, Táo 2 quả');
  });

  it('bỏ khoảng trắng ngay sau ngoặc mở và trước ngoặc đóng', () => {
    expect(suaHinhThuc('nước ( trên 90% nước )')).toBe('nước (trên 90% nước)');
  });

  /** Dấu phẩy thập phân tiếng Việt: "0,5 thốn" phải giữ nguyên, không thành "0, 5". */
  it('KHÔNG đụng dấu phẩy thập phân', () => {
    expect(suaHinhThuc('Châm thẳng 0,5 – 1 thốn.')).toBe('Châm thẳng 0,5 – 1 thốn.');
  });

  /** TAB trong mục tham_khao là canh cột, không phải lỗi gõ — đã chốt ở phép dò. */
  it('KHÔNG đụng TAB trước dấu hai chấm', () => {
    expect(suaHinhThuc('Liệt Khuyết\t: thiên về giải Phế vệ.')).toBe('Liệt Khuyết\t: thiên về giải Phế vệ.');
  });

  /**
   * ⚠️ Dấu câu ĐÔI. Đo thật 30/09/2026: bản cũ biến "Tuyên phế,," thành "Tuyên phế, ,"
   * — xấu hơn bản gốc — và đã ghi như thế vào 20 mục trong kho. Lỗi lọt được vì
   * `chiKhacHinhThuc` bóc sạch dấu câu nên hai bên vẫn "giống nhau", và vì phép dò
   * `dau_cau_sai` chỉ hỏi "có sai không", không hỏi "sửa xong có đỡ hơn không".
   */
  it('gộp dấu phẩy đôi thành một', () => {
    expect(suaHinhThuc('Tuyên phế,, bình suyễn, thanh nhiệt.')).toBe(
      'Tuyên phế, bình suyễn, thanh nhiệt.',
    );
    expect(suaHinhThuc('Thanh nhiệt, trừ thấp,, ích khí.')).toBe('Thanh nhiệt, trừ thấp, ích khí.');
  });

  it('bỏ dấu phẩy đứng ngay trước dấu kết câu', () => {
    expect(suaHinhThuc('mặt cắt ngang không bằng phẳng, mầu trắng,.')).toBe(
      'mặt cắt ngang không bằng phẳng, mầu trắng.',
    );
    expect(suaHinhThuc('hòa dầu (mè, dừa, phộng,.')).toBe('hòa dầu (mè, dừa, phộng.');
  });

  it('gộp được cả khi hai dấu đã bị chen khoảng trắng', () => {
    // Đây chính là 20 mục đã ghi hỏng: lượt quét sau sẽ bắt lại chúng ở dạng này.
    expect(suaHinhThuc('Tuyên phế, , bình suyễn.')).toBe('Tuyên phế, bình suyễn.');
    expect(suaHinhThuc('mầu trắng, .')).toBe('mầu trắng.');
  });

  it('KHÔNG BAO GIỜ chen khoảng trắng vào giữa hai dấu câu', () => {
    // Bất biến: đầu ra không được chứa "dấu + khoảng trắng + dấu".
    for (const x of ['a,,b', 'a,.', 'a;;b', 'a,;b', 'a, ,b', 'phế,,bình']) {
      expect(suaHinhThuc(x)).not.toMatch(/[,;][ \u00a0]+[,;.!?]/);
    }
  });

  it('gộp dấu câu vẫn là đổi HÌNH THỨC, nên chặn cửa cho qua', () => {
    const goc = 'Tuyên phế,, bình suyễn.';
    expect(chiKhacHinhThuc(goc, suaHinhThuc(goc))).toBe(true);
  });

  it('câu đã sạch thì giữ nguyên từng ký tự', () => {
    const s = 'Đã trị 47 ca, khỏi hoàn toàn 41, có hiệu quả 5, không hiệu quả 1.';
    expect(suaHinhThuc(s)).toBe(s);
  });
});

describe('chiKhacHinhThuc', () => {
  /**
   * PHÉP KIỂM CHẶN CỬA của việc cho bot tự ghi vào kho.
   *
   * Bỏ hết khoảng trắng và dấu câu khỏi cả hai bản; phần chữ còn lại phải GIỐNG HỆT.
   * Khác một chữ nghĩa là bản sửa đang đụng vào NỘI DUNG, không phải hình thức — và nội
   * dung y học thì không bao giờ được sửa tự động.
   */
  it('chỉ khác khoảng trắng → cho qua', () => {
    expect(chiKhacHinhThuc('đau đầu , chóng mặt', 'đau đầu, chóng mặt')).toBe(true);
  });

  it('chỉ khác dấu câu → cho qua', () => {
    expect(chiKhacHinhThuc('Sắc uống ngày một thang', 'Sắc uống, ngày một thang.')).toBe(true);
  });

  it('THÊM một chữ → CHẶN', () => {
    expect(chiKhacHinhThuc('Sắc uống', 'Sắc uống ngày')).toBe(false);
  });

  it('BỚT một chữ → CHẶN', () => {
    expect(chiKhacHinhThuc('Bán hạ 6g Cam thảo', 'Bán hạ 6g')).toBe(false);
  });

  it('ĐỔI một chữ → CHẶN, kể cả chữ rất giống', () => {
    expect(chiKhacHinhThuc('trị đau lưng', 'trị đau lung')).toBe(false);
  });

  it('đổi CHỮ SỐ → CHẶN, vì liều lượng là nội dung', () => {
    expect(chiKhacHinhThuc('Bán hạ 6g', 'Bán hạ 8g')).toBe(false);
  });

  it('đổi hoa thường → CHẶN, vì tên huyệt và tạng phủ viết hoa có nghĩa', () => {
    expect(chiKhacHinhThuc('bổ Thận khí', 'bổ thận khí')).toBe(false);
  });

  it('bản sửa rỗng → CHẶN', () => {
    expect(chiKhacHinhThuc('có chữ', '')).toBe(false);
  });
});

/**
 * CỔNG CHẶN THỨ HAI, và là thứ làm cả một LỚP lỗi không tái diễn được.
 *
 * `chiKhacHinhThuc` chỉ hỏi "bản sửa có đụng vào chữ không". Nó KHÔNG hỏi "sửa xong có đỡ
 * hơn không" — nên bản biến ",," thành ", ," đi qua nó êm ru và ghi vào 20 mục thật.
 * Cổng này hỏi đúng câu còn thiếu: đem bản sửa cho chính phép dò xem lại, còn bắt được
 * thì chưa sửa xong, không được ghi.
 */
describe('sauKhiSuaConLoi', () => {
  it('bản sửa sạch thì cho qua', () => {
    expect(sauKhiSuaConLoi('Tuyên phế, bình suyễn, thanh nhiệt.')).toBe(false);
  });

  it('CHẶN đúng cái bản cũ từng ghi vào kho', () => {
    expect(sauKhiSuaConLoi('Tuyên phế, , bình suyễn.')).toBe(true);
    expect(sauKhiSuaConLoi('mầu trắng, .')).toBe(true);
  });

  it('chặn cả dạng bot không tự chữa nổi', () => {
    // "phộng,)" — gộp không ra, thêm cách cũng không ra. Người sửa tay thì đúng hơn.
    expect(sauKhiSuaConLoi('hòa dầu (mè, dừa, phộng,)')).toBe(true);
  });

  it('mọi bản do suaHinhThuc sinh ra từ ca thật đều qua được cổng', () => {
    for (const x of [
      'Tuyên phế,, bình suyễn, thanh nhiệt.',
      'Thanh nhiệt, trừ thấp,, ích khí.',
      'mặt cắt ngang không bằng phẳng, mầu trắng,.',
      'Chủ trị : đau đầu , chóng mặt',
      '3 lát,Táo 2 quả',
      'Châm thẳng 0,5 – 1 thốn.',
    ]) {
      expect(sauKhiSuaConLoi(suaHinhThuc(x))).toBe(false);
    }
  });
});
