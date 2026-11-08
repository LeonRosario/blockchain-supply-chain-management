import apiClient from './apiClient';
import type { AuthUser, LoginCredentials, RegisterCredentials, ApiResponse } from '@/types';

const authService = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<AuthUser>> => {
    const response = await apiClient.post<ApiResponse<AuthUser>>('/auth/login', credentials);
    return response.data;
  },

  register: async (payload: RegisterCredentials): Promise<ApiResponse<AuthUser>> => {
    const response = await apiClient.post<ApiResponse<AuthUser>>('/auth/register', payload);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
    localStorage.removeItem('token');
  },

  getProfile: async (): Promise<ApiResponse<AuthUser>> => {
    const response = await apiClient.get<ApiResponse<AuthUser>>('/auth/profile');
    return response.data;
  },

  refreshToken: async (): Promise<ApiResponse<{ token: string }>> => {
    const response = await apiClient.post<ApiResponse<{ token: string }>>('/auth/refresh');
    return response.data;
  },
};

export default authService;
