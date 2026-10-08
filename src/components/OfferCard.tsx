import { Pressable, StyleSheet, View } from 'react-native';

import type { Offer } from '@/api';
import { describeOfferTiming, getOfferStatus } from '@/domain/offers';
import { colors, radius } from '@/theme';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { OfferArt } from './OfferArt';
import { Pill } from './Pill';

interface OfferCardProps {
  offer: Offer;
  onPress: () => void;
  now?: number;
}

export function OfferCard({ offer, onPress, now }: OfferCardProps) {
  const status = getOfferStatus(offer, now);
  const timing = describeOfferTiming(offer, now);
  const available = status === 'available';
  const statusLabel = { available: 'Available', redeemed: 'Redeemed', expired: 'Expired' }[status];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${offer.title}. ${offer.summary}. ${statusLabel}, ${timing}.`}
      accessibilityHint="Opens offer details"
      style={({ pressed }) => [
        styles.card,
        available && styles.cardAvailable,
        status === 'expired' && styles.cardExpired,
        pressed && styles.pressed,
      ]}
    >
      <OfferArt artwork={offer.artwork} muted={!available} />
      <View style={styles.text}>
        {status === 'available' && <Pill label={offer.tag} />}
        {status === 'redeemed' && <Pill label="Redeemed" tone="success" icon="check" />}
        {status === 'expired' && <Pill label="Expired" tone="neutral" />}
        <AppText variant="heading" color={available ? colors.ink : colors.muted} numberOfLines={2}>
          {offer.title}
        </AppText>
        <AppText variant="small" color={colors.muted} numberOfLines={2}>
          {offer.summary}
        </AppText>
        <View style={styles.meta}>
          <Icon
            name={status === 'redeemed' ? 'check' : 'clock'}
            size={13}
            strokeWidth={2.25}
            color={available ? colors.red : colors.muted}
          />
          <AppText variant="caption" color={available ? colors.red : colors.muted}>
            {timing}
          </AppText>
        </View>
      </View>
      {available && <Icon name="chevron-right" size={20} color={colors.muted} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    paddingRight: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cardAvailable: {
    shadowColor: '#4D3319',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  cardExpired: { backgroundColor: colors.bg },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  text: { flex: 1, gap: 3 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
});
