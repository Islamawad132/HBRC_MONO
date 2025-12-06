-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('CONTRACT', 'CERTIFICATE', 'REPORT', 'INVOICE_PDF', 'RECEIPT', 'TEST_RESULT', 'TECHNICAL_DRAWING', 'PHOTO', 'VIDEO', 'OTHER');

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "storedFilename" TEXT NOT NULL,
    "filepath" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "title" TEXT,
    "titleAr" TEXT,
    "description" TEXT,
    "descriptionAr" TEXT,
    "type" "DocumentType" NOT NULL DEFAULT 'OTHER',
    "requestId" TEXT,
    "uploadedById" TEXT NOT NULL,
    "uploadedByType" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "lastDownloadAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "documents_storedFilename_key" ON "documents"("storedFilename");

-- CreateIndex
CREATE INDEX "documents_requestId_idx" ON "documents"("requestId");

-- CreateIndex
CREATE INDEX "documents_uploadedById_idx" ON "documents"("uploadedById");

-- CreateIndex
CREATE INDEX "documents_type_idx" ON "documents"("type");

-- CreateIndex
CREATE INDEX "documents_storedFilename_idx" ON "documents"("storedFilename");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "service_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
