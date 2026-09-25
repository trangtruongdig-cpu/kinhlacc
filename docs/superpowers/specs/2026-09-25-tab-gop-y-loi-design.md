# Tab "Góp Ý & Lỗi" — hệ thống tự phát hiện, thông báo và dựng hồ sơ sửa lỗi

Ngày chốt: 25/09/2026. Trạng thái: đã duyệt, đang dựng.

## Mục đích

Hiện nay lỗi của hệ thống chỉ tồn tại ở hai nơi tạm bợ: console trình duyệt của người
dùng (mất khi đóng tab) và log Docker của backend (không ai đọc). Hệ quả là lỗi chỉ
được biết đến khi có người kêu, và lúc đó không còn bằng chứng để sửa.

Tab này biến lỗi thành **hồ sơ có bằng chứng**: thu → gom cụm → báo → dựng phiếu sửa
lỗi dán thẳng vào Claude Code.

## Phạm vi "tự sửa"

Mức 1 — **hồ sơ sửa lỗi cho người**. Hệ thống KHÔNG tự sinh code, KHÔNG tự deploy,
KHÔNG tự tắt tính năng. Lý do: đây là phần mềm phòng chẩn trị đang chạy thật với dữ
liệu bệnh nhân thật; một bản vá sai tự bay lên VPS là rủi ro không đổi lại được gì.

## Bốn nguồn tín hiệu

| Nguồn | Cách bắt | Lane |
|---|---|---|
| Lỗi backend 5xx / exception chưa bắt | `SuCoExceptionFilter` toàn cục | `loi` |
| Lỗi frontend: JS crash, promise vỡ, Vue error, API fail | `window.onerror`, `unhandledrejection`, `app.config.errorHandler`, móc trong `api.ts` | `loi` |
| Góp ý người dùng (nút nổi "Báo lỗi") | người dùng gõ tay, tự kèm ngữ cảnh | `gop_y` |
| Tín hiệu UX: API > 3s, rage-click | móc trong `api.ts` + listener toàn cục | `ux` |

Lane `ux` tách riêng để nhiễu của nó không lấn át lỗi thật trong danh sách mặc định.

## Dữ liệu

Hai bảng, tạo bằng `SchemaBootstrapService` (DDL idempotent, không chạy psql tay).

- `su_co` — TỪNG LẦN xảy ra: route thô/chuẩn, thông điệp, stack, breadcrumbs (20 thao
  tác cuối), ngữ cảnh đã che, trình duyệt, vai trò người dùng, `nguoi_dung_hash`.
- `su_co_cum` — CỤM: vân tay (unique), khu vực, tóm tắt, số lần, số người, hạng,
  trạng thái, lần đầu/lần cuối, ghi chú, hồ sơ AI.

### Vân tay

`sha1(loai | route_chuan | thong_diep_chuan)`, trong đó:
- route: `/patients/123/kham/45` → `/patients/:id/kham/:id`, bỏ query.
- thông điệp: hạ chữ thường, bỏ số/uuid/hex/đường dẫn tuyệt đối, cắt 200 ký tự.

Không có bước chuẩn hoá này thì mỗi bệnh nhân sinh một cụm riêng và bảng thành rác.
Đây là phần được viết test TRƯỚC.

### Che dữ liệu (2 lớp)

Client che trước khi gửi, server che lại lần nữa (không tin client). Dùng lại danh
sách `SENSITIVE_KEYS` đã có. Thêm: số điện thoại, ngày sinh, chuỗi > 300 ký tự.
Người dùng lưu dưới dạng băm — vẫn đếm được "lỗi dính bao nhiêu người" mà bảng lỗi
không trở thành đường truy ra bệnh nhân.

## Chống bão sự kiện

Một trang vỡ có thể bắn hàng nghìn sự kiện/phút; DB là Aiven, không được phép gánh.

- Máy khách: tối đa 5 lần/vân tay/phiên, 20 sự kiện/phiên, gửi theo lô 5 giây,
  `sendBeacon` khi rời trang.
- Máy chủ: cụm đã có > 200 lần trong 1 giờ → chỉ tăng bộ đếm, không chèn dòng `su_co`.
- Giữ 30 ngày, dọn bằng `@Cron` (an toàn: chỉ 1 process — xem CLAUDE.md).

