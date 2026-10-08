import { ApiError, networkError } from './errors';
import { seedMember, seedOffers, seedRedemptions, type OfferRecord } from './mockData';
import type { Member, Offer, Redemption } from './types';

/** The contract the app codes against. A real HTTP client would implement the same interface. */
export interface LoyaltyApi {
  getMember(): Promise<Member>;
  getOffers(): Promise<Offer[]>;
  getOffer(id: string): Promise<Offer>;
  /**
   * Redeem an offer. Pass the same `idempotencyKey` when retrying the same
   * attempt: if the first request succeeded but its response was lost, the
   * server returns the original redemption instead of rejecting the retry.
   */
  redeemOffer(id: string, idempotencyKey: string): Promise<Redemption>;
}

/** Controls that only exist on the mock, for demoing and testing failure handling. */
export interface DemoControls {
  getFailureRate(): number;
  /** Takes effect on the next request. Has no effect when a custom `shouldFail` policy is used. */
  setFailureRate(rate: number): void;
  /** Notifies when the failure rate changes. Returns an unsubscribe function. */
  subscribe(listener: () => void): () => void;
  /** Clears every redemption made in the app. */
  reset(): Promise<void>;
}

export type MockLoyaltyApi = LoyaltyApi & DemoControls;

/** Matches AsyncStorage's API, so AsyncStorage can be passed straight in. */
export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

type Operation = 'getMember' | 'getOffers' | 'getOffer' | 'redeemOffer';
/**
 * 'request': the request never reaches the server.
 * 'response': the server did the work but the response was lost (the case
 * idempotency keys exist for).
 */
export type FailureStage = 'request' | 'response';
export type FailurePolicy = (operation: Operation, stage: FailureStage) => boolean;

export interface MockApiOptions {
  latencyMs?: { min: number; max: number };
  /** Probability (0–1) that a request fails. Ignored when `shouldFail` is given. */
  failureRate?: number;
  /** Full control over failures, for tests. */
  shouldFail?: FailurePolicy;
  store?: KeyValueStore;
  random?: () => number;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
}

interface StoredRedemption extends Redemption {
  idempotencyKey: string | null;
}

interface ServerState {
  redemptions: Record<string, StoredRedemption>;
}

const STORAGE_KEY = 'demo-diner/mock-server/v1';
const CODE_TTL_MS = 15 * 60 * 1000;
// No 0/O or 1/I, so staff can read the code aloud if the scanner fails.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function createMemoryStore(initial: Record<string, string> = {}): KeyValueStore {
  const data = new Map(Object.entries(initial));
  return {
    getItem: async (key) => data.get(key) ?? null,
    setItem: async (key, value) => void data.set(key, value),
    removeItem: async (key) => void data.delete(key),
  };
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
// Responses are copied so callers can never mutate "server" state by accident.
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

export function createMockApi(options: MockApiOptions = {}): MockLoyaltyApi {
  const {
    latencyMs = { min: 600, max: 1400 },
    store = createMemoryStore(),
    random = Math.random,
    now = Date.now,
    sleep = defaultSleep,
  } = options;
  let failureRate = options.failureRate ?? 0.2;
  const listeners = new Set<() => void>();

  // Lost responses only matter for writes, so they're only simulated for redeem, at half the rate.
  const shouldFail: FailurePolicy =
    options.shouldFail ??
    ((operation, stage) =>
      stage === 'request'
        ? random() < failureRate
        : operation === 'redeemOffer' && random() < failureRate / 2);

  const offers: OfferRecord[] = seedOffers(now());
  let statePromise: Promise<ServerState> | null = null;

  function freshState(): ServerState {
    const redemptions: ServerState['redemptions'] = {};
    for (const r of seedRedemptions(now())) {
      redemptions[r.offerId] = { ...r, idempotencyKey: null };
    }
    return { redemptions };
  }

  function loadState(): Promise<ServerState> {
    statePromise ??= store.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) return freshState();
      try {
        return JSON.parse(raw) as ServerState;
      } catch {
        return freshState();
      }
    });
    return statePromise;
  }

  async function saveState(state: ServerState) {
    await store.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  async function simulateNetwork(operation: Operation) {
    const { min, max } = latencyMs;
    await sleep(min + random() * (max - min));
    if (shouldFail(operation, 'request')) throw networkError();
  }

  function toOffer(record: OfferRecord, state: ServerState): Offer {
    const stored = state.redemptions[record.id];
    const redemption: Redemption | null = stored
      ? {
          offerId: stored.offerId,
          code: stored.code,
          redeemedAt: stored.redeemedAt,
          codeExpiresAt: stored.codeExpiresAt,
        }
      : null;
    return clone({ ...record, redemption });
  }

  function generateCode(): string {
    let code = 'DD';
    for (let i = 0; i < 10; i++) code += CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length)];
    return code;
  }

  function findOffer(id: string): OfferRecord {
    const record = offers.find((o) => o.id === id);
    if (!record) throw new ApiError('NOT_FOUND', "We couldn’t find that offer. It may have been removed.");
    return record;
  }

  return {
    async getMember() {
      await simulateNetwork('getMember');
      return clone(seedMember);
    },

    async getOffers() {
      await simulateNetwork('getOffers');
      const state = await loadState();
      return offers.map((o) => toOffer(o, state));
    },

    async getOffer(id) {
      await simulateNetwork('getOffer');
      const state = await loadState();
      return toOffer(findOffer(id), state);
    },

    async redeemOffer(id, idempotencyKey) {
      await simulateNetwork('redeemOffer');
      const state = await loadState();
      const record = findOffer(id);
      const existing = state.redemptions[id];

      if (existing) {
        // A retry of an attempt that already succeeded gets the original result back.
        if (existing.idempotencyKey === idempotencyKey) return toOffer(record, state).redemption!;
        throw new ApiError('ALREADY_REDEEMED', "You’ve already redeemed this offer.");
      }
      if (now() >= Date.parse(record.expiresAt)) {
        throw new ApiError('OFFER_EXPIRED', 'Sorry, this offer has expired.');
      }

      const redeemedAt = now();
      state.redemptions[id] = {
        offerId: id,
        code: generateCode(),
        redeemedAt: new Date(redeemedAt).toISOString(),
        codeExpiresAt: new Date(redeemedAt + CODE_TTL_MS).toISOString(),
        idempotencyKey,
      };
      await saveState(state);

      if (shouldFail('redeemOffer', 'response')) throw networkError();
      return toOffer(record, state).redemption!;
    },

    getFailureRate: () => failureRate,

    setFailureRate(rate) {
      failureRate = Math.min(Math.max(rate, 0), 1);
      listeners.forEach((listener) => listener());
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async reset() {
      statePromise = Promise.resolve(freshState());
      await store.removeItem(STORAGE_KEY);
    },
  };
}
