const AccountService = require("./accountService");
class AccountServiceBase extends AccountService {
  constructor() {
    super();
  }

  _pushResult() {
    // TODO:
  }

  /**
   @override
  **/
  init(accountId, base, interval) {
    this._accountId = accountId;
    this._base = base;

    this.synchro();
  }

  /**
   @override
  **/
  async start() {}

  /**
   @override
  **/
  stop() {
    clearInterval(this.timer);
  }

  /**
   @override
  **/
  getReceivingAddress() {}

  /**
   @override
  **/
  getChangingAddress() {}
  /**
   @override
  **/
  getTransactionFee() {}
  /**
   @override
  **/
  publishTransaction() {}
  /**
   @override
  **/
  updateTransaction() {}
  /**
   @override
  **/
  updateCurrency() {}
  /**
   @override
  **/
  synchro() {
    this._pushResult();
  }
}

module.exports = AccountServiceBase;
