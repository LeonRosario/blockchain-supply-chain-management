import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Hash,
  Link2,
  RefreshCw,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@/components/ui';
import {
  CopyButton,
  DemoDataBanner,
  ErrorMessage,
  InfoField,
  StatusBadge,
} from '@/components/common';
import { DrawLine, FadeIn } from '@/components/motion';
import blockchainService from '@/services/blockchain.service';
import type { BlockchainTransaction } from '@/types';
import {
  cn,
  formatDateTime,
  getTransactionStatusMeta,
  titleCase,
} from '@/utils';
import { errorMessage } from '@/services/serviceHelpers';

export default function BlockchainTransactionDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState<BlockchainTransaction | null>(null);
  const [source, setSource] = useState<'api' | 'demo'>('demo');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setError('Transaction not found.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await blockchainService.getTransaction(id);
      setTransaction(response.data);
      setSource(response.source);
    } catch (loadError) {
      setError(errorMessage(loadError, 'Transaction not found.'));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (isLoading) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading transaction">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-64 max-w-full" />
          </div>
        </div>
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/blockchain/transactions')}
            aria-label="Back to transactions"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Transaction Details</h1>
        </div>
        <Card>
          <CardContent className="space-y-4 p-8 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
            <h2 className="text-lg font-semibold">Transaction could not be loaded</h2>
            <ErrorMessage
              message={error ?? 'Transaction not found.'}
              className="mx-auto max-w-lg"
            />
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={load}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
              <Button onClick={() => navigate('/blockchain/transactions')}>
                Back to transactions
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const meta = getTransactionStatusMeta(transaction.status);
  const isDemo = source === 'demo' || Boolean(transaction.isDemo);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/blockchain/transactions')}
            aria-label="Back to transactions"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <p className="font-mono text-xs text-muted-foreground">
              {transaction.id}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {titleCase(transaction.transactionType)}
              </h1>
              <StatusBadge
                label={meta.label}
                tone={meta.tone}
                dot
                pulse={transaction.status === 'pending'}
              />
              {isDemo && <StatusBadge label="Demo data" tone="warning" />}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDateTime(transaction.timestamp)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyButton
            value={transaction.txHash}
            label="Copy transaction hash"
            text="Copy hash"
            showText
            variant="outline"
          />
          <Button variant="outline" onClick={load}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {isDemo && (
        <DemoDataBanner
          title="Local demo transaction"
          message="This record is not on a blockchain. Its hash is intentionally fake, the block number is 0, and it exists only in the local demo database."
        />
      )}

      <FadeIn inView={false} delay={0.04}>
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Link2 className="h-4 w-4" />
              </span>
              Record path
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Addresses and entity exactly as reported by this record. A path
              reference does not prove product authenticity.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-[1fr_2.5rem_1fr_2.5rem_1fr] sm:items-center">
              <PathNode
                label="From address"
                value={transaction.fromAddress}
                mono
                copy
              />
              <FlowConnector />
              <PathNode
                label={titleCase(transaction.entityType)}
                value={transaction.entityId}
              />
              <FlowConnector />
              <PathNode
                label="To address"
                value={transaction.toAddress ?? 'Not provided'}
                mono
                muted={!transaction.toAddress}
                copy={Boolean(transaction.toAddress)}
              />
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn inView={false} delay={0.08}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Transaction reference
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Transaction hash
                </p>
                <p className="mt-1 break-all font-mono text-sm">{transaction.txHash}</p>
              </div>
              <CopyButton
                value={transaction.txHash}
                label="Copy transaction hash"
                className="h-8 w-8 shrink-0"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <InfoField
              label="Block number"
              value={
                transaction.blockNumber === 0 ? '0 (not on-chain)' : transaction.blockNumber
              }
            />
            <InfoField label="Status" value={meta.label} />
            <InfoField
              label="Gas used"
              value={
                transaction.gasUsed !== undefined
                  ? transaction.gasUsed.toLocaleString()
                  : 'Not reported'
              }
            />
            <InfoField
              label="Explorer"
              value={
                !isDemo && transaction.explorerUrl ? (
                  <a
                    href={transaction.explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center text-primary hover:underline"
                  >
                    Open explorer
                    <ExternalLink className="ml-1 h-3.5 w-3.5" />
                  </a>
                ) : (
                  'Not available'
                )
              }
            />
          </div>
        </CardContent>
      </Card>
      </FadeIn>

      <FadeIn inView={false} delay={0.12}>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Entity & addresses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoField
              label="Transaction type"
              value={titleCase(transaction.transactionType)}
            />
            <InfoField
              label="Entity"
              value={`${titleCase(transaction.entityType)} · ${transaction.entityId}`}
            />
            <InfoField
              label="Product"
              value={transaction.productName ?? transaction.productId ?? 'Not linked'}
            />
            <InfoField
              label="From address"
              value={transaction.fromAddress}
              valueClassName="break-all font-mono text-xs"
            />
            <InfoField
              label="To address"
              value={transaction.toAddress ?? 'Not provided'}
              valueClassName="break-all font-mono text-xs"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Transaction data
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transaction.data && Object.keys(transaction.data).length > 0 ? (
              <pre className="max-h-96 overflow-auto rounded-lg bg-muted p-4 text-xs">
                {JSON.stringify(transaction.data, null, 2)}
              </pre>
            ) : (
              <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                No additional transaction data was returned.
              </p>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              A transaction reference does not by itself prove that a product is
              authentic. Use{' '}
              <Link to="/blockchain/verify" className="text-primary hover:underline">
                product verification
              </Link>{' '}
              for an authenticity result.
            </p>
          </CardContent>
        </Card>
      </div>
      </FadeIn>
    </div>
  );
}

function FlowConnector() {
  return (
    <div className="flex items-center justify-center" aria-hidden="true">
      <DrawLine orientation="horizontal" className="hidden w-10 sm:block" />
      <ArrowRight className="h-4 w-4 text-muted-foreground sm:hidden" />
    </div>
  );
}

function PathNode({
  label,
  value,
  mono = false,
  muted = false,
  copy = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  muted?: boolean;
  copy?: boolean;
}) {
  return (
    <div
      className={cn(
        'min-w-0 rounded-xl border p-3',
        muted
          ? 'border-dashed border-border bg-muted/20'
          : 'border-border/70 bg-muted/30'
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 flex items-start gap-1">
        <p
          className={cn(
            'min-w-0 flex-1 break-all text-sm',
            mono && 'font-mono text-xs',
            muted && 'text-muted-foreground'
          )}
        >
          {value}
        </p>
        {copy && (
          <CopyButton
            value={value}
            label={`Copy ${label.toLowerCase()}`}
            className="h-6 w-6 shrink-0 text-muted-foreground"
          />
        )}
      </div>
    </div>
  );
}