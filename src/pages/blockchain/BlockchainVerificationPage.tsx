import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  History,
  Loader2,
  QrCode,
  ScanLine,
  Search,
  ShieldCheck,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from '@/components/ui';
import { useToast } from '@/components/ui';
import { ErrorMessage, StatusBadge } from '@/components/common';
import { QrScanner, VerificationResultCard } from '@/components/verification';
import blockchainService from '@/services/blockchain.service';
import {
  addVerificationHistoryRecord,
  getVerificationHistory,
} from '@/services/verificationHistory.service';
import { parseProductIdentifier } from '@/services/serviceHelpers';
import type { ProductVerificationResult, VerificationHistoryRecord } from '@/types';
import { formatDateTime, getAuthenticityMeta } from '@/utils';
import { errorMessage } from '@/services/serviceHelpers';

export default function BlockchainVerificationPage() {
  const toast = useToast();
  const [identifier, setIdentifier] = useState('');
  const [result, setResult] = useState<ProductVerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [history, setHistory] = useState<VerificationHistoryRecord[]>(() =>
    getVerificationHistory().slice(0, 6)
  );

  const verify = async (rawValue: string) => {
    const productId = parseProductIdentifier(rawValue);
    if (!productId) {
      setError(
        'Enter a valid product ID or verification link, for example PROD-001 or https://…/verify/PROD-001.'
      );
      return;
    }
    setIdentifier(rawValue);
    setError(null);
    setIsVerifying(true);
    try {
      const verification = await blockchainService.verifyProduct(productId);
      setResult(verification);
      addVerificationHistoryRecord(verification);
      setHistory(getVerificationHistory().slice(0, 6));
      if (verification.authenticityStatus === 'verified' && verification.blockchainVerified) {
        toast.success('Blockchain verification confirmed', verification.message);
      } else if (verification.authenticityStatus === 'unavailable') {
        toast.warning(
          'Verification unavailable',
          'No verification result was received. The product is not marked verified.'
        );
      } else {
        toast.error('Not verified', verification.message);
      }
    } catch (verifyError) {
      setError(errorMessage(verifyError, 'Verification failed.'));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!identifier.trim()) {
      setError('Enter a product ID or QR verification link.');
      return;
    }
    verify(identifier);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Verify Product</h1>
        <p className="mt-1 text-muted-foreground">
          Check a product identifier or scan its QR code. Verification is performed only
          against a live blockchain service.
        </p>
      </div>

      <Card className="border-amber-200 bg-amber-50/60">
        <CardContent className="flex items-start gap-3 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">No demo verification results</p>
            <p className="mt-1">
              If the blockchain API is unreachable, the result will be “Verification
              unavailable” with <strong>blockchainVerified: false</strong>. Catalog, shipment,
              and ownership details may still be displayed for context and will be clearly
              labelled as demo records. They are not proof of authenticity.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5" />
            Look up a product
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={identifier}
              onChange={(event) => {
                setIdentifier(event.target.value);
                setError(null);
              }}
              placeholder="Product ID or verification URL, e.g. PROD-001"
              aria-label="Product identifier"
              disabled={isVerifying}
            />
            <Button type="submit" disabled={isVerifying}>
              {isVerifying ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Verify
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsScannerOpen(true)}
              disabled={isVerifying}
            >
              <QrCode className="mr-2 h-4 w-4" />
              Scan QR
            </Button>
          </form>
          {error && <ErrorMessage message={error} />}
          <p className="text-xs text-muted-foreground">
            Example identifiers: <span className="font-mono">PROD-001</span>,{' '}
            <span className="font-mono">SHP-2026-1001</span>, or a full verification URL
            containing <span className="font-mono">/verify/&lt;productId&gt;</span>.
          </p>
        </CardContent>
      </Card>

      {result && <VerificationResultCard result={result} />}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent checks in this browser
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/customer/history">Full history</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              No verification checks have been recorded in this browser yet.
            </p>
          ) : (
            <div className="space-y-2">
              {history.map((record) => {
                const meta = getAuthenticityMeta(record.authenticityStatus);
                return (
                  <div
                    key={record.id}
                    className="flex flex-col gap-2 rounded-lg border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {record.productName ?? record.productId}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-mono">{record.productId}</span> ·{' '}
                        {formatDateTime(record.verifiedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge label={meta.label} tone={meta.tone} />
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/verify/${encodeURIComponent(record.productId)}`}>
                          Re-check
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            This history is stored locally in your browser. It is not a blockchain ledger.
          </p>
        </CardContent>
      </Card>

      <QrScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(value) => {
          setIsScannerOpen(false);
          verify(value);
        }}
      />

      {result?.authenticityStatus === 'verified' && result.blockchainVerified && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <CheckCircle2 className="h-4 w-4" />
          This result includes an explicit on-chain confirmation from the blockchain
          service.
        </div>
      )}
    </div>
  );
}