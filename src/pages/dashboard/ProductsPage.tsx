import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Plus } from 'lucide-react';
import { Button, useToast } from '@/components/ui';
import { DemoDataBanner, StatusBadge } from '@/components/common';
import { FadeIn } from '@/components/motion';
import { ProductTable } from '@/components/dashboard';
import { ProductDetailsModal } from '@/components/dashboard';
import { DeleteConfirmationModal } from '@/components/dashboard';
import productService from '@/services/product.service';
import type { Product, ProductFilters } from '@/types';
import { mockProducts } from '@/data/mockProducts';

export default function ProductsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters] = useState<ProductFilters>({
    page: 1,
    limit: 10,
  });

  // Modal states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      // Try API first, fallback to mock data
      const response = await productService.getAll({
        ...filters,
        page: currentPage,
        limit: pageSize,
      });

      if (response.data) {
        setProducts(response.data);
        setTotalCount(response.total ?? response.data.length);
        setIsDemo(false);
      } else {
        throw new Error('Unexpected products response.');
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setIsDemo(true);
      // Fallback to mock data
      let filtered = [...mockProducts];

      if (filters.search) {
        const search = filters.search.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.name.toLowerCase().includes(search) ||
            p.productId.toLowerCase().includes(search) ||
            p.sku.toLowerCase().includes(search) ||
            p.category.toLowerCase().includes(search) ||
            p.manufacturer.toLowerCase().includes(search)
        );
      }

      if (filters.category) {
        filtered = filtered.filter((p) => p.category === filters.category);
      }

      if (filters.status) {
        filtered = filtered.filter((p) => p.status === filters.status);
      }

      setTotalCount(filtered.length);
      const start = (currentPage - 1) * pageSize;
      setProducts(filtered.slice(start, start + pageSize));
    } finally {
      setIsLoading(false);
    }
  }, [filters, currentPage, pageSize]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleView = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailsOpen(true);
  };

  const handleEdit = (product: Product) => {
    navigate(`/dashboard/products/edit/${product.id}`);
  };

  const handleDelete = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteOpen(true);
  };

  const handleDownloadQR = (product: Product) => {
    // The QRCodeGenerator in the details modal handles download
    handleView(product);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    setIsDeleting(true);
    try {
      await productService.delete(productToDelete.id);
      toast.success('Product deleted', `${productToDelete.name} was removed from the catalog.`);
      // Refresh the list
      fetchProducts();
    } catch (err) {
      console.error('Failed to delete product:', err);
      toast.error('Delete failed', 'The product could not be deleted. Please try again.');
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
      setProductToDelete(null);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= Math.ceil(totalCount / pageSize)) {
      setCurrentPage(page);
    }
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <FadeIn inView={false}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <Package className="h-3.5 w-3.5 text-primary" />
              Catalog
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Products</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Manage and track every registered product in the supply chain.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!isLoading && (
              <StatusBadge
                label={isDemo ? 'Sample data in use' : 'Live API data'}
                tone={isDemo ? 'warning' : 'success'}
                dot
              />
            )}
            <Button onClick={() => navigate('/dashboard/products/add')}>
              <Plus className="mr-2 h-4 w-4" />
              Add product
            </Button>
          </div>
        </div>
      </FadeIn>

      {isDemo && (
        <DemoDataBanner
          title="Sample product data"
          message="The product API is unavailable, so the table below shows local demo products. Search and filters work on these sample records only. Demo products are not blockchain-verified."
        />
      )}

      {/* Product Table */}
      <FadeIn delay={0.05}>
        <ProductTable
          products={products}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onDownloadQR={handleDownloadQR}
          isLoading={isLoading}
          totalCount={totalCount}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </FadeIn>

      {/* Product Details Modal */}
      <ProductDetailsModal
        product={selectedProduct!}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedProduct(null);
        }}
        onEdit={(product) => {
          setIsDetailsOpen(false);
          setSelectedProduct(null);
          handleEdit(product);
        }}
        onDownloadQR={handleDownloadQR}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        productName={productToDelete?.name || ''}
        productId={productToDelete?.productId || ''}
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setProductToDelete(null);
        }}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}