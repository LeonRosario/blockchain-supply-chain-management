import { useState } from 'react';
import { formatDate, formatDateTime } from '@/utils/formatDate';
import type { Product, ProductStatus } from '@/types';
import {
  Button,
  Badge,
  Separator,
} from '@/components/ui';
import {
  X,
  Edit,
  Download,
  QrCode,
  Package,
  Tag,
  Factory,
  Calendar,
  Hash,
  MapPin,
  DollarSign,
  Box,
  Truck,
  Shield,
  Clock,
  Copy,
  Check,
} from 'lucide-react';
import QRCodeGenerator from './QRCodeGenerator';

interface ProductDetailsModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (product: Product) => void;
  onDownloadQR: (product: Product) => void;
}

const statusConfig: Record<ProductStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'Active', variant: 'default' },
  inactive: { label: 'Inactive', variant: 'secondary' },
  recalled: { label: 'Recalled', variant: 'destructive' },
  in_transit: { label: 'In Transit', variant: 'outline' },
  delivered: { label: 'Delivered', variant: 'default' },
};

interface FieldConfig {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  format?: 'date' | 'datetime' | 'currency' | 'status' | 'hash';
}

const fieldConfigs: FieldConfig[] = [
  { key: 'productId', label: 'Product ID', icon: Hash },
  { key: 'name', label: 'Product Name', icon: Package },
  { key: 'sku', label: 'SKU', icon: Tag },
  { key: 'category', label: 'Category', icon: Tag },
  { key: 'manufacturer', label: 'Manufacturer', icon: Factory },
  { key: 'manufacturingDate', label: 'Manufacturing Date', icon: Calendar, format: 'date' },
  { key: 'batchNumber', label: 'Batch Number', icon: Hash },
  { key: 'productOrigin', label: 'Product Origin', icon: MapPin },
  { key: 'price', label: 'Price', icon: DollarSign, format: 'currency' },
  { key: 'quantity', label: 'Quantity', icon: Box },
  { key: 'supplierId', label: 'Supplier ID', icon: Factory },
  { key: 'status', label: 'Status', icon: Truck, format: 'status' },
  { key: 'blockchainHash', label: 'Blockchain Hash', icon: Shield, format: 'hash' },
  { key: 'createdAt', label: 'Created At', icon: Clock, format: 'datetime' },
  { key: 'updatedAt', label: 'Last Updated', icon: Clock, format: 'datetime' },
];

export default function ProductDetailsModal({
  product,
  isOpen,
  onClose,
  onEdit,
  onDownloadQR,
}: ProductDetailsModalProps) {
  const [showQR, setShowQR] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;

  const getFieldValue = (key: string) => {
    const value = product[key as keyof Product];
    if (value === undefined || value === null || value === '') return '—';
    return value;
  };

  const formatValue = (key: string, value: unknown): React.ReactNode => {
    const field = fieldConfigs.find((f) => f.key === key);
    if (!field || value === '—') return '—';

    switch (field.format) {
      case 'date':
        return formatDate(value as string);
      case 'datetime':
        return formatDateTime(value as string);
      case 'currency':
        return `$${Number(value).toLocaleString()}`;
      case 'status': {
        const status = value as ProductStatus;
        return (
          <Badge variant={statusConfig[status]?.variant || 'secondary'}>
            {statusConfig[status]?.label || status}
          </Badge>
        );
      }
      case 'hash':
        return (
          <span className="font-mono text-xs truncate max-w-[200px]" title={String(value)}>
            {String(value)}
          </span>
        );
      default:
        return String(value);
    }
  };

  const handleCopy = (value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(value);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b bg-white p-4 rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold">{product.name}</h2>
            <p className="text-sm text-muted-foreground font-mono">{product.productId}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => onDownloadQR(product)} title="Download QR">
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShowQR(true)} title="View QR Code">
              <QrCode className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onEdit(product)} title="Edit">
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} title="Close">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Product Image */}
          {product.productImage && (
            <div className="mb-6">
              <img
                src={product.productImage}
                alt={product.name}
                className="w-full max-h-64 object-cover rounded-lg border border-gray-200"
              />
            </div>
          )}

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
            <p className="text-gray-900">{product.description || '—'}</p>
          </div>

          <Separator />

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fieldConfigs.map((field) => {
              const value = getFieldValue(field.key);
              const formattedValue = formatValue(field.key, value);
              const Icon = field.icon;

              return (
                <div
                  key={field.key}
                  className="flex items-start gap-3 p-3 rounded-lg bg-gray-50"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">{field.label}</p>
                    <div className="flex items-center gap-2">
                      {typeof formattedValue === 'string' ? (
                        <span className="font-medium text-sm truncate">{formattedValue}</span>
                      ) : (
                        formattedValue
                      )}
                      {(field.key === 'productId' || field.key === 'blockchainHash') && value !== '—' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-0"
                          onClick={() => handleCopy(value as string)}
                          title={copiedField === value ? 'Copied!' : 'Copy'}
                        >
                          {copiedField === value ? (
                            <Check className="w-3 h-3 text-green-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowQR(false)}>
          <QRCodeGenerator
            productId={product.productId}
            productName={product.name}
            verificationUrl={product.qrCodeData}
            onClose={() => setShowQR(false)}
          />
        </div>
      )}
    </div>
  );
}