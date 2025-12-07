import { httpClient } from './httpclient';
import type {
  Employee,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  EmployeeFilters,
  PaginatedResponse,
  DeleteResponse,
} from '../types/interfaces';

const ENDPOINTS = {
  base: '/employees',
  byId: (id: string) => `/employees/${id}`,
};

class EmployeesService {
  async getAll(filters?: EmployeeFilters): Promise<PaginatedResponse<Employee>> {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.page) params.append('page', String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));
      if (filters.status) params.append('status', filters.status);
      if (filters.department) params.append('department', filters.department);
      if (filters.roleId) params.append('roleId', filters.roleId);
      if (filters.search) params.append('search', filters.search);
    }

    const queryString = params.toString();
    const url = queryString ? `${ENDPOINTS.base}?${queryString}` : ENDPOINTS.base;

    const response = await httpClient.get<PaginatedResponse<Employee> | Employee[]>(url);
    
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

  async getById(id: string): Promise<Employee> {
    return httpClient.get<Employee>(ENDPOINTS.byId(id));
  }

  async create(data: CreateEmployeeRequest): Promise<Employee> {
    return httpClient.post<Employee>(ENDPOINTS.base, data);
  }

  async update(id: string, data: UpdateEmployeeRequest): Promise<Employee> {
    return httpClient.patch<Employee>(ENDPOINTS.byId(id), data);
  }

  async delete(id: string): Promise<DeleteResponse> {
    return httpClient.delete<DeleteResponse>(ENDPOINTS.byId(id));
  }

  async activate(id: string): Promise<Employee> {
    return httpClient.patch<Employee>(ENDPOINTS.byId(id), { status: 'ACTIVE' });
  }

  async suspend(id: string): Promise<Employee> {
    return httpClient.patch<Employee>(ENDPOINTS.byId(id), { status: 'SUSPENDED' });
  }
}

export const employeesService = new EmployeesService();
export default employeesService;
