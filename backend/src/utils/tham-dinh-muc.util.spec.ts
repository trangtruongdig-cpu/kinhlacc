import { doMuc, doLienKet, dungChiMucTen, KHUNG_TRUONG, type MucKho } from './tham-dinh-muc.util';

function muc(bo: string, truong: Record<string, string>): MucKho {
  return { bo, ma: 'X1', slug: 'thu-nghiem', tieuDe: 'Mục thử', truong };
}

describe('KHUNG_TRUONG', () => {
  it('khai đủ 8 bộ của thư viện', () => {
    expect(Object.keys(KHUNG_TRUONG).sort()).toEqual(
      [
        'bai_thuoc', 'bai_viet', 'benh_hoc', 'cham_cuu_tri_benh',
        'duoc_lieu', 'huyet_vi', 'kinh_mach', 'nguon_y_van',
      ].sort(),
    );
  });

  it('trường cốt lõi luôn nằm trong danh sách trường thân bài', () => {
    for (const [bo, k] of Object.entries(KHUNG_TRUONG)) {
      for (const c of k.cotLoi) {
        expect(k.than).toContain(c);
      }
      expect(bo).toBeTruthy();
    }
  });
});

describe('doMuc — thiếu trường', () => {
  it('huyệt thiếu vi_tri là lỗi NẶNG (trường cốt lõi)', () => {
    const r = doMuc(muc('huyet_vi', { tac_dung: 'Sơ phong', vi_tri: '' }));
    const l = r.find((x) => x.kieu === 'thieu_truong_cot_loi' && x.truong === 'vi_tri');
    expect(l).toBeDefined();
    expect(l!.nang).toBe(true);
  });

  it('huyệt thiếu ghi_chu chỉ là lỗi thường', () => {
    const r = doMuc(muc('huyet_vi', { vi_tri: 'Chỗ lõm…', ghi_chu: '' }));
    const l = r.find((x) => x.truong === 'ghi_chu');
    expect(l!.kieu).toBe('thieu_truong');
    expect(l!.nang).toBe(false);
  });

  /**
   * Ca soi đọc cột theo `td_cau_hinh.cot_than` của CSDL, còn KHUNG_TRUONG là hằng số
   * trong mã. Hai danh sách có thể lệch nhau (đã lệch ở 4 bộ lúc viết kế hoạch). Phán
   * "thiếu" một cột chưa hề đọc là vu oan — và vu oan hàng nghìn lần trong một đêm.
   */
  it('KHÔNG phán thiếu với trường ca soi chưa đọc', () => {
    const r = doMuc(muc('huyet_vi', { vi_tri: 'Chỗ lõm' }));
    expect(r.find((x) => x.truong === 'ghi_chu')).toBeUndefined();
    expect(r.find((x) => x.truong === 'tac_dung')).toBeUndefined();
  });
});

describe('doMuc — trộn trường', () => {
  /**
   * Nợ đã ghi trong sổ tay: 7.129 phần tử trong thanh_phan thực ra là CÁCH DÙNG,
   * trên 6.491 bài; 4.140 bài có cach_dung TRỐNG vì nội dung bị nhét sang chỗ khác.
   * Bốc ngẫu nhiên một bài lúc khảo sát đã trúng ngay một ca.
   */
  it('bắt cách dùng bị nhét vào thành phần', () => {
    const r = doMuc(
      muc('bai_thuoc', {
        thanh_phan: 'Chích thảo 4g Đảng sâm 4g Trúc diệp 20g Sắc uống.',
        cach_dung: '',
      }),
    );
    const l = r.find((x) => x.kieu === 'tron_truong');
    expect(l).toBeDefined();
    expect(l!.trichDan).toContain('Sắc uống');
  });

  it('KHÔNG báo trộn khi cach_dung đã có nội dung riêng', () => {
    const r = doMuc(
      muc('bai_thuoc', {
        thanh_phan: 'Chích thảo 4g Đảng sâm 4g',
        cach_dung: 'Sắc uống ngày một thang.',
      }),
    );
    expect(r.find((x) => x.kieu === 'tron_truong')).toBeUndefined();
  });
});

