import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react';

import { defaultApi, type DemoControls, type LoyaltyApi } from '@/api';

interface ApiContextValue {
  api: LoyaltyApi;
  /** Only present when running against the mock. A real API would pass null. */
  demo: DemoControls | null;
}

const ApiContext = createContext<ApiContextValue>({ api: defaultApi, demo: defaultApi });

/** Lets tests (or a future real client) swap the API without touching screens. */
export function ApiProvider({
  api,
  demo = null,
  children,
}: {
  api: LoyaltyApi;
  demo?: DemoControls | null;
  children: ReactNode;
}) {
  return <ApiContext.Provider value={{ api, demo }}>{children}</ApiContext.Provider>;
}

export const useApi = () => useContext(ApiContext).api;
export const useDemoControls = () => useContext(ApiContext).demo;

const noopSubscribe = () => () => {};

/** The mock's current failure rate, re-rendering when it changes. 0 when there is no mock. */
export function useFailureRate(): number {
  const demo = useDemoControls();
  return useSyncExternalStore(demo?.subscribe ?? noopSubscribe, () => demo?.getFailureRate() ?? 0);
}
