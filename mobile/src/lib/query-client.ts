import { QueryClient } from '@tanstack/react-query';

// Screens show cached data instantly and refresh it in the background,
// so switching tabs never waits on the network.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 24 * 60 * 60 * 1000,
      retry: 2,
    },
  },
});
