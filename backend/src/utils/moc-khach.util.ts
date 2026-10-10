/** Quá khứ xa hơn ngần này thì coi như đồng hồ máy khách sai, không nhận. */
const LUI_TOI_DA_MS = 24 * 60 * 60 * 1000;
/** Đồng hồ máy khách nhanh hơn ngần này thì cũng không nhận. */
const TOI_TOI_DA_MS = 5 * 60 * 1000;

/**
 * Mốc thời điểm lỗi do MÁY KHÁCH khai. Không tin tuyệt đối — chỉ nhận khi nằm trong một cửa sổ
 * hợp lý quanh giờ máy chủ.
 *
 * Vì sao cần: `baoSuCo.ts` gom tín hiệu vào hàng đợi, nên khi mất mạng thì mọi lỗi tới máy chủ
 * dồn về mốc HỒI MẠNG. Không có cột này thì không cách nào biết lỗi thật sự xảy ra lúc nào, và
 * một phiên đã vì thế kết luận nhầm là "mất kết nối 42 phút" (xem spec 10/10/2026) — trong khi
 * `msTroi` của chính request hỏng chỉ là 387 ms.
 */
export function docMocKhach(iso: string | undefined, bayGio: Date): Date | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  const lech = bayGio.getTime() - t;
  if (lech > LUI_TOI_DA_MS) return null;
  if (lech < -TOI_TOI_DA_MS) return null;
  return new Date(t);
}
