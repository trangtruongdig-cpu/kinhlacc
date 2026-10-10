import { docMocKhach } from './moc-khach.util';

describe('docMocKhach — mốc do MÁY KHÁCH khai, không tin tuyệt đối', () => {
  const bayGio = new Date('2026-10-09T12:03:35.000Z');

  it('nhận mốc ISO hợp lệ trong quá khứ gần', () => {
    expect(docMocKhach('2026-10-09T11:21:33.000Z', bayGio)).toEqual(
      new Date('2026-10-09T11:21:33.000Z'),
    );
  });

  it('bỏ mốc quá XA trong quá khứ — đồng hồ máy khách sai thì thà không có', () => {
    expect(docMocKhach('2026-09-01T00:00:00.000Z', bayGio)).toBeNull();
  });

  it('bỏ mốc ở TƯƠNG LAI quá 5 phút', () => {
    expect(docMocKhach('2026-10-09T13:00:00.000Z', bayGio)).toBeNull();
  });

  it('chấp nhận lệch nhỏ về tương lai (đồng hồ máy khách nhanh vài giây)', () => {
    expect(docMocKhach('2026-10-09T12:04:00.000Z', bayGio)).toEqual(
      new Date('2026-10-09T12:04:00.000Z'),
    );
  });

  it('bỏ chuỗi rác, chuỗi rỗng và undefined — không được ném lỗi', () => {
    expect(docMocKhach('hôm qua', bayGio)).toBeNull();
    expect(docMocKhach('', bayGio)).toBeNull();
    expect(docMocKhach(undefined, bayGio)).toBeNull();
  });
});
