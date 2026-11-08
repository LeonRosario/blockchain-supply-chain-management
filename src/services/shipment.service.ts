import apiClient from './apiClient';
import type {
  Shipment,
  CreateShipmentPayload,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

const shipmentService = {
  getAll: async (page = 1, limit = 10): Promise<PaginatedResponse<Shipment>> => {
    const response = await apiClient.get<PaginatedResponse<Shipment>>('/shipments', {
      params: { page, limit },
    });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Shipment>> => {
    const response = await apiClient.get<ApiResponse<Shipment>>(`/shipments/${id}`);
    return response.data;
  },

  create: async (payload: CreateShipmentPayload): Promise<ApiResponse<Shipment>> => {
    const response = await apiClient.post<ApiResponse<Shipment>>('/shipments', payload);
    return response.data;
  },

  updateStatus: async (
    id: string,
    status: Shipment['status']
  ): Promise<ApiResponse<Shipment>> => {
    const response = await apiClient.patch<ApiResponse<Shipment>>(`/shipments/${id}/status`, {
      status,
    });
    return response.data;
  },

  trackByNumber: async (trackingNumber: string): Promise<ApiResponse<Shipment>> => {
    const response = await apiClient.get<ApiResponse<Shipment>>(
      `/shipments/track/${trackingNumber}`
    );
    return response.data;
  },
};

export default shipmentService;
