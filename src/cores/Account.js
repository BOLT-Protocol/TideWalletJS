const { Subject } = require("rxjs");
const { Account, ACCOUNT } = require("../models/account.model");
const AccountServiceBase = require("../services/accountServiceBase");
const EthereumService = require("../services/ethereumService");
const BitcoinService = require("../services/bitcoinService");
const { network_publish } = require("../constants/config");
const TransactionBase = require("../services/transactionService");
const ETHTransaction = require("../services/transactionServiceETH");
const BigNumber = require("bignumber.js");

class AccountCore {
  static instance;
  // _currencies = {};
  _accounts = [];
  _messenger = null;
  _settingOptions = [];
  _DBOperator = null;

  // get currencies() {
  //   return this._currencies;
  // }

  get messenger() {
    return this._messenger;
  }

  // set currencies(currs) {
  //   this._currencies = currs;
  // }

  get settingOptions() {
    return this._settingOptions;
  }

  set settingOptions(options) {
    this._settingOptions = options;
  }

  constructor({ TideWalletCommunicator, DBOperator, TideWalletCore }) {
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

  async init({ debugMode = false, networkPublish = network_publish }) {
    this._debugMode = debugMode;
    this._networkPublish = networkPublish;
    this._isInit = true;

    await this._initAccounts();
  }

  async _initAccounts() {
    const chains = await this._getNetworks(this._networkPublish);
    const accounts = await this._getAccounts();
    const currencies = await this._getSupportedCurrencies();

    const srvStart = [];
    for (const acc of accounts) {
      let currency = currencies.find((c) => c.currencyId === acc.currencyId);
      if(currency){
        acc.name = currency.name;
        acc.description = currency.description;
        acc.symbol = currency.symbol;
        acc.decimals = currency.decimals;
        acc.totalSupply = currency.totalSupply;
        acc.contract = currency.contract;
        acc.type = currency.type;
        acc.icon = currency.icon;
        acc.exchangeRate = currency.exchangeRate;
      }

      let chain = chains.find((c) => c.networkId === acc.networkId);
      if (!chain) {
        acc.blockchainCoinType = chain.coinType;
        acc.blockchainId = chain.blockchainId;
        acc.chainId = chain.chainId;
        acc.publish = chain.publish;
        console.log(acc);

        let svc;
        let _ACCOUNT;
        switch (chain.coinType) {
          case 0:
          case 1:
            svc = new BitcoinService(
              new AccountServiceBase(this),
              this._TideWalletCommunicator,
              this._DBOperator
            );
            _ACCOUNT = ACCOUNT.BTC;
            break;
          case 60:
          case 603:
            svc = new EthereumService(
              new AccountServiceBase(this),
              this._TideWalletCommunicator,
              this._DBOperator
            );
            _ACCOUNT = ACCOUNT.ETH;
            break;
          case 8017:
            svc = new EthereumService(
              new AccountServiceBase(this),
              this._TideWalletCommunicator,
              this._DBOperator
            );
            _ACCOUNT = ACCOUNT.CFC;
            break;

          default:
        }

        if (svc && !this._currencies[acc.accountId]) {
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

    // delete this.currencies;
    // this.currencies = {};

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

  /**
   * Get blockchainID by accountId
   * @method getBlockchainID
   * @param {string} accountId The accountId
   * @returns {string} The blockchainID
   */
  getBlockchainID(accountId) {
    const account = this._accounts.find((acc) => acc.accountId === accountId);
    return account.networkId;
  }

  /**
   *
   * @param {Boolean} publish
   * @returns NetworkDao entity
   */
  // get supported blockchain from DB
  async _getNetworks(publish = true) {
    let networks = await this._DBOperator.networkDao.findAllNetworks();

    // if DB is empty get supported blockchain from backend service
    if (!networks || networks.length < 1) {
      try {
        const res = await this._TideWalletCommunicator.BlockchainList();
        const enties = res?.map((n) =>
          this._DBOperator.networkDao.entity({
            blockchain_id: n["blockchain_id"],
            blockchain: n["name"],
            coin_type: n["coin_type"],
            chain_id: n["network_id"],
            publish: n["publish"],
          })
        );
        networks = enties;
        await this._DBOperator.networkDao.insertNetworks(enties);
      } catch (error) {
        console.log(error); // ++ throw exception
      }
    }

    if (this._debugMode || !publish) {
      return networks;
    }

    if (publish) {
      return networks.filter((n) => n.publish);
    }
  }

  /**
   *
   * @returns AccountDao entity
   */
  async _getAccounts() {
    let accounts = await this._DBOperator.accountDao.findAllAccounts();

    // Filter accounts by current User
    accounts = accounts.filter(
      (acc) => acc.userId === this._TideWalletCore.userInfo.id
    );

    if (!accounts || accounts.length < 1) {
      try {
        const res = await this._TideWalletCommunicator.AccountList();
        /**
         * a
         * account_id
         * purpose ++
         * coin_type__account ++
         * account_index
         * curve_type ++
         * balance --
         * blockchain_id
         * currency_id
         * network_id --
         * publish --
         *
         */
        const enties = res?.map((a) =>
          this._DBOperator.accountDao.entity({
            ...a,
            id: a["account_id"],
            user_id: this._TideWalletCore.userInfo.id,
            purpose: 84,
            coin_type__account: 3324,
            curve_type: 0,
            chain_id: a["network_id"],
          })
        );
        accounts = enties;
        // await this._DBOperator.accountDao.insertAccounts(accounts);
      } catch (error) {
        console.log(error); // ++ throw exception
      }
    }

    return accounts;
  }

  /**
   *
   * @returns CurrencyDao entity
   */
  async _getSupportedCurrencies() {
    // get supported currencies from DB
    let currencies = await this._DBOperator.currencyDao.findAllCurrencies();

    // if DB is empty get supported currencies from backend service
    if (!currencies || currencies.length < 1) {
      try {
        const res = await this._TideWalletCommunicator.CurrencyList();
        /**
         * c
         * currency_id
         * name
         * description ++
         * symbol
         * decimals
         * total_supply ++
         * contract ++
         * type
         * icon
         * exchange_rate
         * publish --
         */
        const enties = res?.map((c) => this._DBOperator.currencyDao.entity(c));
        currencies = enties;
        // write currencies to DB
        await this._DBOperator.currencyDao.insertCurrencies(currencies);
      } catch (error) {
        console.log(error); // ++ throw exception
      }
    }
    return currencies;
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

  async getTransactionFee(accountcurrencyId, { to, amount, data } = {}) {
    const svc = this.getService(accountcurrencyId);
    const blockchainID = this.getBlockchainID(accountcurrencyId);
    const fees = await svc.getTransactionFee(blockchainID); // ++ to CoinUint 0706
    let gasLimit = 21000;
    if (to)
      gasLimit = await svc.estimateGasLimit(blockchainID, to, amount, data);
    console.log("fees", fees);
    console.log("gasLimit", gasLimit);
    return { ...fees, gasLimit };
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
        safeSigner = this._TideWalletCore.getSafeSigner("m/84'/3324'/0'/0/0"); // ++ get path from accountDao
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
