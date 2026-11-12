import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Loader2,
  LockKeyhole,
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
import { ErrorMessage } from '@/components/common';
import { QrScanner, VerificationResultCard } from '@/components/verification';
import blockchainService from '@/services/blockchain.service';
import { addVerificationHistoryRecord } from '@/services/verificationHistory.service';
import { parseProductIdentifier } from '@/services/serviceHelpers';
import type { ProductVerificationResult } from '@/types';
import { errorMessage } from '@/services/serviceHelpers';

export default function PublicVerificationPage() {
  const { productId } = useParams<{ productId?: string }>();
  const [identifier, setIdentifier] = useState(productId ?? '');
  const [result, setResult] = useState<ProductVerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const verify = useCallback(async (rawValue: string) => {
    const normalized = parseProductIdentifier(rawValue);
    if (!normalized) {
      setError(
        'Enter a valid product ID or verification link, for example PROD-001 or https://…/verify/PROD-001.'
      );
      setResult(null);
      return;
    }
    setError(null);
    setIsVerifying(true);
    try {
      const verification = await blockchainService.verifyProduct(normalized);
      setResult(verification);
      addVerificationHistoryRecord(verification);
    } catch (verifyError) {
      setError(errorMessage(verifyError, 'Verification could not be completed.'));
      setResult(null);
    } finally {
      setIsVerifying(false);
    }
  }, []);

  useEffect(() => {
    if (productId) {
      setIdentifier(productId);
      verify(productId);
    }
  }, [productId, verify]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!identifier.trim()) {
      setError('Enter a product ID or scan a QR code.');
      return;
    }
    verify(identifier);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50">
      <section className="border-b bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 px-4 py-12 text-white sm:py-16">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
            <ShieldCheck className="h-7 w-7 text-emerald-300" />
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
            Verify a product
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
            Enter a product ID or scan its QR code to check authenticity against the
            blockchain verification service. No account is required.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanLine className="h-5 w-5" />
              Product lookup
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
                className="sm:flex-1"
              />
              <Button type="submit" disabled={isVerifying}>
                {isVerifying ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Verify product
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
              The product ID is printed below the QR code on the product label. A QR scan
              extracts the identifier first; authenticity is then checked with the
              blockchain service.
            </p>
          </CardContent>
        </Card>

        <div className="mt-6 space-y-6">
          {isVerifying && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium">Checking the blockchain service…</p>
                <p className="text-xs text-muted-foreground">
                  No result is shown until the service responds.
                </p>
              </CardContent>
            </Card>
          )}

          {!isVerifying && result && <VerificationResultCard result={result} />}

          {!isVerifying && !result && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  If the blockchain service is unavailable, the product will be reported as
                  <strong> verification unavailable</strong> — never as verified. Product
                  context shown alongside an unavailable result is demo data and is clearly
                  labelled.
                </span>
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="p-5">
              <LockKeyhole className="h-5 w-5 text-primary" />
              <h2 className="mt-2 font-semibold">Public verification</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Verification is available without signing in. Account holders can review
                their previous checks in verification history.
              </p>
              <Button variant="link" className="mt-1 h-auto p-0" asChild>
                <Link to="/customer/history">
                  View saved history
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h2 className="mt-2 font-semibold">How results are determined</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                A product is marked verified only when the backend explicitly returns an
                on-chain confirmation. A transaction hash alone does not establish
                authenticity.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <QrScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(value) => {
          setIsScannerOpen(false);
          const parsed = parseProductIdentifier(value);
          if (!parsed) {
            setError('The scanned QR code did not contain a valid product identifier.');
            return;
          }
          setIdentifier(parsed);
          verify(parsed);
        }}
      />
    </div>
  );
}