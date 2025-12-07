import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePublicationCategoryDto,
  UpdatePublicationCategoryDto,
  CreatePublicationDto,
  UpdatePublicationDto,
  CreatePublicationPurchaseDto,
} from './dto';
import {
  PublicationType,
  PublicationStatus,
  PurchaseType,
  PublicationPurchaseStatus,
  Prisma,
} from '@prisma/client';

@Injectable()
export class PublicationsService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // CATEGORIES
  // ============================================

  async createCategory(dto: CreatePublicationCategoryDto) {
    const existing = await this.prisma.publicationCategory.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException({
        message: `Category with code "${dto.code}" already exists`,
        messageAr: `الفئة برمز "${dto.code}" موجودة بالفعل`,
      });
    }

    if (dto.parentId) {
      const parent = await this.prisma.publicationCategory.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException({
          message: 'Parent category not found',
          messageAr: 'الفئة الأصلية غير موجودة',
        });
      }
    }

    return this.prisma.publicationCategory.create({
      data: dto,
      include: { children: true, parent: true },
    });
  }

  async findAllCategories(includeInactive = false) {
    return this.prisma.publicationCategory.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        children: {
          where: includeInactive ? {} : { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        _count: { select: { publications: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findCategoryById(id: string) {
    const category = await this.prisma.publicationCategory.findUnique({
      where: { id },
      include: {
        children: true,
        parent: true,
        publications: { take: 10 },
      },
    });
    if (!category) {
      throw new NotFoundException({
        message: 'Category not found',
        messageAr: 'الفئة غير موجودة',
      });
    }
    return category;
  }

  async updateCategory(id: string, dto: UpdatePublicationCategoryDto) {
    await this.findCategoryById(id);

    if (dto.code) {
      const existing = await this.prisma.publicationCategory.findFirst({
        where: { code: dto.code, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException({
          message: `Category with code "${dto.code}" already exists`,
          messageAr: `الفئة برمز "${dto.code}" موجودة بالفعل`,
        });
      }
    }

    return this.prisma.publicationCategory.update({
      where: { id },
      data: dto,
      include: { children: true, parent: true },
    });
  }

  async deleteCategory(id: string) {
    const category = await this.findCategoryById(id);

    const publicationCount = await this.prisma.publication.count({
      where: { categoryId: id },
    });
    if (publicationCount > 0) {
      throw new BadRequestException({
        message: `Cannot delete category with ${publicationCount} publications`,
        messageAr: `لا يمكن حذف فئة تحتوي على ${publicationCount} منشور`,
      });
    }

    const childCount = await this.prisma.publicationCategory.count({
      where: { parentId: id },
    });
    if (childCount > 0) {
      throw new BadRequestException({
        message: `Cannot delete category with ${childCount} subcategories`,
        messageAr: `لا يمكن حذف فئة تحتوي على ${childCount} فئة فرعية`,
      });
    }

    await this.prisma.publicationCategory.delete({ where: { id } });
    return {
      message: 'Category deleted successfully',
      messageAr: 'تم حذف الفئة بنجاح',
    };
  }

  // ============================================
  // PUBLICATIONS
  // ============================================

  async createPublication(dto: CreatePublicationDto, createdById: string) {
    const existing = await this.prisma.publication.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException({
        message: `Publication with code "${dto.code}" already exists`,
        messageAr: `المنشور برمز "${dto.code}" موجود بالفعل`,
      });
    }

    const category = await this.prisma.publicationCategory.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new NotFoundException({
        message: 'Category not found',
        messageAr: 'الفئة غير موجودة',
      });
    }

    const { editionDate, ...rest } = dto;

    return this.prisma.publication.create({
      data: {
        ...rest,
        editionDate: editionDate ? new Date(editionDate) : null,
        price: new Prisma.Decimal(dto.price),
        partPrice: dto.partPrice ? new Prisma.Decimal(dto.partPrice) : null,
        viewPrice: dto.viewPrice ? new Prisma.Decimal(dto.viewPrice) : null,
        physicalPrice: dto.physicalPrice ? new Prisma.Decimal(dto.physicalPrice) : null,
        filePath: '', // Will be set when file is uploaded
        createdById,
        createdByType: 'employee',
      },
      include: { category: true },
    });
  }

  async findAllPublications(options?: {
    categoryId?: string;
    type?: PublicationType;
    status?: PublicationStatus;
    isActive?: boolean;
    isFeatured?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const where: Prisma.PublicationWhereInput = {};

    if (options?.categoryId) where.categoryId = options.categoryId;
    if (options?.type) where.type = options.type;
    if (options?.status) where.status = options.status;
    if (options?.isActive !== undefined) where.isActive = options.isActive;
    if (options?.isFeatured !== undefined) where.isFeatured = options.isFeatured;

    if (options?.search) {
      where.OR = [
        { title: { contains: options.search, mode: 'insensitive' } },
        { titleAr: { contains: options.search, mode: 'insensitive' } },
        { code: { contains: options.search, mode: 'insensitive' } },
        { keywords: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const [publications, total] = await Promise.all([
      this.prisma.publication.findMany({
        where,
        include: { category: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.publication.count({ where }),
    ]);

    return {
      data: publications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findPublicationById(id: string) {
    const publication = await this.prisma.publication.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!publication) {
      throw new NotFoundException({
        message: 'Publication not found',
        messageAr: 'المنشور غير موجود',
      });
    }
    return publication;
  }

  async findPublicationByCode(code: string) {
    const publication = await this.prisma.publication.findUnique({
      where: { code },
      include: { category: true },
    });
    if (!publication) {
      throw new NotFoundException({
        message: 'Publication not found',
        messageAr: 'المنشور غير موجود',
      });
    }
    return publication;
  }

  async updatePublication(id: string, dto: UpdatePublicationDto) {
    await this.findPublicationById(id);

    if (dto.code) {
      const existing = await this.prisma.publication.findFirst({
        where: { code: dto.code, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException({
          message: `Publication with code "${dto.code}" already exists`,
          messageAr: `المنشور برمز "${dto.code}" موجود بالفعل`,
        });
      }
    }

    if (dto.categoryId) {
      const category = await this.prisma.publicationCategory.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new NotFoundException({
          message: 'Category not found',
          messageAr: 'الفئة غير موجودة',
        });
      }
    }

    const { editionDate, price, partPrice, viewPrice, physicalPrice, ...rest } = dto;

    return this.prisma.publication.update({
      where: { id },
      data: {
        ...rest,
        ...(editionDate !== undefined && { editionDate: editionDate ? new Date(editionDate) : null }),
        ...(price !== undefined && { price: new Prisma.Decimal(price) }),
        ...(partPrice !== undefined && { partPrice: partPrice ? new Prisma.Decimal(partPrice) : null }),
        ...(viewPrice !== undefined && { viewPrice: viewPrice ? new Prisma.Decimal(viewPrice) : null }),
        ...(physicalPrice !== undefined && { physicalPrice: physicalPrice ? new Prisma.Decimal(physicalPrice) : null }),
      },
      include: { category: true },
    });
  }

  async updatePublicationFile(id: string, filePath: string, fileSize: number) {
    await this.findPublicationById(id);
    return this.prisma.publication.update({
      where: { id },
      data: { filePath, fileSize },
      include: { category: true },
    });
  }

  async updatePublicationCover(id: string, coverImage: string) {
    await this.findPublicationById(id);
    return this.prisma.publication.update({
      where: { id },
      data: { coverImage },
      include: { category: true },
    });
  }

  async updatePublicationPreview(id: string, previewPath: string) {
    await this.findPublicationById(id);
    return this.prisma.publication.update({
      where: { id },
      data: { previewPath },
      include: { category: true },
    });
  }

  async deletePublication(id: string) {
    const publication = await this.findPublicationById(id);

    const purchaseCount = await this.prisma.publicationPurchase.count({
      where: { publicationId: id },
    });
    if (purchaseCount > 0) {
      throw new BadRequestException({
        message: `Cannot delete publication with ${purchaseCount} purchases. Archive it instead.`,
        messageAr: `لا يمكن حذف منشور له ${purchaseCount} عملية شراء. قم بأرشفته بدلاً من ذلك.`,
      });
    }

    await this.prisma.publication.delete({ where: { id } });
    return {
      message: 'Publication deleted successfully',
      messageAr: 'تم حذف المنشور بنجاح',
    };
  }

  async incrementViewCount(id: string) {
    return this.prisma.publication.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }

  // ============================================
  // PURCHASES
  // ============================================

  private async generatePurchaseNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const lastPurchase = await this.prisma.publicationPurchase.findFirst({
      where: { purchaseNumber: { startsWith: `PUB-${year}` } },
      orderBy: { purchaseNumber: 'desc' },
    });

    let sequence = 1;
    if (lastPurchase) {
      const lastSequence = parseInt(lastPurchase.purchaseNumber.split('-')[2], 10);
      sequence = lastSequence + 1;
    }

    return `PUB-${year}-${sequence.toString().padStart(4, '0')}`;
  }

  async createPurchase(dto: CreatePublicationPurchaseDto, customerId: string) {
    const publication = await this.findPublicationById(dto.publicationId);

    if (!publication.isActive || publication.status !== PublicationStatus.PUBLISHED) {
      throw new BadRequestException({
        message: 'Publication is not available for purchase',
        messageAr: 'المنشور غير متاح للشراء',
      });
    }

    // Check if customer already has an active purchase
    const existingPurchase = await this.prisma.publicationPurchase.findFirst({
      where: {
        customerId,
        publicationId: dto.publicationId,
        status: { in: [PublicationPurchaseStatus.PAID, PublicationPurchaseStatus.PENDING] },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    if (existingPurchase && existingPurchase.status === PublicationPurchaseStatus.PAID) {
      throw new ConflictException({
        message: 'You already have an active purchase for this publication',
        messageAr: 'لديك بالفعل عملية شراء نشطة لهذا المنشور',
      });
    }

    // Determine price based on purchase type
    let price: number;
    switch (dto.purchaseType) {
      case PurchaseType.FULL_DOWNLOAD:
        price = Number(publication.price);
        break;
      case PurchaseType.PART_DOWNLOAD:
        price = Number(publication.partPrice || publication.price);
        break;
      case PurchaseType.VIEW_ONCE:
      case PurchaseType.VIEW_LIMITED:
      case PurchaseType.VIEW_PERMANENT:
        price = Number(publication.viewPrice || publication.price);
        break;
      case PurchaseType.PHYSICAL_COPY:
        price = Number(publication.physicalPrice || publication.price);
        if (!dto.shippingAddress) {
          throw new BadRequestException({
            message: 'Shipping address is required for physical copies',
            messageAr: 'عنوان الشحن مطلوب للنسخ الورقية',
          });
        }
        break;
      default:
        price = Number(publication.price);
    }

    const purchaseNumber = await this.generatePurchaseNumber();

    // Set expiry based on purchase type
    let expiresAt: Date | null = null;
    let maxDownloads = 3;

    switch (dto.purchaseType) {
      case PurchaseType.VIEW_ONCE:
        maxDownloads = 1;
        expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        break;
      case PurchaseType.VIEW_LIMITED:
        maxDownloads = 0; // No downloads for view only
        expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        break;
      case PurchaseType.VIEW_PERMANENT:
        maxDownloads = 0;
        break;
      case PurchaseType.FULL_DOWNLOAD:
        maxDownloads = 5;
        break;
    }

    const purchase = await this.prisma.publicationPurchase.create({
      data: {
        purchaseNumber,
        customerId,
        publicationId: dto.publicationId,
        purchaseType: dto.purchaseType,
        price: new Prisma.Decimal(price),
        paymentMethod: dto.paymentMethod,
        shippingAddress: dto.shippingAddress,
        maxDownloads,
        expiresAt,
      },
      include: { publication: true },
    });

    return purchase;
  }

  async findPurchasesByCustomer(customerId: string) {
    return this.prisma.publicationPurchase.findMany({
      where: { customerId },
      include: { publication: { include: { category: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPurchaseById(id: string, customerId?: string) {
    const where: Prisma.PublicationPurchaseWhereUniqueInput = { id };

    const purchase = await this.prisma.publicationPurchase.findUnique({
      where,
      include: { publication: { include: { category: true } }, customer: true },
    });

    if (!purchase) {
      throw new NotFoundException({
        message: 'Purchase not found',
        messageAr: 'عملية الشراء غير موجودة',
      });
    }

    if (customerId && purchase.customerId !== customerId) {
      throw new NotFoundException({
        message: 'Purchase not found',
        messageAr: 'عملية الشراء غير موجودة',
      });
    }

    return purchase;
  }

  async markPurchaseAsPaid(id: string, paymentId: string) {
    const purchase = await this.findPurchaseById(id);

    if (purchase.status === PublicationPurchaseStatus.PAID) {
      throw new BadRequestException({
        message: 'Purchase is already paid',
        messageAr: 'تم الدفع بالفعل',
      });
    }

    const updated = await this.prisma.publicationPurchase.update({
      where: { id },
      data: {
        status: PublicationPurchaseStatus.PAID,
        paymentId,
        paidAt: new Date(),
      },
      include: { publication: true },
    });

    // Increment purchase count on publication
    await this.prisma.publication.update({
      where: { id: purchase.publicationId },
      data: { purchaseCount: { increment: 1 } },
    });

    return updated;
  }

  async incrementDownloadCount(purchaseId: string, customerId: string) {
    const purchase = await this.findPurchaseById(purchaseId, customerId);

    if (purchase.status !== PublicationPurchaseStatus.PAID) {
      throw new BadRequestException({
        message: 'Purchase is not paid',
        messageAr: 'لم يتم الدفع',
      });
    }

    if (purchase.expiresAt && new Date() > purchase.expiresAt) {
      throw new BadRequestException({
        message: 'Purchase has expired',
        messageAr: 'انتهت صلاحية عملية الشراء',
      });
    }

    if (purchase.downloadCount >= purchase.maxDownloads && purchase.maxDownloads > 0) {
      throw new BadRequestException({
        message: 'Maximum downloads reached',
        messageAr: 'تم الوصول للحد الأقصى من التحميلات',
      });
    }

    const updated = await this.prisma.publicationPurchase.update({
      where: { id: purchaseId },
      data: {
        downloadCount: { increment: 1 },
        lastAccessedAt: new Date(),
      },
    });

    // Increment download count on publication
    await this.prisma.publication.update({
      where: { id: purchase.publicationId },
      data: { downloadCount: { increment: 1 } },
    });

    return updated;
  }

  // ============================================
  // ADMIN STATS
  // ============================================

  async getStats() {
    const [
      totalPublications,
      publishedCount,
      totalPurchases,
      paidPurchases,
      totalRevenue,
    ] = await Promise.all([
      this.prisma.publication.count(),
      this.prisma.publication.count({ where: { status: PublicationStatus.PUBLISHED } }),
      this.prisma.publicationPurchase.count(),
      this.prisma.publicationPurchase.count({ where: { status: PublicationPurchaseStatus.PAID } }),
      this.prisma.publicationPurchase.aggregate({
        where: { status: PublicationPurchaseStatus.PAID },
        _sum: { price: true },
      }),
    ]);

    return {
      totalPublications,
      publishedCount,
      draftCount: totalPublications - publishedCount,
      totalPurchases,
      paidPurchases,
      totalRevenue: totalRevenue._sum.price || 0,
    };
  }
}
