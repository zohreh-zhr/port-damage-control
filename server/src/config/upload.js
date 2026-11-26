import { env } from './env.js';

export const uploadConfig = {
  uploadDir: env.UPLOAD_DIR,
  maxFileSizeBytes: env.MAX_FILE_SIZE_BYTES,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
};
