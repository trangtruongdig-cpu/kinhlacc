import {
  BadRequestException,
  HttpException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import OpenAI from 'openai';
import { KinhMach } from '../models/kinh-mach.model';
import { PhapTri } from '../models/phap-tri.model';
import { TrieuChung } from '../models/trieu-chung.model';
import { HuyetVi } from '../models/huyet-vi.model';
import { safeUpstreamStatus } from '../utils/external-error.util';
import { topPhapTriCandidates, normName, type PhapTriNameRow } from '../utils/the-do-match.util';

export interface ViThuocAiSuggestion {
  tinh: string;
  vi: string;
  /** Tên các kinh mạch ghép bằng dấu phẩy (hiển thị/legacy). */
  quy_kinh: string;
  /** IDs khớp được với bảng `kinh_mach`. */
  kinh_mach_ids: number[];
  /** Tên AI đề xuất nhưng không khớp được kinh mạch nào trong DB. */
  kinh_mach_unmatched: string[];
}

export interface NhomNhoCandidate {
  id: number;
  ten_nhom: string;
  mo_ta?: string | null;
  lieu_luong?: string | null;
}

export interface ClassifyViThuocInput {
  vi_thuoc: { id: number; ten_vi_thuoc: string }[];
  nhom_nho_candidates: NhomNhoCandidate[];
}

export interface ViThuocClassification {
  id: number;
  ten_vi_thuoc: string;
  /** ID nhóm nhỏ phù hợp nhất; `null` nếu AI không chắc chắn. */
  id_nhom_nho: number | null;
  /** Lý do ngắn gọn AI giải thích (1-2 câu). */
  ly_do?: string;
}

/** Thông tin văn bản AI gợi ý cho 1 huyệt (các trường có thể rỗng nếu AI không chắc). */
export interface HuyetAiInfo {
  ten_khac: string;
  vi_tri: string;
  giai_phau: string;
  dac_tinh: string;
  chu_tri: string;
  cham_cuu: string;
  phoi_huyet: string;
}

/** 1 ảnh ứng viên trả về từ Google Custom Search (searchType=image). */
export interface HuyetImageResult {
  url: string;
  thumb: string;
  title: string;
  /** Trang web chứa ảnh (để người duyệt kiểm chứng nguồn). */
  source: string;
  width?: number;
  height?: number;
}

export interface HuyetAiSuggestion {
  info: HuyetAiInfo;
  /** Lỗi khi gọi AI text (nếu có) — ảnh vẫn trả độc lập. */
  info_error?: string;
  images: HuyetImageResult[];
  /** Lỗi/khuyết khi tìm ảnh (vd chưa cấu hình key) — text vẫn trả độc lập. */
  images_error?: string;
}

export interface SuggestHuyetInput {
  ten_huyet: string;
  ma_huyet?: string;
  kinh_mach?: string;
}

/** Kết quả AI phân nhóm 1 triệu chứng (nhom = slug cố định, null nếu AI không gán được). */
export interface TrieuChungNhomResult {
  id: number;
  ten_trieu_chung: string;
  nhom: string | null;
  ly_do?: string;
}

/** Kết quả AI gợi ý pháp trị cho 1 thể đo (đồng bộ). phap_tri_ids ⊆ ứng viên đã lọc. */
export interface TheDoPhapTriSuggestion {
  id: number;
  name: string;
  is_kep: boolean;
  phap_tri_ids: number[];
  phap_tri: { id: number; the_benh: string }[];
  ly_do?: string;
}

/** Bộ nhóm triệu chứng chuẩn hoá (slug → nhãn) dùng cho AI + UI. */
export const TRIEU_CHUNG_NHOM: ReadonlyArray<{ slug: string; label: string }> = [
  { slug: 'tinh-than', label: 'Tinh thần / Cảm xúc' },
  { slug: 'tieu-hoa', label: 'Tiêu hóa / Ăn ngủ' },
  { slug: 'than-kinh-co-the', label: 'Thần kinh / Cơ thể (đau, mỏi, sốt, nóng-lạnh…)' },
  { slug: 'phu-khoa', label: 'Phụ khoa (kinh nguyệt, thai sản…)' },
  { slug: 'luoi-mach', label: 'Lưỡi / Mạch (dấu hiệu khám)' },
  { slug: 'toan-trang', label: 'Toàn trạng (mệt mỏi, sắc mặt, cân nặng…)' },
  { slug: 'khac', label: 'Khác' },
];

/** Bộ nhóm NGUYÊN NHÂN của thể bệnh (đồng bộ frontend NHOM_NGUYEN_NHAN). */
export const NGUYEN_NHAN_NHOM: ReadonlyArray<{ slug: string; label: string }> = [
  { slug: 'tinh-than', label: 'Yếu tố tinh thần' },
  { slug: 'sinh-hoat', label: 'Chế độ sinh hoạt' },
  { slug: 'tang-phu', label: 'Ảnh hưởng tạng phủ khác' },
];

/**
 * Gợi ý AI điền dữ liệu cho một THỂ BỆNH (pháp trị): nguyên nhân có cấu trúc + triệu chứng.
 * Triệu chứng được khớp với bảng `trieu_chung` (matched ids) — phần chưa khớp trả về kèm nhóm
 * để frontend tạo nhanh. AI chỉ GỢI Ý — bác sĩ duyệt.
 */
export interface TheBenhAiSuggestion {
  nguyen_nhan_list: Array<{ nhom: string; noi_dung: string }>;
  trieu_chung_ids: number[];
  trieu_chung_matched: string[];
  trieu_chung_unmatched: Array<{ ten: string; nhom: string | null }>;
}

const YESCALE_DEFAULT_BASE_URL = 'https://api.yescale.vip/v1';
const YESCALE_DEFAULT_MODEL = 'deepseek-v3.2';

const SYSTEM_PROMPT = `Bạn là một chuyên gia Y học Cổ truyền (Đông Y). Khi nhận tên một vị thuốc, hãy trả về CHÍNH XÁC một JSON object với 3 trường:
- "tinh": tính của vị thuốc (1 từ ngắn, và 1 trong các giá trị sau "Ấm", "Hàn", "Lương", "Ôn", "Bình", "Nhiệt").
- "vi": vị của vị thuốc, có thể nhiều vị cách nhau bởi dấu phẩy và yêu cầu chọn chính xác từ các vị sau: Tân  - Cam  - Khổ  - Toan  - Hàm  - Đạm, không lấy các vị nào khác bên ngoài
- "quy_kinh": các kinh lạc trong lục phủ và ngũ tạng, cách nhau bởi dấu phẩy (ví dụ: Tâm, Can, Tỳ, Phế, Thận, Đại trường, Tiểu trường , ...).

QUY TẮC:
- Chỉ trả về JSON thuần, KHÔNG kèm văn bản, KHÔNG markdown, KHÔNG \`\`\`.
- Nếu không chắc chắn về vị thuốc, vẫn cố gắng đưa giá trị phổ biến nhất trong y văn cổ truyền Việt Nam.
- Dùng tiếng Việt có dấu, viết hoa chữ cái đầu.`;

const HUYET_SYSTEM_PROMPT = `Bạn là chuyên gia Y học Cổ truyền (Đông Y) và Châm cứu Việt Nam. Khi nhận tên một HUYỆT (có thể kèm mã quốc tế và tên đường kinh), hãy trả về CHÍNH XÁC một JSON object với các trường:
- "ten_khac": các tên gọi khác của huyệt, cách nhau dấu phẩy. Để "" nếu không có.
- "vi_tri": cách xác định / vị trí giải phẫu của huyệt (mô tả lấy huyệt).
- "giai_phau": giải phẫu cục bộ (cơ, gân, thần kinh, mạch máu liên quan).
- "dac_tinh": đặc tính / loại huyệt (vd Hợp huyệt, Du huyệt, Nguyên huyệt, Lạc huyệt, Hội huyệt, Mộ huyệt, Khích huyệt, Kỳ huyệt…).
- "chu_tri": tác dụng chủ trị chính của huyệt.
- "cham_cuu": cách châm cứu (hướng kim, độ sâu thốn, số tráng cứu / phút).
- "phoi_huyet": các huyệt thường phối hợp. Để "" nếu không rõ.

QUY TẮC:
- Chỉ trả về JSON thuần, KHÔNG kèm văn bản, KHÔNG markdown, KHÔNG \`\`\`.
- Dùng tiếng Việt có dấu, thuật ngữ Đông Y chuẩn, viết hoa chữ cái đầu.
- Nếu KHÔNG chắc chắn về một trường, để chuỗi rỗng "" cho trường đó — TUYỆT ĐỐI không bịa số liệu hay vị trí.`;

/**
 * Kết quả AI tách phương huyệt (văn bản) thành huyệt CÓ CẤU TRÚC.
 * matched: huyệt khớp được trong danh mục huyet_vi; unmatched: tên huyệt AI nêu nhưng không khớp.
 */
export interface PhuongHuyetParsed {
  matched: Array<{ idHuyet: number; ten_huyet: string; phuong_phap: string; ghi_chu: string }>;
  unmatched: Array<{ ten: string; phuong_phap: string; ghi_chu: string }>;
}

@Injectable()
export class AiSuggestService {
  private client: OpenAI | null = null;
  private clientKey = '';
  private clientBase = '';

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(KinhMach)
    private readonly kinhMachRepo: Repository<KinhMach>,
    @InjectRepository(PhapTri)
    private readonly phapTriRepo: Repository<PhapTri>,
    @InjectRepository(TrieuChung)
    private readonly trieuChungRepo: Repository<TrieuChung>,
    @InjectRepository(HuyetVi)
    private readonly huyetViRepo: Repository<HuyetVi>,
  ) { }

  private getClient(): OpenAI {
    const apiKey = this.config.get<string>('YESCALE_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException('Chưa cấu hình YESCALE_API_KEY');
    }
    const baseURL =
      this.config.get<string>('YESCALE_BASE_URL') || YESCALE_DEFAULT_BASE_URL;

    if (!this.client || this.clientKey !== apiKey || this.clientBase !== baseURL) {
      this.client = new OpenAI({ apiKey, baseURL });
      this.clientKey = apiKey;
      this.clientBase = baseURL;
    }
    return this.client;
  }

  async suggestViThuoc(name: string): Promise<ViThuocAiSuggestion> {
    const ten = (name || '').trim();
    if (!ten) {
      throw new BadRequestException('Thiếu tên vị thuốc');
    }

    const client = this.getClient();
    const model =
      this.config.get<string>('YESCALE_MODEL') || YESCALE_DEFAULT_MODEL;

    let response;
    try {
      response = await client.chat.completions.create({
        model,
        temperature: 0.2,
        max_tokens: 512,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Tên vị thuốc: ${ten}` },
        ],
      });
    } catch (err: any) {
      // KHÔNG relay 401/403 của Yescale: frontend sẽ tưởng phiên hết hạn → đá ra /login.
      const detail = err?.error?.message || err?.message || String(err);
      throw new HttpException(`yescale lỗi: ${detail}`, safeUpstreamStatus(err?.status));
    }

    const content = response.choices?.[0]?.message?.content?.trim() ?? '';
    if (!content) {
      throw new ServiceUnavailableException('yescale trả về nội dung rỗng');
    }

    const parsed = parseJsonLoose(content);
    if (!parsed || typeof parsed !== 'object') {
      throw new ServiceUnavailableException(
        `Không parse được JSON từ AI: ${content.slice(0, 200)}`,
      );
    }

    const tinh = pickString(parsed, 'tinh');
    const vi = pickString(parsed, 'vi');
    const quyKinhRaw = pickString(parsed, 'quy_kinh');

    const { ids, matchedNames, unmatched } = await this.mapKinhMachNames(
      splitNames(quyKinhRaw),
    );

    return {
      tinh,
      vi,
      quy_kinh: matchedNames.join(', '),
      kinh_mach_ids: ids,
      kinh_mach_unmatched: unmatched,
    };
  }

  /**
   * Gợi ý cho 1 HUYỆT: chạy song song (1) AI điền thông tin text + (2) tìm ảnh thật qua Google.
   * Hai phần độc lập — phần nào lỗi thì báo lỗi riêng phần đó, phần kia vẫn trả về.
   */
  async suggestHuyet(input: SuggestHuyetInput): Promise<HuyetAiSuggestion> {
    const ten = (input?.ten_huyet || '').trim();
    if (!ten) {
      throw new BadRequestException('Thiếu tên huyệt');
    }
    const ma = (input?.ma_huyet || '').trim();
    const kinh = (input?.kinh_mach || '').trim();

    const [infoRes, imagesRes] = await Promise.all([
      this.suggestHuyetInfo(ten, ma, kinh)
        .then((info) => ({ info, error: undefined as string | undefined }))
        .catch((e: any) => ({
          info: emptyHuyetInfo(),
          error: String(e?.error?.message || e?.message || e),
        })),
      this.searchHuyetImages(ten, ma),
    ]);

    return {
      info: infoRes.info,
      info_error: infoRes.error,
      images: imagesRes.images,
      images_error: imagesRes.error,
    };
  }

  /** Gọi YeScale (OpenAI-compatible) điền các trường text của huyệt. */
  private async suggestHuyetInfo(
    ten: string,
    ma: string,
    kinh: string,
  ): Promise<HuyetAiInfo> {
    const client = this.getClient();
    const model =
      this.config.get<string>('YESCALE_MODEL') || YESCALE_DEFAULT_MODEL;

    const parts = [`Tên huyệt: ${ten}`];
    if (ma) parts.push(`Mã quốc tế: ${ma}`);
    if (kinh) parts.push(`Đường kinh: ${kinh}`);

    let response;
    try {
      response = await client.chat.completions.create({
        model,
        temperature: 0.2,
        max_tokens: 900,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: HUYET_SYSTEM_PROMPT },
          { role: 'user', content: parts.join('\n') },
        ],
      });
    } catch (err: any) {
      // KHÔNG relay 401/403 của Yescale: frontend sẽ tưởng phiên hết hạn → đá ra /login.
      const detail = err?.error?.message || err?.message || String(err);
      throw new HttpException(`yescale lỗi: ${detail}`, safeUpstreamStatus(err?.status));
    }

    const content = response.choices?.[0]?.message?.content?.trim() ?? '';
    if (!content) {
      throw new ServiceUnavailableException('yescale trả về nội dung rỗng');
    }
    const parsed = parseJsonLoose(content);
    if (!parsed || typeof parsed !== 'object') {
      throw new ServiceUnavailableException(
        `Không parse được JSON từ AI: ${content.slice(0, 200)}`,
      );
    }
    return {
      ten_khac: pickString(parsed, 'ten_khac'),
      vi_tri: pickString(parsed, 'vi_tri'),
      giai_phau: pickString(parsed, 'giai_phau'),
      dac_tinh: pickString(parsed, 'dac_tinh'),
      chu_tri: pickString(parsed, 'chu_tri'),
      cham_cuu: pickString(parsed, 'cham_cuu'),
      phoi_huyet: pickString(parsed, 'phoi_huyet'),
    };
  }

  /**
   * Tìm ảnh thật cho huyệt qua Google Custom Search JSON API (searchType=image).
   * Best-effort: thiếu key hoặc lỗi mạng → trả mảng rỗng kèm `error` (không ném lỗi,
   * để phần text vẫn dùng được). Cần biến môi trường GOOGLE_CSE_API_KEY + GOOGLE_CSE_CX.
   */
  private async searchHuyetImages(
    ten: string,
    ma: string,
  ): Promise<{ images: HuyetImageResult[]; error?: string }> {
    const apiKey = this.config.get<string>('GOOGLE_CSE_API_KEY');
    const cx = this.config.get<string>('GOOGLE_CSE_CX');
    if (!apiKey || !cx) {
      return {
        images: [],
        error: 'Chưa cấu hình GOOGLE_CSE_API_KEY / GOOGLE_CSE_CX',
      };
    }

    const q = [ten, ma, 'huyệt vị trí châm cứu', 'acupuncture point location']
      .filter(Boolean)
      .join(' ');
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('cx', cx);
    url.searchParams.set('q', q);
    url.searchParams.set('searchType', 'image');
    url.searchParams.set('num', '8');
    url.searchParams.set('safe', 'active');

    try {
      const res = await fetch(url.toString());
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        return {
          images: [],
          error: `Google CSE lỗi ${res.status}: ${body.slice(0, 200)}`,
        };
      }
      const data: any = await res.json();
      const items: any[] = Array.isArray(data?.items) ? data.items : [];
      const images: HuyetImageResult[] = items
        .map((it) => ({
          url: String(it?.link || ''),
          thumb: String(it?.image?.thumbnailLink || it?.link || ''),
          title: String(it?.title || ''),
          source: String(it?.image?.contextLink || ''),
          width: Number(it?.image?.width) || undefined,
          height: Number(it?.image?.height) || undefined,
        }))
        .filter((im) => im.url);
      return { images };
    } catch (e: any) {
      return { images: [], error: `Google CSE lỗi: ${e?.message || e}` };
    }
  }

  async classifyViThuoc(input: ClassifyViThuocInput): Promise<ViThuocClassification[]> {
    const viThuocs = (input.vi_thuoc ?? []).filter(
      (v) => v && Number.isFinite(v.id) && typeof v.ten_vi_thuoc === 'string' && v.ten_vi_thuoc.trim().length > 0,
    );
    const candidates = (input.nhom_nho_candidates ?? []).filter(
      (c) => c && Number.isFinite(c.id) && typeof c.ten_nhom === 'string' && c.ten_nhom.trim().length > 0,
    );
    if (!viThuocs.length) {
      throw new BadRequestException('Danh sách vị thuốc rỗng');
    }
    if (!candidates.length) {
      throw new BadRequestException('Danh sách nhóm nhỏ ứng viên rỗng');
    }

    const candidateBlock = candidates
      .map((c) => {
        const parts = [`id=${c.id}`, `ten="${c.ten_nhom.trim()}"`];
        const lieu = (c.lieu_luong ?? '').trim();
        if (lieu) parts.push(`lieu="${lieu}"`);
        const mota = (c.mo_ta ?? '').trim();
        if (mota) parts.push(`mo_ta="${mota.replace(/\s+/g, ' ').slice(0, 200)}"`);
        return `{${parts.join(', ')}}`;
      })
      .join('\n');

    const allowedNhomNhoIds = new Set(candidates.map((c) => c.id));

    // Chia chunk để (1) prompt nhỏ → AI dễ trả đúng format, (2) 1 chunk lỗi
    // không kéo theo toàn bộ batch.
    const CHUNK_SIZE = 5;
    const chunks: { id: number; ten_vi_thuoc: string }[][] = [];
    for (let i = 0; i < viThuocs.length; i += CHUNK_SIZE) {
      chunks.push(viThuocs.slice(i, i + CHUNK_SIZE));
    }

    const out: ViThuocClassification[] = [];
    const seen = new Set<number>();

    // eslint-disable-next-line no-console
    console.log(
      `[AI classifyViThuoc] START total=${viThuocs.length} candidates=${candidates.length} chunkSize=${CHUNK_SIZE} chunks=${chunks.length}`,
    );

    for (let idx = 0; idx < chunks.length; idx++) {
      const chunk = chunks[idx];
      let chunkResults: ViThuocClassification[] = [];
      try {
        chunkResults = await this.classifyChunk(
          chunk,
          candidateBlock,
          allowedNhomNhoIds,
          idx + 1,
          chunks.length,
        );
      } catch (err: any) {
        // eslint-disable-next-line no-console
        console.error(
          `[AI classifyViThuoc] chunk ${idx + 1}/${chunks.length} lỗi, các vị thuốc trong chunk sẽ trả null:`,
          chunk.map((v) => v.ten_vi_thuoc).join(', '),
          '— reason:',
          err?.message || err,
        );
        chunkResults = chunk.map((v) => ({
          id: v.id,
          ten_vi_thuoc: v.ten_vi_thuoc,
          id_nhom_nho: null,
          ly_do: 'AI lỗi — chưa phân loại được',
        }));
      }

      for (const r of chunkResults) {
        if (seen.has(r.id)) continue;
        seen.add(r.id);
        out.push(r);
      }
    }

    const classifiedCount = out.filter((r) => r.id_nhom_nho != null).length;
    // eslint-disable-next-line no-console
    console.log(
      `[AI classifyViThuoc] DONE total=${out.length} classified=${classifiedCount} unclassified=${out.length - classifiedCount}`,
    );

    // Fallback: vị thuốc nào không có trong output (AI bỏ sót và không bị mark lỗi)
    for (const v of viThuocs) {
      if (seen.has(v.id)) continue;
      out.push({ id: v.id, ten_vi_thuoc: v.ten_vi_thuoc, id_nhom_nho: null });
    }
    return out;
  }

  private async classifyChunk(
    viThuocs: { id: number; ten_vi_thuoc: string }[],
    candidateBlock: string,
    allowedNhomNhoIds: Set<number>,
    chunkIndex = 1,
    totalChunks = 1,
  ): Promise<ViThuocClassification[]> {
    const tag = `[AI chunk ${chunkIndex}/${totalChunks}]`;
    const client = this.getClient();
    const model = this.config.get<string>('YESCALE_MODEL') || YESCALE_DEFAULT_MODEL;

    const viThuocBlock = viThuocs
      .map((v) => `{id=${v.id}, ten="${v.ten_vi_thuoc.trim()}"}`)
      .join('\n');

    const systemPrompt = `Bạn là chuyên gia Y học Cổ truyền (Đông Y) Việt Nam. Nhiệm vụ: phân loại từng vị thuốc vào một nhóm nhỏ dược lý phù hợp nhất từ danh sách ứng viên cho trước.

QUY TẮC:
- Chỉ chọn id_nhom_nho từ danh sách ứng viên đã cho.
- Nếu không có nhóm nào thật sự phù hợp, đặt id_nhom_nho: null.
- Mỗi vị thuốc chỉ thuộc 1 nhóm.
- Trả về DUY NHẤT một JSON object có khóa "results", giá trị là mảng các phần tử phân loại.
- KHÔNG kèm văn bản giải thích, KHÔNG markdown, KHÔNG \`\`\`.
- Mỗi phần tử có format: {"id": <id vị thuốc>, "id_nhom_nho": <id nhóm nhỏ hoặc null>, "ly_do": "<lý do ngắn 1 câu>"}
- ly_do: tiếng Việt, ngắn gọn (dưới 25 từ), nêu công năng/tính vị/tác dụng chính.

VÍ DỤ ĐẦU RA HỢP LỆ:
{"results":[{"id":12,"id_nhom_nho":3,"ly_do":"Tính ôn, vị tân, công năng giải biểu tán hàn."},{"id":15,"id_nhom_nho":null,"ly_do":"Không có nhóm ứng viên nào phù hợp."}]}`;

    const userPrompt = `Danh sách NHÓM NHỎ ứng viên:
${candidateBlock}

Danh sách VỊ THUỐC cần phân loại:
${viThuocBlock}

Phân loại tất cả vị thuốc trên vào các nhóm nhỏ ứng viên (theo id). Trả JSON đúng định dạng đã quy định.`;

    const maxTokens = Math.min(4096, 512 + viThuocs.length * 200);

    // eslint-disable-next-line no-console
    console.log(
      `${tag} REQUEST model=${model} maxTokens=${maxTokens} items=${viThuocs.length}:`,
      viThuocs.map((v) => `${v.id}:${v.ten_vi_thuoc}`).join(' | '),
    );

    const startedAt = Date.now();
    const response = await client.chat.completions.create({
      model,
      temperature: 0.2,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });
    const elapsedMs = Date.now() - startedAt;

    const content = response.choices?.[0]?.message?.content?.trim() ?? '';
    const usage = response.usage;
    const finishReason = response.choices?.[0]?.finish_reason;

    // eslint-disable-next-line no-console
    console.log(
      `${tag} RESPONSE elapsed=${elapsedMs}ms finish=${finishReason} tokens=${usage?.total_tokens ?? '?'} (prompt=${usage?.prompt_tokens ?? '?'}, completion=${usage?.completion_tokens ?? '?'}) contentLen=${content.length}`,
    );
    // eslint-disable-next-line no-console
    console.log(`${tag} RAW:`, content);

    if (!content) {
      throw new Error('yescale trả về nội dung rỗng');
    }

    const parsed = parseClassifyResults(content);
    if (!parsed) {
      // eslint-disable-next-line no-console
      console.error(`${tag} không parse được JSON:`, content.slice(0, 1000));
      throw new Error(`Không parse được JSON từ AI. Trích đoạn: ${content.slice(0, 200)}`);
    }
    // eslint-disable-next-line no-console
    console.log(`${tag} PARSED ${parsed.length} entries`);

    const byId = new Map<number, { id: number; ten_vi_thuoc: string }>();
    for (const v of viThuocs) byId.set(v.id, v);

    const out: ViThuocClassification[] = [];
    const seen = new Set<number>();
    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue;
      const raw = item as Record<string, unknown>;
      const idRaw = raw.id ?? raw.id_vi_thuoc;
      const idNum = typeof idRaw === 'number' ? idRaw : Number(idRaw);
      if (!Number.isFinite(idNum)) continue;
      const v = byId.get(idNum);
      if (!v || seen.has(idNum)) continue;
      seen.add(idNum);
      const nnRaw = raw.id_nhom_nho;
      const nnNum =
        nnRaw === null || nnRaw === undefined || nnRaw === ''
          ? null
          : typeof nnRaw === 'number'
            ? nnRaw
            : Number(nnRaw);
      const idNhomNho =
        nnNum != null && Number.isFinite(nnNum) && allowedNhomNhoIds.has(nnNum) ? nnNum : null;
      const lyDo = typeof raw.ly_do === 'string' ? raw.ly_do.trim() : '';
      out.push({
        id: v.id,
        ten_vi_thuoc: v.ten_vi_thuoc,
        id_nhom_nho: idNhomNho,
        ly_do: lyDo || undefined,
      });
    }

    // Trong chunk: vị thuốc AI bỏ sót → null (không throw, chỉ là null lành tính)
    for (const v of viThuocs) {
      if (seen.has(v.id)) continue;
      out.push({ id: v.id, ten_vi_thuoc: v.ten_vi_thuoc, id_nhom_nho: null });
    }
    return out;
  }

  /**
   * Phân loại NHÓM cho danh sách triệu chứng (slug cố định). Mirror classifyViThuoc:
   * chunk nhỏ + cô lập lỗi từng chunk + parse JSON lỏng. AI chỉ GỢI Ý — bác sĩ duyệt.
   */
  async classifyTrieuChungNhom(
    items: { id: number; ten_trieu_chung: string }[],
  ): Promise<TrieuChungNhomResult[]> {
    const list = (items ?? []).filter(
      (v) => v && Number.isFinite(v.id) && typeof v.ten_trieu_chung === 'string' && v.ten_trieu_chung.trim().length > 0,
    );
    if (!list.length) throw new BadRequestException('Danh sách triệu chứng rỗng');

    const allowed = new Set(TRIEU_CHUNG_NHOM.map((n) => n.slug));
    const nhomBlock = TRIEU_CHUNG_NHOM.map((n) => `- ${n.slug}: ${n.label}`).join('\n');
    const CHUNK = 10;
    const chunks: { id: number; ten_trieu_chung: string }[][] = [];
    for (let i = 0; i < list.length; i += CHUNK) chunks.push(list.slice(i, i + CHUNK));

    const out: TrieuChungNhomResult[] = [];
    const seen = new Set<number>();
    for (const chunk of chunks) {
      let res: TrieuChungNhomResult[];
      try {
        res = await this.classifyNhomChunk(chunk, nhomBlock, allowed);
      } catch (err: any) {
        // eslint-disable-next-line no-console
        console.error('[AI classifyTrieuChungNhom] chunk lỗi:', err?.message || err);
        res = chunk.map((v) => ({ id: v.id, ten_trieu_chung: v.ten_trieu_chung, nhom: null, ly_do: 'AI lỗi — chưa phân loại được' }));
      }
      for (const r of res) {
        if (seen.has(r.id)) continue;
        seen.add(r.id);
        out.push(r);
      }
    }
    for (const v of list) if (!seen.has(v.id)) out.push({ id: v.id, ten_trieu_chung: v.ten_trieu_chung, nhom: null });
    return out;
  }

  private async classifyNhomChunk(
    items: { id: number; ten_trieu_chung: string }[],
    nhomBlock: string,
    allowed: Set<string>,
  ): Promise<TrieuChungNhomResult[]> {
    const client = this.getClient();
    const model = this.config.get<string>('YESCALE_MODEL') || YESCALE_DEFAULT_MODEL;
    const block = items.map((v) => `{id=${v.id}, ten="${v.ten_trieu_chung.trim()}"}`).join('\n');

    const systemPrompt = `Bạn là chuyên gia Y học Cổ truyền (Đông Y). Nhiệm vụ: phân loại mỗi TRIỆU CHỨNG vào ĐÚNG MỘT nhóm phù hợp nhất, chọn từ danh sách slug cố định.
QUY TẮC:
- "nhom" PHẢI là một slug trong danh sách đã cho (vd "tinh-than"). KHÔNG bịa slug mới.
- Không rõ thì dùng "khac".
- Trả DUY NHẤT một JSON object {"results":[{"id":<id>,"nhom":"<slug>","ly_do":"<lý do ngắn 1 câu>"}]}.
- KHÔNG markdown, KHÔNG \`\`\`, KHÔNG văn bản thừa.`;
    const userPrompt = `Các NHÓM (slug: ý nghĩa):
${nhomBlock}

Các TRIỆU CHỨNG cần phân loại:
${block}

Phân loại tất cả triệu chứng trên. Trả JSON đúng định dạng đã quy định.`;

    const response = await client.chat.completions.create({
      model,
      temperature: 0.1,
      max_tokens: Math.min(4096, 256 + items.length * 60),
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });
    const content = response.choices?.[0]?.message?.content?.trim() ?? '';
    if (!content) throw new Error('yescale trả về nội dung rỗng');
    const parsed = parseClassifyResults(content);
    if (!parsed) throw new Error(`Không parse được JSON từ AI: ${content.slice(0, 200)}`);

    const byId = new Map(items.map((v) => [v.id, v]));
    const out: TrieuChungNhomResult[] = [];
    const seen = new Set<number>();
    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue;
      const raw = item as Record<string, unknown>;
      const idNum = Number(raw.id ?? raw.id_trieu_chung);
      if (!Number.isFinite(idNum)) continue;
      const v = byId.get(idNum);
      if (!v || seen.has(idNum)) continue;
      seen.add(idNum);
      const slug = String(raw.nhom ?? '').trim();
      const nhom = allowed.has(slug) ? slug : null;
      const ly = typeof raw.ly_do === 'string' ? raw.ly_do.trim() : '';
      out.push({ id: v.id, ten_trieu_chung: v.ten_trieu_chung, nhom, ly_do: ly || undefined });
    }
    for (const v of items) if (!seen.has(v.id)) out.push({ id: v.id, ten_trieu_chung: v.ten_trieu_chung, nhom: null });
    return out;
  }

  /**
   * Gợi ý PHÁP TRỊ cho từng THỂ ĐO (benh_dong_y_excel) để đồng bộ. Mỗi thể: tiền lọc
   * ứng viên theo trùng tên (util) → hỏi AI chọn 1 (đơn) hoặc 2 (kép) pháp trị khớp.
   * AI chỉ GỢI Ý — bác sĩ duyệt. Lỗi 1 thể → trả rỗng cho thể đó, không kéo cả lô.
   */
  async suggestPhapTriForTheDo(
    items: { id: number; name: string }[],
  ): Promise<TheDoPhapTriSuggestion[]> {
    const list = (items ?? []).filter(
      (v) => v && Number.isFinite(v.id) && typeof v.name === 'string' && v.name.trim().length > 0,
    );
    if (!list.length) throw new BadRequestException('Danh sách thể đo rỗng');

    const all: PhapTriNameRow[] = (
      await this.phapTriRepo.query('SELECT id, the_benh FROM phap_tri WHERE the_benh IS NOT NULL')
    ).map((r: { id: number | string; the_benh: string }) => ({ id: Number(r.id), the_benh: r.the_benh }));

    const out: TheDoPhapTriSuggestion[] = [];
    for (const item of list) {
      try {
        out.push(await this.suggestOneTheDo(item, all));
      } catch (err: unknown) {
        // eslint-disable-next-line no-console
        console.error('[AI suggestPhapTriForTheDo] lỗi thể', item.name, '-', (err as Error)?.message ?? err);
        out.push({
          id: item.id,
          name: item.name,
          is_kep: false,
          phap_tri_ids: [],
          phap_tri: [],
          ly_do: 'AI lỗi — chưa gợi ý được',
        });
      }
    }
    return out;
  }

  private async suggestOneTheDo(
    item: { id: number; name: string },
    allPhapTri: PhapTriNameRow[],
  ): Promise<TheDoPhapTriSuggestion> {
    const candidates = topPhapTriCandidates(item.name, allPhapTri, 20);
    const byId = new Map(candidates.map((c) => [c.id, c]));
    if (!candidates.length) {
      return {
        id: item.id,
        name: item.name,
        is_kep: false,
        phap_tri_ids: [],
        phap_tri: [],
        ly_do: 'Không có pháp trị tên gần khớp',
      };
    }

    const client = this.getClient();
    const model = this.config.get<string>('YESCALE_MODEL') || YESCALE_DEFAULT_MODEL;
    const candBlock = candidates.map((c) => `{id=${c.id}, ten="${c.the_benh}"}`).join('\n');
    const systemPrompt = `Bạn là chuyên gia Y học Cổ truyền (Đông Y). Cho MỘT thể bệnh (đo kinh lạc) và danh sách PHÁP TRỊ ứng viên (theo tên thể), hãy chọn pháp trị KHỚP THỂ nhất.
QUY TẮC:
- Thể KÉP (phối hợp 2 tạng/thể: "... lưỡng hư", "... bất giao", tên ghép 2 tạng):
   + Nếu ứng viên CÓ pháp trị trùng ĐÚNG tên thể kép → chọn 1 id đó (pháp trị đã gộp sẵn).
   + Nếu KHÔNG có, nhưng có pháp trị cho TỪNG tạng thành phần → chọn 2 id (2 thành phần).
- Thể ĐƠN → chọn 1 id khớp nhất.
- CHỈ chọn id có trong danh sách ứng viên. Không có ứng viên nào đúng → để phap_tri_ids rỗng [].
- Trả DUY NHẤT một JSON object: {"is_kep": <true|false>, "phap_tri_ids": [<id>...], "ly_do": "<lý do ngắn 1 câu>"}.
- KHÔNG markdown, KHÔNG \`\`\`, KHÔNG văn bản thừa.`;
    const userPrompt = `THỂ BỆNH: "${item.name}"

PHÁP TRỊ ứng viên (id: tên thể):
${candBlock}

Chọn pháp trị khớp thể nhất. Trả JSON đúng định dạng.`;

    const response = await client.chat.completions.create({
      model,
      temperature: 0.1,
      max_tokens: 300,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });
    const content = response.choices?.[0]?.message?.content?.trim() ?? '';
    if (!content) throw new Error('yescale trả về nội dung rỗng');
    const parsed = parseJsonLoose(content);

    let isKep = false;
    let ids: number[] = [];
    let lyDo = '';
    if (parsed) {
      isKep = Boolean((parsed as Record<string, unknown>).is_kep);
      const raw = (parsed as Record<string, unknown>).phap_tri_ids;
      if (Array.isArray(raw)) {
        ids = raw
          .map((x) => Number(x))
          .filter((n) => Number.isFinite(n) && byId.has(n));
      }
      const ly = (parsed as Record<string, unknown>).ly_do;
      lyDo = typeof ly === 'string' ? ly.trim() : '';
    }
    ids = Array.from(new Set(ids)).slice(0, 2);

    return {
      id: item.id,
      name: item.name,
      is_kep: isKep,
      phap_tri_ids: ids,
      phap_tri: ids.map((i) => {
        const c = byId.get(i);
        return { id: i, the_benh: c?.the_benh ?? '' };
      }),
      ly_do: lyDo || undefined,
    };
  }

  /**
   * Gợi ý điền dữ liệu cho MỘT thể bệnh (pháp trị): nguyên nhân theo nhóm + triệu chứng.
   * Triệu chứng AI đề xuất được khớp với bảng `trieu_chung` → matched ids; phần chưa khớp
   * trả kèm nhóm để frontend tạo nhanh. AI chỉ GỢI Ý — bác sĩ duyệt.
   */
  async suggestTheBenh(name: string): Promise<TheBenhAiSuggestion> {
    const ten = (name || '').trim();
    if (!ten) throw new BadRequestException('Thiếu tên thể bệnh');

    const client = this.getClient();
    const model = this.config.get<string>('YESCALE_MODEL') || YESCALE_DEFAULT_MODEL;

    const nnBlock = NGUYEN_NHAN_NHOM.map((n) => `    "${n.slug}": [...]  // ${n.label}`).join('\n');
    // Bỏ "khac" trong gợi ý triệu chứng — frontend gom phần lệch nhóm vào "Chưa phân nhóm".
    const tcBlock = TRIEU_CHUNG_NHOM.filter((n) => n.slug !== 'khac')
      .map((n) => `    "${n.slug}": [...]  // ${n.label}`)
      .join('\n');

    const systemPrompt = `Bạn là chuyên gia Y học Cổ truyền (Đông Y) Việt Nam. Cho tên một THỂ BỆNH Đông Y, hãy trả về CHÍNH XÁC một JSON object mô tả NGUYÊN NHÂN và TRIỆU CHỨNG đặc trưng của thể bệnh đó.

Cấu trúc JSON yêu cầu:
{
  "nguyen_nhan": {
${nnBlock}
  },
  "trieu_chung": {
${tcBlock}
  }
}

QUY TẮC:
- Mỗi TRIỆU CHỨNG là một CỤM TỪ NGẮN GỌN (2–6 từ), KHÔNG phải câu mô tả dài. Vd: "Dễ nổi nóng", "Hay thở dài", "Đầy bụng", "Ăn uống kém", "Tức ngực", "Kinh nguyệt không đều", "Lưỡi đỏ rêu vàng", "Mạch huyền".
- NGUYÊN NHÂN có thể là cụm từ hoặc câu ngắn (vd "Căng thẳng, kìm nén cảm xúc kéo dài").
- Nhóm nào không phù hợp thì để mảng rỗng [].
- Chỉ trả JSON thuần, KHÔNG kèm văn bản, KHÔNG markdown, KHÔNG \`\`\`.
- Dùng tiếng Việt có dấu, thuật ngữ Đông Y chuẩn, viết hoa chữ cái đầu mỗi mục.`;

    let response;
    try {
      response = await client.chat.completions.create({
        model,
        temperature: 0.2,
        max_tokens: 1400,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `THỂ BỆNH: "${ten}"` },
        ],
      });
    } catch (err: any) {
      // KHÔNG relay 401/403 của Yescale: frontend sẽ tưởng phiên hết hạn → đá ra /login.
      const detail = err?.error?.message || err?.message || String(err);
      throw new HttpException(`yescale lỗi: ${detail}`, safeUpstreamStatus(err?.status));
    }

    const content = response.choices?.[0]?.message?.content?.trim() ?? '';
    if (!content) throw new ServiceUnavailableException('yescale trả về nội dung rỗng');
    const parsed = parseJsonLoose(content);
    if (!parsed || typeof parsed !== 'object') {
      throw new ServiceUnavailableException(`Không parse được JSON từ AI: ${content.slice(0, 200)}`);
    }

    const nnObj = (parsed.nguyen_nhan ?? {}) as Record<string, unknown>;
    const tcObj = (parsed.trieu_chung ?? {}) as Record<string, unknown>;

    const nguyen_nhan_list: Array<{ nhom: string; noi_dung: string }> = [];
    for (const { slug } of NGUYEN_NHAN_NHOM) {
      for (const noi_dung of pickStringArray(nnObj[slug])) {
        nguyen_nhan_list.push({ nhom: slug, noi_dung });
      }
    }

    const suggested: Array<{ ten: string; nhom: string }> = [];
    const seenTc = new Set<string>();
    for (const { slug } of TRIEU_CHUNG_NHOM) {
      for (const tcTen of pickStringArray(tcObj[slug])) {
        const key = normName(tcTen);
        if (!key || seenTc.has(key)) continue;
        seenTc.add(key);
        suggested.push({ ten: tcTen, nhom: slug });
      }
    }

    const { ids, matched, unmatched } = await this.mapTrieuChungNames(suggested);
    return {
      nguyen_nhan_list,
      trieu_chung_ids: ids,
      trieu_chung_matched: matched,
      trieu_chung_unmatched: unmatched,
    };
  }

  /** Khớp tên triệu chứng AI đề xuất với bảng `trieu_chung` (chuẩn hoá bỏ dấu). */
  private async mapTrieuChungNames(
    suggested: Array<{ ten: string; nhom: string }>,
  ): Promise<{ ids: number[]; matched: string[]; unmatched: Array<{ ten: string; nhom: string | null }> }> {
    if (!suggested.length) return { ids: [], matched: [], unmatched: [] };
    const all = await this.trieuChungRepo.find();
    const byKey = new Map<string, TrieuChung>();
    for (const t of all) {
      const k = normName(t.ten_trieu_chung || '');
      if (k && !byKey.has(k)) byKey.set(k, t);
    }
    const ids: number[] = [];
    const matched: string[] = [];
    const unmatched: Array<{ ten: string; nhom: string | null }> = [];
    const seen = new Set<number>();
    for (const s of suggested) {
      const hit = byKey.get(normName(s.ten));
      if (hit) {
        if (!seen.has(hit.id)) {
          seen.add(hit.id);
          ids.push(hit.id);
          matched.push(hit.ten_trieu_chung);
        }
      } else {
        unmatched.push({ ten: s.ten, nhom: s.nhom || null });
      }
    }
    return { ids, matched, unmatched };
  }

  /**
   * Tách PHƯƠNG HUYỆT (văn bản dữ liệu cũ) thành huyệt CÓ CẤU TRÚC: AI trích huyệt + phương pháp
   * (Bổ/Tả/Cứu/Châm) + ghi chú điều kiện, rồi khớp tên với danh mục `huyet_vi`. AI chỉ GỢI Ý — bác sĩ duyệt.
   */
  async parsePhuongHuyet(text: string): Promise<PhuongHuyetParsed> {
    const raw = (text || '').trim();
    if (!raw) throw new BadRequestException('Thiếu nội dung phương huyệt');
    const client = this.getClient();
    const model = this.config.get<string>('YESCALE_MODEL') || YESCALE_DEFAULT_MODEL;
    const sys = `Bạn là chuyên gia Châm cứu Y học Cổ truyền. Cho đoạn MÔ TẢ PHƯƠNG HUYỆT, hãy TRÍCH ra danh sách HUYỆT.
Mỗi huyệt là một object:
- "ten_huyet": TÊN HUYỆT (vd "Thần môn", "Túc tam lý", "Đảm du"). TUYỆT ĐỐI không kèm động từ.
- "phuong_phap": một trong "Bổ" | "Tả" | "Cứu" | "Châm" | "Châm + Cứu" | "" — lấy theo ĐỘNG TỪ đứng trước nhóm huyệt (Bổ.../Tả.../Cứu.../Chích→"Châm"). Áp dụng động từ đó cho MỌI huyệt theo sau cho đến khi gặp động từ khác.
- "ghi_chu": điều kiện/biến thể nếu huyệt thuộc trường hợp riêng (vd "Nếu suy tim", "Thấp tim", "Cấp cứu"); để "" nếu thuộc phương huyệt chính.
QUY TẮC:
- CHỈ lấy tên huyệt THẬT; BỎ câu giải nghĩa/lý luận.
- Mỗi huyệt MỘT phần tử (không gộp "A, B" thành một).
- Trả DUY NHẤT JSON {"huyet":[{"ten_huyet":"...","phuong_phap":"...","ghi_chu":"..."}]}. KHÔNG markdown, KHÔNG văn bản thừa.`;

    let response;
    try {
      response = await client.chat.completions.create({
        model,
        temperature: 0.1,
        max_tokens: 1600,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: raw },
        ],
      });
    } catch (err: any) {
      const detail = err?.error?.message || err?.message || String(err);
      throw new HttpException(`yescale lỗi: ${detail}`, safeUpstreamStatus(err?.status));
    }
    const content = response.choices?.[0]?.message?.content?.trim() ?? '';
    if (!content) throw new ServiceUnavailableException('yescale trả về nội dung rỗng');
    const parsed = parseJsonLoose(content);
    const arr = Array.isArray((parsed as Record<string, unknown> | null)?.huyet)
      ? ((parsed as Record<string, unknown>).huyet as unknown[])
      : [];
    const items = arr
      .map((x) => {
        const o = (x ?? {}) as Record<string, unknown>;
        return {
          ten: String(o.ten_huyet ?? '').replace(/\s+/g, ' ').trim(),
          phuong_phap: normPhuongPhap(String(o.phuong_phap ?? '')),
          ghi_chu: String(o.ghi_chu ?? '').replace(/\s+/g, ' ').trim(),
        };
      })
      .filter((x) => x.ten);
    return this.mapHuyetNames(items);
  }

  /** Khớp tên huyệt AI nêu với bảng `huyet_vi` (chuẩn hoá bỏ dấu + alias biến thể). */
  private async mapHuyetNames(
    items: Array<{ ten: string; phuong_phap: string; ghi_chu: string }>,
  ): Promise<PhuongHuyetParsed> {
    const all = await this.huyetViRepo.find();
    const byKey = new Map<string, HuyetVi>();
    for (const h of all) {
      if (h.ten_huyet) {
        const k = normName(h.ten_huyet);
        if (k && !byKey.has(k)) byKey.set(k, h);
      }
      if (h.ma_huyet) {
        const k = normName(h.ma_huyet);
        if (k && !byKey.has(k)) byKey.set(k, h);
      }
    }
    const matched: PhuongHuyetParsed['matched'] = [];
    const unmatched: PhuongHuyetParsed['unmatched'] = [];
    const seen = new Set<number>();
    for (const it of items) {
      const key = normName(it.ten);
      const h = byKey.get(key) ?? byKey.get(HUYET_ALIAS[key] ?? ' ');
      if (h) {
        if (seen.has(h.idHuyet)) continue; // 1 huyệt 1 dòng (giữ lần đầu)
        seen.add(h.idHuyet);
        matched.push({ idHuyet: h.idHuyet, ten_huyet: h.ten_huyet, phuong_phap: it.phuong_phap, ghi_chu: it.ghi_chu });
      } else {
        unmatched.push({ ten: it.ten, phuong_phap: it.phuong_phap, ghi_chu: it.ghi_chu });
      }
    }
    return { matched, unmatched };
  }

  private async mapKinhMachNames(names: string[]): Promise<{
    ids: number[];
    matchedNames: string[];
    unmatched: string[];
  }> {
    if (!names.length) return { ids: [], matchedNames: [], unmatched: [] };

    const all = await this.kinhMachRepo.find();
    const byKey = new Map<string, KinhMach>();
    for (const km of all) {
      if (km.ten_kinh_mach) byKey.set(normKm(km.ten_kinh_mach), km);
      if (km.ten_viet_tat) byKey.set(normKm(km.ten_viet_tat), km);
    }

    const ids: number[] = [];
    const matchedNames: string[] = [];
    const unmatched: string[] = [];
    const seen = new Set<number>();

    for (const name of names) {
      const key = normKm(name);
      let km = byKey.get(key);
      if (!km) {
        // Loose contains-match: "Đại Trường Kinh" vs "Đại Trường".
        for (const candidate of all) {
          const cKey = normKm(candidate.ten_kinh_mach || '');
          if (!cKey) continue;
          if (key.includes(cKey) || cKey.includes(key)) {
            km = candidate;
            break;
          }
        }
      }
      if (km && !seen.has(km.idKinhMach)) {
        seen.add(km.idKinhMach);
        ids.push(km.idKinhMach);
        matchedNames.push(km.ten_kinh_mach || name);
      } else if (!km) {
        unmatched.push(name);
      }
    }
    return { ids, matchedNames, unmatched };
  }
}

