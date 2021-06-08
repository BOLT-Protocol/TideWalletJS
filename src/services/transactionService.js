/**
 @abstract
**/
class TransactionService {
  _base;
  _currencyDecimals = 18;

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
  extractAddressData(address, publish = true) {}
  prepareTransaction() {}
}

module.exports = TransactionService;
