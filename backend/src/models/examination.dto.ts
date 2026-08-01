export class CreateExaminationDto {
  patientId: number;
  notes?: string;

  /** Thời điểm khám thực tế (ISO). Bỏ trống thì lấy lúc lưu. */
  thoiDiemKham?: string | null;

  /** Bối cảnh môi trường + địa điểm lúc đo (frontend lấy tự động từ GPS; đều không bắt buộc). */
  nhietDoMoiTruong?: number | null;
  doAmMoiTruong?: number | null;
  tinhThanh?: string | null;
  phuongXa?: string | null;
  viDo?: number | null;
  kinhDo?: number | null;

  tieutruongtrai: number;
  tieutruongphai: number;
  tamtrai: number;
  tamphai: number;
  tamtieutrai: number;
  tamtieuphai: number;
  tambaotrai: number;
  tambaophai: number;
  daitrangtrai: number;
  daitrangphai: number;
  phetrai: number;
  phephai: number;
  bangquangtrai: number;
  bangquangphai: number;
  thantrai: number;
  thanphai: number;
  damtrai: number;
  damphai: number;
  vitrai: number;
  viphai: number;
  cantrai: number;
  canphai: number;
  tytrai: number;
  typhai: number;
}

export class UpdateExaminationDto {
  patientId?: number;
  notes?: string;

  /** Bỏ qua field nào không gửi; gửi rồi thì ghi đè. */
  thoiDiemKham?: string | null;
  nhietDoMoiTruong?: number | null;
  doAmMoiTruong?: number | null;
  tinhThanh?: string | null;
  phuongXa?: string | null;
  viDo?: number | null;
  kinhDo?: number | null;

  tieutruongtrai?: number;
  tieutruongphai?: number;
  tamtrai?: number;
  tamphai?: number;
  tamtieutrai?: number;
  tamtieuphai?: number;
  tambaotrai?: number;
  tambaophai?: number;
  daitrangtrai?: number;
  daitrangphai?: number;
  phetrai?: number;
  phephai?: number;
  bangquangtrai?: number;
  bangquangphai?: number;
  thantrai?: number;
  thanphai?: number;
  damtrai?: number;
  damphai?: number;
  vitrai?: number;
  viphai?: number;
  cantrai?: number;
  canphai?: number;
  tytrai?: number;
  typhai?: number;
}
