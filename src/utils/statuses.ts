import type {
  AuthenticityStatus,
  DistributorStatus,
  MovementType,
  OwnershipTransferStatus,
  ShipmentStatus,
  TransactionStatus,
  UserStatus,
  WarehouseStatus,
} from '@/types';
import type { StatusTone } from '@/components/common/StatusBadge';
import { SHIPMENT_STATUS_LABELS } from './shipment';

export interface StatusMeta {
  label: string;
  tone: StatusTone;
}

export function getShipmentStatusMeta(status: ShipmentStatus): StatusMeta {
  const tones: Record<ShipmentStatus, StatusTone> = {
    pending: 'info',
    created: 'info',
    dispatched: 'purple',
    in_transit: 'warning',
    arrived: 'info',
    delivered: 'success',
    cancelled: 'danger',
    returned: 'neutral',
  };
  return { label: SHIPMENT_STATUS_LABELS[status] ?? status, tone: tones[status] ?? 'neutral' };
}

export function getWarehouseStatusMeta(status: WarehouseStatus): StatusMeta {
  const map: Record<WarehouseStatus, StatusMeta> = {
    active: { label: 'Active', tone: 'success' },
    maintenance: { label: 'Maintenance', tone: 'warning' },
    inactive: { label: 'Inactive', tone: 'neutral' },
  };
  return map[status] ?? { label: status, tone: 'neutral' };
}

export function getDistributorStatusMeta(status: DistributorStatus): StatusMeta {
  const map: Record<DistributorStatus, StatusMeta> = {
    active: { label: 'Active', tone: 'success' },
    inactive: { label: 'Inactive', tone: 'neutral' },
    suspended: { label: 'Suspended', tone: 'danger' },
  };
  return map[status] ?? { label: status, tone: 'neutral' };
}

export function getTransactionStatusMeta(status: TransactionStatus): StatusMeta {
  const map: Record<TransactionStatus, StatusMeta> = {
    confirmed: { label: 'Confirmed', tone: 'success' },
    pending: { label: 'Pending', tone: 'warning' },
    failed: { label: 'Failed', tone: 'danger' },
  };
  return map[status] ?? { label: status, tone: 'neutral' };
}

export function getOwnershipStatusMeta(status: OwnershipTransferStatus): StatusMeta {
  const map: Record<OwnershipTransferStatus, StatusMeta> = {
    confirmed: { label: 'Blockchain confirmed', tone: 'success' },
    pending: { label: 'Awaiting confirmation', tone: 'warning' },
    failed: { label: 'Failed', tone: 'danger' },
    demo: { label: 'Demo record', tone: 'info' },
  };
  return map[status] ?? { label: status, tone: 'neutral' };
}

export function getAuthenticityMeta(status: AuthenticityStatus): StatusMeta {
  const map: Record<AuthenticityStatus, StatusMeta> = {
    verified: { label: 'Blockchain Verified', tone: 'success' },
    not_verified: { label: 'Not Verified', tone: 'danger' },
    unavailable: { label: 'Verification Unavailable', tone: 'warning' },
    not_found: { label: 'No Blockchain Record', tone: 'danger' },
  };
  return map[status] ?? { label: status, tone: 'neutral' };
}

export function getMovementTypeMeta(type: MovementType): StatusMeta {
  const map: Record<MovementType, StatusMeta> = {
    inbound: { label: 'Inbound', tone: 'success' },
    outbound: { label: 'Outbound', tone: 'info' },
    adjustment: { label: 'Adjustment', tone: 'warning' },
    return: { label: 'Return', tone: 'purple' },
    reservation: { label: 'Reservation', tone: 'neutral' },
  };
  return map[type] ?? { label: type, tone: 'neutral' };
}

export function getUserStatusMeta(status: UserStatus): StatusMeta {
  const map: Record<UserStatus, StatusMeta> = {
    active: { label: 'Active', tone: 'success' },
    inactive: { label: 'Inactive', tone: 'neutral' },
    suspended: { label: 'Suspended', tone: 'danger' },
  };
  return map[status] ?? { label: status, tone: 'neutral' };
}