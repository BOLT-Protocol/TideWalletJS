const TransactionService = require("./transactionService");

class TransactionServiceBase extends TransactionService {
  /**
   * @override
   */
  verifyAddress() {
    // Override by decorator
  }
  /**
   * @override
   */
  extractAddressData() {
    // Override by decorator
  }
  /**
   * @override
   */
  prepareTransaction() {
    // Override by decorator
  }
}

module.exports = TransactionServiceBase;
