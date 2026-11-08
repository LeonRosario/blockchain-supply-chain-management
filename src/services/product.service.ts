import apiClient from './apiClient';
import type {
  Product,
  CreateProductPayload,
  UpdateProductPayload,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

const productService = {
  getAll: async (page = 1, limit = 10): Promise<PaginatedResponse<Product>> => {
    const response = await apiClient.get<PaginatedResponse<Product>>('/products', {
      params: { page, limit },
    });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Product>> => {
    const response = await apiClient.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data;
  },

  create: async (payload: CreateProductPayload): Promise<ApiResponse<Product>> => {
    const response = await apiClient.post<ApiResponse<Product>>('/products', payload);
    return response.data;
  },

  update: async (id: string, payload: UpdateProductPayload): Promise<ApiResponse<Product>> => {
    const response = await apiClient.put<ApiResponse<Product>>(`/products/${id}`, payload);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete<ApiResponse<null>>(`/products/${id}`);
    return response.data;
  },
};

export default productService;
