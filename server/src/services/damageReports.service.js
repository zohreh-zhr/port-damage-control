import { ApiError } from '../utils/ApiError.js';
import { createTrackingCode } from './trackingCode.service.js';
import * as fileStorage from './fileStorage.service.js';
import { toApiReport, normalizePriority } from '../models/damageReport.model.js';
import * as models from '../models/index.js';

const deps = {
  models,
  fileStorage
};

export function _setTestDeps(overrides = {}) {
  if (overrides.models) deps.models = overrides.models;
  if (overrides.fileStorage) deps.fileStorage = overrides.fileStorage;
}

export function _resetTestDeps() {
  deps.models = models;
  deps.fileStorage = fileStorage;
}

async function generateUniqueTrackingCode(maxAttempts = 8) {
  for (let i = 0; i < maxAttempts; i += 1) {
    const code = createTrackingCode();
    const existing = await deps.models.findReportByTrackingCode(code);
    if (!existing) return code;
  }
  throw new ApiError(500, 'تولید کد پیگیری یکتا ممکن نشد');
}

export async function listReports(filters) {
  try {
    const rows = await deps.models.findManyReports(filters);
    return rows.map(toApiReport);
  } catch (err) {
    if (err?.code?.startsWith?.('P')) {
      throw new ApiError(500, 'خطا در دریافت گزارش‌ها از پایگاه داده');
    }
    throw err;
  }
}

export async function getReport(id) {
  try {
    const row = await deps.models.findReportById(id);
    if (!row) throw new ApiError(404, 'گزارش یافت نشد');
    return toApiReport(row);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err?.code?.startsWith?.('P')) throw new ApiError(500, 'خطا در دریافت گزارش');
    throw err;
  }
}

export async function createReport(payload, file) {
  const trackingCode = await generateUniqueTrackingCode();
  const data = {
    trackingCode,
    title: payload.title,
    description: payload.description,
    location: payload.location,
    priority: normalizePriority(payload.priority),
    status: 'PENDING_TECH_REVIEW',
    imageName: file?.originalname ?? null,
    imagePath: file?.path ?? null,
    imageMimeType: file?.mimetype ?? null
  };

  try {
    const row = await deps.models.createReport(data);
    return toApiReport(row);
  } catch (err) {
    if (file?.path) {
      await deps.fileStorage.deleteFileIfExists(file.path).catch(() => {});
    }
    if (err?.code === 'P2002') {
      throw new ApiError(409, 'تداخل در ثبت گزارش، دوباره تلاش کنید');
    }
    if (err?.code?.startsWith?.('P')) {
      throw new ApiError(500, 'خطا در ثبت گزارش در پایگاه داده');
    }
    throw err;
  }
}

export async function updateReportStatus(id, status) {
  try {
    const row = await deps.models.updateReportStatus(id, status);
    if (!row) throw new ApiError(404, 'گزارش یافت نشد');
    return toApiReport(row);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err?.code === 'P2025') throw new ApiError(404, 'گزارش یافت نشد');
    if (err?.code?.startsWith?.('P')) throw new ApiError(500, 'خطا در به‌روزرسانی وضعیت');
    throw err;
  }
}

export async function removeReport(id) {
  try {
    const row = await deps.models.deleteReportById(id);
    // Defensive: Prisma delete throws P2025 when missing; keep null check for safety.
    // eslint-disable-next-line no-unreachable
    if (!row) throw new ApiError(404, 'گزارش یافت نشد');

    let fileDeleted = true;
    let fileDeleteError = null;
    if (row.imagePath) {
      const result = await deps.fileStorage.deleteFileIfExists(row.imagePath);
      fileDeleted = result?.deleted !== false;
      if (!fileDeleted) fileDeleteError = result?.error ?? 'unknown';
    }

    if (!fileDeleted) {
      // Record is already deleted; keep API response aligned with real DB state.
      console.error('[removeReport] image file cleanup failed', {
        reportId: row.id,
        error: fileDeleteError
      });
    }

    return { id: row.id, fileDeleted };
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err?.code === 'P2025') throw new ApiError(404, 'گزارش یافت نشد');
    if (err?.code?.startsWith?.('P')) throw new ApiError(500, 'خطا در حذف گزارش');
    throw err;
  }
}
