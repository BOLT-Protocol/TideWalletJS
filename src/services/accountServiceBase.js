const { toCurrencyUint } = require("../helpers/SafeMath");
const SafeMath = require("../helpers/SafeMath");
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

    const currencies = this._AccountCore.getAllCurrencies;
    const fiat = await this._AccountCore.trader.getSelectedFiat();
    const userBalanceInFiat = currencies.reduce((acc, curr) => {
      curr.inFiat = this._AccountCore.trader.calculateToFiat(curr, fiat);
      return SafeMath.plus(acc, curr.inFiat);
    }, 0);
    const msg = {
      evt: ACCOUNT_EVT.OnUpdateCurrency,
      accounts,
      userBalanceInFiat,
      fiat,
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
      const fiat = await this._AccountCore.trader.getSelectedFiat();
      account.inFiat = this._AccountCore.trader.calculateToFiat(account, fiat);

      const _tokens = res["tokens"];
      const currs = await this._DBOperator.currencyDao.findAllCurrencies();
      const tokens = [];
      const newTokens = [];

      _tokens.forEach((token) => {
        let entity;
        const index = currs.findIndex(
          (c) => c.currencyId === token["token_id"]
        );
        const _type =
          token["type"] === 0
            ? "fiat"
            : token["type"] === 1
            ? "currency"
            : "token";
        entity = this._DBOperator.accountDao.entity({
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
          type: _type, // Join Token
        });
        if (index < 0) {
          newTokens.push(entity);
        } else {
          entity.image = currs[index].image; // Join Currency || url
          entity.exchangeRate = currs[index].exchangeRate; // ++ Join Currency || inUSD,
          entity.inFiat = this._AccountCore.trader.calculateToFiat(
            entity,
            fiat
          );
          tokens.push(entity);
        }
      });

      if (newTokens.length > 0) {
        await Promise.all(
          newTokens.map((token) => {
            return new Promise(async (resolve, reject) => {
              const res = await this._TideWalletCommunicator.TokenDetail(
                token.blockchainId,
                token.currencyId
              );
              if (res != null) {
                const token = this._DBOperator.currencyDao.entity(res);
                await this._DBOperator.currencyDao.insertCurrency(token);
                token.image = res["icon"]; // Join Currency || url
                token.exchangeRate = res["exchange_rate"]; // ++ Join Currency || inUSD,
                resolve(token);
                return token;
              }
            });
          })
        );
      }

      return [account, ...tokens, ...newTokens];
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
    let shareAccount,
      transactions = [];
    try {
      const res = await this._TideWalletCommunicator.ListTransactions(
        account.id
      );
      if (account.type === "token") {
        shareAccount = this._AccountCore.accounts[this.accountId][0];
        transactions =
          await this._DBOperator.transactionDao.findAllTransactionsById(
            account.id
          );
        if (transactions.length > res.length) {
          transactions = transactions.filter(
            (tx) =>
              res.findIndex((r) => r.txid === tx.txid) < 0 &&
              tx.status === "pending"
          );
          transactions = transactions.filter(async (tx) => {
            const shareTx =
              await this._DBOperator.transactionDao.findTransactionById(
                shareAccount.id + tx.txid
              );
            if (!shareTx) this._DBOperator.transactionDao.deleteById(tx.id);
            if (shareTx.status === "success") {
              tx.status = "fail";
              this._DBOperator.transactionDao.updateTransaction(tx);
              return true;
            }
          });
        }
      }
      const txs = res.map((t) => {
        const enity = this._DBOperator.transactionDao.entity({
          ...t,
          message: t.note,
          accountId: account.id,
        });

        return enity;
      });
      await this._DBOperator.transactionDao.insertTransactions(txs);
    } catch (error) {
      console.log(error);
    }

    return this._loadTransactions(account.id);
  }

  async getTransactions(id) {
    return await this._loadTransactions(id);
  }

  /**
   * Load transctions from database
   * @method _loadTransactions
   * @param {string} id The account Id
   * @returns {Array} The sorted transactions
   */
  async _loadTransactions(id) {
    const shareAccount = this._AccountCore.accounts[this.accountId][0];
    const transactions =
      await this._DBOperator.transactionDao.findAllTransactionsById(id);
    const txNull = [];
    const txReady = [];
    transactions.forEach((t) => {
      t.fee = t.fee + " " + shareAccount.symbol;
      t.timestamp === null ? txNull.push(t) : txReady.push(t);
    });
    // https://dmitripavlutin.com/javascript-array-sort-numbers/
    txReady.sort((a, b) => (a.timestamp <= b.timestamp ? 1 : -1)); //(a, b) => a.timestamp - b.timestamp
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
      await this._DBOperator.accountDao.insertAccounts(accounts);
      this._lastSyncTimestamp = now;
    }

    await this._pushResult();
    await this._syncTransactions();
  }
}

module.exports = AccountServiceBase;
