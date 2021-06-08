const TransactionService = require("./transactionService");

class TransactionServiceBase extends TransactionService {
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

module.exports = TransactionServiceBase;