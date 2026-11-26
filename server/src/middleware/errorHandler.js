import { ApiError } from '../utils/ApiError.js';
import { deleteFileIfExists } from '../services/fileStorage.service.js';

export function notFoundHandler(req, _res, next) {
  next(new ApiError(404, `مسیر یافت نشد: ${req.method} ${req.originalUrl}`));
}

export async function errorHandler(err, req, res, _next) {
  // Clean up uploaded temp file when request fails after multer stored it
  if (req?.file?.path) {
    await deleteFileIfExists(req.file.path).catch(() => {});
  }

  let status = err.statusCode;
  let message = err.message;
  let details = err.details;
  const isApiError = err instanceof ApiError || err.isOperational;

  if (!status && err instanceof SyntaxError && 'body' in err) {
    status = 400;
    message = 'بدنه درخواست نامعتبر است';
  }
  if (!status && err?.code === 'P2025') {
    status = 404;
    message = message || 'رکورد یافت نشد';
  }
  if (!status && err?.code === 'P2002') {
    status = 409;
    message = 'داده تکراری است';
  }
  if (!status && err?.code === 'P2003') {
    status = 400;
    message = 'ارجاع داده نامعتبر است';
  }

  status = status || 500;
  if (!isApiError && status >= 500) {
    message = 'خطای داخلی سرور';
  }

  const payload = { message: message || 'خطای داخلی سرور' };
  if (details) payload.errors = details;
  if (process.env.NODE_ENV !== 'production' && !isApiError && status >= 500) {
    payload.stack = err.stack;
  }
  res.status(status).json(payload);
}
