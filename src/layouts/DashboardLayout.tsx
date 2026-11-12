import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar, Header } from '@/components/common';

// ─── Page title map ───────────────────────────────────────────────────────────
const PAGE_TITLES: Record<string, string> = {
  '/dashboard':                 'Overview',
  '/dashboard/products':        'Products',
  '/dashboard/products/add':    'Add Product',
  '/shipments':                 'Shipments',
  '/shipments/create':          'Create Shipment',
  '/shipment-history':          'Shipment History',
  '/inventory':                 'Inventory',
  '/warehouses':                'Warehouses',
  '/distributors':              'Distributors',
  '/ownership-transfers':       'Ownership Transfers',
  '/blockchain':                'Blockchain',
  '/blockchain/transactions':   'Blockchain Transactions',
  '/blockchain/verify':         'Verify Product',
  '/customer/history':          'Verification History',
  '/analytics':                 'Analytics',
  '/users':                     'User Management',
  '/settings':                  'Settings',
};

function resolvePageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith('/dashboard/products/edit/')) return 'Edit Product';
  if (pathname.startsWith('/shipments/')) return 'Shipment Details';
  if (pathname.startsWith('/warehouses/')) return 'Warehouse Details';
  if (pathname.startsWith('/blockchain/transactions/')) return 'Transaction Details';
  return 'Dashboard';
}

/**
 * DashboardLayout — authenticated shell with Sidebar + Header.
 * Sidebar collapses on mobile via state toggled by the Header hamburger.
 */
export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const pageTitle = resolvePageTitle(location.pathname);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar (fixed on mobile, static on desktop) */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content column */}
      <div className="flex flex-1 flex-col overflow-hidden md:pl-0">
        <Header
          pageTitle={pageTitle}
          onMenuClick={() => setSidebarOpen((prev) => !prev)}
        />
        <main className="flex-1 overflow-y-auto scrollbar-thin p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}