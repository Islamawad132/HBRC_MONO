import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authService } from '../services/auth.service';
import { httpClient } from '../services/httpclient';
import type { Customer, Employee } from '../types/interfaces';

// User type enum
export type UserType = 'customer' | 'employee';

// Combined user interface that can represent both customer and employee
export interface User {
  id: string;
  email: string;
  name: string;
  type: UserType;
  isAdmin?: boolean;
  permissions?: string[];
  profileImage?: string;
  // Customer specific fields
  phone?: string;
  companyName?: string;
  // Employee specific fields
  firstName?: string;
  lastName?: string;
  department?: string;
  position?: string;
  employeeId?: string;
  role?: {
    id: string;
    name: string;
    isAdmin?: boolean;
    permissions: { id: string; name: string }[];
  };
}

export interface AuthContextType {
  user: User | null;
  userType: UserType | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  // Login methods for each user type
  loginAsEmployee: (email: string, password: string) => Promise<void>;
  loginAsCustomer: (email: string, password: string) => Promise<void>;
  // Legacy login (for backward compatibility)
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  refreshUser: () => Promise<void>;
  // Utility methods
  hasPermission: (permission: string) => boolean;
  isAdmin: () => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Transform customer data to User format
   */
  const transformCustomerToUser = (customer: Customer): User => ({
    id: customer.id,
    email: customer.email,
    name: customer.name,
    type: 'customer',
    phone: customer.phone,
    companyName: customer.companyName,
    profileImage: customer.profileImage,
  });

  /**
   * Transform employee data to User format
   * Note: The API returns isAdmin at the top level, not nested in role
   */
  const transformEmployeeToUser = (employee: Employee & { isAdmin?: boolean; permissions?: string[] }): User => ({
    id: employee.id,
    email: employee.email,
    name: `${employee.firstName} ${employee.lastName}`,
    firstName: employee.firstName,
    lastName: employee.lastName,
    type: 'employee',
    // API returns isAdmin at top level (from getEmployeeProfile) or in role object (from login)
    isAdmin: employee.isAdmin ?? employee.role?.isAdmin ?? false,
    department: employee.department,
    position: employee.position,
    employeeId: employee.employeeId,
    profileImage: employee.profileImage,
    role: employee.role ? {
      id: employee.role.id,
      name: employee.role.name,
      isAdmin: employee.role.isAdmin,
      permissions: employee.role.permissions || [],
    } : undefined,
    // API returns permissions at top level (from getEmployeeProfile) or nested (from login)
    permissions: employee.permissions ?? employee.role?.permissions?.map((p) => p.name) ?? [],
  });

  /**
   * Check authentication status
   */
  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const storedUserType = localStorage.getItem('userType') as UserType | null;

      if (!token || !storedUserType) {
        setIsLoading(false);
        return;
      }

      setUserType(storedUserType);

      // Fetch profile based on user type
      if (storedUserType === 'customer') {
        const customer = await authService.getCustomerProfile();
        setUser(transformCustomerToUser(customer));
      } else if (storedUserType === 'employee') {
        const employee = await authService.getEmployeeProfile();
        setUser(transformEmployeeToUser(employee));
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear tokens if auth check fails
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userType');
      setUser(null);
      setUserType(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /**
   * Login as Employee
   */
  const loginAsEmployee = async (email: string, password: string) => {
    try {
      const response = await authService.employeeLogin({ email, password });

      // Set auth token in http client
      httpClient.setAuthToken(response.accessToken);

      // Set user type
      setUserType('employee');

      // Transform and set user
      setUser(transformEmployeeToUser(response.employee));
    } catch (error) {
      console.error('Employee login failed:', error);
      throw error;
    }
  };

  /**
   * Login as Customer
   */
  const loginAsCustomer = async (email: string, password: string) => {
    try {
      const response = await authService.customerLogin({ email, password });

      // Set auth token in http client
      httpClient.setAuthToken(response.accessToken);

      // Set user type
      setUserType('customer');

      // Transform and set user
      setUser(transformCustomerToUser(response.customer));
    } catch (error) {
      console.error('Customer login failed:', error);
      throw error;
    }
  };

  /**
   * Legacy login method (defaults to employee login for backward compatibility)
   */
  const login = async (email: string, password: string) => {
    return loginAsEmployee(email, password);
  };

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout API failed:', error);
    } finally {
      // Clear state
      setUser(null);
      setUserType(null);

      // Remove auth token from http client
      httpClient.removeAuthToken();

      // Redirect to login
      window.location.href = '/login';
    }
  };

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    // Admin users have all permissions
    if (user.isAdmin) return true;

    // Check user permissions
    return user.permissions?.includes(permission) || false;
  };

  /**
   * Check if user is admin
   */
  const isAdmin = (): boolean => {
    return user?.isAdmin || false;
  };

  /**
   * Refresh user data (e.g., after profile image update)
   */
  const refreshUser = useCallback(async () => {
    if (!userType) return;

    try {
      if (userType === 'customer') {
        const customer = await authService.getCustomerProfile();
        setUser(transformCustomerToUser(customer));
      } else if (userType === 'employee') {
        const employee = await authService.getEmployeeProfile();
        setUser(transformEmployeeToUser(employee));
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, [userType]);

  const value: AuthContextType = {
    user,
    userType,
    isAuthenticated: !!user,
    isLoading,
    loginAsEmployee,
    loginAsCustomer,
    login,
    logout,
    checkAuth,
    refreshUser,
    hasPermission,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
