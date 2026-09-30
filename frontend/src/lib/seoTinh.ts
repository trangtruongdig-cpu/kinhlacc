/**
 * seoTinh — Trang có đang hiện đúng HTML TĨNH của chính đường này không?
 *
 * Các trang từ điển (bài thuốc, dược liệu, danh sách) có <head> dựng sẵn lúc build: tiêu đề
 * vừa 60 ký tự, mô tả đã chuẩn hoá, và chữ người biên tập sửa tay trong ô SEO của CMS. Trước
 * 30/09/2026 các view ghi đè document.title/description bằng công thức cũ ngay khi mount —
 * mà Google index trang SAU khi chạy JS, nên nó thấy lại tiêu đề 94–110 ký tự và mọi chữ
 * sửa tay trong CMS mất tác dụng.
 *
 * Mốc so là og:url (builder ghi đường của CHÍNH trang, kể cả trang trùng có canonical trỏ đi
 * nơi khác). Chuyển trang trong SPA thì og:url vẫn là của trang đầu → khác đường hiện tại
 * → view tự đặt tiêu đề như trước.
 */
export function headTinhKhop(): boolean {
  const og = document.querySelector('meta[property="og:url"]')?.getAttribute('content')
  if (!og) return false
  try {
    const cuoi = (p: string) => (p.endsWith('/') ? p : p + '/')
    return cuoi(new URL(og, location.origin).pathname) === cuoi(location.pathname)
  } catch {
    return false
  }
}
