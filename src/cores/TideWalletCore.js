const User = require('./User');
const PaperWallet = require('./PaperWallet');
const Signer = require('./Signer');
const DBOperator = require('../database/dbOperator');
const TideWalletCommunicator = require('./TideWalletCommunicator');
const config = require('../constants/config');

class TideWalletCore {
  constructor() {
    this._user = null;
    this._paperWallet = null;
    this._signer = null;
  }

  async initial({ OAuthID, TideWalletID }) {
    const db = new DBOperator();
    await db.init();
    const communicator = new TideWalletCommunicator({ apiURL: config.url, apiKey: config.apiKey, apiSecret: config.apiSecret });
    this._user = new User({ TideWalletCommunicator: communicator, DBOperator: db });
    this._paperWallet = new PaperWallet();
    this._signer = new Signer();

    const check = await this._user.checkUser();
    if (!check) {
      // TODO get install id
      const installId = '11f6d3e524f367952cb838bf7ef24e0cfb5865d7b8a8fe5c699f748b2fada249'; // from unittest
      await this._user.createUser(OAuthID, installId);
    }
    this._signer.init(this._paperWallet);

    return this._user.getKeystore();
  }

  async recovery({ thirdPartyIdentity, TideBitIdentity, paperWallet }) {
    return true;
  }

  async getExtendedPublicKey() {
    return this._paperWallet.getExtendedPublicKey();
  }

  /**
   * 
   * @param {object} param
   * @param {object} param.keyPath
   * @param {number} param.keyPath.chainIndex
   * @param {number} param.keyPath.keyIndex
   * @param {Buffer} param.buffer -  hash data buffer
   * @returns 
   */
  async sign({ keyPath, buffer }) {
    return this._signer.sign(buffer, keyPath.chainIndex, keyPath.keyIndex);
  }

  async signData({ keyPath, jsonData }) {
    return true;
  }

  async signTransaction({ keyPath, coinType, value, data }) {
    return true;
  }
}

module.exports = TideWalletCore;
