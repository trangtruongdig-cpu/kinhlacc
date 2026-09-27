# Đăng nhập một lần từ app sang khu quản trị nội dung (CMS)

Ngày: 26/09/2026 · Trạng thái: đã thi công

## Vấn đề

Người biên tập đã đăng nhập ở `kinhlac.online` vẫn phải đăng nhập LẦN NỮA bằng passkey khi
mở `/_emdash/admin/`. Hai kho tài khoản rời nhau, hai lần xác thực, và passkey thì buộc
phải đăng ký trên từng thiết bị.

Yêu cầu của người dùng: thêm MỘT quyền trong tab Quản Lý Người Dùng; ai được gán quyền đó
thì vào thẳng khu quản trị nội dung, không phải đăng nhập lại.

## Đã chốt với người dùng

| Câu hỏi | Chốt |
|---|---|
| Vai trò bên CMS | **Hai ô tick riêng**: Biên Tập Nội Dung → Editor (40); Quản Trị Nội Dung → Admin (50) |
| Tài khoản chưa khai email | **Tự sinh địa chỉ nội bộ** |
| Passkey | **Giữ làm đường lùi**, chỉ thêm nút chứ không thay thế |

## Vì sao không chọn hai hướng kia

**Xác thực trong suốt (`auth:` entrypoint, kiểu Cloudflare Access).** Gõ thẳng
`/_emdash/admin/` là vào ngay, không nhảy lần nào — nhưng ở production middleware của
EmDash ép chế độ external cho MỌI đường, **kể cả `/_emdash/admin/login`**. Trang đăng nhập
passkey thành vô dụng, và app backend sập là không ai vào được CMS nữa, kể cả chủ nhà.
Trái thẳng với điều đã chốt.

**Mượn bảng magic-link của EmDash.** Không phải sửa CMS một dòng, không đụng nginx — nhưng
backend phải tự tái tạo cách băm token nội bộ của EmDash. Nâng cấp thư viện là gãy lặng lẽ.

## Kiến trúc

```
Người dùng đã đăng nhập app
        │  bấm "Quản Trị Nội Dung" (thanh bên)  ── hoặc ──  bấm "Tài khoản Kinh Lạc" (trang login CMS)
        ▼
  /vao-cms  (VaoCmsView.vue — trang cầu nối, chớp qua)
        │  1. POST /auth/ve-cms          (Bearer token của app)
        │     └─ backend đọc LẠI quyền từ CSDL → cấp vé JWT 60 giây, dùng một lần
        │  2. POST /_emdash/api/auth/kinhlac/vao   (fetch CÙNG NGUỒN GỐC, vé trong THÂN bài)
        │     └─ CMS xác minh chữ ký → tìm/tạo người dùng theo email → session.set("user")
        ▼
  location.replace('/_emdash/admin/')   — đã đăng nhập
```

### Vì sao vé đi trong thân POST chứ không trên URL

Vé trên URL là vé nằm trong log của nginx, trong lịch sử trình duyệt, và trong header
`Referer` gửi cho bên thứ ba. 60 giây vẫn quá dài cho ba chỗ đó.

### Vì sao `authProviders` chứ không phải `auth`

EmDash có hai móc khác hẳn nhau. `authProviders[]` là **thêm** một cách đăng nhập; nó cho
đúng ba thứ cần: `routes` (inject lúc build), `publicRoutes` (bỏ qua middleware xác thực —
bắt buộc, vì người đổi vé chính là người chưa có phiên) và `adminEntry` (nút trên trang
đăng nhập). `auth:` là **thay** toàn bộ cách đăng nhập — xem phần "vì sao không chọn".

## Các tệp

**Backend**
- `src/utils/ve-cms.util.ts` — luật đổi quyền app → bậc CMS, và luật sinh email. Hàm thuần.
- `src/utils/ve-cms.util.spec.ts` — 13 phép kiểm.
- `src/controllers/auth.controller.ts` → `taoVeCms()` — đúc vé.
- `src/routers/auth.router.ts` → `POST /auth/ve-cms`, có `NhanVienGuard`.

