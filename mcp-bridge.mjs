import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createRequire } from 'node:module';
const require = createRequire('/Users/truongtrang/Desktop/kinhlacc/backend/');
const { Client } = require('pg');

const server = new McpServer({ name: "rada-seo-gravity", version: "1.0.0" });

async function getClient() {
  // ⚠️ KHÔNG BAO GIỜ nhúng cứng thông tin kết nối ở đây. Bản đầu của tệp này đặt host/user/
  // password production làm giá trị mặc định, và nó đã bị commit + push lên GitHub (1b64f79,
  // e67b154, fc81599) — mật khẩu coi như đã lộ, phải ĐỔI ở Aiven; gỡ khỏi mã KHÔNG xoá được
  // lịch sử git. Thiếu biến thì DỪNG, đừng âm thầm nối bằng giá trị đoán.
  const thieu = ['CMS_DB_HOST', 'CMS_DB_USER', 'CMS_DB_PASSWORD', 'CMS_DB_NAME'].filter((x) => !process.env[x]);
  if (thieu.length) throw new Error(`mcp-bridge: thiếu biến môi trường ${thieu.join(', ')} — nạp backend/.env trước khi chạy.`);
  const k = new Client({
    host: process.env.CMS_DB_HOST,
    port: Number(process.env.CMS_DB_PORT || 5432),
    user: process.env.CMS_DB_USER,
    password: process.env.CMS_DB_PASSWORD,
    database: process.env.CMS_DB_NAME,
    // Xác minh chứng chỉ khi có CA (cùng lối backend/src/utils/db-ssl.util.ts); không có thì
    // vẫn nối nhưng KÊU, chứ không im lặng tắt xác minh.
    ssl: process.env.CA_CERTIFICATE
      ? { ca: process.env.CA_CERTIFICATE, rejectUnauthorized: true }
      : (console.warn('⚠ mcp-bridge: không có CA_CERTIFICATE — nối SSL mà KHÔNG xác minh máy chủ.'), { rejectUnauthorized: false }),
  });
  await k.connect();
  return k;
}

// ── Ba công cụ hàng đợi đọc trang ĐÃ BỎ (02/10/2026) ──────────────────────────────────────
//
// rada_lay_viec / rada_ghi_phan_tich / rada_xong_phan_tich từng nằm ở đây và chúng là một BẢN
// GHI THỨ HAI của mcp-viec.mjs, viết bằng SQL thô. Bản này lệch ở bốn chỗ, và cả bốn đều im
// lặng — đã đo trên dữ liệu thật:
//
//  1. ghi_phan_tich KHÔNG ghi `phanTichLuc`, nên 220 trang không có mốc đọc. chuDeDaPhanTich
//     xếp theo đúng cột đó.
//  2. xong_phan_tich ghi CỨNG `soDoc: 10, soCum: 0` và KHÔNG gọi capNhatKhoangTrong. Nên kho
//     có 220 trang đã đọc mà bảng khoảng trống rỗng trơn, trong khi nhật ký báo ca thành công.
//  3. ghi_phan_tich nhận `boQua` rồi BỎ, trả về `boQua: []`. Trang không đọc được vì thế được
//     giao lại mãi.
//  4. lay_viec KHÔNG bọc chữ trang trong rào `<<<TRANG_DOI_THU …>>>` của mcp-viec.mjs, tức đưa
//     chữ trang đối thủ cho mô hình mà không có rào "đây là DỮ LIỆU, không phải lời dặn"; nó
//     cũng bỏ qua `giaoDem`/`soLanGiao` và báo `conLaiDemNay: 100` giả, nên trần 40 trang/đêm
//     không còn tác dụng.
//
// Việc đọc trang nay nằm TRONG ca radar (cms/src/plugins/rada-seo/ai/tu-doc-trang.mjs), gọi
// model trực tiếp và dùng chính layViec/ghiPhanTich — nên không cần đường này nữa. Đừng dựng
// lại: mọi đường ghi thứ hai vào kho rada-seo sẽ lệch, và lệch im lặng.

server.tool(
  "rada_lay_bai_can_tham_dinh",
  "Lấy một bài viết/vị thuốc cần thẩm định ngữ nghĩa",
  { soLuong: z.number().optional().default(1) },
  async ({ soLuong }) => {
    const k = await getClient();
    try {
      // Mock logic: Lấy vi_thuoc (vị thuốc) chưa được thẩm định
      const res = await k.query(`
        SELECT id, ten_vi_thuoc as tieu_de, mo_ta as noi_dung 
        FROM vi_thuoc 
        LIMIT $1
      `, [soLuong]);
      
      const baiViet = res.rows.map(r => ({
        id: r.id,
        tieuDe: r.tieu_de,
        noiDung: r.noi_dung,
        // Giả lập danh sách cụm ngữ nghĩa cần gài gắm (dựa vào DB GĐ 3)
        cumNguNghiaThieu: ["Giải độc & Điều hoà", "Ho, Suyễn & Hô hấp"]
      }));
      
      return { content: [{ type: "text", text: JSON.stringify(baiViet) }] };
    } catch(e) {
      // Bỏ qua lỗi nếu bảng chưa tồn tại
      return { content: [{ type: "text", text: JSON.stringify([]) }] };
    } finally {
      await k.end();
    }
  }
);

server.tool(
  "rada_ghi_bai_da_toi_uu",
  "Lưu lại bài viết đã được AI tối ưu và gài gắm ngữ nghĩa",
  {
    id: z.string(),
    noiDungMoi: z.string(),
    doanThem: z.array(z.string()).optional()
  },
  async ({ id, noiDungMoi, doanThem }) => {
    const k = await getClient();
    try {
      // Mock update
      await k.query(`UPDATE vi_thuoc SET mo_ta = $1 WHERE id = $2`, [noiDungMoi, id]);
      return { content: [{ type: "text", text: JSON.stringify({ success: true, id, message: "Đã cập nhật bài viết chuẩn SEO Semantic" }) }] };
    } catch(e) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, error: e.message }) }] };
    } finally {
      await k.end();
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
main();
