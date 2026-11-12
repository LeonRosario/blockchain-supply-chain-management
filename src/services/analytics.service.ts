import apiClient from './apiClient';
import type {
  AnalyticsCategoryPoint,
  AnalyticsData,
  AnalyticsTimePoint,
  AnalyticsWarehousePoint,
  ServiceResponse,
} from '@/types';
import { getDemoDatabase } from '@/data/demoStore';
import { mockProducts } from '@/data/mockProducts';
import {
  apiMessage,
  parseEntity,
  shouldUseDemoFallback,
} from './serviceHelpers';

const CATEGORY_COLORS = [
  '#3b82f6',
  '#22c55e',
  '#8b5cf6',
  '#f97316',
  '#ec4899',
  '#06b6d4',
  '#eab308',
  '#84cc16',
  '#ef4444',
  '#6366f1',
];

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

function buildDemoAnalytics(): AnalyticsData {
  const database = getDemoDatabase();
  const products = mockProducts;
  const shipments = database.shipments;
  const transactions = database.transactions;

  const totalQuantity = database.inventory.reduce((sum, item) => sum + item.quantity, 0);
  const reservedStock = database.inventory.reduce(
    (sum, item) => sum + (item.reservedQuantity ?? 0),
    0
  );
  const availableStock = database.inventory.reduce(
    (sum, item) => sum + Math.max(0, item.quantity - (item.reservedQuantity ?? 0)),
    0
  );
  const lowStockProducts = database.inventory.filter(
    (item) => item.quantity - (item.reservedQuantity ?? 0) <= item.reorderLevel
  ).length;

  const deliveredShipments = shipments.filter((shipment) => shipment.status === 'delivered');
  const onTimeDeliveries = deliveredShipments.filter(
    (shipment) =>
      shipment.actualDelivery &&
      new Date(shipment.actualDelivery).getTime() <=
        new Date(shipment.estimatedDelivery).getTime()
  );
  const deliveryDurations = deliveredShipments
    .filter((shipment) => shipment.actualDelivery)
    .map(
      (shipment) =>
        (new Date(shipment.actualDelivery as string).getTime() -
          new Date(shipment.createdAt).getTime()) /
        86_400_000
    );

  const now = new Date();
  const timeline: AnalyticsTimePoint[] = [];
  for (let offset = 5; offset >= 0; offset -= 1) {
    const start = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const key = monthKey(start);
    const monthlyShipments = shipments.filter(
      (shipment) => monthKey(new Date(shipment.createdAt)) === key
    );
    const monthlyDeliveries = deliveredShipments.filter((shipment) => {
      const deliveryDate = shipment.actualDelivery ?? shipment.updatedAt;
      return monthKey(new Date(deliveryDate)) === key;
    });
    const monthlyTransactions = transactions.filter(
      (transaction) => monthKey(new Date(transaction.timestamp)) === key
    );
    timeline.push({
      label: start.toLocaleString('en-US', { month: 'short' }),
      shipments: monthlyShipments.length,
      deliveries: monthlyDeliveries.length,
      transactions: monthlyTransactions.length,
    });
  }

  const categoryCounts = new Map<string, number>();
  for (const product of products) {
    categoryCounts.set(product.category, (categoryCounts.get(product.category) ?? 0) + 1);
  }
  const categories: AnalyticsCategoryPoint[] = Array.from(categoryCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], index) => ({
      name,
      value,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }));

  const warehouses: AnalyticsWarehousePoint[] = database.warehouses.map((warehouse) => {
    const rows = database.inventory.filter((item) => item.warehouseId === warehouse.id);
    return {
      name: warehouse.code,
      available: rows.reduce(
        (sum, item) => sum + Math.max(0, item.quantity - (item.reservedQuantity ?? 0)),
        0
      ),
      reserved: rows.reduce((sum, item) => sum + (item.reservedQuantity ?? 0), 0),
    };
  });

  const productTotals = new Map<string, { name: string; quantity: number }>();
  for (const item of database.inventory) {
    const existing = productTotals.get(item.productId);
    productTotals.set(item.productId, {
      name: item.productName ?? item.productId,
      quantity: (existing?.quantity ?? 0) + item.quantity,
    });
  }
  const topProducts = Array.from(productTotals.entries())
    .map(([productId, value]) => ({
      productId,
      name: value.name,
      quantity: value.quantity,
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  return {
    summary: {
      totalProducts: products.length,
      totalShipments: shipments.length,
      deliveredShipments: deliveredShipments.length,
      pendingShipments: shipments.filter(
        (shipment) =>
          !['delivered', 'cancelled', 'returned'].includes(shipment.status)
      ).length,
      totalTransactions: transactions.length,
      // No backend verification response exists, so verified products stays 0.
      verifiedProducts: 0,
      totalInventory: totalQuantity,
      availableStock,
      reservedStock,
      lowStockProducts,
      verifiedAuthenticity: 0,
      unverifiedAuthenticity: 0,
      unavailableAuthenticity: products.length,
      onTimeDeliveryRate:
        deliveredShipments.length > 0
          ? (onTimeDeliveries.length / deliveredShipments.length) * 100
          : 0,
      averageDeliveryDays:
        deliveryDurations.length > 0
          ? deliveryDurations.reduce((sum, value) => sum + value, 0) /
            deliveryDurations.length
          : 0,
    },
    timeline,
    categories,
    warehouses,
    topProducts,
  };
}

const analyticsService = {
  getDashboard: async (): Promise<ServiceResponse<AnalyticsData>> => {
    try {
      const response = await apiClient.get('/analytics/dashboard');
      const analytics = parseEntity<AnalyticsData>(response.data);
      if (
        !analytics ||
        !analytics.summary ||
        !Array.isArray(analytics.timeline) ||
        !Array.isArray(analytics.categories)
      ) {
        throw new Error('Unexpected analytics response from the server.');
      }
      return {
        data: analytics,
        success: true,
        message: apiMessage(response.data, 'Analytics loaded.'),
        source: 'api',
      };
    } catch (error) {
      if (!shouldUseDemoFallback(error)) throw error;
      return {
        data: buildDemoAnalytics(),
        success: true,
        message:
          'Showing sample analytics. Blockchain verification figures are unavailable because no blockchain service is connected.',
        source: 'demo',
      };
    }
  },
};

export default analyticsService;