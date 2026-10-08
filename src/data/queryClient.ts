import { QueryClient, focusManager } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';

import { isRetryable } from '@/api';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Reads are safe to repeat: retry transient failures quietly, but never
        // retry errors that can't succeed (e.g. NOT_FOUND).
        retry: (failureCount, error) => isRetryable(error) && failureCount < 2,
        retryDelay: (attempt) => Math.min(800 * 2 ** attempt, 4000),
        staleTime: 30_000,
      },
      mutations: {
        // Redeeming is not safe to repeat blindly. Retries are user-initiated
        // and carry an idempotency key (see useRedeemOffer).
        retry: false,
      },
    },
  });
}

/** Refetch stale data when the app comes back to the foreground (RN has no window focus). */
export function subscribeToAppFocus() {
  const sub = AppState.addEventListener('change', (status) => {
    if (Platform.OS !== 'web') focusManager.setFocused(status === 'active');
  });
  return () => sub.remove();
}
