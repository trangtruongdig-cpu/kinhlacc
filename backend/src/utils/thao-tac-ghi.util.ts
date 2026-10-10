/**
 * Ném ra khi khoá chống lặp đã được dùng → đây là lần BẤM LẠI, không phải việc mới.
 *
 * Cố ý là một lớp lỗi chứ không phải cờ trả về: `INSERT` trùng khoá làm Postgres HUỶ cả
 * transaction, nên không thể đi tiếp — phải thoát ra tới chỗ `rollbackTransaction()` rồi mới
 * đọc được kết quả cũ bằng một kết nối sạch.
 */
export class PhatLaiThaoTac extends Error {
  constructor(public readonly khoa: string) {
    super('PHAT_LAI');
    this.name = 'PhatLaiThaoTac';
  }
}

/**
 * Mã lỗi "trùng khoá" của Postgres.
 *
 * ⚠️ Phải bọc RIÊNG quanh lệnh chèn khoá, đừng bắt ở `catch` chung: trong cùng transaction còn
 * có `ux_appt_booking_active` cũng ném đúng mã `23505`, mà ý nghĩa thì ngược hẳn nhau — một cái
 * là "bấm lại", cái kia là "ca đã có người khác đặt".
 */
export function laTrungKhoa(e: unknown): boolean {
  return (e as { code?: string } | null)?.code === '23505';
}
