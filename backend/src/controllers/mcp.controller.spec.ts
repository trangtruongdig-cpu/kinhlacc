// `@nestjs/schedule` v12 là ESM thuần, jest của repo chạy CJS — chuỗi import của McpService
// đi qua tham-dinh.controller nên phải chặn ở đây, không thì gãy ngay khâu parse.
jest.mock('@nestjs/schedule', () => ({
  Cron: () => () => undefined,
  CronExpression: {},
  SchedulerRegistry: class {},
}));

import { ConfigService } from '@nestjs/config';

import { McpService } from './mcp.controller';

/** Token là hàng rào DUY NHẤT của cửa MCP, nên nó phải chặt và phải ĐÓNG khi thiếu cấu hình. */
describe('McpService.kiemToken', () => {
  const dung = (token: string | undefined) =>
    new McpService(
      { get: () => token } as unknown as ConfigService,
      null as never,
      null as never,
      null as never,
    );

  const HOP_LE = 'a'.repeat(64);

  it('nhận token khớp', () => {
    expect(dung(HOP_LE).kiemToken(HOP_LE)).toBe(true);
  });

  it('từ chối token lệch một ký tự', () => {
    expect(dung(HOP_LE).kiemToken('b' + 'a'.repeat(63))).toBe(false);
  });

  it('từ chối token sai độ dài', () => {
    expect(dung(HOP_LE).kiemToken('a'.repeat(63))).toBe(false);
    expect(dung(HOP_LE).kiemToken('a'.repeat(65))).toBe(false);
  });

  it('ĐÓNG cửa khi máy chủ chưa khai MCP_TOKEN', () => {
    // Đây là điều quan trọng nhất trong cả tệp: thiếu cấu hình thì cửa đóng, không mở toang.
    const m = dung(undefined);
    expect(m.daCauHinh()).toBe(false);
    expect(m.kiemToken('')).toBe(false);
    expect(m.kiemToken(HOP_LE)).toBe(false);
  });

  it('ĐÓNG cửa khi token quá ngắn để đáng tin', () => {
    // 'secret' đặt tay trong .env không được coi là hàng rào.
    expect(dung('secret').kiemToken('secret')).toBe(false);
    expect(dung('a'.repeat(31)).kiemToken('a'.repeat(31))).toBe(false);
    expect(dung('a'.repeat(32)).kiemToken('a'.repeat(32))).toBe(true);
  });

  it('từ chối token rỗng kể cả khi đã cấu hình', () => {
    expect(dung(HOP_LE).kiemToken('')).toBe(false);
    expect(dung(HOP_LE).kiemToken(undefined as never)).toBe(false);
  });
});
