import { Link, useLocation } from 'react-router-dom';
import {
  BadgeCheck,
  BarChart3,
  Building2,
  ClipboardList,
  History,
  LayoutDashboard,
  Link2,
  Package,
  Package2,
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
      {
        label: 'Overview',
        to: '/dashboard',
        icon: LayoutDashboard,
      },
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
      {
        label: 'Verify Product',
        to: '/blockchain/verify',
        icon: QrCode,
      },
      {
        label: 'Verification History',
        to: '/customer/history',
        icon: History,
      },
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
      {
        label: 'User Management',
        to: '/users',
        icon: Users,
        roles: ['admin'],
      },
      {
        label: 'Settings',
        to: '/settings',
        icon: Settings,
      },
    ],
  },
];

// ─── Props ────────────────────────────────────────────────────────────────────
interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();

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

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[var(--sidebar-width)] flex-col',
          'bg-[hsl(var(--sidebar-bg))] text-[hsl(var(--sidebar-fg))]',
          'transition-transform duration-300 md:translate-x-0 md:static md:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo row */}
        <div className="flex h-16 shrink-0 items-center justify-between px-5 border-b border-white/10">
          <Link to="/dashboard" className="flex items-center gap-2 font-bold text-lg" onClick={onClose}>
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span>SupplyChain</span>
          </Link>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-white/10 md:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-5">
          {visibleGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--sidebar-muted))]">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = activePath === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-[hsl(var(--sidebar-active-bg))] text-[hsl(var(--sidebar-active-fg))]'
                          : 'text-[hsl(var(--sidebar-fg))] hover:bg-[hsl(var(--sidebar-hover-bg))]'
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Public verification shortcut */}
        <div className="shrink-0 border-t border-white/10 px-4 py-3">
          <Link
            to="/verify"
            className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-[hsl(var(--sidebar-muted))] transition-colors hover:bg-[hsl(var(--sidebar-hover-bg))] hover:text-[hsl(var(--sidebar-fg))]"
          >
            <BadgeCheck className="h-4 w-4 shrink-0" />
            Public verification page
          </Link>
        </div>

        {/* User chip at bottom */}
        {user && (
          <div className="shrink-0 border-t border-white/10 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="truncate text-xs text-[hsl(var(--sidebar-muted))] capitalize">
                  {user.role.replace('_', ' ')}
                </p>
              </div>
              <Package2 className="h-4 w-4 shrink-0 text-[hsl(var(--sidebar-muted))]" />
            </div>
          </div>
        )}
      </aside>
    </>
  );
}