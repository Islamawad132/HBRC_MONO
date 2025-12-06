import { httpClient } from './httpclient';
import type {
  Document,
  UpdateDocumentRequest,
  PaginatedResponse,
  DeleteResponse,
} from '../types/interfaces';
import type { DocumentType } from '../types/enums';

const ENDPOINTS = {
  base: '/documents',
  byId: (id: string) => `/documents/${id}`,
  download: (id: string) => `/documents/${id}/download`,
  byRequest: (requestId: string) => `/documents/request/${requestId}`,
};

class DocumentsService {
  async getAll(filters?: {
    page?: number;
    limit?: number;
    type?: DocumentType;
    requestId?: string;
    search?: string;
  }): Promise<PaginatedResponse<Document>> {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.page) params.append('page', String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));
      if (filters.type) params.append('type', filters.type);
      if (filters.requestId) params.append('requestId', filters.requestId);
      if (filters.search) params.append('search', filters.search);
    }

    const queryString = params.toString();
    const url = queryString ? `${ENDPOINTS.base}?${queryString}` : ENDPOINTS.base;

    return httpClient.get<PaginatedResponse<Document>>(url);
  }

  async getById(id: string): Promise<Document> {
    return httpClient.get<Document>(ENDPOINTS.byId(id));
  }

  async getByRequest(requestId: string): Promise<Document[]> {
    return httpClient.get<Document[]>(ENDPOINTS.byRequest(requestId));
  }

  async upload(
    file: File,
    data?: {
      title?: string;
      titleAr?: string;
      description?: string;
      descriptionAr?: string;
      type?: DocumentType;
      requestId?: string;
      isPublic?: boolean;
    },
    onProgress?: (progress: number) => void
  ): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);

    if (data) {
      if (data.title) formData.append('title', data.title);
      if (data.titleAr) formData.append('titleAr', data.titleAr);
      if (data.description) formData.append('description', data.description);
      if (data.descriptionAr) formData.append('descriptionAr', data.descriptionAr);
      if (data.type) formData.append('type', data.type);
      if (data.requestId) formData.append('requestId', data.requestId);
      if (data.isPublic !== undefined) formData.append('isPublic', String(data.isPublic));
    }

    return httpClient.upload<Document>(
      ENDPOINTS.base,
      formData,
      onProgress
        ? (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            onProgress(progress);
          }
        : undefined
    );
  }

  async update(id: string, data: UpdateDocumentRequest): Promise<Document> {
    return httpClient.patch<Document>(ENDPOINTS.byId(id), data);
  }

  async delete(id: string): Promise<DeleteResponse> {
    return httpClient.delete<DeleteResponse>(ENDPOINTS.byId(id));
  }

  async download(id: string, filename?: string): Promise<void> {
    // Get document info first to get the filename
    const doc = await this.getById(id);
    const finalFilename = filename || doc.filename;
    await httpClient.download(ENDPOINTS.download(id), finalFilename);
  }

  // Upload multiple files
  async uploadMultiple(
    files: File[],
    data?: {
      requestId?: string;
      type?: DocumentType;
      isPublic?: boolean;
    },
    onProgress?: (index: number, progress: number) => void
  ): Promise<Document[]> {
    const results: Document[] = [];

    for (let i = 0; i < files.length; i++) {
      const doc = await this.upload(
        files[i],
        data,
        onProgress ? (progress) => onProgress(i, progress) : undefined
      );
      results.push(doc);
    }

    return results;
  }
}

export const documentsService = new DocumentsService();
export default documentsService;
