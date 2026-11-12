import type {
  ProductVerificationResult,
  VerificationHistoryRecord,
} from '@/types';

const STORAGE_KEY = 'sc_verification_history';
const MAX_RECORDS = 50;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function getVerificationHistory(): VerificationHistoryRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isRecord)
      .map((record) => record as unknown as VerificationHistoryRecord)
      .filter(
        (record) =>
          typeof record.id === 'string' &&
          typeof record.productId === 'string' &&
          typeof record.verifiedAt === 'string'
      );
  } catch {
    return [];
  }
}

export function addVerificationHistoryRecord(
  result: ProductVerificationResult
): VerificationHistoryRecord {
  const record: VerificationHistoryRecord = {
    id: `vh-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    productId: result.productId,
    productName: result.product?.name,
    productImage: result.product?.productImage,
    authenticityStatus: result.authenticityStatus,
    source: result.source,
    verifiedAt: result.verificationTimestamp ?? new Date().toISOString(),
    message: result.message,
  };
  const records = [record, ...getVerificationHistory()].slice(0, MAX_RECORDS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Best-effort persistence.
  }
  return record;
}

export function clearVerificationHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}