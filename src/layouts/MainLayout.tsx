import { Outlet } from 'react-router-dom';
import { Navbar } from '@/components/common';

/**
 * MainLayout — wraps public-facing pages (Landing, etc.)
 * Contains: Navbar + main content area.
 */
export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
