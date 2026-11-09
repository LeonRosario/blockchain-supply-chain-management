import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { GlobalSpinner } from '@/components/common';

/**
 * PublicRoute
 * Wraps pages that should NOT be accessible when already logged in
 * (login, register). Redirects authenticated users to /dashboard.
 */
export default function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <GlobalSpinner />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
