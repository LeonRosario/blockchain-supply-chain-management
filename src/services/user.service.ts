import apiClient from './apiClient';
import type {
  ApiResponse,
  ServiceResponse,
  UpdateUserPayload,
  UserFilters,
  UserRecord,
} from '@/types';
import { getDemoDatabase, persistDemoDatabase } from '@/data/demoStore';
import {
  apiMessage,
  parseCollection,
  parseEntity,
  shouldUseDemoFallback,
} from './serviceHelpers';

function assertSuccess(payload: unknown): void {
  if (
    payload &&
    typeof payload === 'object' &&
    'success' in payload &&
    (payload as { success?: boolean }).success === false
  ) {
    throw new Error(apiMessage(payload, 'The user request was rejected.'));
  }
}

function filterDemoUsers(filters: UserFilters): UserRecord[] {
  return getDemoDatabase().users.filter((user) => {
    if (filters.role && filters.role !== 'all' && user.role !== filters.role) return false;
    if (filters.status && filters.status !== 'all' && user.status !== filters.status) {
      return false;
    }
    if (filters.search) {
      const query = filters.search.toLowerCase();
      const haystack = [user.name, user.email, user.role, user.department]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

const userService = {
  getAll: async (filters: UserFilters = {}): Promise<ServiceResponse<UserRecord[]>> => {
    try {
      const response = await apiClient.get('/users', {
        params: {
          search: filters.search,
          role: filters.role !== 'all' ? filters.role : undefined,
          status: filters.status !== 'all' ? filters.status : undefined,
        },
      });
      assertSuccess(response.data);
      const parsed = parseCollection<UserRecord>(response.data);
      if (!parsed) throw new Error('Unexpected user response from the server.');
      return {
        data: parsed.items,
        success: true,
        message: apiMessage(response.data, 'Users loaded.'),
        source: 'api',
      };
    } catch (error) {
      if (!shouldUseDemoFallback(error)) throw error;
      return {
        data: filterDemoUsers(filters),
        success: true,
        message: 'Showing sample user records — backend unavailable.',
        source: 'demo',
      };
    }
  },

  getById: async (id: string): Promise<ServiceResponse<UserRecord>> => {
    try {
      const response = await apiClient.get<ApiResponse<UserRecord>>(`/users/${id}`);
      assertSuccess(response.data);
      const user = parseEntity<UserRecord>(response.data);
      if (!user) throw new Error('User not found.');
      return {
        data: user,
        success: true,
        message: apiMessage(response.data, 'User loaded.'),
        source: 'api',
      };
    } catch (error) {
      if (!shouldUseDemoFallback(error)) throw error;
      const user = getDemoDatabase().users.find((item) => item.id === id);
      if (!user) throw new Error('User not found.');
      return {
        data: user,
        success: true,
        message: 'Showing a sample user record — backend unavailable.',
        source: 'demo',
      };
    }
  },

  update: async (
    id: string,
    payload: UpdateUserPayload
  ): Promise<ServiceResponse<UserRecord>> => {
    try {
      const response = await apiClient.put<ApiResponse<UserRecord>>(`/users/${id}`, payload);
      assertSuccess(response.data);
      const user = parseEntity<UserRecord>(response.data);
      if (!user) throw new Error('Unexpected user response from the server.');
      return {
        data: user,
        success: true,
        message: apiMessage(response.data, 'User updated.'),
        source: 'api',
      };
    } catch (error) {
      if (!shouldUseDemoFallback(error)) throw error;
      const database = getDemoDatabase();
      const index = database.users.findIndex((user) => user.id === id);
      if (index < 0) throw new Error('User not found in the local demo database.');
      const current = database.users[index];
      const updated: UserRecord = {
        ...current,
        name: payload.name ?? current.name,
        email: payload.email ?? current.email,
        role: payload.role ?? current.role,
        status: payload.status ?? current.status,
        phone: payload.phone ?? current.phone,
        department: payload.department ?? current.department,
        updatedAt: new Date().toISOString(),
      };
      database.users[index] = updated;
      persistDemoDatabase(database);
      return {
        data: updated,
        success: true,
        message: 'User updated in the local demo database.',
        source: 'demo',
      };
    }
  },

  updateProfile: async (payload: {
    name?: string;
    email?: string;
    phone?: string;
    department?: string;
    /** Current email, used only to locate the local demo record. */
    currentEmail?: string;
  }): Promise<ServiceResponse<Partial<UserRecord>>> => {
    const { currentEmail, ...apiPayload } = payload;
    try {
      const response = await apiClient.patch<ApiResponse<UserRecord>>(
        '/users/profile',
        apiPayload
      );
      assertSuccess(response.data);
      const user = parseEntity<UserRecord>(response.data);
      if (!user) throw new Error('Unexpected profile response from the server.');
      return {
        data: user,
        success: true,
        message: apiMessage(response.data, 'Profile updated.'),
        source: 'api',
      };
    } catch (error) {
      if (!shouldUseDemoFallback(error)) throw error;
      const database = getDemoDatabase();
      const lookupEmail = currentEmail ?? payload.email;
      const index = database.users.findIndex(
        (user) => user.email.toLowerCase() === lookupEmail?.toLowerCase()
      );
      if (index >= 0) {
        database.users[index] = {
          ...database.users[index],
          name: payload.name ?? database.users[index].name,
          email: payload.email ?? database.users[index].email,
          phone: payload.phone ?? database.users[index].phone,
          department: payload.department ?? database.users[index].department,
          updatedAt: new Date().toISOString(),
        };
        persistDemoDatabase(database);
      }
      return {
        data: apiPayload,
        success: true,
        message:
          'Profile changes were saved to local demo preferences only. The backend was not updated.',
        source: 'demo',
      };
    }
  },

  changePassword: async (
    currentPassword: string,
    newPassword: string
  ): Promise<ServiceResponse<{ applied: boolean }>> => {
    try {
      const response = await apiClient.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      assertSuccess(response.data);
      return {
        data: { applied: true },
        success: true,
        message: apiMessage(response.data, 'Password changed.'),
        source: 'api',
      };
    } catch (error) {
      if (!shouldUseDemoFallback(error)) throw error;
      return {
        data: { applied: false },
        success: true,
        message:
          'Demo mode: no backend is connected, so the password was NOT changed.',
        source: 'demo',
      };
    }
  },
};

export default userService;