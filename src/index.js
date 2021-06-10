const PaperWallet = require("./cores/PaperWallet");
const Account = require("./cores/Account");
const Trader = require("./cores/Trader");
const User = require("./cores/User");
const TideWalletCommunicator = require("./cores/TideWalletCommunicator");

const Communicator = new TideWalletCommunicator({ apiURL: 'https://staging.tidewallet.io/api/v1', apiKey:'123', apiSecret: '123'});

const tidewallet = {
  PaperWallet,
  Account,
  Trader,
  User,
  Communicator,
};

var isBrowser = function () {
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
