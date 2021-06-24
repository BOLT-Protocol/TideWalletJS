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

const OBJ_PREF = "pref";

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
  _prefDao = null;

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
        this._prefDao = new PrefDao(this.db, OBJ_PREF);

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
        keyPath: "accountId",
      });

      const txs = this.db.createObjectStore(OBJ_TX, {
        keyPath: "transactionId",
      });
      let txIndex = txs.createIndex("accountcurrencyId", "accountcurrencyId");

      const currency = this.db.createObjectStore(OBJ_CURRENCY, {
        keyPath: "currencyId",
      });
      let currencyIndex = currency.createIndex("accountId", "accountId");

      const user = this.db.createObjectStore(OBJ_USER, {
        keyPath: "userId",
      });

      const network = this.db.createObjectStore(OBJ_NETWORK, {
        keyPath: "networkId",
      });

      const utxo = this.db.createObjectStore(OBJ_UTXO, {
        keyPath: "utxoId",
      });

      const accountcurrency = this.db.createObjectStore(OBJ_ACCOUNT_CURRENCY, {
        keyPath: "accountcurrencyId",
      });
      let accountcurrencyIndex = accountcurrency.createIndex(
        "accountId",
        "accountId"
      );

      const rate = this.db.createObjectStore(OBJ_EXCHANGE_RATE, {
        keyPath: "exchange_rateId",
      });

      const pref = this.db.createObjectStore(OBJ_PREF, {
        keyPath: "prefId",
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
    return this._accountDao;
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
    return this._utxoDao;
  }

  get prefDao() {
    return this._prefDao;
  }
}

class DAO {
  constructor(db, name) {
    this._db = db;
    this._name = name;
  }

  entity() {}

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

      let request;

      if (!value) {
        request = store.openCursor();
        request.onsuccess = (e) => {
          if (e.target.result) {
            resolve(e.target.result.value);
          } else {
            resolve(null);
          }
        };
      } else {
        request = store.get(value);
        request.onsuccess = (e) => {
          resolve(e.target.result);
        };
      }

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
  entity({ user_id, keystore, third_party_id, install_id, timestamp, backup_status }) {
    return {
      userId: user_id,
      keystore,
      thirdPartyId: third_party_id,
      installId: install_id,
      timestamp,
      backupStatus: backup_status,
    };
  }

  findUser() {
    return this._read();
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
  entity({ account_id, user_id, network_id, account_index }) {
    return {
      accountId: account_id,
      userId: user_id,
      networkId: network_id,
      accountIndex: account_index,
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
  entity({
    currency_id,
    name,
    description,
    symbol,
    decimals,
    // address,
    total_supply,
    contract,
    type,
    icon,
  }) {
    const _type = type === 0 ? "fiat" : type === 1 ? "currency" : "token";

    return {
      currencyId: currency_id,
      name,
      description,
      symbol,
      decimals,
      address: contract,
      totalSupply: total_supply,
      contract,
      type: _type,
      image: icon,
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
    return this._readAll(accountId, "accountId");
  }
}

class NetworkDao extends DAO {
  /**
   * @override
   */
  entity({ network_id, network, coin_type, publish, chain_id }) {
    return {
      networkId: network_id,
      network,
      coinType: coin_type,
      publish,
      chainId: chain_id,
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
  entity({
    accountcurrencyId,
    txid,
    confirmations,
    source_addresses,
    destination_addresses,
    gas_price,
    gas_limit,
    note,
    fee,
    status,
    timestamp,
    direction,
    amount,
  }) {
    return {
      transactionId: accountcurrencyId + txid,
      accountcurrencyId: accountcurrencyId,
      txId: txid,
      confirmation: confirmations,
      sourceAddress: source_addresses,
      destinctionAddress: destination_addresses,
      gasPrice: gas_price,
      gasUsed: gas_limit,
      note,
      fee,
      status,
      timestamp,
      direction,
      amount,
    };
  }

  findAllTransactionsById(acId) {
    return this._readAll(acId, "accountcurrencyId");
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
  entity({
    // accountcurrency_id,
    account_id,
    currency_id,
    balance,
    number_of_used_external_key,
    number_of_used_internal_key,
    last_sync_time,
    token_id,
    account_token_id
  }) {
    return {
      accountcurrencyId:account_token_id ?? account_id,
      accountId: account_id,
      currencyId: currency_id ?? token_id,
      balance,
      numberOfUsedExternalKey: number_of_used_external_key,
      numberOfUsedInternalKey: number_of_used_internal_key,
      lastSyncTime: last_sync_time,
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
    return this._readAll(accountId, "accountId");
  }

  insertAccount(entity) {
    return this._write(entity);
  }

  insertCurrencies(currencies) {
    return this._writeAll(currencies);
  }
}

class ExchangeRateDao extends DAO {
  entity({ currency_id, name, rate, timestamp, type }) {
    return {
      exchangeRateId: currency_id,
      name,
      rate,
      lastSyncTime: timestamp,
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

class PrefDao extends DAO {
  static AUTH_ITEM_KEY = 1;
  static SELECTED_FIAT_KEY = 2;

  entity({ token, tokenSecret }) {
    return {
      prefId: PrefDao.AUTH_ITEM_KEY,
      token,
      tokenSecret,
    };
  }
  constructor(db, name) {
    super(db, name);
  }

  async getAuthItem() {
    const result = await this._read(PrefDao.AUTH_ITEM_KEY);

    return result;
  }

  setAuthItem(token, tokenSecret) {
    return this._write({
      prefId: PrefDao.AUTH_ITEM_KEY,
      token,
      tokenSecret,
    });
  }

  async getSelectedFiat() {
    const result = await this._read(PrefDao.SELECTED_FIAT_KEY);

    return result;
  }

  setSelectedFiat(symbol) {
    return this._write({
      prefId: PrefDao.SELECTED_FIAT_KEY,
      symbol,
    });
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
