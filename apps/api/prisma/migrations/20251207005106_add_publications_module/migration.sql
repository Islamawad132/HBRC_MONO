-- CreateEnum
CREATE TYPE "PublicationType" AS ENUM ('CODE', 'SPECIFICATION', 'GUIDE', 'RESEARCH', 'PUBLICATION', 'OTHER');

-- CreateEnum
CREATE TYPE "PublicationStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PurchaseType" AS ENUM ('FULL_DOWNLOAD', 'PART_DOWNLOAD', 'VIEW_ONCE', 'VIEW_LIMITED', 'VIEW_PERMANENT', 'PHYSICAL_COPY');

-- CreateEnum
CREATE TYPE "PublicationPurchaseStatus" AS ENUM ('PENDING', 'PAID', 'DELIVERED', 'CANCELLED', 'REFUNDED');

-- CreateTable
CREATE TABLE "publication_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "description" TEXT,
    "descriptionAr" TEXT,
    "parentId" TEXT,
    "code" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "publication_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publications" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "description" TEXT,
    "descriptionAr" TEXT,
    "keywords" TEXT,
    "type" "PublicationType" NOT NULL DEFAULT 'CODE',
    "code" TEXT NOT NULL,
    "partNumber" TEXT,
    "partName" TEXT,
    "partNameAr" TEXT,
    "editionNumber" INTEGER NOT NULL DEFAULT 1,
    "editionYear" INTEGER,
    "editionDate" TIMESTAMP(3),
    "categoryId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER,
    "pageCount" INTEGER,
    "previewPath" TEXT,
    "coverImage" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "partPrice" DECIMAL(10,2),
    "viewPrice" DECIMAL(10,2),
    "physicalPrice" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "purchaseCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdByType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publication_purchases" (
    "id" TEXT NOT NULL,
    "purchaseNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "purchaseType" "PurchaseType" NOT NULL DEFAULT 'FULL_DOWNLOAD',
    "status" "PublicationPurchaseStatus" NOT NULL DEFAULT 'PENDING',
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "paymentMethod" "PaymentMethod",
    "paymentId" TEXT,
    "paidAt" TIMESTAMP(3),
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "maxDownloads" INTEGER NOT NULL DEFAULT 3,
    "expiresAt" TIMESTAMP(3),
    "lastAccessedAt" TIMESTAMP(3),
    "shippingAddress" TEXT,
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "publication_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "publication_categories_code_key" ON "publication_categories"("code");

-- CreateIndex
CREATE INDEX "publication_categories_parentId_idx" ON "publication_categories"("parentId");

-- CreateIndex
CREATE INDEX "publication_categories_isActive_idx" ON "publication_categories"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "publications_code_key" ON "publications"("code");

-- CreateIndex
CREATE INDEX "publications_categoryId_idx" ON "publications"("categoryId");

-- CreateIndex
CREATE INDEX "publications_type_idx" ON "publications"("type");

-- CreateIndex
CREATE INDEX "publications_status_idx" ON "publications"("status");

-- CreateIndex
CREATE INDEX "publications_isActive_idx" ON "publications"("isActive");

-- CreateIndex
CREATE INDEX "publications_code_idx" ON "publications"("code");

-- CreateIndex
CREATE UNIQUE INDEX "publication_purchases_purchaseNumber_key" ON "publication_purchases"("purchaseNumber");

-- CreateIndex
CREATE INDEX "publication_purchases_customerId_idx" ON "publication_purchases"("customerId");

-- CreateIndex
CREATE INDEX "publication_purchases_publicationId_idx" ON "publication_purchases"("publicationId");

-- CreateIndex
CREATE INDEX "publication_purchases_status_idx" ON "publication_purchases"("status");

-- CreateIndex
CREATE INDEX "publication_purchases_purchaseNumber_idx" ON "publication_purchases"("purchaseNumber");

-- AddForeignKey
ALTER TABLE "publication_categories" ADD CONSTRAINT "publication_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "publication_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publications" ADD CONSTRAINT "publications_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "publication_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publication_purchases" ADD CONSTRAINT "publication_purchases_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publication_purchases" ADD CONSTRAINT "publication_purchases_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "publications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
