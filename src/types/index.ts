// ─── Re-exports ───────────────────────────────────────────────────────────────
export type {
  User,
  AuthUser,
  LoginCredentials,
  RegisterCredentials,
  UserRole,
} from './user.types';
export { USER_ROLES } from './user.types';

export type {
  Product,
  CreateProductPayload,
  UpdateProductPayload,
  ProductStatus,
} from './product.types';

export type {
  Shipment,
  ShipmentItem,
  CreateShipmentPayload,
  ShipmentStatus,
} from './shipment.types';

export type {
  BlockchainTransaction,
  TransactionType,
} from './blockchain.types';

export type {
  Inventory,
  InventoryMovement,
  UpdateInventoryPayload,
  MovementType,
} from './inventory.types';

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
