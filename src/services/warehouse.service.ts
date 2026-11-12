import apiClient from './apiClient';
import type {
  ApiResponse,
  CreateWarehousePayload,
  ServiceResponse,
  UpdateWarehousePayload,
  Warehouse,
  WarehouseFilters,
  WarehouseStats,
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
    throw new Error(apiMessage(payload, 'The warehouse request was rejected.'));
  }
}

function filterDemoWarehouses(filters: WarehouseFilters): Warehouse[] {
  return getDemoDatabase().warehouses.filter((warehouse) => {
    if (filters.status && filters.status !== 'all' && warehouse.status !== filters.status) {
      return false;
    }
    if (filters.search) {
      const query = filters.search.toLowerCase();
      const haystack = [
        warehouse.name,
        warehouse.code,
        warehouse.city,
        warehouse.state,
        warehouse.country,
        warehouse.contactName,
        warehouse.manager,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

const warehouseService = {
  getAll: async (
    filters: WarehouseFilters = {}
  ): Promise<ServiceResponse<Warehouse[]>> => {
    try {
      const response = await apiClient.get('/warehouses', {
        params: { search: filters.search, status: filters.status },
      });
      assertSuccess(response.data);
      const parsed = parseCollection<Warehouse>(response.data);
      if (!parsed) throw new Error('Unexpected warehouse response from the server.');
      return {
        data: parsed.items,
        success: true,
        message: apiMessage(response.data, 'Warehouses loaded.'),
        source: 'api',
      };
    } catch (error) {
      if (!shouldUseDemoFallback(error)) throw error;
      return {
        data: filterDemoWarehouses(filters),
        success: true,
        message: 'Showing sample warehouse data — backend unavailable.',
        source: 'demo',
      };
    }
  },

  getById: async (id: string): Promise<ServiceResponse<Warehouse>> => {
    try {
      const response = await apiClient.get<ApiResponse<Warehouse>>(`/warehouses/${id}`);
      assertSuccess(response.data);
      const warehouse = parseEntity<Warehouse>(response.data);
      if (!warehouse) throw new Error('Warehouse not found.');
      return {
        data: warehouse,
        success: true,
        message: apiMessage(response.data, 'Warehouse loaded.'),
        source: 'api',
      };
    } catch (error) {
      if (!shouldUseDemoFallback(error)) throw error;
      const warehouse = getDemoDatabase().warehouses.find(
        (item) => item.id === id || item.code.toLowerCase() === id.toLowerCase()
      );
      if (!warehouse) throw new Error('Warehouse not found.');
      return {
        data: warehouse,
        success: true,
        message: 'Showing sample warehouse data — backend unavailable.',
        source: 'demo',
      };
    }
  },

  create: async (
    payload: CreateWarehousePayload
  ): Promise<ServiceResponse<Warehouse>> => {
    try {
      const response = await apiClient.post<ApiResponse<Warehouse>>('/warehouses', payload);
      assertSuccess(response.data);
      const warehouse = parseEntity<Warehouse>(response.data);
      if (!warehouse) throw new Error('Unexpected warehouse response from the server.');
      return {
        data: warehouse,
        success: true,
        message: apiMessage(response.data, 'Warehouse created.'),
        source: 'api',
      };
    } catch (error) {
      if (!shouldUseDemoFallback(error)) throw error;
      const database = getDemoDatabase();
      if (
        database.warehouses.some(
          (warehouse) => warehouse.code.toLowerCase() === payload.code.toLowerCase()
        )
      ) {
        throw new Error('A warehouse with this code already exists.');
      }
      const now = new Date().toISOString();
      const warehouse: Warehouse = {
        id: generateDemoId('wh'),
        code: payload.code,
        name: payload.name,
        address: payload.address,
        city: payload.city,
        state: payload.state,
        country: payload.country,
        postalCode: payload.postalCode,
        contactName: payload.contactName,
        contactEmail: payload.contactEmail,
        contactPhone: payload.contactPhone,
        capacity: payload.capacity,
        occupied: payload.occupied ?? 0,
        manager: payload.manager,
        status: payload.status ?? 'active',
        notes: payload.notes,
        createdAt: now,
        updatedAt: now,
      };
      database.warehouses.unshift(warehouse);
      persistDemoDatabase(database);
      return {
        data: warehouse,
        success: true,
        message: 'Warehouse saved to the local demo database.',
        source: 'demo',
      };
    }
  },

  update: async (
    id: string,
    payload: UpdateWarehousePayload
  ): Promise<ServiceResponse<Warehouse>> => {
    try {
      const response = await apiClient.put<ApiResponse<Warehouse>>(
        `/warehouses/${id}`,
        payload
      );
      assertSuccess(response.data);
      const warehouse = parseEntity<Warehouse>(response.data);
      if (!warehouse) throw new Error('Unexpected warehouse response from the server.');
      return {
        data: warehouse,
        success: true,
        message: apiMessage(response.data, 'Warehouse updated.'),
        source: 'api',
      };
    } catch (error) {
      if (!shouldUseDemoFallback(error)) throw error;
      const database = getDemoDatabase();
      const index = database.warehouses.findIndex((warehouse) => warehouse.id === id);
      if (index < 0) throw new Error('Warehouse not found.');
      const current = database.warehouses[index];
      const updated: Warehouse = {
        ...current,
        code: payload.code ?? current.code,
        name: payload.name ?? current.name,
        address: payload.address ?? current.address,
        city: payload.city ?? current.city,
        state: payload.state ?? current.state,
        country: payload.country ?? current.country,
        postalCode: payload.postalCode ?? current.postalCode,
        contactName: payload.contactName ?? current.contactName,
        contactEmail: payload.contactEmail ?? current.contactEmail,
        contactPhone: payload.contactPhone ?? current.contactPhone,
        capacity: payload.capacity ?? current.capacity,
        occupied: payload.occupied ?? current.occupied,
        manager: payload.manager ?? current.manager,
        status: payload.status ?? current.status,
        notes: payload.notes ?? current.notes,
        updatedAt: new Date().toISOString(),
      };
      database.warehouses[index] = updated;
      persistDemoDatabase(database);
      return {
        data: updated,
        success: true,
        message: 'Warehouse updated in the local demo database.',
        source: 'demo',
      };
    }
  },

  getStats: async (): Promise<ServiceResponse<WarehouseStats>> => {
    const response = await warehouseService.getAll();
    const warehouses = response.data;
    const totalCapacity = warehouses.reduce((sum, warehouse) => sum + warehouse.capacity, 0);
    const totalOccupied = warehouses.reduce((sum, warehouse) => sum + warehouse.occupied, 0);
    return {
      data: {
        totalWarehouses: warehouses.length,
        activeWarehouses: warehouses.filter((warehouse) => warehouse.status === 'active')
          .length,
        totalCapacity,
        totalOccupied,
        utilization: totalCapacity > 0 ? (totalOccupied / totalCapacity) * 100 : 0,
      },
      success: true,
      message: response.message,
      source: response.source,
    };
  },
};

export default warehouseService;