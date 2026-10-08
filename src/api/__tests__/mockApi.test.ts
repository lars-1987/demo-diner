import { ApiError } from '../errors';
import { createMemoryStore, createMockApi, type FailurePolicy, type MockApiOptions } from '../mockApi';

const NOW = Date.parse('2026-10-08T09:00:00Z');

function setup(overrides: MockApiOptions = {}) {
  return createMockApi({
    latencyMs: { min: 0, max: 0 },
    sleep: async () => {},
    now: () => NOW,
    shouldFail: () => false,
    ...overrides,
  });
}

const failOn =
  (...rules: string[]): FailurePolicy =>
  (operation, stage) =>
    rules.includes(`${operation}:${stage}`);

describe('mock loyalty API', () => {
  it('returns offers with this member’s redemptions joined on', async () => {
    const offers = await setup().getOffers();
    expect(offers.find((o) => o.id === 'birthday-sundae')?.redemption).not.toBeNull();
    expect(offers.find((o) => o.id === 'loaded-fries')?.redemption).toBeNull();
  });

  it('redeems an offer and returns a short-lived code', async () => {
    const redemption = await setup().redeemOffer('loaded-fries', 'key-1');
    expect(redemption.code).toMatch(/^DD[A-Z2-9]{10}$/);
    expect(Date.parse(redemption.codeExpiresAt) - Date.parse(redemption.redeemedAt)).toBe(15 * 60 * 1000);
  });

  it('persists redemptions across app restarts via the store', async () => {
    const store = createMemoryStore();
    const { code } = await setup({ store }).redeemOffer('loaded-fries', 'key-1');

    const afterRestart = await setup({ store }).getOffer('loaded-fries');
    expect(afterRestart.redemption?.code).toBe(code);
  });

  it('returns the original redemption when the same attempt is retried', async () => {
    const api = setup();
    const first = await api.redeemOffer('loaded-fries', 'key-1');
    await expect(api.redeemOffer('loaded-fries', 'key-1')).resolves.toEqual(first);
  });

  it('rejects a second, different attempt to redeem the same offer', async () => {
    const api = setup();
    await api.redeemOffer('loaded-fries', 'key-1');
    await expect(api.redeemOffer('loaded-fries', 'key-2')).rejects.toMatchObject({
      code: 'ALREADY_REDEEMED',
      retryable: false,
    });
  });

  it('rejects redeeming an expired offer', async () => {
    await expect(setup().redeemOffer('half-price-pints', 'key-1')).rejects.toMatchObject({
      code: 'OFFER_EXPIRED',
      retryable: false,
    });
  });

  it('returns a non-retryable NOT_FOUND for unknown offers', async () => {
    await expect(setup().getOffer('nope')).rejects.toMatchObject({ code: 'NOT_FOUND', retryable: false });
  });

  it('simulates network failures as retryable errors', async () => {
    const api = setup({ shouldFail: failOn('getOffers:request') });
    const error = await api.getOffers().catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ code: 'NETWORK_ERROR', retryable: true });
  });

  it('keeps the redemption when the response is lost, so a retry with the same key recovers it', async () => {
    let lostResponse = true;
    const api = setup({ shouldFail: (op, stage) => lostResponse && op === 'redeemOffer' && stage === 'response' });

    await expect(api.redeemOffer('loaded-fries', 'key-1')).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
    const saved = (await api.getOffer('loaded-fries')).redemption;
    expect(saved).not.toBeNull();

    lostResponse = false;
    await expect(api.redeemOffer('loaded-fries', 'key-1')).resolves.toEqual(saved);
  });

  it('fails roughly at the configured rate by default', async () => {
    let seed = 1;
    const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const api = createMockApi({ latencyMs: { min: 0, max: 0 }, sleep: async () => {}, failureRate: 0.2, random });

    const results = await Promise.allSettled(Array.from({ length: 500 }, () => api.getMember()));
    const failureRate = results.filter((r) => r.status === 'rejected').length / results.length;
    expect(failureRate).toBeGreaterThan(0.12);
    expect(failureRate).toBeLessThan(0.28);
  });

  it('applies a new failure rate at runtime and notifies subscribers', async () => {
    const api = createMockApi({ latencyMs: { min: 0, max: 0 }, sleep: async () => {}, failureRate: 0, random: () => 0.5 });
    const listener = jest.fn();
    api.subscribe(listener);

    await expect(api.getMember()).resolves.toBeDefined();
    api.setFailureRate(1);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(api.getFailureRate()).toBe(1);
    await expect(api.getMember()).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  });

  it('reset clears redemptions made in the app', async () => {
    const api = setup();
    await api.redeemOffer('loaded-fries', 'key-1');
    await api.reset();
    expect((await api.getOffer('loaded-fries')).redemption).toBeNull();
  });
});
