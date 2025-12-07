import { httpClient } from './httpclient';
import type {
  Invoice,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  InvoiceFilters,
  PaginatedResponse,
  DeleteResponse,
} from '../types/interfaces';

const ENDPOINTS = {
  base: '/invoices',
  byId: (id: string) => `/invoices/${id}`,
  byNumber: (number: string) => `/invoices/number/${number}`,
  issue: (id: string) => `/invoices/${id}/issue`,
  send: (id: string) => `/invoices/${id}/send`,
  myInvoices: '/invoices/my',
};

class InvoicesService {
  async getAll(filters?: InvoiceFilters): Promise<PaginatedResponse<Invoice>> {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.page) params.append('page', String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));
      if (filters.status) params.append('status', filters.status);
      if (filters.customerId) params.append('customerId', filters.customerId);
      if (filters.search) params.append('search', filters.search);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
    }

    const queryString = params.toString();
    const url = queryString ? `${ENDPOINTS.base}?${queryString}` : ENDPOINTS.base;

    const response = await httpClient.get<PaginatedResponse<Invoice> | Invoice[]>(url);
    
    if (Array.isArray(response)) {
      return {
        data: response,
        total: response.length,
        page: filters?.page || 1,
        limit: filters?.limit || response.length,
        totalPages: 1,
      };
    }
    
    return response;
  }

  async getById(id: string): Promise<Invoice> {
    return httpClient.get<Invoice>(ENDPOINTS.byId(id));
  }

  async getByNumber(invoiceNumber: string): Promise<Invoice> {
    return httpClient.get<Invoice>(ENDPOINTS.byNumber(invoiceNumber));
  }

  async create(data: CreateInvoiceRequest): Promise<Invoice> {
    return httpClient.post<Invoice>(ENDPOINTS.base, data);
  }

  async update(id: string, data: UpdateInvoiceRequest): Promise<Invoice> {
    return httpClient.patch<Invoice>(ENDPOINTS.byId(id), data);
  }

  async delete(id: string): Promise<DeleteResponse> {
    return httpClient.delete<DeleteResponse>(ENDPOINTS.byId(id));
  }

  async issue(id: string): Promise<Invoice> {
    return httpClient.post<Invoice>(ENDPOINTS.issue(id));
  }

  async send(id: string): Promise<Invoice> {
    return httpClient.post<Invoice>(ENDPOINTS.send(id));
  }

  async cancel(id: string): Promise<Invoice> {
    return httpClient.patch<Invoice>(ENDPOINTS.byId(id), { status: 'CANCELLED' });
  }

  // Customer: Get my invoices
  async getMyInvoices(filters?: InvoiceFilters): Promise<PaginatedResponse<Invoice>> {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.page) params.append('page', String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));
      if (filters.status) params.append('status', filters.status);
    }

    const queryString = params.toString();
    const url = queryString ? `${ENDPOINTS.myInvoices}?${queryString}` : ENDPOINTS.myInvoices;

    const response = await httpClient.get<PaginatedResponse<Invoice> | Invoice[]>(url);
    
    if (Array.isArray(response)) {
      return {
        data: response,
        total: response.length,
        page: filters?.page || 1,
        limit: filters?.limit || response.length,
        totalPages: 1,
      };
    }
    
    return response;
  }

  // Download invoice as PDF
  async downloadPdf(id: string, filename?: string): Promise<void> {
    const finalFilename = filename || `invoice-${id}.pdf`;
    await httpClient.download(`${ENDPOINTS.byId(id)}/pdf`, finalFilename);
  }
}

export const invoicesService = new InvoicesService();
export default invoicesService;
