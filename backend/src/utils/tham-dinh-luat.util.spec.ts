import {
  traDieu, apDungCho, doPhamViHanhNghe, LUAT_PHAM_VI_HANH_NGHE,
  type BoLuatVanPhong,
} from './tham-dinh-luat.util';

const BO: BoLuatVanPhong = {
  phienBan: 1,
  boApDung: ['huyet_vi', 'benh_hoc'],
  daDuyet: true,
  dieu: [
    { ma: 'BC1', truc: 'bo_cuc', noiDung: 'Mục huyệt mở đầu bằng câu định vị gọn.', viDu: 'Ở chỗ lõm…' },
    { ma: 'TN1', truc: 'thuat_ngu', noiDung: 'Một khái niệm chỉ gọi một tên trong cùng bài.', viDu: '' },
  ],
};

describe('traDieu', () => {
  it('tra được điều luật theo mã', () => {
    expect(traDieu(BO, 'BC1')!.truc).toBe('bo_cuc');
  });

  it('mã không có thật → null, để khâu lọc loại lời phê đó', () => {
    expect(traDieu(BO, 'KHONG-CO')).toBeNull();
  });

  it('không phân biệt hoa thường — mô hình hay trả về "bc1"', () => {
    expect(traDieu(BO, 'bc1')!.ma).toBe('BC1');
  });
});

describe('apDungCho', () => {
  it('bộ có khai thì áp dụng', () => {
    expect(apDungCho(BO, 'huyet_vi')).toBe(true);
  });

  it('bộ không khai thì KHÔNG áp dụng — thước của huyệt không đo được bài thuốc', () => {
    expect(apDungCho(BO, 'bai_thuoc')).toBe(false);
  });

  it('danh sách rỗng nghĩa là áp dụng cho mọi bộ', () => {
    expect(apDungCho({ ...BO, boApDung: [] }, 'bai_thuoc')).toBe(true);
  });
});

describe('doPhamViHanhNghe', () => {
  /**
   * Đã chốt trong sổ tay dự án: người dùng hành nghề Y sỹ, nội dung KHÔNG được hàm ý
   * "khám, chữa bệnh". Đây là luật cứng, không phải văn phong — nên nó là hằng số trong
   * mã chứ không nằm trong bộ luật rút từ mẫu, và không ai sửa nó qua màn duyệt được.
   */
  it('bắt chữ "bác sĩ" và nêu chữ thay', () => {
    const r = doPhamViHanhNghe('Bác sĩ sẽ khám cho bệnh nhân.');
    expect(r.find((x) => x.tu === 'bác sĩ')!.thay).toBe('thầy thuốc');
  });

  it('bắt chữ "phòng khám"', () => {
    expect(doPhamViHanhNghe('Đến phòng khám để đo.').map((x) => x.tu)).toContain('phòng khám');
  });

  it('bắt "khám bệnh" nhưng KHÔNG bắt chữ "khám" đứng trong "khám phá"', () => {
    expect(doPhamViHanhNghe('khám bệnh định kỳ').map((x) => x.tu)).toContain('khám bệnh');
    expect(doPhamViHanhNghe('khám phá cơ thể')).toEqual([]);
  });

  it('câu sạch thì không báo gì', () => {
    expect(doPhamViHanhNghe('Thầy thuốc đo kinh lạc tại phòng chẩn trị.')).toEqual([]);
  });

  it('LUAT_PHAM_VI_HANH_NGHE có mã cố định để lời phê quy chiếu được', () => {
    expect(LUAT_PHAM_VI_HANH_NGHE.ma).toBe('PV1');
    expect(LUAT_PHAM_VI_HANH_NGHE.truc).toBe('pham_vi_hanh_nghe');
  });
});
