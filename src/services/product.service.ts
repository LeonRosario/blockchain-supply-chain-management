import apiClient from './apiClient';
import type {
  Product,
  CreateProductPayload,
  UpdateProductPayload,
  ProductFilters,
  ProductStats,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

const productService = {
  getAll: async (filters: ProductFilters = {}): Promise<PaginatedResponse<Product>> => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.category) params.append('category', filters.category);
    if (filters.status) params.append('status', filters.status);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get<PaginatedResponse<Product>>(`/products?${params.toString()}`);
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

  getStats: async (): Promise<ApiResponse<ProductStats>> => {
    const response = await apiClient.get<ApiResponse<ProductStats>>('/products/stats');
    return response.data;
  },

  getRecentActivity: async (limit = 10): Promise<ApiResponse<Product[]>> => {
    const response = await apiClient.get<ApiResponse<Product[]>>(`/products/recent?limit=${limit}`);
    return response.data;
  },
};

export default productService;