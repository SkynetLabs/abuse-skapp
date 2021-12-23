import { bnToBuf } from "../utils/bigint";
import { k12 } from "@noble/hashes/lib/sha3-addons";
import compare from "buffer-compare";
import { MySky } from "skynet-js";
import { fromHexString, toHexString } from "../utils/strings";


export type MySkyProof = {
  version: string;
  nonce: string;
  myskyid: string;
  signature: string;
};

// PROOF_VERSION_V1 is the first version of the proof
const PROOF_VERSION_V1 = 1;

// PROOF_VERSION_V1_STR is the first version of the proof as string
const PROOF_VERSION_V1_STR = "MySkyID-PoW-v1";

// PROOF_TARGET is the target for the PoW
const PROOF_TARGET = new Uint8Array([
  0, 0, 2, 85, 134, 217, 6, 168, 28, 68, 106, 164, 207, 53, 55, 178, 24, 81,
  162, 117, 144, 30, 90, 200, 147, 120, 124, 181, 32, 216, 184, 223,
]);

// PROOF_HASH_IDENTIFIER is the personalization used in the K12 hashing algo
const PROOF_HASH_IDENTIFIER = "MySkyProof";

// PATH_MYSKY_PROOF is the path of the MySky proof
// TODO: temporarily disabled 
// export const dataDomain = "localhost]";
// const PATH_MYSKY_PROOF = `${dataDomain}/myskyproof.json`;

export class MySkyProofGenerator {
  private nonce: bigint;
  private target: Buffer;
  private version: number = PROOF_VERSION_V1;

  constructor() {
    this.nonce = BigInt(0);
    this.target = Buffer.from(PROOF_TARGET);
  }

  public async generate(mySky: MySky): Promise<MySkyProof> {
    const mySkyId = await mySky.userID();

    // fetch proof from local storage
    const proofStr = localStorage.getItem(`${mySkyId}-MySky-PoW`);
    if (proofStr) {
      return JSON.parse(proofStr) as MySkyProof;
    }

    // try and fetch the proof
    // const res = await mySky.getJSONEncrypted(PATH_MYSKY_PROOF);
    // if (res.data) {
    //   // TODO: add validation
    //   return res.data as MySkyProof;
    // }

    // register the start
    const start = new Date().getTime();

    // fetch the user's MySky ID
    const pubkey = fromHexString(mySkyId);
    if (!pubkey) {
      throw new Error("invalid mysky id");
    }

    // do the work
    let cnt = 0;
    let proofBytes: Uint8Array;
    while (true) {
      cnt++;

      // generate a new proof
      proofBytes = this.proofBytes(pubkey);
      const pow = Buffer.from(this.proofHash(proofBytes));

      // if we have not hit the target yet, increase nonce and continue
      if (compare(this.target, pow) <= 0) {
        this.nonce = this.nonce + BigInt(1);
        if (cnt % 1e6 === 0) {
          console.log("still churning, current nonce", this.nonce);
        }
        continue;
      }

      // we found a nonce that exceeds our target
      break;
    }

    // log the time it took
    const end = new Date().getTime();
    const elapsed = Math.round((end - start) / 1000);
    console.log(`took ${elapsed}s`);

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
    localStorage.setItem(`${mySkyId}-MySky-PoW`, JSON.stringify(proof));
    // await mySky.setJSONEncrypted(PATH_MYSKY_PROOF, proof);
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
