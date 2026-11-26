# سامانه ثبت و پیگیری گزارش‌های خسارت بندری

یک برنامه وب تمام‌سِت (Full-Stack) برای ثبت، مدیریت و پیگیری گزارش‌های خسارت و آسیب‌های بندری.

## فناوری‌های استفاده‌شده

### فرانت‌اند (Frontend)
- Vue 3
- Quasar
- Pinia
- Vite

### بک‌اند (Backend)
- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- Zod
- Multer

## امکانات پروژه

- ثبت گزارش جدید خسارت بندری
- بارگذاری تصویر همراه با گزارش خسارت
- مشاهده و فیلتر کردن گزارش‌ها
- پیگیری گزارش‌ها از طریق کد رهگیری
- تغییر وضعیت گزارش‌ها
- حذف گزارش‌ها
- مشاهده آمار گزارش‌های خسارت
- اعتبارسنجی اطلاعات ورودی
- ایمن‌سازی API با استفاده از Helmet و CORS

## ساختار پروژه

```text
port-damage-control/
├── public/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── stores/
│   └── styles/
├── server/
│   ├── prisma/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── validators/
│   └── tests/
├── package.json
└── README.md
```

## پیش‌نیازهای اجرای پروژه

برای اجرای پروژه به موارد زیر نیاز دارید:

- Node.js نسخه ۲۰ یا بالاتر
- npm
- PostgreSQL

## نصب و راه‌اندازی پروژه

### ۱. دریافت پروژه

```bash
git clone https://github.com/zohreh-zhr/port-damage-control.git
cd port-damage-control
```

### ۲. نصب وابستگی‌های فرانت‌اند

```bash
npm install
```

### ۳. نصب وابستگی‌های بک‌اند

```bash
cd server
npm install
```

### ۴. تنظیم متغیرهای محیطی

در پوشه `server`، با استفاده از فایل `.env.example` یک فایل جدید با نام `.env` ایجاد کنید.

اطلاعات اتصال به PostgreSQL را در آن تنظیم کنید:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME?schema=public"
CORS_ORIGIN=http://localhost:5173
UPLOAD_DIR=uploads/damage-images
MAX_FILE_SIZE_BYTES=2097152
```

مقادیر نمونه اتصال به دیتابیس را با اطلاعات واقعی PostgreSQL خود جایگزین کنید.

### ۵. راه‌اندازی دیتابیس

مطمئن شوید PostgreSQL در حال اجراست و دیتابیس موردنظر را ایجاد کرده‌اید.

سپس دستورهای زیر را اجرا کنید:

```bash
npm run prisma:migrate
npm run prisma:generate
```

### ۶. اجرای بک‌اند

از داخل پوشه `server` دستور زیر را اجرا کنید:

```bash
npm run dev
```

آدرس بک‌اند:

`http://localhost:3000`

برای بررسی سلامت سرور، این آدرس را باز کنید:

`http://localhost:3000/health`

### ۷. اجرای فرانت‌اند

یک ترمینال جدید در پوشه اصلی پروژه باز کنید و دستور زیر را اجرا کنید:

```bash
npm run dev
```

آدرس محلی نمایش‌داده‌شده توسط Vite را باز کنید. این آدرس معمولاً به شکل زیر است:

`http://localhost:5173`

## مسیرهای API

| روش درخواست | مسیر | توضیحات |
|---|---|---|
| GET | `/api/reports` | دریافت فهرست گزارش‌ها |
| POST | `/api/reports` | ثبت گزارش جدید |
| GET | `/api/reports/:id` | دریافت یک گزارش بر اساس شناسه |
| PATCH | `/api/reports/:id/status` | تغییر وضعیت گزارش |
| DELETE | `/api/reports/:id` | حذف گزارش |

## اجرای تست‌ها

برای اجرای تست‌های بک‌اند:

```bash
cd server
npm test
```

تست‌های مربوط به API فرانت‌اند در مسیر زیر قرار دارند:

`src/services/__tests__/reportsApi.test.mjs`

## نکات امنیتی

- اطلاعات محرمانه و متغیرهای واقعی محیطی نباید در گیت‌هاب قرار بگیرند.
- فایل `.env.example` فقط شامل مقادیر نمونه و غیرمحرمانه است.
- فایل‌های آپلودشده در زمان اجرا و وابستگی‌های پروژه از Git مستثنا شده‌اند.

## توسعه‌دهنده

GitHub: [zohreh-zhr](https://github.com/zohreh-zhr)

## مجوز و توضیحات

این پروژه با هدف آموزشی و به‌عنوان یک پروژه درسی توسعه داده شده است.
