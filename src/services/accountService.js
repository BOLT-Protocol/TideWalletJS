/**
 @abstract
**/
class AccountService {
  syncInterval = 10 * 10 * 1000;

  lastSyncTimestamp = 0;

  _timer = null;
  _base = null;
  _accountId = null;

  get accountId() {
    return this._accountId;
  }

  set accountId(id) {
    this._accountId = id;
  }

  get base() {
    return this._base;
  }

  set base(base) {
    this._base = base;
  }

  get timer() {
    return this._timer;
  }

  set timer(timer) {
    this._timer = timer;
  }

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
