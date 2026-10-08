import type { Member, Offer, Redemption } from './types';

const DAY = 24 * 60 * 60 * 1000;

export const seedMember: Member = {
  id: 'member-204881',
  firstName: 'Alex',
  lastName: 'Morgan',
  memberNumber: '204 881',
  tier: 'Gold',
  points: 1240,
  nextTier: { name: 'Platinum', pointsRequired: 1500 },
};

/** An offer as the "server" stores it, before this member's redemption is joined on. */
export type OfferRecord = Omit<Offer, 'redemption'>;

/**
 * Expiry dates are relative to `now` so the demo never goes stale.
 * Includes one expired offer and (see seedRedemptions) one already redeemed.
 */
export function seedOffers(now: number): OfferRecord[] {
  const at = (days: number) => new Date(now + days * DAY).toISOString();
  const allVenues = 'All Demo Diner venues';
  return [
    {
      id: 'loaded-fries',
      title: 'Free loaded fries',
      summary: 'With any burger · dine-in only',
      description:
        'Crinkle-cut fries smothered in melted cheddar, smoky bacon bits and house ranch. On us with any burger, as a thank-you for being a member.',
      tag: 'Members only',
      artwork: 'burger',
      venue: allVenues,
      limit: '1 per member',
      terms: [
        'Valid with the purchase of any full-priced burger.',
        'Dine-in only. Not valid with other offers.',
        'One redemption per member.',
      ],
      expiresAt: at(23),
    },
    {
      id: 'thickshake-2-for-1',
      title: '2-for-1 thickshakes',
      summary: 'Weekdays 2–5pm',
      description:
        'Bring a friend for happy hour. Buy any thickshake and get a second one free, Monday to Friday between 2pm and 5pm.',
      tag: 'Happy hour',
      artwork: 'shake',
      venue: allVenues,
      limit: '1 per member',
      terms: ['Valid Monday to Friday, 2pm–5pm.', 'Second shake must be of equal or lesser value.'],
      expiresAt: at(3),
    },
    {
      id: 'ten-off-bill',
      title: '$10 off your bill',
      summary: 'Gold reward · spend $50+',
      description:
        'A Gold-tier reward. Take $10 off any bill of $50 or more, food and drinks included.',
      tag: 'Gold reward',
      artwork: 'gift',
      venue: allVenues,
      limit: '1 per member',
      terms: ['Minimum spend of $50 in a single transaction.', 'Not redeemable for cash.'],
      expiresAt: at(38),
    },
    {
      id: 'birthday-sundae',
      title: 'Birthday sundae',
      summary: 'A little something on us',
      description: 'Happy birthday! Enjoy a classic hot fudge sundae on the house during your birthday month.',
      tag: 'Birthday',
      artwork: 'sundae',
      venue: allVenues,
      limit: '1 per member',
      terms: ['Valid during your birthday month.'],
      expiresAt: at(20),
    },
    {
      id: 'half-price-pints',
      title: 'Half-price pints',
      summary: 'Game day special',
      description:
        'Any tap beer at half price while the game is on. Available at the bar and in the dining room.',
      tag: 'Game day',
      artwork: 'pint',
      venue: allVenues,
      limit: '1 per member',
      terms: ['Valid during televised games only.', 'Must be 18+. Please drink responsibly.'],
      expiresAt: at(-8),
    },
  ];
}

export function seedRedemptions(now: number): Redemption[] {
  const redeemedAt = now - 2 * DAY;
  return [
    {
      offerId: 'birthday-sundae',
      code: 'DD9HXK2MPW47',
      redeemedAt: new Date(redeemedAt).toISOString(),
      codeExpiresAt: new Date(redeemedAt + 15 * 60 * 1000).toISOString(),
    },
  ];
}
