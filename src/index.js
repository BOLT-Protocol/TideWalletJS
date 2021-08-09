const SafeMath = require("./helpers/SafeMath");
const config = require("./constants/config");
const PaperWallet = require("./cores/PaperWallet");
const Account = require("./cores/Account");
const Trader = require("./cores/Trader");
const User = require("./cores/User");
const { isBrowser } = require("./helpers/env");
const DBOperator = require("./database/dbOperator");
const TideWalletCommunicator = require("./cores/TideWalletCommunicator");
const TideWalletCore = require("./cores/TideWalletCore");
const packageInfo = require("../package.json");
const { mnemonicToSeed } = require("bip39");

class TideWallet {
  // eventType: ready, update, notice
  // notifier: { eventName: string, callback: function }
  notifiers = [];

  static Core = TideWalletCore;

  constructor() {
    return this;
  }

  async resetWallet() {
    await this.account.close();
    await this.user.deleteUser();
  }

  async getFiatList() {
    return await this.trader.getFiatList();
  }

  async changeSelectedFiat(fiat) {
    await this.trader.setSelectedFiat(fiat);
  }

  async _init() {
    this.initObj.TideWalletCore = this.core;
    this.trader = new Trader(this.initObj);
    this._fiats = await this.getFiatList();
    await this.changeSelectedFiat(
      this._fiats.find((fiat) => fiat.name === "USD")
    );
    this.account = new Account({ ...this.initObj, Trader: this.trader });
    this.account.setMessenger();
    await this.account.init({
      debugMode: this.debugMode,
      networkPublish: this.networkPublish,
    });

    this.account.messenger.subscribe((v) => {
      this.notice(v, "update");
    });
    this.notice({ debugMode: this.debugMode }, "ready");
  }

  async getDebugMode() {
    return await this.initObj.DBOperator.prefDao.getDebugMode(this.debugMode);
  }

  async init({
    user,
    api,
    debugMode = config.debug_mode,
    networkPublish = config.network_publish,
  }) {
    this.debugMode = debugMode;
    this.networkPublish = networkPublish;

    const communicator = new TideWalletCommunicator(api);
    const db = new DBOperator();
    await db.init();
    this.initObj = { TideWalletCommunicator: communicator, DBOperator: db };
    await this.initObj.DBOperator.prefDao.setDebugMode(this.debugMode);

    this.user = new User(this.initObj);

    const exist = await this.user.checkUser(user.thirdPartyId);
    if (exist) {
      this.core = this.user._TideWalletCore;
      await this._init();
      return null;
    } else {
      return user;
    }
  }

  async createUser({ user }) {
    if (user.mnemonic && user.password !== undefined) {
      const seed = await mnemonicToSeed(user.mnemonic, user.password);
      this.core = await this.user.createUserWithSeed(
        user.thirdPartyId,
        seed,
        user.installId
      );
    } else {
      this.core = await this.user.createUser(user.thirdPartyId, user.installId);
    }
    await this._init();
  }

  on(eventName = "", callback) {
    if (typeof callback !== "function") return;
    const en = eventName.toLocaleLowerCase();
    let notifier = { callback };
    switch (en) {
      case "ready":
      case "update":
      case "notice":
        notifier.eventName = en;
        break;
    }
    return this.notifiers.push(notifier);
  }

  removeNotifier(notifierId) {
    delete this.notifiers[notifierId];
    return true;
  }

  getVersion() {
    return packageInfo.version;
  }

  async overview() {
    const currencies = this.account.getAllCurrencies;
    const fiat = await this.trader.getSelectedFiat();

    const balance = currencies.reduce((rs, curr) => {
      curr.inFiat = this.trader.calculateToFiat(curr, fiat);
      return SafeMath.plus(rs, curr.inFiat);
    }, 0);
    console.log("overview balance", balance);

    const dashboard = {
      balance,
      currencies,
      fiat,
    };
    return dashboard;
  }

  /**
   *
   * @param {string} id
   */
  async getAssetDetail(id) {
    const asset = this.account.getCurrency(id);
    const transactions = await this.account.getTransactions(id);

    return { asset, transactions };
  }

  async getTransactionDetail(id, transactionId) {
    const txs = await this.account.getTransactions(id);
    const tx = txs.find((r) => r.txid === transactionId);
    return tx;
  }

  async getReceivingAddress(id) {
    const address = await this.account.getReceiveAddress(id);

    return address;
  }

  verifyAddress(id, address) {
    const result = this.account.verifyAddress(id, address);
    return result;
  }

  verifyAmount(id, amount, fee) {
    const result = this.account.verifyAmount(id, amount, fee);
    return result;
  }

  async getTransactionFee({ id, to, amount, data, speed } = {}) {
    const result = await this.account.getTransactionFee({
      id,
      to,
      amount,
      data,
      speed,
    });
    return result;
  }

  async sendTransaction(id, transaction) {
    const result = await this.account.sendTransaction(id, transaction);
    return result;
  }

  async sync() {
    await this.account.sync();
    return true;
  }

  async partialSync(id) {
    await this.account.partialSync(id);
    return true;
  }

  async backup() {
    return this.user.getKeystore();
  }

  async close() {
    // release all resources
    this.account.close();
    for (const index in this.notifiers) {
      this.removeNotifier(index);
    }
    delete this.user;
    delete this.account;
    delete this.trader;
    return true;
  }

  notice(data, eventName = "") {
    const ev = eventName.toLocaleLowerCase();
    this.notifiers.forEach((notifier) => {
      if (!notifier) return;
      if (notifier.eventName !== ev) return;
      if (typeof notifier.callback !== "function") return;
      notifier.callback(data);
    });
  }
}

if (isBrowser()) {
  window.Buffer = require("buffer").Buffer;
  window.TideWallet = TideWallet;

  /** test case */
  window.test = async () => {
    const tw = new TideWallet();
    const api = {
      apiURL: "https://service.tidewallet.io/api/v1",
      apiKey: "f2a76e8431b02f263a0e1a0c34a70466",
      apiSecret: "9e37d67450dc906042fde75113ecb78c",
    };
    const user1 = {
      thirdPartyId: "test2ejknkjdniednwjq",
      installId:
        "11f6d3e524f367952cb838bf7ef24e0cfb5865d7b8a8fe5c699f748b2fada249",
      mnemonic:
        "cry hub inmate cliff sun program public else atom absurd release inherit funny edge assault",
      password: "12345",
    };
    const user2 = {
      thirdPartyId: "test2ejknkjdniednwjq",
      installId:
        "11f6d3e524f367952cb838bf7ef24e0cfb5865d7b8a8fe5c699f748b2fada249",
    };
    const user = await tw.init({
      user: user2,
      api,
      debugMode: false,
      networkPublish: false,
    });
    //test
    if (user) await tw.createUser({ user });
    console.log("overview:", await tw.overview());
    console.log(
      "getTransactionFee:",
      await tw.getTransactionFee({
        id: "a7255d05-eacf-4278-9139-0cfceb9abed6",
      })
    );
    // console.log('getTransactionDetail:', await tw.getTransactionDetail({ id: "a7255d05-eacf-4278-9139-0cfceb9abed6", transactionId:"" }));
    // console.log('getReceivingAddress:', await tw.getReceivingAddress({ id: "a7255d05-eacf-4278-9139-0cfceb9abed6" }));
    // console.log('getWalletConfig:', await tw.getWalletConfig());
    // await tw.sync();
    await tw.partialSync("cb955812-37df-476a-95a8-d69295b28347");
    // console.log('backup:', await tw.backup());
    // await tw.close();
  };
}

module.exports = TideWallet;
