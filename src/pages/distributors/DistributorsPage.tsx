import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Edit3,
  Eye,
  Mail,
  MapPin,
  Phone,
  Plus,
  RotateCcw,
  ShieldCheck,
  Truck,
  UserRound,
  Users,
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
  InfoField,
  Modal,
  SearchInput,
  StatusBadge,
  TableSkeleton,
} from '@/components/common';
import { StatsCard } from '@/components/dashboard';
import { DistributorForm } from '@/components/distributors';
import distributorService from '@/services/distributor.service';
import shipmentService from '@/services/shipment.service';
import type {
  CreateDistributorPayload,
  Distributor,
  DistributorStatus,
  Shipment,
} from '@/types';
import {
  formatDate,
  formatDateTime,
  getDistributorStatusMeta,
  getShipmentStatusMeta,
} from '@/utils';
import { errorMessage } from '@/services/serviceHelpers';

export default function DistributorsPage() {
  const toast = useToast();
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [source, setSource] = useState<'api' | 'demo'>('demo');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<DistributorStatus | 'all'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDistributor, setEditingDistributor] = useState<Distributor | null>(null);
  const [viewingDistributor, setViewingDistributor] = useState<Distributor | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const [distributorResult, shipmentResult] = await Promise.allSettled([
      distributorService.getAll(),
      shipmentService.getAll({ page: 1, limit: 10_000 }),
    ]);
    if (distributorResult.status === 'fulfilled') {
      setDistributors(distributorResult.value.data);
      setSource(distributorResult.value.source);
    } else {
      setError(errorMessage(distributorResult.reason, 'Unable to load distributors.'));
    }
    if (shipmentResult.status === 'fulfilled') {
      setShipments(shipmentResult.value.data);
      if (shipmentResult.value.source === 'demo') setSource('demo');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredDistributors = useMemo(() => {
    const query = search.trim().toLowerCase();
    return distributors.filter((distributor) => {
      if (status !== 'all' && distributor.status !== status) return false;
      if (query) {
        const haystack = [
          distributor.name,
          distributor.code,
          distributor.contactName,
          distributor.email,
          distributor.city,
          distributor.country,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [distributors, search, status]);

  const shipmentsFor = (distributorId: string) =>
    shipments.filter((shipment) => shipment.distributorId === distributorId);

  const openCreate = () => {
    setEditingDistributor(null);
    setIsFormOpen(true);
  };

  const openEdit = (distributor: Distributor) => {
    setEditingDistributor(distributor);
    setIsFormOpen(true);
  };

  const handleSubmit = async (payload: CreateDistributorPayload) => {
    if (editingDistributor) {
      const response = await distributorService.update(editingDistributor.id, payload);
      if (response.source === 'demo') {
        toast.warning(
          'Distributor updated in demo mode',
          'Changes were saved to the local demo database only.'
        );
      } else {
        toast.success('Distributor updated', response.data.name);
      }
    } else {
      const response = await distributorService.create(payload);
      if (response.source === 'demo') {
        toast.warning(
          'Distributor created in demo mode',
          'The distributor was saved to the local demo database only.'
        );
      } else {
        toast.success('Distributor created', response.data.name);
      }
    }
    setIsFormOpen(false);
    setEditingDistributor(null);
    await load();
  };

  const resetFilters = () => {
    setSearch('');
    setStatus('all');
  };

  const assignedShipments = viewingDistributor
    ? shipmentsFor(viewingDistributor.id)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Distributors</h1>
          <p className="mt-1 text-muted-foreground">
            Manage distribution partners, compliance details, and assigned shipments.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add distributor
        </Button>
      </div>

      {source === 'demo' && (
        <DemoDataBanner
          title="Demo distributor data"
          message="The distributor API is unavailable. Partners and assignments below are local sample records, not live distribution data."
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Total distributors"
          value={distributors.length}
          icon={Building2}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatsCard
          title="Active partners"
          value={distributors.filter((item) => item.status === 'active').length}
          icon={ShieldCheck}
          iconColor="text-green-600"
          bgColor="bg-green-50"
        />
        <StatsCard
          title="Suspended"
          value={distributors.filter((item) => item.status === 'suspended').length}
          icon={Users}
          iconColor="text-red-600"
          bgColor="bg-red-50"
        />
        <StatsCard
          title="Assigned shipments"
          value={shipments.filter((shipment) => Boolean(shipment.distributorId)).length}
          icon={Truck}
          iconColor="text-violet-600"
          bgColor="bg-violet-50"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Distribution partners</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search company, contact, code, or city…"
              ariaLabel="Search distributors"
              className="sm:w-72"
            />
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as DistributorStatus | 'all')
              }
              className="h-9 rounded-md border bg-background px-3 text-sm"
              aria-label="Filter distributors by status"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
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
            <TableSkeleton rows={6} columns={6} />
          ) : filteredDistributors.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No distributors found"
              description={
                search || status !== 'all'
                  ? 'No partners match the current filters.'
                  : 'Add a distribution partner to assign shipments.'
              }
              action={
                search || status !== 'all' ? (
                  <Button variant="outline" onClick={resetFilters}>
                    Clear filters
                  </Button>
                ) : (
                  <Button onClick={openCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add distributor
                  </Button>
                )
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-3 font-medium">Company</th>
                    <th className="px-3 py-3 font-medium">Contact</th>
                    <th className="px-3 py-3 font-medium">Location</th>
                    <th className="px-3 py-3 font-medium">License</th>
                    <th className="px-3 py-3 font-medium">Shipments</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredDistributors.map((distributor) => {
                    const meta = getDistributorStatusMeta(distributor.status);
                    const assigned = shipmentsFor(distributor.id);
                    return (
                      <tr key={distributor.id} className="hover:bg-muted/40">
                        <td className="px-3 py-3">
                          <p className="font-medium">{distributor.name}</p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {distributor.code}
                          </p>
                        </td>
                        <td className="px-3 py-3">
                          <p>{distributor.contactName}</p>
                          <p className="text-xs text-muted-foreground">
                            {distributor.email}
                          </p>
                        </td>
                        <td className="px-3 py-3">
                          {distributor.city}
                          {distributor.state ? `, ${distributor.state}` : ''}
                          <p className="text-xs text-muted-foreground">
                            {distributor.country}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">
                          {distributor.licenseNumber ?? '—'}
                        </td>
                        <td className="px-3 py-3">
                          <span className="font-medium">{assigned.length}</span>
                          <p className="text-xs text-muted-foreground">
                            {assigned.filter((shipment) => shipment.status === 'in_transit')
                              .length}{' '}
                            in transit
                          </p>
                        </td>
                        <td className="px-3 py-3">
                          <StatusBadge label={meta.label} tone={meta.tone} dot />
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setViewingDistributor(distributor)}
                              aria-label={`View ${distributor.name}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEdit(distributor)}
                              aria-label={`Edit ${distributor.name}`}
                            >
                              <Edit3 className="h-4 w-4" />
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
        </CardContent>
      </Card>

      <Modal
        isOpen={isFormOpen}
        title={editingDistributor ? 'Edit distributor' : 'Add distributor'}
        description={
          editingDistributor
            ? `Update ${editingDistributor.name} (${editingDistributor.code}).`
            : 'Register a distribution partner that can receive assigned shipments.'
        }
        size="lg"
        onClose={() => {
          setIsFormOpen(false);
          setEditingDistributor(null);
        }}
      >
        <DistributorForm
          key={editingDistributor?.id ?? 'new-distributor'}
          initialDistributor={editingDistributor ?? undefined}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingDistributor(null);
          }}
        />
      </Modal>

      <Modal
        isOpen={Boolean(viewingDistributor)}
        title={viewingDistributor?.name ?? 'Distributor details'}
        description={
          viewingDistributor
            ? `${viewingDistributor.code} · ${getDistributorStatusMeta(viewingDistributor.status).label}`
            : undefined
        }
        size="lg"
        onClose={() => setViewingDistributor(null)}
      >
        {viewingDistributor && (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoField
                label="Contact"
                value={viewingDistributor.contactName}
                icon={UserRound}
              />
              <InfoField label="Email" value={viewingDistributor.email} icon={Mail} />
              <InfoField label="Phone" value={viewingDistributor.phone} icon={Phone} />
              <InfoField
                label="License"
                value={viewingDistributor.licenseNumber ?? 'Not provided'}
                icon={ShieldCheck}
              />
              <InfoField
                label="Address"
                value={`${viewingDistributor.address}, ${viewingDistributor.city}${
                  viewingDistributor.state ? `, ${viewingDistributor.state}` : ''
                }, ${viewingDistributor.country}`}
                icon={MapPin}
                className="sm:col-span-2"
              />
              <InfoField
                label="Created"
                value={formatDateTime(viewingDistributor.createdAt)}
              />
              <InfoField
                label="Last updated"
                value={formatDateTime(viewingDistributor.updatedAt)}
              />
            </div>

            {viewingDistributor.notes && (
              <InfoField label="Notes" value={viewingDistributor.notes} />
            )}

            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Truck className="h-4 w-4" />
                Assigned shipments ({assignedShipments.length})
              </h3>
              {assignedShipments.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  No shipments are assigned to this distributor.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-3 py-2 font-medium">Tracking</th>
                        <th className="px-3 py-2 font-medium">Product</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                        <th className="px-3 py-2 font-medium">Expected</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {assignedShipments.map((shipment) => {
                        const shipmentMeta = getShipmentStatusMeta(shipment.status);
                        return (
                          <tr key={shipment.id}>
                            <td className="px-3 py-2">
                              <Link
                                to={`/shipments/${shipment.id}`}
                                onClick={() => setViewingDistributor(null)}
                                className="font-mono text-primary hover:underline"
                              >
                                {shipment.trackingNumber}
                              </Link>
                            </td>
                            <td className="px-3 py-2">
                              {shipment.items[0]?.productName ??
                                shipment.items[0]?.productId ??
                                '—'}
                            </td>
                            <td className="px-3 py-2">
                              <StatusBadge
                                label={shipmentMeta.label}
                                tone={shipmentMeta.tone}
                              />
                            </td>
                            <td className="px-3 py-2">
                              {formatDate(shipment.estimatedDelivery)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end border-t pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  const distributor = viewingDistributor;
                  setViewingDistributor(null);
                  openEdit(distributor);
                }}
              >
                <Edit3 className="mr-2 h-4 w-4" />
                Edit distributor
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}