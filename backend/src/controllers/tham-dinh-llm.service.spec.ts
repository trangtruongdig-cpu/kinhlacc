import { ThamDinhLlmService, noiDungTuThan } from './tham-dinh-llm.service';

function svc(env: Record<string, string | undefined> = {}) {
  return new ThamDinhLlmService({ get: (k: string) => env[k] } as never);
}

describe('ThamDinhLlmService.daCauHinh', () => {
  it('thiếu YESCALE_API_KEY thì NẰM IM, không ném lỗi', () => {
    expect(svc({}).daCauHinh()).toBe(false);
  });

  it('có khoá thì sẵn sàng', () => {
    expect(svc({ YESCALE_API_KEY: 'k' }).daCauHinh()).toBe(true);
  });
});

describe('ThamDinhLlmService.modelCuaTang', () => {
  /**
   * Hai tầng vì một lý do đo được: flash-lite quét cả kho tốn 1–2 đô, rẻ đến mức không
   * phải cân nhắc, nhưng phê văn y học Đông y thì không tin được bằng người. Tầng sàng
   * chạy rộng, tầng đọc kỹ chạy vài chục mục đầu hàng đợi.
   */
  it('tầng sàng dùng YESCALE_MODEL', () => {
    expect(svc({ YESCALE_MODEL: 'gemini-2.5-flash-lite' }).modelCuaTang(false))
      .toBe('gemini-2.5-flash-lite');
  });

  it('tầng đọc kỹ dùng THAM_DINH_MODEL_KY', () => {
    expect(svc({ YESCALE_MODEL: 'a', THAM_DINH_MODEL_KY: 'claude-sonnet-5' }).modelCuaTang(true))
      .toBe('claude-sonnet-5');
  });

  it('không khai model đọc kỹ thì dùng chung model sàng — KHÔNG được tự chọn model lạ', () => {
    expect(svc({ YESCALE_MODEL: 'a' }).modelCuaTang(true)).toBe('a');
  });

  it('không khai gì cả thì rơi về gemini-2.5-flash-lite', () => {
    expect(svc({}).modelCuaTang(false)).toBe('gemini-2.5-flash-lite');
  });
});

describe('ThamDinhLlmService — trần chi tiêu', () => {
  /**
   * Trần tính bằng SỐ LƯỢT GỌI chứ không phải token: lượt gọi là thứ đếm được chắc chắn
   * ngay tại chỗ, còn token thì phải tin con số nhà cung cấp trả về. Chạm trần thì DỪNG,
   * ghi chỗ dừng, mai chạy tiếp — không phải bỏ dở cả ca.
   */
  it('mặc định 300 lượt mỗi ca', () => {
    const s = svc({ YESCALE_API_KEY: 'k' });
    s.moCa();
    expect(s.conHanMuc()).toBe(true);
  });

  it('đếm lượt và chặn khi chạm trần', async () => {
    const s = svc({ YESCALE_API_KEY: 'k', THAM_DINH_TRAN_TIEN: '2' });
    s.moCa();
    (s as unknown as { goiThat: () => Promise<string> }).goiThat = () => Promise.resolve('ok');

    expect(await s.goi('l', 'n', false)).toBe('ok');
    expect(await s.goi('l', 'n', false)).toBe('ok');
    expect(s.conHanMuc()).toBe(false);
    expect(await s.goi('l', 'n', false)).toBeNull();
    expect(s.soLuotDaGoi()).toBe(2);
  });

  it('moCa() đặt lại bộ đếm — ca mai không gánh nợ của ca hôm nay', () => {
    const s = svc({ YESCALE_API_KEY: 'k', THAM_DINH_TRAN_TIEN: '1' });
    s.moCa();
    (s as unknown as { goiThat: () => Promise<string> }).goiThat = () => Promise.resolve('ok');
    return s.goi('l', 'n', false).then(() => {
      expect(s.conHanMuc()).toBe(false);
      s.moCa();
      expect(s.conHanMuc()).toBe(true);
      expect(s.soLuotDaGoi()).toBe(0);
    });
  });

  it('lỗi mạng KHÔNG ném ra ngoài — một mục hỏng không được làm sập ca', async () => {
    const s = svc({ YESCALE_API_KEY: 'k' });
    s.moCa();
    (s as unknown as { goiThat: () => Promise<string> }).goiThat = () =>
      Promise.reject(new Error('502 upstream'));
    expect(await s.goi('l', 'n', false)).toBeNull();
    // Lượt hỏng VẪN tính vào trần: nếu không, một sự cố bên nhà cung cấp thành vòng lặp
    // gọi không giới hạn.
    expect(s.soLuotDaGoi()).toBe(1);
  });

  it('chưa cấu hình thì trả null ngay, không đụng mạng', async () => {
    const s = svc({});
    s.moCa();
    expect(await s.goi('l', 'n', false)).toBeNull();
    expect(s.soLuotDaGoi()).toBe(0);
  });
});

describe('noiDungTuThan', () => {
  /**
   * Vì sao phải tự đọc thân thay vì để SDK `openai` làm: Yescale trả
   * `Content-Type: text/plain` cho các model Claude (đo 26/09/2026 — Gemini và GPT thì
   * trả application/json). SDK chỉ parse khi content-type là JSON, nên với Claude nó
   * đưa về một đối tượng KHÔNG có `choices`, và `message.content` thành undefined.
   *
   * Không lỗi, không ném, không log — chỉ rỗng. Lượt gọi vẫn bị tính tiền. Mất một giờ
   * mới lần ra, vì mọi thứ khác đều đúng: HTTP 200, thân JSON hợp lệ, model trả lời tử tế.
   */
  it('đọc được thân JSON bình thường', () => {
    const than = JSON.stringify({ choices: [{ message: { content: '  xin chào  ' } }] });
    expect(noiDungTuThan(than)).toBe('xin chào');
  });

  it('thân rỗng → chuỗi rỗng', () => {
    expect(noiDungTuThan('')).toBe('');
  });

  it('thân không phải JSON → chuỗi rỗng, KHÔNG ném', () => {
    expect(noiDungTuThan('502 Bad Gateway')).toBe('');
  });

  it('không có choices → chuỗi rỗng', () => {
    expect(noiDungTuThan('{"error":{"message":"hết hạn mức"}}')).toBe('');
  });

  it('choices rỗng → chuỗi rỗng', () => {
    expect(noiDungTuThan('{"choices":[]}')).toBe('');
  });
});
