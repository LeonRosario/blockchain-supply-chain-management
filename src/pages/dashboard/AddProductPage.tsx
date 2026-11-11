import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui';
import { ProductForm } from '@/components/dashboard';
import productService from '@/services/product.service';
import type { CreateProductPayload, UpdateProductPayload } from '@/types';

export default function AddProductPage() {
  const navigate = useNavigate();

  const handleSubmit = async (data: CreateProductPayload | UpdateProductPayload) => {
    // Type guard to ensure we have CreateProductPayload
    if ('productId' in data && data.productId) {
      const response = await productService.create(data as CreateProductPayload);
      if (response.success) {
        navigate('/dashboard/products');
      } else {
        throw new Error(response.message || 'Failed to create product');
      }
    } else {
      throw new Error('Invalid product data');
    }
  };

  const handleCancel = () => {
    navigate('/dashboard/products');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add New Product</h1>
            <p className="mt-1 text-muted-foreground">
              Register a new product in the supply chain management system.
            </p>
          </div>
        </div>
      </div>

      {/* Product Form */}
      <ProductForm
        isEditing={false}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}