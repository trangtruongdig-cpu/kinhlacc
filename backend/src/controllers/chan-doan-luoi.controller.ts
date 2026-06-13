import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';
import { ChanDoanLuoi } from '../models/chan-doan-luoi.model';
import { CreateChanDoanLuoiDto, UpdateChanDoanLuoiDto } from '../models/chan-doan-luoi.dto';

interface EmbeddingEntry {
  vi: string;
  prototype: number[];
  count: number;
}
type EmbeddingIndex = Record<string, EmbeddingEntry>;

@Injectable()
export class ChanDoanLuoiService {
  private embeddingIndex: EmbeddingIndex | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private tfModel: any = null;

  constructor(
    @InjectRepository(ChanDoanLuoi)
    private readonly repo: Repository<ChanDoanLuoi>,
    private readonly config: ConfigService,
  ) {}

  findByBenhNhan(idBenhNhan: number): Promise<ChanDoanLuoi[]> {
    return this.repo.find({
      where: { idBenhNhan },
      order: { ngayKham: 'DESC' },
      take: 20,
    });
  }

  findAll(limit = 50): Promise<ChanDoanLuoi[]> {
    return this.repo.find({ order: { ngayKham: 'DESC' }, take: limit });
  }

  findOne(id: number): Promise<ChanDoanLuoi | null> {
    return this.repo.findOneBy({ id });
  }

  async create(dto: CreateChanDoanLuoiDto, userId?: number): Promise<ChanDoanLuoi> {
    const item = this.repo.create({
      idBenhNhan: dto.idBenhNhan ?? null,
      ngayKham: dto.ngayKham ? new Date(dto.ngayKham) : new Date(),
      mauChat: dto.mauChat ?? null,
      hinhDang: dto.hinhDang ?? null,
      doAm: dto.doAm ?? null,
      mauReu: dto.mauReu ?? null,
      tinhChatReu: dto.tinhChatReu ?? null,
      phanBoReu: dto.phanBoReu ?? null,
      vungBatThuong: dto.vungBatThuong ?? null,
      ketQuaDongY: dto.ketQuaDongY ?? null,
      ghiChu: dto.ghiChu ?? null,
      createdBy: userId ?? null,
    });
    return this.repo.save(item);
  }

  async update(id: number, dto: UpdateChanDoanLuoiDto): Promise<ChanDoanLuoi> {
    const item = await this.repo.findOneBy({ id });
    if (!item) throw new NotFoundException('Không tìm thấy bản ghi chẩn đoán lưỡi');
    Object.assign(item, {
      ...(dto.idBenhNhan !== undefined && { idBenhNhan: dto.idBenhNhan }),
      ...(dto.ngayKham !== undefined && { ngayKham: new Date(dto.ngayKham) }),
      ...(dto.mauChat !== undefined && { mauChat: dto.mauChat }),
      ...(dto.hinhDang !== undefined && { hinhDang: dto.hinhDang }),
      ...(dto.doAm !== undefined && { doAm: dto.doAm }),
      ...(dto.mauReu !== undefined && { mauReu: dto.mauReu }),
      ...(dto.tinhChatReu !== undefined && { tinhChatReu: dto.tinhChatReu }),
      ...(dto.phanBoReu !== undefined && { phanBoReu: dto.phanBoReu }),
      ...(dto.vungBatThuong !== undefined && { vungBatThuong: dto.vungBatThuong }),
      ...(dto.ketQuaDongY !== undefined && { ketQuaDongY: dto.ketQuaDongY }),
      ...(dto.ghiChu !== undefined && { ghiChu: dto.ghiChu }),
    });
    return this.repo.save(item);
  }

  async remove(id: number): Promise<void> {
    const item = await this.repo.findOneBy({ id });
    if (item) await this.repo.remove(item);
  }

  // ── ML Similarity Search (không cần API, dùng embedding MobileNetV2) ──

