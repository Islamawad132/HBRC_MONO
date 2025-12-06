-- CreateEnum
CREATE TYPE "ServiceCategory" AS ENUM ('LAB_TESTS', 'CONSULTANCY', 'STATIONS_APPROVAL', 'FIRE_SAFETY', 'GREEN_BUILDING', 'TRAINING', 'SOIL_TESTING', 'CONCRETE_TESTING', 'STRUCTURAL_REVIEW', 'SEISMIC_ANALYSIS', 'THERMAL_INSULATION', 'ACOUSTIC_TESTING', 'OTHER');

-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PricingType" AS ENUM ('FIXED', 'VARIABLE', 'CUSTOM');

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "description" TEXT,
    "descriptionAr" TEXT,
    "category" "ServiceCategory" NOT NULL,
    "code" TEXT NOT NULL,
    "pricingType" "PricingType" NOT NULL DEFAULT 'FIXED',
    "basePrice" DECIMAL(10,2),
    "minPrice" DECIMAL(10,2),
    "maxPrice" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "duration" INTEGER,
    "requirements" TEXT,
    "requirementsAr" TEXT,
    "status" "ServiceStatus" NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "orderCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "services_code_key" ON "services"("code");
