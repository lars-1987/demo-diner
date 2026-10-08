declare module 'jsbarcode/bin/barcodes/CODE128' {
  /** Code 128 with automatic A/B/C set selection. `encode()` mutates internal state: call it once. */
  export class CODE128 {
    constructor(data: string, options: object);
    valid(): boolean;
    encode(): { data: string; text: string };
  }
}
