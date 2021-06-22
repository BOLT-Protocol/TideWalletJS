const emitter=require('events').EventEmitter;
const BigNumber = require('bignumber.js');
const config = require("./constants/config");
const PaperWallet = require("./cores/PaperWallet");
const Account = require("./cores/Account");
const Trader = require("./cores/Trader");
const User = require("./cores/User");
const { isBrowser } = require("./helpers/env");
const DBOperator = require("./database/dbOperator");
const TideWalletCommunicator = require("./cores/TideWalletCommunicator");
const TideWalletCore = require("./cores/TideWalletCore");

class TideWallet {
  constructor() {
    this.em = new emitter();
    this.eventList = {
      ready: 'ready',
      update: 'update',
      exception: 'exception'
    }

    return this;
  }

  async init({ user, api }) {
    const communicator = new TideWalletCommunicator(api);
    const db = new DBOperator();
    await db.init();

    this.user = new User();
    const userExist = await this.user.checkUser();
    if(!userExist) {
      this.user.createUser(user.OAuthID, user.InstallID)
    }

    this.account = new Account();
    await this.account.init();
    return true;
  }

  on(eventName, callback) {
    this.em.on(eventName, (data) => {
      callback(data);
    });
  }
}

/*
const tidewallet = {
  PaperWallet,
  Account,
  Trader,
  User,
  UI,
  DBOperator,
  TideWalletCommunicator,
  TideWalletCore,
};

if (isBrowser()) {
  window.Buffer = require("buffer").Buffer;
  window.TideWallet = TideWallet;
}

console.log(isBrowser());

/// TEST AccountCore 
async function main() {
  const db = new tidewallet.DBOperator();
  await db.init();
  const communicator = new TideWalletCommunicator({ apiURL: config.url, apiKey: config.apiKey, apiSecret: config.apiSecret });
  const initObj = { TideWalletCommunicator: communicator, DBOperator: db };
  const user = new tidewallet.User(initObj);

  const userIdentifier = "test2ejknkjdniednwjq";
  const installId =
    "11f6d3e524f367952cb838bf7ef24e0cfb5865d7b8a8fe5c699f748b2fada249";
  const mnemonic =
    "cry hub inmate cliff sun program public else atom absurd release inherit funny edge assault";
  const password = "12345";
  const exist = await user.checkUser();
  if (!exist) {
    const seed = user.mnemonicToSeed(mnemonic, password);
    await user.createUserWithSeed(userIdentifier, seed, installId);
  }

  const AccountCore = new tidewallet.Account(initObj);
  AccountCore.setMessenger();
  await AccountCore.init();

  const listener = AccountCore.messenger.subscribe((v) => {
    // console.log('On TideWallet Service Event', v);
  });


}

if (isBrowser()) {
  window.test = main;
}

///
*/

/**
 * Test in Browser

const tw = new TideWallet();
const api = {
  apiURL: 'https://service.tidewallet.io',
  apiKey: 'f2a76e8431b02f263a0e1a0c34a70466',
  apiSecret: '9e37d67450dc906042fde75113ecb78c',
};
const user = {
  OAuthID: 'myAppleID',
  InstallID: 'myInstallID'
};
tw.init({ user, api })

 */


if (isBrowser()) {
  window.Buffer = require("buffer").Buffer;
  window.TideWallet = TideWallet;
}

module.exports = TideWallet;
