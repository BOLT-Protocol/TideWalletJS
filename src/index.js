const PaperWallet = require("./cores/PaperWallet");
const Account = require("./cores/Account");
const Trader = require("./cores/Trader");
const User = require("./cores/User");
const { isBrowser } = require("./helpers/env");
const DBOperator = require("./database/dbOperator");
const TideWalletCommunicator = require("./cores/TideWalletCommunicator");

// ++ need update to use config
// const Communicator = new TideWalletCommunicator({ apiURL: config.url, apiKey:config.apiKey, apiSecret: config.apiSecret});
const Communicator = new TideWalletCommunicator({ apiURL: 'https://staging.tidewallet.io/api/v1', apiKey:'123', apiSecret: '123'});

const tidewallet = {
  PaperWallet,
  Account,
  Trader,
  User,
  DBOperator,
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

/// TEST AccountCore messenger
const acc = new tidewallet.Account();
acc.setMessenger();
const i = acc.messenger.subscribe((v) => {
  console.log(v)
})

acc.init();

///

module.exports = tidewallet;
