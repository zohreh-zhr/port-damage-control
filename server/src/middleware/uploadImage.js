import multer from 'multer';
import path from 'path';
import { ALLOWED_IMAGE_MIME_TYPES, MAX_IMAGE_SIZE_BYTES } from '../constants/damageReport.constants.js';
import { ApiError } from '../utils/ApiError.js';
import { ensureUploadDir, buildSafeFilename, deleteFileIfExists } from '../services/fileStorage.service.js';
import { validateImageFileSignature } from '../utils/imageSignature.js';

let storageReady;

async function getStorage() {
  if (!storageReady) {
    storageReady = ensureUploadDir().then(
      (dir) =>
        multer.diskStorage({
          destination: (_req, _file, cb) => cb(null, dir),
          filename: (_req, file, cb) => cb(null, buildSafeFilename(file.originalname))
        })
    );
  }
  return storageReady;
}

function fileFilter(_req, file, cb) {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
    return cb(new ApiError(415, 'فرمت تصویر مجاز نیست. فقط JPEG, PNG, WEBP, GIF پذیرفته می‌شود.'));
  }
  cb(null, true);
}

export async function uploadSingleImage(req, res, next) {
  try {
    const storage = await getStorage();
    const upload = multer({
      storage,
      fileFilter,
      limits: { fileSize: MAX_IMAGE_SIZE_BYTES, files: 1 }
    }).single('image');
    upload(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new ApiError(413, 'حجم تصویر باید حداکثر ۲ مگابایت باشد'));
          }
          if (err.code === 'LIMIT_UNEXPECTED_FILE' || err.code === 'LIMIT_FILE_COUNT') {
            return next(new ApiError(400, 'فقط یک فایل تصویری با فیلد image مجاز است'));
          }
          return next(new ApiError(400, `خطا در آپلود فایل: ${err.code}`));
        }
        return next(err);
      }

      if (req.file?.path) {
        const validation = await validateImageFileSignature(req.file.path, req.file.mimetype);
        if (!validation.ok) {
          await deleteFileIfExists(req.file.path).catch(() => {});
          req.file = undefined;
          return next(
            new ApiError(415, 'محتوای فایل تصویر معتبر نیست یا با فرمت اعلام‌شده/مجاز (PNG, JPEG, WEBP, GIF) تطابق ندارد')
          );
        }
      }

      next();
    });
  } catch (err) {
    next(err);
  }
}
