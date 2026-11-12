import type { AppPreferences, NotificationPreferences } from '@/types';

const NOTIFICATION_KEY = 'sc_notification_preferences';
const APP_PREFERENCES_KEY = 'sc_app_preferences';

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  emailNotifications: true,
  shipmentUpdates: true,
  blockchainEvents: true,
  inventoryAlerts: true,
  verificationAlerts: false,
  marketing: false,
};

export const DEFAULT_APP_PREFERENCES: AppPreferences = {
  theme: 'light',
  language: 'en-US',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  compactTables: false,
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<T>;
    if (!parsed || typeof parsed !== 'object') return fallback;
    return { ...fallback, ...parsed };
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Best-effort persistence.
  }
}

export function getNotificationPreferences(): NotificationPreferences {
  return readJson(NOTIFICATION_KEY, DEFAULT_NOTIFICATION_PREFERENCES);
}

export function saveNotificationPreferences(
  preferences: NotificationPreferences
): void {
  writeJson(NOTIFICATION_KEY, preferences);
}

export function getAppPreferences(): AppPreferences {
  return readJson(APP_PREFERENCES_KEY, DEFAULT_APP_PREFERENCES);
}

export function saveAppPreferences(preferences: AppPreferences): void {
  writeJson(APP_PREFERENCES_KEY, preferences);
  applyThemePreference(preferences.theme);
}

export function applyThemePreference(
  theme: AppPreferences['theme']
): void {
  const root = document.documentElement;
  const prefersDark =
    theme === 'dark' ||
    (theme === 'system' &&
      window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  root.classList.toggle('dark', Boolean(prefersDark));
}

export function initializeAppPreferences(): void {
  applyThemePreference(getAppPreferences().theme);
}