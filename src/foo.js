const { sign }= require('tweetnacl')
const { k12}  = require('@noble/hashes/lib/sha3-addons');
const compare = require('buffer-compare');



function fromHexString(hexString) {
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
  
function signedToArray(bigint, littleEndian) {
    const bits = bigint.bitLength
    const width = Math.max(1n, bits / 8n + BigInt(bits % 8n !== 0n)) * 8n
    const result = new Uint8Array(width)
    new DataView(result.buffer).setBigIntN(bits, width, bigint, littleEndian)
    return result
}

function unsignedToArray(bigint, littleEndian) {
    const bits = bigint.bitLength - 1
    const width = Math.max(1n, bits / 8n + BigInt(bits % 8n !== 0n)) * 8n
    const result = new Uint8Array(width)
    new DataView(result.buffer).setBigUintN(bits, 0, bigint, littleEndian)
    return result
}

const big0 = BigInt(0)
const big1 = BigInt(1)
const big8 = BigInt(8)
function bigToUint8Array(big) {
    if (big < big0) {
      const bits = (BigInt(big.toString(2).length) / big8 + big1) * big8
      const prefix1 = big1 << bits
      big += prefix1
    }
    let hex = big.toString(16)
    if (hex.length % 2) {
      hex = '0' + hex
    }
    const len = hex.length / 2
    const u8 = new Uint8Array(len)
    var i = 0
    var j = 0
    while (i < len) {
      u8[i] = parseInt(hex.slice(j, j + 2), 16)
      i += 1
      j += 2
    }
    return u8
  }

  function bnToBuf(bn) {
    var hex = BigInt(bn).toString(16);
    if (hex.length % 2) { hex = '0' + hex; }
  
    var len = hex.length / 2;
    var u8 = new Uint8Array(len);
  
    var i = 0;
    var j = 0;
    while (i < len) {
      u8[i] = parseInt(hex.slice(j, j+2), 16);
      i += 1;
      j += 2;
    }
  
    return u8;
  }

class MySkyProof {
    version;
    pubkey;
    secretkey;
    target;
    nonce = BigInt(0)
    nonceBytes;

    constructor(publicKey, secretKey, target) {
        this.version = 1;
        this.pubkey = publicKey
        this.secretkey = secretKey
        this.target = target
    }

    bytes() {
        let nonce;
        if (this.nonceBytes) {
            nonce = this.nonceBytes
        } else {
            nonce = new Uint8Array(8)
            nonce.set(bnToBuf(this.nonce).reverse())
        }

        let offset = 0;
        const b = new Uint8Array(1+nonce.length+this.pubkey.length)
        b.set(new Uint8Array([this.version]), offset)
        offset++
        b.set(nonce, offset)
        offset+= nonce.length
        b.set(this.pubkey, offset)
        return b
    }

    hashProof(proof) {
        return k12(proof, {personalization: "MySkyProof"})
    }

    pow() {
        let proofBytes;
        let workBytes;

        let start = new Date().getTime();
        let insufficientWork = true;
        let cnt =0;
        while (insufficientWork) {
            proofBytes = this.bytes();
            workBytes = this.hashProof(proofBytes)

            const workBuff = Buffer.from(workBytes)
            const targetBuff = Buffer.from(this.target)
            if (compare(targetBuff, workBuff) <= 0) {
                // increase nonce
                this.nonce = this.nonce + BigInt(1)
            } else {
                insufficientWork = false;
            }
            cnt++
            
            // if (cnt > 5) break;
            if (cnt % 10000 == 0) {
                // console.log('current nonce', bnToBuf(this.nonce))
            }
        }
        const elapsed = Math.round(((new Date().getTime())-start)/1000)
        console.log('YAY', cnt, elapsed, this.nonce)
    }
}

const target = new Uint8Array([
    0, 0, 2, 85, 134, 217, 6, 168, 28, 68, 106, 164, 207, 53, 55, 178, 24, 81, 162, 117, 144, 30, 90, 200, 147, 120, 124, 181, 32, 216, 184, 223]
)
// const { publicKey, secretKey } = sign.keyPair.fromSeed(new Uint8Array([0, 0,
// 2, 79, 134, 217, 6, 168, 28, 68, 106, 164, 207, 53, 55, 178, 24, 81, 162,
// 117, 144, 30, 90, 200, 147, 120, 124, 181, 32, 216, 184, 223]))

// console.log("PK", publicKey)
// console.log("SK", secretKey)

// const publicKey = new Uint8Array([165,
//     246,
//     208,
//     148,
//     57,
//     179,
//     131,
//     225,
//     220,
//     34,
//     37,
//     72,
//     171,
//     72,
//     47,
//     167,
//     196,
//     155,
//     192,
//     209,
//     166,
//     177,
//     238,
//     247,
//     182,
//     59,
//     170,
//     81,
//     31,
//     74,
//     194,
//     136]
// )
// const secretKey = new Uint8Array()
// const proof = new MySkyProof(publicKey, secretKey, target)
// proof.pow()
// return;

while(true) {
  const { publicKey, secretKey } = sign.keyPair()
  const proof2 = new MySkyProof(publicKey, secretKey, target)
  proof2.pow()
}
console.log("proofbytes", proof2.bytes())
console.log("publickey", fromHexString("5ecbb378165b664c0480ec39d12babceb5f193d65b49162547992b39d8404db3") )
// console.log(unsignedToArray(BigInt(6128653), true))
// const tmp = BigInt(21978884)
// console.log(bigToUint8Array(tmp))
// console.log(new BigInt64Array([BigInt(21978884)]).buffer)
// proof2.pow()
// proof2.
// proof2.nonceBytes =  new Uint8Array([
//     186, 249, 103, 1, 0, 0, 0, 0]
// )
// console.log("proof", proof2.bytes())
// console.log("work", k12(proof2.bytes(), {personalization: "MySkyProof"}))

