import { httpClient } from './httpclient';
import type {
  Role,
  Permission,
  CreateRoleRequest,
  UpdateRoleRequest,
  DeleteResponse,
  PaginatedResponse,
} from '../types/interfaces';

const ENDPOINTS = {
  roles: '/roles',
  roleById: (id: string) => `/roles/${id}`,
  permissions: '/permissions',
  permissionById: (id: string) => `/permissions/${id}`,
};

class RolesService {
  // ============================================
  // ROLES
  // ============================================

  async getAllRoles(): Promise<Role[]> {
    return httpClient.get<Role[]>(ENDPOINTS.roles);
  }

  async getAll(): Promise<Role[]> {
    return this.getAllRoles();
  }

  async getPermissions(): Promise<Permission[]> {
    return this.getAllPermissions();
  }

  async create(data: CreateRoleRequest): Promise<Role> {
    return this.createRole(data);
  }

  async update(id: string, data: UpdateRoleRequest): Promise<Role> {
    return this.updateRole(id, data);
  }

  async getRoleById(id: string): Promise<Role> {
    return httpClient.get<Role>(ENDPOINTS.roleById(id));
  }

  async createRole(data: CreateRoleRequest): Promise<Role> {
    return httpClient.post<Role>(ENDPOINTS.roles, data);
  }

  async updateRole(id: string, data: UpdateRoleRequest): Promise<Role> {
    return httpClient.patch<Role>(ENDPOINTS.roleById(id), data);
  }

  async deleteRole(id: string): Promise<DeleteResponse> {
    return httpClient.delete<DeleteResponse>(ENDPOINTS.roleById(id));
  }

  async assignPermissions(roleId: string, permissionIds: string[]): Promise<Role> {
    return httpClient.patch<Role>(ENDPOINTS.roleById(roleId), { permissionIds });
  }

  // ============================================
  // PERMISSIONS
  // ============================================

  async getAllPermissions(): Promise<Permission[]> {
    // API returns { permissions: [...], grouped: {...} }
    const response = await httpClient.get<{ permissions: Permission[]; grouped: Record<string, Permission[]> }>(ENDPOINTS.permissions);
    return response.permissions || [];
  }

  async getPermissionById(id: string): Promise<Permission> {
    return httpClient.get<Permission>(ENDPOINTS.permissionById(id));
  }

  async getPermissionsByModule(): Promise<Record<string, Permission[]>> {
    // API returns { permissions: [...], grouped: {...} }
    const response = await httpClient.get<{ permissions: Permission[]; grouped: Record<string, Permission[]> }>(ENDPOINTS.permissions);

    // If the API already provides grouped data, use it
    if (response.grouped) {
      return response.grouped;
    }

    // Fallback: group permissions manually
    const permissions = response.permissions || [];
    return permissions.reduce(
      (acc, permission) => {
        if (!acc[permission.module]) {
          acc[permission.module] = [];
        }
        acc[permission.module].push(permission);
        return acc;
      },
      {} as Record<string, Permission[]>
    );
  }

  // Get non-admin roles only
  async getNonAdminRoles(): Promise<Role[]> {
    const roles = await this.getAllRoles();
    return roles.filter((role) => !role.isAdmin);
  }
}

export const rolesService = new RolesService();
export default rolesService;
