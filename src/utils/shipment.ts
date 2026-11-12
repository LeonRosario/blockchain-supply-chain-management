import type {
  Shipment,
  ShipmentStage,
  ShipmentStatus,
  ShipmentTrackingEvent,
} from '@/types';

export const SHIPMENT_STAGES: ShipmentStage[] = [
  'created',
  'dispatched',
  'in_transit',
  'arrived',
  'delivered',
];

export const SHIPMENT_STAGE_LABELS: Record<ShipmentStage, string> = {
  created: 'Created',
  dispatched: 'Dispatched',
  in_transit: 'In Transit',
  arrived: 'Arrived at Warehouse',
  delivered: 'Delivered',
};

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  pending: 'Created',
  created: 'Created',
  dispatched: 'Dispatched',
  in_transit: 'In Transit',
  arrived: 'Arrived at Warehouse',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
};

export function normalizeShipmentStatus(status: ShipmentStatus): ShipmentStage | ShipmentStatus {
  return status === 'pending' ? 'created' : status;
}

/** Progress across the 5 shipment stages (0–100). */
export function getShipmentProgress(status: ShipmentStatus): number {
  if (status === 'cancelled') return 0;
  if (status === 'returned') return 100;
  const normalized = normalizeShipmentStatus(status);
  const index = SHIPMENT_STAGES.indexOf(normalized as ShipmentStage);
  if (index < 0) return 0;
  return Math.round(((index + 1) / SHIPMENT_STAGES.length) * 100);
}

export function getCompletedStageCount(status: ShipmentStatus): number {
  const normalized = normalizeShipmentStatus(status);
  const index = SHIPMENT_STAGES.indexOf(normalized as ShipmentStage);
  if (status === 'returned') return SHIPMENT_STAGES.length;
  return index < 0 ? 0 : index + 1;
}

interface TrackingContext {
  status: ShipmentStatus;
  createdAt: string;
  origin: string;
  destination: string;
  currentLocation?: string;
}

/**
 * Build a coherent, deterministic tracking timeline from a shipment status.
 * Used for local demo records (clearly labelled in the UI) and as a fallback
 * when an API shipment does not include its own timeline.
 */
export function buildTrackingEvents({
  status,
  createdAt,
  origin,
  destination,
  currentLocation,
}: TrackingContext): ShipmentTrackingEvent[] {
  const completedCount = getCompletedStageCount(status);
  const start = new Date(createdAt).getTime();
  const day = 24 * 60 * 60 * 1000;
  const step = 16 * 60 * 60 * 1000;
  const locations: Record<ShipmentStage, string> = {
    created: origin,
    dispatched: origin,
    in_transit: currentLocation || 'Regional transit hub',
    arrived: destination,
    delivered: destination,
  };
  const details: Record<ShipmentStage, string> = {
    created: 'Shipment record created and products allocated.',
    dispatched: 'Shipment sealed and handed to the transporter.',
    in_transit: 'Shipment is moving through the transport network.',
    arrived: 'Shipment arrived at the destination warehouse.',
    delivered: 'Shipment was delivered and signed for.',
  };

  return SHIPMENT_STAGES.map((stage, index) => {
    const completed = index < completedCount;
    return {
      id: `${stage}-${index}`,
      stage,
      title: SHIPMENT_STAGE_LABELS[stage],
      location: completed ? locations[stage] : '',
      timestamp: completed ? new Date(start + index * (day + step)).toISOString() : undefined,
      details: details[stage],
      completed,
    };
  });
}

export function getShipmentTimeline(shipment: Shipment): ShipmentTrackingEvent[] {
  if (shipment.trackingEvents && shipment.trackingEvents.length > 0) {
    return shipment.trackingEvents;
  }
  return buildTrackingEvents({
    status: shipment.status,
    createdAt: shipment.createdAt,
    origin: shipment.origin,
    destination: shipment.destination,
    currentLocation: shipment.currentLocation,
  });
}

/** The next operational statuses an operator can select. */
export function getNextShipmentStatuses(status: ShipmentStatus): ShipmentStage[] {
  const normalized = normalizeShipmentStatus(status) as ShipmentStage;
  const index = SHIPMENT_STAGES.indexOf(normalized);
  return SHIPMENT_STAGES.slice(index + 1);
}