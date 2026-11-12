import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ExternalLink,
  History,
  SearchX,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { useToast } from '@/components/ui';
import {
  ConfirmDialog,
  EmptyState,
  SearchInput,
  StatusBadge,
} from '@/components/common';
import {
  clearVerificationHistory,
  getVerificationHistory,
} from '@/services/verificationHistory.service';
import type {
  AuthenticityStatus,
  VerificationHistoryRecord,
} from '@/types';
import { formatDateTime, getAuthenticityMeta } from '@/utils';

const statuses: AuthenticityStatus[] = [
  'verified',
  'not_verified',
  'unavailable',
  'not_found',
];

function sourceLabel(record: VerificationHistoryRecord): string {
  if (record.source === 'api') return 'Blockchain API response';
  if (record.source === 'demo') return 'Demo data — not a verification result';
  return 'No verification response';
}

export default function CustomerProductHistoryPage() {
  const toast = useToast();
  const [records, setRecords] = useState<VerificationHistoryRecord[]>(() =>
    getVerificationHistory()
  );
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<AuthenticityStatus | 'all'>('all');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return records.filter((record) => {
      if (status !== 'all' && record.authenticityStatus !== status) return false;
      if (query) {
        const haystack = [record.productId, record.productName, record.message]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [records, search, status]);

  const clearHistory = () => {
    clearVerificationHistory();
    setRecords([]);
    setIsConfirmOpen(false);
    toast.success('Verification history cleared');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product History</h1>
          <p className="mt-1 text-muted-foreground">
            Review product verification checks recorded in this browser.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/verify">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Verify a product
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsConfirmOpen(true)}
            disabled={records.length === 0}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear history
          </Button>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          This history is stored locally in your browser and can be cleared at any time.
          It is not a blockchain ledger, and an “unavailable” entry is not a verification
          failure or success — it means no result was received.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Verification checks
          </CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search product or message…"
              ariaLabel="Search verification history"
              className="sm:w-64"
            />
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as AuthenticityStatus | 'all')
              }
              className="h-9 rounded-md border bg-background px-3 text-sm"
              aria-label="Filter verification history by status"
            >
              <option value="all">All statuses</option>
              {statuses.map((option) => (
                <option key={option} value={option}>
                  {getAuthenticityMeta(option).label}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <EmptyState
              icon={records.length === 0 ? History : SearchX}
              title={
                records.length === 0
                  ? 'No verification history yet'
                  : 'No matching verification checks'
              }
              description={
                records.length === 0
                  ? 'Verify a product by ID or QR code and your checks will appear here.'
                  : 'Try clearing the search or status filter.'
              }
              action={
                records.length === 0 ? (
                  <Button asChild>
                    <Link to="/verify">
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Verify a product
                    </Link>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearch('');
                      setStatus('all');
                    }}
                  >
                    Clear filters
                  </Button>
                )
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-3 font-medium">Product</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium">Source</th>
                    <th className="px-3 py-3 font-medium">Checked</th>
                    <th className="px-3 py-3 font-medium">Message</th>
                    <th className="px-3 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((record) => {
                    const meta = getAuthenticityMeta(record.authenticityStatus);
                    return (
                      <tr key={record.id} className="hover:bg-muted/40">
                        <td className="px-3 py-3">
                          <p className="font-medium">
                            {record.productName ?? record.productId}
                          </p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {record.productId}
                          </p>
                        </td>
                        <td className="px-3 py-3">
                          <StatusBadge label={meta.label} tone={meta.tone} dot />
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground">
                          {sourceLabel(record)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">
                          {formatDateTime(record.verifiedAt)}
                        </td>
                        <td className="max-w-[320px] px-3 py-3">
                          <p className="line-clamp-2 text-xs text-muted-foreground">
                            {record.message}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link
                              to={`/verify/${encodeURIComponent(record.productId)}`}
                            >
                              Re-check
                              <ExternalLink className="ml-1 h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Clear verification history?"
        description="This removes all locally stored verification checks from this browser. It does not affect any blockchain or backend records."
        confirmLabel="Clear history"
        variant="destructive"
        onConfirm={clearHistory}
        onClose={() => setIsConfirmOpen(false)}
      />
    </div>
  );
}