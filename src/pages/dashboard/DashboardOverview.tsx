import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Truck, CheckCircle, Clock, BarChart3, History } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
} from '@/components/ui';
import {
  StatsCard,
  ActivityFeed,
  ProductStatsChart,
} from '@/components/dashboard';
import { DemoDataBanner, StatusBadge } from '@/components/common';
import { useAuth } from '@/hooks';
import productService from '@/services/product.service';
import type { ProductStats, ProductStatus } from '@/types';
import { mockProducts, mockProductStats, mockRecentActivity, mockStatsChartData } from '@/data/mockProducts';

type ActivityItem = {
  id: string;
  type: 'created' | 'updated' | 'shipped' | 'delivered' | 'recalled';
  product: { id: string; productId: string; name: string; status: ProductStatus };
  timestamp: string;
  user?: string;
};

export default function DashboardOverview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManageOperations = Boolean(user && user.role !== 'customer');
  const [stats, setStats] = useState<ProductStats>(mockProductStats);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>(mockRecentActivity);
  const [isDemo, setIsDemo] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Only replace the sample dashboard when both datasets come from the
        // API. Mixing one live result with sample data would misrepresent it.
        const [statsRes, activityRes] = await Promise.allSettled([
          productService.getStats(),
          productService.getRecentActivity(10),
        ]);

        const statsOk = statsRes.status === 'fulfilled' && statsRes.value.success;
        const activityOk =
          activityRes.status === 'fulfilled' && activityRes.value.success;

        if (!statsOk || !activityOk) {
          setIsDemo(true);
          return;
        }

        setStats(statsRes.value.data);
        const activities: ActivityItem[] = activityRes.value.data.map((product) => ({
          id: `act-${product.id}`,
          type: (product.status === 'delivered' ? 'delivered' :
            product.status === 'in_transit' ? 'shipped' : 'created') as ActivityItem['type'],
          product: {
            id: product.id,
            productId: product.productId,
            name: product.name,
            status: product.status,
          },
          timestamp: product.updatedAt,
          user: 'System',
        }));
        setRecentActivity(activities);
        setIsDemo(false);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setIsDemo(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleViewProducts = (filter?: string) => {
    if (filter) {
      navigate(`/dashboard/products?status=${filter}`);
    } else {
      navigate('/dashboard/products');
    }
  };

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      onClick: canManageOperations ? () => handleViewProducts() : undefined,
    },
    {
      title: 'In Transit',
      value: stats.inTransit,
      icon: Truck,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      onClick: canManageOperations ? () => handleViewProducts('in_transit') : undefined,
    },
    {
      title: 'Delivered',
      value: stats.delivered,
      icon: CheckCircle,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
      onClick: canManageOperations ? () => handleViewProducts('delivered') : undefined,
    },
    {
      title: 'Pending Shipments',
      value: stats.pendingShipments,
      icon: Clock,
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
      onClick: canManageOperations ? () => handleViewProducts('active') : undefined,
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-4 w-1/3 bg-gray-200 rounded mb-4" />
                <div className="h-8 w-1/2 bg-gray-200 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card><CardContent className="p-6 h-80"><div className="h-full bg-gray-100 rounded" /></CardContent></Card>
          <Card><CardContent className="p-6 h-80"><div className="h-full bg-gray-100 rounded" /></CardContent></Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="mt-1 text-muted-foreground">
            Monitor your supply chain products and shipments at a glance.
          </p>
        </div>
        {canManageOperations && (
          <Button onClick={() => navigate('/dashboard/products/add')}>
            <Package className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        )}
      </div>

      {isDemo && (
        <DemoDataBanner
          title="Sample dashboard data"
          message="The product metrics, distribution chart, and recent activity below come from local demo records because the dashboard API did not return both datasets. They are not live supply-chain records."
        />
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Product Distribution
              <StatusBadge label="Sample data" tone="warning" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProductStatsChart stats={mockStatsChartData} />
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Activity
            </CardTitle>
            {canManageOperations && (
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/products')}>
                View All
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <ActivityFeed
              activities={recentActivity}
              title=""
              showViewAll={false}
              maxItems={5}
            />
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div
        className={`grid grid-cols-1 gap-4 ${
          canManageOperations ? 'md:grid-cols-3' : 'md:grid-cols-2'
        }`}
      >
        {canManageOperations && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-blue-100 p-3">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Add New Product</h3>
                  <p className="text-sm text-muted-foreground">Register a new product in the supply chain</p>
                </div>
              </div>
              <Button className="mt-4 w-full" onClick={() => navigate('/dashboard/products/add')}>
                Create Product
              </Button>
            </CardContent>
          </Card>
        )}

        {canManageOperations && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-purple-100 p-3">
                  <Truck className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">View Shipments</h3>
                  <p className="text-sm text-muted-foreground">Track products in transit</p>
                </div>
              </div>
              <Button variant="outline" className="mt-4 w-full" onClick={() => navigate('/shipments')}>
                View Shipments
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-green-100 p-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">Verify Product</h3>
                <p className="text-sm text-muted-foreground">Scan and verify product authenticity</p>
              </div>
            </div>
            <Button variant="outline" className="mt-4 w-full" onClick={() => navigate('/blockchain/verify')}>
              Verify Product
            </Button>
          </CardContent>
        </Card>

        {!canManageOperations && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-slate-100 p-3">
                  <History className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Verification History</h3>
                  <p className="text-sm text-muted-foreground">Review your previous product checks</p>
                </div>
              </div>
              <Button variant="outline" className="mt-4 w-full" onClick={() => navigate('/customer/history')}>
                Open History
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Status Summary */}
      {canManageOperations && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Product Status Summary
              <StatusBadge label="Sample data" tone="warning" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { status: 'active', label: 'Active', count: mockProducts.filter(p => p.status === 'active').length, color: 'bg-blue-100 text-blue-700' },
                { status: 'in_transit', label: 'In Transit', count: mockProducts.filter(p => p.status === 'in_transit').length, color: 'bg-purple-100 text-purple-700' },
                { status: 'delivered', label: 'Delivered', count: mockProducts.filter(p => p.status === 'delivered').length, color: 'bg-green-100 text-green-700' },
                { status: 'inactive', label: 'Inactive', count: mockProducts.filter(p => p.status === 'inactive').length, color: 'bg-gray-100 text-gray-700' },
                { status: 'recalled', label: 'Recalled', count: mockProducts.filter(p => p.status === 'recalled').length, color: 'bg-red-100 text-red-700' },
              ].map((item) => (
                <Button
                  key={item.status}
                  variant="outline"
                  className={`h-auto p-4 text-left ${item.color}`}
                  onClick={() => handleViewProducts(item.status)}
                >
                  <div className="text-2xl font-bold">{item.count}</div>
                  <div className="text-sm font-medium">{item.label}</div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}