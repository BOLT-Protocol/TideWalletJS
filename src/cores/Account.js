const { Subject } = require("rxjs");
const { ACCOUNT } = require("../models/account.model");
const AccountServiceBase = require("../services/accountServiceBase");
const EthereumService = require("../services/ethereumService");
const { network_publish } = require("../constants/config");
const DBOperator = require("../database/dbOperator");
const HttpAgent = require("../helpers/httpAgent");

class AccountCore {
  static instance;
  _currencies = {};
  _messenger = null;
  _settingOptions = [];
  _DBOperator = null;

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
      this._messenger = null;
      this._isInit = false;
      this._debugMode = false;
      this._services = [];
      this._DBOperator = new DBOperator();
      this._HttpAgent = new HttpAgent();
      AccountCore.instance = this;
    }

    return AccountCore.instance;
  }

  setMessenger() {
    this._messenger = new Subject();
  }

  async init(debugMode = false) {
    this._debugMode = debugMode;
    this._isInit = true;

    await this._initAccounts();
  }

  async _initAccounts() {
    const chains = await this._getNetworks(network_publish);
    const accounts = await this._getAccounts();
    await this._getSupportedCurrencies();

    for (const acc of accounts) {
      let blockIndex = chains.findIndex(
        (chain) => chain.networkId === acc.networkId
      );

      if (blockIndex > -1) {
        let svc;
        let _ACCOUNT;
        switch (chains[blockIndex].coinType) {
          case 60:
          case 603:
            svc = new EthereumService(new AccountServiceBase(this));
            _ACCOUNT = ACCOUNT.ETH;
            break;
          case 8017:
            break;

          default:
        }

        if (svc && !this._currencies[acc.accountid]) {
          this._currencies[acc.accountId] = [];

          this._services.push(svc);

          svc.init(acc.accountId, _ACCOUNT);

          await svc.start();
        }
      }
    }

    this._addAccount(accounts);
  }

  close() {
    this._isInit = false;
    this._services.forEach((svc) => {
      svc.stop();
    });

    this._services = [];
    this.accounts = [];
    this.currencies = {};
    this._settingOptions = [];
  }

  getService(accountId) {
    return this._services.find((svc) => svc.accountId === accountId);
  }

  async _getNetworks(publish = true) {
    const networks = await this._DBOperator.networkDao.findAllNetworks();

    if (!networks || networks.length < 1) {
      const res = await this._HttpAgent.get("/blockchain");

      if (res.success) {
        const enties = res.data.map((n) =>
          this._DBOperator.networkDao.entity({
            network_id: n['blockchain_id'],
            network: n['name'],
            coin_type: n['coin_type'],
            chain_id: n['network_id'],
            publish: n['publish']
          })
        );
        await this._DBOperator.networkDao.insertNetworks(enties);
      }
    }

    if (this._debugMode || !publish) {
      return networks;
    }

    if (publish) {
      return networks.filter((n) => n.publish);
    }
  }

  async _getAccounts() {
    let result = await this._DBOperator.accountDao.findAllAccounts();

    if (result.length < 1) {
      result = await this._addAccount(result);
      return result;
    }

    return result;
  }

  async _addAccount(local) {
    const res = await this._HttpAgent.get("/wallet/accounts");
    let list = res.data ?? [];

    const user = await this._DBOperator.userDao.findUser();

    for (const account of list) {
      const id = account["account_id"];
      const exist = local.findIndex((el) => el.accountId === id) > -1;

      if (!exist) {
        const entity = this._DBOperator.accountDao.entity({
          ...account,
          user_id: user.userId,
          network_id: account["blockchain_id"],
        });
        await this._DBOperator.accountDao.insertAccount(entity);

        local.push(entity);
      }
    }

    return local;
  }

  async _getSupportedCurrencies() {
    const local = await this._DBOperator.currencyDao.findAllCurrencies();

    if (local.length < 1) {
      await this._addSupportedCurrencies(local);
    }
  }

  async _addSupportedCurrencies(local) {
    const res = await this._HttpAgent.get("/currency");

    if (res.success) {
      let list = res.data;

      list = list
        .filter((c) =>
          local.findIndex((l) => l.currencyId === c["currency_id"] > -1)
        )
        .map((c) => this._DBOperator.currencyDao.entity(c));

      await this._DBOperator.currencyDao.insertCurrencies(list);
    }
  }

  getCurrencies(accountId) {
    return this._currencies[accountId];
  }

  getAllCurrencies() {
    return Object.values(this._currencies).reduce(
      (list, curr) => list.concat(curr),
      []
    );
  }
}

module.exports = AccountCore;
