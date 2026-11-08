// Shipment types
export type ShipmentStatus =
  | 'pending'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export interface ShipmentItem {
  productId: string;
  quantity: number;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  origin: string;
  destination: string;
  status: ShipmentStatus;
  items: ShipmentItem[];
  carrierId: string;
  estimatedDelivery: string;
  actualDelivery?: string;
  blockchainHash?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShipmentPayload {
  origin: string;
  destination: string;
  items: ShipmentItem[];
  carrierId: string;
  estimatedDelivery: string;
}
