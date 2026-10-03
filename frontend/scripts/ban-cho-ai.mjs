// BẢN CHO MÁY ĐỌC — thứ trợ lý AI thật sự tải về khi người dùng bấm nút "hỏi AI".
//
// ⚠️ ĐÂY MỚI LÀ VIỆC CHÍNH, nút chỉ là cái cửa. Bấm nút mà trỏ vào trang HTML thì trợ lý nhận
// về cả thanh điều hướng, CSS, khối ảnh 3D, mục lục từ điển, chân trang — rồi tự đoán đâu là
// nội dung. Đoán trúng thì nó trích đúng; đoán trật thì nó trích nhầm hoặc bỏ qua. Mình không
// kiểm soát được gì.
//
// Nên mỗi trang xuất thêm MỘT bản Markdown sạch ở `<đường dẫn>/index.md`, và nút trỏ vào đó.
// Bản này là thứ MÌNH CHỌN để mớm: câu trả lời trực tiếp lên trước, sự kiện tra cứu được, FAQ
// (vốn đã tự khớp theo câu người ta gõ thật), nguồn y văn, và đường về trang gốc để trợ lý dẫn
// nguồn đúng chỗ.
//
// ⚠️ THỨ TỰ LÀ NỘI DUNG. Trợ lý trích phần ĐẦU nhiều hơn hẳn phần sau, nên dòng đầu phải trả
// lời đúng dạng hỏi đông nhất. Đo 03/10/2026: 70% truy vấn là tra tên, 25% hỏi vị trí — nên
// bản này mở bằng "X là gì, mã gì, thuộc kinh nào, nằm ở đâu", không mở bằng lời dẫn nhập.
//
// ⚠️ KHÔNG BỊA, KHÔNG THÊM. Mọi dòng ở đây đều là chữ đã có trên trang HTML. Bản cho máy mà
// khác bản cho người là tự đặt bẫy: trợ lý dẫn một câu mà người đọc vào không thấy.

/** Gộp khoảng trắng, bỏ xuống dòng thừa — Markdown một dòng cho mỗi ý. */
const gon = (s) =>
  String(s ?? '')
    .replace(/\s+/g, ' ')
    .trim()

/** Thoát ký tự làm vỡ Markdown ở đầu dòng. */
const an = (s) => gon(s).replace(/^([#>*-])/, '\\$1')

/**
 * @param {{tieuDe, url, loai, matTruoc: [string,string][], mucNoiDung: [string,string][],
 *          faq: {q,a}[], nguon?: {ten,duong}[], ngayCapNhat?: string}} p
 *   `matTruoc`: các cặp (nhãn, giá trị) trả lời ngay — mã WHO, đường kinh, vị trí…
 */
export function banChoAi({ tieuDe, url, loai = '', matTruoc = [], mucNoiDung = [], faq = [], nguon = [], ngayCapNhat = '' }) {
  const d = []
  d.push(`# ${an(tieuDe)}`, '')
  // Dòng NGUỒN đứng ngay sau tiêu đề: trợ lý nào cũng đọc phần đầu, và đây là chỗ nó lấy link
  // để dẫn nguồn. Đặt ở chân bài là mời nó dẫn thiếu.
  d.push(`> Nguồn: ${url} — Kinh Lạc Trương Gia${loai ? ` · ${an(loai)}` : ''}${ngayCapNhat ? ` · cập nhật ${an(ngayCapNhat)}` : ''}`, '')
  if (matTruoc.length) {
    d.push('## Trả lời nhanh', '')
    for (const [nhan, gt] of matTruoc) if (gt) d.push(`- **${an(nhan)}:** ${an(gt)}`)
    d.push('')
  }
  for (const [nhan, noi] of mucNoiDung) {
    if (!noi) continue
    d.push(`## ${an(nhan)}`, '', an(noi), '')
  }
  if (faq.length) {
    d.push('## Câu hỏi thường gặp', '')
    for (const f of faq) d.push(`### ${an(f.q)}`, '', an(f.a), '')
  }
  if (nguon.length) {
    d.push('## Y văn dẫn mục này', '')
    for (const n of nguon) d.push(`- ${an(n.ten)}${n.duong ? ` — ${n.duong}` : ''}`)
    d.push('')
  }
  d.push('---', `Bản dành cho máy đọc. Trang đầy đủ cho người đọc: ${url}`)
  return d.join('\n')
}

/**
 * Lời nhắc cho nút "hỏi AI" — trỏ vào BẢN MÁY ĐỌC, không trỏ vào trang HTML.
 * Có dặn dẫn nguồn: trợ lý được nhắc thì dẫn link, không nhắc thì hay tóm tắt chay.
 */
export const loiNhacHoiAi = (urlMd, urlTrang, tieuDe) =>
  `Đọc ${urlMd} rồi tóm tắt giúp tôi: ${tieuDe}. Trả lời ngắn gọn và dẫn nguồn về ${urlTrang}.`
