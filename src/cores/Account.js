const { Subject } = require("rxjs");

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

  _initAccounts() {}

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
