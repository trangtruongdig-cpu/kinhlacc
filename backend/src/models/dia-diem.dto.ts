/** Kết quả tra cứu địa điểm đo: hành chính 2 cấp (tỉnh + xã/phường) và thời tiết tại chỗ. */
export class DiaDiemDto {
  /** Toạ độ đã dùng để tra cứu. */
  viDo: number;
  kinhDo: number;

  /** Tỉnh/Thành phố — tên trần, không kèm tiền tố "Tỉnh"/"Thành phố" (khớp dữ liệu patients.province đang có). */
  tinhThanh: string | null;
  /** Phường/Xã/Thị trấn/Đặc khu — cấp 2 của hành chính 2 cấp (từ 01/7/2025). */
  phuongXa: string | null;
  /** Địa chỉ gọn để điền vào hồ sơ: "số nhà đường, phường/xã". */
  diaChi: string | null;
  /** Chuỗi địa chỉ đầy đủ do dịch vụ trả về (để đối chiếu khi tách sai). */
  diaChiDayDu: string | null;

  /** Nhiệt độ môi trường (°C) tại thời điểm đo. */
  nhietDo: number | null;
  /** Độ ẩm tương đối (%). */
  doAm: number | null;
  /** Nhiệt độ cảm nhận (°C). */
  nhietDoCamNhan: number | null;
  /** Thời điểm của số liệu thời tiết (ISO, giờ VN). */
  thoiDiemThoiTiet: string | null;

  /** Phần nào lấy được / lỗi gì — để UI báo rõ thay vì im lặng. */
  loiDiaChi: string | null;
  loiThoiTiet: string | null;
}