describe('doMuc — chuyển tiếp lỗi chữ', () => {
  it('lỗi chữ trong một trường được gắn đúng tên trường', () => {
    const r = doMuc(muc('huyet_vi', { vi_tri: 'Ba·c hà nằm ở đây' }));
    const l = r.find((x) => x.kieu === 'dau_thanh_hong');
    expect(l!.truong).toBe('vi_tri');
  });
});

const CHI_MUC = dungChiMucTen([
  { bo: 'duoc_lieu', slug: 'cam-thao', tieuDe: 'Cam thảo' },
  { bo: 'duoc_lieu', slug: 'dang-sam', tieuDe: 'Đảng sâm' },
  { bo: 'duoc_lieu', slug: 'phuc-linh', tieuDe: 'Phục linh' },
  { bo: 'duoc_lieu', slug: 'truc-diep', tieuDe: 'Trúc diệp' },
  { bo: 'benh_hoc', slug: 'tang-tao', tieuDe: 'Tạng táo' },
]);

describe('dungChiMucTen', () => {
  it('khớp không cần dấu', () => {
    expect(CHI_MUC.khop('dang sam')!.slug).toBe('dang-sam');
  });

  it('khớp không phân biệt hoa thường và dấu câu', () => {
    expect(CHI_MUC.khop('CAM THẢO,')!.slug).toBe('cam-thao');
  });

  it('không khớp thì trả null, không đoán bừa', () => {
    expect(CHI_MUC.khop('hoàng kỳ')).toBeNull();
  });
});

describe('doLienKet', () => {
  /**
   * Ca thật bốc được lúc khảo sát: bài Trúc Nhự Thang IX. Thành phần ghi liền một dải,
   * mỗi vị đều có mục dược liệu riêng trong kho mà trang bài thuốc không nối sang.
   */
  it('nhận ra các vị nối được sang mục dược liệu', () => {
    const r = doLienKet(
      {
        bo: 'bai_thuoc', ma: 'X', slug: 'truc-nhu-thang-ix', tieuDe: 'Trúc Nhự Thang IX',
        truong: { thanh_phan: 'Chích thảo 4g Đảng sâm 4g Phục linh 4g Trúc diệp 20g' },
      },
      CHI_MUC,
    );
    const l = r.find((x) => x.kieu === 'lien_ket_dung_duoc');
    expect(l).toBeDefined();
    expect(l!.nhanXet).toContain('3');
  });

  it('nêu tên vị không khớp mục nào — sai chính tả hoặc kho thiếu vị', () => {
    const r = doLienKet(
      {
        bo: 'bai_thuoc', ma: 'X', slug: 'b', tieuDe: 'B',
        truong: { thanh_phan: 'Cam thảo 4g Hoàng kỳ 12g' },
      },
      CHI_MUC,
    );
    const l = r.find((x) => x.kieu === 'ten_vi_la');
    expect(l).toBeDefined();
    expect(l!.trichDan).toContain('Hoàng kỳ');
  });

  /**
   * Thành phần cổ phương hay kèm chú thích bào chế: "Bạch thược (sao rượu) 60g".
   * Để nguyên thì cụm "(sao" lọt vào danh sách "tên vị lạ", và cửa sổ quét còn ghép
   * nhầm "Bạch thược (sao" thành một tên — đo trên kho thật 26/09/2026.
   */
  it('bỏ chú thích bào chế trong ngoặc, không coi là tên vị', () => {
    const r = doLienKet(
      {
        bo: 'bai_thuoc', ma: 'X', slug: 'c', tieuDe: 'C',
        truong: { thanh_phan: 'Cam thảo (sao vàng) 4g Đảng sâm (bỏ lõi) 6g' },
      },
      CHI_MUC,
    );
    expect(r.find((x) => x.kieu === 'lien_ket_dung_duoc')!.trichDan).toContain('Cam thảo');
    expect(r.find((x) => x.kieu === 'ten_vi_la')).toBeUndefined();
  });

  it('không nhận nhầm chính mục đang xét làm liên kết', () => {
    const r = doLienKet(
      {
        bo: 'duoc_lieu', ma: 'X', slug: 'cam-thao', tieuDe: 'Cam thảo',
        truong: { chu_tri: 'Cam thảo dùng trị ho.' },
      },
      CHI_MUC,
    );
    expect(r.find((x) => x.kieu === 'lien_ket_dung_duoc')).toBeUndefined();
  });
});
