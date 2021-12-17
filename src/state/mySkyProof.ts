import { bnToBuf } from "../utils/bigint";
import { k12 } from "@noble/hashes/lib/sha3-addons";
import compare from "buffer-compare";
import { MySky } from "skynet-js";
import { fromHexString } from "../utils/strings";
import { toHexString } from "skynet-js/dist/cjs/utils/string";

export const dataDomain = "localhost";

export type MySkyProof = {
  version: string;
  nonce: string;
  myskyid: string;
  signature: string;
};

const PROOF_VERSION_V1 = 1;
const PROOF_VERSION_V1_STR = "MySkyID-PoW-v1";

const PROOF_TARGET = new Uint8Array([
  0, 0, 2, 79, 134, 217, 6, 168, 28, 68, 106, 164, 207, 53, 55, 178, 24, 81,
  162, 117, 144, 30, 90, 200, 147, 120, 124, 181, 32, 216, 184, 223,
]);

const PROOF_HASH_IDENTIFIER = "MySkyProof";

const PATH_MYSKY_PROOF = `${dataDomain}/myskyproof.json`;

export class MySkyProofGenerator {
  private nonce: bigint;
  private target: Buffer;
  private version: number = PROOF_VERSION_V1;

  constructor() {
    this.nonce = BigInt(0);
    this.target = Buffer.from(PROOF_TARGET);
  }

  public async generate(mySky: MySky): Promise<MySkyProof> {
    // try and fetch the proof
    const res = await mySky.getJSONEncrypted(PATH_MYSKY_PROOF);
    if (res.data) {
      // TODO: add validation
      return res.data as MySkyProof;
    }

    // fetch the user's MySky ID
    const mySkyId = await mySky.userID();
    const pubkey = fromHexString(mySkyId);
    if (!pubkey) {
      throw new Error("invalid mysky id");
    }

    // do the work
    let proofBytes: Uint8Array;
    while (true) {
      // generate a new proof
      proofBytes = this.proofBytes(pubkey);
      const pow = Buffer.from(this.proofHash(proofBytes));

      // if we have not hit the target yet, increase nonce and continue
      if (compare(this.target, pow) <= 0) {
        this.nonce = this.nonce + BigInt(1);
        continue;
      }

      // we found a nonce that exceeds our target
      break;
    }

    // create the signature
    const signature = await mySky.signMessage(proofBytes);

    // construct the proof
    const proof = {
      version: PROOF_VERSION_V1_STR,
      nonce: this.nonce.toString(),
      myskyid: mySkyId,
      signature: toHexString(signature),
    };

    // save it and return it
    await mySky.setJSONEncrypted(PATH_MYSKY_PROOF, proof);
    return proof;
  }

  private proofHash(proofBytes: Uint8Array): Uint8Array {
    return k12(proofBytes, { personalization: PROOF_HASH_IDENTIFIER });
  }

  private proofBytes(publicKey: Uint8Array): Uint8Array {
    // create the nonce
    const nonce = new Uint8Array(8);
    nonce.set(bnToBuf(this.nonce));

    // create the byte representation of the proof
    const b = new Uint8Array(1 + nonce.length + publicKey.length);
    b.set(new Uint8Array([this.version]), 0);
    b.set(nonce, 1);
    b.set(publicKey, 1 + nonce.length);
    return b;
  }
}