import type { Shipment } from '@/types';
import { Timeline } from '@/components/common';
import type { TimelineEntry } from '@/components/common/Timeline';
import { getShipmentTimeline, SHIPMENT_STAGE_LABELS } from '@/utils';

interface ShipmentTrackingTimelineProps {
  shipment: Shipment;
}

export default function ShipmentTrackingTimeline({
  shipment,
}: ShipmentTrackingTimelineProps) {
  const events = getShipmentTimeline(shipment);
  const entries: TimelineEntry[] = events.map((event) => ({
    id: event.id,
    title: event.title || SHIPMENT_STAGE_LABELS[event.stage],
    description: event.details,
    timestamp: event.timestamp,
    location: event.location || undefined,
    completed: event.completed,
    meta: event.completed ? 'Completed' : 'Pending',
  }));

  return <Timeline items={entries} emptyMessage="No tracking events recorded yet." />;
}