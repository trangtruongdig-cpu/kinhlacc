/**
 * Đường soi KHÔNG tốn tiền API: bot dựng hồ sơ, Claude Code trong phiên đọc và phê.
 *
 * Vì sao có file này: lớp 2 gọi `claude-sonnet-5` qua Yescale tốn tiền thật, trong khi
 * người dùng đã có sẵn một phiên Claude Code mạnh hơn đang mở. Chia vai:
 *   · Lớp 1 (máy quét) vẫn chạy cron 02:00 — miễn phí, không cần mô hình.
 *   · Phần đọc hiểu xếp thành hàng đợi; khi có phiên thì xuất hồ sơ, Claude đọc, phê,
 *     rồi nạp ngược vào bệnh án.
 *
 * ⚠️ Lời phê của Claude Code đi qua ĐÚNG những rào chắn như lời phê của mô hình API:
 * `locLoiPhe` kiểm trích dẫn có khớp NGUYÊN VĂN trong thân bài không, bậc căn cứ 2 bị
 * cấm, điều luật phải có thật. Không nới cho "người nhà" — rào chắn mất tác dụng ngay
 * khi có một đường vòng.
 *
 * Dùng:
 *   npx ts-node tmp/tham-dinh-thu-cong.ts --xuat 5 > /tmp/ho-so.md
 *   npx ts-node tmp/tham-dinh-thu-cong.ts --nap /tmp/loi-phe.json
 */
import { readFileSync } from 'node:fs';
import { Client } from 'pg';
import { rutChu } from '../src/utils/tham-dinh-rut-chu.util';
import { locLoiPhe } from '../src/utils/tham-dinh-loi-phe.util';
import { xepHangDoi, type UngVienSoi } from '../src/utils/tham-dinh-hang-doi.util';
import { apDungCho, type BoLuatVanPhong } from '../src/utils/tham-dinh-luat.util';

function docEnv(d: string): Record<string, string> {
  const t = readFileSync(d, 'utf8');
  const r: Record<string, string> = {};
  const re = /^([A-Za-z_][A-Za-z0-9_]*)=(?:"([\s\S]*?)"|'([\s\S]*?)'|(.*))$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t))) r[m[1]] = m[2] ?? m[3] ?? m[4] ?? '';
  return r;
}

async function moKho(): Promise<Client> {
  const e = docEnv(`${__dirname}/../.env`);
  const c = new Client({
    host: e.CMS_DB_HOST, port: +e.CMS_DB_PORT, user: e.CMS_DB_USER,
    password: e.CMS_DB_PASSWORD, database: e.CMS_DB_NAME,
    ssl: { ca: e.CA_CERTIFICATE, rejectUnauthorized: true },
    query_timeout: 60_000,
  });
  await c.connect();
  return c;
}

async function docBoLuat(c: Client): Promise<BoLuatVanPhong> {
  const r = await c.query<{ phien_ban: number; bo_ap_dung: string[]; dieu: BoLuatVanPhong['dieu'] }>(
    `SELECT phien_ban, bo_ap_dung, dieu FROM td_luat_van_phong
     WHERE da_duyet ORDER BY phien_ban DESC LIMIT 1`,
  );
  if (!r.rows.length) throw new Error('Chưa có bộ luật văn phong ĐÃ DUYỆT.');
  return {
    phienBan: r.rows[0].phien_ban,
    boApDung: r.rows[0].bo_ap_dung || [],
    dieu: r.rows[0].dieu || [],
    daDuyet: true,
  };
}

/** Xuất hồ sơ cho N mục đầu hàng đợi — định dạng để Claude Code đọc thẳng. */
/**
 * Cắt mỗi trường còn ngần này ký tự.
 *
 * ⚠️ Có vì đo thật: xuất 2 mục bệnh học ra hồ sơ 62KB, riêng mục "Tiêu Chảy" đã 30.202 ký
 * tự. Claude Code đọc một hồ sơ như thế là hết chỗ cho việc khác. Cắt làm mất phần cuối
 * bài, nên đây là ĐÁNH ĐỔI chứ không phải cải tiến: soi kỹ cả bài thì xuất 1 mục một lượt
 * với --cat 0.
 */
