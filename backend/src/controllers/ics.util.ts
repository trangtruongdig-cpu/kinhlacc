/**
 * Sinh file iCalendar (RFC 5545) cho lịch trị liệu.
 *
 * Viết riêng vì bản cũ (nhúng thẳng trong PatientScheduleView.vue) sai 5 chỗ, mà mỗi chỗ đều
 * làm lịch hiện sai hoặc vỡ file — xem chú thích ở từng hàm bên dưới.
 */

/** Phòng khám ở Việt Nam: UTC+7 CỐ ĐỊNH, không có giờ mùa hè. Nên quy về UTC là chính xác tuyệt đối. */
const VN_OFFSET_MINUTES = 7 * 60;

/**
 * 'YYYY-MM-DD' + 'HH:mm:ss' (giờ VN) → 'YYYYMMDDTHHMMSSZ' (giờ UTC).
 *
 * Bản cũ ghi `DTSTART:20260918T080000` — KHÔNG có 'Z', cũng KHÔNG có TZID. Đó là "giờ trôi nổi":
 * máy đặt múi giờ khác sẽ hiện sai giờ hẹn. Quy hẳn về UTC thì mọi máy đều hiểu đúng.
 */
export function toIcsUtc(ymd: string, hms: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const [hh, mm, ss] = (hms || '00:00:00').split(':').map(Number);
  const utcMs =
    Date.UTC(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, ss || 0) -
    VN_OFFSET_MINUTES * 60_000;
  return formatUtcStamp(new Date(utcMs));
}

export function formatUtcStamp(d: Date): string {
  const p = (n: number, w = 2) => String(n).padStart(w, '0');
  return (
    `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}` +
    `T${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`
  );
}

/**
 * Thoát ký tự cho giá trị text trong ICS.
 *
 * Bản cũ nhét thẳng `slot.reason` vào DESCRIPTION: khách gõ một dấu phẩy là vỡ file, vì trong
 * ICS dấu phẩy và chấm phẩy là ký tự phân tách giá trị.
 */
export function escapeIcsText(v: string): string {
  return v
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Gấp dòng ở 75 OCTET (không phải 75 ký tự) theo RFC 5545.
 *
 * Tiếng Việt có dấu là 2–3 byte/ký tự, nên đếm theo ký tự sẽ vượt giới hạn và một số ứng dụng
 * lịch từ chối cả file. Cắt theo byte, và không bao giờ cắt GIỮA một ký tự nhiều byte.
 */
export function foldIcsLine(line: string): string {
  const bytes = Buffer.from(line, 'utf8');
  if (bytes.length <= 75) return line;

  const parts: string[] = [];
  let start = 0;
  // Dòng đầu 75 octet, các dòng nối sau 74 (vì có thêm 1 khoảng trắng đứng đầu).
  let limit = 75;
  while (start < bytes.length) {
    let end = Math.min(start + limit, bytes.length);
    // Lùi lại nếu đang cắt giữa một ký tự UTF-8 (byte nối tiếp có dạng 10xxxxxx).
    while (end > start && end < bytes.length && (bytes[end] & 0xc0) === 0x80) {
      end -= 1;
    }
    parts.push(bytes.subarray(start, end).toString('utf8'));
    start = end;
    limit = 74;
  }
  return parts.join('\r\n ');
}

/**
 * Một lời nhắc gắn vào sự kiện (VALARM).
 *
 * `minutesBefore` là số phút TRƯỚC giờ bắt đầu. RFC 5545 viết mốc này dạng thời lượng âm:
 * -PT60M = 60 phút trước.
 */
export interface IcsAlarm {
  minutesBefore: number;
  description: string;
}

export interface IcsEvent {
  uid: string;
  ymd: string;
  hms: string;
  durationMinutes: number;
  summary: string;
  location: string;
  description?: string;
  /** Tăng mỗi lần sự kiện đổi — thiếu nó thì ứng dụng lịch coi bản mới là trùng và bỏ qua. */
  sequence: number;
  /** Nhắc trước giờ hẹn. Nhiều VALARM trong một VEVENT là hợp lệ theo RFC 5545. */
  alarms?: IcsAlarm[];
}

export interface IcsCalendarOptions {
  /** Tên hiện trong danh sách lịch của người dùng sau khi đăng ký. */
  calendarName: string;
  /** Có thì ứng dụng lịch biết bao lâu nên hỏi lại một lần (Apple tôn trọng, Google thì không). */
  refreshIntervalMinutes?: number;
}

export function buildIcsCalendar(
  events: IcsEvent[],
  opts: IcsCalendarOptions,
): string {
  const now = formatUtcStamp(new Date());
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    // PRODID phải là ASCII — bản cũ để "Kinh Lạc Gia Minh" có dấu, sai chuẩn.
    'PRODID:-//Kinh Lac Gia Minh//Lich tri lieu//VI',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(opts.calendarName)}`,
    'X-WR-TIMEZONE:Asia/Ho_Chi_Minh',
  ];
  if (opts.refreshIntervalMinutes) {
    lines.push(`REFRESH-INTERVAL;VALUE=DURATION:PT${opts.refreshIntervalMinutes}M`);
    lines.push(`X-PUBLISHED-TTL:PT${opts.refreshIntervalMinutes}M`);
  }

  for (const e of events) {
    const start = toIcsUtc(e.ymd, e.hms);
    const [y, m, d] = e.ymd.split('-').map(Number);
    const [hh, mm, ss] = (e.hms || '00:00:00').split(':').map(Number);
    // Cộng thời lượng bằng mốc tuyệt đối. Bản cũ làm `parseInt(giờ) + 1` trên chuỗi, nên ca
    // 23:00 sinh ra giờ "24" (không tồn tại) và ca 30 phút thì luôn bị kéo thành 1 tiếng.
    const endMs =
      Date.UTC(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, ss || 0) -
      VN_OFFSET_MINUTES * 60_000 +
      e.durationMinutes * 60_000;

    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${start}`,
      `DTEND:${formatUtcStamp(new Date(endMs))}`,
      `SEQUENCE:${e.sequence}`,
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      `SUMMARY:${escapeIcsText(e.summary)}`,
      `LOCATION:${escapeIcsText(e.location)}`,
    );
    if (e.description) {
      lines.push(`DESCRIPTION:${escapeIcsText(e.description)}`);
    }

    // Nhắc trước giờ hẹn. TRIGGER neo vào START và mang dấu ÂM (-PT60M = 60 phút trước).
    // ACTION:DISPLAY là loại được ứng dụng lịch trên điện thoại hỗ trợ rộng nhất; ACTION:EMAIL
    // đòi thêm ATTENDEE và phần lớn ứng dụng bỏ qua.
    for (const alarm of e.alarms || []) {
      lines.push(
        'BEGIN:VALARM',
        `TRIGGER;RELATED=START:-PT${Math.max(0, Math.round(alarm.minutesBefore))}M`,
        'ACTION:DISPLAY',
        `DESCRIPTION:${escapeIcsText(alarm.description)}`,
        'END:VALARM',
      );
    }

    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  // ICS dùng CRLF, và mọi dòng đều phải gấp đúng chuẩn.
  return lines.map(foldIcsLine).join('\r\n') + '\r\n';
}
