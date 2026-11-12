import apiClient from './apiClient';
import type {
  ApiResponse,
  CreateOwnershipTransferPayload,
  OwnershipTransfer,
  OwnershipTransferFilters,
  ServiceResponse,
} from '@/types';
import { generateDemoId, getDemoDatabase, persistDemoDatabase } from '@/data/demoStore';
import { mockProducts } from '@/data/mockProducts';
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
    throw new Error(apiMessage(payload, 'The ownership transfer was rejected.'));
  }
}

function filterDemoTransfers(
  filters: OwnershipTransferFilters = {}
): OwnershipTransfer[] {
  return getDemoDatabase()
    .transfers.filter((transfer) => {
      if (filters.productId && transfer.productId !== filters.productId) return false;
      if (
        filters.status &&
        filters.status !== 'all' &&
        transfer.status !== filters.status
      ) {
        return false;
      }
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const haystack = [
          transfer.productId,
          transfer.productName,
          transfer.previousOwner,
          transfer.newOwner,
          transfer.location,
          transfer.id,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.transferDate).getTime() - new Date(a.transferDate).getTime());
}

export function getDemoOwnershipHistory(productId: string): OwnershipTransfer[] {
  return filterDemoTransfers({ productId });
}

export function getDemoCurrentOwner(productId: string): string {
  const history = getDemoOwnershipHistory(productId).filter(
    (transfer) => transfer.status === 'demo' || transfer.status === 'confirmed'
  );
  if (history.length > 0) return history[0].newOwner;
  const product = mockProducts.find(
    (item) => item.productId === productId || item.id === productId
  );
  return product?.manufacturer ?? 'Unknown owner';
}

const ownershipService = {
  getAll: async (
    filters: OwnershipTransferFilters = {}
  ): Promise<ServiceResponse<OwnershipTransfer[]>> => {
    try {
      const response = await apiClient.get('/ownership-transfers', {
        params: {
          search: filters.search,
          productId: filters.productId,
          status: filters.status !== 'all' ? filters.status : undefined,
        },
      });
      assertSuccess(response.data);
      const parsed = parseCollection<OwnershipTransfer>(response.data);
      if (!parsed) throw new Error('Unexpected ownership response from the server.');
      return {
        data: parsed.items,
        success: true,
        message: apiMessage(response.data, 'Ownership history loaded.'),
        source: 'api',
      };
    } catch (error) {
      if (!shouldUseDemoFallback(error)) throw error;
      return {
        data: filterDemoTransfers(filters),
        success: true,
        message: 'Showing sample ownership records — backend unavailable.',
        source: 'demo',
      };
    }
  },

  getByProduct: async (
    productId: string
  ): Promise<ServiceResponse<OwnershipTransfer[]>> => {
    try {
      const response = await apiClient.get(
        `/ownership-transfers/product/${encodeURIComponent(productId)}`
      );
      assertSuccess(response.data);
      const parsed = parseCollection<OwnershipTransfer>(response.data);
      if (!parsed) throw new Error('Unexpected ownership response from the server.');
      return {
        data: parsed.items,
        success: true,
        message: apiMessage(response.data, 'Ownership history loaded.'),
        source: 'api',
      };
    } catch (error) {
      if (!shouldUseDemoFallback(error)) throw error;
      return {
        data: getDemoOwnershipHistory(productId),
        success: true,
        message: 'Showing sample ownership records — backend unavailable.',
        source: 'demo',
      };
    }
  },

  transfer: async (
    payload: CreateOwnershipTransferPayload
  ): Promise<ServiceResponse<OwnershipTransfer>> => {
    try {
      let response;
      try {
        response = await apiClient.post<ApiResponse<OwnershipTransfer>>(
          '/ownership-transfers',
          payload
        );
      } catch (firstError) {
        const status =
          firstError && typeof firstError === 'object' && 'response' in firstError
            ? (firstError as { response?: { status?: number } }).response?.status
            : undefined;
        if (status !== 404 && status !== 405) throw firstError;
        response = await apiClient.post<ApiResponse<OwnershipTransfer>>(
          `/products/${encodeURIComponent(payload.productId)}/transfer-ownership`,
          payload
        );
      }
      assertSuccess(response.data);
      const transfer = parseEntity<OwnershipTransfer>(response.data);
      if (!transfer) throw new Error('Unexpected ownership response from the server.');
      return {
        data: transfer,
        success: true,
        message: apiMessage(response.data, 'Ownership transfer submitted.'),
        source: 'api',
      };
    } catch (error) {
      if (!shouldUseDemoFallback(error)) throw error;

      const product = mockProducts.find(
        (item) => item.productId === payload.productId || item.id === payload.productId
      );
      if (!product) throw new Error('Product not found in the local product catalog.');

      const database = getDemoDatabase();
      const now = new Date().toISOString();
      const transfer: OwnershipTransfer = {
        id: generateDemoId('ot'),
        productId: product.productId,
        productName: product.name,
        previousOwner: payload.previousOwner,
        newOwner: payload.newOwner,
        transferDate: new Date(payload.transferDate).toISOString(),
        location: payload.location,
        status: 'demo',
        notes: payload.notes,
        isDemo: true,
        performedBy: 'Demo session',
        createdAt: now,
      };
      database.transfers.unshift(transfer);
      persistDemoDatabase(database);
      return {
        data: transfer,
        success: true,
        message:
          'Ownership recorded in the local demo database only. It is NOT a blockchain-confirmed transfer.',
        source: 'demo',
      };
    }
  },
};

export default ownershipService;