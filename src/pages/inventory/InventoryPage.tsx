import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Boxes,
  Edit3,
  History,
  PackageSearch,
  RotateCcw,
  Warehouse as WarehouseIcon,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
} from '@/components/ui';
import { useToast } from '@/components/ui';
import {
  DemoDataBanner,
  EmptyState,
  ErrorMessage,
  Modal,
  Pagination,
  SearchInput,
  StatusBadge,
  TableSkeleton,
} from '@/components/common';
import { StatsCard } from '@/components/dashboard';
import inventoryService from '@/services/inventory.service';
import warehouseService from '@/services/warehouse.service';
import type {
  Inventory,
  InventoryMovement,
  InventoryStats,
  MovementType,
  UpdateInventoryPayload,
  Warehouse,
} from '@/types';
import {
  formatDateTime,
  formatNumber,
  getMovementTypeMeta,
} from '@/utils';
import { errorMessage } from '@/services/serviceHelpers';

const movementTypes: MovementType[] = [
  'inbound',
  'outbound',
  'adjustment',
  'return',
  'reservation',
];

function availableQuantity(item: Inventory): number {
  return Math.max(0, item.quantity - (item.reservedQuantity ?? 0));
}

function isLowStock(item: Inventory): boolean {
  return availableQuantity(item) <= item.reorderLevel;
}

interface StockFormState {
  quantity: string;
  reservedQuantity: string;
  movementType: MovementType;
  reason: string;
}

const EMPTY_FORM: StockFormState = {
  quantity: '',
  reservedQuantity: '',
  movementType: 'adjustment',
  reason: '',
};

