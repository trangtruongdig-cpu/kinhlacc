/**
 * Sửa lỗi HÌNH THỨC của chữ, và phép kiểm chặn cửa cho việc bot tự ghi vào kho.
 *
 * ⚠️ Đây là chỗ duy nhất trong cả bot được phép đổi nội dung mà KHÔNG có người bấm. Nên
 * ranh giới phải hẹp đến mức chứng minh được: chỉ khoảng trắng và dấu câu, không một chữ
 * nào khác. `chiKhacHinhThuc` là thứ giữ ranh giới đó.
 *
 * Bài học đứng sau: lúc bàn chuyện cho bot tự sửa, phép dò dấu câu đang vu oan 2.604 lượt
 * — câu "Đã trị 47 ca, khỏi hoàn toàn 41" viết đúng hoàn toàn mà vẫn bị bắt. Nếu tự sửa
 * mà không có phép kiểm này, 2.604 chỗ đúng đã thành sai và không ai đọc lại để biết.
 */

import { doChu } from './tham-dinh-chu.util';

/** Chỉ khoảng trắng NGANG. Tab là canh cột trong mục tham_khao, đừng đụng. */
const TRANG_NGANG = '[ \\u00a0]';

export function suaHinhThuc(s: string): string {
  if (typeof s !== 'string' || !s) return s;
  return (
    s
      // "đau đầu , chóng mặt" → "đau đầu, chóng mặt"
      .replace(new RegExp(`${TRANG_NGANG}+([,;:.!?])`, 'g'), '$1')
      // "Tuyên phế,," → "Tuyên phế,". Phải đứng TRƯỚC luật thêm khoảng trắng: bản cũ
      // không có bước này nên biến ",," thành ", ," — xấu hơn gốc, và đã ghi vào 20 mục.
      .replace(/([,;])[,;]+/g, '$1')
      // "mầu trắng,." → "mầu trắng." — dấu ngắt câu thắng dấu phẩy đứng trước nó.
      .replace(/[,;]+([.!?:])/g, '$1')
      // "3 lát,Táo" → "3 lát, Táo". Chừa dấu phẩy thập phân: chỉ thêm cách khi ký tự
      // trước KHÔNG phải chữ số, hoặc ký tự sau không phải chữ số.
      // ⚠️ Cả hai vế đều PHẢI loại dấu câu khỏi lookahead. Chen khoảng trắng vào giữa hai
      // dấu là sinh ra ", ," và ", ." — vừa không chữa được gì vừa qua được chặn cửa, vì
      // `chiKhacHinhThuc` bóc sạch dấu câu nên hai bản trông y như nhau.
      .replace(/(?<=\D)([,;])(?=[^\s,;:.!?)\]])/g, '$1 ')
      .replace(/(?<=\d)([,;])(?=[^\s\d,;:.!?)\]])/g, '$1 ')
      // "( trên 90% )" → "(trên 90%)"
      .replace(new RegExp(`\\(${TRANG_NGANG}+`, 'g'), '(')
      .replace(new RegExp(`${TRANG_NGANG}+\\)`, 'g'), ')')
  );
}

/**
 * Hai chuỗi có CHỈ khác nhau ở khoảng trắng và dấu câu không?
 *
 * Bỏ sạch khoảng trắng và dấu câu khỏi cả hai rồi so từng ký tự. Giữ nguyên hoa thường và
 * chữ số: ở kho này "bổ Thận khí" khác "bổ thận khí" (tạng phủ viết hoa có nghĩa), và
 * "6g" khác "8g" (liều lượng là nội dung, không phải hình thức).
 */
export function chiKhacHinhThuc(goc: string, sua: string): boolean {
  if (typeof goc !== 'string' || typeof sua !== 'string') return false;
  if (!sua.trim()) return false;
  const bocVo = (x: string) => x.replace(/[\s,;:.!?()[\]"'`–—-]/g, '');
  return bocVo(goc) === bocVo(sua) && bocVo(goc).length > 0;
}

/**
 * Bản sửa còn lỗi dấu câu không? — CỔNG CHẶN THỨ HAI trước khi bot ghi vào kho.
 *
 * Đem bản sửa cho CHÍNH phép dò đã bắt lỗi xem lại. Còn bắt được nghĩa là chưa sửa xong,
 * và bot không được ghi nửa vời rồi bảo là đã chữa.
 *
 * ⚠️ Vì sao cần cổng này khi đã có `chiKhacHinhThuc`: hai cổng hỏi hai câu khác nhau.
 * `chiKhacHinhThuc` hỏi "có đụng vào chữ không" — bản biến ",," thành ", ," trả lời KHÔNG
 * nên đi qua, rồi ghi vào 20 mục thật (đo 30/09/2026). Cổng này hỏi "sửa xong có đỡ hơn
 * không", là câu còn thiếu. Dùng lại `doChu` chứ không sao chép biểu thức: hai bản sao sẽ
 * lệch nhau, và lúc đó cổng lại gác một tiêu chí khác với phép dò.
 */
export function sauKhiSuaConLoi(sua: string): boolean {
  if (typeof sua !== 'string') return true;
  return doChu(sua).some((l) => l.ma === 'dau_cau_sai');
}
