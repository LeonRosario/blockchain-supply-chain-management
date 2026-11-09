import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type {
  AuthUser,
  LoginCredentials,
  RegisterCredentials,
  UserRole,
} from '@/types';
import { authService } from '@/services';

// ─── Context shape ────────────────────────────────────────────────────────────
interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (payload: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Rehydrate session from localStorage on mount
  useEffect(() => {
    const rehydrate = async () => {
      const token = localStorage.getItem('sc_token');
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const response = await authService.getProfile();
        setUser(response.data);
      } catch {
        localStorage.removeItem('sc_token');
      } finally {
        setIsLoading(false);
      }
    };
    rehydrate();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await authService.login(credentials);
    localStorage.setItem('sc_token', response.data.token);
    setUser(response.data);
  }, []);

  const register = useCallback(async (payload: RegisterCredentials) => {
    const response = await authService.register(payload);
    localStorage.setItem('sc_token', response.data.token);
    setUser(response.data);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      localStorage.removeItem('sc_token');
      setUser(null);
    }
  }, []);

  /** True if the authenticated user has the given role(s) */
  const hasRole = useCallback(
    (role: UserRole | UserRole[]) => {
      if (!user) return false;
      const roles = Array.isArray(role) ? role : [role];
      return roles.includes(user.role);
    },
    [user]
  );

  /** True if the authenticated user has at least one of the given roles */
  const hasAnyRole = useCallback(
    (roles: UserRole[]) => {
      if (!user) return false;
      return roles.some((r) => r === user.role);
    },
    [user]
  );

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    hasRole,
    hasAnyRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Consumer hook ────────────────────────────────────────────────────────────
export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used within an <AuthProvider>');
  }
  return ctx;
}

export default AuthContext;
