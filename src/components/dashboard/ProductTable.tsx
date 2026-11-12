import { cn } from '@/utils/cn';
import { formatDate } from '@/utils/formatDate';
import type { Product, ProductStatus } from '@/types';
import {
  Button,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Eye,
  Edit,
  Trash2,
  Download,
} from 'lucide-react';
import { useState, useMemo } from 'react';

interface ProductTableProps {
  products: Product[];
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onDownloadQR: (product: Product) => void;
  isLoading?: boolean;
  totalCount?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

const statusConfig: Record<ProductStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'Active', variant: 'default' },
  inactive: { label: 'Inactive', variant: 'secondary' },
  recalled: { label: 'Recalled', variant: 'destructive' },
  in_transit: { label: 'In Transit', variant: 'outline' },
  delivered: { label: 'Delivered', variant: 'default' },
};

const categories = [
  'Electronics',
  'Food & Beverages',
  'Pharmaceuticals',
  'Automotive',
  'Textiles',
  'Chemicals',
  'Machinery',
  'Consumer Goods',
];

type SortableKey = 'productId' | 'name' | 'category' | 'manufacturer' | 'status' | 'quantity' | 'price' | 'manufacturingDate';

const sortableKeys: SortableKey[] = ['productId', 'name', 'category', 'manufacturer', 'status', 'quantity', 'price', 'manufacturingDate'];

export default function ProductTable({
  products,
  onView,
  onEdit,
  onDelete,
  onDownloadQR,
  isLoading = false,
  totalCount = 0,
  currentPage = 1,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
}: ProductTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: 'asc' | 'desc' } | null>(null);

  const filteredProducts = useMemo(() => {
    let result = products;

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.productId.toLowerCase().includes(searchLower) ||
          p.sku.toLowerCase().includes(searchLower) ||
          p.category.toLowerCase().includes(searchLower) ||
          p.manufacturer.toLowerCase().includes(searchLower)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((p) => p.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      result = result.filter((p) => p.category === categoryFilter);
    }

    if (sortConfig) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [products, search, statusFilter, categoryFilter, sortConfig]);

  const handleSort = (key: SortableKey) => {
    setSortConfig((current) => {
      if (current?.key === key && current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const SortIcon = ({ columnKey }: { columnKey: SortableKey }) => {
    if (sortConfig?.key !== columnKey) {
      return <ChevronDown className="w-4 h-4 text-muted-foreground" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="w-4 h-4 text-primary" />
    ) : (
      <ChevronDown className="w-4 h-4 text-primary" />
    );
  };

  const columns = [
    { key: 'productId', label: 'Product ID' },
    { key: 'name', label: 'Name' },
    { key: 'category', label: 'Category' },
    { key: 'manufacturer', label: 'Manufacturer' },
    { key: 'status', label: 'Status' },
    { key: 'quantity', label: 'Qty' },
    { key: 'price', label: 'Price' },
    { key: 'manufacturingDate', label: 'Mfg Date' },
    { key: 'actions', label: 'Actions' },
  ];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="h-10 w-3/4 animate-pulse bg-gray-100 rounded" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse bg-gray-100 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl">Products</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search and Filters */}
        <div className="mb-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ProductStatus | 'all')}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="recalled">Recalled</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      'px-4 py-3 text-left font-medium text-muted-foreground',
                      sortableKeys.includes(col.key as SortableKey) && 'cursor-pointer hover:text-foreground'
                    )}
                    onClick={() => sortableKeys.includes(col.key as SortableKey) && handleSort(col.key as SortableKey)}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {sortableKeys.includes(col.key as SortableKey) && (
                        <SortIcon columnKey={col.key as SortableKey} />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center text-muted-foreground">
                    No products found
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-sm">{product.productId}</td>
                    <td className="px-4 py-3 font-medium">{product.name}</td>
                    <td className="px-4 py-3">{product.category}</td>
                    <td className="px-4 py-3">{product.manufacturer}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusConfig[product.status]?.variant || 'secondary'}>
                        {statusConfig[product.status]?.label || product.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{product.quantity}</td>
                    <td className="px-4 py-3">${product.price.toLocaleString()}</td>
                    <td className="px-4 py-3">{formatDate(product.manufacturingDate)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onView(product)}
                          className="h-8 w-8"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(product)}
                          className="h-8 w-8"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDownloadQR(product)}
                          className="h-8 w-8"
                          title="Download QR"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(product)}
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalCount > 0 && onPageChange && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * pageSize) + 1} to{' '}
              {Math.min(currentPage * pageSize, totalCount)} of {totalCount} results
            </div>
            <div className="flex items-center gap-2">
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
                className="px-3 py-1 border border-gray-200 rounded-lg text-sm"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage * pageSize >= totalCount}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}