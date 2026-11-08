import { useAuthContext } from '@/context/AuthContext';

/**
 * Convenience hook for accessing the auth context.
 * Provides current user state and auth actions.
 */
export function useAuth() {
  return useAuthContext();
}
