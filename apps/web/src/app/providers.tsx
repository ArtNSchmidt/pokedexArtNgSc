import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { isRetryableError } from '../shared/api/client';
import { STALE_TIME_MS } from '../shared/api/queries';

const MAX_RETRIES = 1;

/** Único lugar que configura o React Query (composition root do frontend). */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME_MS,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => isRetryableError(error) && failureCount < MAX_RETRIES,
      },
    },
  });
}

interface AppProvidersProps {
  readonly children: ReactNode;
  /** Os testes injetam um client com `retry: false`. */
  readonly client?: QueryClient;
}

export function AppProviders({ children, client }: AppProvidersProps) {
  const [queryClient] = useState(() => client ?? createQueryClient());
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