**CMS**
- `src/auth-kinhlac/nha-cung-cap.ts` — descriptor `authProviders`.
- `src/auth-kinhlac/ve.ts` — xác minh JWT HS256 bằng `crypto.subtle`, và sổ chống dùng lại.
- `src/auth-kinhlac/vao.ts` — route `POST /_emdash/api/auth/kinhlac/vao`.
- `src/auth-kinhlac/nut-dang-nhap.tsx` — nút trên trang đăng nhập.
- `astro.config.mjs` — khai `authProviders: [kinhlac()]`.

**Frontend**
- `src/constants/pages.ts` — hai khoá quyền mới (tab Quản Lý Người Dùng tự dựng ô tick).
- `src/views/VaoCmsView.vue` — trang cầu nối.
- `src/router/index.ts` — route `/vao-cms`.
- `src/views/DashboardLayout.vue` — mục thanh bên nhận CẢ HAI quyền.

## Quyết định đáng ghi lại

**`CMS_SSO_SECRET` là bí mật RIÊNG, không dùng lại `JWT_SECRET`.** Hai tiến trình phải cùng
biết nó, nên nó nằm ở cả `backend/.env` lẫn `cms/.env`. Nếu dùng chung `JWT_SECRET` thì một
ngày CMS bị chiếm là kẻ tấn công đúc được token của TOÀN BỘ app, kể cả hồ sơ bệnh nhân. Với
bí mật riêng, thứ tệ nhất họ đúc được chỉ là vé vào chính cái CMS họ đã chiếm.

**Quyền đọc lại từ CSDL mỗi lần cấp vé**, không lấy trong token của người gọi: token app
sống 1 ngày, quyền có thể vừa bị thu hồi mười phút trước.

**Route `/vao-cms` cố ý KHÔNG có `meta.page`.** Hai quyền mở được nó là quan hệ HOẶC, mà
guard của router chỉ nhận đúng một khoá. Chặn thật nằm ở backend — một nguồn sự thật duy
nhất, và là nguồn duy nhất không sửa được từ trình duyệt. Người không có quyền sẽ thấy đúng
lý do thay vì bị đá về trang chủ không lời giải thích.

**Khoá bên CMS THẮNG quyền bên app.** `users.disabled = 1` chặn vào ngay cả khi app vẫn cấp
quyền — đó là cách duy nhất tống một người ra tức thì.

**`X-EmDash-Request: 1` là bắt buộc, không phải cho đẹp.** Xem phần bẫy bên dưới.

## Bẫy đã đo được

**Thiếu `X-EmDash-Request: 1` thì production trả 403 CSRF_REJECTED còn dev vẫn chạy ngon.**
EmDash kiểm CSRF ở route công khai bằng cách so `Origin` với origin của chính request.
Trình duyệt gửi `https://kinhlac.online`, nhưng chuỗi thật là Caddy (cắt TLS) → nginx → cms
đều HTTP thuần, mà `@astrojs/node` KHÔNG đọc `X-Forwarded-Proto` (xem ghi chú
`EMDASH_SITE_URL` trong `docker-compose.yml`), nên CMS thấy origin của mình là
`http://kinhlac.online`. Lệch nhau đúng chữ "s". Đã đo cả hai chiều trên bản dựng:

```
Origin lệch, KHÔNG có header → HTTP 403 CSRF_REJECTED
Origin lệch, CÓ    header    → HTTP 401 (tới được tay mình)
```

**Sổ chống dùng lại vé nằm TRONG BỘ NHỚ TIẾN TRÌNH.** Chỉ đúng khi chạy MỘT container —
đúng hiện trạng, cùng lý lẽ với `@Cron` và `sse.service` (xem "Deployment paths" trong
CLAUDE.md). Thêm bản sao thứ hai là mỗi bản giữ một sổ riêng và một vé tiêu được hai lần.
Vé sống 60 giây nên thiệt hại có trần, nhưng vẫn phải chuyển sang kho dùng chung nếu nhân bản.

