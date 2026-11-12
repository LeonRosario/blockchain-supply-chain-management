import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  Clock,
  Database,
  ExternalLink,
  Link2,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
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
  InfoField,
  StatusBadge,
  TableSkeleton,
} from '@/components/common';
import { StatsCard } from '@/components/dashboard';
import blockchainService from '@/services/blockchain.service';
import type {
  BlockchainStats,
  BlockchainTransaction,
} from '@/types';
import {
  formatDateTime,
  getTransactionStatusMeta,
  shortHash,
  titleCase,
} from '@/utils';
import { errorMessage } from '@/services/serviceHelpers';

function buildVolumeSeries(transactions: BlockchainTransaction[]) {
  const days: Array<{ key: string; label: string; total: number; confirmed: number }> = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    days.push({
      key: date.toISOString().slice(0, 10),
      label: date.toLocaleString('en-US', { weekday: 'short' }),
      total: 0,
      confirmed: 0,
    });
  }
  for (const transaction of transactions) {
    const key = new Date(transaction.timestamp).toISOString().slice(0, 10);
    const bucket = days.find((day) => day.key === key);
    if (!bucket) continue;
    bucket.total += 1;
    if (transaction.status === 'confirmed') bucket.confirmed += 1;
  }
  return days;
}

export default function BlockchainDashboardPage() {
  const [stats, setStats] = useState<BlockchainStats | null>(null);
  const [transactions, setTransactions] = useState<BlockchainTransaction[]>([]);
  const [source, setSource] = useState<'api' | 'demo'>('demo');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const [statsResult, transactionResult] = await Promise.allSettled([
      blockchainService.getStats(),
      blockchainService.getTransactions({ page: 1, limit: 50 }),
    ]);
    if (statsResult.status === 'fulfilled') {
      setStats(statsResult.value.data);
      setSource(statsResult.value.source);
    } else {
      setError(errorMessage(statsResult.reason, 'Unable to load blockchain statistics.'));
    }
    if (transactionResult.status === 'fulfilled') {
      setTransactions(transactionResult.value.data);
      if (transactionResult.value.source === 'demo') setSource('demo');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const volume = useMemo(() => buildVolumeSeries(transactions), [transactions]);
  const recent = transactions.slice(0, 6);
  const isDemo = source === 'demo' || Boolean(stats?.isDemo);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blockchain</h1>
          <p className="mt-1 text-muted-foreground">
            Inspect blockchain service status, transaction references, and product
            verification.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button asChild>
            <Link to="/blockchain/transactions">
              <Boxes className="mr-2 h-4 w-4" />
              View transactions
            </Link>
          </Button>
        </div>
      </div>

      {isDemo && (
        <DemoDataBanner
          title="No live blockchain connection"
          message="No blockchain RPC/API service is reachable. All transactions and statistics below are local sample records. They are NOT on-chain data and must not be presented as blockchain-verified."
        />
      )}

      {error && (
        <div className="space-y-2">
          <ErrorMessage message={error} />
          <Button variant="outline" size="sm" onClick={load}>
            Try again
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Transactions"
          value={stats?.totalTransactions ?? 0}
          icon={Link2}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatsCard
          title="Confirmed"
          value={stats?.successfulTransactions ?? 0}
          icon={CheckCircle2}
          iconColor="text-green-600"
          bgColor="bg-green-50"
        />
        <StatsCard
          title="Pending"
          value={stats?.pendingTransactions ?? 0}
          icon={Clock}
          iconColor="text-amber-600"
          bgColor="bg-amber-50"
        />
        <StatsCard
          title="Failed"
          value={stats?.failedTransactions ?? 0}
          icon={XCircle}
          iconColor="text-red-600"
          bgColor="bg-red-50"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Transaction activity (last 7 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={volume} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
                  <defs>
                    <linearGradient id="txTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.32} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="txConfirmed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.32} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: '1px solid #e5e7eb',
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="All transactions"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#txTotal)"
                  />
                  <Area
                    type="monotone"
                    dataKey="confirmed"
                    name="Confirmed"
                    stroke="#22c55e"
                    strokeWidth={2}
                    fill="url(#txConfirmed)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Activity is charted from the {isDemo ? 'local demo dataset' : 'loaded transaction records'}.
              {isDemo && ' It does not represent on-chain activity.'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Network status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm text-muted-foreground">Connection</span>
              <StatusBadge
                label={
                  stats?.networkStatus === 'connected'
                    ? 'Connected'
                    : stats?.networkStatus === 'degraded'
                      ? 'Degraded'
                      : 'Disconnected'
                }
                tone={
                  stats?.networkStatus === 'connected'
                    ? 'success'
                    : stats?.networkStatus === 'degraded'
                      ? 'warning'
                      : 'danger'
                }
                dot
              />
            </div>
            <InfoField
              label="Network"
              value={stats?.networkName ?? 'No blockchain RPC connection'}
            />
            <InfoField
              label="Latest block"
              value={
                isDemo
                  ? 'Unavailable (no RPC)'
                  : stats?.latestBlock !== undefined
                    ? stats.latestBlock.toLocaleString()
                    : 'Unavailable'
              }
            />
            <InfoField
              label="Contract address"
              value={stats?.contractAddress ?? 'Not configured'}
              valueClassName="font-mono text-xs"
            />
            <Button className="w-full" asChild>
              <Link to="/blockchain/verify">
                <ScanLine className="mr-2 h-4 w-4" />
                Verify a product
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Latest transactions</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/blockchain/transactions">
              View all
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton rows={5} columns={6} />
          ) : recent.length === 0 ? (
            <EmptyState
              icon={Database}
              title="No transactions available"
              description="No blockchain transaction records were returned."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-3 font-medium">Transaction</th>
                    <th className="px-3 py-3 font-medium">Type</th>
                    <th className="px-3 py-3 font-medium">Product</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium">Time</th>
                    <th className="px-3 py-3 text-right font-medium">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recent.map((transaction) => {
                    const meta = getTransactionStatusMeta(transaction.status);
                    return (
                      <tr key={transaction.id} className="hover:bg-muted/40">
                        <td className="px-3 py-3">
                          <Link
                            to={`/blockchain/transactions/${transaction.id}`}
                            className="font-mono text-primary hover:underline"
                            title={transaction.txHash}
                          >
                            {shortHash(transaction.txHash)}
                          </Link>
                          <div className="mt-1">
                            <StatusBadge
                              label={transaction.isDemo ? 'Demo data' : 'API record'}
                              tone={transaction.isDemo ? 'warning' : 'info'}
                            />
                          </div>
                        </td>
                        <td className="px-3 py-3">{titleCase(transaction.transactionType)}</td>
                        <td className="px-3 py-3">
                          {transaction.productName ?? transaction.productId ?? '—'}
                        </td>
                        <td className="px-3 py-3">
                          <StatusBadge
                            label={meta.label}
                            tone={meta.tone}
                            dot
                            pulse={transaction.status === 'pending'}
                          />
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">
                          {formatDateTime(transaction.timestamp)}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <Link
                              to={`/blockchain/transactions/${transaction.id}`}
                              aria-label={`View transaction ${transaction.txHash}`}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
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
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-info/10 p-3 text-info">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">Authenticity verification</h3>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Product verification only reports “verified” when a live blockchain
                service explicitly confirms the product. If the service is unavailable,
                products are shown as unverified with no authenticity claim.
              </p>
            </div>
          </div>
          <Button variant="outline" asChild className="shrink-0">
            <Link to="/blockchain/verify">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Open verification
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}