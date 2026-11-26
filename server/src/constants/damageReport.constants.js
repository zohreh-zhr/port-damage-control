// Values aligned with frontend: src/stores/damageStore.js, src/components/DamageForm.vue, DamageCard.vue

export const REPORT_STATUSES = [
  'در انتظار بررسی فنی',
  'در حال تعمیر',
  'رفع شده'
];

export const STATUS_TO_DB = {
  'در انتظار بررسی فنی': 'PENDING_TECH_REVIEW',
  'در حال تعمیر': 'IN_REPAIR',
  'رفع شده': 'RESOLVED'
};

export const DB_TO_STATUS = {
  PENDING_TECH_REVIEW: 'در انتظار بررسی فنی',
  IN_REPAIR: 'در حال تعمیر',
  RESOLVED: 'رفع شده'
};

export const REPORT_PRIORITIES = ['normal', 'warning', 'medium', 'critical'];

export const ALLOWED_LOCATIONS = [
  'اسکله شماره ۱',
  'اسکله شماره ۲',
  'محوطه کانتینری',
  'انبار مرکزی',
  'جرثقیل ساحلی',
  'خط بارگیری'
];

export const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
];
