import { useState } from 'react';
import { Loader2, Save, X } from 'lucide-react';
import {
  Button,
  Input,
  Label,
  Textarea,
} from '@/components/ui';
import { ErrorMessage } from '@/components/common';
import type { CreateWarehousePayload, Warehouse, WarehouseStatus } from '@/types';
import { errorMessage } from '@/services/serviceHelpers';

interface WarehouseFormProps {
  initialWarehouse?: Warehouse;
  onSubmit: (payload: CreateWarehousePayload) => Promise<void>;
  onCancel: () => void;
}

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

export default function WarehouseForm({
  initialWarehouse,
  onSubmit,
  onCancel,
}: WarehouseFormProps) {
  const [code, setCode] = useState(initialWarehouse?.code ?? '');
  const [name, setName] = useState(initialWarehouse?.name ?? '');
  const [status, setStatus] = useState<WarehouseStatus>(
    initialWarehouse?.status ?? 'active'
  );
  const [address, setAddress] = useState(initialWarehouse?.address ?? '');
  const [city, setCity] = useState(initialWarehouse?.city ?? '');
  const [state, setState] = useState(initialWarehouse?.state ?? '');
  const [country, setCountry] = useState(initialWarehouse?.country ?? '');
  const [postalCode, setPostalCode] = useState(initialWarehouse?.postalCode ?? '');
  const [capacity, setCapacity] = useState(String(initialWarehouse?.capacity ?? ''));
  const [occupied, setOccupied] = useState(String(initialWarehouse?.occupied ?? '0'));
  const [manager, setManager] = useState(initialWarehouse?.manager ?? '');
  const [contactName, setContactName] = useState(initialWarehouse?.contactName ?? '');
  const [contactEmail, setContactEmail] = useState(initialWarehouse?.contactEmail ?? '');
  const [contactPhone, setContactPhone] = useState(initialWarehouse?.contactPhone ?? '');
  const [notes, setNotes] = useState(initialWarehouse?.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!code.trim()) next.code = 'Warehouse code is required.';
    if (!name.trim()) next.name = 'Warehouse name is required.';
    if (!address.trim()) next.address = 'Street address is required.';
    if (!city.trim()) next.city = 'City is required.';
    if (!country.trim()) next.country = 'Country is required.';
    if (!contactName.trim()) next.contactName = 'Contact name is required.';
    if (!contactEmail.trim()) {
      next.contactEmail = 'Contact email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
      next.contactEmail = 'Enter a valid contact email.';
    }
    if (!contactPhone.trim()) next.contactPhone = 'Contact phone is required.';
    const capacityValue = Number(capacity);
    const occupiedValue = Number(occupied);
    if (!Number.isFinite(capacityValue) || capacityValue <= 0) {
      next.capacity = 'Capacity must be greater than zero.';
    }
    if (!Number.isFinite(occupiedValue) || occupiedValue < 0) {
      next.occupied = 'Occupied units cannot be negative.';
    } else if (Number.isFinite(capacityValue) && occupiedValue > capacityValue) {
      next.occupied = 'Occupied units cannot exceed capacity.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    const payload: CreateWarehousePayload = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim() || undefined,
      country: country.trim(),
      postalCode: postalCode.trim() || undefined,
      contactName: contactName.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim(),
      capacity: Number(capacity),
      occupied: Number(occupied),
      manager: manager.trim() || undefined,
      status,
      notes: notes.trim() || undefined,
    };

    setIsSubmitting(true);
    try {
      await onSubmit(payload);
    } catch (error) {
      setSubmitError(errorMessage(error, 'Unable to save the warehouse.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {submitError && <ErrorMessage message={submitError} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="warehouse-code">Warehouse code *</Label>
          <Input
            id="warehouse-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="WH-LAX-01"
            disabled={isSubmitting}
          />
          {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="warehouse-name">Warehouse name *</Label>
          <Input
            id="warehouse-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Los Angeles Distribution Center"
            disabled={isSubmitting}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="warehouse-manager">Manager</Label>
          <Input
            id="warehouse-manager"
            value={manager}
            onChange={(event) => setManager(event.target.value)}
            placeholder="Operations manager"
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="warehouse-status">Status</Label>
          <select
            id="warehouse-status"
            value={status}
            onChange={(event) => setStatus(event.target.value as WarehouseStatus)}
            className={selectClass}
            disabled={isSubmitting}
          >
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <h3 className="text-sm font-semibold">Location</h3>
        <div className="space-y-1.5">
          <Label htmlFor="warehouse-address">Street address *</Label>
          <Input
            id="warehouse-address"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="4820 Industrial Parkway"
            disabled={isSubmitting}
          />
          {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="warehouse-city">City *</Label>
            <Input
              id="warehouse-city"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              disabled={isSubmitting}
            />
            {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="warehouse-state">State / region</Label>
            <Input
              id="warehouse-state"
              value={state}
              onChange={(event) => setState(event.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="warehouse-country">Country *</Label>
            <Input
              id="warehouse-country"
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              disabled={isSubmitting}
            />
            {errors.country && (
              <p className="text-xs text-destructive">{errors.country}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="warehouse-postal">Postal code</Label>
            <Input
              id="warehouse-postal"
              value={postalCode}
              onChange={(event) => setPostalCode(event.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <h3 className="text-sm font-semibold">Capacity</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="warehouse-capacity">Total capacity (units) *</Label>
            <Input
              id="warehouse-capacity"
              type="number"
              min={1}
              step={1}
              value={capacity}
              onChange={(event) => setCapacity(event.target.value)}
              disabled={isSubmitting}
            />
            {errors.capacity && (
              <p className="text-xs text-destructive">{errors.capacity}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="warehouse-occupied">Occupied units</Label>
            <Input
              id="warehouse-occupied"
              type="number"
              min={0}
              step={1}
              value={occupied}
              onChange={(event) => setOccupied(event.target.value)}
              disabled={isSubmitting}
            />
            {errors.occupied && (
              <p className="text-xs text-destructive">{errors.occupied}</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <h3 className="text-sm font-semibold">Primary contact</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="warehouse-contact">Contact name *</Label>
            <Input
              id="warehouse-contact"
              value={contactName}
              onChange={(event) => setContactName(event.target.value)}
              disabled={isSubmitting}
            />
            {errors.contactName && (
              <p className="text-xs text-destructive">{errors.contactName}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="warehouse-email">Contact email *</Label>
            <Input
              id="warehouse-email"
              type="email"
              value={contactEmail}
              onChange={(event) => setContactEmail(event.target.value)}
              disabled={isSubmitting}
            />
            {errors.contactEmail && (
              <p className="text-xs text-destructive">{errors.contactEmail}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="warehouse-phone">Contact phone *</Label>
            <Input
              id="warehouse-phone"
              value={contactPhone}
              onChange={(event) => setContactPhone(event.target.value)}
              disabled={isSubmitting}
            />
            {errors.contactPhone && (
              <p className="text-xs text-destructive">{errors.contactPhone}</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="warehouse-notes">Notes</Label>
        <Textarea
          id="warehouse-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
          placeholder="Operating notes, handling restrictions, or maintenance windows."
          disabled={isSubmitting}
        />
      </div>

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {initialWarehouse ? 'Save changes' : 'Create warehouse'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}