const IndexedDB = require("./indexdDB");
const { isBrowser } = require("../helpers/env");

class DBOperator {
  static instance;
  database = null;
  _isInit = false;

  get userDao() {
    return this.database.userDao;
  }

  get accountDao() {
    return this.database.accountDao;
  }

  get currencyDao() {
    return this.database.currencyDao;
  }

  get transactionDao() {
    return this.database.transactionDao;
  }

  get networkDao() {
    return this.database.networkDao;
  }

  get accountCurrencyDao() {
    return this.database.accountCurrencyDao;
  }

  get utxoDao() {
    return this.database.utxoDao;
  }

  get exchangeRateDao() {
    return this.database.exchangeRateDao;
  }

  get prefDao() {
    return this.database.prefDao;
  }

  constructor() {
    if (!DBOperator.instance) {
      DBOperator.instance = this;
    }

    return DBOperator.instance;
  }

  async init(inMemory = false) {
    if (this._isInit) return;
    this.database = isBrowser() ? new IndexedDB() : null;
    this._isInit = true;

    return this.database.init();
  }

  down() {
    if (!this.database) return;
    this.database.close();
  }
}

module.exports = DBOperator;
