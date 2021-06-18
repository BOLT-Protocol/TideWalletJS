const PaperWallet = require("./PaperWallet");
const HTTPAgent = require("./../helpers/httpAgent");
const config = require("./../constants/config");
const DBOperator = require("../database/dbOperator");
const Mnemonic = require("../helpers/Mnemonic");

class User {
  constructor() {
    this.id = null;
    this.thirdPartyId = null;
    this.installId = null;
    this.timestamp = null;
    this.isBackup = false;

    this._HTTPAgent = new HTTPAgent();
    this._DBOperator = new DBOperator();
  }

  /**
   * check user
   * @returns {boolean}
   */
  async checkUser() {
    // TODO: find user table
    const user = await this._DBOperator.userDao.findUser();

    // TODO: Remove this log
    console.log("checkUser: ", user);
    this._PaperWallet = new PaperWallet();
    this._PaperWallet.init(this);

    if (user) {
      await this._initUser(user);
      return true;
    }
    return false;
  }

  /**
   * create user
   * @param {String} userIdentifier
   * @param {String} _installId
   * @returns {Boolean} success
   */
  async createUser(userIdentifier, _installId = "") {
    const installId = config.installId || _installId;

    const user = await this._getUser(userIdentifier);
    const userId = user[0];
    const userSecret = user[1];
    const timestamp = Math.floor(new Date() / 1000);
    const { wallet, extendPublicKey: extPK } = await this._PaperWallet.createWallet({
      userIdentifier,
      userId,
      userSecret,
      installId,
      timestamp,
    });

    const success = await this._registerUser({
      extendPublicKey: extPK,
      installId,
      wallet,
      userId,
      userIdentifier,
      timestamp,
    });

    return success;
  }

  /**
   * get user
   * @param {String} userIdentifier
   * @returns {String[]} [userId, userSecret]
   */
  async _getUser(userIdentifier) {
    let userId = "";
    let userSecret = "";

    const _res = await this._HTTPAgent.post(config.url + "/user/id", {
      id: userIdentifier,
    });
    if (_res.success) {
      userId = _res.data["user_id"];
      userSecret = _res.data["user_secret"];

      return [userId, userSecret];
    } else {
      return [];
    }
  }

  /**
   * register user
   * @param {Object} userInfo
   * @param {String} userInfo.extendPublicKey
   * @param {String} userInfo.installId
   * @param {object} userInfo.wallet
   * @param {String} userInfo.userId
   * @param {String} userInfo.userIdentifier
   * @param {Number} userInfo.timestamp
   * @returns {String[]} [userId, userSecret]
   */
  async _registerUser({
    extendPublicKey,
    installId,
    wallet,
    userId,
    userIdentifier,
    timestamp,
  }) {
    const payload = {
      wallet_name: "TideWallet3", // ++ inform backend to update [Emily 04/01/2021]
      extend_public_key: extendPublicKey,
      install_id: installId,
      app_uuid: installId,
    };
    console.log('_registerUser With: ', payload)

    const res = await this._HTTPAgent.post(`${config.url}/user`, payload);

    if (res.success) {
      await this._DBOperator.prefDao.setAuthItem(
        res.data.token,
        res.data.tokenSecret
      );

      const keystore = await PaperWallet.walletToJson(wallet);
      const user = this._DBOperator.userDao.entity({
        user_id: userId,
        keystore,
        third_party_id: userIdentifier,
        install_id: installId,
        timestamp,
        backup_status: false,
      });
      await this._DBOperator.userDao.insertUser(user);
      await this._initUser(user);
    }

    return res.success;
  }

  /**
   * create user with seed
   * @param {String} userIdentifier
   * @param {String} seed
   * @returns {Boolean} success
   */
  async createUserWithSeed(userIdentifier, seed, _installId = "") {
    const installId = config.installId || _installId;
    const user = await this._getUser(userIdentifier);
    const userId = user[0];
    const timestamp = Math.floor(new Date() / 1000);
    
    const { wallet, extendPublicKey: extPK } = await this._PaperWallet.createWalletWithSeed({
      seed,
      userIdentifier,
      userId,
      installId,
      timestamp,
    });

    const success = await this._registerUser({
      extendPublicKey: extPK,
      installId,
      wallet,
      userId,
      userIdentifier,
      timestamp,
    });

    return success;
  }

