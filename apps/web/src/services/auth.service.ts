import { httpClient } from './httpclient';
import type {
  LoginRequest,
  CustomerLoginResponse,
  EmployeeLoginResponse,
  CustomerRegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
  ChangePasswordRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
  Customer,
  Employee,
  ApiResponse,
} from '../types/interfaces';

const AUTH_ENDPOINTS = {
  // Customer Auth
  customerLogin: '/auth/customer/login',
  customerRegister: '/auth/customer/register',
  customerProfile: '/auth/customer/profile',

  // Employee Auth
  employeeLogin: '/auth/employee/login',
  employeeProfile: '/auth/employee/profile',

  // Common Auth
  forgotPassword: '/auth/forgot-password',
  resetPassword: '/auth/reset-password',
  verifyEmail: '/auth/verify-email',
  resendVerification: '/auth/resend-verification',
  changePassword: '/auth/change-password',
  refresh: '/auth/refresh',
  logout: '/auth/logout',

  // Profile Image
  profileImage: '/auth/profile/image',
};

class AuthService {
  // ============================================
  // Customer Authentication
  // ============================================

  async customerLogin(data: LoginRequest): Promise<CustomerLoginResponse> {
    const response = await httpClient.post<CustomerLoginResponse>(
      AUTH_ENDPOINTS.customerLogin,
      data
    );

    // Store tokens
    if (response.accessToken) {
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('userType', 'customer');
    }

    return response;
  }

  async customerRegister(data: CustomerRegisterRequest): Promise<ApiResponse<Customer>> {
    return httpClient.post<ApiResponse<Customer>>(
      AUTH_ENDPOINTS.customerRegister,
      data
    );
  }

  async getCustomerProfile(): Promise<Customer> {
    return httpClient.get<Customer>(AUTH_ENDPOINTS.customerProfile);
  }

  // ============================================
  // Employee Authentication
  // ============================================

  async employeeLogin(data: LoginRequest): Promise<EmployeeLoginResponse> {
    const response = await httpClient.post<EmployeeLoginResponse>(
      AUTH_ENDPOINTS.employeeLogin,
      data
    );

    // Store tokens
    if (response.accessToken) {
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('userType', 'employee');
    }

    return response;
  }

  async getEmployeeProfile(): Promise<Employee> {
    return httpClient.get<Employee>(AUTH_ENDPOINTS.employeeProfile);
  }

  // ============================================
  // Common Authentication
  // ============================================

  async forgotPassword(data: ForgotPasswordRequest): Promise<ApiResponse<void>> {
    return httpClient.post<ApiResponse<void>>(
      AUTH_ENDPOINTS.forgotPassword,
      data
    );
  }

  async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse<void>> {
    return httpClient.post<ApiResponse<void>>(
      AUTH_ENDPOINTS.resetPassword,
      data
    );
  }

  async verifyEmail(data: VerifyEmailRequest): Promise<ApiResponse<void>> {
    return httpClient.post<ApiResponse<void>>(
      AUTH_ENDPOINTS.verifyEmail,
      data
    );
  }

  async resendVerification(email: string, userType: 'customer' | 'employee'): Promise<ApiResponse<void>> {
    return httpClient.post<ApiResponse<void>>(
      AUTH_ENDPOINTS.resendVerification,
      { email, userType }
    );
  }

  async changePassword(data: ChangePasswordRequest): Promise<ApiResponse<void>> {
    return httpClient.post<ApiResponse<void>>(
      AUTH_ENDPOINTS.changePassword,
      data
    );
  }

  async refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const response = await httpClient.post<RefreshTokenResponse>(
      AUTH_ENDPOINTS.refresh,
      data
    );

    if (response.accessToken) {
      localStorage.setItem('accessToken', response.accessToken);
    }

    return response;
  }

  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('refreshToken');

    try {
      if (refreshToken) {
        await httpClient.post(AUTH_ENDPOINTS.logout, { refreshToken });
      }
    } finally {
      // Clear local storage regardless of API response
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userType');
    }
  }

  // ============================================
  // Helper Methods
  // ============================================

  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  }

  getUserType(): 'customer' | 'employee' | null {
    return localStorage.getItem('userType') as 'customer' | 'employee' | null;
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  // ============================================
  // Profile Image
  // ============================================

  async uploadProfileImage(file: File, onProgress?: (progress: number) => void): Promise<{ profileImage: string; message: string }> {
    const formData = new FormData();
    formData.append('file', file);

    return httpClient.upload<{ profileImage: string; message: string }>(
      AUTH_ENDPOINTS.profileImage,
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

  async removeProfileImage(): Promise<{ message: string }> {
    return httpClient.delete<{ message: string }>(AUTH_ENDPOINTS.profileImage);
  }
}

export const authService = new AuthService();
export default authService;
