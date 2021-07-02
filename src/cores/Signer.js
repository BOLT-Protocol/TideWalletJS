const BN = require("bn.js");
const cryptography = require("ethereum-cryptography/secp256k1");
const { ecdsaSign } = cryptography;

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
 * @param {msgHash} Buffer
 * @param {privateKey} Buffer
 * @param {chainId} number
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
 * Attempts to turn a value into a `Buffer`.
 * Inputs supported: `Buffer`, `String`, `Number`, null/undefined, `BN` and other objects with a `toArray()` or `toBuffer()` method.
 * @param v the value
 */
const toBuffer = function (v) {
  if (v === null || v === undefined) {
    return Buffer.allocUnsafe(0);
  }

  if (Buffer.isBuffer(v)) {
    return Buffer.from(v);
  }

  if (Array.isArray(v) || v instanceof Uint8Array) {
    return Buffer.from(v);
  }

  if (typeof v === "string") {
    if (!isHexString(v)) {
      throw new Error(
        `Cannot convert string to buffer. toBuffer only supports 0x-prefixed hex strings and this string was given: ${v}`
      );
    }
    return Buffer.from(padToEven(stripHexPrefix(v)), "hex");
  }

  if (typeof v === "number") {
    return intToBuffer(v);
  }

  if (BN.isBN(v)) {
    return v.toArrayLike(Buffer);
  }

  if (v.toArray) {
    // converts a BN to a Buffer
    return Buffer.from(v.toArray());
  }

  if (v.toBuffer) {
    return Buffer.from(v.toBuffer());
  }

  throw new Error("invalid type");
};

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
  static instance;

  constructor() {
    if (!Signer.instance) {
      this._paperWallet = null;
      Signer.instance = this;
    }

    return Signer.instance;
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

  async sign({ keyPath, data }) {
    return this._TideWalletcore.signBuffer({ keyPath, data });
  }
}

module.exports = Signer;
