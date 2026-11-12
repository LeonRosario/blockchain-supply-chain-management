import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { cn } from '@/utils/cn';
import type {
  Product,
  CreateProductPayload,
  UpdateProductPayload,
  ProductStatus,
} from '@/types';
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
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Factory,
  ImagePlus,
  Loader2,
  PackageCheck,
  Save,
  Warehouse,
  X,
} from 'lucide-react';

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

const STEPS = [
  {
    id: 'identity',
    title: 'Identification',
    description: 'Name, identifiers, and description',
    icon: PackageCheck,
  },
  {
    id: 'manufacturing',
    title: 'Manufacturing',
    description: 'Origin, batch, and supplier',
    icon: Factory,
  },
  {
    id: 'inventory',
    title: 'Inventory & review',
    description: 'Pricing, stock, and image',
    icon: Warehouse,
  },
] as const;

const errorClass =
  'border-danger focus-visible:border-danger focus-visible:ring-danger/20';

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-xs font-medium text-danger">
      {message}
    </p>
  );
}

export default function ProductForm({
  initialData,
  isEditing = false,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

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
    ...(isEditing && initialData ? { status: initialData.status } : {}),
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
    setSubmitError(null);
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, productImage: 'Image must be less than 5MB.' }));
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

  const validateStep = (targetStep: number): Record<string, string> => {
    const nextErrors: Record<string, string> = {};

    if (targetStep === 0) {
      if (!formData.productId?.trim()) nextErrors.productId = 'Product ID is required.';
      if (!formData.name?.trim()) nextErrors.name = 'Product name is required.';
      if (!formData.sku?.trim()) nextErrors.sku = 'SKU is required.';
      if (!formData.description?.trim()) nextErrors.description = 'Description is required.';
    }

    if (targetStep === 1) {
      if (!formData.category) nextErrors.category = 'Category is required.';
      if (!formData.manufacturer?.trim()) nextErrors.manufacturer = 'Manufacturer is required.';
      if (!formData.manufacturingDate) {
        nextErrors.manufacturingDate = 'Manufacturing date is required.';
      }
      if (!formData.batchNumber?.trim()) nextErrors.batchNumber = 'Batch number is required.';
      if (!formData.productOrigin?.trim()) nextErrors.productOrigin = 'Product origin is required.';
      if (!formData.supplierId?.trim()) nextErrors.supplierId = 'Supplier ID is required.';
    }

    if (targetStep === 2) {
      if ((formData.price ?? 0) < 0) nextErrors.price = 'Price must be zero or greater.';
      if ((formData.quantity ?? 0) < 0) {
        nextErrors.quantity = 'Quantity must be zero or greater.';
      }
    }

    return nextErrors;
  };

  const handleNext = () => {
    const stepErrors = validateStep(step);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length === 0) {
      setStep((current) => Math.min(current + 1, STEPS.length - 1));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {
      ...validateStep(0),
      ...validateStep(1),
      ...validateStep(2),
    };
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step < STEPS.length - 1) {
      handleNext();
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(formData);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'The product could not be saved. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = ((step + 1) / STEPS.length) * 100;
  const reviewStatus = (formData as UpdateProductPayload).status;

  return (
    <Card className="mx-auto w-full max-w-4xl overflow-hidden">
      <CardHeader className="border-b border-border/60 bg-gradient-to-r from-primary/[0.06] via-transparent to-teal-500/[0.05] pb-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg">
            {isEditing ? 'Edit product' : 'Register a product'}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Step {step + 1} of {STEPS.length}
          </p>
        </div>

        {/* Step indicator */}
        <ol className="mt-5 grid gap-2 sm:grid-cols-3" aria-label="Product form steps">
          {STEPS.map((item, index) => {
            const Icon = item.icon;
            const complete = index < step;
            const current = index === step;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (index < step) setStep(index);
                  }}
                  disabled={index > step}
                  aria-current={current ? 'step' : undefined}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors',
                    current
                      ? 'border-primary/30 bg-primary/[0.06]'
                      : complete
                        ? 'border-border/70 bg-card/60 hover:border-primary/20'
                        : 'border-border/50 bg-muted/20 opacity-60',
                    index < step && 'cursor-pointer'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold',
                      current
                        ? 'gradient-accent border-transparent text-white shadow-sm'
                        : complete
                          ? 'border-success/30 bg-success/10 text-success'
                          : 'border-border bg-background text-muted-foreground'
                    )}
                  >
                    {complete ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold">{item.title}</span>
                    <span className="hidden truncate text-[11px] text-muted-foreground sm:block">
                      {item.description}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="mt-4 h-1 overflow-hidden rounded-full bg-muted">
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ duration: reduce ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="h-full rounded-full gradient-accent"
          />
        </div>
      </CardHeader>

      <form onSubmit={handleSubmitForm} noValidate>
        <CardContent className="min-h-[380px] pt-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={reduce ? false : { opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? undefined : { opacity: 0, x: -18 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-5"
            >
              {step === 0 && (
                <>
                  <SectionHeading
                    icon={PackageCheck}
                    title="Product identification"
                    description="Use the identifiers printed on the product label or packaging."
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="productId">Product ID *</Label>
                      <Input
                        id="productId"
                        value={formData.productId || ''}
                        onChange={(e) => handleChange('productId', e.target.value)}
                        placeholder="e.g., PROD-001"
                        disabled={isEditing}
                        aria-invalid={Boolean(errors.productId)}
                        aria-describedby={errors.productId ? 'productId-error' : undefined}
                        className={cn(errors.productId && errorClass)}
                      />
                      <FieldError id="productId-error" message={errors.productId} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="sku">SKU *</Label>
                      <Input
                        id="sku"
                        value={formData.sku || ''}
                        onChange={(e) => handleChange('sku', e.target.value)}
                        placeholder="e.g., SKU-12345"
                        aria-invalid={Boolean(errors.sku)}
                        aria-describedby={errors.sku ? 'sku-error' : undefined}
                        className={cn(errors.sku && errorClass)}
                      />
                      <FieldError id="sku-error" message={errors.sku} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Product name *</Label>
                    <Input
                      id="name"
                      value={formData.name || ''}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="Enter product name"
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={errors.name ? 'name-error' : undefined}
                      className={cn(errors.name && errorClass)}
                    />
                    <FieldError id="name-error" message={errors.name} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description || ''}
                      onChange={(e) => handleChange('description', e.target.value)}
                      placeholder="Describe the product, its packaging, and identifying details."
                      rows={5}
                      aria-invalid={Boolean(errors.description)}
                      aria-describedby={errors.description ? 'description-error' : undefined}
                      className={cn(errors.description && errorClass)}
                    />
                    <FieldError id="description-error" message={errors.description} />
                  </div>
                </>
              )}

              {step === 1 && (
                <>
                  <SectionHeading
                    icon={Factory}
                    title="Manufacturing details"
                    description="These records anchor the product to its batch and origin."
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={formData.category || ''}
                        onValueChange={(value: string) => handleChange('category', value)}
                      >
                        <SelectTrigger
                          className={cn(errors.category && errorClass)}
                          aria-invalid={Boolean(errors.category)}
                        >
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError id="category-error" message={errors.category} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="manufacturer">Manufacturer *</Label>
                      <Input
                        id="manufacturer"
                        value={formData.manufacturer || ''}
                        onChange={(e) => handleChange('manufacturer', e.target.value)}
                        placeholder="Enter manufacturer name"
                        aria-invalid={Boolean(errors.manufacturer)}
                        aria-describedby={errors.manufacturer ? 'manufacturer-error' : undefined}
                        className={cn(errors.manufacturer && errorClass)}
                      />
                      <FieldError id="manufacturer-error" message={errors.manufacturer} />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="manufacturingDate">Manufacturing date *</Label>
                      <Input
                        id="manufacturingDate"
                        type="date"
                        value={formData.manufacturingDate || ''}
                        onChange={(e) => handleChange('manufacturingDate', e.target.value)}
                        aria-invalid={Boolean(errors.manufacturingDate)}
                        aria-describedby={
                          errors.manufacturingDate ? 'manufacturingDate-error' : undefined
                        }
                        className={cn(errors.manufacturingDate && errorClass)}
                      />
                      <FieldError id="manufacturingDate-error" message={errors.manufacturingDate} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="batchNumber">Batch number *</Label>
                      <Input
                        id="batchNumber"
                        value={formData.batchNumber || ''}
                        onChange={(e) => handleChange('batchNumber', e.target.value)}
                        placeholder="e.g., BATCH-2024-001"
                        aria-invalid={Boolean(errors.batchNumber)}
                        aria-describedby={errors.batchNumber ? 'batchNumber-error' : undefined}
                        className={cn(errors.batchNumber && errorClass)}
                      />
                      <FieldError id="batchNumber-error" message={errors.batchNumber} />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="productOrigin">Product origin *</Label>
                      <Input
                        id="productOrigin"
                        value={formData.productOrigin || ''}
                        onChange={(e) => handleChange('productOrigin', e.target.value)}
                        placeholder="Country or region of origin"
                        aria-invalid={Boolean(errors.productOrigin)}
                        aria-describedby={errors.productOrigin ? 'productOrigin-error' : undefined}
                        className={cn(errors.productOrigin && errorClass)}
                      />
                      <FieldError id="productOrigin-error" message={errors.productOrigin} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="supplierId">Supplier ID *</Label>
                      <Input
                        id="supplierId"
                        value={formData.supplierId || ''}
                        onChange={(e) => handleChange('supplierId', e.target.value)}
                        placeholder="e.g., SUP-001"
                        aria-invalid={Boolean(errors.supplierId)}
                        aria-describedby={errors.supplierId ? 'supplierId-error' : undefined}
                        className={cn(errors.supplierId && errorClass)}
                      />
                      <FieldError id="supplierId-error" message={errors.supplierId} />
                    </div>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <SectionHeading
                    icon={Warehouse}
                    title="Inventory & review"
                    description="Confirm the commercial details before saving."
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
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
                        aria-invalid={Boolean(errors.price)}
                        aria-describedby={errors.price ? 'price-error' : undefined}
                        className={cn(errors.price && errorClass)}
                      />
                      <FieldError id="price-error" message={errors.price} />
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
                        aria-invalid={Boolean(errors.quantity)}
                        aria-describedby={errors.quantity ? 'quantity-error' : undefined}
                        className={cn(errors.quantity && errorClass)}
                      />
                      <FieldError id="quantity-error" message={errors.quantity} />
                    </div>
                  </div>

                  {isEditing && (
                    <div className="space-y-1.5">
                      <Label htmlFor="status">Product status</Label>
                      <Select
                        value={reviewStatus || 'active'}
                        onValueChange={(value: string) =>
                          handleChange('status', value as ProductStatus)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Image upload */}
                  <div className="space-y-2">
                    <Label htmlFor="productImage">Product image</Label>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
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
                          'flex min-h-[104px] flex-1 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed p-4 text-center transition-colors',
                          imagePreview
                            ? 'border-success/30 bg-success/[0.04]'
                            : 'border-border hover:border-primary/40 hover:bg-primary/[0.03]'
                        )}
                      >
                        <ImagePlus className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {imagePreview ? 'Replace image' : 'Upload product image'}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          JPG or PNG, up to 5MB
                        </span>
                      </label>
                      {imagePreview && (
                        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-border/70">
                          <img
                            src={imagePreview}
                            alt="Product preview"
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview(null);
                              handleChange('productImage', '');
                            }}
                            className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-950/70 text-white transition-colors hover:bg-danger"
                            aria-label="Remove product image"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    <FieldError id="productImage-error" message={errors.productImage} />
                  </div>

                  {/* Review */}
                  <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Review
                    </p>
                    <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                      <ReviewRow label="Product" value={formData.name || '—'} />
                      <ReviewRow label="SKU" value={formData.sku || '—'} mono />
                      <ReviewRow label="Category" value={formData.category || '—'} />
                      <ReviewRow label="Manufacturer" value={formData.manufacturer || '—'} />
                      <ReviewRow label="Batch" value={formData.batchNumber || '—'} mono />
                      <ReviewRow
                        label="Price / quantity"
                        value={`$${Number(formData.price ?? 0).toLocaleString()} · ${formData.quantity ?? 0} units`}
                      />
                    </dl>
                  </div>
                </>
              )}

              {submitError && (
                <div
                  role="alert"
                  className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger"
                >
                  {submitError}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </CardContent>

        <CardFooter className="flex flex-col-reverse gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <div className="flex w-full justify-end gap-2 sm:w-auto">
            {step > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((current) => Math.max(0, current - 1))}
                disabled={isSubmitting}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={handleNext}>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {isEditing ? 'Update product' : 'Create product'}
                  </>
                )}
              </Button>
            )}
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function ReviewRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/40 py-1 last:border-0 sm:border-0">
      <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className={cn('truncate text-right font-medium', mono && 'font-mono text-xs')}>
        {value}
      </dd>
    </div>
  );
}