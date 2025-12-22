// services/api.ts
import axios, { AxiosInstance, AxiosError } from 'axios';
import { getAuthData, setItem, removeItem } from '@/utils/storage';
import { router } from 'expo-router';

const API_BASE_URL = 'http://10.151.213.235:5000/api';

class ApiService {
  private api: AxiosInstance;
  private isRefreshing = false;
  private failedRequests: any[] = [];

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      async (config) => {
        const { accessToken } = await getAuthData();
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedRequests.push({ resolve, reject });
            }).then(() => this.api(originalRequest));
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const { refreshToken } = await getAuthData();
            
            if (!refreshToken) {
              throw new Error('No refresh token');
            }

            const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
              refreshToken,
            });

            if (response.data.success) {
              const { accessToken } = response.data.data;
              await setItem('accessToken', accessToken);
              
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              
              // Process failed requests
              this.failedRequests.forEach((request) => request.resolve());
              this.failedRequests = [];
              
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Clear storage and redirect to login
            await Promise.all([
              removeItem('accessToken'),
              removeItem('refreshToken'),
              removeItem('userData'),
            ]);
            
            // Redirect to login
            if (router.canGoBack()) {
              router.replace('/(auth)/login');
            }
            
            this.failedRequests.forEach((request) => request.reject(refreshError));
            this.failedRequests = [];
            
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  public async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.api.get<T>(url, { params });
    return response.data;
  }

  public async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.api.post<T>(url, data);
    return response.data;
  }

  public async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.api.put<T>(url, data);
    return response.data;
  }

  public async patch<T>(url: string, data?: any): Promise<T> {
    const response = await this.api.patch<T>(url, data);
    return response.data;
  }

  public async delete<T>(url: string): Promise<T> {
    const response = await this.api.delete<T>(url);
    return response.data;
  }
}

export const api = new ApiService();