const BN = require("bn.js");
const cryptography = require("ethereum-cryptography/secp256k1");
const { ecdsaSign } = cryptography;

const { isUint, toDER, bip66encode, toBuffer } = require('../helpers/utils');

const ZERO32 = Buffer.alloc(32, 0);
const EC_GROUP_ORDER = Buffer.from(
  "fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141",
  "hex"
);

const THROW_BAD_HASH = "Expected Hash";
const THROW_BAD_PRIVATE = "Expected Private";

/**
 * Type output options
 */
const TypeOutput = Object.freeze({
  Number: Symbol("Number"),
  BN: Symbol("BN"),
  Buffer: Symbol("Buffer"),
  PrefixedHexString: Symbol("PrefixedHexString"),
});

/**
 * RLP encode ETH Transation
 * @method ecsign
 * @param {Buffer} msgHash
 * @param {Buffer} privateKey
 * @param {number} chainId
 * @returns {ECDSASignature} Returns the ECDSA signature of a message hash.
 */
function ecsign(msgHash, privateKey, chainId) {
  const { signature, recid: recovery } = ecdsaSign(msgHash, privateKey);
  const r = Buffer.from(signature.slice(0, 32));
  const s = Buffer.from(signature.slice(32, 64));

  if (!chainId || typeof chainId === "number") {
    // return legacy type ECDSASignature (deprecated in favor of ECDSASignatureBuffer to handle large chainIds)
    if (chainId && !Number.isSafeInteger(chainId)) {
      throw new Error(
        "The provided number is greater than MAX_SAFE_INTEGER (please use an alternative input type)"
      );
    }
    const v = chainId ? recovery + (chainId * 2 + 35) : recovery + 27;
    return { r, s, v };
  }
  const chainIdBN = toType(chainId, TypeOutput.BN);
  const v = chainIdBN.muln(2).addn(35).addn(recovery).toArrayLike(Buffer);
  return { r, s, v };
}

/**
 * Convert an input to a specified type
 * @param input value to convert
 * @param outputType type to output
 */
const toType = function (input, outputType) {
  if (typeof input === "string" && !isHexString(input)) {
    throw new Error(
      `A string must be provided with a 0x-prefix, given: ${input}`
    );
  } else if (typeof input === "number" && !Number.isSafeInteger(input)) {
    throw new Error(
      "The provided number is greater than MAX_SAFE_INTEGER (please use an alternative input type)"
    );
  }

  input = toBuffer(input);

  if (outputType === TypeOutput.Buffer) {
    return input;
  } else if (outputType === TypeOutput.BN) {
    return new BN(input);
  } else if (outputType === TypeOutput.Number) {
    const bn = new BN(input);
    const max = new BN(Number.MAX_SAFE_INTEGER.toString());
    if (bn.gt(max)) {
      throw new Error(
        "The provided number is greater than MAX_SAFE_INTEGER (please use an alternative output type)"
      );
    }
    return bn.toNumber();
  } else {
    // outputType === TypeOutput.PrefixedHexString
    return `0x${input.toString("hex")}`;
  }
};
class Signer {
  constructor() {
    return this;
  }

  /**
   * init
   * @param {TideWalletcore} TideWalletcore
   * @returns
   */
  init(TideWalletcore) {
    this._TideWalletcore = TideWalletcore;
  }

  static _isScalar(x) {
    return x.length == 32;
  }

  static _compare(a, b) {
    const aa = new BN(a);
    const bb = new BN(b);
    if (aa.eq(bb)) return 0;
    if (aa.gt(bb)) return 1;
    return -1;
  }

  static _isPrivate(x) {
    if (!Signer._isScalar(x)) return false;
    return (
      Signer._compare(x, ZERO32) > 0 && // > 0
      Signer._compare(x, EC_GROUP_ORDER) < 0
    ); // < G
  }

  static _sign(hashData, privateKey) {
    if (!Buffer.isBuffer(hashData) || !Signer._isScalar(hashData))
      throw new Error(THROW_BAD_HASH);
    if (!Buffer.isBuffer(privateKey) || !Signer._isPrivate(privateKey))
      throw new Error(THROW_BAD_PRIVATE);

    const sig = ecsign(hashData, privateKey);
    return sig;
  }

  /**
   * 
   * @param {Buffer} signature 
   * @param {Number} hashType 
   * @returns 
   */
  static encodeSignature(signature, hashType) {
    if (!isUint(hashType, 8)) throw new Error("Invalid hasType $hashType");
    if (signature.length != 64) throw new Error("Invalid signature");
    const hashTypeMod = hashType & ~0x80;
    if (hashTypeMod <= 0 || hashTypeMod >= 4)
      throw new new Error('Invalid hashType $hashType');

    const hashTypeBuffer = Buffer.alloc(1);
    hashTypeBuffer.writeInt8(hashType, 0);
    const r = toDER(signature.slice(0, 32));
    const s = toDER(signature.slice(32, 64));
    let combine = bip66encode(r, s);
    combine = Buffer.concat([combine, hashTypeBuffer]);
    return combine;
  }

  async sign({ keyPath, data }) {
    return this._TideWalletcore.signBuffer({ keyPath, data });
  }
}

module.exports = Signer;
