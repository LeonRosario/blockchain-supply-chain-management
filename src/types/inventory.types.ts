// Inventory types
export type MovementType = 'inbound' | 'outbound' | 'adjustment' | 'return';

export interface InventoryMovement {
  id: string;
  productId: string;
  type: MovementType;
  quantity: number;
  reason: string;
  performedBy: string;
  createdAt: string;
}

export interface Inventory {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  reorderLevel: number;
  reorderQuantity: number;
  lastMovement?: InventoryMovement;
  updatedAt: string;
}

export interface UpdateInventoryPayload {
  quantity: number;
  movementType: MovementType;
  reason: string;
}
