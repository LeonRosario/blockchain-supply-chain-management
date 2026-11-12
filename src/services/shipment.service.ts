import apiClient from './apiClient';
import type {
  ApiResponse,
  CreateShipmentPayload,
  PaginatedServiceResponse,
  ServiceResponse,
  Shipment,
  ShipmentFilters,
  ShipmentStats,
  ShipmentStatus,
  UpdateShipmentPayload,
} from '@/types';
import { getDemoDatabase, persistDemoDatabase, generateDemoId } from '@/data/demoStore';
import { buildTrackingEvents, generateCode, normalizeShipmentStatus } from '@/utils';
import {
  apiMessage,
  paginate,
  parseCollection,
  parseEntity,
  shouldUseDemoFallback,
} from './serviceHelpers';

function assertSuccess(payload: unknown): void {
  if (
    payload &&
    typeof payload === 'object' &&
    'success' in payload &&
    (payload as { success?: boolean }).success === false
  ) {
    throw new Error(apiMessage(payload, 'The shipment request was rejected.'));
  }
}

function matchesFilters(shipment: Shipment, filters: ShipmentFilters): boolean {
  if (filters.status && filters.status !== 'all') {
    const matches =
      shipment.status === filters.status ||
      (filters.status === 'created' && shipment.status === 'pending');
    if (!matches) return false;
  }
  if (filters.distributorId && shipment.distributorId !== filters.distributorId) {
    return false;
  }
  if (
    filters.productId &&
    !shipment.items.some((item) => item.productId === filters.productId)
  ) {
    return false;
  }
  if (filters.dateFrom) {
    if (new Date(shipment.createdAt).getTime() < new Date(filters.dateFrom).getTime()) {
      return false;
    }
  }
  if (filters.dateTo) {
    const end = new Date(filters.dateTo);
    end.setHours(23, 59, 59, 999);
    if (new Date(shipment.createdAt).getTime() > end.getTime()) return false;
  }
  if (filters.search) {
    const query = filters.search.toLowerCase();
    const haystack = [
      shipment.trackingNumber,
      shipment.origin,
      shipment.destination,
      shipment.distributorName,
      shipment.carrierName,
      ...shipment.items.flatMap((item) => [
        item.productId,
        item.productName,
        item.sku,
      ]),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    if (!haystack.includes(query)) return false;
  }
  return true;
}

function filterDemoShipments(filters: ShipmentFilters): Shipment[] {
  return getDemoDatabase()
    .shipments.filter((shipment) => matchesFilters(shipment, filters))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function paginatedResponse(
  shipments: Shipment[],
  filters: ShipmentFilters,
  source: 'api' | 'demo',
  totalOverride?: number
): PaginatedServiceResponse<Shipment> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 10;

  if (source === 'api') {
    const total = totalOverride ?? shipments.length;
    return {
      data: shipments,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      source,
      success: true,
      message: 'Shipments loaded.',
    };
  }

  const pageResult = paginate(shipments, page, limit);
  return {
    data: pageResult.items,
    total: pageResult.total,
    page: pageResult.page,
    limit: pageResult.limit,
    totalPages: pageResult.totalPages,
    source,
    success: true,
    message: 'Showing sample shipment data — backend unavailable.',
  };
}

function applyStatus(shipment: Shipment, status: ShipmentStatus): Shipment {
  const now = new Date().toISOString();
  return {
    ...shipment,
    status,
    currentLocation:
      status === 'delivered' || status === 'arrived'
        ? shipment.destination
        : status === 'returned'
          ? shipment.origin
          : shipment.currentLocation,
    actualDelivery: status === 'delivered' ? shipment.actualDelivery ?? now : shipment.actualDelivery,
    trackingEvents: buildTrackingEvents({
      status,
      createdAt: shipment.createdAt,
      origin: shipment.origin,
      destination: shipment.destination,
      currentLocation: shipment.currentLocation,
    }),
    updatedAt: now,
  };
}

const shipmentService = {
  getAll: async (
    filters: ShipmentFilters = {}
  ): Promise<PaginatedServiceResponse<Shipment>> => {
    const params = {
      search: filters.search || undefined,
      status: filters.status && filters.status !== 'all' ? filters.status : undefined,
      distributorId: filters.distributorId,
      productId: filters.productId,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      page: filters.page ?? 1,
      limit: filters.limit ?? 10,
    };

    try {
      const response = await apiClient.get('/shipments', { params });
      assertSuccess(response.data);
      const parsed = parseCollection<Shipment>(response.data);
      if (!parsed) throw new Error('Unexpected shipment response from the server.');
      return paginatedResponse(
        parsed.items,
        filters,
        'api',
        parsed.total ??
          (parsed.totalPages ? parsed.totalPages * (filters.limit ?? 10) : undefined)
      );
    } catch (error) {
      if (!shouldUseDemoFallback(error)) throw error;
      return paginatedResponse(filterDemoShipments(filters), filters, 'demo');
    }
  },

  getById: async (id: string): Promise<ServiceResponse<Shipment>> => {
    try {
      const response = await apiClient.get<ApiResponse<Shipment>>(`/shipments/${id}`);
      assertSuccess(response.data);
      const shipment = parseEntity<Shipment>(response.data);
      if (!shipment) throw new Error('Shipment not found.');
      return {
        data: shipment,
        success: true,
        message: apiMessage(response.data, 'Shipment loaded.'),
        source: 'api',
      };
    } catch (error) {
      if (!shouldUseDemoFallback(error)) throw error;
      const shipment = getDemoDatabase().shipments.find(
        (item) => item.id === id || item.trackingNumber.toLowerCase() === id.toLowerCase()
      );
      if (!shipment) throw new Error('Shipment not found.');
      return {
        data: shipment,
        success: true,
        message: 'Showing sample shipment data — backend unavailable.',
        source: 'demo',
      };
    }
  },

  getByTrackingNumber: async (trackingNumber: string): Promise<ServiceResponse<Shipment>> => {
    try {
      const response = await apiClient.get<ApiResponse<Shipment>>(
        `/shipments/track/${encodeURIComponent(trackingNumber)}`
      );
      assertSuccess(response.data);
      const shipment = parseEntity<Shipment>(response.data);
      if (!shipment) throw new Error('Shipment not found.');
      return {
        data: shipment,
        success: true,
        message: apiMessage(response.data, 'Shipment loaded.'),
        source: 'api',
      };
    } catch (error) {
      if (!shouldUseDemoFallback(error)) throw error;
      const shipment = getDemoDatabase().shipments.find(
        (item) =>
          item.trackingNumber.toLowerCase() === trackingNumber.toLowerCase() ||
          item.id === trackingNumber
      );
      if (!shipment) throw new Error('Shipment not found.');
      return {
        data: shipment,
        success: true,
        message: 'Showing sample shipment data — backend unavailable.',
        source: 'demo',
      };
    }
  },

  create: async (
    payload: CreateShipmentPayload
  ): Promise<ServiceResponse<Shipment>> => {
    try {
      const response = await apiClient.post<ApiResponse<Shipment>>('/shipments', payload);
      assertSuccess(response.data);
      const shipment = parseEntity<Shipment>(response.data);
      if (!shipment) throw new Error('Unexpected shipment response from the server.');
      return {
        data: shipment,
        success: true,
        message: apiMessage(response.data, 'Shipment created.'),
        source: 'api',
      };
    } catch (error) {
      if (!shouldUseDemoFallback(error)) throw error;

      const database = getDemoDatabase();
      const now = new Date().toISOString();
      const createdAt = payload.shipmentDate
        ? new Date(payload.shipmentDate).toISOString()
        : now;
      const trackingNumber = generateCode('SHP');
      const shipment: Shipment = {
        id: generateDemoId('shp'),
        trackingNumber,
        origin: payload.origin,
        destination: payload.destination,
        status: 'created',
        items: payload.items,
        carrierId: payload.carrierId,
        carrierName: payload.carrierName,
        distributorId: payload.distributorId,
        distributorName: payload.distributorName,
        sourceWarehouseId: payload.sourceWarehouseId,
        sourceWarehouseName: payload.sourceWarehouseName,
        destinationWarehouseId: payload.destinationWarehouseId,
        destinationWarehouseName: payload.destinationWarehouseName,
        estimatedDelivery: payload.estimatedDelivery,
        currentLocation: payload.origin,
        trackingEvents: buildTrackingEvents({
          status: 'created',
          createdAt,
          origin: payload.origin,
          destination: payload.destination,
          currentLocation: payload.origin,
        }),
        notes: payload.notes,
        createdBy: 'Demo session',
        createdAt,
        updatedAt: now,
      };
      database.shipments.unshift(shipment);
      persistDemoDatabase(database);
      return {
        data: shipment,
        success: true,
        message:
          'Shipment saved to the local demo database. It was not recorded on a blockchain.',
        source: 'demo',
      };
    }
  },

  update: async (
    id: string,
    payload: UpdateShipmentPayload
  ): Promise<ServiceResponse<Shipment>> => {
    try {
      const response = await apiClient.put<ApiResponse<Shipment>>(
        `/shipments/${id}`,
        payload
      );
      assertSuccess(response.data);
      const shipment = parseEntity<Shipment>(response.data);
      if (!shipment) throw new Error('Unexpected shipment response from the server.');
      return {
        data: shipment,
        success: true,
        message: apiMessage(response.data, 'Shipment updated.'),
        source: 'api',
      };
    } catch (error) {
      if (!shouldUseDemoFallback(error)) throw error;
      const database = getDemoDatabase();
      const index = database.shipments.findIndex((item) => item.id === id);
      if (index < 0) throw new Error('Shipment not found.');
      const current = database.shipments[index];
      let updated: Shipment = {
        ...current,
        ...payload,
        items: payload.items ?? current.items,
        updatedAt: new Date().toISOString(),
      };
      if (payload.status && payload.status !== current.status) {
        updated = applyStatus(updated, payload.status);
      }
      database.shipments[index] = updated;
      persistDemoDatabase(database);
      return {
        data: updated,
        success: true,
        message:
          'Shipment updated in the local demo database. No blockchain transaction was submitted.',
        source: 'demo',
      };
    }
  },

  updateStatus: async (
    id: string,
    status: ShipmentStatus
  ): Promise<ServiceResponse<Shipment>> => {
    try {
      const response = await apiClient.patch<ApiResponse<Shipment>>(
        `/shipments/${id}/status`,
        { status }
      );
      assertSuccess(response.data);
      const shipment = parseEntity<Shipment>(response.data);
      if (!shipment) throw new Error('Unexpected shipment response from the server.');
      return {
        data: shipment,
        success: true,
        message: apiMessage(response.data, 'Shipment status updated.'),
        source: 'api',
      };
    } catch (error) {
      if (!shouldUseDemoFallback(error)) throw error;
      const database = getDemoDatabase();
      const index = database.shipments.findIndex((item) => item.id === id);
      if (index < 0) throw new Error('Shipment not found.');
      const updated = applyStatus(database.shipments[index], status);
      database.shipments[index] = updated;
      persistDemoDatabase(database);
      return {
        data: updated,
        success: true,
        message:
          'Status updated in the local demo database. No blockchain transaction was submitted.',
        source: 'demo',
      };
    }
  },

  getStats: async (): Promise<ServiceResponse<ShipmentStats>> => {
    const response = await shipmentService.getAll({ page: 1, limit: 10_000 });
    const shipments = response.data;
    const stats: ShipmentStats = {
      total: response.total,
      created: shipments.filter(
        (shipment) => normalizeShipmentStatus(shipment.status) === 'created'
      ).length,
      inTransit: shipments.filter(
        (shipment) => normalizeShipmentStatus(shipment.status) === 'in_transit'
      ).length,
      arrived: shipments.filter(
        (shipment) => normalizeShipmentStatus(shipment.status) === 'arrived'
      ).length,
      delivered: shipments.filter((shipment) => shipment.status === 'delivered').length,
      cancelled: shipments.filter(
        (shipment) => shipment.status === 'cancelled' || shipment.status === 'returned'
      ).length,
    };
    return {
      data: stats,
      success: true,
      message: response.message,
      source: response.source,
    };
  },

  /** Backwards-compatible alias used by older modules. */
  trackByNumber: async (trackingNumber: string): Promise<ServiceResponse<Shipment>> =>
    shipmentService.getByTrackingNumber(trackingNumber),
};

export default shipmentService;