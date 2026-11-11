import { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';
import type { Product, CreateProductPayload, UpdateProductPayload, ProductStatus } from '@/types';
import {
  Button,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui';
import { Loader2, Save, X, Upload } from 'lucide-react';

interface ProductFormProps {
  initialData?: Product;
  isEditing?: boolean;
  onSubmit: (data: CreateProductPayload | UpdateProductPayload) => Promise<void>;
  onCancel: () => void;
}

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

const statusOptions: { value: ProductStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'recalled', label: 'Recalled' },
];

export default function ProductForm({
  initialData,
  isEditing = false,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<CreateProductPayload | UpdateProductPayload>({
    productId: '',
    name: '',
    sku: '',
    description: '',
    category: '',
    price: 0,
    quantity: 0,
    manufacturer: '',
    manufacturingDate: '',
    batchNumber: '',
    productImage: '',
    productOrigin: '',
    supplierId: '',
    ...(isEditing && initialData ? {
      status: initialData.status,
    } : {}),
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        productId: initialData.productId,
        name: initialData.name,
        sku: initialData.sku,
        description: initialData.description,
        category: initialData.category,
        price: initialData.price,
        quantity: initialData.quantity,
        manufacturer: initialData.manufacturer,
        manufacturingDate: initialData.manufacturingDate.split('T')[0],
        batchNumber: initialData.batchNumber,
        productImage: initialData.productImage || '',
        productOrigin: initialData.productOrigin,
        supplierId: initialData.supplierId,
        ...(isEditing && { status: initialData.status }),
      });
      if (initialData.productImage) {
        setImagePreview(initialData.productImage);
      }
    }
  }, [initialData, isEditing]);

  const handleChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, productImage: 'Image must be less than 5MB' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setImagePreview(base64);
      handleChange('productImage', base64);
    };
    reader.readAsDataURL(file);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.productId?.trim()) newErrors.productId = 'Product ID is required';
    if (!formData.name?.trim()) newErrors.name = 'Product name is required';
    if (!formData.sku?.trim()) newErrors.sku = 'SKU is required';
    if (!formData.description?.trim()) newErrors.description = 'Description is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.manufacturer?.trim()) newErrors.manufacturer = 'Manufacturer is required';
    if (!formData.manufacturingDate) newErrors.manufacturingDate = 'Manufacturing date is required';
    if (!formData.batchNumber?.trim()) newErrors.batchNumber = 'Batch number is required';
    if (!formData.productOrigin?.trim()) newErrors.productOrigin = 'Product origin is required';
    if (!formData.supplierId?.trim()) newErrors.supplierId = 'Supplier ID is required';
    if ((formData.price ?? 0) < 0) newErrors.price = 'Price must be positive';
    if ((formData.quantity ?? 0) < 0) newErrors.quantity = 'Quantity must be positive';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Product' : 'Add New Product'}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmitForm}>
        <CardContent className="space-y-6">
          {/* Product Identification */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Product Identification</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="productId">Product ID *</Label>
                <Input
                  id="productId"
                  value={formData.productId || ''}
                  onChange={(e) => handleChange('productId', e.target.value)}
                  placeholder="e.g., PROD-001"
                  disabled={isEditing}
                  className={errors.productId ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                />
                {errors.productId && <p className="text-sm text-red-500">{errors.productId}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  value={formData.sku || ''}
                  onChange={(e) => handleChange('sku', e.target.value)}
                  placeholder="e.g., SKU-12345"
                  className={errors.sku ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                />
                {errors.sku && <p className="text-sm text-red-500">{errors.sku}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter product name"
                className={errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Enter product description"
                rows={3}
                className={errors.description ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
              />
              {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Product Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category || ''}
                  onValueChange={(value: string) => handleChange('category', value)}
                >
                  <SelectTrigger className={errors.category ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="manufacturer">Manufacturer *</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer || ''}
                  onChange={(e) => handleChange('manufacturer', e.target.value)}
                  placeholder="Enter manufacturer name"
                  className={errors.manufacturer ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                />
                {errors.manufacturer && <p className="text-sm text-red-500">{errors.manufacturer}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="manufacturingDate">Manufacturing Date *</Label>
                <Input
                  id="manufacturingDate"
                  type="date"
                  value={formData.manufacturingDate || ''}
                  onChange={(e) => handleChange('manufacturingDate', e.target.value)}
                  className={errors.manufacturingDate ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                />
                {errors.manufacturingDate && <p className="text-sm text-red-500">{errors.manufacturingDate}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="batchNumber">Batch Number *</Label>
                <Input
                  id="batchNumber"
                  value={formData.batchNumber || ''}
                  onChange={(e) => handleChange('batchNumber', e.target.value)}
                  placeholder="e.g., BATCH-2024-001"
                  className={errors.batchNumber ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                />
                {errors.batchNumber && <p className="text-sm text-red-500">{errors.batchNumber}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="productOrigin">Product Origin *</Label>
                <Input
                  id="productOrigin"
                  value={formData.productOrigin || ''}
                  onChange={(e) => handleChange('productOrigin', e.target.value)}
                  placeholder="Country/Region of origin"
                  className={errors.productOrigin ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                />
                {errors.productOrigin && <p className="text-sm text-red-500">{errors.productOrigin}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="supplierId">Supplier ID *</Label>
                <Input
                  id="supplierId"
                  value={formData.supplierId || ''}
                  onChange={(e) => handleChange('supplierId', e.target.value)}
                  placeholder="e.g., SUP-001"
                  className={errors.supplierId ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                />
                {errors.supplierId && <p className="text-sm text-red-500">{errors.supplierId}</p>}
              </div>
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Pricing & Inventory</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="price">Price ($) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price ?? 0}
                  onChange={(e) => handleChange('price', Number(e.target.value))}
                  placeholder="0.00"
                  className={errors.price ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                />
                {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.quantity ?? 0}
                  onChange={(e) => handleChange('quantity', Number(e.target.value))}
                  placeholder="0"
                  className={errors.quantity ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                />
                {errors.quantity && <p className="text-sm text-red-500">{errors.quantity}</p>}
              </div>
            </div>
          </div>

          {/* Product Image */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Product Image</h4>
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  id="productImage"
                  className="hidden"
                />
                <label
                  htmlFor="productImage"
                  className={cn(
                    'cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors',
                    imagePreview
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-300 hover:border-primary hover:bg-gray-50'
                  )}
                >
                  {imagePreview ? (
                    <div className="relative w-32 h-32 mx-auto rounded-lg overflow-hidden">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          handleChange('productImage', '');
                        }}
                        className="absolute top-1 right-1 rounded-full bg-red-500 text-white p-1 hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <span className="text-sm font-medium">Upload product image</span>
                      <span className="text-xs text-muted-foreground">Max 5MB • JPG, PNG</span>
                    </div>
                  )}
                </label>
              </div>
            </div>
            {errors.productImage && <p className="text-sm text-red-500">{errors.productImage}</p>}
          </div>

          {/* Status (only for editing) */}
          {isEditing && (
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Status</h4>
              <div className="space-y-1.5">
                <Label htmlFor="status">Product Status</Label>
                <Select
                  value={(formData as UpdateProductPayload).status || 'active'}
                  onValueChange={(value: string) => handleChange('status', value as ProductStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isEditing ? 'Update' : 'Create'}
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}