export default function InventoryPage() {
  const toast = useToast();
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [source, setSource] = useState<'api' | 'demo'>('demo');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [warehouseId, setWarehouseId] = useState('all');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [movementType, setMovementType] = useState<MovementType | 'all'>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [editing, setEditing] = useState<Inventory | null>(null);
  const [form, setForm] = useState<StockFormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const [inventoryResult, movementResult, warehouseResult, statsResult] =
      await Promise.allSettled([
        inventoryService.getAll({ page: 1, limit: 10_000 }),
        inventoryService.getMovements(),
        warehouseService.getAll(),
        inventoryService.getStats(),
      ]);

    if (inventoryResult.status === 'fulfilled') {
      setInventory(inventoryResult.value.data);
      setSource(inventoryResult.value.source);
    } else {
      setError(errorMessage(inventoryResult.reason, 'Unable to load inventory.'));
    }
    if (movementResult.status === 'fulfilled') {
      setMovements(movementResult.value.data);
      if (movementResult.value.source === 'demo') setSource('demo');
    }
    if (warehouseResult.status === 'fulfilled') {
      setWarehouses(warehouseResult.value.data);
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

  const filteredInventory = useMemo(() => {
    const query = search.trim().toLowerCase();
    return inventory.filter((item) => {
      if (warehouseId !== 'all' && item.warehouseId !== warehouseId) return false;
      if (lowStockOnly && !isLowStock(item)) return false;
      if (query) {
        const haystack = [
          item.productId,
          item.productName,
          item.sku,
          item.warehouseName,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [inventory, search, warehouseId, lowStockOnly]);

  const filteredMovements = useMemo(() => {
    return movements.filter((movement) => {
      if (movementType !== 'all' && movement.type !== movementType) return false;
      if (warehouseId !== 'all' && movement.warehouseId !== warehouseId) return false;
      return true;
    });
  }, [movements, movementType, warehouseId]);

  const totalPages = Math.max(1, Math.ceil(filteredInventory.length / limit));
  const currentPage = Math.min(page, totalPages);
  const visibleInventory = filteredInventory.slice(
    (currentPage - 1) * limit,
    currentPage * limit
  );

  const resetFilters = () => {
    setSearch('');
    setWarehouseId('all');
    setLowStockOnly(false);
    setMovementType('all');
    setPage(1);
  };

  const openStockModal = (item: Inventory) => {
    setEditing(item);
    setForm({
      quantity: String(item.quantity),
      reservedQuantity: String(item.reservedQuantity ?? 0),
      movementType: 'adjustment',
      reason: '',
    });
    setFormErrors({});
    setFormError(null);
  };

  const closeStockModal = () => {
    if (isSaving) return;
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setFormError(null);
  };

  const handleStockSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    const errors: Record<string, string> = {};
    const quantity = Number(form.quantity);
    const reserved = Number(form.reservedQuantity);
    if (!Number.isFinite(quantity) || quantity < 0) {
      errors.quantity = 'Quantity must be a number greater than or equal to zero.';
    }
    if (!Number.isFinite(reserved) || reserved < 0) {
      errors.reservedQuantity = 'Reserved quantity cannot be negative.';
    } else if (reserved > quantity) {
      errors.reservedQuantity = 'Reserved quantity cannot exceed the total quantity.';
    }
    if (form.reason.trim().length < 3) {
      errors.reason = 'Provide a short reason for this stock movement.';
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const payload: UpdateInventoryPayload = {
      quantity,
      movementType: form.movementType,
      reason: form.reason.trim(),
      reservedQuantity: reserved,
    };

    setIsSaving(true);
    setFormError(null);
    try {
      const response = await inventoryService.update(editing.id, payload);
      if (response.source === 'demo') {
        toast.warning(
          'Stock updated in demo mode',
          'The local demo database was updated. No blockchain transaction was submitted.'
        );
      } else {
        toast.success('Stock updated', `${editing.productName ?? editing.productId} inventory saved.`);
      }
      setEditing(null);
      setForm(EMPTY_FORM);
      await load();
    } catch (saveError) {
      setFormError(errorMessage(saveError, 'Unable to update stock.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="mt-1 text-muted-foreground">
            Monitor stock across warehouses, flag low inventory, and record movements.
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={isLoading}>
          <History className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh data
        </Button>
      </div>

      {source === 'demo' && (
        <DemoDataBanner
          title="Demo inventory data"
          message="The inventory API is unavailable. Stock levels and movements below are local sample records. They are not blockchain-backed and do not represent live warehouse counts."
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Available stock"
          value={formatNumber(stats?.totalAvailable ?? 0)}
          icon={Boxes}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatsCard
          title="Reserved stock"
          value={formatNumber(stats?.totalReserved ?? 0)}
          icon={WarehouseIcon}
          iconColor="text-violet-600"
          bgColor="bg-violet-50"
        />
        <StatsCard
          title="Low stock records"
          value={stats?.lowStockCount ?? 0}
          icon={AlertTriangle}
          iconColor="text-amber-600"
          bgColor="bg-amber-50"
        />
        <StatsCard
          title="Tracked SKUs"
          value={stats?.totalSkus ?? 0}
          icon={PackageSearch}
          iconColor="text-green-600"
          bgColor="bg-green-50"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Stock by warehouse</CardTitle>
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset filters
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
            <SearchInput
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Search product, SKU, or warehouse…"
              ariaLabel="Search inventory"
            />
            <select
              value={warehouseId}
              onChange={(event) => {
                setWarehouseId(event.target.value);
                setPage(1);
              }}
              className="h-9 rounded-md border bg-background px-3 text-sm"
              aria-label="Filter inventory by warehouse"
            >
              <option value="all">All warehouses</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 whitespace-nowrap text-sm">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(event) => {
                  setLowStockOnly(event.target.checked);
                  setPage(1);
                }}
                className="h-4 w-4 rounded border-border"
              />
              Low stock only
            </label>
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
            <TableSkeleton rows={6} columns={7} />
          ) : filteredInventory.length === 0 ? (
            <EmptyState
              icon={Boxes}
              title="No inventory records found"
              description={
                search || warehouseId !== 'all' || lowStockOnly
                  ? 'No stock records match the current filters.'
                  : 'Inventory records will appear here once stock is registered.'
              }
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
                    <th className="px-3 py-3 font-medium">Product</th>
                    <th className="px-3 py-3 font-medium">Warehouse</th>
                    <th className="px-3 py-3 text-right font-medium">Total</th>
                    <th className="px-3 py-3 text-right font-medium">Reserved</th>
                    <th className="px-3 py-3 text-right font-medium">Available</th>
                    <th className="px-3 py-3 text-right font-medium">Reorder at</th>
                    <th className="px-3 py-3 font-medium">Level</th>
                    <th className="px-3 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {visibleInventory.map((item) => {
                    const available = availableQuantity(item);
                    const low = isLowStock(item);
                    const out = available === 0;
                    return (
                      <tr key={item.id} className="hover:bg-muted/40">
                        <td className="px-3 py-3">
                          <p className="font-medium">{item.productName ?? item.productId}</p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {item.productId} {item.sku ? `· ${item.sku}` : ''}
                          </p>
                        </td>
                        <td className="px-3 py-3">
                          {item.warehouseName ?? item.warehouseId}
                        </td>
                        <td className="px-3 py-3 text-right">{formatNumber(item.quantity)}</td>
                        <td className="px-3 py-3 text-right">
                          {formatNumber(item.reservedQuantity ?? 0)}
                        </td>
                        <td className="px-3 py-3 text-right font-semibold">
                          {formatNumber(available)}
                        </td>
                        <td className="px-3 py-3 text-right">{formatNumber(item.reorderLevel)}</td>
                        <td className="px-3 py-3">
                          <StatusBadge
                            label={out ? 'Out of stock' : low ? 'Low stock' : 'In stock'}
                            tone={out ? 'danger' : low ? 'warning' : 'success'}
                            dot
                          />
                        </td>
                        <td className="px-3 py-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openStockModal(item)}
                          >
                            <Edit3 className="mr-1 h-3.5 w-3.5" />
                            Update stock
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && filteredInventory.length > 0 && (
            <div className="mt-4">
              <Pagination
                page={currentPage}
                totalPages={totalPages}
                total={filteredInventory.length}
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

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Recent stock movements</CardTitle>
          <select
            value={movementType}
            onChange={(event) => setMovementType(event.target.value as MovementType | 'all')}
            className="h-9 rounded-md border bg-background px-3 text-sm"
            aria-label="Filter stock movements by type"
          >
            <option value="all">All movement types</option>
            {movementTypes.map((type) => (
              <option key={type} value={type}>
                {getMovementTypeMeta(type).label}
              </option>
            ))}
          </select>
        </CardHeader>
        <CardContent>
          {filteredMovements.length === 0 ? (
            <EmptyState
              icon={History}
              title="No stock movements"
              description="Movement history is recorded when stock is received, dispatched, adjusted, or reserved."
            />
          ) : (
            <div className="max-h-[520px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-3 font-medium">Product</th>
                    <th className="px-3 py-3 font-medium">Warehouse</th>
                    <th className="px-3 py-3 font-medium">Type</th>
                    <th className="px-3 py-3 text-right font-medium">Change</th>
                    <th className="px-3 py-3 text-right font-medium">Result</th>
                    <th className="px-3 py-3 font-medium">Reason</th>
                    <th className="px-3 py-3 font-medium">By</th>
                    <th className="px-3 py-3 font-medium">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredMovements.map((movement) => {
                    const meta = getMovementTypeMeta(movement.type);
                    return (
                      <tr key={movement.id} className="hover:bg-muted/40">
                        <td className="px-3 py-3">
                          <p className="font-medium">
                            {movement.productName ?? movement.productId}
                          </p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {movement.productId}
                          </p>
                        </td>
                        <td className="px-3 py-3">
                          {movement.warehouseName ?? movement.warehouseId ?? '—'}
                        </td>
                        <td className="px-3 py-3">
                          <StatusBadge label={meta.label} tone={meta.tone} />
                        </td>
                        <td
                          className={`px-3 py-3 text-right font-medium ${
                            movement.quantity >= 0 ? 'text-green-700' : 'text-red-700'
                          }`}
                        >
                          {movement.quantity >= 0 ? '+' : ''}
                          {formatNumber(movement.quantity)}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {movement.newQuantity !== undefined
                            ? formatNumber(movement.newQuantity)
                            : '—'}
                        </td>
                        <td className="max-w-[260px] px-3 py-3">
                          <p className="truncate" title={movement.reason}>
                            {movement.reason}
                          </p>
                        </td>
                        <td className="px-3 py-3">{movement.performedBy}</td>
                        <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">
                          {formatDateTime(movement.createdAt)}
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

      <Modal
        isOpen={Boolean(editing)}
        title="Update stock level"
        description={
          editing
            ? `${editing.productName ?? editing.productId} · ${
                editing.warehouseName ?? editing.warehouseId
              }`
            : undefined
        }
        size="md"
        onClose={closeStockModal}
      >
        {editing && (
          <form onSubmit={handleStockSubmit} className="space-y-4">
            {formError && <ErrorMessage message={formError} />}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="stock-quantity">New total quantity *</Label>
                <Input
                  id="stock-quantity"
                  type="number"
                  min={0}
                  step={1}
                  value={form.quantity}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, quantity: event.target.value }))
                  }
                  disabled={isSaving}
                />
                {formErrors.quantity && (
                  <p className="text-xs text-destructive">{formErrors.quantity}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Current total: {formatNumber(editing.quantity)}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="stock-reserved">Reserved quantity</Label>
                <Input
                  id="stock-reserved"
                  type="number"
                  min={0}
                  step={1}
                  value={form.reservedQuantity}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      reservedQuantity: event.target.value,
                    }))
                  }
                  disabled={isSaving}
                />
                {formErrors.reservedQuantity && (
                  <p className="text-xs text-destructive">{formErrors.reservedQuantity}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="stock-movement">Movement type *</Label>
                <select
                  id="stock-movement"
                  value={form.movementType}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      movementType: event.target.value as MovementType,
                    }))
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  disabled={isSaving}
                >
                  {movementTypes.map((type) => (
                    <option key={type} value={type}>
                      {getMovementTypeMeta(type).label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Resulting available stock</Label>
                <div className="flex h-9 items-center rounded-md border bg-muted/40 px-3 text-sm font-semibold">
                  {formatNumber(
                    Math.max(
                      0,
                      Number(form.quantity || 0) - Number(form.reservedQuantity || 0)
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="stock-reason">Reason *</Label>
              <Textarea
                id="stock-reason"
                value={form.reason}
                onChange={(event) =>
                  setForm((current) => ({ ...current, reason: event.target.value }))
                }
                placeholder="e.g. Manufacturer replenishment, cycle count adjustment, or shipment allocation."
                rows={3}
                disabled={isSaving}
              />
              {formErrors.reason && (
                <p className="text-xs text-destructive">{formErrors.reason}</p>
              )}
            </div>

            {source === 'demo' && (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Demo mode: this movement will be written to the local demo database only.
                It will not create a blockchain transaction.
              </p>
            )}

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={closeStockModal}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving…' : 'Save stock update'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}