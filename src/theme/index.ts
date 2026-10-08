import type { OfferArtwork } from '@/api';

/**
 * Tokens from the Figma mockup. Red, green and amber are a shade darker than
 * the mockup so text and pills meet WCAG AA (4.5:1) contrast.
 */
export const colors = {
  bg: '#FAF6F0',
  surface: '#FFFFFF',
  ink: '#1A1614',
  muted: '#6E6560',
  line: '#ECE5DC',
  red: '#C8291F',
  redTint: '#FCE7E3',
  mustard: '#F5B83D',
  amber: '#8F5B05',
  mustardTint: '#FEF1D6',
  green: '#137049',
  greenTint: '#DBF2E8',
  card: '#1F1A17',
  skeleton: '#ECE5DC',
  skeletonSoft: '#F4EFE8',
  white: '#FFFFFF',
} as const;

export const fonts = {
  display: 'BricolageGrotesque_700Bold',
  displaySemi: 'BricolageGrotesque_600SemiBold',
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  semibold: 'DMSans_600SemiBold',
  bold: 'DMSans_700Bold',
} as const;

export const radius = { sm: 10, md: 16, lg: 20, xl: 28, pill: 999 } as const;

export const artworkColors: Record<OfferArtwork, { bg: string; fg: string }> = {
  burger: { bg: '#FCE7E3', fg: '#C8291F' },
  shake: { bg: '#FEF1D6', fg: '#8F5B05' },
  gift: { bg: '#1F1A17', fg: '#F5B83D' },
  sundae: { bg: '#FCE3ED', fg: '#D13878' },
  pint: { bg: '#E3EBFC', fg: '#3866D1' },
};
