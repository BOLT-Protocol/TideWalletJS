/**
 @abstract
**/
class TransactionService {
  constructor(decimal) {
    this._currencyDecimals = decimal;
  }

  _base;

  set base(base) {
    this._base = base;
  }

  get base() {
    return this._base;
  }

  set currencyDecimals(decimal) {
    this._currencyDecimals = decimal;
  }

  get currencyDecimals() {
    return this._currencyDecimals;
  }

  verifyAddress(address, publish = true) {}
  verifyAmount(balance, amount) {}
  extractAddressData(address, publish = true) {}
  prepareTransaction() {}
}

module.exports = TransactionService;
