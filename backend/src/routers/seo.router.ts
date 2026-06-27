import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SeoService } from '../controllers/seo.controller';
import { QuanTriGuard } from '../middlewares/auth/quan-tri.guard';
import {
  AnalyzeBatchDto,
  CreateDoiThuDto,
  GapAnalysisDto,
  GenerateDraftDto,
  GenerateImagesDto,
  RunTrendsDto,
  UpdateBaiVietDto,
} from '../models/seo.dto';

// Guard JWT là TOÀN CỤC (APP_GUARD) → mọi endpoint dưới đây đã yêu cầu đăng nhập.
// QuanTriGuard (chạy SAU JwtAuthGuard) siết thêm: CHỈ Quản Trị Viên (kind='staff' & quanTri=true).
// Lý do: các route này đốt credit AI, spawn script, ghi file, xoá dữ liệu — token bệnh nhân/nhân viên
// thường KHÔNG được phép. Route blog công khai nằm ở SeoBlogRouter (controller khác, vẫn @Public).
@UseGuards(QuanTriGuard)
@Controller('seo')
export class SeoRouter {
  constructor(private readonly service: SeoService) {}

  // ---- Đối thủ -------------------------------------------------------------
  @Get('doi-thu')
  async listDoiThu() {
    const data = await this.service.listDoiThu();
    return { success: true, data };
  }

  @Post('doi-thu')
  async createDoiThu(@Body() dto: CreateDoiThuDto) {
    const data = await this.service.createDoiThu(dto);
    return { success: true, data };
  }

  @Delete('doi-thu/:id')
  async removeDoiThu(@Param('id') id: string) {
    await this.service.removeDoiThu(+id);
    return { success: true };
  }

  @Post('doi-thu/:id/crawl')
  async crawl(@Param('id') id: string) {
    const data = await this.service.crawlSitemap(+id);
    return { success: true, data };
  }

  @Post('doi-thu/:id/analyze-batch')
  async analyzeBatch(@Param('id') id: string, @Body() dto: AnalyzeBatchDto) {
    const data = await this.service.analyzeBatch(+id, dto?.limit ?? 10);
    return { success: true, data };
  }

  // ---- Cockpit Index (ép Google index toàn bộ sitemap) --------------------
  // Tổng quan độ phủ index: bao nhiêu URL đã index / chưa index / chưa kiểm.
  @Get('index/overview')
  async indexOverview() {
    const data = await this.service.indexOverview();
    return { success: true, data };
  }

  // Danh sách URL theo nhóm: ?bucket=indexed|chua_index|khong_ro|loi|chua_kiem|all
  @Get('index/list')
  async indexList(@Query('bucket') bucket?: string) {
    const data = await this.service.indexList(bucket);
    return { success: true, data };
  }

  // Quét 1 lô (mặc định 20) URL chưa kiểm qua GSC. Frontend gọi lặp tới khi remaining=0.
  @Post('index/scan')
  async indexScan(@Body('batch') batch?: number) {
    const data = await this.service.indexScan(Number(batch) || 20);
    return { success: true, data };
  }

  // Nộp lại sitemap.xml cho Google (thúc đọc lại danh sách URL).
  @Post('index/resubmit-sitemap')
  async indexResubmit() {
    const data = await this.service.resubmitOwnSitemap();
    return { success: true, data };
  }

  // Ping IndexNow (Bing/Cốc Cốc/...): mặc định chỉ URL chưa index; body {all:true} = gửi hết.
  @Post('index/indexnow')
  async indexNow(@Body('all') all?: boolean) {
    const data = await this.service.indexNowPush(!all);
    return { success: true, data };
  }

  // ---- URL -----------------------------------------------------------------
  @Get('url')
  async listUrls(
    @Query('doiThuId') doiThuId?: string,
    @Query('trangThai') trangThai?: string,
  ) {
    const data = await this.service.listUrls(
      doiThuId ? +doiThuId : undefined,
      trangThai || undefined,
    );
    return { success: true, data };
  }

  @Post('url/:id/analyze')
  async analyzeUrl(@Param('id') id: string, @Query('force') force?: string) {
    // force=true: ép phân tích kể cả khi URL trông "ngoài ngách Đông Y" (bỏ qua bộ lọc).
    const data = await this.service.analyzeUrl(+id, force === 'true');
    return { success: true, data };
  }

