const { ACCOUNT_EVT } = require("../models/account.model");
const AccountService = require("./accountService");
const Agent = require("../helpers/httpAgent");

const agent = new Agent();
class AccountServiceBase extends AccountService {
  constructor(AccountCore) {
    super();

    this._AccountCore = AccountCore;
  }

  /**
   * Push subject event to AccountCore messenger
   * @method _pushResult
   * @returns {void}
   */
  _pushResult() {
    // TODO: DB
    const cs = [];

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
    // TODO: Communicator get /wallet/account/${this._accountId}
    const acc = null;

    agent.get("/blockchain").then((res) => {
      console.log(res);
    });

    if (acc) {
      const tokens = acc["tokens"];

      // TODO: DB
      const currs = [];
      const newTokens = [];

      tokens.forEach((token) => {
        const cur = _currs.find((c) => c.currencyId === token["token_id"]);

        if (index < 0) {
          newTokens.push(cur);
        }
      });

      if (newTokens.length > 0) {
        await Promise.all(
          newTokens.map((token) => {
            // Communicator get /blockchain/${token['blockchain_id']}/token/${token['token_id']}
            // TODO: DB
          })
        );
      }

      return [acc, ...tokens];
    }

    return [];
  }

  /**
   * If there is not any tokens, get tokens
   * @method _getSupportedToken
   * @returns {void}
   */
  async _getSupportedToken() {
    // TODO: DB
    const tokens = [];

    if (tokens.length < 1) {
      // TODO: DB
      const acc = { networkId: 1 };
      // TODO: Communicator get '/blockchain/${acc.networkId}/token?type=TideWallet'
      const res = {};
      if (res.data) {
        // TOOD: DB
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
          func().then(Array.prototype.concat.bind(result))
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
    // TODO: Communicator get /wallet/account/txs/${currency.id
    const res = {};

    if (res.success) {
      const txs = res.data;

      // TODO: DB
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
    // TODO: DB
    const transactions = [];

    const txNull = transactions.filter((t) => t.timestamp === null);
    const txReady = transactions.filter((t) => t.timestamp !== null);

    return [...txNull, ...txReady];
  }

  /**
   * Load setting page token list
   * @method _getSettingTokens
   * @returns {void}
   */
  _getSettingTokens() {
    // TODO: DB
    const acc = {};

    // TODO: Commuicate /blockchain/${acc.networkId}/token?type=TideWallet
    const res = {};
    if (res.success) {
      this._AccountCore.settingOptions += ds;
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
    // TODO: DB
    const select = null;

    await this._pushResult();
    await this._getSupportedToken();
    await this._getSettingTokens();

    if (select) {
      this._lastSyncTimestamp = select.lastSyncTime;
    } else {
      this._lastSyncTimestamp = 0;
    }

    // TODO: Remove
    this.synchro()
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
   * @param {Array} transactions The transaction list
   * @returns {void}
   */
  updateTransaction(currencyId, transactions) {
    const currencies = this._AccountCore.currencies[this.accountId];
    const currency = currencies.find((c) => c.currencyId === currencyId);

    const txMsg = {
      currency,
      transactions,
    };

    this._AccountCore.messenger.next(txMsg);

    // TODO: DB
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
  updateCurrency(currencyId, payload) {
    // TODO: DB
    const acs = [];
    const ac = acs.find((a) => a.currencyId === currencyId);

    // TODO: DB
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

      // TODO: DB
    }

    await this._pushResult();
    await this._syncTransactions();
  }
}

module.exports = AccountServiceBase;
