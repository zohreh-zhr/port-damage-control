# Port Damage Control — Backend (`server/`)

Backend API برای داشبورد ثبت و پیگیری خرابی‌های بندری. این سرویس با فرانت‌اند Vue/Quasar موجود هماهنگ است و داده‌ها را در PostgreSQL نگه می‌دارد.

## تکنولوژی‌ها
- Node.js (ES Modules) + Express
- PostgreSQL + Prisma
- Zod (اعتبارسنجی)، Multer (آپلود تصویر)، Helmet + CORS (امنیت پایه)
- `dotenv` برای تنظیمات محیطی (بدون هاردکد secret)

## پیش‌نیازها
- Node.js `>= 20` و npm
- PostgreSQL در دسترس + یک دیتابیس ایجادشده

## نصب
```powershell
cd server
npm install express cors dotenv zod multer @prisma/client helmet
npm install -D prisma
```

## تنظیم `.env`
1. از `.env.example` یک `.env` بسازید:
   ```powershell
   copy .env.example .env
   ```
2. مقادیر واقعی را **فقط در `.env`** قرار دهید (commit نکنید). مهم‌ترین مقدار:
   - `DATABASE_URL` اتصال PostgreSQL شما

نمونه کلیدها: `NODE_ENV`, `PORT`, `DATABASE_URL`, `CORS_ORIGIN`, `UPLOAD_DIR`, `MAX_FILE_SIZE_BYTES`.

## دیتابیس (Prisma)
پس از آماده بودن PostgreSQL و تنظیم `DATABASE_URL`:
```powershell
cd server
npm run prisma:generate
npm run prisma:migrate
```
> اگر PostgreSQL آماده نبود، Migration واقعی را اجرا نکنید.

## اجرای سرور
```powershell
cd server
npm run dev   # توسعه (watch)
npm start     # اجرا
```
سلامت سرویس: `GET /health` → `{ "status": "ok" }`

## APIها (پیشوند `/api/reports`)
| متد | مسیر | توضیح |
|---|---|---|
| GET | `/api/reports` | فهرست گزارش‌ها (فیلتر اختیاری: `status`, `priority`, `location`, `trackingCode`, `search`) — آرایه JSON |
| POST | `/api/reports` | ثبت گزارش + تولید کد پیگیری یکتا؛ `multipart/form-data`، فیلد تصویر اختیاری: `image` (<=2MB، فقط تصویر) |
| GET | `/api/reports/:id` | دریافت یک گزارش |
| PATCH | `/api/reports/:id/status` | تغییر وضعیت؛ بدنه: `{ "status": "در حال تعمیر" | "رفع شده" | "در انتظار بررسی فنی" }` |
| DELETE | `/api/reports/:id` | حذف گزارش و فایل تصویر مرتبط (در صورت وجود) |

**هماهنگی با فرانت:** مقادیر `status` و `priority` و `location` دقیقاً مطابق مقادیر واقعی فرانت‌اند است. `priority=medium` برای سازگاری پذیرفته و به `warning` نرمال می‌شود (رفتار فعلی store).

**تصویر:** در سرور ذخیره می‌شود (`UPLOAD_DIR`) و از `/uploads/...` سرو می‌شود؛ پاسخ شامل `imageName/imageMimeType/imageDataUrl` است (مسیر داخلی فایل روی دیسک یعنی `imagePath` در پایگاه داده نگهداری می‌شود اما در پاسخ API ارائه نمی‌شود).

## کدهای خطا
- `400` داده نامعتبر/شناسه نامعتبر
- `404` گزارش/مسیر یافت نشد
- `413` حجم فایل بیش از 2MB
- `415` فرمت تصویر نامجاز
- `409` تداخل یکتا (نادر)
- `500` خطای داخلی/DB

## ساختار فایل‌ها (خلاصه)
```text
server/
  prisma/schema.prisma
  src/
    app.js, server.js
    config/ (env, cors, upload, database)
    constants/ validators/
    middleware/ (validate, uploadImage, errorHandler)
    routes/ controllers/ services/ models/
    utils/ (ApiError, asyncHandler, response)
  uploads/ (runtime)
  tests/ (اسکلت)
  .env.example, .gitignore, package.json
```

## نکات
- فایل‌های فرانت‌اند تغییر نکرده‌اند. اتصال فرانت به این API نیازمند تغییر جداگانه (با تأیید) در store/Vite proxy یا `baseURL` است.
- `server/.env` و فایل‌های `uploads/` نباید commit شوند.
