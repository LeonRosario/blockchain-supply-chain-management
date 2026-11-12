import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui';
import { useToast } from '@/components/ui';
import { ShipmentForm } from '@/components/shipments';
import shipmentService from '@/services/shipment.service';
import type { CreateShipmentPayload } from '@/types';

export default function CreateShipmentPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (payload: CreateShipmentPayload) => {
    const response = await shipmentService.create(payload);
    if (response.source === 'demo') {
      toast.warning(
        'Saved in demo mode',
        'The shipment was stored locally. No blockchain transaction was submitted.'
      );
    } else {
      toast.success('Shipment created', `Tracking number ${response.data.trackingNumber}.`);
    }
    navigate(`/shipments/${response.data.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/shipments')}
          aria-label="Back to shipments"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Shipment</h1>
          <p className="mt-1 text-muted-foreground">
            Assign a route, distributor, transporter, and product quantities.
          </p>
        </div>
      </div>

      <ShipmentForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/shipments')}
      />
    </div>
  );
}