# Thư mục chứa khoá bí mật (KHÔNG commit lên git)

Root `.gitignore` đã chặn `backend/config/*.json` → mọi file `.json` ở đây **không bao giờ bị đẩy lên git**. An toàn.

## Đặt khoá Google Search Console vào đây

1. Lấy file khoá `.json` bạn đã tải từ Google Cloud (tên kiểu `kinhlac-xxxxxxxx.json`).
2. Chép nó vào thư mục này (`backend/config/`).
3. **Đổi tên** thành: `gsc-service-account.json`
4. Xong! Backend tự tìm đúng file này. (Không cần điền `GSC_SERVICE_ACCOUNT` trong `.env`.)

> Không muốn đổi tên? Giữ tên gốc rồi trỏ đường dẫn trong `.env`:
> `GSC_SERVICE_ACCOUNT_FILE=config/kinhlac-xxxxxxxx.json`

Hướng dẫn đầy đủ: [../GSC-SETUP.md](../GSC-SETUP.md)
