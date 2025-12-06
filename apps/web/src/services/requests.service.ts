import { httpClient } from './httpclient';
import type {
  ServiceRequest,
  CreateServiceRequestRequest,
  UpdateServiceRequestRequest,
  UpdateRequestStatusRequest,
  AssignEmployeeRequest,
  ServiceRequestFilters,
  PaginatedResponse,
  DeleteResponse,
} from '../types/interfaces';

const ENDPOINTS = {
  base: '/requests',
  byId: (id: string) => `/requests/${id}`,
  byNumber: (number: string) => `/requests/number/${number}`,
  status: (id: string) => `/requests/${id}/status`,
  assign: (id: string) => `/requests/${id}/assign`,
  myRequests: '/requests/my',
  assigned: '/requests/assigned',
};

class RequestsService {
  async getAll(filters?: ServiceRequestFilters): Promise<PaginatedResponse<ServiceRequest>> {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.page) params.append('page', String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.customerId) params.append('customerId', filters.customerId);
      if (filters.serviceId) params.append('serviceId', filters.serviceId);
      if (filters.assignedToId) params.append('assignedToId', filters.assignedToId);
      if (filters.category) params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
    }

    const queryString = params.toString();
    const url = queryString ? `${ENDPOINTS.base}?${queryString}` : ENDPOINTS.base;

    return httpClient.get<PaginatedResponse<ServiceRequest>>(url);
  }

  async getById(id: string): Promise<ServiceRequest> {
    return httpClient.get<ServiceRequest>(ENDPOINTS.byId(id));
  }

  async getByNumber(requestNumber: string): Promise<ServiceRequest> {
    return httpClient.get<ServiceRequest>(ENDPOINTS.byNumber(requestNumber));
  }

  async create(data: CreateServiceRequestRequest): Promise<ServiceRequest> {
    return httpClient.post<ServiceRequest>(ENDPOINTS.base, data);
  }

  async update(id: string, data: UpdateServiceRequestRequest): Promise<ServiceRequest> {
    return httpClient.patch<ServiceRequest>(ENDPOINTS.byId(id), data);
  }

  async delete(id: string): Promise<DeleteResponse> {
    return httpClient.delete<DeleteResponse>(ENDPOINTS.byId(id));
  }

  async updateStatus(id: string, data: UpdateRequestStatusRequest): Promise<ServiceRequest> {
    return httpClient.patch<ServiceRequest>(ENDPOINTS.status(id), data);
  }

  async assignEmployee(id: string, data: AssignEmployeeRequest): Promise<ServiceRequest> {
    return httpClient.patch<ServiceRequest>(ENDPOINTS.assign(id), data);
  }

  async unassign(id: string): Promise<ServiceRequest> {
    return httpClient.patch<ServiceRequest>(ENDPOINTS.assign(id), { employeeId: null });
  }

  // Customer: Get my requests
  async getMyRequests(filters?: ServiceRequestFilters): Promise<PaginatedResponse<ServiceRequest>> {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.page) params.append('page', String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));
      if (filters.status) params.append('status', filters.status);
    }

    const queryString = params.toString();
    const url = queryString ? `${ENDPOINTS.myRequests}?${queryString}` : ENDPOINTS.myRequests;

    return httpClient.get<PaginatedResponse<ServiceRequest>>(url);
  }

  // Employee: Get assigned requests
  async getAssignedRequests(filters?: ServiceRequestFilters): Promise<PaginatedResponse<ServiceRequest>> {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.page) params.append('page', String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
    }

    const queryString = params.toString();
    const url = queryString ? `${ENDPOINTS.assigned}?${queryString}` : ENDPOINTS.assigned;

    return httpClient.get<PaginatedResponse<ServiceRequest>>(url);
  }

  // Quick status updates
  async submit(id: string): Promise<ServiceRequest> {
    return this.updateStatus(id, { status: 'SUBMITTED' });
  }

  async approve(id: string): Promise<ServiceRequest> {
    return this.updateStatus(id, { status: 'APPROVED' });
  }

  async reject(id: string, reason: string, reasonAr: string): Promise<ServiceRequest> {
    return this.updateStatus(id, {
      status: 'REJECTED',
      rejectionReason: reason,
      rejectionReasonAr: reasonAr,
    });
  }

  async startProgress(id: string): Promise<ServiceRequest> {
    return this.updateStatus(id, { status: 'IN_PROGRESS' });
  }

  async complete(id: string): Promise<ServiceRequest> {
    return this.updateStatus(id, { status: 'COMPLETED' });
  }

  async deliver(id: string): Promise<ServiceRequest> {
    return this.updateStatus(id, { status: 'DELIVERED' });
  }

  async cancel(id: string, reason: string, reasonAr: string): Promise<ServiceRequest> {
    return this.updateStatus(id, {
      status: 'CANCELLED',
      cancellationReason: reason,
      cancellationReasonAr: reasonAr,
    });
  }
}

export const requestsService = new RequestsService();
export default requestsService;
