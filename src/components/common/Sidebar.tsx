import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Truck,
  Warehouse,
  Link2,
  QrCode,
  BarChart3,
  Users,
  Settings,
  History,
  X,
  Package2,
  ShieldCheck,
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

const NAV_ITEMS: NavItem[] = [
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
  {
    label: 'Shipments',
    to: '/dashboard/shipments',
    icon: Truck,
    roles: ['admin', 'manufacturer', 'distributor', 'warehouse_manager', 'retailer'],
  },
  {
    label: 'Inventory',
    to: '/dashboard/inventory',
    icon: Warehouse,
    roles: ['admin', 'manufacturer', 'distributor', 'warehouse_manager', 'retailer'],
  },
  {
    label: 'Blockchain',
    to: '/dashboard/blockchain',
    icon: Link2,
    roles: ['admin', 'manufacturer', 'distributor'],
  },
  {
    label: 'QR Verification',
    to: '/dashboard/qr-verification',
    icon: QrCode,
  },
  {
    label: 'Analytics',
    to: '/dashboard/analytics',
    icon: BarChart3,
    roles: ['admin', 'manufacturer', 'distributor', 'warehouse_manager', 'retailer'],
  },
  {
    label: 'Product History',
    to: '/customer/history',
    icon: History,
    roles: ['customer'],
  },
  {
    label: 'User Management',
    to: '/dashboard/users',
    icon: Users,
    roles: ['admin'],
  },
  {
    label: 'Settings',
    to: '/dashboard/settings',
    icon: Settings,
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

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

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
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3 space-y-1">
          {visibleItems.map((item) => {
            const isActive =
              item.to === '/dashboard'
                ? location.pathname === '/dashboard'
                : location.pathname.startsWith(item.to);

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
                {item.label}
              </Link>
            );
          })}
        </nav>

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

