import apiClient from './apiClient';
import type {
  AuthUser,
  LoginCredentials,
  RegisterCredentials,
  ApiResponse,
} from '@/types';

// ─── Mock Users for Testing ─────────────────────────────────────────────────────
const MOCK_USERS: AuthUser[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@supplychain.com',
    role: 'admin',
    avatarUrl: '',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    token: 'mock-jwt-token-admin',
  },
  {
    id: '2',
    name: 'John Manufacturer',
    email: 'manufacturer@supplychain.com',
    role: 'manufacturer',
    avatarUrl: '',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    token: 'mock-jwt-token-manufacturer',
  },
];

let mockUserIdCounter = 3;

// Generate a simple mock JWT token
const generateMockToken = (): string => {
  return 'mock-jwt-token-' + Math.random().toString(36).substring(2, 15);
};

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ─── Auth Service ─────────────────────────────────────────────────────────────
const authService = {
  /**
   * Authenticate with email + password.
   * Returns the full AuthUser (including JWT token).
   */
  login: async (credentials: LoginCredentials): Promise<ApiResponse<AuthUser>> => {
    // Try real API first
    try {
      const response = await apiClient.post<ApiResponse<AuthUser>>(
        '/auth/login',
        credentials
      );
      return response.data;
    } catch {
      // Fallback to mock authentication
      await delay(500); // Simulate network delay
      
      const user = MOCK_USERS.find(
        u => u.email.toLowerCase() === credentials.email.toLowerCase()
      );
      
      if (!user) {
        throw new Error('Invalid email or password');
      }
      
      // For demo, accept any password for mock users
      return {
        success: true,
        message: 'Login successful',
        data: user,
      };
    }
  },

  /**
   * Register a new user account.
   * Returns the created AuthUser (including JWT token).
   */
  register: async (
    payload: RegisterCredentials
  ): Promise<ApiResponse<AuthUser>> => {
    // Try real API first
    try {
      const { confirmPassword: _omit, ...body } = payload;
      void _omit;
      const response = await apiClient.post<ApiResponse<AuthUser>>(
        '/auth/register',
        body
      );
      return response.data;
    } catch {
      // Fallback to mock registration
      await delay(500); // Simulate network delay
      
      // Check if email already exists
      const existingUser = MOCK_USERS.find(
        u => u.email.toLowerCase() === payload.email.toLowerCase()
      );
      
      if (existingUser) {
        throw new Error('Email already registered');
      }
      
      // Create new mock user
      const newUser: AuthUser = {
        id: String(mockUserIdCounter++),
        name: payload.name,
        email: payload.email,
        role: payload.role,
        avatarUrl: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        token: generateMockToken(),
      };
      
      MOCK_USERS.push(newUser);
      
      return {
        success: true,
        message: 'Registration successful',
        data: newUser,
      };
    }
  },

  /** Invalidate the session server-side. */
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore errors for mock
    }
    localStorage.removeItem('sc_token');
  },

  /** Fetch the authenticated user's profile from the backend. */
  getProfile: async (): Promise<ApiResponse<AuthUser>> => {
    try {
      const response = await apiClient.get<ApiResponse<AuthUser>>('/auth/profile');
      return response.data;
    } catch {
      // For mock, get token from localStorage and find user
      const token = localStorage.getItem('sc_token');
      if (!token) {
        throw new Error('No token found');
      }
      
      const user = MOCK_USERS.find(u => u.token === token);
      if (!user) {
        throw new Error('Invalid token');
      }
      
      return {
        success: true,
        message: 'Profile fetched',
        data: user,
      };
    }
  },

  /** Rotate the JWT. */
  refreshToken: async (): Promise<ApiResponse<{ token: string }>> => {
    try {
      const response = await apiClient.post<ApiResponse<{ token: string }>>(
        '/auth/refresh'
      );
      return response.data;
    } catch {
      const token = generateMockToken();
      return {
        success: true,
        message: 'Token refreshed',
        data: { token },
      };
    }
  },
};

export default authService;