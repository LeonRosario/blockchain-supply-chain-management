import { useState, useEffect, useCallback } from 'react';
import productService from '@/services/product.service';
import type { Product, ProductFilters, ProductStats } from '@/types';
import { mockProducts, mockProductStats } from '@/data/mockProducts';

export function useProducts(filters: ProductFilters = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await productService.getAll(filters);

      if (response.data && response.data.length > 0) {
        setProducts(response.data);
        setTotalCount(response.total);
        setTotalPages(response.totalPages);
      } else {
        // Fallback to mock data with client-side filtering
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
        setTotalPages(Math.ceil(filtered.length / (filters.limit || 10)));
        const start = ((filters.page || 1) - 1) * (filters.limit || 10);
        setProducts(filtered.slice(start, start + (filters.limit || 10)));
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
      setTotalPages(Math.ceil(filtered.length / (filters.limit || 10)));
      const start = ((filters.page || 1) - 1) * (filters.limit || 10);
      setProducts(filtered.slice(start, start + (filters.limit || 10)));
      setError('Using sample data. Connect to backend for live data.');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    isLoading,
    error,
    totalCount,
    totalPages,
    refetch: fetchProducts,
  };
}

export function useProduct(id: string | undefined) {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await productService.getById(id);
        if (response.success && response.data) {
          setProduct(response.data);
        } else {
          throw new Error('Product not found');
        }
      } catch (err) {
        console.error('Failed to fetch product:', err);
        // Fallback to mock data
        const mockProduct = mockProducts.find((p) => p.id === id);
        if (mockProduct) {
          setProduct(mockProduct);
        } else {
          setError('Product not found');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  return { product, isLoading, error };
}

export function useProductStats() {
  const [stats, setStats] = useState<ProductStats>(mockProductStats);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await productService.getStats();
        if (response.success) {
          setStats(response.data);
        } else {
          throw new Error('Failed to fetch stats');
        }
      } catch (err) {
        console.error('Failed to fetch product stats:', err);
        setStats(mockProductStats);
        setError('Using sample data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, isLoading, error };
}

export function useRecentActivity(limit = 10) {
  const [activities, setActivities] = useState<Array<{
    id: string;
    type: 'created' | 'updated' | 'shipped' | 'delivered' | 'recalled';
    product: Pick<Product, 'id' | 'productId' | 'name' | 'status'>;
    timestamp: string;
    user?: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivity = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await productService.getRecentActivity(limit);
        if (response.success) {
          const mappedActivities = response.data.map((product) => ({
            id: `act-${product.id}`,
            type: (product.status === 'delivered' ? 'delivered' :
              product.status === 'in_transit' ? 'shipped' : 'created') as 'created' | 'updated' | 'shipped' | 'delivered' | 'recalled',
            product: {
              id: product.id,
              productId: product.productId,
              name: product.name,
              status: product.status,
            },
            timestamp: product.updatedAt,
            user: 'System',
          }));
          setActivities(mappedActivities);
        } else {
          throw new Error('Failed to fetch activity');
        }
      } catch (err) {
        console.error('Failed to fetch recent activity:', err);
        setError('Using sample data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivity();
  }, [limit]);

  return { activities, isLoading, error };
}