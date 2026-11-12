import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Download,
  Eye,
  Link2,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
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
import blockchainService from '@/services/blockchain.service';
import type {
  BlockchainTransaction,
  BlockchainTransactionFilters,
  TransactionStatus,
  TransactionType,
} from '@/types';
import {
  formatDateTime,
  getTransactionStatusMeta,
  shortHash,
  titleCase,
} from '@/utils';
import { errorMessage } from '@/services/serviceHelpers';

const transactionTypes: TransactionType[] = [
  'product_created',
  'product_updated',
  'shipment_created',
  'shipment_status_changed',
  'inventory_updated',
  'ownership_transfer',
  'qr_verified',
];

const statuses: TransactionStatus[] = ['confirmed', 'pending', 'failed'];

export default function BlockchainTransactionsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [transactions, setTransactions] = useState<BlockchainTransaction[]>([]);
  const [source, setSource] = useState<'api' | 'demo'>('demo');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [type, setType] = useState<TransactionType | 'all'>('all');
  const [status, setStatus] = useState<TransactionStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const filters: BlockchainTransactionFilters = {
      search: search.trim() || undefined,
      type,
      status,
      page,
      limit,
    };
    try {
      const response = await blockchainService.getTransactions(filters);
      setTransactions(response.data);
      setSource(response.source);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (loadError) {
      setError(errorMessage(loadError, 'Unable to load blockchain transactions.'));
    } finally {
      setIsLoading(false);
    }
  }, [search, type, status, page, limit]);

  useEffect(() => {
    const timer = window.setTimeout(load, search ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [load, search]);

  const resetFilters = () => {
    setSearch('');
    setType('all');
    setStatus('all');
    setPage(1);
  };

  const exportCsv = async () => {
    try {
      const response = await blockchainService.getTransactions({
        search: search.trim() || undefined,
        type,
        status,
        page: 1,
        limit: 10_000,
      });
      if (response.data.length === 0) {
        toast.error('Nothing to export', 'No transactions match the current filters.');
        return;
      }
      const header = [
        'ID',
        'Transaction hash',
        'Block',
        'Type',
        'Entity',
        'Product',
        'From',
        'To',
        'Status',
        'Timestamp',
        'Demo record',
      ];
      const rows = response.data.map((transaction) => [
        transaction.id,
        transaction.txHash,
        transaction.blockNumber,
        transaction.transactionType,
        transaction.entityId,
        transaction.productName ?? transaction.productId ?? '',
        transaction.fromAddress,
        transaction.toAddress ?? '',
        transaction.status,
        transaction.timestamp,
        transaction.isDemo ? 'YES (not on-chain)' : 'no',
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
      link.download = `blockchain-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(
        'Transactions exported',
        response.source === 'demo'
          ? 'The export contains clearly marked demo records only.'
          : `${response.data.length} records written to CSV.`
      );
    } catch (exportError) {
      toast.error('Export failed', errorMessage(exportError));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blockchain Transactions</h1>
          <p className="mt-1 text-muted-foreground">
            Review transaction records returned by the blockchain service.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={load} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {source === 'demo' && (
        <DemoDataBanner
          title="Demo transactions — not on-chain"
          message="No blockchain API is reachable. These records use clearly fake 0xdemo… hashes with block number 0. They are local samples and must not be treated as blockchain-verified."
        />
      )}

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Transaction ledger</CardTitle>
          <Button variant="ghost" size="sm" onClick={resetFilters}>
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
              placeholder="Search hash, transaction ID, product, or address…"
              ariaLabel="Search blockchain transactions"
            />
            <select
              value={type}
              onChange={(event) => {
                setType(event.target.value as TransactionType | 'all');
                setPage(1);
              }}
              className="h-9 rounded-md border bg-background px-3 text-sm"
              aria-label="Filter by transaction type"
            >
              <option value="all">All transaction types</option>
              {transactionTypes.map((option) => (
                <option key={option} value={option}>
                  {titleCase(option)}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as TransactionStatus | 'all');
                setPage(1);
              }}
              className="h-9 rounded-md border bg-background px-3 text-sm"
              aria-label="Filter by transaction status"
            >
              <option value="all">All statuses</option>
              {statuses.map((option) => (
                <option key={option} value={option}>
                  {getTransactionStatusMeta(option).label}
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
            <TableSkeleton rows={7} columns={7} />
          ) : transactions.length === 0 ? (
            <EmptyState
              icon={Link2}
              title="No transactions found"
              description={
                search || type !== 'all' || status !== 'all'
                  ? 'No transaction records match the current filters.'
                  : 'No blockchain transaction records are available.'
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
                    <th className="px-3 py-3 font-medium">Transaction</th>
                    <th className="px-3 py-3 font-medium">Type</th>
                    <th className="px-3 py-3 font-medium">Entity / product</th>
                    <th className="px-3 py-3 font-medium">Block</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium">Timestamp</th>
                    <th className="px-3 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transactions.map((transaction) => {
                    const meta = getTransactionStatusMeta(transaction.status);
                    return (
                      <tr key={transaction.id} className="hover:bg-muted/40">
                        <td className="px-3 py-3">
                          <p className="font-mono text-xs" title={transaction.txHash}>
                            {shortHash(transaction.txHash, 12, 8)}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-1">
                            {transaction.isDemo ? (
                              <StatusBadge label="Demo data" tone="warning" />
                            ) : (
                              <StatusBadge label="API record" tone="info" />
                            )}
                            <span className="text-xs text-muted-foreground">
                              {transaction.id}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          {titleCase(transaction.transactionType)}
                        </td>
                        <td className="px-3 py-3">
                          <p>{transaction.productName ?? transaction.entityId}</p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {transaction.entityType} · {transaction.entityId}
                          </p>
                        </td>
                        <td className="px-3 py-3">
                          {transaction.isDemo || transaction.blockNumber === 0
                            ? '—'
                            : transaction.blockNumber.toLocaleString()}
                        </td>
                        <td className="px-3 py-3">
                          <StatusBadge label={meta.label} tone={meta.tone} dot />
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">
                          {formatDateTime(transaction.timestamp)}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              navigate(`/blockchain/transactions/${transaction.id}`)
                            }
                            aria-label={`View transaction ${transaction.id}`}
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

          {!isLoading && transactions.length > 0 && (
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

          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            Only a live verification response can confirm authenticity.{' '}
            <Link to="/blockchain/verify" className="text-primary hover:underline">
              Verify a product
            </Link>
            .
          </div>
        </CardContent>
      </Card>
    </div>
  );
}