import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

/**
 * Cửa duy nhất gọi mô hình của bot thẩm định.
 *
 * Ba tính chất, và cả ba đều là chống-tự-bắn-chân chứ không phải tiện nghi:
 *   · KHÔNG NÉM LỖI. Trả null. Một mục hỏng không được làm sập ca 100 mục.
 *   · ĐẾM MỌI LƯỢT, kể cả lượt hỏng. Không đếm lượt hỏng thì một sự cố bên nhà cung cấp
 *     biến thành vòng lặp gọi không giới hạn.
 *   · THIẾU CẤU HÌNH THÌ NẰM IM. Cùng lối với Telegram và push trong `su-co`.
 */
@Injectable()
export class ThamDinhLlmService {
  private readonly logger = new Logger('ThamDinhLlm');
  private client: OpenAI | null = null;
  private daGoi = 0;

  constructor(private readonly config: ConfigService) {}

  daCauHinh(): boolean {
    const k = this.config.get<string>('YESCALE_API_KEY');
    return typeof k === 'string' && k.trim().length > 0;
  }

  moCa(): void {
    this.daGoi = 0;
  }

  soLuotDaGoi(): number {
    return this.daGoi;
  }

  private tranTien(): number {
    const n = Number(this.config.get<string>('THAM_DINH_TRAN_TIEN'));
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 300;
  }

  conHanMuc(): boolean {
    return this.daGoi < this.tranTien();
  }

  modelCuaTang(doKy: boolean): string {
    const sang = this.config.get<string>('YESCALE_MODEL') || 'gemini-2.5-flash-lite';
    if (!doKy) return sang;
    return this.config.get<string>('THAM_DINH_MODEL_KY') || sang;
  }

  async goi(loiNhac: string, noiDung: string, doKy: boolean): Promise<string | null> {
    if (!this.daCauHinh()) return null;
    if (!this.conHanMuc()) return null;

    this.daGoi += 1;
    try {
      return await this.goiThat(loiNhac, noiDung, doKy);
    } catch (e) {
      this.logger.warn(`gọi mô hình hỏng: ${(e as Error).message}`);
      return null;
    }
  }

  /** Tách riêng để test thay được mà không cần mạng. */
  protected async goiThat(loiNhac: string, noiDung: string, doKy: boolean): Promise<string> {
    const phanHoi = await this.layClient().chat.completions.create({
      model: this.modelCuaTang(doKy),
      temperature: 0.1,
      max_tokens: doKy ? 4000 : 2000,
      messages: [
        { role: 'system', content: loiNhac },
        { role: 'user', content: noiDung },
      ],
    });
    return phanHoi.choices?.[0]?.message?.content?.trim() || '';
  }

  private layClient(): OpenAI {
    if (!this.client) {
      this.client = new OpenAI({
        apiKey: this.config.get<string>('YESCALE_API_KEY'),
        baseURL: this.config.get<string>('YESCALE_BASE_URL') || 'https://api.yescale.io/v1',
      });
    }
    return this.client;
  }
}
