// Product ownership transfer types
/**
 * `demo` means the transfer was recorded in the local demo database only.
 * It is NOT a blockchain-confirmed ownership transfer.
 */
export type OwnershipTransferStatus = 'pending' | 'confirmed' | 'failed' | 'demo';

export interface OwnershipTransfer {
  id: string;
  productId: string;
  productName: string;
  previousOwner: string;
  newOwner: string;
  transferDate: string;
  location: string;
  status: OwnershipTransferStatus;
  transactionHash?: string;
  blockNumber?: number;
  notes?: string;
  performedBy?: string;
  isDemo?: boolean;
  createdAt: string;
}

export interface CreateOwnershipTransferPayload {
  productId: string;
  previousOwner: string;
  newOwner: string;
  transferDate: string;
  location: string;
  notes?: string;
}

export interface OwnershipTransferFilters {
  search?: string;
  productId?: string;
  status?: OwnershipTransferStatus | 'all';
}