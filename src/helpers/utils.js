const BigNumber = require("bignumber.js");

const randomHex = (n) => {
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
};

function isUint(value, bit) {
  return (value >= 0 && value <= Math.pow(2, bit) - 1);
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
  if (lenR == 0) throw new Error('R length is zero');
  if (lenS == 0) throw new Error('S length is zero');
  if (lenR > 33) throw new Error('R length is too long');
  if (lenS > 33) throw new Error('S length is too long');
  if ((r[0] & 0x80) != 0) throw new Error('R value is negative');
  if ((s[0] & 0x80) != 0) throw new Error('S value is negative');
  if (lenR > 1 && (r[0] == 0x00) && (r[1] & 0x80) == 0)
    throw new Error('R value excessively padded');
  if (lenS > 1 && (s[0] == 0x00) && (s[1] & 0x80) == 0)
    throw new Error('S value excessively padded');

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

/**
 *
 * @param {string} x
 * @param {string} y
 */
 const substract = (x, y, precision = 8) => {
  const _x = new BigNumber(x);
  const _y = new BigNumber(y);
  const result = _x.minus(_y);
  // return result.precision(precision).toFixed();
  return result.toFixed();
};

/**
 *
 * @param {string} x
 * @param {string} y
 */
 const plus = (x, y, precision = 8) => {
  const _x = new BigNumber(x);
  const _y = new BigNumber(y);
  const result = _x.plus(_y);
  // return result.precision(precision).toFixed();
  return result.toFixed();
};

/**
 *
 * @param {string} x
 * @param {string} y
 */
 const isGreaterThanOrEqualTo = (x, y, precision = 8) => {
  const _x = new BigNumber(x);
  const _y = new BigNumber(y);
  const result = _x.isGreaterThanOrEqualTo(_y);
  // return result.precision(precision).toFixed();
  return result;
};

module.exports = {
  randomHex,
  isUint,
  toDER,
  bip66encode,
  substract,
  plus,
  isGreaterThanOrEqualTo
};
