import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Button, Alert, AlertDescription } from '@/components/ui';
import { ProductForm } from '@/components/dashboard';
import productService from '@/services/product.service';
import type { Product, UpdateProductPayload } from '@/types';
import { mockProducts } from '@/data/mockProducts';

export default function EditProductPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        navigate('/dashboard/products');
        return;
      }

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
  }, [id, navigate]);

  const handleSubmit = async (data: UpdateProductPayload) => {
    if (!id || !product) return;

    const response = await productService.update(id, data);
    if (response.success) {
      navigate('/dashboard/products');
    } else {
      throw new Error(response.message || 'Failed to update product');
    }
  };

  const handleCancel = () => {
    navigate('/dashboard/products');
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-1/4 bg-gray-200 rounded" />
        <div className="h-64 bg-gray-100 rounded" />
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={handleCancel}>Back to Products</Button>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
            <p className="mt-1 text-muted-foreground">
              Update product information in the supply chain management system.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Product Form */}
      <ProductForm
        initialData={product}
        isEditing={true}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}