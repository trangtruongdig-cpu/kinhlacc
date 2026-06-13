import { ValueTransformer } from 'typeorm';

/**
 * Đảm bảo các cột PG `date` luôn được trả về dưới dạng chuỗi 'YYYY-MM-DD'
 * (theo wall-clock local của server), không bị JSON serialize sang ISO UTC
 * (có thể lệch 1 ngày khi server chạy ở giờ Việt Nam).
 */
export const ymdDateTransformer: ValueTransformer = {
  to: (value: string | null | undefined) => value,
  from: (value: Date | string | null) => {
    if (value == null) return value;
    if (typeof value === 'string') return value;
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },
};
