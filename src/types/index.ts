// Shared / API response types
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

export type { User, AuthUser, LoginCredentials, RegisterCredentials } from './user.types';
export type { Product, CreateProductPayload, UpdateProductPayload, ProductStatus } from './product.types';
export type { Shipment, ShipmentItem, CreateShipmentPayload, ShipmentStatus } from './shipment.types';
export type { BlockchainTransaction, TransactionType } from './blockchain.types';
export type { Inventory, InventoryMovement, UpdateInventoryPayload, MovementType } from './inventory.types';
