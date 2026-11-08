import { useState, useCallback } from 'react';
import type { ApiError } from '@/types';

interface UseApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: ApiError | null;
}

/**
 * Generic hook for making API calls with loading/error state.
 * @param apiFn - The async service function to call
 */
export function useApi<T, A extends unknown[]>(
  apiFn: (...args: A) => Promise<T>
) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: A) => {
      setState({ data: null, isLoading: true, error: null });
      try {
        const result = await apiFn(...args);
        setState({ data: result, isLoading: false, error: null });
        return result;
      } catch (err: unknown) {
        const apiError = err as ApiError;
        setState({ data: null, isLoading: false, error: apiError });
        throw err;
      }
    },
    [apiFn]
  );

  return { ...state, execute };
}
