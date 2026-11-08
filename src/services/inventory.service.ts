import apiClient from './apiClient';
import type { Inventory, UpdateInventoryPayload, ApiResponse, PaginatedResponse } from '@/types';

const inventoryService = {
  getAll: async (page = 1, limit = 10): Promise<PaginatedResponse<Inventory>> => {
    const response = await apiClient.get<PaginatedResponse<Inventory>>('/inventory', {
      params: { page, limit },
    });
    return response.data;
  },

  getByProduct: async (productId: string): Promise<ApiResponse<Inventory>> => {
    const response = await apiClient.get<ApiResponse<Inventory>>(
      `/inventory/product/${productId}`
    );
    return response.data;
  },

  update: async (
    id: string,
    payload: UpdateInventoryPayload
  ): Promise<ApiResponse<Inventory>> => {
    const response = await apiClient.patch<ApiResponse<Inventory>>(
      `/inventory/${id}`,
      payload
    );
    return response.data;
  },

  getLowStock: async (): Promise<ApiResponse<Inventory[]>> => {
    const response = await apiClient.get<ApiResponse<Inventory[]>>('/inventory/low-stock');
    return response.data;
  },
};

export default inventoryService;
