// ─── Re-exports ───────────────────────────────────────────────────────────────
export type {
  User,
  AuthUser,
  LoginCredentials,
  RegisterCredentials,
  UserRole,
  UserStatus,
  UserRecord,
  UserFilters,
  UpdateUserPayload,
  NotificationPreferences,
  AppPreferences,
} from './user.types';
export { USER_ROLES } from './user.types';

export type {
  Product,
  CreateProductPayload,
  UpdateProductPayload,
  ProductStatus,
  ProductFilters,
  ProductStats,
} from './product.types';

export type {
  Shipment,
  ShipmentItem,
  ShipmentTrackingEvent,
  ShipmentStage,
  CreateShipmentPayload,
  UpdateShipmentPayload,
  ShipmentStatus,
  ShipmentFilters,
  ShipmentStats,
} from './shipment.types';

export type {
  BlockchainTransaction,
  BlockchainStats,
  BlockchainTransactionFilters,
  TransactionType,
  TransactionStatus,
} from './blockchain.types';

export type {
  Inventory,
  InventoryMovement,
  UpdateInventoryPayload,
  MovementType,
  InventoryFilters,
  InventoryStats,
  InventoryMovementFilters,
} from './inventory.types';

export type {
  Warehouse,
  CreateWarehousePayload,
  UpdateWarehousePayload,
  WarehouseFilters,
  WarehouseStats,
  WarehouseStatus,
} from './warehouse.types';

export type {
  Distributor,
  CreateDistributorPayload,
  UpdateDistributorPayload,
  DistributorFilters,
  DistributorStatus,
} from './distributor.types';

export type {
  OwnershipTransfer,
  OwnershipTransferStatus,
  CreateOwnershipTransferPayload,
  OwnershipTransferFilters,
} from './ownership.types';

export type {
  ProductVerificationResult,
  VerificationHistoryRecord,
  AuthenticityStatus,
  VerificationDataSource,
  BlockchainReference,
} from './verification.types';

export type {
  AnalyticsData,
  AnalyticsSummary,
  AnalyticsTimePoint,
  AnalyticsCategoryPoint,
  AnalyticsWarehousePoint,
} from './analytics.types';

// ─── Shared API ───────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

/** Source of a service response. Demo data must be labelled in the UI. */
export type DataSource = 'api' | 'demo';

export interface ServiceResponse<T> extends ApiResponse<T> {
  source: DataSource;
}

export interface PaginatedServiceResponse<T> extends PaginatedResponse<T> {
  source: DataSource;
  message: string;
  success: boolean;
}