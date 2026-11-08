import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks';

/**
 * Wraps public-only routes (login, register).
 * Redirects authenticated users to the dashboard.
 */
export default function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