  @Delete('url/:id')
  async removeUrl(@Param('id') id: string) {
    await this.service.removeUrl(+id);
    return { success: true };
  }

  // ---- Cụm chủ đề / gap analysis ------------------------------------------
  @Get('cum')
  async listCum() {
    const data = await this.service.listCum();
    return { success: true, data };
  }

  @Post('gap-analysis')
  async gapAnalysis(@Body() dto: GapAnalysisDto) {
    const data = await this.service.gapAnalysis(dto?.doiThuId);
    return { success: true, data };
  }

  // Gợi ý "đất trống thực thể": bơm sẵn các thực thể Đông Y giá trị cao vào hàng chờ Lò Viết
  // (không cần đối thủ). Trả về TOÀN BỘ cụm (như gap-analysis) để frontend nạp lại.
  @Post('cum/dat-trong')
  async goiYDatTrong() {
    const data = await this.service.goiYDatTrong();
    return { success: true, data };
  }

  // ---- Phase 2: Lò Viết Bài ------------------------------------------------
  @Get('bai-viet')
  async listBaiViet() {
    const data = await this.service.listBaiViet();
    return { success: true, data };
  }

  @Post('bai-viet/generate')
  async generateDraft(@Body() dto: GenerateDraftDto) {
    const data = await this.service.generateDraft(dto);
    return { success: true, data };
  }

  @Get('bai-viet/:id')
  async getBaiViet(@Param('id') id: string) {
    const data = await this.service.getBaiViet(+id);
    return { success: true, data };
  }

  @Get('bai-viet/:id/export')
  async exportArticle(@Param('id') id: string) {
    const data = await this.service.exportArticle(+id);
    return { success: true, data };
  }

  @Post('bai-viet/:id/publish')
  async publishArticle(@Param('id') id: string) {
    const data = await this.service.publishArticle(+id);
    return { success: true, data };
  }

  @Post('bai-viet/:id/generate-images')
  async generateImages(@Param('id') id: string, @Body() dto: GenerateImagesDto) {
    const data = await this.service.generateBodyImages(+id, dto?.max ?? 4);
    return { success: true, data };
  }

  // Vẽ TỪNG ảnh một (frontend gọi lặp để hiện tiến trình thật + tránh timeout).
  @Post('bai-viet/:id/generate-image')
  async generateOneImage(@Param('id') id: string) {
    const data = await this.service.generateOneBodyImage(+id);
    return { success: true, data };
  }

  // Vẽ ẢNH BÌA AI cho cả bài (banner ngang khớp chủ đề) → lưu cover.* (đọc lại lúc Đăng).
  @Post('bai-viet/:id/generate-cover')
  async generateCover(@Param('id') id: string) {
    const data = await this.service.generateCoverImage(+id);
    return { success: true, data };
  }

  // Tiến trình % THẬT đang vẽ ảnh (frontend poll trong lúc chờ generate-cover/generate-image).
  // kind='cover'|'body'. data = {pct,stage} hoặc null nếu chưa có.
  @Get('bai-viet/:id/img-progress')
  imgProgress(@Param('id') id: string, @Query('kind') kind?: string) {
    const data = this.service.getImgProgress(+id, kind === 'cover' ? 'cover' : 'body');
    return { success: true, data };
  }

  @Put('bai-viet/:id')
  async updateBaiViet(@Param('id') id: string, @Body() dto: UpdateBaiVietDto) {
    const data = await this.service.updateBaiViet(+id, dto);
    return { success: true, data };
  }

  @Delete('bai-viet/:id')
  async removeBaiViet(@Param('id') id: string) {
    await this.service.removeBaiViet(+id);
    return { success: true };
  }

  // ---- Phase 3: Tự đăng theo xu hướng -------------------------------------
  @Get('trends/discover')
  async discoverTrends(@Query('seeds') seeds?: string) {
    const list = seeds
      ? seeds.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;
    const data = await this.service.discoverTrends(list);
    return { success: true, data };
  }

  @Post('trends/run')
  async runTrends(@Body() dto: RunTrendsDto) {
    const data = await this.service.runTrendDrafts(dto?.keywords || []);
    return { success: true, data };
  }
}
