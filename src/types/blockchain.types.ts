// Blockchain transaction types
export type TransactionType =
  | 'product_created'
  | 'product_updated'
  | 'shipment_created'
  | 'shipment_status_changed'
  | 'inventory_updated'
  | 'qr_verified';

export interface BlockchainTransaction {
  id: string;
  txHash: string;
  blockNumber: number;
  transactionType: TransactionType;
  entityId: string;
  entityType: 'product' | 'shipment' | 'inventory';
  fromAddress: string;
  toAddress?: string;
  timestamp: string;
  gasUsed?: number;
  status: 'pending' | 'confirmed' | 'failed';
  data?: Record<string, unknown>;
}