  /**
   * verify password -
   * @param {String} password
   * @returns {} not
   */
  verifyPassword(password) {
    // return _seasonedPassword(password) == this._passwordHash;
  }

  /**
   * update password - Deprecated
   * @param {String} oldPassword
   * @param {String} newpassword
   * @returns {}
   */
  async updatePassword(oldPassword, newpassword) {
    const user = await this._DBOperator.userDao.findUser();

    const wallet = await this.restorePaperWallet(user.keystore, oldPassword);
  }

  /**
   * valid PaperWallet
   * @param {String} wallet
   * @returns {}
   */
  validPaperWallet(wallet) {
    try {
      let v = wallet;

      if (typeof wallet === "string") v = PaperWallet.jsonToWallet(wallet);

      return v.keyObject.private != null;
    } catch (e) {
      console.warn(e);
    }

    return false;
  }

  /**
   * jsonToWallet
   * @param {String} keystore
   * @param {String} pwd
   * @returns {WalletObject} wallet
   */
  async restorePaperWallet(keystore, pwd) {
    try {
      const w = PaperWallet.jsonToWallet(keystore);
      // valid pwd
      PaperWallet.recoverFromJson(keystore, pwd);

      return w;
    } catch (e) {
      return null;
    }
  }

  /**
   * checkWalletBackup
   * @param {String} oldPassword
   * @param {String} newpassword
   * @returns isBackup
   */
  async checkWalletBackup() {
    const _user = await this._DBOperator.userDao.findUser();
    if (_user != null) {
      return _user.backupStatus;
    }
    return false;
  }

  /**
   * backup wallet
   * @returns {Boolean} isBackup
   */
  async backupWallet() {
    try {
      const _user = await this._DBOperator.userDao.findUser();

      // TODO: updateUser condition
      await this._DBOperator.userDao.updateUser({ backupStatus: true });
      this.isBackup = true;
    } catch (e) {
      console.warn(e);
    }

    return this.isBackup;
  }

  /**
   * init user
   * @param {object} user - db user table
   */
  async _initUser(user) {
    this.id = user.user_id;
    this.thirdPartyId = user.third_party_id;
    this.installId = user.install_id;
    this.timestamp = user.timestamp;
    this.isBackup = user.backup_status;

    const item = await this._DBOperator.prefDao.getAuthItem();
    if (item != null) {
      this._HTTPAgent.setToken(item.token);
    }
  }

  /**
   * init user
   * @param {String} password
   * @returns {}
   */
  _seasonedPassword(password) {
    // const tmp = Cryptor.keccak256round(password, 3);
    // const bytes = Buffer.from(tmp);
    // return String.fromCharCodes(bytes);
    // TODO: _prefManager.getAuthItem and check is auth, or HTTPAgent().setToken(token);
  }

  /**
   * get keystore
   * @param {String} password
   * @returns {String} keystore
   */
  async getKeystore() {
    const user = await this._DBOperator.userDao.findUser();

    return user.keystore;
  }

  /**
   * delete keystore
   * @returns {Boolean}
   */
  async deleteUser() {
    const user = await this._DBOperator.userDao.findUser();
    const item = await this._DBOperator.userDao.deleteUser(user);

    if (item < 0) return false;

    // await this._prefManager.clearAll();
    return true;
  }

  async getPriKey(password, chainIndex, keyIndex, options = {}) {
    const keystore = await this.getKeystore();
    const pk = PaperWallet.recoverFromJson(keystore, password);
    const seed = PaperWallet.magicSeed(pk);
    const privateKey = PaperWallet.getPriKey(Buffer.from(seed, 'hex'), chainIndex, keyIndex, options);
    return privateKey;
  }

  mnemonicToSeed(mnemonic, password) {
    const m = new Mnemonic();
    return m.mnemonicToSeed(mnemonic, password);
  }
}

module.exports = User;
