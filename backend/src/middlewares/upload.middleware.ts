import { BadRequestException } from '@nestjs/common';
import { FileFilterCallback } from 'multer';

/** MIME types được phép upload (chỉ ảnh) */
const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/** Validate file type - chỉ cho phép ảnh */
export const imageFileFilter = (
  req: any,
  file: Express.Multer.File,
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
export const fileSizeValidator = (file: Express.Multer.File) => {
  if (file.size > MAX_FILE_SIZE) {
    throw new BadRequestException(
      `Ảnh không được vượt quá ${MAX_FILE_SIZE / 1024 / 1024}MB. File của bạn: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
    );
  }
};
