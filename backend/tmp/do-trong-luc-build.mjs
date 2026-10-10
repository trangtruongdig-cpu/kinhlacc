/**
 * Bắn /auth/me mỗi giây trong N giây rồi in phân bố. Chỉ đọc, không đụng dữ liệu.
 *
 * Dùng để trả lời đúng MỘT câu: trong lúc deploy build trên VPS, người đang xem web chậm đi
 * bao nhiêu. Đường nền đo 10/10/2026 (máy rỗi): p90 = 41 ms trên 30 mẫu.
 *
 * Chọn /auth/me vì nó KHÔNG chạm cơ sở dữ liệu (401 từ guard) — nên mọi con số vọt lên đều là
 * của tiến trình/CPU, không lẫn với độ trễ Aiven.
 *
 *   GIAY=120 node tmp/do-trong-luc-build.mjs
 */
const GOC = process.env.API_GOC || 'https://kinhlac.online/api';
const GIAY = Number(process.env.GIAY || 180);

const xs = [];
let so502 = 0;
for (let i = 0; i < GIAY; i++) {
  const t0 = Date.now();
  try {
    const res = await fetch(GOC + '/auth/me');
    // ⚠️ PHẢI đếm riêng 5xx. Lượt đo 10/10/2026 báo "hỏng=0" trong khi API thật sự CHẾT suốt
    // 30 giây sau deploy — vì 502 vẫn là một phản hồi hợp lệ với `fetch`, lại còn trả về rất
    // NHANH, nên nó lọt vào thống kê như một mẫu tốt và kéo trung vị xuống.
    if (res.status >= 500) so502 += 1;
    xs.push(Date.now() - t0);
  } catch {
    xs.push(-1);
  }
  await new Promise((r) => setTimeout(r, 1000));
}

const ok = xs.filter((x) => x >= 0).sort((a, b) => a - b);
const p = (q) => ok[Math.min(ok.length - 1, Math.floor(ok.length * q))];
console.log(
  `n=${xs.length}  đứt mạng=${xs.filter((x) => x < 0).length}  máy chủ 5xx=${so502}`,
);
if (!ok.length) { console.log('Không có mẫu nào thành công.'); process.exit(1); }
console.log(
  `min=${ok[0]}ms  trung vị=${p(0.5)}ms  p90=${p(0.9)}ms  p99=${p(0.99)}ms  max=${ok[ok.length - 1]}ms`,
);
