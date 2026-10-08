// jsbarcode ships no types for its encoder modules; see src/types/jsbarcode.d.ts.
import { CODE128 } from 'jsbarcode/bin/barcodes/CODE128';
import { useMemo } from 'react';
import Svg, { Rect } from 'react-native-svg';

import { colors } from '@/theme';

interface Bar {
  x: number;
  width: number;
}

/**
 * Encode a value as Code 128 and return the bar runs in module units.
 * jsbarcode gives a string of 1s (bar) and 0s (space); consecutive 1s are
 * merged into a single rect so the SVG stays small.
 */
export function encodeCode128(value: string): { bars: Bar[]; modules: number } {
  const encoder = new CODE128(value, {});
  if (!encoder.valid()) throw new Error(`Cannot encode "${value}" as Code 128`);
  const binary = encoder.encode().data;

  const bars: Bar[] = [];
  let i = 0;
  while (i < binary.length) {
    if (binary[i] === '1') {
      const start = i;
      while (binary[i] === '1') i++;
      bars.push({ x: start, width: i - start });
    } else {
      i++;
    }
  }
  return { bars, modules: binary.length };
}

interface BarcodeProps {
  value: string;
  height?: number;
  color?: string;
}

/** Scales to its container's width. Scanners need the quiet zone, so keep padding around it. */
export function Barcode({ value, height = 104, color = colors.ink }: BarcodeProps) {
  const { bars, modules } = useMemo(() => encodeCode128(value), [value]);
  return (
    <Svg
      width="100%"
      height={height}
      viewBox={`0 0 ${modules} ${height}`}
      preserveAspectRatio="none"
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Barcode for code ${value.split('').join(' ')}`}
      testID="barcode"
    >
      {bars.map((bar) => (
        <Rect key={bar.x} x={bar.x} y={0} width={bar.width} height={height} fill={color} />
      ))}
    </Svg>
  );
}
