import {
  BadRequestException,
  HttpException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, searchconsole_v1 } from 'googleapis';
import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, resolve as pathResolve } from 'node:path';
import { safeUpstreamStatus } from '../utils/external-error.util';

/**
 * ============================================================================
 *  GSC = Google Search Console — NỀN MÓNG KẾT NỐI
 * ============================================================================
 *
 *  Service này nói chuyện với API chính thức của Google Search Console để lấy về
 *  DỮ LIỆU THẬT của website kinhlac.online:
 *    - Hiệu suất tìm kiếm (từ khoá nào ra site, bao nhiêu click/hiển thị, vị trí)
 *    - Phát hiện từ khoá bị "ăn thịt" (cannibalization — nhiều trang tranh 1 từ khoá)
 *    - Trạng thái sitemap (Google đã đọc chưa, có lỗi không)
 *    - Kiểm tra 1 URL đã được Google index chưa
 *
 *  XÁC THỰC: dùng "Service Account" (tài khoản máy — không cần đăng nhập tay).
 *  Tái dùng đúng pattern Firebase đang có: cả JSON service account nằm trong 1 biến
 *  môi trường. Thứ tự ưu tiên:
 *    1. GSC_SERVICE_ACCOUNT   (JSON riêng cho GSC — khuyến nghị)
 *    2. FIREBASE_SERVICE_ACCOUNT (tái dùng — vì Firebase cũng là 1 dự án Google Cloud;
 *       chỉ cần BẬT Search Console API trong dự án đó + thêm email service account này
 *       vào Search Console là chạy được, KHỎI tạo key mới).
 *
 *  Muốn chạy được, BẠN phải làm 1 lần trên Google (xem backend/GSC-SETUP.md):
 *    - Bật "Google Search Console API" trong Google Cloud.
 *    - Thêm email service account vào property của bạn trong Search Console.
 *    - Đặt GSC_SITE_URL khớp đúng property (vd "sc-domain:kinhlac.online").
 */

// Quyền đầy đủ: đọc số liệu + gửi sitemap + kiểm tra URL.
const SCOPES = ['https://www.googleapis.com/auth/webmasters'];

// Google Search Console trễ dữ liệu ~2-3 ngày. Mặc định lấy 28 ngày gần nhất.
const DEFAULT_DAYS = 28;
const MAX_DAYS = 480; // GSC giữ ~16 tháng lịch sử
const CANNIBAL_ROW_LIMIT = 25000; // trần API cho 1 lần query

interface ServiceAccount {
  client_email: string;
  private_key: string;
  project_id?: string;
}

/** 1 dòng số liệu hiệu suất đã làm gọn cho frontend. */
interface PerfRow {
  key: string; // giá trị chiều (query / page / date) — tuỳ ngữ cảnh
  clicks: number;
  impressions: number;
  ctr: number; // 0..1
  position: number;
}

@Injectable()
export class GscService {
  private sc: searchconsole_v1.Searchconsole | null = null;
  private cachedSig = ''; // chữ ký để biết khi nào cần tạo lại client
  private authMode: 'oauth' | 'service_account' = 'service_account';
  private authWho = ''; // tài khoản/email đang dùng — để hiện trong thông báo

  constructor(private readonly config: ConfigService) {}

  // ===========================================================================
  // XÁC THỰC & CLIENT
  // ===========================================================================

  /**
   * Lấy nội dung JSON service account. Thử lần lượt (dễ → khó cho người dùng):
   *   1. File mặc định backend/config/gsc-service-account.json  ← KHUYẾN NGHỊ (chỉ cần bỏ file vào)
   *   2. GSC_SERVICE_ACCOUNT_FILE = đường dẫn tới file .json
   *   3. GSC_SERVICE_ACCOUNT = JSON dán thẳng trong env (1 dòng)
   *   4. FIREBASE_SERVICE_ACCOUNT = tái dùng tài khoản Firebase
   */
  private readRawCredential(): string | null {
    const fileEnv = this.config.get<string>('GSC_SERVICE_ACCOUNT_FILE');
    const candidates = [
      'config/gsc-service-account.json',
      ...(fileEnv && fileEnv.trim() ? [fileEnv.trim()] : []),
    ];
    for (const c of candidates) {
      const p = isAbsolute(c) ? c : pathResolve(process.cwd(), c);
      if (existsSync(p)) return readFileSync(p, 'utf8');
    }
    const inline = this.config.get<string>('GSC_SERVICE_ACCOUNT');
    if (inline && inline.trim().startsWith('{')) return inline;
    const firebase = this.config.get<string>('FIREBASE_SERVICE_ACCOUNT');
    if (firebase && firebase.trim().startsWith('{')) return firebase;
    return null;
  }

