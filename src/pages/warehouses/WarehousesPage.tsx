import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  Edit3,
  Gauge,
  MapPin,
  Plus,
  RotateCcw,
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
import { useToast } from '@/components/ui';
import {
  DemoDataBanner,
  EmptyState,
  ErrorMessage,
  Modal,
  SearchInput,
  StatusBadge,
  TableSkeleton,
} from '@/components/common';
import { StatsCard } from '@/components/dashboard';
import { WarehouseForm } from '@/components/warehouses';
import warehouseService from '@/services/warehouse.service';
import type {
  CreateWarehousePayload,
  Warehouse,
  WarehouseStats,
  WarehouseStatus,
} from '@/types';
import { formatNumber, getWarehouseStatusMeta, titleCase } from '@/utils';
import { errorMessage } from '@/services/serviceHelpers';

export default function WarehousesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stats, setStats] = useState<WarehouseStats | null>(null);
  const [source, setSource] = useState<'api' | 'demo'>('demo');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<WarehouseStatus | 'all'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const [listResult, statsResult] = await Promise.allSettled([
      warehouseService.getAll(),
      warehouseService.getStats(),
    ]);
    if (listResult.status === 'fulfilled') {
      setWarehouses(listResult.value.data);
      setSource(listResult.value.source);
    } else {
      setError(errorMessage(listResult.reason, 'Unable to load warehouses.'));
    }
    if (statsResult.status === 'fulfilled') {
      setStats(statsResult.value.data);
      if (statsResult.value.source === 'demo') setSource('demo');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredWarehouses = useMemo(() => {
    const query = search.trim().toLowerCase();
    return warehouses.filter((warehouse) => {
      if (status !== 'all' && warehouse.status !== status) return false;
      if (query) {
        const haystack = [
          warehouse.name,
          warehouse.code,
          warehouse.city,
          warehouse.state,
          warehouse.country,
          warehouse.manager,
          warehouse.contactName,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [warehouses, search, status]);

  const handleSubmit = async (payload: CreateWarehousePayload) => {
    if (editingWarehouse) {
      const response = await warehouseService.update(editingWarehouse.id, payload);
      if (response.source === 'demo') {
        toast.warning(
          'Warehouse updated in demo mode',
          'Changes were saved to the local demo database only.'
        );
      } else {
        toast.success('Warehouse updated', response.data.name);
      }
    } else {
      const response = await warehouseService.create(payload);
      if (response.source === 'demo') {
        toast.warning(
          'Warehouse created in demo mode',
          'The warehouse was saved to the local demo database only.'
        );
      } else {
        toast.success('Warehouse created', response.data.name);
      }
    }
    setIsFormOpen(false);
    setEditingWarehouse(null);
    await load();
  };

  const openCreate = () => {
    setEditingWarehouse(null);
    setIsFormOpen(true);
  };

  const openEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setIsFormOpen(true);
  };

  const resetFilters = () => {
    setSearch('');
    setStatus('all');
  };

  const utilization =
    stats && stats.totalCapacity > 0
      ? Math.round((stats.totalOccupied / stats.totalCapacity) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Warehouses</h1>
          <p className="mt-1 text-muted-foreground">
            Manage storage facilities, capacity, contacts, and operating status.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add warehouse
        </Button>
      </div>

      {source === 'demo' && (
        <DemoDataBanner
          title="Demo warehouse data"
          message="The warehouse API is unavailable. Facilities below are local sample records, not live warehouse data."
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Total warehouses"
          value={stats?.totalWarehouses ?? 0}
          icon={Building2}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatsCard
          title="Active facilities"
          value={stats?.activeWarehouses ?? 0}
          icon={WarehouseIcon}
          iconColor="text-green-600"
          bgColor="bg-green-50"
        />
        <StatsCard
          title="Units stored"
          value={formatNumber(stats?.totalOccupied ?? 0)}
          icon={Gauge}
          iconColor="text-violet-600"
          bgColor="bg-violet-50"
        />
        <StatsCard
          title="Capacity utilization"
          value={`${utilization}%`}
          icon={Gauge}
          iconColor="text-amber-600"
          bgColor="bg-amber-50"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Facilities</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search name, code, city, or manager…"
              ariaLabel="Search warehouses"
              className="sm:w-72"
            />
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as WarehouseStatus | 'all')
              }
              className="h-9 rounded-md border bg-background px-3 text-sm"
              aria-label="Filter warehouses by status"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <RotateCcw className="mr-1 h-4 w-4" />
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 space-y-2">
              <ErrorMessage message={error} />
              <Button variant="outline" size="sm" onClick={load}>
                Try again
              </Button>
            </div>
          )}

          {isLoading ? (
            <TableSkeleton rows={5} columns={4} />
          ) : filteredWarehouses.length === 0 ? (
            <EmptyState
              icon={WarehouseIcon}
              title="No warehouses found"
              description={
                search || status !== 'all'
                  ? 'No facilities match the current filters.'
                  : 'Add a warehouse to start managing inventory locations.'
              }
              action={
                search || status !== 'all' ? (
                  <Button variant="outline" onClick={resetFilters}>
                    Clear filters
                  </Button>
                ) : (
                  <Button onClick={openCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add warehouse
                  </Button>
                )
              }
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {filteredWarehouses.map((warehouse) => {
                const meta = getWarehouseStatusMeta(warehouse.status);
                const usage =
                  warehouse.capacity > 0
                    ? Math.min(100, Math.round((warehouse.occupied / warehouse.capacity) * 100))
                    : 0;
                return (
                  <div
                    key={warehouse.id}
                    className="flex flex-col rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-mono text-xs text-muted-foreground">
                          {warehouse.code}
                        </p>
                        <h3 className="mt-1 truncate text-base font-semibold">
                          {warehouse.name}
                        </h3>
                      </div>
                      <StatusBadge label={meta.label} tone={meta.tone} dot />
                    </div>

                    <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        {warehouse.address}, {warehouse.city}
                        {warehouse.state ? `, ${warehouse.state}` : ''}, {warehouse.country}
                      </span>
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <UserRound className="h-4 w-4 shrink-0" />
                      {warehouse.manager ?? warehouse.contactName}
                    </p>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Capacity used</span>
                        <span className="font-medium">
                          {formatNumber(warehouse.occupied)} /{' '}
                          {formatNumber(warehouse.capacity)} ({usage}%)
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${
                            usage >= 90
                              ? 'bg-red-500'
                              : usage >= 70
                                ? 'bg-amber-500'
                                : 'bg-primary'
                          }`}
                          style={{ width: `${usage}%` }}
                        />
                      </div>
                    </div>

                    <p className="mt-2 text-xs capitalize text-muted-foreground">
                      Status: {titleCase(warehouse.status)}
                    </p>

                    <div className="mt-4 flex gap-2 border-t pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(`/warehouses/${warehouse.id}`)}
                      >
                        View details
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(warehouse)}>
                        <Edit3 className="mr-1 h-3.5 w-3.5" />
                        Edit
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <p className="mt-4 text-xs text-muted-foreground">
            Looking for stock levels?{' '}
            <Link to="/inventory" className="text-primary hover:underline">
              Open inventory
            </Link>
            .
          </p>
        </CardContent>
      </Card>

      <Modal
        isOpen={isFormOpen}
        title={editingWarehouse ? 'Edit warehouse' : 'Add warehouse'}
        description={
          editingWarehouse
            ? `Update ${editingWarehouse.name} (${editingWarehouse.code}).`
            : 'Register a facility that can receive and store inventory.'
        }
        size="lg"
        onClose={() => {
          setIsFormOpen(false);
          setEditingWarehouse(null);
        }}
      >
        <WarehouseForm
          key={editingWarehouse?.id ?? 'new-warehouse'}
          initialWarehouse={editingWarehouse ?? undefined}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingWarehouse(null);
          }}
        />
      </Modal>
    </div>
  );
}