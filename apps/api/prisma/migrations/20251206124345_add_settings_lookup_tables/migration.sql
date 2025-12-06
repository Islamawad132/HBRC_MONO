-- CreateEnum
CREATE TYPE "StandardType" AS ENUM ('EGYPTIAN', 'BRITISH', 'AMERICAN', 'EUROPEAN', 'INTERNATIONAL', 'OTHER');

-- CreateEnum
CREATE TYPE "SettingType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'DATE');

-- CreateTable
CREATE TABLE "test_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "description" TEXT,
    "descriptionAr" TEXT,
    "code" TEXT NOT NULL,
    "category" "ServiceCategory" NOT NULL,
    "basePrice" DECIMAL(10,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sample_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "description" TEXT,
    "descriptionAr" TEXT,
    "code" TEXT NOT NULL,
    "testTypeId" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'sample',
    "unitAr" TEXT NOT NULL DEFAULT 'عينة',
    "minQuantity" INTEGER NOT NULL DEFAULT 1,
    "maxQuantity" INTEGER,
    "pricePerUnit" DECIMAL(10,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sample_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "standards" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "description" TEXT,
    "descriptionAr" TEXT,
    "code" TEXT NOT NULL,
    "type" "StandardType" NOT NULL DEFAULT 'EGYPTIAN',
    "documentUrl" TEXT,
    "version" TEXT,
    "publishedYear" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "standards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_lists" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "description" TEXT,
    "descriptionAr" TEXT,
    "code" TEXT NOT NULL,
    "category" "ServiceCategory" NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_list_items" (
    "id" TEXT NOT NULL,
    "priceListId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "description" TEXT,
    "descriptionAr" TEXT,
    "code" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'unit',
    "unitAr" TEXT NOT NULL DEFAULT 'وحدة',
    "minQuantity" INTEGER NOT NULL DEFAULT 1,
    "maxQuantity" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_list_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distance_rates" (
    "id" TEXT NOT NULL,
    "fromKm" INTEGER NOT NULL,
    "toKm" INTEGER NOT NULL,
    "rate" DECIMAL(10,2) NOT NULL,
    "ratePerKm" DECIMAL(10,2),
    "description" TEXT,
    "descriptionAr" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "distance_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mixer_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "description" TEXT,
    "descriptionAr" TEXT,
    "code" TEXT NOT NULL,
    "capacity" DECIMAL(10,2),
    "capacityUnit" TEXT NOT NULL DEFAULT 'm³',
    "capacityUnitAr" TEXT NOT NULL DEFAULT 'م³',
    "pricePerBatch" DECIMAL(10,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mixer_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lookup_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "description" TEXT,
    "descriptionAr" TEXT,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lookup_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lookup_items" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "description" TEXT,
    "descriptionAr" TEXT,
    "code" TEXT NOT NULL,
    "value" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lookup_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" "SettingType" NOT NULL DEFAULT 'STRING',
    "category" TEXT NOT NULL DEFAULT 'general',
    "label" TEXT NOT NULL,
    "labelAr" TEXT NOT NULL,
    "description" TEXT,
    "descriptionAr" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "validationRule" TEXT,
    "inputType" TEXT NOT NULL DEFAULT 'text',
    "options" JSONB,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_TestTypeStandards" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "test_types_code_key" ON "test_types"("code");

-- CreateIndex
CREATE INDEX "test_types_category_idx" ON "test_types"("category");

-- CreateIndex
CREATE INDEX "test_types_isActive_idx" ON "test_types"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "sample_types_code_key" ON "sample_types"("code");

-- CreateIndex
CREATE INDEX "sample_types_testTypeId_idx" ON "sample_types"("testTypeId");

-- CreateIndex
CREATE INDEX "sample_types_isActive_idx" ON "sample_types"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "standards_code_key" ON "standards"("code");

-- CreateIndex
CREATE INDEX "standards_type_idx" ON "standards"("type");

-- CreateIndex
CREATE INDEX "standards_isActive_idx" ON "standards"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "price_lists_code_key" ON "price_lists"("code");

-- CreateIndex
CREATE INDEX "price_lists_category_idx" ON "price_lists"("category");

-- CreateIndex
CREATE INDEX "price_lists_isActive_idx" ON "price_lists"("isActive");

-- CreateIndex
CREATE INDEX "price_lists_validFrom_validTo_idx" ON "price_lists"("validFrom", "validTo");

-- CreateIndex
CREATE INDEX "price_list_items_priceListId_idx" ON "price_list_items"("priceListId");

-- CreateIndex
CREATE INDEX "price_list_items_isActive_idx" ON "price_list_items"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "price_list_items_priceListId_code_key" ON "price_list_items"("priceListId", "code");

-- CreateIndex
CREATE INDEX "distance_rates_fromKm_toKm_idx" ON "distance_rates"("fromKm", "toKm");

-- CreateIndex
CREATE INDEX "distance_rates_isActive_idx" ON "distance_rates"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "mixer_types_code_key" ON "mixer_types"("code");

-- CreateIndex
CREATE INDEX "mixer_types_isActive_idx" ON "mixer_types"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "lookup_categories_code_key" ON "lookup_categories"("code");

-- CreateIndex
CREATE INDEX "lookup_categories_isActive_idx" ON "lookup_categories"("isActive");

-- CreateIndex
CREATE INDEX "lookup_items_categoryId_idx" ON "lookup_items"("categoryId");

-- CreateIndex
CREATE INDEX "lookup_items_isActive_idx" ON "lookup_items"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "lookup_items_categoryId_code_key" ON "lookup_items"("categoryId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE INDEX "system_settings_category_idx" ON "system_settings"("category");

-- CreateIndex
CREATE INDEX "system_settings_key_idx" ON "system_settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "_TestTypeStandards_AB_unique" ON "_TestTypeStandards"("A", "B");

-- CreateIndex
CREATE INDEX "_TestTypeStandards_B_index" ON "_TestTypeStandards"("B");

-- AddForeignKey
ALTER TABLE "sample_types" ADD CONSTRAINT "sample_types_testTypeId_fkey" FOREIGN KEY ("testTypeId") REFERENCES "test_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_list_items" ADD CONSTRAINT "price_list_items_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "price_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lookup_items" ADD CONSTRAINT "lookup_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "lookup_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TestTypeStandards" ADD CONSTRAINT "_TestTypeStandards_A_fkey" FOREIGN KEY ("A") REFERENCES "standards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TestTypeStandards" ADD CONSTRAINT "_TestTypeStandards_B_fkey" FOREIGN KEY ("B") REFERENCES "test_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
