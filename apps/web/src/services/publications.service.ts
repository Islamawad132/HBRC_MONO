import { httpClient } from './httpclient';

// Types
export interface PublicationCategory {
  id: string;
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  parentId?: string;
  code: string;
  sortOrder: number;
  isActive: boolean;
  children?: PublicationCategory[];
  _count?: { publications: number };
  createdAt: string;
  updatedAt: string;
}

export interface Publication {
  id: string;
  title: string;
  titleAr: string;
  description?: string;
  descriptionAr?: string;
  keywords?: string;
  type: PublicationType;
  code: string;
  partNumber?: string;
  partName?: string;
  partNameAr?: string;
  editionNumber: number;
  editionYear?: number;
  editionDate?: string;
  categoryId: string;
  category?: PublicationCategory;
  filePath?: string;
  fileSize?: number;
  pageCount?: number;
  previewPath?: string;
  coverImage?: string;
  price: number;
  partPrice?: number;
  viewPrice?: number;
  physicalPrice?: number;
  currency: string;
  status: PublicationStatus;
  isActive: boolean;
  isFeatured: boolean;
  viewCount: number;
  downloadCount: number;
  purchaseCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PublicationPurchase {
  id: string;
  purchaseNumber: string;
  customerId: string;
  publicationId: string;
  publication?: Publication;
  purchaseType: PurchaseType;
  status: PublicationPurchaseStatus;
  price: number;
  currency: string;
  paymentMethod?: string;
  paymentId?: string;
  paidAt?: string;
  downloadCount: number;
  maxDownloads: number;
  expiresAt?: string;
  lastAccessedAt?: string;
  shippingAddress?: string;
  shippedAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type PublicationType = 'CODE' | 'SPECIFICATION' | 'GUIDE' | 'RESEARCH' | 'PUBLICATION' | 'OTHER';
export type PublicationStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type PurchaseType = 'FULL_DOWNLOAD' | 'PART_DOWNLOAD' | 'VIEW_ONCE' | 'VIEW_LIMITED' | 'VIEW_PERMANENT' | 'PHYSICAL_COPY';
export type PublicationPurchaseStatus = 'PENDING' | 'PAID' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';

export interface CreateCategoryRequest {
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  parentId?: string;
  code: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {}

export interface CreatePublicationRequest {
  title: string;
  titleAr: string;
  description?: string;
  descriptionAr?: string;
  keywords?: string;
  type: PublicationType;
  code: string;
  partNumber?: string;
  partName?: string;
  partNameAr?: string;
  editionNumber?: number;
  editionYear?: number;
  editionDate?: string;
  categoryId: string;
  price: number;
  partPrice?: number;
  viewPrice?: number;
  physicalPrice?: number;
  currency?: string;
  status?: PublicationStatus;
  isActive?: boolean;
  isFeatured?: boolean;
  pageCount?: number;
}

export interface UpdatePublicationRequest extends Partial<CreatePublicationRequest> {}

export interface CreatePurchaseRequest {
  publicationId: string;
  purchaseType: PurchaseType;
  paymentMethod?: string;
  shippingAddress?: string;
}

export interface PublicationFilters {
  categoryId?: string;
  type?: PublicationType;
  status?: PublicationStatus;
  isActive?: boolean;
  isFeatured?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PublicationStats {
  totalPublications: number;
  publishedCount: number;
  draftCount: number;
  totalPurchases: number;
  paidPurchases: number;
  totalRevenue: number;
}

const ENDPOINTS = {
  // Categories
  categories: '/publications/categories',
  categoryById: (id: string) => `/publications/categories/${id}`,
  // Publications
  publications: '/publications',
  publicationById: (id: string) => `/publications/${id}`,
  uploadPdf: (id: string) => `/publications/${id}/upload-pdf`,
  uploadCover: (id: string) => `/publications/${id}/upload-cover`,
  uploadPreview: (id: string) => `/publications/${id}/upload-preview`,
  stats: '/publications/stats',
  // Purchases
  purchases: '/publications/purchases',
  myPurchases: '/publications/purchases/my',
  purchaseById: (id: string) => `/publications/purchases/${id}`,
  markPaid: (id: string) => `/publications/purchases/${id}/mark-paid`,
  download: (id: string) => `/publications/purchases/${id}/download`,
};

class PublicationsService {
  // ============================================
  // CATEGORIES
  // ============================================

  async getCategories(includeInactive = false): Promise<PublicationCategory[]> {
    const url = includeInactive
      ? `${ENDPOINTS.categories}?includeInactive=true`
      : ENDPOINTS.categories;
    return httpClient.get<PublicationCategory[]>(url);
  }

  async getCategoryById(id: string): Promise<PublicationCategory> {
    return httpClient.get<PublicationCategory>(ENDPOINTS.categoryById(id));
  }

  async createCategory(data: CreateCategoryRequest): Promise<PublicationCategory> {
    return httpClient.post<PublicationCategory>(ENDPOINTS.categories, data);
  }

  async updateCategory(id: string, data: UpdateCategoryRequest): Promise<PublicationCategory> {
    return httpClient.patch<PublicationCategory>(ENDPOINTS.categoryById(id), data);
  }

  async deleteCategory(id: string): Promise<{ message: string; messageAr: string }> {
    return httpClient.delete(ENDPOINTS.categoryById(id));
  }

  // ============================================
  // PUBLICATIONS
  // ============================================

  async getPublications(filters?: PublicationFilters): Promise<PaginatedResponse<Publication>> {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.categoryId) params.append('categoryId', filters.categoryId);
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);
      if (filters.isActive !== undefined) params.append('isActive', String(filters.isActive));
      if (filters.isFeatured !== undefined) params.append('isFeatured', String(filters.isFeatured));
      if (filters.search) params.append('search', filters.search);
      if (filters.page) params.append('page', String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));
    }

    const queryString = params.toString();
    const url = queryString ? `${ENDPOINTS.publications}?${queryString}` : ENDPOINTS.publications;

    return httpClient.get<PaginatedResponse<Publication>>(url);
  }

