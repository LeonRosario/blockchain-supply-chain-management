import {
  AlertTriangle,
  ArrowRight,
  Box,
  CalendarDays,
  CheckCircle2,
  Factory,
  Link2,
  MapPin,
  Package,
  SearchX,
  ShieldCheck,
  ShieldX,
  Truck,
  UserRound,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import {
  DemoDataBanner,
  EmptyState,
  InfoField,
  StatusBadge,
} from '@/components/common';
import type { ProductVerificationResult } from '@/types';
import {
  formatDate,
  formatDateTime,
  getOwnershipStatusMeta,
  getShipmentStatusMeta,
  shortHash,
} from '@/utils';

interface VerificationResultCardProps {
  result: ProductVerificationResult;
}

export default function VerificationResultCard({ result }: VerificationResultCardProps) {
  const isVerified =
    result.authenticityStatus === 'verified' && result.blockchainVerified === true;

  const presentation = isVerified
    ? {
        title: 'Blockchain verified',
        description:
          'The blockchain service explicitly confirmed this product record as authentic.',
        icon: ShieldCheck,
        wrapper: 'border-green-200 bg-green-50',
        iconWrapper: 'bg-green-100 text-green-700',
        titleClass: 'text-green-900',
        textClass: 'text-green-800',
      }
    : result.authenticityStatus === 'unavailable'
      ? {
          title: 'Verification unavailable',
          description:
            'No authenticity result was received. This product must NOT be treated as verified.',
          icon: AlertTriangle,
          wrapper: 'border-amber-200 bg-amber-50',
          iconWrapper: 'bg-amber-100 text-amber-700',
          titleClass: 'text-amber-900',
          textClass: 'text-amber-800',
        }
      : result.authenticityStatus === 'not_found'
        ? {
            title: 'No blockchain record found',
            description:
              'The blockchain service has no verification record for this product. It is not verified.',
            icon: SearchX,
            wrapper: 'border-red-200 bg-red-50',
            iconWrapper: 'bg-red-100 text-red-700',
            titleClass: 'text-red-900',
            textClass: 'text-red-800',
          }
        : {
            title: 'Not verified',
            description:
              'The blockchain service responded but did not confirm this product as authentic.',
            icon: ShieldX,
            wrapper: 'border-red-200 bg-red-50',
            iconWrapper: 'bg-red-100 text-red-700',
            titleClass: 'text-red-900',
            textClass: 'text-red-800',
          };

  const Icon = presentation.icon;

  return (
    <div className="space-y-6">
      <div className={`rounded-xl border p-5 sm:p-6 ${presentation.wrapper}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${presentation.iconWrapper}`}
          >
            <Icon className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className={`text-xl font-bold ${presentation.titleClass}`}>
                {presentation.title}
              </h2>
              <StatusBadge
                label={isVerified ? 'On-chain confirmation received' : 'Not verified'}
                tone={isVerified ? 'success' : result.authenticityStatus === 'unavailable' ? 'warning' : 'danger'}
              />
            </div>
            <p className={`mt-1 text-sm ${presentation.textClass}`}>
              {presentation.description}
            </p>
            <p className="mt-2 text-sm font-medium">{result.message}</p>
            <p className="mt-2 text-xs opacity-80">
              Product ID: <span className="font-mono">{result.productId}</span>
              {result.verificationTimestamp
                ? ` · Checked ${formatDateTime(result.verificationTimestamp)}`
                : ''}
            </p>
          </div>
        </div>
      </div>

      {result.detailsAreDemo && (
        <DemoDataBanner
          title="Demo context details"
          message="The catalog, ownership, and shipment details below come from local sample data for context only. They are NOT part of a blockchain verification result and must not be used as proof of authenticity."
        />
      )}

      {result.blockchainVerified && result.blockchainReference && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Blockchain reference
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <InfoField
              label="Transaction hash"
              value={
                result.blockchainReference.txHash ? (
                  <span className="font-mono text-xs">
                    {shortHash(result.blockchainReference.txHash, 14, 10)}
                  </span>
                ) : (
                  'Not provided'
                )
              }
            />
            <InfoField
              label="Block number"
              value={
                result.blockchainReference.blockNumber !== undefined
                  ? result.blockchainReference.blockNumber.toLocaleString()
                  : 'Not provided'
              }
            />
            <InfoField
              label="Contract"
              value={result.blockchainReference.contractAddress ?? 'Not provided'}
              valueClassName="break-all font-mono text-xs"
            />
            <InfoField
              label="Explorer"
              value={
                result.blockchainReference.explorerUrl ? (
                  <a
                    href={result.blockchainReference.explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    Open explorer
                  </a>
                ) : (
                  'Not available'
                )
              }
            />
          </CardContent>
        </Card>
      )}

      {result.product && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Product details
              {result.detailsAreDemo && <StatusBadge label="Demo details" tone="warning" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-5 sm:flex-row">
              {result.product.productImage && (
                <img
                  src={result.product.productImage}
                  alt={result.product.name}
                  className="h-32 w-32 shrink-0 rounded-lg border object-cover"
                />
              )}
              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <h3 className="text-lg font-semibold">{result.product.name}</h3>
                  <p className="font-mono text-xs text-muted-foreground">
                    {result.product.productId} · {result.product.sku}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {result.product.description}
                </p>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <InfoField label="Category" value={result.product.category} icon={Box} />
                  <InfoField
                    label="Manufacturer"
                    value={result.manufacturer ?? result.product.manufacturer}
                    icon={Factory}
                  />
                  <InfoField
                    label="Manufacturing date"
                    value={
                      result.manufacturingDate || result.product.manufacturingDate
                        ? formatDate(
                            result.manufacturingDate ?? result.product.manufacturingDate
                          )
                        : 'Not provided'
                    }
                    icon={CalendarDays}
                  />
                  <InfoField
                    label="Origin"
                    value={result.productOrigin ?? result.product.productOrigin}
                    icon={MapPin}
                  />
                  <InfoField
                    label="Current owner"
                    value={result.currentOwner ?? 'Not reported'}
                    icon={UserRound}
                  />
                  <InfoField
                    label="Batch"
                    value={result.product.batchNumber}
                    icon={Package}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-5 w-5" />
              Ownership history
              {result.detailsAreDemo && result.ownershipHistory.length > 0 && (
                <StatusBadge label="Demo details" tone="warning" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.ownershipHistory.length === 0 ? (
              <EmptyState
                icon={UserRound}
                title="No ownership history returned"
                description="No ownership records were included in this verification response."
              />
            ) : (
              <ol className="space-y-4">
                {result.ownershipHistory.map((transfer) => {
                  const meta = getOwnershipStatusMeta(transfer.status);
                  return (
                    <li
                      key={transfer.id}
                      className="rounded-lg border p-3 text-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {transfer.previousOwner}
                          </p>
                          <p className="flex items-center gap-1 font-medium">
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            {transfer.newOwner}
                          </p>
                        </div>
                        <StatusBadge label={meta.label} tone={meta.tone} />
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {formatDate(transfer.transferDate)} · {transfer.location}
                      </p>
                    </li>
                  );
                })}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Shipment journey
              {result.detailsAreDemo && result.shipmentJourney.length > 0 && (
                <StatusBadge label="Demo details" tone="warning" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.shipmentJourney.length === 0 ? (
              <EmptyState
                icon={Truck}
                title="No shipment journey returned"
                description="No shipment records were included in this verification response."
              />
            ) : (
              <div className="space-y-3">
                {result.shipmentJourney.map((shipment) => {
                  const meta = getShipmentStatusMeta(shipment.status);
                  return (
                    <div key={shipment.id} className="rounded-lg border p-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-mono text-xs">{shipment.trackingNumber}</p>
                        <StatusBadge label={meta.label} tone={meta.tone} />
                      </div>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        {shipment.origin}
                        <ArrowRight className="h-3 w-3" />
                        {shipment.destination}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Created {formatDate(shipment.createdAt)}
                        {shipment.actualDelivery
                          ? ` · Delivered ${formatDate(shipment.actualDelivery)}`
                          : ''}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {result.transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Related transaction records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {result.transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex flex-col gap-1 rounded-lg border px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-xs">{shortHash(transaction.txHash, 14, 8)}</p>
                    <p className="text-xs text-muted-foreground">
                      {transaction.transactionType.replace(/_/g, ' ')} ·{' '}
                      {formatDateTime(transaction.timestamp)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {transaction.isDemo && <StatusBadge label="Demo data" tone="warning" />}
                    <StatusBadge
                      label={transaction.status}
                      tone={
                        transaction.status === 'confirmed'
                          ? 'success'
                          : transaction.status === 'pending'
                            ? 'warning'
                            : 'danger'
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}