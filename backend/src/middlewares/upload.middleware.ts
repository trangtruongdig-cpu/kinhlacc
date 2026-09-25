import { BadRequestException } from '@nestjs/common';
import { FileFilterCallback } from 'multer';

/**
 * Hình dạng file multer mà middleware này cần. Khai báo tại chỗ thay vì dùng
 * `Express.Multer.File` vì repo cố ý KHÔNG cài @types/multer (xem chú thích cùng nội dung
 * ở vi-thuoc.router.ts / vi-thuoc.controller.ts) — thiếu package đó thì namespace
 * `global.Express` không có `Multer` và cả file mất khả năng kiểm kiểu.
 */
interface UploadedImageFile {
  mimetype: string;
  size: number;
  originalname?: string;
  buffer?: Buffer;
}

/** MIME types được phép upload (chỉ ảnh) */
const ALLOWED_MIMETYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/** Validate file type - chỉ cho phép ảnh */
export const imageFileFilter = (
  req: any,
  file: UploadedImageFile,
  callback: FileFilterCallback,
) => {
  if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
    return callback(
      new BadRequestException(
        `Chỉ chấp nhận ảnh (JPEG, PNG, WebP, GIF). Bạn tải lên ${file.mimetype}`,
      ),
      false,
    );
  }
  callback(null, true);
};

/** Validate file size */
export const fileSizeValidator = (file: UploadedImageFile) => {
  if (file.size > MAX_FILE_SIZE) {
    throw new BadRequestException(
      `Ảnh không được vượt quá ${MAX_FILE_SIZE / 1024 / 1024}MB. File của bạn: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
    );
  }
};
