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
  substract,
  plus,
  isGreaterThanOrEqualTo
};
