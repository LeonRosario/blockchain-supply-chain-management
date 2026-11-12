// Analytics types
export interface AnalyticsTimePoint {
  label: string;
  shipments: number;
  deliveries: number;
  transactions: number;
}

export interface AnalyticsCategoryPoint {
  name: string;
  value: number;
  color: string;
}

export interface AnalyticsWarehousePoint {
  name: string;
  available: number;
  reserved: number;
}

export interface AnalyticsSummary {
  totalProducts: number;
  totalShipments: number;
  deliveredShipments: number;
  pendingShipments: number;
  totalTransactions: number;
  verifiedProducts: number;
  totalInventory: number;
  availableStock: number;
  reservedStock: number;
  lowStockProducts: number;
  verifiedAuthenticity: number;
  unverifiedAuthenticity: number;
  unavailableAuthenticity: number;
  onTimeDeliveryRate: number;
  averageDeliveryDays: number;
}

export interface AnalyticsData {
  summary: AnalyticsSummary;
  timeline: AnalyticsTimePoint[];
  categories: AnalyticsCategoryPoint[];
  warehouses: AnalyticsWarehousePoint[];
  topProducts: Array<{ productId: string; name: string; quantity: number }>;
}