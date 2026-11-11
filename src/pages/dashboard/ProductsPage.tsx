import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui';
import { ProductTable } from '@/components/dashboard';
import { ProductDetailsModal } from '@/components/dashboard';
import { DeleteConfirmationModal } from '@/components/dashboard';
import productService from '@/services/product.service';
import type { Product, ProductFilters } from '@/types';
import { mockProducts } from '@/data/mockProducts';

export default function ProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

      if (response.data && response.data.length > 0) {
        setProducts(response.data);
        setTotalCount(response.total);
      } else {
        // Fallback to mock data with client-side filtering/pagination
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
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
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
      // Refresh the list
      fetchProducts();
    } catch (err) {
      console.error('Failed to delete product:', err);
      alert('Failed to delete product. Please try again.');
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="mt-1 text-muted-foreground">
            Manage and track all registered products in the supply chain.
          </p>
        </div>
        <Button onClick={() => navigate('/dashboard/products/add')}>
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Product Table */}
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