**Luật sinh email phải ỔN ĐỊNH.** EmDash tra người dùng bằng email; cùng một tài khoản mà
lần này ra địa chỉ khác lần trước là đẻ thêm một người dùng CMS. Dùng tên miền con riêng
`@noi-bo.kinhlac.online` chứ không phải `@kinhlac.online`, để địa chỉ sinh ra không bao giờ
đụng địa chỉ thật của nhân viên, và nhìn danh sách người dùng CMS là biết ngay ai chưa khai
email. **Đổi chuỗi tên miền đó là đẻ ra người dùng CMS mới cho TẤT CẢ tài khoản chưa khai email.**

**Chốt thuật toán `alg: HS256`.** Không chốt là mở đúng lỗ "alg: none" kinh điển. Đã đo: vé
`alg: none` bị từ chối.

## Giới hạn đã biết (không phải bỏ sót)

**Thu hồi quyền KHÔNG đá người đang mở CMS ra ngay.** Phiên EmDash sống độc lập với quyền
bên app: bỏ tick thì lần vào SAU bị chặn, còn phiên đang mở vẫn chạy tới khi hết hạn. Muốn
chặn tức thì thì khoá tài khoản đó trong CMS (`users.disabled`) — khoá bên CMS thắng.

**Hạ bậc thì có hiệu lực ngay ở lần vào sau**: bỏ tick "quản trị nội dung" mà còn "biên tập
nội dung" thì lần vào kế tiếp `role` bị hạ từ 50 xuống 40.

**Phiên CMS lưu trên đĩa container** (`@astrojs/node` bật session với kho tệp), nên deploy
là mất phiên, phải bấm lại một lần. Không phải lỗi.

**Ở máy dev app và CMS khác cổng**, nên luồng này chỉ chạy nhờ `server.proxy['/_emdash']`
trong `vite.config.ts`. Bỏ proxy đó là luồng chết ở dev mà production vẫn chạy.

## Nghiệm thu đã chạy

Trên **bản dựng** (`node ./dist/server/entry.mjs`), không phải `astro dev` — middleware của
EmDash có nhánh DEV đi đường khác hẳn.

| Phép | Kết quả |
|---|---|
| `npm test --prefix backend` | 18 bộ / 196 phép kiểm xanh |
| `npm run type-check` (backend, frontend) | sạch |
| `astro check` (cms) | 0 lỗi ở tệp mới (22 lỗi có sẵn từ trước ở trang blog) |
| Route tồn tại và công khai (vé rác) | HTTP 401 — tới được tay mình, không bị đá về login |
| GET vào route | HTTP 404 (chỉ POST) |
| Vé sai khoá / `alg:none` / sai `aud` / hết hạn / bậc lạ | 401, log ghi đúng sáu mã lý do khác nhau |
| `/_emdash/admin/` khi chưa đăng nhập | vẫn 302 về trang passkey — đường lùi còn nguyên |
| Nút trên trang đăng nhập | hiện đúng chỗ "OR CONTINUE WITH", href mang theo `?dich=` |
| CSRF Origin lệch | 403 khi thiếu header, 401 khi có — header là thứ chịu lực |

**Chưa chạy được:** đường ghi vào CSDL (tạo/đồng bộ người dùng + lập phiên) cần một lần ghi
thật vào bảng `users` của kho `kinhlac_cms`. Lần bấm thật đầu tiên của người dùng chính là
phép nghiệm thu đó.

## Biến môi trường mới

`CMS_SSO_SECRET` — chuỗi ngẫu nhiên, **giống hệt nhau** ở `backend/.env` và `cms/.env`.
Thiếu ở backend → `POST /auth/ve-cms` trả 503 kèm lý do. Thiếu ở CMS → route trả 503 và ghi
log. Cả hai đều không nằm im, và passkey vẫn dùng được như cũ.
