import { z } from 'zod';
import {
  ALLOWED_LOCATIONS,
  REPORT_PRIORITIES,
  REPORT_STATUSES
} from '../constants/damageReport.constants.js';

const titleSchema = z.string().trim().min(1, 'عنوان الزامی است').max(100);
const descriptionSchema = z.string().trim().min(1, 'شرح الزامی است').max(1000);
const locationSchema = z.enum(ALLOWED_LOCATIONS, {
  errorMap: () => ({ message: 'محل وقوع نامعتبر است' })
});
const prioritySchema = z.enum(REPORT_PRIORITIES, {
  errorMap: () => ({ message: 'اولویت نامعتبر است' })
});
const statusSchema = z.enum(REPORT_STATUSES, {
  errorMap: () => ({ message: 'وضعیت نامعتبر است' })
});
const uuidSchema = z.string().uuid('شناسه نامعتبر است');

export const createReportSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  location: locationSchema,
  priority: prioritySchema.default('normal')
});

export const updateStatusSchema = z.object({
  status: statusSchema
});

export const idParamSchema = z.object({
  id: uuidSchema
});

export const listReportsQuerySchema = z.object({
  status: statusSchema.optional(),
  priority: prioritySchema.optional(),
  location: locationSchema.optional(),
  trackingCode: z.string().trim().max(64).optional(),
  search: z.string().trim().max(100).optional()
});
