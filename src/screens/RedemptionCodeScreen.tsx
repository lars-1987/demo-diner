import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Line, RadialGradient, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Offer, Redemption } from '@/api';
import { AppText } from '@/components/AppText';
import { Barcode } from '@/components/Barcode';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { OfferArt } from '@/components/OfferArt';
import { useOffer } from '@/data/loyalty';
import { formatCode } from '@/domain/offers';
import { formatCountdown, useCountdown } from '@/hooks/useCountdown';
import { colors, fonts, radius } from '@/theme';

export function RedemptionCodeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const offerQuery = useOffer(id);
  const offer = offerQuery.data;

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  let body;
  if (offer?.redemption) {
    body = <Ticket offer={offer} redemption={offer.redemption} />;
  } else if (offer) {
    body = <Notice title="No code yet" message="Redeem this offer to get a barcode." />;
  } else if (offerQuery.isError) {
    body = (
      <Notice title="We couldn’t load your code" message={offerQuery.error.message}>
        <Button label="Try again" variant="secondary" onPress={() => offerQuery.refetch()} loading={offerQuery.isFetching} />
      </Notice>
    );
  } else {
    body = <ActivityIndicator color={colors.white} size="large" accessibilityLabel="Loading your code" style={styles.loader} />;
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 4, paddingBottom: insets.bottom + 12 }]}>
      <StatusBar style="light" />
      <BackgroundGlow />
      <View style={styles.topBar}>
        <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Close" style={styles.close}>
          <Icon name="x" size={20} color={colors.white} strokeWidth={2.25} />
        </Pressable>
      </View>
      <View style={styles.heading}>
        <AppText variant="display" color={colors.white} style={styles.center} accessibilityRole="header">
          Show this at the counter
        </AppText>
        <AppText color="rgba(255,255,255,0.65)" style={styles.center}>
          Staff will scan your code before you pay.
        </AppText>
      </View>
      <View style={styles.body}>{body}</View>
      <Button label="Done" variant="secondary" onPress={close} style={styles.done} />
    </View>
  );
}

function Ticket({ offer, redemption }: { offer: Offer; redemption: Redemption }) {
  const remaining = useCountdown(redemption.codeExpiresAt);
  const expired = remaining === 0;
  const minutesLeft = Math.ceil(remaining / 60000);
  const redeemedAt = new Date(redemption.redeemedAt).toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <>
      <View style={styles.ticket}>
        <View style={styles.ticketHeader}>
          <OfferArt artwork={offer.artwork} size={52} />
          <View style={styles.flex}>
            <AppText variant="heading" style={styles.ticketTitle}>
              {offer.title}
            </AppText>
            <AppText variant="small" color={colors.muted}>
              Demo Diner · {offer.venue.replace('All Demo Diner venues', 'All venues')}
            </AppText>
          </View>
        </View>

        <View style={styles.perforation}>
          <View style={[styles.notch, styles.notchLeft]} />
          {/* iOS ignores dashed borders on a single side, so draw the dashes with SVG. */}
          <Svg height={2} style={styles.dashes}>
            <Line x1="0" y1="1" x2="100%" y2="1" stroke={colors.line} strokeWidth={2} strokeDasharray="6 6" />
          </Svg>
          <View style={[styles.notch, styles.notchRight]} />
        </View>

        <View style={styles.codeArea}>
          <View style={[styles.barcode, expired && styles.barcodeExpired]}>
            <Barcode value={redemption.code} />
          </View>
          <AppText style={[styles.code, expired && styles.codeExpired]} selectable>
            {formatCode(redemption.code)}
          </AppText>
          <View
            style={[styles.countdown, expired && styles.countdownExpired]}
            accessible
            accessibilityLabel={expired ? 'This code has expired' : `Expires in ${minutesLeft} minutes`}
          >
            <Icon name="clock" size={14} color={expired ? colors.muted : colors.red} strokeWidth={2.25} />
            <AppText variant="small" style={styles.bold} color={expired ? colors.muted : colors.red}>
              {expired ? 'This code has expired' : `Expires in ${formatCountdown(remaining)}`}
            </AppText>
          </View>
        </View>
      </View>
      <AppText variant="caption" color="rgba(255,255,255,0.5)" style={[styles.center, styles.meta]}>
        Redeemed {redeemedAt}
      </AppText>
    </>
  );
}

/** Red and gold glows behind the ticket, as in the Figma frame. The ticket itself stays plain white for scanners. */
function BackgroundGlow() {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <RadialGradient id="codeRed" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={colors.red} stopOpacity={0.55} />
          <Stop offset="1" stopColor={colors.red} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="codeGold" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={colors.mustard} stopOpacity={0.4} />
          <Stop offset="1" stopColor={colors.mustard} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx="5%" cy="5%" r="220" fill="url(#codeRed)" />
      <Circle cx="95%" cy="80%" r="200" fill="url(#codeGold)" />
    </Svg>
  );
}

function Notice({ title, message, children }: { title: string; message: string; children?: React.ReactNode }) {
  return (
    <View style={styles.notice}>
      <AppText variant="heading" style={styles.center}>
        {title}
      </AppText>
      <AppText variant="small" color={colors.muted} style={styles.center}>
        {message}
      </AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.card, paddingHorizontal: 20 },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  bold: { fontFamily: fonts.bold },
  topBar: { flexDirection: 'row' },
  close: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: { gap: 6, paddingHorizontal: 8, paddingVertical: 22 },
  body: { flex: 1 },
  loader: { marginTop: 80 },
  ticket: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 20 },
    elevation: 12,
  },
  ticketHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20 },
  ticketTitle: { fontSize: 19, lineHeight: 24 },
  perforation: { height: 24, justifyContent: 'center' },
  dashes: { marginHorizontal: 24 },
  notch: { position: 'absolute', width: 24, height: 24, borderRadius: 12, backgroundColor: colors.card },
  notchLeft: { left: -12 },
  notchRight: { right: -12 },
  codeArea: { alignItems: 'center', gap: 14, paddingHorizontal: 24, paddingTop: 18, paddingBottom: 24 },
  barcode: { alignSelf: 'stretch', backgroundColor: colors.white },
  barcodeExpired: { opacity: 0.15 },
  code: { fontFamily: fonts.semibold, fontSize: 20, letterSpacing: 2.4, color: colors.ink },
  codeExpired: { color: colors.muted, textDecorationLine: 'line-through' },
  countdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 12,
    paddingRight: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.redTint,
  },
  countdownExpired: { backgroundColor: colors.line },
  meta: { marginTop: 18 },
  notice: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 24, gap: 10 },
  done: { borderWidth: 0 },
});
