// Product types
export type ProductStatus = 'active' | 'inactive' | 'recalled';

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  category: string;
  status: ProductStatus;
  price: number;
  quantity: number;
  supplierId: string;
  blockchainHash?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductPayload {
  name: string;
  sku: string;
  description: string;
  category: string;
  price: number;
  quantity: number;
  supplierId: string;
}

export interface UpdateProductPayload extends Partial<CreateProductPayload> {
  status?: ProductStatus;
}
