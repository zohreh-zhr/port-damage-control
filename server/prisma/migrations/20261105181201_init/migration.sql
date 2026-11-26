-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('normal', 'warning', 'medium', 'critical');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('در انتظار بررسی فنی', 'در حال تعمیر', 'رفع شده');

-- CreateTable
CREATE TABLE "damage_reports" (
    "id" UUID NOT NULL,
    "tracking_code" VARCHAR(32) NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "location" VARCHAR(120) NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'normal',
    "status" "ReportStatus" NOT NULL DEFAULT 'در انتظار بررسی فنی',
    "image_name" VARCHAR(255),
    "image_path" VARCHAR(512),
    "image_mime_type" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "damage_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "damage_reports_tracking_code_key" ON "damage_reports"("tracking_code");

-- CreateIndex
CREATE INDEX "damage_reports_status_idx" ON "damage_reports"("status");

-- CreateIndex
CREATE INDEX "damage_reports_priority_idx" ON "damage_reports"("priority");

-- CreateIndex
CREATE INDEX "damage_reports_location_idx" ON "damage_reports"("location");

-- CreateIndex
CREATE INDEX "damage_reports_created_at_idx" ON "damage_reports"("created_at");
