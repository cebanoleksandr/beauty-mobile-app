/* eslint-disable no-bitwise -- UTF-8 decoding is bit manipulation */
/**
 * stompjs needs TextEncoder/TextDecoder. Hermes ships TextEncoder; TextDecoder
 * is missing on some versions, so install a minimal UTF-8 one when absent.
 */
class Utf8Decoder {
  readonly encoding = 'utf-8';

  decode(input?: ArrayBuffer | ArrayBufferView): string {
    if (!input) return '';
    const bytes =
      input instanceof ArrayBuffer
        ? new Uint8Array(input)
        : new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
    let out = '';
    for (let i = 0; i < bytes.length; ) {
      const b = bytes[i++];
      let cp: number;
      if (b < 0x80) cp = b;
      else if (b < 0xe0) cp = ((b & 0x1f) << 6) | (bytes[i++] & 0x3f);
      else if (b < 0xf0) cp = ((b & 0x0f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f);
      else cp = ((b & 0x07) << 18) | ((bytes[i++] & 0x3f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f);
      out += String.fromCodePoint(cp);
    }
    return out;
  }
}

export function ensureTextCodec(): void {
  const g = globalThis as { TextDecoder?: unknown };
  if (typeof g.TextDecoder === 'undefined') g.TextDecoder = Utf8Decoder;
}

export { Utf8Decoder };
