// Warehouse types
export type WarehouseStatus = 'active' | 'maintenance' | 'inactive';

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  capacity: number;
  occupied: number;
  manager?: string;
  status: WarehouseStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWarehousePayload {
  code: string;
  name: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  capacity: number;
  occupied?: number;
  manager?: string;
  status?: WarehouseStatus;
  notes?: string;
}

export type UpdateWarehousePayload = Partial<CreateWarehousePayload>;

export interface WarehouseFilters {
  search?: string;
  status?: WarehouseStatus | 'all';
}

export interface WarehouseStats {
  totalWarehouses: number;
  activeWarehouses: number;
  totalCapacity: number;
  totalOccupied: number;
  utilization: number;
}