const CAT_MAC_DINH = 4000;

async function xuat(soLuong: number, cat: number): Promise<void> {
  const c = await moKho();
  try {
    const luat = await docBoLuat(c);
    const cau = await c.query<{ bo: string; cot_than: string[] }>(
      `SELECT bo, cot_than FROM td_cau_hinh`,
    );
    const than = Object.fromEntries(cau.rows.map((x) => [x.bo, x.cot_than]));

    const uv = await c.query<{
      bo: string; ma: string; slug: string; tieu_de: string; do_day: number;
      so_loi_may: number; van_tay_noi_dung: string; van_tay_thay_thuoc: string | null;
    }>(
      `SELECT h.bo, h.ma, h.slug, h.tieu_de, m.do_day,
              (SELECT count(*)::int FROM td_nhan_xet n WHERE n.ho_so_id = h.id AND n.lop = 'may'
                 AND n.kieu NOT IN ('lien_ket_dung_duoc','ten_vi_la')) AS so_loi_may,
              h.van_tay_noi_dung, h.van_tay_thay_thuoc
       FROM td_ho_so h JOIN td_muc m ON m.bo = h.bo AND m.ma = h.ma`,
    );
    const ds: UngVienSoi[] = uv.rows.map((x) => ({
      bo: x.bo, ma: x.ma, slug: x.slug, tieuDe: x.tieu_de,
      doDay: x.do_day || 0, soLoiMay: x.so_loi_may || 0,
      vanTayNoiDung: x.van_tay_noi_dung || '',
      vanTayThayThuoc: x.van_tay_thay_thuoc, diemCoHoiSeo: 0,
    }));
    const hangDoi = xepHangDoi(ds.filter((u) => apDungCho(luat, u.bo)), soLuong);

    console.log(`# Hồ sơ thẩm định — ${hangDoi.length} mục\n`);
    console.log(`Bộ luật văn phong bản ${luat.phienBan}:\n`);
    for (const d of luat.dieu) {
      console.log(`- **[${d.ma}]** (${d.truc}) ${d.noiDung}`);
    }
    console.log('\nLuật cứng khi phê:');
    console.log('1. Mỗi lời phê PHẢI có `trichDan` là NGUYÊN VĂN một đoạn trong bài. Hệ thống');
    console.log('   đối chiếu từng chữ (sau khi gộp khoảng trắng); không khớp là bị LOẠI.');
    console.log('2. Chỉ dùng chữ CÓ TRONG BÀI. Không thêm sự kiện y học từ trí nhớ — bậc 2 bị cấm.');
    console.log('3. Thiếu căn cứ thì ghi "cần người bổ sung" và bỏ trống `deXuat`.');
    console.log('4. Lời phê văn phong phải trỏ `dieuLuat` về một mã có thật ở trên.\n');
    console.log('Viết kết quả ra JSON theo mẫu rồi nạp bằng `--nap`:');
    console.log('```json');
    console.log('[{"ma":"<ma muc>","loiPhe":[{"truong":"vi_tri","kieu":"cau_cut",');
    console.log('  "trichDan":"…","nhanXet":"…","deXuat":"…","bacCanCu":1,"dieuLuat":"BC1"}]}]');
    console.log('```\n');

    for (const u of hangDoi) {
      const cols = than[u.bo] || [];
      const sel = cols.map((t) => `to_jsonb(r.${JSON.stringify(t)}) AS ${JSON.stringify(t)}`).join(', ');
      const r = await c.query<Record<string, unknown>>(
        `SELECT ${sel} FROM ${JSON.stringify('ec_' + u.bo)} r WHERE r.id = $1 LIMIT 1`,
        [u.ma],
      );
      if (!r.rows.length) continue;
      console.log(`\n---\n\n## [${u.bo}] ${u.tieuDe}\n`);
      console.log(`\`ma\`: \`${u.ma}\` · slug \`${u.slug}\` · ${u.doDay} ký tự · ${u.soLoiMay} lỗi máy\n`);
      for (const t of cols) {
        const chu = rutChu(r.rows[0][t]);
        if (!chu.trim()) continue;
        const ra = cat > 0 && chu.length > cat ? `${chu.slice(0, cat)}\n\n…(cắt ${chu.length - cat} ký tự)` : chu;
        console.log(`### ${t}\n${ra}\n`);
      }
    }
  } finally {
    await c.end();
  }
}

