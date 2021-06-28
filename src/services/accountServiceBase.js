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
    let cs = await this._DBOperator.accountCurrencyDao.findJoinedByAccountId(
      this._accountId
    );

    cs = cs.map((c) => ({
      ...c,
      accountType: this._base,
    }));

    this._AccountCore.currencies[this._accountId] = cs;

    const msg = {
      evt: ACCOUNT_EVT.OnUpdateCurrency,
      value: cs,
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
      const res = await this._TideWalletCommunicator.AccountDetail(this._accountId)
      const acc = res;
      const tokens = acc["tokens"];
      const currs = await this._DBOperator.currencyDao.findAllCurrencies();
      const newTokens = [];

      tokens.forEach((token) => {
        const index = currs.findIndex(
          (c) => c.currencyId === token["token_id"]
        );

        if (index < 0) {
          newTokens.push(cur);
        }
      });

      if (newTokens.length > 0) {
        await Promise.all(
          newTokens.map((token) => {
            return new Promise(async (resolve, reject) => {
              const res = await this._TideWalletCommunicator.TokenDetail(token["blockchain_id"], token["token_id"]);
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
   * If there is not any tokens, get tokens
   * @method _getSupportedToken
   * @returns {void}
   */
  async _getSupportedToken() {
    const tokens =
      await this._DBOperator.currencyDao.findAllCurrenciesByAccountId(
        this._accountId
      );

    if (tokens.length < 1) {
      const acc = await this._DBOperator.accountDao.findAccount(
        this._accountId
      );
      try {
        const res = await this._TideWalletCommunicator.TokenList(acc.networkId);
        if (res) {
          const tokens = res.map((t) =>
            this._DBOperator.currencyDao.entity(t)
          );
          await this._DBOperator.currencyDao.insertCurrencies(tokens);
        }
      } catch (error) {
        console.log(error);
      }
    }
  }

  /**
   * Sync transctions belong this account
   * And push subject event to AccountCore messenger
   * @method _syncTransactions
   * @returns {void}
   */
  async _syncTransactions() {
    const currencies = this._AccountCore.currencies[this._accountId];
    const qureries = currencies.map((currency) => {
      return new Promise(async (resolve) => {
        const transactions = await this._getTransaction(currency);
        const txMsg = {
          evt: ACCOUNT_EVT.OnUpdateTransactions,
          value: {
            currency,
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
   * @param {Object} currency The accountcurrency object
   * @returns {Array} The sorted transactions
   */
  async _getTransaction(currency) {
    try {
      const res = await this._TideWalletCommunicator.ListTransactions(currency.accountcurrencyId);
      const txs = res.map((t) =>
        this._DBOperator.transactionDao.entity({
          ...t,
          accountcurrencyId: currency.accountcurrencyId,
        })
      );

      await this._DBOperator.transactionDao.insertTransactions(txs);
    } catch (error) {
      console.log(error);
    }

    return this._loadTransactions(currency.id);
  }

  /**
   * Load transctions from database
   * @method _loadTransactions
   * @param {string} currency The accountcurrency Id
   * @returns {Array} The sorted transactions
   */
  async _loadTransactions(currencyId) {
    const transactions =
      await this._DBOperator.transactionDao.findAllTransactionsById(currencyId);

    const txNull = transactions.filter((t) => t.timestamp === null);
    const txReady = transactions.filter((t) => t.timestamp !== null);

    return [...txNull, ...txReady];
  }

  /**
   * Load setting page token list
   * @method _getSettingTokens
   * @returns {void}
   */
  async _getSettingTokens() {
    const acc = await this._DBOperator.accountDao.findAccount(this._accountId);
    try {
      const res = await this._TideWalletCommunicator.TokenList(acc.networkId);
      const ds = res.map((tk) => ({
        ...tk,
        accountId: this._accountId,
        blockchainId: acc.networkId,
      }));
      this._AccountCore.settingOptions += ds;
    } catch (error) {
      console.log(error);
    }
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
    const select =
      await this._DBOperator.accountCurrencyDao.findOneByAccountyId(
        this._accountId
      );

    await this._pushResult();
    await this._getSupportedToken();
    await this._getSettingTokens();

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
   * @param {string} currency The accountcurrency Id
   * @param {Object} transaction The transaction
   * @returns {void}
   */
  async updateTransaction(currencyId, transaction) {
    const currencies = this._AccountCore.currencies[this.accountId];
    const currency = currencies.find((c) => c.currencyId === currencyId);

    const txMsg = {
      currency,
      transactions,
    };

    this._AccountCore.messenger.next(txMsg);

    await this._DBOperator.transactionDao.insertTransaction(transaction);
  }

  /**
   * Update currencies
   * This function would be call by notification
   * @override
   * @method updateCurrency
   * @param {string} currency The accountcurrency Id
   * @param {Array} transactions The transaction list
   * @returns {void}
   */
  async updateCurrency(currencyId, payload) {
    const acs = await this._DBOperator.accountCurrencyDao.findAllCurrencies();
    const ac = acs.find((a) => a.currencyId === currencyId);
    const updated = this._DBOperator.accountCurrencyDao.entity({
      accountcurrency_id: ac.accountcurrencyId,
      account_id: this._accountId,
      currency_id: ac.currencyId,
      balance: `${payload["balance"]}`,
      number_of_used_external_key: ac.numberOfUsedExternalKey,
      number_of_used_internal_key: ac.numberOfUsedInternalKey,
      last_sync_time: Date.now(),
    });

    await this._DBOperator.accountCurrencyDao.insertAccount(updated);
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
      const currs = await this._getData();
      const v = currs.map((c) =>
        this._DBOperator.accountCurrencyDao.entity({
          ...c,
          accountcurrency_id: c["account_id"] ?? c["account_token_id"],
          account_id: this._accountId,
          last_sync_time: now,
        })
      );

      await this._DBOperator.accountCurrencyDao.insertCurrencies(v);
    }

    await this._pushResult();
    await this._syncTransactions();
  }
}

module.exports = AccountServiceBase;
