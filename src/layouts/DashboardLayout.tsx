import { Suspense, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useLocation, useOutlet } from 'react-router-dom';
import { Sidebar, Header, RouteFallback } from '@/components/common';
import PageTransition from '@/components/motion/PageTransition';

// ─── Page title map ───────────────────────────────────────────────────────────
const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/products': 'Products',
  '/dashboard/products/add': 'Add Product',
  '/shipments': 'Shipments',
  '/shipments/create': 'Create Shipment',
  '/shipment-history': 'Shipment History',
  '/inventory': 'Inventory',
  '/warehouses': 'Warehouses',
  '/distributors': 'Distributors',
  '/ownership-transfers': 'Ownership Transfers',
  '/blockchain': 'Blockchain',
  '/blockchain/transactions': 'Blockchain Transactions',
  '/blockchain/verify': 'Verify Product',
  '/customer/history': 'Verification History',
  '/analytics': 'Analytics',
  '/users': 'User Management',
  '/settings': 'Settings',
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
 * Sidebar collapses on desktop and overlays on mobile.
 */
export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sc_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const location = useLocation();
  const outlet = useOutlet();
  const mainRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const pageTitle = resolvePageTitle(location.pathname);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname]);

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      const next = !current;
      try {
        localStorage.setItem('sc_sidebar_collapsed', String(next));
      } catch {
        // Best-effort UI preference.
      }
      return next;
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Branded route-change accent bar */}
      {!reduce && (
        <motion.div
          key={location.pathname}
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: 1, opacity: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none fixed inset-x-0 top-0 z-[110] h-0.5 origin-left gradient-accent"
          aria-hidden="true"
        />
      )}

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header
          pageTitle={pageTitle}
          onMenuClick={() => setSidebarOpen((prev) => !prev)}
        />
        <main
          ref={mainRef}
          id="main-content"
          className="flex-1 overflow-y-auto scrollbar-thin p-4 md:p-6 lg:p-8"
        >
          <Suspense fallback={<RouteFallback />}>
            <AnimatePresence mode="wait" initial={false}>
              <PageTransition
                key={location.pathname}
                className="mx-auto w-full max-w-[1600px]"
              >
                {outlet}
              </PageTransition>
            </AnimatePresence>
          </Suspense>
        </main>
      </div>
    </div>
  );
}