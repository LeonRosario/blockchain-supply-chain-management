// Inventory types
export type MovementType = 'inbound' | 'outbound' | 'adjustment' | 'return' | 'reservation';

export interface InventoryMovement {
  id: string;
  productId: string;
  productName?: string;
  sku?: string;
  warehouseId?: string;
  warehouseName?: string;
  type: MovementType;
  quantity: number;
  previousQuantity?: number;
  newQuantity?: number;
  reason: string;
  performedBy: string;
  createdAt: string;
}

export interface Inventory {
  id: string;
  productId: string;
  productName?: string;
  sku?: string;
  warehouseId: string;
  warehouseName?: string;
  quantity: number;
  reservedQuantity?: number;
  reorderLevel: number;
  reorderQuantity: number;
  lastMovement?: InventoryMovement;
  updatedAt: string;
}

export interface UpdateInventoryPayload {
  quantity: number;
  movementType: MovementType;
  reason: string;
  reservedQuantity?: number;
}

export interface InventoryFilters {
  search?: string;
  warehouseId?: string;
  lowStockOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface InventoryStats {
  totalAvailable: number;
  totalReserved: number;
  lowStockCount: number;
  warehouseCount: number;
  totalSkus: number;
}

export interface InventoryMovementFilters {
  search?: string;
  type?: MovementType | 'all';
  warehouseId?: string;
  productId?: string;
}