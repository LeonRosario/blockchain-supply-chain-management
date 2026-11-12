import { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, Save, Trash2, X } from 'lucide-react';
import type {
  CreateShipmentPayload,
  Distributor,
  Product,
  Shipment,
  Warehouse,
} from '@/types';
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
} from '@/components/ui';
import { ErrorMessage } from '@/components/common';
import warehouseService from '@/services/warehouse.service';
import distributorService from '@/services/distributor.service';
import productService from '@/services/product.service';
import { demoCarriers } from '@/data/mockSupplyChain';
import { mockProducts } from '@/data/mockProducts';
import { errorMessage } from '@/services/serviceHelpers';
import { formatCurrency, getShipmentStatusMeta, toDateInputValue } from '@/utils';

interface ShipmentFormItem {
  key: string;
  productId: string;
  quantity: number;
}

interface ShipmentFormProps {
  initialShipment?: Shipment;
  onSubmit: (payload: CreateShipmentPayload) => Promise<void>;
  onCancel: () => void;
}

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

let itemCounter = 0;
function nextItemKey(): string {
  itemCounter += 1;
  return `shipment-item-${itemCounter}-${Date.now()}`;
}

function defaultDeliveryDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

export default function ShipmentForm({
  initialShipment,
  onSubmit,
  onCancel,
}: ShipmentFormProps) {
  const isEditing = Boolean(initialShipment);

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [catalogIsDemo, setCatalogIsDemo] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [sourceWarehouseId, setSourceWarehouseId] = useState(
    initialShipment?.sourceWarehouseId ?? ''
  );
  const [destinationWarehouseId, setDestinationWarehouseId] = useState(
    initialShipment?.destinationWarehouseId ?? ''
  );
  const [distributorId, setDistributorId] = useState(
    initialShipment?.distributorId ?? ''
  );
  const [carrierId, setCarrierId] = useState(initialShipment?.carrierId ?? '');
  const [shipmentDate, setShipmentDate] = useState(
    toDateInputValue(initialShipment?.createdAt) || new Date().toISOString().slice(0, 10)
  );
  const [estimatedDelivery, setEstimatedDelivery] = useState(
    toDateInputValue(initialShipment?.estimatedDelivery) || defaultDeliveryDate()
  );
  const [notes, setNotes] = useState(initialShipment?.notes ?? '');
  const [items, setItems] = useState<ShipmentFormItem[]>(
    initialShipment?.items.length
      ? initialShipment.items.map((item) => ({
          key: nextItemKey(),
          productId: item.productId,
          quantity: item.quantity,
        }))
      : [{ key: nextItemKey(), productId: '', quantity: 1 }]
  );

  useEffect(() => {
    let active = true;
    const loadOptions = async () => {
      setIsLoadingOptions(true);
      const [warehouseResult, distributorResult] = await Promise.allSettled([
        warehouseService.getAll(),
        distributorService.getAll(),
      ]);
      if (!active) return;

      if (warehouseResult.status === 'fulfilled') {
        setWarehouses(warehouseResult.value.data);
      }
      if (distributorResult.status === 'fulfilled') {
        setDistributors(distributorResult.value.data);
      }

      try {
        const response = await productService.getAll({ page: 1, limit: 100 });
        if (active) setProducts(response.data);
      } catch {
        if (active) {
          setProducts(mockProducts);
          setCatalogIsDemo(true);
        }
      } finally {
        if (active) setIsLoadingOptions(false);
      }
    };
    loadOptions();
    return () => {
      active = false;
    };
  }, []);

  const selectedSource = warehouses.find((warehouse) => warehouse.id === sourceWarehouseId);
  const selectedDestination = warehouses.find(
    (warehouse) => warehouse.id === destinationWarehouseId
  );
  const selectedDistributor = distributors.find(
    (distributor) => distributor.id === distributorId
  );
  const selectedCarrier = demoCarriers.find((carrier) => carrier.id === carrierId);

  const totalUnits = useMemo(
    () => items.reduce((sum, item) => sum + (Number.isFinite(item.quantity) ? item.quantity : 0), 0),
    [items]
  );

  const totalValue = useMemo(
    () =>
      items.reduce((sum, item) => {
        const product = products.find((entry) => entry.productId === item.productId);
        return sum + (product?.price ?? 0) * item.quantity;
      }, 0),
    [items, products]
  );

  const updateItem = (key: string, updates: Partial<ShipmentFormItem>) => {
    setItems((current) =>
      current.map((item) => (item.key === key ? { ...item, ...updates } : item))
    );
    setErrors((current) => ({ ...current, items: '' }));
  };

  const addItem = () => {
    setItems((current) => [
      ...current,
      { key: nextItemKey(), productId: '', quantity: 1 },
    ]);
  };

  const removeItem = (key: string) => {
    setItems((current) =>
      current.length === 1 ? current : current.filter((item) => item.key !== key)
    );
  };

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!sourceWarehouseId) nextErrors.sourceWarehouse = 'Select a source warehouse.';
    if (!destinationWarehouseId) {
      nextErrors.destinationWarehouse = 'Select a destination warehouse.';
    } else if (sourceWarehouseId === destinationWarehouseId) {
      nextErrors.destinationWarehouse = 'Source and destination must be different.';
    }
    if (!distributorId) nextErrors.distributor = 'Assign a distributor.';
    if (!carrierId) nextErrors.carrier = 'Assign a transporter.';
    if (!shipmentDate) nextErrors.shipmentDate = 'Shipment date is required.';
    if (!estimatedDelivery) {
      nextErrors.estimatedDelivery = 'Expected delivery date is required.';
    } else if (shipmentDate && estimatedDelivery < shipmentDate) {
      nextErrors.estimatedDelivery = 'Expected delivery cannot be before the shipment date.';
    }
    if (items.some((item) => !item.productId)) {
      nextErrors.items = 'Select a product for every line item.';
    } else if (items.some((item) => !Number.isFinite(item.quantity) || item.quantity <= 0)) {
      nextErrors.items = 'Every quantity must be greater than zero.';
    } else if (new Set(items.map((item) => item.productId)).size !== items.length) {
      nextErrors.items = 'Each product may only appear once. Combine duplicate lines.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);
    if (!validate()) return;
    if (!selectedSource || !selectedDestination || !selectedDistributor || !selectedCarrier) {
      setSubmitError('One or more selected records could not be found.');
      return;
    }

    const payloadItems = items.map((item) => {
      const product = products.find((entry) => entry.productId === item.productId);
      return {
        productId: item.productId,
        productName: product?.name,
        sku: product?.sku,
        quantity: item.quantity,
        unitPrice: product?.price,
      };
    });

    const payload: CreateShipmentPayload = {
      origin: selectedSource.name,
      destination: selectedDestination.name,
      sourceWarehouseId: selectedSource.id,
      sourceWarehouseName: selectedSource.name,
      destinationWarehouseId: selectedDestination.id,
      destinationWarehouseName: selectedDestination.name,
      distributorId: selectedDistributor.id,
      distributorName: selectedDistributor.name,
      carrierId: selectedCarrier.id,
      carrierName: selectedCarrier.name,
      items: payloadItems,
      shipmentDate: new Date(`${shipmentDate}T08:00:00`).toISOString(),
      estimatedDelivery: new Date(`${estimatedDelivery}T17:00:00`).toISOString(),
      notes: notes.trim() || undefined,
    };

    setIsSubmitting(true);
    try {
      await onSubmit(payload);
    } catch (error) {
      setSubmitError(errorMessage(error, 'Unable to save the shipment.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-5xl">
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Shipment' : 'Create Shipment'}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {isEditing
            ? `Editing ${initialShipment?.trackingNumber}. Status changes are managed from the tracking panel.`
            : 'A tracking number is generated automatically when the shipment is saved.'}
        </p>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {submitError && <ErrorMessage message={submitError} />}

          <div className="grid gap-4 rounded-lg border bg-muted/30 p-4 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Shipment ID</p>
              <p className="mt-1 font-mono text-sm font-medium">
                {initialShipment?.trackingNumber ?? 'Generated automatically'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Line items</p>
              <p className="mt-1 text-sm font-medium">{items.length}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total units</p>
              <p className="mt-1 text-sm font-medium">{totalUnits.toLocaleString()}</p>
            </div>
          </div>

          <section className="space-y-4">
            <h3 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Route & assignment
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="sourceWarehouse">Source warehouse *</Label>
                <select
                  id="sourceWarehouse"
                  value={sourceWarehouseId}
                  onChange={(event) => setSourceWarehouseId(event.target.value)}
                  className={selectClass}
                  disabled={isLoadingOptions || isSubmitting}
                >
                  <option value="">Select source warehouse</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} ({warehouse.code})
                    </option>
                  ))}
                </select>
                {errors.sourceWarehouse && (
                  <p className="text-xs text-destructive">{errors.sourceWarehouse}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="destinationWarehouse">Destination warehouse *</Label>
                <select
                  id="destinationWarehouse"
                  value={destinationWarehouseId}
                  onChange={(event) => setDestinationWarehouseId(event.target.value)}
                  className={selectClass}
                  disabled={isLoadingOptions || isSubmitting}
                >
                  <option value="">Select destination warehouse</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} ({warehouse.code})
                    </option>
                  ))}
                </select>
                {errors.destinationWarehouse && (
                  <p className="text-xs text-destructive">{errors.destinationWarehouse}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="distributor">Distributor *</Label>
                <select
                  id="distributor"
                  value={distributorId}
                  onChange={(event) => setDistributorId(event.target.value)}
                  className={selectClass}
                  disabled={isLoadingOptions || isSubmitting}
                >
                  <option value="">Assign distributor</option>
                  {distributors.map((distributor) => (
                    <option key={distributor.id} value={distributor.id}>
                      {distributor.name}
                    </option>
                  ))}
                </select>
                {errors.distributor && (
                  <p className="text-xs text-destructive">{errors.distributor}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="carrier">Transporter *</Label>
                <select
                  id="carrier"
                  value={carrierId}
                  onChange={(event) => setCarrierId(event.target.value)}
                  className={selectClass}
                  disabled={isLoadingOptions || isSubmitting}
                >
                  <option value="">Assign transporter</option>
                  {demoCarriers.map((carrier) => (
                    <option key={carrier.id} value={carrier.id}>
                      {carrier.name}
                    </option>
                  ))}
                </select>
                {errors.carrier && (
                  <p className="text-xs text-destructive">{errors.carrier}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="shipmentDate">Shipment date *</Label>
                <Input
                  id="shipmentDate"
                  type="date"
                  value={shipmentDate}
                  onChange={(event) => setShipmentDate(event.target.value)}
                  disabled={isSubmitting}
                />
                {errors.shipmentDate && (
                  <p className="text-xs text-destructive">{errors.shipmentDate}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="estimatedDelivery">Expected delivery *</Label>
                <Input
                  id="estimatedDelivery"
                  type="date"
                  value={estimatedDelivery}
                  onChange={(event) => setEstimatedDelivery(event.target.value)}
                  disabled={isSubmitting}
                />
                {errors.estimatedDelivery && (
                  <p className="text-xs text-destructive">{errors.estimatedDelivery}</p>
                )}
              </div>
            </div>
            {catalogIsDemo && (
              <p className="text-xs text-amber-700">
                Product catalog: sample data (product API unavailable).
              </p>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Products & quantities
              </h3>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="mr-1 h-4 w-4" />
                Add product
              </Button>
            </div>
            {errors.items && <p className="text-xs text-destructive">{errors.items}</p>}
            <div className="space-y-3">
              {items.map((item, index) => {
                const product = products.find((entry) => entry.productId === item.productId);
                return (
                  <div
                    key={item.key}
                    className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_120px_120px_40px] sm:items-end"
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor={`product-${item.key}`}>
                        Product {index + 1} *
                      </Label>
                      <select
                        id={`product-${item.key}`}
                        value={item.productId}
                        onChange={(event) =>
                          updateItem(item.key, {
                            productId: event.target.value,
                            quantity:
                              event.target.value && item.quantity <= 0 ? 1 : item.quantity,
                          })
                        }
                        className={selectClass}
                        disabled={isLoadingOptions || isSubmitting}
                      >
                        <option value="">Select product</option>
                        {products.map((entry) => (
                          <option key={entry.id} value={entry.productId}>
                            {entry.name} ({entry.productId})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`quantity-${item.key}`}>Quantity *</Label>
                      <Input
                        id={`quantity-${item.key}`}
                        type="number"
                        min={1}
                        step={1}
                        value={item.quantity}
                        onChange={(event) =>
                          updateItem(item.key, { quantity: Number(event.target.value) })
                        }
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-sm font-medium leading-none">Line value</p>
                      <p className="flex h-9 items-center text-sm text-muted-foreground">
                        {formatCurrency((product?.price ?? 0) * item.quantity)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.key)}
                      disabled={items.length === 1 || isSubmitting}
                      aria-label={`Remove product ${index + 1}`}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
            {totalValue > 0 && (
              <p className="text-right text-sm text-muted-foreground">
                Estimated line value:{' '}
                <span className="font-semibold text-foreground">{formatCurrency(totalValue)}</span>
              </p>
            )}
          </section>

          <section className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Handling instructions, packaging notes, or delivery requirements…"
              rows={3}
              disabled={isSubmitting}
            />
          </section>

          {initialShipment && (
            <p className="text-xs text-muted-foreground">
              Current status: {getShipmentStatusMeta(initialShipment.status).label}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || isLoadingOptions}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? 'Save changes' : 'Create shipment'}
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}