function splitNames(raw: string): string[] {
  if (!raw) return [];
  return raw
    .split(/[,;/]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Normalize meridian name: lowercase, strip diacritics, collapse whitespace, drop "kinh" suffix. */
function normKm(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/\bkinh\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function pickString(obj: Record<string, unknown>, key: string): string {
  const v = obj[key];
  if (v == null) return '';
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean).join(', ');
  return String(v).trim();
}

/** Chuẩn hoá "phương pháp" về đúng bộ giá trị UI dùng (Bổ/Tả/Cứu/Châm/Châm + Cứu). */
function normPhuongPhap(v: string): string {
  const s = (v || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase();
  const cham = /\bcham\b|chich/.test(s);
  const cuu = /\bcuu\b/.test(s);
  if (/\bbo\b/.test(s)) return 'Bổ';
  if (/\bta\b/.test(s)) return 'Tả';
  if (cham && cuu) return 'Châm + Cứu';
  if (cuu) return 'Cứu';
  if (cham) return 'Châm';
  return '';
}

/** Alias biến thể tên huyệt (khoá đã chuẩn hoá) → khoá huyệt trong danh mục. */
const HUYET_ALIAS: Record<string, string> = {
  'con luan': 'con lon', // Cồn/Côn luân → Côn lôn
  'dam du': 'dom du', // Đảm du → Đởm du
  'chien trung': 'dan trung', // Chiên trung → Đản trung
  'than tan': 'than tang', // Thận tân (gõ lỗi) → Thận tàng (nếu có)
};

/** Chuẩn hoá một giá trị (mảng / chuỗi) AI trả về thành mảng chuỗi gọn, đã khử trùng lặp. */
function pickStringArray(v: unknown): string[] {
  const raw = Array.isArray(v) ? v : typeof v === 'string' ? v.split(/[;\n]+/) : [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const x of raw) {
    const s = (x == null ? '' : String(x)).replace(/\s+/g, ' ').trim();
    if (!s) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

function emptyHuyetInfo(): HuyetAiInfo {
  return {
    ten_khac: '',
    vi_tri: '',
    giai_phau: '',
    dac_tinh: '',
    chu_tri: '',
    cham_cuu: '',
    phoi_huyet: '',
  };
}

/**
 * Parse AI output thành mảng kết quả phân loại.
 * Chấp nhận nhiều hình thức:
 * - {"results": [...]} (định dạng yêu cầu)
 * - {"data": [...]} / {"classifications": [...]} / {"items": [...]} (fallback)
 * - Mảng JSON thuần ở root: [...]
 * - Có markdown fence ```json ... ```
 * - Có text rác trước/sau JSON
 */
function parseClassifyResults(raw: string): unknown[] | null {
  const candidates: unknown[] = [];

  const tryAdd = (val: unknown) => {
    if (val !== null && val !== undefined) candidates.push(val);
  };

  // 1) Parse trực tiếp
  try { tryAdd(JSON.parse(raw)); } catch { /* noop */ }

  // 2) Bóc markdown fence
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) {
    try { tryAdd(JSON.parse(fence[1])); } catch { /* noop */ }
  }

  // 3) Cắt theo dấu { ... } đầu/cuối
  const fObj = raw.indexOf('{');
  const lObj = raw.lastIndexOf('}');
  if (fObj >= 0 && lObj > fObj) {
    try { tryAdd(JSON.parse(raw.slice(fObj, lObj + 1))); } catch { /* noop */ }
  }

  // 4) Cắt theo dấu [ ... ] đầu/cuối
  const fArr = raw.indexOf('[');
  const lArr = raw.lastIndexOf(']');
  if (fArr >= 0 && lArr > fArr) {
    try { tryAdd(JSON.parse(raw.slice(fArr, lArr + 1))); } catch { /* noop */ }
  }

  const ARRAY_KEYS = ['results', 'data', 'classifications', 'items', 'list', 'phan_loai'];

  for (const cand of candidates) {
    if (Array.isArray(cand)) return cand;
    if (cand && typeof cand === 'object') {
      const obj = cand as Record<string, unknown>;
      for (const key of ARRAY_KEYS) {
        const v = obj[key];
        if (Array.isArray(v)) return v;
      }
      // Object dạng map id → suggestion → biến về mảng entries
      const entries = Object.entries(obj).filter(([, v]) => v && typeof v === 'object');
      if (entries.length) {
        const arr = entries
          .map(([k, v]) => {
            const o = v as Record<string, unknown>;
            return { ...o, id: o.id ?? Number(k) };
          })
          .filter((x) => Number.isFinite(Number(x.id)));
        if (arr.length) return arr;
      }
    }
  }

  // Salvage: nếu JSON bị truncate giữa chừng, trích từng object {...} hoàn chỉnh.
  const salvaged: unknown[] = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escape = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (inString) {
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') { inString = true; continue; }
    if (ch === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && start >= 0) {
        try {
          const obj = JSON.parse(raw.slice(start, i + 1));
          if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
            const o = obj as Record<string, unknown>;
            // Chỉ giữ object trông giống classification entry (có id)
            if ('id' in o || 'id_vi_thuoc' in o) {
              salvaged.push(obj);
            }
          }
        } catch {
          // skip malformed object
        }
        start = -1;
      }
    }
  }
  if (salvaged.length) return salvaged;

  return null;
}

function parseJsonLoose(raw: string): Record<string, unknown> | null {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence?.[1]) {
      try {
        return JSON.parse(fence[1]) as Record<string, unknown>;
      } catch {
        // fall through
      }
    }
    const first = raw.indexOf('{');
    const last = raw.lastIndexOf('}');
    if (first >= 0 && last > first) {
      try {
        return JSON.parse(raw.slice(first, last + 1)) as Record<string, unknown>;
      } catch {
        // fall through
      }
    }
    return null;
  }
}
