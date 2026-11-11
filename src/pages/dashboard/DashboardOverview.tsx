import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Truck, CheckCircle, Clock, BarChart3 } from 'lucide-react';
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
  const [stats, setStats] = useState<ProductStats>(mockProductStats);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>(mockRecentActivity);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Try to fetch from API, fall back to mock data
        const [statsRes, activityRes] = await Promise.allSettled([
          productService.getStats(),
          productService.getRecentActivity(10),
        ]);

        if (statsRes.status === 'fulfilled' && statsRes.value.success) {
          setStats(statsRes.value.data);
        }

        if (activityRes.status === 'fulfilled' && activityRes.value.success) {
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
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
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
      trend: { value: 12, label: 'vs last month', isPositive: true },
      onClick: () => handleViewProducts(),
    },
    {
      title: 'In Transit',
      value: stats.inTransit,
      icon: Truck,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      trend: { value: 5, label: 'vs last week', isPositive: true },
      onClick: () => handleViewProducts('in_transit'),
    },
    {
      title: 'Delivered',
      value: stats.delivered,
      icon: CheckCircle,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: { value: 8, label: 'vs last month', isPositive: true },
      onClick: () => handleViewProducts('delivered'),
    },
    {
      title: 'Pending Shipments',
      value: stats.pendingShipments,
      icon: Clock,
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
      trend: { value: -3, label: 'vs last week', isPositive: false },
      onClick: () => handleViewProducts('active'),
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
        <Button onClick={() => navigate('/dashboard/products/add')}>
          <Package className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

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
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/products')}>
              View All
            </Button>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <Button variant="outline" className="mt-4 w-full" onClick={() => navigate('/dashboard/shipments')}>
              View Shipments
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-green-100 p-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">Verify QR Code</h3>
                <p className="text-sm text-muted-foreground">Scan and verify product authenticity</p>
              </div>
            </div>
            <Button variant="outline" className="mt-4 w-full" onClick={() => navigate('/dashboard/qr-verification')}>
              Verify QR
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Product Status Summary</CardTitle>
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
    </div>
  );
}