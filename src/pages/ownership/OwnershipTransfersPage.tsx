import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Clock,
  Download,
  History,
  Plus,
  Repeat2,
  ShieldCheck,
  ShieldQuestion,
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
  ConfirmDialog,
  DemoDataBanner,
  EmptyState,
  ErrorMessage,
  InfoField,
  Modal,
  SearchInput,
  StatusBadge,
  TableSkeleton,
  Timeline,
} from '@/components/common';
import type { TimelineEntry } from '@/components/common/Timeline';
import { StatsCard } from '@/components/dashboard';
import ownershipService from '@/services/ownership.service';
import productService from '@/services/product.service';
import type {
  CreateOwnershipTransferPayload,
  OwnershipTransfer,
  OwnershipTransferStatus,
  Product,
} from '@/types';
import {
  formatDate,
  formatDateTime,
  getOwnershipStatusMeta,
  shortHash,
  toDateInputValue,
} from '@/utils';
import { errorMessage } from '@/services/serviceHelpers';
import { mockProducts } from '@/data/mockProducts';

interface TransferFormState {
  productId: string;
  newOwner: string;
  transferDate: string;
  location: string;
  notes: string;
}

function emptyForm(): TransferFormState {
  return {
    productId: '',
    newOwner: '',
    transferDate: toDateInputValue(new Date().toISOString()),
    location: '',
    notes: '',
  };
}

