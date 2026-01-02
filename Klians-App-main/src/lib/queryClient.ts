import { QueryClient } from '@tanstack/react-query';

/**
 * QueryClient configuration for TanStack React Query
 * - staleTime: 5 minutes - data is considered fresh for 5 minutes
 * - gcTime (formerly cacheTime): 10 minutes - data stays in memory for 10 minutes after unmount
 * - retry: 1 - retry failed requests once
 * - refetchOnWindowFocus: true - refetch when window regains focus
 * - refetchOnReconnect: true - refetch when connection restored
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,   // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});
