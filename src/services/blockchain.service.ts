import apiClient from './apiClient';
import type {
  ApiResponse,
  BlockchainReference,
  BlockchainStats,
  BlockchainTransaction,
  BlockchainTransactionFilters,
  PaginatedServiceResponse,
  Product,
  ProductVerificationResult,
  ServiceResponse,
} from '@/types';
import { getDemoDatabase } from '@/data/demoStore';
import { mockProducts } from '@/data/mockProducts';
import { getDemoCurrentOwner, getDemoOwnershipHistory } from './ownership.service';
import {
  apiMessage,
  paginate,
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
    throw new Error(apiMessage(payload, 'The blockchain request was rejected.'));
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function filterDemoTransactions(
  filters: BlockchainTransactionFilters
): BlockchainTransaction[] {
  return getDemoDatabase()
    .transactions.filter((transaction) => {
      if (
        filters.status &&
        filters.status !== 'all' &&
        transaction.status !== filters.status
      ) {
        return false;
      }
      if (
        filters.type &&
        filters.type !== 'all' &&
        transaction.transactionType !== filters.type
      ) {
        return false;
      }
      if (filters.productId && transaction.productId !== filters.productId) {
        return false;
      }
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const haystack = [
          transaction.txHash,
          transaction.id,
          transaction.productId,
          transaction.productName,
          transaction.entityId,
          transaction.fromAddress,
          transaction.toAddress,
          transaction.transactionType,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function paginatedTransactions(
  items: BlockchainTransaction[],
  filters: BlockchainTransactionFilters,
  source: 'api' | 'demo',
  totalOverride?: number
): PaginatedServiceResponse<BlockchainTransaction> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 10;
  const total = totalOverride ?? items.length;
  const result = paginate(items, page, limit);
  return {
    data: source === 'api' ? items : result.items,
    total: source === 'api' ? total : result.total,
    page,
    limit,
    totalPages:
      source === 'api'
        ? Math.max(1, Math.ceil(total / limit))
        : result.totalPages,
    source,
    success: true,
    message:
      source === 'api'
        ? 'Blockchain transactions loaded.'
        : 'Showing local sample transactions — no blockchain connection is configured.',
  };
}

function demoStats(): BlockchainStats {
  const transactions = getDemoDatabase().transactions;
  return {
    totalTransactions: transactions.length,
    successfulTransactions: transactions.filter((tx) => tx.status === 'confirmed').length,
    pendingTransactions: transactions.filter((tx) => tx.status === 'pending').length,
    failedTransactions: transactions.filter((tx) => tx.status === 'failed').length,
    latestBlock: 0,
    networkName: 'No blockchain RPC connection',
    networkStatus: 'disconnected',
    contractAddress: (import.meta.env.VITE_CONTRACT_ADDRESS as string) || undefined,
    isDemo: true,
  };
}

function unavailableVerification(productId: string, message?: string): ProductVerificationResult {
  const product = mockProducts.find(
    (item) => item.productId === productId || item.id === productId
  );
  const ownershipHistory = product ? getDemoOwnershipHistory(product.productId) : [];
  const shipmentJourney = product
    ? getDemoDatabase().shipments.filter((shipment) =>
        shipment.items.some((item) => item.productId === product.productId)
      )
    : [];

  return {
    productId: product?.productId ?? productId,
    found: Boolean(product),
    source: 'unavailable',
    blockchainVerified: false,
    authenticityStatus: 'unavailable',
    message:
      message ??
      'The blockchain verification service is unreachable. No authenticity result was received. Catalog details below are demo records only and must not be treated as verification.',
    product,
    currentOwner: product ? getDemoCurrentOwner(product.productId) : undefined,
    manufacturer: product?.manufacturer,
    manufacturingDate: product?.manufacturingDate,
    productOrigin: product?.productOrigin,
    ownershipHistory,
    shipmentJourney,
    transactions: [],
    blockchainReference: undefined,
    detailsAreDemo: Boolean(product),
  };
}

function toObjectArray<T>(value: unknown): T[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord) as unknown as T[];
}

function normalizeVerification(
  payload: unknown,
  requestedProductId: string
): ProductVerificationResult {
  const data = isRecord(payload) ? payload : {};
  const product = isRecord(data.product)
    ? (data.product as unknown as Product)
    : undefined;
  const currentOwner =
    typeof data.currentOwner === 'string' ? data.currentOwner : undefined;
  const manufacturer =
    typeof data.manufacturer === 'string'
      ? data.manufacturer
      : product?.manufacturer;
  const manufacturingDate =
    typeof data.manufacturingDate === 'string'
      ? data.manufacturingDate
      : product?.manufacturingDate;
  const productOrigin =
    typeof data.productOrigin === 'string' ? data.productOrigin : product?.productOrigin;

  const verified =
    data.blockchainVerified === true ||
    data.verified === true ||
    data.authenticityStatus === 'verified';

  const found = Boolean(product) || data.found === true || verified;
  const rawStatus = data.authenticityStatus;
  const authenticityStatus = verified
    ? 'verified'
    : rawStatus === 'not_found' || !found
      ? 'not_found'
      : 'not_verified';

  let blockchainReference: BlockchainReference | undefined;
  if (isRecord(data.blockchainReference)) {
    blockchainReference = {
      txHash:
        typeof data.blockchainReference.txHash === 'string'
          ? data.blockchainReference.txHash
          : undefined,
      blockNumber:
        typeof data.blockchainReference.blockNumber === 'number'
          ? data.blockchainReference.blockNumber
          : undefined,
      contractAddress:
        typeof data.blockchainReference.contractAddress === 'string'
          ? data.blockchainReference.contractAddress
          : undefined,
      explorerUrl:
        typeof data.blockchainReference.explorerUrl === 'string'
          ? data.blockchainReference.explorerUrl
          : undefined,
    };
  } else if (typeof data.txHash === 'string') {
    blockchainReference = {
      txHash: data.txHash,
      blockNumber:
        typeof data.blockNumber === 'number' ? data.blockNumber : undefined,
    };
  }

  return {
    productId:
      product?.productId ??
      (typeof data.productId === 'string' ? data.productId : requestedProductId),
    found,
    source: 'api',
    blockchainVerified: verified,
    authenticityStatus,
    message:
      typeof data.message === 'string'
        ? data.message
        : verified
          ? 'The blockchain service confirmed this product record.'
          : 'The blockchain service did not confirm this product as authentic.',
    verificationTimestamp:
      typeof data.verificationTimestamp === 'string'
        ? data.verificationTimestamp
        : new Date().toISOString(),
    product,
    currentOwner,
    manufacturer,
    manufacturingDate,
    productOrigin,
    ownershipHistory: toObjectArray<ProductVerificationResult['ownershipHistory'][number]>(
      data.ownershipHistory
    ),
    shipmentJourney: toObjectArray<ProductVerificationResult['shipmentJourney'][number]>(
      data.shipmentJourney
    ),
    transactions: toObjectArray<BlockchainTransaction>(data.transactions),
    blockchainReference,
    detailsAreDemo: false,
  };
}

const blockchainService = {
  getTransactions: async (
    filters: BlockchainTransactionFilters = {}
  ): Promise<PaginatedServiceResponse<BlockchainTransaction>> => {
    try {
      const response = await apiClient.get('/blockchain/transactions', {
        params: {
          search: filters.search,
          type: filters.type !== 'all' ? filters.type : undefined,
          status: filters.status !== 'all' ? filters.status : undefined,
          productId: filters.productId,
          page: filters.page ?? 1,
          limit: filters.limit ?? 10,
        },
      });
      assertSuccess(response.data);
      const parsed = parseCollection<BlockchainTransaction>(response.data);
      if (!parsed) throw new Error('Unexpected transaction response from the server.');
      return paginatedTransactions(
        parsed.items,
        filters,
        'api',
        parsed.total
      );
    } catch (error) {
      if (!shouldUseDemoFallback(error)) throw error;
      const items = filterDemoTransactions(filters);
      return paginatedTransactions(items, filters, 'demo');
    }
  },

  getTransaction: async (
    identifier: string
  ): Promise<ServiceResponse<BlockchainTransaction>> => {
    try {
      const response = await apiClient.get<ApiResponse<BlockchainTransaction>>(
        `/blockchain/transactions/${encodeURIComponent(identifier)}`
      );
      assertSuccess(response.data);
      const transaction = parseEntity<BlockchainTransaction>(response.data);
      if (!transaction) throw new Error('Transaction not found.');
      return {
        data: transaction,
        success: true,
        message: apiMessage(response.data, 'Transaction loaded.'),
        source: 'api',
      };
    } catch (error) {
      if (!shouldUseDemoFallback(error)) throw error;
      const transaction = getDemoDatabase().transactions.find(
        (item) =>
          item.id === identifier ||
          item.txHash.toLowerCase() === identifier.toLowerCase()
      );
      if (!transaction) throw new Error('Transaction not found.');
      return {
        data: transaction,
        success: true,
        message: 'Showing a local sample transaction — no blockchain connection.',
        source: 'demo',
      };
    }
  },

  /** Backwards-compatible alias. */
  getTransactionByHash: async (
    txHash: string
  ): Promise<ServiceResponse<BlockchainTransaction>> =>
    blockchainService.getTransaction(txHash),

  getTransactionsByEntity: async (
    entityType: BlockchainTransaction['entityType'],
    entityId: string
  ): Promise<ServiceResponse<BlockchainTransaction[]>> => {
    try {
      const response = await apiClient.get(
        `/blockchain/transactions/entity/${entityType}/${encodeURIComponent(entityId)}`
      );
      assertSuccess(response.data);
      const parsed = parseCollection<BlockchainTransaction>(response.data);
      if (!parsed) throw new Error('Unexpected transaction response from the server.');
      return {
        data: parsed.items,
        success: true,
        message: apiMessage(response.data, 'Transactions loaded.'),
        source: 'api',
      };
    } catch (error) {
      if (!shouldUseDemoFallback(error)) throw error;
      return {
        data: getDemoDatabase().transactions.filter(
          (transaction) =>
            transaction.entityType === entityType &&
            transaction.entityId === entityId
        ),
        success: true,
        message: 'Showing local sample transactions — no blockchain connection.',
        source: 'demo',
      };
    }
  },

  getTransactionsByProduct: async (
    productId: string
  ): Promise<ServiceResponse<BlockchainTransaction[]>> => {
    try {
      const response = await apiClient.get(
        `/blockchain/transactions/product/${encodeURIComponent(productId)}`
      );
      assertSuccess(response.data);
      const parsed = parseCollection<BlockchainTransaction>(response.data);
      if (!parsed) throw new Error('Unexpected transaction response from the server.');
      return {
        data: parsed.items,
        success: true,
        message: apiMessage(response.data, 'Transactions loaded.'),
        source: 'api',
      };
    } catch (error) {
      if (!shouldUseDemoFallback(error)) throw error;
      return {
        data: getDemoDatabase().transactions.filter(
          (transaction) => transaction.productId === productId
        ),
        success: true,
        message: 'Showing local sample transactions — no blockchain connection.',
        source: 'demo',
      };
    }
  },

  getStats: async (): Promise<ServiceResponse<BlockchainStats>> => {
    try {
      const response = await apiClient.get('/blockchain/stats');
      assertSuccess(response.data);
      const stats = parseEntity<BlockchainStats>(response.data);
      if (!stats) throw new Error('Unexpected blockchain stats response from the server.');
      return {
        data: { ...stats, isDemo: false },
        success: true,
        message: apiMessage(response.data, 'Blockchain statistics loaded.'),
        source: 'api',
      };
    } catch (error) {
      if (!shouldUseDemoFallback(error)) throw error;
      return {
        data: demoStats(),
        success: true,
        message:
          'No blockchain connection. Statistics below are local sample records, not on-chain data.',
        source: 'demo',
      };
    }
  },

  /**
   * Verify a product against the backend blockchain service.
   *
   * IMPORTANT: this method never substitutes demo data for a verification
   * result. If the service is unreachable, the result is explicitly
   * `unavailable` with `blockchainVerified: false`.
   */
  verifyProduct: async (productId: string): Promise<ProductVerificationResult> => {
    try {
      const response = await apiClient.get(
        `/blockchain/verify/${encodeURIComponent(productId)}`
      );
      const raw = response.data;

      if (isRecord(raw) && raw.success === false) {
        return {
          productId,
          found: false,
          source: 'api',
          blockchainVerified: false,
          authenticityStatus: 'not_found',
          message: apiMessage(raw, 'No verification record was found for this product.'),
          ownershipHistory: [],
          shipmentJourney: [],
          transactions: [],
          detailsAreDemo: false,
        };
      }

      const entity = isRecord(raw) && 'data' in raw ? raw.data : raw;
      if (!isRecord(entity)) {
        return unavailableVerification(
          productId,
          'The blockchain service returned an unrecognised response. Authenticity could not be confirmed.'
        );
      }

      return normalizeVerification(entity, productId);
    } catch (error) {
      const status =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { status?: number } }).response?.status
          : undefined;

      if (status === 404) {
        return {
          productId,
          found: false,
          source: 'api',
          blockchainVerified: false,
          authenticityStatus: 'not_found',
          message:
            'The blockchain service has no record for this product ID. Do not treat this product as verified.',
          ownershipHistory: [],
          shipmentJourney: [],
          transactions: [],
          detailsAreDemo: false,
        };
      }

      return unavailableVerification(
        productId,
        status
          ? 'The blockchain verification request failed. No authenticity result was received.'
          : undefined
      );
    }
  },

  /** Verify a raw QR payload through the backend; never reports a false positive. */
  verifyQrCode: async (
    qrData: string
  ): Promise<ServiceResponse<{ valid: boolean; entity: unknown }>> => {
    try {
      const response = await apiClient.post<
        ApiResponse<{ valid: boolean; entity: unknown }>
      >('/blockchain/verify-qr', { qrData });
      assertSuccess(response.data);
      const entity = parseEntity<{ valid: boolean; entity: unknown }>(response.data);
      if (!entity) throw new Error('Unexpected QR verification response from the server.');
      return {
        data: { valid: entity.valid === true, entity: entity.entity },
        success: true,
        message: apiMessage(response.data, 'QR code checked.'),
        source: 'api',
      };
    } catch (error) {
      if (!shouldUseDemoFallback(error)) throw error;
      return {
        data: { valid: false, entity: null },
        success: true,
        message:
          'No blockchain verification service is configured. The QR code was not verified.',
        source: 'demo',
      };
    }
  },
};

export default blockchainService;