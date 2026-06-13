import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { KinhMach3dAnchor } from '../models/kinh-mach-3d-anchor.model';

/** Một điểm chốt như engine map3d.js gửi lên / nhận về. */
export interface AnchorPoint {
  x: number;
  y: number;
  z: number;
}
/** Bộ chốt dạng map { mã huyệt -> toạ độ }. */
export type AnchorMap = Record<string, AnchorPoint>;

/** Toạ độ engine solver trả về (x,y,z + cờ q/snap/src/conf/anchor/snapDir). */
export type EnginePoint = { x: number; y: number; z: number; [k: string]: unknown };
interface SolveResult {
  points: Record<string, EnginePoint>;
  mers: string[];
  n: number;
}
type SolveFn = (mers: string[], userAnchors: AnchorMap) => SolveResult;

// Solver gốc là CommonJS (.cjs) — nest-cli copy sang dist/acu-solver/ lúc build.
// Nạp LƯỜI (lần đầu dùng) để khỏi đọc vitri-data.json 95KB khi khởi động app.
let _solveCoords: SolveFn | null = null;
function loadSolver(): SolveFn {
  if (!_solveCoords) {
    _solveCoords = (require('../acu-solver/solve-coords.cjs') as { solveCoords: SolveFn }).solveCoords;
  }
  return _solveCoords;
}

