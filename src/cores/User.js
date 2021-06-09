const Cryptor = require('./../helpers/Cryptor');
const rlp = require('./../helpers/rlp');
const PaperWallet = require('./PaperWallet');
const HTTPAgent = require('./../helpers/httpAgent');
const config = require('./../constants/config');

class User {  
  constructor() {
    this.id = null;
    this.thirdPartyId = null;
    this.installId = null;
    this.timestamp = null;
    this.isBackup = false;

    // mock
    DBOperator = {
      userDao: { 
        insertUser: () => {},
        updateUser: () => {},
        deleteUser: () => {}
      }
    }

  }

  /**
   * check user
   * @returns {boolean}
   */
  checkUser() {
    // TODO: find user table
    const user = ''
    if (user != null) {
      this._initUser(user);
      return true;
    }
    return false
  }

  /**
   * get nonce
   * @param {String} userIdentifier
   * @returns {String}
   */
  _getNonce(userIdentifier) {
    const cafeca = '0xcafeca';
    let nonce = cafeca;

    const getString = (nonce) => Cryptor
      .keccak256round((Number(userIdentifier) + Number(nonce)).toString(16), 1)
      .slice(0, 3)
      .toLowerCase();

    while (getString(nonce) != 'cfc') {
      nonce =`0x${(Number(nonce)+1).toString(16)}`
    }
    return nonce
  }

  /**
   * get password
   * @param {Object} userInfo
   * @param {String} userInfo.userIdentifier
   * @param {String} userInfo.userId
   * @param {String} userInfo.installId
   * @param {Number} userInfo.timestamp
   * @returns {String} password
   */
  getPassword({ userIdentifier, userId, installId, timestamp }) {
    const pwseed = Cryptor.keccak256round(
      Cryptor.keccak256round(
        Cryptor.keccak256round(userIdentifier || this.thirdPartyId, 1) + 
        Cryptor.keccak256round(userId || this.id, 1)
      ) +
      Cryptor.keccak256round(
        rlp.toBuffer(rlp.toBuffer(`${timestamp}`).slice(3, 6)) + 
        Cryptor.keccak256round(installId || this.installId, 1)
      )
    )
    const password = Cryptor.keccak256round(pwseed);
    return password;
  }

  /**
   * generate Credential Data
   * @param {Object} userInfo
   * @param {String} userInfo.userIdentifier
   * @param {String} userInfo.userId
   * @param {String} userInfo.userSecret
   * @param {String} userInfo.installId
   * @param {Number} userInfo.timestamp
   * @returns {Object} result 
   * @returns {String} result.key
   * @returns {String} result.password
   * @returns {String} result.extend
   */
  _generateCredentialData({ userIdentifier, userId, userSecret, installId, timestamp}) {
    const nonce = this._getNonce(userIdentifier);

    const _main = (Number(userIdentifier) + Number(nonce)).toString(16).slice(0, 4)
    const _extend = Cryptor.keccak256round(nonce, 1).slice(0, 4);
    const seed = Cryptor.keccak256round(
      Cryptor.keccak256round(
        Cryptor.keccak256round(_main, 1) +
        Cryptor.keccak256round(_extend, 1)
      ) +
      Cryptor.keccak256round(
        Cryptor.keccak256round(userId, 1) +
        Cryptor.keccak256round(userSecret, 1)
      )
    );

    const key = Cryptor.keccak256round(seed);
    const password = this.getPassword({ userIdentifier, userId, installId, timestamp });

    return { key, password, extend: `0x${_extend}` };
  }

