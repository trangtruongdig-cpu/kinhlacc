import { suaHinhThuc, chiKhacHinhThuc } from './tham-dinh-sua-hinh-thuc.util';

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
