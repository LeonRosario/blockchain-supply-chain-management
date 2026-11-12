import apiClient from './apiClient';
import type {
  ApiResponse,
  Inventory,
  InventoryFilters,
  InventoryMovement,
  InventoryMovementFilters,
  InventoryStats,
  ServiceResponse,
  UpdateInventoryPayload,
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
    throw new Error(apiMessage(payload, 'The inventory request was rejected.'));
  }
}

function availableQuantity(item: Inventory): number {
  return Math.max(0, item.quantity - (item.reservedQuantity ?? 0));
}

function isLowStock(item: Inventory): boolean {
  return availableQuantity(item) <= item.reorderLevel;
}

function filterDemoInventory(filters: InventoryFilters): Inventory[] {
  return getDemoDatabase().inventory.filter((item) => {
    if (filters.warehouseId && item.warehouseId !== filters.warehouseId) return false;
    if (filters.lowStockOnly && !isLowStock(item)) return false;
    if (filters.search) {
      const query = filters.search.toLowerCase();
      const haystack = [
        item.productId,
        item.productName,
        item.sku,
        item.warehouseName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

function filterDemoMovements(filters: InventoryMovementFilters): InventoryMovement[] {
  return getDemoDatabase()
    .movements.filter((movement) => {
      if (filters.type && filters.type !== 'all' && movement.type !== filters.type) {
        return false;
      }
      if (filters.warehouseId && movement.warehouseId !== filters.warehouseId) {
        return false;
      }
      if (filters.productId && movement.productId !== filters.productId) {
        return false;
      }
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const haystack = [
          movement.productId,
          movement.productName,
          movement.sku,
          movement.warehouseName,
          movement.reason,
          movement.performedBy,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

const inventoryService = {
  getAll: async (
    filters: InventoryFilters = {}
  ): Promise<ServiceResponse<Inventory[]>> => {
    try {
      const response = await apiClient.get('/inventory', {
        params: {
          search: filters.search,
          warehouseId: filters.warehouseId,
          lowStock: filters.lowStockOnly || undefined,
          page: filters.page,
          limit: filters.limit,
        },
      });
      assertSuccess(response.data);
      const parsed = parseCollection<Inventory>(response.data);
      if (!parsed) throw new Error('Unexpected inventory response from the server.');
      return {
        data: parsed.items,
        success: true,
        message: apiMessage(response.data, 'Inventory loaded.'),
        source: 'api',
      };
    } catch (error) {
      if (!shouldUseDemoFallback(error)) throw error;
      return {
        data: filterDemoInventory(filters),
        success: true,
        message: 'Showing sample inventory data — backend unavailable.',
        source: 'demo',
      };
    }
  },

  getByProduct: async (productId: string): Promise<ServiceResponse<Inventory[]>> => {
    try {
      const response = await apiClient.get(`/inventory/product/${productId}`);
      assertSuccess(response.data);
      const parsed = parseCollection<Inventory>(response.data);
      const entity = parsed ? null : parseEntity<Inventory>(response.data);
      const items = parsed?.items ?? (entity ? [entity] : []);
      return {
        data: items,
        success: true,
        message: apiMessage(response.data, 'Inventory loaded.'),
        source: 'api',
      };
    } catch (error) {
      if (!shouldUseDemoFallback(error)) throw error;
      return {
        data: getDemoDatabase().inventory.filter((item) => item.productId === productId),
        success: true,
        message: 'Showing sample inventory data — backend unavailable.',
        source: 'demo',
      };
    }
  },

  update: async (
    id: string,
    payload: UpdateInventoryPayload
  ): Promise<ServiceResponse<Inventory>> => {
    try {
      const response = await apiClient.patch<ApiResponse<Inventory>>(
        `/inventory/${id}`,
        payload
      );
      assertSuccess(response.data);
      const inventory = parseEntity<Inventory>(response.data);
      if (!inventory) throw new Error('Unexpected inventory response from the server.');
      return {
        data: inventory,
        success: true,
        message: apiMessage(response.data, 'Inventory updated.'),
        source: 'api',
      };
    } catch (error) {
      if (!shouldUseDemoFallback(error)) throw error;
      const database = getDemoDatabase();
      const index = database.inventory.findIndex((item) => item.id === id);
      if (index < 0) throw new Error('Inventory record not found.');
      if (payload.quantity < 0) throw new Error('Quantity cannot be negative.');

      const current = database.inventory[index];
      const now = new Date().toISOString();
      const updated: Inventory = {
        ...current,
        quantity: payload.quantity,
        reservedQuantity: payload.reservedQuantity ?? current.reservedQuantity,
        updatedAt: now,
      };
      database.inventory[index] = updated;

      const movement: InventoryMovement = {
        id: generateDemoId('mov'),
        productId: current.productId,
        productName: current.productName,
        sku: current.sku,
        warehouseId: current.warehouseId,
        warehouseName: current.warehouseName,
        type: payload.movementType,
        quantity: payload.quantity - current.quantity,
        previousQuantity: current.quantity,
        newQuantity: payload.quantity,
        reason: payload.reason,
        performedBy: 'Demo session',
        createdAt: now,
      };
      database.movements.unshift(movement);
      updated.lastMovement = movement;
      database.inventory[index] = updated;
      persistDemoDatabase(database);

      return {
        data: updated,
        success: true,
        message:
          'Stock updated in the local demo database. No blockchain transaction was submitted.',
        source: 'demo',
      };
    }
  },

  getLowStock: async (): Promise<ServiceResponse<Inventory[]>> => {
    const response = await inventoryService.getAll({ lowStockOnly: true });
    return {
      data: response.data,
      success: true,
      message: response.message,
      source: response.source,
    };
  },

  getMovements: async (
    filters: InventoryMovementFilters = {}
  ): Promise<ServiceResponse<InventoryMovement[]>> => {
    try {
      const response = await apiClient.get('/inventory/movements', {
        params: {
          search: filters.search,
          type: filters.type !== 'all' ? filters.type : undefined,
          warehouseId: filters.warehouseId,
          productId: filters.productId,
        },
      });
      assertSuccess(response.data);
      const parsed = parseCollection<InventoryMovement>(response.data);
      if (!parsed) throw new Error('Unexpected movement response from the server.');
      return {
        data: parsed.items,
        success: true,
        message: apiMessage(response.data, 'Inventory movements loaded.'),
        source: 'api',
      };
    } catch (error) {
      if (!shouldUseDemoFallback(error)) throw error;
      return {
        data: filterDemoMovements(filters),
        success: true,
        message: 'Showing sample movement history — backend unavailable.',
        source: 'demo',
      };
    }
  },

  getStats: async (): Promise<ServiceResponse<InventoryStats>> => {
    const response = await inventoryService.getAll({ page: 1, limit: 10_000 });
    const items = response.data;
    const stats: InventoryStats = {
      totalAvailable: items.reduce((sum, item) => sum + availableQuantity(item), 0),
      totalReserved: items.reduce(
        (sum, item) => sum + (item.reservedQuantity ?? 0),
        0
      ),
      lowStockCount: items.filter(isLowStock).length,
      warehouseCount: new Set(items.map((item) => item.warehouseId)).size,
      totalSkus: new Set(items.map((item) => item.productId)).size,
    };
    return {
      data: stats,
      success: true,
      message: response.message,
      source: response.source,
    };
  },
};

export default inventoryService;