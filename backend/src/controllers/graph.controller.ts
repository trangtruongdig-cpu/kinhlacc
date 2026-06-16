import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Đồ thị tri thức (knowledge graph) — duyệt vùng lân cận 1 bước (1-hop) của một node bất kỳ
 * trên đồ thị quan hệ đã có sẵn (bài thuốc · vị thuốc · pháp trị · bệnh · triệu chứng · …).
 *
 * Bấm một node ở frontend → gọi lại neighborhood(type, id) của node đó để mở rộng / re-center.
 */

export type NodeType =
  | 'bai-thuoc'
  | 'vi-thuoc'
  | 'phap-tri'
  | 'benh-tay-y'
  | 'chung-benh'
  | 'trieu-chung'
  | 'cong-dung'
  | 'kinh-mach'
  | 'nhom-duoc-ly'
  | 'kieng-ky';

export interface GraphNode {
  id: string; // `${type}:${dbId}`
  type: NodeType;
  dbId: number;
  label: string;
  role?: string | null; // vai trò (Quân/Thần/Tá/Sứ) khi là vị thuốc trong 1 bài
}
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}
export interface GraphNeighborhood {
  center: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** Các quan hệ bị cắt bớt vì vượt giới hạn (để UI báo "còn nữa"). */
  truncated: string[];
}

/** Một hướng mở rộng: chạy `sql` (tham số $1 = id center) trả {id, label, rel?}. */
interface Expansion {
  type: NodeType;
  /** Nhãn cạnh mặc định. */
  rel: string;
  sql: string;
}

const MAX_PER_REL = 60;

@Injectable()
export class GraphService {
  constructor(private readonly ds: DataSource) {}

  /** SQL lấy nhãn của node theo type (tham số $1 = dbId). */
  private static readonly LABEL_SQL: Record<NodeType, string> = {
    'bai-thuoc': `SELECT ten_bai_thuoc AS label FROM bai_thuoc WHERE id = $1`,
    'vi-thuoc': `SELECT ten_vi_thuoc AS label FROM vi_thuoc WHERE id = $1`,
    'phap-tri': `SELECT COALESCE(NULLIF(btrim(the_benh), ''), NULLIF(btrim(nguyen_tac), ''), 'Pháp trị #' || id) AS label FROM phap_tri WHERE id = $1`,
    'benh-tay-y': `SELECT ten_benh AS label FROM benh_tay_y WHERE id = $1`,
    'chung-benh': `SELECT ten_chung_benh AS label FROM chung_benh WHERE id = $1`,
    'trieu-chung': `SELECT ten_trieu_chung AS label FROM trieu_chung WHERE id = $1`,
    'cong-dung': `SELECT ten_cong_dung AS label FROM cong_dung WHERE id = $1`,
    'kinh-mach': `SELECT ten_kinh_mach AS label FROM kinh_mach WHERE id_kinh_mach = $1`,
    'nhom-duoc-ly': `SELECT ten_nhom AS label FROM nhom_nho_duoc_ly WHERE id = $1`,
    'kieng-ky': `SELECT ten_kieng_ky AS label FROM kieng_ky WHERE id = $1`,
  };

