import { z } from 'zod';

/**
 * Lược đồ kiểm đầu vào cho các endpoint ĐỘNG TỚI NGƯỜI BỆNH.
 *
 * Nguyên tắc đặt ràng buộc: chỉ chặn thứ chắc chắn sai (chuỗi lọt vào ô số, NaN/Infinity,
 * trường thừa, chuỗi dài bất thường), KHÔNG siết theo dải "trông có vẻ hợp lý" của số đo —
 * dải thật thuộc về chuyên môn và phải đo trên dữ liệu thật trước khi thu hẹp.
 */

/** Một ô đo kinh lạc. Trần 1000 chỉ để chặn giá trị rác/tràn số, không phải ngưỡng lâm sàng. */
const oDo = z
  .number({ invalid_type_error: 'phải là số' })
  .finite('không được là NaN/Infinity')
  .min(0, 'không được âm')
  .max(1000, 'lớn bất thường, kiểm lại số nhập');

/** 24 ô đo: 12 đường kinh × trái/phải. Tên khớp AnalyzeInputDto. */
const TEN_O_DO = [
  'tieutruongtrai',
  'tieutruongphai',
  'tamtrai',
  'tamphai',
  'tamtieutrai',
  'tamtieuphai',
  'tambaotrai',
  'tambaophai',
  'daitrangtrai',
  'daitrangphai',
  'phetrai',
  'phephai',
  'bangquangtrai',
  'bangquangphai',
  'thantrai',
  'thanphai',
  'damtrai',
  'damphai',
  'vitrai',
  'viphai',
  'cantrai',
  'canphai',
  'tytrai',
  'typhai',
] as const;

const oDoBatBuoc = Object.fromEntries(TEN_O_DO.map((t) => [t, oDo])) as Record<
  (typeof TEN_O_DO)[number],
  typeof oDo
>;
const oDoTuyChon = Object.fromEntries(
  TEN_O_DO.map((t) => [t, oDo.optional()]),
) as Record<(typeof TEN_O_DO)[number], z.ZodOptional<typeof oDo>>;

/** Bối cảnh đo — đều không bắt buộc, cho phép null để xoá giá trị cũ. */
const boiCanhDo = {
  notes: z.string().max(5000).nullable().optional(),
  thoiDiemKham: z.string().max(40).nullable().optional(),
  nhietDoMoiTruong: z.number().finite().min(-50).max(80).nullable().optional(),
  doAmMoiTruong: z.number().finite().min(0).max(100).nullable().optional(),
  tinhThanh: z.string().max(120).nullable().optional(),
  phuongXa: z.string().max(120).nullable().optional(),
  viDo: z.number().finite().min(-90).max(90).nullable().optional(),
  kinhDo: z.number().finite().min(-180).max(180).nullable().optional(),
};

export const createExaminationSchema = z
  .object({
    patientId: z.number().int().positive('phải là id bệnh nhân hợp lệ'),
    ...boiCanhDo,
    ...oDoBatBuoc,
  })
  .strict();

export const updateExaminationSchema = z
  .object({
    patientId: z.number().int().positive().optional(),
    ...boiCanhDo,
    ...oDoTuyChon,
  })
  .strict();

/**
 * Hồ sơ bệnh nhân. Giới hạn độ dài khớp cột varchar trong models/patient.model.ts.
 *
 * ⚠️ Mọi trường tuỳ chọn ở đây đều phải `.nullable()`, KHÔNG chỉ `.optional()`.
 * Trong zod, `.optional()` chỉ chấp nhận `undefined` — gửi `null` là bị chặn. Mà các form
 * đang chạy CỐ TÌNH gửi null cho ô bỏ trống: PatientDetailView.vue gửi
 * `dateOfBirth: editForm.value.dateOfBirth || null`, còn PatientProfileView.vue dùng
 * `formatDateForApi()` trả null khi ô rỗng. Backend cũng cố ý nhận null —
 * `normalizePatientDto()` (patient.controller.ts) biến chuỗi rỗng thành null vì cột `date`
 * của Postgres không nhận chuỗi rỗng.
 *
 * Thiếu `.nullable()` ở đây chặn đứng thao tác sửa hồ sơ của MỌI bệnh nhân chưa nhập ngày
 * sinh — mà hồ sơ kiểu đó là bình thường: form tạo mới không bắt buộc ngày sinh.
 */
const truongBenhNhan = {
  fullName: z.string().trim().min(1, 'không được để trống').max(200),
  gender: z.string().trim().max(20),
  dateOfBirth: z.string().max(40).nullable().optional(),
  timeOfBirth: z.string().max(40).nullable().optional(),
  address: z.string().max(500).nullable().optional(),
  province: z.string().max(120).nullable().optional(),
  phone: z.string().trim().max(20).nullable().optional(),
  medicalHistory: z.string().max(5000).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  treatmentTarget: z.number().int().min(0).max(1000).nullable().optional(),
  treatmentCourseStart: z.string().max(40).nullable().optional(),
};

export const createPatientSchema = z.object(truongBenhNhan).strict();
export const updatePatientSchema = z
  .object({
    ...truongBenhNhan,
    fullName: truongBenhNhan.fullName.optional(),
    gender: truongBenhNhan.gender.optional(),
  })
  .strict();

/** Đăng nhập nhân viên. Không đặt trần độ dài mật khẩu quá chặt, nhưng phải chặn thân rỗng. */
export const dangNhapNhanVienSchema = z
  .object({
    username: z.string().trim().min(1, 'không được để trống').max(100),
    password: z.string().min(1, 'không được để trống').max(200),
  })
  .strict();

/** Đăng nhập / đăng ký bệnh nhân bằng số điện thoại. */
export const dangNhapBenhNhanSchema = z
  .object({
    phone: z.string().trim().min(1, 'không được để trống').max(20),
    password: z.string().min(1, 'không được để trống').max(200),
  })
  .strict();

/**
 * Đăng ký bệnh nhân.
 *
 * ⚠️ `password` cố ý CHỈ yêu cầu không rỗng, dù mức tối thiểu 6 ký tự sẽ an toàn hơn.
 * Lý do: trước khi có lược đồ này backend chỉ kiểm `!phone || !password`, nên tài khoản mật
 * khẩu ngắn vẫn đăng ký được, và form PatientRegisterView.vue không kiểm độ dài lẫn không
 * báo trước yêu cầu nào. Siết ở riêng server sẽ khiến bệnh nhân bấm Đăng ký rồi nhận lỗi 400
 * mà không hiểu vì sao.
 *
 * Muốn nâng lên `min(6)` thì sửa ĐỒNG THỜI: thêm kiểm độ dài + dòng nhắc trong
 * PatientRegisterView.vue, rồi mới siết ở đây — đó là quyết định về sản phẩm, không phải thứ
 * lén kèm vào một đợt vá bảo mật.
 */
export const dangKyBenhNhanSchema = z
  .object({
    phone: z.string().trim().min(1, 'không được để trống').max(20),
    password: z.string().min(1, 'không được để trống').max(200),
    fullName: z
      .string()
      .trim()
      .min(1, 'không được để trống')
      .max(200)
      .nullable()
      .optional(),
    dateOfBirth: z.string().max(40).nullable().optional(),
    gender: z.string().max(20).nullable().optional(),
  })
  .strict();
