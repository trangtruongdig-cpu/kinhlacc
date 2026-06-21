// organArt.ts — Minh hoạ tạng phủ Đông Y bằng SVG path tô màu, có khối.
//
// Mỗi tạng phủ = nhiều lớp path tô màu, xếp chồng → minh hoạ có khối, có màu giải phẫu.
// viewBox CHUNG: 0 0 64 64. Vẽ tạng phủ căn giữa, chừa lề ~6px.
//
// Cách dùng (gợi ý): với mỗi tạng, lặp qua mảng layer và render <path> theo thứ tự
// (lớp đầu là nền, các lớp sau chồng lên để tạo bóng/highlight/nét chi tiết).
export interface OrganLayer {
  d: string
  fill?: string // màu tô (hex). Bỏ trống nếu chỉ vẽ nét (stroke).
  opacity?: number // 0..1, mặc định 1
  stroke?: string // màu nét (hex) nếu cần
  sw?: number // bề rộng nét (stroke-width), mặc định không vẽ nét
}

export const ORGAN_ART: Record<string, OrganLayer[]> = {
  // TÂM — Tim: hai tâm nhĩ phồng phía trên, mỏm tim nhọn phía dưới, đỏ thẫm.
  Tâm: [
    {
      // nền: hình trái tim giải phẫu (hai bướu nhĩ trên, thuôn xuống mỏm)
      d: 'M32 17 C26 10 14 11 13 22 C12 31 18 39 32 53 C46 39 52 31 51 22 C50 11 38 10 32 17 Z',
      fill: '#c0392b',
    },
    {
      // bóng: nửa dưới-phải tối hơn cho cảm giác khối
      d: 'M32 22 C36 16 47 14 51 23 C52 32 46 39 32 53 C40 41 44 32 42 26 C40 21 35 21 32 22 Z',
      fill: '#9e2a1e',
      opacity: 0.85,
    },
    {
      // highlight: vệt sáng trên bướu nhĩ trái
      d: 'M19 18 C16 19 15 23 16 27 C19 24 21 21 23 19 C22 18 20 17 19 18 Z',
      fill: '#ffffff',
      opacity: 0.25,
    },
    {
      // nét động mạch chủ / mạch lớn phía trên
      d: 'M30 17 C29 12 31 9 34 8 M38 18 C40 13 43 12 45 13',
      stroke: '#8a241a',
      sw: 1.6,
    },
  ],

  // TÂM BÀO — Màng ngoài tim: quả tim nằm trong túi màng hồng nhạt trong suốt.
  'Tâm bào': [
    {
      // túi màng bao quanh (mờ, hồng nhạt) — hơi to hơn quả tim
      d: 'M32 12 C23 5 8 7 7 21 C6 32 14 41 32 58 C50 41 58 32 57 21 C56 7 41 5 32 12 Z',
      fill: '#e7b7b0',
      opacity: 0.5,
    },
    {
      // quả tim bên trong
      d: 'M32 19 C27 13 16 14 15 23 C14 31 19 38 32 50 C45 38 50 31 49 23 C48 14 37 13 32 19 Z',
      fill: '#c0392b',
    },
    {
      // bóng nửa dưới tim
      d: 'M32 23 C35 18 45 17 48 24 C49 31 44 38 32 50 C39 40 42 32 41 27 C39 23 35 23 32 23 Z',
      fill: '#9e2a1e',
      opacity: 0.8,
    },
    {
      // highlight trên màng túi
      d: 'M14 17 C11 19 10 24 12 28 C15 24 18 21 20 19 C18 17 16 16 14 17 Z',
      fill: '#ffffff',
      opacity: 0.25,
    },
    {
      // viền túi màng (nét mảnh)
      d: 'M32 12 C23 5 8 7 7 21 C6 32 14 41 32 58 C50 41 58 32 57 21 C56 7 41 5 32 12',
      stroke: '#d59a92',
      sw: 1,
    },
  ],

  // PHẾ — Phổi: hai thuỳ hồng đối xứng, khí quản nâu ở giữa.
  Phế: [
    {
      // thuỳ trái
      d: 'M30 16 C30 14 27 13 24 14 C16 17 11 26 11 38 C11 48 16 54 24 53 C29 52 30 48 30 42 Z',
      fill: '#e39a9a',
    },
    {
      // thuỳ phải
      d: 'M34 16 C34 14 37 13 40 14 C48 17 53 26 53 38 C53 48 48 54 40 53 C35 52 34 48 34 42 Z',
      fill: '#e39a9a',
    },
    {
      // bóng đáy hai thuỳ (tối hơn)
      d: 'M14 40 C16 49 21 53 26 52 C29 51 30 48 30 44 C24 47 18 45 14 40 Z M50 40 C48 49 43 53 38 52 C35 51 34 48 34 44 C40 47 46 45 50 40 Z',
      fill: '#c97c7c',
      opacity: 0.8,
    },
    {
      // highlight đỉnh thuỳ trái
      d: 'M21 19 C18 21 16 25 16 29 C19 25 22 22 25 20 C24 19 22 18 21 19 Z',
      fill: '#ffffff',
      opacity: 0.25,
    },
    {
      // khí quản + hai nhánh phế quản
      d: 'M32 6 L32 18 M32 18 C30 19 27 20 25 22 M32 18 C34 19 37 20 39 22',
      fill: '#c98b6b',
      stroke: '#c98b6b',
      sw: 3,
    },
  ],

  // CAN — Gan: khối lớn nâu đỏ, thuỳ phải to, thuỳ trái nhỏ, rãnh chia ở trên.
  Can: [
    {
      // nền: khối gan, mặt trên gần thẳng, đáy cong
      d: 'M8 22 C20 17 44 17 56 21 C57 30 52 42 38 47 C28 50 16 47 11 38 C8 33 7 27 8 22 Z',
      fill: '#8e4b3a',
    },
    {
      // bóng đáy gan
      d: 'M11 33 C18 44 30 49 40 46 C50 42 55 33 56 27 C53 38 46 45 36 47 C24 50 15 44 11 33 Z',
      fill: '#6f3528',
      opacity: 0.85,
    },
    {
      // highlight mặt trên trái
      d: 'M14 23 C20 21 28 20 34 21 C28 23 21 24 16 26 C15 25 14 24 14 23 Z',
      fill: '#ffffff',
      opacity: 0.22,
    },
    {
      // rãnh dây chằng liềm chia thuỳ
      d: 'M30 19 C30 26 29 31 27 36',
      stroke: '#6f3528',
      sw: 1.6,
    },
  ],

  // ĐỞM — Túi mật: quả lê nhỏ màu xanh, có cổ ống mật ở trên.
  Đởm: [
    {
      // thân túi mật (quả lê)
      d: 'M32 26 C24 27 21 35 24 44 C26 51 33 55 38 51 C44 46 44 35 40 29 C38 26 35 25 32 26 Z',
      fill: '#5fa153',
    },
    {
      // bóng đáy túi
      d: 'M25 41 C27 50 34 54 39 50 C43 46 44 39 43 34 C42 43 37 49 31 49 C28 49 26 46 25 41 Z',
      fill: '#467a3d',
      opacity: 0.85,
    },
    {
      // highlight thân
      d: 'M28 30 C25 33 24 38 25 42 C27 37 29 33 32 31 C31 30 29 29 28 30 Z',
      fill: '#ffffff',
      opacity: 0.28,
    },
    {
      // cổ + ống mật cong lên
      d: 'M33 26 C34 21 31 17 26 16',
      stroke: '#467a3d',
      sw: 2.2,
    },
  ],

  // TỲ — Lách: hình hạt đậu dài tím-mận, hơi xiên.
  Tỳ: [
    {
      // nền: hạt đậu nghiêng
      d: 'M18 20 C11 26 11 38 17 45 C24 53 36 53 44 46 C50 41 50 33 45 28 C39 22 27 14 18 20 Z',
      fill: '#7e3b57',
    },
    {
      // bóng cạnh dưới (mặt lõm)
      d: 'M19 44 C27 52 38 51 45 45 C49 41 50 35 48 30 C47 38 42 45 34 47 C28 48 23 47 19 44 Z',
      fill: '#5f2a41',
      opacity: 0.85,
    },
    {
      // highlight cạnh trên
      d: 'M21 22 C28 18 36 20 42 25 C36 23 29 24 24 27 C22 25 21 23 21 22 Z',
      fill: '#ffffff',
      opacity: 0.22,
    },
    {
      // rãnh rốn lách
      d: 'M24 38 C30 41 38 40 43 36',
      stroke: '#5f2a41',
      sw: 1.4,
    },
  ],

  // VỊ — Dạ dày: túi hình chữ J, phình lớn trên-trái, thuôn về môn vị dưới-phải.
  Vị: [
    {
      // nền: thân dạ dày hình J
      d: 'M22 12 C14 13 11 22 13 32 C15 42 23 50 33 50 C41 50 46 45 45 39 C44 35 40 34 38 38 C37 41 33 42 30 40 C24 36 22 28 23 21 C24 16 27 14 31 14 C27 12 24 12 22 12 Z',
      fill: '#d98f7a',
    },
    {
      // bóng bờ cong lớn (đáy-trái)
      d: 'M14 30 C16 42 24 49 33 49 C38 49 42 46 43 42 C40 45 35 46 30 44 C22 41 17 35 15 28 C14 28 14 29 14 30 Z',
      fill: '#bd7361',
      opacity: 0.85,
    },
    {
      // highlight phình vị
      d: 'M21 16 C17 19 16 25 17 30 C19 24 22 19 26 17 C25 15 23 15 21 16 Z',
      fill: '#ffffff',
      opacity: 0.25,
    },
    {
      // môn vị nối tá tràng (nét ngắn)
      d: 'M45 40 C49 41 52 44 53 48',
      stroke: '#bd7361',
      sw: 2.4,
    },
  ],

  // TIỂU TRƯỜNG — Ruột non: nhiều quai cuộn lồng nhau, hồng.
  'Tiểu Trường': [
    {
      // nền: khối quai ruột (đường biên ngoài bo tròn)
      d: 'M14 18 C9 24 9 34 13 42 C18 51 30 54 41 50 C51 46 55 36 51 27 C47 18 36 14 26 16 C22 16 17 16 14 18 Z',
      fill: '#e3a58e',
    },
    {
      // bóng đáy khối
      d: 'M12 36 C15 48 28 53 40 49 C49 46 53 38 53 31 C51 40 43 47 33 48 C24 49 16 45 12 36 Z',
      fill: '#c98571',
      opacity: 0.8,
    },
    {
      // các quai cuộn (nét lượn sóng lồng nhau)
      d: 'M18 26 C24 22 32 24 36 30 C40 36 36 43 29 44 C23 45 18 41 18 35 M22 30 C26 28 31 30 33 34 M24 38 C28 40 33 39 36 36',
      stroke: '#b9745f',
      sw: 1.6,
    },
    {
      // highlight quai trên-trái
      d: 'M19 22 C16 25 15 30 16 34 C18 29 21 25 25 23 C24 22 21 21 19 22 Z',
      fill: '#ffffff',
      opacity: 0.22,
    },
  ],

  // ĐẠI TRƯỜNG — Ruột già: khung đại tràng hình chữ U ngược (lên–ngang–xuống), nâu vàng.
  'Đại Trường': [
    {
      // nền: ống đại tràng dày dạng U ngược
      d: 'M14 50 C12 50 11 49 11 47 L11 22 C11 14 17 9 25 9 L39 9 C47 9 53 14 53 22 L53 47 C53 49 52 50 50 50 C48 50 47 49 47 47 L47 23 C47 18 43 15 38 15 L26 15 C21 15 17 18 17 23 L17 47 C17 49 16 50 14 50 Z',
      fill: '#c89a5e',
    },
    {
      // bóng cạnh trong + đoạn ngang trên
      d: 'M17 23 C17 18 21 15 26 15 L38 15 C43 15 47 18 47 23 L47 28 C46 22 42 19 37 19 L27 19 C22 19 18 22 18 28 Z',
      fill: '#a87f45',
      opacity: 0.85,
    },
    {
      // ngấn haustra (nét chia múi trên thành ruột)
      d: 'M14 28 L11 28 M14 38 L11 38 M50 28 L53 28 M50 38 L53 38 M22 11 L22 15 M42 11 L42 15',
      stroke: '#a87f45',
      sw: 1.4,
    },
    {
      // highlight đỉnh trái
      d: 'M14 18 C13 22 13 27 13 31 C15 26 16 21 18 18 C17 17 15 17 14 18 Z',
      fill: '#ffffff',
      opacity: 0.2,
    },
  ],

  // THẬN — Hai quả thận hình hạt đậu, nâu đỏ, lõm rốn thận hướng vào trong.
  Thận: [
    {
      // thận trái
      d: 'M24 16 C17 15 11 21 11 31 C11 41 17 49 25 48 C30 47 31 43 30 38 C29 35 26 35 26 32 C26 29 29 29 30 26 C31 21 30 17 24 16 Z',
      fill: '#7c4a3c',
    },
    {
      // thận phải
      d: 'M40 16 C47 15 53 21 53 31 C53 41 47 49 39 48 C34 47 33 43 34 38 C35 35 38 35 38 32 C38 29 35 29 34 26 C33 21 34 17 40 16 Z',
      fill: '#7c4a3c',
    },
    {
      // bóng đáy hai quả
      d: 'M12 33 C13 43 19 49 26 47 C30 46 31 43 30 39 C28 44 23 46 19 44 C15 42 13 38 12 33 Z M52 33 C51 43 45 49 38 47 C34 46 33 43 34 39 C36 44 41 46 45 44 C49 42 51 38 52 33 Z',
      fill: '#5e372c',
      opacity: 0.85,
    },
    {
      // highlight cạnh ngoài thận trái
      d: 'M18 20 C14 23 13 29 14 34 C16 28 19 23 23 21 C22 20 20 19 18 20 Z',
      fill: '#ffffff',
      opacity: 0.22,
    },
    {
      // rốn thận (nét lõm) + niệu quản gợi ý
      d: 'M30 32 C27 32 26 31 26 30 M34 32 C37 32 38 31 38 30 M27 46 C27 52 28 56 30 58 M37 46 C37 52 36 56 34 58',
      stroke: '#5e372c',
      sw: 1.4,
    },
  ],

  // BÀNG QUANG — Bàng quang: túi tròn vàng nhạt, có cổ ngắn ở đáy.
  'Bàng quang': [
    {
      // nền: túi bàng quang bầu, đỉnh hơi nhọn
      d: 'M32 14 C22 16 14 25 15 36 C16 46 23 52 32 52 C41 52 48 46 49 36 C50 25 42 16 32 14 Z',
      fill: '#d8c878',
    },
    {
      // bóng đáy túi
      d: 'M16 36 C17 47 24 52 32 52 C40 52 47 47 48 36 C45 45 39 49 32 49 C25 49 19 45 16 36 Z',
      fill: '#b8a857',
      opacity: 0.85,
    },
    {
      // highlight đỉnh trái
      d: 'M26 19 C21 22 17 28 17 34 C20 28 24 23 30 21 C29 19 27 18 26 19 Z',
      fill: '#ffffff',
      opacity: 0.28,
    },
    {
      // cổ bàng quang (niệu đạo) ngắn ở đáy
      d: 'M32 52 L32 58 M29 55 L35 55',
      stroke: '#b8a857',
      sw: 2.4,
    },
  ],

  // TAM TIÊU — Tam tiêu (thượng/trung/hạ tiêu): khối bo tròn chia 3 tầng ngang, ấm→mát.
  'Tam tiêu': [
    {
      // thượng tiêu (tầng trên) — ấm nhất
      d: 'M16 12 C24 9 40 9 48 12 C50 15 50 19 48 23 C40 21 24 21 16 23 C14 19 14 15 16 12 Z',
      fill: '#d98f5a',
    },
    {
      // trung tiêu (tầng giữa)
      d: 'M16 24 C24 22 40 22 48 24 C50 28 50 32 48 36 C40 34 24 34 16 36 C14 32 14 28 16 24 Z',
      fill: '#d9b06a',
    },
    {
      // hạ tiêu (tầng dưới) — mát hơn, đáy bo tròn
      d: 'M16 37 C24 35 40 35 48 37 C50 42 49 48 44 52 C38 56 26 56 20 52 C15 48 14 42 16 37 Z',
      fill: '#b0c6a0',
    },
    {
      // bóng đáy hạ tiêu
      d: 'M17 44 C19 51 26 55 32 55 C38 55 45 51 47 44 C44 50 38 53 32 53 C26 53 20 50 17 44 Z',
      fill: '#94ab84',
      opacity: 0.8,
    },
    {
      // highlight tầng trên
      d: 'M20 13 C17 15 16 18 17 21 C22 17 30 15 38 15 C32 13 25 12 20 13 Z',
      fill: '#ffffff',
      opacity: 0.25,
    },
    {
      // hai nét phân tầng
      d: 'M16 23 C24 21 40 21 48 23 M16 36 C24 34 40 34 48 36',
      stroke: '#a9743f',
      sw: 1.2,
    },
  ],
}