  /** Các hướng mở rộng theo từng loại node. */
  private static readonly EXPANSIONS: Record<NodeType, Expansion[]> = {
    'bai-thuoc': [
      { type: 'vi-thuoc', rel: 'vị thuốc', sql: `SELECT vt.id, vt.ten_vi_thuoc AS label, ct.vai_tro AS rel FROM bai_thuoc_chi_tiet ct JOIN vi_thuoc vt ON vt.id = ct.id_vi_thuoc WHERE ct.id_bai_thuoc = $1` },
      { type: 'phap-tri', rel: 'pháp trị', sql: `SELECT pt.id, COALESCE(NULLIF(btrim(pt.the_benh), ''), 'Pháp trị #' || pt.id) AS label FROM bai_thuoc_phap_tri bpt JOIN phap_tri pt ON pt.id = bpt.id_phap_tri WHERE bpt.id_bai_thuoc = $1` },
      { type: 'benh-tay-y', rel: 'trị bệnh', sql: `SELECT b.id, b.ten_benh AS label FROM benh_tay_y_bai_thuoc bb JOIN benh_tay_y b ON b.id = bb.id_benh_tay_y WHERE bb.id_bai_thuoc = $1` },
      { type: 'trieu-chung', rel: 'triệu chứng', sql: `SELECT tc.id, tc.ten_trieu_chung AS label FROM bai_thuoc_trieu_chung bt JOIN trieu_chung tc ON tc.id = bt.id_trieu_chung WHERE bt.id_bai_thuoc = $1` },
    ],
    'vi-thuoc': [
      { type: 'cong-dung', rel: 'công năng', sql: `SELECT cd.id, cd.ten_cong_dung AS label FROM vi_thuoc_cong_dung vc JOIN cong_dung cd ON cd.id = vc.id_cong_dung WHERE vc.id_vi_thuoc = $1` },
      { type: 'kinh-mach', rel: 'quy kinh', sql: `SELECT km.id_kinh_mach AS id, km.ten_kinh_mach AS label FROM vi_thuoc_kinh_mach vk JOIN kinh_mach km ON km.id_kinh_mach = vk.id_kinh_mach WHERE vk.id_vi_thuoc = $1` },
      { type: 'nhom-duoc-ly', rel: 'nhóm dược lý', sql: `SELECT nn.id, nn.ten_nhom AS label FROM nhom_nho_vi_thuoc nv JOIN nhom_nho_duoc_ly nn ON nn.id = nv.id_nhom_nho WHERE nv.id_vi_thuoc = $1` },
      { type: 'kieng-ky', rel: 'kiêng kỵ', sql: `SELECT kk.id, kk.ten_kieng_ky AS label FROM vi_thuoc_kieng_ky vk JOIN kieng_ky kk ON kk.id = vk.id_kieng_ky WHERE vk.id_vi_thuoc = $1` },
      { type: 'bai-thuoc', rel: 'có trong bài', sql: `SELECT bt.id, bt.ten_bai_thuoc AS label FROM bai_thuoc_chi_tiet ct JOIN bai_thuoc bt ON bt.id = ct.id_bai_thuoc WHERE ct.id_vi_thuoc = $1` },
    ],
    'phap-tri': [
      { type: 'bai-thuoc', rel: 'bài thuốc', sql: `SELECT bt.id, bt.ten_bai_thuoc AS label FROM bai_thuoc_phap_tri bpt JOIN bai_thuoc bt ON bt.id = bpt.id_bai_thuoc WHERE bpt.id_phap_tri = $1` },
      { type: 'kinh-mach', rel: 'kinh mạch', sql: `SELECT km.id_kinh_mach AS id, km.ten_kinh_mach AS label FROM phap_tri_kinh_mach pk JOIN kinh_mach km ON km.id_kinh_mach = pk.id_kinh_mach WHERE pk.id_phap_tri = $1` },
      { type: 'trieu-chung', rel: 'triệu chứng', sql: `SELECT tc.id, tc.ten_trieu_chung AS label FROM phap_tri_trieu_chung pt JOIN trieu_chung tc ON tc.id = pt.id_trieu_chung WHERE pt.id_phap_tri = $1` },
      { type: 'benh-tay-y', rel: 'bệnh Tây Y', sql: `SELECT b.id, b.ten_benh AS label FROM benh_tay_y_phap_tri bp JOIN benh_tay_y b ON b.id = bp.id_benh_tay_y WHERE bp.id_phap_tri = $1` },
    ],
    'benh-tay-y': [
      { type: 'chung-benh', rel: 'thuộc chủng', sql: `SELECT cb.id, cb.ten_chung_benh AS label FROM benh_tay_y b JOIN chung_benh cb ON cb.id = b.id_chung_benh WHERE b.id = $1` },
      { type: 'bai-thuoc', rel: 'bài thuốc', sql: `SELECT bt.id, bt.ten_bai_thuoc AS label FROM benh_tay_y_bai_thuoc bb JOIN bai_thuoc bt ON bt.id = bb.id_bai_thuoc WHERE bb.id_benh_tay_y = $1` },
      { type: 'phap-tri', rel: 'pháp trị', sql: `SELECT pt.id, COALESCE(NULLIF(btrim(pt.the_benh), ''), 'Pháp trị #' || pt.id) AS label FROM benh_tay_y_phap_tri bp JOIN phap_tri pt ON pt.id = bp.id_phap_tri WHERE bp.id_benh_tay_y = $1` },
      { type: 'trieu-chung', rel: 'triệu chứng', sql: `SELECT tc.id, tc.ten_trieu_chung AS label FROM quan_he_benh_trieu_chung q JOIN trieu_chung tc ON tc.id = q.id_trieu_chung WHERE q.id_benh_tay_y = $1` },
    ],
    'chung-benh': [
      { type: 'benh-tay-y', rel: 'gồm bệnh', sql: `SELECT id, ten_benh AS label FROM benh_tay_y WHERE id_chung_benh = $1` },
    ],
    'trieu-chung': [
      { type: 'bai-thuoc', rel: 'bài thuốc', sql: `SELECT bt.id, bt.ten_bai_thuoc AS label FROM bai_thuoc_trieu_chung b JOIN bai_thuoc bt ON bt.id = b.id_bai_thuoc WHERE b.id_trieu_chung = $1` },
      { type: 'phap-tri', rel: 'pháp trị', sql: `SELECT pt.id, COALESCE(NULLIF(btrim(pt.the_benh), ''), 'Pháp trị #' || pt.id) AS label FROM phap_tri_trieu_chung p JOIN phap_tri pt ON pt.id = p.id_phap_tri WHERE p.id_trieu_chung = $1` },
      { type: 'benh-tay-y', rel: 'bệnh Tây Y', sql: `SELECT b.id, b.ten_benh AS label FROM quan_he_benh_trieu_chung q JOIN benh_tay_y b ON b.id = q.id_benh_tay_y WHERE q.id_trieu_chung = $1` },
    ],
    'cong-dung': [
      { type: 'vi-thuoc', rel: 'vị thuốc', sql: `SELECT vt.id, vt.ten_vi_thuoc AS label FROM vi_thuoc_cong_dung vc JOIN vi_thuoc vt ON vt.id = vc.id_vi_thuoc WHERE vc.id_cong_dung = $1` },
    ],
    'kinh-mach': [
      { type: 'vi-thuoc', rel: 'vị thuốc', sql: `SELECT vt.id, vt.ten_vi_thuoc AS label FROM vi_thuoc_kinh_mach vk JOIN vi_thuoc vt ON vt.id = vk.id_vi_thuoc WHERE vk.id_kinh_mach = $1` },
      { type: 'phap-tri', rel: 'pháp trị', sql: `SELECT pt.id, COALESCE(NULLIF(btrim(pt.the_benh), ''), 'Pháp trị #' || pt.id) AS label FROM phap_tri_kinh_mach pk JOIN phap_tri pt ON pt.id = pk.id_phap_tri WHERE pk.id_kinh_mach = $1` },
    ],
    'nhom-duoc-ly': [
      { type: 'vi-thuoc', rel: 'vị thuốc', sql: `SELECT vt.id, vt.ten_vi_thuoc AS label FROM nhom_nho_vi_thuoc nv JOIN vi_thuoc vt ON vt.id = nv.id_vi_thuoc WHERE nv.id_nhom_nho = $1` },
    ],
    'kieng-ky': [
      { type: 'vi-thuoc', rel: 'vị thuốc', sql: `SELECT vt.id, vt.ten_vi_thuoc AS label FROM vi_thuoc_kieng_ky vk JOIN vi_thuoc vt ON vt.id = vk.id_vi_thuoc WHERE vk.id_kieng_ky = $1` },
    ],
  };

