/**
 * nhht-cong-thuc.mjs — SINH bộ công thức Ngũ Hành Hồi Tác từ engine, và ĐỐI CHIẾU với
 * hai nguồn độc lập để bộ công thức không trôi:
 *   ① Từ điển 1058 huyệt của app (public/kinhmach3d/data/acupoints.js) — nhãn "Huyệt Bổ/Tả"
 *      (Nạn Kinh 69) và nhãn "Huyệt Nguyên/Huyệt Lạc" trong mục ĐẶC TÍNH.
 *   ② Bảng 24 mô hình NHHT nhập tay trong views/PhacDoDieuTriView.vue.
 *
 * Chạy:  node scripts/nhht-cong-thuc.mjs            (chỉ kiểm, in báo cáo)
 *        node scripts/nhht-cong-thuc.mjs --xuat     (kiểm + ghi file JSON bộ công thức)
 */
import { createJiti } from 'jiti'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const jiti = createJiti(import.meta.url)

const { phuongChamNen } = await jiti.import(path.join(root, 'src/lib/nguHanhHoiTac.ts'))
const { KINH } = await jiti.import(path.join(root, 'src/lib/nguDuHuyet.ts'))
const { KHUNG_ALL, KHUNG_TEN } = await jiti.import(path.join(root, 'src/lib/khungNHHT.ts'))
const { NGUYEN_LAC, LAC_NGOAI_KINH } = await jiti.import(path.join(root, 'src/lib/nguyenLac.ts'))

const KINH_ALL = Object.keys(KINH)
let loi = 0
const bao = (ok, msg) => { if (!ok) loi++; console.log(`${ok ? '  ok ' : '  ✗  '} ${msg}`) }

// ── SINH bộ công thức: 12 kinh × {hư, thực} × 5 khung ──────────────────────
const congThuc = []
for (const kinh of KINH_ALL) {
  for (const thuc of [false, true]) {
    for (const khung of KHUNG_ALL) {
      const pc = phuongChamNen({ kinhGoc: kinh, thuc, khung })
      if (!pc) { console.log(`✗ không sinh được: ${kinh} ${thuc ? 'thực' : 'hư'} ${khung}`); loi++; continue }
      congThuc.push({
        ma: `NHHT-${kinh}-${thuc ? 'THUC' : 'HU'}-${khung}`.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').replace(/\s+/g, '').toUpperCase(),
        kinh, hanh: pc.goc.hanhTen, trangThai: thuc ? 'thực' : 'hư', khung, khungTen: KHUNG_TEN[khung],
        kinhBan: pc.khung.partner,
        chiDao: pc.chiDao,
        menhLenh: pc.menhLenh.map((m) => ({ bac: m.bac, tacDong: m.tacDong, hanh: m.hanhTen, kinh: m.kinh, huyet: m.huyet, vaiTro: m.vaiTroHuyet, phap: m.phap })),
        // Kèm LÝ LUẬN: trang Kết Quả Đo hiện câu này cho thầy thuốc, nên nó phải nằm trong công
        // thức — không để nơi dùng tự ghép lại, sẽ lại thành hai cách diễn đạt khác nhau.
        huyetNguDu: pc.huyetNguDu && { bo: pc.huyetNguDu.bo, ta: pc.huyetNguDu.ta, giaiThich: pc.huyetNguDu.giaiThich },
        huyetNanKinh: pc.huyetNanKinh && { ...pc.huyetNanKinh.targetHuyet, giaiThich: pc.huyetNanKinh.giaiThich },
        huyetNguyenLac: pc.huyetNguyenLac && {
          chuKinh: pc.huyetNguyenLac.chu.kinh, nguyen: pc.huyetNguyenLac.chu.huyet,
          khachKinh: pc.huyetNguyenLac.khach.kinh, lac: pc.huyetNguyenLac.khach.huyet,
          giaiThich: pc.huyetNguyenLac.giaiThich,
        },
        phapCoDien: pc.phapCoDien.map((p) => ({ id: p.id, ten: p.ten, han: p.han, coChe: p.coChe, nguon: p.nguon })),
      })
    }
  }
}
console.log(`\nSINH: ${congThuc.length} công thức (${KINH_ALL.length} kinh × 2 trạng thái × ${KHUNG_ALL.length} khung)\n`)

// ── Đọc từ điển huyệt của app (nguồn độc lập ①) ────────────────────────────
const dictSrc = fs.readFileSync(path.join(root, 'public/kinhmach3d/data/acupoints.js'), 'utf8')
const dict = JSON.parse(dictSrc.slice(dictSrc.indexOf('{'), dictSrc.lastIndexOf('}') + 1))
const norm = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const dictBy = new Map(dict.records.map((r) => [norm(r.ten), r]))

console.log('① ĐỐI CHIẾU TỪ ĐIỂN APP — huyệt Bổ/Tả (Nạn Kinh 69):')
for (const kinh of KINH_ALL) {
  for (const thuc of [false, true]) {
    const pc = phuongChamNen({ kinhGoc: kinh, thuc })
    const h = pc.huyetNanKinh?.targetHuyet
    if (!h) continue
    const rec = dictBy.get(norm(h.huyet))
    const nhan = rec ? (rec.noiDung.match(/Huyệt (Bổ|Tả)[^\n]{0,60}/) || [])[0] : null
    if (!nhan) continue // từ điển không ghi nhãn cho huyệt này — không kết luận
    const muon = thuc ? 'Tả' : 'Bổ'
    // Một số mục chỉ ghi "Huyệt Bổ." không kèm tên kinh (Khúc tuyền, Trung xung) — khi đó chỉ
    // đối chiếu được HƯỚNG bổ/tả; huyệt vốn đã lấy từ chính kinh ấy nên không cần so tên kinh.
    const kinhTrongNhan = (nhan.match(/của kinh (?:chính )?([^.]+)/) || [])[1]
    const khop = nhan.startsWith(`Huyệt ${muon}`) && (!kinhTrongNhan || norm(kinhTrongNhan) === norm(kinh))
    bao(khop, `${kinh} ${thuc ? 'thực→tả tử' : 'hư→bổ mẫu'} = ${h.huyet} | từ điển: "${nhan}"${kinhTrongNhan ? '' : ' (nhãn không nêu kinh — chỉ đối chiếu hướng)'}`)
  }
}

