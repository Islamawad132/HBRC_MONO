import { httpClient } from './httpclient';
import type {
  Customer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerFilters,
  PaginatedResponse,
  DeleteResponse,
} from '../types/interfaces';

const ENDPOINTS = {
  base: '/customers',
  byId: (id: string) => `/customers/${id}`,
};

class CustomersService {
  async getAll(filters?: CustomerFilters): Promise<PaginatedResponse<Customer>> {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.page) params.append('page', String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));
      if (filters.status) params.append('status', filters.status);
      if (filters.customerType) params.append('customerType', filters.customerType);
      if (filters.isVerified !== undefined) params.append('isVerified', String(filters.isVerified));
      if (filters.search) params.append('search', filters.search);
    }

    const queryString = params.toString();
    const url = queryString ? `${ENDPOINTS.base}?${queryString}` : ENDPOINTS.base;

    const response = await httpClient.get<PaginatedResponse<Customer> | Customer[]>(url);
    
    // Handle both array and paginated response from API
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

  async getById(id: string): Promise<Customer> {
    return httpClient.get<Customer>(ENDPOINTS.byId(id));
  }

  async create(data: CreateCustomerRequest): Promise<Customer> {
    return httpClient.post<Customer>(ENDPOINTS.base, data);
  }

  async update(id: string, data: UpdateCustomerRequest): Promise<Customer> {
    return httpClient.patch<Customer>(ENDPOINTS.byId(id), data);
  }

  async delete(id: string): Promise<DeleteResponse> {
    return httpClient.delete<DeleteResponse>(ENDPOINTS.byId(id));
  }

  async activate(id: string): Promise<Customer> {
    return httpClient.patch<Customer>(ENDPOINTS.byId(id), { status: 'ACTIVE' });
  }

  async suspend(id: string): Promise<Customer> {
    return httpClient.patch<Customer>(ENDPOINTS.byId(id), { status: 'SUSPENDED' });
  }
}

export const customersService = new CustomersService();
export default customersService;
