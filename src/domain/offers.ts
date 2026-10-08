import type { Offer } from '@/api';

export type OfferStatus = 'available' | 'redeemed' | 'expired';

/**
 * Status is derived from dates on the client rather than stored, so an offer
 * that expires while the app is open is shown correctly without a refetch.
 * Redeemed wins over expired: the guest cares that they used it.
 */
export function getOfferStatus(offer: Offer, now: number = Date.now()): OfferStatus {
  if (offer.redemption) return 'redeemed';
  if (now >= Date.parse(offer.expiresAt)) return 'expired';
  return 'available';
}

/** True while the redemption's barcode can still be scanned. */
export function hasActiveCode(offer: Offer, now: number = Date.now()): boolean {
  return !!offer.redemption && now < Date.parse(offer.redemption.codeExpiresAt);
}

const STATUS_ORDER: Record<OfferStatus, number> = { available: 0, redeemed: 1, expired: 2 };

/**
 * Available first (soonest to expire at the top), then redeemed (most recently
 * used first, so a fresh code is easy to find), then expired.
 */
export function sortOffers(offers: Offer[], now: number = Date.now()): Offer[] {
  return [...offers].sort((a, b) => {
    const statusA = getOfferStatus(a, now);
    const byStatus = STATUS_ORDER[statusA] - STATUS_ORDER[getOfferStatus(b, now)];
    if (byStatus) return byStatus;
    if (statusA === 'redeemed') return Date.parse(b.redemption!.redeemedAt) - Date.parse(a.redemption!.redeemedAt);
    return Date.parse(a.expiresAt) - Date.parse(b.expiresAt);
  });
}

export function countByStatus(offers: Offer[], now: number = Date.now()): Record<OfferStatus, number> {
  const counts = { available: 0, redeemed: 0, expired: 0 };
  for (const offer of offers) counts[getOfferStatus(offer, now)]++;
  return counts;
}

const DAY = 24 * 60 * 60 * 1000;
const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });

/** The small status line under each offer, e.g. "Ends in 3 days" or "Used 6 Oct". */
export function describeOfferTiming(offer: Offer, now: number = Date.now()): string {
  const status = getOfferStatus(offer, now);
  if (status === 'redeemed') {
    const ago = now - Date.parse(offer.redemption!.redeemedAt);
    return ago < 60 * 60 * 1000 ? 'Used just now' : `Used ${shortDate(offer.redemption!.redeemedAt)}`;
  }
  if (status === 'expired') return `Ended ${shortDate(offer.expiresAt)}`;

  const daysLeft = Math.ceil((Date.parse(offer.expiresAt) - now) / DAY);
  if (daysLeft <= 1) return 'Last day';
  if (daysLeft <= 7) return `Ends in ${daysLeft} days`;
  return `Ends ${shortDate(offer.expiresAt)}`;
}

/** "DD7K4P92QX81" → "DD7K 4P92 QX81", easier for staff to read aloud. */
export function formatCode(code: string): string {
  return code.replace(/(.{4})(?=.)/g, '$1 ');
}