  /**
   * create user
   * @param {String} userIdentifier
   * @returns {Boolean} success
   */
  async createUser(userIdentifier) {
    // TODO: const installId = await this._prefManager.getInstallationId();
    const installId = ''

    const user = await this._getUser(userIdentifier)
    const userId = user[0];
    const userSecret = user[1];
    const timestamp = Math.floor(new Date() / 1000)
    const credentialData = this._generateCredentialData({ userIdentifier, userId, userSecret, installId, timestamp })

    // TODO: const wallet = await compute(PaperWallet.createWallet, credentialData);
    const wallet = ''
    // TODO: const seed = await compute(PaperWallet.magicSeed, wallet.privateKey.privateKey);
    const seed = ''
    // const extPK = PaperWallet.getExtendedPublicKey(seed);
    const extPK = ''

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
    let userId = ''
    let userSecret = ''

    const _res = await HTTPAgent().post(config.url + '/user/id', {"id": userIdentifier});
    if (_res.success) {
      userId = _res.data['user_id'];
      userSecret = _res.data['user_secret'];

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
  async _registerUser({ extendPublicKey, installId, wallet, userId, userIdentifier, timestamp }) {
    const payload = {
      wallet_name: "TideWallet3", // ++ inform backend to update [Emily 04/01/2021]
      extend_public_key: extendPublicKey,
      install_id: installId,
      app_uuid: installId,
      fcm_token: ''
    };

    const res = await HTTPAgent().post(`${config.url}/user`, payload);

    if (res.success) {
      // TODO:
      // this._prefManager.setAuthItem(AuthItem.fromJson(res.data));

      const keystore = await PaperWallet.walletToJson(wallet);
      // TODO: UserEntity
      const user = {
          // res.data['user_id'], // ++ inform backend to update userId become radom hex[Emily 04/01/2021]
          user_id: userId,
          keystore,
          third_party_id: userIdentifier,
          install_id: installId,
          timestamp,
          backup_status: false
      }
      await DBOperator.userDao.insertUser(user);

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
  async createUserWithSeed(userIdentifier, seed){
    // String installId = await this._prefManager.getInstallationId();
    const user = await _getUser(userIdentifier);
    const userId = user[0];
    const timestamp = Math.floor(new Date() / 1000);

    const password = this.getPassword({ userIdentifier, userId, installId, timestamp });

    const _seed = Buffer.from(seed)
    const privateKey = PaperWallet.getPriKey(_seed, 0, 0);

    const wallet = await  PaperWallet.createWallet(privateKey, password)
    const extPK = PaperWallet.getExtendedPublicKey(seed);

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
   * verify password
   * @param {String} password
   * @returns {} not
   */
  verifyPassword(password) {
    // return _seasonedPassword(password) == this._passwordHash;
  }

  /**
   * update password
   * @param {String} password
   * @returns {}
   */
  updatePassword() {
    const user = await DBOperator.userDao.findUser();

    const wallet = await this.restorePaperWallet(user.keystore, oldPassword);
  }

  /**
   * valid PaperWallet
   * @param {String} wallet
   * @returns {}
   */
  validPaperWallet(wallet) {
    try {
      const v = JSON.parse(wallet);

      return v['crypto'] != null;
    } catch (e) {
      console.warn(e);
    }

    return false;
  }

  /**
   * checkWalletBackup
   * @param {String} oldPassword
   * @param {String} newpassword
   * @returns isBackup
   */
  async checkWalletBackup() {
    const _user = await DBOperator.userDao.findUser();
    if (_user != null) {
      return _user.backupStatus;
    }
    return false;
  }

  /**
   * checkWalletBackup
   * @returns isBackup
   */
  async checkWalletBackup() {
    const _user = await DBOperator.userDao.findUser();
    if (_user != null) {
      return _user.backupStatus;
    }
    return false;
  }

  /**
   * backupWallet
   * @returns isBackup
   */
    async backupWallet() {
      try {
        const _user = await DBOperator.userDao.findUser();
  
        await DBOperator.userDao.updateUser(_user.copyWith({ backupStatus: true }));
        _isBackup = true;
      } catch (e) {
        Log.error(e);
      }
  
      return _isBackup;
    }

  /**
   * init user
   * @param {object} user - db user table
   */
  _initUser(user) {
    this.id = user.user_id
    this.thirdPartyId = user.third_party_id;
    this.installId = user.install_id;
    this.timestamp = user.timestamp;
    this.isBackup = user.backup_status;
    
    // TODO: getAuthItem
    // AuthItem item = await _prefManager.getAuthItem();
    // if (item != null) {
    //   HTTPAgent().setToken(item.token);
    // }
  }

  /**
   * init user
   * @param {String} password
   * @returns {}
   */
  _seasonedPassword(password) {
    const tmp = Cryptor.keccak256round(password, 3);

    const bytes = Buffer.from(tmp);
    return String.fromCharCodes(bytes);
  }

  /**
   * get keystore
   * @param {String} password
   * @returns {String} keystore
   */
  async getKeystore() {
    const user = await DBOperator.userDao.findUser();

    return user.keystore;
  }

  /**
   * delete keystore
   * @returns {Boolean}
   */
  async deleteUser() {
    const user = await DBOperator.userDao.findUser();
    const item = await DBOperator.userDao.deleteUser(user);

    if (item < 0) return false;

    // await this._prefManager.clearAll();
    return true;
  }
}

module.exports = User;
