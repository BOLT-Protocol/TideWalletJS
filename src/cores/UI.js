const emitter=require('events').EventEmitter;
const BigNumber = require('bignumber.js');

const TideWalletCommunicator = require('./TideWalletCommunicator');
const HTTPAgent = require('./../helpers/httpAgent')   // -- temp
const User = require('./User')
const config = require('./../constants/config');
const PaperWallet = require('./PaperWallet');
const DBOperator = require('./../database/dbOperator');


class UI {
  constructor() {
    this.em = new emitter();
    this.eventList = {
      ready: 'ready',
      update: 'update',
      exception: 'exception'
    }

    this.url = null;                    // -- temp
    this._HTTPAgent = new HTTPAgent()   // -- temp

    this._user = null;
    this._communicator = null;

    return this;
  }

  on(eventName, callback) {
    this.em.on(eventName, (data) => {
      callback(data);
    });
  }

  async init({ user, api }) {
    // user = { OAuthID: 'myAppleID', TideWalletID: 'myTideWalletID', InstallID: 'myInstallID' };
    // api = { url: 'https://service.tidewallet.io' };
    if (!user || !api) throw new Error('invalid input');
    this._communicator = new TideWalletCommunicator({ apiURL: api.url, apiKey: api.apiKey, apiSecret: api.apiSecret });

    this.url = api.url;
    
    const db = new DBOperator();
    await db.init();
    this._user = new User();
    const check = await this._user.checkUser();
    if (!check) {
      const res = await this._createUser(user.OAuthID, user.InstallID);
      return res
    }
    return true;
  }

  async getAssets() {
    const res = await this._communicator.AccountList();
    return res;
  }

  async getAssetDetail({ assetID }) {
    const res = await this._communicator.AccountDetail(assetID);
    return res;
  }

  async getTransactionDetail({ transactionID }) {
    const res = await this._communicator.TransactionDetail(transactionID);
    return res;
  }

  async getReceiveAddress({ accountID }) {
    const res = await this._communicator.AccountReceive(accountID)
    return res;
  }

  async getTransactionFee({ blockchainID, from, to, amount, data }) {
    let gasLimit = 1;
    if (
      blockchainID === '8000003C'
      || blockchainID === 'F000003C'
      || blockchainID === '80000CFC'
      || blockchainID === '80001F51'
    ) {
      const body = {
        fromAddress: from,
        toAddress: to,
        value: amount,
        data
      }
      const resGasLimit = await this._communicator.GetGasLimit(blockchainID, body);
      gasLimit = resGasLimit.gasLimit;
    }
    const bnGasLimit = new BigNumber(gasLimit);
    const fees = await this._communicator.GetFee(blockchainID);
    const bnFeeSlow = new BigNumber(fees.slow);
    const bnFeeStand = new BigNumber(fees.standard);
    const bnFeeFast = new BigNumber(fees.fast);

    const res = {
      slow: bnGasLimit.multipliedBy(bnFeeSlow).toFixed(),
      standard: bnGasLimit.multipliedBy(bnFeeStand).toFixed(),
      fast: bnGasLimit.multipliedBy(bnFeeFast).toFixed()
    }
    return res;
  }

  async _createUser(userIdentifier, _installId = '') {
    const installId = config.installId || _installId

    try {
      const success = await this._user.createUser(userIdentifier, installId);
      return success
    } catch (e) {
      return false
    }
  }
}

module.exports = UI;