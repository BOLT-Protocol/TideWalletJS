const { Subject } = require("rxjs");
const { ACCOUNT } = require("../models/account.model");
const AccountServiceBase = require("../services/accountServiceBase");
const EthereumService = require("../services/ethereumService");
const BitcoinService = require("../services/bitcoinService");
const TransactionBase = require("../services/transactionService");
const ETHTransactionSvc = require("../services/transactionServiceETH");
const { Transaction } = require("../models/tranasction.model");
const BTCTransactionSvc = require("../services/transactionServiceBTC");
const SafeMath = require("../helpers/SafeMath");

class AccountCore {
  static instance;
  _accounts = {};
  _messenger = null;
  _settingOptions = [];
  _DBOperator = null;

  get accounts() {
    return this._accounts;
  }

  get messenger() {
    return this._messenger;
  }

  get trader() {
    return this._trader;
  }

  set accounts(accounts) {
    this._accounts = accounts;
  }

  get settingOptions() {
    return this._settingOptions;
  }

  set settingOptions(options) {
    this._settingOptions = options;
  }

  constructor({ TideWalletCommunicator, DBOperator, TideWalletCore, Trader }) {
    if (!AccountCore.instance) {
      this._messenger = null;
      this._isInit = false;
      this._debugMode = false;
      this._services = [];
      this._DBOperator = DBOperator;
      this._TideWalletCommunicator = TideWalletCommunicator;
      this._TideWalletCore = TideWalletCore;
      this._trader = Trader;
      AccountCore.instance = this;
    }

    return AccountCore.instance;
  }

  setMessenger() {
    this._messenger = new Subject();
  }

  async init({ debugMode, networkPublish }) {
    this._debugMode = debugMode;
    this._networkPublish = networkPublish;
    this._isInit = true;
    await this._initAccounts();
  }

  async _initAccounts() {
    this.close();
    const fiat = await this._trader.getSelectedFiat();
    const chains = await this._getNetworks();
    const accounts = await this._getAccounts();
    const currencies = await this._getSupportedCurrencies();
    const srvStart = [];
    for (const acc of accounts) {
      // Join Account with Currency
      let currency = currencies.find((c) => c.currencyId === acc.currencyId);
      if (currency) {
        acc.name = currency.name;
        acc.description = currency.description;
        acc.symbol = currency.symbol;
        acc.decimals = currency.decimals;
        acc.totalSupply = currency.totalSupply;
        acc.contract = currency.contract;
        acc.type = currency.type;
        acc.image = currency.image;
        acc.publish = currency.publish;
        acc.exchangeRate = currency.exchangeRate;
        acc.inFiat = this._trader.calculateToFiat(acc, fiat);
      }

      await this._DBOperator.accountDao.insertAccount(acc);

      let chain = chains.find(
        (chain) => chain.blockchainId === acc.blockchainId
      );
      // Join Account with Network
      if (chain) {
        acc.blockchainCoinType = chain.coinType;
        acc.chainId = chain.chainId;
        acc.publish = chain.publish;
        acc.network = chain.network;

        await this._DBOperator.accountDao.insertAccount(acc);

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

        if (svc && !this._accounts[acc.accountId]) {
          this._accounts[acc.accountId] = [];
          this._services.push(svc);
          svc.init(acc.accountId, _ACCOUNT);
          // await svc.start();
          srvStart.push(svc.start());
        }
      }
    }

    await this._getSupportedToken(chains);

    try {
      const srvStartRes = await Promise.all(srvStart);
    } catch (error) {
      console.trace(error);
    }
  }

