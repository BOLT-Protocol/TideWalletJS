const DB_NAME = "tidebitwallet";
const DB_VERSION = 1;

const OBJ_ACCOUNT = "account";
const OBJ_TX = "transaction";
const OBJ_UTXO = "utxo";
const OBJ_USER = "user";
const OBJ_CURRENCY = "currency";
const OBJ_NETWORK = "network";
const OBJ_ACCOUNT_CURRENCY = "accountcurrency";
const OBJ_EXCHANGE_RATE = "exchange_rate";

// primary key ?
function _uuid() {
  var d = Date.now();
  if (
    typeof performance !== "undefined" &&
    typeof performance.now === "function"
  ) {
    d += performance.now();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

class IndexedDB {
  constructor() {}
  db = null;
  _userDao = null;
  _accountDao = null;
  _currencyDao = null;
  _networkDao = null;
  _txDao = null;
  _accountcurrencyDao = null;
  _utxoDao = null;
  _exchangeRateDao = null;

  init() {
    return this._createDB();
  }

  _createDB(dbName = DB_NAME, dbVersion = DB_VERSION) {
    const request = indexedDB.open(dbName, dbVersion);

    return new Promise((resolve, reject) => {
      //on upgrade needed
      request.onupgradeneeded = (e) => {
        this.db = e.target.result;
        this._createTable(dbVersion);
        resolve(this.db);
      };

      request.onsuccess = (e) => {
        this.db = e.target.result;

        this._userDao = new UserDao(this.db, OBJ_USER);
        this._accountDao = new AccountDao(this.db, OBJ_ACCOUNT);
        this._currencyDao = new CurrencyDao(this.db, OBJ_CURRENCY);
        this._networkDao = new NetworkDao(this.db, OBJ_NETWORK);
        this._txDao = new TransactionDao(this.db, OBJ_TX);
        this._utxoDao = new UtxoDao(this.db, OBJ_UTXO);
        this._accountcurrencyDao = new AccountCurrencyDao(
          this.db,
          OBJ_ACCOUNT_CURRENCY
        );
        this._exchangeRateDao = new ExchangeRateDao(this.db, OBJ_EXCHANGE_RATE);

        resolve(this.db);
      };

      request.onerror = (e) => {
        reject(this.db);
      };
    });
  }

  _createTable(version) {
    if (version <= 1) {
      const accounts = this.db.createObjectStore(OBJ_ACCOUNT, {
        keyPath: "account_id",
      });

      const txs = this.db.createObjectStore(OBJ_TX, {
        keyPath: "transaction_id",
      });
      let txIndex = txs.createIndex("accountcurrency_id", "accountcurrency_id");

      const currency = this.db.createObjectStore(OBJ_CURRENCY, {
        keyPath: "currency_id",
      });
      let currencyIndex = currency.createIndex("account_id", "account_id");

      const user = this.db.createObjectStore(OBJ_USER, {
        keyPath: "user_id",
      });

      const network = this.db.createObjectStore(OBJ_NETWORK, {
        keyPath: "network_id",
      });

      const utxo = this.db.createObjectStore(OBJ_UTXO, {
        keyPath: "utxo_id",
      });

      const accountcurrency = this.db.createObjectStore(OBJ_ACCOUNT_CURRENCY, {
        keyPath: "accountcurrency_id",
      });
      let accountcurrencyIndex = accountcurrency.createIndex(
        "account_id",
        "account_id"
      );

      const rate = this.db.createObjectStore(OBJ_EXCHANGE_RATE, {
        keyPath: "exchange_rate_id",
      });
    }
  }

  close() {
    this.db.close();
  }

  get userDao() {
    return this._userDao;
  }

  get accountDao() {
    return _accountDao;
  }

  get currencyDao() {
    return this._currencyDao;
  }

  get accountCurrencyDao() {
    return this._accountcurrencyDao;
  }

  get networkDao() {
    return this._networkDao;
  }

  get exchangeRateDao() {
    return this._exchangeRateDao;
  }

  get transactionDao() {
    return this._txDao;
  }

  get utxo() {
    // TODO:
    return _utxoDao;
  }
}

class DAO {
  constructor(db, name) {
    this._db = db;
    this._name = name;
  }

  static entity() {}

  /**
   *
   * @param {Object} data The entity return value
   * @param {Object} [options]
   */
  _write(data, options) {
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(this._name, "readwrite");
      // const request = tx.objectStore(this._name).add(data);
      const request = tx.objectStore(this._name).put(data);

      request.onsuccess = (e) => {
        resolve(true);
      };

      request.onerror = (e) => {
        console.log("Write DB Error: " + e.error);
        reject(false);
      };

      tx.onabort = () => {
        console.log("Write DB Error: Transaction Abort");

        reject(false);
      };
    });
  }

  _writeAll(entities) {
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(this._name, "readwrite");
      entities.forEach((entity) => {
        tx.objectStore(this._name).put(entity);
      });

      tx.oncomplete = (e) => {
        resolve(true);
      };

      tx.onabort = (e) => {
        reject(false);
      };
    });
  }

  _read(value = null, index) {
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(this._name, "readonly");
      const store = tx.objectStore(this._name);

      if (index) {
        store = store.index(index);
      }
      const request = store.get(value);

      request.onsuccess = (e) => {
        resolve(e.target.result);
      };

      request.onerror = (e) => {
        console.log("Read DB Error: " + e.error);
        reject(e.error);
      };
    });
  }

  _readAll(value = null, index) {
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(this._name, "readonly");
      let store = tx.objectStore(this._name);

      if (index) {
        store = store.index(index);
      }

      const request = store.getAll(value);

      request.onsuccess = (e) => {
        resolve(e.target.result);
      };

      request.onerror = (e) => {
        console.log("Read DB Error: " + e.error);

        reject(e.error);
      };
    });
  }

  _update() {
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(this._name, "readwrite");
      const request = tx.objectStore(this._name).put(data);

      request.onsuccess = (e) => {
        resolve(true);
      };

      request.onerror = (e) => {
        console.log("Update DB Error: " + e.error);
        reject(false);
      };

      tx.onabort = () => {
        console.log("Update DB Error: Transaction Abort");

        reject(false);
      };
    });
  }

  _delete(key) {
    return new Promise((resolve, reject) => {
      let store = this._db
        .transaction(this._name, "readwrite")
        .objectStore(this._name);

      const request = store.delete(key);

      request.onsuccess = (e) => {
        resolve(true);
      };

      request.onerror = (e) => {
        reject(false);
      };
    });
  }

  _deleteAll() {
    let store = this._db
      .transaction(this._name, "readwrite")
      .objectStore(this._name);
    store.clear();
  }
}

