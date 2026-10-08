import type { Offer } from '@/api';
import { countByStatus, describeOfferTiming, formatCode, getOfferStatus, hasActiveCode, sortOffers } from '../offers';

const NOW = Date.parse('2026-10-08T09:00:00Z');
const MIN = 60 * 1000;
const DAY = 24 * 60 * MIN;
const iso = (ms: number) => new Date(ms).toISOString();

function makeOffer(overrides: Partial<Offer> = {}): Offer {
  return {
    id: 'offer',
    title: 'Offer',
    summary: '',
    description: '',
    tag: 'Members only',
    artwork: 'burger',
    venue: 'All venues',
    limit: '1 per member',
    terms: [],
    expiresAt: iso(NOW + 10 * DAY),
    redemption: null,
    ...overrides,
  };
}

const redeemed = (redeemedAt: number) => ({
  offerId: 'offer',
  code: 'DD7K4P92QX81',
  redeemedAt: iso(redeemedAt),
  codeExpiresAt: iso(redeemedAt + 15 * MIN),
});

describe('getOfferStatus', () => {
  it('is available before expiry', () => {
    expect(getOfferStatus(makeOffer({ expiresAt: iso(NOW + 1) }), NOW)).toBe('available');
  });

  it('is expired from the exact expiry moment', () => {
    expect(getOfferStatus(makeOffer({ expiresAt: iso(NOW) }), NOW)).toBe('expired');
  });

  it('is redeemed once redeemed, even after the offer expires', () => {
    const offer = makeOffer({ expiresAt: iso(NOW - DAY), redemption: redeemed(NOW - 2 * DAY) });
    expect(getOfferStatus(offer, NOW)).toBe('redeemed');
  });
});

describe('hasActiveCode', () => {
  it('is true until the code expires, then false', () => {
    const offer = makeOffer({ redemption: redeemed(NOW) });
    expect(hasActiveCode(offer, NOW + 15 * MIN - 1)).toBe(true);
    expect(hasActiveCode(offer, NOW + 15 * MIN)).toBe(false);
  });
});

describe('sortOffers / countByStatus', () => {
  const offers = [
    makeOffer({ id: 'expired', expiresAt: iso(NOW - DAY) }),
    makeOffer({ id: 'redeemed', redemption: redeemed(NOW - DAY) }),
    makeOffer({ id: 'just-redeemed', redemption: redeemed(NOW - MIN) }),
    makeOffer({ id: 'later', expiresAt: iso(NOW + 20 * DAY) }),
    makeOffer({ id: 'soon', expiresAt: iso(NOW + 2 * DAY) }),
  ];

  it('puts available offers first (soonest expiry on top), then redeemed (newest first), then expired', () => {
    expect(sortOffers(offers, NOW).map((o) => o.id)).toEqual(['soon', 'later', 'just-redeemed', 'redeemed', 'expired']);
  });

  it('counts offers by status', () => {
    expect(countByStatus(offers, NOW)).toEqual({ available: 2, redeemed: 2, expired: 1 });
  });
});

describe('describeOfferTiming', () => {
  it('uses relative wording when an offer ends within a week', () => {
    expect(describeOfferTiming(makeOffer({ expiresAt: iso(NOW + 3 * DAY) }), NOW)).toBe('Ends in 3 days');
    expect(describeOfferTiming(makeOffer({ expiresAt: iso(NOW + 5 * MIN) }), NOW)).toBe('Last day');
  });

  it('says "Used just now" right after redeeming', () => {
    expect(describeOfferTiming(makeOffer({ redemption: redeemed(NOW - MIN) }), NOW)).toBe('Used just now');
  });

  it('starts expired offers with "Ended"', () => {
    expect(describeOfferTiming(makeOffer({ expiresAt: iso(NOW - DAY) }), NOW)).toMatch(/^Ended /);
  });
});

it('formatCode groups the code in fours for reading aloud', () => {
  expect(formatCode('DD7K4P92QX81')).toBe('DD7K 4P92 QX81');
});
