import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { errorCode, isRetryable, type Offer } from '@/api';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Icon, type IconName } from '@/components/Icon';
import { Pill } from '@/components/Pill';
import { ErrorState } from '@/components/StateViews';
import { useOffer, useRedeemOffer } from '@/data/loyalty';
import { getOfferStatus, hasActiveCode } from '@/domain/offers';
import { useAnnounce } from '@/hooks/useAnnounce';
import { useNow } from '@/hooks/useNow';
import { artworkColors, colors, fonts, radius } from '@/theme';

const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });

export function OfferDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const offerQuery = useOffer(id);

  // Deep links can land here with nothing to go back to.
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (!offerQuery.data) {
    const notFound = errorCode(offerQuery.error) === 'NOT_FOUND';
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.navStatic}>
          <CircleButton icon="chevron-left" label="Back" onPress={goBack} />
        </View>
        {offerQuery.isError ? (
          <ErrorState
            title={notFound ? 'Offer not found' : "We couldn’t load this offer"}
            message={offerQuery.error.message}
            onRetry={notFound ? goBack : () => offerQuery.refetch()}
            retryLabel={notFound ? 'Back to offers' : 'Try again'}
            retrying={!notFound && offerQuery.isFetching}
          />
        ) : (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.red} size="large" accessibilityLabel="Loading offer" />
          </View>
        )}
      </View>
    );
  }

  return <OfferDetail offer={offerQuery.data} onBack={goBack} />;
}

function OfferDetail({ offer, onBack }: { offer: Offer; onBack: () => void }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const redeem = useRedeemOffer(offer.id);
  const [termsOpen, setTermsOpen] = useState(false);
  // The bottom bar grows with text size and the error banner, so measure it
  // rather than guessing, or it would cover the end of the content.
  const [barHeight, setBarHeight] = useState(170);
  const now = useNow();
  const status = getOfferStatus(offer, now);
  const { bg, fg } = artworkColors[offer.artwork];

  const showCode = () => router.push(`/offers/${offer.id}/code`);
  const runRedeem = () => redeem.mutate(undefined, { onSuccess: showCode });

  // Codes are short-lived, so make sure the guest is actually at the counter.
  const confirmRedeem = () =>
    Alert.alert('Redeem now?', "Only redeem when you’re at the counter. Your code will be valid for 15 minutes.", [
      { text: 'Not yet', style: 'cancel' },
      { text: 'Redeem', onPress: runRedeem },
    ]);

  const share = () =>
    Share.share({ message: `${offer.title} at Demo Diner: ${Linking.createURL(`/offers/${offer.id}`)}` });

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: barHeight + 16 }}>
        <View style={[styles.hero, { backgroundColor: bg, opacity: status === 'expired' ? 0.55 : 1 }]}>
          <View style={[styles.decor, styles.decorA, { backgroundColor: fg }]} />
          <View style={[styles.decor, styles.decorB, { backgroundColor: fg }]} />
          <View style={styles.plate}>
            <Icon name={offer.artwork} size={96} color={fg} strokeWidth={1.25} />
          </View>
        </View>

        <View style={styles.sheet}>
          <View style={styles.tags}>
            {status === 'available' && <Pill label={offer.tag} />}
            {status === 'redeemed' && <Pill label="Redeemed" tone="success" icon="check" />}
            {status === 'expired' && <Pill label="Expired" tone="neutral" />}
            <Pill label="Dine-in" tone="outline" />
          </View>
          <AppText variant="display" accessibilityRole="header" color={status === 'available' ? colors.ink : colors.muted}>
            {offer.title}
          </AppText>
          <AppText color={colors.muted}>{offer.description}</AppText>

          <View style={styles.info}>
            <InfoRow
              icon="clock"
              label={status === 'expired' ? 'Ended' : 'Valid until'}
              value={longDate(offer.expiresAt)}
              alert={status === 'expired'}
            />
            <InfoRow icon="pin" label="Where" value={offer.venue} />
            <InfoRow icon="ticket" label="Limit" value={offer.limit} last />
          </View>

          <AppText variant="heading" style={styles.subheading}>
            How it works
          </AppText>
          {[
            'Tap Redeem to generate your one-time code.',
            'Show the barcode to staff before you pay.',
            'Codes stay valid for 15 minutes.',
          ].map((step, i) => (
            <View key={step} style={styles.step}>
              <View style={styles.stepNumber}>
                <AppText variant="caption" color={colors.white} maxFontSizeMultiplier={1}>
                  {i + 1}
                </AppText>
              </View>
              <AppText variant="small" style={styles.flex}>
                {step}
              </AppText>
            </View>
          ))}

          <Pressable
            onPress={() => setTermsOpen((open) => !open)}
            accessibilityRole="button"
            accessibilityState={{ expanded: termsOpen }}
            style={styles.terms}
          >
            <AppText variant="bodyStrong">Terms & conditions</AppText>
            <Icon name={termsOpen ? 'chevron-down' : 'chevron-right'} size={18} color={colors.muted} />
          </Pressable>
          {termsOpen &&
            offer.terms.map((term) => (
              <AppText key={term} variant="small" color={colors.muted}>
                • {term}
              </AppText>
            ))}
        </View>
      </ScrollView>

      <View style={[styles.nav, { top: insets.top + 4 }]}>
        <CircleButton icon="chevron-left" label="Back" onPress={onBack} />
        <CircleButton icon="share" label="Share offer" onPress={share} />
      </View>

      <View
        style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}
        onLayout={(e) => setBarHeight(e.nativeEvent.layout.height)}
      >
        <RedeemAction
          offer={offer}
          now={now}
          redeem={redeem}
          onRedeem={confirmRedeem}
          onRetry={runRedeem}
          onShowCode={showCode}
        />
      </View>
    </View>
  );
}

