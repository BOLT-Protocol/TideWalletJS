const AccountServiceBase = require("./accountServiceBase");

/**
 @abstract
**/
class AccountServiceDecorator extends AccountServiceBase {
  service = null;

  get accountId() {
      return this._accountId;
  }

  get base() {
    return this._base;
  }
}

module.exports = AccountServiceDecorator;
