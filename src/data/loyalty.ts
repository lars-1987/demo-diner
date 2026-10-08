import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { useRef } from 'react';

import type { Offer, Redemption } from '@/api';
import { useApi } from './ApiProvider';

export const queryKeys = {
  member: ['member'] as const,
  offers: ['offers'] as const,
  offer: (id: string) => ['offers', id] as const,
};

// Member and offers are separate queries so one can fail without taking the other down.
export function useMember() {
  const api = useApi();
  return useQuery({ queryKey: queryKeys.member, queryFn: () => api.getMember() });
}

/*
 * The list and each offer's detail are separate cache entries. They're kept in
 * step in both directions so they can never disagree. Otherwise a detail cached
 * earlier could show "redeemed" after a reset or a change on another device,
 * and stay wrong if its own refetch fails.
 */
export function useOffers() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: queryKeys.offers,
    queryFn: async () => {
      const offers = await api.getOffers();
      for (const offer of offers) queryClient.setQueryData(queryKeys.offer(offer.id), offer);
      return offers;
    },
  });
}

export function useOffer(id: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: queryKeys.offer(id),
    queryFn: async () => {
      const offer = await api.getOffer(id);
      queryClient.setQueryData<Offer[]>(queryKeys.offers, (offers) => offers?.map((o) => (o.id === id ? offer : o)));
      return offer;
    },
    // Coming from the list, show the cached offer instantly. A deep link has no
    // cache, so it falls through to a normal fetch.
    initialData: () => queryClient.getQueryData<Offer[]>(queryKeys.offers)?.find((o) => o.id === id),
    initialDataUpdatedAt: () => queryClient.getQueryState(queryKeys.offers)?.dataUpdatedAt,
  });
}

/**
 * Redeems an offer. One idempotency key is used for a whole "attempt",
 * including every manual retry, and is only replaced after a success. If a
 * request times out after the server already redeemed, the retry gets the same
 * code back instead of an "already redeemed" error.
 */
export function useRedeemOffer(offerId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  const attemptKey = useRef<string | null>(null);

  return useMutation({
    mutationFn: () => {
      attemptKey.current ??= Crypto.randomUUID();
      return api.redeemOffer(offerId, attemptKey.current);
    },
    onSuccess: (redemption) => {
      attemptKey.current = null;
      applyRedemption(queryClient, redemption);
    },
    onError: () => {
      // The offer may have changed on the server (expired, redeemed elsewhere).
      // Refetch in the background so the screen reflects reality.
      queryClient.invalidateQueries({ queryKey: queryKeys.offer(offerId) });
    },
  });
}

/** Write the result straight into the cache so the list and detail update without a refetch. */
function applyRedemption(queryClient: ReturnType<typeof useQueryClient>, redemption: Redemption) {
  const withRedemption = (offer: Offer): Offer =>
    offer.id === redemption.offerId ? { ...offer, redemption } : offer;

  queryClient.setQueryData<Offer>(queryKeys.offer(redemption.offerId), (offer) =>
    offer ? withRedemption(offer) : offer,
  );
  queryClient.setQueryData<Offer[]>(queryKeys.offers, (offers) => offers?.map(withRedemption));
}
