import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CalendarRange,
  Download,
  Eye,
  History,
  PackageCheck,
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
import { useToast } from '@/components/ui';
import {
  DemoDataBanner,
  EmptyState,
  ErrorMessage,
  Pagination,
  SearchInput,
  StatusBadge,
  TableSkeleton,
} from '@/components/common';
import shipmentService from '@/services/shipment.service';
import distributorService from '@/services/distributor.service';
import type { Distributor, Shipment, ShipmentStatus } from '@/types';
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

export default function ShipmentHistoryPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [source, setSource] = useState<'api' | 'demo'>('demo');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ShipmentStatus | 'all'>('all');
  const [productId, setProductId] = useState('all');
  const [distributorId, setDistributorId] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      const [shipmentResult, distributorResult] = await Promise.allSettled([
        shipmentService.getAll({ page: 1, limit: 10_000 }),
        distributorService.getAll(),
      ]);
      if (!active) return;
      if (shipmentResult.status === 'fulfilled') {
        setShipments(shipmentResult.value.data);
        setSource(shipmentResult.value.source);
      } else {
        setError(errorMessage(shipmentResult.reason, 'Unable to load shipment history.'));
      }
      if (distributorResult.status === 'fulfilled') {
        setDistributors(distributorResult.value.data);
      }
      setIsLoading(false);
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const productOptions = useMemo(() => {
    const map = new Map<string, string>();
    shipments.forEach((shipment) => {
      shipment.items.forEach((item) => {
        map.set(item.productId, item.productName ?? item.productId);
      });
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [shipments]);

  const filtered = useMemo(() => {
    return shipments
      .filter((shipment) => {
        if (status !== 'all' && shipment.status !== status) return false;
        if (distributorId !== 'all' && shipment.distributorId !== distributorId) return false;
        if (
          productId !== 'all' &&
          !shipment.items.some((item) => item.productId === productId)
        ) {
          return false;
        }
        if (dateFrom && new Date(shipment.createdAt) < new Date(dateFrom)) return false;
        if (dateTo) {
          const end = new Date(dateTo);
          end.setHours(23, 59, 59, 999);
          if (new Date(shipment.createdAt) > end) return false;
        }
        if (search) {
          const query = search.toLowerCase();
          const haystack = [
            shipment.trackingNumber,
            shipment.origin,
            shipment.destination,
            shipment.distributorName,
            shipment.carrierName,
            ...shipment.items.flatMap((item) => [item.productId, item.productName, item.sku]),
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          if (!haystack.includes(query)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [shipments, status, distributorId, productId, dateFrom, dateTo, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / limit));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * limit, currentPage * limit);

  const stats = {
    total: shipments.length,
    delivered: shipments.filter((shipment) => shipment.status === 'delivered').length,
    active: shipments.filter((shipment) =>
      ['created', 'pending', 'dispatched', 'in_transit', 'arrived'].includes(shipment.status)
    ).length,
    closed: shipments.filter((shipment) =>
      ['cancelled', 'returned'].includes(shipment.status)
    ).length,
  };

  const resetFilters = () => {
    setSearch('');
    setStatus('all');
    setProductId('all');
    setDistributorId('all');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const exportCsv = () => {
    if (filtered.length === 0) {
      toast.error('Nothing to export', 'No shipments match the current filters.');
      return;
    }
    const header = [
      'Tracking number',
      'Created',
      'Status',
      'Origin',
      'Destination',
      'Distributor',
      'Transporter',
      'Products',
      'Units',
      'Expected delivery',
      'Actual delivery',
    ];
    const rows = filtered.map((shipment) => [
      shipment.trackingNumber,
      shipment.createdAt,
      SHIPMENT_STATUS_LABELS[shipment.status],
      shipment.origin,
      shipment.destination,
      shipment.distributorName ?? '',
      shipment.carrierName ?? shipment.carrierId,
      shipment.items.map((item) => `${item.productId} x${item.quantity}`).join('; '),
      shipment.items.reduce((sum, item) => sum + item.quantity, 0),
      shipment.estimatedDelivery,
      shipment.actualDelivery ?? '',
    ]);
    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shipment-history-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Shipment history exported', `${filtered.length} records written to CSV.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shipment History</h1>
          <p className="mt-1 text-muted-foreground">
            Review every shipment with product, distributor, status, and date filters.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button asChild>
            <Link to="/shipments">
              <Truck className="mr-2 h-4 w-4" />
              Shipments
            </Link>
          </Button>
        </div>
      </div>

      {source === 'demo' && (
        <DemoDataBanner
          title="Demo shipment history"
          message="The history below comes from the local demo database. It is not an immutable blockchain ledger."
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'All shipments', value: stats.total, icon: History, color: 'text-blue-600 bg-blue-50' },
          { label: 'Delivered', value: stats.delivered, icon: PackageCheck, color: 'text-green-600 bg-green-50' },
          { label: 'Active', value: stats.active, icon: Truck, color: 'text-amber-600 bg-amber-50' },
          { label: 'Cancelled / returned', value: stats.closed, icon: CalendarRange, color: 'text-slate-600 bg-slate-50' },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-2xl font-bold">{item.value}</p>
              </div>
              <span className={`rounded-lg p-3 ${item.color}`}>
                <item.icon className="h-5 w-5" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>All shipment records</CardTitle>
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset filters
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-3 lg:grid-cols-3 xl:grid-cols-6">
            <div className="lg:col-span-2">
              <SearchInput
                value={search}
                onChange={(value) => {
                  setSearch(value);
                  setPage(1);
                }}
                placeholder="Search tracking number, product, route…"
                ariaLabel="Search shipment history"
              />
            </div>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as ShipmentStatus | 'all');
                setPage(1);
              }}
              className="h-9 rounded-md border bg-background px-3 text-sm"
              aria-label="Filter shipment history by status"
            >
              <option value="all">All statuses</option>
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {SHIPMENT_STATUS_LABELS[option]}
                </option>
              ))}
            </select>
            <select
              value={productId}
              onChange={(event) => {
                setProductId(event.target.value);
                setPage(1);
              }}
              className="h-9 rounded-md border bg-background px-3 text-sm"
              aria-label="Filter by product"
            >
              <option value="all">All products</option>
              {productOptions.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
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
            <div className="flex gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(event) => {
                  setDateFrom(event.target.value);
                  setPage(1);
                }}
                className="h-9 w-full rounded-md border bg-background px-2 text-xs"
                aria-label="Shipments created from"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(event) => {
                  setDateTo(event.target.value);
                  setPage(1);
                }}
                className="h-9 w-full rounded-md border bg-background px-2 text-xs"
                aria-label="Shipments created to"
              />
            </div>
          </div>

          {error && (
            <div className="mb-4">
              <ErrorMessage message={error} />
            </div>
          )}

          {isLoading ? (
            <TableSkeleton rows={7} columns={6} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={History}
              title="No shipment history found"
              description="Adjust the filters or create a shipment to build history."
              action={
                <Button variant="outline" onClick={resetFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-3 font-medium">Tracking</th>
                    <th className="px-3 py-3 font-medium">Date</th>
                    <th className="px-3 py-3 font-medium">Products</th>
                    <th className="px-3 py-3 font-medium">Route</th>
                    <th className="px-3 py-3 font-medium">Distributor</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium">Delivered</th>
                    <th className="px-3 py-3 text-right font-medium">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {visible.map((shipment) => {
                    const meta = getShipmentStatusMeta(shipment.status);
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
                        <td className="px-3 py-3">{formatDate(shipment.createdAt)}</td>
                        <td className="px-3 py-3">
                          <p className="max-w-[180px] truncate">
                            {shipment.items[0]?.productName ?? shipment.items[0]?.productId}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {shipment.items.length} line
                            {shipment.items.length === 1 ? '' : 's'} ·{' '}
                            {shipment.items.reduce((sum, item) => sum + item.quantity, 0)} units
                          </p>
                        </td>
                        <td className="px-3 py-3">
                          <p className="max-w-[200px] truncate">{shipment.origin}</p>
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <ArrowRight className="h-3 w-3" />
                            {shipment.destination}
                          </p>
                        </td>
                        <td className="px-3 py-3">{shipment.distributorName ?? '—'}</td>
                        <td className="px-3 py-3">
                          <StatusBadge label={meta.label} tone={meta.tone} dot />
                        </td>
                        <td className="px-3 py-3">
                          {shipment.actualDelivery ? formatDate(shipment.actualDelivery) : '—'}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => navigate(`/shipments/${shipment.id}`)}
                            aria-label={`View ${shipment.trackingNumber}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && filtered.length > 0 && (
            <div className="mt-4">
              <Pagination
                page={currentPage}
                totalPages={totalPages}
                total={filtered.length}
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