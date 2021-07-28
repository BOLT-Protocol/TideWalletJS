const BN = require("bn.js");

function randomHex(n) {
  var ID = "";
  var text = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  n = parseInt(n);
  if (!(n > 0)) {
    n = 8;
  }
  while (ID.length < n) {
    ID = ID.concat(text.charAt(parseInt(Math.random() * text.length)));
  }
  return ID;
}

function isUint(value, bit) {
  return value >= 0 && value <= Math.pow(2, bit) - 1;
}

/**
 * @param {Buffer} x
 * @returns
 */
function toDER(x) {
  let input = Buffer.from([...x]);
  const ZERO = Buffer.alloc(1, 0);
  let i = 0;
  while (input[i] == 0) i++;
  if (i == input.length) return ZERO;
  input = input.slice(i);
  const combine = [...ZERO, ...input];
  if ((input[0] & 0x80) != 0) return Buffer.from(combine);
  return input;
}

/**
 *
 * @param {Buffer} r
 * @param {Buffer} s
 * @returns
 */
function bip66encode(r, s) {
  const lenR = r.length;
  const lenS = s.length;
  if (lenR == 0) throw new Error("R length is zero");
  if (lenS == 0) throw new Error("S length is zero");
  if (lenR > 33) throw new Error("R length is too long");
  if (lenS > 33) throw new Error("S length is too long");
  if ((r[0] & 0x80) != 0) throw new Error("R value is negative");
  if ((s[0] & 0x80) != 0) throw new Error("S value is negative");
  if (lenR > 1 && r[0] == 0x00 && (r[1] & 0x80) == 0)
    throw new Error("R value excessively padded");
  if (lenS > 1 && s[0] == 0x00 && (s[1] & 0x80) == 0)
    throw new Error("S value excessively padded");

  var signature = Buffer.alloc(6 + lenR + lenS);

  // 0x30 [total-length] 0x02 [R-length] [R] 0x02 [S-length] [S]
  signature[0] = 0x30;
  signature[1] = signature.length - 2;
  signature[2] = 0x02;
  signature[3] = r.length;
  r.copy(signature, 4);
  signature[4 + lenR] = 0x02;
  signature[5 + lenR] = s.length;
  s.copy(signature, 6 + lenR);
  return signature;
}

function isHexPrefixed(str) {
  if (typeof str !== "string") {
    throw new Error(
      "[is-hex-prefixed] value must be type 'string', is currently type " +
        typeof str +
        ", while checking isHexPrefixed."
    );
  }

  return str.slice(0, 2) === "0x";
}

function stripHexPrefix(str) {
  if (typeof str !== "string") {
    return str;
  }

  return isHexPrefixed(str) ? str.slice(2) : str;
}

/**
 * Pads a `String` to have an even length
 * @param {String} value
 * @return {String} output
 */
function padToEven(value) {
  var a = value; // eslint-disable-line

  if (typeof a !== "string") {
    throw new Error(
      `[ethjs-util] while padding to even, value must be string, is currently ${typeof a}, while padToEven.`
    );
  }

  if (a.length % 2) {
    a = `0${a}`;
  }

  return a;
}

/**
 * Converts a `Number` into a hex `String`
 * @param {Number} i
 * @return {String}
 */
function intToHex(i) {
  var hex = i.toString(16); // eslint-disable-line

  return `0x${hex}`;
}

/**
 * Converts an `Number` to a `Buffer`
 * @param {Number} i
 * @return {Buffer}
 */
function intToBuffer(i) {
  const hex = intToHex(i);

  return new Buffer.from(padToEven(hex.slice(2)), "hex");
}

/**
 * Get the binary size of a string
 * @param {String} str
 * @return {Number}
 */
function getBinarySize(str) {
  if (typeof str !== "string") {
    throw new Error(
      `[ethjs-util] while getting binary size, method getBinarySize requires input 'str' to be type String, got '${typeof str}'.`
    );
  }

  return Buffer.byteLength(str, "utf8");
}

/**
 * Returns TRUE if the first specified array contains all elements
 * from the second one. FALSE otherwise.
 *
 * @param {array} superset
 * @param {array} subset
 *
 * @returns {boolean}
 */
function arrayContainsArray(superset, subset, some) {
  if (Array.isArray(superset) !== true) {
    throw new Error(
      `[ethjs-util] method arrayContainsArray requires input 'superset' to be an array got type '${typeof superset}'`
    );
  }
  if (Array.isArray(subset) !== true) {
    throw new Error(
      `[ethjs-util] method arrayContainsArray requires input 'subset' to be an array got type '${typeof subset}'`
    );
  }

  return subset[(Boolean(some) && "some") || "every"](
    (value) => superset.indexOf(value) >= 0
  );
}

