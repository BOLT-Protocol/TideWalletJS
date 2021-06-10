const { Subject } = require("rxjs");
const { ACCOUNT } = require("../models/account.model");
const AccountServiceBase = require("../services/accountServiceBase");
const EthereumService = require("../services/ethereumService");

class AccountCore {
  static instance;
  _currencies = {};
  _messenger = null;
  _settingOptions = [];

  get currencies() {
    return this._currencies;
  }

  get messenger() {
    return this._messenger;
  }

  set currencies(currs) {
    this._currencies = currs;
  }

  get settingOptions() {
    return this._settingOptions;
  }

  set settingOptions(options) {
    this._settingOptions = options;
  }

  constructor() {
    if (!AccountCore.instance) {
      AccountCore.instance = this;
    }

    this._messenger = null;
    this._isInit = false;
    this.debugMode = false;
    this._services = [];
    return AccountCore.instance;
  }

  setMessenger() {
    this._messenger = new Subject();
  }

  init(debugMode = false) {
    this.debugMode = debugMode;
    this._isInit = true;

    this._initAccounts();
  }

  _initAccounts() {
    const a = new AccountServiceBase(this);
    a.init("0x123", ACCOUNT.ETH);
    a.start();
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
