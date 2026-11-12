import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar, RouteFallback } from '@/components/common';

/**
 * MainLayout — wraps public-facing pages (Landing, verification, 404).
 */
export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main id="main-content" className="flex-1">
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}