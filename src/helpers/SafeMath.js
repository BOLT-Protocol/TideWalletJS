const BigNumber = require('bignumber.js');

class SafeMath {
  /**
   * a + b
   * @param {string | number} a 
   * @param {string | number} b 
   * @returns {string}
   */
  static plus(a, b) {
    const bnA = new BigNumber(a);
    const bnB = new BigNumber(b);
    return bnA.plus(bnB).toFixed();
  }

  /**
   * a - b
   * @param {string | number} a 
   * @param {string | number} b 
   * @returns {string}
   */
  static minus(a, b){
    const bnA = new BigNumber(a);
    const bnB = new BigNumber(b);
    return bnA.minus(bnB).toFixed();
  }

  /**
   * a * b
   * @param {string | number} a 
   * @param {string | number} b 
   * @returns {string}
   */
  static mult(a, b) {
    const bnA = new BigNumber(a);
    const bnB = new BigNumber(b);
    return bnA.multipliedBy(bnB).toFixed();
  }

  /**
   * a / b
   * @param {string | number} a 
   * @param {string | number} b 
   * @returns {string}
   */
   static div(a, b) {
    const bnA = new BigNumber(a);
    const bnB = new BigNumber(b);
    return bnA.dividedBy(bnB).toFixed();
  }

  /**
   * a == b
   * @param {string | number} a 
   * @param {string | number} b 
   * @returns {boolean}
   */
  static eq(a, b) {
    const bnA = new BigNumber(a);
    const bnB = new BigNumber(b);
    return bnA.eq(bnB);
  }

  /**
   * a > b
   * @param {string | number} a 
   * @param {string | number} b 
   * @returns {boolean}
   */
   static gt(a, b) {
    const bnA = new BigNumber(a);
    const bnB = new BigNumber(b);
    return bnA.gt(bnB);
  }

  /**
   * a >= b
   * @param {string | number} a 
   * @param {string | number} b 
   * @returns {boolean}
   */
   static gte(a, b) {
    const bnA = new BigNumber(a);
    const bnB = new BigNumber(b);
    return bnA.gte(bnB);
  }

  /**
   * a < b
   * @param {string | number} a 
   * @param {string | number} b 
   * @returns {boolean}
   */
   static lt(a, b) {
    const bnA = new BigNumber(a);
    const bnB = new BigNumber(b);
    return bnA.lt(bnB);
  }

  /**
   * a <= b
   * @param {string | number} a 
   * @param {string | number} b 
   * @returns {boolean}
   */
   static lte(a, b) {
    const bnA = new BigNumber(a);
    const bnB = new BigNumber(b);
    return bnA.lte(bnB);
  }

  /**
   * @override
   * according to currency decimal to transform amount to currency unit
   * @method toCurrencyUint
   * @param {string} amount
   * @param {BigNumber} decimals
   * @returns {string}
   */
  static toCurrencyUint(amount, decimals) {
    const bnAmount = new BigNumber(amount);
    const bnBase = new BigNumber(10);
    const bnDecimal = bnBase.exponentiatedBy(decimals);
    const currencyUint = bnAmount.dividedBy(bnDecimal).toFixed();
    return currencyUint;
  }

  /**
   * @override
   * @method toSmallestUint
   * @param {string} amount
   * @param {BigNumber} decimals
   * @returns {string}
   */
  static toSmallestUint(amount, decimals) {
    const bnAmount = new BigNumber(amount);
    const bnBase = new BigNumber(10);
    const bnDecimal = bnBase.exponentiatedBy(decimals);
    const smallestUint = bnAmount.multipliedBy(bnDecimal).toFixed();
    return smallestUint;
  }
}

module.exports = SafeMath;
