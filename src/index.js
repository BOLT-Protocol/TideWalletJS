const PaperWallet = require("./cores/PaperWallet");
const Account = require("./cores/Account");
const Trader = require("./cores/Trader");
const User = require("./cores/User");
const { isBrowser } = require("./helpers/env");
const DBOperator = require("./database/dbOperator");

const tidewallet = {
  PaperWallet,
  Account,
  Trader,
  User,
  DBOperator,
};

if (isBrowser()) {
  window.Buffer = require("buffer").Buffer;
  window.tidewallet = tidewallet;
}

console.log(isBrowser());
module.exports = tidewallet;
