// Distributor types
export type DistributorStatus = 'active' | 'inactive' | 'suspended';

export interface Distributor {
  id: string;
  code: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  licenseNumber?: string;
  status: DistributorStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDistributorPayload {
  code: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  licenseNumber?: string;
  status?: DistributorStatus;
  notes?: string;
}

export type UpdateDistributorPayload = Partial<CreateDistributorPayload>;

export interface DistributorFilters {
  search?: string;
  status?: DistributorStatus | 'all';
}