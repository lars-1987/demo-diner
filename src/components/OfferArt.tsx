import { StyleSheet, View } from 'react-native';

import type { OfferArtwork } from '@/api';
import { artworkColors } from '@/theme';
import { Icon } from './Icon';

interface OfferArtProps {
  artwork: OfferArtwork;
  size?: number;
  muted?: boolean;
}

/** Coloured tile with the offer's icon. Stands in for food photography. */
export function OfferArt({ artwork, size = 72, muted }: OfferArtProps) {
  const { bg, fg } = artworkColors[artwork];
  return (
    <View
      style={[
        styles.tile,
        { width: size, height: size, borderRadius: size / 4, backgroundColor: bg, opacity: muted ? 0.5 : 1 },
      ]}
    >
      <View
        style={[
          styles.blob,
          { width: size * 0.78, height: size * 0.78, borderRadius: size, backgroundColor: fg, left: size / 2, top: -size / 4 },
        ]}
      />
      <Icon name={artwork} size={size * 0.47} color={fg} strokeWidth={1.75} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  blob: { position: 'absolute', opacity: 0.12 },
});
