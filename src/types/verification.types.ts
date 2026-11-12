import type { Product } from './product.types';
import type { OwnershipTransfer } from './ownership.types';
import type { Shipment } from './shipment.types';
import type { BlockchainTransaction } from './blockchain.types';

/**
 * `unavailable` means no verification response was received from the
 * blockchain service. UI must never render this as verified.
 */
export type AuthenticityStatus = 'verified' | 'not_verified' | 'unavailable' | 'not_found';

export type VerificationDataSource = 'api' | 'demo' | 'unavailable';

export interface BlockchainReference {
  txHash?: string;
  blockNumber?: number;
  contractAddress?: string;
  explorerUrl?: string;
}

export interface ProductVerificationResult {
  productId: string;
  found: boolean;
  source: VerificationDataSource;
  /** Only true when the backend explicitly verified the product on-chain. */
  blockchainVerified: boolean;
  authenticityStatus: AuthenticityStatus;
  message: string;
  verificationTimestamp?: string;
  product?: Product;
  currentOwner?: string;
  manufacturer?: string;
  manufacturingDate?: string;
  productOrigin?: string;
  ownershipHistory: OwnershipTransfer[];
  shipmentJourney: Shipment[];
  transactions: BlockchainTransaction[];
  blockchainReference?: BlockchainReference;
  /** True when product/ownership/shipment details come from sample records. */
  detailsAreDemo?: boolean;
}

export interface VerificationHistoryRecord {
  id: string;
  productId: string;
  productName?: string;
  productImage?: string;
  authenticityStatus: AuthenticityStatus;
  source: VerificationDataSource;
  verifiedAt: string;
  message: string;
}