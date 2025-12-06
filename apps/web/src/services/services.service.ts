import { httpClient } from './httpclient';
import type {
  Service,
  CreateServiceRequest,
  UpdateServiceRequest,
  ServiceFilters,
  PaginatedResponse,
  DeleteResponse,
} from '../types/interfaces';

const ENDPOINTS = {
  base: '/services',
  byId: (id: string) => `/services/${id}`,
  byCode: (code: string) => `/services/code/${code}`,
};

class ServicesService {
  async getAll(filters?: ServiceFilters): Promise<PaginatedResponse<Service>> {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.page) params.append('page', String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));
      if (filters.status) params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      if (filters.isActive !== undefined) params.append('isActive', String(filters.isActive));
      if (filters.search) params.append('search', filters.search);
    }

    const queryString = params.toString();
    const url = queryString ? `${ENDPOINTS.base}?${queryString}` : ENDPOINTS.base;

    return httpClient.get<PaginatedResponse<Service>>(url);
  }

  async getById(id: string): Promise<Service> {
    return httpClient.get<Service>(ENDPOINTS.byId(id));
  }

  async getByCode(code: string): Promise<Service> {
    return httpClient.get<Service>(ENDPOINTS.byCode(code));
  }

  async create(data: CreateServiceRequest): Promise<Service> {
    return httpClient.post<Service>(ENDPOINTS.base, data);
  }

  async update(id: string, data: UpdateServiceRequest): Promise<Service> {
    return httpClient.patch<Service>(ENDPOINTS.byId(id), data);
  }

  async delete(id: string): Promise<DeleteResponse> {
    return httpClient.delete<DeleteResponse>(ENDPOINTS.byId(id));
  }

  async activate(id: string): Promise<Service> {
    return httpClient.patch<Service>(ENDPOINTS.byId(id), { isActive: true, status: 'ACTIVE' });
  }

  async deactivate(id: string): Promise<Service> {
    return httpClient.patch<Service>(ENDPOINTS.byId(id), { isActive: false, status: 'INACTIVE' });
  }

  // Get active services only (for customer portal)
  async getActiveServices(): Promise<Service[]> {
    const response = await this.getAll({ isActive: true, limit: 100 });
    return response.data;
  }
}

export const servicesService = new ServicesService();
export default servicesService;
