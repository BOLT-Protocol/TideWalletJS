const DB_NAME = "tidebitwallet";
const DB_VERSION = "1";

const OBJ_ACCOUNTS = "accounts";
const OBJ_TXS = "transactions";
const OBJ_UTXOS = "utxos";

class IndexedDB {
  constructor() {}
  db = null;

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

        resolve(this.db);
      };
      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };
      request.onerror = (e) => {
        reject(this.db);
      };
    });
  }

  close() {}

  get userDao() {
    return {
      findUser: () => null,
      insertUser: () => {
        return true;
      },
      updateUser: () => {
        return true;
      },
      deleteUser: () => {
        return true;
      },
    };
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
    }
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
      insertTransactions: (txs) => true
    }
  }

  get utxo() {
    return {
      findAllJoinedUtxosById: (id) => [],
      insertUtxo: (utxo) => true,
      insertUtxos: (utxos) => true
    }
  }
}

module.exports = IndexedDB;
