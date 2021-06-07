const AccountService = require("./accountService");
class AccountServiceBase extends AccountService {
  constructor() {
    super();
  }

  get accountId() {
    return this._accountId;
  }

  get base() {
    return this._base;
  }

  init(accountId, base, interval) {
    this._accountId = accountId;
    this._base = base;
  }
}

module.exports = AccountServiceBase;
