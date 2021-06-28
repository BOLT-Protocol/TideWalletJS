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
        await this.user.createUserWithSeed(user.OAuthID, seed, user.InstallID);
      } else {
        await this.user.createUser(user.OAuthID, user.InstallID);
      }
    }
  
    this.account = new Account(initObj);
    this.account.setMessenger();
    await this.account.init();

    this.trader = new Trader(initObj);
    this.communicator = communicator; // ++ 確定是否要這樣做
  
    const listener = this.account.messenger.subscribe((v) => {
      this._callback(v, 'update');
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
    const fiat = await this.trader.getFiatList();
    const balance = currencies.reduce((rs, curr) => {
      return rs;
    }, 0);

    const dashboard = {
      balance,
      currencies
    };
    return dashboard;
  }

  /**
   * 
   * @param {object} accountInfo
   * @param {string} accountInfo.assetID
   */
  async getAssetDetail({ assetID }) {
    const asset = await this.account.getCurrencies(assetID);
    const transactions = await this.account.getTransactions(assetID);
    
    return { asset, transactions };
  }

  // ++ 確定是否要這樣做
  async getTransactionDetail({ transactionID }) {
    try {
      const tx = this.communicator.TransactionDetail(transactionID);
      return tx;
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  async getReceivingAddress({ accountID }) {
    const address = await this.account.getReceiveAddress(accountID);

    return address;
  }

  // ++ need help
  async getTransactionFee({ accountID, blockchainID, from, to, amount, data }) {
    const svc = this.account.getService(accountID);
    const fees = svc.getTransactionFee(blockchainID);

    return fees;
  }

  // need help
  async prepareTransaction() {

  }

  async sendTransaction({ accountID, blockchainID, transaction }) {
      const svc = this.account.getService(accountID);
      const res = svc.publishTransaction(blockchainID, transaction);

      return res;
  }

  // ++ 確定是否要這樣做
  async sync() {
    await this.account.sync();
  }

  // need help
  async backup() {

  }

  async close() {
    // release all resources
    this.account.close();
    return true;
  }

  _callback(data, eventName = '') {
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
      apiURL: 'https://staging.tidewallet.io/api/v1',
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
    //test
    console.log('overview:', await tw.overview());
    // console.log('getAssetDetail:', await tw.getAssetDetail({ assetID: "a7255d05-eacf-4278-9139-0cfceb9abed6" }));
    console.log('getReceivingAddress:', await tw.getReceivingAddress({ accountID: "a7255d05-eacf-4278-9139-0cfceb9abed6" }));

  }
}

module.exports = TideWallet;
