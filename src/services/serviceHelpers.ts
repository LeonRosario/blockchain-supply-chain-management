import type { DataSource, ServiceResponse } from '@/types';

/**
 * Backend reachability handling.
 *
 * The application works against a real API when one is available. Demo records
 * are only used when the endpoint is unreachable or not implemented. A 400/422
 * validation response is never replaced with demo data.
 */
export function shouldUseDemoFallback(error: unknown): boolean {
  if (!error || typeof error !== 'object') return true;
  const candidate = error as { response?: { status?: number } };
  if (!candidate.response) return true; // network error / timeout
  const status = candidate.response.status;
  return (
    status === undefined ||
    status === 401 ||
    status === 403 ||
    status === 404 ||
    status === 405 ||
    status === 501 ||
    status === 502 ||
    status === 503 ||
    status === 504
  );
}

export function errorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (typeof error === 'string' && error) return error;
  if (error && typeof error === 'object') {
    const candidate = error as {
      message?: string;
      response?: { data?: { message?: string } };
    };
    const responseMessage = candidate.response?.data?.message;
    if (responseMessage) return responseMessage;
    if (candidate.message) return candidate.message;
  }
  return fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export interface ParsedCollection<T> {
  items: T[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

/** Parse common API collection envelopes: raw arrays, ApiResponse and PaginatedResponse. */
export function parseCollection<T>(payload: unknown): ParsedCollection<T> | null {
  if (Array.isArray(payload)) {
    return { items: payload as T[] };
  }
  if (!isRecord(payload)) return null;

  const data = payload.data;
  if (Array.isArray(data)) {
    return {
      items: data as T[],
      total: typeof payload.total === 'number' ? payload.total : undefined,
      page: typeof payload.page === 'number' ? payload.page : undefined,
      limit: typeof payload.limit === 'number' ? payload.limit : undefined,
      totalPages:
        typeof payload.totalPages === 'number' ? payload.totalPages : undefined,
    };
  }

  // Some APIs wrap paginated data one level deeper.
  if (isRecord(data) && Array.isArray(data.data)) {
    return {
      items: data.data as T[],
      total: typeof data.total === 'number' ? data.total : undefined,
      page: typeof data.page === 'number' ? data.page : undefined,
      limit: typeof data.limit === 'number' ? data.limit : undefined,
      totalPages: typeof data.totalPages === 'number' ? data.totalPages : undefined,
    };
  }

  return null;
}

/** Parse common API entity envelopes. */
export function parseEntity<T>(payload: unknown): T | null {
  if (!isRecord(payload)) return null;
  if ('data' in payload) {
    const data = payload.data;
    if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
      return data as T;
    }
    return null;
  }
  return payload as T;
}

export function apiMessage(payload: unknown, fallback: string): string {
  if (isRecord(payload) && typeof payload.message === 'string' && payload.message) {
    return payload.message;
  }
  return fallback;
}

export function paginate<T>(
  items: T[],
  page = 1,
  limit = 10
): { items: T[]; total: number; page: number; limit: number; totalPages: number } {
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, limit);
  const start = (safePage - 1) * safeLimit;
  return {
    items: items.slice(start, start + safeLimit),
    total: items.length,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.max(1, Math.ceil(items.length / safeLimit)),
  };
}

export function serviceResponse<T>(
  data: T,
  message: string,
  source: DataSource,
  success = true
): ServiceResponse<T> {
  return { data, message, source, success };
}

/** Extract a normalised product identifier from raw QR payloads and URLs. */
export function parseProductIdentifier(rawValue: string): string | null {
  const value = rawValue.trim();
  if (!value) return null;

  const direct = value.match(/^[A-Za-z0-9][A-Za-z0-9_-]{1,63}$/);
  if (direct) return value;

  try {
    const url = new URL(value.includes('://') ? value : `https://${value}`);
    const fromQuery =
      url.searchParams.get('productId') ||
      url.searchParams.get('product') ||
      url.searchParams.get('id');
    if (fromQuery && /^[A-Za-z0-9][A-Za-z0-9_-]{1,63}$/.test(fromQuery)) {
      return fromQuery;
    }

    const segments = url.pathname.split('/').filter(Boolean);
    const verifyIndex = segments.findIndex((segment) => segment.toLowerCase() === 'verify');
    const candidate =
      verifyIndex >= 0
        ? segments[verifyIndex + 1]
        : segments[segments.length - 1];
    if (candidate && /^[A-Za-z0-9][A-Za-z0-9_-]{1,63}$/.test(candidate)) {
      return decodeURIComponent(candidate);
    }
  } catch {
    return null;
  }

  return null;
}