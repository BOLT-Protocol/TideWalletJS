const BigNumber = require('bignumber.js')

class Converter {
  /** @constant {BigNumber} NOTE: calculate satoshi by 10^8 */ 
  static btcInSatoshi() {return BigNumber(Math.pow(10, 8));}
  
  /** @constant {BigNumber} NOTE: calculate drop by 10^6 */ 
  static xrpInDrop() {return BigNumber(Math.pow(10, 6));}

  /** @constant {BigNumber} BTC == 100,000,000 satoshi */ 
  static toBtc(value) {
      return value.dividedBy(Converter.btcInSatoshi());
  }

  /** @constant {BigNumber} BTC == 100,000,000 satoshi */ 
  static toSatoshi(btc) {
      return btc.multipliedBy(Converter.btcInSatoshi());
  }
  

  /** @constant {BigNumber}  1 XRP == 1,000,000 drop */ 
  static toXrp(value) {
    return value.dividedBy(Converter.xrpInDrop());
  }

  /** @constant {BigNumber}  1 XRP == 1,000,000 drop */ 
  static toDrop(xrp) {
    return xrp.multipliedBy(Converter.xrpInDrop());
  }
}

module.exports = Converter;

  