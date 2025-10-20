import { assert, Field, Gadgets, Provable, UInt64 } from "o1js";

// Source https://github.com/zksecurity/mina-attestations/blob/61b9bb0ee3c547bf2b5582dbeb729cf67517e791/src/credentials/gadgets.ts#L21-L63

function rangeCheck(x: Field, bits: 8 | 16 | 32 | 64) {
  switch (bits) {
    case 8:
      Gadgets.rangeCheck8(x);
      break;
    case 16:
      Gadgets.rangeCheck16(x);
      break;
    case 32:
      Gadgets.rangeCheck32(x);
      break;
    case 64:
      UInt64.check(UInt64.Unsafe.fromField(x));
      break;
  }
}

/**
 * Pack a list of fields of bit size `chunkSize` each into a single field.
 * Uses little-endian encoding.
 *
 * **Warning**: Assumes, but doesn't prove, that each chunk fits in the chunk size.
 */
export function pack(chunks: Field[], chunkSize: number) {
  let p = chunks.length * chunkSize;
  // #TODO change assert for case with 4 62 values
  //   assert(
  //     chunks.length <= 1 || p < Field.sizeInBits,
  //     `pack(): too many chunks, got ${chunks.length} * ${chunkSize} = ${p}`
  //   );
  let sum = Field(0);
  chunks.forEach((chunk, i) => {
    sum = sum.add(chunk.mul(1n << BigInt(i * chunkSize)));
  });
  return sum.seal();
}

/**
 * Unpack a field into a list of fields of bit size `chunkSize` each.
 * Uses little-endian encoding.
 *
 * Proves that the output fields have at most `chunkSize` bits.
 */
export function unpack(
  word: Field,
  chunkSize: 8 | 16 | 32 | 64,
  numChunks: number
) {
  let chunks = Provable.witnessFields(numChunks, () => {
    let x = word.toBigInt();
    let mask = (1n << BigInt(chunkSize)) - 1n;
    return Array.from(
      { length: numChunks },
      (_, i) => (x >> BigInt(i * chunkSize)) & mask
    );
  });
  // range check fields, so decomposition is unique and outputs are in range
  chunks.forEach((chunk) => rangeCheck(chunk, chunkSize));

  // check decomposition
  // this asserts that the composition doesn't overflow
  pack(chunks, chunkSize).assertEquals(word);

  return chunks;
}
