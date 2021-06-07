/**
 @abstract
**/
class AccountService {
  syncInterval = 10 * 10 * 1000;

  lastSyncTimestamp = 0;

  get accountId() {}

  get base() {}

  get timer() {}

  init(accountId, base, interval) {}

  start() {}

  stop() {}

  getReceivingAddress() {}

  getChangingAddress() {}

  getTransactionFee() {}

  publishTransaction() {}

  updateTransaction() {}

  updateCurrency() {}

  synchro() {}
}

module.exports = AccountService;
