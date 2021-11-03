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
const UnspentTxOut = require("../models/utxo.model");
const TideWalletCommunicator = require('./TideWalletCommunicator')

class AccountCore {
  static syncInterval = 24 * 60 * 60; // second
  static instance;
  _accounts = {};
  _messenger = null;
  _settingOptions = [];
  _DBOperator = null;
  _syncCalledCount = 0;
  _partialSyncCalledCount = 0;
  _forceSyncLock = false;

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
    this._isInit = true;
    const user = await this._DBOperator.userDao.findUser(
      this._TideWalletCore.userInfo.id
    );
    const timestamp = Math.floor(new Date() / 1000);
    const update = user.lastSyncTime - timestamp > AccountCore.syncInterval;
    const fiat = await this._trader.getSelectedFiat();
    const chains = await this._getNetworks(update);
    const accounts = await this._getAccounts(update);
    const currencies = await this._getSupportedCurrencies(update);
    if (update) {
      user.lastSyncTime = timestamp;
      await this._DBOperator.userDao.insertUser(user);
    }
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
              this,
              this._TideWalletCommunicator,
              this._DBOperator
            );
            _ACCOUNT = ACCOUNT.BTC;
            break;
          case 60:
          case 603:
            svc = new EthereumService(
              this,
              this._TideWalletCommunicator,
              this._DBOperator
            );
            _ACCOUNT = ACCOUNT.ETH;
            break;
          case 8017:
            svc = new EthereumService(
              this,
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
    if (this._isInit && !this._forceSyncLock) {
      this._forceSyncLock = true;
      const jobs = [];
      for (const svc of this._services) {
        jobs.push(svc.synchro(true));
      }
      console.log("account.sync() jobs:", jobs);
      console.log("account.sync() sync called time:", ++this._syncCalledCount);
      await Promise.all(jobs);
      this._forceSyncLock = false;
    }
  }

  /**
   * partial sync service
   * @method partialSync
   * @param accountId
   */
  async partialSync(id) {
    if (this._isInit && !this._forceSyncLock) {
      this._forceSyncLock = true;
      const account = this.getAllCurrencies.find((acc) => acc.id === id);
      const targetSvc = this._services.find(
        (svc) => svc.accountId == account.accountId
      );
      console.log("partialStnc svc", targetSvc);
      if (!!targetSvc) {
        console.log(
          "account.partialSync() partialSync called time:",
          ++this._partialSyncCalledCount
        );
        await targetSvc.synchro(true);
      }
      this._forceSyncLock = false;
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
  async _getNetworks(update) {
    let networks = await this._DBOperator.networkDao.findAllNetworks();

    // if DB is empty get supported blockchain from backend service
    if (!networks || networks.length < 1 || update) {
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
  async _getAccounts(update) {
    let accounts = await this._DBOperator.accountDao.findAllAccounts();

    // Filter accounts by current User
    accounts = accounts.filter(
      (acc) => acc.userId === this._TideWalletCore.userInfo.id
    );

    if (!accounts || accounts.length < 1 || update) {
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
  async _getSupportedCurrencies(update) {
    // get supported currencies from DB
    let currencies = await this._DBOperator.currencyDao.findAllCurrencies();

    // if DB is empty get supported currencies from backend service
    if (!currencies || currencies.length < 1 || update) {
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
   * @method getCurrency
   * @param {string} id The account id
   * @returns {Account} The Account
   */
  getCurrency(id) {
    return this.getAllCurrencies.find((acc) => acc.id === id);
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
  get getAllCurrencies() {
    return Object.values(this._accounts).reduce(
      (list, curr) => list.concat(curr),
      []
    );
  }

  /**
   * Get transaction list by account id
   * @method getTransactions
   * @param {string} id The account id
   * @returns {Array} The transaction list
   */
  async getTransactions(id) {
    const account = this.getAllCurrencies.find((acc) => acc.id === id);
    const svc = this.getService(account.accountId);
    const txs = await svc.getTransactions(id);
    return txs;
  }

  /**
   * Get receive address by account Id
   * @method getReceiveAddress
   * @param {string} id The id of the account
   * @returns {string} The address
   */
  async getReceiveAddress(id) {
    const account = this.getAllCurrencies.find((acc) => acc.id === id);
    const svc = this.getService(account.accountId);
    const address = await svc.getReceivingAddress(account.accountId);
    console.log(address);
    return address;
  }

  /**
   * Get receive address for bridge by account Id
   * @method getReceiveAddress
   * @param {string} id The id of the account
   * @returns {string} The address
   */
   async getBridgeAccountReceive(id) {
    const account = this.getAllCurrencies.find((acc) => acc.id === id);
    const svc = this.getService(account.accountId);
    const address = await TideWalletCommunicator.BridgeAccountReceive(account.accountId);
    console.log(address);
    return address;
  }

  /**
   * Get TransactionFee and gasLimit by id
   * @param {string} id
   * @param {string} to [optional]
   * @param {string} amount [optional]
   * @param {string} message [optional]
   * @returns
   */
  async getTransactionFee({ id, to, amount, data: message, speed }) {
    console.log("getTransactionFee to", to);
    console.log("getTransactionFee amount", amount);
    const account = this.getAllCurrencies.find((acc) => acc.id === id);
    const svc = this.getService(account.accountId);
    let shareAccount;
    if (account.type === "token") {
      shareAccount = this._accounts[account.accountId][0];
      message = svc.tokenTxMessage({
        to,
        amount,
        decimals: account.decimals,
        message,
      });
      amount = "0";
      to = account.contract;
    } else shareAccount = account;
    const fees = await svc.getTransactionFee({
      id: account.accountId,
      blockchainId: account.blockchainId,
      decimals: shareAccount.decimals,
      to,
      amount,
      message,
      speed,
    });
    console.log("fees", fees);
    return { ...fees, symbol: shareAccount.symbol };
  }

  verifyAddress(id, address) {
    const account = this.getAllCurrencies.find((acc) => acc.id === id);
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

  verifyAmount(id, amount, fee) {
    const account = this.getAllCurrencies.find((acc) => acc.id === id);
    let shareAccount;
    if (account.type === "token")
      shareAccount = this._accounts[account.accountId][0];
    else shareAccount = account;
    const amountPlusFee = SafeMath.plus(amount, fee);
    const result =
      account.type === "token"
        ? SafeMath.gte(shareAccount.balance, fee) &&
          SafeMath.gte(account.balance, amount)
        : SafeMath.gte(account.balance, amountPlusFee);
    return result;
  }

  async sendETHBasedTx(account, svc, safeSigner, transaction) {
    const nonce = Number.parseInt(transaction.nonce) > -1 ? Number.parseInt(transaction.nonce) : await svc.getNonce(account.blockchainId, transaction.from);
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
   * @param {Object} transaction The transaction content
   * @param {string} transaction.to
   * @param {string} transaction.amount
   * @param {string} transaction.feePerUnit
   * @param {string} transaction.feeUnit
   * @param {number?} transaction.nonce
   * @returns {string | null} txid
   */
  async sendTransaction(id, transaction) {
    const account = this.getAllCurrencies.find((acc) => acc.id === id);
    let _transaction = { ...transaction };
    let shareAccount;
    const svc = this.getService(account.accountId);
    const from = await svc.getReceivingAddress(id);
    const safeSigner = this._TideWalletCore.getSafeSigner(
      `m/${account.purpose}'/${account.accountCoinType}'/${account.accountIndex}'`
    );
    if (account.type === "token") {
      shareAccount = this._accounts[account.accountId][0];
      transaction.message = svc.tokenTxMessage({
        ...transaction,
        decimals: account.decimals,
      });
      transaction.to = account.contract;
      transaction.amount = "0";
    } else {
      shareAccount = account;
      transaction.amount = SafeMath.toSmallestUint(
        transaction.amount,
        account.decimals
      );
    }
    transaction.from = from;
    transaction.feePerUnit = SafeMath.toSmallestUint(
      transaction.feePerUnit,
      shareAccount.decimals
    );
    transaction.fee = SafeMath.toSmallestUint(
      transaction.fee,
      shareAccount.decimals
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
        if (success) {
          const txOuts = tx.inputs.map((input) => {
            const _txOut = new UnspentTxOut({ ...input.utxo });
            const txOut = {
              ..._txOut,
              utxoId: _txOut.id,
              amount: _txOut.amountInSmallestUint,
              locked: true,
              type: _txOut.type.value,
              script: _txOut.data.toString("hex"),
            };
            return txOut;
          });
          console.log("insert data:", [...txOuts, tx.changeUtxo]);
          await this._DBOperator.utxoDao.insertUtxos([
            ...txOuts,
            tx.changeUtxo,
          ]);
        }
        break;
      default:
        break;
    }
    if (success) {
      tx.feePerUnit = SafeMath.toCurrencyUint(
        transaction.feePerUnit,
        shareAccount.decimals
      );
      tx.fee = SafeMath.toCurrencyUint(transaction.fee, shareAccount.decimals);
      tx.accountId = account.id;
      tx.id = account.id + tx.txid;
      if (account.type === "token") {
        const _tokenTx = {
          ...tx,
          amount: _transaction.amount,
          destinationAddresses: _transaction.to,
        };
        const _accTx = {
          ...tx,
          id: shareAccount.id + tx.txid,
          accountId: shareAccount.id,
          amount: "0",
          destinationAddresses: _transaction.to,
        };
        account.balance = SafeMath.minus(account.balance, _tokenTx.amount);
        shareAccount.balance = SafeMath.minus(shareAccount.balance, tx.fee);
        const entAccount = {...account}; // -- work around
        Object.keys(entAccount).filter((k) => !Object.keys(this._DBOperator.accountDao.entity({})).includes(k)).map((k)=> delete entAccount[k]); // -- work around
        const entShareAccount = {...account}; // -- work around
        Object.keys(entShareAccount).filter((k) => !Object.keys(this._DBOperator.accountDao.entity({})).includes(k)).map((k)=> delete entShareAccount[k]); // -- work around
        const entTokenTx = {..._tokenTx}; // -- work around
        Object.keys(entTokenTx).filter((k) => !Object.keys(this._DBOperator.transactionDao.entity({})).includes(k)).map((k)=> delete entTokenTx[k]); // -- work around
        const entAccTx = {..._accTx}; // -- work around
        Object.keys(entAccTx).filter((k) => !Object.keys(this._DBOperator.transactionDao.entity({})).includes(k)).map((k)=> delete entAccTx[k]); // -- work around
        await this._DBOperator.accountDao.insertAccounts([
          entAccount,
          entShareAccount,
        ]);
        await this._DBOperator.transactionDao.insertTransactions([
          entTokenTx,
          entAccTx,
        ]);
      } else {
        tx.amount = SafeMath.toCurrencyUint(
          transaction.amount,
          account.decimals
        );
        console.log("sendTransaction tx", tx); //-- debug info
        account.balance = SafeMath.minus(
          SafeMath.minus(account.balance, tx.amount),
          tx.fee
        );
        console.log("_txEsendTransaction account.balance", account.balance); //-- debug info
        const entAccount = {...account}; // -- work around
        Object.keys(entAccount).filter((k) => !Object.keys(this._DBOperator.accountDao.entity({})).includes(k)).map((k)=> delete entAccount[k]); // -- work around
        const entTx = {...tx}; // -- work around
        Object.keys(entTx).filter((k) => !Object.keys(this._DBOperator.transactionDao.entity({})).includes(k)).map((k)=> delete entTx[k]); // -- work around
        await this._DBOperator.accountDao.insertAccount(entAccount);
        await this._DBOperator.transactionDao.insertTransaction(entTx);
      }
      return tx.txid;
    }
    return null;
  }
}

module.exports = AccountCore;
