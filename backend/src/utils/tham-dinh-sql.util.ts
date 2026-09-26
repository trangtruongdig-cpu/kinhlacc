import type { HoSoMuc } from '../models/tham-dinh.dto';

/**
 * Dựng câu ghi THEO LÔ cho bệnh án.
 *
 * ⚠️ VÌ SAO LÔ: RTT tới cụm Aiven đo được 88ms (26/09/2026). Ghi lẻ từng mục tốn 8 lượt
 * đi-về (1 upsert + 1 xoá + ~6 chèn nhận xét) ≈ 0,7 giây một mục, tức **3 giờ** cho
 * 18.416 mục — kế hoạch dự tính "vài phút", lệch 40 lần. Một lô 200 mục gói lại còn 3
 * lượt đi-về, và cả ca về dưới một phút.
 *
 * Hai hàm dưới đây thuần: chúng dựng chuỗi + mảng tham số, không chạm database, nên test
 * được mà không cần kết nối.
 */

export interface NhanXetGhi {
  hoSoId: number;
  kieu: string;
  truong: string | null;
  trichDan: string;
  nhanXet: string;
  nang: boolean;
}

/** Trích dẫn dài hơn ngần này thì cắt — cột là TEXT nhưng bảng để người đọc, không để chứa cả bài. */
const TRAN_TRICH_DAN = 2000;

export function cauUpsertHoSo(
  ds: HoSoMuc[],
): { sql: string; thamSo: unknown[] } | null {
  // Khử trùng khoá trong lô, giữ bản CUỐI. Postgres từ chối CẢ CÂU với "ON CONFLICT DO
  // UPDATE command cannot affect row a second time" nếu một lô chứa hai dòng cùng khoá —
  // và một lô hỏng là mất trắng 200 mục.
  const theoKhoa = new Map<string, HoSoMuc>();
  for (const h of ds) theoKhoa.set(`${h.bo}\u0001${h.ma}`, h);
  const loc = [...theoKhoa.values()];
  if (!loc.length) return null;

  const thamSo: unknown[] = [];
  const nhom = loc.map((h) => {
    const i = thamSo.length;
    thamSo.push(h.bo, h.ma, h.slug, h.tieuDe, h.vanTayNoiDung, h.diemSach,
                h.diemDuPhan, h.hang, h.uuTien);
    const p = Array.from({ length: 9 }, (_, k) => `$${i + k + 1}`).join(',');
    return `(${p}, now(), now())`;
  });

  const sql =
    `INSERT INTO td_ho_so (bo, ma, slug, tieu_de, van_tay_noi_dung, diem_sach,
                           diem_du_phan, hang, uu_tien, soi_may_luc, updated_at)
     VALUES ${nhom.join(', ')}
     ON CONFLICT (bo, ma) DO UPDATE SET
       slug = EXCLUDED.slug, tieu_de = EXCLUDED.tieu_de,
       van_tay_noi_dung = EXCLUDED.van_tay_noi_dung, diem_sach = EXCLUDED.diem_sach,
       diem_du_phan = EXCLUDED.diem_du_phan, hang = EXCLUDED.hang,
       uu_tien = EXCLUDED.uu_tien, soi_may_luc = now(), updated_at = now()
     RETURNING id, bo, ma`;

  return { sql, thamSo };
}

export function cauChenNhanXet(
  ds: NhanXetGhi[],
): { sql: string; thamSo: unknown[] } | null {
  if (!ds.length) return null;

  const thamSo: unknown[] = [];
  const nhom = ds.map((n) => {
    const i = thamSo.length;
    thamSo.push(n.hoSoId, n.kieu, n.truong, n.trichDan.slice(0, TRAN_TRICH_DAN),
                n.nhanXet, n.nang);
    return `($${i + 1},'may',$${i + 2},$${i + 3},$${i + 4},$${i + 5},$${i + 6})`;
  });

  const sql =
    `INSERT INTO td_nhan_xet (ho_so_id, lop, kieu, truong, trich_dan, nhan_xet, nang) ` +
    `VALUES ${nhom.join(', ')}`;

  return { sql, thamSo };
}