@Injectable()
export class KinhMach3dService {
  constructor(
    @InjectRepository(KinhMach3dAnchor)
    private readonly repo: Repository<KinhMach3dAnchor>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Bảng có thể chưa tồn tại nếu chưa chạy file SQL trong backend/sql/.
   * Tự tạo (idempotent) ở lần dùng đầu tiên để tính năng chạy được ngay trên
   * VPS mà không cần bước psql thủ công. Chỉ chạy DDL 1 lần / vòng đời tiến trình.
   */
  private ensured: Promise<void> | null = null;
  private ensureTable(): Promise<void> {
    if (!this.ensured) {
      this.ensured = this.dataSource
        .query(
          `CREATE TABLE IF NOT EXISTS kinh_mach_3d_anchor (
             code        varchar(16) PRIMARY KEY,
             x           double precision NOT NULL,
             y           double precision NOT NULL,
             z           double precision NOT NULL,
             updated_at  timestamptz NOT NULL DEFAULT now()
           )`,
        )
        .then(() =>
          // Bảng HƯỚNG KIM tự chỉnh (Chấm Tay): mỗi dòng = 1 huyệt + vector trục kim (x,y,z, world chuẩn-hoá).
          this.dataSource.query(
            `CREATE TABLE IF NOT EXISTS kinh_mach_3d_needle (
               code        varchar(16) PRIMARY KEY,
               x           double precision NOT NULL,
               y           double precision NOT NULL,
               z           double precision NOT NULL,
               updated_at  timestamptz NOT NULL DEFAULT now()
             )`,
          ),
        )
        .then(() => undefined)
        .catch((err) => {
          // Tạo bảng lỗi (vd thiếu quyền) → cho thử lại lần sau, đừng nuốt mãi.
          this.ensured = null;
          throw err;
        });
    }
    return this.ensured;
  }

  /** GET: trả về { points: { mã -> {x,y,z} } } đúng định dạng engine cần. */
  async getAnchors(): Promise<{ points: AnchorMap; needles: AnchorMap }> {
    await this.ensureTable();
    const rows = await this.repo.find();
    const points: AnchorMap = {};
    for (const r of rows) {
      points[r.code] = { x: r.x, y: r.y, z: r.z };
    }
    const nRows: Array<{ code: string; x: number; y: number; z: number }> =
      await this.dataSource.query('SELECT code, x, y, z FROM kinh_mach_3d_needle');
    const needles: AnchorMap = {};
    for (const r of nRows) {
      needles[r.code] = { x: +r.x, y: +r.y, z: +r.z };
    }
    return { points, needles };
  }

  /** Lọc input { mã: {x,y,z} } thành AnchorMap sạch (bỏ điểm hỏng). Dùng chung save + recompute. */
  private normalize(points: unknown): AnchorMap {
    if (points == null || typeof points !== 'object' || Array.isArray(points)) {
      throw new BadRequestException('points phải là object { mã: {x,y,z} }');
    }
    const out: AnchorMap = {};
    for (const [code, val] of Object.entries(points as Record<string, unknown>)) {
      const p = val as Partial<AnchorPoint> | null;
      if (
        !p ||
        typeof p.x !== 'number' ||
        typeof p.y !== 'number' ||
        typeof p.z !== 'number' ||
        !Number.isFinite(p.x) ||
        !Number.isFinite(p.y) ||
        !Number.isFinite(p.z)
      ) {
        continue; // bỏ qua điểm hỏng thay vì làm hỏng cả lần lưu
      }
      out[code.slice(0, 16)] = { x: p.x, y: p.y, z: p.z };
    }
    return out;
  }

  /** Chạy solver "Căn Tổng Thể" trên các chốt — lỗi solver KHÔNG được làm hỏng việc lưu. */
  private runSolver(anchors: AnchorMap): SolveResult | null {
    try {
      return loadSolver()(['LU', 'ST', 'CV'], anchors);
    } catch {
      return null;
    }
  }

  /**
   * POST /anchors: thay TOÀN BỘ bộ chốt bằng dữ liệu gửi lên (giống ghi đè file cũ), rồi
   * "căn theo" (chạy solver) — trả luôn toạ độ gold để frontend vẽ lại ngay.
   * Frontend luôn gửi đầy đủ userPlaced, kể cả khi "Xoá tất cả" (gửi {} → xoá sạch).
   */
  async saveAnchors(body: { points?: unknown; needles?: unknown }): Promise<{
    ok: true;
    n: number;
    needlesN: number;
    recomputed: boolean;
    points: Record<string, EnginePoint>;
    mers: string[];
  }> {
    await this.ensureTable();
    const anchors = this.normalize(body?.points ?? {});
    const needles = this.normalize(body?.needles ?? {}); // hướng kim tự chỉnh — cùng dạng {x,y,z} (vector trục)
    const rows = Object.entries(anchors).map(([code, p]) => {
      const row = new KinhMach3dAnchor();
      row.code = code;
      row.x = p.x;
      row.y = p.y;
      row.z = p.z;
      return row;
    });

    // Thay-toàn-bộ trong 1 transaction (chốt + hướng kim) → không còn bản ghi "mồ côi".
    await this.dataSource.transaction(async (m) => {
      await m.createQueryBuilder().delete().from(KinhMach3dAnchor).execute();
      if (rows.length) await m.insert(KinhMach3dAnchor, rows);
      await m.query('DELETE FROM kinh_mach_3d_needle');
      const nEnt = Object.entries(needles);
      if (nEnt.length) {
        const vals: string[] = [];
        const params: unknown[] = [];
        nEnt.forEach(([code, v], i) => {
          const b = i * 4;
          vals.push(`($${b + 1},$${b + 2},$${b + 3},$${b + 4})`);
          params.push(code, v.x, v.y, v.z);
        });
        await m.query(`INSERT INTO kinh_mach_3d_needle(code,x,y,z) VALUES ${vals.join(',')}`, params);
      }
    });

    const solved = this.runSolver(anchors);
    return {
      ok: true,
      n: rows.length,
      needlesN: Object.keys(needles).length,
      recomputed: !!solved,
      points: solved ? solved.points : {},
      mers: solved ? solved.mers : [],
    };
  }

  /**
   * POST /recompute: chạy solver "Căn Tổng Thể" trên các chốt gửi lên, KHÔNG lưu DB.
   * Dùng cho nút ⚙ Căn Tổng Thể (xem trước kết quả gold trước khi 💾 Lưu).
   */
  recompute(points: unknown): { ok: true; points: Record<string, EnginePoint>; mers: string[]; n: number } {
    const anchors = this.normalize(points);
    const solved = this.runSolver(anchors);
    if (!solved) {
      throw new BadRequestException('Solver gặp lỗi khi căn tổng thể');
    }
    return { ok: true, points: solved.points, mers: solved.mers, n: solved.n };
  }
}
