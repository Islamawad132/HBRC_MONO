import { httpClient } from './httpclient';
import type {
  Payment,
  CreatePaymentRequest,
  UpdatePaymentRequest,
  PaymentFilters,
  PaginatedResponse,
  DeleteResponse,
} from '../types/interfaces';

const ENDPOINTS = {
  base: '/payments',
  byId: (id: string) => `/payments/${id}`,
  byNumber: (number: string) => `/payments/number/${number}`,
  refund: (id: string) => `/payments/${id}/refund`,
  myPayments: '/payments/my',
};

class PaymentsService {
  async getAll(filters?: PaymentFilters): Promise<PaginatedResponse<Payment>> {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.page) params.append('page', String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));
      if (filters.status) params.append('status', filters.status);
      if (filters.method) params.append('method', filters.method);
      if (filters.customerId) params.append('customerId', filters.customerId);
      if (filters.invoiceId) params.append('invoiceId', filters.invoiceId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
    }

    const queryString = params.toString();
    const url = queryString ? `${ENDPOINTS.base}?${queryString}` : ENDPOINTS.base;

    return httpClient.get<PaginatedResponse<Payment>>(url);
  }

  async getById(id: string): Promise<Payment> {
    return httpClient.get<Payment>(ENDPOINTS.byId(id));
  }

  async getByNumber(paymentNumber: string): Promise<Payment> {
    return httpClient.get<Payment>(ENDPOINTS.byNumber(paymentNumber));
  }

  async create(data: CreatePaymentRequest): Promise<Payment> {
    return httpClient.post<Payment>(ENDPOINTS.base, data);
  }

  async update(id: string, data: UpdatePaymentRequest): Promise<Payment> {
    return httpClient.patch<Payment>(ENDPOINTS.byId(id), data);
  }

  async delete(id: string): Promise<DeleteResponse> {
    return httpClient.delete<DeleteResponse>(ENDPOINTS.byId(id));
  }

  async markAsPaid(id: string): Promise<Payment> {
    return httpClient.patch<Payment>(ENDPOINTS.byId(id), { status: 'PAID' });
  }

  async markAsFailed(id: string, reason: string, reasonAr: string): Promise<Payment> {
    return httpClient.patch<Payment>(ENDPOINTS.byId(id), {
      status: 'FAILED',
      failureReason: reason,
      failureReasonAr: reasonAr,
    });
  }

  async refund(id: string): Promise<Payment> {
    return httpClient.post<Payment>(ENDPOINTS.refund(id));
  }

  // Customer: Get my payments
  async getMyPayments(filters?: PaymentFilters): Promise<PaginatedResponse<Payment>> {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.page) params.append('page', String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));
      if (filters.status) params.append('status', filters.status);
    }

    const queryString = params.toString();
    const url = queryString ? `${ENDPOINTS.myPayments}?${queryString}` : ENDPOINTS.myPayments;

    return httpClient.get<PaginatedResponse<Payment>>(url);
  }

  // Download receipt
  async downloadReceipt(id: string, filename?: string): Promise<void> {
    const finalFilename = filename || `receipt-${id}.pdf`;
    await httpClient.download(`${ENDPOINTS.byId(id)}/receipt`, finalFilename);
  }
}

export const paymentsService = new PaymentsService();
export default paymentsService;
