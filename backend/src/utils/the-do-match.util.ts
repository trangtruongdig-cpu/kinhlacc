/**
 * Khớp tên "thể bệnh đo kinh lạc" (benh_dong_y_excel.name) với "thể" bên pháp trị
 * (phap_tri.the_benh) để đồng bộ. Dùng chung cho:
 * - BenhDongYExcelService.syncList() — gợi ý ứng viên tất định (không AI).
 * - AiSuggestService.suggestPhapTriForTheDo() — tiền lọc ứng viên trước khi hỏi AI.
 */

export interface PhapTriNameRow {
  id: number;
  the_benh: string;
}

export interface PhapTriCandidate {
  id: number;
  the_benh: string;
  /** Điểm trùng token (đã cộng thưởng nếu trùng tạng/tên đầy đủ). */
  score: number;
  /** Trùng tên đầy đủ (sau chuẩn hoá). */
  exact: boolean;
}

const STOP = new Set(['the', 'chung', 'benh', 'va', 'hoac', 'kem', 'do']);
/** Tên tạng phủ — trùng tạng được cộng thưởng vì quyết định "thể" Đông Y. */
const ORGANS = new Set([
  'tam',
  'can',
  'ty',
  'phe',
  'than',
  'vi',
  'dom',
  'truong',
  'bang',
  'quang',
  'bao',
  'dai',
  'tieu',
]);

/** Chuẩn hoá: bỏ dấu, thường hoá, gộp khoảng trắng. */
export function normName(s: string): string {
  return (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(s: string): string[] {
  return normName(s)
    .split(' ')
    .filter((w) => w.length > 1 && !STOP.has(w));
}

/** Đoán thể kép theo tên: "lưỡng hư/lưỡng ...", "bất giao", hoặc ghép ≥2 tạng. */
export function isKepName(name: string): boolean {
  const n = normName(name);
  if (/\bluong\b/.test(n) || /bat giao/.test(n)) return true;
  const organs = new Set(tokenize(name).filter((t) => ORGANS.has(t)));
  return organs.size >= 2;
}

/** Top ứng viên pháp trị theo trùng token tên (score>0), đã sắp giảm dần. */
export function topPhapTriCandidates(
  theDoName: string,
  phapTri: PhapTriNameRow[],
  limit = 20,
): PhapTriCandidate[] {
  const qTokens = tokenize(theDoName);
  if (!qTokens.length) return [];
  const qSet = new Set(qTokens);
  const qNorm = normName(theDoName);

  const scored: PhapTriCandidate[] = [];
  for (const p of phapTri) {
    const name = p.the_benh || '';
    const cTokens = tokenize(name);
    if (!cTokens.length) continue;
    let shared = 0;
    let organShared = 0;
    for (const t of new Set(cTokens)) {
      if (qSet.has(t)) {
        shared++;
        if (ORGANS.has(t)) organShared++;
      }
    }
    if (!shared) continue;
    const exact = normName(name) === qNorm;
    const score = shared + organShared * 2 + (exact ? 100 : 0);
    scored.push({ id: Number(p.id), the_benh: name, score, exact });
  }
  scored.sort((a, b) => b.score - a.score || a.the_benh.localeCompare(b.the_benh, 'vi'));
  return scored.slice(0, limit);
}
