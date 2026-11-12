import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Clock,
  Eye,
  PackageCheck,
  Pencil,
  Plus,
  RotateCcw,
  Truck,
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
  Pagination,
  SearchInput,
  StatusBadge,
  TableSkeleton,
} from '@/components/common';
import { StatsCard } from '@/components/dashboard';
import shipmentService from '@/services/shipment.service';
import distributorService from '@/services/distributor.service';
import type {
  Distributor,
  Shipment,
  ShipmentFilters,
  ShipmentStats,
  ShipmentStatus,
} from '@/types';
import {
  formatDate,
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

export default function ShipmentsPage() {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [stats, setStats] = useState<ShipmentStats | null>(null);
  const [source, setSource] = useState<'api' | 'demo'>('demo');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ShipmentStatus | 'all'>('all');
  const [distributorId, setDistributorId] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const filters: ShipmentFilters = {
      search: search.trim() || undefined,
      status,
      distributorId: distributorId === 'all' ? undefined : distributorId,
      page,
      limit,
    };
    try {
      const response = await shipmentService.getAll(filters);
      setShipments(response.data);
      setTotal(response.total);
      setTotalPages(response.totalPages);
      setSource(response.source);
    } catch (loadError) {
      setError(errorMessage(loadError, 'Unable to load shipments.'));
    } finally {
      setIsLoading(false);
    }
  }, [search, status, distributorId, page, limit]);

  useEffect(() => {
    const timer = window.setTimeout(load, search ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [load, search]);

  useEffect(() => {
    let active = true;
    Promise.allSettled([distributorService.getAll(), shipmentService.getStats()]).then(
      ([distributorResult, statsResult]) => {
        if (!active) return;
        if (distributorResult.status === 'fulfilled') {
          setDistributors(distributorResult.value.data);
        }
        if (statsResult.status === 'fulfilled') {
          setStats(statsResult.value.data);
          setSource((current) =>
            statsResult.value.source === 'demo' ? 'demo' : current
          );
        }
      }
    );
    return () => {
      active = false;
    };
  }, []);

  const handleResetFilters = () => {
    setSearch('');
    setStatus('all');
    setDistributorId('all');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shipments</h1>
          <p className="mt-1 text-muted-foreground">
            Create, assign, and monitor product shipments across the network.
          </p>
        </div>
        <Button asChild>
          <Link to="/shipments/create">
            <Plus className="mr-2 h-4 w-4" />
            Create shipment
          </Link>
        </Button>
      </div>

      {source === 'demo' && (
        <DemoDataBanner
          title="Demo shipment data"
          message="The shipment API is unavailable. Records on this page come from the local demo database and are not blockchain-backed."
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Total shipments"
          value={stats?.total ?? 0}
          icon={Truck}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatsCard
          title="In transit"
          value={stats?.inTransit ?? 0}
          icon={ArrowRight}
          iconColor="text-amber-600"
          bgColor="bg-amber-50"
        />
        <StatsCard
          title="Delivered"
          value={stats?.delivered ?? 0}
          icon={PackageCheck}
          iconColor="text-green-600"
          bgColor="bg-green-50"
        />
        <StatsCard
          title="Created / pending"
          value={(stats?.created ?? 0) + (stats?.arrived ?? 0)}
          icon={Clock}
          iconColor="text-violet-600"
          bgColor="bg-violet-50"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Shipment list</CardTitle>
          <Button variant="ghost" size="sm" onClick={handleResetFilters}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset filters
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-3 lg:flex-row">
            <SearchInput
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Search tracking number, product, route, or distributor…"
              ariaLabel="Search shipments"
            />
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as ShipmentStatus | 'all');
                setPage(1);
              }}
              className="h-9 rounded-md border bg-background px-3 text-sm"
              aria-label="Filter by shipment status"
            >
              <option value="all">All statuses</option>
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {SHIPMENT_STATUS_LABELS[option]}
                </option>
              ))}
            </select>
            <select
              value={distributorId}
              onChange={(event) => {
                setDistributorId(event.target.value);
                setPage(1);
              }}
              className="h-9 rounded-md border bg-background px-3 text-sm"
              aria-label="Filter by distributor"
            >
              <option value="all">All distributors</option>
              {distributors.map((distributor) => (
                <option key={distributor.id} value={distributor.id}>
                  {distributor.name}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="mb-4 space-y-2">
              <ErrorMessage message={error} />
              <Button variant="outline" size="sm" onClick={load}>
                Try again
              </Button>
            </div>
          )}

          {isLoading ? (
            <TableSkeleton rows={6} columns={6} />
          ) : shipments.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="No shipments found"
              description={
                search || status !== 'all' || distributorId !== 'all'
                  ? 'No shipments match the current filters.'
                  : 'Create the first shipment to start tracking products.'
              }
              action={
                search || status !== 'all' || distributorId !== 'all' ? (
                  <Button variant="outline" onClick={handleResetFilters}>
                    Clear filters
                  </Button>
                ) : (
                  <Button asChild>
                    <Link to="/shipments/create">
                      <Plus className="mr-2 h-4 w-4" />
                      Create shipment
                    </Link>
                  </Button>
                )
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-3 font-medium">Tracking number</th>
                    <th className="px-3 py-3 font-medium">Products</th>
                    <th className="px-3 py-3 font-medium">Route</th>
                    <th className="px-3 py-3 font-medium">Distributor</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium">Expected</th>
                    <th className="px-3 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {shipments.map((shipment) => {
                    const statusMeta = getShipmentStatusMeta(shipment.status);
                    return (
                      <tr key={shipment.id} className="hover:bg-muted/40">
                        <td className="px-3 py-3">
                          <Link
                            to={`/shipments/${shipment.id}`}
                            className="font-mono text-sm font-medium text-primary hover:underline"
                          >
                            {shipment.trackingNumber}
                          </Link>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {formatDate(shipment.createdAt)}
                          </p>
                        </td>
                        <td className="px-3 py-3">
                          <p className="font-medium">
                            {shipment.items[0]?.productName ??
                              shipment.items[0]?.productId ??
                              '—'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {shipment.items.length} line
                            {shipment.items.length === 1 ? '' : 's'} ·{' '}
                            {shipment.items.reduce((sum, item) => sum + item.quantity, 0)} units
                          </p>
                        </td>
                        <td className="px-3 py-3">
                          <p className="max-w-[220px] truncate">{shipment.origin}</p>
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <ArrowRight className="h-3 w-3" />
                            {shipment.destination}
                          </p>
                        </td>
                        <td className="px-3 py-3">
                          {shipment.distributorName ?? '—'}
                        </td>
                        <td className="px-3 py-3">
                          <StatusBadge
                            label={statusMeta.label}
                            tone={statusMeta.tone}
                            dot
                          />
                        </td>
                        <td className="px-3 py-3">
                          {formatDate(shipment.estimatedDelivery)}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => navigate(`/shipments/${shipment.id}`)}
                              aria-label={`View ${shipment.trackingNumber}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                navigate(`/shipments/${shipment.id}?edit=1`)
                              }
                              aria-label={`Edit ${shipment.trackingNumber}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && shipments.length > 0 && (
            <div className="mt-4">
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                limit={limit}
                onPageChange={setPage}
                onLimitChange={(value) => {
                  setLimit(value);
                  setPage(1);
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}