/**
 * Should be called to get utf8 from it's hex representation
 *
 * @method toUtf8
 * @param {String} string in hex
 * @returns {String} ascii string representation of hex value
 */
function toUtf8(hex) {
  const bufferValue = new Buffer.from(
    padToEven(stripHexPrefix(hex).replace(/^0+|0+$/g, "")),
    "hex"
  );

  return bufferValue.toString("utf8");
}

/**
 * Should be called to get ascii from it's hex representation
 *
 * @method toAscii
 * @param {String} string in hex
 * @returns {String} ascii string representation of hex value
 */
function toAscii(hex) {
  var str = ""; // eslint-disable-line
  var i = 0,
    l = hex.length; // eslint-disable-line

  if (hex.substring(0, 2) === "0x") {
    i = 2;
  }

  for (; i < l; i += 2) {
    const code = parseInt(hex.substr(i, 2), 16);
    str += String.fromCharCode(code);
  }

  return str;
}

/**
 * Should be called to get hex representation (prefixed by 0x) of utf8 string
 *
 * @method fromUtf8
 * @param {String} string
 * @param {Number} optional padding
 * @returns {String} hex representation of input string
 */
function fromUtf8(stringValue) {
  const str = new Buffer.from(stringValue, "utf8");

  return `0x${padToEven(str.toString("hex")).replace(/^0+|0+$/g, "")}`;
}

/**
 * Should be called to get hex representation (prefixed by 0x) of ascii string
 *
 * @method fromAscii
 * @param {String} string
 * @param {Number} optional padding
 * @returns {String} hex representation of input string
 */
function fromAscii(stringValue) {
  var hex = ""; // eslint-disable-line
  for (var i = 0; i < stringValue.length; i++) {
    // eslint-disable-line
    const code = stringValue.charCodeAt(i);
    const n = code.toString(16);
    hex += n.length < 2 ? `0${n}` : n;
  }

  return `0x${hex}`;
}
/**
 * Is the string a hex string.
 *
 * @method check if string is hex string of specific length
 * @param {String} value
 * @param {Number} length
 * @returns {Boolean} output the string is a hex string
 */
function isHexString(value, length) {
  if (typeof value !== "string" || !value.match(/^0x[0-9A-Fa-f]*$/)) {
    return false;
  }

  if (length && value.length !== 2 + 2 * length) {
    return false;
  }

  return true;
}

/**
 * Attempts to turn a value into a `Buffer`.
 * Inputs supported: `Buffer`, `String`, `Number`, null/undefined, `BN` and other objects with a `toArray()` or `toBuffer()` method.
 * @param v the value
 */
function toBuffer(v) {
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
    if (!isHexString(v)) return Buffer.from(v, "utf8");
    else return Buffer.from(padToEven(stripHexPrefix(v)), "hex");
  }

  if (typeof v === "number") {
    if (v === 0) return Buffer.allocUnsafe(0);
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
}

/**
 * getKeys([{a: 1, b: 2}, {a: 3, b: 4}], 'a') => [1, 3]
 *
 * @method getKeys get specific key from inner object array of objects
 * @param {String} params
 * @param {String} key
 * @param {Boolean} allowEmpty
 * @returns {Array} output just a simple array of output keys
 */
 function getKeys(params, key, allowEmpty) {
  if (!Array.isArray(params)) { throw new Error(`[ethjs-util] method getKeys expecting type Array as 'params' input, got '${typeof params}'`); }
  if (typeof key !== 'string') { throw new Error(`[ethjs-util] method getKeys expecting type String for input 'key' got '${typeof key}'.`); }

  var result = []; // eslint-disable-line

  for (var i = 0; i < params.length; i++) { // eslint-disable-line
    var value = params[i][key]; // eslint-disable-line
    if (allowEmpty && !value) {
      value = '';
    } else if (typeof(value) !== 'string') {
      throw new Error('invalid abi');
    }
    result.push(value);
  }

  return result;
}

module.exports = {
  randomHex,
  isUint,
  toDER,
  bip66encode,
  arrayContainsArray,
  intToBuffer,
  getBinarySize,
  isHexPrefixed,
  stripHexPrefix,
  padToEven,
  intToHex,
  fromAscii,
  fromUtf8,
  toAscii,
  toUtf8,
  getKeys,
  isHexString,
  toBuffer,
};
//https://github.com/ethjs/ethjs-util/blob/master/src/tests/test.index.js

