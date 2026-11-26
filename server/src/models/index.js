import { prisma } from '../config/database.js';
import { STATUS_TO_DB } from '../constants/damageReport.constants.js';
import { ApiError } from '../utils/ApiError.js';

export async function findManyReports(filters = {}) {
  const where = {};
  if (filters.status && STATUS_TO_DB[filters.status]) {
    where.status = STATUS_TO_DB[filters.status];
  }
  if (filters.priority) {
    where.priority = filters.priority === 'medium' ? 'warning' : filters.priority;
  }
  if (filters.location) {
    where.location = filters.location;
  }
  if (filters.trackingCode) {
    where.trackingCode = { contains: filters.trackingCode, mode: 'insensitive' };
  }
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { trackingCode: { contains: filters.search, mode: 'insensitive' } }
    ];
  }
  return prisma.damageReport.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  });
}

export async function findReportById(id) {
  return prisma.damageReport.findUnique({ where: { id } });
}

export async function findReportByTrackingCode(trackingCode) {
  return prisma.damageReport.findUnique({ where: { trackingCode } });
}

export async function createReport(data) {
  return prisma.damageReport.create({ data });
}

export async function updateReportStatus(id, statusValue) {
  const dbStatus = STATUS_TO_DB[statusValue];
  if (!dbStatus) {
    throw new ApiError(400, 'وضعیت نامعتبر است');
  }
  return prisma.damageReport.update({
    where: { id },
    data: { status: dbStatus }
  });
}

export async function deleteReportById(id) {
  return prisma.damageReport.delete({ where: { id } });
}
