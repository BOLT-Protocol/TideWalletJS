const { ACCOUNT_EVT } = require("../models/account.model");
const AccountService = require("./accountService");
const BigNumber = require("bignumber.js");
class AccountServiceBase extends AccountService {
  constructor(AccountCore) {
    super();
    this._AccountCore = AccountCore;
    this._DBOperator = AccountCore._DBOperator;
    this._TideWalletCommunicator = AccountCore._TideWalletCommunicator;
  }

  /**
   * Push subject event to AccountCore messenger
   * @method _pushResult
   * @returns {void}
   */
  async _pushResult() {
    let accounts = await this._DBOperator.accountDao.findAllByAccountId(
      this._accountId
    );

    accounts = accounts.map((a) => ({
      ...a,
      accountType: this._base,
    }));

    this._AccountCore.accounts[this._accountId] = accounts;

    const msg = {
      evt: ACCOUNT_EVT.OnUpdateCurrency,
      value: accounts,
    };

    this._AccountCore.messenger.next(msg);
  }

  /**
   * Get currencies including account and tokens
   * If tokens not store in databse, would fetch the token detail and insert to database
   * @method _getData
   * @returns {Array} Concat of account and tokens array
   */
  async _getData() {
    try {
      const res = await this._TideWalletCommunicator.AccountDetail(
        this._accountId
      );
      const account = await this._DBOperator.accountDao.findAccount(
        this._accountId
      );
      const timestamp = Date.now();
      account.balance = res["balance"];
      account.numberOfUsedExternalKey = res["number_of_used_external_key"] ?? 0;
      account.numberOfUsedInternalKey = res["number_of_used_internal_key"] ?? 0;
      account.lastSyncTime = timestamp;

      let tokens = res["tokens"];
      const currs = await this._DBOperator.currencyDao.findAllCurrencies();
      const newTokens = [];

      tokens = tokens.map((token) => {
        const index = currs.findIndex(
          (c) => c.currencyId === token["token_id"]
        );
        if (index < 0) {
          newTokens.push(cur);
        }
        const entity = this._DBOperator.accountDao.entity({
          id: token["account_token_id"],
          account_id: account.accountId,
          user_id: account.userId,
          blockchain_id: account.blockchainId,
          currency_id: token["token_id"],
          balance: token["balance"],
          last_sync_time: account.lastSyncTime,
          number_of_used_external_key: account.numberOfUsedExternalKey,
          number_of_used_internal_key: account.numberOfUsedInternalKey,
          purpose: account.purpose,
          coin_type_account: account.accountCoinType,
          account_index: account.accountIndex,
          curve_type: account.curveType,
          network: account.network,
          coin_type_blockchain: account.blockchainCoinType,
          publish: token["publish"], // Join Token
          chain_id: account.chainId,
          name: token["name"], // Join Token
          description: token["description"], // Join Token
          symbol: token["symbol"], // Join Token
          decimals: token["decimals"], // Join Token
          total_supply: token["total_supply"], // Join Token
          contract: token["contract"], // Join Token
          type: token["type"], // Join Token
          image: currs[index].image, // Join Currency || url
          exchange_rate: currs[index].exchangeRate, // ++ Join Currency || inUSD,
        });
        return entity;
      });
      await this._DBOperator.accountDao.insertAccounts(tokens);

      if (newTokens.length > 0) {
        await Promise.all(
          newTokens.map((token) => {
            return new Promise(async (resolve, reject) => {
              const res = await this._TideWalletCommunicator.TokenDetail(
                token["blockchain_id"],
                token["token_id"]
              );
              if (res != null) {
                const token = this._DBOperator.currencyDao.entity(res);
                await this._DBOperator.currencyDao.insertCurrency(token);
              }
            });
          })
        );
      }

      return [account, ...tokens];
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  /**
   * Sync transctions belong this account
   * And push subject event to AccountCore messenger
   * @method _syncTransactions
   * @returns {void}
   */
  async _syncTransactions() {
    const accounts = this._AccountCore.accounts[this._accountId];
    const qureries = accounts.map((account) => {
      return new Promise(async (resolve) => {
        const transactions = await this._getTransaction(account);
        const txMsg = {
          evt: ACCOUNT_EVT.OnUpdateTransactions,
          value: {
            account,
            transactions,
          },
        };

        this._AccountCore.messenger.next(txMsg);

        resolve(true);
      });
    });

    qureries.reduce(
      (promise, func) =>
        promise.then((result) =>
          func.then(Array.prototype.concat.bind(result))
        ),
      Promise.resolve([])
    );
  }

  /**
   * Get transctions
   * @method _getTransaction
   * @param {Object} account The account object
   * @returns {Array} The sorted transactions
   */
  async _getTransaction(account) {
    try {
      const res = await this._TideWalletCommunicator.ListTransactions(
        account.id
      );
      const txs = res.map((t) =>
        this._DBOperator.transactionDao.entity({
          ...t,
          accountId: account.id,
        })
      );

      await this._DBOperator.transactionDao.insertTransactions(txs);
    } catch (error) {
      console.log(error);
    }

    return this._loadTransactions(account.id);
  }

  /**
   * Load transctions from database
   * @method _loadTransactions
   * @param {string} accountId The account Id
   * @returns {Array} The sorted transactions
   */
  async _loadTransactions(accountId) {
    const transactions =
      await this._DBOperator.transactionDao.findAllTransactionsById(accountId);

    const txNull = transactions.filter((t) => t.timestamp === null);
    const txReady = transactions
      .filter((t) => t.timestamp !== null)
      .sort((a, b) => (a.timestamp <= b.timestamp ? 1 : -1));
    console.log("_loadTransactions txNull", txNull);
    console.log("_loadTransactions txReady", txReady);

    return [...txNull, ...txReady];
  }

  /**
   * @override
   */
  init(accountId, base, interval) {
    this._accountId = accountId;
    this._base = base;
    this._syncInterval = interval ?? this._syncInterval;
  }

  /**
   * @override
   */
  async start() {
    const select = await this._DBOperator.accountDao.findAccount(
      this._accountId
    );

    this._pushResult();

    if (select) {
      this._lastSyncTimestamp = select.lastSyncTime;
    } else {
      this._lastSyncTimestamp = 0;
    }
  }

  /**
   * Clear timer
   * @override
   */
  stop() {
    clearInterval(this.timer);
  }

  /**
   * @override
   */
  getReceivingAddress() {
    // Override by decorator
  }

  /**
   * @override
   */
  getChangingAddress() {
    // Override by decorator
  }

  /**
   * @override
   * the reason why I dont use this.service.id is that AccountCurrency and AccountToken share the same accountId
   * but they might have different deicaml. futhermore, where we call this function
   * is able to acess account obj with asking DB, so why not?
   * And both of them are using the same class Account(or AccountDao.enity) so they have the same inferface which
   * has the property of decimal
   */
  getTransactionFee() {
    // Override by decorator
  }

  /**
   * @override
   * according to currency decimal to transform amount to currency unit
   * @method toCurrencyUint
   * @param {amount} string
   * @param {decimals} interger
   */
  toCurrencyUint(amount, decimals) {
    const bnAmount = new BigNumber(amount);
    const bnBase = new BigNumber(10);
    const bnDecimal = bnBase.exponentiatedBy(decimals);
    const currencyUint = bnAmount.dividedBy(bnDecimal).toFixed();
    return currencyUint;
  }

  /**
   * @override
   * @method toSmallestUint
   * @param {amount} string
   * @param {decimals} interger
   */
  toSmallestUint(amount, decimals) {
    const bnAmount = new BigNumber(amount);
    const bnBase = new BigNumber(10);
    const bnDecimal = bnBase.exponentiatedBy(decimals);
    const smallestUint = bnAmount.multipliedBy(bnDecimal).toFixed();
    return smallestUint;
  }

  /**
   * @override
   */
  publishTransaction() {
    // Override by decorator
  }

  /**
   * Update transactions
   * This function would be call by notification
   * @override
   * @method updateTransaction
   * @param {string} id The id
   * @param {Object} transaction The transaction
   * @returns {void}
   */
  async updateTransaction(id, transaction) {
    const accounts = this._AccountCore.accounts[this.accountId];
    const account = accounts.find((acc) => acc.id === id);

    const txMsg = {
      account,
      transaction,
    };

    this._AccountCore.messenger.next(txMsg);

    await this._DBOperator.transactionDao.insertTransaction(transaction);
  }

  /**
   * Update currencies
   * This function would be call by notification
   * @override
   * @method updateCurrency
   * @param {string} id The Id
   * @param {Array} transactions The transaction list
   * @returns {void}
   */
  async updateCurrency(id, payload) {
    const accounts = this._AccountCore.accounts[this.accountId];
    const account = accounts.find((acc) => acc.id === id);
    const updated = this._DBOperator.accountDao.entity({
      ...account,
      balance: `${payload["balance"]}`,
      last_sync_time: Date.now(),
    });
    await this._DBOperator.accountDao.insertAccount(updated);
    this._pushResult();
  }

  /**
   * Get currencies if needed
   * @override
   * @method synchro
   * @param {boolean} force Force synchro
   * @returns {void}
   */
  async synchro(force = false) {
    const now = Date.now();

    if (now - this._lastSyncTimestamp > this._syncInterval || force) {
      const accounts = await this._getData();
      console.log(accounts);
      await this._DBOperator.accountDao.insertAccounts(accounts);
      this._lastSyncTimestamp = now;
    }

    await this._pushResult();
    await this._syncTransactions();
  }
}

module.exports = AccountServiceBase;
