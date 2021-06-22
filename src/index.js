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
    const initObj = { TideWalletCommunicator: communicator, DBOperator: db };

    this.user = new User(initObj);

    const exist = await this.user.checkUser();
    if (!exist) {
      const seed = this.user.mnemonicToSeed(user.mnemonic, user.password);
      await this.user.createUserWithSeed(user.OAuthID, seed, user.InstallID);
    }
  
    this.account = new Account(initObj);
    this.account.setMessenger();
    await this.account.init();
  
    const listener = this.account.messenger.subscribe((v) => {
      console.log('On TideWallet Service Event', v);
    });
    return true;
  }

  on(eventName, callback) {
    this.em.on(eventName, (data) => {
      callback(data);
    });
  }
}

/**
 * Test in Browser

const tw = new TideWallet();
const api = {
  apiURL: 'https://service.tidewallet.io',
  apiKey: 'f2a76e8431b02f263a0e1a0c34a70466',
  apiSecret: '9e37d67450dc906042fde75113ecb78c',
};
const user = {
  OAuthID: 'test2ejknkjdniednwjq',
  InstallID: '11f6d3e524f367952cb838bf7ef24e0cfb5865d7b8a8fe5c699f748b2fada249',
  mnemonic: 'cry hub inmate cliff sun program public else atom absurd release inherit funny edge assault',
  password: '12345'
};
tw.init({ user, api }).then(() => {
  console.log('TideWallet Ready');
})

 */


if (isBrowser()) {
  window.Buffer = require("buffer").Buffer;
  window.TideWallet = TideWallet;
}

module.exports = TideWallet;