  async getPublicationById(id: string): Promise<Publication> {
    return httpClient.get<Publication>(ENDPOINTS.publicationById(id));
  }

  async createPublication(data: CreatePublicationRequest): Promise<Publication> {
    return httpClient.post<Publication>(ENDPOINTS.publications, data);
  }

  async updatePublication(id: string, data: UpdatePublicationRequest): Promise<Publication> {
    return httpClient.patch<Publication>(ENDPOINTS.publicationById(id), data);
  }

  async deletePublication(id: string): Promise<{ message: string; messageAr: string }> {
    return httpClient.delete(ENDPOINTS.publicationById(id));
  }

  async uploadPdf(id: string, file: File): Promise<Publication> {
    const formData = new FormData();
    formData.append('file', file);
    return httpClient.upload<Publication>(ENDPOINTS.uploadPdf(id), formData);
  }

  async uploadCover(id: string, file: File): Promise<Publication> {
    const formData = new FormData();
    formData.append('file', file);
    return httpClient.upload<Publication>(ENDPOINTS.uploadCover(id), formData);
  }

  async uploadPreview(id: string, file: File): Promise<Publication> {
    const formData = new FormData();
    formData.append('file', file);
    return httpClient.upload<Publication>(ENDPOINTS.uploadPreview(id), formData);
  }

  async getStats(): Promise<PublicationStats> {
    return httpClient.get<PublicationStats>(ENDPOINTS.stats);
  }

  // ============================================
  // PURCHASES (Customer)
  // ============================================

  async createPurchase(data: CreatePurchaseRequest): Promise<PublicationPurchase> {
    return httpClient.post<PublicationPurchase>(ENDPOINTS.purchases, data);
  }

  async getMyPurchases(): Promise<PublicationPurchase[]> {
    return httpClient.get<PublicationPurchase[]>(ENDPOINTS.myPurchases);
  }

  async getPurchaseById(id: string): Promise<PublicationPurchase> {
    return httpClient.get<PublicationPurchase>(ENDPOINTS.purchaseById(id));
  }

  async markPurchaseAsPaid(id: string, paymentId: string): Promise<PublicationPurchase> {
    return httpClient.post<PublicationPurchase>(ENDPOINTS.markPaid(id), { paymentId });
  }

  async downloadPublication(purchaseId: string, filename: string): Promise<void> {
    return httpClient.download(ENDPOINTS.download(purchaseId), filename);
  }

  // ============================================
  // HELPERS
  // ============================================

  getPublicationTypeLabel(type: PublicationType, lang: 'en' | 'ar' = 'en'): string {
    const labels: Record<PublicationType, { en: string; ar: string }> = {
      CODE: { en: 'Egyptian Code', ar: 'كود مصري' },
      SPECIFICATION: { en: 'Specification', ar: 'مواصفة قياسية' },
      GUIDE: { en: 'Technical Guide', ar: 'دليل فني' },
      RESEARCH: { en: 'Research', ar: 'بحث علمي' },
      PUBLICATION: { en: 'Publication', ar: 'مطبوعة' },
      OTHER: { en: 'Other', ar: 'أخرى' },
    };
    return labels[type]?.[lang] || type;
  }

  getStatusLabel(status: PublicationStatus, lang: 'en' | 'ar' = 'en'): string {
    const labels: Record<PublicationStatus, { en: string; ar: string }> = {
      DRAFT: { en: 'Draft', ar: 'مسودة' },
      PUBLISHED: { en: 'Published', ar: 'منشور' },
      ARCHIVED: { en: 'Archived', ar: 'مؤرشف' },
    };
    return labels[status]?.[lang] || status;
  }

  getPurchaseTypeLabel(type: PurchaseType, lang: 'en' | 'ar' = 'en'): string {
    const labels: Record<PurchaseType, { en: string; ar: string }> = {
      FULL_DOWNLOAD: { en: 'Full Download', ar: 'تحميل كامل' },
      PART_DOWNLOAD: { en: 'Part Download', ar: 'تحميل جزء' },
      VIEW_ONCE: { en: 'View Once', ar: 'تصفح مرة واحدة' },
      VIEW_LIMITED: { en: 'Limited View', ar: 'تصفح محدود' },
      VIEW_PERMANENT: { en: 'Permanent View', ar: 'تصفح دائم' },
      PHYSICAL_COPY: { en: 'Physical Copy', ar: 'نسخة ورقية' },
    };
    return labels[type]?.[lang] || type;
  }

  getPurchaseStatusLabel(status: PublicationPurchaseStatus, lang: 'en' | 'ar' = 'en'): string {
    const labels: Record<PublicationPurchaseStatus, { en: string; ar: string }> = {
      PENDING: { en: 'Pending Payment', ar: 'في انتظار الدفع' },
      PAID: { en: 'Paid', ar: 'تم الدفع' },
      DELIVERED: { en: 'Delivered', ar: 'تم التسليم' },
      CANCELLED: { en: 'Cancelled', ar: 'ملغي' },
      REFUNDED: { en: 'Refunded', ar: 'مسترد' },
    };
    return labels[status]?.[lang] || status;
  }
}

export const publicationsService = new PublicationsService();
export default publicationsService;
