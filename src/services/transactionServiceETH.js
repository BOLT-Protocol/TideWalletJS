const TransactionDecorator = require("./accountServiceDecorator");
const { ACCOUNT } = require("../models/account.model");

class TransactionServiceETH extends TransactionDecorator {
  service = null;
  _base = ACCOUNT.ETH;
  _currencyDecimals = 18;
  constructor(service) {
    this.service = service;
  }

  _signTransaction() {}

  /**
   @override
  **/
  verifyAddress() {}

  /**
   @override
  **/
  extractAddressData() {}

  /**
   @override
  **/
  prepareTransaction() {}
}

module.exports = TransactionServiceETH;
