/**
 * Bộ đánh giá biểu thức logic kiểu Excel cho bảng quy tắc benh_dong_y_*.
 *
 * Cú pháp hỗ trợ:
 *   - Mệnh đề so sánh:    E10>0   E11<E7   ABS(E23)>=E18   AN25*AQ25<0   B10="+"
 *   - Hàm logic:          AND(c1; c2; ...)   OR(c1; c2; ...)
 *   - AND ở top-level:    c1 AND c2 AND c3   (phải có whitespace quanh AND)
 *   - Toán tử so sánh:    > < >= <= = !=
 *   - Toán hạng:          số, ô (E10/AN21/D7…), ABS(ô), tích ô*ô, chuỗi "..."
 *   - Hàm chưa hỗ trợ (vd. LEN) → mệnh đề đó trả về false.
 *
 * Nếu biểu thức không parse được, evaluate trả về false (không throw) — để
 * tránh làm hỏng cả lần diagnose vì một rule lỗi cú pháp.
 */

export type InputValues = Record<string, number | string>;

type CmpOp = '>' | '<' | '>=' | '<=' | '=' | '!=';

type Operand =
  | { kind: 'num'; value: number }
  | { kind: 'str'; value: string }
  | { kind: 'cell'; name: string }
  | { kind: 'abs'; cell: string }
  | { kind: 'mul'; parts: Operand[] }
  | { kind: 'unknown' };

type Expr =
  | { kind: 'and'; items: Expr[] }
  | { kind: 'or'; items: Expr[] }
  | { kind: 'cmp'; left: Operand; op: CmpOp; right: Operand };

class Parser {
  private pos = 0;
  constructor(private readonly src: string) {}

  parse(): Expr {
    const e = this.parseExpr();
    this.skipWs();
    if (this.pos < this.src.length) {
      throw new SyntaxError(`Token thừa tại vị trí ${this.pos}: "${this.src.slice(this.pos)}"`);
    }
    return e;
  }

  // Top-level: AndExpr (whitespace-AND chuỗi mệnh đề)
  private parseExpr(): Expr {
    const items: Expr[] = [this.parseAtom()];
    while (true) {
      this.skipWs();
      if (!this.matchInfixAnd()) break;
      items.push(this.parseAtom());
    }
    return items.length === 1 ? items[0] : { kind: 'and', items };
  }

  /** Khớp ` AND ` ở top-level (không phải AND(). */
  private matchInfixAnd(): boolean {
    const rest = this.src.slice(this.pos);
    const m = rest.match(/^AND\b/i);
    if (!m) return false;
    const after = rest[3];
    if (after === '(' || after === undefined) return false; // AND( hoặc cuối chuỗi
    this.pos += 3;
    return true;
  }

