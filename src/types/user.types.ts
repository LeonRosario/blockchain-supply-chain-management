// ─── User Roles ───────────────────────────────────────────────────────────────
export type UserRole =
  | 'admin'
  | 'manufacturer'
  | 'distributor'
  | 'warehouse_manager'
  | 'retailer'
  | 'customer';

export const USER_ROLES: { value: UserRole; label: string }[] = [
  { value: 'admin',             label: 'Admin' },
  { value: 'manufacturer',      label: 'Manufacturer' },
  { value: 'distributor',       label: 'Distributor' },
  { value: 'warehouse_manager', label: 'Warehouse Manager' },
  { value: 'retailer',          label: 'Retailer' },
  { value: 'customer',          label: 'Customer' },
];

// ─── Core User ────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser extends User {
  token: string;
}

// ─── Auth Payloads ────────────────────────────────────────────────────────────
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}
