const { ACCOUNT_EVT } = require("../models/account.model");
const AccountService = require("./accountService");
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
      /**
       * res
       * account_id: "8d047ea8-0420-4324-aed5-64352a602a30"
       * account_index: "0"
       * balance: "0"
       * blockchain_id: "8000003C"
       * currency_id: "5b755dacd5dd99000b3d92b2"
       * curve_type: 0
       * icon: "https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@9ab8d6934b83a4aa8ae5e8711609a70ca0ab1b2b/32/icon/eth.png"
       * purpose: 3324
       * symbol: "ETH"
       * tokens: [
       *         {
       *          "account_token_id": "488c3047-ced5-4049-9967-8ececb41ced1",
                  "token_id": "5b1ea92e584bf50020130617",
                  "blockchain_id": "80000060",
                  "name": "Tether",
                  "symbol": "USDT",
                  "type": 2,
                  "publish": true,
                  "decimals": 2,
                  "total_supply": "26,310,299,179",
                  "contract": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
                  "balance": "0"
       *     }
       *  ]
       */
      const acc = res;
      let tokens = acc["tokens"];
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
          ...account,
          id: token["account_token_id"],
          currency_id: token["token_id"],
          name: token["name"], // Join Token
          symbol: token["symbol"], // Join Token
          type: token["type"], // Join Token
          publish: token["publish"], // Join Token
          decimals: token["decimals"], // Join Token
          total_supply: token["total_supply"], // Join Token
          contract: token["contract"], // Join Token
          description: token["description"], // Join Token
          icon: currs[index].image, // Join Currency || url
          exchange_rate: currs[index].exchangeRate, // ++ Join Currency || inUSD,
          balance: token["balance"],
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

      return [acc, ...tokens];
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
          accountcurrencyId: account.id,
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
    const txReady = transactions.filter((t) => t.timestamp !== null);

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
   */
  getTransactionFee() {
    // Override by decorator
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
      const v = accounts.map((acc) =>
        this._DBOperator.accountDao.entity({
          ...acc,
          last_sync_time: now,
        })
      );
      await this._DBOperator.accountDao.insertAccounts(v);
      this._lastSyncTimestamp = now;
    }

    await this._pushResult();
    await this._syncTransactions();
  }
}

module.exports = AccountServiceBase;
