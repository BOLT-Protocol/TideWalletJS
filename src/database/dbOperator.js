const IndexedDB = require("./indexdDB");
const { isBrowser } = require("../helpers/env");

class DBOperator {
  static instance;
  db = isBrowser() ? new IndexedDB() : null;

  constructor() {
    if (!DBOperator.instance) {
      DBOperator.instance = this;
    }

    return DBOperator.instance;
  }
}

module.exports = DBOperator;

// if (isBrowser()) {
//   window.DBOperator = DBOperator;
// }
