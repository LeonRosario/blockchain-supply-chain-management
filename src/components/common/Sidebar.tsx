import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutGroup, motion } from 'motion/react';
import {
  BadgeCheck,
  BarChart3,
  Building2,
  ClipboardList,
  History,
  LayoutDashboard,
  Link2,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  QrCode,
  Repeat2,
  Settings,
  ShieldCheck,
  Truck,
  Users,
  Warehouse,
  X,
} from 'lucide-react';
import { cn } from '@/utils';
import { useAuth } from '@/hooks';
import type { UserRole } from '@/types';

// ─── Nav item definition ──────────────────────────────────────────────────────
interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
  roles?: UserRole[]; // undefined = all roles
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
      {
        label: 'Products',
        to: '/dashboard/products',
        icon: Package,
        roles: ['admin', 'manufacturer', 'distributor', 'warehouse_manager', 'retailer'],
      },
    ],
  },
  {
    label: 'Operations',
    items: [
      {
        label: 'Shipments',
        to: '/shipments',
        icon: Truck,
        roles: ['admin', 'manufacturer', 'distributor', 'warehouse_manager', 'retailer'],
      },
      {
        label: 'Shipment History',
        to: '/shipment-history',
        icon: ClipboardList,
        roles: ['admin', 'manufacturer', 'distributor', 'warehouse_manager', 'retailer'],
      },
      {
        label: 'Inventory',
        to: '/inventory',
        icon: Warehouse,
        roles: ['admin', 'manufacturer', 'distributor', 'warehouse_manager', 'retailer'],
      },
      {
        label: 'Warehouses',
        to: '/warehouses',
        icon: Building2,
        roles: ['admin', 'manufacturer', 'distributor', 'warehouse_manager', 'retailer'],
      },
      {
        label: 'Distributors',
        to: '/distributors',
        icon: Truck,
        roles: ['admin', 'manufacturer', 'distributor', 'warehouse_manager', 'retailer'],
      },
      {
        label: 'Ownership Transfers',
        to: '/ownership-transfers',
        icon: Repeat2,
        roles: ['admin', 'manufacturer', 'distributor', 'warehouse_manager', 'retailer'],
      },
    ],
  },
  {
    label: 'Trust & insight',
    items: [
      {
        label: 'Blockchain',
        to: '/blockchain',
        icon: Link2,
        roles: ['admin', 'manufacturer', 'distributor'],
      },
      { label: 'Verify Product', to: '/blockchain/verify', icon: QrCode },
      { label: 'Verification History', to: '/customer/history', icon: History },
      {
        label: 'Analytics',
        to: '/analytics',
        icon: BarChart3,
        roles: ['admin', 'manufacturer', 'distributor', 'warehouse_manager', 'retailer'],
      },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'User Management', to: '/users', icon: Users, roles: ['admin'] },
      { label: 'Settings', to: '/settings', icon: Settings },
    ],
  },
];

