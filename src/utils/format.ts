/** Format a number as USD. */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

/** Shorten a long hash for table display. */
export function shortHash(value?: string, head = 8, tail = 6): string {
  if (!value) return '—';
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

/** Human readable label from a snake_case value. */
export function titleCase(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

/** Format a quantity with thousands separators. */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

/** Days between two ISO dates (can be negative). */
export function daysBetween(from: string, to: string): number {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000);
}

/** Input date value (YYYY-MM-DD) from an ISO date. */
export function toDateInputValue(iso?: string): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

/** Generate a code such as SHP-20261112-4821. */
export function generateCode(prefix: string): string {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate()
  ).padStart(2, '0')}`;
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${date}-${random}`;
}