  private parseAtom(): Expr {
    this.skipWs();
    // Hàm AND(...) / OR(...)
    const fn = this.src.slice(this.pos).match(/^(AND|OR)\(/i);
    if (fn) {
      const kind = fn[1].toUpperCase() as 'AND' | 'OR';
      this.pos += fn[0].length;
      const items: Expr[] = [];
      this.skipWs();
      if (this.src[this.pos] !== ')') {
        items.push(this.parseExpr());
        this.skipWs();
        while (this.src[this.pos] === ';' || this.src[this.pos] === ',') {
          this.pos++;
          items.push(this.parseExpr());
          this.skipWs();
        }
      }
      if (this.src[this.pos] !== ')') {
        throw new SyntaxError(`Thiếu ')' đóng ${kind}() tại vị trí ${this.pos}`);
      }
      this.pos++;
      return kind === 'AND' ? { kind: 'and', items } : { kind: 'or', items };
    }
    // Ngoặc đơn nhóm
    if (this.src[this.pos] === '(') {
      this.pos++;
      const e = this.parseExpr();
      this.skipWs();
      if (this.src[this.pos] !== ')') {
        throw new SyntaxError(`Thiếu ')' tại vị trí ${this.pos}`);
      }
      this.pos++;
      return e;
    }
    return this.parseComparison();
  }

  private parseComparison(): Expr {
    const left = this.parseOperand();
    this.skipWs();
    const op = this.parseOp();
    const right = this.parseOperand();
    return { kind: 'cmp', left, op, right };
  }

  private parseOp(): CmpOp {
    for (const o of ['>=', '<=', '!=', '=', '>', '<'] as const) {
      if (this.src.startsWith(o, this.pos)) {
        this.pos += o.length;
        return o;
      }
    }
    throw new SyntaxError(`Thiếu toán tử so sánh tại vị trí ${this.pos}: "${this.src.slice(this.pos)}"`);
  }

  private parseOperand(): Operand {
    this.skipWs();
    // Chuỗi "..."
    if (this.src[this.pos] === '"') {
      this.pos++;
      const start = this.pos;
      while (this.pos < this.src.length && this.src[this.pos] !== '"') this.pos++;
      const value = this.src.slice(start, this.pos);
      if (this.src[this.pos] === '"') this.pos++;
      return { kind: 'str', value };
    }
    // Số
    const numM = this.src.slice(this.pos).match(/^-?\d+(?:\.\d+)?/);
    if (numM) {
      this.pos += numM[0].length;
      return { kind: 'num', value: Number(numM[0]) };
    }
    // Identifier (cell hoặc tên hàm)
    const idM = this.src.slice(this.pos).match(/^[A-Za-z][A-Za-z0-9]*/);
    if (!idM) throw new SyntaxError(`Thiếu toán hạng tại vị trí ${this.pos}`);
    const ident = idM[0];
    this.pos += ident.length;

    // ABS(cell)
    if (ident.toUpperCase() === 'ABS' && this.src[this.pos] === '(') {
      this.pos++;
      const cellM = this.src.slice(this.pos).match(/^[A-Za-z][A-Za-z0-9]*/);
      if (!cellM) throw new SyntaxError(`Thiếu tên ô sau ABS( tại vị trí ${this.pos}`);
      this.pos += cellM[0].length;
      this.skipWs();
      if (this.src[this.pos] !== ')') {
        throw new SyntaxError(`Thiếu ')' đóng ABS() tại vị trí ${this.pos}`);
      }
      this.pos++;
      return { kind: 'abs', cell: cellM[0] };
    }

    // Hàm khác (vd LEN) — bỏ qua nội dung, trả về 'unknown'
    if (this.src[this.pos] === '(') {
      let depth = 1;
      this.pos++;
      while (this.pos < this.src.length && depth > 0) {
        if (this.src[this.pos] === '(') depth++;
        else if (this.src[this.pos] === ')') depth--;
        this.pos++;
      }
      return { kind: 'unknown' };
    }

    // Cell, có thể nhân *cell*cell...
    const head: Operand = { kind: 'cell', name: ident };
    const parts: Operand[] = [head];
    while (this.src[this.pos] === '*') {
      this.pos++;
      const next = this.src.slice(this.pos).match(/^[A-Za-z][A-Za-z0-9]*/);
      if (!next) throw new SyntaxError(`Thiếu tên ô sau '*' tại vị trí ${this.pos}`);
      this.pos += next[0].length;
      parts.push({ kind: 'cell', name: next[0] });
    }
    return parts.length === 1 ? head : { kind: 'mul', parts };
  }

  private skipWs(): void {
    while (this.pos < this.src.length && /\s/.test(this.src[this.pos])) this.pos++;
  }
}

function resolveOperand(op: Operand, input: InputValues): number | string | null {
  switch (op.kind) {
    case 'num':
      return op.value;
    case 'str':
      return op.value;
    case 'cell': {
      const v = input[op.name.toUpperCase()];
      if (typeof v === 'string') return v;
      return typeof v === 'number' && Number.isFinite(v) ? v : null;
    }
    case 'abs': {
      const v = input[op.cell.toUpperCase()];
      return typeof v === 'number' && Number.isFinite(v) ? Math.abs(v) : null;
    }
    case 'mul': {
      let prod = 1;
      for (const p of op.parts) {
        const v = resolveOperand(p, input);
        if (typeof v !== 'number') return null;
        prod *= v;
      }
      return prod;
    }
    case 'unknown':
      return null;
  }
}

function coerceNumeric(v: number | string): number | string {
  if (typeof v === 'number') return v;
  const t = v.trim();
  if (/^-?\d+(?:\.\d+)?$/.test(t)) return Number(t);
  return v;
}

function compare(left: number | string, op: CmpOp, right: number | string): boolean {
  // Coerce numeric-looking strings ("0", "5", "-1.2") sang số trước khi so sánh —
  // để rule viết B10="0" vẫn khớp khi input lưu B10 ở dạng số 0 (và ngược lại).
  const l = coerceNumeric(left);
  const r = coerceNumeric(right);
  switch (op) {
    case '>':
      return l > r;
    case '<':
      return l < r;
    case '>=':
      return l >= r;
    case '<=':
      return l <= r;
    case '=':
      // So sánh số dạng tolerant để tránh sai số dấu phẩy động.
      if (typeof l === 'number' && typeof r === 'number') {
        return Math.abs(l - r) < 1e-9;
      }
      return l === r;
    case '!=':
      if (typeof l === 'number' && typeof r === 'number') {
        return Math.abs(l - r) >= 1e-9;
      }
      return l !== r;
  }
}

function evalExpr(e: Expr, input: InputValues): boolean {
  switch (e.kind) {
    case 'and':
      if (!e.items.length) return false;
      return e.items.every((c) => evalExpr(c, input));
    case 'or':
      return e.items.some((c) => evalExpr(c, input));
    case 'cmp': {
      const l = resolveOperand(e.left, input);
      const r = resolveOperand(e.right, input);
      if (l === null || r === null) return false;
      return compare(l as number | string, e.op, r as number | string);
    }
  }
}

/**
 * Đánh giá biểu thức logic dạng excel/SQL trên `input` các ô đã tính.
 * Trả về false nếu biểu thức rỗng/lỗi cú pháp — không throw.
 */
export function evaluateLogicExpression(expression: string, input: InputValues): boolean {
  const src = (expression || '').trim();
  if (!src) return false;
  let ast: Expr;
  try {
    ast = new Parser(src).parse();
  } catch {
    return false;
  }
  return evalExpr(ast, input);
}