// ─── Props ────────────────────────────────────────────────────────────────────
interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export default function Sidebar({
  isOpen,
  onClose,
  collapsed,
  onToggleCollapsed,
}: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !item.roles || (user && item.roles.includes(user.role))
    ),
  })).filter((group) => group.items.length > 0);

  // Highlight the most specific matching nav item, so nested routes such as
  // /blockchain/verify do not also mark /blockchain as active.
  const activePath = visibleGroups
    .flatMap((group) => group.items)
    .filter(
      (item) =>
        location.pathname === item.to ||
        location.pathname.startsWith(`${item.to}/`)
    )
    .sort((a, b) => b.to.length - a.to.length)[0]?.to;

  const roleLabel = user?.role.replace(/_/g, ' ') ?? '';

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        aria-label="Sidebar"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[var(--sidebar-width)] flex-col overflow-hidden',
          'bg-[hsl(var(--sidebar-bg))] text-[hsl(var(--sidebar-fg))]',
          'border-r border-white/10 transition-[width,transform] duration-300 ease-out',
          'md:static md:z-auto md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          collapsed
            ? 'md:w-[var(--sidebar-collapsed-width)]'
            : 'md:w-[var(--sidebar-width)]'
        )}
      >
        {/* Ambient glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-28 h-64 w-64 rounded-full bg-primary/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -right-20 h-56 w-56 rounded-full bg-teal-400/10 blur-3xl"
        />

        {/* Logo row */}
        <div className="relative flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-4">
          <Link
            to="/dashboard"
            className={cn(
              'flex items-center gap-2.5 font-bold tracking-tight',
              collapsed && 'md:mx-auto'
            )}
            onClick={onClose}
            aria-label="SupplyChain dashboard"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl gradient-accent text-white shadow-glow">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span className={cn('text-[17px]', collapsed && 'md:hidden')}>
              SupplyChain
            </span>
          </Link>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white md:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav
          aria-label="Main navigation"
          className="relative flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin px-3 py-5"
        >
          <LayoutGroup id="sidebar-nav">
            <div className={cn('space-y-6', collapsed && 'md:space-y-4')}>
              {visibleGroups.map((group) => (
                <div key={group.label}>
                  <p
                    className={cn(
                      'mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--sidebar-muted))]',
                      collapsed && 'md:hidden'
                    )}
                  >
                    {group.label}
                  </p>
                  {collapsed && (
                    <div
                      aria-hidden="true"
                      className="mx-auto mb-3 hidden h-px w-6 bg-white/10 md:block"
                    />
                  )}
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const isActive = activePath === item.to;
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={onClose}
                          aria-current={isActive ? 'page' : undefined}
                          title={collapsed ? item.label : undefined}
                          className={cn(
                            'group/nav relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--sidebar-bg))]',
                            isActive
                              ? 'text-white'
                              : 'text-[hsl(var(--sidebar-fg)/0.78)] hover:bg-[hsl(var(--sidebar-hover-bg))] hover:text-[hsl(var(--sidebar-fg))]',
                            collapsed && 'md:justify-center md:px-0'
                          )}
                        >
                          {isActive && (
                            <motion.span
                              layoutId="sidebar-active-pill"
                              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                              className="absolute inset-0 rounded-xl gradient-accent shadow-[0_10px_28px_-10px_hsl(var(--primary)/0.9)]"
                              aria-hidden="true"
                            />
                          )}
                          <item.icon
                            className={cn(
                              'relative z-10 h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover/nav:scale-110',
                              isActive && 'drop-shadow-sm'
                            )}
                          />
                          <span
                            className={cn(
                              'relative z-10 truncate',
                              collapsed && 'md:hidden'
                            )}
                          >
                            {item.label}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </LayoutGroup>
        </nav>

        {/* Collapse toggle (desktop) */}
        <div className="relative hidden shrink-0 border-t border-white/10 px-3 py-2 md:block">
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[hsl(var(--sidebar-muted))] transition-colors hover:bg-[hsl(var(--sidebar-hover-bg))] hover:text-[hsl(var(--sidebar-fg))]',
              collapsed && 'justify-center px-0'
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4 shrink-0" />
            ) : (
              <PanelLeftClose className="h-4 w-4 shrink-0" />
            )}
            <span className={cn(collapsed && 'hidden')}>Collapse sidebar</span>
          </button>
        </div>

        {/* Public verification shortcut */}
        <div className="relative shrink-0 border-t border-white/10 px-3 py-3">
          <Link
            to="/verify"
            title={collapsed ? 'Public verification page' : undefined}
            className={cn(
              'flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-[hsl(var(--sidebar-muted))] transition-colors hover:bg-[hsl(var(--sidebar-hover-bg))] hover:text-[hsl(var(--sidebar-fg))]',
              collapsed && 'justify-center px-0'
            )}
          >
            <BadgeCheck className="h-4 w-4 shrink-0" />
            <span className={cn('truncate', collapsed && 'md:hidden')}>
              Public verification page
            </span>
          </Link>
        </div>

        {/* User chip at bottom */}
        {user && (
          <div
            className={cn(
              'relative shrink-0 border-t border-white/10 px-3 py-3',
              collapsed && 'md:px-2'
            )}
          >
            <div
              className={cn(
                'flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-2',
                collapsed && 'md:justify-center md:border-transparent md:bg-transparent md:px-0'
              )}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-teal-500 text-xs font-bold text-white ring-2 ring-white/10">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className={cn('min-w-0 flex-1', collapsed && 'md:hidden')}>
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="truncate text-[11px] capitalize text-[hsl(var(--sidebar-muted))]">
                  {roleLabel}
                </p>
              </div>
              <span
                className={cn(
                  'h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]',
                  collapsed && 'md:hidden'
                )}
                title="Session active"
              />
            </div>
          </div>
        )}
      </aside>
    </>
  );
}