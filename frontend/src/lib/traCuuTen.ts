import { api } from '@/services/api'

/**
 * traCuuTen — TRA TÊN RIÊNG TRONG Y VĂN RA MỤC TỪ (liên kết chéo từ điển).
 *
 * Nội dung từ điển là văn xuôi, nhắc tên sách ("… (Kim Quỹ Yếu Lược)"),
 * tên bài thuốc ("… gọi là Ích Vị Thăng Dương Thang") và tên vị thuốc giữa
 * câu. Component trình bày biết TRƯỚC chỗ nào là tên riêng (trong ngoặc đơn
 * cuối câu, sau chữ "gọi là") nên chỉ hỏi đúng những cụm đó — không tải cả
 * 13.942 tên bài thuốc về máy người đọc, và không link nhầm "(30g)".
 *
 * Cache cả kết quả RỖNG: một trang hỏi 40 cụm, phần lớn không phải mục từ,
 * hỏi lại mỗi lần render là vô ích.
 */

export type LoaiMuc = 'nguon' | 'bai_thuoc' | 'vi_thuoc'

export interface MucTuDien {
  loai: LoaiMuc
  /** Tên chính thức của mục từ (có thể khác cách viết trong y văn). */
  ten: string
  slug?: string
  id?: number
}

const cache = new Map<string, MucTuDien[]>()
/** Gộp các lời gọi trong cùng một nhịp render thành 1 request. */
let hangCho: { ten: string[]; resolve: () => void; promise: Promise<void> } | null = null

const khoaCache = (ten: string) => ten.trim().toLowerCase()

/**
 * Tra một lô tên. Trả map "tên như trong y văn" -> các mục từ khớp
 * (một tên có thể vừa là nguồn vừa là bài thuốc; nơi gọi chọn theo ngữ cảnh).
 */
export async function traTen(tens: string[]): Promise<Map<string, MucTuDien[]>> {
  const canHoi: string[] = []
  for (const t of tens) {
    const k = khoaCache(t)
    if (!k || k.length < 4) continue
    if (!cache.has(k) && !canHoi.includes(t)) canHoi.push(t)
  }

  if (canHoi.length) {
    if (!hangCho) {
      let resolve!: () => void
      const promise = new Promise<void>((r) => { resolve = r })
      hangCho = { ten: [], resolve, promise }
      // Chờ hết nhịp hiện tại để các component trên cùng trang dồn vào 1 request
      setTimeout(async () => {
        const lo = hangCho
        hangCho = null
        if (!lo) return
        try {
          const res = await api.post<Record<string, MucTuDien[]>>('/tra-cuu/ten', { ten: lo.ten })
          for (const t of lo.ten) cache.set(khoaCache(t), [])
          for (const [ten, mucs] of Object.entries(res || {})) {
            cache.set(khoaCache(ten), Array.isArray(mucs) ? mucs : [])
          }
        } catch {
          // Liên kết chéo là phần THÊM: lỗi mạng thì hiện text thường, không chặn trang.
          for (const t of lo.ten) if (!cache.has(khoaCache(t))) cache.set(khoaCache(t), [])
        }
        lo.resolve()
      }, 0)
    }
    for (const t of canHoi) if (!hangCho.ten.includes(t)) hangCho.ten.push(t)
    await hangCho.promise
  }

  const ra = new Map<string, MucTuDien[]>()
  for (const t of tens) {
    const m = cache.get(khoaCache(t))
    if (m && m.length) ra.set(t, m)
  }
  return ra
}

/** Lấy mục từ theo loại ưu tiên: ngữ cảnh quyết định, không phải thứ tự server trả. */
export function chon(mucs: MucTuDien[] | undefined, uuTien: LoaiMuc[]): MucTuDien | null {
  if (!mucs || !mucs.length) return null
  for (const loai of uuTien) {
    const m = mucs.find((x) => x.loai === loai)
    if (m) return m
  }
  return null
}
