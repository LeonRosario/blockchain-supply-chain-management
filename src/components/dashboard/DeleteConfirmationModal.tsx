import { useState } from 'react';
import { AlertTriangle, Loader2, Trash2, CheckCircle } from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Input,
  Label,
} from '@/components/ui';

interface DeleteConfirmationModalProps {
  productName: string;
  productId: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
}

export default function DeleteConfirmationModal({
  productName,
  productId,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: DeleteConfirmationModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const isConfirmValid = confirmText.toUpperCase() === productId.toUpperCase();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <CardHeader className={showSuccess ? 'text-center' : ''}>
          {showSuccess ? (
            <>
              <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-lg">Product Deleted</CardTitle>
            </>
          ) : (
            <>
              <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-lg">Delete Product</CardTitle>
            </>
          )}
        </CardHeader>
        <CardContent className={showSuccess ? 'text-center' : ''}>
          {showSuccess ? (
            <p className="text-muted-foreground">
              "{productName}" ({productId}) has been permanently deleted.
            </p>
          ) : (
            <>
              <p className="mb-4">
                Are you sure you want to delete <strong>"{productName}"</strong>?
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Product ID: <code className="font-mono">{productId}</code>
              </p>
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-800">
                  This action cannot be undone. All associated data will be permanently removed.
                </p>
              </div>
              <div className="mt-4 space-y-2">
                <Label htmlFor="confirmInput" className="text-sm font-medium">
                  Type the Product ID to confirm:
                </Label>
                <Input
                  id="confirmInput"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={productId}
                  className={confirmText && !isConfirmValid ? 'border-red-500 focus:border-red-500' : isConfirmValid ? 'border-green-500 focus:border-green-500' : ''}
                  disabled={isLoading || showSuccess}
                  autoFocus
                />
                {confirmText && !isConfirmValid && (
                  <p className="text-sm text-red-500">Product ID does not match</p>
                )}
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          {showSuccess ? (
            <Button onClick={onClose} className="w-full sm:w-auto">
              Close
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  await onConfirm();
                  setShowSuccess(true);
                }}
                disabled={isLoading || !isConfirmValid}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Permanently
                  </>
                )}
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}