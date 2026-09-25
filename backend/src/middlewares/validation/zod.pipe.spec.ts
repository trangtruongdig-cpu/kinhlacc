import { BadRequestException } from '@nestjs/common';
import { ZodPipe } from './zod.pipe';
import {
  createExaminationSchema,
  updateExaminationSchema,
  dangKyBenhNhanSchema,
  updatePatientSchema,
} from '../../models/validation.schema';

/** 24 ô đo hợp lệ, dùng làm nền cho các ca thử. */
const soDoDu = {
  tieutruongtrai: 10,
  tieutruongphai: 11,
  tamtrai: 9,
  tamphai: 10,
  tamtieutrai: 12,
  tamtieuphai: 11,
  tambaotrai: 8,
  tambaophai: 9,
  daitrangtrai: 13,
  daitrangphai: 12,
  phetrai: 10,
  phephai: 10,
  bangquangtrai: 14,
  bangquangphai: 13,
  thantrai: 9,
  thanphai: 8,
  damtrai: 11,
  damphai: 12,
  vitrai: 10,
  viphai: 11,
  cantrai: 9,
  canphai: 10,
  tytrai: 12,
  typhai: 11,
};

describe('ZodPipe + lược đồ phiếu đo', () => {
  const pipe = new ZodPipe(createExaminationSchema);

  it('nhận phiếu đo hợp lệ', () => {
    expect(pipe.transform({ patientId: 1, ...soDoDu })).toMatchObject({
      patientId: 1,
    });
  });

  it('CHẶN chuỗi lọt vào ô đo — trước đây chuỗi này đi thẳng vào phép tính', () => {
    expect(() =>
      pipe.transform({ patientId: 1, ...soDoDu, tytrai: '12' }),
    ).toThrow(BadRequestException);
  });

  it('CHẶN NaN/Infinity', () => {
    expect(() =>
      pipe.transform({ patientId: 1, ...soDoDu, tamtrai: NaN }),
    ).toThrow(BadRequestException);
    expect(() =>
      pipe.transform({ patientId: 1, ...soDoDu, tamtrai: Infinity }),
    ).toThrow(BadRequestException);
  });

  it('CHẶN thiếu ô đo (phiếu tạo mới phải đủ 24 ô)', () => {
    const thieu: Record<string, number> = { ...soDoDu };
    delete thieu.typhai;
    expect(() => pipe.transform({ patientId: 1, ...thieu })).toThrow(
      BadRequestException,
    );
  });

  it('CHẶN trường lạ — .strict() không cho khoá thừa lọt xuống repository.save()', () => {
    expect(() => pipe.transform({ patientId: 1, ...soDoDu, id: 999 })).toThrow(
      BadRequestException,
    );
  });

  it('CHẶN patientId âm / bằng 0', () => {
    expect(() => pipe.transform({ patientId: 0, ...soDoDu })).toThrow(
      BadRequestException,
    );
  });

  it('câu lỗi nêu đúng tên trường sai', () => {
    try {
      pipe.transform({ patientId: 1, ...soDoDu, damphai: -5 });
      fail('lẽ ra phải ném lỗi');
    } catch (e) {
      expect((e as BadRequestException).message).toContain('damphai');
    }
  });

  it('bản CẬP NHẬT cho phép gửi thiếu ô đo (sửa lẻ từng ô)', () => {
    const capNhat = new ZodPipe(updateExaminationSchema);
    expect(capNhat.transform({ tytrai: 12 })).toEqual({ tytrai: 12 });
  });
});

describe('Lược đồ đăng ký bệnh nhân', () => {
  const pipe = new ZodPipe(dangKyBenhNhanSchema);

  it('CHẶN mật khẩu RỖNG (không chặn mật khẩu ngắn — xem chú thích ở lược đồ)', () => {
    expect(() => pipe.transform({ phone: '0900000000', password: '' })).toThrow(
      BadRequestException,
    );
  });

  it('CHẶN thiếu số điện thoại', () => {
    expect(() => pipe.transform({ password: 'matkhaudu' })).toThrow(
      BadRequestException,
    );
  });

  it('cắt khoảng trắng thừa quanh số điện thoại', () => {
    expect(
      pipe.transform({ phone: ' 0900000000 ', password: 'matkhaudu' }),
    ).toMatchObject({
      phone: '0900000000',
    });
  });
});

/**
 * HỒI QUY: payload THẬT của các form đang chạy.
 *
 * Lược đồ bản đầu dùng `.optional()` cho ngày sinh — trong zod nghĩa là "chấp nhận
 * undefined", KHÔNG chấp nhận null. Hai form dưới đây cố tình gửi null cho ô bỏ trống, nên
 * lược đồ đó chặn đứng thao tác sửa hồ sơ của mọi bệnh nhân chưa nhập ngày sinh. Bài kiểm
 * này giữ đúng những thân request đó để lỗi ấy không quay lại.
 */
describe('Payload thật của form đang chạy phải lọt qua', () => {
  const pipe = new ZodPipe(updatePatientSchema);

  it('PatientDetailView "Sửa Thông Tin" — hồ sơ CHƯA có ngày sinh gửi dateOfBirth: null', () => {
    expect(() =>
      pipe.transform({
        fullName: 'Nguyễn Văn A',
        gender: 'Nam',
        dateOfBirth: null,
        timeOfBirth: '',
        address: 'Số 1, đường X',
        province: 'Hà Nội',
        phone: '0900000000',
        medicalHistory: '',
        notes: '',
      }),
    ).not.toThrow();
  });

  it('PatientProfileView của bệnh nhân — ô Năm sinh trống → formatDateForApi() trả null', () => {
    expect(() =>
      pipe.transform({
        fullName: 'Nguyễn Văn A',
        gender: 'Nam',
        dateOfBirth: null,
        address: 'Số 1, đường X',
        province: 'Hà Nội',
      }),
    ).not.toThrow();
  });

  it('mọi trường tuỳ chọn khác cũng nhận null (cùng một lớp lỗi)', () => {
    expect(() =>
      pipe.transform({
        timeOfBirth: null,
        address: null,
        province: null,
        phone: null,
        medicalHistory: null,
        notes: null,
        treatmentCourseStart: null,
        treatmentTarget: null,
      }),
    ).not.toThrow();
  });

  it('nới null KHÔNG làm mất tác dụng của .strict()', () => {
    expect(() => pipe.transform({ fullName: 'A', ten_la: 'x' })).toThrow(
      BadRequestException,
    );
  });

  it('nới null KHÔNG cho phép sai kiểu', () => {
    expect(() => pipe.transform({ treatmentTarget: 'ba mươi' })).toThrow(
      BadRequestException,
    );
  });

  it('đăng ký mật khẩu ngắn VẪN chạy được — giữ đúng hành vi trước khi có lược đồ', () => {
    const dangKy = new ZodPipe(dangKyBenhNhanSchema);
    expect(() =>
      dangKy.transform({ phone: '0900000000', password: '123' }),
    ).not.toThrow();
    expect(() =>
      dangKy.transform({ phone: '0900000000', password: '' }),
    ).toThrow(BadRequestException);
  });
});
