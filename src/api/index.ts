import AsyncStorage from '@react-native-async-storage/async-storage';

import { createMockApi } from './mockApi';

export * from './errors';
export * from './types';
export type { DemoControls, LoyaltyApi, MockLoyaltyApi } from './mockApi';

/**
 * The app's API instance. Failure rate can be tuned without code changes, e.g.
 *   EXPO_PUBLIC_MOCK_FAILURE_RATE=1 npx expo start   (every request fails)
 *   EXPO_PUBLIC_MOCK_FAILURE_RATE=0 npx expo start   (happy path only)
 */
const failureRate = Number(process.env.EXPO_PUBLIC_MOCK_FAILURE_RATE ?? 0.2);

export const defaultApi = createMockApi({
  failureRate: Number.isFinite(failureRate) ? failureRate : 0.2,
  store: AsyncStorage,
});