class UserDao extends DAO {
  constructor(db, name) {
    super(db, name);
  }

  /**
   * @override
   */
  static entity({ thirdPartyId, installId, timestamp, backupStatus }) {
    return {
      user_id: 1,
      thirdPartyId,
      installId,
      timestamp,
      backupStatus,
    };
  }

  findUser() {
    return this._read(1);
  }

  insertUser(userEntity) {
    return this._write(userEntity);
  }

  updateUser(userEntity) {
    return this._write(userEntity);
  }

  deleteUser() {
    return this._delete(1);
  }
}

class AccountDao extends DAO {
  constructor(db, name) {
    super(db, name);
  }

  /**
   * @override
   */
  static entity({ accountId, userId, networkId, accountIndex }) {
    return {
      account_id: accountId,
      user_id: userId,
      network_id: networkId,
      account_index: accountIndex,
    };
  }

  findAllAccounts() {
    return this._readAll();
  }

  findAccount(accountId) {
    return this._read(accountId);
  }

  insertAccount(accountEntiry) {
    return this._write(accountEntiry);
  }

  insertAccounts(accounts) {
    return this._writeAll(accounts);
  }
}

class CurrencyDao extends DAO {
  /**
   * @override
   */
  static entity({
    currencyId,
    name,
    description,
    symbol,
    address,
    totalSupply,
    contract,
    image,
  }) {
    return {
      currency_id: currencyId,
      name,
      description,
      symbol,
      decimals,
      address,
      total_supply: totalSupply,
      contract,
      image,
    };
  }
  constructor(db, name) {
    super(db, name);
  }

