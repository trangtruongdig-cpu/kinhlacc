import { Injectable, Logger } from '@nestjs/common';
import { DiaDiemDto } from '../models/dia-diem.dto';

/**
 * Tra cứu địa điểm đo từ toạ độ GPS của máy đang khám:
 *  - Hành chính 2 cấp (Tỉnh/TP + Phường/Xã) qua Nominatim (OpenStreetMap) — miễn phí, không cần API key.
 *  - Nhiệt độ / độ ẩm môi trường tại thời điểm đo qua Open-Meteo — miễn phí, không cần API key.
 *
 * Gọi từ backend (không gọi thẳng từ trình duyệt) để: tránh CORS, giữ đúng chính sách User-Agent của
 * Nominatim, và cache lại — 1 phòng khám đo cả ngày ở cùng một chỗ chỉ tốn 1 lượt gọi địa chỉ.
 */
@Injectable()
export class DiaDiemService {
  private readonly logger = new Logger('DiaDiem');

  /** Nominatim yêu cầu định danh ứng dụng; đổi qua env khi triển khai để họ liên hệ được. */
  private readonly userAgent =
    process.env.NOMINATIM_USER_AGENT ||
    'kinhlac-clinic/1.0 (lien he: admin@kinhlac.vn)';

  /** Địa chỉ của một toạ độ gần như không đổi → cache dài. */
  private static readonly TTL_DIA_CHI_MS = 24 * 60 * 60 * 1000;
  /** Thời tiết đổi liên tục → cache ngắn, vừa đủ để nhiều ca khám liên tiếp không gọi lại. */
  private static readonly TTL_THOI_TIET_MS = 10 * 60 * 1000;

  private readonly cacheDiaChi = new Map<
    string,
    { luc: number; data: KetQuaDiaChi }
  >();
  private readonly cacheThoiTiet = new Map<
    string,
    { luc: number; data: KetQuaThoiTiet }
  >();

  /** Nominatim giới hạn 1 request/giây — nối đuôi các lượt gọi để không bị chặn IP. */
  private hangDoi: Promise<unknown> = Promise.resolve();
  private goiGanNhat = 0;

  async traCuu(viDo: number, kinhDo: number): Promise<DiaDiemDto> {
    // Làm tròn 3 chữ số (~110m) để cache dùng chung cho các lần đo tại cùng một phòng.
    const khoa = `${viDo.toFixed(3)},${kinhDo.toFixed(3)}`;

    const [diaChi, thoiTiet] = await Promise.all([
      this.layDiaChi(khoa, viDo, kinhDo),
      this.layThoiTiet(khoa, viDo, kinhDo),
    ]);

    return {
      viDo,
      kinhDo,
      tinhThanh: diaChi.tinhThanh,
      phuongXa: diaChi.phuongXa,
      diaChi: diaChi.diaChi,
      diaChiDayDu: diaChi.diaChiDayDu,
      nhietDo: thoiTiet.nhietDo,
      doAm: thoiTiet.doAm,
      nhietDoCamNhan: thoiTiet.nhietDoCamNhan,
      thoiDiemThoiTiet: thoiTiet.thoiDiem,
      loiDiaChi: diaChi.loi,
      loiThoiTiet: thoiTiet.loi,
    };
  }

  // ---------------------------------------------------------------- địa chỉ

