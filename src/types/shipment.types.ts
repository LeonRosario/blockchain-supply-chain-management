// Shipment types
export type ShipmentStage =
  | 'created'
  | 'dispatched'
  | 'in_transit'
  | 'arrived'
  | 'delivered';

/**
 * `pending` is kept for API compatibility with older backend responses.
 * New records created in the UI use `created`.
 */
export type ShipmentStatus =
  | 'pending'
  | 'created'
  | 'dispatched'
  | 'in_transit'
  | 'arrived'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export interface ShipmentItem {
  productId: string;
  productName?: string;
  sku?: string;
  quantity: number;
  unitPrice?: number;
}

export interface ShipmentTrackingEvent {
  id: string;
  stage: ShipmentStage;
  title: string;
  location: string;
  timestamp?: string;
  details?: string;
  completed: boolean;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  origin: string;
  destination: string;
  status: ShipmentStatus;
  items: ShipmentItem[];
  carrierId: string;
  /** Human readable transporter / carrier name. */
  carrierName?: string;
  distributorId?: string;
  distributorName?: string;
  sourceWarehouseId?: string;
  sourceWarehouseName?: string;
  destinationWarehouseId?: string;
  destinationWarehouseName?: string;
  estimatedDelivery: string;
  actualDelivery?: string;
  currentLocation?: string;
  trackingEvents?: ShipmentTrackingEvent[];
  notes?: string;
  createdBy?: string;
  blockchainHash?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShipmentPayload {
  origin: string;
  destination: string;
  items: ShipmentItem[];
  carrierId: string;
  carrierName?: string;
  distributorId?: string;
  distributorName?: string;
  sourceWarehouseId?: string;
  sourceWarehouseName?: string;
  destinationWarehouseId?: string;
  destinationWarehouseName?: string;
  estimatedDelivery: string;
  shipmentDate?: string;
  notes?: string;
}

export type UpdateShipmentPayload = Partial<CreateShipmentPayload> & {
  status?: ShipmentStatus;
};

export interface ShipmentFilters {
  search?: string;
  status?: ShipmentStatus | 'all';
  productId?: string;
  distributorId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface ShipmentStats {
  total: number;
  created: number;
  inTransit: number;
  arrived: number;
  delivered: number;
  cancelled: number;
}