import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { GlobalSpinner } from '@/components/common';
import type { UserRole } from '@/types';

interface RoleRouteProps {
  /** Roles that are ALLOWED to access the child routes */
  allowedRoles: UserRole[];
  /** Where to send users who lack permission (default: /dashboard) */
  redirectTo?: string;
}

/**
 * RoleRoute
 * Extends ProtectedRoute with role-based access control.
 * Renders child routes only when the authenticated user holds
 * one of the allowedRoles; otherwise redirects.
 */
export default function RoleRoute({
  allowedRoles,
  redirectTo = '/dashboard',
}: RoleRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <GlobalSpinner label="Checking permissions…" />;

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}