  private loadEmbeddingIndex(): EmbeddingIndex {
    if (this.embeddingIndex) return this.embeddingIndex;
    const filePath = path.join(__dirname, '../ml/atlas-embeddings.json');
    if (!fs.existsSync(filePath)) return {};
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      this.embeddingIndex = JSON.parse(raw) as EmbeddingIndex;
      return this.embeddingIndex;
    } catch {
      return {};
    }
  }

  private async loadTfModel() {
    if (this.tfModel) return this.tfModel;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mobilenet = require('@tensorflow-models/mobilenet');
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const tf = require('@tensorflow/tfjs-node');
      this.tfModel = { tf, mn: await mobilenet.load({ version: 2, alpha: 1.0 }) };
      return this.tfModel;
    } catch {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const tf = require('@tensorflow/tfjs');
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('@tensorflow/tfjs-backend-cpu');
        await tf.setBackend('cpu');
        await tf.ready();
        this.tfModel = { tf, mn: await mobilenet.load({ version: 2, alpha: 1.0 }) };
        return this.tfModel;
      } catch {
        return null;
      }
    }
  }

  private cosine(a: number[], b: number[]): number {
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i];
    }
    return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-8);
  }

  async mlSearch(imageBase64: string): Promise<unknown> {
    const index = this.loadEmbeddingIndex();
    const classes = Object.keys(index);

    if (!classes.length) {
      return {
        error: 'Chưa có embeddings. Chạy: node tools/build-atlas-embeddings.cjs',
        similarity: [], features: {},
      };
    }

    const loaded = await this.loadTfModel();
    if (!loaded) {
      return this.mlSearchHistogram(imageBase64, index);
    }

    const { tf, mn } = loaded;
    const buf = Buffer.from(imageBase64, 'base64');
    let imgTensor, resized, batched, emb;
    try {
      if (tf.node?.decodeImage) {
        imgTensor = tf.node.decodeImage(buf, 3);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { Jimp } = require('jimp');
        const img = await Jimp.read(buf);
        img.resize({ w: 224, h: 224 });
        const { data, width, height } = img.bitmap;
        const pixels = new Float32Array(width * height * 3);
        for (let i = 0; i < width * height; i++) {
          pixels[i*3]   = data[i*4]   / 255.0;
          pixels[i*3+1] = data[i*4+1] / 255.0;
          pixels[i*3+2] = data[i*4+2] / 255.0;
        }
        imgTensor = tf.tensor3d(pixels, [height, width, 3]);
      }
      resized   = tf.image.resizeBilinear(imgTensor, [224, 224]);
      batched   = resized.expandDims(0);
      emb       = mn.infer(batched, true);
      const queryVec: number[] = Array.from(await emb.data());
      tf.dispose([imgTensor, resized, batched, emb]);

      const results = classes
        .filter(id => index[id].prototype?.length)
        .map(id => ({
          id,
          vi: index[id].vi,
          score: Math.round(Math.max(0, this.cosine(queryVec, index[id].prototype)) * 100),
          reason: `Độ tương đồng hình ảnh đã học từ ${index[id].count || '?'} mẫu`,
        }))
        .filter(r => r.score > 25)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      return { similarity: results, features: {}, source: 'ml' };
    } catch (e: unknown) {
      tf.dispose([imgTensor, resized, batched, emb].filter(Boolean));
      throw new ServiceUnavailableException('Lỗi inference ML: ' + (e as Error).message);
    }
  }

  private mlSearchHistogram(_imageBase64: string, _index: EmbeddingIndex): unknown {
    return {
      error: 'Cần cài @tensorflow/tfjs-node để dùng tính năng ML. Xem tools/build-atlas-embeddings.cjs',
      similarity: [], features: {}, source: 'fallback',
    };
  }

  // ── Vision AI (GPT-4o) ──

  async analyzeImage(imageBase64: string): Promise<unknown> {
    const apiKey = this.config.get<string>('YESCALE_API_KEY');
    if (!apiKey) throw new ServiceUnavailableException('Chưa cấu hình YESCALE_API_KEY');
    const baseURL = this.config.get<string>('YESCALE_BASE_URL') || 'https://api.yescale.vip/v1';
    const model = this.config.get<string>('YESCALE_VISION_MODEL') || 'gpt-4o';
    const client = new OpenAI({ apiKey, baseURL });

    const prompt = `Bạn là chuyên gia Đông Y. Phân tích ảnh lưỡi bệnh nhân này.

Trả về CHÍNH XÁC một JSON object (không markdown, không code block):
{
  "similarity": [{ "id": "class_id", "vi": "tên tiếng Việt", "score": 0-100, "reason": "lý do 1 câu" }],
  "features": {
    "mauChat": "Nhạt|Hồng Bình|Đỏ|Đỏ Sẫm|Tím / Xanh Tím",
    "hinhDang": ["Bình Thường|Phì Đại|Teo Nhỏ|Răng Cưa|Nứt Nẻ|Cứng|Rung|Lệch"],
    "doAm": "Ướt|Nhuận|Khô",
    "mauReu": "Trắng|Vàng|Xám|Đen|Không Rêu",
    "tinhChatReu": ["Mỏng|Dày|Nhờn / Dính|Khô|Bong Tróc"],
    "phanBoReu": ["Toàn Bộ|Đầu Lưỡi|Chân Lưỡi|Hai Bên|Giữa Lưỡi"]
  }
}

20 thể đơn để đối chiếu (chỉ trả những thể thực sự thấy trong ảnh, score > 30, tối đa 5, sắp xếp giảm dần):
jiankangshe=Lưỡi Hồng Bình, botaishe=Rêu Bong Tróc, hongshe=Lưỡi Đỏ, zishe=Lưỡi Tím / Xanh Tím, pangdashe=Lưỡi Phì Đại, shoushe=Lưỡi Teo Nhỏ, hongdianshe=Lưỡi Điểm Đỏ, liewenshe=Lưỡi Nứt Nẻ, chihenshe=Lưỡi Răng Cưa, baitaishe=Rêu Trắng, huangtaishe=Rêu Vàng, heitaishe=Rêu Đen, huataishe=Rêu Trơn / Nhờn, shenquao=Vùng Thận Lõm, shenqutu=Vùng Thận Lồi, gandanao=Vùng Can Đởm Lõm, gandantu=Vùng Can Đởm Lồi, piweiao=Vùng Tỳ Vị Lõm, xinfeiao=Vùng Tâm Phế Lõm, xinfeitu=Vùng Tâm Phế Lồi

Mỗi giá trị trong features phải chọn từ danh sách cho phép, không tự đặt tên mới.`;

    const response = await client.chat.completions.create({
      model,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
        ],
      }],
      max_tokens: 1200,
    });

    const raw = (response.choices[0].message.content || '{}').trim();
    const clean = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    try {
      return JSON.parse(clean);
    } catch {
      return { error: 'Không phân tích được ảnh', raw };
    }
  }
}