  /**
   * sync service
   * @method sync
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
    this.accounts = {};

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
   *
   * @param {Boolean} publish
   * @returns NetworkDao entity
   */
  // get supported blockchain from DB
  async _getNetworks() {
    let networks = await this._DBOperator.networkDao.findAllNetworks();

    // if DB is empty get supported blockchain from backend service
    if (!networks || networks.length < 1) {
      try {
        const res = await this._TideWalletCommunicator.BlockchainList();
        const enties = res?.map((n) =>
          this._DBOperator.networkDao.entity({
            blockchain_id: n["blockchain_id"],
            network: n["name"],
            coin_type: n["coin_type"],
            chain_id: n["network_id"],
            publish: n["publish"],
          })
        );
        networks = enties;
        await this._DBOperator.networkDao.insertNetworks(networks);
      } catch (error) {
        console.log(error); // ++ throw exception
      }
    }

    if (this._debugMode) {
      return networks;
    }

    if (this._networkPublish) return networks.filter((n) => n.publish);
    else return networks.filter((n) => !n.publish);
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
         * coin_type_account ++
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
            coin_type_account: 3324,
            curve_type: 0,
            chain_id: a["network_id"],
            number_of_used_external_key: a["number_of_used_external_key"] ?? 0,
            number_of_used_internal_key: a["number_of_used_internal_key"] ?? 0,
            last_sync_time: Date.now(),
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
         * publish
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
   * Load setting page token list
   * get each blockchain supported token and add it to _AccountCore.settingOptions
   * @method _getSupportedToken
   * @returns {void}
   */
  async _getSupportedToken(chains) {
    for (let chain of chains) {
      let tokens =
        await this._DBOperator.currencyDao.findAllCurrenciesByBlockchainId(
          chain.blockchainId
        );
      if (!tokens || tokens.length < 1) {
        try {
          const res = await this._TideWalletCommunicator.TokenList(
            chain.blockchainId
          );
          /**
         * CFC: 9bdfe7b7-7bef-4009-a6fb-6b628265d885
         * 0:
          blockchain_id: "80001F51"
          contract: "0x44bf3a96420c0688d657aca23e343e79581304b1"
          currency_id: "2c64a81c-bb62-41e2-abef-2fc524bb9124"
          decimals: 18
          exchange_rate: null
          icon: "https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@9ab8d6934b83a4aa8ae5e8711609a70ca0ab1b2b/32/icon/xpa.png"
          name: "XPlay"
          publish: false
          symbol: "XPA"
          type: 2
         * 1:
          blockchain_id: "80001F51"
          contract: "0x323ba586e7a634db733fea42956e71e9d2c992da"
          currency_id: "051b654c-30d1-4a3c-b2b4-46ed7c08d461"
          decimals: 0
          exchange_rate: null
          icon: "https://service.tidewallet.io/icon/ERC20.png"
          name: "TestTokenTransfer"
          publish: false
          symbol: "TTT"
          type: 2
         */
          if (res) {
            tokens = res.map((t) => this._DBOperator.currencyDao.entity(t));
            await this._DBOperator.currencyDao.insertCurrencies(tokens);
          }
        } catch (error) {
          console.log(error); // ++ throw exception
        }
      }
      this.settingOptions += tokens;
    }
  }

  /**
   * Get currency list by accountId
   * @method getCurrencies
   * @param {string} accountId The accountId
   * @returns {Array} The currency list
   */
  getCurrencies(accountId) {
    return this._accounts[accountId];
  }

  /**
   * Get all currency list
   * @method getAllCurrencies
   * @returns {Array} The currency list
   */
  getAllCurrencies() {
    return Object.values(this._accounts).reduce(
      (list, curr) => list.concat(curr),
      []
    );
  }

  /**
   * Get transaction list by accountId
   * @method getTransactions
   * @param {string} accountId The accountId
   * @returns {Array} The transaction list
   */
  async getTransactions(accountId) {
    const txs = await this._DBOperator.transactionDao.findAllTransactionsById(
      accountId
    );
    // https://dmitripavlutin.com/javascript-array-sort-numbers/
    return txs.sort((a, b) => (a.timestamp <= b.timestamp ? 1 : -1)); //(a, b) => a.timestamp - b.timestamp
  }

  /**
   * Get receive address by accountId
   * @method getReceiveAddress
   * @param {string} accountId The accountId
   * @returns {string} The address
   */
  async getReceiveAddress(accountId) {
    const svc = this.getService(accountId);
    const address = await svc.getReceivingAddress(accountId);
    console.log(address);
    return address;
  }

  /**
   * Get TransactionFee and gasLimit by id
   * @param {string} id
   * @param {string} to [optional]
   * @param {string} amount [optional]
   * @param {string} data [optional]
   * @returns
   */
  async getTransactionFee(id, to, amount, data) {
    const svc = this.getService(id);
    const account = this._accounts[id].find((acc) => acc.id === id);
    const fees = await svc.getTransactionFee(
      account.id,
      account.blockchainId,
      account.decimals,
      to,
      amount,
      data
    );
    console.log("fees", fees);
    return fees;
  }

  async verifyAddress(id, address) {
    const account = this._accounts[id].find((acc) => acc.id === id);
    const safeSigner = this._TideWalletCore.getSafeSigner(
      `m/${account.purpose}'/${account.accountCoinType}'/${account.accountIndex}'`
    );
    let txSvc;
    switch (account.accountType) {
      case ACCOUNT.ETH:
      case ACCOUNT.CFC:
        txSvc = new ETHTransactionSvc(new TransactionBase(), safeSigner);
        break;
      case ACCOUNT.BTC:
        txSvc = new BTCTransactionSvc(new TransactionBase(), safeSigner);
        break;
      default:
        break;
    }
    return txSvc.verifyAddress(
      address,
      account.blockchainCoinType === 1 ? false : true
    );
  }

  async verifyAmount(id, amount, fee) {
    const account = this._accounts[id].find((acc) => acc.id === id);
    const amountPlusFee = SafeMath.plus(amount, fee);
    const result = SafeMath.gte(account.balance, amountPlusFee);
    console.log(account.balance);
    console.log(amount);
    console.log(fee);
    console.log(result);
    return result;
  }

  async sendETHBasedTx(account, svc, safeSigner, transaction) {
    const nonce = await svc.getNonce(account.blockchainId, transaction.from);
    const txSvc = new ETHTransactionSvc(new TransactionBase(), safeSigner);
    const signedTx = await txSvc.prepareTransaction({
      transaction,
      nonce,
      chainId: account.chainId,
    });
    console.log(signedTx); //-- debug info
    const response = await svc.publishTransaction(
      account.blockchainId,
      signedTx
    );
    return response;
  }

  async sendBTCBasedTx(account, svc, safeSigner, transaction) {
    console.log("sendBTCBasedTx transaction", transaction); // -- debug
    const txSvc = new BTCTransactionSvc(new TransactionBase(), safeSigner);
    txSvc.accountDecimals = account.decimals;
    const utxos = await svc.getUnspentTxOut(account.id, account.decimals);
    utxos.map(async (utxo) => {
      if (!utxo.locked) {
        utxo.publickey = Buffer.from(
          await this._TideWalletCore.getPubKey({
            keyPath: `m/${account.purpose}'/${account.accountCoinType}'/${account.accountIndex}'/${utxo.changeIndex}/${utxo.keyIndex}`,
          }),
          "hex"
        );
      }
    });
    const changeInfo = await svc.getChangingAddress(account.id);
    const signedTx = await txSvc.prepareTransaction({
      isMainNet: account.blockchainCoinType === 1 ? false : true,
      to: transaction.to,
      amount: transaction.amount, //String in satoshi
      message: transaction.message,
      accountId: account.id,
      fee: transaction.fee, //String in satoshi
      unspentTxOuts: utxos,
      keyIndex: changeInfo[1],
      changeAddress: changeInfo[0],
    });
    console.log(signedTx); //-- debug info
    const response = await svc.publishTransaction(
      account.blockchainId,
      signedTx
    );

    console.log("sendBTCBasedTx response:", response);
    return response;
  }

  /**
   * Send transaction
   * @method sendTransaction
   * @param {string} id The account id
   * @param {Transaction} transaction The transaction content
   * @param {string} transaction.to
   * @param {string} transaction.amount
   * @param {string} transaction.feePerUnit
   * @param {string} transaction.feeUnit
   * @returns {boolean}} success
   */
  async sendTransaction(id, transaction) {
    const account = this._accounts[id].find((acc) => acc.id === id);
    const svc = this.getService(account.accountId);
    const from = await svc.getReceivingAddress(id);
    const safeSigner = this._TideWalletCore.getSafeSigner(
      `m/${account.purpose}'/${account.accountCoinType}'/${account.accountIndex}'`
    );
    transaction.from = from;
    transaction.amount = SafeMath.toSmallestUint(
      transaction.amount,
      account.decimals
    );
    transaction.feePerUnit = SafeMath.toSmallestUint(
      transaction.feePerUnit,
      account.decimals
    );
    transaction.fee = SafeMath.toSmallestUint(
      transaction.fee,
      account.decimals
    );
    let success, tx;
    switch (account.accountType) {
      case ACCOUNT.ETH:
      case ACCOUNT.CFC:
        [success, tx] = await this.sendETHBasedTx(
          account,
          svc,
          safeSigner,
          transaction
        );
        break;
      case ACCOUNT.BTC:
        [success, tx] = await this.sendBTCBasedTx(
          account,
          svc,
          safeSigner,
          transaction
        );
        break;
      default:
        break;
    }
    if (success) {
      console.log("sendTransaction tx", tx); //-- debug info
      tx.amount = SafeMath.toCurrencyUint(transaction.amount, account.decimals);
      tx.feePerUnit = SafeMath.toCurrencyUint(
        transaction.feePerUnit,
        account.decimals
      );
      tx.fee = SafeMath.toCurrencyUint(transaction.fee, account.decimals);
      tx.accountId = account.id;
      tx.id = account.id + tx.txid;
      console.log("sendTransaction tx", tx); //-- debug info
      account.balance = SafeMath.minus(
        SafeMath.minus(account.balance, tx.amount),
        tx.fee
      );
      console.log("_txEsendTransaction account.balance", account.balance); //-- debug info
      await this._DBOperator.accountDao.insertAccount(account);
      await this._DBOperator.transactionDao.insertTransaction(tx);
    }
    return success;
  }
}

module.exports = AccountCore;
