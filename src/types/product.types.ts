// Product types
export type ProductStatus = 'active' | 'inactive' | 'recalled' | 'in_transit' | 'delivered';

export interface Product {
  id: string;
  productId: string;           // Unique product identifier (e.g., PROD-001)
  name: string;
  sku: string;
  description: string;
  category: string;
  status: ProductStatus;
  price: number;
  quantity: number;
  manufacturer: string;
  manufacturingDate: string;   // ISO date string
  batchNumber: string;
  productImage?: string;       // URL or base64
  productOrigin: string;       // Country/region of origin
  supplierId: string;
  blockchainHash?: string;
  qrCodeData?: string;         // QR code reference (product ID or verification URL)
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductPayload {
  productId: string;
  name: string;
  sku: string;
  description: string;
  category: string;
  price: number;
  quantity: number;
  manufacturer: string;
  manufacturingDate: string;
  batchNumber: string;
  productImage?: string;
  productOrigin: string;
  supplierId: string;
}

export interface UpdateProductPayload extends Partial<CreateProductPayload> {
  status?: ProductStatus;
}

export interface ProductFilters {
  search?: string;
  category?: string;
  status?: ProductStatus;
  page?: number;
  limit?: number;
}

export interface ProductStats {
  totalProducts: number;
  inTransit: number;
  delivered: number;
  pendingShipments: number;
}