  /** Đọc + parse service account (từ file config, env, hoặc fallback Firebase). */
  private loadServiceAccount(): ServiceAccount {
    const raw = this.readRawCredential();
    if (!raw) {
      throw new ServiceUnavailableException(
        'Chưa cấu hình GSC. Cách dễ nhất: bỏ file khoá vào backend/config/gsc-service-account.json. ' +
          'Xem hướng dẫn backend/GSC-SETUP.md.',
      );
    }
    let parsed: ServiceAccount;
    try {
      parsed = JSON.parse(raw) as ServiceAccount;
    } catch {
      throw new ServiceUnavailableException(
        'Nội dung service account không phải JSON hợp lệ. Kiểm tra lại file .json tải từ Google Cloud.',
      );
    }
    if (!parsed.client_email || !parsed.private_key) {
      throw new ServiceUnavailableException(
        'Service account thiếu client_email/private_key. Kiểm tra lại file JSON tải từ Google Cloud.',
      );
    }
    // Một số cách lưu env biến \n thành "\\n" — chuẩn hoá lại thành xuống dòng thật.
    parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    return parsed;
  }

  /** Property cần truy vấn. URL-prefix: "https://kinhlac.online/". Domain property: "sc-domain:kinhlac.online". */
  siteUrl(): string {
    const v = this.config.get<string>('GSC_SITE_URL');
    if (v && v.trim()) return v.trim();
    // Mặc định KHỚP property hiện có của kinhlac (kiểu "Tiền tố URL", nhớ dấu "/" cuối).
    return 'https://kinhlac.online/';
  }