console.log('\n① ĐỐI CHIẾU TỪ ĐIỂN APP — huyệt Nguyên & Lạc:')
for (const [kinh, { nguyen, lac }] of Object.entries(NGUYEN_LAC)) {
  for (const [h, vai, re] of [[nguyen, 'Nguyên', /[Hh]uyệt\s+(Du\s*[–\-+,]?\s*)?Nguyên/], [lac, 'Lạc', /[Hh]uyệt\s+(Đại\s+)?Lạc|Lạc\s+huyệt/]]) {
    const rec = dictBy.get(norm(h.ten))
    bao(!!rec && re.test(rec.noiDung), `${kinh} · ${vai} = ${h.ten} (${h.ma})`)
    // số thứ tự huyệt trên kinh phải khớp phần số của mã quốc tế
    const so = (h.ma.match(/\d+/) || [])[0]
    const mTT = rec && rec.noiDung.match(/[Hh]uyệt\s+[Tt]hứ\s+(\d+)/)
    if (mTT) bao(mTT[1] === so, `   ↳ số thứ tự trên kinh: từ điển ${mTT[1]} ↔ mã ${h.ma}`)
  }
}
for (const { chu, lac } of LAC_NGOAI_KINH) {
  const rec = dictBy.get(norm(lac.ten))
  bao(!!rec && /[Hh]uyệt\s+(Đại\s+)?Lạc/.test(rec.noiDung), `${chu} · Lạc = ${lac.ten} (${lac.ma})`)
}

// ── Đối chiếu bảng 24 mô hình nhập tay trong view (nguồn ②) ────────────────
console.log('\n② ĐỐI CHIẾU BẢNG NHẬP TAY trong PhacDoDieuTriView.vue:')
const vue = fs.readFileSync(path.join(root, 'src/views/PhacDoDieuTriView.vue'), 'utf8')
const rows = [...vue.matchAll(/\{ code: '(NHHT-[^']+)'[^}]*?organ: '([^']+)', type: '(hu|thuc)'[^}]*?bm: '(?:Bổ Mẫu|Tả Tử): ([^(]+)\(/g)]
console.log(`   (đọc được ${rows.length} bản ghi)`)
for (const [, code, organ, type, huyetTay] of rows) {
  const pc = phuongChamNen({ kinhGoc: organ, thuc: type === 'thuc' })
  const engine = pc?.huyetNanKinh?.targetHuyet?.huyet
  const khop = norm(engine) === norm(huyetTay)
  bao(khop, `${code}: nhập tay "${huyetTay.trim()}" ${khop ? '=' : '≠'} engine "${engine}"`)
}

if (process.argv.includes('--xuat')) {
  // Xuất DUY NHẤT một nơi: backend/src/data (theo lối thuong-han-chuan.ts) — backend seed vào DB,
  // frontend đọc qua API. Không để thêm bản JSON bên frontend, tránh hai nơi trôi khỏi nhau.
  const out = path.resolve(root, '../backend/src/data/nhht-cong-thuc.ts')
  const head = [
    '// TỆP SINH TỰ ĐỘNG — ĐỪNG SỬA TAY.',
    '// Nguồn: frontend/src/lib/nguHanhHoiTac.ts (engine luận Ngũ Hành Hồi Tác).',
    '// Sinh lại: cd frontend && node scripts/nhht-cong-thuc.mjs --xuat',
    '// Muốn đổi một công thức cho riêng phòng chẩn trị thì SỬA TRÊN APP (ghi đè lưu ở DB),',
    '// đổi ở đây là đổi bộ chuẩn cho mọi nơi.',
    '',
    'export interface NhhtCongThuc {',
    '  ma: string; kinh: string; hanh: string; trangThai: string; khung: string; khungTen: string;',
    '  kinhBan: string; chiDao: string;',
    '  menhLenh: Array<{ bac: string; tacDong: string; hanh: string; kinh: string; huyet: string | null; vaiTro: string | null; phap: string }>;',
    '  huyetNguDu: { bo: Record<string, unknown>; ta: Record<string, unknown>; giaiThich: string } | null;',
    '  huyetNanKinh: Record<string, unknown> | null;',
    '  huyetNguyenLac: { chuKinh: string; nguyen: { ten: string; ma: string }; khachKinh: string; lac: { ten: string; ma: string }; giaiThich: string } | null;',
    '  phapCoDien: Array<{ id: string; ten: string; han: string; coChe: string; nguon: string }>;',
    '}',
    '',
  ].join('\n')
  const body = `export const NHHT_SINH_LUC = '${new Date().toISOString().slice(0, 10)}';\n\n`
    + `export const NHHT_CONG_THUC: NhhtCongThuc[] = ${JSON.stringify(congThuc, null, 2)};\n`
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, head + body)
  console.log(`\nĐÃ XUẤT → ${path.relative(path.resolve(root, '..'), out)} (${congThuc.length} công thức)`)
}

console.log(`\n${loi === 0 ? '✓ TẤT CẢ PHÉP KIỂM ĐỀU QUA' : `✗ ${loi} phép kiểm KHÔNG qua`}`)
process.exit(loi === 0 ? 0 : 1)
