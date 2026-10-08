import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import type { Member } from '@/api';
import { colors, fonts, radius } from '@/theme';
import { AppText } from './AppText';
import { Icon } from './Icon';

function greeting(hour: number) {
  if (hour < 12) return 'Good morning,';
  if (hour < 17) return 'Good afternoon,';
  return 'Good evening,';
}

export function MemberCard({ member }: { member: Member }) {
  const { nextTier } = member;
  const progress = nextTier ? Math.min(member.points / nextTier.pointsRequired, 1) : 1;
  const pointsToGo = nextTier ? Math.max(nextTier.pointsRequired - member.points, 0) : 0;
  const points = member.points.toLocaleString('en-AU');

  return (
    <View
      style={styles.card}
      accessible
      accessibilityLabel={`${member.firstName} ${member.lastName}, ${member.tier} member. ${points} points.${
        nextTier ? ` ${pointsToGo} points to ${nextTier.name}.` : ''
      }`}
    >
      <Glow />
      <View style={styles.top}>
        <View>
          <AppText variant="small" color={colors.white} style={styles.dim}>
            {greeting(new Date().getHours())}
          </AppText>
          <AppText variant="title" color={colors.white}>
            {member.firstName} {member.lastName}
          </AppText>
        </View>
        <View style={styles.tier}>
          <Icon name="star" size={13} color={colors.card} fill={colors.card} />
          <AppText variant="label" color={colors.card} style={styles.tierText}>
            {member.tier}
          </AppText>
        </View>
      </View>

      <View>
        <AppText variant="small" color={colors.white} style={styles.dim}>
          Points balance
        </AppText>
        <View style={styles.pointsRow}>
          <AppText style={styles.points} color={colors.white}>
            {points}
          </AppText>
          <AppText variant="bodyStrong" color={colors.white} style={styles.dim}>
            pts
          </AppText>
        </View>
      </View>

      <View style={styles.progress}>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progress * 100}%` }]} />
        </View>
        <View style={styles.progressLabels}>
          <AppText variant="caption" color={colors.white} style={styles.dim}>
            {nextTier ? `${pointsToGo.toLocaleString('en-AU')} pts to ${nextTier.name}` : 'Top tier reached'}
          </AppText>
          <AppText variant="caption" color={colors.white} style={styles.faint}>
            Member #{member.memberNumber}
          </AppText>
        </View>
      </View>
    </View>
  );
}

/** Soft red/gold glow in the corner. RN has no CSS blur, so it's radial gradients. */
function Glow() {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <RadialGradient id="red" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={colors.red} stopOpacity={0.75} />
          <Stop offset="1" stopColor={colors.red} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="gold" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={colors.mustard} stopOpacity={0.6} />
          <Stop offset="1" stopColor={colors.mustard} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx="88%" cy="5%" r="170" fill="url(#red)" />
      <Circle cx="100%" cy="85%" r="130" fill="url(#gold)" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: 22,
    paddingBottom: 20,
    gap: 18,
    overflow: 'hidden',
    shadowColor: '#1A0D05',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  tier: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.mustard,
    paddingLeft: 10,
    paddingRight: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  tierText: { fontSize: 12, letterSpacing: 1 },
  pointsRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  points: { fontFamily: fonts.display, fontSize: 46, lineHeight: 54, letterSpacing: -1.4 },
  dim: { opacity: 0.7 },
  faint: { opacity: 0.5, fontFamily: fonts.regular },
  progress: { gap: 8 },
  track: { height: 8, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.14)', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.mustard },
  // Wraps onto two lines instead of colliding at large text sizes.
  progressLabels: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', columnGap: 12 },
});
