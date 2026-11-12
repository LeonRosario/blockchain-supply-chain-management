import { cn } from '@/utils/cn';
import { formatDate } from '@/utils/formatDate';
import type { Product, ProductStatus } from '@/types';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Skeleton,
} from '@/components/ui';
import {
  Search,
  ChevronDown,
  ChevronUp,
  Eye,
  Edit,
  Trash2,
  Download,
  PackageSearch,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import StatusBadge, { type StatusTone } from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import Pagination from '@/components/common/Pagination';

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

const statusConfig: Record<ProductStatus, { label: string; tone: StatusTone; pulse?: boolean }> = {
  active: { label: 'Active', tone: 'info' },
  inactive: { label: 'Inactive', tone: 'neutral' },
  recalled: { label: 'Recalled', tone: 'danger' },
  in_transit: { label: 'In Transit', tone: 'warning', pulse: true },
  delivered: { label: 'Delivered', tone: 'success' },
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

type SortableKey =
  | 'productId'
  | 'name'
  | 'category'
  | 'manufacturer'
  | 'status'
  | 'quantity'
  | 'price'
  | 'manufacturingDate';

const sortableKeys: SortableKey[] = [
  'productId',
  'name',
  'category',
  'manufacturer',
  'status',
  'quantity',
  'price',
  'manufacturingDate',
];

const selectClass =
  'h-10 rounded-lg border border-input bg-background/70 px-3 text-sm shadow-sm transition-colors focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20';

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
  const [sortConfig, setSortConfig] = useState<{
    key: SortableKey;
    direction: 'asc' | 'desc';
  } | null>(null);

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

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setCategoryFilter('all');
  };

  const hasFilters = search !== '' || statusFilter !== 'all' || categoryFilter !== 'all';

  const SortIcon = ({ columnKey }: { columnKey: SortableKey }) => {
    if (sortConfig?.key !== columnKey) {
      return <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/50" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="h-3.5 w-3.5 text-primary" />
    ) : (
      <ChevronDown className="h-3.5 w-3.5 text-primary" />
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
        <CardHeader className="gap-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-full max-w-xl" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full" />
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-4 border-b border-border/60 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-lg">Product catalog</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            {filteredProducts.length} of {products.length} records shown
          </p>
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1.5 h-3.5 w-3.5" />
            Clear filters
          </Button>
        )}
      </CardHeader>

      <CardContent className="pt-5">
        {/* Search and Filters */}
        <div className="mb-5 flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name, ID, SKU, category, or manufacturer…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              aria-label="Search products"
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ProductStatus | 'all')}
              className={selectClass}
              aria-label="Filter by status"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="recalled">Recalled</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={selectClass}
              aria-label="Filter by category"
            >
              <option value="all">All categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        {filteredProducts.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title="No matching products"
            description={
              hasFilters
                ? 'Try adjusting the search or filters to find a product.'
                : 'No product records are available yet.'
            }
            action={
              hasFilters ? (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b border-border/70">
                  {columns.map((col) => {
                    const sortable = sortableKeys.includes(col.key as SortableKey);
                    const isSorted = sortConfig?.key === col.key;
                    return (
                      <th
                        key={col.key}
                        scope="col"
                        aria-sort={
                          isSorted
                            ? sortConfig?.direction === 'asc'
                              ? 'ascending'
                              : 'descending'
                            : undefined
                        }
                        className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        {sortable ? (
                          <button
                            type="button"
                            onClick={() => handleSort(col.key as SortableKey)}
                            className={cn(
                              'flex items-center gap-1 rounded text-left transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                              isSorted && 'text-foreground'
                            )}
                          >
                            {col.label}
                            <SortIcon columnKey={col.key as SortableKey} />
                          </button>
                        ) : (
                          col.label
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredProducts.map((product, index) => {
                  const status = statusConfig[product.status] ?? {
                    label: product.status,
                    tone: 'neutral' as StatusTone,
                  };
                  return (
                    <tr
                      key={product.id}
                      className="group animate-in fade-in-0 slide-in-from-bottom-1 duration-300 hover:bg-primary/[0.035]"
                      style={{
                        animationDelay: `${Math.min(index, 8) * 25}ms`,
                        animationFillMode: 'both',
                      }}
                    >
                      <td className="whitespace-nowrap px-3 py-3.5 font-mono text-xs">
                        {product.productId}
                      </td>
                      <td className="px-3 py-3.5">
                        <p className="font-medium">{product.name}</p>
                        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                          {product.sku}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3.5 text-muted-foreground">
                        {product.category}
                      </td>
                      <td className="px-3 py-3.5 text-muted-foreground">
                        {product.manufacturer}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3.5">
                        <StatusBadge
                          label={status.label}
                          tone={status.tone}
                          dot
                          pulse={status.pulse}
                        />
                      </td>
                      <td className="px-3 py-3.5 tabular-nums">{product.quantity}</td>
                      <td className="whitespace-nowrap px-3 py-3.5 tabular-nums">
                        ${product.price.toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3.5 text-muted-foreground">
                        {formatDate(product.manufacturingDate)}
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center justify-end gap-0.5 opacity-70 transition-opacity group-hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onView(product)}
                            className="h-8 w-8"
                            title="View product"
                            aria-label={`View ${product.name}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(product)}
                            className="h-8 w-8"
                            title="Edit product"
                            aria-label={`Edit ${product.name}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDownloadQR(product)}
                            className="h-8 w-8"
                            title="Download QR code"
                            aria-label={`Download QR code for ${product.name}`}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(product)}
                            className="h-8 w-8 text-danger hover:bg-danger/10 hover:text-danger"
                            title="Delete product"
                            aria-label={`Delete ${product.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
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

        {/* Pagination */}
        {totalCount > 0 && onPageChange && (
          <div className="mt-5">
            <Pagination
              page={currentPage}
              totalPages={Math.ceil(totalCount / pageSize)}
              total={totalCount}
              limit={pageSize}
              onPageChange={onPageChange}
              onLimitChange={onPageSizeChange}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}