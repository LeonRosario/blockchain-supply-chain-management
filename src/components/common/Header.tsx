import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronDown,
  ChevronRight,
  Home,
  LogOut,
  Menu,
  QrCode,
  Settings as SettingsIcon,
} from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '@/hooks';

interface HeaderProps {
  onMenuClick: () => void;
  pageTitle?: string;
}

interface Crumb {
  label: string;
  to?: string;
}

const LABELS: Record<string, string> = {
  dashboard: 'Overview',
  products: 'Products',
  add: 'Add Product',
  edit: 'Edit Product',
  shipments: 'Shipments',
  create: 'Create Shipment',
  'shipment-history': 'Shipment History',
  inventory: 'Inventory',
  warehouses: 'Warehouses',
  distributors: 'Distributors',
  'ownership-transfers': 'Ownership Transfers',
  blockchain: 'Blockchain',
  transactions: 'Transactions',
  verify: 'Verify Product',
  analytics: 'Analytics',
  users: 'User Management',
  settings: 'Settings',
  customer: 'Customer',
  history: 'Verification History',
};

const DETAIL_PREFIXES = ['shp', 'prod', 'tx', 'wh', 'usr'];

function looksLikeId(segment: string): boolean {
  return (
    /^[0-9a-f]{6,}$/i.test(segment) ||
    /^\d+$/.test(segment) ||
    DETAIL_PREFIXES.some((prefix) => segment.toLowerCase().startsWith(prefix))
  );
}

function buildCrumbs(pathname: string): Crumb[] {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: Crumb[] = [{ label: 'Dashboard', to: '/dashboard' }];

  if (segments.length === 0) return crumbs;

  let accumulated = '';
  segments.forEach((segment, index) => {
    accumulated += `/${segment}`;
    if (segment === 'dashboard') return;

    const isLast = index === segments.length - 1;
    const previouslyEdit = segments[index - 1] === 'edit';

    if (looksLikeId(segment) && previouslyEdit) {
      crumbs[crumbs.length - 1] = { label: 'Edit Product' };
      return;
    }

    const label = looksLikeId(segment)
      ? 'Details'
      : (LABELS[segment] ?? segment.replace(/-/g, ' '));
    crumbs.push({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      ...(isLast ? {} : { to: accumulated }),
    });
  });

  if (segments.length === 0) crumbs.push({ label: 'Overview' });
  return crumbs;
}

/**
 * Dashboard top bar: mobile menu, breadcrumbs, theme toggle, and user menu.
 */
export default function Header({ onMenuClick, pageTitle }: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const crumbs = buildCrumbs(location.pathname);

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login', { replace: true });
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '??';

  const roleLabel = user?.role.replace(/_/g, ' ') ?? '';

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border/60 bg-background/75 px-4 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 md:px-6">
      {/* Hamburger (mobile) */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="shrink-0 rounded-full md:hidden"
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile page title */}
      {pageTitle && (
        <h1 className="truncate text-base font-semibold md:hidden">{pageTitle}</h1>
      )}

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1 md:flex">
        <Link
          to="/dashboard"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Dashboard home"
        >
          <Home className="h-4 w-4" />
        </Link>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <span key={`${crumb.label}-${index}`} className="flex min-w-0 items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" aria-hidden="true" />
              {crumb.to && !isLast ? (
                <Link
                  to={crumb.to}
                  className="truncate rounded px-1 py-0.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className="truncate px-1 py-0.5 text-sm font-semibold text-foreground"
                >
                  {crumb.label}
                </span>
              )}
            </span>
          );
        })}
      </nav>

      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
        <ThemeToggle />

        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full text-muted-foreground hover:text-foreground"
          aria-label="Notifications (not available in this demo)"
          title="Notifications are not available in this demo"
        >
          <Bell className="h-[18px] w-[18px]" />
        </Button>

        <div className="mx-1 hidden h-6 w-px bg-border/70 sm:block" aria-hidden="true" />

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 rounded-full border border-transparent p-1 pr-1.5 transition-colors hover:border-border/70 hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:rounded-xl sm:pr-2.5"
                aria-label="Open user menu"
              >
                <Avatar className="h-8 w-8 ring-2 ring-background">
                  <AvatarFallback className="gradient-accent text-[11px] font-bold text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden flex-col items-start lg:flex">
                  <span className="max-w-[140px] truncate text-sm font-medium leading-tight">
                    {user.name}
                  </span>
                  <span className="text-[10px] font-medium capitalize leading-tight text-muted-foreground">
                    {roleLabel}
                  </span>
                </span>
                <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground lg:block" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="normal-case tracking-normal">
                <p className="text-sm font-semibold text-foreground">{user.name}</p>
                <p className="mt-0.5 truncate text-xs font-normal text-muted-foreground">
                  {user.email}
                </p>
                <Badge variant="secondary" className="mt-2 capitalize">
                  {roleLabel}
                </Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => navigate('/settings')}>
                <SettingsIcon className="h-4 w-4 text-muted-foreground" />
                Account settings
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate('/blockchain/verify')}>
                <QrCode className="h-4 w-4 text-muted-foreground" />
                Verify a product
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => { void handleLogout(); }}
                className="text-danger focus:bg-danger/10 focus:text-danger"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}