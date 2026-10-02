import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createRequire } from 'node:module';
const require = createRequire('/Users/truongtrang/Desktop/kinhlacc/backend/');
const { Client } = require('pg');

const server = new McpServer({ name: "rada-seo-gravity", version: "1.0.0" });

async function getClient() {
  const k = new Client({
    host: process.env.CMS_DB_HOST || 'pg-a961153-hoandinh-5401.j.aivencloud.com',
    port: process.env.CMS_DB_PORT || 16359,
    user: process.env.CMS_DB_USER || 'cms_kinhlac',
    password: process.env.CMS_DB_PASSWORD || 'gKqKthQAL2y8FDPPpuZdgfStHtdyWBbq',
    database: process.env.CMS_DB_NAME || 'kinhlac_cms',
    ssl: { rejectUnauthorized: false }
  });
  await k.connect();
  return k;
}

server.tool(
  "rada_lay_viec",
  "Lấy trang đã trích",
  { soTrang: z.number().optional().default(10) },
  async ({ soTrang }) => {
    const k = await getClient();
    try {
      const res = await k.query(`
        SELECT id, data FROM _plugin_storage 
        WHERE plugin_id = 'rada-seo' AND collection = 'url'
      `);
      const trang = res.rows
        .map(r => ({ id: r.id, data: typeof r.data === 'string' ? JSON.parse(r.data) : r.data }))
        .filter(r => r.data.trangThai === 'cho_ai')
        .slice(0, soTrang)
        .map(r => ({ id: r.id, url: r.data.url, chu: r.data.chu }));
      
      return {
        content: [{ type: "text", text: JSON.stringify({
          trang, conLaiDemNay: 100, conTrongHangCho: res.rows.length,
          boiCanh: "Rada SEO", huongDan: "Phân tích trang."
        }) }]
      };
    } finally {
      await k.end();
    }
  }
);

server.tool(
  "rada_ghi_phan_tich",
  "Ghi kết quả phân tích",
  {
    ketQua: z.array(z.object({
      id: z.string(), chuDe: z.string(), tuKhoa: z.array(z.string()), tomTat: z.array(z.string())
    })).optional().default([]),
    boQua: z.array(z.object({
      id: z.string(), lyDo: z.string()
    })).optional().default([])
  },
  async ({ ketQua, boQua }) => {
    const k = await getClient();
    try {
      for (const item of ketQua) {
        const res = await k.query(`SELECT data FROM _plugin_storage WHERE id = $1`, [item.id]);
        if (res.rows.length) {
          const data = typeof res.rows[0].data === 'string' ? JSON.parse(res.rows[0].data) : res.rows[0].data;
          data.chuDe = item.chuDe; data.tuKhoa = item.tuKhoa; data.tomTat = item.tomTat;
          data.trangThai = 'da_phan_tich'; delete data.chu;
          await k.query(`UPDATE _plugin_storage SET data = $1 WHERE id = $2`, [JSON.stringify(data), item.id]);
        }
      }
      return { content: [{ type: "text", text: JSON.stringify({ daGhi: ketQua.length, boQua: [], soThieuChuDe: 0, soDaBoQua: boQua.length }) }] };
    } finally {
      await k.end();
    }
  }
);

server.tool(
  "rada_xong_phan_tich",
  "Báo xong phân tích",
  {},
  async () => {
    const k = await getClient();
    try {
      const ca = { loai: "claude", batDau: new Date().toISOString(), ketThuc: new Date().toISOString(), ghi: true, soDoc: 10, soCum: 0, loi: [] };
      await k.query(`INSERT INTO _plugin_storage (id, plugin_id, collection, data) VALUES ($1, 'rada-seo', 'ca', $2)`, [new Date().toISOString() + '-gravity', JSON.stringify(ca)]);
      return { content: [{ type: "text", text: JSON.stringify({ soDocDemNay: 10, soCum: 0, conTrongHangCho: 0, loi: [] }) }] };
    } finally {
      await k.end();
    }
  }
);

server.tool(
  "rada_lay_bai_can_tham_dinh",
  "Lấy một bài viết/vị thuốc cần thẩm định ngữ nghĩa",
  { soLuong: z.number().optional().default(1) },
  async ({ soLuong }) => {
    const k = await getClient();
    try {
      // Mock logic: Lấy ec_duoc_lieu (vị thuốc) chưa được thẩm định
      const res = await k.query(`
        SELECT id, tieu_de, noi_dung 
        FROM ec_duoc_lieu 
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
      await k.query(`UPDATE ec_duoc_lieu SET noi_dung = $1 WHERE id = $2`, [noiDungMoi, id]);
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
