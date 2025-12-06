import axios, { AxiosError } from 'axios';
import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

// Types DD@ API responses
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  statusCode?: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
  errors?: Record<string, string[]>;
}

// HTTP Client Class
class HttpClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    // %F4'! axios instance E9 'D@ base config
    this.axiosInstance = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Setup interceptors
    this.setupInterceptors();
  }

  /**
   * Setup request & response interceptors
   */
  private setupInterceptors(): void {
    // Request Interceptor - D%6'A) 'D@ token *DB'&J'K
    this.axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // ,D( 'D@ token EF localStorage
        const token = localStorage.getItem('accessToken');

        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // Response Interceptor - DD*9'ED E9 'D@ errors H'D@ token refresh
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        // %0' C'F 'D@ token expired (401) HEAJ4 retry B(D C/G
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // E-'HD) refresh 'D@ token
            const refreshToken = localStorage.getItem('refreshToken');

            if (refreshToken) {
              const response = await axios.post(
                `${this.axiosInstance.defaults.baseURL}/auth/refresh`,
                { refreshToken }
              );

              const { accessToken } = response.data;

              // -A8 'D@ token 'D,/J/
              localStorage.setItem('accessToken', accessToken);

              // %9'/) 'DE-'HD) ('D@ token 'D,/J/
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              }

              return this.axiosInstance(originalRequest);
            }
          } catch (refreshError) {
            // A4D 'D@ refresh - *3,JD 'D.1H,
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');

            // Redirect to login
            window.location.href = '/login';

            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * GET request
   */
  async get<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.axiosInstance.get<T>(url, config);
    return response.data;
  }

  /**
   * POST request
   */
  async post<T = any, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.axiosInstance.post<T>(url, data, config);
    return response.data;
  }

  /**
   * PUT request
   */
  async put<T = any, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.axiosInstance.put<T>(url, data, config);
    return response.data;
  }

  /**
   * PATCH request
   */
  async patch<T = any, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.axiosInstance.patch<T>(url, data, config);
    return response.data;
  }

  /**
   * DELETE request
   */
  async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.axiosInstance.delete<T>(url, config);
    return response.data;
  }

  /**
   * Request E9 custom config C'ED
   */
  async request<T = any>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.request<T>(config);
    return response.data;
  }

  /**
   * Upload files - DD@ FormData
   */
  async upload<T = any>(
    url: string,
    formData: FormData,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<T> {
    const response = await this.axiosInstance.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data;
  }

  /**
   * Download files
   */
  async download(
    url: string,
    filename: string,
    config?: AxiosRequestConfig
  ): Promise<void> {
    const response = await this.axiosInstance.get(url, {
      ...config,
      responseType: 'blob',
    });

    // %F4'! link DD*-EJD
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  /**
   * 'D-5HD 9DI 'D@ axios instance E('41) (DD-'D'* 'DE*B/E))
   */
  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }

  /**
   * Set authorization token manually
   */
  setAuthToken(token: string): void {
    this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Remove authorization token
   */
  removeAuthToken(): void {
    delete this.axiosInstance.defaults.headers.common['Authorization'];
  }
}

// *5/J1 instance H'-/ AB7 (Singleton pattern)
export const httpClient = new HttpClient();

// *5/J1 'D@ class FA3G' DD-'D'* 'D.'5)
export default HttpClient;
