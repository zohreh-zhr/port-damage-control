# قرارداد API بک‌اند — سامانه ثبت گزارش خرابی

این سند قرارداد واقعی پیاده‌سازی‌شده در `server/` را توضیح می‌دهد (بدون تغییر فرانت‌اند). همه مسیرها زیر `/api` هستند مگر `/health`.

## Base / Health
- `GET /health` → `200` `{ "status": "ok" }`
- خطای مسیر ناموجود → `404` `{ "message": "مسیر یافت نشد: ..." }`

## مدل گزارش (Response Report)
فیلدهای اصلی (camelCase):
```json
{
  "id": "uuid",
  "trackingCode": "PORT-XXXXXX-YY",
  "title": "string",
  "description": "string",
  "location": "string",
  "priority": "normal|warning|medium|critical",
  "status": "در انتظار بررسی فنی|در حال تعمیر|رفع شده",
  "imageName": "string|null",
  "imageMimeType": "string|null",
  "imageDataUrl": "string|null",
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}
```
نکات:
- `status` دقیقاً همان رشته‌های فارسی مورد استفاده فرانت است.
- ورودی `priority=medium` پذیرفته و به `warning` نرمال می‌شود (سازگاری با منطق store).
- `imageDataUrl` در پیاده‌سازی فعلی **مسیر وب قابل دسترس** است (مثلاً `/uploads/<filename>`) نه base64؛ برای نمایش در فرانت می‌توان آن را به `http://<server>:3000` یا از طریق proxy وصل کرد.
- فیلد مسیر داخلی فایل روی دیسک (`imagePath`) در پایگاه داده/Prisma نگهداری می‌شود اما **در پاسخ API ارائه نمی‌شود**؛`imageName`, `imageMimeType`, `imageDataUrl` برای نمایش/اطلاع کلاینت کافی است.

## Endpointها

### 1) فهرست گزارش‌ها
- `GET /api/reports`
- Query اختیاری: `status`, `priority`, `location`, `trackingCode`, `search`
- پاسخ موفق: `200` — **آرایه** `Report[]` (سازگار با `store.reports`)

### 2) ثبت گزارش
- `POST /api/reports`
- Content-Type: `multipart/form-data`
- فیلدها: `title` (1..100)، `description` (1..1000)، `location` (یکی از مقادیر مجاز)، `priority` (`normal|warning|critical`/`medium`)
- فایل اختیاری: `image` (فقط تصویر؛ حداکثر 2MB؛ MIME مجاز: JPEG/PNG/WEBP/GIF)
- وضعیت اولیه: `در انتظار بررسی فنی`
- پاسخ موفق: `201` — آبجکت `Report` (شامل `trackingCode` یکتا)

### 3) دریافت یک گزارش
- `GET /api/reports/:id` (`:id` = UUID)
- پاسخ موفق: `200` — `Report`
- ناموجود: `404`

### 4) تغییر وضعیت
- `PATCH /api/reports/:id/status`
- بدنه JSON: `{ "status": "در انتظار بررسی فنی" | "در حال تعمیر" | "رفع شده" }`
- پاسخ موفق: `200` — `Report`
- ناموجود: `404`

### 5) حذف گزارش
- `DELETE /api/reports/:id`
- پاسخ موفق: `200` — `{ "id": "..." }` (فایل تصویر مرتبط در صورت وجود حذف می‌شود)
- ناموجود: `404`

## خطاها
فرمت عمومی: `{ "message": "...", "errors"?: [...] }`
- `400` داده/شناسه نامعتبر، JSON بدنه نامعتبر، فیلد فایل غیرمنتظره
- `404` گزارش یا مسیر یافت نشد (و نگاشت برخی خطاهای Prisma مانند رکورد ناموجود)
- `409` تداخل یکتا (نادر)
- `413` حجم تصویر بیش از حد مجاز
- `415` فرمت تصویر نامجاز
- `500` خطای داخلی/DB

## نمایش تصاویر
- آپلود با Multer روی دیسک (`UPLOAD_DIR`) و نام فایل امن/یکتا ذخیره می‌شود.
- فایل‌ها از مسیر استاتیک `GET /uploads/<filename>` سرو می‌شوند (CORS/Helmet با `crossOriginResourcePolicy: cross-origin`).
- فرانت فعلی `report.imageDataUrl` را در `<q-img :src="...">` نمایش می‌دهد: اگر از همین origin/proxy استفاده شود، مقدار `/uploads/...` کار می‌کند؛ در غیر این صورت باید base URL سرور پیشوند شود (نیازمند تغییر فرانت با تأیید جداگانه).
- در خطای اعتبارسنجی بدنه پس از آپلود یا خطای ثبت در DB، فایل موقت پاک‌سازی می‌شود.

## مقادیر مجاز (هم‌راستا با فرانت)
- location: `اسکله شماره ۱`, `اسکله شماره ۲`, `محوطه کانتینری`, `انبار مرکزی`, `جرثقیل ساحلی`, `خط بارگیری`
- status: `در انتظار بررسی فنی`, `در حال تعمیر`, `رفع شده`
- priority: `normal`, `warning`, `critical` (+ ورودی سازگاری `medium`)
