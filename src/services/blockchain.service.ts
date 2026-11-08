import apiClient from './apiClient';
import type { BlockchainTransaction, ApiResponse, PaginatedResponse } from '@/types';

const blockchainService = {
  getTransactions: async (page = 1, limit = 10): Promise<PaginatedResponse<BlockchainTransaction>> => {
    const response = await apiClient.get<PaginatedResponse<BlockchainTransaction>>(
      '/blockchain/transactions',
      { params: { page, limit } }
    );
    return response.data;
  },

  getTransactionByHash: async (txHash: string): Promise<ApiResponse<BlockchainTransaction>> => {
    const response = await apiClient.get<ApiResponse<BlockchainTransaction>>(
      `/blockchain/transactions/${txHash}`
    );
    return response.data;
  },

  getTransactionsByEntity: async (
    entityType: BlockchainTransaction['entityType'],
    entityId: string
  ): Promise<ApiResponse<BlockchainTransaction[]>> => {
    const response = await apiClient.get<ApiResponse<BlockchainTransaction[]>>(
      `/blockchain/transactions/entity/${entityType}/${entityId}`
    );
    return response.data;
  },

  verifyQrCode: async (qrData: string): Promise<ApiResponse<{ valid: boolean; entity: unknown }>> => {
    const response = await apiClient.post<ApiResponse<{ valid: boolean; entity: unknown }>>(
      '/blockchain/verify-qr',
      { qrData }
    );
    return response.data;
  },
};

export default blockchainService;
