const DB_NAME = "tidebitwallet";
const DB_VERSION = "1";

const OBJ_ACCOUNTS = "accounts";
const OBJ_TXS = "transactions";
const OBJ_UTXOS = "utxos";
const OBJ_USER = "user";

class IndexedDB {
  constructor() {}
  db = null;
  _userDao;

  init() {
    return this._createDB();
  }

  _createDB(dbName = DB_NAME, dbVersion = DB_VERSION) {
    const request = indexedDB.open(dbName, dbVersion);

    return new Promise((resolve, reject) => {
      //on upgrade needed
      request.onupgradeneeded = (e) => {
        this.db = e.target.result;

        const accounts = this.db.createObjectStore(OBJ_ACCOUNTS, {
          keyPath: "account_id",
        });
        const txs = this.db.createObjectStore(OBJ_TXS, {
          keyPath: "transaction_id",
        });

        const user = this.db.createObjectStore(OBJ_USER, {
          keyPath: "user_id",
        });

        resolve(this.db);
      };

      request.onsuccess = (e) => {
        this.db = e.target.result;
        console.log("DB OPENED");
        this._userDao = new UserDao(this.db, OBJ_USER);
        resolve(this.db);
      };

      request.onerror = (e) => {
        reject(this.db);
      };
    });
  }

  close() {
    this.db.close();
  }

  get userDao() {
    return this._userDao;
  }

  get accountDao() {
    return {
      findAllAccounts: () => [],
      findAccount: (id) => null,
      insertAccount: (account) => true,
      insertAccounts: (accounts) => true,
    };
  }

  get currencyDao() {
    return {
      insertCurrency: (currency) => true,
      insertCurrencies: (currencies) => true,
      findAllCurrencies: () => [],
      findAllCurrenciesByAccountId: (id) => [],
    };
  }

  get accountCurrencyDao() {
    return {
      findOneByAccountyId: (id) => null,
      findAllCurrencies: () => [],
      insertAccount: () => true,
      insertCurrencies: (currencies) => true,
    };
  }

  get networkDao() {
    return {
      findAllNetworks: () => [],
      insertNetworks: (networks) => true,
    };
  }

  get exchangeRateDao() {
    return {
      insertExchangeRates: (rates) => true,
      findAllExchageRates: () => [],
    };
  }

  get transactionDao() {
    return {
      findAllTransactionsById: (id) => [],
      insertTransaction: (tx) => true,
      updateTransaction: (tx) => true,
      insertTransactions: (txs) => true,
    };
  }

  get utxo() {
    return {
      findAllJoinedUtxosById: (id) => [],
      insertUtxo: (utxo) => true,
      insertUtxos: (utxos) => true,
    };
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
// module.exports = IndexedDB;

window.IndexedDB = IndexedDB;
window.DAO = DAO;
