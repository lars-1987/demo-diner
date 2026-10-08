import { StyleSheet, Text, type TextProps } from 'react-native';

import { colors, fonts } from '@/theme';

const variants = StyleSheet.create({
  display: { fontFamily: fonts.display, fontSize: 32, lineHeight: 36, letterSpacing: -0.6 },
  title: { fontFamily: fonts.display, fontSize: 22, lineHeight: 28, letterSpacing: -0.3 },
  heading: { fontFamily: fonts.displaySemi, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 22 },
  small: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16 },
  label: { fontFamily: fonts.bold, fontSize: 11, lineHeight: 14, letterSpacing: 0.4, textTransform: 'uppercase' },
});

export type TextVariant = keyof typeof variants;

// Large headings are already big, so they grow less with the system text size.
const DEFAULT_MAX_SCALE: Partial<Record<TextVariant, number>> = { display: 1.3, title: 1.3 };
const BODY_MAX_SCALE = 1.6;

interface AppTextProps extends TextProps {
  variant?: TextVariant;
  color?: string;
}

/**
 * Respects the system text size (Dynamic Type), capped per variant so layouts
 * hold up. Uncapped, the largest accessibility sizes clipped headings.
 */
export function AppText({ variant = 'body', color = colors.ink, style, maxFontSizeMultiplier, ...rest }: AppTextProps) {
  return (
    <Text
      {...rest}
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? DEFAULT_MAX_SCALE[variant] ?? BODY_MAX_SCALE}
      style={[variants[variant], { color }, style]}
    />
  );
}
