---
type: reference
provenance: assistant
origin: javis-learned
created: 2026-09-09
updated: 2026-09-09
---
Kênh áp SQL migration lên production khác với kênh deploy code (deploy code vẫn theo [[trien-khai-len-vps-bang-git-pull]] qua git pull trên VPS). Với migration DB: máy local chưa có `psql`, cài bằng `brew install libpq` (keg-only, không tự vào PATH, phải gọi qua đường dẫn Cellar/opt đầy đủ). Vì backend đã cấu hình `ssl: { rejectUnauthorized: false }` nên chỉ cần nối `sslmode=require` vào connection string, không cần tách CA cert riêng.
