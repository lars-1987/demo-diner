import { StyleSheet, View } from 'react-native';

import { useAnnounce } from '@/hooks/useAnnounce';
import { colors, radius } from '@/theme';
import { AppText } from './AppText';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';

interface ErrorStateProps {
  title: string;
  message: string;
  onRetry?: () => void;
  retrying?: boolean;
  retryLabel?: string;
}

/** Full-area error: nothing useful could load. */
export function ErrorState({ title, message, onRetry, retrying, retryLabel = 'Try again' }: ErrorStateProps) {
  useAnnounce(`${title}. ${message}`);
  return (
    <View style={styles.full} accessibilityLiveRegion="polite">
      <IconBadge icon="wifi-off" size={96} bg={colors.redTint} fg={colors.red} />
      <AppText variant="title" style={[styles.center, styles.fullTitle]} accessibilityRole="header">
        {title}
      </AppText>
      <AppText color={colors.muted} style={styles.center}>
        {message}
      </AppText>
      {onRetry && <Button label={retryLabel} onPress={onRetry} loading={retrying} style={styles.fullButton} />}
    </View>
  );
}

/** Section-scoped error: the rest of the screen still works. */
export function InlineError({ title, message, onRetry, retrying, retryLabel = 'Try again' }: ErrorStateProps) {
  useAnnounce(`${title}. ${message}`);
  return (
    <View style={styles.inline} accessibilityLiveRegion="polite">
      <View style={styles.inlineRow}>
        <Icon name="alert" size={22} color={colors.red} />
        <View style={styles.flex}>
          <AppText variant="heading">{title}</AppText>
          <AppText variant="small" color={colors.muted}>
            {message}
          </AppText>
        </View>
      </View>
      {onRetry && <Button label={retryLabel} variant="secondary" onPress={onRetry} loading={retrying} />}
    </View>
  );
}

interface EmptyStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  actionLoading?: boolean;
}

export function EmptyState({ title, message, actionLabel, onAction, actionLoading }: EmptyStateProps) {
  return (
    <View style={styles.empty}>
      <IconBadge icon="ticket" size={72} bg={colors.mustardTint} fg={colors.amber} />
      <AppText variant="heading" style={[styles.center, styles.emptyTitle]}>
        {title}
      </AppText>
      <AppText variant="small" color={colors.muted} style={styles.center}>
        {message}
      </AppText>
      {actionLabel && onAction && (
        <Button label={actionLabel} variant="secondary" onPress={onAction} loading={actionLoading} style={styles.emptyButton} />
      )}
    </View>
  );
}

function IconBadge({ icon, size, bg, fg }: { icon: IconName; size: number; bg: string; fg: string }) {
  return (
    <View style={[styles.badge, { width: size, height: size, backgroundColor: bg }]}>
      <Icon name={icon} size={size * 0.42} color={fg} strokeWidth={1.75} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 4 },
  center: { textAlign: 'center' },
  badge: { borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  full: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36, gap: 12 },
  fullTitle: { fontSize: 26, lineHeight: 30, marginTop: 8 },
  fullButton: { marginTop: 14, minWidth: 200 },
  inline: {
    gap: 14,
    padding: 20,
    borderRadius: radius.xl - 4,
    backgroundColor: 'rgba(252, 231, 227, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(200, 41, 31, 0.18)',
  },
  inlineRow: { flexDirection: 'row', gap: 12 },
  empty: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 28,
    borderRadius: radius.xl - 4,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.line,
  },
  emptyTitle: { fontSize: 20, lineHeight: 26, marginTop: 6 },
  emptyButton: { marginTop: 10, minWidth: 150 },
});
