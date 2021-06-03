const PaperWallet = require("./cores/PaperWallet");
const Account = require("./cores/Account");
const Trader = require("./cores/Trader");
const User = require("./cores/User");

const tidewallet = {
  PaperWallet,
  Account,
  Trader,
  User,
};

const isBrowser = () => {
  try {
    return this === window;
  } catch (e) {
    return false;
  }
};

if (isBrowser()) {
  window.Buffer = require("buffer").Buffer;
  window.tidewallet = tidewallet;
}

console.log(isBrowser());

module.exports = tidewallet;
