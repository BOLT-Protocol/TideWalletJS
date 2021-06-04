const { Subject } = require("rxjs");
const AccountServiceBase = require("../services/accountServiceBase");
const EthereumService = require("../services/ethereumService");

class AccountCore {
  static instance;

  constructor() {
    if (!AccountCore.instance) {
      AccountCore.instance = this;
    }

    this.messenger = null;
    this._isInit = false;
    this.debugMode = false;
    this._services = [];
    return AccountCore.instance;
  }

  setMessenger() {
    this.messenger = new Subject();
  }

  init(debugMode = false) {
    this.debugMode = debugMode;
    this._isInit = true;

    this._initAccounts();
  }

  _initAccounts() {
    // Example:
    //const svc = new EthereumService(new AccountServiceBase());
    // svc.init("ACCOUNT_ID");
    // console.log(svc.accountId);
    // console.log(svc.base);
  }

  close() {
    this._isInit = false;
  }

  createAccount() {}

  getService() {}

  getNetworks() {}

  getAccounts() {}

  _addAccount() {}

  getSupportedCurrencies() {}

  _addSupportedCurrencies() {}

  getCurrencies() {}

  getAllCurrencies() {}
}

module.exports = AccountCore;
