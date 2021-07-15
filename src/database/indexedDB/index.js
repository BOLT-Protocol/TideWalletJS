const DB_NAME = "tidebitwallet";
const DB_VERSION = 1;

const OBJ_ACCOUNT = "account";
const OBJ_TX = "transaction";
const OBJ_UTXO = "utxo";
const OBJ_USER = "user";
const OBJ_CURRENCY = "currency";
const OBJ_NETWORK = "network";
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
        keyPath: "id",
      });

      let accountIndex = accounts.createIndex("accountId", "accountId");
      let blockchainIndex = accounts.createIndex(
        "blockchainId",
        "blockchainId"
      );

      const txs = this.db.createObjectStore(OBJ_TX, {
        keyPath: "id",
      });
      let txIndex = txs.createIndex("accountId", "accountId");

      const currency = this.db.createObjectStore(OBJ_CURRENCY, {
        keyPath: "currencyId",
      });
      let currencyIndex = currency.createIndex("blockchainId", "blockchainId");

      const user = this.db.createObjectStore(OBJ_USER, {
        keyPath: "userId",
      });

      const network = this.db.createObjectStore(OBJ_NETWORK, {
        keyPath: "blockchainId",
      });

      const utxo = this.db.createObjectStore(OBJ_UTXO, {
        keyPath: "utxoId",
      });
      let utxoIndex = utxo.createIndex("accountId", "accountId");

      const rate = this.db.createObjectStore(OBJ_EXCHANGE_RATE, {
        keyPath: "exchangeRateId",
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

  get networkDao() {
    return this._networkDao;
  }

  get exchangeRateDao() {
    return this._exchangeRateDao;
  }

  get transactionDao() {
    return this._txDao;
  }

  get utxoDao() {
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
  entity({
    user_id,
    third_party_id,
    install_id,
    timestamp,
    backup_status,
    keystore,
  }) {
    return {
      userId: user_id,
      keystore,
      thirdPartyId: third_party_id,
      installId: install_id,
      timestamp,
      backupStatus: backup_status,
      keystore,
    };
  }

  findUser(userId) {
    return this._read(userId);
  }

  insertUser(userEntity) {
    return this._write(userEntity);
  }

  updateUser(userEntity) {
    return this._write(userEntity);
  }

  deleteUser(userId) {
    return this._delete(userId);
  }
}

class AccountDao extends DAO {
  constructor(db, name) {
    super(db, name);
  }

  /**
   * @override
   */
  entity({
    id, // account_token_id || account_id
    account_id,
    user_id,
    blockchain_id, // || network_id ++,
    currency_id, // currency_id || token_id
    balance, // Join AccountCurrency
    last_sync_time, // Join AccountCurrency
    number_of_used_external_key,
    number_of_used_internal_key,
    purpose, // Join Account
    coin_type_account, // Join Account
    account_index, // Join Account
    curve_type, // Join Account
    network, // Join Blockchain
    coin_type_blockchain, // Join Blockchain
    publish, // Join Blockchain
    chain_id, // Join Blockchain  || network_id
    name, // Join Currency
    description, // Join Currency
    symbol, // Join Currency
    decimals, // Join Currency
    total_supply, // Join Currency
    contract, // Join Currency
    type, // Join Currency
    image, // Join Currency || url
    exchange_rate, // ++ Join Currency || inUSD,
  }) {
    return {
      id,
      userId: user_id,
      accountId: account_id,
      blockchainId: blockchain_id,
      currencyId: currency_id,
      balance,
      lastSyncTime: last_sync_time,
      numberOfUsedExternalKey: number_of_used_external_key,
      numberOfUsedInternalKey: number_of_used_internal_key,
      purpose,
      accountCoinType: coin_type_account,
      accountIndex: account_index,
      curveType: curve_type,
      network,
      blockchainCoinType: coin_type_blockchain,
      publish,
      chainId: chain_id,
      name,
      description,
      symbol,
      decimals,
      totalSupply: total_supply,
      contract,
      type,
      image,
      exchangeRate: exchange_rate,
      // tokens,
    };
  }

  findAllAccounts() {
    return this._readAll();
  }

  findAccount(id) {
    return this._read(id);
  }

  findAllByAccountId(accountId) {
    return this._readAll(accountId, "accountId");
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
    decimals,
    exchange_rate,
    icon,
    name,
    symbol,
    type,
    publish,
    blockchain_id, // ++ for token
    description, // ++ [Did not provided by Backend Service]
    // address,  // ++ [Did not provided by Backend Service]
    total_supply, // ++ [Did not provided by Backend Service]
    contract, // ++ [Did not provided by Backend Service]
  }) {
    const _type = type === 0 ? "fiat" : type === 1 ? "currency" : "token";

    return {
      currencyId: currency_id,
      decimals,
      exchangeRate: exchange_rate,
      image: icon,
      name,
      symbol,
      type: _type,
      publish,
      blockchainId: blockchain_id,
      description,
      address: contract,
      totalSupply: total_supply,
      contract,
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

  findAllCurrenciesByBlockchainId(blockchainId) {
    return this._readAll(blockchainId, "blockchainId");
  }
}

class NetworkDao extends DAO {
  /**
   * @override
   */
  entity({ blockchain_id, network, coin_type, publish, chain_id }) {
    return {
      blockchainId: blockchain_id,
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
   * @param {string} accountId ,this is the id of the account, not the accountId of the account
   */
  entity({
    accountId,
    txid,
    status,
    amount,
    direction,
    confirmations,
    timestamp,
    source_addresses,
    destination_addresses,
    fee,
    gas_price,
    gas_used,
    note,
  }) {
    return {
      id: accountId + txid,
      accountId,
      txid,
      confirmations,
      sourceAddresses: source_addresses,
      destinationAddresses: destination_addresses,
      gasPrice: gas_price,
      gasUsed: gas_used,
      note,
      fee,
      status,
      timestamp,
      direction,
      amount,
    };
  }

  findAllTransactionsById(accountId) {
    return this._readAll(accountId, "accountId");
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
  entity({
    accountId,
    txid,
    vout,
    type,
    amount,
    chain_index,
    key_index,
    script,
    timestamp,
    address,
  }) {
    const DEFAULT_SEQUENCE = 0xffffffff; // temp
    return {
      utxoId: `${txid}-${vout}`,
      accountId,
      txid,
      vout,
      type,
      amount,
      changeIndex: chain_index,
      keyIndex: key_index,
      script,
      timestamp,
      locked: false,
      address,
      // sequence: BitcoinTransaction.DEFAULT_SEQUENCE,
      sequence: DEFAULT_SEQUENCE, // temp
    };
  }

  constructor(db, name) {
    super(db, name);
  }

  async insertUtxos(utxos) {
    return this._writeAll(utxos);
  }

  async findAllUtxos(accountId) {
    return this._readAll(accountId, 'accountId');
  }
}

class PrefDao extends DAO {
  static AUTH_ITEM_KEY = 1;
  static SELECTED_FIAT_KEY = 2;

  entity({ userId, token, tokenSecret }) {
    return {
      prefId: `${PrefDao.AUTH_ITEM_KEY}-${userId}`,
      token,
      tokenSecret,
    };
  }
  constructor(db, name) {
    super(db, name);
  }

  async getAuthItem(userId) {
    const result = await this._read(`${PrefDao.AUTH_ITEM_KEY}-${userId}`);

    return result;
  }

  setAuthItem(userId, token, tokenSecret) {
    return this._write({
      prefId: `${PrefDao.AUTH_ITEM_KEY}-${userId}`,
      token,
      tokenSecret,
    });
  }

  async getSelectedFiat() {
    const result = await this._read(PrefDao.SELECTED_FIAT_KEY);

    return result;
  }

  setSelectedFiat(name) {
    return this._write({
      prefId: PrefDao.SELECTED_FIAT_KEY,
      name,
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
