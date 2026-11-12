// Blockchain transaction types
export type TransactionType =
  | 'product_created'
  | 'product_updated'
  | 'shipment_created'
  | 'shipment_status_changed'
  | 'inventory_updated'
  | 'ownership_transfer'
  | 'qr_verified';

export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

export interface BlockchainTransaction {
  id: string;
  txHash: string;
  blockNumber: number;
  transactionType: TransactionType;
  entityId: string;
  entityType: 'product' | 'shipment' | 'inventory' | 'ownership';
  productId?: string;
  productName?: string;
  fromAddress: string;
  toAddress?: string;
  timestamp: string;
  gasUsed?: number;
  status: TransactionStatus;
  data?: Record<string, unknown>;
  explorerUrl?: string;
  /** Local sample record — never present this as on-chain data. */
  isDemo?: boolean;
}

export interface BlockchainStats {
  totalTransactions: number;
  successfulTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
  latestBlock: number;
  networkName: string;
  networkStatus: 'connected' | 'degraded' | 'disconnected';
  contractAddress?: string;
  /** True when the figures are local sample records, not an RPC response. */
  isDemo: boolean;
}

export interface BlockchainTransactionFilters {
  search?: string;
  type?: TransactionType | 'all';
  status?: TransactionStatus | 'all';
  productId?: string;
  page?: number;
  limit?: number;
}