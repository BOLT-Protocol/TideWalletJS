const BigNumber = require('bignumber.js');

class SafeMath {
  /**
   * check is hex number string
   * @param {string} str 
   * @returns {boolean}
   */
  static isHex(str) {
    const reg = '/[a-fA-F]';
    return reg.test(str);
  }

  /**
   * change string or number to bignumber
   * @param {string | number} input 
   * @returns {BigNumber}
   */
  static toBn(input) {
    let bnInput;
    if (typeof input === 'string' && SafeMath.isHex(input)) {
      bnInput = new BigNumber(input, 16);
    } else {
      bnInput = new BigNumber(input);
    }
    return bnInput;
  }

  /**
   * a + b
   * @param {string | number} a 
   * @param {string | number} b 
   * @returns {string}
   */
  static plus(a, b) {
    const bnA = SafeMath.toBn(a);
    const bnB = SafeMath.toBn(b);
    return bnA.plus(bnB).toFixed();
  }

  /**
   * a - b
   * @param {string | number} a 
   * @param {string | number} b 
   * @returns {string}
   */
  static minus(a, b){
    const bnA = SafeMath.toBn(a);
    const bnB = SafeMath.toBn(b);
    return bnA.minus(bnB).toFixed();
  }

  /**
   * a * b
   * @param {string | number} a 
   * @param {string | number} b 
   * @returns {string}
   */
  static mult(a, b) {
    const bnA = SafeMath.toBn(a);
    const bnB = SafeMath.toBn(b);
    return bnA.multipliedBy(bnB).toFixed();
  }

  /**
   * a / b
   * @param {string | number} a 
   * @param {string | number} b 
   * @returns {string}
   */
  static div(a, b) {
    const bnA = SafeMath.toBn(a);
    const bnB = SafeMath.toBn(b);
    return bnA.dividedBy(bnB).toFixed();
  }

  /**
   * a % b
   * @param {string | number} a 
   * @param {string | number} b 
   * @returns {string}
   */
  static mod(a, b) {
    const bnA = SafeMath.toBn(a);
    const bnB = SafeMath.toBn(b);
    return bnA.mod(bnB).toFixed();
  }

  /**
   * a == b
   * @param {string | number} a 
   * @param {string | number} b 
   * @returns {boolean}
   */
  static eq(a, b) {
    const bnA = SafeMath.toBn(a);
    const bnB = SafeMath.toBn(b);
    return bnA.eq(bnB);
  }

  /**
   * a > b
   * @param {string | number} a 
   * @param {string | number} b 
   * @returns {boolean}
   */
   static gt(a, b) {
    const bnA = SafeMath.toBn(a);
    const bnB = SafeMath.toBn(b);
    return bnA.gt(bnB);
  }

  /**
   * a >= b
   * @param {string | number} a 
   * @param {string | number} b 
   * @returns {boolean}
   */
   static gte(a, b) {
    const bnA = SafeMath.toBn(a);
    const bnB = SafeMath.toBn(b);
    return bnA.gte(bnB);
  }

  /**
   * a < b
   * @param {string | number} a 
   * @param {string | number} b 
   * @returns {boolean}
   */
   static lt(a, b) {
    const bnA = SafeMath.toBn(a);
    const bnB = SafeMath.toBn(b);
    return bnA.lt(bnB);
  }

  /**
   * a <= b
   * @param {string | number} a 
   * @param {string | number} b 
   * @returns {boolean}
   */
   static lte(a, b) {
    const bnA = SafeMath.toBn(a);
    const bnB = SafeMath.toBn(b);
    return bnA.lte(bnB);
  }

  /**
   * @override
   * according to currency decimal to transform amount to currency unit
   * @method toCurrencyUint
   * @param {string} amount
   * @param {Number} decimals
   * @returns {string}
   */
  static toCurrencyUint(amount, decimals) {
    const bnAmount = SafeMath.toBn(amount);
    const bnBase = SafeMath.toBn(10);
    const bnDecimal = bnBase.exponentiatedBy(decimals);
    const currencyUint = bnAmount.dividedBy(bnDecimal).toFixed();
    return currencyUint;
  }

  /**
   * @override
   * @method toSmallestUint
   * @param {string} amount
   * @param {Number} decimals
   * @returns {string}
   */
  static toSmallestUint(amount, decimals) {
    const bnAmount = SafeMath.toBn(amount);
    const bnBase = SafeMath.toBn(10);
    const bnDecimal = bnBase.exponentiatedBy(decimals);
    const smallestUint = bnAmount.multipliedBy(bnDecimal).toFixed();
    return smallestUint;
  }

  /**
   * compressedPubKey check number
   * @param {string} x 
   * @param {string} y 
   * @returns {boolean}
   */
  static compressedPubKeyCheck(x, y) {
    const bnP = SafeMath.toBn('fffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f');
  
    const bnX = SafeMath.toBn(x);
    const bnY = SafeMath.toBn(y);
  
    const check = bnX.pow(new BigNumber(3)).plus(new BigNumber(7)).minus((bnY.pow(new BigNumber(2)))).mod(bnP);
    return check.isZero();
  }
}

module.exports = SafeMath;
