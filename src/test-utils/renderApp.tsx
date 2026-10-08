import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import type { ReactNode } from 'react';

import { createMockApi, type FailurePolicy } from '@/api/mockApi';
import { ApiProvider } from '@/data/ApiProvider';
import { DemoToolsScreen } from '@/screens/DemoToolsScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { OfferDetailScreen } from '@/screens/OfferDetailScreen';
import { RedemptionCodeScreen } from '@/screens/RedemptionCodeScreen';

/**
 * A mock API with no latency, where failures are switched on by name,
 * e.g. failures.add('getOffers:request').
 */
export function createTestApi() {
  const failures = new Set<string>();
  const shouldFail: FailurePolicy = (operation, stage) => failures.has(`${operation}:${stage}`);
  const api = createMockApi({ latencyMs: { min: 0, max: 0 }, sleep: async () => {}, shouldFail });
  return { api, failures };
}

/** Renders the real screens under the real routes, so deep links and navigation are exercised too. */
export async function renderApp({ api, initialUrl = '/' }: { api: ReturnType<typeof createMockApi>; initialUrl?: string }) {
  // No automatic retries: tests drive retries through the UI.
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <ApiProvider api={api} demo={api}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ApiProvider>
  );

  const rendered = renderRouter(
    {
      _layout: () => <Stack screenOptions={{ headerShown: false }} />,
      index: HomeScreen,
      'offers/[id]/index': OfferDetailScreen,
      'offers/[id]/code': RedemptionCodeScreen,
      'demo-tools': DemoToolsScreen,
    },
    { initialUrl, wrapper },
  );
  // RNTL 14 renders asynchronously, so render() returns a Promise. expo-router
  // attaches its helpers to that Promise, so grab them before awaiting.
  const { getPathname } = rendered;
  await rendered;
  return { getPathname };
}