  /**
   * Dựng đối tượng xác thực. ƯU TIÊN OAuth (đăng nhập bằng tài khoản chủ sở hữu),
   * không có thì fallback Service Account. Ném lỗi gọn nếu chưa cấu hình gì.
   */
  private buildAuth(): {
    auth: InstanceType<typeof google.auth.OAuth2> | InstanceType<typeof google.auth.GoogleAuth>;
    sig: string;
    mode: 'oauth' | 'service_account';
    who: string;
  } {
    const cid = this.config.get<string>('GSC_OAUTH_CLIENT_ID');
    const csec = this.config.get<string>('GSC_OAUTH_CLIENT_SECRET');
    const rt = this.config.get<string>('GSC_OAUTH_REFRESH_TOKEN');
    if (cid && csec && rt) {
      const o = new google.auth.OAuth2(cid, csec);
      o.setCredentials({ refresh_token: rt });
      // Tài khoản đăng nhập (vd trangtruong.dig@gmail.com) đã có sẵn quyền trên property.
      return { auth: o, sig: `oauth:${cid}:${rt.length}`, mode: 'oauth', who: 'tài khoản OAuth đã uỷ quyền' };
    }
    // Fallback: Service Account (cần được thêm vào Search Console mới có quyền).
    const sa = this.loadServiceAccount();
    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: sa.client_email, private_key: sa.private_key },
      scopes: SCOPES,
    });
    return {
      auth,
      sig: `sa:${sa.client_email}:${sa.private_key.length}`,
      mode: 'service_account',
      who: sa.client_email,
    };
  }

  /** Tạo (hoặc tái dùng) client Search Console đã xác thực. */
  private client(): searchconsole_v1.Searchconsole {
    const { auth, sig, mode, who } = this.buildAuth();
    if (this.sc && this.cachedSig === sig) return this.sc;
    // googleapis nhận cả OAuth2 lẫn GoogleAuth làm 'auth'.
    this.sc = google.searchconsole({ version: 'v1', auth: auth as never });
    this.cachedSig = sig;
    this.authMode = mode;
    this.authWho = who;
    return this.sc;
  }

  /** Bọc lời gọi Google: dịch lỗi thô của Google sang thông báo tiếng Việt dễ hiểu. */
  private async call<T>(label: string, fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err: any) {
      const status = Number(err?.code ?? err?.response?.status) || 503;
      const gMsg =
        err?.response?.data?.error?.message || err?.errors?.[0]?.message || err?.message || String(err);
      let hint = '';
      if (status === 403) {
        hint =
          this.authMode === 'oauth'
            ? ` — Tài khoản OAuth chưa có quyền trên property "${this.siteUrl()}". Đăng nhập đúng tài khoản chủ sở hữu khi lấy refresh token.`
            : ` — Service account "${this.authWho}" chưa được cấp quyền cho property "${this.siteUrl()}".` +
              ' Vào Search Console → Cài đặt → Người dùng và quyền → thêm email này (xem GSC-SETUP.md).';
      } else if (status === 401 || status === 400) {
        hint =
          this.authMode === 'oauth'
            ? ' — Refresh token sai/hết hạn. Chạy lại tmp/gsc-oauth.mjs để lấy token mới (token chế độ "Testing" hết hạn sau 7 ngày → hãy Publish app).'
            : ' — Key xác thực sai/hết hạn. Kiểm tra lại khoá service account.';
      } else if (status === 404) {
        hint = ` — Không tìm thấy property "${this.siteUrl()}". Kiểm tra GSC_SITE_URL khớp đúng property trong Search Console.`;
      }
      // Giữ lời nhắc (hint) trong message, nhưng KHÔNG relay 401/403 ra client (frontend coi
      // 401 = phiên hết hạn → đá ra /login). safeUpstreamStatus quy 401/403 về 502.
      throw new HttpException(`GSC ${label} lỗi: ${gMsg}${hint}`, safeUpstreamStatus(status));
    }
  }

  // ===========================================================================
  // 0) TRẠNG THÁI KẾT NỐI (gọi đầu tiên để kiểm tra đã nối được chưa)
  // ===========================================================================

  /** Liệt kê property tài khoản nhìn thấy + xác nhận property cấu hình có quyền không. */
  async status() {
    // Báo lỗi cấu hình SỚM, gọn (không ném 500) để frontend hiện đúng nguyên nhân.
    let mode: 'oauth' | 'service_account';
    let who: string;
    try {
      const a = this.buildAuth();
      mode = a.mode;
      who = a.who;
    } catch (e: any) {
      return { connected: false, reason: e?.message || 'Chưa cấu hình', siteUrl: this.siteUrl() };
    }

    const sc = this.client();
    const res = await this.call('sites.list', () => sc.sites.list());
    const sites = (res.data.siteEntry || []).map((s) => ({
      siteUrl: s.siteUrl || '',
      permissionLevel: s.permissionLevel || '',
    }));
    const target = this.siteUrl();
    const matched = sites.find((s) => s.siteUrl === target);
    return {
      connected: true,
      mode, // 'oauth' | 'service_account'
      account: who,
      siteUrl: target,
      hasAccess: !!matched,
      permissionLevel: matched?.permissionLevel || null,
      sites, // toàn bộ property tài khoản này thấy — để bạn copy đúng GSC_SITE_URL nếu đặt sai
    };
  }

  // ===========================================================================
  // 1) HIỆU SUẤT TÌM KIẾM (Search Analytics)
  // ===========================================================================

  /** Khoảng ngày [startDate, endDate] dạng YYYY-MM-DD cho N ngày gần nhất. */
  private rangeForDays(days: number): { startDate: string; endDate: string } {
    const n = Math.min(Math.max(1, Math.floor(days || DEFAULT_DAYS)), MAX_DAYS);
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - n);
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    return { startDate: iso(start), endDate: iso(end) };
  }

  /** Gọi searchanalytics.query thô (các hàm dưới đều xây trên hàm này). */
  private async queryAnalytics(
    body: searchconsole_v1.Schema$SearchAnalyticsQueryRequest,
  ): Promise<searchconsole_v1.Schema$ApiDataRow[]> {
    const sc = this.client();
    const res = await this.call('searchanalytics.query', () =>
      sc.searchanalytics.query({ siteUrl: this.siteUrl(), requestBody: body }),
    );
    return res.data.rows || [];
  }

  private static toPerfRow(r: searchconsole_v1.Schema$ApiDataRow): PerfRow {
    return {
      key: (r.keys && r.keys[0]) || '',
      clicks: r.clicks || 0,
      impressions: r.impressions || 0,
      ctr: r.ctr || 0,
      position: r.position || 0,
    };
  }

  /** Tổng quan: tổng số + diễn biến theo ngày (phục vụ view "website là thực thể sống"). */
  async summary(days = DEFAULT_DAYS) {
    const range = this.rangeForDays(days);
    const [totalsRows, byDateRows] = await Promise.all([
      this.queryAnalytics({ ...range, dimensions: [], dataState: 'all' }),
      this.queryAnalytics({ ...range, dimensions: ['date'], dataState: 'all', rowLimit: MAX_DAYS }),
    ]);
    const t = totalsRows[0];
    return {
      range,
      totals: {
        clicks: t?.clicks || 0,
        impressions: t?.impressions || 0,
        ctr: t?.ctr || 0,
        position: t?.position || 0,
      },
      byDate: byDateRows.map((r) => ({
        date: (r.keys && r.keys[0]) || '',
        clicks: r.clicks || 0,
        impressions: r.impressions || 0,
        position: r.position || 0,
      })),
    };
  }

  /** Top từ khoá đưa người dùng tới site. */
  async topQueries(days = DEFAULT_DAYS, limit = 100): Promise<PerfRow[]> {
    const rows = await this.queryAnalytics({
      ...this.rangeForDays(days),
      dimensions: ['query'],
      rowLimit: Math.min(Math.max(1, limit), 1000),
      dataState: 'all',
    });
    return rows.map(GscService.toPerfRow);
  }

  /** Top trang nhận traffic từ tìm kiếm. */
  async topPages(days = DEFAULT_DAYS, limit = 100): Promise<PerfRow[]> {
    const rows = await this.queryAnalytics({
      ...this.rangeForDays(days),
      dimensions: ['page'],
      rowLimit: Math.min(Math.max(1, limit), 1000),
      dataState: 'all',
    });
    return rows.map(GscService.toPerfRow);
  }

  // ===========================================================================
  // 2) TỪ KHOÁ BỊ "ĂN THỊT" (Keyword Cannibalization)
  // ===========================================================================

  /**
   * Tìm những từ khoá mà NHIỀU trang của bạn cùng tranh nhau xếp hạng.
   * Cannibalization làm loãng tín hiệu → Google không biết nên đẩy trang nào lên.
   * Cách làm: query theo (từ khoá × trang) rồi gom theo từ khoá, giữ từ khoá có ≥2 trang.
   */
  async cannibalization(days = DEFAULT_DAYS, minPages = 2, limit = 50) {
    const rows = await this.queryAnalytics({
      ...this.rangeForDays(days),
      dimensions: ['query', 'page'],
      rowLimit: CANNIBAL_ROW_LIMIT,
      dataState: 'all',
    });

    const byQuery = new Map<
      string,
      { query: string; clicks: number; impressions: number; pages: PerfRow[] }
    >();
    for (const r of rows) {
      const query = (r.keys && r.keys[0]) || '';
      const page = (r.keys && r.keys[1]) || '';
      if (!query || !page) continue;
      const g = byQuery.get(query) || { query, clicks: 0, impressions: 0, pages: [] };
      g.clicks += r.clicks || 0;
      g.impressions += r.impressions || 0;
      g.pages.push({
        key: page,
        clicks: r.clicks || 0,
        impressions: r.impressions || 0,
        ctr: r.ctr || 0,
        position: r.position || 0,
      });
      byQuery.set(query, g);
    }

    const min = Math.max(2, Math.floor(minPages) || 2);
    return [...byQuery.values()]
      .filter((g) => g.pages.length >= min)
      .map((g) => ({
        ...g,
        soTrang: g.pages.length,
        // trang nào đang tranh — sắp theo hiển thị giảm dần để thấy "kẻ tranh chính"
        pages: g.pages.sort((a, b) => b.impressions - a.impressions),
      }))
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, Math.min(Math.max(1, limit), 200));
  }

  // ===========================================================================
  // 2b) "SẮP LÊN TOP" (Striking Distance) — CƠ HỘI VÀNG (SEO-PLAN §6)
  // ===========================================================================

  /**
   * Từ khoá đang ở hạng [posMin..posMax] (mặc định 5–20) với đủ hiển thị = GẦN TOP:
   * chỉ cần bồi đắp/viết thêm nội dung là lên được trang 1 → ƯU TIÊN cải thiện trước.
   * Đây là tín hiệu "tự sửa" cốt lõi: nó nói cho ta biết NÊN viết/bồi gì để có kết quả NHANH NHẤT.
   * Kèm trang đang xếp hạng + "điểm cơ hội" (hiển thị càng nhiều + càng gần top → điểm càng cao).
   */
  async strikingDistance(
    days = DEFAULT_DAYS,
    posMin = 5,
    posMax = 20,
    minImpr = 10,
    limit = 50,
  ) {
    const rows = await this.queryAnalytics({
      ...this.rangeForDays(days),
      dimensions: ['query', 'page'],
      rowLimit: CANNIBAL_ROW_LIMIT,
      dataState: 'all',
    });
    const lo = Math.max(1, Math.floor(posMin) || 5);
    const hi = Math.max(lo + 1, Math.floor(posMax) || 20);
    const minI = Math.max(1, Math.floor(minImpr) || 1);
    return rows
      .filter(
        (r) => (r.position || 0) >= lo && (r.position || 0) <= hi && (r.impressions || 0) >= minI,
      )
      .map((r) => {
        const impressions = r.impressions || 0;
        const position = r.position || 0;
        return {
          query: (r.keys && r.keys[0]) || '',
          page: (r.keys && r.keys[1]) || '',
          clicks: r.clicks || 0,
          impressions,
          ctr: r.ctr || 0,
          position,
          // Điểm cơ hội = hiển thị × độ-gần-top. Nhiều người tìm + sắp lên top → đáng làm TRƯỚC.
          coHoi: Math.round(impressions * (hi + 1 - position)),
        };
      })
      .sort((a, b) => b.coHoi - a.coHoi)
      .slice(0, Math.min(Math.max(1, limit), 200));
  }

  // ===========================================================================
  // 3) SITEMAP
  // ===========================================================================

  /** Danh sách sitemap đã gửi + tình trạng Google đọc. */
  async listSitemaps() {
    const sc = this.client();
    const res = await this.call('sitemaps.list', () =>
      sc.sitemaps.list({ siteUrl: this.siteUrl() }),
    );
    return (res.data.sitemap || []).map((s) => ({
      path: s.path || '',
      lastSubmitted: s.lastSubmitted || null,
      lastDownloaded: s.lastDownloaded || null,
      isPending: !!s.isPending,
      isSitemapsIndex: !!s.isSitemapsIndex,
      warnings: Number(s.warnings || 0),
      errors: Number(s.errors || 0),
      // số URL gửi theo từng loại nội dung (web/image/...)
      contents: (s.contents || []).map((c) => ({
        type: c.type || '',
        submitted: Number(c.submitted || 0),
        indexed: Number(c.indexed || 0),
      })),
    }));
  }

  /** Gửi (hoặc gửi lại) 1 sitemap. feedpath PHẢI là URL đầy đủ, vd https://kinhlac.online/sitemap.xml */
  async submitSitemap(feedpath: string) {
    const f = (feedpath || '').trim();
    if (!/^https?:\/\//i.test(f)) {
      throw new BadRequestException('feedpath phải là URL đầy đủ (vd https://kinhlac.online/sitemap.xml).');
    }
    const sc = this.client();
    await this.call('sitemaps.submit', () =>
      sc.sitemaps.submit({ siteUrl: this.siteUrl(), feedpath: f }),
    );
    return { submitted: true, feedpath: f };
  }

  // ===========================================================================
  // 4) KIỂM TRA 1 URL ĐÃ ĐƯỢC INDEX CHƯA (URL Inspection)
  // ===========================================================================

  /** Hỏi Google: URL này đã index chưa, lần crawl gần nhất, có vấn đề gì. */
  async inspectUrl(inspectionUrl: string) {
    const u = (inspectionUrl || '').trim();
    if (!/^https?:\/\//i.test(u)) {
      throw new BadRequestException('URL kiểm tra phải đầy đủ (bắt đầu bằng http/https).');
    }
    const sc = this.client();
    const res = await this.call('urlInspection.index.inspect', () =>
      sc.urlInspection.index.inspect({
        requestBody: { inspectionUrl: u, siteUrl: this.siteUrl() },
      }),
    );
    const r = res.data.inspectionResult || {};
    const idx = r.indexStatusResult || {};
    return {
      url: u,
      // verdict: PASS = ổn / được index, NEUTRAL, FAIL...
      verdict: idx.verdict || null,
      coverageState: idx.coverageState || null, // vd "Submitted and indexed"
      robotsTxtState: idx.robotsTxtState || null,
      indexingState: idx.indexingState || null,
      lastCrawlTime: idx.lastCrawlTime || null,
      googleCanonical: idx.googleCanonical || null,
      userCanonical: idx.userCanonical || null,
      pageFetchState: idx.pageFetchState || null,
      mobileUsable: r.mobileUsabilityResult?.verdict || null,
      richResults: r.richResultsResult?.verdict || null,
      inspectionLink: r.inspectionResultLink || null,
    };
  }
}
