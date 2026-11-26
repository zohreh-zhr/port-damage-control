import { DB_TO_STATUS, REPORT_PRIORITIES } from '../constants/damageReport.constants.js';

export function toApiReport(row) {
  if (!row) return null;
  const imagePath = row.imagePath ?? null;
  let imageDataUrl = null;
  if (imagePath) {
    const normalized = String(imagePath).replace(/\\/g, '/');
    const idx = normalized.toLowerCase().lastIndexOf('/uploads/');
    if (idx >= 0) {
      imageDataUrl = normalized.slice(idx);
    } else {
      const match = normalized.match(/uploads\/[^/]+$/i);
      imageDataUrl = match ? `/${match[0]}` : null;
    }
  }
  return {
    id: row.id,
    trackingCode: row.trackingCode,
    title: row.title,
    description: row.description,
    location: row.location,
    priority: row.priority,
    status: DB_TO_STATUS[row.status] ?? row.status,
    imageName: row.imageName ?? null,
    imageMimeType: row.imageMimeType ?? null,
    imageDataUrl,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : row.updatedAt
  };
}

export function normalizePriority(value) {
  if (value === 'medium') return 'warning';
  return REPORT_PRIORITIES.includes(value) ? value : value;
}
