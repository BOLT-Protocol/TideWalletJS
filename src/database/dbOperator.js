const IndexedDB = require("./indexedDB");
const Sqlite = require("./sqlite");
const { isBrowser } = require("../helpers/env");

class DBOperator {
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
    return this;
  }

  async init(dir) {
    if (this._isInit) return;
    this.database = isBrowser() ? new IndexedDB() : new Sqlite();
    this._isInit = true;

    return this.database.init(dir);
  }

  down() {
    if (!this.database) return;
    this.database.close();
  }
}

module.exports = DBOperator;
