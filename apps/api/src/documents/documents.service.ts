import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadDocumentDto, UpdateDocumentDto } from './dto';
import { Document, DocumentType } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class DocumentsService {
  private readonly uploadsPath = path.join(process.cwd(), 'uploads', 'documents');

  constructor(private prisma: PrismaService) {
    // Ensure uploads directory exists
    this.ensureUploadDirectoryExists();
  }

  private async ensureUploadDirectoryExists() {
    try {
      await fs.access(this.uploadsPath);
    } catch {
      await fs.mkdir(this.uploadsPath, { recursive: true });
    }
  }

  async upload(
    file: Express.Multer.File,
    uploadDocumentDto: UploadDocumentDto,
    uploadedById: string,
    uploadedByType: 'customer' | 'employee',
  ): Promise<Document> {
    // Validate file
    if (!file) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'No file uploaded',
        messageAr: 'لم يتم رفع ملف',
      });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException({
        statusCode: 400,
        message: `File size exceeds limit (${maxSize / 1024 / 1024}MB)`,
        messageAr: `حجم الملف يتجاوز الحد المسموح (${maxSize / 1024 / 1024}MB)`,
      });
    }

    // Validate request if provided
    if (uploadDocumentDto.requestId) {
      const request = await this.prisma.serviceRequest.findUnique({
        where: { id: uploadDocumentDto.requestId },
      });

      if (!request) {
        throw new NotFoundException({
          statusCode: 404,
          message: 'Service request not found',
          messageAr: 'طلب الخدمة غير موجود',
        });
      }
    }

    // Generate unique filename
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const storedFilename = `${timestamp}-${Math.random().toString(36).substring(7)}${ext}`;
    const filepath = path.join(this.uploadsPath, storedFilename);

    // Save file to disk
    await fs.writeFile(filepath, file.buffer);

    // Save document metadata to database
    return this.prisma.document.create({
      data: {
        filename: file.originalname,
        storedFilename,
        filepath: path.join('uploads', 'documents', storedFilename),
        mimetype: file.mimetype,
        size: file.size,
        title: uploadDocumentDto.title,
        titleAr: uploadDocumentDto.titleAr,
        description: uploadDocumentDto.description,
        descriptionAr: uploadDocumentDto.descriptionAr,
        type: uploadDocumentDto.type,
        requestId: uploadDocumentDto.requestId,
        uploadedById,
        uploadedByType,
        isPublic: uploadDocumentDto.isPublic ?? false,
      },
      include: {
        request: {
          select: {
            id: true,
            requestNumber: true,
            title: true,
          },
        },
      },
    });
  }

  async findAll(filters?: {
    requestId?: string;
    type?: DocumentType;
    uploadedById?: string;
  }): Promise<Document[]> {
    const where: any = {};

    if (filters?.requestId) where.requestId = filters.requestId;
    if (filters?.type) where.type = filters.type;
    if (filters?.uploadedById) where.uploadedById = filters.uploadedById;

    return this.prisma.document.findMany({
      where,
      include: {
        request: {
          select: {
            id: true,
            requestNumber: true,
            title: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async findOne(id: string): Promise<Document> {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: {
        request: {
          select: {
            id: true,
            requestNumber: true,
            title: true,
            customerId: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException({
        statusCode: 404,
        message: `Document with ID "${id}" not found`,
        messageAr: `المستند برقم "${id}" غير موجود`,
      });
    }

    return document;
  }

  async download(
    id: string,
    userId: string,
    userType: 'customer' | 'employee',
  ): Promise<{ filepath: string; filename: string; mimetype: string }> {
    const document = await this.findOne(id);

    // Check access permissions
    if (!document.isPublic) {
      // Only the uploader or assigned employee can download private documents
      const hasAccess =
        document.uploadedById === userId ||
        (userType === 'employee' && document.requestId !== userId);

      if (!hasAccess) {
        throw new ForbiddenException({
          statusCode: 403,
          message: 'Access denied to this document',
          messageAr: 'الوصول مرفوض لهذا المستند',
        });
      }
    }

    // Check if file exists
    const fullPath = path.join(process.cwd(), document.filepath);
    try {
      await fs.access(fullPath);
    } catch {
      throw new NotFoundException({
        statusCode: 404,
        message: 'File not found on disk',
        messageAr: 'الملف غير موجود على القرص',
      });
    }

    // Increment download count
    await this.prisma.document.update({
      where: { id },
      data: {
        downloadCount: { increment: 1 },
        lastDownloadAt: new Date(),
      },
    });

    return {
      filepath: fullPath,
      filename: document.filename,
      mimetype: document.mimetype,
    };
  }

  async update(id: string, updateDocumentDto: UpdateDocumentDto): Promise<Document> {
    await this.findOne(id);

    return this.prisma.document.update({
      where: { id },
      data: updateDocumentDto,
      include: {
        request: {
          select: {
            id: true,
            requestNumber: true,
            title: true,
          },
        },
      },
    });
  }

  async remove(
    id: string,
    userId: string,
    userType: 'customer' | 'employee',
  ): Promise<{ message: string; messageAr: string }> {
    const document = await this.findOne(id);

    // Only the uploader or admin can delete
    if (document.uploadedById !== userId && userType !== 'employee') {
      throw new ForbiddenException({
        statusCode: 403,
        message: 'Only the uploader can delete this document',
        messageAr: 'فقط من قام برفع المستند يمكنه حذفه',
      });
    }

    // Delete file from disk
    const fullPath = path.join(process.cwd(), document.filepath);
    try {
      await fs.unlink(fullPath);
    } catch (error) {
      // File might not exist, but continue with database deletion
      console.warn(`Failed to delete file: ${fullPath}`, error);
    }

    // Delete from database
    await this.prisma.document.delete({
      where: { id },
    });

    return {
      message: 'Document deleted successfully',
      messageAr: 'تم حذف المستند بنجاح',
    };
  }

  async getDocumentStats(): Promise<{
    total: number;
    byType: Record<DocumentType, number>;
    totalSize: number;
    averageSize: number;
  }> {
    const documents = await this.prisma.document.findMany();

    const byType = documents.reduce(
      (acc, doc) => {
        acc[doc.type] = (acc[doc.type] || 0) + 1;
        return acc;
      },
      {} as Record<DocumentType, number>,
    );

    const totalSize = documents.reduce((sum, doc) => sum + doc.size, 0);
    const averageSize = documents.length > 0 ? Math.round(totalSize / documents.length) : 0;

    return {
      total: documents.length,
      byType,
      totalSize,
      averageSize,
    };
  }
}
