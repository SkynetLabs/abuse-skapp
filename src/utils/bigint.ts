// source: https://coolaj86.com/articles/convert-js-bigints-to-typedarrays/
//
// TODO: we should be using a DataView here
export function bnToBuf(bn: bigint) {
  var hex = BigInt(bn).toString(16);
  if (hex.length % 2) {
    hex = "0" + hex;
  }

  var len = hex.length / 2;
  var u8 = new Uint8Array(len);

  var i = 0;
  var j = 0;
  while (i < len) {
    u8[i] = parseInt(hex.slice(j, j + 2), 16);
    i += 1;
    j += 2;
  }

  // little endian
  return u8.reverse();
}
