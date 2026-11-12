import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Edit3,
  Mail,
  Phone,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  UserCheck,
  UserCog,
  UserRound,
  Users,
  UserX,
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
  DemoDataBanner,
  EmptyState,
  ErrorMessage,
  Modal,
  Pagination,
  SearchInput,
  StatusBadge,
  TableSkeleton,
} from '@/components/common';
import { StatsCard } from '@/components/dashboard';
import userService from '@/services/user.service';
import { useAuth } from '@/hooks';
import type {
  UpdateUserPayload,
  UserRecord,
  UserRole,
  UserStatus,
} from '@/types';
import { USER_ROLES } from '@/types';
import {
  formatDateTime,
  getUserStatusMeta,
  titleCase,
} from '@/utils';
import { errorMessage } from '@/services/serviceHelpers';

const USER_STATUSES: UserStatus[] = ['active', 'inactive', 'suspended'];

const ROLE_TONES: Record<UserRole, 'info' | 'purple' | 'success' | 'warning' | 'neutral' | 'danger'> = {
  admin: 'danger',
  manufacturer: 'info',
  distributor: 'purple',
  warehouse_manager: 'success',
  retailer: 'warning',
  customer: 'neutral',
};

interface EditFormState {
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  phone: string;
  department: string;
}

const EMPTY_EDIT_FORM: EditFormState = {
  name: '',
  email: '',
  role: 'customer',
  status: 'active',
  phone: '',
  department: '',
};

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function UserManagementPage() {
  const toast = useToast();
  const { user: currentUser, updateUser } = useAuth();

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [source, setSource] = useState<'api' | 'demo'>('demo');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [role, setRole] = useState<UserRole | 'all'>('all');
  const [status, setStatus] = useState<UserStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [editing, setEditing] = useState<UserRecord | null>(null);
  const [form, setForm] = useState<EditFormState>(EMPTY_EDIT_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await userService.getAll();
      setUsers(response.data);
      setSource(response.source);
    } catch (loadError) {
      setError(errorMessage(loadError, 'Unable to load users.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((record) => {
      if (role !== 'all' && record.role !== role) return false;
      if (status !== 'all' && record.status !== status) return false;
      if (query) {
        const haystack = [
          record.name,
          record.email,
          record.role,
          record.department,
          record.phone,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [users, search, role, status]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / limit));
  const currentPage = Math.min(page, totalPages);
  const visibleUsers = filteredUsers.slice(
    (currentPage - 1) * limit,
    currentPage * limit
  );

  const stats = useMemo(
    () => ({
      total: users.length,
      active: users.filter((record) => record.status === 'active').length,
      suspended: users.filter((record) => record.status === 'suspended').length,
      admins: users.filter((record) => record.role === 'admin').length,
    }),
    [users]
  );

  const isCurrentUserRecord = (record: UserRecord) =>
    Boolean(
      currentUser &&
        (currentUser.id === record.id ||
          currentUser.email.toLowerCase() === record.email.toLowerCase())
    );

  const resetFilters = () => {
    setSearch('');
    setRole('all');
    setStatus('all');
    setPage(1);
  };

  const openEdit = (record: UserRecord) => {
    setEditing(record);
    setForm({
      name: record.name,
      email: record.email,
      role: record.role,
      status: record.status,
      phone: record.phone ?? '',
      department: record.department ?? '',
    });
    setFormErrors({});
    setFormError(null);
  };

  const closeEdit = () => {
    if (isSaving) return;
    setEditing(null);
    setForm(EMPTY_EDIT_FORM);
    setFormErrors({});
    setFormError(null);
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) {
      errors.name = 'Name is required.';
    } else if (form.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters.';
    }
    if (!form.email.trim()) {
      errors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = 'Enter a valid email address.';
    } else if (
      users.some(
        (record) =>
          record.id !== editing?.id &&
          record.email.toLowerCase() === form.email.trim().toLowerCase()
      )
    ) {
      errors.email = 'Another user already uses this email address.';
    }
    if (form.phone.trim() && form.phone.trim().length < 6) {
      errors.phone = 'Enter a valid phone number or leave this blank.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    setFormError(null);
    if (!validate()) return;

    const payload: UpdateUserPayload = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      status: form.status,
      phone: form.phone.trim() || undefined,
      department: form.department.trim() || undefined,
    };

    const editingSelf = isCurrentUserRecord(editing);

    setIsSaving(true);
    try {
      const response = await userService.update(editing.id, payload);
      if (response.source === 'demo') {
        toast.warning(
          'User updated in demo mode',
          'The local demo database was updated. No backend account was changed.'
        );
      } else {
        toast.success('User updated', `${response.data.name} was saved.`);
      }

      if (editingSelf) {
        updateUser({
          name: response.data.name,
          email: response.data.email,
          role: response.data.role,
        });
      }

      setEditing(null);
      setForm(EMPTY_EDIT_FORM);
      await load();
    } catch (saveError) {
      setFormError(errorMessage(saveError, 'Unable to update the user.'));
    } finally {
      setIsSaving(false);
    }
  };

  const editingSelf = editing ? isCurrentUserRecord(editing) : false;
  const roleWillChange = editingSelf && editing ? form.role !== editing.role : false;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="mt-1 text-muted-foreground">
            Review accounts, assign roles, and manage access status.
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh users
        </Button>
      </div>

      {source === 'demo' && (
        <DemoDataBanner
          title="Demo user directory"
          message="The user API is unavailable. Accounts below are local sample records. Role and status changes are saved to the demo database only and do not modify real accounts."
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Total accounts"
          value={stats.total}
          icon={Users}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatsCard
          title="Active accounts"
          value={stats.active}
          icon={UserCheck}
          iconColor="text-green-600"
          bgColor="bg-green-50"
        />
        <StatsCard
          title="Suspended accounts"
          value={stats.suspended}
          icon={UserX}
          iconColor="text-red-600"
          bgColor="bg-red-50"
        />
        <StatsCard
          title="Administrators"
          value={stats.admins}
          icon={ShieldCheck}
          iconColor="text-violet-600"
          bgColor="bg-violet-50"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Accounts
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset filters
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
            <SearchInput
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Search name, email, role, or department…"
              ariaLabel="Search users"
            />
            <select
              value={role}
              onChange={(event) => {
                setRole(event.target.value as UserRole | 'all');
                setPage(1);
              }}
              className="h-9 rounded-md border bg-background px-3 text-sm"
              aria-label="Filter users by role"
            >
              <option value="all">All roles</option>
              {USER_ROLES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as UserStatus | 'all');
                setPage(1);
              }}
              className="h-9 rounded-md border bg-background px-3 text-sm"
              aria-label="Filter users by status"
            >
              <option value="all">All statuses</option>
              {USER_STATUSES.map((option) => (
                <option key={option} value={option}>
                  {getUserStatusMeta(option).label}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="mb-4 space-y-2">
              <ErrorMessage message={error} />
              <Button variant="outline" size="sm" onClick={load}>
                Try again
              </Button>
            </div>
          )}

          {isLoading ? (
            <TableSkeleton rows={7} columns={6} />
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No users found"
              description={
                search || role !== 'all' || status !== 'all'
                  ? 'No accounts match the current filters.'
                  : 'User accounts will appear here after they are registered.'
              }
              action={
                search || role !== 'all' || status !== 'all' ? (
                  <Button variant="outline" onClick={resetFilters}>
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-3 font-medium">User</th>
                    <th className="px-3 py-3 font-medium">Role</th>
                    <th className="px-3 py-3 font-medium">Department</th>
                    <th className="px-3 py-3 font-medium">Contact</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium">Last login</th>
                    <th className="px-3 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {visibleUsers.map((record) => {
                    const statusMeta = getUserStatusMeta(record.status);
                    const isSelf = isCurrentUserRecord(record);
                    return (
                      <tr key={record.id} className="hover:bg-muted/40">
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                              {initials(record.name) || <UserRound className="h-4 w-4" />}
                            </div>
                            <div className="min-w-0">
                              <p className="flex items-center gap-2 font-medium">
                                <span className="truncate">{record.name}</span>
                                {isSelf && (
                                  <StatusBadge label="You" tone="info" />
                                )}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {record.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <StatusBadge
                            label={titleCase(record.role)}
                            tone={ROLE_TONES[record.role] ?? 'neutral'}
                          />
                        </td>
                        <td className="px-3 py-3">
                          {record.department ?? '—'}
                        </td>
                        <td className="px-3 py-3">
                          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail className="h-3.5 w-3.5" />
                            {record.email}
                          </p>
                          {record.phone && (
                            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Phone className="h-3.5 w-3.5" />
                              {record.phone}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <StatusBadge
                            label={statusMeta.label}
                            tone={statusMeta.tone}
                            dot
                          />
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-xs text-muted-foreground">
                          {record.lastLoginAt
                            ? formatDateTime(record.lastLoginAt)
                            : 'Never signed in'}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEdit(record)}
                          >
                            <Edit3 className="mr-1 h-3.5 w-3.5" />
                            Edit
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && filteredUsers.length > 0 && (
            <div className="mt-4">
              <Pagination
                page={currentPage}
                totalPages={totalPages}
                total={filteredUsers.length}
                limit={limit}
                onPageChange={setPage}
                onLimitChange={(value) => {
                  setLimit(value);
                  setPage(1);
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={Boolean(editing)}
        title="Edit user"
        description={
          editing
            ? `Update account details for ${editing.name}.`
            : undefined
        }
        size="md"
        onClose={closeEdit}
      >
        {editing && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && <ErrorMessage message={formError} />}

            {editingSelf && (
              <p className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
                You are editing your own account. Name, email, and role changes are
                applied to your current session immediately.
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="user-name">Full name *</Label>
                <Input
                  id="user-name"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  disabled={isSaving}
                />
                {formErrors.name && (
                  <p className="text-xs text-destructive">{formErrors.name}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="user-email">Email *</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, email: event.target.value }))
                  }
                  disabled={isSaving}
                />
                {formErrors.email && (
                  <p className="text-xs text-destructive">{formErrors.email}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="user-role">Role *</Label>
                <select
                  id="user-role"
                  value={form.role}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      role: event.target.value as UserRole,
                    }))
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  disabled={isSaving}
                >
                  {USER_ROLES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="user-status">Account status *</Label>
                <select
                  id="user-status"
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value as UserStatus,
                    }))
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  disabled={isSaving}
                >
                  {USER_STATUSES.map((option) => (
                    <option key={option} value={option}>
                      {getUserStatusMeta(option).label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="user-phone">Phone</Label>
                <Input
                  id="user-phone"
                  value={form.phone}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, phone: event.target.value }))
                  }
                  disabled={isSaving}
                />
                {formErrors.phone && (
                  <p className="text-xs text-destructive">{formErrors.phone}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="user-department">Department</Label>
                <Input
                  id="user-department"
                  value={form.department}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      department: event.target.value,
                    }))
                  }
                  disabled={isSaving}
                />
              </div>
            </div>

            {roleWillChange && (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                Changing your own role may remove access to administrator pages. Make
                sure another administrator can restore access if needed.
              </p>
            )}

            {source === 'demo' && (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                Demo mode: this change is stored in the local demo database only. It does
                not modify a real account or send a verification transaction.
              </p>
            )}

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={closeEdit}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}