import { ApiError } from '../utils/ApiError.js';
import { deleteFileIfExists } from '../services/fileStorage.service.js';

export function validate(schema, source = 'body') {
  return async (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      if (source === 'body' && req.file?.path) {
        await deleteFileIfExists(req.file.path).catch(() => {});
      }
      const details = result.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message
      }));
      return next(new ApiError(400, 'داده‌های ورودی نامعتبر است', details));
    }
    if (source === 'query') {
      Object.defineProperty(req, 'query', {
        value: result.data,
        writable: true,
        enumerable: true,
        configurable: true
      });
    } else {
      req[source] = result.data;
    }
    next();
  };
}
