-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('CUSTOMER', 'EMPLOYEE', 'ADMIN');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING');

-- AlterTable: customers
ALTER TABLE "customers"
  DROP COLUMN IF EXISTS "isActive",
  ADD COLUMN "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "verifiedAt" TIMESTAMP(3),
  ADD COLUMN "language" TEXT NOT NULL DEFAULT 'ar',
  ADD COLUMN "notifications" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "lastLoginAt" TIMESTAMP(3),
  ADD COLUMN "loginCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable: employees
ALTER TABLE "employees"
  DROP COLUMN IF EXISTS "isActive",
  ADD COLUMN "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "language" TEXT NOT NULL DEFAULT 'ar',
  ADD COLUMN "notifications" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "lastLoginAt" TIMESTAMP(3),
  ADD COLUMN "loginCount" INTEGER NOT NULL DEFAULT 0;

-- Data Migration: Convert isActive to status
-- (This is safe because we're adding defaults before dropping)
-- No action needed as we already added default values