/** Nạp lời phê Claude Code đã viết, qua ĐÚNG rào chắn của lớp 2. */
async function nap(duong: string): Promise<void> {
  const tho = JSON.parse(readFileSync(duong, 'utf8')) as Array<{
    ma: string;
    loiPhe: unknown[];
  }>;
  const c = await moKho();
  try {
    const luat = await docBoLuat(c);
    const cau = await c.query<{ bo: string; cot_than: string[] }>(
      `SELECT bo, cot_than FROM td_cau_hinh`,
    );
    const than = Object.fromEntries(cau.rows.map((x) => [x.bo, x.cot_than]));

    let nhan = 0;
    let loai = 0;
    for (const m of tho) {
      const h = await c.query<{ id: number; bo: string; tieu_de: string; van_tay_noi_dung: string }>(
        `SELECT id, bo, tieu_de, van_tay_noi_dung FROM td_ho_so WHERE ma = $1 LIMIT 1`,
        [m.ma],
      );
      if (!h.rows.length) {
        console.log(`✗ không tìm thấy mục ${m.ma}`);
        continue;
      }
      const { id, bo, tieu_de, van_tay_noi_dung } = h.rows[0];
      const cols = than[bo] || [];
      const sel = cols.map((t) => `to_jsonb(r.${JSON.stringify(t)}) AS ${JSON.stringify(t)}`).join(', ');
      const r = await c.query<Record<string, unknown>>(
        `SELECT ${sel} FROM ${JSON.stringify('ec_' + bo)} r WHERE r.id = $1 LIMIT 1`,
        [m.ma],
      );
      const truong: Record<string, string> = {};
      for (const t of cols) truong[t] = rutChu(r.rows[0]?.[t]);

      const loc = locLoiPhe(m.loiPhe, truong, luat);
      nhan += loc.nhan.length;
      loai += loc.loai.length;
      for (const x of loc.loai) console.log(`  ✗ [${tieu_de}] ${x.lyDo}`);

      await c.query('BEGIN');
      try {
        await c.query(
          `UPDATE td_ho_so SET van_tay_thay_thuoc = $2, soi_thay_thuoc_luc = now(),
                               updated_at = now() WHERE id = $1`,
          [id, van_tay_noi_dung],
        );
        await c.query(`DELETE FROM td_nhan_xet WHERE ho_so_id = $1 AND lop = 'thay_thuoc'`, [id]);
        for (const n of loc.nhan) {
          await c.query(
            `INSERT INTO td_nhan_xet
               (ho_so_id, lop, kieu, truong, trich_dan, nhan_xet, de_xuat, bac_can_cu, nang)
             VALUES ($1, 'thay_thuoc', $2, $3, $4, $5, $6, $7, false)`,
            [id, n.kieu, n.truong, n.trichDan, n.nhanXet, n.deXuat, n.bacCanCu],
          );
        }
        await c.query('COMMIT');
        console.log(`✓ ${tieu_de}: nhận ${loc.nhan.length}, loại ${loc.loai.length}`);
      } catch (e) {
        await c.query('ROLLBACK').catch(() => undefined);
        console.log(`✗ ${tieu_de}: ${(e as Error).message}`);
      }
    }
    console.log(`\nTổng: nhận ${nhan} lời phê, loại ${loai}.`);
  } finally {
    await c.end();
  }
}

const [lenh, tham, coCat, giaTriCat] = process.argv.slice(2);
(async () => {
  if (lenh === '--xuat') {
    const cat = coCat === '--cat' ? Number(giaTriCat) : CAT_MAC_DINH;
    await xuat(Number(tham) || 5, Number.isFinite(cat) ? cat : CAT_MAC_DINH);
  }
  else if (lenh === '--nap') await nap(tham);
  else {
    console.log('Dùng: --xuat <số mục> [--cat <ký tự, 0 = không cắt>]  |  --nap <file.json>');
    process.exit(1);
  }
})().catch((e) => {
  console.error(e?.message || e);
  process.exit(1);
});
