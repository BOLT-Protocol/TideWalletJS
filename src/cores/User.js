const PaperWallet = require("./PaperWallet");
const TideWalletCore = require("./TideWalletCore");
const config = require("./../constants/config");
const Mnemonic = require("../helpers/Mnemonic");

class User {
  constructor({TideWalletCommunicator, DBOperator}) {
    this.id = null;
    this.thirdPartyId = null;
    this.installId = null;
    this.timestamp = null;
    this.isBackup = false;

    this._communicator = TideWalletCommunicator;
    this._DBOperator = DBOperator;
    this._TideWalletCore = new TideWalletCore();
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
    const { wallet, extendPublicKey: extPK } = await this._TideWalletCore.createWallet({
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

    return this._TideWalletCore;
  }

  /**
   * get user
   * @param {String} userIdentifier
   * @returns {String[]} [userId, userSecret]
   */
  async _getUser(userIdentifier) {
    let userId = "";
    let userSecret = "";

    try {
      const _res = await this._communicator.oathRegister(userIdentifier);
      userId = _res.userId;
      userSecret = _res.userSecret;
    } catch (error) {
      console.log('_getUser:', error)
    }
    return [userId, userSecret];
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

    try {
      const res = await this._communicator.register(installId, installId, extendPublicKey);

      await this._DBOperator.prefDao.setAuthItem(
        res.token,
        res.tokenSecret
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
      return true;
    } catch (error) {
      console.log('_registerUser:', error);
      return false;
    }
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
    
    const { wallet, extendPublicKey: extPK } = await this._TideWalletCore.createWalletWithSeed({
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

    return this._TideWalletCore;
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
    this.id = user.userId;
    this.thirdPartyId = user.thirdPartyId;
    this.installId = user.installId;
    this.timestamp = user.timestamp;
    this.isBackup = user.backupStatus;

    const userInfo = {
      id: user.userId,
      thirdPartyId: user.thirdPartyId,
      installId: user.installId,
      timestamp: user.timestamp,
      keystore: user.keystore
    }
    this._TideWalletCore.setUserInfo(userInfo);

    const item = await this._DBOperator.prefDao.getAuthItem();
    if (item != null) {
      let _token = item.token
      let _tokenSecret = item.tokenSecret
      try {
        await this._communicator.AccessTokenRenew({
            token: _token,
            tokenSecret: _tokenSecret
          })
        await this._communicator.login(_token, _tokenSecret);
      } catch (e) {
        const res = await this._communicator.register(this.installId, this.installId, await this._TideWalletCore.getExtendedPublicKey());

        if (res.token) {
          _token = res.token
          _tokenSecret = res.tokenSecret
          await this._DBOperator.prefDao.setAuthItem(
            _token,
            _tokenSecret
          );
        }
      }

      // verify, if not verify, set token null
      await this._communicator.login(_token, _tokenSecret);
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

  mnemonicToSeed(mnemonic, password) {
    const m = new Mnemonic();
    return m.mnemonicToSeed(mnemonic, password);
  }
}

module.exports = User;
