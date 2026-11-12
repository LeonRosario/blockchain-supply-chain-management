import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Copy,
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
} from '@/components/ui';
import { useToast } from '@/components/ui';
import {
  DemoDataBanner,
  ErrorMessage,
  InfoField,
  StatusBadge,
} from '@/components/common';
import blockchainService from '@/services/blockchain.service';
import type { BlockchainTransaction } from '@/types';
import {
  formatDateTime,
  getTransactionStatusMeta,
  titleCase,
} from '@/utils';
import { errorMessage } from '@/services/serviceHelpers';

export default function BlockchainTransactionDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
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

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Could not copy value');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-1/3 rounded bg-muted" />
        <div className="h-56 rounded-xl bg-muted" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-64 rounded-xl bg-muted" />
          <div className="h-64 rounded-xl bg-muted" />
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
              <StatusBadge label={meta.label} tone={meta.tone} dot />
              {isDemo && <StatusBadge label="Demo data" tone="warning" />}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDateTime(transaction.timestamp)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleCopy(transaction.txHash)}>
            <Copy className="mr-2 h-4 w-4" />
            Copy hash
          </Button>
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
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => handleCopy(transaction.txHash)}
                aria-label="Copy transaction hash"
              >
                <Copy className="h-4 w-4" />
              </Button>
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
    </div>
  );
}