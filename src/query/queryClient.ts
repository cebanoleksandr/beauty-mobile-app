import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { ApiError } from '../api';

/** Don't retry errors a retry can't fix (4xx); retry network errors / 5xx once. */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
  return failureCount < 1;
}

type ErrorListener = (error: unknown) => void;
let globalErrorListener: ErrorListener | null = null;

/** Hook point for app-wide error UX (toast, logout on 401, …). */
export function setQueryErrorListener(listener: ErrorListener | null): void {
  globalErrorListener = listener;
}

/**
 * Single shared QueryClient. Lives outside React so non-component code
 * (auth bootstrap, the 401 handler) can read and seed the cache.
 */
export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: error => globalErrorListener?.(error) }),
  mutationCache: new MutationCache({ onError: error => globalErrorListener?.(error) }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: shouldRetry,
    },
    mutations: { retry: 0 },
  },
});
