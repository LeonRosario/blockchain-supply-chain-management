import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Mail,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  Truck,
  UserRound,
  Warehouse as WarehouseIcon,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import {
  DemoDataBanner,
  EmptyState,
  ErrorMessage,
  InfoField,
  StatusBadge,
} from '@/components/common';
import warehouseService from '@/services/warehouse.service';
import inventoryService from '@/services/inventory.service';
import shipmentService from '@/services/shipment.service';
import type { Inventory, Shipment, Warehouse } from '@/types';
import {
  formatDate,
  formatDateTime,
  formatNumber,
  getShipmentStatusMeta,
  getWarehouseStatusMeta,
} from '@/utils';
import { errorMessage } from '@/services/serviceHelpers';

export default function WarehouseDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [source, setSource] = useState<'api' | 'demo'>('demo');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedError, setRelatedError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setError('Warehouse not found.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    setRelatedError(null);
    try {
      const warehouseResult = await warehouseService.getById(id);
      setWarehouse(warehouseResult.data);
      setSource(warehouseResult.source);

      const [inventoryResult, shipmentResult] = await Promise.allSettled([
        inventoryService.getAll({ warehouseId: warehouseResult.data.id }),
        shipmentService.getAll({ page: 1, limit: 10_000 }),
      ]);

      if (inventoryResult.status === 'fulfilled') {
        setInventory(inventoryResult.value.data);
        if (inventoryResult.value.source === 'demo') setSource('demo');
      } else {
        setRelatedError('Associated inventory could not be loaded.');
      }

      if (shipmentResult.status === 'fulfilled') {
        setShipments(
          shipmentResult.value.data.filter(
            (shipment) =>
              shipment.sourceWarehouseId === warehouseResult.data.id ||
              shipment.destinationWarehouseId === warehouseResult.data.id
          )
        );
        if (shipmentResult.value.source === 'demo') setSource('demo');
      }
    } catch (loadError) {
      setError(errorMessage(loadError, 'Warehouse not found.'));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-1/3 rounded bg-muted" />
        <div className="h-40 rounded-xl bg-muted" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-72 rounded-xl bg-muted lg:col-span-2" />
          <div className="h-72 rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  if (error || !warehouse) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/warehouses')}
            aria-label="Back to warehouses"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Warehouse Details</h1>
        </div>
        <Card>
          <CardContent className="space-y-4 p-8 text-center">
            <WarehouseIcon className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Warehouse could not be loaded</h2>
            <ErrorMessage
              message={error ?? 'Warehouse not found.'}
              className="mx-auto max-w-lg"
            />
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={load}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
              <Button onClick={() => navigate('/warehouses')}>Back to warehouses</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const meta = getWarehouseStatusMeta(warehouse.status);
  const usage =
    warehouse.capacity > 0
      ? Math.min(100, Math.round((warehouse.occupied / warehouse.capacity) * 100))
      : 0;
  const availableCapacity = Math.max(0, warehouse.capacity - warehouse.occupied);
  const availableStock = inventory.reduce(
    (sum, item) => sum + Math.max(0, item.quantity - (item.reservedQuantity ?? 0)),
    0
  );
  const outbound = shipments.filter(
    (shipment) => shipment.sourceWarehouseId === warehouse.id
  );
  const inbound = shipments.filter(
    (shipment) => shipment.destinationWarehouseId === warehouse.id
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/warehouses')}
            aria-label="Back to warehouses"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <p className="font-mono text-sm text-muted-foreground">{warehouse.code}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {warehouse.name}
              </h1>
              <StatusBadge label={meta.label} tone={meta.tone} dot />
              {source === 'demo' && (
                <StatusBadge label="Demo record" tone="warning" />
              )}
            </div>
            <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {warehouse.address}, {warehouse.city}
              {warehouse.state ? `, ${warehouse.state}` : ''}, {warehouse.country}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={load}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {source === 'demo' && (
        <DemoDataBanner
          title="Demo warehouse record"
          message="This facility and its associated inventory exist in the local demo database only. They are not live warehouse figures or blockchain records."
        />
      )}

      {relatedError && <ErrorMessage message={relatedError} />}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Capacity</p>
          <p className="mt-1 text-2xl font-bold">{formatNumber(warehouse.capacity)}</p>
          <p className="text-xs text-muted-foreground">units</p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Occupied</p>
          <p className="mt-1 text-2xl font-bold">{formatNumber(warehouse.occupied)}</p>
          <p className="text-xs text-muted-foreground">{usage}% utilization</p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Available capacity</p>
          <p className="mt-1 text-2xl font-bold">{formatNumber(availableCapacity)}</p>
          <p className="text-xs text-muted-foreground">remaining units</p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Available stock</p>
          <p className="mt-1 text-2xl font-bold">{formatNumber(availableStock)}</p>
          <p className="text-xs text-muted-foreground">
            across {inventory.length} stock record{inventory.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Facility information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoField label="Manager" value={warehouse.manager ?? 'Not assigned'} icon={UserRound} />
              <InfoField label="Status" value={meta.label} icon={WarehouseIcon} />
              <InfoField label="Contact name" value={warehouse.contactName} icon={UserRound} />
              <InfoField label="Contact email" value={warehouse.contactEmail} icon={Mail} />
              <InfoField label="Contact phone" value={warehouse.contactPhone} icon={Phone} />
              <InfoField
                label="Postal code"
                value={warehouse.postalCode ?? '—'}
                icon={MapPin}
              />
              <InfoField
                label="Created"
                value={formatDateTime(warehouse.createdAt)}
              />
              <InfoField
                label="Last updated"
                value={formatDateTime(warehouse.updatedAt)}
              />
            </div>
            <InfoField label="Notes" value={warehouse.notes || 'No notes recorded.'} />
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Capacity utilization</span>
                <span className="font-medium">{usage}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${
                    usage >= 90 ? 'bg-red-500' : usage >= 70 ? 'bg-amber-500' : 'bg-primary'
                  }`}
                  style={{ width: `${usage}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Shipment activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoField label="Outbound shipments" value={outbound.length} />
            <InfoField label="Inbound shipments" value={inbound.length} />
            <InfoField
              label="In transit to here"
              value={
                inbound.filter((shipment) => shipment.status === 'in_transit').length
              }
            />
            <Link
              to="/shipments"
              className="inline-flex items-center text-sm font-medium text-primary hover:underline"
            >
              View all shipments
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory at this warehouse
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inventory.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No stock recorded here"
              description="Inventory assigned to this warehouse will appear in this table."
              action={
                <Button asChild variant="outline">
                  <Link to="/inventory">Open inventory</Link>
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-3 font-medium">Product</th>
                    <th className="px-3 py-3 font-medium">SKU</th>
                    <th className="px-3 py-3 text-right font-medium">Total</th>
                    <th className="px-3 py-3 text-right font-medium">Reserved</th>
                    <th className="px-3 py-3 text-right font-medium">Available</th>
                    <th className="px-3 py-3 text-right font-medium">Reorder at</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {inventory.map((item) => {
                    const available = Math.max(
                      0,
                      item.quantity - (item.reservedQuantity ?? 0)
                    );
                    return (
                      <tr key={item.id} className="hover:bg-muted/40">
                        <td className="px-3 py-3 font-medium">
                          {item.productName ?? item.productId}
                        </td>
                        <td className="px-3 py-3 font-mono text-xs">{item.sku ?? '—'}</td>
                        <td className="px-3 py-3 text-right">
                          {formatNumber(item.quantity)}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {formatNumber(item.reservedQuantity ?? 0)}
                        </td>
                        <td className="px-3 py-3 text-right font-semibold">
                          {formatNumber(available)}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {formatNumber(item.reorderLevel)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Associated shipments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {shipments.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="No shipments for this warehouse"
              description="Shipments originating from or arriving at this facility will appear here."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-3 font-medium">Tracking</th>
                    <th className="px-3 py-3 font-medium">Direction</th>
                    <th className="px-3 py-3 font-medium">Product</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium">Expected</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {shipments.map((shipment) => {
                    const shipmentMeta = getShipmentStatusMeta(shipment.status);
                    return (
                      <tr key={shipment.id} className="hover:bg-muted/40">
                        <td className="px-3 py-3">
                          <Link
                            to={`/shipments/${shipment.id}`}
                            className="font-mono font-medium text-primary hover:underline"
                          >
                            {shipment.trackingNumber}
                          </Link>
                        </td>
                        <td className="px-3 py-3">
                          {shipment.sourceWarehouseId === warehouse.id
                            ? 'Outbound'
                            : 'Inbound'}
                        </td>
                        <td className="px-3 py-3">
                          {shipment.items[0]?.productName ??
                            shipment.items[0]?.productId ??
                            '—'}
                        </td>
                        <td className="px-3 py-3">
                          <StatusBadge
                            label={shipmentMeta.label}
                            tone={shipmentMeta.tone}
                            dot
                          />
                        </td>
                        <td className="px-3 py-3">
                          {formatDate(shipment.estimatedDelivery)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}