  private static isNodeType(t: string): t is NodeType {
    return Object.prototype.hasOwnProperty.call(GraphService.EXPANSIONS, t);
  }

  /** Vùng lân cận 1-hop của (type, id). */
  async neighborhood(type: string, rawId: number): Promise<GraphNeighborhood> {
    if (!GraphService.isNodeType(type)) {
      throw new BadRequestException(`Loại node không hợp lệ: ${type}`);
    }
    const id = Number(rawId);
    if (!Number.isFinite(id) || id <= 0) {
      throw new BadRequestException(`id không hợp lệ: ${rawId}`);
    }

    const centerId = `${type}:${id}`;
    const labelRows: Array<{ label: string }> = await this.ds.query(GraphService.LABEL_SQL[type], [id]);
    const centerLabel = labelRows[0]?.label ?? `${type} #${id}`;

    const nodes = new Map<string, GraphNode>();
    const edges = new Map<string, GraphEdge>();
    const truncated: string[] = [];
    nodes.set(centerId, { id: centerId, type, dbId: id, label: centerLabel });

    for (const exp of GraphService.EXPANSIONS[type]) {
      const rows: Array<{ id: number; label: string; rel?: string | null }> = await this.ds.query(
        `${exp.sql} ORDER BY label LIMIT ${MAX_PER_REL + 1}`,
        [id],
      );
      if (rows.length > MAX_PER_REL) {
        truncated.push(exp.rel);
        rows.length = MAX_PER_REL;
      }
      for (const r of rows) {
        const nid = `${exp.type}:${Number(r.id)}`;
        if (!nodes.has(nid)) {
          nodes.set(nid, {
            id: nid,
            type: exp.type,
            dbId: Number(r.id),
            label: r.label ?? `${exp.type} #${r.id}`,
            role: type === 'bai-thuoc' && exp.type === 'vi-thuoc' ? r.rel ?? null : undefined,
          });
        }
        const eid = `${centerId}->${nid}`;
        if (!edges.has(eid)) {
          edges.set(eid, { id: eid, source: centerId, target: nid, label: (r.rel || exp.rel) ?? undefined });
        }
      }
    }

    return { center: centerId, nodes: [...nodes.values()], edges: [...edges.values()], truncated };
  }
}