## Thông báo

| Kênh | Khi nào | Ghi chú |
|---|---|---|
| SSE → badge đỏ + toast | mọi cụm MỚI | dùng lại `SseService`, chỉ gửi cho `kind === 'staff'` |
| Firebase push | cụm hạng NẶNG mới | đã có sẵn hạ tầng |
| Telegram | cụm hạng NẶNG mới | tuỳ chọn, chỉ bật khi có `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` |

## API

| Route | Quyền | Việc |
|---|---|---|
| `POST /su-co/bao` | công khai, có giới hạn tần suất | nhận báo cáo từ client |
| `GET /su-co/cum` | Quản Trị | danh sách cụm + bộ lọc |
| `GET /su-co/cum/:id` | Quản Trị | chi tiết + các lần xảy ra gần nhất |
| `PATCH /su-co/cum/:id` | Quản Trị | đổi trạng thái, ghi chú |
| `GET /su-co/cum/:id/ho-so` | Quản Trị | sinh hồ sơ sửa lỗi (markdown) |
| `POST /su-co/cum/:id/phan-tich-ai` | Quản Trị | nhờ OpenAI đoán nguyên nhân |
| `GET /su-co/thong-ke` | Quản Trị | số liệu thẻ đầu trang + badge |

`POST /su-co/bao` phải CÔNG KHAI: lỗi hay xảy ra nhất là ở trang đăng nhập và các
trang công khai (landing, từ điển, kinh mạch 3D), lúc chưa có token. Bù lại: giới hạn
theo IP, trần thân request 128KB, che dữ liệu phía server.

> Sửa 25/09/2026: đặc tả ban đầu ghi 8KB — quá chặt, một lô 50 tín hiệu kèm stack vượt ngay.
> Cài đặt thật là 128KB, đặt trong `main.ts` TRƯỚC trần chung 20MB (body-parser bỏ qua nếu
> thân request đã được lớp trước phân tích). Trần chung 20MB có lý do của nó — ảnh upload —
> nhưng không được áp cho một cửa công khai.

## Giao diện

Tab mới ngay DƯỚI "SEO Radar" trong sidebar. `meta.page: 'su-co'` → `authStore.can()`
tự khoá với vai trò không phải Quản Trị, không cần đụng `constants/pages.ts`.

- Hàng thẻ số: đang mở / mới 24h / hạng nặng / đã sửa tuần này.
- Bộ lọc: tìm theo khu vực·route·vân tay, trạng thái, lane, nguồn.
- Danh sách cụm: biểu tượng loại · khu vực · chip "Mới" · chip nguồn · `×N · N giờ trước`
  · route · dòng tóm tắt.
- Chi tiết: biểu đồ tần suất theo giờ, các lần gần nhất (stack + breadcrumbs + trình
  duyệt), nút **Hồ sơ sửa lỗi**, nút **Nhờ AI phân tích**, đổi trạng thái, ghi chú.

### Hồ sơ sửa lỗi (sản phẩm chính)

Markdown gồm: tóm tắt cụm + vân tay → cách tái hiện (route, vai trò, trình duyệt, các
bước) → bằng chứng (stack đã dọn, 3 lần gần nhất) → chỗ nghi vấn trong repo → câu hỏi
kiểm chứng + tiêu chí "coi là đã sửa". Có nút **Sao chép cho Claude Code**.

Hồ sơ dựng bằng KHUÔN MẪU (luôn có, miễn phí, không bịa). AI chỉ là lớp phủ tuỳ chọn,
để khi hết quota thì tab vẫn dùng được.

## Kiểm thử

`backend/src/utils/su-co-van-tay.util.spec.ts` — bảng ca cho: chuẩn hoá route, chuẩn
hoá thông điệp, che dữ liệu, xếp hạng, ngưỡng chống bão. Viết trước phần cài đặt.

## Việc KHÔNG làm (chốt để khỏi phình)

- Không sourcemap ngược stack frontend về dòng code gốc (để sau nếu thấy cần).
- Không tự tắt tính năng, không tự deploy.
- Không thay thế log Docker — tab này bổ sung, không thay thế.