  private async layDiaChi(
    khoa: string,
    viDo: number,
    kinhDo: number,
  ): Promise<KetQuaDiaChi> {
    const cached = this.cacheDiaChi.get(khoa);
    if (cached && Date.now() - cached.luc < DiaDiemService.TTL_DIA_CHI_MS)
      return cached.data;

    try {
      const url =
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2` +
        `&lat=${viDo}&lon=${kinhDo}&zoom=18&addressdetails=1&accept-language=vi`;
      const json = await this.xepHang(() =>
        this.tai<NominatimReverse>(url, { 'User-Agent': this.userAgent }),
      );
      const data = this.tachDiaChiVN(json);
      this.cacheDiaChi.set(khoa, { luc: Date.now(), data });
      return data;
    } catch (e) {
      const loi = (e as Error).message;
      this.logger.warn(`Không tra được địa chỉ (${khoa}): ${loi}`);
      return {
        tinhThanh: null,
        phuongXa: null,
        diaChi: null,
        diaChiDayDu: null,
        loi,
      };
    }
  }

  /**
   * Nominatim trả về các khoá `address` KHÔNG nhất quán ở VN: cấp xã lúc nằm ở `suburb`,
   * lúc ở `county`, lúc ở `city`, có lúc không có trong `address` mà chỉ có trong `display_name`.
   * Vì vậy tách theo hai mỏ neo ổn định (đã đối chiếu trên nhiều toạ độ Bắc–Trung–Nam):
   *  - Cấp xã: thành phần đầu tiên bắt đầu bằng "Phường/Xã/Thị trấn/Đặc khu".
   *  - Cấp tỉnh: thành phần cuối của `display_name` sau khi bỏ quốc gia và mã bưu chính.
   */
  private tachDiaChiVN(json: NominatimReverse): KetQuaDiaChi {
    const display = json?.display_name ?? null;
    const addr = json?.address ?? {};

    const phanTu = (display ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    // Bỏ quốc gia (phần tử cuối) rồi bỏ mã bưu chính nếu có.
    const conLai = [...phanTu];
    if (
      conLai.length &&
      /^(Việt Nam|Vietnam)$/i.test(conLai[conLai.length - 1])
    )
      conLai.pop();
    if (conLai.length && /^\d{4,6}$/.test(conLai[conLai.length - 1]))
      conLai.pop();

    const tinhThanh = this.chuanHoaTinh(
      conLai.length
        ? conLai[conLai.length - 1]
        : (addr.state ?? addr.city ?? null),
    );

    const LA_CAP_XA = /^(Phường|Xã|Thị trấn|Đặc khu)\s+/i;
    let phuongXa = conLai.find((p) => LA_CAP_XA.test(p)) ?? null;
    if (!phuongXa) {
      // Dự phòng khi display_name không nêu cấp xã: quét các khoá address hay chứa nó.
      const ungVien = [
        addr.suburb,
        addr.quarter,
        addr.village,
        addr.town,
        addr.city_district,
        addr.county,
      ];
      phuongXa =
        ungVien.find((v) => !!v && LA_CAP_XA.test(v)) ??
        ungVien.find((v) => !!v) ??
        null;
    }

    // Địa chỉ gọn đúng định dạng ô nhập "Số nhà, đường, phường/xã...".
    const duong = [addr.house_number, addr.road]
      .filter(Boolean)
      .join(' ')
      .trim();
    const thonXom = !duong ? (addr.hamlet ?? addr.neighbourhood ?? null) : null;
    const diaChi =
      [duong || thonXom, phuongXa].filter(Boolean).join(', ') || null;

    return { tinhThanh, phuongXa, diaChi, diaChiDayDu: display, loi: null };
  }

  /**
   * Bỏ tiền tố "Tỉnh"/"Thành phố" để khớp dữ liệu `patients.province` đang có
   * (đang lưu tên trần: "Hà Nội", "Nghệ An", "Nam Định"...).
   */
  private chuanHoaTinh(gia: string | null | undefined): string | null {
    if (!gia) return null;
    const ten = gia.replace(/^(Tỉnh|Thành phố|TP\.?)\s+/i, '').trim();
    return ten || null;
  }

  // -------------------------------------------------------------- thời tiết

  private async layThoiTiet(
    khoa: string,
    viDo: number,
    kinhDo: number,
  ): Promise<KetQuaThoiTiet> {
    const cached = this.cacheThoiTiet.get(khoa);
    if (cached && Date.now() - cached.luc < DiaDiemService.TTL_THOI_TIET_MS)
      return cached.data;

    try {
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${viDo}&longitude=${kinhDo}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature&timezone=Asia%2FBangkok`;
      const json = await this.tai<OpenMeteo>(url);
      const hienTai = json?.current;
      const data: KetQuaThoiTiet = {
        nhietDo: this.so(hienTai?.temperature_2m),
        doAm: this.so(hienTai?.relative_humidity_2m),
        nhietDoCamNhan: this.so(hienTai?.apparent_temperature),
        thoiDiem: hienTai?.time ?? null,
        loi: null,
      };
      this.cacheThoiTiet.set(khoa, { luc: Date.now(), data });
      return data;
    } catch (e) {
      const loi = (e as Error).message;
      this.logger.warn(`Không lấy được thời tiết (${khoa}): ${loi}`);
      return {
        nhietDo: null,
        doAm: null,
        nhietDoCamNhan: null,
        thoiDiem: null,
        loi,
      };
    }
  }

  // ------------------------------------------------------------------- phụ

  private so(v: unknown): number | null {
    return typeof v === 'number' && Number.isFinite(v) ? v : null;
  }

  /** Nối đuôi + giãn tối thiểu 1,1s giữa 2 lượt gọi Nominatim (đúng chính sách dùng chung của họ). */
  private xepHang<T>(viec: () => Promise<T>): Promise<T> {
    const ketQua = this.hangDoi.then(async () => {
      const cho = 1100 - (Date.now() - this.goiGanNhat);
      if (cho > 0) await new Promise((r) => setTimeout(r, cho));
      this.goiGanNhat = Date.now();
      return viec();
    });
    // Giữ hàng đợi chạy tiếp kể cả khi 1 lượt lỗi.
    this.hangDoi = ketQua.catch(() => undefined);
    return ketQua;
  }

  private async tai<T>(
    url: string,
    headers: Record<string, string> = {},
  ): Promise<T> {
    const dung = AbortSignal.timeout(8000);
    const res = await fetch(url, {
      headers: { Accept: 'application/json', ...headers },
      signal: dung,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} từ ${new URL(url).host}`);
    return (await res.json()) as T;
  }
}

interface KetQuaDiaChi {
  tinhThanh: string | null;
  phuongXa: string | null;
  diaChi: string | null;
  diaChiDayDu: string | null;
  loi: string | null;
}

interface KetQuaThoiTiet {
  nhietDo: number | null;
  doAm: number | null;
  nhietDoCamNhan: number | null;
  thoiDiem: string | null;
  loi: string | null;
}

interface NominatimReverse {
  display_name?: string;
  address?: {
    house_number?: string;
    road?: string;
    hamlet?: string;
    neighbourhood?: string;
    quarter?: string;
    suburb?: string;
    village?: string;
    town?: string;
    city_district?: string;
    county?: string;
    city?: string;
    state?: string;
  };
}

interface OpenMeteo {
  current?: {
    time?: string;
    temperature_2m?: number;
    relative_humidity_2m?: number;
    apparent_temperature?: number;
  };
}
