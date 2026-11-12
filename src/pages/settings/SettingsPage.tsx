import { useEffect, useState } from 'react';
import {
  Bell,
  Check,
  DatabaseBackup,
  KeyRound,
  Loader2,
  Monitor,
  Moon,
  Palette,
  Save,
  Settings,
  ShieldAlert,
  Sun,
  UserRound,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@/components/ui';
import { useToast } from '@/components/ui';
import {
  ConfirmDialog,
  ErrorMessage,
  InfoField,
} from '@/components/common';
import userService from '@/services/user.service';
import {
  DEFAULT_APP_PREFERENCES,
  DEFAULT_NOTIFICATION_PREFERENCES,
  getAppPreferences,
  getNotificationPreferences,
  saveAppPreferences,
  saveNotificationPreferences,
} from '@/services/settings.service';
import { resetDemoDatabase } from '@/data/demoStore';
import { useAuth } from '@/hooks';
import type {
  AppPreferences,
  NotificationPreferences,
} from '@/types';
import { cn } from '@/utils';
import { errorMessage } from '@/services/serviceHelpers';

const THEME_OPTIONS: Array<{
  value: AppPreferences['theme'];
  label: string;
  icon: React.ElementType;
}> = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

const NOTIFICATION_OPTIONS: Array<{
  key: keyof NotificationPreferences;
  title: string;
  description: string;
}> = [
  {
    key: 'emailNotifications',
    title: 'Email notifications',
    description: 'Allow account and supply-chain notifications by email.',
  },
  {
    key: 'shipmentUpdates',
    title: 'Shipment updates',
    description: 'Notify when a shipment changes stage or delivery date.',
  },
  {
    key: 'blockchainEvents',
    title: 'Blockchain events',
    description: 'Notify about new transaction confirmations and failures.',
  },
  {
    key: 'inventoryAlerts',
    title: 'Low inventory alerts',
    description: 'Notify when available stock reaches its reorder level.',
  },
  {
    key: 'verificationAlerts',
    title: 'Verification activity',
    description: 'Notify when a product verification is requested or completed.',
  },
  {
    key: 'marketing',
    title: 'Product updates',
    description: 'Occasional messages about new platform features.',
  },
];

interface ToggleRowProps {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleRow({
  title,
  description,
  checked,
  disabled,
  onChange,
}: ToggleRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'bg-primary' : 'bg-muted-foreground/30'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-[22px]' : 'translate-x-0.5'
          )}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const toast = useToast();
  const { user, updateUser } = useAuth();

  // ── Profile ────────────────────────────────────────────────────────────────
  const [profileName, setProfileName] = useState(user?.name ?? '');
  const [profileEmail, setProfileEmail] = useState(user?.email ?? '');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileDepartment, setProfileDepartment] = useState('');
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // ── Password ───────────────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // ── Preferences ────────────────────────────────────────────────────────────
  const [appPreferences, setAppPreferences] =
    useState<AppPreferences>(DEFAULT_APP_PREFERENCES);
  const [notificationPreferences, setNotificationPreferences] =
    useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);

  useEffect(() => {
    setProfileName(user?.name ?? '');
    setProfileEmail(user?.email ?? '');
  }, [user?.id, user?.name, user?.email]);

  useEffect(() => {
    setAppPreferences(getAppPreferences());
    setNotificationPreferences(getNotificationPreferences());
  }, []);

  // Fetch the full profile record so optional fields (phone/department) are
  // available. Failures are non-blocking; the visible fields simply stay blank.
  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    let active = true;
    userService
      .getById(userId)
      .then((response) => {
        if (!active) return;
        setProfilePhone(response.data.phone ?? '');
        setProfileDepartment(response.data.department ?? '');
      })
      .catch(() => {
        // Optional profile details could not be loaded.
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setProfileError(null);
    const errors: Record<string, string> = {};
    if (!profileName.trim()) {
      errors.name = 'Name is required.';
    } else if (profileName.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters.';
    }
    if (!profileEmail.trim()) {
      errors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileEmail.trim())) {
      errors.email = 'Enter a valid email address.';
    }
    if (profilePhone.trim() && profilePhone.trim().length < 6) {
      errors.phone = 'Enter a valid phone number or leave this blank.';
    }
    setProfileErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSavingProfile(true);
    try {
      const response = await userService.updateProfile({
        name: profileName.trim(),
        email: profileEmail.trim(),
        phone: profilePhone.trim() || undefined,
        department: profileDepartment.trim() || undefined,
        currentEmail: user?.email,
      });
      if (response.source === 'demo') {
        toast.warning(
          'Profile saved to demo preferences only',
          'The backend was not updated. Your current session reflects the change for this browser only.'
        );
      } else {
        toast.success('Profile updated', response.message);
      }
      updateUser({
        name: response.data.name ?? profileName.trim(),
        email: response.data.email ?? profileEmail.trim(),
      });
    } catch (saveError) {
      setProfileError(errorMessage(saveError, 'Unable to update your profile.'));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError(null);
    const errors: Record<string, string> = {};
    if (!currentPassword) {
      errors.currentPassword = 'Enter your current password.';
    }
    if (!newPassword) {
      errors.newPassword = 'Enter a new password.';
    } else if (newPassword.length < 8) {
      errors.newPassword = 'New password must be at least 8 characters.';
    } else if (newPassword === currentPassword) {
      errors.newPassword = 'New password must be different from the current password.';
    }
    if (!confirmPassword) {
      errors.confirmPassword = 'Confirm the new password.';
    } else if (confirmPassword !== newPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }
    setPasswordErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsChangingPassword(true);
    try {
      const response = await userService.changePassword(currentPassword, newPassword);
      if (response.source === 'demo' || !response.data.applied) {
        toast.warning(
          'Password was not changed',
          'No backend password service is connected. Your demo session remains unchanged.'
        );
      } else {
        toast.success('Password changed', 'Use your new password the next time you sign in.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (changeError) {
      setPasswordError(errorMessage(changeError, 'Unable to change the password.'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const chooseTheme = (theme: AppPreferences['theme']) => {
    const next = { ...appPreferences, theme };
    setAppPreferences(next);
    saveAppPreferences(next);
  };

  const savePreferences = () => {
    setIsSavingPreferences(true);
    try {
      saveAppPreferences(appPreferences);
      toast.success('Display preferences saved', 'Theme and formatting settings were applied.');
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const saveNotifications = () => {
    setIsSavingNotifications(true);
    try {
      saveNotificationPreferences(notificationPreferences);
      toast.success(
        'Notification preferences saved',
        'These preferences are stored in this browser only.'
      );
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const resetDemoData = () => {
    resetDemoDatabase();
    setIsResetOpen(false);
    toast.success(
      'Demo database reset',
      'Local demo records were restored. Real backend data was not changed.'
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your profile, security, and application preferences.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="h-5 w-5" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveProfile} className="space-y-4">
                {profileError && <ErrorMessage message={profileError} />}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="settings-name">Full name *</Label>
                    <Input
                      id="settings-name"
                      value={profileName}
                      onChange={(event) => setProfileName(event.target.value)}
                      disabled={isSavingProfile}
                    />
                    {profileErrors.name && (
                      <p className="text-xs text-destructive">{profileErrors.name}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="settings-email">Email *</Label>
                    <Input
                      id="settings-email"
                      type="email"
                      value={profileEmail}
                      onChange={(event) => setProfileEmail(event.target.value)}
                      disabled={isSavingProfile}
                    />
                    {profileErrors.email && (
                      <p className="text-xs text-destructive">{profileErrors.email}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="settings-phone">Phone</Label>
                    <Input
                      id="settings-phone"
                      value={profilePhone}
                      onChange={(event) => setProfilePhone(event.target.value)}
                      placeholder="Optional contact number"
                      disabled={isSavingProfile}
                    />
                    {profileErrors.phone && (
                      <p className="text-xs text-destructive">{profileErrors.phone}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="settings-department">Department</Label>
                    <Input
                      id="settings-department"
                      value={profileDepartment}
                      onChange={(event) => setProfileDepartment(event.target.value)}
                      placeholder="Optional team or department"
                      disabled={isSavingProfile}
                    />
                  </div>
                </div>

                <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
                  Profile changes are saved through the user service. If no backend is
                  connected, changes are persisted locally for this browser and the page
                  will label the result as demo-only.
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSavingProfile}>
                    {isSavingProfile ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save profile
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5" />
                Password
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={changePassword} className="space-y-4">
                {passwordError && <ErrorMessage message={passwordError} />}

                <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    Password changes require a live authentication backend. In demo
                    mode the request is not applied and the app will explicitly report
                    that the password was not changed.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="settings-current-password">Current password *</Label>
                  <Input
                    id="settings-current-password"
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    disabled={isChangingPassword}
                  />
                  {passwordErrors.currentPassword && (
                    <p className="text-xs text-destructive">
                      {passwordErrors.currentPassword}
                    </p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="settings-new-password">New password *</Label>
                    <Input
                      id="settings-new-password"
                      type="password"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      disabled={isChangingPassword}
                    />
                    {passwordErrors.newPassword && (
                      <p className="text-xs text-destructive">
                        {passwordErrors.newPassword}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="settings-confirm-password">
                      Confirm new password *
                    </Label>
                    <Input
                      id="settings-confirm-password"
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      disabled={isChangingPassword}
                    />
                    {passwordErrors.confirmPassword && (
                      <p className="text-xs text-destructive">
                        {passwordErrors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" variant="outline" disabled={isChangingPassword}>
                    {isChangingPassword ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <KeyRound className="mr-2 h-4 w-4" />
                    )}
                    Change password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                These preferences are stored locally in this browser. No email or push
                delivery service is connected in demo mode.
              </p>
              {NOTIFICATION_OPTIONS.map((option) => (
                <ToggleRow
                  key={option.key}
                  title={option.title}
                  description={option.description}
                  checked={notificationPreferences[option.key]}
                  disabled={isSavingNotifications}
                  onChange={(checked) =>
                    setNotificationPreferences((current) => ({
                      ...current,
                      [option.key]: checked,
                    }))
                  }
                />
              ))}
              <div className="flex justify-end border-t pt-4">
                <Button onClick={saveNotifications} disabled={isSavingNotifications}>
                  <Save className="mr-2 h-4 w-4" />
                  Save notifications
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="mb-2 text-sm font-medium">Theme</p>
                <div className="grid grid-cols-3 gap-2">
                  {THEME_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const active = appPreferences.theme === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => chooseTheme(option.value)}
                        className={cn(
                          'flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs font-medium transition-colors',
                          active
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'hover:bg-muted'
                        )}
                        aria-pressed={active}
                      >
                        <Icon className="h-4 w-4" />
                        {option.label}
                        {active && <Check className="h-3 w-3" />}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Theme changes apply immediately and are saved in this browser.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="settings-language">Language</Label>
                <select
                  id="settings-language"
                  value={appPreferences.language}
                  onChange={(event) =>
                    setAppPreferences((current) => ({
                      ...current,
                      language: event.target.value,
                    }))
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="en-US">English (United States)</option>
                  <option value="en-GB">English (United Kingdom)</option>
                  <option value="es-ES">Español</option>
                  <option value="fr-FR">Français</option>
                  <option value="de-DE">Deutsch</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="settings-timezone">Timezone</Label>
                <Input
                  id="settings-timezone"
                  value={appPreferences.timezone}
                  onChange={(event) =>
                    setAppPreferences((current) => ({
                      ...current,
                      timezone: event.target.value,
                    }))
                  }
                />
              </div>

              <ToggleRow
                title="Compact tables"
                description="Reduce table row spacing on smaller screens."
                checked={appPreferences.compactTables}
                onChange={(checked) =>
                  setAppPreferences((current) => ({
                    ...current,
                    compactTables: checked,
                  }))
                }
              />

              <Button
                className="w-full"
                onClick={savePreferences}
                disabled={isSavingPreferences}
              >
                <Save className="mr-2 h-4 w-4" />
                Save preferences
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Environment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoField
                label="API base URL"
                value={
                  (import.meta.env.VITE_API_BASE_URL as string | undefined) || '/api'
                }
                valueClassName="font-mono text-xs"
              />
              <InfoField
                label="Data mode"
                value="API-first with local demo fallback. Any demo record is labelled in the UI."
                valueClassName="font-normal"
              />
              <InfoField
                label="Backend status"
                value="Not verified on this page. Failed requests fall back to the demo database; verification results never fall back."
                valueClassName="font-normal"
              />
            </CardContent>
          </Card>

          <Card className="border-amber-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <DatabaseBackup className="h-5 w-5" />
                Local demo data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Reset the local demo database to its original sample records. This does
                not change any real backend or on-chain data.
              </p>
              <Button
                variant="outline"
                className="w-full border-amber-300 text-amber-900 hover:bg-amber-50"
                onClick={() => setIsResetOpen(true)}
              >
                Reset demo database
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isResetOpen}
        title="Reset local demo data?"
        description="All local sample shipments, inventory, warehouses, distributors, ownership records, users, and transactions will be restored to their original demo values. This cannot be undone."
        confirmLabel="Reset demo data"
        variant="warning"
        onConfirm={resetDemoData}
        onClose={() => setIsResetOpen(false)}
      />
    </div>
  );
}