import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, fonts } from '@/theme';
import { AppText } from './AppText';

type Variant = 'primary' | 'secondary';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  /** Shows a spinner and blocks presses, e.g. while a request is in flight. */
  loading?: boolean;
  accessibilityHint?: string;
  style?: ViewStyle;
}

export function Button({ label, onPress, variant = 'primary', disabled, loading, accessibilityHint, style }: ButtonProps) {
  const inactive = disabled || loading;
  const primary = variant === 'primary';
  const textColor = disabled ? colors.muted : primary ? colors.white : colors.ink;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      style={({ pressed }) => [
        styles.base,
        primary ? styles.primary : styles.secondary,
        disabled && styles.disabled,
        loading && styles.loading,
        pressed && styles.pressed,
        style,
      ]}
    >
      <View style={styles.content}>
        {loading && <ActivityIndicator color={textColor} />}
        <AppText style={[styles.label, { color: textColor }]}>{label}</AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    borderRadius: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.red,
    shadowColor: colors.red,
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  disabled: {
    backgroundColor: colors.skeleton,
    borderColor: colors.skeleton,
    shadowOpacity: 0,
    elevation: 0,
  },
  loading: { opacity: 0.85 },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.92 },
  content: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 20 },
});
