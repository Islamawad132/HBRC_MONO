import { httpClient } from './httpclient';
import type { AuditLog, AuditLogFilters, PaginatedResponse } from '../types/interfaces';

const ENDPOINTS = {
  base: '/audit',
  byId: (id: string) => `/audit/${id}`,
  export: '/audit/export',
};

class AuditService {
  async getAll(filters?: AuditLogFilters): Promise<PaginatedResponse<AuditLog>> {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.page) params.append('page', String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.userType) params.append('userType', filters.userType);
      if (filters.action) params.append('action', filters.action);
      if (filters.entity) params.append('entity', filters.entity);
      if (filters.entityId) params.append('entityId', filters.entityId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
    }

    const queryString = params.toString();
    const url = queryString ? `${ENDPOINTS.base}?${queryString}` : ENDPOINTS.base;

    return httpClient.get<PaginatedResponse<AuditLog>>(url);
  }

  async getById(id: string): Promise<AuditLog> {
    return httpClient.get<AuditLog>(ENDPOINTS.byId(id));
  }

  async getByEntity(entity: string, entityId: string): Promise<AuditLog[]> {
    const response = await this.getAll({ entity, entityId, limit: 100 });
    return response.data;
  }

  async getByUser(userId: string, userType: string): Promise<AuditLog[]> {
    const response = await this.getAll({ userId, userType, limit: 100 });
    return response.data;
  }

  async export(filters?: AuditLogFilters, filename?: string): Promise<void> {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.userType) params.append('userType', filters.userType);
      if (filters.action) params.append('action', filters.action);
      if (filters.entity) params.append('entity', filters.entity);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
    }

    const queryString = params.toString();
    const url = queryString ? `${ENDPOINTS.export}?${queryString}` : ENDPOINTS.export;
    const finalFilename = filename || `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;

    await httpClient.download(url, finalFilename);
  }
}

export const auditService = new AuditService();
export default auditService;
