import { StyleSheet, View } from 'react-native';

import { colors, radius } from '@/theme';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

type Tone = 'brand' | 'success' | 'neutral' | 'outline';

const tones: Record<Tone, { bg: string; fg: string; border?: string }> = {
  brand: { bg: colors.redTint, fg: colors.red },
  success: { bg: colors.greenTint, fg: colors.green },
  neutral: { bg: colors.line, fg: colors.muted },
  outline: { bg: colors.surface, fg: colors.ink, border: colors.line },
};

export function Pill({ label, tone = 'brand', icon }: { label: string; tone?: Tone; icon?: IconName }) {
  const t = tones[tone];
  return (
    <View style={[styles.pill, { backgroundColor: t.bg, borderColor: t.border ?? t.bg }]}>
      {icon && <Icon name={icon} size={12} color={t.fg} strokeWidth={2.75} />}
      <AppText variant="label" color={t.fg}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
});
