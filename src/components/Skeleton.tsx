import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View, type DimensionValue, type ViewStyle } from 'react-native';

import { colors, radius } from '@/theme';

interface SkeletonProps {
  width?: DimensionValue;
  height: number;
  rounded?: number;
  color?: string;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height, rounded = 8, color = colors.skeleton, style }: SkeletonProps) {
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return <Animated.View style={[{ width, height, borderRadius: rounded, backgroundColor: color, opacity }, style]} />;
}

export function MemberCardSkeleton() {
  return (
    <View style={styles.memberCard}>
      <Skeleton width={90} height={12} color={colors.skeletonSoft} />
      <Skeleton width={150} height={22} color={colors.skeletonSoft} />
      <Skeleton width={80} height={12} color={colors.skeletonSoft} style={styles.gapTop} />
      <Skeleton width={140} height={42} rounded={10} color={colors.skeletonSoft} />
      <Skeleton height={8} rounded={radius.pill} color={colors.skeletonSoft} style={styles.gapTop} />
    </View>
  );
}

export function OfferCardSkeleton({ titleWidth = 160 }: { titleWidth?: number }) {
  return (
    <View style={styles.offerCard}>
      <Skeleton width={72} height={72} rounded={18} color={colors.skeletonSoft} />
      <View style={styles.offerText}>
        <Skeleton width={70} height={14} rounded={radius.pill} color={colors.skeletonSoft} />
        <Skeleton width={titleWidth} height={16} />
        <Skeleton width={110} height={12} color={colors.skeletonSoft} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  memberCard: { backgroundColor: colors.skeleton, borderRadius: radius.xl, padding: 22, gap: 12 },
  gapTop: { marginTop: 8 },
  offerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  offerText: { flex: 1, gap: 8 },
});
