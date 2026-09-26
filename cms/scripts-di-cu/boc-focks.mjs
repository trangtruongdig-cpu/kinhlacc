// boc-focks.mjs — bóc mục "Tác dụng/chỉ định chính" của từng huyệt ra hồ sơ chờ NGƯỜI duyệt.
//
//   node scripts-di-cu/boc-focks.mjs --thu     # in thống kê, không ghi
//   node scripts-di-cu/boc-focks.mjs
//
// KHÔNG ghi thẳng vào database. Hồ sơ phải được người duyệt rồi mới nạp bằng nap-hoso-focks.mjs.

import { execFileSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const cmsDir = resolve(here, "..");
const PDF = process.env.PDF || `${process.env.HOME}/Downloads/Huyet vi thuong dung.pdf`;
const RA = resolve(cmsDir, ".tam-focks");
const chiThu = process.argv.includes("--thu");

// Bóc từng trang bằng PyMuPDF (đã có sẵn: python3 -c "import fitz").
const py = `
import fitz, json, sys
d = fitz.open(sys.argv[1])
print(json.dumps([d[i].get_text() for i in range(d.page_count)]))
`;
const trang = JSON.parse(execFileSync("python3", ["-c", py, PDF], { maxBuffer: 256 << 20 }).toString());
console.log(`PDF: ${trang.length} trang`);

// "1. HUYỆT TRUNG PHỦ (中府zhongfu - Lu1)" → ten="TRUNG PHỦ", ma="LU1"
// "2. HUYỆT VÂN MÔN (雲門(云门)yunmen - Lu 2)" — ngoặc LỒNG NHAU (chữ giản thể trong ngoặc con)
// → nhóm ngoặc phải bắt tới dấu ')' CUỐI CÙNG của dòng ('\)\s*$'), không phải '[^)]*' (dừng ở
//   ngoặc con đầu tiên, làm rơi mất phần "yunmen - Lu 2" chứa mã kinh).
const TIEU_DE = /^\s*\d+\.\s*HUY[EỆ]T\s+([^(\n]+)\(([\s\S]*?)\)\s*$/gm;
// Sách dùng ký hiệu Đức/Anh không đều nhau giữa các kinh — đã dò tay từng kinh trên PDF thật:
// Thận "Ni/KID" (Niere), Tam Tiêu "SJ/TB" (San Jiao/Triple Burner), Can "Le/Liv" (Leber/Liver),
// Nhâm mạch chỉ ghi "Ren" (không có vế Đức, không có dấu '/').
const DOI_MA = { LU: "LU", LI: "LI", ST: "ST", SP: "SP", HE: "HT", HT: "HT", SI: "SI",
  BL: "BL", KI: "KI", KID: "KI", PC: "PC", TE: "TE", TB: "TE", GB: "GB",
  LR: "LR", LIV: "LR", CV: "CV", REN: "CV", GV: "GV" };

function docMa(trongNgoac) {
  // "中府zhongfu - Lu1" | "Shangyang 商陽 - Di/Li 1" | "Dü/SI 3"
  const m = /([A-Za-zÜü/]{2,7})\s*[-–]?\s*(\d{1,2})\s*$/.exec(trongNgoac.trim())
    || /([A-Za-zÜü/]{2,7})\s*(\d{1,2})/.exec(trongNgoac);
  if (!m) return null;
  // Ký hiệu Đức ghép Anh: LẤY VẾ SAU dấu '/' (vế tiếng Anh). "Dü/SI" → "SI", KHÔNG phải "DU".
  const ve = m[1].includes("/") ? m[1].split("/").pop() : m[1];
  const kinh = DOI_MA[ve.toUpperCase()];
  return kinh ? kinh + Number(m[2]) : null;
}

// Mục cần lấy: thường là "d) Tác dụng/chỉ định chính" nhưng một số huyệt (VD Huyết Hải Mi/SP 10,
// Đại Lăng Pe/Pc 7, Trung Độc Gb 32) sách in THIẾU chữ cái đầu mục — chỉ còn "Tác dụng/chỉ định
// chính" trơ trọi đầu dòng — nên vế "[a-z]\)" phải là TUỲ CHỌN, không bắt buộc.
const TAC_DUNG = /(?:^|\n)\s*(?:[a-z]\)\s*)?T[áa]c d[uụ]ng[^\n]*\n([\s\S]*?)(?=\n\s*[a-z]\)|\n\s*\d+\.\s*HUY|$)/i;

const hoso = [];
for (let i = 0; i < trang.length; i++) {
  TIEU_DE.lastIndex = 0;
  let m;
  while ((m = TIEU_DE.exec(trang[i]))) {
    const ma = docMa(m[2]);
    if (!ma) continue;
    // Mục tác dụng có thể tràn sang trang sau → ghép hai trang rồi mới dò.
    const than = trang[i].slice(m.index) + "\n" + (trang[i + 1] || "");
    const t = TAC_DUNG.exec(than);
    if (!t) continue;
    const dong = t[1].split("\n").map((x) => x.replace(/^[●•\-\s]+/, "").trim())
      .filter((x) => x && !/^Ph[uù]ng V[aă]n Chi[eế]n|^HUY[EỆ]T V[iị]|^\d+$/.test(x));
    if (!dong.length) continue;
    if (!hoso.some((x) => x.ma === ma)) {
      hoso.push({ ma, ten: m[1].trim(), trang: i + 1, tacDung: dong, nguyenVan: t[1].trim() });
    }
  }
}

console.log(`Bóc được ${hoso.length} huyệt có mục tác dụng.`);
if (chiThu) {
  for (const x of hoso.slice(0, 5)) console.log(`  ${x.ma.padEnd(5)} tr${String(x.trang).padStart(3)}  ${x.tacDung[0].slice(0, 70)}`);
  const kinh = {};
  for (const x of hoso) { const k = x.ma.match(/^[A-Z]+/)[0]; kinh[k] = (kinh[k] || 0) + 1; }
  console.log("  theo kinh:", JSON.stringify(kinh));
  process.exit(0);
}

mkdirSync(RA, { recursive: true });
writeFileSync(resolve(RA, "hoso.json"), JSON.stringify(hoso, null, 1));
console.log(`→ ${resolve(RA, "hoso.json")}`);
console.log("Người duyệt đọc tệp này, sửa trường tacDung, rồi chạy nap-hoso-focks.mjs.");
