const BigNumber = require("bignumber.js");
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

class TideWallet {
  // eventType: ready, update, notice
  // notifier: { eventName: string, callback: function }
  notifiers = [];

  static Core = TideWalletCore;

  constructor() {
    return this;
  }

  async init({ user, api, debugMode = false, networkPublish = true }) {
    const communicator = new TideWalletCommunicator(api);
    const db = new DBOperator();
    await db.init();
    const initObj = { TideWalletCommunicator: communicator, DBOperator: db };

    this.user = new User(initObj);

    const exist = await this.user.checkUser(user.OAuthID);
    if (!exist) {
      if (user.mnemonic && user.password) {
        this.core = await this.user.createUserWithSeed(
          user.OAuthID,
          seed,
          user.InstallID
        );
      } else {
        this.core = await this.user.createUser(user.OAuthID, user.InstallID);
      }
    } else {
      this.core = this.user._TideWalletCore;
    }

    initObj.TideWalletCore = this.core;
    this.account = new Account(initObj);
    this.account.setMessenger();
    await this.account.init({ debugMode, networkPublish });

    this.trader = new Trader(initObj);
    await this.trader.getFiatList();

    const listener = this.account.messenger.subscribe((v) => {
      this.notice(v, "update");
    });
    this.notice({}, "ready");
    return true;
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

  async getFiat() {
    return await this.trader.getSelectedFiat();
  }
  getVersion() {
    return packageInfo.version;
  }

  async overview() {
    const currencies = await this.account.getAllCurrencies();
    const fiat = await this.trader.getSelectedFiat();
    const bnRate = fiat.exchangeRate;
    const balance = currencies.reduce((rs, curr) => {
      const bnBalance = new BigNumber(curr.balance);
      const bnRs = new BigNumber(rs);
      return bnRs
        .plus(
          this.trader.calculateToUSD({
            currencyId: curr.currencyId,
            amount: bnBalance,
          })
        )
        .toFixed();
    }, 0);
    const bnBalance = new BigNumber(balance);
    const balanceFiat = bnBalance.multipliedBy(bnRate).toFixed();

    const dashboard = {
      balance: balanceFiat,
      currencies,
    };
    return dashboard;
  }

  /**
   *
   * @param {string} id
   */
  async getAssetDetail(id) {
    const asset = await this.account.getCurrencies(id);
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

  async verifyAddress(id, address) {
    const result = await this.account.verifyAddress(id, address);
    return result;
  }

  async verifyAmount(id, amount, fee) {
    const result = await this.account.verifyAmount(id, amount, fee);
    return result;
  }

  async getTransactionFee(id, to, amount, data) {
    const result = await this.account.getTransactionFee(id, to, amount, data);
    return result;
  }

  async sendTransaction(id, transaction) {
    const result = await this.account.sendTransaction(id, transaction);
    return result;
  }

  async sync() {
    this.account.sync();
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
      OAuthID: "test2ejknkjdniednwjq",
      InstallID:
        "11f6d3e524f367952cb838bf7ef24e0cfb5865d7b8a8fe5c699f748b2fada249",
      mnemonic:
        "cry hub inmate cliff sun program public else atom absurd release inherit funny edge assault",
      password: "12345",
    };
    const user2 = {
      OAuthID: "test2ejknkjdniednwjq",
      InstallID:
        "11f6d3e524f367952cb838bf7ef24e0cfb5865d7b8a8fe5c699f748b2fada249",
    };
    await tw.init({ user: user2, api, debugMode: false, networkPublish: true });
    //test
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
    // console.log('backup:', await tw.backup());
    // await tw.close();
  };
}

module.exports = TideWallet;
