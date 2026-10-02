import { createRequire } from 'node:module';
const require = createRequire('/Users/truongtrang/Desktop/kinhlacc/backend/');
const fs = require('fs');

const YESCALE_API_KEY = "sk-AhGHV8AvN18JT6Hspk9RW6jPc6yYYzo5xHtLrOBAx7SJC95X";
const YESCALE_BASE_URL = "https://api.yescale.vip/v1";

async function callLLM(text) {
  const prompt = `Phân tích trang web sau và trả về JSON với các trường:
- chuDe: chủ đề chính của trang (ngắn gọn).
- tuKhoa: mảng các từ khoá chính (tối đa 5).
- tomTat: mảng các ý chính (tối đa 3 câu).

Nội dung:
${text.substring(0, 4000)}...

Chỉ trả về JSON hợp lệ, không có markdown.`;
  
  const res = await fetch(`${YESCALE_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${YESCALE_API_KEY}` },
    body: JSON.stringify({ model: 'gemini-2.5-flash', messages: [{ role: 'user', content: prompt }] })
  });
  
  const data = await res.json();
  try {
    let content = data.choices[0].message.content;
    content = content.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(content);
  } catch(e) {
    return null;
  }
}

// 1. Get dev-bypass cookie
async function getCookie() {
  const res = await fetch("http://localhost:4321/_emdash/api/setup/dev-bypass?redirect=/");
  const cookieHeader = res.headers.get("set-cookie");
  if (!cookieHeader) throw new Error("No cookie");
  return cookieHeader.split(';')[0];
}

// 2. Helper to call MCP over HTTP (like claude.ai does, but with cookie instead of token)
// Note: EmDash MCP HTTP endpoint usually expects standard MCP JSON-RPC.
// Wait, is it HTTP POST for messages or SSE?
// EmDash uses SSE for standard MCP. But plugins in EmDash 0.39.1 might expose direct HTTP endpoints?
// Let's check `plugin.mjs`: `route: "mcp-lay-viec"` maps to `/_emdash/api/plugins/rada-seo/mcp-lay-viec` !
async function callTool(route, payload, cookie) {
  const res = await fetch(`http://localhost:4321/_emdash/api/plugins/rada-seo/${route}`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json', 
      'Cookie': cookie,
      'Origin': 'http://localhost:4321',
      'Referer': 'http://localhost:4321/',
      'X-Emdash-Csrf': '1'
    },
    body: JSON.stringify(payload)
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch(e) { console.log('Response:', text); throw e; }
}

async function run() {
  console.log("Getting auth cookie...");
  const cookie = await getCookie();
  
  console.log("Calling rada_lay_viec...");
  const viec = await callTool('mcp-lay-viec', { soTrang: 10 }, cookie);
  const trang = viec.trang || [];
  console.log(`Có ${trang.length} trang để đọc.`);
  
  const ketQua = [];
  for (const t of trang) {
    console.log(`Đang đọc: ${t.url}`);
    const llm = await callLLM(t.chu);
    if (llm) ketQua.push({ id: t.id, ...llm });
  }
  
  if (ketQua.length > 0) {
    console.log("Calling rada_ghi_phan_tich...");
    await callTool('mcp-ghi-phan-tich', { ketQua, boQua: [] }, cookie);
  }
  
  console.log("Calling rada_xong_phan_tich...");
  const xong = await callTool('mcp-xong-phan-tich', {}, cookie);
  console.log("Kết quả xong:", xong);
}
run();