interface RedeemActionProps {
  offer: Offer;
  now: number;
  redeem: ReturnType<typeof useRedeemOffer>;
  onRedeem: () => void;
  onRetry: () => void;
  onShowCode: () => void;
}

/** The bottom bar is a small state machine: offer status first, then the mutation's state. */
function RedeemAction({ offer, now, redeem, onRedeem, onRetry, onShowCode }: RedeemActionProps) {
  const status = getOfferStatus(offer, now);

  if (status === 'redeemed') {
    return hasActiveCode(offer, now) ? (
      <>
        <Button label="View your code" onPress={onShowCode} />
        <Caption>Your code is still valid. Show it at the counter.</Caption>
      </>
    ) : (
      <>
        <Button label="Already redeemed" disabled />
        <Caption>{`You used this offer on ${longDate(offer.redemption!.redeemedAt)}.`}</Caption>
      </>
    );
  }

  if (status === 'expired') {
    return (
      <>
        <Button label="Offer expired" disabled />
        <Caption>Keep an eye out. New offers drop every Monday.</Caption>
      </>
    );
  }

  if (redeem.isPending) {
    return (
      <>
        <Button label="Generating your code…" loading />
        <Caption>This usually only takes a second.</Caption>
      </>
    );
  }

  if (redeem.isError) {
    return <RedeemError error={redeem.error} onRetry={onRetry} />;
  }

  return (
    <>
      <Button label="Redeem offer" onPress={onRedeem} accessibilityHint="Generates a barcode to show at the counter" />
      <Caption>You’ll get a barcode to show at the counter.</Caption>
    </>
  );
}

function RedeemError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const retryable = isRetryable(error);
  const message = retryable
    ? "Check your connection and try again. It’s safe to retry: you won’t use the offer twice."
    : error.message;
  useAnnounce(`Couldn’t redeem this offer. ${message}`);

  return (
    <>
      <View style={styles.errorBanner} accessibilityLiveRegion="assertive" accessibilityRole="alert">
        <Icon name="alert" size={18} color={colors.red} strokeWidth={2.25} />
        <View style={styles.flex}>
          <AppText variant="small" color={colors.red} style={styles.bold}>
            Couldn’t redeem this offer
          </AppText>
          <AppText variant="small" color={colors.ink}>
            {message}
          </AppText>
        </View>
      </View>
      {retryable && <Button label="Try again" onPress={onRetry} />}
    </>
  );
}

function Caption({ children }: { children: string }) {
  return (
    <AppText variant="caption" color={colors.muted} style={styles.caption}>
      {children}
    </AppText>
  );
}

function InfoRow({ icon, label, value, alert, last }: { icon: IconName; label: string; value: string; alert?: boolean; last?: boolean }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoDivider]} accessible accessibilityLabel={`${label}: ${value}`}>
      <View style={styles.infoIcon}>
        <Icon name={icon} size={17} />
      </View>
      <AppText variant="small" color={colors.muted} style={styles.infoLabel}>
        {label}
      </AppText>
      <AppText variant="small" color={alert ? colors.red : colors.ink} style={[styles.bold, styles.infoValue]}>
        {value}
      </AppText>
    </View>
  );
}

function CircleButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={styles.circleButton}>
      <Icon name={icon} size={20} strokeWidth={2.25} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  bold: { fontFamily: fonts.bold },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { height: 330, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  decor: { position: 'absolute', borderRadius: radius.pill },
  decorA: { width: 300, height: 300, right: -80, top: -80, opacity: 0.1 },
  decorB: { width: 180, height: 180, left: -60, bottom: -20, opacity: 0.08 },
  plate: {
    width: 170,
    height: 170,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    marginTop: -30,
    backgroundColor: colors.bg,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 28,
    gap: 16,
  },
  tags: { flexDirection: 'row', gap: 8 },
  info: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 16,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  // The label keeps its width and the value wraps, so neither breaks mid-word.
  infoLabel: { flexShrink: 0 },
  infoValue: { flex: 1, textAlign: 'right' },
  infoDivider: { borderBottomWidth: 1, borderBottomColor: colors.line },
  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subheading: { fontSize: 19, marginTop: 4 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  terms: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 52,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    marginTop: 4,
  },
  nav: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' },
  navStatic: { paddingHorizontal: 16, paddingTop: 4 },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#331A0D',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  caption: { textAlign: 'center' },
  errorBanner: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.redTint,
    borderWidth: 1,
    borderColor: 'rgba(200, 41, 31, 0.2)',
  },
});
