/**
 @abstract
**/
class AccountService {
  AVERAGE_FETCH_FEE_TIME = 1 * 60 * 60 * 1000; // milliseconds

  _syncInterval = 60 * 10 * 1000;

  _lastSyncTimestamp = 0;

  _timer = null;
  _base = null;
  _accountId = null;

  _AccountCore = null;

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

  get lastSyncTimestamp() {
    return this._lastSyncTimestamp;
  }

  get AccountCore() {
    return this._AccountCore;
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

  async getTransactions(id) {
    return await this.service.getTransactions(id);
  }
}

module.exports = AccountService;
