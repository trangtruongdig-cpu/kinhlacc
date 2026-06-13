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
import { safeUpstreamStatus } from '../utils/external-error.util';

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

@Injectable()
export class AiSuggestService {
  private client: OpenAI | null = null;
  private clientKey = '';
  private clientBase = '';

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(KinhMach)
    private readonly kinhMachRepo: Repository<KinhMach>,
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
