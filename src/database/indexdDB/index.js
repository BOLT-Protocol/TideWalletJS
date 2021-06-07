const DB_NAME = "tidebitwallet";
const DB_VERSION = "1";

const OBJ_ACCOUNTS = "accounts";
const OBJ_TXS = "transactions";
const OBJ_UTXOS = "utxos";

class IndexedDB {
  constructor() {}
  db = null;

  createDB(dbName = DB_NAME, dbVersion = DB_VERSION) {
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

        // console.log(
        //   `upgrade is called database name: ${this.db.name} version : ${this.db.version}`
        // );

        resolve(this.db);
      };
      //on success
      request.onsuccess = (e) => {
        this.db = e.target.result;

        // console.log(
        //   `success is called database name: ${this.db.name} version : ${this.db.version}`
        // );
        resolve(this.db);
      };
      //on error
      request.onerror = (e) => {
        // console.log(`error: ${e.target.error} was found `);
        reject(this.db);
      };
    });
  }
}

module.exports = IndexedDB;
