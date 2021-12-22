/**
 * Convert a byte array to a hex string.
 *
 * @param byteArray - The byte array to convert.
 * @returns - The hex string.
 * @see {@link https://stackoverflow.com/a/44608819|Stack Overflow}
 */
export function toHexString(byteArray: Uint8Array): string {
  let s = "";
  byteArray.forEach(function (byte) {
    s += ("0" + (byte & 0xff).toString(16)).slice(-2);
  });
  return s;
}

/**
 * Convert a hex encoded string to a uint8 array
 *
 * @param hexString - The hex-encoded string to convert.
 * @returns - The byte array, or null if the hex string was invalid
 */
export function fromHexString(hexString: string): Uint8Array | null {
  // sanity check the input is valid hex and not empty
  if (!hexString.match(/^[0-9a-fA-F]+$/)) {
    return null;
  }

  const matches = hexString.toLowerCase().match(/[0-9a-f]{1,2}/g);
  if (!matches) {
    // this should never happen as we sanity checked the input, therefore we
    // throw an error indicating it was unexpected
    throw new Error(
      `Unexpected error, hex string '${hexString}' could not be converted to bytes`
    );
  }

  return new Uint8Array(matches.map((byte) => parseInt(byte, 16)));
}
