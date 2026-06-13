/**
 * Khi GỌI dịch vụ NGOÀI (Yescale/OpenAI, Google Search Console…) bị lỗi, ĐỪNG "ném thẳng"
 * mã HTTP của họ về cho trình duyệt.
 *
 * Lý do: nếu nhà cung cấp trả 401/403 (key sai, hết hạn, hết credit, chưa cấp quyền) mà mình
 * relay nguyên 401, thì FRONTEND tưởng PHIÊN ĐĂNG NHẬP của người dùng hết hạn → xoá token và
 * đá ra /login một cách oan uổng (xem `frontend/src/services/api.ts`, nhánh `status === 401`).
 *
 * Quy tắc: lỗi của "cổng phụ" là lỗi 502 Bad Gateway của CHÍNH MÌNH. Vẫn giữ lại các mã 4xx/5xx
 * khác còn hữu ích (vd 429 = bị giới hạn tốc độ, 400 = body sai) nhưng KHÔNG BAO GIỜ để lọt
 * 401/403 — vì hai mã đó mới là thứ khiến frontend bắt đăng nhập lại.
 */
export function safeUpstreamStatus(raw: number | undefined | null): number {
  const s = typeof raw === 'number' ? raw : 0;
  if (s === 401 || s === 403 || s < 400 || s > 599) return 502; // 502 Bad Gateway
  return s;
}
