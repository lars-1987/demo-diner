import { encodeCode128 } from '../Barcode';

describe('encodeCode128', () => {
  // Every Code 128 symbol is 11 modules wide, except the 13-module stop pattern.
  // Start + 12 data symbols (set B, as the code mixes letters and digits) + checksum + stop.
  it('produces a valid-length Code 128 symbol', () => {
    const { modules } = encodeCode128('DD7K4P92QX81');
    expect((modules - 13) % 11).toBe(0);
    expect(modules).toBeGreaterThanOrEqual(11 * 3 + 13);
  });

  it('starts with a bar and ends with the stop pattern’s final bars', () => {
    const { bars, modules } = encodeCode128('DD7K4P92QX81');
    expect(bars[0].x).toBe(0);
    const last = bars[bars.length - 1];
    // Stop pattern 1100011101011 ends with "11", a 2-module bar at the very end.
    expect(last.x + last.width).toBe(modules);
    expect(last.width).toBe(2);
  });

  it('is deterministic, so the same code always scans the same', () => {
    expect(encodeCode128('DD9HXK2MPW47')).toEqual(encodeCode128('DD9HXK2MPW47'));
  });

  it('rejects characters Code 128 cannot encode', () => {
    expect(() => encodeCode128('DEMO€')).toThrow();
  });
});