export default function OwnershipTransfersPage() {
  const toast = useToast();
  const [transfers, setTransfers] = useState<OwnershipTransfer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [source, setSource] = useState<'api' | 'demo'>('demo');
  const [catalogIsDemo, setCatalogIsDemo] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<OwnershipTransferStatus | 'all'>('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<TransferFormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [currentOwner, setCurrentOwner] = useState('');
  const [ownerIsDemo, setOwnerIsDemo] = useState(false);
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [pendingPayload, setPendingPayload] =
    useState<CreateOwnershipTransferPayload | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const [transferResult, productResult] = await Promise.allSettled([
      ownershipService.getAll(),
      productService.getAll({ page: 1, limit: 1_000 }),
    ]);

    if (transferResult.status === 'fulfilled') {
      setTransfers(transferResult.value.data);
      setSource(transferResult.value.source);
    } else {
      setError(errorMessage(transferResult.reason, 'Unable to load ownership records.'));
    }

    if (productResult.status === 'fulfilled') {
      const rows = productResult.value.data;
      setProducts(rows.length > 0 ? rows : mockProducts);
      setCatalogIsDemo(rows.length === 0);
    } else {
      setProducts(mockProducts);
      setCatalogIsDemo(true);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!form.productId) {
      setCurrentOwner('');
      setOwnerIsDemo(false);
      return;
    }
    let active = true;
    setOwnerLoading(true);
    ownershipService
      .getByProduct(form.productId)
      .then((response) => {
        if (!active) return;
        const latest = [...response.data]
          .filter(
            (transfer) =>
              transfer.status === 'confirmed' || transfer.status === 'demo'
          )
          .sort(
            (a, b) =>
              new Date(b.transferDate).getTime() - new Date(a.transferDate).getTime()
          )[0];
        const product = products.find(
          (item) => item.productId === form.productId || item.id === form.productId
        );
        setCurrentOwner(latest?.newOwner ?? product?.manufacturer ?? 'Unknown owner');
        setOwnerIsDemo(response.source === 'demo');
      })
      .catch(() => {
        if (!active) return;
        const product = products.find(
          (item) => item.productId === form.productId || item.id === form.productId
        );
        setCurrentOwner(product?.manufacturer ?? 'Unknown owner');
        setOwnerIsDemo(true);
      })
      .finally(() => {
        if (active) setOwnerLoading(false);
      });
    return () => {
      active = false;
    };
  }, [form.productId, products]);

  const filteredTransfers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return transfers.filter((transfer) => {
      if (status !== 'all' && transfer.status !== status) return false;
      if (query) {
        const haystack = [
          transfer.id,
          transfer.productId,
          transfer.productName,
          transfer.previousOwner,
          transfer.newOwner,
          transfer.location,
          transfer.transactionHash,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [transfers, search, status]);

  const stats = {
    total: transfers.length,
    confirmed: transfers.filter((transfer) => transfer.status === 'confirmed').length,
    demo: transfers.filter(
      (transfer) => transfer.status === 'demo' || transfer.isDemo
    ).length,
    pending: transfers.filter((transfer) => transfer.status === 'pending').length,
  };

  const timelineEntries: TimelineEntry[] = [...transfers]
    .sort(
      (a, b) =>
        new Date(b.transferDate).getTime() - new Date(a.transferDate).getTime()
    )
    .slice(0, 6)
    .map((transfer) => ({
      id: transfer.id,
      title: transfer.productName,
      description: `${transfer.previousOwner} → ${transfer.newOwner}`,
      timestamp: transfer.transferDate,
      location: transfer.location,
      meta: getOwnershipStatusMeta(transfer.status).label,
      completed: transfer.status === 'confirmed' || transfer.status === 'demo',
    }));

  const openForm = () => {
    setForm(emptyForm());
    setFormErrors({});
    setCurrentOwner('');
    setIsFormOpen(true);
  };

  const closeForm = () => {
    if (isSubmitting) return;
    setIsFormOpen(false);
    setPendingPayload(null);
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.productId) errors.productId = 'Select a product.';
    if (!form.newOwner.trim()) {
      errors.newOwner = 'Enter the new owner.';
    } else if (
      currentOwner &&
      form.newOwner.trim().toLowerCase() === currentOwner.trim().toLowerCase()
    ) {
      errors.newOwner = 'The new owner must be different from the current owner.';
    }
    if (!form.transferDate) {
      errors.transferDate = 'Select the transfer date.';
    } else if (new Date(form.transferDate).getTime() > Date.now() + 86_400_000) {
      errors.transferDate = 'The transfer date cannot be in the future.';
    }
    if (!form.location.trim()) errors.location = 'Enter the transfer location.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleReview = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setPendingPayload({
      productId: form.productId,
      previousOwner: currentOwner || 'Unknown owner',
      newOwner: form.newOwner.trim(),
      transferDate: new Date(`${form.transferDate}T12:00:00`).toISOString(),
      location: form.location.trim(),
      notes: form.notes.trim() || undefined,
    });
  };

  const handleConfirmTransfer = async () => {
    if (!pendingPayload) return;
    setIsSubmitting(true);
    try {
      const response = await ownershipService.transfer(pendingPayload);
      if (response.source === 'demo') {
        toast.warning(
          'Recorded in demo mode only',
          'This ownership change was saved to the local demo database. It is NOT a blockchain-confirmed transfer.'
        );
      } else {
        toast.success(
          response.data.status === 'confirmed'
            ? 'Ownership transfer confirmed'
            : 'Ownership transfer submitted',
          response.message
        );
      }
      setIsFormOpen(false);
      setPendingPayload(null);
      setForm(emptyForm());
      await load();
    } catch (transferError) {
      toast.error('Ownership transfer failed', errorMessage(transferError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportCsv = () => {
    if (filteredTransfers.length === 0) {
      toast.error('Nothing to export', 'No ownership records match the filters.');
      return;
    }
    const header = [
      'Record ID',
      'Product ID',
      'Product',
      'Previous owner',
      'New owner',
      'Transfer date',
      'Location',
      'Status',
      'Transaction hash',
    ];
    const rows = filteredTransfers.map((transfer) => [
      transfer.id,
      transfer.productId,
      transfer.productName,
      transfer.previousOwner,
      transfer.newOwner,
      transfer.transferDate,
      transfer.location,
      getOwnershipStatusMeta(transfer.status).label,
      transfer.transactionHash ?? '',
    ]);
    const csv = [header, ...rows]
      .map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ownership-transfers-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Ownership records exported', `${filteredTransfers.length} rows written.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ownership Transfers</h1>
          <p className="mt-1 text-muted-foreground">
            Record product ownership changes and review the transfer history.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={openForm}>
            <Plus className="mr-2 h-4 w-4" />
            New transfer
          </Button>
        </div>
      </div>

      {source === 'demo' && (
        <DemoDataBanner
          title="Demo ownership records"
          message="The ownership API is unavailable. Records below come from the local demo database. Demo ownership changes are not blockchain-confirmed and must not be presented as on-chain proof."
        />
      )}
      {catalogIsDemo && source !== 'demo' && (
        <DemoDataBanner
          tone="info"
          title="Sample product catalog"
          message="The product API is unavailable, so product selection uses sample catalog entries. Ownership responses shown here still come from the ownership service."
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Ownership records"
          value={stats.total}
          icon={Repeat2}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatsCard
          title="Blockchain confirmed"
          value={stats.confirmed}
          icon={ShieldCheck}
          iconColor="text-green-600"
          bgColor="bg-green-50"
        />
        <StatsCard
          title="Demo-only records"
          value={stats.demo}
          icon={ShieldQuestion}
          iconColor="text-amber-600"
          bgColor="bg-amber-50"
        />
        <StatsCard
          title="Awaiting confirmation"
          value={stats.pending}
          icon={Clock}
          iconColor="text-violet-600"
          bgColor="bg-violet-50"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Transfer history</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search product, owner, or record ID…"
                ariaLabel="Search ownership transfers"
                className="sm:w-64"
              />
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as OwnershipTransferStatus | 'all')
                }
                className="h-9 rounded-md border bg-background px-3 text-sm"
                aria-label="Filter ownership records by status"
              >
                <option value="all">All statuses</option>
                <option value="confirmed">Blockchain confirmed</option>
                <option value="pending">Awaiting confirmation</option>
                <option value="demo">Demo record</option>
                <option value="failed">Failed</option>
              </select>
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
              <TableSkeleton rows={6} columns={6} />
            ) : filteredTransfers.length === 0 ? (
              <EmptyState
                icon={History}
                title="No ownership records found"
                description={
                  search || status !== 'all'
                    ? 'No records match the current filters.'
                    : 'Record the first ownership transfer to start a product custody history.'
                }
                action={
                  search || status !== 'all' ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearch('');
                        setStatus('all');
                      }}
                    >
                      Clear filters
                    </Button>
                  ) : (
                    <Button onClick={openForm}>
                      <Plus className="mr-2 h-4 w-4" />
                      New transfer
                    </Button>
                  )
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-3 py-3 font-medium">Product</th>
                      <th className="px-3 py-3 font-medium">Ownership change</th>
                      <th className="px-3 py-3 font-medium">Date</th>
                      <th className="px-3 py-3 font-medium">Location</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                      <th className="px-3 py-3 font-medium">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredTransfers.map((transfer) => {
                      const meta = getOwnershipStatusMeta(transfer.status);
                      return (
                        <tr key={transfer.id} className="hover:bg-muted/40">
                          <td className="px-3 py-3">
                            <p className="font-medium">{transfer.productName}</p>
                            <p className="font-mono text-xs text-muted-foreground">
                              {transfer.productId}
                            </p>
                          </td>
                          <td className="px-3 py-3">
                            <p className="text-xs text-muted-foreground">
                              {transfer.previousOwner}
                            </p>
                            <p className="flex items-center gap-1 font-medium">
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                              {transfer.newOwner}
                            </p>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3">
                            {formatDate(transfer.transferDate)}
                          </td>
                          <td className="px-3 py-3">{transfer.location}</td>
                          <td className="px-3 py-3">
                            <StatusBadge label={meta.label} tone={meta.tone} dot />
                          </td>
                          <td className="px-3 py-3 font-mono text-xs">
                            {transfer.transactionHash ? (
                              <span title={transfer.transactionHash}>
                                {shortHash(transfer.transactionHash)}
                              </span>
                            ) : transfer.status === 'demo' ? (
                              <span className="text-amber-700">Local demo record</span>
                            ) : (
                              '—'
                            )}
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
              <Clock className="h-5 w-5" />
              Recent ownership events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Timeline
              items={timelineEntries}
              emptyMessage="No ownership events have been recorded yet."
            />
            <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">
              Only records marked “Blockchain confirmed” were confirmed by a backend
              blockchain service. Demo records are local samples.
            </p>
          </CardContent>
        </Card>
      </div>

      <Modal
        isOpen={isFormOpen}
        title="Record ownership transfer"
        description="Transfer custody of a product to a new owner."
        size="md"
        onClose={closeForm}
      >
        <form onSubmit={handleReview} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="transfer-product">Product *</Label>
            <select
              id="transfer-product"
              value={form.productId}
              onChange={(event) => {
                setForm((current) => ({
                  ...current,
                  productId: event.target.value,
                }));
                setFormErrors((current) => ({ ...current, productId: '', newOwner: '' }));
              }}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              disabled={isSubmitting}
            >
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product.id} value={product.productId}>
                  {product.name} ({product.productId})
                </option>
              ))}
            </select>
            {formErrors.productId && (
              <p className="text-xs text-destructive">{formErrors.productId}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Current owner</Label>
            <div className="flex h-9 items-center rounded-md border bg-muted/40 px-3 text-sm font-medium">
              {ownerLoading
                ? 'Checking current owner…'
                : currentOwner || 'Select a product first'}
            </div>
            {ownerIsDemo && currentOwner && (
              <p className="text-xs text-amber-700">
                Current owner derived from demo ownership records.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="transfer-new-owner">New owner *</Label>
            <Input
              id="transfer-new-owner"
              value={form.newOwner}
              onChange={(event) => {
                setForm((current) => ({ ...current, newOwner: event.target.value }));
                setFormErrors((current) => ({ ...current, newOwner: '' }));
              }}
              placeholder="Company or organization receiving custody"
              disabled={isSubmitting}
            />
            {formErrors.newOwner && (
              <p className="text-xs text-destructive">{formErrors.newOwner}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="transfer-date">Transfer date *</Label>
              <Input
                id="transfer-date"
                type="date"
                value={form.transferDate}
                onChange={(event) => {
                  setForm((current) => ({
                    ...current,
                    transferDate: event.target.value,
                  }));
                  setFormErrors((current) => ({ ...current, transferDate: '' }));
                }}
                disabled={isSubmitting}
              />
              {formErrors.transferDate && (
                <p className="text-xs text-destructive">{formErrors.transferDate}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="transfer-location">Location *</Label>
              <Input
                id="transfer-location"
                value={form.location}
                onChange={(event) => {
                  setForm((current) => ({ ...current, location: event.target.value }));
                  setFormErrors((current) => ({ ...current, location: '' }));
                }}
                placeholder="City, state / country"
                disabled={isSubmitting}
              />
              {formErrors.location && (
                <p className="text-xs text-destructive">{formErrors.location}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="transfer-notes">Notes</Label>
            <Textarea
              id="transfer-notes"
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({ ...current, notes: event.target.value }))
              }
              rows={3}
              placeholder="Reason for transfer, reference documents, or handling notes."
              disabled={isSubmitting}
            />
          </div>

          <InfoField
            label="Important"
            value="Ownership is only blockchain-confirmed when the backend returns a confirmed on-chain result. If the backend is unavailable, this transfer is stored as a demo record only."
            className="border-amber-200 bg-amber-50 text-amber-900"
            valueClassName="font-normal"
          />

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={closeForm}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || ownerLoading}>
              Review transfer
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(pendingPayload)}
        title="Confirm ownership transfer"
        description={
          pendingPayload ? (
            <div className="space-y-2">
              <p>
                Transfer <strong>{pendingPayload.productId}</strong> from{' '}
                <strong>{pendingPayload.previousOwner}</strong> to{' '}
                <strong>{pendingPayload.newOwner}</strong> on{' '}
                {formatDateTime(pendingPayload.transferDate)}?
              </p>
              {source === 'demo' && (
                <p className="rounded-md border border-amber-200 bg-amber-50 p-2 text-amber-800">
                  No blockchain service is connected. This transfer will be saved as a
                  local demo record and will NOT be blockchain-confirmed.
                </p>
              )}
            </div>
          ) : null
        }
        confirmLabel={isSubmitting ? 'Saving…' : 'Confirm transfer'}
        isLoading={isSubmitting}
        variant="warning"
        onConfirm={handleConfirmTransfer}
        onClose={() => !isSubmitting && setPendingPayload(null)}
      />
    </div>
  );
}