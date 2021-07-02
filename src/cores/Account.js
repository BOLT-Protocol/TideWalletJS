const { Subject } = require("rxjs");
const { ACCOUNT } = require("../models/account.model");
const AccountServiceBase = require("../services/accountServiceBase");
const EthereumService = require("../services/ethereumService");
const { network_publish } = require("../constants/config");
const TransactionBase = require("../services/transactionService");
const ETHTransaction = require("../services/transactionServiceETH");
const BigNumber = require("bignumber.js");

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

  constructor({TideWalletCommunicator, DBOperator, TideWalletCore}) {
    if (!AccountCore.instance) {
      this._messenger = null;
      this._isInit = false;
      this._debugMode = false;
      this._services = [];
      this._DBOperator = DBOperator;
      this._TideWalletCommunicator = TideWalletCommunicator;
      this._TideWalletCore = TideWalletCore;
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

    const srvStart = [];
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
            svc = new EthereumService(new AccountServiceBase(this), this._TideWalletCommunicator, this._DBOperator);
            _ACCOUNT = ACCOUNT.ETH;
            break;
          case 8017:
            svc = new EthereumService(new AccountServiceBase(this), this._TideWalletCommunicator, this._DBOperator);
            _ACCOUNT = ACCOUNT.CFC;
            break;

          default:
        }

        if (svc && !this._currencies[acc.accountid]) {
          this._currencies[acc.accountId] = [];

          this._services.push(svc);

          svc.init(acc.accountId, _ACCOUNT);

          // await svc.start();
          srvStart.push(svc.start());
        }
      }
    }

    try {
      const srvStartRes = await Promise.all(srvStart);
    } catch (error) {
      console.trace(error);
    }
    this._addAccount(accounts);
  }

  /**
   * close all services
   * @method close
   */
  async sync() {
    if (this._isInit) {
      this._services.forEach((svc) => {
        svc.synchro(true);
      });
    }
  }

  /**
   * close all services
   * @method close
   */
  close() {
    this._isInit = false;
    this._services.forEach((svc) => {
      svc.stop();
    });

    delete this._services;
    this._services = [];

    delete this.accounts;
    this.accounts = [];

    delete this.currencies;
    this.currencies = {};

    delete this._settingOptions;
    this._settingOptions = [];
  }

  /**
   * Get service by accountId
   * @method getService
   * @param {string} accountId The accountId
   * @returns {Object} The service
   */
  getService(accountId) {
    return this._services.find((svc) => svc.accountId === accountId);
  }

  async _getNetworks(publish = true) {
    let networks = await this._DBOperator.networkDao.findAllNetworks();

    if (!networks || networks.length < 1) {
      try {
        const res = await this._TideWalletCommunicator.BlockchainList();
        const enties = res.map((n) =>
          this._DBOperator.networkDao.entity({
            network_id: n["blockchain_id"],
            network: n["name"],
            coin_type: n["coin_type"],
            chain_id: n["network_id"],
            publish: n["publish"],
          })
        );
        networks = enties;
        await this._DBOperator.networkDao.insertNetworks(enties);
      } catch (error) {
        
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
    try {
      const res = await this._TideWalletCommunicator.AccountList()
      let list = res ?? [];
  
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
    } catch (error) {
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
    try {
      const res = await this._TideWalletCommunicator.CurrencyList();

      let list = res;

      list = list
        .filter((c) =>
          local.findIndex((l) => l.currencyId === c["currency_id"] > -1)
        )
        .map((c) => this._DBOperator.currencyDao.entity(c));

      await this._DBOperator.currencyDao.insertCurrencies(list);
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Get currency list by accountId
   * @method getCurrencies
   * @param {string} accountId The accountId
   * @returns {Array} The currency list
   */
  getCurrencies(accountId) {
    return this._currencies[accountId];
  }

  /**
   * Get all currency list
   * @method getAllCurrencies
   * @returns {Array} The currency list
   */
  getAllCurrencies() {
    return Object.values(this._currencies).reduce(
      (list, curr) => list.concat(curr),
      []
    );
  }

  /**
   * Get transaction list by accountcurrencyId
   * @method getTransactions
   * @param {string} accountcurrencyId The accountcurrencyId
   * @returns {Array} The transaction list
   */
  async getTransactions(accountcurrencyId) {
    const txs = await this._DBOperator.transactionDao.findAllTransactionsById(
      accountcurrencyId
    );
    return txs;
  }

  /**
   * Get receive address by accountcurrencyId
   * @method getReceiveAddress
   * @param {string} accountId The accountId
   * @returns {string} The address
   */
   async getReceiveAddress(accountcurrencyId) {
    const svc = this.getService(accountcurrencyId);
    const address = await svc.getReceivingAddress(accountcurrencyId);
    return address;
  }

  /**
   * Send transaction
   * @method sendTransaction
   * @param {string} accountcurrencyId The accountcurrencyId
   * @param {object} param The transaction content
   * @param {number} param.amount
   * @param {string} param.to
   * @param {number} param.gasPrice
   * @param {number} param.gasUsed
   * @param {string} param.gasPrice
   * @param {number} param.keyIndex
   * @returns {boolean}} success
   */
  async sendTransaction(
    accountCurrency,
    { amount, to, gasPrice, gasUsed, message }
  ) {
    let safeSigner;
    switch (accountCurrency.accountType) {
      case ACCOUNT.ETH:
      case ACCOUNT.CFC:
        safeSigner = this._TideWalletCore.getSafeSigner("m/84'/3324'/0'/0/0");
        const svc = this.getService(accountCurrency.accountId);
        const address = svc.getReceivingAddress(
          accountCurrency.accountcurrencyId
        );
        const account = this._accounts.find(
          (acc) => acc.accountId === svc.accountId
        );

        const nonce = await svc.getNonce(account.networkId, address);

        const txSvc = new ETHTransaction(new TransactionBase(), safeSigner);
        const signedTx = txSvc.prepareTransaction({
          amount: BigNumber(amount),
          to,
          gasPrice: BigNumber(gasPrice),
          gasUsed: BigNumber(gasUsed),
          message,
          nonce,
        });

        const [success, tx] = await svc.publishTransaction(
          account.networkId,
          signedTx
        );

        console.log(signedTx); //-- debug info
        console.log(tx); //-- debug info
        return success;
      default:
        return null;
    }
  }
}

module.exports = AccountCore;
