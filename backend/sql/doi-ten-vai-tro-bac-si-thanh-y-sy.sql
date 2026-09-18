-- Đổi NHÃN hiển thị của vai trò `bac_si` thành "Y Sỹ".
--
-- Vì sao cần chạy tay: VaiTroController.ensureDefaults() chỉ INSERT khi thiếu bản ghi
-- (`if (!existed) save(...)`), không bao giờ UPDATE. Sửa hằng số trong mã nguồn chỉ có
-- tác dụng với cơ sở dữ liệu trắng; DB đang chạy vẫn giữ nguyên "Bác Sĩ" cho tới khi
-- câu lệnh này được chạy.
--
-- Cột `ma` GIỮ NGUYÊN 'bac_si': mã này là khoá logic, được so trong guard phân quyền và
-- trong `trangCho` của từng tài khoản. Đổi mã sẽ làm rơi quyền của mọi tài khoản đang gắn
-- vai trò đó. Chỉ đổi phần người dùng NHÌN THẤY.
--
-- Chạy lại nhiều lần vô hại (idempotent).

UPDATE vai_tro
SET ten   = 'Y Sỹ',
    "moTa" = 'Đo kinh lạc, chẩn trị, tra cứu chuyên môn (không quản lý tài khoản).'
WHERE ma = 'bac_si';

-- Kiểm chứng: phải trả về đúng 1 dòng, ten = 'Y Sỹ'.
-- SELECT ma, ten, "moTa" FROM vai_tro WHERE ma = 'bac_si';
