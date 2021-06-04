const AccountService = require("./accountService");

/**
 @abstract
**/
class AccountServiceDecorator extends AccountService {
  service = null;

  get accountId() {
      return this.service.accountId;
  }

  get base() {
    return this.service.base;
  }
}

module.exports = AccountServiceDecorator;
