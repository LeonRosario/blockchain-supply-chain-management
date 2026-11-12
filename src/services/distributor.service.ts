import apiClient from './apiClient';
import type {
  ApiResponse,
  CreateDistributorPayload,
  Distributor,
  DistributorFilters,
  ServiceResponse,
  UpdateDistributorPayload,
} from '@/types';
import { generateDemoId, getDemoDatabase, persistDemoDatabase } from '@/data/demoStore';
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
    throw new Error(apiMessage(payload, 'The distributor request was rejected.'));
  }
}

function filterDemoDistributors(filters: DistributorFilters): Distributor[] {
  return getDemoDatabase().distributors.filter((distributor) => {
    if (
      filters.status &&
      filters.status !== 'all' &&
      distributor.status !== filters.status
    ) {
      return false;
    }
    if (filters.search) {
      const query = filters.search.toLowerCase();
      const haystack = [
        distributor.name,
        distributor.code,
        distributor.contactName,
        distributor.email,
        distributor.city,
        distributor.country,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

const distributorService = {
  getAll: async (
    filters: DistributorFilters = {}
  ): Promise<ServiceResponse<Distributor[]>> => {
    try {
      const response = await apiClient.get('/distributors', {
        params: { search: filters.search, status: filters.status },
      });
      assertSuccess(response.data);
      const parsed = parseCollection<Distributor>(response.data);
      if (!parsed) throw new Error('Unexpected distributor response from the server.');
      return {
        data: parsed.items,
        success: true,
        message: apiMessage(response.data, 'Distributors loaded.'),
        source: 'api',
      };
    } catch (error) {
      if (!shouldUseDemoFallback(error)) throw error;
      return {
        data: filterDemoDistributors(filters),
        success: true,
        message: 'Showing sample distributor data — backend unavailable.',
        source: 'demo',
      };
    }
  },

  getById: async (id: string): Promise<ServiceResponse<Distributor>> => {
    try {
      const response = await apiClient.get<ApiResponse<Distributor>>(`/distributors/${id}`);
      assertSuccess(response.data);
      const distributor = parseEntity<Distributor>(response.data);
      if (!distributor) throw new Error('Distributor not found.');
      return {
        data: distributor,
        success: true,
        message: apiMessage(response.data, 'Distributor loaded.'),
        source: 'api',
      };
    } catch (error) {
      if (!shouldUseDemoFallback(error)) throw error;
      const distributor = getDemoDatabase().distributors.find(
        (item) => item.id === id || item.code.toLowerCase() === id.toLowerCase()
      );
      if (!distributor) throw new Error('Distributor not found.');
      return {
        data: distributor,
        success: true,
        message: 'Showing sample distributor data — backend unavailable.',
        source: 'demo',
      };
    }
  },

  create: async (
    payload: CreateDistributorPayload
  ): Promise<ServiceResponse<Distributor>> => {
    try {
      const response = await apiClient.post<ApiResponse<Distributor>>(
        '/distributors',
        payload
      );
      assertSuccess(response.data);
      const distributor = parseEntity<Distributor>(response.data);
      if (!distributor) throw new Error('Unexpected distributor response from the server.');
      return {
        data: distributor,
        success: true,
        message: apiMessage(response.data, 'Distributor created.'),
        source: 'api',
      };
    } catch (error) {
      if (!shouldUseDemoFallback(error)) throw error;
      const database = getDemoDatabase();
      if (
        database.distributors.some(
          (distributor) => distributor.code.toLowerCase() === payload.code.toLowerCase()
        )
      ) {
        throw new Error('A distributor with this code already exists.');
      }
      const now = new Date().toISOString();
      const distributor: Distributor = {
        id: generateDemoId('dist'),
        code: payload.code,
        name: payload.name,
        contactName: payload.contactName,
        email: payload.email,
        phone: payload.phone,
        address: payload.address,
        city: payload.city,
        state: payload.state,
        country: payload.country,
        licenseNumber: payload.licenseNumber,
        status: payload.status ?? 'active',
        notes: payload.notes,
        createdAt: now,
        updatedAt: now,
      };
      database.distributors.unshift(distributor);
      persistDemoDatabase(database);
      return {
        data: distributor,
        success: true,
        message: 'Distributor saved to the local demo database.',
        source: 'demo',
      };
    }
  },

  update: async (
    id: string,
    payload: UpdateDistributorPayload
  ): Promise<ServiceResponse<Distributor>> => {
    try {
      const response = await apiClient.put<ApiResponse<Distributor>>(
        `/distributors/${id}`,
        payload
      );
      assertSuccess(response.data);
      const distributor = parseEntity<Distributor>(response.data);
      if (!distributor) throw new Error('Unexpected distributor response from the server.');
      return {
        data: distributor,
        success: true,
        message: apiMessage(response.data, 'Distributor updated.'),
        source: 'api',
      };
    } catch (error) {
      if (!shouldUseDemoFallback(error)) throw error;
      const database = getDemoDatabase();
      const index = database.distributors.findIndex((distributor) => distributor.id === id);
      if (index < 0) throw new Error('Distributor not found.');
      const current = database.distributors[index];
      const updated: Distributor = {
        ...current,
        code: payload.code ?? current.code,
        name: payload.name ?? current.name,
        contactName: payload.contactName ?? current.contactName,
        email: payload.email ?? current.email,
        phone: payload.phone ?? current.phone,
        address: payload.address ?? current.address,
        city: payload.city ?? current.city,
        state: payload.state ?? current.state,
        country: payload.country ?? current.country,
        licenseNumber: payload.licenseNumber ?? current.licenseNumber,
        status: payload.status ?? current.status,
        notes: payload.notes ?? current.notes,
        updatedAt: new Date().toISOString(),
      };
      database.distributors[index] = updated;
      persistDemoDatabase(database);
      return {
        data: updated,
        success: true,
        message: 'Distributor updated in the local demo database.',
        source: 'demo',
      };
    }
  },
};

export default distributorService;