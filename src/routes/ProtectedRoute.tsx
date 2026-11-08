import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks';

/**
 * Wraps private routes — redirects unauthenticated users to login.
 */
export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return null; // Replace with a global spinner when UI is built
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
