import { useAuthContext } from '@/context/AuthContext';

/**
 * Primary hook for auth state and actions.
 * Wraps useAuthContext for a cleaner import path.
 */
export function useAuth() {
  return useAuthContext();
}
