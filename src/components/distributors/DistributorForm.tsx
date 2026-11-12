import { useState } from 'react';
import { Loader2, Save, X } from 'lucide-react';
import { Button, Input, Label, Textarea } from '@/components/ui';
import { ErrorMessage } from '@/components/common';
import type {
  CreateDistributorPayload,
  Distributor,
  DistributorStatus,
} from '@/types';
import { errorMessage } from '@/services/serviceHelpers';

interface DistributorFormProps {
  initialDistributor?: Distributor;
  onSubmit: (payload: CreateDistributorPayload) => Promise<void>;
  onCancel: () => void;
}

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

export default function DistributorForm({
  initialDistributor,
  onSubmit,
  onCancel,
}: DistributorFormProps) {
  const [code, setCode] = useState(initialDistributor?.code ?? '');
  const [name, setName] = useState(initialDistributor?.name ?? '');
  const [contactName, setContactName] = useState(initialDistributor?.contactName ?? '');
  const [email, setEmail] = useState(initialDistributor?.email ?? '');
  const [phone, setPhone] = useState(initialDistributor?.phone ?? '');
  const [address, setAddress] = useState(initialDistributor?.address ?? '');
  const [city, setCity] = useState(initialDistributor?.city ?? '');
  const [state, setState] = useState(initialDistributor?.state ?? '');
  const [country, setCountry] = useState(initialDistributor?.country ?? '');
  const [licenseNumber, setLicenseNumber] = useState(
    initialDistributor?.licenseNumber ?? ''
  );
  const [status, setStatus] = useState<DistributorStatus>(
    initialDistributor?.status ?? 'active'
  );
  const [notes, setNotes] = useState(initialDistributor?.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!code.trim()) next.code = 'Distributor code is required.';
    if (!name.trim()) next.name = 'Distributor name is required.';
    if (!contactName.trim()) next.contactName = 'Contact name is required.';
    if (!email.trim()) {
      next.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = 'Enter a valid email address.';
    }
    if (!phone.trim()) next.phone = 'Phone number is required.';
    if (!address.trim()) next.address = 'Street address is required.';
    if (!city.trim()) next.city = 'City is required.';
    if (!country.trim()) next.country = 'Country is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    const payload: CreateDistributorPayload = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      contactName: contactName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim() || undefined,
      country: country.trim(),
      licenseNumber: licenseNumber.trim() || undefined,
      status,
      notes: notes.trim() || undefined,
    };

    setIsSubmitting(true);
    try {
      await onSubmit(payload);
    } catch (error) {
      setSubmitError(errorMessage(error, 'Unable to save the distributor.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {submitError && <ErrorMessage message={submitError} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="distributor-code">Distributor code *</Label>
          <Input
            id="distributor-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="DIST-001"
            disabled={isSubmitting}
          />
          {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="distributor-name">Company name *</Label>
          <Input
            id="distributor-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Atlas Global Distribution"
            disabled={isSubmitting}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="distributor-contact">Primary contact *</Label>
          <Input
            id="distributor-contact"
            value={contactName}
            onChange={(event) => setContactName(event.target.value)}
            disabled={isSubmitting}
          />
          {errors.contactName && (
            <p className="text-xs text-destructive">{errors.contactName}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="distributor-license">License number</Label>
          <Input
            id="distributor-license"
            value={licenseNumber}
            onChange={(event) => setLicenseNumber(event.target.value)}
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="distributor-email">Email *</Label>
          <Input
            id="distributor-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isSubmitting}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="distributor-phone">Phone *</Label>
          <Input
            id="distributor-phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            disabled={isSubmitting}
          />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
        </div>
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <h3 className="text-sm font-semibold">Address</h3>
        <div className="space-y-1.5">
          <Label htmlFor="distributor-address">Street address *</Label>
          <Input
            id="distributor-address"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            disabled={isSubmitting}
          />
          {errors.address && (
            <p className="text-xs text-destructive">{errors.address}</p>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="distributor-city">City *</Label>
            <Input
              id="distributor-city"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              disabled={isSubmitting}
            />
            {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="distributor-state">State / region</Label>
            <Input
              id="distributor-state"
              value={state}
              onChange={(event) => setState(event.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="distributor-country">Country *</Label>
            <Input
              id="distributor-country"
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              disabled={isSubmitting}
            />
            {errors.country && (
              <p className="text-xs text-destructive">{errors.country}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="distributor-status">Status</Label>
            <select
              id="distributor-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as DistributorStatus)}
              className={selectClass}
              disabled={isSubmitting}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="distributor-notes">Notes</Label>
        <Textarea
          id="distributor-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
          placeholder="Coverage area, compliance notes, or account status context."
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
              {initialDistributor ? 'Save changes' : 'Create distributor'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}