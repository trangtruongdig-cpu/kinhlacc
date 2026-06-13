# Từ Điển — Index tra ngược (Nguồn & Đặc Tính)

Phần Từ Điển tra **2 chiều**: từ một **Nguồn (Xuất Xứ)** hay một **Đặc Tính** → ra danh sách huyệt thuộc về nó. UI ở `TuDienView.vue` (tab **Thư Mục Nguồn** + **Tra Theo Đặc Tính**).

> Dữ liệu đã được **chuẩn hoá đồng loạt**: mỗi huyệt trong `acupoints.js` dùng đúng **một tên nguồn chuẩn** (không còn biến thể hoa/thường, OCR, gọi tắt). Thư mục nguồn là **một bộ chuẩn** — không còn alias.

## Các file

| File | Vai trò | Ai sửa |
|---|---|---|
| `acupoints.js` | 1.059 huyệt; XUẤT XỨ đã dùng **tên nguồn chuẩn** | sửa qua script khi đổi tên nguồn |
| `dict-traits.json` | Từ vựng phân loại **Đặc Tính** (regex khớp) | **Người** |
| `dict-sources.json` | **Thư mục Nguồn**: tên chuẩn + tác giả/niên đại/link | **Người** |
| `_build-dict.cjs` | Đọc data → gom nguồn + phân loại + đảo chiều → sinh index | (công cụ) |
| `dict-facets.js` | Index `window.DICT_FACETS` cho frontend | **TỰ SINH — không sửa** |

Nạp vào app qua `DATA_SCRIPTS` trong `frontend/src/lib/acuMap3d.ts`.

## Dựng lại index (sau mọi thay đổi)

```bash
cd frontend/public/kinhmach3d/data
node _build-dict.cjs
```

Script giữ nguyên `ten` / `tacGia` / `nienDai` / `link` bạn đã điền, chỉ làm mới `count` & `huyetIds`,
rồi sinh lại `dict-facets.js`. In ra số nguồn, phân loại Đặc Tính, và các cặp **nghi trùng** (báo cáo console, để rà).

## Việc thường làm

- **Bổ sung tác giả / niên đại / link**: mở `dict-sources.json`, điền vào nguồn tương ứng → chạy lại script.
- **Sửa phân loại Đặc Tính**: mở `dict-traits.json`, thêm/bớt loại hoặc chỉnh `any` (regex) → chạy lại script.
- **Đổi tên một nguồn (toàn bộ)**: vì tên chuẩn đã nằm trong `acupoints.js`, cần sửa ở đó (tìm-thay tên cũ → tên mới trong các mục `XUẤT XỨ` + `noiDung`) rồi chạy lại script. Đổi mình `ten` trong `dict-sources.json` sẽ KHÔNG khớp với data.

## Cấu trúc `window.DICT_FACETS`

```js
{
  count:  { huyet, sources, traits },
  huyet:  { "<id>": { ten, code } },              // tra tên/mã huyệt theo id
  sources:{ "<id>": { ten, tacGia, nienDai, link, parent, chapter, thien, count, huyetIds } },
  traits: { "<id>": { ten, nhom, moTa, count, huyetIds } }
}
```
