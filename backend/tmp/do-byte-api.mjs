/**
 * Đo số byte THẬT TRÊN DÂY của các route hay bị báo chậm. Chỉ đọc.
 *
 * ⚠️ Phải đo CÓ NÉN. gzip đã bật sẵn cho mọi route API, nên đo byte thô là tự lừa mình —
 * đã mắc đúng lỗi đó một lần (10/10/2026): tưởng /duoc-lieu nặng 778 KB, thật ra 300 KB.
 *
 * ⚠️ Và KHÔNG dùng `fetch` của Node để đếm: undici TỰ GIẢI NÉN, nên `arrayBuffer().length`
 * trả về đúng con số thô mà ta đang muốn tránh — nó báo 777.920 trong khi dây chỉ tải 300.342.
 * Phải dùng `curl --compressed` và đọc `%{size_download}`.
 *
 *   node tmp/do-byte-api.mjs                                 # đo production
 *   API_GOC=http://localhost:3001 node tmp/do-byte-api.mjs   # đo máy dev
 */
import { execFileSync } from 'node:child_process';

const GOC = process.env.API_GOC || 'https://kinhlac.online/api';

/**
 * Trần đặt theo số đo thật, không phải số tròn cho đẹp.
 *
 * ⚠️ Sửa được thật thì phải HẠ trần xuống theo, không thì chốt hết tác dụng canh chừng.
 * Số đo 10/10/2026 sau khi `findLite` có `select`: 300.284 → 7.362 B (gzip). Trần 15.000 cho
 * gấp đôi dư địa — một lần hồi quy kiểu "quên select" sẽ đẩy nó về hàng trăm nghìn, bắt được ngay.
 *
 * ⚠️ MÁY DEV KHÔNG gzip (nginx mới là nơi nén), nên đo ở localhost sẽ ra số THÔ và luôn vượt
 * trần này. Trần ở đây là trần của production.
 */
const NGUONG = {
  '/duoc-lieu?page=1&limit=40&q=': 15_000,
};

let hong = 0;
for (const [duong, tran] of Object.entries(NGUONG)) {
  // ⚠️ PHẢI kiểm mã HTTP. Lượt chạy 10/10/2026 lúc production trả 502 đã cho ra "✓ 157 B" —
  // xanh rực vì trang lỗi thì nhẹ. Một chốt báo đạt khi hệ thống đang chết còn tệ hơn không có chốt.
  const [ma, soByte] = execFileSync('curl', [
    '-s', '--compressed', '-o', '/dev/null',
    '-w', '%{http_code} %{size_download}', GOC + duong,
  ])
    .toString()
    .trim()
    .split(/\s+/)
    .map(Number);

  if (ma !== 200) {
    hong++;
    console.log(`✗ ${duong}  HTTP ${ma} — KHÔNG đo được, chưa chắc đã nhẹ`);
    continue;
  }
  const n = soByte;
  const dat = n <= tran;
  if (!dat) hong++;
  console.log(
    `${dat ? '✓' : '✗'} ${duong}  ${n.toLocaleString('vi-VN')} B  (trần ${tran.toLocaleString('vi-VN')})`,
  );
}
process.exit(hong ? 1 : 0);
