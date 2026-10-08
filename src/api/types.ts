export type Tier = 'Silver' | 'Gold' | 'Platinum';

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  memberNumber: string;
  tier: Tier;
  points: number;
  /** Null when the member is already on the top tier. */
  nextTier: { name: Tier; pointsRequired: number } | null;
}

/** Artwork key for an offer. The app maps this to an icon and colour. */
export type OfferArtwork = 'burger' | 'shake' | 'gift' | 'sundae' | 'pint';

export interface Redemption {
  offerId: string;
  /** The value encoded in the barcode, e.g. "DD7K4P92QX81". */
  code: string;
  redeemedAt: string;
  /** Codes are single-use and short-lived so screenshots can't be reused. */
  codeExpiresAt: string;
}

export interface Offer {
  id: string;
  title: string;
  /** One-liner shown in the offers list. */
  summary: string;
  description: string;
  tag: string;
  artwork: OfferArtwork;
  venue: string;
  limit: string;
  terms: string[];
  expiresAt: string;
  /** Set once this member has redeemed the offer. */
  redemption: Redemption | null;
}
