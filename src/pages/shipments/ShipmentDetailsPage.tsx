import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Copy,
  MapPin,
  Package,
  Pencil,
  RefreshCw,
  ShieldCheck,
  Truck,
  UserRound,
  Warehouse,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { useToast } from '@/components/ui';
import {
  ConfirmDialog,
  DemoDataBanner,
  ErrorMessage,
  InfoField,
} from '@/components/common';
import { ShipmentForm, ShipmentProgress, ShipmentTrackingTimeline } from '@/components/shipments';
import shipmentService from '@/services/shipment.service';
import type { CreateShipmentPayload, Shipment, ShipmentStatus } from '@/types';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getShipmentStatusMeta,
  SHIPMENT_STATUS_LABELS,
} from '@/utils';
import { errorMessage } from '@/services/serviceHelpers';

const statusOptions: ShipmentStatus[] = [
  'created',
  'dispatched',
  'in_transit',
  'arrived',
  'delivered',
  'cancelled',
  'returned',
];

export default function ShipmentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const isEditing = searchParams.get('edit') === '1';

  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [source, setSource] = useState<'api' | 'demo'>('demo');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<ShipmentStatus | ''>('');
  const [statusToApply, setStatusToApply] = useState<ShipmentStatus | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const load = useCallback(async () => {
    if (!id) {
      setError('Shipment not found.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await shipmentService.getById(id);
      setShipment(response.data);
      setSource(response.source);
    } catch (loadError) {
      setError(errorMessage(loadError, 'Shipment not found.'));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleEditSubmit = async (payload: CreateShipmentPayload) => {
    if (!shipment) return;
    const response = await shipmentService.update(shipment.id, payload);
    setShipment(response.data);
    setSource(response.source);
    setSearchParams({}, { replace: true });
    if (response.source === 'demo') {
      toast.warning(
        'Updated in demo mode',
        'Changes were stored locally. No blockchain transaction was submitted.'
      );
    } else {
      toast.success('Shipment updated');
    }
  };

  const handleConfirmStatus = async () => {
    if (!shipment || !statusToApply) return;
    setIsUpdatingStatus(true);
    try {
      const response = await shipmentService.updateStatus(shipment.id, statusToApply);
      setShipment(response.data);
      setSource(response.source);
      setStatusToApply(null);
      setSelectedStatus('');
      if (response.source === 'demo') {
        toast.warning(
          'Status updated locally',
          'The demo database was updated. No blockchain transaction was submitted.'
        );
      } else {
        toast.success(
          'Shipment status updated',
          `New status: ${SHIPMENT_STATUS_LABELS[response.data.status]}.`
        );
      }
    } catch (updateError) {
      toast.error('Status update failed', errorMessage(updateError));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCopyTracking = async () => {
    if (!shipment) return;
    try {
      await navigator.clipboard.writeText(shipment.trackingNumber);
      toast.success('Tracking number copied');
    } catch {
      toast.error('Could not copy tracking number');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-1/3 rounded bg-muted" />
        <div className="h-48 rounded-xl bg-muted" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-80 rounded-xl bg-muted lg:col-span-2" />
          <div className="h-80 rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/shipments')}
            aria-label="Back to shipments"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Shipment Details</h1>
        </div>
        <Card>
          <CardContent className="space-y-4 p-8 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
            <h2 className="text-lg font-semibold">Shipment could not be loaded</h2>
            <ErrorMessage message={error ?? 'Shipment not found.'} className="mx-auto max-w-lg" />
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={load}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
              <Button onClick={() => navigate('/shipments')}>Back to shipments</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchParams({}, { replace: true })}
            aria-label="Cancel editing"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Shipment</h1>
            <p className="mt-1 font-mono text-sm text-muted-foreground">
              {shipment.trackingNumber}
            </p>
          </div>
        </div>
        <ShipmentForm
          initialShipment={shipment}
          onSubmit={handleEditSubmit}
          onCancel={() => setSearchParams({}, { replace: true })}
        />
      </div>
    );
  }

  const statusMeta = getShipmentStatusMeta(shipment.status);
  const totalUnits = shipment.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = shipment.items.reduce(
    (sum, item) => sum + (item.unitPrice ?? 0) * item.quantity,
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/shipments')}
            aria-label="Back to shipments"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-mono text-2xl font-bold tracking-tight sm:text-3xl">
                {shipment.trackingNumber}
              </h1>
              <span
                className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                  statusMeta.tone === 'success'
                    ? 'border-green-200 bg-green-100 text-green-800'
                    : statusMeta.tone === 'warning'
                      ? 'border-amber-200 bg-amber-100 text-amber-800'
                      : statusMeta.tone === 'danger'
                        ? 'border-red-200 bg-red-100 text-red-800'
                        : statusMeta.tone === 'purple'
                          ? 'border-violet-200 bg-violet-100 text-violet-800'
                          : 'border-blue-200 bg-blue-100 text-blue-800'
                }`}
              >
                {statusMeta.label}
              </span>
              {source === 'demo' && (
                <span className="rounded-full border border-amber-200 bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                  Demo record
                </span>
              )}
            </div>
            <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              Current location: {shipment.currentLocation ?? shipment.origin}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleCopyTracking}>
            <Copy className="mr-2 h-4 w-4" />
            Copy tracking ID
          </Button>
          <Button onClick={() => setSearchParams({ edit: '1' })}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit shipment
          </Button>
        </div>
      </div>

      {source === 'demo' && (
        <DemoDataBanner
          title="Demo shipment record"
          message="This shipment exists only in the local demo database. Tracking events and status changes are not stored on a blockchain."
        />
      )}

      <Card>
        <CardContent className="space-y-6 p-6">
          <ShipmentProgress status={shipment.status} />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <InfoField
              label="Shipment created"
              value={formatDateTime(shipment.createdAt)}
              icon={CalendarDays}
            />
            <InfoField
              label="Expected delivery"
              value={formatDate(shipment.estimatedDelivery)}
              icon={CalendarDays}
            />
            <InfoField
              label="Delivered"
              value={shipment.actualDelivery ? formatDateTime(shipment.actualDelivery) : 'Not delivered'}
              icon={CheckCircle2}
            />
            <InfoField
              label="Total units"
              value={totalUnits.toLocaleString()}
              icon={Package}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Tracking timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ShipmentTrackingTimeline shipment={shipment} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Update status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Record the next operational stage for this shipment. The selected status is
                confirmed before it is saved.
              </p>
              <select
                value={selectedStatus}
                onChange={(event) =>
                  setSelectedStatus(event.target.value as ShipmentStatus | '')
                }
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                aria-label="Select new shipment status"
              >
                <option value="">Select a new status</option>
                {statusOptions
                  .filter((status) => status !== shipment.status)
                  .map((status) => (
                    <option key={status} value={status}>
                      {SHIPMENT_STATUS_LABELS[status]}
                    </option>
                  ))}
              </select>
              <Button
                className="w-full"
                disabled={!selectedStatus}
                onClick={() => {
                  if (!selectedStatus) return;
                  setStatusToApply(selectedStatus);
                }}
              >
                Apply status update
              </Button>
              {source === 'demo' && (
                <p className="text-xs text-amber-700">
                  Demo mode: status changes are saved locally, not on-chain.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Route & assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoField
                label="Source warehouse"
                value={shipment.sourceWarehouseName ?? shipment.origin}
                icon={Warehouse}
              />
              <InfoField
                label="Destination warehouse"
                value={shipment.destinationWarehouseName ?? shipment.destination}
                icon={Warehouse}
              />
              <InfoField
                label="Distributor"
                value={shipment.distributorName ?? 'Not assigned'}
                icon={UserRound}
              />
              <InfoField
                label="Transporter"
                value={shipment.carrierName ?? shipment.carrierId ?? 'Not assigned'}
                icon={Truck}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Shipment items
            <span className="text-sm font-normal text-muted-foreground">
              ({shipment.items.length} lines)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Product ID</th>
                  <th className="px-3 py-2 font-medium">Product</th>
                  <th className="px-3 py-2 font-medium">SKU</th>
                  <th className="px-3 py-2 text-right font-medium">Quantity</th>
                  <th className="px-3 py-2 text-right font-medium">Unit price</th>
                  <th className="px-3 py-2 text-right font-medium">Line total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {shipment.items.map((item) => (
                  <tr key={`${item.productId}-${item.sku ?? ''}`}>
                    <td className="px-3 py-3 font-mono text-xs">{item.productId}</td>
                    <td className="px-3 py-3 font-medium">
                      {item.productName ?? '—'}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{item.sku ?? '—'}</td>
                    <td className="px-3 py-3 text-right">{item.quantity}</td>
                    <td className="px-3 py-3 text-right">
                      {item.unitPrice !== undefined ? formatCurrency(item.unitPrice) : '—'}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {item.unitPrice !== undefined
                        ? formatCurrency(item.unitPrice * item.quantity)
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              {totalValue > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan={5} className="px-3 py-3 text-right font-medium">
                      Total declared value
                    </td>
                    <td className="px-3 py-3 text-right font-semibold">
                      {formatCurrency(totalValue)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Route details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">From</p>
                <p className="truncate font-medium">{shipment.origin}</p>
              </div>
              <ArrowRight className="hidden h-5 w-5 shrink-0 text-muted-foreground sm:block" />
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">To</p>
                <p className="truncate font-medium">{shipment.destination}</p>
              </div>
            </div>
            <InfoField label="Notes" value={shipment.notes || 'No notes provided.'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Blockchain reference
            </CardTitle>
          </CardHeader>
          <CardContent>
            {shipment.blockchainHash && source === 'api' ? (
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Shipment hash returned by the backend
                </p>
                <p className="break-all rounded-md bg-muted p-3 font-mono text-xs">
                  {shipment.blockchainHash}
                </p>
                <p className="text-xs text-muted-foreground">
                  A hash reference does not by itself confirm product authenticity. Use the
                  verification module for an authenticity result.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                No blockchain transaction reference is available for this shipment.
                {source === 'demo' && ' Demo shipments are never submitted on-chain.'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        isOpen={Boolean(statusToApply)}
        title="Confirm status update"
        description={
          <div className="space-y-2">
            <p>
              Change this shipment from{' '}
              <strong>{SHIPMENT_STATUS_LABELS[shipment.status]}</strong> to{' '}
              <strong>
                {statusToApply ? SHIPMENT_STATUS_LABELS[statusToApply] : ''}
              </strong>
              ?
            </p>
            {source === 'demo' && (
              <p className="text-amber-700">
                This updates the local demo database only. It will not create a blockchain
                transaction.
              </p>
            )}
          </div>
        }
        confirmLabel="Update status"
        isLoading={isUpdatingStatus}
        onConfirm={handleConfirmStatus}
        onClose={() => !isUpdatingStatus && setStatusToApply(null)}
      />
    </div>
  );
}