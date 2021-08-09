/**
 @abstract
**/
class TransactionService {
  constructor() {}

  _base;

  set base(base) {
    this._base = base;
  }

  get base() {
    return this._base;
  }

  set accountDecimals(decimals) {
    this._accountDecimals = decimals;
  }

  get accountDecimals() {
    return this._accountDecimals;
  }

  verifyAddress(address, publish = true) {}
  extractAddressData(address, publish = true) {}
  prepareTransaction() {}
}

module.exports = TransactionService;
