/**
 * Route nào được gọi lúc nào — tách khỏi `admin.jsx` để CÓ THỂ KIỂM ĐƯỢC.
 *
 * ⚠️ Pool CSDL của CMS là `max: 1` (xem `astro.config.mjs` — Aiven chỉ còn ~7 slot), nên mọi
 * truy vấn XẾP HÀNG trên một kết nối và `Promise.all` không nhanh hơn một mili giây nào. Chỉ
 * giảm SỐ route mới nhanh. RTT tới Aiven đo được 98,9 ms.
 *
 * Trước 06/10/2026 `useEffect` mở màn gọi NĂM route (~19 lượt đi-về ≈ 1,9 giây khi đã ấm), và
 * `dsKeHoach` bị đọc BA lần trong cùng lượt đó. Người xem tab Radar trả tiền cho bốn tab chưa mở.
 */

/**
 * Gọi khi mở màn, bất kể tab nào đang mở. ĐÚNG MỘT route.
 *
 * `viec` trả cả hàng đợi việc (cho màn Việc, tab mặc định) lẫn `demTab` (cho huy hiệu trên thanh
 * quy trình), nên nó thay cả `viec-dem` lẫn `tong-quan` ở đường mở màn. `tong-quan` xuống thành
 * route của tab Radar — người mở màn Việc không phải trả tiền cho bảng đối thủ họ chưa xem.
 */
export const ROUTE_MO_MAN = ["viec"];

/**
 * Route mà việc MỞ tab đó cần. KHÔNG kể route đã có trong `ROUTE_MO_MAN` — khai lại là tải hai
 * lần cho đúng dữ liệu đó.
 */
const THEO_TAB = {
	viec: [], // sống bằng `viec`, đã ở ROUTE_MO_MAN
	radar: ["tong-quan"],
	"khoang-trong": ["khoang-trong-tong-quan"],
	huong: ["cum-ngu-nghia"],
	"ke-hoach": ["chien-luoc-tong-quan"],
	"leo-top": ["leo-top-tong-quan"],
	"mang-nhen": ["mang-nhen-tong-quan"],
	nhap: ["nhap-tong-quan"],
};

export function routeChoTab(tab) {
	return THEO_TAB[tab] ?? [];
}

/**
 * Tab phải tải lại MỖI lần sang, không chỉ lần đầu.
 *
 * Chỉ Kế hoạch: bài dự kiến vừa giao từ tab Khoảng trống phải hiện ngay, không thì người dùng
 * tưởng nút Giao không ăn. Các tab khác giữ dữ liệu cũ và có nút "Tải lại" lo phần làm mới —
 * tải lại mỗi lần sang là trả một vòng mạng để nhận đúng con số đang hiện.
 */
export const TAI_LAI_KHI_SANG = new Set(["ke-hoach"]);
