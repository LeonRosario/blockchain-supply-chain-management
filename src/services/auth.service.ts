import apiClient from './apiClient';
import type {
  AuthUser,
  LoginCredentials,
  RegisterCredentials,
  ApiResponse,
} from '@/types';

// ─── Auth Service ─────────────────────────────────────────────────────────────
// All functions are placeholders. Replace the endpoint calls once the backend
// is ready. The function signatures and return types are final.

const authService = {
  /**
   * Authenticate with email + password.
   * Returns the full AuthUser (including JWT token).
   */
  login: async (credentials: LoginCredentials): Promise<ApiResponse<AuthUser>> => {
    const response = await apiClient.post<ApiResponse<AuthUser>>(
      '/auth/login',
      credentials
    );
    return response.data;
  },

  /**
   * Register a new user account.
   * Returns the created AuthUser (including JWT token).
   */
  register: async (
    payload: RegisterCredentials
  ): Promise<ApiResponse<AuthUser>> => {
    // Strip confirmPassword before sending to backend
    const { confirmPassword: _omit, ...body } = payload;
    void _omit;
    const response = await apiClient.post<ApiResponse<AuthUser>>(
      '/auth/register',
      body
    );
    return response.data;
  },

  /** Invalidate the session server-side. */
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
    localStorage.removeItem('sc_token');
  },

  /** Fetch the authenticated user's profile from the backend. */
  getProfile: async (): Promise<ApiResponse<AuthUser>> => {
    const response = await apiClient.get<ApiResponse<AuthUser>>('/auth/profile');
    return response.data;
  },

  /** Rotate the JWT. */
  refreshToken: async (): Promise<ApiResponse<{ token: string }>> => {
    const response = await apiClient.post<ApiResponse<{ token: string }>>(
      '/auth/refresh'
    );
    return response.data;
  },
};

export default authService;