  insertCurrency(currencyEntity) {
    return this._write(currencyEntity);
  }

  insertCurrencies(currencies) {
    return this._writeAll(currencies);
  }

  findAllCurrencies() {
    return this._readAll();
  }

  findAllCurrenciesByAccountId(accountId) {
    return this._readAll(accountId, "account_id");
  }
}

class NetworkDao extends DAO {
  /**
   * @override
   */
  static entity() {
    networkId, network, coinType, publish, chainId;

    return {
      network_id: networkId,
      network,
      coin_type: coinType,
      publish,
      chain_id: chainId,
    };
  }
  constructor(db, name) {
    super(db, name);
  }

  findAllNetworks() {
    return this._readAll();
  }
  insertNetworks(networks) {
    return this._writeAll(networks);
  }
}

class TransactionDao extends DAO {
  /**
   * @override
   */
  static entity({
    accountcurrencyId,
    txId,
    confirmation,
    sourceAddress,
    destinctionAddress,
    gasPrice,
    gasUsed,
    note,
    fee,
    status,
    timestamp,
    direction,
    amount,
  }) {
    return {
      transaction_id: accountcurrencyId + txId,
      accountcurrency_id: accountcurrencyId,
      tx_id: txId,
      confirmation,
      source_address: sourceAddress,
      destinction_address: destinctionAddress,
      gas_price: gasPrice,
      gas_used: gasUsed,
      note,
      fee,
      status,
      timestamp,
      direction,
      amount,
    };
  }

  findAllTransactionsById(acId) {
    return this._readAll(acId, "accountcurrency_id");
  }

  insertTransaction(entity) {
    return this._write(entity);
  }

  updateTransaction(entity) {
    return this._update(entity);
  }
  insertTransactions(txs) {
    return this._writeAll(txs);
  }
}

class AccountCurrencyDao extends DAO {
  static entity({
    accountcurrencyId,
    accountId,
    currencyId,
    balance,
    numberOfUsedExternalKey,
    numberOfUsedInternalKey,
    lastSyncTime,
  }) {
    return {
      accountcurrency_id: accountcurrencyId,
      account_id: accountId,
      currency_id: currencyId,
      balance,
      number_of_used_external_key: numberOfUsedExternalKey,
      number_of_used_internal_key: numberOfUsedInternalKey,
      last_sync_time: lastSyncTime,
    };
  }
  constructor(db, name) {
    super(db, name);
  }

  findOneByAccountyId(id) {
    return this._read(id);
  }

  findAllCurrencies() {
    return this._readAll();
  }

  findJoinedByAccountId(accountId) {
    return this._readAll(accountId, "account_id");
  }

  insertAccount(entity) {
    return this._write(entity);
  }

  insertCurrencies(currencies) {
    return this._writeAll(currencies);
  }
}

class ExchangeRateDao extends DAO {
  static entity({ exchangeRateId, name, rate, lastSyncTime, type }) {
    return {
      exchange_rate_id: exchangeRateId,
      name,
      rate,
      lastSyncTime,
      type,
    };
  }
  constructor(db, name) {
    super(db, name);
  }

  insertExchangeRates(rates) {
    return this._writeAll(rates);
  }

  findAllExchageRates() {
    return this._readAll();
  }
}

class UtxoDao extends DAO {
  constructor(db, name) {
    super(db, name);
  }
}

// *************************************************** //
// if only use on browser, comment out this line
// *************************************************** //
module.exports = IndexedDB;

// *************************************************** //
// If not only using on browser, comment out this line
// *************************************************** //
// window.IndexedDB = IndexedDB;
