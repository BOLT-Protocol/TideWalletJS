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
  // eventType: ready, update, notice
  // notifier: { eventName: string, callback: function }
  notifiers = [];

  static Core = TideWalletCore;

  constructor() {
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
      if(user.mnemonic && user.password) {
        this.core = await this.user.createUserWithSeed(user.OAuthID, seed, user.InstallID);
      } else {
        this.core = await this.user.createUser(user.OAuthID, user.InstallID);
      }
    }
  
    initObj.TideWalletCore = this.core;
    this.account = new Account(initObj);
    this.account.setMessenger();
    await this.account.init();
  
    const listener = this.account.messenger.subscribe((v) => {
      this.notice(v, 'update');
    });
    return true;
  }

  on(eventName = '', callback) {
    if(typeof callback !== 'function') return;
    const en = eventName.toLocaleLowerCase();
    let notifier = { callback };
    switch(en) {
      case 'ready':
      case 'update':
      case 'notice':
        notifier.eventName = en;
        break;
    }
    return this.notifiers.push(notifier);
  }

  removeNotifier(notifierId) {
    delete this.notifiers[notifierId];
    return true;
  }

  async overview() {
    const currencies = await this.account.getAllCurrencies();
    const fiat = [];
    const balance = currencies.reduce((rs, curr) => {
      return rs;
    }, 0);

    const dashboard = {
      balance,
      currencies
    };
    return dashboard;
  }

  async getCurrencyDetail({ accountcurrencyId }) {

  }

  async getTransactionDetail() {

  }

  async getReceivingAddress() {

  }

  async getTransactionFee() {

  }

  async prepareTransaction() {

  }

  async sendTransaction() {

  }

  async sync() {

  }

  async backup() {

  }

  async close() {
    // release all resources
    return true;
  }

  notice(data, eventName = '') {
    const ev = eventName.toLocaleLowerCase();
    this.notifiers.forEach((notifier) => {
      if(!notifier) return;
      if(notifier.eventName !== ev) return;
      if(typeof notifier.callback !== 'function') return;
      notifier.callback(data);
    });
  }
}

if (isBrowser()) {
  window.Buffer = require("buffer").Buffer;
  window.TideWallet = TideWallet;

  /** test case */
  window.test = async() => {
    const tw = new TideWallet();
    const api = {
      apiURL: 'https://service.tidewallet.io/api/v1',
      apiKey: 'f2a76e8431b02f263a0e1a0c34a70466',
      apiSecret: '9e37d67450dc906042fde75113ecb78c',
    };
    const user1 = {
      OAuthID: 'test2ejknkjdniednwjq',
      InstallID: '11f6d3e524f367952cb838bf7ef24e0cfb5865d7b8a8fe5c699f748b2fada249',
      mnemonic: 'cry hub inmate cliff sun program public else atom absurd release inherit funny edge assault',
      password: '12345'
    };
    const user2 = {
      OAuthID: 'test2ejknkjdniednwjq',
      InstallID: '11f6d3e524f367952cb838bf7ef24e0cfb5865d7b8a8fe5c699f748b2fada249'
    };
    await tw.init({ user: user2, api });
  }
}

module.exports = TideWallet;
