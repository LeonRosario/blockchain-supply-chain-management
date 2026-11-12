import { useCallback, useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Clock,
  Package,
  RefreshCw,
  ShieldCheck,
  Truck,
} from 'lucide-react';
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
} from '@/components/common';
import { StatsCard } from '@/components/dashboard';
import analyticsService from '@/services/analytics.service';
import type { AnalyticsData } from '@/types';
import { formatNumber } from '@/utils';
import { errorMessage } from '@/services/serviceHelpers';

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [source, setSource] = useState<'api' | 'demo'>('demo');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await analyticsService.getDashboard();
      setData(response.data);
      setSource(response.source);
    } catch (loadError) {
      setError(errorMessage(loadError, 'Unable to load analytics.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-1/3 rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-28 rounded-xl bg-muted" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-80 rounded-xl bg-muted" />
          <div className="h-80 rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="mt-1 text-muted-foreground">
            Supply-chain performance, inventory, and blockchain activity insights.
          </p>
        </div>
        <Card>
          <CardContent className="space-y-4 p-8 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
            <h2 className="text-lg font-semibold">Analytics could not be loaded</h2>
            <ErrorMessage
              message={error ?? 'No analytics data was returned.'}
              className="mx-auto max-w-lg"
            />
            <Button onClick={load}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { summary } = data;
  const hasTimeline = data.timeline.some(
    (point) => point.shipments > 0 || point.deliveries > 0 || point.transactions > 0
  );
  const hasCategories = data.categories.length > 0;
  const hasWarehouses = data.warehouses.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="mt-1 text-muted-foreground">
            Shipment throughput, inventory distribution, and blockchain activity.
          </p>
        </div>
        <Button variant="outline" onClick={load}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {source === 'demo' && (
        <DemoDataBanner
          title="Demo analytics"
          message="The analytics API is unavailable, so these charts are computed from the local demo dataset. Blockchain authenticity figures remain unavailable; verified products are reported as 0 until a live backend confirms a verification."
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Total products"
          value={formatNumber(summary.totalProducts)}
          icon={Package}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatsCard
          title="Total shipments"
          value={formatNumber(summary.totalShipments)}
          icon={Truck}
          iconColor="text-violet-600"
          bgColor="bg-violet-50"
        />
        <StatsCard
          title="Available stock"
          value={formatNumber(summary.availableStock)}
          icon={Boxes}
          iconColor="text-green-600"
          bgColor="bg-green-50"
        />
        <StatsCard
          title="Verified products"
          value={formatNumber(summary.verifiedProducts)}
          icon={ShieldCheck}
          iconColor="text-amber-600"
          bgColor="bg-amber-50"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Delivered shipments</p>
          <p className="mt-1 text-2xl font-bold">
            {formatNumber(summary.deliveredShipments)}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">On-time delivery</p>
          <p className="mt-1 text-2xl font-bold">
            {summary.onTimeDeliveryRate.toFixed(1)}%
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Average delivery time</p>
          <p className="mt-1 text-2xl font-bold">
            {summary.averageDeliveryDays.toFixed(1)} days
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Low stock records
          </p>
          <p className="mt-1 text-2xl font-bold">{summary.lowStockProducts}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Shipment & transaction trend</CardTitle>
          </CardHeader>
          <CardContent>
            {!hasTimeline ? (
              <EmptyState
                icon={Truck}
                title="No activity to chart"
                description="Shipment and transaction activity will appear here once records exist."
              />
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.timeline} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
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
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line
                      type="monotone"
                      dataKey="shipments"
                      name="Shipments"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="deliveries"
                      name="Deliveries"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="transactions"
                      name="Transactions"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Products by category</CardTitle>
          </CardHeader>
          <CardContent>
            {!hasCategories ? (
              <EmptyState
                icon={Package}
                title="No category data"
                description="Category distribution will appear once products are available."
              />
            ) : (
              <div className="flex flex-col items-center gap-4 lg:flex-row">
                <div className="h-[240px] w-full lg:w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.categories}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={50}
                        outerRadius={85}
                        paddingAngle={2}
                      >
                        {data.categories.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: 8,
                          border: '1px solid #e5e7eb',
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="w-full space-y-2 lg:w-1/2">
                  {data.categories.map((entry) => (
                    <li
                      key={entry.name}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="truncate">{entry.name}</span>
                      </span>
                      <span className="font-medium">{entry.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Stock by warehouse</CardTitle>
          </CardHeader>
          <CardContent>
            {!hasWarehouses ? (
              <EmptyState
                icon={Boxes}
                title="No warehouse stock"
                description="Warehouse inventory distribution will appear here."
              />
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.warehouses} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: '1px solid #e5e7eb',
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="available" name="Available" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="reserved" name="Reserved" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top products by stock</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topProducts.length === 0 ? (
              <EmptyState
                icon={Boxes}
                title="No stock data"
                description="Inventory records are required to rank products by stock."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-3 py-2 font-medium">Product</th>
                      <th className="px-3 py-2 font-medium">Product ID</th>
                      <th className="px-3 py-2 text-right font-medium">Units</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.topProducts.map((product) => (
                      <tr key={product.productId}>
                        <td className="px-3 py-2 font-medium">{product.name}</td>
                        <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                          {product.productId}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {formatNumber(product.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex items-start gap-3 p-5 text-sm">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <div>
            <p className="font-medium">Authenticity metrics</p>
            <p className="mt-1 text-muted-foreground">
              {source === 'demo'
                ? 'No blockchain verification service is connected, so verified products are reported as 0. These figures are not authenticity claims.'
                : `${summary.verifiedProducts} product${
                    summary.verifiedProducts === 1 ? '' : 's'
                  } confirmed by the blockchain service; ${summary.unavailableAuthenticity} awaiting a verification response.`}
            </p>
          </div>
        </CardContent>
      </Card>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <CheckCircle2 className="h-4 w-4" />
        Analytics are derived from the connected API when available; demo figures are
        labelled above.
      </p>
    </div>
  );
}