import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { GlobalSpinner } from '@/components/common';

/**
 * ProtectedRoute
 * Redirects unauthenticated users to /auth/login.
 * Preserves the intended destination in location state.
 */
export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <GlobalSpinner label="Authenticating…" />;

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
