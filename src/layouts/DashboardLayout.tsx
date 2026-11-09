import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar, Header } from '@/components/common';

// ─── Page title map ───────────────────────────────────────────────────────────
const PAGE_TITLES: Record<string, string> = {
  '/dashboard':                  'Overview',
  '/dashboard/products':         'Products',
  '/dashboard/products/add':     'Add Product',
  '/dashboard/shipments':        'Shipments',
  '/dashboard/inventory':        'Inventory',
  '/dashboard/blockchain':       'Blockchain Transactions',
  '/dashboard/qr-verification':  'QR Verification',
  '/dashboard/analytics':        'Analytics',
  '/dashboard/users':            'User Management',
  '/dashboard/settings':         'Settings',
  '/customer/history':           'Product History',
};

/**
 * DashboardLayout — authenticated shell with Sidebar + Header.
 * Sidebar collapses on mobile via state toggled by the Header hamburger.
 */
export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const pageTitle = PAGE_TITLES[location.pathname] ?? 'Dashboard';

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
